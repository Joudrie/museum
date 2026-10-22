// Wall-spot menu: hang a painting, make it a plain wall, or put a door there.
// A painting can only hang in one place in the whole museum.
import { PAINTINGS } from './paintings.js';

const el = document.getElementById('slotmenu');
const kinds = el.querySelectorAll('[data-kind]');
const list = el.querySelector('.slot-paintings');

let state = null;

function render() {
  kinds.forEach((b) => b.classList.toggle('on', b.dataset.kind === state.tab));
  list.replaceChildren();
  if (state.tab !== 'painting') return;
  PAINTINGS.forEach((p) => {
    const where = state.hungIn.get(p.id);
    const here = state.current?.kind === 'painting' && state.current.painting?.id === p.id;
    const b = document.createElement('button');
    b.className = 'slot-painting' + (here ? ' on' : '');
    b.disabled = where !== undefined && !here;
    b.innerHTML = `
      <span class="thumb" style="background:${p.placeholder};aspect-ratio:${p.ratio}"><img alt="" src="${p.src}" /></span>
      <span class="meta"><b>${p.title}</b><i>${p.by}</i>${b.disabled ? `<em>In room ${where + 1}</em>` : here ? '<em>Hanging here</em>' : ''}</span>`;
    b.querySelector('img').onerror = (e) => e.target.remove();
    b.onclick = () => pick({ kind: 'painting', id: p.id });
    list.appendChild(b);
  });
}

function pick(value) {
  el.classList.add('hidden');
  state.onPick(value);
}

kinds.forEach((b) =>
  b.addEventListener('click', () => {
    if (b.dataset.kind === 'painting') {
      state.tab = 'painting';
      render();
    } else pick({ kind: b.dataset.kind });
  }),
);
el.querySelector('.slot-close').addEventListener('click', () => {
  el.classList.add('hidden');
  state.onClose();
});

// opts: { current: slot state, hungIn: Map(id -> room index), onPick(value), onClose() }
export function openSlotMenu(opts) {
  state = { ...opts, tab: 'painting' };
  render();
  list.scrollTop = 0;
  el.classList.remove('hidden');
}
