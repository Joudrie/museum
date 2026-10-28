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
import { list, slugOf, RARITY as RARITY_NAMES } from './collections/index.js';
import { snapshot, collect } from './collections/codex.js';
import { drawEntry, drawShadow as shadowOf } from './collections/render.js';
import { registerTabExtra } from './collections/tab.js';

const KEY = 'curation.fishing'; // { total, night, bobber } (what you've caught lives in the codex; older saves kept it here as caught)

// What bites comes from the collection registry (src/collections/data/fish.js).
// These are the shapes the fishing code reads: water pond / sea, rarity 1
// common … 4 legendary, time day / night / any. `entry` is the registry entry.
const view = (e) => ({
  id: slugOf(e),
  name: e.title,
  rarity: e.rarity ?? 1,
  ...e.acquire,
  ...(e.collectable === false && { junk: true }),
  ...(e.provenance?.story && { note: e.provenance.story }),
  entry: e,
});
export const FISH = list({ collection: 'fish' }).map(view);
// Things that aren't fish. Some belong in the museum.
export const FINDS = list({ collection: 'find', all: true }).map(view);
export const RARITY = RARITY_NAMES;
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

// `caught` is read from the codex: { slug: { n, best } }, the shape older saves used.
const caughtNow = () => {
  const c = snapshot();
  const out = {};
  [...FISH, ...FINDS].forEach((f) => {
    const r = c.seen[f.entry.id];
    if (r) out[f.id] = { n: r.n, best: r.best || 0 };
  });
  return out;
};
export const fishState = () => {
  const caught = caughtNow(); // (first, so an older save is moved into the codex before anything else)
  return { total: 0, night: 0, bobber: 'basic', ...load(KEY, {}), caught };
};
const put = (s) => {
  const { caught, ...rest } = s;
  save(KEY, { ...load(KEY, {}), ...rest });
};
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
  let size = null;
  if (item.size) {
    const [a, b] = item.size;
    const t = Math.pow(Math.random(), 1.6); // big ones are rarer
    size = Math.round(a + (b - a) * t);
  }
  const got = collect(item.entry.id, { size }); // null for junk, which is never kept
  if (FISH.includes(item)) {
    s.total += 1;
    if (isNight()) s.night = (s.night || 0) + 1;
  }
  put(s);
  const after = fishState();
  const unlocked = BOBBERS.filter((b) => bobberUnlocked(b, after) && !before.includes(b.id));
  return { fresh: !got || got.fresh, size, best: !!got?.improved, unlocked };
}

// ---------- Drawing ----------
// Fish and finds are drawn from their registry entries (src/collections/render.js).
export const drawCatch = (item, scale = 4) => drawEntry(item.entry, scale);
// A silhouette for fish you haven't caught yet.
export const drawShadow = (item, scale = 3) => shadowOf(item.entry, scale);
const OUT = '#1d1714';

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
// The Fish tab itself is generic (src/collections/tab.js). Fishing adds the
// bobber list above the log.
registerTabExtra('fish', ({ refresh }) => {
  const s = fishState();
  const nodes = [];
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
        refresh();
      };
    blist.appendChild(row);
  });
  nodes.push(blist);
  return nodes;
});

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
