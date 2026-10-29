// Rowing on an island, the way Surf works in Pokémon: walk into the water, say yes to
// "Row out?", and you hop into a little rowboat and row wherever the water goes.
// Row into land and you climb out. The oars sweep while you move, the boat bobs and
// leaves a wake, and your pet rides along in the bow. IslandScene owns one of these
// (this.row) and asks it about walking (free), boarding (check) and drawing (update).
import { sfx } from './music.js';
import { uiIcon } from './ui/icons.js';
import './rowing.css';

const T = 32;
const BUMP = 0.28; // seconds of pushing into the water before the question
const OUT = '#2a1a14';
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// ---------- the boat, drawn once: a hull from the side (left/right) and end on (up/down) ----------
function hullPixels(w, h, along) {
  // along: true = long side left to right. Returns rows of palette letters.
  const rows = [];
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const inside = (x, y) => {
    const u = along ? (x - cx) / (w / 2) : (y - cy) / (h / 2); // along the keel
    const v = along ? (y - cy) / (h / 2) : (x - cx) / (w / 2); // across it
    const half = Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(u), 2.6))); // full in the middle, pointed ends
    return Math.abs(v) <= half;
  };
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) {
        row += '.';
        continue;
      }
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const rim = !edge && [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, 1], [1, -1], [-1, 1]].some(([dx, dy]) => !inside(x + dx, y + dy));
      const seat = along ? Math.abs(x - cx - w * 0.14) < 1.5 : Math.abs(y - cy + h * 0.12) < 1.5;
      row += edge ? 'o' : rim ? 'r' : seat ? 's' : (along ? y : x) % 4 === 0 ? 'p' : 'f';
    }
    rows.push(row);
  }
  return rows;
}
const PAL = { o: OUT, r: '#b07a4a', s: '#c89060', f: '#5a3a20', p: '#4a2e18' };
function bakeHull(scene, key, w, h, along, fromRow = 0) {
  if (scene.textures.exists(key)) return;
  const rows = hullPixels(w, h, along);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    if (y < fromRow) return;
    [...row].forEach((ch, x) => {
      if (!PAL[ch]) return;
      ctx.fillStyle = PAL[ch];
      ctx.fillRect(x, y, 1, 1);
    });
  });
  tex.refresh();
}

// The boat is long across the screen when you row left or right, long up and down
// otherwise. The "front" texture is the near half, drawn over your legs so you sit in it.
const SHAPES = {
  side: { w: 42, h: 20, along: true, cut: 3, seatY: 13 },
  end: { w: 22, h: 38, along: false, cut: 15, seatY: 25 },
};

// ---------- the question ----------
let card = null;
function ask(text, yes, no) {
  if (!card) {
    card = document.createElement('div');
    card.id = 'rowask';
    card.className = 'hidden';
    card.setAttribute('role', 'dialog');
    card.innerHTML = `<p><span class="ra-ic">${uiIcon('boat')}</span><span class="ra-text"></span></p><div class="ra-buttons"><button type="button" class="ra-no">Not now</button><button type="button" class="ra-yes">Row</button></div>`;
    document.body.appendChild(card);
  }
  card.querySelector('.ra-text').textContent = text;
  card.classList.remove('hidden');
  const close = () => card.classList.add('hidden');
  card.querySelector('.ra-yes').onclick = () => {
    close();
    yes();
  };
  card.querySelector('.ra-no').onclick = () => {
    close();
    no();
  };
}
export const rowAskOpen = () => !!card && !card.classList.contains('hidden');
export function closeRowAsk() {
  card?.classList.add('hidden');
}

export class Rowing {
  constructor(scene, { W, H }) {
    this.s = scene;
    this.W = W;
    this.H = H;
    this.on = false;
    this.bump = 0;
    this.declinedAt = null;
    this.t = 0;
    this.stroke = 0;
    this.wakeT = 0;
    bakeHull(scene, 'row_side', SHAPES.side.w, SHAPES.side.h, true);
    bakeHull(scene, 'row_side_front', SHAPES.side.w, SHAPES.side.h, true, SHAPES.side.cut);
    bakeHull(scene, 'row_end', SHAPES.end.w, SHAPES.end.h, false);
    bakeHull(scene, 'row_end_front', SHAPES.end.w, SHAPES.end.h, false, SHAPES.end.cut);
  }

