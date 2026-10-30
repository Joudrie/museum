// The friend hanging out with you on an island (src/progression/companions.js keeps the rules): they
// walk a few steps behind, sit in the back of your boat, tell a story or a fun fact while you wait
// for a bite, say something now and then on a walk, and head home when their time is up.
// IslandScene owns one (this.buddy) while someone is with you, and loads this file only then.
import { friendLook } from './people/friendlook.js';
import { makeCharacter } from './art.js';
import { animateWalker } from './motion.js';
import { showTalk, talking } from './talk.js';
import { chatOpen, runDialogue } from './dialogue.js';
import { npcById } from './progression/friendship.js';
import LINES from './progression/data/companion-lines.json' with { type: 'json' };
import { progression } from './progression/index.js';
import { sfx } from './music.js';

const SEAT_CROP = 20; // (as much of them as shows over the side of the boat)
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// a line from one of their lists that hasn't come up for a while
const told = new Map();
function pick(id, list) {
  if (!list?.length) return '';
  const seen = told.get(id) || new Set();
  told.set(id, seen);
  let left = list.filter((l) => !seen.has(l));
  if (!left.length) {
    list.forEach((l) => seen.delete(l));
    left = list;
  }
  const l = left[Math.floor(Math.random() * left.length)];
  seen.add(l);
  return l;
}

export class Companion {
  /** `arrive`: they were just called (they pop up in front of you and say hello). */
  constructor(scene, id, { arrive = false } = {}) {
    this.scene = scene;
    this.id = id;
    this.npc = npcById(id);
    this.data = LINES[id];
    this.prefix = `friend_${id}`;
    const look = friendLook(id, this.npc.wears);
    if (!scene.textures.exists(`${this.prefix}_down`)) makeCharacter(scene, this.prefix, look.colors, look.look);
    const p = scene.player;
    const [dx, dy] = DIRS[scene.facing] || [0, 1];
    // in front of you when they arrive, otherwise just behind
    const spots = arrive ? [[dx * 26, dy * 26], [-dx * 22, -dy * 22], [22, 0], [-22, 0]] : [[-dx * 22, -dy * 22], [22, 0], [-22, 0], [dx * 22, dy * 22]];
    const at = spots.map(([ox, oy]) => ({ x: p.x + ox, y: p.y + oy })).find((q) => scene.walkFree?.(q.x, q.y)) || { x: p.x - 18, y: p.y };
    this.s = scene.add.sprite(at.x, at.y, `${this.prefix}_down`).setOrigin(0.5, 1).setScale(look.scale || 1).setDepth(at.y);
    this.trail = [];
    this.view = 'down';
    this.walkLine = 40 + Math.random() * 40; // seconds until they say something on a walk
    this.castWait = 0;
    this.castTold = false;
    this.gone = false;
    this.face(p);
    if (arrive) scene.time.delayedCall(260, () => this.say(pick(id, Math.random() < 0.4 ? this.data.late : this.data.hello)));
  }

  get name() {
    return this.npc.name;
  }

  say(text, ms) {
    const sc = this.scene;
    if (!text || this.gone || !this.s.active) return;
    showTalk(this.npc.name, this.npc.role, text, sc.speakerAt(this.s), ms);
  }

  face(target) {
    const dx = target.x - this.s.x;
    const dy = target.y - this.s.y;
    this.view = Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'up' : 'down';
    this.s.setTexture(`${this.prefix}_${this.view}`).setFlipX(this.view === 'side' && dx < 0);
  }

  update(dt) {
    if (this.gone) return;
    const sc = this.scene;
    const p = sc.player;
    const pr = progression();
    if (pr.companions.tick(dt * 1000)) return this.leave(pick(this.id, this.data.bye));
    if (sc.row?.on) this.ride();
    else this.walk(dt, p);
    // while you wait for a bite they tell you something (a story, a fun fact or a saying)
    const f = sc.fishing;
    if (f?.busy && (f.state === 'wait' || f.state === 'cast')) {
      this.castWait += dt;
      if (!this.castTold && this.castWait > 2.5 && this.quiet()) {
        this.castTold = true;
        const kind = Math.random();
        this.say(pick(this.id, kind < 0.5 ? this.data.stories : kind < 0.8 ? this.data.facts : this.data.sayings));
      }
    } else {
      this.castWait = 0;
      if (!f?.busy) this.castTold = false;
      this.walkLine -= dt;
      if (this.walkLine <= 0) {
        this.walkLine = 70 + Math.random() * 60;
        if (this.quiet()) this.say(pick(this.id, Math.random() < 0.6 ? this.data.walk : this.data.sayings), 3200);
      }
    }
  }

