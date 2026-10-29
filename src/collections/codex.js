// The codex: everything you have ever collected (it stays stamped even if you
// sell the piece) plus what you hold right now. One versioned save key.
//
//   curation.codex = {
//     v: 1,
//     seen:    { [entryId]: { n, first, best? } },  // ever collected
//     owned:   { [entryId]: count },                // held now (collections with ownership 'earned')
//     claimed: { [setId]: true },                   // set rewards already paid
//     dirty:   { [entryId]: count },                // of those held, how many still need cleaning (finds with `dirty: true`)
//   }
//
// A collection with ownership 'all' (paintings, for now) is held from the
// start; the codex still records the first time each piece was hung.
import { load, save } from '../storage.js';
import { collection, collectionOf, get, getSet, list, sets } from './index.js';

export const CODEX_KEY = 'curation.codex';
const ID = /^[a-z0-9-]+:[a-z0-9_-]+$/;
const num = (v, min = 0) => (Number.isFinite(v) && v >= min ? v : undefined);

/** Turns whatever was saved into a valid codex. Junk is dropped, real progress is kept. */
export function normalize(raw) {
  const out = { v: 1, seen: {}, owned: {}, claimed: {}, dirty: {} };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  Object.entries(raw.seen && typeof raw.seen === 'object' ? raw.seen : {}).forEach(([id, r]) => {
    if (!ID.test(id) || !r || typeof r !== 'object') return;
    const n = Math.floor(num(r.n, 1) ?? 1);
    out.seen[id] = { n, first: num(r.first) ?? 0, ...(num(r.best, 0.0001) && { best: r.best }) };
  });
  Object.entries(raw.owned && typeof raw.owned === 'object' ? raw.owned : {}).forEach(([id, n]) => {
    if (ID.test(id) && num(n, 1)) out.owned[id] = Math.floor(n);
  });
  Object.entries(raw.dirty && typeof raw.dirty === 'object' ? raw.dirty : {}).forEach(([id, n]) => {
    if (ID.test(id) && num(n, 1) && out.owned[id]) out.dirty[id] = Math.min(Math.floor(n), out.owned[id]);
  });
  Object.entries(raw.claimed && typeof raw.claimed === 'object' ? raw.claimed : {}).forEach(([id, v]) => {
    if (v === true && typeof id === 'string') out.claimed[id] = true;
  });
  return out;
}

/** Builds a first codex out of what older versions saved. `read(key)` returns parsed JSON or null. */
export function migrate(read) {
  const c = normalize(null);
  const asObj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  // fish and finds: { caught: { minnow: { n, best } } }
  Object.entries(asObj(asObj(read('curation.fishing')).caught)).forEach(([slug, r]) => {
    const e = get('fish', slug) || get('find', slug);
    if (!e || e.collectable === false) return;
    const n = Math.floor(num(r?.n, 1) ?? 1);
    c.seen[e.id] = { n, first: 0, ...(num(r?.best, 0.0001) && { best: r.best }) };
    c.owned[e.id] = n;
  });
  // famous visitors met: ['vangogh', …]
  const met = read('curation.met');
  (Array.isArray(met) ? met : []).forEach((id) => {
    if (typeof id === 'string' && /^[a-z0-9_-]+$/.test(id)) c.seen[`visitor:${id}`] = { n: 1, first: 0 };
  });
  // paintings hung on purpose: { roomIndex: { 'wall:u': { kind: 'painting', id } } }
  Object.values(asObj(read('curation.slots'))).forEach((room) =>
    Object.values(asObj(room)).forEach((s) => {
      const e = s?.kind === 'painting' && get('painting', s.id);
      if (e) c.seen[e.id] = c.seen[e.id] || { n: 1, first: 0 };
    }),
  );
  return c;
}

const readLS = (key) => load(key, null);

/** The current codex. Reads fresh each time so it can't go stale; it is small. */
export function snapshot() {
  const raw = load(CODEX_KEY, null);
  if (raw === null) {
    const c = migrate(readLS);
    save(CODEX_KEY, c);
    return c;
  }
  return normalize(raw);
}
const put = (c) => save(CODEX_KEY, c);

export const seen = (id, c = snapshot()) => !!c.seen[id];

/** How many you hold now. Collections that start owned report 1 for every entry. */
export function ownedCount(id, c = snapshot()) {
  const e = get(id);
  if (e && collectionOf(e)?.ownership === 'all') return 1;
  return c.owned[id] || 0;
}

/** Entries of a collection that have ever been collected. */
export function count(collectionId, c = snapshot()) {
  return list({ collection: collectionId }).filter((e) => c.seen[e.id]).length;
}

/**
 * Records getting something. `size` (optional) tracks a personal best.
 * Returns { fresh, n, best, improved } or null for junk that is never kept.
 */
export function collect(id, { size, qty = 1, at = Date.now(), dirty = false } = {}) {
  const e = get(id);
  if (e && e.collectable === false) return null;
  if (!ID.test(id)) return null;
  const c = snapshot();
  const prev = c.seen[id];
  const best = Math.max(prev?.best || 0, size || 0);
  c.seen[id] = { n: (prev?.n || 0) + qty, first: prev?.first || at, ...(best && { best }) };
  c.owned[id] = (c.owned[id] || 0) + qty;
  if (dirty) c.dirty[id] = (c.dirty[id] || 0) + qty;
  put(c);
  return { fresh: !prev, n: c.seen[id].n, best: best || null, improved: !!(size && prev && size > (prev.best || 0)) };
}

/** Marks entries as seen without changing what you hold (paintings you've hung). */
export function markSeen(ids, at = Date.now()) {
  const c = snapshot();
  let changed = false;
  ids.forEach((id) => {
    if (!ID.test(id) || c.seen[id]) return;
    c.seen[id] = { n: 1, first: at };
    changed = true;
  });
  if (changed) put(c);
}

/** Sell or lose one. The codex keeps its stamp. */
export function dispose(id, qty = 1) {
  const c = snapshot();
  if (!c.owned[id]) return false;
  c.owned[id] = Math.max(0, c.owned[id] - qty);
  if (!c.owned[id]) delete c.owned[id];
  if (c.dirty[id]) c.dirty[id] = Math.min(c.dirty[id], c.owned[id] || 0);
  if (!c.dirty[id]) delete c.dirty[id];
  put(c);
  return true;
}

/** { have, total, done, claimed } for a set. */
export function setProgress(setOrId, c = snapshot()) {
  const s = typeof setOrId === 'string' ? getSet(setOrId) : setOrId;
  const have = s.entries.filter((id) => c.seen[id]).length;
  return { have, total: s.entries.length, done: have === s.entries.length, claimed: !!c.claimed[s.id] };
}

/** Pays a finished set once. Returns the gold to hand over (0 if not ready or already paid). */
export function claimSet(id) {
  const s = getSet(id);
  const c = snapshot();
  if (!s || c.claimed[id] || !setProgress(s, c).done) return 0;
  c.claimed[id] = true;
  put(c);
  return s.reward?.gold || 0;
}

/** Sets that are finished but not yet paid. */
export const unclaimedSets = (c = snapshot()) => sets().filter((s) => setProgress(s, c).done && !c.claimed[s.id]);

/** Testing: one of everything that has to be earned. Returns how many were added. */
export function collectEverything() {
  const c = snapshot();
  let added = 0;
  list().forEach((e) => {
    if (collection(e.collection).ownership !== 'earned' || c.seen[e.id]) return;
    collect(e.id);
    added++;
  });
  return added;
}
