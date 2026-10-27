"""Cuts the free art packs (assets/vendor) into single pieces for the room
builder (builder.html), one sheet per dropdown, plus public/builder/pieces.json.

Usage: python3 -I tools/build_palette.py   (from the repo root)

Each source is cut one of two ways:
  'auto': pieces are found by their see-through gaps (furniture sheets)
  'grid': cut into tiles (floors and walls)
Pieces that are exact repeats are dropped. Change SOURCES and re-run; piece
ids are their place in the list, so add new sources at the end of a group.
"""
import json
import os
import sys
from collections import deque

import numpy as np
from PIL import Image

V = 'assets/vendor'
OUT = 'public/builder'
OK = 'lpc-revised-base-object-kit/lpc_objectspack_unz/Objects'

# (dropdown, name, kind) - kind: tile (floor), wall (wall tile), flat (lies on
# the floor), hang (on a wall), object (stands on the floor)
GROUPS = [
    ('floors', 'Floors', 'tile'),
    ('walls', 'Walls', 'wall'),
    ('rugs', 'Rugs', 'flat'),
    ('plants', 'Plants & flowers', 'object'),
    ('shelves', 'Shelves, cabinets & furniture', 'object'),
    ('seating', 'Seating', 'object'),
    ('tables', 'Tables', 'object'),
    ('lights', 'Lights & fireplaces', 'object'),
    ('hang', 'Windows, curtains & paintings', 'hang'),
    ('decor', 'Statues & decor', 'object'),
]

