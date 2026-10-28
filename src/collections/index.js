// The collection registry: every collection, entry and set the game knows
// about, in one place. To add a collection, drop a data file in ./data and
// add one line to PACKS below. Nothing here touches the page, so tests can
// import it from Node.
import { validateEntry, validateCollection, validateSet, RARITY } from './schema.js';
import paintings from './data/paintings.js';
import fish from './data/fish.js';
import minerals from './data/minerals.js';

export { RARITY } from './schema.js';

// A data file exports one pack ({ collection, sets, entries }) or a list of them.
const PACKS = [paintings, fish, minerals];

const COLLECTIONS = new Map();
const ENTRIES = new Map();
const SETS = new Map();
const PROBLEMS = [];

const problem = (msg) => {
  PROBLEMS.push(msg);
  console.warn('[collections] ' + msg);
};

export function register(pack) {
  [pack].flat().forEach((p) => {
    const c = p?.collection;
    const bad = validateCollection(c);
    if (bad.length) return bad.forEach(problem);
    if (COLLECTIONS.has(c.id)) return problem(`collection ${c.id} is registered twice`);
    COLLECTIONS.set(c.id, { ...c, eras: c.eras ? { all: 'All', ...c.eras } : undefined });
    (p.entries || []).forEach((e) => {
      const issues = validateEntry(e, c);
      if (issues.length) return issues.forEach(problem); // a broken entry is skipped, never fatal
      if (ENTRIES.has(e.id)) return problem(`${e.id} is registered twice`);
      ENTRIES.set(e.id, e);
    });
    (p.sets || []).forEach((s) => {
      const issues = validateSet(s, (id) => ENTRIES.has(id));
      if (issues.length) return issues.forEach(problem);
      SETS.set(s.id, s);
    });
  });
}
PACKS.forEach(register);

export const problems = () => PROBLEMS.slice();
export const collections = () => [...COLLECTIONS.values()];
export const collection = (id) => COLLECTIONS.get(id);
export const slugOf = (e) => e.id.slice(e.id.indexOf(':') + 1);
export const collectionOf = (e) => COLLECTIONS.get(e.collection);

/** An entry by full id ("painting:harvesters"), or by collection and slug. */
export function get(id, slug) {
  return ENTRIES.get(slug === undefined ? id : `${id}:${slug}`);
}

/** The key older saves used for an entry: the bare slug for collections that predate this format. */
export const keyOf = (e) => (COLLECTIONS.get(e.collection)?.legacyKeys ? slugOf(e) : e.id);

/**
 * Entries, filtered. All filters are optional:
 *   collection, set, rarity, era, tag: exact matches
 *   q: text search over title, maker, blurb and tags
 *   all: true to include junk that is never collected
 */
export function list({ collection: col, set, rarity, era, tag, q, all } = {}) {
  const words = (q || '').toLowerCase().split(/\s+/).filter(Boolean);
  return [...ENTRIES.values()].filter((e) => {
    if (!all && e.collectable === false) return false;
    if (col && e.collection !== col) return false;
    if (set && e.set !== set) return false;
    if (rarity && (e.rarity ?? 1) !== rarity) return false;
    if (era && era !== 'all' && e.era !== era) return false;
    if (tag && !e.tags?.includes(tag)) return false;
    if (words.length) {
      const hay = [e.title, e.by, e.blurb, e.year, ...(e.tags || [])].join(' ').toLowerCase();
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  });
}
export const find = list;

export const sets = (col) => [...SETS.values()].filter((s) => !col || s.collection === col);
export const getSet = (id) => SETS.get(id);

/** The journal's tabs: one per tab id, in order, with the collections that share it. */
export function tabs() {
  const out = new Map();
  collections().forEach((c) => {
    const j = c.journal;
    if (!j) return;
    const t = out.get(j.tab) || { id: j.tab, label: j.label, order: j.order ?? 50, collections: [] };
    t.label = t.label || j.label;
    t.order = Math.min(t.order, j.order ?? 50);
    t.collections.push(c.id);
    out.set(j.tab, t);
  });
  return [...out.values()].sort((a, b) => a.order - b.order);
}

/** The line under a title: whichever of by / year / rarity / where the collection asks for, then (if asked) its era. */
export function metaLine(e, withEra = false) {
  const c = COLLECTIONS.get(e.collection);
  const parts = { by: e.by, year: e.year, rarity: RARITY[e.rarity ?? 1], where: e.provenance?.where };
  const out = (c?.meta || ['by', 'year']).map((k) => parts[k]).filter(Boolean);
  if (withEra && c?.eras && e.era) out.push(c.eras[e.era]);
  return out.join(' · ');
}
