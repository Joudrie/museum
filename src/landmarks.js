// Pieces with a job on a builder island: the museum itself (walk up into its
// doors to go in) and people who live there (each wanders a little round the
// spot they were placed).
import { T, OUT, draw } from './tiles.js';
import { makePet, PET_COLORS } from './pets.js';
import { critterTextures } from './critters.js';
import { addPeople } from './people/index.js';

// how far each kind of person strays from their spot, in tiles
export const PEOPLE = { person: 0, person_wander: 3, person_roam: 7 };

export function museumCanvas() {
  const w = 8 * T;
  const h = 6 * T;
  return draw(w, h, ({ ctx: g, R }) => {
    const tri = (inset, top, base, col) => {
      g.fillStyle = col;
      g.beginPath();
      g.moveTo(inset, base);
      g.lineTo(w / 2, top);
      g.lineTo(w - inset, base);
      g.fill();
    };
    // pediment (the triangle roof)
    tri(4, 6, 52, OUT);
    tri(12, 12, 48, '#e8e2d4');
    tri(30, 22, 44, '#cfc6b4');
    R(0, 50, w, 10, OUT);
    R(2, 51, w - 4, 8, '#f0ece2');
    // walls
    R(6, 60, w - 12, h - 84, OUT);
    R(8, 60, w - 16, h - 86, '#d8d0be');
    for (let y = 66; y < h - 26; y += 8) R(8, y, w - 16, 1, '#bfb5a2');
    // sign
    R(w / 2 - 44, 30, 88, 14, OUT);
    R(w / 2 - 42, 31, 84, 12, '#3e2a20');
    g.fillStyle = '#f2d36b';
    g.font = 'bold 9px monospace';
    g.textAlign = 'center';
    g.fillText('CURATION', w / 2, 41);
    // columns
    [20, 58, 198, 236].forEach((x) => {
      R(x - 8, 60, 16, h - 86, OUT);
      R(x - 7, 60, 14, h - 86, '#f4f0e6');
      R(x - 7, 60, 4, h - 86, '#ffffff');
      R(x + 3, 60, 3, h - 86, '#cfc6b4');
      R(x - 10, 60, 20, 4, '#e8e2d4');
      R(x - 10, h - 30, 20, 4, '#e8e2d4');
    });
    // windows with a warm glow
    [96, 160].forEach((x) => {
      R(x - 12, 76, 24, 34, OUT);
      R(x - 10, 78, 20, 30, '#f2c86a');
      R(x - 1, 78, 2, 30, OUT);
      R(x - 10, 92, 20, 2, OUT);
    });
    // double doors (open: the warm hall shows through)
    R(w / 2 - 22, h - 72, 44, 46, OUT);
    R(w / 2 - 20, h - 70, 40, 44, '#f2d9a0');
    R(w / 2 - 20, h - 70, 9, 44, '#7a4f39');
    R(w / 2 + 11, h - 70, 9, 44, '#7a4f39');
    R(w / 2 - 12, h - 58, 24, 30, '#e8c070');
    // steps
    for (let i = 0; i < 3; i++) {
      R(w / 2 - 40 - i * 8, h - 26 + i * 8, 80 + i * 16, 8, OUT);
      R(w / 2 - 39 - i * 8, h - 25 + i * 8, 78 + i * 16, 6, i % 2 ? '#e8e2d4' : '#d8d0be');
    }
  });
}

// A stand-in person for the builder; in the game each one gets their own look.
function personCanvas(shirt, ring) {
  return draw(T, 48, ({ R, E }) => {
    if (ring) E(16, 44, 14, 4, ring);
    E(16, 45, 8, 2, 'rgba(0,0,0,0.25)');
    R(10, 4, 12, 13, OUT); // head
    R(11, 5, 10, 11, '#f2c6a0');
    R(11, 4, 10, 4, '#4a2e20'); // hair
    R(13, 10, 2, 2, OUT);
    R(17, 10, 2, 2, OUT);
    R(8, 17, 16, 15, OUT); // body
    R(9, 18, 14, 13, shirt);
    R(10, 32, 12, 10, OUT); // legs
    R(11, 32, 4, 9, '#2f2b3d');
    R(17, 32, 4, 9, '#2f2b3d');
  });
}

