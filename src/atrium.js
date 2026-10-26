// Sprites for the atrium (from the sketch): the waterfall fountain in the
// middle of the floor and the two staircases up to the (still closed) upper
// floor. Drawn pixel by pixel like the rest of the museum.

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const hash = (x, y, s = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
const EDGE = hex('#1d1714');
const WHITE = [255, 255, 255];
const MARBLE = hex('#e8e2d6');

function bake(scene, key, w, h, fn) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const t = scene.textures.createCanvas(key, w, h);
  const ctx = t.getContext();
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = fn(x, y);
      if (c) img.data.set([...c.slice(0, 3), c[3] ?? 255], (y * w + x) * 4);
    }
  ctx.putImageData(img, 0, 0);
  t.refresh();
  return t;
}

// The fountain: a round marble basin with a pile of rocks in the middle and
// water tumbling down their face. Four frames (`${key}_0..3`) for the water.
export const FOUNTAIN = { w: 160, h: 120, rx: 70, ry: 30, cx: 80, cy: 88 };
export function bakeFountain(scene, key) {
  const { w, h, rx, ry, cx, cy } = FOUNTAIN;
  const WATER = ['#2e6aa8', '#3c80c0', '#5a9ad4', '#84bce6', '#c4e4f6'].map(hex);
  const ROCK = ['#4a4448', '#625a5e', '#7c7478', '#988f90', '#b4acaa'].map(hex);
  for (let f = 0; f < 4; f++) {
    bake(scene, `${key}_${f}`, w, h, (x, y) => {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const d = Math.hypot(dx, dy);
      // the basin's outer wall, seen from slightly above: a band below the rim
      const below = y > cy && Math.hypot(dx, (y - 8 - cy) / ry) < 1.08 && d >= 1.0;
      if (below) {
        const k = 0.72 + 0.18 * (1 - Math.abs(dx));
        return Math.hypot(dx, (y - 8 - cy) / ry) > 1.04 ? EDGE : shade(MARBLE, k);
      }
      if (d > 1.08) {
        // a soft shadow on the floor round the basin
        const s = Math.hypot(dx, (y - 12 - cy) / ry);
        return s < 1.18 && y > cy ? [0, 0, 0, 60] : null;
      }
      if (d > 1.04) return EDGE;
      if (d > 0.88) {
        // the rim, lit from the top left
        const lit = -dx * 0.4 - dy * 0.6;
        return d > 0.9 && d < 0.93 ? mix(MARBLE, WHITE, 0.4) : shade(MARBLE, 0.86 + lit * 0.12);
      }
      if (d > 0.85) return shade(hex('#2a4a6a'), 1);
      // the rocks in the middle, rising in a craggy heap
      const rockTop = cy - 50 + Math.abs(x - cx) * 1.6 + (hash(x >> 2, 0, 9) - 0.5) * 8;
      const inRocks = Math.abs(x - cx) < 26 && y > rockTop && y < cy + 10 - Math.abs(x - cx) * 0.25;
      if (inRocks) {
        // the waterfall: two streams down the front of the rocks
        const stream = Math.abs(x - cx + 6) < 4 || Math.abs(x - cx - 9) < 3;
        if (stream && y > rockTop + 6) {
          const flow = (y + f * 4 + (x % 3) * 2) % 8;
          return flow < 2 ? WHITE : flow < 5 ? WATER[4] : WATER[3];
        }
        const facet = hash(x >> 2, y >> 2, 3);
        const lit = x < cx ? 1 : 0;
        const i = Math.max(0, Math.min(4, Math.floor(facet * 3) + lit + (y < rockTop + 3 ? 1 : 0)));
        if (y < rockTop + 1.5) return EDGE;
        return hash(x, y, 4) > 0.92 ? hex('#5a8a4a') : ROCK[i]; // a little moss
      }
      // the water: rings spreading from where the falls land
      const r = Math.hypot((x - cx) / rx, (y - (cy + 6)) / ry);
      const ring = (r * 26 - f * 1.5) % 6;
      let c = r < 0.3 ? WATER[3] : ring < 0.8 ? WATER[3] : WATER[1 + ((x + y) % 7 === 0 ? 1 : 0)];
      if (r < 0.28 && hash(x, y, f) > 0.55) c = WHITE; // foam at the foot of the falls
      if (hash(x, y >> 1, 11 + f) > 0.985) c = WATER[4]; // glints
      return c;
    });
  }
}