# group, file, mode, options (scale, crop=(x0,y0,x1,y1), tile, min, gap, max)
SOURCES = [
    ('floors', 'lpc-floors/lpc-floors_unz/lpc-floors/floors.png', 'grid', dict(crop=(0, 1088, 1024, 2048), tile=32, step=64)),
    ('floors', 'lpc-interior-castle-tiles/castle_2.png', 'grid', dict(crop=(0, 0, 256, 96), tile=32, step=32)),
    ('walls', 'lpc-walls/x/lpc-walls/walls.png', 'grid', dict(crop=(0, 640, 2048, 3072), tile=32, step=64, opaque=True)),
    ('walls', 'interior-walls/wallpapers_0.png', 'grid', dict(tile=32, step=32, scale=1)),
    ('rugs', 'lpc-floors/lpc-floors_unz/lpc-floors/floors.png', 'auto', dict(crop=(0, 0, 1024, 1088), min=40, max=200)),
    ('rugs', 'carpet-tileset/carpet_3.png', 'auto', dict(min=20)),
    ('rugs', 'oriental-rug/oriental_rug.png', 'whole', dict()),
    ('rugs', f'{OK}/Decoration/Blankets, Crumpled.png', 'auto', dict(min=14)),
    ('plants', f'{OK}/Decoration/Planters.png', 'auto', dict(min=10)),
    ('plants', f'{OK}/Decoration/Flowers.png', 'auto', dict(min=10)),
    ('plants', 'potted-plant/potted_plant.png', 'auto', dict(min=10)),
    ('shelves', 'lpc-shelves-rework/bookshelf-brown_0.png', 'auto', dict(min=16)),
    ('shelves', 'lpc-shelves-rework/bookshelf-green_0.png', 'auto', dict(min=16)),
    ('shelves', 'lpc-shelves-rework/drawer_shelf-brown_0.png', 'auto', dict(min=16)),
    ('shelves', f'{OK}/Storage/Cabinets.png', 'auto', dict(min=14)),
    ('shelves', 'lpc-wooden-furniture/clean_furniture.png', 'auto', dict(min=20, gap=0, keep='tall')),
    ('shelves', 'lpc-wooden-furniture/clean_furniture_blonde.png', 'auto', dict(min=20, gap=0, keep='tall')),
    ('shelves', 'fancy-old-cabinet/cabinet_32.png', 'auto', dict(min=16)),
    ('shelves', 'bookshelf-3/bookshelf_2.png', 'auto', dict(min=16)),
    ('shelves', 'antique-bookshelf/antique_bookshelf.png', 'whole', dict()),
    ('shelves', 'grandfather-clock-pixel-art/grandfather_clock.png', 'whole', dict()),
    ('shelves', 'furniture-for-nobles/furniturefornobles_mv_mz.png', 'auto', dict(min=20, scale=2 / 3)),
    ('seating', 'lpc-upholstery/upholstery-recolors.png', 'auto', dict(min=12, split=32)),
    ('seating', f'{OK}/Furniture/Chairs, Dining.png', 'auto', dict(min=10, split=32)),
    ('seating', f'{OK}/Furniture/Chairs, Sofa.png', 'auto', dict(min=10)),
    ('seating', f'{OK}/Furniture/Sofas, Formal.png', 'auto', dict(min=14)),
    ('seating', f'{OK}/Furniture/Sofas, Casual.png', 'auto', dict(min=14)),
    ('seating', f'{OK}/Furniture/Thrones.png', 'auto', dict(min=14)),
    ('seating', f'{OK}/Furniture/Ottomans.png', 'auto', dict(min=8)),
    ('seating', f'{OK}/Furniture/Bar Stools.png', 'auto', dict(min=8)),
    ('seating', 'sofas/x/sofas/sofa.png', 'auto', dict(min=16)),
    ('seating', 'sofas/x/sofas/sofa_brown.png', 'auto', dict(min=16)),
    ('seating', 'sofas/x/sofas/sofa_cream.png', 'auto', dict(min=16)),
    ('seating', 'sofas/x/sofas/sofa_red.png', 'auto', dict(min=16)),
    ('seating', 'sofas/x/sofas/sofa_grey.png', 'auto', dict(min=16)),
    ('seating', 'wooden-benches-mage-city-arcanos-rework/bench-wood.png', 'auto', dict(min=16)),
    ('seating', 'wooden-benches-mage-city-arcanos-rework/bench-backless-wood_2.png', 'auto', dict(min=16)),
    ('seating', 'wooden-benches-mage-city-arcanos-rework/bench-white.png', 'auto', dict(min=16)),
    ('seating', 'public-transportation-train-benches/Long%20Benches%20CC-BY-SA.png', 'auto', dict(min=16)),
    ('seating', 'table-and-chair-set/chair_2.png', 'auto', dict(min=16)),
    ('tables', f'{OK}/Furniture/Tables.png', 'auto', dict(min=14)),
    ('tables', 'lpc-tables-rework/wooden_with_candles.png', 'auto', dict(min=16)),
    ('tables', 'tables-stools/x/PNG/tables_&_stools-white.png', 'auto', dict(min=10)),
    ('tables', 'tables-stools/x/PNG/table_linen.png', 'auto', dict(min=10)),
    ('tables', 'table-and-chair-set/table-dinner.png', 'auto', dict(min=16)),
    ('tables', f'{OK}/Furniture/Decorative Furniture.png', 'auto', dict(min=12)),
    ('lights', f'{OK}/Lighting & Fire/Lighting.png', 'auto', dict(min=8)),
    ('lights', 'lpc-castle-lights-repack/lights_0.png', 'auto', dict(min=8)),
    ('lights', 'lpc-fireplace/fireplace_0.png', 'auto', dict(min=20)),
    ('hang', f'{OK}/Decoration/Curtains.png', 'auto', dict(min=12)),
    ('hang', f'{OK}/Decoration/Paintings.png', 'auto', dict(min=8)),
    ('hang', 'drapes/drapes-gathered-red.png', 'auto', dict(min=16)),
    ('hang', 'drapes/drapes-gathered-green.png', 'auto', dict(min=16)),
    ('hang', 'interior-walls/int_windows_wood_centered.png', 'auto', dict(min=12)),
    ('hang', 'interior-walls/int_windows_white_centered.png', 'auto', dict(min=12)),
    ('decor', 'statues-fountains-collection/pedestal_0.png', 'auto', dict(min=10)),
    ('decor', 'statues-fountains-collection/foodog.png', 'auto', dict(min=10)),
    ('decor', 'statues-fountains-collection/fountain64x64.png', 'auto', dict(min=20)),
    ('decor', f'{OK}/Decoration/Clutter.png', 'auto', dict(min=8)),
    ('decor', f'{OK}/Decoration/Pillows.png', 'auto', dict(min=8)),
    ('decor', f'{OK}/Storage/Chests.png', 'auto', dict(min=10)),
    ('decor', f'{OK}/Storage/Barrels.png', 'auto', dict(min=10)),
]


