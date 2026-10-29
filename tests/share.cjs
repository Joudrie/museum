// Share, visit and daily test.
//  1. Plain Node: codes round-trip, bad and hostile input is refused or cleaned.
//  2. Browser (390×844): the daily gift and wheel pay once a day, the streak is gentle,
//     a visit link opens a friend's museum without touching your own save, no personal
//     data is in a code, a friend's island lands in the boat's list.
// Usage: npm run build && npx vite preview --port 4173 --base / &
//        PW=/path/to/playwright OUT=some/dir node tests/share.cjs
const { chromium } = require(process.env.PW || 'playwright');
const { openHub } = require('./nav.cjs');
const fs = require('fs');
const path = require('path');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'share-shots';
fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));

async function nodeChecks() {
  console.log('Codes');
  const { toCode, fromCode, cleanVisit, cleanIsland } = await import(path.join(__dirname, '..', 'src', 'sharecode.js'));
  const visit = { v: 1, n: 'My <b>Place</b>', s: 64, r: [{ n: 'Entrance', p: ['harvesters', 'x'.repeat(200)], d: { bench: 2 } }, { n: 'Hall', p: [], d: {} }] };
  const back = await fromCode(await toCode(visit));
  check(JSON.stringify(back) === JSON.stringify(visit), 'a museum code round-trips', 'museum code changed in transit');
  const url = 'https://x.github.io/museum/index.html?visit=' + (await toCode(visit));
  check((await fromCode(url)).s === 64, 'a whole link works as a code', 'link not read');
  const clean = cleanVisit(back);
  check(clean.name === 'My bPlace/b' && clean.rooms[0].paintings[1].length === 60, 'names are scrubbed and long ids cut', 'visit not cleaned: ' + JSON.stringify(clean));
  check(!cleanVisit({ v: 2, r: [] }) && !cleanVisit(null) && !cleanVisit({ v: 1, r: [] }), 'junk visits are refused', 'junk visit accepted');
  let threw = 0;
  for (const bad of ['', 'zzzz', 'q123', '!!!', 'j' + Buffer.from('not json').toString('base64')]) await fromCode(bad).catch(() => threw++);
  check(threw === 5, 'broken codes throw instead of crashing', `only ${threw}/5 broken codes threw`);
  const corners = Array.from({ length: 9 }, () => '2'.repeat(9));
  const isl = { kind: 'island', name: 'Home', w: 8, h: 8, corners, tiles: { '1,1': 't:grass', 'a,b': 't:x', '2,2': '<script>' }, objects: [{ ref: 'p:chairs/1', x: 3, y: 4, flip: true, evil: 'x' }, { ref: 5, x: 1, y: 1 }], extra: 'x' };
  const ci = cleanIsland(isl);
  check(ci && Object.keys(ci.tiles).length === 1 && ci.objects.length === 1 && !('extra' in ci) && !('evil' in ci.objects[0]), 'island keeps only known, safe fields', 'island not cleaned: ' + JSON.stringify(ci));
  check(!cleanIsland({ ...isl, corners: corners.slice(1) }) && !cleanIsland({ ...isl, w: 9999 }) && !cleanIsland({ ...isl, kind: 'room' }), 'malformed islands are refused', 'bad island accepted');
  check(JSON.stringify(await fromCode(await toCode(ci))) === JSON.stringify(ci), 'an island round-trips', 'island changed in transit');
}

