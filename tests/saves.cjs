// Corrupt-save check: fills every localStorage key the game uses with broken data (bad JSON, the wrong
// type, nested junk) and makes sure the game still opens: no page error, no crash screen, a scene running.
// Also checks that an unreadable save is kept under curation.bak.<key>.
// Usage: PW=/path/to/playwright node tests/saves.cjs   (preview on :4173)
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
let bad = 0;
const ok = (c, m) => {
  console.log(`${c ? '  ✓' : '  ✗'} ${m}`);
  if (!c) bad++;
};
const VARIANTS = {
  'bad json': '{"oops": [1,',
  'null': 'null',
  'empty array': '[]',
  'a string': '"hello"',
  'a number': '12345',
  'nested junk': '{"a":[null,{"b":[[],{}]}],"owned":"x","caught":5,"items":7,"slots":"no","rooms":{"0":null}}',
  'array of junk': '[null,1,"x",{"a":{}},[[]]]',
};

(async () => {
  const b = await chromium.launch();
  const open = async (init, label) => {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.route('https://upload.wikimedia.org/**', (r) => r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"/>' }));
    await p.goto(URL);
    await p.waitForTimeout(2500);
    return { ctx, p, errs, label };
  };
  const check = async ({ ctx, p, errs, label }) => {
    await p.waitForTimeout(1800);
    const crash = await p.$('#crash');
    const alive = await p.evaluate(() => __game.scene.getScenes(true).length > 0);
    ok(!crash && alive && !errs.length, `${label}${errs.length ? '  ' + errs[0].slice(0, 120) : crash ? '  (crash screen)' : alive ? '' : '  (no scene running)'}`);
    await ctx.close();
  };

  // a normal save first, to learn which keys the game writes
  const first = await open();
  await first.p.evaluate(() => { __game.scene.getScene('room').travel(1, 'entrance', true); });
  await first.p.waitForTimeout(1500);
  await first.p.evaluate(() => { __game.scene.getScene('room').scene.stop(); __game.scene.start('island', { map: 'main' }); });
  await first.p.waitForTimeout(2000);
  // every key named anywhere in the game's source (the ones a fresh save hasn't written yet too)
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'wakefield' ? [] : walk(path.join(d, e.name))) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));
  const fromSource = walk('src').flatMap((f) => [...fs.readFileSync(f, 'utf8').matchAll(/['"`](curation\.[\w.]+)['"`]/g)].map((m) => m[1]));
  const keys = [...new Set([...fromSource, ...(await first.p.evaluate(() => Object.keys(localStorage)))])].filter((k) => !k.startsWith('curation.bak.') && !k.startsWith('curation.mapbuilder') && k !== 'curation.playtest' && !k.endsWith('.'));
  const snapshot = await first.p.evaluate(() => ({ ...localStorage }));
  await first.ctx.close();
  ok(keys.length >= 20, `the game writes ${keys.length} save keys`);

  console.log('Every key broken at once');
  for (const [name, raw] of Object.entries(VARIANTS)) {
    const s = await open();
    await s.p.evaluate(([ks, r]) => { ks.forEach((k) => localStorage.setItem(k, r)); }, [keys, raw]);
    await s.p.reload();
    s.label = name;
    await check(s);
  }

  console.log('One key broken at a time (nested junk), the rest normal');
  for (const k of keys) {
    const s = await open();
    await s.p.evaluate(([snap, key, raw]) => { Object.entries(snap).forEach(([a, v]) => localStorage.setItem(a, v)); localStorage.setItem(key, raw); }, [snapshot, k, VARIANTS['nested junk']]);
    await s.p.reload();
    s.label = k;
    await check(s);
  }

  // an unreadable save is kept
  const s = await open();
  await s.p.evaluate(() => { localStorage.setItem('curation.settings', '{broken'); });
  await s.p.reload();
  await s.p.waitForTimeout(1500);
  const kept = await s.p.evaluate(() => localStorage.getItem('curation.bak.curation.settings'));
  ok(kept === '{broken', 'an unreadable save is kept under curation.bak.<key>');
  await s.ctx.close();

  // Reset takes two taps and keeps the old save
  const r = await open();
  await r.p.evaluate(() => { localStorage.setItem('curation.coins', '777'); });
  await r.p.click('#settings-btn');
  await r.p.waitForTimeout(500);
  const resetBtn = r.p.locator('button.danger', { hasText: 'Reset museum' });
  await resetBtn.click();
  await r.p.waitForTimeout(300);
  ok((await r.p.evaluate(() => localStorage.getItem('curation.bak.reset'))) === null, 'one tap on Reset does nothing yet');
  await r.p.locator('button.danger').click();
  await r.p.waitForTimeout(800);
  const bak = await r.p.evaluate(() => localStorage.getItem('curation.bak.reset'));
  ok(bak && JSON.parse(bak).snap['curation.coins'] === '777', 'the second tap keeps the old save first');
  await r.ctx.close();
  await b.close();
  console.log(bad ? `\n${bad} problem(s)` : '\nAll good');
  process.exit(bad ? 1 : 0);
})();
