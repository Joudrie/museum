"""Painted lines on the streets: yellow and white, solid and dashed, found in the satellite photos.

Needs: pip install opencv-python-headless scipy   (only to regenerate the data, never in the game)

For each road, every metre along its centre line, the photo is sampled across the road (-10 m to +10 m). Paint is
a thin bright ridge (a line is 10-15 cm wide, so it is narrower than anything else on the road): the brightness
minus its local median across the road. A line that stays at one distance from the centre for 25 m or more is a
painted line (cars, shadows and curbs do not). For each line found:
  - yellow or white: paint has a little more red than blue than the pavement around it, when it is yellow;
  - solid or dashed: how much of its length is painted; a dashed line is returned as the dashes the photo shows;
  - a yellow line down the middle of a two-way road is drawn double, as it is painted.
Crosswalks come from the ones OpenStreetMap has mapped, drawn as white bars. Exact spacing is not the point (the photos
are 22 cm a pixel and a dash is a few pixels), the point is a line where there is a line, in the colour it is.
Everything is returned in world pixels (8 to the metre).
"""
import math
import os
import pickle

import cv2
import numpy as np
from scipy.ndimage import median_filter, uniform_filter1d

from pavement import PX, Photos, Proj, expected_width  # photo pixels to the metre, the photo cache, the world <-> photo maths

SPAN = 10.0            # metres each side of the centre line that are looked at, at most (a road's own width, plus a little, if it says)
GREY = 0.32            # paint is on pavement: the surface around it is not colourful (the photo's haze makes asphalt about 0.25)
STEP = 0.25            # metres between samples across the road
RIDGE_WIN = 4.5        # metres: the "pavement around it" a paint line is brighter than
TRACK_WIN = 25         # metres a line has to hold its place
MIN_TRACK = 30         # metres long, at least
PAINT_T = 13           # brightness a ridge needs, per sample, to count as painted
TRACK_T = 5.0          # brightness a ridge needs, averaged along the street, to start a track
YELLOW_T = 6.0         # how much redder-than-blue than the pavement beside it, for a line to be called yellow
LINE_W = 5             # world px (0.6 m): how wide a line is drawn
DOUBLE_GAP = 4         # world px between the two lines of a double yellow


def sample(photos, mx, my):
    """The photo's colour at each point (nearest pixel); zeros where there is no photo."""
    mx, my = np.asarray(mx), np.asarray(my)
    out = np.zeros(mx.shape + (3,), np.uint8)
    ti, tj = np.floor(mx / 256).astype(int), np.floor(my / 256).astype(int)
    for t in set(zip(ti.ravel().tolist(), tj.ravel().tolist())):
        img = photos.get(*t)
        if img is None:
            continue
        sel = (ti == t[0]) & (tj == t[1])
        out[sel] = img[np.clip((my[sel] - t[1] * 256).astype(int), 0, 255), np.clip((mx[sel] - t[0] * 256).astype(int), 0, 255)]
    return out