async function browserChecks() {
  console.log('Browser');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(2000);
  const ev = (f, a) => page.evaluate(f, a);

  // daily
  await openHub(page);
  await page.click('#daily-btn');
  await page.waitForTimeout(300);
  const c0 = Number(await ev(() => localStorage.getItem('curation.coins') ?? 300));
  await page.click('#daily .daily-card:nth-child(1) .wide-btn');
  const c1 = Number(await ev(() => localStorage.getItem('curation.coins')));
  check(c1 === c0 + 50, 'welcome gift pays 50 on day one', `gift paid ${c1 - c0}`);
  await page.click('#daily .daily-card:nth-child(2) .wide-btn');
  await page.waitForTimeout(3500);
  const c2 = Number(await ev(() => localStorage.getItem('curation.coins')));
  const prize = await ev(() => JSON.parse(localStorage.getItem('curation.daily')).prize);
  check([25, 40, 60, 100, 75, 250].includes(prize) && c2 === c1 + prize, `wheel paid ${prize}`, 'wheel did not pay a slice');
  check(await page.$eval('#daily .daily-card:nth-child(1) .wide-btn', (b) => b.disabled), 'gift cannot be taken twice', 'gift button still live');
  check(await page.$eval('#daily .daily-card:nth-child(2) .wide-btn', (b) => b.disabled), 'wheel cannot be spun twice', 'wheel button still live');
  check(await page.$('#daily .daily-poty .t').then(async (e) => !!(await e.textContent())), 'painting of the day shows', 'no painting of the day');
  await page.screenshot({ path: path.join(OUT, 'daily.png') });
  await page.click('.daily-close');
  check(await page.$eval('#daily-btn .badge', (b) => b.classList.contains('hidden')), 'badge clears once claimed', 'badge stuck on');

  // the streak forgives a short gap, restarts quietly after a long one
  const streaks = await ev(() => {
    const day = Math.floor(Date.now() / 864e5);
    const run = (last, streak) => {
      localStorage.setItem('curation.daily', JSON.stringify({ last: day - last, streak, best: streak, gift: 0, wheel: 0 }));
      return window.__daily.dailyState().streak;
    };
    return [run(1, 4), run(3, 4), run(9, 4)];
  });
  check(streaks[0] === 5 && streaks[1] === 5 && streaks[2] === 1, 'streak: +1 next day, kept over a short break, quietly restarts after a long one', `streaks ${streaks}`);
  const same = await ev(() => [window.__daily.paintingOfTheDay(100)?.id, window.__daily.paintingOfTheDay(100)?.id, window.__daily.paintingOfTheDay(101)?.id]);
  check(same[0] === same[1] && same[0] !== same[2], 'painting of the day is stable within a day and changes next day', 'painting of the day ' + same);

  // share: what goes in a code
  const snap = await ev(() => window.__share.snapshot('Test Museum'));
  check(snap.v === 1 && snap.n === 'Test Museum' && snap.r.length >= 1, 'snapshot has rooms', 'bad snapshot ' + JSON.stringify(snap));
  check(!/coin|gold|character|name":"[^T]/i.test(JSON.stringify(snap).replace(/Test Museum/g, '')), 'snapshot holds nothing personal', 'snapshot leaks: ' + JSON.stringify(snap));

  // a friend's museum: visiting never touches our own save
  const before = await ev(() => JSON.stringify(Object.keys(localStorage).filter((k) => k !== 'curation.friends' && k !== 'curation.daily').sort().map((k) => [k, localStorage.getItem(k)])));
  const friend = { v: 1, n: 'Ada’s Gallery', s: 72, r: [{ n: 'Front room', p: ['harvesters', 'no-such-painting'], d: { bench: 2, tree: 1 } }] };
  await ev(async (f) => window.__share.receive(f), JSON.stringify(friend));
  await page.waitForTimeout(400);
  check(await page.$eval('#visit', (e) => !e.classList.contains('hidden')), 'a pasted museum opens the visit view', 'visit view did not open');
  check((await page.$$eval('.visit-art', (n) => n.length)) === 2, 'both paintings listed (the unknown one gracefully)', 'wrong painting count');
  await page.screenshot({ path: path.join(OUT, 'visit.png') });
  await page.click('#visit .wide-btn');
  const after = await ev(() => JSON.stringify(Object.keys(localStorage).filter((k) => k !== 'curation.friends' && k !== 'curation.daily').sort().map((k) => [k, localStorage.getItem(k)])));
  check(before === after, 'visiting leaves your own save untouched', 'visit changed the save');
  check(await ev(() => JSON.parse(localStorage.getItem('curation.friends')).museums.length === 1), 'friend kept in the list', 'friend not kept');

  // the link route: ?visit=
  const link = await ev(async () => (await window.__share.takeIn(JSON.stringify({ v: 1, n: 'x', s: 1, r: [{ n: 'a', p: [], d: {} }] }))).kind);
  check(link === 'museum', 'raw map/visit json is classified', 'classify ' + link);
  const code = await ev(async () => (await window.__share.drawCard('card', window.__share.snapshot('T'))) !== undefined);
  check(code, 'rate card draws', 'card failed');
  const blobSize = await ev(async () => (await window.__share.drawCard('strip', window.__share.snapshot('T')))?.size || 0);
  check(blobSize > 1000, `tour strip draws (${blobSize} bytes)`, 'strip empty');

  // a friend's island
  const corners = Array.from({ length: 13 }, () => '2'.repeat(13));
  const isle = { format: 'curation-map', version: 2, name: 'Ada Isle', kind: 'island', w: 12, h: 12, corners, tiles: {}, objects: [] };
  await ev(async (m) => window.__share.receive(m), JSON.stringify(isle));
  check(await ev(() => JSON.parse(localStorage.getItem('curation.friends')).islands.some((m) => m.name === 'Ada Isle')), 'friend island saved', 'island not saved');
  await ev(() => ({ ...window.__share.receive('garbage') }) && 0);
  await page.waitForTimeout(300);
  check((await page.$eval('.share-note', (e) => e.textContent)).includes('isn’t a Curation'), 'garbage gets a kind message', 'no message for garbage');

  // the link in the address bar
  const code2 = await ev(async () => (await window.__share.takeIn(JSON.stringify({ v: 1, n: 'L', s: 5, r: [{ n: 'a', p: [], d: {} }] }))).visit.name);
  check(code2 === 'L', 'visit payload cleaned', 'visit payload');
  const { toCode } = await import(path.join(__dirname, '..', 'src', 'sharecode.js'));
  const c = await toCode({ v: 1, n: 'Via link', s: 40, r: [{ n: 'Hall', p: ['harvesters'], d: {} }] });
  await page.goto(URL + '?visit=' + c);
  await page.waitForTimeout(2500);
  check(await page.$eval('#visit', (e) => !e.classList.contains('hidden')) && (await page.url()).indexOf('visit=') < 0, 'opening a visit link shows the museum and cleans the address', 'link did not open the visit');

  check(errors.length === 0, 'no page errors', 'page errors: ' + errors.join(' | '));
  await browser.close();
}

(async () => {
  await nodeChecks();
  await browserChecks();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
