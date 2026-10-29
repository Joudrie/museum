// Columns from around the world, drawn in code (no Phaser, so Node can use it too).
// paintColumn(id, W, H) returns RGBA pixels for a column W px wide and H px tall,
// standing on its bottom row. The same design is used for the main hall, the
// atrium and the shaped rooms (Customize → Columns) and for the free-standing
// columns in the toolkit, at whatever size each needs.
//
// Each design is built from a few shaded solids: `col` (a round shaft or
// moulding, its outline given row by row), `block` (a square slab) and `ball`
// (a lit ellipse for heads, buds and bosses). Light comes from the upper left,
// like the rest of the game's art. A dark outline is added at the end.

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const shade = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const WHITE = [255, 255, 255];
const hash = (x, y, s = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const frac = (v) => v - Math.floor(v);
// A colour at light level k (1 = as is, lower is shadow, higher is a highlight),
// stepped so the shading reads as pixel-art bands.
const tone = (c, k) => {
  const q = Math.round(k * 11) / 11;
  return q <= 1 ? shade(c, q) : mix(c, WHITE, Math.min(0.7, (q - 1) * 1.6));
};
// Light falling on a surface whose normal turns `n` radians from facing you (+ is to the right).
const lightAt = (n) => 0.36 + 0.74 * Math.max(0, -0.58 * Math.sin(n) + 0.82 * Math.cos(n));

// The designs, in the order they are offered. `note` is a short true fact.
export const COLUMNS = {
  doric: { name: 'Greek Doric', place: 'Ancient Greece', note: 'The Parthenon’s order: no base, and 20 sharp-edged flutes.' },
  ionic: { name: 'Greek Ionic', place: 'Ancient Greece', note: 'The scrolls on its capital are called volutes.' },
  corinthian: { name: 'Corinthian', place: 'Greece and Rome', note: 'Vitruvius says a basket left on a grave, grown over by acanthus, gave the idea.' },
  gilded: { name: 'Gilded Corinthian', place: 'Baroque palaces', note: 'Versailles and the great opera houses gilded their capitals in gold leaf.' },
  composite: { name: 'Roman Composite', place: 'Ancient Rome', note: 'Ionic scrolls on Corinthian leaves; the Arch of Titus has some of the first.' },
  tuscan: { name: 'Tuscan', place: 'Ancient Rome', note: 'Rome’s plainest order: a smooth shaft on a simple round base.' },
  caryatid: { name: 'Caryatid', place: 'Athens', note: 'Six stone maidens hold up a porch of the Erechtheion on the Acropolis.' },
  minoan: { name: 'Minoan', place: 'Knossos, Crete', note: 'Painted red, and wider at the top than at the bottom.' },
  papyrus: { name: 'Papyrus', place: 'Ancient Egypt', note: 'Karnak’s great hall has 134 columns carved as bundles of papyrus.' },
  palm: { name: 'Palm capital', place: 'Ancient Egypt', note: 'Egyptian builders carved capitals as palm fronds tied round the top.' },
  hathor: { name: 'Hathor column', place: 'Dendera, Egypt', note: 'Each capital is the face of Hathor, goddess of music and joy, with cow’s ears.' },
  persian: { name: 'Persepolis bulls', place: 'Persia', note: 'At Persepolis, two bulls back to back carried the cedar roof beams.' },
  solomonic: { name: 'Solomonic', place: 'Baroque Rome', note: 'Bernini’s bronze canopy in St Peter’s stands on four twisted columns.' },
  byzantine: { name: 'Byzantine', place: 'Constantinople', note: 'Hagia Sophia’s capitals are carved like lace; many bear Justinian’s monogram.' },
  romanesque: { name: 'Romanesque', place: 'Durham, England', note: 'Durham Cathedral’s great round piers are cut with deep zigzags.' },
  gothic: { name: 'Gothic pier', place: 'Medieval France', note: 'A bundle of thin shafts, each one carrying a rib of the vault above.' },
  moorish: { name: 'Nasrid', place: 'Granada, Spain', note: 'The Alhambra’s Court of the Lions has 124 slender marble columns.' },
  hoysala: { name: 'Hoysala pillar', place: 'Karnataka, India', note: 'Hoysala temple pillars of soapstone look as if they were turned on a lathe.' },
  ashoka: { name: 'Ashoka pillar', place: 'Mauryan India', note: 'Polished like glass; the lion capital from Sarnath is India’s national emblem.' },
  mughal: { name: 'Mughal', place: 'Mughal India', note: 'The Red Fort’s Diwan-i-Khas has marble pillars inlaid with stone flowers.' },
  khmer: { name: 'Khmer', place: 'Angkor, Cambodia', note: 'Angkor Wat’s galleries stand on square sandstone pillars carved with dancers.' },
  dragon: { name: 'Dragon column', place: 'Qufu, China', note: 'The Confucius Temple’s great hall stands on stone pillars wrapped in coiling dragons.' },
  chinese: { name: 'Chinese hall', place: 'Imperial China', note: 'Dougong brackets lock together and hold up the roof without nails.' },
  japanese: { name: 'Shinto shrine', place: 'Japan', note: 'Shrines like Itsukushima paint their pillars bright vermilion.' },
  maya: { name: 'Feathered serpent', place: 'Chichén Itzá', note: 'Serpent columns stand head-down, the rattle tail held up under the roof.' },
  atlantean: { name: 'Atlantean warrior', place: 'Tula, Mexico', note: 'Stone Toltec warriors about 4.6 m tall once held up a temple roof.' },
  yoruba: { name: 'Yoruba veranda post', place: 'Nigeria', note: 'Olowe of Ise carved veranda posts like this for Yoruba palaces.' },
  haida: { name: 'Haida house post', place: 'Haida Gwaii, Canada', note: 'Carved cedar house posts held up the roof beams of Haida plank houses.' },
  stave: { name: 'Norse stave', place: 'Norway', note: 'Stave churches are named for their corner posts, the staves.' },
  malachite: { name: 'Malachite', place: 'St Petersburg', note: 'St Isaac’s Cathedral has columns faced in green malachite.' },
  deco: { name: 'Art Deco', place: '1920s New York', note: 'Stepped, fluted and trimmed in gold, like the lobbies of 1920s skyscrapers.' },
};

export const DEFAULT_COLUMN = 'corinthian';
export const columnName = (id) => (COLUMNS[id] || COLUMNS[DEFAULT_COLUMN]).name;

// ---------- The painter ----------
function painter(W, H) {
  const px = new Uint8ClampedArray(W * H * 4);
  const cx = W / 2;
  const P = {
    W,
    H,
    cx,
    s: W / 34, // design unit: the designs are laid out for a 34 px wide column
    px,
    set(x, y, c, a = 255) {
      x = Math.floor(x);
      y = Math.floor(y);
      if (x < 0 || y < 0 || x >= W || y >= H || !c) return;
      const i = (y * W + x) * 4;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
      px[i + 3] = a;
    },
    get(x, y) {
      if (x < 0 || y < 0 || x >= W || y >= H) return null;
      const i = (y * W + x) * 4;
      return px[i + 3] ? [px[i], px[i + 1], px[i + 2]] : null;
    },
    rect(x0, y0, x1, y1, c) {
      for (let y = Math.round(y0); y < Math.round(y1); y++) for (let x = Math.round(x0); x < Math.round(x1); x++) P.set(x, y, c);
    },
    // One row of a round solid of half-width hw centred on c. `mat` is a colour or
    // (theta, y, u) => colour. o.flutes = flutes round the whole shaft, o.fillet the
    // flat strip between them (0..1), o.twist = turn added to the flutes at this row,
    // o.bump(theta, y) = extra turn of the normal (carving), o.k = extra light.
    ring(y, hw, mat, o = {}, c = cx) {
      if (hw <= 0.2) return;
      const x0 = Math.floor(c - hw);
      const x1 = Math.ceil(c + hw);
      for (let x = x0; x < x1; x++) {
        const u = (x + 0.5 - c) / hw;
        if (u < -1 || u > 1) continue;
        const th = Math.asin(u);
        let n = th;
        let k = o.k ?? 1;
        if (o.flutes) {
          // each flute is a groove: its left wall in shadow, its right wall lit,
          // with a flat fillet between (fading out where they crowd at the edges)
          const p = frac(((th + (o.twist || 0)) * o.flutes) / (2 * Math.PI) + 0.5);
          const f = o.fillet || 0;
          const q = p < f ? -1 : (p - f) / (1 - f);
          const g = o.depth ?? 1;
          const fk = q < 0 ? 1.08 : q < 0.34 ? 1 - 0.3 * g : q < 0.67 ? 1 - 0.1 * g : 1 + 0.06 * g;
          k *= 1 + (fk - 1) * clamp((1 - Math.abs(u)) * 3, 0, 1);
        }
        if (o.bump) n += o.bump(th, y, u);
        const base = typeof mat === 'function' ? mat(th, y, u) : mat;
        if (!base) continue;
        P.set(x, y, tone(base, lightAt(n) * k));
      }
    },
    // A round solid from row y0 down to y1, half-width hw(t) with t 0 at the top and
    // 1 at the bottom. Rows that face up catch the light, rows that face down are in shade.
    col(y0, y1, hw, mat, o = {}) {
      y0 = Math.round(y0);
      y1 = Math.round(y1);
      const n = Math.max(1, y1 - y0);
      const at = (y) => (typeof hw === 'function' ? hw(clamp((y - y0) / n, 0, 1)) : hw);
      for (let y = y0; y < y1; y++) {
        const slope = at(y + 1) - at(y - 0); // + = wider below: faces up
        const kv = slope > 0 ? 1 + 0.32 * Math.min(1, slope / 1.2) : 1 + 0.42 * Math.max(-1, slope / 1.2);
        const c = o.dx ? cx + o.dx(y) : cx;
        P.ring(y, at(y), mat, { ...o, k: (o.k ?? 1) * kv, twist: o.twist ? o.twist(y) : 0 }, c);
      }
    },
    // A doughnut moulding: widest in the middle, rounding off top and bottom.
    torus(y0, y1, hwMax, hwMin, mat, o) {
      P.col(y0, y1, (t) => hwMin + (hwMax - hwMin) * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)), mat, o);
    },
    // A square slab centred on the column: lit top edge, shaded right side and underside.
    block(y0, y1, hw, mat, o = {}) {
      y0 = Math.round(y0);
      y1 = Math.round(y1);
      const c = o.c ?? cx;
      const x0 = Math.round(c - hw);
      const x1 = Math.round(c + hw);
      if (o.ol) P.rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1, tone(typeof mat === 'function' ? mat(x0, y0) : mat, 0.34));
      const side = Math.max(1, Math.round((x1 - x0) * (o.side ?? 0.16)));
      for (let y = y0; y < y1; y++)
        for (let x = x0; x < x1; x++) {
          const base = typeof mat === 'function' ? mat(x, y) : mat;
          if (!base) continue;
          let k = 0.97;
          if (x >= x1 - side) k = 0.72;
          if (x === x0) k = 1.12;
          if (y === y0) k = o.flatTop ? k : 1.18;
          if (y === y1 - 1 && y1 - y0 > 2) k *= 0.7;
          P.set(x, y, tone(base, k * (o.k ?? 1)));
        }
    },
    // A lit ellipse (heads, buds, bosses, eggs).
    ball(bx, by, rx, ry, mat, o = {}) {
      if (o.ol) P.ball(bx, by, rx + 1, ry + 1, null, { dark: typeof mat === 'function' ? mat(bx, by, 0, 0) : mat });
      for (let y = Math.floor(by - ry); y <= Math.ceil(by + ry); y++)
        for (let x = Math.floor(bx - rx); x <= Math.ceil(bx + rx); x++) {
          const dx = (x + 0.5 - bx) / rx;
          const dy = (y + 0.5 - by) / ry;
          const d = dx * dx + dy * dy;
          if (d > 1) continue;
          const nz = Math.sqrt(1 - d);
          const l = 0.34 + 0.8 * Math.max(0, -0.5 * dx - 0.42 * dy + 0.76 * nz);
          if (o.dark) {
            P.set(x, y, tone(o.dark, 0.34));
            continue;
          }
          const base = typeof mat === 'function' ? mat(x, y, dx, dy) : mat;
          if (base) P.set(x, y, tone(base, l * (o.k ?? 1)));
        }
    },
    // A filled shape given by half-width per row about centre c (flat lighting with a lit left edge).
    shape(y0, y1, hwAt, mat, c = cx, k = 1) {
      for (let y = Math.round(y0); y < Math.round(y1); y++) {
        const hw = hwAt(y);
        if (hw <= 0) continue;
        for (let x = Math.round(c - hw); x < Math.round(c + hw); x++) {
          const u = (x + 0.5 - c) / hw;
          const base = typeof mat === 'function' ? mat(x, y, u) : mat;
          if (base) P.set(x, y, tone(base, k * (u < -0.6 ? 1.1 : u > 0.55 ? 0.75 : 0.95)));
        }
      }
    },
  };
  return P;
}

