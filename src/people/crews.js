// Crews: a few people placed together as one builder piece (docs/PEOPLE-SPRITES.md, section M).
// Each member is a class variant from classes.js and where they stand, in tiles from the piece's
// bottom-left tile (dy < 0 is a little further back). Flipped members work facing the other way.
export const CREWS = {
  dock: { label: 'Dock crew', members: [['fisherman.dock', 0, 0], ['dockworker.crate', 1, -0.3], ['boatman.oar', 2, 0], ['harbourmaster.clipboard', 3, -0.3]] },
  site: { label: 'Building site', members: [['foreman.plans', 0, 0], ['construction.dig', 1, -0.3, true], ['construction.barrow', 2, 0], ['flagger.flag', 3, -0.3], ['machineop.radio', 4, 0]] },
  staff: { label: 'Museum staff', members: [['janitor.mop', 0, 0], ['guard.day', 1, -0.3], ['curator.clipboard', 2, 0], ['conservator.inspect', 3, -0.3]] },
  dig: { label: 'Dig camp', members: [['archaeologist.brush', 0, 0], ['fieldassistant.sieve', 1, -0.3, true], ['fieldassistant.bucket', 2, 0], ['geologist.pick', 3, -0.3]] },
  market: { label: 'Market square', members: [['vendor.cart', 0, 0], ['baker.bread', 1, -0.3], ['florist.bouquet', 2, 0], ['shopper.bags', 3, -0.3], ['busker.guitar', 4, 0]] },
  school: { label: 'School trip', members: [['educator.wave', 0, -0.3], ['classtrip.trip', 1, 0], ['classtrip.trip', 2, -0.3], ['classtrip.trip', 3, 0], ['classtrip.trip', 4, -0.3]] },
  film: { label: 'Film set', members: [['filmcrew.director', 0, 0], ['filmcrew.camera', 1, -0.3], ['actor.skull', 2, 0, true], ['filmcrew.boom', 3, -0.3]] },
  pirates: { label: 'Pirate cove', members: [['piratecaptain.telescope', 0, 0], ['piratecrew.cutlass', 1, -0.3], ['piratecrew.lookout', 2, 0], ['piratecrew.peg', 3, -0.3]] },
  frozen: { label: 'Frozen camp', members: [['fisherman.ice', 0, 0], ['arctictrapper.fish', 1, -0.3, true], ['meteorologist.balloon', 2, 0], ['sleddog.dog', 3, -0.3]] },
  beach: { label: 'Beach day', members: [['lifeguard.watch', 0, 0], ['swimmer.beach', 1, -0.3], ['sunbather.lounge', 2, 0], ['surfer.board', 3, -0.3], ['beachcomber.detect', 4, 0]] },
};
// the width of a crew in tiles
export const crewWidth = (crew) => Math.max(...crew.members.map(([, dx]) => dx)) + 1;
