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
function archMaterial(u, v, r) {
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
  if (inside(0)) return mix(hex('#1e1612'), hex('#5a4434'), Math.max(0, 1 - v / 14)); // floor glow beyond
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

// Wall material at (u along the wall, v height in px from the floor).
function wallMaterial(u, v, D, items, seed, P) {
  for (const it of items) {
    const { u0, u1, v0, v1 } = it.rect;
    if (u >= u0 && u < u1 && v >= v0 && v < v1) {
      if (it.door && it.arch) {
        const c = archMaterial(u, v, it.rect);
        if (c !== undefined) return c;
        continue; // outside the arch's rounded corners: plain wall
      }
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

// Stairs up through the balcony's front wall: 2 tiles wide, 2 tiles tall.
export function bakeHallStairs(scene, key, decor) {
  const wood = hex(decor.wainscot || '#6e4430');
  const W = 2 * T;
  const H = 2 * T + 6; // the wall's height plus a bottom step
  return bake(scene, key, W, H, (x, y) => {
    if (x < 3 || x >= W - 3) return x === 0 || x === W - 1 ? FIX.edge : shade(wood, 0.8); // stringers
    const step = Math.floor(y / 7);
    const ly = y % 7;
    const tread = mix(hex('#a0703f'), wood, 0.35);
    let c = ly < 3 ? mix(tread, WHITE, 0.12) : ly === 6 ? shade(tread, 0.6) : shade(tread, 0.82);
    c = shade(c, 0.78 + (step / (H / 7)) * 0.25); // higher steps sit in more shadow
    return hash(x, y, 70) > 0.93 ? shade(c, 0.9) : c;
  });
}

// The balcony's railing: posts and a handrail along its front edge.
export function bakeRailing(scene, key, width, decor) {
  const wood = hex(decor.wainscot || '#6e4430');
  return bake(scene, key, width, 12, (x, y) => {
    if (y < 2) return y === 0 ? mix(wood, WHITE, 0.3) : wood; // handrail
    if (y >= 10) return shade(wood, 0.7); // bottom rail
    return x % 6 < 2 ? shade(wood, x % 6 === 0 ? 0.95 : 0.75) : null; // balusters
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
