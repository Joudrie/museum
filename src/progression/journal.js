// The field journal: pages of things to find, shown as silhouettes until you do.
// The Fish page reads the species list; the other pages read their own data.
// Each undiscovered entry carries three tiered hints:
//   1 free (the region)    2 from a skill level or a rumour (time and weather)
//   3 for gold, or from a max-heart friend (the exact condition)
import { TUNING } from './config.js';
import { allSpecies, hintsFor, REGIONS } from './species.js';
import { levelFor } from './skills.js';
import { COSMETICS } from './grants.js';
import NPCS from './data/npcs.json' with { type: 'json' };

export const PAGES = [
  { id: 'fish', name: 'Fish', icon: 'fish', blurb: 'Every species, and the variants and sizes beyond.' },
  { id: 'people', name: 'People', icon: 'heart', blurb: 'Everyone you meet, what they like, how close you are.' },
  { id: 'places', name: 'Places', icon: 'map', blurb: 'Docks, ponds and viewpoints you have found.' },
  { id: 'emotes', name: 'Emotes', icon: 'note', blurb: 'The little pictures people show.' },
  { id: 'secrets', name: 'Secrets', icon: 'star', blurb: 'Hidden details. A "?" is something still there.' },
  { id: 'curios', name: 'Curios', icon: 'book', blurb: 'The museum’s paintings, bones, coins and more (see the Journal).' },
  { id: 'titles', name: 'Titles', icon: 'title', blurb: 'Titles to wear on your nameplate.' },
  { id: 'records', name: 'Records', icon: 'trophy', blurb: 'Your story so far.' },
];

export const EMOTES = ['heart', 'star', 'note', 'zzz', 'sweat', 'dots', 'bang', 'question'];
const MILESTONES = [25, 50, 75, 100];
const MILESTONE_REWARD = {
  25: [{ gold: 150 }],
  50: [{ gold: 400 }, { bait: ['goldenfly', 1] }],
  75: [{ gold: 800 }],
  100: [{ gold: 2000 }],
};
const MILESTONE_100 = { fish: { cosmetic: 'frame:aurora', title: 'complete_fish' }, people: { title: 'friend' }, places: { cosmetic: 'frame:map' }, emotes: { cosmetic: 'hat:flower' }, secrets: { title: 'storyteller' } };

export const keyOf = (page, id) => `${page}:${id}`;
export const isStamped = (state, page, id) => !!state.journal.stamps[keyOf(page, id)];

/** Entries of each page as plain data: { id, name, group, hints? }. */
export function entriesOf(p, page) {
  const s = p.state;
  if (page === 'fish')
    return allSpecies().map((sp) => ({ id: sp.id, name: sp.name, group: REGIONS[sp.regions[0]]?.name || 'Anywhere', rarity: sp.rarity, hints: hintsFor(sp), species: sp }));
  if (page === 'people') return NPCS.map((n) => ({ id: n.id, name: n.name, group: REGIONS[n.region]?.name || 'Museum', hints: [`Lives around ${REGIONS[n.region]?.name || 'the museum'}.`, 'Say hello more than once.', 'Hearts open their story.'], npc: n }));
  if (page === 'emotes') return EMOTES.map((id) => ({ id, name: id, group: 'Emotes', hints: ['Seen on people nearby.', 'Try gifts.', 'Close friends show their own.'] }));
  if (page === 'places' || page === 'secrets') {
    const known = Object.entries(s.world[page === 'places' ? 'locations' : 'secrets']);
    const list = known.map(([id, v]) => ({ id, name: v.name || id, group: REGIONS[v.region]?.name || '' }));
    // undiscovered ones count as "?" so the player knows something is still there
    const total = totalFor(page);
    const unknown = Math.max(0, total - list.length);
    for (let i = 0; i < unknown; i++) list.push({ id: `?${i}`, name: '???', group: '', unknown: true });
    return list;
  }
  if (page === 'titles') return Object.entries(COSMETICS).filter(([id]) => id.startsWith('title:')).map(([id, c]) => ({ id, name: c.name, group: c.source, rarity: c.rarity, hints: [`From ${c.source}.`, '', ''] }));
  return [];
}

// planned counts for pages that grow as the player explores
const PLAN = { places: 24, secrets: 40 };
const totalFor = (page) => PLAN[page] || 0;
export const setPlanned = (page, n) => (PLAN[page] = n);

/** { have, total, pct } for a page. */
export function completion(p, page) {
  if (page === 'curios' && p.hooks?.curios) return p.hooks.curios();
  if (page === 'records') return { have: 0, total: 0, pct: 0 };
  const entries = entriesOf(p, page);
  const have = entries.filter((e) => !e.unknown && isStamped(p.state, page, e.id)).length;
  return { have, total: entries.length, pct: entries.length ? (100 * have) / entries.length : 0 };
}

/** Fish species in one region, for "Lakeside Fish" style progress. */
export function regionFishProgress(p, region) {
  const list = allSpecies().filter((s) => s.regions.includes(region));
  const have = list.filter((s) => isStamped(p.state, 'fish', s.id)).length;
  return { region, name: REGIONS[region]?.name, have, total: list.length, left: list.length - have };
}

