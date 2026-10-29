// Expeditions: islands you sail to by following a lead (src/leads.js). Each one is
// a map file in src/maps/exp-<id>.json (the builder format) plus an `expedition`
// block of spots, patrols and a clock that this file turns into play:
//
//   note   a chart or letter to read; may set a flag      dig    a spot to brush open (finds come home dirty)
//   chest  opens with the right flag; final = trip done   crate  something to pry open (wet, rotten, sealed)
//   plate  press them (in order if `ordered`)             gate   opens when its flag is set
//   lever  pull it to set a flag
//   patrols walk loops and chase you if they see you (tall grass hides you)
//   clock  the tide / a blizzard sends you back to the boat when time is up
//
// Failing is gentle: being caught or washed out only puts you back at the boat; your
// finds and flags stay. Nothing here is bought: finds come from digging and opening.
//
// Finds come home dirty. They wait in the crate (curation.expedition) until the
// Restoration Studio (chat 4) cleans them. Until that exists they are cleaned and
// logged as soon as you reach a home island, so nobody is left holding a muddy box.
import { load, save } from './storage.js';
import { list } from './collections/index.js';
import { collect, seen } from './collections/codex.js';
import { drawEntry } from './collections/render.js';
import { startDig, pick } from './dig.js';
import { grantLead, foundLeads, islandUnlocked } from './leads.js';
import { makeCharacter } from './art.js';
import { animateWalker } from './motion.js';
import { T } from './tiles.js';
import { sfx } from './music.js';

const maps = import.meta.glob('./maps/exp-*.json', { eager: true, import: 'default' });
const RESTORE = Object.keys(import.meta.glob('./restore.js')).length > 0; // chat 4's studio, once it lands

/** Map id ("exp-pirate") to map, and expedition id ("pirate") to its info. */
export const EXPEDITION_MAPS = {};
export const EXPEDITIONS = {};
Object.entries(maps).forEach(([path, map]) => {
  const id = path.match(/exp-(.+)\.json$/)?.[1];
  if (!id || !map.expedition) return;
  EXPEDITION_MAPS[`exp-${id}`] = map;
  EXPEDITIONS[id] = { id, mapId: `exp-${id}`, title: map.name, ...map.expedition };
});
export const expeditionOf = (mapId) => Object.values(EXPEDITIONS).find((e) => e.mapId === mapId) || null;

// ---------- the save: trips done, the crate of dirty finds, where things were found ----------
const KEY = 'curation.expedition';
function store() {
  const raw = load(KEY, null);
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  return {
    v: 1,
    done: obj(o.done),
    crate: (Array.isArray(o.crate) ? o.crate : []).filter((c) => c && typeof c.id === 'string' && typeof c.from === 'string'),
    where: obj(o.where),
  };
}

/** What is waiting to be cleaned: [{ id, from, at }]. Chat 4's studio reads this. */
export const crate = () => store().crate;
export const tripsDone = (id) => store().done[id] || 0;
/** Where an entry was found ("Pirate Island"), or null. For plaques and the journal. */
export const foundAt = (entryId) => store().where[entryId] || null;

/** A find comes home dirty. */
export function bringHome(entryId, from, at = Date.now()) {
  const s = store();
  s.crate.push({ id: entryId, from, at, dirty: true });
  s.where[entryId] = s.where[entryId] || from;
  save(KEY, s);
}

/** Chat 4 calls this when a find has been cleaned: it enters the codex and leaves the crate. */
export function cleaned(entryId) {
  const s = store();
  const i = s.crate.findIndex((c) => c.id === entryId);
  if (i < 0) return null;
  const [item] = s.crate.splice(i, 1);
  save(KEY, s);
  return { ...item, got: collect(entryId) };
}

/** Back home: with no studio yet, wash everything and log it. Returns a toast line or ''. */
export function unpackCrate() {
  const items = crate();
  if (!items.length) return '';
  if (RESTORE) return `${items.length} dirty find${items.length > 1 ? 's' : ''} from your trip need cleaning`;
  items.forEach((c) => cleaned(c.id));
  return `Cleaned ${items.length} find${items.length > 1 ? 's' : ''} from ${[...new Set(items.map((c) => c.from))].join(' and ')}. They are in your journal.`;
}

/** Boat-menu entries for every expedition a lead has unlocked. */
export const expeditionOptions = () =>
  Object.values(EXPEDITIONS)
    .filter((e) => islandUnlocked(e.id))
    .map((e) => ({ label: e.title, sub: `Expedition · ${e.sub || 'follow the lead'}${tripsDone(e.id) ? ` · done ${tripsDone(e.id)}×` : ''}`, go: { map: e.mapId, spawn: 'dock', expedition: e.id } }));

