// Customize panel (home button). "This room" recolors only the room you're in;
// "Character" changes the curator. Each color row is a swipeable strip of
// swatches, ending in a + that opens a full color picker.
import { HATS, FACIAL, GLASSES, HAIRSTYLES, OUTFITS, ACCESSORIES, PALETTES, FLOOR_PATTERNS, WOOD_FLOORS, TWO_COLOR_FLOORS, FLOOR_DEFAULTS, WALL_PATTERNS, WAINSCOT_STYLES, LIGHTS, PLANTS } from './art.js';
import { TRACKS } from './music.js';
import { PETS, PET_COLORS } from './pets.js';

// One-tap room styles. Each sets floor, walls, lighting and music.
export const THEMES = {
  classical: { name: 'Classical gallery', decor: { pattern: 'marble', floor: '#e9e6df', paperStyle: 'damask', paper: '#7a3a3e', wainscotStyle: 'panels', wainscot: '#3e2a20', carpet: true, carpetColor: '#7a2232', light: 'warm', music: 'gallery' } },
  egyptian: { name: 'Egyptian', decor: { pattern: 'sand', floor: '#d9c7a8', paperStyle: 'hieroglyph', paper: '#d9b878', wainscotStyle: 'none', wainscot: '#a8862e', carpet: false, light: 'warm', music: 'egypt' } },
  japanese: { name: 'Japanese', decor: { pattern: 'parquet', floor: '#cfae80', paperStyle: 'sakura', paper: '#f0ece2', wainscotStyle: 'panels', wainscot: '#5c3a26', carpet: false, light: 'day', music: 'japan' } },
  science: { name: 'Natural history', decor: { pattern: 'stone', floor: '#9a968f', paperStyle: 'plain', paper: '#8a9a8a', wainscotStyle: 'panels', wainscot: '#3e2a20', carpet: false, light: 'cool', music: 'science' } },
  modern: { name: 'Modern white', decor: { pattern: 'tile', floor: '#e9e6df', paperStyle: 'plain', paper: '#f0ece2', wainscotStyle: 'none', wainscot: '#cfcfcf', carpet: false, light: 'day', music: 'none' } },
  moody: { name: 'Moody', decor: { pattern: 'herringbone', floor: '#5c3a26', paperStyle: 'stripes', paper: '#2f4a3a', wainscotStyle: 'panels', wainscot: '#1e1e22', carpet: true, carpetColor: '#c9a23f', light: 'moody', music: 'gallery' } },
};
import { SIZE_LABELS, ORIENT_LABELS, roomName, isFixed } from './rooms.js';
import { roomRating, starText } from './rating.js';

