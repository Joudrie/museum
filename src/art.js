// Placeholder pixel art, generated in code. 32px tiles.
// The room is drawn with a fake-3D "looking down into a box" projection:
// the back wall faces the camera, the side walls lean outward at 45°, and
// everything on a wall (wallpaper, panels, paintings) follows its angle.
export const T = 32;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const WHITE = [255, 255, 255];

// Decor color options. Same textures, different colors.
export const FLOORS = {
  oak: { name: 'Oak', color: '#8f5e3c' },
  birch: { name: 'Birch', color: '#cfae80' },
  spruce: { name: 'Spruce', color: '#b0814f' },
  walnut: { name: 'Walnut', color: '#5c3a26' },
};
export const WAINSCOTS = {
  walnut: { name: 'Walnut', color: '#6e4430' },
  oak: { name: 'Oak', color: '#98663f' },
  ivory: { name: 'Ivory', color: '#cfc5b0' },
  navy: { name: 'Navy', color: '#3c4a63' },
};
export const PAPERS = {
  cream: { name: 'Cream', color: '#e2d3b4' },
  sage: { name: 'Sage', color: '#bcc6a5' },
  rose: { name: 'Rose', color: '#dcb7aa' },
  burgundy: { name: 'Burgundy', color: '#7a3a3e' },
};
export const DEFAULT_DECOR = { floor: 'oak', wainscot: 'walnut', paper: 'cream' };

// Deterministic hash noise in [0, 1).
export const hash = (x, y, s = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
const smoothNoise = (x, y, s) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

function bake(scene, key, w, h, fn) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = fn(x, y);
      if (!c) continue;
      const i = (y * w + x) * 4;
      img.data[i] = c[0];
      img.data[i + 1] = c[1];
      img.data[i + 2] = c[2];
      img.data[i + 3] = c[3] ?? 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  tex.refresh();
  return tex;
}

// ---------- Floor: vertical wood planks with staggered ends ----------
export function bakeFloor(scene, key, w, h, floorId) {
  const base = hex(FLOORS[floorId].color);
  const tones = [1, 1.07, 0.92, 1.12, 0.97].map((k) => shade(base, k));
  const seam = shade(base, 0.5);
  const grain = shade(base, 0.78);
  const dust = hex('#b9a58a');
  const PW = 8; // plank width

  const cols = [];
  for (let c = 0; c * PW < w; c++) {
    const planks = [];
    let y = -Math.floor(hash(c, 0, 1) * 80);
    let n = 0;
    while (y < h) {
      const len = 48 + Math.floor(hash(c, n, 2) * 56);
      planks.push({ y0: y, y1: y + len, tone: tones[Math.floor(hash(c, n, 3) * tones.length)], n });
      y += len;
      n++;
    }
    cols.push(planks);
  }

  return bake(scene, key, w, h, (x, y) => {
    const c = Math.floor(x / PW);
    const lx = x % PW;
    const plank = cols[c].find((p) => y >= p.y0 && y < p.y1);
    const ly = y - plank.y0;
    let col = plank.tone;

    if (lx === PW - 1 || ly === 0) col = seam;
    else {
      if (ly === 1 || lx === 0) col = mix(col, [255, 230, 190], 0.12);
      // grain: broken vertical streaks
      if ((lx === 2 || lx === 5) && hash(c * 8 + lx, Math.floor(y / 5), 4) > 0.55) col = mix(col, grain, 0.6);
      // knots
      if (hash(c, plank.n, 5) > 0.82) {
        const ky = Math.floor(hash(c, plank.n, 6) * (plank.y1 - plank.y0 - 8)) + 4;
        if (Math.abs(ly - ky) <= 1 && lx >= 2 && lx <= 4) col = mix(col, seam, ly === ky && lx === 3 ? 0.9 : 0.5);
      }
    }

    // dust, dithered so it stays pixel-crisp
    const d = smoothNoise(x / 26, y / 26, 8);
    if (d > 0.66 && hash(x, y, 9) < (d - 0.66) * 3) col = mix(col, dust, 0.22);
    // soft shadow near the walls
    const edge = Math.min(x, w - 1 - x);
    if (edge < 4) col = shade(col, 0.72 + edge * 0.07);
    if (y < 6) col = shade(col, 0.6 + y * 0.065);
    return col;
  });
}

