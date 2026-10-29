// Fishing: stand at the water's edge facing the water and tap Fish. The line
// goes out, the bobber floats and nibbles, then it dips and a "!" pops over your
// head: tap to hook, then keep the hook on the fish while you reel it in. What
// bites, how big it is and what it is worth are decided by the progression layer
// (src/progression/): this file draws the cast and the line and reports what
// happened. Every catch goes in the fish log (Journal → Fish).
import Phaser from 'phaser';
import { sfx } from './music.js';
import { haptic } from './ui.js';
import { hourNow } from './settings.js';
import { list, slugOf, RARITY as RARITY_NAMES } from './collections/index.js';
import { drawEntry, drawShadow as shadowOf } from './collections/render.js';
import { registerTabExtra } from './collections/tab.js';
import { progression, hold, release } from './progression/index.js';
import { prepareCast, completeCast, loseCast, newReel, RODS, rodUnlocked, equipRod, equipBait, equipLure, currentRod, BAITS, LURES } from './progression/angling.js';
import { speciesById } from './progression/species.js';
import { showReveal, showNearMiss, runReel, catchOpen as revealOpen } from './progression/ui/reveal.js';
import { WaterFx } from './progression/ui/waterfx.js';
import { fishFinishLines } from './progression/ui/fieldjournal.js';
import { cosmeticColor } from './progression/ui/lookfx.js';

// What the log shows: fish (rules in src/progression/species.js) and finds (not fish; some belong in the museum).
const view = (e) => ({
  id: slugOf(e),
  name: e.title,
  rarity: e.rarity ?? 1,
  ...e.acquire,
  ...(e.collectable === false && { junk: true }),
  ...(e.provenance?.story && { note: e.provenance.story }),
  entry: e,
});
export const FISH = list({ collection: 'fish' }).map(view);
export const FINDS = list({ collection: 'find', all: true }).map(view);
export const RARITY = RARITY_NAMES;

export const catchOpen = revealOpen;

// ---------- Drawing ----------
// Fish and finds are drawn from their registry entries (src/collections/render.js).
export const drawCatch = (item, scale = 4) => drawEntry(item.entry, scale);
// A silhouette for fish you haven't caught yet.
export const drawShadow = (item, scale = 3) => shadowOf(item.entry, scale);
const OUT = '#1d1714';

// The bobber as seen on the water, 7×9.
export function bobberTexture(scene, b) {
  const key = `bobber_${b.id}`;
  if (scene.textures.exists(key)) return key;
  const rows = ['..###..', '.#ttt#.', '#ttttt#', '#ttttt#', '#bbbbb#', '#bbbbb#', '.#bbb#.', '..###..', '...#...'];
  const t = scene.textures.createCanvas(key, 7, 9);
  const g = t.getContext();
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch === '.') return;
      g.fillStyle = ch === '#' ? OUT : ch === 't' ? b.top : b.base;
      g.fillRect(x, y, 1, 1);
    }),
  );
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.fillRect(2, 2, 1, 1);
  t.refresh();
  return key;
}