// Animals: pets from the curator's pets (cat, dog, bunny, parrot) and the
// island's critters. Each wanders round its spot; ducks stay on the water.
export const ANIMALS = {
  cat_ginger: { label: 'Ginger cat', pet: 'cat', color: PET_COLORS.cat[0], range: 4 },
  cat_black: { label: 'Black cat', pet: 'cat', color: PET_COLORS.cat[1], range: 4 },
  cat_grey: { label: 'Grey cat', pet: 'cat', color: PET_COLORS.cat[3], range: 4 },
  dog_brown: { label: 'Brown dog', pet: 'dog', color: PET_COLORS.dog[0], range: 5 },
  dog_golden: { label: 'Golden dog', pet: 'dog', color: PET_COLORS.dog[1], range: 5 },
  dog_black: { label: 'Black dog', pet: 'dog', color: PET_COLORS.dog[2], range: 5 },
  bunny_white: { label: 'White bunny', pet: 'bunny', color: PET_COLORS.bunny[0], range: 3 },
  bunny_brown: { label: 'Brown bunny', pet: 'bunny', color: PET_COLORS.bunny[1], range: 3 },
  parrot_red: { label: 'Red parrot', pet: 'parrot', color: PET_COLORS.parrot[0], range: 3 },
  parrot_green: { label: 'Green parrot', pet: 'parrot', color: PET_COLORS.parrot[1], range: 3 },
  crab: { label: 'Crab', critter: 'crab', range: 2 },
  frog: { label: 'Frog', critter: 'frog', range: 2 },
  duck: { label: 'Duck (on water)', critter: 'duck', range: 3, water: true },
};

// a stand-in for a Phaser scene, so the pet and critter drawings also make
// plain canvases for the builder's pictures
function canvasScene() {
  const store = {};
  const textures = {
    exists: (k) => !!store[k],
    remove: (k) => delete store[k],
    get: (k) => ({ getSourceImage: () => store[k] }),
    addCanvas: (k, c) => (store[k] = c),
    createCanvas: (k, w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      store[k] = c;
      return { getContext: () => c.getContext('2d'), refresh() {}, getSourceImage: () => c };
    },
  };
  return { textures, store };
}

function animalCanvases() {
  const sc = canvasScene();
  critterTextures(sc);
  const out = {};
  Object.entries(ANIMALS).forEach(([name, a]) => {
    let src;
    if (a.pet) {
      makePet(sc, name, a.pet, a.color);
      src = sc.store[a.pet === 'parrot' ? `${name}_side` : `${name}_down`];
    } else src = sc.store[`${a.critter}_0`];
    const c = document.createElement('canvas');
    c.width = c.height = T;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    if (src) g.drawImage(src, Math.round((T - src.width) / 2), T - src.height - (a.pet ? 0 : 3));
    out[name] = c;
  });
  return out;
}

export function addLandmarks(add) {
  const pics = animalCanvases();
  Object.entries(ANIMALS).forEach(([name, a]) => add(`animal_${name}`, pics[name], { group: 'Animals', label: a.label, walk: 'person' }));
  add('museum', museumCanvas(), { group: 'Buildings', label: 'Museum (walk into the doors)', w: 8 * T, h: 6 * T, walk: 'block', base: 2 });
  add('person', personCanvas('#c0392b'), { group: 'People', label: 'Stays put', h: 48, walk: 'person' });
  add('person_wander', personCanvas('#2e7d7a', 'rgba(232,200,103,0.35)'), { group: 'People', label: 'Wanders a little', h: 48, walk: 'person' });
  add('person_roam', personCanvas('#3d6fb6', 'rgba(232,200,103,0.6)'), { group: 'People', label: 'Wanders a lot', h: 48, walk: 'person' });
  addPeople(add); // janitors, builders, fishermen... (people/classes.js)
}
