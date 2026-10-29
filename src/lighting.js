// Dynamic lighting. A darkness layer is multiplied over the room: it is filled
// with the ambient light for the time of day, and every light source adds a
// soft pool to it (picture lights over paintings, ceiling lamps, lamps you've
// placed, light spilling in through doorways, a little glow around the
// curator). Warm glows are added on top for lamps and candles, dust drifts in
// the picture-light beams, and everyone casts a soft shadow.
import Phaser from 'phaser';
import { T } from './art.js';
import { artBounds, wallRef } from './walldraw.js';
import { ITEMS, footprint } from './items.js';
import { settings, hourNow } from './settings.js';
import { weatherToday } from './weather.js';

const DEPTH = 4998; // under speech/interact bubbles (5000), over people
// Ambient light through the day: [hour, r, g, b].
// (night is a moonlit blue, dark enough for lamps to matter but still easy
// to read on a phone)
const AMBIENT = [
  [0, 74, 70, 112],
  [5.5, 74, 70, 112],
  [7, 214, 188, 168],
  [9, 246, 242, 236],
  [16.5, 246, 240, 230],
  [18.5, 232, 168, 120],
  [20.5, 96, 80, 108],
  [22, 74, 70, 112],
  [24, 74, 70, 112],
];
const DAY = [244, 240, 232]; // with day/night off: a bright museum afternoon
const WARM = 0xffc888;
const PICTURE = 0xffe2b0;
const POLISHED = ['marble', 'tile', 'checker', 'checker-angled', 'terrazzo', 'slate', 'penny', 'hex', 'encaustic', 'mosaic', 'concrete'];
// Placed items that give off light: where the flame or bulb is (px above the
// item's base), how far it reaches, color, and whether it flickers.
const LAMPS = {
  lamp: { up: 52, r: 58, color: 0xffe2a8, flicker: 0 },
  candelabra: { up: 40, r: 50, color: 0xffb860, flicker: 1 },
  lantern: { up: 26, r: 46, color: 0xffc070, flicker: 0.6 },
  counter: { up: 30, r: 54, color: 0xfff0d8, flicker: 0 },
  fountain: { up: 10, r: 40, color: 0xbfe6ff, flicker: 0.2 },
  meteorite: { up: 14, r: 26, color: 0xa0c8ff, flicker: 0.3 },
  geode: { up: 14, r: 26, color: 0xd8a0ff, flicker: 0.3 },
  aquarium: { up: 22, r: 44, color: 0x8ad8ff, flicker: 0.25 },
  pumpkin: { up: 8, r: 34, color: 0xffb040, flicker: 1 },
  xmas_tree: { up: 30, r: 44, color: 0xfff0c0, flicker: 0.5 },
};

export function ambientAt(hour) {
  for (let i = 1; i < AMBIENT.length; i++) {
    const [h1, ...c1] = AMBIENT[i];
    const [h0, ...c0] = AMBIENT[i - 1];
    if (hour <= h1) {
      const k = (hour - h0) / (h1 - h0);
      return c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
    }
  }
  return AMBIENT[0].slice(1);
}

// Rain and snow shade the daylight: a grey, cooler sky on wet days, a soft
// bright one under snow. (After dark it barely changes anything.)
const OVERCAST = { rain: [0.84, 0.89, 0.98], snow: [0.95, 0.98, 1.03] };
export function overcast(rgb, weather = weatherToday()) {
  const m = OVERCAST[weather];
  return m ? rgb.map((v, i) => Math.min(255, Math.round(v * m[i]))) : rgb;
}

// A short label for the time of day (for the HUD).
export function timeOfDay(hour) {
  if (hour < 5.5 || hour >= 21) return 'night';
  if (hour < 9) return 'morning';
  if (hour < 17) return 'day';
  return 'evening';
}

