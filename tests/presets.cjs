// Room presets: save a layout, change the room, load it back. Needs the preview server (npm run build && npx vite preview --port 4173).
const { chromium } = require(process.env.PW || 'playwright');
const { openGroup } = require('./nav.cjs');
const URL = process.env.URL || 'http://localhost:4173/';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  let bad = 0;
  const ok = (m) => console.log('  ✓ ' + m);
  const fail = (m) => { bad++; console.log('  ✗ ' + m); };
  await p.goto(URL);
  await p.waitForTimeout(2500);
  await p.evaluate(() => {
    localStorage.setItem('curation.items', JSON.stringify({ 0: [{ type: 'tree', c: 0, r: 6, rot: 0 }] }));
    localStorage.setItem('curation.roomDecor', JSON.stringify({ 0: { light: 'moody' } }));
    __game.scene.getScene('room').scene.restart({ room: 0, spawn: 'entrance', instant: true });
  });
  await p.waitForTimeout(1200);
  await p.click('#home-btn');
  await p.waitForTimeout(400);
  await openGroup(p, 'room');
  await p.fill('.presets input', 'Winter');
  await p.click('text=Save layout');
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('curation.roomPresets') || '[]'));
  if (saved.length === 1 && saved[0].name === 'Winter' && saved[0].items.length === 1 && saved[0].decor.light === 'moody') ok('layout saved');
  else fail('save gave ' + JSON.stringify(saved));
  // change the room, then load the preset back
  await p.evaluate(() => {
    localStorage.setItem('curation.items', JSON.stringify({ 0: [] }));
    localStorage.setItem('curation.roomDecor', JSON.stringify({ 0: { light: 'day' } }));
  });
  await p.click('.presets .choices button:has-text("Winter")');
  await p.waitForTimeout(1500);
  const after = await p.evaluate(() => ({ items: JSON.parse(localStorage.getItem('curation.items'))[0], decor: JSON.parse(localStorage.getItem('curation.roomDecor'))[0] }));
  if (after.items.length === 1 && after.decor.light === 'moody') ok('layout loaded back');
  else fail('load gave ' + JSON.stringify(after));
  if (errs.length) fail('page errors: ' + errs.join('; '));
  await b.close();
  console.log(bad ? `${bad} failed` : 'All good');
  process.exit(bad ? 1 : 0);
})();