// A dark line round the outside of the drawing, darker on the shadow side.
function outline(P) {
  const { W, H, px } = P;
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && px[(y * W + x) * 4 + 3] > 0;
  const edge = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!solid(x, y)) continue;
      const open = !solid(x - 1, y) || !solid(x + 1, y) || !solid(x, y - 1) || !solid(x, y + 1);
      if (open) edge.push([x, y, !solid(x - 1, y) || !solid(x, y - 1)]);
    }
  edge.forEach(([x, y, lit]) => {
    const i = (y * W + x) * 4;
    const k = lit ? 0.62 : 0.42;
    px[i] *= k;
    px[i + 1] *= k;
    px[i + 2] *= k;
  });
}

// Hand-drawn pixel pieces (heads, beasts): rows of letters, a = lit .. o = darkest,
// '.' left clear. pal maps a letter to [colour, light].
function tpl(P, rows, x0, y0, pal, flip = false) {
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      const e = pal[ch];
      if (!e) return;
      P.set(flip ? x0 + row.length - 1 - i : x0 + i, y0 + j, tone(e[0], e[1]));
    }),
  );
}
const pal = (m, extra = {}) => ({ a: [m, 1.22], b: [m, 1], c: [m, 0.8], d: [m, 0.62], o: [m, 0.36], ...extra });

// ---------- Materials ----------
// Marble with faint grey veins.
const marble = (base, seed = 1, vein = 0.05) => {
  const c = hex(base);
  const v = shade(c, 0.88);
  return (th, y) => {
    const w = Math.sin(th * 2.3 + y * 0.09 + Math.sin(y * 0.05 + seed) * 2.6);
    return Math.abs(w) < vein && Math.sin(y * 0.13 + seed * 3) > 0.2 ? v : c;
  };
};
const solid = (base) => hex(base);
const GOLD = hex('#d9ab3c');
const GOLD_L = hex('#f3d77a');

// Entasis: a shaft that swells a little and tapers to the top.
const shaftHW = (bot, top, swell = 0.04) => (t) => top + (bot - top) * t + bot * swell * Math.sin(Math.PI * t);

// The classical round base (plinth, torus, scotia, torus). y is the bottom row; returns the top.
function atticBase(P, y, hw, m) {
  const { H } = P;
  const u = Math.max(1, H / 88);
  const ph = Math.round(4 * u);
  P.block(y - ph, y, hw + 1, m);
  y -= ph;
  const t1 = Math.round(4 * u);
  P.torus(y - t1, y, hw, hw * 0.82, m);
  y -= t1;
  const sc = Math.round(2 * u);
  P.col(y - sc, y, (t) => hw * (0.7 + 0.08 * t), m, { k: 0.8 });
  y -= sc;
  const t2 = Math.round(3 * u);
  P.torus(y - t2, y, hw * 0.86, hw * 0.7, m);
  return y - t2;
}

// Ionic volute: a scroll curling in to an eye, lit from the upper left.
function volute(P, vx, vy, R, m, dir) {
  const turns = 2.2;
  const b = R / (2 * Math.PI * turns);
  for (let y = Math.floor(vy - R); y <= Math.ceil(vy + R); y++)
    for (let x = Math.floor(vx - R); x <= Math.ceil(vx + R); x++) {
      const dx = x + 0.5 - vx;
      const dy = y + 0.5 - vy;
      const r = Math.hypot(dx, dy);
      if (r > R) continue;
      let phi = Math.atan2(dy, dx * dir);
      if (phi < 0) phi += 2 * Math.PI;
      const k = Math.round((r / b - phi) / (2 * Math.PI));
      const dist = Math.abs(r - b * (phi + 2 * Math.PI * k));
      const l = 0.62 + 0.5 * clamp((-dx * 0.6 - dy * 0.8) / R, -1, 1);
      if (r < R * 0.2) P.set(x, y, tone(m, 0.9));
      else if (dist < 0.75) P.set(x, y, tone(m, 0.48));
      else P.set(x, y, tone(m, 0.75 + l * 0.35));
    }
}

// A row of acanthus leaves round a bell. Leaves sit at angles `ths` round the
// visible half, from row yb up to yt: each one outlined, lit down its middle
// with a dark midrib and lobed edges, its tip curling out as a bright knob.
function leaves(P, yt, yb, hwAt, ths, m, o = {}) {
  const { cx, s } = P;
  const hgt = yb - yt;
  const W0 = (o.width ?? 3.6) * s;
  ths.forEach((th0) => {
    const scale = 0.45 + 0.55 * Math.cos(th0); // leaves round the side look narrower
    const at = (y) => {
      const t = (yb - y) / hgt; // 0 at the foot of the leaf, 1 at the tip
      const lean = t > 0.55 ? (t - 0.55) * 2.2 * s * (o.curl ?? 1) : 0;
      const lx = cx + Math.sin(th0) * (hwAt(y) + lean);
      const half = W0 * scale * (0.42 + 0.58 * Math.sin(Math.PI * clamp(t * 1.05, 0, 1)) ** 0.8);
      return { t, lx, half };
    };
    for (const pass of [0, 1])
      for (let y = Math.round(yt + 1); y < Math.round(yb); y++) {
        const { t, lx, half } = at(y);
        const lobe = Math.round((y - yt) / Math.max(1.5, 2 * s)) % 2 ? 0.6 : 0; // serrated edge
        const hw = half + (pass ? 0 : 1) - lobe * 0.5;
        for (let x = Math.floor(lx - hw); x <= Math.ceil(lx + hw); x++) {
          const v = (x + 0.5 - lx) / Math.max(0.6, hw);
          if (Math.abs(v) > 1) continue;
          if (!pass) {
            P.set(x, y, tone(m, 0.34));
            continue;
          }
          let k = lightAt(th0 * 0.8 + v * 0.75) * 1.12;
          if (Math.abs(v) < 0.2 && t < 0.8) k *= 0.7; // the midrib
          if (Math.abs(v) > 0.75) k *= 0.85;
          P.set(x, y, tone(m, k));
        }
      }
    // the curled tip
    const tip = at(yt + 1.5);
    P.ball(tip.lx + Math.sin(th0) * 0.8 * s, yt + 1.2, Math.max(1.3, 1.9 * s * scale), Math.max(1.3, 1.7 * s), m, { ol: true, k: 1.18 });
  });
}

// Persepolis: two bulls back to back on scrolls over a tall fluted shaft.
const BULL = [
  '.....oo..........',
  '....oao..........',
  '....oao..........',
  '...oaoo.ooo......',
  '..oaaoobbboooo...',
  '.obaabbbbbbbbbooo',
  'obabeebbbbbbbbbbb',
  'obbbbbbbcbcbcbcbc',
  'obbbbbbcbcbcbcbcb',
  'obbbbbccbcbcbcbcb',
  '.occccobbbbbbbbbb',
  '..oooo.obabbbbbbb',
  '......obbbbbbbbbb',
  '.....oabbbcobbbbb',
  '....oabbbbco.obbb',
  '....oooooooo.oooo',
];

// Hathor, goddess of music and joy: a woman's face with cow's ears and a heavy wig.
const HATHOR = [
  'aa.wwwwwwwwwwwwww.aa',
  'abawwwwwwwwwwwwwwaba',
  '.bbwwbbbbbbbbbbwwbb.',
  '..wwbabbbbbbbbbcww..',
  '..wwbabbbbbbbbbcww..',
  '..wwbcccbbbbcccbww..',
  '..wwbbeebbbbeebcww..',
  '..wwbbbbbbbbbbbcww..',
  '..wwbbbbbcbbbbbcww..',
  '..wwbbbbbcbbbbbcww..',
  '..wwbbbbccdbbbbcww..',
  '..wwbbbbbbbbbbbcww..',
  '..wwbbbbrrrrbbbcww..',
  '..wwcbbbbbbbbbccww..',
  '..ww.cbbbbbbbcc.ww..',
  '..ww..cccccccc..ww..',
  '..www..........www..',
  '.wwoww........wwoww.',
  '.wwwww........wwwww.',
  '..www..........www..',
];

// ---------- The designs ----------
const D = {};

D.doric = (P) => {
  const { H, s } = P;
  const m = marble('#eadfca', 2);
  const u = H / 88;
  let y = H;
  // a two-step stylobate (the Greek temple floor) under the shaft
  P.block(y - 3 * u, y, 17 * s, m);
  y -= Math.round(3 * u);
  P.block(y - 3 * u, y, 15.5 * s, m);
  y -= Math.round(3 * u);
  const abH = Math.round(5 * u);
  const echH = Math.round(6 * u);
  const top = abH + echH + Math.round(2 * u);
  const shaftBot = 12.5 * s;
  const shaftTop = 10 * s;
  P.col(top, y, shaftHW(shaftBot, shaftTop, 0.05), m, { flutes: 20, depth: 1.3 });
  // necking: three thin rings
  for (let i = 0; i < 3; i++) P.ring(top + i, shaftTop + 0.5, m, { k: i % 2 ? 0.78 : 1.1 });
  P.col(abH, abH + echH, (t) => shaftTop + (15 * s - shaftTop) * (1 - t) ** 1.6, m);
  P.block(0, abH, 15.5 * s, m);
};

