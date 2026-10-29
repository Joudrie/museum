// Guest conversations: engine, lines and gifts. Plain Node, no browser, no network.
// Usage: node tests/chatter.cjs
const path = require('path');
const root = path.join(__dirname, '..');
const load = (p) => import(path.join(root, p));
const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));

(async () => {
  const ch = await load('src/chatter.js');
  const L = await load('src/chatter_lines.js');
  const { PERSONALITIES } = await load('src/lines.js');
  const kinds = Object.keys(PERSONALITIES).filter((k) => !PERSONALITIES[k].staff);

  console.log('Lines');
  check(kinds.every((k) => (L.JOKES[k] || []).length >= 2 && L.JOKES[k].every((j) => j.say && j.button && j.punch)), `every visitor kind (${kinds.length}) has 2 or more jokes with a setup, a button and a punchline`, 'a kind is missing jokes: ' + kinds.filter((k) => !(L.JOKES[k] || []).length));
  check(kinds.every((k) => L.ASKS[k]?.includes('{by}')), 'every kind has a request that names the artist', 'a kind has no request');
  check(kinds.every((k) => (L.GIFTS[k] || []).some((g) => g.type === 'gold') && L.GIFTS[k].every((g) => g.say)), 'every kind can give gold and says something when it does', 'a kind has no gold gift');
  check(L.TIPS.length >= 5, `${L.TIPS.length} tips`, 'too few tips');
  const longest = Math.max(...[...L.TIPS, ...Object.values(L.ASKS), ...L.PLEASED, ...L.NOT_YET, ...Object.values(L.GIFTS).flat().map((g) => g.say), ...Object.values(L.JOKES).flat().flatMap((j) => [j.say, j.punch])].map((s) => s.length));
  check(longest <= 200, `longest line is ${longest} characters (fits the box)`, `a line is ${longest} characters`);

  console.log('Conversation');
  const finds = { mineral: [{ id: 'mineral:quartz', title: 'Quartz' }], fossil: [{ id: 'fossil:fern', title: 'Fern leaf' }] };
  const run = (o, choose) => {
    const g = ch.converse({ kind: 'nerd', name: 'Dennis', opener: 'Hello.', finds, rnd: () => 0.1, ...o });
    const seen = [];
    let r = g.next();
    let guard = 0;
    while (!r.done && guard++ < 60) {
      seen.push(r.value);
      r = g.next(r.value.type === 'hub' ? choose(r.value.choices) : undefined);
    }
    return { seen, ended: r.done };
  };
  const painting = { title: 'The Harvesters', by: 'Pieter Bruegel the Elder', year: '1565', blurb: 'Late summer: peasants cut wheat. One of six paintings; only five survive.' };
  const all = run({ painting, wantBy: 'Monet', hungBy: ['Monet'], giftOK: true, given: 0 }, (c) => c[0].id);
  check(all.ended, 'a conversation ends', 'a conversation never ended');
  const text = all.seen.map((s) => s.text).join(' | ');
  check(text.includes('Late summer: peasants cut wheat.') && text.includes('only five survive.'), 'the painting topic quotes the museum text, a sentence at a time', 'painting text missing: ' + text.slice(0, 120));
  check(all.seen.some((s) => s.type === 'gift' && s.gift.type), 'topics lead to a gift', 'no gift was offered');
  check(all.seen.filter((s) => s.type === 'gift').length === 1, 'at most one gift per conversation', 'more than one gift');
  const rich = all.seen.find((s) => s.type === 'gift').gift;
  const poor = run({ painting, wantBy: 'Monet', hungBy: [], giftOK: true, given: 0 }, (c) => c.find((x) => x.id === 'ask')?.id || 'bye').seen.find((s) => s.type === 'gift');
  check(!poor || poor.gift.type !== 'gold' || !rich || rich.type !== 'gold' || rich.n >= poor.gift.n, 'a visitor you pleased gives at least as much', 'pleased visitor gave less');
  check(!run({ painting, giftOK: false }, (c) => c[0].id).seen.some((s) => s.type === 'gift'), 'no gift if they already gave one today', 'gift despite giftOK=false');
  check(!run({ painting, giftOK: true }, () => 'bye').seen.some((s) => s.type === 'gift'), 'no gift if you said bye without talking', 'gift for nothing');
  const topics = run({ painting, giftOK: false }, (c) => c[0].id).seen.filter((s) => s.type === 'hub');
  check(topics.every((h, i) => i === 0 || h.choices.length < topics[i - 1].choices.length), 'each topic is offered once, then the list shrinks', 'topics repeated');
  const noPainting = run({ giftOK: false }, (c) => c[0].id).seen.find((s) => s.type === 'hub');
  check(!noPainting.choices.some((c) => c.id === 'painting'), 'no painting topic when nothing is hung nearby', 'painting topic with no painting');
  check(kinds.every((k) => run({ kind: k, painting, wantBy: 'Monet', hungBy: [], giftOK: true }, (c) => c[0].id).ended), 'every visitor kind completes a conversation', 'a kind got stuck');
  check(JSON.stringify(ch.sentences('One. Two! “Three” is next? Yes.')) === JSON.stringify(['One.', 'Two!', '“Three” is next?', 'Yes.']), 'sentences split cleanly', 'sentence split wrong');

  console.log('Gifts');
  check(ch.giftScale(0) === 1 && ch.giftScale(3) === 1 && ch.giftScale(4) === 0.5 && ch.giftScale(8) === 0.25, 'gifts shrink after the first few of the day (full, half, quarter)', 'giftScale wrong');
  const g = ch.giftFor({ kind: 'kid', rnd: () => 0.1, finds });
  check(g.type === 'find' && g.id === 'mineral:quartz', 'a kid gives a rock they found', 'kid gift wrong: ' + JSON.stringify(g));
  check(ch.giftFor({ kind: 'kid', rnd: () => 0.1, finds: {} }).type === 'gold', 'with no finds to give, a visitor gives gold instead', 'no fallback to gold');
  check(ch.giftFor({ kind: 'nerd', rnd: () => 0.9, scale: 0.25 }).n >= 1, 'gold is at least 1 even at a quarter', 'gold below 1');
  const mem = {};
  const store = { get: (k, d) => mem[k] ?? d, set: (k, v) => (mem[k] = v) };
  check(ch.giftStatus('Dennis', 'nerd', store, '2026-10-29').giftOK, 'a visitor has a gift on a fresh day', 'fresh visitor has no gift');
  ch.recordGift('Dennis', 'nerd', store, '2026-10-29');
  const st = ch.giftStatus('Dennis', 'nerd', store, '2026-10-29');
  check(!st.giftOK && st.given === 1, 'after giving, no more gifts from them that day', 'gift not recorded');
  check(ch.giftStatus('Priya', 'nerd', store, '2026-10-29').giftOK, 'others still can', 'others blocked');
  check(ch.giftStatus('Dennis', 'nerd', store, '2026-10-30').giftOK, 'a new day starts fresh', 'new day not fresh');

  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})();
