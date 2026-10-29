// What the curator can wear (docs/PEOPLE-SPRITES.md, "Wardrobe"): every hat and outfit in the creator,
// whole costumes taken from the people classes, something to hold and something on the shoulder.
// Everything is open for now. To put something behind a challenge, add it to LOCKED with the hint the
// creator shows; the quest that earns it calls unlockLook(id). Ids look like 'costume:mummy',
// 'hat:witchhat', 'outfit:armour', 'hold:balloon' and 'shoulder:wings'.
import { CLASSES } from './classes.js';
import { CARRY, BUDDIES } from './parts.js';
import { load, save } from '../storage.js';

export const COSTUME_GROUPS = { spooky: 'Spooky', fantasy: 'Myth & fantasy', seasonal: 'Holidays', history: 'Through history', jobs: 'Jobs & play' };
// [id, name, the class variant it is taken from, group]
const LIST = [
  ['mummy', 'Mummy', 'mummy.wander', 'spooky'],
  ['ghost', 'Ghost', 'ghost.haunt', 'spooky'],
  ['skeleton', 'Skeleton', 'skeleton.wander', 'spooky'],
  ['vampire', 'Vampire', 'vampire.stroll', 'spooky'],
  ['zombie', 'Zombie', 'zombie.shamble', 'spooky'],
  ['witch', 'Witch', 'witch.broom', 'spooky'],
  ['ghostpirate', 'Ghost pirate', 'ghostpirate.haunt', 'spooky'],
  ['wizard', 'Wizard', 'wizard.staff', 'fantasy'],
  ['fairy', 'Fairy', 'fairy.flutter', 'fantasy'],
  ['cupid', 'Cupid', 'holidays.cupid', 'fantasy'],
  ['medusa', 'Medusa', 'myth.medusa', 'fantasy'],
  ['minotaur', 'Minotaur', 'myth.minotaur', 'fantasy'],
  ['hermes', 'Hermes', 'myth.hermes', 'fantasy'],
  ['athena', 'Athena', 'myth.athena', 'fantasy'],
  ['statue', 'Living statue', 'livingstatue.pose', 'fantasy'],
  ['mascot', 'Museum mascot', 'mascot.wave', 'fantasy'],
  ['santa', 'Santa', 'santa.sack', 'seasonal'],
  ['elf', 'Elf', 'santa.elf', 'seasonal'],
  ['snowman', 'Snowman', 'santa.snowman', 'seasonal'],
  ['bunny', 'Bunny', 'holidays.bunny', 'seasonal'],
  ['pumpkin', 'Pumpkin', 'holidays.pumpkin', 'seasonal'],
  ['pharaoh', 'Pharaoh', 'egypt.pharaoh', 'history'],
  ['hoplite', 'Greek hoplite', 'greek.hoplite', 'history'],
  ['legionary', 'Roman legionary', 'roman.legionary', 'history'],
  ['gladiator', 'Gladiator', 'roman.gladiator', 'history'],
  ['knight', 'Knight', 'medieval.knight', 'history'],
  ['royal', 'King or queen', 'medieval.king', 'history'],
  ['jester', 'Jester', 'medieval.jester', 'history'],
  ['lady', 'Medieval lady', 'medieval.lady', 'history'],
  ['viking', 'Norse shield-bearer', 'norse.shieldmaiden', 'history'],
  ['gent', 'Victorian gent', 'victorian.gentleman', 'history'],
  ['bustle', 'Victorian lady', 'victorian.lady', 'history'],
  ['flapper', 'Flapper', 'twenties.flapper', 'history'],
  ['fifties', '1950s', 'decades.fifties', 'history'],
  ['disco', 'Disco', 'decades.seventies', 'history'],
  ['eighties', '1980s', 'decades.eighties', 'history'],
  ['pirate', 'Pirate captain', 'piratecaptain.telescope', 'jobs'],
  ['diver', 'Diver', 'diver.tank', 'jobs'],
  ['explorer', 'Explorer', 'explorer.map', 'jobs'],
  ['archaeologist', 'Archaeologist', 'archaeologist.fedora', 'jobs'],
  ['astronomer', 'Astronomer', 'astronomer.scope', 'jobs'],
  ['chef', 'Chef', 'chef.pan', 'jobs'],
  ['clown', 'Clown', 'clown.balloon', 'jobs'],
  ['mime', 'Mime', 'mime.box', 'jobs'],
  ['magician', 'Magician', 'magician.wand', 'jobs'],
  ['ballet', 'Ballet dancer', 'dancer.ballet', 'jobs'],
  ['detective', 'Detective', 'detective.notes', 'jobs'],
  ['lifeguard', 'Lifeguard', 'lifeguard.watch', 'jobs'],
  ['janitor', 'Janitor', 'janitor.mop', 'jobs'],
  ['builder', 'Construction worker', 'construction.dig', 'jobs'],
  ['scientist', 'Scientist', 'scientist.flask', 'jobs'],
];

