// Minerals: the proof that a whole new collection is only data. Pixel art is
// written right here as rows and a palette; nothing about minerals lives in
// code. They will turn up on dig sites later.

const CLUSTER = [
  '.....##.....',
  '....#bb#.##.',
  '....#ba#.#b#',
  '.##.#aa#.#a#',
  '#bb##ac#.#c#',
  '#baa#ac##ac#',
  '#baacaaccac#',
  '#aaaccaaccc#',
  '.#cccccccc#.',
  '..##########',
];
const CUBE = [
  '...########.',
  '..#bbbbbbb#.',
  '.#bbbbbbbb##',
  '#########cc#',
  '#aaaaaaa#cc#',
  '#aaabaaa#cc#',
  '#aaaaaaa#cc#',
  '#aaaaaaa#cc#',
  '#aaaaaaa#c#.',
  '#aaaaaaa##..',
  '.#########..',
];
const LUMP = [
  '....####....',
  '..##bbbb##..',
  '.#bbbaaaab#.',
  '#bbaaaaaaac#',
  '#baaabbaaac#',
  '#baaaaaaacc#',
  '#aaaaaaaacc#',
  '#aaaaaaaccc#',
  '.#ccccccc##.',
  '..#########.',
];
const SHARD = [
  '......##....',
  '.....#bb#...',
  '....#bba#...',
  '...#bbaac#..',
  '..#bbaaacc#.',
  '.#bbaaaaacc#',
  '#bbaaaaaaac#',
  '#aaaaaaaacc#',
  '.##########.',
];

const mineral = (slug, title, rows, [a, b, c, o], rarity, hue, blurb, facts) => ({
  id: `mineral:${slug}`,
  collection: 'mineral',
  title,
  blurb,
  facts,
  rarity,
  set: 'crystal-cabinet',
  tags: [hue],
  image: { kind: 'pixels', rows, palette: { '#': o, a, b, c } },
  display: ['case', 'plinth'],
  provenance: { how: 'dug', where: 'Dig sites' },
  source: { license: 'Original', credit: 'Curation' },
  value: 2 * rarity,
});

const entries = [
  mineral('quartz', 'Quartz', CLUSTER, ['#e8e4ec', '#ffffff', '#b8b0c4', '#3a3440'], 1, 'clear',
    'One of the most common minerals in Earth’s crust, and a steady timekeeper: it vibrates at a precise rate when given electricity.',
    ['That is why quartz sits inside watches and clocks.']),
  mineral('amethyst', 'Amethyst', CLUSTER, ['#9a5ac8', '#d8a8f0', '#6a3a94', '#2c1844'], 2, 'purple',
    'Purple quartz. Its name is Greek for “not drunken”, because it was thought to keep its owner sober.',
    ['The colour comes from a trace of iron and natural radiation in the ground.']),
  mineral('pyrite', 'Pyrite', CUBE, ['#d8b040', '#f4e08a', '#a07820', '#4a3410'], 1, 'gold',
    'Fool’s gold. It shines like the real thing, but it is lighter, and it throws sparks when struck against steel.',
    ['Its name comes from the Greek word for fire.']),
  mineral('fluorite', 'Fluorite', CUBE, ['#6ac8a0', '#c8f8e0', '#3a8a74', '#143a30'], 2, 'green',
    'Many specimens glow under ultraviolet light, and the word “fluorescence” is named after this mineral.',
    ['Fluorite breaks along flat planes into neat octahedrons.']),
  mineral('malachite', 'Malachite', LUMP, ['#2a9a5a', '#6ad89a', '#146a3a', '#0e3a22'], 2, 'green',
    'A bright green copper mineral, ground up for thousands of years to make green paint.',
    ['Cut slices show swirling bands, like tree rings.']),
  mineral('obsidian', 'Obsidian', SHARD, ['#2a2630', '#6a6478', '#14121a', '#050408'], 3, 'black',
    'Volcanic glass, formed when lava cools too fast for crystals to grow. It breaks into edges sharper than a surgeon’s steel blade.',
    ['Stone Age people traded it across continents to make knives and arrowheads.']),
  mineral('halite', 'Halite', CUBE, ['#f0ece4', '#ffffff', '#c0b8aa', '#6a6458'], 1, 'white',
    'Rock salt: the same stuff as table salt, left behind when ancient seas dried up.',
    ['Its crystals grow as tiny perfect cubes.']),
  mineral('garnet', 'Garnet', LUMP, ['#b02040', '#f06a80', '#701028', '#3a0816'], 3, 'red',
    'Usually deep red. The name comes from the Latin for pomegranate, because a cluster of crystals looks like its seeds.',
    ['Garnet grains are also used to make sandpaper.']),
];

export default {
  collection: {
    id: 'mineral',
    name: 'Minerals',
    noun: 'minerals',
    icon: '💎',
    kinds: ['mineral'],
    display: 'case',
    ownership: 'earned',
    meta: ['rarity', 'where'],
    journal: {
      tab: 'minerals',
      label: 'Minerals',
      order: 4,
      layout: 'tiles',
      intro: '{have} of {total} minerals found. Brush them out of dig spots on the islands.',
    },
    viewer: { look: 'case' },
  },
  sets: [
    {
      id: 'crystal-cabinet',
      name: 'Crystal cabinet',
      collection: 'mineral',
      entries: entries.map((e) => e.id),
      reward: { gold: 600 },
      plaque: 'Eight minerals in one cabinet: the start of a real collection.',
    },
  ],
  entries,
};
