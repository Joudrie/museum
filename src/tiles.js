// Outdoor tiles for expeditions and the grounds: ground, edges between
// materials, cliffs and ledges, water, plants, rocks and props. Everything is
// drawn in code on the 32px grid, Pokémon gen 3–5 style. Animated tiles have
// several frames (water ebbs at the shore, tall grass sways, torches flicker).
//
// buildTiles() returns { name: { frames: [canvas], w, h, group, label, walk } }.
// Props and plants are transparent overlays: draw them on any ground tile.
// walk: 'walk' | 'block' | 'water' | 'grass' (walk-through, hides the legs) |
//       'ledge' (jump down only) | 'push' (a boulder you can shove) | 'over' (draw above people)

import { addLandmarks } from './landmarks.js';
import { addScenery } from './scenery.js';
import { applyTileSwap } from './swap.js';

export const T = 32;
const FRAMES = 4;

// ---------- Helpers ----------
export const hash = (x, y, s = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
export const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const smooth = (t) => t * t * (3 - 2 * t);

// Value noise that repeats every tile, so neighbors always line up.
function tnoise(x, y, cells, seed) {
  const s = T / cells;
  const gx = x / s;
  const gy = y / s;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = smooth(gx - x0);
  const fy = smooth(gy - y0);
  const h = (i, j) => hash(((i % cells) + cells) % cells, ((j % cells) + cells) % cells, seed);
  const a = h(x0, y0);
  const b = h(x0 + 1, y0);
  const c = h(x0, y0 + 1);
  const d = h(x0 + 1, y0 + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
export const fbm = (x, y, seed) => 0.55 * tnoise(x, y, 4, seed) + 0.3 * tnoise(x, y, 8, seed + 1) + 0.15 * tnoise(x, y, 16, seed + 2);

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// A tile from a per-pixel function returning a color array (or null).
export function pixels(w, h, fn) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const col = fn(x, y);
      if (!col) continue;
      const i = (y * w + x) * 4;
      img.data.set(col.length === 4 ? col : [...col, 255], i);
    }
  ctx.putImageData(img, 0, 0);
  return c;
}

// A tile drawn with simple pixel shapes on top of an optional base tile.
export function draw(w, h, fn, base) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  if (base) for (let y = 0; y < h; y += T) for (let x = 0; x < w; x += T) ctx.drawImage(base, x, y);
  const R = (x, y, rw, rh, col) => {
    ctx.fillStyle = col;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh));
  };
  const E = (cx, cy, rx, ry, col) => {
    ctx.fillStyle = col;
    for (let yy = -ry; yy <= ry; yy++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + yy), half * 2, 1);
    }
  };
  fn({ ctx, R, E });
  return c;
}

// ---------- Palettes ----------
export const OUT = '#20201a';
export const GRASS = ['#3c8a46', '#52a64e', '#6cbc5a', '#8ed26c', '#b4e488'].map(hex);
export const JUNGLE = ['#22603a', '#2e7842', '#3c9048', '#58a854', '#7ac466'].map(hex);
export const SAND = ['#b8945c', '#d0ae72', '#e2c68a', '#efd9a4', '#f8ecc4'].map(hex);
const WET = ['#a0804c', '#b4945e'].map(hex);
export const DIRT = ['#7a5232', '#946640', '#ad7c50', '#c49464', '#d8ae7e'].map(hex);
export const STONE = ['#56545a', '#6e6c72', '#88868a', '#a4a2a4', '#c4c2c0'].map(hex);
const CLIFF = ['#4a3424', '#644830', '#80603e', '#9c7a52', '#ba9a6c'].map(hex);
const WATER = ['#2a5ea8', '#3474bc', '#4890d0', '#6cb0e4', '#a6d8f6'].map(hex);
const SHALLOW = ['#4aa0c8', '#62b4d4', '#84cce2'].map(hex);
const FOAM = hex('#f2fbff');
const SNOW = ['#b8c8dc', '#d4e2ee', '#ecf4fa', '#ffffff'].map(hex);
const ICE = ['#7ab4dc', '#9ccbe8', '#c4e4f6', '#eefaff'].map(hex);
const pick = (pal, v) => pal[Math.max(0, Math.min(pal.length - 1, Math.floor(v * pal.length)))];

// ---------- Ground ----------
// Grass with little "v" tufts (the gen 4 look). variant changes the tufts.
function grassPixel(pal, variant) {
  const tufts = [];
  for (let k = 0; k < 7; k++) tufts.push([Math.floor(hash(k, variant, 11) * 30), Math.floor(hash(k, variant, 12) * 29) + 1]);
  return (x, y) => {
    const n = fbm(x, y, 3 + variant * 7);
    let col = n < 0.24 ? pal[1] : n < 0.84 ? pal[2] : pal[3];
    for (const [tx, ty] of tufts) {
      const dx = (x - tx + T) % T;
      const dy = (y - ty + T) % T;
      if ((dx === 0 && dy === 1) || (dx === 2 && dy === 1)) col = pal[0];
      if (dx === 1 && dy === 0) col = pal[4];
      if (dx === 1 && dy === 1) col = pal[1];
    }
    return col;
  };
}

function sandPixel(variant, ripples) {
  return (x, y) => {
    const n = fbm(x, y, 40 + variant * 5);
    let col = n < 0.33 ? SAND[1] : n < 0.66 ? SAND[2] : SAND[3];
    if (ripples) {
      const w = Math.sin((y + Math.sin(x / 5) * 2) * 0.55);
      if (w > 0.85) col = SAND[1];
      else if (w > 0.7) col = SAND[3];
    }
    if (hash(x, y, 41 + variant) > 0.985) col = SAND[4]; // glints
    if (hash(x, y, 43 + variant) > 0.99) col = SAND[0];
    return col;
  };
}

function dirtPixel(variant) {
  return (x, y) => {
    const n = fbm(x, y, 60 + variant);
    let col = n < 0.4 ? DIRT[1] : n < 0.7 ? DIRT[2] : DIRT[3];
    const p = hash(Math.floor(x / 3), Math.floor(y / 3), 61 + variant);
    if (p > 0.93 && (x % 3) + (y % 3) < 3) col = (x % 3) === 0 ? DIRT[4] : DIRT[0]; // pebbles
    return col;
  };
}

function stonePixel(variant) {
  // rough rock ground / cave floor with cracks
  return (x, y) => {
    const n = fbm(x, y, 80 + variant);
    let col = n < 0.35 ? STONE[1] : n < 0.65 ? STONE[2] : STONE[3];
    const c = Math.abs(tnoise(x, y, 4, 90 + variant) - 0.5);
    if (c < 0.025) col = STONE[0];
    else if (c < 0.05) col = STONE[1];
    return col;
  };
}

function cobblePixel() {
  return (x, y) => {
    // rounded stones, 8 px each, offset rows
    const row = Math.floor(y / 8);
    const ox = row % 2 ? 4 : 0;
    const cx = ((x + ox) % 8) - 3.5;
    const cy = (y % 8) - 3.5;
    const d = Math.max(Math.abs(cx), Math.abs(cy)) + Math.min(Math.abs(cx), Math.abs(cy)) * 0.4;
    const shade = hash(Math.floor((x + ox) / 8), row, 95);
    if (d > 4.1) return STONE[0];
    if (cy < -2.5 && d < 4) return STONE[4];
    return shade < 0.5 ? STONE[2] : STONE[3];
  };
}

function brickPixel() {
  // red bricks, 8 x 4 px, every other course shifted half a brick
  const REDS = ['#9c4a3a', '#a85644', '#8f4034', '#b0604c'].map(hex);
  const MORTAR = hex('#d9cfc0');
  return (x, y) => {
    const row = Math.floor(y / 4);
    const ox = row % 2 ? 4 : 0;
    if (y % 4 === 3 || (x + ox) % 8 === 7) return MORTAR;
    return REDS[Math.floor(hash(Math.floor((x + ox) / 8), row, 97) * REDS.length)];
  };
}

