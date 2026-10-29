// Feel: a soft click and a tiny buzz on every button, a whoosh when a panel
// opens. Panels themselves slide in with CSS (see .overlay / .sheet).
import { sfx } from './music.js';
import { settings } from './settings.js';
import { uiIcon } from './ui/icons.js';

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
// Moments that arrive together (a goal and the set it finishes) wait their turn instead of overwriting each other.
const party = document.getElementById('celebrate');
const waiting = [];
let partyTimer = null;
let showing = false;
const colors = ['#f2d36b', '#e0405a', '#6fd07a', '#5aa8e0', '#f08a3a', '#fff4d0'];

// "+1,200 gold" counts up from 0 (skipped when motion is reduced); the final text is always what was asked for.
let countFrame = 0;
function countUp(node, title) {
  cancelAnimationFrame(countFrame);
  const m = /^\+([\d,]+)(.*)$/.exec(title);
  const reduce = document.documentElement.dataset.motion === 'reduce' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!m || reduce) return;
  const to = Number(m[1].replace(/,/g, ''));
  if (!(to >= 20)) return;
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / 650);
    const n = Math.round(to * (1 - (1 - k) ** 3)); // eases out
    node.textContent = `+${(k < 1 ? n : to).toLocaleString()}${m[2]}`;
    if (k < 1) countFrame = requestAnimationFrame(tick);
  };
  node.textContent = `+0${m[2]}`;
  countFrame = requestAnimationFrame(tick);
}

function showNext() {
  const it = waiting.shift();
  if (!it) {
    showing = false;
    party.classList.add('hidden');
    return;
  }
  showing = true;
  party.querySelector('.celebrate-icon').innerHTML = uiIcon(it.icon);
  const titleEl = party.querySelector('.celebrate-title');
  titleEl.textContent = it.title;
  countUp(titleEl, it.title);
  party.querySelector('.celebrate-sub').textContent = it.sub;
  party.querySelector('.celebrate-more').textContent = waiting.length ? `${waiting.length} more` : '';
  const card = party.querySelector('.celebrate-card');
  party.querySelectorAll('.confetti').forEach((c) => c.remove());
  card.style.animation = 'none';
  void card.offsetWidth; // restart the animation
  card.style.animation = '';
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
  partyTimer = setTimeout(showNext, 2500);
}

/** `icon` is a name from src/ui/icons.js (trophy, star, gift, coin, ...). */
export function celebrate(title, sub = '', icon = 'star') {
  waiting.push({ title, sub, icon });
  if (!showing) showNext();
  else party.querySelector('.celebrate-more').textContent = `${waiting.length} more`;
}
window.__celebrate = celebrate; // (for the UI screenshot tests)
