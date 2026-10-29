// More things for the outdoors, all drawn in code on the 32px grid:
// flowers and garden plants, more kinds of tree, rocks, path tiles and
// buildings (huts, a cottage, a lighthouse, a greenhouse, a windmill...).
// Added to the same tile set as tiles.js (see buildTiles there).
// Tall pieces set `base`: how many rows at the bottom are solid.
import { T, OUT, draw, pixels, hash, fbm, hex, css, GRASS, STONE, DIRT, SAND } from './tiles.js';
import { leafy as naturalLeafy, conifer, palm as naturalPalm, willow as naturalWillow } from './foliage.js';

const SHADOW = 'rgba(0,0,0,0.25)';
const LEAF = ['#22603a', '#2e7842', '#3c9048', '#58a854', '#7ac466'];
const WOOD = ['#4a2e1a', '#5a3a20', '#7a5232', '#946640', '#ad7c50'];

// A filled polygon (outlined if `out` is set).
function poly(ctx, pts, col, out) {
  if (out) {
    ctx.fillStyle = out;
    ctx.beginPath();
    pts.forEach(([x, y], i) => {
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
      const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      const nx = x + Math.sign(x - cx);
      const ny = y + Math.sign(y - cy);
      i ? ctx.lineTo(nx, ny) : ctx.moveTo(nx, ny);
    });
    ctx.fill();
  }
  ctx.fillStyle = col;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.fill();
}

// A round bunch of leaves with light from the top left.
function canopy(E, R, cx, cy, rx, ry, pal = LEAF, seed = 0) {
  E(cx, cy, rx + 1, ry + 1, OUT);
  E(cx, cy, rx, ry, pal[1]);
  E(cx - rx * 0.25, cy - ry * 0.2, rx * 0.7, ry * 0.65, pal[2]);
  E(cx - rx * 0.35, cy - ry * 0.4, rx * 0.4, ry * 0.35, pal[3]);
  E(cx - rx * 0.45, cy - ry * 0.55, rx * 0.15 + 1, ry * 0.12 + 1, pal[4]);
  for (let k = 0; k < rx; k++) R(cx - rx + hash(k, 1, seed) * rx * 2, cy - ry * 0.6 + hash(k, 2, seed) * ry * 1.5, 2, 1, pal[0]);
}

// Drawn one group at a time, so the game can do them in idle moments (see warmTiles in tiles.js).
export function* addScenerySlices(add, anim) {
  addFlowers(add, anim);
  yield;
  addTrees(add, anim);
  yield;
  addMoreRocks(add, anim);
  addPaths(add);
  yield;
  addBuildings(add, anim);
  yield;
  addGardenProps(add, anim);
  yield;
  addNaturalTrees(add, anim);
  yield;
}
export function addScenery(add, anim) {
  [...addScenerySlices(add, anim)];
}

