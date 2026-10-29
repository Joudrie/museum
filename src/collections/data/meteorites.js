// Meteorites: dug from crater spots. Rock from space; the rarest finds.

const ROCK = [
  '....####....',
  '..##bbbb##..',
  '.#bbaaaabb#.',
  '#bbaacaaabb#',
  '#baacccaaab#',
  '#baaccaaaab#',
  '#bbaaaaaabb#',
  '.#bbbbbbbb#.',
  '..########..',
];
const SLAB = [
  '............',
  '..########..',
  '.#bbbbbbbb#.',
  '#bacacacaab#',
  '#bcacacacab#',
  '#bacacacaab#',
  '#bcacacacab#',
  '.#bbbbbbbb#.',
  '..########..',
];
const met = (slug, title, rows, [a, b, c, o], rarity, kind, blurb, facts) => ({
  id: `meteorite:${slug}`,
  collection: 'meteorite',
  title,
  blurb,
  facts,
  rarity,
  set: 'sky-stones',
  tags: [kind],
  image: { kind: 'pixels', rows, palette: { '#': o, a, b, c } },
  display: ['case', 'plinth'],
  provenance: { how: 'dug', where: 'Crater dig spots' },
  source: { license: 'Original', credit: 'Curation' },
  dirty: true,
  value: 5 * rarity,
});

const entries = [
  met('stony', 'Stony meteorite', ROCK, ['#6a6258', '#8e8678', '#403a32', '#16130e'], 2, 'stone',
    'Most meteorites that reach the ground are stony. They are bits of asteroids, left over from when the planets formed.',
    ['A dark crust forms on the outside as the rock burns through the air.']),
  met('iron', 'Iron meteorite', ROCK, ['#58586a', '#8c8ca0', '#34343e', '#101016'], 3, 'iron',
    'Made mostly of iron and nickel, these are pieces of the metal cores of broken asteroids.',
    ['Some people forged ancient tools and ornaments from meteoric iron.']),
  met('widmanstatten', 'Etched iron slice', SLAB, ['#8c8c98', '#c8c8d4', '#52525e', '#1a1a22'], 4, 'iron',
    'Cut and etched with acid, an iron meteorite shows a crosshatched pattern that cannot be made on Earth, because the metal cooled over millions of years.',
    ['The pattern is called Widmanstätten.']),
  met('chondrite', 'Chondrite', ROCK, ['#7a6e5e', '#a89a84', '#4a4034', '#1c160e'], 2, 'stone',
    'Chondrites contain chondrules, tiny round grains that formed in the early solar system, about 4.5 billion years ago.',
    ['They are among the oldest materials we can hold.']),
  met('tektite', 'Tektite', ROCK, ['#2e3a2c', '#5a7058', '#162014', '#060a06'], 3, 'glass',
    'Tektites are glassy blobs formed when a meteorite hit the ground and melted rock flew into the air and cooled.',
    ['Many tektites are shaped like drops, buttons or dumbbells.']),
];

export default {
  collection: {
    id: 'meteorite',
    name: 'Meteorites',
    noun: 'meteorites',
    icon: 'star',
    kinds: ['meteorite'],
    display: 'plinth',
    ownership: 'earned',
    meta: ['rarity', 'where'],
    journal: { tab: 'meteorites', label: 'Meteorites', order: 10, layout: 'tiles', intro: '{have} of {total} meteorites found. Dig them out of crater spots.' },
    viewer: { look: 'case' },
  },
  sets: [
    { id: 'sky-stones', name: 'Sky stones', collection: 'meteorite', entries: entries.map((e) => e.id), reward: { gold: 1200 }, plaque: 'Five pieces of rock that fell from space.' },
  ],
  entries,
};
