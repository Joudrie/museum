// The halls: themed room presets from content/halls/halls.json.
import data from '../../content/halls/halls.json';
export { applyHall, undoHall } from './apply.js';
export { validateHall, planItems, hallEntries } from './preset.js';

export const HALLS = data.halls;
export const hall = (id) => HALLS.find((h) => h.id === id);
