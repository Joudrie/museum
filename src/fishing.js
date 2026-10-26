// Fishing: stand at the water's edge facing the water and tap Fish. The line
// goes out, the bobber floats and nibbles, then it's pulled under and a "!"
// pops over your head: tap the screen quickly to hook what's there. Every
// catch goes in the fish log (Journal → Fish), ready for the aquarium later.
// Better bobbers, earned by fishing goals, bite sooner, give you longer to
// react and turn up rarer fish.
import Phaser from 'phaser';
import { load, save } from './storage.js';
import { sfx } from './music.js';
import { haptic } from './ui.js';
import { hourNow } from './settings.js';

const KEY = 'curation.fishing'; // { caught: { id: { n, best } }, total, night, bobber }

// water: pond / sea. rarity 1 common … 4 legendary. time: day / night / any.
// shape picks the drawing; c = [back, belly, fins].
export const FISH = [
  { id: 'minnow', name: 'Minnow', water: 'pond', rarity: 1, size: [4, 9], shape: 'slim', c: ['#8a9a7a', '#d8dcc0', '#6a7a5a'] },
  { id: 'bluegill', name: 'Bluegill', water: 'pond', rarity: 1, size: [10, 22], shape: 'deep', c: ['#3e6a8a', '#e8b860', '#2a4a6a'] },
  { id: 'perch', name: 'Yellow perch', water: 'pond', rarity: 1, size: [12, 28], shape: 'fish', c: ['#9aa040', '#f0e090', '#d06a30'], stripes: '#4a5020' },
  { id: 'carp', name: 'Carp', water: 'pond', rarity: 2, size: [30, 70], shape: 'deep', c: ['#9a7a3a', '#e8d08a', '#7a5a2a'] },
  { id: 'catfish', name: 'Catfish', water: 'pond', rarity: 2, time: 'night', size: [30, 90], shape: 'cat', c: ['#5a5650', '#c8c0b0', '#3e3a36'] },
  { id: 'trout', name: 'Rainbow trout', water: 'pond', rarity: 2, time: 'day', size: [25, 60], shape: 'fish', c: ['#6a8a7a', '#f0d8d0', '#5a6a5a'], band: '#e07a8a' },
  { id: 'koi', name: 'Koi', water: 'pond', rarity: 3, size: [30, 70], shape: 'fish', c: ['#f4f0e8', '#ffffff', '#e8e0d0'], spots: '#e8582a' },
  { id: 'goldkoi', name: 'Golden koi', water: 'pond', rarity: 4, weather: 'rain', size: [40, 80], shape: 'fish', c: ['#f2c040', '#ffe890', '#e0a020'], shine: true },
  { id: 'sardine', name: 'Sardine', water: 'sea', rarity: 1, size: [10, 20], shape: 'slim', c: ['#4a6a9a', '#e0e8f0', '#3a5a8a'] },
  { id: 'mackerel', name: 'Mackerel', water: 'sea', rarity: 1, size: [25, 45], shape: 'fish', c: ['#2a6a7a', '#e8eef0', '#1a4a5a'], stripes: '#14303a' },
  { id: 'seabass', name: 'Sea bass', water: 'sea', rarity: 1, size: [30, 70], shape: 'fish', c: ['#7a8a96', '#e0e4e8', '#5a6a76'] },
  { id: 'clownfish', name: 'Clownfish', water: 'sea', rarity: 2, time: 'day', size: [7, 11], shape: 'deep', c: ['#f07a20', '#f8a050', '#1d1714'], bars: '#ffffff' },
  { id: 'puffer', name: 'Pufferfish', water: 'sea', rarity: 2, size: [10, 30], shape: 'round', c: ['#c8b070', '#f4ecd0', '#a08a50'], spots: '#5a4a2a' },
  { id: 'squid', name: 'Squid', water: 'sea', rarity: 2, time: 'night', size: [20, 50], shape: 'squid', c: ['#e8a0a8', '#f8d8dc', '#c87080'] },
  { id: 'tuna', name: 'Bluefin tuna', water: 'sea', rarity: 3, size: [100, 250], shape: 'fish', c: ['#1e3a6a', '#d8dee8', '#e8c040'] },
  { id: 'octopus', name: 'Octopus', water: 'sea', rarity: 3, size: [30, 90], shape: 'octo', c: ['#c0503a', '#e88a6a', '#9a3a2a'] },
  { id: 'swordfish', name: 'Swordfish', water: 'sea', rarity: 3, time: 'day', size: [150, 300], shape: 'sword', c: ['#3a4a6a', '#c8d0dc', '#2a3a5a'] },
  { id: 'moonfish', name: 'Moonfish', water: 'sea', rarity: 4, time: 'night', size: [80, 180], shape: 'round', c: ['#c8d0e8', '#ffffff', '#e86a5a'], shine: true },
];
// Things that aren't fish. Some belong in the museum.
export const FINDS = [
  { id: 'boot', name: 'Old boot', junk: true, rarity: 1, art: 'boot' },
  { id: 'can', name: 'Rusty tin can', junk: true, rarity: 1, art: 'can' },
  { id: 'kelp', name: 'Tangle of seaweed', junk: true, rarity: 1, water: 'sea', art: 'kelp' },
  { id: 'bottle', name: 'Message in a bottle', rarity: 2, water: 'sea', art: 'bottle', note: 'The note inside is too faded to read. Maybe one day.' },
  { id: 'coin', name: 'Ancient coin', rarity: 3, art: 'coin', note: 'Worn smooth by the water. A museum piece!' },
  { id: 'ammonite', name: 'Ammonite fossil', rarity: 3, art: 'ammonite', note: 'A spiral shell from millions of years ago.' },
];
export const RARITY = ['', 'Common', 'Uncommon', 'Rare', 'Legendary'];
const ALL = [...FISH, ...FINDS];
const byId = Object.fromEntries(ALL.map((f) => [f.id, f]));

