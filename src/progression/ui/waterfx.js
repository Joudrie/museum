// What the water shows because of the progression layer: bubbling hot spots,
// frenzies that boil, fish shadows (Fishing 4), the fish-finder ping (14) and
// the legend shimmer (16). A helper owned by a scene; it only draws.
import { sfx } from '../../music.js';
import { hotSlot, msToHotMove, frenzyTimes, inFrenzy, timeSlot, weatherClass } from '../fishroll.js';
import { currentHot, frenzyNow } from '../angling.js';
import { regionInfo, speciesById, legends } from '../species.js';
import { hourNow } from '../../settings.js';

const T = 32;
const SHADOW = { S: [10, 5], M: [16, 7], L: [24, 10], XL: [34, 13], Trophy: [46, 16] };

export class WaterFx {
  constructor(scene, p) {
    this.scene = scene;
    this.p = p;
    this.g = scene.add.graphics().setDepth(3998);
    this.hot = [];
    this.slot = null;
    this.cand = null;
    this.t = 0;
    this.pingT = 0;
    this.shadowObj = null;
    this.legendT = 0;
    this.rumorSpot = null;
  }

  get region() {
    return this.scene.regionKey;
  }

  // water tiles near the shore, found once and kept (stride keeps big maps cheap)
  candidates() {
    if (this.cand) return this.cand;
    const s = this.scene;
    const W = s.tilesW;
    const H = s.tilesH;
    const stride = Math.max(1, Math.floor(Math.sqrt((W * H) / 3500)));
    const out = [];
    for (let ty = 2; ty < H - 2; ty += stride)
      for (let tx = 2; tx < W - 2; tx += stride) {
        const x = tx * T + T / 2;
        const y = ty * T + T / 2;
        if (s.ground_(x, y) !== 'water') continue;
        // land within three tiles in some direction, so a cast from shore can reach it
        const near = [[2, 0], [-2, 0], [0, 2], [0, -2], [3, 0], [-3, 0], [0, 3], [0, -3]].some(([dx, dy]) => s.ground_(x + dx * T, y + dy * T) !== 'water');
        if (near && s.ground_(x + 8, y) === 'water' && s.ground_(x - 8, y) === 'water') out.push([tx, ty]);
      }
    return (this.cand = out.slice(0, 700));
  }

  refresh() {
    const now = this.p.clock.now();
    const slot = hotSlot(now);
    if (slot === this.slot) return;
    this.slot = slot;
    this.hot = currentHot(this.p, this.region, this.candidates()).map((h) => ({ ...h, x: h.tx * T + T / 2, y: h.ty * T + T / 2 }));
  }

  /** The hot spot a cast at this point lands in, or null. */
  hotNear(target) {
    this.refresh();
    const r = this.p.T.fishing.hotspot.radiusTiles * T;
    return this.hot.find((h) => Math.hypot(h.x - target.x, h.y - target.y) <= r) || null;
  }

  /** The week's rumour spot, if this cast lands in it. */
  rumorNear(target) {
    const r = this.p.state.fish.weeklyRumor;
    if (!r || r.caught || r.region !== this.region || !r.spot) return false;
    const x = r.spot[0] * T + T / 2;
    const y = r.spot[1] * T + T / 2;
    return Math.hypot(x - target.x, y - target.y) <= 2 * T;
  }

  showShadow(plan, target) {
    this.hideShadow();
    if (!plan.shadow || !this.p.has('fishing.shadows')) return;
    const [w, h] = SHADOW[plan.shadow.size] || SHADOW.M;
    const s = this.scene;
    this.shadowObj = s.add.ellipse(target.x + 16, target.y + 8, w, h, 0x0a1620, 0.42).setDepth(target.y - 1);
    this.shadowAng = Math.random() * 6.28;
    this.shadowTarget = target;
    this.shadowObj.alpha = 0;
    s.tweens.add({ targets: this.shadowObj, alpha: 0.42, duration: 900 });
  }

  hideShadow() {
    this.shadowObj?.destroy();
    this.shadowObj = null;
  }

