// Seasons and weather outside. The season follows the real calendar; the
// weather is picked per day (the same all day). ?weather=rain|snow|leaves|petals|clear
// pins it for testing (and ?season=winter|spring|summer|autumn the season).
//   winter: snow falls, snow lies on the grass
//   spring: cherry petals drift
//   summer: clear skies (more butterflies)
//   autumn: falling leaves, trees turn orange
//   any season but winter: some days it rains
export function season(date = new Date()) {
  const pinned = /[?&]season=(\w+)/.exec(location.search);
  if (pinned) return pinned[1];
  const m = date.getMonth();
  return m === 11 || m <= 1 ? 'winter' : m <= 4 ? 'spring' : m <= 7 ? 'summer' : 'autumn';
}

export function weatherToday(date = new Date()) {
  const pinned = /[?&]weather=(\w+)/.exec(location.search);
  if (pinned) return pinned[1];
  const s = season(date);
  const day = Math.floor(date.getTime() / 86400000);
  const r = Math.abs(Math.sin(day * 12.9898) * 43758.5453) % 1;
  if (s === 'winter') return r < 0.55 ? 'snow' : 'clear';
  if (r < 0.22) return 'rain';
  return s === 'autumn' ? 'leaves' : s === 'spring' ? 'petals' : 'clear';
}

const PARTS = {
  rain: { n: 110, color: 0xdce8ff, w: 1, h: 9, vx: -50, vy: 460, alpha: 0.75 },
  snow: { n: 70, color: 0xffffff, w: 2, h: 2, vx: -8, vy: 34, alpha: 0.9, sway: 14 },
  leaves: { n: 22, colors: [0xe8702a, 0xc84a2a, 0xf2a03a, 0xa8642a], w: 3, h: 2, vx: -18, vy: 30, alpha: 1, sway: 26, spin: true },
  petals: { n: 24, colors: [0xf4b8d0, 0xffd8e8, 0xf090b8], w: 2, h: 2, vx: -14, vy: 22, alpha: 0.95, sway: 20, spin: true },
};

// Falling particles over the view (they live in screen space so they cover
// wherever the camera goes).
export class Weather {
  constructor(scene, kind) {
    this.scene = scene;
    this.kind = kind;
    this.cfg = PARTS[kind];
    this.parts = [];
    this.t = 0;
    if (!this.cfg) return;
    const cam = scene.cameras.main;
    for (let i = 0; i < this.cfg.n; i++) {
      const color = this.cfg.colors ? this.cfg.colors[i % this.cfg.colors.length] : this.cfg.color;
      const r = scene.add.rectangle(0, 0, this.cfg.w, this.cfg.h, color, this.cfg.alpha).setDepth(6001).setScrollFactor(0);
      if (kind === 'rain') r.setAngle(6);
      this.parts.push({ r, x: Math.random(), y: Math.random(), ph: Math.random() * 6, sp: 0.7 + Math.random() * 0.6 });
    }
    this.view = () => ({ w: cam.width / cam.zoom, h: cam.height / cam.zoom });
    if (kind === 'rain') {
      // a grey sky
      this.sky = scene.add.rectangle(0, 0, 10, 10, 0x9aa4b4, 1).setOrigin(0).setScrollFactor(0).setDepth(4999).setBlendMode('MULTIPLY');
    }
  }

  update(dt) {
    if (!this.cfg) return;
    this.t += dt;
    const cam = this.scene.cameras.main;
    // in screen space the camera's zoom still applies around its center
    const vw = cam.width;
    const vh = cam.height;
    const z = cam.zoom;
    const ox = (vw - vw / z) / 2;
    const oy = (vh - vh / z) / 2;
    if (this.sky) this.sky.setPosition(ox - 4, oy - 4).setSize(vw / z + 8, vh / z + 8);
    this.parts.forEach((p) => {
      p.y += (this.cfg.vy * p.sp * dt) / (vh / z);
      p.x += (this.cfg.vx * p.sp * dt) / (vw / z);
      if (p.y > 1.02) {
        p.y = -0.02;
        p.x = Math.random() * 1.2;
        if (this.kind === 'rain' && Math.random() < 0.5) this.splash();
      }
      if (p.x < -0.05) p.x += 1.1;
      const sway = this.cfg.sway ? Math.sin(this.t * 1.6 + p.ph) * this.cfg.sway : 0;
      p.r.setPosition(ox + p.x * (vw / z) + sway, oy + p.y * (vh / z));
      if (this.cfg.spin) p.r.setAngle(Math.sin(this.t * 3 + p.ph) * 60);
    });
  }

  // A tiny splash where a raindrop lands (in the world, near the camera).
  splash() {
    const view = this.scene.cameras.main.worldView;
    const x = view.x + Math.random() * view.width;
    const y = view.y + Math.random() * view.height;
    const s = this.scene.add.ellipse(x, y, 4, 2).setStrokeStyle(1, 0xd8e8ff, 0.7).setDepth(0.8);
    this.scene.tweens.add({ targets: s, scaleX: 2, scaleY: 2, alpha: 0, duration: 400, onComplete: () => s.destroy() });
  }
}
