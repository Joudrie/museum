"""Street edges, parking lots and sidewalks for a study area, from the satellite photos and OpenStreetMap.

Needs: pip install opencv-python-headless scipy shapely   (only to regenerate the data, never in the game)

For the Main Street study area (Main Street, plus the first half of every road that touches it):
  1. find the pavement in the satellite photos (Esri World Imagery, zoom 19, 0.22 m a pixel). Pavement is the
     least colourful thing in the photo (asphalt and concrete are grey, lawn, trees and bare ground are not),
     so a blurred saturation threshold, chosen for each stretch of photo from its own histogram, finds it. Roofs
     are masked out with the known building outlines, and cars, lane paint and shadows are bridged over, so
     the answer is "what would be pavement if there were no cars";
  2. measure the real curb-to-curb width along every road, every metre, on both sides, and draw the street
     as one polygon with straight edges that follow the real edges. The curb is found from a mapped sidewalk
     (mappers traced them from aerial photos, the curb is about a metre inside), else where the pavement ends
     in the photo, held to what the road's lane and width tags say it should be; then the width is smoothed
     along the road so a driveway or a side street does not bulge the edge;
  3. what pavement is left over is a parking lot (or a driveway) if it is wide, and a sidewalk if it is a thin
     strip beside a street. Parking lots OpenStreetMap has mapped are added.
Everything is returned in world pixels (8 to the metre), ready for the game to draw.
"""
import concurrent.futures
import math
import os
import pickle
import urllib.request

import cv2
import numpy as np
from shapely.geometry import LineString, MultiPolygon, Point, Polygon
from shapely.ops import unary_union
from shapely.strtree import STRtree

Z = 19
NT = 2 ** Z
SAT_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
MPP = 0.2194  # metres a photo pixel, at this latitude
PX = 1 / MPP  # photo pixels to the metre

SAT_LO, SAT_HI = 0.22, 0.29  # the pavement/not-pavement saturation threshold is picked from each block's histogram, between these
CLOSE = 13       # photo px: a car is about 8 across and 20 long, so closing this far hides it
HOLE = 900       # photo px: a gap in the pavement smaller than this (about 43 m2) is a car or a manhole
MAX_HALF = int(14 * PX)  # a street is never wider than 28 m from curb to curb
MIN_HALF = int(4.0 * PX)  # no street is narrower than two tiles (8 m) in the game
LOT_MIN = int(60 * PX * PX)  # photo px: a lot is at least about 60 m2
WALK_NEAR = int(5 * PX)      # a sidewalk is within 5 m of a street edge
WALK_MAX = int(3.2 * PX)     # and no wider than 3 m


class Proj:
    """World pixels (8 to the metre, from the town's north-west corner) <-> the photos' pixels."""

    def __init__(self, geo, ppm):
        self.g, self.ppm = geo, ppm
        self.k = 111320 * geo['cos'] * ppm
        self.kl = 111320 * ppm

    def w2m(self, x, y):
        x, y = np.asarray(x, float), np.asarray(y, float)
        lon = self.g['lon0'] + x / self.k
        lat = self.g['lat1'] - y / self.kl
        return (lon + 180) / 360 * NT * 256, (1 - np.arcsinh(np.tan(np.radians(lat))) / np.pi) / 2 * NT * 256

    def m2w(self, mx, my):
        mx, my = np.asarray(mx, float), np.asarray(my, float)
        lon = mx / (NT * 256) * 360 - 180
        lat = np.degrees(np.arctan(np.sinh(np.pi * (1 - 2 * my / (NT * 256)))))
        return (lon - self.g['lon0']) * self.k, (self.g['lat1'] - lat) * self.kl


