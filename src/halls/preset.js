// Hall presets: a themed room (look, decor, paintings) plus which collections
// and sets belong in it. This file is pure (no page, no storage) so tests can
// import it from Node. The data lives in content/halls/halls.json; apply.js
// writes a preset into a room.
import { ITEMS } from '../items.js';
import { THEMES } from '../themes.js';
import * as registry from '../collections/index.js';

/** Problems in one hall (an empty list means it is fine). */
export function validateHall(h) {
  const out = [];
  const say = (m) => out.push(`${h?.id || '?'}: ${m}`);
  if (!h || typeof h !== 'object') return ['hall is not an object'];
  if (!/^[a-z0-9-]+$/.test(h.id || '')) say('id must be a lowercase slug');
  if (!h.name) say('missing name');
  if (!THEMES[h.theme]) say(`unknown theme "${h.theme}"`);
  (h.items || []).forEach((it) => {
    if (!ITEMS[it.type]) say(`unknown item "${it.type}"`);
    if (!(it.x >= 0 && it.x <= 1 && it.y >= 0 && it.y <= 1)) say(`item ${it.type} needs x and y between 0 and 1`);
  });
  (h.collections || []).forEach((c) => {
    if (!registry.collection(c.id)) return say(`collection "${c.id}" is not registered (list it under "planned")`);
    (c.sets || []).forEach((s) => {
      const set = registry.getSet(s);
      if (!set) say(`set "${s}" does not exist`);
      else if (set.collection !== c.id) say(`set "${s}" belongs to ${set.collection}, not ${c.id}`);
    });
  });
  (h.planned || []).forEach((p) => registry.collection(p) && say(`"${p}" is registered now: move it to "collections"`));
  const eras = registry.collection('painting')?.eras || {};
  (h.paintings?.eras || []).forEach((e) => e in eras || say(`unknown painting era "${e}"`));
  // Hall text is the game's own words. A true claim about real art goes in a collection entry, quoted.
  if (h.facts) say('facts do not belong on a hall: put them in the collection entries, with a quote');
  return out;
}

/**
 * Where a hall's items land in a room with floor `fw` x `fd` tiles. Positions
 * are fractions of the floor, kept off the doorways, never overlapping, and
 * clipped to the floor. Returns { items, skipped }.
 */
export function planItems(h, { fw, fd, vertical = true }) {
  const placed = [];
  const skipped = [];
  const taken = new Set();
  const midC = Math.floor(fw / 2);
  const midR = Math.floor(fd / 2);
  // the cells you walk in and out through
  const blocked = (c, r) => (vertical ? (c === midC || (fw % 2 === 0 && c === midC - 1)) && (r <= 0 || r >= fd - 2) : (r === midR || (fd % 2 === 0 && r === midR - 1)) && (c <= 1 || c >= fw - 1));
  (h.items || []).forEach((it) => {
    const def = ITEMS[it.type];
    if (!def) return skipped.push(it.type);
    const rot = it.rot ? 1 : 0;
    const w = rot ? def.h : def.w;
    const d = rot ? def.w : def.h;
    const free = (c, r) => {
      if (c < 0 || r < 0 || c + w > fw || r + d > fd) return false;
      for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) if (taken.has(`${c + i},${r + j}`) || blocked(c + i, r + j)) return false;
      return true;
    };
    const c0 = Math.round(it.x * (fw - w));
    const r0 = Math.round(it.y * (fd - d));
    for (let rad = 0; rad <= 2; rad++) {
      let hit = null;
      for (let dc = -rad; dc <= rad && !hit; dc++) for (let dr = -rad; dr <= rad && !hit; dr++) if (Math.max(Math.abs(dc), Math.abs(dr)) === rad && free(c0 + dc, r0 + dr)) hit = { c: c0 + dc, r: r0 + dr };
      if (hit) {
        for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) taken.add(`${hit.c + i},${hit.r + j}`);
        placed.push({ type: it.type, c: hit.c, r: hit.r, rot });
        return;
      }
    }
    skipped.push(it.type);
  });
  return { items: placed, skipped };
}

/** The decor a hall sets: its theme's, with the hall's own changes on top. */
export const decorFor = (h) => ({ ...THEMES[h.theme].decor, ...(h.decor || {}) });

/** Painting slugs for a hall's walls: the hall's eras, rarest last, repeating as needed. */
export function wallPaintings(h, count) {
  const eras = h.paintings?.eras;
  if (!eras?.length) return [];
  const pool = eras.flatMap((era) => registry.list({ collection: 'painting', era })).map(registry.slugOf);
  return pool.length ? Array.from({ length: count }, (_, i) => pool[i % pool.length]) : [];
}

/** Every entry id that belongs in a hall: its collections (or just the named sets), for shelves and goals. */
export function hallEntries(h) {
  const ids = new Set();
  (h.collections || []).forEach((c) => {
    const sets = (c.sets || []).map(registry.getSet).filter(Boolean);
    if (sets.length) sets.forEach((s) => s.entries.forEach((id) => ids.add(id)));
    else registry.list({ collection: c.id, all: true }).forEach((e) => ids.add(e.id));
  });
  return [...ids];
}