// ---------- Water ----------
// Deep water: soft bands that drift, and little sparkles that come and go.
function waterPixel(frame, pal = WATER) {
  // calm base with short wave crests that drift sideways, gen 4 style
  const crests = [];
  for (let k = 0; k < 7; k++) crests.push([Math.floor(hash(k, 1, 120) * T), Math.floor(hash(k, 2, 120) * T), 3 + Math.floor(hash(k, 3, 120) * 4), k % 3 === 0]);
  return (x, y) => {
    let col = pal[2];
    for (const [cx, cy, len, dark] of crests) {
      const sx = (cx + frame * (dark ? -1 : 1) + T) % T;
      const dx = (x - sx + T) % T;
      if (y === cy && dx < len) col = dark ? pal[1] : pal[3];
      if (!dark && y === cy + 1 && dx > 0 && dx < len - 1) col = pal[1];
    }
    if (hash(x, y, 130 + frame) > 0.997) col = pal[4];
    return col;
  };
}

function shallowPixel(frame) {
  const sand = sandPixel(9, true);
  const t = (frame / FRAMES) * Math.PI * 2;
  return (x, y) => {
    const s = sand(x, y);
    const caustic = Math.sin(x * 0.7 + t) * Math.sin(y * 0.6 - t) > 0.75;
    const tint = caustic ? SHALLOW[2] : SHALLOW[0];
    return [Math.round(s[0] * 0.35 + tint[0] * 0.65), Math.round(s[1] * 0.35 + tint[1] * 0.65), Math.round(s[2] * 0.35 + tint[2] * 0.65), 255];
  };
}

// ---------- Edges between two materials (corner tiles) ----------
// 16 tiles per pair, named by which corners are covered by the top material:
// TL TR BL BR, e.g. "1100" = top half. Any shape can be built from these.
export const CORNERS = Array.from({ length: 16 }, (_, i) => [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1].join(''));

function cornerMask(key, x, y, seed, shift = 0) {
  const [tl, tr, bl, br] = [...key].map(Number);
  const u = (x + 0.5) / T;
  const v = (y + 0.5) / T;
  const base = tl * (1 - u) * (1 - v) + tr * u * (1 - v) + bl * (1 - u) * v + br * u * v;
  return base + (fbm(x, y, seed) - 0.5) * 0.42 + shift > 0.5;
}

// Grass (or anything) laid over another ground, with a dark rim and a soft shadow.
function edgeTile(key, top, under, rim, shadow, seed) {
  const on = (x, y) => cornerMask(key, Math.max(0, Math.min(T - 1, x)), Math.max(0, Math.min(T - 1, y)), seed);
  return pixels(T, T, (x, y) => {
    if (on(x, y)) {
      const edge = !on(x, y + 1) || !on(x + 1, y) || !on(x - 1, y) || !on(x, y - 1);
      return edge ? rim : top(x, y);
    }
    const near = on(x, y - 1) || on(x, y - 2) || on(x - 1, y) || on(x + 1, y);
    const c = under(x, y);
    return near ? c.map((v, i) => (i < 3 ? Math.round(v * (1 - shadow)) : v)) : c;
  });
}

// The shoreline: water over sand. The water's edge creeps up and back across
// the frames, with a line of foam and dark wet sand behind it.
function shoreTile(key, frame, seed = 150) {
  const ebb = Math.sin((frame / FRAMES) * Math.PI * 2) * 0.05;
  const water = waterPixel(frame);
  const sand = sandPixel(2, false);
  const on = (x, y, s) => cornerMask(key, Math.max(0, Math.min(T - 1, x)), Math.max(0, Math.min(T - 1, y)), seed, s);
  return pixels(T, T, (x, y) => {
    const wet = on(x, y, ebb + 0.1); // the furthest the water reached
    const inWater = on(x, y, ebb);
    if (inWater) {
      const deep = on(x, y, ebb - 0.08);
      if (!deep) return FOAM; // the foam line at the water's edge
      if (!on(x, y, ebb - 0.13)) return SHALLOW[2];
      const bubble = hash(x, y, 160 + frame) > 0.985 && !on(x, y, ebb - 0.22);
      return bubble ? FOAM : water(x, y);
    }
    if (wet) return hash(x, y, 170) > 0.9 ? WET[1] : WET[0];
    return sand(x, y);
  });
}

// ---------- Build ----------
export function buildTiles() {
  const tiles = {};
  const add = (name, frames, opts) => (tiles[name] = { frames: Array.isArray(frames) ? frames : [frames], w: opts.w || T, h: opts.h || T, ...opts });
  const anim = (fn) => Array.from({ length: FRAMES }, (_, f) => fn(f));

  // Ground
  for (let v = 0; v < 3; v++) add(`grass_${v + 1}`, pixels(T, T, grassPixel(GRASS, v)), { group: 'Ground', label: `Grass ${v + 1}`, walk: 'walk' });
  add('grass_jungle', pixels(T, T, grassPixel(JUNGLE, 4)), { group: 'Ground', label: 'Jungle grass', walk: 'walk' });
  add('sand_1', pixels(T, T, sandPixel(0, false)), { group: 'Ground', label: 'Sand', walk: 'walk' });
  add('sand_2', pixels(T, T, sandPixel(1, true)), { group: 'Ground', label: 'Sand ripples', walk: 'walk' });
  add('sand_wet', pixels(T, T, (x, y) => (hash(x, y, 170) > 0.9 ? WET[1] : WET[0])), { group: 'Ground', label: 'Wet sand', walk: 'walk' });
  add('dirt_1', pixels(T, T, dirtPixel(0)), { group: 'Ground', label: 'Dirt path', walk: 'walk' });
  add('dirt_2', pixels(T, T, dirtPixel(1)), { group: 'Ground', label: 'Dirt path 2', walk: 'walk' });
  add('rock_1', pixels(T, T, stonePixel(0)), { group: 'Ground', label: 'Rock ground', walk: 'walk' });
  add('rock_2', pixels(T, T, stonePixel(1)), { group: 'Ground', label: 'Cave floor', walk: 'walk' });
  add('cobble', pixels(T, T, cobblePixel()), { group: 'Ground', label: 'Cobblestone', walk: 'walk' });
  add('brick', pixels(T, T, brickPixel()), { group: 'Ground', label: 'Brick', walk: 'walk' });
  add('snow', pixels(T, T, (x, y) => {
    const n = fbm(x, y, 200);
    return hash(x, y, 201) > 0.99 ? SNOW[0] : n < 0.4 ? SNOW[1] : n < 0.75 ? SNOW[2] : SNOW[3];
  }), { group: 'Ground', label: 'Snow', walk: 'walk' });
  add('ice', pixels(T, T, (x, y) => {
    const streak = (x - y + 64) % 24;
    if (streak === 0 || streak === 1) return ICE[3];
    return fbm(x, y, 210) < 0.5 ? ICE[1] : ICE[2];
  }), { group: 'Ground', label: 'Ice (slide)', walk: 'walk' });

  // Water
  add('water', anim((f) => pixels(T, T, waterPixel(f))), { group: 'Water', label: 'Deep water', walk: 'water' });
  add('water_shallow', anim((f) => pixels(T, T, shallowPixel(f))), { group: 'Water', label: 'Shallow water', walk: 'walk' });
  add('bubbles', anim((f) => draw(T, T, ({ R }) => {
    // a few bubbles rising and popping
    [[8, 0], [20, 1.5], [14, 2.6]].forEach(([x, ph]) => {
      const k = (f / FRAMES + ph / 3) % 1;
      const y = 26 - k * 20;
      const r = k > 0.85 ? 0 : 1 + (k > 0.4 ? 1 : 0);
      if (!r) return R(x - 1, y, 3, 1, 'rgba(242,251,255,0.7)');
      R(x - r, y - r, r * 2, r * 2, 'rgba(242,251,255,0.85)');
      R(x - r + 1, y - r + 1, Math.max(1, r * 2 - 2), Math.max(1, r * 2 - 2), 'rgba(110,176,228,0.9)');
    });
  })), { group: 'Water', label: 'Bubbles (overlay)', walk: 'water' });
  add('waterfall', anim((f) => pixels(T, T, (x, y) => {
    const s = (y - f * 8 + 64) % T;
    const lane = hash(x >> 1, 0, 220);
    if ((s + Math.floor(lane * 32)) % 16 < 2) return FOAM;
    return lane > 0.6 ? WATER[3] : lane > 0.3 ? WATER[2] : WATER[1];
  })), { group: 'Water', label: 'Waterfall', walk: 'block' });
  add('waterfall_foot', anim((f) => {
    const water = waterPixel(f);
    return pixels(T, T, (x, y) => {
      const churn = hash(x >> 1, y >> 1, 230 + f);
      if (y < 12 && churn > 0.35) return FOAM;
      if (y < 20 && churn > 0.75) return FOAM;
      return water(x, y);
    });
  }), { group: 'Water', label: 'Waterfall splash', walk: 'water' });
  add('lily', anim((f) => draw(T, T, ({ E, R }) => {
    const bob = f === 1 || f === 2 ? 1 : 0;
    E(15, 17 + bob, 9, 6, '#2e7842');
    E(15, 16 + bob, 8, 5, '#58a854');
    R(15, 16 + bob, 1, 5, '#2e7842');
    E(10, 14 + bob, 2, 2, '#f4b8d0');
    R(10, 13 + bob, 1, 1, '#ffffff');
  })), { group: 'Water', label: 'Lily pad', walk: 'water' });
  add('water_rock', anim((f) => draw(T, T, ({ E, R }) => {
    const ring = 9 + (f % 2);
    E(16, 21, ring + 2, 4, 'rgba(242,251,255,0.55)');
    E(16, 21, ring, 3, WATER_CSS[1]);
    E(16, 18, 9, 7, OUT);
    E(16, 17, 8, 6, '#6e6c72');
    E(14, 15, 4, 3, '#a4a2a4');
    R(18, 20, 4, 1, '#56545a');
  })), { group: 'Water', label: 'Rock in water', walk: 'block' });

  // Edges: every corner combination for each pair
  const sets = [
    ['grass_sand', 'Grass on sand', grassPixel(GRASS, 0), sandPixel(0, false), GRASS[0], 0.12, 300],
    ['grass_dirt', 'Grass on dirt path', grassPixel(GRASS, 1), dirtPixel(0), GRASS[0], 0.15, 310],
    ['grass_rock', 'Grass on rock', grassPixel(GRASS, 2), stonePixel(0), GRASS[0], 0.15, 320],
    ['snow_rock', 'Snow on rock', (x, y) => (fbm(x, y, 200) < 0.5 ? SNOW[2] : SNOW[3]), stonePixel(1), SNOW[0], 0.12, 330],
  ];
  sets.forEach(([id, label, top, under, rim, shadow, seed]) =>
    CORNERS.forEach((k) => {
      if (k === '0000' || k === '1111') return;
      add(`${id}_${k}`, edgeTile(k, top, under, rim, shadow, seed), { group: label, label: k, walk: 'walk' });
    }),
  );
  CORNERS.forEach((k) => {
    if (k === '0000' || k === '1111') return;
    add(`shore_${k}`, anim((f) => shoreTile(k, f)), { group: 'Shoreline (water on sand)', label: k, walk: 'walk' });
  });
  CORNERS.forEach((k) => {
    if (k === '0000' || k === '1111') return;
    add(`bank_${k}`, anim((f) => edgeTile(k, waterPixel(f), grassPixel(GRASS, 0), WATER[0], 0.18, 340)), { group: 'Pond bank (water on grass)', label: k, walk: 'walk' });
  });

  // Cliffs and ledges (facing the camera)
  addCliffs(add);

  // Plants
  addPlants(add, anim);

  // Rocks and boulders
  addRocks(add);

  // Props
  addProps(add, anim);

  // Flowers, garden plants, more trees and rocks, paths and buildings
  addScenery(add, anim);

  // the museum and people, for builder islands
  addLandmarks(add);

  return applyTileSwap(tiles); // art dropped in public/swap/tiles replaces the code-drawn tile
}

