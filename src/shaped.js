// Shaped rooms: empty rooms with interesting floor plans, built from what the
// renderer already knows. A plan is a column of bands from the back to the
// front, each with its own width. A band can end in a wall down to the next,
// lower level (with stairs through it) or in a run of steps, so rooms get
// terraces, raised alcoves and mezzanines. On top of that: windows, columns,
// a sunken pit with railings and a stairwell down. Every plan has an arch in
// its back wall (the way on) and a door mat at the front (the way in).
// Units in plans are tiles; cols run left to right, rows back to front.
import { T } from './art.js';

const D = 2 * T; // wall height (and the height of one level)

export const PLANS = {
  // Three levels rising toward the back, each reached by stairs, with tall
  // windows on the top terrace and on the middle terrace's side walls.
  terraces: {
    name: 'Terraces',
    bands: [
      { c0: 3, c1: 14, rows: 4, end: { kind: 'wall', stairs: [[7.5, 9.5]] } },
      { c0: 1, c1: 16, rows: 5, end: { kind: 'wall', stairs: [[2, 4], [13, 15]] } },
      { c0: 0, c1: 17, rows: 6 },
    ],
    windows: [{ wall: 'back', u: 1.6 }, { wall: 'back', u: 9.4 }, { wall: 'ol1', u: 1 }, { wall: 'or1', u: 1 }],
    columns: [[4.5, 1.6], [12.5, 1.6]],
  },
  // A cross: a raised alcove at the back up a few steps, wide arms with
  // windows, and a long nave; columns mark the crossing.
  cross: {
    name: 'Cross',
    bands: [
      { c0: 6, c1: 11, rows: 4, end: { kind: 'steps', rows: 1 } },
      { c0: 0, c1: 17, rows: 5 },
      { c0: 5, c1: 12, rows: 7 },
    ],
    windows: [{ wall: 'back', u: 0.8 }, { wall: 'back', u: 4.2 }, { wall: 'ol1', u: 1.6 }, { wall: 'ol1', u: 4.2 }, { wall: 'or1', u: 1.8 }, { wall: 'or1', u: 4.4 }],
    columns: [[5.5, 4.6], [11.5, 4.6], [5.5, 8.6], [11.5, 8.6]],
  },
  // A big court with a sunken pit in the middle (railings all round, columns
  // at its corners), a stairwell down in the back corner and a narrow
  // vestibule where you come in.
  court: {
    name: 'Sunken court',
    bands: [
      { c0: 0, c1: 15, rows: 12 },
      { c0: 5, c1: 10, rows: 3 },
    ],
    windows: [{ wall: 'back', u: 2 }, { wall: 'back', u: 13 }],
    columns: [[3.5, 3], [11.5, 3], [3.5, 9], [11.5, 9]],
    pit: { c0: 4.5, c1: 10.5, r0: 4, r1: 8.5 },
    stairwell: { c0: 11.5, c1: 14, r0: 0.6, r1: 3 },
  },
  // A narrow corridor steps up into a tall hall with a colonnade down each
  // side and a raised mezzanine across the back, stairs at both ends.
  mezzanine: {
    name: 'Mezzanine',
    bands: [
      { c0: 4, c1: 13, rows: 4, end: { kind: 'wall', stairs: [[4.2, 6.2], [10.8, 12.8]] } },
      { c0: 0, c1: 17, rows: 8, end: { kind: 'steps', rows: 1, span: [6, 11] } },
      { c0: 6, c1: 11, rows: 3 },
    ],
    windows: [{ wall: 'back', u: 2.2 }, { wall: 'back', u: 6.8 }, { wall: 'ol1', u: 2 }, { wall: 'or1', u: 2 }],
    columns: [[2.5, 6], [14.5, 6], [2.5, 9.5], [14.5, 9.5]],
  },
};
export const PLAN_ORDER = ['terraces', 'cross', 'court', 'mezzanine'];

