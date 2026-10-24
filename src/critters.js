// Little lives on the island: gulls gliding overhead (their shadows slide
// across the ground), crabs that scuttle off when you get close, butterflies
// over the flowers, fish jumping out at sea, and fireflies after dark.
const OUT = '#1d1714';

function tex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h);
  const ctx = t.getContext();
  const R = (x, y, rw, rh, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, rw, rh);
  };
  draw(R);
  t.refresh();
}

export function critterTextures(scene) {
  // gull, wings up and down
  tex(scene, 'gull_0', 16, 8, (R) => {
    R(6, 3, 5, 3, OUT);
    R(7, 4, 3, 1, '#ffffff');
    R(1, 1, 5, 2, OUT);
    R(10, 1, 5, 2, OUT);
    R(2, 1, 3, 1, '#e8e8ec');
    R(11, 1, 3, 1, '#e8e8ec');
    R(11, 4, 2, 1, '#f2c53d');
  });
  tex(scene, 'gull_1', 16, 8, (R) => {
    R(6, 2, 5, 3, OUT);
    R(7, 3, 3, 1, '#ffffff');
    R(1, 4, 5, 2, OUT);
    R(10, 4, 5, 2, OUT);
    R(2, 4, 3, 1, '#e8e8ec');
    R(11, 4, 3, 1, '#e8e8ec');
    R(11, 3, 2, 1, '#f2c53d');
  });
  [0, 1].forEach((f) =>
    tex(scene, `crab_${f}`, 12, 8, (R) => {
      R(3, 3, 6, 4, OUT);
      R(4, 3, 4, 3, '#e0502a');
      R(4, 1, 1, 2, OUT);
      R(7, 1, 1, 2, OUT);
      R(0, 2 + f, 3, 2, '#e0502a');
      R(9, 3 - f, 3, 2, '#e0502a');
      [2, 4, 7, 9].forEach((x, i) => R(x, 7 - ((i + f) % 2), 1, 1, OUT));
    }),
  );
  [
    ['#f2c53d', '#e8702a'],
    ['#8ac8f0', '#3a78c8'],
    ['#ffffff', '#c8c8d0'],
    ['#f08ab0', '#c04a7a'],
  ].forEach(([a, b], i) =>
    [0, 1].forEach((f) =>
      tex(scene, `fly_${i}_${f}`, 8, 6, (R) => {
        R(3, 1, 2, 4, OUT);
        if (f) {
          R(0, 1, 3, 3, a);
          R(5, 1, 3, 3, a);
          R(1, 2, 1, 1, b);
          R(6, 2, 1, 1, b);
        } else {
          R(1, 0, 2, 2, a);
          R(5, 0, 2, 2, a);
        }
      }),
    ),
  );
  tex(scene, 'fish', 8, 4, (R) => {
    R(1, 1, 5, 2, '#c8d8e8');
    R(2, 1, 3, 1, '#ffffff');
    R(6, 0, 2, 4, '#a8b8c8');
    R(1, 1, 1, 1, OUT);
  });
  tex(scene, 'firefly', 3, 3, (R) => {
    R(1, 0, 1, 3, '#f8ffb0');
    R(0, 1, 3, 1, '#f8ffb0');
  });
}

export class Critters {
  // map: { w, h, isSand(x,y), isWater(x,y), flowers: [{x,y}] } in pixels
  constructor(scene, map, night) {
    this.scene = scene;
    this.map = map;
    this.t = 0;
    critterTextures(scene);
    const rnd = (a, b) => a + Math.random() * (b - a);
    // gulls: in the sky (always on top), with a shadow on the ground
    this.gulls = Array.from({ length: night ? 0 : 3 }, () => this.newGull(rnd(0, map.w)));
    // crabs on the beach
    this.crabs = [];
    for (let tries = 0; tries < 200 && this.crabs.length < 5; tries++) {
      const x = rnd(0, map.w);
      const y = rnd(0, map.h);
      if (map.isSand(x, y) && !map.isWater(x, y)) this.crabs.push({ s: scene.add.image(x, y, 'crab_0').setOrigin(0.5, 1), home: { x, y }, vx: 0, wait: rnd(0.5, 3), run: 0 });
    }
    // butterflies (daytime) or fireflies (night) around the flowers and grass
    this.flies = (map.flowers || []).slice(0, 6).map((f, i) => {
      const key = night ? 'firefly' : `fly_${i % 4}_0`;
      const s = scene.add.image(f.x, f.y - 10, key).setDepth(f.y + 40);
      if (night) s.setBlendMode('ADD');
      return { s, home: f, a: rnd(0, 6), r: rnd(10, 24), sp: rnd(0.6, 1.4), kind: i % 4, night };
    });
    this.fish = [];
    this.fishTimer = rnd(2, 5);
  }

