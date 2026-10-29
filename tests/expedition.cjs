// Expedition test: leads unlock islands in the boat menu, the boat scene, a whole trip
// on Skull Isle (chart, X, key, chest), being caught is gentle, and the finds come home
// dirty into your bag (Restoration Studio contract), with the island named as where they were found.
// Usage: npm run build && npx vite preview --port 4173 --base / &
//        PW=/path/to/playwright OUT=some/dir node tests/expedition.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'expedition-shots';
fs.mkdirSync(OUT, { recursive: true });

const problems = [];
const fail = (msg) => {
  problems.push(msg);
  console.log('  ✗ ' + msg);
};
const ok = (msg) => console.log('  ✓ ' + msg);
const check = (cond, good, bad) => (cond ? ok(good) : fail(bad));

async function dataChecks() {
  console.log('Data');
  const dir = path.join(__dirname, '..', 'src', 'maps');
  const files = fs.readdirSync(dir).filter((f) => /^exp-.+\.json$/.test(f));
  check(files.length > 0, `${files.length} expedition maps`, 'no expedition maps');
  const leadsSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'leads.js'), 'utf8');
  const leadIslands = new Set([...leadsSrc.matchAll(/island: '([a-z]+)'/g)].map((m) => m[1]));
  const leadIds = new Set([...leadsSrc.matchAll(/^    id: '([a-z-]+)'/gm)].map((m) => m[1]));
  files.forEach((f) => {
    const m = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const id = f.match(/exp-(.+)\.json/)[1];
    const e = m.expedition || {};
    check(m.format === 'curation-map' && m.kind === 'island' && m.corners.length === m.h + 1, `${f} is a builder island`, `${f} is not a valid map`);
    check(e.id === id, `${f} names itself`, `${f}: expedition.id should be ${id}`);
    check(leadIslands.has(id), `${id} has a lead that unlocks it`, `${id} has no lead pointing at it`);
    check((e.goals || []).length > 0 && (e.spots || []).length > 0, `${id} has goals and spots`, `${id} needs goals and spots`);
    check(m.objects.some((o) => o.ref === 't:rowboat'), `${id} has a boat to leave by`, `${id} has no rowboat`);
    const final = (e.spots || []).some((s) => s.final) || (e.complete || []).length > 0;
    check(final, `${id} can be finished`, `${id} has no final spot or complete list`);
    (e.spots || []).forEach((s) => {
      const land = (x, y) => [m.corners[y][x], m.corners[y + 1][x + 1]].every((c) => c > 0);
      if (!land(s.x, s.y)) fail(`${id}: ${s.k} at ${s.x},${s.y} is in the sea`);
    });
  });
  // the plaque: a find from an expedition says where it was dug up
  const mem = {};
  global.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)), removeItem: (k) => delete mem[k] };
  const src = path.join(__dirname, '..', 'src');
  const { rememberFound } = await import(path.join(src, 'foundat.js'));
  const { provenanceLine } = await import(path.join(src, 'restore.js'));
  rememberFound('mineral:fluorite', 'Skull Isle');
  check(provenanceLine({ id: 'mineral:fluorite' }) === 'Recovered from Skull Isle', 'the plaque says "Recovered from Skull Isle"', `plaque says "${provenanceLine({ id: 'mineral:fluorite' })}"`);
  delete global.localStorage;
  [...leadsSrc.matchAll(/then: \[([^\]]*)\]/g)].forEach((m) =>
    [...m[1].matchAll(/'([a-z-]+)'/g)].forEach(([, id]) => check(leadIds.has(id), `lead "${id}" exists`, `a lead points at "${id}" which does not exist`)),
  );
}

