// Map builder for phones: paint whole islands (terrain with automatic
// shorelines, paths and pond banks, exactly as the game draws them) or rooms,
// on a grid up to 700 × 700 tiles, then save a picture or a map file.
// Layers, bottom to top: terrain corners (islands), a tile layer (ground and
// floor tiles), and pieces standing on the map (trees, buildings, furniture).
// Pieces come from the game's island tiles (src/tiles.js) and the room pieces
// cut from the free packs (public/builder, tools/build_palette.py).
import { buildTiles, T } from '../tiles.js';
import { backup, backupsFor, latestBackup, keepStorage } from './vault.js';
import recovered from './recovered.json';
import { BIG_MAP, packCells, withTiles, hasTiles } from '../mapformat.js';

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const STORE = 'curation.mapbuilder.maps';
const CURRENT = 'curation.mapbuilder.current';
const VIEW = 'curation.mapbuilder.view';
const MAX = 700; // maps can be big; the New map boxes stay at 300
const C = 8; // cells per cached ground chunk
const MATS = [
  { m: 2, name: 'Grass', color: '#5aa84e' },
  { m: 1, name: 'Sand', color: '#e2c68a' },
  { m: 0, name: 'Sea', color: '#3c80c0' },
  { m: 3, name: 'Pond', color: '#4a9ad8' },
  { m: 4, name: 'Dirt path', color: '#b08458' },
];
const FLAT_GROUPS = ['Ground', 'Paths', 'Water', 'Cliffs & ledges'];
// palette lists that are really one: shown together under the first name
const MERGE = { Plants: 'Flowers & plants', 'Grounds & garden': 'Garden & park' };
const SKIP_GROUP = /on |bank|Shoreline/; // the corner pieces terrain picks for you

let TILES = null;
let ROOM = null; // pieces.json
let NEW = []; // refs listed in public/builder/whatsnew.json
const FAMILY = {}; // ref -> its turning family (rotations.json): the same object seen from each side
const PIECES = {}; // ref -> { img, sx, sy, w, h, layer: 'tile' | 'object', label, src }
let map = null;
let chosen = null; // a ref: 'm:2' terrain, 't:palm' island tile, 'p:seating/3' room piece
let tool = 'paint';
let flip = false;
let selected = null;
const view = { x: 0, y: 0, z: 1 }; // screen = world * z + (x, y), in css px
const undoStack = [];
const redoStack = [];

// ---------- the map ----------
function blankMap(kind, w, h) {
  w = clamp(w | 0, 8, MAX);
  h = clamp(h | 0, 8, MAX);
  const m = { name: kind === 'island' ? 'Untitled island' : 'Untitled room', kind, w, h, corners: new Uint8Array((w + 1) * (h + 1)), tiles: new Array(w * h).fill(null), objects: [] };
  if (kind === 'island') {
    // a starter island in the middle of the sea
    const cx = w / 2;
    const cy = h / 2;
    for (let y = 0; y <= h; y++)
      for (let x = 0; x <= w; x++) {
        const d = Math.hypot((x - cx) / (w * 0.32), (y - cy) / (h * 0.32));
        m.corners[y * (w + 1) + x] = d < 0.75 ? 2 : d < 1 ? 1 : 0;
      }
  } else m.tiles.fill(ROOM ? 'p:floors/4' : null);
  return m;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const corner = (x, y) => (x < 0 || y < 0 || x > map.w || y > map.h ? 0 : map.corners[y * (map.w + 1) + x]);
// grass never meets the sea directly: there's always a little beach
function eff(x, y) {
  const m = corner(x, y);
  if (m !== 2 || map.kind !== 'island') return m;
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && corner(x + dx, y + dy) === 0) return 1;
  return m;
}
const key = (x, y, test) => [eff(x, y), eff(x + 1, y), eff(x, y + 1), eff(x + 1, y + 1)].map((m) => (test(m) ? 1 : 0)).join('');

// what the game paints on a cell, bottom to top (as IslandScene.drawGround)
function groundNames(x, y) {
  const out = [(x * 7 + y * 3) % 5 ? 'sand_1' : 'sand_2'];
  const shore = key(x, y, (m) => m === 0);
  if (shore === '1111') out.push('water');
  else if (shore !== '0000') out.push(`shore_${shore}`);
  const grass = key(x, y, (m) => m >= 2);
  const path = key(x, y, (m) => m === 4);
  if (path !== '0000') {
    out.push('dirt_1');
    const g = key(x, y, (m) => m === 2 || m === 3);
    if (g !== '0000') out.push(`grass_dirt_${g}`);
  } else if (grass === '1111') out.push(['grass_1', 'grass_2', 'grass_1', 'grass_3'][(x * 3 + y * 5) % 4]);
  else if (grass !== '0000') out.push(`grass_sand_${grass}`);
  const pond = key(x, y, (m) => m === 3);
  if (pond === '1111') out.push('water');
  else if (pond !== '0000') out.push(`bank_${pond}`);
  return out;
}

// ---------- pieces ----------
async function loadPieces() {
  TILES = buildTiles();
  Object.entries(TILES).forEach(([name, t]) => {
    if (name.includes('@')) return;
    const flat = t.w === T && t.h === T && FLAT_GROUPS.includes(t.group);
    PIECES[`t:${name}`] = { img: t.frames[0], sx: 0, sy: 0, w: t.w, h: t.h, layer: flat ? 'tile' : 'object', label: t.label || name, group: t.group, skip: SKIP_GROUP.test(t.group || '') };
  });
  try {
    try {
      (await (await fetch('./builder/rotations.json')).json()).families.forEach((f) => f.forEach((ref) => (FAMILY[ref] = f)));
    } catch (e) {
      /* no families: nothing turns */
    }
    try {
      NEW = (await (await fetch('./builder/whatsnew.json')).json()).refs || [];
    } catch (e) {
      /* no what's new row */
    }
    ROOM = await (await fetch('./builder/pieces.json')).json();
    await Promise.all(
      ROOM.groups.map(
        (g) =>
          new Promise((res) => {
            const img = new Image();
            img.onload = res;
            img.onerror = res;
            img.src = `./${g.sheet}`;
            g.pieces.forEach((p) => {
              PIECES[`p:${p.id}`] = { img, sx: p.x, sy: p.y, w: p.w, h: p.h, layer: g.kind === 'tile' || g.kind === 'wall' ? 'tile' : 'object', label: `${g.name} ${p.id.split('/')[1]}`, src: p.pack, flat: g.kind === 'flat' };
            });
          }),
      ),
    );
  } catch {
    ROOM = null; // the island tiles still work
  }
}

const drawRef = (c, ref, x, y, w, h) => {
  const p = PIECES[ref];
  if (p) c.drawImage(p.img, p.sx, p.sy, p.w, p.h, x, y, w ?? p.w, h ?? p.h);
};

function thumb(ref, size) {
  const c = document.createElement('canvas');
  if (ref.startsWith('m:')) {
    c.width = c.height = 2;
    const g = c.getContext('2d');
    g.fillStyle = MATS.find((m) => `m:${m.m}` === ref).color;
    g.fillRect(0, 0, 2, 2);
    c.className = 'swatch';
    return c;
  }
  const p = PIECES[ref];
  const k = Math.min(size / p.w, size / p.h, 3);
  c.width = Math.max(1, Math.round(p.w * k));
  c.height = Math.max(1, Math.round(p.h * k));
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(p.img, p.sx, p.sy, p.w, p.h, 0, 0, c.width, c.height);
  return c;
}

