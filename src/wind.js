// A little wind for the islands: one shared breeze (it eases up and down), smoke that drifts
// with it from chimneys and campfires, and gusts that blow leaves (or blossom) along the ground.
// Everything is pooled and only runs near the camera, so it costs next to nothing.
import Phaser from 'phaser';

// the breeze, in px a second (negative: blowing to the left, the way the falling leaves go)
export const windAt = (t) => -12 - 8 * Math.sin(t * 0.21) - 4 * Math.sin(t * 0.9);

const GUST_COLORS = {
  autumn: [0xe8702a, 0xc84a2a, 0xf2a03a, 0xa8642a],
  spring: [0xf4b8d0, 0xffd8e8, 0xf090b8],
};

export class Wind {
  // smokeSpots: [{ x, y }] where smoke rises (campfires, chimneys)
  constructor(scene, { season, weather, smokeSpots = [] }) {
    this.scene = scene;
    this.t = Math.random() * 100;
    this.spots = smokeSpots.map((p) => ({ ...p, wait: Math.random() * 0.5 }));
    this.puffs = [];
    this.leaves = [];
    this.colors = weather === 'rain' || weather === 'snow' ? null : GUST_COLORS[season] || null;
    this.gustIn = 6 + Math.random() * 10;
    this.still = weather === 'rain';
    if (!scene.textures.exists('wind_puff')) {
      const t = scene.textures.createCanvas('wind_puff', 6, 6);
      const g = t.getContext();
      g.fillStyle = '#ffffff';
      [[2, 0, 2, 6], [0, 2, 6, 2], [1, 1, 4, 4]].forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
      t.refresh();
    }
  }

  get breeze() {
    return this.still ? windAt(this.t) * 0.3 : windAt(this.t);
  }

  update(dt, view) {
    this.t += dt;
    const w = this.breeze;
    const sc = this.scene;
    // smoke: a puff every so often from each spot in view, drifting up and away with the wind
    this.spots.forEach((p) => {
      if (p.x < view.x - 40 || p.x > view.right + 40 || p.y < view.y - 80 || p.y > view.bottom + 40) return;
      p.wait -= dt;
      if (p.wait > 0 || this.puffs.length >= 36) return;
      p.wait = 0.4 + Math.random() * 0.3;
      const img = sc.add.image(p.x + (Math.random() - 0.5) * 3, p.y, 'wind_puff').setTint(0xe6eaee).setAlpha(0.8).setScale(0.8).setDepth(p.y + 40);
      this.puffs.push({ img, age: 0, life: 2.4 + Math.random() * 0.8, vy: -(14 + Math.random() * 6) });
    });
    this.puffs = this.puffs.filter((q) => {
      q.age += dt;
      const k = q.age / q.life;
      if (k >= 1 || !q.img.active) return q.img.destroy(), false;
      q.img.x += (w * (0.5 + k)) * dt * 0.9 + Math.sin(q.age * 3 + q.life) * 3 * dt; // the wind takes it, more as it climbs
      q.img.y += q.vy * dt;
      q.img.setScale(0.8 + k * 1.6).setAlpha(0.8 * (1 - k * k));
      return true;
    });
    // gusts of leaves skittering along the ground
    if (this.colors) {
      this.gustIn -= dt;
      if (this.gustIn <= 0) {
        this.gustIn = 14 + Math.random() * 20;
        this.gust(view);
      }
    }
    this.leaves = this.leaves.filter((l) => {
      l.age += dt;
      if (l.age >= l.life || !l.img.active) return l.img.destroy(), false;
      const wind = this.breeze * 4.5;
      l.img.x += (wind + l.sway * Math.sin(l.age * 5 + l.ph)) * dt;
      // tumbling along: skips up off the ground and comes back down
      const hop = Math.abs(Math.sin(l.age * l.rate + l.ph)) * l.height;
      l.img.y = l.y0 - hop + Math.sin(l.age * 2) * 3 * dt;
      l.img.setAngle(l.age * l.spin).setDepth(l.y0 + 1);
      l.img.setAlpha(Math.min(1, (l.life - l.age) * 2));
      return true;
    });
  }

  // a handful of leaves, from the windward edge of the view across it
  gust(view) {
    const sc = this.scene;
    const n = 7 + Math.floor(Math.random() * 6);
    const y0 = view.y + view.height * (0.25 + Math.random() * 0.5);
    for (let i = 0; i < n && this.leaves.length < 30; i++) {
      const y = y0 + (Math.random() - 0.5) * 70;
      const img = sc.add.rectangle(view.right + 6 + Math.random() * 30, y, 3, 2, Phaser.Math.RND.pick(this.colors)).setDepth(y);
      this.leaves.push({ img, age: -Math.random() * 1.2, life: 4 + Math.random() * 1.5, y0: y, ph: Math.random() * 6, rate: 5 + Math.random() * 4, height: 3 + Math.random() * 7, spin: 200 + Math.random() * 300, sway: 8 + Math.random() * 10 });
    }
  }

  // kick a few leaves up as someone steps through them
  flick(x, y) {
    if (!this.colors || this.leaves.length > 26) return;
    for (let i = 0; i < 2; i++) {
      const img = this.scene.add.rectangle(x + (Math.random() - 0.5) * 8, y, 3, 2, Phaser.Math.RND.pick(this.colors)).setDepth(y + 1);
      this.leaves.push({ img, age: 0, life: 1.4 + Math.random() * 0.8, y0: y, ph: Math.random() * 6, rate: 7, height: 8 + Math.random() * 8, spin: 300, sway: 14 });
    }
  }
}