(async () => {
  await dataChecks();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.stack || e.message));
  const run = (fn, arg) => p.evaluate(fn, arg);
  const settle = (ms = 1500) => p.waitForTimeout(ms);
  const shot = (n) => p.screenshot({ path: path.join(OUT, n + '.png') });
  const go = async (opts) => {
    await run((o) => { __game.scene.getScene('island').scene.start('island', o); }, opts);
    await settle(2200);
  };
  const shown = (sel) => run((q) => { const e = document.querySelector(q); return !!e && !e.classList.contains('hidden'); }, sel);

  console.log('Boat menu and leads');
  await p.goto(URL);
  await settle(2500);
  await run(() => localStorage.clear());
  await p.reload();
  await settle(2500);
  await run(() => { __game.scene.start('island', { map: 'main' }); });
  await settle(2500);
  const labels = () => run(() => [...document.querySelectorAll('.sail-dest b')].map((e) => e.textContent));
  await run(() => { __game.scene.getScene('island').sail(); });
  await settle(500);
  let l = await labels();
  check(l.includes('Skull Isle'), 'the bottle note unlocks Skull Isle in the boat menu', `boat menu is ${JSON.stringify(l)}`);
  check(l.includes('Letters & leads'), 'the boat menu has Letters & leads', 'no Letters & leads entry');
  check(!l.some((x) => /Drowned|Badlands|Tomb|Temple|Thieves|Frozen/i.test(x)), 'islands without a lead stay hidden', `locked islands are showing: ${JSON.stringify(l)}`);
  await shot('1-boat-menu');
  await run(() => [...document.querySelectorAll('.sail-dest')].find((e) => /Letters/.test(e.textContent)).click());
  await settle(500);
  check(await shown('#leads'), 'Letters open', 'Letters did not open');
  check((await run(() => document.querySelectorAll('.lead-card').length)) === 1, 'one lead found so far', 'expected one lead card');
  await shot('2-letters');
  await run(() => document.querySelector('.lead-sail').click());
  await settle(700);
  check(await shown('#boat-scene'), 'the boat scene plays', 'no boat scene');
  await shot('3-boat');
  await settle(4000);
  check(await run(() => __game.scene.getScene('island').mapId === 'exp-pirate'), 'sailed to Skull Isle', 'did not arrive on Skull Isle');
  check(!(await shown('#boat-scene')), 'the boat scene clears', 'boat scene stuck');

  console.log('Skull Isle');
  check(await run(() => !!__game.scene.getScene('island').exp), 'expedition is running', 'no expedition on the island');
  check((await run(() => document.getElementById('exp-hud')?.textContent || '')).includes('chart'), 'the goal shows at the top', 'no goal text');
  await shot('4-arrive');
  // the chest does nothing without the key
  await run(() => { const s = __game.scene.getScene('island'); const it = s.exp.items.find((i) => i.sp.k === 'chest'); s.player.setPosition(it.px, it.py + 10); s.facing = 'up'; });
  await settle(400);
  await run(() => { const s = __game.scene.getScene('island'); s.interact(); });
  check(!(await shown('#exp-card')), 'the chest stays shut without the key', 'chest opened with no key');
  // read the chart
  await run(() => { const s = __game.scene.getScene('island'); const it = s.exp.items.find((i) => i.sp.k === 'note'); s.player.setPosition(it.px, it.py + 10); s.facing = 'up'; });
  await settle(400);
  await run(() => { __game.scene.getScene('island').interact(); });
  await settle(300);
  check(await shown('#exp-card'), 'the chart opens', 'the chart did not open');
  await run(() => document.querySelector('.exp-ok').click());
  await settle(300);
  check(await run(() => __game.scene.getScene('island').exp.flags.has('map')), 'taking the chart sets the map flag', 'map flag not set');
  check(await run(() => { const it = __game.scene.getScene('island').exp.items.find((i) => i.sp.x_mark); return !it.hidden; }), 'the X appears', 'the X did not appear');
  // dig the X
  const brush = async () => {
    await p.waitForSelector('#dig:not(.hidden)');
    const r = await run(() => { const c = document.querySelector('.dig-canvas').getBoundingClientRect(); return { x: c.x, y: c.y, w: c.width, h: c.height }; });
    for (let y = 6; y < r.h; y += 12) {
      await p.mouse.move(r.x + 4, r.y + y);
      await p.mouse.down();
      await p.mouse.move(r.x + r.w - 4, r.y + y, { steps: 6 });
      await p.mouse.up();
    }
    await settle(300);
  };
  await run(() => { const s = __game.scene.getScene('island'); const it = s.exp.items.find((i) => i.sp.x_mark); s.player.setPosition(it.px, it.py + 6); });
  await settle(400);
  await run(() => { __game.scene.getScene('island').interact(); });
  await brush();
  check(/found/i.test(await run(() => (document.querySelector('.dig-title')?.textContent || document.getElementById('dig')?.outerHTML.slice(0, 400) || 'no #dig'))), 'digging the X turns up a find', 'dig did not finish');
  await shot('5-dug');
  await run(() => document.querySelector('.dig-close').click());
  await settle(300);
  check(await run(() => __game.scene.getScene('island').exp.flags.has('key')), 'the X gives the key', 'no key flag');
  const dirtyN = () => run(() => Object.values(JSON.parse(localStorage.getItem('curation.codex') || '{}').dirty || {}).reduce((a, b) => a + b, 0));
  const where1 = await run(() => JSON.parse(localStorage.getItem('curation.expedition')).where);
  check((await dirtyN()) === 1, 'the find is in your bag, dirty (Restoration Studio contract)', `dirty count is ${await dirtyN()}`);
  check(Object.values(where1).length === 1 && Object.values(where1)[0] === 'Skull Isle', 'it remembers it came from Skull Isle', `where: ${JSON.stringify(where1)}`);

  // being caught is gentle
  await run(() => { const s = __game.scene.getScene('island'); const g = s.exp.patrols[0]; s.player.setPosition(g.sprite.x, g.sprite.y); g.state = 'chase'; });
  await settle(1800);
  const back = await run(() => { const s = __game.scene.getScene('island'); const l = s.landingSpot; return { d: Math.hypot(s.player.x - l.x, s.player.y - l.y), paused: s.paused, key: s.exp.flags.has('key') }; });
  check(back.d < 40 && !back.paused, 'caught: back at the boat, game running again', `after being caught: ${JSON.stringify(back)}`);
  check(back.key, 'caught: the key is kept', 'caught: lost the key');
  await shot('6-caught');

  // long grass hides you
  const hid = await run(() => {
    const s = __game.scene.getScene('island');
    const g = s.exp.patrols[0];
    const [cell] = [...s.grassCells];
    const [cx, cy] = cell.split(',').map(Number);
    s.player.setPosition((cx + 0.5) * 32, (cy + 1) * 32 - 4);
    g.sprite.setPosition(s.player.x - 40, s.player.y);
    g.face = [1, 0];
    g.state = 'walk';
    s.exp.patrol(0.016);
    return g.state;
  });
  check(hid === 'walk', 'a pirate walking past does not spot you in the long grass', `spotted in the grass (${hid})`);

  // open the chest
  await run(() => { const s = __game.scene.getScene('island'); s.exp.patrols.forEach((g) => (g.sprite.x = -999)); const it = s.exp.items.find((i) => i.sp.k === 'chest'); s.player.setPosition(it.px, it.py + 10); s.facing = 'up'; });
  await settle(400);
  await run(() => { __game.scene.getScene('island').interact(); });
  await settle(400);
  check(await shown('#exp-card'), 'the chest opens with the key', 'chest did not open');
  check((await run(() => document.querySelectorAll('.exp-find').length)) === 3, 'three finds in the chest', 'expected three finds on the card');
  await shot('7-chest');
  await run(() => document.querySelector('.exp-ok').click());
  await settle(500);
  check(await shown('#exp-card'), 'the trip-done card shows', 'no trip-done card');
  await shot('8-done');
  await run(() => document.querySelector('.exp-ok').click());
  await settle(300);
  const st = await run(() => JSON.parse(localStorage.getItem('curation.expedition')));
  check(st.done.pirate === 1 && (await dirtyN()) === 4, 'the trip is recorded and four dirty finds are in your bag', `expedition save: ${JSON.stringify(st).slice(0, 200)}, dirty ${await dirtyN()}`);
  const leads = await run(() => Object.keys(JSON.parse(localStorage.getItem('curation.leads')).found));
  check(leads.includes('clerk-letter') && leads.includes('anning-rumour'), 'finishing hands out the next leads', `leads: ${leads}`);

  console.log('Home again');
  await go({ map: 'main', spawn: 'dock' });
  const where = await run(() => JSON.parse(localStorage.getItem('curation.expedition')).where);
  check(Object.keys(where).length >= 1 && Object.values(where).every((w) => w === 'Skull Isle'), 'the plaque knows they came from Skull Isle', `where: ${JSON.stringify(where)}`);
  // a story chapter (chat 10) offers a lead: that island opens up too
  await run(() => localStorage.setItem('curation.leads_offered', JSON.stringify([{ id: 'heist-hideout', text: 'Edmund has a hunch about a hideout on a far island.', from: 'Edmund', at: Date.now() }])));
  await run(() => { __game.scene.getScene('island').sail(); });
  await settle(400);
  l = await labels();
  check(l.includes('Skull Isle'), 'Skull Isle can be revisited', `boat menu is ${JSON.stringify(l)}`);
  check(l.includes('Thieves’ Rock'), 'a lead offered by a story chapter opens Thieves’ Rock', `boat menu is ${JSON.stringify(l)}`);
  await shot('9-boat-menu-2');

  console.log('Every island is reachable');
  await run(() => document.querySelector('.sail-stay').click());
  const ids = fs.readdirSync(path.join(__dirname, '..', 'src', 'maps')).map((f) => f.match(/^exp-(.+)\.json$/)?.[1]).filter(Boolean);
  for (const id of ids) {
    await go({ map: `exp-${id}`, spawn: 'dock' });
    const r = await run(() => {
      const s = __game.scene.getScene('island');
      const e = s.exp;
      // open every gate for the check: a gate only ever stands where a route is meant to be shut for a while
      e.items.filter((i) => i.sp.k === 'gate').forEach((i) => { for (let k = 0; k < (i.sp.w || 1); k++) s.solid[i.sp.y][i.sp.x + k] = false; });
      const ok = (cx, cy) => cx >= 0 && cy >= 0 && cx < s.solid[0].length && cy < s.solid.length && s.free(cx * 32 + 16, cy * 32 + 30);
      const L = s.landingSpot;
      const start = [Math.floor(L.x / 32), Math.floor(L.y / 32)];
      const seen = new Set([start.join()]);
      const q = [start];
      while (q.length) {
        const [x, y] = q.pop();
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const k = [x + dx, y + dy].join();
          if (!seen.has(k) && ok(x + dx, y + dy)) {
            seen.add(k);
            q.push([x + dx, y + dy]);
          }
        });
      }
      const near = (x, y) => [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [-1, 1]].some(([dx, dy]) => seen.has([x + dx, y + dy].join()));
      const lost = e.items.filter((i) => !near(i.sp.x, i.sp.y)).map((i) => `${i.sp.k}@${i.sp.x},${i.sp.y}`);
      const stuck = e.patrols.flatMap((g) => g.p.path.filter(([x, y]) => !seen.has([x, y].join()))).map(([x, y]) => `patrol@${x},${y}`);
      return { lost, stuck, size: seen.size, title: s.map.name };
    });
    check(r.size > 150 && !r.lost.length && !r.stuck.length, `${r.title}: every spot and patrol route can be reached (${r.size} tiles)`, `${id}: cannot reach ${[...r.lost, ...r.stuck].join(', ')} (${r.size} tiles walkable)`);
    await p.screenshot({ path: path.join(OUT, `island-${id}.png`) });
  }

  check(errs.length === 0, 'no page errors', 'page errors:\n' + errs.join('\n'));
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
