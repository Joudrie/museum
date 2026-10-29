// Ship models: pixel art as data.
import { draw, pack, pal } from './_px.js';

// A sailing ship: a curved hull, then masts, each carrying a square sail that widens toward the deck.
const hullAt = (x, y, w, top) => y >= top && y < top + 3 && x >= (y - top) * 1 && x < w - (y - top);
const ship = (masts, flag) =>
  draw(20, 16, (x, y) => {
    if (hullAt(x, y, 20, 12)) return y === 12 ? 'b' : 'c';
    if (y === 11 && x > 0 && x < 19) return 'd';
    for (const [mx, top, bot, half] of masts) {
      if (x === mx && y >= top - 1 && y <= 11) return 'd';
      if (y >= top && y <= bot && Math.abs(x - mx) <= Math.min(half, 1 + Math.round(((y - top) * half) / (bot - top || 1))) && x !== mx) return y === top ? 'b' : 'a';
    }
    if (flag !== undefined && y === 0 && x > flag && x < flag + 3) return 'b';
    return null;
  });
const LONGSHIP = draw(20, 12, (x, y) => {
  if (y >= 8 && y < 11 && x >= 1 + (y - 8) && x < 19 - (y - 8)) return y === 8 ? 'b' : 'c';
  if (y >= 5 && y < 8 && (x === 1 || x === 18)) return 'c';
  if (y === 4 && (x === 1 || x === 18)) return 'd';
  if (x === 10 && y >= 1 && y < 8) return 'd';
  if (y >= 2 && y <= 6 && Math.abs(x - 10) <= 5 && x !== 10) return (x + y) % 4 < 2 ? 'a' : 'd';
  return null;
});

export default pack({
  id: 'ship', name: 'Ship models', noun: 'ship models', icon: 'boat', tab: 'makers', tabLabel: 'Makers', order: 13,
  intro: '{have} of {total} maker pieces found. Models, glass, clocks and inventions.',
  display: 'plinth', where: 'The workshop', how: 'bought', set: 'harbour-shelf', reward: 600,
  plaque: 'Four ships that carried people across oceans.',
  entries: [
    ['longship', 'Viking longship', LONGSHIP, pal('#a87848', '#e0c088', '#6a4424', '#c84030'), 1, 'viking',
      'A long, light Viking ship driven by oars and a single square sail. It sat so shallow in the water that crews could land on a beach or sail up a river.',
      ['Both ends were shaped alike, so it could reverse without turning.']],
    ['santa-maria', 'Santa María', ship([[5, 4, 9, 3], [10, 2, 9, 4], [15, 5, 9, 3]], 9), pal('#f0e4cc', '#fffaf0', '#7a5230', '#4a3220'), 2, 'explorer',
      'Christopher Columbus’s flagship on his first voyage across the Atlantic, in 1492.',
      ['It ran aground off Hispaniola on Christmas Day and was left behind.']],
    ['mayflower', 'Mayflower', ship([[7, 3, 9, 4], [13, 4, 9, 3]], 13), pal('#e8dcc4', '#faf2e0', '#6a4828', '#3a2a18'), 2, 'pilgrim',
      'The ship that carried the Pilgrims from Plymouth, England, in 1620. They landed on Cape Cod after about two months at sea.',
      ['It carried about 100 passengers, crowded below deck.']],
    ['constitution', 'USS Constitution', ship([[4, 3, 9, 3], [10, 1, 9, 4], [16, 3, 9, 3]], 10), pal('#f4ecdc', '#ffffff', '#2c2c38', '#8a5a30'), 3, 'warship',
      'Launched in 1797, “Old Ironsides” is still afloat in Boston Harbour: the oldest commissioned warship in the world still afloat.',
      ['She got her nickname when cannonballs seemed to bounce off her thick oak sides.']],
  ],
});