export const CHARACTER_PALETTES = {
  h: { label: 'Hair color', colors: ['#4a2e20', '#1e1410', '#d9b45a', '#a0522d', '#8a8a8a', '#e8e0d0', '#c0392b', '#2e5a8a', '#6a4c93', '#d06a9a', '#4a8ab0'] },
  e: { label: 'Eyes', colors: ['#2a1a14', '#4a2e20', '#3a5a8a', '#3a7a4a', '#6a6a7a', '#7a4a8a'] },
  s: { label: 'Skin', colors: ['#ffe0c8', '#f2c6a0', '#e0ac80', '#c68a5e', '#b57850', '#9a6440', '#6e4428', '#4a2c18'] },
  c: { label: 'Jacket', colors: ['#7a2e3a', '#3d6fb6', '#4f7a3a', '#c27a2c', '#6a4c93', '#2a2a2e', '#e8e2d4', '#2e7d7a', '#b0413e', '#f08ab0', '#5a4632'] },
  w: { label: 'Shirt', colors: ['#efe6d4', '#ffffff', '#cfe0f0', '#f4e0a0', '#e8c8d0', '#2a2a2e', '#c8d8b0'] },
  g: { label: 'Tie & trim', colors: ['#c9a23f', '#b0413e', '#2e4a7a', '#2a2a2e', '#4f7a3a', '#e8e2d4', '#6a4c93'] },
  p: { label: 'Pants', colors: ['#2f2b3d', '#3b3a48', '#5a4632', '#1e1e22', '#3c4a63', '#7a6a58', '#e8e2d4', '#6a8a4a'] },
  b: { label: 'Shoes', colors: ['#1a1418', '#4a2e20', '#e8e2d4', '#7a2232', '#3c4a63', '#c9a23f'] },
};
// What the main color is called for each outfit, and which colors an outfit shows.
const MAIN_LABEL = { suit: 'Jacket', vest: 'Waistcoat', sweater: 'Sweater', tee: 'T-shirt', hoodie: 'Hoodie', coat: 'Coat', apron: 'Shirt', dress: 'Dress', gown: 'Gown', toga: 'Toga' };
const USES = {
  suit: ['w', 'g', 'p'],
  vest: ['w', 'g', 'p'],
  sweater: ['p'],
  tee: ['p'],
  hoodie: ['p'],
  coat: ['w', 'g', 'p'],
  apron: ['g', 'p'],
  dress: [],
  gown: [],
  toga: ['g'],
};
const ACC_COLORS = ['#c0392b', '#2e7d7a', '#c9a23f', '#3d6fb6', '#e8e2d4', '#1e1e22', '#6a4c93'];
export const DEFAULT_CHARACTER = { h: '#4a2e20', s: '#f2c6a0', c: '#7a2e3a', p: '#2f2b3d', b: '#1a1418', w: '#efe6d4', g: '#c9a23f', hair: 'short', outfit: 'suit' };

const el = document.getElementById('decor');
const body = el.querySelector('.decor-body');
const sheet = el.querySelector('.decor-sheet'); // (the part that scrolls)
const tabs = el.querySelectorAll('[data-tab]');

export { load, save } from './storage.js';

let state = null;
let tab = 'room';

export const section = (label, ...children) => {
  const s = document.createElement('section');
  s.innerHTML = `<h3>${label}</h3>`;
  s.append(...children);
  return s;
};

// A swipeable row of color swatches plus a custom color picker.
export function strip(colors, value, onPick) {
  const row = document.createElement('div');
  row.className = 'strip';
  colors.forEach((c) => {
    const b = document.createElement('button');
    b.className = 'dot' + (c.toLowerCase() === value.toLowerCase() ? ' on' : '');
    b.style.background = c;
    b.setAttribute('aria-label', c);
    b.onclick = () => onPick(c);
    row.appendChild(b);
  });
  const custom = document.createElement('label');
  const isCustom = !colors.some((c) => c.toLowerCase() === value.toLowerCase());
  custom.className = 'dot custom' + (isCustom ? ' on' : '');
  if (isCustom) custom.style.background = value;
  custom.innerHTML = `<span>+</span><input type="color" value="${value}" aria-label="Pick any color" />`;
  custom.querySelector('input').addEventListener('input', (e) => onPick(e.target.value, true));
  row.appendChild(custom);
  return row;
}

// A row of labelled choice buttons that wraps (no scrolling).
export function choices(options, value, onPick, icon) {
  const row = document.createElement('div');
  row.className = 'choices';
  Object.entries(options).forEach(([id, label]) => {
    const b = document.createElement('button');
    b.className = id === value ? 'on' : '';
    const img = icon?.(id);
    b.innerHTML = img ? `<img src="${img}" alt="" />${label}` : label;
    b.onclick = () => onPick(id);
    row.appendChild(b);
  });
  return row;
}

// Room settings at the top of "This room": name, size, doorway style.
function renderRoomSettings() {
  const { room, index } = state;
  const name = document.createElement('input');
  name.className = 'room-name';
  name.value = roomName(room, index);
  name.maxLength = 24;
  name.addEventListener('change', () => state.onRoom({ name: name.value.trim() || undefined }));
  const parts = [section(`${ORIENT_LABELS[room.orient]} room · name`, name)];
  if (isFixed(room)) return parts; // the entrance and main hall keep their shape
  parts.push(section('Size (decor stays)', choices(SIZE_LABELS[room.orient], room.size, (size) => size !== room.size && state.onRoom({ size }))));
  if (room.exit && room.exit.startsWith('door')) {
    parts.push(section('Exit doorway', choices({ door: 'Door', arch: 'Archway' }, room.arch ? 'arch' : 'door', (v) => state.onRoom({ arch: v === 'arch' }))));
  }
  return parts;
}