// The trees and shrubs, drawn the natural way (see foliage.js). These replace
// the simpler round-canopy versions of the same names.
function addNaturalTrees(add, anim) {
  const G = 'Trees';
  const GREEN = ['#1f4a2c', '#2e6a38', '#3f8a42', '#5aa64c', '#86c664'];
  const big = (pal, seed, extra = {}) =>
    anim((f) => naturalLeafy(2 * T, 3 * T, f, { pal, seed, crown: { cx: 32, cy: 38, rx: 26, ry: 25 }, clumps: 16, trunk: { x: 32, top: 52, bottom: 93, w: 8 }, ...extra }));
  const opt = (label, w = 2, h = 3) => ({ group: G, label, w: w * T, h: h * T, walk: 'block' });
  add('tree', big(GREEN, 11), { ...opt('Leafy tree (2×3)'), group: 'Plants' });
  add('apple_tree', big(GREEN, 12, { dots: [{ color: '#d8303a', chance: 0.07 }] }), opt('Apple tree (2×3)'));
  add('orange_tree', big(['#163e26', '#22583a', '#2e7444', '#44904c', '#68ac5a'], 13, { dots: [{ color: '#f2902a', chance: 0.08 }] }), opt('Orange tree (2×3)'));
  add('cherry_tree', big(['#9a4466', '#cc6c8e', '#e696b2', '#f4bcd0', '#ffe2ee'], 14, { dots: [{ color: '#ffffff', chance: 0.05, size: 1 }] }), opt('Cherry blossom (2×3)'));
  add('maple_tree', big(['#6a1e14', '#a8381e', '#d85a26', '#ee8a32', '#f8c058'], 15), opt('Autumn maple (2×3)'));
  add('oak_tree', anim((f) => naturalLeafy(3 * T, 3 * T, f, { pal: GREEN, seed: 16, crown: { cx: 48, cy: 40, rx: 40, ry: 28 }, clumps: 24, trunk: { x: 48, top: 54, bottom: 93, w: 13 } })), opt('Big oak (3×3)', 3, 3));
  add('birch_tree', anim((f) => naturalLeafy(T, 3 * T, f, { pal: ['#3e6a24', '#5a8a30', '#78a840', '#9cc458', '#c4e080'], seed: 17, crown: { cx: 16, cy: 30, rx: 14, ry: 24 }, clumps: 12, birch: true, trunk: { x: 16, top: 40, bottom: 93, w: 5 } })), opt('Birch (1×3)', 1, 3));
  add('tropical_tree', anim((f) => naturalLeafy(2 * T, 3 * T, f, { pal: GREEN, seed: 18, crown: { cx: 32, cy: 30, rx: 29, ry: 15 }, clumps: 13, flat: true, trunk: { x: 32, top: 36, bottom: 93, w: 6 }, dots: [{ color: '#e8402a', chance: 0.1 }, { color: '#f2902a', chance: 0.04 }] })), opt('Flame tree (2×3)'));
  add('sapling', anim((f) => naturalLeafy(T, T, f, { pal: GREEN, seed: 19, crown: { cx: 16, cy: 11, rx: 9, ry: 8 }, clumps: 6, sway: 0.6, trunk: { x: 16, top: 14, bottom: 29, w: 3 } })), { group: G, label: 'Sapling', walk: 'block' });
  add('bush', naturalLeafy(T, T, 0, { pal: GREEN, seed: 20, crown: { cx: 16, cy: 18, rx: 12, ry: 10 }, clumps: 10, flat: true, sway: 0, dots: [{ color: '#e0405a', chance: 0.05 }] }), { group: 'Plants', label: 'Bush', walk: 'block' });
  add('hedge_round', naturalLeafy(T, T, 0, { pal: GREEN, seed: 21, crown: { cx: 16, cy: 17, rx: 12, ry: 11 }, clumps: 10, flat: true, sway: 0 }), { group: G, label: 'Round shrub', walk: 'block' });
  add('palm', anim((f) => naturalPalm(2 * T, 3 * T, f, { seed: 23 })), { group: 'Plants', label: 'Palm tree (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  add('willow_tree', anim((f) => naturalWillow(3 * T, 3 * T, f, { seed: 24, pal: ['#2e5424', '#46742e', '#62923c', '#84b050', '#acd070'] })), opt('Weeping willow (3×3)', 3, 3));
  // a clipped topiary: two leafy balls on a stem, in a terracotta pot
  add('topiary', (() => {
    const c = draw(T, 2 * T, ({ R, E }) => {
      E(16, 61, 9, 2, SHADOW);
      R(9, 50, 14, 11, OUT);
      R(10, 51, 12, 9, '#a85a32');
      R(10, 51, 12, 2, '#c0703f');
      R(10, 51, 3, 9, '#c0703f');
      R(15, 30, 3, 21, WOOD[1]);
      R(15, 30, 1, 21, WOOD[3]);
    });
    const ctx = c.getContext('2d');
    ctx.drawImage(naturalLeafy(T, 2 * T, 0, { pal: GREEN, seed: 25, crown: { cx: 16, cy: 30, rx: 11, ry: 10 }, clumps: 9, sway: 0, shadow: false }), 0, 0);
    ctx.drawImage(naturalLeafy(T, 2 * T, 0, { pal: GREEN, seed: 26, crown: { cx: 16, cy: 13, rx: 7, ry: 7 }, clumps: 7, sway: 0, shadow: false }), 0, 0);
    return c;
  })(), { group: 'Grounds & garden', label: 'Topiary (1×2)', w: T, h: 2 * T, walk: 'block' });
  const PINE = ['#123a26', '#1c5232', '#26683c', '#348048', '#4a9a58'];
  add('pine', anim((f) => conifer(T, 2 * T, f, { pal: PINE, seed: 22 })), { group: 'Plants', label: 'Pine tree (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('pine_snow', anim((f) => conifer(T, 2 * T, f, { pal: PINE, seed: 22, snow: true })), { group: G, label: 'Snowy pine (1×2)', w: T, h: 2 * T, walk: 'block' });
}

// ---------- Flowers and garden plants ----------
function addFlowers(add, anim) {
  const G = 'Flowers & plants';
  // One small flower: stem, petals in a plus, a center.
  const bloom = (R, x, y, petal, center = '#fff4a0', b = 0) => {
    R(x, y + 2, 1, 4, LEAF[1]);
    R(x - 1, y - b, 3, 1, petal);
    R(x, y - 1 - b, 1, 3, petal);
    R(x, y - b, 1, 1, center);
  };
  add('tulips', anim((f) => draw(T, T, ({ R }) => {
    const cols = ['#e0304a', '#f2c53d', '#f08ab0', '#e0304a', '#f8f0e0', '#f2c53d'];
    for (let i = 0; i < 6; i++) {
      const x = 4 + (i % 3) * 10 + (i > 2 ? 5 : 0);
      const y = i > 2 ? 22 : 12;
      const sway = (i + f) % 4 === 0 ? 1 : 0;
      R(x + 1, y + 2, 1, 7, LEAF[1]);
      R(x - 1, y + 5, 2, 3, LEAF[2]);
      R(x - 1 + sway, y - 1, 5, 5, OUT);
      R(x + sway, y, 3, 4, cols[i]);
      R(x + 1 + sway, y - 1, 1, 2, cols[i]);
      R(x + sway, y, 1, 2, '#ffffff66');
    }
  })), { group: G, label: 'Tulips', walk: 'walk' });
  add('daisies', anim((f) => draw(T, T, ({ R }) => {
    [[6, 8], [16, 5], [25, 10], [10, 18], [21, 20], [5, 27], [15, 27], [26, 26]].forEach(([x, y], i) => {
      const b = (i + f) % 2;
      R(x, y + 2, 1, 3, LEAF[1]);
      R(x - 2, y - b, 5, 1, '#ffffff');
      R(x, y - 2 - b, 1, 5, '#ffffff');
      R(x - 1, y - 1 - b, 3, 3, '#ffffff');
      R(x, y - b, 1, 1, '#f2c53d');
    });
  })), { group: G, label: 'Daisies', walk: 'walk' });
  add('poppies', anim((f) => draw(T, T, ({ R, E }) => {
    [[7, 9], [20, 7], [13, 17], [26, 18], [6, 25], [19, 27]].forEach(([x, y], i) => {
      const b = (i + f) % 2;
      R(x, y + 2, 1, 5, '#58a854');
      E(x, y - b, 2, 2, '#e0402a');
      R(x - 1, y - 2 - b, 1, 1, '#f86a4a');
      R(x, y - b, 1, 1, OUT);
    });
  })), { group: G, label: 'Poppies', walk: 'walk' });
  add('lavender', anim((f) => draw(T, T, ({ R, E }) => {
    E(16, 27, 13, 3, SHADOW);
    for (let i = 0; i < 9; i++) {
      const x = 4 + i * 3;
      const h = 12 + ((i * 5) % 6);
      const sway = (i + f) % 4 < 2 ? 0 : 1;
      R(x, 27 - h + 6, 1, h - 6, '#7a9a6a');
      for (let k = 0; k < 6; k++) R(x - (k % 2) + sway, 27 - h + k, 2, 1, k < 2 ? '#c8a8f0' : '#9a6ad8');
    }
    E(16, 25, 12, 3, '#6a8a5a');
  })), { group: G, label: 'Lavender', walk: 'block' });
  add('roses', draw(T, T, ({ R, E }) => {
    E(16, 28, 13, 3, SHADOW);
    E(16, 19, 13, 10, OUT);
    E(16, 19, 12, 9, LEAF[0]);
    E(13, 16, 7, 5, LEAF[1]);
    E(20, 15, 5, 4, LEAF[2]);
    [[9, 14], [17, 11], [23, 17], [12, 22], [20, 23], [15, 17]].forEach(([x, y]) => {
      E(x, y, 3, 2, '#8a1a2a');
      E(x, y, 2, 2, '#d8304a');
      R(x - 1, y - 1, 1, 1, '#f86a7a');
    });
  }), { group: G, label: 'Rose bush', walk: 'block' });
  add('hydrangea', draw(T, T, ({ R, E }) => {
    E(16, 28, 13, 3, SHADOW);
    E(16, 20, 13, 9, OUT);
    E(16, 20, 12, 8, LEAF[1]);
    [[10, 16, '#6a8ae8'], [20, 14, '#8aa8f8'], [16, 21, '#a88ae8'], [24, 21, '#6a8ae8'], [8, 22, '#8aa8f8']].forEach(([x, y, c]) => {
      E(x, y, 5, 4, OUT);
      E(x, y, 4, 3, c);
      for (let k = 0; k < 5; k++) R(x - 3 + hash(k, x, 9) * 6, y - 2 + hash(k, y, 9) * 4, 1, 1, '#e8f0ff');
    });
  }), { group: G, label: 'Hydrangea', walk: 'block' });
  add('hibiscus', draw(T, T, ({ R, E }) => {
    E(16, 28, 13, 3, SHADOW);
    E(16, 18, 13, 11, OUT);
    E(16, 18, 12, 10, '#1e6a3a');
    E(12, 14, 7, 6, '#2e8a44');
    [[9, 15], [21, 12], [18, 22], [8, 23]].forEach(([x, y]) => {
      [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]].forEach(([dx, dy]) => R(x + dx, y + dy, 2, 2, '#f04a6a'));
      R(x, y, 2, 2, '#ffd84a');
      R(x + 2, y - 3, 1, 2, '#ffd84a');
    });
  }), { group: G, label: 'Hibiscus', walk: 'block' });
  add('sunflowers', anim((f) => draw(T, 2 * T, ({ R, E }) => {
    E(16, 61, 12, 3, SHADOW);
    [[8, 14], [22, 8], [15, 22]].forEach(([x, y], i) => {
      const sway = (i + f) % 4 < 2 ? 0 : 1;
      R(x, y + 4, 2, 60 - y - 4, '#4a8a3a');
      E(x - 3, y + 18, 3, 2, '#58a854');
      E(x + 4, y + 26, 3, 2, '#58a854');
      E(x + 1 + sway, y, 7, 7, OUT);
      for (let a = 0; a < 12; a++) R(x + 1 + sway + Math.cos(a / 1.9) * 5 - 1, y + Math.sin(a / 1.9) * 5 - 1, 3, 3, a % 2 ? '#f2c53d' : '#f8d84a');
      E(x + 1 + sway, y, 3, 3, '#6a3a1a');
      R(x + sway, y - 1, 1, 1, '#8a5a2a');
    });
  })), { group: G, label: 'Sunflowers (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('wildflowers', anim((f) => draw(T, T, ({ R }) => {
    const cols = ['#8ac8f0', '#ffffff', '#f2c53d', '#f08ab0', '#b06ae0', '#8ac8f0', '#ffffff', '#f2c53d', '#e0405a'];
    for (let i = 0; i < 12; i++) {
      const x = 2 + hash(i, 1, 700) * 28;
      const y = 4 + hash(i, 2, 700) * 24;
      R(x, y + 1, 1, 2, LEAF[2]);
      R(x, y - ((i + f) % 2), 1, 1, cols[i % cols.length]);
      if (i % 3 === 0) R(x + 1, y - ((i + f) % 2), 1, 1, cols[i % cols.length]);
    }
  })), { group: G, label: 'Wildflowers', walk: 'walk' });
  add('clover', draw(T, T, ({ R }) => {
    for (let i = 0; i < 9; i++) {
      const x = 3 + hash(i, 3, 701) * 26;
      const y = 3 + hash(i, 4, 701) * 26;
      [[-1, 0], [1, 0], [0, -1]].forEach(([dx, dy]) => R(x + dx * 2, y + dy * 2, 2, 2, '#3c9a48'));
      R(x, y, 2, 2, '#58b852');
      if (i % 3 === 0) R(x + 4, y - 3, 2, 2, '#f8f0f8');
    }
  }), { group: G, label: 'Clover', walk: 'walk' });
  add('dandelions', anim((f) => draw(T, T, ({ R, E }) => {
    [[8, 12, 0], [21, 9, 1], [14, 22, 1], [25, 22, 0]].forEach(([x, y, puff]) => {
      R(x, y + 2, 1, 6, '#58a854');
      R(x - 3, y + 7, 3, 1, '#58a854');
      if (puff) {
        E(x, y, 3, 3, '#f2f2f2');
        R(x, y, 1, 1, '#c8c8c8');
        if (f === 2) R(x + 4, y - 4, 1, 1, '#ffffff');
        if (f === 3) R(x + 6, y - 6, 1, 1, '#ffffffaa');
      } else {
        E(x, y, 2, 2, '#f2c53d');
        R(x, y, 1, 1, '#f8a020');
      }
    });
  })), { group: G, label: 'Dandelions', walk: 'walk' });
  add('fern', anim((f) => draw(T, T, ({ R, E }) => {
    E(16, 28, 12, 3, SHADOW);
    const sway = [0, 1, 0, -1][f];
    [[-2.6, 13], [-2.1, 14], [-1.57, 12], [-1.0, 14], [-0.5, 13]].forEach(([a, len]) => {
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const x = 16 + Math.cos(a) * i + sway * t;
        const y = 27 + Math.sin(a) * i + t * t * 5;
        R(x, y, 2, 1, LEAF[1]);
        if (i % 2 && t < 0.9) {
          R(x - 2, y - 1, 2, 1, t > 0.5 ? LEAF[3] : LEAF[2]);
          R(x + 2, y - 1, 2, 1, t > 0.5 ? LEAF[3] : LEAF[2]);
        }
      }
    });
  })), { group: G, label: 'Fern', walk: 'walk' });
  add('reeds', anim((f) => draw(T, T, ({ R }) => {
    const sway = [0, 1, 0, -1][f];
    [[6, 14], [10, 18], [15, 12], [20, 17], [25, 13], [12, 20]].forEach(([x, top], i) => {
      for (let y = top; y < 30; y++) {
        const t = (30 - y) / (30 - top);
        R(x + Math.round(t * t * sway * (i % 2 ? 2 : 1.5)), y, 1, 1, y < top + 4 ? '#a8c868' : '#5a8a3a');
      }
      if (i % 2 === 0) {
        const tx = x + sway * 2;
        R(tx - 1, top - 6, 3, 7, OUT);
        R(tx, top - 5, 1, 5, '#7a4a2a');
      }
    });
  })), { group: G, label: 'Cattails', walk: 'grass' });
  add('cactus', draw(T, 2 * T, ({ R, E }) => {
    E(16, 61, 9, 3, SHADOW);
    const arm = (x, y, w, h) => {
      R(x - 1, y - 1, w + 2, h + 2, OUT);
      R(x, y, w, h, '#4a9a4a');
      R(x + 1, y, 1, h, '#6ab85a');
    };
    arm(12, 14, 9, 47);
    arm(4, 28, 5, 12);
    arm(4, 38, 9, 4);
    arm(24, 22, 5, 14);
    arm(20, 34, 9, 4);
    for (let y = 18; y < 58; y += 5) R(15 + (y % 2) * 3, y, 1, 1, '#e8f0c8');
    E(16, 14, 3, 2, '#f08ab0');
  }), { group: G, label: 'Cactus (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('agave', draw(T, T, ({ ctx, E }) => {
    E(16, 28, 13, 3, SHADOW);
    [[-2.8, 13], [-2.2, 14], [-1.57, 15], [-0.9, 14], [-0.3, 13], [-1.9, 10], [-1.2, 10]].forEach(([a, len], i) => {
      const tip = [16 + Math.cos(a) * len, 26 + Math.sin(a) * len];
      const px = Math.cos(a + 1.57) * 2.5;
      const py = Math.sin(a + 1.57) * 2.5;
      poly(ctx, [[16 - px, 26 - py], tip, [16 + px, 26 + py]], i > 4 ? '#8ac0a8' : '#6aa08a', OUT);
    });
  }), { group: G, label: 'Agave', walk: 'block' });
  add('bamboo', anim((f) => draw(T, 2 * T, ({ R, E }) => {
    E(16, 61, 12, 3, SHADOW);
    const sway = [0, 1, 0, -1][f];
    [[7, 6], [13, 2], [19, 8], [25, 4]].forEach(([x, top], i) => {
      for (let y = top; y < 61; y++) {
        const t = (61 - y) / (61 - top);
        const xx = x + Math.round(t * t * sway * (i % 2 ? 1 : 2));
        R(xx - 1, y, 4, 1, OUT);
        R(xx, y, 2, 1, (y - top) % 12 === 0 ? '#5a8a2a' : '#8ac848');
        if ((y - top) % 12 === 4 && y < 50) {
          R(xx + 2, y - 2, 5, 2, '#4a9a3a');
          R(xx - 5, y + 1, 5, 2, '#58a854');
        }
      }
    });
  })), { group: G, label: 'Bamboo (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('banana_plant', anim((f) => draw(2 * T, 2 * T, ({ ctx, R, E }) => {
    E(32, 61, 14, 3, SHADOW);
    R(29, 30, 6, 31, OUT);
    R(30, 30, 4, 31, '#7a9a4a');
    R(30, 30, 1, 31, '#9ab86a');
    const sway = [0, 1, 0, -1][f];
    [[-2.7, 28], [-2.1, 26], [-1.7, 22], [-1.3, 24], [-0.8, 26], [-0.3, 28]].forEach(([a, len], i) => {
      const bend = i % 2 ? 0.25 : 0.35;
      const pts = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        pts.push([32 + Math.cos(a) * len * t + sway * t * 2, 30 + Math.sin(a) * len * t + bend * t * t * len]);
      }
      const w = 5;
      const top = pts.map(([x, y], k) => [x, y - Math.sin((k / 8) * Math.PI) * w]);
      const bot = pts.map(([x, y], k) => [x, y + Math.sin((k / 8) * Math.PI) * w]).reverse();
      poly(ctx, [...top, ...bot], i % 2 ? '#4aa04a' : '#3c9048', OUT);
      pts.forEach(([x, y]) => R(x, y, 1, 1, '#2e7842'));
    });
    E(36, 36, 3, 4, '#e8c84a'); // a bunch of bananas
    E(38, 39, 2, 3, '#d8b83a');
  })), { group: G, label: 'Banana plant (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  add('monstera', draw(T, T, ({ R, E }) => {
    E(16, 28, 13, 3, SHADOW);
    [[9, 14, 8, 6], [22, 13, 7, 6], [16, 20, 9, 6], [8, 22, 6, 4], [24, 22, 6, 4]].forEach(([x, y, rx, ry], i) => {
      E(x, y, rx + 1, ry + 1, OUT);
      E(x, y, rx, ry, i % 2 ? '#2e8a44' : '#3c9a48');
      R(x, y - ry + 1, 1, ry * 2 - 2, '#22603a');
      // the holes and splits
      R(x - rx + 2, y - 1, 2, 1, OUT);
      R(x + rx - 3, y + 1, 2, 1, OUT);
      R(x - 3, y - 3, 1, 1, OUT);
    });
  }), { group: G, label: 'Monstera', walk: 'block' });
  add('pot_plant', draw(T, T, ({ R, E }) => {
    E(16, 29, 9, 2, SHADOW);
    R(9, 18, 14, 11, OUT);
    R(10, 19, 12, 9, '#c86a3a');
    R(8, 16, 16, 4, OUT);
    R(9, 17, 14, 2, '#e08a4a');
    R(10, 19, 3, 9, '#e08a4a');
    canopy(E, R, 16, 10, 8, 7, LEAF, 710);
  }), { group: G, label: 'Potted plant', walk: 'block' });
  add('planter', draw(2 * T, T, ({ R }) => {
    R(2, 14, 60, 16, OUT);
    R(3, 15, 58, 14, WOOD[3]);
    for (let x = 3; x < 61; x += 12) R(x, 15, 1, 14, WOOD[2]);
    R(3, 15, 58, 2, WOOD[4]);
    const cols = ['#e0304a', '#f2c53d', '#ffffff', '#b06ae0', '#f08ab0'];
    for (let i = 0; i < 11; i++) {
      const x = 6 + i * 5;
      R(x, 8, 2, 7, LEAF[1]);
      R(x - 2, 10, 2, 2, LEAF[2]);
      R(x - 1, 5 + (i % 2), 4, 4, cols[i % cols.length]);
      R(x, 6 + (i % 2), 2, 2, '#fff4a0');
    }
  }), { group: G, label: 'Planter box (2×1)', w: 2 * T, h: T, walk: 'block' });
  // Vegetable garden rows on tilled soil
  add('veg_patch', draw(T, T, ({ R, E }) => {
    for (let y = 0; y < T; y += 8) {
      R(0, y, T, 8, '#5a3a22');
      R(0, y + 1, T, 3, '#7a5232');
      R(0, y + 5, T, 1, '#4a2e1a');
    }
    [4, 12, 20, 28].forEach((x, i) => {
      E(x, 5, 3, 2, i % 2 ? '#58b852' : '#8ad86a'); // cabbages and lettuce
      E(x, 4, 2, 1, '#b4e488');
      R(x - 1, 13, 1, 3, '#58a854'); // carrot tops
      R(x + 1, 12, 1, 4, '#58a854');
      R(x, 16, 2, 1, '#f2802a');
      E(x, 21, 3, 2, '#3c9048'); // pumpkins / beets
      if (i % 2) E(x, 22, 2, 1, '#c8304a');
      R(x, 28, 1, 3, '#58a854');
    });
  }), { group: G, label: 'Vegetable patch', walk: 'walk' });
  add('pumpkins', draw(T, T, ({ R, E }) => {
    E(16, 27, 13, 3, SHADOW);
    for (let i = 0; i < 12; i++) R(2 + i * 2.5, 22 + Math.sin(i) * 2, 2, 1, LEAF[1]);
    [[10, 20, 7, 5], [22, 22, 5, 4]].forEach(([x, y, rx, ry]) => {
      E(x, y, rx + 1, ry + 1, OUT);
      E(x, y, rx, ry, '#e8802a');
      R(x - rx / 2, y - ry + 1, 1, ry * 2 - 2, '#c8601a');
      R(x + rx / 2, y - ry + 1, 1, ry * 2 - 2, '#c8601a');
      R(x - 1, y - ry - 2, 2, 3, '#5a3a1a');
      E(x - rx / 2, y - 2, 1, 1, '#f8a04a');
    });
  }), { group: G, label: 'Pumpkins', walk: 'block' });
  add('hay_bale', draw(T, T, ({ R, E }) => {
    E(16, 28, 14, 3, SHADOW);
    R(2, 10, 28, 18, OUT);
    R(3, 11, 26, 16, '#d8b45a');
    R(3, 11, 26, 3, '#f0d07a');
    for (let k = 0; k < 18; k++) R(4 + hash(k, 1, 720) * 24, 13 + hash(k, 2, 720) * 12, 2, 1, '#b8943a');
    [10, 21].forEach((x) => R(x, 10, 2, 18, '#8a5a2a'));
  }), { group: G, label: 'Hay bale', walk: 'block' });
}

