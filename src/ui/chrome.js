// Upgrades the older menus' chrome to the design system without touching their code:
// every close / cancel button gets the one standard look and the pixel X icon.
import { uiIcon } from './icons.js';

function upgrade(root) {
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
