// More little scenes for the home islands (see vignettes.js for the idea and the first four):
// someone reading on a bench, a dog chasing its tail, someone dozing off under a tree, a jogger
// running laps. Each is a class with `update(dt)`, driven from the person it belongs to.
import { popEmote } from './emotes.js';
import { animateWalker } from './motion.js';
import { sfx } from './music.js';

const TAU = Math.PI * 2;
const pickOf = (a) => a[Math.floor(Math.random() * a.length)];

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

const OUT = '#1d1714';
const WOOD = '#9a6a42';
const WOOD_L = '#c08a58';
const WOOD_D = '#6b4428';

// A park bench in two halves: the back (and the far legs) behind the sitter, the seat's front edge over their knees.
function benchTextures(scene) {
  const W = 36;
  const back = bake(scene, 'vig_bench_back', W, 22, (x, y) => {
    if (y < 8 && x > 0 && x < W - 1) return y === 0 || y === 7 ? OUT : y === 1 ? WOOD_L : y % 3 === 0 ? WOOD_D : WOOD; // the backrest
    if (y >= 8 && y < 20 && (x === 3 || x === 4 || x === W - 5 || x === W - 4)) return OUT; // posts
    if (y >= 16 && y < 19 && x > 0 && x < W - 1) return y === 16 ? WOOD_L : WOOD; // the seat, seen from the back
    return null;
  });
  const front = bake(scene, 'vig_bench_front', W, 10, (x, y) => {
    if (y < 4 && x > 0 && x < W - 1) return y === 0 || y === 3 ? OUT : y === 1 ? WOOD_L : WOOD; // the seat's front edge
    if (y >= 4 && (x === 3 || x === 4 || x === W - 5 || x === W - 4)) return y === 9 ? null : OUT; // front legs
    return null;
  });
  return [back, front];
}

// ---------- someone reading on a bench ----------
export class Reader {
  constructor(scene, n) {
    this.scene = scene;
    this.n = n;
    this.t = Math.random() * 5;
    const { x, y } = n.home;
    const [kb, kf] = benchTextures(scene);
    this.back = scene.add.image(x, y + 1, kb).setOrigin(0.5, 1).setDepth(y - 0.5);
    this.front = scene.add.image(x, y + 1, kf).setOrigin(0.5, 1).setDepth(y + 2.5);
    n.s.setTexture(`${n.prefix}_sit`).setFlipX(false).setPosition(x, y - 2);
    n.s.setDepth(y + 1);
    this.book = scene.add.graphics().setDepth(y + 2);
    this.turn = 4 + Math.random() * 3;
    this.mood = 8 + Math.random() * 6;
    this.flip = 0;
  }

  update(dt) {
    const { n } = this;
    const { x, y } = n.home;
    this.t += dt;
    this.turn -= dt;
    this.mood -= dt;
    if (this.turn <= 0) {
      this.turn = 4 + Math.random() * 4;
      this.flip = 0.28;
      sfx('tap');
    }
    if (this.mood <= 0) {
      this.mood = 9 + Math.random() * 8;
      popEmote(this.scene, n, pickOf(['smile', 'q', 'note', 'dots', 'sparkle']));
    }
    if (this.flip > 0) this.flip -= dt;
    // the book, open in the hands; a page lifts across when it's turned
    const g = this.book.clear();
    const bx = x - 5;
    const by = y - 12;
    g.fillStyle(0x1d1714, 1).fillRect(bx, by, 11, 6);
    g.fillStyle(0xf4ecd8, 1).fillRect(bx + 1, by + 1, 4, 4).fillRect(bx + 6, by + 1, 4, 4);
    if (this.flip > 0) {
      const k = 1 - this.flip / 0.28;
      g.fillStyle(0xe6dcc0, 1).fillRect(bx + 5 - Math.sin(k * Math.PI) * 4, by - 1, 2 + Math.sin(k * Math.PI) * 4, 6);
    }
    // a slow nod of the head over the page
    n.s.setPosition(x, y - 2 + Math.max(0, Math.sin(this.t * 0.8)) * 0.8);
  }
}

// ---------- a dog chasing its own tail ----------
export class TailDog {
  constructor(scene, n) {
    this.scene = scene;
    this.n = n;
    this.state = 'sit';
    this.t = 0;
    this.wait = 3 + Math.random() * 5;
    n.s.setTexture(`${n.prefix}_down`);
  }

