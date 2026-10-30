// Friends you can call (src/progression/companions.js, src/companion.js, src/ui/phone.js): the
// number after their ten-heart favour, once a day for half an hour, the phone's rest, their help,
// and on an island: the phone, the quick arrival, following you, the boat, a story while you fish.
// Usage: PW=/path/to/playwright node tests/companions.cjs      (preview server on :4173)
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/';
const root = path.join(__dirname, '..');
const load = (p) => import(path.join(root, p));
const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));

(async () => {
  console.log('The rules (headless)');
  const [st, svc, mods, clk, rngm, cm] = await Promise.all(['store', 'service', 'modules', 'clock', 'rng', 'companions'].map((m) => load(`src/progression/${m}.js`)));
  const box = { t: Date.UTC(2026, 5, 10, 12) };
  const p = svc.createProgression({ store: st.createStore(st.memoryAdapter(), { now: box.t }), clock: clk.createClock({ now: () => box.t }), rng: rngm.createRng(3), modules: mods.standardModules() });
  p.start();
  check(p.companions.contacts().length === 0, 'nobody on the phone at first', 'contacts before any friend');
  // Bram at ten hearts with his favour: bring the last thing
  p.friendship.addPoints('bram', 1000);
  const f = p.state.friends.bram;
  check(f.hearts === 10 && f.quest && !f.quest.done, 'ten hearts opens his favour', `no favour ${JSON.stringify(f.quest)}`);
  f.quest.step = f.quest.items.length - 1;
  const last = f.quest.items.at(-1);
  if (last.startsWith('gift:')) p.state.gifts.stock[last.slice(5)] = 1;
  else p.state.fish.bag.push({ id: last.slice(5), size: 30 });
  f.giftDay = 0;
  const g = p.friendship.give('bram', last);
  check(g.ok && f.quest.done && p.companions.hasNumber('bram'), 'finishing his favour gives you his number', `no number ${JSON.stringify(g)}`);
  check(p.companions.contacts().map((c) => c.id).join() === 'bram', 'he is on the phone', 'not on the phone');
  check(p.companions.call('bram').ok && p.companions.current() === 'bram', 'calling him: he comes', 'call failed');
  check(p.companions.luck() > 1, 'a fisher along: rarer fish bite more', 'no luck');
  const before = p.state.skills.exploring;
  p.skillXp('exploring', 10, { silent: true });
  check(Math.abs(p.state.skills.exploring - before - 10) < 1e-6, '(his help is fishing luck, not other skills)', 'wrong boost');
  check(!p.companions.tick(29 * 60 * 1000) && p.companions.tick(2 * 60 * 1000), 'he stays half an hour', 'time wrong');
  p.companions.end();
  check(!p.companions.current() && p.companions.contacts()[0].status === 'today', 'then he heads home until tomorrow', `status ${p.companions.contacts()[0].status}`);
  // Ines: +25% Fishing skill, and the phone rests a few minutes after someone leaves
  p.friendship.addPoints('ines', 1000);
  Object.assign(p.state.friends.ines, { quest: { step: 2, items: [], done: true } });
  check(p.companions.contacts().find((c) => c.id === 'ines').status === 'cool', 'the phone rests a few minutes after a friend leaves', 'no rest');
  box.t += 6 * 60 * 1000;
  check(p.companions.call('ines').ok, 'then you can call the next friend', 'call after the rest failed');
  const fb = p.state.skills.fishing;
  p.skillXp('fishing', 8, { silent: true });
  check(Math.abs(p.state.skills.fishing - fb - 10) < 1e-6, 'a diver along: +25% Fishing skill XP', `fishing +${p.state.skills.fishing - fb}`);
  p.companions.end();
  box.t += 24 * 3600e3;
  p.start();
  check(p.companions.contacts().find((c) => c.id === 'bram').status === 'free', 'the next day he can come again', 'still busy the next day');
  // every friend has the lines the game uses
  const LINES = require(path.join(root, 'src/progression/data/companion-lines.json'));
  const all = (id) => ({ ...cm.COMPANIONS[id], ...LINES[id] });
  const keys = ['boost', 'number', 'hello', 'late', 'bye', 'stories', 'facts', 'sayings', 'walk'];
  const bad = cm.COMPANION_IDS.filter((id) => keys.some((k) => !all(id)[k] || (Array.isArray(all(id)[k]) && !all(id)[k].length)));
  check(!bad.length && cm.COMPANION_IDS.length >= 10, `${cm.COMPANION_IDS.length} friends, each with all their lines`, `missing lines: ${bad}`);

  console.log('On an island');
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.stack || e.message));
  await pg.goto(URL + '?hour=12&season=summer&weather=clear&holiday=none&debug=1');
  await pg.waitForFunction(() => window.__game && __game.scene.getScenes(true).length > 0, null, { timeout: 30000 });
  await pg.waitForTimeout(1200);
  const vis = (sel) => pg.evaluate((s) => { const e = document.querySelector(s); return !!e && !e.classList.contains('hidden'); }, sel);
  await pg.evaluate(() => __game.scene.getScene('room').scene.start('island', { map: 'main' }));
  await pg.waitForFunction(() => __game.scene.isActive('island'));
  await pg.waitForTimeout(2000);
  check(!(await vis('#phone-btn')), 'no phone until a friend gives you their number', 'phone shows with no friends');
  await pg.evaluate(() => [...document.querySelectorAll('#debug-panel button')].find((x) => x.textContent === 'friends: all numbers').click());
  await pg.evaluate(() => (document.getElementById('debug-panel').style.display = 'none'));
  await pg.waitForTimeout(1300);
  check(await vis('#phone-btn'), 'then a Phone button under the Journal', 'no phone button');
  await pg.click('#phone-btn');
  await pg.waitForTimeout(300);
  check((await pg.locator('#phone .ph-row').count()) >= 10, 'the phone lists your friends', 'empty phone');
  await pg.locator('#phone .ph-row', { hasText: 'Bram' }).locator('.ph-call').click();
  await pg.waitForTimeout(800);
  const came = await pg.evaluate(() => { const s = __game.scene.getScene('island'); return { id: s.buddy?.id, d: s.buddy && Math.hypot(s.buddy.s.x - s.player.x, s.buddy.s.y - s.player.y), paused: s.paused, talk: document.querySelector('#talk')?.textContent || '' }; });
  check(came.id === 'bram' && came.d < 40 && !came.paused, 'he blinks in right next to you', `arrival ${JSON.stringify(came)}`);
  check(/Bram/.test(came.talk), 'and says hello', `no hello: ${came.talk}`);
  await pg.evaluate(async () => {
    const s = __game.scene.getScene('island');
    s.dragging = true; s.dragVec = { x: 0, y: 1 }; s.dragMag = 1;
    await new Promise((r) => setTimeout(r, 1500));
    s.dragging = false; s.dragVec = null;
  });
  await pg.waitForTimeout(800);
  const fol = await pg.evaluate(() => { const s = __game.scene.getScene('island'); return Math.hypot(s.buddy.s.x - s.player.x, s.buddy.s.y - s.player.y); });
  check(fol < 60, `he follows you (${Math.round(fol)} px behind)`, `left behind ${Math.round(fol)} px`);
  // into the boat together, and a story while you wait for a bite
  await pg.evaluate(() => {
    const s = __game.scene.getScene('island');
    for (let y = 5; y < 70; y++) for (let x = 2; x < 70; x++) {
      const px = x * 32 + 16, py = y * 32 + 16;
      if (s.walkFree(px, py) && !s.walkFree(px - 32, py) && s.row.wet(px - 40, py - 4) && !s.boats.some((q) => Math.hypot(q.x - px, q.y - py) < 300)) { s.player.setPosition(px, py); s.facing = 'left'; return; }
    }
  });
  await pg.waitForTimeout(700);
  await pg.click('#rowbtn');
  await pg.waitForTimeout(1000);
  await pg.evaluate(async () => {
    const s = __game.scene.getScene('island');
    s.dragging = true; s.dragVec = { x: -1, y: 0 }; s.dragMag = 1;
    await new Promise((r) => setTimeout(r, 600));
    s.dragging = false; s.dragVec = null;
  });
  await pg.waitForTimeout(400);
  const boat = await pg.evaluate(() => { const s = __game.scene.getScene('island'); return { rowing: !!s.row.on, seated: !!s.buddy.seated, d: Math.hypot(s.buddy.s.x - s.player.x, s.buddy.s.y - s.player.y) }; });
  check(boat.rowing && boat.seated && boat.d < 20, 'he rides in the back of your boat', `boat ${JSON.stringify(boat)}`);
  await pg.evaluate(() => { const s = __game.scene.getScene('island'); s.update(0, 16); });
  if ((await pg.locator('#interact .label').textContent()) === 'Fish') {
    await pg.evaluate(() => (window.__hideTalk = 1));
    await pg.click('#interact');
    await pg.waitForTimeout(4000);
    const said = await pg.evaluate(() => document.querySelector('#talk:not(.hidden)')?.textContent || '');
    check(/Bram/.test(said), 'while you wait for a bite he tells you something', 'no story while fishing');
  } else fail('no Fish button from the boat');
  // send him home from the phone
  await pg.evaluate(() => { const s = __game.scene.getScene('island'); s.fishing.end?.(); });
  await pg.waitForTimeout(300);
  await pg.click('#phone-btn');
  await pg.waitForTimeout(300);
  await pg.locator('#phone .ph-row', { hasText: 'Bram' }).locator('.ph-call').click();
  await pg.waitForTimeout(3400);
  const home = await pg.evaluate(() => { const s = __game.scene.getScene('island'); return { buddy: !!s.buddy, cur: s.buddy?.id || '' }; });
  check(!home.buddy, '"Say bye" sends him home', `still here ${JSON.stringify(home)}`);
  check(errs.length === 0, 'no page errors', `page errors: ${errs.slice(0, 2).join(' | ')}`);
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
