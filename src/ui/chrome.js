// Upgrades the older menus' chrome to the design system without touching their code:
// every close / cancel button gets the one standard look and the pixel X icon.
import { uiIcon } from './icons.js';

function upgrade(root) {
  addGrips(root);
  root.querySelectorAll?.('button').forEach((b) => {
    if (b.classList.contains('ui-close')) return;
    const label = b.getAttribute('aria-label') || '';
    const named = [...b.classList].some((c) => /-close$|-cancel$/.test(c));
    if (!named && !/^(Close|Cancel)$/.test(label)) return;
    const text = b.textContent.trim();
    if (text && !/^[✕×xX]$/.test(text)) return; // a button with words ("Leave it") keeps its words
    if (b.classList.contains('viewer-change') || b.closest('.tool-item')) return;
    b.classList.remove('pixel-btn');
    b.classList.add('ui-btn', 'ui-close');
    b.innerHTML = uiIcon('close');
    if (!label) b.setAttribute('aria-label', 'Close');
  });
}

// ---- closing a panel the way a phone expects ----
// Tap the dimmed world, or swipe the sheet down by its handle. Only panels where nothing is lost (no half-typed text, no
// work in progress): the answer to a question (#ask), Customize (you are looking at the room) and the studio are left out.
const BACKDROP = '#journal, #settings, #income, #office, #staffmenu, #slotmenu, #displaymenu, #build';
const NO_SWIPE = '#ask, #studio';
const closeOf = (overlay) => overlay.querySelector('.ui-close, [class*="-close"], [class*="-cancel"]');

let downOnBackdrop = false;
document.addEventListener('pointerdown', (e) => (downOnBackdrop = !!e.target.classList?.contains('overlay')), true);
document.addEventListener('click', (e) => {
  const o = e.target;
  // a drag that started inside the sheet and ended outside it is not a tap on the backdrop
  if (!downOnBackdrop || !o.classList?.contains('overlay') || o.classList.contains('hidden') || !o.matches(BACKDROP)) return;
  closeOf(o)?.click();
});

// the grip: a strip over the sheet's handle bar; the sheet follows the finger and closes if let go low enough
function addGrips(root) {
  if (!root.nodeType) return; // (upgrade() is also handed a single button)
  const sheets = [...root.querySelectorAll('.overlay .sheet')];
  if (root.matches?.('.overlay .sheet')) sheets.push(root);
  sheets.forEach((sheet) => {
    if (sheet.closest(NO_SWIPE) || sheet.querySelector(':scope > .sheet-grip')) return;
    const g = document.createElement('i');
    g.className = 'sheet-grip';
    g.setAttribute('aria-hidden', 'true');
    sheet.prepend(g);
  });
}
let drag = null;
document.addEventListener('pointerdown', (e) => {
  const grip = e.target.closest?.('.sheet-grip');
  if (!grip) return;
  const sheet = grip.parentElement;
  drag = { sheet, y0: e.clientY, dy: 0, t0: performance.now() };
  grip.setPointerCapture?.(e.pointerId);
  sheet.style.transition = 'none';
});
document.addEventListener('pointermove', (e) => {
  if (!drag) return;
  drag.dy = Math.max(0, e.clientY - drag.y0);
  drag.sheet.style.transform = `translateY(${drag.dy}px)`;
});
const letGo = () => {
  if (!drag) return;
  const { sheet, dy, t0 } = drag;
  drag = null;
  const fast = dy > 30 && dy / Math.max(1, performance.now() - t0) > 0.5; // px per ms
  sheet.style.transition = '';
  sheet.style.transform = '';
  if (dy > 90 || fast) closeOf(sheet.closest('.overlay'))?.click();
};
document.addEventListener('pointerup', letGo);
document.addEventListener('pointercancel', letGo);

// ---- focus follows the panel: opening moves focus onto its close button, closing gives it back (keyboard and screen readers) ----
const opener = new WeakMap();
new MutationObserver((muts) => {
  for (const m of muts) {
    const o = m.target;
    if (!o.classList?.contains('overlay')) continue;
    const was = m.oldValue?.includes('hidden');
    const now = o.classList.contains('hidden');
    if (was && !now) {
      opener.set(o, document.activeElement);
      requestAnimationFrame(() => closeOf(o)?.focus?.({ preventScroll: true }));
    } else if (!was && now) {
      const back = opener.get(o);
      opener.delete(o);
      if (back && document.contains(back) && o.contains(document.activeElement)) back.focus?.({ preventScroll: true });
    }
  }
}).observe(document.body, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });

// Escape closes the panel on top (keyboards, tablets with a keyboard, screen readers)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented || e.target?.matches?.('input, textarea, select')) return;
  if (document.querySelector('#viewer:not(.hidden)')) return; // the viewer closes itself first
  const open = [...document.querySelectorAll('.overlay:not(.hidden), #toolkit:not(.hidden)')].pop();
  open?.querySelector('.ui-close, [class*="-close"], [class*="-cancel"], .toolkit-done')?.click();
});

function init() {
  upgrade(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach((n) => n.nodeType === 1 && (n.matches?.('button') ? upgrade({ querySelectorAll: () => [n] }) : upgrade(n)));
  }).observe(document.body, { childList: true, subtree: true });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  else setTimeout(init, 0);
}
