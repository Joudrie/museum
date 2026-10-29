// Glass flowers, after the famous glass plant models made for Harvard by
// Leopold and Rudolf Blaschka. Pixel art as data.
import { draw, pack, pal } from './_px.js';

const stem = (x) => x === 7 || x === 8;
const flower = (petal) =>
  draw(16, 16, (x, y) => {
    const dx = x - 7.5, dy = y - 5;
    const d = Math.hypot(dx, dy);
    const r = petal(Math.atan2(dy, dx));
    if (d < 1.6) return 'd';
    if (d < r) return d > r - 1.4 ? 'c' : (x + y) % 5 === 0 ? 'b' : 'a';
    if (y > 8 && stem(x)) return 'c';
    if (y > 11 && y < 14 && Math.abs(x - 7.5) > 1 && Math.abs(x - 7.5) < 5 && Math.abs(y - 12.5 - Math.abs(x - 7.5) * -0.4) < 1) return 'c';
    return null;
  });
const ROSE = flower((t) => 4.8 + Math.sin(t * 5) * 0.8);
const ORCHID = flower((t) => 3.6 + Math.abs(Math.sin(t * 1.5)) * 2.6);
const POPPY = flower((t) => 5.2 + Math.sin(t * 2) * 0.4);
const SUNFLOWER = flower((t) => 5.6 + Math.abs(Math.sin(t * 8)) * 1.6);

export default pack({
  id: 'glassflower', name: 'Glass flowers', noun: 'glass flowers', icon: '🌸', tab: 'makers', tabLabel: 'Makers', order: 8,
  intro: '{have} of {total} maker pieces found. Models, glass, clocks and inventions.',
  where: 'The glassworks', how: 'gift', set: 'glass-garden', reward: 600,
  plaque: 'A little garden that will never wilt.',
  entries: [
    ['rose', 'Glass rose', ROSE, pal('#e84a6a', '#ffb0c0', '#a02040', '#f8d860', '#3a1020'), 1, 'flower',
      'Real flowers wilt, so Harvard has a whole gallery of plants made of coloured glass and wire, built to look alive.',
      ['The glass models were made by a father and son, Leopold and Rudolf Blaschka, in Germany.']],
    ['orchid', 'Glass orchid', ORCHID, pal('#c070d8', '#f0c8f8', '#783890', '#f8e060', '#2c1038'), 2, 'flower',
      'A bendy orchid has to be made petal by petal. Glassworkers heat the glass with a lamp and shape it by hand.',
      ['The Blaschkas worked from living plants, and from drawings when none were at hand.']],
    ['poppy', 'Glass poppy', POPPY, pal('#e83a2a', '#ffa090', '#a01c14', '#2a1810', '#380c08'), 1, 'flower',
      'Poppies have thin, crinkled petals, a hard thing to copy in a material that is stiff and breakable.',
      ['The Harvard collection holds thousands of models, drawn from hundreds of plant kinds.']],
    ['sunflower', 'Glass sunflower', SUNFLOWER, pal('#f8c820', '#fff0a0', '#c08810', '#5a3410', '#3a2406'), 2, 'flower',
      'A sunflower head is hundreds of tiny flowers packed in a spiral. A glass copy needs patience.',
      ['Visitors often mistake the models for real, dried plants.']],
  ],
});
