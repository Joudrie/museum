import Phaser from 'phaser';
import { T, makeTextures } from './textures.js';
import { PAINTINGS } from './paintings.js';
import { openViewer } from './viewer.js';

// Room layout, in tiles. Portrait: the hallway runs top to bottom.
//   cols 0-1  left wall (2 tiles)
//   cols 2-6  floor (5 tiles)
//   cols 7-8  right wall (2 tiles)
//   row 0     ceiling, rows 1-2 back wall, last row front edge + door
const COLS = 9;
const ROWS = 28;
const FLOOR_X0 = 2;
const FLOOR_X1 = 6;
const FLOOR_Y0 = 3;
const FLOOR_Y1 = ROWS - 2;
const DOOR_COL = 4;
const SLOT_ROWS = [7, 14, 21]; // three painting slots per side wall

const SPEED = 64; // px per second (4 tiles/s)
const DRAG_THRESHOLD = 10; // screen px before a press becomes a drag
const SQUISH = 0.5; // side-wall paintings are drawn narrower to fake the angle
const MAX_W = 22;
const MAX_H = 40;

const WORLD_W = COLS * T;
const WORLD_H = ROWS * T;
const MIN_X = FLOOR_X0 * T + 5;
const MAX_X = (FLOOR_X1 + 1) * T - 5;
const MIN_Y = FLOOR_Y0 * T + 8;
const MAX_Y = (FLOOR_Y1 + 1) * T - 1;

// Deterministic "random" so the mess is the same every load.
const rand = (x, y) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

export class RoomScene extends Phaser.Scene {
  constructor() {
    super('room');
  }

  preload() {
    this.load.setCORS('anonymous');
    PAINTINGS.forEach((p) => this.load.image(`art_${p.id}`, p.src));
  }

  create() {
    makeTextures(this);
    this.buildRoom();
    this.hung = PAINTINGS.map((p) => this.hangPainting(p));
    this.drawEmptySlots();

    this.player = this.add.sprite((DOOR_COL + 0.5) * T, (FLOOR_Y1 - 1) * T, 'player_up');
    this.player.setOrigin(0.5, 0.9).setDepth(10);

    this.bubble = this.add
      .text(0, 0, '!', { fontFamily: 'monospace', fontSize: '10px', color: '#fff3c4', stroke: '#1d1714', strokeThickness: 3 })
      .setOrigin(0.5, 1)
      .setDepth(20)
      .setResolution(4)
      .setVisible(false);

    this.setupCamera();
    this.setupInput();
  }

  buildRoom() {
    const put = (key, col, row) => this.add.image(col * T, row * T, key).setOrigin(0);

    for (let c = 0; c < COLS; c++) put('ceiling', c, 0);

    for (let c = FLOOR_X0; c <= FLOOR_X1; c++) {
      put('wall_top', c, 1);
      put('wall_low', c, 2);
    }

    for (let r = 1; r < ROWS - 1; r++) {
      put('side_l_out', 0, r);
      put('side_l_base', 1, r);
      put('side_r_base', 7, r);
      put('side_r_out', 8, r);
    }

    for (let r = FLOOR_Y0; r <= FLOOR_Y1; r++) {
      for (let c = FLOOR_X0; c <= FLOOR_X1; c++) {
        const n = rand(c, r);
        put(n < 0.12 ? 'floor_crack' : n < 0.22 ? 'floor_dirt' : 'floor', c, r);
      }
    }

    for (let c = 0; c < COLS; c++) put(c === DOOR_COL ? 'doormat' : 'front', c, ROWS - 1);

    // Water stains for the run-down look.
    [[3, 1], [5, 2], [0, 10], [1, 17], [8, 4], [7, 11], [8, 24]].forEach(([c, r]) =>
      put('stain', c, r).setAlpha(0.9),
    );
  }

  // Box for a painting on a side wall, in world px.
  slotBox(wall, slot, ratio) {
    let w = MAX_W;
    let h = w / (ratio * SQUISH);
    if (h > MAX_H) {
      h = MAX_H;
      w = h * ratio * SQUISH;
    }
    const cx = wall === 'left' ? T + 1 : WORLD_W - T - 1;
    const cy = (SLOT_ROWS[slot] + 0.5) * T;
    return new Phaser.Geom.Rectangle(cx - w / 2, cy - h / 2, w, h);
  }

