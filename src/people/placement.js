// Who the islands' plain "person" pieces turn into, who works in the museum, and how the named
// friends dress (docs/PEOPLE-SPRITES.md, "In the game"). Everyone is a class variant (classes.js).
// A piece keeps how far it wanders: one that stays put can be someone at work, the others carry
// their things about. The pick is seeded by where the piece stands, so a spot keeps its person.

const pools = (still, walk) => ({ still, walk });
// on the sand and on the grass (Main Island, Island One and your own islands)
const BEACH = pools(
  ['sunbather.lounge', 'beachcomber.detect', 'fisherman.surfcaster', 'lifeguard.watch', 'kid.kite', 'photographer.photo', 'yoga.tree', 'swimmer.beach'],
  ['swimmer.beach', 'swimmer.trunks', 'surfer.board', 'surfer.shorts', 'beachcomber.bucket', 'beachcomber.detector', 'lifeguard.ring', 'kid.icecream', 'kid.balloon', 'traveller.backpacker'],
);
const TOWN = pools(
  ['reader.book', 'grandparent.knit', 'grandparent.bench', 'artist.easel', 'sketcher.sketch', 'busker.guitar', 'birdwatcher.binoculars', 'gardener.water', 'groundskeeper.rake', 'photographer.photo', 'traveller.map', 'commuter.phone', 'yoga.tree', 'kid.kite', 'icecream.cart', 'florist.basket'],
  ['commuter.coffee', 'commuter.briefcase', 'shopper.bags', 'parent.shopping', 'grandparent.cane', 'dogwalker.stroll', 'jogger.run', 'postal.letter', 'kid.balloon', 'kid.scooter', 'teen.skater', 'teen.headphones', 'toddler.balloon', 'traveller.suitcase', 'newlyweds.dress', 'mayor.stroll', 'tourguide.umbrella', 'gardener.can'],
);
// the expedition islands have people of their own
const REGION = {
  pirate: pools(['piratecrew.lookout', 'treasurehunter.dig'], ['piratecrew.cutlass', 'piratecrew.patch', 'piratecrew.cook', 'smuggler.sack', 'treasurehunter.shovel']),
  tomb: pools(['archaeologist.brush', 'archaeologist.sieve'], ['archaeologist.trowel', 'archaeologist.fedora', 'explorer.lantern', 'tombrobber.torch']),
  north: pools(['arctictrapper.fish', 'fisherman.ice', 'sleddog.sled'], ['arctictrapper.lantern', 'mountaineer.iceaxe', 'mountaineer.rope']),
  wreck: pools(['beachcomber.detect', 'fisherman.surfcaster'], ['diver.tank', 'marinebio.jar', 'marinebio.clipboard', 'castaway.bottle']),
  badlands: pools(['prospector.pan', 'prospector.pick', 'geologist.pick', 'desertguide.point'], ['prospector.walk', 'desertguide.flask', 'geologist.walk', 'hiker.stick']),
  temple: pools(['templekeeper.sweep', 'jungleguide.chop', 'explorer.binoculars'], ['templekeeper.lantern', 'jungleguide.machete', 'explorer.rope']),
  heist: pools(['detective.magnify', 'guard.dog'], ['detective.notes', 'guard.night', 'police.patrol']),
};

/** The class variant for a plain person piece: `ground` is 'sand' or 'grass', `region` the island's
 *  region (an expedition's own name, or anything else for the home islands), `still` whether it stays put. */
export function townsperson(ground, region, still, seed) {
  const pool = REGION[region] || (ground === 'sand' ? BEACH : TOWN);
  const list = still ? pool.still : pool.walk;
  const r = Math.abs(Math.sin(seed * 12.9898 + 4.1414) * 43758.5453) % 1;
  return list[Math.floor(r * list.length) % list.length];
}

// The museum's staff wear their job (visitorLook still gives their name and way of talking)
export const STAFF_WEAR = {
  janitor: 'janitor.mop', // mopping up the one puddle
  barista: 'barista.coffee',
  carpenter: 'carpenter.hammer',
  guard: 'guard.day',
  guide: 'tourguide.umbrella',
  teacher: 'educator.kit',
};
// on their break they walk about, so nobody is mid-job
export const BREAK_WEAR = { janitor: 'janitor.head', carpenter: 'carpenter.toolbox', guide: 'tourguide.audio' };
