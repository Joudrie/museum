// Dev page: every sprite in the game drawn on one page (characters and their
// looks, famous visitors, pets, decor items, creatures and emotes), so the
// whole art set can be reviewed at a glance. Island tiles are on tiles.html.
import { makeCharacter, makeEmotes, bakeItem, bakePlant, HATS, FACIAL, GLASSES, HAIRSTYLES, OUTFITS, ACCESSORIES } from './art.js';
import { BUILDS, LEGS, FEET, CARRY, GROUND, BUDDIES, POSES } from './people/parts.js';
import { CLASSES, GROUPS, PEOPLE_LIST, CREWS, personFor } from './people/index.js';
import { ITEMS, CATEGORIES } from './items.js';
import { COLUMNS, columnCanvas } from './columns.js';
import { FAMOUS } from './famous.js';
import { makePet, PETS, PET_COLORS } from './pets.js';
import { critterTextures } from './critters.js';
import { ambientTextures } from './ambient.js';

// A stand-in for Phaser's texture manager: the art code only needs canvases.
const store = {};
const scene = {
  textures: {
    exists: (k) => k in store,
    remove: (k) => delete store[k],
    createCanvas: (k, w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      store[k] = c;
      return { getContext: () => c.getContext('2d'), refresh() {}, getSourceImage: () => c, setFilter() {} };
    },
    addCanvas: (k, c) => (store[k] = c),
    get: (k) => ({ getSourceImage: () => store[k] }),
  },
};

const root = document.getElementById('lib');
const S = 3;

function card(label, keys, code) {
  const c = document.createElement('div');
  c.className = 'card';
  const row = document.createElement('div');
  row.className = 'row';
  keys.forEach((k) => {
    const src = store[k];
    if (!src) return;
    const cv = document.createElement('canvas');
    cv.width = src.width;
    cv.height = src.height;
    cv.style.width = `${src.width * S}px`;
    cv.style.height = `${src.height * S}px`;
    cv.getContext('2d').drawImage(src, 0, 0);
    row.appendChild(cv);
  });
  c.append(row);
  c.insertAdjacentHTML('beforeend', `<b></b>${code ? `<code>${code}</code>` : ''}`);
  c.querySelector('b').textContent = label;
  return c;
}

function section(title, cards) {
  const h = document.createElement('h2');
  h.textContent = `${title} (${cards.length})`;
  const g = document.createElement('div');
  g.className = 'grid';
  g.append(...cards);
  root.append(h, g);
}

const base = { h: '#4a2e20', s: '#e0ac80', c: '#3d6fb6', p: '#2f2b3d', b: '#1a1418', w: '#efe6d4', g: '#c9a23f' };
let n = 0;
const char = (label, look, colors = {}, views = ['down', 'side', 'up', 'down_1']) => {
  const key = `c${n++}`;
  makeCharacter(scene, key, { ...base, ...colors }, look);
  return card(label, views.map((v) => `${key}_${v}`));
};

