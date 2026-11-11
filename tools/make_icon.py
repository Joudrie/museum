# Draws the home-screen icon (a pixel museum at dusk on the 32px grid) into the current directory.
# Usage: python3 tools/make_icon.py, then copy the PNGs into public/icons/.
from PIL import Image
W = 32
img = Image.new('RGB', (W, W))
px = img.load()
def hexc(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5))
OUT = hexc('#1d1714')
# sky: warm evening bands (dithered), like the game's dusk
sky = [hexc(c) for c in ['#3b2a4e', '#5a3a5e', '#8a4a5a', '#c0645a', '#e8905a', '#f2b866']]
for y in range(W):
    for x in range(W):
        t = y / 22 * (len(sky) - 1)
        i = min(len(sky) - 2, int(t)); f = t - i
        c = sky[i + 1] if ((x + y) % 2 == 0 and f > 0.5) or f > 0.8 else sky[i]
        px[x, y] = c if y < 22 else sky[-1]
# a few stars up top
for (x, y) in [(3, 2), (27, 3), (6, 6), (24, 1), (29, 7)]:
    px[x, y] = hexc('#f4e6c0')
# grass
for y in range(25, W):
    for x in range(W):
        px[x, y] = hexc('#3c8a46') if (x * 7 + y * 3) % 5 else hexc('#52a64e')
def rect(x0, y0, x1, y1, c):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            px[x, y] = c
STONE = hexc('#e9e2d0'); STONE_L = hexc('#fff8e6'); STONE_D = hexc('#b8ae98'); STONE_DD = hexc('#8a8270')
GOLD = hexc('#e8c867'); GOLD_D = hexc('#b8902e'); GOLD_L = hexc('#fff0a0')
DOOR = hexc('#3a2418')
# pediment (triangle roof) rows 6..11
for r in range(6):
    y = 6 + r
    half = 3 + r * 2
    x0, x1 = 16 - half, 15 + half
    rect(x0, y, x1, y, OUT)
    if r > 0: rect(x0 + 1, y, x1 - 1, y, GOLD if r < 5 else GOLD_D)
    if 1 <= r <= 4: rect(x0 + 1, y, x0 + 1, y, GOLD_L)
# a little round window in the pediment
for (x, y) in [(15, 8), (16, 8), (15, 9), (16, 9)]: px[x, y] = OUT
px[15, 8] = GOLD_L
# cornice
rect(4, 12, 27, 13, OUT); rect(5, 12, 26, 12, STONE_L); rect(5, 13, 26, 13, STONE_D)
# columns rows 14..21, back wall between
rect(5, 14, 26, 21, STONE_DD)
for cx in [6, 10, 19, 23]:
    rect(cx, 14, cx + 2, 21, STONE)
    rect(cx, 14, cx, 21, STONE_L)
    rect(cx + 2, 14, cx + 2, 21, STONE_D)
    rect(cx - 1, 14, cx + 3, 14, STONE_L)  # capital
    rect(cx - 1, 21, cx + 3, 21, STONE_D)  # base
# the door, with a gold light inside
rect(13, 15, 18, 21, OUT); rect(14, 16, 17, 21, DOOR)
rect(14, 16, 17, 16, OUT)
for y in range(17, 22):
    px[15, y] = GOLD_D; px[16, y] = GOLD
# steps
rect(3, 22, 28, 22, STONE_L); rect(2, 23, 29, 23, STONE); rect(1, 24, 30, 24, STONE_D)
rect(2, 22, 2, 22, OUT); rect(29, 22, 29, 22, OUT)
rect(1, 25, 30, 25, OUT)
# outline the building's sides
for y in range(12, 22): px[4, y] = OUT; px[27, y] = OUT
img.save('icon32.png')
big = lambda n, s: img.resize((s * 32, s * 32), Image.NEAREST)
def padded(size, scale):
    b = img.resize((32 * scale, 32 * scale), Image.NEAREST)
    canvas = Image.new('RGB', (size, size), b.getpixel((0, 0)))
    # fill the margin with the edge colours so it reads as one picture
    for y in range(size):
        for x in range(size):
            sx = min(31, max(0, (x - (size - 32 * scale) // 2) // scale)); sy = min(31, max(0, (y - (size - 32 * scale) // 2) // scale))
            canvas.putpixel((x, y), img.getpixel((sx, sy)))
    return canvas
padded(180, 5).save('apple-touch-icon.png')
img.resize((192, 192), Image.NEAREST).save('icon-192.png')
img.resize((512, 512), Image.NEAREST).save('icon-512.png')
img.resize((32, 32), Image.NEAREST).save('favicon-32.png')
img.resize((256, 256), Image.NEAREST).save('preview.png')
