// UI layout guard: opens every screen at phone sizes and checks it against tests/ui-budget.json.
// Hard failures: the page scrolls sideways, "undefined" / "NaN" text, a screen that won't open.
// Ratchet: tap targets under 44 px and the smallest text may not get worse than the budget; improve a screen,
// then run with --update to lower its budget. Goal: 0 small targets and 13 px text on every screen.
// Usage: node tests/ui-layout.cjs [--update] [--quick]   (needs the preview server on :4173)
const fs = require('fs');
const path = require('path');
const { runScreens } = require('./ui-lib.cjs');
const budgetPath = path.join(__dirname, 'ui-budget.json');
const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
const update = process.argv.includes('--update');
const quick = process.argv.includes('--quick');
const problems = [];
const ok = (m) => console.log('  ✓ ' + m);
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));

(async () => {
  const runs = [
    { size: [390, 844], only: null },
    ...(quick ? [] : [{ size: [360, 640], only: ['01-', '03-journal-tabs', '04-', '05-', '08-', '11-'] }, { size: [430, 932], only: ['01-', '04-', '08-'] }]),
  ];
  for (const run of runs) {
    console.log(`${run.size.join('x')}`);
    await runScreens({
      size: run.size,
      only: run.only,
      onShot: async (name, page, m) => {
        const key = name.replace(/^(03-journal)-\d+-/, '$1-');
        if (!page || m?.failed) return fail(`${name}: did not open (${m?.failed})`);
        if (!m) return;
        const bad = [];
        if (m.docOverflow) bad.push('the page scrolls sideways');
        if (m.badText) bad.push('"undefined" or "NaN" text on screen');
        if (bad.length) return fail(`${name}: ${bad.join(', ')}`);
        const b = budget.screens[key];
        if (run.size[0] === 390 && b) {
          const worse = [];
          if (m.smallTargets > b.smallTargets) worse.push(`${m.smallTargets} small targets (budget ${b.smallTargets})`);
          if (m.minFont < b.minFont) worse.push(`smallest text ${m.minFont}px (budget ${b.minFont}px)`);
          if (worse.length) return fail(`${name}: ${worse.join(', ')}`);
          if (update && (m.smallTargets < b.smallTargets || m.minFont > b.minFont)) {
            b.smallTargets = Math.min(b.smallTargets, m.smallTargets);
            b.minFont = Math.max(b.minFont, m.minFont);
          }
        } else if (run.size[0] === 390 && update) budget.screens[key] = { smallTargets: m.smallTargets, minFont: m.minFont };
        ok(`${name} (${m.smallTargets} small targets, smallest text ${m.minFont}px)`);
      },
    });
  }
  if (update) fs.writeFileSync(budgetPath, JSON.stringify(budget, null, 1) + '\n');
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
