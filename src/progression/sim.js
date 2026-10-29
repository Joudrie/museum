// The headless player. It plays the real service (real rank, skills, fishing rolls, journal, tasks…)
// against a virtual clock and a seeded RNG, doing what a person does: cast, reel, talk, wander, sail,
// sell and shop, in sessions with gaps between them. `simulate()` returns a time series and a summary
// the tuning tables are made from (tools/sim_progression.mjs prints them).
import { TUNING } from './config.js';
import { createProgression } from './service.js';
import { createStore, memoryAdapter } from './store.js';
import { createClock } from './clock.js';
import { createRng } from './rng.js';
import { standardModules } from './modules.js';
import { instantQueue } from './rewardqueue.js';
import { prepareCast, completeCast, loseCast, newReel } from './angling.js';
import { playBot } from './reel.js';
import { allSpecies, REGIONS } from './species.js';
import NPCS from './data/npcs.json' with { type: 'json' };
import { completion } from './journal.js';
import { regionOpen as accessOpen } from './access.js';

export const PROFILES = {
  casual: { name: 'casual', efficiency: 0.5, skill: 0.45, minutesPerSession: 22, sessionsPerWeek: 5, mix: { fish: 0.6, explore: 0.2, social: 0.15, shop: 0.05 } },
  hardcore: { name: 'hardcore', efficiency: 1.0, skill: 0.85, minutesPerSession: 75, sessionsPerWeek: 7, mix: { fish: 0.6, explore: 0.2, social: 0.15, shop: 0.05 } },
};

const SEASONS = ['winter', 'spring', 'summer', 'autumn'];
const seasonOf = (ms) => SEASONS[[0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 0][new Date(ms).getMonth()]];

