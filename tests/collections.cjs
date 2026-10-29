// Collections test: the universal collection format.
//  1. Data checks (plain Node): every entry and set validates, ids are unique,
//     sets point at real entries, the validators catch bad data, old and corrupt
//     saves migrate.
//  2. Browser checks (390×844): an old save moves into the codex, a corrupt
//     codex still loads, every journal tab shows, Minerals appear with no
//     minerals code, the viewer opens, a set pays out once, a fish lands in the codex.
// Usage: npm run build && npx vite preview --port 4173 --base / &
//        PW=/path/to/playwright OUT=some/dir node tests/collections.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'collections-shots';
fs.mkdirSync(OUT, { recursive: true });

const problems = [];
const fail = (msg) => {
  problems.push(msg);
  console.log('  ✗ ' + msg);
};
const ok = (msg) => console.log('  ✓ ' + msg);
const check = (cond, good, bad) => (cond ? ok(good) : fail(bad));

async function dataChecks() {
  console.log('Data');
  const src = path.join(__dirname, '..', 'src', 'collections');
  const reg = await import(path.join(src, 'index.js'));
  const schema = await import(path.join(src, 'schema.js'));
  const codex = await import(path.join(src, 'codex.js'));

  check(reg.problems().length === 0, 'registry loaded with no problems', 'registry problems: ' + reg.problems().join(' | '));
  const all = reg.list({ all: true });
  const cols = reg.collections();
  check(cols.length >= 5, `${cols.length} collections, ${all.length} entries`, 'too few collections');

  const bad = all.flatMap((e) => schema.validateEntry(e, reg.collection(e.collection)));
  check(!bad.length, 'every entry validates', 'invalid entries: ' + bad.slice(0, 5).join(' | '));
  check(new Set(all.map((e) => e.id)).size === all.length, 'entry ids are unique', 'duplicate entry ids');
  cols.forEach((c) => check(!schema.validateCollection(c).length, `collection ${c.id} validates`, `collection ${c.id}: ` + schema.validateCollection(c).join(', ')));

  const sets = reg.sets();
  const badSets = sets.flatMap((s) => schema.validateSet(s, (id) => !!reg.get(id)));
  check(!badSets.length && sets.length >= 3, `${sets.length} sets, all point at real entries`, 'bad sets: ' + badSets.join(' | '));
  sets.forEach((s) => {
    const strays = s.entries.filter((id) => reg.get(id).collection !== s.collection || reg.get(id).set !== s.id);
    check(!strays.length, `set ${s.id}: entries agree with it`, `set ${s.id}: entries disagree: ${strays.join(', ')}`);
  });

  // The old painting ids (bare slugs) are what saves hold, so they must still resolve.
  const paintings = reg.list({ collection: 'painting' });
  check(paintings.length === 49 && reg.get('painting', 'starry-night') && reg.keyOf(reg.get('painting', 'starry-night')) === 'starry-night', '49 paintings keep their slug keys', 'painting ids changed');
  check(reg.list({ q: 'van gogh' }).length > 0 && reg.list({ collection: 'painting', era: 'impressionist' }).length > 0, 'search and era filter work', 'search or era filter broken');
  check(reg.list({ collection: 'mineral', rarity: 3 }).length === 2, 'rarity filter works', 'rarity filter broken');
  check(reg.list({ tag: 'pond' }).length === 8, 'tag filter works', 'tag filter broken');
  check(reg.list({ collection: 'find' }).every((e) => e.collectable !== false), 'junk is left out of lists', 'junk is listed');

  // The validators must actually catch bad data.
  const good = reg.get('mineral:quartz');
  const must = (label, patch, text) => {
    const found = schema.validateEntry({ ...good, ...patch }, reg.collection('mineral')).join(' ');
    check(found.includes(text), `validator catches ${label}`, `validator missed ${label}: ${found || '(nothing)'}`);
  };
  must('a bad id', { id: 'quartz' }, 'id must look like');
  must('a missing license', { source: { credit: 'x' } }, 'license');
  must('a missing credit', { source: { license: 'x' } }, 'credit');
  must('a bad rarity', { rarity: 9 }, 'rarity');
  must('a bad image', { image: { kind: 'nope' } }, 'image.kind');
  must('pixels with no palette', { image: { kind: 'pixels', rows: ['ab'] } }, 'palette');
  must('uneven rows', { image: { kind: 'pixels', rows: ['aa', 'a'], palette: { a: '#fff' } } }, 'same length');
  check(schema.validateEntry(null).length > 0 && schema.validateEntry('x').length > 0, 'validate never throws on junk', 'validate threw or passed junk');

  // Old saves move into the codex; broken ones don't crash it.
  const old = {
    'curation.fishing': { caught: { minnow: { n: 3, best: 7 }, coin: { n: 1 }, boot: { n: 2 }, ghostfish: { n: 1 } }, total: 3, night: 0, bobber: 'basic' },
    'curation.met': ['vangogh', 'monet', 42],
    'curation.slots': { 0: { 'left:1': { kind: 'painting', id: 'swing' }, 'right:1': { kind: 'plain' } }, 1: null },
  };
  const c = codex.migrate((k) => old[k] ?? null);
  check(c.seen['fish:minnow']?.n === 3 && c.seen['fish:minnow'].best === 7 && c.owned['fish:minnow'] === 3, 'migration keeps caught fish with counts and best size', 'fish not migrated: ' + JSON.stringify(c.seen['fish:minnow']));
  check(c.seen['find:coin'] && !c.seen['find:boot'] && !c.seen['fish:ghostfish'], 'migration keeps finds, drops junk and unknown ids', 'bad find migration');
  check(c.seen['visitor:vangogh'] && c.seen['visitor:monet'] && Object.keys(c.seen).filter((k) => k.startsWith('visitor:')).length === 2, 'migration keeps visitors you met', 'visitors not migrated');
  check(c.seen['painting:swing'], 'migration keeps paintings hung on purpose', 'paintings not migrated');
  const empty = codex.migrate(() => null);
  check(Object.keys(empty.seen).length === 0 && empty.v === 1, 'migrating nothing gives an empty codex', 'empty migration broke');
  ['junk', 7, null, [], { seen: 'x', owned: [], claimed: 3 }, { seen: { 'fish:minnow': { n: 'lots' }, 'no id': { n: 1 } }, owned: { 'fish:minnow': -4 } }].forEach((raw, i) => {
    let n;
    try {
      n = codex.normalize(raw);
    } catch (e) {
      return fail(`normalize threw on junk #${i}: ${e.message}`);
    }
    if (i === 5) check(n.seen['fish:minnow']?.n === 1 && !n.seen['no id'] && !n.owned['fish:minnow'], 'normalize repairs a half-broken codex', 'normalize did not repair: ' + JSON.stringify(n));
    else if (n.v !== 1 || Object.keys(n.seen).length) fail(`normalize junk #${i} gave ${JSON.stringify(n)}`);
  });
  ok('normalize survives junk');

  // The importer refuses rows with no license or credit, and writes data the registry accepts.
  const imp = await import(path.join(__dirname, '..', 'tools', 'import_collection.mjs'));
  const rows = imp.parseCsv('slug,title,blurb,license,credit,image_src\nmoth,Moth,"Wings, ""dusty"" ones",CC0,Someone,/m.png\nbeetle,Beetle,,,,/b.png\n');
  check(rows.length === 2 && rows[0].blurb === 'Wings, "dusty" ones', 'importer reads quoted CSV', 'csv parse wrong: ' + JSON.stringify(rows));
  const def = { collection: 'bug', name: 'Bugs', icon: '🐛', noun: 'bugs' };
  const bad2 = imp.buildPack(rows, { ...def, collection: 'bug' }).problems.join(' ');
  check(/license/.test(bad2) && /credit/.test(bad2), 'importer stops on a missing license and credit', 'importer let a row through: ' + bad2);
  const built = imp.buildPack(rows.slice(0, 1).map((r) => ({ ...r, image_kind: 'sprite' })), def);
  check(!built.problems.length && built.pack.entries[0].id === 'bug:moth', 'importer builds a valid pack from good rows', 'importer pack invalid: ' + built.problems.join(' | '));
  const before = reg.list().length;
  reg.register(built.pack);
  check(reg.list().length === before + 1 && reg.get('bug:moth'), 'a pack from the importer registers with no code changes', 'imported pack did not register');
}

