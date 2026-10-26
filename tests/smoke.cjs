// Smoke test: plays through the game in a phone-sized browser and reports
// page errors, stuck spots, NPCs inside walls and broken flows.
// Usage: npm run build && npx vite preview --port 4173 --base / &
//        PW=/path/to/playwright node tests/smoke.cjs
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/';

const problems = [];
const fail = (msg) => {
  problems.push(msg);
  console.log('  ✗ ' + msg);
};
const ok = (msg) => console.log('  ✓ ' + msg);

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.stack || e.message));
  await p.route('https://upload.wikimedia.org/**', (r) =>
    r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#6b8e3a"/></svg>' }),
  );
  const scene = (fn, arg) => p.evaluate(fn, arg);
  const shown = (sel) => p.evaluate((q) => { const e = document.querySelector(q); return !!e && !e.classList.contains('hidden'); }, sel);
  const settle = (ms = 1800) => p.waitForTimeout(ms);
  const travel = async (room, spawn = 'entrance') => {
    await scene(([r, s]) => __game.scene.getScene('room').travel(r, s, true), [room, spawn]);
    await settle(1500);
  };

  // Fresh save
  console.log('Fresh save');
  await p.goto(URL);
  await settle(2500); // let the first load finish writing before wiping it
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await settle(2500);
  if (await p.$('#crash')) fail('crash screen on a fresh save');
  else ok('loads');
  let greeted = false;
  for (let i = 0; i < 10 && !greeted; i++) {
    greeted = await shown('#talk');
    await settle(300);
  }
  if (greeted) ok('tutorial greets the player');
  else fail('no tutorial greeting');

  // Simulate time in the current room and check people stay where they should.
  const roomCheck = async (label) => {
    const r = await scene(() => {
      const s = __game.scene.getScene('room');
      const b = s.bounds();
      const out = { stuck: 0, tried: 0, inWall: [], overlap: 0, playerInWall: 0 };
      // NPCs wander for ~60 s of game time.
      for (let i = 0; i < 1200; i++) s.npcs.forEach((n) => s.updateVisitor(n, 0.05));
      s.npcs.forEach((n) => {
        if (n.fixed || n.follow || n.seat) return; // (seated people sit on a bench, inside its footprint)
        if (s.blocked(n.s.x, n.s.y) || n.s.x < b.x0 - 1 || n.s.x > b.x1 + 1 || n.s.y < b.y0 - 1 || n.s.y > b.y1 + 1) out.inWall.push(`${n.kind}@${Math.round(n.s.x)},${Math.round(n.s.y)}${JSON.stringify(s.blocks.filter((k) => n.s.x > k.x0 - 6 && n.s.x < k.x1 + 6 && n.s.y > k.y0 && n.s.y < k.y1 + 8))}`);
      });
      const free = s.npcs.filter((n) => !n.follow);
      for (let i = 0; i < free.length; i++) for (let j = i + 1; j < free.length; j++) if (Math.abs(free[i].s.x - free[j].s.x) < 6 && Math.abs(free[i].s.y - free[j].s.y) < 4) out.overlap++;
      // The player: from many free spots, can they move at all?
      const keep = { x: s.player.x, y: s.player.y };
      const saveNpcs = s.npcs.map((n) => [n.s.x, n.s.y]);
      s.npcs.forEach((n) => n.s.setPosition(-999, -999)); // test walls only
      s.input.enabled = true;
      s.dragging = true;
      const travel = s.travel;
      s.travel = () => {}; // walking into an archway would leave the room mid-test
      for (let y = b.y0; y <= b.y1; y += 16) {
        for (let x = b.x0; x <= b.x1; x += 16) {
          if (s.blocked(x, y)) continue;
          out.tried++;
          let moved = false;
          for (const [vx, vy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            s.player.setPosition(x, y);
            s.dragVec = { x: vx, y: vy };
            for (let k = 0; k < 4; k++) s.update(0, 16);
            if (Math.hypot(s.player.x - x, s.player.y - y) > 2) moved = true;
            if (s.blocked(s.player.x, s.player.y)) out.playerInWall++;
          }
          if (!moved) out.stuck++;
        }
      }
      s.travel = travel;
      s.dragging = false;
      s.dragVec = null;
      s.npcs.forEach((n, i) => n.s.setPosition(...saveNpcs[i]));
      s.player.setPosition(keep.x, keep.y);
      s.archLock = true; // we were teleported, not walking through
      return out;
    });
    if (r.stuck) fail(`${label}: player stuck at ${r.stuck}/${r.tried} spots`);
    if (r.playerInWall) fail(`${label}: player walked into a wall ${r.playerInWall} times`);
    if (r.inWall.length) fail(`${label}: NPCs in walls/outside: ${r.inWall.join(' ')}`);
    if (r.overlap > 1) fail(`${label}: ${r.overlap} NPC pairs standing in each other`);
    if (!r.stuck && !r.playerInWall && !r.inWall.length && r.overlap <= 1) ok(`${label}: movement OK (${r.tried} spots)`);
  };

  const talkAll = async (label) => {
    const r = await scene(() => {
      const s = __game.scene.getScene('room');
      let n = 0;
      s.npcs.forEach((v) => {
        if (v.kind === 'guard') return; // opens the camera offer
        s.talkTo(v);
        if (!document.querySelector('.talk-text').textContent) throw new Error('empty line from ' + v.kind);
        s.endTalk();
        n++;
      });
      return n;
    });
    ok(`${label}: talked to ${r} people`);
  };

  await roomCheck('Entrance');
  await talkAll('Entrance');

  // Clean all mess
  const left = await scene(() => {
    const s = __game.scene.getScene('room');
    [...s.mess].forEach((m) => s.clean(m));
    return s.mess.length;
  });
  if (left) fail('mess left after cleaning');
  else ok('cleaned the entrance');

  // Buy the main hall through the double doors
  await scene(() => {
    const s = __game.scene.getScene('room');
    s.player.setPosition(s.L.exit.ax, s.L.exit.ay);
    s.focus = s.findFocus();
    s.interact();
  });
  await settle(300);
  if (!(await shown('#ask'))) fail('no offer to open the main hall');
  else {
    await p.click('.ask-yes');
    await settle(2000);
    const idx = await scene(() => __game.scene.getScene('room').roomIndex);
    if (idx === 1) ok('opened the main hall');
    else fail('did not travel to the main hall');
  }
  await roomCheck('Main hall');
  await talkAll('Main hall');

  // Doors in the hallway
  await scene(() => {
    const s = __game.scene.getScene('room');
    const d = s.L.decorDoors.find((d) => d.label === 'Break room');
    const st = s.standFor({ wall: d.wall, u: (d.rect.u0 + d.rect.u1) / 2 });
    s.player.setPosition(st.x, st.y);
    s.focus = s.findFocus();
    s.interact();
  });
  await settle(1500);
  if ((await scene(() => __game.scene.getScene('room').roomIndex)) === 'break') ok('break room door works');
  else fail('break room door did not open');
  await roomCheck('Break room');
  await scene(() => {
    const s = __game.scene.getScene('room');
    s.player.setPosition(s.boardFront.x, s.boardFront.y + 4);
    s.focus = s.findFocus();
    s.interact();
  });
  await settle(300);
  if (await shown('#staffmenu')) {
    ok('staff board opens');
    await p.click('.staff-close');
  } else fail('staff board did not open');
  await travel(1, 'breakdoor');

  // Office door
  await scene(() => {
    const s = __game.scene.getScene('room');
    const d = s.L.decorDoors.find((d) => d.label === 'Office');
    const st = s.standFor({ wall: d.wall, u: (d.rect.u0 + d.rect.u1) / 2 });
    s.player.setPosition(st.x, st.y);
    s.focus = s.findFocus();
    s.interact();
  });
  await settle(300);
  if (await shown('#office')) {
    ok('office opens');
    await p.click('.office-close');
  } else fail('office did not open');

  // Buy the atrium through the main hall's middle arch
  await scene(() => {
    const s = __game.scene.getScene('room');
    s.player.setPosition(s.L.exit.ax, s.L.exit.ay + 2);
    s.focus = s.findFocus();
    s.interact();
  });
  await settle(300);
  if (!(await shown('#ask'))) fail('no offer to open the atrium');
  else {
    await p.click('.ask-yes');
    await settle(2000);
    if ((await scene(() => __game.scene.getScene('room').roomIndex)) === 2) ok('opened the atrium');
    else fail('did not travel to the atrium');
  }
  await roomCheck('Atrium');
  await talkAll('Atrium');

  // The shaped rooms in a row behind the atrium
  for (const i of [3, 4, 5, 6, 7]) {
    await travel(i, 'entrance');
    const name = await scene(() => __game.scene.getScene('room').room.plan);
    await roomCheck(`Shaped room (${name})`);
  }

  // Build rooms of every kind through the last shaped room's arch
  const kinds = [['vertical', 'short'], ['horizontal', 'medium'], ['square', 'short'], ['vertical', 'long']];
  await scene(() => localStorage.setItem('curation.office', '5'));
  for (const [orient, size] of kinds) {
    const at = await scene(() => __game.scene.getScene('room').roomIndex);
    await scene(() => {
      const s = __game.scene.getScene('room');
      s.player.setPosition(s.L.exit.ax, s.L.exit.ay + 2);
      s.focus = s.findFocus();
      window.__focus = JSON.stringify(Object.keys(s.focus || {})) + ' exit=' + JSON.stringify(s.L.exit && { ax: s.L.exit.ax, ay: s.L.exit.ay, kind: s.L.exit.kind });
      s.interact();
    });
    await settle(500);
    if (!(await shown('#build'))) {
      fail(`build menu did not open (room ${at}) focus ${await scene(() => window.__focus)}`);
      break;
    }
    await p.click(`[data-orient="${orient}"]`);
    await p.click(`[data-size="${size}"]`);
    // swipe the end carousel to a door ending
    await p.click('.build-buy');
    await settle(1800);
    const now = await scene(() => {
      const s = __game.scene.getScene('room');
      return { i: s.roomIndex, orient: s.room.orient, exit: s.room.exit };
    });
    if (now.orient !== orient) {
      fail(`building ${orient} ${size} failed`);
      break;
    }
    ok(`built a ${size} ${orient} room (exit ${now.exit})`);
    await roomCheck(`${orient} ${size}`);
    await talkAll(`${orient} ${size}`);
    if (now.exit === 'none') {
      // swap to a door so the chain can continue
      await scene(() => {
        const s = __game.scene.getScene('room');
        const r = JSON.parse(localStorage.getItem('curation.roomList'));
        r[s.roomIndex].exit = 'door-back';
        localStorage.setItem('curation.roomList', JSON.stringify(r));
        s.rebuild();
      });
      await settle(1500);
    }
  }

  // Journal: goals to claim, the collection
  await p.click('#journal-btn');
  await settle(400);
  if (!(await shown('#journal'))) fail('journal did not open');
  else {
    const claimable = await p.$$('.quest-claim');
    if (claimable.length) {
      const before = await scene(() => Number(localStorage.getItem('curation.coins')));
      await claimable[0].click();
      await settle(300);
      const after = await scene(() => Number(localStorage.getItem('curation.coins')));
      if (after > before) ok(`claimed a goal (+${after - before} gold)`);
      else fail('claiming a goal gave no gold');
    } else fail('no goal ready to claim after cleaning and opening the hall');
    for (const t of ['paintings', 'visitors']) {
      await p.click(`[data-jtab="${t}"]`);
      await settle(200);
    }
    ok('journal tabs open');
    await p.click('.journal-close');
    await settle(300);
  }

  // Customize: theme, room size, reorder, character, janitor
  await p.click('#home-btn');
  await settle(300);
  await p.click('[data-tab="room"]');
  await settle(150);
  const theme = await p.$$('text=Egyptian');
  if (theme.length) {
    await theme[0].click();
    await settle(400);
    ok('applied a theme');
  } else fail('no theme buttons');
  const sizeBtn = await p.$('section >> text=Short');
  if (sizeBtn) {
    await sizeBtn.click();
    await settle(1500);
    const sz = await scene(() => __game.scene.getScene('room').room.size);
    if (sz === 'short') ok('resized the room');
    else fail('resize did not apply: ' + sz);
  }
  await p.click('#home-btn');
  await settle(300);
  await p.click('[data-tab="rooms"]');
  await settle(200);
  const moved = await scene(() => {
    const before = JSON.parse(localStorage.getItem('curation.roomList')).map((r) => r.orient + r.size).join(',');
    const up = [...document.querySelectorAll('.room-list button')].find((b) => b.textContent.trim() === '↑' && !b.disabled);
    up?.click();
    return before;
  });
  await settle(1500);
  const order = await scene(() => JSON.parse(localStorage.getItem('curation.roomList')).map((r) => r.orient + r.size).join(','));
  if (order !== moved) ok('reordered rooms');
  else fail('room reorder did nothing');
  await p.click('#home-btn');
  await settle(300);
  await p.click('[data-tab="character"]');
  await settle(200);
  const dots = await p.$$('.decor-body .dot');
  if (dots.length > 3) {
    await dots[2].click();
    await settle(200);
    ok('changed the curator');
  } else fail('no character swatches');
  await p.click('.decor-close');
  await settle(300);

  // Customize panel: every tab
  await p.click('#home-btn');
  await settle(300);
  for (const t of ['room', 'rooms', 'character']) {
    await p.click(`[data-tab="${t}"]`);
    await settle(150);
    const over = await p.evaluate(() => {
      const s = document.querySelector('.decor-sheet');
      return s.scrollWidth > s.clientWidth + 1;
    });
    if (over) fail(`Customize ${t} tab scrolls sideways`);
  }
  ok('Customize tabs open');
  await p.click('.decor-close');

  // Toolkit: place and sell an item
  await p.click('#build-btn');
  await settle(300);
  const placed = await scene(() => {
    const s = __game.scene.getScene('room');
    s.startPlacing({ type: 'bench', rot: 0 });
    for (let r = 0; r < s.g.fd; r++) for (let c = 0; c < s.g.fw; c++) {
      s.ghost.c = c;
      s.ghost.r = r;
      if (s.canPlace(s.ghost)) {
        s.confirmPlacing();
        return s.items.length;
      }
    }
    return 0;
  });
  if (placed) ok('placed a bench');
  else fail('could not place a bench');
  await p.click('.toolkit-done');

  // Collect all (ad)
  await p.click('#collect-all');
  await settle(5800);
  if (await shown('#ad')) fail('ad did not close');
  else ok('collect all works');

  // HUD at huge numbers
  await scene(() => {
    localStorage.setItem('curation.coins', '987654321');
    window.dispatchEvent(new Event('coins'));
  });
  await settle(200);
  const hudOver = await p.evaluate(() => {
    const h = document.getElementById('hud');
    return h.scrollWidth > h.clientWidth + 1 || [...h.querySelectorAll('*')].some((e) => e.getBoundingClientRect().right > innerWidth);
  });
  if (hudOver) fail('HUD overflows at large numbers');
  else ok('HUD fits large numbers');

  // Reload: state survives
  const before = await scene(() => __game.scene.getScene('room').rooms.length);
  await p.reload();
  await settle(2500);
  const after = await scene(() => __game.scene.getScene('room').rooms.length);
  if (before !== after) fail('rooms lost on reload');
  else ok(`reload keeps ${after} rooms`);

  // Guard: buy cameras
  await travel(1);
  await scene(() => {
    const s = __game.scene.getScene('room');
    s.talkTo(s.npcs.find((n) => n.kind === 'guard'));
  });
  await settle(300);
  if (await shown('#ask')) {
    await p.click('.ask-yes');
    await settle(300);
    if (await scene(() => localStorage.getItem('curation.cameras'))) ok('bought cameras');
    else ok('camera offer answered');
  } else fail('guard did not offer cameras');

  // Out the front door to the island, and back in
  await travel(0, 'start');
  await p.keyboard.down('s');
  await settle(1500);
  await p.keyboard.up('s');
  await settle(1200);
  const outside = await scene(() => __game.scene.isActive('island'));
  if (!outside) fail('walking out the front door did not reach the island');
  else {
    ok('walked out onto the island');
    // Fishing: face the pond, cast, wait for the bite, tap to hook
    const spot = await scene(() => {
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
    await settle(300);
    if (!spot || !(await shown('#interact'))) fail('no Fish button at the pond');
    else {
      await p.click('#interact');
      await settle(800);
      await scene(() => { const f = __game.scene.getScene('island').fishing; f.biteAt = f.t + 0.2; });
      await settle(400);
      await p.mouse.click(200, 300);
      await settle(900);
      if (await shown('#catch')) ok('caught something fishing');
      else fail('fishing: no catch card after hooking');
      await p.click('#catch');
      await settle(400);
    }
    await scene(() => __game.scene.getScene('island').player.setPosition(12 * 32, 9 * 32 + 10));
    await p.keyboard.down('w');
    await settle(800);
    await p.keyboard.up('w');
    await settle(1500);
    if (await scene(() => __game.scene.isActive('room') && __game.scene.getScene('room').roomIndex === 0)) ok('walked back into the museum');
    else fail('could not get back in from the island');
  }

  // Robbery pop-up
  await p.goto(URL + '?rob');
  await settle(3000);
  if (await shown('#ask')) {
    ok('robbery pop-up shows');
    await p.click('.ask-yes');
  } else fail('no robbery pop-up with ?rob');

  // Old save from before the entrance existed: rooms move back behind the fixed ones
  await p.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('curation.rooms', JSON.stringify([{ orient: 'horizontal', size: 'short', exit: 'door-back' }]));
    localStorage.setItem('curation.coins', '1234');
  });
  await p.goto(URL);
  await settle(3000);
  if (await p.$('#crash')) fail('crash screen on an old save');
  else {
    const list = await scene(() => JSON.parse(localStorage.getItem('curation.roomList')).map((r) => r.orient).join(','));
    if (list.startsWith('entry,main,atrium,shaped,shaped,shaped,shaped,shaped,vertical,horizontal')) ok('old save migrates: ' + list);
    else fail('old save migration gave ' + list);
  }

  // Corrupt save values must not crash
  await p.evaluate(() => {
    localStorage.setItem('curation.items', '{"0": "junk"}');
    localStorage.setItem('curation.roomDecor', 'not json');
    localStorage.setItem('curation.character', '42');
  });
  await p.reload();
  await settle(3000);
  if (await p.$('#crash')) fail('crash screen on a corrupt save: ' + (await p.textContent('#crash small')));
  else ok('survives a corrupt save');

  if (errs.length) errs.forEach((e) => fail('page error: ' + e.split('\n').slice(0, 3).join(' | ')));
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  await b.close();
  process.exit(problems.length ? 1 : 0);
})();
