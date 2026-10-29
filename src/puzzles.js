// Puzzle pieces that work on builder islands (src/IslandScene.js hands each placed tile to piece()):
//   boulder      (Boulder (push))     walk into it and it slides one tile. Tap Interact beside it to put it back if it is stuck.
//   plate        (Pressure plate)     pressed while you or a boulder stands on it
//   lever        (Lever)              Interact to throw it
//   gate         (Iron gate)          opens, for good, once every plate, lever and riddler near it is done
//   rock_crack   (Cracked boulder)    needs a pick (earned in src/dig.js); a mineral may be inside
//   ice          (a ground tile)      you slide until you hit something or leave the ice
//   fog          (Fog)                fades for good as you walk through it
//   riddler      (Riddler)            a right answer gives a find to brush clean; a wrong one just lets you try again
// Wiring is by nearness: a gate belongs to the plates, levers and riddlers within CLUSTER tiles of it
// (chained: a plate near a plate near the gate counts). Nothing is lost or punished; reload and it resets.
import { load, save } from './storage.js';
import { startDig, readyIn, toolUnlocked, pick, entriesFor, TOOLS, mapKey } from './dig.js';
import { collect } from './collections/codex.js';
import { RIDDLES } from './puzzles-data.js';
import { Hunts } from './puzzles-hunt.js';

const T = 32;
const CLUSTER = 8;
const SLIDE = 230; // px per second on ice
const FOG_KEY = 'curation.fog'; // { "map:x,y": 1 } fog already walked through

let card = null;
function riddleCard() {
  if (card) return card;
  card = document.createElement('div');
  card.id = 'riddle';
  card.className = 'hidden';
  card.setAttribute('role', 'dialog');
  card.innerHTML = '<div class="dig-card"><b class="rd-title">The Riddler</b><p class="rd-q"></p><div class="rd-opts"></div><span class="rd-msg"></span><button class="rd-close main">Walk away</button></div>';
  document.body.appendChild(card);
  return card;
}

export class Puzzles {
  constructor(scene, TILES) {
    this.s = scene;
    this.TILES = TILES;
    this.boulders = [];
    this.plates = [];
    this.levers = [];
    this.gates = [];
    this.rocks = [];
    this.fogs = [];
    this.riddlers = [];
    this.pushT = 0;
    this.sliding = null; // { dx, dy } while the player is on ice
    this.wired = false;
    this.fogSeen = load(FOG_KEY, {});
    this.hunts = new Hunts(scene); // metal detector, map-fragment X, rest labels (src/puzzles-hunt.js)
  }

  get any() {
    return this.boulders.length + this.plates.length + this.levers.length + this.gates.length + this.rocks.length + this.fogs.length + this.riddlers.length > 0 || this.hunts.any;
  }

  tex(name) {
    const k = `isl_${name}_0`;
    if (!this.s.textures.exists(k)) this.s.textures.addCanvas(k, this.TILES[name].frames[0]);
    return k;
  }

  /** Called for every placed tile. Returns true when a puzzle piece took it over. */
  piece(name, x, y) {
    const s = this.s;
    const base = { x, y, cx: (x + 0.5) * T, cy: (y + 0.5) * T };
    if (name === 'boulder') {
      const img = s.place(name, x, y);
      this.boulders.push({ ...base, home: [x, y], img });
    } else if (name === 'plate' || name === 'plate_down') {
      this.tex('plate');
      this.tex('plate_down');
      this.plates.push({ ...base, img: s.place('plate', x, y, { flat: true }), on: false });
    } else if (name === 'lever' || name === 'lever_on') {
      this.tex('lever');
      this.tex('lever_on');
      const o = { ...base, img: s.place('lever', x, y), on: false };
      if (name === 'lever_on') this.flip(o, true);
      this.levers.push(o);
    } else if (name === 'gate') {
      this.gates.push({ ...base, img: s.place('gate', x, y), open: false });
    } else if (name === 'rock_crack') {
      this.rocks.push({ ...base, img: s.place(name, x, y) });
    } else if (name === 'fog') {
      const key = `${mapKey(s)}:${x},${y}`;
      if (this.fogSeen[key]) return true; // already walked through: nothing to draw
      const img = s.place(name, x, y).setDepth(900000).setAlpha(0.96);
      this.fogs.push({ ...base, key, img, gone: false });
    } else if (name === 'riddler') {
      const img = s.place(name, x, y);
      this.riddlers.push({ ...base, img, key: `${mapKey(s)}:riddle:${x},${y}`, solved: false });
    } else return this.hunts.piece(name, x, y);
    return true;
  }

  flip(lv, on) {
    lv.on = on;
    lv.img.setTexture(this.tex(on ? 'lever_on' : 'lever'));
  }