// ---------- The journal tab ----------
// The Fish tab itself is generic (src/collections/tab.js). Fishing adds the rods,
// bait and lures above the log.
registerTabExtra('fish', ({ refresh }) => {
  const p = progression();
  const st = p.state;
  const nodes = [];
  const h = (t) => {
    const n = document.createElement('h3');
    n.className = 'fish-h';
    n.textContent = t;
    return n;
  };
  fishFinishLines().forEach((n) => nodes.push(n));
  nodes.push(h('Rods'));
  const blist = document.createElement('div');
  blist.className = 'bobber-list';
  const cur = currentRod(st);
  Object.entries(RODS).forEach(([id, r]) => {
    const open = rodUnlocked(st, id);
    const row = document.createElement('button');
    row.className = 'bobber' + (id === cur.id ? ' on' : '') + (open ? '' : ' locked');
    row.disabled = !open;
    row.innerHTML = `<i class="bob-dot" style="--top:${r.top};--base:${r.base}"></i><span><b></b><small></small></span><em></em>`;
    row.querySelector('b').textContent = r.name;
    row.querySelector('small').textContent = open ? `Bites in ${r.wait[0]}–${r.wait[1]}s · ${(r.window / 1000).toFixed(2)}s to react${r.rareMult > 1 ? ` · rare fish +${Math.round((r.rareMult - 1) * 100)}%` : ''}` : r.text;
    row.querySelector('em').textContent = id === cur.id ? 'Equipped' : open ? 'Equip' : 'Locked';
    if (open)
      row.onclick = () => {
        equipRod(st, id);
        p.store.commit();
        sfx('tap');
        refresh();
      };
    blist.appendChild(row);
  });
  nodes.push(blist);

  const gear = [...Object.entries(st.fish.baits).map(([id, n]) => ({ id, n, kind: 'bait', def: BAITS[id] })), ...(p.has('fishing.lure_slot') ? Object.entries(st.fish.lures).map(([id, n]) => ({ id, n, kind: 'lure', def: LURES[id] })) : [])].filter((g) => g.def);
  nodes.push(h('Bait and lures'));
  const glist = document.createElement('div');
  glist.className = 'bobber-list';
  if (!gear.length) {
    const none = document.createElement('p');
    none.className = 'catch-note';
    none.textContent = 'No bait yet. Ranks, skills and the shop give some. A good bait pulls the fish you want.';
    nodes.push(none);
  }
  gear.forEach((g) => {
    const on = st.fish.equipped[g.kind] === g.id;
    const row = document.createElement('button');
    row.className = 'bobber' + (on ? ' on' : '');
    row.innerHTML = `<i class="bob-dot" style="--top:#c8904a;--base:#e8c890"></i><span><b></b><small></small></span><em></em>`;
    row.querySelector('b').textContent = `${g.def.name} ×${g.n}`;
    row.querySelector('small').textContent = g.def.desc;
    row.querySelector('em').textContent = on ? 'Equipped' : 'Equip';
    row.onclick = () => {
      const ok = on ? (g.kind === 'bait' ? equipBait(st, '') : equipLure(st, '', p.perks())) : g.kind === 'bait' ? equipBait(st, g.id) : equipLure(st, g.id, p.perks());
      if (ok !== false) p.store.commit();
      sfx('tap');
      refresh();
    };
    glist.appendChild(row);
  });
  nodes.push(glist);
  return nodes;
});

const JUNK = () => FINDS.filter((f) => f.junk);

