// Plays the progression layer for N hours as a casual (50% efficiency) and a hardcore (100%) player
// and prints rank, skills, collection and gold over time, plus the time targets from the spec.
// Usage: node tools/sim_progression.mjs [--hours 150] [--csv out.csv] [--seed 1] [--runs 3] [--quiet]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { simulate, PROFILES } = await import(path.join(root, 'src/progression/sim.js'));
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i < 0 ? d : process.argv[i + 1];
};
const hours = Number(arg('hours', 40));
const runs = Number(arg('runs', 1));
const seed = Number(arg('seed', 1));
const csv = arg('csv', '');
const TARGET = { 2: 3, 3: 8, 5: 25, 10: 180, 15: 480, 20: 900, 30: 2400, 40: 4800, 50: 8400 }; // minutes of play, section 3

const results = {};
for (const name of ['casual', 'hardcore']) {
  results[name] = [];
  for (let i = 0; i < runs; i++) results[name].push(simulate({ hours, profile: PROFILES[name], seed: seed + i }));
}
const med = (a) => {
  const v = a.filter((x) => x !== null && x !== undefined).sort((x, y) => x - y);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};
const fmt = (m) => (m === null ? '   —   ' : m >= 120 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`);

console.log(`\nTime to rank (minutes of active play), median of ${runs} run${runs > 1 ? 's' : ''}, ${hours} active hours`);
console.log('rank   target     casual     hardcore');
for (const n of Object.keys(TARGET)) {
  console.log(`${String(n).padStart(4)}   ${fmt(TARGET[n]).padStart(7)}   ${fmt(med(results.casual.map((r) => r.reach[n]))).padStart(8)}   ${fmt(med(results.hardcore.map((r) => r.reach[n]))).padStart(8)}`);
}
for (const name of Object.keys(results)) {
  const r = results[name][0];
  console.log(`\n${name}: ${r.activeMin} active min · rank ${r.summary.rank} · fishing L${r.summary.fishing} sailing L${r.summary.sailing} exploring L${r.summary.exploring} friendship L${r.summary.friendship} · ${r.summary.species}/${r.p.state ? 60 : 60} species (${r.summary.speciesPct}%) · ${r.summary.gold} gold now, ${r.summary.spent} spent · longest stretch without a progress tick: ${r.maxGapMin.toFixed(1)} min`);
  console.log('  journal %: ' + r.journal.map(([k, v]) => `${k} ${v}`).join(', '));
}
if (csv) {
  const lines = ['profile,activeMin,day,rank,xp,fishing,sailing,exploring,friendship,species,speciesPct,gold,spent,catches'];
  for (const [name, rs] of Object.entries(results)) rs[0].rows.forEach((r) => lines.push([name, r.activeMin, r.day, r.rank, r.xp, r.fishing, r.sailing, r.exploring, r.friendship, r.species, r.speciesPct, r.gold, r.spent, r.catches].join(',')));
  fs.writeFileSync(csv, lines.join('\n') + '\n');
  console.log(`\nwrote ${csv}`);
}
