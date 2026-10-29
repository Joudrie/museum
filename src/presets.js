// Room presets: save how a room is set up (its decor and placed items) under a
// name ("Winter", "Halloween") and load it into any room later. Paintings hung
// on the walls stay where they are.
import { load, save } from './storage.js';
import { ITEMS, loadItems } from './items.js';
import { sellPrice } from './wallet.js';

const PRESETS_KEY = 'curation.roomPresets'; // [{ id, name, decor, items }]
const DECOR_KEY = 'curation.roomDecor';
const ITEMS_KEY = 'curation.items';
const MAX = 20;

export const listPresets = () => {
  const l = load(PRESETS_KEY, []);
  return Array.isArray(l) ? l.filter((p) => p && p.id && p.name) : [];
};

export function savePreset(name, roomIndex) {
  const list = listPresets();
  const nm = (name || '').trim().slice(0, 24) || `Layout ${list.length + 1}`;
  const entry = {
    id: `p${Date.now().toString(36)}`,
    name: nm,
    decor: JSON.parse(JSON.stringify(load(DECOR_KEY, {})[roomIndex] || {})),
    items: JSON.parse(JSON.stringify(load(ITEMS_KEY, {})[roomIndex] || [])),
  };
  const same = list.findIndex((p) => p.name === nm); // saving under a name again replaces it
  if (same >= 0) list[same] = entry;
  else list.push(entry);
  save(PRESETS_KEY, list.slice(-MAX));
  return entry;
}

// Copy a preset into a room. Items that would not fit a smaller room are
// kept as saved; the room scene drops what has no tile to stand on.
export function applyPreset(id, roomIndex) {
  const p = listPresets().find((q) => q.id === id);
  if (!p) return false;
  save(DECOR_KEY, { ...load(DECOR_KEY, {}), [roomIndex]: JSON.parse(JSON.stringify(p.decor)) });
  save(ITEMS_KEY, { ...load(ITEMS_KEY, {}), [roomIndex]: JSON.parse(JSON.stringify(p.items)) });
  return true;
}

export function deletePreset(id) {
  save(PRESETS_KEY, listPresets().filter((p) => p.id !== id));
}

// Loading swaps this room's items for the preset's: what you have here is
// sold at the usual price and the preset's items are bought. Positive = you pay.
export function presetCost(id, roomIndex) {
  const p = listPresets().find((q) => q.id === id);
  if (!p) return 0;
  const buy = (p.items || []).reduce((n, it) => n + (ITEMS[it.type]?.price || 0), 0);
  const sell = loadItems(roomIndex).reduce((n, it) => n + sellPrice(it.type), 0);
  return buy - sell;
}