def components(a, gap):
    """Bounding boxes of the see-through-separated blobs in alpha array a."""
    m = a > 16
    d = m.copy()
    for _ in range(gap):  # join parts a pixel or two apart (chair legs...)
        e = d.copy()
        e[1:] |= d[:-1]
        e[:-1] |= d[1:]
        e[:, 1:] |= d[:, :-1]
        e[:, :-1] |= d[:, 1:]
        d = e
    h, w = d.shape
    seen = np.zeros_like(d)
    boxes = []
    for y0 in range(h):
        row = d[y0]
        for x0 in np.nonzero(row & ~seen[y0])[0]:
            if seen[y0, x0]:
                continue
            q = deque([(y0, x0)])
            seen[y0, x0] = True
            x1 = xa = x0
            y1 = y0
            while q:
                y, x = q.popleft()
                xa, x1, y1 = min(xa, x), max(x1, x), max(y1, y)
                for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                    if 0 <= ny < h and 0 <= nx < w and d[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        q.append((ny, nx))
            # shrink back to the real pixels
            sub = m[y0:y1 + 1, xa:x1 + 1]
            ys, xs = np.nonzero(sub)
            if len(ys):
                boxes.append((xa + xs.min(), y0 + ys.min(), xa + xs.max() + 1, y0 + ys.max() + 1))
    return boxes


def cut(path, mode, o):
    im = Image.open(os.path.join(V, path)).convert('RGBA')
    if 'crop' in o:
        im = im.crop(o['crop'])
    out = []
    if mode == 'whole':
        out.append(im.crop(im.getbbox()))
    elif mode == 'grid':
        t, step = o.get('tile', 32), o.get('step', 32)
        sc = o.get('scale')
        if path.startswith('interior-walls/wallpapers'):  # 16px swatches, shown doubled
            im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
        for y in range(0, im.height - t + 1, step):
            for x in range(0, im.width - t + 1, step):
                tile = im.crop((x, y, x + t, y + t))
                a = np.array(tile)[:, :, 3]
                if (a < 250).mean() > (0.0 if o.get('opaque') else 0.05):
                    continue
                out.append(tile)
    else:
        a = np.array(im)[:, :, 3]
        mn, mx = o.get('min', 10), o.get('max', 260)
        for (x0, y0, x1, y1) in components(a, o.get('gap', 0)):
            w, h = x1 - x0, y1 - y0
            if w < mn and h < mn or w * h < mn * mn * 0.6 or w > mx or h > mx:
                continue
            if o.get('keep') == 'tall' and h < 40:
                continue
            g = o.get('split')
            if g and w <= g + 8 and h > g + 8:
                # chairs packed edge to edge in a column: cut on the sheet's grid
                for ys in range(y0 - y0 % g, y1, g):
                    part = im.crop((x0, max(y0, ys), x1, min(y1, ys + g)))
                    if part.getbbox():
                        out.append(part.crop(part.getbbox()))
                continue
            out.append(im.crop((x0, y0, x1, y1)))
    if o.get('scale') and mode != 'grid':
        s = o['scale']
        out = [p.resize((max(1, round(p.width * s)), max(1, round(p.height * s))), Image.NEAREST) for p in out]
    if o.get('limit'):
        out = out[: o['limit']]
    return out


def pack(pieces, width=512):
    """Shelf-pack pieces into one sheet; returns the sheet and their rects."""
    x = y = rowh = 0
    rects = []
    for p in pieces:
        if x + p.width > width:
            x, y, rowh = 0, y + rowh + 1, 0
        rects.append((x, y, p.width, p.height))
        x += p.width + 1
        rowh = max(rowh, p.height)
    sheet = Image.new('RGBA', (width, y + rowh))
    for p, (rx, ry, _, _) in zip(pieces, rects):
        sheet.paste(p, (rx, ry))
    return sheet, rects


def main():
    os.makedirs(OUT, exist_ok=True)
    data = {'tile': 32, 'groups': []}
    for gid, name, kind in GROUPS:
        pieces, srcs, seen = [], [], set()
        for g, path, mode, o in SOURCES:
            if g != gid:
                continue
            for p in cut(path, mode, o):
                key = p.tobytes() if kind not in ('tile', 'wall') else bytes(v // 40 for v in p.convert('RGB').resize((3, 3), Image.BILINEAR).tobytes())
                if key in seen:
                    continue
                seen.add(key)
                pieces.append(p)
                srcs.append(path.split('/')[0])
        sheet, rects = pack(pieces)
        sheet.save(os.path.join(OUT, f'{gid}.png'), optimize=True)
        data['groups'].append({
            'id': gid, 'name': name, 'kind': kind, 'sheet': f'builder/{gid}.png',
            'pieces': [{'id': f'{gid}/{i}', 'x': r[0], 'y': r[1], 'w': r[2], 'h': r[3], 'pack': s} for i, (r, s) in enumerate(zip(rects, srcs))],
        })
        print(f'{gid:8s} {len(pieces):4d} pieces, sheet {sheet.size}', file=sys.stderr)
    # who made what (shown in the builder's credits)
    credits = {}
    for g in data['groups']:
        for p in g['pieces']:
            pack_ = p['pack']
            if pack_ in credits:
                continue
            src = os.path.join(V, pack_, 'SOURCE.txt')
            credits[pack_] = open(src).read().strip().splitlines() if os.path.exists(src) else [pack_]
    data['credits'] = credits
    json.dump(data, open(os.path.join(OUT, 'pieces.json'), 'w'), separators=(',', ':'))


main()
