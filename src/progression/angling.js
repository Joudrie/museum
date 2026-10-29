// Fishing as the progression layer sees it: prepare a cast (everything that can
// be known before the bite), then complete it (the reel result turns it into a
// catch) or lose it. All of it goes through the event bus; the UI only draws.
import { TUNING } from './config.js';
import { makeContext, rollSpecies, rollVariant, biteWait, reactWindow, tellFor, finalZ, sizeFromZ, sizeClassOf, fishValue, hotSpots, hotSlot, frenzyTimes, inFrenzy, LURES, BAITS } from './fishroll.js';
import { regionOfMap, regionInfo, allSpecies, speciesById, REGIONS } from './species.js';
import RODS from './data/rods.json' with { type: 'json' };
import { levelFor, hasPerk, perkSet } from './skills.js';
import { makeReel } from './reel.js';

export { RODS };

export function rodUnlocked(state, id) {
  const r = RODS[id];
  if (!r) return false;
  if (!r.unlock) return true;
  if (r.unlock === 'goal:night3') return state.fish.nightCatches >= 3 || !!state.unlocks['rod:glow'];
  return !!state.unlocks[r.unlock];
}
export function currentRod(state) {
  const id = state.fish.equipped.rod;
  return rodUnlocked(state, id) ? { id, ...RODS[id] } : { id: 'basic', ...RODS.basic };
}
export function equipRod(state, id) {
  if (!rodUnlocked(state, id)) return false;
  state.fish.equipped.rod = id;
  return true;
}
export const equipBait = (state, id) => {
  if (id && !(state.fish.baits[id] > 0)) return false;
  state.fish.equipped.bait = id || '';
  return true;
};
export const equipLure = (state, id, perks) => {
  if (id && (!perks.has('fishing.lure_slot') || !(state.fish.lures[id] > 0))) return false;
  state.fish.equipped.lure = id || '';
  return true;
};

/** Hot spots for a region right now, from candidate water tiles. */
export function currentHot(p, region, candidates) {
  const slot = hotSlot(p.clock.now());
  return hotSpots(region, slot, candidates, (label) => p.rngFor(label)).map(([tx, ty]) => ({ tx, ty, slot }));
}

/** Is a frenzy running right now? */
export function frenzyNow(p) {
  const now = p.clock.now();
  const d = new Date(now);
  const mins = d.getHours() * 60 + d.getMinutes();
  return inFrenzy(mins, frenzyTimes(p.clock.day(), (l) => p.rngFor(l)));
}

/**
 * Everything decided at the cast. `o`: { mapId, water, weather, hour, season,
 * hotNear (bool), spotId, rumorHere (bool) }.
 */
