// Cliff kits: rock cliffs whose ground is see-through, so they sit on whatever
// terrain is painted under them (sand, grass, snow) instead of always grass.
// Each kit has every piece of a raised plateau, seen from the front:
//
//   back left   back   back right        the far rim (walls you can't walk off)
//   side left          side right
//   front left  front  front right       the lip you stand on
//   face left   face   face right        the rock wall; stack it for taller cliffs
//   foot left   foot   foot right        where it meets the ground, with its shadow
//
// plus inner corners for L-shaped and stepped plateaus, and stairs (top, middle
// pieces that stack, foot). Light comes from the upper left like the rest of the
// island. The rock repeats every tile in both directions, so faces stack and run
// side by side with no seam.

const KITS = [
  { id: 'gcliff', group: 'Dark grey cliffs', name: 'Grey', seed: 900, texture: 'columns', cuts: [0, 9, 14, 23, 27], out: '#181a1e', pal: ['#222429', '#33373d', '#454a51', '#585e66', '#757c85', '#99a0a8'] },
  { id: 'bcliff', group: 'Brown cliffs (any ground)', name: 'Brown', seed: 940, texture: 'layers', cuts: [0, 7, 16, 22], out: '#20201a', pal: ['#33241a', '#4a3424', '#644830', '#80603e', '#9c7a52', '#ba9a6c'] },
];
export const CLIFF_GROUPS = KITS.map((k) => k.group);

