// Apply a hall preset to a built room. Writes the room's decor, floor items
// and (if the hall names eras) its wall paintings, and hands back what it
// replaced so the caller can undo. The entrance, main hall and other fixed
// rooms are never touched.
import { load, save } from '../storage.js';
import { layout, loadRooms, isFixed, setSlot, slotStates } from '../rooms.js';
import { loadItems, saveItems } from '../items.js';
import { planItems, decorFor, wallPaintings, validateHall } from './preset.js';

const DECOR_KEY = 'curation.roomDecor';

export function applyHall(index, hall) {
  const rooms = loadRooms();
  const room = rooms[index];
  if (!room || isFixed(room)) return { ok: false, why: 'This room keeps its own look.' };
  const bad = validateHall(hall);
  if (bad.length) return { ok: false, why: bad[0] };

  const L = layout(room);
  const before = { decor: load(DECOR_KEY, {})[index], items: loadItems(index), slots: slotStates(rooms, index).map(({ wall, u, kind, painting }) => ({ wall, u, kind, id: painting?.id })) };

  save(DECOR_KEY, { ...load(DECOR_KEY, {}), [index]: decorFor(hall) });
  const { items, skipped } = planItems(hall, { fw: L.g.fw, fd: L.g.fd, vertical: L.g.vertical });
  saveItems(index, items);
  const spots = L.slots;
  wallPaintings(hall, spots.length).forEach((id, i) => setSlot(index, spots[i], { kind: 'painting', id }));
  return { ok: true, placed: items.length, skipped, before };
}

/** Put a room back as applyHall found it. */
export function undoHall(index, before) {
  const d = load(DECOR_KEY, {});
  if (before.decor === undefined) delete d[index];
  else d[index] = before.decor;
  save(DECOR_KEY, d);
  saveItems(index, before.items);
  before.slots.forEach((s) => setSlot(index, s, s.kind === 'painting' ? { kind: 'painting', id: s.id } : { kind: s.kind }));
}
