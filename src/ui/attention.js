// How many popups are on screen right now. The game shows at most two at once: a new one that would
// make three is dropped, not queued (a queue makes you sit through them one by one). The rank-up and
// anything you opened yourself (menus, talk) are not counted and never dropped.
const POPUPS = ['#toast:not(.hidden)', '.ui-tip', '#prog-card:not(.hidden)', '#prog-skill:not(.hidden)', '#prog-pill.on', '#prog-rank:not(.hidden)'];
export const MAX_POPUPS = 2;
export function popupsShown(except) {
  if (typeof document === 'undefined') return 0;
  return POPUPS.filter((q) => q !== except && document.querySelector(q)).length;
}
/** Room for one more popup (besides `except`, the one asking, if it is already up)? */
export const roomFor = (except) => popupsShown(except) < MAX_POPUPS;
