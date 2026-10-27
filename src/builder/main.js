// Room builder: paint floors and walls, place furniture, then save a picture
// or a file of the room. Pieces come from public/builder (cut from the free
// art packs by tools/build_palette.py). The room file lists every piece by
// id and position, so a room can be rebuilt exactly.
const T = 32;
const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
const KEY = 'curation.builder';

let DATA = null; // pieces.json
const PIECES = {}; // id -> { ...piece, group, kind, img }
const GROUP_IMG = {};
let room = blank(14, 10);
let tool = 'paint';
let current = null; // the chosen piece id
let flip = false;
let selected = null; // an item in the room
let view = { x: 0, y: 0, z: 2 }; // pan (screen px) and zoom
let hover = null; // { wx, wy } in room px
const undoStack = [];
const redoStack = [];

function blank(w, h) {
  return { name: 'Untitled room', w, h, floor: Array(w * h).fill(null), wall: Array(w * h).fill(null), items: [] };
}

// ---------- Loading ----------
async function boot() {
  DATA = await (await fetch('./builder/pieces.json')).json();
  await Promise.all(
    DATA.groups.map(
      (g) =>
        new Promise((res) => {
          const img = new Image();
          img.onload = res;
          img.src = `./${g.sheet}`;
          GROUP_IMG[g.id] = img;
          g.pieces.forEach((p) => (PIECES[p.id] = { ...p, group: g.id, kind: g.kind, img }));
        }),
    ),
  );
  // see-through test for clicking on pieces: each sheet's alpha
  DATA.groups.forEach((g) => {
    const img = GROUP_IMG[g.id];
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    g.alpha = cx.getImageData(0, 0, c.width, c.height);
  });
  buildPalette();
  credits();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && saved.w) room = normalize(saved);
  } catch {
    // no saved room yet
  }
  syncRoomInputs();
  resize();
  fit();
  draw();
}

// ---------- The palette (dropdowns) ----------
function buildPalette() {
  const pal = $('palette');
  DATA.groups.forEach((g, gi) => {
    const det = document.createElement('details');
    det.innerHTML = `<summary>${g.name}<small>${g.pieces.length}</small></summary><div class="pieces"></div>`;
    const grid = det.querySelector('.pieces');
    let built = false;
    det.addEventListener('toggle', () => {
      if (!det.open) return;
      pal.querySelectorAll('details[open]').forEach((d) => d !== det && (d.open = false)); // one open at a time
      if (built) return;
      built = true;
      g.pieces.forEach((p) => {
        const b = document.createElement('button');
        b.className = 'piece';
        b.title = `${p.id} · ${p.w}×${p.h} · ${p.pack}`;
        b.dataset.id = p.id;
        b.appendChild(thumb(p.id, 48));
        b.onclick = () => choose(p.id);
        grid.appendChild(b);
      });
      markChosen();
    });
    if (gi === 0) det.open = true;
    pal.appendChild(det);
  });
}

function thumb(id, size) {
  const p = PIECES[id];
  const c = document.createElement('canvas');
  const k = Math.min(size / p.w, size / p.h, 3);
  c.width = Math.max(1, Math.round(p.w * k));
  c.height = Math.max(1, Math.round(p.h * k));
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.drawImage(p.img, p.x, p.y, p.w, p.h, 0, 0, c.width, c.height);
  return c;
}

function choose(id) {
  current = id;
  if (tool === 'erase' || tool === 'select' || tool === 'pick') setTool('paint');
  markChosen();
  showChosen();
}

function markChosen() {
  document.querySelectorAll('.piece').forEach((b) => b.classList.toggle('on', b.dataset.id === current));
}

