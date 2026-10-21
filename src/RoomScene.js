import Phaser from 'phaser';
import { T, bakeFloor, bakeWalls, bakeFront, makeSprites } from './art.js';
import { PAINTINGS } from './paintings.js';
import { openViewer } from './viewer.js';

// Room layout (portrait). The hallway runs top to bottom:
//   2-tile left wall | 5-tile floor | 2-tile right wall   = 9 tiles wide
// Back wall at the top, door at the bottom.
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

const SLOT_U = [4 * T, 12 * T, 20 * T]; // three slots per side wall, along the hall
const ART_V0 = 30; // painting (inside the frame) bottom, px up the wall
const ART_V1 = 54; // painting top
const FRAME = 4;

const SPEED = 128; // px per second (4 tiles/s)
const HD = 4; // resolution multiplier for paintings on the wall

const MIN_X = X_L + 9;
const MAX_X = X_R - 9;
const MIN_Y = Y0 + 10;
const MAX_Y = Y1 - 2;

export class RoomScene extends Phaser.Scene {
  constructor() {
    super('room');
  }

  preload() {
    this.load.setCORS('anonymous');
    PAINTINGS.forEach((p) => this.load.image(`art_${p.id}`, p.src));
  }

  create() {
    makeSprites(this);

    this.hung = PAINTINGS.map((p) => this.placePainting(p));
    const items = { left: [], right: [], back: [] };
    this.hung.forEach((p) => items[p.wall].push({ rect: p.frame }));
    ['left', 'right'].forEach((wall) =>
      SLOT_U.forEach((u, slot) => {
        if (this.hung.some((p) => p.wall === wall && p.slot === slot)) return;
        items[wall].push({ empty: true, rect: { u0: u - 14, u1: u + 14, v0: ART_V0 - 2, v1: ART_V1 + 2 } });
      }),
    );

    this.add.image(X_L, Y0, bakeFloor(this, 'floor', X_R - X_L, Y1 - Y0).key).setOrigin(0);
    this.add.image(0, 0, bakeWalls(this, 'walls', GEOM, items).key).setOrigin(0);
    this.add.image(0, Y1, bakeFront(this, 'front', WORLD_W, 4 * T, 5 * T).key).setOrigin(0);
    this.hung.forEach((p) => this.drawPainting(p));

    this.player = this.add.sprite(WORLD_W / 2, Y1 - 24, 'player_up').setOrigin(0.5, 1).setDepth(10);
    this.bubble = this.add.image(0, 0, 'bubble').setOrigin(0.5, 1).setDepth(20).setVisible(false);

    this.setupCamera();
    this.setupInput();
  }

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
      if (this.nearPainting() === hit) return this.view(hit);
      this.target = { x: hit.wall === 'left' ? MIN_X : MAX_X, y: Phaser.Math.Clamp(Y0 + hit.uc + 10, MIN_Y, MAX_Y) };
      this.pendingView = hit;
      return;
    }
    this.pendingView = null;
    this.target = { x: Phaser.Math.Clamp(wx, MIN_X, MAX_X), y: Phaser.Math.Clamp(wy, MIN_Y, MAX_Y) };
  }

  // The painting the player is standing beside, if any.
  nearPainting() {
    const { x, y } = this.player;
    return this.hung.find((p) => {
      const byWall = p.wall === 'left' ? x < MIN_X + 14 : x > MAX_X - 14;
      return byWall && Math.abs(y - 6 - (Y0 + p.uc)) < (p.art.u1 - p.art.u0) / 2 + 16;
    });
  }

  view(p) {
    this.target = null;
    this.pendingView = null;
    this.face(p.wall === 'left' ? -1 : 1, 0);
    const list = [...this.hung].sort((a, b) => (a.wall === b.wall ? a.slot - b.slot : a.wall === 'left' ? -1 : 1));
    this.input.enabled = false;
    this.bubble.setVisible(false);
    openViewer(list, list.indexOf(p), () => {
      this.input.enabled = true;
    });
  }

  face(vx, vy) {
    if (Math.abs(vx) > Math.abs(vy)) {
      this.player.setTexture('player_side').setFlipX(vx < 0);
    } else if (vy !== 0) {
      this.player.setTexture(vy < 0 ? 'player_up' : 'player_down').setFlipX(false);
    }
  }

  update(_, dtMs) {
    if (!this.input.enabled) return; // viewer is open
    const dt = dtMs / 1000;
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
        this.face(dx, dy);
      }
    }

    const len = Math.hypot(vx, vy);
    if (len > 0) {
      this.player.x = Phaser.Math.Clamp(this.player.x + (vx / len) * SPEED * dt, MIN_X, MAX_X);
      this.player.y = Phaser.Math.Clamp(this.player.y + (vy / len) * SPEED * dt, MIN_Y, MAX_Y);
      this.face(vx, vy);
    }

    const near = this.nearPainting();
    this.bubble.setVisible(!!near);
    if (near) this.bubble.setPosition(Math.round(this.player.x), Math.round(this.player.y - 30));
    if (near && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) {
      this.view(near);
    }
  }
}
