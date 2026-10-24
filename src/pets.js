// Pets that follow the curator around: a cat, a dog, a bunny or a parrot.
// Each is drawn in code: front, back and side views with a walking frame,
// plus a sitting pose. The parrot flies after you and perches on your
// shoulder when you stop.
import { sfx } from './music.js';

export const PETS = { none: 'None', cat: 'Cat', dog: 'Dog', bunny: 'Bunny', parrot: 'Parrot' };
export const PET_COLORS = {
  cat: ['#e08a3a', '#2a2420', '#f0ece2', '#8a8a90', '#c8a070'],
  dog: ['#a0703f', '#e0b860', '#2a2420', '#f0ece2', '#6a4a2a'],
  bunny: ['#f4f0e6', '#a08060', '#8a8a90', '#e8d0b0'],
  parrot: ['#d8402a', '#3ca04a', '#3a78c8', '#f2c53d'],
};
const OUT = '#1d1714';
const T = 32;

const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

function canvasFor(scene, key, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, T, T);
  const ctx = tex.getContext();
  const R = (x, y, w, h, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const E = (cx, cy, rx, ry, c) => {
    ctx.fillStyle = c;
    for (let yy = -ry; yy <= ry; yy++) {
      const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))));
      ctx.fillRect(Math.round(cx - half), Math.round(cy + yy), half * 2, 1);
    }
  };
  // an outlined blob: dark edge, then the color
  const B = (cx, cy, rx, ry, c) => {
    E(cx, cy, rx + 1, ry + 1, OUT);
    E(cx, cy, rx, ry, c);
  };
  draw({ R, E, B, ctx });
  tex.refresh();
}

