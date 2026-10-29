// Where every piece shows in the builder's palette: which list, in what order,
// under which small heading. This is display only: a piece's ref, its layer
// (ground tile or standing piece) and how it behaves never change, so saved
// maps are untouched. A piece not named here stays in its own group's list.

// ---------- Island pieces (t: refs), by tile name ----------

// palette order of the island lists ('People: ...' lists sit after People)
export const ISLAND_ORDER = [
  'Terrain', 'Ground tiles', 'Paths', 'Water', 'Cliffs', 'Docks, bridges & boats', 'Beach',
  'Buildings', 'People', 'Animals', 'Trees', 'Flowers & plants', 'Farm', 'Rocks', 'Garden & park',
  'Props', 'Dig sites', 'Puzzles', 'Expedition',
];

// a tile's group -> its list (groups not here keep their own name)
const GROUP_LIST = {
  Ground: 'Ground tiles',
  Plants: 'Flowers & plants',
  'Grounds & garden': 'Garden & park',
  'Cliffs & ledges': 'Cliffs',
  'Dark grey cliffs': 'Cliffs',
  'Brown cliffs (any ground)': 'Cliffs',
};

// pieces filed in the wrong group's list, moved by name
const MOVE = {
  palm: 'Trees', tree: 'Trees', pine: 'Trees', stump: 'Trees', log: 'Trees',
  hedge_round: 'Flowers & plants', fallen_leaves: 'Flowers & plants',
  pumpkins: 'Farm', hay_bale: 'Farm', veg_patch: 'Farm', scarecrow: 'Farm', wheelbarrow: 'Farm', water_pump: 'Farm',
  dock_h: 'Docks, bridges & boats', dock_v: 'Docks, bridges & boats', dock_post: 'Docks, bridges & boats',
  bridge_rope: 'Docks, bridges & boats', rowboat: 'Docks, bridges & boats',
  umbrella: 'Beach', driftwood: 'Beach', shells: 'Beach', tide_pool: 'Beach', rock_sand: 'Beach',
  campfire: 'Props',
  x_mark: 'Dig sites', dug_hole: 'Dig sites',
  statue_head: 'Garden & park',
};

// the Cliffs list is long: a small heading over each set, in this order
export const HEAD_ORDER = ['Dark grey cliffs (any ground)', 'Brown cliffs (any ground)', 'Brown cliffs (on grass)', 'Ledges (hop down)', 'Mountain walls', 'Caves'];
const CLIFF_HEAD = (name, group) => {
  if (group === 'Dark grey cliffs') return 'Dark grey cliffs (any ground)';
  if (group === 'Brown cliffs (any ground)') return 'Brown cliffs (any ground)';
  if (name.startsWith('ledge')) return 'Ledges (hop down)';
  if (name.startsWith('mountain')) return 'Mountain walls';
  if (name === 'cave') return 'Caves';
  return 'Brown cliffs (on grass)';
};

// -> { list, head } for an island tile
export function islandShelf(name, group) {
  const list = MOVE[name] || GROUP_LIST[group] || group || 'Other';
  return { list, head: list === 'Cliffs' ? CLIFF_HEAD(name, group) : null };
}

// ---------- Room pieces (p:group/n), by their place in pieces.json ----------
// Worked out by looking at every piece: some packs mix things on one sheet (the
// upholstery sheet has curtains, lamps and screens among its sofas, the wooden
// furniture sheets have beds, clocks and pianos), and a few cuts hold several
// objects at once ("Mixed sets & parts", kept so old maps still find them).

export const ROOM_ORDER = [
  'Floors', 'Walls', 'Rugs & mats', 'Windows', 'Curtains & drapes', 'Paintings & wall decor',
  'Seating', 'Tables & desks', 'Beds, wardrobes & dressers', 'Shelves & storage', 'Lights & fireplaces',
  'Plants & flowers', 'Statues & fountains', 'Clocks & music', 'Cushions & pillows', 'Screens & dividers',
  'Decor & clutter', 'Mixed sets & parts',
];