def lines_along(photos, proj, line_world, tags):
    """Paint lines along one road: [(colour 'y' or 'w', polyline in world px, solid?)]."""
    a = np.array(line_world, float)
    mx, my = proj.w2m(a[:, 0], a[:, 1])
    pts = np.stack([mx, my], 1)
    seg = np.hypot(*np.diff(pts, axis=0).T)
    total = float(seg.sum())
    if total < MIN_TRACK:
        return []
    n = int(total)
    at = np.linspace(0, total, n)
    cum = np.concatenate([[0], np.cumsum(seg)])
    cx = np.interp(at, cum, pts[:, 0])
    cy = np.interp(at, cum, pts[:, 1])
    c = np.stack([cx, cy], 1)
    tang = np.gradient(c, axis=0)
    tang = np.stack([np.convolve(tang[:, k], np.ones(7) / 7, mode='same') for k in (0, 1)], 1)
    tang /= np.hypot(tang[:, 0], tang[:, 1])[:, None] + 1e-9
    norm = np.stack([-tang[:, 1], tang[:, 0]], 1)
    span = float(np.clip(expected_width(tags) / 2 + 1.5, 3.5, SPAN))
    off = np.arange(-SPAN, SPAN + 1e-6, STEP)  # metres
    px_ = cx[:, None] + norm[:, 0:1] * off[None, :] * PX
    py_ = cy[:, None] + norm[:, 1:2] * off[None, :] * PX
    rgb = sample(photos, px_, py_).astype(np.float32)
    if not rgb.any():
        return []
    L = rgb.mean(2)
    yb = rgb[:, :, 0] - rgb[:, :, 2]
    k = int(RIDGE_WIN / STEP) | 1
    mx_, mn_ = rgb.max(2), rgb.min(2)
    sat = (mx_ - mn_) / (mx_ + 5)
    pavement = median_filter(sat, size=(1, k), mode='nearest') < GREY  # not lawn, not trees
    on_road = (np.abs(off) <= span)[None, :] & pavement
    ridge = np.clip(L - median_filter(L, size=(1, k), mode='nearest'), 0, None) * on_road
    yellow = yb - median_filter(yb, size=(1, k), mode='nearest')
    # lines that hold a distance from the centre
    prof = uniform_filter1d(ridge, TRACK_WIN, axis=0, mode='nearest')
    peaks = []
    for i in range(n):
        row = prof[i]
        idx = [j for j in range(2, len(off) - 2) if row[j] >= TRACK_T and row[j] == row[j - 2:j + 3].max()]
        peaks.append(idx)
    tracks = []  # each: {i: j}
    live = []
    for i in range(n):
        nxt = []
        taken = set()
        for tr in live:
            last = tr['j']
            cand = [j for j in peaks[i] if abs(j - last) <= 2 and j not in taken]
            if cand:
                j = min(cand, key=lambda q: abs(q - last))
                taken.add(j)
                tr['pts'][i] = j
                tr['j'] = j
                tr['gap'] = 0
                nxt.append(tr)
            else:
                tr['gap'] += 1
                (nxt if tr['gap'] <= 6 else tracks).append(tr)
        for j in peaks[i]:
            if j not in taken:
                nxt.append({'pts': {i: j}, 'j': j, 'gap': 0})
        live = nxt
    tracks += live
    out = []
    for tr in tracks:
        ks = sorted(tr['pts'])
        if len(ks) < MIN_TRACK:
            continue
        i0, i1 = ks[0], ks[-1]
        d = np.interp(np.arange(i0, i1 + 1), ks, [tr['pts'][q] for q in ks])
        d = median_filter(d, size=9, mode='nearest')
        paint = np.array([ridge[i0 + q, max(0, int(round(d[q])) - 2):int(round(d[q])) + 3].max() > PAINT_T for q in range(len(d))])
        filled = paint.copy()
        # a gap of 2 m or less is the photo, not the line
        idx = np.flatnonzero(paint)
        for a_, b_ in zip(idx, idx[1:]):
            if 1 < b_ - a_ <= 3:
                filled[a_:b_ + 1] = True
        duty = float(filled.mean())
        if duty < 0.3:
            continue
        ycol = float(np.mean([yellow[i0 + q, int(round(d[q]))] for q in range(len(d)) if filled[q]] or [0]))
        colour = 'y' if ycol > YELLOW_T else 'w'
        if colour == 'w' and duty < 0.55:  # a faint white track is a curb, a car or a crack; edge lines are mostly there
            continue
        solid = duty >= 0.8
        lat = (d - len(off) // 2) * STEP  # metres from the centre line, + to the left
        # the line as points in world px
        def pt(q):
            i = i0 + q
            mxp, myp = cx[i] + norm[i, 0] * lat[q] * PX, cy[i] + norm[i, 1] * lat[q] * PX
            wx, wy = proj.m2w(mxp, myp)
            return (float(wx), float(wy))
        if solid:
            line = np.array([pt(q) for q in range(0, len(d), 3)] + [pt(len(d) - 1)], np.float32)
            line = cv2.approxPolyDP(line.reshape(-1, 1, 2), 3.0, False).reshape(-1, 2)  # straight where it is straight
            out.append((colour, [tuple(map(float, q)) for q in line], True, float(np.median(lat))))
        else:
            q = 0
            while q < len(filled):
                if filled[q]:
                    r = q
                    while r + 1 < len(filled) and filled[r + 1]:
                        r += 1
                    if r - q >= 1:
                        out.append((colour, [pt(q), pt(r)], False, float(np.median(lat[q:r + 1]))))
                    q = r + 1
                else:
                    q += 1
    return out


def double(line, gap_world):
    """A line as two lines a little apart (a double yellow)."""
    a = np.array(line, float)
    t = np.gradient(a, axis=0) if len(a) > 2 else np.diff(a, axis=0).repeat(2, axis=0)[:len(a)]
    t /= np.hypot(t[:, 0], t[:, 1])[:, None] + 1e-9
    n = np.stack([-t[:, 1], t[:, 0]], 1) * gap_world / 2
    return [[tuple(p) for p in (a + n)], [tuple(p) for p in (a - n)]]


def crosswalk_bars(line_world):
    """White bars across the road at a mapped crossing: bars 3 m long, 0.5 m wide, a metre apart, along the way people walk."""
    a = np.array(line_world, float)
    if len(a) < 2:
        return []
    cum = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(a, axis=0).T))])
    total = cum[-1]
    if total < 3 * 8:
        return []
    bars = []
    for s in np.arange(0.9 * 8, total - 0.5 * 8, 1.0 * 8):
        x, y = np.interp(s, cum, a[:, 0]), np.interp(s, cum, a[:, 1])
        i = min(int(np.searchsorted(cum, s)), len(a) - 1)
        i = max(i, 1)
        tx, ty = a[i] - a[i - 1]
        L = math.hypot(tx, ty) or 1
        nx, ny = -ty / L, tx / L  # along the road
        h = 1.5 * 8
        bars.append([(x - nx * h, y - ny * h), (x + nx * h, y + ny * h)])
    return bars


