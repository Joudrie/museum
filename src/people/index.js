// People classes in the game: one placeable piece per class variant (builder ref
// `t:npc_<class>_<variant>`), and the look of each person placed, rolled from a seed so
// every janitor is a little different. Classes are data in classes.js; parts in parts.js.
import { CLASSES, GROUPS } from './classes.js';
import { CREWS, crewWidth } from './crews.js';
import { POSE_RATE } from './parts.js';
import { personRows, poseRows, personPalette, drawRows } from '../art.js';

export { CLASSES, GROUPS, CREWS };

export const SKINS = ['#f2c6a0', '#e0ac80', '#c68a5e', '#9a6440', '#6e4428', '#ffe0c8', '#b57850', '#583420', '#f8d8c0', '#d49a6a', '#8a5636', '#4a2c1a'];
export const HAIR_COLORS = ['#4a2e20', '#1e1410', '#d9b45a', '#a0522d', '#2b1a10', '#c0703f', '#e8d8a8', '#8a3a2a', '#3a2a22', '#6b4430'];
const GREYS = ['#9a9a9a', '#c8c8c8', '#e8e8e8'];
const ADULT = 1.15; // same as the curator
const PREFIX = 'npc_';

// every person you can place: { id: 'janitor.mop', cls, variant, ref }
export const PEOPLE_LIST = Object.entries(CLASSES).flatMap(([cid, cls]) =>
  Object.entries(cls.variants).map(([vid, v]) => ({ id: `${cid}.${vid}`, cid, vid, cls, v, tile: `${PREFIX}${cid}_${vid}`, label: `${cls.label}: ${v.label}`, group: GROUPS[cls.group] })),
);
const BY_TILE = Object.fromEntries(PEOPLE_LIST.map((p) => [p.tile, p]));
const BY_ID = Object.fromEntries(PEOPLE_LIST.map((p) => [p.id, p]));
// the person a builder tile stands for, or null
export const personOfTile = (name) => BY_TILE[name] || null;
// a crew placed as one piece (`t:crew_<id>`): its members, or null
const CREW_PREFIX = 'crew_';
export const crewOfTile = (name) => (name.startsWith(CREW_PREFIX) && CREWS[name.slice(CREW_PREFIX.length)]) || null;

// Stirs a seeded random into independent rolls, so nearby seeds don't give alike people.
function mixer(r) {
  const s0 = (Math.floor(r(1) * 4294967296) ^ Math.floor(r(2) * 65536)) >>> 0;
  return (k) => {
    let t = (s0 + Math.imul(k + 1, 0x9e3779b9)) >>> 0;
    t = Math.imul(t ^ (t >>> 16), 0x21f0aaad);
    t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
    return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
  };
}

