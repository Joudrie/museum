// Security: a guard by the door, cameras you can buy, and the rare robbery
// when you come back after a while away (cameras stop it).
import { load, save } from './storage.js';
import { slotStates, setSlot } from './rooms.js';
import { CAMERA_COST as COST, ROBBERY, SECURITY, BOUNTY } from './economy.js';

const CAMERAS_KEY = 'curation.cameras';
const SEEN_KEY = 'curation.lastSeen';
export const CAMERA_COST = COST;
const AWAY = ROBBERY.awayMs; // a robbery can only happen after an hour away
const CHANCE = ROBBERY.chance; // ...and then only rarely

// Stored as a tier number (older saves stored `true` for real cameras).
export const securityTier = () => {
  const v = load(CAMERAS_KEY, 0);
  return v === true ? 2 : v === false ? 0 : v;
};
export const hasCameras = () => securityTier() >= 2;
export const nextSecurity = () => SECURITY[securityTier() + 1] || null;
export const buyCameras = () => save(CAMERAS_KEY, Math.min(SECURITY.length - 1, securityTier() + 1));
export const resetSecurity = () => save(CAMERAS_KEY, 0);

// Remember when the player was last here.
export function trackSeen() {
  const mark = () => save(SEEN_KEY, Date.now());
  mark();
  setInterval(mark, 30000);
  document.addEventListener('visibilitychange', mark);
}

// How long the player was away (ms), 0 if first visit. Read before trackSeen().
export const awayFor = () => {
  const last = load(SEEN_KEY, null);
  return last ? Math.max(0, Date.now() - last) : 0;
};

// Called once when the game opens. Returns the stolen painting, { caught: true, bounty }
// when security stopped and caught the thief, or null.
// `force` makes it happen (for testing: add ?rob to the address).
export function maybeRob(rooms, force = false) {
  const last = load(SEEN_KEY, null);
  if (!force && (!last || Date.now() - last < AWAY || Math.random() > CHANCE)) return null;
  const tier = SECURITY[securityTier()];
  if (!force && Math.random() < tier.stop) return tier.caught ? { caught: true, bounty: BOUNTY } : null;
  const hung = [];
  rooms.forEach((room, i) => {
    if (room.locked) return;
    slotStates(rooms, i).forEach((s) => s.kind === 'painting' && s.painting && hung.push({ i, s }));
  });
  if (!hung.length) return null;
  const { i, s } = hung[Math.floor(Math.random() * hung.length)];
  setSlot(i, s, { kind: 'empty' });
  return { ...s.painting, room: i };
}
