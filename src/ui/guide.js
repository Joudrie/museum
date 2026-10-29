// The live style guide (ui.html): every component in every state. Keep it in step with src/ui/ui.css.
import { uiIcon, uiIconNames } from './icons.js';

const sw = (name, v) => `<div class="sw"><i style="background:${v}"></i>${name}<br /><small>${v}</small></div>`;
const html = `
<section><h2 class="ui-label">Colour</h2>
  <div class="swatches">
    ${sw('bg', '#1d1714')}${sw('panel', '#2a211d')}${sw('panel-2', '#362a22')}${sw('raised', '#43342a')}
    ${sw('gold', '#c9a23f')}${sw('gold-hi', '#f2d36b')}${sw('line', '#5b4216')}${sw('ink', '#f4ead6')}
    ${sw('muted', '#b9a98f')}${sw('good', '#6fd07a')}${sw('danger', '#e0705c')}${sw('info', '#7ac8e0')}
  </div>
</section>
<section class="scale"><h2 class="ui-label">Type</h2>
  <p class="ui-title">Title 24 Pixelify Sans</p>
  <p style="font:700 var(--fs-num)/1 var(--ui-font);color:var(--ui-gold-hi)">12,345 gold · number 20</p>
  <p style="font:600 var(--fs-lead)/1.2 var(--ui-font)">Lead 17: the main line of a row</p>
  <p style="font:400 var(--fs-body)/1.3 var(--ui-font)">Body 15: instructions and descriptions in the interface.</p>
  <p style="font:400 var(--fs-small)/1.3 var(--ui-font);color:var(--ui-muted)">Small 13: the smallest text anywhere.</p>
  <p class="ui-prose">Prose (Georgia): museum text. Late summer: peasants cut wheat while others eat lunch under a pear tree.</p>
</section>
<section><h2 class="ui-label">Buttons</h2>
  <div class="stack">
    <div class="rowflex">
      <button class="ui-btn ui-btn--primary">Hang it</button>
      <button class="ui-btn">Not now</button>
      <button class="ui-btn ui-btn--danger">Sell</button>
      <button class="ui-btn ui-btn--quiet">Skip</button>
      <button class="ui-btn" disabled>Locked</button>
    </div>
    <button class="ui-btn ui-btn--primary ui-btn--wide">${uiIcon('coin')} Buy for 120 gold</button>
    <button class="ui-btn ui-btn--wide">${uiIcon('gift')} <span>Today<small>Gift ready</small></span></button>
    <div class="rowflex"><button class="ui-btn ui-close" aria-label="Close">${uiIcon('close')}</button><button class="ui-btn ui-close" aria-label="Back">${uiIcon('back')}</button><button class="ui-btn ui-close" aria-label="Menu">${uiIcon('menu')}</button></div>
  </div>
</section>
<section><h2 class="ui-label">Header (a sheet's top)</h2>
  <div class="frame"><div class="ui-head"><h2 class="ui-title">Journal</h2><button class="ui-btn ui-close" aria-label="Close">${uiIcon('close')}</button></div><p class="ui-sub">8 of 49 paintings on display.</p></div>
</section>
<section><h2 class="ui-label">Tabs and options</h2>
  <div class="stack">
    <div class="ui-seg"><button class="on">This room</button><button>Rooms</button><button>Character</button></div>
    <div class="ui-seg"><button aria-pressed="true">High</button><button aria-pressed="false">Low</button><button aria-pressed="false">Off</button></div>
    <div class="ui-chips"><button class="ui-chip on">All</button><button class="ui-chip">Have</button><button class="ui-chip">Missing</button><button class="ui-chip">Rare</button></div>
  </div>
</section>
<section><h2 class="ui-label">Cards, rows, stats</h2>
  <div class="stack">
    <div class="ui-stats"><div class="ui-stat"><b>46</b><span>gold / hour</span></div><div class="ui-stat"><b>1,128</b><span>visitors / month</span></div><div class="ui-stat"><b>1.3</b><span>museum rating</span></div></div>
    <div class="ui-list">
      <div class="ui-row"><span style="color:var(--ui-gold-hi)">${uiIcon('book', 'l')}</span><div class="ui-grow"><b>Paintings</b><small>8 of 49 on display</small></div><span class="ui-badge">NEW</span></div>
      <div class="ui-row"><span style="color:var(--ui-muted)">${uiIcon('lock', 'l')}</span><div class="ui-grow"><b>Main hall</b><small>Unlocks at office level 2</small></div><button class="ui-btn ui-btn--primary">Open</button></div>
    </div>
    <div class="ui-card ui-card--hot"><b>Curator's eye</b><p class="ui-sub">Have 5 paintings on display.</p><div class="ui-bar" style="--v:60%"><i></i></div></div>
  </div>
</section>
<section><h2 class="ui-label">Toggle, rarity, hint, empty</h2>
  <div class="stack">
    <div class="ui-toggle"><span>Vibration</span><button role="switch" aria-checked="true" aria-label="Vibration"></button></div>
    <div class="rowflex"><span class="ui-rarity" data-r="1">Common</span><span class="ui-rarity" data-r="2">Uncommon</span><span class="ui-rarity" data-r="3">Rare</span><span class="ui-rarity" data-r="4">Epic</span><span class="ui-rarity" data-r="5">Legendary</span></div>
    <div class="ui-hint">Tip: tap a visitor to chat. Some have a gift.</div>
    <div class="ui-empty"><b>No fossils yet</b><span>Brush the dirt mounds on the islands to find some.</span><button class="ui-btn">Show me where</button></div>
  </div>
</section>
<section><h2 class="ui-label">Icons</h2>
  <div class="icons">${uiIconNames().map((n) => `<div>${uiIcon(n, 'l')}${n}</div>`).join('')}</div>
</section>`;
document.getElementById('guide').innerHTML = html;
document.querySelectorAll('.ui-toggle button').forEach((b) => (b.onclick = () => b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true')));
document.querySelectorAll('.ui-seg').forEach((s) => s.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  s.querySelectorAll('button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
}));
document.querySelectorAll('.ui-chip').forEach((c) => (c.onclick = () => c.classList.toggle('on')));
const size = (v) => (document.documentElement.dataset.text = v);
document.getElementById('text-normal').onclick = () => size('');
document.getElementById('text-large').onclick = () => size('large');