const KIND_TEXT = { tile: 'floor tile · drag to paint, Fill to flood', wall: 'wall tile · drag to paint', flat: 'lies on the floor', hang: 'hangs on a wall', object: 'stands on the floor' };
function showChosen() {
  const p = PIECES[current];
  const c = $('sel-canvas');
  const cx = c.getContext('2d');
  cx.clearRect(0, 0, 64, 64);
  if (!p) return;
  cx.imageSmoothingEnabled = false;
  const k = Math.min(64 / p.w, 64 / p.h, 2);
  const w = p.w * k;
  const h = p.h * k;
  cx.save();
  if (flip) {
    cx.translate(64, 0);
    cx.scale(-1, 1);
  }
  cx.drawImage(p.img, p.x, p.y, p.w, p.h, (64 - w) / 2, (64 - h) / 2, w, h);
  cx.restore();
  $('sel-name').textContent = p.id;
  $('sel-meta').textContent = `${p.w}×${p.h} px · ${KIND_TEXT[p.kind]} · ${p.pack}${flip ? ' · flipped' : ''}`;
}

// ---------- Drawing ----------
function resize() {
  const r = $('view').getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  draw();
}

function fit() {
  const dpr = window.devicePixelRatio || 1;
  const z = Math.min((canvas.width / dpr - 40) / (room.w * T), (canvas.height / dpr - 40) / (room.h * T));
  view.z = Math.max(0.25, Math.min(8, Math.floor(z * 4) / 4 || z));
  view.x = (canvas.width / dpr - room.w * T * view.z) / 2;
  view.y = (canvas.height / dpr - room.h * T * view.z) / 2;
  $('zoom-level').textContent = `${Math.round(view.z * 100)}%`;
  draw();
}

function drawPiece(c, p, x, y, flipped, alpha = 1) {
  c.globalAlpha = alpha;
  if (flipped) {
    c.save();
    c.translate(x + p.w, y);
    c.scale(-1, 1);
    c.drawImage(p.img, p.x, p.y, p.w, p.h, 0, 0, p.w, p.h);
    c.restore();
  } else c.drawImage(p.img, p.x, p.y, p.w, p.h, x, y, p.w, p.h);
  c.globalAlpha = 1;
}

const ORDER = { flat: 0, hang: 1, object: 2 };
// the room itself, at 1:1 (used for the view and for Save PNG)
function paintRoom(c, { grid = false } = {}) {
  c.fillStyle = '#2a211b';
  c.fillRect(0, 0, room.w * T, room.h * T);
  for (const layer of ['floor', 'wall'])
    room[layer].forEach((id, i) => {
      const p = PIECES[id];
      if (p) c.drawImage(p.img, p.x, p.y, p.w, p.h, (i % room.w) * T, Math.floor(i / room.w) * T, T, T);
    });
  sortedItems().forEach((it) => {
    const p = PIECES[it.id];
    if (p) drawPiece(c, p, it.x, it.y, it.flip);
  });
  if (grid) {
    c.strokeStyle = 'rgba(255,255,255,0.08)';
    c.lineWidth = 1 / view.z;
    c.beginPath();
    for (let x = 0; x <= room.w; x++) {
      c.moveTo(x * T, 0);
      c.lineTo(x * T, room.h * T);
    }
    for (let y = 0; y <= room.h; y++) {
      c.moveTo(0, y * T);
      c.lineTo(room.w * T, y * T);
    }
    c.stroke();
  }
}

// back to front: flats, then wall pieces, then furniture by where it stands
function sortedItems() {
  return room.items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => {
      const ka = ORDER[PIECES[a.it.id]?.kind] ?? 2;
      const kb = ORDER[PIECES[b.it.id]?.kind] ?? 2;
      if (ka !== kb) return ka - kb;
      const pa = PIECES[a.it.id];
      const pb = PIECES[b.it.id];
      return a.it.y + (pa?.h || 0) - (b.it.y + (pb?.h || 0)) || a.i - b.i;
    })
    .map((e) => e.it);
}

