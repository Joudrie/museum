// Opens every screen at phone sizes and saves screenshots (the UI audit and before/after shots).
// Usage: node tests/ui-shots.cjs [outDir] [--size 390x844] [--only name,name]
// Needs the preview server on :4173 (npm run build && npx vite preview --port 4173 --base /).
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const val = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : null);
const out = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--size' && args[i - 1] !== '--only') || 'docs/ui/before';
const size = (val('--size') || '390x844').split('x').map(Number);
const only = val('--only') ? val('--only').split(',') : null;
const URL = process.env.URL || 'http://localhost:4173/';
fs.mkdirSync(out, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (p, sel) => { await p.click(sel, { timeout: 4000 }); await sleep(350); };

// name -> async (page) => open it. Each runs on a fresh page with the rich save.
// Measures what is on screen: small tap targets, small text, overflow, bad text.
const measure = (p) =>
  p.evaluate(() => {
    const vis = (e) => {
      const r = e.getBoundingClientRect();
      const cs = getComputedStyle(e);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    };
    const inHidden = (e) => !!e.closest('.hidden, [hidden]');
    const small = [];
    document.querySelectorAll('button, [role=button], a, input, select, textarea, .pixel-btn, summary').forEach((e) => {
      if (!vis(e) || inHidden(e)) return;
      const r = e.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) small.push(`${(e.id && '#' + e.id) || e.className.toString().split(' ')[0] || e.tagName.toLowerCase()} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 18)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    let minFont = 99;
    const tiny = new Set();
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      const e = n.parentElement;
      if (!e || !n.textContent.trim() || !vis(e) || inHidden(e) || e.closest('canvas, script, style')) continue;
      const f = parseFloat(getComputedStyle(e).fontSize);
      if (f < minFont) minFont = f;
      if (f < 12) tiny.add(f + 'px');
    }
    const overflow = [];
    document.querySelectorAll('body *').forEach((e) => {
      if (!vis(e) || inHidden(e)) return;
      if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflowX !== 'visible' && e.clientWidth > 0 && !e.closest('canvas')) overflow.push((e.className.toString().split(' ')[0] || e.tagName.toLowerCase()) + ` ${e.scrollWidth}>${e.clientWidth}`);
    });
    const text = document.body.innerText || '';
    return { smallTargets: small.length, smallList: small.slice(0, 12), minFont, tinyFonts: [...tiny], overflow: [...new Set(overflow)].slice(0, 6), badText: /undefined|NaN|\[object/.test(text), docOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
  });
const METRICS = {};

const SCREENS = {
  '01-world': async () => {},
  '02-hud-income': (p) => click(p, '#hud'),
  '03-journal-tabs': async (p) => { await click(p, '#journal-btn'); },
  '04-toolkit': (p) => click(p, '#build-btn'),
  '05-customize-room': (p) => click(p, '#home-btn'),
  '06-customize-rooms': async (p) => { await click(p, '#home-btn'); await click(p, '[data-tab=rooms]'); },
  '07-customize-character': async (p) => { await click(p, '#home-btn'); await click(p, '[data-tab=character]'); },
  '08-settings': (p) => click(p, '#settings-btn'),
  '09-build-room': async (p) => { await p.evaluate(() => { const s = __game.scene.getScene('room'); s.travel && 0; }); await p.evaluate(() => __game.scene.getScene('room').openBuildMenu()); },
  '10-wall-spot': (p) => p.evaluate(() => { const s = __game.scene.getScene('room'); s.editSlot(s.slots?.[0] || s.hung[0]); }),
  '11-viewer': (p) => p.evaluate(() => { const s = __game.scene.getScene('room'); s.view(s.hung[0]); }),
  '12-staff-board': (p) => p.evaluate(() => __game.scene.getScene('room').openStaff()),
  '13-office': (p) => p.evaluate(() => __game.scene.getScene('room').openOfficePanel()),
  '14-ask-unlock': (p) => p.evaluate(() => __game.scene.getScene('room').offerUnlock(1)),
  '15-daily': (p) => click(p, '#daily-btn'),
  '16-share': (p) => p.evaluate(() => window.__share.openShare()),
  '17-conversation': (p) => p.evaluate(() => { const s = __game.scene.getScene('room'); const n = s.npcs.find((n) => !n.staff && !n.famous); s.player.setPosition(n.s.x, n.s.y + 14); s.talkTo(n); }),
  '18-staff-bubble': (p) => p.evaluate(() => { const s = __game.scene.getScene('room'); const n = s.npcs.find((n) => n.kind === 'caretaker'); s.talkTo(n); }),
  '19-toast': (p) => p.evaluate(() => __game.scene.getScene('room').toast('Saved your note. +40 gold')),
  '20-island-world': async (p) => { await p.evaluate(() => __game.scene.start('island', { map: 'one' })); await sleep(2500); },
  '21-island-sail': async (p) => { await p.evaluate(() => __game.scene.start('island', { map: 'one' })); await sleep(2500); await p.evaluate(() => __game.scene.getScene('island').sail()); },
  '22-dig': async (p) => { await p.evaluate(() => __game.scene.start('island', { map: 'one' })); await sleep(2500); await p.evaluate(() => { const s = __game.scene.getScene('island'); const d = s.digs[0]; s.player.setPosition(d.x, d.y + 14); s.digAt(d); }); },
  '23-dig-fossil': async (p) => { await p.evaluate(() => __game.scene.start('island', { map: 'one' })); await sleep(2500); await p.evaluate(() => { const s = __game.scene.getScene('island'); const d = s.digs.find((x) => x.kind === 'fossil'); s.player.setPosition(d.x, d.y + 14); s.digAt(d); }); },
  '30-builder': async (p) => { await p.goto(URL + 'builder.html', { waitUntil: 'domcontentloaded' }); await sleep(2500); },
};

(async () => {
  const b = await chromium.launch();
  // 1) make a rich save once: lots of gold, one of everything
  const ctx0 = await b.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: true });
  const p0 = await ctx0.newPage();
  await p0.goto(URL, { waitUntil: 'domcontentloaded' });
  await p0.evaluate(() => localStorage.clear());
  await p0.reload({ waitUntil: 'domcontentloaded' });
  await sleep(3000);
  await click(p0, '#settings-btn');
  for (let i = 0; i < 4; i++) await p0.click('text=+1,000 gold');
  await p0.click('text=Collect one of everything');
  await p0.evaluate(() => localStorage.setItem('curation.office', '5')); // room cap high enough to open the build menu
  await sleep(300);
  const save = await p0.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
  await ctx0.close();

  const journalTabs = async (p, tag) => {
    await click(p, '#journal-btn');
    const n = await p.$$eval('.journal-tabs button', (b) => b.length);
    for (let i = 0; i < n; i++) {
      const label = (await p.$$eval('.journal-tabs button', (b, i) => b[i].textContent, i)).trim().toLowerCase().replace(/[^a-z]+/g, '-');
      await p.$$eval('.journal-tabs button', (b, i) => b[i].click(), i);
      await sleep(400);
      await p.screenshot({ path: path.join(out, `03-journal-${String(i + 1).padStart(2, '0')}-${label}.png`), animations: 'disabled', timeout: 15000 });
      if (i === 0 || label === 'paintings') METRICS['03-journal-' + label] = await measure(p);
    }
  };

  for (const [name, open] of Object.entries(SCREENS)) {
    if (only && !only.some((o) => name.includes(o))) continue;
    const ctx = await b.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: true });
    await ctx.addInitScript((s) => { if (!sessionStorage.getItem('seeded') && !location.pathname.includes('builder')) { Object.entries(s).forEach(([k, v]) => localStorage.setItem(k, v)); sessionStorage.setItem('seeded', '1'); } }, save);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    try {
      await p.goto(URL, { waitUntil: 'domcontentloaded' });
      await sleep(3000);
      if (name === '03-journal-tabs') await journalTabs(p);
      else {
        await open(p);
        await sleep(600);
        await p.screenshot({ path: path.join(out, `${name}.png`), animations: 'disabled', timeout: 15000 });
        METRICS[name] = await measure(p);
      }
      console.log('ok  ', name, errs.length ? 'ERR ' + errs[0].slice(0, 80) : '');
    } catch (e) {
      console.log('FAIL', name, String(e.message).split('\n')[0].slice(0, 100));
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(out, 'metrics.json'), JSON.stringify(METRICS, null, 1));
  await b.close();
})();