export const expeditionTitles = () => Object.fromEntries(Object.values(EXPEDITIONS).map((e) => [e.id, e.title]));

// ---------- little cards and the boat ----------
let cardEl = null;
function card({ title, sub, text, entries = [], button = 'OK' }, cb) {
  if (!cardEl) {
    cardEl = document.createElement('div');
    cardEl.id = 'exp-card';
    cardEl.className = 'overlay hidden';
    cardEl.innerHTML = '<div class="decor-sheet sheet"><h2 class="ask-title"></h2><i class="exp-sub"></i><p class="ask-text"></p><div class="exp-finds"></div><button class="pixel-btn exp-ok"></button></div>';
    document.body.appendChild(cardEl);
  }
  const q = (s) => cardEl.querySelector(s);
  q('.ask-title').textContent = title;
  q('.exp-sub').textContent = sub || '';
  q('.ask-text').textContent = text || '';
  const f = q('.exp-finds');
  f.replaceChildren();
  entries.forEach((e) => {
    const d = document.createElement('div');
    d.className = 'exp-find';
    try {
      const c = drawEntry(e, 3);
      d.appendChild(c);
    } catch {
      // (no picture is fine)
    }
    const s = document.createElement('span');
    s.textContent = e.title;
    d.appendChild(s);
    f.appendChild(d);
  });
  q('.exp-ok').textContent = button;
  q('.exp-ok').onclick = () => {
    cardEl.classList.add('hidden');
    cb?.();
  };
  cardEl.classList.remove('hidden');
}
export const cardOpen = () => !!cardEl && !cardEl.classList.contains('hidden');

let boatEl = null;
/** A short sailing scene before an expedition. Calls then() when the boat has "arrived". */
export function boatScene(e, then) {
  if (!boatEl) {
    boatEl = document.createElement('div');
    boatEl.id = 'boat-scene';
    boatEl.className = 'hidden';
    boatEl.innerHTML = '<div class="bs-sky"></div><div class="bs-sea"><div class="bs-wave w1"></div><div class="bs-wave w2"></div><div class="bs-wave w3"></div></div><div class="bs-boat"><div class="bs-sail"></div><div class="bs-hull"></div></div><p class="bs-line"></p><small class="bs-tap">tap to skip</small>';
    document.body.appendChild(boatEl);
  }
  const first = foundLeads().find((l) => l.island === e.id);
  boatEl.querySelector('.bs-line').textContent = `Sailing to ${e.title}…${first ? `\n“${first.text.split('. ')[0].replace(/\.$/, '')}.”` : ''}`;
  boatEl.classList.remove('hidden');
  sfx('door');
  let go = false;
  const finish = () => {
    if (go) return;
    go = true;
    then();
    setTimeout(() => boatEl.classList.add('hidden'), 900);
  };
  boatEl.onclick = finish;
  setTimeout(finish, 2400);
}

// ---------- on the island ----------
const KINDS = {
  pirate: { colors: { h: '#2a1a12', c: '#a8322c', p: '#2a2a3a', s: '#e0b48a' }, look: { hat: 'bicorne', facial: 'beard' } },
  guard: { colors: { h: '#3a3a40', c: '#2c4a78', p: '#1f2d4a', s: '#e8c4a0' }, look: { hat: 'cap', facial: 'stache' } },
};
const SPEED = 42;
const CAUGHT_R = 15;
let uid = 0;

export class Expedition {
  constructor(scene, def) {
    this.s = scene;
    this.def = def;
    this.flags = new Set();
    this.items = [];
    this.patrols = [];
    this.trip = []; // entries found this trip
    this.over = false;
    this.clockT = 0;
  }

  // ----- setting up (after the scenery is placed) -----
  build() {
    const { s, def } = this;
    (def.spots || []).forEach((sp) => this.add(sp));
    (def.patrols || []).forEach((p) => this.addPatrol(p));
    this.hud = document.getElementById('exp-hud') || Object.assign(document.body.appendChild(document.createElement('div')), { id: 'exp-hud' });
    this.hud.classList.remove('hidden');
    s.events.once('shutdown', () => this.hud.classList.add('hidden'));
    this.refreshHud();
    s.toast(`${def.title} · ${def.goals?.[0]?.text || 'explore'}`);
  }

  cell(sp) {
    return { px: (sp.x + 0.5) * T, py: (sp.y + 0.8) * T };
  }

  add(sp) {
    const it = { sp, kind: sp.k, used: false, imgs: [], ...this.cell(sp) };
    this.items.push(it);
    const show = !sp.needs || this.flags.has(sp.needs);
    if (sp.k === 'dig' && sp.needs && !show) it.hidden = true; // an X appears when you have the chart
    this.draw(it);
    return it;
  }

