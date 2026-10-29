// Opens every screen at a phone size and saves screenshots plus metrics.json (the UI audit and before/after shots).
// Usage: node tests/ui-shots.cjs [outDir] [--size 390x844] [--only name,name]
// Needs the preview server on :4173 (npm run build && npx vite preview --port 4173 --base /).
const fs = require('fs');
const path = require('path');
const { runScreens } = require('./ui-lib.cjs');
const args = process.argv.slice(2);
const val = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const out = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--size' && args[i - 1] !== '--only') || 'docs/ui/before';
const size = (val('--size') || '390x844').split('x').map(Number);
const only = val('--only') ? val('--only').split(',') : null;
fs.mkdirSync(out, { recursive: true });
const METRICS = {};
runScreens({
  size,
  only,
  log: console.log,
  onShot: async (name, page, m) => {
    if (page) await page.screenshot({ path: path.join(out, `${name}.png`), animations: name.startsWith('25') ? 'allow' : 'disabled', timeout: 15000 });
    if (m) METRICS[name.replace(/^(03-journal)-\d+-/, '$1-')] = m;
  },
}).then(() => fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify(METRICS, null, 1)));