const DEFAULT = {
  floors: 'Floors', walls: 'Walls', rugs: 'Rugs & mats', plants: 'Plants & flowers', shelves: 'Shelves & storage',
  seating: 'Seating', tables: 'Tables & desks', lights: 'Lights & fireplaces', hang: 'Paintings & wall decor', decor: 'Decor & clutter',
};

// [list, group, ids, name] where ids mixes numbers and [from, to] ranges; the
// name (optional) is what each piece is called there
const ROOM_MOVES = [
  ['Curtains & drapes', 'seating', [[0, 11], [137, 146]], 'Curtain'],
  ['Lights & fireplaces', 'seating', [[12, 19], [25, 28], [147, 154], [160, 163]], 'Lamp'],
  ['Screens & dividers', 'seating', [20, 21, 23, 24, [156, 159]], 'Folding screen'],
  ['Cushions & pillows', 'seating', [22, 96, 97, 155, 230, 231], 'Cushion'],
  ['Mixed sets & parts', 'seating', [98, 99, 105, 106, 107, 110, 112, 123, 124, 232, 233, 239, 240, 241, 244, 246, 257, 258], 'Furniture set'],
  ['Mixed sets & parts', 'seating', [[393, 399], [402, 408], [411, 417]], 'Two sofa halves'],
  ['Mixed sets & parts', 'seating', [[419, 426], 621], 'Seating set'],
  ['Tables & desks', 'shelves', [19, 21, 71, 73], 'Table'],
  ['Tables & desks', 'shelves', [[120, 123]], 'Desk'],
  ['Tables & desks', 'shelves', [[126, 128], 131, 132], 'Side table'],
  ['Seating', 'shelves', [22, 74, 125, 130, 133, 134], 'Chair'],
  ['Seating', 'shelves', [47, 48, 99, 100], 'Rocking chair'],
  ['Seating', 'shelves', [62, 63, 114, 115], 'High-backed chair'],
  ['Seating', 'shelves', [59, 111, 135, 136], 'Bench'],
  ['Seating', 'shelves', [124], 'Chaise'],
  ['Seating', 'shelves', [129, 137, 138], 'Stool'],
  ['Beds, wardrobes & dressers', 'shelves', [43, 44, 95, 96], 'Bed'],
  ['Beds, wardrobes & dressers', 'shelves', [13, 65], 'Wardrobe'],
  ['Beds, wardrobes & dressers', 'shelves', [20, 72], 'Cupboard'],
  ['Beds, wardrobes & dressers', 'shelves', [61, 113, 141], 'Dresser'],
  ['Beds, wardrobes & dressers', 'shelves', [142], 'Vanity'],
  ['Lights & fireplaces', 'shelves', [53, 105], 'Fireplace'],
  ['Clocks & music', 'shelves', [[50, 52], [102, 104], 119, 140], 'Grandfather clock'],
  ['Clocks & music', 'shelves', [54, 106], 'Pipe organ'],
  ['Clocks & music', 'shelves', [55, 107], 'Piano'],
  ['Clocks & music', 'shelves', [56, 108], 'Grand piano'],
  ['Screens & dividers', 'shelves', [57, 58, 60, 109, 110, 112], 'Wooden screen'],
  ['Decor & clutter', 'shelves', [29, 32, 33, 36, 41, 81, 84, 85, 88, 90, 93], 'Mirror'],
  ['Decor & clutter', 'shelves', [139], 'Pouf'],
  ['Decor & clutter', 'shelves', [143], 'Pendant'],
  ['Paintings & wall decor', 'shelves', [[144, 146]], 'Small painting'],
  ['Mixed sets & parts', 'shelves', [3, 4, 9, 11, 12, 14, 16, 17, 18, [23, 28], [30, 31], [34, 35], [37, 40], 42, 45, 46, 49, 64, 66, [68, 70], [75, 80], [82, 83], [86, 87], 89, [91, 92], 94, [97, 98], 101], 'Furniture parts'],
  ['Rugs & mats', 'tables', [15], 'Runner'],
  ['Decor & clutter', 'tables', [24], 'Row of books'],
  ['Clocks & music', 'tables', [[25, 27]], 'Grandfather clock'],
  ['Seating', 'tables', [20], 'Stool'],
  ['Mixed sets & parts', 'tables', [0, 18], 'Table set'],
  ['Mixed sets & parts', 'rugs', [55], 'Floor pieces'],
  ['Curtains & drapes', 'hang', [[0, 31]], 'Curtain'],
  ['Curtains & drapes', 'hang', [57, 58], 'Stage drapes'],
  ['Windows', 'hang', [[59, 75]], 'Window'],
  ['Statues & fountains', 'decor', [[0, 4]]],
  ['Cushions & pillows', 'decor', [[36, 131]]],
  ['Shelves & storage', 'decor', [[132, 143]]],
];
// what the pieces of each source sheet are (pieces.json keeps the cutting order;
// see tools/build_palette.py SOURCES), for those the moves above don't name
const SHEETS = {
  floors: [[0, 97, 'Floor']],
  walls: [[0, 645, 'Wall']],
  rugs: [[0, 78, 'Rug'], [79, 110, 'Blanket']],
  plants: [[0, 3, 'Planter'], [4, 30, 'Flowers'], [31, 32, 'Potted plant']],
  shelves: [[0, 2, 'Bookshelf'], [3, 11, 'Cabinet'], [12, 115, 'Cabinet'], [116, 118, 'Bookshelf'], [120, 146, 'Furniture']],
  seating: [[0, 270, 'Upholstered seat'], [271, 335, 'Dining chair'], [336, 391, 'Armchair'], [392, 418, 'Formal sofa'], [419, 578, 'Sofa'], [579, 588, 'Throne'], [589, 621, 'Ottoman'], [622, 629, 'Bar stool'], [630, 634, 'Sofa'], [635, 641, 'Bench'], [642, 648, 'Long bench'], [649, 652, 'Chair']],
  tables: [[0, 13, 'Table'], [14, 15, 'Candle table'], [16, 21, 'White table'], [22, 23, 'Dinner table'], [24, 27, 'Table']],
  lights: [[0, 8, 'Lamp'], [9, 11, 'Castle light'], [12, 16, 'Fireplace']],
  hang: [[32, 56, 'Painting']],
  decor: [[0, 0, 'Statue pedestal'], [1, 1, 'Foo dog statue'], [2, 4, 'Fountain'], [5, 35, 'Clutter'], [36, 131, 'Cushion'], [132, 139, 'Chest'], [140, 143, 'Barrel']],
};
const ROOM_LIST = {};
const ROOM_NOUN = {};
ROOM_MOVES.forEach(([list, group, ids, noun]) =>
  ids.forEach((id) => {
    const [a, b] = Array.isArray(id) ? id : [id, id];
    for (let i = a; i <= b; i++) {
      ROOM_LIST[`${group}/${i}`] = list;
      if (noun) ROOM_NOUN[`${group}/${i}`] = noun;
    }
  }),
);
const nounOf = (id) => {
  if (ROOM_NOUN[id]) return ROOM_NOUN[id];
  const [g, n] = id.split('/');
  const hit = (SHEETS[g] || []).find(([a, b]) => +n >= a && +n <= b);
  return hit ? hit[2] : 'Piece';
};

// -> { 'seating/12': 'Lamp 1', ... }: every room piece named for what it is,
// numbered within its name in palette order
export function roomLabels(ids) {
  const count = {};
  const out = {};
  ids.forEach((id) => {
    const noun = nounOf(id);
    count[noun] = (count[noun] || 0) + 1;
    out[id] = `${noun} ${count[noun]}`;
  });
  return out;
}

// -> the list a room piece shows in ('seating/12' -> 'Lights & fireplaces')
export const roomShelf = (id) => ROOM_LIST[id] || DEFAULT[id.split('/')[0]] || 'Decor & clutter';