  clear(it) {
    it.imgs.forEach((i) => i.setVisible(false));
    it.imgs = [];
  }

  // (images are hidden, not destroyed: the season code re-textures every placed image)
  draw(it) {
    const { s } = this;
    const { sp } = it;
    this.clear(it);
    const put = (name, x = sp.x, y = sp.y, flat = false) => it.imgs.push(s.place(name, x, y, { flat }));
    if (sp.k === 'note') put(it.used ? 'sign' : 'sign');
    else if (sp.k === 'dig') {
      if (it.hidden) return;
      put(it.used ? 'dug_hole' : sp.x_mark ? 'x_mark' : sp.collection === 'fossil' ? 'dig_fossil' : 'dig_spot', sp.x, sp.y, true);
    } else if (sp.k === 'chest') put(it.used ? 'chest_open' : 'chest');
    else if (sp.k === 'crate') put(it.used ? 'dug_hole' : sp.old ? 'barrel' : 'crate', sp.x, sp.y, it.used);
    else if (sp.k === 'plate') put(it.used ? 'plate_down' : 'plate', sp.x, sp.y, true);
    else if (sp.k === 'lever') put(it.used ? 'lever_on' : 'lever');
    else if (sp.k === 'gate') {
      if (it.open) return;
      for (let i = 0; i < (sp.w || 1); i++) put('gate', sp.x + i, sp.y);
    }
  }

  addPatrol(p) {
    const { s } = this;
    const look = KINDS[p.kind] || KINDS.pirate;
    const prefix = `exp_${p.kind || 'pirate'}`;
    if (!s.textures.exists(`${prefix}_down`)) makeCharacter(s, prefix, look.colors, look.look);
    const [x0, y0] = p.path[0];
    const sprite = s.add.sprite((x0 + 0.5) * T, (y0 + 1) * T - 2, `${prefix}_down`).setOrigin(0.5, 1).setScale(1.2);
    const bang = s.add.text(0, 0, '!', { fontFamily: 'monospace', fontSize: '14px', color: '#fff', backgroundColor: '#c0392b', padding: { x: 4, y: 0 } }).setOrigin(0.5, 1).setVisible(false).setDepth(9999);
    this.patrols.push({ p, prefix, sprite, bang, i: 1, face: [0, 1], state: 'walk', lost: 0, kind: p.kind || 'pirate' });
  }

  // ----- flags and goals -----
  setFlag(f) {
    if (!f || this.flags.has(f)) return;
    this.flags.add(f);
    this.items.forEach((it) => {
      if (it.sp.needs !== f) return;
      if (it.sp.k === 'gate' && !it.open) this.openGate(it);
      if (it.sp.k === 'dig' && it.hidden) {
        it.hidden = false;
        this.draw(it);
        this.s.toast('The chart marks a spot. An X has appeared.');
      }
    });
    this.refreshHud();
    if ((this.def.complete || ['final']).every((x) => this.flags.has(x))) this.complete();
  }

  openGate(it) {
    it.open = true;
    this.clear(it);
    for (let i = 0; i < (it.sp.w || 1); i++) this.s.solid[it.sp.y][it.sp.x + i] = false;
    sfx('door');
    this.s.toast(it.sp.opens || 'Somewhere, stone grinds open.');
  }

  // a spot that counts toward a tally ("pry open all three crates") sets the tally's flag when every one is used
  used(it) {
    it.used = true;
    this.draw(it);
    const t = it.sp.tally;
    if (!t) return;
    this.refreshHud();
    if (this.items.filter((i) => i.sp.tally === t).every((i) => i.used)) this.setFlag(t);
  }

  refreshHud() {
    const g = (this.def.goals || []).find((x) => !this.flags.has(x.until));
    const mine = g?.tally ? this.items.filter((i) => i.sp.tally === g.tally) : [];
    this.goalText = this.over ? 'Expedition complete! Back to the boat.' : g ? `${g.text}${mine.length ? ` (${mine.filter((i) => i.used).length}/${mine.length})` : ''}` : 'Explore';
    this.drawHud();
  }

  drawHud() {
    const clock = this.def.clock && !this.over ? `  ·  ${this.def.clock.label || 'Tide'} ${Math.max(0, Math.ceil(this.def.clock.seconds - this.clockT))}s` : '';
    this.hud.textContent = `${this.goalText}${clock}`;
  }

