// Saving to the browser (localStorage), safe against broken or missing data.

export function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    if (v === null || v === undefined) return fallback;
    // a value of the wrong shape (from a broken save) falls back too
    if (fallback !== null && fallback !== undefined && (typeof v !== typeof fallback || Array.isArray(v) !== Array.isArray(fallback))) return fallback;
    return v;
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
