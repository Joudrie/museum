// Wardrobe (docs/PEOPLE-SPRITES.md, "Wardrobe"): every costume draws on the curator, things to hold and
// on the shoulder show, the shop's hats and outfits are drawn into the sprite (indoors and out), and a
// locked costume can't be picked until its quest unlocks it.
// Usage: npm run build && npx vite preview --port 4173 --base / &  then  node tests/wardrobe.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'test-shots';
fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const check = (c, good, bad) => (c ? console.log('  ✓ ' + good) : (problems.push(bad), console.log('  ✗ ' + bad)));
const src = (f) => import(pathToFileURL(path.join(__dirname, '..', 'src', f)).href);
const store = {};
globalThis.localStorage = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => (store[k] = String(v)), removeItem: (k) => delete store[k] };

(async () => {
  // ---------- 1. drawing, in Node ----------
  const art = await src('art.js');
  const w = await src('people/wardrobe.js');
  const cos = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'progression', 'data', 'cosmetics.json'), 'utf8'));
  const base = { h: '#4a2e20', s: '#c68a5e', c: '#7a2e3a', hair: 'short', outfit: 'suit' };
  const known = new Set([...Object.keys(art.personPalette({})), '.']);
  const rowsOf = (ch, worn = []) => {
    const { colors, look } = w.curatorLook(ch, worn);
    return { pal: art.personPalette(colors), views: ['down', 'side', 'up'].map((v) => [0, 1, 2].map((f) => art.personRows(v, look, f).join('\n')).join('\n~\n')) };
  };
  const plain = rowsOf(base).views.join('|');
  const bad = [];
  Object.keys(w.COSTUMES).forEach((id) => {
    const r = rowsOf({ ...base, costume: id });
    const odd = [...new Set([...r.views.join('')].filter((c) => c !== '\n' && c !== '~' && !known.has(c)))];
    if (odd.length) bad.push(`${id}: unknown colours ${odd.join('')}`);
    if (r.views.join('|') === plain) bad.push(`${id}: changes nothing`);
  });
  check(!bad.length && Object.keys(w.COSTUMES).length >= 40, `${Object.keys(w.COSTUMES).length} costumes draw on the curator in every view`, `costume problems: ${bad.slice(0, 6).join('; ')}`);
  const heldBad = [...w.HOLD.map((id) => ['hold', id]), ...Object.keys(w.SHOULDER).map((id) => ['shoulder', id])].filter(([k, id]) => rowsOf({ ...base, [k]: id }).views.join('|') === plain);
  check(!heldBad.length, `${w.HOLD.length} things to hold and ${Object.keys(w.SHOULDER).length} on the shoulder show`, `nothing shows for ${heldBad.map((x) => x.join(':')).join(', ')}`);
  const shopBad = Object.entries(cos).filter(([, c]) => (c.slot === 'hat' || c.slot === 'outfit') && (!c.look || rowsOf(base, [{ look: c.look, colors: c.colors || {} }]).views.join('|') === plain)).map(([id]) => id);
  check(!shopBad.length, 'every shop hat and outfit has a real look that shows', `no real look for ${shopBad.join(', ')}`);
  w.LOCKED['costume:mummy'] = 'Finish the tomb quest';
  const lockedLook = w.curatorLook({ ...base, costume: 'mummy' }).look.outfit;
  w.unlockLook('costume:mummy');
  const openLook = w.curatorLook({ ...base, costume: 'mummy' }).look.outfit;
  delete w.LOCKED['costume:mummy'];
  check(lockedLook === 'suit' && openLook === 'mummy', 'a locked costume stays off until unlockLook, then goes on', `lock wrong: ${lockedLook} then ${openLook}`);

  // ---------- 2. in the game, phone-sized ----------
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(2500);
  const player = (scene = 'room') => page.evaluate((s) => {
    const sc = __game.scene.getScene(s);
    const img = sc.textures.get('player_down').getSourceImage();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const cols = {};
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) cols['#' + [d[i], d[i + 1], d[i + 2]].map((n) => n.toString(16).padStart(2, '0')).join('')] = 1;
    return { cols: Object.keys(cols), shape: c.width + 'x' + c.height };
  }, scene);
  const before = await player();
  // Customize -> Character -> Costume -> Mummy
  await page.click('#home-btn');
  await page.waitForTimeout(300);
  await page.click('[data-tab="character"]');
  await page.waitForTimeout(300);
  await page.click('.decor-body details[data-group="costume"] summary');
  await page.waitForTimeout(200);
  const mummyBtn = page.locator('.decor-body details[data-group="costume"] .choices button', { hasText: 'Mummy' }).first();
  await mummyBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/wardrobe-mummy-creator.png` });
  const mummy = await player();
  const pal = art.personPalette(w.curatorLook({ ...base, costume: 'mummy' }).colors);
  const wraps = [pal.a, pal.r]; // the mummy's two bandage shades
  check(wraps.every((c) => mummy.cols.includes(c)) && !wraps.every((c) => before.cols.includes(c)), 'picking the Mummy costume in Customize dresses the curator as a mummy', `no mummy wraps on the curator: ${mummy.cols.join(' ')}`);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('curation.character') || '{}').costume);
  check(saved === 'mummy', 'the costume is saved with the character', `saved costume: ${saved}`);
  // a lock from a quest: the button is greyed with a lock and can't be picked
  await page.evaluate(() => (window.__wardrobe.LOCKED['costume:ghost'] = 'Beat the haunted lighthouse'));
  await page.click('[data-tab="room"]');
  await page.waitForTimeout(200);
  await page.click('[data-tab="character"]');
  await page.waitForTimeout(300);
  const ghost = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.decor-body details[data-group="costume"] .choices button')].find((x) => x.textContent.trim() === 'Ghost');
    return b && { disabled: b.disabled, lock: !!b.querySelector('svg'), title: b.title };
  });
  check(ghost?.disabled && ghost.lock && /lighthouse/.test(ghost.title), 'a locked costume shows a lock and its hint, and is greyed out', `locked button: ${JSON.stringify(ghost)}`);
  await page.click('.decor-close');
  await page.waitForTimeout(300);
  // a shop hat: owned and worn, drawn into the sprite outside, no flat placeholder hat on top
  await page.evaluate(() => {
    const p = window.__prog;
    p.state.market.owned['hat:straw'] = true;
    p.market.equip('hat', 'hat:straw');
    const ch = JSON.parse(localStorage.getItem('curation.character') || '{}');
    localStorage.setItem('curation.character', JSON.stringify({ ...ch, costume: 'none' }));
  });
  await page.evaluate(() => __game.scene.getScene('room').scene.start('island', {}));
  await page.waitForTimeout(3500);
  const outside = await player('island');
  const flat = await page.evaluate(() => __game.scene.getScene('island').look?.g?.commandBuffer?.length ?? -1);
  check(outside.cols.includes('#e8c867') && flat === 0, 'a straw hat from the shop is part of the curator outside, with no flat placeholder', `outside: straw ${outside.cols.includes('#e8c867')}, placeholder commands ${flat}`);
  await page.screenshot({ path: `${OUT}/wardrobe-island.png` });
  await page.evaluate(() => __game.scene.getScene('island').scene.start('room', {}));
  await page.waitForTimeout(3000);
  const inside = await player();
  check(inside.cols.includes('#e8c867'), 'the straw hat stays on indoors', 'the hat came off indoors');
  check(!errors.length, 'no page errors', `page errors: ${errors.slice(0, 3).join(' | ')}`);
  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