D.ionic = (P) => {
  const { H, s, cx } = P;
  const m = marble('#ece7dc', 3);
  const mc = hex('#ece7dc');
  const u = H / 88;
  const y = atticBase(P, H, 13 * s, m);
  const capH = Math.round(14 * u);
  P.col(capH, y, shaftHW(10.5 * s, 9 * s, 0.03), m, { flutes: 24, fillet: 0.25, depth: 1 });
  // astragal: a bead at the top of the shaft
  P.torus(capH - 2 * u, capH, 10 * s, 8.5 * s, m);
  // echinus carved with egg-and-dart
  const ey0 = Math.round(6 * u);
  const ey1 = Math.round(capH - 2 * u);
  P.col(ey0, ey1, (t) => 12 * s - 2 * s * t, (th) => (frac((th * 8) / Math.PI + 0.25) < 0.62 ? mc : shade(mc, 0.55)));
  // the canalis: the cushion joining the two volutes, hollowed along the middle
  P.block(Math.round(2 * u), Math.round(7 * u), 12.5 * s, m, { side: 0.02 });
  for (let x = Math.round(cx - 12 * s); x < cx + 12 * s; x++) {
    P.set(x, Math.round(4.5 * u), tone(mc, 0.6));
    P.set(x, Math.round(4.5 * u) + 1, tone(mc, 0.82));
  }
  P.block(0, Math.round(2 * u), 14.5 * s, m);
  const R = Math.min(5.4 * s, 5.4 * u + 0.6);
  volute(P, cx - 11.6 * s, 2 * u + R, R, mc, -1);
  volute(P, cx + 11.6 * s, 2 * u + R, R, mc, 1);
};

function corinthianCap(P, top, capH, m, leafM, o = {}) {
  const { s, cx } = P;
  const mc = typeof leafM === 'function' ? leafM(0, 0) : leafM;
  const abH = Math.max(3, Math.round(capH * 0.15));
  const bell = (t) => 9.3 * s + 3.6 * s * (1 - t) ** 1.4; // t 0 top .. 1 bottom
  const bellAt = (y) => bell((y - top - abH) / (capH - abH));
  // the bell behind the leaves, in shadow
  P.col(top + abH, top + capH, bell, m, { k: 0.55 });
  const y1 = top + capH;
  const ym = top + abH + (capH - abH) * 0.5;
  // stalks (caulicoli) rising to the corner scrolls
  [-1, 1].forEach((d) => {
    for (let y = Math.round(top + abH + 2); y < ym + 3; y++) {
      const x = cx + d * (8 * s + (ym + 3 - y) * 0.4);
      P.set(x, y, tone(mc, d < 0 ? 1.05 : 0.72));
      P.set(x + d, y, tone(mc, 0.4));
    }
  });
  // two rows of acanthus: the tall back row first, then the short front row over it
  leaves(P, top + abH + 1, ym + 3, bellAt, [-1.2, -0.6, 0, 0.6, 1.2], mc, { width: 3.2, curl: 1.2 });
  leaves(P, ym, y1, bellAt, [-0.95, -0.32, 0.32, 0.95], mc, { width: 3.8 });
  // corner helices curling under the abacus
  const R = Math.max(2.6, 3.4 * s);
  volute(P, cx - 12.8 * s, top + abH + R * 0.8, R, mc, -1);
  volute(P, cx + 12.8 * s, top + abH + R * 0.8, R, mc, 1);
  // abacus with a flower in the middle
  P.block(top, top + abH, 15.5 * s, m, { side: 0.12 });
  if (o.flower !== false) P.ball(cx, top + abH * 0.55, 2 * s, abH * 0.6, mc, { k: 1.15, ol: true });
}

D.corinthian = (P) => {
  const { H, s } = P;
  const m = marble('#efeae0', 4);
  const u = H / 88;
  const y = atticBase(P, H, 13.5 * s, m);
  const capH = Math.round(24 * u);
  P.col(capH, y, shaftHW(10.5 * s, 9.2 * s, 0.03), m, { flutes: 24, fillet: 0.25, depth: 1 });
  P.torus(capH - 2, capH + 1, 10 * s, 8.6 * s, m);
  corinthianCap(P, 0, capH, m, hex('#f4f0e8'));
};

D.gilded = (P) => {
  const { H, s } = P;
  const shaft = marble('#e8e2d6', 7, 0.16);
  const g = solid('#d9ab3c');
  const u = H / 88;
  // gold base mouldings on a dark marble plinth
  const ph = Math.round(5 * u);
  P.block(H - ph, H, 15 * s, marble('#3a3236', 3, 0.2));
  let y = H - ph;
  P.torus(y - 4 * u, y, 13.5 * s, 11 * s, g);
  y -= Math.round(4 * u);
  P.col(y - 2 * u, y, 10.6 * s, g, { k: 0.8 });
  y -= Math.round(2 * u);
  P.torus(y - 3 * u, y, 12 * s, 10 * s, g);
  y -= Math.round(3 * u);
  const capH = Math.round(24 * u);
  P.col(capH, y, shaftHW(10.5 * s, 9.2 * s, 0.03), shaft, { flutes: 24, fillet: 0.3, depth: 0.9 });
  P.torus(capH - 2, capH + 1, 10 * s, 8.6 * s, g);
  corinthianCap(P, 0, capH, solid('#b98b2a'), GOLD_L);
};

D.composite = (P) => {
  const { H, s, cx } = P;
  const m = marble('#e9e3d6', 5);
  const mc = hex('#f2eee6');
  const u = H / 88;
  const y = atticBase(P, H, 13.5 * s, m);
  const capH = Math.round(24 * u);
  // a smooth shaft of pink granite, like Rome's Pantheon porch
  P.col(capH, y, shaftHW(10.5 * s, 9.3 * s, 0.03), marble('#b98a7e', 9, 0.3));
  P.torus(capH - 2, capH + 1, 10 * s, 8.6 * s, m);
  const top = 0;
  const abH = Math.round(3 * u);
  const bell = (t) => 9.3 * s + 2.8 * s * (1 - t) ** 1.4;
  const bellAt = (y2) => bell((y2 - top - abH) / (capH - abH));
  P.col(top + abH, capH, bell, m, { k: 0.78 });
  const ym = top + abH + (capH - abH) * 0.55;
  leaves(P, ym, capH, bellAt, [-1.05, -0.35, 0.35, 1.05], mc, { width: 3.4 });
  leaves(P, top + abH + 7 * u, ym + 3, bellAt, [-0.7, 0, 0.7], mc, { width: 3.2, curl: 1.3 });
  // an Ionic echinus with eggs, and big diagonal scrolls
  P.col(abH + 3 * u, abH + 7 * u, 11 * s, (th) => (frac((th * 8) / Math.PI + 0.25) < 0.6 ? mc : shade(mc, 0.6)));
  P.block(abH, abH + 3.5 * u, 15 * s, m, { side: 0.02 });
  P.block(0, abH, 15.5 * s, m);
  const R = 5 * s;
  volute(P, cx - 12.8 * s, abH + R * 0.9, R, mc, -1);
  volute(P, cx + 12.8 * s, abH + R * 0.9, R, mc, 1);
};

D.tuscan = (P) => {
  const { H, s } = P;
  const m = marble('#d8cdb8', 6, 0.08);
  const u = H / 88;
  let y = H;
  P.block(y - 6 * u, y, 15 * s, m);
  y -= Math.round(6 * u);
  P.torus(y - 5 * u, y, 13.5 * s, 11 * s, m);
  y -= Math.round(5 * u);
  P.col(y - 2 * u, y, 11.2 * s, m);
  y -= Math.round(2 * u);
  const capH = Math.round(12 * u);
  P.col(capH, y, shaftHW(11 * s, 9 * s, 0.03), m);
  P.col(capH - 2 * u, capH, 9.8 * s, m, { k: 1.05 });
  P.col(5 * u, capH - 2 * u, (t) => 9.4 * s + 3.6 * s * (1 - t) ** 1.5, m);
  P.block(0, 5 * u, 14.5 * s, m);
};

// A stone maiden carrying the roof on her head.
D.caryatid = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#efe6d2');
  const hair = hex('#cbbd9e');
  const m = marble('#efe6d2', 8);
  const u = H / 88;
  // pedestal
  const pedTop = H - Math.round(9 * u);
  P.block(pedTop + 2 * u, H, 14.5 * s, m);
  P.block(pedTop, pedTop + 2 * u, 15.5 * s, m);
  // capital on her head: an abacus over an echinus with eggs, on a round polos
  P.block(0, 3 * u, 12.5 * s, m);
  P.col(3 * u, 7 * u, (t) => 9.5 * s - 3.5 * s * t, (th) => (frac((th * 6) / Math.PI + 0.25) < 0.6 ? stone : shade(stone, 0.6)));
  P.col(7 * u, 9 * u, 5 * s, stone, { k: 1.05 });
  // long braided hair falling down her back, seen over the shoulders
  [-1, 1].forEach((d) => {
    for (let y = Math.round(12 * u); y < 28 * u; y++) {
      const x = cx + d * (4.4 * s + Math.min(2.4, (y - 12 * u) * 0.2) * s);
      P.set(x, y, tone(hair, y % 3 === 0 ? 0.55 : 0.85));
      P.set(x + d, y, tone(hair, y % 3 === 0 ? 0.45 : 0.7));
    }
  });
  // neck, then sloping shoulders and the arms hanging at her sides
  P.col(19 * u, 21.5 * u, 2.4 * s, stone);
  P.col(21.5 * u, 25 * u, (t) => 4 * s + 4.8 * s * Math.sqrt(t), stone);
  [-1, 1].forEach((d) => P.col(23 * u, 35 * u, 1.6 * s, stone, { dx: () => d * 9.6 * s, k: d < 0 ? 1.05 : 0.85 }));
  // the overfold of the peplos, hanging lower in the middle
  const hem = (x) => 33 * u + 2.5 * u * Math.cos(((x + 0.5 - cx) / (9 * s)) * (Math.PI / 2));
  P.col(25 * u, 37 * u, (t) => 8 * s + 0.6 * s * t, (th, y, uu) => (y <= hem(cx + uu * 8.5 * s) ? stone : null), { flutes: 14, fillet: 0.45, depth: 0.6, k: 1.06 });
  // the skirt: narrow at the hips, deep folds, widening to the floor, one knee forward
  const knee = cx - 3.4 * s;
  const skirtTop = 32 * u;
  P.col(skirtTop, pedTop, (t) => 7.6 * s + 3.6 * s * t ** 1.1, (th, y, uu) => (y > hem(cx + uu * 9 * s) ? stone : null), {
    flutes: 20,
    fillet: 0.15,
    depth: 1.2,
    bump: (th, y, uu) => {
      const kx = (cx + uu * 9 * s - knee) / (3 * s);
      const ky = (y - (skirtTop + 15 * u)) / (9 * u);
      return Math.abs(kx) < 1 && Math.abs(ky) < 1 ? -0.6 * kx * (1 - ky * ky) : 0;
    },
  });
  for (let x = Math.round(cx - 9 * s); x < cx + 9 * s; x++) P.set(x, Math.round(hem(x)) + 1, tone(stone, 0.45));
  P.ball(knee, skirtTop + 14 * u, 2.4 * s, 5.5 * u, stone, { k: 1.12 });
  // head: hair parted over the brow, the face lit below
  const hy = 14.5 * u;
  P.ball(cx, hy, 4.4 * s, 5.2 * u, (x, y, dx, dy) => (dy < -0.25 || Math.abs(dx) > 0.82 ? (y % 2 ? hair : shade(hair, 0.88)) : stone), { k: 1.12 });
  P.set(cx - 1.8 * s, hy + 0.4 * u, tone(stone, 0.5));
  P.set(cx + 1.5 * s, hy + 0.4 * u, tone(stone, 0.5));
  P.set(cx - 0.2, hy + 1.8 * u, tone(stone, 0.75));
  P.set(cx - 0.2, hy + 3.2 * u, tone(stone, 0.62));
  // toes peeping out under the hem
  P.rect(cx - 6 * s, pedTop - 1, cx - 3 * s, pedTop, tone(stone, 1.1));
  P.rect(cx + 2 * s, pedTop - 1, cx + 5 * s, pedTop, tone(stone, 1.0));
};

