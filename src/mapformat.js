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
