// Species: the fish entries from the collection registry, read as fishing rules.
// Node-safe (no DOM). Regions come from data/regions.json; hints are written from
// the rules themselves so they can never disagree with what actually bites.
import { list, slugOf } from '../collections/index.js';
import REGIONS from './data/regions.json' with { type: 'json' };
import LEGENDS from './data/legends.json' with { type: 'json' };
import BAITS from './data/baits.json' with { type: 'json' };

export { REGIONS, LEGENDS };
export const regionIds = () => Object.keys(REGIONS);
const ZONES = ['temperate', 'tropical', 'arctic'];
const TIMES = ['dawn', 'day', 'dusk', 'night'];
const WEATHERS = ['clear', 'rain', 'snow', 'fog'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

// a region has this kind of water if it lists it, or (ice) if it freezes
const hasWater = (id, w) => REGIONS[id].waters.includes(w) || (w === 'ice' && REGIONS[id].freezes);

function expandRegions(list_, waters) {
  const out = new Set();
  const addIf = (id) => waters.some((w) => hasWater(id, w)) && out.add(id);
  (list_ || ['*']).forEach((r) => {
    if (r === '*') regionIds().forEach(addIf);
    else if (ZONES.includes(r)) regionIds().filter((id) => REGIONS[id].zone === r).forEach(addIf);
    else out.add(r);
  });
  return [...out];
}

// Which region a map belongs to. Unknown maps (the builder's) fish like Main Island, minus its legend.
export function regionOfMap(mapId) {
  const id = mapId || 'main';
  return regionIds().find((r) => REGIONS[r].maps.includes(id)) || 'wild';
}
export const regionInfo = (r) => REGIONS[r] || { name: 'Open water', zone: 'temperate', waters: ['pond', 'sea'], freezes: true, tier: 'free', req: null, wild: true };

export function toSpecies(e) {
  const a = e.acquire || {};
  if (a.junk || e.collectable === false) return null;
  const [mean, sd] = a.sizeDist || [((a.size?.[0] || 10) + (a.size?.[1] || 20)) / 2, ((a.size?.[1] || 20) - (a.size?.[0] || 10)) / 5 || 2];
  const waters = a.waters || (a.water ? [a.water] : ['pond', 'sea']);
  const s = {
    id: slugOf(e),
    entryId: e.id,
    name: e.title,
    blurb: e.blurb,
    rarity: e.rarity ?? 1,
    waters,
    regions: expandRegions(a.regions, waters),
    times: a.times || TIMES,
    weathers: a.weathers || WEATHERS,
    seasons: a.seasons || SEASONS,
    baits: a.baits || [],
    mean,
    sd,
    value: e.value ?? 1,
    xp: a.xp,
    entry: e,
  };
  s.legend = s.rarity === 5 ? LEGENDS[s.id] || null : null;
  s.nocturnal = s.times.length === 1 && s.times[0] === 'night' && s.rarity >= 3;
  return s;
}

let CACHE = null;
export function allSpecies() {
  return (CACHE ||= list({ collection: 'fish' }).map(toSpecies).filter(Boolean));
}
export const speciesById = (id) => allSpecies().find((s) => s.id === id);
export const legends = () => allSpecies().filter((s) => s.legend);

// ---- hints (three tiers) ----------------------------------------------------
const joinOr = (a) => (a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1]);
const regionNames = (s) => {
  const names = s.regions.map((r) => REGIONS[r]?.name).filter(Boolean);
  return names.length > 4 ? `${names.slice(0, 3).join(', ')} and more` : joinOr(names);
};
const WATER_WORD = { pond: 'a pond', sea: 'the open sea', ice: 'a hole in the ice', river: 'a river' };

export function hintsFor(s) {
  const timeTxt = s.times.length === 4 ? 'at any hour' : `around ${joinOr(s.times.map((t) => ({ dawn: 'dawn', day: 'midday', dusk: 'dusk', night: 'night' })[t]))}`;
  const weatherTxt = s.weathers.length === 4 ? '' : `, when it is ${joinOr(s.weathers)}`;
  const h1 = `Found around ${regionNames(s)}.`;
  const h2 = `Look in ${joinOr(s.waters.map((w) => WATER_WORD[w] || w))}, ${timeTxt}${weatherTxt}.`;
  const bn = (b) => (BAITS[b]?.name || b).toLowerCase();
  const bait = s.baits.length ? `Try ${joinOr(s.baits.map(bn))}` : 'Any bait will do';
  const season = s.seasons.length === 4 ? '' : ` in ${joinOr(s.seasons)}`;
  const legend = s.legend ? ` It only shows after you have found the clue, and wants ${bn(s.legend.bait)}${s.legend.spot === 'hot' ? ' at a hot spot' : ''}.` : '';
  const h3 = `${bait}${season}.${legend}`;
  return [h1, h2, h3];
}

/** Does this species ever bite in this region and water at all (ignoring time)? Used by the validator and the sim. */
export const livesIn = (s, region, water) => s.regions.includes(region) && s.waters.includes(water);

/** Fish that count toward a region's page. */
export const speciesOfRegion = (region) => allSpecies().filter((s) => s.regions.includes(region));
