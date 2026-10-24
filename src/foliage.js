// Natural-looking trees and shrubs, drawn pixel by pixel: a crown made of
// many overlapping leaf clumps with ragged edges, shaded from the top left,
// with leaf texture, gaps where branches show through, and a tapering trunk
// with bark and roots. Conifers are tiers of drooping boughs.
import { hash, fbm } from './tiles.js';

const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const BAYER = [0, 0.5, 0.75, 0.25];
const dither = (x, y) => BAYER[(x & 1) + (y & 1) * 2] - 0.375;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// Pixel buffer helpers.
function buffer(w, h) {
  const img = new ImageData(w, h);
  const set = (x, y, col) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    img.data.set(col, (y * w + x) * 4);
  };
  const get = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img.data[(y * w + x) * 4 + 3]);
  return { img, set, get };
}

function softShadow(ctx, cx, cy, rx, ry) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, 'rgba(0,0,0,0.32)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.18)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const BARK = ['#2a1a10', '#4a3222', '#6a4a32', '#86613f', '#a07a52'].map(rgb);
const BIRCH = ['#3a3630', '#a8a49c', '#d8d4cc', '#eeebe4', '#ffffff'].map(rgb);

// A trunk that narrows toward the top, flares into roots, with bark streaks.
function trunk(B, cx, top, bottom, width, seed, bark = BARK, birch = false) {
  for (let y = top; y <= bottom; y++) {
    const t = (y - top) / (bottom - top);
    const flare = t > 0.8 ? (t - 0.8) * 5 : 0;
    const half = width / 2 * (0.75 + 0.25 * t) + flare * flare * width * 0.6;
    const lean = Math.sin(t * 2.2 + seed) * 1.2;
    for (let x = Math.floor(cx - half + lean); x <= Math.ceil(cx + half + lean); x++) {
      const u = (x - (cx - half + lean)) / (2 * half); // 0 left .. 1 right
      let i = u < 0.22 ? 4 : u < 0.5 ? 3 : u < 0.8 ? 2 : 1;
      if (birch) {
        i = u < 0.3 ? 4 : u < 0.75 ? 3 : 2;
        if (hash(Math.floor(x / 2), Math.floor(y / 3), seed) > 0.86) i = 0; // dark birch marks
      } else if (hash(x, Math.floor(y / 3), seed) > 0.78) i = Math.max(1, i - 1); // bark streaks
      const edge = x === Math.floor(cx - half + lean) || x === Math.ceil(cx + half + lean);
      B.set(x, y, edge ? bark[0] : bark[i]);
    }
  }
}

// A tapering branch line.
function branch(B, x1, y1, x2, y2, w1, w2, bark = BARK) {
  const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    const w = w1 + (w2 - w1) * t;
    for (let k = -w / 2; k <= w / 2; k += 1) {
      const lit = k < 0 ? 3 : 2;
      B.set(x + k, y, Math.abs(k) >= w / 2 - 0.5 ? bark[1] : bark[lit]);
    }
  }
}