// Bobbers: wait = seconds until a bite [min, max], window = ms to react,
// luck = how much rarer the catch, junk = chance of junk instead of a fish.
export const BOBBERS = [
  { id: 'basic', name: 'Red & white', top: '#e0405a', base: '#f4f0e6', wait: [4, 9], window: 1000, luck: 0, junk: 0.16, text: 'The one you started with.' },
  { id: 'cork', name: 'Cork', top: '#c8904a', base: '#e8c890', wait: [3, 7], window: 1150, luck: 0.15, junk: 0.12, goal: { text: 'Catch 5 fish', n: (s) => s.total, of: 5 } },
  { id: 'feather', name: 'Feather', top: '#4a9ad0', base: '#f4f0e6', wait: [3, 7], window: 1350, luck: 0.3, junk: 0.1, goal: { text: 'Catch 5 different kinds', n: (s) => kinds(s), of: 5 } },
  { id: 'glow', name: 'Glow', top: '#7ae0a0', base: '#d8fff0', wait: [2.5, 6], window: 1350, luck: 0.45, junk: 0.08, night: true, goal: { text: 'Catch 3 fish at night', n: (s) => s.night || 0, of: 3 } },
  { id: 'golden', name: 'Golden', top: '#f2d36b', base: '#fff4c8', wait: [2, 5], window: 1500, luck: 0.8, junk: 0.04, goal: { text: 'Catch 12 different kinds', n: (s) => kinds(s), of: 12 } },
];
const kinds = (s) => Object.keys(s.caught).filter((id) => byId[id] && !byId[id].junk && FISH.includes(byId[id])).length;

