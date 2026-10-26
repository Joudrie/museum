// Room definitions. The museum is a chain: each room's exit leads to the
// next room, and an unbuilt exit opens the build menu.
import { T } from './art.js';
import { PAINTINGS } from './paintings.js';
import { load, save } from './storage.js';
import { PLANS, PLAN_ORDER, shapedLayout } from './shaped.js';

export const D = 2 * T; // wall height on screen
const SLOT_GAP = 4 * T;
const ROOMS_KEY = 'curation.rooms'; // (old) rooms after the first
const ROOM_LIST_KEY = 'curation.roomList'; // every room, including the first
// Per-room data stored by room index; moved along when rooms are reordered.
const PER_ROOM_KEYS = ['curation.roomDecor', 'curation.items', 'curation.slots', 'curation.piles', 'curation.dirt', 'curation.janitor', 'curation.love'];
const SLOTS_KEY = 'curation.slots'; // { [roomIndex]: { 'wall:u': { kind, id } } }

// Floor size in tiles. Vertical rooms are 5 wide; horizontal rooms are 5 deep;
// big halls are square.
export const SIZES = {
  vertical: { short: 8, medium: 12, long: 18 },
  horizontal: { short: 9, medium: 13, long: 18 },
  square: { short: 7, medium: 9, long: 12 },
  entry: { fixed: 8 },
  main: { fixed: 15 },
  atrium: { fixed: 17 },
  shaped: { fixed: 0 },
  break: { fixed: 6 },
};
// The first three rooms are fixed: the entrance (ticket desk), the main hall
// and the atrium behind it. The rooms you build follow on after them.
export const FIXED = ['entry', 'main', 'atrium', 'shaped', 'break'];
export const isFixed = (room) => FIXED.includes(room.orient);

export const ORIENT_LABELS = { vertical: 'Vertical', horizontal: 'Horizontal', square: 'Big hall', entry: 'Entrance', main: 'Main hall', atrium: 'Atrium', shaped: 'Shaped room', break: 'Break room' };
export const SIZE_LABELS = {
  vertical: { short: 'Short', medium: 'Medium', long: 'Long' },
  horizontal: { short: 'Short', medium: 'Medium', long: 'Long' },
  square: { short: 'Small', medium: 'Medium', long: 'Large' },
  entry: { fixed: 'Fixed' },
  main: { fixed: 'Fixed' },
  atrium: { fixed: 'Fixed' },
  shaped: { fixed: 'Fixed' },
  break: { fixed: 'Fixed' },
};

export const EXITS = {
  vertical: ['door-back', 'door-left', 'door-right', 'stairs-up', 'stairs-down', 'none'],
  horizontal: ['stairs-up', 'door-back', 'door-end', 'stairs-down', 'none'],
  square: ['door-back', 'door-left', 'door-right', 'stairs-up', 'stairs-down', 'none'],
};