// a costume is the class's own look and colours (the first of each list), worn over the curator:
// it keeps their face, hair and build unless the costume covers or changes them
function fromClass(ref) {
  const [cid, vid] = ref.split('.');
  const cls = CLASSES[cid];
  const v = cls?.variants[vid];
  if (!v) return null;
  const look = { ...cls.look, ...v.look };
  delete look.hair;
  if (v.look?.hair) look.hair = v.look.hair;
  if (v.carry) look.carry = v.carry;
  const buddy = v.buddy || cls.look?.buddy || v.look?.buddy;
  if (buddy) look.buddy = buddy;
  const beard = (v.facial || cls.facial || ['none'])[0];
  if (beard !== 'none' || (v.facial || cls.facial || []).every((f) => f === 'none')) look.facial = beard;
  const colors = {};
  const specs = { ...cls.colors, ...v.colors };
  Object.entries(specs).forEach(([ch, spec]) => {
    const val = Array.isArray(spec) ? spec[0] : spec;
    if (typeof val === 'string' && !val.startsWith('=')) colors[ch] = val;
  });
  Object.entries(specs).forEach(([ch, spec]) => typeof spec === 'string' && spec.startsWith('=') && (colors[ch] = colors[spec.slice(1)]));
  return { look, colors };
}
export const COSTUMES = Object.fromEntries(LIST.map(([id, label, ref, group]) => [id, { label, group, ref, ...fromClass(ref) }]).filter(([, c]) => c.look));

// things to hold while you walk, and on the shoulder
export const HOLD = ['balloon', 'umbrella', 'parasol', 'bouquet', 'icecream', 'teddy', 'balloondog', 'kitten', 'lantern', 'torch', 'staff', 'broom', 'sword', 'shield', 'bolt', 'bow', 'present', 'boombox', 'coffee', 'books', 'newspaper', 'cane', 'fish', 'map', 'mic', 'palette', 'basket', 'mop', 'pan', 'sign'].filter((id) => CARRY[id]);
export const SHOULDER = Object.fromEntries(Object.keys(BUDDIES).map((id) => [id, { parrot: 'Parrot', gull: 'Gull', wings: 'Wings' }[id] || BUDDIES[id]]));

// ---------- Locks (nothing is locked yet) ----------
// 'costume:mummy': 'Find the lost tomb' would lock the mummy costume with that hint.
export const LOCKED = {};
const KEY = 'curation.wardrobe';
const opened = () => new Set(load(KEY, { unlocked: [] }).unlocked || []);
/** The hint for something locked, or null when it can be worn. */
export const lockHint = (id) => (LOCKED[id] && !opened().has(id) ? LOCKED[id] : null);
export const isLocked = (id) => !!lockHint(id);
/** A quest calls this when the challenge is done. */
export function unlockLook(id) {
  const set = opened();
  set.add(id);
  save(KEY, { unlocked: [...set] });
}

// What a costume clears from the curator's own look before it goes on
const CLEAR = { hat: null, acc: null, acc2: null, glasses: null, collar: null, legs: null, feet: null, second: false, carry: null, buddy: null };

// The curator's look from their saved character: the creator's choices, then any cosmetics they wear
// (`worn`: [{ look, colors }], hats and outfits from the progression shop), then a costume, then
// whatever they hold and have on their shoulder. Returns the colors and look for makeCharacter.
export function curatorLook(ch = {}, worn = []) {
  const open = (kind, id) => id && id !== 'none' && !isLocked(`${kind}:${id}`);
  let look = {
    hat: open('hat', ch.hat) ? ch.hat : null,
    facial: ch.facial,
    glasses: ch.glasses && ch.glasses !== 'none' ? ch.glasses : null,
    hair: ch.hair === 'bald' ? null : ch.hair,
    bald: ch.hair === 'bald',
    outfit: !ch.outfit || open('outfit', ch.outfit) ? ch.outfit : 'suit',
    acc: ch.acc,
    freckles: !!ch.freckles,
    blush: !!ch.blush,
    earrings: !!ch.earrings,
    build: ch.build,
    legs: ch.legs,
    feet: ch.feet,
    second: !!ch.u, // the outfit's optional second color (outfitAccent in people/parts.js)
  };
  let colors = { ...ch };
  worn.forEach((w) => {
    look = { ...look, ...w.look };
    colors = { ...colors, ...w.colors };
  });
  const costume = open('costume', ch.costume) && COSTUMES[ch.costume];
  if (costume) {
    look = { ...look, ...CLEAR, ...costume.look };
    colors = { ...colors, ...costume.colors };
  }
  if (open('hold', ch.hold) && CARRY[ch.hold]) look.carry = ch.hold;
  if (open('shoulder', ch.shoulder) && BUDDIES[ch.shoulder]) look.buddy = ch.shoulder;
  return { colors, look };
}
