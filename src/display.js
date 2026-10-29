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
import { get, collectionOf, sets } from './collections/index.js';
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

/**
 * Sets with every piece on display somewhere (the Fossil drawer, the Crystal cabinet...).
 * `ids` is the list of entry ids on display (several copies count once).
 */
export function setsShown(ids, collectionId) {
  const on = new Set(ids);
  return sets(collectionId).map((s) => {
    const have = s.entries.filter((id) => on.has(id)).length;
    return { set: s, have, total: s.entries.length, done: have === s.entries.length };
  });
}

/** Entry ids that earn double because their whole set is on display. */
export function bonusIds(ids) {
  return new Set(setsShown(ids).filter((r) => r.done).flatMap((r) => r.set.entries));
}

export function displayIncome(i, all = contents()) {
  const bonus = bonusIds(shownEverywhere(all));
  return shownIn(i, all).reduce((n, e) => n + earns(e) * (bonus.has(e.id) ? 2 : 1), 0);
}

/** Every entry id on display, in any room (one read of the saved items). */
export function shownEverywhere(all = contents()) {
  const rooms = load('curation.items', {});
  return Object.values(rooms)
    .filter(Array.isArray)
    .flatMap((list) => list.filter((it) => ITEMS[it?.type]?.fixture).flatMap((it) => heldBy(it.d, all)));
}

/**
 * Pieces an exhibit has to be built from (the T. rex skeleton: dug bones and a tooth).
 * Returns [{ id, title, need, have }] for each requirement, or [] if the item has none.
 */
export function needsOf(type, snap = snapshot()) {
  return Object.entries(ITEMS[type]?.needs || {}).map(([id, need]) => ({ id, title: get(id)?.title || id, need, have: ownedCount(id, snap) }));
}

/** Words for what is still missing, or null when you can build it. */
export function missingFor(type, snap = snapshot()) {
  const short = needsOf(type, snap).filter((n) => n.have < n.need);
  if (!short.length) return null;
  const say = short.map((n) => `${n.need} ${n.title.toLowerCase()}${n.need > 1 ? 's' : ''} (you have ${n.have})`);
  return `Dig up ${say.join(' and ')} first`;
}
