// Coins: pixel art as data, like minerals. Nothing hands them out yet; they are
// meant for dig sites and expeditions.
import { disc, pack, pal } from './_px.js';

const owl = disc(14, (x, y, dx, dy, d) => {
  if (d < 5.2 && ((Math.abs(dx + 1.5) < 1 && Math.abs(dy + 1) < 1) || (Math.abs(dx - 1.5) < 1 && Math.abs(dy + 1) < 1))) return 'd';
  if (d < 4.6 && dy > 0.2 && dy < 3.2 && Math.abs(dx) < 2.5 - dy * 0.3) return 'c';
  return null;
});
const head = disc(14, (x, y, dx, dy, d) => {
  if (d < 4.8 && dx > -3 && dx < 2 && dy > -3.5 && dy < 3 && (dx + 3) * 1.3 > Math.abs(dy) * 0.6) return d > 3.6 ? 'c' : 'd';
  return null;
});
const lion = disc(14, (x, y, dx, dy, d) => (d < 4.6 && (Math.abs(dy - Math.round(dx / 2)) < 0.6 || (dx > 1 && Math.abs(dy + 2) < 0.6)) ? 'd' : null));
const cross = disc(14, (x, y, dx, dy, d) => (d < 5 && (Math.abs(dx) < 0.9 || Math.abs(dy) < 0.9) ? 'd' : null));

export default pack({
  id: 'coin', name: 'Coins', noun: 'coins', icon: '🪙', tab: 'treasures', tabLabel: 'Treasures', order: 6,
  intro: '{have} of {total} treasures found. Dig sites and expeditions turn them up.',
  where: 'Dig sites', set: 'coin-purse', reward: 500,
  plaque: 'Four coins that paid for ancient cities, legions and ships.',
  entries: [
    ['owl-tetradrachm', 'Athenian owl', owl, pal('#c8ccd4', '#f4f6fa', '#848a98', '#4a4e5c'), 2, 'greek',
      'A silver coin from Athens, stamped with the owl of Athena. It was so trusted that traders called the coins “owls”.',
      ['Athens minted owls for hundreds of years in the ancient world.']],
    ['denarius', 'Roman denarius', head, pal('#bcc0c8', '#eef0f4', '#7c8290', '#404452'), 1, 'roman',
      'The silver coin of the Roman Republic and Empire. A legionary’s pay was counted in denarii.',
      ['Emperors put their own faces on the front, so a coin was also a portrait.']],
    ['electrum-stater', 'Lydian stater', lion, pal('#e0c068', '#f8e8a8', '#a88830', '#5a4410'), 3, 'greek',
      'One of the oldest coins in the world, from Lydia, in what is now Turkey. It is made of electrum, a natural mix of gold and silver.',
      ['These coins date to around 600 BC.']],
    ['piece-of-eight', 'Piece of eight', cross, pal('#c4c8d0', '#f0f2f6', '#808694', '#464a58'), 2, 'pirate',
      'The Spanish silver dollar. It could be cut into eight “bits”, which is how it got its name.',
      ['It was used as money from Spain to the Americas and across Asia.']],
  ],
});
