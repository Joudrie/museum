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
const { openHub, jtab } = require('./nav.cjs');
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
  const ms = await import(path.join(src, 'milestones.js'));
  const half = { seen: Object.fromEntries(reg.list().slice(0, Math.ceil(reg.list().length / 2)).map((e) => [e.id, { n: 1, first: 0 }])), claimed: { 'milestone-10': true } };
  const mst = ms.milestones(half);
  check(mst.map((m) => m.reached).join() === 'true,true,true,false,false' && mst[0].claimed && !mst[1].claimed, 'milestones: 10/25/50 reached at half, only the claimed one is paid', 'milestones wrong: ' + JSON.stringify(mst));
  check(ms.completion({ seen: {} }).pct === 0 && ms.completion({ seen: {} }).total === reg.list().length, 'completion counts every collectable entry', 'completion wrong');
  const vg = reg.getSet('artist-vangogh');
  check(vg && vg.entries.length === reg.list({ q: 'van gogh', collection: 'painting' }).length && vg.reward.gold === 100 * vg.entries.length && !reg.sets('painting').length && reg.sets('painting', true).length >= 5, 'artist sets are made from the paintings and are journal goals only', 'artist sets wrong');
  check(reg.list({ tag: 'pond' }).length === 8, 'tag filter works', 'tag filter broken');
  // Dig finds: each new dig collection has dirty-or-clean entries and a full set, and the codex keeps a sane `dirty` count.
  ['pottery', 'coin', 'arrowhead', 'shell', 'meteorite'].forEach((id) => check(reg.list({ collection: id }).length >= 5, `${id}: at least 5 entries`, `${id} is missing entries`));
  check(reg.get('pottery:red-sherd').dirty === true && reg.get('shell:conch').dirty === undefined, 'dirty is set on the entries that arrive dirty', 'dirty flag wrong');
  check(codex.normalize(null).dirty && !Object.keys(codex.normalize({ v: 1, seen: {}, owned: {}, claimed: {} }).dirty).length, 'old saves without dirty still load', 'old save lost');
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

// The shop: sell for half, buy-back after a week at a premium, a daily Gallery Shop. Pure logic, run against an in-memory save.
async function shopChecks() {
  console.log('Shop');
  const mem = {};
  global.localStorage = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => (mem[k] = String(v)), removeItem: (k) => delete mem[k] };
  const src = path.join(__dirname, '..', 'src', 'collections');
  const shop = await import(path.join(src, 'shop.js'));
  const codex = await import(path.join(src, 'codex.js'));
  const reg = await import(path.join(src, 'index.js'));
  let gold = 1000;
  const wallet = { add: (n) => (gold += n), spend: (n) => (gold >= n ? ((gold -= n), true) : false) };
  const DAY = 24 * 3600 * 1000;
  const t0 = Date.parse('2026-10-29T12:00:00');

  const a = shop.shelf(t0).map((r) => r.entry.id);
  check(a.join() === shop.shelf(t0 + 3600 * 1000).map((r) => r.entry.id).join() && a.length >= 3 && a.length <= 5, `Gallery Shop: ${a.length} pieces, the same all day`, 'shelf not stable or wrong size: ' + a);
  check([1, 2, 3, 4].some((d) => shop.shelf(t0 + d * DAY).map((r) => r.entry.id).join() !== a.join()), 'Gallery Shop changes from day to day', 'shelf never changes');
  check(shop.shelf(t0).every((r) => reg.collectionOf(r.entry).ownership === 'earned' && reg.collectionOf(r.entry).display !== 'tank' && (r.entry.rarity ?? 1) <= 3), 'shelf holds earned, non-fish pieces only', 'shelf has something it should not');

  const q = reg.get('mineral:quartz');
  codex.collect(q.id);
  const r1 = shop.sell(q.id, wallet);
  check(r1.ok && r1.gold === Math.round(shop.basePrice(q) * 0.5) && gold === 1000 + r1.gold && !codex.snapshot().owned[q.id] && codex.snapshot().seen[q.id], `selling pays 50% (${r1.gold}) and the codex keeps the stamp`, 'sell wrong: ' + JSON.stringify(r1));
  check(!shop.sell(q.id, wallet).ok, 'nothing left to sell the second time', 'sold something it did not have');
  const early = shop.buyBack(q.id, wallet, Date.now());
  check(!early.ok && /yet/.test(early.why), 'buy-back is locked for a week', 'buy-back opened early: ' + JSON.stringify(early));
  const sold = codex.snapshot().sold[q.id];
  const g0 = gold;
  const late = shop.buyBack(q.id, wallet, sold.at + 7 * DAY + 1000);
  check(late.ok && late.gold > r1.gold && gold === g0 - late.gold && codex.snapshot().owned[q.id] === 1 && !codex.snapshot().sold[q.id], `after a week it costs ${late.gold}, more than the ${r1.gold} it sold for`, 'buy-back wrong: ' + JSON.stringify(late));
  check(!shop.sell(q.id, wallet, () => 1).ok && /display/.test(shop.sell(q.id, wallet, () => 1).why), 'a piece on display cannot be sold', 'sold a displayed piece');
  codex.collect('mineral:amethyst', { dirty: true });
  check(!shop.sell('mineral:amethyst', wallet).ok, 'a dirty piece cannot be sold until restored', 'sold a dirty piece');
  check(!shop.sell('painting:harvesters', wallet).ok, 'paintings (held from the start) are not for sale yet', 'sold a painting');

  const row = shop.shelf(t0)[0];
  gold = 0;
  check(!shop.buy(row.entry.id, wallet, t0).ok && !codex.snapshot().owned[row.entry.id], 'cannot buy without the gold', 'bought for free');
  gold = 5000;
  const b1 = shop.buy(row.entry.id, wallet, t0);
  check(b1.ok && b1.gold === Math.round(shop.basePrice(row.entry) * 1.5) && codex.snapshot().owned[row.entry.id] === 1 && gold === 5000 - b1.gold, `buying costs 150% (${b1.gold}) and arrives clean`, 'buy wrong: ' + JSON.stringify(b1));
  check(!shop.buy(row.entry.id, wallet, t0).ok && shop.shelf(t0)[0].owned, 'one of a kind: owned pieces cannot be bought twice', 'bought a second copy');
  check(!shop.buy('mineral:not-there', wallet, t0).ok, 'a piece not on the shelf cannot be bought', 'bought an off-shelf piece');

  mem['curation.codex'] = JSON.stringify({ v: 1, seen: {}, owned: {}, sold: { 'mineral:quartz': { n: -4, at: 'x' }, 'bad id': { n: 1 }, 'fish:minnow': 'x', 'fossil:trilobite': { n: 2, at: 5 } } });
  const nz = codex.snapshot();
  check(Object.keys(nz.sold).join() === 'fossil:trilobite', 'a corrupt sold ledger is repaired', 'sold ledger not repaired: ' + JSON.stringify(nz.sold));
  delete global.localStorage;
}

