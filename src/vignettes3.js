// Even more little scenes for the home islands (see vignettes.js for the idea): a kid blowing
// bubbles, two friends on a picnic, a juggler, someone feeding the birds, a kid skipping rope,
// two kids playing catch, a kid chasing a butterfly, someone playing guitar, and a snowman going
// up in winter. Each is a class with `update(dt)`, driven from the person it belongs to
// (several people sharing one scene advance it once a frame, like the kids' circle).
import Phaser from 'phaser';
import { popEmote } from './emotes.js';
import { animateWalker } from './motion.js';

const TAU = Math.PI * 2;
const pickOf = (a) => a[Math.floor(Math.random() * a.length)];
const OUT = '#1d1714';

function bake(scene, key, w, h, fn) {
  if (scene.textures.exists(key)) return key;
  const t = scene.textures.createCanvas(key, w, h);
  const g = t.getContext();
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = fn(x, y);
      if (!c) continue;
      g.fillStyle = c;
      g.fillRect(x, y, 1, 1);
    }
  t.refresh();
  return key;
}

// once a frame, however many people ask
const once = (self, scene) => {
  const f = scene.game.getFrame();
  if (f === self.frame) return false;
  self.frame = f;
  return true;
};

const near = (scene, x, y, r) => Math.hypot(scene.player.x - x, scene.player.y - y) < r;

// ---------- a kid blowing bubbles ----------
export class Bubbles {
  constructor(scene, n) {
    this.scene = scene;
    this.n = n;
    this.g = scene.add.graphics().setDepth(4980);
    this.list = [];
    this.puff = 0.5;
    this.rest = 0;
    this.t = 0;
    n.s.setTexture(`${n.prefix}_side`).setFlipX(false);
  }

  update(dt) {
    const { n, scene } = this;
    const { x, y } = n.home;
    this.t += dt;
    if (this.rest > 0) this.rest -= dt;
    else {
      this.puff -= dt;
      if (this.puff <= 0) {
        // a little burst of bubbles from the wand, then a breath
        this.puff = 0.18 + Math.random() * 0.25;
        this.list.push({ x: x + 9, y: y - 16, vx: 10 + Math.random() * 16, vy: -6 - Math.random() * 10, r: 1.5 + Math.random() * 2.5, life: 2.5 + Math.random() * 2.5, k: Math.random() * TAU });
        if (Math.random() < 0.12) {
          this.rest = 1.6;
          if (Math.random() < 0.5) popEmote(scene, n, pickOf(['smile', 'sparkle', 'star']));
        }
      }
    }
    const g = this.g.clear();
    this.list = this.list.filter((b) => (b.life -= dt) > 0);
    this.list.forEach((b) => {
      b.x += (b.vx + Math.sin(this.t * 2 + b.k) * 8) * dt;
      b.y += b.vy * dt;
      b.vx *= 0.99;
      if (b.life < 0.15) return void g.fillStyle(0xffffff, 0.8).fillRect(b.x - b.r, b.y, 1, 1).fillRect(b.x + b.r, b.y, 1, 1); // pop
      g.lineStyle(1, 0xdff4ff, 0.85).strokeCircle(b.x, b.y, b.r);
      g.fillStyle(0xffffff, 0.9).fillRect(b.x - b.r * 0.5, b.y - b.r * 0.6, 1, 1);
    });
    // the wand
    g.lineStyle(1, 0x6b4428, 1).lineBetween(x + 4, y - 13, x + 8, y - 17);
    g.lineStyle(1, 0xf08ab8, 1).strokeCircle(x + 9, y - 18, 1.5);
  }
}