  // Is this point open water a boat can float on (sea or pond, not a dock, rock or cliff)?
  wet(x, y) {
    const s = this.s;
    const cx = Math.floor(x / T);
    const cy = Math.floor(y / T);
    if (cx < 0 || cy < 0 || cx >= this.W || cy >= this.H) return false;
    const top = s.paint?.[cy]?.[cx];
    const name = top?.[top.length - 1];
    const t = name ? s.tileInfo(name) : null;
    if (t && (t.walk === 'walk' || t.walk === 'block' || t.walk === 'push') && !/water|bubbles|lily/.test(name)) return false;
    const wetCorners = [...s.key(cx, cy, (m) => m === 0 || m === 3)].filter((b) => b === '1').length;
    return wetCorners >= 2 || t?.walk === 'water';
  }

  // Can the boat sit here? (its hull, roughly, around the rower's feet)
  free(x, y) {
    if (this.s.posts?.some((b) => x + 8 > b.x0 && x - 8 < b.x1 && y + 2 > b.y0 && y - 8 < b.y1)) return false;
    return [[x - 8, y - 8], [x + 8, y - 8], [x - 8, y + 2], [x + 8, y + 2], [x, y - 3]].every(([px, py]) => this.wet(px, py));
  }

  /** After each movement step: start the question when you push into water, climb out when you push into land. */
  check(dt, vx, vy, len, moved) {
    const s = this.s;
    const p = s.player;
    if (this.busy || s.paused) return;
    const [dx, dy] = DIRS[s.facing] || [0, 1];
    const pushing = len > 0 && !moved; // walking (or rowing) into something that stops you
    if (this.declinedAt && Math.hypot(p.x - this.declinedAt.x, p.y - this.declinedAt.y) > 40) this.declinedAt = null;
    if (!pushing) {
      this.bump = 0;
      return;
    }
    this.bump += dt;
    if (this.on) {
      // rowing into the shore: climb out onto the first spot you can stand on
      if (this.bump < 0.15) return;
      for (const d of [20, 28, 36]) {
        const lx = p.x + dx * d;
        const ly = p.y + dy * d;
        if (s.walkFree(lx, ly)) return this.leave(lx, ly);
      }
      return;
    }
    if (this.bump < BUMP || this.declinedAt || !this.allowed()) return;
    // open water just ahead, with room for the boat
    for (const d of [22, 30, 38]) {
      const wx = p.x + dx * d;
      const wy = p.y + dy * d;
      if (!this.wet(wx, wy - 4)) return;
      if (this.free(wx, wy)) return this.offer(wx, wy);
    }
  }

  allowed() {
    const s = this.s;
    return !s.exp && !s.fishing?.busy && !s.leaving; // expeditions keep their puzzles: no rowing round the gates
  }

  offer(wx, wy) {
    const s = this.s;
    this.bump = 0;
    s.paused = true;
    s.dragging = false;
    s.dragVec = null;
    s.stick?.classList.remove('active');
    sfx('open');
    ask(
      'The water looks calm. Row out?',
      () => {
        s.paused = false;
        this.board(wx, wy);
      },
      () => {
        s.paused = false;
        this.declinedAt = { x: s.player.x, y: s.player.y };
      },
    );
  }

  // ---------- getting in and out ----------
  hop(x, y, done, frame) {
    const s = this.s;
    const p = s.player;
    const from = { x: p.x, y: p.y };
    this.busy = true;
    s.paused = true; // (no walking mid-jump)
    const o = { k: 0 };
    s.tweens.add({
      targets: o,
      k: 1,
      duration: 300,
      ease: 'Sine.easeInOut',
      onUpdate: () => {
        p.x = from.x + (x - from.x) * o.k;
        p.y = from.y + (y - from.y) * o.k - Math.sin(o.k * Math.PI) * 10; // a little jump
        p.setDepth(p.y + 2);
        frame?.();
      },
      onComplete: () => {
        p.x = x;
        p.y = y;
        this.busy = false;
        s.paused = false;
        done();
      },
    });
  }

