#!/usr/bin/env python3
"""Wakefield, Massachusetts as exact shapes, not tiles.

  python3 tools/wakefield/vector.py --fetch DIR    download the OpenStreetMap data into DIR (once)
  python3 tools/wakefield/vector.py DIR            build public/wakefield/wakefield.vec.json from DIR
  python3 tools/wakefield/vector.py DIR --pavement  the same, plus real street edges, parking lots and sidewalks
                                                    along Main Street (needs opencv-python-headless scipy shapely, and
                                                    downloads satellite photos into DIR/sat; see pavement.py)
  python3 tools/wakefield/vector.py DIR --markings  the same, plus the painted yellow and white lines on the streets
                                                    and the crosswalks (see markings.py); can be combined with --pavement

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
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
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


POIS = '(' + ''.join(f'nwr["name"]["{k}"];' for k in ('shop', 'amenity', 'office', 'leisure', 'tourism', 'historic', 'craft', 'healthcare', 'building', 'natural', 'landuse', 'place', 'man_made', 'club', 'sport', 'emergency')) + 'nwr["name"]["railway"="station"];);out center tags;'

# what is not worth a label
SKIP_AMENITY = {'bench', 'waste_basket', 'vending_machine', 'post_box', 'bicycle_parking', 'parking_space', 'parking_entrance', 'recycling', 'atm', 'shelter', 'bicycle_repair_station', 'charging_station', 'clock', 'drinking_water', 'grit_bin', 'toilets'}
SKIP_PLACE = {'town', 'city', 'county', 'state', 'country', 'region', 'municipality'}
CIVIC = {'school', 'college', 'university', 'kindergarten', 'hospital', 'clinic', 'townhall', 'library', 'fire_station', 'police', 'courthouse', 'community_centre', 'place_of_worship', 'theatre', 'cinema', 'post_office', 'arts_centre', 'museum', 'social_facility'}
GREEN = {'park', 'garden', 'playground', 'pitch', 'golf_course', 'nature_reserve', 'recreation_ground', 'dog_park', 'common', 'track', 'cemetery', 'forest', 'wood', 'grass', 'meadow', 'farmland', 'wetland', 'scrub', 'village_green', 'orchard'}
POI_SIZE = {1: 15, 2: 20, 3: 26}  # px, by how big a deal the place is


def classify(t):
    """(tier, kind): tier 3 big landmarks, 2 civic places, 1 everything else; kind 0 shop, 1 green, 2 water, 3 civic."""
    a, l, n, lu = t.get('amenity'), t.get('leisure'), t.get('natural'), t.get('landuse')
    if n == 'water':
        return 3, 2
    if l in ('park', 'nature_reserve', 'golf_course', 'recreation_ground', 'common') or lu in ('cemetery', 'forest', 'recreation_ground') or t.get('historic') == 'cemetery' or t.get('place') in ('neighbourhood', 'suburb', 'quarter'):
        return 3, 1
    if l in ('stadium', 'sports_centre') or t.get('shop') == 'mall' or t.get('railway') == 'station' or t.get('historic'):
        return 2, 3
    if a in CIVIC:
        return 2, 3
    if l in GREEN or n in GREEN or lu in GREEN:
        return 1, 1
    return 1, 0


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
    # everything with a name: shops, restaurants, schools, parks, lakes...
    overpass(f'[out:json][timeout:150][bbox:{bb}];{POIS}', f'{d}/pois.json')
    overpass(f'[out:json][timeout:150][bbox:{bb}];(way["amenity"="parking"];way["highway"="footway"]["footway"="sidewalk"];way["highway"="footway"]["footway"="crossing"];);out geom tags;', f'{d}/pavement.json')


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


def poi_labels(d, street_labels, inside):
    """[text, x, y, tier, kind, width] for every named place that fits without covering another label."""
    fonts = {}

    def width(text, tier):
        if tier not in fonts:
            try:
                fonts[tier] = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', POI_SIZE[tier])
            except OSError:
                fonts[tier] = None
        f = fonts[tier]
        return round((f.getlength(text) if f else len(text) * POI_SIZE[tier] * 0.65) + 8)

    cell = 64
    grid = {}
    placed = []

    def free(x0, y0, x1, y1):
        for gx in range(int(x0 // cell), int(x1 // cell) + 1):
            for gy in range(int(y0 // cell), int(y1 // cell) + 1):
                for bx0, by0, bx1, by1 in grid.get((gx, gy), ()):
                    if x0 < bx1 and x1 > bx0 and y0 < by1 and y1 > by0:
                        return False
        return True

    def take(x0, y0, x1, y1):
        for gx in range(int(x0 // cell), int(x1 // cell) + 1):
            for gy in range(int(y0 // cell), int(y1 // cell) + 1):
                grid.setdefault((gx, gy), []).append((x0, y0, x1, y1))

    for text, x, y, a, w in street_labels:  # the street names go first
        ang = a / 1000
        hx = abs(math.cos(ang)) * w / 2 + abs(math.sin(ang)) * (FONT + 8) / 2
        hy = abs(math.sin(ang)) * w / 2 + abs(math.cos(ang)) * (FONT + 8) / 2
        take(x - hx, y - hy, x + hx, y + hy)

    things = []
    for e in load(d, 'pois'):
        t = e['tags']
        name = t.get('name', '').strip()
        c = e.get('center') or ({'lat': e['lat'], 'lon': e['lon']} if 'lat' in e else None)
        if not name or not c or t.get('amenity') in SKIP_AMENITY or t.get('place') in SKIP_PLACE or t.get('natural') in ('peak', 'tree', 'spring'):
            continue
        x, y = px(c)
        if not inside(x, y):
            continue
        tier, kind = classify(t)
        things.append((-tier, name, x, y, tier, kind))
    out, seen = [], set()
    for _, name, x, y, tier, kind in sorted(things):
        w, h = width(name, tier), POI_SIZE[tier] + 8
        if (name, round(x / 160), round(y / 160)) in seen:  # the same place twice (a node and its building)
            continue
        for dx, dy in ((0, 0), (0, -h), (0, h), (0, -2 * h), (0, 2 * h)):
            bx, by = x + dx, y + dy
            if free(bx - w / 2, by - h / 2, bx + w / 2, by + h / 2):
                take(bx - w / 2, by - h / 2, bx + w / 2, by + h / 2)
                out.append([name, round(bx), round(by), tier, kind, w])
                seen.add((name, round(x / 160), round(y / 160)))
                break
    print(f'{len(out)} of {len(things)} named places fit as labels')
    return out


def length(p):
    return sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(p, p[1:]))


def study_area(raw, inside):
    """The roads to measure from the photos: Main Street, and the first half of every road that touches it.
    raw: [(id, name, tags, polyline)]. Returns (pieces [(name, polyline, tags)], refined {id: [(first, last) vertex ranges]})."""
    main = [r for r in raw if r[1] == 'Main Street' and inside(*r[3][len(r[3]) // 2])]
    on_main = {v for r in main for v in r[3]}
    pieces, refined = [], {}
    for wid, name, tags, p in main:
        pieces.append((name, p, tags))
        refined[wid] = [(0, len(p) - 1)]
    for wid, name, tags, p in raw:
        if name == 'Main Street' or not any(v in on_main for v in p) or not inside(*p[len(p) // 2]):
            continue
        cum = [0.0]
        for a, b in zip(p, p[1:]):
            cum.append(cum[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
        half = cum[-1] / 2
        ranges = []
        for j in (k for k, v in enumerate(p) if v in on_main):
            lo, hi = j, j
            while lo > 0 and cum[j] - cum[lo - 1] <= half:
                lo -= 1
            while hi < len(p) - 1 and cum[hi + 1] - cum[j] <= half:
                hi += 1
            if hi > lo:
                ranges.append((lo, hi))
        ranges.sort()
        merged = []
        for lo, hi in ranges:
            if merged and lo <= merged[-1][1]:
                merged[-1] = (merged[-1][0], max(merged[-1][1], hi))
            else:
                merged.append((lo, hi))
        if merged:
            refined[wid] = merged
            pieces += [(name, p[lo:hi + 1], tags) for lo, hi in merged]
    return pieces, refined


def far_parts(p, ranges):
    """The parts of a road polyline outside the ranges that were measured: they stay plain strokes."""
    out, at = [], 0
    for lo, hi in sorted(ranges):
        if lo > at:
            out.append(p[at:lo + 1])
        at = max(at, hi)
    if at < len(p) - 1:
        out.append(p[at:])
    return [q for q in out if len(q) >= 2]


def poly_data(g):
    """A shapely polygon in world px as {'o': ring, 'i': [rings]}, whole pixels, delta-encoded."""
    def ring(r):
        q = []
        for x, y in r.coords:
            pt = (round(x), round(y))
            if not q or q[-1] != pt:
                q.append(pt)
        return delta(q[:-1] if len(q) > 3 and q[0] == q[-1] else q)
    return {'o': ring(g.exterior), 'i': [ring(h) for h in g.interiors if len(h.coords) >= 4]}


def seal_stone(res, roads, buildings):
    """No specks of grass in the stone: gaps up to 5 m between streets, lots, sidewalks and road strokes are filled
    (as lot stone), holes under 60 m2 are filled, and stone reaches the wall of a building within 3 m of it."""
    from shapely.geometry import LineString as LS, Polygon as Pg
    from shapely.ops import unary_union
    streets, lots, walks = [g.buffer(0) for _, _, g in res['streets']], [g.buffer(0) for g in res['lots']], [g.buffer(0) for g in res['walks']]
    pave = unary_union(streets + lots + walks)
    if pave.is_empty:
        return res
    strokes = unary_union([LS(p).buffer(w / 2) for w, p in roads])
    bld = unary_union([Pg(b).buffer(0) for b in buildings if len(b) >= 3])
    stone = unary_union([pave, strokes.intersection(pave.buffer(60))])
    fill = stone.buffer(20).buffer(-20).difference(stone)                         # the narrow gaps
    fill = unary_union([fill, pave.buffer(24).intersection(bld.buffer(24))])     # the rim along walls
    fill = fill.difference(bld).buffer(-0.5).buffer(0.5)
    new_lots = [g for g in (fill.geoms if hasattr(fill, 'geoms') else [fill]) if g.geom_type == 'Polygon' and g.area > 30]
    # holes in the lots and sidewalks (cars, trees, a manhole) are stone too
    def solid(g, hole=60 * 64):
        return Pg(g.exterior, [r for r in g.interiors if Pg(r).area >= hole])
    lots_all = unary_union(lots + new_lots).buffer(0)
    lots_out = [solid(g) for g in (lots_all.geoms if hasattr(lots_all, 'geoms') else [lots_all]) if g.geom_type == 'Polygon']
    return {'streets': [(n, w, solid(g)) for (n, w, _), g in zip(res['streets'], streets) if g.geom_type == 'Polygon'], 'lots': lots_out, 'walks': [solid(g) for g in walks if g.geom_type == 'Polygon']}


def build(d, pavement=False, markings=False):
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

    raw = []
    for e in load(d, 'roads'):
        t = e['tags']
        if t.get('tunnel') in ('yes', 'building_passage') or t.get('service') in LEFT_OUT:
            continue
        p = pts(e['geometry'])
        if len(p) >= 2:
            raw.append((e['id'], t.get('name'), t, p))
    inside_town = lambda x, y: 0 <= x // TILE < gw and 0 <= y // TILE < gh and mask[y // TILE, x // TILE]
    pieces, refined = study_area(raw, inside_town) if pavement else ([], {})
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
        if t.get('name') and not t['highway'].endswith('_link'):
            named.setdefault(t['name'], []).append(p)  # names go along the whole street
        if e['id'] in refined:  # measured from the photos: only what is outside that stays a plain stroke
            rawp = next(r[3] for r in raw if r[0] == e['id'])
            for part in far_parts(rawp, refined[e['id']]):
                roads.append((ROAD_W.get(h, ROAD_DEFAULT), simplify(part)))
            continue
        roads.append((ROAD_W.get(h, ROAD_DEFAULT), p))
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

    street_labels = labels_for(named)
    pave = None
    footprint_extra = []
    if pavement:
        import pavement as pv
        proj = pv.Proj({'lat0': lat0, 'lon0': lon0, 'lat1': lat1, 'lon1': lon1, 'cos': COS}, PPM)
        osm = load(d, 'pavement')
        res = pv.analyze(
            pieces, buildings, proj, f'{d}/sat',
            parking_world=[pts(e['geometry']) for e in osm if e['tags'].get('amenity') == 'parking' and len(e['geometry']) >= 4],
            walks_world=[pts(e['geometry']) for e in osm if e['tags'].get('footway') == 'sidewalk' and len(e['geometry']) >= 2],
        )
        res = seal_stone(res, roads, buildings)
        footprint_extra = [g for _, _, g in res['streets']] + list(res['lots'])
        pave = {'streets': [poly_data(g) for _, _, g in res['streets']], 'lots': [poly_data(g) for g in res['lots']], 'walks': [poly_data(g) for g in res['walks']]}
        print(f'  pavement: {len(pave["streets"])} street polygons, {len(pave["lots"])} parking lots, {len(pave["walks"])} sidewalk strips')
    marks = None
    if markings:
        import markings as mk
        from shapely.geometry import LineString as LS, Point as Pt
        from shapely.ops import unary_union
        from shapely.prepared import prep
        proj_m = __import__('pavement').Proj({'lat0': lat0, 'lon0': lon0, 'lat1': lat1, 'lon1': lon1, 'cos': COS}, PPM)
        osm = load(d, 'pavement')
        classes = ('motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified', 'residential', 'living_street')
        painted = [(wid, p, t) for wid, name, t, p in raw if t['highway'].replace('_link', '') in classes and inside_town(*p[len(p) // 2])]
        found = mk.analyze(painted, proj_m, f'{d}/sat', crossings=[pts(e['geometry']) for e in osm if e['tags'].get('footway') == 'crossing' and len(e['geometry']) >= 2])
        found = mk.tidy(found)
        # paint only counts where the game draws stone: a street shape, a lot, or a road's own width
        shapes = [LS(p).buffer(w / 2 + 4) for w, p in roads] + footprint_extra
        stone = prep(unary_union(shapes))

        def on_stone(line):
            a = np.array(line, float)
            n = max(2, int(length(line) / 8))
            xs, ys = np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a[:, 0]), np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a[:, 1])
            return sum(stone.contains(Pt(x, y)) for x, y in zip(xs, ys)) >= 0.85 * n

        def enc(lines):
            out = []
            for l in lines:
                q = []
                for x, y in l:
                    pt = (round(x), round(y))
                    if not q or q[-1] != pt:
                        q.append(pt)
                if len(q) >= 2 and on_stone(q):
                    out.append(delta(q))
            return out

        marks = {'y': enc(found['yellow']), 'w': enc(found['white'])}
        print(f'  paint kept on the stone: {len(marks["y"])} yellow, {len(marks["w"])} white')
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
        'labels': street_labels,
        **({'marks': marks} if marks else {}),
        **({'pave': pave} if pave else {}),
        'pois': poi_labels(d, street_labels, lambda x, y: 0 <= x // TILE < gw and 0 <= y // TILE < gh and mask[y // TILE, x // TILE]),
        'credit': 'Map data (c) OpenStreetMap contributors, ODbL',
    }
    print(f'{W}x{H} px ({W // TILE}x{H // TILE} tiles, {W / PPM / 1000:.1f} x {H / PPM / 1000:.1f} km): {len(roads)} roads '
          f'({left} driveways, parking aisles and tunnels left out), {len(buildings)} buildings, {len(named)} named streets, {len(water)} lakes, {len(rivers)} rivers, {len(rail)} rails')
    return data


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--fetch':
        fetch(sys.argv[2])
    elif len(sys.argv) in (2, 3, 4):
        os.makedirs('public/wakefield', exist_ok=True)
        out = 'public/wakefield/wakefield.vec.json'
        json.dump(build(sys.argv[1], pavement='--pavement' in sys.argv, markings='--markings' in sys.argv), open(out, 'w'), separators=(',', ':'))
        print('wrote', out, os.path.getsize(out) // 1024, 'KB')
    else:
        sys.exit(__doc__)
