// Step 10, rerun on the build with the progression layer (#195): a Monte Carlo of every roll a player meets,
// played through the layer's own code.
//
// Fishing is not modelled: each cast calls the layer's prepareCast / playBot / completeCast (src/progression/),
// so species, conditions, rarity weights, pity, hot spots, sizes, variants, the reel, XP, ranks, skills, tasks,
// requests, the market and the login calendar all run as they do in the game. Around it, from data/params.json
// (export_params.mjs, the game's own pick() and calendar): digs, the metal detector and the X, museum guests and
// their gifts, expeditions in lead order, and the Gallery Shop's real shelf. The world layer's secrets, viewpoints,
// fog and sparkles are placed by the game at random, so finding them is an assumption (common.py).
//
//   node --import ./docs/progression/tools/register.mjs docs/progression/models/montecarlo.mjs
//   SCALE=1 (players per run: SIZES below, times SCALE; N=… sets them all)  DAYS=90  WORKERS=2  ONLY=regular
//   VARIANTS=base,nopity,strip,twoshops,regionfix  STARTS='autumn start (today)'  OUT=<dir> (default data/)
// Reads data/params.json and data/assumptions.json (python3 docs/progression/models/common.py writes it).
// Writes data/mc_summary.json and data/mc_summary.csv (the same shape the Python tables and plots read).
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = join(HERE, '..');
const SRC = join(DOCS, '..', '..', 'src');
const DATA = join(DOCS, 'data');
const PARAMS = JSON.parse(readFileSync(join(DATA, 'params.json'), 'utf8'));
const ASM = JSON.parse(readFileSync(join(DATA, 'assumptions.json'), 'utf8'));
const A = ASM.assumptions;
const DAYS = Number(process.env.DAYS || 90);
// day 0 at local midnight: the export's pinned start (params.json modelStart), so a rerun on another day
// gives the same numbers; run_all.py and check_repro.py run in New York time
const START_MS = ((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime())(new Date(PARAMS.modelStart || Date.now()));

// ---------- percentiles that treat 'never' as larger than anything (as common.py pct) ----------
function pct(arr, qs = [10, 50, 90, 99]) {
  const a = arr.map((x) => (x === null || x === undefined || Number.isNaN(x) ? Infinity : x)).sort((x, y) => x - y);
  return Object.fromEntries(qs.map((q) => [`P${q}`, a.length ? a[Math.min(a.length - 1, Math.ceil((q / 100) * a.length) - 1)] : Infinity]));
}

// ---------- one simulated player ----------
async function makeWorld() {
  const imp = (p) => import(join(SRC, p));
  const svc = await imp('progression/service.js');
  const st = await imp('progression/store.js');
  const clk = await imp('progression/clock.js');
  const rngm = await imp('progression/rng.js');
  const mods = await imp('progression/modules.js');
  const rq = await imp('progression/rewardqueue.js');
  const ang = await imp('progression/angling.js');
  const reel = await imp('progression/reel.js');
  const fr = await imp('progression/fishroll.js');
  const spm = await imp('progression/species.js');
  const acc = await imp('progression/access.js');
  const cfg = await imp('progression/config.js');
  const fl = await imp('progression/friendship.js');
  const codex = await imp('collections/codex.js');
  const msm = await imp('collections/milestones.js');
  const shopm = await imp('collections/shop.js');
  const reg = await imp('collections/index.js');
  const flags = await imp('measure/flags.js');
  const { resetStorage } = await import(join(DOCS, 'tools', 'shim.mjs'));
  return { svc, st, clk, rngm, mods, rq, ang, reel, fr, spm, acc, cfg, fl, codex, msm, shopm, reg, flags, resetStorage };
}

const ENTRY = Object.fromEntries(PARAMS.entries.map((e) => [e.id, e]));
const ISL = Object.fromEntries(PARAMS.islands.map((i) => [i.id, i]));
const EXPS = Object.fromEntries(PARAMS.islands.filter((i) => i.expedition).map((i) => [i.expedition.id, { ...i.expedition, map: i.id }]));
const LEADS = Object.fromEntries(PARAMS.leads.map((l) => [l.id, l]));
const CLIMATE = PARAMS.fishing.expeditionClimates;
const SHELF = PARAMS.shop.shelf.map((s) => s.ids);
const GIFT_POOL = Object.fromEntries(['mineral', 'fossil'].map((c) => [c, PARAMS.entries.filter((e) => e.collection === c && e.rarity <= PARAMS.chatter.findMaxRarity && !e.parts && !e.junk).map((e) => e.id)]));
const kinds = PARAMS.chatter.giftKinds;
const GIFT_MINERAL_SHARE = Object.values(kinds).filter((v) => v.includes('find:mineral')).length / Math.max(1, Object.values(kinds).filter((v) => v.some((x) => x.startsWith('find'))).length);
const DIG_COLLS = new Set(PARAMS.dig.foundCollections);
const WHEEL_EV = Object.entries(PARAMS.daily.wheel).reduce((s, [g, p]) => s + Number(g) * p, 0);
const SETS = PARAMS.sets.filter((s) => s.collection !== 'painting' && s.collection !== 'visitor');

function cumTable(d) {
  const ids = Object.keys(d);
  let c = 0;
  return { ids, cum: ids.map((k) => (c += d[k])) };
}
const DT = Object.fromEntries(Object.entries(PARAMS.dig.table).map(([k, v]) => [k, cumTable(v)]));

// everything something in this model can hand out: fish that can ever bite, the dig kinds some island has, what the
// metal detector and the X give, expedition finds, the shelf's next 400 days and the guests' gifts
const OBTAINABLE = (() => {
  const out = new Set();
  const never = new Set(PARAMS.fishing.neverBites.map((s) => s.id));
  PARAMS.fishing.species.filter((s) => !never.has(s.id)).forEach((s) => out.add(s.entryId));
  const homeKinds = new Set(PARAMS.islands.flatMap((i) => i.digs));
  for (const [k, t] of Object.entries(PARAMS.dig.table)) {
    const [kind, tool] = k.split('|');
    if ((homeKinds.has(kind) && tool === 'brush') || k === 'ruin|brush' || k === 'ruin|bonus') Object.keys(t).forEach((id) => ENTRY[id] && !ENTRY[id].junk && out.add(id));
  }
  for (const ex of Object.values(EXPS)) for (const c of [...ex.digs, ...ex.chests.flat()]) PARAMS.entries.filter((e) => e.collection === c && !e.parts && !e.junk).forEach((e) => out.add(e.id));
  SHELF.forEach((ids) => ids.forEach((id) => ENTRY[id] && out.add(id)));
  Object.values(GIFT_POOL).forEach((ids) => ids.forEach((id) => out.add(id)));
  return out;
})();
const OBT_BY_COL = {};
OBTAINABLE.forEach((id) => (OBT_BY_COL[ENTRY[id].collection] = (OBT_BY_COL[ENTRY[id].collection] || 0) + 1));
const NEVER_FISH = PARAMS.fishing.species.length - PARAMS.fishing.species.filter((s) => !PARAMS.fishing.neverBites.some((n) => n.id === s.id)).length;
const drawFrom = (t, u) => t.ids[Math.min(t.ids.length - 1, t.cum.findIndex((c) => u * t.cum[t.cum.length - 1] < c))];

function simulate(W, profName, prof, idx, startDay, variant) {
  const { svc, st, clk, rngm, mods, rq, ang, reel, fr, spm, acc, cfg, fl, codex, msm, shopm } = W;
  const T = cfg.TUNING;
  const seed = (ASM.seed ^ (idx * 2654435761)) >>> 0;
  const rng = rngm.createRng(seed); // the player's own choices
  const botRng = rngm.createRng(seed ^ 0x9e3779b9);
  let now = START_MS + startDay * 864e5;
  let gold = PARAMS.economy.startCoins;
  const goldBy = {};
  const addGold = (n, why) => {
    gold += n;
    if (n > 0) goldBy[why] = (goldBy[why] || 0) + n;
  };
  // a progress tick: anything the player sees move. The layer's reward queue (an XP pop, a skill bar, a card: the
  // layer's own measure), and the older systems' own cards (a dig's find, a guest's gift, a shelf piece).
  let ticks = 0;
  let lastTick = 0;
  let maxTickGap = 0;
  let tActive = 0; // active minutes
  const seeProgress = () => {
    ticks++;
    if (tActive <= 600) maxTickGap = Math.max(maxTickGap, tActive - lastTick);
    lastTick = tActive;
  };
  const log = { push: seeProgress };
  const queue = rq.instantQueue(log);
  let goldWhy = 'layer payouts: ranks, tasks, requests, calendar, journal';
  const calOf = (ms) => PARAMS.calendar[Math.min(PARAMS.calendar.length - 1, Math.floor((ms - START_MS) / 864e5))];
  const hourOf = (ms) => new Date(ms).getHours() + new Date(ms).getMinutes() / 60;
  const store = st.createStore({ read: () => null, write: () => {} }, { now });
  const p = svc.createProgression({
    store,
    clock: clk.createClock({ now: () => now }),
    rng: rngm.createRng(seed ^ 0x51ed),
    queue,
    modules: mods.standardModules(),
    hooks: {
      gold: { get: () => gold, add: (n) => addGold(n, goldWhy) },
      collect: (id, o) => noteCollect(id, o, 'fishing'),
      hourNow: () => hourOf(now),
      weatherToday: () => calOf(now).weather,
    },
  });
  p.state.installAt = now + idx; // the layer seeds hot spots and the board by install time
  p.start();
  if (W.flags.unlockAll()) p.state.fish.equipped.rod = 'golden'; // the strip build: every rod from the start, so the best one
  const sess = { first: true };

  // ---- novelty ----
  const firsts = {}; // metric -> active minute
  const firstDay = {};
  let lastNovel = 0;
  let maxGap = 0;
  const novelByDay = new Array(DAYS).fill(0);
  const srcDay = {};
  const actDay = {};
  let day = 0;
  const first = (metric) => {
    if (firsts[metric] === undefined) {
      firsts[metric] = tActive;
      firstDay[metric] = day;
    }
  };
  const novel = (src, metric) => {
    if (tActive <= 600) maxGap = Math.max(maxGap, tActive - lastNovel);
    lastNovel = tActive;
    novelByDay[day] += 1;
    srcDay[src] = srcDay[src] || new Array(DAYS).fill(0);
    srcDay[src][day] += 1;
    if (metric) first(metric);
  };
  const spend = (minutes, what) => {
    tActive += minutes;
    now += minutes * 60e3;
    actDay[what] = actDay[what] || new Array(DAYS).fill(0);
    actDay[what][day] += minutes;
    p.tick(minutes * 60e3);
  };
  const seen = new Set();
  const parts = {};
  let obtSeen = 0;
  const colSeen = {};
  function noteCollect(id, o = {}, src) {
    const e = ENTRY[id];
    if (!e) return;
    if (src !== 'fishing') seeProgress(); // a dig, a gift, a shelf piece or an expedition find shows its own card (a catch already did)
    if (e.parts) {
      parts[id] = (parts[id] || 0) + 1;
      if (parts[id] < e.parts || seen.has(id)) return;
    }
    codex.collect(id, { size: o.size });
    if (seen.has(id)) return;
    seen.add(id);
    novel(src);
    if (OBTAINABLE.has(id)) {
      obtSeen++;
      for (const f of [25, 50, 75, 100]) if (obtSeen >= (f / 100) * OBTAINABLE.size) first(`${f}% of everything obtainable`);
      const c = e.collection;
      colSeen[c] = (colSeen[c] || 0) + 1;
      if (colSeen[c] === OBT_BY_COL[c]) first(`page complete: ${c}`);
    }
    if (e.rarity >= 3) first('first rare (rarity 3+)');
    if (e.rarity >= 4) first('first epic or better (rarity 4+)');
    if (e.rarity >= 5) first('first legendary (rarity 5)');
    if (e.collection === 'fish') {
      const n = [...seen].filter((x) => ENTRY[x]?.collection === 'fish').length;
      for (const k of [10, 25, 40, 60]) if (n >= k) first(`${k} fish species`);
    }
  }
  // the layer's own new things: variants, a species' first trophy, places, secrets, people, unlocks
  const trophies = new Set();
  const people = new Set();
  p.bus.on('FISH_CAUGHT', (ev) => {
    if (p.last?.freshVariant) novel('fishing: variant', 'first colour variant');
    if (ev.sizeClass === 'Trophy' && !trophies.has(ev.speciesId)) {
      trophies.add(ev.speciesId);
      novel('fishing: trophy', 'first trophy size');
    }
  });
  p.bus.on('NPC_TALKED', ({ npcId }) => {
    if (!npcId.startsWith('anon:') && !people.has(npcId)) {
      people.add(npcId);
      novel('people');
    }
  });
  const places = new Set();
  const place = (type, region, id) => {
    if (places.has(id)) return;
    places.add(id);
    p.bus.emit(type, type === 'SECRET_FOUND' ? { region, secretId: id } : { region, placeId: id });
    novel(type === 'SECRET_FOUND' ? 'exploring: secret' : 'exploring: place');
  };
  let unlocks = new Set(Object.keys(p.state.unlocks));
  const checkUnlocks = () => {
    for (const k of Object.keys(p.state.unlocks))
      if (!unlocks.has(k)) {
        unlocks.add(k);
        if (!k.startsWith('recipe:')) novel('unlock', `unlock: ${k}`);
      }
  };
  const rank = () => p.level().level;
  const rankMarks = [2, 5, 10, 15, 20, 30, 40, 50];
  const checkRank = () => rankMarks.forEach((r) => rank() >= r && first(`rank ${r}`));

  // ---- the world ----
  const regionOfIsland = (isl) => spm.regionOfMap(isl === 'main-island' ? 'main' : isl);
  const open = (region) => acc.regionOpen(p.state, region);
  const climateOf = (region, ms) => {
    const map = spm.REGIONS[region]?.maps?.[0];
    const c = CLIMATE[map];
    const cal = calOf(ms);
    return { season: c?.season || cal.season, weather: c?.weather || cal.weather };
  };
  // The world layer (ui/worldlife.js, islandlife.js) looks an island up by the scene's regionKey, which is the
  // map id (IslandScene.js:130: 'main', 'one', 'isle-1', 'exp-pirate'…), while regions.json and npcs.json use
  // region ids ('isle', 'pirate'…). Only Main Island and Island One match. So, as built, every other island gets
  // 3 secrets and no legend clue, no named islanders and no "new place" stamp for the island itself. The
  // 'regionfix' variant plays the world as regions.json describes it.
  const fixed = variant === 'regionfix';
  const worldKey = (region) => (fixed ? region : spm.REGIONS[region]?.maps?.[0] === 'one' ? 'one' : spm.REGIONS[region]?.maps?.[0] || region);
  const secretsOf = (region) => {
    const key = worldKey(region);
    const info = spm.REGIONS[key];
    const n = info?.secrets ?? 3;
    const legendId = info?.legend;
    const locks = [null, null, 'gear:gloves', null, 'gear:lantern', null, 'gear:boots'];
    const out = [];
    for (let i = 0; i < n; i++) {
      const clue = i === 0 && legendId && spm.LEGENDS[legendId];
      out.push({ type: 'SECRET_FOUND', id: clue ? `${key}:${spm.LEGENDS[legendId].clue.secret}` : `${key}:s${i}`, needs: !clue && i > 0 ? locks[i % locks.length] : null });
    }
    out.push({ type: 'LOCATION_DISCOVERED', id: `${key}:view1`, needs: null }, { type: 'LOCATION_DISCOVERED', id: `${key}:view2`, needs: 'gear:gloves' });
    return out;
  };
  const chunks = {};
  let here = 'main';
  const goTo = (region) => {
    if (region === here) return;
    spend(A.sail_min, 'sailing');
    p.bus.emit('TRAVERSAL_USED', { kind: 'boat', region });
    here = region;
    if (spm.REGIONS[worldKey(region)]) place('LOCATION_DISCOVERED', region, `${worldKey(region)}:island`);
    greet();
  };
  // the first arrival of the day on an island: its named people stand near the dock
  const greeted = {};
  const greet = () => {
    if (greeted[here] === day) return;
    greeted[here] = day;
    talkNamed();
  };
  const explore = (minutes, label = 'exploring') => {
    const items = secretsOf(here).filter((s) => !places.has(s.id) && (!s.needs || p.state.unlocks[s.needs] || W.flags.unlockAll()));
    const pFind = 1 - Math.exp(-1 / A.explore_find_mean_min);
    for (let m = 0; m < minutes; m++) {
      spend(1, label);
      const c = (chunks[here] = chunks[here] || 0);
      if (c < A.chunks_per_island) {
        const k = Math.min(A.chunks_per_explore_min, A.chunks_per_island - c);
        chunks[here] += k;
        p.bus.emit('TILE_REVEALED', { region: here, count: k, chunks: Array.from({ length: k }, (_, i) => `${c + i}`) });
      }
      if (rng() < A.forage_per_explore_min) p.bus.emit('ITEM_FORAGED', { itemId: ['shell', 'berry', 'pinecone', 'flower'][rng.int(4)], region: here });
      items.forEach((s) => !places.has(s.id) && rng() < pFind && place(s.type, here, s.id));
    }
    checkUnlocks();
    checkRank();
  };
  const talkNamed = () => {
    // the island's named people (islandlife.js placeNamed: n.region === the scene's regionKey, Edmund aside)
    for (const npc of W.fl.NPCS.filter((n) => n.region === worldKey(here) && n.id !== 'edmund')) {
      spend(A.named_talk_s / 60, 'people');
      p.bus.emit('NPC_TALKED', { npcId: npc.id, kind: npc.kind });
      for (const r of p.requests.forNpc(npc.id)) if (r.canDeliver) p.requests.deliver(r.id);
      p.market.giftBest(npc);
    }
  };

  // ---- fishing ----
  const unseenShare = (ctx) => {
    // the chance a cast here and now lands a species you have never caught (from the layer's own weights)
    const pool = spm.allSpecies().filter((s) => !s.legend && fr.eligible(s, ctx));
    if (!pool.length) return 0;
    const w = fr.tierWeights(pool, ctx, p.state, T);
    const tot = w.reduce((a, b) => a + b, 0);
    if (!tot) return 0;
    let pNew = 0;
    for (let t = 1; t <= 4; t++) {
      if (!w[t]) continue;
      const inT = pool.filter((s) => s.rarity === t);
      pNew += (w[t] / tot) * (inT.filter((s) => !p.state.fish.species[s.id]?.n).length / inT.length);
    }
    return pNew * (1 - T.fishing.junkChance);
  };
  const waterOf = (region, water, season) => {
    const info = spm.regionInfo(region);
    return water === 'pond' && season === 'winter' && info.freezes ? 'ice' : info.iceAlways ? 'ice' : water;
  };
  const ctxFor = (region, water) => {
    const { season, weather } = climateOf(region, now);
    const info = spm.regionInfo(region);
    return fr.makeContext({ region, wild: !!info.wild, water: waterOf(region, water, season), hour: hourOf(now), weather, season, perks: p.perks(), events: p.activeEventIds?.() || [] });
  };
  const chase = () => {
    // a legend whose clue you hold, that can bite somewhere open right now: go there with its bait
    if (!prof.smart) return null;
    for (const s of spm.legends()) {
      if (p.state.fish.species[s.id]?.n) continue;
      const trail = p.state.journal.leads[`legend:${s.id}`];
      if (!trail || (trail.stage !== 'clue' && trail.stage !== 'ready')) continue;
      for (const r of s.regions.filter(open))
        for (const w of s.waters) {
          const ctx = { ...ctxFor(r, w), bait: s.legend.bait, hot: s.legend.spot === 'hot' };
          if (fr.eligible(s, ctx)) return { region: r, water: w, bait: s.legend.bait, hot: s.legend.spot === 'hot' };
        }
    }
    return null;
  };
  const choose = () => {
    const regions = Object.keys(spm.REGIONS).filter(open);
    if (!prof.smart) {
      const r = rng() < prof.roam ? regions[rng.int(regions.length)] : here;
      const ws = spm.regionInfo(r).waters.filter((w) => w !== 'ice');
      return { region: r, water: ws[rng.int(ws.length)] || 'sea' };
    }
    let best = null;
    for (const r of regions)
      for (const w of spm.regionInfo(r).waters.filter((x) => x !== 'ice')) {
        const v = unseenShare(ctxFor(r, w)) - (r === here ? 0 : 0.002); // a crossing costs a little
        if (!best || v > best.v) best = { region: r, water: w, v };
      }
    return best.v > 0 ? best : { region: here, water: spm.regionInfo(here).waters.find((w) => w !== 'ice') || 'sea' };
  };
  const castOnce = (region, water, hot) => {
    const { season, weather } = climateOf(region, now);
    const plan = ang.prepareCast(p, { mapId: spm.REGIONS[region]?.maps?.[0] || 'main', water, weather, hour: hourOf(now), season, hotNear: hot, spotId: 'mc' });
    let secs = A.cast_overhead_s + plan.wait;
    // a full bag sells its cheapest fish on the spot (fishevents.js); otherwise gold during a cast is a payout
    goldWhy = p.state.fish.bag.length >= 80 ? 'market: selling fish' : 'layer payouts: ranks, tasks, requests, calendar, journal';
    if (plan.species) {
      if (rng() < prof.fail) ang.loseCast(p, plan);
      else {
        const r = reel.playBot(ang.newReel(p, plan), prof.skill, botRng);
        secs += r.t;
        if (r.won) ang.completeCast(p, plan, { perfect: r.perfect });
        else ang.loseCast(p, plan);
      }
    } else ang.completeCast(p, plan, {});
    spend(secs / 60, 'fishing');
  };
  const fish = (minutes) => {
    let left = minutes;
    while (left > 0.05) {
      const c = chase();
      const pick = c || choose();
      if (pick.region !== here) {
        goTo(pick.region);
        left -= A.sail_min;
      }
      if (c) p.state.fish.equipped.bait = p.state.fish.baits[c.bait] > 0 ? c.bait : p.state.fish.equipped.bait;
      else if (prof.smart) p.market.autoBait({});
      for (let k = 0; k < 25 && left > 0.05; k++) {
        const t0 = tActive;
        castOnce(here, pick.water, c ? c.hot : rng() < prof.hot_share);
        left -= tActive - t0;
      }
      checkUnlocks();
      checkRank();
    }
  };
  const shop = () => {
    goldWhy = 'layer payouts: ranks, tasks, requests, calendar, journal';
    if (variant === 'twoshops') {
      // also sell your copies of each fish in the Gallery Shop (Storage → Sell), keeping one of each
      const c = codex.snapshot();
      for (const [id, n] of Object.entries(c.owned)) {
        const e = ENTRY[id];
        if (e?.collection !== 'fish' || n <= 1) continue;
        for (let k = 1; k < n; k++) if (codex.sellOne(id, now)) addGold(shopm.sellPrice(W.reg.get(id)), 'Gallery Shop: selling fish');
      }
    }
    // the bag at the market, then the ladder, the town fund, bait, the best rod (the layer's own shopping helper)
    if (prof.smart) {
      // a careful player also buys the bait a legend they are chasing needs
      for (const s of spm.legends()) {
        const trail = p.state.journal.leads[`legend:${s.id}`];
        if (trail && (trail.stage === 'clue' || trail.stage === 'ready') && !p.state.fish.species[s.id]?.n && !(p.state.fish.baits[s.legend.bait] > 0)) p.market.buy(`bait:${s.legend.bait}`);
      }
    }
    const sell = p.market.sellDuplicates;
    p.market.sellDuplicates = () => {
      goldWhy = 'market: selling fish';
      const g = sell();
      goldWhy = 'layer payouts: ranks, tasks, requests, calendar, journal';
      return g;
    };
    p.market.shopSession(prof);
    p.market.sellDuplicates = sell;
    // the museum's own payouts, claimed by tap: codex milestones and sets
    goldWhy = 'codex milestones and sets';
    for (const m of msm.milestones()) if (m.reached && !m.claimed) addGold(msm.claimMilestone(m.pct), 'codex milestones and sets');
    for (const s of SETS) {
      if (sets.has(s.id) || !s.entries.every((e) => seen.has(e))) continue;
      sets.add(s.id);
      addGold(s.gold, 'codex milestones and sets');
    }
    checkUnlocks();
    checkRank();
  };
  const sets = new Set();

  // ---- the older systems around the layer (from params.json) ----
  const leadHave = {};
  const islandDone = {};
  let sessionsPlayed = 0;
  let digsToday = 0;
  let digPaidDay = -1;
  const dig = (key, src) => {
    const id = drawFrom(DT[key], rng());
    if (id && id !== 'junk') noteCollect(id, {}, src);
  };
  const found = () => [...seen].filter((x) => DIG_COLLS.has(ENTRY[x]?.collection)).length;
  const mapPieces = () => [...seen].filter((x) => ENTRY[x]?.collection === 'map');
  let mapsUsed = 0;
  const unlockTools = () => {
    for (const [what, need] of [['tool: trowel (6 finds)', 6], ['metal detector (10 finds)', 10], ['tool: pick (16 finds)', 16]])
      if (found() >= need && firsts[what] === undefined) novel('unlock', what);
  };
  const hunt = (isl) => {
    // the metal detector's three buried things, and the X once all four map pieces are in hand
    for (let k = 0; k < PARAMS.dig.huntTargetsPerIslandPerDay; k++) {
      spend(A.hunt_s / 60, 'metal detector');
      dig('ruin|brush', 'metal detector');
    }
    const maps = PARAMS.entries.filter((e) => e.collection === 'map').length;
    if (ISL[isl]?.xMarks && mapPieces().length >= maps && mapsUsed < 1) {
      spend(A.dig_s / 60, 'the X');
      dig('ruin|bonus', 'the X');
      mapsUsed++;
      if (firsts['X dug (four map pieces)'] === undefined) novel('the X', 'X dug (four map pieces)');
    }
  };
  // a session starts in the museum on Main Island and goes out from there, one island after another (no going back)
  let capAt = 0; // the older systems' share of a session ends at this active minute
  const busy = () => tActive >= capAt;
  const museum = (si) => {
    if (si === 0) {
      // the caretaker behind the ticket desk (RoomScene emits NPC_TALKED for him)
      spend(A.named_talk_s / 60, 'people');
      p.bus.emit('NPC_TALKED', { npcId: 'edmund', kind: 'caretaker' });
      for (const r of p.requests.forNpc('edmund')) if (r.canDeliver) p.requests.deliver(r.id);
    }
    // museum guests (the museum is on Main Island, where every session starts)
    for (let k = 0; k < prof.talks && !busy(); k++) {
      spend(A.talk_s / 60, 'guests');
      p.bus.emit('NPC_TALKED', { npcId: `anon:visitor:${k}`, kind: 'visitor' });
      const gives = rng() < A.pleased_share + (1 - A.pleased_share) * PARAMS.chatter.giftChance;
      if (!gives) continue;
      if (rng() < A.gift_find_share) {
        const pool = GIFT_POOL[rng() < GIFT_MINERAL_SHARE ? 'mineral' : 'fossil'];
        noteCollect(pool[rng.int(pool.length)], {}, 'guest gift');
      } else {
        seeProgress();
        addGold(Math.round(PARAMS.chatter.goldRange[0] + rng() * (PARAMS.chatter.goldRange[1] - PARAMS.chatter.goldRange[0])), 'daily gift, wheel, dig goal, guests');
      }
    }
  };
  const olderSystems = (si, cal) => {
    museum(si);
    // home islands: dig every spot (each rests 10 min: once a session), talk to who lives there, walk about,
    // and run the metal detector on the first visit of the day
    for (const isl of prof.islands) {
      const region = regionOfIsland(isl);
      if (!open(region)) continue;
      goTo(region);
      for (const kind of ISL[isl]?.digs || []) {
        if (busy()) break;
        spend(A.dig_s / 60, 'dig');
        dig(`${kind}|brush`, 'dig');
        digsToday++;
      }
      unlockTools();
      if (si === 0 && !busy() && prof.hunt_islands.includes(isl) && firsts['metal detector (10 finds)'] !== undefined) hunt(isl);
      greet(); // the first visit of the day (first talks are what move a friendship)
      explore(Math.round((prof.session_min * prof.explore_share) / Math.max(1, prof.islands.length)));
    }
    if (digsToday >= PARAMS.dig.dailyGoal && digPaidDay !== day) {
      digPaidDay = day;
      addGold(PARAMS.dig.dailyGold, 'daily gift, wheel, dig goal, guests');
    }
    // an expedition, in lead order (the boat to it is the layer's: rowboat, sailboat, ice hull)
    if (sessionsPlayed >= prof.opens_boat_session && !leadHave['bottle-note']) {
      leadHave['bottle-note'] = true;
      novel('lead', 'first lead (bottle note)');
    }
    if (sessionsPlayed % prof.expedition_every === 0)
      for (const [lid, l] of Object.entries(LEADS)) {
        const ex = EXPS[l.island];
        if (!ex || !leadHave[lid] || islandDone[l.island]) continue;
        const region = spm.regionOfMap(ex.map);
        if (!open(region)) continue;
        goTo(region);
        explore(A.expedition_min, 'expedition'); // an expedition is walking its island
        for (const c of [...ex.digs, ...ex.chests.flat()]) {
          const pool = PARAMS.entries.filter((e) => e.collection === c && !e.parts && !e.junk);
          if (!pool.length) continue;
          const unseen = pool.filter((e) => !seen.has(e.id));
          const from = rng() < PARAMS.expeditionFreshBias && unseen.length ? unseen : pool;
          const w = from.map((e) => Math.max(0.05, 5 - e.rarity));
          let u = rng() * w.reduce((a, b) => a + b, 0);
          const pick = from.find((e, i) => (u -= w[i]) <= 0) || from[0];
          noteCollect(pick.id, {}, 'expedition');
        }
        islandDone[l.island] = true;
        novel('expedition', `expedition done: ${l.island}`);
        for (const nxt of l.then) if (LEADS[nxt]) leadHave[nxt] = true;
        break;
      }
    // the Gallery Shop shelf (free while FREE is on): anything new on today's shelf
    if (si === 0 && PARAMS.economy.FREE) for (const id of SHELF[(startDay + day) % SHELF.length] || []) if (!seen.has(id)) noteCollect(id, {}, 'gallery shop');
    // the old daily gift and wheel (daily.js still pays them; its streak became the layer's)
    if (si === 0) addGold(PARAMS.daily.giftByStreak[Math.min(p.state.streak.count, PARAMS.daily.giftByStreak.length - 1)] + WHEEL_EV, 'daily gift, wheel, dig goal, guests');
    checkUnlocks();
    checkRank();
  };

  // ---- 90 days ----
  const sessDay = new Array(DAYS).fill(0);
  for (day = 0; day < DAYS; day++) {
    if (rng() >= prof.play_prob) continue;
    digsToday = 0;
    const cal = PARAMS.calendar[startDay + day];
    prof.sessions.forEach(([h0, h1], si) => {
      const hour = Math.min(23.9, h0 + rng() * (h1 - h0));
      const at = START_MS + (startDay + day) * 864e5 + hour * 3600e3;
      if (at > now) now = at;
      sessionsPlayed++;
      sessDay[day]++;
      p.start();
      here = 'main';
      goldWhy = 'layer payouts: ranks, tasks, requests, calendar, journal';
      p.streak?.claim?.(); // the login calendar, claimed on the first visit of the day
      const t0 = tActive;
      capAt = t0 + prof.session_min * prof.older_share;
      olderSystems(si, cal);
      fish(Math.max(1, prof.session_min - (tActive - t0)));
      shop();
      p.end();
    });
    if (firsts['rank 2'] === undefined) checkRank();
  }
  const fishSeen = [...seen].filter((x) => ENTRY[x]?.collection === 'fish').length;
  return {
    firsts,
    firstDay,
    maxGap,
    maxTickGap,
    novelByDay,
    srcDay,
    actDay,
    activeMin: tActive,
    sinceNovel: tActive - lastNovel,
    fishSeen,
    seenShare: obtSeen / OBTAINABLE.size,
    rank: rank(),
    gold,
    goldBy,
    spent: p.state.market.spent,
    bought: Object.keys(p.state.market.bought).length,
    plays: sessionsPlayed,
    sessDay,
    legends: [...seen].filter((x) => ENTRY[x]?.collection === 'fish' && ENTRY[x].rarity >= 5).length,
    people: people.size,
    secrets: [...places].filter((x) => !x.includes(':view') && !x.endsWith(':island')).length,
  };
}

// ---------- the job runner ----------
const VARIANTS = (process.env.VARIANTS || 'base,nopity,strip,twoshops,regionfix').split(',');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : Object.keys(ASM.profiles);
// players per run: heavy players cost most (three long sessions a day), so they get fewer
const SIZES = { base: { casual: 800, regular: 800, heavy: 160 }, variant: { casual: 320, regular: 320, heavy: 80 }, spring: { casual: 400, regular: 400, heavy: 80 } };
const SCALE = Number(process.env.SCALE || 1);
const ONLY_VARIANT_FOR = { twoshops: ['regular'] }; // the economy question only needs one profile
function jobs() {
  const out = [];
  const starts = process.env.STARTS ? process.env.STARTS.split(',') : Object.keys(A.start_offsets_days);
  for (const [startName, startDay] of Object.entries(A.start_offsets_days).filter(([k]) => starts.includes(k)))
    for (const prof of ONLY)
      for (const variant of VARIANTS) {
        if (startName !== 'autumn start (today)' && variant !== 'base') continue;
        if (ONLY_VARIANT_FOR[variant] && !ONLY_VARIANT_FOR[variant].includes(prof)) continue;
        const size = startName !== 'autumn start (today)' ? SIZES.spring : variant === 'base' ? SIZES.base : SIZES.variant;
        const n = process.env.N ? Number(process.env.N) : Math.max(20, Math.round(size[prof] * SCALE));
        out.push({ key: `${prof} | ${startName} | ${variant}`, prof, startDay, variant, n });
      }
  return out;
}

async function runJob(W, job, onProgress) {
  const { flags, cfg } = W;
  const T = cfg.TUNING;
  const savedPity = { ...T.fishing.pity };
  // no rarity pity (the Rare and Epic ramps); the legendary hazard stays, because it is the only way a first legendary bites
  if (job.variant === 'nopity') Object.assign(T.fishing.pity, { rareAfter: Infinity, epicAfter: Infinity });
  const prof = ASM.profiles[job.prof];
  const res = [];
  for (let i = 0; i < job.n; i++) {
    // the strip build (?progression=off) is the flag the game reads, set on this player's (empty) storage
    W.resetStorage();
    if (job.variant === 'strip') localStorage.setItem('curation.buildflags', JSON.stringify({ off: true, flags: {} }));
    flags.resetFlags();
    res.push(simulate(W, job.prof, prof, i, job.startDay, job.variant === 'strip' ? 'base' : job.variant));
    if (job.variant === 'strip') localStorage.removeItem('curation.buildflags');
    flags.resetFlags();
    if (onProgress && i % 50 === 49) onProgress(i + 1);
  }
  Object.assign(T.fishing.pity, savedPity);
  return res;
}

function summarise(job, res, secs) {
  const metrics = new Set(res.flatMap((r) => Object.keys(r.firsts)));
  const run = { n: res.length, secs, metrics: {} };
  for (const m of [...metrics].sort()) {
    run.metrics[m] = { active_min: pct(res.map((r) => r.firsts[m])), day: pct(res.map((r) => r.firstDay[m])), reached_share: res.filter((r) => r.firsts[m] !== undefined).length / res.length };
  }
  run.longest_drought_first_10h_min = pct(res.map((r) => r.maxGap));
  run.longest_gap_without_any_progress_tick_first_10h_min = pct(res.map((r) => r.maxTickGap)); // the layer's queue and the older systems' cards
  run.minutes_since_last_new_thing_at_day90 = pct(res.map((r) => r.sinceNovel));
  run.fish_species_by_day90 = pct(res.map((r) => r.fishSeen));
  run.share_of_obtainable_collected_day90 = pct(res.map((r) => r.seenShare));
  run.active_hours_by_day90 = pct(res.map((r) => r.activeMin / 60));
  run.rank_by_day90 = pct(res.map((r) => r.rank));
  run.legendaries_by_day90 = pct(res.map((r) => r.legends));
  run.named_islanders_met_by_day90 = pct(res.map((r) => r.people));
  run.secrets_found_by_day90 = pct(res.map((r) => r.secrets));
  run.gold_unspent_day90 = pct(res.map((r) => r.gold));
  const hours = res.reduce((s, r) => s + r.activeMin / 60, 0);
  const why = {};
  res.forEach((r) => Object.entries(r.goldBy).forEach(([k, v]) => (why[k] = (why[k] || 0) + v)));
  run.gold_per_active_hour_by_source = Object.fromEntries(Object.entries(why).map(([k, v]) => [k, Math.round(v / hours)]));
  run.gold_spent_per_active_hour = Math.round(res.reduce((s, r) => s + r.spent, 0) / hours);
  const plays = new Array(DAYS).fill(0);
  res.forEach((r) => r.sessDay.forEach((n, d) => (plays[d] += n)));
  const sumDays = (key) => {
    const out = {};
    res.forEach((r) => Object.entries(r[key]).forEach(([k, arr]) => arr.forEach((v, d) => ((out[k] ||= new Array(DAYS).fill(0))[d] += v))));
    return Object.fromEntries(Object.entries(out).map(([k, arr]) => [k, arr.map((v, d) => v / Math.max(1, plays[d]))]));
  };
  run.by_source_per_session = sumDays('srcDay');
  run.minutes_per_session = sumDays('actDay');
  run.novelty_per_day_mean = new Array(DAYS).fill(0).map((_, d) => res.reduce((s, r) => s + r.novelByDay[d], 0) / res.length);
  return run;
}

if (isMainThread && process.env.DEBUG_ONE) {
  // one player, printed: DEBUG_ONE=regular[:variant] DAYS=30
  const [prof, variant = 'base'] = process.env.DEBUG_ONE.split(':');
  const W = await makeWorld();
  W.resetStorage();
  if (variant === 'strip') localStorage.setItem('curation.buildflags', JSON.stringify({ off: true, flags: {} }));
  W.flags.resetFlags();
  for (let k = 1; k < Number(process.env.DEBUG_N || 1); k++) {
    // DEBUG_N=… times several players in one process (does a worker slow down as it goes?)
    const t0 = Date.now();
    W.resetStorage();
    W.flags.resetFlags();
    simulate(W, prof, ASM.profiles[prof], k, 0, variant === 'strip' ? 'base' : variant);
    console.error(`player ${k}: ${((Date.now() - t0) / 1000).toFixed(2)} s`);
  }
  const r = simulate(W, prof, ASM.profiles[prof], Number(process.env.IDX || 0), 0, variant === 'strip' ? 'base' : variant);
  const tot = (o) => Object.fromEntries(Object.entries(o).map(([k, a]) => [k, Math.round(a.reduce((x, y) => x + y, 0) * 10) / 10]));
  console.log(JSON.stringify({ rank: r.rank, fishSeen: r.fishSeen, entries: r.seenShare, activeH: (r.activeMin / 60).toFixed(1), gold: r.gold, spent: r.spent, bought: r.bought, goldBy: r.goldBy, maxGap: r.maxGap, maxTickGap: r.maxTickGap, minutes: tot(r.actDay), newThings: tot(r.srcDay), firsts: Object.fromEntries(Object.entries(r.firsts).map(([k, v]) => [k, `${v.toFixed(0)} min, day ${r.firstDay[k]}`])) }, null, 1));
} else if (isMainThread) {
  const all = jobs();
  const workers = Math.max(1, Number(process.env.WORKERS || 2));
  const queue = all.slice().sort((a, b) => b.n * (b.prof === 'heavy' ? 3 : b.prof === 'regular' ? 2 : 1) - a.n * (a.prof === 'heavy' ? 3 : a.prof === 'regular' ? 2 : 1));
  const summary = { generated: 'docs/progression/models/montecarlo.mjs', engine: 'the progression layer (src/progression/) in Node', days: DAYS, start: new Date(START_MS).toISOString().slice(0, 10), obtainable_in_model: OBTAINABLE.size, obtainable_by_collection: OBT_BY_COL, fish_species: PARAMS.fishing.species.length, fish_that_never_bite: NEVER_FISH, assumptions: A, measured: ASM.measured, runs: {} };
  const t0 = Date.now();
  await Promise.all(
    Array.from({ length: Math.min(workers, queue.length) }, () =>
      new Promise((resolve, reject) => {
        const w = new Worker(fileURLToPath(import.meta.url), { execArgv: ['--import', join(DOCS, 'tools', 'register.mjs')], workerData: {} });
        const next = () => {
          const job = queue.shift();
          if (!job) return w.postMessage(null);
          w.postMessage(job);
        };
        w.on('message', (m) => {
          if (m.progress) return process.stdout.write(`  ${m.key}: ${m.progress} players\r`);
          if (m.ready) return next();
          summary.runs[m.key] = m.run;
          const r = m.run;
          console.log(`${m.key}: ${r.n} players in ${r.secs}s; drought P50 ${r.longest_drought_first_10h_min.P50.toFixed(0)} / P99 ${r.longest_drought_first_10h_min.P99.toFixed(0)} min; fish species by day 90 P50 ${r.fish_species_by_day90.P50}; rank P50 ${r.rank_by_day90.P50}`);
          next();
        });
        w.on('error', reject);
        w.on('exit', resolve);
      }),
    ),
  );
  summary.secs = Math.round((Date.now() - t0) / 1000);
  const order = all.map((j) => j.key).filter((k) => summary.runs[k]);
  summary.runs = Object.fromEntries(order.map((k) => [k, summary.runs[k]]));
  summary.novelty_per_day_mean = Object.fromEntries(order.filter((k) => k.endsWith('| base')).map((k) => [k, summary.runs[k].novelty_per_day_mean]));
  const OUT = process.env.OUT || DATA; // check_repro.py writes elsewhere
  writeFileSync(join(OUT, 'mc_summary.json'), JSON.stringify(summary, (k, v) => (v === Infinity ? '__INF__' : v), 1).replace(/"__INF__"/g, 'Infinity') + '\n');
  const rows = [['profile', 'start', 'variant', 'metric', 'reached_by_day90', 'P10_active_min', 'P50_active_min', 'P90_active_min', 'P99_active_min', 'P10_day', 'P50_day', 'P90_day', 'P99_day']];
  for (const [key, run] of Object.entries(summary.runs)) {
    const [prof, start, variant] = key.split(' | ');
    for (const [m, v] of Object.entries(run.metrics)) rows.push([prof, start, variant, m, v.reached_share.toFixed(4), ...['P10', 'P50', 'P90', 'P99'].map((q) => (Number.isFinite(v.active_min[q]) ? v.active_min[q].toFixed(1) : 'inf')), ...['P10', 'P50', 'P90', 'P99'].map((q) => (Number.isFinite(v.day[q]) ? v.day[q] : 'inf'))]);
  }
  writeFileSync(join(OUT, 'mc_summary.csv'), rows.map((r) => r.map((x) => (/[,"]/.test(String(x)) ? `"${String(x).replace(/"/g, '""')}"` : x)).join(',')).join('\n') + '\n');
  console.log(`done in ${summary.secs}s → ${join(OUT, 'mc_summary.json')}`);
} else {
  const W = await makeWorld();
  parentPort.on('message', async (job) => {
    if (!job) return process.exit(0);
    const t0 = Date.now();
    const res = await runJob(W, job, (k) => parentPort.postMessage({ progress: k, key: job.key }));
    parentPort.postMessage({ key: job.key, run: summarise(job, res, Math.round((Date.now() - t0) / 1000)) });
  });
  parentPort.postMessage({ ready: true });
}