class Photos:
    """The satellite tiles, cached on disk."""

    def __init__(self, folder):
        self.folder = folder
        os.makedirs(folder, exist_ok=True)
        self.mem = {}
        self.limit = None  # keep at most this many photos in memory

    def path(self, i, j):
        return f'{self.folder}/{i}_{j}.jpg'

    def fetch(self, tiles):
        todo = [t for t in tiles if not os.path.exists(self.path(*t))]

        def one(t):
            req = urllib.request.Request(SAT_URL.format(z=Z, x=t[0], y=t[1]), headers={'User-Agent': 'museum-game/1.0'})
            for _ in range(3):
                try:
                    with urllib.request.urlopen(req, timeout=40) as r:
                        open(self.path(*t), 'wb').write(r.read())
                    return
                except Exception:
                    pass

        print(f'  downloading {len(todo)} of {len(tiles)} photo tiles')
        with concurrent.futures.ThreadPoolExecutor(8) as ex:
            list(ex.map(one, todo))

    def get(self, i, j):
        if (i, j) not in self.mem:
            f = self.path(i, j)
            img = cv2.imread(f) if os.path.exists(f) else None
            self.mem[(i, j)] = None if img is None else cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            if self.limit and len(self.mem) > self.limit:
                self.mem.pop(next(iter(self.mem)))
        return self.mem[(i, j)]


def saturation(rgb):
    """How colourful each pixel is, 0 (grey) to 1, lightly blurred so paint and cars do not break it up."""
    f = rgb.astype(np.float32)
    mx, mn = f.max(2), f.min(2)
    return cv2.GaussianBlur((mx - mn) / (mx + 0.02 * 255), (0, 0), 1.5)


def threshold(sat):
    """Where the grey pavement ends and the colourful lawn and trees begin, from this block's own histogram (Otsu)."""
    hist, edges = np.histogram(sat[sat > 0.02], bins=64, range=(0.02, 0.6))
    hist = hist.astype(float)
    w0, w1 = np.cumsum(hist), hist.sum() - np.cumsum(hist)
    m = np.cumsum(hist * (edges[:-1] + edges[1:]) / 2)
    mu0, mu1 = m / np.maximum(w0, 1), (m[-1] - m) / np.maximum(w1, 1)
    best = float(edges[1:][np.argmax(w0 * w1 * (mu0 - mu1) ** 2)])
    return min(SAT_HI, max(SAT_LO, best))