def analyze(roads, proj, cache, crossings=()):
    """roads: [(id, polyline in world px, tags)]. Returns {'yellow': [[polyline]], 'white': [[polyline]]} in world px."""
    saved = f'{cache}/paint.pkl'
    if os.path.exists(saved) and not os.environ.get('WAKEFIELD_REREAD_PAINT'):
        print('  using the paint read last time (WAKEFIELD_REREAD_PAINT=1 to read it again)')
        return pickle.load(open(saved, 'rb'))
    photos = Photos(cache)
    photos.limit = 400
    wanted = set()
    for _, p, _ in roads:
        a = np.array(p, float)
        mx, my = proj.w2m(a[:, 0], a[:, 1])
        for q in range(len(mx) - 1):
            steps = max(1, int(math.hypot(mx[q + 1] - mx[q], my[q + 1] - my[q]) / 80))
            for s in range(steps + 1):
                x, y = mx[q] + (mx[q + 1] - mx[q]) * s / steps, my[q] + (my[q + 1] - my[q]) * s / steps
                for dx in (-60, 0, 60):
                    for dy in (-60, 0, 60):
                        wanted.add((int((x + dx) // 256), int((y + dy) // 256)))
    photos.fetch(sorted(wanted))
    yellow, white = [], []
    roads = sorted(roads, key=lambda r: (int(r[1][0][0] // 4000), int(r[1][0][1] // 4000)))
    done = 0
    for wid, p, tags in roads:
        for colour, line, solid, lat in lines_along(photos, proj, p, tags):
            if colour == 'y':
                if solid and abs(lat) < 1.6 and tags.get('oneway') not in ('yes', '-1'):
                    yellow += double(line, DOUBLE_GAP)  # painted double, down the middle of a two-way road
                else:
                    yellow.append(line)
            else:
                white.append(line)
        done += 1
        if done % 200 == 0:
            print(f'  {done} of {len(roads)} roads read for paint')
    for line in crossings:
        white += crosswalk_bars(line)
    print(f'  paint: {len(yellow)} yellow lines, {len(white)} white lines and crosswalk bars')
    out = {'yellow': yellow, 'white': white}
    pickle.dump(out, open(saved, 'wb'))
    return out