(async () => {
  await dataChecks();
  await shopChecks();

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
    if (tab) await jtab(p, tab);
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
  const tabs = await S(() => [...document.querySelectorAll('#journal .jcard > b')].map((b) => b.textContent));
  check(tabs.join() === 'Paintings,Visitors,Fish,Minerals,Fossils,Pottery,Coins,Stone tools,Shells,Meteorites,Treasures,Makers,Insects,Codex,Storage,Gallery Shop', `cards: ${tabs.join(', ')}`, `unexpected cards: ${tabs.join(', ')}`);
  const tabFits = await S(() => [...document.querySelectorAll('#journal .jcard > b, #journal .jcard > small')].every((b) => b.scrollWidth <= b.clientWidth + 1));
  check(tabFits, 'card labels fit', 'a card label is clipped');
  await shot('journal-goals');
  await noSideScroll('goals');

  await jtab(p, 'paintings');
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

  await jtab(p, 'visitors');
  await wait(400);
  check((await S(() => document.querySelectorAll('.fish-cell').length)) === 19, 'visitors tab lists the 19 famous visitors from the registry', 'visitors tab broke');
  await shot('journal-visitors');

  await jtab(p, 'fish');
  await wait(400);
  check((await S(() => document.querySelectorAll('.bobber').length)) === 5, 'fish tab keeps its bobbers', 'bobbers missing');
  check((await S(() => document.querySelectorAll('.fish-cell').length)) === 21, '18 fish and 3 finds in the log', 'fish log size wrong');
  check((await S(() => document.querySelectorAll('.fish-cell.unknown').length)) === 21, 'all are silhouettes on a fresh save', 'fresh save shows catches');
  check((await S(() => document.querySelectorAll('.set-row').length)) === 2, 'pond and sea sets show', 'fish sets missing');
  await shot('journal-fish');
  await noSideScroll('fish');

  await jtab(p, 'minerals');
  await wait(400);
  check((await S(() => document.querySelectorAll('.fish-cell').length)) === 8, 'Minerals tab lists 8 minerals from data alone', 'minerals missing');
  await shot('journal-minerals-empty');
  await closeJournal();

  // ---------- Minerals: collect, view, claim ----------
  console.log('Minerals');
  await openHub(p);
  await p.click('#settings-btn');
  await wait(500);
  await p.click('text=Collect one of everything');
  await wait(300);
  const msg = await S(() => [...document.querySelectorAll('#settings button')].find((b) => /^Added/.test(b.textContent))?.textContent);
  check(/Added 100/.test(msg || ''), `testing button: ${msg}`, `testing button said: ${msg}`); // 18 fish + 3 finds + 8 minerals + 8 fossils + 6 pottery + 6 coins + 6 stone tools + 6 shells + 5 meteorites + 28 more (stamps, armour, insects, ships, glass, clocks, inventions) + 2 skeletons + 4 map pieces
  await p.click('.settings-close');
  await wait(300);
  await openJournal('minerals');
  check((await S(() => document.querySelectorAll('.fish-cell:not(.unknown)').length)) === 8, 'all 8 minerals show once collected', 'minerals still hidden');
  check((await S(() => document.querySelector('.set-row.done .quest-claim') !== null)), 'finished set offers its reward', 'no claim button');
  await shot('journal-minerals');
  await noSideScroll('minerals');

  // search, filters, NEW marks
  check((await S(() => document.querySelectorAll('.fish-cell .mark-new').length)) === 8, 'everything just collected carries a NEW mark', 'NEW marks missing');
  await S(() => { const i = document.querySelector('.journal-search'); i.value = 'obsidian'; i.dispatchEvent(new Event('input')); });
  check((await S(() => document.querySelectorAll('.fish-cell:not(.filtered-out)').length)) === 1, 'searching "obsidian" leaves one mineral', 'search did not filter');
  await S(() => { const i = document.querySelector('.journal-search'); i.value = ''; i.dispatchEvent(new Event('input')); [...document.querySelectorAll('.journal-chips .chip')].find((b) => b.dataset.f === 'missing').click(); });
  check((await S(() => document.querySelectorAll('.fish-cell:not(.filtered-out)').length)) === 0, '"Missing" hides everything once all are collected', 'missing filter wrong');
  await S(() => [...document.querySelectorAll('.journal-chips .chip')].find((b) => b.dataset.f === 'all').click());
  check((await S(() => document.querySelectorAll('.fish-cell:not(.filtered-out)').length)) === 8, '"All" brings them back', 'all filter wrong');
  await p.click('.journal-back');
  await wait(300);
  check((await S(() => document.querySelectorAll('#journal .jcard .jbadge').length)) >= 3, 'collections with new finds get a badge', 'no new-badge on the overview');
  await jtab(p, 'fossils');
  await wait(300);
  await jtab(p, 'minerals');
  await wait(300);
  check((await S(() => document.querySelectorAll('.fish-cell .mark-new').length)) === 0, 'NEW clears after you leave the tab', 'NEW did not clear');

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

  // ---------- Codex tab: milestones and artist sets ----------
  console.log('Codex');
  await openJournal('codex');
  const cx0 = await S(() => ({ claims: document.querySelectorAll('.set-row .quest-claim').length, rows: document.querySelectorAll('.set-row').length, text: document.querySelector('.toolkit-note').textContent }));
  check(cx0.claims === 3 && cx0.rows > 15, `codex tab: 3 milestones reached, ${cx0.rows} rows (${cx0.text})`, 'codex tab wrong: ' + JSON.stringify(cx0));
  await shot('journal-codex');
  await noSideScroll('codex');
  await p.click('.set-row .quest-claim');
  await wait(300);
  const cx1 = await codexNow();
  check(cx1.claimed['milestone-10'] === true && !cx1.claimed['milestone-25'], 'claiming a milestone is saved and pays once', 'milestone claim wrong: ' + JSON.stringify(cx1.claimed));
  check((await S(() => document.querySelectorAll('.set-row .quest-claim').length)) === 2, 'claimed milestone loses its button', 'milestone button still there');
  await closeJournal();
  // ---------- Shop tab ----------
  console.log('Shop tab');
  await openJournal('shop');
  const sh0 = await S(() => ({ h: [...document.querySelectorAll('#journal .fish-h')].map((h) => h.textContent.split(' ·')[0]).join(), rows: document.querySelectorAll('.shop-row').length, sell: [...document.querySelectorAll('.shop-row .quest-claim')].filter((b) => /^Sell/.test(b.textContent)).length }));
  check(sh0.h === 'Gallery Shop,Sell,Buy back' && sh0.sell > 10, `shop tab: ${sh0.h}, ${sh0.sell} pieces to sell`, 'shop tab wrong: ' + JSON.stringify(sh0));
  await shot('journal-shop');
  await noSideScroll('shop');
  const coins0 = await S(() => JSON.parse(localStorage.getItem('curation.coins') ?? '300'));
  await p.evaluate(() => [...document.querySelectorAll('.shop-row .quest-claim')].find((b) => /^Sell/.test(b.textContent)).click());
  await wait(300);
  const sh1 = await codexNow();
  const coins1 = await S(() => JSON.parse(localStorage.getItem('curation.coins') ?? '300'));
  check(Object.keys(sh1.sold || {}).length === 1 && coins1 > coins0, `selling in the tab pays gold (${coins0} to ${coins1}) and lands on the buy-back list`, 'tab sell wrong: ' + JSON.stringify(sh1.sold));
  check((await S(() => [...document.querySelectorAll('.shop-row .quest-claim')].some((b) => /^Buy/.test(b.textContent) && b.disabled))), 'sold piece waits a week before it can be bought back', 'buy-back not locked');
  await closeJournal();
  await openJournal('paintings');
  check((await S(() => [...document.querySelectorAll('.set-row b')].some((b) => b.textContent === 'Vincent van Gogh'))), 'paintings tab shows the van Gogh artist set', 'no artist set on the paintings tab');
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
