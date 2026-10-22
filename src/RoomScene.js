import Phaser from 'phaser';
import {
  T,
  hash,
  bakeFloor,
  bakeWalls,
  bakeFront,
  bakeCrack,
  bakeStain,
  bakeCobweb,
  bakeStairsUp,
  bakeStairsDown,
  makeCharacter,
  makeBubble,
  DEFAULT_DECOR,
} from './art.js';
import { loadRooms, addRoom, resetRooms, layout, paintingsFor, placeArt, wallItems } from './rooms.js';
import { artBounds, paintArt } from './walldraw.js';
import { PERSONALITIES, lineFor } from './lines.js';
import { iconSvg } from './icons.js';
import { openViewer } from './viewer.js';
import { openDecor, load, save } from './decor.js';
import { openBuild } from './build.js';
import { showTalk, hideTalk, talking } from './talk.js';

const VIEW_TILES = 9; // the camera always shows 9 tiles across
const SPEED = 176; // px per second
const NPC_SPEED = 70;
const NPC_SLOW = 0.35; // visitors slow down near the player so they're easy to talk to
const BODY = { w: 13, h: 9 }; // half-size of a character's footprint, for bumping
const PLAYER_SCALE = 1.15;
const REACH = 26; // how close you need to be to interact
const HD = 4; // resolution multiplier for paintings on the wall

const DECOR_KEY = 'curation.decor';
const CLEANED_KEY = 'curation.cleaned';

const LOOKS = [
  { h: '#d9b45a', H: '#efd27e', c: '#3d6fb6', p: '#3b3a48' },
  { h: '#1e1410', H: '#3a2a20', c: '#4f7a3a', p: '#5a4632' },
  { h: '#a0522d', H: '#c0704a', c: '#c27a2c', p: '#2f2b3d' },
  { h: '#8a8a8a', H: '#b0b0b0', c: '#6a4c93', p: '#2f2b3d' },
  { h: '#2b1a10', H: '#4a3020', c: '#b0413e', p: '#3b3a48' },
  { h: '#e8d8a8', H: '#fff0c8', c: '#2e7d7a', p: '#4a3a2a' },
];
const KINDS = Object.keys(PERSONALITIES);

export class RoomScene extends Phaser.Scene {
  constructor() {
    super('room');
  }

  init(data) {
    this.roomIndex = data?.room ?? 0;
    this.spawnAt = data?.spawn ?? 'start';
  }

  preload() {
    this.rooms = loadRooms();
    this.room = this.rooms[this.roomIndex];
    this.L = layout(this.room);
    this.hung = paintingsFor(this.rooms, this.roomIndex).filter(Boolean).map(placeArt);
    this.load.setCORS('anonymous');
    this.hung.forEach((p) => {
      if (!this.textures.exists(`art_${p.id}`)) this.load.image(`art_${p.id}`, p.src);
    });
  }

