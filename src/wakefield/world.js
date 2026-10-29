// Wakefield's shapes, indexed by the chunk of ground they touch, and the questions the scene asks of
// them: is this point in town, in water, on a road. No tiles: coordinates are pixels at 8 to the metre.
export const T = 32;
export const FONT = 22; // street names (see tools/wakefield/vector.py)
export const S = 16 * T; // a chunk of ground is 16 x 16 tiles
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
    this.labels = vec.labels || [];
    this.pois = vec.pois || []; // named places: [text, x, y, tier, kind, width]
    // measured from the satellite photos: street surfaces, parking lots, sidewalks (polygons with holes)
    // painted lines on the streets: white and yellow, each one a short or long polyline (a dash is its own line)
    this.marks = ['w', 'y'].flatMap((k) => (vec.marks?.[k] || []).map((l) => ({ k, p: unpack(l) })));
    this.pave = ['lots', 'walks', 'streets'].flatMap((kind) => (vec.pave?.[kind] || []).map((g) => ({ kind, rings: [g.o, ...g.i].map(unpack) })));
    this.geo = vec.geo;
    this.ppm = vec.ppm;
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
    this.pave.forEach((g) => box(g.rings[0], 6, (b) => b.pave.push(g)));
    this.marks.forEach((m) => box(m.p, 4, (b) => b.marks.push(m)));
    this.pois.forEach((l) => {
      const r = l[5] / 2 + 8;
      box([l[1] - r, l[2] - r, l[1] + r, l[2] + r], 0, (b) => b.pois.push(l));
    });
    this.labels.forEach((l) => {
      const r = l[4] / 2 + FONT;
      box([l[1] - r, l[2] - r, l[1] + r, l[2] + r], 0, (b) => b.labels.push(l));
    });
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
    if (!b) this.buckets.set(k, (b = { roads: [], rail: [], rivers: [], lakes: [], buildings: [], labels: [], pois: [], pave: [], marks: [] }));
    return b;
  }

  // the real map's longitude and latitude of a point in the town, and back
  lonOf(x) {
    return this.geo.lon0 + x / (this.ppm * 111320 * this.geo.cos);
  }

  latOf(y) {
    return this.geo.lat1 - y / (this.ppm * 111320);
  }

  xOf(lon) {
    return (lon - this.geo.lon0) * 111320 * this.geo.cos * this.ppm;
  }

  yOf(lat) {
    return (this.geo.lat1 - lat) * 111320 * this.ppm;
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

