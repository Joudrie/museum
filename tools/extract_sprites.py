"""Cut the pieces the game uses out of the free art sheets in assets/vendor
into public/sprites/ (see docs/ASSETS.md for the packs and their licenses).
Run from the repo root:  python3 tools/extract_sprites.py
"""
from pathlib import Path
from PIL import Image

V = Path('assets/vendor')
OUT = Path('public/sprites/lpc')
CASTLE = V / 'lpc-interior-castle-tiles/castle_2.png'
FIRE = V / 'lpc-fireplace/fireplace_0.png'
SHELF = V / 'lpc-shelves-rework/bookshelf-brown_0.png'
UPH = V / 'lpc-upholstery/upholstery-recolors.png'
RED = (0, 480)  # the red colorway's block on the upholstery sheet

# name: (sheet, (x0, y0, x1, y1), offset)
PIECES = {
    'fireplace_grand': (CASTLE, (160, 224, 256, 320), None),
    'rug_red': (CASTLE, (0, 128, 96, 224), None),
    'clock': (CASTLE, (32, 448, 64, 544), None),
    'candelabra': (CASTLE, (64, 448, 96, 544), None),
    'portrait_small': (CASTLE, (192, 384, 224, 416), None),
    'painting_landscape': (CASTLE, (160, 320, 256, 352), None),
    'settee_gold': (CASTLE, (160, 416, 224, 464), None),
    'footstool': (CASTLE, (160, 480, 192, 512), None),
    'table_small': (CASTLE, (0, 544, 32, 592), None),
    'chair_tall': (CASTLE, (32, 544, 64, 608), None),
    'tree_pot': (CASTLE, (224, 544, 256, 608), None),
    'vase_flowers': (CASTLE, (192, 560, 224, 608), None),
    'bookshelf_a': (SHELF, (5, 28, 59, 92), None),
    'bookshelf_b': (SHELF, (69, 13, 123, 77), None),
    'armchair_side': (UPH, (160, 160, 192, 192), RED),
    'armchair_front': (UPH, (128, 160, 160, 192), RED),
    'sofa_front': (UPH, (192, 128, 256, 160), RED),
    'table_round': (UPH, (224, 352, 256, 384), RED),
}
for f in range(4):
    PIECES[f'flame_{f}'] = (FIRE, (f * 32, 0, f * 32 + 32, 32), None)

OUT.mkdir(parents=True, exist_ok=True)
for name, (sheet, (x0, y0, x1, y1), off) in PIECES.items():
    ox, oy = off or (0, 0)
    im = Image.open(sheet).convert('RGBA').crop((x0 + ox, y0 + oy, x1 + ox, y1 + oy))
    bbox = im.getchannel('A').getbbox()
    if not name.startswith(('flame_', 'rug_')) and bbox:
        # trim the empty sides, keep the bottom edge where it is (the piece stands on it)
        im = im.crop((bbox[0], bbox[1], bbox[2], im.height))
    im.save(OUT / f'{name}.png')
    print(name, im.size)
