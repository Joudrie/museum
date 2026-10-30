// Turns saves into events. storage.js tells us about every save and the value it
// replaced; for the keys below we compare the two and emit what changed. Nothing
// else in the game had to change to be measured, and when another chat changes how
// a system works, its saves still describe what the player got.
import { get } from '../collections/index.js';
import { emit, isLogKey } from './events.js';

const parse = (raw, fallback) => {
  try {
    const v = JSON.parse(raw);
    return v === null || v === undefined ? fallback : v;
  } catch {
    return fallback;
  }
};
const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
const arr = (v) => (Array.isArray(v) ? v : []);
const num = (v, d = 0) => (Number.isFinite(v) ? v : d);
const newKeys = (a, b) => Object.keys(obj(b)).filter((k) => !(k in obj(a)));

// Codex thresholds that open tools (src/dig.js TOOLS, src/puzzles-hunt.js DETECTOR_NEED), read lazily
// so this file stays importable in Node.
let digInfo = null;
async function loadDigInfo() {
  try {
    const d = await import('../dig.js');
    const h = await import('../puzzles-hunt.js');
    digInfo = { tools: d.TOOLS, detector: h.DETECTOR_NEED, collections: Object.values(d.DIG_KINDS).flatMap((k) => k.collections) };
  } catch {
    digInfo = null;
  }
}

function codex(before, after) {
  const b = obj(before), a = obj(after);
  const bs = obj(b.seen), as = obj(a.seen);
  for (const [id, r] of Object.entries(as)) {
    const prev = bs[id];
    const n = num(r?.n) - num(prev?.n);
    const e = get(id);
    if (id.startsWith('visitor:')) continue; // meeting someone is its own event (famous_met)
    if (n > 0) emit('collect', { id, collection: e?.collection || id.split(':')[0], rarity: e?.rarity ?? 1, fresh: !prev, n });
    if (num(r?.restored) > num(prev?.restored)) emit('restored', { id });
  }
  for (const id of newKeys(b.claimed, a.claimed)) {
    if (id.startsWith('milestone-')) emit('milestone_claimed', { pct: Number(id.slice(10)) || id });
    else emit('set_claimed', { id });
  }
  const bsold = obj(b.sold), asold = obj(a.sold);
  for (const [id, r] of Object.entries(asold)) if (num(r?.n) > num(bsold[id]?.n)) emit('sold', { id });
  // tools opened by this change (different dug things found)
  if (digInfo) {
    const kinds = (s) => Object.keys(obj(s)).filter((id) => digInfo.collections.includes(id.split(':')[0])).length;
    const was = kinds(bs), now = kinds(as);
    Object.entries(digInfo.tools).forEach(([id, t]) => t.need > 0 && was < t.need && now >= t.need && emit('unlock', { what: `tool:${id}` }));
    if (was < digInfo.detector && now >= digInfo.detector) emit('unlock', { what: 'metal-detector' });
  }
}

// key → (before, after) handler. `before` is the parsed old value (or the fallback), `after` the new one.
const WATCH = {
  'curation.codex': codex,
  'curation.coins': (b, a) => {
    const delta = num(a, 0) - num(b, 300); // 300 = START_COINS in wallet.js (the value before the first save)
    if (delta) emit('coins', { delta, balance: num(a) });
  },
  'curation.quests': (b, a) => newKeys(obj(b).claimed, obj(a).claimed).forEach((id) => emit('goal_claimed', { id })),
  'curation.digs': (b, a) => Object.entries(obj(a)).forEach(([spot, t]) => num(t) > num(obj(b)[spot]) && emit('dig', { spot })),
  'curation.met': (b, a) => arr(a).filter((id) => !arr(b).includes(id)).forEach((id) => emit('famous_met', { id })),
  'curation.story': (b, a) => newKeys(obj(b).done, obj(a).done).forEach((id) => emit('story_beat', { id })),
  'curation.leads': (b, a) => newKeys(obj(b).found, obj(a).found).forEach((id) => emit('lead_found', { id })),
  'curation.expedition': (b, a) => Object.entries(obj(obj(a).done)).forEach(([id, n]) => num(n) > num(obj(obj(b).done)[id]) && emit('expedition_done', { id, n: num(n) })),
  'curation.daily': (b, a) => {
    const B = obj(b), A = obj(a);
    if (A.gift && A.gift !== B.gift) emit('daily_gift', { streak: num(A.streak) });
    if (A.wheel && A.wheel !== B.wheel) emit('wheel_spin', { gold: num(A.prize) });
  },
  'curation.digdaily': (b, a) => obj(a).paid && !(obj(b).paid && obj(b).day === obj(a).day) && emit('daily_dig_goal', {}),
  'curation.chatter': (b, a) => newKeys(obj(obj(b).day === obj(a).day ? b : {}).by, obj(a).by).forEach((by) => emit('guest_gift', { by: by.split('|')[1] || by })),
  'curation.regulars': (b, a) =>
    Object.entries(obj(a)).forEach(([id, r]) => num(r?.talks) > num(obj(b)[id]?.talks) && emit('talk', { kind: id.split('|')[1] || '', talks: num(r?.talks) })),
  'curation.roomList': (b, a) => arr(a).length > arr(b).length && emit('room_built', { rooms: arr(a).length }),
  'curation.items': (b, a) =>
    Object.entries(obj(a)).forEach(([room, list]) => {
      const n = arr(list).length - arr(obj(b)[room]).length;
      if (n > 0) emit('item_placed', { room: Number(room), n });
    }),
  'curation.display': (b, a) =>
    Object.entries(obj(a)).forEach(([d, list]) => {
      const n = arr(list).length - arr(obj(b)[d]).length;
      if (n > 0) emit('displayed', { fixture: d, n });
    }),
  'curation.office': (b, a) => num(a, 1) > num(b, 1) && emit('office_up', { level: num(a, 1) }),
  'curation.upgrades': (b, a) => Object.entries(obj(a)).forEach(([id, l]) => num(l) > num(obj(b)[id]) && emit('upgrade', { id, level: num(l) })),
  'curation.fog': (b, a) => {
    const n = Object.keys(obj(a)).length - Object.keys(obj(b)).length;
    if (n > 0) emit('fog_cleared', { n });
  },
};
export const WATCHED = Object.keys(WATCH);

// The progression layer's save (`curation.progress`, src/progression/store.js) is large and written after
// every reward, so its unlocks (rods, boats, gear, rooms) are compared with the last ones seen here instead
// of parsing the old save each time. Catches, talks and finds come from the layer's own bus (index.js).
let layerUnlocks = null;
function layerSaved(value) {
  const now = Object.keys(obj(obj(value).unlocks));
  if (layerUnlocks) now.filter((k) => !layerUnlocks.has(k)).forEach((what) => emit('unlock', { what }));
  layerUnlocks = new Set(now);
}

/** The listener for storage.onSave. */
export function onSaved(key, value, beforeRaw) {
  if (key === 'curation.progress') return layerSaved(value);
  if (isLogKey(key) || !WATCH[key]) return;
  // A key's first save is the game setting itself up (the codex migrating older keys, a new museum's rooms
  // and its two potted trees), not something the player just did.
  if (beforeRaw === null && (key === 'curation.codex' || key === 'curation.roomList' || key === 'curation.items')) return;
  WATCH[key](parse(beforeRaw, undefined), value);
}

export function startDeriving(onSave) {
  loadDigInfo();
  onSave(onSaved);
}
