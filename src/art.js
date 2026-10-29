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
  herringbone: 'Herringbone',
  parquet: 'Parquet',
  checker: 'Checker',
  'checker-angled': 'Checker (angled)',
  stone: 'Stone brick',
  tile: 'Tile',
  marble: 'Marble',
  mosaic: 'Mosaic',
  sand: 'Sand',
  wide: 'Wide planks',
  diagonal: 'Diagonal planks',
  hex: 'Hex tile',
  terrazzo: 'Terrazzo',
  cobble: 'Cobblestone',
  flagstone: 'Flagstone',
  brickfloor: 'Brick',
  penny: 'Penny tile',
  slate: 'Slate',
  concrete: 'Concrete',
  encaustic: 'Patterned tile',
  tatami: 'Tatami',
  carpetfloor: 'Carpet',
  grass: 'Grass',
};
// Which floor patterns take a wood color (the rest take a stone color).
export const WOOD_FLOORS = ['planks', 'herringbone', 'parquet', 'wide', 'diagonal'];
// Floors drawn in two colors (checker color 1 and 2).
export const TWO_COLOR_FLOORS = ['checker', 'checker-angled', 'encaustic'];
// A fitting starting color when switching to a stone-colored floor.
export const FLOOR_DEFAULTS = {
  stone: '#9a968f', tile: '#e9e6df', marble: '#e9e6df', mosaic: '#c8c4bc', sand: '#d9c7a8', hex: '#e9e6df', terrazzo: '#d9d4c8',
  cobble: '#8a8580', flagstone: '#a89a80', brickfloor: '#8a4a3a', penny: '#e9e6df', slate: '#4a4a4f', concrete: '#a8a6a1',
  tatami: '#c8b878', carpetfloor: '#7a2232', grass: '#5a8a3a',
};

export const WALL_PATTERNS = {
  plain: 'Plain',
  stripes: 'Striped',
  damask: 'Damask',
  hieroglyph: 'Hieroglyphs',
  sakura: 'Cherry blossom',
  brick: 'Brick',
  marble: 'Marble',
  wood: 'Wood paneling',
  shiplap: 'Shiplap',
  subway: 'Subway tile',
  ashlar: 'Stone blocks',
  concrete: 'Concrete',
  pinstripe: 'Pinstripe',
  bold: 'Bold stripes',
  dots: 'Polka dots',
  fleur: 'Fleur-de-lis',
  trellis: 'Trellis',
  zigzag: 'Zigzag',
  plaid: 'Plaid',
  deco: 'Art deco fans',
  waves: 'Waves (seigaiha)',
  leaves: 'Leaves',
  stars: 'Stars',
  greek: 'Greek key',
  hexagons: 'Hexagons',
};

export const WAINSCOT_STYLES = {
  none: 'None',
  panels: 'Wood panels',
  tall: 'Tall panels',
  beadboard: 'Beadboard',
  batten: 'Board & batten',
  shiplap: 'Shiplap',
  subway: 'Subway tile',
  stone: 'Stone',
  marble: 'Marble',
  harlequin: 'Harlequin',
  lattice: 'Lattice',
  tiles: 'Checker tiles',
  greek: 'Greek key',
  bands: 'Painted bands',
};

export const LIGHTS = { warm: 'Warm', day: 'Daylight', cool: 'Cool', moody: 'Moody' };
export const LIGHT_TINTS = { warm: 0xfff0dc, day: 0xffffff, cool: 0xdfe8ff, moody: 0xb8a08c };

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
  light: 'warm',
  music: 'gallery',
};

// Freshly built rooms start plain: light gray walls with no texture, wood floor.
export const NEW_ROOM_DECOR = {
  ...DEFAULT_DECOR,
  paper: '#d3d2ce',
  paperStyle: 'plain',
  wainscot: '#a8a6a1',
  wainscotStyle: 'none',
  light: 'day',
  music: 'none',
};

// The main hall starts out grand: marble floor, damask walls, dark wood.
export const MAIN_DECOR = { ...DEFAULT_DECOR, pattern: 'marble', floor: '#e9e6df', paperStyle: 'damask', paper: '#7a3a3e', wainscotStyle: 'panels', wainscot: '#3e2a20', light: 'warm' };
// A room's look before any customizing.
// The break room: a staff room with a checker floor and subway-tile walls.
export const BREAK_DECOR = { ...NEW_ROOM_DECOR, pattern: 'checker', checkA: '#3c4a63', checkB: '#e9e6df', paper: '#cfd8dc', paperStyle: 'subway', wainscotStyle: 'none', light: 'day' };
// The library (a shaped room) starts cozy: dark panelling, green damask, a herringbone wood floor.
export const LIBRARY_DECOR = { ...DEFAULT_DECOR, pattern: 'herringbone', floor: '#6e4a30', paperStyle: 'damask', paper: '#2f4a3a', wainscotStyle: 'panels', wainscot: '#3e2a20', light: 'warm' };
export const baseDecor = (room, index) =>
  index === 0 ? DEFAULT_DECOR : room.orient === 'main' ? MAIN_DECOR : room.orient === 'break' ? BREAK_DECOR : room.plan === 'library' ? LIBRARY_DECOR : NEW_ROOM_DECOR;

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
function planks(w, h, decor, PW = 8) {
  const base = hex(decor.floor);
  const tones = [1, 1.07, 0.92, 1.12, 0.97].map((k) => shade(base, k));
  const seam = shade(base, 0.5);
  const grain = shade(base, 0.78);
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
    if ((lx === 2 || lx === PW - 3) && hash(c * 8 + lx, Math.floor(y / 5), 4) > 0.55) col = mix(col, grain, 0.6);
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

// Herringbone-style chevrons: plank columns whose seams slant opposite ways.
function herringbone(decor) {
  const base = hex(decor.floor);
  const seam = shade(base, 0.55);
  return (x, y) => {
    const c = Math.floor(x / 8);
    const lx = x % 8;
    const slant = c % 2 ? lx : 7 - lx;
    const k = y + slant;
    const n = Math.floor(k / 24);
    if (lx === 7 || k % 24 === 0) return seam;
    let col = shade(base, 0.9 + hash(c, n, 16) * 0.2);
    if (k % 24 === 1 || lx === 0) col = mix(col, WHITE, 0.1);
    if ((lx === 3) && hash(c * 8, Math.floor(y / 5), 17) > 0.6) col = shade(col, 0.88);
    return col;
  };
}

// Parquet basket weave: 16px squares of strips, alternating direction.
function parquet(decor) {
  const base = hex(decor.floor);
  const seam = shade(base, 0.55);
  return (x, y) => {
    const i = Math.floor(x / 16);
    const j = Math.floor(y / 16);
    const lx = x % 16;
    const ly = y % 16;
    if (lx === 15 || ly === 15) return seam;
    const across = (i + j) % 2 ? lx : ly;
    const strip = Math.floor(across / 4);
    if (across % 4 === 3) return shade(base, 0.72);
    let col = shade(base, 0.9 + hash(i * 4 + strip, j, 18) * 0.2);
    if (across % 4 === 0) col = mix(col, WHITE, 0.08);
    return col;
  };
}

// Marble: large slabs with soft veins.
function marble(decor) {
  const base = hex(decor.floor);
  const vein = shade(base, 0.7);
  return (x, y) => {
    if (x % 64 === 0 || y % 64 === 0) return shade(base, 0.86);
    const n = smoothNoise(x / 18, y / 18, 19) * 6 + smoothNoise(x / 6, y / 6, 20);
    const t = Math.abs(Math.sin((x + y * 0.6) / 14 + n));
    let col = t < 0.06 ? vein : t < 0.12 ? mix(base, vein, 0.4) : base;
    if (hash(x, y, 21) > 0.97) col = mix(col, WHITE, 0.2);
    return col;
  };
}

// Mosaic: tiny tiles in slightly varied tones.
function mosaic(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const i = Math.floor(x / 6);
    const j = Math.floor(y / 6);
    if (x % 6 === 0 || y % 6 === 0) return shade(base, 0.6);
    const r = hash(i, j, 22);
    const col = r > 0.92 ? mix(base, hex('#c9a23f'), 0.6) : r < 0.08 ? shade(base, 0.7) : shade(base, 0.9 + r * 0.2);
    return (x % 6 === 1 || y % 6 === 1) ? mix(col, WHITE, 0.1) : col;
  };
}

// Sand: speckled with faint ripples.
function sand(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const ripple = Math.sin((y + smoothNoise(x / 20, y / 20, 23) * 18) / 5);
    let col = ripple > 0.85 ? mix(base, WHITE, 0.08) : ripple < -0.9 ? shade(base, 0.93) : base;
    const n = hash(x, y, 24);
    if (n > 0.92) col = shade(col, 0.85);
    else if (n < 0.04) col = mix(col, WHITE, 0.2);
    return col;
  };
}


const mod = (a, n) => ((a % n) + n) % n;

// Nearest and second-nearest jittered grid points (for stones and cells).
function cells(x, y, size, seed) {
  const gx = Math.floor(x / size);
  const gy = Math.floor(y / size);
  let d1 = 1e9;
  let d2 = 1e9;
  let id = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = gx + i;
      const cy = gy + j;
      const px = (cx + 0.15 + hash(cx, cy, seed) * 0.7) * size;
      const py = (cy + 0.15 + hash(cx, cy, seed + 1) * 0.7) * size;
      const d = Math.hypot(x - px, y - py);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = cx * 977 + cy;
      } else if (d < d2) d2 = d;
    }
  }
  return { d1, d2, id };
}

// Planks laid at 45 degrees.
function diagonal(w, h, decor) {
  const size = w + h + 64;
  const base = planks(size, size, decor);
  return (x, y) => base(mod(Math.floor((x + y) * 0.7), size), mod(Math.floor((x - y) * 0.7) + h, size));
}

// Nearest pointy-top hexagon of radius R: its cell (q, r), center y and how close
// to its edge the point is (e: 0 at the center, 1 on the edge).
function hexCell(x, y, R) {
  const fq = ((Math.sqrt(3) / 3) * x - y / 3) / R;
  const fr = ((2 / 3) * y) / R;
  const fs = -fq - fr;
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  const cx = R * Math.sqrt(3) * (q + r / 2);
  const cy = R * 1.5 * r;
  const dx = Math.abs(x + 0.5 - cx);
  const dy = Math.abs(y + 0.5 - cy);
  return { q, r, cy, e: Math.max(dx, dx * 0.5 + dy * 0.866) / (0.866 * R) };
}

// Hexagon tiles with grout.
function hexTile(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const h = hexCell(x, y, 9);
    if (h.e > 0.88) return shade(base, 0.68);
    const c = shade(base, 0.93 + hash(h.q, h.r, 31) * 0.14);
    return h.e > 0.76 && y < h.cy ? mix(c, WHITE, 0.12) : c;
  };
}

// Terrazzo: chips of stone set in a pale base.
function terrazzo(decor) {
  const base = hex(decor.floor);
  const chips = [shade(base, 0.55), hex('#c06a4a'), hex('#5a7a6a'), mix(base, WHITE, 0.5), hex('#2a2a2e')];
  return (x, y) => {
    if (x % 64 === 0 || y % 64 === 0) return hex('#c9a23f'); // brass divider strips
    const cell = cells(x, y, 7, 32);
    if (cell.d1 < 2 && hash(cell.id, 0, 33) > 0.35) return chips[Math.floor(hash(cell.id, 1, 34) * chips.length)];
    return hash(x, y, 35) > 0.94 ? shade(base, 0.92) : base;
  };
}

// Rounded cobblestones.
function cobble(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const c = cells(x, y, 10, 36);
    const edge = c.d2 - c.d1;
    if (edge < 1.6) return shade(base, 0.45);
    let col = shade(base, 0.82 + hash(c.id, 0, 37) * 0.3);
    if (edge < 3) col = shade(col, 0.85);
    else if (c.d1 < 2.5) col = mix(col, WHITE, 0.14);
    return col;
  };
}

// Large irregular flagstones.
function flagstone(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const c = cells(x, y, 24, 38);
    const edge = c.d2 - c.d1;
    if (edge < 2) return shade(base, 0.5);
    let col = mix(base, hash(c.id, 0, 39) > 0.5 ? hex('#7a6a5a') : hex('#b0a890'), 0.25);
    col = shade(col, 0.9 + hash(c.id, 1, 40) * 0.2);
    if (edge < 3) col = mix(col, WHITE, 0.1);
    const n = smoothNoise(x / 5, y / 5, 41);
    return n > 0.75 ? shade(col, 0.93) : col;
  };
}

// Brick pavers in a running bond.
function brickFloor(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const row = Math.floor(y / 8);
    const off = row % 2 ? 8 : 0;
    const lx = (x + off) % 16;
    const ly = y % 8;
    if (lx === 0 || ly === 0) return hex('#b8ad98');
    let c = shade(base, 0.85 + hash(Math.floor((x + off) / 16), row, 42) * 0.3);
    if (ly === 1) c = mix(c, WHITE, 0.1);
    if (ly === 7) c = shade(c, 0.85);
    return hash(x, y, 43) > 0.92 ? shade(c, 0.88) : c;
  };
}

// Little round penny tiles.
function penny(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const row = Math.floor(y / 5);
    const off = row % 2 ? 2.5 : 0;
    const cx = (Math.floor((x - off) / 5) + 0.5) * 5 + off;
    const cy = (row + 0.5) * 5;
    const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (d > 2.3) return shade(base, 0.62);
    const c = shade(base, 0.93 + hash(Math.floor(cx), row, 44) * 0.14);
    return d < 1 && x < cx ? mix(c, WHITE, 0.25) : c;
  };
}

