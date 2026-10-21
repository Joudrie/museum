// Placeholder pixel art, generated in code. 32px tiles.
// The room is drawn with a fake-3D "looking down into a box" projection:
// the back wall is a trapezoid, the side walls lean outward at 45°, and
// everything on a wall (wallpaper, panels, paintings) follows its angle.
export const T = 32;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

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
const WOOD = ['#8a5a3b', '#93623f', '#7f5235', '#9a6a45', '#86583a'].map(hex);
const SEAM = hex('#4a2c1c');
const GRAIN = hex('#6e4429');
const DUST = hex('#b9a58a');

export function bakeFloor(scene, key, w, h) {
  const PW = 8; // plank width
  // Plank ends per column, staggered.
  const cols = [];
  for (let c = 0; c * PW < w; c++) {
    const ends = [];
    let y = -Math.floor(hash(c, 0, 1) * 80);
    let n = 0;
    while (y < h) {
      const len = 48 + Math.floor(hash(c, n, 2) * 56);
      ends.push({ y0: y, y1: y + len, tone: WOOD[Math.floor(hash(c, n, 3) * WOOD.length)], n });
      y += len;
      n++;
    }
    cols.push(ends);
  }

  return bake(scene, key, w, h, (x, y) => {
    const c = Math.floor(x / PW);
    const lx = x % PW;
    const plank = cols[c].find((p) => y >= p.y0 && y < p.y1);
    const ly = y - plank.y0;
    let col = plank.tone;

    if (lx === PW - 1) col = SEAM;
    else if (ly === 0) col = SEAM;
    else {
      if (ly === 1 || lx === 0) col = mix(col, [255, 230, 190], 0.12);
      // grain: broken vertical streaks
      if ((lx === 2 || lx === 5) && hash(c * 8 + lx, Math.floor(y / 5), 4) > 0.55) col = mix(col, GRAIN, 0.6);
      // knots
      if (hash(c, plank.n, 5) > 0.82) {
        const ky = Math.floor(hash(c, plank.n, 6) * (plank.y1 - plank.y0 - 8)) + 4;
        if (Math.abs(ly - ky) <= 1 && lx >= 2 && lx <= 4) col = mix(col, SEAM, ly === ky && lx === 3 ? 0.9 : 0.5);
      }
      // a few cracked planks (run-down)
      if (hash(c, plank.n, 7) > 0.9 && lx === 3 + (Math.floor(ly / 6) % 2)) col = SEAM;
    }

    // dust patches
    // dust: dithered so it stays pixel-crisp
    const d = smoothNoise(x / 26, y / 26, 8);
    if (d > 0.66 && hash(x, y, 9) < (d - 0.66) * 3) col = mix(col, DUST, 0.22);
    // soft shadow near the walls
    const edge = Math.min(x, w - 1 - x);
    if (edge < 4) col = shade(col, 0.72 + edge * 0.07);
    if (y < 6) col = shade(col, 0.6 + y * 0.065);
    return col;
  });
}

// ---------- Walls ----------
const W = {
  base0: hex('#3a2418'),
  base1: hex('#5c3a26'),
  base2: hex('#74492f'),
  panel: hex('#6e4430'),
  panelDark: hex('#583524'),
  panelLight: hex('#87563a'),
  rail: hex('#9a6a45'),
  railLight: hex('#b07d55'),
  paper: hex('#e2d3b4'),
  stripe: hex('#d4c29f'),
  dot: hex('#cbb68f'),
  faded: hex('#ece2c9'),
  stain: hex('#a88a5c'),
  crown0: hex('#5a3626'),
  crown1: hex('#87563a'),
  crown2: hex('#a8734b'),
  crown3: hex('#3a2418'),
  frameOut: hex('#3e2a0e'),
  frameDark: hex('#7a5a1e'),
  gold: hex('#c9a23f'),
  goldLight: hex('#ecd078'),
  void: hex('#1d1512'),
  edge: hex('#2a1a12'),
  nail: hex('#3b2f27'),
};