export function shapedLayout(planId) {
  const plan = PLANS[planId];
  const cmin = Math.min(...plan.bands.map((b) => b.c0));
  const cmax = Math.max(...plan.bands.map((b) => b.c1));
  const fw = cmax - cmin;
  const xL = 2 * T;
  const X = (c) => xL + (c - cmin) * T;
  const y0 = T + D;
  let top = y0;
  const bands = plan.bands.map((b, i) => {
    const out = { x0: X(b.c0), x1: X(b.c1), top, bottom: top + b.rows * T, strip: null, stairs: [] };
    if (b.end?.kind === 'wall') {
      out.stairs = b.end.stairs.map(([a, c]) => ({ x0: X(a), x1: X(c), foot: out.bottom + 2 * T }));
      out.strip = { kind: 'wall', h: D, cuts: [[-1e9, out.x0], ...out.stairs.map((s) => [s.x0, s.x1]), [out.x1, 1e9]] };
    } else if (b.end?.kind === 'steps') {
      const [a, c] = b.end.span ? b.end.span.map(X) : [out.x0, out.x1];
      out.strip = { kind: 'steps', h: b.end.rows * T, cuts: [[-1e9, a], [c, 1e9]] };
    }
    top = out.bottom;
    out.i = i;
    return out;
  });
  const y1 = top;
  const fd = (y1 - y0) / T;
  const b0 = bands[0];
  const matCol = Math.floor(fw / 2);
  const matX0 = xL + matCol * T;
  // where each wall sits, for doors, windows and paintings
  const refs = {
    back: { face: 'back', x: b0.x0, y: b0.top },
    left: { face: 'left', x: b0.x0, y: b0.top },
    right: { face: 'right', x: b0.x1, y: b0.top },
  };
  bands.forEach((b, i) => {
    if (i) {
      refs[`l${i}`] = { face: 'left', x: b.x0, y: b.top };
      refs[`r${i}`] = { face: 'right', x: b.x1, y: b.top };
      refs[`ol${i}`] = { face: 'back', x: b.x0, y: b.top };
      refs[`or${i}`] = { face: 'back', x: bands[i - 1].x1, y: b.top };
    }
    refs[`f${i}`] = { face: 'back', x: b.x0, y: b.bottom };
  });
  const P = (c, r) => ({ x: X(c), y: y0 + r * T });
  const columns = (plan.columns || []).map(([c, r]) => P(c, r));
  const rect = (q) => q && { x0: X(q.c0), x1: X(q.c1), y0: y0 + q.r0 * T, y1: y0 + q.r1 * T };
  const pit = rect(plan.pit);
  const stairwell = rect(plan.stairwell);
  // the void-pixel check covers each band, its walls and the back wall
  const scanRects = bands.map((b, i) => [b.x0 - D, b.x1 + D, i ? b.top + 2 : b.top - D, b.bottom]);
  const g = { w: (fw + 4) * T, h: y1 + T, xL, xR: X(cmax), y0, y1, D, fw, fd, vertical: true, shaped: true, plan: planId, bands, columns, pit, stairwell, matX0, matX1: matX0 + T, scanRects, refs };

  const W0 = b0.x1 - b0.x0;
  const exit = { kind: 'door-back', wall: 'back', rect: { u0: W0 / 2 - 22, u1: W0 / 2 + 22, v0: 0, v1: 52 }, ax: b0.x0 + W0 / 2, ay: b0.top + 12 };
  const windows = (plan.windows || []).map(({ wall, u }) => ({ wall, rect: { u0: u * T - 16, u1: u * T + 16, v0: 12, v1: 58 } }));
  const entrance = { mat: true, x0: matX0, x1: matX0 + T, ax: matX0 + T / 2, ay: y1 - 10 };

  // Tiles nothing can stand on: outside the bands, the drops between levels,
  // the stairs, columns, the pit and the stairwell.
  const blockedTiles = [];
  for (let c = 0; c < fw; c++)
    for (let r = 0; r < fd; r++) {
      const x = xL + c * T + T / 2;
      const y = y0 + r * T + T / 2;
      const band = bands.find((b) => y >= b.top && y < b.bottom);
      const outside = !band || x < band.x0 || x > band.x1;
      const drop = band?.strip?.kind === 'wall' && y >= band.bottom - D;
      const onStairs = bands.some((b) => b.stairs.some((s) => x > s.x0 && x < s.x1 && y >= b.bottom - D && y < s.foot));
      const inRect = (q) => q && x > q.x0 - 4 && x < q.x1 + 4 && y > q.y0 - 4 && y < q.y1 + 4;
      const column = columns.some((k) => Math.abs(x - k.x) < T / 2 && Math.abs(y - k.y) < T / 2);
      if (outside || drop || onStairs || inRect(pit) || inRect(stairwell) || column) blockedTiles.push({ c, r });
    }
  return { g, slots: [], exit, entrance, split: { y: y0 + 3 * T }, blockedTiles, windows };
}
