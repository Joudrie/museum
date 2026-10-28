// Content pipeline test. Plain Node, no browser and NO network: museum responses come from
// tests/fixtures/content (hand-written to the documented shapes; see the README there).
// Usage: node tests/content.cjs
const fs = require('fs');
const os = require('os');
const path = require('path');
const root = path.join(__dirname, '..');
const fx = (n) => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'content', n), 'utf8'));
const load = (p) => import(path.join(root, p));

const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));
const has = (list, re) => list.some((x) => re.test(x));

(async () => {
  const schema = await load('src/collections/schema.js');
  const reg = await load('src/collections/index.js');
  const common = await load('tools/sources/common.mjs');
  const S = await load('tools/sources/index.mjs');
  const bl = await load('tools/blurbs.mjs');
  const ci = await load('tools/check_images.mjs');
  const rr = await load('tools/review_report.mjs');
  const pub = await load('tools/publish_content.mjs');
  const bb = await load('tools/build_batch.mjs');
  const imp = await load('tools/import_collection.mjs');
  const { imageSize } = await load('tools/imagesize.mjs');
  const paintingCol = reg.collection('painting');

  // ---------- Adapters ----------
  console.log('Adapters');
  const met = S.SOURCES.met.parse(fx('met-object.json'));
  const aic = S.SOURCES.aic.parse(fx('aic-artwork.json').data, 'https://www.artic.edu/iiif/2');
  const cle = S.SOURCES.cleveland.parse(fx('cleveland-artwork.json').data);
  const smi = S.SOURCES.smithsonian.parse(fx('smithsonian-row.json').response);
  const rij = S.SOURCES.rijks.parse(fx('rijks-artobject.json').artObject);
  const com = S.SOURCES.commons.parse(fx('commons-page.json'));
  const all = { met, aic, cleveland: cle, smithsonian: smi, rijks: rij, commons: com };
  Object.entries(all).forEach(([id, c]) => {
    const need = ['title', 'imageUrl', 'pageUrl', 'license', 'credit'].filter((k) => !c[k]);
    check(!need.length && c.source === id && c.publicDomain && !c.rejected && c.ratio > 0, `${id}: complete public-domain candidate (${c.title}, ratio ${c.ratio})`, `${id}: missing ${need.join(', ') || 'fields'} / rejected: ${c.rejected}`);
  });
  check(met.widthCm === 63.5 && met.heightCm === 101.6 && met.license === 'CC0', 'met: size from measurements, license CC0', 'met size/license wrong');
  check(aic.imageUrl === 'https://www.artic.edu/iiif/2/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/full/1280,/0/default.jpg' && aic.ratio === 1.5, 'aic: IIIF image at 1280px, ratio from dimensions_detail', 'aic image/ratio wrong: ' + aic.imageUrl + ' ' + aic.ratio);
  check(!/<p>/.test(aic.description) && aic.description.startsWith('The artist painted'), 'aic: html stripped from the description', 'aic description not cleaned: ' + aic.description);
  check(cle.heightCm === 120.5 && cle.widthCm === 62.3 && cle.maker === 'Test Master' && /fingerprint/.test(cle.description), 'cleveland: unframed size, maker, fun fact kept', 'cleveland parse wrong: ' + JSON.stringify([cle.widthCm, cle.heightCm, cle.maker]));
  check(smi.imageUrl.endsWith('&max=1280') && smi.license === 'CC0' && smi.year === '1835', 'smithsonian: CC0 media at 1280px', 'smithsonian parse wrong');
  check(rij.imageUrl.endsWith('=s1280') && rij.widthCm === 45 && rij.heightCm === 30, 'rijks: 1280px image, size in cm', 'rijks parse wrong: ' + rij.imageUrl);
  check(com.imageUrl.includes('1280px') && com.maker === 'C. Farmer' && com.ratio === 1.3333, 'commons: 1280px thumbnail, artist without html, ratio from image', 'commons parse wrong: ' + JSON.stringify([com.maker, com.ratio]));

  console.log('Public-domain gate');
  const rej = {
    met: S.SOURCES.met.parse(fx('met-object-copyright.json')),
    aic: S.SOURCES.aic.parse(fx('aic-search.json').data[1]),
    cleveland: S.SOURCES.cleveland.parse(fx('cleveland-search.json').data[1]),
    commons: S.SOURCES.commons.parse(fx('commons-copyrighted.json')),
  };
  Object.entries(rej).forEach(([id, c]) => check(!!c.rejected && !c.publicDomain, `${id}: not public domain is rejected (${c.rejected})`, `${id}: let a non-public-domain work through`));
  check(S.SOURCES.aic.parse(fx('aic-search.json').data[2]).rejected === 'no image', 'a record with no image is rejected', 'imageless record accepted');
  check(!common.isPublicDomain('CC BY-SA 4.0') && !common.isPublicDomain('All rights reserved') && common.isPublicDomain('CC0') && common.isPublicDomain('Public domain') && common.isPublicDomain('PD-old-100'), 'license strings: CC BY-SA and all-rights-reserved refused, CC0 and public domain accepted', 'isPublicDomain wrong');
  const noPd = common.candidate({ source: 'x', sourceId: 1, title: 'T', imageUrl: 'https://x/y.jpg', license: 'CC0', publicDomain: false, credit: 'c' });
  check(!!noPd.rejected, 'a source that says "not public domain" wins over a CC0-looking string', 'publicDomain flag ignored');

  console.log('search / fetch through a fake network');
  const asked = [];
  const route = (url) => {
    asked.push(url);
    if (/objects\/900001/.test(url)) return fx('met-object.json');
    if (/objects\/900002/.test(url)) return fx('met-object-copyright.json');
    if (/metmuseum.*\/search/.test(url)) return fx('met-search.json');
    if (/api\.artic\.edu.*\/search/.test(url)) return fx('aic-search.json');
    if (/api\.artic\.edu.*artworks\/900010/.test(url)) return fx('aic-artwork.json');
    if (/clevelandart.*\/api\/artworks\/\?q=/.test(url)) return fx('cleveland-search.json');
    if (/clevelandart.*artworks\/900020/.test(url)) return fx('cleveland-artwork.json');
    return null;
  };
  common.configure({ cache: false, fetch: async (url) => { const j = route(url); return j ? { ok: true, status: 200, json: async () => j } : { ok: false, status: 404, json: async () => ({}) }; } });
  const ms = await S.SOURCES.met.search('pines', { limit: 5 });
  check(ms.candidates.length === 1 && ms.rejected.length === 1 && /not public domain/.test(ms.rejected[0].reason), 'met search: 1 usable, 1 rejected with its reason', 'met search split wrong: ' + JSON.stringify(ms.rejected));
  check(asked.some((u) => /isPublicDomain=true/.test(u) && /hasImages=true/.test(u)), 'met search only asks for public-domain works with images', 'met search did not filter');
  const as = await S.SOURCES.aic.search('harbour');
  check(as.candidates.length === 1 && as.rejected.length === 1, 'aic search: drops the copyrighted and imageless records', 'aic search split wrong');
  check((await S.SOURCES.aic.fetch(900010)).sourceId === '900010', 'aic fetch by id', 'aic fetch failed');
  check((await S.SOURCES.cleveland.search('scroll')).candidates.length === 1, 'cleveland search', 'cleveland search failed');
  check((await S.SOURCES.cleveland.search('scroll').then(() => asked.at(-1))).includes('cc0=1'), 'cleveland search asks for CC0 only', 'cleveland search not CC0');
  const multi = await S.searchAll('pines', { sources: ['met', 'smithsonian'], limit: 3 });
  check(multi.candidates.length === 1 && multi.errors.length === 1 && /SI_API_KEY/.test(multi.errors[0].error), 'searchAll: a source with no key is reported, the others still answer', 'searchAll error handling wrong: ' + JSON.stringify(multi.errors));
  common.configure({ fetch: async () => { throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } }); } });
  const blocked = await S.searchAll('x', { sources: ['met'] });
  check(blocked.errors.length === 1 && /could not reach collectionapi\.metmuseum\.org/.test(blocked.errors[0].error) && /docs\/CONTENT\.md/.test(blocked.errors[0].error), 'a blocked host gives a plain-English error pointing at the docs', 'blocked-host error unclear: ' + JSON.stringify(blocked.errors));

  // ---------- Image sizes and the checker ----------
  console.log('Image checker');
  const png = (w, h, extra = 0) => { const b = Buffer.alloc(24 + extra); b.writeUInt32BE(0x89504e47, 0); b.writeUInt32BE(w, 16); b.writeUInt32BE(h, 20); return b; };
  const jpeg = (w, h) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b, 0x08, h >> 8, h & 255, w >> 8, w & 255, 0x01, 0x01, 0x11, 0x00]);
  check(JSON.stringify(imageSize(png(300, 200))) === '{"type":"png","width":300,"height":200}', 'png size read', 'png size wrong');
  check(imageSize(jpeg(1280, 960))?.width === 1280 && imageSize(jpeg(1280, 960))?.height === 960, 'jpeg size read', 'jpeg size wrong');
  check(imageSize(Buffer.from('<html>not an image at all</html>')) === null, 'html is not an image', 'html passed as an image');
  const e = (ratio) => ({ id: 'painting:t', title: 'T', ratio, image: { kind: 'url', src: 'https://x/t.jpg' } });
  const get = (r) => async () => r;
  const flagsOf = async (entry, r) => (await ci.checkEntry(entry, get(r))).flags.join();
  check((await flagsOf(e(1.3333), { status: 200, contentType: 'image/jpeg', bytes: jpeg(1280, 960) })) === '', 'a good image has no flags', 'good image flagged');
  check((await flagsOf(e(1.3333), { status: 404, contentType: 'text/html', bytes: Buffer.from('nope') })) === 'broken', 'a 404 is broken', '404 not flagged broken');
  check((await flagsOf(e(1.3333), { error: 'ENOTFOUND' })) === 'broken', 'a network error is broken', 'network error not broken');
  check((await flagsOf(e(1.3333), { status: 200, contentType: 'image/jpeg', bytes: jpeg(640, 480) })) === 'tiny', 'a 640px image is tiny', 'tiny not flagged');
  check((await flagsOf(e(1.3333), { status: 200, contentType: 'image/png', bytes: png(1280, 960, 700 * 1024) })) === 'huge', 'a 700 KB image is huge', 'huge not flagged');
  check((await flagsOf(e(1.3333), { status: 200, contentType: 'image/jpeg', bytes: jpeg(1280, 1000) })) === 'ratio', 'a 1280×1000 image for a 4:3 entry has the wrong shape', 'ratio not flagged');
  check((await flagsOf(e(1.3333), { status: 200, contentType: 'image/jpeg', bytes: jpeg(1280, 970) })) === '', 'within 3% passes', '3% tolerance wrong');
  check(/not-image/.test(await flagsOf(e(1.3333), { status: 200, contentType: 'text/html', bytes: Buffer.from('<html></html>') })), 'an html page served as the picture is flagged', 'html page not flagged');
  check(ci.formatTable([await ci.checkEntry(e(1.3333), get({ status: 404, contentType: '', bytes: Buffer.alloc(0) }))]).includes('1 need attention'), 'the table counts what needs attention', 'table summary wrong');
  const sw = ci.sameWork({ title: 'The Milkmaid', by: 'Johannes Vermeer' }, { title: 'The Milkmaid', maker: 'Johannes Vermeer' });
  check(sw && !ci.sameWork({ title: 'The Milkmaid', by: 'Johannes Vermeer' }, { title: 'Landscape', maker: 'Someone Else' }), 'replacement matching needs the same maker and title', 'sameWork wrong');

  // ---------- Drafts and claims ----------
  console.log('Blurbs and claims');
  const none = [];
  const draftOf = (c) => bl.buildDraft(c, { collection: 'painting', rarity: 2 });
  const d = draftOf(aic);
  const clean = (x) => bl.checkDraft(x, { existing: none });
  check(d.status === 'draft' && d.entry.id.startsWith('painting:') && d.entry.ratio === 1.5 && d.entry.era === 'impressionist', `aic draft: ${d.entry.id}, era ${d.entry.era}`, 'aic draft wrong: ' + JSON.stringify(d.entry));
  check(d.claims.length >= 1 && d.claims.every((k) => k.quote && k.source), 'every claim carries its quote and source field', 'claims missing quote/source');
  check(d.entry.blurb.length > 0 && d.entry.blurb.length <= 220 && aic.description.includes(d.entry.blurb), 'the blurb is a sentence from the museum, within 220 characters', 'blurb not from source: ' + d.entry.blurb);
  check(clean(d).length === 0, 'a sourced draft has no problems', 'clean draft flagged: ' + clean(d).join(' | '));
  check(schema.validateEntry(d.entry, paintingCol).length === 0, 'the draft entry passes the schema', 'draft fails schema: ' + schema.validateEntry(d.entry, paintingCol));
  const dm = draftOf(met);
  check(dm.claims.length === 1 && dm.claims[0].placeholderFor && has(clean(dm), /needs a real hook/) && has(clean(dm), /no blurb|real hook/), 'no description in the source: the draft states only the record and says it needs a hook (nothing invented)', 'met draft invented or hid something: ' + JSON.stringify(dm.claims));
  const dc = draftOf(cle);
  check(dc.entry.facts?.length >= 1 && dc.entry.facts.length <= 3 && dc.claims.every((k) => bl.findQuote(k.quote, cle.texts)), 'cleveland draft: 1-3 facts, all found in the source', 'cleveland facts wrong: ' + JSON.stringify(dc.entry.facts));

  const bad = (mut) => { const x = JSON.parse(JSON.stringify(d)); mut(x); return bl.syncDraft(x) && bl.checkDraft(x, { existing: none }); };
  check(has(bad((x) => (x.claims[0].quote = 'The artist painted it on a boat in the middle of a storm.')), /not sourced/), 'a claim whose quote is not in the source is flagged', 'unsourced claim passed');
  check(has(bad((x) => (x.claims[0].text = 'The artist finished the canvas in 19 mornings, always before the tide turned.')), /number\(s\) 19/), 'a number that is not in the quote is flagged', 'invented number passed');
  check(has(bad((x) => (x.claims[0].source = 'funFact')), /came from/), 'a wrong source field is flagged', 'wrong field passed');
  check(has(bad((x) => (x.claims[0].text = 'A masterpiece of the harbour, iconic and famous.')), /filler/), 'filler words are flagged', 'filler passed');
  check(has(bad((x) => { x.claims[0].text = 'x'.repeat(230); x.claims[0].quote = x.claims[0].text; }), /230 characters/), 'a blurb over 220 characters is flagged', 'long blurb passed');
  const edited = JSON.parse(JSON.stringify(d));
  edited.entry.blurb = 'Hand edited text';
  check(has(bl.checkDraft(edited, { existing: none }), /does not match its claims/), 'a blurb edited away from its claims is flagged', 'edited blurb passed');
  check(has(bad((x) => (x.candidate.publicDomain = false)), /not public domain/), 'a draft from a non-public-domain candidate is flagged', 'non-PD draft passed');
  check(has(bad((x) => delete x.entry.source.license), /license/), 'a missing license is flagged', 'missing license passed');
  check(has(bl.checkDraft(d, { existing: [{ id: 'painting:other', title: d.entry.title, by: d.entry.by }] }), /already in the game/), 'a work already in the game is flagged', 'duplicate passed');
  check(bl.findQuote('the  ARTIST painted the harbour', { description: 'The artist painted the harbour from a rented room.' }) === 'description' && bl.findQuote('short', { a: 'short text' }) === null, 'quotes match ignoring case and spacing; tiny quotes prove nothing', 'findQuote wrong');
  check(bl.findQuote('She said “hello” to the café owner.', { a: 'She said "hello" to the cafe owner.' }) === 'a', 'quotes match across curly quotes and accents', 'findQuote folding wrong');
  check(clean(draftOf({ ...aic, rarity: 1 })).some((m) => /rarity is the default/.test(m)) === false, 'a chosen rarity passes', 'rarity check wrong');
  check(has(clean(bl.buildDraft(aic)), /rarity is the default/), 'leaving rarity at the default is flagged for a decision', 'default rarity not flagged');

  // ---------- Review and publish ----------
  console.log('Review and publish');
  const html = rr.renderHtml([d]);
  check(rr.renderEntry(d, { existing: none }).includes(d.claims[0].quote) && rr.renderEntry(d, { existing: none }).includes(d.entry.image.src) && html.includes('<img') && html.includes(d.entry.title), 'the report shows each claim next to its quote, and the picture', 'report content wrong');
  const pack = { collection: paintingCol, sets: [], entries: [] };
  const approved = JSON.parse(JSON.stringify(d));
  approved.status = 'approved';
  const p1 = pub.plan({ pack, drafts: [d], existing: none });
  check(p1.added.length === 0 && p1.skipped.length === 1, 'a draft is not exported', 'a draft was exported');
  const p2 = pub.plan({ pack, drafts: [approved], existing: none });
  check(p2.blockers.length === 0 && p2.added.join() === d.entry.id && p2.entries.length === 1, 'an approved, clean entry is exported', 'approved entry blocked: ' + p2.blockers.join(' | '));
  const dirty = JSON.parse(JSON.stringify(approved));
  dirty.claims[0].quote = 'This sentence is not in the source at all, so it cannot be approved.';
  const p3 = pub.plan({ pack, drafts: [dirty], existing: none });
  check(p3.blockers.some((m) => /not sourced/.test(m)), 'approving an entry with an unsourced claim is refused', 'unsourced approved entry passed');
  const nol = JSON.parse(JSON.stringify(approved));
  delete nol.entry.source.license;
  check(pub.plan({ pack, drafts: [nol], existing: none }).blockers.some((m) => /license/.test(m)), 'approving an entry with no license is refused', 'missing license approved');
  check(pub.plan({ pack, drafts: [approved], existing: [{ id: 'painting:x', title: d.entry.title, by: d.entry.by }] }).blockers.some((m) => /already in the game/.test(m)), 'approving a duplicate is refused', 'duplicate approved');
  const packWith = { collection: paintingCol, sets: [], entries: [p2.entries[0], { ...p2.entries[0], id: 'painting:keep-me', title: 'Keep me' }] };
  const p4 = pub.plan({ pack: packWith, drafts: [], existing: none });
  check(p4.entries.length === 2 && p4.removed.length === 0, 'nothing is removed when it is not named', 'an entry was dropped silently');
  const p5 = pub.plan({ pack: packWith, drafts: [], remove: ['painting:keep-me'], existing: none });
  check(p5.entries.length === 1 && p5.removed.join() === 'painting:keep-me', 'removal happens only when named, and is reported', 'removal wrong');
  check(pub.plan({ pack: packWith, drafts: [], remove: ['painting:ghost'], existing: none }).blockers.some((m) => /don't exist/.test(m)), 'removing something that is not there is refused', 'ghost removal passed');
  const back = JSON.parse(JSON.stringify(approved));
  back.status = 'draft';
  check(pub.plan({ pack: p2 && { collection: paintingCol, sets: [], entries: p2.entries }, drafts: [back], existing: none }).warnings.length === 1, 'an entry published but no longer approved is reported, not removed', 'demotion not reported');
  const table = pub.creditsTable([p2.entries[0], { id: 'fish:x', collection: 'fish', title: 'X', source: { license: 'Original', credit: 'Curation' } }]);
  check(table.includes(d.entry.title) && !table.includes('| fish |'), 'credits list outside work and skip original art', 'credits table wrong');
  const md1 = pub.spliceCredits('# Art credits\n\nThanks.\n', table);
  const md2 = pub.spliceCredits(md1, table);
  check(md1.includes('Thanks.') && md1 === md2 && (md2.match(/content:begin/g) || []).length === 1, 'CREDITS.md is updated in place and stays the same on a second run', 'credits splice not idempotent');
  check((await pub.findDataFile('painting')).endsWith('paintings.js') && (await pub.findDataFile('nothing')) === null, 'the data file is found by collection id', 'findDataFile wrong');
  check(!fs.readFileSync(path.join(root, 'src/collections/data/fish.js'), 'utf8').includes(pub.MARKER) && fs.readFileSync(path.join(root, 'src/collections/data/paintings.js'), 'utf8').includes(pub.MARKER), 'only marked data files can be rewritten', 'marker rule wrong');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'review-'));
  const f = bl.writeDraft(d, tmp);
  check(rr.loadReviews(tmp, 'painting').length === 1, 'drafts are written to and read from content/review/<collection>/', 'review files not round-tripping');
  const rev = JSON.parse(fs.readFileSync(f, 'utf8'));
  rev.status = 'approved';
  fs.writeFileSync(f, JSON.stringify(rev));
  let refused = false;
  try { bl.writeDraft(d, tmp); } catch { refused = true; }
  check(refused, 'a reviewed file is never overwritten by a re-draft', 'overwrote an approved file');

  // ---------- The importer, extended ----------
  console.log('Importer');
  const wall = imp.buildPack([{ slug: 'a', title: 'A', image_src: 'https://x/a.jpg', display: 'wall', license: 'CC0', credit: 'c' }], { collection: 'painting2', name: 'P', icon: 'x', noun: 'p', display: 'wall' });
  check(wall.problems.some((m) => /ratio/.test(m)), 'a wall picture with no ratio is refused', 'importer accepted a wall picture without a ratio');

  // ---------- Batch ----------
  console.log('Batch');
  const fakeDeps = (table) => ({ SOURCES: {}, searchAll: async (q) => table[q] || { candidates: [], rejected: [], errors: [] } });
  const batch = { collection: 'painting', items: [{ query: 'found', maker: 'A. Painter', title: 'Fixture Harbour at Dawn', sources: ['aic'] }, { query: 'missing' }, { query: 'copyright' }, { query: 'blocked' }] };
  const rep = await bb.runBatch(batch, fakeDeps({ found: { candidates: [aic], rejected: [], errors: [] }, copyright: { candidates: [], rejected: [{ reason: 'license is "x"' }], errors: [] }, blocked: { candidates: [], rejected: [], errors: [{ source: 'met', error: 'could not reach' }] } }), { write: false });
  check(rep[0].ok && rep[0].problems >= 0 && !rep[1].ok && /no public-domain match/.test(rep[1].why) && /only non-public-domain/.test(rep[2].why) && /could not reach/.test(rep[3].why), 'batch: drafts what it finds and says why the rest failed', 'batch report wrong: ' + JSON.stringify(rep));
  const first = JSON.parse(fs.readFileSync(path.join(root, 'content/batches/first-batch.json'), 'utf8'));
  const ids = Object.keys(S.SOURCES);
  check(first.items.length === 12 && first.items.every((i) => i.query && i.sources.every((s) => ids.includes(s))), 'the first batch has 12 searches, each with known sources', 'first batch malformed');
  check(new Set(first.items.map((i) => i.region)).size >= 9, 'the first batch spans at least 9 regions', 'first batch too narrow');

  // ---------- Nothing unreviewed is in the game ----------
  console.log('Game');
  check(reg.list({ collection: 'painting' }).length === 49, 'still 49 paintings in the game', 'the painting count changed: ' + reg.list({ collection: 'painting' }).length);
  const unapproved = rr.loadReviews(undefined).filter((x) => x.status !== 'approved' && reg.get(x.entry.id));
  check(!unapproved.length, 'no unreviewed draft is in the registry', 'unreviewed drafts are in the game: ' + unapproved.map((x) => x.entry.id));
  check(!reg.problems().length, 'the registry loads cleanly', 'registry problems: ' + reg.problems());

  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
