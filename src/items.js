// Decor items placed on the floor grid with the toolkit. Each item has a
// footprint in tiles (w x h), a price and a daily income in gold coins.
// `rise` is how many px the sprite sticks up above its footprint; `lvl` is the
// Curator's Office level that unlocks it (default 1).
import { load, save } from './storage.js';

export const CATEGORIES = {
  seating: 'Seating',
  plants: 'Plants',
  lights: 'Lights',
  sculpture: 'Sculpture',
  relics: 'Relics',
  science: 'Science',
  display: 'Display',
  features: 'Features',
  services: 'Services',
  seasonal: 'Seasonal',
};

export const ITEMS = {
  stool: { name: 'Stool', cat: 'seating', w: 1, h: 1, rise: 8, price: 5, income: 1 },
  bench: { name: 'Gallery bench', cat: 'seating', w: 2, h: 1, rise: 8, price: 40, income: 4, rotatable: true },
  stanchion: { name: 'Stanchion', cat: 'display', w: 1, h: 1, rise: 28, price: 12, income: 0 },
  info_sign: { name: 'Exhibit sign', cat: 'display', w: 1, h: 1, rise: 30, price: 30, income: 2 },
  rope: { name: 'Velvet rope', cat: 'display', w: 2, h: 1, rise: 22, price: 25, income: 2, rotatable: true },
  fern: { name: 'Fern', cat: 'plants', w: 1, h: 1, rise: 2, price: 15, income: 2, plant: 'fern' },
  monstera: { name: 'Monstera', cat: 'plants', w: 1, h: 1, rise: 2, price: 20, income: 2, plant: 'monstera' },
  cactus: { name: 'Cactus', cat: 'plants', w: 1, h: 1, rise: 2, price: 15, income: 2, plant: 'cactus' },
  tree: { name: 'Little tree', cat: 'plants', w: 1, h: 1, rise: 2, price: 25, income: 3, plant: 'tree' },
  palm: { name: 'Potted palm', cat: 'plants', w: 1, h: 1, rise: 34, price: 45, income: 4 },
  lamp: { name: 'Floor lamp', cat: 'lights', w: 1, h: 1, rise: 38, price: 30, income: 3 },
  candelabra: { name: 'Candelabra', cat: 'lights', w: 1, h: 1, rise: 30, price: 60, income: 5 },
  bust: { name: 'Marble bust', cat: 'sculpture', w: 1, h: 1, rise: 28, price: 120, income: 10 },
  statue: { name: 'Classical statue', cat: 'sculpture', w: 1, h: 1, rise: 50, price: 300, income: 25, lvl: 2 },
  armor: { name: 'Suit of armor', cat: 'sculpture', w: 1, h: 1, rise: 40, price: 250, income: 20, lvl: 2 },
  vase: { name: 'Ancient vase (case)', cat: 'relics', w: 1, h: 1, rise: 30, price: 200, income: 15, lvl: 2 },
  sarcophagus: { name: 'Sarcophagus', cat: 'relics', w: 2, h: 1, rise: 10, price: 500, income: 40, lvl: 2 },
  skull: { name: 'Dinosaur skull', cat: 'science', w: 2, h: 1, rise: 24, price: 1000, income: 80, lvl: 3 },
  globe: { name: 'Antique globe', cat: 'science', w: 1, h: 1, rise: 26, price: 90, income: 7 },
  bookshelf: { name: 'Bookshelf', cat: 'features', w: 2, h: 1, rise: 40, price: 70, income: 5 },
  fountain: { name: 'Fountain', cat: 'features', w: 2, h: 2, rise: 14, price: 800, income: 60, lvl: 3 },
  sofa: { name: 'Velvet sofa', cat: 'seating', w: 2, h: 1, rise: 14, price: 150, income: 10 },
  bonsai: { name: 'Bonsai', cat: 'plants', w: 1, h: 1, rise: 14, price: 50, income: 4 },
  cherry: { name: 'Cherry blossom tree', cat: 'plants', w: 1, h: 1, rise: 42, price: 80, income: 6 },
  lantern: { name: 'Stone lantern', cat: 'lights', w: 1, h: 1, rise: 32, price: 70, income: 6 },
  obelisk: { name: 'Obelisk', cat: 'relics', w: 1, h: 1, rise: 58, price: 350, income: 28, lvl: 3 },
  canopic: { name: 'Canopic jars', cat: 'relics', w: 1, h: 1, rise: 14, price: 150, income: 12, lvl: 2 },
  trex: { name: 'T-rex skeleton', cat: 'science', w: 3, h: 2, rise: 34, price: 2500, income: 200, lvl: 4, needs: { 'fossil:dinosaur-bone': 6, 'fossil:trex-tooth': 1 } },
  meteorite: { name: 'Meteorite', cat: 'science', w: 1, h: 1, rise: 20, price: 400, income: 30, lvl: 3 },
  telescope: { name: 'Telescope', cat: 'science', w: 1, h: 1, rise: 30, price: 180, income: 14, lvl: 3 },
  specimens: { name: 'Specimen jars', cat: 'science', w: 1, h: 1, rise: 30, price: 120, income: 10, lvl: 3 },
  counter: { name: 'Coffee counter', cat: 'services', w: 3, h: 1, rise: 22, price: 400, income: 0, max: 1, note: 'Sells coffee', lvl: 2 },
  closet: { name: 'Mop closet', cat: 'retired', w: 1, h: 1, rise: 42, price: 300, income: 0, max: 3, note: 'Hires a janitor' },
  lockers: { name: 'Staff lockers', cat: 'services', w: 2, h: 1, rise: 30, price: 120, income: 0, note: 'Break room' },
  donuts: { name: 'Donut table', cat: 'services', w: 2, h: 1, rise: 14, price: 60, income: 0, note: 'Break room' },
  board: { name: 'Staff board', cat: 'retired', w: 1, h: 1, rise: 14, price: 0, income: 0 },
  geode: { name: 'Geode', cat: 'science', w: 1, h: 1, rise: 20, price: 220, income: 18, lvl: 3 },
  piano: { name: 'Grand piano', cat: 'features', w: 2, h: 1, rise: 22, price: 600, income: 45, lvl: 2 },
  harp: { name: 'Golden harp', cat: 'features', w: 1, h: 1, rise: 30, price: 260, income: 20, lvl: 2 },
  easel: { name: 'Artist’s easel', cat: 'display', w: 1, h: 1, rise: 30, price: 60, income: 5, fixture: { kind: 'easel', accepts: ['wall'], slots: [{ x: 16, y: 41, w: 20, h: 20, back: '#f4f0e6' }] } },
  clock: { name: 'Grandfather clock', cat: 'features', w: 1, h: 1, rise: 34, price: 140, income: 11 },
  aquarium: { name: 'Aquarium', cat: 'display', w: 2, h: 1, rise: 26, price: 450, income: 35, lvl: 2, fixture: { kind: 'tank', accepts: ['tank'], slots: 3, swim: { x0: 8, y0: 20, x1: 56, y1: 38 }, scale: 0.7 } },
  birdcage: { name: 'Canary cage', cat: 'features', w: 1, h: 1, rise: 30, price: 90, income: 7 },
  urn: { name: 'Greek urn', cat: 'relics', w: 1, h: 1, rise: 30, price: 180, income: 14, lvl: 2 },
  mask: { name: 'Carved mask', cat: 'relics', w: 1, h: 1, rise: 30, price: 160, income: 13, lvl: 2 },
  display_case: { name: 'Jewel case', cat: 'relics', w: 1, h: 1, rise: 30, price: 280, income: 22, lvl: 2 },
  ship_model: { name: 'Ship in a case', cat: 'relics', w: 2, h: 1, rise: 30, price: 340, income: 26, lvl: 2 },
  idol: { name: 'Golden idol', cat: 'relics', w: 1, h: 1, rise: 30, price: 420, income: 32, lvl: 3 },
  butterflies: { name: 'Butterfly case', cat: 'science', w: 1, h: 1, rise: 30, price: 130, income: 10 },
  plinth: { name: 'Plinth', cat: 'display', w: 1, h: 1, rise: 26, price: 60, income: 2, fixture: { kind: 'plinth', accepts: ['plinth', 'case'], slots: [{ x: 16, y: 29, w: 18, h: 18 }] } },
  glass_case: { name: 'Glass case', cat: 'display', w: 2, h: 1, rise: 34, price: 220, income: 5, lvl: 2, fixture: { kind: 'case', accepts: ['case', 'plinth'], slots: [{ x: 16, y: 44, w: 16, h: 16 }, { x: 32, y: 44, w: 16, h: 16 }, { x: 48, y: 44, w: 16, h: 16 }] } },
  specimen_shelf: { name: 'Specimen shelf', cat: 'display', w: 2, h: 1, rise: 30, price: 160, income: 4, fixture: { kind: 'shelf', accepts: ['case', 'plinth'], slots: [{ x: 20, y: 31, w: 16, h: 16 }, { x: 44, y: 31, w: 16, h: 16 }, { x: 20, y: 51, w: 16, h: 16 }, { x: 44, y: 51, w: 16, h: 16 }] } },
  big_tank: { name: 'Giant tank', cat: 'display', w: 3, h: 2, rise: 40, price: 1400, income: 20, lvl: 3, fixture: { kind: 'tank', accepts: ['tank'], slots: 8, swim: { x0: 8, y0: 26, x1: 88, y1: 76 }, scale: 1 } },
  fossil_slab: { name: 'Fossil slab', cat: 'science', w: 2, h: 1, rise: 22, price: 380, income: 28, lvl: 2 },
  gramophone: { name: 'Gramophone', cat: 'features', w: 1, h: 1, rise: 30, price: 110, income: 9 },
  banner: { name: 'Museum banner', cat: 'features', w: 1, h: 1, rise: 34, price: 45, income: 4 },
  orchid: { name: 'Orchid', cat: 'plants', w: 1, h: 1, rise: 14, price: 40, income: 3 },
  rug_round: { name: 'Round rug', cat: 'features', w: 2, h: 1, rise: 0, price: 70, income: 5, flat: true },
  rug_long: { name: 'Long runner', cat: 'features', w: 3, h: 1, rise: 0, price: 90, income: 6, flat: true, rotatable: true },
  // Seasonal: only for sale in their season (placed ones stay all year)
  pumpkin: { name: 'Jack-o’-lantern', cat: 'seasonal', w: 1, h: 1, rise: 10, price: 30, income: 4, season: 'autumn' },
  xmas_tree: { name: 'Holiday tree', cat: 'seasonal', w: 1, h: 1, rise: 40, price: 120, income: 10, season: 'winter' },
  gifts: { name: 'Pile of gifts', cat: 'seasonal', w: 1, h: 1, rise: 18, price: 40, income: 4, season: 'winter' },
  flower_basket: { name: 'Flower basket', cat: 'seasonal', w: 1, h: 1, rise: 14, price: 35, income: 4, season: 'spring' },
};

const ITEMS_KEY = 'curation.items'; // { [roomIndex]: [{ type, c, r, rot }] }

export function loadItems(room) {
  const list = load(ITEMS_KEY, {})?.[room];
  // (skip anything a broken or older save left behind)
  return Array.isArray(list) ? list.filter((it) => it && ITEMS[it.type] && Number.isFinite(it.c) && Number.isFinite(it.r)) : [];
}

export function saveItems(room, list) {
  save(ITEMS_KEY, { ...load(ITEMS_KEY, {}), [room]: list });
}

export function resetItems() {
  save(ITEMS_KEY, {});
}

// Footprint in tiles, with rotation applied.
export function footprint(item) {
  const def = ITEMS[item.type];
  return item.rot ? { w: def.h, h: def.w } : { w: def.w, h: def.h };
}

// How many of an item are placed across the museum (for items with a max).
export function countPlaced(type, roomCount) {
  let n = 0;
  for (let i = 0; i < roomCount; i++) loadItems(i).forEach((it) => it.type === type && n++);
  return n;
}
