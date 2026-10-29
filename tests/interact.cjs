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
    await p.goto(URL + q + (q ? '&' : '?') + 'hour=12'); // (noon: some things, like the little scenes, only happen by day)
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
  const chat = await p.evaluate(() => ({ open: (!!document.querySelector('#chat') && !document.querySelector('#chat').classList.contains('hidden')), text: document.querySelector('.chat-text').textContent.length > 0, paused: __game.scene.getScene('island').paused }));
  check(chat.open && chat.text && !chat.paused, 'talking to an islander opens the conversation box (the game keeps running)', `chat ${JSON.stringify(chat)}`);
  const hidesButtons = await p.evaluate(() => { const s = __game.scene.getScene('island'); s.update(0, 16); return s.interactBtn.classList.contains('hidden'); });
  check(hidesButtons, 'the Interact button is put away while the box is up', 'Interact still showing over the conversation');
  await p.evaluate(() => __game.scene.getScene('island').endTalk());
  const after = await p.evaluate(() => ({ open: (!!document.querySelector('#chat') && !document.querySelector('#chat').classList.contains('hidden')), paused: __game.scene.getScene('island').paused }));
  check(!after.open && !after.paused, 'ending the talk lets you walk again', `still open/paused: ${JSON.stringify(after)}`);
  // walking off ends it by itself
  await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const n = s.islanders.find((o) => !o.animal);
    s.player.setPosition(n.s.x, n.s.y - 24);
    s.facing = 'down';
    s.talkTo(n);
  });
  await wait(400);
  await p.evaluate(() => { const s = __game.scene.getScene('island'); s.player.setPosition(s.player.x, s.player.y - 120); });
  await wait(400);
  const left = await p.evaluate(() => ({ open: !document.querySelector('#chat').classList.contains('hidden'), handle: !!__game.scene.getScene('island').chatHandle, talkingTo: !!__game.scene.getScene('island').talkingTo }));
  check(!left.open && !left.handle && !left.talkingTo, 'walking away ends the conversation', `still up after walking off: ${JSON.stringify(left)}`);

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
  let emoting = false;
  for (let i = 0; i < 16 && !emoting; i++) {
    await wait(200);
    emoting = await p.evaluate(() => __game.scene.getScene('island').islanders.filter((o) => !o.animal && !o.script).slice(0, 2).some((o) => o.emoteImg?.active));
  }
  check(emoting, 'they trade pictures over their heads', 'no emote appeared during the chat');
  let over = 2;
  for (let i = 0; i < 40 && over > 0; i++) {
    await wait(300);
    over = await p.evaluate(() => __game.scene.getScene('island').islanders.filter((o) => o.chatting).length);
  }
  check(over === 0, 'the chat ends and they get on with their day', `${over} people are still chatting`);

  console.log('Speech bubbles follow, and go with the speaker');
  await open();
  await wait(500);
  const bub = await p.evaluate(() => {
    const s = __game.scene.getScene('room');
    s.caretakerSays('Welcome to the museum. Mind the wet floor, and have a look around!');
    const shown = true;
    const d0 = document.querySelector('.talk-body').getAttribute('d');
    const n = s.npcs.find((o) => o.kind === 'caretaker');
    n.s.x -= 40;
    return { shown, d0, who: document.querySelector('.talk-who').textContent, n: !!n };
  });
  await wait(300);
  const moved = await p.evaluate(() => document.querySelector('.talk-body').getAttribute('d'));
  // (it must still be there a moment later: across the room from Edmund is where you start)
  const still = await p.evaluate(() => !document.querySelector('#talk').classList.contains('hidden'));
  check(bub.shown && still && /Edmund/.test(bub.who), 'Edmund speaks in a bubble over his head, and it stays', 'no bubble (or it vanished at once)');
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

  console.log('The rowboat (src/rowing.js)');
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
  await walkTo(0, 1, 200); // down off the dock into the water
  const asked = await p.evaluate(() => { const c = document.querySelector('#rowask'); return !!c && !c.classList.contains('hidden') && /row out/i.test(c.textContent); });
  check(asked, 'pushing into open water asks "Row out?"', 'no question at the water');
  await p.click('#rowask .ra-yes');
  await wait(900);
  const aboard = await p.evaluate(() => { const s = __game.scene.getScene('island'); return { afloat: !!s.row?.on, paused: s.paused }; });
  check(aboard.afloat && !aboard.paused, 'you hop into the boat and can move', `not afloat ${JSON.stringify(aboard)}`);
  const from = await p.evaluate(() => { const s = __game.scene.getScene('island'); return [s.player.x, s.player.y]; });
  await walkTo(0, 1, 90);
  const rowed = await p.evaluate(([x0, y0]) => { const s = __game.scene.getScene('island'); return { moved: Math.hypot(s.player.x - x0, s.player.y - y0), onWater: s.row.wet(s.player.x, s.player.y - 4) }; }, from);
  check(rowed.moved > 40 && rowed.onWater, `you row across the water (${Math.round(rowed.moved)} px)`, `rowing broke ${JSON.stringify(rowed)}`);
  const fishFromBoat = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const labels = {};
    for (const f of ['up', 'down', 'left', 'right']) {
      s.facing = f;
      s.player.setTexture(f === 'left' || f === 'right' ? 'player_side' : `player_${f}`);
      labels[f] = s.focusLabel(s.findFocus());
    }
    return labels;
  });
  check(Object.values(fishFromBoat).includes('Fish'), 'you can fish from the boat (facing open water)', `from the boat: ${JSON.stringify(fishFromBoat)}`);
  await walkTo(0, -1, 500); // back toward the shore: rowing into land climbs out
  await wait(600);
  const out = await p.evaluate(() => { const s = __game.scene.getScene('island'); return { afloat: !!s.row?.on, walkable: s.free(s.player.x, s.player.y) }; });
  check(!out.afloat && out.walkable, 'rowing into the shore climbs out onto land', `after the shore ${JSON.stringify(out)}`);

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
  const life = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    // someone standing in view, facing us
    const who = s.islanders.find((n) => !n.animal && !n.script && n.skin);
    const v0 = s.cameras.main.worldView;
    who.target = null;
    who.wait = 99999;
    who.s.setPosition(v0.x + v0.width / 2, v0.y + v0.height / 2).setTexture(`${who.prefix}_down`);
    let blinks = 0;
    for (let i = 0; i < 600; i++) {
      who.s.setTexture(`${who.prefix}_down`);
      s.tells.update(0.05, s.islanders, s.cameras.main.worldView);
      blinks = Math.max(blinks, s.tells.blinks.length);
    }
    const breathing = s.islanders.some((n) => !n.animal && n.baseScale !== undefined && n.s.scaleY !== n.baseScale);
    return { blinks, breathing, smoke: s.wind.spots.length };
  });
  check(life.blinks > 0 && life.breathing, 'people blink and breathe', `blink/breath ${JSON.stringify(life)}`);

  console.log('Targeting, dialogue and details');
  await open('?season=summer&weather=clear&holiday=none');
  await island({ map: 'main' });
  const t2 = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const n = s.islanders.find((o) => !o.animal && !o.script);
    s.islanders.forEach((o) => o !== n && o.s.setPosition(-999, -999));
    s.boats.length = 0;
    s.landingSpot = null;
    n.target = null;
    n.wait = 99999;
    n.lookT = 1e9; // (no idle glances: we are watching where they face)
    const kind = () => Object.keys(s.findFocus() || {}).find((k) => k !== 'icon') || 'none';
    const out = {};
    // someone right beside you (not in front) is not who you mean
    s.player.setPosition(n.s.x - 22, n.s.y);
    s.facing = 'up';
    s.player.setTexture('player_up');
    out.beside = kind();
    s.facing = 'right';
    s.player.setTexture('player_side').setFlipX(false);
    out.faced = kind();
    // facing nothing: Interact does nothing (no panel, no talk)
    s.player.setPosition(n.s.x - 200, n.s.y - 200);
    s.facing = 'up';
    out.nothing = kind();
    const chatHidden = () => !document.querySelector('#chat') || document.querySelector('#chat').classList.contains('hidden'); // (it is made the first time anyone talks)
    s.focus = s.findFocus();
    s.interact();
    out.noop = chatHidden() && !s.paused;
    // a talk: the person turns to you, then back
    s.player.setPosition(n.s.x, n.s.y + 22);
    s.facing = 'up';
    s.player.setTexture('player_up');
    const was = n.s.texture.key + '|' + n.s.flipX;
    n.s.setTexture(`${n.prefix}_side`).setFlipX(true);
    const prior = n.s.texture.key + '|' + n.s.flipX;
    s.talkTo(n);
    out.turned = n.s.texture.key === `${n.prefix}_down` || n.s.texture.key.endsWith('_down');
    // (a talk doesn't pause the game: a drag in progress goes on, and walking off ends the talk)
    s.dragging = true;
    s.dragVec = { x: 1, y: 0 };
    s.update(0, 16);
    out.dragKept = s.dragging;
    s.dragging = false;
    s.dragVec = null;
    s.stick.classList.remove('active');
    s.endTalk();
    out.prior = prior;
    return out;
  });
  check(t2.beside === 'none', 'someone beside you is not in front of you', `a sideways person was picked: ${t2.beside}`);
  check(t2.faced === 'npc', 'turn toward them and they are', `facing them gave ${t2.faced}`);
  check(t2.nothing === 'none' && t2.noop, 'facing nothing, Interact does nothing', `nothing: ${JSON.stringify(t2)}`);
  check(t2.turned, 'the person turns to face you when you talk', 'they did not turn');
  check(t2.dragKept, 'a talk does not take the stick from you (the game keeps running)', 'the drag was let go when the talk opened');
  let back = false;
  for (let i = 0; i < 20 && !back; i++) {
    await wait(300);
    back = await p.evaluate(() => { const s = __game.scene.getScene('island'); const n = s.islanders.find((o) => !o.animal && !o.script); return n.s.texture.key.endsWith('_side') && n.s.flipX; });
  }
  check(back, 'afterwards they turn back to what they were looking at', 'they stayed facing you');
  // a speech bubble goes the moment you walk off
  const gone = await p.evaluate(async () => {
    const s = __game.scene.getScene('island');
    const t = { x: s.player.x + 10, y: s.player.y, name: 'sign', text: 'A sign.' };
    s.things.push(t);
    s.focus = { thing: t, icon: 'look' };
    s.interact();
    const shown = !document.querySelector('#talk').classList.contains('hidden');
    s.player.setPosition(s.player.x + 120, s.player.y);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return { shown, hidden: document.querySelector('#talk').classList.contains('hidden') };
  });
  check(gone.shown && gone.hidden, 'a bubble is gone the moment you walk away', `bubble ${JSON.stringify(gone)}`);
  const em = await p.evaluate(() => ['heart', 'star', 'clover', 'note', 'bang', 'q', 'dots', 'sweat'].filter((k) => !__game.textures.exists(`emote_${k}`)));
  check(em.length === 0, 'the emote set is all there (heart, star, shamrock, note, !, ?, ..., sweat)', `missing emotes: ${em.join(', ')}`);

  console.log('Weather details');
  await open('?season=winter&weather=snow&holiday=none');
  await island({ map: 'main' });
  const snowy = await p.evaluate(() => { const s = __game.scene.getScene('island'); return { fast: s.prints.snowing }; });
  check(snowy.fast, 'footprints fill in faster while it snows', 'prints do not know it is snowing');
  await open('?season=autumn&weather=rain&holiday=none');
  await island({ map: 'main' });
  const wet = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    if (!s.puddles?.length) return { ok: true, none: true };
    const q = s.puddles[0];
    s.player.setPosition(q.x, q.y + 2);
    const n0 = s.children.length;
    s.onStep(s.player, 1, 0, 1);
    return { ok: s.children.length > n0 + 3 };
  });
  check(wet.ok, 'stepping in a puddle sends up ripples and drops', 'a puddle step did nothing');
  await open('?season=autumn&weather=leaves&holiday=none');
  await island({ map: 'main' });
  const gust = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    s.wind.gustIn = 0;
    for (let i = 0; i < 20; i++) s.wind.update(0.05, s.cameras.main.worldView);
    return { leaves: s.wind.leaves.length };
  });
  check(gust.leaves >= 5, 'a gust blows leaves along the ground in autumn', `no gust leaves (${gust.leaves})`);

  check(errs.length === 0, 'no page errors', `page errors: ${errs.slice(0, 2).join(' | ')}`);
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
