// Digging: walk up to a dig spot, tap Dig, and brush the dirt off with your
// finger. What's underneath is a real mineral or fossil (those collections), and
// it goes into the journal. A spot rests for a while after it has been dug.
import { load, save } from './storage.js';
import { list, RARITY } from './collections/index.js';
import { collect } from './collections/codex.js';
import { drawEntry } from './collections/render.js';
import { sfx } from './music.js';
import { haptic } from './ui.js';

const KEY = 'curation.digs'; // { spotKey: readyAt (ms) }
const REST = 10 * 60 * 1000;
const SIZE = 240; // css px of the digging patch
const BRUSH = 22;

export const readyIn = (key, now = Date.now()) => Math.max(0, (load(KEY, {})[key] || 0) - now);

// Rarer finds turn up less often.
export function pick(entries = list({ collection: 'mineral' }), rnd = Math.random) {
  const w = entries.map((e) => 5 - (e.rarity || 1));
  let r = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < entries.length; i++) if ((r -= w[i]) <= 0) return entries[i];
  return entries[0];
}

let el = null;
function build() {
  el = document.createElement('div');
  el.id = 'dig';
  el.className = 'hidden';
  el.setAttribute('role', 'dialog');
  el.innerHTML = '<div class="dig-card"><b class="dig-title">Brush the dirt away</b><canvas class="dig-canvas"></canvas><span class="dig-meta"></span><p class="dig-note"></p><button class="dig-close main">Leave it</button></div>';
  document.body.appendChild(el);
}

/** Opens the digging patch. onClose({ found }) fires when it closes. */
export function startDig(key, { onClose, collection = 'mineral', entry = pick(list({ collection })) } = {}) {
  if (!el) build();
  const q = (s) => el.querySelector(s);
  const cv = q('.dig-canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = cv.height = SIZE * dpr;
  cv.style.width = cv.style.height = `${SIZE}px`;
  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.scale(dpr, dpr);

  // the mineral lies a little off-centre; nothing shows it until the dirt is gone
  const scale = 12;
  const art = drawEntry(entry, scale);
  const ax = Math.round((SIZE - art.width) / 2 + (Math.random() - 0.5) * 30);
  const ay = Math.round((SIZE - art.height) / 2 + (Math.random() - 0.5) * 30);
  const under = document.createElement('canvas');
  under.width = under.height = SIZE;
  const u = under.getContext('2d');
  u.fillStyle = '#6a4a2e';
  u.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 90; i++) {
    u.fillStyle = i % 2 ? '#5a3a20' : '#7a5a3a';
    u.fillRect(Math.random() * SIZE, Math.random() * SIZE, 6 + Math.random() * 10, 4);
  }
  u.drawImage(art, ax, ay);

  const dirt = document.createElement('canvas');
  dirt.width = dirt.height = SIZE;
  const d = dirt.getContext('2d');
  d.fillStyle = '#ad7c50';
  d.fillRect(0, 0, SIZE, SIZE);
  for (let i = 0; i < 260; i++) {
    d.fillStyle = ['#946640', '#c49464', '#d8ae7e', '#7a5232'][i % 4];
    d.fillRect(Math.round((Math.random() * SIZE) / 6) * 6, Math.round((Math.random() * SIZE) / 6) * 6, 6, 6);
  }
  const art2 = art.getContext('2d').getImageData(0, 0, art.width, art.height).data;
  const solid = [];
  for (let y = 0; y < art.height; y += 4) for (let x = 0; x < art.width; x += 4) if (art2[(y * art.width + x) * 4 + 3] > 100) solid.push([x + ax, y + ay]);

  let done = false;
  const render = () => {
    g.clearRect(0, 0, SIZE, SIZE);
    g.drawImage(under, 0, 0);
    if (!done) g.drawImage(dirt, 0, 0);
  };
  const cleared = () => {
    const px = d.getImageData(0, 0, SIZE, SIZE).data;
    return solid.filter(([x, y]) => px[(y * SIZE + x) * 4 + 3] < 40).length / solid.length;
  };
  const finish = () => {
    done = true;
    render();
    const got = collect(entry.id);
    sfx('unlock');
    haptic?.();
    q('.dig-title').textContent = `You found ${/^[aeiou]/i.test(entry.title) ? 'an' : 'a'} ${entry.title}!`;
    q('.dig-meta').innerHTML = `<span class="r${entry.rarity}">${RARITY[entry.rarity]}</span>${!got || got.fresh ? ' · <b class="catch-new">New!</b>' : ''}`;
    q('.dig-note').textContent = entry.blurb || '';
    q('.dig-close').textContent = 'Nice';
    const t = load(KEY, {});
    t[key] = Date.now() + REST;
    save(KEY, t);
  };

  let last = null;
  let moves = 0;
  const at = (e) => {
    const r = cv.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE];
  };
  const brush = ([x, y]) => {
    d.globalCompositeOperation = 'destination-out';
    d.lineCap = d.lineJoin = 'round';
    d.lineWidth = BRUSH;
    d.beginPath();
    d.moveTo(...(last || [x, y]));
    d.lineTo(x, y);
    d.stroke();
    last = [x, y];
    render();
    if (++moves % 6 === 0 && !done && cleared() >= 0.7) finish();
  };
  cv.onpointerdown = (e) => {
    if (done) return;
    cv.setPointerCapture?.(e.pointerId);
    last = null;
    brush(at(e));
    sfx('talk');
  };
  cv.onpointermove = (e) => e.buttons && !done && brush(at(e));
  cv.onpointerup = cv.onpointercancel = () => {
    last = null;
    if (!done && moves && cleared() >= 0.7) finish();
  };

  q('.dig-title').textContent = 'Brush the dirt away';
  q('.dig-meta').textContent = 'Drag across the dirt. Something is down there.';
  q('.dig-note').textContent = '';
  q('.dig-close').textContent = 'Leave it';
  render();
  el.classList.remove('hidden');
  q('.dig-close').onclick = () => {
    el.classList.add('hidden');
    onClose?.({ found: done ? entry : null });
  };
  return { entry, cleared, finish, canvas: cv, dirt };
}

export const digOpen = () => !!el && !el.classList.contains('hidden');
