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
  horizontal: ['stairs-up', 'door-back', 'door-end', 'stairs-down', 'none'],
};

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
  return [FIRST_ROOM, ...load(ROOMS_KEY, [])];
}

export function addRoom(room) {
  save(ROOMS_KEY, [...load(ROOMS_KEY, []), room]);
}

export function resetRooms() {
  save(ROOMS_KEY, []);
}

// Full layout for a room: geometry, painting slots, exit, entrance.
// Vertical rooms: enter at the bottom (doormat), the exit is at the top end.
// Horizontal rooms: enter through a door on the left end wall, the exit is at the right end.
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
      const blocks = vertical ? (w, u) => w === 'back' && u < u0 + 70 : (w, u) => w === 'back' && u > u0 - 34;
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

// Everything drawn into the wall texture: frames, empty slots, doors.
export function wallItems(L, hung) {
  const items = { left: [], right: [], back: [] };
  if (L.exit?.rect) items[L.exit.wall].push({ door: true, rect: L.exit.rect });
  if (L.entrance.rect) items[L.entrance.wall].push({ door: true, rect: L.entrance.rect });
  hung.forEach((p) => items[p.wall].push({ rect: p.frame }));
  L.slots.forEach((s) => {
    if (hung.some((p) => p.wall === s.wall && p.u === s.u)) return;
    items[s.wall].push({ empty: true, rect: { u0: s.u - 14, u1: s.u + 14, v0: ART_V0 - 2, v1: ART_V1 + 2 } });
  });
  return items;
}
