// Starting paintings. `wall` is 'left' or 'right'; `slot` is the position
// along that wall (0 = top of the hall, 5 = nearest the entrance).
// `ratio` is width / height of the real canvas.
// Images are public domain, served from Wikimedia Commons.
export const PAINTINGS = [
  {
    id: 'harvesters',
    wall: 'left',
    slot: 5,
    title: 'The Harvesters',
    artist: 'Pieter Bruegel the Elder',
    year: '1565',
    ratio: 162 / 119,
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Pieter_Bruegel_the_Elder-_The_Harvesters_-_Google_Art_Project.jpg/1280px-Pieter_Bruegel_the_Elder-_The_Harvesters_-_Google_Art_Project.jpg',
    blurb:
      'Late summer: peasants cut wheat while others eat lunch under a pear tree. One of six paintings of the seasons made for an Antwerp merchant; only five survive.',
    placeholder: '#c9a24a',
  },
  {
    id: 'horse-fair',
    wall: 'right',
    slot: 5,
    title: 'The Horse Fair',
    artist: 'Rosa Bonheur',
    year: '1852–55',
    ratio: 506.7 / 244.5,
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Rosa_Bonheur_-_The_Horse_Fair_-_Google_Art_Project.jpg/1280px-Rosa_Bonheur_-_The_Horse_Fair_-_Google_Art_Project.jpg',
    blurb:
      'The Paris horse market, painted at near life size. Bonheur sketched there for a year and a half, dressed in men’s clothes to work without being bothered.',
    placeholder: '#7a6a58',
  },
];
