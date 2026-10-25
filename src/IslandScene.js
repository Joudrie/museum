// The island outside the museum. Walk out of the entrance and you're standing
// on the steps in front of the museum's doors; walk back up into the doors to
// go inside. For now it's just for walking around: beaches, a pond, a cliff
// with stairs, tall grass, palms and a dock where expeditions will leave from.
import Phaser from 'phaser';
import { buildTiles, T } from './tiles.js';
import { makeCharacter } from './art.js';
import { load } from './storage.js';
import { DEFAULT_CHARACTER } from './decor.js';
import { showTalk, hideTalk, talking } from './talk.js';
import { iconSvg } from './icons.js';
import { sfx, setTrack, setAmbience } from './music.js';
import { Weather, weatherToday, season } from './weather.js';
import { ambientAt, makeTextures as lightTextures } from './lighting.js';
import { Critters } from './critters.js';
import { Ambient } from './ambient.js';
import { seasonFrames, seasonTile, TILE_LIGHTS } from './scenery.js';
import { layoutShowcase } from './showcase.js';
import { settings, hourNow } from './settings.js';
import { animateWalker, footstep, dust } from './motion.js';
import { Pet } from './pets.js';

// The main island is 24×40 tiles; the tile garden (see showcase.js) lies
// east of it, joined by a path, and sets the full map size.
const MW = 24;
const MH = 40;
const SX = 28; // where the tile garden starts
const SW = 32; // and how wide it is
let W = MW; // map size in tiles
let H = MH;
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
    this.plan = layoutShowcase(TILES, SX, 2, SW);
    W = SX + SW + 1;
    H = Math.max(MH, this.plan.y0 + this.plan.height + 2);
    document.body.classList.add('outside');
    this.events.once('shutdown', () => document.body.classList.remove('outside'));
    setTrack('none');
    this.weatherKind = weatherToday();
    this.season = season();
    setAmbience(this.weatherKind === 'rain' ? ['waves', 'rain'] : ['waves']);
    this.events.once('shutdown', () => setAmbience([]));
    this.frame = 0;
    this.solid = Array.from({ length: H }, () => Array(W).fill(false));
    this.animated = []; // images whose texture changes every frame
    this.things = []; // signs and chests you can interact with
    this.flickers = []; // campfire glows
    this.flowerSpots = [];

    this.makeMap();
    this.paintShowcase();
    this.drawGround();
    this.placeMuseum();
    this.placeThings();

    const ch = { ...DEFAULT_CHARACTER, ...load('curation.character', {}) };
    if (!this.textures.exists('player_down')) makeCharacter(this, 'player', ch, {});
    this.player = this.add.sprite(DOOR.x, DOOR.y + 22, 'player_down').setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    this.shadow = this.add.ellipse(0, 0, 18, 6, 0x000000, 0.25).setDepth(0.5);
    if (ch.pet && ch.pet !== 'none') this.pet = new Pet(this, ch.pet, ch.petColor, this.player);
    this.doorLock = true; // don't walk straight back in

    this.lightUp();
    this.critters = new Critters(
      this,
      { w: W * T, h: H * T, isSand: (x, y) => this.ground_(x, y) === 'sand', isWater: (x, y) => this.ground_(x, y) === 'water', flowers: this.flowerSpots, pond: { x: 5 * T, y: 16 * T, w: 5 * T, h: 5 * T } },
      this.dark > 0.45,
      this.weatherKind,
    );

    const hour = hourNow();
    this.ambient = new Ambient(
      this,
      {
        w: W * T,
        h: H * T,
        ground: (x, y) => this.ground_(x, y),
        isPond: (x, y) => this.key(Math.floor(x / T), Math.floor(y / T), (m) => m === 3) !== '0000',
        flowers: this.flowerSpots,
        trees: this.trees.map((img) => ({ x: img.x + img.displayWidth / 2, y: img.y, h: img.displayHeight })),
        lamps: this.lampSpots,
        dock: { x: 12.5 * T, y: 38.7 * T },
        pond: { x: 5 * T, y: 16 * T, w: 5 * T, h: 5 * T },
      },
      { night: this.dark > 0.45, dusk: this.dark <= 0.45 && (hour > 17.5 && hour < 21), weather: this.weatherKind, season: this.season },
    );

    this.seasonal();
    this.setupCamera();
    this.weather = new Weather(this, this.weatherKind);
    if (this.weatherKind === 'rain') this.makePuddles();
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
        const d = Math.hypot((x - MW / 2) / (MW * 0.46), (y - MH * 0.5) / (MH * 0.47)) + (hash(x, y, 1) - 0.5) * 0.12 + (hash(x >> 2, y >> 2, 2) - 0.5) * 0.1;
        let m = d < 0.74 ? 2 : d < 0.97 ? 1 : 0;
        if (x >= SX - 1 && x <= W - 1 && y >= 1 && y <= H - 1) m = 2; // the tile garden
        if (x >= 18 && x < SX && y >= 20 && y <= 27) m = Math.max(m, 2); // the land between
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
    // and a branch east to the tile garden
    for (let x = 14; x <= SX; x++) for (const y of [23, 24]) if (c[y][x] === 2) c[y][x] = 4;
    this.corners = c;
  }

  key(x, y, test) {
    const c = this.corners;
    return [c[y][x], c[y][x + 1], c[y + 1][x], c[y + 1][x + 1]].map((m) => (test(m) ? 1 : 0)).join('');
  }

  // The ground is drawn into one big picture per animation frame.
  drawGround() {
    // what's painted on each cell, bottom to top
    const cells = (x, y) => {
      const out = [(x * 7 + y * 3) % 5 ? 'sand_1' : 'sand_2'];
      const shore = this.key(x, y, (m) => m === 0);
      if (shore === '1111') out.push('water');
      else if (shore !== '0000') out.push(`shore_${shore}`);
      const grass = this.key(x, y, (m) => m >= 2);
      const path = this.key(x, y, (m) => m === 4);
      if (path !== '0000') {
        // the path: dirt with the grass growing over its edges
        out.push('dirt_1');
        const g = this.key(x, y, (m) => m === 2 || m === 3);
        if (g !== '0000') out.push(`grass_dirt_${g}`);
      } else if (grass === '1111') out.push(['grass_1', 'grass_2', 'grass_1', 'grass_3'][(x * 3 + y * 5) % 4]);
      else if (grass !== '0000') out.push(`grass_sand_${grass}`);
      const pond = this.key(x, y, (m) => m === 3);
      if (pond === '1111') out.push('water');
      else if (pond !== '0000') out.push(`bank_${pond}`);
      out.push(...(this.paint[y]?.[x] || []));
      // water you can't walk into (3+ corners wet)
      const wet = [...shore].filter((v) => v === '1').length;
      const pondWet = [...pond].filter((v) => v === '1').length;
      if (wet >= 3 || pondWet >= 3) this.solid[y][x] = true;
      return out;
    };
    // The ground is drawn in chunks of C×C cells. Chunks with nothing moving
    // get one picture, chunks with water get four (the water ebbs), and open
    // sea chunks all share one set, which keeps a big map light on memory.
    const C = 8;
    const canvasFor = (key, w, h, draw) => {
      if (!this.textures.exists(key)) {
        const tex = this.textures.createCanvas(key, w, h);
        const ctx = tex.getContext();
        ctx.imageSmoothingEnabled = false;
        draw(ctx);
        tex.refresh();
      }
      return key;
    };
    const sea = [0, 1, 2, 3].map((f) =>
      canvasFor(`island_sea_${f}`, C * T, C * T, (ctx) => {
        for (let y = 0; y < C; y++) for (let x = 0; x < C; x++) ctx.drawImage(TILES.water.frames[f], x * T, y * T);
      }),
    );
    this.groundAnim = [];
    this.groundChunks = [];
    for (let cy = 0; cy * C < H; cy++)
      for (let cx = 0; cx * C < W; cx++) {
        const list = [];
        for (let y = cy * C; y < Math.min(H, cy * C + C); y++) for (let x = cx * C; x < Math.min(W, cx * C + C); x++) list.push({ x, y, names: cells(x, y) });
        let keys;
        if (list.every((c) => c.names[c.names.length - 1] === 'water')) keys = sea;
        else {
          const frames = list.some((c) => c.names.some((n) => TILES[n]?.frames.length > 1)) ? 4 : 1;
          keys = Array.from({ length: frames }, (_, f) =>
            canvasFor(`island_g${W}x${H}_${cx}_${cy}_${f}`, C * T, C * T, (ctx) =>
              list.forEach(({ x, y, names }) =>
                names.forEach((n) => {
                  const t = TILES[n];
                  if (t) ctx.drawImage(t.frames[f % t.frames.length], (x - cx * C) * T, (y - cy * C) * T);
                }),
              ),
            ),
          );
        }
        const img = this.add.image(cx * C * T, cy * C * T, keys[0]).setOrigin(0).setDepth(0);
        img.setCrop(0, 0, Math.min(C, W - cx * C) * T, Math.min(C, H - cy * C) * T); // edge chunks stop at the map's edge
        this.groundChunks.push({ img, keys, cx, cy });
        if (keys.length > 1) this.groundAnim.push({ img, keys });
      }
    this.chunk = C;
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
    (this.placed ||= []).push({ img, name, flat: opts.flat });
    (TILE_LIGHTS[name] || []).forEach(([lx, ly, r, color, a, extra]) => this.light(x * T + lx, (y + 1) * T + ly, r, color, a, { ...extra, gy: (y + 1) * T + ly }));
    if (opts.solid !== false && ['block', 'push'].includes(t.walk)) {
      const wide = Math.max(1, Math.round(t.w / T));
      for (let r = 0; r < (t.base || 1); r++) for (let i = 0; i < wide; i++) this.block(x + i, y - r);
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
    this.light(DOOR.x, DOOR.y + 6, 46, 0xffd89a, 1, { glow: 40, gy: DOOR.y - 20 });
    [-1, 1].forEach((d) => this.light(DOOR.x + d * 32, DOOR.y - 88, 30, 0xffd080, 0.8, { glow: 34 })); // the windows
    // the building is solid, the steps and doorway are not
    for (let y = 2; y <= 7; y++) for (let x = 8; x <= 15; x++) if (!(y === 7 && x >= 11 && x <= 12)) this.block(x, y);
  }

  placeThings() {
    // beach and lawn
    this.trees = [];
    [[3, 13], [20, 14], [2, 26], [21, 27], [7, 35], [17, 34]].forEach(([x, y]) => this.place('palm', x, y));
    [[4, 8], [19, 9]].forEach(([x, y]) => this.trees.push(this.place('tree', x, y)));
    [[18, 21], [20, 20]].forEach(([x, y]) => this.place('pine', x, y));
    [[9, 14], [16, 15], [6, 24], [18, 26]].forEach(([x, y]) => this.trees.push(this.place('bush', x, y)));
    for (let y = 22; y <= 25; y++) for (let x = 8; x <= 10; x++) if ((x + y) % 4) this.tallGrass(x, y);
    for (let y = 15; y <= 17; y++) for (let x = 14; x <= 17; x++) if ((x * y) % 3) this.tallGrass(x, y);
    [[10, 11], [14, 12], [7, 13], [16, 18], [11, 28]].forEach(([x, y]) => {
      this.place('flowers', x, y, { flat: true });
      this.flowerSpots.push({ x: (x + 0.5) * T, y: (y + 0.5) * T });
    });
    // the museum's garden: hedges, flower beds, topiaries, a white fence
    [7, 16].forEach((x) => {
      this.place('hedge_l', x, 8);
      this.place('hedge_r', x + 1, 8);
    });
    [9, 14].forEach((x) => this.place('flower_bed', x, 9));
    [[6, 11], [18, 11]].forEach(([x, y]) => this.place('topiary', x, y));
    for (let x = 5; x <= 9; x++) this.place('fence_h', x, 12);
    for (let x = 15; x <= 19; x++) this.place('fence_h', x, 12);
    // lamp posts along the path
    [13, 18, 23, 28].forEach((y) => {
      this.place('lamp_post', 11, y);
      (this.lampSpots ||= []).push({ x: 11.5 * T, y: (y + 1) * T - 50 });
      this.light(11.5 * T, (y + 1) * T - 4, 40, 0xffe4a8, 0.9, { glow: 26, gy: (y + 1) * T - 52 });
    });
    this.place('park_bench', 13, 20);
    this.place('mailbox', 14, 10);
    this.flowerSpots.push({ x: 9.5 * T, y: 9.5 * T }, { x: 14.5 * T, y: 9.5 * T });
    // the beach: an umbrella, driftwood and a campfire for the evening
    this.place('umbrella', 17, 31);
    this.place('driftwood', 6, 32, { flat: true });
    this.place('driftwood', 16, 36, { flat: true });
    this.place('campfire', 9, 32);
    this.light(9.5 * T, 32.6 * T, 60, 0xffa850, 1, { glow: 46, gy: 32.4 * T, flicker: true });
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
    this.placeScenery();
    this.buildShowcase();
    this.thing('chest', 18, 25, 'A heavy chest, locked tight. Expeditions will turn up the keys.');
    // the dock at the south end
    for (let y = 36; y <= 39; y++) this.place('dock_v', 12, y, { flat: true });
    this.place('dock_post', 11, 38);
    this.place('dock_post', 13, 38);
    this.place('rowboat', 13, 39, { solid: false });
    this.thing('sign', 13, 35, 'Expeditions leave from this dock. Pirate islands, shipwrecks, lost temples… coming soon!');
    this.thing('sign', 13, 9, 'Welcome to the island! The museum is right behind you. Walk up into the doors to go back in.');
  }

  // A sample of the newer scenery tiles (flowers, trees, rocks, buildings)
  // dotted round the free spots, until the island gets its real layout.
  placeScenery() {
    // a flower garden on the west lawn, roses and a fountain on the east
    [['tulips', 5, 14], ['daisies', 6, 13], ['poppies', 7, 14], ['wildflowers', 8, 13], ['dandelions', 8, 15], ['clover', 5, 13]].forEach(([n, x, y]) => this.place(n, x, y, { flat: true }));
    this.trees.push(this.place('cherry_tree', 2, 16));
    this.place('lavender', 6, 15);
    this.place('lavender', 7, 15);
    this.place('fountain', 17, 14);
    this.place('roses', 15, 14);
    this.place('hydrangea', 19, 15);
    this.place('signpost', 14, 14);
    // cattails and a fern by the pond
    this.place('reeds', 10, 18);
    this.place('reeds', 10, 19);
    this.place('fern', 4, 19, { flat: true });
    // a cottage with a vegetable garden in the south-west meadow
    this.place('cottage', 4, 28);
    this.place('veg_patch', 7, 27, { flat: true });
    this.place('veg_patch', 8, 27, { flat: true });
    this.place('veg_patch', 7, 28, { flat: true });
    this.place('veg_patch', 8, 28, { flat: true });
    this.place('scarecrow', 9, 28);
    this.place('well', 9, 30);
    this.place('path_flagstone', 5, 29, { flat: true });
    this.place('pumpkins', 3, 29);
    // the beach: a striped hut, a tiki hut, a tide pool
    this.place('beach_hut', 20, 30);
    this.place('tiki_hut', 3, 32);
    this.place('tide_pool', 2, 20);
    this.place('pebbles', 8, 35, { flat: true });
    this.place('agave', 18, 33);
    // a lighthouse on the northern point, standing stones by the cliff
    this.place('lighthouse', 16, 4);
    this.place('cairn', 15, 25);
    this.place('rock_mossy', 20, 25);
    this.place('fossil_rock', 3, 23);
    this.trees.push(this.place('apple_tree', 18, 19));
  }

  // Rain leaves puddles on the path and the grass, rippling as drops land.
  makePuddles() {
    this.puddles = [];
    for (let tries = 0; tries < 400 && this.puddles.length < 14; tries++) {
      const x = (1 + Math.random() * (W - 2)) * T;
      const y = (1 + Math.random() * (H - 2)) * T;
      const ground = this.surfaceAt(x, y);
      if ((ground !== 'path' && ground !== 'grass') || !this.free(x, y) || !this.free(x + 14, y) || !this.free(x - 14, y)) continue;
      if (this.puddles.some((p) => Math.hypot(p.x - x, p.y - y) < 60)) continue;
      const w = 14 + Math.random() * 14;
      const h = w * (0.4 + Math.random() * 0.15);
      this.add.ellipse(x, y + 1, w + 2, h + 2, 0x000000, 0.12).setDepth(0.58);
      this.add.ellipse(x, y, w, h, ground === 'path' ? 0x6a7a8a : 0x5a7a8a, 0.75).setDepth(0.6);
      this.add.ellipse(x - w * 0.15, y - h * 0.15, w * 0.45, h * 0.3, 0xc8d8e8, 0.35).setDepth(0.61); // the sky in it
      this.puddles.push({ x, y, w, h });
    }
    this.time.addEvent({
      delay: 140,
      loop: true,
      callback: () => {
        const p = this.puddles[Math.floor(Math.random() * this.puddles.length)];
        if (!p) return;
        const ring = this.add.ellipse(p.x + (Math.random() - 0.5) * p.w * 0.6, p.y + (Math.random() - 0.5) * p.h * 0.5, 3, 1.5).setStrokeStyle(1, 0xe8f2ff, 0.8).setDepth(0.62);
        this.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
      },
    });
  }

  // The tile garden's floors, streets and walkways are painted into the
  // ground itself (see drawGround); its standing pieces come in buildShowcase.
  paintShowcase() {
    const P = this.plan;
    this.paint = [];
    const paint = (name, x, y) => ((this.paint[y] ||= [])[x] ||= []).push(name);
    for (let y = P.y0; y < P.y0 + P.height; y++) [P.x0, P.x0 + 1, P.x0 + P.width - 2, P.x0 + P.width - 1].forEach((x) => paint('path_flagstone', x, y));
    P.streets.forEach(({ y, x0, x1, tile }) => {
      for (let x = x0; x <= x1; x++) paint(tile, x, y);
    });
    P.floors.forEach(({ name, x, y, w, h, base, solid }) => {
      for (let dy = 0; dy < h; dy++)
        for (let dx = 0; dx < w; dx++) {
          if (base) paint(base, x + dx, y + dy);
          paint(name, x + dx, y + dy);
          if (solid) this.block(x + dx, y + dy);
        }
    });
  }

  // The tile garden: every tile on show, with its name (plan from showcase.js).
  buildShowcase() {
    const P = this.plan;
    const label = (x, y, text, w, size = 8, color = '#fff8e8') => {
      const t = this.add
        .text(x * T, y * T + 3, text, { fontFamily: 'Georgia, serif', fontSize: `${size}px`, color, stroke: '#2a2018', strokeThickness: 3, align: 'center', wordWrap: { width: w * T - 2 } })
        .setOrigin(0.5, 0)
        .setResolution(4)
        .setDepth(2);
      t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR); // smooth text, not pixel-scaled
      return t;
    };
    P.items.forEach(({ name, x, y }) => {
      const t = TILES[name];
      const img = this.place(name, x, y, { flat: t.walk === 'walk' || t.walk === 'grass' });
      if (/tree|palm|pine|bush|shrub|sapling/.test(name)) this.trees.push(img);
    });
    P.labels.forEach(({ x, y, text, w }) => label(x, y, text, w));
    P.headers.forEach(({ x, y, text }) => label(x, y, text, 12, 11, '#f2d36b').setOrigin(0, 0).setX(x * T));
    label(SX - 4.5, 22, 'Tile garden →', 4, 9, '#f2d36b'); // on the path out of the island
  }

  tallGrass(x, y) {
    (this.grassCells ||= new Set()).add(`${x},${y}`);
    this.place('tall_grass', x, y, { flat: true });
    this.place('tall_grass_front', x, y, { depth: (y + 1) * T + 2 }); // drawn over your legs
  }

  // What a point is: open water, beach sand, or anything else.
  ground_(x, y) {
    const cx = Math.floor(x / T);
    const cy = Math.floor(y / T);
    if (cx < 0 || cy < 0 || cx >= W || cy >= H) return 'water';
    const sea = [...this.key(cx, cy, (m) => m === 0 || m === 3)].filter((v) => v === '1').length;
    if (sea >= 2) return 'water';
    if (this.solid[cy][cx]) return 'solid';
    return this.key(cx, cy, (m) => m >= 2) === '0000' ? 'sand' : 'grass';
  }

  // Night outside: the same ambient light as indoors, with pools of light from
  // the museum's windows, the lamp posts and the campfire.
  lightUp() {
    const lit = settings().dayNight && settings().lights !== 'off';
    const [r, g, b] = lit ? ambientAt(hourNow()) : [255, 255, 255];
    this.dark = Math.max(0, Math.min(1, 1 - (0.3 * r + 0.55 * g + 0.15 * b) / 245));
    if (!lit) return;
    lightTextures(this);
    // the shade is soft, so a quarter-size texture stretched over the map does
    const Q = 4;
    const rt = this.add.renderTexture(0, 0, (W * T) / Q, (H * T) / Q).setOrigin(0).setScale(Q).setDepth(5000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    rt.fill((r << 16) | (g << 8) | b, 1);
    const k = 0.4 + 0.6 * this.dark;
    const stamp = (x, y, w, h, tint, a) => rt.stamp('lt_glow', null, x / Q, y / Q, { scaleX: w / 128 / Q, scaleY: h / 128 / Q, tint, alpha: Math.min(1, a * k), blendMode: Phaser.BlendModes.ADD });
    (this.lamps || []).forEach((l) => stamp(l.x, l.y, l.r * 2, l.r * 1.6, l.color, l.a));
    // warm glows on top so the lamps themselves shine
    (this.lamps || []).forEach((l) => {
      if (!l.glow) return;
      const gl = this.add.image(l.x, l.gy ?? l.y, 'lt_glow').setDisplaySize(l.glow, l.glow).setBlendMode(Phaser.BlendModes.ADD).setTint(l.color).setAlpha(0.1 + 0.5 * this.dark).setDepth(5001);
      if (l.flicker) this.flickers.push(gl);
    });
    // lighthouses sweep a beam out over the sea
    this.beams = (this.lamps || []).filter((l) => l.beam && this.dark > 0.3).map((l) => {
      if (!this.textures.exists('lt_beam')) {
        const t = this.textures.createCanvas('lt_beam', 256, 64);
        const ctx = t.getContext();
        const g = ctx.createLinearGradient(0, 0, 256, 0);
        g.addColorStop(0, 'rgba(255,248,210,0.9)');
        g.addColorStop(1, 'rgba(255,248,210,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, 30);
        ctx.lineTo(256, 0);
        ctx.lineTo(256, 64);
        ctx.lineTo(0, 34);
        ctx.fill();
        t.refresh();
      }
      return this.add.image(l.x, l.y, 'lt_beam').setOrigin(0, 0.5).setScale(2.6, 1.6).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.45 * this.dark).setDepth(5002);
    });
    if (this.dark > 0.2) this.playerGlow = this.add.image(0, 0, 'lt_glow').setDisplaySize(90, 70).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd8a8).setAlpha(0.12 * this.dark).setDepth(5001);
  }

  // The season shows on the land: snow on the grass in winter, orange trees
  // in autumn, blossom pink in spring.
  seasonal() {
    // swap each placed piece for its look this season (see scenery.js)
    (this.placed || []).forEach(({ img, name, flat }) => {
      if (flat && this.season === 'winter') {
        // the pond is frozen and the flowers are asleep under the snow
        if (['lily', 'flowers', 'tulips', 'daisies', 'poppies', 'wildflowers', 'dandelions', 'clover', 'fern', 'mushrooms'].includes(name)) img.setVisible(false);
        return; // flat things lie under the snow layer
      }
      const other = seasonTile(name, this.season);
      const frames = other ? TILES[other].frames : seasonFrames(name, TILES[name], this.season);
      if (!frames) return;
      const keys = frames.map((fr, i) => {
        const k = `isl_${name}@${this.season}_${i}`;
        if (!this.textures.exists(k)) this.textures.addCanvas(k, fr);
        return k;
      });
      img.setTexture(keys[0]);
      const a = this.animated.find((e) => e.img === img);
      if (a && keys.length > 1) a.keys = keys;
      else if (a) this.animated.splice(this.animated.indexOf(a), 1);
      else if (keys.length > 1) this.animated.push({ img, keys });
    });
    if (this.season !== 'winter') return;
    // smooth value noise: big drifts plus small clumps, and a little grain
    const vnoise = (x, y, size, seed) => {
      const gx = x / size;
      const gy = y / size;
      const x0 = Math.floor(gx);
      const y0 = Math.floor(gy);
      const fx = gx - x0;
      const fy = gy - y0;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const a = hash(x0, y0, seed);
      const b = hash(x0 + 1, y0, seed);
      const c = hash(x0, y0 + 1, seed);
      const d = hash(x0 + 1, y0 + 1, seed);
      return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
    };
    const n = (x, y) => 0.6 * vnoise(x, y, 40, 7) + 0.3 * vnoise(x, y, 12, 8) + 0.1 * hash(x, y, 9);
    // snow settles on grass (and the path), right up to the grass's ragged edge
    // done chunk by chunk, reading the ground's first frame
    const C = this.chunk;
    const S = C * T;
    const flag = (test) => Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => this.key(x, y, test) !== '0000'));
    const isPond = flag((m) => m === 3);
    const isLand = flag((m) => m === 2 || m === 4);
    const isPath = flag((m) => m === 4);
    this.groundChunks.forEach(({ keys, cx: gx, cy: gy }) => {
      if (keys[0].startsWith('island_sea')) return; // nothing settles on the sea
      const ground = this.textures.get(keys[0]).getSourceImage().getContext('2d').getImageData(0, 0, S, S).data;
      const img = new ImageData(S, S);
      let any = false;
      for (let py = 0; py < S; py++)
        for (let px = 0; px < S; px++) {
          const x = gx * S + px;
          const y = gy * S + py;
          const cx = Math.floor(x / T);
          const cy = Math.floor(y / T);
          if (cx >= W || cy >= H) continue;
          const j = (py * S + px) * 4;
        if (isPond[cy][cx] && ground[j + 2] > ground[j] + 40 && ground[j + 2] > ground[j + 1]) {
          // the pond freezes: pale ice with a few streaks
          const v = n(x, y);
          const streak = Math.abs(((x + y * 0.4) % 23) - 11) < 0.6 && v > 0.45;
          img.data.set(streak ? [255, 255, 255, 255] : v > 0.55 ? [206, 230, 244, 255] : [178, 214, 236, 255], j);
          any = true;
          continue;
        }
        if (!isLand[cy][cx]) continue;
        const grassy = ground[j + 1] > ground[j] && ground[j + 1] > ground[j + 2];
        const path = !grassy && isPath[cy][cx];
        if (!grassy && !path) continue;
        const v = n(x, y);
        if (v < (path ? 0.5 : 0.36)) continue; // grass peeks through; the path is trodden
        const c = v > 0.62 ? 250 : v > 0.42 ? 236 : 214;
        img.data.set([c, c + 2 > 255 ? 255 : c + 2, 255, v < 0.4 ? 170 : 255], j);
        any = true;
      }
      if (!any) return;
      const key = `island_snow_${gx}_${gy}`;
      if (this.textures.exists(key)) this.textures.remove(key);
      const tex = this.textures.createCanvas(key, S, S);
      tex.getContext().putImageData(img, 0, 0);
      tex.refresh();
      this.add.image(gx * S, gy * S, key).setOrigin(0).setDepth(0.4);
    });
  }

  light(x, y, r, color, a = 1, extra = {}) {
    (this.lamps ||= []).push({ x, y, r, color, a, ...extra });
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
        this.dragMag = Math.min(1, len / 36); // a short drag walks, a long one runs
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
    this.flickers.forEach((g) => g.setAlpha((0.1 + 0.5 * this.dark) * (0.8 + Math.random() * 0.35)));
    this.frame = (this.frame + 1) % 4;
    this.groundAnim.forEach(({ img, keys }) => img.setTexture(keys[this.frame]));
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
    if (this.pet) {
      const dp = Math.hypot(x - this.pet.s.x, y - this.pet.s.y) + 4;
      if (dp < bestD) {
        best = { pet: true, icon: 'talk' };
        bestD = dp;
      }
    }
    const dd = Math.hypot(x - DOOR.x, y - (DOOR.y + 4));
    if (dd < 30 && dd < bestD) best = { door: true, icon: 'door' };
    return best;
  }

  interact() {
    const f = this.focus;
    if (!f || this.leaving) return;
    if (f.door) return this.goInside();
    if (f.pet) return this.pet.pet();
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

  // What's underfoot: sand leaves footprints, tall grass rustles, the
  // water's edge splashes.
  surfaceAt(x, y) {
    const cx = Math.floor(x / T);
    const cy = Math.floor(y / T);
    if (cx < 0 || cy < 0 || cx >= W || cy >= H) return 'sand';
    if (this.grassCells?.has(`${cx},${cy}`)) return 'tall';
    const wet = this.key(cx, cy, (m) => m === 0 || m === 3);
    if (wet !== '0000') return 'shore';
    if (this.key(cx, cy, (m) => m === 4) !== '0000') return 'path';
    return this.key(cx, cy, (m) => m >= 2) === '1111' ? 'grass' : 'sand';
  }

  onStep(p, pace) {
    const ground = this.surfaceAt(p.x, p.y - 2);
    footstep(ground === 'sand' || ground === 'shore' ? 'sand' : ground === 'grass' || ground === 'tall' ? 'grass' : 'floor');
    if (ground === 'sand') {
      // a footprint that fades away
      this.stepSide = !this.stepSide;
      const side = p.texture.key.includes('side');
      const fx = p.x + (side ? 0 : this.stepSide ? -3 : 3);
      const fy = p.y - 2 + (side ? (this.stepSide ? -1 : 1) : 0);
      const print = this.add.rectangle(fx, fy, side ? 4 : 3, side ? 2 : 3, 0x8a6a3c, 0.45).setDepth(0.6);
      this.tweens.add({ targets: print, alpha: 0, delay: 2500, duration: 2500, onComplete: () => print.destroy() });
    } else if (ground === 'tall') {
      for (let i = 0; i < 3; i++) {
        const leaf = this.add.rectangle(p.x + (Math.random() - 0.5) * 14, p.y - 6, 2, 2, Math.random() < 0.5 ? 0x94d672 : 0x58ad52).setDepth(p.y + 3);
        this.tweens.add({ targets: leaf, x: leaf.x + (Math.random() - 0.5) * 16, y: leaf.y - 6 - Math.random() * 6, alpha: 0, duration: 500, onComplete: () => leaf.destroy() });
      }
    } else if (ground === 'shore') {
      const ring = this.add.ellipse(p.x, p.y - 1, 10, 4).setStrokeStyle(1, 0xf2fbff, 0.8).setDepth(0.7);
      this.tweens.add({ targets: ring, scaleX: 2, scaleY: 2, alpha: 0, duration: 600, onComplete: () => ring.destroy() });
    }
    if (pace === 1 && ground !== 'shore' && ground !== 'tall') dust(this, p.x, p.y, ground === 'sand' ? 0xe2c68a : ground === 'path' ? 0xc49464 : 0xb4d890);
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
      if (Math.abs(vx) > Math.abs(vy)) p.setTexture('player_side').setFlipX(vx < 0);
      else p.setTexture(vy < 0 ? 'player_up' : 'player_down').setFlipX(false);
    }
    if (animateWalker(this, p, len > 0, dt, 0.8 + pace * 0.5)) this.onStep(p, pace);
    this.pet?.update(dt);
    this.critters.update(dt, p);
    this.ambient.update(dt, p);
    this.beams?.forEach((b) => (b.rotation += dt * 0.7));
    this.weather.update(dt);
    this.playerGlow?.setPosition(p.x, p.y - 12);
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
