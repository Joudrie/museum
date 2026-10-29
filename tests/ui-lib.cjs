// Shared by tests/ui-shots.cjs (screenshots) and tests/ui-layout.cjs (budgets):
// opens every screen at a phone size on a rich save and measures what is on screen.
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const click = async (p, sel) => { await p.click(sel, { timeout: 4000 }); await sleep(350); };

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

const SCREENS = {
  '01-world': async () => {},
  '02-hud-income': (p) => click(p, '#hud'),
  '03-journal-tabs': async (p) => { await click(p, '#journal-btn'); },
  '04-toolkit': (p) => click(p, '#build-btn'),
  '05-customize-room': (p) => click(p, '#home-btn'),
  '05b-customize-floor': async (p) => { await click(p, '#home-btn'); await click(p, 'details[data-group="floor"] > summary'); },
  '06-customize-rooms': async (p) => { await click(p, '#home-btn'); await click(p, '[data-tab=rooms]'); },
  '07-customize-character': async (p) => { await click(p, '#home-btn'); await click(p, '[data-tab=character]'); },
  '08-settings': async (p) => { await click(p, '#menu-btn'); await click(p, '#settings-btn'); },
  '09-build-room': async (p) => { await p.evaluate(() => { const s = __game.scene.getScene('room'); s.travel && 0; }); await p.evaluate(() => __game.scene.getScene('room').openBuildMenu()); },
  '10-wall-spot': (p) => p.evaluate(() => { const s = __game.scene.getScene('room'); s.editSlot(s.slots?.[0] || s.hung[0]); }),
  '11-viewer': (p) => p.evaluate(() => { const s = __game.scene.getScene('room'); s.view(s.hung[0]); }),
  '12-staff-board': (p) => p.evaluate(() => __game.scene.getScene('room').openStaff()),
  '13-office': (p) => p.evaluate(() => __game.scene.getScene('room').openOfficePanel()),
  '14-ask-unlock': (p) => p.evaluate(() => __game.scene.getScene('room').offerUnlock(1)),
  '15-daily': async (p) => { await click(p, '#menu-btn'); await click(p, '#daily-btn'); },
  '16-share': async (p) => { await click(p, '#menu-btn'); await click(p, '#hub-share'); },
  '16b-menu-hub': (p) => click(p, '#menu-btn'),
  '17-conversation': (p) => p.evaluate(() => { const s = __game.scene.getScene('room'); const n = s.npcs.find((n) => !n.staff && !n.famous); s.player.setPosition(n.s.x, n.s.y + 14); s.talkTo(n); }),
  '18-staff-bubble': (p) => p.evaluate(() => { const s = __game.scene.getScene('room'); const n = s.npcs.find((n) => n.kind === 'caretaker'); s.talkTo(n); }),
  '19-toast': (p) => p.evaluate(() => __game.scene.getScene('room').toast('Saved your note. +40 gold')),
  '20-island-world': async (p) => { await p.evaluate(() => __game.scene.start('island', { map: 'one' })); await sleep(2500); },
  '21-island-sail': async (p) => { await p.evaluate(() => __game.scene.start('island', { map: 'one' })); await sleep(2500); await p.evaluate(() => __game.scene.getScene('island').sail()); },
  '22-dig': async (p) => { await p.evaluate(() => __game.scene.start('island', { map: 'one' })); await sleep(2500); await p.evaluate(() => { const s = __game.scene.getScene('island'); const d = s.digs[0]; s.player.setPosition(d.x, d.y + 14); s.digAt(d); }); },
  '23-dig-fossil': async (p) => { await p.evaluate(() => __game.scene.start('island', { map: 'one' })); await sleep(2500); await p.evaluate(() => { const s = __game.scene.getScene('island'); const d = s.digs.find((x) => x.kind === 'fossil'); s.player.setPosition(d.x, d.y + 14); s.digAt(d); }); },
  // the look settings: large text and the left-handed layout
  '40-large-text-hud': async (p) => { await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('curation.settings') || '{}'); s.text = 'large'; localStorage.setItem('curation.settings', JSON.stringify(s)); window.dispatchEvent(new CustomEvent('settings')); }); await sleep(300); await click(p, '#menu-btn'); },
  '41-large-text-settings': async (p) => { await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('curation.settings') || '{}'); s.text = 'large'; localStorage.setItem('curation.settings', JSON.stringify(s)); window.dispatchEvent(new CustomEvent('settings')); }); await sleep(300); await click(p, '#menu-btn'); await click(p, '#settings-btn'); },
  '42-left-handed': async (p) => { await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('curation.settings') || '{}'); s.leftHanded = true; localStorage.setItem('curation.settings', JSON.stringify(s)); window.dispatchEvent(new CustomEvent('settings')); }); await sleep(300); },
  '30-builder': async (p) => { await p.goto(URL + 'builder.html', { waitUntil: 'domcontentloaded' }); await sleep(2500); },
  '31-builder-menu': async (p) => { await p.goto(URL + 'builder.html', { waitUntil: 'domcontentloaded' }); await sleep(2500); if (await p.isVisible('#resume-go')) await p.click('#resume-go'); await sleep(500); await click(p, '#menu-btn'); },
};


/**
 * Runs every screen (or those whose name contains one of `only`) at `size` = [w, h].
 * onShot(name, page, metrics, label) is called for each; return nothing.
 */
async function runScreens({ size = [390, 844], only = null, onShot, log = () => {} }) {
  const b = await chromium.launch();
  const ctx0 = await b.newContext({ viewport: { width: size[0], height: size[1] }, hasTouch: true });
  const p0 = await ctx0.newPage();
  await p0.goto(URL, { waitUntil: 'domcontentloaded' });
  await p0.evaluate(() => localStorage.clear());
  await p0.reload({ waitUntil: 'domcontentloaded' });
  await sleep(3000);
  await click(p0, '#menu-btn');
  await click(p0, '#settings-btn');
  for (let i = 0; i < 4; i++) await p0.click('text=+1,000 gold');
  await p0.click('text=Collect one of everything');
  await p0.evaluate(() => localStorage.setItem('curation.office', '5')); // room cap high enough to open the build menu
  await sleep(300);
  const save = await p0.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
  await ctx0.close();

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
      if (name === '03-journal-tabs') {
        await click(p, '#journal-btn');
        await sleep(400);
        await onShot('03-journal-00-overview', p, await measure(p));
        await p.evaluate(() => { document.querySelector('#journal .sheet').scrollTop = 99999; });
        await sleep(200);
        await onShot('03-journal-00b-overview-end', p, null);
        const ids = await p.$$eval('#journal [data-jtab]', (b) => b.map((x) => x.dataset.jtab));
        for (let i = 0; i < ids.length; i++) {
          if (await p.isVisible('.journal-back')) { await p.click('.journal-back'); await sleep(250); }
          await p.$eval(`#journal [data-jtab="${ids[i]}"]`, (b) => b.click());
          await sleep(400);
          await onShot(`03-journal-${String(i + 1).padStart(2, '0')}-${ids[i]}`, p, ids[i] === 'goals' || ids[i] === 'paintings' ? await measure(p) : null);
        }
      } else {
        await open(p);
        await sleep(600);
        await onShot(name, p, await measure(p));
      }
      log('ok  ', name, errs.length ? 'ERR ' + errs[0].slice(0, 80) : '');
    } catch (e) {
      log('FAIL', name, String(e.message).split('\n')[0].slice(0, 100));
      await onShot(name, null, { failed: String(e.message).split('\n')[0] });
    }
    await ctx.close();
  }
  await b.close();
}

module.exports = { runScreens, SCREENS, measure, URL };
