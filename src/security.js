// Security: a guard by the door, cameras you can buy, and the rare robbery
// when you come back after a while away (cameras stop it).
import { load, save } from './decor.js';
import { slotStates, setSlot } from './rooms.js';

const CAMERAS_KEY = 'curation.cameras';
const SEEN_KEY = 'curation.lastSeen';
export const CAMERA_COST = 400;
const AWAY = 60 * 60 * 1000; // a robbery can only happen after an hour away
const CHANCE = 0.04; // ...and then only rarely

export const hasCameras = () => !!load(CAMERAS_KEY, false);
export const buyCameras = () => save(CAMERAS_KEY, true);
export const resetSecurity = () => save(CAMERAS_KEY, false);

// Remember when the player was last here.
export function trackSeen() {
  const mark = () => save(SEEN_KEY, Date.now());
  mark();
  setInterval(mark, 30000);
  document.addEventListener('visibilitychange', mark);
}

// Called once when the game opens. Returns the stolen painting, or null.
// `force` makes it happen (for testing: add ?rob to the address).
export function maybeRob(rooms, force = false) {
  const last = load(SEEN_KEY, null);
  if (!force && (hasCameras() || !last || Date.now() - last < AWAY || Math.random() > CHANCE)) return null;
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
