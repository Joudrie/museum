// Wakefield, Massachusetts, drawn from its real shapes (public/maps/wakefield.vec.json, made by
// tools/wakefield_vector.py), not from tiles. Roads are lines of their own width, buildings and
// lakes are polygons, and the town line is a polygon, so a road at 45 degrees is a straight 45 degree
// line and nothing ever straddles two things. Dirt, brick, grass and water are painted inside those
// shapes with the game's tile art as the fill, lined up across the whole town.
//
// It reuses the island scene for everything else (walking, the boat, fishing, weather), overriding
// only what the tile grid decided: what is drawn, where you can stand, and what the ground is.
import { IslandScene, islandTiles } from './IslandScene.js';
import { T } from './tiles.js';

const S = 16 * T; // a chunk of ground is 16 x 16 tiles
const SAND = '#e2c68a';
const BRICK_EDGE = '#6e2f25';

// [x0, y0, dx, dy, ...] to [x, y, x, y, ...]
const unpack = (a) => {
  const out = new Array(a.length);
  let x = a[0];
  let y = a[1];
  out[0] = x;
  out[1] = y;
  for (let i = 2; i < a.length; i += 2) {
    x += a[i];
    y += a[i + 1];
    out[i] = x;
    out[i + 1] = y;
  }
  return out;
};

const inRing = (r, x, y) => {
  let inside = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [r[i], r[i + 1], r[j], r[j + 1]];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

const nearSegment = (r, x, y, half) => {
  const h2 = half * half;
  for (let i = 0; i < r.length - 2; i += 2) {
    const [ax, ay, bx, by] = [r[i], r[i + 1], r[i + 2], r[i + 3]];
    const dx = bx - ax;
    const dy = by - ay;
    const L = dx * dx + dy * dy;
    const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / L)) : 0;
    const ex = ax + dx * t - x;
    const ey = ay + dy * t - y;
    if (ex * ex + ey * ey <= h2) return true;
  }
  return false;
};