// ---------- Trees ----------
function addTrees(add, anim) {
  const G = 'Trees';
  const trunk = (R, x, top, bottom, w, pal = WOOD) => {
    R(x - 1, top, w + 2, bottom - top, OUT);
    R(x, top, w, bottom - top, pal[2]);
    R(x + 1, top, 2, bottom - top, pal[3]);
    R(x - 4, bottom - 4, 5, 4, pal[2]);
    R(x + w - 1, bottom - 4, 5, 4, pal[2]);
  };
  // a leafy 2×3 tree in any colors; `fruit` dots the leaves
  const leafy = (pal, fruit, seed, falling) =>
    anim((f) => draw(2 * T, 3 * T, ({ E, R }) => {
      E(32, 90, 21, 4, SHADOW);
      trunk(R, 27, 54, 90, 10);
      const s = f === 1 || f === 2 ? 1 : 0;
      canopy(E, R, 32, 36, 29, 24, pal, seed);
      E(21 + s, 31, 15, 12, pal[2]);
      E(43 - s, 29, 13, 11, pal[2]);
      E(30, 20, 13, 9, pal[3]);
      E(25, 16, 6, 4, pal[4]);
      E(44, 23, 5, 3, pal[4]);
      for (let k = 0; k < 16; k++) R(8 + hash(k, 1, seed) * 48, 16 + hash(k, 2, seed) * 36, 2, 1, pal[0]);
      if (fruit) for (let k = 0; k < 9; k++) E(10 + hash(k, 5, seed) * 44, 22 + hash(k, 6, seed) * 28, 1.5, 1.5, fruit);
      if (falling) {
        // a few petals or leaves drifting down
        for (let k = 0; k < 3; k++) {
          const y = 60 + ((f * 6 + k * 10) % 30);
          R(12 + k * 18 + ((f + k) % 2) * 2, y, 2, 1, falling);
        }
      }
    }));
  add('cherry_tree', leafy(['#c06a8a', '#e88ab0', '#f4a8c8', '#f8c8dc', '#ffe8f0'], null, 801, '#f8c8dc'), { group: G, label: 'Cherry blossom (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  add('maple_tree', leafy(['#8a2a1a', '#c84a2a', '#e8702a', '#f2a03a', '#f8d06a'], null, 802, '#e8702a'), { group: G, label: 'Autumn maple (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  add('apple_tree', leafy(LEAF, '#d8303a', 803), { group: G, label: 'Apple tree (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  add('orange_tree', leafy(['#1e5a32', '#2a7040', '#368a48', '#4aa050', '#6abc5a'], '#f2902a', 804), { group: G, label: 'Orange tree (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  add('oak_tree', anim((f) => draw(3 * T, 3 * T, ({ E, R }) => {
    E(48, 90, 30, 5, SHADOW);
    trunk(R, 41, 50, 90, 14);
    R(33, 56, 10, 4, WOOD[2]); // a branch
    const s = f === 1 || f === 2 ? 1 : 0;
    canopy(E, R, 48, 36, 44, 28, LEAF, 805);
    E(30 + s, 32, 20, 14, LEAF[2]);
    E(64 - s, 30, 20, 14, LEAF[2]);
    E(46, 18, 18, 10, LEAF[3]);
    E(40, 14, 8, 4, LEAF[4]);
    E(66, 22, 6, 3, LEAF[4]);
    for (let k = 0; k < 26; k++) R(10 + hash(k, 1, 806) * 76, 14 + hash(k, 2, 806) * 40, 2, 1, LEAF[0]);
  })), { group: G, label: 'Big oak (3×3)', w: 3 * T, h: 3 * T, walk: 'block' });
  add('birch_tree', anim((f) => draw(T, 3 * T, ({ E, R }) => {
    E(16, 91, 10, 3, SHADOW);
    R(13, 30, 7, 61, OUT);
    R(14, 30, 5, 61, '#f2f0e8');
    for (let y = 34; y < 90; y += 7) R(14 + ((y / 7) % 2) * 2, y, 3, 1, '#3a3a3a');
    const s = f === 1 || f === 2 ? 1 : 0;
    canopy(E, R, 16 + s, 26, 12, 20, ['#4a7a2a', '#6a9a3a', '#8ab84a', '#a8d06a', '#c8e88a'], 807);
    E(10, 40, 6, 6, OUT);
    E(10, 40, 5, 5, '#8ab84a');
  })), { group: G, label: 'Birch (1×3)', w: T, h: 3 * T, walk: 'block' });
  add('willow_tree', anim((f) => draw(3 * T, 3 * T, ({ E, R }) => {
    E(48, 90, 28, 5, SHADOW);
    trunk(R, 42, 40, 90, 12);
    canopy(E, R, 48, 26, 36, 18, ['#3a6a2a', '#5a8a3a', '#7aa848', '#9ac460', '#b8dc80'], 808);
    // long hanging strands that sway
    const sway = [0, 1, 0, -1][f];
    for (let i = 0; i < 26; i++) {
      const x = 14 + i * 2.7;
      const len = 30 + hash(i, 3, 808) * 30;
      for (let k = 0; k < len; k++) {
        const t = k / len;
        R(x + Math.round(t * t * sway * 3) - 1, 30 + k, 3, 1, OUT);
      }
      for (let k = 0; k < len; k++) {
        const t = k / len;
        R(x + Math.round(t * t * sway * 3), 30 + k, 1, 1, k % 4 === 0 ? '#9ac460' : i % 2 ? '#5a8a3a' : '#7aa848');
      }
    }
  })), { group: G, label: 'Weeping willow (3×3)', w: 3 * T, h: 3 * T, walk: 'block' });
  add('dead_tree', draw(2 * T, 3 * T, ({ R, E }) => {
    E(32, 90, 14, 3, SHADOW);
    const branch = (x, y, a, len, w) => {
      for (let i = 0; i < len; i++) R(x + Math.cos(a) * i - 1, y + Math.sin(a) * i - 1, w + 2, w + 2, OUT);
      for (let i = 0; i < len; i++) R(x + Math.cos(a) * i, y + Math.sin(a) * i, w, w, '#6a5a4a');
    };
    R(27, 40, 10, 50, OUT);
    R(28, 40, 8, 50, '#6a5a4a');
    R(29, 40, 2, 50, '#8a7a6a');
    branch(30, 44, -2.3, 22, 3);
    branch(34, 50, -0.6, 22, 3);
    branch(31, 40, -1.7, 26, 3);
    branch(16, 28, -2.0, 10, 2);
    branch(50, 38, -1.0, 10, 2);
    branch(26, 16, -0.8, 8, 2);
  }), { group: G, label: 'Bare tree (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  add('pine_snow', draw(T, 2 * T, ({ E, R }) => {
    E(16, 61, 11, 3, SHADOW);
    R(14, 50, 5, 12, WOOD[1]);
    [[14, 13], [26, 12], [38, 14], [50, 15]].forEach(([y, w], i) => {
      for (let k = 0; k < 12; k++) {
        const half = Math.round((w * (k + 2)) / 14);
        R(16 - half - 1, y - 12 + k, half * 2 + 2, 1, OUT);
        R(16 - half, y - 12 + k, half * 2, 1, k < 3 ? '#ffffff' : k < 5 ? '#d4e2ee' : i % 2 ? '#22603a' : '#2e7842');
      }
    });
    R(15, 1, 2, 3, '#ffffff');
  }), { group: G, label: 'Snowy pine (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('sapling', anim((f) => draw(T, T, ({ R, E }) => {
    E(16, 28, 7, 2, SHADOW);
    R(15, 14, 2, 14, WOOD[2]);
    R(12, 27, 8, 2, '#5a3a22');
    const s = f % 2;
    canopy(E, R, 16 + s, 11, 7, 6, LEAF, 809);
  })), { group: G, label: 'Sapling', walk: 'block' });
  add('tropical_tree', anim((f) => draw(2 * T, 3 * T, ({ E, R }) => {
    E(32, 90, 18, 4, SHADOW);
    R(29, 40, 7, 50, OUT);
    R(30, 40, 5, 50, '#8a6a4a');
    R(30, 40, 1, 50, '#aa8a6a');
    const s = f === 1 || f === 2 ? 1 : 0;
    // a wide, flat umbrella of leaves (a flame tree in bloom)
    E(32, 32, 31, 13, OUT);
    E(32, 32, 30, 12, '#2e7842');
    E(26 + s, 28, 20, 8, '#3c9048');
    E(32, 24, 14, 5, '#58a854');
    for (let k = 0; k < 22; k++) R(6 + hash(k, 1, 810) * 52, 22 + hash(k, 2, 810) * 18, 3, 2, k % 3 ? '#e8402a' : '#f2902a');
  })), { group: G, label: 'Flame tree (2×3)', w: 2 * T, h: 3 * T, walk: 'block' });
  add('hedge_round', draw(T, T, ({ E, R }) => {
    E(16, 28, 12, 3, SHADOW);
    canopy(E, R, 16, 17, 13, 11, LEAF, 811);
  }), { group: G, label: 'Round shrub', walk: 'block' });
  add('fallen_leaves', draw(T, T, ({ R }) => {
    const cols = ['#e8702a', '#c84a2a', '#f2a03a', '#a8642a', '#f2c53d'];
    for (let i = 0; i < 16; i++) {
      const x = 2 + hash(i, 1, 812) * 28;
      const y = 2 + hash(i, 2, 812) * 28;
      R(x, y, 3, 2, cols[i % cols.length]);
      R(x + 1, y + 1, 1, 1, '#6a3a1a');
    }
  }), { group: G, label: 'Fallen leaves', walk: 'walk' });
}

