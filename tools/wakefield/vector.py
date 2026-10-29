#!/usr/bin/env python3
"""Wakefield, Massachusetts as exact shapes, not tiles.

  python3 tools/wakefield/vector.py --fetch DIR    download the OpenStreetMap data into DIR (once)
  python3 tools/wakefield/vector.py DIR            build public/wakefield/wakefield.vec.json from DIR

The game draws this file (src/wakefield/WakefieldScene.js): the town line, lakes and rivers, every road
as a line of its own width, the railway, and every building as a polygon. Nothing snaps to a grid,
so a road at 45 degrees is a straight 45 degree line. Scale: 8 px to the metre, so a 32 px tile is
4 m and an ordinary street (7 m) is two tiles wide, like the character expects.

Coordinates are whole pixels from the town's north-west corner, each line or ring stored as
[x0, y0, dx1, dy1, dx2, dy2, ...] (first point, then steps).

Map data (c) OpenStreetMap contributors, ODbL.
"""
import json, math, os, sys, urllib.parse, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BBOX = (42.4716, -71.1007, 42.5311, -71.0348)  # south, west, north, east
RELATION = 1842129  # Wakefield, MA
OVERPASS = 'https://overpass.openstreetmap.fr/api/interpreter'
M_PER_DEG = 111320.0
PPM = 8  # pixels to the metre
TILE = 32
lat0, lon0, lat1, lon1 = BBOX
COS = math.cos(math.radians((lat0 + lat1) / 2))
W = round((lon1 - lon0) * M_PER_DEG * COS * PPM)
H = round((lat1 - lat0) * M_PER_DEG * PPM)

# how wide a road is drawn, in pixels (a tile is 32): two tiles at least, so the character always fits
ROAD_W = {'motorway': 96, 'trunk': 96, 'primary': 80, 'secondary': 80}
ROAD_DEFAULT = 64
LEFT_OUT = ('driveway', 'parking_aisle', 'drive-through')  # not streets
RIVER_W = 80
RAIL_W = 40
FONT = 22  # px, street name labels (a road is 64 px wide)
LABEL_EVERY = 560  # px, about 70 m between names along a street

QUERIES = {
    'roads': 'way["highway"]["highway"!~"footway|path|steps|cycleway|pedestrian|corridor|bridleway|proposed|construction|elevator|raceway|platform"];',
    'buildings': 'way["building"];',
    'water': 'way["natural"="water"];way["waterway"~"river|canal"];',
    'rail': 'way["railway"~"rail|light_rail"];',
}


def overpass(body, path):
    data = urllib.parse.urlencode({'data': body}).encode()
    req = urllib.request.Request(OVERPASS, data, {'User-Agent': 'museum-game/1.0'})
    with urllib.request.urlopen(req, timeout=170) as r, open(path, 'wb') as f:
        f.write(r.read())
    print('got', path)


def fetch(d):
    os.makedirs(d, exist_ok=True)
    bb = ','.join(map(str, BBOX))
    for name, body in QUERIES.items():
        overpass(f'[out:json][timeout:150][bbox:{bb}];({body});out geom tags;', f'{d}/{name}.json')
    overpass(f'[out:json][timeout:100];rel({RELATION});out geom;', f'{d}/boundary.json')
    # the big lakes (Quannapowitt, Crystal, Silver...) are relations: they only come back with their shapes
    # when asked for on their own, not inside the bounding-box query above
    overpass(f'[out:json][timeout:150];rel["natural"="water"]({bb});out geom;', f'{d}/waterrels.json')


def load(d, name):
    return json.load(open(f'{d}/{name}.json'))['elements']


def px(g):
    """OSM {lat, lon} to whole pixels."""
    return (round((g['lon'] - lon0) * M_PER_DEG * COS * PPM), round((lat1 - g['lat']) * M_PER_DEG * PPM))


def pts(geom):
    out = []
    for g in geom:
        p = px(g)
        if not out or out[-1] != p:
            out.append(p)
    return out


