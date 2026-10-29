// Puzzle test: boulders, plates, levers, gates, ice, fog, riddles and cracked rocks on the Puzzle yard map
// (content/maps/puzzle-yard.json, made by tools/puzzle_yard.mjs).
// Usage: npm run build && npx vite preview --port 4173 --base / &  then  PW=playwright OUT=dir node tests/puzzles.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'puzzle-shots';
fs.mkdirSync(OUT, { recursive: true });
const map = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'maps', 'puzzle-yard.json'), 'utf8'));
const problems = [];
const check = (c, good, bad) => (c ? console.log('  ✓ ' + good) : (problems.push(bad), console.log('  ✗ ' + bad)));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(1500);
  const S = (fn, arg) => page.evaluate(fn, arg);
  await S((m) => { localStorage.removeItem('curation.fog'); __game.scene.getScene('room').travel?.('island'); }, map).catch(() => {});
  await S((m) => { __game.scene.getScene('room').scene.start('island', { mapData: m }); }, map);
  await page.waitForTimeout(2500);
  const scene = (fn, arg) => page.evaluate(`(() => { const s = __game.scene.getScene('island'); const a = ${JSON.stringify(arg ?? null)}; return (${fn.toString()})(s, a); })()`);
  const walk = async (dx, dy, ms) => {
    await scene((s, a) => { s.dragging = true; s.dragVec = { x: a[0], y: a[1] }; s.dragMag = 1; }, [dx, dy]);
    await page.waitForTimeout(ms);
    await scene((s) => { s.dragging = false; s.dragVec = null; });
  };
  const at = (x, y) => scene((s, a) => { s.player.setPosition((a[0] + 0.5) * 32, (a[1] + 1) * 32 - 4); }, [x, y]);

  const info = await scene((s) => ({ b: s.puzzles.boulders.length, p: s.puzzles.plates.length, g: s.puzzles.gates.length, l: s.puzzles.levers.length, r: s.puzzles.riddlers.length, f: s.puzzles.fogs.length, k: s.puzzles.rocks.length, digs: s.digs.length }));
  check(info.b === 1 && info.p === 1 && info.g === 2 && info.l === 1 && info.r === 1 && info.f === 9 && info.k === 1 && info.digs === 11, `the yard loads all its pieces ${JSON.stringify(info)}`, 'pieces missing: ' + JSON.stringify(info));

  // 1. push the boulder two tiles onto the plate; the gate opens and stays open
  await at(29, 30);
  await scene((s, a) => { s.dragging = true; s.dragVec = { x: 1, y: 0 }; s.dragMag = 1; });
  for (let i = 0; i < 60 && (await scene((s) => s.puzzles.boulders[0].x)) < 33; i++) await page.waitForTimeout(100);
  await scene((s) => { s.dragging = false; s.dragVec = null; });
  await page.waitForTimeout(300);
  const r1 = await scene((s) => ({ bx: s.puzzles.boulders[0].x, on: s.puzzles.plates[0].on, open: s.puzzles.gates[0].open, solid: s.solid[30][40] }));
  check(r1.bx === 33 && r1.on && r1.open && !r1.solid, 'pushing the boulder onto the plate opens the gate', 'boulder/plate/gate wrong: ' + JSON.stringify(r1));
  await page.screenshot({ path: `${OUT}/plate-gate.png` });
  // a stuck boulder can be reset; walking into a wall does not move it further
  await scene((s) => s.puzzles.reset(s.puzzles.boulders[0]));
  const r1b = await scene((s) => ({ bx: s.puzzles.boulders[0].x, open: s.puzzles.gates[0].open }));
  check(r1b.bx === 31 && r1b.open, 'a boulder can be put back; the gate stays open', 'reset wrong: ' + JSON.stringify(r1b));

  // 2. lever alone is not enough; the riddle is the other half
  await at(28, 45);
  await scene((s) => s.puzzles.interact({ puzzle: s.puzzles.levers[0], kind: 'lever' }));
  const r2 = await scene((s) => s.puzzles.gates[1].open);
  check(r2 === false, 'a lever alone does not open a gate that also wants a riddle', 'gate opened too soon');
  await scene((s) => { const r = s.puzzles.riddlers[0]; r.solved = true; s.puzzles.settle(); });
  const r2b = await scene((s) => ({ open: s.puzzles.gates[1].open, solid: s.solid[40][30] }));
  check(r2b.open && !r2b.solid, 'lever and riddle together open the gate', 'gate stayed shut: ' + JSON.stringify(r2b));

  // riddle card: a wrong answer is gentle, a right one hands over a find
  await scene((s) => { const r = s.puzzles.riddlers[0]; r.solved = false; s.puzzles.riddle(r); });
  const opts = await S(() => [...document.querySelectorAll('#riddle .rd-opts button')].length);
  await S(() => { document.querySelectorAll('#riddle .rd-opts button')[2].click(); });
  const wrong = await S(() => ({ msg: document.querySelector('#riddle .rd-msg').textContent, open: !document.querySelector('#riddle').classList.contains('hidden') }));
  check(opts === 3 && wrong.open && /Not quite/.test(wrong.msg), 'a wrong answer just lets you try again', 'wrong answer handling: ' + JSON.stringify(wrong));
  await page.screenshot({ path: `${OUT}/riddle.png` });
  await S(() => { const R = document.querySelectorAll('#riddle .rd-opts button'); R.forEach((b) => b.click()); });
  const solved = await scene((s) => ({ solved: s.puzzles.riddlers[0].solved, dig: !document.querySelector('#dig').classList.contains('hidden') }));
  check(solved.solved && solved.dig, 'the right answer opens a dig patch for the reward', 'riddle reward wrong: ' + JSON.stringify(solved));
  await S(() => document.querySelector('#dig .dig-close').click());

  // 3. ice: step on and slide on your own until something stops you
  await at(21, 35);
  const x0 = await scene((s) => s.player.x);
  await walk(1, 0, 250);
  await page.waitForTimeout(1800);
  const x1 = await scene((s) => ({ x: s.player.x, sliding: !!s.puzzles.sliding }));
  check(x1.x - x0 > 150 && !x1.sliding, `sliding on ice carries you on (${Math.round(x1.x - x0)}px) and stops at the edge`, 'ice wrong: ' + JSON.stringify(x1));

  // 4. fog clears and stays cleared
  await at(51, 31);
  await page.waitForTimeout(600);
  const fog = await scene((s) => s.puzzles.fogs.filter((f) => f.gone).length);
  const saved = await S(() => Object.keys(JSON.parse(localStorage.getItem('curation.fog') || '{}')).length);
  check(fog >= 3 && saved >= 3, `walking in clears the fog (${fog} tiles) and it is remembered`, `fog wrong: ${fog}/${saved}`);

  // 5. the cracked boulder wants a pick (earned: 16 different dug finds)
  await scene((s) => s.puzzles.smash(s.puzzles.rocks[0]));
  const k1 = await scene((s) => s.puzzles.rocks.length);
  check(k1 === 1, 'without a pick the rock stays', 'rock smashed without a pick');
  const reg = await import(path.join(__dirname, '..', 'src', 'collections', 'index.js'));
  const ids = ['mineral', 'fossil'].flatMap((c) => reg.list({ collection: c }).map((e) => e.id)).slice(0, 16);
  await S((ids) => localStorage.setItem('curation.codex', JSON.stringify({ v: 1, seen: Object.fromEntries(ids.map((id) => [id, { n: 1, first: 1 }])), owned: {}, claimed: {}, dirty: {} })), ids);
  await scene((s) => s.puzzles.smash(s.puzzles.rocks[0]));
  await page.waitForTimeout(500);
  const k2 = await scene((s) => ({ n: s.puzzles.rocks.length, solid: s.solid[40][50] }));
  check(k2.n === 0 && !k2.solid, 'with a pick the rock cracks and the way is clear', 'rock did not smash: ' + JSON.stringify(k2));

  // 6. hunts: the X shows when the four map pieces are held, and the detector is earned
  const reg2 = await import(path.join(__dirname, '..', 'src', 'collections', 'index.js'));
  const mapIds = reg2.list({ collection: 'map' }).map((e) => e.id);
  const dugIds = ['mineral', 'fossil'].flatMap((c) => reg2.list({ collection: c }).map((e) => e.id)).slice(0, 10);
  const codexWith = (seen, owned) => ({ v: 1, seen: Object.fromEntries(seen.map((id) => [id, { n: 1, first: 1 }])), owned: Object.fromEntries(owned.map((id) => [id, 1])), claimed: {}, dirty: {} });
  const clearDig = async () => {
    const box = await page.locator('#dig .dig-canvas').boundingBox();
    await page.mouse.move(box.x + 4, box.y + 4);
    await page.mouse.down();
    for (let y = 8; y < box.height; y += 18) {
      await page.mouse.move(box.x + 6, box.y + y, { steps: 2 });
      await page.mouse.move(box.x + box.width - 6, box.y + y, { steps: 8 });
    }
    await page.mouse.up();
    await page.waitForTimeout(200);
  };
  const restart = async () => { await scene((s) => s.scene.start('island', { mapData: JSON.parse(JSON.stringify(window.__yard)) })); await page.waitForTimeout(2200); };
  await S((m) => { window.__yard = m; localStorage.setItem('curation.codex', JSON.stringify(m.codex)); }, { ...map, codex: codexWith(mapIds, mapIds) });
  await restart();
  await page.waitForTimeout(900);
  const x1v = await scene((s) => ({ n: s.puzzles.hunts.xs.length, shown: s.puzzles.hunts.xs[0]?.shown, on: s.puzzles.hunts.on }));
  check(x1v.n === 1 && x1v.shown && !x1v.on, 'four map pieces make the X appear (and the detector is still locked)', 'X wrong: ' + JSON.stringify(x1v));
  await scene((s) => { const x = s.puzzles.hunts.xs[0]; s.player.setPosition(x.cx, x.cy + 12); });
  await page.waitForTimeout(300);
  const fx = await scene((s) => s.focus && s.focus.kind);
  check(fx === 'x', 'standing on the X offers a dig', 'X not focusable: ' + fx);
  await scene((s) => s.interact());
  await page.waitForTimeout(200);
  await clearDig();
  await page.screenshot({ path: `${OUT}/x-dig.png` });
  await S(() => document.querySelector('#dig .dig-close').click());
  const spent = await scene((s) => ({ shown: s.puzzles.hunts.xs[0].shown, has: JSON.parse(localStorage.getItem('curation.codex')).owned }));
  check(!spent.shown && !mapIds.some((id) => spent.has[id]), 'digging the X spends the map pieces', 'X not spent: ' + JSON.stringify(spent));

  // the detector: earned at 10 finds; warmer as you near the day's buried things
  await S((m) => localStorage.setItem('curation.codex', JSON.stringify(m)), codexWith(dugIds, []));
  await restart();
  await page.waitForTimeout(600);
  const dt = await scene((s) => ({ on: s.puzzles.hunts.on, n: (s.puzzles.hunts.targets || []).length, badge: !!document.querySelector('#detector') }));
  check(dt.on && dt.n === 3 && dt.badge, 'ten finds earn the detector; three things are buried today', 'detector wrong: ' + JSON.stringify(dt));
  const far = await scene((s) => { const h = s.puzzles.hunts; const t = h.targets[0]; s.player.setPosition(t.x + 700, t.y); return null; });
  await page.waitForTimeout(400);
  const cold = await S(() => document.querySelector('#detector').textContent);
  await scene((s) => { const t = s.puzzles.hunts.targets[0]; s.player.setPosition(t.x, t.y + 3); });
  await page.waitForTimeout(400);
  const hot = await S(() => document.querySelector('#detector').textContent);
  check(/Cold|Cool/.test(cold) && /Right here/.test(hot), `the badge warms up as you near (${cold.trim()} then ${hot.trim()})`, `heat wrong: ${cold} / ${hot}`);
  await page.screenshot({ path: `${OUT}/detector.png` });
  const fb = await scene((s) => s.focus && s.focus.kind);
  check(fb === 'buried', 'on the spot you can dig', 'buried not focusable: ' + fb);
  await scene((s) => s.interact());
  await page.waitForTimeout(200);
  await clearDig();
  await S(() => document.querySelector('#dig .dig-close').click());
  const dn = await scene((s) => s.puzzles.hunts.targets.filter((t) => t.done).length);
  const daily = await S(() => JSON.parse(localStorage.getItem('curation.digdaily') || '{}'));
  check(dn === 1 && daily.n >= 1, 'a dug buried thing is done for the day and counts toward the daily goal', `buried/daily wrong: ${dn} ${JSON.stringify(daily)}`);
  check(!errors.length, 'no page errors', 'page errors: ' + errors.join(' | '));
  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
