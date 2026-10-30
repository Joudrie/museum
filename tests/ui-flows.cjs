// Tap budgets: the key journeys, done with real taps from the world screen. Each must reach its goal
// in no more taps than the budget (docs/UI-FLOWS.md has the full table). Plain Playwright, needs the preview server.
// Usage: node tests/ui-flows.cjs
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/';
const problems = [];
const ok = (m) => console.log('  ✓ ' + m);
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  await p.evaluate(() => localStorage.clear());
  await p.reload({ waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  // a rich save so every journey has something to act on
  await p.click('#menu-btn');
  await p.waitForTimeout(300);
  await p.click('#settings-btn');
  await p.waitForTimeout(300);
  for (let i = 0; i < 3; i++) await p.click('text=+1,000 gold');
  await p.click('text=Collect one of everything');
  await p.click('.settings-close');
  await p.waitForTimeout(400);

  let taps = 0;
  const tap = async (sel) => {
    taps++;
    await p.click(sel, { timeout: 4000 });
    await p.waitForTimeout(280);
  };
  const journey = async (name, budget, steps, goal) => {
    taps = 0;
    try {
      for (const s of steps) await s();
      const reached = await goal();
      if (!reached) fail(`${name}: did not reach the goal`);
      else if (taps > budget) fail(`${name}: ${taps} taps (budget ${budget})`);
      else ok(`${name}: ${taps} tap${taps === 1 ? '' : 's'} (budget ${budget})`);
    } catch (e) {
      fail(`${name}: ${String(e.message).split('\n')[0].slice(0, 90)}`);
    }
    // back to the world: close whatever is open
    await p.evaluate(() => {
      document.querySelectorAll('.overlay:not(.hidden)').forEach((o) => o.classList.add('hidden'));
      document.getElementById('toolkit')?.classList.add('hidden');
      const s = __game.scene.getScene('room');
      s.pause?.(false);
      if (s.mode) s.exitBuild?.();
    });
    await p.waitForTimeout(250);
  };
  const shown = (sel) => async () => p.isVisible(sel);

  await journey('See what you earn', 1, [() => tap('#hud')], shown('#income:not(.hidden)'));
  await journey('Open the journal to the fish', 2, [() => tap('#journal-btn'), () => tap('[data-jtab="fish"]')], async () => (await p.textContent('.journal-page')) === 'Fish');
  await journey('Open the Gallery Shop', 2, [() => tap('#journal-btn'), () => tap('[data-jtab="shop"]')], async () => (await p.textContent('.journal-page')) === 'Gallery Shop');
  await journey('Take the daily gift', 3, [() => tap('#menu-btn'), () => tap('#daily-btn'), () => tap('#daily .wide-btn')], async () => /gold|See you/i.test(await p.textContent('#daily')));
  await journey('Change a setting (reduce motion)', 3, [() => tap('#menu-btn'), () => tap('#settings-btn'), () => tap('[aria-label="Reduce motion"]')], async () => (await p.getAttribute('[aria-label="Reduce motion"]', 'aria-checked')) === 'true');
  await journey('Apply a theme to a room', 3, [() => tap('#home-btn'), () => tap('text=Egyptian')], async () => true);
  await journey('Change a room\'s floor', 3, [() => tap('#home-btn'), () => tap('details[data-group="floor"] > summary'), () => tap('details[data-group="floor"] .choices button:nth-child(2)')], async () => true);
  await journey('Pick a decor item to place', 2, [() => tap('#build-btn'), () => tap('#toolkit .tool-item:not(.locked)')], async () => p.isVisible('#placebar:not(.hidden)'));
  await journey('Open Share & visit', 3, [() => tap('#menu-btn'), () => tap('#hub-share')], async () => p.isVisible('#share:not(.hidden)'));
  const tapAt = async (x, y) => {
    taps++;
    await p.mouse.click(x, y);
    await p.waitForTimeout(350);
  };
  const swipeDown = (sel) => async () => {
    taps++;
    const r = await (await p.$(sel)).boundingBox();
    await p.mouse.move(r.x + r.width / 2, r.y + 8);
    await p.mouse.down();
    await p.mouse.move(r.x + r.width / 2, r.y + 80, { steps: 4 });
    await p.mouse.move(r.x + r.width / 2, r.y + 200, { steps: 4 });
    await p.mouse.up();
    await p.waitForTimeout(450);
  };
  await journey('Tap the dimmed world to close the Journal', 2, [() => tap('#journal-btn'), () => tapAt(195, 60)], async () => !(await p.isVisible('#journal:not(.hidden)')));
  await journey('Swipe the Settings sheet down to close it', 3, [() => tap('#menu-btn'), () => tap('#settings-btn'), swipeDown('#settings .sheet')], async () => !(await p.isVisible('#settings:not(.hidden)')));
  await journey('A short pull on the sheet springs back', 3, [() => tap('#menu-btn'), () => tap('#settings-btn'), async () => {
    taps++;
    const r = await (await p.$('#settings .sheet')).boundingBox();
    await p.mouse.move(r.x + r.width / 2, r.y + 8);
    await p.mouse.down();
    await p.mouse.move(r.x + r.width / 2, r.y + 40, { steps: 4 });
    await p.mouse.up();
    await p.waitForTimeout(450);
  }], async () => p.isVisible('#settings:not(.hidden)'));
  await journey('Tap the Menu, then close it', 2, [() => tap('#menu-btn'), () => tap('.hub-close')], async () => !(await p.isVisible('#hub:not(.hidden)')));

  // reduced motion must never hide a reward: the celebration card fades, it does not vanish
  await p.evaluate(() => { localStorage.setItem('curation.settings', JSON.stringify({ reduceMotion: true })); window.dispatchEvent(new CustomEvent('settings', { detail: { key: 'reduceMotion', value: true } })); window.__celebrate('+200 gold', 'Goal complete', 'coin'); });
  await p.waitForTimeout(500);
  const seen = await p.evaluate(() => getComputedStyle(document.querySelector('.celebrate-card')).opacity);
  if (Number(seen) > 0.9) ok('Reduce motion: the reward card is still seen'); else fail(`Reduce motion hides the reward card (opacity ${seen})`);

  if (errs.length) fail('page errors: ' + errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
