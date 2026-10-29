// What bites. Pure functions over a progression state and an injected RNG, so
// the browser, the tests and the sim all roll exactly the same way.
import { TUNING } from './config.js';
import { allSpecies, regionInfo } from './species.js';
import BAITS from './data/baits.json' with { type: 'json' };
import LURES from './data/lures.json' with { type: 'json' };

export { BAITS, LURES };

export const SIZE_CLASSES = ['S', 'M', 'L', 'XL', 'Trophy'];
export const timeSlot = (hour) => (hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night');
// the game's weather kinds, folded to the four fish care about
export const weatherClass = (w) => (w === 'rain' ? 'rain' : w === 'snow' ? 'snow' : w === 'fog' ? 'fog' : 'clear');

export function sizeClassOf(z, T = TUNING) {
  for (const c of T.fishing.sizeClasses) if (z < c.upTo) return c.id;
  return 'Trophy';
}
export const sizeFromZ = (s, z) => Math.max(2, Math.round(s.mean + s.sd * z));

/** Whether a species can bite under this context (everything except bait and rank gating). */
export function eligible(s, ctx) {
  if (!s.regions.includes(ctx.region) && !(ctx.wild && s.regions.includes('main') && !s.legend)) return false;
  if (!s.waters.includes(ctx.water)) return false;
  if (!s.times.includes(ctx.time)) return false;
  if (!s.weathers.includes(ctx.weather)) return false;
  if (!s.seasons.includes(ctx.season)) return false;
  if (s.nocturnal && !ctx.perks?.has('fishing.night_fishing')) return false;
  return true;
}

/** Legendaries are only in play when their trail has reached the clue stage and their own conditions hold. */
export function legendEligible(s, ctx, state) {
  if (!s.legend || !eligible(s, ctx)) return false;
  const trail = state.journal.leads[`legend:${s.id}`];
  if (!trail || (trail.stage !== 'clue' && trail.stage !== 'ready')) return false;
  if (s.legend.bait && ctx.bait !== s.legend.bait) return false;
  if (s.legend.spot === 'hot' && !ctx.hot) return false;
  return true;
}

/** Context from the world plus the player's gear. */
export function makeContext(o) {
  return {
    region: o.region,
    wild: !!o.wild,
    water: o.water,
    time: timeSlot(o.hour),
    weather: weatherClass(o.weather),
    season: o.season || 'summer',
    bait: o.bait || '',
    lure: o.lure || '',
    hot: !!o.hot,
    frenzy: !!o.frenzy,
    perks: o.perks,
    events: o.events || [],
    rumor: o.rumor || null, // { speciesId } when casting at this week's rumor spot
    ...o.extra,
  };
}

const baitFavours = (s, bait) => !!bait && s.baits.includes(bait);

/**
 * Weights per rarity tier for this cast (tiers with nobody eligible get 0).
 * `pool` is the eligible, non-legendary species.
 */
export function tierWeights(pool, ctx, state, T = TUNING) {
  const base = T.fishing.rarityWeights;
  const w = [0, 0, 0, 0, 0, 0];
  const have = new Set(pool.map((s) => s.rarity));
  const bait = BAITS[ctx.bait];
  const pity = state.fish.pity;
  const sinceRare = pity.rare;
  const ramp = sinceRare > T.fishing.pity.rareAfter ? 1 + (sinceRare - T.fishing.pity.rareAfter) * T.fishing.pity.rampPerRoll : 1;
  const sinceEpic = pity.epic;
  const epicRamp = sinceEpic > T.fishing.pity.epicAfter ? 1 + (sinceEpic - T.fishing.pity.epicAfter) * T.fishing.pity.rampPerRoll : 1;
  for (let r = 1; r <= 4; r++) {
    if (!have.has(r)) continue;
    let v = base[r];
    if (r >= 3) {
      if (ctx.hot) v *= T.fishing.hotspot.rareMult;
      if (bait?.rareMult && (!bait.nightOnly || ctx.time === 'night')) v *= bait.rareMult;
      v *= ramp;
    }
    if (r >= 4) {
      if (bait?.epicMult) v *= bait.epicMult;
      v *= epicRamp / ramp; // epic ramps on its own count, not stacked on the rare ramp
    }
    w[r] = v;
  }
  // a cold-water crowd cuts the common pool in half in ice holes? no: keep it simple
  return w;
}

/** Picks the species within a tier: bait affinity doubles-and-a-half a species' share. */
function pickInTier(pool, tier, ctx, rng) {
  const cand = pool.filter((s) => s.rarity === tier);
  const w = cand.map((s) => (baitFavours(s, ctx.bait) ? 2.5 : 1));
  const i = rng.weighted(w);
  return cand[i];
}

/**
 * One cast resolves to a species (or junk). Mutates the pity counters in `state`.
 * Returns { species, junk, tier, via, z }.
 */
export function rollSpecies(state, ctx, rng, T = TUNING) {
  const f = state.fish;
  f.rolls += 1;
  const species = allSpecies();

  // this week's rumor: the first cast at its spot lands it
  if (ctx.rumor) {
    const s = species.find((x) => x.id === ctx.rumor.speciesId);
    if (s) return finish(state, s, { via: 'rumor', z: rng.normal() }, T);
  }

  // junk now and then
  if (rng.chance(T.fishing.junkChance) && !ctx.frenzy) return { junk: true, species: null, tier: 0, via: 'junk', z: 0 };

  // legendaries first: a hazard that ramps to a certainty for the very first one
  const legends = species.filter((s) => s.legend && legendEligible(s, ctx, state));
  for (const s of legends) {
    const key = s.id;
    const first = !state.fish.species[key]?.n;
    const attempts = (f.pity.legend[key] || 0) + 1;
    f.pity.legend[key] = attempts;
    const G = T.fishing.pity.legendaryGuarantee;
    const hit = first ? attempts >= G || rng.chance(Math.pow(attempts / G, 2)) : rng.chance((T.fishing.rarityWeights[5] / 100) * (ctx.hot ? T.fishing.hotspot.rareMult : 1));
    if (hit) {
      f.pity.legend[key] = 0;
      return finish(state, s, { via: 'legend', z: rng.normal() }, T);
    }
  }

  const pool = species.filter((s) => !s.legend && eligible(s, ctx));
  if (!pool.length) return { junk: true, species: null, tier: 0, via: 'empty', z: 0 };
  const w = tierWeights(pool, ctx, state, T);
  const tier = rng.weighted(w);
  const s = pickInTier(pool, tier, ctx, rng);
  return finish(state, s, { via: 'tier', z: rng.normal() }, T);
}

function finish(state, s, o, T) {
  const p = state.fish.pity;
  p.rare = s.rarity >= 3 ? 0 : p.rare + 1;
  p.epic = s.rarity >= 4 ? 0 : p.epic + 1;
  return { species: s, junk: false, tier: s.rarity, via: o.via, z: o.z };
}

/** Variants roll on every catch, independent of the species. */
export function rollVariant(rng, ctx, T = TUNING) {
  const v = T.fishing.variants;
  if (rng.chance(v.golden)) return 'golden';
  if (rng.chance(v.albino)) return 'albino';
  if (ctx.events?.includes('halloween') && rng.chance(v.eventGhost)) return 'ghost';
  return '';
}

/** Applies a perfect-catch nudge to a pre-rolled size z. */
export function finalZ(z, { perfect, lure }, T = TUNING) {
  let out = z;
  if (perfect) out += T.fishing.perfectSizeNudge;
  if (lure && LURES[lure]?.sizeNudge) out += LURES[lure].sizeNudge;
  return out;
}

/** The value of a fish in gold. */
export function fishValue(s, sizeClass, variant, T = TUNING) {
  const e = T.economy;
  let v = e.rarityValue[s.rarity] * (e.sizeValueMult[sizeClass] || 1);
  if (variant) v *= e.variantValueMult[variant] || 1;
  return Math.max(1, Math.round(v));
}

/** Bite wait in seconds, shaped by rod, lure, frenzy and the bait. */
export function biteWait(rod, ctx, rng, T = TUNING) {
  if (ctx.frenzy) return T.fishing.hotspot.frenzyBiteMs / 1000;
  const [a, b] = rod.wait;
  let w = (a + rng() * (b - a)) * T.fishing.bobberWait;
  if (ctx.lure && LURES[ctx.lure]?.biteMult) w *= LURES[ctx.lure].biteMult;
  return w;
}

/** How long you get to react, in ms. */
export function reactWindow(rod, perks, ctx, { first = false } = {}, T = TUNING) {
  let w = rod.window;
  if (perks?.has('fishing.wide_window')) w *= 1.15;
  if (perks?.has('fishing.early_bang')) w += 400;
  if (ctx.lure && LURES[ctx.lure]?.windowMult) w *= LURES[ctx.lure].windowMult;
  if (first) w = Math.max(w, T.fishing.guaranteedFirstCatchWindowMs);
  return Math.round(w);
}

/** The anticipation tell: bite strength by rarity (the pulse rises before the reveal). */
export function tellFor(rarity) {
  // dip: bobber sinks this many px; shake: line shake amplitude; haptic: ms of buzz; pulses: extra twitches before the bang
  return [
    { dip: 0, shake: 0, haptic: 0, pulses: 0 },
    { dip: 4, shake: 0.6, haptic: 30, pulses: 0 },
    { dip: 6, shake: 0.9, haptic: 45, pulses: 1 },
    { dip: 8, shake: 1.3, haptic: 70, pulses: 2 },
    { dip: 10, shake: 1.8, haptic: 100, pulses: 3 },
    { dip: 12, shake: 2.4, haptic: 140, pulses: 4 },
  ][rarity];
}

// ---- hot spots and frenzies ---------------------------------------------------
export const HOT_SLOT_MS = () => TUNING.fishing.hotspot.everyHours * 3600e3;
export const hotSlot = (nowMs) => Math.floor(nowMs / HOT_SLOT_MS());
export const msToHotMove = (nowMs) => HOT_SLOT_MS() - (nowMs % HOT_SLOT_MS());

/** Hot spot tiles for a region in a slot: `candidates` is a list of [tx, ty] water tiles near the shore. */
export function hotSpots(region, slot, candidates, rng2, T = TUNING) {
  if (!candidates.length) return [];
  const n = Math.min(T.fishing.hotspot.perRegion, candidates.length);
  const r = rng2(`hot:${region}:${slot}`);
  const picks = [];
  const pool = candidates.slice();
  while (picks.length < n && pool.length) picks.push(pool.splice(r.int(pool.length), 1)[0]);
  return picks;
}

/** Minutes-of-day (from 4:00 reset) at which frenzies start today. */
export function frenzyTimes(day, rng2, T = TUNING) {
  const r = rng2(`frenzy:${day}`);
  const out = [];
  for (let i = 0; i < T.fishing.hotspot.frenzyPerDay; i++) out.push(Math.floor(r.range(7 * 60, 22 * 60)));
  return out.sort((a, b) => a - b);
}
export const inFrenzy = (minuteOfDay, starts, T = TUNING) => starts.some((s) => minuteOfDay >= s && minuteOfDay < s + T.fishing.hotspot.frenzyMinutes);

export { regionInfo };
