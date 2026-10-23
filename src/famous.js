// Famous visitors: the great artists drop by the main hall. Talk to one to meet
// them; each one you meet gives a permanent income boost.
import { load, save } from './decor.js';

const MET_KEY = 'curation.met'; // ids of famous visitors you've met
export const MEET_BOOST = 0.05; // +5% income per famous visitor met

export const FAMOUS = {
  vangogh: {
    name: 'Vincent van Gogh',
    colors: { h: '#c0602a', F: '#b5501f', s: '#f2c6a0', c: '#3b5ba5', p: '#5a4632', b: '#3a2418', T: '#e2c36a', U: '#3b5ba5' },
    look: { hat: 'straw', facial: 'beard' },
    hello: 'Bonjour! I am Vincent. I paint what I feel, and today I feel… this museum is wonderful.',
    lines: [
      'The night sky is so much more alive than the day. Have you looked up lately?',
      'I sold one painting in my whole life. One! Now look at me, hanging in museums.',
      'Yellow! The sunflowers, the wheat, the stars. I could never have enough yellow.',
      'Do not worry about the ear. Long story. Very long story.',
    ],
    own: 'Ah, my {title}! I remember every brushstroke. Thick paint, like butter.',
  },
  leonardo: {
    name: 'Leonardo da Vinci',
    colors: { h: '#e8e0d0', F: '#efe8dc', s: '#e0ac80', c: '#6a1f2a', p: '#3a2a22', b: '#3a2418', T: '#3a1418' },
    look: { hat: 'beret', facial: 'beard' },
    hello: 'Greetings, curator. Leonardo, painter, engineer, and inventor of several things you have not seen yet.',
    lines: [
      'I once designed a flying machine. It did not fly. Yet.',
      'I write my notes backwards, in mirror writing. It keeps the curious at bay.',
      'Art is never finished, only abandoned. I abandoned many.',
      'Your stairs are well built. I would have added a few gears.',
    ],
    own: '{title}! People ask about the smile. I simply say: practice.',
  },
  monet: {
    name: 'Claude Monet',
    colors: { h: '#e8e0d0', F: '#f2ece2', s: '#f2c6a0', c: '#4f7a3a', p: '#3b3a48', b: '#1a1418', T: '#cfae80', U: '#4f7a3a' },
    look: { hat: 'sun', facial: 'beard' },
    hello: 'Bonjour. Claude Monet. Your light in here is lovely, but have you tried painting it at sunset?',
    lines: [
      'I painted the same haystacks over and over. The light was different every time!',
      'My garden at Giverny is my greatest work. The water lilies agree.',
      'They called us “Impressionists” as an insult. We kept the name.',
      'Stand back from a painting. Squint. There, now you see it.',
    ],
    own: 'My {title}! I could paint it a hundred more times and never get the light the same.',
  },
  frida: {
    name: 'Frida Kahlo',
    colors: { h: '#1e1410', s: '#c68a5e', c: '#c0392b', p: '#2e5a8a', b: '#3a2418' },
    look: { hat: 'crown', unibrow: true },
    hello: '¡Hola! I am Frida. I paint myself, because I am the subject I know best.',
    lines: [
      'Feet, what do I need them for if I have wings to fly?',
      'I paint flowers so they will not die.',
      'Your museum needs more color. More red! More life!',
      'I never painted dreams. I painted my own reality.',
    ],
    own: 'I like this one. It is honest.',
  },
};

export const metList = () => load(MET_KEY, []);
export const famousBoost = () => 1 + MEET_BOOST * metList().length;

// Returns true the first time you meet them.
export function meet(id) {
  const met = metList();
  if (met.includes(id)) return false;
  save(MET_KEY, [...met, id]);
  return true;
}

export function resetMet() {
  save(MET_KEY, []);
}

// Who's in the main hall this visit: a different guest each time you come in.
let visits = 0;
export function guestToday() {
  const ids = Object.keys(FAMOUS);
  return ids[(Math.floor(Math.random() * ids.length) + visits++) % ids.length];
}
