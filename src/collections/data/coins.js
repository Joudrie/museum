// Coins: dug from ruin spots. They arrive dirty (Chat 4 cleans them).

const COIN = [
  '...######...',
  '..#bbbbbb#..',
  '.#bccccccb#.',
  '#bcaaaaaacb#',
  '#bcaabbaacb#',
  '#bcabccbacb#',
  '#bcabccbacb#',
  '#bcaabbaacb#',
  '#bcaaaaaacb#',
  '.#bccccccb#.',
  '..#bbbbbb#..',
  '...######...',
];
const SQUARE = [
  '.##########.',
  '#bbbbbbbbbb#',
  '#bccccccccb#',
  '#bcaaaaaacb#',
  '#bcab##bacb#',
  '#bcab##bacb#',
  '#bcaaaaaacb#',
  '#bccccccccb#',
  '#bbbbbbbbbb#',
  '.##########.',
];
const coin = (slug, title, rows, [a, b, c, o], rarity, age, blurb, facts) => ({
  id: `coin:${slug}`,
  collection: 'coin',
  title,
  blurb,
  facts,
  rarity,
  set: 'coin-tray',
  tags: [age],
  image: { kind: 'pixels', rows, palette: { '#': o, a, b, c } },
  display: ['case', 'plinth'],
  provenance: { how: 'dug', where: 'Ruin dig spots' },
  source: { license: 'Original', credit: 'Curation' },
  dirty: true,
  value: 4 * rarity,
});

const entries = [
  coin('copper-coin', 'Copper coin', COIN, ['#b86a3c', '#d89060', '#7a4222', '#2c1608'], 1, 'copper',
    'Copper was one of the first metals people turned into money, because it was easy to melt and stamp.',
    ['Copper coins turn green over time as the metal slowly corrodes.']),
  coin('silver-denarius', 'Silver denarius', COIN, ['#c8ccd4', '#eef0f4', '#8a909c', '#30343c'], 2, 'roman',
    'The denarius was the standard Roman silver coin for hundreds of years.',
    ['Emperors put their own faces on coins, so a coin was also a way of showing who ruled.']),
  coin('gold-coin', 'Gold coin', COIN, ['#e0b030', '#f8e078', '#a07818', '#3e2c06'], 3, 'gold',
    'Gold does not rust or tarnish, so gold coins can look almost new after centuries underground.',
    ['Gold is soft enough that a coin can be marked with a tooth.']),
  coin('pierced-coin', 'Coin with a square hole', SQUARE, ['#b08048', '#d0a468', '#70502c', '#2a1a0a'], 2, 'copper',
    'Chinese coins were cast with a square hole so many could be strung together on a cord.',
    ['A string of 1,000 such coins was a common unit of money.']),
  coin('silver-penny', 'Hammered silver penny', COIN, ['#b8bcc4', '#e0e4ea', '#7c828e', '#2a2e36'], 2, 'medieval',
    'Medieval pennies were stamped by hammering a blank between two dies, so no two look exactly alike.',
    ['Pennies were sometimes cut into halves or quarters to make change.']),
  coin('gold-doubloon', 'Gold doubloon', COIN, ['#e8b838', '#fff088', '#a87c14', '#42300a'], 4, 'gold',
    'A doubloon was a large Spanish gold coin. Spanish ships carried them across the Atlantic, and some ended up on the sea floor.',
    ['The word comes from the Spanish for “double”.']),
];

export default {
  collection: {
    id: 'coin',
    name: 'Coins',
    noun: 'coins',
    icon: 'coin',
    kinds: ['coin'],
    display: 'case',
    ownership: 'earned',
    meta: ['rarity', 'where'],
    journal: { tab: 'coins', label: 'Coins', order: 7, layout: 'tiles', intro: '{have} of {total} coins found. Dig them out of ruin spots.' },
    viewer: { look: 'case' },
  },
  sets: [
    { id: 'coin-tray', name: 'Coin tray', collection: 'coin', entries: entries.map((e) => e.id), reward: { gold: 700 }, plaque: 'Six coins, from copper pennies to Spanish gold.' },
  ],
  entries,
};
