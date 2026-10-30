// A named friend's look: their job's clothes (npcs.json `wears`, a class variant), the same wherever
// you meet them, on their island or hanging out with you (src/companion.js).
import { personFor } from './index.js';

const seedOf = (id) => [...id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export function friendLook(id, wears) {
  const seed = seedOf(id);
  const r = (k) => {
    const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  const p = wears && personFor(wears, r);
  return p ? { colors: p.colors, look: { ...p.look, pose: null, ground: null }, scale: p.scale } : null;
}
