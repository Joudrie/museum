// Room ratings: every room gets a score out of 100 (shown as 1-5 stars) from
// how full its walls are, how much decor it has, how clean it is and how much
// style it has. The museum's rating is the average over its open rooms, and it
// scales how many visitors come.
import { load } from './decor.js';
import { baseDecor } from './art.js';
import { layout, paintingsFor, roomAt } from './rooms.js';
import { loadItems } from './items.js';
import { dirtCount } from './staff.js';

const DECOR_KEY = 'curation.roomDecor';

export function roomRating(rooms, i) {
  const room = roomAt(rooms, i);
  const decor = { ...baseDecor(room, i), ...(load(DECOR_KEY, {})[i] || {}) };
  const spots = layout(room).slots.length;
  const hung = paintingsFor(rooms, i).length;
  const items = loadItems(i).length;
  const dirt = dirtCount(rooms, i);
  const styled = [decor.carpet, decor.plant !== 'none', decor.paperStyle !== 'plain', decor.wainscotStyle !== 'none'].filter(Boolean).length;
  const parts = [
    { label: 'Paintings', got: Math.round((40 * hung) / Math.max(1, spots)), max: 40, tip: `${hung} of ${spots} wall spots have a painting` },
    { label: 'Decor', got: Math.min(25, items * 5), max: 25, tip: items >= 5 ? 'Plenty of decor' : `${items} item${items === 1 ? '' : 's'}: add more from the toolkit` },
    { label: 'Clean', got: Math.max(0, 20 - dirt * 7), max: 20, tip: dirt ? `${dirt} mess${dirt === 1 ? '' : 'es'} on the floor: mop or hire a janitor` : 'Spotless' },
    { label: 'Style', got: Math.min(15, styled * 4), max: 15, tip: 'Wallpaper pattern, wainscot, carpet and plants each help' },
  ];
  const score = parts.reduce((n, p) => n + p.got, 0);
  return { score, stars: starsFor(score), parts };
}

export const starsFor = (score) => Math.max(1, Math.min(5, Math.round(score / 20)));
export const starText = (stars) => '★'.repeat(stars) + '☆'.repeat(5 - stars);

// Average score of the rooms that are open (a locked main hall doesn't count).
export function museumRating(rooms) {
  const open = rooms.map((r, i) => (r.locked ? null : roomRating(rooms, i).score)).filter((s) => s !== null);
  return open.length ? open.reduce((a, b) => a + b, 0) / open.length : 0;
}