export const fishState = () => ({ caught: {}, total: 0, night: 0, bobber: 'basic', ...load(KEY, {}) });
const put = (s) => save(KEY, s);
export const bobberUnlocked = (b, s = fishState()) => !b.goal || b.goal.n(s) >= b.goal.of;
export const currentBobber = (s = fishState()) => {
  const b = BOBBERS.find((x) => x.id === s.bobber);
  return b && bobberUnlocked(b, s) ? b : BOBBERS[0];
};
export function equipBobber(id) {
  const s = fishState();
  s.bobber = id;
  put(s);
}

const isNight = () => {
  const h = hourNow();
  return h < 6 || h >= 20;
};

// What bites: fish that live in this water at this time and weather,
// weighted by rarity; a better bobber tilts the odds toward rare ones.
export function roll(water, weather, bobber) {
  const night = isNight();
  if (Math.random() < bobber.junk) {
    const junk = FINDS.filter((f) => f.junk && (!f.water || f.water === water));
    return junk[Math.floor(Math.random() * junk.length)];
  }
  const pool = [...FISH, ...FINDS.filter((f) => !f.junk)].filter(
    (f) => (!f.water || f.water === water) && (!f.time || f.time === (night ? 'night' : 'day')) && (!f.weather || f.weather === weather),
  );
  const base = [0, 60, 26, 9, 2.5];
  const w = pool.map((f) => {
    let v = base[f.rarity] * (1 + bobber.luck * (f.rarity - 1) * 1.6);
    if (bobber.night && night && f.time === 'night') v *= 1.8;
    if (!FISH.includes(f)) v *= 0.35; // treasures are scarce
    return v;
  });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < pool.length; i++) if ((r -= w[i]) <= 0) return pool[i];
  return pool[0];
}

// Records a catch; returns { fresh, size, best, unlocked: [bobbers] }.
export function record(item) {
  const s = fishState();
  const before = BOBBERS.filter((b) => bobberUnlocked(b, s)).map((b) => b.id);
  const prev = s.caught[item.id];
  let size = null;
  if (item.size) {
    const [a, b] = item.size;
    const t = Math.pow(Math.random(), 1.6); // big ones are rarer
    size = Math.round(a + (b - a) * t);
  }
  s.caught = { ...s.caught, [item.id]: { n: (prev?.n || 0) + 1, best: Math.max(prev?.best || 0, size || 0) } };
  if (FISH.includes(item)) {
    s.total += 1;
    if (isNight()) s.night = (s.night || 0) + 1;
  }
  put(s);
  const unlocked = BOBBERS.filter((b) => bobberUnlocked(b, s) && !before.includes(b.id));
  return { fresh: !prev, size, best: size && (!prev || size > (prev.best || 0)) && !!prev, unlocked };
}

// ---------- Drawing ----------
// Fish are drawn side-on, facing right, on a 24×14 grid (scaled up later).
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const OUT = '#1d1714';
const ITEM_ART = {
  boot: ['.....####...', '.....#oo#...', '.....#oo#...', '.....#oo#...', '.....#oo#...', '.....#oo##..', '.....#ooo##.', '..####oooo#.', '.#oooooooo#.', '.##########.'],
  can: ['..######..', '.#dddddd#.', '.#oooooo#.', '.#rrrrrr#.', '.#rrrrrr#.', '.#rrrrrr#.', '.#oooooo#.', '.#dddddd#.', '..######..'],
  kelp: ['...g....g...', '..gg...gg...', '..g...gg..g.', '..gg..g..gg.', '...g..gg.g..', '...gg..g.g..', '....g..ggg..', '....gg..g...', '.....gggg...', '......gg....'],
  bottle: ['....##....', '....#c#...', '...#cc#...', '..#gggg#..', '..#gwwg#..', '..#gwwg#..', '..#gwwg#..', '..#gggg#..', '..#gggg#..', '...####...'],
  coin: ['...####...', '..#yyyy#..', '.#yoooy##.', '.#yoyyoy#.', '.#yoyyoy#.', '.#yoooy##.', '..#yyyy#..', '...####...'],
  ammonite: ['...#####...', '..#sssss#..', '.#ss###ss#.', '.#s#sss#s#.', '.#s#s#s#s#.', '.#s#ss#ss#.', '.#ss###s#..', '..#sssss#..', '...#####...'],
};
const ITEM_COLORS = { o: '#8a5a3a', d: '#a8a8b0', r: '#c05040', g: '#4a8a5a', w: '#f4ecd0', c: '#b08a5a', y: '#f2d36b', s: '#c8a878', '#': OUT };

