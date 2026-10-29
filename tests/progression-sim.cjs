// The acceptance targets, checked by the headless player (docs/PROGRESSION.md section 23). Plain Node.
// Usage: node tests/progression-sim.cjs
const path = require('path');
const root = path.join(__dirname, '..');
const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));

(async () => {
  const { simulate, PROFILES } = await import(path.join(root, 'src/progression/sim.js'));
  const { validate } = await import(path.join(root, 'src/progression/validate.js'));
  const HOURS = Number(process.env.HOURS || 6);
  const runs = ['casual', 'hardcore'].map((n) => [n, [1, 2, 3].map((seed) => simulate({ hours: HOURS, profile: PROFILES[n], seed }))]);
  const med = (a) => a.filter((x) => x != null).sort((x, y) => x - y)[Math.floor(a.filter((x) => x != null).length / 2)];
  const reach = (n, r) => med(runs.find(([k]) => k === n)[1].map((s) => s.reach[r]));

  console.log('Casual player (50% efficiency)');
  check(reach('casual', 2) < 5, `Rank 2 in ${reach('casual', 2)} min (under 5)`, `Rank 2 took ${reach('casual', 2)} min`);
  check(reach('casual', 5) < 30, `Rank 5 in ${reach('casual', 5)} min (under 30)`, `Rank 5 took ${reach('casual', 5)} min`);
  const r10 = reach('casual', 10);
  check(r10 >= 150 && r10 <= 210, `Rank 10 in ${(r10 / 60).toFixed(1)} h (2.5 to 3.5)`, `Rank 10 took ${r10 && (r10 / 60).toFixed(1)} h`);
  console.log('Hardcore player (100% efficiency)');
  check(reach('hardcore', 10) < r10, `Rank 10 comes faster for the hardcore player (${(reach('hardcore', 10) / 60).toFixed(1)} h)`, 'hardcore not faster');
  console.log('Pacing');
  const gaps = runs.flatMap(([, rs]) => rs.map((r) => r.maxGapMin));
  check(Math.max(...gaps) <= 3, `no stretch over 3 minutes of play without a visible progress tick (worst ${Math.max(...gaps).toFixed(1)} min)`, `a stretch of ${Math.max(...gaps).toFixed(1)} minutes had no progress tick`);
  const trav = runs.flatMap(([, rs]) => rs.map((r) => r.p.state.telemetry.firstPlayMin?.traversal_unlock));
  check(trav.every((x) => x != null && x <= 25), `the first traversal unlock comes within 25 minutes (worst ${Math.max(...trav.map((x) => x ?? 999)).toFixed(1)})`, `first traversal unlock at ${trav}`);
  const gp = runs.flatMap(([, rs]) => rs.map((r) => r.p.goals.nextTime().length));
  check(gp.every((n) => n >= 1 && n <= 3), 'the logout card always has an open loop', 'logout card empty');
  console.log('Content');
  const bad = validate({});
  check(!bad.length, 'every species is catchable, every entry has three hints, every rank and skill level grants something', 'validator: ' + bad.slice(0, 3).join('; '));
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