function draw() {
  if (!DATA) return;
  const dpr = window.devicePixelRatio || 1;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr * view.z, 0, 0, dpr * view.z, dpr * view.x, dpr * view.y);
  ctx.imageSmoothingEnabled = false;
  paintRoom(ctx, { grid: $('show-grid').checked });
  // the room's edge
  ctx.strokeStyle = 'rgba(232,200,103,0.6)';
  ctx.lineWidth = 2 / view.z;
  ctx.strokeRect(0, 0, room.w * T, room.h * T);
  // what you're about to place
  if (hover && tool === 'paint' && current && !panning) {
    const p = PIECES[current];
    if (p.kind === 'tile' || p.kind === 'wall') {
      const cx = Math.floor(hover.wx / T);
      const cy = Math.floor(hover.wy / T);
      if (inRoom(cx, cy)) {
        ctx.globalAlpha = 0.7;
        ctx.drawImage(p.img, p.x, p.y, p.w, p.h, cx * T, cy * T, T, T);
        ctx.globalAlpha = 1;
      }
    } else {
      const at = placeAt(p, hover.wx, hover.wy);
      drawPiece(ctx, p, at.x, at.y, flip, 0.65);
    }
  }
  if (hover && (tool === 'erase' || tool === 'fill' || tool === 'pick')) {
    const cx = Math.floor(hover.wx / T);
    const cy = Math.floor(hover.wy / T);
    if (inRoom(cx, cy)) {
      ctx.strokeStyle = tool === 'erase' ? '#e0405a' : '#e8c867';
      ctx.strokeRect(cx * T, cy * T, T, T);
    }
  }
  if (selected && room.items.includes(selected)) {
    const p = PIECES[selected.id];
    ctx.strokeStyle = '#e8c867';
    ctx.setLineDash([4 / view.z, 3 / view.z]);
    ctx.strokeRect(selected.x - 0.5, selected.y - 0.5, p.w + 1, p.h + 1);
    ctx.setLineDash([]);
  }
}

// ---------- Placing ----------
const snapTo = () => Number($('snap').value);
const snap = (v) => Math.round(v / snapTo()) * snapTo();
const inRoom = (cx, cy) => cx >= 0 && cy >= 0 && cx < room.w && cy < room.h;

// a piece under the cursor: centred across, its bottom on the cursor's row
function placeAt(p, wx, wy) {
  const s = snapTo();
  const bottom = s === 1 ? Math.round(wy + p.h / 2) : Math.ceil(wy / s) * s;
  return { x: snap(wx - p.w / 2), y: bottom - p.h };
}

function hitItem(wx, wy) {
  const list = sortedItems().reverse();
  return list.find((it) => {
    const p = PIECES[it.id];
    if (!p || wx < it.x || wy < it.y || wx >= it.x + p.w || wy >= it.y + p.h) return false;
    const lx = Math.floor(it.flip ? p.w - 1 - (wx - it.x) : wx - it.x);
    const ly = Math.floor(wy - it.y);
    const a = DATA.groups.find((g) => g.id === p.group).alpha;
    return a.data[((p.y + ly) * a.width + p.x + lx) * 4 + 3] > 20;
  });
}

function paintCell(wx, wy) {
  const p = PIECES[current];
  const cx = Math.floor(wx / T);
  const cy = Math.floor(wy / T);
  if (!inRoom(cx, cy)) return false;
  const layer = p.kind === 'wall' ? 'wall' : 'floor';
  const i = cy * room.w + cx;
  if (room[layer][i] === current) return false;
  room[layer][i] = current;
  if (layer === 'floor') room.wall[i] = null; // painting floor over a wall clears it
  return true;
}

function eraseAt(wx, wy) {
  const it = hitItem(wx, wy);
  if (it) {
    room.items.splice(room.items.indexOf(it), 1);
    if (selected === it) selected = null;
    return true;
  }
  const cx = Math.floor(wx / T);
  const cy = Math.floor(wy / T);
  if (!inRoom(cx, cy)) return false;
  const i = cy * room.w + cx;
  if (room.wall[i]) return !!(room.wall[i] = null) || true;
  if (room.floor[i]) return !!(room.floor[i] = null) || true;
  return false;
}

