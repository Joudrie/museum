// Dig test: every dig kind opens, and brushing it clean pays out a find of the right collection.
// Usage: npm run build && npx vite preview --port 4173 --base / &  then  PW=playwright OUT=dir node tests/dig.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'dig-shots';
fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const check = (c, good, bad) => (c ? console.log('  ✓ ' + good) : (problems.push(bad), console.log('  ✗ ' + bad)));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(1500);
  const kinds = { mineral: 'mineral', fossil: 'fossil', ruin: ['pottery', 'coin', 'arrowhead'], shore: 'shell', crater: 'meteorite' };
  for (const [kind, cols] of Object.entries(kinds)) {
    const r = await page.evaluate(async (kind) => {
      const dig = await import('/src/dig.js');
      const done = new Promise((res) => dig.startDig('test:' + kind, { collection: kind, onClose: res }));
      const h = document.querySelector('#dig .dig-canvas');
      return { open: dig.digOpen(), size: h.width };
    }, kind).catch((e) => ({ err: String(e) }));
    check(!r.err && r.open, `${kind}: dig patch opens`, `${kind}: ${r.err || 'did not open'}`);
    await page.screenshot({ path: `${OUT}/dig-${kind}.png` });
    await page.evaluate(() => document.querySelector('#dig .dig-close').click());
  }
  // tools: the brush favours rare finds, the pick the common ones; tools unlock as you find things
  const t = await page.evaluate(async () => {
    const dig = await import('/src/dig.js');
    const reg = await import('/src/collections/index.js');
    const es = dig.entriesFor('mineral');
    const rare = (tool) => { let n = 0; for (let i = 0; i < 4000; i++) if (dig.pick(es, Math.random, tool).rarity >= 3) n++; return n; };
    return { brush: rare('brush'), pick: rare('pick'), locked: [dig.toolUnlocked('trowel', 0), dig.toolUnlocked('trowel', 6), dig.toolUnlocked('pick', 15), dig.toolUnlocked('pick', 16)] };
  });
  check(t.brush > t.pick * 1.5, `brush turns up more rare finds than the pick (${t.brush} vs ${t.pick})`, `tool odds wrong: ${JSON.stringify(t)}`);
  check(t.locked.join() === 'false,true,false,true', 'tools unlock at 6 and 16 finds', `unlock thresholds wrong: ${t.locked}`);

  // sites: touching spots of one kind form a site; the bonus waits until every tile rests
  const st = await page.evaluate(async () => {
    localStorage.clear();
    const dig = await import('/src/dig.js');
    const sp = (x, y, kind = 'fossil') => ({ gx: x, gy: y, kind, key: `t:${x},${y}` });
    const spots = [sp(1, 1), sp(2, 1), sp(3, 2), sp(9, 9), sp(2, 2, 'ruin')];
    const site = dig.siteOf(spots[0], spots);
    const before = dig.siteBonusReady(site);
    const t = JSON.parse(localStorage.getItem('curation.digs') || '{}');
    site.forEach((s) => (t[s.key] = Date.now() + 60000));
    localStorage.setItem('curation.digs', JSON.stringify(t));
    const after = dig.siteBonusReady(site);
    t[dig.siteKey(site)] = Date.now() + 60000;
    localStorage.setItem('curation.digs', JSON.stringify(t));
    return { n: site.length, before, after, taken: dig.siteBonusReady(site), tiles: !!dig.DIG_TILES.dig_cliff && !!dig.DIG_TILES.dig_trench, bonus: dig.bonusEntry('fossil').id };
  });
  check(st.n === 3 && !st.before && st.after && !st.taken && st.tiles, `a 3-tile site gives its bonus once all tiles rest (${st.bonus})`, 'site logic wrong: ' + JSON.stringify(st));

  // a skeleton takes six digs; the codex only gets it on the last one
  const p = await page.evaluate(async () => {
    localStorage.clear();
    const dig = await import('/src/dig.js');
    const codex = await import('/src/collections/codex.js');
    const reg = await import('/src/collections/index.js');
    const e = reg.get('fossil:trex-skeleton');
    const steps = [];
    for (let i = 0; i < e.parts; i++) {
      const h = dig.startDig('test:skel' + i, { collection: 'fossil', entry: e, onClose() {} });
      h.finish();
      document.querySelector('#dig .dig-close').click();
      steps.push([dig.partsOf(e.id), codex.ownedCount(e.id), codex.snapshot().dirty[e.id] || 0]);
    }
    return steps;
  });
  check(p.slice(0, 5).every((s, i) => s[0] === i + 1 && s[1] === 0) && p[5][0] === 0 && p[5][1] === 1 && p[5][2] === 1, 'a six-part skeleton completes on the sixth dig and arrives dirty', 'parts wrong: ' + JSON.stringify(p));
  check(!errors.length, 'no page errors', 'page errors: ' + errors.join(' | '));
  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
