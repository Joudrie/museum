// Stamps: pixel art as data.
import { draw, pack, pal } from './_px.js';

// A stamp with a perforated edge; `pic(x, y)` paints the middle (x, y from 0 inside the frame).
const stamp = (pic) => draw(14, 16, (x, y) => {
  if ((x === 0 || x === 13) && y % 2 === 0) return null;
  if ((y === 0 || y === 15) && x % 2 === 0) return null;
  if (x < 2 || x > 11 || y < 2 || y > 13) return 'b';
  return pic(x - 2, y - 2) || 'a';
});
const PENNY = stamp((x, y) => ((x - 4.5) ** 2 / 14 + (y - 5.5) ** 2 / 24 < 1 ? ((x - 4.5) ** 2 / 5 + (y - 4) ** 2 / 6 < 1 ? 'b' : 'c') : null));
const JENNY = stamp((x, y) => (y > 2 && y < 9 && Math.abs(x - 4.5) < 0.8 + (8 - y) * 0.35 ? 'd' : y === 10 ? 'c' : null));
const TRESKILLING = stamp((x, y) => (Math.abs(x - 4.5) < 2.4 && Math.abs(y - 5.5) < 3.4 ? ((x + y) % 2 ? 'c' : 'd') : null));
const MAURITIUS = stamp((x, y) => (y < 2 || y > 8 ? 'c' : Math.hypot(x - 4.5, y - 5.5) < 2.6 ? 'd' : null));

export default pack({
  id: 'stamp', name: 'Stamps', noun: 'stamps', icon: '✉️', tab: 'treasures', tabLabel: 'Treasures', order: 12,
  intro: '{have} of {total} treasures found. Dig sites and expeditions turn them up.',
  where: 'Old letters', how: 'gift', set: 'stamp-album', reward: 500,
  plaque: 'Four famous stamps: a first, a mistake and a rarity.',
  entries: [
    ['penny-black', 'Penny Black', PENNY, pal('#303038', '#f0e8d8', '#14141c', '#585868'), 2, 'british',
      'The first postage stamp stuck on a letter, issued in Britain in 1840. It shows the young Queen Victoria and cost one penny.',
      ['Before it, the person who received a letter paid the postage.']],
    ['inverted-jenny', 'Inverted Jenny', JENNY, pal('#e8e0d0', '#2a54a8', '#c43a30', '#2a54a8'), 4, 'american',
      'A 1918 American airmail stamp whose little biplane was printed upside down. One sheet of 100 got out by mistake.',
      ['It is one of the best-known mistakes in stamp collecting.']],
    ['treskilling-yellow', 'Treskilling Yellow', TRESKILLING, pal('#f0c848', '#fff0c0', '#a88820', '#d8a820'), 4, 'swedish',
      'A Swedish stamp from 1855 printed in yellow by mistake. It should have been green.',
      ['Only one is known, and it has changed hands for record sums.']],
    ['blue-mauritius', 'Blue Mauritius', MAURITIUS, pal('#4a78d0', '#d8e4f8', '#2a4a94', '#a8c0f0'), 3, 'island',
      'One of the first stamps made outside Britain, printed on the island of Mauritius in 1847. Very few survive.',
      ['Its first printing says “Post Office” where later ones say “Post Paid”.']],
  ],
});
