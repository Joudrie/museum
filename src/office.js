// The Curator's Office: level it up with gold to unlock more rooms, staff
// and exhibits. Run by the old caretaker from a desk in the first room.
import { load, save } from './decor.js';
import { ITEMS } from './items.js';

const OFFICE_KEY = 'curation.office';

// Level 1 is where you start. cost = gold to reach that level.
export const LEVELS = [
  null,
  { cost: 0, rooms: 3, janitors: 1 },
  { cost: 500, rooms: 5, janitors: 2, unlocks: 'Relics, statues, suits of armor and the coffee counter' },
  { cost: 2000, rooms: 8, janitors: 3, unlocks: 'Big halls, science exhibits and fountains' },
  { cost: 8000, rooms: 12, janitors: 3, unlocks: 'The T-rex skeleton' },
  { cost: 30000, rooms: Infinity, janitors: 3, unlocks: 'Unlimited rooms' },
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
  const lines = [p.rooms === Infinity ? 'Unlimited rooms' : `Up to ${p.rooms} rooms`, `Up to ${p.janitors} janitor${p.janitors > 1 ? 's' : ''}`];
  if (p.unlocks && p.unlocks !== 'Unlimited rooms') lines.push(p.unlocks);
  return lines;
}