const tabs = {
  characters() {
    section('Hairstyles', Object.entries(HAIRSTYLES).map(([id, l]) => char(l, id === 'bald' ? { bald: true } : { hair: id })));
    section('Outfits', Object.entries(OUTFITS).map(([id, l]) => char(l, { outfit: id }, { c: '#7a2e3a' })));
    section('Accessories', Object.entries(ACCESSORIES).filter(([id]) => id !== 'none').map(([id, l]) => char(l, { acc: id })));
    section('Hats', Object.entries(HATS).filter(([id]) => id !== 'none').map(([id, l]) => char(l, { hat: id }, { T: '#2a2a2e' })));
    section('Facial hair', Object.entries(FACIAL).filter(([id]) => id !== 'none').map(([id, l]) => char(l, { facial: id })));
    section('Glasses', Object.entries(GLASSES).filter(([id]) => id !== 'none').map(([id, l]) => char(l, { glasses: id })));
    section('Poses', [char('Walking (front)', {}, {}, ['down', 'down_1', 'down', 'down_2']), char('Walking (side)', {}, {}, ['side', 'side_1']), char('Phone & sitting', {}, {}, ['phone', 'sit'])]);
    section('Builds', Object.entries(BUILDS).map(([id, l]) => char(l, { build: id })));
    section('Legs and feet', [...Object.entries(LEGS).filter(([id]) => id !== 'trousers').map(([id, l]) => char(l, { legs: id })), ...Object.entries(FEET).filter(([id]) => id !== 'shoes').map(([id, l]) => char(l, { feet: id }))]);
    section('Things people carry', Object.entries(CARRY).map(([id, l]) => char(l, { carry: id }, {}, ['down', 'side', 'up', 'side_1'])));
    section('Things set down', Object.entries(GROUND).map(([id, l]) => char(l, { ground: id }, {}, ['down', 'side'])));
    section('On the shoulder', Object.entries(BUDDIES).map(([id, l]) => char(l, { buddy: id })));
    section('Work poses', Object.entries(POSES).map(([id, l]) => char(l, { pose: id }, {}, ['pose_0', 'pose_1'])));
  },
  // every class and variant: one person's frames, then three more rolled people
  people() {
    Object.entries(GROUPS).forEach(([g, title]) => {
      const list = PEOPLE_LIST.filter((p) => p.cls.group === g);
      section(`${title} · ${Object.values(CLASSES).filter((c) => c.group === g).length} classes`, list.map((p) => {
        const keys = [];
        [0, 1, 2, 3].forEach((n) => {
          const one = personFor(p.id, (k) => ((Math.sin((n + 1) * 91.7 + k * 12.9898) * 43758.5453) % 1 + 1) % 1);
          const key = `pp_${p.tile}_${n}`;
          makeCharacter(scene, key, one.colors, one.look);
          if (n === 0) keys.push(...(one.pose ? ['pose_0', 'pose_1', 'down', 'side'] : ['down', 'side', 'up', 'side_1']).map((v) => `${key}_${v}`));
          else keys.push(`${key}_${one.pose ? 'pose_0' : 'down'}`);
        });
        return card(p.label, keys, `t:${p.tile}`);
      }));
    });
    // crews: everyone in the group, at work
    section(`Crews · ${Object.keys(CREWS).length}`, Object.entries(CREWS).map(([id, crew]) => {
      const keys = crew.members.map(([pid], n) => {
        const one = personFor(pid, (k) => ((Math.sin((n + 1) * 91.7 + k * 12.9898) * 43758.5453) % 1 + 1) % 1);
        const key = `pc_${id}_${n}`;
        makeCharacter(scene, key, one.colors, one.look);
        return `${key}_${one.pose ? 'pose_0' : 'down'}`;
      });
      return card(crew.label, keys, `t:crew_${id}`);
    }));
  },
  famous() {
    section('Famous visitors', Object.entries(FAMOUS).map(([id, f]) => {
      makeCharacter(scene, `f_${id}`, f.colors, f.look);
      return card(f.name, ['down', 'side', 'up'].map((v) => `f_${id}_${v}`), id);
    }));
  },
  pets() {
    Object.keys(PETS).filter((k) => k !== 'none').forEach((kind) =>
      section(PETS[kind], PET_COLORS[kind].map((col, i) => {
        makePet(scene, `p_${kind}_${i}`, kind, col);
        return card(col, ['down', 'side', 'up', 'side_1', 'down_sit'].map((v) => `p_${kind}_${i}_${v}`));
      })),
    );
  },
  decor() {
    Object.entries(CATEGORIES).forEach(([cat, label]) => {
      const list = Object.entries(ITEMS).filter(([, d]) => d.cat === cat);
      section(label, list.map(([type, def]) => {
        const key = `i_${type}`;
        if (def.plant) bakePlant(scene, key, def.plant);
        else bakeItem(scene, key, type, def, 0);
        const keys = [key];
        if (def.rotatable) {
          bakeItem(scene, `${key}_r`, type, def, 1);
          keys.push(`${key}_r`);
        }
        return card(def.name, keys, type);
      }));
    });
  },
  // every column design at the sizes the game uses: main hall, atrium, toolkit
  columns() {
    section('Columns', Object.entries(COLUMNS).map(([id, c]) => {
      [[34, 88], [34, 70], [32, 89]].forEach(([w, h], i) => (store[`col_${id}_${i}`] = columnCanvas(id, w, h)));
      return card(`${c.name} · ${c.place}`, [0, 1, 2].map((i) => `col_${id}_${i}`), id);
    }));
  },
  creatures() {
    makeEmotes(scene);
    section('Emotes', ['heart', 'bang', 'q', 'zzz', 'note', 'star'].map((e) => card(e, [`emote_${e}`])));
    critterTextures(scene);
    section('Island creatures', [
      card('Gull', ['gull_0', 'gull_1']),
      card('Crab', ['crab_0', 'crab_1']),
      ...[0, 1, 2, 3].map((i) => card(`Butterfly ${i + 1}`, [`fly_${i}_0`, `fly_${i}_1`])),
      card('Fish', ['fish']),
      card('Firefly', ['firefly']),
      card('Duck', ['duck_0', 'duck_1']),
      card('Duckling', ['duckling_0', 'duckling_1']),
      card('Frog', ['frog_0', 'frog_1']),
      card('Lily pad', ['lilypad']),
    ]);
    ambientTextures(scene);
    section('Wildlife and ambience', [
      card('Rabbit', ['rabbit_0', 'rabbit_1', 'rabbit_2']),
      card('Snow rabbit', ['rabbit_w_0', 'rabbit_w_1', 'rabbit_w_2']),
      card('Sparrow', ['sparrow_0', 'sparrow_1', 'sparrow_fly_0', 'sparrow_fly_1']),
      card('Squirrel', ['squirrel_0', 'squirrel_1']),
      card('Napping cat', ['napcat_0', 'napcat_1', 'napcat_up']),
      card('Bee', ['bee']),
      card('Snail', ['snail_0', 'snail_1']),
      card('Dragonfly', ['dragonfly_0', 'dragonfly_1']),
      card('Sandpiper', ['piper_0', 'piper_1', 'piper_2']),
      card('Hermit crab', ['hermit_0', 'hermit_1', 'hermit_in']),
      card('Sea turtle', ['turtle_0', 'turtle_1']),
      card('Sailboat', ['sailboat_0', 'sailboat_1']),
      card('Dolphin', ['dolphin']),
      card('Bottle', ['bottle']),
      card('Jellyfish', ['jelly_0', 'jelly_1']),
      card('Bat', ['bat_0', 'bat_1']),
      card('Moth', ['moth']),
      card('Owl', ['owl_0', 'owl_1', 'owl_2']),
      card('Float', ['bobber']),
      card('Cloud shadow', ['cloud_shadow']),
    ]);
  },
};

function show(tab) {
  root.replaceChildren();
  document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  tabs[tab]();
}
document.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => show(b.dataset.tab)));
show('characters');