// ---------- two friends on a picnic ----------
export class Picnic {
  constructor(scene, a, b) {
    this.scene = scene;
    this.ppl = [a, b];
    const { x, y } = a.home;
    this.x = x;
    this.y = y;
    const blanket = bake(scene, 'vig_blanket', 46, 22, (px, py) => {
      if (px === 0 || px === 45 || py === 0 || py === 21) return OUT;
      return (Math.floor(px / 5) + Math.floor(py / 5)) % 2 ? '#e0405a' : '#fff4e6';
    });
    const basket = bake(scene, 'vig_basket', 12, 10, (px, py) => {
      if (py < 3) return (px === 2 || px === 9) && py > 0 ? '#6b4428' : py === 0 && px > 2 && px < 9 ? '#6b4428' : null; // the handle
      if (px === 0 || px === 11 || py === 9 || py === 3) return OUT;
      return (px + py) % 2 ? '#c08a58' : '#9a6a42';
    });
    scene.add.image(x, y + 6, blanket).setOrigin(0.5, 1).setDepth(1.5);
    scene.add.image(x + 2, y - 4, basket).setOrigin(0.5, 1).setDepth(y - 4);
    // a plate of something and two cups
    scene.add.graphics().setDepth(2).fillStyle(0xffffff, 1).fillEllipse(x - 4, y + 1, 8, 4).fillStyle(0xf4d35e, 1).fillRect(x - 5, y, 3, 1).fillStyle(0x3f86c0, 1).fillRect(x + 10, y - 1, 2, 3).fillRect(x - 14, y + 1, 2, 3);
    [a, b].forEach((n, i) => {
      n.s.setTexture(`${n.prefix}_sit`).setFlipX(false).setPosition(x + (i ? 14 : -14), y - 1).setDepth(y);
      n.seatAt = { x: x + (i ? 14 : -14), y: y - 1 };
    });
    this.t = 0;
    this.next = 3;
    this.frame = -1;
  }

  update(dt) {
    if (!once(this, this.scene)) return;
    this.t += dt;
    this.next -= dt;
    // chatting and eating: little bobs and a heart or a laugh now and then
    this.ppl.forEach((n, i) => {
      if (n.talking) return;
      const bob = Math.max(0, Math.sin(this.t * 1.7 + i * 2)) * 0.8;
      n.s.setTexture(`${n.prefix}_sit`).setFlipX(false).setPosition(n.seatAt.x, n.seatAt.y + bob);
    });
    if (this.next <= 0) {
      this.next = 3 + Math.random() * 4;
      const who = pickOf(this.ppl);
      if (!who.talking) popEmote(this.scene, who, pickOf(['heart', 'note', 'smile', 'smile', 'star']), { lift: 7 });
    }
  }
}

// ---------- a juggler ----------
export class Juggler {
  constructor(scene, n) {
    this.scene = scene;
    this.n = n;
    this.g = scene.add.graphics();
    this.t = 0;
    this.state = 'juggle';
    this.run = 8 + Math.random() * 6;
    this.cols = [0xe0405a, 0xf4d35e, 0x3f86c0];
    n.s.setTexture(`${n.prefix}_down`).setFlipX(false);
  }

  update(dt) {
    const { n, scene } = this;
    const { x, y } = n.home;
    this.t += dt;
    const g = this.g.clear().setDepth(y + 1);
    if (this.state === 'juggle') {
      // a three-ball cascade: each ball goes up from one hand and comes down in the other
      for (let i = 0; i < 3; i++) {
        const p = (this.t * 1.4 + i / 3) % 1;
        const side = Math.floor(this.t * 1.4 + i / 3) % 2 ? 1 : -1;
        const bx = x + side * (-7 + p * 14);
        const by = y - 15 - Math.sin(p * Math.PI) * 26;
        g.fillStyle(0x1d1714, 1).fillRect(bx - 2, by - 2, 4, 4);
        g.fillStyle(this.cols[i], 1).fillRect(bx - 1, by - 1, 2, 2);
      }
      n.s.setTexture(Math.floor(this.t * 2.8) % 2 ? `${n.prefix}_down_1` : `${n.prefix}_down`).setOrigin(0.5, 1);
      if (this.t > this.run) {
        // one gets away
        this.state = 'drop';
        this.t = 0;
        popEmote(scene, n, pickOf(['sweat', 'bang', 'confused']));
      }
    } else if (this.state === 'drop') {
      // the balls bounce on the grass, then the bow
      this.cols.forEach((c, i) => {
        const bx = x - 10 + i * 10 + this.t * (i - 1) * 6;
        const by = y - Math.abs(Math.sin(this.t * 5 + i)) * 8 * Math.max(0, 1 - this.t / 1.5);
        g.fillStyle(0x1d1714, 1).fillRect(bx - 2, by - 4, 4, 4);
        g.fillStyle(c, 1).fillRect(bx - 1, by - 3, 2, 2);
      });
      n.s.setTexture(`${n.prefix}_down`);
      if (this.t > 2.4) {
        this.state = 'juggle';
        this.t = 0;
        this.run = 8 + Math.random() * 8;
        if (near(scene, x, y, 120)) popEmote(scene, n, 'star');
      }
    }
  }
}

