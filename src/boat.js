// A little rowboat you hop into from the shore. Face the water and tap Boat; you
// step down into it and row about the island's water with the oars going. Face the
// shore and tap Hop out. The boat stays moored where you left it, so you can hop
// back in. Out on the water you can fish from it, too.
//
// The boat is two pictures with you between them: the back half of the hull
// behind you and the near half in front, so you sit inside it.
import { sfx } from './music.js';

const HY = -3; // the hull sits a little above your feet, so its near half covers your legs

const OUT = '#1d1714';
const WOOD = '#9a6a42';
const WOOD_L = '#c08a58';
const WOOD_D = '#6b4428';
const INSIDE = '#4a2f22';

// A lens-shaped hull, `w`×`h`, long side horizontal or vertical. `half`: 'back' is the whole
// hull seen from above with its inside showing; 'front' is the near half, over the rower's legs.
function bakeHull(scene, key, w, h, horizontal, half) {
  if (scene.textures.exists(key)) return key;
  const t = scene.textures.createCanvas(key, w, h + 3);
  const g = t.getContext();
  const long = horizontal ? w : h;
  const short = horizontal ? h : w;
  // is (x, y) inside the lens? (a pointed oval)
  const inside = (x, y, grow = 0) => {
    const u = ((horizontal ? x : y) + 0.5 - long / 2) / (long / 2 + grow);
    const v = ((horizontal ? y : x) + 0.5 - short / 2) / (short / 2 + grow);
    return Math.abs(v) <= 1 - Math.pow(Math.abs(u), 1.7) && Math.abs(u) <= 1;
  };
  const px = (x, y, c) => {
    g.fillStyle = c;
    g.fillRect(x, y, 1, 1);
  };
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!inside(x, y)) {
        // a soft shadow on the water underneath
        if (half === 'back' && inside(x, y - 2, 0.02) && y > 1) {
          g.fillStyle = 'rgba(10,30,60,0.22)';
          g.fillRect(x, y + 2, 1, 1);
        }
        continue;
      }
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      const rim = !inside(x - 2, y) || !inside(x + 2, y) || !inside(x, y - 2) || !inside(x, y + 2);
      const nearHalf = y >= h / 2 - 1;
      if (half === 'front') {
        if (!nearHalf) continue;
        if (edge) px(x, y, OUT);
        else if (rim) px(x, y, WOOD_L);
        else px(x, y, (horizontal ? x : y) % 4 === 0 ? WOOD_D : WOOD);
      } else if (edge) px(x, y, OUT);
      else if (rim) px(x, y, y < h / 2 ? WOOD_L : WOOD);
      else px(x, y, INSIDE);
    }
  // a thwart (seat) across the middle
  if (half === 'back') {
    const mid = Math.floor(long / 2);
    for (let i = 3; i < short - 3; i++) {
      const x = horizontal ? mid : i;
      const y = horizontal ? i : mid;
      if (inside(x, y)) px(x, y, WOOD_D);
    }
  }
  t.refresh();
  return key;
}

