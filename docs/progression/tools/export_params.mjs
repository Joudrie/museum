// Exports every number the models need, read from (and where possible computed by) the game's own code,
// so the Python models never carry a copied constant that can drift from the game.
//   node --import ./docs/progression/tools/register.mjs docs/progression/tools/export_params.mjs
// Writes docs/progression/data/params.json.
import { writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storage } from './shim.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, '..', '..', '..', 'src');
const imp = (p) => import(join(SRC, p));

// A seeded Math.random for the sampled tables, so params.json is the same every run.
let seed = 20261029;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
Math.random = rand;

const reg = await imp('collections/index.js');
const dig = await imp('dig.js');
const hunt = await imp('puzzles-hunt.js');
const chatter = await imp('chatter.js');
const daily = await imp('daily.js');
const quests = await imp('quests.js');
const ms = await imp('collections/milestones.js');
const shop = await imp('collections/shop.js');
const econ = await imp('economy.js');
const wallet = await imp('wallet.js');
const rooms = await imp('rooms.js');
const items = await imp('items.js');
const famous = await imp('famous.js');
const leads = await imp('leads.js');
const weather = await imp('weather.js');

// The model's day 0. Pinned, so a rerun on another day gives the same calendar, shelf and weather (the
// game's weather turns over at UTC midnight, so the hour matters too). MODEL_START=now models from today.
const T0 = !process.env.MODEL_START ? Date.parse('2026-10-29T20:30:00-04:00') : process.env.MODEL_START === 'now' ? Date.now() : Date.parse(process.env.MODEL_START);

const out = { generated: 'docs/progression/tools/export_params.mjs', modelStart: new Date(T0).toISOString(), notes: [] };

// ---------- collections ----------
out.entries = reg.list({ all: true }).map((e) => ({ id: e.id, collection: e.collection, rarity: e.rarity ?? 1, parts: e.parts || 0, junk: e.collectable === false, dirty: !!e.dirty, value: e.value ?? null, acquire: e.acquire || null }));
out.collections = reg.collections().map((c) => ({ id: c.id, ownership: c.ownership, people: !!c.people, display: c.display }));
out.sets = reg.sets(undefined, true).map((s) => ({ id: s.id, collection: s.collection, entries: s.entries, gold: s.reward?.gold || 0, artist: !!s.artist }));

