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
  makeCharacter,
  makeBubble,
  DEFAULT_DECOR,
} from './art.js';
import { PAINTINGS } from './paintings.js';
import { openViewer } from './viewer.js';
import { openDecor, load, save } from './decor.js';

// Room layout (portrait). The hallway runs top to bottom:
//   2-tile left wall | 5-tile floor | 2-tile right wall   = 9 tiles wide
// Back wall (with an oak door) at the top, entrance at the bottom.
const COLS = 9;
const FLOOR_ROWS = 24;
const WORLD_W = COLS * T;
const X_L = 2 * T; // floor left edge
const X_R = 7 * T; // floor right edge
const D = 2 * T; // wall height on screen
const Y0 = T + D; // floor top edge (1 tile of ceiling above the back wall)
const Y1 = Y0 + FLOOR_ROWS * T; // floor bottom edge
const WORLD_H = Y1 + T;
const GEOM = { w: WORLD_W, h: WORLD_H, xL: X_L, xR: X_R, y0: Y0, y1: Y1, D };

const SLOT_U = [2.5, 6.5, 10.5, 14.5, 18.5, 22.5].map((n) => n * T); // six slots per side wall
const ART_V0 = 30; // painting (inside the frame) bottom, px up the wall
const ART_V1 = 54; // painting top
const FRAME = 4;
const DOOR = { door: true, rect: { u0: 62, u1: 98, v0: 0, v1: 48 } };

const SPEED = 176; // px per second
const NPC_SPEED = 70;
const PLAYER_SCALE = 1.15;
const REACH = 26; // how close you need to be to clean something
const HD = 4; // resolution multiplier for paintings on the wall

const MIN_X = X_L + 9;
const MAX_X = X_R - 9;
const MIN_Y = Y0 + 10;
const MAX_Y = Y1 - 2;

const DECOR_KEY = 'curation.decor';
const CLEANED_KEY = 'curation.cleaned';

const VISITORS = [
  { h: '#d9b45a', H: '#efd27e', c: '#3d6fb6', p: '#3b3a48' },
  { h: '#1e1410', H: '#3a2a20', c: '#4f7a3a', p: '#5a4632' },
  { h: '#a0522d', H: '#c0704a', c: '#c27a2c', p: '#2f2b3d' },
];

export class RoomScene extends Phaser.Scene {
  constructor() {
    super('room');
  }

  preload() {
    this.load.setCORS('anonymous');
    PAINTINGS.forEach((p) => this.load.image(`art_${p.id}`, p.src));
  }

  create() {
    this.decor = { ...DEFAULT_DECOR, ...load(DECOR_KEY, {}) };

    makeCharacter(this, 'player');
    VISITORS.forEach((v, i) => makeCharacter(this, `npc${i}`, v));
    makeBubble(this);
    for (let i = 0; i < 4; i++) bakeCrack(this, `crack_${i}`, i + 1);
    for (let i = 0; i < 3; i++) bakeStain(this, `stain_${i}`, i + 1);
    bakeCobweb(this, 'cobweb');

    this.hung = PAINTINGS.map((p) => this.placePainting(p));
    this.wallItems = { left: [], right: [], back: [DOOR] };
    this.hung.forEach((p) => this.wallItems[p.wall].push({ rect: p.frame }));
    ['left', 'right'].forEach((wall) =>
      SLOT_U.forEach((u, slot) => {
        if (this.hung.some((p) => p.wall === wall && p.slot === slot)) return;
        this.wallItems[wall].push({ empty: true, rect: { u0: u - 14, u1: u + 14, v0: ART_V0 - 2, v1: ART_V1 + 2 } });
      }),
    );

    this.floorImg = this.add.image(X_L, Y0, bakeFloor(this, 'floor', X_R - X_L, Y1 - Y0, this.decor.floor).key).setOrigin(0);
    this.wallImg = this.add.image(0, 0, bakeWalls(this, 'walls', GEOM, this.wallItems, this.decor).key).setOrigin(0);
    this.add.image(0, Y1, bakeFront(this, 'front', WORLD_W, 4 * T, 5 * T).key).setOrigin(0);
    this.hung.forEach((p) => this.drawPainting(p));

    this.spawnMess();

    this.player = this.add.sprite(WORLD_W / 2, Y1 - 24, 'player_up').setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    this.npcs = VISITORS.map((_, i) => this.spawnVisitor(i));
    this.bubble = this.add.image(0, 0, 'bubble').setOrigin(0.5, 1).setDepth(5000).setVisible(false);

    this.setupCamera();
    this.setupInput();
    this.setupButtons();
  }