export function makeTextures(scene) {
  if (scene.textures.exists('lt_glow')) return;
  const S = 128;
  const glow = scene.textures.createCanvas('lt_glow', S, S);
  const g = glow.getContext();
  const grad = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.7)');
  grad.addColorStop(0.7, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, S, S);
  glow.refresh();
  // A beam: bright at the top, fading down (picture lights, reflections).
  const beam = scene.textures.createCanvas('lt_beam', 32, 64);
  const b = beam.getContext();
  const bg = b.createLinearGradient(0, 0, 0, 64);
  bg.addColorStop(0, 'rgba(255,255,255,0.9)');
  bg.addColorStop(1, 'rgba(255,255,255,0)');
  b.fillStyle = bg;
  b.fillRect(0, 0, 32, 64);
  // soften the sides
  const side = b.createLinearGradient(0, 0, 32, 0);
  side.addColorStop(0, 'rgba(0,0,0,1)');
  side.addColorStop(0.3, 'rgba(0,0,0,0)');
  side.addColorStop(0.7, 'rgba(0,0,0,0)');
  side.addColorStop(1, 'rgba(0,0,0,1)');
  b.globalCompositeOperation = 'destination-out';
  b.fillStyle = side;
  b.fillRect(0, 0, 32, 64);
  beam.refresh();
  // A soft shadow under people.
  const sh = scene.textures.createCanvas('lt_shadow', 20, 8);
  const s = sh.getContext();
  const sg = s.createRadialGradient(10, 4, 0, 10, 4, 10);
  sg.addColorStop(0, 'rgba(0,0,0,0.38)');
  sg.addColorStop(0.6, 'rgba(0,0,0,0.22)');
  sg.addColorStop(1, 'rgba(0,0,0,0)');
  s.setTransform(1, 0, 0, 0.4, 0, 2.4);
  s.fillStyle = sg;
  s.fillRect(0, 0, 20, 20);
  sh.refresh();
  // The brass picture light over a painting.
  const fx = scene.textures.createCanvas('lt_fixture', 14, 4);
  const f = fx.getContext();
  f.fillStyle = '#2a1a14';
  f.fillRect(0, 0, 14, 4);
  f.fillStyle = '#c9a23f';
  f.fillRect(1, 1, 12, 2);
  f.fillStyle = '#fff2c0';
  f.fillRect(2, 2, 10, 1);
  fx.refresh();
  // A wall sconce: a brass bracket holding a frosted bulb.
  const sc = scene.textures.createCanvas('lt_sconce', 8, 12);
  const k = sc.getContext();
  k.fillStyle = '#2a1a14';
  k.fillRect(2, 0, 4, 6);
  k.fillRect(1, 6, 6, 6);
  k.fillStyle = '#fff4d6';
  k.fillRect(3, 1, 2, 4);
  k.fillStyle = '#c9a23f';
  k.fillRect(2, 7, 4, 1);
  k.fillRect(3, 8, 2, 3);
  k.fillStyle = '#8a6a1e';
  k.fillRect(2, 11, 4, 1);
  sc.refresh();
  // A speck of dust.
  const dust = scene.textures.createCanvas('lt_dust', 2, 2);
  dust.getContext().fillStyle = '#ffffff';
  dust.getContext().fillRect(0, 0, 2, 2);
  dust.refresh();
}

const toInt = ([r, g, b]) => (r << 16) | (g << 8) | b;

export class Lighting {
  constructor(scene) {
    this.scene = scene;
    this.quality = settings().lights;
    makeTextures(scene);
    this.shadows = new Map();
    this.extras = []; // glows, fixtures, beams
    this.motes = [];
    this.time = 0;
    const { g } = scene;
    this.makeLayer();
    this.onSettings = (e) => ['lights', 'dayNight'].includes(e.detail.key) && this.applySettings();
    window.addEventListener('settings', this.onSettings);
    scene.events.once('shutdown', () => window.removeEventListener('settings', this.onSettings));
    this.build();
  }

  makeLayer() {
    const { g } = this.scene;
    this.rt?.destroy();
    this.rt = null;
    if (this.quality !== 'off') this.rt = this.scene.add.renderTexture(0, 0, g.w, g.h + T).setOrigin(0).setDepth(DEPTH).setBlendMode(Phaser.BlendModes.MULTIPLY);
  }

  // Lighting quality or day/night changed in Settings.
  applySettings() {
    this.quality = settings().lights;
    this.makeLayer();
    this.build();
  }

  // How dark it is (0 = bright day, 1 = deep night).
  get dark() {
    const [r, g, b] = this.ambient;
    return Phaser.Math.Clamp(1 - (0.3 * r + 0.55 * g + 0.15 * b) / 245, 0, 1);
  }