const WATER_CSS = ['#2a5ea8', '#3474bc', '#4890d0', '#6cb0e4', '#a6d8f6'];
export const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

// ---------- Cliffs ----------
function cliffFace(x, y, seed) {
  // rock face with layered strata and vertical cracks
  const band = Math.floor((y + Math.floor(tnoise(x, 0, 4, seed) * 4)) / 6);
  const n = tnoise(x, y, 8, seed + band);
  let col = band % 2 ? CLIFF[2] : CLIFF[3];
  if (n < 0.3) col = CLIFF[1];
  if ((y + Math.floor(tnoise(x, 0, 4, seed) * 4)) % 6 === 0) col = CLIFF[0];
  if ((y + Math.floor(tnoise(x, 0, 4, seed) * 4)) % 6 === 1) col = CLIFF[4];
  if (Math.abs(tnoise(x, y, 4, seed + 9) - 0.5) < 0.03 && hash(x >> 2, band, seed) > 0.5) col = CLIFF[0];
  return col;
}

function addCliffs(add) {
  const grass = grassPixel(GRASS, 0);
  const sideFade = (x, side) => (side === 'l' ? x : side === 'r' ? T - 1 - x : 99);
  const face = (side, base) =>
    pixels(T, T, (x, y) => {
      const d = sideFade(x, side);
      if (d < 3) return d === 0 ? hex(OUT) : CLIFF[d === 1 ? 1 : 2];
      if (base && y > T - 7) {
        // the ground at the foot, in the cliff's shadow
        const g = grass(x, y);
        return y === T - 6 ? CLIFF[0] : g.map((v, i) => (i < 3 ? Math.round(v * (y < T - 3 ? 0.72 : 0.86)) : v));
      }
      return cliffFace(x, y, 400);
    });
  const top = (side) =>
    pixels(T, T, (x, y) => {
      const d = sideFade(x, side);
      const lip = 24 + Math.round(tnoise(x, 0, 8, 410) * 3);
      if (d < 3) {
        if (y > lip - 2 || d === 0) return hex(OUT);
        return d === 1 ? GRASS[0] : grass(x, y);
      }
      if (y < lip - 1) return grass(x, y);
      if (y < lip + 1) return y === lip - 1 ? GRASS[0] : hex(OUT);
      return y === T - 1 ? CLIFF[4] : CLIFF[3]; // the very top of the rock face
    });
  const sideEdge = (side) =>
    pixels(T, T, (x, y) => {
      const d = side === 'l' ? x : T - 1 - x;
      const jag = 5 + Math.round(tnoise(0, y, 8, 420) * 3);
      if (d < jag - 1) return d === 0 ? hex(OUT) : cliffFace(x, y, 430);
      if (d === jag - 1) return hex(OUT);
      if (d === jag) return GRASS[0];
      return grass(x, y);
    });
  add('cliff_top_l', top('l'), { group: 'Cliffs & ledges', label: 'Top left', walk: 'walk' });
  add('cliff_top', top(null), { group: 'Cliffs & ledges', label: 'Top edge', walk: 'walk' });
  add('cliff_top_r', top('r'), { group: 'Cliffs & ledges', label: 'Top right', walk: 'walk' });
  add('cliff_face_l', face('l', false), { group: 'Cliffs & ledges', label: 'Face left', walk: 'block' });
  add('cliff_face', face(null, false), { group: 'Cliffs & ledges', label: 'Face', walk: 'block' });
  add('cliff_face_r', face('r', false), { group: 'Cliffs & ledges', label: 'Face right', walk: 'block' });
  add('cliff_base_l', face('l', true), { group: 'Cliffs & ledges', label: 'Foot left', walk: 'block' });
  add('cliff_base', face(null, true), { group: 'Cliffs & ledges', label: 'Foot', walk: 'block' });
  add('cliff_base_r', face('r', true), { group: 'Cliffs & ledges', label: 'Foot right', walk: 'block' });
  add('cliff_side_l', sideEdge('l'), { group: 'Cliffs & ledges', label: 'Side (left)', walk: 'block' });
  add('cliff_side_r', sideEdge('r'), { group: 'Cliffs & ledges', label: 'Side (right)', walk: 'block' });
  // Stairs cut into the face
  add('cliff_stairs', pixels(T, T, (x, y) => {
    if (x < 5 || x > 26) return cliffFace(x, y, 400);
    if (x === 5 || x === 26) return hex(OUT);
    const step = y % 8;
    return step === 0 ? hex(OUT) : step < 3 ? CLIFF[4] : step < 6 ? CLIFF[3] : CLIFF[1];
  }), { group: 'Cliffs & ledges', label: 'Stairs', walk: 'walk' });
  // Ledges: hop down, can't climb up
  const ledge = (side) =>
    pixels(T, T, (x, y) => {
      const d = sideFade(x, side);
      if (y >= 24) {
        if (d < 2 && y < 28) return hex(OUT);
        if (y === 24) return hex(OUT);
        if (y < 27) return y === 25 ? CLIFF[4] : CLIFF[2];
        if (y === 27) return hex(OUT);
        return grass(x, y).map((v, i) => (i < 3 ? Math.round(v * (y < 30 ? 0.75 : 0.88)) : v));
      }
      if (d === 0 && y > 18) return hex(OUT);
      return grass(x, y);
    });
  add('ledge_l', ledge('l'), { group: 'Cliffs & ledges', label: 'Ledge left', walk: 'ledge' });
  add('ledge', ledge(null), { group: 'Cliffs & ledges', label: 'Ledge', walk: 'ledge' });
  add('ledge_r', ledge('r'), { group: 'Cliffs & ledges', label: 'Ledge right', walk: 'ledge' });
  // Mountain wall: big chunky rock faces for tall walls
  const mountain = (seed, cap) =>
    pixels(T, T, (x, y) => {
      if (cap && y < 7 + Math.round(tnoise(x, 0, 4, seed) * 4)) {
        const edge = y === 6 + Math.round(tnoise(x, 0, 4, seed) * 4);
        return edge ? SNOW[0] : fbm(x, y, 200) < 0.5 ? SNOW[2] : SNOW[3];
      }
      // big rounded slabs
      const cx = Math.floor(x / 16);
      const cy = Math.floor((y + (cx % 2) * 8) / 16);
      const lx = (x % 16) - 8;
      const ly = ((y + (cx % 2) * 8) % 16) - 8;
      const r = Math.hypot(lx * 0.9, ly);
      const shade = hash(cx, cy, seed);
      if (r > 8.4) return STONE[0];
      if (lx + ly < -7) return STONE[4];
      if (lx + ly > 7) return STONE[1];
      return shade > 0.5 ? STONE[2] : STONE[3];
    });
  add('mountain_1', mountain(440, false), { group: 'Cliffs & ledges', label: 'Mountain wall', walk: 'block' });
  add('mountain_2', mountain(441, false), { group: 'Cliffs & ledges', label: 'Mountain wall 2', walk: 'block' });
  add('mountain_snow', mountain(442, true), { group: 'Cliffs & ledges', label: 'Mountain, snowy top', walk: 'block' });
  // A cave mouth in the cliff (2×2)
  add('cave', pixels(2 * T, 2 * T, (x, y) => {
    const cx = x - 31.5;
    const cy = y - 44;
    const r = Math.hypot(cx / 22, cy / 26);
    if (y > 44 && Math.abs(cx) < 22) return y > 58 ? hex('#1a120c') : hex('#0e0a08');
    if (r < 1) return r > 0.92 ? hex(OUT) : r > 0.8 ? hex('#2a1e14') : hex('#0e0a08');
    return cliffFace(x % T, y % T, 400);
  }), { group: 'Cliffs & ledges', label: 'Cave (2×2)', w: 2 * T, h: 2 * T, walk: 'walk' });
}

