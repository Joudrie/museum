// A small seeded random generator (mulberry32). Every system that rolls dice
// takes one of these, so tests and the sim can replay the same run.
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed = Math.floor(Math.random() * 2 ** 32)) {
  let a = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const r = next;
  r.int = (n) => Math.floor(next() * n);
  r.range = (lo, hi) => lo + next() * (hi - lo);
  r.chance = (p) => next() < p;
  r.pick = (arr) => arr[Math.floor(next() * arr.length)];
  // standard normal (Box-Muller)
  r.normal = () => Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next());
  // index of a weighted choice; weights may be zero
  r.weighted = (weights) => {
    const total = weights.reduce((s, w) => s + w, 0);
    if (total <= 0) return -1;
    let x = next() * total;
    for (let i = 0; i < weights.length; i++) if ((x -= weights[i]) < 0) return i;
    return weights.length - 1;
  };
  r.shuffle = (arr) => {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  r.fork = (label) => createRng(hashSeed(`${a}:${label}`));
  return r;
}

export const defaultRng = createRng();
