// Dev page: every outdoor tile, animated, plus a sample island built from them
// and a download of the whole sheet (PNG + JSON with positions and frames).
import { buildTiles, CORNERS, T } from './tiles.js';

const tiles = buildTiles();
let frame = 0;
let zoom = 2;
let animate = true;
const cards = [];

const WALK = { walk: 'walkable', block: 'solid', water: 'water', grass: 'walk-through', ledge: 'hop down', push: 'pushable', over: 'drawn over people' };

function renderGroups() {
  const root = document.getElementById('groups');
  root.replaceChildren();
  cards.length = 0;
  const groups = {};
  Object.entries(tiles).forEach(([name, t]) => (groups[t.group] ||= []).push([name, t]));
  Object.entries(groups).forEach(([group, list]) => {
    const h = document.createElement('h2');
    h.textContent = `${group} (${list.length})`;
    root.appendChild(h);
    if (/on |bank/.test(group)) {
      const p = document.createElement('p');
      p.className = 'note';
      p.textContent = 'Corner tiles: the 4 digits say which corners (top-left, top-right, bottom-left, bottom-right) are covered by the top material. Together they make any shape.';
      root.appendChild(p);
    }
    const grid = document.createElement('div');
    grid.className = 'grid';
    list.forEach(([name, t]) => {
      const card = document.createElement('div');
      card.className = 'card';
      const c = document.createElement('canvas');
      c.width = t.w;
      c.height = t.h;
      c.style.width = `${t.w * zoom}px`;
      c.style.height = `${t.h * zoom}px`;
      card.append(c);
      card.insertAdjacentHTML('beforeend', `<b></b><code>${name}</code><small>${WALK[t.walk] || ''}${t.frames.length > 1 ? ` · ${t.frames.length} frames` : ''}</small>`);
      card.querySelector('b').textContent = t.label;
      grid.appendChild(card);
      cards.push({ c, t });
    });
    root.appendChild(grid);
  });
  drawCards();
}

function drawCards() {
  cards.forEach(({ c, t }) => {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(t.frames[frame % t.frames.length], 0, 0);
  });
}

// ---------- Sample island ----------
const W = 20;
const H = 16;
const hash = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
// Corner materials: 0 water, 1 sand, 2 grass, 3 pond
const corners = [];
for (let y = 0; y <= H; y++) {
  corners.push([]);
  for (let x = 0; x <= W; x++) {
    const d = Math.hypot((x - W / 2) / (W / 2.4), (y - H / 2) / (H / 2.4)) + (hash(x, y) - 0.5) * 0.18;
    let m = d < 0.62 ? 2 : d < 0.92 ? 1 : 0;
    if (x >= 5 && x <= 7 && y >= 6 && y <= 8) m = 3; // a little pond
    corners[y].push(m);
  }
}
const keyFor = (x, y, test) => [corners[y][x], corners[y][x + 1], corners[y + 1][x], corners[y + 1][x + 1]].map((m) => (test(m) ? 1 : 0)).join('');

function drawDemo() {
  const c = document.getElementById('demo');
  c.width = W * T;
  c.height = H * T;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const put = (name, x, y) => {
    const t = tiles[name];
    if (t) ctx.drawImage(t.frames[frame % t.frames.length], x * T, y * T);
  };
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      put('sand_1', x, y);
      const shore = keyFor(x, y, (m) => m === 0);
      if (shore === '1111') put('water', x, y);
      else if (shore !== '0000') put(`shore_${shore}`, x, y);
      const grass = keyFor(x, y, (m) => m >= 2);
      if (grass === '1111') put((x + y) % 3 ? 'grass_1' : 'grass_2', x, y);
      else if (grass !== '0000') put(`grass_sand_${grass}`, x, y);
      const pond = keyFor(x, y, (m) => m === 3);
      if (pond === '1111') put('water', x, y);
      else if (pond !== '0000') put(`bank_${pond}`, x, y);
    }
  // a rocky plateau with a cliff face and stairs
  for (let x = 10; x <= 14; x++) {
    put(x === 10 ? 'cliff_top_l' : x === 14 ? 'cliff_top_r' : 'cliff_top', x, 4);
    put(x === 10 ? 'cliff_face_l' : x === 14 ? 'cliff_face_r' : x === 12 ? 'cliff_stairs' : 'cliff_face', x, 5);
    put(x === 10 ? 'cliff_base_l' : x === 14 ? 'cliff_base_r' : x === 12 ? 'cliff_stairs' : 'cliff_base', x, 6);
  }
  put('chest', 13, 3);
  put('tall_grass', 7, 10);
  put('tall_grass', 8, 10);
  put('tall_grass', 8, 11);
  put('tall_grass', 9, 11);
  put('flowers', 11, 9);
  put('flowers', 12, 10);
  put('boulder', 14, 8);
  put('rocks_pile', 6, 4);
  put('lily', 6, 7);
  put('mushrooms', 9, 8);
  put('bush', 15, 10);
  put('dig_spot', 15, 13);
  put('shells', 4, 12);
  put('dune_grass', 3, 9);
  put('water_rock', 17, 2);
  put('bubbles', 2, 4);
  put('dock_h', 17, 12);
  put('dock_h', 18, 12);
  put('dock_h', 19, 12);
  put('dock_post', 19, 13);
  put('sign', 16, 12);
  // tall things last (drawn from their bottom tile up)
  const big = (name, x, y) => {
    const t = tiles[name];
    ctx.drawImage(t.frames[frame % t.frames.length], x * T, (y + 1) * T - t.h);
  };
  big('palm', 3, 6);
  big('palm', 15, 5);
  big('tree', 7, 4);
  big('pine', 16, 9);
  big('palm', 6, 13);
}

function download() {
  const list = Object.entries(tiles);
  const cols = 16;
  let x = 0;
  let y = 0;
  let rowH = 0;
  const meta = {};
  const placed = [];
  list.forEach(([name, t]) => {
    meta[name] = { group: t.group, label: t.label, walk: t.walk, w: t.w, h: t.h, frames: [] };
    t.frames.forEach((f) => {
      if (x + t.w > cols * T) {
        x = 0;
        y += rowH;
        rowH = 0;
      }
      meta[name].frames.push({ x, y });
      placed.push([f, x, y]);
      x += t.w;
      rowH = Math.max(rowH, t.h);
    });
  });
  const sheet = document.createElement('canvas');
  sheet.width = cols * T;
  sheet.height = y + rowH;
  const ctx = sheet.getContext('2d');
  placed.forEach(([f, px, py]) => ctx.drawImage(f, px, py));
  const save = (href, name) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
  };
  save(sheet.toDataURL('image/png'), 'island-tiles.png');
  save(URL.createObjectURL(new Blob([JSON.stringify({ tile: T, corners: CORNERS, tiles: meta }, null, 1)], { type: 'application/json' })), 'island-tiles.json');
}

document.getElementById('anim').onclick = (e) => {
  animate = !animate;
  e.target.classList.toggle('on', animate);
};
document.getElementById('zoom').onclick = (e) => {
  zoom = zoom === 2 ? 3 : zoom === 3 ? 1 : 2;
  e.target.textContent = `Zoom ${zoom}×`;
  renderGroups();
};
document.getElementById('png').onclick = download;

renderGroups();
drawDemo();
setInterval(() => {
  if (!animate) return;
  frame++;
  drawCards();
  drawDemo();
}, 260);
