// People sprites (docs/PEOPLE-SPRITES.md): every class and variant draws cleanly, people stand
// and work on an island, talk with their job title, and are placeable from the builder's People lists.
// Usage: npm run build && npx vite preview --port 4173 --base / &  then  node tests/people-sprites.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'test-shots';
fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const check = (c, good, bad) => (c ? console.log('  ✓ ' + good) : (problems.push(bad), console.log('  ✗ ' + bad)));
const src = (f) => import(pathToFileURL(path.join(__dirname, '..', 'src', f)).href);
const seeded = (n) => (k) => {
  const v = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

(async () => {
  // ---------- 1. drawing, in Node ----------
  const art = await src('art.js');
  const people = await src('people/index.js');
  const parts = await src('people/parts.js');
  const known = new Set([...Object.keys(art.personPalette({})), '.']);
  const rowsOk = (rows, what) => {
    const err = [];
    if (!Array.isArray(rows) || rows.length < 20) err.push(`${what}: ${rows?.length} rows`);
    else {
      if (rows.length > 44) err.push(`${what}: ${rows.length} rows is too tall`);
      rows.forEach((r, i) => {
        if (r.length > 32) err.push(`${what}: row ${i} is ${r.length} wide`);
        const odd = [...r].filter((c) => !known.has(c));
        if (odd.length) err.push(`${what}: row ${i} has unknown colours ${[...new Set(odd)].join('')}`);
      });
    }
    return err;
  };
  const bad = [];
  let drawn = 0;
  people.PEOPLE_LIST.forEach((p) =>
    [1, 2, 3].forEach((n) => {
      const one = people.personFor(p.id, seeded(n * 31 + p.id.length));
      ['down', 'up', 'side'].forEach((v) => [0, 1, 2].forEach((f) => bad.push(...rowsOk(art.personRows(v, one.look, f), `${p.id} ${v}${f}`))));
      if (one.pose) {
        const fr = art.poseRows(one.look);
        if (!fr || fr.length !== 2) bad.push(`${p.id}: pose ${one.pose} has no frames`);
        else {
          fr.forEach((rows, i) => bad.push(...rowsOk(rows, `${p.id} pose${i}`)));
          if (fr[0].join('\n') === fr[1].join('\n') && !['survey'].includes(one.pose)) bad.push(`${p.id}: pose ${one.pose} frames are the same`);
        }
      }
      if (one.look.carry && art.personRows('down', one.look).join() === art.personRows('down', { ...one.look, carry: null }).join() && art.personRows('side', one.look).join() === art.personRows('side', { ...one.look, carry: null }).join())
        bad.push(`${p.id}: carries ${one.look.carry} but nothing shows`);
      drawn++;
    }),
  );
  check(!bad.length, `${drawn} people (${people.PEOPLE_LIST.length} variants x 3) draw in every view and frame`, `drawing problems: ${bad.slice(0, 8).join('; ')}`);
  const classes = Object.keys(people.CLASSES).length;
  check(classes >= 54 && people.PEOPLE_LIST.length >= 130, `${classes} classes, ${people.PEOPLE_LIST.length} variants`, `only ${classes} classes / ${people.PEOPLE_LIST.length} variants`);
  // every part offered in a menu draws something different from no part at all
  const plain = (v) => art.personRows(v, { outfit: 'tee' }).join('\n');
  const partBad = [];
  const tryPart = (key, ids, extra = {}) =>
    ids.forEach((id) => {
      const look = { outfit: 'tee', ...extra, [key]: id };
      const views = ['down', 'side', 'up'].map((v) => art.personRows(v, look));
      views.forEach((rows, i) => partBad.push(...rowsOk(rows, `${key}=${id} ${i}`)));
      if (views.every((rows, i) => rows.join('\n') === plain(['down', 'side', 'up'][i]))) partBad.push(`${key}=${id} changes nothing`);
    });
  tryPart('hat', Object.keys(parts.MORE_HATS));
  tryPart('hair', Object.keys(parts.MORE_HAIR));
  tryPart('facial', Object.keys(parts.MORE_FACIAL));
  tryPart('glasses', Object.keys(parts.MORE_GLASSES));
  tryPart('outfit', Object.keys(parts.MORE_OUTFITS));
  tryPart('acc', Object.keys(parts.MORE_ACCESSORIES));
  tryPart('legs', Object.keys(parts.LEGS).filter((k) => k !== 'trousers'));
  tryPart('build', Object.keys(parts.BUILDS).filter((k) => k !== 'standard'));
  tryPart('carry', Object.keys(parts.CARRY));
  tryPart('ground', Object.keys(parts.GROUND));
  const poseBad = Object.keys(parts.POSES).filter((pose) => !art.poseRows({ outfit: 'tee', pose })?.length);
  check(!partBad.length && !poseBad.length, 'every new hat, hairstyle, face, outfit, accessory, build, prop and pose draws', `parts problems: ${[...partBad, ...poseBad.map((p) => `pose ${p}`)].slice(0, 8).join('; ')}`);

  // ---------- 2. on an island ----------
  const W = 44;
  const H = 8 + Math.ceil(people.PEOPLE_LIST.length / 12) * 4; // tall enough for everyone
  const corners = Array.from({ length: H + 1 }, (_, y) => Array.from({ length: W + 1 }, (_, x) => (y < 3 || x < 2 || x > W - 2 || y > H - 2 ? '0' : y < 4 || x < 3 || x > W - 3 || y > H - 3 ? '1' : '2')).join(''));
  const objects = people.PEOPLE_LIST.map((p, i) => (p.id === 'swimmer.swim' ? { ref: `t:${p.tile}`, x: 10 * 32, y: 0 } : { ref: `t:${p.tile}`, x: (3 + (i % 12) * 3) * 32, y: (4 + Math.floor(i / 12) * 4) * 32 }));
  const map = { format: 'curation-map', version: 2, tile: 32, name: 'People test island', kind: 'island', w: W, h: H, corners, tiles: {}, objects };

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(1500);
  await page.evaluate((m) => __game.scene.getScene('room').scene.start('island', { mapData: m }), map);
  await page.waitForTimeout(3000);
  const scene = (fn, arg) => page.evaluate(`(() => { const s = __game.scene.getScene('island'); const a = ${JSON.stringify(arg ?? null)}; return (${fn.toString()})(s, a); })()`);
  const info = await scene((s) => ({
    n: s.islanders.length,
    posed: s.islanders.filter((i) => i.pose).length,
    textures: s.islanders.every((i) => s.textures.exists(`${i.prefix}_down`) && s.textures.exists(`${i.prefix}_side_1`) && (!i.pose || (s.textures.exists(`${i.prefix}_pose_0`) && s.textures.exists(`${i.prefix}_pose_1`)))),
    titles: [...new Set(s.islanders.map((i) => i.title))].length,
  }));
  check(info.n === people.PEOPLE_LIST.length && info.textures, `all ${info.n} people stand on the island with their frames (${info.posed} at work, ${info.titles} jobs)`, `island people wrong: ${JSON.stringify(info)}`);

  // someone at work loops their two frames; walk up beside the first janitor
  const near = (i) => scene((s, a) => {
    const n = s.islanders[a];
    s.player.setPosition(n.s.x + 34, n.s.y);
  }, i);
  await near(0);
  const seen = new Set();
  for (let t = 0; t < 24; t++) {
    seen.add(await scene((s) => s.islanders[0].s.texture.key));
    await page.waitForTimeout(100);
  }
  check([...seen].some((k) => k.endsWith('_pose_0')) && [...seen].some((k) => k.endsWith('_pose_1')), 'a janitor at work flips between their two mopping frames', `pose frames seen: ${[...seen].join(', ')}`);
  await page.screenshot({ path: `${OUT}/people-island.png` });

  // people who don't have a job to do in one spot wander a little
  const walkers = await scene((s) => s.islanders.map((n, i) => (n.range > 0 && !n.pose ? i : -1)).filter((i) => i >= 0));
  let moved = false;
  for (const w of walkers.slice(0, 6)) {
    const start = await scene((s, a) => { const n = s.islanders[a]; s.player.setPosition(n.s.x + 60, n.s.y + 40); n.wait = 0; return { x: n.s.x, y: n.s.y }; }, w);
    for (let t = 0; t < 30 && !moved; t++) {
      await page.waitForTimeout(200);
      const now = await scene((s, a) => ({ x: s.islanders[a].s.x, y: s.islanders[a].s.y }), w);
      moved = Math.hypot(now.x - start.x, now.y - start.y) > 4;
    }
    if (moved) break;
  }
  check(moved, 'someone carrying their things takes a walk', 'no walker moved');

  // talking: their name, their job and one of their lines
  const salt = people.PEOPLE_LIST.findIndex((p) => p.id === 'fisherman.oldsalt');
  await scene((s, a) => {
    const n = s.islanders[a];
    s.player.setPosition(n.s.x + 20, n.s.y);
    s.talkTo(n);
  }, salt);
  await page.waitForTimeout(300);
  const talk = await page.evaluate(() => ({ who: document.querySelector('#talk .talk-who')?.textContent, line: document.querySelector('#talk .talk-text')?.textContent, shown: !document.querySelector('#talk').classList.contains('hidden') }));
  const lines = people.CLASSES.fisherman.lines;
  check(talk.shown && /Fisherman/.test(talk.who) && lines.includes(talk.line), `tapping a fisherman: "${talk.who}" says "${talk.line}"`, `talk wrong: ${JSON.stringify(talk)}`);
  await page.screenshot({ path: `${OUT}/people-talk.png` });

  // ---------- 3. in the builder ----------
  const b = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  b.on('pageerror', (e) => errors.push('builder: ' + e.message));
  const t0 = Date.now();
  await b.goto(URL + 'builder.html');
  await b.waitForSelector('#palette details', { timeout: 15000 });
  const boot = Date.now() - t0;
  if (await b.locator('#resume-go').waitFor({ state: 'visible', timeout: 4000 }).then(() => true, () => false)) await b.click('#resume-go');
  const lists = await b.evaluate(() => [...document.querySelectorAll('#palette details summary')].map((s) => s.textContent));
  const wanted = Object.values(people.GROUPS).map((g) => `People: ${g}`);
  check(wanted.every((w) => lists.some((l) => l.startsWith(w))), `the builder has the People lists (${wanted.join(', ')}), opened in ${boot} ms`, `People lists missing: ${lists.join(' | ')}`);
  const listed = await b.evaluate((w) => {
    const d = [...document.querySelectorAll('#palette details')].find((x) => x.querySelector('summary').textContent.startsWith(w));
    d.open = true;
    d.dispatchEvent(new Event('toggle'));
    return new Promise((res) => setTimeout(() => {
      const pics = [...d.querySelectorAll('.piece canvas')];
      const filled = pics.filter((c) => {
        const px = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        for (let i = 3; i < px.length; i += 4) if (px[i] > 200) return true;
        return false;
      }).length;
      res({ n: d.querySelectorAll('.piece').length, filled });
    }, 300));
  }, 'People: Sea & shore');
  const sea = people.PEOPLE_LIST.filter((p) => p.cls.group === 'D').length;
  check(listed.n === sea && listed.filled === sea, `Sea & shore lists ${listed.n} people, each with a picture`, `sea list wrong: ${JSON.stringify(listed)} (want ${sea})`);
  await b.fill('#search', 'fisherman');
  const hits = await b.locator('#results .piece').count();
  check(hits >= 10, `searching "fisherman" finds ${hits} pieces`, `search found ${hits}`);
  await b.screenshot({ path: `${OUT}/people-builder.png` });

  check(!errors.length, 'no page errors', 'page errors: ' + errors.slice(0, 5).join(' | '));
  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => {
  console.error('✗ crashed: ' + (e.stack || e));
  process.exit(1);
});
