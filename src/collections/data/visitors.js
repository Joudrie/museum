// Famous visitors, as a collection. Meeting one stamps `visitor:<id>` in the codex
// (famous.js). Their talk lives in famous.js; this is the who-was-who. The
// picture is drawn by the 'visitor' renderer, which journal.js registers.
const v = (slug, title, by, year, rarity, set, blurb) => ({
  id: `visitor:${slug}`,
  collection: 'visitor',
  title,
  by,
  year,
  rarity,
  set,
  blurb,
  tags: [set === 'visiting-artists' ? 'artist' : 'icon'],
  image: { kind: 'procedural', renderer: 'visitor', who: slug },
  display: ['floor'],
  provenance: { how: 'gift', where: 'The main hall' },
  source: { license: 'Original', credit: 'Curation' },
  collectable: true,
});

const A = 'visiting-artists';
const I = 'visiting-icons';
const entries = [
  v('vangogh', 'Vincent van Gogh', 'Dutch painter', '1853–1890', 3, A, 'Made about 2,100 artworks, most of them in the last ten years of his life.'),
  v('leonardo', 'Leonardo da Vinci', 'Italian painter and inventor', '1452–1519', 4, A, 'Filled thousands of notebook pages with drawings, studies and inventions.'),
  v('monet', 'Claude Monet', 'French painter', '1840–1926', 2, A, 'His 1872 harbour scene, Impression, Sunrise, gave Impressionism its name.'),
  v('frida', 'Frida Kahlo', 'Mexican painter', '1907–1954', 3, A, 'Famous for her self-portraits, which are among her best-known works.'),
  v('rembrandt', 'Rembrandt', 'Dutch painter', '1606–1669', 3, A, 'A master of light and shadow who painted himself again and again over his life.'),
  v('vermeer', 'Johannes Vermeer', 'Dutch painter', '1632–1675', 3, A, 'Painted quiet rooms full of light. Only about three dozen of his paintings are known.'),
  v('hokusai', 'Katsushika Hokusai', 'Japanese printmaker', '1760–1849', 2, A, 'His Great Wave off Kanagawa is one of the best-known images in the world.'),
  v('munch', 'Edvard Munch', 'Norwegian painter', '1863–1944', 2, A, 'Painted The Scream, which exists in several versions.'),
  v('klimt', 'Gustav Klimt', 'Austrian painter', '1862–1918', 2, A, 'Used real gold leaf in his painting The Kiss.'),
  v('seurat', 'Georges Seurat', 'French painter', '1859–1891', 2, A, 'Built his pictures out of tiny dots of colour that blend in the eye.'),
  v('dali', 'Salvador Dalí', 'Spanish painter', '1904–1989', 2, A, 'A leader of Surrealism, known for dreamlike scenes and melting clocks.'),
  v('socrates', 'Socrates', 'Greek philosopher', 'c. 470–399 BC', 2, I, 'Taught by asking questions in the streets of Athens, and wrote nothing down himself.'),
  v('aristotle', 'Aristotle', 'Greek philosopher', '384–322 BC', 2, I, 'Studied logic, biology and politics, and taught the young Alexander the Great.'),
  v('shakespeare', 'William Shakespeare', 'English playwright', '1564–1616', 2, I, 'His plays are still performed all over the world.'),
  v('einstein', 'Albert Einstein', 'Physicist', '1879–1955', 3, I, 'Developed the theory of relativity and won a Nobel Prize in Physics.'),
  v('cleopatra', 'Cleopatra', 'Queen of Egypt', '69–30 BC', 3, I, 'The last active ruler of Egypt’s Ptolemaic dynasty.'),
  v('napoleon', 'Napoleon Bonaparte', 'French emperor', '1769–1821', 2, I, 'A French general who crowned himself Emperor of the French in 1804.'),
  v('lincoln', 'Abraham Lincoln', 'US president', '1809–1865', 2, I, 'The 16th President of the United States, in office from 1861 to 1865.'),
  v('mozart', 'Wolfgang Amadeus Mozart', 'Austrian composer', '1756–1791', 3, I, 'Began composing as a child and wrote hundreds of works before he died at 35.'),
];

export default {
  collection: {
    id: 'visitor',
    name: 'Famous visitors',
    noun: 'famous visitors',
    icon: 'people',
    kinds: ['visitor'],
    display: 'floor',
    ownership: 'earned',
    people: true, // met by talking to them, not collected: left out of "collect one of everything"
    meta: ['by', 'year'],
    journal: {
      tab: 'visitors',
      label: 'Visitors',
      order: 2,
      layout: 'tiles',
      intro: '{have} of {total} famous visitors met. Each one adds +5% income forever. They hang out in the main hall.',
    },
    viewer: { look: 'case' },
  },
  sets: [
    { id: 'visiting-artists', name: 'Visiting artists', collection: 'visitor', entries: entries.filter((e) => e.set === A).map((e) => e.id), reward: { gold: 1500 }, plaque: 'Every painter on the guest list has been through your doors.' },
    { id: 'visiting-icons', name: 'Thinkers, rulers and makers', collection: 'visitor', entries: entries.filter((e) => e.set === I).map((e) => e.id), reward: { gold: 1500 }, plaque: 'Philosophers, writers, queens and scientists, all met.' },
  ],
  entries,
};