D.minoan = (P) => {
  const { H, s } = P;
  const red = hex('#a8322a');
  const black = hex('#2a2422');
  const ochre = hex('#d8a24a');
  const u = H / 88;
  let y = H;
  P.block(y - 4 * u, y, 13 * s, solid('#b8aa92'));
  y -= Math.round(4 * u);
  P.col(y - 2 * u, y, 8.5 * s, black);
  y -= Math.round(2 * u);
  const capH = Math.round(17 * u);
  // the shaft widens toward the top
  P.col(capH, y, (t) => 11.5 * s - 3.4 * s * t, red, { k: 1.05 });
  // a fat black cushion capital between bands of ochre and black
  P.col(capH - 3 * u, capH, 11.5 * s, ochre);
  P.col(capH - 4 * u, capH - 3 * u, 11.5 * s, black);
  P.torus(6 * u, capH - 4 * u, 15.5 * s, 11.5 * s, black, { k: 1.25 });
  P.col(5 * u, 6 * u, 12 * s, ochre);
  P.block(0, 5 * u, 15 * s, black, { k: 1.4 });
  // ochre rings with a wavy line round the cushion
  for (let x = 0; x < P.W; x++) {
    const yy = Math.round(capH / 2 + 1 + Math.sin(x * 0.7) * 1.2 * u);
    if (P.get(x, yy)) P.set(x, yy, tone(ochre, 1));
  }
};

// Egyptian: a bundle of papyrus stems opening into a wide flower.
D.papyrus = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#d9bf8a');
  const blue = hex('#2f5d9a');
  const green = hex('#3d7a52');
  const red = hex('#a8422e');
  const u = H / 88;
  let y = H;
  // a round base disc
  P.col(y - 4 * u, y, (t) => 14 * s + 1 * s * t, stone);
  y -= Math.round(4 * u);
  const capTop = Math.round(4 * u);
  const capBot = Math.round(26 * u);
  // the shaft: bundled stems, with painted bands near the top
  const shaft = (th, yy) => {
    const b = (yy - capBot) / u;
    if (b > 2 && b < 4) return blue;
    if (b > 4 && b < 6) return red;
    if (b > 6 && b < 8) return green;
    return stone;
  };
  P.col(capBot, y, (t) => 10 * s + 1.8 * s * t ** 2 - 2 * s * (1 - t) * 0, shaft, { flutes: 16, fillet: 0, depth: 0.9 });
  // the foot of the stems is drawn in with leaves (triangles round the base)
  for (let x = Math.round(cx - 11.5 * s); x < cx + 11.5 * s; x++) {
    const ph = frac((x - cx) / (4 * s));
    const hgt = Math.round((1 - Math.abs(ph - 0.5) * 2) * 6 * u);
    for (let k = 0; k < hgt; k++) P.set(x, y - 1 - k, tone(green, 0.9 - k * 0.03));
  }
  // the open flower: a bell flaring out, painted with petals
  const bell = (t) => 10 * s + 6.8 * s * (1 - t) ** 1.8;
  P.col(capTop, capBot, bell, (th, yy) => {
    const t = (yy - capTop) / (capBot - capTop);
    const p = frac((th * 7) / Math.PI);
    if (t > 0.15 && Math.abs(p - 0.5) < 0.5 * (1 - t) + 0.06) return t > 0.45 ? green : blue; // petals
    return stone;
  });
  // the rim and the block (abacus) on top
  P.col(capTop - 1, capTop + 1, 16.5 * s, stone, { k: 1.1 });
  P.block(0, capTop - 1, 9 * s, stone);
};

D.palm = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#dcc59a');
  const green = hex('#4f8a4a');
  const gold = hex('#c99a3a');
  const u = H / 88;
  let y = H;
  P.col(y - 4 * u, y, 14 * s, stone);
  y -= Math.round(4 * u);
  const capBot = Math.round(28 * u);
  P.col(capBot, y, shaftHW(10.5 * s, 9.5 * s, 0.02), stone);
  // the band that ties the fronds on
  for (let i = 0; i < 5; i++) P.ring(capBot - i * u * 0.9, 10 * s, i % 2 ? gold : hex('#2f5d9a'), { k: 1 });
  // palm fronds curling outward, ribbed
  const top = Math.round(4 * u);
  const bot = capBot - Math.round(4.5 * u);
  const flare = (t) => 10 * s + 6.5 * s * (1 - t) ** 1.5;
  P.col(top, bot, flare, (th, yy) => {
    const p = frac((th * 9) / Math.PI + 0.5);
    const t = (yy - top) / (bot - top);
    if (p < 0.12) return shade(green, 0.55);
    return (Math.round((yy + p * 6) / 2) % 2 && t > 0.15) ? green : mix(green, gold, 0.3);
  });
  // the frond tips curl over at the top
  for (let i = -3; i <= 3; i++) P.ball(cx + i * 4.4 * s, top + 1, 2.2 * s, 2 * u, green, { k: 1.1 });
  P.block(0, top - 1, 9 * s, stone);
};

D.hathor = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#dcc69a');
  const blue = hex('#2f5d9a');
  const u = H / 88;
  let y = H;
  P.col(y - 4 * u, y, (t) => 13 * s + 1.5 * s * t, stone);
  y -= Math.round(4 * u);
  const capBot = Math.round(32 * u);
  P.col(capBot, y, shaftHW(10.5 * s, 9.8 * s, 0.02), stone);
  // a painted band of hieroglyphs down the front
  for (let yy = capBot + 4 * u; yy < y - 5 * u; yy += 5 * u) {
    const g = Math.floor(hash(yy, 3) * 3);
    P.rect(cx - 2 * s, yy, cx + 2 * s, yy + 1, tone(blue, 0.9));
    if (g === 0) P.ball(cx, yy + 3 * u, 1.2 * s, 1.2 * u, hex('#a8422e'));
    else if (g === 1) P.rect(cx - 1, yy + 2 * u, cx + 1, yy + 4 * u, tone(hex('#3d7a52'), 1));
    else P.rect(cx - 1.5 * s, yy + 2.5 * u, cx + 1.5 * s, yy + 3.5 * u, tone(hex('#2a1a12'), 1));
  }
  // the face block, painted wig and all
  const fy0 = capBot - 22;
  P.block(fy0 - 1, capBot, 12.5 * s, stone, { side: 0.08 });
  const wig = (j) => [j % 2 ? blue : shade(blue, 0.8), 1];
  const rows = HATHOR.map((r) => r);
  rows.forEach((row, j) =>
    [...row].forEach((ch, i) => {
      const e = ch === 'w' ? wig(j) : ch === 'e' ? [hex('#1e1a1a'), 1] : ch === 'r' ? [hex('#a8422e'), 1] : pal(stone)[ch];
      if (e) P.set(Math.round(cx) - 10 + i, fy0 + j, tone(e[0], e[1]));
    }),
  );
  // a little shrine (naos) on her head, with a uraeus cobra frieze on top
  const ny = fy0 - 1;
  P.block(ny - 9 * u, ny, 9 * s, stone);
  P.rect(cx - 4 * s, ny - 7 * u, cx + 4 * s, ny - 2 * u, tone(blue, 0.85));
  P.rect(cx - 1, ny - 6 * u, cx + 1, ny - 3 * u, tone(GOLD, 1));
  P.block(0, ny - 9 * u, 12 * s, (x) => (x % 3 === 0 ? GOLD : stone));
};

D.persian = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#cbbb9c');
  const m = marble('#cbbb9c', 11);
  const u = H / 88;
  let y = H;
  // a bell-shaped base of hanging petals on a square plinth
  P.block(y - 2 * u, y, 15 * s, m);
  y -= Math.round(2 * u);
  P.col(y - 8 * u, y, (t) => 7.5 * s + 6 * s * t ** 1.6, (th) => (frac((th * 9) / Math.PI) < 0.22 ? shade(stone, 0.62) : stone));
  y -= Math.round(8 * u);
  const capBot = Math.round(36 * u);
  P.col(capBot, y, 8.2 * s, m, { flutes: 36, depth: 0.7 });
  // an upturned bell of leaves, then upright double scrolls
  P.col(capBot - 6 * u, capBot, (t) => 8.2 * s + 3 * s * (1 - t) ** 1.5, (th) => (frac((th * 7) / Math.PI) < 0.25 ? shade(stone, 0.6) : stone));
  const sy0 = capBot - 15 * u;
  const sy1 = capBot - 6 * u;
  // upright double scrolls: a ribbed block with a scroll curling out at each top corner
  P.block(sy0, sy1, 7 * s, (x) => (Math.round(x + 0.5 - cx) % 3 === 0 ? shade(stone, 0.68) : stone), { side: 0.14 });
  [-1, 1].forEach((d) => volute(P, cx + d * 7.5 * s, sy0 + 3 * u, 3.2 * s, stone, d));
  // the bulls, and the cedar beam resting between their necks
  const by = sy0 - 16;
  tpl(P, BULL, Math.round(cx) - 17, by, pal(stone, { e: [hex('#2a1a12'), 1] }));
  tpl(P, BULL, Math.round(cx), by, pal(stone, { e: [hex('#2a1a12'), 1] }), true);
  P.block(by - 3 * u, by + 5, 4 * s, solid('#6e4a2e'), { side: 0.2 });
  P.block(0, by - 3 * u, 16 * s, solid('#6e4a2e'), { side: 0.06 });
};