  // (Re)collect the light sources. Call when paintings, items or decor change.
  build() {
    const sc = this.scene;
    const { g } = sc;
    this.extras.forEach((o) => o.destroy());
    this.extras = [];
    this.glow = null;
    this.motes.forEach((m) => m.img.destroy());
    this.motes = [];
    this.ambient = settings().dayNight ? overcast(ambientAt(hourNow())) : DAY;
    const dark = this.dark;
    const lights = [];
    const add = (l) => lights.push({ strength: 1, color: WARM, flicker: 0, ...l, strength: (l.strength ?? 1) * (0.45 + 0.55 * dark) });
    if (this.quality === 'off') return (this.lights = lights);
    const polished = POLISHED.includes(sc.decor?.pattern);

    // Picture lights: a pool on the wall over each painting, a little on the
    // floor in front of it, and on polished floors a soft reflection.
    sc.hung.forEach((p) => {
      const b = artBounds(p, g);
      const r = wallRef(p, g);
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      if (r.face === 'back') {
        add({ x: cx, y: cy - 2, rx: b.w * 0.95 + 10, ry: b.h * 0.9 + 10, color: PICTURE, strength: 0.95 });
        add({ x: cx, y: r.y + 10, rx: b.w * 0.7 + 8, ry: 14, color: PICTURE, strength: 0.5 });
        this.extras.push(sc.add.image(Math.round(cx), b.y - 2, 'lt_fixture').setOrigin(0.5, 1).setDepth(2));
        const beam = sc.add.image(cx, b.y - 1, 'lt_beam').setOrigin(0.5, 0).setDisplaySize(b.w + 6, b.h + 10).setBlendMode(Phaser.BlendModes.ADD).setTint(PICTURE).setAlpha(0.05 + 0.18 * dark).setDepth(3);
        this.extras.push(beam);
        if (polished) {
          this.extras.push(sc.add.image(cx, r.y + 1, 'lt_beam').setOrigin(0.5, 0).setDisplaySize(b.w * 0.8, 26).setBlendMode(Phaser.BlendModes.ADD).setTint(PICTURE).setAlpha(0.06 + 0.14 * dark).setDepth(0.55));
        }
        if (this.quality === 'high') for (let k = 0; k < 3; k++) this.addMote(cx, b.w, b.y, r.y + 6, dark);
      } else {
        add({ x: cx, y: cy, rx: b.w * 1.2 + 10, ry: b.h * 0.95 + 10, color: PICTURE, strength: 0.9 });
        const st = sc.standFor(p);
        add({ x: st.x - (r.face === 'left' ? 4 : -4), y: st.y - 6, rx: 22, ry: b.h * 0.6, color: PICTURE, strength: 0.4 });
      }
    });

    // Ceiling lamps: soft pools across the floor, every few tiles.
    const step = 3 * T;
    for (let y = g.y0 + step / 2; y < g.y1; y += step) {
      for (let x = g.xL + step / 2; x < g.xR; x += step) {
        if (sc.blocked(x, y) && g.main) continue; // nothing over the void beside the hallway
        add({ x, y, rx: 70, ry: 56, color: 0xffc070, strength: 0.62 * dark ** 0.8 });
      }
    }
    // Walls catch some of the lamplight too.
    add({ x: g.w / 2, y: g.y0 - g.D / 2, rx: (g.xR - g.xL) * 0.7, ry: g.D, color: 0xffe0b8, strength: 0.35 });

    // Sconces either side of a door on the back wall.
    const ex = sc.L.exit;
    if (ex?.rect && ex.wall === 'back') {
      const r = wallRef(ex, g);
      [r.x + ex.rect.u0 - 12, r.x + ex.rect.u1 + 12].forEach((x) => {
        if (x < g.xL + 6 || x > g.xR - 6) return;
        const y = r.y - 36;
        this.extras.push(sc.add.image(x, y, 'lt_sconce').setOrigin(0.5, 0.5).setDepth(2));
        add({ x, y: y - 2, rx: 30, ry: 34, color: 0xffd08a, strength: 0.85 });
        const glow = sc.add.image(x, y - 3, 'lt_glow').setDisplaySize(22, 22).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd08a).setDepth(3).setAlpha(0.15 + 0.45 * dark);
        glow.base = glow.alpha;
        glow.flicker = 0.25;
        this.extras.push(glow);
      });
    }

    // Light spilling in from open doorways and archways.
    const { exit, entrance } = sc.L;
    const next = sc.rooms[sc.roomIndex + 1];
    if (exit && next && !next.locked) add({ x: exit.ax, y: exit.ay - 10, rx: 36, ry: 30, color: 0xfff0d8, strength: 0.7 });
    if (entrance) add({ x: entrance.ax, y: entrance.ay, rx: 40, ry: 26, color: 0xfff0d8, strength: 0.55 });

