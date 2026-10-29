// Painting viewer: the camera "turns to face the wall". Paintings sit on a
// blurred wall strip; swiping slides along the wall to the next one.
// It shows any collection entry (or the older painting shape, which carries
// its entry): pictures from files hang on the wall, pixel art sits in a case.
import { keyOf, metaLine } from './collections/index.js';
import { drawEntry } from './collections/render.js';
import { provenanceLine } from './restore.js';

const STORE_KEY = 'curation.journal';

const el = document.getElementById('viewer');
const track = el.querySelector('.wall-track');
const dots = el.querySelector('.viewer-dots');
const title = el.querySelector('.info-title');
const meta = el.querySelector('.info-meta');
const blurb = el.querySelector('.info-blurb');
const prov = Object.assign(document.createElement('p'), { className: 'info-prov' });
prov.style.cssText = 'margin:2px 0 6px;font-style:italic;opacity:.8';
meta.after(prov);
const rating = el.querySelector('.info-rating');
const note = el.querySelector('.info-note');
const change = el.querySelector('.viewer-change');
const entryOf = (it) => it.entry || it;

let list = [];
let current = -1;
let onClose = null;
let onChange = null;

function loadJournal() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveEntry(id, patch) {
  const journal = loadJournal();
  journal[id] = { ...journal[id], ...patch };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(journal));
  } catch {
    // storage unavailable (private mode); notes just won't persist
  }
}

function slide(item) {
  const e = entryOf(item);
  const im = e.image;
  const drawn = im.kind === 'pixels' || im.kind === 'procedural';
  const s = document.createElement('div');
  s.className = 'slide';
  s.innerHTML = `
    <div class="slide-wall"></div>
    <div class="spotlight"></div>
    <figure class="frame${drawn ? ' case' : ''}"${drawn ? '' : ` style="aspect-ratio:${e.ratio || 1}"`}></figure>`;
  const frame = s.querySelector('.frame');
  if (drawn) {
    const cv = drawEntry(e, 12);
    cv.className = 'pix';
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', e.title);
    frame.appendChild(cv);
    return s;
  }
  const img = document.createElement('img');
  img.alt = [e.title, e.by].filter(Boolean).join(', ');
  img.draggable = false;
  img.onerror = () => {
    img.replaceWith(
      Object.assign(document.createElement('div'), {
        className: 'img-fallback',
        textContent: e.title,
        style: `background:${im.placeholder || '#6a6458'}`,
      }),
    );
  };
  img.src = im.src;
  frame.appendChild(img);
  return s;
}

function show(i) {
  if (i === current || !list[i]) return;
  current = i;
  const e = entryOf(list[i]);
  title.textContent = e.title;
  meta.textContent = metaLine(e);
  prov.textContent = e.provenance?.how === 'gift' ? '' : provenanceLine(e);
  blurb.textContent = [e.blurb, ...(e.facts || [])].filter(Boolean).join(' ');
  const saved = loadJournal()[keyOf(e)] || {};
  note.value = saved.note || '';
  renderStars(saved.rating || 0);
  [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
}

function renderStars(value) {
  rating.innerHTML = '';
  for (let n = 1; n <= 5; n++) {
    const b = document.createElement('button');
    b.textContent = n <= value ? '★' : '☆';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(n === value));
    b.setAttribute('aria-label', `${n} star${n > 1 ? 's' : ''}`);
    b.onclick = () => {
      saveEntry(keyOf(entryOf(list[current])), { rating: n });
      renderStars(n);
    };
    rating.appendChild(b);
  }
}

track.addEventListener('scroll', () => {
  show(Math.round(track.scrollLeft / track.clientWidth));
});

note.addEventListener('input', () => {
  if (list[current]) saveEntry(keyOf(entryOf(list[current])), { note: note.value });
});

function close() {
  el.classList.add('hidden');
  el.classList.remove('over');
  el.setAttribute('aria-hidden', 'true');
  note.blur();
  if (onClose) onClose();
  onClose = null;
}

el.querySelector('.viewer-close').addEventListener('click', close);
el.querySelector('.viewer-change').addEventListener('click', () => {
  const p = list[current];
  const cb = onChange;
  onClose = null;
  close();
  cb?.(p);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !el.classList.contains('hidden')) close();
});

// changeCb(painting): the player wants to change the wall spot this painting hangs in
// (the button only shows when there is one). opts.over: open above the journal.
export function openViewer(paintings, index, closeCb, changeCb, opts = {}) {
  list = paintings;
  el.classList.toggle('over', !!opts.over);
  change.style.display = changeCb ? '' : 'none';
  current = -1;
  onClose = closeCb;
  onChange = changeCb;
  track.replaceChildren(...paintings.map(slide));
  dots.replaceChildren(...paintings.map(() => document.createElement('span')));
  el.querySelector('.viewer-scroll').scrollTop = 0;
  el.classList.remove('hidden');
  el.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    track.scrollLeft = index * track.clientWidth;
    show(index);
  });
}
