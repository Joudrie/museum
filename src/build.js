// Build menu: pick orientation, size and the far-end exit for a new room.
// Each exit option gets a live preview drawn with the real room art.
import { bakeFloor, bakeWalls, bakeFront, bakeStairsUp, bakeStairsDown } from './art.js';
import { SIZES, EXITS, EXIT_LABELS, layout, paintingsFor, placeArt, wallItems } from './rooms.js';
import { paintArt } from './walldraw.js';

const el = document.getElementById('build');
const track = el.querySelector('.build-track');
const dots = el.querySelector('.build-dots');
const caption = el.querySelector('.build-caption');
const capacity = el.querySelector('.build-capacity');

let state = null;

function preview(scene, rooms, room, decor) {
  const L = layout(room);
  const { g } = L;
  const hung = paintingsFor([...rooms, room], rooms.length).filter(Boolean).map(placeArt);
  const canvas = document.createElement('canvas');
  canvas.width = g.w;
  canvas.height = g.h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const tex = (t) => t.getSourceImage();

  ctx.drawImage(tex(bakeFloor(scene, '_pv_floor', g.xR - g.xL, g.y1 - g.y0, decor.floor)), g.xL, g.y0);
  ctx.drawImage(tex(bakeWalls(scene, '_pv_walls', g, wallItems(L, hung), decor)), 0, 0);
  ctx.drawImage(tex(bakeFront(scene, '_pv_front', g.w, L.entrance.x0, L.entrance.x1)), 0, g.y1);
  if (room.exit === 'stairs-up') ctx.drawImage(tex(bakeStairsUp(scene, '_pv_stairs')), g.xL, g.y0 + 64 - 128);
  if (room.exit === 'stairs-down') ctx.drawImage(tex(bakeStairsDown(scene, '_pv_stairs')), g.xL, g.y0);
  hung.forEach((p) => {
    const key = `art_${p.id}`;
    const src = scene.textures.exists(key) ? scene.textures.get(key).getSourceImage() : null;
    paintArt(ctx, src && src.width > 1 ? src : null, p, g, 1, 0, 0);
  });
  ['_pv_floor', '_pv_walls', '_pv_front', '_pv_stairs'].forEach((k) => scene.textures.exists(k) && scene.textures.remove(k));
  return { canvas, slots: L.slots.length };
}

function render() {
  const { scene, rooms, decor, orient, size } = state;
  el.querySelectorAll('[data-orient]').forEach((b) => b.classList.toggle('on', b.dataset.orient === orient));
  el.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === size));

  const options = EXITS[orient];
  state.slots = [];
  track.replaceChildren(
    ...options.map((exit) => {
      const { canvas, slots: n } = preview(scene, rooms, { orient, size, exit }, decor);
      state.slots.push(n);
      const slide = document.createElement('div');
      slide.className = 'build-slide';
      slide.appendChild(canvas);
      return slide;
    }),
  );
  dots.replaceChildren(...options.map(() => document.createElement('span')));
  state.exit = 0;
  track.scrollLeft = 0;
  showExit(0);
}

function showExit(i) {
  state.exit = i;
  caption.textContent = EXIT_LABELS[EXITS[state.orient][i]];
  const tiles = SIZES[state.orient][state.size];
  const dims = state.orient === 'vertical' ? `5 × ${tiles}` : `${tiles} × 5`;
  capacity.textContent = `${dims} tiles · holds ${state.slots[i]} paintings`;
  [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
}

track.addEventListener('scroll', () => {
  const i = Math.round(track.scrollLeft / track.clientWidth);
  if (state && i !== state.exit) showExit(i);
});

el.querySelectorAll('[data-orient]').forEach((b) =>
  b.addEventListener('click', () => {
    state.orient = b.dataset.orient;
    render();
  }),
);
el.querySelectorAll('[data-size]').forEach((b) =>
  b.addEventListener('click', () => {
    state.size = b.dataset.size;
    render();
  }),
);
el.querySelector('.build-cancel').addEventListener('click', () => {
  el.classList.add('hidden');
  state.onCancel();
});
el.querySelector('.build-buy').addEventListener('click', () => {
  el.classList.add('hidden');
  state.onBuild({ orient: state.orient, size: state.size, exit: EXITS[state.orient][state.exit] });
});

export function openBuild(scene, rooms, decor, { onBuild, onCancel }) {
  state = { scene, rooms, decor, orient: 'horizontal', size: 'medium', exit: 0, onBuild, onCancel };
  el.classList.remove('hidden');
  render();
}