// Baroque twisted column: the shaft winds like a barley-sugar stick.
D.solomonic = (P) => {
  const { H, s, cx } = P;
  const m = marble('#3f2a2e', 12, 0.25);
  const dark = (th, yy) => {
    const base = m(th, yy);
    return base;
  };
  const u = H / 88;
  const gold = solid('#d9ab3c');
  // a gold-trimmed base
  let y = H;
  P.block(y - 6 * u, y, 15 * s, marble('#e8e2d6', 2));
  y -= Math.round(6 * u);
  P.torus(y - 4 * u, y, 13 * s, 10.5 * s, gold);
  y -= Math.round(4 * u);
  const capH = Math.round(22 * u);
  const period = 22 * u;
  const amp = 2.2 * s;
  P.col(capH, y, 8.8 * s, dark, {
    dx: (yy) => amp * Math.sin((yy / period) * 2 * Math.PI),
    bump: (th, yy) => 0.9 * Math.cos((yy / period) * 2 * Math.PI - th * 1.0),
  });
  // gold vines winding up the hollows of the twist
  for (let yy = capH; yy < y; yy++) {
    const ph = (yy / period) * 2 * Math.PI;
    const x = cx + amp * Math.sin(ph) + Math.sin(ph + Math.PI / 2) * 8.8 * s * 0.85;
    if (Math.cos(ph + Math.PI / 2) > -0.2) P.set(x, yy, tone(GOLD, 1.05));
    if (hash(yy, 5) > 0.7 && Math.cos(ph + Math.PI / 2) > 0) P.ball(x + 1, yy, 1.2, 1.2, hex('#5f8a3a'));
  }
  P.torus(capH - 1, capH + 2, 10 * s, 8.5 * s, gold);
  corinthianCap(P, 0, capH, gold, GOLD_L);
};

// Byzantine: a purple porphyry shaft under a deep-cut basket capital.
D.byzantine = (P) => {
  const { H, s, cx } = P;
  const porphyry = (th, yy) => (hash(Math.round(th * 12), yy, 3) > 0.86 ? hex('#a46a7a') : hex('#6e2e44'));
  const white = hex('#efe9dc');
  const u = H / 88;
  let y = atticBase(P, H, 13 * s, marble('#efe9dc', 6));
  const capH = Math.round(22 * u);
  P.col(capH, y, shaftHW(10 * s, 9.4 * s, 0.02), porphyry);
  P.torus(capH - 2 * u, capH, 10 * s, 9 * s, solid('#d9ab3c'));
  // basket capital: a tapering block covered in pierced lacework
  const top = Math.round(6 * u);
  P.col(top, capH - 2 * u, (t) => 15 * s - 5 * s * t ** 1.3, (th, yy) => {
    const a = frac((th * 6) / Math.PI);
    const b = frac((yy - top) / (3 * u));
    const lace = Math.abs(a - b) < 0.14 || Math.abs(a + b - 1) < 0.14;
    return lace ? shade(white, 0.45) : white;
  });
  // Justinian's monogram in a round medallion
  P.ball(cx, (top + capH) / 2 - 1, 3.4 * s, 3.4 * u, white, { k: 1.1 });
  P.rect(cx - 0.5, (top + capH) / 2 - 3 * u, cx + 0.5, (top + capH) / 2 + 2 * u, tone(white, 0.5));
  P.rect(cx - 2 * s, (top + capH) / 2 - 1, cx + 2 * s, (top + capH) / 2, tone(white, 0.5));
  // the impost block, a second slab carved with a cross
  P.block(0, top, 16 * s, white);
  P.rect(cx - 0.5, 1, cx + 1.5, top - 1, tone(white, 0.55));
  P.rect(cx - 2.5 * s, top / 2 - 1, cx + 2.5 * s, top / 2 + 1, tone(white, 0.55));
};

D.romanesque = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#cdb999');
  const u = H / 88;
  let y = H;
  P.block(y - 7 * u, y, 16 * s, stone);
  y -= Math.round(7 * u);
  P.torus(y - 4 * u, y, 14.5 * s, 13 * s, stone);
  y -= Math.round(4 * u);
  const capH = Math.round(15 * u);
  // a massive round pier cut with zigzags
  P.col(capH, y, 13 * s, stone, {
    bump: (th, yy) => {
      const z = frac(yy / (7 * u) + Math.abs(frac((th * 3) / Math.PI) - 0.5) * 1.6);
      return z < 0.3 ? 0.9 : z < 0.4 ? -0.9 : 0;
    },
  });
  // masonry joints
  for (let yy = y - 8 * u; yy > capH; yy -= 8 * u) P.ring(Math.round(yy), 13 * s, stone, { k: 0.78 });
  // cushion capital: a cube rounded off at the bottom
  P.col(4 * u, capH, (t) => 16 * s - 3 * s * t ** 3, stone, { k: 1 });
  [-1, 1].forEach((d) => {
    for (let yy = Math.round(5 * u); yy < capH; yy++) {
      const t = (yy - 5 * u) / (capH - 5 * u);
      P.set(cx + d * (16 * s * Math.sqrt(1 - t * t)), yy, tone(stone, 0.55));
    }
  });
  P.block(0, 4 * u, 17 * s, stone);
};

// Gothic: a cluster of slender shafts round a core, each with its own ring capital.
D.gothic = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#c8c2b4');
  const u = H / 88;
  let y = H;
  P.block(y - 6 * u, y, 14 * s, stone);
  P.col(y - 9 * u, y - 6 * u, 12 * s, stone);
  y -= Math.round(9 * u);
  const capH = Math.round(12 * u);
  P.col(capH, y, 9 * s, stone, { k: 0.7 });
  const shafts = [[-9, 3], [9, 3], [-4.5, 3.4], [4.5, 3.4], [0, 4]];
  shafts.forEach(([dx, r]) => {
    for (let yy = capH; yy < y; yy++) P.ring(yy, r * s, stone, { k: 1 }, cx + dx * s);
    for (let yy = y - 3 * u; yy < y; yy++) P.ring(yy, (r + 1) * s, stone, { k: 1.05 }, cx + dx * s);
    // a ring halfway up (shaft ring)
    for (let yy = (capH + y) / 2; yy < (capH + y) / 2 + 2 * u; yy++) P.ring(Math.round(yy), (r + 0.8) * s, stone, { k: 1.15 }, cx + dx * s);
  });
  // a leafy capital (crockets) round the cluster
  const ct = Math.round(4 * u);
  P.col(ct, capH, (t) => 14 * s - 3 * s * t, stone, { k: 0.85 });
  for (let i = -3; i <= 3; i++) P.ball(cx + i * 4 * s, capH - 2 * u - (Math.abs(i) % 2) * 2 * u, 2 * s, 2.2 * u, stone, { k: 1.1 });
  P.col(0, ct, (t) => 15 * s - 1 * s * t, stone, { k: 1 });
};

// Nasrid (Alhambra): a slim marble shaft with rings and a tall carved capital.
D.moorish = (P) => {
  const { H, s, cx } = P;
  const white = hex('#f0ebe0');
  const m = marble('#f0ebe0', 13, 0.08);
  const blue = hex('#2a5a8a');
  const green = hex('#2f7a5a');
  const u = H / 88;
  let y = H;
  // a tiled plinth
  P.block(y - 10 * u, y, 12 * s, (x, yy) => ((Math.floor(x / 3) + Math.floor(yy / 3)) % 2 ? blue : green));
  P.block(y - 11 * u, y - 10 * u, 13 * s, white);
  y -= Math.round(11 * u);
  P.torus(y - 3 * u, y, 8 * s, 6.5 * s, m);
  y -= Math.round(3 * u);
  const capBot = Math.round(28 * u);
  P.col(capBot, y, 5.8 * s, m);
  // rings round the neck
  [0, 2, 4].forEach((k) => P.torus(capBot - (k + 1.5) * u, capBot - k * u, 7 * s, 5.8 * s, m));
  // the capital: a cylinder with carved strapwork, then a block with muqarnas cells
  const c0 = capBot - 14 * u;
  P.col(c0, capBot - 6 * u, 7.5 * s, (th, yy) => (frac((th * 4) / Math.PI + (yy - c0) / (4 * u)) < 0.2 ? shade(white, 0.55) : white));
  P.block(4 * u, c0, 12 * s, (x, yy) => {
    const cell = frac((x - cx) / (4 * s) + ((Math.floor((yy - 4 * u) / (3 * u)) % 2) * 0.5));
    const row = frac((yy - 4 * u) / (3 * u));
    return row > 0.7 || cell < 0.15 ? shade(white, 0.6) : row < 0.25 ? mix(white, WHITE, 0.2) : white;
  });
  // a painted band of blue and gold on top
  P.block(0, 4 * u, 14 * s, (x) => (x % 4 < 2 ? blue : GOLD));
};

// Hoysala: soapstone pillar of stacked turned rings and bells, polished dark.
D.hoysala = (P) => {
  const { H, s } = P;
  const stone = hex('#5a5a5e');
  const u = H / 88;
  let y = H;
  P.block(y - 6 * u, y, 15 * s, stone);
  P.block(y - 10 * u, y - 6 * u, 13 * s, stone, { k: 1.05 });
  y -= Math.round(10 * u);
  // a stack of lathe-turned pieces, top to bottom
  const parts = [
    [4, (t) => 15 * s - 0 * t],
    [3, (t) => 9 * s + 4 * s * t],
    [6, (t) => 13 * s * Math.sqrt(1 - (2 * t - 1) ** 2) + 3 * s],
    [2, () => 7 * s],
    [5, (t) => 7 * s + 6 * s * Math.sin(Math.PI * t)],
    [3, () => 8 * s],
    [7, (t) => 9 * s + 5 * s * (1 - Math.abs(2 * t - 1))],
    [3, () => 8 * s],
    [5, (t) => 12 * s - 4 * s * Math.abs(2 * t - 1) ** 2],
    [2, () => 7.5 * s],
    [6, (t) => 7.5 * s + 4.5 * s * t ** 2],
    [4, () => 11 * s],
  ];
  const total = parts.reduce((a, [h]) => a + h, 0);
  let yy = 0;
  const k = y / total;
  parts.forEach(([h, f], i) => {
    const y1 = yy + h * k;
    P.col(yy, y1, f, (th, r) => (i % 3 === 1 && frac((th * 10) / Math.PI) < 0.25 ? shade(stone, 0.65) : stone), { k: 1.25 });
    // a polished glint
    yy = y1;
  });
  // bracket figure plates at the top (the madanika brackets)
  P.block(0, 4 * u, 17 * s, stone, { k: 1.15 });
};

