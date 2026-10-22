// Placeholder pixel art, generated in code. 32px tiles.
// The room is drawn with a fake-3D "looking down into a box" projection:
// the back wall faces the camera, the side walls lean outward at 45°, and
// everything on a wall (wallpaper, panels, paintings) follows its angle.
export const T = 32;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const WHITE = [255, 255, 255];

// Decor: each room has its own. Colors are free-form hex; these are the swatches offered.
export const PALETTES = {
  wood: ['#8f5e3c', '#cfae80', '#b0814f', '#5c3a26', '#a0522d', '#6b4a3a', '#d8c3a0', '#7a5a48', '#3e2a20', '#c08a5a'],
  stone: ['#e9e6df', '#c8c4bc', '#9a968f', '#6b6862', '#4a4a4f', '#2a2a2e', '#d9c7a8', '#a88f6a', '#6f7d8a', '#8a5a4a', '#3d5a4a', '#7a2e3a'],
  wainscot: ['#a8a6a1', '#6e4430', '#98663f', '#cfc5b0', '#3c4a63', '#2f4a3a', '#5a2a2e', '#1e1e22', '#e8e2d4', '#7a6a58', '#4a3a52'],
  paper: ['#d3d2ce', '#e2d3b4', '#bcc6a5', '#dcb7aa', '#7a3a3e', '#b3c3cf', '#2f4a3a', '#3c4a63', '#f0ece2', '#c9a86a', '#5a4a6a', '#8a9a8a', '#1e2a3a'],
  carpet: ['#7a2232', '#2a3a6a', '#2f5a3a', '#c9a23f', '#5a2a5a', '#3a2a22', '#b0413e', '#e8dcc0', '#1e1e22', '#4a7a8a'],
};

export const FLOOR_PATTERNS = {
  planks: 'Planks',
  checker: 'Checker',
  'checker-angled': 'Checker (angled)',
  stone: 'Stone brick',
  tile: 'Tile',
};

export const PLANTS = { none: 'None', fern: 'Fern', monstera: 'Monstera', cactus: 'Cactus', tree: 'Little tree' };

export const DEFAULT_DECOR = {
  pattern: 'planks',
  floor: '#8f5e3c',
  checkA: '#4a4a4f',
  checkB: '#e9e6df',
  wainscot: '#6e4430',
  paper: '#e2d3b4',
  carpet: false,
  carpetColor: '#7a2232',
  plant: 'none',
  paperStyle: 'stripes',
  wainscotStyle: 'panels',
};

// Freshly built rooms start plain: light gray walls with no texture, wood floor.
export const NEW_ROOM_DECOR = {
  ...DEFAULT_DECOR,
  paper: '#d3d2ce',
  paperStyle: 'plain',
  wainscot: '#a8a6a1',
  wainscotStyle: 'none',
};

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

// ---------- Floors ----------
// Planks: vertical wood planks with staggered ends.
function planks(w, h, decor) {
  const base = hex(decor.floor);
  const tones = [1, 1.07, 0.92, 1.12, 0.97].map((k) => shade(base, k));
  const seam = shade(base, 0.5);
  const grain = shade(base, 0.78);
  const PW = 8; // plank width
  const cols = [];
  for (let c = 0; c * PW < w; c++) {
    const list = [];
    let y = -Math.floor(hash(c, 0, 1) * 80);
    let n = 0;
    while (y < h) {
      const len = 48 + Math.floor(hash(c, n, 2) * 56);
      list.push({ y0: y, y1: y + len, tone: tones[Math.floor(hash(c, n, 3) * tones.length)], n });
      y += len;
      n++;
    }
    cols.push(list);
  }
  return (x, y) => {
    const c = Math.floor(x / PW);
    const lx = x % PW;
    const plank = cols[c].find((p) => y >= p.y0 && y < p.y1);
    const ly = y - plank.y0;
    let col = plank.tone;
    if (lx === PW - 1 || ly === 0) return seam;
    if (ly === 1 || lx === 0) col = mix(col, [255, 230, 190], 0.12);
    if ((lx === 2 || lx === 5) && hash(c * 8 + lx, Math.floor(y / 5), 4) > 0.55) col = mix(col, grain, 0.6);
    if (hash(c, plank.n, 5) > 0.82) {
      const ky = Math.floor(hash(c, plank.n, 6) * (plank.y1 - plank.y0 - 8)) + 4;
      if (Math.abs(ly - ky) <= 1 && lx >= 2 && lx <= 4) col = mix(col, seam, ly === ky && lx === 3 ? 0.9 : 0.5);
    }
    return col;
  };
}

