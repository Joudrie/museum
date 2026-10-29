// Where a find was dug up ("Skull Isle"), remembered per entry for the plaque.
// Node-safe (no Vite imports) so restore.js and tests can use it.
import { load, save } from './storage.js';

const KEY = 'curation.expedition'; // { v, done: { islandId: trips }, where: { entryId: place } }

export function expeditionStore() {
  const raw = load(KEY, null);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const o = obj(raw);
  return { v: 1, done: obj(o.done), where: obj(o.where) };
}
export const saveExpeditionStore = (s) => save(KEY, s);

/** Where an entry was found, or null. */
export const foundAt = (entryId) => expeditionStore().where[entryId] || null;

/** Remember where a find came from (the first place sticks). */
export function rememberFound(entryId, place) {
  const s = expeditionStore();
  if (s.where[entryId]) return;
  s.where[entryId] = place;
  saveExpeditionStore(s);
}
