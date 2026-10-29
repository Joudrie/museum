// A one-time tip bubble pointing at a button. Each tip shows once (remembered in curation.hints),
// never while a panel is open or someone is talking, and Settings → Play → Tips turns them all off.
import { load, save } from '../storage.js';
import { settings } from '../settings.js';

const KEY = 'curation.hints';
export const hinted = (id) => !!load(KEY, {})[id];
const mark = (id) => save(KEY, { ...load(KEY, {}), [id]: Date.now() });

const calm = () => !document.querySelector('.overlay:not(.hidden), #viewer:not(.hidden), #talk:not(.hidden), #chat:not(.hidden), #ask:not(.hidden), #dig:not(.hidden)');
const visible = (e) => {
  const r = e?.getBoundingClientRect();
  return !!r && r.width > 0 && r.height > 0 && getComputedStyle(e).display !== 'none';
};

let open = null;
export function closeHint() {
  open?.remove();
  open = null;
}

/** Shows the tip once the screen is calm (tries again for about 30 s). Returns false if it won't show. */
export function hint(id, text, anchor, { ms = 8000, tries = 8, side = 'below' } = {}) {
  if (hinted(id) || settings().tips === false) return false;
  const go = (left) => {
    const a = typeof anchor === 'string' ? document.querySelector(anchor) : anchor;
    if (hinted(id) || !a || !visible(a)) return;
    if (!calm() || open) return left > 0 && setTimeout(() => go(left - 1), 4000);
    mark(id);
    const r = a.getBoundingClientRect();
    const tip = document.createElement('div');
    tip.className = 'ui-tip';
    tip.setAttribute('role', 'status');
    tip.textContent = text;
    document.body.appendChild(tip);
    const w = Math.min(230, innerWidth - 24);
    tip.style.width = `${w}px`;
    tip.dataset.side = side;
    if (side === 'right') {
      // beside a button in the left column, so it never covers the buttons under it
      const h = tip.offsetHeight;
      tip.style.left = `${r.right + 12}px`;
      tip.style.top = `${Math.max(8, r.top + r.height / 2 - h / 2)}px`;
      tip.style.setProperty('--arrow', `${Math.min(h - 14, Math.max(14, h / 2))}px`);
    } else {
      const mid = r.left + r.width / 2;
      const x = Math.max(12, Math.min(innerWidth - w - 12, mid - w / 2));
      tip.style.left = `${x}px`;
      tip.style.top = `${r.bottom + 12}px`;
      tip.style.setProperty('--arrow', `${Math.max(14, Math.min(w - 14, mid - x))}px`);
    }
    open = tip;
    const off = () => {
      if (open === tip) closeHint();
    };
    const watch = setInterval(() => {
      if (open !== tip) clearInterval(watch);
      else if (!calm()) off(); // a panel opened over it: put the tip away
    }, 400);
    document.addEventListener('pointerdown', off, { once: true, capture: true }); // any touch puts it away; the touch still works
    a.addEventListener('click', off, { once: true });
    setTimeout(off, ms);
  };
  setTimeout(() => go(tries), 1200);
  return true;
}