// ---------- Plants ----------
function addPlants(add, anim) {
  // Tall grass you walk through (the front layer is drawn over the player's legs)
  // (14px taller than a tile, so it stands up past the tile above)
  const GH = T + 14;
  const blades = (f, front) =>
    draw(T, GH, ({ R }) => {
      // rows of pointed blades, back to front; the front layer is only the
      // bottom row, drawn over the player up to the knees
      const sway = [0, 1, 0, -1][f];
      const rows = front ? [[GH - 1, 1]] : [[GH - 19, 0], [GH - 10, 2], [GH - 1, 1]];
      rows.forEach(([base, off], r) => {
        for (let bx = -2 + off * 2; bx < T; bx += 5) {
          const h = (front || r === 2 ? 19 : 16) + ((bx + r * 3) % 3);
          for (let i = 0; i < h; i++) {
            const t = i / h;
            const w = Math.max(1, Math.round(4 * (1 - t)));
            const x = bx + Math.round(t * t * sway * 2 * (r % 2 ? -1 : 1)) + Math.round((4 - w) / 2);
            const y = base - i;
            R(x - 1, y, w + 2, 1, '#163a22');
            R(x, y, w, 1, t > 0.75 ? '#94d672' : t > 0.4 ? '#58ad52' : '#2e7842');
            if (w > 1 && t < 0.75) R(x, y, 1, 1, '#22603a');
          }
        }
      });
    });
  add('tall_grass', anim((f) => blades(f, false)), { group: 'Plants', label: 'Tall grass', walk: 'grass', h: GH });
  add('tall_grass_front', anim((f) => blades(f, true)), { group: 'Plants', label: 'Tall grass (over legs)', walk: 'over', h: GH });
  add('flowers', anim((f) => draw(T, T, ({ R }) => {
    const bob = f % 2;
    [[6, 8, '#e0405a'], [20, 6, '#f2d36b'], [13, 18, '#ffffff'], [25, 22, '#e0405a'], [5, 25, '#f2d36b'], [17, 28, '#b06ae0']].forEach(([x, y, c], i) => {
      const b = (i + bob) % 2;
      R(x, y + 2, 1, 3, '#2e7842');
      R(x - 1, y - b, 3, 1, c);
      R(x, y - 1 - b, 1, 3, c);
      R(x, y - b, 1, 1, '#fff4a0');
    });
  })), { group: 'Plants', label: 'Flowers', walk: 'walk' });
  add('dune_grass', anim((f) => draw(T, T, ({ R }) => {
    const sway = [0, 1, 0, -1][f];
    [[10, 24], [16, 26], [21, 23]].forEach(([x, y]) => {
      for (let i = 0; i < 10; i++) R(x + Math.round((i / 10) * sway * 2) + (i % 3 === 0 ? -1 : 0), y - i, 1, 1, i > 6 ? '#c8d48a' : '#8aa058');
    });
  })), { group: 'Plants', label: 'Beach grass', walk: 'walk' });
  add('mushrooms', draw(T, T, ({ E, R }) => {
    [[10, 22, '#d04a3a'], [19, 18, '#e8b05a'], [22, 25, '#d04a3a']].forEach(([x, y, c]) => {
      R(x - 1, y, 3, 4, '#efe6d4');
      E(x, y, 4, 2, OUT);
      E(x, y - 1, 3, 2, c);
      R(x - 1, y - 2, 1, 1, '#ffffff');
    });
  }), { group: 'Plants', label: 'Mushrooms', walk: 'walk' });
  add('bush', draw(T, T, ({ E, R }) => {
    E(16, 27, 12, 3, 'rgba(0,0,0,0.25)');
    E(16, 18, 13, 10, OUT);
    E(16, 18, 12, 9, '#2e7842');
    E(12, 15, 7, 5, '#3c9048');
    E(20, 14, 6, 5, '#58a854');
    E(14, 12, 3, 2, '#7ac466');
    [[9, 20], [22, 19], [15, 22]].forEach(([x, y]) => R(x, y, 2, 2, '#e0405a'));
  }), { group: 'Plants', label: 'Bush', walk: 'block' });
  // Palm tree: 2 wide, 3 tall. The fronds sway a little.
  add('palm', anim((f) => draw(2 * T, 3 * T, ({ E, R }) => {
    E(34, 92, 14, 3, 'rgba(0,0,0,0.25)');
    // a gently curved trunk with rings
    for (let y = 30; y < 92; y++) {
      const x = 30 + Math.round(Math.sin((92 - y) / 40) * 6);
      R(x - 4, y, 9, 1, OUT);
      R(x - 3, y, 7, 1, y % 6 < 2 ? '#7a5a3a' : '#9a7650');
      R(x - 3, y, 2, 1, '#b8946a');
    }
    E(36, 28, 3, 3, '#5a3a20'); // coconuts
    E(30, 30, 3, 3, '#6a4428');
    const sway = [0, 1, 0, -1][f];
    const frond = (ang, len, droop) => {
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const x = 33 + Math.cos(ang) * i + sway * t * 2;
        const y = 26 + Math.sin(ang) * i * 0.6 + droop * t * t * 18;
        R(x - 1, y - 1, 3, 3, OUT);
      }
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const x = 33 + Math.cos(ang) * i + sway * t * 2;
        const y = 26 + Math.sin(ang) * i * 0.6 + droop * t * t * 18;
        R(x, y, 2, 2, t < 0.5 ? '#2e7842' : '#58a854');
        if (i % 3 === 0 && t > 0.2) R(x + (Math.cos(ang) > 0 ? 1 : -1), y + 3, 1, 3, '#3c9048');
      }
    };
    [[-2.9, 30, 1], [-2.4, 26, 0.6], [-1.7, 22, 0.2], [-1.2, 22, 0.2], [-0.6, 26, 0.6], [-0.15, 30, 1], [2.6, 18, 0.8], [0.5, 18, 0.8]].forEach(([a, l, d]) => frond(a, l, d));
  })), { group: 'Plants', label: 'Palm tree (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  // Leafy tree: 2 wide, 3 tall
  add('tree', anim((f) => draw(2 * T, 3 * T, ({ E, R }) => {
    E(32, 90, 20, 4, 'rgba(0,0,0,0.25)');
    R(26, 56, 12, 34, OUT);
    R(27, 56, 10, 34, '#7a5232');
    R(28, 56, 3, 34, '#946640');
    R(22, 86, 6, 4, '#7a5232');
    R(36, 86, 6, 4, '#7a5232');
    const s = f === 1 || f === 2 ? 1 : 0;
    E(32, 34, 30, 26, OUT);
    E(32, 34, 29, 25, '#2e7842');
    E(22 + s, 30, 16, 14, '#3c9048');
    E(42 - s, 28, 14, 13, '#3c9048');
    E(30, 20, 14, 10, '#58a854');
    E(26, 16, 6, 4, '#7ac466');
    E(44, 22, 5, 3, '#7ac466');
    for (let k = 0; k < 14; k++) R(8 + hash(k, 1, 500) * 48, 14 + hash(k, 2, 500) * 38, 2, 1, '#22603a');
  })), { group: 'Plants', label: 'Leafy tree (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  add('pine', draw(T, 2 * T, ({ E, R }) => {
    E(16, 61, 11, 3, 'rgba(0,0,0,0.25)');
    R(14, 50, 5, 12, '#5a3a20');
    [[14, 13], [26, 12], [38, 14], [50, 15]].forEach(([y, w], i) => {
      for (let k = 0; k < 12; k++) {
        const half = Math.round((w * (k + 2)) / 14);
        R(16 - half - 1, y - 12 + k, half * 2 + 2, 1, OUT);
        R(16 - half, y - 12 + k, half * 2, 1, k < 4 ? '#3c9048' : i % 2 ? '#22603a' : '#2e7842');
      }
    });
    R(15, 2, 2, 3, '#3c9048');
  }), { group: 'Plants', label: 'Pine tree (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('stump', draw(T, T, ({ E, R }) => {
    E(16, 26, 11, 3, 'rgba(0,0,0,0.25)');
    R(7, 14, 18, 12, OUT);
    R(8, 14, 16, 11, '#7a5232');
    R(8, 14, 4, 11, '#946640');
    E(16, 14, 9, 4, OUT);
    E(16, 14, 8, 3, '#d8ae7e');
    E(16, 14, 4, 1, '#ad7c50');
  }), { group: 'Plants', label: 'Stump', walk: 'block' });
  add('log', draw(2 * T, T, ({ E, R }) => {
    E(32, 26, 28, 3, 'rgba(0,0,0,0.25)');
    R(6, 12, 52, 14, OUT);
    R(6, 13, 50, 12, '#7a5232');
    R(6, 13, 50, 3, '#ad7c50');
    for (let x = 12; x < 52; x += 9) R(x, 17, 4, 1, '#5a3a20');
    E(56, 19, 6, 7, OUT);
    E(56, 19, 5, 6, '#d8ae7e');
    E(56, 19, 2, 3, '#ad7c50');
  }), { group: 'Plants', label: 'Fallen log (2×1)', w: 2 * T, h: T, walk: 'block' });
  add('vines', draw(T, T, ({ R }) => {
    for (let k = 0; k < 5; k++) {
      const x = 3 + k * 6;
      for (let y = 0; y < 22 + (k % 2) * 8; y++) {
        R(x + Math.round(Math.sin(y / 4 + k) * 1.5), y, 2, 1, y % 5 === 0 ? '#7ac466' : '#2e7842');
        if (y % 6 === 3) R(x + 2, y, 3, 2, '#3c9048');
      }
    }
  }), { group: 'Plants', label: 'Hanging vines (cut with crew)', walk: 'block' });
}

