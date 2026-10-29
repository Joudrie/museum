// One number format for the HUD and cards: whole with commas up to 999,999, then 1.2M, 1.2bn, 1.2T.
// (Keeps the status strip inside the screen however rich the museum gets.)
const UNITS = [
  [1e12, 'T'],
  [1e9, 'bn'], // not "B": in the pixel font a B looks like an 8
  [1e6, 'M'],
];

export function shortNum(n) {
  const a = Math.abs(n);
  if (!Number.isFinite(n)) return '0';
  if (a < 1e6) return Math.round(n).toLocaleString();
  for (const [v, s] of UNITS) {
    if (a >= v) {
      const x = n / v;
      return `${Math.abs(x) >= 100 ? Math.round(x) : x.toFixed(1).replace(/\.0$/, '')}${s}`;
    }
  }
  return String(n);
}
