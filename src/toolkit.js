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
      b.textContent = label;
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
        b.className = state.coins() < def.price ? 'tool-item poor' : 'tool-item';
        // Scale the icon up, but keep tall or wide items inside the tile.
        const iw = def.plant ? 24 : def.w * 32;
        const ih = def.plant ? 34 : def.h * 32 + def.rise;
        const k = Math.min(1.4, 56 / ih, 76 / iw);
        b.innerHTML = `<span class="ti-icon"><img alt="" src="${state.icon(type)}" style="width:${iw * k}px;height:${ih * k}px" /></span>
          <b>${def.name}</b><span class="ti-meta"><i class="coin"></i> ${def.price.toLocaleString()}</span><span class="ti-meta">+${def.income}/hr</span>
          <span class="ti-size">${def.w}×${def.h} tiles</span>`;
        b.onclick = () => state.onPick(type);
        return b;
      }),
  );
}

el.querySelector('.toolkit-done').addEventListener('click', () => state.onDone());

// opts: { icon(type) -> image url, coins() -> wallet, onPick(type), onDone() }
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
