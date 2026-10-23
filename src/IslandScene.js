// The island outside the museum. Walk out of the entrance and you're standing
// on the steps in front of the museum's doors; walk back up into the doors to
// go inside. For now it's just for walking around: beaches, a pond, a cliff
// with stairs, tall grass, palms and a dock where expeditions will leave from.
import Phaser from 'phaser';
import { buildTiles, T } from './tiles.js';
import { makeCharacter } from './art.js';
import { load } from './decor.js';
import { DEFAULT_CHARACTER } from './decor.js';
import { showTalk, hideTalk, talking } from './talk.js';
import { iconSvg } from './icons.js';
import { sfx, setTrack } from './music.js';
import { ambientAt } from './lighting.js';
import { settings, hourNow } from './settings.js';

const W = 24; // map size in tiles
const H = 40;
const VIEW_TILES = 9;
const SPEED = 176;
const PLAYER_SCALE = 1.15;
const STEP_MS = 260; // animation frame time
const DOOR = { x: 12 * T, y: 8 * T }; // the museum's front doors (bottom middle of the building)

const hash = (x, y, s = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

let TILES = null; // built once, shared

export class IslandScene extends Phaser.Scene {
  constructor() {
    super('island');
  }

  create() {
    TILES = TILES || buildTiles();
    document.body.classList.add('outside');
    this.events.once('shutdown', () => document.body.classList.remove('outside'));
    setTrack('none');
    this.frame = 0;
    this.solid = Array.from({ length: H }, () => Array(W).fill(false));
    this.animated = []; // images whose texture changes every frame
    this.things = []; // signs and chests you can interact with

    this.makeMap();
    this.drawGround();
    this.placeMuseum();
    this.placeThings();

    const ch = { ...DEFAULT_CHARACTER, ...load('curation.character', {}) };
    if (!this.textures.exists('player_down')) makeCharacter(this, 'player', ch, {});
    this.player = this.add.sprite(DOOR.x, DOOR.y + 22, 'player_down').setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    this.shadow = this.add.ellipse(0, 0, 18, 6, 0x000000, 0.25).setDepth(0.5);
    this.doorLock = true; // don't walk straight back in

    // Time of day: the same ambient light as inside, without the lamps.
    if (settings().dayNight && settings().lights !== 'off') {
      const [r, g, b] = ambientAt(hourNow());
      this.add.rectangle(0, 0, W * T, H * T, (r << 16) | (g << 8) | b).setOrigin(0).setDepth(5000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    }

    this.setupCamera();
    this.setupInput();
    this.time.addEvent({ delay: STEP_MS, loop: true, callback: () => this.tick() });
    this.cameras.main.fadeIn(300, 29, 21, 18);
    this.toast('The island · walk back into the doors to go inside');
  }

  // ---------- The map ----------
  // Corner materials: 0 water, 1 sand, 2 grass, 3 pond water.
  makeMap() {
    const c = [];
    for (let y = 0; y <= H; y++) {
      c.push([]);
      for (let x = 0; x <= W; x++) {
        const d = Math.hypot((x - W / 2) / (W * 0.46), (y - H * 0.5) / (H * 0.47)) + (hash(x, y, 1) - 0.5) * 0.12 + (hash(x >> 2, y >> 2, 2) - 0.5) * 0.1;
        let m = d < 0.74 ? 2 : d < 0.97 ? 1 : 0;
        if (x >= 6 && x <= 18 && y >= 2 && y <= 12) m = 2; // the museum's lawn
        if (x >= 6 && x <= 9 && y >= 17 && y <= 20) m = 3; // a pond
        if (x >= 11 && x <= 13 && y >= 33 && y <= 40) m = Math.min(m, 1); // sandy path to the dock
        c[y].push(m);
      }
    }
    // grass never touches the sea directly: there's always a bit of beach
    for (let y = 0; y <= H; y++)
      for (let x = 0; x <= W; x++) {
        if (c[y][x] !== 2) continue;
        const sea = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => c[y + dy]?.[x + dx] === 0);
        if (sea) c[y][x] = 1;
      }
    // the dirt path from the doors down to the beach (4 = path, on grass)
    for (let y = 9; y <= 31; y++) for (const x of [12, 13]) if (c[y][x] === 2) c[y][x] = 4;
    this.corners = c;
  }

  key(x, y, test) {
    const c = this.corners;
    return [c[y][x], c[y][x + 1], c[y + 1][x], c[y + 1][x + 1]].map((m) => (test(m) ? 1 : 0)).join('');
  }

  // The ground is drawn into one big picture per animation frame.
  drawGround() {
    this.groundKeys = [];
    for (let f = 0; f < 4; f++) {
      const key = `island_ground_${f}`;
      if (this.textures.exists(key)) this.textures.remove(key);
      const tex = this.textures.createCanvas(key, W * T, H * T);
      const ctx = tex.getContext();
      ctx.imageSmoothingEnabled = false;
      const put = (name, x, y) => {
        const t = TILES[name];
        if (t) ctx.drawImage(t.frames[f % t.frames.length], x * T, y * T);
      };
      for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
          put((x * 7 + y * 3) % 5 ? 'sand_1' : 'sand_2', x, y);
          const shore = this.key(x, y, (m) => m === 0);
          if (shore === '1111') put('water', x, y);
          else if (shore !== '0000') put(`shore_${shore}`, x, y);
          const grass = this.key(x, y, (m) => m >= 2);
          const path = this.key(x, y, (m) => m === 4);
          if (path !== '0000') {
            // the path: dirt with the grass growing over its edges
            put('dirt_1', x, y);
            const g = this.key(x, y, (m) => m === 2 || m === 3);
            if (g !== '0000') put(`grass_dirt_${g}`, x, y);
          } else if (grass === '1111') put(['grass_1', 'grass_2', 'grass_1', 'grass_3'][(x * 3 + y * 5) % 4], x, y);
          else if (grass !== '0000') put(`grass_sand_${grass}`, x, y);
          const pond = this.key(x, y, (m) => m === 3);
          if (pond === '1111') put('water', x, y);
          else if (pond !== '0000') put(`bank_${pond}`, x, y);
          // water you can't walk into (3+ corners wet)
          const wet = [...shore].filter((v) => v === '1').length;
          const pondWet = [...pond].filter((v) => v === '1').length;
          if (wet >= 3 || pondWet >= 3) this.solid[y][x] = true;
        }
      tex.refresh();
      this.groundKeys.push(key);
    }
    this.ground = this.add.image(0, 0, this.groundKeys[0]).setOrigin(0).setDepth(0);
  }

  // A tile or object, standing on cell (x, y) (its bottom row), sorted by depth.
  place(name, x, y, opts = {}) {
    const t = TILES[name];
    const keys = t.frames.map((fr, i) => {
      const k = `isl_${name}_${i}`;
      if (!this.textures.exists(k)) this.textures.addCanvas(k, fr);
      return k;
    });
    const img = this.add.image(x * T, (y + 1) * T, keys[0]).setOrigin(0, 1);
    img.setDepth(opts.depth ?? (opts.flat ? 1 : (y + 1) * T - 2));
    if (keys.length > 1) this.animated.push({ img, keys });
    if (opts.solid !== false && ['block', 'push'].includes(t.walk)) {
      const wide = Math.max(1, Math.round(t.w / T));
      for (let i = 0; i < wide; i++) this.block(x + i, y);
    }
    return img;
  }

  block(x, y) {
    if (y >= 0 && y < H && x >= 0 && x < W) this.solid[y][x] = true;
  }

  // The museum's front: stone, columns, a pediment and double doors.
  placeMuseum() {
    const key = 'island_museum';
    if (!this.textures.exists(key)) {
      const w = 8 * T;
      const h = 6 * T;
      const tex = this.textures.createCanvas(key, w, h);
      const g = tex.getContext();
      const R = (x, y, rw, rh, c) => {
        g.fillStyle = c;
        g.fillRect(x, y, rw, rh);
      };
      // pediment (the triangle roof)
      g.fillStyle = '#20201a';
      g.beginPath();
      g.moveTo(4, 52);
      g.lineTo(w / 2, 6);
      g.lineTo(w - 4, 52);
      g.fill();
      g.fillStyle = '#e8e2d4';
      g.beginPath();
      g.moveTo(12, 48);
      g.lineTo(w / 2, 12);
      g.lineTo(w - 12, 48);
      g.fill();
      g.fillStyle = '#cfc6b4';
      g.beginPath();
      g.moveTo(30, 44);
      g.lineTo(w / 2, 22);
      g.lineTo(w - 30, 44);
      g.fill();
      R(0, 50, w, 10, '#20201a');
      R(2, 51, w - 4, 8, '#f0ece2');
      // walls
      R(6, 60, w - 12, h - 84, '#20201a');
      R(8, 60, w - 16, h - 86, '#d8d0be');
      for (let y = 66; y < h - 26; y += 8) R(8, y, w - 16, 1, '#bfb5a2');
      // sign
      R(w / 2 - 44, 30, 88, 14, '#20201a');
      R(w / 2 - 42, 31, 84, 12, '#3e2a20');
      g.fillStyle = '#f2d36b';
      g.font = 'bold 9px monospace';
      g.textAlign = 'center';
      g.fillText('CURATION', w / 2, 41);
      // columns
      [20, 58, 198, 236].forEach((x) => {
        R(x - 8, 60, 16, h - 86, '#20201a');
        R(x - 7, 60, 14, h - 86, '#f4f0e6');
        R(x - 7, 60, 4, h - 86, '#ffffff');
        R(x + 3, 60, 3, h - 86, '#cfc6b4');
        R(x - 10, 60, 20, 4, '#e8e2d4');
        R(x - 10, h - 30, 20, 4, '#e8e2d4');
      });
      // windows with a warm glow
      [96, 160].forEach((x) => {
        R(x - 12, 76, 24, 34, '#20201a');
        R(x - 10, 78, 20, 30, '#f2c86a');
        R(x - 1, 78, 2, 30, '#20201a');
        R(x - 10, 92, 20, 2, '#20201a');
      });
      // double doors (open: the warm hall shows through)
      R(w / 2 - 22, h - 72, 44, 46, '#20201a');
      R(w / 2 - 20, h - 70, 40, 44, '#f2d9a0');
      R(w / 2 - 20, h - 70, 9, 44, '#7a4f39');
      R(w / 2 + 11, h - 70, 9, 44, '#7a4f39');
      R(w / 2 - 12, h - 58, 24, 30, '#e8c070');
      // steps
      for (let i = 0; i < 3; i++) {
        R(w / 2 - 40 - i * 8, h - 26 + i * 8, 80 + i * 16, 8, '#20201a');
        R(w / 2 - 39 - i * 8, h - 25 + i * 8, 78 + i * 16, 6, i % 2 ? '#e8e2d4' : '#d8d0be');
      }
      tex.refresh();
    }
    this.add.image(DOOR.x, DOOR.y + 8, key).setOrigin(0.5, 1).setDepth(DOOR.y);
    // the building is solid, the steps and doorway are not
    for (let y = 2; y <= 7; y++) for (let x = 8; x <= 15; x++) if (!(y === 7 && x >= 11 && x <= 12)) this.block(x, y);
  }

  placeThings() {
    // beach and lawn
    [[3, 13], [20, 14], [2, 26], [21, 27], [7, 35], [17, 34]].forEach(([x, y]) => this.place('palm', x, y));
    [[4, 8], [19, 9]].forEach(([x, y]) => this.place('tree', x, y));
    [[18, 21], [20, 23]].forEach(([x, y]) => this.place('pine', x, y));
    [[9, 14], [16, 15], [6, 24], [18, 26]].forEach(([x, y]) => this.place('bush', x, y));
    for (let y = 22; y <= 25; y++) for (let x = 8; x <= 10; x++) if ((x + y) % 4) this.tallGrass(x, y);
    for (let y = 15; y <= 17; y++) for (let x = 14; x <= 17; x++) if ((x * y) % 3) this.tallGrass(x, y);
    [[10, 11], [14, 12], [7, 13], [16, 18], [11, 28]].forEach(([x, y]) => this.place('flowers', x, y, { flat: true }));
    this.place('mushrooms', 5, 22, { flat: true });
    this.place('lily', 7, 18, { flat: true });
    this.place('lily', 8, 19, { flat: true });
    this.place('rocks_pile', 4, 21);
    this.place('boulder', 15, 21);
    this.place('rock_small', 9, 30);
    this.place('rock_sand', 19, 31);
    this.place('dune_grass', 5, 30, { flat: true });
    this.place('dune_grass', 15, 32, { flat: true });
    this.place('shells', 8, 33, { flat: true });
    this.place('shells', 18, 29, { flat: true });
    this.place('dig_spot', 4, 28, { flat: true });
    this.place('water_rock', 1, 18);
    this.place('water_rock', 22, 36);
    this.place('bubbles', 2, 33, { flat: true });
    this.place('bubbles', 22, 12, { flat: true });
    // a rocky rise with stairs and a chest on top
    for (let x = 14; x <= 19; x++) {
      const end = x === 14 ? '_l' : x === 19 ? '_r' : '';
      this.place(`cliff_top${end}`, x, 26, { flat: true, solid: false });
      this.place(x === 16 ? 'cliff_stairs' : `cliff_face${end}`, x, 27, { flat: true, solid: x !== 16 });
      this.place(x === 16 ? 'cliff_stairs' : `cliff_base${end}`, x, 28, { flat: true, solid: x !== 16 });
      if (x !== 16) {
        this.block(x, 27);
        this.block(x, 28);
      }
    }
    this.thing('chest', 18, 25, 'A heavy chest, locked tight. Expeditions will turn up the keys.');
    // the dock at the south end
    for (let y = 36; y <= 39; y++) this.place('dock_v', 12, y, { flat: true });
    this.place('dock_post', 11, 38);
    this.place('dock_post', 13, 38);
    this.thing('sign', 13, 35, 'Expeditions leave from this dock. Pirate islands, shipwrecks, lost temples… coming soon!');
    this.thing('sign', 13, 9, 'Welcome to the island! The museum is right behind you. Walk up into the doors to go back in.');
  }

  tallGrass(x, y) {
    this.place('tall_grass', x, y, { flat: true });
    this.place('tall_grass_front', x, y, { depth: (y + 1) * T + 2 }); // drawn over your legs
  }

  thing(name, x, y, text) {
    this.place(name, x, y);
    this.things.push({ x: (x + 0.5) * T, y: (y + 1) * T + 10, text, name });
  }

  // ---------- Walking ----------
  setupCamera() {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W * T, H * T);
    cam.startFollow(this.player, true, 0.2, 0.2);
    const fit = () => {
      const { width, height } = this.scale.gameSize;
      cam.setSize(width, height);
      cam.setZoom(width / (VIEW_TILES * T));
    };
    fit();
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
    this.stick = document.getElementById('stick');
    this.knob = this.stick.querySelector('.knob');
    this.interactBtn = document.getElementById('interact');
    this.interactBtn.onclick = () => this.interact();
    const css = (p) => {
      const r = this.game.canvas.getBoundingClientRect();
      return { x: r.left + (p.x * r.width) / this.scale.gameSize.width, y: r.top + (p.y * r.height) / this.scale.gameSize.height };
    };
    this.input.on('pointerdown', (p) => {
      this.press = css(p);
      this.dragging = false;
    });
    this.input.on('pointermove', (p) => {
      if (!this.press || !p.isDown) return;
      const at = css(p);
      const dx = at.x - this.press.x;
      const dy = at.y - this.press.y;
      if (!this.dragging && Math.hypot(dx, dy) > 10) {
        this.dragging = true;
        this.stick.style.left = `${this.press.x}px`;
        this.stick.style.top = `${this.press.y}px`;
        this.stick.classList.add('active');
      }
      if (this.dragging) {
        const len = Math.hypot(dx, dy);
        const k = len > 36 ? 36 / len : 1;
        this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
        this.dragVec = len ? { x: dx / len, y: dy / len } : null;
      }
    });
    this.input.on('pointerup', () => {
      this.press = null;
      this.dragging = false;
      this.dragVec = null;
      this.stick.classList.remove('active');
    });
  }

  // Can the player's feet stand here?
  free(x, y) {
    const pts = [[x - 6, y - 2], [x + 6, y - 2], [x - 6, y - 7], [x + 6, y - 7]];
    return pts.every(([px, py]) => {
      const cx = Math.floor(px / T);
      const cy = Math.floor(py / T);
      return cx >= 0 && cy >= 0 && cx < W && cy < H && !this.solid[cy][cx];
    });
  }

  tick() {
    this.frame = (this.frame + 1) % 4;
    this.ground.setTexture(this.groundKeys[this.frame]);
    this.animated.forEach(({ img, keys }) => img.setTexture(keys[this.frame % keys.length]));
  }

  findFocus() {
    const { x, y } = this.player;
    let best = null;
    let bestD = 26;
    this.things.forEach((t) => {
      const d = Math.hypot(x - t.x, y - t.y);
      if (d < bestD) {
        best = { thing: t, icon: 'look' };
        bestD = d;
      }
    });
    const dd = Math.hypot(x - DOOR.x, y - (DOOR.y + 4));
    if (dd < 30 && dd < bestD) best = { door: true, icon: 'door' };
    return best;
  }

  interact() {
    const f = this.focus;
    if (!f || this.leaving) return;
    if (f.door) return this.goInside();
    if (talking()) return hideTalk();
    sfx('talk');
    const r = this.game.canvas.getBoundingClientRect();
    const cam = this.cameras.main;
    const k = r.width / this.scale.gameSize.width;
    showTalk(f.thing.name === 'chest' ? 'Treasure chest' : 'Sign', 'The island', f.thing.text, { x: r.left + (f.thing.x - cam.worldView.x) * cam.zoom * k, y: r.top + (f.thing.y - 30 - cam.worldView.y) * cam.zoom * k });
  }

  goInside() {
    if (this.leaving) return;
    this.leaving = true;
    hideTalk();
    this.interactBtn.classList.add('hidden');
    sfx('door');
    this.cameras.main.fadeOut(220, 29, 21, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('room', { room: 0, spawn: 'outside' }));
  }

  toast(text) {
    const el = document.getElementById('toast');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
  }

  update(_, dtMs) {
    if (this.leaving) return;
    const dt = Math.min(dtMs, 50) / 1000;
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (!vx && !vy && this.dragging && this.dragVec) ({ x: vx, y: vy } = this.dragVec);
    const len = Math.hypot(vx, vy);
    const p = this.player;
    if (len) {
      const nx = p.x + (vx / len) * SPEED * dt;
      const ny = p.y + (vy / len) * SPEED * dt;
      if (this.free(nx, p.y)) p.x = nx;
      if (this.free(p.x, ny)) p.y = ny;
      if (Math.abs(vx) > Math.abs(vy)) p.setTexture('player_side').setFlipX(vx < 0);
      else p.setTexture(vy < 0 ? 'player_up' : 'player_down').setFlipX(false);
      p.walkT = (p.walkT || 0) + dt;
      const phase = Math.floor(p.walkT * 8) % 2;
      p.setOrigin(0.5, 1 + phase / 32);
      if (!p.texture.key.endsWith('_side')) p.setFlipX(phase === 1);
    } else {
      p.walkT = 0;
      p.setOrigin(0.5, 1);
      if (!p.texture.key.endsWith('_side')) p.setFlipX(false);
    }
    p.setDepth(p.y);
    this.shadow.setPosition(p.x, p.y - 1);
    // Walk up into the doors to go back inside.
    const atDoor = Math.abs(p.x - DOOR.x) < 20 && p.y < DOOR.y + 10;
    if (this.doorLock && !atDoor) this.doorLock = false;
    if (!this.doorLock && atDoor && vy < 0) return this.goInside();

    if (talking() && this.focus?.thing && Math.hypot(p.x - this.focus.thing.x, p.y - this.focus.thing.y) > 60) hideTalk();
    const prev = this.focus?.icon;
    this.focus = this.findFocus();
    this.interactBtn.classList.toggle('hidden', !this.focus);
    if (this.focus && this.focus.icon !== prev) this.interactBtn.querySelector('.bang').innerHTML = iconSvg(this.focus.icon);
    if (this.focus && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) this.interact();
  }
}