// one average colour per piece, for the zoomed-out view
const avgCache = {};
function avg(ref) {
  if (avgCache[ref]) return avgCache[ref];
  const p = PIECES[ref];
  if (!p) return (avgCache[ref] = '#000');
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const g = c.getContext('2d');
  g.drawImage(p.img, p.sx, p.sy, p.w, p.h, 0, 0, 4, 4);
  const d = g.getImageData(0, 0, 4, 4).data;
  let r = 0;
  let gg = 0;
  let b = 0;
  let n = 0;
  for (let i = 0; i < d.length; i += 4)
    if (d[i + 3] > 40) {
      r += d[i];
      gg += d[i + 1];
      b += d[i + 2];
      n++;
    }
  return (avgCache[ref] = n ? `rgb(${(r / n) | 0},${(gg / n) | 0},${(b / n) | 0})` : 'rgba(0,0,0,0)');
}

// ---------- the palette (dropdowns) ----------
function pieceButton(ref) {
  const b = document.createElement('button');
  b.className = 'piece';
  b.dataset.ref = ref;
  const pic = document.createElement('div');
  pic.className = 'pic';
  pic.appendChild(thumb(ref, 72));
  if (FAMILY[ref]) {
    const badge = document.createElement('i');
    badge.className = 'turnbadge';
    badge.textContent = '⟳';
    pic.appendChild(badge);
  }
  b.appendChild(pic);
  const name = ref.startsWith('m:') ? MATS.find((m) => `m:${m.m}` === ref).name : ref.startsWith('t:') ? PIECES[ref].label : '';
  if (name) {
    const sp = document.createElement('span');
    sp.textContent = name;
    b.appendChild(sp);
  }
  b.title = name || PIECES[ref]?.label || '';
  b.onclick = () => choose(ref);
  return b;
}