export function drawCatch(item, scale = 4) {
  const cv = document.createElement('canvas');
  if (item.art) {
    const rows = ITEM_ART[item.art];
    cv.width = rows[0].length * scale;
    cv.height = rows.length * scale;
    const g = cv.getContext('2d');
    rows.forEach((r, y) =>
      [...r].forEach((ch, x) => {
        if (ch === '.') return;
        g.fillStyle = ITEM_COLORS[ch];
        g.fillRect(x * scale, y * scale, scale, scale);
      }),
    );
    return cv;
  }
  const W = 26;
  const H = 16;
  cv.width = W * scale;
  cv.height = H * scale;
  const g = cv.getContext('2d');
  const px = fishPixels(item, W, H);
  px.forEach((row, y) =>
    row.forEach((c, x) => {
      if (!c) return;
      g.fillStyle = c;
      g.fillRect(x * scale, y * scale, scale, scale);
    }),
  );
  return cv;
}

// A silhouette for fish you haven't caught yet.
export function drawShadow(item, scale = 3) {
  const cv = drawCatch(item, scale);
  const g = cv.getContext('2d');
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = 'rgba(20, 16, 14, 0.55)';
  g.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

function fishPixels(f, W, H) {
  const [back, belly, fin] = f.c;
  const grid = Array.from({ length: H }, () => Array(W).fill(null));
  const cy = H / 2;
  // body: an ellipse-ish shape per kind
  const shapes = {
    slim: { x0: 5, x1: 21, h: 2.6 },
    fish: { x0: 4, x1: 21, h: 3.6 },
    deep: { x0: 5, x1: 20, h: 5 },
    cat: { x0: 3, x1: 22, h: 3.2 },
    round: { x0: 5, x1: 19, h: 6 },
    sword: { x0: 6, x1: 19, h: 3.2 },
    squid: { x0: 3, x1: 16, h: 3 },
    octo: { x0: 9, x1: 19, h: 4.5 },
  };
  const S = shapes[f.shape] || shapes.fish;
  const inBody = (x, y) => {
    const t = (x - S.x0) / (S.x1 - S.x0);
    if (t < 0 || t > 1) return false;
    const half = S.h * Math.sqrt(Math.max(0, 1 - Math.pow(2 * t - 1, 2))) * (f.shape === 'squid' ? 0.5 + t * 0.6 : 1);
    return Math.abs(y + 0.5 - cy) <= half;
  };
  const set = (x, y, c) => x >= 0 && y >= 0 && x < W && y < H && (grid[y][x] = c);
  if (f.shape === 'octo') {
    // head and eight curling arms
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (Math.hypot((x - 14) / 5, (y - 5) / 4.5) < 1) set(x, y, y > 6 ? belly : back);
    for (let a = 0; a < 6; a++) for (let i = 0; i < 6; i++) set(8 + a * 2 + Math.round(Math.sin(i * 0.9 + a) * 1), 9 + i, i % 2 ? fin : back);
  } else {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inBody(x, y)) set(x, y, y + 0.5 > cy + 0.5 ? belly : back);
    // tail
    if (f.shape === 'squid') {
      for (let i = 0; i < 5; i++) for (let k = 0; k < 4; k++) set(S.x1 + i, Math.round(cy - 2 + k * 1.3 + Math.sin(i + k) * 0.5), fin);
      for (let y = -3; y <= 3; y++) set(S.x0 - 1, Math.round(cy + y), fin); // the fins at the point
    } else {
      const tx = S.x0 - 1;
      const spread = f.shape === 'round' ? 3 : f.shape === 'slim' ? 2.5 : 3.5;
      for (let i = 0; i < 4; i++) for (let y = -Math.round(1 + i * spread * 0.35); y <= Math.round(1 + i * spread * 0.35); y++) set(tx - i, Math.round(cy - 0.5 + y), fin);
      // a fin on the back
      const fx = Math.round((S.x0 + S.x1) / 2);
      for (let i = -2; i <= 2; i++) set(fx + i, Math.round(cy - S.h - (i < 1 ? 1 : 0)), fin);
    }
    if (f.shape === 'sword') for (let x = S.x1; x < W; x++) set(x, Math.round(cy - 1), fin); // the bill
    if (f.shape === 'cat') [[S.x1, cy + 1], [S.x1 + 1, cy + 2], [S.x1, cy + 2], [S.x1 + 2, cy + 3]].forEach(([x, y]) => set(x, Math.round(y), OUT)); // whiskers
  }
  // markings
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (grid[y][x] !== back && grid[y][x] !== belly) continue;
      if (f.stripes && x % 3 === 0 && grid[y][x] === back) grid[y][x] = f.stripes;
      if (f.bars && (Math.abs(x - 9) < 1 || Math.abs(x - 15) < 1)) grid[y][x] = f.bars;
      if (f.band && Math.abs(y + 0.5 - cy) < 1) grid[y][x] = f.band;
      if (f.spots && (x * 7 + y * 13) % 11 < 2) grid[y][x] = f.spots;
    }
  // outline
  const filled = (x, y) => grid[y]?.[x] && grid[y][x] !== OUT;
  const out = grid.map((row) => row.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!grid[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => filled(x + dx, y + dy))) out[y][x] = OUT;
  // shading: light along the top edge, a highlight for shiny ones
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const c = out[y][x];
      if (!c || c === OUT) continue;
      if (out[y - 1]?.[x] === OUT) out[y][x] = mix(c, '#ffffff', f.shine ? 0.5 : 0.25);
      if (out[y + 1]?.[x] === OUT) out[y][x] = mix(c, '#000000', 0.25);
    }
  // the eye
  const ex = f.shape === 'octo' ? 12 : f.shape === 'squid' ? S.x1 - 3 : S.x1 - 3;
  const ey = f.shape === 'octo' ? 5 : Math.round(cy - (f.shape === 'round' || f.shape === 'deep' ? 2 : 1));
  out[ey][ex] = '#ffffff';
  out[ey][ex + 1] = OUT;
  if (f.shape === 'octo') {
    out[ey][ex + 3] = '#ffffff';
    out[ey][ex + 4] = OUT;
  }
  return out;
}
function mix(a, b, t) {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`;
}

// The bobber as seen on the water, 7×9.
export function bobberTexture(scene, b) {
  const key = `bobber_${b.id}`;
  if (scene.textures.exists(key)) return key;
  const rows = ['..###..', '.#ttt#.', '#ttttt#', '#ttttt#', '#bbbbb#', '#bbbbb#', '.#bbb#.', '..###..', '...#...'];
  const t = scene.textures.createCanvas(key, 7, 9);
  const g = t.getContext();
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = ch === '#' ? OUT : ch === 't' ? b.top : b.base;
      g.fillRect(x, y, 1, 1);
    }),
  );
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillRect(2, 2, 1, 1);
  t.refresh();
  return key;
}

// ---------- The catch card ----------
const card = document.getElementById('catch');
export function showCatch(item, info, onClose) {
  const pic = card.querySelector('.catch-pic');
  pic.replaceChildren(drawCatch(item, 6));
  card.querySelector('.catch-title').textContent = item.junk ? item.name : `You caught ${/^[aeiou]/i.test(item.name) ? 'an' : 'a'} ${item.name}!`;
  const bits = [];
  if (!item.junk) bits.push(`<span class="r${item.rarity}">${RARITY[item.rarity]}</span>`);
  if (info.size) bits.push(info.size >= 100 ? `${(info.size / 100).toFixed(2)} m` : `${info.size} cm`);
  if (info.fresh && !item.junk) bits.push('<b class="catch-new">New!</b>');
  else if (info.best) bits.push('<b class="catch-new">Biggest yet!</b>');
  card.querySelector('.catch-meta').innerHTML = bits.join(' · ');
  const notes = [];
  if (item.junk) notes.push('Not a fish. Into the bin it goes.');
  if (item.note) notes.push(item.note);
  if (info.fresh && !item.junk && FISH.includes(item)) notes.push('Added to your fish log (Journal → Fish).');
  info.unlocked.forEach((b) => notes.push(`New bobber unlocked: ${b.name}! Equip it in Journal → Fish.`));
  card.querySelector('.catch-note').textContent = notes.join(' ');
  card.classList.remove('hidden');
  const close = () => {
    card.classList.add('hidden');
    card.onclick = null;
    onClose?.();
  };
  setTimeout(() => (card.onclick = close), 350); // don't close on the same tap
  if (info.unlocked.length) sfx('unlock');
}
export const catchOpen = () => !card.classList.contains('hidden');

// ---------- The journal tab ----------
export function fishTab() {
  const s = fishState();
  const nodes = [];
  const head = document.createElement('p');
  head.className = 'toolkit-note';
  head.textContent = `${kinds(s)} of ${FISH.length} fish caught. Stand at the water's edge facing the water and tap Fish. The pond and the sea have different fish, and some only bite at night or in the rain.`;
  nodes.push(head);

  const bh = document.createElement('h3');
  bh.className = 'fish-h';
  bh.textContent = 'Bobbers';
  nodes.push(bh);
  const blist = document.createElement('div');
  blist.className = 'bobber-list';
  const cur = currentBobber(s);
  BOBBERS.forEach((b) => {
    const open = bobberUnlocked(b, s);
    const row = document.createElement('button');
    row.className = 'bobber' + (b.id === cur.id ? ' on' : '') + (open ? '' : ' locked');
    row.disabled = !open;
    const n = b.goal ? Math.min(b.goal.n(s), b.goal.of) : 0;
    row.innerHTML = `<i class="bob-dot" style="--top:${b.top};--base:${b.base}"></i><span><b></b><small></small></span><em></em>`;
    row.querySelector('b').textContent = b.name;
    row.querySelector('small').textContent = open ? `Bites in ${b.wait[0]}–${b.wait[1]}s · ${(b.window / 1000).toFixed(2)}s to react${b.luck ? ` · rarer fish +${Math.round(b.luck * 100)}%` : ''}${b.night ? ' · night fish love it' : ''}` : `${b.goal.text} (${n}/${b.goal.of})`;
    row.querySelector('em').textContent = b.id === cur.id ? 'Equipped' : open ? 'Equip' : 'Locked';
    if (open)
      row.onclick = () => {
        equipBobber(b.id);
        sfx('tap');
        row.parentElement.parentElement.replaceChildren(...fishTab());
      };
    blist.appendChild(row);
  });
  nodes.push(blist);

  const fh = document.createElement('h3');
  fh.className = 'fish-h';
  fh.textContent = 'Fish log';
  nodes.push(fh);
  const grid = document.createElement('div');
  grid.className = 'fish-grid';
  [...FISH, ...FINDS.filter((f) => !f.junk)].forEach((f) => {
    const got = s.caught[f.id];
    const cell = document.createElement('div');
    cell.className = 'fish-cell' + (got ? '' : ' unknown');
    const k = f.art ? 4 : 3;
    const pic = got ? drawCatch(f, k) : drawShadow(f, k);
    const where = f.water ? (f.water === 'pond' ? 'Pond' : 'Sea') : 'Pond or sea';
    const when = [f.time === 'night' ? 'night' : f.time === 'day' ? 'day' : '', f.weather === 'rain' ? 'rain' : ''].filter(Boolean).join(', ');
    cell.innerHTML = `<div class="fish-pic"></div><b></b><small></small>`;
    cell.querySelector('.fish-pic').appendChild(pic);
    cell.querySelector('b').textContent = got ? f.name : '???';
    cell.querySelector('small').textContent = got ? `×${got.n}${got.best ? ` · best ${got.best >= 100 ? `${(got.best / 100).toFixed(2)} m` : `${got.best} cm`}` : ''}` : `${where}${when ? ` · ${when}` : ''} · ${RARITY[f.rarity]}`;
    grid.appendChild(cell);
  });
  nodes.push(grid);
  return nodes;
}