// the shapes, indexed by the chunk they touch
class World {
  constructor(vec) {
    this.w = vec.w;
    this.h = vec.h;
    this.spawn = vec.spawn;
    this.name = vec.name;
    this.town = vec.town.map(unpack);
    this.lakes = vec.water.map(({ o, i }) => ({ outer: o.map(unpack), rings: [...o, ...i].map(unpack) }));
    this.rivers = vec.rivers.map((r) => ({ w: r.w, p: unpack(r.p) }));
    this.rail = vec.rail.map((r) => ({ w: r.w, p: unpack(r.p) }));
    this.roads = vec.roads.map((r) => ({ w: r.w, p: unpack(r.p) }));
    this.buildings = vec.buildings.map(unpack);
    this.buckets = new Map();
    this.rows = []; // town-line segments by chunk row, for "is this point in town?"
    this.edge = new Set(); // chunks the town line passes through
    this.townPath = new Path2D();
    this.town.forEach((r) => {
      r.forEach((v, i) => (i % 2 ? null : i ? this.townPath.lineTo(v, r[i + 1]) : this.townPath.moveTo(v, r[i + 1])));
      this.townPath.closePath();
      for (let i = 0; i < r.length - 2; i += 2) this.addTownSegment(r[i], r[i + 1], r[i + 2], r[i + 3]);
    });
    const along = (p, pad, add) => {
      const seen = new Set();
      for (let i = 0; i < p.length - 2; i += 2) {
        const [ax, ay, bx, by] = [p[i], p[i + 1], p[i + 2], p[i + 3]];
        const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (S / 4)));
        for (let k = 0; k <= n; k++) {
          const x = ax + ((bx - ax) * k) / n;
          const y = ay + ((by - ay) * k) / n;
          for (let cy = Math.floor((y - pad) / S); cy <= Math.floor((y + pad) / S); cy++)
            for (let cx = Math.floor((x - pad) / S); cx <= Math.floor((x + pad) / S); cx++) {
              const key = `${cx},${cy}`;
              if (!seen.has(key)) {
                seen.add(key);
                add(this.bucket(cx, cy));
              }
            }
        }
      }
    };
    const box = (p, pad, add) => {
      let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9];
      for (let i = 0; i < p.length; i += 2) {
        x0 = Math.min(x0, p[i]);
        x1 = Math.max(x1, p[i]);
        y0 = Math.min(y0, p[i + 1]);
        y1 = Math.max(y1, p[i + 1]);
      }
      for (let cy = Math.floor((y0 - pad) / S); cy <= Math.floor((y1 + pad) / S); cy++) for (let cx = Math.floor((x0 - pad) / S); cx <= Math.floor((x1 + pad) / S); cx++) add(this.bucket(cx, cy));
    };
    this.roads.forEach((r) => along(r.p, r.w / 2 + 4, (b) => b.roads.push(r)));
    this.rail.forEach((r) => along(r.p, r.w / 2 + 4, (b) => b.rail.push(r)));
    this.rivers.forEach((r) => along(r.p, r.w / 2 + 12, (b) => b.rivers.push(r)));
    this.lakes.forEach((l) => l.outer.forEach((p) => box(p, 12, (b) => b.lakes.push(l))));
    this.buildings.forEach((p) => box(p, 2, (b) => b.buildings.push(p)));
  }

  addTownSegment(ax, ay, bx, by) {
    if (ay !== by) for (let row = Math.floor(Math.min(ay, by) / S); row <= Math.floor(Math.max(ay, by) / S); row++) (this.rows[row] ||= []).push([ax, ay, bx, by]);
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (S / 4)));
    for (let k = 0; k <= n; k++) {
      const cx = Math.floor((ax + ((bx - ax) * k) / n) / S);
      const cy = Math.floor((ay + ((by - ay) * k) / n) / S);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) this.edge.add(`${cx + dx},${cy + dy}`);
    }
  }

  bucket(cx, cy) {
    const k = `${cx},${cy}`;
    let b = this.buckets.get(k);
    if (!b) this.buckets.set(k, (b = { roads: [], rail: [], rivers: [], lakes: [], buildings: [] }));
    return b;
  }

  inTown(x, y) {
    let inside = false;
    (this.rows[Math.floor(y / S)] || []).forEach(([ax, ay, bx, by]) => {
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
    });
    return inside;
  }

  chunkClass(cx, cy) {
    if (this.edge.has(`${cx},${cy}`)) return 'edge';
    return this.inTown(cx * S + S / 2, cy * S + S / 2) ? 'in' : 'out';
  }

  inWater(x, y) {
    const b = this.bucket(Math.floor(x / S), Math.floor(y / S));
    return b.lakes.some((l) => l.rings.reduce((n, r) => n + (inRing(r, x, y) ? 1 : 0), 0) % 2 === 1) || b.rivers.some((r) => nearSegment(r.p, x, y, r.w / 2));
  }

  onRoad(x, y) {
    return this.bucket(Math.floor(x / S), Math.floor(y / S)).roads.some((r) => nearSegment(r.p, x, y, r.w / 2));
  }

  // Wakefield you can walk on: in town, and not in water unless it is a bridge
  walkable(x, y) {
    return this.inTown(x, y) && (!this.inWater(x, y) || this.onRoad(x, y));
  }
}

const worlds = new WeakMap(); // the shapes are indexed once, however many times you visit
export const worldFor = (vec) => {
  if (!worlds.has(vec)) worlds.set(vec, new World(vec));
  return worlds.get(vec);
};

export class WakefieldScene extends IslandScene {
  constructor() {
    super('wakefield');
  }

  init(data) {
    this.spawnAt = undefined;
    this.mapId = 'wakefield';
    this.world = worldFor(data.vec);
    this.map = { name: this.world.name, kind: 'island', w: Math.ceil(this.world.w / T), h: Math.ceil(this.world.h / T), corners: [], tiles: {}, objects: [] };
  }

  makeMap() {
    this.corners = [];
    this.edges = new Map();
  }

