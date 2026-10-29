// The world as the progression layer adds to it: fog that clears as you walk (in chunks), secrets
// to find ("?" markers with Exploring 4), sparkle pickups that come back each day in new places,
// viewpoints that clear a whole area, and things you can see but cannot yet reach (a lock and what
// it needs). Positions are seeded by island and day, so they are the same on every visit.
import { progression } from '../index.js';
import { REGIONS } from '../species.js';
import { GIFTS } from '../friendship.js';
import { UNLOCK_NAMES } from '../grants.js';
import { LEGENDS } from '../species.js';
import { sfx } from '../../music.js';

const T = 32;
const CHUNK = 8;
const NAMES = ['A hidden shell cache', 'Carved initials', 'An old lantern', 'A message in a bottle', 'Strange footprints', 'A buried button', 'A tiny shrine', 'Someone’s lost hat', 'A heart scratched in stone', 'A bird’s nest, empty', 'A ring of mushrooms', 'A rope ladder, rotten'];
const LOCKS = [null, null, 'gear:gloves', null, 'gear:lantern', null, 'gear:boots'];

export class WorldLife {
  constructor(scene) {
    this.scene = scene;
    this.p = progression();
    this.region = scene.regionKey;
    this.info = REGIONS[this.region];
    this.g = scene.add.graphics().setDepth(3990);
    this.t = 0;
    this.slow = 0;
    this.labels = [];
    this.generate();
    scene.events.once('shutdown', () => this.destroy());
  }

  rng(label) {
    return this.p.rngFor(`world:${this.region}:${label}`);
  }

  land(x, y) {
    const s = this.scene;
    return s.ground_(x, y) !== 'water' && s.free(x, y);
  }

  // up to `n` free land points, seeded, kept apart from each other
  scatter(r, n, minGap = 5 * T, avoid = []) {
    const s = this.scene;
    const out = [];
    for (let tries = 0; tries < 900 && out.length < n; tries++) {
      const x = (3 + r() * (s.tilesW - 6)) * T;
      const y = (3 + r() * (s.tilesH - 6)) * T;
      if (!this.land(x, y)) continue;
      if ([...out, ...avoid].some((o) => Math.hypot(o.x - x, o.y - y) < minGap)) continue;
      out.push({ x, y });
    }
    return out;
  }

  generate() {
    const r = this.rng('layout');
    const n = this.info?.secrets ?? 3;
    const legendId = this.info?.legend;
    const spots = this.scatter(() => r(), n + 2, 6 * T);
    this.secrets = spots.slice(0, n).map((pt, i) => {
      const isClue = i === 0 && legendId && LEGENDS[legendId];
      const needs = !isClue && i > 0 ? LOCKS[i % LOCKS.length] : null;
      return { ...pt, id: isClue ? `${this.region}:${LEGENDS[legendId].clue.secret}` : `${this.region}:s${i}`, name: isClue ? LEGENDS[legendId].clue.text.split('.')[0] : NAMES[(i * 5 + this.region.length) % NAMES.length], needs, clue: !!isClue };
    });
    // two viewpoints per island; the second is on a ledge that needs climbing gloves
    this.views = spots.slice(n, n + 2).map((pt, i) => ({ ...pt, id: `${this.region}:view${i + 1}`, needs: i === 1 ? 'gear:gloves' : null }));
    this.rollSparkles();
  }

  // forage that fits the island and the season, in new places each day
  rollSparkles() {
    const day = this.p.today();
    if (this.sparkDay === day) return;
    this.sparkDay = day;
    const r = this.rng(`sparkle:${day}`);
    const zone = this.info?.zone || 'temperate';
    const season = this.scene.season;
    const fit = Object.entries(GIFTS).filter(([, g]) => g.source === 'forage' && g.regions.includes(zone) && g.seasons.includes(season)).map(([id]) => id);
    const kinds = fit.length ? fit : ['shell'];
    const n = 6 + (this.p.has('foraging.extra_spots') ? 2 : 0);
    const picked = this.p.state.world.forage[day] || {};
    this.sparkles = this.scatter(() => r(), n, 3 * T).map((pt, i) => ({ ...pt, key: `${this.region}:${i}`, item: kinds[i % kinds.length], rare: this.p.has('foraging.rare_forage') && i === 0 })).filter((sp) => !picked[sp.key]);
  }

  locked(needs) {
    return needs && !this.p.state.unlocks[needs];
  }