// This room's rating, with what each part scored and how to raise it.
function renderRating() {
  const r = roomRating(state.rooms, state.index);
  const list = document.createElement('div');
  list.className = 'rating';
  r.parts.forEach((p) => {
    const row = document.createElement('div');
    row.className = 'rating-row';
    row.innerHTML = `<span class="rating-label"></span><span class="rating-bar"><i style="width:${(100 * p.got) / p.max}%"></i></span><b>${p.got}/${p.max}</b><small></small>`;
    row.querySelector('.rating-label').textContent = p.label;
    row.querySelector('small').textContent = p.tip;
    list.appendChild(row);
  });
  return section(`Rating ${starText(r.stars)} · ${r.score}/100`, list);
}

// This room's janitor: hire one (each costs more than the last) to keep it clean.
function renderStaff() {
  const j = state.janitor;
  const b = document.createElement('button');
  b.className = 'wide-btn';
  if (j.hired) {
    b.textContent = 'Janitor hired: this room stays spotless';
    b.disabled = true;
  } else {
    b.textContent = j.free ? `Hire a janitor · free while testing (${j.cost} gold)` : `Hire a janitor · ${j.cost} gold`;
    b.onclick = () => {
      state.onHireJanitor();
      state.janitor = { ...j, hired: true };
      render();
    };
  }
  return section('Janitor', b);
}

// Every room in the chain: move rooms up or down, or go to one.
function renderRooms() {
  const list = document.createElement('div');
  list.className = 'room-list';
  state.rooms.forEach((room, i) => {
    const row = document.createElement('div');
    row.className = 'room-row' + (i === state.index ? ' on' : '');
    row.innerHTML = `<span class="rr-num">${i + 1}</span><span class="rr-name"><b>${roomName(room, i)}</b><i>${ORIENT_LABELS[room.orient]} · ${SIZE_LABELS[room.orient][room.size]}</i></span>`;
    const btn = (label, aria, onClick, disabled) => {
      const b = document.createElement('button');
      b.textContent = label;
      b.setAttribute('aria-label', aria);
      b.disabled = disabled;
      b.onclick = onClick;
      row.appendChild(b);
    };
    const fixed = isFixed(room);
    btn('↑', 'Move up', () => state.onMoveRoom(i, i - 1), fixed || i === 0 || isFixed(state.rooms[i - 1]));
    btn('↓', 'Move down', () => state.onMoveRoom(i, i + 1), fixed || i === state.rooms.length - 1);
    btn('Go', 'Go to room', () => state.onGoRoom(i), i === state.index);
    list.appendChild(row);
  });
  const note = document.createElement('p');
  note.className = 'toolkit-note';
  note.textContent = 'Rooms connect in this order: each room’s exit leads to the next one. Moving a room takes its decor with it.';
  return [note, list];
}

