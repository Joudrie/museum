// Little scenes that make an island feel lived in, the way a Pokémon town does: one person
// doing one thing, over and over, with a rhythm and a break now and then. A groundskeeper
// raking leaves into a pile (or shovelling snow, watering flowers, sweeping sand, by the
// season), kids chasing each other in a circle, a painter at an easel, a kid flying a kite.
// They don't wander and have no schedule. You can talk to them like anyone else.
//
// Each one is a person added to the scene's `islanders` with a `script`; the scene calls
// `script.update(dt)` while they're on screen (see IslandScene.moveIslanders).
import Phaser from 'phaser';
import { makeCharacter } from './art.js';
import { visitorLook } from './RoomScene.js';
import { popEmote } from './emotes.js';
import { animateWalker, dust } from './motion.js';
import { sfx } from './music.js';
import { T } from './tiles.js';

const TAU = Math.PI * 2;
const pickOf = (a, r) => a[Math.floor(r * a.length) % a.length];

// a small seeded random, so the same island lays out the same each day
const seeded = (seed) => {
  let k = 0;
  return () => {
    const v = Math.sin((seed + ++k) * 12.9898 + k * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
};

// ---------- pictures ----------
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

// A heap on the ground: a half-oval of flecks.
function pile(scene, key, colors, dark) {
  const w = 28;
  const h = 15;
  const r = seeded(key.length * 31);
  return bake(scene, key, w, h, (x, y) => {
    const nx = (x + 0.5 - w / 2) / (w / 2);
    const ny = (y + 0.5 - h) / h;
    const inside = (a, b) => a * a + b * b <= 1;
    if (!inside(nx, ny)) return null;
    const edge = !inside(nx + 2 / w, ny) || !inside(nx - 2 / w, ny) || !inside(nx, ny - 1.4 / h);
    return edge ? dark : colors[Math.floor(r() * colors.length)];
  });
}

// A strip of flowers in soil, for watering.
function bed(scene) {
  const cols = ['#f08ab8', '#f4d35e', '#ffffff', '#e0405a', '#a98be0'];
  const r = seeded(77);
  return bake(scene, 'vig_bed', 30, 12, (x, y) => {
    if (y > 2 && x > 0 && x < 29 && y < 11) {
      if (y >= 7 && r() < 0.18) return '#3f8f3f';
      return y > 8 ? '#4a2f22' : '#6b4428';
    }
    return null;
  });
}

// ---------- people ----------
const WORK = '#4f7a3a';

function makePerson(scene, id, kind, seed, tweak = {}) {
  const r = seeded(seed);
  const { colors, look, scale } = visitorLook(kind, () => r());
  Object.assign(colors, tweak.colors);
  Object.assign(look, tweak.look);
  const prefix = `vig_${id}`;
  if (!scene.textures.exists(`${prefix}_down`)) makeCharacter(scene, prefix, colors, look);
  return { prefix, scale: tweak.scale || scale };
}

function addPerson(scene, spec) {
  const { x, y, kind, name, label, id, seed } = spec;
  const { prefix, scale } = makePerson(scene, id, kind, seed, spec);
  const s = scene.add.sprite(x, y, `${prefix}_down`).setOrigin(0.5, 1).setScale(scale).setDepth(y);
  const n = { s, prefix, kind, name, label, home: { x, y }, range: 0, wait: 0, target: null, vignette: id };
  n.opener = () => pickOf(spec.lines, Math.random());
  scene.islanders.push(n);
  return n;
}

const face = (scene, n, tx, ty) => scene.faceNpc(n, tx, ty);

// ---------- the groundskeeper: a chore for each season ----------
const JOBS = {
  autumn: { tool: 'rake', pile: ['#e8702a', '#c84a2a', '#f2a03a', '#a8642a', '#d4862a'], dark: '#6b3a1a', verb: 'raking', lines: ['These leaves come down faster than I can rake them.', 'I think the trees do it on purpose.', 'The pile’s getting big. Jump in, if you like!', 'Autumn: half beauty, half raking.'] },
  winter: { tool: 'shovel', pile: ['#ffffff', '#eef6ff', '#d6e6f6', '#c4d8ee'], dark: '#7a96b8', verb: 'shovelling', lines: ['Snow again. Third time this morning.', 'Dig out the path, and in an hour it’s gone again.', 'Nice footprints you’re leaving, though.', 'Hot tea is the whole secret to winter.'] },
  spring: { tool: 'can', verb: 'watering', lines: ['Water them every day and they’ll show off all summer.', 'The pink ones are the thirstiest.', 'Spring! Everything’s trying to grow at once.', 'A flower never says thank you, but you can tell.'] },
  summer: { tool: 'broom', pile: ['#e2c68a', '#d6b87a', '#caa86a', '#efd9a0'], dark: '#8a6a3c', verb: 'sweeping', lines: ['Sand gets everywhere. Everywhere.', 'I sweep it up, the tide brings it back.', 'Hot one today, isn’t it?', 'It’s a never-ending job. I love it.'] },
};

class Keeper {
  constructor(scene, n, job, dir) {
    this.scene = scene;
    this.n = n;
    this.job = job;
    this.dir = dir;
    this.t = 0;
    this.state = 'work';
    this.left = 4 + Math.floor(Math.random() * 3); // strokes before a break
    this.phase = 0;
    this.g = scene.add.graphics();
    const { x, y } = n.home;
    this.px = x + dir * 30;
    if (job.tool === 'can') {
      this.heap = scene.add.image(this.px, y + 3, bed(scene)).setOrigin(0.5, 1).setDepth(y - 1);
    } else {
      this.heap = scene.add.image(this.px, y + 3, pile(scene, `vig_pile_${job.tool}`, job.pile, job.dark)).setOrigin(0.5, 1).setDepth(y - 1);
      this.heap.setScale(0.85);
    }
    this.size = 0;
    this.scoop = null;
    face(scene, n, this.px, y);
    n.s.setTexture(`${n.prefix}_side`).setFlipX(dir < 0);
  }

  // what a leaf, a clump of snow or a puff of sand does: hop onto the pile
  fling(color, fromX, fromY) {
    const sc = this.scene;
    const { y } = this.n.home;
    const p = sc.add.rectangle(fromX, fromY, 2, 2, Phaser.Display.Color.HexStringToColor(color).color).setDepth(y + 2);
    sc.tweens.add({ targets: p, x: this.px + (Math.random() - 0.5) * 10, y: y - 6 - Math.random() * 4, duration: 320, ease: 'Quad.easeOut', onComplete: () => p.destroy() });
    sc.tweens.add({ targets: p, y: { from: fromY - 7, to: y - 4 }, duration: 320, ease: 'Sine.easeIn' });
  }

  update(dt) {
    const { n, dir, job } = this;
    const sc = this.scene;
    const { x, y } = n.home;
    this.t += dt;
    const g = this.g;
    g.clear().setDepth(y + 1);
    if (this.state === 'work') {
      const rate = job.tool === 'can' ? 0.5 : 1.15;
      const before = this.phase;
      this.phase += dt * rate;
      const u = (1 - Math.cos(this.phase * TAU)) / 2; // 0..1..0 across a stroke
      n.s.setTexture(u > 0.5 ? `${n.prefix}_side_1` : `${n.prefix}_side`).setFlipX(dir < 0);
      n.s.x = x + dir * u * 1.4;
      this.drawTool(g, u);
      if (Math.floor(this.phase) > Math.floor(before)) this.strokeDone();
      if (job.tool === 'can') this.pour(dt, u);
    } else if (this.state === 'rest') {
      this.restT -= dt;
      n.s.x = x;
      n.s.setTexture(`${n.prefix}_down`).setFlipX(false);
      this.drawTool(g, 0, true);
      if (this.restT <= 0) {
        this.state = 'work';
        this.left = 4 + Math.floor(Math.random() * 4);
        face(sc, n, this.px, y);
        n.s.setTexture(`${n.prefix}_side`).setFlipX(dir < 0);
      }
    }
    n.s.setDepth(n.s.y);
  }

  strokeDone() {
    const { n, dir, job } = this;
    const { x, y } = n.home;
    if (job.tool !== 'can') {
      const hx = x + dir * 24;
      for (let i = 0; i < 2; i++) this.fling(pickOf(job.pile, Math.random()), hx, y - 2);
      sfx('scrape');
      if (this.size < 1) {
        this.size += 0.05;
        this.heap.setScale(0.85 + this.size * 0.4);
      }
      if (job.tool === 'broom') dust(this.scene, x + dir * 20, y, 0xe8d9b0);
    }
    if (--this.left <= 0) this.rest();
  }

  // a break: lean on the tool, wipe the brow, look around
  rest() {
    this.state = 'rest';
    this.restT = 2.6 + Math.random() * 1.5;
    const em = this.job.tool === 'shovel' ? 'snow' : this.job.tool === 'can' ? 'smile' : this.job.tool === 'rake' ? 'sweat' : 'sweat';
    popEmote(this.scene, this.n, em);
    // now and then a gust takes the pile apart, and it starts again
    if (this.size > 0.5 && this.job.tool !== 'can' && Math.random() < 0.6) {
      const { y } = this.n.home;
      for (let i = 0; i < 8; i++) this.fling(pickOf(this.job.pile, Math.random()), this.px, y - 6);
      this.size = 0;
      this.heap.setScale(0.85);
      this.scene.time.delayedCall(900, () => this.n.s.active && popEmote(this.scene, this.n, 'dots'));
    }
  }

  // a stream of drops from the can onto the flowers
  pour(dt, u) {
    this.pourT = (this.pourT || 0) - dt;
    if (this.pourT > 0 || u < 0.3) return;
    this.pourT = 0.07;
    const sc = this.scene;
    const { x, y } = this.n.home;
    const sx = x + this.dir * 14;
    const d = sc.add.rectangle(sx, y - 15, 1, 2, 0x8fd0ff).setDepth(y + 2);
    sc.tweens.add({ targets: d, x: this.px + (Math.random() - 0.5) * 22, y: y - 2, duration: 340, ease: 'Quad.easeIn', onComplete: () => d.destroy() });
  }

  drawTool(g, u, rest = false) {
    const { x, y } = this.n.home;
    const dir = this.dir;
    const { tool } = this.job;
    const hand = rest ? { x: x + dir * 5, y: y - 14 } : { x: x + dir * (5 + 3 * u), y: y - 13 };
    if (tool === 'can') {
      const tilt = rest ? 0 : u;
      // the can, held out and tipped
      g.fillStyle(0x1d1714, 1).fillRect(hand.x + dir * 3 - 4, hand.y - 4 + tilt * 2, 9, 7);
      g.fillStyle(0x7a9ab8, 1).fillRect(hand.x + dir * 3 - 3, hand.y - 3 + tilt * 2, 7, 5);
      g.lineStyle(2, 0x1d1714, 1).lineBetween(hand.x + dir * 7, hand.y - 1 + tilt * 2, hand.x + dir * 14, hand.y + 3 + tilt * 4);
      return;
    }
    const head = rest ? { x: x + dir * 7, y: y - 1 } : tool === 'shovel' ? { x: x + dir * (9 + 15 * u), y: y - 1 - Math.sin(u * Math.PI) * 11 } : { x: x + dir * (10 + 16 * u), y: y - 1 };
    g.lineStyle(3, 0x1d1714, 1).lineBetween(hand.x, hand.y, head.x, head.y);
    g.lineStyle(1.5, 0xb88a56, 1).lineBetween(hand.x, hand.y, head.x, head.y);
    if (tool === 'rake') {
      g.lineStyle(1, 0x1d1714, 1).lineBetween(head.x, head.y - 3, head.x, head.y + 1);
      for (let i = -2; i <= 2; i++) g.lineBetween(head.x + i * 1.5 + dir, head.y - 1, head.x + i * 1.5 + dir, head.y + 1);
    } else if (tool === 'shovel') {
      g.fillStyle(0x1d1714, 1).fillRect(head.x - 3, head.y - 2, 7, 4);
      g.fillStyle(0xa8b4c0, 1).fillRect(head.x - 2, head.y - 1, 5, 2);
    } else {
      g.fillStyle(0x1d1714, 1).fillRect(head.x - 4, head.y - 1, 8, 3);
      g.fillStyle(0xe2b858, 1).fillRect(head.x - 3, head.y, 6, 1);
    }
  }
}

// ---------- kids running in a circle ----------
// One Circle drives them all; each kid asks for their own place on it every frame (so one
// stopping to talk to you doesn't freeze the others, and leaves the rest running).
class Circle {
  constructor(scene, kids, cx, cy, R) {
    this.scene = scene;
    this.kids = kids;
    this.cx = cx;
    this.cy = cy;
    this.R = R;
    this.dir = Math.random() < 0.5 ? 1 : -1;
    this.state = 'run';
    this.t = 0;
    this.runFor = 7 + Math.random() * 6;
    this.theta = Math.random() * TAU;
    this.frame = -1;
  }

  // time moves on once a frame, however many kids ask
  advance(dt) {
    const sc = this.scene;
    const f = sc.game.getFrame();
    if (f === this.frame) return;
    this.frame = f;
    this.t += dt;
    if (this.state === 'run') {
      this.theta = (this.theta + this.dir * 1.75 * dt) % TAU;
      if (this.t > this.runFor) {
        this.state = 'stop';
        this.t = 0;
        this.kids.forEach((n, i) => sc.time.delayedCall(i * 220, () => n.s.active && !n.talking && popEmote(sc, n, ['confused', 'smile', 'star'][i % 3])));
      }
    } else if (this.t > 2.4) {
      // caught their breath: off again, the other way
      this.state = 'run';
      this.t = 0;
      this.dir = -this.dir;
      this.runFor = 7 + Math.random() * 7;
    }
  }

  update(dt, n) {
    this.advance(dt);
    const sc = this.scene;
    const s = n.s;
    if (this.state !== 'run') return void animateWalker(sc, s, false, dt);
    const a = this.theta + (this.kids.indexOf(n) * TAU) / this.kids.length;
    const vx = -Math.sin(a) * this.dir;
    const vy = Math.cos(a) * this.dir * 0.8;
    s.setPosition(this.cx + Math.cos(a) * this.R, this.cy + Math.sin(a) * this.R * 0.8);
    if (Math.abs(vx) > Math.abs(vy)) s.setTexture(`${n.prefix}_side`).setFlipX(vx < 0);
    else s.setTexture(vy < 0 ? `${n.prefix}_up` : `${n.prefix}_down`).setFlipX(false);
    if (animateWalker(sc, s, true, dt, 2.1) && sc.snowAt(s.x, s.y - 2)) sc.prints.step(s.x, s.y - 2, vx, vy, (n.leftFoot = !n.leftFoot), 'snow');
    s.setDepth(s.y);
  }
}

// ---------- a painter at an easel ----------
class Painter {
  constructor(scene, n, dir) {
    this.scene = scene;
    this.n = n;
    this.dir = dir;
    const { x, y } = n.home;
    this.ex = x + dir * 24;
    this.legs = scene.add.graphics().setDepth(y);
    this.canvas = scene.add.graphics().setDepth(y + 1);
    this.legs.lineStyle(2, 0x6b4428, 1);
    [[-8, 0], [0, 3], [8, 0]].forEach(([dx, dy]) => this.legs.lineBetween(this.ex + dx * 0.4, y - 26, this.ex + dx, y + dy));
    this.legs.fillStyle(0x1d1714, 1).fillRect(this.ex - 9, y - 31, 18, 20);
    this.legs.fillStyle(0xfff8e6, 1).fillRect(this.ex - 8, y - 30, 16, 18);
    this.brush = scene.add.graphics().setDepth(y + 2);
    this.dabs = [];
    this.t = 0;
    this.state = 'paint';
    this.dabT = 0;
    face(scene, n, this.ex, y);
    n.s.setTexture(`${n.prefix}_side`).setFlipX(dir < 0);
  }

  update(dt) {
    const { n, dir } = this;
    const sc = this.scene;
    const { x, y } = n.home;
    this.t += dt;
    this.brush.clear();
    if (this.state === 'paint') {
      const u = (1 + Math.sin(this.t * 4.5)) / 2;
      n.s.setTexture(u > 0.5 ? `${n.prefix}_side_1` : `${n.prefix}_side`).setFlipX(dir < 0);
      const hand = { x: x + dir * 5, y: y - 14 };
      const tip = { x: this.ex - dir * 2 - dir * (1 - u) * 3, y: y - 24 + Math.sin(this.t * 2.3) * 5 };
      this.brush.lineStyle(1.5, 0x1d1714, 1).lineBetween(hand.x, hand.y, tip.x, tip.y);
      this.brush.fillStyle(0xe0405a, 1).fillRect(tip.x - 1, tip.y - 1, 2, 2);
      this.dabT -= dt;
      if (this.dabT <= 0) {
        this.dabT = 0.45;
        const c = pickOf([0xe0405a, 0x3f86c0, 0xf4d35e, 0x3f8f3f, 0x8a5aa8, 0xe8702a], Math.random());
        const px = this.ex - 6 + Math.floor(Math.random() * 12);
        const py = y - 29 + Math.floor(Math.random() * 14);
        this.canvas.fillStyle(c, 1).fillRect(px, py, 3, 2);
        this.dabs.push(1);
        if (this.dabs.length === 6) popEmote(sc, n, 'q'); // squints at it
        if (this.dabs.length > 14) {
          this.state = 'admire';
          this.t = 0;
          n.s.setTexture(`${n.prefix}_down`).setFlipX(false);
          popEmote(sc, n, 'sparkle');
        }
      }
    } else if (this.t > 3.2) {
      // a fresh canvas
      this.canvas.clear();
      this.dabs = [];
      this.state = 'paint';
      this.t = 0;
      n.s.setTexture(`${n.prefix}_side`).setFlipX(dir < 0);
    }
  }
}

// ---------- a kid flying a kite ----------
class Kite {
  constructor(scene, n) {
    this.scene = scene;
    this.n = n;
    this.t = Math.random() * 6;
    const col = pickOf(['#e0405a', '#f4d35e', '#3f86c0', '#e8702a'], Math.random());
    const key = bake(scene, `vig_kite_${col}`, 13, 17, (x, y) => {
      const u = Math.abs(x - 6) / 6;
      const v = y < 7 ? 1 - (7 - y) / 7 : 1 - (y - 7) / 10;
      if (u > v) return null;
      return u > v - 0.2 || x === 6 || y === 7 ? '#1d1714' : x < 6 ? col : '#ffffff';
    });
    this.img = scene.add.image(n.home.x, n.home.y - 80, key).setDepth(4990);
    this.line = scene.add.graphics().setDepth(4989);
    this.state = 'fly';
    this.looks = 0;
  }

  update(dt) {
    const { n } = this;
    const sc = this.scene;
    const { x, y } = n.home;
    this.t += dt;
    const kx = x + 34 + Math.sin(this.t * 0.6) * 22;
    const ky = y - 92 + Math.sin(this.t * 1.0) * 9;
    this.img.setPosition(kx, ky).setAngle(Math.sin(this.t * 0.9) * 14 + 8);
    const hand = { x: x + 4, y: y - 14 };
    const g = this.line.clear();
    g.lineStyle(1, 0xf4f0e6, 0.9);
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(hand.x, hand.y), new Phaser.Math.Vector2((hand.x + kx) / 2 - 6 + Math.sin(this.t * 1.4) * 4, (hand.y + ky) / 2 + 22), new Phaser.Math.Vector2(kx, ky + 6));
    curve.draw(g, 14);
    // a tail of little bows
    for (let i = 1; i <= 4; i++) {
      const tx = kx - 3 - i * 3 + Math.sin(this.t * 3 - i) * 2;
      const ty = ky + 8 + i * 4;
      g.fillStyle(i % 2 ? 0xe0405a : 0xf4d35e, 1).fillRect(tx - 1, ty, 3, 2);
    }
    // looks up at it, now and then at you, and cheers when it catches the wind
    this.looks -= dt;
    if (this.looks <= 0) {
      this.looks = 2.5 + Math.random() * 3;
      const up = Math.random() < 0.7;
      n.s.setTexture(up ? `${n.prefix}_up` : `${n.prefix}_side`).setFlipX(false);
      if (Math.random() < 0.25) popEmote(sc, n, pickOf(['star', 'smile', 'sparkle', 'note'], Math.random()));
    }
    n.s.setDepth(n.s.y);
  }
}

// ---------- where they go ----------
// A clear patch of plain grass (no painted path, no water, nothing solid) around (x, y).
function clear(scene, x, y, r) {
  const pts = [[0, 0]];
  for (let a = 0; a < 8; a++) pts.push([Math.cos((a * TAU) / 8) * r, Math.sin((a * TAU) / 8) * r]);
  return pts.every(([dx, dy]) => {
    const px = x + dx;
    const py = y + dy;
    const cx = Math.floor(px / T);
    const cy = Math.floor(py / T);
    return scene.free(px, py) && scene.ground_(px, py) === 'grass' && !(scene.paint?.[cy]?.[cx]?.length) && scene.surfaceAt(px, py) === 'grass';
  });
}

function findSpot(scene, from, rnd, { near = 4, far = 12, r = 26, apart = 110, taken = [], south = true }) {
  for (let i = 0; i < 260; i++) {
    const d = (near + (far - near) * rnd()) * T;
    const a = south ? Math.PI * (0.1 + 0.8 * rnd()) + (rnd() < 0.5 ? 0 : Math.PI * 0) : rnd() * TAU; // mostly in front of the museum
    const x = Math.round(from.x + Math.cos(a) * d);
    const y = Math.round(from.y + Math.sin(a) * d);
    if (taken.some((t) => Math.hypot(t.x - x, t.y - y) < apart)) continue;
    if (!clear(scene, x, y, r)) continue;
    return { x, y };
  }
  return null;
}

// Fill an island's lawn with its little scenes. Only on the home islands, only by day.
export function buildVignettes(scene, { season, weather, night, day }) {
  if (night || scene.exp) return [];
  const from = scene.door || scene.landingSpot || scene.player;
  const rnd = seeded(day);
  const taken = [];
  const spot = (opts) => {
    const at = findSpot(scene, from, rnd, { ...opts, taken });
    if (at) taken.push(at);
    return at;
  };
  const out = [];
  const rain = weather === 'rain';

  // the groundskeeper
  const job = JOBS[season] || JOBS.summer;
  if (!(rain && job.tool !== 'shovel')) {
    const at = spot({ near: 5, far: 11, r: 30 });
    if (at) {
      const dir = rnd() < 0.5 ? 1 : -1;
      const n = addPerson(scene, { id: 'keeper', kind: 'casual', seed: 31, x: at.x, y: at.y, name: pickOf(['Walt', 'Marge', 'Bert', 'Odile'], rnd()), label: 'Groundskeeper', lines: job.lines, colors: { c: WORK, p: '#5a4a32', h: '#b8b0a0' }, look: { hat: 'cap' } });
      n.script = new Keeper(scene, n, job, dir);
      out.push(n);
    }
  }

  // kids running circles round a spot of lawn
  {
    const at = spot({ near: 6, far: 13, r: 46 });
    if (at) {
      const names = ['Pip', 'Juno', 'Moe', 'Tilly', 'Ravi'];
      const first = Math.floor(rnd() * names.length);
      const kids = [0, 1, 2].map((i) => addPerson(scene, { id: `kid${i}`, kind: 'kid', seed: 91 + i * 17, x: at.x + 30, y: at.y, name: names[(first + i) % names.length], label: 'Kid', lines: ['Can’t catch me!', 'We’re playing tag. Don’t tell the others you’re it.', 'Again, again, again!', 'I’m not dizzy. YOU’RE dizzy.'] }));
      const c = new Circle(scene, kids, at.x, at.y, 30);
      kids.forEach((k) => (k.script = { update: (dt) => c.update(dt, k) }));
      out.push(...kids);
    }
  }

  // a painter at an easel (not in the rain or the cold)
  if (!rain && weather !== 'snow') {
    const at = spot({ near: 5, far: 14, r: 28 });
    if (at) {
      const n = addPerson(scene, { id: 'painter', kind: 'artist', seed: 52, x: at.x, y: at.y, name: pickOf(['Odette', 'Lars', 'Mina'], rnd()), label: 'Painter', lines: ['I never finish a painting. I just stop at the least embarrassing moment.', 'Is the light doing something? It’s doing something.', 'Please don’t look at the sky. I’ve painted it purple.', 'Art takes time. Mostly standing about, honestly.'], look: { hat: true }, colors: { T: '#a02a2a' } });
      n.script = new Painter(scene, n, rnd() < 0.5 ? 1 : -1);
      out.push(n);
    }
  }

  // a kid with a kite on a clear day
  if (weather === 'clear' || weather === 'leaves' || weather === 'petals') {
    const at = spot({ near: 7, far: 15, r: 24 });
    if (at) {
      const n = addPerson(scene, { id: 'kite', kind: 'kid', seed: 203, x: at.x, y: at.y, name: 'Wren', label: 'Kid', lines: ['Look how high it goes!', 'The wind’s perfect today.', 'I’ve got four metres of string left. Four!', 'Don’t let go. Never let go.'] });
      n.script = new Kite(scene, n);
      out.push(n);
    }
  }
  return out;
}