  // ----- the player's side -----
  focus(x, y, bestD) {
    let best = null;
    this.items.forEach((it) => {
      const { sp } = it;
      if (it.used || (it.hidden && sp.k === 'dig') || sp.k === 'plate' || sp.k === 'gate') return;
      const d = Math.hypot(x - it.px, y - it.py);
      if (d < 32 && d < bestD) {
        best = { exp: it, icon: 'look', label: sp.k === 'dig' ? 'Dig' : sp.k === 'lever' ? 'Pull' : sp.k === 'note' ? 'Read' : 'Open', d };
        bestD = d;
      }
    });
    return best;
  }

  interact(it) {
    const { s } = this;
    const { sp } = it;
    sfx('talk');
    if (sp.k === 'note') {
      s.paused = true;
      return card({ title: sp.title || 'A note', sub: sp.from, text: sp.text, button: sp.button || 'Put it away' }, () => {
        s.paused = false;
        this.setFlag(sp.sets);
      });
    }
    if (sp.needs && !this.flags.has(sp.needs)) return s.toast(sp.locked || 'It will not budge. You are missing something.');
    if (sp.k === 'lever') {
      this.used(it);
      return this.setFlag(sp.sets);
    }
    if (sp.k === 'dig') return this.dig(it);
    if (sp.k === 'chest' || sp.k === 'crate') return this.open(it);
  }

  find(sp) {
    const entries = list({ collection: sp.collection || 'mineral' });
    const fresh = entries.filter((e) => !seen(e.id));
    return pick(fresh.length && Math.random() < 0.7 ? fresh : entries);
  }

  take(entry) {
    bringHome(entry.id, this.def.title);
    this.trip.push(entry);
  }

  dig(it) {
    const { s } = this;
    const { sp } = it;
    s.paused = true;
    startDig(`${this.def.mapId}:${sp.x},${sp.y}`, {
      collection: sp.collection || 'mineral',
      entry: this.find(sp),
      onFound: (entry) => {
        const fresh = !seen(entry.id);
        this.take(entry);
        return { fresh, note: `It is caked in mud. Bring it home from ${this.def.title} to be cleaned.` };
      },
      onClose: ({ found }) => {
        s.paused = false;
        if (!found) return;
        this.used(it);
        if (sp.says) s.toast(sp.says);
        this.setFlag(sp.sets);
        if (sp.final) this.setFlag('final');
      },
    });
  }

  open(it) {
    const { s } = this;
    const { sp } = it;
    this.used(it);
    sfx('unlock');
    const got = (sp.loot || [sp.collection || 'mineral']).map((c) => this.find({ collection: c }));
    got.forEach((e) => this.take(e));
    s.paused = true;
    card(
      { title: sp.k === 'chest' ? 'The chest is open!' : sp.old ? 'You pry the barrel open' : 'You pry the crate open', sub: this.def.title, text: sp.says || 'Everything is filthy. Bring it home to be cleaned.', entries: got, button: 'Take it' },
      () => {
        s.paused = false;
        this.setFlag(sp.sets);
        if (sp.final) this.setFlag('final');
      },
    );
  }

  // ----- every frame -----
  update(dt) {
    if (this.over) return;
    const { s } = this;
    const p = s.player;
    const cx = Math.floor(p.x / T);
    const cy = Math.floor((p.y - 2) / T);
    this.plates(cx, cy);
    this.patrol(dt);
    const land = s.landingSpot;
    if (this.def.clock && !(land && Math.hypot(p.x - land.x, p.y - land.y) < 4 * T)) {
      this.clockT += dt;
      if (this.clockT >= this.def.clock.seconds) return this.caught(this.def.clock.msg || 'The tide came in! You scramble back to the boat.');
    }
    this.hudT = (this.hudT || 0) + dt;
    if (this.hudT > 0.25) {
      this.hudT = 0;
      this.drawHud();
    }
  }

  plates(cx, cy) {
    const plates = this.items.filter((it) => it.sp.k === 'plate');
    const on = plates.find((it) => it.sp.x === cx && it.sp.y === cy);
    if (!on || on.used) {
      this.onPlate = null;
      return;
    }
    if (this.onPlate === on) return;
    this.onPlate = on;
    const group = plates.filter((it) => it.sp.sets === on.sp.sets);
    if (on.sp.ordered) {
      const next = group.filter((it) => !it.used).sort((a, b) => a.sp.n - b.sp.n)[0];
      if (next !== on) {
        group.forEach((it) => {
          it.used = false;
          this.draw(it);
        });
        sfx('talk');
        return this.s.toast(on.sp.wrong || 'The stones push back up. Try another order.');
      }
    }
    on.used = true;
    this.draw(on);
    sfx('talk');
    if (group.every((it) => it.used)) this.setFlag(on.sp.sets);
  }