// Mughal: white marble pillar, many-sided, inlaid with flowers in coloured stone.
D.mughal = (P) => {
  const { H, s, cx } = P;
  const white = hex('#f3efe6');
  const red = hex('#b0303a');
  const green = hex('#3a8a4a');
  const u = H / 88;
  let y = H;
  // a lotus base of petals
  P.col(y - 8 * u, y, (t) => 9 * s + 6 * s * t ** 0.8, (th, yy) => {
    const p = frac((th * 8) / Math.PI);
    return p < 0.12 ? shade(white, 0.7) : white;
  });
  y -= Math.round(8 * u);
  const capBot = Math.round(20 * u);
  // a twelve-sided shaft with inlaid flowers
  P.col(capBot, y, 9.5 * s, (th, yy) => {
    const p = frac((th * 6) / Math.PI);
    const flower = Math.floor((yy - capBot) / (9 * u));
    const fy = capBot + (flower + 0.5) * 9 * u;
    const d = Math.hypot((p - 0.5) * 9 * s, yy - fy);
    if (Math.abs(p - 0.5) < 0.08 && yy > fy) return green; // stem
    if (d < 1.6 * s) return red;
    if (d < 2.4 * s && Math.abs(yy - fy) < 1) return green;
    return p < 0.06 ? shade(white, 0.82) : white;
  }, { bump: (th) => (frac((th * 6) / Math.PI) - 0.5) * 0.5 });
  // a cusped capital: lobes swelling out like a bud
  P.col(4 * u, capBot, (t) => 9.5 * s + 4.5 * s * Math.sin(Math.PI * (1 - t)) ** 0.7 + 0.8 * s * Math.sin(t * Math.PI * 5), white);
  // a band of red stone and a white abacus
  P.ring(capBot - 1, 10 * s, red);
  P.block(0, 4 * u, 14 * s, white);
};

D.khmer = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#b0a27e');
  const lichen = hex('#7c7a5a');
  const u = H / 88;
  let y = H;
  P.block(y - 8 * u, y, 15 * s, stone);
  P.block(y - 10 * u, y - 8 * u, 13.5 * s, stone);
  y -= Math.round(10 * u);
  const capH = Math.round(14 * u);
  // a square pillar with a dancer (apsara) carved in a sunken panel
  P.block(capH, y, 11 * s, (x, yy) => (hash(x, yy, 4) > 0.94 ? lichen : stone), { side: 0.2, flatTop: true });
  const py0 = Math.round(capH + 6 * u);
  const py1 = Math.round(y - 3 * u);
  P.rect(cx - 7 * s, py0, cx + 5 * s, py1, tone(stone, 0.58));
  P.rect(cx - 7 * s, py0, cx + 5 * s, py0 + 1, tone(stone, 0.42));
  // the dancer: tall crown, bare arms out, a long skirt, knees bent
  const fx = cx - 1 * s;
  const fh = py1 - py0;
  const at = (k) => py0 + fh * k;
  const lit = tone(stone, 1.18);
  P.rect(fx - 1, at(0.04), fx + 1, at(0.13), lit); // crown
  P.ball(fx, at(0.17), 1.8 * s, 0.05 * fh, stone, { k: 1.15 }); // head
  P.rect(fx - 1.4 * s, at(0.23), fx + 1.4 * s, at(0.46), lit); // body
  P.rect(fx - 4 * s, at(0.27), fx - 1 * s, at(0.3), lit); // arm out, hand up
  P.rect(fx - 4.6 * s, at(0.2), fx - 3.6 * s, at(0.3), lit);
  P.rect(fx + 1 * s, at(0.31), fx + 4 * s, at(0.34), lit); // other arm
  P.rect(fx + 3.4 * s, at(0.31), fx + 4.4 * s, at(0.4), lit);
  P.shape(at(0.46), at(0.86), (yy) => (1.6 + ((yy - at(0.46)) / fh) * 5) * s, tone(stone, 1.05), fx); // skirt
  P.rect(fx - 3.6 * s, at(0.86), fx - 1.6 * s, at(0.95), lit); // feet apart
  P.rect(fx + 1.6 * s, at(0.86), fx + 3.6 * s, at(0.95), lit);
  // lotus capital of stepped mouldings
  for (let i = 0; i < 4; i++) P.block(capH - (i + 1) * 3 * u, capH - i * 3 * u, (11.5 + i * 1.2) * s, stone, { side: 0.18 });
  P.block(0, capH - 12 * u, 16 * s, stone, { side: 0.18 });
};

// China: a red lacquered pillar on a stone drum, with painted dougong brackets.
D.chinese = (P) => {
  const { H, s, cx } = P;
  const red = hex('#b02a22');
  const green = hex('#2f7a5a');
  const blue = hex('#2f4f8a');
  const stone = hex('#c8c2b4');
  const u = H / 88;
  let y = H;
  // a carved stone drum base
  P.torus(y - 7 * u, y, 14.5 * s, 12.5 * s, stone);
  P.block(y - 2 * u, y, 16 * s, stone);
  y -= Math.round(7 * u);
  const capH = Math.round(24 * u);
  P.col(capH, y, 10 * s, red, { k: 1.08 });
  // a gold band with a painted head
  P.col(capH, capH + 4 * u, 10.2 * s, (th) => (frac((th * 5) / Math.PI) < 0.5 ? green : blue));
  P.ring(capH + 4 * u, 10.2 * s, GOLD);
  // dougong: brackets stacking out wider, step by step
  const step = (y0, hw) => {
    P.block(y0, y0 + 3 * u, hw, (x) => (x % 5 === 0 ? GOLD : green), { side: 0.12 });
    P.block(y0 + 3 * u, y0 + 5 * u, hw - 3 * s, blue, { side: 0.12 });
  };
  step(capH - 5 * u, 10 * s);
  step(capH - 10 * u, 13 * s);
  step(capH - 15 * u, 15.5 * s);
  step(capH - 20 * u, 17 * s);
  P.block(0, capH - 20 * u, 17 * s, red, { side: 0.1 });
  // little gold dragon dots along the beam
  for (let x = Math.round(cx - 14 * s); x < cx + 14 * s; x += Math.round(4 * s)) P.set(x, Math.round((capH - 20 * u) / 2), GOLD_L);
};

D.japanese = (P) => {
  const { H, s } = P;
  const red = hex('#d2452a');
  const black = hex('#2a2422');
  const u = H / 88;
  let y = H;
  // a stone footing and a black lacquer sleeve
  P.block(y - 4 * u, y, 14 * s, solid('#9a968f'));
  y -= Math.round(4 * u);
  P.col(y - 8 * u, y, 11 * s, black, { k: 1.3 });
  P.ring(Math.round(y - 8 * u), 11.2 * s, GOLD);
  y -= Math.round(8 * u);
  const capH = Math.round(16 * u);
  P.col(capH, y, 10 * s, red, { k: 1.05 });
  // a tie beam (nuki) and the head beam (kasagi), black on top, curving up at the ends
  P.block(capH - 6 * u, capH - 2 * u, 17 * s, red);
  P.block(capH - 2 * u, capH, 10 * s, solid('#b03a22'));
  P.block(2 * u, capH - 6 * u, 10 * s, red, { k: 0.9 });
  for (let x = 0; x < P.W; x++) {
    const lift = Math.round(((Math.abs(x + 0.5 - P.cx) / (P.W / 2)) ** 3) * 2 * u);
    for (let yy = 0; yy < 3 * u; yy++) P.set(x, yy + 2 * u - lift, tone(black, yy === 0 ? 1.6 : 1.1));
  }
};

// Chichén Itzá: a feathered serpent, its head on the ground, tail up under the roof.
D.maya = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#d8c8a0');
  const red = hex('#a8422e');
  const green = hex('#4f8a62');
  const u = H / 88;
  const headH = Math.round(20 * u);
  const top = Math.round(16 * u);
  // the body: rows of feathers, each row overlapping the one below, tips painted green
  P.col(top, H - headH + 2, 9.5 * s, (th, yy) => {
    const row = Math.floor((yy - top) / (5 * u));
    const p = frac((th * 5) / Math.PI + (row % 2) * 0.5);
    const v = frac((yy - top) / (5 * u));
    const tip = 0.5 + 0.45 * Math.cos((p - 0.5) * Math.PI);
    if (v > tip) return shade(stone, 0.6); // the shadow under each feather
    if (v > tip - 0.25) return row % 2 ? green : mix(stone, green, 0.5);
    return Math.abs(p - 0.5) < 0.06 ? shade(stone, 0.8) : stone; // the quill
  });
  // the great head: plumed brow, deep-set eyes, a curled snout, open jaws with fangs
  const hy = H - headH;
  P.block(hy, H, 16 * s, stone, { side: 0.1 });
  P.block(hy, hy + 4 * u, 16.5 * s, (x) => (Math.floor(x / 3) % 2 ? green : shade(green, 0.72)), { side: 0.1 }); // plumes
  [-1, 1].forEach((d) => {
    const ex = cx + d * 8 * s;
    P.rect(ex - 4 * s, hy + 4 * u, ex + 4 * s, hy + 5.5 * u, tone(stone, 1.2)); // brow ridge
    P.rect(ex - 3 * s, hy + 5.5 * u, ex + 3 * s, hy + 9.5 * u, tone(stone, 0.5)); // eye socket
    P.ball(ex, hy + 7.5 * u, 2 * s, 1.6 * u, hex('#efe6d0'));
    P.rect(ex - 0.5, hy + 6.5 * u, ex + 1, hy + 8.5 * u, hex('#1e1a1a'));
    P.ball(cx + d * 2.5 * s, hy + 10 * u, 1.8 * s, 1.5 * u, stone, { ol: true, k: 1.15 }); // nostril curls
  });
  const my0 = hy + 12.5 * u;
  P.rect(cx - 14 * s, my0, cx + 14 * s, H - 3 * u, tone(red, 0.62)); // the open mouth
  P.rect(cx - 4 * s, my0 + 2.5 * u, cx + 4 * s, H - 3 * u, tone(red, 1.1)); // forked tongue
  P.rect(cx - 0.5, H - 4.5 * u, cx + 0.5, H - 3 * u, tone(red, 0.62));
  [-1, 1].forEach((d) => P.rect(cx + d * 11.5 * s - 1, my0, cx + d * 11.5 * s + 2, my0 + 4 * u, tone(WHITE, 0.95))); // the big fangs
  for (let x = Math.round(cx - 9 * s); x < cx + 9 * s; x += Math.round(3 * s)) P.rect(x, my0, x + 1, my0 + 1.6 * u, tone(WHITE, 0.9));
  P.rect(cx - 15 * s, H - 3 * u, cx + 15 * s, H, tone(stone, 0.85));
  // the rattle tail at the top carrying the lintel
  P.block(0, 5 * u, 16.5 * s, stone);
  for (let i = 0; i < 4; i++) P.block(5 * u + i * 2.75 * u, 5 * u + (i + 1) * 2.75 * u, (12 - i * 0.6) * s, i % 2 ? stone : shade(stone, 0.85), { side: 0.14 });
};