// Slate: dark tiles with layered, flaky texture.
function slate(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const row = Math.floor(y / 24);
    const off = row % 2 ? 16 : 0;
    if ((x + off) % 32 === 0 || y % 24 === 0) return shade(base, 0.55);
    const t = Math.floor(hash(Math.floor((x + off) / 32), row, 45) * 3);
    const n = smoothNoise(x / 9, y / 3, 46 + t);
    let c = shade(base, 0.88 + t * 0.07);
    if (n > 0.7) c = mix(c, WHITE, 0.08);
    else if (n < 0.25) c = shade(c, 0.9);
    return c;
  };
}

// Polished concrete with saw-cut joints.
function concrete(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    if (x % 96 === 0 || y % 96 === 0) return shade(base, 0.75);
    const n = smoothNoise(x / 24, y / 24, 47);
    let c = shade(base, 0.94 + n * 0.12);
    if (hash(x, y, 48) > 0.97) c = shade(c, 0.85);
    return c;
  };
}

// Encaustic tiles: a two-color star and border in every tile.
function encaustic(decor) {
  const a = hex(decor.checkA);
  const b = hex(decor.checkB);
  return (x, y) => {
    const lx = x % 16;
    const ly = y % 16;
    if (lx === 0 || ly === 0) return shade(b, 0.8);
    const dx = Math.abs(lx - 8);
    const dy = Math.abs(ly - 8);
    if (dx + dy <= 3) return a; // center diamond
    if (dx === dy && dx < 7) return a; // diagonals
    if ((lx === 1 || lx === 15 || ly === 1 || ly === 15) && (lx + ly) % 2) return a; // dotted border
    if (dx + dy === 7) return mix(a, b, 0.5);
    return b;
  };
}

// Tatami mats with dark cloth borders.
function tatami(decor) {
  const base = hex(decor.floor);
  const band = hex('#2f3a2a');
  return (x, y) => {
    const col = Math.floor(x / 32);
    const off = col % 2 ? 32 : 0;
    const lx = x % 32;
    const ly = (y + off) % 64;
    if (lx < 2 || lx > 29) return lx === 0 ? shade(band, 0.7) : band;
    if (ly === 0) return shade(base, 0.6);
    let c = ly % 2 ? base : shade(base, 0.93); // woven rush
    if (hash(x, Math.floor(y / 2), 49) > 0.9) c = shade(c, 0.9);
    return c;
  };
}

// Wall-to-wall carpet with a small repeating figure.
function carpetFloor(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const lx = x % 12;
    const ly = y % 12;
    const d = Math.abs(lx - 6) + Math.abs(ly - 6);
    let c = d === 3 ? mix(base, hex('#c9a23f'), 0.5) : d === 0 ? mix(base, WHITE, 0.3) : base;
    if (hash(x, y, 50) > 0.85) c = shade(c, 0.92);
    return c;
  };
}

// Grass for gardens: blades and a few flowers.
function grass(decor) {
  const base = hex(decor.floor);
  return (x, y) => {
    const n = smoothNoise(x / 12, y / 12, 51);
    let c = shade(base, 0.85 + n * 0.3);
    if (hash(x, Math.floor(y / 3), 52) > 0.82) c = mix(c, hex('#c8e070'), 0.25);
    if (hash(x, y, 53) > 0.88) c = shade(c, 0.8);
    if (hash(Math.floor(x / 3), Math.floor(y / 3), 54) > 0.993) return hash(x, y, 55) > 0.5 ? hex('#f4f0e6') : hex('#f2d36b');
    return c;
  };
}