// ---------- More rocks ----------
function addMoreRocks(add, anim) {
  const G = 'Rocks';
  const S = STONE.map(css);
  add('rock_mossy', draw(T, T, ({ E, R }) => {
    E(16, 27, 13, 3, 'rgba(0,0,0,0.28)');
    E(16, 18, 13, 10, OUT);
    E(16, 18, 12, 9, S[1]);
    E(15, 17, 11, 8, S[2]);
    E(11, 13, 5, 3, S[3]);
    E(16, 10, 10, 3, '#4a8a3a');
    E(13, 9, 5, 2, '#6aa84a');
    for (let k = 0; k < 6; k++) R(6 + hash(k, 1, 820) * 20, 11 + hash(k, 2, 820) * 4, 2, 2, '#58a854');
  }), { group: G, label: 'Mossy rock', walk: 'block' });
  add('standing_stone', draw(T, 2 * T, ({ ctx, E, R }) => {
    E(16, 60, 11, 3, 'rgba(0,0,0,0.3)');
    poly(ctx, [[9, 60], [7, 20], [12, 6], [20, 4], [25, 16], [24, 60]], S[1], OUT);
    poly(ctx, [[10, 58], [9, 22], [13, 8], [18, 7], [17, 58]], S[2]);
    R(12, 10, 2, 30, S[3]);
    // carved spiral
    [[16, 26], [17, 27], [18, 29], [17, 31], [15, 31], [14, 29], [15, 28]].forEach(([x, y]) => R(x, y, 1, 1, S[0]));
    E(16, 56, 9, 2, '#4a8a3a');
  }), { group: G, label: 'Standing stone (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('rock_slab', draw(T, T, ({ ctx, E, R }) => {
    E(16, 26, 14, 3, 'rgba(0,0,0,0.25)');
    poly(ctx, [[3, 24], [5, 15], [24, 12], [29, 19], [27, 25]], S[2], OUT);
    poly(ctx, [[5, 15], [24, 12], [29, 19], [8, 20]], S[3]);
    R(10, 15, 8, 1, S[4]);
    R(8, 22, 16, 1, S[1]);
  }), { group: G, label: 'Flat rock', walk: 'block' });
  add('pebbles', draw(T, T, ({ E }) => {
    for (let i = 0; i < 9; i++) {
      const x = 4 + hash(i, 1, 821) * 24;
      const y = 4 + hash(i, 2, 821) * 24;
      E(x, y + 1, 2, 1, 'rgba(0,0,0,0.2)');
      E(x, y, 2, 1, S[1 + (i % 3)]);
    }
  }), { group: G, label: 'Pebbles', walk: 'walk' });
  add('cairn', draw(T, T, ({ E, R }) => {
    E(16, 29, 9, 2, 'rgba(0,0,0,0.28)');
    [[16, 25, 8, 4], [16, 18, 6, 3], [16, 12, 5, 3], [16, 7, 3, 2]].forEach(([x, y, rx, ry], i) => {
      E(x, y, rx + 1, ry + 1, OUT);
      E(x, y, rx, ry, S[1 + (i % 3)]);
      R(x - rx / 2, y - ry / 2, 2, 1, S[4]);
    });
  }), { group: G, label: 'Stone cairn', walk: 'block' });
  add('ore_rock', anim((f) => draw(T, T, ({ E, R }) => {
    E(16, 27, 13, 3, 'rgba(0,0,0,0.28)');
    E(16, 18, 13, 10, OUT);
    E(16, 18, 12, 9, S[1]);
    E(14, 16, 9, 7, S[2]);
    [[10, 16], [18, 13], [21, 21], [13, 22]].forEach(([x, y], i) => {
      R(x, y, 3, 2, '#c8962a');
      R(x, y, 1, 1, (i + f) % 4 === 0 ? '#ffffff' : '#f8d84a');
    });
  })), { group: G, label: 'Gold ore rock', walk: 'block' });
  add('fossil_rock', draw(T, T, ({ E, R }) => {
    E(16, 27, 13, 3, 'rgba(0,0,0,0.28)');
    E(16, 18, 13, 10, OUT);
    E(16, 18, 12, 9, '#a8987a');
    E(14, 16, 10, 7, '#c4b494');
    // an ammonite spiral
    const pts = [];
    for (let a = 0; a < 14; a += 0.4) pts.push([16 + Math.cos(a) * a * 0.45, 18 + Math.sin(a) * a * 0.4]);
    pts.forEach(([x, y]) => R(x, y, 1, 1, '#6a5a44'));
  }), { group: G, label: 'Fossil in rock', walk: 'block' });
  add('rock_arch', draw(2 * T, 2 * T, ({ ctx, E }) => {
    E(32, 60, 28, 3, 'rgba(0,0,0,0.3)');
    poly(ctx, [[2, 60], [4, 30], [12, 12], [26, 4], [40, 4], [54, 12], [60, 30], [62, 60], [48, 60], [46, 36], [40, 26], [24, 26], [18, 36], [16, 60]], S[1], OUT);
    poly(ctx, [[5, 58], [6, 30], [13, 14], [26, 7], [36, 7], [24, 14], [16, 26], [12, 40], [12, 58]], S[2]);
    poly(ctx, [[14, 14], [26, 7], [30, 8], [20, 14]], S[3]);
    E(32, 6, 8, 2, '#4a8a3a');
  }), { group: G, label: 'Rock arch (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  add('tide_pool', anim((f) => draw(2 * T, T, ({ E, R }) => {
    E(32, 17, 29, 12, OUT);
    E(32, 16, 28, 11, S[2]);
    E(32, 17, 23, 8, '#2a6aa8');
    E(30, 16, 20, 6, '#3a8ac8');
    E(26 + (f % 2), 14, 6, 2, '#8ac8f0');
    R(20, 19, 4, 2, '#e05a3a'); // a starfish
    R(21, 18, 2, 4, '#e05a3a');
    E(42, 18, 2, 2, '#8a3ab8'); // an urchin
    R(36, 13, 3, 1, '#58a854');
    [[8, 10], [55, 12], [12, 24], [50, 24]].forEach(([x, y]) => E(x, y, 3, 2, S[3]));
  })), { group: G, label: 'Tide pool (2×1)', w: 2 * T, h: T, walk: 'block' });
  add('geode', anim((f) => draw(T, T, ({ E, R }) => {
    E(16, 27, 12, 3, 'rgba(0,0,0,0.28)');
    E(16, 18, 12, 10, OUT);
    E(16, 18, 11, 9, S[1]);
    E(17, 18, 7, 6, '#e8e0f8');
    E(17, 18, 5, 4, '#9a6ad8');
    E(17, 18, 2, 2, '#5a2a9a');
    R(14 + (f % 2) * 4, 15, 1, 1, '#ffffff');
  })), { group: G, label: 'Geode', walk: 'block' });
}