  update(dt) {
    const { n, scene } = this;
    const s = n.s;
    const { x, y } = n.home;
    this.t += dt;
    if (this.state === 'sit') {
      s.setTexture(`${n.prefix}_down`).setFlipX(false).setAngle(0).setPosition(x, y);
      // a wag
      if (Math.sin(this.t * 9) > 0.7) s.setTexture(`${n.prefix}_down_1`);
      if (this.t > this.wait) {
        this.state = 'chase';
        this.t = 0;
        sfx('woof');
        popEmote(scene, n, 'bang', { lift: 2 });
      }
    } else if (this.state === 'chase') {
      // round and round in place: side, front, the other side, back
      const k = Math.floor(this.t * 6.5) % 4;
      const view = ['side', 'down', 'side', 'up'][k];
      s.setTexture(`${n.prefix}_${view}${Math.floor(this.t * 13) % 2 ? '_1' : ''}`).setFlipX(k === 2);
      const a = this.t * 6.5 * (TAU / 4);
      s.setPosition(x + Math.cos(a) * 3, y + Math.sin(a) * 1.5 - Math.abs(Math.sin(this.t * 13)) * 1.5);
      if (this.t > 3.6) {
        this.state = 'dizzy';
        this.t = 0;
        popEmote(scene, n, 'confused', { lift: 2 });
      }
    } else {
      // dizzy: sits down and sways
      s.setTexture(`${n.prefix}_down`).setFlipX(false).setPosition(x, y).setAngle(Math.sin(this.t * 7) * 7 * Math.max(0, 1 - this.t / 2.2));
      if (this.t > 2.4) {
        this.state = 'sit';
        this.t = 0;
        this.wait = 6 + Math.random() * 8;
        s.setAngle(0);
      }
    }
    s.setDepth(s.y);
  }
}

// ---------- someone dozing off against a tree ----------
export class Dozer {
  constructor(scene, n) {
    this.scene = scene;
    this.n = n;
    this.state = 'asleep';
    this.t = 0;
    this.zzz = 2;
    const { x, y } = n.home;
    n.s.setTexture(`${n.prefix}_sit`).setFlipX(false).setPosition(x, y).setDepth(y);
  }

  update(dt) {
    const { n, scene } = this;
    const s = n.s;
    const { x, y } = n.home;
    const p = scene.player;
    this.t += dt;
    const near = Math.hypot(p.x - x, p.y - y) < 36;
    if (this.state === 'asleep') {
      // the head droops and rises with each breath
      s.setAngle(Math.sin(this.t * 1.1) * 3.5 + 2).setPosition(x, y + Math.max(0, Math.sin(this.t * 1.1)) * 0.6);
      this.zzz -= dt;
      if (this.zzz <= 0) {
        this.zzz = 3.2;
        popEmote(scene, n, 'zzz', { lift: 6 });
      }
      if (near || this.t > 16 + (n.home.x % 7)) this.wake(near);
    } else {
      s.setAngle(0);
      if (this.t > 3.2 && !near) {
        this.state = 'asleep';
        this.t = 0;
        this.zzz = 1.5;
      }
    }
    s.setDepth(y);
  }

  // jerks awake (someone came by, or a snore woke them), embarrassed
  wake(byPlayer) {
    this.state = 'awake';
    this.t = 0;
    const { n, scene } = this;
    popEmote(scene, n, 'bang', { lift: 6 });
    scene.tweens.add({ targets: n.s, scaleY: n.s.scaleY * 1.06, duration: 120, yoyo: true });
    if (byPlayer) scene.faceNpc(n, scene.player.x, scene.player.y);
    scene.time.delayedCall(900, () => n.s.active && popEmote(scene, n, 'sweat', { lift: 6 }));
    n.s.setTexture(`${n.prefix}_down`).setFlipX(false);
  }
}

// ---------- a jogger running laps ----------
export class Jogger {
  constructor(scene, n, rect) {
    this.scene = scene;
    this.n = n;
    this.pts = [
      { x: rect.x0, y: rect.y0 },
      { x: rect.x1, y: rect.y0 },
      { x: rect.x1, y: rect.y1 },
      { x: rect.x0, y: rect.y1 },
    ];
    this.i = 0;
    this.dir = 1;
    this.laps = 0;
    this.state = 'run';
    this.t = 0;
    n.s.setPosition(this.pts[0].x, this.pts[0].y);
  }

  update(dt) {
    const { n, scene } = this;
    const s = n.s;
    if (this.state === 'rest') {
      this.t += dt;
      animateWalker(scene, s, false, dt);
      s.setTexture(`${n.prefix}_down`).setFlipX(false);
      if (this.t > 3) {
        this.state = 'run';
        this.laps = 0;
        this.dir = -this.dir; // back the other way
        this.i = (this.i + this.pts.length + this.dir) % this.pts.length;
      }
      return;
    }
    const to = this.pts[this.i];
    const dx = to.x - s.x;
    const dy = to.y - s.y;
    const d = Math.hypot(dx, dy);
    const step = 62 * dt;
    if (d <= step) {
      s.setPosition(to.x, to.y);
      this.i = (this.i + this.pts.length + this.dir) % this.pts.length;
      if ((this.i === 0 && this.dir === 1) || (this.i === 3 && this.dir === -1)) this.laps += 1;
      if (this.laps >= 2) {
        this.state = 'rest';
        this.t = 0;
        popEmote(scene, n, 'sweat');
      }
    } else s.setPosition(s.x + (dx / d) * step, s.y + (dy / d) * step);
    if (Math.abs(dx) > Math.abs(dy)) s.setTexture(`${n.prefix}_side`).setFlipX(dx < 0);
    else s.setTexture(dy < 0 ? `${n.prefix}_up` : `${n.prefix}_down`).setFlipX(false);
    if (animateWalker(scene, s, true, dt, 2.2) && scene.snowAt(s.x, s.y - 2)) scene.prints.step(s.x, s.y - 2, dx, dy, (n.leftFoot = !n.leftFoot), 'snow');
    s.setDepth(s.y);
  }
}
