// Display: collection entries placed on fixtures (easels, plinths, glass cases,
// specimen shelves, tanks) standing in rooms. Entries say how they can be shown
// (wall, case, plinth, tank); a fixture says what it accepts. What is on each
// fixture is saved by the fixture's id (`d` on the placed item), so moving a
// fixture keeps its contents and selling it empties it.
//
//   curation.display = { [fixtureId]: [entryId, ...] }
//
// Nothing here touches the page, so tests can import it from Node.
import { ITEMS, loadItems } from './items.js';
import { load, save } from './storage.js';
import { get, collectionOf } from './collections/index.js';
import { ownedCount, snapshot } from './collections/codex.js';

export const DISPLAY_KEY = 'curation.display';

export const fixtureOf = (type) => ITEMS[type]?.fixture;
export const isFixture = (item) => !!fixtureOf(item?.type);
export const slotCount = (type) => {
  const s = fixtureOf(type)?.slots;
  return Array.isArray(s) ? s.length : s || 0;
};

export const newId = () => `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** What each fixture holds: { [fixtureId]: [entryId] }. Junk in a save is dropped. */
export function contents() {
  const raw = load(DISPLAY_KEY, {});
  const out = {};
  Object.entries(raw).forEach(([fid, ids]) => {
    if (Array.isArray(ids)) out[fid] = ids.filter((id) => typeof id === 'string' && get(id));
  });
  return out;
}

export const heldBy = (fid, all = contents()) => (fid && all[fid]) || [];

/** Where an entry can be shown: its own list, or its collection's default. */
export const displaysOf = (e) => e.display || [collectionOf(e)?.display || 'wall'];

export const accepts = (type, e) => {
  const f = fixtureOf(type);
  return !!f && displaysOf(e).some((d) => f.accepts.includes(d));
};

/** How many of an entry are on display across the museum. */
export function onDisplay(entryId, all = contents()) {
  return Object.values(all).reduce((n, ids) => n + ids.filter((i) => i === entryId).length, 0);
}

/** Entries you could put on this kind of fixture right now: owned, accepted, and not all out already. */
export function candidates(type, entries, snap = snapshot(), all = contents()) {
  return entries.filter((e) => accepts(type, e) && ownedCount(e.id, snap) > onDisplay(e.id, all));
}

/** Puts an entry on a fixture. Returns false if it's full, doesn't fit, or you have no more of it. */
export function put(item, entryId, snap = snapshot()) {
  const e = get(entryId);
  const all = contents();
  const have = heldBy(item.d, all);
  if (!item.d || !e || !accepts(item.type, e) || have.length >= slotCount(item.type)) return false;
  if (ownedCount(entryId, snap) <= onDisplay(entryId, all)) return false;
  save(DISPLAY_KEY, { ...all, [item.d]: [...have, entryId] });
  return true;
}

/** Takes one entry (at `index`) off a fixture. */
export function take(item, index) {
  const all = contents();
  const have = heldBy(item.d, all).slice();
  if (!have.length) return;
  have.splice(index, 1);
  save(DISPLAY_KEY, { ...all, [item.d]: have });
}

/** Empties a fixture (when it is sold). */
export function clear(fid) {
  const all = contents();
  if (!(fid in all)) return;
  delete all[fid];
  save(DISPLAY_KEY, all);
}

/** Gold per hour an entry earns while on display. */
export const earns = (e) => e.value ?? 2 * (e.rarity ?? 1);

/** Everything on display in room `i`, as entries. */
export function shownIn(i, all = contents()) {
  return loadItems(i).flatMap((it) => (isFixture(it) ? heldBy(it.d, all).map((id) => get(id)).filter(Boolean) : []));
}

export const displayIncome = (i, all = contents()) => shownIn(i, all).reduce((n, e) => n + earns(e), 0);

/** Every entry id on display in any of the first `roomCount` rooms. */
export function shownEverywhere(roomCount) {
  const all = contents();
  const ids = [];
  for (let i = 0; i < roomCount; i++) shownIn(i, all).forEach((e) => ids.push(e.id));
  return ids;
}