  create() {
    const { g, exit, entrance } = this.L;
    this.g = g;
    this.decor = { ...DEFAULT_DECOR, ...load(DECOR_KEY, {}) };

    if (!this.textures.exists('player_down')) {
      makeCharacter(this, 'player');
      LOOKS.forEach((v, i) => makeCharacter(this, `npc${i}`, v));
      makeBubble(this);
      for (let i = 0; i < 4; i++) bakeCrack(this, `crack_${i}`, i + 1);
      for (let i = 0; i < 3; i++) bakeStain(this, `stain_${i}`, i + 1);
      bakeCobweb(this, 'cobweb');
      bakeStairsUp(this, 'stairs_up');
      bakeStairsDown(this, 'stairs_down');
    }

    this.wallItems = wallItems(this.L, this.hung);
    this.floorImg = this.add.image(g.xL, g.y0, bakeFloor(this, 'floor', g.xR - g.xL, g.y1 - g.y0, this.decor.floor).key).setOrigin(0);
    this.wallImg = this.add.image(0, 0, bakeWalls(this, 'walls', g, this.wallItems, this.decor).key).setOrigin(0);
    this.add.image(0, g.y1, bakeFront(this, 'front', g.w, entrance.x0, entrance.x1).key).setOrigin(0);
    if (exit?.kind === 'stairs-up') this.add.image(g.xL, g.y0 + 64, 'stairs_up').setOrigin(0, 1).setDepth(2);
    if (exit?.kind === 'stairs-down') this.add.image(g.xL, g.y0, 'stairs_down').setOrigin(0).setDepth(2);
    this.hung.forEach((p) => this.drawPainting(p));
    this.blocks = exit?.block ? [exit.block] : [];

    this.mess = [];
    if (this.roomIndex === 0) this.spawnMess();

    const start = this.spawnPoint();
    this.player = this.add.sprite(start.x, start.y, start.face).setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    const count = Math.min(5, 3 + Math.floor(this.L.slots.length / 6));
    this.npcs = Array.from({ length: count }, (_, i) => this.spawnVisitor(i));
    this.bubble = this.add.image(0, 0, 'bubble').setOrigin(0.5, 1).setDepth(5000).setVisible(false);

    this.setupCamera();
    this.setupInput();
    this.setupButtons();
    this.cameras.main.fadeIn(250, 29, 21, 18);
  }

  spawnPoint() {
    const { g, exit, entrance } = this.L;
    if (this.spawnAt === 'exit' && exit) return { x: exit.ax, y: exit.ay + 14, face: 'player_down' };
    if (this.spawnAt === 'entrance') return { x: entrance.ax, y: g.y1 - 16, face: 'player_up' };
    return { x: entrance.ax, y: g.y1 - 24, face: 'player_up' };
  }

  // ---------- Paintings ----------