// Checkerboard, either flush squares or angled (diamonds).
function checker(decor, angled) {
  const a = hex(decor.checkA);
  const b = hex(decor.checkB);
  const S = 32;
  return (x, y) => {
    const p = angled ? x + y : x;
    const q = angled ? x - y + 4096 : y;
    const i = Math.floor(p / S);
    const j = Math.floor(q / S);
    let col = (i + j) % 2 ? a : b;
    const lp = p % S;
    const lq = q % S;
    if (lp === 0 || lq === 0) col = shade(col, 0.82); // grout line
    else if (lp === 1 || lq === 1) col = mix(col, WHITE, 0.1); // bevel highlight
    if (hash(x, y, 12) > 0.93) col = shade(col, 0.95);
    return col;
  };
}

// Stone brick: offset rows of rough rectangular stones.
function stone(decor) {
  const base = hex(decor.floor);
  const SW = 32;
  const SH = 16;
  return (x, y) => {
    const row = Math.floor(y / SH);
    const ox = row % 2 ? SW / 2 : 0;
    const col = Math.floor((x + ox) / SW);
    const lx = (x + ox) % SW;
    const ly = y % SH;
    if (lx < 2 || ly < 2) return shade(base, 0.55); // grout
    let c = shade(base, 0.86 + hash(col, row, 13) * 0.24);
    if (lx === 2 || ly === 2) c = mix(c, WHITE, 0.12);
    if (lx === SW - 1 || ly === SH - 1) c = shade(c, 0.85);
    const n = hash(x, y, 14);
    if (n > 0.9) c = shade(c, 0.9);
    else if (n < 0.06) c = mix(c, WHITE, 0.08);
    return c;
  };
}

// Tile: small square tiles with thin grout.
function tile(decor) {
  const base = hex(decor.floor);
  const S = 16;
  return (x, y) => {
    const i = Math.floor(x / S);
    const j = Math.floor(y / S);
    const lx = x % S;
    const ly = y % S;
    if (lx === 0 || ly === 0) return shade(base, 0.72);
    let c = shade(base, 0.95 + hash(i, j, 15) * 0.1);
    if (lx === 1 || ly === 1) c = mix(c, WHITE, 0.14);
    if (lx === 3 && ly === 3) c = mix(c, WHITE, 0.35); // glaze glint
    return c;
  };
}

