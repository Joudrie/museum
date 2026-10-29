// Twelve event fish: three for each seasonal event (src/progression/data/events.json). They only bite while their
// event is on, and stay in the journal afterwards, greyed, marked "returns next year". Every one is a real animal.
const A = (event, water, regions, mean, sd, times, baits) => ({ event, water, waters: [water], regions, size: [Math.round(mean - 2 * sd), Math.round(mean + 3 * sd)], sizeDist: [mean, sd], ...(times ? { times } : {}), baits });
const E = (slug, title, rarity, shape, colors, blurb, acquire, where) => ({
  id: `fish:${slug}`,
  collection: 'fish',
  title,
  blurb,
  rarity,
  set: 'event-fish',
  tags: [acquire.water, 'event'],
  image: { kind: 'procedural', renderer: 'fish', shape, colors },
  display: ['tank'],
  provenance: { how: 'caught', where },
  source: { license: 'Original', credit: 'Curation' },
  value: [0, 1, 2, 4, 9, 30][rarity],
  acquire,
});

export const EVENT_SETS = [{ id: 'event-fish', name: 'Festival fish', collection: 'fish', entries: ['pumpkinseed', 'salmon', 'wels', 'cisco', 'stickleback', 'laketrout', 'shad', 'lamprey', 'stripedbass', 'mahi', 'flyingfish', 'wahoo'].map((s) => `fish:${s}`), reward: { gold: 1500 }, plaque: 'A dozen fish that only bite at festival time. They come back every year.' }];

export const EVENT_FISH = [
  // Harvest
  E('pumpkinseed', 'Pumpkinseed', 2, 'deep', ['#d88a3a', '#f0d070', '#c85a2a'], 'A sunfish with orange-spotted cheeks; the males fan out nests in sandy shallows.', A('harvest', 'pond', ['temperate', 'isle'], 15, 3, null, ['worm', 'cricket']), 'Pond'),
  E('salmon', 'Atlantic salmon', 3, 'fish', ['#7a8aa8', '#e8e8f0', '#a85a5a'], 'Salmon return from the sea to the river where they hatched, leaping falls to spawn.', A('harvest', 'sea', ['temperate'], 80, 12, ['dawn', 'dusk'], ['shrimp', 'minnowbait']), 'Sea'),
  E('wels', 'Wels catfish', 4, 'cat', ['#4a4a38', '#a8a078', '#38382a'], 'Europe’s biggest freshwater fish; large ones have been recorded beyond two and a half metres.', A('harvest', 'pond', ['temperate'], 150, 30, ['night'], ['minnowbait', 'glowbug']), 'Pond'),
  // Winter Festival
  E('cisco', 'Cisco', 2, 'slim', ['#8aa8b8', '#f0f4f4', '#a0b8c0'], 'Silvery lake fish that school in cold deep water and move shallow to spawn in late autumn.', A('winter', 'ice', ['temperate', 'arctic'], 30, 4, null, ['worm', 'snowchum']), 'Through the ice'),
  E('stickleback', 'Three-spined stickleback', 2, 'slim', ['#6a8a5a', '#e8c0a0', '#e0602a'], 'The male builds a nest of plants, guards the eggs, and turns red in the breeding season.', A('winter', 'ice', ['temperate', 'arctic'], 6, 1, null, ['worm', 'snowchum']), 'Through the ice'),
  E('laketrout', 'Lake trout', 3, 'fish', ['#5a6a58', '#d8d8c0', '#8a8a68'], 'It lives for decades in cold deep lakes and grows slowly.', A('winter', 'ice', ['temperate', 'arctic'], 70, 12, ['dusk', 'night'], ['minnowbait', 'snowchum']), 'Through the ice'),
  // Spring Bloom
  E('shad', 'American shad', 2, 'fish', ['#7a98b0', '#eef0f0', '#98a8b8'], 'Shad return from the sea each spring to the rivers where they were born, in great silver runs.', A('bloom', 'pond', ['temperate', 'isle'], 45, 6, ['dawn', 'day'], ['worm', 'bread']), 'Pond'),
  E('lamprey', 'Sea lamprey', 3, 'slim', ['#5a5a48', '#b8b098', '#484838'], 'A jawless fish that clings with a round toothed sucker; its kind is far older than the dinosaurs.', A('bloom', 'sea', ['temperate'], 70, 10, ['night'], ['minnowbait']), 'Sea'),
  E('stripedbass', 'Striped bass', 3, 'fish', ['#5a7a98', '#e8eaea', '#7a8aa0'], 'It lives in the sea and runs up rivers in spring to spawn; dark stripes run along its silver sides.', A('bloom', 'sea', ['temperate'], 80, 12, ['dawn', 'dusk'], ['minnowbait', 'shrimp']), 'Sea'),
  // Summer Regatta
  E('mahi', 'Mahi-mahi', 3, 'deep', ['#3ab88a', '#f0d84a', '#2a98c8'], 'It grows fast and lives only a few years, flashing gold and green in the water.', A('regatta', 'sea', ['tropical'], 90, 14, ['day'], ['minnowbait', 'squidstrip']), 'Sea'),
  E('flyingfish', 'Flying fish', 2, 'slim', ['#3a6aa8', '#e8f0f8', '#7aa8d8'], 'It launches from the water and glides on big fins, sometimes for hundreds of metres.', A('regatta', 'sea', ['tropical'], 28, 4, ['day', 'dusk'], ['shrimp']), 'Sea'),
  E('wahoo', 'Wahoo', 4, 'sword', ['#3a5a88', '#c8d8e0', '#2a4a78'], 'One of the fastest fish in the sea, sprinting at speeds above seventy kilometres an hour.', A('regatta', 'sea', ['tropical'], 140, 20, ['day'], ['squidstrip', 'minnowbait']), 'Sea'),
];
