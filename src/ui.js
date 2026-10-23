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

// A big moment: a card in the middle of the screen and a burst of confetti.
const party = document.getElementById('celebrate');
let partyTimer = null;
export function celebrate(title, sub = '') {
  party.querySelector('.celebrate-title').textContent = title;
  party.querySelector('.celebrate-sub').textContent = sub;
  const card = party.querySelector('.celebrate-card');
  party.querySelectorAll('.confetti').forEach((c) => c.remove());
  card.style.animation = 'none';
  void card.offsetWidth; // restart the animation
  card.style.animation = '';
  const colors = ['#f2d36b', '#e0405a', '#6fd07a', '#5aa8e0', '#f08a3a', '#fff4d0'];
  for (let i = 0; i < 46; i++) {
    const c = document.createElement('i');
    c.className = 'confetti';
    const a = Math.random() * Math.PI * 2;
    const d = 120 + Math.random() * 220;
    c.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d + 160}px;--rot:${Math.random() * 720 - 360}deg;background:${colors[i % colors.length]};animation-delay:${Math.random() * 0.12}s`;
    party.appendChild(c);
  }
  party.classList.remove('hidden');
  haptic(30);
  clearTimeout(partyTimer);
  partyTimer = setTimeout(() => party.classList.add('hidden'), 2500);
}