// ---------- Walls ----------
function wallPalette(decor) {
  const p = hex(WAINSCOTS[decor.wainscot].color);
  const w = hex(PAPERS[decor.paper].color);
  const dark = (w[0] + w[1] + w[2]) / 3 < 140;
  return {
    base0: shade(p, 0.5),
    base1: shade(p, 0.8),
    base2: shade(p, 1.05),
    panel: p,
    panelDark: shade(p, 0.8),
    panelLight: mix(p, WHITE, 0.15),
    rail: mix(p, WHITE, 0.25),
    railLight: mix(p, WHITE, 0.38),
    crown: [shade(p, 0.8), shade(p, 0.8), mix(p, WHITE, 0.15), mix(p, WHITE, 0.15), mix(p, WHITE, 0.32), shade(p, 0.5)],
    paper: w,
    stripe: dark ? mix(w, WHITE, 0.1) : shade(w, 0.94),
    dot: dark ? mix(w, WHITE, 0.18) : shade(w, 0.9),
    faded: mix(w, WHITE, 0.3),
    stain: hex('#8a6c44'),
  };
}

const FIX = {
  frameOut: hex('#3e2a0e'),
  frameDark: hex('#7a5a1e'),
  gold: hex('#c9a23f'),
  goldLight: hex('#ecd078'),
  void: hex('#1d1512'),
  edge: hex('#2a1a12'),
  nail: hex('#3b2f27'),
  doorFrame: hex('#3a2418'),
  doorTrim: hex('#5e3a24'),
  oak: hex('#a0703f'),
  oakDark: hex('#7c522c'),
  oakLight: hex('#b9864f'),
  brass: hex('#e0bc55'),
};

function doorMaterial(u, v, r) {
  const du = Math.min(u - r.u0, r.u1 - 1 - u);
  const top = r.v1 - 1 - v;
  const d = Math.min(du, top);
  if (d < 2) return FIX.doorFrame;
  if (d < 4) return FIX.doorTrim;
  const iu = u - r.u0 - 4;
  const iw = r.u1 - r.u0 - 8;
  // two raised panels
  const inPanel = (v0, v1) => iu >= 3 && iu < iw - 3 && v >= v0 && v < v1;
  if (inPanel(5, 20) || inPanel(24, r.v1 - 8)) {
    const edgeP = iu === 3 || v === 19 || v === r.v1 - 9;
    const edgeS = iu === iw - 4 || v === 5 || v === 24;
    return edgeP ? FIX.oakLight : edgeS ? FIX.oakDark : FIX.oak;
  }
  if (iu === iw - 6 && (v === 21 || v === 22)) return FIX.brass; // knob
  return iu % 7 === 0 ? FIX.oakDark : FIX.oak;
}

// Wall material at (u along the wall, v height in px from the floor).
function wallMaterial(u, v, D, items, seed, P) {
  for (const it of items) {
    const { u0, u1, v0, v1 } = it.rect;
    if (u >= u0 && u < u1 && v >= v0 && v < v1) {
      if (it.door) return doorMaterial(u, v, it.rect);
      if (it.empty) {
        const border = u === u0 || u === u1 - 1 || v === v0 || v === v1 - 1;
        return border ? mix(P.faded, P.stripe, 0.4) : P.faded;
      }
      const d = Math.min(u - u0, u1 - 1 - u, v - v0, v1 - 1 - v);
      if (d === 0) return FIX.frameOut;
      if (d === 1) return v1 - 1 - v === 1 ? FIX.goldLight : FIX.gold;
      if (d === 2) return FIX.gold;
      if (d === 3) return FIX.frameDark;
      return [34, 28, 24]; // painting area (covered by the HD overlay)
    }
    if (it.empty && u === Math.floor((u0 + u1) / 2) && v === v1 + 1) return FIX.nail;
    // drop shadow under the frame
    if (!it.empty && !it.door && u >= u0 + 1 && u < u1 + 1 && v >= v0 - 2 && v < v0) return null;
  }

  let c;
  if (v < 1) c = P.base0;
  else if (v < 5) c = v === 4 ? P.base2 : P.base1;
  else if (v < 22) {
    const pu = ((u % 40) + 40) % 40;
    if (v < 7 || v >= 20) c = P.panelLight;
    else if (pu < 2) c = P.panelDark;
    else if (pu === 2 || v === 7) c = mix(P.panel, P.panelDark, 0.6);
    else if (pu === 39 || v === 19) c = P.panelLight;
    else c = P.panel;
  } else if (v < 25) c = v === 24 ? P.railLight : P.rail;
  else if (v < D - 6) {
    const su = ((u % 10) + 10) % 10;
    c = su < 2 ? P.stripe : su === 5 && v % 8 === 3 ? P.dot : P.paper;
    const n = smoothNoise(u / 14, v / 9, seed);
    if (n > 0.74) c = mix(c, P.stain, n > 0.82 ? 0.28 : 0.14);
  } else c = P.crown[v - (D - 6)];
  return c;
}