export function bakeFloor(scene, key, w, h, decor) {
  const pattern = {
    planks: () => planks(w, h, decor),
    checker: () => checker(decor, false),
    'checker-angled': () => checker(decor, true),
    stone: () => stone(decor),
    tile: () => tile(decor),
  }[decor.pattern || 'planks']();
  const dust = hex('#b9a58a');
  return bake(scene, key, w, h, (x, y) => {
    let col = pattern(x, y);
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

// Carpet runner with a border, a gold stripe and fringed ends.
// `alongY`: the runner runs top-to-bottom (fringe on the short top/bottom ends).
export function bakeCarpet(scene, key, w, h, color, alongY) {
  const c = hex(color);
  const dark = shade(c, 0.62);
  const gold = mix(c, hex('#e0bc55'), 0.55);
  const light = mix(c, WHITE, 0.12);
  const fringe = hex('#efe4c8');
  return bake(scene, key, w, h, (x, y) => {
    const along = alongY ? y : x;
    const across = alongY ? x : y;
    const len = alongY ? h : w;
    const wid = alongY ? w : h;
    const fromEnd = Math.min(along, len - 1 - along);
    if (fromEnd < 4) return across % 3 === 0 ? fringe : null;
    const e = Math.min(fromEnd - 4, across, wid - 1 - across);
    if (e < 3) return dark;
    if (e === 4 || e === 5) return gold;
    if (e < 7) return dark;
    // small diamond motif
    const m = (Math.abs((across % 16) - 8) + Math.abs((along % 16) - 8)) === 5;
    return m ? light : c;
  });
}

// ---------- Plants (sit on the floor between paintings) ----------
export function bakePlant(scene, key, type) {
  const W = 24;
  const H = 34;
  const px = new Map();
  const put = (x, y, col) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x >= 0 && y >= 0 && x < W && y < H) px.set(`${x},${y}`, col);
  };
  const ellipse = (cx, cy, rx, ry, col, colEdge) => {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++) {
        const d = (x * x) / (rx * rx) + (y * y) / (ry * ry);
        if (d <= 1) put(cx + x, cy + y, d > 0.7 && colEdge ? colEdge : col);
      }
  };
  const G = hex('#4f8a3a');
  const GD = hex('#2f5a24');
  const GL = hex('#7cb85a');

  if (type === 'fern') {
    for (let k = 0; k < 7; k++) {
      const a = -Math.PI / 2 + (k - 3) * 0.42;
      for (let t = 0; t < 14; t++) {
        const r = t;
        const x = 12 + Math.cos(a) * r;
        const y = 22 + Math.sin(a) * r + (t * t) / 28;
        put(x, y, GD);
        if (t > 2 && t % 2 === 0) {
          put(x + Math.cos(a + 1.4) * 2, y + Math.sin(a + 1.4) * 2, G);
          put(x + Math.cos(a - 1.4) * 2, y + Math.sin(a - 1.4) * 2, GL);
        }
      }
    }
  } else if (type === 'monstera') {
    [[7, 12, 6, 4], [16, 10, 6, 4], [12, 5, 5, 4], [12, 16, 5, 3]].forEach(([x, y, rx, ry], i) => {
      ellipse(x, y, rx, ry, i % 2 ? G : GL, GD);
      put(x, y + 1, GD);
      put(x + 1, y - 1, hex('#f0ead8')); // the holes
    });
    for (let y = 16; y < 23; y++) put(12, y, GD);
  } else if (type === 'cactus') {
    for (let y = 4; y < 23; y++) for (let x = 9; x < 15; x++) put(x, y, x === 9 || x === 14 ? GD : x === 11 ? GL : G);
    for (let y = 9; y < 15; y++) for (let x = 4; x < 7; x++) put(x, y, x === 4 ? GD : G);
    for (let x = 6; x < 9; x++) put(x, 14, G);
    for (let y = 7; y < 12; y++) for (let x = 17; x < 20; x++) put(x, y, x === 19 ? GD : G);
    for (let x = 15; x < 17; x++) put(x, 11, G);
    put(12, 3, hex('#e85a7a')); // flower
  } else if (type === 'tree') {
    for (let y = 12; y < 23; y++) put(11, y, hex('#5c3a26')), put(12, y, hex('#74492f'));
    ellipse(12, 9, 9, 8, G, GD);
    ellipse(9, 6, 3, 2, GL);
    ellipse(15, 11, 2, 2, GL);
  }
  // terracotta pot
  for (let y = 22; y < H; y++) {
    const inset = Math.floor((y - 22) / 4);
    for (let x = 5 + inset; x < 19 - inset; x++) {
      const edge = x === 5 + inset || x === 18 - inset || y === H - 1;
      put(x, y, y < 25 ? hex('#c0703f') : edge ? hex('#7a3f22') : hex('#a85a32'));
    }
  }
  return bake(scene, key, W, H, (x, y) => px.get(`${x},${y}`) || null);
}

// ---------- Walls ----------
function wallPalette(decor) {
  const p = hex(decor.wainscot);
  const w = hex(decor.paper);
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
    plainPaper: decor.paperStyle === 'plain',
    panels: decor.wainscotStyle !== 'none',
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
  else if (!P.panels && v < D - 6) c = P.plainPaper ? P.paper : wallpaper(u, v, P);
  else if (v < 22) {
    const pu = ((u % 40) + 40) % 40;
    if (v < 7 || v >= 20) c = P.panelLight;
    else if (pu < 2) c = P.panelDark;
    else if (pu === 2 || v === 7) c = mix(P.panel, P.panelDark, 0.6);
    else if (pu === 39 || v === 19) c = P.panelLight;
    else c = P.panel;
  } else if (v < 25) c = v === 24 ? P.railLight : P.rail;
  else if (v < D - 6) c = P.plainPaper ? P.paper : wallpaper(u, v, P);
  else c = P.crown[v - (D - 6)];
  return c;
}

