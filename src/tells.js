import Phaser from 'phaser';
import { FACE } from './art.js';
// Small tells that make people feel alive: they breathe, they blink now and then. Works for
// anyone with a sprite `n.s` and a skin colour `n.skin` (rooms and islands both use it); only
// people on screen are touched, and the blinks are drawn with one shared Graphics object.
//
//   const tells = new Tells(scene);   tells.update(dt, people, view)
// `view`: the camera's worldView (a rectangle); people far outside it are skipped.
const EYES = [13, 18]; // x of each eye in the 32×32 picture (front view); the eye is 1×2 px at y 10..11
const EYE_Y = 10;
const STILL = /^(.*)_(down|side)$/;

export class Tells {
  constructor(scene) {
    this.scene = scene;
    this.t = 0;
    this.g = scene.add.graphics().setDepth(5);
    this.blinks = [];
    this.blinkT = 0.5;
  }

  update(dt, people, view) {
    this.t += dt;
    const near = (n) => n.s.active && n.s.x > view.x - 24 && n.s.x < view.right + 24 && n.s.y > view.y - 24 && n.s.y < view.bottom + 48;
    // breathing: a slow 1% rise and fall, each person on their own beat
    people.forEach((n) => {
      if (n.animal || !near(n)) return;
      const s = n.s;
      if (n.baseScale === undefined) n.baseScale = s.scaleY;
      n.phase ??= (s.x * 0.37 + s.y * 0.11) % 6.28;
      if (!n.seat) s.scaleY = n.baseScale * (1 + 0.011 * Math.sin(this.t * 2.2 + n.phase));
    });
    // blinking: every so often someone facing us closes their eyes for a moment
    this.blinkT -= dt;
    if (this.blinkT <= 0) {
      this.blinkT = 0.25 + Math.random() * 0.35;
      // anyone standing still facing us or side-on (their own eye map from art.js FACE; the old
      // fixed spots only for front-facing people drawn some other way)
      const facing = people.filter((n) => !n.animal && n.skin && !n.noBlink && near(n) && STILL.test(n.s.texture.key) && !this.blinks.some((b) => b.n === n));
      if (facing.length) {
        const n = facing[Math.floor(Math.random() * facing.length)];
        // now and then a double blink
        this.blinks.push({ n, key: n.s.texture.key, until: this.t + 0.12 });
        if (Math.random() < 0.2) this.blinks.push({ n, key: n.s.texture.key, from: this.t + 0.24, until: this.t + 0.34 });
      }
    }
    if (!this.blinks.length && !this.drawn) return;
    const g = this.g.clear();
    this.drawn = this.blinks.length > 0;
    this.blinks = this.blinks.filter((b) => b.until > this.t && b.n.s.active && b.n.s.texture.key === b.key);
    let depth = 0;
    this.blinks.forEach(({ n, key, from }) => {
      if (from && from > this.t) return;
      const s = n.s;
      const k = Math.abs(s.scaleX);
      const m = STILL.exec(key);
      const face = FACE[m[1]]?.[m[2]];
      if (face) {
        g.fillStyle(Phaser.Display.Color.HexStringToColor(face.lid).color, 1);
        face.cells.forEach(([x, y]) => {
          const fx = s.flipX ? 31 - x : x;
          g.fillRect(s.x + (fx - 16) * k, s.y - (face.h - y) * s.scaleY, Math.max(1, k), s.scaleY);
        });
      } else if (m[2] === 'down') {
        g.fillStyle(Phaser.Display.Color.HexStringToColor(n.skin).color, 1);
        EYES.forEach((ex) => g.fillRect(s.x + (ex - 16) * k, s.y - (32 - EYE_Y) * s.scaleY, Math.max(1, k), 2 * s.scaleY));
      } else return;
      depth = Math.max(depth, s.depth + 0.5);
    });
    g.setDepth(depth || 5);
  }
}