// ---------- Paths ----------
function addPaths(add) {
  const G = 'Paths';
  add('path_brick', pixels(T, T, (x, y) => {
    // herringbone-ish running bond
    const row = Math.floor(y / 8);
    const off = row % 2 ? 8 : 0;
    const bx = (x + off) % 16;
    if (y % 8 === 7 || bx === 15) return hex('#7a3a2a');
    const n = hash(Math.floor((x + off) / 16), row, 830);
    const base = n < 0.33 ? '#b85a3a' : n < 0.66 ? '#c8684a' : '#a85034';
    return y % 8 === 0 ? hex('#d88a6a') : hex(base);
  }), { group: G, label: 'Brick path', walk: 'walk' });
  add('path_flagstone', pixels(T, T, (x, y) => {
    // irregular slabs from a few seeded centers (wraps so tiles join)
    const cs = [[6, 6], [22, 4], [14, 16], [28, 18], [4, 24], [20, 28]];
    let best = 1e9;
    let second = 1e9;
    let id = 0;
    cs.forEach(([cx, cy], i) => {
      for (const ox of [-T, 0, T])
        for (const oy of [-T, 0, T]) {
          const d = Math.hypot(x - cx - ox, y - cy - oy);
          if (d < best) {
            second = best;
            best = d;
            id = i;
          } else if (d < second) second = d;
        }
    });
    if (second - best < 1.5) return hex('#6a7a5a'); // grass in the gaps
    const v = fbm(x, y, 831) * 0.5 + hash(id, 0, 832) * 0.5;
    return STONE[v < 0.4 ? 2 : v < 0.7 ? 3 : 4];
  }), { group: G, label: 'Flagstone', walk: 'walk' });
  add('path_gravel', pixels(T, T, (x, y) => {
    const n = hash(x, y, 833);
    if (n > 0.93) return STONE[4];
    if (n > 0.8) return STONE[1];
    const v = fbm(x, y, 834);
    return hex(v < 0.45 ? '#b8ac98' : v < 0.7 ? '#c8bca8' : '#d6ccb8');
  }), { group: G, label: 'Gravel', walk: 'walk' });
  add('path_boardwalk', draw(T, T, ({ R }) => {
    for (let i = 0; i < 4; i++) {
      const o = i * 8;
      R(0, o, T, 8, OUT);
      R(0, o + 1, T, 6, i % 2 ? '#c8a878' : '#d8b888');
      R(0, o + 1, T, 1, '#e8c898');
      R((i * 13) % T, o + 3, 4, 1, '#a8885a');
    }
    [4, 28].forEach((x) => [3, 11, 19, 27].forEach((y) => R(x, y, 1, 1, '#5a4a3a')));
  }), { group: G, label: 'Boardwalk', walk: 'walk' });
  add('path_mosaic', pixels(T, T, (x, y) => {
    const cx = x - 15.5;
    const cy = y - 15.5;
    const d = Math.max(Math.abs(cx), Math.abs(cy));
    if (x % 4 === 3 || y % 4 === 3) return hex('#8a8478');
    const ring = Math.floor(d / 4);
    return hex(['#e8e2d4', '#3a78c8', '#e8e2d4', '#c8a040'][ring % 4]);
  }), { group: G, label: 'Mosaic tiles', walk: 'walk' });
  add('path_stairs', pixels(T, T, (x, y) => {
    const step = y % 8;
    if (step === 7) return hex(OUT);
    if (step === 6) return STONE[0];
    return step < 2 ? STONE[4] : STONE[3];
  }), { group: G, label: 'Stone steps', walk: 'walk' });
  add('path_dirt_track', pixels(T, T, (x, y) => {
    // two wheel ruts with grass down the middle
    const n = fbm(x, y, 835);
    if ((x > 12 && x < 20) || x < 3 || x > 28) return n > 0.5 ? GRASS[2] : GRASS[1];
    return DIRT[n < 0.4 ? 1 : n < 0.7 ? 2 : 3];
  }), { group: G, label: 'Cart track', walk: 'walk' });
  add('path_sand', pixels(T, T, (x, y) => {
    const n = fbm(x, y, 836);
    if (hash(x, y, 837) > 0.96) return SAND[4];
    return SAND[n < 0.4 ? 1 : n < 0.7 ? 2 : 3];
  }), { group: G, label: 'Sandy path', walk: 'walk' });
}