// g: room geometry. items: { left, right, back } lists with rects in wall space.
export function bakeWalls(scene, key, g, items, decor) {
  const { w, h, xL, xR, y0, y1, D } = g;
  const P = wallPalette(decor);
  const mat = (u, v, list, seed) => wallMaterial(u, v, D, list, seed, P) ?? shade(wallMaterial(u, v, D, [], seed, P), 0.75);

  return bake(scene, key, w, h, (sx, sy) => {
    if (sx >= xL && sx < xR && sy >= y0 && sy < y1) return null; // floor
    if (sy >= y1) return null;

    // back wall, seen straight on
    const t = (y0 - sy) / D;
    if (t > 0 && t <= 1 && sx >= xL && sx < xR) {
      return mat(sx - xL, Math.floor(t * D - 0.001), items.back, 11);
    }

    // side walls (parallelograms leaning out at 45°)
    const left = sx < xL;
    if (left || sx >= xR) {
      const v = left ? xL - 1 - sx : sx - xR;
      const baseY = sy + v;
      if (v < D && baseY >= y0 && baseY < y1) {
        if (baseY >= y1 - 2) return FIX.edge; // wall end cap
        if (baseY < y0 + 1) return FIX.edge; // corner where it meets the back wall
        const c = mat(baseY - y0, v, left ? items.left : items.right, left ? 21 : 31);
        return shade(c, left ? 0.92 : 0.84);
      }
    }
    return FIX.void;
  });
}

// Front edge of the room with a door gap.
export function bakeFront(scene, key, w, doorX0, doorX1) {
  return bake(scene, key, w, T, (x, y) => {
    if (x >= doorX0 && x < doorX1) {
      if (y < 2) return FIX.edge;
      const inMat = x >= doorX0 + 3 && x < doorX1 - 3 && y >= 5 && y < 20;
      return inMat ? (y === 5 || y === 19 ? hex('#5a3b2c') : hex('#7a4f39')) : hex('#2a201b');
    }
    if (y === 0) return hex('#6b4530');
    if (y === 1) return hex('#4a2f22');
    return FIX.void;
  });
}

// ---------- Mess: cracks, stains, cobwebs (cleaned by interacting) ----------
export function bakeCrack(scene, key, seed) {
  const w = 30;
  const h = 18;
  const px = new Set();
  const walk = (x, y, dir, len, s) => {
    for (let i = 0; i < len; i++) {
      px.add(`${x},${y}`);
      x += dir;
      const r = hash(i, s, seed);
      if (r < 0.3) y--;
      else if (r > 0.7) y++;
      y = Math.max(1, Math.min(h - 2, y));
      if (r > 0.92 && len - i > 4) walk(x, y, dir, 4 + Math.floor(hash(i, s + 1, seed) * 5), s + 7);
    }
  };
  walk(15, 9, 1, 13, 1);
  walk(14, 9, -1, 13, 2);
  const core = hex('#2a170e');
  const rim = [62, 38, 24, 140];
  return bake(scene, key, w, h, (x, y) => {
    if (px.has(`${x},${y}`)) return core;
    if (px.has(`${x},${y - 1}`) || px.has(`${x - 1},${y}`)) return rim;
    return null;
  });
}

