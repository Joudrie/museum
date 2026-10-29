// QA: play through every kind of interaction, in the museum and on the islands, and after each
// one check what players would notice: the target was the one faced, a bubble sits on its
// speaker's head, the bubble goes when it should, and input is never left stuck (the player can
// walk again, nothing is left paused or half-open).
// Usage: PW=/path/to/playwright node tests/qa-interactions.cjs      (preview server on :4173)
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
    await p.evaluate((d) => { __game.scene.getScenes(true)[0].scene.start('island', d); }, data);
    await p.waitForFunction(() => __game.scene.isActive('island') && __game.scene.getScene('island').player, null, { timeout: 20000 });
    await wait(1500);
  };

  // where a speech bubble's tail points and where the speaker's head really is
  const bubbleVsHead = (sceneKey) =>
    p.evaluate((key) => {
      const s = __game.scene.getScene(key);
      const talk = document.querySelector('#talk');
      if (talk.classList.contains('hidden')) return { shown: false };
      const d = document.querySelector('.talk-body').getAttribute('d');
      const pts = [...d.matchAll(/[ML]([-\d.]+),([-\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
      const box = document.querySelector('.talk-box').getBoundingClientRect();
      // the tail's tip is the point farthest from the box's middle
      const mx = (box.left + box.right) / 2;
      const my = (box.top + box.bottom) / 2;
      const tip = pts.reduce((a, q) => (Math.hypot(q[0] - mx, q[1] - my) > Math.hypot(a[0] - mx, a[1] - my) ? q : a));
      return { shown: true, tip, box: [box.left, box.top, box.right, box.bottom], vw: innerWidth, vh: innerHeight, who: document.querySelector('.talk-who').textContent };
    }, sceneKey);
  const stuck = (key) =>
    p.evaluate((k) => {
      const s = __game.scene.getScene(k);
      return { paused: !!s.paused, input: s.input.enabled, dragging: !!s.dragging, panel: ['#chat', '#ask', '#catch', '#hub', '#journal', '#viewer'].filter((q) => document.querySelector(q) && !document.querySelector(q).classList.contains('hidden')) };
    }, key);
  const walkable = async (key) => {
    const r = await p.evaluate((k) => {
      const s = __game.scene.getScene(k);
      const x0 = s.player.x;
      const y0 = s.player.y;
      s.dragging = true;
      s.dragMag = 1;
      let moved = 0;
      for (const v of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        s.dragVec = { x: v[0], y: v[1] };
        for (let i = 0; i < 12; i++) s.update(0, 16);
        moved = Math.max(moved, Math.hypot(s.player.x - x0, s.player.y - y0));
      }
      s.dragging = false;
      s.dragVec = null;
      return moved;
    }, key);
    return r > 1;
  };

  console.log('The museum: every visitor, staff and the caretaker');
  await open();
  await wait(1500);
  await p.evaluate(() => { const t = document.querySelector('#talk'); t.click(); t.click(); }); // (Edmund's welcome: tap it away like a player would)
  const kinds = await p.evaluate(() => __game.scene.getScene('room').npcs.map((n, i) => ({ i, kind: n.kind, staff: !!n.staff, famous: !!n.famous })));
  for (const k of kinds) {
    // stand in front of them, facing, and press the button
    const set = await p.evaluate((i) => {
      const s = __game.scene.getScene('room');
      const n = s.npcs[i];
      if (!n || n.follow) return null;
      s.endTalk();
      s.input.enabled = true;
      n.target = null;
      n.goal = null;
      n.wait = 99999;
      s.player.setPosition(n.s.x, n.s.y + 20);
      s.faceSprite(s.player, 'player', 0, -1);
      s.focus = s.findFocus();
      return { focus: s.focus ? Object.keys(s.focus)[0] : 'none', label: s.focusLabel(s.focus) };
    }, k.i);
    if (!set) continue;
    if (set.focus !== 'npc') {
      // something else in front of them (a painting slot, a counter): fine, not a bug in itself
      continue;
    }
    await p.evaluate(() => __game.scene.getScene('room').interact());
    await wait(700);
    // some talks are a Yes / No box (the guard's cameras, a story chapter): answer it the way a player would
    const askOpen = await p.evaluate(() => !document.querySelector('#ask').classList.contains('hidden'));
    if (askOpen) {
      await p.evaluate(() => { const no = document.querySelector('#ask .ask-no'); (no && !no.hidden ? no : document.querySelector('#ask .ask-yes')).click(); });
      await wait(200);
    }
    const chat = await p.evaluate(() => !document.querySelector('#chat').classList.contains('hidden'));
    const bub = await bubbleVsHead('room');
    if (chat) {
      await p.evaluate(() => __game.scene.getScene('room').endTalk());
    } else if (bub.shown) {
      const n = await p.evaluate((i) => { const s = __game.scene.getScene('room'); const n = s.npcs[i]; const at = s.speakerAt(n.s)(); return at; }, k.i);
      check(Math.abs(bub.tip[0] - n.x) < 3 && Math.abs(bub.tip[1] - n.y) < 14, `${k.kind}: the bubble's tail points at their head`, `${k.kind}: bubble tail ${bub.tip} vs head ${n.x},${n.y}`);
      check(bub.box[0] >= 0 && bub.box[2] <= bub.vw, `${k.kind}: the bubble stays on screen`, `${k.kind}: bubble off screen ${bub.box}`);
      await p.evaluate(() => __game.scene.getScene('room').endTalk());
    }
    await wait(150);
    const st = await stuck('room');
    check(!st.paused && st.input && st.panel.length === 0, `${k.kind}: input is back after the talk`, `${k.kind}: stuck after talking ${JSON.stringify(st)}`);
    check(!(await p.evaluate(() => !document.querySelector('#talk').classList.contains('hidden'))), `${k.kind}: no bubble left behind`, `${k.kind}: a bubble is still up`);
  }
  check(await walkable('room'), 'you can still walk after all of that', 'the player is stuck in the museum');

  console.log('The museum: a painting, a stain, the way on');
  const room = await p.evaluate(() => {
    const s = __game.scene.getScene('room');
    s.endTalk();
    s.input.enabled = true;
    const out = {};
    // a painting (face the wall in front of it)
    const hung = s.hung[0];
    if (hung) {
      const st = s.standFor(hung);
      s.player.setPosition(st.x, st.y);
      s.faceSprite(s.player, 'player', st.fx, st.fy);
      s.focus = s.findFocus();
      out.painting = s.focus && Object.keys(s.focus)[0];
      out.label = s.focusLabel(s.focus);
    }
    return out;
  });
  if (room.painting) {
    check(room.painting === 'painting' && room.label === 'Look', 'facing a painting: Look', `painting focus ${JSON.stringify(room)}`);
    await p.click('#interact');
    await wait(900);
    const viewer = await p.evaluate(() => !document.querySelector('#viewer').classList.contains('hidden'));
    check(viewer, 'the painting opens in the viewer', 'the viewer did not open');
    await p.click('.viewer-close');
    await wait(500);
    const st = await stuck('room');
    check(st.input && st.panel.length === 0, 'closing the viewer gives you the room back', `after the viewer ${JSON.stringify(st)}`);
  }
  const mess = await p.evaluate(() => {
    const s = __game.scene.getScene('room');
    const m = s.mess.find((q) => !q.dirt);
    if (!m) return null;
    s.player.setPosition(m.ax, m.ay + 4);
    s.focus = s.findFocus();
    return { kind: m.kind, focus: s.focus && Object.keys(s.focus)[0], label: s.focusLabel(s.focus) };
  });
  if (mess) {
    check(mess.focus === 'mess', `standing on a ${mess.kind}: ${mess.label} (no facing needed)`, `mess not focusable ${JSON.stringify(mess)}`);
    await p.click('#interact');
    await wait(900);
    const st = await stuck('room');
    check(st.input && !st.paused, 'cleaning leaves you free to walk', `after cleaning ${JSON.stringify(st)}`);
  }

  console.log('The island: signs, people, animals, doors');
  await open('?season=summer&weather=clear&holiday=none');
  await island();
  const isl = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const out = {};
    s.islanders.forEach((o) => !o.vignette && o.target === null && (o.wait = 99999));
    const human = s.islanders.find((o) => !o.animal && !o.script);
    const animal = s.islanders.find((o) => o.animal && !o.script);
    out.human = human && { x: human.s.x, y: human.s.y };
    out.animal = animal && { x: animal.s.x, y: animal.s.y };
    return out;
  });
  const stand = (x, y, facing = 'up') =>
    p.evaluate(([px, py, f]) => {
      const s = __game.scene.getScene('island');
      s.paused = false;
      s.player.setPosition(px, py);
      s.facing = f;
      s.player.setTexture(f === 'up' ? 'player_up' : f === 'down' ? 'player_down' : 'player_side').setFlipX(f === 'left');
      s.update(0, 16);
      return { label: document.querySelector('#interact .label').textContent, shown: !document.querySelector('#interact').classList.contains('hidden') };
    }, [x, y, facing]);
  if (isl.human) {
    const f = await stand(isl.human.x, isl.human.y + 22);
    check(f.label === 'Talk' && f.shown, 'a person in front: Talk', `person focus ${JSON.stringify(f)}`);
    await p.click('#interact');
    await wait(900);
    const chat = await p.evaluate(() => ({ open: !document.querySelector('#chat').classList.contains('hidden'), hidden: document.querySelector('#interact').classList.contains('hidden') }));
    check(chat.open && chat.hidden, 'the conversation opens and the button gets out of the way', `island chat ${JSON.stringify(chat)}`);
    // finish by choosing Bye if the hub is up, else just close
    await p.evaluate(() => __game.scene.getScene('island').endTalk());
    await wait(200);
    const st = await stuck('island');
    check(!st.paused && st.panel.length === 0, 'after the talk the island is yours again', `island stuck ${JSON.stringify(st)}`);
    check(await walkable('island'), 'and you can walk', 'stuck after an island talk');
  }
  if (isl.animal) {
    const f = await stand(isl.animal.x, isl.animal.y + 20);
    if (f.label === 'Pet') {
      await p.click('#interact');
      await wait(500);
      const st = await stuck('island');
      check(!st.paused, 'petting an animal needs no panel and leaves you free', `after petting ${JSON.stringify(st)}`);
    } else ok('(the animal was not in reach to pet)');
  }
  // a sign
  const sign = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const t = { x: s.player.x + 200, y: s.player.y + 200, name: 'sign', text: 'Welcome to the island. Mind the tall grass.' };
    s.things.push(t);
    return { x: t.x, y: t.y };
  });
  const fs = await stand(sign.x, sign.y + 14);
  check(fs.label === 'Read', 'facing a sign: Read', `sign label ${fs.label}`);
  await p.click('#interact');
  await wait(500);
  const sb = await bubbleVsHead('island');
  check(sb.shown, 'the sign shows its text in a bubble over it', 'no sign bubble');
  await p.evaluate(() => { const s = __game.scene.getScene('island'); s.player.setPosition(s.player.x + 150, s.player.y); });
  await wait(250);
  check(!(await p.evaluate(() => !document.querySelector('#talk').classList.contains('hidden'))), 'walking away closes it', 'the sign bubble stayed after walking off');
  // the museum doors
  const door = await p.evaluate(() => { const s = __game.scene.getScene('island'); return { x: s.door.x, y: s.door.y }; });
  const fd = await stand(door.x, door.y + 18);
  check(fd.label === 'Enter', 'facing the museum doors: Enter', `door label ${fd.label}`);
  const turned = await stand(door.x, door.y + 18, 'down');
  check(turned.label !== 'Enter', 'turn your back on them and it is not offered', `still ${turned.label} with the doors behind`);

  console.log('The island: the boat, both ways, and fishing');
  await island({ map: 'main', spawn: 'dock' });
  await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    s.dragging = true;
    s.dragVec = { x: 0, y: 1 };
    s.dragMag = 1;
    for (let i = 0; i < 170; i++) s.update(0, 16);
    s.dragging = false;
    s.dragVec = null;
    s.update(0, 16);
  });
  check(await p.evaluate(() => __game.scene.getScene('island').waterMode === 'boat'), 'at the shore the Boat button is offered', 'no Boat at the shore');
  await p.click('#interact2');
  await p.click('.ask-no');
  await wait(300);
  let st = await stuck('island');
  check(!st.paused && !(await p.evaluate(() => __game.scene.getScene('island').boat.active)), 'saying No leaves you on the shore and free', `after No ${JSON.stringify(st)}`);
  await p.click('#interact2');
  await p.click('.ask-yes');
  await wait(900);
  check(await p.evaluate(() => __game.scene.getScene('island').boat.active), 'saying Yes puts you in the boat', 'no boat after Yes');
  // fish from the boat
  await p.evaluate(() => { const s = __game.scene.getScene('island'); s.focus = s.findFocus(); });
  const fb = await p.evaluate(() => ({ label: document.querySelector('#interact .label').textContent }));
  check(fb.label === 'Fish', 'afloat, facing open water: Fish', `afloat label ${fb.label}`);
  await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    s.focus = s.findFocus();
    s.interact();
  });
  await wait(900);
  check(await p.evaluate(() => __game.scene.getScene('island').fishing.busy), 'a line goes out from the boat', 'no cast from the boat');
  await p.evaluate(() => __game.scene.getScene('island').fishing.end());
  await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    s.dragging = true;
    s.dragVec = { x: 0, y: -1 };
    s.dragMag = 1;
    for (let i = 0; i < 300; i++) s.update(0, 16);
    s.dragging = false;
    s.dragVec = null;
    s.update(0, 16);
  });
  await p.click('#interact2');
  await p.click('.ask-no');
  await wait(200);
  check(await p.evaluate(() => __game.scene.getScene('island').boat.active), 'No to "hop out" keeps you aboard', 'left the boat after saying No');
  await p.click('#interact2');
  await p.click('.ask-yes');
  await wait(900);
  st = await stuck('island');
  check(!st.paused && !(await p.evaluate(() => __game.scene.getScene('island').boat.active)) && (await walkable('island')), 'Yes puts you ashore and you can walk', `after hopping out ${JSON.stringify(st)}`);

  console.log('The island: the sailing boat menu');
  const sail = await p.evaluate(() => {
    const s = __game.scene.getScene('island');
    const b = s.boats[0];
    if (!b) return null;
    s.player.setPosition(b.x, b.y + 26);
    s.facing = 'up';
    s.player.setTexture('player_up');
    s.update(0, 16);
    return document.querySelector('#interact .label').textContent;
  });
  if (sail === 'Sail') {
    await p.click('#interact');
    await wait(500);
    const menu = await p.evaluate(() => !!document.querySelector('.sail-dest'));
    check(menu, 'the boat asks where to', 'no destination list');
    await p.keyboard.press('Escape');
    await p.evaluate(() => { const c = document.querySelector('.sail-close, .sail-cancel, #sail .ui-close, #sail button[aria-label="Close"]'); c?.click(); });
    await wait(400);
    st = await stuck('island');
    if (st.panel.length === 0 || st.paused) ok('(the destination list can be dismissed)');
  } else ok('(no sailing boat within reach of that spot)');

  check(errs.length === 0, 'no page errors', `page errors: ${errs.slice(0, 2).join(' | ')}`);
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
