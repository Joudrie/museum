// Hunts on islands (Puzzles delegates to this):
//   Metal detector: earned after 10 different dug finds. A small badge on the island says Cold, Cool, Warm or Hot
//     for the nearest of three things buried today (the same spots all day, new ones tomorrow). Stand on it and
//     press Dig for a ruin find. Tap the badge to hide it.
//   X marks the spot: a builder "X marks the spot" tile stays hidden until you hold all four torn map pieces
//     (ruin dig spots turn them up). Dig the X for a treasure; the pieces are used up.
//   Rest labels: a dug spot nearby shows how long until it can be dug again.
import { load, save } from './storage.js';
import { startDig, readyIn, foundCount, bonusEntry, entriesFor, mapKey } from './dig.js';
import { ownedCount, dispose } from './collections/codex.js';
import { dayNum } from './daily.js';

const T = 32;
export const DETECTOR_NEED = 10;
const TARGETS = 3;
const HUNT = 'curation.hunt'; // { day, done: { key: 1 } } buried things already dug today

// A small seeded random so a day's buried things stay put.
const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const seedOf = (text) => [...text].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

export const HEAT = [
  [40, 'Right here!', 4],
  [130, 'Hot', 3],
  [280, 'Warm', 2],
  [520, 'Cool', 1],
  [Infinity, 'Cold', 0],
];
export const heatFor = (d) => HEAT.find(([max]) => d <= max);

export class Hunts {
  constructor(scene) {
    this.s = scene;
    this.xs = [];
    this.targets = null;
    this.t = 0;
    this.badge = null;
    this.hide = false;
    this.on = !!scene.map && foundCount() >= DETECTOR_NEED;
    this.restT = 0;
    this.mapT = 1; // seconds since the map pieces were last counted (the codex is read from storage, so not every frame)
    this.whole = false;
  }

  get any() {
    return this.on || this.xs.length > 0 || this.s.digs.length > 0;
  }

  piece(name, x, y) {
    if (name !== 'x_mark') return false;
    const img = this.s.place(name, x, y, { flat: true }).setVisible(false);
    this.xs.push({ x, y, cx: (x + 0.5) * T, cy: (y + 0.5) * T, img, shown: false, key: `${mapKey(this.s)}:x:${x},${y}` });
    return true;
  }

  maps() {
    return entriesFor('map').every((e) => ownedCount(e.id) > 0);
  }

  // buried things: spots on land, away from where you start, the same all day
  plant() {
    const s = this.s;
    const day = dayNum();
    const done = load(HUNT, {});
    const left = done.day === day ? done.done || {} : {};
    const r = rng(seedOf(`${day}:${mapKey(s)}`));
    const H = s.solid.length;
    const W = s.solid[0].length;
    const out = [];
    for (let tries = 0; tries < 800 && out.length < TARGETS; tries++) {
      const x = 3 + Math.floor(r() * (W - 6));
      const y = 3 + Math.floor(r() * (H - 6));
      const px = (x + 0.5) * T;
      const py = (y + 0.5) * T;
      if (!s.free(px, py) || s.ground_(px, py) === 'water') continue;
      if (Math.hypot(px - s.player.x, py - s.player.y) < 160 || out.some((o) => Math.hypot(o.x - px, o.y - py) < 200)) continue;
      const key = `${mapKey(s)}:buried:${out.length}`;
      out.push({ x: px, y: py, key, done: !!left[key] });
    }
    this.targets = out;
  }

  badgeEl() {
    if (this.badge) return this.badge;
    const b = document.createElement('button');
    b.id = 'detector';
    b.className = 'pixel-btn';
    b.setAttribute('aria-label', 'Metal detector');
    b.onclick = () => ((this.hide = !this.hide), this.paint(this.last));
    document.body.appendChild(b);
    this.s.events.once('shutdown', () => b.remove());
    return (this.badge = b);
  }

  paint(h) {
    if (!this.badge) return;
    this.last = h;
    this.shown = `${h ? h[1] : 'none'}|${this.hide}`;
    this.badge.classList.toggle('mini', this.hide);
    this.badge.dataset.heat = h ? h[2] : 0;
    this.badge.textContent = this.hide ? 'Detector' : `Detector: ${h ? h[1] : 'all found today'}`;
  }

  near(max = Infinity) {
    const p = this.s.player;
    let best = null;
    (this.targets || []).forEach((tg) => {
      if (tg.done) return;
      const d = Math.hypot(p.x - tg.x, p.y - tg.y);
      if (d < max && (!best || d < best.d)) best = { tg, d };
    });
    return best;
  }

  update(dt) {
    const s = this.s;
    this.t += dt;
    this.restT += dt;
    this.mapT += dt;
    // the X appears once the map is whole (counted once a second)
    if (this.xs.length && this.t > 0.5 && this.mapT >= 1) {
      this.mapT = 0;
      const whole = (this.whole = this.maps());
      this.xs.forEach((x) => {
        if (whole === x.shown) return;
        x.shown = whole;
        x.img.setVisible(whole).setAlpha(0);
        if (whole) {
          s.tweens.add({ targets: x.img, alpha: 1, duration: 900 });
          s.toast('The map is whole. An X shows on the ground somewhere on this island.');
        }
      });
    }
    // rest labels on dug spots close by
    if (this.restT > 1) {
      this.restT = 0;
      s.digs.forEach((d) => {
        const wait = readyIn(d.key);
        const near = wait > 0 && Math.hypot(s.player.x - d.x, s.player.y - d.y) < 150;
        if (near) {
          d.label ||= s.add.text(d.x, d.y - 18, '', { fontFamily: 'monospace', fontSize: '10px', color: '#ffe9a8', stroke: '#20201a', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(900001);
          d.label.setText(`${Math.ceil(wait / 60000)} min`).setVisible(true);
        } else d.label?.setVisible(false);
      });
    }
    if (!this.on) return;
    if (!this.targets) this.plant();
    const n = this.near();
    this.badgeEl();
    const h = n ? heatFor(n.d) : null;
    if (`${h ? h[1] : 'none'}|${this.hide}` !== this.shown) this.paint(h);
  }

  focusAt(x, y) {
    let best = null;
    let bd = 34;
    this.xs.forEach((o) => {
      const d = Math.hypot(x - o.cx, y - o.cy);
      if (o.shown && d < bd) (bd = d), (best = { puzzle: o, kind: 'x', icon: 'look', label: 'Dig' });
    });
    const n = this.on && this.near(28);
    if (n && n.d < bd) best = { puzzle: { cx: n.tg.x, cy: n.tg.y, tg: n.tg }, kind: 'buried', icon: 'look', label: 'Dig' };
    return best;
  }

  interact(f) {
    const s = this.s;
    s.paused = true;
    if (f.kind === 'x') {
      const o = f.puzzle;
      return startDig(o.key, {
        collection: 'ruin',
        entry: bonusEntry('ruin'),
        onClose: ({ found }) => {
          s.paused = false;
          if (!found) return;
          entriesFor('map').forEach((e) => dispose(e.id));
          this.mapT = 0;
          o.shown = false;
          o.img.setVisible(false);
          s.toast('Treasure! The map pieces crumble to dust.');
        },
      });
    }
    const tg = f.puzzle.tg;
    startDig(tg.key, {
      collection: 'ruin',
      onClose: ({ found }) => {
        s.paused = false;
        if (!found) return;
        tg.done = true;
        const d = load(HUNT, {});
        const day = dayNum();
        const done = d.day === day ? d.done || {} : {};
        done[tg.key] = 1;
        save(HUNT, { day, done });
      },
    });
  }
}
