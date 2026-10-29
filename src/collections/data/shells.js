// Shells: pixel art as data.
import { draw, pack, pal, sym } from './_px.js';

const NAUTILUS = draw(14, 14, (x, y) => {
  const dx = x - 6.5, dy = y - 6.5, d = Math.hypot(dx, dy);
  if (d > 6.6 || (dx > 1 && dy > 2.5 && d > 4)) return null;
  const turn = (Math.atan2(dy, dx) + Math.PI + d * 0.9) % 1.6;
  return d < 1.3 ? 'c' : turn < 0.5 ? 'd' : d > 5 ? 'b' : 'a';
});
const SCALLOP = sym(['.....###', '...##aab', '..#aabbb', '.#abaabb', '#aabaabb', '#abaabab', '#aaabaab', '.#aaabaa', '..#cccdd', '...#dddd']);
const COWRIE = sym(['....####', '..##bbbb', '.#bbaaaa', '#baadaaa', '#bacdaaa', '#bacdaaa', '#bacdaaa', '#baadaaa', '.#baaaaa', '..##cccc']);
const CONCH = draw(16, 12, (x, y) => {
  const dx = x - 8, dy = y - 6;
  if (x < 3 && Math.abs(dy) < 1 + x * 0.4) return 'a';
  if ((dx / 6.5) ** 2 + (dy / 4.8) ** 2 < 1) return (x + y) % 5 === 0 ? 'd' : dx + dy > 2 ? 'c' : dy < -1.5 ? 'b' : 'a';
  if (dx > 4 && dx < 7.6 && dy > 0 && dy < 3.6) return 'd';
  return null;
});

export default pack({
  id: 'shell', name: 'Shells', noun: 'shells', icon: '🐚', tab: 'nature', tabLabel: 'Nature', order: 7,
  intro: '{have} of {total} nature finds. Look for butterflies and shells out on the islands.',
  where: 'The beaches', how: 'dug', set: 'shell-shelf', reward: 450,
  plaque: 'Four shells for the windowsill: each one built by a soft animal.',
  entries: [
    ['nautilus', 'Chambered nautilus', NAUTILUS, pal('#f0e4d0', '#fffaf0', '#c8a888', '#b05028'), 3, 'sea',
      'A nautilus lives in the newest, largest chamber of its spiral shell and seals off the old ones behind it. The empty chambers help it float.',
      ['Its spiral is among the most famous shapes in nature.']],
    ['scallop', 'Scallop', SCALLOP, pal('#f0b898', '#fff0e0', '#c87858', '#a04830'), 1, 'sea',
      'A scallop can swim by clapping its two shells together and squirting water out.',
      ['Along the edge it has a row of tiny eyes.']],
    ['cowrie', 'Cowrie', COWRIE, pal('#e8c898', '#fff0d0', '#b08858', '#6a4020'), 2, 'sea',
      'Smooth, shiny cowrie shells were used as money for centuries in parts of Africa, Asia and the Pacific.',
      ['Their smoothness comes from a soft layer that covers the outside as the snail grows.']],
    ['conch', 'Queen conch', CONCH, pal('#f4c8a8', '#fff2e4', '#c07c5c', '#e87868'), 2, 'sea',
      'Hold a big shell to your ear and you hear the “ocean”. It is really the noise around you, echoing inside the shell.',
      ['The inside of a queen conch is a glossy pink.']],
  ],
});
