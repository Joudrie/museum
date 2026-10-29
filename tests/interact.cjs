// Interaction polish: you act on what you face, speech bubbles stay with their speaker and
// go when it does, people chat with each other, footprints stay in the snow, and island
// people hold real conversations.
// Usage: PW=/path/to/playwright node tests/interact.cjs      (preview server on :4173)
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/';

const problems = [];
const fail = (msg) => {
  problems.push(msg);
  console.log('  ✗ ' + msg);
};
const ok = (msg) => console.log('  ✓ ' + msg);
const check = (cond, good, bad) => (cond ? ok(good) : fail(bad));

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.stack || e.message));
  await p.route('https://upload.wikimedia.org/**', (r) => r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#6b8e3a"/></svg>' }));
  const wait = (ms) => p.waitForTimeout(ms);
  const open = async (q = '') => {
    await p.goto(URL + q);
    await p.waitForFunction(() => window.__game && __game.scene.getScenes(true).length > 0, null, { timeout: 30000 });
    await wait(1200);
  };
  const island = async (data = { map: 'main' }) => {
    await p.evaluate((d) => { __game.scene.getScene('room').scene.start('island', d); }, data);
    await p.waitForFunction(() => __game.scene.isActive('island'), null, { timeout: 15000 });
    await wait(1500);
  };

  console.log('The Interact button follows what you face');
  await open('?season=autumn&weather=clear');
  await island();
  const f = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const n = s.islanders.find((o) => !o.animal);
    s.islanders.forEach((o) => o !== n && o.s.setPosition(-999, -999));
    s.boats.length = 0;
    s.landingSpot = null;
    const kind = () => Object.keys(s.findFocus() || {}).find((k) => k !== 'icon') || 'none';
    const face = (dir) => { s.facing = dir; s.player.setTexture(dir === 'up' ? 'player_up' : dir === 'down' ? 'player_down' : 'player_side'); };
    const out = {};
    n.target = null;
    s.player.setPosition(n.s.x, n.s.y - 24);
    face('up');
    out.away = kind();
    face('down');
    out.toward = kind();
    out.label = s.focusLabel(s.findFocus());
    // the museum doors in front of me, someone right behind me
    s.player.setPosition(s.door.x, s.door.y + 14);
    n.s.setPosition(s.door.x + 4, s.door.y + 38);
    face('up');
    out.doorFirst = kind();
    face('down');
    out.personWhenTurned = kind();
    return out;
  });
  check(f.away === 'none', 'someone behind you is out of reach', `person behind the player still focused: ${f.away}`);
  check(f.toward === 'npc' && f.label === 'Talk', 'facing them you can Talk', `facing a person gave ${f.toward} / ${f.label}`);
  check(f.doorFirst === 'door', 'facing the doors with a person at your back gives the doors', `doors with someone behind gave ${f.doorFirst}`);
  check(f.personWhenTurned === 'npc', 'turn round and it is the person', `turned toward the person gave ${f.personWhenTurned}`);

  console.log('Island conversation');
  await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const n = s.islanders.find((o) => !o.animal);
    s.player.setPosition(n.s.x, n.s.y - 24);
    s.facing = 'down';
    s.talkTo(n);
  });
  await wait(900);
  const chat = await p.evaluate(() => ({ open: !document.querySelector('#chat').classList.contains('hidden'), text: document.querySelector('.chat-text').textContent.length > 0, paused: __game.scene.getScene('island').paused }));
  check(chat.open && chat.text && chat.paused, 'talking to an islander opens the conversation box', `chat ${JSON.stringify(chat)}`);
  await p.evaluate(() => __game.scene.getScene('island').endTalk());
  const after = await p.evaluate(() => ({ open: !document.querySelector('#chat').classList.contains('hidden'), paused: __game.scene.getScene('island').paused }));
  check(!after.open && !after.paused, 'ending the talk lets you walk again', `still open/paused: ${JSON.stringify(after)}`);

  console.log('People chat with each other');
  const chatting = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const humans = s.islanders.filter((o) => !o.animal && !o.script);
    const [a, c] = humans;
    s.islanders.forEach((o) => o !== a && o !== c && o.s.setPosition(-999, -999));
    a.s.setPosition(s.player.x - 18, s.player.y + 70);
    c.s.setPosition(s.player.x + 18, s.player.y + 70);
    a.target = c.target = null;
    a.chatAt = c.chatAt = 0;
    const started = s.chatBetween(a, c);
    return { started, both: !!(a.chatting && c.chatting) };
  });
  check(chatting.started && chatting.both, 'two neighbours start a chat', `chat did not start ${JSON.stringify(chatting)}`);
  await wait(1500);
  const emoting = await p.evaluate(() => {
    const humans = __game.scene.getScene('island').islanders.filter((o) => !o.animal && !o.script);
    return humans.slice(0, 2).some((o) => o.emoteImg?.active);
  });
  check(emoting, 'they trade pictures over their heads', 'no emote appeared during the chat');
  await wait(7500);
  const over = await p.evaluate(() => __game.scene.getScene('island').islanders.filter((o) => o.chatting).length);
  check(over === 0, 'the chat ends and they get on with their day', `${over} people are still chatting`);

  console.log('Speech bubbles follow, and go with the speaker');
  await open();
  await wait(500);
  const bub = await p.evaluate(() => {
    const s = __game.scene.getScene('room');
    s.caretakerSays('Welcome to the museum. Mind the wet floor, and have a look around!');
    const shown = !document.querySelector('#talk').classList.contains('hidden');
    const d0 = document.querySelector('.talk-body').getAttribute('d');
    const n = s.npcs.find((o) => o.kind === 'caretaker');
    n.s.x -= 40;
    return { shown, d0, who: document.querySelector('.talk-who').textContent, n: !!n };
  });
  await wait(300);
  const moved = await p.evaluate(() => document.querySelector('.talk-body').getAttribute('d'));
  check(bub.shown && /Edmund/.test(bub.who), 'Edmund speaks in a bubble over his head', 'no bubble');
  check(moved !== bub.d0, 'the bubble tail follows the speaker', 'the bubble stayed where it was');
  await p.evaluate(() => { __game.scene.getScene('room').scene.start('island', { map: 'main' }); });
  await wait(2500);
  const stale = await p.evaluate(() => !document.querySelector('#talk').classList.contains('hidden'));
  check(!stale, 'leaving the room takes its bubble with it', 'the museum bubble is still up on the island');

  console.log('Visitors chat in the museum');
  await open();
  const room = await p.evaluate(() => {
    const s = __game.scene.getScene('room');
    const vs = s.npcs.filter((n) => !n.staff && !n.famous && !n.follow && !n.partner);
    if (vs.length < 2) return { skip: true };
    const [a, c] = vs;
    a.target = c.target = null;
    a.goal = c.goal = null;
    a.seat = c.seat = null;
    c.s.setPosition(a.s.x + 20, a.s.y);
    a.chatAt = c.chatAt = 0;
    return { started: s.chatBetween(a, c), both: !!(a.chatting && c.chatting) };
  });
  if (room.skip) ok('(not enough visitors to test a chat)');
  else check(room.started && room.both, 'two visitors side by side start a chat', `room chat did not start ${JSON.stringify(room)}`);

  console.log('Footprints in the snow');
  await open('?season=winter&weather=clear');
  await island();
  const prints = await p.evaluate(async () => {
    const s = __game.scene.getScene('island');
    let spot = null;
    for (let y = 150; y < 1100 && !spot; y += 8)
      for (let x = 150; x < 700 && !spot; x += 8) {
        if (!s.free(x, y)) continue;
        let n = 0;
        for (let k = 0; k < 10; k++) if (s.free(x, y + k * 8) && s.snowAt(x, y + k * 8)) n++;
        if (n === 10) spot = { x, y };
      }
    if (!spot) return { spot: false };
    s.player.setPosition(spot.x, spot.y);
    s.dragging = true;
    s.dragVec = { x: 0, y: 1 };
    s.dragMag = 1;
    await new Promise((r) => setTimeout(r, 1300));
    s.dragging = false;
    return { spot: true, live: s.prints.pool.filter((q) => q.img.visible).length };
  });
  check(prints.spot && prints.live >= 2, `walking in snow leaves footprints (${prints.live})`, `no footprints in the snow ${JSON.stringify(prints)}`);

  console.log('The boat');
  await open('?season=summer&weather=clear&holiday=none');
  await island({ map: 'main', spawn: 'dock' });
  const walkTo = (vx, vy, frames) =>
    p.evaluate(([x, y, n]) => {
      const s = __game.scene.getScene('island');
      s.dragging = true;
      s.dragVec = { x, y };
      s.dragMag = 1;
      for (let i = 0; i < n; i++) s.update(0, 16);
      s.dragging = false;
      s.dragVec = null;
      s.update(0, 16);
    }, [vx, vy, frames]);
  await walkTo(0, 1, 170); // down off the dock to the water's edge
  const shore = await p.evaluate(() => { const s = __game.scene.getScene('island'); return { mode: s.waterMode, shown: !document.querySelector('#interact2').classList.contains('hidden'), label: document.querySelector('#interact2 .label').textContent }; });
  check(shore.mode === 'boat' && shore.shown && shore.label === 'Boat', 'facing the water offers a Boat next to Fish', `no Boat button at the shore ${JSON.stringify(shore)}`);
  await p.click('#interact2');
  await wait(900);
  const aboard = await p.evaluate(() => { const s = __game.scene.getScene('island'); return { afloat: s.boat.active, paused: s.paused, pet: s.pet ? s.pet.s.visible : null }; });
  check(aboard.afloat && !aboard.paused, 'you hop into the boat', `not afloat ${JSON.stringify(aboard)}`);
  const from = await p.evaluate(() => { const s = __game.scene.getScene('island'); return [s.player.x, s.player.y]; });
  await walkTo(0, 1, 90);
  const rowed = await p.evaluate(([x0, y0]) => { const s = __game.scene.getScene('island'); return { moved: Math.hypot(s.player.x - x0, s.player.y - y0), onWater: s.boatWater(s.player.x, s.player.y), fish: document.querySelector('#interact .label').textContent }; }, from);
  check(rowed.moved > 40 && rowed.onWater, `you row across the water (${Math.round(rowed.moved)} px)`, `rowing broke ${JSON.stringify(rowed)}`);
  await walkTo(0, -1, 400); // back toward the shore until the boat stops
  const near = await p.evaluate(() => { const s = __game.scene.getScene('island'); return { mode: s.waterMode, onWater: s.boatWater(s.player.x, s.player.y) }; });
  check(near.onWater && near.mode === 'hop', 'the boat stops at the shore and offers Hop out', `at the shore: ${JSON.stringify(near)}`);
  await p.click('#interact2');
  await wait(800);
  const out = await p.evaluate(() => { const s = __game.scene.getScene('island'); s.facing = 'down'; s.player.setTexture('player_down'); const f = s.findFocus(); return { afloat: s.boat.active, moored: !!s.boat.skiff, walkable: s.free(s.player.x, s.player.y), focus: f ? Object.keys(f)[0] : 'none', label: s.focusLabel(f) }; });
  check(!out.afloat && out.moored && out.walkable, 'hopping out leaves the boat moored and you on the shore', `hop out ${JSON.stringify(out)}`);
  check(out.focus === 'skiff' && out.label === 'Hop in', 'facing the moored boat you can hop back in', `moored boat focus ${JSON.stringify(out)}`);

  console.log('Little scenes');
  await open('?season=autumn&weather=clear&holiday=none');
  await island({ map: 'main' });
  const scenes = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const ids = s.islanders.filter((n) => n.vignette).map((n) => n.vignette);
    const keeper = s.islanders.find((n) => n.vignette === 'keeper');
    const kid = s.islanders.find((n) => n.vignette === 'kid0');
    const out = { ids: ids.join(',') };
    if (keeper) {
      s.player.setPosition(keeper.home.x, keeper.home.y + 70);
      for (let i = 0; i < 400; i++) s.moveIslanders(0.02);
      out.keeper = { state: keeper.script.state, pile: keeper.script.heap.scaleX };
    }
    if (kid) {
      s.player.setPosition(kid.home.x, kid.home.y + 70);
      const c = kid.script;
      for (let i = 0; i < 100; i++) s.moveIslanders(0.02);
      out.kids = s.islanders.filter((n) => /^kid/.test(n.vignette || '')).map((n) => n.s.x + ',' + n.s.y);
    }
    return out;
  });
  check(/keeper/.test(scenes.ids) && /kid0/.test(scenes.ids), `the lawn has its little scenes (${scenes.ids})`, `no little scenes: ${scenes.ids}`);
  check(scenes.keeper && ['work', 'rest'].includes(scenes.keeper.state) && scenes.keeper.pile >= 0.85, 'the groundskeeper works and rests', `keeper ${JSON.stringify(scenes.keeper)}`);
  check(scenes.kids && new Set(scenes.kids).size === scenes.kids.length, 'the kids run their circle, each in a different place', `kids ${JSON.stringify(scenes.kids)}`);

  check(errs.length === 0, 'no page errors', `page errors: ${errs.slice(0, 2).join(' | ')}`);
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