// cfg: { pal: [5 colors dark→light], crown: {cx, cy, rx, ry}, clumps, seed,
//        trunk: {x, top, bottom, w} | null, birch, sway (px at the top),
//        dots: [{color, chance}] (fruit, blossom), flat (bottom flattened),
//        droop (0..1, the bottom edge hangs) }
export function leafy(w, h, frame, cfg) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const B = buffer(w, h);
  const P = cfg.pal.map(rgb);
  const { cx, cy, rx, ry } = cfg.crown;
  const seed = cfg.seed || 1;
  const sway = (cfg.sway ?? 1) * [0, 1, 0, -1][frame % 4];
  if (cfg.shadow !== false) softShadow(ctx, w / 2, h - 3, Math.min(w * 0.42, rx * 0.95), 4);
  const bark = cfg.birch ? BIRCH : BARK;

  // Clumps: a big core plus rings of smaller ones round the edge.
  const clumps = [];
  const n = cfg.clumps || 14;
  for (let i = 0; i < n; i++) {
    // the core clumps sit near the middle; the rest go evenly round the
    // edge (with a little jitter) so the crown is full but not lopsided
    const a = i < 3 ? (i / 3) * Math.PI * 2 + hash(i, 1, seed) : ((i - 3) / (n - 3)) * Math.PI * 2 + (hash(i, 1, seed) - 0.5) * 0.6;
    const ring = i < 3 ? 0.25 : 0.6 + hash(i, 2, seed) * 0.25;
    const r = Math.min(rx, ry) * (i < 3 ? 0.62 : 0.34 + hash(i, 3, seed) * 0.14);
    let px = cx + Math.cos(a) * rx * ring;
    let py = cy + Math.sin(a) * ry * ring;
    if (cfg.flat && py > cy + ry * 0.4) py = cy + ry * 0.4;
    // keep every clump (and its ragged edge) inside the tile
    px = Math.max(r * 1.15 + 1, Math.min(w - r * 1.15 - 2, px));
    py = Math.max(r * 1.15 + 1, py);
    const height = 1 - (py - (cy - ry)) / (2 * ry); // 1 at the top
    clumps.push({ x: px + sway * height, y: py, r });
  }
  clumps.sort((a, b) => a.y - b.y); // back to front

  // Branches up into the crown (seen through the gaps).
  if (cfg.trunk) {
    const t = cfg.trunk;
    trunk(B, t.x, t.top, t.bottom, t.w, seed, bark, cfg.birch);
    clumps.forEach((k, i) => {
      if (i % 2) return;
      branch(B, t.x + (k.x - t.x) * 0.1, t.top + 4, k.x, k.y + k.r * 0.2, Math.max(2, t.w * 0.45), 1, bark);
    });
  }

  // Which clump owns each pixel (the front-most one that covers it).
  const x0 = Math.max(0, Math.floor(cx - rx * 1.25 - 3));
  const x1 = Math.min(w - 1, Math.ceil(cx + rx * 1.25 + 3));
  const y0 = Math.max(0, Math.floor(cy - ry * 1.3 - 3));
  const y1 = Math.min(h - 1, Math.ceil(cy + ry * 1.3 + 3));
  const W = x1 - x0 + 1;
  const owner = new Int16Array(W * (y1 - y0 + 1)).fill(-1);
  const shade = new Float32Array(W * (y1 - y0 + 1));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      for (let i = clumps.length - 1; i >= 0; i--) {
        const k = clumps[i];
        const dx = x - k.x;
        const dy = (y - k.y) * (cfg.droop && y > k.y ? 1 - cfg.droop * 0.5 : 1);
        // ragged edge: leaf-sized bumps
        const d = Math.hypot(dx, dy) / k.r + (fbm(x * 2.2, y * 2.2, seed + i) - 0.5) * 0.55;
        if (d < 1) {
          owner[(y - y0) * W + (x - x0)] = i;
          // light from the top left, darker underneath and toward the back
          const nx = dx / k.r;
          const ny = dy / k.r;
          shade[(y - y0) * W + (x - x0)] = 0.55 - nx * 0.28 - ny * 0.36 + (i / clumps.length - 0.5) * 0.25 - d * 0.12;
          break;
        }
      }
    }

  // Paint the leaves.
  const own = (x, y) => (x < x0 || x > x1 || y < y0 || y > y1 ? -1 : owner[(y - y0) * W + (x - x0)]);
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const o = own(x, y);
      if (o < 0) continue;
      let v = shade[(y - y0) * W + (x - x0)];
      // leaf texture: little clusters of light and dark
      v += (fbm(x * 3, y * 3, seed + 50) - 0.5) * 0.4 + dither(x, y) * 0.1;
      // a clump in front casts a shadow on the one behind, just above it
      const below = own(x, y + 2);
      if (below > o) v -= 0.3;
      const edge = own(x - 1, y) < 0 || own(x + 1, y) < 0 || own(x, y - 1) < 0 || own(x, y + 1) < 0;
      let idx = Math.max(0, Math.min(4, Math.floor(v * 5)));
      if (edge) idx = own(x, y - 1) < 0 && v > 0.5 ? Math.min(4, idx) : 0;
      // a few holes inside the crown where the branches show
      if (!edge && fbm(x * 1.4, y * 1.4, seed + 90) < 0.2 && v < 0.45) continue;
      B.set(x, y, P[idx]);
    }

  // Fruit, blossom and the like on the lit side.
  (cfg.dots || []).forEach(({ color, chance, size = 2 }, j) => {
    const col = rgb(color);
    for (let y = y0; y <= y1; y += 2)
      for (let x = x0; x <= x1; x += 2) {
        if (own(x, y) < 0 || own(x + 1, y + 1) < 0 || hash(x, y, seed + 70 + j) > chance) continue;
        for (let k = 0; k < size * size; k++) B.set(x + (k % size), y + Math.floor(k / size), col);
      }
  });

  const tmp = canvas(w, h);
  tmp.getContext('2d').putImageData(B.img, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  return c;
}

