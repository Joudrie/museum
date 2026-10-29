// Inventions: pixel art as data.
import { disc, draw, pack, pal, sym } from './_px.js';

const PRESS = sym(['..####..', '..#bbb#.', '..#aab#.', '#####aa#', '#bbbbaaa', '#aaaaaaa', '#cc#aa#.', '#cc#aa#.', '#####aa#', '#aaaaaaa', '#cccccc#']);
const BULB = draw(14, 16, (x, y) => {
  const dx = x - 6.5, dy = y - 5.5;
  if (y < 11 && Math.hypot(dx, dy) < 5.3) return Math.hypot(dx, dy) < 2 || (y > 4 && y < 8 && Math.abs(dx) < 2.2 && (x + y) % 2) ? 'd' : dx + dy < -1 ? 'b' : 'a';
  if (y >= 10 && y < 12 && Math.abs(dx) < 3 - (y - 10) * 0.4) return 'a';
  if (y >= 12 && y < 15 && Math.abs(dx) < 3) return y % 2 ? 'c' : 'd';
  return null;
});
const PHONE = sym(['.######.', '#bbbbbbb', '#baaaaaa', '#aaaaaaa', '.#aaaaaa', '..##aaaa', '...#aaaa', '...#aaaa', '..#aaaaa', '.#baaaaa', '#bbbbbbb', '.#######']);
const COMPASS = disc(14, (x, y, dx, dy, d) => {
  if (d < 5 && Math.abs(dx + dy) < 1.1 && dy < 0.5) return 'd';
  if (d < 5 && Math.abs(dx + dy) < 1.1 && dy >= 0.5) return 'c';
  if (d < 5.2 && d > 4.2 && ((Math.abs(dx) < 0.6) || (Math.abs(dy) < 0.6))) return 'c';
  return d < 5.4 ? 'a' : null;
});

export default pack({
  id: 'invention', name: 'Inventions', noun: 'inventions', icon: '💡', tab: 'makers', tabLabel: 'Makers', order: 13,
  intro: '{have} of {total} maker pieces found. Models, glass, clocks and inventions.',
  display: 'plinth', where: 'The workshop', how: 'bought', set: 'inventors-bench', reward: 600,
  plaque: 'Four inventions that changed how people live.',
  entries: [
    ['printing-press', 'Printing press', PRESS, pal('#a07840', '#d8b878', '#684820', '#2a2420'), 3, 'book',
      'Around 1450 Johannes Gutenberg in Germany combined movable metal type with a press, and books became cheap to make.',
      ['His most famous work is a Bible, printed in Mainz.']],
    ['light-bulb', 'Light bulb', BULB, pal('#f8ecb0', '#ffffff', '#c8b878', '#e8a838'), 2, 'electric',
      'In 1879 Thomas Edison’s team made a bulb with a carbon filament that glowed for hours. Many inventors worked on electric light before him.',
      ['A bulb glows because the thin wire inside gets white-hot.']],
    ['telephone', 'Telephone', PHONE, pal('#2c2c34', '#6c6c80', '#16161c', '#c8a040'), 3, 'sound',
      'In Boston in 1876 Alexander Graham Bell patented the telephone. He is said to have called out to his assistant, “Mr. Watson, come here.”',
      ['A thin plate called a diaphragm turns your voice into electric signals.']],
    ['compass', 'Compass', COMPASS, pal('#c8a050', '#f0d890', '#8a6a28', '#d83a30'), 1, 'sea',
      'A magnetised needle swings to point north, so it works on a cloudy night or far from land. It was first used in China.',
      ['Earth itself is a giant magnet.']],
  ],
});
