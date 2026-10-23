// Wall-gap check: counts void pixels between wall planes in every room shape
// (all orientations, sizes and endings) plus the entrance, main hall and break
// room. Any count above 0 is a black gap. Exit code 1 on gaps or page errors.
// Usage: PW=/path/to/playwright node tests/gaps.cjs (preview running on :4173)
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.env.URL || 'http://localhost:4173/';

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.route('https://upload.wikimedia.org/**', (r) => r.fulfill({ contentType: 'image/svg+xml', headers: { 'access-control-allow-origin': '*' }, body: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="6"/>' }));
  await p.goto(URL);
  await p.waitForTimeout(2000);
  const fixed = [{ orient: 'entry', size: 'fixed', exit: 'door-back' }, { orient: 'main', size: 'fixed', exit: 'door-back', arch: true }];
  const combos = [];
  for (const orient of ['vertical', 'horizontal', 'square'])
    for (const size of ['short', 'medium', 'long'])
      for (const exit of orient !== 'horizontal' ? ['door-back', 'door-left', 'door-right', 'stairs-up', 'stairs-down', 'none'] : ['door-back', 'door-end', 'stairs-up', 'stairs-down', 'none']) combos.push({ orient, size, exit });
  const runs = [['entrance', 0, null], ['main hall', 1, null], ['break room', 'break', null], ...combos.map((c) => [`${c.orient}/${c.size}/${c.exit}`, 2, c])];
  let bad = 0;
  for (const [label, room, c] of runs) {
    await p.evaluate(([room, c, fixed]) => {
      localStorage.setItem('curation.roomList', JSON.stringify(c ? [...fixed, c] : fixed));
      __game.scene.getScene('room').scene.restart({ room, spawn: 'entrance', instant: true });
    }, [room, c, fixed]);
    await p.waitForTimeout(700);
    const n = await p.evaluate(() => {
      const s = __game.scene.getScene('room');
      const g = s.g;
      const img = s.textures.get('walls').getSourceImage();
      const cv = document.createElement('canvas');
      cv.width = img.width;
      cv.height = img.height;
      const x = cv.getContext('2d');
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, cv.width, cv.height).data;
      const isVoid = (px, py) => {
        const i = (py * cv.width + px) * 4;
        return d[i] === 0x1d && d[i + 1] === 0x15 && d[i + 2] === 0x12 && d[i + 3] === 255;
      };
      let n = 0;
      const scan = (x0, x1, y0, y1, skipFloor) => {
        for (let py = Math.max(0, y0); py < Math.min(cv.height, y1); py++)
          for (let px = Math.max(0, x0); px < Math.min(cv.width, x1); px++) {
            if (skipFloor && px >= g.xL && px < g.xR && py >= g.y0) continue;
            if (isVoid(px, py)) n++;
          }
      };
      if (g.main) {
        scan(g.xL - g.D, g.xR + g.D, g.y0 - g.D, g.yf);
        scan(g.hx0 - g.D, g.hx1 + g.D, g.yf + 2, g.yh);
      } else scan(0, g.w, g.y0 - g.D, g.y1, true);
      return n;
    });
    if (n) {
      bad++;
      console.log(`✗ ${label}: ${n} void px`);
    }
  }
  console.log(bad ? `${bad} room shape(s) with gaps` : `No gaps in ${runs.length} room shapes`);
  if (errs.length) console.log(errs.join('\n'));
  await b.close();
  process.exit(bad || errs.length ? 1 : 0);
})();