// ---------- someone feeding the birds ----------
export class BirdFeeder {
  constructor(scene, n, dir) {
    this.scene = scene;
    this.n = n;
    this.dir = dir;
    const key = (f) =>
      bake(scene, `vig_bird_${f}`, 8, 7, (px, py) => {
        const body = [
          '..OOO...',
          '.ObbbO..',
          'OkbbbbOy',
          'ObbwwbO.',
          '.OwwwO..',
          '..O.O...',
          f ? '..O.O...' : '.O...O..',
        ][py];
        const c = body[px];
        return { O: OUT, b: '#8a6a4a', w: '#d8c4a0', k: '#1d1714', y: '#e8a030' }[c] || null;
      });
    this.keys = [key(0), key(1)];
    const { x, y } = n.home;
    this.cx = x + dir * 26;
    this.cy = y + 4;
    this.crumbs = scene.add.graphics().setDepth(1.6);
    this.birds = [0, 1, 2].map((i) => ({ s: scene.add.image(this.cx, this.cy, this.keys[0]).setOrigin(0.5, 1), x: this.cx + (i - 1) * 9, y: this.cy + (i % 2) * 4, state: 'peck', t: Math.random(), hx: this.cx + (i - 1) * 9, hy: this.cy + (i % 2) * 4 }));
    this.toss = 1;
    this.away = 0;
    n.s.setTexture(`${n.prefix}_side`).setFlipX(dir < 0);
  }

  update(dt) {
    const { n, scene } = this;
    const { x, y } = n.home;
    this.toss -= dt;
    if (this.toss <= 0) {
      // a pinch of crumbs, scattered in front
      this.toss = 2.2 + Math.random() * 2;
      n.s.setTexture(`${n.prefix}_side_1`).setFlipX(this.dir < 0);
      scene.time.delayedCall(250, () => n.s.active && !n.talking && n.s.setTexture(`${n.prefix}_side`).setFlipX(this.dir < 0));
      const g = this.crumbs.clear().fillStyle(0xe8d2a0, 1);
      for (let i = 0; i < 9; i++) g.fillRect(this.cx - 14 + Math.random() * 28, this.cy - 4 + Math.random() * 10, 1, 1);
    }
    // walk up close and they all fly off; they come back once you've gone
    const scared = near(scene, this.cx, this.cy, 34);
    this.birds.forEach((b, i) => {
      b.t += dt;
      if (scared && b.state !== 'fly') {
        b.state = 'fly';
        b.vx = (i - 1) * 20 + (Math.random() - 0.5) * 20;
      }
      if (b.state === 'fly') {
        b.x += b.vx * dt;
        b.y -= 55 * dt;
        b.s.setTexture(this.keys[Math.floor(b.t * 12) % 2]).setAlpha(Math.max(0, b.s.alpha - dt * 0.6));
        if (b.s.alpha <= 0 && !scared) {
          b.state = 'peck';
          b.x = b.hx;
          b.y = b.hy;
          b.s.setAlpha(1);
        }
      } else {
        // hop about and peck
        const hop = Math.floor(b.t * 1.6 + i) % 3 === 0;
        b.s.setTexture(this.keys[hop ? 1 : 0]).setFlipX(Math.sin(b.t * 0.7 + i * 2) < 0);
        b.s.setAngle(Math.sin(b.t * 9) > 0.6 ? (b.s.flipX ? -25 : 25) : 0);
        b.x = b.hx + Math.sin(b.t * 0.5 + i) * 5;
      }
      b.s.setPosition(Math.round(b.x), Math.round(b.y - (b.state === 'peck' && Math.floor(b.t * 1.6 + i) % 3 === 0 ? 1 : 0))).setDepth(b.state === 'fly' ? 4985 : b.y);
    });
  }
}