    // Lamps, candles and lit exhibits you've placed.
    sc.items.forEach((it) => {
      const lamp = LAMPS[it.type];
      if (!lamp) return;
      const { w, h } = footprint(it);
      const x = g.xL + (it.c + w / 2) * T;
      const base = g.y0 + (it.r + h) * T;
      const y = base - lamp.up;
      add({ x, y: base - 4, rx: lamp.r * 1.3, ry: lamp.r * 0.8, color: lamp.color, strength: 0.9, flicker: lamp.flicker });
      add({ x, y, rx: lamp.r * 0.7, ry: lamp.r * 0.7, color: lamp.color, strength: 0.8, flicker: lamp.flicker });
      const glow = sc.add.image(x, y, 'lt_glow').setDisplaySize(lamp.r * 0.9, lamp.r * 0.9).setBlendMode(Phaser.BlendModes.ADD).setTint(lamp.color).setDepth(base + 1).setAlpha(0.1 + 0.4 * dark);
      glow.base = glow.alpha;
      glow.flicker = lamp.flicker;
      this.extras.push(glow);
    });
    if (this.quality === 'high' && dark > 0.2) {
      this.glow = sc.add.image(0, 0, 'lt_glow').setDisplaySize(90, 70).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd8a8).setAlpha(0.12 * dark).setDepth(DEPTH + 1);
      this.extras.push(this.glow);
    } else this.glow = null;
    this.lights = lights;
    this.dirty = true;
  }

  addMote(cx, w, top, bottom, dark) {
    const img = this.scene.add.image(0, 0, 'lt_dust').setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff0d0).setDepth(DEPTH + 1).setScale(0.5);
    const m = { img, cx, w, top, bottom, k: Math.random(), speed: 3 + Math.random() * 4, sway: Math.random() * 6, phase: Math.random() * 6, peak: 0.25 + 0.5 * dark };
    this.motes.push(m);
  }

  // Redraw the darkness layer (every frame on High: flicker and the curator's glow).
  update(dt) {
    this.time += dt;
    const sc = this.scene;
    this.watchSpeed();
    this.updateShadows();
    if (!this.rt) return;
    if (this.dirty) this.draw();
    if (this.glow && sc.player) this.glow.setPosition(sc.player.x, sc.player.y - 12);
    this.motes.forEach((m) => {
      m.k += (m.speed * dt) / (m.bottom - m.top);
      if (m.k > 1) {
        m.k = 0;
        m.phase = Math.random() * 6;
      }
      const x = m.cx + Math.sin(this.time * 0.6 + m.phase) * (m.w / 3) + Math.sin(this.time * 1.7 + m.phase) * m.sway * 0.3;
      m.img.setPosition(x, m.top + m.k * (m.bottom - m.top)).setAlpha(m.peak * Math.sin(m.k * Math.PI));
    });
    if (this.quality === 'high') {
      this.extras.forEach((o) => {
        if (o.flicker) o.setAlpha(o.base * (1 - 0.18 * o.flicker + 0.18 * o.flicker * Math.sin(this.time * 13 + o.x) * Math.sin(this.time * 7.3)));
      });
    }
    void sc;
  }

  // A slow phone: if High keeps the game under about 22 frames a second for
  // five seconds, drop to Low for this visit (the setting itself is left alone).
  watchSpeed() {
    const now = performance.now() / 1000;
    const dt = now - (this.lastTick || now); // (real time: Phaser's own delta is smoothed)
    this.lastTick = now;
    if (this.quality !== 'high' || dt <= 0 || dt > 0.5) return; // (ignore pauses and tab switches)
    this.slow = (this.slow || 0) + dt;
    this.slowFrames = (this.slowFrames || 0) + 1;
    if (this.slow < 5) return;
    const avg = this.slow / this.slowFrames;
    this.slow = 0;
    this.slowFrames = 0;
    if (avg > 0.046) {
      this.quality = 'low';
      this.makeLayer();
      this.build();
    }
  }

  draw() {
    this.dirty = false;
    const { rt } = this;
    const sc = this.scene;
    const { g } = sc;
    // Only the room is darkened: the void around it stays as it is.
    rt.fill(0xffffff, 1);
    const amb = toInt(this.ambient);
    const top = g.y0 - g.D;
    if (g.main) {
      rt.fill(amb, 1, 0, top, g.w, g.yf - top + 2);
      rt.fill(amb, 1, g.hx0 - g.D, g.yf, g.hx1 - g.hx0 + 2 * g.D, g.y1 - g.yf + 2);
    } else rt.fill(amb, 1, 0, top, g.w, g.y1 - top + 2);
    const mat = sc.L.entrance;
    if (mat?.mat) rt.fill(amb, 1, mat.x0, g.y1, mat.x1 - mat.x0, T);
    const stamp = (x, y, w, h, tint, alpha) => rt.stamp('lt_glow', null, x, y, { scaleX: w / 128, scaleY: h / 128, tint, alpha, blendMode: Phaser.BlendModes.ADD });
    this.lights.forEach((l) => stamp(l.x, l.y, l.rx * 2, l.ry * 2, l.color, Math.min(1, l.strength)));
  }

  // A soft shadow under the curator and everyone else.
  updateShadows() {
    const sc = this.scene;
    const people = [sc.player, ...(sc.npcs || []).map((n) => n.s)].filter(Boolean);
    people.forEach((s) => {
      let sh = this.shadows.get(s);
      if (!sh) {
        sh = sc.add.image(0, 0, 'lt_shadow').setDepth(0.7);
        this.shadows.set(s, sh);
      }
      sh.setPosition(s.x, s.y - 1).setScale(s.scaleX * 0.95).setVisible(s.visible && s.active);
    });
    this.shadows.forEach((sh, s) => {
      if (!s.active) {
        sh.destroy();
        this.shadows.delete(s);
      }
    });
  }
}