export function bakeStain(scene, key, seed) {
  const w = 26;
  const h = 14;
  return bake(scene, key, w, h, (x, y) => {
    const dx = (x - w / 2) / (w / 2);
    const dy = (y - h / 2) / (h / 2);
    const r = Math.hypot(dx, dy) + (smoothNoise(x / 4, y / 4, seed) - 0.5) * 0.5;
    if (r > 1) return null;
    if (r > 0.82) return hash(x, y, seed) < 0.5 ? [58, 40, 24, 120] : null;
    if (x === Math.floor(w * 0.35) && y === Math.floor(h * 0.35)) return [180, 160, 130, 140]; // glint
    return [58, 40, 24, 150];
  });
}

// Corner cobweb; the corner is at the texture's top-left. Flip for other corners.
export function bakeCobweb(scene, key) {
  const S = 30;
  const silk = [240, 238, 232, 200];
  const faint = [240, 238, 232, 110];
  const set = new Map();
  const put = (x, y, c) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < S && y < S) set.set(`${x},${y}`, c);
  };
  const angles = [0, 0.38, 0.78, 1.18, Math.PI / 2];
  angles.forEach((a) => {
    for (let r = 0; r < S; r++) put(Math.cos(a) * r, Math.sin(a) * r, silk);
  });
  [8, 15, 22].forEach((rad, ri) => {
    for (let i = 0; i < angles.length - 1; i++) {
      const a0 = angles[i];
      const a1 = angles[i + 1];
      for (let s = 0; s <= 12; s++) {
        const t = s / 12;
        const a = a0 + (a1 - a0) * t;
        const sag = Math.sin(t * Math.PI) * (2 + ri); // strands sag toward the corner
        const r = rad - sag;
        put(Math.cos(a) * r, Math.sin(a) * r, ri === 2 ? faint : silk);
      }
    }
  });
  return bake(scene, key, S, S, (x, y) => set.get(`${x},${y}`) || null);
}

// ---------- Characters (20x27 drawn into a 32x32 tile) ----------
const PAL = {
  o: '#2a1a14',
  h: '#4a2e20',
  H: '#6b4430',
  s: '#f2c6a0',
  S: '#d9a07c',
  e: '#2a1a14',
  c: '#7a2e3a',
  C: '#9a4050',
  d: '#5a1f2a',
  w: '#efe6d4',
  g: '#c9a23f',
  p: '#2f2b3d',
  b: '#1a1418',
};

const FRONT = [
  'oooooooo', 'ohhhhhhhho', 'ohhHHhhhhhho', 'ohhhhhhhhhho', 'ohhsssssshho', 'ohssssssssho',
  'ossessssesso', 'ossessssesso', 'osssssssssso', 'oSssssssssSo', 'ooSssssssSoo', 'oowwwwoo',
  'occcwwggwwccco', 'oCccwwggwwccdo', 'oCcccwggwcccdo', 'oCcccwggwcccdo', 'oCcccwwwwcccdo',
  'oCccccggccccdo', 'osCccccccccdso', 'osccccccccccso', 'occcccccccccco', 'oppppppppppo',
  'oppppooppppo', 'oppppooppppo', 'oppppooppppo', 'obbbboobbbbo', 'oooooooooooo',
];
const BACK = [
  'oooooooo', 'ohhhhhhhho', 'ohhHHhhhhhho', 'ohhhhhhhhhho', 'ohhhhhhhhhho', 'ohhhhHhhhhho',
  'ohhhhhhhhhho', 'ohhhhhhhhhho', 'oShhhhhhhhSo', 'oSShhhhhhSSo', 'ooSSSSSSSSoo', 'oocccccoo',
  'occcccccccccco', 'oCccccdcccccdo', 'oCccccdcccccdo', 'oCccccdcccccdo', 'oCccccdcccccdo',
  'oCccccdcccccdo', 'osCcccdccccdso', 'osccccdcccccso', 'occcccccccccco', 'oppppppppppo',
  'oppppooppppo', 'oppppooppppo', 'oppppooppppo', 'obbbboobbbbo', 'oooooooooooo',
];
const SIDE = [
  'oooooooo', 'ohhhhhhhho', 'ohhHHhhhhhho', 'ohhhhhhhhhho', 'ohhhhsssssso', 'ohhhssssssso',
  'ohhhsssssesoo', 'ohhhsssssesoo', 'ohhSsssssso', 'ooSsssssSo', 'ooSSSSSSoo', 'oowwwoo',
  'occccwwco', 'oCccccwgco', 'oCccccwgco', 'oCccccwcdo', 'oCcccccccdo', 'oCcccccccdo',
  'oCccssccdo', 'oCccssccdo', 'occcccccco', 'oppppppppo', 'oppppppppo', 'oppppppppo',
  'oppppppppo', 'obbbbbbbbbbo', 'oooooooooooo',
];