// A Toltec warrior from Tula: feathered crown, butterfly breastplate, spear thrower.
D.atlantean = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#9a8f80');
  const u = H / 88;
  // the figure is built of stacked drums, as the real ones are
  P.block(0, 5 * u, 15 * s, stone);
  // feathered crown
  P.block(5 * u, 12 * u, 11 * s, (x) => (x % 3 === 0 ? shade(stone, 0.7) : stone), { side: 0.12 });
  // face
  P.block(12 * u, 21 * u, 8 * s, stone, { side: 0.12 });
  [-1, 1].forEach((d) => {
    P.rect(cx + d * 3 * s - 1, 15 * u, cx + d * 3 * s + 1, 16 * u, tone(stone, 0.5)); // eyes
    P.block(12 * u, 20 * u, 2 * s, stone, { c: cx + d * 9 * s }); // ear spools
  });
  P.rect(cx - 2 * s, 18.5 * u, cx + 2 * s, 19.5 * u, tone(stone, 0.55));
  // body with the butterfly breastplate
  P.block(21 * u, 46 * u, 12 * s, stone, { side: 0.14 });
  const by = 28 * u;
  [-1, 1].forEach((d) => {
    P.ball(cx + d * 3.5 * s, by, 3.5 * s, 3 * u, stone, { k: 1.1 });
    P.ball(cx + d * 2.5 * s, by + 5 * u, 2.4 * s, 2.4 * u, stone, { k: 1.05 });
  });
  // belt with a disc at the back (seen at the front edge)
  P.block(44 * u, 49 * u, 13 * s, stone);
  P.ball(cx, 46.5 * u, 3 * s, 2.6 * u, stone, { k: 1.15 });
  // arms: one holding the spear thrower
  P.block(23 * u, 44 * u, 2.4 * s, stone, { c: cx - 13.5 * s });
  P.block(23 * u, 44 * u, 2.4 * s, stone, { c: cx + 13.5 * s });
  // a loincloth and legs
  P.block(49 * u, 60 * u, 8 * s, stone, { side: 0.14 });
  P.block(60 * u, H - 6 * u, 4 * s, stone, { c: cx - 6 * s });
  P.block(60 * u, H - 6 * u, 4 * s, stone, { c: cx + 6 * s });
  P.block(H - 6 * u, H, 15 * s, stone);
  // stacked-drum joints
  [21, 49].forEach((j) => P.rect(cx - 12 * s, j * u, cx + 12 * s, j * u + 1, tone(stone, 0.5)));
};

// Yoruba carved veranda post: figures stacked one on another, in dark wood with paint.
D.yoruba = (P) => {
  const { H, s, cx } = P;
  const wood = hex('#7a5232');
  const white = hex('#ece4d4');
  const blue = hex('#2f4f8a');
  const red = hex('#a8402e');
  const u = H / 88;
  P.block(0, 4 * u, 13 * s, wood);
  // top: a crowned king seated, his tall beaded crown painted blue and white
  P.block(4 * u, 9 * u, 4 * s, (x, y) => (y % 2 ? blue : white), { ol: true });
  P.ball(cx, 12.5 * u, 4.4 * s, 4 * u, wood, { ol: true });
  [-1, 1].forEach((d) => P.rect(cx + d * 1.8 * s - 1, 12 * u, cx + d * 1.8 * s + 1, 13 * u, tone(white, 1)));
  P.block(16.5 * u, 26 * u, 6.5 * s, wood, { ol: true, side: 0.2 });
  P.rect(cx - 6.5 * s, 21 * u, cx + 6.5 * s, 22 * u, tone(red, 1)); // sash
  P.block(26 * u, 29 * u, 11 * s, wood, { ol: true }); // his stool
  // middle: a kneeling mother with her child, holding up a bowl
  P.ball(cx, 33.5 * u, 4.4 * s, 4.2 * u, wood, { ol: true });
  P.rect(cx - 3 * s, 29.5 * u, cx + 3 * s, 31 * u, tone(blue, 1)); // her crested hair
  [-1, 1].forEach((d) => P.rect(cx + d * 1.8 * s - 1, 33 * u, cx + d * 1.8 * s + 1, 34 * u, tone(white, 1)));
  P.block(38 * u, 54 * u, 7.5 * s, wood, { ol: true, side: 0.2 });
  P.ball(cx + 7 * s, 44 * u, 2.6 * s, 2.6 * u, wood, { ol: true }); // the baby on her back
  P.ball(cx - 1 * s, 46 * u, 6.5 * s, 2.8 * u, wood, { ol: true, k: 1.15 }); // the bowl
  P.rect(cx - 7 * s, 45 * u, cx + 5 * s, 46 * u, tone(white, 1));
  P.block(54 * u, 58 * u, 10 * s, wood, { ol: true });
  // bottom: the post, carved with triangles painted white and blue
  P.block(58 * u, H - 4 * u, 6.5 * s, (x, yy) => {
    const t = frac((yy - 58 * u) / (5 * u));
    const tri = Math.abs(x + 0.5 - cx) < (1 - t) * 6 * s;
    return tri ? (Math.floor((yy - 58 * u) / (5 * u)) % 2 ? white : blue) : wood;
  }, { ol: true, side: 0.2 });
  P.block(H - 4 * u, H, 12 * s, wood);
};

// Norse stave: a tarred wooden post carved with a ribbon interlace and dragon heads.
D.stave = (P) => {
  const { H, s, cx } = P;
  const wood = hex('#6a4528');
  const u = H / 88;
  P.block(H - 6 * u, H, 14.5 * s, solid('#8a8580'));
  const capH = Math.round(16 * u);
  const w = (th, yy) => {
    const a = Math.sin(th * 2 + yy * 0.22);
    const b = Math.sin(-th * 2 + yy * 0.22 + 1.6);
    const over = Math.sin(yy * 0.11) > 0;
    if (Math.abs(a) < 0.32 && (over || Math.abs(b) >= 0.32)) return 'a';
    if (Math.abs(b) < 0.32) return 'b';
    return null;
  };
  P.col(capH, H - 6 * u, 10.5 * s, (th, yy) => (w(th, yy) ? shade(mix(wood, WHITE, 0.12), 1.1) : shade(wood, 0.62)), {
    bump: (th, yy) => (w(th, yy) ? 0 : 0.3),
  });
  // a cushion capital with two dragon heads snarling out to the sides
  P.col(5 * u, capH, (t) => 10.5 * s + 3.5 * s * (1 - t) ** 2, wood, { k: 1.05 });
  [-1, 1].forEach((d) => {
    const hx = cx + d * 13 * s;
    P.ball(hx, 8 * u, 3.6 * s, 2.6 * u, wood, { ol: true, k: 1.1 });
    P.ball(hx + d * 2.5 * s, 9.5 * u, 2 * s, 1.4 * u, wood, { ol: true });
    P.set(hx, 7.5 * u, hex('#d9ab3c'));
    P.rect(hx - d * 1 * s, 4.5 * u, hx - d * 1 * s + 1, 6 * u, tone(wood, 1.2)); // curled crest
  });
  P.block(0, 5 * u, 16 * s, wood);
};

D.malachite = (P) => {
  const { H, s } = P;
  const green = (th, yy) => {
    const band = Math.sin(th * 2.2 + yy * 0.18 + Math.sin(yy * 0.11 + th * 3) * 2.5) + Math.sin(yy * 0.4 + th * 5) * 0.3;
    return band > 0.55 ? hex('#1f6a4a') : band > 0.1 ? hex('#2f9a6a') : band > -0.5 ? hex('#3fb07a') : hex('#17503a');
  };
  const gold = solid('#d9ab3c');
  const u = H / 88;
  let y = H;
  P.block(y - 6 * u, y, 15 * s, marble('#e8e2d6', 9));
  y -= Math.round(6 * u);
  P.torus(y - 4 * u, y, 13 * s, 10.5 * s, gold);
  y -= Math.round(4 * u);
  P.col(y - 2 * u, y, 10.8 * s, gold, { k: 0.8 });
  y -= Math.round(2 * u);
  const capH = Math.round(24 * u);
  P.col(capH, y, shaftHW(10.5 * s, 9.4 * s, 0.03), green, { k: 1.1 });
  P.torus(capH - 2, capH + 1, 10 * s, 8.6 * s, gold);
  corinthianCap(P, 0, capH, solid('#b98b2a'), GOLD_L);
};

D.deco = (P) => {
  const { H, s, cx } = P;
  const black = hex('#24232a');
  const cream = hex('#e8dcc0');
  const u = H / 88;
  let y = H;
  // stepped base
  [16, 14, 12].forEach((w, i) => {
    P.block(y - 3 * u, y, w * s, i === 1 ? black : cream);
    y -= Math.round(3 * u);
  });
  const capH = Math.round(18 * u);
  // a square fluted shaft in cream with a black core strip
  P.block(capH, y, 10 * s, (x) => {
    const d = Math.abs(x + 0.5 - cx);
    if (d < 2 * s) return black;
    return Math.round(d / (2 * s)) % 2 ? shade(cream, 0.8) : cream;
  }, { side: 0.12, flatTop: true });
  // gold chevrons stepping up into a sunburst capital
  for (let i = 0; i < 4; i++) {
    const yy = capH - i * 3 * u;
    P.block(yy - 3 * u, yy, (11 + i * 1.6) * s, i % 2 ? black : GOLD);
  }
  for (let yy = 0; yy < capH - 12 * u; yy++)
    for (let x = 0; x < P.W; x++) {
      const a = Math.atan2(x + 0.5 - cx, capH - 12 * u - yy + 4);
      if (Math.abs(x + 0.5 - cx) > 16.5 * s) continue;
      P.set(x, yy, frac(a * 2.6) < 0.5 ? GOLD : black);
    }
  P.block(0, 2 * u, 17 * s, GOLD);
};

