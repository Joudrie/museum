// The people classes in the shipped game (docs/PEOPLE-SPRITES.md, "In the game"): the islands' plain
// person pieces dress for a job and still talk like visitors (a real conversation), the museum's staff
// wear their job (the janitor mops), and the named friends dress for their role. Every job named in
// src/people/placement.js and npcs.json exists.
// Usage: npm run build && npx vite preview --port 4173 --base / &  then  node tests/people-in-game.cjs
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

(async () => {
  const people = await src('people/index.js');
  const ids = new Set(people.PEOPLE_LIST.map((p) => p.id));
  const named = fs.readFileSync(path.join(__dirname, '..', 'src', 'people', 'placement.js'), 'utf8').match(/'[a-z]+\.[a-z]+'/g).map((s) => s.slice(1, -1));
  const npcs = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'progression', 'data', 'npcs.json'), 'utf8'));
  const missing = [...named, ...npcs.map((n) => n.wears).filter(Boolean)].filter((id) => !ids.has(id));
  check(!missing.length, `every job in placement.js and npcs.json is a real class variant (${named.length + npcs.filter((n) => n.wears).length})`, `missing: ${missing.join(', ')}`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(2500);
  // the museum's staff
  const staff = await page.evaluate(() => {
    const s = __game.scene.getScene('room');
    const j = s.makeStaff('janitor', 801, s.g.xL + 80, s.g.y0 + 128);
    j.fixed = true;
    const g = s.makeStaff('guard', 951, s.g.xL + 160, s.g.y0 + 128);
    g.fixed = true;
    return { janitor: j.pose, guard: !!g.pose, guardTex: s.textures.exists(`${g.prefix}_down`) };
  });
  await page.waitForTimeout(1200);
  const frames = new Set();
  for (let k = 0; k < 12; k++) {
    frames.add(await page.evaluate(() => __game.scene.getScene('room').npcs.find((n) => n.kind === 'janitor' && n.pose)?.s.texture.key.replace(/^staff\d+/, '')));
    await page.waitForTimeout(150);
  }
  check(staff.janitor === 'mop' && frames.has('_pose_0') && frames.has('_pose_1'), 'the janitor mops in the museum, flipping between both mop frames', `janitor: ${JSON.stringify(staff)} frames ${[...frames].join(',')}`);
  check(!staff.guard && staff.guardTex, 'the guard wears the guard uniform and stands ready', `guard: ${JSON.stringify(staff)}`);
  await page.screenshot({ path: `${OUT}/people-in-game-room.png` });
  // Main Island
  await page.evaluate(() => __game.scene.getScene('room').scene.start('island', { map: 'main' }));
  await page.waitForTimeout(4000);
  const isle = await page.evaluate(() => {
    const s = __game.scene.getScene('island');
    const plain = s.islanders.filter((i) => !i.npcId && !i.animal && !i.title && i.wears !== undefined);
    return { plain: plain.length, talk: plain.filter((i) => !i.lines).length, jobs: [...new Set(plain.map((i) => i.wears))].length, wen: (({ kind, name } = {}) => kind && { kind, name })(s.islanders.find((i) => i.npcId === 'wen')) };
  });
  check(isle.plain >= 40 && isle.talk === isle.plain, `Main Island's ${isle.plain} plain people are dressed for ${isle.jobs} different jobs and still have real conversations`, `Main Island people: ${JSON.stringify(isle)}`);
  check(isle.wen && isle.wen.kind === 'elder' && isle.wen.name === 'Wen', 'Wen the pond keeper is dressed for the job and keeps her name and way of talking', `Wen: ${JSON.stringify(isle.wen)}`);
  await page.screenshot({ path: `${OUT}/people-in-game-island.png` });
  // an expedition island has its own people
  await page.evaluate(() => __game.scene.getScene('island').scene.start('island', { map: 'exp-pirate', spawn: 'dock' }));
  await page.waitForTimeout(3500);
  const pirates = await page.evaluate(() => __game.scene.getScene('island').islanders.filter((i) => i.wears).map((i) => i.wears));
  check(pirates.length && pirates.every((t) => /^(piratecrew|smuggler|treasurehunter)\./.test(t)), `Skull Isle's people dress as pirates and treasure hunters (${pirates.join(', ')})`, `Skull Isle people: ${pirates.join(', ')}`);
  check(!errors.length, 'no page errors', `page errors: ${errors.slice(0, 3).join(' | ')}`);
  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