// A staircase up to the upper floor, running sideways along the front wall:
// the bottom step is at the inner end (facing the middle of the room) and it
// climbs toward the side wall (`up`: 'left' or 'right'), ending in a landing.
// We see the treads from above and the marble side of the flight from the
// front, with a balustrade along both edges. A velvet rope closes the bottom
// step while the upper floor is shut. The sprite is `run` wide and
// depth + rise tall; its bottom edge is the flight's front edge on the floor.
export function bakeSideStairs(scene, key, run, depth, rise, up, decor = {}) {
  const wood = hex(decor.wainscot || '#6e4430');
  const tread = mix(hex('#a0703f'), wood, 0.35);
  const H = depth + rise;
  const STEP = 14;
  const landing = 32;
  const n = Math.floor((run - landing) / STEP);
  // how high the flight is at column x (0 at the floor, rise at the landing)
  const from = (x) => (up === 'left' ? run - 1 - x : x); // distance from the bottom end
  const elev = (x) => Math.min(n, Math.floor(from(x) / STEP) + 1) * (rise / n);
  const brass = hex('#f2d36b');
  bake(scene, key, run, H, (x, y) => {
    const e = Math.round(elev(x));
    const topY = H - depth - e; // back edge of the treads
    const frontY = H - e; // front edge of the treads
    const d = from(x);
    // the velvet rope across the bottom step, on two brass posts
    if (d >= 3 && d <= 5) {
      if ((y >= H - 16 && y < H - 2) || (y >= topY - 4 && y < topY + 10)) return d === 4 ? brass : shade(brass, 0.7);
    }
    if (d >= 4 && d <= 7 && y > topY + 8 && y < H - 14) {
      const sag = 4 + Math.round(Math.sin(((y - topY) / depth) * Math.PI) * 3);
      if (d === sag || d === sag + 1) return d === sag ? hex('#c8304a') : hex('#8a1a2a');
    }
    // balustrades along the back and front edges
    const rail = (edge) => y >= edge - 10 && y < edge;
    if (rail(topY) || rail(frontY)) {
      const edge = rail(topY) ? topY : frontY;
      if (y === edge - 10) return EDGE;
      if (y === edge - 9) return mix(MARBLE, WHITE, 0.4); // handrail
      if (x % 5 === 0) return shade(MARBLE, 0.95); // balusters
      if (rail(topY)) return null; // you see through to the wall behind
    }
    if (y >= topY && y < frontY) {
      // the treads, seen from above; the landing at the top end
      if (d >= run - landing) {
        const k = (d - (run - landing)) / landing; // into the stairwell
        return mix(shade(tread, 0.75), hex('#1a120e'), k * k);
      }
      const ly = d % STEP;
      let c = ly < 3 ? shade(tread, 0.6) : ly < 6 ? mix(tread, WHITE, 0.15) : shade(tread, 0.85);
      c = shade(c, 1 - (d / run) * 0.25);
      if (y < topY + 3 || y >= frontY - 3) c = shade(c, 0.8);
      return hash(x, y, 70) > 0.94 ? shade(c, 0.9) : c;
    }
    if (y >= frontY) {
      // the marble side of the flight, its steps outlined
      if (y === frontY) return EDGE;
      const lit = 0.82 + ((y - frontY) / Math.max(1, e)) * 0.08;
      return d % STEP === 0 && d < run - landing ? shade(MARBLE, 0.7) : shade(MARBLE, lit);
    }
    return null;
  });
}
