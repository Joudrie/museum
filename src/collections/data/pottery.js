// Pottery: pixel art as data. A vase is drawn from a width profile, top to bottom.
import { draw, pack, pal } from './_px.js';

const vase = (profile, band) =>
  draw(16, profile.length, (x, y) => {
    const w = profile[y], dx = Math.abs(x - 7.5);
    if (dx > w) return null;
    if (band(y)) return 'd';
    return dx > w - 1.3 ? (x < 8 ? 'b' : 'c') : 'a';
  });
const AMPHORA = vase([2, 2, 1.5, 2, 3, 5, 6, 6.5, 6.5, 6, 5, 3.5, 2.5, 2.5, 3.5], (y) => y === 7 || y === 9);
const MING = vase([2.5, 2, 2, 3, 4.5, 6, 6.8, 7, 6.6, 5.6, 4.2, 3.4, 3.4, 4.2], (y) => y === 6 || y === 8 || (y === 7 && 0));
const JOMON = vase([6, 5.4, 5, 5.5, 6.2, 6.8, 6.8, 6, 4.8, 3.6, 3.6], (y) => y % 2 === 0 && y > 2 && y < 8);
const CANOPIC = vase([2.5, 3.2, 3.6, 3.6, 3.6, 4.6, 5, 5, 4.6, 4, 3.6, 3.6], (y) => y === 4 || y === 6);

export default pack({
  id: 'pottery', name: 'Pottery', noun: 'pottery', icon: '🏺', tab: 'treasures', tabLabel: 'Treasures', order: 6,
  intro: '{have} of {total} treasures found. Dig sites and expeditions turn them up.',
  where: 'Dig sites', how: 'dug', set: 'potters-shelf', reward: 500,
  plaque: 'Four pots from four corners of the world.',
  entries: [
    ['amphora', 'Greek amphora', AMPHORA, pal('#d87838', '#f0a868', '#9a4a1c', '#2a1a14'), 1, 'greek',
      'A tall clay jar with two handles, used in ancient Greece to carry and store wine and olive oil.',
      ['Its pointed bottom made it easy to stack on a ship.']],
    ['ming-vase', 'Ming vase', MING, pal('#f4f4f8', '#ffffff', '#c0c4d4', '#2a50a8'), 3, 'chinese',
      'Blue-and-white porcelain from China’s Ming dynasty. The blue is painted with cobalt before the vase is glazed and fired.',
      ['Porcelain is fired so hot that it turns glassy and hard.']],
    ['jomon-pot', 'Jōmon pot', JOMON, pal('#a8744c', '#d0a078', '#6a4428', '#4a2c18'), 3, 'japanese',
      'Jōmon people in Japan pressed cords into wet clay to decorate it. Their pottery is among the oldest in the world.',
      ['“Jōmon” means “cord-marked”.']],
    ['canopic-jar', 'Canopic jar', CANOPIC, pal('#e0d4b0', '#f8f0d8', '#a89870', '#3a5aa0'), 2, 'egyptian',
      'In ancient Egypt, four jars like this held parts of the body removed during mummification.',
      ['The lids were carved as the heads of four protective gods.']],
  ],
});
