// Room definitions. The museum is a chain: each room's exit leads to the
// next room, and an unbuilt exit opens the build menu.
import { T } from './art.js';
import { PAINTINGS } from './paintings.js';
import { load, save } from './decor.js';

export const D = 2 * T; // wall height on screen
const SLOT_GAP = 4 * T;
const ROOMS_KEY = 'curation.rooms'; // (old) rooms after the first
const ROOM_LIST_KEY = 'curation.roomList'; // every room, including the first
// Per-room data stored by room index; moved along when rooms are reordered.
const PER_ROOM_KEYS = ['curation.roomDecor', 'curation.items', 'curation.slots', 'curation.piles', 'curation.dirt'];
const SLOTS_KEY = 'curation.slots'; // { [roomIndex]: { 'wall:u': { kind, id } } }

// Floor size in tiles. Vertical rooms are 5 wide; horizontal rooms are 5 deep;
// big halls are square.
export const SIZES = {
  vertical: { short: 8, medium: 12, long: 18 },
  horizontal: { short: 9, medium: 13, long: 18 },
  square: { short: 7, medium: 9, long: 12 },
};

export const ORIENT_LABELS = { vertical: 'Vertical', horizontal: 'Horizontal', square: 'Big hall' };
export const SIZE_LABELS = {
  vertical: { short: 'Short', medium: 'Medium', long: 'Long' },
  horizontal: { short: 'Short', medium: 'Medium', long: 'Long' },
  square: { short: 'Small', medium: 'Medium', long: 'Large' },
};

export const EXITS = {
  vertical: ['door-back', 'door-left', 'door-right', 'stairs-up', 'stairs-down', 'none'],
  horizontal: ['stairs-up', 'door-back', 'door-end', 'stairs-down', 'none'],
  square: ['door-back', 'door-left', 'door-right', 'stairs-up', 'stairs-down', 'none'],
};

export function roomName(room, i) {
  return room.name || (i === 0 ? 'Entrance hall' : `Room ${i + 1}`);
}

export function exitLabel(orient, kind) {
  const labels = {
    'door-back': orient === 'horizontal' ? 'Door on the main wall' : 'Door on the far wall',
    'door-left': 'Door on the left wall',
    'door-right': 'Door on the right wall',
    'door-end': 'Door on the end wall',
    'stairs-up': 'Stairs up',
    'stairs-down': 'Stairs down',
    none: 'No exit',
  };
  return labels[kind];
}

const FIRST_ROOM = { orient: 'vertical', size: 'medium', exit: 'door-back' };

export function loadRooms() {
  return load(ROOM_LIST_KEY, null) || [FIRST_ROOM, ...load(ROOMS_KEY, [])];
}

function saveRooms(list) {
  save(ROOM_LIST_KEY, list);
}

export function addRoom(room) {
  saveRooms([...loadRooms(), room]);
}

// Change a room in place (size, name, exit style...). Its decor stays.
export function updateRoom(i, patch) {
  const list = loadRooms();
  list[i] = { ...list[i], ...patch };
  saveRooms(list);
}