(async () => {
  await dataChecks();

  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.stack || e.message));
  await p.route('https://upload.wikimedia.org/**', (r) =>
    r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#c9a24a"/></svg>' }),
  );
  const S = (fn, arg) => p.evaluate(fn, arg);
  const wait = (ms) => p.waitForTimeout(ms);
  const shown = (sel) => S((q) => { const e = document.querySelector(q); return !!e && !e.classList.contains('hidden'); }, sel);
  let n = 0;
  const shot = (name) => p.screenshot({ path: path.join(OUT, `${String(++n).padStart(2, '0')}-${name}.png`) });
  const boot = async (seed) => {
    await p.goto(URL);
    await wait(2000);
    await S((s) => {
      localStorage.clear();
      Object.entries(s || {}).forEach(([k, v]) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)));
    }, seed);
    await p.reload();
    await wait(2500);
  };
  const codexNow = () => S(() => JSON.parse(localStorage.getItem('curation.codex')));
  const openJournal = async (tab) => {
    await p.click('#journal-btn');
    await wait(500);
    if (tab) await p.click(`[data-jtab="${tab}"]`);
    await wait(500);
  };
  const closeJournal = async () => {
    await p.click('.journal-close');
    await wait(300);
  };
  const noSideScroll = (label) =>
    S(() => document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('#journal .sheet, #viewer')].every((e) => e.scrollWidth <= e.clientWidth + 1)).then((v) => check(v, `no horizontal scroll: ${label}`, `horizontal scroll: ${label}`));

  // ---------- An old save moves into the codex ----------
  console.log('Old save');
  await boot({
    'curation.fishing': { caught: { minnow: { n: 3, best: 7 }, coin: { n: 1 } }, total: 3, night: 0, bobber: 'basic' },
    'curation.met': ['vangogh'],
  });
  check(!(await p.$('#crash')), 'old save loads', 'crash on an old save: ' + (await p.textContent('#crash small').catch(() => '')));
  await openJournal('fish');
  const known = await S(() => [...document.querySelectorAll('.fish-cell:not(.unknown) b')].map((e) => e.textContent));
  check(known.includes('Minnow') && known.includes('Ancient coin'), `fish tab shows what you caught (${known.join(', ')})`, `fish tab lost progress: ${known}`);
  check((await S(() => document.querySelector('.fish-cell:not(.unknown) small').textContent)).includes('×3'), 'catch counts survive', 'catch count lost');
  const cx = await codexNow();
  check(cx && cx.v === 1 && cx.seen['fish:minnow'] && cx.seen['visitor:vangogh'] && cx.seen['painting:harvesters'], 'codex written (version 1) with fish, visitor and hung paintings', 'codex missing pieces: ' + JSON.stringify(cx && Object.keys(cx.seen)));
  const fk = await S(() => JSON.parse(localStorage.getItem('curation.fishing')));
  check(fk.caught?.minnow?.n === 3 && fk.bobber === 'basic', 'old fishing key is left in place', 'old fishing key damaged');
  await closeJournal();

  // ---------- A broken codex doesn't break the game ----------
  console.log('Corrupt codex');
  for (const bad of ['{{{', '"hello"', '{"v":1,"seen":"nope","owned":[1],"claimed":7}', '[1,2,3]']) {
    await boot({ 'curation.codex': bad });
    check(!(await p.$('#crash')), `codex ${bad.slice(0, 18)} loads`, 'crash on codex ' + bad);
    await openJournal('minerals');
    check((await S(() => document.querySelectorAll('.fish-cell').length)) === 8, 'journal still opens', 'journal broke on a corrupt codex');
    await closeJournal();
  }

  // ---------- Fresh save: every tab ----------
  console.log('Journal tabs');
  await boot({});
  await openJournal();
  const tabs = await S(() => [...document.querySelectorAll('.journal-tabs button')].map((b) => b.textContent));
  check(tabs.join() === 'Goals,Paintings,Visitors,Fish,Minerals,Fossils,Treasures,Nature,Makers', `tabs: ${tabs.join(', ')}`, `unexpected tabs: ${tabs.join(', ')}`);
  const tabFits = await S(() => [...document.querySelectorAll('.journal-tabs button')].every((b) => b.scrollWidth <= b.clientWidth + 1));
  check(tabFits, 'tab labels fit on one line', 'a tab label is clipped');
  await shot('journal-goals');
  await noSideScroll('goals');

  await p.click('[data-jtab="paintings"]');
  await wait(500);
  const cards = await S(() => document.querySelectorAll('.gallery-grid.book .slot-painting').length);
  check(cards === 49, '49 painting cards', `painting cards: ${cards}`);
  const head = await S(() => document.querySelector('.journal-body .toolkit-note').textContent);
  check(/of 49 paintings on display/.test(head), `intro: ${head}`, 'painting intro wrong: ' + head);
  const hungText = await S(() => document.querySelector('.slot-painting em').textContent);
  check(/On display|In storage/.test(hungText), 'cards say where each painting is', 'card location text: ' + hungText);
  await p.click('.gallery-grid.book .slot-painting');
  await wait(200);
  check(await S(() => document.querySelector('.slot-painting').classList.contains('open')), 'tapping a card opens its blurb', 'card does not open');
  await shot('journal-paintings');
  await noSideScroll('paintings');

  await p.click('[data-jtab="visitors"]');
  await wait(400);
  check((await S(() => document.querySelectorAll('.famous-card').length)) > 10, 'visitors tab still works', 'visitors tab broke');
  await shot('journal-visitors');

  await p.click('[data-jtab="fish"]');
  await wait(400);
  check((await S(() => document.querySelectorAll('.bobber').length)) === 5, 'fish tab keeps its bobbers', 'bobbers missing');
  check((await S(() => document.querySelectorAll('.fish-cell').length)) === 21, '18 fish and 3 finds in the log', 'fish log size wrong');
  check((await S(() => document.querySelectorAll('.fish-cell.unknown').length)) === 21, 'all are silhouettes on a fresh save', 'fresh save shows catches');
  check((await S(() => document.querySelectorAll('.set-row').length)) === 2, 'pond and sea sets show', 'fish sets missing');
  await shot('journal-fish');
  await noSideScroll('fish');

  await p.click('[data-jtab="minerals"]');
  await wait(400);
  check((await S(() => document.querySelectorAll('.fish-cell').length)) === 8, 'Minerals tab lists 8 minerals from data alone', 'minerals missing');
  await shot('journal-minerals-empty');
  await closeJournal();

  // ---------- Minerals: collect, view, claim ----------
  console.log('Minerals');
  await p.click('#settings-btn');
  await wait(500);
  await p.click('text=Collect one of everything');
  await wait(300);
  const msg = await S(() => [...document.querySelectorAll('#settings button')].find((b) => /^Added/.test(b.textContent))?.textContent);
  check(/Added 77/.test(msg || ''), `testing button: ${msg}`, `testing button said: ${msg}`); // 18 fish + 3 finds + 8 minerals + 8 fossils + 40 treasures
  await p.click('.settings-close');
  await wait(300);
  await openJournal('minerals');
  check((await S(() => document.querySelectorAll('.fish-cell:not(.unknown)').length)) === 8, 'all 8 minerals show once collected', 'minerals still hidden');
  check((await S(() => document.querySelector('.set-row.done .quest-claim') !== null)), 'finished set offers its reward', 'no claim button');
  await shot('journal-minerals');
  await noSideScroll('minerals');

  await p.click('.fish-cell:not(.unknown)');
  await wait(600);
  check(await shown('#viewer'), 'tapping a mineral opens the viewer', 'viewer did not open');
  const v = await S(() => ({
    over: getComputedStyle(document.querySelector('#viewer')).zIndex,
    title: document.querySelector('.info-title').textContent,
    meta: document.querySelector('.info-meta').textContent,
    canvas: !!document.querySelector('#viewer .frame.case canvas'),
    change: getComputedStyle(document.querySelector('.viewer-change')).display,
  }));
  check(v.canvas && v.title === 'Quartz', `viewer shows the pixel art in a case (${v.title}, ${v.meta})`, 'viewer content wrong: ' + JSON.stringify(v));
  check(Number(v.over) > 20 && v.change === 'none', 'viewer sits above the journal, without the wall-spot button', 'viewer layering/button wrong: ' + JSON.stringify(v));
  await shot('viewer-mineral');
  await noSideScroll('viewer');
  await p.click('.viewer-close');
  await wait(400);

  const before = await S(() => document.getElementById('hud')?.textContent);
  await p.click('.set-row.done .quest-claim');
  await wait(600);
  const cx2 = await codexNow();
  check(cx2.claimed['crystal-cabinet'] === true, 'claiming a set is saved', 'claim not saved');
  check(!(await S(() => document.querySelector('.set-row .quest-claim'))), 'reward cannot be claimed twice', 'claim button still there');
  void before;
  await closeJournal();

  // ---------- Painting viewer in the room still has its change button ----------
  console.log('Painting viewer');
  await S(() => { const s = __game.scene.getScene('room'); const q = s.hung[0]; if (q) s.view(q); });
  await wait(700);
  check(await shown('#viewer'), 'painting viewer opens in the room', 'room viewer did not open');
  const pv = await S(() => ({
    framed: !!document.querySelector('#viewer .frame:not(.case) img, #viewer .frame:not(.case) .img-fallback'),
    change: getComputedStyle(document.querySelector('.viewer-change')).display,
    meta: document.querySelector('.info-meta').textContent,
    z: getComputedStyle(document.querySelector('#viewer')).zIndex,
  }));
  check(pv.framed && pv.change !== 'none' && pv.z === '10', `painting viewer unchanged (${pv.meta})`, 'painting viewer changed: ' + JSON.stringify(pv));
  await shot('viewer-painting');
  await p.click('.viewer-close');
  await wait(400);

  // ---------- A real catch lands in the codex ----------
  console.log('Fishing');
  await boot({});
  await S(() => { __game.scene.getScene('room').travel('island'); });
  await wait(2200);
  await S(() => { __game.scene.getScene('island').scene.start('island', { map: 'one' }); });
  await wait(2000);
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
    await S(() => { const f = __game.scene.getScene('island').fishing; f.biteAt = f.t + 0.2; });
    await wait(450);
    await S(() => { window.__rand = Math.random; Math.random = () => 0.5; }); // no junk, so the catch is kept
    await p.mouse.click(195, 300);
    await wait(900);
    await S(() => { Math.random = window.__rand; });
    check(await shown('#catch'), 'catch card shows', 'no catch card');
    await shot('catch-card');
    const c3 = await codexNow();
    const got = Object.keys(c3?.seen || {}).filter((k) => /^(fish|find):/.test(k));
    const caught = await S(() => JSON.parse(localStorage.getItem('curation.fishing') || '{}'));
    check(got.length === 1 && c3.owned[got[0]] === 1 && caught.total >= 0, `catch recorded in the codex (${got[0]})`, 'catch not in the codex: ' + JSON.stringify(c3));
    await p.click('#catch');
    await wait(500);
    // the island's journal shows only the fish tab, with the catch in it
    await S(() => document.getElementById('journal-btn')?.click());
    await wait(500);
    const islandTabs = await S(() => ({ hidden: getComputedStyle(document.querySelector('.journal-tabs')).display, known: document.querySelectorAll('.fish-cell:not(.unknown)').length }));
    if (await shown('#journal')) check(islandTabs.known === 1, 'island journal shows the catch', 'island journal missing the catch: ' + JSON.stringify(islandTabs));
    else ok('(no journal button outdoors; skipped)');
  } else fail('could not find a pond spot to fish from');

  check(!errs.length, 'no page errors', 'page errors: ' + errs.slice(0, 3).join(' || '));
  await b.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
