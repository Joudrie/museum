// Toolkit drawer (pick a decor item) and the bar shown while placing or
// editing an item. The room scene drives the actual placement.
import { CATEGORIES, ITEMS } from './items.js';

const el = document.getElementById('toolkit');
const cats = el.querySelector('.toolkit-cats');
const grid = el.querySelector('.toolkit-grid');
const bar = document.getElementById('placebar');
const barName = bar.querySelector('.pb-name');
const barMeta = bar.querySelector('.pb-meta');
const barButtons = bar.querySelector('.placebar-buttons');

let state = null;
let cat = 'seating';

function render() {
  cats.replaceChildren(
    ...Object.entries(CATEGORIES).map(([id, label]) => {
      const b = document.createElement('button');
      // each category shows its first item as an icon
      const first = Object.keys(ITEMS).find((t) => ITEMS[t].cat === id);
      b.innerHTML = `${first ? `<img alt="" src="${state.icon(first)}" />` : ''}<span></span>`;
      b.querySelector('span').textContent = label;
      b.className = id === cat ? 'on' : '';
      b.onclick = () => {
        cat = id;
        render();
      };
      return b;
    }),
  );
  grid.replaceChildren(
    ...Object.entries(ITEMS)
      .filter(([, def]) => def.cat === cat)
      .map(([type, def]) => {
        const b = document.createElement('button');
        const lvl = def.lvl || 1;
        const locked = lvl > state.level();
        b.className = locked ? 'tool-item locked' : !state.canAfford(def.price) ? 'tool-item poor' : 'tool-item';
        // Scale the icon up, but keep tall or wide items inside the tile.
        const iw = def.plant ? 24 : def.w * 32;
        const ih = def.plant ? 34 : def.h * 32 + def.rise;
        const k = Math.min(1.4, 56 / ih, 76 / iw);
        b.innerHTML = `<span class="ti-icon"><img alt="" src="${state.icon(type)}" style="width:${iw * k}px;height:${ih * k}px" /></span>
          <b>${def.name}</b><span class="ti-meta">${locked ? `<i class="lock"></i> Office Lv ${lvl}` : `<i class="coin"></i> ${def.price.toLocaleString()}`}</span><span class="ti-meta">${def.note || `+${def.income}/hr`}</span>
          <span class="ti-size">${def.w}×${def.h} tiles</span>`;
        b.onclick = () => state.onPick(type);
        return b;
      }),
  );
}

el.querySelector('.toolkit-done').addEventListener('click', () => state.onDone());

// opts: { icon(type) -> image url, canAfford(price), level() -> office level, onPick(type), onDone() }
export function openToolkit(opts) {
  state = opts;
  render();
  el.classList.remove('hidden');
}

export function hideToolkit() {
  el.classList.add('hidden');
}

// buttons: [{ label, onClick, primary, disabled }]
export function showBar(name, meta, buttons) {
  barName.textContent = name;
  barMeta.textContent = meta;
  barButtons.replaceChildren(
    ...buttons.map((btn) => {
      const b = document.createElement('button');
      b.textContent = btn.label;
      b.className = btn.primary ? 'pixel-btn primary' : 'pixel-btn';
      b.disabled = !!btn.disabled;
      b.onclick = btn.onClick;
      return b;
    }),
  );
  bar.classList.remove('hidden');
}

export function hideBar() {
  bar.classList.add('hidden');
}
