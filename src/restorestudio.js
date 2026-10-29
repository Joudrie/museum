// The Restoration Studio: finds and paintings that arrived dirty are cleaned by
// hand here. Three kinds of work (restore.js decides which):
//   clean:    rub grime off the picture with a cloth, then slide a before / after
//   prep:     brush stone off a fossil
//   assemble: drag broken pieces back together
// It is gentle: leave any time, nothing is lost or punished; only the finished
// piece changes (dirty -> restored). Real paintings are never altered, only the
// grime layer over them.
import './restorestudio.css';
import { restoreKind, dirtyItems, finishRestore, KIND_LABEL, provenanceLine } from './restore.js';
import { drawEntry, fillPicture } from './collections/render.js';
import { RARITY } from './collections/index.js';
import { sfx } from './music.js';
import { haptic } from './ui.js';

const W = 300; // work area, css px (portrait phones are 390 wide)
let el = null;
let onDone = null;

function build() {
  el = document.createElement('div');
  el.id = 'studio';
  el.className = 'overlay hidden';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Restoration Studio');
  el.innerHTML = `<div class="decor-sheet sheet">
    <div class="decor-head"><h2>Restoration Studio</h2><button class="studio-close pixel-btn decor-close" aria-label="Close">✕</button></div>
    <div class="studio-body"></div></div>`;
  document.body.appendChild(el);
  el.querySelector('.studio-close').onclick = close;
}
const body = () => el.querySelector('.studio-body');
const mk = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls || '', textContent: text ?? '' });

function close() {
  el.classList.add('hidden');
  const cb = onDone;
  onDone = null;
  cb?.();
}

/** The picture of an entry as a canvas that fits the work area (HD for url images). */
export function loadArt(e, max = W) {
  const im = e.image;
  if (im.kind === 'pixels' || im.kind === 'procedural') {
    const probe = drawEntry(e, 1);
    const sc = Math.max(1, Math.floor(max / Math.max(probe.width, probe.height)));
    return Promise.resolve(drawEntry(e, sc));
  }
  return new Promise((res) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const k = Math.min(max / img.naturalWidth, max / img.naturalHeight);
      const cv = mk('canvas');
      cv.width = Math.round(img.naturalWidth * k);
      cv.height = Math.round(img.naturalHeight * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      res(cv);
    };
    img.onerror = () => {
      const cv = mk('canvas');
      cv.width = cv.height = max;
      const g = cv.getContext('2d');
      g.fillStyle = im.placeholder || '#6a6458';
      g.fillRect(0, 0, max, max);
      res(cv);
    };
    img.src = im.src;
  });
}

function bench(w, h) {
  const b = mk('div', 'studio-bench');
  b.style.width = `${w}px`;
  b.style.height = `${h}px`;
  return b;
}
const layer = (w, h) => Object.assign(mk('canvas'), { width: w, height: h });

// grime / stone texture drawn over the art
function crust(w, h, kind) {
  const c = layer(w, h);
  const g = c.getContext('2d');
  if (kind === 'prep') {
    g.fillStyle = '#8a8478';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = ['#9c968a', '#756f64', '#a8a296', '#6a6358'][i % 4];
      const s = 4 + Math.random() * 10;
      g.fillRect(Math.random() * w, Math.random() * h, s, s);
    }
    g.strokeStyle = '#5a554c';
    for (let i = 0; i < 12; i++) {
      g.beginPath();
      g.moveTo(Math.random() * w, Math.random() * h);
      g.lineTo(Math.random() * w, Math.random() * h);
      g.stroke();
    }
  } else {
    // soot and smoke: mostly see-through brown so the picture shows dim underneath
    g.fillStyle = 'rgba(70,52,30,0.72)';
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 8 + Math.random() * 30;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(40,28,14,0.55)');
      gr.addColorStop(1, 'rgba(40,28,14,0)');
      g.fillStyle = gr;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  return c;
}

const covered = (crustCv, probe) => {
  const g = crustCv.getContext('2d', { willReadFrequently: true });
  const px = g.getImageData(0, 0, crustCv.width, crustCv.height).data;
  return probe.filter(([x, y]) => px[(y * crustCv.width + x) * 4 + 3] > 90).length / probe.length;
};