// ---------- a kid skipping rope ----------
export class SkipRope {
  constructor(scene, n) {
    this.scene = scene;
    this.n = n;
    this.t = 0;
    this.count = 0;
    this.state = 'skip';
    this.back = scene.add.graphics();
    this.front = scene.add.graphics();
    n.s.setTexture(`${n.prefix}_down`).setFlipX(false);
  }

  update(dt) {
    const { n, scene } = this;
    const { x, y } = n.home;
    this.t += dt;
    this.back.clear().setDepth(y - 1);
    this.front.clear().setDepth(y + 1);
    if (this.state === 'rest') {
      n.s.setPosition(x, y).setTexture(`${n.prefix}_down`);
      this.front.lineStyle(1, 0xe0405a, 1).lineBetween(x - 7, y - 13, x - 9, y).lineBetween(x + 7, y - 13, x + 9, y);
      if (this.t > 2.2) {
        this.state = 'skip';
        this.t = 0;
        this.count = 0;
      }
      return;
    }
    const a = this.t * 7; // one turn of the rope per jump
    const jump = Math.max(0, Math.sin(a - Math.PI / 2 + Math.PI)) * 5; // up as the rope passes under
    n.s.setPosition(x, y - jump);
    const ry = y - 14 + Math.cos(a) * 18; // the middle of the rope: over the head and down under the feet
    const g = Math.cos(a) > 0 ? this.front : this.back; // in front on the way down, behind on the way over
    g.lineStyle(1, 0xe0405a, 1);
    new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x - 7, y - 13 - jump), new Phaser.Math.Vector2(x, ry), new Phaser.Math.Vector2(x + 7, y - 13 - jump)).draw(g, 10);
    const turns = Math.floor(a / TAU);
    if (turns > this.count) {
      this.count = turns;
      if (this.count === 12 + (x % 6)) {
        // tripped
        this.state = 'rest';
        this.t = 0;
        popEmote(scene, n, pickOf(['sweat', 'confused', 'smile']));
      }
    }
  }
}

// ---------- two kids playing catch ----------
export class Catch {
  constructor(scene, a, b) {
    this.scene = scene;
    this.ppl = [a, b];
    this.ball = scene.add.graphics();
    this.from = 0;
    this.t = 0;
    this.hold = 0.8;
    this.frame = -1;
    a.s.setTexture(`${a.prefix}_side`).setFlipX(false);
    b.s.setTexture(`${b.prefix}_side`).setFlipX(true);
  }

  update(dt) {
    if (!once(this, this.scene)) return;
    const [a, b] = this.ppl;
    const p = this.from ? b : a;
    const q = this.from ? a : b;
    // they face each other (unless one of them is talking to you)
    if (!a.talking) a.s.setTexture(`${a.prefix}_side`).setFlipX(false);
    if (!b.talking) b.s.setTexture(`${b.prefix}_side`).setFlipX(true);
    const g = this.ball.clear();
    let bx;
    let by;
    if (this.hold > 0) {
      this.hold -= dt;
      bx = p.home.x + (this.from ? -6 : 6);
      by = p.home.y - 14;
    } else {
      this.t += dt / 1.1;
      const k = Math.min(1, this.t);
      bx = Phaser.Math.Linear(p.home.x + (this.from ? -6 : 6), q.home.x + (this.from ? 6 : -6), k);
      by = Phaser.Math.Linear(p.home.y, q.home.y, k) - 14 - Math.sin(k * Math.PI) * 30;
      if (k >= 1) {
        this.from = 1 - this.from;
        this.t = 0;
        this.hold = 0.6 + Math.random() * 0.8;
        if (Math.random() < 0.18 && !q.talking) popEmote(this.scene, q, pickOf(['star', 'smile', 'bang']));
      }
    }
    g.setDepth(Math.max(a.home.y, b.home.y) + 2);
    g.fillStyle(0x1d1714, 1).fillRect(bx - 2, by - 2, 5, 5);
    g.fillStyle(0xf2f2f2, 1).fillRect(bx - 1, by - 1, 3, 3);
    g.fillStyle(0xe0405a, 1).fillRect(bx, by - 1, 1, 3);
  }
}

