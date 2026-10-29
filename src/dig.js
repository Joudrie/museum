// Digging: walk up to a dig spot, tap Dig, and brush the dirt off with your
// finger. What's underneath is a real mineral or fossil (those collections), and
// it goes into the journal. A spot rests for a while after it has been dug.
import { load, save } from './storage.js';
import { list, RARITY } from './collections/index.js';
import { collect, count, ownedCount } from './collections/codex.js';
import { drawEntry } from './collections/render.js';
import { sfx } from './music.js';
import { haptic } from './ui.js';
import { addCoins } from './wallet.js';
import { dayNum } from './daily.js';

const KEY = 'curation.digs'; // { spotKey: readyAt (ms) }
const PARTS = 'curation.digparts'; // { entryId: parts found so far } for big finds that take several spots
const REST = 10 * 60 * 1000;
const SIZE = 240; // css px of the digging patch

// Tools: what you dig with changes how fast the dirt clears and what turns up. They are earned:
// each unlocks after you have found enough different things (no shop, nothing to buy).
//   reach: brush width in css px; flat: how much rarity counts against a find (1 = the plain odds; higher = rare finds
//   turn up less). The brush keeps the plain odds, so the faster tools trade a little luck for speed.
export const TOOLS = {
  brush: { name: 'Brush', reach: 22, flat: 1, need: 0, note: 'Slow and careful: the best odds for a rare find.' },
  trowel: { name: 'Trowel', reach: 34, flat: 1.15, need: 6, note: 'Clears dirt faster; rare finds a little less likely.' },
  pick: { name: 'Pick', reach: 52, flat: 1.3, need: 16, note: 'Very fast, but rare finds turn up less.' },
};
const DIG_COLLECTIONS = () => ['mineral', 'fossil', 'pottery', 'coin', 'arrowhead', 'shell', 'meteorite', 'map'];
/** How many different dug things you have found so far (decides which tools you have). */
export const foundCount = () => DIG_COLLECTIONS().reduce((n, c) => n + count(c), 0);
export const toolUnlocked = (t, found = foundCount()) => found >= (TOOLS[t]?.need ?? Infinity);

// Today's dig goal: gentle, a few coins for a few digs, no streak and nothing lost if you skip a day.
const DAILY = 'curation.digdaily'; // { day, n, paid }
export const DAILY_GOAL = 3;
export const DAILY_GOLD = 120;
const dayNow = () => dayNum(); // the player's own calendar day, like the daily gift
export function dailyDigs() {
  const d = load(DAILY, {});
  return d.day === dayNow() ? { n: d.n || 0, paid: !!d.paid } : { n: 0, paid: false };
}
/** Counts a finished dig toward today's goal. Returns { n, goal, reached } (reached: this dig paid out). */
export function recordDig() {
  const { n, paid } = dailyDigs();
  const next = n + 1;
  const reached = !paid && next >= DAILY_GOAL;
  save(DAILY, { day: dayNow(), n: next, paid: paid || reached });
  if (reached) addCoins(DAILY_GOLD);
  return { n: next, goal: DAILY_GOAL, reached };
}

/** A save key for the island a scene is on. Builder and friends' islands all load as 'test', so they go by name. */
export const mapKey = (scene) => (scene.mapId === 'test' ? `isle:${scene.map?.name || 'test'}` : scene.mapId || 'one');

export const partsOf = (id) => load(PARTS, {})[id] || 0;

export const readyIn = (key, now = Date.now()) => Math.max(0, (load(KEY, {})[key] || 0) - now);

// A dig spot's kind decides which collections it gives up. Builder tiles map to kinds in DIG_TILES.
export const DIG_KINDS = {
  mineral: { collections: ['mineral'] },
  fossil: { collections: ['fossil'] },
  ruin: { collections: ['pottery', 'coin', 'arrowhead', 'map'] },
  shore: { collections: ['shell'] },
  crater: { collections: ['meteorite'] },
};
export const DIG_TILES = { dig_spot: 'mineral', dig_fossil: 'fossil', dig_ruin: 'ruin', dig_shore: 'shore', dig_crater: 'crater', dig_cliff: 'fossil', dig_trench: 'ruin' };
export const entriesFor = (kind) => (DIG_KINDS[kind]?.collections || [kind]).flatMap((c) => list({ collection: c }));

// Rarer finds turn up less often.
export function pick(entries = entriesFor('mineral'), rnd = Math.random, tool = 'plain') {
  const flat = TOOLS[tool]?.flat ?? 1;
  const w = entries.map((e) => Math.max(0.05, 5 - (e.rarity || 1) * flat));
  let r = rnd() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < entries.length; i++) if ((r -= w[i]) <= 0) return entries[i];
  return entries[0];
}

