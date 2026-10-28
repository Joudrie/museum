// Big maps (Wakefield is 450 x 550) would be megabytes as {"x,y": ref} entries,
// too much for a phone's storage. They keep the tile layer as run-length rows
// instead: { legend: [ref, ...], rows: ["a12.4b", ...] }, one string per row, a letter per
// ref (its place in the legend), "." for empty, and a count after a letter that repeats.
// Small maps keep the plain dictionary. The builder and the game both read either.
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const BIG_MAP = 40000; // tiles in a map before it is packed

// cells: an array of w*h refs (or null); extra: more {"x,y": ref} entries to include
export function packCells(cells, w, h, extra = {}) {
  const legend = [];
  const index = new Map();
  const id = (ref) => {
    let i = index.get(ref);
    if (i === undefined) {
      i = legend.length;
      index.set(ref, i);
      legend.push(ref);
    }
    return i;
  };
  const grid = new Int16Array(w * h).fill(-1);
  cells.forEach((ref, i) => ref && (grid[i] = id(ref)));
  Object.entries(extra).forEach(([k, ref]) => {
    const [x, y] = k.split(',').map(Number);
    if (x >= 0 && y >= 0 && x < w && y < h) grid[y * w + x] = id(ref);
  });
  if (legend.length > CHARS.length) return null; // too many kinds: the caller keeps the dictionary
  const rows = [];
  for (let y = 0; y < h; y++) {
    let s = '';
    for (let x = 0; x < w; ) {
      const v = grid[y * w + x];
      let n = 1;
      while (x + n < w && grid[y * w + x + n] === v) n++;
      s += (v < 0 ? '.' : CHARS[v]) + (n > 1 ? n : '');
      x += n;
    }
    rows.push(s);
  }
  return { legend, rows };
}

export function unpackTiles(p) {
  const tiles = {};
  (p?.rows || []).forEach((row, y) => {
    let x = 0;
    for (const [, ch, n] of row.matchAll(/(\D)(\d*)/g)) {
      const run = n ? Number(n) : 1;
      if (ch !== '.') {
        const ref = p.legend[CHARS.indexOf(ch)];
        if (ref) for (let i = 0; i < run; i++) tiles[`${x + i},${y}`] = ref;
      }
      x += run;
    }
  });
  return tiles;
}

// a map file with its tile layer as a plain dictionary, whichever way it was stored
export const withTiles = (d) => (d?.tileRows ? { ...d, tiles: { ...unpackTiles(d.tileRows), ...d.tiles } } : d);
export const hasTiles = (d) => !!d?.tileRows || Object.keys(d?.tiles || {}).length > 0;

// ---------- angled borders ----------
// A map may have `border: { poly: { "x,y": [[x0,y0,x1,y1,...], ...] } }`: tiles the map's edge
// (the town line) cuts through. Each lists the land part as polygons in pixels inside the tile, so the
// edge is a straight line at any angle instead of a stair of whole tiles. Water fills the rest.
export const edgePolys = (border, w) => {
  const m = new Map();
  Object.entries(border?.poly || {}).forEach(([k, polys]) => {
    const [x, y] = k.split(',').map(Number);
    m.set(y * w + x, polys);
  });
  return m;
};

// is the point (px, py), in pixels inside the tile, on the land part?
export const onLand = (polys, px, py) => {
  let inside = false;
  polys.forEach((p) => {
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      const [xi, yi, xj, yj] = [p[i], p[i + 1], p[j], p[j + 1]];
      if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
    }
  });
  return inside;
};

// Draw a cut tile at (x, y): water, a beach along the line, then the land clipped to the line.
export function drawEdgeCell(ctx, polys, x, y, size, water, drawLand) {
  ctx.drawImage(water, x, y);
  if (!polys.length) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, size, size);
  ctx.clip();
  ctx.strokeStyle = '#e2c68a';
  ctx.lineWidth = 10;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  polys.forEach((p) => {
    for (let i = 0; i < p.length; i += 2) {
      const [ax, ay, bx, by] = [p[i], p[i + 1], p[(i + 2) % p.length], p[(i + 3) % p.length]];
      const onSide = (ax === bx && (ax === 0 || ax === size)) || (ay === by && (ay === 0 || ay === size)); // along the tile's own edge
      if (!onSide) {
        // run a little past both ends (the tile clips it) so strokes of neighbouring tiles meet with no notch
        const len = Math.hypot(bx - ax, by - ay) || 1;
        const [ux, uy] = [((bx - ax) / len) * 8, ((by - ay) / len) * 8];
        ctx.moveTo(x + ax - ux, y + ay - uy);
        ctx.lineTo(x + bx + ux, y + by + uy);
      }
    }
  });
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  polys.forEach((p) => {
    p.forEach((v, i) => (i % 2 ? null : (i ? ctx.lineTo(x + v, y + p[i + 1]) : ctx.moveTo(x + v, y + p[i + 1]))));
    ctx.closePath();
  });
  ctx.clip();
  drawLand();
  ctx.restore();
}
