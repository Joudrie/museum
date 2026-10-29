// Guest conversations: the engine behind "talking to a visitor is worth it".
// A conversation is a generator. Each yield is something to show:
//   { type: 'line', text, button? }   a line (tap to go on, or tap the button)
//   { type: 'hub', text, choices }    pick a topic; send the choice id back in with .next(id)
//   { type: 'gift', text, gift }      a gift (the caller hands it over)
// Topics: about the painting they are standing by (true, from the museum's own text),
// something funny, a tip, and sometimes a request ("do you have a Monet?").
// A visitor gives at most one gift a day, and gifts shrink after the first few.
import { JOKES, TIPS, ASKS, PLEASED, NOT_YET, GIFTS, FAREWELL, HUB_FIRST, HUB_AGAIN } from './chatter_lines.js';

export const GIFT_FULL = 4; // gifts a day at full size; then half, then a quarter
export const GIFT_CHANCE = 0.55;
const pick = (list, rnd) => list[Math.floor(rnd() * list.length) % list.length];
// `mood` is a little picture over the speaker's head as the line starts (an emote id: src/emotes.js)
const line = (text, button, mood) => ({ type: 'line', text, ...(button && { button }), ...(mood && { mood }) });

export const sentences = (s) => String(s || '').split(/(?<=[.!?])\s+(?=[A-Z“"])/).map((x) => x.trim()).filter(Boolean);

function topics(o, rnd) {
  const t = [];
  const p = o.painting;
  if (p?.blurb || p?.title) {
    t.push({
      id: 'painting',
      label: 'About this painting',
      *run() {
        const s = sentences(p.blurb);
        yield line(`${p.title}${p.by ? `, by ${p.by}` : ''}${p.year ? `, ${p.year}` : ''}.`, s.length ? 'Tell me more' : null, 'sparkle');
        for (let i = 0; i < s.length; i++) yield line(s[i], i < s.length - 1 ? 'And?' : null);
      },
    });
  }
  t.push({
    id: 'funny',
    label: 'Tell me something funny',
    *run() {
      const j = pick(JOKES[o.kind] || JOKES.casual, rnd);
      yield line(j.say, j.button);
      yield line(j.punch, null, 'smile');
    },
  });
  t.push({ id: 'tip', label: 'Heard anything?', *run() { yield line(pick(TIPS, rnd), null, 'bang'); } });
  if (o.wantBy && ASKS[o.kind]) {
    t.push({
      id: 'ask',
      label: 'What are you looking for?',
      *run() {
        const has = (o.hungBy || []).includes(o.wantBy);
        yield line(ASKS[o.kind].replace('{by}', o.wantBy), has ? 'Look around' : 'Not yet', 'q');
        if (has) {
          yield line(pick(PLEASED, rnd), null, 'heart');
          return { pleased: true };
        }
        yield line(pick(NOT_YET, rnd), null, 'dots');
      },
    });
  }
  return t;
}

export function giftFor({ kind, rnd = Math.random, scale = 1, bonus = 1, finds = {} }) {
  const options = GIFTS[kind] || GIFTS.casual;
  let g = pick(options, rnd);
  if (g.type === 'find' && !finds[g.pool]?.length) g = options.find((x) => x.type === 'gold') || g;
  if (g.type === 'find') {
    const f = pick(finds[g.pool], rnd);
    return { type: 'find', id: f.id, title: f.title, say: g.say };
  }
  const n = Math.max(1, Math.round((12 + rnd() * 24) * bonus * scale));
  return { type: 'gold', n, say: g.say };
}

export const giftScale = (given) => (given < GIFT_FULL ? 1 : given < GIFT_FULL * 2 ? 0.5 : 0.25);

/**
 * o: { kind, name, opener, painting?, hungBy?, wantBy?, giftOK, given, finds, rnd }
 * `giftOK`: this visitor hasn't given a gift today. `given`: gifts handed out so far today.
 * Returns the generator; the caller sends the hub choice back in.
 */
export function* converse(o) {
  const rnd = o.rnd || Math.random;
  yield line(o.opener, null, o.openerMood || 'smile');
  const all = topics(o, rnd);
  const used = new Set();
  let pleased = false;
  while (all.some((t) => !used.has(t.id))) {
    const open = all.filter((t) => !used.has(t.id));
    const choice = yield {
      type: 'hub',
      text: pick(used.size ? HUB_AGAIN : HUB_FIRST, rnd),
      choices: [...open.map((t) => ({ id: t.id, label: t.label })), { id: 'bye', label: 'Bye!' }],
    };
    if (choice === 'bye') break;
    const t = open.find((x) => x.id === choice);
    if (!t) break;
    used.add(t.id);
    const res = yield* t.run();
    if (res?.pleased) pleased = true;
  }
  if (o.giftOK && used.size && (pleased || rnd() < GIFT_CHANCE)) {
    const gift = giftFor({ kind: o.kind, rnd, scale: giftScale(o.given || 0), bonus: pleased ? 2 : 1, finds: o.finds });
    yield { type: 'gift', text: gift.say, gift, mood: 'star' };
  }
  yield line(pick(FAREWELL[o.kind] || FAREWELL.default, rnd), null, 'note');
}

// ---------- the day's gifts (saved) ----------
const KEY = 'curation.chatter'; // { day, given, by: { "Dennis|nerd": true } }
const today = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const read = (store, day) => {
  const s = store.get(KEY, null);
  return s && s.day === day ? s : { day, given: 0, by: {} };
};
export function giftStatus(name, kind, store, day = today()) {
  const s = read(store, day);
  return { giftOK: !s.by[`${name}|${kind}`], given: s.given };
}
export function recordGift(name, kind, store, day = today()) {
  const s = read(store, day);
  s.by[`${name}|${kind}`] = true;
  s.given += 1;
  store.set(KEY, s);
}
