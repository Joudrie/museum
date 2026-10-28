// Every source, one interface: search(query, opts) -> { candidates, rejected }, fetch(id) -> candidate.
import * as met from './met.mjs';
import * as aic from './aic.mjs';
import * as cleveland from './cleveland.mjs';
import * as smithsonian from './smithsonian.mjs';
import * as rijks from './rijks.mjs';
import * as commons from './commons.mjs';

export const SOURCES = { met, aic, cleveland, smithsonian, rijks, commons };
export const sourceList = () => Object.values(SOURCES);

/** Searches several sources; one that fails (blocked host, missing key) is reported, not fatal. */
export async function searchAll(query, { sources = Object.keys(SOURCES), limit = 5 } = {}) {
  const out = { candidates: [], rejected: [], errors: [] };
  for (const id of sources) {
    try {
      const r = await SOURCES[id].search(query, { limit });
      out.candidates.push(...r.candidates);
      out.rejected.push(...r.rejected);
    } catch (e) {
      out.errors.push({ source: id, error: e.message });
    }
  }
  return out;
}
