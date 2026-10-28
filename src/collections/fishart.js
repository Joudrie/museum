// Draws a fish, side-on and facing right, on a 26×16 grid. This is the
// 'fish' renderer: an entry's image says { kind: 'procedural', renderer: 'fish',
// shape, colors: [back, belly, fins], stripes, bars, band, spots, shine }.
const OUT = '#1d1714';
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function mix(a, b, t) {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

export function fishPixels(image, W, H) {
  const f = { ...image, c: image.colors };
  const [back, belly, fin] = f.c;
  const grid = Array.from({ length: H }, () => Array(W).fill(null));
  const cy = H / 2;
  // body: an ellipse-ish shape per kind
  const shapes = {
    slim: { x0: 5, x1: 21, h: 2.6 },
    fish: { x0: 4, x1: 21, h: 3.6 },
    deep: { x0: 5, x1: 20, h: 5 },
    cat: { x0: 3, x1: 22, h: 3.2 },
    round: { x0: 5, x1: 19, h: 6 },
    sword: { x0: 6, x1: 19, h: 3.2 },
    squid: { x0: 3, x1: 16, h: 3 },
    octo: { x0: 9, x1: 19, h: 4.5 },
  };
  const S = shapes[f.shape] || shapes.fish;
  const inBody = (x, y) => {
    const t = (x - S.x0) / (S.x1 - S.x0);
    if (t < 0 || t > 1) return false;
    const half = S.h * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2))) * (f.shape === 'squid' ? 0.5 + t * 0.6 : 1);
    return Math.abs(y + 0.5 - cy) <= half;
  };
  const set = (x, y, c) => x >= 0 && y >= 0 && x < W && y < H && (grid[y][x] = c);
  if (f.shape === 'octo') {
    // head and eight curling arms
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot((x - 14) / 5, (y - 5) / 4.5) < 1) set(x, y, y > 6 ? belly : back);
    for (let a = 0; a < 6; a++) for (let i = 0; i < 6; i++) set(8 + a * 2 + Math.round(Math.sin(i * 0.9 + a) * 1), 9 + i, i % 2 ? fin : back);
  } else {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inBody(x, y)) set(x, y, y + 0.5 > cy + 0.5 ? belly : back);
    // tail
    if (f.shape === 'squid') {
      for (let i = 0; i < 5; i++) for (let k = 0; k < 4; k++) set(S.x1 + i, Math.round(cy - 2 + k * 1.3 + Math.sin(i + k) * 0.5), fin);
      for (let y = -3; y <= 3; y++) set(S.x0 - 1, Math.round(cy + y), fin); // the fins at the point
    } else {
      const tx = S.x0 - 1;
      const spread = f.shape === 'round' ? 3 : f.shape === 'slim' ? 2.5 : 3.5;
      for (let i = 0; i < 4; i++) for (let y = -Math.round(1 + i * spread * 0.35); y <= Math.round(1 + i * spread * 0.35); y++) set(tx - i, Math.round(cy - 0.5 + y), fin);
      // a fin on the back
      const fx = Math.round((S.x0 + S.x1) / 2);
      for (let i = -2; i <= 2; i++) set(fx + i, Math.round(cy - S.h - (i < 1 ? 1 : 0)), fin);
    }
    if (f.shape === 'sword') for (let x = S.x1; x < W; x++) set(x, Math.round(cy - 1), fin); // the bill
    if (f.shape === 'cat') [[S.x1, cy + 1], [S.x1 + 1, cy + 2], [S.x1, cy + 2], [S.x1 + 2, cy + 3]].forEach(([x, y]) => set(x, Math.round(y), OUT)); // whiskers
  }
  // markings
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== back && grid[y][x] !== belly) continue;
      if (f.stripes && x % 3 === 0 && grid[y][x] === back) grid[y][x] = f.stripes;
      if (f.bars && (Math.abs(x - 9) < 1 || Math.abs(x - 15) < 1)) grid[y][x] = f.bars;
      if (f.band && Math.abs(y + 0.5 - cy) < 1) grid[y][x] = f.band;
      if (f.spots && (x * 7 + y * 13) % 11 < 2) grid[y][x] = f.spots;
    }
  // outline
  const filled = (x, y) => grid[y]?.[x] && grid[y][x] !== OUT;
  const out = grid.map((row) => row.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!grid[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled(x + dx, y + dy))) out[y][x] = OUT;
  // shading: light along the top edge, a highlight for shiny ones
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = out[y][x];
      if (!c || c === OUT) continue;
      if (out[y - 1]?.[x] === OUT) out[y][x] = mix(c, '#ffffff', f.shine ? 0.5 : 0.25);
      if (out[y + 1]?.[x] === OUT) out[y][x] = mix(c, '#000000', 0.25);
    }
  // the eye
  const ex = f.shape === 'octo' ? 12 : f.shape === 'squid' ? S.x1 - 3 : S.x1 - 3;
  const ey = f.shape === 'octo' ? 5 : Math.round(cy - (f.shape === 'round' || f.shape === 'deep' ? 2 : 1));
  out[ey][ex] = '#ffffff';
  out[ey][ex + 1] = OUT;
  if (f.shape === 'octo') {
    out[ey][ex + 3] = '#ffffff';
    out[ey][ex + 4] = OUT;
  }
  return out;
}
