// Pottery shards: dug from ruin spots (src/dig.js). They arrive dirty, so they
// wait for the restoration desk (Chat 4). Pixel art is rows and a palette.

const SHERD = [
  '............',
  '..#######...',
  '.#bbbbbba#..',
  '#bbaaaaaaa#.',
  '#bcccccccca#',
  '#baaaaaaaab#',
  '#bbbbbbbbb#.',
  '.#########..',
];
const HANDLE = [
  '..######....',
  '.#bbbbbb#...',
  '#bb####bb#..',
  '#b#....#b#..',
  '#b#....#bb#.',
  '#bb#...#aab#',
  '.#b#..#aaab#',
  '..##..######',
];
const BASE = [
  '............',
  '.##########.',
  '#bbbbbbbbbb#',
  '#bcccccccab#',
  '#baaaaaaaab#',
  '.#bbbbbbbb#.',
  '..########..',
];
const LAMP = [
  '.......###..',
  '..#######b#.',
  '.#bbbbbbbb#.',
  '#bbaaaaaab#.',
  '#bccccccab#.',
  '.#baaaaab#..',
  '..#######...',
];
const pot = (slug, title, rows, [a, b, c, o], rarity, age, blurb, facts) => ({
  id: `pottery:${slug}`,
  collection: 'pottery',
  title,
  blurb,
  facts,
  rarity,
  set: 'potters-shelf',
  tags: [age],
  image: { kind: 'pixels', rows, palette: { '#': o, a, b, c } },
  display: ['case', 'plinth'],
  provenance: { how: 'dug', where: 'Ruin dig spots' },
  source: { license: 'Original', credit: 'Curation' },
  dirty: true,
  value: 3 * rarity,
});

const entries = [
  pot('red-sherd', 'Red clay sherd', SHERD, ['#b8603c', '#d88a5c', '#8a4426', '#3a1c10'], 1, 'everyday',
    'A broken piece of a clay pot. Archaeologists call these sherds, and because fired clay lasts almost forever they are the most common thing found at old settlements.',
    ['Changes in how pots were shaped and decorated help date the layer of earth they come from.']),
  pot('painted-sherd', 'Painted sherd', SHERD, ['#e8d4a8', '#f4e8c8', '#a04a30', '#3a2418'], 2, 'decorated',
    'Painted pottery could show gods, animals and daily life. A scrap with a stripe of paint can still tell a story.',
    ['Greek vase painters sometimes signed their work.']),
  pot('jar-handle', 'Jar handle', HANDLE, ['#c88a58', '#e0a878', '#8a5a34', '#3a2414'], 1, 'everyday',
    'Handles are strong joints, so they often survive when the rest of a jar does not.',
    ['Some ancient handles carry a stamp that names the maker or the town.']),
  pot('jar-base', 'Jar base', BASE, ['#a89070', '#c8b090', '#6a5438', '#2a2014'], 1, 'everyday',
    'The thick bottom of a storage jar. Big jars like this held oil, wine and grain.',
    ['Potters often left fingerprints in the clay, still there thousands of years later.']),
  pot('oil-lamp', 'Clay oil lamp', LAMP, ['#9a8a6a', '#bcae88', '#5e5038', '#241c10'], 2, 'lamp',
    'Before electric light, a small clay lamp burned oil through a wick. Many ancient lamps were mass produced in moulds.',
    ['A lamp burned for a few hours on a spoonful of oil.']),
  pot('black-figure', 'Black-figure fragment', SHERD, ['#c8703c', '#e89868', '#1c1814', '#0c0a08'], 3, 'decorated',
    'Greek potters painted figures in black slip on red clay, then scratched details into the black before firing.',
    ['The technique was used in Athens from about the 7th to the 5th century BCE.']),
];

export default {
  collection: {
    id: 'pottery',
    name: 'Pottery',
    noun: 'pottery pieces',
    icon: '🏺',
    kinds: ['pottery'],
    display: 'case',
    ownership: 'earned',
    meta: ['rarity', 'where'],
    journal: { tab: 'pottery', label: 'Pottery', order: 6, layout: 'tiles', intro: '{have} of {total} pottery pieces found. Dig them out of ruin spots.' },
    viewer: { look: 'case' },
  },
  sets: [
    { id: 'potters-shelf', name: "Potter's shelf", collection: 'pottery', entries: entries.map((e) => e.id), reward: { gold: 500 }, plaque: 'Six scraps of clay from people who lived long ago.' },
  ],
  entries,
};
