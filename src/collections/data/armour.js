// Armour: pixel art as data.
import { draw, pack, pal, sym } from './_px.js';

const CORINTHIAN = sym(['...####.', '..#aaabb', '.#aabbbb', '#aaabbaa', '#aaaaaac', '#aadaadac', '#aaaaaaac', '#aaa##aac', '.#aa##aac', '..#a##aac', '...#cc#c']);
const KABUTO = sym(['....##..', '...#bb#.', '..#bbab.', '.#aaaaaa', '#dddddddd', '#aaaaaaac', '#cc#aaaaa', '.#cc#cccc', '..##cccc']);
const KNIGHT = sym(['...###..', '..#bbbb#', '.#bbaaaa', '.#baaaaa', '.#bdddda', '.#bdddda', '.#baaaac', '.#baaaac', '.#baaaac', '..#aaacc', '...#cccc']);
const LEGIONARY = sym(['...###..', '..#bbaa#', '.#bbaaaa', '#baaaaaa', '#aaaaaaac', '#aaaaaac#', '#dddaaaa#', '#a#.#aaa#', '#cc#.#ccc', '.##...###']);

export default pack({
  id: 'armour', name: 'Armour', noun: 'armour', icon: '🛡️', tab: 'treasures', tabLabel: 'Treasures', order: 12,
  intro: '{have} of {total} treasures found. Dig sites and expeditions turn them up.',
  where: 'The armoury', how: 'gift', set: 'helmet-rack', reward: 500,
  plaque: 'Four helmets from four armies, ancient and medieval.',
  entries: [
    ['corinthian-helmet', 'Corinthian helmet', CORINTHIAN, pal('#c89848', '#f0d088', '#8a6428', '#3a2810'), 2, 'greek',
      'A bronze helmet from ancient Greece that covered the whole head and face, leaving only slits for the eyes and mouth.',
      ['When not fighting, soldiers pushed it up onto the top of the head.']],
    ['kabuto', 'Samurai kabuto', KABUTO, pal('#3a3c4c', '#7a7c94', '#1c1c28', '#c89828'), 3, 'japanese',
      'The helmet of a Japanese samurai, built from metal plates held by rivets, with a flared neck guard.',
      ['Many carried a crest on the front, to be seen on the battlefield.']],
    ['knights-helm', 'Knight’s helm', KNIGHT, pal('#b4bcc8', '#eef2f8', '#6c7484', '#3a4050'), 2, 'medieval',
      'A medieval knight’s helmet of iron or steel. Full plate armour was made to fit its owner and spread its weight, so a knight could still run, climb and ride.',
      ['A narrow slit let the knight see out and kept arrows out.']],
    ['legionary-helmet', 'Legionary helmet', LEGIONARY, pal('#c0a060', '#ecd898', '#806830', '#3a3220'), 1, 'roman',
      'A Roman soldier’s helmet had a deep neck guard and cheek plates, to protect against blows from above and behind.',
      ['Roman armourers made helmets by the thousand for the legions.']],
  ],
});