// A conifer: tiers of drooping boughs, each with a ragged lower edge, lit
// from the left; a snowy version has snow along the top of each tier.
export function conifer(w, h, frame, { pal, seed = 3, tiers = 5, snow = false, trunkH = 8 }) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const B = buffer(w, h);
  const P = pal.map(rgb);
  const SN = ['#c4d4e4', '#e4eef6', '#ffffff'].map(rgb);
  softShadow(ctx, w / 2, h - 3, w * 0.4, 3);
  const cx = w / 2;
  const top = 2;
  const bottom = h - 3 - trunkH;
  trunk(B, cx, bottom - 6, h - 3, Math.max(4, w * 0.16), seed);
  const sway = [0, 1, 0, -1][frame % 4] * 0.6;
  for (let t = 0; t < tiers; t++) {
    const ty0 = top + ((bottom - top) * t) / tiers - (t ? 3 : 0);
    const ty1 = top + ((bottom - top) * (t + 1)) / tiers + 2;
    const half = (w / 2 - 2) * (0.35 + (0.65 * (t + 1)) / tiers);
    const off = sway * (1 - t / tiers);
    for (let y = Math.floor(ty0); y <= ty1; y++) {
      const k = (y - ty0) / (ty1 - ty0);
      for (let x = 0; x < w; x++) {
        const u = (x - cx - off) / half; // -1..1 across
        // a cone that hangs lower at the tips, with a ragged hem
        const hem = 1 - Math.abs(u) * 0.25 + (hash(Math.floor(x / 2), t, seed) - 0.5) * 0.18;
        if (Math.abs(u) > k * 1.05 + 0.08 || k > hem) continue;
        let v = 0.6 - u * 0.3 - k * 0.35 + (fbm(x * 3, y * 3, seed + t) - 0.5) * 0.4 + dither(x, y) * 0.1;
        const edge = Math.abs(u) > k * 1.05 - 0.05 || k > hem - 0.06;
        let idx = Math.max(0, Math.min(4, Math.floor(v * 5)));
        if (edge) idx = Math.min(idx, 1);
        if (snow && k < 0.32 + (hash(x, t, seed + 9) - 0.5) * 0.15) {
          B.set(x, y, SN[Math.max(0, Math.min(2, Math.floor((1 - u * 0.5) * 1.6)))]);
          continue;
        }
        B.set(x, y, P[idx]);
      }
    }
  }
  const tmp = canvas(w, h);
  tmp.getContext('2d').putImageData(B.img, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  return c;
}