  hangPainting(p) {
    const box = this.slotBox(p.wall, p.slot, p.ratio);
    const key = this.paintingTexture(p);

    const g = this.add.graphics();
    // shadow toward the floor side
    g.fillStyle(0x000000, 0.25);
    g.fillRect(box.x + (p.wall === 'left' ? 2 : -2), box.y + 2, box.width, box.height);
    // gold frame
    g.fillStyle(0x5b4216, 1);
    g.fillRect(box.x - 3, box.y - 3, box.width + 6, box.height + 6);
    g.fillStyle(0xc9a23f, 1);
    g.fillRect(box.x - 2, box.y - 2, box.width + 4, box.height + 4);
    g.fillStyle(0xe8c867, 1);
    g.fillRect(box.x - 2, box.y - 2, box.width + 4, 1);

    this.add.image(box.centerX, box.centerY, key).setDisplaySize(box.width, box.height);

    return { ...p, box };
  }

  // A smoothly downscaled copy of the painting so it stays crisp next to
  // pixel art. Falls back to a flat placeholder if the image didn't load.
  paintingTexture(p) {
    const key = `thumb_${p.id}`;
    const h = 160;
    const w = Math.round(h * p.ratio);
    const tex = this.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    const src = this.textures.exists(`art_${p.id}`) && this.textures.get(`art_${p.id}`).getSourceImage();
    if (src && src.width > 1) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, w, h);
    } else {
      ctx.fillStyle = p.placeholder;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(0, h * 0.55, w, 2);
    }
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    return key;
  }

  // Faded patches where paintings used to hang.
  drawEmptySlots() {
    const g = this.add.graphics();
    ['left', 'right'].forEach((wall) =>
      SLOT_ROWS.forEach((_, slot) => {
        if (PAINTINGS.some((p) => p.wall === wall && p.slot === slot)) return;
        const box = this.slotBox(wall, slot, 1.3);
        g.fillStyle(0xd2ccc0, 0.7);
        g.fillRect(box.x, box.y, box.width, box.height);
        g.fillStyle(0x3b2f27, 1);
        g.fillRect(Math.round(box.centerX), Math.round(box.y) - 2, 1, 1);
      }),
    );
  }

  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, WORLD_W, WORLD_H);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 1, 0.15);
    this.fitCamera();
    this.scale.on('resize', () => this.fitCamera());
  }

  // Always show the full 9-tile width; height scrolls.
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
      this.press = { x: p.x, y: p.y };
      this.dragging = false;
    });

    this.input.on('pointermove', (p) => {
      if (!this.press || !p.isDown) return;
      const dx = p.x - this.press.x;
      const dy = p.y - this.press.y;
      if (!this.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        this.dragging = true;
        this.target = null;
        this.pendingView = null;
        this.showStick(this.press.x, this.press.y);
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

  showStick(x, y) {
    const rect = this.game.canvas.getBoundingClientRect();
    this.stick.style.left = `${rect.left + x}px`;
    this.stick.style.top = `${rect.top + y}px`;
    this.stick.classList.add('active');
    this.moveKnob(0, 0);
  }

  moveKnob(dx, dy) {
    const max = 36;
    const len = Math.hypot(dx, dy);
    const k = len > max ? max / len : 1;
    this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    this.dragVec = len > 0 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
  }

  onTap(wx, wy) {
    const hit = this.hung.find((p) => Phaser.Geom.Rectangle.Contains(Phaser.Geom.Rectangle.Inflate(Phaser.Geom.Rectangle.Clone(p.box), 6, 6), wx, wy));
    if (hit) {
      if (this.nearPainting() === hit) return this.view(hit);
      this.target = { x: hit.wall === 'left' ? MIN_X : MAX_X, y: Phaser.Math.Clamp(hit.box.centerY + 6, MIN_Y, MAX_Y) };
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
      const byWall = p.wall === 'left' ? x < MIN_X + 8 : x > MAX_X - 8;
      return byWall && Math.abs(y - 6 - p.box.centerY) < p.box.height / 2 + 10;
    });
  }

  view(p) {
    this.target = null;
    this.pendingView = null;
    this.face(p.wall === 'left' ? -1 : 1, 0);
    const list = [...this.hung].sort((a, b) => (a.wall === b.wall ? a.slot - b.slot : a.wall === 'left' ? -1 : 1));
    this.input.enabled = false;
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
        if (this.pendingView) this.view(this.pendingView);
      } else {
        vx = dx / dist;
        vy = dy / dist;
        const step = Math.min(SPEED * dt, dist);
        this.player.x += vx * step;
        this.player.y += vy * step;
        this.face(vx, vy);
        vx = vy = 0;
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
    if (near) this.bubble.setPosition(Math.round(this.player.x), Math.round(this.player.y - 15));
    if (near && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) {
      this.view(near);
    }
  }
}