// ---------- fishing: the progression layer's rules (src/progression/) ----------
// The Monte Carlo (models/montecarlo.mjs) calls the layer's own prepareCast/completeCast at run time, so the
// odds are not copied here. This section records the rules for the docs and for the checks they make.
const species = await imp('progression/species.js');
const fishroll = await imp('progression/fishroll.js');
const { TUNING } = await imp('progression/config.js');
const market = await imp('progression/market.js');
const rank = await imp('progression/rank.js');
const RANKS = JSON.parse(readFileSync(join(SRC, 'progression/data/ranks.json'), 'utf8'));
const RODS = JSON.parse(readFileSync(join(SRC, 'progression/data/rods.json'), 'utf8'));
const BAITS = JSON.parse(readFileSync(join(SRC, 'progression/data/baits.json'), 'utf8'));
const EVENTS = JSON.parse(readFileSync(join(SRC, 'progression/data/events.json'), 'utf8'));
const NPCS = JSON.parse(readFileSync(join(SRC, 'progression/data/npcs.json'), 'utf8'));
const sp = species.allSpecies();
out.fishing = {
  source: 'src/progression/ (species.js, fishroll.js, config.js); rolled at run time by models/montecarlo.mjs',
  species: sp.map((s) => ({ id: s.id, entryId: s.entryId, rarity: s.rarity, waters: s.waters, regions: s.regions, times: s.times, weathers: s.weathers, seasons: s.seasons, baits: s.baits, legend: s.legend ? { bait: s.legend.bait, spot: s.legend.spot || null, clue: s.legend.clue?.secret || null, rumorFrom: s.legend.rumorFrom || null } : null, nocturnal: s.nocturnal, event: s.event || null,
    // what one medium-size catch sells for at each of the two places that buy it
    // (the bag's value grows 3% a Fishing level, fishevents.js; the market pays half of it, market.js value())
    sell: { galleryShop: shop.sellPrice(s.entry), market: Math.max(1, Math.round(Math.round(fishroll.fishValue(s, 'M', '') * (1 + TUNING.economy.skillValueBonus * 1)) * TUNING.economy.sellMult)), marketAtFishing20: Math.max(1, Math.round(Math.round(fishroll.fishValue(s, 'M', '') * (1 + TUNING.economy.skillValueBonus * 20)) * TUNING.economy.sellMult)) } })),
  regions: species.REGIONS,
  rods: RODS,
  baits: Object.fromEntries(Object.entries(BAITS).map(([k, b]) => [k, { price: b.price, rareMult: b.rareMult || 1, epicMult: b.epicMult || 1, nightOnly: !!b.nightOnly, craft: !!b.craft }])),
  events: Object.fromEntries(Object.entries(EVENTS).map(([k, e]) => [k, { start: e.start, end: e.end }])),
  npcs: NPCS.map((n) => ({ id: n.id, region: n.region, kind: n.kind })),
  tuning: { rarityWeights: TUNING.fishing.rarityWeights, pity: TUNING.fishing.pity, variants: TUNING.fishing.variants, junkChance: TUNING.fishing.junkChance, sizeClasses: TUNING.fishing.sizeClasses, hotspot: TUNING.fishing.hotspot, reel: TUNING.fishing.reel },
};
// the game's weather on the real calendar, folded to the four kinds fish care about, over two years
const kinds = {};
for (let d = 0; d < 730; d++) {
  const t = new Date(T0 + d * 864e5);
  const k = `${weather.season(t)}:${fishroll.weatherClass(weather.weatherToday(t))}`;
  kinds[k] = (kinds[k] || 0) + 1;
}
const climates = Object.fromEntries(readdirSync(join(SRC, 'maps')).filter((f) => f.startsWith('exp-')).map((f) => [f.replace('.json', ''), JSON.parse(readFileSync(join(SRC, 'maps', f), 'utf8')).expedition?.climate || null]));
out.fishing.weatherKindsTwoYears = kinds;
out.fishing.expeditionClimates = climates;
// can a species ever bite? somewhere it lives, in a season and weather that place ever has
const placeHas = (region, se, w) => {
  const maps = species.REGIONS[region]?.maps || [];
  const fixed = maps.map((m) => climates[m]).find(Boolean);
  if (fixed) return fixed.season === se && fishroll.weatherClass(fixed.weather) === w;
  return !!kinds[`${se}:${w}`];
};
out.fishing.neverBites = sp.filter((s) => !s.regions.some((r) => s.seasons.some((se) => s.weathers.some((w) => placeHas(r, se, w))))).map((s) => ({ id: s.id, rarity: s.rarity, weathers: s.weathers, seasons: s.seasons, regions: s.regions }));
// the layer's economy and ranks
out.layer = {
  goldPerHourTarget: TUNING.economy.goldPerHour,
  ladder: market.ladder(TUNING).map((l) => ({ id: l.id, kind: l.kind, rank: l.rank, minutes: l.minutes, price: l.price, sub: !!l.sub })),
  fund: Object.fromEntries([5, 10, 20, 30, 50].map((r) => [r, market.fundPrice(r, TUNING)])),
  rankXp: Array.from({ length: 60 }, (_, i) => rank.xpToNext(i + 1, TUNING)),
  rankUnlocks: RANKS.flatMap((r, i) => (r.rewards || []).filter((x) => x.unlock).map((x) => ({ rank: i + 1, unlock: x.unlock }))),
  rankGold: RANKS.map((r) => (r.rewards || []).reduce((n, x) => n + (x.gold || 0), 0)),
  xp: TUNING.xp,
  tasks: TUNING.tasks,
  streak: TUNING.streak,
  login: TUNING.login,
};