  board(wx, wy) {
    const s = this.s;
    // the boat waits on the water where you'll land, then you hop in
    this.on = true;
    this.makeBoat(wx, wy);
    this.boatAlpha(0);
    s.tweens.add({ targets: [this.hull, this.front, this.oarsBack, this.oarsFront], alpha: 1, duration: 160 });
    sfx('plop');
    s.shadow?.setVisible(false);
    this.hop(wx, wy, () => {
      this.draw(0);
      this.splash(wx, wy, 5);
      this.ring(wx, wy - 4, 1.4);
      if (!this.told) {
        this.told = true;
        s.toast('Row into the shore to climb out.');
      }
    }, () => this.draw(0, false, { x: wx, y: wy }));
  }

  leave(lx, ly) {
    const s = this.s;
    const bx = s.player.x;
    const by = s.player.y;
    this.on = false;
    this.bump = 0;
    s.player.setOrigin(0.5, 1);
    // the boat stays where it is, bobs a moment at the shore, then fades
    const parts = [this.hull, this.front, this.oarsBack, this.oarsFront].filter(Boolean);
    this.hull = this.front = this.oarsBack = this.oarsFront = null;
    s.tweens.add({ targets: parts, alpha: 0, delay: 700, duration: 600, onComplete: () => parts.forEach((g) => g.destroy()) });
    this.hop(lx, ly, () => {
      s.shadow?.setVisible(true);
      if (s.pet) {
        s.pet.trail = [];
        s.pet.s.setPosition(lx - 10, ly);
      }
      this.splash(bx, by, 3);
      sfx('step');
    });
  }

  makeBoat(x, y) {
    const s = this.s;
    this.destroyBoat();
    this.hull = s.add.image(x, y, 'row_side').setOrigin(0.5, 0);
    this.front = s.add.image(x, y, 'row_side_front').setOrigin(0.5, 0);
    this.oarsBack = s.add.graphics();
    this.oarsFront = s.add.graphics();
    this.draw(0);
  }

  boatAlpha(a) {
    [this.hull, this.front, this.oarsBack, this.oarsFront].forEach((g) => g?.setAlpha(a));
  }

  destroyBoat() {
    [this.hull, this.front, this.oarsBack, this.oarsFront].forEach((g) => g?.destroy());
    this.hull = this.front = this.oarsBack = this.oarsFront = null;
  }

  // ---------- each frame while afloat ----------
  /** Draws the boat, oars, wake and the rower; returns true while rowing (IslandScene skips walking frames). */
  update(dt, moving) {
    if (!this.hull) return false;
    this.t += dt;
    if (moving) this.stroke += dt * 7; // (when you stop, the oars stay where they are)
    this.draw(dt, moving);
    return this.on;
  }