  patrol(dt) {
    const { s } = this;
    const p = s.player;
    this.patrols.forEach((g) => {
      const sp = g.sprite;
      const d = Math.hypot(p.x - sp.x, p.y - (sp.y - 8));
      const hidden = s.grassCells.has(`${Math.floor(p.x / T)},${Math.floor((p.y - 2) / T)}`);
      const sight = g.p.sight || 70;
      const toward = d > 0 ? ((p.x - sp.x) * g.face[0] + (p.y - 8 - sp.y) * g.face[1]) / d : 1;
      const sees = hidden ? d < 20 : d < sight && toward > 0.2;
      if (g.state === 'walk' && sees) {
        g.state = 'chase';
        g.lost = 0;
        g.bang.setVisible(true);
        sfx('talk');
      }
      let tx, ty, speed;
      if (g.state === 'chase') {
        if (d > sight * 1.6 || (hidden && d > 30)) g.lost += dt;
        else g.lost = 0;
        if (g.lost > 2) {
          g.state = 'walk';
          g.bang.setVisible(false);
        }
        [tx, ty] = [p.x, p.y];
        speed = SPEED * 1.15; // a little slower than you run, so you can get away
      } else {
        const [px, py] = g.p.path[g.i % g.p.path.length];
        [tx, ty] = [(px + 0.5) * T, (py + 1) * T - 2];
        speed = g.p.speed || SPEED * 0.7;
        if (Math.hypot(tx - sp.x, ty - sp.y) < 3) g.i = (g.i + 1) % g.p.path.length;
      }
      const dx = tx - sp.x;
      const dy = ty - sp.y;
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        sp.x += (dx / len) * speed * dt;
        sp.y += (dy / len) * speed * dt;
        g.face = [dx / len, dy / len];
        if (Math.abs(dx) > Math.abs(dy)) sp.setTexture(`${g.prefix}_side`).setFlipX(dx < 0);
        else sp.setTexture(`${g.prefix}_${dy < 0 ? 'up' : 'down'}`).setFlipX(false);
      }
      animateWalker(s, sp, len > 1, dt, 1);
      sp.setDepth(sp.y);
      g.bang.setPosition(sp.x, sp.y - 34);
      if (g.state === 'chase' && d < CAUGHT_R) this.caught(g.kind === 'guard' ? 'Caught by a guard! Back to the boat. Try again.' : 'Caught by the pirates! You slip away to the boat. Try again.');
    });
  }

  // Gentle failure: back to the boat, everything you found and opened stays.
  caught(msg) {
    const { s } = this;
    if (s.leaving || this.caughtNow) return;
    this.caughtNow = true;
    s.paused = true;
    const cam = s.cameras.main;
    cam.fadeOut(350, 20, 40, 70);
    cam.once('camerafadeoutcomplete', () => {
      const land = s.landingSpot || s.landing();
      s.player.setPosition(land.x, land.y);
      this.clockT = 0;
      this.patrols.forEach((g) => {
        g.i = 1;
        g.state = 'walk';
        g.bang.setVisible(false);
        const [x, y] = g.p.path[0];
        g.sprite.setPosition((x + 0.5) * T, (y + 1) * T - 2);
      });
      cam.fadeIn(350, 20, 40, 70);
      s.paused = false;
      this.caughtNow = false;
      s.toast(msg);
    });
  }

  complete() {
    if (this.over) return;
    this.over = true;
    const { s, def } = this;
    const st = store();
    st.done[def.id] = (st.done[def.id] || 0) + 1;
    save(KEY, st);
    const fresh = [];
    foundLeads()
      .filter((l) => l.island === def.id)
      .forEach((l) => (l.then || []).forEach((id) => grantLead(id) && fresh.push(id)));
    this.refreshHud();
    sfx('unlock');
    const names = fresh.map((id) => foundLeads().find((l) => l.id === id)?.title).filter(Boolean);
    s.paused = true;
    card(
      {
        title: `${def.title}: done!`,
        sub: this.trip.length ? `${this.trip.length} find${this.trip.length > 1 ? 's' : ''} in the crate` : 'Nothing dug up this time',
        text: `${def.outro || 'A good trip.'}${names.length ? ` You found a new lead: ${names.join(', ')}. Check Letters at the boat.` : ''}`,
        entries: this.trip,
        button: 'Back to the boat',
      },
      () => {
        s.paused = false;
      },
    );
  }
}

/** The expedition for a scene, or null on every other island. */
export const expeditionFor = (scene) => {
  const def = expeditionOf(scene.mapId);
  return def ? new Expedition(scene, def) : null;
};