// ---------- Rocks ----------
function addRocks(add) {
  const rock = (w, h, cx, cy, rx, ry, crack) =>
    draw(w, h, ({ E, R }) => {
      E(cx, cy + ry - 1, rx + 1, 3, 'rgba(0,0,0,0.28)');
      E(cx, cy, rx + 1, ry + 1, OUT);
      E(cx, cy, rx, ry, css(STONE[1]));
      E(cx - 1, cy - 1, rx - 1, ry - 1, css(STONE[2]));
      E(cx - rx * 0.35, cy - ry * 0.4, rx * 0.45, ry * 0.35, css(STONE[3]));
      R(cx - rx * 0.5, cy - ry * 0.6, 3, 2, css(STONE[4]));
      if (crack) {
        R(cx - 2, cy - ry + 2, 1, 4, OUT);
        R(cx - 1, cy - ry + 6, 1, 3, OUT);
        R(cx, cy - ry + 9, 3, 1, OUT);
        R(cx + 3, cy - ry + 10, 1, 4, OUT);
      }
    });
  add('rock_small', rock(T, T, 16, 20, 7, 5), { group: 'Rocks', label: 'Small rock', walk: 'block' });
  add('rock_big', rock(2 * T, 2 * T, 32, 36, 26, 20), { group: 'Rocks', label: 'Big rock (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  add('rocks_pile', draw(T, T, ({ E, R }) => {
    E(16, 26, 13, 3, 'rgba(0,0,0,0.25)');
    [[10, 21, 6, 5], [21, 22, 6, 4], [16, 15, 6, 5]].forEach(([x, y, rx, ry]) => {
      E(x, y, rx + 1, ry + 1, OUT);
      E(x, y, rx, ry, css(STONE[2]));
      E(x - 2, y - 2, rx / 2, ry / 2, css(STONE[3]));
    });
    R(14, 12, 2, 1, css(STONE[4]));
  }), { group: 'Rocks', label: 'Rock pile', walk: 'block' });
  // The boulder you can push: rounder, with a clear highlight so it reads as movable
  add('boulder', draw(T, T, ({ E, R }) => {
    E(16, 28, 12, 3, 'rgba(0,0,0,0.3)');
    E(16, 17, 14, 13, OUT);
    E(16, 17, 13, 12, css(STONE[1]));
    E(15, 16, 12, 11, css(STONE[2]));
    E(11, 11, 6, 5, css(STONE[3]));
    E(10, 9, 2, 2, css(STONE[4]));
    R(19, 22, 5, 1, css(STONE[0]));
    R(22, 18, 1, 4, css(STONE[0]));
  }), { group: 'Rocks', label: 'Boulder (push)', walk: 'push' });
  add('boulder_cracked', rock(T, T, 16, 18, 12, 11, true), { group: 'Rocks', label: 'Cracked rock (smash)', walk: 'block' });
  add('rock_sand', draw(T, T, ({ E, R }) => {
    E(16, 24, 10, 3, 'rgba(0,0,0,0.22)');
    E(16, 20, 9, 6, OUT);
    E(16, 20, 8, 5, '#b8a088');
    E(13, 18, 4, 2, '#d8c4a8');
    R(19, 22, 3, 1, '#8a7460');
  }), { group: 'Rocks', label: 'Beach rock', walk: 'block' });
  add('crystal', draw(T, T, ({ ctx, E }) => {
    E(16, 27, 10, 3, 'rgba(0,0,0,0.25)');
    [[10, 10, 6, '#7ab4e8'], [17, 4, 7, '#a6d8f6'], [23, 12, 5, '#7ab4e8']].forEach(([x, top, w, c]) => {
      ctx.fillStyle = OUT;
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 1, 27);
      ctx.lineTo(x, top - 1);
      ctx.lineTo(x + w / 2 + 1, 27);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(x - w / 2, 26);
      ctx.lineTo(x, top);
      ctx.lineTo(x + w / 2, 26);
      ctx.fill();
      ctx.fillStyle = '#eefaff';
      ctx.fillRect(x - 1, top + 4, 1, 10);
    });
  }), { group: 'Rocks', label: 'Crystals', walk: 'block' });
}