def simplify(p, tol=1.5):
    """Douglas-Peucker: drop points that change the shape by less than tol pixels (about 20 cm)."""
    if len(p) < 3:
        return p
    keep = [False] * len(p)
    keep[0] = keep[-1] = True
    stack = [(0, len(p) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = p[a], p[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1
        far, fi = 0, None
        for i in range(a + 1, b):
            d = abs(dy * (p[i][0] - ax) - dx * (p[i][1] - ay)) / L if (dx or dy) else math.hypot(p[i][0] - ax, p[i][1] - ay)
            if d > far:
                far, fi = d, i
        if fi is not None and far > tol:
            keep[fi] = True
            stack += [(a, fi), (fi, b)]
    return [q for q, k in zip(p, keep) if k]


def rings(ways):
    """Join open ways end to end into closed rings."""
    ways = [list(w) for w in ways if len(w) > 1]
    out = []
    while ways:
        ring = ways.pop()
        grew = True
        while grew and ring[0] != ring[-1]:
            grew = False
            for i, w in enumerate(ways):
                if w[0] == ring[-1]:
                    ring += w[1:]
                elif w[-1] == ring[-1]:
                    ring += w[::-1][1:]
                elif w[-1] == ring[0]:
                    ring = w[:-1] + ring
                elif w[0] == ring[0]:
                    ring = w[::-1][:-1] + ring
                else:
                    continue
                ways.pop(i)
                grew = True
                break
        out.append(ring)
    return out


def multipolygon(el):
    outer = [pts(m['geometry']) for m in el.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
    inner = [pts(m['geometry']) for m in el.get('members', []) if m.get('role') == 'inner' and m.get('geometry')]
    return rings(outer), rings(inner)


def delta(p):
    out = [p[0][0], p[0][1]]
    for (ax, ay), (bx, by) in zip(p, p[1:]):
        out += [bx - ax, by - ay]
    return out


def font_width(name):
    try:
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', FONT)
        return f.getlength(name)
    except OSError:
        return len(name) * FONT * 0.65


def along(p):
    """Cumulative distance at each vertex."""
    d = [0.0]
    for a, b in zip(p, p[1:]):
        d.append(d[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return d


def at(p, d, s):
    """The point s px along the line."""
    s = max(0, min(d[-1], s))
    i = 1
    while i < len(d) - 1 and d[i] < s:
        i += 1
    t = (s - d[i - 1]) / ((d[i] - d[i - 1]) or 1)
    return (p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t)


def fits(p, d, s, w, slack):
    """Is the street straight enough over the w px around s for a label to lie along it?"""
    if s - w / 2 < 0 or s + w / 2 > d[-1]:
        return None
    a, b = at(p, d, s - w / 2), at(p, d, s + w / 2)
    L = math.hypot(b[0] - a[0], b[1] - a[1]) or 1
    for k in range(1, 8):
        q = at(p, d, s - w / 2 + w * k / 8)
        if abs((b[1] - a[1]) * (q[0] - a[0]) - (b[0] - a[0]) * (q[1] - a[1])) / L > slack:
            return None
    return (a, b)


def labels_for(named):
    """[text, x, y, angle in milliradians], reading upright, a few along every street."""
    out = []
    for name, ways in sorted(named.items()):
        w = font_width(name) * 1.15 + 12
        mine = []
        for p in ways:
            d = along(p)
            n = max(1, int(d[-1] // LABEL_EVERY))
            for k in range(n):
                base = (k + 0.5) * d[-1] / n
                for off in (0, 0.12, -0.12, 0.25, -0.25, 0.4, -0.4):
                    s = base + off * d[-1] / n
                    ab = fits(p, d, s, w, 6)
                    if ab:
                        mine.append((s, ab, p))
                        break
        if not mine:  # a short or bendy street still gets its name once, at its straightest
            best = None
            for p in ways:
                d = along(p)
                for step in range(0, int(d[-1]), 24):
                    for slack in (10, 16, 24):
                        ab = fits(p, d, step, w, slack)
                        if ab:
                            if not best or slack < best[0]:
                                best = (slack, step, ab)
                            break
            if best:
                mine.append((best[1], best[2], None))
        for _, (a, b), _p in mine:
            ang = math.atan2(b[1] - a[1], b[0] - a[0])
            if abs(ang) > math.pi / 2:
                ang += math.pi if ang < 0 else -math.pi
            out.append([name, round((a[0] + b[0]) / 2), round((a[1] + b[1]) / 2), round(ang * 1000), round(w)])
    return out


def build(d):
    boundary = next(e for e in load(d, 'boundary') if e['type'] == 'relation')
    town_rings, _ = multipolygon(boundary)
    town_rings = [simplify(r, 2) for r in town_rings]

    # which tiles are in the town (a little grown), to leave out everything in the next town over
    gw, gh = W // TILE + 2, H // TILE + 2
    img = Image.new('L', (gw, gh), 0)
    dr = ImageDraw.Draw(img)
    for r in town_rings:
        dr.polygon([(x / TILE, y / TILE) for x, y in r], fill=255)
    mask = np.array(img) > 0
    grown = mask.copy()
    for dy in range(-3, 4):
        for dx in range(-3, 4):
            grown |= np.roll(np.roll(mask, dy, 0), dx, 1)

    def near(p):
        return any(0 <= x // TILE < gw and 0 <= y // TILE < gh and grown[y // TILE, x // TILE] for x, y in p)

    roads, left = [], 0
    named = {}
    for e in load(d, 'roads'):
        t = e['tags']
        if t.get('tunnel') in ('yes', 'building_passage') or t.get('service') in LEFT_OUT:
            left += 1
            continue
        p = simplify(pts(e['geometry']))
        if len(p) < 2 or not near(p):
            continue
        h = t['highway'].replace('_link', '')
        roads.append((ROAD_W.get(h, ROAD_DEFAULT), p))
        if t.get('name') and not t['highway'].endswith('_link'):
            named.setdefault(t['name'], []).append(p)
    roads.sort(key=lambda r: r[0])  # narrow first, so the wide roads are drawn over the junctions

    buildings = []
    for e in load(d, 'buildings'):
        p = simplify(pts(e['geometry']), 1)
        if p and p[0] == p[-1]:
            p = p[:-1]
        if len(p) >= 3 and near(p):
            buildings.append(p)

    water, rivers = [], []
    for e in load(d, 'waterrels') + load(d, 'water'):
        t = e.get('tags', {})
        if e['type'] == 'relation':
            outer, inner = multipolygon(e)
            outer = [simplify(r) for r in outer]
            if outer and near(outer[0]):
                water.append({'o': [delta(r) for r in outer], 'i': [delta(simplify(r)) for r in inner]})
        elif t.get('natural') == 'water':
            p = simplify(pts(e['geometry']))
            if len(p) >= 4 and near(p):
                water.append({'o': [delta(p)], 'i': []})
        elif t.get('waterway') in ('river', 'canal'):
            p = simplify(pts(e['geometry']))
            if len(p) >= 2 and near(p):
                rivers.append(p)

    rail = [p for p in (simplify(pts(e['geometry'])) for e in load(d, 'rail')) if len(p) >= 2 and near(p)]

    # where you start: Main Street, at the point nearest the middle of town
    cx, cy = px({'lat': 42.5064840, 'lon': -71.0728306})
    spawn = min((q for p in named['Main Street'] for q in p), key=lambda q: (q[0] - cx) ** 2 + (q[1] - cy) ** 2)

    data = {
        'format': 'curation-vector', 'version': 1, 'name': 'Wakefield, MA', 'ppm': PPM, 'w': W, 'h': H,
        'spawn': list(spawn),
        'town': [delta(r) for r in town_rings],
        'water': water,
        'rivers': [{'w': RIVER_W, 'p': delta(p)} for p in rivers],
        'rail': [{'w': RAIL_W, 'p': delta(p)} for p in rail],
        'roads': [{'w': w, 'p': delta(p)} for w, p in roads],
        'buildings': [delta(p) for p in buildings],
        'geo': {'lat0': lat0, 'lon0': lon0, 'lat1': lat1, 'lon1': lon1, 'cos': COS},
        'labels': labels_for(named),
        'credit': 'Map data (c) OpenStreetMap contributors, ODbL',
    }
    print(f'{W}x{H} px ({W // TILE}x{H // TILE} tiles, {W / PPM / 1000:.1f} x {H / PPM / 1000:.1f} km): {len(roads)} roads '
          f'({left} driveways, parking aisles and tunnels left out), {len(buildings)} buildings, {len(named)} named streets, {len(water)} lakes, {len(rivers)} rivers, {len(rail)} rails')
    return data


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--fetch':
        fetch(sys.argv[2])
    elif len(sys.argv) == 2:
        os.makedirs('public/wakefield', exist_ok=True)
        out = 'public/wakefield/wakefield.vec.json'
        json.dump(build(sys.argv[1]), open(out, 'w'), separators=(',', ':'))
        print('wrote', out, os.path.getsize(out) // 1024, 'KB')
    else:
        sys.exit(__doc__)