export class Boat {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.skiff = null; // the moored boat: { x, y, orient, back, front }
    this.t = 0;
    this.oars = scene.add.graphics().setDepth(0.9);
    this.wakeT = 0;
    this.stroke = 0;
    this.keys = {
      h: [bakeHull(scene, 'boat_h_back', 46, 20, true, 'back'), bakeHull(scene, 'boat_h_front', 46, 20, true, 'front')],
      v: [bakeHull(scene, 'boat_v_back', 22, 44, false, 'back'), bakeHull(scene, 'boat_v_front', 22, 44, false, 'front')],
    };
  }

  orient(facing) {
    return facing === 'left' || facing === 'right' ? 'h' : 'v';
  }

  // Can a boat sit here? Open water only: no shore, dock, rock or post, and inside the map.
  // (a boat is long, so the sideways ones need more room left and right, the up-and-down ones above and below)
  fits(x, y, orient = 'v') {
    const s = this.scene;
    const m = s.mapBounds();
    if (x < m.x0 || x > m.x1 || y < m.y0 || y > m.y1) return false;
    const probe = orient === 'h' ? [[0, 0], [-17, 0], [17, 0], [-9, 6], [9, 6], [0, -6]] : [[0, 0], [-8, 0], [8, 0], [0, -14], [0, 12]];
    return probe.every(([dx, dy]) => s.boatWater(x + dx, y + dy));
  }

  makeLayers(x, y, orient) {
    const [kb, kf] = this.keys[orient];
    const back = this.scene.add.image(x, y + HY, kb).setOrigin(0.5, 0.5);
    const front = this.scene.add.image(x, y + HY, kf).setOrigin(0.5, 0.5);
    return { back, front };
  }

  // Step down into the boat at a spot of open water ahead (or into the moored boat).
  board(spot, facing) {
    const s = this.scene;
    const p = s.player;
    const orient = this.orient(facing);
    this.setOrient(orient, spot.x, spot.y, true);
    if (this.skiff) {
      this.skiff.tween?.stop();
      this.skiff.back.destroy();
      this.skiff.front.destroy();
      this.skiff = null;
    }
    s.paused = true;
    s.fishing.end();
    sfx('hop');
    const x0 = p.x;
    const y0 = p.y;
    this.hull.back.setAlpha(0).setScale(0.7);
    this.hull.front.setAlpha(0).setScale(0.7);
    s.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 300,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const k = tw.getValue();
        p.setPosition(x0 + (spot.x - x0) * k, y0 + (spot.y - y0) * k);
        p.setOrigin(0.5, 1 + (Math.sin(k * Math.PI) * 14) / 32);
        const a = Math.min(1, k * 1.6);
        this.hull.back.setAlpha(a).setScale(0.7 + 0.3 * k);
        this.hull.front.setAlpha(a).setScale(0.7 + 0.3 * k);
      },
      onComplete: () => {
        p.setPosition(spot.x, spot.y);
        p.setOrigin(0.5, 1);
        this.ring(spot.x, spot.y + 4, 3);
        this.active = true;
        this.t = 0;
        s.shadow.setVisible(false);
        s.pet?.s.setVisible(false);
        s.paused = false;
        sfx('plop');
      },
    });
    this.active = true; // (afloat from the first frame)
  }

  setOrient(orient, x, y, fresh) {
    if (this.hull && this.hull.orient === orient && !fresh) return;
    this.hull?.back.destroy();
    this.hull?.front.destroy();
    this.hull = { orient, ...this.makeLayers(x, y, orient) };
  }

  // Row about. Called every frame while afloat; `moving` is whether you're pushing.
  update(dt, moving, facing, vx, vy) {
    const s = this.scene;
    const p = s.player;
    if (!this.active || !this.hull) return;
    this.t += dt;
    const orient = this.orient(facing);
    if (orient !== this.hull.orient) this.setOrient(orient, p.x, p.y);
    const bob = Math.sin(this.t * 2.2) * 0.8;
    const { back, front } = this.hull;
    back.setPosition(p.x, p.y + HY + bob).setDepth(p.y - 1).setScale(1);
    front.setPosition(p.x, p.y + HY + bob).setDepth(p.y + 1).setScale(1);
    p.setOrigin(0.5, 1 + bob / 32);
    if (moving) {
      this.stroke = (this.stroke || 0) + dt * 5.5;
      this.wakeT -= dt;
      if (this.wakeT <= 0) {
        this.wakeT = 0.16;
        this.wake(p.x, p.y, vx, vy);
      }
      if (Math.sin(this.stroke) > 0.96 && !this.stroked) {
        this.stroked = true;
        sfx('oar');
      } else if (Math.sin(this.stroke) < 0.5) this.stroked = false;
    }
    this.drawOars(moving, orient, p.x, p.y + HY + bob);
    s.shadow.setVisible(false);
  }

  // The oars: out to the sides, sweeping fore and aft when rowing, lying in the boat when still.
  drawOars(moving, orient, x, y) {
    const g = this.oars;
    g.clear();
    g.setDepth(this.scene.player.y + 0.5);
    const sw = moving ? Math.sin(this.stroke || 0) : 0;
    const len = moving ? 17 : 8;
    const lock = orient === 'h' ? [[0, 7], [0, -5]] : [[-10, 0], [10, 0]]; // oarlocks (near side / far side, or left / right)
    lock.forEach(([ox, oy], i) => {
      const side = orient === 'h' ? (i === 0 ? 1 : -1) : i === 0 ? -1 : 1;
      // the angle the oar is swung to (0 straight out from the boat)
      const swing = sw * 0.7 * (i === 0 ? 1 : -1);
      const dx = orient === 'h' ? Math.sin(swing) * len : side * Math.cos(swing) * len;
      const dy = orient === 'h' ? side * Math.cos(swing) * len : Math.sin(swing) * len;
      g.lineStyle(2, 0x1d1714, 1).beginPath().moveTo(x + ox, y + oy).lineTo(x + ox + dx, y + oy + dy).strokePath();
      g.lineStyle(1, 0xc08a58, 1).beginPath().moveTo(x + ox, y + oy).lineTo(x + ox + dx, y + oy + dy).strokePath();
      if (moving) g.fillStyle(0x1d1714, 1).fillRect(x + ox + dx - 2, y + oy + dy - 1, 4, 3).fillStyle(0xe8c890, 1).fillRect(x + ox + dx - 1, y + oy + dy, 2, 1);
    });
  }

  ring(x, y, n = 2) {
    const s = this.scene;
    for (let i = 0; i < n; i++) {
      const r = s.add.ellipse(x, y, 8, 3).setStrokeStyle(1, 0xf2fbff, 0.85).setDepth(0.7);
      s.tweens.add({ targets: r, scaleX: 2.6 + i, scaleY: 2.6 + i, alpha: 0, delay: i * 120, duration: 650, onComplete: () => r.destroy() });
    }
  }

  // Foam and ripples behind the boat.
  wake(x, y, vx, vy) {
    const s = this.scene;
    const len = Math.hypot(vx, vy) || 1;
    const bx = x - (vx / len) * 14;
    const by = y - (vy / len) * 6 + 4;
    const r = s.add.ellipse(bx, by, 9, 3).setStrokeStyle(1, 0xf2fbff, 0.7).setDepth(0.7);
    s.tweens.add({ targets: r, scaleX: 2.4, scaleY: 2.4, alpha: 0, duration: 700, onComplete: () => r.destroy() });
    for (let i = 0; i < 2; i++) {
      const f = s.add.rectangle(bx + (Math.random() - 0.5) * 8, by + (Math.random() - 0.5) * 3, 2, 1, 0xffffff, 0.85).setDepth(0.8);
      s.tweens.add({ targets: f, alpha: 0, y: f.y + 2, duration: 600, onComplete: () => f.destroy() });
    }
  }

  // Step out onto the shore ahead; the boat stays moored where it is.
  hopOut(land) {
    const s = this.scene;
    const p = s.player;
    const { hull } = this;
    s.paused = true;
    s.fishing.end();
    this.oars.clear();
    sfx('hop');
    const x0 = p.x;
    const y0 = p.y;
    // the boat stays where you left it
    this.active = false;
    const moored = { x: x0, y: y0, orient: hull.orient, back: hull.back, front: hull.front };
    moored.back.setDepth(y0 - 1);
    moored.front.setDepth(y0 + 1);
    moored.tween = s.tweens.add({ targets: [moored.back, moored.front], y: '+=1.2', duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.skiff = moored;
    this.hull = null;
    s.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 300,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        const k = tw.getValue();
        p.setPosition(x0 + (land.x - x0) * k, y0 + (land.y - y0) * k);
        p.setOrigin(0.5, 1 + (Math.sin(k * Math.PI) * 14) / 32);
      },
      onComplete: () => {
        p.setPosition(land.x, land.y);
        p.setOrigin(0.5, 1);
        s.shadow.setVisible(true);
        if (s.pet) s.pet.s.setVisible(true).setPosition(land.x, land.y);
        s.paused = false;
      },
    });
  }

  // Hop into the boat left moored on the water.
  boardSkiff() {
    const k = this.skiff;
    if (!k) return;
    this.board({ x: k.x, y: k.y }, k.orient === 'h' ? 'right' : 'down');
  }
}