  // the tile art, as fills that line up across the whole town
  sources() {
    const TILES = islandTiles();
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
      dirt: make(64, (g) => {
        for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) g.drawImage(TILES[(x + y) % 2 ? 'dirt_2' : 'dirt_1'].frames[0], x * T, y * T);
      }),
      brick: TILES.brick.frames[0],
      rock: TILES.rock_1.frames[0],
      water: TILES.water.frames,
    };
  }

  drawGround() {
    this.chunk = 16;
    this.src = this.sources();
    this.seaKeys = [];
    this.groundAnim = new Set();
    this.chunks = new Map();
    this.chunkRange = '';
    this.events.once('shutdown', () => [...this.chunks.values()].forEach((e) => this.dropChunk(e)));
  }

  paintChunk(ctx, cx, cy, f) {
    const { world, src } = this;
    const [x0, y0] = [cx * S, cy * S];
    const pat = (img) => ctx.createPattern(img, 'repeat');
    const cls = world.chunkClass(cx, cy);
    const b = world.bucket(cx, cy);
    ctx.translate(-x0, -y0); // the fills are anchored to the town, so chunks meet with no seam
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (cls !== 'in') {
      ctx.fillStyle = pat(src.water[f % src.water.length]);
      ctx.fillRect(x0, y0, S, S);
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
    ctx.fillRect(x0, y0, S, S);
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
    ctx.strokeStyle = pat(src.rock);
    b.rail.forEach((r) => {
      ctx.beginPath();
      line(r);
      ctx.lineWidth = r.w;
      ctx.stroke();
    });
    // roads, narrow to wide (the bucket keeps that order), one stroke per width
    ctx.strokeStyle = pat(src.dirt);
    let i = 0;
    while (i < b.roads.length) {
      const w = b.roads[i].w;
      ctx.beginPath();
      for (; i < b.roads.length && b.roads[i].w === w; i++) line(b.roads[i]);
      ctx.lineWidth = w;
      ctx.stroke();
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

  buildChunk(cx, cy) {
    const b = this.world.bucket(cx, cy);
    const frames = this.world.chunkClass(cx, cy) !== 'in' || b.lakes.length || b.rivers.length ? 4 : 1; // the water ebbs
    const keys = Array.from({ length: frames }, (_, f) => this.chunkCanvas(`wk_${cx}_${cy}_${f}`, (ctx) => this.paintChunk(ctx, cx, cy, f)));
    const img = this.add.image(cx * S, cy * S, keys[0]).setOrigin(0).setDepth(0);
    const entry = { img, keys, cx, cy, snow: null };
    if (keys.length > 1) this.groundAnim.add(entry);
    this.chunks.set(`${cx},${cy}`, entry);
  }

  // the corners of a tile, as the island scene's ground codes: 0 sea, 2 grass, 3 water, 4 road
  key(x, y, test) {
    const at = (px, py) => (!this.world.inTown(px, py) ? 0 : this.world.inWater(px, py) && !this.world.onRoad(px, py) ? 3 : this.world.onRoad(px, py) ? 4 : 2);
    return [at(x * T, y * T), at((x + 1) * T, y * T), at(x * T, (y + 1) * T), at((x + 1) * T, (y + 1) * T)].map((m) => (test(m) ? 1 : 0)).join('');
  }

  free(x, y) {
    return [[x - 6, y - 2], [x + 6, y - 2], [x - 6, y - 7], [x + 6, y - 7]].every(([px, py]) => this.world.walkable(px, py));
  }

  ground_(x, y) {
    return this.world.walkable(x, y) ? 'grass' : 'water';
  }

  surfaceAt(x, y) {
    if (!this.world.inTown(x, y)) return 'sand';
    if (this.world.onRoad(x, y)) return 'path';
    return this.world.inWater(x, y) ? 'shore' : 'grass';
  }

  pondRect() {
    return null; // the lakes are many and far apart
  }

  // you start on a road near the middle of town, by the boat
  landing() {
    const [x, y] = this.world.spawn;
    this.boats.push({ x, y, virtual: true });
    return (this.landingSpot = { x, y });
  }
}
