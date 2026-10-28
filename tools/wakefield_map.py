#!/usr/bin/env python3
"""Build Wakefield, Massachusetts as a builder map from OpenStreetMap data.

  python3 tools/wakefield_map.py --fetch DIR    download the OSM data into DIR (once)
  python3 tools/wakefield_map.py DIR            build from DIR

Writes public/maps/wakefield-detail.json (a curation-map v2 island) and
public/maps/wakefield-detail-overlay.png (a labelled street map that lines up with it
exactly, for the builder's and the game's "map overlay" button).

Scale: one tile is 12 m (METERS below), so the map is about 450 x 550 tiles.
Every road is in, even the small service lanes, and none is narrower than two
tiles, so the character can always walk it (primary and secondary roads are
three wide, the interstate four). A tile is brick where buildings cover most
of it. The ground tiles are stored run-length packed (src/mapformat.js).

Map data (c) OpenStreetMap contributors, ODbL.
"""
import json, math, os, sys, urllib.parse, urllib.request
import numpy as np
from PIL import Image, ImageDraw, ImageFont

BBOX = (42.4716, -71.1007, 42.5311, -71.0348)  # south, west, north, east: Wakefield
RELATION = 1842129
OVERPASS = 'https://overpass.openstreetmap.fr/api/interpreter'
M_PER_DEG = 111320.0
METERS = 12.0
S = 4          # supersampling for polygon coverage
PX = 6         # overlay pixels per tile (the game's texture limit is 4096 px)

lat0, lon0, lat1, lon1 = BBOX
COS = math.cos(math.radians((lat0 + lat1) / 2))
W = math.ceil((lon1 - lon0) * M_PER_DEG * COS / METERS)
H = math.ceil((lat1 - lat0) * M_PER_DEG / METERS)


def to_cell(lat, lon):
    return ((lon - lon0) * M_PER_DEG * COS / METERS, (lat1 - lat) * M_PER_DEG / METERS)


# ---------- download ----------
QUERIES = {
    'roads': 'way["highway"]["highway"!~"footway|path|steps|cycleway|pedestrian|corridor|bridleway|proposed|construction|elevator|raceway|platform"];',
    'buildings': 'way["building"];',
    'water': 'way["natural"="water"];rel["natural"="water"];way["waterway"~"river|stream|canal"];way["natural"="wetland"];',
    'rail': 'way["railway"~"rail|light_rail"];',
    'parks': 'way["leisure"~"park|pitch|golf_course|recreation_ground|playground"];way["landuse"~"cemetery|recreation_ground"];',
}
PLACES = '(nwr["name"]["amenity"~"school|college|library|townhall|hospital|police|fire_station"];nwr["name"]["leisure"~"park|stadium|golf_course|sports_centre|playground"];nwr["name"]["natural"="water"];nwr["name"]["railway"="station"];nwr["name"]["shop"="mall"];nwr["name"]["tourism"~"museum|attraction"];);out center tags;'


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
    overpass(f'[out:json][timeout:150][bbox:{bb}];{PLACES}', f'{d}/places.json')


# ---------- geometry helpers ----------
def load(d, name):
    return json.load(open(f'{d}/{name}.json'))['elements']


def pts(geom):
    return [to_cell(g['lat'], g['lon']) for g in geom]


def rings(ways):
    """Join open ways end to end into closed rings (for boundaries and multipolygons)."""
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


def canvas(scale):
    return Image.new('L', (W * scale + 1, H * scale + 1), 0)


def fill(draw, poly, scale, v):
    if len(poly) >= 3:
        draw.polygon([(x * scale, y * scale) for x, y in poly], fill=v)


