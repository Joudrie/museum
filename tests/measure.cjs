// Progression measurement (docs/progression/): the event log, sessions and the build flags.
//
//   default (fast, in npm test):
//     in Node: every watched save becomes the right event; the progression layer's bus events are copied
//       into the log; the strip test's hooks in the layer (grants, rods, regions, perks) do what they say.
//     in a phone-sized browser: a fresh save logs a session; a real catch and a real dig turn into events;
//       ?progression=off hides the rank pill, the goals and the Goals tab and is remembered; ?progression=on clears it.
//   MODE=session MINUTES=60 OUT=<dir>: a scripted session in real time (no sped-up timers) that fishes and
//     digs like an efficient player, plays the reel with a simple hold-when-below bot, and writes
//     <OUT>/scripted-session.json: the event log plus measured cycle times. The models use these.
//
// Usage: npm run build && npx vite preview --port 4173 --base / &
//        PW=/path/to/playwright node tests/measure.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const MODE = process.env.MODE || 'check';
const MINUTES = Number(process.env.MINUTES || 6);
const OUT = process.env.OUT || 'test-shots';

const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));

// In plain Node (no browser).
async function nodeChecks() {
  const root = path.join(__dirname, '..');
  const imp = (f) => import(path.join(root, f));
  await imp('docs/progression/tools/shim.mjs');
  const { save, onSave } = await imp('src/storage.js');
  const log = await imp('src/measure/events.js');
  const { onSaved } = await imp('src/measure/derive.js');
  onSave(onSaved);
  const got = [];
  log.on('*', (e) => got.push(e));
  const expect = (label, fn, want) => {
    got.length = 0;
    fn();
    const types = got.map((e) => e.type).join(',');
    types === want ? ok(`derive: ${label} → ${want || 'nothing'}`) : fail(`derive: ${label} gave "${types}", wanted "${want}"`);
    return got.slice();
  };
  console.log('Saves into events');
  save('curation.codex', { v: 1, seen: {}, owned: {}, claimed: {} }); // the first save is a baseline
  expect('first catch', () => save('curation.codex', { v: 1, seen: { 'fish:minnow': { n: 1 } }, owned: {}, claimed: {} }), 'collect');
  const dup = expect('a second minnow', () => save('curation.codex', { v: 1, seen: { 'fish:minnow': { n: 2 } }, owned: {}, claimed: {} }), 'collect');
  dup[0]?.fresh === false ? ok('derive: a duplicate is not fresh') : fail('derive: duplicate marked fresh');
  expect('a set claimed', () => save('curation.codex', { v: 1, seen: { 'fish:minnow': { n: 2 } }, owned: {}, claimed: { 'pond-fish': true } }), 'set_claimed');
  expect('a milestone claimed', () => save('curation.codex', { v: 1, seen: { 'fish:minnow': { n: 2 } }, owned: {}, claimed: { 'pond-fish': true, 'milestone-10': true } }), 'milestone_claimed');
  expect('a famous visitor stamped (counted as famous_met, not collect)', () => save('curation.codex', { v: 1, seen: { 'fish:minnow': { n: 2 }, 'visitor:monet': { n: 1 } }, owned: {}, claimed: { 'pond-fish': true, 'milestone-10': true } }), '');
  const c = expect('coins', () => save('curation.coins', 350), 'coins');
  c[0]?.delta === 50 ? ok('derive: coins delta counted from the 300 start') : fail(`derive: coins delta ${c[0]?.delta}`);
  expect('a goal claimed', () => save('curation.quests', { claimed: { clean: true }, stats: {} }), 'goal_claimed');
  expect('a dig', () => save('curation.digs', { 'one:12,24': Date.now() + 6e5 }), 'dig');
  expect('meeting someone', () => save('curation.met', ['monet']), 'famous_met');
  expect('a lead', () => save('curation.leads', { v: 1, found: { 'bottle-note': Date.now() } }), 'lead_found');
  expect('an expedition done', () => save('curation.expedition', { v: 1, done: { pirate: 1 }, where: {} }), 'expedition_done');
  expect('the daily gift and wheel', () => save('curation.daily', { last: 20000, streak: 1, gift: 20000, wheel: 20000, prize: 40 }), 'daily_gift,wheel_spin');
  expect("the layer's first save (a baseline)", () => save('curation.progress', { v: 3, unlocks: {} }), '');
  expect('a rowboat unlocked in the layer', () => save('curation.progress', { v: 3, unlocks: { 'boat:rowboat': true } }), 'unlock');
  expect('an unwatched key', () => save('curation.muted', true), '');
  expect('the log itself', () => save('curation.evlog', { v: 1, events: [] }), '');

  console.log("The layer's bus into the log");
  const { createBus } = await imp('src/progression/bus.js');
  const { layerEvents } = await imp('src/measure/layer.js');
  const b = createBus();
  layerEvents(b);
  got.length = 0;
  b.emit('FISH_CAUGHT', { speciesId: 'perch', size: 22, sizeClass: 'L', rarity: 2, variant: '', spotId: 's', perfect: true, region: 'main', water: 'pond', via: 'tier' });
  b.emit('SECRET_FOUND', { region: 'isle', secretId: 'isle:cave' });
  b.emit('RANK_UP', { rank: 3 });
  b.emit('SESSION_TICK', { dtMs: 1000 });
  const t = got.map((e) => e.type).join(',');
  check(t === 'catch,secret_found,rank_up', 'FISH_CAUGHT, SECRET_FOUND and RANK_UP are logged; the 1 s tick is not', `bus copied as "${t}"`);
  check(got[0]?.sp === 'perch' && got[0]?.cls === 'L' && got[0]?.perfect === true, 'a catch keeps its species, size class and perfect flag', 'catch payload ' + JSON.stringify(got[0]));
  check(log.kindOf(got[1]) === 'novelty' && log.kindOf(got[2]) === 'meter', 'a secret counts as novelty, a rank as a meter', `kinds ${log.kindOf(got[1])}, ${log.kindOf(got[2])}`);

  console.log("The strip test's hooks in the layer");
  const flags = await imp('src/measure/flags.js');
  const { rodUnlocked } = await imp('src/progression/angling.js');
  const { regionAccess } = await imp('src/progression/access.js');
  const { perkSet } = await imp('src/progression/skills.js');
  const { grant } = await imp('src/progression/grants.js');
  const state = () => ({ unlocks: {}, market: { owned: {}, sellBonus: 0 }, fish: { baits: {}, lures: {}, nightCatches: 0, equipped: {} }, renown: { tokens: 0 }, skills: {}, sub: { active: false } });
  const payOut = () => {
    let gold = 0;
    const p = { state: state(), gold: { add: (n) => (gold += n) }, xp() {} };
    grant(p, [{ gold: 50 }, { bait: ['shrimp', 3] }, { unlock: 'rod:cork' }]);
    return { gold, bait: p.state.fish.baits.shrimp || 0, unlocked: !!p.state.unlocks['rod:cork'] };
  };
  const probe = () => ({ golden: rodUnlocked(state(), 'golden'), north: regionAccess(state(), 'north').open, perks: perkSet(state()).size, pay: payOut() });
  localStorage.removeItem('curation.buildflags');
  flags.resetFlags();
  const on = probe();
  check(!on.golden && !on.north && on.perks === 0 && on.pay.gold === 50 && on.pay.bait === 3 && on.pay.unlocked, 'normal build: rods, regions and perks are earned; grants pay out', 'normal build ' + JSON.stringify(on));
  localStorage.setItem('curation.buildflags', JSON.stringify({ off: true, flags: {} }));
  flags.resetFlags();
  const off = probe();
  check(off.golden && off.north && off.perks > 10 && off.pay.gold === 0 && off.pay.bait === 0 && off.pay.unlocked, 'strip build: every rod, region and perk is open; grants hand out unlocks only', 'strip build ' + JSON.stringify(off));
  check(!flags.queueShows('xp') && !flags.queueShows('task') && flags.queueShows('gold'), "strip build: XP and task cards are hidden, a sale's receipt is not", 'queue filter wrong');
  check(flags.flagOn('variants'), 'strip build: colour variants still roll (content, not the layer)', 'variants off in the strip build');
  localStorage.setItem('curation.buildflags', JSON.stringify({ off: false, flags: { variants: false } }));
  flags.resetFlags();
  const { rollVariant } = await imp('src/progression/fishroll.js');
  const { createRng } = await imp('src/progression/rng.js');
  const r = createRng(5);
  const v = Array.from({ length: 2000 }, () => rollVariant(r, { events: ['halloween'] })).filter(Boolean).length;
  check(v === 0 && flags.buildLabel() === 'on:-variants', '?flags=-variants: no variant rolls (H9)', `variants with the flag off: ${v}, label ${flags.buildLabel()}`);
  localStorage.removeItem('curation.buildflags');
  flags.resetFlags();
}

