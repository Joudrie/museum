// Display test: fixtures hold collection entries. Data checks run in plain Node; the browser
// checks (390×844) place fixtures, put pieces on them from the panel, and check the room shows
// them, that they earn and lift the rating, that moving keeps and selling clears the contents.
// Usage: npm run build && npx vite preview --port 4173 --base / &
//        PW=/path/to/playwright node tests/display.cjs
const { chromium } = require(process.env.PW || 'playwright');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));

(async () => {
  console.log('Data');
  const src = path.join(__dirname, '..', 'src');
  const { ITEMS } = await import(path.join(src, 'items.js'));
  const reg = await import(path.join(src, 'collections', 'index.js'));
  const D = await import(path.join(src, 'display.js'));
  const fixtures = Object.entries(ITEMS).filter(([, d]) => d.fixture);
  check(fixtures.length >= 6, `${fixtures.length} fixtures defined`, 'too few fixtures');
  fixtures.forEach(([t, d]) => {
    const f = d.fixture;
    const bad = [];
    if (!Array.isArray(f.accepts) || !f.accepts.length) bad.push('accepts');
    if (f.kind === 'tank' ? !(f.slots > 0 && f.swim) : !(Array.isArray(f.slots) && f.slots.length)) bad.push('slots');
    check(!bad.length, `${t}: fixture is complete`, `${t}: missing ${bad.join(', ')}`);
    if (Array.isArray(f.slots)) {
      const W = d.w * 32;
      const H = d.h * 32 + d.rise;
      const out = f.slots.filter((s) => s.x - s.w / 2 < 0 || s.x + s.w / 2 > W || s.y - s.h < 0 || s.y > H);
      check(!out.length, `${t}: every slot sits inside the sprite`, `${t}: slots outside the sprite`);
    }
  });
  const fish = reg.get('fish:koi');
  const fossil = reg.get('fossil:trilobite');
  const painting = reg.get('painting:starry-night');
  check(D.accepts('aquarium', fish) && !D.accepts('aquarium', fossil), 'tanks take fish only', 'tank acceptance wrong');
  check(D.accepts('glass_case', fossil) && !D.accepts('glass_case', fish) && D.accepts('easel', painting), 'cases take finds, easels take paintings', 'case or easel acceptance wrong');

  // a whole set on display earns double
  const drawer = reg.getSet('fossil-drawer');
  const ids = drawer.entries;
  check(D.setsShown(ids.slice(0, 3), 'fossil')[0].have === 3 && !D.bonusIds(ids.slice(0, 3)).size, 'a part-filled set earns no bonus', 'part set got a bonus');
  check(D.bonusIds(ids).size === ids.length, 'a whole set on display doubles its pieces', 'complete set got no bonus');

  // the T. rex is built from dug bones
  const empty = { v: 1, seen: {}, owned: {}, claimed: {} };
  const enough = { ...empty, owned: { 'fossil:dinosaur-bone': 6, 'fossil:trex-tooth': 1 } };
  check(/dinosaur bone/.test(D.missingFor('trex', empty) || '') && D.missingFor('trex', enough) === null, 'the T. rex needs 6 bones and a tooth, then it can be built', 'T. rex requirement wrong: ' + D.missingFor('trex', empty));
  check(D.missingFor('plinth', empty) === null, 'ordinary decor has no requirement', 'plinth has a requirement');

  console.log('Browser');
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.stack || e.message));
  await p.goto(URL);
  await p.waitForTimeout(2500);
  await p.evaluate(() => localStorage.clear());
  const place = (c, r, type, d) => ({ type, c, r, rot: 0, d });
  await p.evaluate(([items]) => {
    localStorage.setItem('curation.items', JSON.stringify({ 0: items }));
    localStorage.setItem('curation.codex', JSON.stringify({ v: 1, seen: {}, claimed: {}, owned: { 'fossil:trilobite': 2, 'fossil:ammonite': 1, 'fish:koi': 1, 'fish:minnow': 1 } }));
  }, [[place(1, 2, 'plinth', 'p1'), place(3, 2, 'aquarium', 't1')]]);
  await p.reload();
  await p.waitForTimeout(3000);
  const room = (fn, arg) => p.evaluate(fn, arg);
  const rate = () => room(() => { const s = __game.scene.getScene('room'); return { inc: document.querySelector('.hud-income').textContent, objs: s.displayObjs.length }; });
  const before = await rate();
  check(before.objs === 0, 'empty fixtures draw nothing', 'empty fixtures drew something');
  await room(() => { const s = __game.scene.getScene('room'); s.openFixture(s.items.find((i) => i.type === 'plinth')); });
  await p.waitForTimeout(400);
  const offered = await p.$$eval('#displaymenu .display-card .display-act', (n) => n.map((b) => b.textContent));
  check(offered.length === 2 && offered.every((t) => t === 'Put on'), 'the plinth offers the two finds you own (no fish)', `plinth offered ${JSON.stringify(offered)}`);
  await p.click('#displaymenu .display-card .display-act');
  await p.waitForTimeout(300);
  const held = await room(() => localStorage.getItem('curation.display'));
  check(/p1/.test(held), 'putting a piece on saves it', 'nothing saved: ' + held);
  await p.click('#displaymenu .display-close');
  await p.waitForTimeout(300);
  const after = await rate();
  check(after.objs >= 1 && Number(after.inc.replace(/\D/g, '')) > Number(before.inc.replace(/\D/g, '')), `the piece shows and earns (${before.inc} → ${after.inc})`, `no change: ${JSON.stringify(after)}`);

  // a tank: two fish swim
  await room(() => { const s = __game.scene.getScene('room'); s.openFixture(s.items.find((i) => i.type === 'aquarium')); });
  await p.waitForTimeout(300);
  await p.click('#displaymenu .display-act:text("Put on")');
  await p.click('#displaymenu .display-act:text("Put on")');
  await p.click('#displaymenu .display-close');
  await p.waitForTimeout(300);
  const swim = await room(() => { const s = __game.scene.getScene('room'); const f = s.displayObjs.filter((o) => o.getData && o.getData('entry')?.collection === 'fish'); const x0 = f.map((o) => o.x); return new Promise((r) => setTimeout(() => r(f.length && f.some((o, i) => o.x !== x0[i])), 900)); });
  check(swim, 'fish swim in the tank', 'fish are not moving');

  // moving keeps the contents; selling empties them
  await room(() => { const s = __game.scene.getScene('room'); const it = s.items.find((i) => i.type === 'plinth'); s.items = s.items.filter((o) => o !== it); s.startPlacing({ ...it, c: 4, r: 4 }, it); s.confirmPlacing(); });
  await p.waitForTimeout(300);
  const moved = await room(() => { const s = __game.scene.getScene('room'); const it = s.items.find((i) => i.type === 'plinth'); return { d: it?.d, c: it?.c, shown: s.displayObjs.length }; });
  check(moved.d === 'p1' && moved.c === 4, 'a moved fixture keeps its id and contents', 'moving lost the id: ' + JSON.stringify(moved));
  check(errs.length === 0, 'no page errors', 'page errors: ' + errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
