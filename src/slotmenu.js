// Wall-spot menu: hang a painting, make it a plain wall, or put a door there.
// Paintings show as a gallery you can filter by era or search. A painting can
// only hang in one place: picking one that hangs elsewhere moves it here.
import { PAINTINGS } from './paintings.js';

const el = document.getElementById('slotmenu');
const kinds = el.querySelectorAll('[data-kind]');
const list = el.querySelector('.slot-paintings');

export const ERAS = { all: 'All', free: 'Not hung', renaissance: 'Renaissance', baroque: 'Baroque', romantic: '1700s–1850s', impressionist: 'Impressionist', modern: 'Modern' };
const yearOf = (p) => Number(/\d{4}/.exec(p.year)?.[0] || 0);
export function eraOf(p) {
  const y = yearOf(p);
  if (y < 1600) return 'renaissance';
  if (y < 1750) return 'baroque';
  if (y < 1860) return 'romantic';
  if (y < 1900) return 'impressionist';
  return 'modern';
}

let state = null;

function card(p) {
  const where = state.hungIn.get(p.id);
  const here = state.current?.kind === 'painting' && state.current.painting?.id === p.id;
  const b = document.createElement('button');
  b.className = 'slot-painting' + (here ? ' on' : '') + (where !== undefined && !here ? ' elsewhere' : '');
  const label = here ? 'Hanging here' : where !== undefined ? `In ${state.roomLabel ? state.roomLabel(where) : `room ${where + 1}`} · move here` : '';
  b.innerHTML = `
    <span class="thumb" style="background:${p.placeholder}"><img alt="" loading="lazy" src="${p.src}" /></span>
    <span class="meta"><b></b><i></i>${label ? `<em>${label}</em>` : ''}</span>`;
  b.querySelector('b').textContent = p.title;
  b.querySelector('i').textContent = `${p.by} · ${p.year}`;
  b.querySelector('img').onerror = (e) => e.target.remove();
  b.onclick = () => (here ? close() : pick({ kind: 'painting', id: p.id }));
  return b;
}

function render() {
  kinds.forEach((b) => b.classList.toggle('on', b.dataset.kind === state.tab));
  list.replaceChildren();
  if (state.tab !== 'painting') return;
  const search = document.createElement('input');
  search.className = 'room-name gallery-search';
  search.type = 'search';
  search.placeholder = 'Search title or artist…';
  search.setAttribute('aria-label', 'Search paintings');
  search.value = state.query;
  const chips = document.createElement('div');
  chips.className = 'choices gallery-eras';
  Object.entries(ERAS).forEach(([id, label]) => {
    const c = document.createElement('button');
    c.textContent = label;
    c.className = id === state.era ? 'on' : '';
    c.onclick = () => {
      state.era = id;
      render();
    };
    chips.appendChild(c);
  });
  const grid = document.createElement('div');
  grid.className = 'gallery-grid';
  const fill = () => {
    const q = state.query.trim().toLowerCase();
    const shown = PAINTINGS.filter((p) => {
      if (state.era === 'free' && state.hungIn.has(p.id)) return false;
      if (!['all', 'free'].includes(state.era) && eraOf(p) !== state.era) return false;
      return !q || `${p.title} ${p.by}`.toLowerCase().includes(q);
    });
    grid.replaceChildren(...shown.map(card));
    if (!shown.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-note';
      empty.textContent = 'No paintings match. Try another era or search.';
      grid.appendChild(empty);
    }
  };
  search.addEventListener('input', () => {
    state.query = search.value;
    fill();
  });
  fill();
  list.append(search, chips, grid);
}

function pick(value) {
  el.classList.add('hidden');
  state.onPick(value);
}

function close() {
  el.classList.add('hidden');
  state.onClose();
}

kinds.forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.kind === 'painting') {
      state.tab = 'painting';
      render();
    } else pick({ kind: b.dataset.kind });
  }),
);
el.querySelector('.slot-close').addEventListener('click', close);

// opts: { current: slot state, hungIn: Map(id -> room index), roomLabel(i), onPick(value), onClose() }
export function openSlotMenu(opts) {
  state = { era: 'all', query: '', ...opts, tab: 'painting' };
  render();
  el.querySelector('.sheet').scrollTop = 0;
  el.classList.remove('hidden');
}