// Swap two rooms in the chain, taking their decor, items and wall spots along.
export function swapRooms(i, j) {
  const list = loadRooms();
  if (i < 0 || j < 0 || i >= list.length || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  saveRooms(list);
  PER_ROOM_KEYS.forEach((key) => {
    const all = load(key, {});
    const a = all[i];
    const b = all[j];
    if (b === undefined) delete all[i];
    else all[i] = b;
    if (a === undefined) delete all[j];
    else all[j] = a;
    save(key, all);
  });
}

export function resetRooms() {
  saveRooms([loadRooms()[0]]);
  save(SLOTS_KEY, { 0: load(SLOTS_KEY, {})[0] || {} });
}

// Full layout for a room: geometry, painting slots, exit, entrance.
// Vertical rooms: enter at the bottom (doormat), the exit is at the top end.
// Horizontal rooms: enter through a door on the left end wall, the exit is at the right end.
export function layout(room) {
  const square = room.orient === 'square';
  // Big halls behave like vertical rooms (enter at the bottom, exit at the top).
  const vertical = room.orient !== 'horizontal';
  const n = SIZES[room.orient][room.size];
  const fw = square ? n : vertical ? 5 : n;
  const fd = square ? n : vertical ? n : 5;
  const xL = 2 * T;
  const xR = xL + fw * T;
  const y0 = T + D;
  const y1 = y0 + fd * T;
  const g = { w: (fw + 4) * T, h: y1 + T, xL, xR, y0, y1, D, fw, fd, vertical };

  const exit = exitLayout(room.exit, g);
  const slots = [];
  if (vertical) {
    ['left', 'right'].forEach((wall) => {
      for (let u = 2.5 * T; u < fd * T - T; u += SLOT_GAP) {
        if (!exit?.blocks?.(wall, u)) slots.push({ wall, u });
      }
    });
  }
  if (!vertical || square) {
    for (let u = 2 * T; u < fw * T - T; u += 3 * T) {
      if (!exit?.blocks?.('back', u)) slots.push({ wall: 'back', u });
    }
  }

  let entrance;
  if (vertical) {
    const col = 2 + Math.floor(fw / 2);
    entrance = { mat: true, x0: col * T, x1: (col + 1) * T, ax: col * T + T / 2, ay: y1 - 10 };
  } else {
    const u0 = (fd * T) / 2 - 18;
    entrance = { wall: 'left', rect: { u0, u1: u0 + 36, v0: 0, v1: 48 }, ax: xL + 10, ay: y0 + u0 + 24 };
  }
  // Where the build menu cuts the room: the last 3 tiles before the exit end.
  const split = vertical ? { y: y0 + 3 * T } : { x: xR - 3 * T };
  return { g, slots, exit, entrance, split };
}

function exitLayout(kind, g) {
  const { xL, xR, y0, fw, fd, vertical } = g;
  const W = fw * T;
  const L = fd * T;
  // Stairs sit in the corner at the exit end: top-left for vertical rooms, top-right for horizontal.
  const stairs = (key, depth) => {
    const x0 = vertical ? xL : xR - 60;
    const blocks = vertical ? (w, u) => (w === 'left' || w === 'back') && u < 110 : (w, u) => w === 'back' && u > W - 110;
    return {
      kind,
      sprite: { key, x: x0, y: key === 'stairs_up' ? y0 + 64 - 128 : y0, flip: !vertical },
      block: { x0, y0, x1: x0 + 60, y1: y0 + depth },
      ax: x0 + 30,
      ay: y0 + depth + 14,
      blocks,
    };
  };
  switch (kind) {
    case 'door-back': {
      const u0 = vertical ? W / 2 - 18 : W - 60;
      const blocks = vertical ? (w, u) => w === 'back' && Math.abs(u - (u0 + 18)) < 52 : (w, u) => w === 'back' && u > u0 - 34;
      return { kind, wall: 'back', rect: { u0, u1: u0 + 36, v0: 0, v1: 48 }, ax: xL + u0 + 18, ay: y0 + 12, blocks };
    }
    case 'door-left':
    case 'door-right': {
      const wall = kind === 'door-left' ? 'left' : 'right';
      return { kind, wall, rect: { u0: 20, u1: 56, v0: 0, v1: 48 }, ax: wall === 'left' ? xL + 10 : xR - 10, ay: y0 + 44, blocks: (w, u) => w === wall && u < 110 };
    }
    case 'door-end': {
      const u0 = L / 2 - 18;
      return { kind, wall: 'right', rect: { u0, u1: u0 + 36, v0: 0, v1: 48 }, ax: xR - 10, ay: y0 + u0 + 24 };
    }
    case 'stairs-up':
      return stairs('stairs_up', 64);
    case 'stairs-down':
      return stairs('stairs_down', 78);
    default:
      return null;
  }
}

// What's in each wall slot: 'painting', 'empty' (outline), 'plain' (no outline,
// still interactable) or 'door'. Unchanged slots default to every other slot
// holding the next painting from the pool, continuing room by room.
export function slotStates(rooms, index) {
  let base = 0;
  for (let i = 0; i < index; i++) base += Math.ceil(layout(rooms[i]).slots.length / 2);
  const saved = load(SLOTS_KEY, {})[index] || {};
  return layout(rooms[index]).slots.map((s, i) => {
    const o = saved[`${s.wall}:${s.u}`];
    if (o) return { ...s, kind: o.kind, painting: o.kind === 'painting' ? PAINTINGS.find((p) => p.id === o.id) : null };
    if (i % 2 === 0) return { ...s, kind: 'painting', painting: PAINTINGS[(base + i / 2) % PAINTINGS.length] };
    return { ...s, kind: 'empty', painting: null };
  });
}

export function setSlot(index, slot, value) {
  const all = load(SLOTS_KEY, {});
  save(SLOTS_KEY, { ...all, [index]: { ...(all[index] || {}), [`${slot.wall}:${slot.u}`]: value } });
}

// Paintings hung in a room, with their wall position.
export function paintingsFor(rooms, index) {
  return slotStates(rooms, index)
    .filter((s) => s.kind === 'painting' && s.painting)
    .map((s) => ({ ...s.painting, wall: s.wall, u: s.u }));
}

// Where each painting hangs across the whole museum: id -> room index.
export function hungAnywhere(rooms) {
  const where = new Map();
  rooms.forEach((_, i) => paintingsFor(rooms, i).forEach((p) => where.set(p.id, i)));
  return where;
}

// Painting size on the wall, in wall space (u along the wall, v up the wall).
export const ART_V0 = 30;
export const ART_V1 = 54;
const FRAME = 4;

export function placeArt(p) {
  const h = ART_V1 - ART_V0;
  const w = Math.round(h * p.ratio);
  const u0 = Math.round(p.u - w / 2);
  const art = { u0, u1: u0 + w, v0: ART_V0, v1: ART_V1 };
  const frame = { u0: art.u0 - FRAME, u1: art.u1 + FRAME, v0: art.v0 - FRAME, v1: art.v1 + FRAME };
  return { ...p, art, frame };
}

// Everything drawn into the wall texture: frames, empty outlines, doors.
// arches: { exit, entrance } — draw those doorways as open archways.
export function wallItems(L, hung, states, arches = {}) {
  const items = { left: [], right: [], back: [] };
  if (L.exit?.rect) items[L.exit.wall].push({ door: true, arch: !!arches.exit, rect: L.exit.rect });
  if (L.entrance.rect) items[L.entrance.wall].push({ door: true, arch: !!arches.entrance, rect: L.entrance.rect });
  hung.forEach((p) => items[p.wall].push({ rect: p.frame }));
  states.forEach((s) => {
    if (s.kind === 'empty') items[s.wall].push({ empty: true, rect: { u0: s.u - 14, u1: s.u + 14, v0: ART_V0 - 2, v1: ART_V1 + 2 } });
    if (s.kind === 'door') items[s.wall].push({ door: true, rect: { u0: s.u - 18, u1: s.u + 18, v0: 0, v1: 48 } });
  });
  return items;
}

// Plants stand on the floor between each pair of neighboring painting slots.
export function plantSpots(L) {
  const { g } = L;
  const spots = [];
  ['left', 'right', 'back'].forEach((wall) => {
    const us = L.slots.filter((s) => s.wall === wall).map((s) => s.u).sort((a, b) => a - b);
    for (let i = 1; i < us.length; i++) {
      const u = (us[i - 1] + us[i]) / 2;
      if (wall === 'back') spots.push({ x: g.xL + u, y: g.y0 + 18 });
      else spots.push({ x: wall === 'left' ? g.xL + 12 : g.xR - 12, y: g.y0 + u + 8 });
    }
  });
  return spots;
}

// The carpet runner covers the middle of the floor, one tile in from each edge.
export function carpetRect(L) {
  const { g } = L;
  if (g.vertical) return { x: g.xL + T, y: g.y0 + T, w: g.xR - g.xL - 2 * T, h: g.y1 - g.y0 - 2 * T, alongY: true };
  return { x: g.xL + T, y: g.y0 + T, w: g.xR - g.xL - 2 * T, h: g.y1 - g.y0 - 2 * T, alongY: false };
}