/** Which hint tier the player has earned for an entry (1 to 3). */
export function hintLevel(p, page, id) {
  const s = p.state;
  const bought = s.journal.hintsBought[keyOf(page, id)] || 0;
  let lv = 1;
  const fish = levelFor(s, 'fishing');
  const rarity = page === 'fish' ? allSpecies().find((x) => x.id === id)?.rarity || 1 : 1;
  if (fish >= 2 + rarity * 2 || s.journal.leads[`rumor:${id}`]) lv = 2; // a skill level or a rumour
  if (page === 'fish') {
    const sp = allSpecies().find((x) => x.id === id);
    if (sp?.legend && s.journal.leads[`legend:${id}`]?.stage) lv = Math.max(lv, 3);
  }
  const maxFriend = Object.values(s.friends).some((f) => f.hearts >= TUNING.friendship.maxHearts && f.shares === id);
  if (maxFriend) lv = 3;
  return Math.min(3, Math.max(lv, bought));
}

export const hintPrice = (rarity) => [0, 30, 60, 120, 250, 500][rarity || 1];

export function buyHint(p, page, id) {
  const entry = entriesOf(p, page).find((e) => e.id === id);
  if (!entry || isStamped(p.state, page, id)) return { ok: false };
  const have = hintLevel(p, page, id);
  if (have >= 3) return { ok: false, reason: 'all shown' };
  const price = hintPrice(entry.rarity);
  if (!p.gold.pay(price)) return { ok: false, reason: 'gold' };
  p.state.journal.hintsBought[keyOf(page, id)] = have + 1;
  p.bus.emit('PURCHASE', { itemId: `hint:${id}`, price, kind: 'hint' });
  p.store.commit();
  return { ok: true, level: have + 1, price };
}

/** Stamps an entry. Returns { fresh, key }. Milestones are checked by the caller via checkMilestones. */
export function stamp(p, page, id, where = {}) {
  const k = keyOf(page, id);
  const j = p.state.journal;
  if (j.stamps[k]) return { fresh: false, key: k };
  j.stamps[k] = { at: p.clock.now(), day: p.clock.day(), region: where.region || '', name: where.name || '' };
  return { fresh: true, key: k };
}

export const isNew = (state, page, id) => isStamped(state, page, id) && !state.journal.viewed[keyOf(page, id)];
export function markViewed(p, page, id) {
  p.state.journal.viewed[keyOf(page, id)] = true;
}
export const newCount = (p, page) =>
  Object.keys(p.state.journal.stamps).filter((k) => (page ? k.startsWith(page + ':') : true) && !p.state.journal.viewed[k]).length;

/** Pays any 25/50/75/100% milestone a page has newly reached. Returns [{ page, pct, rewards }]. */
export function checkMilestones(p, page, grant) {
  const c = completion(p, page);
  const out = [];
  MILESTONES.forEach((m) => {
    const got = p.state.journal.milestones[page] || 0;
    if (c.pct >= m && got < m) {
      p.state.journal.milestones[page] = m;
      let rewards = MILESTONE_REWARD[m];
      if (m === 100 && MILESTONE_100[page]) rewards = [...rewards, MILESTONE_100[page]];
      out.push({ page, pct: m, rewards: grant(rewards) });
    }
  });
  return out;
}

/** The nearest finish line (goal gradient): a fish set at 80% or better, or any page at 80%. */
export function nearlyDone(p, threshold = 0.8) {
  const out = [];
  const bySet = {};
  allSpecies().forEach((sp) => {
    const set = sp.entry.set;
    if (!set) return;
    const o = (bySet[set] ||= { set, have: 0, total: 0 });
    o.total++;
    if (isStamped(p.state, 'fish', sp.id)) o.have++;
  });
  Object.values(bySet).forEach((o) => {
    if (o.total >= 4 && o.have / o.total >= threshold && o.have < o.total) out.push({ kind: 'set', id: o.set, left: o.total - o.have, have: o.have, total: o.total });
  });
  PAGES.forEach((pg) => {
    const c = completion(p, pg.id);
    if (c.total >= 5 && c.pct >= threshold * 100 && c.pct < 100) out.push({ kind: 'page', id: pg.id, left: c.total - c.have, have: c.have, total: c.total });
  });
  return out.sort((a, b) => a.left - b.left);
}

/** The first thing on every page is already there: nothing starts at 0%. */
export function endow(p) {
  const j = p.state.journal;
  const first = [['fish', 'minnow'], ['people', NPCS[0]?.id], ['places', null], ['emotes', 'heart'], ['secrets', null]];
  first.forEach(([page, id]) => {
    if (!id || j.stamps[keyOf(page, id)]) return;
    j.stamps[keyOf(page, id)] = { at: p.clock.now(), day: p.clock.day(), region: 'main', name: '', gift: true };
    j.viewed[keyOf(page, id)] = true;
  });
  // a place and a secret start known so those pages open above zero
  if (!Object.keys(p.state.world.locations).length) p.state.world.locations['main:museum'] = { at: p.clock.now(), region: 'main', name: 'The Museum' };
  if (!Object.keys(p.state.world.secrets).length) p.state.world.secrets['main:welcome'] = { at: p.clock.now(), region: 'main', name: 'The caretaker’s bench' };
  j.endowed = true;
}
