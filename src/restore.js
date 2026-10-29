// Restoration: the rules, with no page code. Finds and paintings can arrive
// dirty; the Restoration Studio (restorestudio.js) cleans them by hand. A dirty
// piece can't go on display until it is restored.
//
// THE `dirty` CONTRACT (for the dig, expedition and display chats):
//   hand over a dirty find:   collect('fossil:ammonite', { dirty: true })
//     or flag the entry in its data file with `dirty: true` (then every copy arrives dirty;
//     pass `dirty: false` to hand over a clean one)
//   a held piece gets grimy:  makeDirty('painting:harvesters')
//   ask before displaying:    displayCount(id) > 0  (never ownedCount)
//   how it is cleaned:        entry.restore = 'clean' | 'prep' | 'assemble' (optional; see restoreKind)
// All three live in collections/codex.js; the codex keeps the counts in `dirty`.
import { get, list, collectionOf } from './collections/index.js';
import { snapshot, dirtyCount, displayCount, restoreOne } from './collections/codex.js';

export { collect, makeDirty, dirtyCount, displayCount } from './collections/codex.js';

/** How an entry is restored: rub grime off a picture, chip stone off bone, or put broken pieces back together. */
export function restoreKind(e) {
  if (['clean', 'prep', 'assemble'].includes(e.restore)) return e.restore;
  const tags = e.tags || [];
  if (tags.some((t) => /^(pottery|shard|vase|bone|skeleton)$/.test(t))) return 'assemble';
  if (e.collection === 'fossil' || tags.includes('fossil')) return 'prep';
  return 'clean';
}

export const KIND_LABEL = { clean: 'Clean', prep: 'Fossil prep', assemble: 'Reassemble' };

/** Everything waiting to be restored: [{ entry, n, kind }]. */
export function dirtyItems(c = snapshot()) {
  return Object.keys(c.dirty)
    .map((id) => ({ entry: get(id), n: c.dirty[id] }))
    .filter((x) => x.entry)
    .map((x) => ({ ...x, kind: restoreKind(x.entry) }));
}

/** Finishes one piece. Returns { fresh } or null. */
export const finishRestore = (id) => restoreOne(id);

/** The plaque line: where it came from. "" when nothing is known. */
export function provenanceLine(e) {
  const p = e?.provenance;
  if (!p) return '';
  const where = p.where;
  const text = {
    dug: where ? `Recovered from ${where}` : 'Recovered from the ground',
    caught: where ? `Caught at ${where}` : 'Caught by hand',
    donated: where ? `Donated by ${where}` : 'Donated to the museum',
    gift: where ? `A gift from ${where}` : '',
    bought: where ? `Acquired from ${where}` : '',
  }[p.how];
  return [text, p.story].filter(Boolean).join('. ');
}

/**
 * Inventory (what you hold now) against the codex (everything you ever collected).
 * Paintings are always held; the rest come from the codex.
 */
export function inventory(c = snapshot()) {
  const rows = list({ all: false }).map((e) => {
    const col = collectionOf(e);
    const held = col?.ownership === 'all' ? 1 : c.owned[e.id] || 0;
    return {
      entry: e,
      held,
      dirty: Math.min(held, dirtyCount(e.id, c)),
      ready: displayCount(e.id, c),
      ever: c.seen[e.id]?.n || 0,
      restored: c.seen[e.id]?.restored || 0,
    };
  });
  return {
    now: rows.filter((r) => r.held > 0 && r.entry.collection !== 'painting'),
    ever: rows.filter((r) => r.ever > 0),
    lost: rows.filter((r) => r.ever > 0 && r.held === 0), // collected once, sold or gone
  };
}
