// Bundle size budget (gzip), read from dist/ after `npm run build`. No browser.
// Phaser is its own cached chunk; the rest is the game. Raise a number here on purpose, never by accident.
const fs = require('fs');
const zlib = require('zlib');
const BUDGET_KB = { phaser: 360, main: 240, total: 800 }; // main 230 → 240 for the color wheel, speech-bubble follow and rowing (29 Oct feedback); total = all JS in dist/assets (every page); 760 → 800 for the people sprites (docs/PEOPLE-SPRITES.md tiers 4-5, about 25 KB)
const dir = 'dist/assets';
if (!fs.existsSync(dir)) {
  console.log('  ✗ no dist/: run npm run build first');
  process.exit(1);
}
const sizes = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => [f.replace(/-[\w-]{8}\.js$/, ''), zlib.gzipSync(fs.readFileSync(`${dir}/${f}`)).length / 1024]);
const kb = (name) => sizes.filter(([n]) => n === name).reduce((a, [, s]) => a + s, 0);
const total = sizes.reduce((a, [, s]) => a + s, 0);
let bad = 0;
for (const [name, limit] of Object.entries(BUDGET_KB)) {
  const v = name === 'total' ? total : kb(name);
  const ok = v <= limit;
  if (!ok) bad++;
  console.log(`  ${ok ? '✓' : '✗'} ${name}: ${v.toFixed(0)} KB gzip (budget ${limit})`);
}
process.exit(bad ? 1 : 0);
