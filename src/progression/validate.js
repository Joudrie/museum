// The content validator. Fails the build on broken references, missing hints, uncatchable species
// (condition combinations that never occur), and empty rank or skill rewards. Node-safe: the CLI
// (tools/validate_progression.mjs) and the unit test both call validate().
import { TUNING } from './config.js';
import { allSpecies, REGIONS, LEGENDS, hintsFor } from './species.js';
import { eligible, BAITS, LURES, timeSlot } from './fishroll.js';
import { SKILLS } from './skills.js';
import { COSMETICS, UNLOCK_NAMES } from './grants.js';
import { EVENTS } from './bus.js';
import RANKS from './data/ranks.json' with { type: 'json' };
import RODS from './data/rods.json' with { type: 'json' };
import NPCS from './data/npcs.json' with { type: 'json' };
import { problems as registryProblems } from '../collections/index.js';

const TIMES = ['dawn', 'day', 'dusk', 'night'];
const WEATHERS = ['clear', 'rain', 'snow', 'fog'];
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const empty = (r) => !r || !Object.keys(r).length || (r.note && Object.keys(r).length === 1);

/**
 * opts.extra: more checks from later systems [(add) => void]
 * opts.perkUses: perk keys the source code asks for (from a scan) so a typo is caught
 * opts.mapIds: map ids that exist on disk
 */