const N = 120000; // samples per table
// ---------- digging: the real pick(), per kind and tool ----------
out.dig = {
  restMin: 10, // REST in src/dig.js (not exported): 10 * 60 * 1000
  tools: Object.fromEntries(Object.entries(dig.TOOLS).map(([k, t]) => [k, { need: t.need, flat: t.flat }])),
  dailyGoal: dig.DAILY_GOAL,
  dailyGold: dig.DAILY_GOLD,
  siteMin: dig.SITE_MIN,
  foundCollections: ['mineral', 'fossil', 'pottery', 'coin', 'arrowhead', 'shell', 'meteorite', 'map'],
  kinds: Object.fromEntries(Object.entries(dig.DIG_KINDS).map(([k, v]) => [k, v.collections])),
  detectorNeed: hunt.DETECTOR_NEED,
  huntTargetsPerIslandPerDay: 3, // TARGETS in src/puzzles-hunt.js (not exported)
  table: {},
};
for (const kind of Object.keys(dig.DIG_KINDS))
  for (const tool of Object.keys(dig.TOOLS)) {
    const es = dig.entriesFor(kind);
    if (!es.length) continue;
    const c = {};
    for (let i = 0; i < N; i++) {
      const e = dig.pick(es, Math.random, tool);
      c[e.id] = (c[e.id] || 0) + 1;
    }
    out.dig.table[`${kind}|${tool}`] = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v / N]));
  }
// the bonus find (site bonus and the X): rarity 3+ or a multi-part piece, picked with the brush
for (const kind of ['ruin', 'fossil', 'mineral']) {
  const c = {};
  for (let i = 0; i < N; i++) {
    const e = dig.bonusEntry(kind, Math.random);
    if (e) c[e.id] = (c[e.id] || 0) + 1;
  }
  out.dig.table[`${kind}|bonus`] = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v / N]));
}

// ---------- where the dig spots are ----------
const sceneSrc = readFileSync(join(SRC, 'IslandScene.js'), 'utf8');
const oneDigs = [...sceneSrc.matchAll(/this\.addDig\(\d+, \d+(?:, '(\w+)')?\)/g)].map((m) => m[1] || 'mineral');
const mapsDir = join(SRC, 'maps');
out.islands = [{ id: 'one', name: 'Island One', home: true, digs: oneDigs, pond: true, sea: true, hunts: false }];
for (const f of readdirSync(mapsDir).filter((f) => f.endsWith('.json'))) {
  const d = JSON.parse(readFileSync(join(mapsDir, f), 'utf8'));
  const all = [...(d.objects || []).map((o) => o.ref), ...Object.values(d.tiles?.legend ? {} : d.tiles || {})];
  const digs = all.filter((r) => dig.DIG_TILES[r?.replace(/^t:/, '')]).map((r) => dig.DIG_TILES[r.replace(/^t:/, '')]);
  const corners = (d.corners || []).map((r) => (Array.isArray(r) ? r.join('') : String(r))).join('');
  const exp = d.expedition;
  out.islands.push({
    id: f.replace('.json', ''),
    name: d.name,
    home: !exp,
    digs,
    xMarks: all.filter((r) => r === 't:x_mark').length,
    pond: corners.includes('3'),
    sea: corners.includes('0'),
    hunts: true, // every builder map runs the metal detector once it is earned (Hunts: scene.map is set)
    expedition: exp ? { id: exp.id, climate: exp.climate, goals: exp.goals.length, digs: exp.spots.filter((s) => s.k === 'dig').map((s) => s.collection || 'mineral'), chests: exp.spots.filter((s) => s.loot).map((s) => s.loot) } : null,
  });
}
out.expeditionFreshBias = 0.7; // Expedition.find(): 70% of the time it picks from entries never seen

// ---------- leads: which island opens which ----------
out.leads = leads.LEADS.map((l) => ({ id: l.id, island: l.island, start: !!l.start, then: l.then || [] }));

// ---------- guests ----------
out.chatter = {
  giftChance: chatter.GIFT_CHANCE,
  giftFull: chatter.GIFT_FULL,
  goldRange: [12, 36], // (12 + rnd * 24) in chatter.giftFor, x2 when pleased, x scale
  findMaxRarity: 2, // RoomScene.chat: finds are minerals and fossils of rarity 2 or less
  giftKinds: Object.fromEntries(Object.entries((await imp('chatter_lines.js')).GIFTS).map(([k, v]) => [k, v.map((g) => g.type + (g.pool ? ':' + g.pool : ''))])),
};
out.famous = { count: Object.keys(famous.FAMOUS).length, meetBoost: famous.MEET_BOOST, allPresent: true };

// ---------- daily ----------
const wheel = {};
for (let i = 0; i < 4000; i++) {
  storage.clear();
  const r = daily.spinWheel(daily.dayNum(), () => (i + 0.5) / 4000);
  wheel[r.gold] = (wheel[r.gold] || 0) + 1 / 4000;
}
storage.clear();
out.daily = { wheel, giftByStreak: Array.from({ length: 15 }, (_, s) => daily.giftFor(s) + (daily.isMilestone(s) ? 100 : 0)), forgiveDays: daily.FORGIVE_DAYS };