  // nobody else is talking and no panel is up
  quiet() {
    return !talking() && !chatOpen() && !this.scene.paused;
  }

  walk(dt, o) {
    const s = this.s;
    if (this.seated) {
      // climbing out of the boat with you: they step onto the shore beside you
      this.seated = false;
      s.setCrop().setOrigin(0.5, 1);
      s.setPosition(o.x + 14, o.y);
      this.trail = [];
    }
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(last.x - o.x, last.y - o.y) > 2) this.trail.push({ x: o.x, y: o.y });
    if (this.trail.length > 80) this.trail.shift();
    // aim for the spot on your path about a step and a half back, and walk there at your pace
    let t = this.trail[0] || o;
    for (let i = this.trail.length - 1, run = 0; i > 0; i--) {
      run += Math.hypot(this.trail[i].x - this.trail[i - 1].x, this.trail[i].y - this.trail[i - 1].y);
      if (run >= 24) {
        t = this.trail[i - 1];
        break;
      }
    }
    const dx = t.x - s.x;
    const dy = t.y - s.y;
    const d = Math.hypot(dx, dy);
    const close = Math.hypot(o.x - s.x, o.y - s.y) < 24;
    const going = d > 1.5 && !close;
    if (going) {
      const step = Math.min(d, dt * (d > 90 ? 420 : 200)); // (a little quicker than you, and they hurry when far behind)
      s.x += (dx / d) * step;
      s.y += (dy / d) * step;
      const view = Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'up' : 'down';
      if (!s.texture.key.startsWith(`${this.prefix}_${view}`)) s.setTexture(`${this.prefix}_${view}`);
      if (view === 'side') s.setFlipX(dx < 0);
      this.view = view;
    } else if (!this.idleFaced) this.face(o);
    this.idleFaced = !going;
    animateWalker(this.scene, s, going, dt);
    s.setDepth(s.y);
  }

  // in your boat: they sit in the back, facing the way you row
  ride() {
    const sc = this.scene;
    const p = sc.player;
    const face = sc.facing || 'down';
    const [dx, dy] = DIRS[face];
    const view = face === 'up' ? 'up' : face === 'down' ? 'down' : 'side';
    const s = this.s;
    this.seated = true;
    this.trail = [];
    s.setTexture(`${this.prefix}_${view}`).setFlipX(face === 'left');
    s.setPosition(p.x - dx * 13, p.y - dy * 9);
    s.setCrop(0, 0, 32, SEAT_CROP).setOrigin(0.5, (SEAT_CROP + 2) / 32);
    s.setDepth(p.y + (dy < 0 ? 0.5 : -0.5));
  }

  /** Tap them: a story, how long they can stay, or say bye. */
  talk(done) {
    const sc = this.scene;
    const pr = progression();
    const self = this;
    const portrait = sc.textures.get(`${this.prefix}_down`).getSourceImage();
    let bye = false;
    function* chat() {
      yield { type: 'line', text: pick(self.id, self.data.walk) };
      for (let guard = 0; guard < 10; guard++) {
        const c = yield {
          type: 'hub',
          text: `Hanging out: about ${pr.companions.minutesLeft()} more minutes.`,
          choices: [
            { id: 'story', label: 'Tell me a story' },
            { id: 'fact', label: 'Tell me something I don’t know' },
            { id: 'bye', label: 'See you later' },
            { id: 'stay', label: 'Never mind' },
          ],
        };
        if (c === 'story') yield { type: 'line', text: pick(self.id, self.data.stories) };
        else if (c === 'fact') yield { type: 'line', text: pick(self.id, Math.random() < 0.7 ? self.data.facts : self.data.sayings) };
        else {
          bye = c === 'bye';
          return;
        }
      }
    }
    return runDialogue(chat(), {
      name: this.npc.name,
      label: this.npc.role,
      portrait,
      leave: () => this.gone || !this.s.active,
      onEnd: () => {
        done?.();
        if (bye) this.leave('See you! Call me again tomorrow.');
      },
    });
  }

  /** They head home: a goodbye, then a fade. */
  leave(line) {
    if (this.gone) return;
    this.gone = true;
    progression().companions.end();
    const sc = this.scene;
    const s = this.s;
    showTalk(this.npc.name, this.npc.role, line, sc.speakerAt(s), 2600);
    sfx('tap');
    sc.tweens.add({ targets: s, alpha: 0, delay: 2200, duration: 500, onComplete: () => s.destroy() });
    sc.buddyGone?.(this);
  }

  destroy() {
    this.gone = true;
    this.s?.destroy();
  }
}
