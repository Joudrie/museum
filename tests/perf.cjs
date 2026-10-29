// Phone performance measurements. Not a pass/fail test by default: it prints frame
// times for the busiest scenes with the CPU slowed (default 4x, about a mid-range
// phone), and exits 1 only when a number goes over a budget (see docs/HANDOFF.md).
// Usage: npm run build && npx vite preview --port 4173 --base / &
//        PW=/opt/node-tools/node_modules/playwright node tests/perf.cjs
// Env: URL, SLOW (cpu throttle, default 4), SECS (sample length, default 4), ONLY (substring of a scenario name)
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/';
const SLOW = Number(process.env.SLOW || 4);
const SECS = Number(process.env.SECS || 4);
const BUDGET_MS = 18; // default; islands have their own, below (they hold 1,000 to 5,000 objects)
const ISLAND_BUDGET = 24;
const HUGE_BUDGET = 45;
const budgetOf = (name) => (/\d{3}x\d{3}/.test(name) ? HUGE_BUDGET : /Island/.test(name) ? ISLAND_BUDGET : BUDGET_MS);
// // JS time per frame at the throttle (headless has no real GPU, so the native part is left out). 16 ms at 4x slowdown leaves a phone room for its GPU inside a 33 ms frame
const STRICT = !!process.env.STRICT;

// A synthetic builder island: grass in the middle, sea around, trees, people and animals scattered.
const bigIsland = (n, people, density = 0.04) => {
  const corners = Array.from({ length: n + 1 }, (_, y) => Array.from({ length: n + 1 }, (_, x) => (x < 3 || y < 3 || x > n - 3 || y > n - 3 ? 0 : 2)));
  const objects = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n * n * density; i++) objects.push({ ref: 't:oak_tree', x: Math.floor(rnd() * (n - 8) + 4) * 32, y: Math.floor(rnd() * (n - 8) + 4) * 32 });
  for (let i = 0; i < people; i++) objects.push({ ref: i % 3 ? 't:person_wander' : 't:person_roam', x: Math.floor(rnd() * (n - 8) + 4) * 32, y: Math.floor(rnd() * (n - 8) + 4) * 32 });
  return { format: 'curation-map', version: 2, tile: 32, name: 'Perf', kind: 'island', w: n, h: n, corners, tiles: {}, objects };
};

const scenarios = [
  { name: 'entrance room, lights high, night', query: '?hour=21', lights: 'high', go: "__game.scene.getScene('room').travel(0, 'entrance', true)" },
  { name: 'entrance room, lights low, night', query: '?hour=21', lights: 'low', go: "__game.scene.getScene('room').travel(0, 'entrance', true)" },
  { name: 'entrance room, lights off', query: '?hour=21', lights: 'off', go: "__game.scene.getScene('room').travel(0, 'entrance', true)" },
  { name: 'main hall, day', query: '?hour=13', lights: 'high', go: "__game.scene.getScene('room').travel(1, 'entrance', true)" },
  { name: 'main hall, night, lights high', query: '?hour=21', lights: 'high', go: "__game.scene.getScene('room').travel(1, 'entrance', true)" },
  { name: 'main hall + 40 extra visitors', query: '?hour=13', lights: 'high', go: "__game.scene.getScene('room').travel(1, 'entrance', true)", after: "{ const s = __game.scene.getScene('room'); for (let i = 0; i < 40; i++) s.npcs.push(s.spawnVisitor(100 + i)); }" },
  { name: 'Main Island (80x80), day', query: '?hour=13', lights: 'high', island: { map: 'main' } },
  { name: 'Main Island, night, lights high', query: '?hour=22', lights: 'high', island: { map: 'main' } },
  { name: 'Main Island, night, lights off', query: '?hour=22', lights: 'off', island: { map: 'main' } },
  { name: 'island 300x300, 60 people', query: '?hour=13', lights: 'high', play: bigIsland(300, 60) },
  { name: 'island 300x300, 300 people', query: '?hour=13', lights: 'high', play: bigIsland(300, 300) },
  { name: 'island 700x700, 100 people, 4900 trees', query: '?hour=13', lights: 'high', play: bigIsland(700, 100, 0.01) },
];

