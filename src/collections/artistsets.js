// Artist sets: every artist with two or more paintings gets a set made for them
// ("Vincent van Gogh, 0 of 6"), worked out from the paintings themselves, so new
// paintings join their artist's set with no extra data.
export const ARTIST_SET_MIN = 2;
export const ARTIST_SET_GOLD = 100; // per painting in the set

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Set definitions for the artists in `entries` (any collection; only entries with a `by` count). */
export function artistSets(entries) {
  const by = new Map();
  entries.forEach((e) => {
    if (!e.by || e.collectable === false) return;
    by.set(e.by, [...(by.get(e.by) || []), e]);
  });
  return [...by.entries()]
    .filter(([, list]) => list.length >= ARTIST_SET_MIN)
    .map(([name, list]) => ({
      id: `artist-${list[0].makerId || slug(name)}`,
      name,
      collection: list[0].collection,
      entries: list.map((e) => e.id),
      reward: { gold: ARTIST_SET_GOLD * list.length },
      plaque: `Every painting by ${name} in your museum.`,
      artist: true,
    }));
}
