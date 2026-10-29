// Little lives on the island: gulls gliding overhead (their shadows slide
// across the ground), crabs that scuttle off when you get close, butterflies
// over the flowers, fish jumping out at sea, fireflies after dark, a duck
// family paddling round the pond and frogs on its bank that plop in when you
// come close. The weather changes who is out: rain brings the frogs out and
// sends the butterflies and gulls home; snow keeps the crabs and frogs in.
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
  // swan: white, long curved neck, orange bill
  tex(scene, 'swan_0', 20, 16, (R) => {
    R(3, 9, 13, 5, OUT);
    R(4, 10, 11, 3, '#fafaf8');
    R(2, 7, 3, 4, OUT);
    R(13, 2, 4, 9, OUT);
    R(14, 3, 2, 8, '#fafaf8');
    R(14, 0, 4, 4, OUT);
    R(15, 1, 2, 2, '#fafaf8');
    R(18, 1, 2, 2, '#e8702a');
    R(16, 1, 1, 1, OUT);
    R(5, 10, 4, 1, '#dcdcd4');
  });
  // duck (white, orange bill) and duckling (yellow), feet paddling
  [0, 1].forEach((f) => {
    tex(scene, `duck_${f}`, 14, 11, (R) => {
      R(1, 4, 10, 5, OUT);
      R(2, 5, 8, 3, '#f4f4f0');
      R(8, 0, 5, 5, OUT);
      R(9, 1, 3, 3, '#f4f4f0');
      R(13, 2, 1, 2, '#f2a03a');
      R(11, 2, 2, 1, '#e8702a');
      R(10, 1, 1, 1, OUT);
      R(2, 5, 3, 1, '#d8d8d0');
      R(3 + f * 2, 9, 2, 1, '#e8702a');
      R(7 - f * 2, 9, 2, 1, '#e8702a');
    });
    tex(scene, `duckling_${f}`, 8, 7, (R) => {
      R(0, 3, 6, 3, OUT);
      R(1, 3, 4, 2, '#f8d84a');
      R(4, 0, 3, 3, OUT);
      R(5, 1, 1, 1, '#f8d84a');
      R(7, 1, 1, 1, '#e8702a');
      R(1 + f, 6, 1, 1, '#e8702a');
      R(4 - f, 6, 1, 1, '#e8702a');
    });
    // frog: sitting (0) and mid-hop (1)
    tex(scene, `frog_${f}`, 10, 8, (R) => {
      if (!f) {
        R(1, 3, 8, 5, OUT);
        R(2, 3, 6, 4, '#5aa83a');
        R(1, 1, 3, 3, OUT);
        R(6, 1, 3, 3, OUT);
        R(2, 2, 1, 1, '#f8f0c8');
        R(7, 2, 1, 1, '#f8f0c8');
        R(3, 5, 4, 1, '#a8d86a');
      } else {
        R(2, 1, 6, 4, OUT);
        R(3, 1, 4, 3, '#5aa83a');
        R(0, 4, 3, 3, OUT);
        R(7, 4, 3, 3, OUT);
        R(1, 5, 1, 1, '#5aa83a');
        R(8, 5, 1, 1, '#5aa83a');
      }
    });
  });
  tex(scene, 'lilypad', 10, 6, (R) => {
    R(1, 0, 8, 6, '#3a7a3a');
    R(0, 1, 10, 4, '#3a7a3a');
    R(2, 1, 6, 4, '#5aa84a');
    R(4, 0, 2, 3, '#2a5a6a');
  });
  tex(scene, 'firefly', 3, 3, (R) => {
    R(1, 0, 1, 3, '#f8ffb0');
    R(0, 1, 3, 1, '#f8ffb0');
  });
}

