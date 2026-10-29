// The progression layer in a phone-sized browser: the rank pill, a whole catch (cast, bite, reel,
// reveal), the reward queue waiting for a card or a conversation, the rank-up ceremony, named people
// and gifts, and the Field Journal. Usage: PW=<playwright> URL=http://localhost:4173/ node tests/progression-ui.cjs
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/';
const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.stack || e.message));
  const S = (fn, a) => p.evaluate(fn, a);
  const wait = (ms) => p.waitForTimeout(ms);
  const vis = (sel) => S((q) => { const e = document.querySelector(q); return !!e && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none'; }, sel);

  await p.goto(URL);
  await wait(2500);
  await S(() => localStorage.clear());
  await p.reload();
  await wait(2500);
  console.log('Pill');
  check(await vis('#prog-pill'), 'the rank pill is on screen', 'no rank pill');
  check((await S(() => document.querySelector('#prog-pill .pp-lv').textContent)) === '1', 'a new save starts at rank 1', 'not rank 1');
  const box = await S(() => { const r = document.querySelector('#prog-pill').getBoundingClientRect(); const h = document.querySelector('#hud').getBoundingClientRect(); return { right: r.right, left: r.left, top: r.top, hudBottom: h.bottom }; });
  check(box.left >= 0 && box.right <= 390 && box.top >= box.hudBottom - 1, 'the pill fits the phone and sits under the status strip', 'pill layout ' + JSON.stringify(box));
  check((await S(() => JSON.parse(localStorage.getItem('curation.progress')).v)) >= 2, 'progress is saved under its own versioned key', 'no progress save');

  await S(() => { __game.scene.stop('room'); __game.scene.start('island', { map: 'main' }); });
  await wait(2500);
  console.log('A catch');
  const spot = await S(() => {
    const s = __game.scene.getScene('island');
    for (const [tx, ty] of s.waterfx.candidates()) for (const [dx, dy, f] of [[-2, 0, 'right'], [2, 0, 'left'], [0, -2, 'down'], [0, 2, 'up']]) {
      const x = (tx + dx) * 32 + 16, y = (ty + dy) * 32 + 16;
      if (s.ground_(x, y) !== 'water' && s.free(x, y)) { s.player.setPosition(x, y + 6); s.facing = f; s.cameras.main.centerOn(x, y); if (s.waterAhead()) return true; }
    }
    return false;
  });
  check(spot, 'found a place to fish', 'no fishing spot');
  await S(() => { __prog.T.fishing.junkChance = 0; const s = __game.scene.getScene('island'); s.fishing.facing = s.facing; s.fishing.cast(s.waterAhead(), s.waterAhead().water, 'clear'); });
  await wait(700);
  await S(() => { const f = __game.scene.getScene('island').fishing; f.biteAt = f.t + 0.2; });
  for (let i = 0; i < 30 && (await S(() => __game.scene.getScene('island').fishing.state)) !== 'bite'; i++) await wait(150);
  check((await S(() => __game.scene.getScene('island').fishing.state)) === 'bite', 'a bite: the "!" is up', 'no bite');
  await S(() => __game.scene.getScene('island').fishing.tap());
  await wait(300);
  check(await vis('#reel'), 'hooking opens the reel minigame', 'no reel');
  await S(() => { const r = __game.scene.getScene('island').fishing.reel; r.progress = 1; r.step(0.01, true); });
  await wait(1500);
  check(await vis('#catch'), 'the reveal card shows', 'no reveal');
  const rec = await S(() => __prog.last);
  check(rec.fresh && rec.sizeClass && rec.xp.gained > 0, 'the catch carries size class, newness and XP', 'catch record ' + JSON.stringify(rec));
  check(!(await vis('#prog-rank.on')) && !(await vis('#prog-card.on')), 'no reward appears over the reveal card', 'a reward showed over the reveal');
  await wait(400);
  await p.mouse.click(195, 420);
  const played = await p.waitForFunction(() => document.querySelectorAll('.prog-pop').length > 0 || !document.querySelector('#prog-card').classList.contains('hidden'), null, { timeout: 4000 }).then(() => true).catch(() => false);
  check(played, 'after the card the rewards play (XP, stamp, rank)', 'no rewards after the reveal');
  const closeRanks = async () => {
    let n = 0;
    for (let i = 0; i < 8; i++) {
      await p.waitForSelector('#prog-rank.on', { timeout: i ? 2500 : 15000 }).catch(() => {});
      if (!(await vis('#prog-rank.on'))) break;
      n++;
      if (n === 1) check(await S(() => document.body.classList.contains('prog-lock')), 'input is locked while it plays', 'not locked');
      await p.waitForSelector('#prog-rank.ready', { timeout: 4000 }).catch(() => {});
      await p.click('#prog-rank');
      await wait(500);
    }
    return n;
  };
  const ranks = await closeRanks();
  check(ranks >= 1, 'the rank-up ceremony plays (and closes on a tap after its lock)', 'no ceremony');
  await p.waitForFunction(() => __prog.queue.length === 0 && !__prog.queue.busy, null, { timeout: 8000 }).catch(() => {});
  await wait(600);
  check((await S(() => document.querySelector('#prog-pill .pp-lv').textContent)) === String(await S(() => __prog.level().level)), 'the pill shows the new rank', 'pill not updated: ' + await S(() => document.querySelector('#prog-pill').innerText.replace(/\n/g,' ') + ' | ' + document.querySelector('#prog-pill .pp-lv').textContent + ' vs ' + __prog.level().level + ' q' + __prog.queue.length) + ' ' + JSON.stringify(await S(() => ({ ranks: __prog.bus.recent().filter((e) => e.type === 'RANK_UP').map((e) => e.payload.rank), xp: __prog.state.rank.xp, rm: __prog.state.telemetry.rankMinutes, pill: __pill(), busy: __prog.queue.busy }))) + await S(() => document.querySelector('#prog-pill .pp-lv').textContent + ' vs ' + __prog.level().level + ' q' + __prog.queue.length));

  console.log('Queue waits for menus');
  await S(() => { __prog.queue.clear(); __prog.xp(5000, 'test'); });
  await S(() => document.getElementById('hub').classList.remove('hidden')); // any open menu holds the queue
  await wait(2500);
  check(!(await vis('#prog-rank.on')), 'a rank-up waits while a menu is open', 'ceremony over a menu');
  await S(() => document.getElementById('hub').classList.add('hidden'));
  await p.waitForSelector('#prog-rank.on', { timeout: 6000 }).catch(() => {});
  check(await vis('#prog-rank.on'), 'and plays once it closes', 'ceremony never came');
  await closeRanks();

  console.log('People');
  await S(() => { __prog.queue.clear(); });
  const npc = await S(() => { const s = __game.scene.getScene('island'); const n = s.islanders.find((x) => x.npcId === 'wen'); return n ? { x: n.s.x, y: n.s.y } : null; });
  check(!!npc, 'Wen lives on Main Island', 'Wen is missing');
  if (npc) {
    await S((n) => { const s = __game.scene.getScene('island'); s.player.setPosition(n.x, n.y + 14); s.cameras.main.centerOn(n.x, n.y); __prog.state.gifts.stock.bread = 2; s.talkTo(s.islanders.find((x) => x.npcId === 'wen')); }, npc);
    await wait(1500);
    check(await vis('#chat'), 'tapping a named person opens a conversation', 'no conversation');
    const f = await S(() => __prog.state.friends.wen);
    check(f && f.points > 0, 'the first talk of the day gives friendship points', 'no points');
    for (let i = 0; i < 6; i++) {
      if (await S(() => !!document.querySelector('#chat .chat-choices button'))) break;
      await S(() => document.getElementById('chat').click());
      await wait(500);
    }
    const hasGift = await S(() => [...document.querySelectorAll('#chat .chat-choices button')].some((b) => b.textContent === 'Give a gift'));
    check(hasGift, 'the conversation offers a gift', 'no gift choice');
    await S(() => document.querySelector('#chat').classList.add('hidden'));
  }

  console.log('The world');
  const w = await S(() => { const sc = __game.scene.getScene('island'); const wl = sc.world; return { secrets: wl.secrets.length, views: wl.views.length, sparkles: wl.sparkles.length, clue: wl.secrets.some((x) => x.clue), locked: wl.gated().length }; });
  check(w.secrets === 12 && w.views === 2 && w.sparkles >= 3, `Main Island has 12 secrets, 2 viewpoints and ${w.sparkles} sparkles today`, 'world content: ' + JSON.stringify(w));
  check(w.clue, 'one secret is the clue to the island\'s legend', 'no clue secret');
  const walk = await S(() => { const sc = __game.scene.getScene('island'); const sp = sc.world.sparkles[0]; sc.player.setPosition(sp.x, sp.y); return __prog.state.stats.foraged; });
  await wait(600);
  check((await S(() => __prog.state.stats.foraged)) === walk + 1, 'walking over a sparkle picks it up', 'sparkle not picked up');
  await S(() => { const sc = __game.scene.getScene('island'); const sc0 = sc.world.secrets.find((x) => !x.needs); sc.player.setPosition(sc0.x, sc0.y); });
  await wait(600);
  check((await S(() => __prog.state.stats.secrets)) >= 1, 'walking onto a secret finds it', 'secret not found');
  const chunks = await S(() => { const sc = __game.scene.getScene('island'); sc.player.setPosition(sc.tilesW * 16, sc.tilesH * 16); return 0; });
  await wait(700);
  check((await S(() => __prog.state.stats.chunks)) > 0, 'walking clears the fog (map chunks are counted)', 'no chunks revealed');
  const mm = await S(() => { const c = __game.scene.getScene('island').world.minimap(); return [c.width, c.height]; });
  check(mm[0] > 0, 'the island draws a fogged minimap for the Places page', 'no minimap');
  const lockedDocks = await S(() => { __game.scene.getScene('island').sail(); return [...document.querySelectorAll('#sail .sail-dest.locked')].map((b) => b.textContent); });
  check(lockedDocks.length >= 3 && lockedDocks.some((t) => /Needs|Buy|Subscriber/.test(t)), `the boat shows ${lockedDocks.length} locked islands with what they need`, 'no locked docks: ' + lockedDocks);
  await S(() => document.querySelector('#sail .sail-stay').click());
  await wait(300);

  console.log('Field journal');
  await S(() => { __game.scene.getScene('island').paused = false; });
  await S(() => window.dispatchEvent(new CustomEvent('open-field', { detail: 'goals' })));
  await wait(500);
  check(await vis('#field-journal'), 'the field journal opens', 'field journal closed');
  const tabs = await S(() => [...document.querySelectorAll('#field-journal .pg-tabs button')].map((x) => x.dataset.fj));
  check(tabs.join() === 'goals,fish,shop,lodge,leads,events,people,places,emotes,secrets,titles,records', 'goals and every page have a tab', 'tabs: ' + tabs);
  check((await S(() => document.querySelectorAll('#field-journal .pg-row').length)) >= 3, 'the goals tab lists goals', 'no goals');
  for (const t of tabs) {
    await S((id) => document.querySelector(`#field-journal [data-fj="${id}"]`).click(), t);
    await wait(150);
  }
  const noSide = await S(() => { const s = document.querySelector('#field-journal .sheet'); return s.scrollWidth <= s.clientWidth + 1; });
  check(noSide, 'no sideways scroll on the pages', 'sideways scroll');
  await S(() => document.querySelector('#field-journal [data-fj="fish"]').click());
  await wait(200);
  await S(() => document.querySelector('#field-journal .fish-cell.unknown').click());
  await wait(300);
  check(await vis('#hint-sheet'), 'tapping a silhouette opens its hints', 'no hint sheet');
  const hints = await S(() => document.querySelectorAll('#hint-sheet .pg-row').length);
  check(hints === 3, 'three hint rows, locked ones say how to unlock', 'hint rows: ' + hints);

  check(errs.length === 0, 'no page errors', 'page errors: ' + errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