  update(dt) {
    const s = this.scene;
    if (s.leaving) return;
    this.t += dt;
    this.slow += dt;
    const g = this.g;
    g.clear();
    const pl = s.player;
    const cam = s.cameras.main.worldView;
    const sight = (this.p.has('exploring.sparkle_far') ? 14 : 7) * T;
    const marks = this.p.has('exploring.question_marks');
    // sparkles
    this.sparkles.forEach((sp) => {
      if (sp.x < cam.x - 40 || sp.x > cam.right + 40 || sp.y < cam.y - 40 || sp.y > cam.bottom + 40) return;
      if (Math.hypot(sp.x - pl.x, sp.y - pl.y) > sight) return;
      const a = 0.5 + 0.5 * Math.sin(this.t * 5 + sp.x);
      g.fillStyle(sp.rare ? 0xc88af0 : 0xfff2a0, 0.5 + a * 0.5);
      g.fillRect(sp.x - 1, sp.y - 4 - a * 2, 2, 8);
      g.fillRect(sp.x - 4, sp.y - 1 - a * 2, 8, 2);
    });
    // viewpoints: a little flag
    this.views.forEach((v) => {
      if (v.x < cam.x - 40 || v.x > cam.right + 40 || v.y < cam.y - 40 || v.y > cam.bottom + 40) return;
      const done = this.p.state.world.viewpoints[v.id];
      const lock = this.locked(v.needs);
      g.fillStyle(0x1d1714, 1);
      g.fillRect(v.x - 1, v.y - 22, 3, 22);
      g.fillStyle(lock ? 0x777777 : done ? 0x6fd07a : 0xe0405a, 1);
      g.fillTriangle(v.x + 2, v.y - 22, v.x + 14, v.y - 17, v.x + 2, v.y - 12);
      if (lock) {
        g.fillStyle(0xf2d36b, 1);
        g.fillRect(v.x - 4, v.y - 34, 9, 7);
        g.lineStyle(2, 0xf2d36b, 1);
        g.strokeCircle(v.x, v.y - 36, 3);
      }
    });
    // secrets: "?" over those you know to look for, a lock over those you cannot reach yet
    this.secrets.forEach((sc) => {
      const found = this.p.state.world.secrets[sc.id];
      if (found) return;
      const d = Math.hypot(sc.x - pl.x, sc.y - pl.y);
      const lock = this.locked(sc.needs);
      const show = lock ? d < 12 * T : marks ? d < 16 * T : d < 3 * T;
      if (!show || sc.x < cam.x - 40 || sc.x > cam.right + 40 || sc.y < cam.y - 40 || sc.y > cam.bottom + 40) return;
      const bob = Math.sin(this.t * 3 + sc.x) * 2;
      g.fillStyle(lock ? 0x9a8a60 : 0xf2d36b, 0.9);
      g.fillCircle(sc.x, sc.y - 14 + bob, 6);
      g.fillStyle(0x1d1714, 1);
      if (lock) {
        g.fillRect(sc.x - 2, sc.y - 15 + bob, 5, 4);
        g.lineStyle(1.5, 0x1d1714, 1);
        g.strokeCircle(sc.x, sc.y - 16 + bob, 2);
      } else {
        g.fillRect(sc.x - 1, sc.y - 18 + bob, 3, 3);
        g.fillRect(sc.x - 1, sc.y - 12 + bob, 3, 2);
      }
    });
    if (this.slow < 0.2) return;
    this.slow = 0;
    this.checkProximity(pl);
    this.reveal(pl);
  }

  checkProximity(pl) {
    const p = this.p;
    const s = this.scene;
    // pickups: walk over them
    this.sparkles = this.sparkles.filter((sp) => {
      if (Math.hypot(sp.x - pl.x, sp.y - pl.y) > 20) return true;
      const day = p.today();
      (p.state.world.forage[day] ||= {})[sp.key] = true;
      for (const k of Object.keys(p.state.world.forage)) if (Number(k) < day - 1) delete p.state.world.forage[k];
      sfx('star');
      p.bus.emit('ITEM_FORAGED', { itemId: sp.item, region: this.region });
      if (sp.rare) p.bus.emit('ITEM_FORAGED', { itemId: sp.item, region: this.region });
      return false;
    });
    this.secrets.forEach((sc) => {
      if (p.state.world.secrets[sc.id] || this.locked(sc.needs)) return;
      if (Math.hypot(sc.x - pl.x, sc.y - pl.y) > 26) return;
      sfx('unlock');
      p.bus.emit('SECRET_FOUND', { region: this.region, secretId: sc.id, name: sc.name });
    });
    this.views.forEach((v) => {
      if (p.state.world.viewpoints[v.id] || this.locked(v.needs)) return;
      if (Math.hypot(v.x - pl.x, v.y - pl.y) > 26) return;
      sfx('open');
      p.bus.emit('LOCATION_DISCOVERED', { region: this.region, placeId: v.id, name: `${this.info?.name || 'Island'} viewpoint` });
      p.bus.emit('VIEWPOINT', { region: this.region, id: v.id });
      // a viewpoint clears everything around it at once
      this.reveal(v, 5);
    });
    // fast travel notice for Main Island's dock
  }

