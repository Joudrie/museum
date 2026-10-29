// Ship models: pixel art as data.
import { draw, pack, pal } from './_px.js';

const hull = (x, y, top, w) => y >= top && y < top + 3 && x >= 1 + (y - top) && x < w - 1 - (y - top);
const ship = (masts, sails, flag) =>
  draw(18, 16, (x, y) => {
    if (hull(x, y, 12, 18)) return y === 12 ? 'b' : 'c';
    if (masts.includes(x) && y > 1 && y < 12) return 'd';
    for (const [mx, top, bot, w] of sails) if (y >= top && y <= bot && Math.abs(x - mx) <= w && x !== mx) return 'a';
    if (flag && y === 1 && x > flag && x < flag + 3) return 'b';
    return null;
  });
const LONGSHIP = draw(18, 12, (x, y) => {
  if (y >= 7 && y < 10 && x >= 1 + (y - 7) && x < 17 - (y - 7)) return y === 7 ? 'b' : 'c';
  if (y >= 4 && y < 7 && (x === 1 || x === 16) && y > 5 - (x === 1 ? 1 : 1)) return 'c';
  if (x === 9 && y > 0 && y < 7) return 'd';
  if (y >= 1 && y <= 5 && Math.abs(x - 9) <= 4 && x !== 9) return (x + y) % 4 < 2 ? 'a' : 'd';
  return null;
});

export default pack({
  id: 'ship', name: 'Ship models', noun: 'ship models', icon: '⛵', tab: 'makers', tabLabel: 'Makers', order: 13,
  intro: '{have} of {total} maker pieces found. Models, glass, clocks and inventions.',
  display: 'plinth', where: 'The workshop', how: 'bought', set: 'harbour-shelf', reward: 600,
  plaque: 'Four ships that carried people across oceans.',
  entries: [
    ['longship', 'Viking longship', LONGSHIP, pal('#a87848', '#e0c088', '#6a4424', '#c84030'), 1, 'viking',
      'A long, light Viking ship driven by oars and a single square sail. It sat so shallow in the water that crews could land on a beach or sail up a river.',
      ['Both ends were shaped alike, so it could reverse without turning.']],
    ['santa-maria', 'Santa María', ship([5, 10, 14], [[5, 3, 7, 3], [10, 2, 8, 4], [14, 4, 8, 2]], 0), pal('#f0e4cc', '#fffaf0', '#7a5230', '#4a3220'), 2, 'explorer',
      'Christopher Columbus’s flagship on his first voyage across the Atlantic, in 1492.',
      ['It ran aground off Hispaniola on Christmas Day and was left behind.']],
    ['mayflower', 'Mayflower', ship([6, 11], [[6, 3, 8, 3], [11, 2, 8, 3]], 11), pal('#e8dcc4', '#faf2e0', '#6a4828', '#3a2a18'), 2, 'pilgrim',
      'The ship that carried the Pilgrims from Plymouth, England, in 1620. They landed on Cape Cod after about two months at sea.',
      ['It carried about 100 passengers, crowded below deck.']],
    ['constitution', 'USS Constitution', ship([4, 9, 14], [[4, 3, 8, 3], [9, 2, 8, 4], [14, 3, 8, 3]], 9), pal('#f4ecdc', '#ffffff', '#2c2c38', '#8a5a30'), 3, 'warship',
      'Launched in 1797, “Old Ironsides” is still afloat in Boston Harbour: the oldest commissioned warship in the world still afloat.',
      ['She got her nickname when cannonballs seemed to bounce off her thick oak sides.']],
  ],
});