export function validate({ extra = [], perkUses = [], mapIds = null, busWired = null } = {}) {
  const out = [];
  const add = (msg) => out.push(msg);

  // ---- collection registry ----
  registryProblems().forEach((m) => add(`collections: ${m}`));

  // ---- ranks ----
  if (RANKS.length !== TUNING.rank.max) add(`ranks.json has ${RANKS.length} ranks, wanted ${TUNING.rank.max}`);
  RANKS.forEach((r, i) => {
    if (r.rank !== i + 1) add(`rank ${i + 1} is numbered ${r.rank}`);
    if (!r.rewards?.length || r.rewards.every(empty)) add(`rank ${r.rank} grants nothing`);
    (r.rewards || []).forEach((x) => checkReward(x, `rank ${r.rank}`, add));
  });
  for (let n = 5; n <= 50; n += 5) if (!RANKS[n - 1]?.major) add(`rank ${n} is not marked as a major unlock`);

  // ---- skills ----
  Object.entries(SKILLS).forEach(([id, s]) => {
    if (s.levels.length !== TUNING.skills.maxLevel) add(`skill ${id} has ${s.levels.length} levels`);
    const perks = new Set();
    s.levels.forEach((l) => {
      if (empty(l.reward)) add(`skill ${id} level ${l.level} grants nothing`);
      checkReward(l.reward || {}, `skill ${id} L${l.level}`, add);
      if (l.level % 2 === 0 && !l.perk) add(`skill ${id} level ${l.level} has no perk`);
      if (l.level % 2 === 1 && l.perk) add(`skill ${id} level ${l.level} has a perk on an odd level`);
      if (l.perk) {
        if (perks.has(l.perk)) add(`skill ${id} repeats perk ${l.perk}`);
        perks.add(l.perk);
        if (!l.text) add(`skill ${id} perk ${l.perk} has no text`);
      }
    });
  });
  const known = new Set(Object.entries(SKILLS).flatMap(([id, s]) => s.levels.filter((l) => l.perk).map((l) => `${id}.${l.perk}`)));
  perkUses.forEach((k) => !known.has(k) && add(`code asks for perk ${k}, which no skill grants`));

  // ---- regions, rods, baits ----
  Object.entries(REGIONS).forEach(([id, r]) => {
    if (!REGIONS[id].legend) add(`region ${id} has no legendary`);
    else if (!allSpecies().some((s) => s.id === r.legend)) add(`region ${id} legend ${r.legend} is not a species`);
    if (r.req && !UNLOCK_NAMES[r.req]) add(`region ${id} needs ${r.req}, which nothing grants`);
    if (mapIds) r.maps.forEach((m) => m !== 'one' && !mapIds.includes(m) && add(`region ${id} lists map ${m}, which does not exist`));
  });
  Object.entries(RODS).forEach(([id, r]) => {
    if (r.unlock && !r.unlock.startsWith('goal:') && !UNLOCK_NAMES[r.unlock]) add(`rod ${id} unlocks by ${r.unlock}, which nothing grants`);
  });
  const grantedUnlocks = new Set(RANKS.flatMap((r) => r.rewards.map((x) => x.unlock).filter(Boolean)));
  Object.entries(RODS).forEach(([id, r]) => r.unlock && r.unlock.startsWith('rod:') && !grantedUnlocks.has(r.unlock) && add(`rod ${id} (${r.unlock}) is not given by any rank`));
  Object.entries(REGIONS).forEach(([id, r]) => r.req && !grantedUnlocks.has(r.req) && add(`region ${id} needs ${r.req}, which no rank grants`));

  // ---- species ----
  const species = allSpecies();
  if (species.length < 60) add(`only ${species.length} species (launch target is 60)`);
  const perks = new Set(['fishing.night_fishing']);
  species.forEach((s) => {
    if (s.rarity < 1 || s.rarity > 5) add(`${s.id}: rarity ${s.rarity}`);
    if (!(s.sd > 0) || !(s.mean > 0)) add(`${s.id}: size distribution is broken`);
    if (!s.regions.length) add(`${s.id}: lives nowhere`);
    s.regions.forEach((r) => !REGIONS[r] && add(`${s.id}: unknown region ${r}`));
    s.waters.forEach((w) => !['pond', 'river', 'sea', 'ice'].includes(w) && add(`${s.id}: unknown water ${w}`));
    s.baits.forEach((b) => !BAITS[b] && add(`${s.id}: unknown bait ${b}`));
    const hints = hintsFor(s);
    if (hints.length !== 3 || hints.some((h) => !h || h.length < 5)) add(`${s.id}: needs three journal hints`);
    if (!s.blurb || s.blurb.length < 20) add(`${s.id}: missing a true blurb`);
    // catchable: some region, water, time, weather and season where it can bite
    let ok = false;
    for (const region of s.regions) {
      const info = REGIONS[region];
      if (!info) continue;
      const waters = new Set(info.waters);
      if (info.freezes) waters.add('ice');
      for (const water of waters)
        for (const time of TIMES) for (const weather of WEATHERS) for (const season of SEASONS) {
          // a pond freezes in winter in regions that freeze: it is ice then, not pond
          if (water === 'pond' && season === 'winter' && info.freezes) continue;
          if (water === 'ice' && !info.iceAlways && season !== 'winter') continue;
          if (info.iceAlways && water === 'sea') continue;
          if (eligible(s, { region, water, time, weather, season, perks })) ok = true;
        }
    }
    if (!ok) add(`${s.id}: no region, water, time, weather and season ever lets it bite`);
    if (s.rarity === 5) {
      const lg = LEGENDS[s.id];
      if (!lg) add(`${s.id}: a legendary with no trail (data/legends.json)`);
      else {
        if (!s.regions.includes(lg.region)) add(`${s.id}: trail region ${lg.region} is not one it lives in`);
        if (!BAITS[lg.bait]) add(`${s.id}: trail bait ${lg.bait} does not exist`);
        else if (!(BAITS[lg.bait].price > 0) && !BAITS[lg.bait].craft) add(`${s.id}: trail bait ${lg.bait} cannot be bought or crafted`);
        if (!s.baits.includes(lg.bait)) add(`${s.id}: trail bait ${lg.bait} is not one it likes`);
        if (!lg.rumor || !lg.clue?.text || !lg.clue?.secret) add(`${s.id}: trail needs a rumor, a clue and a secret id`);
        const npc = NPCS.find((n) => n.id === lg.rumorFrom);
        if (!npc) add(`${s.id}: rumor giver ${lg.rumorFrom} is not an NPC`);
        else if (npc.region !== lg.region) add(`${s.id}: rumor giver ${lg.rumorFrom} lives in ${npc.region}, not ${lg.region}`);
      }
    }
  });
  Object.keys(LEGENDS).forEach((id) => !species.some((s) => s.id === id) && add(`legends.json names ${id}, which is not a species`));
  Object.entries(BAITS).forEach(([id, b]) => {
    if (!b.name || !b.desc) add(`bait ${id} needs a name and a description`);
    if (!(b.price > 0) && !b.craft) add(`bait ${id} can be neither bought nor crafted`);
  });
  Object.entries(LURES).forEach(([id, l]) => !(l.price > 0) && add(`lure ${id} has no price`));

  // ---- NPCs ----
  const ids = new Set();
  NPCS.forEach((n) => {
    if (ids.has(n.id)) add(`npc ${n.id} repeats`);
    ids.add(n.id);
    if (!REGIONS[n.region]) add(`npc ${n.id} lives in ${n.region}, which is not a region`);
  });

  // ---- cosmetics ----
  Object.entries(COSMETICS).forEach(([id, c]) => {
    if (!id.includes(':') || !c.name || !(c.rarity >= 1 && c.rarity <= 5)) add(`cosmetic ${id} is malformed`);
    if (c.source === 'shop' && !(c.price > 0)) add(`cosmetic ${id} is sold but has no price`);
  });

  // ---- events on the bus have somewhere to go ----
  // events that gameplay raises and the layer must route; grown phase by phase until every one is on the list
  const REQUIRED = ['FISH_CAUGHT', 'FISH_ESCAPED'];
  if (busWired) Object.keys(EVENTS).filter((t) => REQUIRED.includes(t)).forEach((t) => !busWired.has(t) && add(`bus event ${t} has no subscriber (a dead end in the loop map)`));

  extra.forEach((fn) => fn(add));
  return out;
}

function checkReward(r, where, add) {
  if (r.cosmetic && !COSMETICS[r.cosmetic]) add(`${where}: cosmetic ${r.cosmetic} does not exist`);
  if (r.title && !COSMETICS[`title:${r.title}`]) add(`${where}: title ${r.title} does not exist`);
  if (r.unlock && !UNLOCK_NAMES[r.unlock]) add(`${where}: unlock ${r.unlock} has no name`);
  if (r.bait && !BAITS[r.bait[0]]) add(`${where}: bait ${r.bait[0]} does not exist`);
  if (r.lure && !LURES[r.lure[0]]) add(`${where}: lure ${r.lure[0]} does not exist`);
}
