// Step 1: content inventory, counted from the game's own code and data (nothing typed in by hand).
// Writes docs/progression/data/content_inventory.csv and content_inventory.json.
//   node docs/progression/tools/inventory.mjs
import './shim.mjs';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const SRC = join(ROOT, 'src');
const OUT = join(HERE, '..', 'data');
const imp = (p) => import(join(SRC, p));

const reg = await imp('collections/index.js');
const { JOKES, TIPS, ASKS, GIFTS, FAREWELL, PLEASED, NOT_YET } = await imp('chatter_lines.js');
const lines = await imp('lines.js');
const { HEIST } = await imp('stories/heist.js');
const { CHAINS } = await imp('stories/chains.js');
const { RIDDLES } = await imp('puzzles-data.js');
const { LEADS } = await imp('leads.js');
const { FAMOUS } = await imp('famous.js');
const { ITEMS, CATEGORIES } = await imp('items.js');
const econ = await imp('economy.js');
const { QUESTS } = await imp('quests.js');
const { WHEEL } = await imp('daily.js');
const dig = await imp('dig.js');
const shop = await imp('collections/shop.js');

// ---------- helpers ----------
const words = (s) => (typeof s === 'string' ? s.split(/\s+/).filter(Boolean).length : 0);
// every string anywhere inside a value (objects, arrays), skipping colour codes and ids
function strings(v, out = []) {
  if (typeof v === 'string') {
    if (!/^#[0-9a-f]{3,8}$/i.test(v) && v.includes(' ')) out.push(v);
  } else if (Array.isArray(v)) v.forEach((x) => strings(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => strings(x, out));
  return out;
}
const wordsIn = (v) => strings(v).reduce((n, s) => n + words(s), 0);
// Reading speed used to turn words into minutes. An assumption, not a measurement:
// replace it with the first-hour log's real reading times once the user has played with it on.
const WPM = 200;
const readMin = (w) => +(w / WPM).toFixed(1);

const rows = [];
const add = (r) => rows.push({ notes: '', ...r });

// ---------- maps ----------
const MAPDIR = join(SRC, 'maps');
const maps = readdirSync(MAPDIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    const d = JSON.parse(readFileSync(join(MAPDIR, f), 'utf8'));
    const objs = d.objects || [];
    const tiles = d.tiles && !d.tiles.legend ? Object.values(d.tiles) : [];
    const cnt = (pred) => objs.filter((o) => pred(o.ref)).length + tiles.filter((t) => pred(t)).length;
    const corners = (d.corners || []).map((r) => (Array.isArray(r) ? r.join('') : String(r)));
    const exp = d.expedition;
    return {
      file: f,
      name: d.name,
      w: d.w,
      h: d.h,
      expedition: !!exp,
      people: cnt((r) => /^t:person/.test(r)),
      animals: cnt((r) => /^t:animal_/.test(r)),
      digSpots: cnt((r) => /^t:dig_/.test(r)),
      xMarks: cnt((r) => r === 't:x_mark'),
      puzzlePieces: cnt((r) => /^t:(boulder|plate|lever|gate|rock_crack|riddler|fog|ice)/.test(r)),
      pondCorners: corners.join('').split('').filter((c) => c === '3').length,
      seaCorners: corners.join('').split('').filter((c) => c === '0').length,
      expSpots: exp ? exp.spots.length : 0,
      expDigs: exp ? exp.spots.filter((s) => s.k === 'dig').length : 0,
      expFinds: exp ? exp.spots.filter((s) => ['dig', 'chest', 'crate'].includes(s.k)).map((s) => s.entry || s.collection || 'special') : [],
      expGoals: exp ? exp.goals.length : 0,
      expWords: exp ? wordsIn({ spots: exp.spots.map((s) => [s.title, s.text, s.says]), goals: exp.goals, outro: exp.outro, sub: exp.sub }) : 0,
      climate: exp?.climate || null,
    };
  });
// Island One is drawn in code (IslandScene.js): its dig spots are the addDig(...) calls there.
const sceneSrc = readFileSync(join(SRC, 'IslandScene.js'), 'utf8');
const oneDigs = [...sceneSrc.matchAll(/this\.addDig\(\d+, \d+(?:, '(\w+)')?\)/g)].map((m) => m[1] || 'mineral');
const ISLAND_ONE = { file: '(code) IslandScene.js', name: 'Island One', digSpots: oneDigs.length, digKinds: oneDigs, pond: true };

// ---------- collections ----------
const DIG_SOURCES = Object.entries(dig.DIG_KINDS).flatMap(([kind, v]) => v.collections.map((c) => [c, kind]));
const digKindOf = Object.fromEntries(DIG_SOURCES);
// which dig kinds actually have a spot somewhere a player can reach today
// Main Island and the far isle place dig_spot (mineral); Island One adds its own (mineral and fossil).
const homeDigKinds = new Set(['mineral', ...oneDigs]);
const expDigCollections = new Set(maps.flatMap((m) => m.expFinds).filter((x) => x !== 'special' && !x.includes(':')));
const shopEligible = new Set(
  reg
    .list()
    .filter((e) => reg.collectionOf(e)?.ownership === 'earned' && !reg.collectionOf(e).people && reg.collectionOf(e).display !== 'tank' && (e.rarity ?? 1) <= 3)
    .map((e) => e.id),
);
const giftPools = new Set(Object.values(GIFTS).flat().filter((g) => g.type === 'find').map((g) => g.pool));
const HUNT_COLLECTIONS = new Set(dig.DIG_KINDS.ruin.collections); // metal detector, riddlers and the X dig 'ruin'

function howObtained(e) {
  const c = reg.collectionOf(e);
  const how = [];
  if (c.ownership === 'all') how.push('owned from the start');
  if (e.collection === 'fish' || (e.collection === 'find' && e.collectable !== false)) how.push('fishing');
  const k = digKindOf[e.collection];
  if (k && homeDigKinds.has(k)) how.push('home dig spots');
  // a find in several pieces (T. rex, Triceratops) only comes from home dig spots of its kind, and expeditions skip it
  if (expDigCollections.has(e.collection) && !e.parts) how.push('expedition digs');
  if (HUNT_COLLECTIONS.has(e.collection)) how.push('hunts (metal detector at 10 finds, riddlers, the X)');
  if (giftPools.has(e.collection) && (e.rarity ?? 1) <= 2 && !e.parts) how.push('visitor gifts');
  if (e.collection === 'mineral') how.push('smashing cracked rock (pick)');
  if (shopEligible.has(e.id)) how.push('Gallery Shop (3-5 random a day)');
  if (e.collection === 'visitor') how.push(`meeting them (all ${Object.keys(FAMOUS).length} stand in the main hall now)`);
  return how;
}

const colStats = reg.collections().map((c) => {
  const es = reg.list({ collection: c.id });
  const rar = [1, 2, 3, 4, 5].map((r) => es.filter((e) => (e.rarity ?? 1) === r).length);
  const how = es.map(howObtained);
  const none = es.filter((_, i) => how[i].length === 0);
  const shopOnly = es.filter((_, i) => how[i].length === 1 && how[i][0].startsWith('Gallery'));
  const w = es.reduce((n, e) => n + words(e.blurb) + (e.facts || []).reduce((a, f) => a + words(f), 0), 0);
  const methods = [...new Set(how.flat())];
  return {
    id: c.id,
    name: c.name,
    ownership: c.ownership,
    entries: es.length,
    rarity: rar,
    sets: reg.sets(c.id, true).length,
    words: w,
    methods,
    unobtainable: none.map((e) => e.id),
    shopOnly: shopOnly.map((e) => e.id),
  };
});
for (const c of colStats) {
  add({
    category: 'collection',
    item: c.id,
    count: c.entries,
    unit: 'entries',
    words: c.words,
    read_minutes: readMin(c.words),
    obtainable_now: c.unobtainable.length === 0 ? (c.shopOnly.length === c.entries ? 'shop only' : 'yes') : c.unobtainable.length === c.entries ? 'no' : 'partly',
    source: `src/collections/data (${c.ownership})`,
    notes: `rarity 1/2/3/4/5 = ${c.rarity.join('/')}; sets ${c.sets}; via: ${c.methods.join(', ') || 'nothing'}${c.unobtainable.length ? `; ${c.unobtainable.length} with no way to get them` : ''}`,
  });
}

// ---------- people and words ----------
const kinds = Object.keys(JOKES);
const chatterWords = wordsIn([JOKES, TIPS, ASKS, GIFTS, FAREWELL, PLEASED, NOT_YET]);
add({ category: 'dialogue', item: 'guest conversations (chatter)', count: kinds.length, unit: 'visitor kinds', words: chatterWords, read_minutes: readMin(chatterWords), obtainable_now: 'yes', source: 'src/chatter_lines.js', notes: `${kinds.length * 2} jokes, ${TIPS.length} tips, ${Object.keys(ASKS).length} asks; each topic offered once per visitor` });
const personaWords = wordsIn([lines.PERSONALITIES, lines.ABOUT_ARTIST, lines.QUIPS, lines.CONTEXT]);
add({ category: 'dialogue', item: 'visitor one-liners (lines.js)', count: Object.keys(lines.PERSONALITIES).length, unit: 'personalities', words: personaWords, read_minutes: readMin(personaWords), obtainable_now: 'yes', source: 'src/lines.js' });
const famousWords = wordsIn(Object.values(FAMOUS).map((f) => [f.hello, f.lines, f.own]));
add({ category: 'dialogue', item: 'famous visitors', count: Object.keys(FAMOUS).length, unit: 'people', words: famousWords, read_minutes: readMin(famousWords), obtainable_now: 'yes', source: 'src/famous.js', notes: 'all spawn in the main hall at once ("for now: all of them, all the time", RoomScene)' });
const heistBeats = HEIST.beats?.length ?? 0;
add({ category: 'story', item: 'heist arc (The Empty Frames)', count: heistBeats, unit: 'chapters', words: wordsIn(HEIST), read_minutes: readMin(wordsIn(HEIST)), obtainable_now: 'yes', source: 'src/stories/heist.js' });
const chainSteps = Object.values(CHAINS).reduce((n, c) => n + (c.steps?.length || 0), 0);
add({ category: 'story', item: 'famous visitor chains', count: Object.keys(CHAINS).length, unit: 'visitors', words: wordsIn(CHAINS), read_minutes: readMin(wordsIn(CHAINS)), obtainable_now: 'yes', source: 'src/stories/chains.js', notes: `${chainSteps} steps in all; ${Object.keys(FAMOUS).length - Object.keys(CHAINS).length} famous visitors have no chain` });
add({ category: 'story', item: 'leads', count: LEADS.length, unit: 'leads', words: wordsIn(LEADS.map((l) => [l.title, l.text, l.hook])), read_minutes: readMin(wordsIn(LEADS.map((l) => [l.title, l.text, l.hook]))), obtainable_now: 'yes', source: 'src/leads.js' });
add({ category: 'puzzle', item: 'riddles', count: RIDDLES.length, unit: 'riddles', words: wordsIn(RIDDLES), read_minutes: readMin(wordsIn(RIDDLES)), obtainable_now: 'only where a riddler tile is placed', source: 'src/puzzles-data.js' });

// ---------- places ----------
for (const m of maps) {
  add({
    category: m.expedition ? 'expedition island' : 'home island',
    item: m.name,
    count: 1,
    unit: `${m.w}x${m.h} map`,
    words: m.expWords,
    read_minutes: readMin(m.expWords),
    obtainable_now: m.expedition ? 'after its lead' : 'yes',
    source: `src/maps/${m.file}`,
    notes: m.expedition
      ? `${m.expGoals} goals, ${m.expSpots} spots (${m.expDigs} digs), finds: ${m.expFinds.join(', ')}; climate ${m.climate?.season}/${m.climate?.weather}; ${m.people} people, ${m.animals} animals`
      : `${m.digSpots} dig spots, ${m.xMarks} X, ${m.people} people, ${m.animals} animals, pond ${m.pondCorners > 0 ? 'yes' : 'no'}`,
  });
}
add({ category: 'home island', item: ISLAND_ONE.name, count: 1, unit: 'code-drawn map', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/IslandScene.js', notes: `${oneDigs.length} dig spots (${oneDigs.join(', ')}), a pond and a cottage; museum doors locked` });

// ---------- building and economy ----------
const itemsByCat = {};
Object.values(ITEMS).forEach((it) => (itemsByCat[it.cat] = (itemsByCat[it.cat] || 0) + 1));
add({ category: 'build', item: 'decor items', count: Object.keys(ITEMS).length, unit: 'items', words: 0, read_minutes: 0, obtainable_now: 'yes (all free while testing)', source: 'src/items.js', notes: Object.entries(itemsByCat).map(([k, v]) => `${CATEGORIES[k]?.name || k} ${v}`).join(', ') });
add({ category: 'build', item: 'Curator’s Office levels', count: econ.OFFICE_LEVELS.length - 1, unit: 'levels', words: 0, read_minutes: 0, obtainable_now: 'yes (free while testing)', source: 'src/economy.js', notes: econ.OFFICE_LEVELS.slice(1).map((l) => l.cost).join(' / ') + ' gold' });
add({ category: 'build', item: 'staff upgrades', count: Object.values(econ.UPGRADES).reduce((n, u) => n + u.cost.length, 0), unit: 'upgrade levels', words: 0, read_minutes: 0, obtainable_now: 'yes (free while testing)', source: 'src/economy.js' });
add({ category: 'build', item: 'security tiers', count: econ.SECURITY.length - 1, unit: 'tiers', words: 0, read_minutes: 0, obtainable_now: 'yes (free while testing)', source: 'src/economy.js' });
add({ category: 'build', item: 'services', count: Object.keys(econ.SERVICES).length, unit: 'services', words: 0, read_minutes: 0, obtainable_now: 'yes (free while testing)', source: 'src/economy.js' });

// ---------- goals and unlocks ----------
const questGold = QUESTS.reduce((n, q) => n + q.reward, 0);
add({ category: 'goal', item: 'goals (quests.js)', count: QUESTS.length, unit: 'goals', words: wordsIn(QUESTS.map((q) => [q.title, q.text])), read_minutes: 0, obtainable_now: 'yes', source: 'src/quests.js', notes: `${questGold} gold in all; 3 shown at a time; no repeat, no daily goals` });
const setCount = reg.sets(undefined, true).length;
add({ category: 'goal', item: 'collection sets', count: setCount, unit: 'sets', words: 0, read_minutes: 0, obtainable_now: 'some', source: 'src/collections/data + artistsets.js' });
add({ category: 'goal', item: 'codex milestones', count: 5, unit: 'milestones', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/collections/milestones.js', notes: '10/25/50/75/100% of everything ever stamped' });

// ---------- the progression layer (src/progression/, #195) ----------
const LJ = (f) => JSON.parse(readFileSync(join(SRC, 'progression', 'data', f), 'utf8'));
const layerSpecies = (await import(join(SRC, 'progression', 'species.js'))).allSpecies();
const REGIONS_ = LJ('regions.json');
const SKILLS_ = LJ('skills.json');
const NPCS_ = LJ('npcs.json');
const params = JSON.parse(readFileSync(join(OUT, 'params.json'), 'utf8'));
const never = params.fishing?.neverBites || [];
add({ category: 'layer', item: 'fish species (conditions: water, time, weather, season, bait)', count: layerSpecies.length, unit: 'species', words: 0, read_minutes: 0, obtainable_now: never.length ? `all but ${never.length}` : 'yes', source: 'src/collections/data/fish*.js, src/progression/species.js', notes: `${layerSpecies.filter((x) => x.event).length} festival fish, ${layerSpecies.filter((x) => x.legend).length} legendaries with trails; never bite on the game's weather and climates: ${never.map((x) => x.id).join(', ') || 'none'}` });
add({ category: 'layer', item: 'regions (islands the boat reaches)', count: Object.keys(REGIONS_).length, unit: 'regions', words: 0, read_minutes: 0, obtainable_now: 'by rank, then a boat bought', source: 'src/progression/data/regions.json', notes: Object.entries(REGIONS_).map(([k, r]) => `${k}${r.req ? ` (${r.req})` : ''}`).join(', ') });
add({ category: 'layer', item: 'secrets', count: Object.values(REGIONS_).reduce((n, r) => n + (r.secrets ?? 3), 0), unit: 'secrets', words: 0, read_minutes: 0, obtainable_now: 'yes (some need gear)', source: 'src/progression/ui/worldlife.js', notes: 'in the data; about 42 are placed in play, because the world layer looks islands up by map id (IslandScene regionKey), so only Main Island and Island One get theirs and their legend clue and every other island gets 3 (diagnosis.md); names from a list of 12' });
add({ category: 'layer', item: 'viewpoints and island places', count: Object.keys(REGIONS_).length * 3, unit: 'places', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/progression/ui/worldlife.js, islandlife.js', notes: 'two viewpoints an island (one needs gloves) and the island itself' });
add({ category: 'layer', item: 'named islanders', count: NPCS_.length, unit: 'people', words: wordsIn(NPCS_.map((n) => [n.name, n.blurb || ''])), read_minutes: 0, obtainable_now: 'yes', source: 'src/progression/data/npcs.json', notes: '10 hearts each, gifts, requests; only the 3 on Main Island and Island One appear in play (the same lookup)' });
add({ category: 'layer', item: 'ranks', count: LJ('ranks.json').length, unit: 'ranks', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/progression/data/ranks.json', notes: 'a reward every rank; Renown levels after 50' });
add({ category: 'layer', item: 'skill levels', count: Object.values(SKILLS_).reduce((n, sk) => n + sk.levels.length, 0), unit: 'levels', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/progression/data/skills.json', notes: `${Object.keys(SKILLS_).length} skills; ${Object.values(SKILLS_).reduce((n, sk) => n + sk.levels.filter((l) => l.perk).length, 0)} perks` });
add({ category: 'layer', item: 'cosmetics', count: Object.keys(LJ('cosmetics.json')).length, unit: 'items', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/progression/data/cosmetics.json' });
add({ category: 'layer', item: 'market ladder and town projects', count: LJ('shop.json').ladder.length + LJ('projects.json').length, unit: 'items', words: 0, read_minutes: 0, obtainable_now: 'by rank', source: 'src/progression/data/shop.json, projects.json', notes: 'priced at 20 to 40 minutes of the target earn rate (market.js ladder)' });
add({ category: 'layer', item: 'rods, baits, lures', count: Object.keys(LJ('rods.json')).length + Object.keys(LJ('baits.json')).length + Object.keys(LJ('lures.json')).length, unit: 'items', words: 0, read_minutes: 0, obtainable_now: 'by rank and gold', source: 'src/progression/data/', notes: 'a rod changes the bite wait and the window only; its rareMult in rods.json is not read by fishroll.js' });
add({ category: 'layer', item: 'events', count: Object.keys(LJ('events.json')).length, unit: 'events a year', words: 0, read_minutes: 0, obtainable_now: 'in their date windows', source: 'src/progression/data/events.json', notes: Object.entries(LJ('events.json')).map(([k, e]) => `${k} ${e.start.join('/')}–${e.end.join('/')}`).join(', ') });
add({ category: 'unlock', item: 'dig tools', count: Object.keys(dig.TOOLS).length, unit: 'tools', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/dig.js', notes: Object.entries(dig.TOOLS).map(([k, t]) => `${k} at ${t.need} finds`).join(', ') + '; metal detector at 10' });
add({ category: 'daily', item: 'daily wheel + gift', count: WHEEL.length, unit: 'wheel slices', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/daily.js', notes: `slices ${WHEEL.join('/')}; streak forgives 3 missed days` });
add({ category: 'daily', item: 'Gallery Shop', count: shop.STOCK_MAX, unit: 'pieces a day (max)', words: 0, read_minutes: 0, obtainable_now: 'yes', source: 'src/collections/shop.js', notes: `${shopEligible.size} entries eligible (earned, rarity 3 or less, not fish, not people)` });

// ---------- write ----------
const cols = ['category', 'item', 'count', 'unit', 'words', 'read_minutes', 'obtainable_now', 'source', 'notes'];
const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
writeFileSync(join(OUT, 'content_inventory.csv'), [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c] ?? '')).join(','))].join('\n') + '\n');
writeFileSync(join(OUT, 'content_inventory.json'), JSON.stringify({ wpm: WPM, collections: colStats, maps: [...maps, ISLAND_ONE], rows }, null, 1) + '\n');

const tot = (cat) => rows.filter((r) => r.category === cat).reduce((n, r) => n + r.count, 0);
console.log(`inventory: ${rows.length} rows; ${tot('collection')} collection entries in ${colStats.length} collections; ${rows.reduce((n, r) => n + (r.words || 0), 0)} words of text`);
console.log(`no way to get: ${colStats.reduce((n, c) => n + c.unobtainable.length, 0)} entries; shop only: ${colStats.reduce((n, c) => n + c.shopOnly.length, 0)}`);
