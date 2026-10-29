// Grass that blends into painted dirt and rock tiles, the way terrain paths already blend.
// Painted ground tiles (the builder's tile layer) have hard edges on their own; this finds
// the unpainted grass cells around them and says which existing edge tile to lay there
// (grass_dirt_<corners>, grass_rock_<corners>; "1" marks a grass corner, order tl tr bl br).
// Shared by the builder and the game so both draw the same thing.
export const BLEND = { dirt_1: 'grass_dirt', dirt_2: 'grass_dirt', rock_1: 'grass_rock', rock_2: 'grass_rock' };

// refAt(x, y) -> the painted tile ref ('t:dirt_1') or null; isGrass(x, y) -> plain grass underneath.
// Returns the edge tile name to draw over cell (x, y), or null.
export function blendAt(x, y, refAt, isGrass) {
  if (refAt(x, y) || !isGrass(x, y)) return null;
  const sets = new Set();
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const r = refAt(x + dx, y + dy);
      if (r && BLEND[r.slice(2)]) sets.add(BLEND[r.slice(2)]);
    }
  for (const set of sets) {
    const painted = (cx, cy) => [refAt(cx - 1, cy - 1), refAt(cx, cy - 1), refAt(cx - 1, cy), refAt(cx, cy)].some((r) => r && BLEND[r.slice(2)] === set);
    const key = [painted(x, y), painted(x + 1, y), painted(x, y + 1), painted(x + 1, y + 1)].map((g) => (g ? 0 : 1)).join('');
    if (key === '1111') continue;
    return key === '0000' ? (set === 'grass_dirt' ? 'dirt_1' : 'rock_1') : `${set}_${key}`;
  }
  return null;
}
