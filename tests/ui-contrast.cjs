// Colour contrast of the UI tokens: every text colour must reach 4.5:1 (WCAG AA) on every surface it can sit on,
// and the dark label on the gold button too. Reads src/ui/tokens.css; no browser needed.
const fs = require('fs');
const css = fs.readFileSync('src/ui/tokens.css', 'utf8');
const tok = {};
for (const m of css.matchAll(/--ui-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) tok[m[1]] = m[2];

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT = ['ink', 'muted', 'gold-hi', 'gold', 'good', 'danger', 'info', 'r1', 'r2', 'r3', 'r4'];
const SURFACES = ['bg', 'panel', 'panel-2', 'raised'];
let bad = 0;
const check = (ok, msg) => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`);
  if (!ok) bad++;
};
for (const t of TEXT) {
  if (!tok[t]) {
    check(false, `token --ui-${t} not found in tokens.css`);
    continue;
  }
  for (const s of SURFACES) {
    const r = ratio(tok[t], tok[s]);
    if (r < 4.5) check(false, `--ui-${t} ${tok[t]} on --ui-${s} ${tok[s]}: ${r.toFixed(2)}:1 (needs 4.5)`);
  }
}
const gold = ratio(tok['on-gold'], '#e8c867');
check(gold >= 4.5, `dark label on the gold button: ${gold.toFixed(1)}:1`);
if (!bad) console.log(`ok   ${TEXT.length} text colours reach 4.5:1 on ${SURFACES.length} surfaces`);
process.exit(bad ? 1 : 0);
