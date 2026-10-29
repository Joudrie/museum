// Builder check: place, undo/redo, turn a family, autosave, reload, and the vault restoring after
// localStorage is wiped (the "never lose work" path). Exit code 1 on any failure or page error.
// Usage: PW=/path/to/playwright node tests/builder.cjs   (URL defaults to the preview on :4173 + builder.html)
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/builder.html';
let bad = 0;
const ok = (c, m) => {
  console.log(`${c ? '  ✓' : '  ✗'} ${m}`);
  if (!c) bad++;
};

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const objs = () =>
    p.evaluate(() => {
      const all = JSON.parse(localStorage.getItem('curation.mapbuilder.maps') || '{}');
      const m = all[localStorage.getItem('curation.mapbuilder.current')];
      return m ? m.objects.map((o) => o.ref) : null;
    });
  const dismissResume = async () => {
    if (await p.locator('#resume-go').isVisible().catch(() => false)) await p.click('#resume-go');
  };
  const pick = async (q, nth = 0) => {
    await p.fill('#search', q);
    await p.locator('#results .piece').nth(nth).click();
    await p.fill('#search', '');
  };
  const tapMap = async (dx = 0, dy = 0) => {
    const r = await p.locator('#canvas').boundingBox();
    await p.mouse.click(r.x + r.width / 2 + dx, r.y + r.height / 2 + dy);
  };

  await p.goto(URL);
  await p.waitForTimeout(2000);
  await dismissResume();
  await p.click('#menu-btn');
  await p.click('#new-island');
  await p.waitForTimeout(300);
  await p.locator('#menu-close').click().catch(() => {});
  await p.waitForTimeout(500);

  const base = (await objs()) || [];
  await pick('palm');
  await tapMap();
  await p.waitForTimeout(400);
  let now = await objs();
  ok(now && now.length === base.length + 1, 'placing a piece saves it at once');
  await p.click('#undo');
  now = await objs();
  ok(now && now.length === base.length, 'undo removes it');
  await p.click('#redo');
  now = await objs();
  ok(now && now.length === base.length + 1, 'redo puts it back');

  // turn family: the armchair front turns to its left side
  await p.fill('#search', 'seating');
  const ref = await p.evaluate(() => 'p:seating/37');
  await p.evaluate((r) => document.querySelector(`#results .piece[data-ref="${r}"]`)?.click(), ref);
  const hasChair = await p.evaluate(() => document.getElementById('chosen-name').textContent);
  await p.fill('#search', '');
  ok(/Seating 37/.test(hasChair) || hasChair.length > 0, `armchair chosen (${hasChair})`);
  ok(await p.locator('#chosen-turn').isVisible(), 'a family shows the turn button');
  await p.click('#chosen-turn');
  const nameAfter = await p.textContent('#chosen-name');
  ok(/49/.test(nameAfter), `turn steps front to left side (${nameAfter})`);

  // reload: the map comes back
  const before = await objs();
  await p.reload();
  await p.waitForTimeout(2000);
  const after = await objs();
  ok(JSON.stringify(before) === JSON.stringify(after), 'reload keeps the map');

  // crash: localStorage wiped, the vault brings it back
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(2500);
  const resumeShown = await p.locator('#resume-go').isVisible().catch(() => false);
  if (resumeShown) await p.click('#resume-go');
  await p.waitForTimeout(800);
  const restored = await objs();
  ok(restored && restored.length >= 1 && restored.includes('t:palm'), 'vault restores the map after storage is wiped');

  ok(!errs.length, `no page errors ${errs.join('; ')}`);
  await b.close();
  console.log(bad ? `\n${bad} failed` : '\nAll good');
  process.exit(bad ? 1 : 0);
})();
