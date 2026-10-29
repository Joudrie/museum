// Clocks and timekeepers: pixel art as data.
import { disc, draw, pack, pal, sym } from './_px.js';

const SUNDIAL = disc(14, (x, y, dx, dy, d) => (d < 5 && ((dx > 0 && Math.abs(dy + dx * 0.3) < 0.7) || (d > 4 && (x + y) % 3 === 0)) ? 'd' : null));
const CLEPSYDRA = sym(['.#####..', '#bbbbbbb', '#baaaaaa', '.#aaaaaa', '..#daaaa', '..#ddaaa', '...#dd#a', '...#dd#.', '..#dddd#', '.#bdddd#', '#bbddddd', '#########']);
const HOURGLASS = sym(['########', '#bbbbbbb', '.#aaaaaa', '..#aaaaa', '...#aaad', '....#add', '....#add', '...#a#dd', '..#aad#d', '.#aaddd#', '#bbdddd#', '########']);
const PENDULUM = draw(14, 18, (x, y) => {
  if (y < 11) {
    if (x < 1 || x > 12 || y < 1) return x < 1 || x > 12 || y < 1 ? 'c' : null;
    const dx = x - 6.5, dy = y - 5.6;
    if (Math.hypot(dx, dy) < 4) return Math.hypot(dx, dy) > 3.2 ? 'c' : (Math.abs(dx) < 0.6 && dy < 0.6 && dy > -3) || (Math.abs(dy) < 0.6 && dx > 0 && dx < 2.5) ? 'd' : 'b';
    return 'a';
  }
  if (x === 6 || x === 7) return y < 15 ? 'd' : null;
  if (y >= 15 && Math.hypot(x - 6.5, y - 15.5) < 2.5) return 'd';
  return null;
});

export default pack({
  id: 'clock', name: 'Timekeepers', noun: 'timekeepers', icon: 'clock', tab: 'makers', tabLabel: 'Makers', order: 13,
  intro: '{have} of {total} maker pieces found. Models, glass, clocks and inventions.',
  display: 'plinth', where: 'The clockmaker', how: 'bought', set: 'clock-wall', reward: 600,
  plaque: 'Four ways people have counted the hours.',
  entries: [
    ['sundial', 'Sundial', SUNDIAL, pal('#c8c4b8', '#f0ece0', '#8a867a', '#2a2a30'), 1, 'ancient',
      'A sundial tells the time by the shadow of a pointer, which moves as the Sun crosses the sky.',
      ['It is useless at night or under cloud.']],
    ['water-clock', 'Water clock', CLEPSYDRA, pal('#c8a068', '#f0d8a8', '#8a6a38', '#58a8e0'), 2, 'ancient',
      'A water clock, or clepsydra, measures time by water dripping slowly from one vessel into another. Egypt and Greece both used them.',
      ['Unlike a sundial, it still works at night.']],
    ['hourglass', 'Hourglass', HOURGLASS, pal('#e8dcc0', '#fffaf0', '#a8987c', '#e0b050'), 1, 'medieval',
      'Sand runs through a narrow neck at a steady rate, so the same amount always takes the same time. Ships used them to measure watches.',
      ['Different glasses measured different lengths of time.']],
    ['pendulum-clock', 'Pendulum clock', PENDULUM, pal('#a87038', '#f0d8a0', '#6a4420', '#d8b040'), 3, 'invention',
      'In 1656 the Dutch scientist Christiaan Huygens built the first pendulum clock. A swinging weight keeps very steady time.',
      ['It made clocks far more accurate than anything before.']],
  ],
});
