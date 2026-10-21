// Customize panel (opened from the home button): floor, wainscot, wallpaper colors.
import { FLOORS, WAINSCOTS, PAPERS } from './art.js';

const GROUPS = [
  { key: 'floor', label: 'Floor', options: FLOORS },
  { key: 'wainscot', label: 'Wainscot', options: WAINSCOTS },
  { key: 'paper', label: 'Wallpaper', options: PAPERS },
];

const el = document.getElementById('decor');
const body = el.querySelector('.decor-body');

export function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; changes last until reload
  }
}

let handlers = {};

function render(decor) {
  body.replaceChildren(
    ...GROUPS.map((g) => {
      const section = document.createElement('section');
      section.innerHTML = `<h3>${g.label}</h3>`;
      const row = document.createElement('div');
      row.className = 'swatches';
      Object.entries(g.options).forEach(([id, opt]) => {
        const b = document.createElement('button');
        b.className = 'swatch' + (decor[g.key] === id ? ' on' : '');
        b.innerHTML = `<span style="background:${opt.color}"></span>${opt.name}`;
        b.onclick = () => {
          decor = { ...decor, [g.key]: id };
          handlers.onChange(decor);
          render(decor);
        };
        row.appendChild(b);
      });
      section.appendChild(row);
      return section;
    }),
  );
}

el.querySelector('.decor-close').addEventListener('click', () => {
  el.classList.add('hidden');
  handlers.onClose?.();
});
el.querySelector('.decor-reset').addEventListener('click', () => handlers.onReset?.());

export function openDecor(decor, h) {
  handlers = h;
  render(decor);
  el.classList.remove('hidden');
}
