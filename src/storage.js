// Saving to the browser (localStorage), safe against broken or missing data.

// A save that can't be read is kept once under `curation.bak.<key>` before anything writes over it,
// so a person (or a later fix) can still get it back.
function keepBroken(key) {
  try {
    const bak = `curation.bak.${key}`;
    if (!key.startsWith('curation.bak.') && localStorage.getItem(bak) === null) localStorage.setItem(bak, localStorage.getItem(key));
  } catch {
    // nothing to keep it in
  }
}

export function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    if (v === null || v === undefined) return fallback;
    // a value of the wrong shape (from a broken save) falls back too
    if (fallback !== null && fallback !== undefined && (typeof v !== typeof fallback || Array.isArray(v) !== Array.isArray(fallback))) {
      keepBroken(key);
      return fallback;
    }
    return v;
  } catch {
    keepBroken(key);
    return fallback;
  }
}

// Something that wants to know about every save (src/measure/derive.js turns them into events).
// `fn(key, value, before)`: before is the old raw string, or null if the key was new.
const listeners = [];
export const onSave = (fn) => listeners.push(fn);

export function save(key, value) {
  let before = null;
  try {
    if (listeners.length) before = localStorage.getItem(key);
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; changes last until reload
  }
  for (const fn of listeners) {
    try {
      fn(key, value, before);
    } catch {
      // a listener never breaks a save
    }
  }
}