  newGull(x) {
    const sc = this.scene;
    const y = Math.random() * this.map.h;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const g = {
      x: dir > 0 ? -40 : this.map.w + 40,
      y,
      dir,
      sp: 26 + Math.random() * 20,
      wob: Math.random() * 6,
      s: sc.add.image(0, 0, 'gull_0').setDepth(6000).setFlipX(dir < 0).setScale(1.3),
      sh: sc.add.ellipse(0, 0, 10, 3, 0x000000, 0.18).setDepth(0.55),
    };
    if (x !== undefined) g.x = x;
    return g;
  }

  update(dt, player) {
    this.t += dt;
    const flap = Math.floor(this.t * 4) % 2;
    this.gulls.forEach((g, i) => {
      g.x += g.dir * g.sp * dt;
      const glide = Math.sin(this.t * 0.8 + g.wob) * 10;
      g.s.setPosition(g.x, g.y + glide - 60).setTexture(Math.sin(this.t * 3 + g.wob) > 0.3 ? `gull_${flap}` : 'gull_0');
      g.sh.setPosition(g.x + 6, g.y + glide);
      if (g.x < -60 || g.x > this.map.w + 60) {
        g.s.destroy();
        g.sh.destroy();
        this.gulls[i] = this.newGull();
      }
    });
    this.crabs.forEach((c) => {
      const d = Math.hypot(player.x - c.s.x, player.y - c.s.y);
      if (d < 46 && !c.run) {
        c.run = 1.2; // scuttle away sideways
        c.vx = player.x < c.s.x ? 60 : -60;
      }
      if (c.run > 0) {
        c.run -= dt;
        const nx = c.s.x + c.vx * dt;
        if (this.map.isSand(nx, c.s.y) && !this.map.isWater(nx, c.s.y)) c.s.x = nx;
        else c.vx = -c.vx;
        if (c.run <= 0) {
          c.run = 0;
          c.wait = 1 + Math.random() * 3;
        }
      } else {
        c.wait -= dt;
        if (c.wait < 0) {
          // a little sideways wander near home
          c.vx = (Math.random() < 0.5 ? -1 : 1) * 18;
          if (Math.abs(c.s.x - c.home.x) > 30) c.vx = c.home.x > c.s.x ? 18 : -18;
          c.run = 0.6;
        }
      }
      c.s.setTexture(c.run ? `crab_${Math.floor(this.t * 12) % 2}` : 'crab_0').setDepth(c.s.y);
    });
    this.flies.forEach((f) => {
      f.a += dt * f.sp;
      const x = f.home.x + Math.cos(f.a) * f.r + Math.sin(f.a * 2.3) * 4;
      const y = f.home.y - 12 + Math.sin(f.a * 1.7) * (f.r * 0.5) + (f.night ? Math.sin(f.a * 0.7) * 8 : 0);
      f.s.setPosition(x, y);
      if (f.night) f.s.setAlpha(0.4 + 0.6 * Math.max(0, Math.sin(this.t * 2 + f.a * 3)));
      else f.s.setTexture(`fly_${f.kind}_${Math.floor(this.t * 10 + f.a) % 2}`);
    });
    // now and then a fish jumps out at sea
    this.fishTimer -= dt;
    if (this.fishTimer < 0) {
      this.fishTimer = 2 + Math.random() * 5;
      for (let tries = 0; tries < 30; tries++) {
        const x = player.x + (Math.random() - 0.5) * 300;
        const y = player.y + (Math.random() - 0.5) * 500;
        if (this.map.isWater(x, y) && this.map.isWater(x + 20, y)) {
          this.jump(x, y);
          break;
        }
      }
    }
  }

  jump(x, y) {
    const sc = this.scene;
    const f = sc.add.image(x, y, 'fish').setDepth(y + 1);
    const dir = Math.random() < 0.5 ? 1 : -1;
    f.setFlipX(dir < 0);
    sc.tweens.add({ targets: f, x: x + dir * 22, duration: 700 });
    sc.tweens.add({ targets: f, y: y - 18, duration: 350, yoyo: true, ease: 'Sine.easeOut', onComplete: () => f.destroy() });
    sc.tweens.add({ targets: f, angle: dir * 70, duration: 700 });
    [0, 700].forEach((delay, i) =>
      sc.time.delayedCall(delay, () => {
        const ring = sc.add.ellipse(x + (i ? dir * 22 : 0), y + 2, 8, 3).setStrokeStyle(1, 0xf2fbff, 0.9).setDepth(0.7);
        sc.tweens.add({ targets: ring, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
      }),
    );
  }
}