// ---- clean + prep: scrub the crust away -------------------------------------
function scrub(e, kind, art, finish) {
  const { width: w, height: h } = art;
  const b = bench(w, h);
  const under = art;
  const top0 = crust(w, h, kind); // the "before", kept as it was
  const top = layer(w, h);
  top.getContext('2d').drawImage(top0, 0, 0);
  const view = layer(w, h);
  [under, view].forEach((c) => b.appendChild(c));
  const g = view.getContext('2d');
  const tg = top.getContext('2d', { willReadFrequently: true });
  const bar = mk('div', 'studio-bar');
  const fill = mk('i');
  bar.appendChild(fill);
  const hint = mk('p', 'studio-hint', kind === 'prep' ? 'Brush the stone off the bone. Take your time.' : 'Rub the grime away with the cloth.');
  const probe = [];
  for (let y = 0; y < h; y += 6) for (let x = 0; x < w; x += 6) probe.push([x, y]);
  // only count the parts of the art that matter (transparent pixels in pixel art don't)
  const ag = under.getContext('2d').getImageData(0, 0, w, h).data;
  const pts = probe.filter(([x, y]) => ag[(y * w + x) * 4 + 3] > 100);
  if (pts.length < 20) pts.push(...probe);
  const start = covered(top, pts) || 1;
  const redraw = () => {
    g.clearRect(0, 0, w, h);
    g.drawImage(top, 0, 0);
  };
  redraw();
  const R = kind === 'prep' ? 16 : 22;
  let last = null;
  let moves = 0;
  let done = false;
  const progress = () => Math.min(1, 1 - covered(top, pts) / start);
  const pos = (ev) => {
    const r = b.getBoundingClientRect();
    return [((ev.clientX - r.left) / r.width) * w, ((ev.clientY - r.top) / r.height) * h];
  };
  const rub = ([x, y]) => {
    tg.globalCompositeOperation = 'destination-out';
    tg.lineCap = tg.lineJoin = 'round';
    tg.lineWidth = R;
    tg.beginPath();
    tg.moveTo(...(last || [x, y]));
    tg.lineTo(x, y);
    tg.stroke();
    last = [x, y];
    redraw();
    if (++moves % 5 === 0) {
      const p = progress();
      fill.style.width = `${Math.round(p * 100)}%`;
      if (!done && p >= 0.9) fin();
    }
  };
  const fin = () => {
    done = true;
    tg.clearRect(0, 0, w, h);
    redraw();
    fill.style.width = '100%';
    sfx('unlock');
    haptic(20);
    finish(compare(e, art, kind, top0, b, hint));
  };
  b.onpointerdown = (ev) => {
    if (done) return;
    b.setPointerCapture?.(ev.pointerId);
    last = null;
    rub(pos(ev));
    if (moves % 3 === 0) sfx('talk');
  };
  b.onpointermove = (ev) => ev.buttons && !done && rub(pos(ev));
  b.onpointerup = b.onpointercancel = () => {
    last = null;
    if (!done && moves) {
      const p = progress();
      fill.style.width = `${Math.round(p * 100)}%`;
      if (p >= 0.9) fin();
    }
  };
  return [b, bar, hint];
}

// before / after: a slider over the finished piece (done = clean art, before = crust)
function compare(e, art, kind, before, benchEl, hint) {
  const cmp = mk('div', 'studio-cmp');
  const ba = layer(art.width, art.height);
  const bg = ba.getContext('2d');
  bg.drawImage(art, 0, 0);
  bg.drawImage(before, 0, 0);
  ba.style.clipPath = 'inset(0 50% 0 0)';
  const handle = mk('div', 'handle');
  handle.style.left = '50%';
  cmp.append(ba, handle, Object.assign(mk('span', 'tag', 'Before'), { style: 'left:6px' }), Object.assign(mk('span', 'tag', 'After'), { style: 'right:6px' }));
  benchEl.appendChild(cmp);
  hint.textContent = 'Beautiful. Slide to see before and after.';
  const set = (ev) => {
    const r = benchEl.getBoundingClientRect();
    const f = Math.max(0.02, Math.min(0.98, (ev.clientX - r.left) / r.width));
    ba.style.clipPath = `inset(0 ${(1 - f) * 100}% 0 0)`;
    handle.style.left = `${f * 100}%`;
  };
  cmp.onpointerdown = (ev) => {
    cmp.setPointerCapture?.(ev.pointerId);
    set(ev);
  };
  cmp.onpointermove = (ev) => ev.buttons && set(ev);
}