function renderRoom() {
  const d = state.decor;
  const set = (patch, live) => {
    state.decor = { ...state.decor, ...patch };
    state.onDecor(state.decor);
    if (!live) render();
  };
  // Switching between wood and stone patterns starts from a fitting color.
  const pickPattern = (pattern) => {
    const wood = WOOD_FLOORS.includes(pattern);
    const pal = wood ? PALETTES.wood : PALETTES.stone;
    const fallback = wood ? '#8f5e3c' : FLOOR_DEFAULTS[pattern];
    set({ pattern, ...(fallback && !pal.includes(d.floor) ? { floor: fallback } : {}) });
  };
  const themes = Object.fromEntries(Object.entries(THEMES).map(([id, t]) => [id, t.name]));
  const staffRoom = state.room.orient === 'break';
  const parts = [
    ...(staffRoom ? [] : [renderRating(), renderStaff(), ...renderRoomSettings()]),
    section('Theme (one tap)', choices(themes, null, (id) => set(THEMES[id].decor))),
    section('Floor pattern', choices(FLOOR_PATTERNS, d.pattern, pickPattern)),
  ];
  if (TWO_COLOR_FLOORS.includes(d.pattern)) {
    parts.push(section('Floor color 1', strip(PALETTES.stone, d.checkA, (checkA, live) => set({ checkA }, live))));
    parts.push(section('Floor color 2', strip(PALETTES.stone, d.checkB, (checkB, live) => set({ checkB }, live))));
  } else {
    const pal = WOOD_FLOORS.includes(d.pattern) ? PALETTES.wood : PALETTES.stone;
    parts.push(section('Floor color', strip(pal, d.floor, (floor, live) => set({ floor }, live))));
  }
  parts.push(section('Wall pattern', choices(WALL_PATTERNS, d.paperStyle || 'stripes', (paperStyle) => set({ paperStyle }))));
  parts.push(section('Wall color', strip(PALETTES.paper, d.paper, (paper, live) => set({ paper }, live))));
  parts.push(section('Wainscot', choices(WAINSCOT_STYLES, d.wainscotStyle || 'panels', (wainscotStyle) => set({ wainscotStyle }))));
  parts.push(section('Trim & wainscot color', strip(PALETTES.wainscot, d.wainscot, (wainscot, live) => set({ wainscot }, live))));
  parts.push(section('Carpet', choices({ off: 'None', on: 'Runner' }, d.carpet ? 'on' : 'off', (v) => set({ carpet: v === 'on' }))));
  if (d.carpet) parts.push(section('Carpet color', strip(PALETTES.carpet, d.carpetColor, (carpetColor, live) => set({ carpetColor }, live))));
  parts.push(section('Plants (between paintings)', choices(PLANTS, d.plant, (plant) => set({ plant }), state.plantIcon)));
  parts.push(section('Lighting', choices(LIGHTS, d.light || 'warm', (light) => set({ light }))));
  parts.push(section('Music in this room', choices(TRACKS, d.music || 'none', (music) => set({ music }))));
  return parts;
}