// ---------- Buildings ----------
function addBuildings(add, anim) {
  const G = 'Buildings';
  const win = (R, x, y, w, h, lit = '#f2d9a0') => {
    R(x - 1, y - 1, w + 2, h + 2, OUT);
    R(x, y, w, h, lit);
    R(x, y, w, 2, '#fff4d0');
    R(x + Math.floor(w / 2), y, 1, h, OUT);
    R(x, y + Math.floor(h / 2), w, 1, OUT);
  };
  const door = (R, x, y, w, h, col = WOOD[2]) => {
    R(x - 1, y - 1, w + 2, h + 1, OUT);
    R(x, y, w, h, col);
    R(x + 1, y + 1, w - 2, 1, WOOD[4]);
    R(x + w - 3, y + h / 2, 1, 2, '#f2c53d');
  };
  // Cottage: 3×3, stone and timber, a tiled roof and a chimney with smoke
  add('cottage', anim((f) => draw(3 * T, 3 * T, ({ ctx, R, E }) => {
    E(48, 93, 44, 3, SHADOW);
    R(8, 46, 80, 47, OUT);
    R(9, 47, 78, 45, '#efe6d4');
    for (let y = 47; y < 92; y += 6) for (let x = 9 + ((y / 6) % 2) * 4; x < 87; x += 9) R(x, y, Math.min(8, 87 - x), 5, hash(x, y, 840) > 0.5 ? '#e8dcc4' : '#f2ead8');
    [9, 47, 85].forEach((x) => R(x, 47, 2, 45, WOOD[1]));
    R(9, 47, 78, 2, WOOD[1]);
    win(R, 18, 58, 14, 12);
    win(R, 64, 58, 14, 12);
    [18, 64].forEach((x) => R(x - 2, 71, 18, 3, '#c84a3a')); // window boxes
    [18, 64].forEach((x) => [0, 4, 8, 12].forEach((d) => R(x + d, 69, 2, 2, d % 8 ? '#f2c53d' : '#f08ab0')));
    door(R, 40, 66, 16, 26, '#3a6a8a');
    R(38, 63, 20, 3, OUT);
    // the roof
    poly(ctx, [[0, 50], [48, 8], [96, 50]], OUT);
    poly(ctx, [[3, 48], [48, 11], [93, 48]], '#b8503a');
    for (let y = 16; y < 48; y += 5) {
      const half = ((y - 11) / 37) * 45;
      R(48 - half, y, half * 2, 1, '#8a3a2a');
    }
    poly(ctx, [[3, 48], [48, 11], [48, 16], [10, 48]], '#d0684a');
    R(66, 10, 10, 20, OUT); // chimney
    R(67, 11, 8, 19, '#a8987a');
    R(65, 8, 12, 4, OUT);
    // smoke puffs rising
    [0, 1, 2].forEach((k) => {
      const t = ((f + k * 1.33) % 4) / 4;
      E(71 + t * 6, 4 - t * 4 + 4, 2 + t * 2, 1.5 + t * 1.5, `rgba(230,230,235,${0.8 - t * 0.6})`);
    });
  })), { group: G, label: 'Cottage (3×3)', w: 3 * T, h: 3 * T, base: 2, walk: 'block' });
  // Beach hut: 2×2, striped, on little stilts
  add('beach_hut', draw(2 * T, 2 * T, ({ ctx, R, E }) => {
    E(32, 62, 26, 2, SHADOW);
    [10, 52].forEach((x) => R(x, 54, 3, 8, WOOD[2]));
    R(4, 22, 56, 34, OUT);
    for (let x = 5; x < 59; x += 6) R(x, 23, 3, 32, '#f8f4ec');
    for (let x = 8; x < 59; x += 6) R(x, 23, 3, 32, '#3a8ac8');
    R(4, 54, 56, 2, OUT);
    door(R, 25, 34, 14, 20, '#f2c53d');
    poly(ctx, [[0, 24], [32, 4], [64, 24]], OUT);
    poly(ctx, [[3, 23], [32, 7], [61, 23]], '#e0503a');
    poly(ctx, [[3, 23], [32, 7], [32, 11], [9, 23]], '#f2704a');
    R(16, 56, 32, 3, WOOD[3]); // steps
  }), { group: G, label: 'Beach hut (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  // Tiki hut: 3×3, bamboo posts, a big shaggy thatched roof
  add('tiki_hut', anim((f) => draw(3 * T, 3 * T, ({ ctx, R, E }) => {
    E(48, 93, 40, 3, SHADOW);
    [14, 78].forEach((x) => {
      R(x - 1, 48, 6, 45, OUT);
      R(x, 48, 4, 45, '#c8a868');
      for (let y = 52; y < 92; y += 8) R(x, y, 4, 1, '#8a6a3a');
    });
    R(20, 62, 56, 30, OUT);
    R(21, 63, 54, 29, '#a8844a');
    for (let x = 21; x < 75; x += 4) R(x, 63, 1, 29, '#8a6a3a');
    R(40, 70, 16, 22, '#3a2a1a'); // open doorway
    R(22, 84, 52, 2, '#6a4a2a');
    // thatch: layered fringes
    const sway = f % 2;
    poly(ctx, [[2, 58], [48, 6], [94, 58]], OUT);
    poly(ctx, [[5, 56], [48, 9], [91, 56]], '#c8a050');
    for (let y = 18; y <= 56; y += 9) {
      const half = ((y - 9) / 47) * 43;
      for (let x = 48 - half; x < 48 + half; x += 3) {
        R(x, y - 1, 2, 4 + ((x + y) % 3), y === 56 ? '#a88038' : '#e0b860');
        if (y === 56) R(x + sway, y + 2, 1, 3, '#a88038');
      }
    }
    // a torch either side
    [6, 88].forEach((x, i) => {
      R(x, 70, 2, 22, WOOD[2]);
      E(x + 1, 67, 3, 4, (f + i) % 2 ? '#f2a03a' : '#e8702a');
      E(x + 1, 68, 1, 2, '#fff4a0');
    });
  })), { group: G, label: 'Tiki hut (3×3)', w: 3 * T, h: 3 * T, base: 2, walk: 'block' });
  // Lighthouse: 2×4, red and white bands, a turning light
  add('lighthouse', anim((f) => draw(2 * T, 4 * T, ({ ctx, R, E }) => {
    E(32, 125, 26, 3, SHADOW);
    R(8, 110, 48, 16, OUT); // the base
    R(9, 111, 46, 14, css(STONE[2]));
    R(9, 111, 46, 2, css(STONE[3]));
    door(R, 27, 110, 10, 15, '#3a5a7a');
    // tapering tower
    for (let y = 36; y < 110; y++) {
      const t = (y - 36) / 74;
      const half = 12 + t * 8;
      R(32 - half - 1, y, half * 2 + 2, 1, OUT);
      const band = Math.floor((y - 36) / 15) % 2;
      R(32 - half, y, half * 2, 1, band ? '#d8303a' : '#f8f4ec');
      R(32 - half, y, 3, 1, band ? '#e8505a' : '#ffffff');
      R(32 + half - 3, y, 3, 1, band ? '#a8202a' : '#d8d4cc');
    }
    win(R, 29, 60, 6, 8);
    win(R, 29, 88, 6, 8);
    R(16, 32, 32, 5, OUT); // the gallery
    R(17, 33, 30, 3, '#3a3a40');
    for (let x = 18; x < 47; x += 4) R(x, 26, 1, 7, OUT);
    R(16, 25, 32, 2, OUT);
    R(22, 12, 20, 14, OUT); // the lamp room
    R(23, 13, 18, 12, '#fff4b0');
    R(23 + ((f * 5) % 15), 13, 4, 12, '#ffffff');
    R(31, 13, 1, 12, OUT);
    poly(ctx, [[19, 13], [32, 2], [45, 13]], '#d8303a', OUT);
    R(31, 0, 2, 3, OUT);
    // the beam sweeping round
    if (f === 0 || f === 3) {
      ctx.fillStyle = 'rgba(255,248,200,0.35)';
      ctx.beginPath();
      ctx.moveTo(32, 19);
      ctx.lineTo(f ? 64 : 0, 10);
      ctx.lineTo(f ? 64 : 0, 28);
      ctx.fill();
    }
  })), { group: G, label: 'Lighthouse (2×4)', w: 2 * T, h: 4 * T, walk: 'block' });
  // Greenhouse: 3×3, glass panes on a white frame, plants inside
  add('greenhouse', draw(3 * T, 3 * T, ({ ctx, R, E }) => {
    E(48, 93, 44, 3, SHADOW);
    R(6, 46, 84, 47, OUT);
    R(7, 47, 82, 45, '#cfe8e0');
    // plants seen through the glass
    for (let i = 0; i < 9; i++) canopy(E, R, 14 + i * 9, 72 + (i % 2) * 4, 6, 6, LEAF, 850 + i);
    [[20, 66, '#e0405a'], [44, 70, '#f2c53d'], [70, 66, '#b06ae0']].forEach(([x, y, c]) => E(x, y, 2, 2, c));
    R(7, 80, 82, 12, '#a87a4a'); // the low brick wall
    for (let x = 7; x < 89; x += 8) R(x, 80, 1, 12, '#8a5a3a');
    R(7, 80, 82, 1, '#c89a6a');
    for (let x = 7; x <= 89; x += 14) R(x - 1, 47, 2, 33, '#f8f8f4');
    R(7, 62, 82, 2, '#f8f8f4');
    door(R, 41, 60, 14, 32, 'rgba(200,232,224,0.9)');
    R(41, 60, 14, 32, 'rgba(255,255,255,0.25)');
    // curved glass roof
    ctx.fillStyle = OUT;
    ctx.beginPath();
    ctx.moveTo(3, 48);
    ctx.quadraticCurveTo(48, -6, 93, 48);
    ctx.fill();
    ctx.fillStyle = '#b8e0e8';
    ctx.beginPath();
    ctx.moveTo(6, 47);
    ctx.quadraticCurveTo(48, -2, 90, 47);
    ctx.fill();
    for (let i = 1; i < 7; i++) {
      // ribs from the curve down to the eaves
      const x = 6 + i * 12;
      const t = (x - 6) / 84;
      const top = 47 * (1 - t) * (1 - t) - 2 * 2 * t * (1 - t) + 47 * t * t + 1;
      ctx.fillStyle = '#f8f8f4';
      ctx.fillRect(x, top, 2, 47 - top);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(20, 26, 8, 3);
    ctx.fillRect(56, 22, 12, 2);
  }), { group: G, label: 'Greenhouse (3×3)', w: 3 * T, h: 3 * T, base: 2, walk: 'block' });
  // Gazebo: 3×3, open sides, a white roof with a finial
  add('gazebo', draw(3 * T, 3 * T, ({ ctx, R, E }) => {
    E(48, 92, 42, 4, SHADOW);
    R(8, 84, 80, 9, OUT);
    R(9, 85, 78, 7, '#e8e2d4');
    R(9, 85, 78, 2, '#ffffff');
    [12, 32, 60, 80].forEach((x) => {
      R(x - 1, 40, 6, 45, OUT);
      R(x, 40, 4, 45, '#f8f4ec');
    });
    // railings between the posts
    [[16, 32], [64, 80]].forEach(([a, b]) => {
      R(a, 66, b - a, 2, '#f8f4ec');
      for (let x = a + 2; x < b; x += 4) R(x, 68, 1, 16, '#f8f4ec');
    });
    poly(ctx, [[2, 42], [48, 8], [94, 42]], OUT);
    poly(ctx, [[5, 40], [48, 11], [91, 40]], '#f0ece2');
    poly(ctx, [[5, 40], [48, 11], [48, 40]], '#d8d4ca');
    R(4, 40, 88, 4, OUT);
    R(5, 41, 86, 2, '#3a7a5a');
    for (let x = 6; x < 90; x += 6) E(x + 2, 44, 2, 2, '#3a7a5a'); // scalloped trim
    R(47, 0, 2, 11, OUT);
    E(48, 3, 2, 2, '#f2c53d');
  }), { group: G, label: 'Gazebo (3×3)', w: 3 * T, h: 3 * T, walk: 'block' });
  // Windmill: 3×4, the sails turning
  add('windmill', anim((f) => draw(3 * T, 4 * T, ({ ctx, R, E }) => {
    E(48, 125, 30, 3, SHADOW);
    // tapering stone tower
    for (let y = 40; y < 126; y++) {
      const half = 14 + ((y - 40) / 86) * 12;
      R(48 - half - 1, y, half * 2 + 2, 1, OUT);
      R(48 - half, y, half * 2, 1, (Math.floor(y / 6) + Math.floor((y % 12) / 6)) % 2 ? '#e8dcc4' : '#f2ead8');
      R(48 - half, y, 3, 1, '#fff8ea');
    }
    door(R, 41, 104, 14, 22, WOOD[2]);
    win(R, 44, 72, 8, 10);
    poly(ctx, [[30, 42], [48, 20], [66, 42]], '#7a4a2a', OUT);
    // the sails (rotate one step per frame)
    const a0 = (f * Math.PI) / 8;
    for (let k = 0; k < 4; k++) {
      const a = a0 + (k * Math.PI) / 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const pt = (along, across) => [48 + c * along - s * across, 40 + s * along + c * across];
      poly(ctx, [pt(6, 0), pt(44, 0), pt(44, 9), pt(6, 9)], '#f8f4ec', OUT);
      for (let g = 10; g < 44; g += 6) {
        const [x1, y1] = pt(g, 0);
        const [x2, y2] = pt(g, 9);
        ctx.fillStyle = WOOD[1];
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2 + 1, y2 + 1);
        ctx.lineTo(x1 + 1, y1 + 1);
        ctx.fill();
      }
      const [ex, ey] = pt(46, 0);
      ctx.strokeStyle = WOOD[1];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(48, 40);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
    E(48, 40, 4, 4, OUT);
    E(48, 40, 3, 3, WOOD[3]);
  })), { group: G, label: 'Windmill (3×4)', w: 3 * T, h: 4 * T, walk: 'block' });
  // Garden shed: 2×2
  add('shed', draw(2 * T, 2 * T, ({ ctx, R, E }) => {
    E(32, 62, 28, 2, SHADOW);
    R(4, 24, 56, 38, OUT);
    R(5, 25, 54, 36, '#6a8a5a');
    for (let x = 5; x < 59; x += 6) R(x, 25, 1, 36, '#4a6a3a');
    door(R, 24, 36, 16, 25, '#5a7a4a');
    win(R, 8, 32, 10, 8);
    R(46, 40, 2, 20, '#8a8a8a'); // a rake leaning on the wall
    R(43, 38, 8, 2, '#8a8a8a');
    poly(ctx, [[0, 28], [8, 10], [56, 10], [64, 28]], OUT);
    poly(ctx, [[3, 27], [10, 12], [54, 12], [61, 27]], '#5a5a62');
    for (let y = 15; y < 27; y += 4) R(6, y, 52, 1, '#3a3a42');
  }), { group: G, label: 'Garden shed (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  // Expedition tent: 2×2 canvas tent with a flap
  add('tent', anim((f) => draw(2 * T, 2 * T, ({ ctx, E, R }) => {
    E(32, 60, 28, 3, SHADOW);
    poly(ctx, [[2, 58], [32, 10], [62, 58]], '#c8a868', OUT);
    poly(ctx, [[32, 10], [62, 58], [44, 58]], '#a8884a');
    poly(ctx, [[24, 58], [32, 30], [40, 58]], '#3a2a1a');
    poly(ctx, [[32, 30], [40 + (f % 2), 58], [46 + (f % 2), 58]], '#d8b878'); // the flap
    R(31, 4, 2, 8, WOOD[1]);
    poly(ctx, [[33, 4], [42 + (f % 2) * 2, 6], [33, 8]], '#e0403a');
    R(0, 58, 6, 2, WOOD[2]);
    R(58, 58, 6, 2, WOOD[2]);
  })), { group: G, label: 'Tent (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  // Market stall: 2×2 with a striped awning and fruit
  add('market_stall', draw(2 * T, 2 * T, ({ R, E }) => {
    E(32, 62, 28, 2, SHADOW);
    [6, 54].forEach((x) => R(x, 18, 4, 44, WOOD[1]));
    R(4, 40, 56, 14, OUT);
    R(5, 41, 54, 12, WOOD[3]);
    R(5, 41, 54, 2, WOOD[4]);
    [[12, '#d8303a'], [22, '#f2902a'], [32, '#f2c53d'], [42, '#58a854'], [52, '#8a3ab8']].forEach(([x, c]) => {
      E(x, 38, 4, 3, OUT);
      E(x, 37, 3, 2, c);
      E(x - 1, 36, 1, 1, '#ffffff');
    });
    R(2, 8, 60, 12, OUT);
    for (let x = 3; x < 61; x += 8) {
      R(x, 9, 4, 10, '#e0405a');
      R(x + 4, 9, 4, 10, '#f8f4ec');
    }
    for (let x = 3; x < 61; x += 8) E(x + 4, 20, 4, 2, x % 16 === 3 ? '#e0405a' : '#f8f4ec');
  }), { group: G, label: 'Market stall (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  add('ice_cream_cart', draw(2 * T, 2 * T, ({ R, E }) => {
    E(32, 62, 26, 2, SHADOW);
    R(31, 6, 2, 26, '#8a8a8a');
    E(32, 8, 24, 6, OUT);
    for (let i = 0; i < 6; i++) E(12 + i * 8, 8, 4, 5, i % 2 ? '#f8f4ec' : '#f08ab0');
    R(8, 30, 48, 22, OUT);
    R(9, 31, 46, 20, '#f8f4ec');
    R(9, 31, 46, 4, '#8ac8f0');
    E(24, 42, 5, 5, '#f08ab0'); // an ice cream cone sign
    R(22, 46, 5, 6, '#d8a050');
    [16, 48].forEach((x) => {
      E(x, 55, 6, 6, OUT);
      E(x, 55, 4, 4, '#5a5a62');
      E(x, 55, 1, 1, '#c8c8c8');
    });
  }), { group: G, label: 'Ice cream cart (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
}

// ---------- Garden and park things ----------
function addGardenProps(add, anim) {
  const G = 'Garden & park';
  const S = STONE.map(css);
  // Fountain: 2×2, water spraying and rippling
  add('fountain', anim((f) => draw(2 * T, 2 * T, ({ R, E }) => {
    E(32, 56, 30, 5, SHADOW);
    E(32, 48, 30, 11, OUT);
    E(32, 47, 29, 10, S[3]);
    E(32, 46, 25, 7, '#3a7ac8');
    E(32, 45, 22, 5, '#5a9ad8');
    E(32, 45, 10 + f * 3, 2 + f, `rgba(242,251,255,${0.7 - f * 0.15})`);
    R(29, 22, 6, 24, OUT);
    R(30, 22, 4, 24, S[3]);
    E(32, 22, 10, 3, OUT);
    E(32, 21, 9, 2, S[3]);
    // spray
    [-1, 1].forEach((d) => {
      for (let k = 0; k < 10; k++) {
        const t = k / 10;
        R(32 + d * (t * 14 + (f % 2)), 14 - Math.sin(t * Math.PI) * 6 + t * 26, 2, 2, k % 3 === f % 3 ? '#ffffff' : '#a6d8f6');
      }
    });
    R(31, 6 + (f % 2), 2, 10, '#a6d8f6');
    R(31, 5 + (f % 2), 2, 2, '#ffffff');
  })), { group: G, label: 'Fountain (2×2)', w: 2 * T, h: 2 * T, walk: 'block' });
  add('well', draw(T, 2 * T, ({ ctx, R, E }) => {
    E(16, 61, 14, 3, SHADOW);
    R(2, 40, 28, 21, OUT);
    R(3, 41, 26, 19, S[2]);
    for (let y = 41; y < 60; y += 5) for (let x = 3 + ((y / 5) % 2) * 3; x < 29; x += 7) R(x, y, 6, 4, S[3]);
    E(16, 41, 12, 3, OUT);
    E(16, 41, 11, 2, '#1a2a3a');
    [4, 26].forEach((x) => R(x, 14, 3, 27, WOOD[2]));
    R(4, 22, 25, 2, WOOD[1]);
    R(15, 24, 2, 10, '#c8b088');
    R(12, 33, 8, 6, OUT);
    R(13, 34, 6, 4, WOOD[3]);
    poly(ctx, [[0, 16], [16, 4], [32, 16]], '#b8503a', OUT);
  }), { group: G, label: 'Wishing well (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('bird_bath', draw(T, T, ({ R, E }) => {
    E(16, 29, 8, 2, SHADOW);
    R(13, 14, 6, 15, OUT);
    R(14, 14, 4, 14, S[3]);
    E(16, 28, 7, 2, S[2]);
    E(16, 12, 12, 4, OUT);
    E(16, 11, 11, 3, S[3]);
    E(16, 11, 8, 2, '#5a9ad8');
    R(12, 10, 3, 1, '#ffffff');
  }), { group: G, label: 'Bird bath', walk: 'block' });
  add('birdhouse', draw(T, 2 * T, ({ ctx, R, E }) => {
    E(16, 61, 6, 2, SHADOW);
    R(15, 26, 3, 35, WOOD[1]);
    R(8, 12, 17, 16, OUT);
    R(9, 13, 15, 14, '#e8c86a');
    E(16, 19, 2, 2, OUT);
    R(15, 23, 3, 1, WOOD[1]);
    poly(ctx, [[5, 14], [16, 3], [28, 14]], '#3a7ac8', OUT);
  }), { group: G, label: 'Birdhouse (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('statue_plinth', draw(T, 2 * T, ({ R, E }) => {
    E(16, 61, 12, 3, SHADOW);
    R(4, 42, 24, 19, OUT);
    R(5, 43, 22, 17, '#e8e2d4');
    R(5, 43, 22, 2, '#ffffff');
    R(3, 40, 26, 4, OUT);
    R(4, 41, 24, 2, '#f2ece0');
    // a little bronze figure, arm raised
    R(12, 14, 8, 26, OUT);
    R(13, 15, 6, 25, '#7a8a5a');
    E(16, 10, 5, 5, OUT);
    E(16, 10, 4, 4, '#8a9a6a');
    R(19, 6, 3, 12, OUT);
    R(20, 7, 1, 10, '#8a9a6a');
    R(14, 16, 2, 20, '#9aaa7a');
  }), { group: G, label: 'Statue (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('rose_arch', draw(2 * T, 2 * T, ({ ctx, R, E }) => {
    // a trellis arch covered in roses; people walk under it
    [6, 52].forEach((x) => {
      R(x - 1, 14, 8, 50, OUT);
      R(x, 14, 6, 50, '#f8f4ec');
      for (let y = 18; y < 62; y += 6) R(x, y, 6, 1, '#d8d4ca');
    });
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(32, 22, 23, Math.PI, 0);
    ctx.stroke();
    ctx.strokeStyle = '#f8f4ec';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(32, 22, 23, Math.PI, 0);
    ctx.stroke();
    for (let k = 0; k < 26; k++) {
      const a = Math.PI + (k / 25) * Math.PI;
      const x = 32 + Math.cos(a) * 23;
      const y = 22 + Math.sin(a) * 23;
      E(x, y, 3, 2, LEAF[1 + (k % 3)]);
      if (k % 3 === 0) E(x + 1, y - 1, 2, 2, '#d8304a');
    }
    for (let y = 26; y < 60; y += 7) {
      [9, 55].forEach((x, i) => {
        E(x + ((y + i) % 2) * 2, y, 3, 2, LEAF[2]);
        if (y % 14 === 5) E(x, y, 1, 1, '#d8304a');
      });
    }
  }), { group: G, label: 'Rose arch (2×2)', w: 2 * T, h: 2 * T, walk: 'over' });
  add('picnic', draw(2 * T, T, ({ R, E }) => {
    R(4, 6, 56, 22, '#d8303a');
    for (let x = 4; x < 60; x += 8) R(x, 6, 4, 22, '#f8f4ec');
    for (let y = 6; y < 28; y += 8) R(4, y, 56, 4, 'rgba(248,244,236,0.6)');
    // basket
    R(36, 8, 16, 11, OUT);
    R(37, 9, 14, 9, '#c8964a');
    for (let x = 37; x < 51; x += 3) R(x, 9, 1, 9, '#a8763a');
    R(38, 4, 12, 2, '#8a5a2a');
    E(16, 18, 4, 3, '#f8f4ec'); // plate with a sandwich
    R(14, 16, 5, 3, '#e8c86a');
    E(26, 14, 2, 2, '#d8303a'); // apple
  }), { group: G, label: 'Picnic blanket (2×1)', w: 2 * T, h: T, walk: 'walk' });
  add('signpost', draw(T, 2 * T, ({ ctx, R, E }) => {
    E(16, 61, 5, 2, SHADOW);
    R(14, 12, 4, 49, WOOD[1]);
    R(15, 12, 1, 49, WOOD[3]);
    poly(ctx, [[4, 16], [26, 16], [30, 20], [26, 24], [4, 24]], WOOD[3], OUT);
    poly(ctx, [[28, 28], [6, 28], [2, 32], [6, 36], [28, 36]], WOOD[3], OUT);
    poly(ctx, [[6, 40], [24, 40], [28, 44], [24, 48], [6, 48]], WOOD[3], OUT);
    [19, 31, 43].forEach((y) => R(9, y, 14, 1, WOOD[1]));
  }), { group: G, label: 'Signpost (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('telescope', draw(T, T, ({ R, E }) => {
    E(16, 29, 8, 2, SHADOW);
    [[10, 28, 1], [22, 28, -1], [16, 29, 0]].forEach(([x, y, d]) => {
      for (let k = 0; k < 12; k++) R(x + (16 - x) * (k / 12), y - k, 2, 1, WOOD[1]);
    });
    for (let k = 0; k < 16; k++) {
      R(8 + k, 14 - k * 0.5, 4, 4, OUT);
    }
    for (let k = 0; k < 16; k++) R(9 + k, 15 - k * 0.5, 2, 2, k > 10 ? '#c8962a' : '#e8b84a');
    E(25, 7, 2, 3, '#a6d8f6');
  }), { group: G, label: 'Telescope', walk: 'block' });
  add('wheelbarrow', draw(T, T, ({ R, E }) => {
    E(16, 28, 13, 2, SHADOW);
    R(2, 20, 12, 2, WOOD[1]);
    R(6, 12, 22, 9, OUT);
    R(7, 13, 20, 7, '#3a7ac8');
    R(7, 13, 20, 2, '#5a9ae0');
    E(9, 12, 4, 2, '#5a3a22'); // soil
    E(16, 11, 2, 2, '#58a854');
    E(24, 24, 4, 4, OUT);
    E(24, 24, 2, 2, '#5a5a62');
    R(8, 21, 2, 6, WOOD[1]);
  }), { group: G, label: 'Wheelbarrow', walk: 'block' });
  add('scarecrow', anim((f) => draw(T, 2 * T, ({ R, E }) => {
    E(16, 61, 6, 2, SHADOW);
    R(15, 20, 3, 41, WOOD[1]);
    const sway = f % 2;
    R(3, 26 + sway, 26, 3, WOOD[1]);
    R(9, 24, 14, 18, OUT);
    R(10, 25, 12, 16, '#3a6aa8');
    R(10, 25, 12, 3, '#c84a3a');
    [3, 27].forEach((x) => R(x - 1, 27 + sway, 3, 4, '#e8c86a'));
    R(12, 40, 2, 4, '#e8c86a');
    R(18, 40, 2, 4, '#e8c86a');
    E(16, 18, 6, 6, OUT);
    E(16, 18, 5, 5, '#e8d4a0');
    R(13, 17, 2, 2, OUT);
    R(18, 17, 2, 2, OUT);
    R(14, 21, 5, 1, OUT);
    R(7, 12, 18, 3, OUT); // hat
    R(8, 12, 16, 2, '#8a5a2a');
    R(11, 6, 10, 7, OUT);
    R(12, 7, 8, 5, '#8a5a2a');
  })), { group: G, label: 'Scarecrow (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('water_pump', draw(T, T, ({ R, E }) => {
    E(16, 29, 10, 2, SHADOW);
    E(16, 27, 10, 3, '#5a9ad8');
    R(12, 6, 8, 20, OUT);
    R(13, 7, 6, 18, '#3a7a5a');
    R(13, 7, 2, 18, '#5a9a7a');
    R(19, 12, 7, 3, OUT); // the spout
    R(20, 13, 6, 1, '#3a7a5a');
    R(6, 4, 9, 2, OUT); // the handle
    R(14, 2, 2, 6, OUT);
  }), { group: G, label: 'Water pump', walk: 'block' });
  add('garden_lantern', anim((f) => draw(T, 2 * T, ({ ctx, R, E }) => {
    E(16, 61, 9, 2, SHADOW);
    R(13, 36, 6, 25, OUT);
    R(14, 36, 4, 24, S[2]);
    R(8, 56, 16, 5, OUT);
    R(9, 57, 14, 3, S[2]);
    R(7, 20, 18, 16, OUT);
    R(8, 21, 16, 14, S[3]);
    R(11, 24, 10, 8, f % 2 ? '#f2c86a' : '#f8d880');
    poly(ctx, [[3, 22], [16, 10], [29, 22]], S[2], OUT);
    E(16, 9, 2, 2, S[2]);
  })), { group: G, label: 'Stone lantern (1×2)', w: T, h: 2 * T, walk: 'block' });
  add('bunting', anim((f) => draw(2 * T, T, ({ ctx, R }) => {
    const cols = ['#e0405a', '#f2c53d', '#3a8ac8', '#58a854', '#f08ab0'];
    const sag = (x) => 6 + Math.sin((x / 64) * Math.PI) * 8;
    for (let x = 0; x < 64; x++) R(x, sag(x), 1, 1, '#4a3a2a');
    for (let i = 0; i < 8; i++) {
      const x = 2 + i * 8;
      const y = sag(x + 3);
      const sw = (i + f) % 2;
      poly(ctx, [[x, y], [x + 6, y], [x + 3 + sw, y + 8]], cols[i % cols.length]);
    }
  })), { group: G, label: 'Bunting (2×1)', w: 2 * T, h: T, walk: 'over' });
  add('flag_pole', anim((f) => draw(T, 3 * T, ({ ctx, R, E }) => {
    E(16, 93, 6, 2, SHADOW);
    R(14, 4, 3, 89, '#c8c8cc');
    R(14, 4, 1, 89, '#ffffff');
    E(15, 3, 2, 2, '#f2c53d');
    // a wavy pennant
    const pts = [];
    for (let k = 0; k <= 12; k++) pts.push([17 + k, 8 + Math.sin(k / 2 + f * 1.5) * 1.5 + k * 0.1]);
    const top = pts;
    const bot = pts.map(([x, y], k) => [x, y + 10 - k * 0.3]).reverse();
    poly(ctx, [...top, ...bot], '#3a78c8', OUT);
    R(19, 11 + Math.sin(f * 1.5) * 1.5, 6, 2, '#f8f4ec');
  })), { group: G, label: 'Flag pole (1×3)', w: T, h: 3 * T, walk: 'block' });
}

// ---------- Seasons ----------
// Seasonal looks are made from the normal tiles: leaves recolored, blossom
// sprinkled on, bare branches in winter, and snow settled on top of
// everything else. seasonFrames() returns new frames, or null for no change.
const DECIDUOUS = ['tree', 'apple_tree', 'oak_tree', 'birch_tree', 'willow_tree', 'cherry_tree', 'maple_tree', 'sapling'];
const NO_SNOW = ['campfire', 'fountain', 'torch', 'bubbles', 'tide_pool', 'water_rock'];
const SHRUBS = ['bush', 'hedge_round', 'roses', 'hydrangea'];
const AUTUMN = ['#5a1e12', '#8a2a1a', '#c84a2a', '#e8702a', '#f2a03a', '#f8d06a'];
const SUMMER = ['#163a22', '#22603a', '#2e7842', '#3c9048', '#58a854', '#7ac466'];
const lum = (r, g, b) => (0.3 * r + 0.55 * g + 0.15 * b) / 255;
const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function copy(src) {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

// Repaint the leaf pixels (picked by `isLeaf`) from a palette, keeping how
// light or dark each pixel was. Small patches vary so the color isn't flat.
function recolor(src, isLeaf, pal, seed, gain = 1.6) {
  const c = copy(src);
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const P = pal.map(rgb);
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      if (d[i + 3] < 200 || !isLeaf(d[i], d[i + 1], d[i + 2])) continue;
      const v = lum(d[i], d[i + 1], d[i + 2]) * gain + (hash(x >> 2, y >> 2, seed) - 0.5) * 0.35;
      const col = P[Math.max(0, Math.min(P.length - 1, Math.floor(v * P.length)))];
      d.set(col, i);
    }
  ctx.putImageData(img, 0, 0);
  return c;
}
const green = (r, g, b) => g > r + 8 && g > b + 8;

// Blossom: little pink and white flowers on the leaves.
function blossom(src, seed) {
  const c = copy(src);
  const ctx = c.getContext('2d');
  const d = ctx.getImageData(0, 0, c.width, c.height).data;
  for (let y = 2; y < c.height - 2; y += 3)
    for (let x = 2; x < c.width - 2; x += 3) {
      const i = (y * c.width + x) * 4;
      if (d[i + 3] < 200 || !green(d[i], d[i + 1], d[i + 2]) || hash(x, y, seed) < 0.82) continue;
      ctx.fillStyle = hash(x, y, seed + 1) < 0.5 ? '#f8c8dc' : '#ffffff';
      ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = '#f4a8c8';
      ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  return c;
}

// Snow settled on every top edge: each solid pixel with open air above it
// gets a white cap a few pixels deep (thinner on steep sides).
export function snowify(src) {
  const c = copy(src);
  const ctx = c.getContext('2d');
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < c.width && y < c.height && d[(y * c.width + x) * 4 + 3] > 200;
  const tops = [];
  for (let x = 0; x < c.width; x++)
    for (let y = 1; y < c.height; y++) if (solid(x, y) && !solid(x, y - 1) && solid(x, y + 1)) tops.push([x, y]);
  const SN = [rgb('#ffffff'), rgb('#ffffff'), rgb('#f2f8fc'), rgb('#dce8f2'), rgb('#c4d4e4')];
  tops.forEach(([x, y]) => {
    // only on fairly flat tops: the pixels either side are also tops nearby
    const flat = solid(x - 1, y) || solid(x + 1, y);
    if (!flat || y > c.height - 6) return;
    const depth = 3 + Math.round(hash(x >> 1, y, 77) * 2);
    for (let k = 0; k < depth; k++) if (solid(x, y + k)) d.set(SN[Math.min(SN.length - 1, k + 5 - depth)], ((y + k) * c.width + x) * 4);
  });
  ctx.putImageData(img, 0, 0);
  return c;
}

// A leafless tree the size of the tile, with snow along its branches.
function bareTree(w, h, seed, birch) {
  return draw(w, h, ({ R, E }) => {
    E(w / 2, h - 3, w * 0.3, 3, SHADOW);
    const bark = birch ? '#f2f0e8' : '#6a5242';
    const bark2 = birch ? '#d8d4cc' : '#8a7262';
    const tw = Math.max(5, Math.round(w / 9));
    const top = Math.round(h * 0.42);
    R(w / 2 - tw / 2 - 1, top, tw + 2, h - 3 - top, OUT);
    R(w / 2 - tw / 2, top, tw, h - 3 - top, bark);
    R(w / 2 - tw / 2, top, 2, h - 3 - top, bark2);
    if (birch) for (let y = top + 4; y < h - 4; y += 7) R(w / 2 - tw / 2 + ((y / 7) % 2) * 2, y, 3, 1, '#3a3a3a');
    const segs = [];
    const grow = (x, y, a, len, width, depth) => {
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      segs.push([x, y, x2, y2, width]);
      if (depth <= 0) return;
      const n = depth > 1 ? 2 : 3;
      for (let k = 0; k < n; k++) {
        const da = (k / (n - 1) - 0.5) * 1.3 + (hash(depth, k + x, seed) - 0.5) * 0.4;
        grow(x2, y2, a + da, len * (0.62 + hash(k, depth, seed) * 0.15), Math.max(1, width - 1), depth - 1);
      }
    };
    const spread = Math.min(w, h * 0.9) * 0.26;
    [-0.9, -0.3, 0.3, 0.9].forEach((o, i) => grow(w / 2, top + 6 + i * 3, -Math.PI / 2 + o * 0.9, spread, 3, w > 40 ? 3 : 2));
    const line = (x1, y1, x2, y2, wd, col) => {
      const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
      for (let i = 0; i <= n; i++) R(x1 + ((x2 - x1) * i) / n - wd / 2, y1 + ((y2 - y1) * i) / n - wd / 2, wd, wd, col);
    };
    segs.forEach(([x1, y1, x2, y2, wd]) => line(x1, y1, x2, y2, wd + 2, OUT));
    segs.forEach(([x1, y1, x2, y2, wd]) => line(x1, y1, x2, y2, wd, bark));
    // snow along the flatter branches
    segs.forEach(([x1, y1, x2, y2, wd]) => {
      if (Math.abs(y2 - y1) > Math.abs(x2 - x1) * 1.2) return;
      line(x1, y1 - wd / 2 - 1, x2, y2 - wd / 2 - 1, 1.5, '#ffffff');
    });
  });
}

export function seasonFrames(name, tile, season) {
  const f = tile.frames;
  if (season === 'winter') {
    if (name === 'pine') return null; // the snowy pine is its own tile; see seasonTile
    if (DECIDUOUS.includes(name)) return [bareTree(tile.w, tile.h, name.length * 13, name === 'birch_tree')];
    if (NO_SNOW.includes(name)) return null;
    return f.map(snowify);
  }
  if (season === 'autumn') {
    if (DECIDUOUS.includes(name) && name !== 'maple_tree' && name !== 'cherry_tree') return f.map((c, i) => recolor(c, green, AUTUMN, 900 + i)); // (cherry trees stay pink)
    if (SHRUBS.includes(name)) return f.map((c) => recolor(c, green, AUTUMN.slice(1), 901));
    return null;
  }
  if (season === 'spring') {
    if (DECIDUOUS.includes(name) && name !== 'cherry_tree') return f.map((c) => blossom(c, 903));
    if (name === 'bush' || name === 'hedge_round') return f.map((c) => blossom(c, 904));
    return null;
  }
  return null;
}

// Some tiles have a whole other tile for a season.
const SEASON_TILES = {
  winter: { pine: 'pine_snow' },
  spring: { maple_tree: 'tree' },
  summer: { maple_tree: 'tree', cherry_tree: 'tree' },
};
export const seasonTile = (name, season) => SEASON_TILES[season]?.[name] || null;

// Where tiles give off light at night, from the tile's bottom-left corner:
// [x, y, radius, color, strength, extra] (extra as for IslandScene.light).
export const TILE_LIGHTS = {
  cottage: [[25, -32, 34, 0xffd89a, 0.9, { glow: 22 }], [71, -32, 34, 0xffd89a, 0.9, { glow: 22 }]],
  lighthouse: [[32, -109, 56, 0xfff4c0, 1, { glow: 44, beam: true }]],
  tiki_hut: [[7, -29, 28, 0xffa850, 0.9, { glow: 20, flicker: true }], [89, -29, 28, 0xffa850, 0.9, { glow: 20, flicker: true }]],
  greenhouse: [[48, -26, 52, 0xe0ffd0, 0.6, {}]],
  garden_lantern: [[16, -36, 30, 0xffd080, 0.9, { glow: 18, flicker: true }]],
  windmill: [[48, -51, 22, 0xffd89a, 0.7, { glow: 14 }]],
  torch: [[16, -22, 30, 0xffa850, 0.9, { glow: 18, flicker: true }]],
  ice_cream_cart: [[32, -20, 26, 0xffe8f0, 0.5, {}]],
  market_stall: [[32, -30, 30, 0xffe0b0, 0.5, {}]],
};
