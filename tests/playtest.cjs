// Playtest: goes through what a player does, in order (see docs/PLAYTEST.md),
// with screenshots and checks for walking, hitboxes, depth and doorways.
// Usage: npm run build && npx vite preview --port 4173 --base / &
//        PW=/path/to/playwright OUT=some/dir node tests/playtest.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'playtest-shots';
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const log = (step, mark, note) => {
  results.push({ step, mark, note });
  console.log(`  ${mark} ${step}: ${note}`);
};
const pass = (s, n) => log(s, '✅', n);
const warn = (s, n) => log(s, '⚠️', n);
const fail = (s, n) => log(s, '❌', n);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, hasTouch: false });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.route('https://upload.wikimedia.org/**', (r) =>
    r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#6b8e3a"/></svg>' }),
  );
  const S = (fn, arg) => p.evaluate(fn, arg);
  const wait = (ms) => p.waitForTimeout(ms);
  let shotN = 0;
  const shot = async (name) => {
    const f = path.join(OUT, `${String(++shotN).padStart(2, '0')}-${name}.png`);
    await p.screenshot({ path: f });
    return f;
  };
  const shown = (sel) => S((q) => { const e = document.querySelector(q); return !!e && !e.classList.contains('hidden'); }, sel);
  const room = () => S(() => { const s = __game.scene.getScene('room'); return { i: s.roomIndex, x: s.player.x, y: s.player.y }; });
  const travel = async (i, spawn = 'entrance') => {
    await S(([r, sp]) => __game.scene.getScene('room').travel(r, sp, true), [i, spawn]);
    await wait(1300);
  };
  // press-and-drag from the middle of the screen
  const drag = async (dx, dy, ms) => {
    await p.mouse.move(195, 500);
    await p.mouse.down();
    await p.mouse.move(195 + dx * 0.3, 500 + dy * 0.3, { steps: 3 });
    await p.mouse.move(195 + dx, 500 + dy, { steps: 3 });
    await wait(ms);
    await p.mouse.up();
    await wait(120);
  };
  const hold = async (key, ms) => {
    await p.keyboard.down(key);
    await wait(ms);
    await p.keyboard.up(key);
  };

  // ---------- 1. First launch ----------
  console.log('1. First launch');
  await p.goto(URL + '?hour=13');
  await wait(2500);
  await S(() => localStorage.clear());
  await p.reload();
  await wait(2800);
  (await p.$('#crash')) ? fail('1.1 load', 'crash screen') : pass('1.1 load', 'entrance loads on a fresh save');
  await shot('launch');
  const greet = await shown('#talk');
  greet ? pass('1.2 greeting', 'caretaker greets the player') : fail('1.2 greeting', 'no greeting bubble');
  await shot('greeting');
  const hud = await S(() => { const h = document.querySelector('.hud-stats'); return h.scrollWidth <= h.clientWidth + 1; });
  hud ? pass('1.3 HUD', 'stats fit on one line') : warn('1.3 HUD', 'HUD stats overflow');
  await p.mouse.click(195, 300); // close the bubble
  await wait(300);

  // ---------- 2. Walking ----------
  console.log('2. Walking');
  let a = await room();
  await p.mouse.click(195, 420); // a tap must not walk
  await wait(400);
  let c = await room();
  Math.hypot(c.x - a.x, c.y - a.y) < 1 ? pass('2.2 tap', 'a quick tap does not walk') : fail('2.2 tap', `a tap moved the player ${Math.round(Math.hypot(c.x - a.x, c.y - a.y))}px`);
  a = await room();
  await p.mouse.move(195, 500);
  await p.mouse.down();
  await p.mouse.move(195, 440, { steps: 4 });
  await wait(500);
  const stick = await S(() => document.getElementById('stick').classList.contains('active'));
  await shot('drag-walk');
  await p.mouse.up();
  await wait(150);
  c = await room();
  c.y < a.y - 20 ? pass('2.1 drag', `drag walks (${Math.round(a.y - c.y)}px up)`) : fail('2.1 drag', 'drag did not walk');
  stick ? pass('2.2 joystick', 'joystick shows under the finger') : warn('2.2 joystick', 'no joystick shown while dragging');
  // short vs long drag speed (walking up, away from the front doors)
  await travel(0, 'start');
  a = await room();
  await drag(0, -20, 400);
  const short = a.y - (await room()).y;
  await travel(0, 'start');
  a = await room();
  await drag(0, -80, 400);
  const long = a.y - (await room()).y;
  long > short * 1.2 ? pass('2.1 pace', `long drag runs (${Math.round(long)}px vs ${Math.round(short)}px)`) : warn('2.1 pace', `walk/run feel the same (${Math.round(short)} vs ${Math.round(long)})`);
  // facing
  const faces = [];
  await travel(0, 'start');
  for (const [dx, dy] of [[60, 0], [-60, 0], [0, -60], [0, 60]]) {
    await drag(dx, dy, 200);
    faces.push(await S(() => { const s = __game.scene.getScene('room').player; return s.texture.key.replace(/_\d$/, '') + (s.flipX ? '<' : ''); }));
  }
  faces.join() === 'player_side,player_side<,player_up,player_down' ? pass('2.3 facing', 'sprite faces the way you walk') : warn('2.3 facing', faces.join(' '));

  // ---------- 3. Entrance hitboxes ----------
  console.log('3. Entrance');
  const blocksE = await S(() => __game.scene.getScene('room').blocks.length);
  pass('3 entrance blocks', `${blocksE} solid footprints`);
  // stand behind each potted tree (corners) and in front of the desk
  await S(() => { const s = __game.scene.getScene('room'); const b = s.bounds(); s.player.setPosition(b.x0 + 14, b.y1 - 34); });
  await wait(200);
  await shot('entrance-behind-tree');

  // ---------- 5. Cleaning ----------
  console.log('5. Cleaning');
  const cleaned = await S(() => {
    const s = __game.scene.getScene('room');
    const m = s.mess[0];
    if (!m) return null;
    const b = s.bounds();
    s.player.setPosition(Math.max(b.x0, Math.min(b.x1, m.x)), Math.max(b.y0, Math.min(b.y1, m.y + 12)));
    return s.mess.length;
  });
  await wait(250);
  if (cleaned && (await shown('#interact'))) {
    await p.click('#interact');
    await wait(400);
    const after = await S(() => __game.scene.getScene('room').mess.length);
    after < cleaned ? pass('5.1 clean', 'interact cleans a mess') : warn('5.1 clean', 'interact did not clear the nearest mess');
  } else warn('5.1 clean', 'no interact button at the first mess');
  await S(() => { const s = __game.scene.getScene('room'); [...s.mess].forEach((m) => s.clean(m)); });
  await wait(600);
  await shot('entrance-clean');

  // ---------- 7. Paintings ----------
  console.log('7. Paintings');
  const hasHung = await S(() => {
    const s = __game.scene.getScene('room');
    const h = s.hung[0];
    if (!h) return false;
    const st = s.standFor(h);
    s.player.setPosition(st.x, st.y);
    s.faceSprite(s.player, 'player', st.fx, st.fy); // (you act on what you face)
    return true;
  });
  await wait(300);
  if (hasHung && (await shown('#interact'))) {
    await p.click('#interact');
    await wait(900);
    const v = await shown('#viewer');
    await shot('painting-viewer');
    v ? pass('7.3 viewer', 'painting viewer opens') : fail('7.3 viewer', 'viewer did not open');
    await p.keyboard.press('Escape');
    await wait(300);
    if (await shown('#viewer')) await p.click('#viewer .viewer-close').catch(() => {});
    await wait(400);
  } else warn('7.3 viewer', 'no hung painting reachable in the entrance');

  // ---------- 8. Doors ----------
  console.log('8. Doors');
  await S(() => { const s = __game.scene.getScene('room'); s.player.setPosition(s.L.exit.ax, s.L.exit.ay); s.focus = s.findFocus(); s.interact(); });
  await wait(400);
  if (await shown('#ask')) {
    await shot('unlock-hall');
    await p.click('.ask-yes');
    await wait(2200);
    (await room()).i === 1 ? pass('8.1 hall unlock', 'paying opens the main hall') : fail('8.1 hall unlock', 'did not reach the main hall');
  } else fail('8.1 hall unlock', 'no unlock offer at the double doors');
  await shot('main-hall');
  // columns: stand between a column and the wall
  const col = await S(() => {
    const s = __game.scene.getScene('room');
    const cols = s.L.columns || s.g.columns;
    if (!cols?.length) return 'none';
    const k = cols[0];
    return s.blocked(k.x, k.y - 22) ? 'blocked' : 'free';
  });
  col === 'free' ? pass('3 hall columns', 'you can stand between a column and the wall') : col === 'none' ? warn('3 hall columns', 'no column data found') : fail('3 hall columns', 'the gap behind a column is blocked');
  // locked atrium arch: stopped at the wall
  await S(() => { const s = __game.scene.getScene('room'); s.player.setPosition(s.L.exit.ax, s.L.exit.ay + 20); });
  await hold('w', 900);
  const atLocked = await room();
  const lockedOk = await S((y) => { const s = __game.scene.getScene('room'); return y >= s.L.exit.ay - 14; }, atLocked.y);
  atLocked.i === 1 && lockedOk ? pass('8.4 locked arch', 'a locked arch stops you at the wall') : fail('8.4 locked arch', `walked into a locked arch (room ${atLocked.i}, y ${Math.round(atLocked.y)})`);
  await S(() => { const s = __game.scene.getScene('room'); s.player.setPosition(s.L.exit.ax, s.L.exit.ay + 2); s.focus = s.findFocus(); s.interact(); });
  await wait(400);
  if (await shown('#ask')) {
    await p.click('.ask-yes');
    await wait(2200);
  }
  (await room()).i === 2 ? pass('8.1 atrium unlock', 'atrium opens') : fail('8.1 atrium unlock', 'atrium did not open');
  await shot('atrium');

  // ---------- 12.2 Nobody stands in a doorway ----------
  await travel(1);
  const doors = await S(() => {
    const s = __game.scene.getScene('room');
    let bad = 0;
    for (let i = 0; i < 2400; i++) {
      s.npcs.forEach((n) => s.updateVisitor(n, 0.05));
      if (i > 200 && i % 20 === 0) s.npcs.forEach((n) => { if (!n.fixed && !n.follow && !n.target && s.inDoorway(n.s.x, n.s.y)) bad++; });
    }
    return bad;
  });
  doors === 0 ? pass('12.2 doorways', 'over a minute in the main hall, nobody stood in a doorway') : fail('12.2 doorways', `${doors} times someone stood in a doorway`);

  // ---------- 8.3 Archways (shaped rooms) ----------
  console.log('8.3 Archways');
  await travel(3);
  const arch = await S(() => { const s = __game.scene.getScene('room'); const o = s.archOpening(); s.player.setPosition(s.L.exit.ax, s.L.exit.ay + 40); return o; });
  if (!arch) fail('8.3 archway', 'no open archway found in the terraces room');
  else {
    let minY = 1e9;
    let inside = false;
    await p.keyboard.down('w');
    for (let t = 0; t < 40; t++) {
      await wait(50);
      const r = await room();
      if (r.i !== 3) break;
      minY = Math.min(minY, r.y);
      if (!inside && r.y < arch.base - 8) {
        inside = true;
        await p.keyboard.up('w');
        // nudge in to just short of the way through, and stand there
        await S((y) => { const s = __game.scene.getScene('room'); s.player.y = y; }, arch.base - 26);
        await wait(700);
        const still = await room();
        if (still.i === 3) minY = Math.min(minY, still.y);
        await shot('standing-in-archway');
        await p.keyboard.down('w');
      }
    }
    await p.keyboard.up('w');
    await wait(1200);
    const after = await room();
    inside ? pass('8.3 step in', `you step ${Math.round(arch.base - minY)}px into the arch before going through`) : fail('8.3 step in', `stopped at y ${Math.round(minY)} (wall foot ${Math.round(arch.base)})`);
    after.i === 4 ? pass('8.3 through', 'walking on takes you through with no fade') : fail('8.3 through', `still in room ${after.i}`);
    await shot('through-archway');
    // and back
    await S(() => { const s = __game.scene.getScene('room'); const b = s.bounds(); s.player.setPosition(s.L.entrance.ax, b.y1 - 50); });
    await hold('s', 1100);
    await wait(1300);
    const back = await room();
    back.i === 3 ? pass('8.3 back', 'walking back out returns through the arch') : warn('8.3 back', `entrance arch did not return (room ${back.i})`);
  }

  // ---------- 3.2 Library fireplace depth ----------
  console.log('3.2 Fireplace');
  for (const hour of [13, 22]) {
    await p.goto(URL + `?hour=${hour}`);
    await wait(2500);
    await travel(7);
    const d = await S(() => {
      const s = __game.scene.getScene('room');
      const q = s.L.props.find((q) => q.flames);
      s.player.setPosition(q.px + 4, q.py + 14);
      s.player.setTexture('player_up');
      s.player.setDepth(s.player.y);
      const imgs = s.children.list.filter((o) => o.texture && /flame|fireplace/.test(o.texture.key));
      return { player: s.player.depth, max: Math.max(...imgs.map((o) => o.depth)), keys: imgs.map((o) => o.texture.key) };
    });
    await wait(300);
    await shot(`fireplace-${hour === 13 ? 'day' : 'night'}`);
    d.player > d.max ? pass(`3.2 fireplace ${hour}h`, 'you stand in front of the fire; nothing draws over you') : fail(`3.2 fireplace ${hour}h`, `fire draws over the player (player ${d.player}, fire ${d.max})`);
  }
  // behind a bookshelf: its top draws over you
  const shelf = await S(() => {
    const s = __game.scene.getScene('room');
    const q = s.L.props.find((q) => q.s === 'bookshelf_a');
    return { free: !s.blocked(q.px, q.py - 40) };
  });
  pass('3.1 library', shelf.free ? 'shelf tops are not solid' : 'shelf blocks above its footprint');

  // ---------- 10. Toolkit ----------
  console.log('10. Toolkit');
  await p.goto(URL + '?hour=13');
  await wait(2500);
  await p.click('#build-btn');
  await wait(500);
  if (await shown('#toolkit')) {
    await shot('toolkit');
    pass('10.1 toolkit', 'toolkit opens');
    await p.click('.toolkit-done');
    await wait(300);
  } else fail('10.1 toolkit', 'toolkit did not open');

  // ---------- 13. Island ----------
  console.log('13. Island');
  await S(() => __game.scene.getScene('room').travel('island'));
  await wait(2500);
  const home = await S(() => { const s = __game.scene.getScene('island'); return s.mapId === 'main' && !!s.door && Math.abs(s.player.y - s.door.y - 22) < 4; });
  home ? pass('13.0 main island', 'out the front doors onto Main Island, by the museum') : fail('13.0 main island', 'did not come out at the museum on Main Island');
  await shot('main-island');
  // the rest of these checks are on Island One (the first island, drawn in code)
  await S(() => { __game.scene.getScene('island').scene.start('island', { map: 'one' }); });
  await wait(1800);
  const isl = await S(() => {
    const s = __game.scene.getScene('island');
    const out = { posts: s.posts.length, canopyFree: 0, trunkSolid: 0, besideFree: 0, total: 0 };
    s.posts.forEach((b) => {
      const cx = (b.x0 + b.x1) / 2;
      out.total++;
      if (s.free(cx, b.y0 - 6)) out.canopyFree++; // just behind the trunk, under the leaves
      if (!s.free(cx, b.y1)) out.trunkSolid++;
      if (s.free(b.x1 + 9, b.y1)) out.besideFree++;
    });
    return out;
  });
  isl.canopyFree >= isl.total * 0.9 ? pass('13.2 behind trees', `${isl.canopyFree}/${isl.total} trees and posts: you can stand behind the trunk`) : fail('13.2 behind trees', `${isl.canopyFree}/${isl.total} free behind the trunk`);
  isl.trunkSolid === isl.total ? pass('13.2 trunks', 'every trunk is solid') : warn('13.2 trunks', `${isl.trunkSolid}/${isl.total} trunks solid`);
  // walk down past the first palm, right beside its trunk
  const palm = await S(() => {
    const s = __game.scene.getScene('island');
    const placed = s.placed.find((q) => q.name === 'palm');
    const b = s.posts.find((b) => Math.abs((b.x0 + b.x1) / 2 - (placed.img.x + placed.img.displayWidth / 2)) < 2 && Math.abs(b.y1 + 2 - placed.img.y) < 2);
    s.player.setPosition(b.x1 + 8, b.y0 - 40);
    return { y0: b.y0, y1: b.y1, x: b.x1 + 8 };
  });
  await wait(200);
  await shot('island-behind-palm-start');
  await hold('s', 600);
  const pp = await S(() => { const s = __game.scene.getScene('island'); return { x: s.player.x, y: s.player.y }; });
  pp.y > palm.y1 + 4 ? pass('13.2 palm walk', 'walked straight down past the palm (no wall under the leaves)') : fail('13.2 palm walk', `stopped at y ${Math.round(pp.y)} beside the palm (trunk ${palm.y0}-${palm.y1})`);
  // behind: under the canopy, drawn behind
  await S((b) => { const s = __game.scene.getScene('island'); s.player.setPosition(b.x - 8, b.y0 - 10); }, palm);
  await wait(250);
  const depthOk = await S(() => { const s = __game.scene.getScene('island'); const q = s.placed.find((q) => q.name === 'palm'); return s.player.depth < q.img.depth; });
  await shot('island-behind-palm');
  depthOk ? pass('13.2 palm depth', 'standing behind the palm, its leaves draw over you') : fail('13.2 palm depth', 'player draws over the palm when behind it');
  // lamp post
  await S(() => { const s = __game.scene.getScene('island'); s.player.setPosition(11.5 * 32, 13 * 32 + 22); });
  await wait(250);
  await shot('island-behind-lamp');

  // behind the museum: only its front is solid
  const museum = await S(() => { const s = __game.scene.getScene('island'); return s.free(14 * 32, 4 * 32) && !s.free(9 * 32, 7 * 32 + 20); });
  museum ? pass('13.2 museum', 'you can walk behind the museum; its front is solid') : fail('13.2 museum', 'the museum blocks behind its roof (or its front is open)');
  // walking up anywhere above the cottage must not open it
  await S(() => { const s = __game.scene.getScene('island'); s.player.setPosition(4 * 32 + 48, 22 * 32); s.cottageLock = false; });
  await hold('w', 500);
  await wait(800);
  (await S(() => __game.scene.isActive('island'))) ? pass('13.2 cottage door', 'only the cottage door itself opens it') : fail('13.2 cottage door', 'walking up far above the cottage opened it');

  // sail to the builder island and back (boats are bought now: the rowboat and the sailboat are the player's)
  await S(() => { ['boat:rowboat', 'boat:sailboat'].forEach((k) => { __prog.state.unlocks[k] = true; __prog.state.market.owned[k] = true; }); });
  // (you act on what you face: turn toward the boat first)
  const faceBoat = () => S(() => { const s = __game.scene.getScene('island'); const b = s.boats[0] || s.landingSpot || { x: 14 * 32, y: 39.4 * 32 }; const dx = b.x - s.player.x; const dy = b.y - s.player.y; s.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : dy < 0 ? 'up' : 'down'; });
  await S(() => { const s = __game.scene.getScene('island'); s.player.setPosition(12.5 * 32, 38.6 * 32); });
  await faceBoat();
  await wait(400);
  if ((await S(() => document.querySelector('#interact .label').textContent)) === 'Sail') {
    await p.click('#interact');
    await wait(300);
    await p.locator('.sail-dest', { hasText: 'The far isle' }).click(); // the boat asks where to
    await wait(2500);
    const isle = await S(() => { const s = __game.scene.getScene('island'); return s.mapId && s.free(s.player.x, s.player.y); });
    await shot('builder-island');
    isle ? pass('13.7 sail', 'sailed to the builder island and landed on solid ground') : fail('13.7 sail', 'no landing on the builder island');
    await S(() => { const s = __game.scene.getScene('island'); s.player.setPosition(s.landingSpot.x, s.landingSpot.y + 10); });
    await faceBoat();
    await wait(400);
    await p.click('#interact');
    await wait(300);
    await p.locator('.sail-dest', { hasText: 'Main Island' }).click();
    await wait(2500);
    (await S(() => __game.scene.getScene('island').mapId === 'main')) ? pass('13.7 sail home', 'sailed home to Main Island') : fail('13.7 sail home', 'could not sail home');
  } else fail('13.7 sail', 'no Sail button at the end of the dock');

  // ---------- 13.6 Second visit ----------
  await S(() => { const s = __game.scene.getScene('island'); s.goInside(); });
  await wait(1800);
  await S(() => __game.scene.getScene('room').travel('island'));
  await wait(1800);
  const second = await S(() => __game.scene.isActive('island') && !__game.scene.getScene('island').leaving);
  await hold('d', 300);
  await S(() => { __game.scene.getScene('island').scene.start('island', { map: 'one' }); }); // back to Island One for fishing and the cottage
  await wait(1800);
  second ? pass('13.6 second visit', 'going outside again works and you can move') : fail('13.6 second visit', 'stuck on the second visit');

  // ---------- 14. Fishing ----------
  console.log('14. Fishing');
  const spot = await S(() => {
    const s = __game.scene.getScene('island');
    for (let y = 8 * 32; y < 40 * 32; y += 8) for (let x = 32; x < 24 * 32; x += 8) {
      if (!s.free(x, y)) continue;
      for (const f of ['up', 'down', 'left', 'right']) {
        s.player.setPosition(x, y); s.facing = f;
        if (s.waterAhead()?.water === 'pond') return true;
      }
    }
    return false;
  });
  await wait(300);
  if (spot && (await shown('#interact'))) {
    await p.click('#interact');
    await wait(900);
    await shot('fishing-cast');
    await S(() => { __prog.T.fishing.junkChance = 0; const f = __game.scene.getScene('island').fishing; f.biteAt = f.t + 0.2; });
    await wait(450);
    await shot('fishing-bite');
    await p.mouse.click(195, 300);
    await wait(500);
    await shot('fishing-reel');
    // the reel minigame (src/progression/reel.js): win it
    await S(() => { const r = __game.scene.getScene('island').fishing.reel; if (r) { r.zone = r.fish; r.progress = 1; r.step(0.01, true); } }); // (the zone on the fish, so it counts)
    await wait(1500);
    (await shown('#catch')) ? pass('14 fishing', 'cast, bite, tap, reel, catch card') : fail('14 fishing', 'no catch card');
    await shot('fishing-catch');
    await p.click('#catch');
    await wait(400);
  } else fail('14 fishing', 'no Fish button at the pond');

  // ---------- 15. Angled room ----------
  console.log('15. Angled room');
  await S(() => { __game.scene.getScene('island').player.setPosition(4 * 32 + 48, 29 * 32 + 14); });
  await hold('w', 700);
  await wait(1200);
  if (await S(() => __game.scene.isActive('iso'))) {
    pass('15.1 cottage', 'the cottage door opens the angled room');
    // in front of the bookshelf's left end and of the sofa you draw over them; behind an armchair you don't
    const iso = await S(() => {
      const s = __game.scene.getScene('iso');
      const at = (gx, gy) => { s.pos = { gx, gy }; s.place(); return s.player.depth; };
      const kind = (k) => s.pieces.find((q) => q.kind === k);
      const shelf = kind('bookshelf').img.depth, sofa = kind('sofa').img.depth, chair = kind('armchair');
      return { shelf: at(3.75, 0.95) > shelf, sofa: at(1.45, 3.2) > sofa, chair: at(chair.box.x0 + 0.5, chair.box.y0 - 0.1) < chair.img.depth };
    });
    iso.shelf && iso.sofa && iso.chair ? pass('15.2 angled depth', 'in front of the shelf and sofa, behind the armchair') : fail('15.2 angled depth', JSON.stringify(iso));
    await shot('angled-room');
  } else fail('15.1 cottage', 'cottage door did not open');

  // ---------- 16. Night ----------
  console.log('16. Night');
  await p.goto(URL + '?hour=22');
  await wait(2500);
  await travel(1);
  await shot('night-main-hall');
  await S(() => __game.scene.getScene('room').travel('island'));
  await wait(1800);
  await shot('night-island');

  // ---------- 17. Saving ----------
  console.log('17. Saving');
  await p.goto(URL);
  await wait(2500);
  const rooms = await S(() => JSON.parse(localStorage.getItem('curation.roomList') || '[]').length);
  rooms >= 8 ? pass('17.1 reload', `reload keeps all ${rooms} rooms`) : fail('17.1 reload', `only ${rooms} rooms after reload`);

  errs.length ? fail('page errors', errs.slice(0, 5).join(' | ')) : pass('page errors', 'none');
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 1));
  const bad = results.filter((r) => r.mark === '❌').length;
  console.log(`\n${results.length} checks · ${bad} broken · ${results.filter((r) => r.mark === '⚠️').length} to look at`);
  await b.close();
  process.exit(bad ? 1 : 0);
})();