  // ---------- Paintings ----------

  // Painting rect in wall space (u along the hall, v up the wall).
  placePainting(p) {
    const h = ART_V1 - ART_V0;
    const w = Math.round(h * p.ratio);
    const uc = SLOT_U[p.slot];
    const art = { u0: uc - Math.floor(w / 2), u1: uc - Math.floor(w / 2) + w, v0: ART_V0, v1: ART_V1 };
    const frame = { u0: art.u0 - FRAME, u1: art.u1 + FRAME, v0: art.v0 - FRAME, v1: art.v1 + FRAME };
    return { ...p, art, frame, uc };
  }

  // Draw the real painting onto the angled wall at higher resolution.
  drawPainting(p) {
    const src = this.textures.exists(`art_${p.id}`) && this.textures.get(`art_${p.id}`).getSourceImage();
    const ok = src && src.width > 1;
    const iw = ok ? src.width : Math.round(100 * p.ratio);
    const ih = ok ? src.height : 100;
    const { u0, u1, v0, v1 } = p.art;
    const ku = (u1 - u0) / iw;
    const kv = (v1 - v0) / ih;

    // Affine map from image pixels to screen (see bakeWalls for the projection).
    // Facing the left wall, the painting's left edge is toward the door.
    const m =
      p.wall === 'left'
        ? { a: 0, b: -ku, c: kv, d: kv, e: X_L - v1, f: Y0 + u1 - v1 }
        : { a: 0, b: ku, c: -kv, d: kv, e: X_R + v1, f: Y0 + u0 - v1 };

    const pts = [[0, 0], [iw, 0], [0, ih], [iw, ih]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    const ox = Math.floor(Math.min(...pts.map((q) => q[0])));
    const oy = Math.floor(Math.min(...pts.map((q) => q[1])));
    const bw = Math.ceil(Math.max(...pts.map((q) => q[0]))) - ox;
    const bh = Math.ceil(Math.max(...pts.map((q) => q[1]))) - oy;

    const key = `wallart_${p.id}`;
    const tex = this.textures.createCanvas(key, bw * HD, bh * HD);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.setTransform(HD * m.a, HD * m.b, HD * m.c, HD * m.d, HD * (m.e - ox), HD * (m.f - oy));
    if (ok) ctx.drawImage(src, 0, 0);
    else {
      ctx.fillStyle = p.placeholder;
      ctx.fillRect(0, 0, iw, ih);
    }
    // match the wall's shading
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(20, 12, 8, ${p.wall === 'left' ? 0.1 : 0.18})`;
    ctx.fillRect(0, 0, bw * HD, bh * HD);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);

    this.add.image(ox, oy, key).setOrigin(0).setScale(1 / HD);
    p.hitBox = new Phaser.Geom.Rectangle(ox - 6, oy - 6, bw + 12, bh + 12);
  }

  // ---------- Mess (cracks, stains, cobwebs) ----------

  messList() {
    const list = [];
    const rx = (i, s) => X_L + 16 + hash(i, 1, s) * (X_R - X_L - 32);
    const ry = (i, s) => Y0 + 24 + hash(i, 2, s) * (Y1 - Y0 - 110);
    for (let i = 0; i < 14; i++) {
      const x = rx(i, 40);
      const y = ry(i, 40);
      list.push({ id: `crack${i}`, kind: 'crack', key: `crack_${i % 4}`, x, y, ax: x, ay: y, flip: hash(i, 3, 40) > 0.5 });
    }
    for (let i = 0; i < 6; i++) {
      const x = rx(i, 41);
      const y = ry(i, 41);
      list.push({ id: `stain${i}`, kind: 'stain', key: `stain_${i % 3}`, x, y, ax: x, ay: y, flip: hash(i, 3, 41) > 0.5 });
    }
    // Cobwebs: top corners where the walls meet, along the crown molding, and floor corners.
    const web = (id, x, y, fx, fy, ax, ay) => list.push({ id, kind: 'cobweb', key: 'cobweb', x, y, fx, fy, ax, ay });
    web('web0', 0, Y0 - D, false, false, X_L + 10, Y0 + 12);
    web('web1', WORLD_W, Y0 - D, true, false, X_R - 10, Y0 + 12);
    web('web2', 0, 260, false, false, X_L + 10, 260 + D);
    web('web3', 0, 560, false, false, X_L + 10, 560 + D);
    web('web4', WORLD_W, 420, true, false, X_R - 10, 420 + D);
    web('web5', WORLD_W, 690, true, false, X_R - 10, 690 + D);
    web('web6', X_L, Y1, false, true, X_L + 10, Y1 - 12);
    web('web7', X_R, Y1, true, true, X_R - 10, Y1 - 12);
    return list;
  }

  spawnMess() {
    const cleaned = new Set(load(CLEANED_KEY, []));
    this.mess = this.messList().filter((m) => !cleaned.has(m.id));
    this.mess.forEach((m) => {
      if (m.kind === 'cobweb') {
        m.sprite = this.add
          .image(m.x, m.y, m.key)
          .setOrigin(m.fx ? 1 : 0, m.fy ? 1 : 0)
          .setFlip(m.fx, m.fy)
          .setDepth(4000);
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
      const px = this.add
        .rectangle(b.x + Math.random() * b.width, b.y + Math.random() * b.height, 2, 2, color)
        .setDepth(m.sprite.depth + 1);
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
    this.mess.forEach((m) => m.sprite.destroy());
    save(CLEANED_KEY, []);
    this.spawnMess();
  }

  // ---------- Visitors (walk Pokémon-style: straight lines, 1-2 tiles) ----------

  spawnVisitor(i) {
    const col = Math.floor(hash(i, 1, 50) * 5);
    const row = 2 + Math.floor(hash(i, 2, 50) * (FLOOR_ROWS - 6));
    const s = this.add.sprite(X_L + col * T + T / 2, Y0 + row * T + T - 4, `npc${i}_down`).setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    return { s, prefix: `npc${i}`, wait: 400 + Math.random() * 1500, target: null };
  }

  updateVisitor(n, dt) {
    if (n.target) {
      const dx = n.target.x - n.s.x;
      const dy = n.target.y - n.s.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      const step = NPC_SPEED * dt;
      if (dist <= step) {
        n.s.setPosition(n.target.x, n.target.y);
        n.target = null;
        n.wait = 600 + Math.random() * 2200;
      } else if (dx) n.s.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
      else n.s.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
      return;
    }
    n.wait -= dt * 1000;
    if (n.wait > 0) return;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const [dx, dy] = dirs[Math.floor(Math.random() * 4)];
    const tiles = 1 + Math.floor(Math.random() * 2);
    const tx = n.s.x + dx * tiles * T;
    const ty = n.s.y + dy * tiles * T;
    if (tx < MIN_X || tx > MAX_X || ty < MIN_Y + 12 || ty > MAX_Y - 20) {
      n.wait = 200;
      return;
    }
    n.target = { x: tx, y: ty };
    this.faceSprite(n.s, n.prefix, dx, dy);
  }

  // ---------- Camera & input ----------

  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.startFollow(this.player, true, 1, 0.15);
    this.fitCamera();
    this.scale.on('resize', () => this.fitCamera());
  }

  // Always show the full 9-tile width; the hall scrolls vertically.
  fitCamera() {
    const cam = this.cameras.main;
    const { width, height } = this.scale.gameSize;
    cam.setSize(width, height);
    cam.setZoom(width / WORLD_W);
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
    this.stick = document.getElementById('stick');
    this.knob = this.stick.querySelector('.knob');

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
        this.target = null;
        this.pendingView = null;
        this.stick.style.left = `${this.press.x}px`;
        this.stick.style.top = `${this.press.y}px`;
        this.stick.classList.add('active');
      }
      if (this.dragging) this.moveKnob(dx, dy);
    });

    this.input.on('pointerup', (p) => {
      if (this.press && !this.dragging) this.onTap(p.worldX, p.worldY);
      this.press = null;
      this.dragging = false;
      this.stick.classList.remove('active');
    });
  }

  setupButtons() {
    this.interactBtn = document.getElementById('interact');
    this.interactBtn.onclick = () => this.interact();
    document.getElementById('home-btn').onclick = () => {
      this.pause(true);
      openDecor(this.decor, {
        onChange: (decor) => this.applyDecor(decor),
        onReset: () => this.resetMess(),
        onClose: () => this.pause(false),
      });
    };
  }

  pause(on) {
    this.input.enabled = !on;
    if (on) {
      this.target = null;
      this.bubble.setVisible(false);
      this.interactBtn.classList.add('hidden');
    }
  }

  applyDecor(decor) {
    this.decor = decor;
    save(DECOR_KEY, decor);
    bakeFloor(this, 'floor', X_R - X_L, Y1 - Y0, decor.floor);
    this.floorImg.setTexture('floor');
    bakeWalls(this, 'walls', GEOM, this.wallItems, decor);
    this.wallImg.setTexture('walls');
  }

  // Pointer position in CSS pixels (the canvas renders at device resolution).
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

  onTap(wx, wy) {
    const hit = this.hung.find((p) => p.hitBox.contains(wx, wy));
    if (hit) {
      if (this.focus?.painting === hit) return this.view(hit);
      this.target = { x: hit.wall === 'left' ? MIN_X : MAX_X, y: Phaser.Math.Clamp(Y0 + hit.uc + 10, MIN_Y, MAX_Y) };
      this.pendingView = hit;
      return;
    }
    this.pendingView = null;
    this.target = { x: Phaser.Math.Clamp(wx, MIN_X, MAX_X), y: Phaser.Math.Clamp(wy, MIN_Y, MAX_Y) };
  }

  // What the player can interact with right now: the nearest painting or mess in reach.
  findFocus() {
    const { x, y } = this.player;
    let best = null;
    let bestD = Infinity;
    for (const p of this.hung) {
      const byWall = p.wall === 'left' ? x < MIN_X + 14 : x > MAX_X - 14;
      const dy = Math.abs(y - 6 - (Y0 + p.uc));
      if (byWall && dy < (p.art.u1 - p.art.u0) / 2 + 16 && dy < bestD) {
        best = { painting: p };
        bestD = dy;
      }
    }
    for (const m of this.mess) {
      const d = Math.hypot(x - m.ax, y - 4 - m.ay);
      if (d < REACH && d < bestD) {
        best = { mess: m };
        bestD = d;
      }
    }
    return best;
  }

  interact() {
    if (!this.focus || !this.input.enabled) return;
    if (this.focus.painting) this.view(this.focus.painting);
    else this.clean(this.focus.mess);
    this.focus = null;
  }

  view(p) {
    this.target = null;
    this.pendingView = null;
    this.faceSprite(this.player, 'player', p.wall === 'left' ? -1 : 1, 0);
    const list = [...this.hung].sort((a, b) => (a.wall === b.wall ? a.slot - b.slot : a.wall === 'left' ? -1 : 1));
    this.pause(true);
    openViewer(list, list.indexOf(p), () => this.pause(false));
  }

  faceSprite(s, prefix, vx, vy) {
    if (Math.abs(vx) > Math.abs(vy)) s.setTexture(`${prefix}_side`).setFlipX(vx < 0);
    else if (vy !== 0) s.setTexture(vy < 0 ? `${prefix}_up` : `${prefix}_down`).setFlipX(false);
  }

  update(_, dtMs) {
    const dt = dtMs / 1000;
    this.npcs.forEach((n) => {
      this.updateVisitor(n, dt);
      n.s.setDepth(n.s.y);
    });
    if (!this.input.enabled) return; // a panel is open

    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);

    if (vx || vy) {
      this.target = null;
      this.pendingView = null;
    } else if (this.dragging && this.dragVec) {
      ({ x: vx, y: vy } = this.dragVec);
    } else if (this.target) {
      const dx = this.target.x - this.player.x;
      const dy = this.target.y - this.player.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1.5) {
        this.target = null;
        if (this.pendingView) return this.view(this.pendingView);
      } else {
        const step = Math.min(SPEED * dt, dist);
        this.player.x += (dx / dist) * step;
        this.player.y += (dy / dist) * step;
        this.faceSprite(this.player, 'player', dx, dy);
      }
    }

    const len = Math.hypot(vx, vy);
    if (len > 0) {
      this.player.x = Phaser.Math.Clamp(this.player.x + (vx / len) * SPEED * dt, MIN_X, MAX_X);
      this.player.y = Phaser.Math.Clamp(this.player.y + (vy / len) * SPEED * dt, MIN_Y, MAX_Y);
      this.faceSprite(this.player, 'player', vx, vy);
    }
    this.player.setDepth(this.player.y);

    this.focus = this.findFocus();
    this.bubble.setVisible(!!this.focus);
    this.interactBtn.classList.toggle('hidden', !this.focus);
    if (this.focus) this.bubble.setPosition(Math.round(this.player.x), Math.round(this.player.y - 36));
    if (this.focus && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) {
      this.interact();
    }
  }
}