// ---------- Four-legged pets (cat, dog, bunny) ----------
function quadruped(scene, prefix, kind, col) {
  const dark = shade(col, 0.72);
  const light = shade(col, 1.18);
  const belly = kind === 'bunny' ? '#ffffff' : shade(col, 1.3);
  const ears = (R, x, y, flip) => {
    if (kind === 'cat') {
      R(x - 3, y - 3, 3, 3, OUT);
      R(x - 2, y - 2, 1, 1, '#e8a0a8');
      R(x + 2, y - 3, 3, 3, OUT);
      R(x + 3, y - 2, 1, 1, '#e8a0a8');
    } else if (kind === 'dog') {
      R(x - 5, y - 1, 3, 6, OUT);
      R(x - 4, y, 2, 5, dark);
      R(x + 4, y - 1, 3, 6, OUT);
      R(x + 4, y, 2, 5, dark);
    } else {
      [-2, 2].forEach((dx) => {
        R(x + dx - 1 + (flip ? 1 : 0), y - 9, 3, 9, OUT);
        R(x + dx + (flip ? 1 : 0), y - 8, 1, 7, '#e8a0a8');
      });
    }
  };
  const side = (step, sit) =>
    canvasFor(scene, `${prefix}_side${sit ? '_sit' : step ? '_1' : ''}`, ({ R, B, E }) => {
      E(16, 30, 9, 2, 'rgba(0,0,0,0.22)');
      const hop = kind === 'bunny' && step ? 2 : 0;
      // tail
      if (kind === 'cat') for (let i = 0; i < 8; i++) R(6 - Math.round(Math.sin(i / 3) * 2), 23 - i - hop, 2, 2, i === 7 ? light : OUT);
      if (kind === 'dog') {
        R(6, 20 - hop - (step ? 1 : 0), 3, 2, OUT);
        R(4, 18 - hop - (step ? 2 : 0), 3, 2, OUT);
      }
      if (kind === 'bunny') B(7, 24 - hop, 2, 2, '#ffffff');
      if (sit) {
        B(14, 24, 6, 5, col);
        E(14, 26, 3, 2, belly);
      } else B(15, 24 - hop, 8, 4, col);
      // legs
      if (!sit) {
        const legs = step ? [[9, 1], [12, -1], [18, 1], [21, -1]] : [[10, 0], [12, 0], [19, 0], [21, 0]];
        if (kind !== 'bunny' || !step) legs.forEach(([x, k]) => R(x + k, 27 - hop, 2, 3, OUT));
        else [[9, 0], [20, 0]].forEach(([x]) => R(x, 25, 3, 2, OUT));
      }
      // head
      const hx = sit ? 19 : 23;
      const hy = sit ? 17 : 19 - hop;
      B(hx, hy, 5, 4, col);
      if (kind === 'dog') {
        B(hx + 5, hy + 1, 2, 2, light);
        R(hx + 7, hy, 1, 1, OUT);
      }
      if (kind === 'cat') R(hx + 4, hy + 1, 1, 1, '#e8a0a8');
      R(hx + 2, hy - 1, 1, 2, OUT); // eye
      ears(R, hx, hy - 3, true);
    });
  const front = (step, back, sit) =>
    canvasFor(scene, `${prefix}_${back ? 'up' : 'down'}${sit ? '_sit' : step ? '_1' : ''}`, ({ R, B, E }) => {
      E(16, 30, 8, 2, 'rgba(0,0,0,0.22)');
      const hop = kind === 'bunny' && step ? 2 : 0;
      B(16, 24 - hop, 6, 5, col); // body
      if (!back) E(16, 26 - hop, 3, 3, belly);
      if (back) {
        if (kind === 'cat') for (let i = 0; i < 7; i++) R(16 + Math.round(Math.sin(i / 2) * 2), 22 - i - hop, 2, 2, i === 6 ? light : OUT);
        if (kind === 'bunny') B(16, 27 - hop, 2, 2, '#ffffff');
        if (kind === 'dog') R(15, 17 - hop + (step ? 1 : 0), 2, 3, OUT);
      }
      const l = step ? 1 : 0;
      [12, 19].forEach((x, i) => R(x, 27 - hop - (i === 0 ? l : 0), 2, 3, OUT));
      if (sit) [12, 19].forEach((x) => R(x, 28, 2, 2, OUT));
      B(16, 16 - hop, 6, 5, col); // head
      if (!back) {
        R(13, 15 - hop, 2, 2, OUT);
        R(18, 15 - hop, 2, 2, OUT);
        R(13, 15 - hop, 1, 1, '#ffffff');
        R(18, 15 - hop, 1, 1, '#ffffff');
        if (kind === 'dog') {
          B(16, 19 - hop, 3, 2, light);
          R(15, 18 - hop, 2, 1, OUT);
        } else R(15, 18 - hop, 2, 1, kind === 'cat' ? '#e8a0a8' : OUT);
      } else E(16, 15 - hop, 3, 2, shade(col, 0.9));
      ears(R, 16, 12 - hop);
    });
  side(false);
  side(true);
  side(false, true);
  front(false, false);
  front(true, false);
  front(false, false, true);
  front(false, true);
  front(true, true);
}

// ---------- Parrot ----------
function parrot(scene, prefix, col) {
  const wing = shade(col, 0.75);
  const views = [
    ['side', false],
    ['side_1', true],
    ['down', false],
    ['down_1', true],
    ['up', false],
    ['up_1', true],
  ];
  views.forEach(([v, flap]) =>
    canvasFor(scene, `${prefix}_${v}`, ({ R, B }) => {
      const side = v.startsWith('side');
      B(16, 20, side ? 5 : 4, 5, col);
      B(side ? 19 : 16, 14, 3, 3, col);
      if (side) {
        R(22, 13, 2, 3, '#f2c53d');
        R(19, 13, 1, 1, OUT);
        R(10, 22, 4, 2, '#3a78c8'); // tail
        R(8, 23, 3, 1, '#3a78c8');
        if (flap) {
          R(12, 10, 6, 3, OUT);
          R(13, 11, 4, 2, wing);
        } else R(13, 18, 5, 4, wing);
      } else {
        if (v.startsWith('down')) {
          R(15, 15, 2, 2, '#f2c53d');
          R(14, 13, 1, 1, OUT);
          R(17, 13, 1, 1, OUT);
        }
        if (flap) {
          R(8, 14, 5, 3, OUT);
          R(19, 14, 5, 3, OUT);
          R(9, 15, 3, 1, wing);
          R(20, 15, 3, 1, wing);
        } else {
          R(11, 18, 2, 5, wing);
          R(19, 18, 2, 5, wing);
        }
        R(15, 25, 2, 3, '#3a78c8');
      }
      R(14, 26, 1, 2, '#e8a04a');
      R(17, 26, 1, 2, '#e8a04a');
    }),
  );
  ['down', 'side', 'up'].forEach((v) => {
    if (scene.textures.exists(`${prefix}_${v}_sit`)) scene.textures.remove(`${prefix}_${v}_sit`);
    scene.textures.addCanvas(`${prefix}_${v}_sit`, scene.textures.get(`${prefix}_${v}`).getSourceImage());
  });
}

