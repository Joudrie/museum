// Lets the game's data modules load in plain Node: an in-memory localStorage and a
// do-nothing window/document. Nothing here is used by the game itself.
const mem = new Map();
globalThis.localStorage ??= {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  clear: () => mem.clear(),
  key: (i) => [...mem.keys()][i] ?? null,
  get length() { return mem.size; },
};
const noop = () => {};
const el = () => new Proxy(function () {}, { get: (t, p) => (p === Symbol.toPrimitive ? () => '' : p === 'classList' ? { add: noop, remove: noop, contains: () => true, toggle: noop } : el()), apply: () => el() });
// location.search is writable so a model can pin the hour, weather or season the way the game's ?hour= links do
globalThis.location ??= { search: '', href: '', pathname: '/' };
globalThis.window ??= { addEventListener: noop, removeEventListener: noop, dispatchEvent: noop, matchMedia: () => ({ matches: false, addEventListener: noop }), location: globalThis.location, devicePixelRatio: 1 };
globalThis.document ??= el();
globalThis.Event ??= class { constructor(t) { this.type = t; } };
globalThis.navigator ??= { vibrate: noop };
globalThis.MutationObserver ??= class { observe() {} disconnect() {} };
globalThis.requestAnimationFrame ??= (f) => setTimeout(f, 16);
export const resetStorage = () => mem.clear();
export const storage = mem;
