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
  // inside caves (the walls and steps that make a cave a maze, like in Pokémon), with free-standing rock walls
  { id: 'cwall', group: 'Cave walls (brown)', name: 'Cave', seed: 980, texture: 'layers', cuts: [0, 6, 13, 19, 26], out: '#1a120c', pal: ['#2e1d14', '#4a2e1e', '#6a4228', '#8a5a34', '#a87444', '#c69460'], ridges: true },
  { id: 'dwall', group: 'Cave walls (dark)', name: 'Dark cave', seed: 1020, texture: 'columns', cuts: [0, 8, 15, 24], out: '#0e0d12', pal: ['#1c1a24', '#2a2734', '#3b3747', '#4f4a5c', '#686276', '#8a8498'], ridges: true },
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
    const HIGH = [-1]; // (a piece's pixel on top of the ledge)
    const rock = (x, y, bias = 0) => P[Math.max(0, Math.min(5, tone[y * T + x] + (tone[y * T + x] ? bias : 0)))];
    // inside a cave the ground is always the cave's own floor: dusty, with pebbles and cracks. Its
    // pieces sit on it (a gap shows the floor, a shadow darkens it), so walls and floor always match.
    const FLOOR = [P[2], P[3], P[3], P[3]]; // (a step darker than the tops of the walls, so they stand up off it)
    const floorPx = (x, y) => {
      const n = tnoise(x, y, 8, s + 95) * 0.7 + tnoise(x, y, 4, s + 96) * 0.3;
      let c = FLOOR[Math.min(3, Math.floor(n * 4))];
      const crack = Math.abs(tnoise(x, y, 16, s + 97) - 0.5);
      if (crack < 0.018) c = P[1];
      else if (hash(Math.floor(x / 3), Math.floor(y / 3), s + 98) > 0.95 && (x % 3) + (y % 3) < 2) c = (x % 3) === 0 ? P[4] : P[1]; // pebbles
      return c;
    };
    // the top of a raised ledge (HIGH, from the pieces below): see-through on an island's cliffs, but in a
    // cave it's its own upper floor, smoother and lighter than the floor below, so the levels read apart
    const highPx = (x, y) => {
      const h = hash(x >> 1, y >> 1, s + 99);
      return h > 0.95 ? P[5] : h < 0.04 ? P[3] : P[4];
    };
    const onFloor = (fn) =>
      !kit.ridges
        ? (x, y) => {
            const c = fn(x, y);
            return c === HIGH ? null : c;
          }
        : (x, y) => {
            const c = fn(x, y);
            if (c === HIGH) return highPx(x, y);
            if (!c) return floorPx(x, y);
            if (c[3] === 255 || c[3] === undefined) return c;
            const f = floorPx(x, y);
            const k = 1 - c[3] / 255;
            return [Math.round(f[0] * k), Math.round(f[1] * k), Math.round(f[2] * k), 255];
          };

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
    // in a cave the rim is a row of round rocks along the edge instead (like the ledges in Pokémon caves):
    // `a` runs along the edge, `d` in from it; (sx, sy) turn those into screen directions for the light
    const bead = (a, d, sx, sy) => {
      const da = a - (Math.floor(a / 8) * 8 + 4) + 0.5;
      const dd = d - 4.5;
      const r = Math.hypot(da / 1.05, dd);
      if (r > 4.6) return d < 4 ? null : HIGH; // between the rocks: the ground dips to the floor below
      if (r > 3.7) return OUTC;
      const lit = da * sy + dd * sx; // (light from the upper left)
      return lit < -1.2 ? P[5] : lit > 1.6 ? P[1] : r < 1.6 && lit < 0 ? P[4] : P[3];
    };
    const caveRimL = (x, y, d) => bead(y, d, -1, -1);
    const caveRimR = (x, y, d) => bead(y, d, 1, -1);
    const caveRimB = (x, y, d) => bead(x, d, -1, -1);
    const RIM_L = kit.ridges ? { w: () => 10, c: caveRimL } : { w: (x, y) => wL(y), c: rimL }; // (the cave's rocks need a wider band)
    const RIM_R = kit.ridges ? { w: () => 10, c: caveRimR } : { w: (x, y) => wR(y), c: rimR };
    const RIM_B = kit.ridges ? { w: () => 10, c: caveRimB } : { w: (x) => wB(x), c: rimB };
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
        return d < rim.w(x, y) ? rim.c(x, y, d) : HIGH;
      }
      if (!rims.length) return HIGH;
      if (rims.some(([d]) => d < 0)) return null;
      // the rim whose band this pixel is in (the nearer edge wins)
      const hit = rims.filter(([d, rim]) => d < rim.w(x, y)).sort((a, b) => a[0] - b[0])[0];
      return hit ? hit[1].c(x, y, hit[0]) : HIGH;
    };
    // inner front corners: a lip set back on one side, the side rim of the part
    // that comes forward on the other (side 'r': the setback lip is to the right)
    const innerFront = (side, part) => (x, y) => {
      const d = side === 'r' ? dR(x, y) : dL(x, y);
      const rim = side === 'r' ? RIM_R : RIM_L;
      if (part === 'top' && y < lip(x)) return HIGH;
      if (d < 0) return part === 'top' ? front(x, y, {}) : part === 'face' ? wall(x, y, {}) : base(x, y, {});
      return d < rim.w(x, y) ? rim.c(x, y, d) : HIGH;
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
        return cheek ? OUTC : y < 24 ? HIGH : STEP[(y - 24) % 8];
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
    pieces.forEach(([name, label, fn, walk]) => add(`${kit.id}_${name}`, pixels(T, T, onFloor(fn)), { group: kit.group, label, walk }));

    // free-standing rock walls, one tile thick: the maze walls inside a cave. Each piece says which
    // sides it joins (north, east, south, west); a run ends in a rounded end, and wherever the wall
    // stops going south its rock face shows, with a shadow at its foot.
    if (kit.ridges) {
      const X0 = 5; // the wall's sides, inside its tile
      const X1 = 26;
      const Y0 = 4; // its back edge when nothing joins to the north
      const LIP = 15; // where the top ends and the face begins (when nothing joins to the south)
      const FOOT = 26; // the bottom of the face
      const ridge = (c) => {
        // is (x, y) on the wall's top (1), its face (2), or neither (0)?
        const part = (x, y) => {
          if (x < 0 || y < 0 || x >= T || y >= T) {
            // past the tile: whatever the next piece has there
            if (x < 0) return c.w && y >= Y0 && y <= FOOT ? (y < LIP ? 1 : 2) : 0;
            if (x >= T) return c.e && y >= Y0 && y <= FOOT ? (y < LIP ? 1 : 2) : 0;
            if (y < 0) return c.n && x >= X0 && x <= X1 ? 1 : 0;
            return c.s && x >= X0 && x <= X1 ? 1 : 0;
          }
          const mid = x >= X0 && x <= X1;
          if (mid && y < Y0) return c.n ? 1 : 0;
          if (mid && c.s) return 1; // the wall carries on south: all top
          const arm = (x < X0 && c.w) || (x > X1 && c.e);
          if (!mid && !arm) return 0;
          if (y < Y0) return 0;
          if (y < LIP) return 1;
          if (y <= FOOT) return 2;
          return 0;
        };
        return (x, y) => {
          const k = part(x, y);
          if (!k) {
            // the shadow on the ground: below a face, and a little to the right
            const above = part(x, y - 1) === 2 || part(x, y - 2) === 2 || part(x, y - 3) === 2;
            if (above) return shade(part(x, y - 1) === 2 ? 110 : part(x, y - 2) === 2 ? 70 : 36);
            if (part(x - 1, y) || part(x - 2, y)) return shade(46);
            return null;
          }
          const edge = !part(x - 1, y) || !part(x + 1, y) || !part(x, y - 1) || (k === 2 && !part(x, y + 1));
          // rounded ends: trim the outer corners of a run's end
          const corner = (dx, dy) => !part(x + dx, y) && !part(x, y + dy);
          if (k === 1 && ((corner(-1, -1) && !part(x - 1, y - 1)) || (corner(1, -1) && !part(x + 1, y - 1)))) return OUTC;
          if (edge) return OUTC;
          if (k === 1) {
            // the top: lumpy rock, lit along its back and left, dark at the lip
            if (part(x, y + 1) === 2) return P[2];
            if (!part(x, y - 2) || !part(x - 2, y)) return P[5];
            const h = hash(x >> 1, y >> 1, s + 90); // fine rocky speckle, in 2 px grains
            return h > 0.84 ? P[5] : h < 0.12 ? P[3] : P[4];
          }
          // the face: the kit's rock, lit just under the lip, darker toward the foot
          if (part(x, y - 1) === 1) return P[5];
          if (part(x, y - 2) === 1) return P[4];
          return rock(x, y, y > FOOT - 3 ? -1 : 0);
        };
      };
      const LABEL = { e: 'Wall left end', w: 'Wall right end', ew: 'Wall across', s: 'Wall top end', n: 'Wall bottom end', ns: 'Wall up and down', '': 'Wall (lone rock)', es: 'Wall corner (top left)', sw: 'Wall corner (top right)', ne: 'Wall corner (bottom left)', nw: 'Wall corner (bottom right)', esw: 'Wall T (down)', new: 'Wall T (up)', nes: 'Wall T (right)', nsw: 'Wall T (left)', nesw: 'Wall crossing' };
      for (let m = 0; m < 16; m++) {
        const c = { n: !!(m & 1), e: !!(m & 2), s: !!(m & 4), w: !!(m & 8) };
        const key = ['n', 'e', 's', 'w'].filter((d) => c[d]).join('');
        add(`${kit.id}_wall${key ? '_' + key : ''}`, pixels(T, T, onFloor(ridge(c))), { group: kit.group, label: LABEL[key], walk: 'block' });
      }
      add(`${kit.id}_floor`, pixels(T, T, floorPx), { group: kit.group, label: `${kit.name} floor`, walk: 'walk' });
      add(`${kit.id}_high`, pixels(T, T, highPx), { group: kit.group, label: 'High floor (top of a ledge)', walk: 'walk' });
    }

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
    // a cave mouth in the same rock (2×2), the brown kit's is the older `cave` in tiles.js
    if (kit.id === 'gcliff')
      add(`${kit.id}_cave`, pixels(2 * T, 2 * T, (x, y) => {
        const cx = x - 31.5;
        const cy = y - 44;
        const r = Math.hypot(cx / 22, cy / 26);
        if (y > 44 && Math.abs(cx) < 22) return y > 58 ? hex('#141518') : hex('#0b0c0e');
        if (r < 1) return r > 0.92 ? OUTC : r > 0.8 ? P[0] : hex('#0b0c0e');
        return rock(x % T, y % T);
      }), { group: kit.group, label: `${kit.name} cave (2×2)`, w: 2 * T, h: 2 * T, walk: 'walk' });
    add(`${kit.id}_boulder_l`, boulder(2 * T, 2 * T, 32, 36, 27, 21, 3), { group: 'Rocks', label: `${kit.name} boulder (2×2)`, w: 2 * T, h: 2 * T, walk: 'block' });
  });
}