export function addCliffKits(add, { pixels, tnoise, hash, hex, T }) {
  const SHADOW = [0, 130, 100, 72, 46, 24]; // foot shadow by row below the rock (alpha)
  KITS.forEach((kit) => {
    const P = kit.pal.map(hex);
    const OUTC = hex(kit.out);
    const s = kit.seed;
    const shade = (a) => [0, 0, 0, a];

    // the rock. Grey: tall jointed columns (like basalt), lit on the left, shaded on
    // the right, broken by ledges. Brown: layers (like the first brown cliffs).
    // Edges wobble and nothing lines up in a grid; it repeats every tile in both
    // directions, so faces stack and run side by side with no seam.
    const jit = (v, k, n) => Math.min(n - 1, Math.floor(tnoise(v, 0, 4, s + k) * n));
    const tone = new Int8Array(T * T);
    const along = kit.texture === 'columns'; // columns run down, layers run across
    const cuts = kit.cuts; // where the joints are, across the run
    for (let a = 0; a < T; a++)
      for (let q = 0; q < T; q++) {
        // q runs across the joints, a along them (x and y for columns, y and x for layers)
        const ws = cuts.map((c, k) => c + jit(a, 50 + k, 3) - 1);
        let k = ws.length - 1;
        for (let i = 0; i < ws.length; i++) if (ws[i] <= q) k = i;
        const start = ws[k] <= q ? ws[k] : ws[k] - T;
        const end = k + 1 < ws.length ? ws[k + 1] : ws[0] + T;
        const u = q - start; // 0 at the lit side of the block
        const w = end - start;
        // each column / layer is broken into blocks at two places along it
        const br = [0, 1].map((j) => Math.floor(hash(k, j, s + 60) * T)).filter((_, j) => along || (j === 0 && hash(k, 9, s + 63) > 0.4)); // layers break rarely
        const seg = br.filter((b) => a >= b).length % 2;
        const joint = hash(k, seg, s + 61) > 0.45; // an open crack on this block's shadow side
        let t = hash(k, seg, s + 62) > 0.5 ? 3 : 2;
        if (br.includes(a)) t = 0; // the break
        else if (br.includes((a + T - 1) % T)) t = 4; // the lit edge just past it
        else if (u === 0) t = along ? 4 : 5;
        else if (u === 1 && !along) t = 4;
        else if (u === w - 1) t = joint ? 0 : 1;
        else if (u === w - 2) t = Math.min(t, 2);
        else if (hash(q, a, s + 3) < 0.08) t = Math.max(1, t - 1); // grit
        else if (hash(q, a, s + 4) < 0.04) t = Math.min(4, t + 1);
        const [x, y] = along ? [q, a] : [a, q];
        tone[y * T + x] = t;
      }
    const rock = (x, y, bias = 0) => P[Math.max(0, Math.min(5, tone[y * T + x] + (tone[y * T + x] ? bias : 0)))];

    // the outline of the plateau wobbles a little, the same way on every piece,
    // so pieces always meet (each wobble repeats every tile)
    const eL = (y) => 1 + jit(y, 11, 3); // left edge, 1..3 px in
    const eR = (y) => 1 + jit(y, 12, 3); // right edge
    const bk = (x) => 1 + jit(x, 13, 2); // back edge
    const lip = (x) => 21 + jit(x, 14, 3); // the front lip line
    const foot = (x) => 26 + jit(x, 15, 2); // the bottom of the rock
    // the rims: a band of bare rock along each open edge (5-6 px, wobbling), its
    // outline outside and a dark line where it meets the ground inside
    const wL = (y) => 6 + jit(y, 16, 2);
    const wR = (y) => 6 + jit(y, 17, 2);
    const wB = (x) => 5 + jit(x, 18, 2);
    // (the rim is the cliff's sunlit top edge: lighter than the face, darker where it dips to the ground)
    const rimL = (x, y, d) => (d === 0 ? OUTC : d === wL(y) - 1 ? P[1] : d === 1 ? P[3] : d === 2 ? P[5] : rock(x, y, 2));
    const rimR = (x, y, d) => (d === 0 ? OUTC : d === wR(y) - 1 ? P[1] : d === 1 ? P[2] : d === 2 ? P[4] : rock(x, y, 1));
    const rimB = (x, y, d) => (d === 0 ? OUTC : d === wB(x) - 1 ? P[1] : d === 1 ? P[3] : d === 2 ? P[5] : rock(x, y, 2));
    const RIM_L = { w: (x, y) => wL(y), c: rimL };
    const RIM_R = { w: (x, y) => wR(y), c: rimR };
    const RIM_B = { w: (x) => wB(x), c: rimB };
    const dL = (x, y) => x - eL(y);
    const dR = (x, y) => T - 1 - x - eR(y);
    const dB = (x, y) => y - bk(x);

    // the rock wall, with its ends; null = the ground shows
    const wall = (x, y, o, bias = 0) => {
      if (o.l) {
        const d = dL(x, y);
        if (d < 0) return null;
        if (d === 0) return OUTC;
        if (d === 1) return P[4];
      }
      if (o.r) {
        const d = dR(x, y);
        if (d < -3) return null;
        if (d < 0) return shade(56); // the cliff's shadow falls to the right
        if (d === 0) return OUTC;
        if (d === 1) return P[1];
      }
      return rock(x, y, bias);
    };
    // the lip: ground above, the lit top of the wall below
    const front = (x, y, o) => {
      const L = lip(x);
      const edge = (o.l && dL(x, y) < 3) || (o.r && dR(x, y) < 3);
      if (y === L && !edge) return o.l && dL(x, y) < 0 ? null : o.r && dR(x, y) < 0 ? wall(x, y, o) : OUTC;
      if (y === L + 1 && !edge) return P[5];
      if (y === L + 2 && !edge) return P[4];
      return wall(x, y, o, y < L + 5 ? 1 : 0);
    };
    // the foot: the wall, its bottom outline, then its shadow on the ground
    const base = (x, y, o) => {
      const F = foot(x);
      if (y < F) return wall(x, y, o, y >= F - 3 ? -1 : 0);
      const inside = (!o.l || dL(x, y) >= 0) && (!o.r || dR(x, y) >= 0);
      if (!inside) return o.r && dR(x, y) >= -3 && dR(x, y) < 0 ? shade(40) : null;
      if (y === F) return OUTC;
      return SHADOW[y - F] ? shade(SHADOW[y - F]) : null;
    };
    // the top: plain ground with a rim along each open side (convex corners
    // take the nearer rim; inner corners wrap the rim round one notch)
    const top = (o) => (x, y) => {
      if (o.lip && y >= lip(x)) return front(x, y, o);
      const rims = [];
      if (o.l) rims.push([dL(x, y), RIM_L]);
      if (o.r) rims.push([dR(x, y), RIM_R]);
      if (o.b) rims.push([dB(x, y), RIM_B]);
      if (o.notch) {
        // inner corner: the low ground is only the notch where both rims meet
        const [dx, rx] = o.notch === 'nw' ? [dL(x, y), RIM_L] : [dR(x, y), RIM_R];
        const dy = dB(x, y);
        if (dx < 0 && dy < 0) return null;
        const [d, rim] = dy < 0 ? [dx, rx] : dx < 0 ? [dy, RIM_B] : dx >= dy ? [dx, rx] : [dy, RIM_B];
        return d < rim.w(x, y) ? rim.c(x, y, d) : null;
      }
      if (!rims.length) return null;
      if (rims.some(([d]) => d < 0)) return null;
      // the rim whose band this pixel is in (the nearer edge wins)
      const hit = rims.filter(([d, rim]) => d < rim.w(x, y)).sort((a, b) => a[0] - b[0])[0];
      return hit ? hit[1].c(x, y, hit[0]) : null;
    };
    // inner front corners: a lip set back on one side, the side rim of the part
    // that comes forward on the other (side 'r': the setback lip is to the right)
    const innerFront = (side, part) => (x, y) => {
      const d = side === 'r' ? dR(x, y) : dL(x, y);
      const rim = side === 'r' ? RIM_R : RIM_L;
      if (part === 'top' && y < lip(x)) return null;
      if (d < 0) return part === 'top' ? front(x, y, {}) : part === 'face' ? wall(x, y, {}) : base(x, y, {});
      return d < rim.w(x, y) ? rim.c(x, y, d) : null;
    };
    // stairs cut into the wall: treads lit, risers dark, a step every 8 px
    const STEP = [OUTC, P[5], P[4], P[4], P[2], P[2], P[2], P[1]];
    const lipTop = top({ lip: true });
    const stairs = (part) => (x, y) => {
      const inStairs = x >= 7 && x <= 24;
      const cheek = x === 6 || x === 25;
      if (part === 'top') {
        // the first step nose at y 24, so the steps run on into the piece below
        if (y < lip(x) || !(inStairs || cheek)) return lipTop(x, y);
        return cheek ? OUTC : y < 24 ? null : STEP[(y - 24) % 8];
      }
      if (part === 'foot') {
        if (inStairs) return y <= 24 ? STEP[y % 8] : null; // the last step ends on the ground
        if (cheek) return y <= foot(x) ? OUTC : null;
        return base(x, y, {});
      }
      if (inStairs) return STEP[y % 8];
      return cheek ? OUTC : rock(x, y);
    };

    const pieces = [
      ['back_l', 'Back left', top({ b: true, l: true }), 'block'],
      ['back', 'Back', top({ b: true }), 'block'],
      ['back_r', 'Back right', top({ b: true, r: true }), 'block'],
      ['side_l', 'Side left', top({ l: true }), 'block'],
      ['side_r', 'Side right', top({ r: true }), 'block'],
      ['top_l', 'Front left', top({ lip: true, l: true }), 'block'],
      ['top', 'Front edge', top({ lip: true }), 'walk'],
      ['top_r', 'Front right', top({ lip: true, r: true }), 'block'],
      ['face_l', 'Face left', (x, y) => wall(x, y, { l: true }), 'block'],
      ['face', 'Face (stacks)', (x, y) => wall(x, y, {}), 'block'],
      ['face_r', 'Face right', (x, y) => wall(x, y, { r: true }), 'block'],
      ['base_l', 'Foot left', (x, y) => base(x, y, { l: true }), 'block'],
      ['base', 'Foot', (x, y) => base(x, y, {}), 'block'],
      ['base_r', 'Foot right', (x, y) => base(x, y, { r: true }), 'block'],
      ['in_back_l', 'Inner back left', top({ notch: 'nw' }), 'block'],
      ['in_back_r', 'Inner back right', top({ notch: 'ne' }), 'block'],
      ['in_front_l', 'Inner front left', innerFront('l', 'top'), 'walk'],
      ['in_front_r', 'Inner front right', innerFront('r', 'top'), 'walk'],
      ['in_face_l', 'Inner face left', innerFront('l', 'face'), 'block'],
      ['in_face_r', 'Inner face right', innerFront('r', 'face'), 'block'],
      ['in_base_l', 'Inner foot left', innerFront('l', 'base'), 'block'],
      ['in_base_r', 'Inner foot right', innerFront('r', 'base'), 'block'],
      ['stairs_top', 'Stairs top', stairs('top'), 'walk'],
      ['stairs', 'Stairs (stack)', stairs('mid'), 'walk'],
      ['stairs_foot', 'Stairs foot', stairs('foot'), 'walk'],
    ];
    pieces.forEach(([name, label, fn, walk]) => add(`${kit.id}_${name}`, pixels(T, T, fn), { group: kit.group, label, walk }));

    // loose boulders of the same rock, for the foot of the cliffs and the beach
    const boulder = (w, h, cx, cy, rx, ry, k) => {
      const facets = 7;
      const radius = (a) => {
        const f = ((a / (2 * Math.PI)) * facets + facets) % facets;
        const i = Math.floor(f);
        const r0 = 0.86 + hash(i, k, s) * 0.18;
        const r1 = 0.86 + hash((i + 1) % facets, k, s) * 0.18;
        return r0 + (r1 - r0) * (f - i);
      };
      const inside = (x, y) => {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        return Math.hypot(nx, ny) <= radius(Math.atan2(ny, nx));
      };
      return pixels(w, h, (x, y) => {
        if (!inside(x, y)) {
          const sx = (x + 0.5 - cx - rx * 0.15) / (rx * 1.05);
          const sy = (y + 0.5 - cy - ry * 0.75) / (ry * 0.35);
          return sx * sx + sy * sy <= 1 && y > cy ? shade(70) : null;
        }
        if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) return OUTC;
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        const a = Math.atan2(ny, nx);
        const facet = Math.floor(((a / (2 * Math.PI)) * facets + facets) % facets);
        const fa = ((facet + 0.5) / facets) * 2 * Math.PI;
        const lit = -(Math.cos(fa) + Math.sin(fa)) * 0.7 * Math.min(1, Math.hypot(nx, ny) * 1.6); // light from the upper left
        let t = 3 + Math.round(lit * 1.6) - (ny > 0.45 ? 1 : 0);
        if (hash(x, y, s + 70) < 0.06) t -= 1; // grit
        return P[Math.max(1, Math.min(5, t))];
      });
    };
    add(`${kit.id}_boulder_s`, boulder(T, T, 16, 20, 8, 6, 1), { group: 'Rocks', label: `${kit.name} stone`, walk: 'block' });
    add(`${kit.id}_boulder_m`, boulder(T, T, 16, 18, 13, 10, 2), { group: 'Rocks', label: `${kit.name} boulder`, walk: 'block' });
    add(`${kit.id}_boulder_l`, boulder(2 * T, 2 * T, 32, 36, 27, 21, 3), { group: 'Rocks', label: `${kit.name} boulder (2×2)`, w: 2 * T, h: 2 * T, walk: 'block' });
  });
}
