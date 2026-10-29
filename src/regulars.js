// Visitors remember you. Talk to the same visitor (same name and type) again and again and
// they become a regular, with their own lines. Names come from lines.js, so repeats happen.
import { load, save } from './storage.js';

const KEY = 'curation.regulars'; // { "Dennis|nerd": { talks: 3, first: ms } }
export const REGULAR_AT = 3; // talks before someone counts as a regular

const NOTICED = [
  'Back again! Third time lucky.',
  'Oh, it’s you, the curator. I keep coming back.',
  'I told my friends about this place.',
  'You remembered me? I’ve been in a few times now.',
];
const FOND = [
  'I’m a regular now. I think I have a favorite bench.',
  'It already feels like my museum too. Don’t tell anyone.',
  'Every visit I notice something new in here.',
];
const KIND = {
  nerd: ['I’ve finished my notes on this wing. Starting on the next.'],
  casual: ['This is officially my spot now.'],
  fanboy: ['Visit number {n}! I’m counting!'],
  snob: ['I suppose I keep returning. Do not read into it.'],
  kid: ['I came back! Mom said I could!'],
  grump: ['Still here. Still grumbling. Still coming.'],
  tourist: ['I told my whole tour group to come back with me.'],
  artist: ['I brought a bigger sketchbook this time.'],
  influencer: ['Tagged you in my story. Hope that’s okay.'],
  couple: ['We come here whenever we can now.'],
  historian: ['I have started a file on your collection.'],
  student: ['My project is about this place now.'],
  elder: ['Tuesday again, dear. Lovely to see you.'],
};

const state = () => load(KEY, {});
const idOf = (name, kind) => `${name}|${kind}`;
export const talks = (name, kind) => state()[idOf(name, kind)]?.talks || 0;
export const isRegular = (name, kind) => talks(name, kind) >= REGULAR_AT;
export const regularCount = () => Object.values(state()).filter((r) => r.talks >= REGULAR_AT).length;

// Record this conversation and return the visitor's line if they know you, else null.
export function remember(name, kind, r = Math.random()) {
  const all = state();
  const id = idOf(name, kind);
  const n = (all[id]?.talks || 0) + 1;
  all[id] = { talks: n, first: all[id]?.first || Date.now() };
  save(KEY, all);
  if (n < REGULAR_AT) return null;
  const pool = n === REGULAR_AT ? NOTICED : r < 0.5 && KIND[kind] ? KIND[kind] : FOND;
  return pool[Math.floor(r * 997) % pool.length].replace('{n}', n);
}

export const resetRegulars = () => save(KEY, {});
