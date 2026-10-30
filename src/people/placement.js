// Who the islands' plain "person" pieces dress as, who works in the museum, and how the named friends
// dress (docs/PEOPLE-SPRITES.md, "In the game"). Each is a class variant (classes.js) worn as a look:
// the person keeps a visitor's way of talking and wandering. The pick is seeded by where the piece
// stands, so a spot keeps its person.

// on the sand and on the grass (Main Island, Island One and your own islands)
const BEACH = ['swimmer.beach', 'swimmer.trunks', 'surfer.board', 'surfer.shorts', 'beachcomber.bucket', 'beachcomber.detector', 'lifeguard.ring', 'kid.icecream', 'kid.balloon', 'traveller.backpacker'];
const TOWN = ['commuter.coffee', 'commuter.briefcase', 'shopper.bags', 'parent.shopping', 'grandparent.cane', 'dogwalker.stroll', 'jogger.run', 'postal.letter', 'kid.balloon', 'kid.scooter', 'teen.skater', 'teen.headphones', 'toddler.balloon', 'traveller.suitcase', 'gardener.can', 'tourguide.umbrella', 'artist.palette', 'birdwatcher.notebook', 'florist.bouquet', 'icecream.cone'];
// the expedition islands have people of their own
const REGION = {
  pirate: ['piratecrew.cutlass', 'piratecrew.patch', 'piratecrew.cook', 'piratecrew.peg', 'piratecrew.hook', 'smuggler.sack', 'treasurehunter.shovel'],
  tomb: ['archaeologist.trowel', 'archaeologist.fedora', 'explorer.lantern', 'explorer.rope', 'tombrobber.torch', 'tombrobber.sack'],
  north: ['arctictrapper.lantern', 'mountaineer.iceaxe', 'mountaineer.rope', 'fisherman.walker'],
  wreck: ['diver.tank', 'marinebio.jar', 'marinebio.clipboard', 'castaway.bottle', 'beachcomber.bucket'],
  badlands: ['prospector.walk', 'desertguide.flask', 'geologist.walk', 'hiker.stick'],
  temple: ['templekeeper.lantern', 'jungleguide.machete', 'explorer.rope'],
  heist: ['detective.notes', 'guard.night', 'police.patrol'],
};
// how they talk: children like kids, teenagers like students, grandparents like elders, the rest a mix
const TALK = { kid: 'kid', toddler: 'kid', teen: 'student', grandparent: 'elder' };
const GROWN = ['casual', 'casual', 'tourist', 'couple', 'nerd', 'historian', 'artist', 'grump'];

/** What a plain person piece wears and how they talk: `ground` is 'sand' or 'grass', `region` the
 *  island's (an expedition's own name, or anything else for the home islands). */
export function townsperson(ground, region, seed) {
  const list = REGION[region] || (ground === 'sand' ? BEACH : TOWN);
  const r = (k) => Math.abs(Math.sin(seed * 12.9898 + k * 4.1414) * 43758.5453) % 1;
  const wears = list[Math.floor(r(1) * list.length) % list.length];
  return { wears, kind: TALK[wears.split('.')[0]] || GROWN[Math.floor(r(2) * GROWN.length) % GROWN.length] };
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
