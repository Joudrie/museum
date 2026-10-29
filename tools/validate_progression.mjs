// Content validator for the progression layer. Exits 1 on any problem, so a broken reference,
// an uncatchable species or an empty reward fails the build. Usage: node tools/validate_progression.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { validate } = await import(path.join(root, 'src/progression/validate.js'));

// perk keys the code asks for: p.has('fishing.shadows'), hasPerk(state, 'x.y'), perks.has('x.y')
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
const uses = new Set();
walk(path.join(root, 'src')).forEach((f) => {
  if (f.endsWith('validate.js')) return;
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\b(?:has|hasPerk)\((?:[\w.]+,\s*)?'((?:fishing|sailing|exploring|friendship|foraging)\.[a-z_0-9]+)'\)/g)) uses.add(m[1]);
});
const mapIds = fs.readdirSync(path.join(root, 'src/maps')).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '').replace(/^main-island$/, 'main')); // IslandScene calls main-island.json 'main'

// which bus events have a subscriber once the standard service is built
const { createProgression } = await import(path.join(root, 'src/progression/service.js'));
const { standardModules } = await import(path.join(root, 'src/progression/modules.js'));
const { createBus } = await import(path.join(root, 'src/progression/bus.js'));
const bus = createBus();
createProgression({ bus, modules: standardModules() });
const wired = new Set(bus.types().filter((t) => bus.count(t) > 0));

const problems = validate({ perkUses: [...uses], mapIds, busWired: wired });
if (problems.length) {
  console.log(`✗ ${problems.length} problem${problems.length === 1 ? '' : 's'}:`);
  problems.forEach((p) => console.log('  - ' + p));
  process.exit(1);
}
console.log(`✓ progression content is sound (${uses.size} perk uses checked)`);