// The curator turning on the spot: front, side, back, other side.
let spin = null;
function turntable(frames) {
  clearInterval(spin);
  const S = 5;
  const c = document.createElement('canvas');
  c.className = 'char-spin';
  c.width = 32 * S;
  c.height = 32 * S;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const order = [[0, false], [1, false], [2, false], [1, true]];
  let k = 0;
  let t = 0;
  const draw = () => {
    const [i, flip] = order[k % 4];
    const bob = t % 2;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(16 * S, 31 * S, 7 * S, 1.6 * S, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    if (flip) {
      ctx.translate(c.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(frames[i], 0, -bob * S, 32 * S, 32 * S);
    ctx.restore();
    // the pet sits at their feet
    if (frames[3]) ctx.drawImage(frames[3], 13 * S, 6 * S, 22 * S, 22 * S);
  };
  draw();
  spin = setInterval(() => {
    t++;
    if (t % 4 === 0) k++;
    draw();
  }, 260);
  return c;
}

function renderCharacter() {
  const ch = state.character;
  const preview = document.createElement('div');
  preview.className = 'char-preview';
  const refresh = () => preview.replaceChildren(turntable(state.characterPreview()));
  refresh();
  const parts = [preview];
  const setChar = (patch, live) => {
    state.character = { ...state.character, ...patch };
    state.onCharacter(state.character);
    if (live) refresh();
    else render();
  };
  const colorRow = (key, label) => section(label || CHARACTER_PALETTES[key].label, strip(CHARACTER_PALETTES[key].colors, ch[key] || CHARACTER_PALETTES[key].colors[0], (color, live) => setChar({ [key]: color }, live)));
  const style = ch.outfit || 'suit';
  const pick = (key) => (v) => setChar({ [key]: v });
  parts.push(section('Hairstyle', choices(HAIRSTYLES, ch.hair || 'short', pick('hair'))));
  if (ch.hair !== 'bald') parts.push(colorRow('h'));
  parts.push(colorRow('s'));
  parts.push(colorRow('e'));
  // face details: each button toggles on and off
  const face = document.createElement('div');
  face.className = 'choices';
  [['freckles', 'Freckles'], ['blush', 'Rosy cheeks'], ['earrings', 'Earrings']].forEach(([k, label]) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = ch[k] ? 'on' : '';
    b.onclick = () => setChar({ [k]: !ch[k] });
    face.appendChild(b);
  });
  parts.push(section('Face', face));
  parts.push(section('Facial hair', choices(FACIAL, ch.facial || 'none', pick('facial'))));
  parts.push(section('Outfit', choices(OUTFITS, style, pick('outfit'))));
  parts.push(colorRow('c', MAIN_LABEL[style]));
  const uses = USES[style] || [];
  if (uses.includes('w')) parts.push(colorRow('w'));
  if (uses.includes('g')) parts.push(colorRow('g', style === 'toga' ? 'Sash' : style === 'apron' ? 'Apron' : 'Tie & trim'));
  if (uses.includes('p')) parts.push(colorRow('p'));
  parts.push(colorRow('b'));
  parts.push(section('Hat', choices(HATS, ch.hat || 'none', pick('hat'))));
  if (ch.hat && ch.hat !== 'none' && ch.hat !== 'crown' && ch.hat !== 'laurel') {
    parts.push(section('Hat color', strip(HAT_COLORS, ch.T || '#e8d8a0', (T, live) => setChar({ T }, live))));
  }
  parts.push(section('Glasses', choices(GLASSES, ch.glasses || 'none', pick('glasses'))));
  parts.push(section('Pet', choices(PETS, ch.pet || 'none', (v) => setChar({ pet: v, petColor: PET_COLORS[v]?.[0] }))));
  if (ch.pet && ch.pet !== 'none') parts.push(section('Pet color', strip(PET_COLORS[ch.pet], ch.petColor || PET_COLORS[ch.pet][0], (v, live) => setChar({ petColor: v }, live))));
  parts.push(section('Accessory', choices(ACCESSORIES, ch.acc || 'none', pick('acc'))));
  if (ch.acc && !['none', 'badge', 'necklace', 'camera'].includes(ch.acc)) {
    const key = ch.acc === 'bag' ? 'K' : 'X';
    const colors = ch.acc === 'bag' ? ['#6a4a2a', '#3a2a20', '#7a2232', '#2e4a7a', '#c27a2c', '#1e1e22'] : ACC_COLORS;
    parts.push(section(ch.acc === 'bag' ? 'Bag color' : 'Accessory color', strip(colors, ch[key] || colors[0], (v, live) => setChar({ [key]: v }, live))));
  }
  return parts;
}

const HAT_COLORS = ['#e8d8a0', '#1e1e22', '#7a2232', '#3d6fb6', '#4f7a3a', '#c27a2c', '#e8e2d4', '#6a4c93'];

function render() {
  const scroll = sheet.scrollTop;
  tabs.forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
  body.replaceChildren(...({ room: renderRoom, rooms: renderRooms, character: renderCharacter }[tab] || renderRoom)());
  sheet.scrollTop = scroll;
}

tabs.forEach((t) =>
  t.addEventListener('click', () => {
    tab = t.dataset.tab;
    sheet.scrollTop = 0;
    render();
  }),
);
el.querySelector('.decor-close').addEventListener('click', () => {
  clearInterval(spin);
  el.classList.add('hidden');
  state.onClose?.();
});

export function closeDecor() {
  clearInterval(spin);
  el.classList.add('hidden');
}

// opts: { decor, character, room, index, rooms, onDecor, onCharacter, onRoom(patch), onMoveRoom(i, j),
//         onGoRoom(i), onClose, plantIcon(id), characterPreview() }
export function openDecor(opts) {
  state = { ...opts };
  render();
  el.classList.remove('hidden');
}