export function prepareCast(p, o) {
  const s = p.state;
  const f = s.fish;
  const region = regionOfMap(o.mapId);
  const info = regionInfo(region);
  const perks = p.perks();
  const rod = currentRod(s);
  // gear: bait and lure are used up at the cast
  const bait = f.equipped.bait && f.baits[f.equipped.bait] > 0 ? f.equipped.bait : '';
  if (bait) {
    f.baits[bait] -= 1;
    if (f.baits[bait] <= 0) {
      delete f.baits[bait];
      f.equipped.bait = '';
    }
  }
  const lure = f.equipped.lure && f.lures[f.equipped.lure] > 0 && perks.has('fishing.lure_slot') ? f.equipped.lure : '';
  if (lure) {
    f.lures[lure] -= 1;
    if (f.lures[lure] <= 0) {
      delete f.lures[lure];
      f.equipped.lure = '';
    }
  }
  const water = o.water === 'pond' && (o.season === 'winter' && info.freezes) ? 'ice' : info.iceAlways ? 'ice' : o.water;
  const frenzy = !!o.hotNear && frenzyNow(p);
  const rumor = o.rumorHere && s.fish.weeklyRumor && !s.fish.weeklyRumor.caught ? { speciesId: s.fish.weeklyRumor.speciesId } : null;
  const ctx = makeContext({ region, wild: !!info.wild, water, hour: o.hour, weather: o.weather, season: o.season, bait, lure, hot: !!o.hotNear, frenzy, perks, events: p.activeEventIds?.() || [], rumor });
  const first = f.catches === 0 && !f.pending;
  let roll;
  if (first) {
    // the very first catch is a gentle, common fish (not the minnow Edmund already gave you)
    const common = allSpecies().filter((sp) => sp.rarity === 1 && sp.id !== 'minnow' && sp.regions.includes(ctx.region) && sp.waters.includes(ctx.water));
    const pick = common.length ? common[p.rng.int(common.length)] : allSpecies().find((sp) => sp.rarity === 1);
    roll = { species: pick, junk: false, tier: 1, via: 'first', z: 0.2 };
    f.rolls += 1;
  } else roll = rollSpecies(s, ctx, p.rng);
  const plan = {
    ctx,
    region,
    water,
    rod,
    bait,
    lure,
    first,
    hot: !!o.hotNear,
    frenzy,
    spotId: o.spotId || '',
    junk: roll.junk,
    species: roll.species,
    z: roll.z,
    via: roll.via,
    wait: biteWait(rod, ctx, p.rng),
    window: reactWindow(rod, perks, ctx, { first }),
    tell: tellFor(roll.species ? roll.species.rarity : 1),
    variant: roll.species ? rollVariant(p.rng, ctx) : '',
    startedAt: p.clock.now(),
    // for the fish-shadow perk: how big it looks
    shadow: roll.species ? { size: sizeClassOf(roll.z), rarity: perks.has('fishing.legend_sense') && roll.species.rarity === 5 ? 5 : 0 } : null,
    reel: roll.species ? { rarity: roll.species.rarity, legend: roll.species.rarity === 5, zone: 0.26 + (hasPerk(s, 'fishing.wide_window') ? 0.02 : 0) + (first ? 0.12 : 0) } : null,
  };
  f.pending = { species: plan.species?.id || '', z: plan.z, at: plan.startedAt };
  if (plan.hot) p.telemetry?.track('hotspot_cast', { region });
  p.store.commit();
  return plan;
}

export const newReel = (p, plan) => makeReel({ ...plan.reel, rng: p.rng, forgiving: plan.first });

/** The fish is landed. `result`: { perfect }. Returns the catch record the reveal shows. */
export function completeCast(p, plan, result = {}) {
  const s = p.state;
  const f = s.fish;
  f.pending = null;
  if (plan.junk || !plan.species) {
    // nothing is wasted: even an old boot moves two bars
    p.bus.emit('JUNK_CAUGHT', { itemId: plan.via === 'empty' ? 'empty' : 'junk', region: plan.region });
    return { junk: true };
  }
  const sp = plan.species;
  const perfect = !!result.perfect;
  const z = finalZ(plan.z, { perfect, lure: plan.lure });
  const size = sizeFromZ(sp, z);
  const sizeClass = sizeClassOf(z);
  const doubled = p.perks().has('fishing.double_catch') && p.rng.chance(TUNING.fishing.doubleCatchChance);
  const payload = { speciesId: sp.id, size, sizeClass, rarity: sp.rarity, variant: plan.variant, spotId: plan.spotId, perfect, region: plan.region, water: plan.water, bait: plan.bait, hot: plan.hot, doubled, via: plan.via, z, weather: plan.ctx.weather, night: plan.ctx.time === 'night', time: plan.ctx.time };
  p.bus.emit('FISH_CAUGHT', payload);
  if (plan.via === 'rumor' && s.fish.weeklyRumor) s.fish.weeklyRumor.caught = true;
  return p.last;
}

export function loseCast(p, plan) {
  const s = p.state;
  s.fish.pending = null;
  if (!plan?.species) return null;
  const z = plan.z;
  p.bus.emit('FISH_ESCAPED', { speciesId: plan.species.id, sizeClass: sizeClassOf(z), rarity: plan.species.rarity, region: plan.region });
  return p.last;
}

export { speciesById, fishValue, BAITS, LURES, REGIONS, levelFor, perkSet };