// A site: dig spots of one kind that touch (sides or corners), like a trench or a cliff face worked across
// several tiles. Dig every tile of a site of 3 or more within one rest period and the site gives a bonus find.
export function siteOf(spot, spots) {
  const group = [spot];
  for (let i = 0; i < group.length; i++) {
    spots.forEach((o) => {
      if (o.kind === spot.kind && !group.includes(o) && Math.abs(o.gx - group[i].gx) <= 1 && Math.abs(o.gy - group[i].gy) <= 1) group.push(o);
    });
  }
  return group;
}
export const SITE_MIN = 3;
export const siteKey = (site) => 'site:' + site.map((s) => s.key).sort()[0];
/** The bonus is ready when the site is big enough, every tile is resting, and the bonus itself has not been taken this round. */
export const siteBonusReady = (site, now = Date.now()) => site.length >= SITE_MIN && site.every((s) => readyIn(s.key, now) > 0) && readyIn(siteKey(site), now) === 0;
export const bonusEntry = (kind, rnd = Math.random) => pick(entriesFor(kind).filter((e) => (e.rarity || 1) >= 3 || e.parts), rnd, 'brush');

let el = null;
function build() {
  el = document.createElement('div');
  el.id = 'dig';
  el.className = 'hidden';
  el.setAttribute('role', 'dialog');
  el.innerHTML = '<div class="dig-card"><b class="dig-title">Brush the dirt away</b><canvas class="dig-canvas"></canvas><div class="dig-tools"></div><span class="dig-meta"></span><p class="dig-note"></p><button class="dig-close main">Leave it</button></div>';
  document.body.appendChild(el);
}

/**
 * Opens the digging patch. onClose({ found }) fires when it closes.
 * Pass `entry` to fix what is underneath; otherwise the tool you pick helps decide (until your first stroke).
 */
export function startDig(key, { onClose, onFound, collection = 'mineral', entry } = {}) {
  if (!el) build();
  let tool = 'brush';
  let handle;
  const fixed = !!entry;
  const roll = () => entry || pick(entriesFor(collection), Math.random, tool);
  const tools = el.querySelector('.dig-tools');
  const found = foundCount();
  const draw = () => {
    tools.replaceChildren(
      ...Object.entries(TOOLS).map(([id, t]) => {
        const b = document.createElement('button');
        const open = toolUnlocked(id, found);
        b.textContent = open ? t.name : `${t.name} 🔒`;
        b.title = open ? t.note : `Find ${t.need} different things to unlock`;
        b.className = id === tool ? 'on' : '';
        b.disabled = !open;
        b.onclick = () => {
          if (handle.started() || tool === id) return;
          tool = id;
          handle = setup(key, { onClose, onFound, entry: roll(), tool });
          draw();
        };
        return b;
      }),
    );
    tools.hidden = fixed || found < TOOLS.trowel.need; // nothing to choose until a second tool is earned
  };
  handle = setup(key, { onClose, onFound, entry: roll(), tool });
  draw();
  return handle;
}

function setup(key, { onClose, onFound, entry, tool }) {
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
    let got = null;
    let part = 0;
    if (entry.parts) {
      const p = load(PARTS, {});
      part = Math.min(entry.parts, (p[entry.id] || 0) + 1);
      p[entry.id] = part;
      if (part >= entry.parts) {
        delete p[entry.id];
        got = onFound ? onFound(entry) : collect(entry.id);
      }
      save(PARTS, p);
    } else got = onFound ? onFound(entry) : collect(entry.id); // (expeditions bring finds home dirty instead)
    const whole = !entry.parts || part >= entry.parts;
    sfx('unlock');
    haptic?.();
    const a = /^[aeiou]/i.test(entry.title) ? 'an' : 'a';
    q('.dig-title').textContent = whole ? `You found ${a} ${entry.title}!` : `Part of ${a} ${entry.title}!`;
    q('.dig-meta').innerHTML = `<span class="r${entry.rarity}">${RARITY[entry.rarity]}</span>${whole ? (!got || got.fresh ? ' · <b class="catch-new">New!</b>' : '') : ` · piece ${part} of ${entry.parts}`}`;
    q('.dig-note').textContent = whole
      ? got?.note || (entry.blurb || '') + (entry.dirty ? ' It is filthy: it will need cleaning before it can go on display.' : '')
      : `${entry.parts - part} more to find. Keep digging at fossil spots: the rest is out there.`;
    q('.dig-close').textContent = 'Nice';
    const t = load(KEY, {});
    t[key] = Date.now() + REST;
    save(KEY, t);
    if (entry.collection === 'map') {
      const have = entriesFor('map').filter((e) => ownedCount(e.id) > 0).length;
      q('.dig-note').textContent += have >= 4 ? ' All four pieces! Look for the X on an island.' : ` Map pieces: ${have} of 4.`;
    }
    const day = recordDig();
    q('.dig-note').textContent += day.reached ? ` Daily dig goal done: +${DAILY_GOLD} gold!` : day.n < day.goal ? ` Today's digs: ${day.n} of ${day.goal}.` : '';
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
    d.lineWidth = TOOLS[tool].reach;
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
  return { entry, cleared, finish, canvas: cv, dirt, started: () => moves > 0 };
}

export const digOpen = () => !!el && !el.classList.contains('hidden');
