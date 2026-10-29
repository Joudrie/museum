// Butterflies and insects, written as pixel rows through the shape helpers.
import { draw, pack, pal, sym } from './_px.js';

const moth = sym;
const LUNA = moth(['...##...', '..#aa#..', '.#aabb#.', '#aaadaa#', '#aaaaaac', '.#aaaac#', '..#aac#.', '...#a#..', '...#a#..', '....#c#.', '....###.']);
const MORPHO = moth(['....#...', '..##b#..', '.#bbab#.', '#bbaaab#', '#bdaaaac', '.#baaac#', '..#baac#', '...#aac#', '....##c#', '.....###']);
const MONARCH2 = moth(['..##....', '.#aa##..', '#abbaa#.', '#aabdaa#', '#dddaaac', '#aadaaa#', '.#aaaac#', '..#aac#.', '...#ac#.', '....###.']);
const BEE = draw(14, 12, (x, y) => {
  const dx = x - 6.5, dy = y - 6.5;
  const body = (dx / 5) ** 2 + (dy / 3.2) ** 2 < 1;
  if (body) return Math.floor((x + 1) / 2) % 2 ? 'd' : 'a';
  if (dy < -1.5 && dy > -5 && Math.abs(dx - 0.5) < 3) return 'b';
  if (dx < -4.5 && dx > -6.5 && Math.abs(dy) < 1.6) return 'c';
  return null;
});

export default pack({
  id: 'insect', name: 'Insects', noun: 'insects', icon: '🦋', tab: 'insects', tabLabel: 'Insects', order: 14,
  intro: '{have} of {total} insects found. Look for them in the meadows.',
  display: 'case', where: 'The meadows', how: 'caught', set: 'wing-case', reward: 450,
  plaque: 'Three wings and a bee: a tidy case of small wonders.',
  entries: [
    ['monarch', 'Monarch butterfly', MONARCH2, pal('#e87c20', '#f8b050', '#a84c10', '#241810'), 2, 'butterfly',
      'Monarchs fly thousands of kilometres south to spend the winter in the same mountain forests in Mexico.',
      ['No single monarch makes the whole round trip: it takes several generations.']],
    ['blue-morpho', 'Blue morpho', MORPHO, pal('#2a78e0', '#8cc4ff', '#1a4a98', '#14243e'), 3, 'butterfly',
      'The wings of a blue morpho are not painted blue. Tiny ridges on the scales bounce back only blue light.',
      ['Seen from the underside, the wings are dull brown.']],
    ['luna-moth', 'Luna moth', LUNA, pal('#a8e0a0', '#e0fcd8', '#68a868', '#2c4a2c'), 3, 'moth',
      'A pale green moth with long tails. Adults have no working mouth and live only about a week.',
      ['They fly at night, and the long tails confuse hunting bats.']],
    ['honeybee', 'Honeybee', BEE, pal('#e8b828', '#d0e8f8', '#a07808', '#2a2010'), 1, 'bee',
      'A honeybee tells its hive where the flowers are by dancing: the angle and length of its waggle point the way.',
      ['The dance was decoded by the scientist Karl von Frisch.']],
  ],
});