// A coconut palm: a curved, ringed trunk and arching fronds made of many
// drooping leaflets, darker near the crown and lighter at the tips.
export function palm(w, h, frame, { seed = 5, lean = 1 } = {}) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  const B = buffer(w, h);
  softShadow(ctx, w / 2 + 2, h - 3, w * 0.32, 3);
  const L = ['#1a4a2a', '#24663a', '#2f8044', '#4a9e4e', '#78c060'].map(rgb);
  const TR = ['#3a2614', '#6a4a2e', '#8a6844', '#a8865c', '#c4a47a'].map(rgb);
  const base = { x: w / 2 - lean * w * 0.1, y: h - 4 };
  const topY = h * 0.3;
  // trunk: a gentle S-curve, segment rings, lit on the left
  const at = (t) => ({ x: base.x + lean * Math.sin(t * 1.8) * w * 0.12, y: base.y - (base.y - topY) * t });
  for (let i = 0; i <= 120; i++) {
    const t = i / 120;
    const p = at(t);
    const half = 4.5 - t * 1.5;
    const ring = Math.floor(t * 18) !== Math.floor((t + 1 / 120) * 18);
    for (let x = -half; x <= half; x++) {
      const u = (x + half) / (2 * half);
      let idx = u < 0.25 ? 4 : u < 0.55 ? 3 : u < 0.85 ? 2 : 1;
      if (ring) idx = Math.max(0, idx - 2);
      B.set(p.x + x, p.y, Math.abs(x) >= half - 0.5 ? TR[0] : TR[idx]);
    }
  }
  const top = at(1);
  const sway = [0, 1, 0, -1][frame % 4];
  // fronds: back ones first (darker), then the front ones
  const fronds = [
    [-2.95, 26, 1, 0], [-0.2, 26, 1, 0], [-2.45, 22, 0.7, 0], [-0.7, 22, 0.7, 0], [-1.85, 18, 0.3, 0], [-1.3, 18, 0.3, 0],
    [2.75, 20, 1.1, 1], [0.4, 20, 1.1, 1], [-3.25, 23, 1.2, 1], [0.1, 23, 1.2, 1],
  ];
  fronds.forEach(([a, len, droop, front], fi) => {
    const pts = [];
    for (let i = 0; i <= len; i++) {
      const t = i / len;
      pts.push({ x: top.x + Math.cos(a) * i + sway * t * t * 2, y: top.y + Math.sin(a) * i * 0.55 + droop * t * t * 20, t });
    }
    pts.forEach((p, i) => {
      // the rib
      B.set(p.x, p.y, L[front ? 2 : 1]);
      if (i < 2) return;
      // leaflets hang down from both sides, longer in the middle of the frond
      const ll = Math.round(1 + Math.sin(p.t * Math.PI) * 5) - (i % 2);
      const dirx = Math.cos(a) > 0 ? 1 : -1;
      [-1, 1].forEach((side) => {
        for (let k = 1; k <= ll; k++) {
          const lx = p.x + side * k * 0.7 + dirx * k * 0.35;
          const ly = p.y + k * 0.75 + (side > 0 ? 0.5 : 0);
          const shade = (front ? 2 : 1) + (p.t > 0.6 ? 1 : 0) + (side < 0 ? 1 : 0) - (k > ll - 1 ? 1 : 0);
          B.set(lx, ly, L[Math.max(0, Math.min(4, shade + (fi % 2)))]);
        }
      });
    });
  });
  // coconuts tucked under the crown
  [[-3, 3], [2, 4], [-0.5, 6]].forEach(([dx, dy]) => {
    for (let k = 0; k < 9; k++) B.set(top.x + dx + (k % 3) - 1, top.y + dy + Math.floor(k / 3) - 1, k === 0 ? rgb('#8a6a3a') : rgb('#4a3018'));
  });
  const tmp = canvas(w, h);
  tmp.getContext('2d').putImageData(B.img, 0, 0);
  ctx.drawImage(tmp, 0, 0);
  return c;
}

// A weeping willow: a broad crown with long strands of leaves hanging down
// almost to the ground, swaying.
export function willow(w, h, frame, { seed = 6, pal } = {}) {
  const c = leafy(w, h, frame, { pal, seed, crown: { cx: w / 2, cy: h * 0.3, rx: w * 0.42, ry: h * 0.22 }, clumps: 18, trunk: { x: w / 2, top: h * 0.4, bottom: h - 3, w: 11 }, droop: 0.6 });
  const ctx = c.getContext('2d');
  const P = pal;
  const sway = [0, 1, 0, -1][frame % 4];
  for (let i = 0; i < 34; i++) {
    const x = w * 0.1 + (i / 33) * w * 0.8 + (hash(i, 1, seed) - 0.5) * 3;
    const start = h * 0.3 + Math.sin((i / 33) * Math.PI) * -h * 0.06 + h * 0.12;
    const len = h * (0.28 + hash(i, 2, seed) * 0.28) * (0.6 + Math.sin((i / 33) * Math.PI) * 0.4);
    for (let k = 0; k < len; k++) {
      const t = k / len;
      const xx = Math.round(x + t * t * sway * 2.5);
      const v = 0.2 + (1 - t) * 0.1 + hash(i, k >> 1, seed) * 0.6;
      ctx.fillStyle = P[Math.max(0, Math.min(4, Math.floor(v * 5) - (i % 3 === 0 ? 1 : 0)))];
      ctx.fillRect(xx, Math.round(start + k), 1, 1);
      if (k % 3 === 1) ctx.fillRect(xx + (i % 2 ? 1 : -1), Math.round(start + k), 1, 1); // little leaves
    }
  }
  return c;
}
