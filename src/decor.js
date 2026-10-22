// Customize panel (home button). "This room" recolors only the room you're in;
// "Character" changes the curator. Each color row is a swipeable strip of
// swatches, ending in a + that opens a full color picker.
import { PALETTES, FLOOR_PATTERNS, PLANTS } from './art.js';
import { SIZE_LABELS, ORIENT_LABELS, roomName } from './rooms.js';

export const CHARACTER_PALETTES = {
  h: { label: 'Hair', colors: ['#4a2e20', '#1e1410', '#d9b45a', '#a0522d', '#8a8a8a', '#e8e0d0', '#c0392b', '#2e5a8a', '#6a4c93'] },
  s: { label: 'Skin', colors: ['#f2c6a0', '#e0ac80', '#c68a5e', '#9a6440', '#6e4428', '#4a2c18', '#ffe0c8'] },
  c: { label: 'Outfit', colors: ['#7a2e3a', '#3d6fb6', '#4f7a3a', '#c27a2c', '#6a4c93', '#2a2a2e', '#e8e2d4', '#2e7d7a', '#b0413e'] },
  p: { label: 'Pants', colors: ['#2f2b3d', '#3b3a48', '#5a4632', '#1e1e22', '#3c4a63', '#7a6a58', '#e8e2d4'] },
  b: { label: 'Shoes', colors: ['#1a1418', '#4a2e20', '#e8e2d4', '#7a2232', '#3c4a63'] },
};
export const DEFAULT_CHARACTER = { h: '#4a2e20', s: '#f2c6a0', c: '#7a2e3a', p: '#2f2b3d', b: '#1a1418' };

const el = document.getElementById('decor');
const body = el.querySelector('.decor-body');
const tabs = el.querySelectorAll('[data-tab]');

export function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; changes last until reload
  }
}

let state = null;
let tab = 'room';

const section = (label, ...children) => {
  const s = document.createElement('section');
  s.innerHTML = `<h3>${label}</h3>`;
  s.append(...children);
  return s;
};

// A swipeable row of color swatches plus a custom color picker.
function strip(colors, value, onPick) {
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
function choices(options, value, onPick, icon) {
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
  parts.push(section('Size (decor stays)', choices(SIZE_LABELS[room.orient], room.size, (size) => size !== room.size && state.onRoom({ size }))));
  if (room.exit && room.exit.startsWith('door')) {
    parts.push(section('Exit doorway', choices({ door: 'Door', arch: 'Archway' }, room.arch ? 'arch' : 'door', (v) => state.onRoom({ arch: v === 'arch' }))));
  }
  return parts;
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
    btn('↑', 'Move up', () => state.onMoveRoom(i, i - 1), i === 0);
    btn('↓', 'Move down', () => state.onMoveRoom(i, i + 1), i === state.rooms.length - 1);
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
    const pal = pattern === 'planks' ? PALETTES.wood : PALETTES.stone;
    const fallback = { planks: '#8f5e3c', stone: '#9a968f', tile: '#e9e6df' }[pattern];
    set({ pattern, ...(fallback && !pal.includes(d.floor) ? { floor: fallback } : {}) });
  };
  const parts = [...renderRoomSettings(), section('Floor pattern', choices(FLOOR_PATTERNS, d.pattern, pickPattern))];
  if (d.pattern.startsWith('checker')) {
    parts.push(section('Checker color 1', strip(PALETTES.stone, d.checkA, (checkA, live) => set({ checkA }, live))));
    parts.push(section('Checker color 2', strip(PALETTES.stone, d.checkB, (checkB, live) => set({ checkB }, live))));
  } else {
    const pal = d.pattern === 'planks' ? PALETTES.wood : PALETTES.stone;
    parts.push(section('Floor color', strip(pal, d.floor, (floor, live) => set({ floor }, live))));
  }
  parts.push(section('Wall', choices({ plain: 'Plain', stripes: 'Striped' }, d.paperStyle || 'stripes', (paperStyle) => set({ paperStyle }))));
  parts.push(section('Wall color', strip(PALETTES.paper, d.paper, (paper, live) => set({ paper }, live))));
  parts.push(section('Wainscot', choices({ none: 'None', panels: 'Wood panels' }, d.wainscotStyle || 'panels', (wainscotStyle) => set({ wainscotStyle }))));
  parts.push(section('Trim & wainscot color', strip(PALETTES.wainscot, d.wainscot, (wainscot, live) => set({ wainscot }, live))));
  parts.push(section('Carpet', choices({ off: 'None', on: 'Runner' }, d.carpet ? 'on' : 'off', (v) => set({ carpet: v === 'on' }))));
  if (d.carpet) parts.push(section('Carpet color', strip(PALETTES.carpet, d.carpetColor, (carpetColor, live) => set({ carpetColor }, live))));
  parts.push(section('Plants (between paintings)', choices(PLANTS, d.plant, (plant) => set({ plant }), state.plantIcon)));
  return parts;
}

function renderCharacter() {
  const ch = state.character;
  const preview = document.createElement('div');
  preview.className = 'char-preview';
  preview.append(...state.characterPreview());
  const parts = [preview];
  Object.entries(CHARACTER_PALETTES).forEach(([key, { label, colors }]) => {
    parts.push(
      section(
        label,
        strip(colors, ch[key], (color, live) => {
          state.character = { ...state.character, [key]: color };
          state.onCharacter(state.character);
          if (live) preview.replaceChildren(...state.characterPreview());
          else render();
        }),
      ),
    );
  });
  return parts;
}

function render() {
  const scroll = body.scrollTop;
  tabs.forEach((t) => t.classList.toggle('on', t.dataset.tab === tab));
  body.replaceChildren(...({ room: renderRoom, rooms: renderRooms, character: renderCharacter }[tab] || renderRoom)());
  body.scrollTop = scroll;
}

tabs.forEach((t) =>
  t.addEventListener('click', () => {
    tab = t.dataset.tab;
    body.scrollTop = 0;
    render();
  }),
);
el.querySelector('.decor-close').addEventListener('click', () => {
  el.classList.add('hidden');
  state.onClose?.();
});
el.querySelector('.decor-reset').addEventListener('click', () => state.onReset?.());

export function closeDecor() {
  el.classList.add('hidden');
}

// opts: { decor, character, room, index, rooms, onDecor, onCharacter, onRoom(patch), onMoveRoom(i, j),
//         onGoRoom(i), onReset, onClose, plantIcon(id), characterPreview() }
export function openDecor(opts) {
  state = { ...opts };
  render();
  el.classList.remove('hidden');
}