// ---------- Props ----------
function addProps(add, anim) {
  const WOOD = ['#5a3a20', '#7a5232', '#946640', '#ad7c50'];
  const planks = (vertical) =>
    draw(T, T, ({ R }) => {
      for (let i = 0; i < 4; i++) {
        const o = i * 8;
        if (vertical) {
          R(o, 0, 8, T, OUT);
          R(o + 1, 0, 6, T, WOOD[2]);
          R(o + 1, 0, 2, T, WOOD[3]);
          R(o + 1, (i * 11) % T, 6, 1, WOOD[1]);
        } else {
          R(0, o, T, 8, OUT);
          R(0, o + 1, T, 6, WOOD[2]);
          R(0, o + 1, T, 2, WOOD[3]);
          R((i * 11) % T, o + 1, 1, 6, WOOD[1]);
        }
      }
      if (vertical) [3, 27].forEach((y) => [3, 11, 19, 27].forEach((x) => R(x, y, 2, 2, '#3a2a1a')));
      else [3, 27].forEach((x) => [3, 11, 19, 27].forEach((y) => R(x, y, 2, 2, '#3a2a1a')));
    });
  add('dock_h', planks(false), { group: 'Props', label: 'Dock / bridge (across)', walk: 'walk' });
  add('dock_v', planks(true), { group: 'Props', label: 'Dock / bridge (up)', walk: 'walk' });
  add('dock_post', draw(T, T, ({ R, E }) => {
    E(16, 27, 8, 3, 'rgba(242,251,255,0.6)');
    R(11, 6, 10, 22, OUT);
    R(12, 6, 8, 21, WOOD[1]);
    R(12, 6, 3, 21, WOOD[3]);
    R(11, 12, 10, 2, '#c8b088');
  }), { group: 'Props', label: 'Dock post', walk: 'block' });
  add('bridge_rope', draw(T, T, ({ R }) => {
    R(0, 3, T, 2, '#c8b088');
    R(0, 27, T, 2, '#c8b088');
    [4, 20].forEach((x) => {
      R(x, 1, 3, 6, OUT);
      R(x, 25, 3, 6, OUT);
    });
  }, planks(false)), { group: 'Props', label: 'Rope bridge', walk: 'walk' });
  add('sign', draw(T, T, ({ R }) => {
    R(14, 16, 4, 13, OUT);
    R(15, 16, 2, 12, WOOD[2]);
    R(5, 5, 22, 13, OUT);
    R(6, 6, 20, 11, WOOD[3]);
    R(6, 6, 20, 2, '#d8ae7e');
    [9, 12].forEach((y) => R(9, y, 14, 1, WOOD[0]));
  }), { group: 'Props', label: 'Sign', walk: 'block' });
  const chest = (open) =>
    draw(T, T, ({ R, E }) => {
      E(16, 28, 13, 3, 'rgba(0,0,0,0.28)');
      R(4, 14, 24, 14, OUT);
      R(5, 15, 22, 12, WOOD[1]);
      R(5, 15, 22, 2, WOOD[3]);
      R(5, 20, 22, 2, '#c9a23f');
      R(14, 18, 4, 6, '#c9a23f');
      R(15, 20, 2, 2, OUT);
      if (open) {
        R(4, 4, 24, 10, OUT);
        R(5, 5, 22, 8, WOOD[0]);
        R(6, 12, 20, 3, '#f2d36b');
        [[9, 11], [16, 10], [22, 11]].forEach(([x, y]) => R(x, y, 3, 2, '#fff4a0'));
      } else {
        R(4, 8, 24, 7, OUT);
        R(5, 9, 22, 5, WOOD[2]);
        R(5, 9, 22, 1, WOOD[3]);
      }
    });
  // dig spots: a mound that can be brushed open (src/dig.js); "@dug" is the same spot while it rests (hidden from the builder)
  const mound = (dug, kind) =>
    draw(T, T, ({ R, E }) => {
      E(16, 24, 12, 5, 'rgba(0,0,0,0.2)');
      if (dug) {
        E(16, 21, 10, 5, '#7a5232');
        E(16, 20, 8, 3, '#946640');
        return;
      }
      E(16, 20, 12, 8, '#7a5232');
      E(16, 18, 10, 7, '#946640');
      E(15, 16, 7, 4, '#ad7c50');
      [[11, 15], [18, 13], [21, 18], [14, 20], [9, 19]].forEach(([x, y]) => R(x, y, 2, 1, '#c49464'));
      if (kind === 'fossil') {
        R(19, 10, 1, 4, '#5a3a20'); // a bone tip poking out
        R(18, 9, 3, 2, '#e8dfc8');
      } else if (kind === 'ruin') {
        R(17, 11, 5, 4, '#b8603c'); // a clay sherd
        R(18, 11, 3, 1, '#d88a5c');
        R(10, 17, 3, 3, '#8a8478'); // flat stones around it
      } else if (kind === 'shore') {
        E(19, 14, 3, 2, '#f0c8a8'); // a shell in damp sand
        R(18, 13, 1, 3, '#c88c68');
        E(16, 22, 11, 4, 'rgba(60,40,20,0.35)');
      } else if (kind === 'crater') {
        E(16, 20, 8, 4, '#3a3028'); // a scorched dip with a dark stone
        E(17, 19, 4, 3, '#6a6258');
        R(16, 18, 2, 1, '#a89a84');
      } else {
        R(18, 12, 3, 3, '#9a5ac8'); // a glint of crystal
        R(19, 11, 1, 1, '#f0e0ff');
      }
    });
  // a worked-across face: a cliff of stone with a fossil showing, and a trench. Touching spots of one kind form a site (src/dig.js).
  const face = (trench) =>
    draw(T, T, ({ R, E }) => {
      if (trench) {
        R(2, 8, 28, 20, OUT);
        R(3, 9, 26, 18, '#5a3a20');
        R(3, 9, 26, 3, '#946640');
        R(3, 24, 26, 3, '#3a2410');
        [[7, 15], [15, 18], [22, 14]].forEach(([x, y]) => R(x, y, 3, 2, '#a89a84'));
        R(20, 18, 4, 2, '#b8603c');
      } else {
        R(2, 3, 28, 25, OUT);
        R(3, 4, 26, 23, css(STONE[2]));
        R(3, 4, 26, 3, css(STONE[4]));
        R(3, 22, 26, 5, css(STONE[1]));
        R(7, 9, 1, 12, css(STONE[1]));
        R(21, 8, 1, 10, css(STONE[1]));
        R(12, 12, 8, 1, '#e8dfc8'); // a rib bone in the rock
        R(13, 14, 7, 1, '#e8dfc8');
        R(14, 16, 6, 1, '#e8dfc8');
      }
    });
  add('dig_cliff', face(false), { group: 'Dig sites', label: 'Dig cliff (fossils)', walk: 'walk' });
  add('dig_trench', face(true), { group: 'Dig sites', label: 'Dig trench (ruins)', walk: 'walk' });
  add('dig_spot', mound(false), { group: 'Dig sites', label: 'Dig spot (minerals)', walk: 'walk' });
  add('dig_fossil', mound(false, 'fossil'), { group: 'Dig sites', label: 'Dig spot (fossils)', walk: 'walk' });
  add('dig_ruin', mound(false, 'ruin'), { group: 'Dig sites', label: 'Dig spot (ruins)', walk: 'walk' });
  add('dig_shore', mound(false, 'shore'), { group: 'Dig sites', label: 'Dig spot (shore)', walk: 'walk' });
  add('dig_crater', mound(false, 'crater'), { group: 'Dig sites', label: 'Dig spot (crater)', walk: 'walk' });
  add('dig_spot@dug', mound(true), { group: 'Dig sites', label: 'Dug spot', walk: 'walk' });
  add('chest', chest(false), { group: 'Props', label: 'Treasure chest', walk: 'block' });
  add('chest_open', chest(true), { group: 'Props', label: 'Chest (open)', walk: 'block' });
  add('barrel', draw(T, T, ({ R, E }) => {
    E(16, 28, 10, 3, 'rgba(0,0,0,0.28)');
    R(7, 6, 18, 22, OUT);
    R(8, 6, 16, 21, WOOD[2]);
    R(8, 6, 4, 21, WOOD[3]);
    [9, 22].forEach((y) => R(7, y, 18, 2, '#56545a'));
    E(16, 6, 8, 2, WOOD[1]);
  }), { group: 'Props', label: 'Barrel', walk: 'block' });
  add('crate', draw(T, T, ({ R, E }) => {
    E(16, 28, 12, 3, 'rgba(0,0,0,0.28)');
    R(5, 6, 22, 22, OUT);
    R(6, 7, 20, 20, WOOD[2]);
    R(6, 7, 20, 3, WOOD[3]);
    for (let i = 0; i < 18; i++) R(7 + i, 8 + i, 2, 2, WOOD[1]);
    R(6, 16, 20, 1, WOOD[0]);
  }), { group: 'Props', label: 'Crate', walk: 'block' });
  // Where to dig: a sparkle on the sand
  add('dig_spot', anim((f) => draw(T, T, ({ R }) => {
    [[10, 18], [16, 14], [21, 19], [14, 21]].forEach(([x, y]) => R(x, y, 3, 1, '#a0804c'));
    R(13, 17, 6, 1, '#8a6a3c');
    const s = [[18, 9], [9, 12], [22, 14], [15, 7]][f];
    R(s[0], s[1] - 2, 1, 5, '#ffffff');
    R(s[0] - 2, s[1], 5, 1, '#ffffff');
  })), { group: 'Dig sites', label: 'Dig spot (sparkles)', walk: 'walk' });
  add('x_mark', draw(T, T, ({ R }) => {
    for (let i = 0; i < 16; i++) {
      R(8 + i, 8 + i, 3, 2, '#b0413e');
      R(23 - i, 8 + i, 3, 2, '#b0413e');
    }
  }), { group: 'Props', label: 'X marks the spot', walk: 'walk' });
  add('dug_hole', draw(T, T, ({ E }) => {
    E(16, 18, 11, 7, '#8a6a3c');
    E(16, 19, 9, 5, '#5a4428');
    E(16, 20, 6, 3, '#3a2a18');
    [[5, 12], [27, 14], [6, 24]].forEach(([x, y]) => E(x, y, 2, 1, '#d0ae72'));
  }), { group: 'Props', label: 'Dug hole', walk: 'walk' });
  add('shells', draw(T, T, ({ R, E }) => {
    E(9, 10, 3, 2, '#f4c8b8');
    R(8, 9, 1, 2, '#d89a88');
    R(10, 9, 1, 2, '#d89a88');
    // starfish
    [[0, -4], [4, -1], [2, 4], [-2, 4], [-4, -1]].forEach(([dx, dy]) => R(21 + dx / 2, 21 + dy / 2, 2, 2, '#e0705a'));
    [[0, -4], [4, -1], [2, 4], [-2, 4], [-4, -1]].forEach(([dx, dy]) => R(21 + dx, 21 + dy, 2, 2, '#e8845e'));
    E(12, 25, 2, 1, '#ffffff');
  }), { group: 'Props', label: 'Shells & starfish', walk: 'walk' });
  add('torch', anim((f) => draw(T, T, ({ R, E }) => {
    R(15, 14, 3, 16, OUT);
    R(16, 14, 1, 15, WOOD[2]);
    R(13, 12, 7, 4, '#56545a');
    const h = [8, 9, 7, 9][f];
    E(16, 10 - h / 3, 3 + (f % 2), h / 2, '#e8702a');
    E(16, 10 - h / 3 + 1, 2, h / 3, '#f2d36b');
    R(16, 7 - (f % 2), 1, 2, '#fff8d0');
  })), { group: 'Props', label: 'Torch', walk: 'block' });
  add('plate', draw(T, T, ({ R }) => {
    R(7, 9, 18, 15, OUT);
    R(8, 10, 16, 13, css(STONE[2]));
    R(8, 10, 16, 2, css(STONE[4]));
    R(14, 15, 4, 4, '#b0413e');
  }), { group: 'Puzzles', label: 'Pressure plate', walk: 'walk' });
  add('plate_down', draw(T, T, ({ R }) => {
    R(7, 11, 18, 13, OUT);
    R(8, 12, 16, 11, css(STONE[1]));
    R(14, 16, 4, 4, '#6fd07a');
  }), { group: 'Puzzles', label: 'Plate (pressed)', walk: 'walk' });
  const lever = (on) =>
    draw(T, T, ({ R }) => {
      R(9, 20, 14, 8, OUT);
      R(10, 21, 12, 6, css(STONE[2]));
      const x = on ? 20 : 11;
      for (let i = 0; i < 12; i++) R(16 + ((x - 16) * i) / 12, 21 - i, 2, 2, WOOD[1]);
      R(x - 1, 8, 4, 4, on ? '#6fd07a' : '#b0413e');
    });
  add('lever', lever(false), { group: 'Puzzles', label: 'Lever (off)', walk: 'block' });
  add('lever_on', lever(true), { group: 'Puzzles', label: 'Lever (on)', walk: 'block' });
  add('gate', draw(T, T, ({ R }) => {
    R(2, 2, 28, 28, OUT);
    for (let x = 4; x < 28; x += 6) R(x, 3, 3, 26, '#56545a');
    R(3, 8, 26, 2, '#88868a');
    R(3, 22, 26, 2, '#88868a');
  }), { group: 'Puzzles', label: 'Iron gate', walk: 'block' });
  add('statue_head', draw(T, 2 * T, ({ R, E }) => {
    E(16, 60, 13, 3, 'rgba(0,0,0,0.28)');
    R(4, 22, 24, 38, OUT);
    R(5, 23, 22, 36, css(STONE[2]));
    R(5, 23, 6, 36, css(STONE[3]));
    R(8, 32, 6, 3, OUT);
    R(18, 32, 6, 3, OUT);
    R(14, 36, 4, 10, css(STONE[1]));
    R(10, 50, 12, 3, OUT);
    R(3, 18, 26, 6, OUT);
    R(4, 19, 24, 4, css(STONE[1]));
  }), { group: 'Puzzles', label: 'Stone head (1×2)', w: T, h: 2 * T, walk: 'block' });

  addOutdoor(add, anim, WOOD);
}