(async () => {
  if (MODE === 'check') await nodeChecks();
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.stack || e.message));
  await p.route('https://upload.wikimedia.org/**', (r) =>
    r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#6b8e3a"/></svg>' }),
  );
  const S = (fn, arg) => p.evaluate(fn, arg);
  const wait = (ms) => p.waitForTimeout(ms);
  const vis = (sel) => S((q) => { const e = document.querySelector(q); return !!e && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none'; }, sel);
  const log = () => S(() => window.__measure.events().map(({ s, ...e }) => e));
  const types = async () => (await log()).map((e) => e.type);

  // ---------- fresh save ----------
  console.log('In the browser');
  await p.goto(URL + '?hour=13&weather=clear');
  await wait(2500);
  await S(() => localStorage.clear());
  await p.reload();
  await wait(2800);
  const start = (await log()).find((e) => e.type === 'session_start');
  start && start.build === 'on' && start.n === 1 ? ok(`session_start logged (source ${start.source}, build ${start.build})`) : fail('no session_start on a fresh save');

  // stand at the water's edge facing it (how tests/progression-ui.cjs finds a spot)
  const toWater = () =>
    S(() => {
      const s = __game.scene.getScene('island');
      for (const [tx, ty] of s.waterfx.candidates())
        for (const [dx, dy, f] of [[-2, 0, 'right'], [2, 0, 'left'], [0, -2, 'down'], [0, 2, 'up']]) {
          const x = (tx + dx) * 32 + 16, y = (ty + dy) * 32 + 16;
          if (s.ground_(x, y) !== 'water' && s.free(x, y)) {
            s.player.setPosition(x, y + 6);
            s.facing = f;
            s.cameras.main.centerOn(x, y);
            if (s.waterAhead()) return true;
          }
        }
      return false;
    });
  const fishing = (fn) => S(fn);
  const closeCards = async () => {
    for (let i = 0; i < 40; i++) {
      const open = await S(() => ['#catch', '#prog-card', '#prog-rank'].find((q) => { const e = document.querySelector(q); return e && !e.classList.contains('hidden') && getComputedStyle(e).display !== 'none'; }) || '');
      const st = await S(() => __game.scene.getScene('island').fishing.state);
      if (!open && st === 'idle') return true;
      if (open) await p.click(open, { force: true }).catch(() => {});
      await wait(250);
    }
    return false;
  };

  // one cast in real time: cast, wait for the real bite, tap after a person's reaction time, then play the
  // reel by holding while the zone is below the fish (checked every 60 ms). Returns timings, or null.
  async function fishOnce({ fast = false } = {}) {
    const t0 = Date.now();
    await S(() => { const s = __game.scene.getScene('island'); s.fishing.facing = s.facing; s.fishing.cast(s.waterAhead(), s.waterAhead().water, s.weatherKind || 'clear'); });
    if (fast) {
      await wait(700);
      await S(() => { const f = __game.scene.getScene('island').fishing; f.biteAt = f.t + 0.2; });
    }
    let bite = 0;
    for (let i = 0; i < 400 && !bite; i++) {
      await wait(50);
      const st = await S(() => __game.scene.getScene('island').fishing.state);
      if (st === 'bite') bite = Date.now();
      if (st === 'idle') return null;
    }
    if (!bite) return null;
    await wait(fast ? 50 : 260 + Math.random() * 160);
    await S(() => __game.scene.getScene('island').fishing.tap());
    await wait(200);
    let reelMs = 0;
    if (await vis('#reel')) {
      const r0 = Date.now();
      if (fast) await S(() => { const r = __game.scene.getScene('island').fishing.reel; r.progress = 1; r.step(0.01, true); });
      else {
        const box = await (await p.$('#reel .rl-track'))?.boundingBox();
        let down = false;
        for (let i = 0; i < 600; i++) {
          const r = await S(() => { const r = __game.scene.getScene('island').fishing.reel; return r && { fish: r.fish, zone: r.zone, vel: r.vel, over: r.over }; });
          if (!r || r.over) break;
          const want = r.fish - r.zone - r.vel * 0.12 > 0.02;
          if (want !== down) {
            if (want) {
              await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
              await p.mouse.down();
            } else await p.mouse.up();
            down = want;
          }
          await wait(60);
        }
        if (down) await p.mouse.up();
      }
      reelMs = Date.now() - r0;
    }
    await wait(900);
    const rec = await S(() => __prog.last);
    const card = Date.now();
    await wait(fast ? 300 : 1200); // reading the card
    await closeCards();
    return { cast: t0, waitMs: bite - t0, reelMs, cardAt: card - t0, species: rec?.speciesId || (rec?.junk ? 'junk' : ''), fresh: !!rec?.fresh, escaped: !!rec?.escaped, rarity: rec?.rarity || 0 };
  }

  // one dig at the nearest ready spot, brushed by hand. Returns timings, or null.
  async function digOnce() {
    const spot = await S(() => {
      const s = __game.scene.getScene('island');
      const d = s.digs?.find((x) => !x.img?.texture?.key?.includes('@dug'));
      if (!d) return null;
      s.player.setPosition(d.x, d.y + 20);
      s.facing = 'up';
      return { key: d.key };
    });
    if (!spot) return null;
    await wait(400);
    const label = await S(() => document.querySelector('#interact .label')?.textContent);
    if (label !== 'Dig') return null;
    const t0 = Date.now();
    await p.click('#interact');
    await wait(400);
    const box = await (await p.$('.dig-canvas'))?.boundingBox();
    if (!box) return null;
    let found = false;
    for (let pass = 0; pass < 6 && !found; pass++)
      for (let row = 0; row < 20 && !found; row++) {
        const y = box.y + 6 + row * 12;
        await p.mouse.move(box.x + 4, y);
        await p.mouse.down();
        await p.mouse.move(box.x + box.width - 4, y, { steps: 8 });
        await p.mouse.up();
        found = await S(() => /You found|Part of/.test(document.querySelector('.dig-title')?.textContent || ''));
      }
    const done = Date.now();
    await wait(1200);
    await p.click('.dig-close');
    await wait(300);
    await closeCards();
    return { start: t0, brushMs: done - t0, found };
  }

  const toIsland = async (map) => {
    await S((m) => { __game.scene.stop('room'); __game.scene.start('island', { map: m }); }, map);
    await wait(2500);
  };

  if (MODE === 'check') {
    // a real catch becomes a catch event and a fresh collect event
    await toIsland('main');
    check(await toWater(), 'found a place to fish on Main Island', 'no fishing spot');
    await S(() => (__prog.T.fishing.junkChance = 0));
    const f = await fishOnce({ fast: true });
    f && f.species ? ok(`caught: ${f.species}`) : fail('could not fish');
    await S(() => window.__measure.flush());
    const ev = await log();
    const c = ev.find((e) => e.type === 'catch');
    check(!!c && c.sp === f?.species, `catch event logged (${c?.sp}, ${c?.cls}, rarity ${c?.r})`, 'no catch event after a catch');
    const fresh = ev.find((e) => e.type === 'collect' && e.fresh && c && e.id.endsWith(':' + c.sp));
    check(!!fresh, `fresh collect event logged (${fresh?.id})`, 'no fresh collect event after a first catch');
    const saved = await S(() => JSON.parse(localStorage.getItem('curation.evlog') || '{}').events?.length || 0);
    check(saved > 0, `log written to the save (${saved} events)`, 'event log not saved after flush');

    // a real dig on Island One
    await toIsland('one');
    const d = await digOnce();
    if (d?.found) {
      await S(() => window.__measure.flush());
      check((await types()).includes('dig'), `dig event logged (brushed in ${(d.brushMs / 1000).toFixed(1)} s)`, 'no dig event after digging');
    } else fail('could not dig the spot on Island One');

    // the strip test flag
    await p.goto(URL + '?progression=off&hour=13');
    await wait(2800);
    const off = await S(() => ({ body: document.body.className, label: window.__measure.buildLabel() }));
    check(/progression-off/.test(off.body) && /no-goals/.test(off.body) && /no-rank/.test(off.body) && off.label === 'off', `?progression=off sets the build (${off.label})`, `progression=off not applied: ${off.body}`);
    check(!(await vis('#prog-pill')), 'the rank pill is gone', 'rank pill still showing with progression off');
    const fj = await S(async () => {
      window.dispatchEvent(new CustomEvent('open-goals'));
      await new Promise((r) => setTimeout(r, 400));
      const on = document.querySelector('#field-journal .pg-tabs .on')?.dataset.fj;
      const goalsTab = document.querySelector('#field-journal [data-fj="goals"]');
      const hidden = !goalsTab || getComputedStyle(goalsTab).display === 'none';
      document.querySelector('#field-journal .fj-close')?.click();
      return { on, hidden };
    });
    check(fj.on === 'fish' && fj.hidden, 'the field journal opens on Fish, with no Goals tab', 'field journal ' + JSON.stringify(fj));
    await p.reload();
    await wait(2500);
    const kept = await S(() => window.__measure.buildLabel());
    check(kept === 'off', 'the off build is remembered on reload', `off build not kept: ${kept}`);
    await p.goto(URL + '?progression=on');
    await wait(2500);
    const back = await S(() => ({ label: window.__measure.buildLabel(), body: document.body.className }));
    check(back.label === 'on' && !/progression-off/.test(back.body), '?progression=on clears it', `could not clear: ${back.label}`);
    check(await vis('#prog-pill'), 'the rank pill is back', 'rank pill missing after clearing');
  } else {
    // ---------- a scripted session in real time ----------
    const actions = [];
    const until = Date.now() + MINUTES * 60000;
    console.log(`  scripted session: ${MINUTES} min, real time, Island One (pond and digs)`);
    await toIsland('one');
    while (Date.now() < until) {
      const d = await digOnce();
      if (d) actions.push({ kind: 'dig', ...d });
      if (!(await toWater())) break;
      await wait(300);
      const f = await fishOnce();
      if (f) actions.push({ kind: 'fish', ...f });
      else await wait(500);
    }
    await S(() => window.__measure.flush());
    const events = await log();
    const fish = actions.filter((a) => a.kind === 'fish');
    const cycle = fish.length > 1 ? (fish[fish.length - 1].cast - fish[0].cast) / (fish.length - 1) : null;
    const out = { format: 'curation-scripted-session', minutes: MINUTES, build: 'on', when: new Date().toISOString(), actions, events, measured: { casts: fish.length, msPerCast: cycle, escaped: fish.filter((a) => a.escaped).length, digs: actions.filter((a) => a.kind === 'dig').length } };
    fs.mkdirSync(OUT, { recursive: true });
    fs.writeFileSync(path.join(OUT, 'scripted-session.json'), JSON.stringify(out, null, 1));
    ok(`${fish.length} casts (${cycle ? (cycle / 1000).toFixed(1) : '?'} s each, ${out.measured.escaped} got away), ${out.measured.digs} digs, ${events.length} events → ${path.join(OUT, 'scripted-session.json')}`);
  }

  if (errs.length) fail('page errors: ' + errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(problems.length ? `${problems.length} problem(s)` : 'All good');
  process.exit(problems.length ? 1 : 0);
})();