def multipolygon(el):
    outer = [pts(m['geometry']) for m in el.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
    inner = [pts(m['geometry']) for m in el.get('members', []) if m.get('role') == 'inner' and m.get('geometry')]
    return rings(outer), rings(inner)


def build(d):
    boundary = next(e for e in load(d, 'boundary') if e['type'] == 'relation')
    town_rings, _ = multipolygon(boundary)
    img = canvas(S)
    dr = ImageDraw.Draw(img)
    for r in town_rings:
        fill(dr, r, S, 255)
    town = np.array(img) > 127  # inside Wakefield, S px per tile

    # water: lakes and ponds, plus the rivers drawn two tiles wide
    img = canvas(S)
    dr = ImageDraw.Draw(img)
    wetland = canvas(S)
    wd = ImageDraw.Draw(wetland)
    for e in load(d, 'water'):
        t = e.get('tags', {})
        if e['type'] == 'relation':
            outer, inner = multipolygon(e)
            for r in outer:
                fill(dr, r, S, 255)
            for r in inner:
                fill(dr, r, S, 0)
        elif t.get('natural') == 'water':
            fill(dr, pts(e['geometry']), S, 255)
        elif t.get('natural') == 'wetland':
            fill(wd, pts(e['geometry']), S, 255)
        elif t.get('waterway') in ('river', 'canal'):
            dr.line([(x * S, y * S) for x, y in pts(e['geometry'])], fill=255, width=2 * S)
    water = np.array(img) > 127
    wet = np.array(wetland) > 127

    # terrain corners: 0 sea outside the town line, 2 grass inside, 3 pond
    corners = np.zeros((H + 1, W + 1), dtype=np.uint8)
    ys, xs = np.mgrid[0:H + 1, 0:W + 1]
    py = np.minimum(ys * S, town.shape[0] - 1)
    px = np.minimum(xs * S, town.shape[1] - 1)
    inside = town[py, px]
    corners[inside] = 2
    corners[inside & water[py, px]] = 3

    cy, cx = np.mgrid[0:H, 0:W]
    centre_in = town[cy * S + S // 2, cx * S + S // 2]

    # roads: walk each way in small steps and mark the tiles it crosses
    road = np.zeros((H, W), dtype=np.uint8)  # 1 stone, 2 dirt
    names = {}

    # how many tiles across a road is drawn (never under two)
    WIDTH = {'motorway': 4, 'motorway_link': 3, 'trunk': 4, 'trunk_link': 3, 'primary': 3, 'primary_link': 2, 'secondary': 3, 'secondary_link': 2}

    def mark(x, y, v, k):
        # a k x k block of tiles centred on the point, so the road is k wide in every direction
        x0, y0 = math.floor(x - k / 2 + 0.5), math.floor(y - k / 2 + 0.5)
        for iy in range(y0, y0 + k):
            for ix in range(x0, x0 + k):
                if 0 <= ix < W and 0 <= iy < H and (road[iy, ix] == 0 or v < road[iy, ix]):
                    road[iy, ix] = v

    skipped = 0
    for e in load(d, 'roads'):
        t = e['tags']
        if t.get('tunnel') in ('yes', 'building_passage') or t.get('service') in ('driveway', 'parking_aisle', 'drive-through'):
            skipped += 1
            continue
        p = pts(e['geometry'])
        dirt = t['highway'] == 'track' or t.get('surface') in ('unpaved', 'ground', 'dirt', 'gravel', 'compacted', 'grass', 'sand')
        k = WIDTH.get(t['highway'], 2)
        v = 2 if dirt else 1
        for (ax, ay), (bx, by) in zip(p, p[1:]):
            n = max(1, int(math.hypot(bx - ax, by - ay) * 4))
            for i in range(n + 1):
                mark(ax + (bx - ax) * i / n, ay + (by - ay) * i / n, v, k)
        if t.get('name'):
            names.setdefault(t['name'], []).append((p, t['highway']))
    print(f'{len(load(d, "roads")) - skipped} road ways in, {skipped} driveways, parking aisles and tunnels left out')
    for e in load(d, 'rail'):
        p = pts(e['geometry'])
        for (ax, ay), (bx, by) in zip(p, p[1:]):
            n = max(1, int(math.hypot(bx - ax, by - ay) * 4))
            for i in range(n + 1):
                x, y = ax + (bx - ax) * i / n, ay + (by - ay) * i / n
                for iy in (int(y), int(y) + 1):
                    for ix in (int(x), int(x) + 1):
                        if 0 <= ix < W and 0 <= iy < H and road[iy, ix] == 0:
                            road[iy, ix] = 3  # rail bed: rock, two wide like the roads
    road[~centre_in] = 0

    # buildings: a tile is brick when buildings cover enough of it
    img = canvas(S)
    dr = ImageDraw.Draw(img)
    for e in load(d, 'buildings'):
        fill(dr, pts(e['geometry']), S, 255)
    cover = (np.array(img)[: H * S, : W * S] > 127).reshape(H, S, W, S).mean(axis=(1, 3))
    brick = (cover >= 0.35) & centre_in & (road == 0)

    ref = {1: 't:cobble', 2: 't:dirt_1', 3: 't:rock_1'}
    legend = ['t:cobble', 't:dirt_1', 't:rock_1', 't:brick']
    cell = np.where(road > 0, road - 1, np.where(brick, 3, -1))
    rows = []
    for y in range(H):
        s_, x = '', 0
        while x < W:
            v, n = cell[y, x], 1
            while x + n < W and cell[y, x + n] == v:
                n += 1
            s_ += ('.' if v < 0 else 'abcd'[v]) + (str(n) if n > 1 else '')
            x += n
        rows.append(s_)
    data = {
        'format': 'curation-map', 'version': 2, 'tile': 32, 'name': 'Wakefield, MA', 'kind': 'island', 'w': W, 'h': H,
        'corners': [''.join(map(str, row)) for row in corners],
        'tiles': {}, 'tileRows': {'legend': legend, 'rows': rows}, 'objects': [],
        'overlay': {'src': './maps/wakefield-detail-overlay.png', 'meters': round(METERS, 2), 'credit': 'Map data © OpenStreetMap contributors'},
    }
    print(f'{W}x{H} tiles at {METERS:.1f} m: {int((road == 1).sum())} stone, {int((road == 2).sum())} dirt, {int((road == 3).sum())} rail, {int(brick.sum())} brick, {int((corners == 3).sum())} pond corners')
    overlay(d, town, water, wet, names)
    return data


# ---------- the overlay picture ----------
def font(n):
    for p in ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if os.path.exists(p):
            return ImageFont.truetype(p, n)
    return ImageFont.load_default()


def label(im, text, cx, cy, angle, size, fg, halo):
    f = font(size)
    box = f.getbbox(text)
    tw, th = box[2] - box[0] + 8, box[3] - box[1] + 8
    t = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    td = ImageDraw.Draw(t)
    for ox in (-1, 0, 1):
        for oy in (-1, 0, 1):
            td.text((4 - box[0] + ox, 4 - box[1] + oy), text, font=f, fill=halo)
    td.text((4 - box[0], 4 - box[1]), text, font=f, fill=fg)
    t = t.rotate(angle, expand=True, resample=Image.BICUBIC)
    im.alpha_composite(t, (int(cx - t.width / 2), int(cy - t.height / 2)))


def overlay(d, town, water, wet, names):
    k = PX
    im = Image.new('RGBA', (W * k, H * k), (0, 0, 0, 0))

    def layer(mask, colour):
        m = Image.fromarray((mask[: H * S, : W * S] * 255).astype(np.uint8)).resize((W * k, H * k), Image.BILINEAR)
        im.paste(Image.new('RGBA', im.size, colour), (0, 0), m)

    layer(town, (238, 232, 214, 255))
    layer(wet & town, (200, 220, 190, 255))
    pk = canvas(S)
    pd = ImageDraw.Draw(pk)
    for e in load(d, 'parks'):
        fill(pd, pts(e['geometry']), S, 255)
    layer(np.array(pk) > 127, (190, 222, 160, 255))
    layer(water, (140, 190, 230, 255))
    dr = ImageDraw.Draw(im)
    for e in load(d, 'rail'):
        dr.line([(x * k, y * k) for x, y in pts(e['geometry'])], fill=(110, 110, 110, 255), width=3)
    bl = canvas(k)
    bd = ImageDraw.Draw(bl)
    for e in load(d, 'buildings'):
        fill(bd, pts(e['geometry']), k, 255)
    im.paste(Image.new('RGBA', im.size, (190, 150, 130, 255)), (0, 0), bl.crop((0, 0, W * k, H * k)))
    widths = {'motorway': 8, 'motorway_link': 4, 'primary': 6, 'secondary': 5, 'tertiary': 4, 'primary_link': 3, 'secondary_link': 3, 'residential': 3}
    roads = load(d, 'roads')
    for casing in (True, False):
        for e in sorted(roads, key=lambda e: widths.get(e['tags']['highway'], 2)):
            if e['tags'].get('tunnel') in ('yes', 'building_passage'):
                continue
            w = widths.get(e['tags']['highway'], 2)
            col = (255, 255, 255, 255) if not casing else (120, 110, 100, 255)
            if not casing and e['tags']['highway'].startswith(('motorway', 'primary')):
                col = (250, 214, 120, 255)
            dr.line([(x * k, y * k) for x, y in pts(e['geometry'])], fill=col, width=w + (2 if casing else 0), joint='curve')
    # the town line
    boundary = next(e for e in load(d, 'boundary') if e['type'] == 'relation')
    for r in multipolygon(boundary)[0]:
        dr.line([(x * k, y * k) for x, y in r], fill=(200, 60, 60, 255), width=3)
    # street names along the longer streets, a screenful apart
    placed = []
    for name, parts in sorted(names.items(), key=lambda kv: -sum(len(p) for p, _ in kv[1])):
        parts = sorted(parts, key=lambda pt: -len(pt[0]))
        for p, hw in parts:
            for i in range(len(p) - 1):
                (ax, ay), (bx, by) = p[i], p[i + 1]
                seg = math.hypot(bx - ax, by - ay)
                mx, my = (ax + bx) / 2, (ay + by) / 2
                if seg < len(name) * 0.9 or not (0 <= mx < W and 0 <= my < H) or not town[int(my) * S, int(mx) * S]:
                    continue
                if any(n == name and math.hypot(mx - x, my - y) < 45 for n, x, y in placed) or any(math.hypot(mx - x, my - y) < 5 for n, x, y in placed):
                    continue
                placed.append((name, mx, my))
                ang = -math.degrees(math.atan2(by - ay, bx - ax))
                ang = ang + 180 if ang > 90 else ang - 180 if ang < -90 else ang
                label(im, name, mx * k, my * k, ang, 8, (40, 40, 40, 255), (255, 255, 255, 230))
    # places: schools, parks, lakes and so on
    seen = set()
    spots = []
    for e in sorted(load(d, 'places'), key=lambda e: (e['tags'].get('natural') != 'water', 'school' not in e['tags'].get('amenity', ''))):
        t = e['tags']
        if t.get('amenity') in ('place_of_worship', 'community_centre', 'theatre', 'post_office') or t.get('shop'):
            continue
        c = e.get('center') or ({'lat': e['lat'], 'lon': e['lon']} if 'lat' in e else None)
        if not c or t['name'] in seen:
            continue
        x, y = to_cell(c['lat'], c['lon'])
        if not (0 <= x < W and 0 <= y < H) or not town[int(y) * S, int(x) * S]:
            continue
        if any(math.hypot(x - sx, y - sy) < 12 for sx, sy in spots):
            continue
        seen.add(t['name'])
        spots.append((x, y))
        water_like = t.get('natural') == 'water'
        label(im, t['name'], x * k, y * k, 0, 15 if water_like else 11, (20, 60, 130, 255) if water_like else (120, 30, 30, 255), (255, 255, 255, 235))
    out = 'public/maps/wakefield-detail-overlay.png'
    im.save(out, optimize=True)
    print('wrote', out, os.path.getsize(out) // 1024, 'KB')


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--fetch':
        fetch(sys.argv[2])
    elif len(sys.argv) == 2:
        os.makedirs('public/maps', exist_ok=True)
        data = build(sys.argv[1])
        json.dump(data, open('public/maps/wakefield-detail.json', 'w'), separators=(',', ':'))
        print('wrote public/maps/wakefield-detail.json', os.path.getsize('public/maps/wakefield-detail.json') // 1024, 'KB')
    else:
        sys.exit(__doc__)