// ---------- goals, milestones, shop ----------
out.quests = quests.QUESTS.map((q) => ({ id: q.id, reward: q.reward, text: q.text }));
out.milestones = ms.MILESTONES;
out.shop = {
  prices: shop.PRICES,
  sellRate: shop.SELL_RATE,
  shopRate: shop.SHOP_RATE,
  // the real Gallery Shop shelf for the next 400 days, from today (same for every player)
  shelf: Array.from({ length: 400 }, (_, d) => {
    const t = T0 + d * 864e5;
    return { day: shop.dayKey(t), ids: shop.shelf(t).map((x) => x.entry?.id || x.id) };
  }),
};

// ---------- weather on the real calendar ----------
out.calendar = Array.from({ length: 400 }, (_, d) => {
  const t = new Date(T0 + d * 864e5);
  return { day: shop.dayKey(t.getTime()), season: weather.season(t), weather: weather.weatherToday(t) };
});

// ---------- the museum's economy, computed by the game's own income code ----------
storage.clear();
const list = rooms.loadRooms();
const openIncome = (rs) => rs.reduce((n, r, i) => n + (r.locked ? 0 : wallet.roomIncome(rs, i)), 0);
const stages = [];
const snap = (label) => {
  const rs = rooms.loadRooms();
  stages.push({ label, rooms: rs.length, open: rs.filter((r) => !r.locked).length, incomePerHour: openIncome(rs), visitors: wallet.museumVisitors(rs), nextRoomCost: wallet.roomCost(Math.max(1, rs.length - 1), 'vertical', 'medium') });
};
snap('start (entrance open)');
rooms.updateRoom(1, { locked: false });
snap('main hall open (500 gold)');
rooms.updateRoom(2, { locked: false });
snap('atrium open (2000 gold)');
for (let k = 1; k <= 12; k++) {
  rooms.addRoom({ orient: 'vertical', size: 'medium', exit: 'door-back' });
  snap(`${k} built room${k > 1 ? 's' : ''} (vertical medium, default half-hung walls)`);
}
storage.clear();
out.economy = {
  FREE: wallet.FREE,
  startCoins: wallet.START_COINS,
  offlineCapH: econ.OFFLINE_CAP_H,
  paintingIncome: econ.PAINTING_INCOME,
  collectAllFee: econ.COLLECT_ALL_FEE,
  mainHallPrice: rooms.MAIN_HALL_PRICE,
  atriumPrice: rooms.ATRIUM_PRICE,
  office: econ.OFFICE_LEVELS.slice(1).map((l) => l.cost),
  officeRooms: econ.OFFICE_LEVELS.slice(1).map((l) => (Number.isFinite(l.rooms) ? l.rooms : null)), // rooms allowed per level; the build menu compares this with every room in the list (RoomScene openBuildMenu)
  upgrades: Object.fromEntries(Object.entries(econ.UPGRADES).map(([k, u]) => [k, u.cost])),
  janitor: econ.JANITOR,
  guide: econ.GUIDE,
  security: econ.SECURITY.slice(1).map((s) => s.cost),
  services: econ.SERVICES,
  roomCostTable: Object.fromEntries(['short', 'medium', 'long'].map((size) => [size, Array.from({ length: 30 }, (_, n) => wallet.roomCost(n + 1, 'vertical', size))])),
  items: Object.fromEntries(Object.entries(items.ITEMS).map(([k, it]) => [k, { price: it.price, income: it.income || 0, lvl: it.lvl || 1, cat: it.cat }])),
  stages,
};
out.notes.push('Room price counts every room in the list, and a new museum starts with 10 (entrance, main hall, atrium and 7 shaped rooms), so the first room you build is priced as the 9th.');

writeFileSync(process.env.PARAMS_OUT || join(HERE, '..', 'data', 'params.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`params: ${out.entries.length} entries, ${out.fishing.species.length} fish species (${out.fishing.neverBites.length} never bite), ${Object.keys(out.dig.table).length} dig tables, ${out.islands.length} islands, ${stages.length} economy stages`);
console.log('economy stages:', stages.map((s) => `${s.label}: ${s.incomePerHour}/h, next room ${s.nextRoomCost}`).join('\n  '));
