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
import { Fishing, catchOpen } from './fishing.js';
import { openJournal } from './journal.js';
import isle1 from './maps/isle-1.json';
import mainIsland from './maps/main-island.json';
import { PEOPLE, ANIMALS } from './landmarks.js';
import { makePet } from './pets.js';
import { critterTextures } from './critters.js';
import { openSail, builderIslands } from './sailmenu.js';
import { visitorLook, KINDS } from './RoomScene.js';
import { PERSONALITIES, QUIPS } from './lines.js';

// Islands drawn in the map builder (builder.html), reached by boat from the
// main island's dock. Each is a 'curation-map' file (see src/builder/main.js).
// Main Island (drawn in the map builder) is home: the museum is there. Island
// One is the first island, drawn in code; its museum doors stay shut.
const MAPS = { main: mainIsland, 'isle-1': isle1 };

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
const COTTAGE = { x: 4 * T + 48, y: 29 * T }; // the cottage door, which leads to the angled room

// Tall things you can walk behind: only the trunk (or post) at the bottom is
// solid, w × h px, centred; the leaves and lamp tops are above you.
const TRUNKS = { palm: [12, 8], tree: [14, 8], pine: [10, 8], pine_snow: [10, 8], cherry_tree: [14, 8], maple_tree: [14, 8], apple_tree: [14, 8], orange_tree: [14, 8], willow: [16, 8], bare_tree: [12, 8], flame_tree: [14, 8], lamp_post: [8, 6], signpost: [8, 6], umbrella: [6, 6], scarecrow: [8, 6] };