// ---------- a kid chasing a butterfly ----------
export class Butterfly {
  constructor(scene, n, R) {
    this.scene = scene;
    this.n = n;
    this.R = R;
    this.t = Math.random() * 10;
    const col = pickOf(['#f4d35e', '#a98be0', '#f08ab8', '#7ec8f0']);
    const wing = (open) =>
      bake(scene, `vig_fly_${col}_${open}`, 7, 5, (px, py) => {
        if (px === 3) return py > 0 ? OUT : null;
        if (!open) return (px === 2 || px === 4) && py < 4 ? col : null;
        return py < 4 && !(py === 3 && (px === 0 || px === 6)) ? col : null;
      });
    this.keys = [wing(1), wing(0)];
    this.fly = scene.add.image(n.home.x, n.home.y - 20, this.keys[0]).setDepth(4985);
    this.rest = 0;
  }

  update(dt) {
    const { n, scene } = this;
    const s = n.s;
    const { x, y } = n.home;
    this.t += dt;
    // the butterfly loops about the lawn
    const fx = x + Math.sin(this.t * 0.7) * this.R + Math.sin(this.t * 2.3) * 6;
    const fy = y - 6 + Math.sin(this.t * 1.1) * this.R * 0.6 - 16 + Math.sin(this.t * 5) * 3;
    this.fly.setPosition(Math.round(fx), Math.round(fy)).setTexture(this.keys[Math.floor(this.t * 10) % 2]);
    if (this.rest > 0) {
      this.rest -= dt;
      animateWalker(scene, s, false, dt);
      s.setTexture(`${n.prefix}_up`);
      return;
    }
    // the kid runs after it (a step behind, and never quite there)
    const tx = fx;
    const ty = fy + 22;
    const dx = tx - s.x;
    const dy = ty - s.y;
    const d = Math.hypot(dx, dy);
    if (d > 14) {
      const step = Math.min(d - 14, 46 * dt);
      const nx = s.x + (dx / d) * step;
      const ny = s.y + (dy / d) * step;
      if (scene.free(nx, ny)) s.setPosition(nx, ny);
      if (Math.abs(dx) > Math.abs(dy)) s.setTexture(`${n.prefix}_side`).setFlipX(dx < 0);
      else s.setTexture(dy < 0 ? `${n.prefix}_up` : `${n.prefix}_down`).setFlipX(false);
      animateWalker(scene, s, true, dt, 1.8);
    } else animateWalker(scene, s, false, dt);
    if (Math.random() < dt / 9) {
      // stops to stare, delighted
      this.rest = 1.6;
      popEmote(scene, n, pickOf(['heart', 'sparkle', 'star']));
    }
    s.setDepth(s.y);
  }
}

// ---------- someone playing guitar ----------
export class Guitarist {
  constructor(scene, n) {
    this.scene = scene;
    this.n = n;
    this.t = 0;
    this.note = 1.2;
    const { x, y } = n.home;
    n.s.setTexture(`${n.prefix}_sit`).setFlipX(false).setPosition(x, y).setDepth(y);
    this.g = scene.add.graphics().setDepth(y + 1);
    // an open hat on the grass, with a coin or two in it
    scene.add.graphics().setDepth(y - 1).fillStyle(0x1d1714, 1).fillEllipse(x + 18, y - 1, 12, 5).fillStyle(0x3a2a22, 1).fillEllipse(x + 18, y - 1, 10, 3).fillStyle(0xf4d35e, 1).fillRect(x + 16, y - 2, 2, 1).fillRect(x + 19, y - 1, 1, 1);
  }