// Make the textures for a pet: `${prefix}_down|up|side`, `_1` walking frames, `_sit`.
export function makePet(scene, prefix, kind, color) {
  const col = color || PET_COLORS[kind]?.[0] || '#a0703f';
  if (kind === 'parrot') parrot(scene, prefix, col);
  else quadruped(scene, prefix, kind, col);
}

// A pet that follows a character, walking where they walked.
export class Pet {
  constructor(scene, kind, color, owner) {
    this.scene = scene;
    this.kind = kind;
    this.owner = owner;
    this.prefix = `pet_${kind}`;
    makePet(scene, this.prefix, kind, color);
    this.s = scene.add.sprite(owner.x - 16, owner.y, `${this.prefix}_down`).setOrigin(0.5, 1);
    this.trail = [];
    this.still = 0;
    this.walkT = 0;
    this.flier = kind === 'parrot';
  }

  update(dt) {
    const o = this.owner;
    const s = this.s;
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(last.x - o.x, last.y - o.y) > 2) this.trail.push({ x: o.x, y: o.y });
    if (this.trail.length > 40) this.trail.shift();
    const moving = o.walkT > 0;
    this.still = moving ? 0 : this.still + dt;
    let tx;
    let ty;
    if (this.flier && this.still > 0.6) {
      // perched on the curator's shoulder
      tx = o.x + 5;
      ty = o.y - 19;
    } else {
      const target = this.trail[Math.max(0, this.trail.length - 9)] || o;
      tx = target.x;
      ty = target.y + (this.flier ? -14 : 0);
    }
    const dx = tx - s.x;
    const dy = ty - s.y;
    const d = Math.hypot(dx, dy);
    const going = d > 1.5;
    if (going) {
      const k = Math.min(1, (dt * (d > 40 ? 12 : 7)));
      s.x += dx * k;
      s.y += dy * k;
      const side = Math.abs(dx) > Math.abs(dy);
      this.view = side ? 'side' : dy < 0 ? 'up' : 'down';
      if (side) s.setFlipX(dx < 0);
      this.walkT += dt;
    } else this.walkT = 0;
    const view = this.view || 'down';
    const flap = this.flier && (going || this.still < 0.6);
    const frame = flap || going ? Math.floor(this.walkT * (this.flier ? 14 : 8)) % 2 : 0;
    const sit = !going && !this.flier && this.still > 2.5;
    s.setTexture(`${this.prefix}_${view}${sit ? '_sit' : frame ? '_1' : ''}`);
    if (sit && view !== 'side') s.setTexture(`${this.prefix}_down_sit`);
    s.setDepth(this.flier ? s.y + 30 : s.y);
  }

  // Tap Interact next to your pet: it's happy to see you.
  pet() {
    sfx(this.kind === 'dog' ? 'woof' : this.kind === 'cat' ? 'meow' : this.kind === 'parrot' ? 'squawk' : 'tap');
    const heart = this.scene.add.image(this.s.x, this.s.y - 22, 'emote_heart').setOrigin(0.5, 1).setDepth(5000).setScale(0);
    this.scene.tweens.add({ targets: heart, scale: 1, y: heart.y - 6, duration: 220, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: heart, alpha: 0, delay: 1100, duration: 300, onComplete: () => heart.destroy() });
    this.scene.tweens.add({ targets: this.s, y: this.s.y - 4, duration: 120, yoyo: true });
  }
}