// ---------- Grounds & garden ----------
function addOutdoor(add, anim, WOOD) {
  const IRON = '#2a2a30';
  add('lamp_post', draw(T, 2 * T, ({ R, E }) => {
    E(16, 61, 7, 2, 'rgba(0,0,0,0.28)');
    R(13, 56, 7, 5, OUT);
    R(14, 57, 5, 3, IRON);
    R(15, 20, 3, 37, IRON);
    R(16, 20, 1, 37, '#55555e');
    R(10, 8, 13, 14, OUT);
    R(11, 9, 11, 12, '#fff0b8');
    R(11, 9, 11, 2, '#ffffff');
    R(16, 9, 1, 12, OUT);
    R(9, 6, 15, 3, IRON);
    R(14, 2, 5, 4, IRON);
  }), { group: 'Grounds & garden', label: 'Lamp post (1×2)', w: T, h: 2 * T, walk: 'block' });
  const fence = (dir) =>
    draw(T, T, ({ R }) => {
      if (dir === 'h') {
        [6, 22].forEach((x) => {
          R(x - 1, 10, 5, 19, OUT);
          R(x, 11, 3, 17, '#f0ece2');
        });
        [14, 21].forEach((y) => {
          R(0, y - 1, T, 4, OUT);
          R(0, y, T, 2, '#f0ece2');
        });
      } else {
        R(13, 0, 6, T, OUT);
        R(14, 0, 4, T, '#f0ece2');
        R(14, 0, 1, T, '#ffffff');
      }
    });
  add('fence_h', fence('h'), { group: 'Grounds & garden', label: 'White fence (across)', walk: 'block' });
  add('fence_v', fence('v'), { group: 'Grounds & garden', label: 'White fence (up)', walk: 'block' });
  const hedge = (end) =>
    pixels(T, T, (x, y) => {
      const top = 4;
      if (y < top) return null;
      const e = end === 'l' ? x : end === 'r' ? T - 1 - x : 99;
      if (e < 2) return e === 0 || y === top ? hex(OUT) : JUNGLE[1];
      if (y === top || y === T - 1) return hex(OUT);
      const n = fbm(x, y, 600);
      if (y > T - 7) return JUNGLE[0];
      return n < 0.35 ? JUNGLE[1] : n < 0.7 ? JUNGLE[2] : JUNGLE[3];
    });
  add('hedge_l', hedge('l'), { group: 'Grounds & garden', label: 'Hedge end (left)', walk: 'block' });
  add('hedge', hedge(null), { group: 'Grounds & garden', label: 'Hedge', walk: 'block' });
  add('hedge_r', hedge('r'), { group: 'Grounds & garden', label: 'Hedge end (right)', walk: 'block' });
  add('topiary', draw(T, 2 * T, ({ R, E }) => {
    E(16, 61, 9, 2, 'rgba(0,0,0,0.25)');
    R(9, 50, 14, 11, OUT);
    R(10, 51, 12, 9, '#a85a32');
    R(10, 51, 12, 2, '#c0703f');
    R(15, 36, 2, 14, '#5a3a20');
    E(16, 28, 11, 11, OUT);
    E(16, 28, 10, 10, '#2e7842');
    E(13, 25, 5, 4, '#3c9048');
    E(16, 12, 6, 6, OUT);
    E(16, 12, 5, 5, '#2e7842');
    E(14, 10, 2, 2, '#58a854');
  }), { group: 'Grounds & garden', label: 'Topiary (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('flower_bed', draw(T, T, ({ R }) => {
    R(1, 14, 30, 16, OUT);
    R(2, 15, 28, 14, '#6a4428');
    for (let i = 0; i < 6; i++) {
      const x = 4 + i * 5;
      R(x + 1, 13, 1, 9, '#2e7842');
      R(x, 10 + (i % 2), 3, 4, i % 3 === 0 ? '#e0405a' : i % 3 === 1 ? '#f2d36b' : '#b06ae0');
      R(x + 1, 9 + (i % 2), 1, 1, '#ffffff');
    }
  }), { group: 'Grounds & garden', label: 'Flower bed', walk: 'block' });
  add('stepping_stone', draw(T, T, ({ E }) => {
    [[10, 12], [22, 20]].forEach(([x, y]) => {
      E(x, y + 1, 7, 4, 'rgba(0,0,0,0.2)');
      E(x, y, 7, 4, OUT);
      E(x, y, 6, 3, css(STONE[3]));
      E(x - 2, y - 1, 3, 1, css(STONE[4]));
    });
  }), { group: 'Grounds & garden', label: 'Stepping stones', walk: 'walk' });
  add('park_bench', draw(2 * T, T, ({ R, E }) => {
    E(32, 29, 26, 2, 'rgba(0,0,0,0.25)');
    [8, 54].forEach((x) => R(x, 16, 3, 13, IRON));
    R(5, 6, 54, 9, OUT);
    for (let y = 7; y < 14; y += 3) R(6, y, 52, 2, WOOD[2]);
    R(4, 16, 56, 6, OUT);
    R(5, 17, 54, 4, WOOD[3]);
  }), { group: 'Grounds & garden', label: 'Park bench (2×1)', w: 2 * T, h: T, walk: 'block' });
  add('umbrella', draw(2 * T, 2 * T, ({ ctx, R, E }) => {
    R(10, 44, 44, 14, OUT);
    R(11, 45, 42, 12, '#3a78c8');
    for (let x = 11; x < 53; x += 8) R(x, 45, 4, 12, '#f0ece2');
    R(31, 14, 2, 36, '#6a4a2a');
    ctx.fillStyle = OUT;
    ctx.beginPath();
    ctx.moveTo(4, 24);
    ctx.quadraticCurveTo(32, -6, 60, 24);
    ctx.fill();
    const stripes = ['#e0405a', '#f0ece2'];
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = stripes[i % 2];
      ctx.beginPath();
      ctx.moveTo(32, 6);
      ctx.lineTo(6 + i * 9, 22);
      ctx.lineTo(6 + (i + 1) * 9, 22);
      ctx.fill();
    }
    E(32, 23, 26, 2, 'rgba(0,0,0,0.18)');
  }), { group: 'Grounds & garden', label: 'Beach umbrella (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  add('driftwood', draw(T, T, ({ R }) => {
    for (let i = 0; i < 24; i++) R(4 + i, 20 + Math.round(Math.sin(i / 4) * 2), 2, 3, i % 5 ? '#b8a088' : '#8a7460');
    R(14, 16, 2, 5, '#b8a088');
    R(22, 22, 4, 1, '#d8c4a8');
  }), { group: 'Grounds & garden', label: 'Driftwood', walk: 'walk' });
  add('rowboat', anim((f) => draw(2 * T, T, ({ R, E }) => {
    const bob = f === 1 || f === 2 ? 1 : 0;
    E(32, 26, 28, 4, 'rgba(242,251,255,0.45)');
    E(32, 18 + bob, 27, 8, OUT);
    E(32, 17 + bob, 26, 7, '#8a5a3a');
    E(32, 15 + bob, 22, 4, '#5a3a20');
    R(10, 14 + bob, 44, 2, '#b07a4a');
    [22, 40].forEach((x) => R(x, 12 + bob, 3, 8, '#b07a4a'));
    R(44, 6 + bob, 2, 14, '#c8b088'); // an oar
    R(43, 18 + bob, 4, 5, '#c8b088');
  })), { group: 'Grounds & garden', label: 'Rowboat (2×1)', w: 2 * T, h: T, walk: 'block' });
  add('campfire', anim((f) => draw(T, T, ({ R, E }) => {
    E(16, 26, 11, 3, 'rgba(0,0,0,0.3)');
    [[8, 22], [20, 22], [14, 24]].forEach(([x, y], i) => {
      R(x, y, 10, 3, OUT);
      R(x + 1, y + 1 - (i % 2), 8, 1, WOOD[2]);
    });
    [[7, 25], [24, 25], [11, 27], [21, 27]].forEach(([x, y]) => E(x, y, 2, 1, css(STONE[2])));
    const h = [11, 13, 10, 12][f];
    E(16, 22 - h / 2, 5, h / 2, '#e8702a');
    E(16, 22 - h / 3, 3, h / 3, '#f2d36b');
    R(15 + (f % 2), 22 - h - 2, 2, 2, '#f2a03a');
    R(12 - (f % 2), 22 - h, 1, 1, '#fff4a0');
  })), { group: 'Grounds & garden', label: 'Campfire', walk: 'block' });
  add('mailbox', draw(T, T, ({ R, E }) => {
    E(16, 29, 6, 2, 'rgba(0,0,0,0.25)');
    R(15, 14, 3, 15, WOOD[1]);
    R(8, 6, 17, 10, OUT);
    R(9, 7, 15, 8, '#3a78c8');
    R(9, 7, 15, 2, '#5a98e0');
    R(22, 2, 2, 7, '#e0405a');
    R(22, 2, 5, 3, '#e0405a');
  }), { group: 'Grounds & garden', label: 'Mailbox', walk: 'block' });
}
