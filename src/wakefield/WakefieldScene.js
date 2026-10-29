// Wakefield, Massachusetts, walkable. A personal project made with the museum game's engine and art,
// but not part of the game: its own page (wakefield.html), its own scene, nothing from the museum.
//
// The town is drawn from real shapes (public/wakefield/wakefield.vec.json, made by tools/wakefield/vector.py),
// not tiles. Roads are lines of their own width, buildings and lakes are polygons, and the town line is a
// polygon, so a road at 45 degrees is a straight 45 degree line and nothing ever straddles two things.
// Dirt, brick, grass and water are painted inside those shapes with the engine's tile art as the fill,
// anchored to the town so the ground never shows a seam.
import Phaser from 'phaser';
import { buildTiles } from '../tiles.js';
import { makeCharacter } from '../art.js';
import { load } from '../storage.js';
import { S, T, FONT, worldFor } from './world.js';

const SPEED = 528; // px a second: the town is 6 km long, so this is three times the museum's pace
const VIEW_TILES = 9; // tiles across the screen
const SAND = '#e2c68a';
const BRICK_EDGE = '#6e2f25';
const TILE_Z = 19; // the real map's zoom: its biggest, about 0.2 m a pixel
const POI_SIZE = { 1: 15, 2: 20, 3: 26 }; // named places: shops 15, schools and churches 20, lakes and parks 26
const POI_COLOR = ['#ffffff', '#d6ffbd', '#cfe9ff', '#ffe9a8']; // shop, park, water, civic
// the pictures that can lie over the town, each placed by its own coordinates
const LAYERS = {
  street: { url: (z, i, j) => `https://tile.openstreetmap.org/${z}/${i}/${j}.png`, credit: '© OpenStreetMap contributors' },
  sat: { url: (z, i, j) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${j}/${i}`, credit: 'Imagery © Esri, Maxar, Earthstar Geographics' },
};
const POS = 'wakefield.pos';
const MARK_W = 4; // world px (0.5 m): how wide a painted line is drawn
const PAINT = { w: '#f3f3ec', y: '#f2c12e' };
const DEFAULT_CHARACTER = { h: '#4a2e20', s: '#f2c6a0', c: '#7a2e3a', p: '#2f2b3d', b: '#1a1418', w: '#efe6d4', g: '#c9a23f', hair: 'short', outfit: 'suit' };

const pref = {
  get: (k, d) => {
    try {
      const v = localStorage.getItem(`wakefield.${k}`);
      return v === null ? d : v === '1';
    } catch {
      return d;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(`wakefield.${k}`, v ? '1' : '0');
    } catch {
      // fine
    }
  },
};
const $ = (id) => document.getElementById(id);

export class WakefieldScene extends Phaser.Scene {
  constructor() {
    super('wakefield');
  }

  init(data) {
    this.vec = data.vec;
  }

  create() {
    this.world = worldFor(this.vec);
    this.tiles = buildTiles();
    this.src = this.sources();
    this.chunks = new Map();
    this.groundAnim = new Set();
    this.chunkRange = '';
    this.frame = 0;
    this.cameras.main.setBackgroundColor('#2b5f93');

    const ch = { ...DEFAULT_CHARACTER, ...load('curation.character', {}) }; // your own character, if you made one
    if (!this.textures.exists('player_down')) makeCharacter(this, 'player', ch, {});
    const at = this.startPoint();
    this.player = this.add.sprite(at.x, at.y, 'player_down').setOrigin(0.5, 1).setScale(1.15);
    this.shadow = this.add.ellipse(0, 0, 18, 6, 0x000000, 0.25).setDepth(0.5);
    this.facing = 'down';

    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.world.w, this.world.h);
    cam.startFollow(this.player, true, 0.2, 0.2);
    const fit = () => {
      const { width, height } = this.scale.gameSize;
      cam.setSize(width, height);
      cam.setZoom(width / (VIEW_TILES * T));
    };
    fit();
    this.scale.on('resize', fit);

    this.setupInput();
    this.setupButtons();
    this.streamChunks();
    this.time.addEvent({
      delay: 250, // the water ebbs
      loop: true,
      callback: () => {
        this.frame = (this.frame + 1) % 4;
        this.groundAnim.forEach(({ img, keys }) => img.setTexture(keys[this.frame]));
      },
    });
    this.time.addEvent({ delay: 2000, loop: true, callback: () => this.savePos() });
    window.addEventListener('pagehide', () => this.savePos());
    $('loading')?.remove();
  }

  // where you left off, or the start on Main Street (a position saved before the start moved is forgotten)
  startPoint() {
    const [sx, sy] = this.world.spawn;
    try {
      const { at, from } = JSON.parse(localStorage.getItem(POS) || 'null') || {};
      if (from?.[0] === sx && from?.[1] === sy && this.world.walkable(at[0], at[1])) return { x: at[0], y: at[1] };
    } catch {
      // the first time
    }
    return { x: sx, y: sy };
  }

  savePos() {
    try {
      localStorage.setItem(POS, JSON.stringify({ at: [Math.round(this.player.x), Math.round(this.player.y)], from: this.world.spawn }));
    } catch {
      // fine
    }
  }

  toast(text) {
    const el = $('toast');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  // ---------- walking ----------
  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    const stick = $('stick');
    const knob = stick.querySelector('.knob');
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
      const [dx, dy] = [at.x - this.press.x, at.y - this.press.y];
      if (!this.dragging && Math.hypot(dx, dy) > 10) {
        this.dragging = true;
        stick.style.left = `${this.press.x}px`;
        stick.style.top = `${this.press.y}px`;
        stick.classList.add('active');
      }
      if (this.dragging) {
        const len = Math.hypot(dx, dy);
        const k = len > 36 ? 36 / len : 1;
        knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
        this.dragVec = len ? { x: dx / len, y: dy / len } : null;
        this.dragMag = Math.min(1, len / 36); // a short drag walks, a long one runs
      }
    });
    this.input.on('pointerup', () => {
      this.press = null;
      this.dragging = false;
      this.dragVec = null;
      stick.classList.remove('active');
    });
  }

  // can the character's feet stand here?
  free(x, y) {
    return [[x - 6, y - 2], [x + 6, y - 2], [x - 6, y - 7], [x + 6, y - 7]].every(([px, py]) => this.world.walkable(px, py));
  }

  update(_, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000;
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    let pace = 1;
    if (!vx && !vy && this.dragging && this.dragVec) {
      ({ x: vx, y: vy } = this.dragVec);
      pace = this.dragMag > 0.7 ? 1 : 0.62;
    }
    const len = Math.hypot(vx, vy);
    const p = this.player;
    if (len) {
      const nx = p.x + (vx / len) * SPEED * pace * dt;
      const ny = p.y + (vy / len) * SPEED * pace * dt;
      if (this.free(nx, p.y)) p.x = nx;
      if (this.free(p.x, ny)) p.y = ny;
      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = 'side';
        this.base = 'player_side';
        p.setFlipX(vx < 0);
      } else {
        this.facing = vy < 0 ? 'up' : 'down';
        this.base = `player_${this.facing}`;
        p.setFlipX(false);
      }
    }
    // a walking step: stand, left foot, stand, right foot
    this.walkT = len ? (this.walkT || 0) + dt * (0.8 + pace * 0.5) * 1.6 : 0;
    const phase = Math.floor(this.walkT * 8) % 4;
    const base = this.base || 'player_down';
    const want = len && phase === 1 ? `${base}_1` : len && phase === 3 ? `${base}_2` : base;
    if (p.texture.key !== want && this.textures.exists(want)) p.setTexture(want);
    p.setOrigin(0.5, len ? 1 + (phase % 2) / 32 : 1);
    p.setDepth(p.y);
    this.shadow.setPosition(p.x, p.y - 1);
    this.streamChunks();
    this.streamTiles();
  }

  // ---------- the ground ----------
  // the tile art, as fills that line up across the whole town
  sources() {
    const TILES = this.tiles;
    const make = (size, draw) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      draw(c.getContext('2d'));
      return c;
    };
    const hash = (x, y) => {
      const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };
    return {
      grass: make(256, (g) => {
        for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) g.drawImage(TILES[['grass_1', 'grass_2', 'grass_1', 'grass_3'][Math.floor(hash(x, y) * 4)]].frames[0], x * T, y * T);
      }),
      road: TILES.rock_1.frames[0], // the greyest stone there is: roads and parking lots
      walk: TILES.path_flagstone.frames[0], // lighter, for sidewalks
      brick: TILES.brick.frames[0],
      rail: TILES.dirt_2.frames[0], // gravel for the railway
      water: TILES.water.frames,
    };
  }

  paintChunk(ctx, cx, cy, f) {
    const { world, src } = this;
    const [x0, y0] = [cx * S, cy * S];
    const pat = (img) => ctx.createPattern(img, 'repeat');
    const cls = world.chunkClass(cx, cy);
    const b = world.bucket(cx, cy);
    ctx.translate(1 - x0, 1 - y0); // the fills are anchored to the town, and each chunk has a 1 px margin, so chunks meet with no seam
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (cls !== 'in') {
      ctx.fillStyle = pat(src.water[f % src.water.length]);
      ctx.fillRect(x0 - 1, y0 - 1, S + 2, S + 2);
    }
    if (cls === 'out') return;
    if (cls === 'edge') {
      ctx.strokeStyle = SAND; // a beach along the town line, half of it outside
      ctx.lineWidth = 18;
      ctx.stroke(world.townPath);
      ctx.save();
      ctx.clip(world.townPath);
    }
    ctx.fillStyle = pat(src.grass);
    ctx.fillRect(x0 - 1, y0 - 1, S + 2, S + 2);
    b.lakes.forEach((l) => {
      ctx.beginPath();
      l.rings.forEach((r) => {
        r.forEach((v, i) => (i % 2 ? null : i ? ctx.lineTo(v, r[i + 1]) : ctx.moveTo(v, r[i + 1])));
        ctx.closePath();
      });
      ctx.strokeStyle = SAND;
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.fillStyle = pat(src.water[f % src.water.length]);
      ctx.fill('evenodd');
    });
    const line = (r) => {
      ctx.moveTo(r.p[0], r.p[1]);
      for (let i = 2; i < r.p.length; i += 2) ctx.lineTo(r.p[i], r.p[i + 1]);
    };
    b.rivers.forEach((r) => {
      ctx.beginPath();
      line(r);
      ctx.strokeStyle = SAND;
      ctx.lineWidth = r.w + 12;
      ctx.stroke();
      ctx.strokeStyle = pat(src.water[f % src.water.length]);
      ctx.lineWidth = r.w;
      ctx.stroke();
    });
    ctx.strokeStyle = pat(src.rail);
    b.rail.forEach((r) => {
      ctx.beginPath();
      line(r);
      ctx.lineWidth = r.w;
      ctx.stroke();
    });
    // roads, narrow to wide (the bucket keeps that order), one stroke per width
    ctx.strokeStyle = pat(src.road);
    let i = 0;
    while (i < b.roads.length) {
      const w = b.roads[i].w;
      ctx.beginPath();
      for (; i < b.roads.length && b.roads[i].w === w; i++) line(b.roads[i]);
      ctx.lineWidth = w;
      ctx.stroke();
    }
    // streets, parking lots and sidewalks measured from the satellite photos (Main Street and the roads off it)
    ctx.lineJoin = 'round';
    b.pave.forEach((g) => {
      ctx.beginPath();
      g.rings.forEach((r) => {
        r.forEach((v, i) => (i % 2 ? null : i ? ctx.lineTo(v, r[i + 1]) : ctx.moveTo(v, r[i + 1])));
        ctx.closePath();
      });
      ctx.fillStyle = pat(g.kind === 'walks' ? src.walk : src.road);
      ctx.fill('evenodd');
    });
    // painted lines on the streets, and crosswalks
    if (b.marks.length) {
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'round';
      ctx.lineWidth = MARK_W;
      ['w', 'y'].forEach((k) => {
        ctx.beginPath();
        b.marks.forEach((m) => {
          if (m.k !== k) return;
          ctx.moveTo(m.p[0], m.p[1]);
          for (let i = 2; i < m.p.length; i += 2) ctx.lineTo(m.p[i], m.p[i + 1]);
        });
        ctx.strokeStyle = PAINT[k];
        ctx.stroke();
      });
      ctx.lineCap = 'round';
    }
    ctx.beginPath();
    b.buildings.forEach((p) => {
      ctx.moveTo(p[0], p[1]);
      for (let k = 2; k < p.length; k += 2) ctx.lineTo(p[k], p[k + 1]);
      ctx.closePath();
    });
    ctx.fillStyle = pat(src.brick);
    ctx.fill();
    ctx.strokeStyle = BRICK_EDGE;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'miter';
    ctx.stroke();
    if (cls === 'edge') ctx.restore();
  }

  // street and place names, on a layer of their own above any picture laid over the town
  paintLabels(ctx, cx, cy) {
    const b = this.world.bucket(cx, cy);
    ctx.translate(1 - cx * S, 1 - cy * S);
    if (this.showNames && b.labels.length) {
      ctx.font = `bold ${FONT}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      b.labels.forEach(([text, x, y, a]) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a / 1000);
        ctx.strokeStyle = 'rgba(40, 25, 10, 0.92)';
        ctx.strokeText(text, 0, 0);
        ctx.fillStyle = '#fff';
        ctx.fillText(text, 0, 0);
        ctx.restore();
      });
    }
    if (this.showNames && b.pois.length) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      b.pois.forEach(([text, x, y, tier, kind]) => {
        ctx.font = `bold ${POI_SIZE[tier]}px sans-serif`;
        ctx.strokeStyle = 'rgba(30, 20, 10, 0.92)';
        ctx.strokeText(text, x, y);
        ctx.fillStyle = POI_COLOR[kind];
        ctx.fillText(text, x, y);
      });
    }
  }

  buildChunk(cx, cy) {
    const b = this.world.bucket(cx, cy);
    const frames = this.world.chunkClass(cx, cy) !== 'in' || b.lakes.length || b.rivers.length ? 4 : 1; // the water ebbs
    const keys = Array.from({ length: frames }, (_, f) => {
      const key = `wk_${cx}_${cy}_${f}`;
      if (this.textures.exists(key)) this.textures.remove(key);
      const tex = this.textures.createCanvas(key, S + 2, S + 2);
      this.paintChunk(tex.getContext(), cx, cy, f);
      tex.refresh();
      return key;
    });
    const img = this.add.image(cx * S - 1, cy * S - 1, keys[0]).setOrigin(0).setDepth(0);
    const entry = { img, keys, cx, cy, lab: null };
    if (this.showNames && (b.labels.length || b.pois.length)) {
      const key = `wl_${cx}_${cy}`;
      if (this.textures.exists(key)) this.textures.remove(key);
      const tex = this.textures.createCanvas(key, S + 2, S + 2);
      this.paintLabels(tex.getContext(), cx, cy);
      tex.refresh();
      entry.lab = { key, img: this.add.image(cx * S - 1, cy * S - 1, key).setOrigin(0).setDepth(0.6) }; // over the ground and any picture, under you
    }
    if (keys.length > 1) this.groundAnim.add(entry);
    this.chunks.set(`${cx},${cy}`, entry);
  }

  dropChunk(e) {
    this.groundAnim.delete(e);
    e.img.destroy();
    if (e.lab) {
      e.lab.img.destroy();
      this.textures.remove(e.lab.key);
    }
    e.keys.forEach((k) => this.textures.remove(k));
    this.chunks.delete(`${e.cx},${e.cy}`);
  }

  // make the ground around the player, and let go of the far ground
  streamChunks() {
    const cam = this.cameras.main;
    const hw = this.scale.gameSize.width / cam.zoom / 2;
    const hh = this.scale.gameSize.height / cam.zoom / 2;
    const { x, y } = this.player;
    const [nx, ny] = [Math.ceil(this.world.w / S) - 1, Math.ceil(this.world.h / S) - 1];
    const x0 = Math.max(0, Math.floor((x - hw) / S) - 1);
    const x1 = Math.min(nx, Math.floor((x + hw) / S) + 1);
    const y0 = Math.max(0, Math.floor((y - hh) / S) - 1);
    const y1 = Math.min(ny, Math.floor((y + hh) / S) + 1);
    const range = `${x0},${x1},${y0},${y1}`;
    if (range === this.chunkRange) return;
    this.chunkRange = range;
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) if (!this.chunks.has(`${cx},${cy}`)) this.buildChunk(cx, cy);
    [...this.chunks.values()].forEach((e) => (e.cx < x0 - 2 || e.cx > x1 + 2 || e.cy < y0 - 2 || e.cy > y1 + 2) && this.dropChunk(e));
  }

  // ---------- buttons ----------
  // Aa: street and place names on and off. Map: a picture lying over the town, to judge how well the shapes
  // sit on it. It is the real map (as a GPS shows it) or the satellite view, at any strength.
  setupButtons() {
    this.showNames = pref.get('names', true);
    this.tileImgs = new Map();
    this.mapOn = false;
    this.layer = localStorage.getItem('wakefield.layer') === 'sat' ? 'sat' : 'street';
    this.alpha = Number(localStorage.getItem('wakefield.alpha')) || 0.7;
    const names = $('names-btn');
    names.classList.toggle('on', this.showNames);
    names.onclick = () => {
      this.showNames = !this.showNames;
      pref.set('names', this.showNames);
      names.classList.toggle('on', this.showNames);
      this.toast(this.showNames ? 'Names on' : 'Names off');
      [...this.chunks.values()].forEach((e) => this.dropChunk(e)); // paint the ground again
      this.chunkRange = '';
      this.streamChunks();
    };
    const panel = $('map-panel');
    const refresh = () => {
      $('map-btn').classList.toggle('on', this.mapOn);
      panel.hidden = !this.mapOn;
      $('osm-credit').hidden = !this.mapOn;
      $('osm-credit').textContent = LAYERS[this.layer].credit;
      panel.querySelectorAll('[data-layer]').forEach((b) => b.classList.toggle('on', b.dataset.layer === this.layer));
      $('map-alpha').value = Math.round(this.alpha * 100);
      this.tileImgs.forEach((t) => t.img?.setVisible(this.mapOn).setAlpha(this.alpha));
    };
    $('map-btn').onclick = () => {
      this.mapOn = !this.mapOn;
      refresh();
      this.streamTiles();
    };
    panel.querySelectorAll('[data-layer]').forEach((b) => {
      b.onclick = () => {
        if (this.layer === b.dataset.layer) return;
        this.layer = b.dataset.layer;
        try {
          localStorage.setItem('wakefield.layer', this.layer);
        } catch {
          // fine
        }
        [...this.tileImgs.values()].forEach((t) => this.dropTile(t)); // the other kind of picture
        refresh();
        this.streamTiles();
      };
    });
    $('map-alpha').oninput = (e) => {
      this.alpha = Number(e.target.value) / 100;
      try {
        localStorage.setItem('wakefield.alpha', String(this.alpha));
      } catch {
        // fine
      }
      this.tileImgs.forEach((t) => t.img?.setAlpha(this.alpha));
    };
    refresh();
  }

  // the pictures (zoom 19) around you, each placed by its own coordinates
  streamTiles() {
    if (!this.mapOn) return;
    const w = this.world;
    const layer = this.layer;
    const n = 2 ** TILE_Z;
    const tx = (lon) => ((lon + 180) / 360) * n;
    const ty = (lat) => ((1 - Math.asinh(Math.tan((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
    const lon = (x) => (x / n) * 360 - 180;
    const lat = (y) => (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n))) * 180) / Math.PI;
    const cam = this.cameras.main;
    const hw = this.scale.gameSize.width / cam.zoom / 2 + 300;
    const hh = this.scale.gameSize.height / cam.zoom / 2 + 300;
    const { x, y } = this.player;
    const [x0, x1] = [Math.floor(tx(w.lonOf(x - hw))), Math.floor(tx(w.lonOf(x + hw)))];
    const [y0, y1] = [Math.floor(ty(w.latOf(y - hh))), Math.floor(ty(w.latOf(y + hh)))];
    for (let j = y0; j <= y1; j++)
      for (let i = x0; i <= x1; i++) {
        const key = `${layer}:${i},${j}`;
        if (this.tileImgs.has(key)) continue;
        const t = { key, i, j, img: null };
        this.tileImgs.set(key, t);
        const pic = new Image();
        pic.crossOrigin = 'anonymous';
        pic.onload = () => {
          if (this.tileImgs.get(key) !== t || !this.sys.isActive()) return;
          const tk = `pic_${layer}_${i}_${j}`;
          if (!this.textures.exists(tk)) this.textures.addImage(tk, pic);
          this.textures.get(tk).setFilter(Phaser.Textures.FilterMode.LINEAR); // a picture, not pixel art
          const [ax, ay] = [w.xOf(lon(i)), w.yOf(lat(j))];
          t.tk = tk;
          t.img = this.add
            .image(ax, ay, tk)
            .setOrigin(0)
            .setDisplaySize(w.xOf(lon(i + 1)) - ax + 0.7, w.yOf(lat(j + 1)) - ay + 0.7) // a little over, so no seam shows between pictures
            .setDepth(0.45) // over the ground, under you
            .setAlpha(this.alpha)
            .setVisible(this.mapOn);
        };
        pic.src = LAYERS[layer].url(TILE_Z, i, j);
      }
    [...this.tileImgs.values()].forEach((t) => (t.i < x0 - 2 || t.i > x1 + 2 || t.j < y0 - 2 || t.j > y1 + 2) && this.dropTile(t));
  }

  dropTile(t) {
    t.img?.destroy();
    if (t.tk) this.textures.remove(t.tk);
    this.tileImgs.delete(t.key);
  }
}
