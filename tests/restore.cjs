// Restoration test: dirty contract, studio (clean, prep, assemble), storage tab, provenance.
//   PW=/path/to/playwright OUT=some/dir node tests/restore.cjs   (preview server on :4173 first)
const { chromium } = require(process.env.PW || 'playwright');
const path = require('path');
const OUT = process.env.OUT || '/tmp';
const URL = process.env.URL || 'http://localhost:4173/';
let bad = 0;
const check = (ok, good, fail) => { console.log(ok ? `ok   ${good}` : `FAIL ${fail || good}`); if (!ok) bad++; };

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  p.on('pageerror', (e) => check(false, '', 'page error: ' + e.message));
  const S = (fn, a) => p.evaluate(fn, a);
  const wait = (ms) => p.waitForTimeout(ms);
  let n = 0;
  const shot = (name) => p.screenshot({ path: path.join(OUT, `restore-${String(++n).padStart(2, '0')}-${name}.png`) });
  await p.goto(URL); await wait(1500);
  await S(() => localStorage.clear()); await p.reload(); await wait(2500);

  const codex = () => S(() => JSON.parse(localStorage.getItem('curation.codex')));
  // dirty contract through the testing button
  await p.click('#journal-btn'); await wait(400);
  await p.click('[data-jtab="storage"]'); await wait(300);
  await p.click('text=Testing: hand me something dirty'); await wait(300);
  let c = await codex();
  check(Object.keys(c.dirty || {}).length === 1, 'a dirty find is recorded in the codex', 'no dirty find: ' + JSON.stringify(c.dirty));
  await shot('storage');
  check(await S(() => document.documentElement.scrollWidth <= innerWidth), 'no horizontal scroll in storage');

  const id = Object.keys(c.dirty)[0];
  await p.click('text=/Restoration Studio/'); await wait(500);
  await shot('studio-list');
  await p.click('.studio-row'); await wait(800);
  await shot('studio-work');
  const kind = await S(() => document.querySelector('.studio-bench .piece') ? 'assemble' : 'scrub');
  const box = await (await p.$('.studio-bench')).boundingBox();
  if (kind === 'scrub') {
    for (let y = 8; y < box.height; y += 14) {
      await p.mouse.move(box.x + 4, box.y + y); await p.mouse.down();
      await p.mouse.move(box.x + box.width - 4, box.y + y, { steps: 6 }); await p.mouse.up();
    }
  }
  await wait(500);
  await shot('studio-done');
  check(await S(() => !!document.querySelector('.studio-done')), 'the piece restores');
  c = await codex();
  check(!c.dirty?.[id] && c.seen[id].restored === 1, 'dirty cleared, restored stamped', JSON.stringify(c.dirty));

  // a dirty real painting: rub the HD image clean (the painting itself is never changed)
  await p.click('.studio-done ~ button'); await wait(200);
  await S(() => { const c = JSON.parse(localStorage.getItem('curation.codex')); c.dirty['painting:harvesters'] = 1; localStorage.setItem('curation.codex', JSON.stringify(c)); });
  await S(() => window.__studio.openStudio({ entry: 'painting:harvesters' })); await wait(1500);
  await shot('painting-dirty');
  const pb = await (await p.$('.studio-bench')).boundingBox();
  for (let y = 8; y < pb.height; y += 14) {
    await p.mouse.move(pb.x + 4, pb.y + y); await p.mouse.down();
    await p.mouse.move(pb.x + pb.width - 4, pb.y + y, { steps: 6 }); await p.mouse.up();
  }
  await wait(500); await shot('painting-clean');
  check(await S(() => !!document.querySelector('.studio-done')), 'a dirty painting is cleaned');
  c = await codex();
  check(!c.dirty?.['painting:harvesters'], 'painting is no longer dirty');

  // reassembly: drag every piece to its slot
  await S(() => { const c = JSON.parse(localStorage.getItem('curation.codex')); c.dirty['fossil:ammonite'] = 1; c.seen['fossil:ammonite'] = c.seen['fossil:ammonite'] || { n: 1, first: 1 }; c.owned['fossil:ammonite'] = 1; localStorage.setItem('curation.codex', JSON.stringify(c)); });
  await S(() => window.__studio.openStudio({ entry: 'fossil:ammonite', kind: 'assemble' })); await wait(800);
  await shot('assemble-start');
  const slots = await S(() => [...document.querySelectorAll('.studio-bench .piece')].map((e) => [e.offsetLeft, e.offsetTop, e.offsetWidth, e.offsetHeight]));
  check(slots.length === 9, 'nine pieces to put back');
  const bb = await (await p.$('.studio-bench')).boundingBox();
  const pieces = await p.$$('.studio-bench .piece');
  const targets = await S(() => [...document.querySelectorAll('.studio-bench .slot')].map((e) => [e.offsetLeft, e.offsetTop]));
  // the pieces are scrambled, so work out which piece is which by its image data
  const order = await S(() => { const cvs = [...document.querySelectorAll('.studio-bench .piece')]; return cvs.map((c) => c.toDataURL()); });
  for (let i = 0; i < pieces.length; i++) {
    // brute force: try each slot until it sticks
    for (let t = 0; t < 9; t++) {
      if (await S((k) => document.querySelectorAll('.studio-bench .piece')[k].classList.contains('placed'), i)) break;
      const r = await pieces[i].boundingBox();
      await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down();
      await p.mouse.move(bb.x + targets[t][0] + r.width / 2, bb.y + targets[t][1] + r.height / 2, { steps: 4 }); await p.mouse.up();
      if (await S((k) => document.querySelectorAll('.studio-bench .piece')[k].classList.contains('placed'), i)) break;
    }
  }
  await wait(300); await shot('assemble-end');
  check(await S(() => !!document.querySelector('.studio-done')), 'reassembly finishes');
  await b.close();
  console.log(bad ? `${bad} problem(s)` : 'All good');
  process.exit(bad ? 1 : 0);
})();
