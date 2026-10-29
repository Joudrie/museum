// Tiny helpers for writing pixel art as data: draw a shape with a function
// (x, y) -> palette letter or '.', and get rows back with an automatic outline.
// Palette letters: a main, b light, c shade, d accent, '#' outline.

/** Rows for a w x h grid, calling `f(x, y)` for each cell. Edge cells next to clear space get the '#' outline. */
export function draw(w, h, f) {
  const g = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => f(x, y) || '.'));
  const at = (x, y) => g[y]?.[x] ?? '.';
  return g.map((row, y) =>
    row.map((ch, x) => (ch !== '.' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy) === '.') ? '#' : ch)).join(''),
  );
}

/** A disc with light top-left, shade bottom-right, and an optional mark drawn in the middle. */
export function disc(n, mark = () => null) {
  const r = (n - 1) / 2;
  return draw(n, n, (x, y) => {
    const dx = x - r, dy = y - r, d = Math.hypot(dx, dy);
    if (d > r + 0.4) return null;
    const m = mark(x, y, dx, dy, d);
    if (m) return m;
    if (d > r - 1.6) return dx + dy > 0 ? 'c' : 'b';
    return 'a';
  });
}

/** A left-right mirrored shape: describe the left half (columns 0..half-1) and get the whole. */
export function mirror(half) {
  return half.map((r) => r + [...r].reverse().join(''));
}

/** A symmetric picture from its left half (hand-drawn rows), outlined. */
export const sym = (half) => { const m = mirror(half); return draw(m[0].length, m.length, (x, y) => m[y][x]); };

export const pal = (a, b, c, d = a, o = '#2a2230') => ({ '#': o, a, b, c, d });

/** Builds the pack for a small collection: the collection, one set of all its entries, and the entries. */
export function pack({ id, name, noun, icon, tab, tabLabel, order, intro, display = 'case', where, how = 'gift', set, reward, plaque, entries }) {
  const full = entries.map(([slug, title, rows, palette, rarity, tag, blurb, facts, extra = {}]) => ({
    id: `${id}:${slug}`,
    collection: id,
    title,
    blurb,
    facts,
    rarity,
    set: set,
    tags: [tag],
    image: { kind: 'pixels', rows, palette },
    display: [display, 'plinth'],
    provenance: { how, where },
    source: { license: 'Original', credit: 'Curation' },
    value: 2 * rarity,
    ...extra,
  }));
  return {
    collection: {
      id, name, noun, icon, kinds: [id], display, ownership: 'earned', meta: ['rarity', 'where'],
      journal: { tab, label: tabLabel, order, layout: 'tiles', intro },
      viewer: { look: 'case' },
    },
    sets: [{ id: set, name: set.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()), collection: id, entries: full.map((e) => e.id), reward: { gold: reward }, plaque }],
    entries: full,
  };
}
