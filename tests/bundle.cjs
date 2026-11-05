// Bundle size budget (gzip), read from dist/ after `npm run build`. No browser.
// Phaser is its own cached chunk; the rest is the game. Raise a number here on purpose, never by accident.
const fs = require('fs');
const zlib = require('zlib');
const BUDGET_KB = { phaser: 360, main: 290, total: 865 }; // total = all JS in dist/assets (every page); 760 → 800 for the people sprites (docs/PEOPLE-SPRITES.md tiers 4-5, about 25 KB); main 230 → 240 for the color wheel, speech-bubble follow and rowing (29 Oct feedback); 240 → 255 (and total 800 → 820) for the interaction polish (focus, bubbles, emotes, tells, wind, little scenes: about 20 KB); 255 → 260 for the wardrobe (costumes, things to hold, real shop cosmetics: about 2.5 KB); total 820 → 830: it had reached 820 with everyone's work (the quiet HUD itself adds under 1 KB); main 260 → 268 (Uncle Sam came in the same day) and total 830 → 845 for friends you can call (phone, rules, twice the NPC greetings: about 5 KB; their hangout lines load only when one is with you); main 268 → 290 and total 845 → 865 (5 Nov polish pass): main had grown to 285 KB through #226-#230 (caves, examine lines, little scenes) while CI was red, so the budget is reset just above it to catch new growth again. Lazy-loading examine.js and the vignettes is the next real saving (BACKLOG)
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
