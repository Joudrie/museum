// Feel: a soft click and a tiny buzz on every button, a whoosh when a panel
// opens. Panels themselves slide in with CSS (see .overlay / .sheet).
import { sfx } from './music.js';
import { settings } from './settings.js';

export function haptic(ms = 8) {
  if (!settings().haptics || !navigator.vibrate) return;
  try {
    navigator.vibrate(ms);
  } catch {
    // not allowed here
  }
}

document.addEventListener(
  'click',
  (e) => {
    const b = e.target.closest('button, .dot, input[type=range]');
    if (!b || b.disabled || b.id === 'interact') return; // (interacting makes its own sounds)
    const closing = b.matches('.decor-close, .slot-close, .office-close, .staff-close, .build-cancel, .ask-no, .viewer-close, .toolkit-done, .settings-close, .income-close');
    sfx(closing ? 'close' : 'tap');
    haptic(closing ? 4 : 8);
  },
  true,
);

const watch = new MutationObserver((changes) =>
  changes.forEach((m) => {
    const t = m.target;
    if (!t.classList.contains('hidden') && m.oldValue?.includes('hidden')) sfx('open');
  }),
);
document.querySelectorAll('.overlay, #toolkit').forEach((o) => watch.observe(o, { attributes: true, attributeFilter: ['class'], attributeOldValue: true }));
