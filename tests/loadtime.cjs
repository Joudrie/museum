// First load and map transitions, measured the way a phone sees them: a cold cache, a slower
// network and a CPU slowed down (a mid-range phone is about 4x slower than this machine).
// Prints medians; not a pass/fail test (compare two builds by running it on each).
//   PW=/path/to/playwright URL=http://localhost:4173/ node tests/loadtime.cjs
//   CPU=4 (slowdown)   NET=lte | 3g | none   RUNS=3   DWELL=12000 (ms spent in the museum before walking out)
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/';
const CPU = Number(process.env.CPU || 4);
const NET = process.env.NET || 'lte';
const RUNS = Number(process.env.RUNS || 3);
const DWELL = Number(process.env.DWELL || 12000); // a player looks round the museum for a while before the first walk outside
const PROFILES = {
  lte: { latency: 70, downloadThroughput: (12 * 1024 * 1024) / 8, uploadThroughput: (5 * 1024 * 1024) / 8 },
  '3g': { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (0.75 * 1024 * 1024) / 8 },
};
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

async function once(browser) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.route('https://upload.wikimedia.org/**', (r) => r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#6b8e3a"/></svg>' }));
  const cdp = await ctx.newCDPSession(page);
  if (PROFILES[NET]) await cdp.send('Network.emulateNetworkConditions', { offline: false, ...PROFILES[NET] });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  // note when the first scene is up and when the splash (if the page has one) is gone
  await page.addInitScript(() => {
    window.__t = {};
    const tick = () => {
      const now = performance.now();
      if (!window.__t.scene && window.__game?.scene.getScenes(true).length) window.__t.scene = now;
      if (window.__t.scene && !window.__t.shown && !document.getElementById('splash')) window.__t.shown = now;
      if (!window.__t.shown) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await page.goto(URL, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__t?.scene, null, { timeout: 120000 });
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
    const res = performance.getEntriesByType('resource');
    const t = window.__t;
    return { fcp, scene: t.scene, shown: t.shown || t.scene + 100, requests: res.length + 1, kb: Math.round(res.reduce((a, e) => a + (e.transferSize || 0), 0) / 1024) };
  });
  // map transitions, warm: museum -> island, island -> museum, island -> another island
  const go = (to, data) =>
    page.evaluate(
      async ([key, d]) => {
        const g = __game;
        const from = g.scene.getScenes(true)[0];
        const stale = g.scene.getScene(key).player; // (the scene object is reused: a new visit makes a new player)
        const t0 = performance.now();
        from.scene.start(key, d);
        await new Promise((res) => {
          const poll = () => {
            const s = g.scene.getScene(key);
            if (s.sys.isActive() && s.player && s.player !== stale && s.player.active) requestAnimationFrame(() => requestAnimationFrame(res));
            else requestAnimationFrame(poll);
          };
          poll();
        });
        return performance.now() - t0;
      },
      [to, data],
    );
  await page.waitForTimeout(DWELL);
  r.toIsland = await go('island', { map: 'main' });
  await page.waitForTimeout(1500);
  r.toMuseum = await go('room', { room: 0, spawn: 'outside' });
  await page.waitForTimeout(1500);
  await go('island', { map: 'main' });
  await page.waitForTimeout(1500);
  r.toFarIsle = await go('island', { map: 'isle-1' });
  await ctx.close();
  return r;
}

(async () => {
  const browser = await chromium.launch();
  const runs = [];
  for (let i = 0; i < RUNS; i++) runs.push(await once(browser));
  await browser.close();
  const m = (k) => Math.round(median(runs.map((r) => r[k])));
  console.log(`${URL}  (CPU x${CPU}, network ${NET}, ${RUNS} cold runs, medians)`);
  console.log(`  first paint            ${m('fcp')} ms`);
  console.log(`  first scene running    ${m('scene')} ms`);
  console.log(`  game visible           ${m('shown')} ms`);
  console.log(`  requests / transferred ${m('requests')} / ${m('kb')} KB`);
  console.log(`  museum -> island       ${m('toIsland')} ms`);
  console.log(`  island -> museum       ${m('toMuseum')} ms`);
  console.log(`  island -> far isle     ${m('toFarIsle')} ms`);
})();