  // Draw the real painting onto the angled wall at higher resolution.
  drawPainting(p) {
    const src = this.textures.exists(`art_${p.id}`) && this.textures.get(`art_${p.id}`).getSourceImage();
    const b = artBounds(p, this.g);
    const key = `wallart_${this.roomIndex}_${p.wall}_${p.u}`;
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, b.w * HD, b.h * HD);
    const ctx = tex.getContext();
    paintArt(ctx, src && src.width > 1 ? src : null, p, this.g, HD, b.x, b.y);
    // match the wall's shading
    const shadeBy = { left: 0.1, right: 0.18, back: 0.04 }[p.wall];
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(20, 12, 8, ${shadeBy})`;
    ctx.fillRect(0, 0, b.w * HD, b.h * HD);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.add.image(b.x, b.y, key).setOrigin(0).setScale(1 / HD);
  }

  // Where to stand to look at a painting, and whether the player is there.
  standFor(p) {
    const { g } = this;
    if (p.wall === 'back') return { x: g.xL + p.u, y: g.y0 + 14, fx: 0, fy: -1 };
    return { x: p.wall === 'left' ? g.xL + 10 : g.xR - 10, y: g.y0 + p.u + 10, fx: p.wall === 'left' ? -1 : 1, fy: 0 };
  }

  // ---------- Mess (cracks, stains, cobwebs) — first room only ----------

  messList() {
    const { g } = this;
    const L = g.y1 - g.y0;
    const list = [];
    const rx = (i, s) => g.xL + 16 + hash(i, 1, s) * (g.xR - g.xL - 32);
    const ry = (i, s) => g.y0 + 24 + hash(i, 2, s) * (L - 70);
    for (let i = 0; i < 10; i++) {
      const x = rx(i, 40);
      const y = ry(i, 40);
      list.push({ id: `crack${i}`, kind: 'crack', key: `crack_${i % 4}`, x, y, ax: x, ay: y, flip: hash(i, 3, 40) > 0.5 });
    }
    for (let i = 0; i < 4; i++) {
      const x = rx(i, 41);
      const y = ry(i, 41);
      list.push({ id: `stain${i}`, kind: 'stain', key: `stain_${i % 3}`, x, y, ax: x, ay: y, flip: hash(i, 3, 41) > 0.5 });
    }
    // Cobwebs: top corners where the walls meet, along the crown molding, and floor corners.
    const web = (id, x, y, fx, fy, ax, ay) => list.push({ id, kind: 'cobweb', key: 'cobweb', x, y, fx, fy, ax, ay });
    const yl = Math.round(g.y0 - g.D + L * 0.45);
    const yr = Math.round(g.y0 - g.D + L * 0.7);
    web('web0', 0, g.y0 - g.D, false, false, g.xL + 10, g.y0 + 12);
    web('web1', g.w, g.y0 - g.D, true, false, g.xR - 10, g.y0 + 12);
    web('web2', 0, yl, false, false, g.xL + 10, yl + g.D);
    web('web3', g.w, yr, true, false, g.xR - 10, yr + g.D);
    web('web4', g.xL, g.y1, false, true, g.xL + 10, g.y1 - 12);
    web('web5', g.xR, g.y1, true, true, g.xR - 10, g.y1 - 12);
    return list;
  }

  spawnMess() {
    const cleaned = new Set(load(CLEANED_KEY, []));
    this.mess = this.messList().filter((m) => !cleaned.has(m.id));
    this.mess.forEach((m) => {
      if (m.kind === 'cobweb') {
        m.sprite = this.add.image(m.x, m.y, m.key).setOrigin(m.fx ? 1 : 0, m.fy ? 1 : 0).setFlip(m.fx, m.fy).setDepth(4000);
      } else {
        m.sprite = this.add.image(Math.round(m.x), Math.round(m.y), m.key).setFlipX(m.flip).setDepth(1);
      }
    });
  }

  clean(m) {
    this.mess = this.mess.filter((x) => x !== m);
    save(CLEANED_KEY, [...new Set([...load(CLEANED_KEY, []), m.id])]);

    const b = m.sprite.getBounds();
    const color = m.kind === 'cobweb' ? 0xf4f2ec : m.kind === 'crack' ? 0xf1dfb0 : 0xd8e4ea;
    const count = m.kind === 'cobweb' ? 14 : 9;
    for (let i = 0; i < count; i++) {
      const px = this.add.rectangle(b.x + Math.random() * b.width, b.y + Math.random() * b.height, 2, 2, color).setDepth(m.sprite.depth + 1);
      this.tweens.add({
        targets: px,
        x: px.x + (Math.random() - 0.5) * 16,
        y: px.y + (m.kind === 'cobweb' ? 10 + Math.random() * 14 : -8 - Math.random() * 12),
        alpha: 0,
        duration: 900 + Math.random() * 900,
        ease: 'Quad.easeOut',
        onComplete: () => px.destroy(),
      });
    }
    this.tweens.add({ targets: m.sprite, alpha: 0, duration: 450, onComplete: () => m.sprite.destroy() });
  }

  resetMess() {
    if (this.roomIndex !== 0) return save(CLEANED_KEY, []);
    this.mess.forEach((m) => m.sprite.destroy());
    save(CLEANED_KEY, []);
    this.spawnMess();
  }

  // ---------- Visitors (walk Pokémon-style: straight lines, 1-2 tiles) ----------

  spawnVisitor(i) {
    const { g } = this;
    const seed = this.roomIndex * 10 + i;
    const look = Math.floor(hash(seed, 4, 50) * LOOKS.length);
    const kind = KINDS[Math.floor(hash(seed, 5, 50) * KINDS.length)];
    const names = PERSONALITIES[kind].names;
    let x;
    let y;
    for (let tries = 0; tries < 20; tries++) {
      x = g.xL + Math.floor(hash(seed, 1 + tries, 51) * g.fw) * T + T / 2;
      y = g.y0 + (1 + Math.floor(hash(seed, 2 + tries, 52) * (g.fd - 2))) * T + T - 4;
      if (!this.blocked(x, y)) break;
    }
    const s = this.add.sprite(x, y, `npc${look}_down`).setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    return { s, prefix: `npc${look}`, kind, name: names[Math.floor(hash(seed, 6, 50) * names.length)], wait: 400 + Math.random() * 1500, target: null };
  }

  updateVisitor(n, dt) {
    if (n.talking) return;
    if (n.target) {
      const dx = n.target.x - n.s.x;
      const dy = n.target.y - n.s.y;
      const near = Math.hypot(this.player.x - n.s.x, this.player.y - n.s.y) < 48;
      const step = NPC_SPEED * dt * (near ? NPC_SLOW : 1);
      const sx = dx ? Math.sign(dx) * Math.min(step, Math.abs(dx)) : 0;
      const sy = dx ? 0 : Math.sign(dy) * Math.min(step, Math.abs(dy));
      if (this.overlapsPlayer(n.s.x + sx, n.s.y + sy)) return; // wait for the player to move
      if (Math.abs(dx) + Math.abs(dy) <= step) {
        n.s.setPosition(n.target.x, n.target.y);
        n.target = null;
        n.wait = 600 + Math.random() * 2200;
      } else if (dx) n.s.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
      else n.s.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
      return;
    }
    n.wait -= dt * 1000;
    if (n.wait > 0) return;
    const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
    const tiles = 1 + Math.floor(Math.random() * 2);
    const tx = n.s.x + dx * tiles * T;
    const ty = n.s.y + dy * tiles * T;
    const b = this.bounds();
    if (tx < b.x0 || tx > b.x1 || ty < b.y0 + 12 || ty > b.y1 - 20 || this.blocked(tx, ty)) {
      n.wait = 200;
      return;
    }
    n.target = { x: tx, y: ty };
    this.faceSprite(n.s, n.prefix, dx, dy);
  }

  // The painting a visitor is standing near, if any.
  paintingNear(x, y) {
    let best = null;
    let bestD = 3 * T;
    for (const p of this.hung) {
      const s = this.standFor(p);
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  talkTo(n) {
    const line = lineFor(n.kind, this.paintingNear(n.s.x, n.s.y));
    n.talking = true;
    n.target = null;
    this.faceSprite(n.s, n.prefix, this.player.x - n.s.x, this.player.y - n.s.y);
    this.talkingTo = n;
    const cam = this.cameras.main;
    const r = this.game.canvas.getBoundingClientRect();
    const k = r.width / this.scale.gameSize.width;
    const at = { x: r.left + (n.s.x - cam.worldView.x) * cam.zoom * k, y: r.top + (n.s.y - 34 - cam.worldView.y) * cam.zoom * k };
    showTalk(n.name, PERSONALITIES[n.kind].label, line, at);
  }

  endTalk() {
    if (!this.talkingTo) return;
    this.talkingTo.talking = false;
    this.talkingTo.wait = 1500;
    this.talkingTo = null;
    hideTalk();
  }

  // ---------- Movement helpers ----------

  bounds() {
    const { g } = this;
    return { x0: g.xL + 9, x1: g.xR - 9, y0: g.y0 + 10, y1: g.y1 - 2 };
  }

  blocked(x, y) {
    return this.blocks.some((b) => x > b.x0 - 6 && x < b.x1 + 6 && y > b.y0 && y < b.y1 + 8);
  }

  // Characters bump into each other instead of walking through.
  hitsVisitor(x, y) {
    return this.npcs.some((n) => Math.abs(x - n.s.x) < 2 * BODY.w && Math.abs(y - n.s.y) < 2 * BODY.h);
  }

  overlapsPlayer(x, y) {
    return Math.abs(x - this.player.x) < 2 * BODY.w && Math.abs(y - this.player.y) < 2 * BODY.h;
  }

  // ---------- Camera & input ----------

  setupCamera() {
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.2, 0.2);
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));
  }

  fitCamera() {
    const cam = this.cameras.main;
    const { width, height } = this.scale.gameSize;
    cam.setSize(width, height);
    const zoom = width / (VIEW_TILES * T);
    cam.setZoom(zoom);
    // Rooms smaller than the screen sit centered instead of stuck to the top.
    const vw = Math.max(this.g.w, width / zoom);
    const vh = Math.max(this.g.h, height / zoom);
    cam.setBounds((this.g.w - vw) / 2, (this.g.h - vh) / 2, vw, vh);
  }

  // Press and drag anywhere to walk (a floating joystick appears).
  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
    this.stick = document.getElementById('stick');
    this.knob = this.stick.querySelector('.knob');
    this.dragging = false;

    this.input.on('pointerdown', (p) => {
      this.press = this.toCss(p);
      this.dragging = false;
    });
    this.input.on('pointermove', (p) => {
      if (!this.press || !p.isDown) return;
      const at = this.toCss(p);
      const dx = at.x - this.press.x;
      const dy = at.y - this.press.y;
      if (!this.dragging && Math.hypot(dx, dy) > 10) {
        this.dragging = true;
        this.stick.style.left = `${this.press.x}px`;
        this.stick.style.top = `${this.press.y}px`;
        this.stick.classList.add('active');
      }
      if (this.dragging) this.moveKnob(dx, dy);
    });
    this.input.on('pointerup', () => {
      this.press = null;
      this.dragging = false;
      this.stick.classList.remove('active');
    });
  }

  toCss(p) {
    const r = this.game.canvas.getBoundingClientRect();
    return { x: r.left + (p.x * r.width) / this.scale.gameSize.width, y: r.top + (p.y * r.height) / this.scale.gameSize.height };
  }

  moveKnob(dx, dy) {
    const max = 36;
    const len = Math.hypot(dx, dy);
    const k = len > max ? max / len : 1;
    this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    this.dragVec = len > 0 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
  }

  setupButtons() {
    this.interactBtn = document.getElementById('interact');
    this.interactIcon = this.interactBtn.querySelector('.bang');
    this.interactBtn.onclick = () => this.interact();
    document.getElementById('home-btn').onclick = () => {
      if (!this.input.enabled) return;
      this.pause(true);
      openDecor(this.decor, {
        onChange: (decor) => this.applyDecor(decor),
        onReset: () => {
          this.resetMess();
          resetRooms();
          if (this.roomIndex !== 0) this.travel(0, 'start');
        },
        onClose: () => this.pause(false),
      });
    };
  }

  pause(on) {
    this.input.enabled = !on;
    this.stick.classList.remove('active');
    this.dragging = false;
    if (on) {
      this.bubble.setVisible(false);
      this.interactBtn.classList.add('hidden');
      this.endTalk();
    }
  }

  applyDecor(decor) {
    this.decor = decor;
    save(DECOR_KEY, decor);
    bakeFloor(this, 'floor', this.g.xR - this.g.xL, this.g.y1 - this.g.y0, decor.floor);
    this.floorImg.setTexture('floor');
    bakeWalls(this, 'walls', this.g, this.wallItems, decor);
    this.wallImg.setTexture('walls');
  }

  // ---------- Interaction ----------

  // The nearest thing in reach: painting, mess, visitor, exit or entrance.
  findFocus() {
    const { x, y } = this.player;
    let best = null;
    let bestD = REACH;
    const consider = (d, focus) => {
      if (d < bestD) {
        best = focus;
        bestD = d;
      }
    };
    for (const p of this.hung) {
      const s = this.standFor(p);
      const half = (p.art.u1 - p.art.u0) / 2;
      const along = p.wall === 'back' ? Math.abs(x - s.x) : Math.abs(y - s.y);
      const across = p.wall === 'back' ? Math.abs(y - s.y) : Math.abs(x - s.x);
      if (along < half + 14 && across < 16) consider(across + along / 4, { painting: p, icon: 'look' });
    }
    for (const m of this.mess) {
      consider(Math.hypot(x - m.ax, y - 4 - m.ay), { mess: m, icon: { crack: 'repair', stain: 'clean', cobweb: 'sweep' }[m.kind] });
    }
    for (const n of this.npcs) consider(Math.hypot(x - n.s.x, y - n.s.y) - 2, { npc: n, icon: 'talk' });
    const { exit, entrance } = this.L;
    if (exit) {
      const built = this.roomIndex + 1 < this.rooms.length;
      const icon = !built ? 'build' : exit.kind.startsWith('stairs') ? 'stairs' : 'door';
      consider(Math.hypot(x - exit.ax, y - exit.ay), { exit: true, icon });
    }
    if (this.roomIndex > 0) consider(Math.hypot(x - entrance.ax, y - entrance.ay), { entrance: true, icon: 'back' });
    return best;
  }

  interact() {
    const f = this.focus;
    if (!f || !this.input.enabled) return;
    if (f.painting) this.view(f.painting);
    else if (f.mess) this.clean(f.mess);
    else if (f.npc) (this.talkingTo === f.npc ? this.endTalk() : this.talkTo(f.npc));
    else if (f.entrance) this.travel(this.roomIndex - 1, 'exit');
    else if (f.exit) {
      if (this.roomIndex + 1 < this.rooms.length) this.travel(this.roomIndex + 1, 'entrance');
      else this.openBuildMenu();
    }
    this.focus = null;
  }

  openBuildMenu() {
    this.pause(true);
    openBuild(this, this.rooms, this.decor, {
      onBuild: (room) => {
        addRoom(room);
        this.travel(this.roomIndex + 1, 'entrance');
      },
      onCancel: () => this.pause(false),
    });
  }

  travel(room, spawn) {
    this.input.enabled = false;
    this.interactBtn.classList.add('hidden');
    hideTalk();
    this.cameras.main.fadeOut(220, 29, 21, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ room, spawn }));
  }

  view(p) {
    const s = this.standFor(p);
    this.faceSprite(this.player, 'player', s.fx, s.fy);
    this.pause(true);
    openViewer(this.hung, this.hung.indexOf(p), () => this.pause(false));
  }

  faceSprite(s, prefix, vx, vy) {
    if (Math.abs(vx) > Math.abs(vy)) s.setTexture(`${prefix}_side`).setFlipX(vx < 0);
    else if (vy !== 0) s.setTexture(vy < 0 ? `${prefix}_up` : `${prefix}_down`).setFlipX(false);
  }

  update(_, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000;
    this.npcs.forEach((n) => {
      this.updateVisitor(n, dt);
      n.s.setDepth(n.s.y);
    });
    if (!this.input.enabled) return; // a panel is open

    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (!vx && !vy && this.dragging && this.dragVec) ({ x: vx, y: vy } = this.dragVec);

    const len = Math.hypot(vx, vy);
    if (len > 0) {
      const b = this.bounds();
      const nx = Phaser.Math.Clamp(this.player.x + (vx / len) * SPEED * dt, b.x0, b.x1);
      const ny = Phaser.Math.Clamp(this.player.y + (vy / len) * SPEED * dt, b.y0, b.y1);
      const free = (x, y, ox, oy) => !this.blocked(x, y) && (!this.hitsVisitor(x, y) || this.hitsVisitor(ox, oy));
      if (free(nx, this.player.y, this.player.x, this.player.y)) this.player.x = nx;
      if (free(this.player.x, ny, this.player.x, this.player.y)) this.player.y = ny;
      this.faceSprite(this.player, 'player', vx, vy);
    }
    this.player.setDepth(this.player.y);

    if (this.talkingTo && (!talking() || Math.hypot(this.player.x - this.talkingTo.s.x, this.player.y - this.talkingTo.s.y) > 60)) {
      this.endTalk();
    }

    const prev = this.focus?.icon;
    this.focus = this.findFocus();
    this.bubble.setVisible(!!this.focus);
    this.interactBtn.classList.toggle('hidden', !this.focus);
    if (this.focus && this.focus.icon !== prev) this.interactIcon.innerHTML = iconSvg(this.focus.icon);
    if (this.focus) this.bubble.setPosition(Math.round(this.player.x), Math.round(this.player.y - 36));
    if (this.focus && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) this.interact();
  }
}
