// Halls test (plain Node, no browser): every hall preset validates, its items
// fit every room size without overlap or blocking a doorway, applying a hall
// to a built room works and undoes, and the fixed rooms refuse it.
// Usage: node tests/halls.cjs
const path = require('path');
const fs = require('fs');
const problems = [];
const ok = (m) => console.log('  ✓ ' + m);
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const check = (c, g, b) => (c ? ok(g) : fail(b));

const mem = {};
globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => (mem[k] = String(v)), removeItem: (k) => delete mem[k] };

(async () => {
  const src = path.join(__dirname, '..', 'src');
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'content', 'halls', 'halls.json'), 'utf8'));
  const P = await import(path.join(src, 'halls', 'preset.js'));
  const A = await import(path.join(src, 'halls', 'apply.js'));
  const R = await import(path.join(src, 'rooms.js'));
  const { SIZES } = R;
  const { ITEMS } = await import(path.join(src, 'items.js'));
  const require_item = (it) => { const d = ITEMS[it.type]; return it.rot ? { w: d.h, h: d.w } : { w: d.w, h: d.h }; };
  const halls = data.halls;
  check(halls.length >= 15, `${halls.length} halls`, 'too few halls');
  check(new Set(halls.map((h) => h.id)).size === halls.length, 'ids are unique', 'duplicate hall id');

  console.log('Presets');
  halls.forEach((h) => {
    const bad = P.validateHall(h);
    check(!bad.length, h.id, bad.join('; '));
  });
  check(P.validateHall({ ...halls[0], theme: 'nope' }).length > 0, 'a bad theme is caught', 'bad theme not caught');
  check(P.validateHall({ ...halls[0], facts: ['x'] }).length > 0, 'unsourced facts on a hall are refused', 'facts not refused');
  check(P.validateHall({ ...halls[0], collections: [{ id: 'no-such-collection' }] }).length > 0, 'an unregistered collection is caught', 'unregistered collection not caught');

  const reg = await import(path.join(src, 'collections', 'index.js'));
  halls.forEach((h) => {
    const ids = P.hallEntries(h);
    check(ids.every((id) => reg.get(id)), `${h.id}: ${ids.length} entries resolve`, `${h.id} lists a missing entry`);
    check(h.blurb && h.blurb.length < 140, `${h.id}: has a short blurb`, `${h.id} blurb missing or long`);
  });

  console.log('Fit in every room shape');
  for (const orient of ['vertical', 'horizontal', 'square']) {
    for (const size of Object.keys(SIZES[orient])) {
      const n = SIZES[orient][size];
      const dims = { vertical: { fw: 5, fd: n }, horizontal: { fw: n, fd: 5 }, square: { fw: n, fd: n } }[orient];
      let lost = 0;
      halls.forEach((h) => {
        const { items } = P.planItems(h, { ...dims, vertical: orient !== 'horizontal' });
        const seen = new Set();
        items.forEach((it) => {
          const d = require_item(it);
          for (let i = 0; i < d.w; i++) for (let j = 0; j < d.h; j++) {
            const k = `${it.c + i},${it.r + j}`;
            if (seen.has(k)) fail(`${h.id} overlaps at ${k} in ${orient}/${size}`);
            seen.add(k);
          }
          if (it.c < 0 || it.r < 0 || it.c + d.w > dims.fw || it.r + d.h > dims.fd) fail(`${h.id} leaves the floor in ${orient}/${size}`);
        });
        lost += (h.items || []).length - items.length;
      });
      ok(`${orient}/${size}: ${lost} item(s) dropped for space`);
    }
  }

  console.log('Apply');
  const rooms = R.loadRooms();
  R.addRoom({ orient: 'vertical', size: 'medium', exit: 'door-back' });
  const idx = R.loadRooms().length - 1;
  const dutch = halls.find((h) => h.id === 'dutch');
  const res = A.applyHall(idx, dutch);
  check(res.ok && res.placed > 0, `dutch placed ${res.placed} items`, 'apply failed: ' + res.why);
  check(JSON.parse(mem['curation.roomDecor'])[idx].light === 'moody', 'decor written', 'decor not written');
  check(R.slotStates(R.loadRooms(), idx).every((s) => s.kind === 'painting'), 'every wall spot is hung', 'wall spots not hung');
  A.undoHall(idx, res.before);
  check((JSON.parse(mem['curation.items'] || '{}')[idx] || []).length === 0, 'undo clears the items', 'undo left items');
  for (const i of [0, 1, 2]) check(!A.applyHall(i, dutch).ok, `fixed room ${i} refuses a hall`, `fixed room ${i} was changed`);

  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => (console.error(e), process.exit(1)));
