// How much skill the reel asks for: the layer's own reel (src/progression/reel.js) played by its own bot at
// different skill levels, 4,000 fights per cell. Writes data/reel_skill.json.
//   node --import ./docs/progression/tools/register.mjs docs/progression/tools/reel_skill.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', '..', '..', 'src');
const { makeReel, playBot } = await import(join(SRC, 'progression/reel.js'));
const { createRng } = await import(join(SRC, 'progression/rng.js'));
const rng = createRng(20261029);
const N = 4000;
const out = { generated: 'docs/progression/tools/reel_skill.mjs', fights_per_cell: N, zone: 0.26, cells: [] };
for (const rarity of [1, 2, 3, 4, 5])
  for (const skill of [0, 0.25, 0.45, 0.65, 0.85, 1]) {
    let won = 0, perfect = 0, t = 0;
    for (let i = 0; i < N; i++) {
      const r = playBot(makeReel({ rarity, zone: 0.26, rng, legend: rarity === 5 }), skill, rng);
      won += r.won ? 1 : 0;
      perfect += r.perfect ? 1 : 0;
      t += r.t;
    }
    out.cells.push({ rarity, skill, win: +(won / N).toFixed(3), perfect: +(perfect / N).toFixed(3), seconds: +(t / N).toFixed(1) });
  }
writeFileSync(join(HERE, '..', 'data', 'reel_skill.json'), JSON.stringify(out, null, 1) + '\n');
for (const r of [1, 2, 3, 4, 5]) console.log(`rarity ${r}: ` + out.cells.filter((c) => c.rarity === r).map((c) => `skill ${c.skill}: win ${(c.win * 100).toFixed(0)}% (${c.seconds}s)`).join(' · '));