  draw(dt = 0, moving = false, at = null) {
    const s = this.s;
    const p = at || s.player; // (at: where the boat waits while you jump in)
    if (!this.hull) return;
    const face = s.facing || 'down';
    const sideways = face === 'left' || face === 'right';
    const shape = sideways ? SHAPES.side : SHAPES.end;
    const key = sideways ? 'row_side' : 'row_end';
    if (this.hull.texture.key !== key) {
      this.hull.setTexture(key);
      this.front.setTexture(`${key}_front`);
    }
    const bob = Math.round(Math.sin(this.t * 2.4) * 1);
    const x = Math.round(p.x);
    const top = Math.round(p.y - shape.seatY + 2 + bob); // the rower's feet sit just under the seat
    this.hull.setPosition(x, top).setDepth(p.y - 1);
    this.front.setPosition(x, top).setDepth(p.y + 1);
    if (this.on && !at) p.setOrigin(0.5, 1 - bob / 32);
    // oars: two sweeps from the rowlocks, back and forth as you row
    const a = Math.sin(this.stroke) * 0.55;
    const g1 = this.oarsBack.clear().setDepth(p.y - 2);
    const g2 = this.oarsFront.clear().setDepth(p.y + 2);
    const oar = (g, ox, oy, ang, len) => {
      const ex = ox + Math.cos(ang) * len;
      const ey = oy + Math.sin(ang) * len;
      g.lineStyle(2, 0x2a1a14, 1).lineBetween(ox, oy, ex, ey);
      g.lineStyle(1, 0xd8c098, 1).lineBetween(ox, oy, ex, ey);
      g.fillStyle(0xc8a878, 1).fillRect(Math.round(ex) - 2, Math.round(ey) - 2, 4, 4);
      g.lineStyle(1, 0x2a1a14, 1).strokeRect(Math.round(ex) - 2, Math.round(ey) - 2, 4, 4);
      return { ex, ey };
    };
    let tips;
    if (sideways) {
      const dir = face === 'right' ? 1 : -1;
      const lx = x - dir * 3;
      tips = [oar(g1, lx, top + 3, -Math.PI / 2 - a * dir, 13), oar(g2, lx, top + shape.h - 4, Math.PI / 2 + a * dir, 13)];
    } else {
      const ly = top + shape.seatY - 4;
      const dir = face === 'down' ? 1 : -1;
      tips = [oar(g2, x - shape.w / 2 + 2, ly, Math.PI + a * dir, 12), oar(g2, x + shape.w / 2 - 2, ly, -a * dir, 12)];
    }
    if (!dt || !this.on) return;
    // the wake: rings behind the boat while moving, a slow ripple when still
    this.wakeT -= dt;
    if (this.wakeT <= 0) {
      this.wakeT = moving ? 0.16 : 1.1;
      const [dx, dy] = DIRS[face];
      const back = sideways ? shape.w / 2 : shape.h / 2;
      if (moving) this.ring(x - dx * back, top + shape.h / 2 - dy * back, 1);
      else this.ring(x, top + shape.h / 2, 0.6);
    }
    // a little splash where the blades dip
    if (moving && Math.abs(Math.sin(this.stroke)) > 0.97 && !this.dipped) {
      this.dipped = true;
      tips.forEach((t) => this.splash(t.ex, t.ey, 2));
      if (Math.random() < 0.5) sfx('plop');
    } else if (Math.abs(Math.sin(this.stroke)) < 0.9) this.dipped = false;
  }

  ring(x, y, k) {
    const s = this.s;
    const r = s.add.ellipse(x, y, 8 * k, 3 * k).setStrokeStyle(1, 0xe8f2ff, 0.75).setDepth(0.7);
    s.tweens.add({ targets: r, scaleX: 3, scaleY: 2.4, alpha: 0, duration: 900, onComplete: () => r.destroy() });
  }

  splash(x, y, n) {
    const s = this.s;
    for (let i = 0; i < n; i++) {
      const d = s.add.rectangle(x, y, 2, 2, 0xf2fbff, 0.9).setDepth(s.player.y + 3);
      s.tweens.add({ targets: d, x: x + (Math.random() - 0.5) * 12, y: y - 4 - Math.random() * 6, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  // your pet sits in the bow
  carryPet(pet) {
    if (!pet || !this.hull) return;
    const face = this.s.facing || 'down';
    const [dx, dy] = DIRS[face];
    const p = this.s.player;
    pet.s.setPosition(p.x + dx * 13, p.y + dy * 8 - (dy < 0 ? 4 : 0));
    pet.s.setTexture(`${pet.prefix}_${face === 'up' ? 'up' : face === 'down' ? 'down' : 'side'}`).setFlipX(face === 'left');
    pet.s.setDepth(p.y + (dy > 0 ? 3 : -0.5));
  }

  destroy() {
    this.destroyBoat();
    closeRowAsk();
    this.on = false;
  }
}