(async () => {
  const b = await chromium.launch();
  const rows = [];
  for (const sc of scenarios) {
    if (process.env.ONLY && !sc.name.includes(process.env.ONLY)) continue;
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.route('https://upload.wikimedia.org/**', (r) => r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="60"><rect width="80" height="60" fill="#6b8e3a"/></svg>' }));
    await p.addInitScript(([lights, play]) => {
      if (!localStorage.getItem('__perf_init')) {
        localStorage.setItem('__perf_init', '1');
        localStorage.setItem('curation.settings', JSON.stringify({ lights }));
        if (play) localStorage.setItem('curation.playtest', JSON.stringify(play));
      }
    }, [sc.lights, sc.play || null]);
    await p.goto(URL + (sc.play ? (sc.query ? sc.query + '&play=1' : '?play=1') : sc.query || ''));
    await p.waitForTimeout(3500);
    if (sc.go) await p.evaluate(`{ ${sc.go}; }`);
    if (sc.island) await p.evaluate((d) => { __game.scene.getScene('room').scene.stop(); __game.scene.start('island', d); }, sc.island);
    await p.waitForTimeout(sc.play ? 6000 : 2500);
    if (sc.after) await p.evaluate(sc.after);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: SLOW });
    await p.waitForTimeout(1000);
    // walk around while sampling, so streaming and collisions are in the numbers
    await p.evaluate(() => { window.__steps = []; const l = __game.loop; const cb = l.callback; l.callback = (t, d) => { const a = performance.now(); cb(t, d); window.__steps.push(performance.now() - a); }; });
    await cdp.send('Profiler.enable');
    await cdp.send('Profiler.start');
    await p.keyboard.down('d');
    const r = await p.evaluate((ms) => new Promise((done) => {
      const t = [];
      let last = performance.now();
      const end = last + ms;
      const tick = (now) => {
        t.push(now - last);
        last = now;
        if (now < end) requestAnimationFrame(tick);
        else {
          t.shift();
          t.sort((a, c) => a - c);
          const sum = t.reduce((a, c) => a + c, 0);
          const objs = (() => { const s = __game.scene.getScenes(true)[0]; return s?.children?.length ?? 0; })();
          done({ fps: Math.round((1000 * t.length) / sum), p50: Math.round(t[Math.floor(t.length * 0.5)]), p95: Math.round(t[Math.floor(t.length * 0.95)]), max: Math.round(t[t.length - 1]), objs });
        }
      };
      requestAnimationFrame(tick);
    }), SECS * 1000);
    // JS cost per frame = sampled time that is not "(program)" (native/GPU waits, which headless software GL inflates) or idle
    const { profile } = await cdp.send('Profiler.stop');
    const byId = {};
    profile.nodes.forEach((nd) => (byId[nd.id] = nd.callFrame.functionName));
    let jsUs = 0;
    profile.samples.forEach((id, i) => { if (!['(program)', '(idle)', '(root)'].includes(byId[id])) jsUs += profile.timeDeltas[i]; });
    const st = await p.evaluate(() => { const a = window.__steps.slice(2).sort((x, y) => x - y); return a.length ? { s50: a[Math.floor(a.length * 0.5)], s95: a[Math.floor(a.length * 0.95)] } : { s50: 0, s95: 0 }; });
    await p.keyboard.up('d');
    Object.assign(r, { js: Math.round((jsUs / 1000 / Math.max(1, r.fps * SECS)) * 10) / 10, s50: Math.round(st.s50 * 10) / 10, s95: Math.round(st.s95 * 10) / 10 });
    rows.push({ name: sc.name, ...r, errs: errs.length });
    console.log(`${sc.name.padEnd(40)} ${String(r.fps).padStart(3)} fps  p50 ${String(r.p50).padStart(3)} ms  p95 ${String(r.p95).padStart(3)} ms  max ${String(r.max).padStart(4)} ms  | JS ms/frame ${String(r.js).padStart(5)} | game step p50 ${String(r.s50).padStart(5)} p95 ${String(r.s95).padStart(5)} ms  objects ${r.objs}${errs.length ? '  ERRORS ' + errs[0] : ''}`);
    await ctx.close();
  }
  await b.close();
  const over = rows.filter((r) => r.js > budgetOf(r.name));
  console.log(over.length ? `\n${over.length} scenario(s) over their JS ms/frame budget (rooms ${BUDGET_MS}, islands ${ISLAND_BUDGET}, huge ${HUGE_BUDGET}) at ${SLOW}x slowdown` : `\nAll within budget (rooms ${BUDGET_MS}, islands ${ISLAND_BUDGET}, huge ${HUGE_BUDGET} ms JS/frame) at ${SLOW}x slowdown`);
  if (STRICT && over.length) process.exit(1);
})();