export function simulate({ hours = 12, profile = PROFILES.casual, seed = 1, T = TUNING, startMs = Date.UTC(2026, 5, 1, 9, 0), sampleMin = 10, quiet = true } = {}) {
  const rng = createRng(seed);
  let now = startMs;
  const clock = createClock({ now: () => now });
  const store = createStore(memoryAdapter(), { now: startMs });
  const q = instantQueue();
  const progress = []; // minute stamps of anything the player would see move
  q.onChange?.(() => {});
  const p = createProgression({ store, clock, rng: createRng(seed + 7), queue: q, T, modules: standardModules(), hooks: { hourNow: () => new Date(now).getHours() + new Date(now).getMinutes() / 60 } });
  p.start();

  let active = 0; // active minutes played
  const rows = [];
  let lastRowAt = -1e9;
  let lastTick = 0;
  let maxGap = 0;
  const gapOver3 = [];
  const marks = []; // active-minute stamps of visible progress
  const seenQueue = { n: 0 };
  const noteProgress = () => {
    while (seenQueue.n < q.log.length) {
      const it = q.log[seenQueue.n++];
      if (it.kind === 'xp' || it.kind === 'skill' || it.kind === 'species' || it.kind === 'rank' || it.kind === 'task' || it.kind === 'heart' || it.kind === 'request' || it.kind === 'milestone') marks.push(active);
    }
  };

  const regionNow = () => {
    // go where there is something new, as far as the unlocks allow
    const open = Object.keys(REGIONS).filter((r) => regionOpen(p, r));
    const fresh = open.filter((r) => allSpecies().some((s) => s.regions.includes(r) && !p.state.fish.species[s.id]?.n));
    return fresh.length ? fresh[Math.floor(rng() * fresh.length)] : open[Math.floor(rng() * open.length)];
  };
  let region = 'main';
  let regionUntil = 0;
  let weatherNow = 'clear';
  const rollWeather = () => {
    const r = rng();
    const winter = seasonOf(now) === 'winter';
    weatherNow = winter ? (r < 0.4 ? 'snow' : r < 0.5 ? 'fog' : 'clear') : r < 0.2 ? 'rain' : r < 0.3 ? 'fog' : 'clear';
  };

  const dayLen = 864e5;
  const sessionsPer = profile.sessionsPerWeek;
  let dayIdx = 0;
  const targetActive = hours * 60;

  const doFish = () => {
    const rod = p.state.fish.equipped.rod;
    const info = REGIONS[region] || REGIONS.main;
    const waters = info.waters.filter((w) => w !== 'ice');
    const water = waters[Math.floor(rng() * waters.length)] || 'sea';
    const plan = prepareCast(p, { mapId: (REGIONS[region] || REGIONS.main).maps[0], water, weather: weatherNow, hour: p.hourNow(), season: seasonOf(now), hotNear: rng() < 0.12, spotId: 'sim' });
    // a good player keeps the best bait on
    p.market?.autoBait?.(plan);
    const wait = plan.wait + plan.window / 2000;
    let reelSecs = 0;
    let won = true;
    let perfect = false;
    if (plan.species) {
      const reel = playBot(newReel(p, plan), profile.skill, rng);
      won = reel.won;
      perfect = reel.perfect;
      reelSecs = reel.t;
    }
    // the bite window: a weaker player sometimes misses the hook
    const missed = plan.species && rng() > Math.min(0.98, 0.7 + profile.skill * 0.3);
    if (missed || !won) loseCast(p, plan);
    else completeCast(p, plan, { perfect });
    // seconds: walk to water + cast + wait + reel + card + chain
    return (6 + wait + reelSecs + 3.5) / profile.efficiency;
  };
  const doExplore = () => {
    const chunks = 1 + Math.floor(rng() * 3);
    p.bus.emit('TILE_REVEALED', { region, count: chunks });
    if (rng() < 0.12) p.bus.emit('LOCATION_DISCOVERED', { region, placeId: `${region}:place${Math.floor(rng() * 6)}` });
    if (rng() < 0.08) p.bus.emit('SECRET_FOUND', { region, secretId: `${region}:secret${Math.floor(rng() * 8)}` });
    if (rng() < 0.2) p.bus.emit('ITEM_FORAGED', { itemId: ['shell', 'berry', 'pinecone', 'snowcrystal'][Math.floor(rng() * 4)], region });
    return 40 / profile.efficiency;
  };
  const doSocial = () => {
    const here = NPCS.filter((n) => n.region === region || n.region === 'main');
    const n = here[Math.floor(rng() * here.length)] || NPCS[0];
    p.bus.emit('NPC_TALKED', { npcId: n.id, kind: n.kind });
    p.market?.giftBest?.(n);
    return 14 / profile.efficiency;
  };
  const doShop = () => {
    p.market?.shopSession?.(profile);
    sellDuplicates(p);
    return 20 / profile.efficiency;
  };

  const session = (minutes) => {
    const endActive = active + minutes;
    p.start();
    clock.setLast(now);
    while (active < endActive && active < targetActive) {
      if (now >= regionUntil) {
        region = regionNow();
        regionUntil = now + (8 + rng() * 16) * 60e3;
        if (REGIONS[region] && region !== 'main') p.bus.emit('TRAVERSAL_USED', { kind: 'boat', region });
      }
      const r = rng();
      const m = profile.mix;
      const secs = r < m.fish ? doFish() : r < m.fish + m.explore ? doExplore() : r < m.fish + m.explore + m.social ? doSocial() : doShop();
      now += secs * 1000;
      active += secs / 60;
      p.tick(secs * 1000);
      noteProgress();
      if (active - lastRowAt >= sampleMin) {
        lastRowAt = active;
        rows.push(row());
      }
    }
    p.end();
  };

  const row = () => {
    const lv = p.level();
    const sp = allSpecies();
    const have = sp.filter((s) => p.state.fish.species[s.id]?.n).length;
    return { activeMin: Math.round(active), day: dayIdx, rank: lv.level, xp: p.state.rank.xp, fishing: p.skill('fishing').level, sailing: p.skill('sailing').level, exploring: p.skill('exploring').level, friendship: p.skill('friendship').level, species: have, speciesPct: Math.round((100 * have) / sp.length), gold: Math.round(p.gold.get()), spent: Math.round(p.state.market.spent), catches: p.state.fish.catches };
  };

  // days: sessions on `sessionsPerWeek` days, always a gap in between
  while (active < targetActive) {
    const dow = dayIdx % 7;
    const plays = dow < sessionsPer;
    if (plays) {
      now = startMs + dayIdx * dayLen + (7 + rng() * 15) * 3600e3; // people play at all hours
      rollWeather();
      session(profile.minutesPerSession * (0.7 + rng() * 0.6));
    }
    dayIdx += 1;
  }

  // reach times
  const reach = {};
  const rm = p.state.telemetry.rankMinutes;
  [2, 3, 5, 10, 15, 20, 30, 40, 50].forEach((n) => (reach[n] = rm[n] ?? null));
  // the longest stretch of active play with no visible progress tick
  marks.sort((a, b) => a - b);
  let prev = 0;
  marks.forEach((m) => {
    maxGap = Math.max(maxGap, m - prev);
    prev = m;
  });
  const first = {
    rank5: rm[5] ?? null,
    traversal: p.state.telemetry.first.traversal_unlock ? Math.round((p.state.telemetry.first.traversal_unlock - startMs) / 60000) : null,
  };
  return { p, rows, reach, maxGapMin: maxGap, activeMin: Math.round(active), summary: row(), first, journal: ['fish', 'people', 'places', 'emotes', 'secrets'].map((id) => [id, Math.round(completion(p, id).pct)]) };
}

// ---- helpers (the market module owns the real versions; these keep the sim honest without it) ----
export const regionOpen = (p, id) => accessOpen(p.state, id, p.T);

function sellDuplicates(p) {
  if (p.market?.sellDuplicates) return p.market.sellDuplicates();
  const f = p.state.fish;
  const keep = new Map();
  f.bag.forEach((b, i) => {
    const k = keep.get(b.id);
    if (k === undefined || b.value > f.bag[k].value) keep.set(b.id, i);
  });
  const keepIdx = new Set(keep.values());
  let gold = 0;
  f.bag = f.bag.filter((b, i) => {
    if (keepIdx.has(i)) return true;
    gold += Math.round(b.value * p.T.economy.sellMult);
    return false;
  });
  if (gold) p.gold.add(gold);
  return gold;
}
