// Room definitions. The museum is a chain: each room's exit leads to the
// next room, and an unbuilt exit opens the build menu.
import { T } from './art.js';
import { PAINTINGS } from './paintings.js';
import { load, save } from './decor.js';

export const D = 2 * T; // wall height on screen
const SLOT_GAP = 4 * T;
const ROOMS_KEY = 'curation.rooms';

// Floor size in tiles. Vertical rooms are 5 wide; horizontal rooms are 5 deep.
export const SIZES = {
  vertical: { short: 8, medium: 12, long: 18 },
  horizontal: { short: 9, medium: 13, long: 18 },
};

export const EXITS = {
  vertical: ['door-back', 'door-left', 'door-right', 'stairs-up', 'stairs-down', 'none'],
  horizontal: ['door-back', 'door-end', 'stairs-up', 'stairs-down', 'none'],
};

export const EXIT_LABELS = {
  'door-back': 'Door on the far wall',
  'door-left': 'Door on the left wall',
  'door-right': 'Door on the right wall',
  'door-end': 'Door on the end wall',
  'stairs-up': 'Stairs up',
  'stairs-down': 'Stairs down',
  none: 'No exit',
};

const FIRST_ROOM = { orient: 'vertical', size: 'medium', exit: 'door-back' };

export function loadRooms() {
  return [FIRST_ROOM, ...load(ROOMS_KEY, [])];
}

export function addRoom(room) {
  save(ROOMS_KEY, [...load(ROOMS_KEY, []), room]);
}

export function resetRooms() {
  save(ROOMS_KEY, []);
}

// Full layout for a room: geometry, painting slots, exit, entrance.
export function layout(room) {
  const vertical = room.orient === 'vertical';
  const fw = vertical ? 5 : SIZES.horizontal[room.size];
  const fd = vertical ? SIZES.vertical[room.size] : 5;
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
  } else {
    for (let u = 2 * T; u < fw * T - T; u += 3 * T) {
      if (exit?.blocks?.('back', u)) continue;
      slots.push({ wall: 'back', u });
    }
  }
  // Entrance doormat on the front edge: centered, or at the right end of a horizontal room.
  const doorCol = vertical ? 2 + Math.floor(fw / 2) : 2 + fw - 2;
  const entrance = { x0: doorCol * T, x1: (doorCol + 1) * T, ax: doorCol * T + T / 2, ay: y1 - 10 };
  return { g, slots, exit, entrance };
}

function exitLayout(kind, g) {
  const { xL, xR, y0, fw, fd, vertical } = g;
  const W = fw * T;
  const L = fd * T;
  switch (kind) {
    case 'door-back': {
      const u0 = vertical ? W / 2 - 18 : 24;
      return { kind, wall: 'back', rect: { u0, u1: u0 + 36, v0: 0, v1: 48 }, ax: xL + u0 + 18, ay: y0 + 12, blocks: (w, u) => w === 'back' && u < u0 + 70 };
    }
    case 'door-left':
    case 'door-right': {
      const wall = kind === 'door-left' ? 'left' : 'right';
      return { kind, wall, rect: { u0: 20, u1: 56, v0: 0, v1: 48 }, ax: wall === 'left' ? xL + 10 : xR - 10, ay: y0 + 44, blocks: (w, u) => w === wall && u < 110 };
    }
    case 'door-end': {
      const u0 = L / 2 - 18;
      return { kind, wall: 'left', rect: { u0, u1: u0 + 36, v0: 0, v1: 48 }, ax: xL + 10, ay: y0 + u0 + 24 };
    }
    case 'stairs-up':
      return { kind, ax: xL + 30, ay: y0 + 80, block: { x0: xL, y0: y0, x1: xL + 60, y1: y0 + 64 }, blocks: (w, u) => (w === 'left' || w === 'back') && u < 110 };
    case 'stairs-down':
      return { kind, ax: xL + 30, ay: y0 + 92, block: { x0: xL, y0: y0, x1: xL + 60, y1: y0 + 78 }, blocks: (w, u) => (w === 'left' || w === 'back') && u < 110 };
    default:
      return null;
  }
}

// Assign paintings to every other slot, continuing through the pool room by room.
export function paintingsFor(rooms, index) {
  let next = 0;
  for (let i = 0; i < index; i++) next += Math.ceil(layout(rooms[i]).slots.length / 2);
  const { slots } = layout(rooms[index]);
  return slots.map((s, i) => (i % 2 === 0 ? { ...PAINTINGS[next++ % PAINTINGS.length], ...s } : null));
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

// Everything drawn into the wall texture: frames, empty slots, exit door.
export function wallItems(L, hung) {
  const items = { left: [], right: [], back: [] };
  if (L.exit?.rect) items[L.exit.wall].push({ door: true, rect: L.exit.rect });
  hung.forEach((p) => items[p.wall].push({ rect: p.frame }));
  L.slots.forEach((s) => {
    if (hung.some((p) => p.wall === s.wall && p.u === s.u)) return;
    items[s.wall].push({ empty: true, rect: { u0: s.u - 14, u1: s.u + 14, v0: ART_V0 - 2, v1: ART_V1 + 2 } });
  });
  return items;
}