// ---------- The fishing itself ----------
// Runs inside a scene; the scene supplies the player sprite and calls
// update(dt) each frame. tap() is the hook (screen tap or the button).
export class Fishing {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.state = 'idle';
    this.g = scene.add.graphics().setDepth(4000);
  }

  get busy() {
    return this.state !== 'idle';
  }

  // facing: 'up' | 'down' | 'left' | 'right'; target: where the bobber lands
  cast(target, water, weather) {
    if (this.busy) return;
    const s = this.scene;
    this.water = water;
    this.weather = weather;
    this.bobber = currentBobber();
    this.target = target;
    this.state = 'cast';
    this.t = 0;
    sfx('cast');
    haptic(10);
    const key = bobberTexture(s, this.bobber);
    const tip = this.tip();
    this.bob = s.add.image(tip.x, tip.y, key).setOrigin(0.5, 1).setDepth(target.y + 1);
    s.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 480,
      ease: 'Sine.easeOut',
      onUpdate: (tw) => {
        const k = tw.getValue();
        const a = this.tip();
        this.bob.setPosition(a.x + (target.x - a.x) * k, a.y + (target.y + 3 - a.y) * k - Math.sin(k * Math.PI) * 30);
      },
      onComplete: () => {
        this.splash(target.x, target.y + 2, 1);
        sfx('plop');
        this.state = 'wait';
        this.t = 0;
        const [a, b] = this.bobber.wait;
        this.biteAt = a + Math.random() * (b - a);
        this.nibbles = [0.35, 0.6, 0.8].filter(() => Math.random() < 0.6).map((k) => this.biteAt * k);
      },
    });
  }

  // the rod's tip: off the player's hand, out toward the water
  tip() {
    const p = this.player;
    const f = this.facing;
    const dx = f === 'left' ? -14 : f === 'right' ? 14 : f === 'up' ? 5 : -5;
    const dy = f === 'up' ? -30 : f === 'down' ? -12 : -24;
    return { x: p.x + dx, y: p.y + dy };
  }

  splash(x, y, big) {
    const s = this.scene;
    for (let i = 0; i < (big ? 2 : 1); i++) {
      const ring = s.add.ellipse(x, y, 6, 2.4).setStrokeStyle(1, 0xf2fbff, 0.9).setDepth(y);
      s.tweens.add({ targets: ring, scaleX: 3 + i, scaleY: 3 + i, alpha: 0, delay: i * 140, duration: 700, onComplete: () => ring.destroy() });
    }
    if (big)
      for (let i = 0; i < 5; i++) {
        const drop = s.add.rectangle(x, y - 2, 1.5, 1.5, 0xe8f6ff).setDepth(y + 2);
        s.tweens.add({ targets: drop, x: x + (Math.random() - 0.5) * 14, y: y - 6 - Math.random() * 8, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => drop.destroy() });
      }
  }

  update(dt) {
    const g = this.g;
    g.clear();
    if (!this.busy || !this.bob) return;
    this.t += dt;
    const tgt = this.target;
    if (this.state === 'wait') {
      let y = tgt.y + 3 + Math.sin(this.t * 3) * 0.6;
      const nib = this.nibbles.find((n) => this.t > n && this.t < n + 0.25);
      if (nib !== undefined) {
        y += 1.5;
        if (!this.nibbled?.has(nib)) {
          (this.nibbled ||= new Set()).add(nib);
          this.splash(tgt.x, tgt.y + 2, 0);
          sfx('tap');
        }
      }
      this.bob.setPosition(tgt.x, y);
      if (this.t >= this.biteAt) this.bite();
    } else if (this.state === 'bite') {
      this.bob.setPosition(tgt.x + Math.sin(this.t * 40) * 0.8, tgt.y + 6).setAlpha(0.55);
      if (this.t > this.bobber.window / 1000) this.miss();
    }
    if (!this.bob) return; // it got away (or was hooked) this frame
    // the rod and the line (sagging a little while it waits)
    const a = this.tip();
    const p = this.player;
    g.lineStyle(1.5, 0x5a3a24, 1);
    g.lineBetween(p.x + (a.x - p.x) * 0.25, p.y - 14, a.x, a.y);
    g.lineStyle(0.6, 0xf4f0e6, 0.85);
    const b = { x: this.bob.x, y: this.bob.y - 8 };
    const sag = this.state === 'bite' ? 0 : 8;
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(a.x, a.y), new Phaser.Math.Vector2((a.x + b.x) / 2, Math.max(a.y, b.y) + sag), new Phaser.Math.Vector2(b.x, b.y));
    curve.draw(g, 16);
  }

  bite() {
    const s = this.scene;
    this.state = 'bite';
    this.t = 0;
    this.splash(this.target.x, this.target.y + 2, 1);
    sfx('bite');
    haptic(60);
    const p = this.player;
    this.bang = s.add.text(p.x, p.y - 46, '!', { fontFamily: 'Georgia, serif', fontSize: '34px', fontStyle: 'bold', color: '#ffe36b', stroke: '#1d1714', strokeThickness: 6 }).setOrigin(0.5, 1).setDepth(4001).setResolution(4);
    this.bang.setScale(0.2);
    s.tweens.add({ targets: this.bang, scale: 1, duration: 140, ease: 'Back.easeOut' });
  }

  tap() {
    if (this.state === 'bite') return this.hook();
    if (this.state === 'wait') {
      this.end();
      this.scene.toast('Too soon! Wait for the bobber to go under, then tap.');
    }
  }

  hook() {
    const s = this.scene;
    const item = roll(this.water, this.weather, this.bobber);
    const info = record(item);
    this.state = 'reel';
    this.bang?.destroy();
    sfx('reel');
    haptic(25);
    // the catch flies out of the water to you
    const pic = drawCatch(item, 1);
    const key = `catch_${item.id}`;
    if (!s.textures.exists(key)) s.textures.addCanvas(key, pic);
    const p = this.player;
    const fish = s.add.image(this.target.x, this.target.y, key).setDepth(4002).setScale(0.9);
    this.splash(this.target.x, this.target.y + 2, 1);
    this.bob.destroy();
    this.bob = null;
    this.g.clear();
    s.tweens.add({
      targets: fish,
      x: p.x,
      y: p.y - 44,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => {
        s.tweens.add({ targets: fish, y: fish.y - 3, yoyo: true, repeat: -1, duration: 300 });
        sfx(item.junk ? 'nope' : item.rarity >= 3 ? 'levelup' : 'star');
        showCatch(item, info, () => {
          fish.destroy();
          this.state = 'idle';
        });
      },
    });
  }

  miss() {
    this.scene.toast('It got away…');
    sfx('nope');
    this.end();
  }

  // reel in with nothing
  end() {
    this.bang?.destroy();
    this.bang = null;
    this.bob?.destroy();
    this.bob = null;
    this.nibbled = null;
    this.g.clear();
    this.state = 'idle';
  }
}