  // fog: chunks near the player clear as they walk
  reveal(at, radius) {
    const p = this.p;
    const s = this.scene;
    const rad = radius ?? (p.has('exploring.map_sense') ? 2 : 1);
    const cx = Math.floor(at.x / T / CHUNK);
    const cy = Math.floor(at.y / T / CHUNK);
    const seen = p.state.world.chunks[this.region] || {};
    const fresh = [];
    for (let dy = -rad; dy <= rad; dy++)
      for (let dx = -rad; dx <= rad; dx++) {
        const k = `${cx + dx},${cy + dy}`;
        if (seen[k] || cx + dx < 0 || cy + dy < 0 || (cx + dx) * CHUNK >= s.tilesW || (cy + dy) * CHUNK >= s.tilesH) continue;
        if (!this.chunkHasLand(cx + dx, cy + dy)) {
          (p.state.world.chunks[this.region] ||= {})[k] = true; // open water: cleared without a fanfare
          continue;
        }
        fresh.push(k);
      }
    if (fresh.length) p.bus.emit('TILE_REVEALED', { region: this.region, count: fresh.length, chunks: fresh });
    this.fogDirty = true;
  }

  chunkHasLand(cx, cy) {
    const s = this.scene;
    for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.2], [0.8, 0.2], [0.2, 0.8], [0.8, 0.8]]) if (s.ground_((cx + fx) * CHUNK * T, (cy + fy) * CHUNK * T) !== 'water') return true;
    return false;
  }

  // how much of this island's land you have uncovered
  coverage() {
    const s = this.scene;
    if (this.cov?.total == null) {
      let total = 0;
      for (let cy = 0; cy * CHUNK < s.tilesH; cy++) for (let cx = 0; cx * CHUNK < s.tilesW; cx++) if (this.chunkHasLand(cx, cy)) total++;
      this.cov = { total };
    }
    const seen = this.p.state.world.chunks[this.region] || {};
    let n = 0;
    for (const k of Object.keys(seen)) {
      const [cx, cy] = k.split(',').map(Number);
      if (this.chunkHasLand(cx, cy)) n++;
    }
    return { have: n, total: this.cov.total, pct: this.cov.total ? Math.min(100, Math.round((100 * n) / this.cov.total)) : 0 };
  }

  /** A small map of this island with fog over the parts you have not walked (for the Places page). */
  minimap(px = 132) {
    const s = this.scene;
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    const k = px / Math.max(s.tilesW, s.tilesH);
    const seen = this.p.state.world.chunks[this.region] || {};
    for (let cy = 0; cy * CHUNK < s.tilesH; cy++)
      for (let cx = 0; cx * CHUNK < s.tilesW; cx++) {
        const open = !!seen[`${cx},${cy}`];
        for (let ty = 0; ty < CHUNK; ty += 2)
          for (let tx = 0; tx < CHUNK; tx += 2) {
            const gx = cx * CHUNK + tx;
            const gy = cy * CHUNK + ty;
            const ground = s.ground_((gx + 0.5) * T, (gy + 0.5) * T);
            const col = !open ? '#14110f' : ground === 'water' ? '#2a5a7a' : ground === 'sand' ? '#c8a860' : '#5a8a3a';
            g.fillStyle = col;
            g.fillRect(gx * k, gy * k, 2 * k + 0.5, 2 * k + 0.5);
          }
      }
    // markers: viewpoints, locked things, you
    const dot = (x, y, col, r = 2) => {
      g.fillStyle = col;
      g.fillRect((x / T) * k - r, (y / T) * k - r, r * 2, r * 2);
    };
    this.views.forEach((v) => seen[`${Math.floor(v.x / T / CHUNK)},${Math.floor(v.y / T / CHUNK)}`] && dot(v.x, v.y, this.locked(v.needs) ? '#9a8a60' : '#e0405a'));
    this.secrets.forEach((sc) => this.locked(sc.needs) && seen[`${Math.floor(sc.x / T / CHUNK)},${Math.floor(sc.y / T / CHUNK)}`] && dot(sc.x, sc.y, '#f2d36b', 1.5));
    dot(s.player.x, s.player.y, '#ffffff', 2.5);
    return c;
  }

  /** The things you can see here but cannot reach yet, with what they need. */
  gated() {
    const out = [];
    [...this.secrets, ...this.views].forEach((x) => {
      const done = this.p.state.world.secrets[x.id] || this.p.state.world.viewpoints[x.id];
      if (x.needs && !done && this.locked(x.needs)) out.push({ id: x.id, name: x.name || 'A viewpoint on a ledge', needs: UNLOCK_NAMES[x.needs] });
    });
    return out;
  }

  destroy() {
    this.g.destroy();
  }
}