function sprite(scene, key, rows, pal) {
  const top = T - rows.length - 1;
  return bake(scene, key, T, T, (x, y) => {
    const row = rows[y - top];
    if (!row) return null;
    const ch = row[x - Math.floor((T - row.length) / 2)];
    return ch && pal[ch] ? hex(pal[ch]) : null;
  });
}

// One character = three textures: `${prefix}_down`, `_up`, `_side` (faces right).
export function makeCharacter(scene, prefix, colors = {}) {
  const pal = { ...PAL, ...colors };
  if (colors.c) {
    const c = hex(colors.c);
    const toHex = (v) => '#' + v.map((n) => Math.round(Math.min(255, n)).toString(16).padStart(2, '0')).join('');
    pal.C = toHex(mix(c, WHITE, 0.2));
    pal.d = toHex(shade(c, 0.75));
  }
  sprite(scene, `${prefix}_down`, FRONT, pal);
  sprite(scene, `${prefix}_up`, BACK, pal);
  sprite(scene, `${prefix}_side`, SIDE, pal);
}

// "!" bubble shown when something is in reach.
const BUBBLE = [
  '..ooooooo..', '.owwwwwwwo.', 'owwwwwwwwwo', 'owwwwoowwwwo', 'owwwwoowwwo', 'owwwwoowwwo', 'owwwwoowwwo',
  'owwwwwwwwwo', 'owwwwoowwwo', 'owwwwwwwwwo', '.owwwwwwwo.', '..oooooo...', '...ooo.....', '...oo......',
].map((r) => r.slice(0, 11).padEnd(11, '.'));

export function makeBubble(scene) {
  bake(scene, 'bubble', 11, BUBBLE.length, (x, y) => {
    const ch = BUBBLE[y][x];
    return ch === 'o' ? hex('#1d1714') : ch === 'w' ? hex('#fff3c4') : null;
  });
}

// ---------- Exits: stairs ----------
const STEP = hex('#8a5a3b');
const STEP_LIGHT = hex('#a8754d');
const STEP_DARK = hex('#5c3a26');
const RAIL = hex('#4a2f22');
const RAIL_LIGHT = hex('#7a4f39');

// Stairs going up into the back wall. 60x128; bottom half on the floor,
// top half climbs the wall into a dark opening.
export function bakeStairsUp(scene, key) {
  const w = 60;
  const h = 128;
  return bake(scene, key, w, h, (x, y) => {
    if (x >= w - 5) return x === w - 5 || x === w - 1 ? RAIL : (y % 10 < 2 ? RAIL : RAIL_LIGHT); // banister
    if (y < 18) return FIX.void; // opening at the top
    const step = Math.floor((h - y) / 11);
    const ly = (h - y) % 11;
    const k = 0.75 + Math.min(step, 9) * 0.03;
    if (ly === 10) return shade(STEP_LIGHT, k);
    if (ly < 3) return shade(STEP_DARK, k);
    return shade(STEP, k);
  });
}

// Stairwell going down through the floor, with a railing. 60x78.
export function bakeStairsDown(scene, key) {
  const w = 60;
  const h = 78;
  return bake(scene, key, w, h, (x, y) => {
    const rail = x >= w - 4 || y >= h - 4;
    if (rail) return (x + y) % 8 < 2 ? RAIL_LIGHT : RAIL;
    const step = Math.floor(y / 12);
    const ly = y % 12;
    const k = 1 - step * 0.14; // darker the deeper it goes
    if (ly === 0) return shade(STEP_LIGHT, k);
    if (ly > 8) return shade(STEP_DARK, k);
    return shade(STEP, k);
  });
}