// Qufu: a stone pillar with a golden dragon coiling up it among clouds.
D.dragon = (P) => {
  const { H, s, cx } = P;
  const stone = hex('#d8d2c4');
  const gold = hex('#d9a83a');
  const belly = hex('#f0d890');
  const red = hex('#b02a22');
  const u = H / 88;
  let y = H;
  P.block(y - 3 * u, y, 16 * s, stone);
  P.torus(y - 8 * u, y - 3 * u, 14 * s, 12 * s, (th) => (frac((th * 6) / Math.PI) < 0.5 ? stone : shade(stone, 0.85)));
  y -= Math.round(8 * u);
  const capH = Math.round(12 * u);
  const top = capH;
  const period = 30 * u;
  const hw = 10.5 * s;
  const thick = 1.25;
  // how far (as an angle) this point is from the middle of the dragon's body, which winds up the pillar
  const body = (th, yy) => {
    const d = th + ((yy - top) / period) * 2 * Math.PI;
    return ((d % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI) - Math.PI;
  };
  P.col(top, y, hw, (th, yy) => {
    const d = body(th, yy);
    if (Math.abs(d) < thick) {
      const v = d / thick; // -1 .. 1 across the body
      if (Math.abs(v) > 0.86) return shade(gold, 0.42); // outline
      if (v > 0.4) return frac(yy / (1.6 * u)) < 0.3 ? shade(belly, 0.8) : belly; // belly plates
      return frac(yy / (2 * u) + v * 1.5 + th) < 0.5 ? gold : shade(gold, 0.8); // scales
    }
    // the spines along its back
    if (d < -thick && d > -thick - 0.35 && frac(yy / (2.5 * u) + th) < 0.4) return shade(red, 0.9);
    // clouds carved round it
    const c = Math.sin(th * 3 + yy * 0.3) + Math.sin(yy * 0.17 - th * 2);
    return c > 1.25 ? mix(stone, WHITE, 0.45) : c > 1.05 ? shade(stone, 0.75) : stone;
  }, { bump: (th, yy) => (Math.abs(body(th, yy)) < thick ? -body(th, yy) * 0.5 : 0) });
  // the head at the top, horns back, whiskers flying, a pearl before it
  const hx = cx - 4 * s;
  const hy = top + 6 * u;
  P.ball(hx + 2 * s, hy, 6 * s, 4.6 * u, gold, { ol: true });
  P.ball(hx - 4 * s, hy + 1.5 * u, 4 * s, 2.8 * u, gold, { ol: true, k: 1.1 }); // snout
  P.rect(hx - 8 * s, hy + 3 * u, hx - 1 * s, hy + 4.4 * u, tone(red, 1)); // open jaw
  for (let x = Math.round(hx - 7 * s); x < hx - 1 * s; x += 2) P.set(x, hy + 3 * u, tone(WHITE, 0.95)); // teeth
  P.ball(hx + 0.5 * s, hy - 1 * u, 1.3 * s, 1.2 * u, hex('#f4f0e8'));
  P.set(hx + 0.5 * s, hy - 1 * u, hex('#1e1a1a'));
  [[3, -5], [5.5, -4]].forEach(([dx, dy]) => P.rect(hx + dx * s, hy + dy * u, hx + dx * s + 2, hy + (dy + 3) * u, tone(belly, 1.1))); // horns
  for (let i = 0; i < 7; i++) P.set(hx - 8 * s - i * 0.8, hy + 1 * u + Math.sin(i * 0.9) * 1.5 * u, tone(belly, 1.1)); // whisker
  P.ball(cx + 9 * s, hy + 3 * u, 2.6 * s, 2.6 * u, hex('#f4f0e8'), { ol: true, k: 1.2 }); // the pearl
  // a painted beam head on top
  P.block(capH - 4 * u, capH, 12 * s, (x) => (Math.floor(x / 3) % 2 ? hex('#2f7a5a') : hex('#2f4f8a')));
  P.block(0, capH - 4 * u, 16.5 * s, red, { side: 0.1 });
  P.rect(cx - 15 * s, 2 * u, cx + 15 * s, 3 * u, GOLD);
};

// Ashoka's pillar: a polished sandstone shaft, a lotus bell and four lions back to back.
D.ashoka = (P) => {
  const { H, s, cx } = P;
  const sand = hex('#e2cfa6');
  const u = H / 88;
  let y = H;
  P.block(y - 4 * u, y, 13 * s, solid('#b8a684'));
  y -= Math.round(4 * u);
  const capBot = Math.round(38 * u);
  // the shaft, polished so it shines like metal
  P.col(capBot, y, shaftHW(9 * s, 7.6 * s, 0.01), (th) => (th > -0.8 && th < -0.5 ? mix(sand, WHITE, 0.55) : sand), { k: 1.05 });
  // an upside-down lotus bell, ribbed with petals
  const bellTop = capBot - 10 * u;
  P.col(bellTop, capBot, (t) => 7 * s + 4.5 * s * Math.sin(Math.PI * (0.25 + t * 0.6)), (th) => (frac((th * 7) / Math.PI) < 0.2 ? shade(sand, 0.68) : sand));
  // the round abacus carved with a wheel between walking animals
  const ab0 = bellTop - 6 * u;
  P.col(ab0, bellTop, 12.5 * s, sand, { k: 1.02 });
  const wy = (ab0 + bellTop) / 2;
  P.ball(cx, wy, 2.6 * s, 2.6 * u, sand, { ol: true });
  for (let i = 0; i < 8; i++) P.set(cx + Math.cos((i * Math.PI) / 4) * 1.8 * s, wy + Math.sin((i * Math.PI) / 4) * 1.8 * u, tone(sand, 0.5));
  [-1, 1].forEach((d) => {
    const ax = cx + d * 7 * s;
    P.rect(ax - 2, wy - 1, ax + 2, wy + 1, tone(sand, 0.6)); // a bull or a horse walking round
    P.set(ax - 2, wy + 1, tone(sand, 0.6));
    P.set(ax + 1, wy + 1, tone(sand, 0.6));
    P.set(ax + d * 2, wy - 2, tone(sand, 0.6));
  });
  P.ring(Math.round(ab0), 12.8 * s, sand, { k: 1.2 });
  // four lions seated back to back: one each side in profile, one facing you
  const ly = ab0;
  const mane = (x, yy, dx, dy) => (dx * dx + dy * dy > 0.45 && Math.round((Math.atan2(dy, dx) + 4) * 3) % 2 ? shade(sand, 0.78) : sand);
  [-1, 1].forEach((d) => {
    const mx = cx + d * 9.5 * s;
    P.rect(mx + d * 2 * s - 1, ly - 5 * u, mx + d * 2 * s + 2, ly, tone(sand, d < 0 ? 1.05 : 0.8)); // foreleg
    P.ball(mx, ly - 10 * u, 5.5 * s, 6 * u, mane, { ol: true });
    P.ball(mx + d * 4.5 * s, ly - 9.5 * u, 2.8 * s, 2.6 * u, sand, { ol: true, k: 1.08 }); // muzzle
    P.rect(mx + d * 4 * s, ly - 8.2 * u, mx + d * 7 * s, ly - 7.6 * u, tone(sand, 0.42)); // open mouth, roaring
    P.set(mx + d * 2.6 * s, ly - 11.5 * u, hex('#3a2a1a'));
  });
  // the one facing you, in front of the others
  [-1, 1].forEach((d) => P.rect(cx + d * 2.6 * s - 1, ly - 5 * u, cx + d * 2.6 * s + 2, ly, tone(sand, d < 0 ? 1.1 : 0.85)));
  P.ball(cx, ly - 11 * u, 7 * s, 7.5 * u, mane, { ol: true });
  P.ball(cx, ly - 10 * u, 3.8 * s, 4 * u, sand, { ol: true, k: 1.12 });
  [-1, 1].forEach((d) => P.set(cx + d * 1.6 * s, ly - 11.5 * u, hex('#3a2a1a')));
  P.rect(cx - 1.8 * s, ly - 8 * u, cx + 1.8 * s, ly - 7.2 * u, tone(sand, 0.4));
  // a flat slab on top for the roof (the great wheel it once carried is lost)
  P.block(0, 2 * u, 15 * s, sand);
};

// Haida house post: carved red cedar, painted in black and red formline with blue-green.
D.haida = (P) => {
  const { H, s, cx } = P;
  const cedar = hex('#a8643e');
  const black = hex('#1e1a1a');
  const red = hex('#b8302a');
  const teal = hex('#3a8a86');
  const cream = hex('#ece2cc');
  const u = H / 88;
  P.block(0, 4 * u, 14 * s, cedar);
  // the post itself: round, the figures carved into its face
  P.col(4 * u, H, 12 * s, cedar, { k: 1.05 });
  // an ovoid eye: black outline, cream inside, a black pupil
  const eye = (ex, ey, rx, ry) => {
    P.ball(ex, ey, rx, ry, black, { k: 1.4 });
    P.ball(ex, ey, rx - 1, ry - 1, cream, { k: 1.1 });
    P.ball(ex + 0.5, ey, Math.max(0.8, rx * 0.45), Math.max(0.8, ry * 0.5), black, { k: 1.5 });
  };
  // top: a watchman in a potlatch hat of stacked rings
  for (let i = 0; i < 4; i++) P.col(4 * u + i * 2 * u, 6 * u + i * 2 * u, (4.5 + i * 0.6) * s, i % 2 ? black : cedar, { k: 1.1 });
  P.ball(cx, 17 * u, 7 * s, 5.5 * u, cedar, { ol: true, k: 1.08 }); // face
  [-1, 1].forEach((d) => eye(cx + d * 3 * s, 16.5 * u, 2.2 * s, 1.6 * u));
  P.rect(cx - 2.5 * s, 20 * u, cx + 2.5 * s, 21 * u, red);
  // the raven, wings folded, a long beak curving down
  const ry0 = 24 * u;
  P.block(ry0, ry0 + 20 * u, 10 * s, cedar, { ol: true, side: 0.12 });
  [-1, 1].forEach((d) => {
    eye(cx + d * 4 * s, ry0 + 4 * u, 2.6 * s, 1.8 * u);
    // the wing: a red U-form and a black ovoid
    P.rect(cx + d * 10 * s - (d > 0 ? 3 * s : 0), ry0 + 8 * u, cx + d * 10 * s + (d < 0 ? 3 * s : 0), ry0 + 18 * u, red);
    P.ball(cx + d * 8.5 * s, ry0 + 12 * u, 1.8 * s, 3 * u, black, { k: 1.4 });
  });
  P.block(ry0 + 6 * u, ry0 + 14 * u, 2 * s, black, { k: 1.5 }); // the beak
  P.rect(cx - 1, ry0 + 14 * u, cx + 1, ry0 + 16 * u, tone(black, 1.4));
  // bottom: a great bear, holding its paws up, teeth bared
  const by = 48 * u;
  P.block(by, H - 3 * u, 12 * s, cedar, { ol: true, side: 0.12 });
  [-1, 1].forEach((d) => {
    P.ball(cx + d * 8 * s, by + 1.5 * u, 2.4 * s, 2 * u, cedar, { ol: true }); // ears
    eye(cx + d * 4.5 * s, by + 7 * u, 3 * s, 2.2 * u);
    P.rect(cx + d * 8 * s - 2 * s, by + 4 * u, cx + d * 8 * s + 2 * s, by + 5 * u, black); // brows
    P.block(by + 20 * u, by + 28 * u, 2.6 * s, teal, { c: cx + d * 8 * s, ol: true }); // paws
  });
  P.ball(cx, by + 12 * u, 3 * s, 2.2 * u, black, { k: 1.4 }); // nose
  P.rect(cx - 8 * s, by + 16 * u, cx + 8 * s, by + 19 * u, red); // mouth
  for (let x = Math.round(cx - 7 * s); x < cx + 7 * s; x += 2) P.set(x, by + 16 * u, cream); // teeth
  P.block(H - 3 * u, H, 14 * s, solid('#8a8580'));
};

// RGBA pixels for column `id`, W px wide and H px tall.
export function paintColumn(id, W, H) {
  const P = painter(W, H);
  (D[id] || D[DEFAULT_COLUMN])(P);
  outline(P);
  return P.px;
}

// The same, on a fresh canvas (browser only).
export function columnCanvas(id, W, H) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(W, H);
  img.data.set(paintColumn(id, W, H));
  ctx.putImageData(img, 0, 0);
  return c;
}