  // ---- wiring ----
  wire() {
    this.wired = true;
    const trig = [...this.plates, ...this.levers, ...this.riddlers];
    const near = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) <= CLUSTER;
    this.gates.forEach((g) => {
      const group = [g];
      const members = new Set([g]);
      for (let i = 0; i < group.length; i++) trig.concat(this.gates).forEach((o) => !members.has(o) && near(o, group[i]) && (members.add(o), group.push(o)));
      g.triggers = trig.filter((o) => members.has(o));
    });
  }

  done(o) {
    return o.on || o.solved || false;
  }

  settle() {
    if (!this.wired) this.wire();
    this.gates.forEach((g) => {
      if (g.open || !g.triggers.length || !g.triggers.every((o) => this.done(o))) return;
      g.open = true;
      this.s.solid[g.y][g.x] = false;
      this.s.tweens.add({ targets: g.img, alpha: 0, scaleY: 0.2, duration: 500, onComplete: () => g.img.setVisible(false) });
      this.s.toast('A gate grinds open.');
    });
  }

  // ---- every frame (dx, dy: the direction the player is pushing, 0 when still) ----
  update(dt, dx, dy) {
    const s = this.s;
    const p = s.player;
    const cx = Math.floor(p.x / T);
    const cy = Math.floor((p.y - 4) / T);
    // plates
    let changed = false;
    this.plates.forEach((pl) => {
      const on = (cx === pl.x && cy === pl.y) || this.boulders.some((b) => b.x === pl.x && b.y === pl.y);
      if (on !== pl.on) {
        pl.on = on;
        pl.img.setTexture(this.tex(on ? 'plate_down' : 'plate'));
        changed = true;
      }
    });
    if (changed || !this.wired) this.settle();
    // fog thins as you walk into it
    this.fogs.forEach((f) => {
      if (f.gone || Math.hypot(p.x - f.cx, p.y - f.cy) > 64) return;
      f.gone = true;
      this.fogSeen[f.key] = 1;
      save(FOG_KEY, this.fogSeen);
      s.tweens.add({ targets: f.img, alpha: 0, duration: 900, onComplete: () => f.img.setVisible(false) });
    });
    this.hunts.update(dt);
    this.ice(dt, dx, dy, cx, cy);
    this.push(dt, dx, dy);
  }

  onIce(cx, cy) {
    const names = this.s.paint?.[cy]?.[cx];
    return !!names && names[names.length - 1] === 'ice';
  }

  // Step onto ice and you keep going the way you were heading until something stops you.
  ice(dt, dx, dy, cx, cy) {
    const s = this.s;
    const p = s.player;
    if (!this.sliding) {
      if ((dx || dy) && this.onIce(cx, cy)) this.sliding = Math.abs(dx) > Math.abs(dy) ? { dx: Math.sign(dx), dy: 0 } : { dx: 0, dy: Math.sign(dy) };
      return;
    }
    const { dx: sx, dy: sy } = this.sliding;
    const nx = p.x + sx * SLIDE * dt;
    const ny = p.y + sy * SLIDE * dt;
    if (!s.free(nx, ny)) return (this.sliding = null);
    p.x = nx;
    p.y = ny;
    if (!this.onIce(Math.floor(p.x / T), Math.floor((p.y - 4) / T))) this.sliding = null;
  }

  boulderAt(x, y) {
    return this.boulders.find((b) => b.x === x && b.y === y);
  }

  // Walk into a boulder for a moment and it slides one tile, if the tile beyond is clear.
  push(dt, dx, dy) {
    const s = this.s;
    const p = s.player;
    if (!(dx || dy) || this.sliding) return (this.pushT = 0);
    const ax = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0;
    const ay = ax ? 0 : Math.sign(dy);
    const b = this.boulderAt(Math.floor((p.x + ax * 12) / T), Math.floor((p.y - 4 + ay * 12) / T));
    if (!b || b.moving) return (this.pushT = 0);
    this.pushT += dt;
    if (this.pushT < 0.28) return;
    this.pushT = 0;
    const tx = b.x + ax;
    const ty = b.y + ay;
    if (tx < 0 || ty < 0 || tx >= s.solid[0].length || ty >= s.solid.length || s.solid[ty][tx]) return;
    s.solid[b.y][b.x] = false;
    s.solid[ty][tx] = true;
    b.x = tx;
    b.y = ty;
    b.cx = (tx + 0.5) * T;
    b.cy = (ty + 0.5) * T;
    b.moving = true;
    s.tweens.add({ targets: b.img, x: tx * T, y: (ty + 1) * T, duration: 160, onComplete: () => (b.moving = false) });
    b.img.setDepth((ty + 1) * T - 2);
  }

  // ---- interaction ----
  focusAt(x, y) {
    const all = [...this.levers.map((o) => ({ o, k: 'lever' })), ...this.rocks.map((o) => ({ o, k: 'rock' })), ...this.riddlers.map((o) => ({ o, k: 'riddler' })), ...this.gates.filter((g) => !g.open).map((o) => ({ o, k: 'gate' })), ...this.boulders.map((o) => ({ o, k: 'boulder' }))];
    let best = this.hunts.focusAt(x, y);
    let bd = best ? Math.hypot(x - best.puzzle.cx, y - best.puzzle.cy) : 34;
    all.forEach(({ o, k }) => {
      const d = Math.hypot(x - o.cx, y - o.cy);
      if (d < bd) {
        bd = d;
        best = { puzzle: o, kind: k, icon: k === 'riddler' ? 'talk' : 'look', label: this.label(k, o) };
      }
    });
    return best;
  }

  // what the Interact button says
  label(k, o) {
    if (k === 'lever') return 'Pull';
    if (k === 'riddler') return 'Talk';
    if (k === 'rock') return toolUnlocked('pick') ? 'Smash' : 'Look';
    if (k === 'boulder') return o.x === o.home[0] && o.y === o.home[1] ? 'Look' : 'Reset';
    return 'Look';
  }

  interact(f) {
    const s = this.s;
    const o = f.puzzle;
    if (f.kind === 'x' || f.kind === 'buried') return this.hunts.interact(f);
    if (f.kind === 'lever') {
      this.flip(o, !o.on);
      s.toast(o.on ? 'Click. Something stirs.' : 'You pull it back.');
      this.settle();
    } else if (f.kind === 'gate') s.toast('An iron gate. Something nearby must open it: a plate, a lever, a riddle.');
    else if (f.kind === 'boulder') this.reset(o);
    else if (f.kind === 'rock') this.smash(o);
    else if (f.kind === 'riddler') this.riddle(o);
  }

  reset(b) {
    const s = this.s;
    const [hx, hy] = b.home;
    if ((b.x === hx && b.y === hy) || s.solid[hy][hx] || this.boulderAt(hx, hy)) return s.toast('A big round boulder. Walk into it to push.');
    s.solid[b.y][b.x] = false;
    s.solid[hy][hx] = true;
    b.x = hx;
    b.y = hy;
    b.cx = (hx + 0.5) * T;
    b.cy = (hy + 0.5) * T;
    b.img.setPosition(hx * T, (hy + 1) * T).setDepth((hy + 1) * T - 2);
    s.toast('The boulder rolls back to where it started.');
  }

  smash(r) {
    const s = this.s;
    if (!toolUnlocked('pick')) return s.toast(`Too hard to move by hand. A ${TOOLS.pick.name.toLowerCase()} would crack it: find ${TOOLS.pick.need} different things to earn one.`);
    s.solid[r.y][r.x] = false;
    this.rocks = this.rocks.filter((o) => o !== r);
    s.tweens.add({ targets: r.img, alpha: 0, scale: 1.3, duration: 350, onComplete: () => r.img.setVisible(false) }); // (kept: the season and culling code hold every placed image)
    if (Math.random() < 0.5) {
      const e = pick(entriesFor('mineral'));
      const got = collect(e.id);
      s.toast(`Crack! A ${e.title} was inside${got?.fresh ? ' (new!)' : ''}.`);
    } else s.toast('Crack! Only rubble, but the way is clear.');
  }

  riddle(r) {
    const el = riddleCard();
    const q = (sel) => el.querySelector(sel);
    const R = RIDDLES[(r.x * 7 + r.y * 13) % RIDDLES.length];
    const s = this.s;
    s.paused = true;
    const close = () => {
      el.classList.add('hidden');
      s.paused = false;
      this.settle();
    };
    q('.rd-title').textContent = 'The Riddler';
    q('.rd-q').textContent = R.q;
    q('.rd-msg').textContent = r.solved ? 'You solved this one already.' : 'Pick an answer. Wrong guesses cost nothing.';
    q('.rd-opts').replaceChildren(
      ...R.a.map((text, i) => {
        const b = document.createElement('button');
        b.textContent = text;
        b.onclick = () => {
          if (i !== R.right) return (q('.rd-msg').textContent = 'Not quite. Think again.');
          r.solved = true;
          el.classList.add('hidden');
          if (readyIn(r.key) > 0) {
            s.paused = false;
            this.settle();
            return s.toast('Right! The riddler smiles. They have nothing more to give you for now.');
          }
          s.toast('Right! The riddler hands you something dusty.');
          startDig(r.key, { collection: 'ruin', onClose: () => { s.paused = false; this.settle(); } });
        };
        return b;
      }),
    );
    q('.rd-close').onclick = close;
    el.classList.remove('hidden');
  }
}
