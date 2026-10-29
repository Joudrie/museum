// Runs the progression content validator (tools/validate_progression.mjs): broken references, missing hints,
// uncatchable species, empty rank or skill rewards. Usage: node tests/progression-content.cjs
const { spawnSync } = require('child_process');
const r = spawnSync('node', ['tools/validate_progression.mjs'], { encoding: 'utf8' });
process.stdout.write(r.stdout + r.stderr);
process.exit(r.status || 0);