function fillAt(wx, wy) {
  const p = PIECES[current];
  if (!p || (p.kind !== 'tile' && p.kind !== 'wall')) return toast('Fill works with floor and wall tiles. Pick one first.');
  const cx = Math.floor(wx / T);
  const cy = Math.floor(wy / T);
  if (!inRoom(cx, cy)) return;
  const layer = p.kind === 'wall' ? 'wall' : 'floor';
  const grid = room[layer];
  const from = grid[cy * room.w + cx];
  if (from === current) return;
  record();
  const q = [[cx, cy]];
  while (q.length) {
    const [x, y] = q.pop();
    if (!inRoom(x, y) || grid[y * room.w + x] !== from) continue;
    grid[y * room.w + x] = current;
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  changed();
}

function pickAt(wx, wy) {
  const it = hitItem(wx, wy);
  const cx = Math.floor(wx / T);
  const cy = Math.floor(wy / T);
  const id = it?.id || (inRoom(cx, cy) && (room.wall[cy * room.w + cx] || room.floor[cy * room.w + cx]));
  if (!id) return;
  flip = !!it?.flip;
  choose(id);
  // open its dropdown so you can see it
  const g = PIECES[id].group;
  const det = [...document.querySelectorAll('#palette details')][DATA.groups.findIndex((x) => x.id === g)];
  if (det && !det.open) det.open = true;
  setTimeout(() => document.querySelector(`.piece[data-id="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' }), 50);
}

// ---------- History and saving ----------
function record() {
  undoStack.push(JSON.stringify(room));
  if (undoStack.length > 150) undoStack.shift();
  redoStack.length = 0;
}
function changed() {
  try {
    localStorage.setItem(KEY, JSON.stringify(room));
  } catch {
    // storage full or off; the room still works
  }
  draw();
}
function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(room));
  room = JSON.parse(undoStack.pop());
  selected = null;
  syncRoomInputs();
  changed();
}
function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(room));
  room = JSON.parse(redoStack.pop());
  selected = null;
  syncRoomInputs();
  changed();
}

function normalize(r) {
  const w = Math.max(4, Math.min(60, r.w | 0));
  const h = Math.max(4, Math.min(60, r.h | 0));
  const grid = (g) => Array.from({ length: w * h }, (_, i) => (g && PIECES[g[i]] ? g[i] : null));
  return {
    name: String(r.name || 'Untitled room').slice(0, 80),
    w,
    h,
    floor: grid(r.floor),
    wall: grid(r.wall),
    items: (r.items || []).filter((it) => PIECES[it.id]).map((it) => ({ id: it.id, x: Math.round(it.x), y: Math.round(it.y), flip: !!it.flip })),
  };
}

// a room file: readable, with the grid written row by row
function roomFile() {
  const rows = (g) => Array.from({ length: room.h }, (_, y) => g.slice(y * room.w, (y + 1) * room.w));
  return JSON.stringify(
    { format: 'curation-room', version: 1, tile: T, name: room.name, w: room.w, h: room.h, floor: rows(room.floor), wall: rows(room.wall), items: sortedItems() },
    (k, v) => (Array.isArray(v) && v.every((x) => x === null || typeof x === 'string') && k !== 'items' ? JSON.stringify(v) : v),
    1,
  ).replace(/"(\[.*?\])"/g, (_, a) => a.replace(/\\"/g, '"'));
}
function readFile(text) {
  const r = JSON.parse(text);
  const flat = (g) => (Array.isArray(g?.[0]) ? g.flat() : g);
  record();
  room = normalize({ ...r, floor: flat(r.floor), wall: flat(r.wall) });
  selected = null;
  syncRoomInputs();
  fit();
  changed();
  toast(`Opened “${room.name}”`);
}
const fileName = (ext) => `${room.name.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '') || 'room'}${ext}`;
function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function savePng() {
  const scale = 2; // twice size so details read well when shared
  const c = document.createElement('canvas');
  c.width = room.w * T * scale;
  c.height = room.h * T * scale;
  const cx = c.getContext('2d');
  cx.imageSmoothingEnabled = false;
  cx.scale(scale, scale);
  paintRoom(cx);
  c.toBlob((b) => {
    download(b, fileName('.png'));
    toast('Saved the picture to your downloads');
  });
}

function syncRoomInputs() {
  $('room-name').value = room.name;
  $('room-w').value = room.w;
  $('room-h').value = room.h;
}

// change the room's size, keeping what's there (anchored top-left)
function setSize(w, h) {
  w = Math.max(4, Math.min(60, w | 0));
  h = Math.max(4, Math.min(60, h | 0));
  if (w === room.w && h === room.h) return;
  record();
  const grid = (g) => Array.from({ length: w * h }, (_, i) => {
    const x = i % w;
    const y = Math.floor(i / w);
    return x < room.w && y < room.h ? g[y * room.w + x] : null;
  });
  room = { ...room, w, h, floor: grid(room.floor), wall: grid(room.wall), items: room.items.filter((it) => it.x < w * T && it.y < h * T) };
  syncRoomInputs();
  fit();
  changed();
}

// ---------- Input ----------
let panning = null;
let painting = false;
let dragItem = null;
let space = false;

const toWorld = (e) => {
  const r = canvas.getBoundingClientRect();
  return { wx: (e.clientX - r.left - view.x) / view.z, wy: (e.clientY - r.top - view.y) / view.z };
};

canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  const { wx, wy } = toWorld(e);
  if (e.button === 1 || space || (e.button === 0 && e.altKey)) {
    panning = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    return;
  }
  if (e.button === 2) {
    record();
    if (eraseAt(wx, wy)) changed();
    else undoStack.pop();
    painting = 'erase';
    return;
  }
  if (e.button !== 0) return;
  if (tool === 'select') {
    const it = hitItem(wx, wy);
    selected = it || null;
    if (it) {
      record();
      dragItem = { it, dx: wx - it.x, dy: wy - it.y, moved: false };
    }
    draw();
  } else if (tool === 'erase') {
    record();
    if (!eraseAt(wx, wy)) undoStack.pop();
    painting = 'erase';
    changed();
  } else if (tool === 'fill') fillAt(wx, wy);
  else if (tool === 'pick') pickAt(wx, wy);
  else if (tool === 'paint') {
    const p = PIECES[current];
    if (!p) return toast('Open a list on the right and pick a piece first.');
    record();
    if (p.kind === 'tile' || p.kind === 'wall') {
      paintCell(wx, wy);
      painting = 'tile';
    } else {
      const at = placeAt(p, wx, wy);
      const it = { id: current, x: at.x, y: at.y, flip };
      room.items.push(it);
      selected = it;
    }
    changed();
  }
});
canvas.addEventListener('pointermove', (e) => {
  const { wx, wy } = toWorld(e);
  hover = { wx, wy };
  const cx = Math.floor(wx / T);
  const cy = Math.floor(wy / T);
  $('cursor').textContent = inRoom(cx, cy) ? `tile ${cx}, ${cy} · ${Math.round(wx)}, ${Math.round(wy)} px` : '';
  if (panning) {
    view.x = panning.vx + e.clientX - panning.x;
    view.y = panning.vy + e.clientY - panning.y;
  } else if (painting === 'tile') paintCell(wx, wy) && changed();
  else if (painting === 'erase') eraseAt(wx, wy) && changed();
  else if (dragItem) {
    const p = PIECES[dragItem.it.id];
    const nx = snap(wx - dragItem.dx);
    const ny = snap(wy - dragItem.dy + p.h) - p.h;
    if (nx !== dragItem.it.x || ny !== dragItem.it.y) {
      dragItem.it.x = nx;
      dragItem.it.y = ny;
      dragItem.moved = true;
    }
  }
  draw();
});
const endDrag = () => {
  if (dragItem) {
    if (!dragItem.moved) undoStack.pop();
    else changed();
  }
  panning = null;
  painting = false;
  dragItem = null;
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('pointerleave', () => {
  hover = null;
  draw();
});
canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const r = canvas.getBoundingClientRect();
    zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - r.left, e.clientY - r.top);
  },
  { passive: false },
);
function zoomAt(k, sx, sy) {
  const z = Math.max(0.25, Math.min(10, view.z * k));
  view.x = sx - ((sx - view.x) * z) / view.z;
  view.y = sy - ((sy - view.y) * z) / view.z;
  view.z = z;
  $('zoom-level').textContent = `${Math.round(z * 100)}%`;
  draw();
}
const zoomCenter = (k) => {
  const r = canvas.getBoundingClientRect();
  zoomAt(k, r.width / 2, r.height / 2);
};

function setTool(t) {
  tool = t;
  document.querySelectorAll('[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t));
  canvas.style.cursor = t === 'select' ? 'move' : t === 'pick' ? 'copy' : 'crosshair';
  draw();
}
document.querySelectorAll('[data-tool]').forEach((b) => (b.onclick = () => setTool(b.dataset.tool)));

function doFlip() {
  if (selected && room.items.includes(selected) && tool === 'select') {
    record();
    selected.flip = !selected.flip;
    changed();
  } else {
    flip = !flip;
    showChosen();
    draw();
  }
}

window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, select, textarea')) return;
  const k = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  if (k === ' ') {
    space = true;
    canvas.style.cursor = 'grab';
    e.preventDefault();
  } else if (mod && k === 'z') {
    e.preventDefault();
    e.shiftKey ? redo() : undo();
  } else if (mod && k === 'y') {
    e.preventDefault();
    redo();
  } else if (mod && k === 'd' && selected) {
    e.preventDefault();
    record();
    const copy = { ...selected, x: selected.x + snapTo() * (snapTo() === 1 ? 8 : 1), y: selected.y };
    room.items.push(copy);
    selected = copy;
    changed();
  } else if ((k === 'delete' || k === 'backspace') && selected) {
    record();
    room.items.splice(room.items.indexOf(selected), 1);
    selected = null;
    changed();
  } else if (selected && tool === 'select' && k.startsWith('arrow')) {
    e.preventDefault();
    record();
    const s = e.shiftKey ? T : snapTo();
    if (k === 'arrowleft') selected.x -= s;
    if (k === 'arrowright') selected.x += s;
    if (k === 'arrowup') selected.y -= s;
    if (k === 'arrowdown') selected.y += s;
    changed();
  } else if (!mod) {
    const tools = { b: 'paint', e: 'erase', v: 'select', g: 'fill', i: 'pick' };
    if (tools[k]) setTool(tools[k]);
    else if (k === 'f') doFlip();
    else if (k === '+' || k === '=') zoomCenter(1.25);
    else if (k === '-') zoomCenter(0.8);
    else if (k === '0') fit();
    else if (k === 'escape') {
      selected = null;
      draw();
    }
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === ' ') {
    space = false;
    setTool(tool);
  }
});

$('undo').onclick = undo;
$('redo').onclick = redo;
$('zoom-in').onclick = () => zoomCenter(1.25);
$('zoom-out').onclick = () => zoomCenter(0.8);
$('zoom-fit').onclick = fit;
$('show-grid').onchange = draw;
$('flip').onclick = doFlip;
$('room-name').onchange = (e) => {
  record();
  room.name = e.target.value.trim() || 'Untitled room';
  changed();
};
$('room-w').onchange = () => setSize(Number($('room-w').value), room.h);
$('room-h').onchange = () => setSize(room.w, Number($('room-h').value));
$('new-room').onclick = () => {
  record();
  room = blank(room.w, room.h);
  selected = null;
  syncRoomInputs();
  changed();
  toast('New empty room (Undo brings the old one back)');
};
$('save-png').onclick = savePng;
$('export').onclick = () => {
  download(new Blob([roomFile()], { type: 'application/json' }), fileName('.room.json'));
  toast('Saved the room file to your downloads');
};
$('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(roomFile());
    toast('Room code copied. Paste it to Claude.');
  } catch {
    toast('Copy was blocked; use Export file instead.');
  }
};
$('import').onclick = () => $('import-file').click();
$('import-file').onchange = async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    readFile(await f.text());
  } catch {
    toast('That file isn’t a room file.');
  }
};
// paste a room's code anywhere on the page to open it
window.addEventListener('paste', (e) => {
  if (e.target.matches('input, textarea')) return;
  const text = e.clipboardData?.getData('text') || '';
  if (!text.includes('curation-room')) return;
  try {
    readFile(text);
  } catch {
    toast('That pasted text isn’t a room.');
  }
});
$('credits-btn').onclick = () => $('credits').showModal();
window.addEventListener('resize', resize);

function credits() {
  const ul = $('credits-list');
  Object.entries(DATA.credits).forEach(([, lines]) => {
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
}

window.__builder = { get room() { return room; }, PIECES, readFile, roomFile }; // for tests
boot();
