// Build menu. Pick the room (vertical/horizontal, size); the preview is cut by
// a dotted line near the exit end. The room body stays put and the end piece
// is a vertical carousel: swipe up or down to choose how the room ends.
// There is no horizontal scrolling on this page.
import { bakeFloor, bakeWalls, bakeFront } from './art.js';
import { SIZES, EXITS, exitLabel, layout, paintingsFor, placeArt, wallItems } from './rooms.js';
import { paintArt } from './walldraw.js';

const el = document.getElementById('build');
const preview = el.querySelector('.build-preview');
const bodyCanvas = el.querySelector('.build-body');
const wrap = el.querySelector('.build-end-wrap');
const reel = el.querySelector('.build-end');
const dots = el.querySelector('.build-dots');
const caption = el.querySelector('.build-caption');
const capacity = el.querySelector('.build-capacity');

let state = null;

// Draw a full room (with this exit) into a canvas at 1 px per world px.
function drawRoom(scene, rooms, room, decor) {
  const L = layout(room);
  const { g } = L;
  const hung = paintingsFor([...rooms, room], rooms.length).filter(Boolean).map(placeArt);
  const canvas = document.createElement('canvas');
  canvas.width = g.w;
  canvas.height = g.h;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const src = (t) => t.getSourceImage();
  const mat = L.entrance.mat;

  ctx.drawImage(src(bakeFloor(scene, '_pv_floor', g.xR - g.xL, g.y1 - g.y0, decor.floor)), g.xL, g.y0);
  ctx.drawImage(src(bakeWalls(scene, '_pv_walls', g, wallItems(L, hung), decor)), 0, 0);
  ctx.drawImage(src(bakeFront(scene, '_pv_front', g.w, mat ? L.entrance.x0 : -1, mat ? L.entrance.x1 : -1)), 0, g.y1);
  const sp = L.exit?.sprite;
  if (sp && scene.textures.exists(sp.key)) {
    const img = src(scene.textures.get(sp.key));
    ctx.save();
    if (sp.flip) {
      ctx.translate(sp.x + img.width, sp.y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0);
    } else ctx.drawImage(img, sp.x, sp.y);
    ctx.restore();
  }
  hung.forEach((p) => {
    const key = `art_${p.id}`;
    const img = scene.textures.exists(key) ? scene.textures.get(key).getSourceImage() : null;
    paintArt(ctx, img && img.width > 1 ? img : null, p, g, 1, 0, 0);
  });
  ['_pv_floor', '_pv_walls', '_pv_front'].forEach((k) => scene.textures.exists(k) && scene.textures.remove(k));
  return { canvas, L };
}

function crop(src, x, y, w, h, scale, target = document.createElement('canvas')) {
  target.width = w;
  target.height = h;
  target.style.width = `${w * scale}px`;
  target.style.height = `${h * scale}px`;
  const ctx = target.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
  return target;
}

function render() {
  const { scene, rooms, decor, orient, size } = state;
  el.querySelectorAll('[data-orient]').forEach((b) => b.classList.toggle('on', b.dataset.orient === orient));
  el.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('on', b.dataset.size === size));

  const options = EXITS[orient];
  const drawn = options.map((exit) => drawRoom(scene, rooms, { orient, size, exit }, decor));
  const { g, split } = drawn[0].L;
  state.slots = drawn.map((d) => d.L.slots.length);

  // Fit the whole room in the preview box.
  const availW = preview.clientWidth - 28;
  const availH = window.innerHeight * 0.44;
  const scale = Math.min(availW / g.w, availH / g.h);
  const vertical = orient === 'vertical';
  preview.classList.toggle('vertical', vertical);

  let pieceW;
  let pieceH;
  if (vertical) {
    // End piece on top, room body below.
    crop(drawn[0].canvas, 0, split.y, g.w, g.h - split.y, scale, bodyCanvas);
    pieceW = g.w;
    pieceH = split.y;
    reel.replaceChildren(...drawn.map((d) => crop(d.canvas, 0, 0, g.w, split.y, scale)));
  } else {
    // Room body on the left, end piece on the right.
    crop(drawn[0].canvas, 0, 0, split.x, g.h, scale, bodyCanvas);
    pieceW = g.w - split.x;
    pieceH = g.h;
    reel.replaceChildren(...drawn.map((d) => crop(d.canvas, split.x, 0, pieceW, g.h, scale)));
  }
  wrap.style.width = `${pieceW * scale}px`;
  wrap.style.height = `${pieceH * scale}px`;
  state.pieceH = pieceH * scale;

  dots.replaceChildren(...options.map(() => document.createElement('span')));
  reel.scrollTop = 0;
  state.exit = -1;
  showExit(0);
}

function showExit(i) {
  if (i === state.exit) return;
  state.exit = i;
  caption.textContent = exitLabel(state.orient, EXITS[state.orient][i]);
  const tiles = SIZES[state.orient][state.size];
  const dims = state.orient === 'vertical' ? `5 × ${tiles}` : `${tiles} × 5`;
  capacity.textContent = `${dims} tiles · holds ${state.slots[i]} paintings`;
  [...dots.children].forEach((d, j) => d.classList.toggle('on', j === i));
}

reel.addEventListener('scroll', () => {
  if (state) showExit(Math.round(reel.scrollTop / state.pieceH));
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