export class Critters {
  // map: { w, h, isSand(x,y), isWater(x,y), flowers: [{x,y}], pond: {x,y,w,h} } in pixels
  // weather: 'rain' | 'snow' | ... (see weather.js)
  constructor(scene, map, night, weather = 'clear') {
    this.scene = scene;
    this.map = map;
    this.t = 0;
    critterTextures(scene);
    const rnd = (a, b) => a + Math.random() * (b - a);
    const wet = weather === 'rain';
    const cold = weather === 'snow';
    // gulls: in the sky (always on top), with a shadow on the ground
    this.gulls = Array.from({ length: night || wet ? 0 : cold ? 1 : 3 }, () => this.newGull(rnd(0, map.w)));
    // crabs on the beach
    this.crabs = [];
    for (let tries = 0; tries < 200 && this.crabs.length < (cold ? 0 : 5); tries++) {
      const x = rnd(0, map.w);
      const y = rnd(0, map.h);
      if (map.isSand(x, y) && !map.isWater(x, y)) this.crabs.push({ s: scene.add.image(x, y, 'crab_0').setOrigin(0.5, 1), home: { x, y }, vx: 0, wait: rnd(0.5, 3), run: 0 });
    }
    // butterflies (daytime) or fireflies (night) around the flowers and grass
    this.flies = (night || !(wet || cold) ? map.flowers || [] : []).slice(0, 6).map((f, i) => {
      const key = night ? 'firefly' : `fly_${i % 4}_0`;
      const s = scene.add.image(f.x, f.y - 10, key).setDepth(f.y + 40);
      if (night) s.setBlendMode('ADD').setDepth(5002); // they glow through the dark
      return { s, home: f, a: rnd(0, 6), r: rnd(10, 24), sp: rnd(0.6, 1.4), kind: i % 4, night };
    });
    this.fish = [];
    this.fishTimer = rnd(2, 5);
    this.ducks = [];
    this.swan = null;
    this.frogs = [];
    this.pads = [];
    const p = map.pond;
    if (p) {
      // lily pads drifting slowly (in winter the pond is too cold for them)
      if (!cold)
        for (let i = 0; i < 4; i++) {
          const s = scene.add.image(p.x + rnd(28, p.w - 28), p.y + rnd(28, p.h - 28), 'lilypad').setDepth(0.6).setAngle(rnd(0, 360));
          this.pads.push({ s, ph: rnd(0, 6) });
        }
      // a mother duck and her ducklings paddling in a line (not on the ice)
      if (!night && !cold) {
        const kids = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i <= kids; i++) {
          const s = scene.add.image(0, 0, i ? 'duckling_0' : 'duck_0').setOrigin(0.5, 0.8);
          this.ducks.push({ s, trail: [] });
        }
        this.duckA = rnd(0, 6);
        this.duckSp = 0.35;
      }
      // a swan glides slowly the other way round the pond, by day
      if (!night && !cold) this.swan = { s: scene.add.image(0, 0, 'swan_0').setOrigin(0.5, 0.85), a: rnd(0, 6) };
      // frogs on the bank (more of them in the rain)
      if (!cold) {
        const n = wet ? 4 : 2;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + rnd(-0.4, 0.4);
          // step out from the middle until we're on dry ground
          let r = 0.5;
          const at = (k) => ({ x: p.x + p.w / 2 + Math.cos(a) * (p.w / 2) * k, y: p.y + p.h / 2 + Math.sin(a) * (p.h / 2) * k });
          while (r < 2 && map.isWater(at(r).x, at(r).y)) r += 0.05;
          const home = at(r - 0.16);
          const s = scene.add.image(home.x, home.y, 'frog_0').setOrigin(0.5, 1).setDepth(home.y);
          this.frogs.push({ s, home, a, gone: 0, croak: rnd(2, 8) });
        }
      }
    }
  }

  // The duck family paddles round an oval in the pond; the ducklings follow
  // their mother's path. If you come close they hurry along.
  updateDucks(dt, player) {
    if (!this.ducks.length) return;
    const p = this.map.pond;
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const mom = this.ducks[0];
    const near = Math.hypot(player.x - mom.s.x, player.y - mom.s.y) < 50;
    this.duckSp += ((near ? 1.1 : 0.35) - this.duckSp) * Math.min(1, dt * 2);
    const rx = p.w / 2 - 26;
    const ry = p.h / 2 - 26;
    this.duckA += (this.duckSp * dt * 40) / Math.max(20, (rx + ry) / 2);
    const x = cx + Math.cos(this.duckA) * rx;
    const y = cy + Math.sin(this.duckA) * ry;
    const dx = -Math.sin(this.duckA);
    mom.trail.unshift({ x, y, dx });
    if (mom.trail.length > 400) mom.trail.length = 400;
    const paddle = Math.floor(this.t * (near ? 10 : 4)) % 2;
    this.ducks.forEach((d, i) => {
      // each duckling a few steps behind the one in front
      const pt = mom.trail[Math.min(mom.trail.length - 1, Math.round((i * 11) / Math.max(0.3, this.duckSp)))];
      const bob = Math.sin(this.t * 3 + i) * 0.6;
      d.s.setPosition(pt.x, pt.y + bob).setFlipX(pt.dx < 0).setDepth(pt.y);
      d.s.setTexture(`${i ? 'duckling' : 'duck'}_${paddle}`);
      if (Math.floor(this.t * 6 + i * 3) % 18 === 0 && !d.rippled) {
        d.rippled = true;
        const ring = this.scene.add.ellipse(pt.x, pt.y + 2, i ? 6 : 10, 3).setStrokeStyle(1, 0xf2fbff, 0.6).setDepth(0.7);
        this.scene.tweens.add({ targets: ring, scaleX: 2, scaleY: 2, alpha: 0, duration: 900, onComplete: () => ring.destroy() });
      } else if (Math.floor(this.t * 6 + i * 3) % 18 !== 0) d.rippled = false;
    });
  }

  // The swan drifts the other way round a wider oval, unhurried.
  updateSwan(dt) {
    if (!this.swan) return;
    const p = this.map.pond;
    const sw = this.swan;
    sw.a -= dt * 0.12;
    const x = p.x + p.w / 2 + Math.cos(sw.a) * p.w * 0.28;
    const y = p.y + p.h / 2 + Math.sin(sw.a) * p.h * 0.28;
    sw.s.setPosition(x, y + Math.sin(this.t * 1.5) * 0.5).setFlipX(Math.sin(sw.a) > 0).setDepth(y);
  }

  // Frogs sit on the bank, puff a croak now and then, and hop into the pond
  // when you come close (then climb back out a while later).
  updateFrogs(dt, player) {
    const p = this.map.pond;
    this.frogs.forEach((f) => {
      if (f.gone > 0) {
        f.gone -= dt;
        if (f.gone <= 0) {
          f.s.setPosition(f.home.x, f.home.y).setTexture('frog_0').setVisible(true).setAlpha(0);
          this.scene.tweens.add({ targets: f.s, alpha: 1, duration: 400 });
        }
        return;
      }
      if (f.hopping) return;
      if (Math.hypot(player.x - f.s.x, player.y - f.s.y) < 40) {
        f.hopping = true;
        const tx = p.x + p.w / 2 + Math.cos(f.a) * (p.w / 2 - 30);
        const ty = p.y + p.h / 2 + Math.sin(f.a) * (p.h / 2 - 30);
        f.s.setTexture('frog_1');
        this.scene.tweens.add({ targets: f.s, x: tx, duration: 380 });
        this.scene.tweens.add({
          targets: f.s,
          y: { from: f.s.y, to: f.s.y - 10 },
          duration: 190,
          yoyo: true,
          ease: 'Sine.easeOut',
          onComplete: () => {
            f.s.setVisible(false);
            f.hopping = false;
            f.gone = 6 + Math.random() * 6;
            const ring = this.scene.add.ellipse(tx, ty - 2, 8, 3).setStrokeStyle(1, 0xf2fbff, 0.9).setDepth(0.7);
            this.scene.tweens.add({ targets: ring, scaleX: 2.4, scaleY: 2.4, alpha: 0, duration: 700, onComplete: () => ring.destroy() });
          },
        });
        this.scene.tweens.add({ targets: f.s, y: ty, delay: 190, duration: 190 });
        return;
      }
      f.croak -= dt;
      if (f.croak < 0) {
        f.croak = 3 + Math.random() * 7;
        this.scene.tweens.add({ targets: f.s, scaleX: 1.15, scaleY: 0.9, duration: 120, yoyo: true, repeat: 1 });
      }
    });
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
    this.pads.forEach((l) => l.s.setAngle(l.s.angle + Math.sin(this.t * 0.3 + l.ph) * dt * 4));
    this.updateDucks(dt, player);
    this.updateSwan(dt);
    this.updateFrogs(dt, player);
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
