// People and story test. Plain Node, no browser. Checks the story data is well-formed and that
// every claim carries its quote. With --live it also fetches each source page and checks the
// quote is really there (needs network; museum and Wikipedia hosts).
// Usage: node tests/people.cjs [--live]
const path = require('path');
const root = path.join(__dirname, '..');
const load = (p) => import(path.join(root, p));
const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));
const norm = (s) => s.replace(/\s+/g, ' ').replace(/[“”]/g, '"').replace(/[’]/g, "'").trim();
const FILLER = /masterpiece|iconic|famous|renowned|stunning|breathtaking|beautiful|magnificent|timeless|genius|legendary|world-class|extraordinary/i;

(async () => {
  global.localStorage = { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); } };
  const { HEIST } = await load('src/stories/heist.js');
  const { CHAINS } = await load('src/stories/chains.js');
  const { FAMOUS } = await load('src/famous.js');
  const S = await load('src/story.js');
  const claims = []; // { id, text, quote, source }

  console.log('Heist arc');
  check(HEIST.beats.length >= 5, `${HEIST.beats.length} chapters`, 'heist needs 5 chapters');
  const ids = new Set();
  for (const b of HEIST.beats) {
    check(!ids.has(b.id), `${b.id} unique`, `${b.id} duplicated`);
    ids.add(b.id);
    check(b.quote && b.quote.length > 40, `${b.id} has a quote`, `${b.id} has no quote`);
    check(b.line.length <= 260, `${b.id} line fits the box (${b.line.length})`, `${b.id} line too long (${b.line.length})`);
    check(!FILLER.test(b.line), `${b.id} no filler words`, `${b.id} uses a filler word`);
    claims.push({ id: b.id, text: b.line, quote: b.quote, source: HEIST.source.url });
  }
  check(HEIST.beats.some((b) => b.lead?.id), 'finale hands out an expedition lead', 'finale has no lead hook');

  console.log('Visitor chains');
  for (const [vid, ch] of Object.entries(CHAINS)) {
    check(!!FAMOUS[vid], `${vid} is a real famous visitor`, `${vid} is not in FAMOUS`);
    check(ch.steps.length === 3, `${vid} has 3 steps`, `${vid} does not have 3 steps`);
    for (const st of ch.steps) {
      check(!ids.has(st.id), `${st.id} unique`, `${st.id} duplicated`);
      ids.add(st.id);
      check(st.fact?.quote && st.fact?.source, `${st.id} fact has quote and source`, `${st.id} fact lacks quote or source`);
      check(st.say.length <= 260, `${st.id} line fits (${st.say.length})`, `${st.id} line too long`);
      check(!FILLER.test(st.say + st.fact.text), `${st.id} no filler words`, `${st.id} uses a filler word`);
      claims.push({ id: st.id, text: st.fact.text + ' ' + st.say, quote: st.fact.quote, source: st.fact.source });
    }
    check(ch.steps[2].lead?.id, `${vid} last step offers a lead`, `${vid} has no lead hook`);
  }

  console.log('Numbers come from the quotes');
  for (const c of claims) {
    const nums = (c.text.match(/\b\d[\d,.:]*\b/g) || []).map((n) => n.replace(/[.,:]$/, ''));
    const q = norm(c.quote);
    const bad = nums.filter((n) => !q.includes(n));
    check(!bad.length, `${c.id} numbers sourced`, `${c.id}: ${bad.join(', ')} not in the quote`);
  }

  console.log('Engine');
  const ctx0 = { met: 0, metIds: [], hungBy: [] };
  check(S.heistBeat(ctx0) === null, 'nothing told before the first visitor', 'beat told too early');
  const ctx1 = { met: 1, metIds: ['vermeer'], hungBy: [] };
  const b1 = S.heistBeat(ctx1);
  check(b1?.id === 'heist1', 'chapter 1 unlocks', 'chapter 1 did not unlock');
  S.complete(b1, 'caretaker');
  check(S.heistBeat(ctx1)?.id === 'heist2', 'chapters go in order', 'order broken');
  check(S.heistBeat({ ...ctx1, met: 1, metIds: [] }) === null, 'chapter 2 waits for Vermeer', 'chapter 2 unlocked without Vermeer');
  check(S.complete(b1, 'caretaker') === 0, 'a chapter pays once', 'chapter paid twice');
  const last = HEIST.beats.at(-1);
  S.complete(last, 'caretaker');
  const leads = S.leadsOffered();
  check(leads.length === 1 && leads[0].id === last.lead.id, 'lead recorded for expeditions', 'lead missing');
  S.complete(last, 'caretaker');
  check(S.leadsOffered().length === 1, 'lead offered once', 'lead duplicated');
  global.localStorage._d['curation.story'] = '{broken';
  check(S.storyDone() === 0, 'corrupt story save falls back to empty', 'corrupt save crashed');

  if (process.argv.includes('--live')) {
    console.log('Live quote check');
    const cache = {};
    for (const c of claims) {
      if (!cache[c.source]) {
        const wp = c.source.includes('wikipedia');
        const url = wp ? `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&format=json&titles=${c.source.split('/wiki/')[1]}` : c.source;
        const res = await fetch(url, { headers: { 'User-Agent': 'curation-content-tool/1.0' } });
        const body = await res.text();
        cache[c.source] = norm(wp ? Object.values(JSON.parse(body).query.pages)[0].extract : body.replace(/<[^>]+>/g, ' '));
      }
      const parts = norm(c.quote).split(/(?<=[.])\s+(?=[A-Z])/);
      const miss = parts.filter((p) => !cache[c.source].includes(p.replace(/[.]$/, '')));
      check(!miss.length, `${c.id} quote found at source`, `${c.id} quote not found: ${miss[0]}`);
    }
  }

  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