// ---------- The fishing itself ----------
// Runs inside a scene; the scene supplies the player sprite and calls
// update(dt) each frame. tap() is the hook (screen tap or the button).
export class Fishing {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.state = 'idle';
    this.g = scene.add.graphics().setDepth(4000);
    this.fx = scene.waterfx = new WaterFx(scene, progression());
    scene.events.once('shutdown', () => {
      this.end();
      this.fx.destroy();
      release('fishing');
    });
  }

  get busy() {
    return this.state !== 'idle';
  }

  // facing: 'up' | 'down' | 'left' | 'right'; target: where the bobber lands
  cast(target, water, weather) {
    if (this.busy) return;
    const s = this.scene;
    const p = progression();
    const hot = this.fx.hotNear(target);
    this.plan = prepareCast(p, {
      mapId: s.regionKey,
      water,
      weather,
      hour: hourNow(),
      season: s.season,
      hotNear: !!hot,
      rumorHere: this.fx.rumorNear(target),
      spotId: hot ? `hot:${hot.tx},${hot.ty}` : `${Math.floor(target.x / 32)},${Math.floor(target.y / 32)}`,
    });
    hold('fishing');
    this.target = target;
    this.rod = this.plan.rod;
    this.state = 'cast';
    this.t = 0;
    sfx('cast');
    haptic(10);
    const key = bobberTexture(s, this.rod);
    const tip = this.tip();
    this.bob = s.add.image(tip.x, tip.y, key).setOrigin(0.5, 1).setDepth(target.y + 1);
    s.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 480,
      ease: 'Sine.easeOut',
      onUpdate: (tw) => {
        if (!this.bob) return;
        const k = tw.getValue();
        const a = this.tip();
        this.bob.setPosition(a.x + (target.x - a.x) * k, a.y + (target.y + 3 - a.y) * k - Math.sin(k * Math.PI) * 30);
      },
      onComplete: () => {
        if (!this.bob || this.state !== 'cast') return;
        this.splash(target.x, target.y + 2, 1);
        sfx('plop');
        this.state = 'wait';
        this.t = 0;
        this.biteAt = this.plan.wait;
        this.nibbles = [0.35, 0.6, 0.8].filter(() => Math.random() < 0.6).map((k) => this.biteAt * k);
        // rarer fish twitch the bobber before they commit: the pulse rises before the reveal
        const pulses = this.plan.tell.pulses;
        this.twitches = Array.from({ length: pulses }, (_, i) => Math.max(0.2, this.biteAt - 0.28 * (pulses - i)));
        this.fx.showShadow(this.plan, target);
      },
    });
  }

  // the rod's tip: off the player's hand, out toward the water
  tip() {
    const p = this.player;
    const f = this.facing;
    const dx = f === 'left' ? -14 : f === 'right' ? 14 : f === 'up' ? 5 : -5;
    const dy = f === 'up' ? -30 : f === 'down' ? -12 : -24;
    return { x: p.x + dx, y: p.y + dy };
  }

  splash(x, y, big) {
    const s = this.scene;
    for (let i = 0; i < (big ? 2 : 1); i++) {
      const ring = s.add.ellipse(x, y, 6, 2.4).setStrokeStyle(1, 0xf2fbff, 0.9).setDepth(y);
      s.tweens.add({ targets: ring, scaleX: 3 + i, scaleY: 3 + i, alpha: 0, delay: i * 140, duration: 700, onComplete: () => ring.destroy() });
    }
    if (big)
      for (let i = 0; i < 5; i++) {
        const drop = s.add.rectangle(x, y - 2, 1.5, 1.5, 0xe8f6ff).setDepth(y + 2);
        s.tweens.add({ targets: drop, x: x + (Math.random() - 0.5) * 14, y: y - 6 - Math.random() * 8, alpha: 0, duration: 380, ease: 'Quad.easeOut', onComplete: () => drop.destroy() });
      }
  }

  update(dt) {
    const g = this.g;
    g.clear();
    this.fx.update(dt);
    if (!this.busy || !this.bob) return;
    this.t += dt;
    const tgt = this.target;
    if (this.state === 'wait') {
      let y = tgt.y + 3 + Math.sin(this.t * 3) * 0.6;
      const nib = this.nibbles.find((n) => this.t > n && this.t < n + 0.25);
      if (nib !== undefined) {
        y += 1.5;
        if (!this.nibbled?.has(nib)) {
          (this.nibbled ||= new Set()).add(nib);
          this.splash(tgt.x, tgt.y + 2, 0);
          sfx('tap');
        }
      }
      const tw = this.twitches.find((n) => this.t > n && this.t < n + 0.16);
      if (tw !== undefined) {
        y += this.plan.tell.dip * 0.5;
        if (!this.twitched?.has(tw)) {
          (this.twitched ||= new Set()).add(tw);
          this.splash(tgt.x, tgt.y + 2, 1);
          sfx('bite');
          haptic(Math.round(this.plan.tell.haptic * 0.6));
        }
      }
      this.bob.setPosition(tgt.x, y);
      if (this.t >= this.biteAt) this.bite();
    } else if (this.state === 'bite') {
      const tell = this.plan.tell;
      this.bob.setPosition(tgt.x + Math.sin(this.t * 40) * (0.6 + tell.shake * 0.5), tgt.y + 3 + tell.dip * 0.6).setAlpha(0.55);
      if (this.t > this.plan.window / 1000) this.miss();
    }
    if (!this.bob) return; // it got away (or was hooked) this frame
    // the rod and the line (sagging a little while it waits)
    const a = this.tip();
    const p = this.player;
    g.lineStyle(1.5, cosmeticColor('rodskin') ?? 0x5a3a24, 1);
    g.lineBetween(p.x + (a.x - p.x) * 0.25, p.y - 14, a.x, a.y);
    g.lineStyle(0.6, 0xf4f0e6, 0.85);
    const b = { x: this.bob.x, y: this.bob.y - 8 };
    const sag = this.state === 'bite' ? 0 : 8;
    const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(a.x, a.y), new Phaser.Math.Vector2((a.x + b.x) / 2, Math.max(a.y, b.y) + sag), new Phaser.Math.Vector2(b.x, b.y));
    curve.draw(g, 16);
  }

  bite() {
    const s = this.scene;
    this.state = 'bite';
    this.t = 0;
    this.fx.hideShadow();
    this.splash(this.target.x, this.target.y + 2, 1);
    sfx('bite');
    haptic(this.plan.tell.haptic || 40);
    const p = this.player;
    const big = this.plan.species ? this.plan.species.rarity >= 4 : false;
    this.bang = s.add.text(p.x, p.y - 46, '!', { fontFamily: 'Georgia, serif', fontSize: big ? '44px' : '34px', fontStyle: 'bold', color: big ? '#f2d36b' : '#ffe36b', stroke: '#1d1714', strokeThickness: 6 }).setOrigin(0.5, 1).setDepth(4001).setResolution(4);
    this.bang.setScale(0.2);
    s.tweens.add({ targets: this.bang, scale: 1, duration: 140, ease: 'Back.easeOut' });
  }

  tap() {
    if (this.state === 'bite') return this.hook();
    if (this.state === 'wait') {
      this.end();
      this.scene.toast('Too soon! Wait for the bobber to go under, then tap.');
    }
  }

  // hooked: the reel minigame (junk comes in without a fight)
  hook() {
    const plan = this.plan;
    this.bang?.destroy();
    this.bang = null;
    this.splash(this.target.x, this.target.y + 2, 1);
    sfx('reel');
    haptic(25);
    if (plan.junk || !plan.species) return this.land({ perfect: false });
    this.state = 'reelin';
    const reel = (this.reel = newReel(progression(), plan));
    this.stopReel = runReel(reel, {
      legend: plan.species.rarity === 5,
      onEnd: (r) => {
        this.stopReel = null;
        if (r.won) this.land({ perfect: r.perfect });
        else this.escape();
      },
    });
  }

  land(result) {
    const s = this.scene;
    const p = progression();
    const plan = this.plan;
    this.state = 'reel';
    const rec = completeCast(p, plan, result);
    this.bob?.destroy();
    this.bob = null;
    this.g.clear();
    this.fx.hideShadow();
    const junk = rec.junk ? JUNK()[Math.floor(Math.random() * JUNK().length)] : null;
    const sp = rec.junk ? null : speciesById(p.last.speciesId);
    const entry = junk ? junk.entry : sp.entry;
    // the catch flies out of the water to you
    const pic = drawEntry(entry, 1);
    const key = `catch_${entry.id}`;
    if (!s.textures.exists(key)) s.textures.addCanvas(key, pic);
    const pl = this.player;
    const fish = s.add.image(this.target.x, this.target.y, key).setDepth(4002).setScale(0.9);
    this.splash(this.target.x, this.target.y + 2, 1);
    s.tweens.add({
      targets: fish,
      x: pl.x,
      y: pl.y - 44,
      duration: 420,
      ease: 'Quad.easeOut',
      onComplete: () => {
        s.tweens.add({ targets: fish, y: fish.y - 3, yoyo: true, repeat: -1, duration: 300 });
        const done = () => {
          fish.destroy();
          this.state = 'idle';
          release('fishing');
        };
        if (junk) this.showJunk(junk, done);
        else showReveal(sp, p.last, done);
      },
    });
  }

  showJunk(item, done) {
    const card = document.getElementById('catch');
    card.className = 'rarity-1';
    card.classList.remove('hidden');
    const pic = card.querySelector('.catch-pic');
    pic.className = 'catch-pic';
    pic.replaceChildren(drawEntry(item.entry, 6));
    card.querySelector('.catch-title').textContent = item.name;
    card.querySelector('.catch-meta').textContent = '';
    card.querySelector('.catch-note').textContent = 'Not a fish. Into the bin it goes.';
    card.querySelector('.catch-hint').textContent = 'Tap to continue';
    sfx('nope');
    setTimeout(() => {
      card.onclick = () => {
        card.classList.add('hidden');
        card.onclick = null;
        done();
      };
    }, 350);
  }

  // the line snapped or the window passed: show what it was
  escape() {
    const p = progression();
    const plan = this.plan;
    this.bang?.destroy();
    this.bang = null;
    this.bob?.destroy();
    this.bob = null;
    this.g.clear();
    this.fx.hideShadow();
    this.state = 'reel';
    loseCast(p, plan);
    haptic(40);
    showNearMiss(p.last, plan.species, () => {
      this.state = 'idle';
      release('fishing');
    });
  }

  miss() {
    this.escape();
  }

  // reel in with nothing
  end() {
    this.stopReel?.();
    this.stopReel = null;
    this.bang?.destroy();
    this.bang = null;
    this.bob?.destroy();
    this.bob = null;
    this.nibbled = null;
    this.twitched = null;
    this.g.clear();
    this.fx?.hideShadow();
    if (this.state !== 'idle') progression().state.fish.pending = null;
    this.state = 'idle';
    release('fishing');
  }
}