def pavement_of(rgb, roofs, margin=64):
    """Pavement as it would be with no cars, for the middle of a 768 x 768 block (the rest is context)."""
    sat = saturation(rgb)
    paved = ((sat < threshold(sat)) & (rgb.max(2) > 25) & (roofs == 0)).astype(np.uint8)
    paved = paved[256 - margin:512 + margin, 256 - margin:512 + margin]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (CLOSE, CLOSE))
    paved = cv2.morphologyEx(paved, cv2.MORPH_CLOSE, k)
    paved = cv2.morphologyEx(paved, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # small gaps left in it (a car that was not grey, a crosswalk stripe) are not real gaps
    n, lab, stats, _ = cv2.connectedComponentsWithStats(1 - paved, connectivity=4)
    for c in range(1, n):
        if stats[c, cv2.CC_STAT_AREA] < HOLE:
            paved[lab == c] = 1
    return paved[margin:margin + 256, margin:margin + 256]


class Grid:
    """Shapes (as arrays of photo pixels) found by the tile they touch."""

    def __init__(self, shapes):
        self.shapes = shapes
        self.cells = {}
        for n, a in enumerate(shapes):
            for ti in range(int(a[:, 0].min() // 256), int(a[:, 0].max() // 256) + 1):
                for tj in range(int(a[:, 1].min() // 256), int(a[:, 1].max() // 256) + 1):
                    self.cells.setdefault((ti, tj), []).append(n)

    def around(self, i, j):
        seen = set()
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                for n in self.cells.get((i + di, j + dj), ()):
                    if n not in seen:
                        seen.add(n)
                        yield self.shapes[n]


class Study:
    def __init__(self, proj, photos, buildings_world, walks_world=()):
        self.p, self.photos = proj, photos
        self.masks = {}

        def merc(shapes):
            out = []
            for sh in shapes:
                a = np.array(sh, float).reshape(-1, 2)
                mx, my = proj.w2m(a[:, 0], a[:, 1])
                out.append(np.stack([mx, my], 1))
            return Grid(out)

        self.buildings, self.walks = merc(buildings_world), merc(walks_world)
        self.walk_lines = [LineString(a) for a in self.walks.shapes if len(a) >= 2]
        self.walk_tree = STRtree(self.walk_lines) if self.walk_lines else None

    def block(self, i, j):
        """The photos of the 3 x 3 tiles around (i, j)."""
        block = np.zeros((768, 768, 3), np.uint8)
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                t = self.photos.get(i + di, j + dj)
                if t is not None:
                    block[(dj + 1) * 256:(dj + 2) * 256, (di + 1) * 256:(di + 2) * 256] = t
        return block

    def draw(self, grid, i, j, fn):
        out = np.zeros((768, 768), np.uint8)
        off = np.array([(i - 1) * 256, (j - 1) * 256])
        for a in grid.around(i, j):
            fn(out, np.round(a - off).astype(np.int32))
        return out

    def roof_mask(self, i, j):
        """Roofs in the 3x3 tiles around (i, j), in that block's pixels."""
        out = self.draw(self.buildings, i, j, lambda m, pts: cv2.fillPoly(m, [pts], 1))
        return cv2.dilate(out, np.ones((7, 7), np.uint8))  # a roof's edge and its overhang

    def mask(self, i, j):
        """The pavement in tile (i, j), 256 x 256."""
        if (i, j) not in self.masks:
            self.masks[(i, j)] = pavement_of(self.block(i, j), self.roof_mask(i, j))
        return self.masks[(i, j)]

    def lum_tile(self, i, j):
        if not hasattr(self, 'lum_cache'):
            self.lum_cache = {}
        if (i, j) not in self.lum_cache:
            t = self.photos.get(i, j)
            self.lum_cache[(i, j)] = None if t is None else cv2.GaussianBlur(cv2.cvtColor(t, cv2.COLOR_RGB2LAB)[:, :, 0].astype(np.float32), (0, 0), 1.5)
        return self.lum_cache[(i, j)]

    def lum(self, mx, my):
        """How bright the photo is at each point (0 to 255); 0 where we have no photo."""
        mx, my = np.asarray(mx), np.asarray(my)
        out = np.zeros(mx.shape, np.float32)
        ti, tj = np.floor(mx / 256).astype(int), np.floor(my / 256).astype(int)
        for t in set(zip(ti.ravel().tolist(), tj.ravel().tolist())):
            L = self.lum_tile(*t)
            if L is None:
                continue
            sel = (ti == t[0]) & (tj == t[1])
            out[sel] = L[np.clip((my[sel] - t[1] * 256).astype(int), 0, 255), np.clip((mx[sel] - t[0] * 256).astype(int), 0, 255)]
        return out

    def sidewalk_hit(self, origin, direction, near, far):
        """How far along the ray (photo px) the first mapped sidewalk is, between near and far; None if there is none."""
        if self.walk_tree is None:
            return None
        seg = LineString([origin + direction * near, origin + direction * far])
        best = None
        for idx in self.walk_tree.query(seg):
            hit = seg.intersection(self.walk_lines[int(idx)])
            if hit.is_empty:
                continue
            pts = [hit] if hit.geom_type == 'Point' else list(getattr(hit, 'geoms', []))
            for q in pts:
                if q.geom_type == 'Point':
                    d = float(np.hypot(q.x - origin[0], q.y - origin[1]))
                    best = d if best is None else min(best, d)
        return best

    def sample(self, mx, my):
        """Is each photo point pavement? Points outside the tiles we have count as not."""
        mx, my = np.asarray(mx), np.asarray(my)
        out = np.zeros(mx.shape, bool)
        ti, tj = np.floor(mx / 256).astype(int), np.floor(my / 256).astype(int)
        for t in set(zip(ti.ravel().tolist(), tj.ravel().tolist())):
            if t not in self.tileset:
                continue
            sel = (ti == t[0]) & (tj == t[1])
            xx = np.clip((mx[sel] - t[0] * 256).astype(int), 0, 255)
            yy = np.clip((my[sel] - t[1] * 256).astype(int), 0, 255)
            out[sel] = self.mask(*t)[yy, xx] > 0
        return out


def smooth(a, win):
    """Median over a window, so a driveway or a side street does not bulge the edge."""
    pad = win // 2
    p = np.pad(a, pad, mode='edge')
    return np.array([np.median(p[k:k + win]) for k in range(len(a))])


def expected_width(tags):
    """How wide, in metres, the road's own tags say the street is, curb to curb."""
    try:
        if tags.get('width'):
            return float(str(tags['width']).split()[0])
    except ValueError:
        pass
    try:
        lanes = int(str(tags.get('lanes', '')).split(';')[0])
    except ValueError:
        lanes = 0
    parking = sum(2.2 for k in ('parking:lane:both', 'parking:lane:left', 'parking:lane:right') if tags.get(k, 'no') not in ('no', 'none', '') for _ in range(2 if k.endswith('both') else 1))
    if lanes:
        return lanes * 3.3 + parking
    return {'motorway': 14, 'trunk': 12, 'primary': 12, 'secondary': 10.5, 'tertiary': 9.5, 'unclassified': 8, 'residential': 7.5, 'service': 5, 'track': 4}.get(str(tags.get('highway', '')).replace('_link', ''), 7.5) + parking


def street_polygon(study, line_world, tags):
    """One road as a polygon, from the real curb-to-curb width along it. Returns (polygon in photo px, mean width m, how it was found)."""
    pr = study.p
    xs, ys = np.array([p[0] for p in line_world], float), np.array([p[1] for p in line_world], float)
    mx, my = pr.w2m(xs, ys)
    line = LineString(np.stack([mx, my], 1))
    n = max(2, int(line.length / PX))  # a sample every metre
    pts = np.array([line.interpolate(d).coords[0] for d in np.linspace(0, line.length, n)])
    tang = np.gradient(pts, axis=0)
    tang = tang / (np.hypot(tang[:, 0], tang[:, 1])[:, None] + 1e-9)
    tang = np.stack([np.convolve(tang[:, k], np.ones(5) / 5, mode='same') for k in (0, 1)], 1)
    norm = np.stack([-tang[:, 1], tang[:, 0]], 1) / (np.hypot(tang[:, 0], tang[:, 1])[:, None] + 1e-9)
    exp_half = expected_width(tags) / 2 * PX
    r = np.arange(0, MAX_HALF + 1)
    half, how = {}, {'sidewalk': 0, 'photo': 0}
    for side in (1, -1):
        px_ = pts[:, 0:1] + side * norm[:, 0:1] * r[None, :]
        py_ = pts[:, 1:2] + side * norm[:, 1:2] * r[None, :]
        paved = study.sample(px_, py_)
        d = np.full(len(pts), MAX_HALF, float)
        for k in range(len(pts)):
            row = paved[k]
            start = int(np.argmax(row[:int(3 * PX)])) if row[:int(3 * PX)].any() else 0  # the road line can sit on a shadow or a seam
            run = 0
            for q in range(start, len(row)):
                run = run + 1 if not row[q] else 0
                if run >= 6:  # a gap of 1.3 m: where the asphalt ends
                    d[k] = q - 5
                    break
            # the asphalt in the photo may run into a sidewalk or a lot: no wider than the tags allow, and no narrower than most of them
            d[k] = np.clip(d[k], 0.75 * exp_half, 1.35 * exp_half + 1.5 * PX)
            # a mapped sidewalk beside the street says exactly where the curb is
            hit = study.sidewalk_hit(pts[k], side * norm[k], 3 * PX, 16 * PX)
            if hit is not None:
                d[k] = np.clip(hit - 1.0 * PX, 0.6 * exp_half, 1.6 * exp_half + 2 * PX)
                how['sidewalk'] += 1
            else:
                how['photo'] += 1
        half[side] = np.clip(smooth(d, 15), MIN_HALF, MAX_HALF)
    left = pts + norm * half[1][:, None]
    right = pts - norm * half[-1][:, None]
    poly = Polygon(np.vstack([left, right[::-1]])).buffer(0)
    if poly.geom_type == 'MultiPolygon':
        poly = max(poly.geoms, key=lambda g: g.area)
    return poly.simplify(1.8), float((half[1] + half[-1]).mean() * MPP), how


def rasterize(polys, i, j, grow=0):
    """Shapely polygons (photo px) into tile (i, j)'s 256 x 256 mask."""
    m = np.zeros((256, 256), np.uint8)
    off = np.array([i * 256, j * 256])
    for g in polys:
        for poly in (g.geoms if g.geom_type == 'MultiPolygon' else [g]):
            if poly.is_empty:
                continue
            b = poly.bounds
            if b[2] < i * 256 - 8 or b[0] > (i + 1) * 256 + 8 or b[3] < j * 256 - 8 or b[1] > (j + 1) * 256 + 8:
                continue
            cv2.fillPoly(m, [np.round(np.array(poly.exterior.coords) - off).astype(np.int32)], 1)
            for h in poly.interiors:
                cv2.fillPoly(m, [np.round(np.array(h.coords) - off).astype(np.int32)], 0)
    return cv2.dilate(m, np.ones((2 * grow + 1, 2 * grow + 1), np.uint8)) if grow else m


def shapes_of(mask, i, j):
    """A 0/1 tile mask as shapely polygons (photo px), holes kept."""
    out = []
    cs, hier = cv2.findContours(np.pad(mask, 1), cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE)
    if hier is None:
        return out
    hier = hier[0]
    for n, c in enumerate(cs):
        if hier[n][3] != -1 or len(c) < 3:
            continue
        holes = [np.array(cs[h]).reshape(-1, 2) - 1 + [i * 256, j * 256] for h in range(len(cs)) if hier[h][3] == n and len(cs[h]) >= 3]
        poly = Polygon(np.array(c).reshape(-1, 2) - 1 + [i * 256, j * 256], holes)
        poly = poly.buffer(0)
        if not poly.is_empty:
            out.append(poly)
    return out


def measure(pieces, buildings_world, proj, cache, walks_world=()):
    """The slow part. pieces: [(name, polyline in world px, the road's OpenStreetMap tags)] to draw as streets.
    Returns (streets [(name, width m, poly)], lot pieces, sidewalk pieces), all in photo pixels, and the street union."""
    photos = Photos(cache)
    # the photo tiles near the streets, and the ones around them for context
    # every tile within about 55 m of a street
    near = set()
    for _, line, _tags in pieces:
        a = np.array(line, float)
        mx, my = proj.w2m(a[:, 0], a[:, 1])
        for k in range(len(mx) - 1):
            steps = max(1, int(math.hypot(mx[k + 1] - mx[k], my[k + 1] - my[k]) / 40))
            for s in range(steps + 1):
                x, y = mx[k] + (mx[k + 1] - mx[k]) * s / steps, my[k] + (my[k + 1] - my[k]) * s / steps
                for di in (-1, 0, 1):
                    for dj in (-1, 0, 1):
                        cx, cy = x + di * 190, y + dj * 190
                        near.add((int(cx // 256), int(cy // 256)))
    context = {(i + di, j + dj) for i, j in near for di in (-1, 0, 1) for dj in (-1, 0, 1)}
    photos.fetch(sorted(context))
    study = Study(proj, photos, buildings_world, walks_world)
    global LAST
    LAST = study
    study.tileset = {t for t in near if photos.get(*t) is not None}
    print(f'  {len(study.tileset)} tiles of photos to read')

    streets, found = [], {'sidewalk': 0, 'photo': 0}
    for name, line, tags in pieces:
        poly, width, how = street_polygon(study, line, tags)
        for k in found:
            found[k] += how[k]
        if poly.area > 0:
            streets.append((name, width, poly))
    total = sum(found.values()) or 1
    print(f'  street edges: {found["sidewalk"] * 100 // total}% from a mapped sidewalk, the rest from the photo and the road tags')
    road_union = unary_union([s[2] for s in streets])

    # What pavement is left once the streets are drawn: wide areas are parking lots and driveways, thin strips
    # right beside a street are sidewalks (and a thin strip anywhere else is a path, which we leave alone).
    lots, walks = [], []
    lot_opener = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (int(4.7 * PX), int(4.7 * PX)))
    zone = int(3.6 * PX)
    for t in sorted(study.tileset):
        big = np.zeros((768, 768), np.uint8)
        near_street = np.zeros((768, 768), np.uint8)
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                nt = (t[0] + di, t[1] + dj)
                if nt not in study.tileset:
                    continue
                sl = (slice((dj + 1) * 256, (dj + 2) * 256), slice((di + 1) * 256, (di + 2) * 256))
                street = rasterize([road_union], *nt, grow=2)
                big[sl] = (study.mask(*nt) > 0) & (street == 0)
                near_street[sl] = rasterize([road_union], *nt, grow=zone)
        if not big[256:512, 256:512].any():
            continue
        wide = cv2.morphologyEx(big, cv2.MORPH_OPEN, lot_opener)
        thin = (big & (1 - wide) & near_street).astype(np.uint8)
        thin = cv2.morphologyEx(thin, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        centre = (slice(256, 512), slice(256, 512))
        lots += [g for g in shapes_of(wide[centre], *t) if g.area >= 150]
        walks += [g for g in shapes_of(thin[centre], *t) if g.area >= 40]
    return streets, lots, walks, road_union


def finish(raw, proj, parking_world=()):
    """The quick part: join the pieces, close the cracks, and hand back polygons in world px."""
    streets, lots, walks, road_union = raw

    def parts(g):
        polys = [h for h in (g.geoms if g.geom_type in ('MultiPolygon', 'GeometryCollection') else [g]) if h.geom_type == 'Polygon' and not h.is_empty]
        # a hole smaller than about 19 m2 is a car or a manhole, not a gap
        return [Polygon(h.exterior, [r for r in h.interiors if Polygon(r).area >= 400]) for h in polys]

    def close(shapes):
        """Join pieces (the tile seams leave a pixel between them) and bridge any crack to the street beside them."""
        if not shapes:
            return Polygon()
        u = unary_union(shapes).buffer(3.2).buffer(-2.2)
        return unary_union([u, u.buffer(4).intersection(road_union.buffer(4))]).buffer(0)

    # lots OpenStreetMap has mapped, near the streets, join the ones found in the photo
    if len(parking_world):
        mapped = []
        for sh in parking_world:
            a = np.array(sh, float).reshape(-1, 2)
            if len(a) >= 4:
                mx, my = proj.w2m(a[:, 0], a[:, 1])
                g = Polygon(np.stack([mx, my], 1)).buffer(0)
                if not g.is_empty and g.distance(road_union) < 40 * PX:
                    mapped.append(g)
        lots += mapped
    lots = [g for g in parts(close(lots)) if g.area >= LOT_MIN]
    walks = [g for g in parts(close(walks)) if g.area >= 40]
    # a sidewalk is not also a lot
    if lots and walks:
        lots_u = unary_union(lots)
        walks = [h for g in walks for h in parts(g.difference(lots_u)) if h.area >= 40]

    def to_world(poly):
        def ring(r):
            a = np.array(r.coords)
            x, y = proj.m2w(a[:, 0], a[:, 1])
            return list(zip(x.tolist(), y.tolist()))
        return Polygon(ring(poly.exterior), [ring(h) for h in poly.interiors])

    return {
        'streets': [(n, w, to_world(p)) for n, w, p in streets],
        'lots': [to_world(p.simplify(2)) for p in lots],
        'walks': [to_world(p.simplify(1.5)) for p in walks],
    }


def analyze(pieces, buildings_world, proj, cache, parking_world=(), walks_world=()):
    """pieces: [(name, polyline in world px, the road's OpenStreetMap tags)] to draw as streets. Returns polygons in world px:
    {'streets': [(name, mean width m, poly)], 'lots': [poly], 'walks': [poly]}.
    The slow measuring is kept in cache/measured.pkl; set WAKEFIELD_REMEASURE=1 to do it again."""
    saved = f'{cache}/measured.pkl'
    if os.path.exists(saved) and not os.environ.get('WAKEFIELD_REMEASURE'):
        print('  using the measurements saved from last time (WAKEFIELD_REMEASURE=1 to measure again)')
        raw = pickle.load(open(saved, 'rb'))
    else:
        raw = measure(pieces, buildings_world, proj, cache, walks_world)
        pickle.dump(raw, open(saved, 'wb'))
    return finish(raw, proj, parking_world)