// Wall material at (u along the wall, v height in px from the floor).
function wallMaterial(u, v, D, items, seed) {
  // Paintings and empty slots.
  for (const it of items) {
    const { u0, u1, v0, v1 } = it.rect;
    if (u >= u0 && u < u1 && v >= v0 && v < v1) {
      if (it.empty) {
        const border = u === u0 || u === u1 - 1 || v === v0 || v === v1 - 1;
        return border ? mix(W.faded, W.stripe, 0.4) : W.faded;
      }
      const du = Math.min(u - u0, u1 - 1 - u);
      const dv = Math.min(v - v0, v1 - 1 - v);
      const d = Math.min(du, dv);
      if (d === 0) return W.frameOut;
      if (d === 1) return v1 - 1 - v === 1 ? W.goldLight : W.gold;
      if (d === 2) return W.gold;
      if (d === 3) return W.frameDark;
      return [34, 28, 24]; // painting area (covered by the HD overlay)
    }
    if (it.empty && u === Math.floor((u0 + u1) / 2) && v === v1 + 1) return W.nail;
    // drop shadow below / beside the frame
    if (!it.empty && u >= u0 + 1 && u < u1 + 1 && v >= v0 - 2 && v < v0) return null;
  }

  let c;
  if (v < 1) c = W.base0;
  else if (v < 5) c = v === 4 ? W.base2 : W.base1;
  else if (v < 22) {
    const pu = ((u % 40) + 40) % 40;
    if (v < 7 || v >= 20) c = W.panelLight;
    else if (pu < 2) c = W.panelDark;
    else if (pu === 2 || v === 7) c = mix(W.panel, W.panelDark, 0.6);
    else if (pu === 39 || v === 19) c = W.panelLight;
    else c = W.panel;
  } else if (v < 25) c = v === 24 ? W.railLight : W.rail;
  else if (v < D - 6) {
    const su = ((u % 10) + 10) % 10;
    c = su < 2 ? W.stripe : su === 5 && v % 8 === 3 ? W.dot : W.paper;
    const n = smoothNoise(u / 14, v / 9, seed);
    if (n > 0.74) c = mix(c, W.stain, n > 0.82 ? 0.28 : 0.14);
  } else {
    const k = v - (D - 6);
    c = [W.crown0, W.crown0, W.crown1, W.crown1, W.crown2, W.crown3][k];
  }
  return c;
}

// g: room geometry. items: { left: [...], right: [...], back: [...] } with rect in wall space.
export function bakeWalls(scene, key, g, items) {
  const { w, h, xL, xR, y0, y1, D } = g;
  const cx = (xL + xR) / 2;
  const half = (xR - xL) / 2;
  const k = D / half; // how much the back wall widens per unit height

  return bake(scene, key, w, h, (sx, sy) => {
    // floor
    if (sx >= xL && sx < xR && sy >= y0 && sy < y1) return null;
    if (sy >= y1) return null;

    // back wall (trapezoid)
    const t = (y0 - sy) / D;
    if (t > 0 && t <= 1) {
      const bx = cx + (sx + 0.5 - cx) / (1 + k * t);
      if (bx >= xL && bx < xR) {
        const u = Math.floor(bx - xL);
        const v = Math.floor(t * D - 0.001);
        let c = wallMaterial(u, v, D, items.back, 11);
        if (c === null) c = shade(wallMaterial(u, v, D, [], 11), 0.75);
        if (bx < xL + 1 || bx >= xR - 1) c = W.edge;
        return c;
      }
    }

    // side walls (parallelograms leaning out at 45°)
    const left = sx < xL;
    if (left || sx >= xR) {
      const v = left ? xL - 1 - sx : sx - xR;
      const baseY = sy + v;
      if (v < D && baseY >= y0 && baseY < y1) {
        const u = baseY - y0;
        let c = wallMaterial(u, v, D, left ? items.left : items.right, left ? 21 : 31);
        if (c === null) c = shade(wallMaterial(u, v, D, [], left ? 21 : 31), 0.75);
        c = shade(c, left ? 0.92 : 0.84);
        if (baseY >= y1 - 2) c = W.edge; // wall end cap
        return c;
      }
    }
    return W.void;
  });
}

// Front edge of the room with a door gap.
export function bakeFront(scene, key, w, doorX0, doorX1) {
  return bake(scene, key, w, T, (x, y) => {
    if (x >= doorX0 && x < doorX1) {
      if (y < 2) return W.edge;
      const inMat = x >= doorX0 + 3 && x < doorX1 - 3 && y >= 5 && y < 20;
      return inMat ? (y === 5 || y === 19 ? hex('#5a3b2c') : hex('#7a4f39')) : hex('#2a201b');
    }
    if (y === 0) return hex('#6b4530');
    if (y === 1) return hex('#4a2f22');
    return W.void;
  });
}

// ---------- Player (20x27 drawn into a 32x32 tile) ----------
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

function sprite(scene, key, rows) {
  const top = T - rows.length - 1;
  return bake(scene, key, T, T, (x, y) => {
    const row = rows[y - top];
    if (!row) return null;
    const ch = row[x - Math.floor((T - row.length) / 2)];
    return ch && ch !== '.' && PAL[ch] ? hex(PAL[ch]) : null;
  });
}

// "!" speech bubble shown when standing at a painting.
const BUBBLE = ['ooooooo', 'owwwwwo', 'owwowwo', 'owwowwo', 'owwowwo', 'owwwwwo', 'owwowwo', 'owwwwwo', 'ooooooo', '..ooo..', '...o...'];

export function makeSprites(scene) {
  sprite(scene, 'player_down', FRONT);
  sprite(scene, 'player_up', BACK);
  sprite(scene, 'player_side', SIDE);
  bake(scene, 'bubble', 7, BUBBLE.length, (x, y) => {
    const ch = BUBBLE[y][x];
    return ch === 'o' ? hex('#1d1714') : ch === 'w' ? hex('#fff3c4') : null;
  });
}
