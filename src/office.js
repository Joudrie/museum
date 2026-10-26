// The Curator's Office: level it up with gold to unlock more rooms, staff
// and exhibits. Run by the old caretaker from a desk in the first room.
import { load, save } from './storage.js';
import { ITEMS } from './items.js';

const OFFICE_KEY = 'curation.office';

// Level 1 is where you start. cost = gold to reach that level.
export const LEVELS = [
  null,
  { cost: 0, rooms: 4 },
  { cost: 500, rooms: 6, unlocks: 'Relics, statues, suits of armor and the coffee counter' },
  { cost: 2000, rooms: 9, unlocks: 'Big halls, science exhibits and fountains' },
  { cost: 8000, rooms: 13, unlocks: 'The T-rex skeleton' },
  { cost: 30000, rooms: Infinity, unlocks: 'Unlimited rooms' },
];
export const MAX_LEVEL = LEVELS.length - 1;
export const BIG_HALL_LEVEL = 3;

export const officeLevel = () => Math.min(MAX_LEVEL, load(OFFICE_KEY, 1));
export const perks = (lvl = officeLevel()) => LEVELS[lvl];
export const itemLevel = (type) => ITEMS[type].lvl || 1;

export function setOfficeLevel(lvl) {
  save(OFFICE_KEY, lvl);
}

export function resetOffice() {
  save(OFFICE_KEY, 1);
}

// Plain-language list of what a level gives.
export function describe(lvl) {
  const p = LEVELS[lvl];
  const lines = [p.rooms === Infinity ? 'Unlimited rooms' : `Up to ${p.rooms} rooms`];
  if (p.unlocks && p.unlocks !== 'Unlimited rooms') lines.push(p.unlocks);
  return lines;
}
