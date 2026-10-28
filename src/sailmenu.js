import { hasTiles } from './mapformat.js';

// Where to sail: the home island, the islands that ship with the game, and
// every island drawn in the map builder on this phone.
const el = document.createElement('div');
el.id = 'sail';
el.className = 'overlay hidden';
el.innerHTML = `<div class="decor-sheet sheet"><h2 class="ask-title">Where to?</h2><p class="ask-text">Pick an island to sail to.</p><div class="sail-list"></div><button class="pixel-btn sail-stay">Stay here</button></div>`;
document.body.appendChild(el);
let done = null;
const close = (pick) => {
  el.classList.add('hidden');
  const cb = done;
  done = null;
  cb?.(pick);
};
el.querySelector('.sail-stay').onclick = () => close(null);
el.addEventListener('click', (e) => e.target === el && close(null));

// options: [{ label, sub, go }]
export function openSail(options, cb) {
  const list = el.querySelector('.sail-list');
  list.replaceChildren();
  options.forEach((o) => {
    const b = document.createElement('button');
    b.className = 'pixel-btn sail-dest';
    b.innerHTML = `<b></b><small></small>`;
    b.querySelector('b').textContent = o.label;
    b.querySelector('small').textContent = o.sub || '';
    b.onclick = () => close(o);
    list.appendChild(b);
  });
  done = cb;
  el.classList.remove('hidden');
}

// islands saved in the map builder on this phone
export function builderIslands() {
  try {
    const all = JSON.parse(localStorage.getItem('curation.mapbuilder.maps') || '{}');
    return Object.values(all)
      .filter((m) => m.kind === 'island' && (m.objects?.length || hasTiles(m)))
      .sort((a, b) => (b.saved || 0) - (a.saved || 0));
  } catch {
    return [];
  }
}