export function roomName(room, i) {
  return room.name || (room.orient === 'shaped' && PLANS[room.plan]?.name) || { entry: 'Entrance', main: 'Main hall', atrium: 'Atrium', break: 'Break room' }[room.orient] || `Room ${i + 1}`;
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

const ENTRY_ROOM = { orient: 'entry', size: 'fixed', exit: 'door-back' };
const MAIN_ROOM = { orient: 'main', size: 'fixed', exit: 'door-back', arch: true, locked: true };
export const MAIN_HALL_PRICE = 500;
// The atrium opens off the main hall's middle arch (a paid unlock too).
const ATRIUM_ROOM = { orient: 'atrium', size: 'fixed', exit: 'door-back', arch: true, locked: true };
export const ATRIUM_PRICE = 2000;
// Empty shaped rooms in a row behind the atrium (see shaped.js), open from the start.
const SHAPED_ROOMS = PLAN_ORDER.map((plan) => ({ orient: 'shaped', size: 'fixed', plan, exit: 'door-back', arch: true }));
const START = [ENTRY_ROOM, MAIN_ROOM, ATRIUM_ROOM, ...SHAPED_ROOMS];
// The staff break room sits off the main hall's hallway (left door), outside
// the chain of rooms. It's stored under the room key 'break'.
export const BREAK = 'break';
export const BREAK_ROOM = { orient: 'break', size: 'fixed', exit: 'none' };
export const roomAt = (rooms, i) => (i === BREAK ? BREAK_ROOM : rooms[i]);
const ITEMS_KEY = 'curation.items';

export function loadRooms() {
  let saved = load(ROOM_LIST_KEY, null);
  if (!Array.isArray(saved) || !saved.length) saved = null;
  else saved = saved.filter((r) => r && SIZES[r.orient]); // drop anything a broken save left behind
  if (saved?.[0]?.orient === 'entry') return withShaped(withAtrium(saved));
  const old = load(ROOMS_KEY, []);
  if (!saved && !old.length) {
    // A brand-new museum: the entrance, and the (locked) main hall and atrium.
    saveRooms(START);
    seedEntry();
    return START;
  }
  const list = saved || [{ orient: 'vertical', size: 'medium', exit: 'door-back' }, ...old];
  // Older saves: the fixed entrance, main hall and atrium go in front;
  // existing rooms (and their decor, items, wall spots) move back.
  shiftRoomData(0, START.length);
  const next = [...START, ...list];
  saveRooms(next);
  seedEntry();
  return next;
}

// Saves from before the atrium: it goes in after the main hall, and the rooms
// you built (with their decor, items and wall spots) move back one place.
function withAtrium(list) {
  if (list[2]?.orient === 'atrium') return list;
  shiftRoomData(2, 1);
  const next = [...list.slice(0, 2), ATRIUM_ROOM, ...list.slice(2)];
  saveRooms(next);
  return next;
}

// Saves from before the shaped rooms: they go in after the atrium, and the
// rooms you built move back behind them.
function withShaped(list) {
  if (list[3]?.orient === 'shaped') return list;
  shiftRoomData(3, SHAPED_ROOMS.length);
  const next = [...list.slice(0, 3), ...SHAPED_ROOMS, ...list.slice(3)];
  saveRooms(next);
  return next;
}

// Move per-room data for rooms from index `from` on back by `by` places.
function shiftRoomData(from, by) {
  PER_ROOM_KEYS.forEach((key) => {
    const all = load(key, {});
    const moved = {};
    Object.entries(all).forEach(([i, v]) => (moved[/^\d+$/.test(i) && Number(i) >= from ? Number(i) + by : i] = v));
    save(key, moved);
  });
}

// The entrance starts with a potted tree in each front corner.
function seedEntry(force) {
  const items = load(ITEMS_KEY, {});
  if (force || !items[0]) save(ITEMS_KEY, { ...items, 0: [{ type: 'tree', c: 0, r: 6, rot: 0 }, { type: 'tree', c: 5, r: 6, rot: 0 }] });
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
  if (isFixed(list[i]) || isFixed(list[j])) return; // the entrance and main hall stay put
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
  saveRooms(START);
  const slots = load(SLOTS_KEY, {});
  save(SLOTS_KEY, { 0: slots[0] || {}, 1: slots[1] || {} });
}

export { seedEntry };

// Full layout for a room: geometry, painting slots, exit, entrance.
// Vertical rooms: enter at the bottom (doormat), the exit is at the top end.
// Horizontal rooms: enter through a door on the left end wall, the exit is at the right end.
export function layout(room) {
  if (room.orient === 'main') return mainLayout();
  if (room.orient === 'entry') return entryLayout();
  if (room.orient === 'break') return breakLayout();
  if (room.orient === 'atrium') return atriumLayout();
  if (room.orient === 'shaped') return shapedLayout(room.plan);
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
  const g = { w: (fw + 4) * T, h: y1 + T, xL, xR, y0, y1, D, fw, fd, vertical, refs: boxRefs(xL, xR, y0) };

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

// Where each wall sits on screen. A 'back' face is seen straight on with its
// base at y; a 'left'/'right' face leans at 45° from x, with u measured from y.
function boxRefs(xL, xR, y0) {
  return { back: { face: 'back', x: xL, y: y0 }, left: { face: 'left', x: xL, y: y0 }, right: { face: 'right', x: xR, y: y0 } };
}

// The entrance: a small hall with the ticket desk, two paintings per side wall
// and double doors at the back into the main hall. You come in at the bottom.
function entryLayout() {
  const fw = 6;
  const fd = 8;
  const xL = 2 * T;
  const xR = xL + fw * T;
  const y0 = T + D;
  const y1 = y0 + fd * T;
  const g = { w: (fw + 4) * T, h: y1 + T, xL, xR, y0, y1, D, fw, fd, vertical: true, refs: boxRefs(xL, xR, y0) };
  const u0 = (fw * T) / 2 - 24;
  const exit = { kind: 'door-back', wall: 'back', rect: { u0, u1: u0 + 48, v0: 0, v1: 50 }, ax: xL + u0 + 24, ay: y0 + 12 };
  const slots = [];
  ['left', 'right'].forEach((wall) => [1.6 * T, 4 * T].forEach((u) => slots.push({ wall, u })));
  const entrance = { mat: true, x0: xL + 2 * T, x1: xL + 4 * T, ax: xL + 3 * T, ay: y1 - 10 };
  return { g, slots, exit, entrance, split: { y: y0 + 3 * T }, desk: { c: 4, r: 4 } };
}

// The break room: a small staff room, entered from the bottom. Lockers and a
// donut table come with it; the staff board on the wall is where you hire.
function breakLayout() {
  const fw = 7;
  const fd = 6;
  const xL = 2 * T;
  const xR = xL + fw * T;
  const y0 = T + D;
  const y1 = y0 + fd * T;
  const g = { w: (fw + 4) * T, h: y1 + T, xL, xR, y0, y1, D, fw, fd, vertical: true, refs: boxRefs(xL, xR, y0) };
  const entrance = { mat: true, x0: xL + 3 * T, x1: xL + 4 * T, ax: xL + 3.5 * T, ay: y1 - 10 };
  return { g, slots: [], exit: null, entrance, split: { y: y0 + 3 * T }, board: { c: 5, r: 0 } };
}

// The main hall, from the sketch: a short hallway (break room door on the left,
// office door on the right) opens into one wide, open room. Its ground floor
// has paintings and arched doors along a back wall, with stairs on either side
// of the middle arch up to a balcony that runs the full width and holds four
// big paintings. Rows from the top: balcony, the balcony's front wall, ground
// floor, then the hallway.
export const HALL = { fw: 19, balcony: 3, ground: 6, hallLen: 5, hallW: 5 };
function mainLayout() {
  const { fw, balcony, ground, hallLen, hallW } = HALL;
  const xL = 2 * T;
  const xR = xL + fw * T;
  const y0 = T + D; // balcony back wall
  const yb = y0 + balcony * T + D; // foot of the balcony's front wall
  const yf = yb + ground * T; // front edge of the hall
  const yh = yf + hallLen * T; // bottom of the hallway
  const hx0 = xL + ((fw - hallW) / 2) * T;
  const hx1 = hx0 + hallW * T;
  const fd = (yh - y0) / T;
  // The stairs stand out 2 tiles from the wall; columns stand 1 tile out, at the
  // ends of each stretch of wall, holding up the balcony's railing.
  const stairRun = 2 * T;
  const stairs = [6 * T, 11 * T].map((u) => ({ x0: xL + u, x1: xL + u + 2 * T, foot: yb + stairRun }));
  const columns = [0.55, 5.45, 8.55, 10.45, 13.55, 18.45].map((t) => ({ x: xL + t * T, foot: yb + T }));
  const refs = {
    back: { face: 'back', x: xL, y: y0 },
    left: { face: 'left', x: xL, y: y0 },
    right: { face: 'right', x: xR, y: y0 },
    band: { face: 'back', x: xL, y: yb },
    hl: { face: 'left', x: hx0, y: yf },
    hr: { face: 'right', x: hx1, y: yf },
  };
  const g = { w: (fw + 4) * T, h: yh + T, xL, xR, y0, y1: yh, yb, yf, yh, hx0, hx1, D, fw, fd, vertical: true, main: true, stairs, stairRun, columns, refs };
  const slots = [
    ...[0.2, 0.4, 0.6, 0.8].map((k) => ({ wall: 'back', u: Math.round(fw * T * k), big: true })),
    ...[1.5, 4.7, 14.3, 17.5].map((t) => ({ wall: 'band', u: t * T })),
    { wall: 'hl', u: 2.6 * T }, // low enough that the frame stays below the hall's edge
    { wall: 'hr', u: 2.6 * T },
  ];
  const arch = (t) => ({ u0: t * T - 22, u1: t * T + 22, v0: 0, v1: 52 });
  // The middle arch leads on to the rooms you build; the side arches are decoration.
  const exit = { kind: 'door-back', wall: 'band', rect: arch(9.5), ax: xL + 9.5 * T, ay: yb + 12 };
  const decorDoors = [
    { wall: 'band', arch: true, closed: true, rect: arch(3.1) },
    { wall: 'band', arch: true, closed: true, rect: arch(15.9) },
    { wall: 'hl', rect: { u0: 3.4 * T, u1: 3.4 * T + 36, v0: 0, v1: 48 }, label: 'Break room' },
    { wall: 'hr', rect: { u0: 3.4 * T, u1: 3.4 * T + 36, v0: 0, v1: 48 }, label: 'Office' },
  ];
  const entrance = { mat: true, x0: hx0 + 2 * T, x1: hx0 + 3 * T, ax: hx0 + 2.5 * T, ay: yh - 10 };
  // Tiles nothing can stand on: the balcony's front wall (except the stairs)
  // and the outside on either side of the hallway.
  const blockedTiles = [];
  for (let c = 0; c < fw; c++) {
    for (let r = 0; r < fd; r++) {
      const x = xL + c * T + T / 2;
      const y = y0 + r * T + T / 2;
      const onStairs = stairs.some((st) => x > st.x0 && x < st.x1);
      const wall = y > yb - D && y < yb && !onStairs;
      const stairFoot = onStairs && y > yb - D && y < yb + stairRun; // nothing can go on the stairs
      const column = y > yb && y < yb + T && columns.some((col) => Math.abs(x - col.x) < T / 2);
      if (wall || stairFoot || column || (y > yf && (x < hx0 || x > hx1))) blockedTiles.push({ c, r });
    }
  }
  return { g, slots, exit, entrance, split: { y: y0 + 3 * T }, decorDoors, blockedTiles };
}

// The atrium, from the sketch: a big room you enter from the main hall's
// middle arch at the bottom. Two long staircases run along the front wall on
// either side of the way in, each climbing sideways from its bottom step (at
// the inner end, facing the middle of the room) up toward its side wall and
// the closed upper floor. The waterfall fountain stands in the upper third.
// The back wall: column, painting with a statue in front, column, the wide
// Science arch (on to the rooms you build), column, painting and statue,
// column. Archways halfway along the side walls lead to Archaeology (left)
// and the Statue hall (right), closed for now.
export const ATRIUM = { fw: 19, fd: 14 };
function atriumLayout() {
  const { fw, fd } = ATRIUM;
  const xL = 2 * T;
  const xR = xL + fw * T;
  const y0 = T + D;
  const y1 = y0 + fd * T;
  const W = fw * T;
  const columns = [1, 5, 14, 18].map((t) => ({ x: xL + t * T, foot: y0 + 10 }));
  const statues = [3, 16].map((t) => ({ x: xL + t * T, y: y0 + 22 }));
  const fountain = { x: xL + W / 2, y: y0 + 4.7 * T };
  // each flight: 7 tiles long, 3 deep; `up` is the way it climbs
  const run = 7 * T;
  const depth = 3 * T;
  const stairs = [
    { x0: xL, x1: xL + run, top: y1 - depth, foot: y1, up: 'left' },
    { x0: xR - run, x1: xR, top: y1 - depth, foot: y1, up: 'right' },
  ];
  const g = { w: (fw + 4) * T, h: y1 + T, xL, xR, y0, y1, D, fw, fd, vertical: true, atrium: true, columns, statues, fountain, stairs, refs: boxRefs(xL, xR, y0) };
  const slots = [3, 16].map((t) => ({ wall: 'back', u: t * T, big: true })); // big paintings behind the statues
  const arch = (u, half, v1) => ({ u0: u - half, u1: u + half, v0: 0, v1 });
  const exit = { kind: 'door-back', wall: 'back', rect: arch(W / 2, 44, 60), ax: xL + W / 2, ay: y0 + 12, label: 'Science' };
  const side = arch((fd * T) / 2 - T, 22, 52); // halfway along the wall, clear of the stairs
  const decorDoors = [
    { wall: 'left', arch: true, closed: true, rect: side, label: 'Archaeology' },
    { wall: 'right', arch: true, closed: true, rect: side, label: 'Statue hall' },
  ];
  const col = Math.floor(fw / 2);
  const entrance = { mat: true, x0: xL + col * T, x1: xL + (col + 1) * T, ax: xL + col * T + T / 2, ay: y1 - 10 };
  // Tiles nothing can stand on: the fountain, the stairs, the statues and columns.
  const blockedTiles = [];
  for (let c = 0; c < fw; c++)
    for (let r = 0; r < fd; r++) {
      const x = xL + c * T + T / 2;
      const y = y0 + r * T + T / 2;
      const inFountain = Math.hypot((x - fountain.x) / 80, (y - fountain.y) / 44) < 1;
      const onStairs = stairs.some((st) => x > st.x0 && x < st.x1 && y > st.top);
      const byWall = r === 0 && (columns.some((k) => Math.abs(x - k.x) < T / 2) || statues.some((k) => Math.abs(x - k.x) < T / 2));
      if (inFountain || onStairs || byWall) blockedTiles.push({ c, r });
    }
  return { g, slots, exit, entrance, split: { y: y0 + 3 * T }, decorDoors, blockedTiles, upstairs: stairs };
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
  if (index === BREAK) return [];
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
    .map((s) => ({ ...s.painting, wall: s.wall, u: s.u, big: s.big }));
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
  const v0 = p.big ? 14 : ART_V0; // the balcony's big paintings
  const h = ART_V1 - v0;
  const w = Math.round(h * p.ratio);
  const u0 = Math.round(p.u - w / 2);
  const art = { u0, u1: u0 + w, v0, v1: ART_V1 };
  const frame = { u0: art.u0 - FRAME, u1: art.u1 + FRAME, v0: art.v0 - FRAME, v1: art.v1 + FRAME };
  return { ...p, art, frame };
}

// Everything drawn into the wall texture: frames, empty outlines, doors.
// arches: { exit, entrance } — draw those doorways as open archways.
export function wallItems(L, hung, states, arches = {}) {
  const items = { left: [], right: [], back: [], band: [], hl: [], hr: [] };
  Object.keys(L.g.refs || {}).forEach((k) => (items[k] ||= []));
  (L.windows || []).forEach((w) => items[w.wall].push({ window: true, rect: w.rect }));
  (L.decorDoors || []).forEach((d) => items[d.wall].push({ door: true, arch: !!d.arch, closed: !!d.closed, rect: d.rect }));
  // An archway stays shut until the room behind it exists and is unlocked.
  if (L.exit?.rect) items[L.exit.wall].push({ door: true, arch: !!arches.exit, closed: !!arches.exitClosed, rect: L.exit.rect });
  if (L.entrance.rect) items[L.entrance.wall].push({ door: true, arch: !!arches.entrance, rect: L.entrance.rect });
  hung.forEach((p) => items[p.wall].push({ rect: p.frame }));
  states.forEach((s) => {
    if (s.kind === 'empty') items[s.wall].push({ empty: true, rect: { u0: s.u - 14, u1: s.u + 14, v0: (s.big ? 14 : ART_V0) - 2, v1: ART_V1 + 2 } });
    if (s.kind === 'door') items[s.wall].push({ door: true, rect: { u0: s.u - 18, u1: s.u + 18, v0: 0, v1: 48 } });
  });
  return items;
}

// Plants stand on the floor between each pair of neighboring painting slots.
export function plantSpots(L) {
  const { g } = L;
  const spots = [];
  if (g.main || g.atrium || g.shaped) return spots; // open plan: place plants with the toolkit
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
  if (g.main) return { x: g.hx0 + T, y: g.yb + T, w: g.hx1 - g.hx0 - 2 * T, h: g.yh - g.yb - 2 * T, alongY: true };
  if (g.shaped) {
    const b = g.bands[g.bands.length - 1]; // a runner up the front band
    return { x: b.x0 + T, y: b.top + T, w: b.x1 - b.x0 - 2 * T, h: b.bottom - b.top - 2 * T, alongY: true };
  }
  if (g.vertical) return { x: g.xL + T, y: g.y0 + T, w: g.xR - g.xL - 2 * T, h: g.y1 - g.y0 - 2 * T, alongY: true };
  return { x: g.xL + T, y: g.y0 + T, w: g.xR - g.xL - 2 * T, h: g.y1 - g.y0 - 2 * T, alongY: false };
}