// ---- assemble: put the pieces back ------------------------------------------
function assemble(e, art, finish) {
  const { width: w, height: h } = art;
  const cols = 3;
  const rows = 3;
  const pw = Math.floor(w / cols);
  const ph = Math.floor(h / rows);
  const b = bench(pw * cols, ph * rows * 2 + 28);
  const hint = mk('p', 'studio-hint', 'Drag each piece to where it fits. Close is close enough.');
  const bar = mk('div', 'studio-bar');
  const fill = mk('i');
  bar.appendChild(fill);
  // dotted slots hold the finished shape; pieces start scattered along the bottom tray
  const pieces = [];
  let placed = 0;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const slot = mk('div', 'slot');
      Object.assign(slot.style, { left: `${c * pw}px`, top: `${r * ph}px`, width: `${pw}px`, height: `${ph}px` });
      b.appendChild(slot);
      const cv = layer(pw, ph);
      cv.getContext('2d').drawImage(art, c * pw, r * ph, pw, ph, 0, 0, pw, ph);
      cv.className = 'piece';
      pieces.push({ cv, tx: c * pw, ty: r * ph });
    }
  pieces
    .map((p) => [Math.random(), p])
    .sort((a, z) => a[0] - z[0])
    .forEach(([, p], i) => {
      p.cv.style.left = `${(i % cols) * pw}px`;
      p.cv.style.top = `${ph * rows + 24 + Math.floor(i / cols) * ph}px`; // a tidy tray: nothing overlaps
      b.appendChild(p.cv);
      let dx = 0;
      let dy = 0;
      p.cv.onpointerdown = (ev) => {
        if (p.done) return;
        p.cv.setPointerCapture?.(ev.pointerId);
        dx = ev.clientX - p.cv.offsetLeft;
        dy = ev.clientY - p.cv.offsetTop;
        p.cv.style.zIndex = 5;
        sfx('talk');
      };
      p.cv.onpointermove = (ev) => {
        if (p.done || !ev.buttons) return;
        p.cv.style.left = `${ev.clientX - dx}px`;
        p.cv.style.top = `${ev.clientY - dy}px`;
      };
      p.cv.onpointerup = () => {
        if (p.done) return;
        p.cv.style.zIndex = '';
        if (Math.hypot(p.cv.offsetLeft - p.tx, p.cv.offsetTop - p.ty) < Math.max(pw, ph) * 0.6) {
          p.done = true;
          p.cv.style.left = `${p.tx}px`;
          p.cv.style.top = `${p.ty}px`;
          p.cv.classList.add('placed');
          sfx('build');
          haptic(8);
          fill.style.width = `${Math.round((100 * ++placed) / pieces.length)}%`;
          if (placed === pieces.length) {
            hint.textContent = 'Every piece is home.';
            sfx('unlock');
            finish();
          }
        }
      };
    });
  return [b, bar, hint];
}

// ---- the studio screens ------------------------------------------------------
function list() {
  const items = dirtyItems();
  const nodes = [];
  nodes.push(mk('p', 'toolkit-note', items.length ? 'These arrived dirty or broken. Restore one by hand; restored pieces can go on display.' : 'Nothing waiting. Finds from digs and expeditions, and paintings that need care, will turn up here.'));
  const wrap = mk('div', 'studio-list');
  items.forEach(({ entry: e, n, kind }) => {
    const row = mk('button', 'studio-row');
    row.innerHTML = '<span class="thumb"></span><span><b></b><small></small></span>';
    fillPicture(row.querySelector('.thumb'), e, { scale: 3 });
    row.querySelector('b').textContent = n > 1 ? `${e.title} ×${n}` : e.title;
    row.querySelector('small').textContent = `${KIND_LABEL[kind]} · ${RARITY[e.rarity ?? 1]}`;
    row.onclick = () => work(e, kind);
    wrap.appendChild(row);
  });
  nodes.push(wrap);
  body().replaceChildren(...nodes);
}

async function work(e, kind) {
  const b = body();
  b.replaceChildren(mk('p', 'toolkit-note', `${e.title}: loading…`));
  const art = await loadArt(e, kind === 'assemble' ? 240 : W);
  const back = mk('button', 'pixel-btn', '← Back to the bench');
  back.onclick = list;
  const title = mk('h3', 'fish-h', e.title);
  const finishAs = (extra) => {
    const r = finishRestore(e.id);
    const done = mk('div', 'studio-done');
    const lines = [mk('b', '', r?.fresh ? 'Restored! New to your codex.' : 'Restored!')];
    const pv = provenanceLine(e);
    if (pv) lines.push(mk('small', '', pv));
    if (e.blurb) lines.push(mk('p', 'toolkit-note', e.blurb));
    done.append(...lines);
    const again = mk('button', 'pixel-btn', dirtyItems().length ? 'Next piece' : 'Back to the bench');
    again.onclick = list;
    b.append(done, again);
    extra?.();
  };
  let nodes;
  if (kind === 'assemble') nodes = assemble(e, art, () => finishAs());
  else nodes = scrub(e, kind, art, (afterBefore) => finishAs(afterBefore));
  b.replaceChildren(back, title, ...nodes);
}

/** Opens the studio. onClose fires when it closes. `entry` (an id) goes straight to that piece; `kind` overrides how it is worked. */
export function openStudio({ onClose, entry, kind } = {}) {
  if (!el) build();
  onDone = onClose;
  el.classList.remove('hidden');
  const hit = entry && dirtyItems().find((x) => x.entry.id === entry);
  if (hit) work(hit.entry, kind || hit.kind);
  else list();
}
export const studioOpen = () => !!el && !el.classList.contains('hidden');
window.__studio = { openStudio }; // lets tests open a piece directly
