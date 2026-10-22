// Painting viewer: the camera "turns to face the wall". Paintings sit on a
// blurred wall strip; swiping slides along the wall to the next one.
const STORE_KEY = 'curation.journal';

const el = document.getElementById('viewer');
const track = el.querySelector('.wall-track');
const dots = el.querySelector('.viewer-dots');
const title = el.querySelector('.info-title');
const meta = el.querySelector('.info-meta');
const blurb = el.querySelector('.info-blurb');
const rating = el.querySelector('.info-rating');
const note = el.querySelector('.info-note');

let list = [];
let current = -1;
let onClose = null;

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

function slide(p) {
  const s = document.createElement('div');
  s.className = 'slide';
  s.innerHTML = `
    <div class="slide-wall"></div>
    <div class="spotlight"></div>
    <figure class="frame" style="aspect-ratio:${p.ratio}">
      <img alt="${p.title}, ${p.by}" draggable="false" />
    </figure>`;
  const img = s.querySelector('img');
  img.onerror = () => {
    img.replaceWith(
      Object.assign(document.createElement('div'), {
        className: 'img-fallback',
        textContent: p.title,
        style: `background:${p.placeholder}`,
      }),
    );
  };
  img.src = p.src;
  return s;
}

function show(i) {
  if (i === current || !list[i]) return;
  current = i;
  const p = list[i];
  title.textContent = p.title;
  meta.textContent = `${p.by} · ${p.year}`;
  blurb.textContent = p.blurb;
  const entry = loadJournal()[p.id] || {};
  note.value = entry.note || '';
  renderStars(entry.rating || 0);
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
      saveEntry(list[current].id, { rating: n });
      renderStars(n);
    };
    rating.appendChild(b);
  }
}

track.addEventListener('scroll', () => {
  show(Math.round(track.scrollLeft / track.clientWidth));
});

note.addEventListener('input', () => {
  if (list[current]) saveEntry(list[current].id, { note: note.value });
});

function close() {
  el.classList.add('hidden');
  el.setAttribute('aria-hidden', 'true');
  note.blur();
  if (onClose) onClose();
  onClose = null;
}

el.querySelector('.viewer-close').addEventListener('click', close);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !el.classList.contains('hidden')) close();
});

export function openViewer(paintings, index, closeCb) {
  list = paintings;
  current = -1;
  onClose = closeCb;
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