  update(dt) {
    const { n, scene } = this;
    const { x, y } = n.home;
    this.t += dt;
    const g = this.g.clear();
    // the guitar across the lap, and a strumming hand
    g.fillStyle(0x1d1714, 1).fillEllipse(x - 3, y - 10, 11, 8);
    g.fillStyle(0xc08a58, 1).fillEllipse(x - 3, y - 10, 9, 6);
    g.fillStyle(0x1d1714, 1).fillRect(x - 4, y - 11, 2, 2);
    g.lineStyle(2, 0x6b4428, 1).lineBetween(x + 1, y - 12, x + 11, y - 17);
    const strum = Math.sin(this.t * 10) * 2;
    g.fillStyle(0xf0c8a4, 1).fillRect(x - 3, y - 12 + strum, 2, 2);
    n.s.setPosition(x, y + (Math.sin(this.t * 3.4) > 0.6 ? 0.6 : 0)); // tapping along
    this.note -= dt;
    if (this.note <= 0) {
      this.note = 1.4 + Math.random() * 1.4;
      if (!n.talking) popEmote(scene, n, Math.random() < 0.85 ? 'note' : 'heart', { lift: 6 });
    }
  }
}

// ---------- a kid building a snowman ----------
export class Snowman {
  constructor(scene, n, dir) {
    this.scene = scene;
    this.n = n;
    this.dir = dir;
    this.mx = n.home.x + dir * 18;
    this.my = n.home.y;
    this.g = scene.add.graphics().setDepth(this.my);
    this.t = 0;
    this.stage = 0; // 0 base, 1 middle, 2 head, 3 face, 4 admire
    n.s.setTexture(`${n.prefix}_side`).setFlipX(dir < 0);
  }

  update(dt) {
    const { n, scene } = this;
    this.t += dt;
    const { mx, my } = this;
    const g = this.g.clear();
    const ball = (cy, r) => {
      g.fillStyle(0x1d1714, 1).fillCircle(mx, cy, r + 1);
      g.fillStyle(0xf8fbff, 1).fillCircle(mx, cy, r);
      g.fillStyle(0xd6e6f6, 1).fillCircle(mx + 1, cy + 1, r * 0.6);
      g.fillStyle(0xf8fbff, 1).fillCircle(mx - 1, cy - 1, r * 0.6);
    };
    const grow = (k) => Math.min(1, this.t / 3) * k;
    const sizes = [7, 5, 4];
    const ys = [my - 7, my - 17, my - 25];
    for (let i = 0; i < 3; i++) {
      if (i < this.stage) ball(ys[i], sizes[i]);
      else if (i === this.stage) ball(ys[i], Math.max(1, grow(sizes[i])));
    }
    if (this.stage >= 3) {
      g.fillStyle(0x1d1714, 1).fillRect(mx - 2, my - 27, 1, 1).fillRect(mx + 1, my - 27, 1, 1).fillRect(mx - 1, my - 17, 1, 1).fillRect(mx - 1, my - 14, 1, 1);
      g.fillStyle(0xe8702a, 1).fillRect(mx + (this.dir < 0 ? -3 : 0), my - 25, 3, 1);
      g.lineStyle(1, 0x6b4428, 1).lineBetween(mx - 5, my - 17, mx - 10, my - 21).lineBetween(mx + 5, my - 17, mx + 10, my - 21);
    }
    // patting the snow into shape, then a step back to look
    if (this.stage < 4) n.s.setTexture(Math.floor(this.t * 3) % 2 ? `${n.prefix}_side_1` : `${n.prefix}_side`).setFlipX(this.dir < 0);
    if (this.stage < 3 && this.t > 3.4) {
      this.stage += 1;
      this.t = 0;
    } else if (this.stage === 3 && this.t > 1.2) {
      this.stage = 4;
      this.t = 0;
      n.s.setTexture(`${n.prefix}_down`).setFlipX(false);
      if (!n.talking) popEmote(scene, n, pickOf(['sparkle', 'heart', 'star']));
    } else if (this.stage === 4 && this.t > 9) {
      // it melts (or gets knocked over); start another
      this.stage = 0;
      this.t = 0;
    }
  }
}
