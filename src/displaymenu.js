// The display panel: stand at a case, plinth, shelf, easel or tank to see what
// is on it, take pieces off, and put more of what you own on. Tapping a piece
// opens its card in the viewer.
import { list, metaLine } from './collections/index.js';
import { fillPicture } from './collections/render.js';
import { candidates, heldBy, put, take, slotCount, earns } from './display.js';
import { get } from './collections/index.js';
import { openViewer } from './viewer.js';

const el = document.getElementById('displaymenu');
const title = el.querySelector('.display-title');
const body = el.querySelector('.display-body');

let state = null;

const node = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

function card(e, { action, label, onPick, onLook }) {
  const b = node('div', 'slot-painting display-card');
  const thumb = node('button', 'thumb');
  thumb.setAttribute('aria-label', `Look at ${e.title}`);
  fillPicture(thumb, e, { scale: 3 });
  thumb.onclick = onLook;
  const meta = node('span', 'meta');
  meta.append(node('b', '', e.title), node('i', '', metaLine(e)), node('em', '', `+${earns(e)}/hr on display`));
  const btn = node('button', 'pixel-btn display-act', label);
  btn.onclick = onPick;
  b.append(thumb, meta, btn);
  return b;
}

function render() {
  const { item, def } = state;
  title.textContent = def.name;
  const held = heldBy(item.d).map((id) => get(id)).filter(Boolean);
  const room = slotCount(item.type);
  const head = node('p', 'toolkit-note', `${held.length} of ${room} places used. Pieces on display earn gold and lift the room's rating.`);
  const shown = node('div', 'gallery-grid');
  held.forEach((e, i) =>
    shown.appendChild(
      card(e, {
        label: 'Take off',
        onPick: () => {
          state.before?.();
          take(item, i);
          changed();
        },
        onLook: () => look(held, i),
      }),
    ),
  );
  if (!held.length) shown.appendChild(node('p', 'empty-note', 'Nothing here yet. Add something you own below.'));
  const full = held.length >= room;
  const pool = candidates(item.type, state.entries);
  const add = node('div', 'gallery-grid');
  pool.forEach((e) =>
    add.appendChild(
      card(e, {
        label: 'Put on',
        onPick: () => {
          if (full) return state.toast('This is full: take something off first');
          state.before?.();
          put(item, e.id);
          changed();
        },
        onLook: () => look(pool, pool.indexOf(e)),
      }),
    ),
  );
  if (!pool.length) {
    add.appendChild(node('p', 'empty-note', def.fixture.accepts.includes('tank') ? 'No fish to show. Catch some at the pond or the sea.' : 'You have nothing that fits here yet. Dig, fish and collect, then come back.'));
  }
  body.replaceChildren(head, node('h3', 'display-sub', 'On display'), shown, node('h3', 'display-sub', 'You could show'), add);
}

function look(entries, i) {
  openViewer(entries, i, null, null, { over: true });
}

function changed() {
  state.onChange?.();
  render();
}

function close() {
  el.classList.add('hidden');
  const cb = state?.onClose;
  state = null;
  cb?.();
}

el.querySelector('.display-close').addEventListener('click', close);

// opts: { item, def, onChange(), onClose(), toast(text) }
export function openDisplay(opts) {
  state = { ...opts, entries: list({}) };
  render();
  el.querySelector('.sheet').scrollTop = 0;
  el.classList.remove('hidden');
}