// A placed person: colors, look and how they behave. `seed(k)` is a seeded random in [0, 1).
export function personFor(id, seed = Math.random) {
  const p = BY_ID[id];
  if (!p) return null;
  const r = mixer(seed);
  const { cls, v } = p;
  const pick = (list, k) => (Array.isArray(list) ? list[Math.floor(r(k) * list.length) % list.length] : list);
  const colors = {};
  const specs = { ...cls.colors, ...v.colors };
  Object.entries(specs).forEach(([ch, spec], i) => {
    const val = pick(spec, 40 + i);
    if (typeof val === 'string' && !val.startsWith('=')) colors[ch] = val;
  });
  Object.entries(specs).forEach(([ch, spec]) => typeof spec === 'string' && spec.startsWith('=') && (colors[ch] = colors[spec.slice(1)]));
  if (!colors.s) colors.s = pick(SKINS, 1);
  const kid = !!v.kid;
  const look = { ...cls.look, ...v.look };
  delete look.hair;
  ['pose', 'carry', 'ground', 'buddy'].forEach((k) => k in v && (look[k] = v[k]));
  // hair: from the class's list; now and then someone is bald or going grey
  const hair = pick(v.hair || cls.hair || ['short'], 2);
  if ((!kid && r(3) < 0.07 && !look.hat) || hair === 'bald' || look.bald) look.bald = true;
  else look.hair = v.look?.hair || hair;
  // (hair that stands up would poke through the first caps, sun hats and wreaths)
  if (['cap', 'sun', 'crown', 'laurel'].includes(look.hat)) look.hair = { bun: 'ponytail', afro: 'curly', mohawk: 'buzz', wild: 'short' }[look.hair] || look.hair;
  if (!colors.h) colors.h = !kid && r(4) < 0.15 ? pick(GREYS, 5) : pick(HAIR_COLORS, 5);
  // about half grow facial hair (if the class does); the others may wear earrings
  const smooth = kid || r(6) < 0.5;
  if (!look.facial) look.facial = smooth ? 'none' : pick(v.facial || cls.facial || ['none'], 7);
  if (smooth && !kid && r(8) < 0.35) look.earrings = true;
  if (kid && r(9) < 0.3) look.freckles = true;
  if (!('glasses' in look) && r(10) < 0.1) look.glasses = pick(['round', 'square', 'half'], 11);
  if (look.glasses === 'none') delete look.glasses;
  if (look.hat === 'none') delete look.hat;
  if (look.acc === 'none') delete look.acc;
  look.build = pick(v.build || cls.build || ['standard'], 12);
  const still = !!(look.pose || (look.ground && !look.carry));
  const range = v.range ?? (still ? 0 : cls.range ?? 3);
  return {
    colors,
    look,
    scale: v.tiny ? ADULT * 0.7 : kid ? ADULT * 0.85 : ADULT,
    pose: look.pose || null,
    rate: POSE_RATE[look.pose] || 2,
    range,
    title: cls.label,
    name: pick(cls.names, 13),
    lines: cls.lines,
    alpha: cls.alpha || null,
  };
}

// The builder's picture of a person (one frame, at work if they have a job to do):
// drawn the first time a list asks for it. A crew draws each member where they stand.
function drawPerson(g, id, x, bottom, seed, flip) {
  const one = personFor(id, seed);
  const rows = one.pose ? poseRows(one.look)[0] : personRows('down', one.look);
  g.fillStyle = 'rgba(0,0,0,0.25)';
  g.beginPath();
  g.ellipse(x + 16, bottom + 1, 8, 2, 0, 0, Math.PI * 2);
  g.fill();
  drawRows(g, rows, personPalette(one.colors), bottom, x, !!(flip && one.pose));
}
const SEED = (k) => [0.1, 0.35, 0.6, 0.85][k % 4];
function preview(p) {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 48;
  drawPerson(c.getContext('2d'), p.id, 0, 44, SEED);
  return c;
}
function crewPreview(crew) {
  const c = document.createElement('canvas');
  c.width = crewWidth(crew) * 32;
  c.height = 48;
  const g = c.getContext('2d');
  [...crew.members].sort((a, b) => a[2] - b[2]).forEach(([id, dx, dy, flip], k) => drawPerson(g, id, Math.round(dx * 32), 44 + Math.round(dy * 32), (n) => SEED(n + k), flip));
  return c;
}

// one builder piece per class variant, grouped under People, and one per crew
function lazyFrames(t, draw) {
  let frames = null;
  Object.defineProperty(t, 'frames', {
    enumerable: true,
    configurable: true,
    get: () => (frames ||= [draw()]),
    set: (f) => (frames = f),
  });
}
export function addPeople(add) {
  PEOPLE_LIST.forEach((p) => lazyFrames(add(p.tile, [], { group: `People: ${p.group}`, label: p.label, h: 48, walk: 'person' }), () => preview(p)));
  Object.entries(CREWS).forEach(([id, crew]) =>
    lazyFrames(add(`${CREW_PREFIX}${id}`, [], { group: 'People: Crews', label: `${crew.label} (${crew.members.length} people)`, w: crewWidth(crew) * 32, h: 48, walk: 'person' }), () => crewPreview(crew)),
  );
}
