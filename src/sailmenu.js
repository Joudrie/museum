import { hasTiles } from './mapformat.js';
import { uiIcon } from './ui/icons.js';

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
    b.className = 'pixel-btn sail-dest' + (o.locked ? ' locked' : '');
    b.innerHTML = `<b></b><small></small>`;
    b.querySelector('b').textContent = o.label;
    if (o.locked) b.querySelector('b').insertAdjacentHTML('afterbegin', uiIcon('lock', 's') + ' '); // a pixel lock, never an emoji
    b.querySelector('small').textContent = o.sub || '';
    if (o.preview) {
      // what is out there (silhouettes), so a locked dock shows concrete value
      const pv = document.createElement('small');
      pv.className = 'sail-preview';
      // "31 fish you have not found live here: ??? ??? ???" → the sentence, then one small "?" box per rare kind
      const m = /^(.*?):\s*((?:\?\?\?\s*)+)$/.exec(o.preview);
      if (m) {
        pv.setAttribute('aria-label', o.preview);
        pv.append(m[1]);
        const row = document.createElement('span');
        row.className = 'sail-qs';
        row.setAttribute('aria-hidden', 'true');
        (m[2].match(/\?\?\?/g) || []).forEach(() => {
          const q = document.createElement('span');
          q.className = 'sail-q';
          q.textContent = '?';
          row.appendChild(q);
        });
        pv.appendChild(row);
      } else pv.textContent = o.preview;
      b.appendChild(pv);
    }
    b.setAttribute('aria-disabled', o.locked ? 'true' : 'false');
    b.onclick = () => (o.locked ? o.onLocked?.() : close(o));
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

// islands friends shared with you (kept by src/share.js)
export function friendIslands() {
  try {
    const f = JSON.parse(localStorage.getItem('curation.friends') || '{}');
    return Array.isArray(f.islands) ? f.islands.filter((m) => m?.kind === 'island') : [];
  } catch {
    return [];
  }
}