function wallpaper(u, v, P) {
  const su = ((u % 10) + 10) % 10;
  return su < 2 ? P.stripe : su === 5 && v % 8 === 3 ? P.dot : P.paper;
}

// g: room geometry. items: { left, right, back } lists with rects in wall space.
export function bakeWalls(scene, key, g, items, decor) {
  const { w, h, xL, xR, y0, y1, D } = g;
  const P = wallPalette(decor);
  const mat = (u, v, list, seed) => wallMaterial(u, v, D, list, seed, P) ?? shade(wallMaterial(u, v, D, [], seed, P), 0.75);

  return bake(scene, key, w, h, (sx, sy) => {
    if (sx >= xL && sx < xR && sy >= y0 && sy < y1) return null; // floor
    if (sy >= y1) return null;

    // Back wall, seen straight on. It also fills the corner triangles up to
    // the 45° seam, so the walls always meet with no gap.
    const d = y0 - sy;
    if (d > 0 && d <= D && sx >= xL - d && sx < xR + d) {
      return mat(sx - xL, Math.floor(d - 0.001), items.back, 11);
    }

    // Side walls lean out at 45° and run all the way down to the front edge.
    const left = sx < xL;
    if (left || sx >= xR) {
      const v = left ? xL - 1 - sx : sx - xR;
      const baseY = sy + v;
      if (v < D && baseY >= y0) {
        if (baseY < y0 + 1) return FIX.edge; // corner seam with the back wall
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

// Optional looks: bald, glasses, sun hat. Each returns new row maps.
function withLooks(rows, view, look) {
  let out = rows.map((r) => [...r]);
  const inner = (r, from, to, test, ch) => {
    for (let i = from; i < out[r].length - to; i++) if (test(out[r][i])) out[r][i] = ch;
  };
  if (look.bald) {
    const last = view === 'up' ? 6 : 3;
    for (let r = 1; r <= last; r++) inner(r, view === 'side' ? 4 : 2, 2, (c) => c === 'h' || c === 'H', 's');
    out[1][Math.floor(out[1].length / 2) - 1] = 'w'; // shine
  }
  if (look.glasses && view !== 'up') {
    for (const r of [6, 7]) {
      out[r].forEach((c, i) => {
        if (c !== 'e') return;
        [i - 1, i + 1].forEach((j) => out[r][j] === 's' && (out[r][j] = 'k'));
        if (r === 6) [i - 1, i, i + 1].forEach((j) => out[5][j] === 's' && (out[5][j] = 'k'));
      });
    }
  }
  out = out.map((r) => r.join(''));
  if (look.hat) {
    out[0] = 'oooooooo';
    out[1] = 'oTTTTTTTTo';
    out[2] = 'oTTTTTTTTTTTTTTo';
  }
  return out;
}

// One character = three textures: `${prefix}_down`, `_up`, `_side` (faces right).
export function makeCharacter(scene, prefix, colors = {}, look = {}) {
  const pal = { ...PAL, k: '#1d1714', T: '#e8d8a0', ...colors };
  const toHex = (v) => '#' + v.map((n) => Math.round(Math.min(255, n)).toString(16).padStart(2, '0')).join('');
  // Shading shades are derived from the main colors.
  if (colors.c) {
    pal.C = toHex(mix(hex(colors.c), WHITE, 0.2));
    pal.d = toHex(shade(hex(colors.c), 0.75));
  }
  if (colors.h && !colors.H) pal.H = toHex(mix(hex(colors.h), WHITE, 0.22));
  if (colors.s && !colors.S) pal.S = toHex(shade(hex(colors.s), 0.85));
  sprite(scene, `${prefix}_down`, withLooks(FRONT, 'down', look), pal);
  sprite(scene, `${prefix}_up`, withLooks(BACK, 'up', look), pal);
  sprite(scene, `${prefix}_side`, withLooks(SIDE, 'side', look), pal);
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

// ---------- Decor items (toolkit) ----------
// Drawn on a canvas sized to the footprint (w x h tiles) plus `rise` px above it.
export function bakeItem(scene, key, type, def, rot) {
  const fw = (rot ? def.h : def.w) * T;
  const fh = (rot ? def.w : def.h) * T;
  const W = fw;
  const H = fh + def.rise;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, W, H);
  const ctx = tex.getContext();
  const R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const E = (cx, cy, rx, ry, c) => {
    ctx.fillStyle = c;
    for (let y = -ry; y <= ry; y++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, 1);
    }
  };
  const box = (x, y, w, h, fill, edge) => {
    R(x - 1, y - 1, w + 2, h + 2, edge);
    R(x, y, w, h, fill);
  };
  const shadow = (cx, cy, rx, ry) => E(cx, cy, rx, ry, 'rgba(0,0,0,0.22)');
  const OUT = '#2a1a12';
  const WOOD = '#a0703f';
  const WOOD_L = '#c08a5a';
  const WOOD_D = '#6e4430';
  const MARBLE = '#ece8de';
  const MARBLE_D = '#c8c2b4';
  const BRASS = '#c9a23f';
  const BRASS_L = '#ecd078';
  const gy = H - 4; // ground line near the front of the footprint

  switch (type) {
    case 'stool':
      shadow(16, gy, 11, 3);
      [9, 21, 15].forEach((x, i) => R(x, gy - 16 + (i === 2 ? 2 : 0), 2, 14, WOOD_D));
      E(16, gy - 18, 11, 5, OUT);
      E(16, gy - 18, 10, 4, WOOD);
      E(15, gy - 19, 6, 2, WOOD_L);
      break;
    case 'bench':
      if (!rot) {
        shadow(32, gy, 30, 4);
        [6, 54].forEach((x) => R(x, gy - 14, 4, 13, WOOD_D));
        box(3, gy - 22, 58, 9, WOOD, OUT);
        R(3, gy - 22, 58, 2, WOOD_L);
        R(3, gy - 15, 58, 2, WOOD_D);
      } else {
        shadow(16, H / 2 + 6, 10, H / 2 - 10);
        [def.rise + 6, H - 10].forEach((y) => R(10, y, 12, 4, WOOD_D));
        box(9, def.rise, 14, fh - 8, WOOD, OUT);
        R(9, def.rise, 3, fh - 8, WOOD_L);
        R(20, def.rise, 3, fh - 8, WOOD_D);
      }
      break;
    case 'rope': {
      const post = (x, y) => {
        E(x, y, 5, 2, '#7a5a1e');
        box(x - 2, y - 24, 4, 24, BRASS, OUT);
        R(x - 2, y - 24, 1, 24, BRASS_L);
        E(x, y - 26, 3, 3, BRASS_L);
      };
      const rope = (pts) => pts.forEach(([x, y]) => (R(x - 1, y - 1, 3, 3, '#6a1420'), R(x, y - 1, 1, 1, '#b8404e')));
      if (!rot) {
        shadow(32, gy, 30, 3);
        const pts = [];
        for (let x = 8; x <= 56; x++) pts.push([x, gy - 20 + Math.sin(((x - 8) / 48) * Math.PI) * 7]);
        post(6, gy);
        rope(pts);
        post(58, gy);
      } else {
        const top = def.rise + 10;
        const pts = [];
        for (let y = top - 20; y <= gy - 20; y++) pts.push([16 - Math.sin(((y - top + 20) / (gy - top)) * Math.PI) * 5, y]);
        post(16, top);
        rope(pts);
        post(16, gy);
      }
      break;
    }
    case 'palm':
      for (let y = gy - 40; y < gy - 10; y++) R(15, y, 3, 1, (y % 4 === 0) ? '#5c3a26' : '#8a5a3b');
      for (let k = 0; k < 7; k++) {
        const a = -Math.PI + (k / 6) * Math.PI;
        for (let t = 0; t < 14; t++) R(16 + Math.cos(a) * t, gy - 42 + Math.sin(a) * t * 0.7 + (t * t) / 30, 2, 2, t % 3 ? '#4f8a3a' : '#2f5a24');
      }
      box(9, gy - 10, 14, 10, '#a85a32', '#7a3f22');
      R(9, gy - 10, 14, 3, '#c0703f');
      break;
    case 'lamp':
      shadow(16, gy, 8, 3);
      E(16, gy - 1, 7, 3, OUT);
      E(16, gy - 1, 6, 2, '#4a3a2a');
      R(15, gy - 44, 2, 43, BRASS);
      E(16, gy - 52, 15, 15, 'rgba(255,220,140,0.16)');
      for (let y = 0; y < 13; y++) R(16 - 6 - y / 3, gy - 58 + y, 12 + (2 * y) / 3, 1, y < 2 ? '#fff4d6' : y > 10 ? '#c8b088' : '#efe0b8');
      break;
    case 'candelabra':
      shadow(16, gy, 8, 3);
      E(16, gy - 1, 6, 2, '#7a5a1e');
      R(15, gy - 26, 2, 25, BRASS);
      R(7, gy - 26, 18, 2, BRASS);
      [7, 15, 23].forEach((x) => {
        R(x, gy - 30, 2, 4, BRASS);
        R(x, gy - 38, 2, 8, '#f4eee0');
        R(x, gy - 41, 2, 3, '#ffb23a');
        R(x, gy - 40, 1, 1, '#fff2a0');
      });
      E(16, gy - 40, 12, 6, 'rgba(255,200,120,0.15)');
      break;
    case 'bust':
      shadow(16, gy, 10, 3);
      box(9, gy - 26, 14, 26, MARBLE, OUT);
      R(19, gy - 26, 4, 26, MARBLE_D);
      box(7, gy - 30, 18, 4, MARBLE, OUT);
      E(16, gy - 34, 9, 4, MARBLE_D);
      E(16, gy - 35, 8, 3, MARBLE);
      R(14, gy - 42, 4, 6, MARBLE_D);
      E(16, gy - 47, 6, 7, OUT);
      E(16, gy - 47, 5, 6, MARBLE);
      R(18, gy - 50, 2, 8, MARBLE_D);
      break;
    case 'statue':
      shadow(16, gy, 11, 3);
      box(8, gy - 18, 16, 18, MARBLE_D, OUT);
      R(8, gy - 18, 16, 3, MARBLE);
      R(12, gy - 38, 3, 20, MARBLE);
      R(17, gy - 38, 3, 20, MARBLE_D);
      box(11, gy - 56, 10, 18, MARBLE, OUT);
      R(18, gy - 56, 3, 18, MARBLE_D);
      R(7, gy - 54, 3, 13, MARBLE);
      R(22, gy - 62, 3, 10, MARBLE_D);
      E(16, gy - 61, 4, 4, OUT);
      E(16, gy - 61, 3, 3, MARBLE);
      break;
    case 'armor': {
      const S = '#8a929c';
      const SL = '#c8d0d8';
      const SD = '#5a626c';
      shadow(16, gy, 11, 3);
      R(6, gy - 4, 20, 4, WOOD_D);
      R(11, gy - 24, 4, 20, S);
      R(17, gy - 24, 4, 20, SD);
      box(9, gy - 42, 14, 18, S, OUT);
      R(11, gy - 40, 4, 10, SL);
      E(8, gy - 41, 3, 3, SD);
      E(24, gy - 41, 3, 3, SD);
      box(11, gy - 54, 10, 12, S, OUT);
      R(12, gy - 49, 8, 2, '#1d1714');
      R(12, gy - 54, 3, 4, SL);
      R(15, gy - 60, 2, 6, '#b0413e');
      break;
    }
    case 'vase':
      shadow(16, gy, 12, 3);
      box(5, gy - 12, 22, 12, WOOD_D, OUT);
      R(5, gy - 12, 22, 2, WOOD);
      E(16, gy - 22, 6, 7, '#c0703f');
      R(14, gy - 34, 4, 6, '#c0703f');
      R(13, gy - 35, 6, 2, '#a85a32');
      R(10, gy - 24, 12, 2, '#2a1a12');
      R(12, gy - 20, 8, 1, '#2a1a12');
      ctx.fillStyle = 'rgba(190,225,240,0.28)';
      ctx.fillRect(6, gy - 44, 20, 32);
      ctx.strokeStyle = '#e6f4fa';
      ctx.strokeRect(6.5, gy - 43.5, 19, 31);
      R(8, gy - 42, 2, 10, 'rgba(255,255,255,0.6)');
      break;
    case 'sarcophagus':
      shadow(32, gy, 30, 4);
      box(4, gy - 30, 56, 24, '#d9b44a', OUT);
      for (let x = 24; x < 58; x += 6) R(x, gy - 28, 3, 20, '#2e4a8a');
      E(14, gy - 18, 7, 10, '#c8a060');
      R(11, gy - 21, 2, 2, OUT);
      R(16, gy - 21, 2, 2, OUT);
      R(4, gy - 7, 56, 5, '#a8862e');
      R(4, gy - 30, 56, 2, '#f0d27a');
      break;
    case 'skull': {
      const B = '#e8dcc0';
      const BD = '#c4b48c';
      shadow(32, gy, 28, 3);
      R(10, gy - 4, 44, 4, WOOD_D);
      R(19, gy - 18, 3, 14, WOOD_D);
      R(43, gy - 18, 3, 14, WOOD_D);
      E(22, gy - 32, 15, 11, OUT);
      E(22, gy - 32, 14, 10, B);
      for (let x = 28; x < 58; x++) {
        const t = (x - 28) / 30;
        const top = gy - 38 + t * 6;
        R(x, top, 1, 12 - t * 4, x % 5 ? B : BD);
        R(x, top - 1, 1, 1, OUT);
      }
      R(30, gy - 24, 24, 4, BD);
      for (let x = 31; x < 53; x += 3) R(x, gy - 26, 1, 3, '#fffaf0');
      E(22, gy - 34, 5, 4, '#3a2a1a');
      R(52, gy - 36, 2, 2, '#3a2a1a');
      R(12, gy - 30, 6, 4, BD);
      break;
    }
    case 'globe':
      shadow(16, gy, 9, 3);
      R(10, gy - 4, 12, 3, WOOD_D);
      R(15, gy - 18, 2, 14, WOOD_D);
      E(16, gy - 30, 10, 10, BRASS);
      E(16, gy - 30, 9, 9, '#3d6fb6');
      E(13, gy - 33, 3, 4, '#4f8a3a');
      E(20, gy - 27, 3, 2, '#4f8a3a');
      R(12, gy - 36, 2, 2, '#8fc0f0');
      break;
    case 'bookshelf': {
      const top = 4;
      box(4, top, 56, H - top - 4, WOOD_D, OUT);
      R(7, top + 3, 50, H - top - 12, '#3e2a20');
      const colors = ['#7a2232', '#2a3a6a', '#2f5a3a', '#c9a23f', '#5a2a5a', '#b0413e', '#e8dcc0'];
      for (let sy = top + 3, n = 0; sy + 12 < H - 10; sy += 14) {
        for (let x = 8; x < 55; n++) {
          const bw = 3 + Math.floor(hash(n, sy, 30) * 3);
          const bh = 8 + Math.floor(hash(n, sy, 31) * 4);
          R(x, sy + 12 - bh, bw, bh, colors[Math.floor(hash(n, sy, 32) * colors.length)]);
          x += bw + 1;
        }
        R(7, sy + 12, 50, 2, WOOD);
      }
      break;
    }
    case 'fountain':
      shadow(32, gy - 26, 31, 19);
      E(32, gy - 28, 31, 19, '#8a867e');
      E(32, gy - 29, 29, 17, '#c8c4bc');
      E(32, gy - 30, 25, 13, '#4a8ab0');
      E(32, gy - 31, 23, 11, '#5aa0c8');
      [[20, -30, 6], [42, -26, 5], [30, -22, 7]].forEach(([x, y, r]) => R(x - r / 2, gy + y, r, 1, '#a8d8f0'));
      box(29, gy - 50, 6, 20, '#b8b4ac', OUT);
      E(32, gy - 50, 9, 3, '#c8c4bc');
      E(32, gy - 51, 6, 2, '#5aa0c8');
      [[30, -56], [34, -58], [32, -61], [28, -54], [36, -55]].forEach(([x, y]) => R(x, gy + y, 1, 2, '#d8f0ff'));
      break;
  }
  tex.refresh();
  return key;
}