export function bakeFloor(scene, key, w, h, decor) {
  const pattern = ({
    herringbone: () => herringbone(decor),
    parquet: () => parquet(decor),
    marble: () => marble(decor),
    mosaic: () => mosaic(decor),
    sand: () => sand(decor),
    planks: () => planks(w, h, decor),
    checker: () => checker(decor, false),
    'checker-angled': () => checker(decor, true),
    stone: () => stone(decor),
    tile: () => tile(decor),
    wide: () => planks(w, h, decor, 12),
    diagonal: () => diagonal(w, h, decor),
    hex: () => hexTile(decor),
    terrazzo: () => terrazzo(decor),
    cobble: () => cobble(decor),
    flagstone: () => flagstone(decor),
    brickfloor: () => brickFloor(decor),
    penny: () => penny(decor),
    slate: () => slate(decor),
    concrete: () => concrete(decor),
    encaustic: () => encaustic(decor),
    tatami: () => tatami(decor),
    carpetfloor: () => carpetFloor(decor),
    grass: () => grass(decor),
  }[decor.pattern || 'planks'] || (() => planks(w, h, decor)))();
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
    style: decor.paperStyle || 'stripes',
    accent: mix(w, hex('#c9a23f'), 0.55),
    deep: shade(w, 0.82),
    light: mix(w, WHITE, 0.16),
    panels: decor.wainscotStyle !== 'none',
    wStyle: decor.wainscotStyle || 'panels',
    wTop: decor.wainscotStyle === 'tall' ? 34 : 22, // where the chair rail sits
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

// Open archway: a trimmed frame around a dark opening with a rounded top.
function archMaterial(u, v, r, closed) {
  const w = r.u1 - r.u0;
  const cx = r.u0 + w / 2;
  const rad = w / 2 - 3;
  const springAt = r.v1 - 3 - rad; // where the curve starts
  const inside = (pad) => {
    if (u < r.u0 + 3 + pad || u >= r.u1 - 3 - pad) return false;
    if (v < springAt) return true;
    return Math.hypot(u + 0.5 - cx, v + 0.5 - springAt) <= rad - pad;
  };
  const inFrame = (() => {
    if (u < r.u0 || u >= r.u1) return false;
    if (v < springAt) return true;
    return Math.hypot(u + 0.5 - cx, v + 0.5 - springAt) <= rad + 3;
  })();
  if (!inFrame) return undefined;
  if (inside(0)) {
    if (!closed) return mix(hex('#1e1612'), hex('#5a4434'), Math.max(0, 1 - v / 14)); // open: the floor beyond glows
    // closed: arched double doors in oak, a seam down the middle and a knob on each leaf
    const iu = Math.floor(u - cx);
    if (iu === 0 || iu === -1) return iu === 0 ? FIX.oakDark : FIX.doorTrim;
    if ((iu === -4 || iu === 3) && (v === 21 || v === 22)) return FIX.brass;
    if (inside(3) && !inside(5)) return FIX.oakLight; // raised molding just inside the frame
    return (Math.abs(iu) % 6 === 0) ? FIX.oakDark : FIX.oak;
  }
  return inside(-2) ? FIX.doorTrim : FIX.doorFrame;
}

function doorMaterial(u, v, r) {
  const du = Math.min(u - r.u0, r.u1 - 1 - u);
  const top = r.v1 - 1 - v;
  const d = Math.min(du, top);
  if (d < 2) return FIX.doorFrame;
  if (d < 4) return FIX.doorTrim;
  const iu = u - r.u0 - 4;
  const iw = r.u1 - r.u0 - 8;
  if (iw > 34) {
    // double doors: a seam down the middle and a knob on each leaf
    const mid = Math.floor(iw / 2);
    if (iu === mid || iu === mid - 1) return iu === mid ? FIX.oakDark : FIX.doorTrim;
    if ((iu === mid - 4 || iu === mid + 3) && (v === 21 || v === 22)) return FIX.brass;
  }
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

// A tall window: a white frame and mullions round panes of sky, brighter at
// the top, with a sill below.
function windowMaterial(u, v, r) {
  const du = Math.min(u - r.u0, r.u1 - 1 - u);
  const dv = Math.min(v - r.v0, r.v1 - 1 - v);
  if (du === 0 || dv === 0) return FIX.doorFrame;
  if (du < 3 || dv < 3) return v - r.v0 < 3 ? hex('#d8d0c0') : hex('#f2ece0'); // frame and sill
  const iu = u - r.u0 - 3;
  const iw = r.u1 - r.u0 - 6;
  const iv = r.v1 - 4 - v; // from the top of the glass
  if (iu === Math.floor(iw / 2) || iv % 12 === 11) return hex('#e8e2d4'); // mullions
  const k = iv / Math.max(1, r.v1 - r.v0 - 6);
  const sky = mix(hex('#bfe0f6'), hex('#8cc0e8'), k);
  return (iu + iv) % 9 === 0 && iv < 10 ? mix(sky, WHITE, 0.5) : sky; // a glint of light
}

// Steps down toward the front, seen from above: lit treads, dark risers.
function stepsMaterial(u, y, h) {
  const stone = hex('#d8cfbe');
  const ly = y % 8;
  let c = ly < 5 ? mix(stone, WHITE, 0.12) : ly === 7 ? shade(stone, 0.55) : shade(stone, 0.78);
  c = shade(c, 0.86 + (y / h) * 0.16);
  return hash(u, y, 90) > 0.95 ? shade(c, 0.92) : c;
}

// Wall material at (u along the wall, v height in px from the floor).
function wallMaterial(u, v, D, items, seed, P) {
  for (const it of items) {
    const { u0, u1, v0, v1 } = it.rect;
    if (u >= u0 && u < u1 && v >= v0 && v < v1) {
      if (it.door && it.arch) {
        const c = archMaterial(u, v, it.rect, it.closed);
        if (c !== undefined) return c;
        continue; // outside the arch's rounded corners: plain wall
      }
      if (it.door) return doorMaterial(u, v, it.rect);
      if (it.window) return windowMaterial(u, v, it.rect);
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
  else if (v < P.wTop) c = wainscot(u, v, P);
  else if (v < P.wTop + 3) c = v === P.wTop + 2 ? P.railLight : P.rail;
  else if (v < D - 6) c = P.plainPaper ? P.paper : wallpaper(u, v, P);
  else c = P.crown[v - (D - 6)];
  return c;
}


// The lower wall between the baseboard (v < 5) and the chair rail (v = P.wTop).
function wainscot(u, v, P) {
  const top = P.wTop;
  const lv = v - 5; // height inside the wainscot
  const h = top - 5;
  switch (P.wStyle) {
    case 'beadboard': {
      const bu = mod(u, 4);
      return bu === 0 ? P.panelDark : bu === 1 ? P.panelLight : P.panel;
    }
    case 'batten': {
      const bu = mod(u, 14);
      if (bu < 3) return bu === 0 ? P.panelDark : P.panelLight; // raised batten
      return bu === 3 ? mix(P.panel, P.panelDark, 0.6) : P.panel;
    }
    case 'shiplap': {
      const bv = lv % 4;
      return bv === 0 ? P.panelDark : bv === 1 ? P.panelLight : P.panel;
    }
    case 'subway': {
      const row = Math.floor(lv / 4);
      const bu = mod(u + (row % 2 ? 4 : 0), 8);
      if (lv % 4 === 0 || bu === 0) return P.panelDark;
      return lv % 4 === 1 ? P.panelLight : P.panel;
    }
    case 'stone': {
      const row = Math.floor(lv / 6);
      const bu = mod(u + (row % 2 ? 6 : 0), 12);
      if (lv % 6 === 0 || bu === 0) return P.base0;
      return shade(P.panel, 0.9 + hash(Math.floor((u + (row % 2 ? 6 : 0)) / 12), row, 60) * 0.2);
    }
    case 'marble': {
      const n = smoothNoise(u / 8, v / 8, 61) * 5;
      const t = Math.abs(Math.sin((u + v * 0.7) / 7 + n));
      if (lv === 0 || lv === h - 1) return P.panelDark;
      return t < 0.08 ? P.panelDark : t < 0.16 ? mix(P.panel, P.panelDark, 0.4) : P.panelLight;
    }
    case 'harlequin': {
      const cu = mod(u, 12);
      const d = Math.abs(cu - 6) / 6 + Math.abs(lv - h / 2) / (h / 2);
      const alt = Math.floor(u / 12) % 2;
      if (lv === 0 || lv === h - 1) return P.panelDark;
      return d < 1 ? (alt ? P.panel : P.panelLight) : alt ? P.panelLight : P.panel;
    }
    case 'lattice': {
      const a = mod(u + lv, 8);
      const b = mod(u - lv, 8);
      if (lv === 0 || lv === h - 1) return P.panelDark;
      return a === 0 || b === 0 ? P.panelLight : P.panelDark;
    }
    case 'tiles': {
      const t = (Math.floor(u / 4) + Math.floor(lv / 4)) % 2;
      return t ? P.panel : P.panelLight;
    }
    case 'greek': {
      // a meander band through the middle, plain panel above and below
      const mid = Math.floor(h / 2) - 4;
      const gv = lv - mid;
      if (gv < 0 || gv >= 8) return lv === 0 ? P.panelDark : P.panel;
      const KEY = ['########', '#.......', '#.#####.', '#.#...#.', '#.#.#.#.', '#...#.#.', '#####.#.', '......#.'];
      return KEY[gv][mod(u, 8)] === '#' ? P.panelLight : P.panelDark;
    }
    case 'bands': {
      const k = Math.floor((lv / h) * 6);
      return [P.panelDark, P.panel, P.accent, P.panel, P.panelLight, P.panelDark][k] || P.panel;
    }
    default: {
      // raised wood panels (also the tall version)
      const pu = mod(u, 40);
      const lastV = top - 3;
      if (v < 7 || v >= lastV + 1) return P.panelLight;
      if (pu < 2) return P.panelDark;
      if (pu === 2 || v === 7) return mix(P.panel, P.panelDark, 0.6);
      if (pu === 39 || v === lastV) return P.panelLight;
      return P.panel;
    }
  }
}

// Small 3x5 glyphs for the hieroglyph wallpaper.
const GLYPHS = [
  ['.#.', '###', '.#.', '.#.', '#.#'],
  ['##.', '#.#', '##.', '#..', '#..'],
  ['.#.', '#.#', '###', '#.#', '#.#'],
  ['###', '..#', '.#.', '#..', '###'],
  ['#.#', '###', '#.#', '.#.', '.#.'],
  ['.##', '#..', '.#.', '..#', '##.'],
];

function wallpaper(u, v, P) {
  const uu = ((u % 64) + 64) % 64;
  switch (P.style) {
    case 'damask': {
      const cu = ((u % 16) + 16) % 16;
      const cv = v % 16;
      const ox = (Math.floor(v / 16) % 2) * 8;
      const dx = Math.abs(((cu + ox) % 16) - 8);
      const dy = Math.abs(cv - 8);
      const d = dx + dy;
      return d === 5 || (d < 2) || (dx === 0 && dy < 6) ? P.dot : P.paper;
    }
    case 'hieroglyph': {
      // bands of glyphs between gold lines
      const band = v % 14;
      if (band === 0 || band === 13) return P.accent;
      if (band < 4 || band > 9) return P.paper;
      const cell = Math.floor(u / 6);
      const g = GLYPHS[Math.floor(hash(cell, Math.floor(v / 14), 25) * GLYPHS.length)];
      const gx = ((u % 6) + 6) % 6;
      const row = g[band - 4];
      return row && gx < 3 && row[gx] === '#' ? shade(P.paper, 0.55) : P.paper;
    }
    case 'sakura': {
      const cx = Math.floor(u / 12);
      const cy = Math.floor(v / 12);
      const fx = 3 + Math.floor(hash(cx, cy, 26) * 6);
      const fy = 3 + Math.floor(hash(cx, cy, 27) * 6);
      const lx = ((u % 12) + 12) % 12 - fx;
      const ly = (v % 12) - fy;
      if (hash(cx, cy, 28) < 0.55) {
        if (lx === 0 && ly === 0) return hex('#f2d36b');
        if (Math.abs(lx) + Math.abs(ly) === 1) return hex('#f2a8bc');
      }
      return P.paper;
    }
    case 'brick': {
      const row = Math.floor(v / 6);
      const off = row % 2 ? 7 : 0;
      const bu = (((u + off) % 14) + 14) % 14;
      if (v % 6 === 0 || bu === 0) return mix(P.paper, WHITE, 0.25);
      return shade(P.paper, 0.9 + hash(Math.floor((u + off) / 14), row, 29) * 0.15);
    }
    case 'marble': {
      const n = smoothNoise(u / 10, v / 10, 30) * 5;
      const t = Math.abs(Math.sin((uu + v * 0.8) / 9 + n));
      return t < 0.07 ? shade(P.paper, 0.78) : P.paper;
    }
    case 'wood': {
      const bu = mod(u, 10);
      if (bu === 0) return P.deep;
      const knot = hash(Math.floor(u / 10), Math.floor(v / 9), 62) > 0.93 && mod(v, 9) === 4 && bu === 5;
      return knot ? P.deep : (bu === 3 || bu === 7) && hash(Math.floor(u / 10) * 10 + bu, Math.floor(v / 4), 63) > 0.6 ? mix(P.paper, P.deep, 0.5) : P.paper;
    }
    case 'shiplap': {
      const bv = v % 6;
      return bv === 0 ? P.deep : bv === 1 ? P.light : P.paper;
    }
    case 'subway': {
      const row = Math.floor(v / 5);
      const bu = mod(u + (row % 2 ? 5 : 0), 10);
      if (v % 5 === 0 || bu === 0) return P.deep;
      return v % 5 === 1 ? P.light : P.paper;
    }
    case 'ashlar': {
      const row = Math.floor(v / 9);
      const bu = mod(u + (row % 2 ? 9 : 0), 18);
      if (v % 9 === 0 || bu === 0) return shade(P.paper, 0.7);
      const c = shade(P.paper, 0.9 + hash(Math.floor((u + (row % 2 ? 9 : 0)) / 18), row, 64) * 0.18);
      return v % 9 === 1 || bu === 1 ? mix(c, WHITE, 0.1) : c;
    }
    case 'concrete': {
      const n = smoothNoise(u / 14, v / 14, 65);
      if (mod(u, 48) === 0 || v % 32 === 0) return P.deep;
      if (mod(u, 24) === 12 && v % 16 === 8) return shade(P.paper, 0.7); // form-tie holes
      return shade(P.paper, 0.94 + n * 0.1);
    }
    case 'pinstripe':
      return mod(u, 6) === 0 ? P.deep : P.paper;
    case 'bold':
      return mod(u, 16) < 8 ? P.paper : P.deep;
    case 'dots': {
      const row = Math.floor(v / 8);
      const lu = mod(u + (row % 2 ? 4 : 0), 8);
      const lv = v % 8;
      return Math.abs(lu - 4) + Math.abs(lv - 4) <= 1 ? P.dot : P.paper;
    }
    case 'fleur': {
      const row = Math.floor(v / 12);
      const lu = mod(u + (row % 2 ? 6 : 0), 12);
      const lv = v % 12;
      const F = ['..#..', '.###.', '#.#.#', '.###.', '..#..', '.#.#.'];
      const fx = lu - 3;
      const fy = lv - 3;
      return fy >= 0 && fy < 6 && fx >= 0 && fx < 5 && F[5 - fy][fx] === '#' ? P.accent : P.paper;
    }
    case 'trellis': {
      const a = mod(u + v, 10);
      const b = mod(u - v, 10);
      if (a === 0 || b === 0) return P.deep;
      return (a === 5 && b === 5) ? P.accent : P.paper;
    }
    case 'zigzag': {
      const z = mod(v + Math.abs(mod(u, 8) - 4), 8);
      return z < 2 ? P.deep : P.paper;
    }
    case 'plaid': {
      const a = mod(u, 16) < 3;
      const b = v % 16 < 3;
      if (a && b) return shade(P.paper, 0.7);
      if (a || b) return P.deep;
      return mod(u, 16) === 9 || v % 16 === 9 ? P.accent : P.paper;
    }
    case 'deco': {
      const row = Math.floor(v / 10);
      const cx = mod(u + (row % 2 ? 8 : 0), 16) - 8;
      const cy = v % 10;
      const r = Math.hypot(cx, cy);
      if (r > 9.5) return P.paper;
      if (Math.round(r) % 3 === 0) return P.accent;
      return Math.abs(cx) < 1 ? P.accent : P.light;
    }
    case 'waves': {
      // seigaiha: overlapping fans of rings; each row sits in front of the one above
      for (const k of [0, 1]) {
        const row = Math.floor(v / 8) - k;
        const cx = mod(u + (mod(row, 2) ? 8 : 0), 16) - 8;
        const r = Math.hypot(cx, v - (row * 8 + 8));
        if (v <= row * 8 + 8 && r < 8.5) return Math.round(r) % 3 === 0 ? P.deep : P.paper;
      }
      return P.paper;
    }
    case 'leaves': {
      const cx = Math.floor(u / 14);
      const cy = Math.floor(v / 14);
      const lu = mod(u, 14) - 7;
      const lv = (v % 14) - 7;
      const flip = hash(cx, cy, 66) > 0.5 ? 1 : -1;
      const ru = lu * 0.7 + lv * 0.7 * flip;
      const rv = -lu * 0.7 * flip + lv * 0.7;
      const inLeaf = (ru / 5) ** 2 + (rv / 2.4) ** 2 <= 1;
      if (inLeaf) return Math.abs(rv) < 0.6 ? mix(hex('#3a6a3a'), P.paper, 0.3) : mix(hex('#4f8a4a'), P.paper, 0.25);
      return P.paper;
    }
    case 'stars': {
      const cx = Math.floor(u / 10);
      const cy = Math.floor(v / 10);
      if (hash(cx, cy, 67) < 0.5) return P.paper;
      const lu = mod(u, 10) - 5;
      const lv = (v % 10) - 5;
      return (lu === 0 && Math.abs(lv) <= 2) || (lv === 0 && Math.abs(lu) <= 2) || (Math.abs(lu) === 1 && Math.abs(lv) === 1) ? P.accent : P.paper;
    }
    case 'greek': {
      const band = v % 20;
      if (band >= 10) return P.paper;
      if (band === 0 || band === 9) return P.accent;
      const KEY = ['########', '#.......', '#.#####.', '#.#...#.', '#.#.#.#.', '#...#.#.', '#####.#.', '......#.'];
      return KEY[band - 1][mod(u, 8)] === '#' ? P.accent : P.paper;
    }
    case 'hexagons': {
      const h = hexCell(u + 1000, v, 6);
      return h.e > 0.82 ? P.deep : P.paper;
    }
    default: {
      const su = ((u % 10) + 10) % 10;
      return su < 2 ? P.stripe : su === 5 && v % 8 === 3 ? P.dot : P.paper;
    }
  }
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

// The main hall: the balcony's back wall, the hall's side walls, the balcony's
// front wall (a wall standing inside the room, with gaps for the stairs), the
// hallway's walls below the hall, and the hallway's door mat at the bottom.
// Every wall meets its neighbor at a 45° seam or a shared edge: no gaps.
export function bakeMainWalls(scene, key, g, items, decor) {
  const { w, h, xL, xR, y0, yb, yf, yh, hx0, hx1, D, stairs } = g;
  const P = wallPalette(decor);
  const mat = (u, v, list, seed) => wallMaterial(u, v, D, list, seed, P) ?? shade(wallMaterial(u, v, D, [], seed, P), 0.75);
  const side = (sx, sy, x, top, bottom, leftWall, list, seed) => {
    const v = leftWall ? x - 1 - sx : sx - x;
    const baseY = sy + v;
    if (v < 0 || v >= D || baseY < top || sy >= bottom) return undefined; // runs right down to the front edge
    if (baseY < top + 1 && top === y0) return FIX.edge; // corner seam with the back wall
    return shade(mat(baseY - top, v, list, seed), leftWall ? 0.92 : 0.84);
  };
  const matX0 = hx0 + 2 * T;
  const matX1 = hx0 + 3 * T;

  return bake(scene, key, w, h, (sx, sy) => {
    // Inside the hall.
    if (sx >= xL && sx < xR && sy >= y0 && sy < yf) {
      if (sy >= yb - D && sy < yb && !stairs.some((st) => sx >= st.x0 && sx < st.x1)) {
        return mat(sx - xL, yb - 1 - sy, items.band, 41); // the balcony's front wall
      }
      return null; // floor
    }
    // Inside the hallway.
    if (sx >= hx0 && sx < hx1 && sy >= yf && sy < yh) return null;

    // Balcony back wall, filling the corner triangles to the 45° seams.
    const d = y0 - sy;
    if (d > 0 && d <= D && sx >= xL - d && sx < xR + d) return mat(sx - xL, Math.floor(d - 0.001), items.back, 11);

    // The hall's side walls run down to its front edge.
    if (sy < yf) {
      const c = sx < xL ? side(sx, sy, xL, y0, yf, true, items.left, 21) : side(sx, sy, xR, y0, yf, false, items.right, 31);
      if (c) return c;
    }
    // Below the hall's front edge: the hallway's walls, or outside.
    if (sy >= yf && sy < yh) {
      if (sx < hx0) {
        const c = side(sx, sy, hx0, yf, yh, true, items.hl, 51);
        if (c) return c;
      } else if (sx >= hx1) {
        const c = side(sx, sy, hx1, yf, yh, false, items.hr, 61);
        if (c) return c;
      }
      if (sy === yf) return hex('#6b4530'); // the hall's front edge
      if (sy === yf + 1) return hex('#4a2f22');
      return FIX.void;
    }
    // The hallway's front edge, with a door mat where you come in from the entrance.
    if (sy >= yh) {
      const y = sy - yh;
      if (sx >= matX0 && sx < matX1) {
        if (y < 2) return FIX.edge;
        const inMat = sx >= matX0 + 3 && sx < matX1 - 3 && y >= 5 && y < 20;
        return inMat ? (y === 5 || y === 19 ? hex('#5a3b2c') : hex('#7a4f39')) : hex('#2a201b');
      }
      if (sx >= hx0 - D && sx < hx1 + D) return y === 0 ? hex('#6b4530') : y === 1 ? hex('#4a2f22') : FIX.void;
    }
    return FIX.void;
  });
}

// Shaped rooms (see shaped.js): the floor is a column of bands, each with its
// own width. A band can end in a wall down to the next (lower) level, or in a
// run of steps. Wider bands get back walls on the parts that stick out past
// the band behind them; narrower ones leave a front edge and void outside.
// Wall keys: band 0's walls are back/left/right, band i's sides are li/ri,
// the stick-out back walls oli/ori, and the face of band i's drop is fi.
export function bakeShapedWalls(scene, key, g, items, decor) {
  const { w, h, D, bands } = g;
  const P = wallPalette(decor);
  const mat = (u, v, list, seed) => wallMaterial(u, v, D, list || [], seed, P) ?? shade(wallMaterial(u, v, D, [], seed, P), 0.75);
  const n = bands.length;
  const last = bands[n - 1];
  return bake(scene, key, w, h, (sx, sy) => {
    // floors, and the drops and steps at the front of each band
    for (let i = 0; i < n; i++) {
      const b = bands[i];
      if (sx < b.x0 || sx >= b.x1 || sy < b.top || sy >= b.bottom) continue;
      const s = b.strip;
      if (s && sy >= b.bottom - s.h && !s.cuts.some(([a, c]) => sx >= a && sx < c)) {
        if (s.kind === 'wall') return mat(sx - b.x0, b.bottom - 1 - sy, items[`f${i}`], 41 + i);
        return stepsMaterial(sx - b.x0, sy - (b.bottom - s.h), s.h);
      }
      return null;
    }
    // back walls: all of band 0's, and the parts of wider bands that stick out
    const b0 = bands[0];
    let d = b0.top - sy;
    if (d > 0 && d <= D && sx >= b0.x0 - d && sx < b0.x1 + d) return mat(sx - b0.x0, Math.floor(d - 0.001), items.back, 11);
    for (let i = 1; i < n; i++) {
      const b = bands[i];
      const p = bands[i - 1];
      d = b.top - sy;
      if (d <= 0 || d > D) continue;
      const v = Math.floor(d - 0.001);
      if (b.x0 < p.x0 && sx >= b.x0 - d && sx < p.x0) return sx === p.x0 - 1 ? FIX.edge : mat(sx - b.x0, v, items[`ol${i}`], 71 + i);
      if (b.x1 > p.x1 && sx >= p.x1 && sx < b.x1 + d) return sx === p.x1 ? FIX.edge : mat(sx - p.x1, v, items[`or${i}`], 81 + i);
    }
    // side walls (running right down to the band's front edge), front bands
    // first since they stand in front
    for (let i = n - 1; i >= 0; i--) {
      const b = bands[i];
      const lv = b.x0 - 1 - sx;
      const lb = sy + lv;
      if (lv >= 0 && lv < D && lb >= b.top && sy < b.bottom) {
        if (lb < b.top + 1 && i === 0) return FIX.edge; // corner seam with the back wall
        return shade(mat(lb - b.top, lv, items[i ? `l${i}` : 'left'], 21 + i), 0.92);
      }
      const rv = sx - b.x1;
      const rb = sy + rv;
      if (rv >= 0 && rv < D && rb >= b.top && sy < b.bottom) {
        if (rb < b.top + 1 && i === 0) return FIX.edge;
        return shade(mat(rb - b.top, rv, items[i ? `r${i}` : 'right'], 31 + i), 0.84);
      }
    }
    // the front edge where a band ends with nothing in front of it
    for (let i = 0; i < n; i++) {
      const b = bands[i];
      const nb = bands[i + 1];
      if (sy >= b.bottom && sy < b.bottom + 2 && sx >= b.x0 && sx < b.x1 && (!nb || sx < nb.x0 || sx >= nb.x1)) return hex(sy === b.bottom ? '#6b4530' : '#4a2f22');
    }
    // below the last band: the door mat where you come in
    if (sy >= last.bottom && sx >= g.matX0 && sx < g.matX1) {
      const y = sy - last.bottom;
      if (y < 2) return FIX.edge;
      if (y < T) {
        const inMat = sx >= g.matX0 + 3 && sx < g.matX1 - 3 && y >= 5 && y < 20;
        return inMat ? (y === 5 || y === 19 ? hex('#5a3b2c') : hex('#7a4f39')) : hex('#2a201b');
      }
    }
    return FIX.void;
  });
}

// Stairs from the ground floor up to the balcony's edge: a solid flight that
// stands out in front of the wall. W wide; its top meets the balcony edge and its
// foot sits `run` px out on the floor, so on screen it is run + wall height tall.
export function bakeHallStairs(scene, key, decor, run) {
  const wood = hex(decor.wainscot || '#6e4430');
  const W = 2 * T;
  const H = run + 2 * T;
  const tread = mix(hex('#a0703f'), wood, 0.35);
  const marble = hex('#e4ded2');
  return bake(scene, key, W, H, (x, y) => {
    // marble stringers with a handrail on both sides
    if (x < 5 || x >= W - 5) {
      const e = x < 5 ? x : W - 1 - x;
      if (e === 0) return FIX.edge;
      if (e === 1) return mix(marble, WHITE, 0.3); // handrail
      return shade(marble, e === 4 ? 0.7 : 0.86);
    }
    const step = Math.floor(y / 8);
    const ly = y % 8;
    let c = ly < 4 ? mix(tread, WHITE, 0.14) : ly === 7 ? shade(tread, 0.55) : shade(tread, 0.8);
    c = shade(c, 0.8 + (step / (H / 8)) * 0.22); // the lower steps catch more light
    if (x < 8 || x >= W - 8) c = shade(c, 0.85); // shadow along the stringers
    return hash(x, y, 70) > 0.94 ? shade(c, 0.9) : c;
  });
}

// A marble column, base and capital, h px tall.
export function bakeColumn(scene, key, h) {
  const W = 22;
  const m = hex('#e8e2d6');
  return bake(scene, key, W, h, (x, y) => {
    const fromBottom = h - 1 - y;
    if (y < 7) {
      // Ionic capital: a slab with a scroll at each end
      if (y < 2) return x === 0 || x === W - 1 ? FIX.edge : shade(m, y === 0 ? 1 : 0.85);
      const scroll = (x < 5 || x >= W - 5) && y < 6;
      if (scroll) return Math.hypot(x < 5 ? x - 2.5 : x - (W - 3.5), y - 3.5) < 1.2 ? shade(m, 0.6) : shade(m, 0.9);
      return x >= 4 && x < W - 4 ? shade(m, 0.92) : null;
    }
    if (fromBottom < 6) {
      // stepped base
      const inset = fromBottom < 3 ? 0 : 2;
      if (x < inset || x >= W - inset) return null;
      return fromBottom === 0 ? shade(m, 0.6) : fromBottom === 3 || fromBottom === 2 ? shade(m, 0.8) : m;
    }
    // fluted shaft, lit from the left
    if (x < 5 || x >= W - 5) return null;
    const lx = x - 5;
    if (lx === 0 || lx === W - 11) return shade(m, 0.62);
    return lx % 3 === 0 ? shade(m, 0.78) : lx < 4 ? mix(m, WHITE, 0.15) : shade(m, 0.9 - lx * 0.01);
  });
}

// The balcony's railing: a marble balustrade on a beam that rests on the columns.
export const RAIL_H = 20; // px: 12 of balusters over an 8 px beam
export function bakeRailing(scene, key, width) {
  const m = hex('#e8e2d6');
  return bake(scene, key, width, RAIL_H, (x, y) => {
    if (y < 2) return y === 0 ? mix(m, WHITE, 0.3) : m; // handrail
    if (y < 12) {
      const k = x % 7;
      if (k >= 2 && k <= 4) return k === 2 ? mix(m, WHITE, 0.2) : k === 4 ? shade(m, 0.75) : m; // baluster
      return null;
    }
    // the beam
    if (y === 12) return mix(m, WHITE, 0.25);
    if (y === RAIL_H - 1) return shade(m, 0.55);
    return y === 15 ? shade(m, 0.82) : shade(m, 0.93);
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

// Pile of gold coins waiting to be collected. stage 1 = a few, 3 = a heap.
export function bakeCoins(scene, key, stage) {
  const W = 30;
  const H = 22;
  const set = new Map();
  const rim = [160, 112, 30];
  const face = [232, 184, 64];
  const shine = [255, 238, 150];
  const shadow = [40, 26, 14, 90];
  const coin = (cx, cy) => {
    // A coin seen from above at an angle: 8x4 face over a 2px rim.
    for (let y = -2; y <= 3; y++) {
      for (let x = -4; x <= 4; x++) {
        const fy = y <= 1 ? y + 0.5 : y - 1.5;
        if ((x / 4.5) ** 2 + (fy / 2.2) ** 2 > 1) continue;
        const top = y <= 1 && (x / 4.5) ** 2 + ((y + 0.5) / 2.2) ** 2 <= 1;
        let c = top ? face : rim;
        if (top && y === -1 && x >= -2 && x <= 0) c = shine;
        if (top && ((x / 3.4) ** 2 + ((y + 0.5) / 1.5) ** 2 > 1)) c = top && y < 0 ? face : [196, 146, 44];
        set.set(`${cx + x},${cy + y}`, c);
      }
    }
  };
  const spots = {
    1: [[10, 16], [18, 17], [14, 13]],
    2: [[7, 17], [15, 18], [22, 16], [11, 14], [19, 13], [15, 10]],
    3: [[5, 18], [12, 19], [20, 19], [26, 17], [8, 15], [16, 15], [23, 14], [11, 11], [19, 11], [15, 8], [15, 5]],
  }[stage];
  // Soft shadow under the pile.
  for (let y = 15; y < H; y++)
    for (let x = 0; x < W; x++) if (((x - 15) / 14) ** 2 + ((y - 19) / 3.2) ** 2 <= 1) set.set(`${x},${y}`, shadow);
  spots.forEach(([x, y]) => coin(x, y));
  return bake(scene, key, W, H, (x, y) => set.get(`${x},${y}`) || null);
}

// Floor dirt: a puddle or a bit of litter.
export function bakeDirt(scene, key, kind) {
  if (kind === 'puddle') {
    return bake(scene, key, 26, 12, (x, y) => {
      const d = ((x - 12.5) / 12.5) ** 2 + ((y - 6) / 5.5) ** 2;
      const blob = d + 0.18 * Math.sin(x * 0.9) * Math.cos(y * 1.3);
      if (blob > 1) return null;
      if ((x - 8) ** 2 / 9 + (y - 4) ** 2 < 1.2) return [235, 245, 250, 200];
      return blob > 0.72 ? [60, 100, 140, 190] : [100, 150, 195, 165];
    });
  }
  const set = new Map();
  const P = (x, y, c) => set.set(`${x},${y}`, c);
  // Crumpled paper ball.
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) if ((x - 3) ** 2 + (y - 3) ** 2 <= 10) P(x + 1, y + 2, (x + y) % 3 ? [236, 232, 220] : [196, 190, 176]);
  // Candy wrapper.
  for (let x = 10; x < 16; x++) for (let y = 6; y < 9; y++) P(x, y, x === 10 || x === 15 ? [200, 60, 60] : [230, 90, 70]);
  P(12, 7, [250, 220, 120]);
  return bake(scene, key, 17, 11, (x, y) => set.get(`${x},${y}`) || null);
}

// A janitor's mop and bucket.
export function bakeMop(scene, key) {
  const set = new Map();
  const P = (x, y, c) => set.set(`${x},${y}`, c);
  for (let y = 0; y < 24; y++) P(13 - Math.floor(y / 6), y, [140, 96, 56]); // handle
  for (let y = 22; y < 30; y++) for (let x = 6; x < 15; x++) if ((x + y) % 2 || y > 26) P(x, y, [214, 210, 196]); // mop head
  for (let y = 24; y < 33; y++) for (let x = 14; x < 24; x++) P(x, y, y === 24 || x === 14 || x === 23 ? [150, 110, 20] : [232, 186, 40]); // bucket
  for (let x = 15; x < 23; x++) P(x, 25, [120, 160, 190]);
  return bake(scene, key, 24, 33, (x, y) => set.get(`${x},${y}`) || null);
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

// Optional looks. look = { bald, glasses: true | 'round' | 'shades', hat: true |
// 'sun' | 'cap' | 'top' | 'beret' | 'beanie' | 'straw' | 'crown', facial: 'stache' |
// 'curly' | 'goatee' | 'beard', unibrow, earpiece }. Returns new row maps.
// Hats are colored T (U for a band); facial hair is F.
export const HATS = { none: 'None', hardhat: 'Hard hat', cap: 'Baseball cap', top: 'Top hat', beret: 'Beret', beanie: 'Beanie', straw: 'Straw hat', sun: 'Sun hat', crown: 'Flower crown', laurel: 'Laurel wreath', bicorne: 'Bicorne' };
export const FACIAL = { none: 'None', stache: 'Mustache', curly: 'Curly mustache', goatee: 'Goatee', vandyke: 'Mustache + goatee', chinstrap: 'Chin beard', beard: 'Beard' };
export const GLASSES = { none: 'None', round: 'Round glasses', shades: 'Sunglasses' };

// Hairstyles beyond the default short cut. `pre` rows sit above the head.
export const HAIRSTYLES = { short: 'Short', part: 'Side part', buzz: 'Buzz cut', curly: 'Curly', long: 'Long', ponytail: 'Ponytail', bun: 'Bun', pigtails: 'Pigtails', bob: 'Bob', afro: 'Afro', mohawk: 'Mohawk', wild: 'Wild', bald: 'Bald' };
const widen = (out, r, ch) => out[r] && (out[r] = ['o', ch, ...out[r].slice(1, -1), ch, 'o']);
function hairStyle(out, view, hair, set, pre, setPre) {
  const mid = (r) => Math.floor(out[r].length / 2);
  const each = (r, fn) => out[r]?.forEach((c, i) => fn(c, i));
  if (hair === 'long') {
    if (view === 'down') {
      for (let r = 4; r <= 10; r++) widen(out, r, 'h');
      out[11] = [...'ohhwwwwhho'];
      set(12, 1, 'h');
      set(12, out[12].length - 2, 'h');
    } else if (view === 'side') {
      [8, 9, 10, 11].forEach((r) => [1, 2].forEach((i) => set(r, i, 'h')));
    } else {
      for (let r = 8; r <= 11; r++) each(r, (c, i) => c !== 'o' && (out[r][i] = 'h'));
      each(12, (c, i) => c !== 'o' && i > 2 && i < out[12].length - 3 && (out[12][i] = 'h'));
    }
  }
  if (hair === 'ponytail') {
    if (view === 'up') for (let r = 7; r <= 13; r++) [mid(r) - 1, mid(r)].forEach((i) => set(r, i, r % 3 === 0 ? 'H' : 'h'));
    if (view === 'side') [7, 8, 9, 10].forEach((r) => [1, 2].forEach((i) => set(r, i, 'h')));
    if (view === 'down') {
      set(3, 1, 'U');
      set(3, out[3].length - 2, 'U');
    }
  }
  if (hair === 'bun') setPre(view === 'side' ? ['oooo', 'ohhHo'] : ['ooooo', 'ohhHho']);
  if (hair === 'pigtails' && view !== 'side') {
    for (let r = 5; r <= 9; r++) widen(out, r, r === 5 ? 'U' : 'h');
    [6, 7, 8].forEach((r) => widen(out, r, 'h'));
  }
  if (hair === 'pigtails' && view === 'side') [6, 7, 8].forEach((r) => set(r, 1, 'h'));
  if (hair === 'afro') {
    setPre(view === 'side' ? ['oooooooo', 'ohhhhhhho'] : ['oooooooo', 'ohhhhhhhho']);
    for (let r = 0; r <= 8; r++) widen(out, r, 'h');
    for (let r = 1; r <= 4; r++) each(r, (c, i) => c === 'h' && (r + i) % 4 === 0 && (out[r][i] = 'H'));
  }
  if (hair === 'curly') {
    for (let r = 1; r <= 3; r++) widen(out, r, 'h');
    for (let r = 1; r <= (view === 'up' ? 8 : 5); r++) each(r, (c, i) => c === 'h' && (r * 2 + i) % 3 === 0 && (out[r][i] = 'H'));
  }
  if (hair === 'mohawk') {
    setPre(view === 'side' ? ['oooooo', 'ohhhho'] : ['oooo', 'ohho']);
    for (let r = 1; r <= (view === 'up' ? 10 : 3); r++)
      each(r, (c, i) => {
        if (c !== 'h' && c !== 'H') return;
        const keep = view === 'side' ? r === 1 : Math.abs(i - (out[r].length - 1) / 2) < 1.5;
        if (!keep) out[r][i] = 's';
      });
    if (view === 'side') for (let r = 2; r <= 8; r++) each(r, (c, i) => (c === 'h' || c === 'H') && (out[r][i] = 's'));
  }
  if (hair === 'buzz') {
    for (let r = 1; r <= (view === 'up' ? 9 : 3); r++) each(r, (c, i) => (c === 'h' || c === 'H') && (out[r][i] = (r + i) % 2 ? 'H' : 'h'));
    if (view !== 'up') [4, 5].forEach((r) => each(r, (c, i) => c === 'h' && i > 1 && i < out[r].length - 2 && (out[r][i] = 's')));
  }
  if (hair === 'part' && view === 'down') {
    set(4, 3, 'h');
    set(4, 4, 'h');
    set(2, 4, 'S');
    set(1, 4, 'S');
  }
  void pre;
}

// Outfit styles. c = jacket or main color, w = shirt, g = tie or accent.
export const OUTFITS = { suit: 'Suit & tie', vest: 'Waistcoat', sweater: 'Sweater', tee: 'T-shirt', hoodie: 'Hoodie', coat: 'Long coat', apron: 'Apron', dress: 'Dress', gown: 'Gown', toga: 'Toga' };
function outfit(out, view, style, set) {
  if (!style || style === 'suit') return;
  const swap = (rows, from, to) => rows.forEach((r) => out[r]?.forEach((c, i) => from.includes(c) && (out[r][i] = to)));
  const torso = [12, 13, 14, 15, 16, 17];
  const len = (r) => out[r].length;
  const mid = (r) => Math.floor(len(r) / 2);
  if (['tee', 'sweater', 'hoodie', 'dress', 'gown', 'toga'].includes(style)) swap(torso, ['w', 'g'], 'c');
  if (style === 'tee' && view !== 'up') swap([11], ['w'], 's');
  if (style === 'sweater' && view !== 'up') swap([20], ['c'], 'd');
  if (style === 'hoodie') {
    swap([11], ['w'], 'c');
    if (view === 'down') [12, 13, 14].forEach((r) => [mid(r) - 2, mid(r) + 1].forEach((i) => set(r, i, 'w')));
    if (view === 'up') [9, 10].forEach((r) => out[r].forEach((c, i) => c === 'S' && (out[r][i] = 'c')));
  }
  if (style === 'vest') for (let r = 12; r <= 19; r++) [1, len(r) - 2].forEach((i) => ['C', 'd', 'c'].includes(out[r][i]) && set(r, i, 'w'));
  if (style === 'coat') for (let r = 21; r <= 23; r++) [1, 2, len(r) - 3, len(r) - 2].forEach((i, k) => set(r, i, k === 0 ? 'C' : k === 3 ? 'd' : 'c'));
  if (style === 'apron' && view === 'down') for (let r = 13; r <= 23; r++) for (let i = 3; i < len(r) - 3; i++) if (out[r][i] !== 'o' && out[r][i] !== 's') out[r][i] = 'g';
  if (style === 'apron' && view === 'side') for (let r = 13; r <= 23; r++) set(r, len(r) - 2, 'g');
  if (['dress', 'toga'].includes(style)) {
    swap([21, 22], ['p'], 'c');
    widen(out, 22, 'c');
    swap([23, 24], ['p'], 's');
  }
  if (style === 'gown') {
    swap([21, 22, 23, 24], ['p'], 'c');
    [22, 23, 24].forEach((r) => widen(out, r, r === 24 ? 'd' : 'c'));
    [22, 23, 24].forEach((r) => out[r].forEach((c, i) => c === 'o' && i > 0 && i < len(r) - 1 && (out[r][i] = 'c')));
  }
  if (style === 'toga') {
    if (view !== 'side') for (let r = 12; r <= 20; r++) set(r, view === 'down' ? 3 + (r - 12) : len(r) - 4 - (r - 12), 'g'); // a sash over one shoulder
    if (view === 'down') [12, 13].forEach((r) => [len(r) - 3, len(r) - 2].forEach((i) => set(r, i, 's')));
    if (view === 'side') [13, 14].forEach((r) => set(r, len(r) - 3, 'g'));
  }
}

// Accessories, in color X (bag in K).
export const ACCESSORIES = { none: 'None', scarf: 'Scarf', bowtie: 'Bow tie', necklace: 'Necklace', badge: 'Badge', bag: 'Shoulder bag', camera: 'Camera' };
function accessory(out, view, acc, set) {
  if (!acc || acc === 'none') return;
  const len = (r) => out[r].length;
  const mid = (r) => Math.floor(len(r) / 2);
  if (acc === 'scarf') {
    out[11] = out[11].map((c) => (c === 'o' ? c : 'X'));
    if (view === 'down') [12, 13, 14].forEach((r) => set(r, mid(r) - 3, 'X'));
    if (view === 'side') [12, 13].forEach((r) => set(r, len(r) - 3, 'X'));
  }
  if (acc === 'bowtie' && view === 'down') {
    [mid(11) - 1, mid(11)].forEach((i) => set(11, i, 'X'));
    [mid(12) - 2, mid(12) + 1].forEach((i) => set(12, i, 'X'));
    [mid(12) - 1, mid(12)].forEach((i) => set(12, i, 'w'));
  }
  if (acc === 'necklace' && view === 'down') {
    [mid(12) - 2, mid(12) + 1].forEach((i) => set(12, i, 'Y'));
    [mid(13) - 1, mid(13)].forEach((i) => set(13, i, 'Y'));
  }
  if (acc === 'badge' && view === 'down') [14, 15].forEach((r) => set(r, 3, 'Y'));
  if (acc === 'bag') {
    if (view === 'down') for (let r = 12; r <= 19; r++) set(r, len(r) - 3 - (r - 12), 'K');
    if (view === 'up') for (let r = 12; r <= 19; r++) set(r, 2 + (r - 12), 'K');
    if (view === 'side') [17, 18, 19, 20].forEach((r) => [1, 2, 3].forEach((i) => set(r, i, r === 17 ? 'k' : 'K')));
  }
  if (acc === 'camera') {
    if (view === 'down') {
      [15, 16].forEach((r) => [mid(r) - 2, mid(r) - 1, mid(r), mid(r) + 1].forEach((i) => set(r, i, 'k')));
      set(15, mid(15), 'Q');
      for (let r = 11; r <= 14; r++) [mid(r) - 3, mid(r) + 2].forEach((i) => set(r, i, 'k'));
    }
    if (view === 'side') [15, 16].forEach((r) => [len(r) - 3, len(r) - 2].forEach((i) => set(r, i, 'k')));
  }
}

function withLooks(rows, view, look) {
  let out = rows.map((r) => [...r]);
  const inner = (r, from, to, test, ch) => {
    for (let i = from; i < out[r].length - to; i++) if (test(out[r][i])) out[r][i] = ch;
  };
  const skin = (c) => c === 's' || c === 'S';
  const set = (r, i, ch) => out[r] && i >= 0 && i < out[r].length && out[r][i] !== 'o' && (out[r][i] = ch);
  if (look.bald) {
    const last = view === 'up' ? 6 : 3;
    for (let r = 1; r <= last; r++) inner(r, view === 'side' ? 4 : 2, 2, (c) => c === 'h' || c === 'H', 's');
    out[1][Math.floor(out[1].length / 2) - 1] = 'Q'; // shine
  }
  const glasses = look.glasses === true ? 'round' : look.glasses;
  if (glasses === 'round' && view !== 'up') {
    for (const r of [6, 7]) {
      out[r].forEach((c, i) => {
        if (c !== 'e') return;
        [i - 1, i + 1].forEach((j) => out[r][j] === 's' && (out[r][j] = 'k'));
        if (r === 6) [i - 1, i, i + 1].forEach((j) => out[5][j] === 's' && (out[5][j] = 'k'));
      });
    }
  }
  if (glasses === 'shades' && view !== 'up') {
    // dark lenses across both eyes, with a glint
    const row = out[6];
    const eyes = row.map((c, i) => (c === 'e' ? i : -1)).filter((i) => i >= 0);
    if (eyes.length) {
      for (let i = Math.max(1, eyes[0] - 1); i <= Math.min(row.length - 2, eyes.at(-1) + 1); i++) set(6, i, 'k');
      eyes.forEach((i) => [i - 1, i, i + 1].forEach((j) => out[7][j] && skin(out[7][j]) || out[7][j] === 'e' ? set(7, j, 'k') : null));
      set(6, eyes[0], 'Q');
    }
  }
  if (look.unibrow && view !== 'up') {
    const eyes = out[6].map((c, i) => (c === 'e' ? i : -1)).filter((i) => i >= 0);
    if (eyes.length) for (let i = eyes[0] - 1; i <= eyes.at(-1) + 1; i++) if (skin(out[5][i] || '')) out[5][i] = 'e';
  }
  // Face details: freckles, rosy cheeks, earrings.
  if (look.freckles && view === 'down') {
    [[9, 2], [9, 4], [9, -3], [9, -5], [8, 3], [8, -4]].forEach(([r, i]) => set(r, i < 0 ? out[r].length + i : i, 'Z'));
  }
  if (look.blush && view !== 'up') {
    if (view === 'down') [[8, 1], [8, 2], [8, -2], [8, -3]].forEach(([r, i]) => set(r, i < 0 ? out[r].length + i : i, 'M'));
    else set(8, out[8].length - 4, 'M');
  }
  if (look.earrings) {
    if (view === 'down') {
      set(9, 1, 'Y');
      set(9, out[9].length - 2, 'Y');
    } else if (view === 'side') set(9, 3, 'Y');
  }
  if (look.earpiece) {
    if (view === 'side') set(7, 3, 'k');
    else if (view === 'down') {
      set(7, 1, 'k');
      set(8, 1, 'k');
    }
  }
  if (look.facial && look.facial !== 'none' && view !== 'up') {
    const front = view === 'down';
    const mid = front ? Math.floor(out[9].length / 2) : out[9].length - 4;
    const stache = (w) => {
      for (let i = mid - w; i < mid + w; i++) if (skin(out[9][i] || '')) out[9][i] = 'F';
    };
    if (look.facial === 'stache') stache(front ? 2 : 2);
    if (look.facial === 'curly') {
      stache(front ? 3 : 2);
      if (front) {
        if (skin(out[8][mid - 4] || '')) out[8][mid - 4] = 'F';
        if (skin(out[8][mid + 3] || '')) out[8][mid + 3] = 'F';
      } else if (skin(out[8][mid + 2] || '')) out[8][mid + 2] = 'F';
    }
    if (look.facial === 'goatee' || look.facial === 'vandyke') for (let i = mid - 1; i < mid + 1; i++) if (skin(out[10][i] || '')) out[10][i] = 'F';
    if (look.facial === 'vandyke') stache(2);
    if (look.facial === 'chinstrap') {
      // a beard along the jaw, no mustache
      inner(10, 0, 0, skin, 'F');
      if (front) {
        [8, 9].forEach((r) => {
          set(r, 1, 'F');
          set(r, out[r].length - 2, 'F');
        });
      } else [8, 9].forEach((r) => set(r, 3, 'F'));
    }
    if (look.facial === 'beard') {
      [9, 10].forEach((r) => inner(r, 0, 0, skin, 'F'));
      [7, 8].forEach((r) => {
        // sideburns down to the jaw
        if (front) {
          set(r, 1, 'F');
          set(r, out[r].length - 2, 'F');
        } else set(r, 3, 'F');
      });
    }
  }
  let pre = [];
  if (look.hair === 'wild') {
    // hair sticking out every which way
    pre = view === 'side' ? ['o.o.o.o', 'ohohohho'] : ['o.o..o.o', 'ohoohhooho'];
    out[1] = [...'ohhhhhhhhhhhho'];
    out[2] = [...'ohhhhhhhhhhhho'];
  }
  if (look.hair === 'bob' && view !== 'up') {
    // straight black bob with a gold band and bangs
    out[2] = [...'oUUUUUUUUUUo'];
    if (view === 'down') out[4] = [...'ohhhhhhhhhho'];
    for (let r = 5; r <= 10; r++) {
      if (view === 'down') {
        set(r, 1, 'h');
        set(r, out[r].length - 2, 'h');
      } else set(r, 3, 'h');
    }
  }
  if (look.hair === 'bob' && view === 'up') out[2] = [...'oUUUUUUUUUUo'];
  if (look.collar === 'ruff' && view !== 'up') out[11] = [...'owwwwwwwwwwo']; // a frilly white ruff
  hairStyle(out, view, look.hair, set, pre, (p) => (pre = p));
  outfit(out, view, look.outfit, set);
  accessory(out, view, look.acc, set);
  if (look.phone && view === 'down') {
    // holding a phone up to look at it
    const mid = Math.floor(out[17].length / 2);
    [16, 17].forEach((r) => [mid - 1, mid].forEach((i) => set(r, i, 'k')));
    set(16, mid - 1, 'Q');
    set(18, mid - 2, 's');
    set(18, mid + 1, 's');
  }
  const hat = look.hat === true ? 'sun' : look.hat;
  const put = (r, row) => (out[r] = [...row]);
  if (hat === 'sun') {
    put(0, 'oooooooo');
    put(1, 'oTTTTTTTTo');
    put(2, 'oTTTTTTTTTTTTTTo');
  } else if (hat === 'cap') {
    put(0, 'oooooooo');
    put(1, 'oTTTTTTTTo');
    put(2, 'oTTTTTTTTTTo');
    if (view === 'down') put(3, 'oUUUUUUUUUUo');
    if (view === 'side') put(3, 'oTTTTTTTTUUUUo');
  } else if (hat === 'top') {
    pre = ['oooooooo', 'oTTTTTTo', 'oTTTTTTo', 'oUUUUUUo'];
    put(0, 'oTTTTTTTTTTTTo');
  } else if (hat === 'beret') {
    pre = ['oo'];
    put(0, 'oooooooooo');
    put(1, 'oTTTTTTTTTTo');
    put(2, 'oTTTTTTTTTTTTo');
  } else if (hat === 'beanie') {
    pre = ['oTo'];
    put(0, 'oooooooo');
    put(1, 'oTTTTTTTTo');
    put(2, 'oTTTTTTTTTTo');
    put(3, 'oUUUUUUUUUUo');
  } else if (hat === 'straw') {
    pre = ['oooooooo', 'oTTTTTTTTo'];
    put(0, 'oUUUUUUUUo');
    put(1, 'oTTTTTTTTTTTTTTTTo');
  } else if (hat === 'hardhat') {
    // a yellow safety helmet with a brim and a center ridge
    pre = ['oooooo'];
    put(0, 'oTTTTTTTTo');
    put(1, 'oTTTTUTTTTTo');
    put(2, 'oUUUUUUUUUUUUo');
  } else if (hat === 'laurel') {
    const r1 = out[1];
    for (let i = 1; i < r1.length - 1; i++) r1[i] = i % 2 ? 'G' : 'L';
    if (view !== 'up') {
      set(2, 1, 'G');
      set(2, out[2].length - 2, 'G');
    }
  } else if (hat === 'bicorne') {
    pre = view === 'side' ? ['oooooo', 'oTTTTTTo', 'oTTTTTTTTo'] : ['oooooooooooo', 'oTTTTUUTTTTo', 'oTTTTTTTTTTTTTTo'];
    put(0, view === 'side' ? 'oTTTTTTTTTTo' : 'oooooooooooooooo');
  } else if (hat === 'topknot') {
    pre = ['oooo', 'ohhho'];
  } else if (hat === 'crown') {
    const r1 = out[1];
    for (let i = 1; i < r1.length - 1; i++) r1[i] = ['R', 'G', 'Y', 'G'][i % 4];
  }
  return [...pre, ...out.map((r) => r.join(''))];
}

// Colors for the looks above.
const LOOK_PAL = { T: '#e8d8a0', U: '#5a3b2c', R: '#e0506a', Y: '#f2d36b', G: '#4f8a4a', L: '#7fb06a', Q: '#ffffff', X: '#c0392b', K: '#6a4a2a', M: '#e8908a' };

const toHexEarly = (v) => '#' + v.map((n) => Math.round(Math.min(255, n)).toString(16).padStart(2, '0')).join('');

// One character = three views: `${prefix}_down`, `_up`, `_side` (faces right),
// each with two walking frames (`_down_1`, `_down_2`...), plus `_phone` and `_sit`.
export function makeCharacter(scene, prefix, colors = {}, look = {}) {
  const pal = { ...PAL, k: '#1d1714', ...LOOK_PAL, ...colors };
  if (!pal.F) pal.F = colors.h ? toHexEarly(shade(hex(colors.h), 0.85)) : '#3a2418'; // facial hair follows the hair
  const toHex = (v) => '#' + v.map((n) => Math.round(Math.min(255, n)).toString(16).padStart(2, '0')).join('');
  // Shading shades are derived from the main colors.
  if (colors.c) {
    pal.C = toHex(mix(hex(colors.c), WHITE, 0.2));
    pal.d = toHex(shade(hex(colors.c), 0.75));
  }
  if (colors.h && !colors.H) pal.H = toHex(mix(hex(colors.h), WHITE, 0.22));
  if (colors.s && !colors.S) pal.S = toHex(shade(hex(colors.s), 0.85));
  pal.Z = toHex(shade(hex(pal.s), 0.72)); // freckles
  sprite(scene, `${prefix}_down`, withLooks(FRONT, 'down', look), pal);
  sprite(scene, `${prefix}_up`, withLooks(BACK, 'up', look), pal);
  sprite(scene, `${prefix}_side`, withLooks(SIDE, 'side', look), pal);
  // Walking: two step frames per view.
  [['down', FRONT], ['up', BACK], ['side', SIDE]].forEach(([view, rows]) => {
    const [a, b] = stepFrames(withLooks(rows, view, look), view);
    sprite(scene, `${prefix}_${view}_1`, a, pal);
    sprite(scene, `${prefix}_${view}_2`, b, pal);
  });
  sprite(scene, `${prefix}_phone`, withLooks(FRONT, 'down', { ...look, phone: true }), pal);
  // Sitting: the legs fold forward under the body.
  const sit = withLooks(FRONT, 'down', look);
  const legs = sit.length - 6; // the pants and shoes rows
  sprite(scene, `${prefix}_sit`, [...sit.slice(0, legs), sit[legs], sit[legs + 1].replace(/oo(?=p)/, 'pp'), sit[sit.length - 2], sit[sit.length - 1]], pal);
}

// Step frames for walking. Facing front or back, one foot lifts off the
// ground (left, then right); from the side, the legs open into a stride.
// Rows are spread to the full tile width first so every row lines up.
function stepFrames(rows, view) {
  const abs = rows.map((r) => {
    const off = Math.floor((T - r.length) / 2);
    return Array.from({ length: T }, (_, x) => r[x - off] ?? '.');
  });
  const n = abs.length; // n-1: bottom outline, n-2: shoes, n-3..n-6: legs
  const copy = () => abs.map((r) => [...r]);
  const out = (a) => a.map((r) => r.join(''));
  if (view === 'side') {
    const a = copy();
    [n - 4, n - 3, n - 2].forEach((i) => {
      const xs = a[i].map((c, x) => (c !== '.' && c !== 'o' ? x : -1)).filter((x) => x >= 0);
      if (xs.length < 4) return;
      const mid = Math.floor((xs[0] + xs[xs.length - 1]) / 2);
      a[i][mid] = 'o';
      a[i][mid + 1] = 'o';
    });
    // the back foot lifts a little
    const shoes = a[n - 2].map((c, x) => (c !== '.' && c !== 'o' ? x : -1)).filter((x) => x >= 0);
    if (shoes.length) {
      const back = shoes[0];
      for (let x = back - 1; x < back + 2; x++) {
        a[n - 1][x] = '.';
        if (a[n - 2][x] !== '.') a[n - 1][x] = a[n - 2][x] === 'o' ? '.' : 'o';
      }
    }
    return [out(a), out(a)];
  }
  const lift = (left) => {
    const a = copy();
    for (let x = 0; x < T; x++) {
      if (left ? x >= T / 2 : x < T / 2) continue;
      a[n - 3][x] = abs[n - 2][x] === '.' ? abs[n - 3][x] : abs[n - 2][x];
      a[n - 2][x] = abs[n - 1][x];
      a[n - 1][x] = '.';
    }
    return out(a);
  };
  return [lift(true), lift(false)];
}

// "!" bubble shown when something is in reach.
const BUBBLE = [
  '..ooooooo..', '.owwwwwwwo.', 'owwwwwwwwwo', 'owwwwoowwwwo', 'owwwwoowwwo', 'owwwwoowwwo', 'owwwwoowwwo',
  'owwwwwwwwwo', 'owwwwoowwwo', 'owwwwwwwwwo', '.owwwwwwwo.', '..oooooo...', '...ooo.....', '...oo......',
].map((r) => r.slice(0, 11).padEnd(11, '.'));

// Little emote bubbles over people's heads: heart, !, ?, zzz, music, star.
const EMOTE_BOX = ['.ooooooooo.', 'owwwwwwwwwo', 'owwwwwwwwwo', 'owwwwwwwwwo', 'owwwwwwwwwo', 'owwwwwwwwwo', 'owwwwwwwwwo', 'owwwwwwwwwo', 'owwwwwwwwwo', '.oooo.oooo.', '....owo....', '.....o.....'];
const EMOTE_ICONS = {
  heart: ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...', '.......'],
  bang: ['...k...', '...k...', '...k...', '...k...', '.......', '...k...', '.......'],
  q: ['..kkk..', '.k...k.', '.....k.', '...kk..', '...k...', '.......', '...k...'],
  zzz: ['kkkk...', '..k....', '.k.....', 'kkkkkk.', '....k..', '...k...', '..kkkk.'],
  note: ['...kkk.', '...k.k.', '...k.k.', '...k.k.', '.kkk.k.', 'kkkk.k.', '.kk..k.'],
  star: ['...Y...', '..YYY..', 'YYYYYYY', '.YYYYY.', '.YY.YY.', 'Y.....Y', '.......'],
};
export function makeEmotes(scene) {
  const col = { o: '#1d1714', w: '#fff8e6', k: '#2a1a14', R: '#e0405a', Y: '#e8b02a' };
  Object.entries(EMOTE_ICONS).forEach(([id, icon]) => {
    if (scene.textures.exists(`emote_${id}`)) return;
    bake(scene, `emote_${id}`, 11, EMOTE_BOX.length, (x, y) => {
      const ic = icon[y - 1]?.[x - 2];
      if (ic && ic !== '.' && y >= 1 && y <= 7) return hex(col[ic]);
      const ch = EMOTE_BOX[y][x];
      return ch && ch !== '.' ? hex(col[ch]) : null;
    });
  });
}

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
    case 'obelisk': {
      const SAND = '#d9b878';
      const SAND_D = '#a8864a';
      shadow(16, gy, 10, 3);
      box(7, gy - 8, 18, 8, SAND_D, OUT);
      for (let y = gy - 62; y < gy - 8; y++) {
        const t = (y - (gy - 62)) / 54;
        const hw = 3 + t * 4;
        R(16 - hw, y, hw * 2, 1, SAND);
        R(16 + hw - 2, y, 2, 1, SAND_D);
      }
      R(14, gy - 66, 4, 4, '#e0bc55');
      [[14, 24], [13, 36], [15, 46]].forEach(([x, dy]) => R(x, gy - dy, 3, 2, '#7a5a2a'));
      break;
    }
    case 'canopic':
      shadow(16, gy, 13, 3);
      R(3, gy - 6, 26, 5, WOOD_D);
      [5, 11, 17, 23].forEach((x, i) => {
        R(x, gy - 18, 5, 12, '#e8dcc0');
        R(x + 3, gy - 18, 2, 12, '#c4b48c');
        R(x - 1, gy - 22, 7, 4, ['#3d6fb6', '#c9a23f', '#4f8a3a', '#b0413e'][i]);
      });
      break;
    case 'cherry':
      for (let y = gy - 30; y < gy - 9; y++) R(15, y, 3, 1, '#5c3a26');
      E(16, gy - 40, 13, 11, '#d47a96');
      E(12, gy - 43, 7, 5, '#f2a8bc');
      E(21, gy - 37, 5, 4, '#f2a8bc');
      for (let k = 0; k < 14; k++) R(4 + hash(k, 1, 33) * 24, gy - 50 + hash(k, 2, 33) * 20, 1, 1, '#fff0f4');
      box(9, gy - 9, 14, 9, '#a85a32', '#7a3f22');
      break;
    case 'lantern': {
      const G = '#9a968f';
      const GL = '#c8c4bc';
      const GD = '#6b6862';
      shadow(16, gy, 9, 3);
      R(10, gy - 6, 12, 5, GD);
      R(14, gy - 18, 4, 12, G);
      R(8, gy - 21, 16, 3, GL);
      box(10, gy - 31, 12, 10, G, OUT);
      R(13, gy - 28, 6, 5, '#ffcf70');
      E(16, gy - 26, 10, 7, 'rgba(255,200,110,0.18)');
      for (let y = 0; y < 5; y++) R(6 + y, gy - 36 + y, 20 - 2 * y, 1, y ? G : GL);
      R(15, gy - 39, 2, 3, GD);
      break;
    }
    case 'bonsai':
      shadow(16, gy, 12, 3);
      box(5, gy - 6, 22, 5, '#3d5a7a', OUT);
      R(15, gy - 14, 2, 8, '#5c3a26');
      R(12, gy - 12, 4, 2, '#5c3a26');
      E(11, gy - 16, 6, 3, '#4f8a3a');
      E(20, gy - 18, 6, 3, '#2f5a24');
      E(16, gy - 21, 5, 3, '#7cb85a');
      break;
    case 'trex': {
      const B = '#e8dcc0';
      const BD = '#b8a888';
      shadow(48, gy - 4, 46, 8);
      box(4, gy - 10, 88, 8, '#6b6862', OUT);
      // legs
      [[40, 0], [52, 0]].forEach(([x]) => {
        R(x, gy - 34, 4, 24, B);
        R(x - 2, gy - 12, 8, 2, BD);
      });
      // spine and tail
      for (let x = 10; x < 70; x++) {
        const y = gy - 40 - Math.sin(((x - 10) / 60) * Math.PI) * 8 + (x < 30 ? (30 - x) * 0.3 : 0);
        R(x, y, 1, 3, B);
        if (x % 4 === 0 && x > 28) R(x, y + 3, 1, 8, BD); // ribs
      }
      // skull
      box(66, gy - 58, 22, 12, B, OUT);
      R(80, gy - 50, 8, 4, BD);
      for (let x = 70; x < 88; x += 3) R(x, gy - 46, 1, 2, '#fffaf0');
      R(70, gy - 55, 4, 3, '#3a2a1a');
      R(62, gy - 48, 6, 6, B); // neck
      R(62, gy - 38, 8, 2, BD); // tiny arm
      break;
    }
    case 'meteorite':
      shadow(16, gy, 10, 3);
      box(9, gy - 14, 14, 14, MARBLE, OUT);
      R(19, gy - 14, 4, 14, MARBLE_D);
      E(16, gy - 20, 9, 7, '#2a2a2e');
      E(14, gy - 22, 4, 3, '#4a4a52');
      R(19, gy - 19, 2, 2, '#6a6a76');
      R(12, gy - 17, 1, 1, '#c9a23f');
      break;
    case 'telescope':
      shadow(16, gy, 11, 3);
      [[8, 1], [16, 0], [24, -1]].forEach(([x]) => {
        for (let t = 0; t < 18; t++) R(x + (16 - x) * (t / 18), gy - 2 - t, 1, 1, WOOD_D);
      });
      for (let t = 0; t < 26; t++) R(6 + t, gy - 22 - t * 0.5, 4, 4, t > 20 ? '#7a5a1e' : BRASS);
      R(4, gy - 24, 3, 6, '#5b4216');
      break;
    case 'specimens':
      box(4, gy - 36, 24, 34, WOOD_D, OUT);
      R(4, gy - 20, 24, 2, WOOD);
      [[7, gy - 34], [15, gy - 34], [22, gy - 33], [7, gy - 18], [14, gy - 18], [21, gy - 17]].forEach(([x, y], i) => {
        R(x, y, 5, 12, ['#7ab870', '#c8b860', '#8ab0c0', '#b8c870', '#c89070', '#90c0a0'][i]);
        R(x, y, 5, 2, '#d8d0c0');
        R(x + 1, y + 4, 2, 3, 'rgba(60,40,30,0.5)');
      });
      break;
    case 'pumpkin':
      shadow(16, gy, 11, 3);
      E(16, gy - 9, 12, 9, OUT);
      E(16, gy - 9, 11, 8, '#e8702a');
      [10, 16, 22].forEach((x) => R(x, gy - 16, 1, 14, '#c0501a'));
      R(15, gy - 21, 3, 5, '#4f7a3a');
      // a carved face, lit from inside
      [[11, 12], [19, 12]].forEach(([x, y]) => R(x, gy - y, 3, 3, '#ffd860'));
      R(11, gy - 6, 11, 2, '#ffd860');
      R(13, gy - 7, 2, 1, '#ffd860');
      R(18, gy - 7, 2, 1, '#ffd860');
      break;
    case 'xmas_tree':
      shadow(16, gy, 12, 3);
      box(12, gy - 7, 8, 6, '#b0413e', OUT);
      [[gy - 12, 13], [gy - 22, 11], [gy - 32, 9], [gy - 41, 6]].forEach(([y, w]) => {
        for (let k = 0; k < 10; k++) {
          const half = Math.round((w * (k + 3)) / 12);
          R(16 - half - 1, y - 10 + k, half * 2 + 2, 1, OUT);
          R(16 - half, y - 10 + k, half * 2, 1, k < 3 ? '#3c9048' : '#2e7842');
        }
      });
      [[10, 14, '#e0405a'], [21, 16, '#f2d36b'], [14, 24, '#5aa8e0'], [19, 30, '#e0405a'], [12, 34, '#f2d36b'], [17, 20, '#ffffff']].forEach(([x, y, c]) => R(x, gy - y, 2, 2, c));
      E(16, gy - 52, 3, 3, '#f2d36b');
      R(16, gy - 56, 1, 2, '#fff4a0');
      break;
    case 'gifts':
      shadow(16, gy, 12, 3);
      [[5, 12, 12, '#3a78c8', '#f2d36b'], [16, 10, 11, '#e0405a', '#ffffff'], [10, 20, 9, '#6fd07a', '#e0405a']].forEach(([x, h, w, c, rib]) => {
        box(x, gy - h - (x === 10 ? 10 : 0), w, h, c, OUT);
        const y0 = gy - h - (x === 10 ? 10 : 0);
        R(x + Math.floor(w / 2) - 1, y0, 2, h, rib);
        R(x, y0 + Math.floor(h / 2) - 1, w, 2, rib);
        R(x + Math.floor(w / 2) - 3, y0 - 2, 3, 2, rib);
        R(x + Math.floor(w / 2), y0 - 2, 3, 2, rib);
      });
      break;
    case 'flower_basket':
      shadow(16, gy, 11, 3);
      box(7, gy - 11, 18, 10, '#c8a070', OUT);
      for (let x = 8; x < 25; x += 3) R(x, gy - 11, 1, 10, '#a07a4a');
      R(7, gy - 22, 2, 12, '#a07a4a');
      R(23, gy - 22, 2, 12, '#a07a4a');
      R(7, gy - 23, 18, 2, '#a07a4a');
      [[10, 14, '#f4b8d0'], [14, 16, '#f2d36b'], [18, 14, '#ffffff'], [22, 15, '#b06ae0'], [12, 18, '#e0405a'], [19, 18, '#f4b8d0']].forEach(([x, y, c]) => {
        R(x - 1, gy - y, 3, 3, c);
        R(x, gy - y + 1, 1, 1, '#f2d36b');
      });
      break;
    case 'display_case':
      // a glass case of jewels on a dark wood stand
      shadow(16, gy, 12, 3);
      box(6, gy - 14, 20, 13, WOOD_D, OUT);
      R(7, gy - 12, 18, 2, WOOD);
      box(5, gy - 30, 22, 16, 'rgba(200,230,245,0.45)', OUT);
      R(6, gy - 29, 20, 2, 'rgba(255,255,255,0.6)');
      R(8, gy - 18, 16, 3, '#7a2232');
      [[10, '#e0405a'], [15, '#5aa8e0'], [20, '#6fd07a']].forEach(([x, c]) => {
        E(x + 1, gy - 20, 2, 2, c);
        R(x, gy - 21, 1, 1, '#ffffff');
      });
      E(16, gy - 25, 3, 2, BRASS_L);
      break;
    case 'ship_model':
      shadow(32, gy, 28, 4);
      box(6, gy - 10, 52, 9, WOOD_D, OUT);
      box(4, gy - 40, 56, 30, 'rgba(200,230,245,0.35)', OUT);
      R(5, gy - 39, 54, 2, 'rgba(255,255,255,0.5)');
      // the ship
      ctx.fillStyle = '#6a4428';
      ctx.beginPath();
      ctx.moveTo(12, gy - 20);
      ctx.lineTo(52, gy - 20);
      ctx.lineTo(46, gy - 13);
      ctx.lineTo(17, gy - 13);
      ctx.fill();
      [22, 32, 42].forEach((x, i) => {
        R(x, gy - 37 + i, 1, 17 - i, '#3a2418');
        R(x - 5 + i, gy - 35 + i, 10 - i * 2, 6, '#f4f0e6');
        R(x - 4 + i, gy - 28 + i, 8 - i * 2, 5, '#e8e2d4');
      });
      R(12, gy - 21, 40, 1, BRASS);
      break;
    case 'butterflies':
      shadow(16, gy, 11, 3);
      R(15, gy - 12, 2, 11, WOOD_D);
      box(5, gy - 36, 22, 24, '#f4ead6', OUT);
      R(5, gy - 36, 22, 2, WOOD);
      [[10, 28, '#3a78c8'], [20, 28, '#f2a03a'], [10, 19, '#e0405a'], [20, 19, '#6fd07a'], [15, 23, '#b06ae0']].forEach(([x, y, c]) => {
        R(x - 3, gy - y, 3, 3, c);
        R(x + 1, gy - y, 3, 3, c);
        R(x, gy - y - 1, 1, 5, OUT);
      });
      break;
    case 'fossil_slab':
      shadow(32, gy, 28, 4);
      box(4, gy - 26, 56, 25, '#c8b498', OUT);
      R(5, gy - 25, 54, 3, '#dccab0');
      for (let k = 0; k < 18; k++) R(8 + hash(k, 1, 77) * 48, gy - 22 + hash(k, 2, 77) * 18, 2, 1, '#b0987a');
      // an ammonite and a little fish skeleton
      E(18, gy - 14, 8, 7, '#8a7458');
      E(18, gy - 14, 6, 5, '#c8b498');
      E(18, gy - 14, 4, 3, '#8a7458');
      E(18, gy - 14, 2, 1, '#c8b498');
      R(32, gy - 15, 20, 1, '#6a5640');
      for (let x = 34; x < 50; x += 3) R(x, gy - 19, 1, 9, '#6a5640');
      R(51, gy - 18, 4, 7, '#6a5640');
      break;
    case 'gramophone':
      shadow(16, gy, 10, 3);
      box(8, gy - 12, 16, 11, WOOD, OUT);
      R(9, gy - 11, 14, 2, WOOD_L);
      E(16, gy - 13, 7, 2, '#1e1a20');
      R(14, gy - 26, 2, 13, BRASS);
      ctx.fillStyle = OUT;
      ctx.beginPath();
      ctx.moveTo(15, gy - 26);
      ctx.lineTo(4, gy - 44);
      ctx.lineTo(28, gy - 44);
      ctx.fill();
      ctx.fillStyle = BRASS;
      ctx.beginPath();
      ctx.moveTo(15, gy - 27);
      ctx.lineTo(6, gy - 43);
      ctx.lineTo(26, gy - 43);
      ctx.fill();
      E(16, gy - 43, 10, 2, BRASS_L);
      break;
    case 'idol':
      shadow(16, gy, 9, 3);
      box(9, gy - 16, 14, 15, MARBLE, OUT);
      R(10, gy - 15, 3, 13, MARBLE_D);
      R(7, gy - 18, 18, 3, MARBLE);
      // a little golden idol
      E(16, gy - 26, 5, 6, OUT);
      E(16, gy - 26, 4, 5, '#e0b040');
      E(16, gy - 33, 3, 3, OUT);
      E(16, gy - 33, 2, 2, '#f2d36b');
      R(14, gy - 27, 1, 1, OUT);
      R(17, gy - 27, 1, 1, OUT);
      R(14, gy - 28, 1, 3, '#fff4a0');
      break;
    case 'orchid':
      shadow(16, gy, 7, 2);
      box(11, gy - 9, 10, 8, '#f4f0e6', OUT);
      R(15, gy - 30, 1, 21, '#3c7a3a');
      R(11, gy - 12, 5, 2, '#4f8a3a');
      R(16, gy - 14, 6, 2, '#4f8a3a');
      [[17, 30], [19, 25], [18, 20]].forEach(([x, y]) => {
        R(x - 2, gy - y, 5, 3, '#e8a0d8');
        R(x - 1, gy - y - 1, 3, 5, '#f4c8ec');
        R(x, gy - y + 1, 1, 1, '#e0c040');
      });
      break;
    case 'banner':
      shadow(16, gy, 8, 3);
      R(9, gy - 4, 14, 3, BRASS);
      R(15, gy - 52, 2, 49, BRASS);
      E(16, gy - 53, 2, 2, BRASS_L);
      R(7, gy - 50, 18, 2, BRASS);
      box(8, gy - 48, 16, 26, '#7a2232', OUT);
      ctx.fillStyle = '#7a2232';
      ctx.beginPath();
      ctx.moveTo(8, gy - 22);
      ctx.lineTo(16, gy - 17);
      ctx.lineTo(24, gy - 22);
      ctx.fill();
      R(9, gy - 46, 14, 1, BRASS);
      E(16, gy - 36, 4, 4, BRASS);
      E(16, gy - 36, 2, 2, '#7a2232');
      break;
    case 'rug_round':
      E(32, gy - 14, 30, 14, OUT);
      E(32, gy - 14, 29, 13, '#7a2232');
      E(32, gy - 14, 25, 10, '#c9a23f');
      E(32, gy - 14, 23, 9, '#2e4a7a');
      E(32, gy - 14, 12, 5, '#c9a23f');
      E(32, gy - 14, 10, 4, '#7a2232');
      for (let a = 0; a < 12; a++) R(32 + Math.cos(a / 1.91) * 18, gy - 14 + Math.sin(a / 1.91) * 7, 2, 2, '#e8e2d4');
      break;
    case 'rug_long': {
      const w = rot ? 32 : 96;
      const h = rot ? 96 : 32;
      R(2, H - h + 2, w - 4, h - 4, OUT);
      R(3, H - h + 3, w - 6, h - 6, '#2e5a4a');
      R(6, H - h + 6, w - 12, h - 12, '#c9a23f');
      R(8, H - h + 8, w - 16, h - 16, '#2e5a4a');
      for (let k = 0; k < (rot ? 5 : 5); k++) {
        const cx = rot ? 16 : 16 + k * 16;
        const cy = rot ? H - h + 16 + k * 16 : H - 16;
        E(cx, cy, 4, 3, '#e8e2d4');
        E(cx, cy, 2, 1, '#7a2232');
      }
      break;
    }
    case 'piano':
      // a grand piano, lid up
      shadow(32, gy, 30, 4);
      [8, 52, 30].forEach((x) => R(x, gy - 10, 3, 9, '#141014'));
      box(4, gy - 20, 56, 10, '#1e1a20', OUT);
      R(6, gy - 19, 52, 2, '#3a3440');
      box(4, gy - 24, 34, 4, '#f4f0e6', OUT); // keys
      for (let x = 6; x < 38; x += 3) R(x, gy - 24, 1, 2, '#1e1a20');
      ctx.fillStyle = '#1e1a20';
      ctx.beginPath();
      ctx.moveTo(38, gy - 22);
      ctx.lineTo(60, gy - 40);
      ctx.lineTo(62, gy - 38);
      ctx.lineTo(60, gy - 20);
      ctx.closePath();
      ctx.fill();
      R(39, gy - 23, 20, 1, '#5a5060');
      R(16, gy - 30, 10, 6, '#f4f0e6'); // sheet music
      R(17, gy - 28, 8, 1, '#3a3440');
      break;
    case 'harp':
      shadow(16, gy, 9, 3);
      R(10, gy - 4, 13, 3, BRASS);
      R(10, gy - 44, 3, 41, BRASS);
      for (let k = 0; k < 12; k++) R(12 + k, gy - 44 + k * 2.4, 1, 1, BRASS_L);
      ctx.fillStyle = BRASS;
      ctx.beginPath();
      ctx.moveTo(11, gy - 46);
      ctx.quadraticCurveTo(20, gy - 50, 24, gy - 40);
      ctx.lineTo(24, gy - 4);
      ctx.lineTo(22, gy - 4);
      ctx.lineTo(22, gy - 40);
      ctx.quadraticCurveTo(18, gy - 46, 11, gy - 44);
      ctx.fill();
      for (let x = 14; x < 22; x += 2) R(x, gy - 40 + (x - 14), 1, 36 - (x - 14), 'rgba(255,248,220,0.8)');
      break;
    case 'easel': {
      shadow(16, gy, 10, 3);
      R(8, gy - 36, 2, 35, WOOD_D);
      R(22, gy - 36, 2, 35, WOOD_D);
      R(15, gy - 40, 2, 34, WOOD);
      R(6, gy - 14, 20, 2, WOOD);
      box(5, gy - 38, 22, 22, '#f4f0e6', OUT);
      // a painting in progress
      R(6, gy - 37, 20, 10, '#8ab0d8');
      R(6, gy - 27, 20, 10, '#6a9a4a');
      E(20, gy - 33, 3, 3, '#f2d36b');
      R(9, gy - 30, 4, 6, '#5a3a2a');
      break;
    }
    case 'clock':
      shadow(16, gy, 9, 3);
      box(8, gy - 52, 16, 51, WOOD_D, OUT);
      R(10, gy - 50, 12, 47, WOOD);
      E(16, gy - 42, 6, 6, OUT);
      E(16, gy - 42, 5, 5, '#f4f0e6');
      R(16, gy - 46, 1, 4, OUT);
      R(16, gy - 42, 3, 1, OUT);
      box(12, gy - 32, 8, 22, '#3a2418', OUT);
      R(15, gy - 30, 2, 12, BRASS);
      E(16, gy - 16, 3, 3, BRASS_L);
      R(7, gy - 54, 18, 3, WOOD_L);
      break;
    case 'aquarium':
      shadow(32, gy, 30, 4);
      box(4, gy - 12, 56, 11, WOOD_D, OUT); // cabinet
      box(4, gy - 36, 56, 24, 'rgba(90,170,210,0.75)', OUT);
      R(5, gy - 35, 54, 3, 'rgba(200,240,255,0.6)');
      R(5, gy - 15, 54, 2, '#d8c89a'); // sand
      [[14, -24, '#f08a3a'], [34, -28, '#f2d36b'], [46, -21, '#e0506a'], [24, -19, '#f08a3a']].forEach(([x, y, c]) => {
        E(x, gy + y, 3, 2, c);
        R(x + 3, gy + y - 1, 2, 3, c);
      });
      [10, 52].forEach((x) => [0, 1, 2, 3].forEach((k) => R(x + (k % 2), gy - 16 - k * 4, 2, 4, '#3f8f4a')));
      R(4, gy - 38, 56, 2, '#1e1a20');
      break;
    case 'plinth':
      // a marble pedestal; the exhibit stands on top
      shadow(16, gy, 11, 3);
      box(8, gy - 24, 16, 23, MARBLE, OUT);
      R(9, gy - 22, 3, 20, MARBLE_D);
      box(6, gy - 28, 20, 5, MARBLE, OUT);
      R(7, gy - 27, 18, 1, '#ffffff');
      break;
    case 'glass_case':
      // a long glass case on a dark wood stand, red velvet inside
      shadow(32, gy, 28, 4);
      box(4, gy - 14, 56, 13, WOOD_D, OUT);
      R(5, gy - 12, 54, 2, WOOD);
      box(3, gy - 36, 58, 22, 'rgba(200,230,245,0.35)', OUT);
      R(4, gy - 35, 56, 2, 'rgba(255,255,255,0.55)');
      R(5, gy - 18, 54, 4, '#7a2232');
      R(3, gy - 38, 58, 2, BRASS);
      break;
    case 'specimen_shelf':
      // a tall cabinet of two open shelves for small finds
      shadow(32, gy, 28, 4);
      box(4, gy - 46, 56, 45, WOOD_D, OUT);
      R(6, gy - 44, 52, 41, '#2f2018');
      R(5, gy - 26, 54, 3, WOOD_L);
      R(5, gy - 6, 54, 3, WOOD_L);
      R(3, gy - 48, 58, 3, WOOD);
      break;
    case 'big_tank':
      // a giant tank: wide glass over a cabinet, sand and weed
      shadow(48, gy, 44, 5);
      box(4, gy - 18, 88, 17, WOOD_D, OUT);
      box(4, gy - 84, 88, 66, 'rgba(70,150,200,0.78)', OUT);
      R(5, gy - 83, 86, 4, 'rgba(200,240,255,0.55)');
      R(5, gy - 24, 86, 5, '#d8c89a');
      for (let i = 0; i < 6; i++) {
        const x = 10 + i * 15;
        for (let k = 0; k < 5; k++) R(x + (k % 2), gy - 28 - k * 4, 2, 4, '#3f8f4a');
      }
      E(30, gy - 29, 5, 3, '#8a8a92');
      E(68, gy - 29, 6, 3, '#6a6a72');
      R(4, gy - 86, 88, 3, '#1e1a20');
      break;
    case 'birdcage':
      shadow(16, gy, 8, 3);
      R(10, gy - 4, 12, 3, BRASS);
      R(15, gy - 20, 2, 16, BRASS);
      E(16, gy - 30, 10, 11, 'rgba(0,0,0,0)');
      for (let x = 7; x <= 25; x += 3) R(x, gy - 38 + Math.abs(16 - x) * 0.4, 1, 18 - Math.abs(16 - x) * 0.4, BRASS);
      R(6, gy - 20, 21, 2, BRASS);
      E(16, gy - 38, 9, 3, BRASS_L);
      R(15, gy - 43, 2, 4, BRASS);
      E(15, gy - 27, 3, 3, '#f2d36b'); // a canary
      R(17, gy - 28, 2, 1, '#e08a2a');
      R(13, gy - 28, 1, 1, OUT);
      break;
    case 'urn':
      shadow(16, gy, 9, 3);
      box(9, gy - 22, 14, 21, MARBLE, OUT);
      R(10, gy - 21, 3, 19, MARBLE_D);
      R(7, gy - 24, 18, 3, MARBLE);
      E(16, gy - 30, 7, 6, '#3a5a7a');
      E(16, gy - 33, 5, 3, '#5a7a9a');
      R(12, gy - 39, 8, 3, '#3a5a7a');
      R(10, gy - 40, 12, 2, '#2a4a6a');
      R(13, gy - 31, 6, 1, BRASS_L);
      break;
    case 'mask':
      shadow(16, gy, 8, 3);
      box(10, gy - 14, 12, 13, '#3a2418', OUT);
      R(15, gy - 20, 2, 6, '#3a2418');
      E(16, gy - 30, 7, 11, OUT);
      E(16, gy - 30, 6, 10, '#8a5a2a');
      R(12, gy - 33, 3, 2, OUT);
      R(17, gy - 33, 3, 2, OUT);
      R(15, gy - 30, 2, 5, '#6a4020');
      R(13, gy - 23, 6, 2, OUT);
      [[11, -38], [20, -38], [16, -40]].forEach(([x, y]) => R(x, gy + y, 2, 2, '#e0506a'));
      break;
    case 'geode':
      shadow(16, gy, 10, 3);
      R(12, gy - 8, 8, 7, WOOD_D);
      E(16, gy - 18, 10, 9, '#6b6862');
      E(16, gy - 18, 8, 7, '#7a4fa0');
      E(16, gy - 18, 5, 4, '#b48ad8');
      [[13, -20], [18, -17], [15, -15]].forEach(([x, y]) => R(x, gy + y, 2, 2, '#efe0ff'));
      break;
    case 'sofa':
      shadow(32, gy, 30, 4);
      R(6, gy - 6, 4, 5, WOOD_D);
      R(54, gy - 6, 4, 5, WOOD_D);
      box(4, gy - 24, 56, 10, '#7a2232', OUT); // back
      box(4, gy - 16, 56, 10, '#9a2e40', OUT); // seat
      R(4, gy - 16, 56, 2, '#b8485a');
      box(2, gy - 20, 6, 14, '#7a2232', OUT);
      box(56, gy - 20, 6, 14, '#7a2232', OUT);
      [16, 32, 48].forEach((x) => R(x, gy - 21, 1, 1, '#e0bc55'));
      break;
    case 'counter': {
      shadow(48, gy, 46, 4);
      box(3, gy - 26, 90, 25, WOOD_D, OUT); // front
      for (let x = 8; x < 90; x += 14) R(x, gy - 22, 10, 17, WOOD); // panels
      box(1, gy - 31, 94, 6, MARBLE, OUT); // top
      R(1, gy - 26, 94, 1, MARBLE_D);
      // Espresso machine.
      box(8, gy - 48, 24, 17, '#b8bcc4', OUT);
      R(9, gy - 47, 22, 3, '#e4e6ea');
      R(12, gy - 41, 4, 6, '#3a3a40');
      R(22, gy - 41, 4, 6, '#3a3a40');
      R(13, gy - 35, 2, 3, '#f4f0e8');
      R(23, gy - 35, 2, 3, '#f4f0e8');
      R(28, gy - 46, 2, 2, '#e05a40');
      // Pastry case.
      box(68, gy - 44, 25, 13, 'rgba(200,230,240,0.55)', OUT);
      [[71, '#d89a50'], [78, '#8a4a2a'], [85, '#e8c070']].forEach(([x, c]) => E(x + 2, gy - 35, 3, 2, c));
      R(69, gy - 43, 23, 1, 'rgba(255,255,255,0.7)');
      // Cups (the barista stands in the gap between the cups and the case).
      [37, 44].forEach((x) => {
        box(x, gy - 37, 5, 6, '#f4f0e8', OUT);
        R(x + 1, gy - 37, 3, 1, '#6a3a20');
      });
      break;
    }
    case 'desk':
      shadow(32, gy, 30, 4);
      box(3, gy - 22, 58, 21, WOOD_D, OUT); // front
      R(8, gy - 18, 20, 13, WOOD);
      R(36, gy - 18, 20, 13, WOOD);
      R(17, gy - 12, 2, 2, BRASS);
      R(45, gy - 12, 2, 2, BRASS);
      box(1, gy - 27, 62, 5, WOOD_L, OUT); // top
      R(1, gy - 22, 62, 1, WOOD);
      // Green banker's lamp, papers, a bell and a nameplate.
      R(10, gy - 40, 2, 13, BRASS);
      box(5, gy - 44, 12, 5, '#2f6a44', OUT);
      R(6, gy - 44, 10, 1, '#4f9a64');
      box(24, gy - 31, 12, 4, '#f4f0e8', OUT);
      R(26, gy - 30, 8, 1, '#a09a8a');
      E(46, gy - 30, 4, 3, BRASS_L);
      R(45, gy - 35, 2, 2, BRASS);
      box(52, gy - 31, 9, 4, '#3a2a20', OUT);
      R(53, gy - 30, 7, 1, BRASS);
      break;
    case 'lockers': {
      shadow(32, gy, 30, 3);
      [2, 22, 42].forEach((x) => {
        box(x, gy - 58, 18, 56, '#6f8aa3', OUT);
        R(x + 1, gy - 57, 16, 2, '#93abc0');
        [0, 3].forEach((k) => R(x + 4, gy - 52 + k, 10, 1, '#4d6276')); // vents
        R(x + 13, gy - 32, 2, 6, '#d8d8d8'); // handle
      });
      break;
    }
    case 'donuts': {
      // break-room table with a box of donuts and coffee mugs
      shadow(32, gy, 30, 4);
      R(6, gy - 14, 3, 13, WOOD_D);
      R(55, gy - 14, 3, 13, WOOD_D);
      box(2, gy - 22, 60, 8, WOOD, OUT);
      R(2, gy - 22, 60, 2, WOOD_L);
      box(14, gy - 30, 24, 8, '#f2d8a8', OUT); // open box
      [[18, '#d9708a'], [25, '#8a4a2a'], [32, '#f4f0e8']].forEach(([x, c]) => {
        E(x, gy - 26, 3, 2, c);
        R(x, gy - 26, 1, 1, '#c88a50');
      });
      [44, 52].forEach((x) => {
        box(x, gy - 30, 6, 7, '#f4f0e8', OUT);
        R(x + 1, gy - 30, 4, 1, '#6a3a20');
      });
      break;
    }
    case 'board': {
      // the staff board: a cork board on a stand
      shadow(16, gy, 12, 3);
      R(8, gy - 12, 2, 11, WOOD_D);
      R(22, gy - 12, 2, 11, WOOD_D);
      box(3, gy - 38, 26, 26, '#b08a5a', OUT);
      R(4, gy - 37, 24, 24, '#c9a06a');
      [[6, 6, '#f4f0e8'], [16, 8, '#f2d36b'], [8, 18, '#9ad0e0'], [18, 20, '#f4f0e8']].forEach(([x, y, c]) => R(x, gy - 38 + y, 8, 7, c));
      [[9, 6], [19, 8], [11, 18], [21, 20]].forEach(([x, y]) => R(x, gy - 38 + y, 2, 2, '#c0392b')); // pins
      break;
    }
    case 'closet':
      shadow(16, gy, 13, 3);
      box(4, gy - 64, 24, 62, '#5d6f8a', OUT);
      R(5, gy - 63, 22, 2, '#7d90ab');
      R(15, gy - 63, 1, 60, '#3f4d63');
      [8, 19].forEach((x) => [0, 3, 6].forEach((k) => R(x, gy - 58 + k, 6, 1, '#3f4d63')));
      R(12, gy - 34, 2, 5, BRASS);
      R(17, gy - 34, 2, 5, BRASS);
      box(8, gy - 48, 16, 6, '#f4f0e8', OUT); // sign
      R(10, gy - 46, 12, 2, '#5d6f8a');
      break;
  }
  tex.refresh();
  return key;
}