function buildPalette() {
  const pal = $('palette');
  const lists = [];
  pal.innerHTML = '<input id="search" type="search" placeholder="Search pieces…" autocomplete="off" /><div id="results" class="pieces" hidden></div><div id="quick"></div>';
  const search = $('search');
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    const box = $('results');
    box.hidden = !q;
    $('quick').hidden = !!q;
    pal.querySelectorAll('details').forEach((d) => (d.hidden = !!q));
    box.innerHTML = '';
    if (!q) return;
    const words = q.split(/\s+/);
    const hits = Object.keys(PIECES).filter((ref) => {
      const p = PIECES[ref];
      if (p.skip || (FAMILY[ref] && FAMILY[ref][0] !== ref)) return false;
      const hay = `${p.label} ${p.group || ''} ${ref}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    hits.slice(0, 80).forEach((ref) => box.appendChild(pieceButton(ref)));
    if (!hits.length) box.innerHTML = '<p class="none">Nothing matches.</p>';
    markChosen();
  };
  refreshQuick();
  NEW = NEW.filter((r) => PIECES[r]);
  if (NEW.length) lists.push({ name: "What's new", refs: NEW });
  lists.push({ name: 'Terrain', refs: MATS.map((m) => `m:${m.m}`) });
  const byGroup = {};
  Object.entries(PIECES).forEach(([ref, p]) => {
    if (!ref.startsWith('t:') || p.skip || ref === 't:tall_grass_front') return; // (tall grass draws its own front)
    const name = p.layer === 'tile' ? `Ground: ${p.group}` : MERGE[p.group] || p.group || 'Other';
    (byGroup[name] ||= []).push(ref);
  });
  const order = ['Ground: Ground', 'Ground: Paths', 'Ground: Water', 'Buildings', 'People', 'Animals', 'Trees', 'Plants', 'Flowers & plants', 'Rocks', 'Buildings', 'Garden & park', 'Grounds & garden', 'Props', 'Puzzles', 'Ground: Cliffs & ledges', 'Cliffs & ledges'];
  Object.keys(byGroup)
    .sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99))
    .forEach((name) => lists.push({ name: name.replace('Ground: Ground', 'Ground tiles').replace('Ground: Cliffs & ledges', 'Cliff ground pieces').replace('Ground: ', ''), refs: byGroup[name] }));
  (ROOM?.groups || []).forEach((g) => lists.push({ name: `Room: ${g.name}`, refs: g.pieces.map((p) => `p:${p.id}`) }));
  lists.forEach((list, li) => {
    const det = document.createElement('details');
    det.innerHTML = `<summary>${list.name}<small>${list.refs.filter((r) => !FAMILY[r] || FAMILY[r][0] === r).length}</small></summary><div class="pieces"></div>`;
    const grid = det.querySelector('.pieces');
    let built = false;
    det.addEventListener('toggle', () => {
      if (!det.open) return;
      pal.querySelectorAll('details[open]').forEach((d) => d !== det && (d.open = false)); // one list open at a time
      if (!built) {
        built = true;
        list.refs.forEach((ref) => {
          if (FAMILY[ref] && FAMILY[ref][0] !== ref) return; // a family is one entry; Turn shows the other sides
          grid.appendChild(pieceButton(ref));
        });
        markChosen();
      }
      setTimeout(() => det.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30);
    });
    if (li === 0) det.open = true;
    pal.appendChild(det);
  });
}

// favourites (starred) and recently used pieces sit at the top of the palette
const loadList = (k) => {
  try {
    const v = JSON.parse(localStorage.getItem(k) || '[]');
    return Array.isArray(v) ? v.filter((r) => typeof r === 'string') : [];
  } catch {
    return [];
  }
};
const saveList = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage full or blocked: the lists are a convenience */
  }
};
function refreshQuick() {
  const q = $('quick');
  if (!q) return;
  q.innerHTML = '';
  [['Favourites', 'curation.mapbuilder.favs'], ['Recently used', 'curation.mapbuilder.recent']].forEach(([title, k]) => {
    const refs = loadList(k).filter((r) => r.startsWith('m:') || PIECES[r]);
    if (!refs.length) return;
    const h = document.createElement('div');
    h.className = 'quickhead';
    h.textContent = title;
    const row = document.createElement('div');
    row.className = 'pieces quickrow';
    refs.forEach((r) => row.appendChild(pieceButton(r)));
    q.append(h, row);
  });
  markChosen();
}
function toggleFav() {
  if (!chosen) return;
  const favs = loadList('curation.mapbuilder.favs');
  const i = favs.indexOf(chosen);
  if (i >= 0) favs.splice(i, 1);
  else favs.unshift(chosen);
  saveList('curation.mapbuilder.favs', favs);
  showChosen();
  refreshQuick();
}
function noteRecent(ref) {
  const r = loadList('curation.mapbuilder.recent').filter((x) => x !== ref);
  r.unshift(ref);
  saveList('curation.mapbuilder.recent', r.slice(0, 12));
}

function choose(ref) {
  chosen = ref;
  noteRecent(ref);
  refreshQuick();
  if (tool !== 'paint' && tool !== 'fill') setTool('paint');
  markChosen();
  showChosen();
}
function markChosen() {
  document.querySelectorAll('.piece').forEach((b) => b.classList.toggle('on', b.dataset.ref === (FAMILY[chosen]?.[0] || chosen)));
}
function refLabel(ref) {
  if (ref.startsWith('m:')) return MATS.find((m) => `m:${m.m}` === ref).name;
  return PIECES[ref]?.label || ref;
}
function showChosen() {
  const c = $('chosen-pic');
  const g = c.getContext('2d');
  g.clearRect(0, 0, 48, 48);
  if (!chosen) return;
  const t = thumb(chosen, 44);
  g.imageSmoothingEnabled = false;
  g.save();
  if (flip) {
    g.translate(48, 0);
    g.scale(-1, 1);
  }
  if (chosen.startsWith('m:')) g.drawImage(t, 0, 0, 48, 48);
  else g.drawImage(t, (48 - t.width) / 2, (48 - t.height) / 2);
  g.restore();
  $('chosen-name').textContent = refLabel(chosen);
  $('chosen-turn').hidden = !FAMILY[chosen];
  $('chosen-fav').textContent = loadList('curation.mapbuilder.favs').includes(chosen) ? '★' : '☆';
  $('chosen-fav').hidden = false;
  const p = PIECES[chosen];
  $('chosen-meta').textContent = chosen.startsWith('m:') ? 'Terrain · shores and edges draw themselves' : p.layer === 'tile' ? 'Ground tile · drag to paint' : `Piece · ${Math.ceil(p.w / T)}×${Math.ceil(p.h / T)} tiles · tap to place${flip ? ' · flipped' : ''}${FAMILY[chosen] ? ' · ⟳ turns it' : ''}`;
}

// ---------- drawing ----------
const chunks = new Map(); // "cx,cy" -> canvas, oldest first
let overview = null;
function chunk(cx, cy) {
  const k = `${cx},${cy}`;
  let c = chunks.get(k);
  if (c) {
    chunks.delete(k);
    chunks.set(k, c); // most recently used
    return c;
  }
  c = document.createElement('canvas');
  c.width = c.height = C * T;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  for (let y = cy * C; y < Math.min(map.h, cy * C + C); y++)
    for (let x = cx * C; x < Math.min(map.w, cx * C + C); x++) {
      const px = (x - cx * C) * T;
      const py = (y - cy * C) * T;
      if (map.kind === 'island') groundNames(x, y).forEach((n) => TILES[n] && g.drawImage(TILES[n].frames[0], px, py));
      else {
        g.fillStyle = '#2a211b';
        g.fillRect(px, py, T, T);
      }
      const ref = map.tiles[y * map.w + x];
      if (ref && showTiles) drawRef(g, ref, px, py, T, T);
    }
  chunks.set(k, c);
  while (chunks.size > 160) chunks.delete(chunks.keys().next().value);
  return c;
}
// a cell changed: forget the chunks that show it (and its neighbours' edges)
function dirty(x0, y0, x1, y1) {
  for (let cy = Math.floor((y0 - 1) / C); cy <= Math.floor((y1 + 1) / C); cy++) for (let cx = Math.floor((x0 - 1) / C); cx <= Math.floor((x1 + 1) / C); cx++) chunks.delete(`${cx},${cy}`);
  if (overview) for (let y = Math.max(0, y0 - 1); y <= Math.min(map.h - 1, y1 + 1); y++) for (let x = Math.max(0, x0 - 1); x <= Math.min(map.w - 1, x1 + 1); x++) paintOverview(x, y);
}
function paintOverview(x, y) {
  const g = overview.getContext('2d');
  const ref = map.tiles[y * map.w + x];
  let color;
  if (ref) color = avg(ref);
  else if (map.kind === 'island') {
    const names = groundNames(x, y);
    const top = names[names.length - 1];
    color = avg(`t:${top.startsWith('shore_') ? (top.slice(6).split('1').length > 2 ? 'water' : 'sand_1') : top.startsWith('grass_sand_') ? 'grass_1' : top.startsWith('bank_') ? 'water' : top}`);
  } else color = '#2a211b';
  g.fillStyle = color;
  g.fillRect(x * 4, y * 4, 4, 4);
}
function rebuildAll() {
  chunks.clear();
  overview = document.createElement('canvas');
  overview.width = map.w * 4;
  overview.height = map.h * 4;
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) paintOverview(x, y);
}

function resize() {
  const r = $('view').getBoundingClientRect();
  const dpr = Math.min(3, window.devicePixelRatio || 1);
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  draw();
}

function fit() {
  const r = $('view').getBoundingClientRect();
  // start close enough to see the tiles: about 12 tiles across
  view.z = clamp(r.width / (12 * T), 0.05, 6);
  view.x = r.width / 2 - (map.w * T * view.z) / 2;
  view.y = r.height / 2 - (map.h * T * view.z) / 2;
  draw();
}

const objectBox = (o) => {
  const p = PIECES[o.ref];
  return p ? { x0: o.x, y0: o.y, x1: o.x + p.w, y1: o.y + p.h } : null;
};
const sorted = () =>
  map.objects
    .map((o, i) => ({ o, i, p: PIECES[o.ref] }))
    .filter((e) => e.p)
    .sort((a, b) => (a.p.flat ? 0 : 1) - (b.p.flat ? 0 : 1) || a.o.y + a.p.h - (b.o.y + b.p.h) || a.i - b.i)
    .map((e) => e.o);

function drawObj(g, o, alpha = 1) {
  const p = PIECES[o.ref];
  if (!p) return;
  g.globalAlpha = alpha;
  if (o.flip) {
    g.save();
    g.translate(o.x + p.w, o.y);
    g.scale(-1, 1);
    g.drawImage(p.img, p.sx, p.sy, p.w, p.h, 0, 0, p.w, p.h);
    g.restore();
  } else g.drawImage(p.img, p.sx, p.sy, p.w, p.h, o.x, o.y, p.w, p.h);
  g.globalAlpha = 1;
}

let showTiles = true; // layers view (menu → Options)
let showObjs = true;
let area = null; // the chosen region, in cells: { x0, y0, x1, y1 }
let clip = null; // copied region: { w, h, tiles, corners, objects }
let pasteArmed = false;
let ghost = null; // a piece being placed: { ref, x, y, flip }
let raf = 0;
function draw() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    render();
  });
}
function render() {
  if (!map) return;
  const dpr = canvas.width / $('view').getBoundingClientRect().width || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = map.kind === 'island' ? '#1e4a7a' : '#0d0a08';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr * view.z, 0, 0, dpr * view.z, dpr * view.x, dpr * view.y);
  ctx.imageSmoothingEnabled = false;
  // the visible part of the map, in world px
  const wx0 = -view.x / view.z;
  const wy0 = -view.y / view.z;
  const wx1 = wx0 + canvas.width / dpr / view.z;
  const wy1 = wy0 + canvas.height / dpr / view.z;
  if (view.z * T < 7) {
    // far out: the overview, one colour per tile
    ctx.drawImage(overview, 0, 0, map.w * T, map.h * T);
  } else {
    for (let cy = Math.max(0, Math.floor(wy0 / (C * T))); cy <= Math.min(Math.ceil(map.h / C) - 1, Math.floor(wy1 / (C * T))); cy++)
      for (let cx = Math.max(0, Math.floor(wx0 / (C * T))); cx <= Math.min(Math.ceil(map.w / C) - 1, Math.floor(wx1 / (C * T))); cx++) ctx.drawImage(chunk(cx, cy), cx * C * T, cy * C * T);
  }
  // pieces standing on the map, back to front
  if (showObjs)
    sorted().forEach((o) => {
    const b = objectBox(o);
    if (b.x1 < wx0 || b.x0 > wx1 || b.y1 < wy0 || b.y0 > wy1) return;
    drawObj(ctx, o);
  });
  if (ghost) drawObj(ctx, ghost, 0.7);
  // grid
  if ($('grid-toggle').checked && view.z * T >= 14) {
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1 / view.z;
    ctx.beginPath();
    for (let x = Math.max(0, Math.floor(wx0 / T)); x <= Math.min(map.w, Math.ceil(wx1 / T)); x++) {
      ctx.moveTo(x * T, Math.max(0, wy0));
      ctx.lineTo(x * T, Math.min(map.h * T, wy1));
    }
    for (let y = Math.max(0, Math.floor(wy0 / T)); y <= Math.min(map.h, Math.ceil(wy1 / T)); y++) {
      ctx.moveTo(Math.max(0, wx0), y * T);
      ctx.lineTo(Math.min(map.w * T, wx1), y * T);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(232,200,103,0.7)';
  ctx.lineWidth = 2 / view.z;
  ctx.strokeRect(0, 0, map.w * T, map.h * T);
  if (selected && map.objects.includes(selected)) {
    const b = objectBox(selected);
    ctx.strokeStyle = '#e8c867';
    ctx.setLineDash([4 / view.z, 3 / view.z]);
    ctx.strokeRect(b.x0 - 1, b.y0 - 1, b.x1 - b.x0 + 2, b.y1 - b.y0 + 2);
    ctx.setLineDash([]);
  }
  if (area) {
    ctx.fillStyle = 'rgba(232,200,103,0.18)';
    ctx.fillRect(area.x0 * T, area.y0 * T, (area.x1 - area.x0 + 1) * T, (area.y1 - area.y0 + 1) * T);
    ctx.strokeStyle = '#e8c867';
    ctx.setLineDash([4 / view.z, 3 / view.z]);
    ctx.lineWidth = 2 / view.z;
    ctx.strokeRect(area.x0 * T, area.y0 * T, (area.x1 - area.x0 + 1) * T, (area.y1 - area.y0 + 1) * T);
    ctx.setLineDash([]);
  }
  if (brushAt) {
    const n = brushSize();
    ctx.strokeStyle = tool === 'erase' ? '#e0405a' : '#e8c867';
    ctx.strokeRect(brushAt.x * T, brushAt.y * T, n * T, n * T);
  }
  const t = savedAt && new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  $('zoom-chip').textContent = `${Math.round(view.z * 100)}% · ${map.w}×${map.h}${t ? ` · autosaved ${t}` : ''}`;
}

// ---------- editing ----------
const brushSize = () => (tool === 'paint' && chosen && PIECES[chosen]?.layer === 'object' ? 1 : Number($('brush').value));
let brushAt = null;
const cellAt = (wx, wy) => ({ x: Math.floor(wx / T), y: Math.floor(wy / T) });

function paintCells(wx, wy) {
  const n = brushSize();
  const c = cellAt(wx, wy);
  const x0 = c.x - Math.floor((n - 1) / 2);
  const y0 = c.y - Math.floor((n - 1) / 2);
  brushAt = { x: x0, y: y0 };
  let changed = false;
  if (chosen.startsWith('m:')) {
    if (map.kind !== 'island') return toast('Terrain is for islands. Start a new island from the menu.');
    const m = Number(chosen.slice(2));
    for (let y = y0; y <= y0 + n; y++)
      for (let x = x0; x <= x0 + n; x++) {
        if (x < 0 || y < 0 || x > map.w || y > map.h) continue;
        const i = y * (map.w + 1) + x;
        if (map.corners[i] !== m) {
          map.corners[i] = m;
          changed = true;
        }
      }
  } else {
    for (let y = y0; y < y0 + n; y++)
      for (let x = x0; x < x0 + n; x++) {
        if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
        const i = y * map.w + x;
        if (map.tiles[i] !== chosen) {
          map.tiles[i] = chosen;
          changed = true;
        }
      }
  }
  if (changed) dirty(x0, y0, x0 + n, y0 + n);
  return changed;
}

function hitObject(wx, wy) {
  return sorted()
    .reverse()
    .find((o) => {
      const b = objectBox(o);
      return wx >= b.x0 && wx < b.x1 && wy >= b.y0 && wy < b.y1;
    });
}

function eraseAt(wx, wy) {
  const o = hitObject(wx, wy);
  if (o) {
    map.objects.splice(map.objects.indexOf(o), 1);
    if (selected === o) select(null);
    return true;
  }
  const n = Number($('brush').value);
  const c = cellAt(wx, wy);
  const x0 = c.x - Math.floor((n - 1) / 2);
  const y0 = c.y - Math.floor((n - 1) / 2);
  brushAt = { x: x0, y: y0 };
  let changed = false;
  for (let y = y0; y < y0 + n; y++)
    for (let x = x0; x < x0 + n; x++) {
      if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
      if (map.tiles[y * map.w + x]) {
        map.tiles[y * map.w + x] = null;
        changed = true;
      }
    }
  if (changed) dirty(x0, y0, x0 + n, y0 + n);
  return changed;
}

function fillAt(wx, wy) {
  if (!chosen) return toast('Pick a terrain or a ground tile first.');
  const c = cellAt(wx, wy);
  if (chosen.startsWith('m:')) {
    if (map.kind !== 'island') return toast('Terrain is for islands.');
    const m = Number(chosen.slice(2));
    const W = map.w + 1;
    const sx = clamp(Math.round(wx / T), 0, map.w);
    const sy = clamp(Math.round(wy / T), 0, map.h);
    const from = map.corners[sy * W + sx];
    if (from === m) return;
    record();
    const q = [[sx, sy]];
    while (q.length) {
      const [x, y] = q.pop();
      if (x < 0 || y < 0 || x > map.w || y > map.h || map.corners[y * W + x] !== from) continue;
      map.corners[y * W + x] = m;
      q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    rebuildAll();
    return changed();
  }
  const p = PIECES[chosen];
  if (p.layer !== 'tile') return toast('Fill works with terrain and ground tiles.');
  if (c.x < 0 || c.y < 0 || c.x >= map.w || c.y >= map.h) return;
  const from = map.tiles[c.y * map.w + c.x];
  if (from === chosen) return;
  record();
  const q = [[c.x, c.y]];
  let n = 0;
  while (q.length && n < MAX * MAX) {
    const [x, y] = q.pop();
    if (x < 0 || y < 0 || x >= map.w || y >= map.h || map.tiles[y * map.w + x] !== from) continue;
    map.tiles[y * map.w + x] = chosen;
    n++;
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  rebuildAll();
  changed();
}

function pickAt(wx, wy) {
  const o = hitObject(wx, wy);
  if (o) {
    flip = !!o.flip;
    return choose(o.ref);
  }
  const c = cellAt(wx, wy);
  if (c.x < 0 || c.y < 0 || c.x >= map.w || c.y >= map.h) return;
  const ref = map.tiles[c.y * map.w + c.x];
  if (ref) return choose(ref);
  if (map.kind === 'island') choose(`m:${corner(Math.round(wx / T), Math.round(wy / T))}`);
}

// where a piece goes for a finger at (wx, wy): island pieces stand on the
// tile under the finger; room pieces follow the snap setting
function placeFor(ref, wx, wy) {
  const p = PIECES[ref];
  if (ref.startsWith('t:')) {
    const c = cellAt(wx, wy);
    return { x: c.x * T, y: (c.y + 1) * T - p.h };
  }
  const s = Number($('snap').value);
  const bottom = s === 1 ? Math.round(wy + p.h / 2) : Math.ceil(wy / s) * s;
  return { x: s === 1 ? Math.round(wx - p.w / 2) : Math.round((wx - p.w / 2) / s) * s, y: bottom - p.h };
}

function select(o) {
  selected = o;
  $('selbar').hidden = !o;
  if (o) $('sel-text').textContent = refLabel(o.ref);
  $('sel-turn').hidden = !(o && FAMILY[o.ref]);
  draw();
}

// ---------- history and saving ----------
function serialize() {
  const rows = [];
  for (let y = 0; y <= map.h; y++) rows.push(Array.from(map.corners.subarray(y * (map.w + 1), (y + 1) * (map.w + 1))).join(''));
  let tiles = {};
  let tileRows;
  // big maps store the tile layer packed (see mapformat.js), small ones as a plain list
  if (map.w * map.h >= BIG_MAP) tileRows = packCells(map.tiles, map.w, map.h, map.keep?.tiles);
  if (!tileRows) {
    map.tiles.forEach((r, i) => r && (tiles[`${i % map.w},${Math.floor(i / map.w)}`] = r));
    Object.assign(tiles, map.keep?.tiles);
  }
  const objects = sorted().map((o) => ({ ref: o.ref, x: o.x, y: o.y, ...(o.flip ? { flip: true } : {}) }));
  return { format: 'curation-map', version: 2, tile: T, name: map.name, kind: map.kind, w: map.w, h: map.h, corners: map.kind === 'island' ? rows : [], tiles, ...(tileRows ? { tileRows } : {}), objects: objects.concat(map.keep?.objects || []) };
}
function deserialize(d) {
  d = withTiles(d);
  // older room files from the first builder
  if (d.format === 'curation-room') {
    const w = d.w;
    const flat = (g) => (Array.isArray(g?.[0]) ? g.flat() : g || []);
    const floor = flat(d.floor);
    const wall = flat(d.wall);
    const tiles = {};
    floor.forEach((r, i) => (wall[i] || r) && (tiles[`${i % w},${Math.floor(i / w)}`] = `p:${wall[i] || r}`));
    d = { name: d.name, kind: 'room', w, h: d.h, corners: [], tiles, objects: (d.items || []).map((it) => ({ ref: `p:${it.id}`, x: it.x, y: it.y, flip: it.flip })) };
  }
  const m = blankMap(d.kind === 'room' ? 'room' : 'island', d.w, d.h);
  m.tiles.fill(null);
  m.name = String(d.name || m.name).slice(0, 60);
  (d.corners || []).forEach((row, y) => [...String(row)].forEach((ch, x) => x <= m.w && y <= m.h && (m.corners[y * (m.w + 1) + x] = Number(ch) || 0)));
  // pieces that didn't load (a bad connection) are kept as they are, not dropped
  m.keep = { tiles: {}, objects: [] };
  Object.entries(d.tiles || {}).forEach(([k, r]) => {
    const [x, y] = k.split(',').map(Number);
    if (x < m.w && y < m.h) PIECES[r] ? (m.tiles[y * m.w + x] = r) : (m.keep.tiles[k] = r);
  });
  (d.objects || []).forEach((o) => (PIECES[o.ref] ? m.objects : m.keep.objects).push({ ref: o.ref, x: Math.round(o.x), y: Math.round(o.y), ...(o.flip ? { flip: true } : {}) }));
  m.objects.forEach((o) => (o.flip = !!o.flip));
  return m;
}
function record() {
  undoStack.push(JSON.stringify(serialize()));
  if (undoStack.length > 40) undoStack.shift();
  redoStack.length = 0;
}
// Work is saved the moment it changes: to this phone's storage, plus a
// history of earlier versions in a second store (vault.js) so nothing is lost
// if the page reloads or the phone clears one of them.
let savedAt = 0;
function changed() {
  saveLocal();
  draw();
}
function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || '{}');
  } catch {
    return {};
  }
}
function saveLocal() {
  if (!map) return;
  const data = { ...serialize(), saved: Date.now() };
  try {
    const all = readAll();
    all[map.name] = data;
    localStorage.setItem(STORE, JSON.stringify(all));
    localStorage.setItem(CURRENT, map.name);
    savedAt = data.saved;
  } catch {
    toast('Phone storage is full. Use Save map file now.');
  }
  backup(data);
  saveView();
}
function saveView() {
  try {
    localStorage.setItem(VIEW, JSON.stringify({ name: map.name, ...view }));
  } catch {
    // fine
  }
}
// the phone may close the page any time it's in the background
const flush = () => map && saveLocal();
document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
window.addEventListener('pagehide', flush);
window.addEventListener('blur', flush);
function loadMap(m, keepView) {
  map = m;
  area = null;
  pasteArmed = false;
  select(null);
  $('map-name').textContent = map.name;
  rebuildAll();
  if (!keepView) fit();
  draw();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(serialize()));
  loadMap(deserialize(JSON.parse(undoStack.pop())), true);
  changed();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(serialize()));
  loadMap(deserialize(JSON.parse(redoStack.pop())), true);
  changed();
}

const fileName = (ext) => `${map.name.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'map'}${ext}`;
async function saveBlob(blob, name) {
  // phones: the share sheet (Save to Files, AirDrop, Messages…); else a download
  const file = new File([blob], name, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      return;
    } catch (e) {
      if (e.name === 'AbortError') return;
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}
function savePicture() {
  const scale = Math.min(1, 4096 / (Math.max(map.w, map.h) * T)); // phones can't make huge pictures
  const c = document.createElement('canvas');
  c.width = Math.round(map.w * T * scale);
  c.height = Math.round(map.h * T * scale);
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.scale(scale, scale);
  for (let cy = 0; cy < Math.ceil(map.h / C); cy++) for (let cx = 0; cx < Math.ceil(map.w / C); cx++) g.drawImage(chunk(cx, cy), cx * C * T, cy * C * T);
  sorted().forEach((o) => drawObj(g, o));
  c.toBlob((b) => b && saveBlob(b, fileName('.png')), 'image/png');
}

// ---------- touch: one finger paints, two fingers pinch and pan ----------
const fingers = new Map();
let gesture = null; // { kind: 'pending' | 'stroke' | 'pan' | 'pinch', ... }
const toWorld = (sx, sy) => ({ wx: (sx - view.x) / view.z, wy: (sy - view.y) / view.z });
const local = (e) => {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
};

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  fingers.set(e.pointerId, local(e));
  if (fingers.size === 2) {
    if (gesture?.kind === 'stroke') endStroke(true);
    const [a, b] = [...fingers.values()];
    gesture = { kind: 'pinch', d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
    ghost = null;
    brushAt = null;
    return;
  }
  if (fingers.size > 2) return;
  const p = local(e);
  if (tool === 'hand' || e.button === 1) gesture = { kind: 'pan', x: p.x, y: p.y };
  else gesture = { kind: 'pending', x: p.x, y: p.y, t: performance.now() };
});
canvas.addEventListener('pointermove', (e) => {
  if (!fingers.has(e.pointerId)) return;
  const p = local(e);
  fingers.set(e.pointerId, p);
  if (!gesture) return;
  if (gesture.kind === 'pinch' && fingers.size >= 2) {
    const [a, b] = [...fingers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const k = d / (gesture.d || d);
    const z = clamp(view.z * k, 0.03, 8);
    view.x = mx - ((gesture.mx - view.x) * z) / view.z;
    view.y = my - ((gesture.my - view.y) * z) / view.z;
    view.z = z;
    Object.assign(gesture, { d, mx, my });
    draw();
  } else if (gesture.kind === 'pan') {
    view.x += p.x - gesture.x;
    view.y += p.y - gesture.y;
    gesture.x = p.x;
    gesture.y = p.y;
    draw();
  } else if (gesture.kind === 'pending') {
    if (Math.hypot(p.x - gesture.x, p.y - gesture.y) > 6 || performance.now() - gesture.t > 120) startStroke(gesture.x, gesture.y, p);
  } else if (gesture.kind === 'stroke') moveStroke(p);
});
const lift = (e) => {
  if (!fingers.has(e.pointerId)) return;
  const p = fingers.get(e.pointerId);
  fingers.delete(e.pointerId);
  if (gesture?.kind === 'pending') {
    // a tap
    startStroke(gesture.x, gesture.y, p);
    endStroke();
  } else if (gesture?.kind === 'stroke') endStroke();
  if (gesture?.kind === 'pinch' && fingers.size) gesture = { kind: 'none' }; // the other finger doesn't start painting
  if (!fingers.size) {
    gesture = null;
    saveView();
  }
};
canvas.addEventListener('pointerup', lift);
canvas.addEventListener('pointercancel', lift);
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const p = local(e);
    const z = clamp(view.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15), 0.03, 8);
    view.x = p.x - ((p.x - view.x) * z) / view.z;
    view.y = p.y - ((p.y - view.y) * z) / view.z;
    view.z = z;
    draw();
  },
  { passive: false },
);
document.addEventListener('gesturestart', (e) => e.preventDefault()); // iOS page zoom
// the page itself never zooms: two fingers only zoom the map, and double taps do nothing
document.addEventListener('touchmove', (e) => e.touches.length > 1 && e.target !== canvas && e.preventDefault(), { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault());

function startStroke(sx, sy, now) {
  const { wx, wy } = toWorld(sx, sy);
  gesture = { kind: 'stroke', last: { wx, wy }, did: false };
  if (tool === 'paint') {
    if (!chosen) {
      gesture = { kind: 'none' };
      return toast('Open a list below and pick something first.');
    }
    if (PIECES[chosen]?.layer === 'object') {
      ghost = { ref: chosen, ...placeFor(chosen, wx, wy), flip };
    } else {
      record();
      gesture.did = paintCells(wx, wy);
    }
  } else if (tool === 'erase') {
    record();
    gesture.did = eraseAt(wx, wy);
  } else if (tool === 'fill') {
    fillAt(wx, wy);
    gesture = { kind: 'none' };
  } else if (tool === 'pick') {
    pickAt(wx, wy);
    gesture = { kind: 'none' };
  } else if (tool === 'area') {
    const c = cellAt(wx, wy);
    if (pasteArmed && clip) {
      pasteAt(c.x, c.y);
      gesture = { kind: 'none' };
    } else {
      const x = clamp(c.x, 0, map.w - 1);
      const y = clamp(c.y, 0, map.h - 1);
      area = { x0: x, y0: y, x1: x, y1: y };
      gesture.anchor = { x, y };
      showAreaBar();
    }
  } else if (tool === 'move') {
    const o = hitObject(wx, wy);
    select(o || null);
    if (o) {
      record();
      gesture.drag = { o, dx: wx - o.x, dy: wy - o.y };
    }
  }
  if (now) moveStroke(now);
  draw();
}
function moveStroke(p) {
  const { wx, wy } = toWorld(p.x, p.y);
  const g = gesture;
  if (tool === 'paint' && ghost) Object.assign(ghost, placeFor(ghost.ref, wx, wy));
  else if (tool === 'paint' || tool === 'erase') {
    // fill in between fast finger moves
    const steps = Math.max(1, Math.ceil(Math.hypot(wx - g.last.wx, wy - g.last.wy) / (T / 2)));
    for (let i = 1; i <= steps; i++) {
      const x = g.last.wx + ((wx - g.last.wx) * i) / steps;
      const y = g.last.wy + ((wy - g.last.wy) * i) / steps;
      g.did = (tool === 'paint' ? paintCells(x, y) : eraseAt(x, y)) || g.did;
    }
  } else if (tool === 'area' && g.anchor) {
    const c = cellAt(wx, wy);
    const x = clamp(c.x, 0, map.w - 1);
    const y = clamp(c.y, 0, map.h - 1);
    area = { x0: Math.min(g.anchor.x, x), y0: Math.min(g.anchor.y, y), x1: Math.max(g.anchor.x, x), y1: Math.max(g.anchor.y, y) };
    showAreaBar();
  } else if (tool === 'move' && g.drag) {
    const p2 = PIECES[g.drag.o.ref];
    const s = g.drag.o.ref.startsWith('t:') ? T : Number($('snap').value);
    const nx = Math.round((wx - g.drag.dx) / s) * s;
    const ny = Math.round((wy - g.drag.dy + p2.h) / s) * s - p2.h;
    if (nx !== g.drag.o.x || ny !== g.drag.o.y) {
      g.drag.o.x = nx;
      g.drag.o.y = ny;
      g.did = true;
    }
  }
  g.last = { wx, wy };
  draw();
}
function endStroke(cancelled) {
  const g = gesture;
  if (tool === 'paint' && ghost) {
    const same = map.objects.some((o) => o.ref === ghost.ref && o.x === ghost.x && o.y === ghost.y);
    if (!cancelled && !same) {
      // (tapping the same spot twice doesn't stack two copies)
      record();
      map.objects.push({ ...ghost });
      g.did = true;
    }
    ghost = null;
  }
  if (g && !g.did && (tool === 'paint' || tool === 'erase' || (tool === 'move' && g.drag))) undoStack.pop(); // nothing changed
  brushAt = null;
  gesture = { kind: 'none' };
  if (g?.did) changed();
  else draw();
}

function setTool(t) {
  tool = t;
  document.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
  if (t !== 'move') select(null);
  if (t !== 'area') pasteArmed = false;
  $('areabar').hidden = t !== 'area';
  if (t === 'area') showAreaBar();
  draw();
}


// ---------- area: copy, cut, clear, mirror, paste (and measure) ----------
function showAreaBar() {
  const has = !!area;
  const w = has ? area.x1 - area.x0 + 1 : 0;
  const h = has ? area.y1 - area.y0 + 1 : 0;
  $('area-text').textContent = pasteArmed && clip ? `Tap to paste ${clip.w}×${clip.h}` : has ? `${w}×${h} tiles` : clip ? `${clip.w}×${clip.h} copied` : 'Drag to choose an area';
  ['area-copy', 'area-cut', 'area-del'].forEach((id) => ($(id).disabled = !has));
  $('area-mirror').disabled = !clip;
  $('area-paste').disabled = !clip;
  $('area-paste').textContent = pasteArmed ? 'Stop' : 'Paste';
  draw();
}
// an object belongs to the area if its feet (bottom-left cell) are inside it
const footCell = (o) => ({ x: Math.floor(o.x / T), y: Math.floor((o.y + PIECES[o.ref].h - 1) / T) });
const inArea = (o) => {
  if (!PIECES[o.ref]) return false;
  const f = footCell(o);
  return f.x >= area.x0 && f.x <= area.x1 && f.y >= area.y0 && f.y <= area.y1;
};
function copyArea() {
  const w = area.x1 - area.x0 + 1;
  const h = area.y1 - area.y0 + 1;
  const tiles = [];
  for (let y = area.y0; y <= area.y1; y++) for (let x = area.x0; x <= area.x1; x++) tiles.push(map.tiles[y * map.w + x]);
  const corners = [];
  if (map.kind === 'island') for (let y = area.y0; y <= area.y1 + 1; y++) for (let x = area.x0; x <= area.x1 + 1; x++) corners.push(corner(x, y));
  const objects = map.objects.filter(inArea).map((o) => ({ ref: o.ref, dx: o.x - area.x0 * T, dy: o.y - area.y0 * T, flip: !!o.flip }));
  clip = { w, h, kind: map.kind, tiles, corners, objects };
}
function clearArea() {
  record();
  for (let y = area.y0; y <= area.y1; y++) for (let x = area.x0; x <= area.x1; x++) map.tiles[y * map.w + x] = null;
  map.objects = map.objects.filter((o) => !inArea(o));
  select(null);
  dirty(area.x0, area.y0, area.x1, area.y1);
  changed();
}
function mirrorClip() {
  const { w, h } = clip;
  const tiles = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) tiles.push(clip.tiles[y * w + (w - 1 - x)]);
  const cw = w + 1;
  const corners = [];
  if (clip.corners.length) for (let y = 0; y <= h; y++) for (let x = 0; x <= w; x++) corners.push(clip.corners[y * cw + (w - x)]);
  const objects = clip.objects.map((o) => ({ ref: o.ref, dx: w * T - o.dx - PIECES[o.ref].w, dy: o.dy, flip: !o.flip }));
  clip = { ...clip, tiles, corners, objects };
}
function pasteAt(cx, cy) {
  if (clip.kind !== map.kind) return toast(`That was copied from ${clip.kind === 'island' ? 'an island' : 'a room'}; paste it on one too.`);
  record();
  for (let y = 0; y < clip.h; y++)
    for (let x = 0; x < clip.w; x++) {
      const tx = cx + x;
      const ty = cy + y;
      if (tx < 0 || ty < 0 || tx >= map.w || ty >= map.h) continue;
      const r = clip.tiles[y * clip.w + x];
      if (r || clip.kind === 'room') map.tiles[ty * map.w + tx] = r;
      else map.tiles[ty * map.w + tx] = null;
    }
  if (clip.corners.length)
    for (let y = 0; y <= clip.h; y++)
      for (let x = 0; x <= clip.w; x++) {
        const tx = cx + x;
        const ty = cy + y;
        if (tx <= map.w && ty <= map.h) map.corners[ty * (map.w + 1) + tx] = clip.corners[y * (clip.w + 1) + x];
      }
  clip.objects.forEach((o) => {
    const n = { ref: o.ref, x: cx * T + o.dx, y: cy * T + o.dy, flip: o.flip };
    if (n.x >= 0 && n.y >= 0 && n.x < map.w * T && n.y < map.h * T && !map.objects.some((q) => q.ref === n.ref && q.x === n.x && q.y === n.y)) map.objects.push(n);
  });
  rebuildAll();
  changed();
  toast('Pasted. Tap again to paste another.');
}
$('area-copy').onclick = () => {
  if (!area) return;
  copyArea();
  toast(`Copied ${clip.w}×${clip.h}`);
  showAreaBar();
};
$('area-cut').onclick = () => {
  if (!area) return;
  copyArea();
  clearArea();
  showAreaBar();
};
$('area-del').onclick = () => area && clearArea();
$('area-mirror').onclick = () => {
  if (!clip) return;
  mirrorClip();
  toast('Copied area mirrored');
  showAreaBar();
};
$('area-paste').onclick = () => {
  if (!clip) return;
  pasteArmed = !pasteArmed;
  if (pasteArmed) area = null;
  showAreaBar();
};
$('show-tiles').onchange = () => {
  showTiles = $('show-tiles').checked;
  rebuildAll();
};
$('show-objs').onchange = () => {
  showObjs = $('show-objs').checked;
  draw();
};

// ---------- buttons and menus ----------
document.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));
$('undo').onclick = undo;
$('redo').onclick = redo;
$('sheet-handle').onclick = () => {
  $('sheet').classList.toggle('small');
  setTimeout(resize, 220);
};
$('sel-flip').onclick = () => {
  if (!selected) return;
  record();
  selected.flip = !selected.flip;
  changed();
};
$('sel-dup').onclick = () => {
  if (!selected) return;
  record();
  const s = selected.ref.startsWith('t:') ? T : Math.max(Number($('snap').value), 8);
  const copy = { ...selected, x: selected.x + s };
  map.objects.push(copy);
  select(copy);
  changed();
};
$('sel-del').onclick = () => {
  if (!selected) return;
  record();
  map.objects.splice(map.objects.indexOf(selected), 1);
  select(null);
  changed();
};
// turning: step to the next side of a piece that has a family
const turned = (ref) => {
  const f = FAMILY[ref];
  return f ? f[(f.indexOf(ref) + 1) % f.length] : ref;
};
$('sel-turn').onclick = () => {
  if (!selected || !FAMILY[selected.ref]) return;
  record();
  const bottom = selected.y + PIECES[selected.ref].h; // keep the feet where they were
  selected.ref = turned(selected.ref);
  selected.y = bottom - PIECES[selected.ref].h;
  $('sel-text').textContent = refLabel(selected.ref);
  changed();
};
$('chosen-fav').onclick = toggleFav;
$('chosen-turn').onclick = () => {
  if (!FAMILY[chosen]) return;
  chosen = turned(chosen);
  showChosen();
};
// flipping the chosen piece: tap its picture
$('chosen-pic').onclick = () => {
  flip = !flip;
  showChosen();
};

function openMenu() {
  $('name-input').value = map.name;
  renderSaved();
  $('menu').hidden = false;
}
function renderSaved() {
  const list = $('saved-list');
  list.replaceChildren();
  const all = readAll();
  const names = Object.keys(all).sort((a, b) => (all[b].saved || 0) - (all[a].saved || 0));
  if (!names.length) list.innerHTML = '<p class="hint">Maps save on this phone as you work. They’ll show here.</p>';
  names.forEach((n) => {
    const row = document.createElement('div');
    row.className = 'saved';
    const open = document.createElement('button');
    open.textContent = `${n} · ${all[n].w}×${all[n].h}${n === map.name ? ' (open)' : ''}`;
    open.onclick = () => {
      saveLocal();
      loadMap(deserialize(all[n]));
      undoStack.length = redoStack.length = 0;
      saveLocal();
      $('menu').hidden = true;
    };
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = () => {
      if (del.dataset.sure !== '1') {
        del.dataset.sure = '1';
        del.textContent = 'Sure?';
        return;
      }
      delete all[n];
      localStorage.setItem(STORE, JSON.stringify(all));
      renderSaved();
    };
    row.append(open, del);
    list.appendChild(row);
  });
  renderVersions();
}
// earlier versions of the open map, newest first
async function renderVersions() {
  const box = $('versions');
  box.replaceChildren();
  const list = await backupsFor(map.name);
  if (!list.length) box.innerHTML = '<p class="hint">Earlier versions of this map show here as you work.</p>';
  list.slice(0, 30).forEach((v) => {
    const b = document.createElement('button');
    const d = new Date(v.saved);
    b.textContent = `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · ${v.objects.length} pieces`;
    b.onclick = () => {
      record();
      loadMap(deserialize(v), true);
      changed();
      $('menu').hidden = true;
      toast('Earlier version opened. Undo goes back.');
    };
    box.appendChild(b);
  });
}
$('menu-btn').onclick = openMenu;
$('map-name').onclick = openMenu;
$('menu-close').onclick = () => {
  const name = $('name-input').value.trim() || map.name;
  if (name !== map.name) {
    // the copy under the old name stays until the new one is saved
    const old = map.name;
    map.name = name;
    saveLocal();
    try {
      const all = readAll();
      if (all[name]) delete all[old];
      localStorage.setItem(STORE, JSON.stringify(all));
    } catch {
      // fine
    }
    $('map-name').textContent = name;
    changed();
  }
  $('menu').hidden = true;
  draw();
};
$('menu').onclick = (e) => e.target === $('menu') && $('menu-close').onclick();
$('save-png').onclick = savePicture;
// try the island in the game (people wander, the museum's doors work)
$('play-map').onclick = () => {
  saveLocal();
  if (map.kind !== 'island') return toast('Only islands can be walked for now.');
  try {
    localStorage.setItem('curation.playtest', JSON.stringify(serialize()));
  } catch {
    return toast('Phone storage is full.');
  }
  location.href = './index.html?play=1';
};
$('share-file').onclick = () => saveBlob(new Blob([JSON.stringify(serialize())], { type: 'application/json' }), fileName('.map.json'));
$('copy-code').onclick = async () => {
  try {
    await navigator.clipboard.writeText(JSON.stringify(serialize()));
    toast('Map code copied. Paste it to Claude.');
  } catch {
    toast('Copy was blocked. Use Save map file instead.');
  }
};
$('open-file').onclick = () => $('file-input').click();
$('file-input').onchange = async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    saveLocal();
    loadMap(deserialize(JSON.parse(await f.text())));
    undoStack.length = redoStack.length = 0;
    $('menu').hidden = true;
    changed();
    toast(`Opened “${map.name}”`);
  } catch {
    toast('That file isn’t a map.');
  }
};
const newMap = (kind) => {
  const btn = $(kind === 'island' ? 'new-island' : 'new-room');
  if (btn.dataset.sure !== '1') {
    btn.dataset.sure = '1';
    btn.textContent = 'Tap again to start it';
    setTimeout(() => {
      btn.dataset.sure = '';
      btn.textContent = kind === 'island' ? 'New island' : 'New room';
    }, 3000);
    return;
  }
  btn.dataset.sure = '';
  btn.textContent = kind === 'island' ? 'New island' : 'New room';
  saveLocal();
  const m = blankMap(kind, Number($('new-w').value), Number($('new-h').value));
  const all = readAll();
  let n = 1;
  const base = m.name;
  while (all[m.name]) m.name = `${base} ${++n}`;
  loadMap(m);
  toast('Your other maps are in ☰ My maps.');
  undoStack.length = redoStack.length = 0;
  changed();
  $('menu').hidden = true;
  if (kind === 'island') choose('m:2');
};
$('new-island').onclick = () => newMap('island');
$('new-room').onclick = () => newMap('room');
$('grid-toggle').onchange = draw;
$('credits-btn').onclick = () => {
  $('menu').hidden = true;
  $('credits').hidden = false;
};
$('back-game').onclick = () => {
  saveLocal();
  location.href = './index.html';
};
$('credits-close').onclick = () => ($('credits').hidden = true);
window.addEventListener('resize', resize);
// paste a map's code anywhere to open it
window.addEventListener('paste', (e) => {
  const text = e.clipboardData?.getData('text') || '';
  if (!/curation-(map|room)/.test(text) || e.target.matches('input')) return;
  try {
    record();
    loadMap(deserialize(JSON.parse(text)));
    changed();
  } catch {
    toast('That pasted text isn’t a map.');
  }
});

function credits() {
  const ul = $('credits-list');
  Object.values(ROOM?.credits || {}).forEach((lines) => {
    const li = document.createElement('li');
    const [title, link, author, lic] = lines;
    if (link?.startsWith('http')) {
      const a = document.createElement('a');
      a.href = link;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = title;
      li.append(a, ` · ${(author || '').replace('Author (page): ', '')} · ${(lic || '').replace('License: ', '')}`);
    } else li.textContent = lines.join(' · ');
    ul.appendChild(li);
  });
}

let toastTimer;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2600);
  return false;
}

async function boot() {
  await loadPieces();
  buildPalette();
  credits();
  keepStorage();
  const all = readAll();
  const newest = Object.keys(all).sort((a, b) => (all[b].saved || 0) - (all[a].saved || 0))[0];
  let cur = localStorage.getItem(CURRENT);
  if (!all[cur]) cur = newest;
  // the island recovered from the map file sent in October 2026 (added once)
  if (!localStorage.getItem('curation.mapbuilder.recovered1')) {
    localStorage.setItem('curation.mapbuilder.recovered1', '1');
    if (!all[recovered.name]) {
      all[recovered.name] = { ...recovered, saved: 1 };
      try {
        localStorage.setItem(STORE, JSON.stringify(all));
      } catch {
        // fine
      }
      if (!all[cur] || isBlank(all[cur])) cur = recovered.name;
    }
  }
  // Wakefield is no longer a tile map (it is drawn from real shapes in the game): clear the first
  // version that was added here, unless it was edited
  if (!localStorage.getItem('curation.mapbuilder.wakefield3')) {
    localStorage.setItem('curation.mapbuilder.wakefield3', '1');
    const old = all['Wakefield, MA'];
    if (old && old.saved <= 1 && /wakefield/.test(old.overlay?.src || '')) {
      delete all['Wakefield, MA'];
      if (cur === 'Wakefield, MA') cur = Object.keys(all)[0];
      try {
        localStorage.setItem(STORE, JSON.stringify(all));
      } catch {
        // fine
      }
    }
  }
  let data = all[cur];
  // this phone's storage was cleared: bring back the newest copy from the vault
  const vault = await latestBackup();
  if (vault && vault.saved > (data?.saved || 0)) data = vault;
  resize();
  try {
    loadMap(data ? deserialize(data) : blankMap('island', 80, 80));
  } catch {
    loadMap(blankMap('island', 80, 80));
  }
  savedAt = data?.saved > 1 ? data.saved : 0;
  try {
    const v = JSON.parse(localStorage.getItem(VIEW) || 'null');
    if (v && v.name === map.name) Object.assign(view, { x: v.x, y: v.y, z: v.z });
  } catch {
    // fine
  }
  localStorage.setItem(CURRENT, map.name);
  choose('m:2');
  setTool('paint');
  draw();
  if (data) showResume(all);
}

// opening the builder (also after a crash or a dead battery): pick up where you left off
const when = (ts) => {
  const d = new Date(ts);
  const today = d.toDateString() === new Date().toDateString();
  return `${today ? 'today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
};
function showResume(all) {
  $('resume-name').textContent = map.name;
  $('resume-meta').textContent = savedAt ? `Autosaved ${when(savedAt)} · ${map.w}×${map.h}` : `${map.w}×${map.h}`;
  const list = $('resume-list');
  list.replaceChildren();
  Object.keys(all)
    .filter((n) => n !== map.name)
    .sort((a, b) => (all[b].saved || 0) - (all[a].saved || 0))
    .slice(0, 8)
    .forEach((n) => {
      const b = document.createElement('button');
      b.textContent = `${n}${all[n].saved > 1 ? ` · ${when(all[n].saved)}` : ''}`;
      b.onclick = () => {
        loadMap(deserialize(all[n]));
        undoStack.length = redoStack.length = 0;
        saveLocal();
        $('resume').hidden = true;
      };
      list.appendChild(b);
    });
  $('resume-others').hidden = !list.children.length;
  $('resume').hidden = false;
}
$('resume-go').onclick = () => ($('resume').hidden = true);
$('resume').onclick = (e) => e.target === $('resume') && ($('resume').hidden = true);

function isBlank(d) {
  return !(d.objects || []).length && !hasTiles(d) && (d.w || 0) <= 80;
}

window.__builder = { get map() { return map; }, serialize, deserialize, get view() { return view; } }; // for tests
boot();