const hash = (x, y, s = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

let TILES = null; // built once, shared

export class IslandScene extends Phaser.Scene {
  constructor() {
    super('island');
  }

  init(data) {
    this.spawnAt = data?.spawn;
    const id = data?.map || 'main';
    this.mapId = data?.mapData ? 'test' : id === 'one' ? null : MAPS[id] ? id : 'main';
    this.map = data?.mapData || (this.mapId ? MAPS[this.mapId] : null); // null: Island One
  }

  create() {
    TILES = TILES || buildTiles();
    if (this.map) {
      this.plan = { floors: [], items: [], streets: [], labels: [], headers: [], x0: 0, y0: 0, width: 0, height: 0 };
      W = this.map.w;
      H = this.map.h;
    } else {
      this.plan = layoutShowcase(TILES, SX, 2, SW);
      W = SX + SW + 1;
      H = Math.max(MH, this.plan.y0 + this.plan.height + 2);
    }
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
    // the scene object is reused on every visit, so start these afresh
    this.placed = [];
    this.lamps = [];
    this.lampSpots = [];
    this.grassCells = new Set();
    this.posts = []; // trunk-sized hitboxes (see TRUNKS)
    this.paused = false;
    this.leaving = false;

    this.boats = [];
    this.islanders = []; // people and animals living on a builder island
    this.door = this.map ? null : DOOR; // a museum's front doors
    this.makeMap();
    this.paintShowcase();
    this.drawGround();
    if (this.map) this.walkableTiles();
    this.placeMuseum();
    this.placeThings();

    const ch = { ...DEFAULT_CHARACTER, ...load('curation.character', {}) };
    if (!this.textures.exists('player_down')) makeCharacter(this, 'player', ch, {});
    const start = this.map ? (this.door && this.spawnAt !== 'dock' ? { x: this.door.x, y: this.door.y + 22 } : this.landing()) : this.spawnAt === 'cottage' ? { x: COTTAGE.x, y: COTTAGE.y + 16 } : this.spawnAt === 'dock' ? { x: 12.5 * T, y: 38.6 * T } : { x: DOOR.x, y: DOOR.y + 22 };
    this.player = this.add.sprite(start.x, start.y, 'player_down').setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    this.shadow = this.add.ellipse(0, 0, 18, 6, 0x000000, 0.25).setDepth(0.5);
    this.setupOverlay();
    if (ch.pet && ch.pet !== 'none') this.pet = new Pet(this, ch.pet, ch.petColor, this.player);
    this.doorLock = this.spawnAt !== 'cottage' && this.spawnAt !== 'dock'; // don't walk straight back in
    this.cottageLock = this.spawnAt === 'cottage';
    this.facing = 'down';
    this.fishing = new Fishing(this, this.player);

    this.lightUp();
    this.critters = new Critters(
      this,
      { w: W * T, h: H * T, isSand: (x, y) => this.ground_(x, y) === 'sand', isWater: (x, y) => this.ground_(x, y) === 'water', flowers: this.flowerSpots, pond: this.pondRect() },
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
        dock: this.map ? null : { x: 12.5 * T, y: 38.7 * T },
        pond: this.pondRect(),
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
    if (this.map && this.door && this.spawnAt !== 'dock') this.toast(`${this.mapName()} · walk back into the doors to go inside`);
    else if (this.map) this.toast(`${this.mapName()} · sail on from the rowboat`);
    else if (this.spawnAt !== 'cottage') this.toast('Island One · the museum here is shut; sail home from the dock');
  }

  // ---------- The map ----------
  // Corner materials: 0 water, 1 sand, 2 grass, 3 pond water.
  makeMap() {
    const c = [];
    if (this.map) {
      for (let y = 0; y <= H; y++) c.push(Array.from({ length: W + 1 }, (_, x) => Number(this.map.corners[y]?.[x]) || 0));
      // grass never touches the sea directly: there's always a bit of beach
      for (let y = 0; y <= H; y++)
        for (let x = 0; x <= W; x++) {
          if (c[y][x] !== 2) continue;
          if ([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].some(([dx, dy]) => c[y + dy]?.[x + dx] === 0)) c[y][x] = 1;
        }
      this.corners = c;
      return;
    }
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
    const trunk = TRUNKS[name] || (/tree|palm|pine|willow/.test(name) && t.h >= 2 * T ? [14, 8] : null);
    if (opts.solid !== false && trunk) {
      const cx = x * T + t.w / 2;
      const by = (y + 1) * T;
      this.posts.push({ x0: cx - trunk[0] / 2, x1: cx + trunk[0] / 2, y0: by - trunk[1] - 4, y1: by - 2 });
    } else if (opts.solid !== false && ['block', 'push'].includes(t.walk)) {
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
    if (this.map) return; // (builder islands have no museum)
    const key = 'island_museum';
    if (!this.textures.exists(key)) this.textures.addCanvas(key, TILES.museum.frames[0]);
    this.add.image(DOOR.x, DOOR.y + 8, key).setOrigin(0.5, 1).setDepth(DOOR.y);
    this.light(DOOR.x, DOOR.y + 6, 46, 0xffd89a, 1, { glow: 40, gy: DOOR.y - 20 });
    [-1, 1].forEach((d) => this.light(DOOR.x + d * 32, DOOR.y - 88, 30, 0xffd080, 0.8, { glow: 34 })); // the windows
    // only the front of the building is solid (its last two rows, but not the
    // doorway); behind it you can walk round the back, hidden by the roof
    for (let y = 6; y <= 7; y++) for (let x = 8; x <= 15; x++) if (!(y === 7 && x >= 11 && x <= 12)) this.block(x, y);
  }

  placeThings() {
    if (this.map) return this.placeMapPieces();
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
    if (this.map) {
      // the builder's tile layer: ground tiles painted over the terrain
      this.paint = [];
      Object.entries(this.map.tiles || {}).forEach(([k, ref]) => {
        const [x, y] = k.split(',').map(Number);
        const name = ref.slice(2);
        if (ref.startsWith('t:') && TILES[name] && y < H && x < W) ((this.paint[y] ||= [])[x] ||= []).push(name);
      });
      return;
    }
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
    // the journal, opened to the fish log
    this.journalBtn = document.getElementById('journal-btn');
    this.journalBtn.onclick = () => {
      if (this.fishing.busy) return;
      sfx('open');
      this.paused = true;
      openJournal({ fishOnly: true, onClose: () => (this.paused = false) });
    };
    this.events.once('shutdown', () => (this.journalBtn.onclick = null));
    const css = (p) => {
      const r = this.game.canvas.getBoundingClientRect();
      return { x: r.left + (p.x * r.width) / this.scale.gameSize.width, y: r.top + (p.y * r.height) / this.scale.gameSize.height };
    };
    this.input.on('pointerdown', (p) => {
      this.press = css(p);
      this.dragging = false;
      if (this.fishing.busy && !catchOpen()) this.fishing.tap(); // the hook: tap anywhere
    });
    this.input.on('pointermove', (p) => {
      if (!this.press || !p.isDown) return;
      const at = css(p);
      const dx = at.x - this.press.x;
      const dy = at.y - this.press.y;
      if (!this.dragging && Math.hypot(dx, dy) > 10) {
        if (this.fishing.busy) return; // a tap that wobbles isn't a walk
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
    if (this.posts.some((b) => x + 6 > b.x0 && x - 6 < b.x1 && y - 2 > b.y0 && y - 7 < b.y1)) return false;
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

  // ---------- Builder islands ----------
  mapName() {
    if (this.mapId === 'isle-1') return 'The far isle';
    return !this.map.name || this.map.name === 'Untitled island' ? 'Your island' : this.map.name;
  }

  // painted tiles decide walking where they cover the terrain: boardwalks
  // and docks over the water can be walked on, water tiles can't, cliffs block
  walkableTiles() {
    this.paint.forEach((row, y) =>
      row?.forEach((names, x) => {
        const t = TILES[names[names.length - 1]];
        if (!t) return;
        if (t.walk === 'water' || t.walk === 'block') this.solid[y][x] = true;
        else if (t.walk === 'walk') this.solid[y][x] = false;
      }),
    );
  }

  // the pieces from the builder, standing on their tiles
  placeMapPieces() {
    this.trees = [];
    const seen = new Set();
    this.placeRoomPieces();
    (this.map.objects || []).forEach((o) => {
      const name = o.ref.startsWith('t:') ? o.ref.slice(2) : null;
      const t = name && TILES[name];
      if (!t) return;
      const k = `${name}|${o.x}|${o.y}`;
      if (seen.has(k)) return; // the same piece twice in one spot
      seen.add(k);
      const x = Math.round(o.x / T);
      const y = Math.round((o.y + t.h) / T) - 1;
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      if (name.startsWith('animal_') && ANIMALS[name.slice(7)]) return this.islanders.push(this.animal(name.slice(7), o.x + T / 2, o.y + t.h - 3, this.islanders.length));
      if (PEOPLE[name] !== undefined) return this.islanders.push(this.islander(o.x + T / 2, o.y + t.h - 4, PEOPLE[name], this.islanders.length));
      if (name === 'museum') return this.mapMuseum(x, y, t);
      if (name === 'tall_grass' || name === 'tall_grass_front') {
        if (!this.grassCells.has(`${x},${y}`)) this.tallGrass(x, y);
        return;
      }
      const dock = /^dock|bridge/.test(name);
      const flat = dock || ['walk', 'grass', 'over'].includes(t.walk);
      const img = this.place(name, x, y, { flat, solid: name === 'rowboat' ? false : undefined });
      if (o.flip) img.setFlipX(true);
      if (dock) for (let i = 0; i < Math.round(t.w / T); i++) if (this.solid[y]?.[x + i] !== undefined) this.solid[y][x + i] = false;
      if (/tree|palm|pine|bush|willow|sapling/.test(name)) this.trees.push(img);
      if (name === 'rowboat') this.boats.push({ x: img.x + img.displayWidth / 2, y: img.y - 10 });
    });
  }

  // Room pieces (statues, fountains...) placed on an island in the builder:
  // their sheets load in the background, then they're stood on the map.
  placeRoomPieces() {
    const wanted = (this.map.objects || []).filter((o) => o.ref.startsWith('p:'));
    if (!wanted.length) return;
    const stand = () => {
      const ROOM = this.cache.json.get('builder_pieces');
      if (!ROOM || !this.sys.isActive()) return;
      const byId = {};
      ROOM.groups.forEach((g) => g.pieces.forEach((p) => (byId[p.id] = { ...p, sheet: g.sheet, kind: g.kind })));
      const sheets = new Set(wanted.map((o) => byId[o.ref.slice(2)]?.sheet).filter(Boolean));
      sheets.forEach((sh) => !this.textures.exists(`bp_${sh}`) && this.load.image(`bp_${sh}`, `./${sh}`));
      const put = () => {
        if (!this.sys.isActive()) return;
        wanted.forEach((o) => {
          const p = byId[o.ref.slice(2)];
          if (!p || !this.textures.exists(`bp_${p.sheet}`)) return;
          const tex = this.textures.get(`bp_${p.sheet}`);
          if (!tex.has(p.id)) tex.add(p.id, 0, p.x, p.y, p.w, p.h);
          const by = o.y + p.h;
          const flat = p.kind === 'tile' || p.kind === 'flat' || p.h <= 20; // rugs and mats you walk over
          this.add.image(o.x, by, `bp_${p.sheet}`, p.id).setOrigin(0, 1).setFlipX(!!o.flip).setDepth(flat ? 1 : by - 2);
          const row = Math.floor((by - 4) / T);
          const D = this.door;
          // its foot is solid (but nothing may block the way into the museum)
          if (!flat) for (let x = Math.floor((o.x + 4) / T); x <= Math.floor((o.x + p.w - 5) / T); x++) if (!(D && Math.abs((x + 0.5) * T - D.x) < T && row > D.y / T - 1 && row < D.y / T + 3)) this.block(x, row);
        });
      };
      if (this.load.list.size) {
        this.load.once('complete', put);
        this.load.start();
      } else put();
    };
    if (this.cache.json.exists('builder_pieces')) return stand();
    this.load.json('builder_pieces', './builder/pieces.json');
    this.load.once('complete', stand);
    this.load.start();
  }

  // An animal living on the island: wanders round its spot (ducks paddle).
  animal(name, x, y, i) {
    const a = ANIMALS[name];
    let prefix;
    if (a.pet) {
      prefix = `isl_animal_${name}`;
      if (!this.textures.exists(`${prefix}_down`)) makePet(this, prefix, a.pet, a.color);
    } else {
      critterTextures(this);
      prefix = a.critter;
    }
    const s = this.add.sprite(x, y, a.pet ? `${prefix}_down` : `${prefix}_0`).setOrigin(0.5, 1).setDepth(y);
    if (a.critter === 'duck') s.setOrigin(0.5, 0.8);
    if (a.pet === 'parrot') s.setOrigin(0.5, 1.5); // flits about above the ground
    return { s, prefix, animal: a, home: { x, y }, range: a.range * T, wait: 300 + ((i * 977) % 2000), target: null, name: a.label };
  }

  petAnimal(n) {
    const kind = n.animal.pet || n.animal.critter;
    sfx(kind === 'dog' ? 'woof' : kind === 'cat' ? 'meow' : kind === 'parrot' ? 'squawk' : 'tap');
    n.target = null;
    n.wait = 2000;
    if (this.textures.exists('emote_heart')) {
      const heart = this.add.image(n.s.x, n.s.y - 22, 'emote_heart').setOrigin(0.5, 1).setDepth(5000).setScale(0);
      this.tweens.add({ targets: heart, scale: 1, y: heart.y - 6, duration: 220, ease: 'Back.easeOut' });
      this.tweens.add({ targets: heart, alpha: 0, delay: 1100, duration: 300, onComplete: () => heart.destroy() });
    }
    this.tweens.add({ targets: n.s, y: n.s.y - 4, duration: 120, yoyo: true });
  }

  // A museum placed on a builder island: same building, same doors.
  mapMuseum(x, y, t) {
    if (this.door) return; // one museum per island
    const img = this.place('museum', x, y, { solid: false });
    const wide = t.w / T;
    // the front two rows are solid, except the doorway
    for (let r = 0; r <= 1; r++) for (let i = 0; i < wide; i++) if (!(r === 0 && (i === wide / 2 - 1 || i === wide / 2))) this.block(x + i, y - r);
    this.door = { x: img.x + t.w / 2, y: img.y - 8 };
    this.light(this.door.x, this.door.y + 6, 46, 0xffd89a, 1, { glow: 40, gy: this.door.y - 20 });
  }

  // Someone who lives on the island: walks Pokémon-style, a tile or two at a
  // time, never further than `range` tiles from home. Tap to chat.
  islander(x, y, range, i) {
    const seed = 700 + i * 7 + Math.round(x + y);
    const r = (k) => {
      const v = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const kind = KINDS[Math.floor(r(1) * KINDS.length)];
    const { colors, look, scale } = visitorLook(kind, r);
    const prefix = `islander${seed}`;
    if (!this.textures.exists(`${prefix}_down`)) makeCharacter(this, prefix, colors, look);
    const s = this.add.sprite(x, y, `${prefix}_down`).setOrigin(0.5, 1).setScale(scale).setDepth(y);
    const names = PERSONALITIES[kind].names;
    return { s, prefix, kind, home: { x, y }, range: range * T, name: names[Math.floor(r(2) * names.length)], wait: 500 + r(3) * 2500, target: null };
  }

  moveIslanders(dt) {
    this.islanders.forEach((n) => {
      const { s } = n;
      if (this.focus?.npc === n && talking()) n.target = null; // stops to chat
      const a = n.animal;
      if (!n.target) {
        if (a) s.setTexture(a.pet ? (s.texture.key.includes('_side') ? `${n.prefix}_side` : `${n.prefix}_down`) : `${n.prefix}_${a.critter === 'duck' ? this.frame % 2 : 0}`);
        else animateWalker(this, s, false, dt);
        n.wait -= dt * 1000;
        if (n.wait > 0 || !n.range) return;
        n.wait = 1500 + Math.random() * 3500;
        const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
        const steps = 1 + Math.floor(Math.random() * 2);
        const tx = s.x + dx * steps * T;
        const ty = s.y + dy * steps * T;
        if (Math.hypot(tx - n.home.x, ty - n.home.y) > n.range) return;
        for (let k = 1; k <= steps; k++) {
          const wet = this.ground_(s.x + dx * k * T, s.y + dy * k * T) === 'water';
          if (a?.water ? !wet : wet || !this.free(s.x + dx * k * T, s.y + dy * k * T)) return;
        }
        n.target = { x: tx, y: ty, dx, dy };
        return;
      }
      const sp = (a ? (a.critter === 'crab' ? 30 : a.critter ? 22 : 46) : 38) * dt;
      const { target: g } = n;
      const ddx = g.x - s.x;
      const ddy = g.y - s.y;
      const d = Math.hypot(ddx, ddy);
      if (d <= sp) {
        s.setPosition(g.x, g.y);
        n.target = null;
      } else s.setPosition(s.x + (ddx / d) * sp, s.y + (ddy / d) * sp);
      n.walkT = (n.walkT || 0) + dt;
      const step = Math.floor(n.walkT * 8) % 2;
      if (a?.critter) s.setTexture(`${n.prefix}_${step}`).setFlipX(g.dx > 0);
      else if (a) {
        const view = g.dy ? (g.dy < 0 && a.pet !== 'parrot' ? 'up' : 'down') : 'side';
        s.setTexture(`${n.prefix}_${a.pet === 'parrot' ? 'side' : view}${step ? '_1' : ''}`).setFlipX(g.dx < 0);
      } else {
        if (g.dy) s.setTexture(g.dy < 0 ? `${n.prefix}_up` : `${n.prefix}_down`).setFlipX(false);
        else s.setTexture(`${n.prefix}_side`).setFlipX(g.dx < 0);
        animateWalker(this, s, true, dt);
      }
      s.setDepth(s.y);
    });
  }

  talkTo(n) {
    sfx('talk');
    const lines = QUIPS?.island || ['Lovely day for it.', 'Have you been to the museum yet?', 'I come out here to think.', 'The fish are biting by the dock, they say.', 'Every rock on this island has a story.'];
    const line = lines[Math.floor(Math.random() * lines.length)];
    const r = this.game.canvas.getBoundingClientRect();
    const cam = this.cameras.main;
    const k = r.width / this.scale.gameSize.width;
    showTalk(n.name, 'Islander', line, { x: r.left + (n.s.x - cam.worldView.x) * cam.zoom * k, y: r.top + (n.s.y - 40 - cam.worldView.y) * cam.zoom * k });
  }

  // where you step off the boat: the nearest walkable spot to the first boat
  // (or the middle of the island if there's no boat)
  landing() {
    const from = this.boats[0] || { x: (W * T) / 2, y: (H * T) / 2 };
    if (!this.boats.length) this.boats.push({ ...from, virtual: true });
    for (let r = 0; r < 20 * T; r += 8)
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
        const x = from.x + Math.cos(a) * r;
        const y = from.y + Math.sin(a) * r;
        if (this.free(x, y) && this.ground_(x, y) !== 'water') return (this.landingSpot = { x, y });
      }
    return from;
  }

  // the pond's extent (for ducks and dragonflies), or null
  pondRect() {
    if (!this.map) return { x: 5 * T, y: 16 * T, w: 5 * T, h: 5 * T };
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    this.corners.forEach((row, y) => row.forEach((m, x) => m === 3 && ((x0 = Math.min(x0, x)), (x1 = Math.max(x1, x)), (y0 = Math.min(y0, y)), (y1 = Math.max(y1, y)))));
    return x1 - x0 >= 3 && y1 - y0 >= 3 ? { x: x0 * T, y: y0 * T, w: (x1 - x0) * T, h: (y1 - y0) * T } : null;
  }

  // a real map that lines up with the tiles (Wakefield): one button cycles
  // it off, faint, strong, so you can see where the streets really run
  setupOverlay() {
    this.overlayBtn?.remove();
    this.overlayBtn = this.overlayImg = null;
    const src = this.map?.overlay?.src;
    if (!src) return;
    const btn = document.createElement('button');
    btn.id = 'map-overlay-btn';
    btn.className = 'pixel-btn';
    btn.textContent = '🗺';
    btn.setAttribute('aria-label', 'Show the real map');
    document.body.appendChild(btn);
    this.overlayBtn = btn;
    this.events.once('shutdown', () => {
      btn.remove();
      this.overlayBtn = this.overlayImg = null;
    });
    const img = new Image();
    img.onload = () => {
      if (!this.sys.isActive() || this.overlayBtn !== btn) return;
      if (!this.textures.exists('map-overlay')) this.textures.addImage('map-overlay', img);
      this.textures.get('map-overlay').setFilter(Phaser.Textures.FilterMode.LINEAR); // a picture, not pixel art
      this.overlayImg = this.add.image(0, 0, 'map-overlay').setOrigin(0).setDisplaySize(W * T, H * T).setDepth(50000).setVisible(false);
    };
    img.src = src;
    const levels = [0, 0.45, 0.85];
    let level = 0;
    btn.onclick = () => {
      if (!this.overlayImg) return this.toast('The map is still loading…');
      level = (level + 1) % levels.length;
      this.overlayImg.setVisible(level > 0).setAlpha(levels[level] || 0);
      btn.classList.toggle('on', level > 0);
      this.toast(level ? `Real map · ${level === 1 ? 'faint' : 'strong'} · tap again to ${level === 1 ? 'strengthen' : 'hide'}` : 'Real map hidden');
    };
  }

  // the boat: pick an island, then sail
  sail() {
    if (this.leaving) return;
    const here = this.map?.name;
    const options = [];
    if (this.mapId !== 'main') options.push({ label: 'Main Island', sub: 'Home: the museum’s island', go: { map: 'main', spawn: 'dock' } });
    if (this.map) options.push({ label: 'Island One', sub: 'The first island (museum shut)', go: { map: 'one', spawn: 'dock' } });
    Object.entries(MAPS).forEach(([id, m]) => id !== 'main' && id !== this.mapId && options.push({ label: m.name === 'Untitled island' ? 'The far isle' : m.name, sub: 'An island to explore', go: { map: id } }));
    const mine = builderIslands();
    mine.forEach((m) => m.name !== here && options.push({ label: m.name, sub: m.overlay ? `A real place · ${m.w}×${m.h}` : `Your island · ${m.w}×${m.h}`, go: { mapData: m } }));
    if (here !== 'Wakefield, MA' && !mine.some((m) => m.name === 'Wakefield, MA')) options.push({ label: 'Wakefield, MA', sub: 'A real place · every street', go: { mapUrl: './maps/wakefield.json' } });
    this.paused = true;
    openSail(options, (pick) => {
      this.paused = false;
      if (pick) this.sailTo(pick.go);
    });
  }

  sailTo(go) {
    if (this.leaving) return;
    this.leaving = true;
    hideTalk();
    this.interactBtn.classList.add('hidden');
    sfx('door');
    this.cameras.main.fadeOut(400, 20, 40, 70);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (!go.mapUrl) return this.scene.start('island', go);
      fetch(go.mapUrl)
        .then((r) => r.json())
        .then((mapData) => this.scene.start('island', { mapData }))
        .catch(() => {
          this.leaving = false;
          this.cameras.main.fadeIn(300);
          this.toast('Could not reach that place. Try again.');
        });
    });
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
    if (this.map) {
      // by a boat, or back where you stepped off
      if (this.boats.some((b) => Math.hypot(x - b.x, y - b.y) < 64) || (this.landingSpot && Math.hypot(x - this.landingSpot.x, y - this.landingSpot.y) < 36)) best = { boat: true, icon: 'door' };
      if (this.door && Math.hypot(x - this.door.x, y - (this.door.y + 4)) < 30) best = { door: true, icon: 'door' };
      this.islanders.forEach((n) => {
        const d = Math.hypot(x - n.s.x, y - n.s.y);
        if (d < 26 && d < bestD) {
          best = n.animal ? { animal: n, icon: 'talk' } : { npc: n, icon: 'talk' };
          bestD = d;
        }
      });
    } else {
      const dd = Math.hypot(x - DOOR.x, y - (DOOR.y + 4));
      if (dd < 30 && dd < bestD) best = { locked: true, icon: 'door' };
      if (Math.hypot(x - COTTAGE.x, y - (COTTAGE.y + 8)) < 22) best = { cottage: true, icon: 'door' };
      if (Math.hypot(x - 14 * T, y - 39.4 * T) < 56) best = { boat: true, icon: 'door' }; // the rowboat at the dock
    }
    if (!best) {
      const spot = this.waterAhead();
      if (spot) best = { fish: spot, icon: 'fish' };
    }
    return best;
  }

  // Open water a short cast ahead of where you're facing: { x, y, water }.
  waterAhead() {
    const p = this.player;
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[this.facing];
    for (const d of [30, 44, 58]) {
      const x = p.x + dx * d;
      const y = p.y - 4 + dy * d;
      if (this.ground_(x, y) !== 'water') continue;
      // the bobber needs a little open water round it too
      if (this.ground_(x + 8, y) !== 'water' || this.ground_(x - 8, y) !== 'water') continue;
      const cx = Math.floor(x / T);
      const cy = Math.floor(y / T);
      const pond = cx >= 0 && cy >= 0 && cx < W && cy < H && this.key(cx, cy, (m) => m === 3) !== '0000';
      return { x, y, water: pond ? 'pond' : 'sea' };
    }
    return null;
  }

  interact() {
    const f = this.focus;
    if (!f || this.leaving) return;
    if (this.fishing.busy) return this.fishing.tap();
    if (f.boat) return this.sail();
    if (f.door) return this.goInside();
    if (f.locked) return this.toast('The doors are locked. The museum is on Main Island now.');
    if (f.animal) return this.petAnimal(f.animal);
    if (f.cottage) return this.enterCottage();
    if (f.fish) {
      if (this.season === 'winter' && f.fish.water === 'pond') return this.toast('The pond is frozen solid. Try the sea.');
      this.fishing.facing = this.facing;
      this.fishing.cast(f.fish, f.fish.water, this.weatherKind);
      this.interactBtn.querySelector('.label').textContent = 'Hook';
      return;
    }
    if (f.pet) return this.pet.pet();
    if (talking()) return hideTalk();
    if (f.npc) return this.talkTo(f.npc);
    sfx('talk');
    const r = this.game.canvas.getBoundingClientRect();
    const cam = this.cameras.main;
    const k = r.width / this.scale.gameSize.width;
    showTalk(f.thing.name === 'chest' ? 'Treasure chest' : 'Sign', 'The island', f.thing.text, { x: r.left + (f.thing.x - cam.worldView.x) * cam.zoom * k, y: r.top + (f.thing.y - 30 - cam.worldView.y) * cam.zoom * k });
  }

  enterCottage() {
    if (this.leaving) return;
    this.leaving = true;
    hideTalk();
    this.interactBtn.classList.add('hidden');
    sfx('door');
    this.cameras.main.fadeOut(220, 29, 21, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('iso'));
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
    this.fishing.update(dt);
    this.moveIslanders(dt);
    if (this.paused) return;
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    let pace = 1;
    if (this.fishing.busy) {
      // walking off reels the line in
      if ((vx || vy) && this.fishing.state !== 'reel') this.fishing.end();
      else vx = vy = 0;
    }
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
        p.setTexture('player_side').setFlipX(vx < 0);
        this.facing = vx < 0 ? 'left' : 'right';
      } else {
        p.setTexture(vy < 0 ? 'player_up' : 'player_down').setFlipX(false);
        this.facing = vy < 0 ? 'up' : 'down';
      }
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
    // Walk up into the doors to go back inside (main island only).
    const D = this.door;
    const atDoor = !!D && Math.abs(p.x - D.x) < 20 && p.y < D.y + 10 && p.y > D.y - 12;
    if (this.doorLock && !atDoor) this.doorLock = false;
    if (!this.doorLock && atDoor && vy < 0) {
      if (this.map) return this.goInside();
      this.doorLock = true; // Island One: the doors are shut
      this.toast('The doors are locked. The museum is on Main Island now.');
    }
    // and up into the cottage door for the angled room
    const atCottage = !this.map && Math.abs(p.x - COTTAGE.x) < 10 && p.y < COTTAGE.y + 10 && p.y > COTTAGE.y - 6; // right at the door, not anywhere above it
    if (this.cottageLock && !atCottage) this.cottageLock = false;
    if (!this.cottageLock && atCottage && vy < 0) return this.enterCottage();

    if (talking() && this.focus?.thing && Math.hypot(p.x - this.focus.thing.x, p.y - this.focus.thing.y) > 60) hideTalk();
    const prev = this.focus?.icon;
    if (!this.fishing.busy) this.focus = this.findFocus();
    this.interactBtn.classList.toggle('hidden', !this.focus || (this.fishing.busy && this.fishing.state === 'reel'));
    if (this.focus && this.focus.icon !== prev) this.interactBtn.querySelector('.bang').innerHTML = iconSvg(this.focus.icon);
    if (!this.fishing.busy) this.interactBtn.querySelector('.label').textContent = this.focus?.fish ? 'Fish' : this.focus?.boat ? 'Sail' : 'Interact';
    if (this.focus && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) this.interact();
  }
}