  update(dt) {
    const s = this.scene;
    const g = this.g;
    g.clear();
    this.t += dt;
    if (s.leaving) return;
    this.refresh();
    const cam = s.cameras.main.worldView;
    this.frenzyT = (this.frenzyT ?? 0) - dt;
    if (this.frenzyT <= 0) {
      this.frenzyT = 1;
      this.frenzyOn = !!this.hot.length && frenzyNow(this.p);
    }
    const frenzy = this.frenzyOn;
    // bubbling hot spots (only the ones on screen)
    this.hot.forEach((h, idx) => {
      if (h.x < cam.x - 40 || h.x > cam.right + 40 || h.y < cam.y - 40 || h.y > cam.bottom + 40) return;
      const boil = frenzy && idx === 0;
      const n = boil ? 11 : 5;
      for (let i = 0; i < n; i++) {
        const ph = (this.t * (boil ? 1.8 : 0.9) + i * 0.37) % 1;
        const a = i * 2.4 + Math.floor(this.t * 0.9 + i) * 1.3;
        const rad = (boil ? 18 : 11) * ((i % 3) / 3 + 0.35);
        const x = h.x + Math.cos(a) * rad;
        const y = h.y + Math.sin(a) * rad * 0.55 - ph * 7;
        g.fillStyle(0xeaf8ff, (1 - ph) * (boil ? 0.9 : 0.65));
        g.fillCircle(x, y, 1 + (ph < 0.5 ? ph * 2.4 : (1 - ph) * 2.4));
      }
      if (boil) {
        g.lineStyle(1.5, 0xffffff, 0.5 - 0.4 * ((this.t * 1.4) % 1));
        g.strokeEllipse(h.x, h.y, 26 + ((this.t * 1.4) % 1) * 40, 10 + ((this.t * 1.4) % 1) * 16);
      }
    });
    // fish shadow orbiting the bobber
    if (this.shadowObj && this.shadowTarget) {
      this.shadowAng += dt * 0.7;
      this.shadowObj.setPosition(this.shadowTarget.x + Math.cos(this.shadowAng) * 18, this.shadowTarget.y + 8 + Math.sin(this.shadowAng) * 7);
    }
    // the fish finder: a soft ring and a little arrow toward the nearest hot spot
    if (this.p.has('fishing.fish_finder') && !s.fishing.busy && this.hot.length) {
      const pl = s.player;
      let best = null;
      this.hot.forEach((h) => {
        const d = Math.hypot(h.x - pl.x, h.y - pl.y);
        if (!best || d < best.d) best = { h, d };
      });
      if (best && best.d < 10 * T) {
        this.pingT -= dt;
        if (this.pingT <= 0) {
          this.pingT = 4;
          sfx('ping');
          this.pingAt = this.t;
        }
        const k = this.t - (this.pingAt ?? -9);
        if (k < 1.4) {
          g.lineStyle(1.5, 0x9ae8ff, 0.7 * (1 - k / 1.4));
          g.strokeCircle(pl.x, pl.y - 6, 10 + k * 40);
        }
        const ang = Math.atan2(best.h.y - pl.y, best.h.x - pl.x);
        const ax = pl.x + Math.cos(ang) * 34;
        const ay = pl.y - 10 + Math.sin(ang) * 34;
        g.fillStyle(0x9ae8ff, 0.8);
        g.fillTriangle(ax + Math.cos(ang) * 5, ay + Math.sin(ang) * 5, ax + Math.cos(ang + 2.4) * 4, ay + Math.sin(ang + 2.4) * 4, ax + Math.cos(ang - 2.4) * 4, ay + Math.sin(ang - 2.4) * 4);
      }
    }
    // legend sense: gold glints over water that holds an awake legend
    if (this.p.has('fishing.legend_sense') && !s.fishing.busy) {
      this.legendT -= dt;
      if (this.legendT <= 0) {
        this.legendT = 1.2;
        this.legendNear = this.legendHere();
      }
      const spot = this.legendNear && s.waterAhead?.();
      if (spot) {
        for (let i = 0; i < 4; i++) {
          const a = this.t * 1.5 + i * 1.6;
          g.fillStyle(0xfff0a0, 0.4 + 0.4 * Math.sin(this.t * 6 + i));
          g.fillRect(spot.x + Math.cos(a) * 14, spot.y + Math.sin(a) * 6 - 2, 2, 2);
        }
      }
    }
  }

  // is any legend of this region on its trail and in its time/weather right now?
  legendHere() {
    const p = this.p;
    const hour = hourNow();
    return legends().some((sp) => {
      if (!sp.regions.includes(this.region)) return false;
      const trail = p.state.journal.leads[`legend:${sp.id}`];
      if (!trail || (trail.stage !== 'clue' && trail.stage !== 'ready')) return false;
      return sp.times.includes(timeSlot(hour)) && sp.weathers.includes(weatherClass(this.scene.weatherKind)) && sp.seasons.includes(this.scene.season);
    });
  }

  destroy() {
    this.g.destroy();
    this.hideShadow();
  }
}
