// Famous visitors: the great artists drop by the main hall. Talk to one to meet
// them; each one you meet gives a permanent income boost.
import { load, save } from './storage.js';

const MET_KEY = 'curation.met'; // ids of famous visitors you've met
export const MEET_BOOST = 0.05; // +5% income per famous visitor met

export const FAMOUS = {
  vangogh: {
    name: 'Vincent van Gogh',
    colors: { h: '#c0602a', F: '#b5501f', s: '#f2c6a0', c: '#3b5ba5', p: '#5a4632', b: '#3a2418', T: '#e2c36a', U: '#3b5ba5' },
    look: { hat: 'straw', facial: 'beard', outfit: 'sweater' },
    hello: 'Bonjour! I am Vincent. I paint what I feel, and today I feel… this museum is wonderful.',
    lines: [
      'The night sky is so much more alive than the day. Have you looked up lately?',
      'I sold one painting in my whole life. One! Now look at me, hanging in museums.',
      'Yellow! The sunflowers, the wheat, the stars. I could never have enough yellow.',
      'Do not worry about the ear. Long story. Very long story.',
      'My brother Theo paid for my paint. Please, hire him as your accountant.',
      'I painted 900 works in ten years. Sleep is for people without sunflowers.',
    ],
    own: 'Ah, my {title}! I remember every brushstroke. Thick paint, like butter.',
  },
  leonardo: {
    name: 'Leonardo da Vinci',
    colors: { h: '#e8e0d0', F: '#efe8dc', s: '#e0ac80', c: '#6a1f2a', p: '#3a2a22', b: '#3a2418', T: '#3a1418', g: '#c9a23f' },
    look: { hat: 'beret', facial: 'beard', hair: 'long', outfit: 'gown' },
    hello: 'Greetings, curator. Leonardo, painter, engineer, and inventor of several things you have not seen yet.',
    lines: [
      'I once designed a flying machine. It did not fly. Yet.',
      'I write my notes backwards, in mirror writing. It keeps the curious at bay.',
      'Art is never finished, only abandoned. I abandoned many.',
      'Your stairs are well built. I would have added a few gears.',
      'I took sixteen years on one portrait. Some call that slow. I call it thorough.',
      'Simplicity is the ultimate sophistication. That, and a good beard.',
    ],
    own: '{title}! People ask about the smile. I simply say: practice.',
  },
  monet: {
    name: 'Claude Monet',
    colors: { h: '#e8e0d0', F: '#f2ece2', s: '#f2c6a0', c: '#4f7a3a', p: '#3b3a48', b: '#1a1418', T: '#cfae80', U: '#4f7a3a' },
    look: { hat: 'sun', facial: 'beard', outfit: 'coat' },
    hello: 'Bonjour. Claude Monet. Your light in here is lovely, but have you tried painting it at sunset?',
    lines: [
      'I painted the same haystacks over and over. The light was different every time!',
      'My garden at Giverny is my greatest work. The water lilies agree.',
      'They called us “Impressionists” as an insult. We kept the name.',
      'Stand back from a painting. Squint. There, now you see it.',
      'I once painted a cathedral thirty times. The cathedral did not mind.',
    ],
    own: 'My {title}! I could paint it a hundred more times and never get the light the same.',
  },
  frida: {
    name: 'Frida Kahlo',
    colors: { h: '#1e1410', s: '#c68a5e', c: '#c0392b', p: '#2e5a8a', b: '#3a2418', X: '#2e7d7a' },
    look: { hat: 'crown', unibrow: true, hair: 'bun', outfit: 'gown', acc: 'scarf' },
    hello: '¡Hola! I am Frida. I paint myself, because I am the subject I know best.',
    lines: [
      'Feet, what do I need them for if I have wings to fly?',
      'I paint flowers so they will not die.',
      'Your museum needs more color. More red! More life!',
      'I never painted dreams. I painted my own reality.',
      'I kept a pet monkey, a parrot and a deer. Your security guard is less fun.',
    ],
    own: 'I like this one. It is honest.',
  },
  rembrandt: {
    name: 'Rembrandt',
    colors: { h: '#5a3a22', F: '#6a4a2a', s: '#e8b890', c: '#4a3020', p: '#2a1a14', b: '#2a1a14', T: '#2a1a14' },
    look: { hat: 'beret', facial: 'vandyke', outfit: 'coat', hair: 'curly' },
    hello: 'Rembrandt van Rijn. Forgive the gloom on my face; I painted myself nearly a hundred times.',
    lines: [
      'Light is a story. Shadow is the part you have to lean in to hear.',
      'I spent all my money on art and costumes. Then I painted myself in the costumes.',
      'Your lighting is too even. Give me one candle and a dark corner.',
      'Everyone wants to be in the front of a group portrait. Nobody wants to pay for it.',
    ],
    own: 'Ah, {title}. Do you see how the light picks out the faces? That took me a while.',
  },
  vermeer: {
    name: 'Johannes Vermeer',
    colors: { h: '#5a3a22', F: '#5a3a22', s: '#f2c6a0', c: '#2a2a3a', p: '#2a2a3a', b: '#1a1418', T: '#1e1e22', U: '#3a3a4a' },
    look: { hat: 'straw', facial: 'stache', outfit: 'coat', collar: 'ruff', hair: 'long' },
    hello: 'Vermeer. I painted slowly, in one quiet room, by one window. Your hall is… a lot bigger.',
    lines: [
      'I made about thirty-five paintings in my whole life. Quality over quantity.',
      'The blue I used was ground from lapis lazuli. It cost more than gold.',
      'Light through a window on a quiet morning. That is all I ever needed.',
      'Some say I used a camera obscura. A painter never reveals his tricks.',
    ],
    own: '{title}! Look how the light falls from the left. Always from the left.',
  },
  hokusai: {
    name: 'Katsushika Hokusai',
    colors: { h: '#d8d8d8', F: '#e8e8e8', s: '#e8c39a', c: '#2e4a7a', p: '#1e2a3a', b: '#3a2418', g: '#c9a23f' },
    look: { bald: true, hat: 'topknot', facial: 'goatee', outfit: 'gown' },
    hello: 'Hokusai. I changed my name over thirty times. Today, call me “Old Man Mad About Painting.”',
    lines: [
      'I made thirty-six views of Mount Fuji. Then I made ten more. It is a very good mountain.',
      'By ninety I hoped to understand art. By a hundred, to master it.',
      'I moved house ninety-three times. Cleaning was never my strength.',
      'A great wave looks wild, but every curl of it is planned.',
    ],
    own: 'My {title}. The boats are small so the wave feels enormous. That is the trick.',
  },
  munch: {
    name: 'Edvard Munch',
    colors: { h: '#8a7a6a', F: '#7a6a5a', s: '#f2d0b0', c: '#2a2a2e', p: '#2a2a2e', b: '#1a1418', X: '#4a4a52' },
    look: { facial: 'stache', outfit: 'coat', acc: 'scarf' },
    hello: 'Edvard Munch. I am fine. Mostly. The sky over the fjord was very red that evening.',
    lines: [
      'I made several versions of the same scream. Some days are like that.',
      'Without fear and illness, I could never have painted what I did.',
      'Your museum is calm. Suspiciously calm.',
      'People think the figure is screaming. It is hearing a scream. Big difference.',
    ],
    own: '{title}. Yes. I felt it, so I painted it.',
  },
  klimt: {
    name: 'Gustav Klimt',
    colors: { h: '#3a2a20', F: '#3a2a20', s: '#f2c6a0', c: '#3d6fb6', p: '#3d6fb6', b: '#3a2418' },
    look: { bald: true, facial: 'beard', outfit: 'gown' },
    hello: 'Gustav Klimt. Excuse the smock; I work in it, I live in it, I would marry in it.',
    lines: [
      'Gold leaf! Why paint gold when you can simply use gold?',
      'Truth is like fire: to tell the truth means to glow and burn.',
      'I almost never painted self-portraits. I find myself rather boring.',
      'Your walls are nice. They would be nicer with a little gold.',
    ],
    own: 'My {title}. More gold than paint, and I regret nothing.',
  },
  seurat: {
    name: 'Georges Seurat',
    colors: { h: '#2a1a14', F: '#2a1a14', s: '#f2c6a0', c: '#2a2a2e', p: '#2a2a2e', b: '#1a1418', T: '#1e1e22', U: '#3a3a40', X: '#0e0e10' },
    look: { hat: 'top', facial: 'beard', acc: 'bowtie' },
    hello: 'Georges Seurat. I paint in tiny dots. Millions of them. Please do not ask me to count.',
    lines: [
      'Up close it is dots. Step back, it is a sunny afternoon. Science!',
      'One painting took me two years. Dot by dot by dot.',
      'Your floor is lovely. Have you considered it in dots?',
      'Some see dots. I see light, broken into pieces and put back together.',
    ],
    own: 'There it is, {title}. Every dot placed by hand. My wrist still hurts.',
  },
  dali: {
    name: 'Salvador Dalí',
    colors: { h: '#1e1410', F: '#1e1410', s: '#e8b890', c: '#6a1f2a', p: '#1e1e22', b: '#1a1418' },
    look: { facial: 'curly', hair: 'part', outfit: 'vest' },
    hello: 'I am Dalí! Every morning I wake up in the supreme pleasure of being Salvador Dalí.',
    lines: [
      'Have you seen my clocks? They melted. Time is very flexible in Spain.',
      'I do not do drugs. I am drugs.',
      'My mustache is my antenna. It receives inspiration.',
      'Your museum is too normal. Add a lobster telephone.',
      'I once gave a lecture in a deep-sea diving suit. I nearly suffocated. Worth it.',
    ],
    own: 'Ha! Wonderful. But it would be better melting.',
  },
  socrates: {
    name: 'Socrates',
    colors: { h: '#d8d8d8', F: '#efefef', s: '#e0ac80', c: '#f0ece2', p: '#f0ece2', b: '#8a5a3a', g: '#8a6a4a' },
    look: { bald: true, facial: 'beard', outfit: 'toga' },
    hello: 'I am Socrates. I know one thing: that I know nothing. So, curator… what is a museum?',
    lines: [
      'The unexamined life is not worth living. The unexamined painting, also not great.',
      'I never wrote anything down. My student Plato did it for me. Mostly correctly.',
      'Tell me, is a painting beautiful because we love it, or do we love it because it is beautiful?',
      'I asked your guard what justice is. He said, “Not on my watch.” Interesting answer.',
      'Wisdom begins in wonder. And this place is full of wonder.',
    ],
    own: 'Hmm. What makes this good? Let us question it until we both get a headache.',
  },
  aristotle: {
    name: 'Aristotle',
    colors: { h: '#9a9a9a', F: '#9a9a9a', s: '#e0ac80', c: '#e8e2d4', p: '#e8e2d4', b: '#8a5a3a', g: '#3a5a8a' },
    look: { hat: 'laurel', facial: 'beard', outfit: 'toga' },
    hello: 'Aristotle. Student of Plato, teacher of Alexander the Great, and now, visitor of your museum.',
    lines: [
      'Art takes nature as its model. Your fern is very convincing.',
      'We are what we repeatedly do. Excellence, then, is a habit. So is collecting.',
      'The whole is greater than the sum of its parts. Like your main hall.',
      'I wrote about everything: stars, animals, poetry, ethics. My scrolls were heavy.',
    ],
    own: 'A fine imitation of life. That is the purpose of art, you know.',
  },
  shakespeare: {
    name: 'William Shakespeare',
    colors: { h: '#5a3a22', F: '#5a3a22', s: '#f2c6a0', c: '#1e1e22', p: '#1e1e22', b: '#1a1418' },
    look: { bald: true, facial: 'vandyke', collar: 'ruff', outfit: 'vest' },
    hello: 'Good morrow, curator! William Shakespeare. All the world’s a stage, and this museum a fine theatre.',
    lines: [
      'To hang, or not to hang: that is the question.',
      'This gallery hath charms to soothe the savage breast.',
      'I invented over a thousand words. “Swagger” was one. Use it wisely.',
      'Brevity is the soul of wit. I wrote very long plays anyway.',
      'If music be the food of love, play on. Your music room could use some lutes.',
    ],
    own: 'Fair picture, fairer still by lamplight.',
  },
  einstein: {
    name: 'Albert Einstein',
    colors: { h: '#f0ece4', F: '#e8e4dc', s: '#f2c6a0', c: '#8a8a8a', p: '#5a4632', b: '#3a2418' },
    look: { hair: 'wild', facial: 'stache', outfit: 'sweater' },
    hello: 'Hello! Albert Einstein. Imagination is more important than knowledge, and your museum has plenty of both.',
    lines: [
      'Time is relative. An hour in a museum feels like a minute.',
      'I never wore socks. Your floors are lovely and cold.',
      'Creativity is intelligence having fun.',
      'If I had not been a physicist, I would have been a musician. Or a curator, perhaps.',
      'E equals mc squared. And art equals… well, that one I never solved.',
    ],
    own: 'Fascinating. Light is a wave and a particle. And apparently a painting.',
  },
  cleopatra: {
    name: 'Cleopatra',
    colors: { h: '#1a1410', s: '#c68a5e', c: '#f0ece2', p: '#f0ece2', b: '#c9a23f', U: '#e0bc55', g: '#c9a23f' },
    look: { hair: 'bob', outfit: 'gown', acc: 'necklace' },
    hello: 'I am Cleopatra, Queen of Egypt. You may continue breathing.',
    lines: [
      'I spoke nine languages. I will say “nice museum” in all of them.',
      'I once rolled myself into a carpet to meet Julius Caesar. A grand entrance matters.',
      'Your Egyptian room is acceptable. It needs more gold and fewer tourists.',
      'I lived closer in time to the moon landing than to the building of the pyramids.',
    ],
    own: 'Lovely. I would like it moved to my palace.',
  },
  napoleon: {
    name: 'Napoleon Bonaparte',
    colors: { h: '#3a2a20', s: '#f2c6a0', c: '#2e4a8a', p: '#f0ece2', b: '#1a1418', T: '#1e1e22', U: '#c9a23f' },
    look: { hat: 'bicorne', outfit: 'coat' },
    hello: 'Napoleon Bonaparte, Emperor of the French. I filled the Louvre once. Let us see what you have.',
    lines: [
      'I am not short. I was average height. Blame the English cartoonists.',
      'Impossible is a word found only in the dictionary of fools.',
      'An army marches on its stomach. A museum marches on its coffee counter.',
      'I once brought the Louvre half of Europe’s art. I had to give most of it back.',
    ],
    own: 'Magnificent. I will take it. …I am told I may not take it.',
  },
  lincoln: {
    name: 'Abraham Lincoln',
    colors: { h: '#1e1410', F: '#1e1410', s: '#e0ac80', c: '#1e1e22', p: '#1e1e22', b: '#1a1418', T: '#1e1e22', U: '#2e2e34', X: '#0e0e10' },
    look: { hat: 'top', facial: 'chinstrap', outfit: 'coat', acc: 'bowtie' },
    hello: 'Abraham Lincoln. Four score and seven paintings ago, you had none. Fine work, curator.',
    lines: [
      'I keep my letters in this hat. It is a very good hat.',
      'Whatever you are, be a good one. Even a good janitor.',
      'Give me six hours to hang a painting and I will spend four sharpening the nail.',
      'I grew the beard because a little girl wrote and told me to. Best advice I ever got.',
    ],
    own: 'A fine painting. Honest work, like a good fence.',
  },
  mozart: {
    name: 'Wolfgang Amadeus Mozart',
    colors: { h: '#f0ece4', s: '#f2d0b0', c: '#b0413e', p: '#f0ece2', b: '#1a1418', g: '#c9a23f' },
    look: { collar: 'ruff', hair: 'ponytail', outfit: 'coat' },
    hello: 'Mozart! Composer, prodigy, and the best dancer in Vienna. Is there music in this museum?',
    lines: [
      'I wrote my first symphony at eight. What were you doing at eight?',
      'The music is not in the notes, but in the silence between.',
      'Your hall has wonderful acoustics. I could fill it with an orchestra.',
      'Too many notes? There are exactly as many notes as I require.',
    ],
    own: 'Ah, a painting that sounds like a sonata. Allegro!',
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
