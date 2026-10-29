// Torn map pieces: dug from ruin spots. Collect all four and an X appears on the island map you are on
// (the builder's "X marks the spot" tile); dig it up for a treasure. See src/puzzles-hunt.js.

const NW = [
  '############',
  '#bbbbbbbbbb#',
  '#baaaaaaaaab',
  '#bacccaaaaab',
  '#baaaacaaaab',
  '#baaaaccaaab',
  '#bacaaaacaa#',
  '#bacaaaaaab#',
  '#baccaaaab..',
  '#baaaaaab#..',
  '#bbbbbab#...',
  '#########...',
];
const NE = [
  '############',
  '#bbbbbbbbbb#',
  'baaaaaaaaaab',
  'baaaaccaaaab',
  'baaacaaacaab',
  'baaacaaaaaab',
  '#aaaccaaaaab',
  '..#bacccaab#',
  '...#baaaaab#',
  '...#bbbbbbb#',
  '....#######.',
  '............',
];
const SW = [
  '#########...',
  '#bbbbbab#...',
  '#baaaaaab#..',
  '#baccaaaab..',
  '#bacaaaaaab#',
  '#bacaaaacaa#',
  '#baaaaccaaab',
  '#baaaacaaaab',
  '#bacccaaaaab',
  '#baaaaaaaaab',
  '#bbbbbbbbbb#',
  '############',
];
const SE = [
  '............',
  '....#######.',
  '...#bbbbbbb#',
  '...#baaaaab#',
  '..#bacccaab#',
  '#aaaccaaaaab',
  'baaacaaaaaab',
  'baaacaaacaab',
  'baaaaccaaaab',
  'baaaaaaaaaab',
  '#bbbbbbbbbb#',
  '############',
];

const frag = (slug, title, rows, blurb) => ({
  id: `map:${slug}`,
  collection: 'map',
  title,
  blurb,
  facts: ['Old treasure maps were often drawn on parchment or paper and could be lost, torn or traded.'],
  rarity: 2,
  tags: ['map'],
  image: { kind: 'pixels', rows, palette: { '#': '#3a2a18', a: '#e8d4a0', b: '#c8b078', c: '#8a3a2a' } },
  display: ['case'],
  provenance: { how: 'dug', where: 'Ruin dig spots' },
  source: { license: 'Original', credit: 'Curation' },
  value: 6,
});

const entries = [
  frag('north-west', 'Torn map: north-west', NW, 'A corner of an old map, with ink lines. Three more pieces would show where something is buried.'),
  frag('north-east', 'Torn map: north-east', NE, 'The top-right piece of a torn map. It matches the others by the ragged edge.'),
  frag('south-west', 'Torn map: south-west', SW, 'The lower-left piece of a torn map, stained with age.'),
  frag('south-east', 'Torn map: south-east', SE, 'The last corner. Put all four together and an X marks the spot.'),
];

export default {
  collection: {
    id: 'map',
    name: 'Map pieces',
    noun: 'map pieces',
    icon: '🗺️',
    kinds: ['map piece'],
    display: 'case',
    ownership: 'earned',
    meta: ['where'],
    viewer: { look: 'case' },
  },
  sets: [],
  entries,
};
