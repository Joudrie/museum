// The Curator's Office: level it up with gold to unlock more rooms, staff
// and exhibits. Run by the old caretaker from a desk in the first room.
import { load, save } from './storage.js';
import { ITEMS } from './items.js';
import { OFFICE_LEVELS } from './economy.js';

const OFFICE_KEY = 'curation.office';

// Level 1 is where you start. cost = gold to reach that level (numbers live in economy.js).
export const LEVELS = OFFICE_LEVELS;
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
