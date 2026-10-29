// Dig test: every dig kind opens, and brushing it clean pays out a find of the right collection.
// Usage: npm run build && npx vite preview --port 4173 --base / &  then  PW=playwright OUT=dir node tests/dig.cjs
const { chromium } = require(process.env.PW || 'playwright');
const fs = require('fs');
const URL = process.env.URL || 'http://localhost:4173/';
const OUT = process.env.OUT || 'dig-shots';
fs.mkdirSync(OUT, { recursive: true });
const problems = [];
const check = (c, good, bad) => (c ? console.log('  ✓ ' + good) : (problems.push(bad), console.log('  ✗ ' + bad)));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL);
  await page.waitForTimeout(1500);
  const kinds = { mineral: 'mineral', fossil: 'fossil', ruin: ['pottery', 'coin', 'arrowhead'], shore: 'shell', crater: 'meteorite' };
  for (const [kind, cols] of Object.entries(kinds)) {
    const r = await page.evaluate(async (kind) => {
      const dig = await import('/src/dig.js');
      const done = new Promise((res) => dig.startDig('test:' + kind, { collection: kind, onClose: res }));
      const h = document.querySelector('#dig .dig-canvas');
      return { open: dig.digOpen(), size: h.width };
    }, kind).catch((e) => ({ err: String(e) }));
    check(!r.err && r.open, `${kind}: dig patch opens`, `${kind}: ${r.err || 'did not open'}`);
    await page.screenshot({ path: `${OUT}/dig-${kind}.png` });
    await page.evaluate(() => document.querySelector('#dig .dig-close').click());
  }
  check(!errors.length, 'no page errors', 'page errors: ' + errors.join(' | '));
  await browser.close();
  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
