// The progression layer's part of an island scene: the named people who live there, talking to them,
// emotes at the player, the stuck-detector nudge, and keeping "where am I" current.
import { progression } from '../index.js';
import { NPCS } from '../friendship.js';
import { REGIONS } from '../species.js';
import { runDialogue } from '../../dialogue.js';
import { makeEmotes } from '../../art.js';
import { namedConverse } from './talkflow.js';
import { sfx } from '../../music.js';
import { popEmote } from '../../emotes.js';
import { WorldLife } from './worldlife.js';

const T = 32;

export class IslandLife {
  constructor(scene) {
    this.scene = scene;
    this.p = progression();
    this.t = 0;
    this.cool = new Map();
    makeEmotes(scene);
    this.p.where.region = scene.regionKey;
    this.p.where.map = scene.mapId;
    this.p.bus.emit('WEATHER_SEEN', { weather: scene.weatherKind });
    // arriving somewhere new is a place for the journal
    const info = REGIONS[scene.regionKey];
    if (info) this.p.bus.emit('LOCATION_DISCOVERED', { region: scene.regionKey, placeId: `${scene.regionKey}:island`, name: info.name });
    this.placeNamed();
    scene.world = new WorldLife(scene); // fog, secrets, sparkles, viewpoints (src/progression/ui/worldlife.js)
    this.onNudge = (e) => this.nudge(e.detail);
    window.addEventListener('prog-nudge', this.onNudge);
    scene.events.once('shutdown', () => window.removeEventListener('prog-nudge', this.onNudge));
  }

  // someone to talk to: the island's named people stand near where you arrive, a few steps from each other
  placeNamed() {
    const s = this.scene;
    const here = NPCS.filter((n) => n.region === s.regionKey && n.id !== 'edmund');
    const o = { x: s.player.x, y: s.player.y };
    here.forEach((npc, i) => {
      if (s.islanders.some((x) => x.npcId === npc.id)) return;
      for (let r = 4 * T; r < 18 * T; r += T)
        for (let a = i * 1.1; a < i * 1.1 + Math.PI * 2; a += Math.PI / 8) {
          const x = o.x + Math.cos(a) * r;
          const y = o.y + Math.sin(a) * r;
          if (x < 2 * T || y < 2 * T || x > (s.tilesW - 2) * T || y > (s.tilesH - 2) * T) continue;
          if (s.ground_(x, y) === 'water' || !s.free(x, y) || !s.free(x + T, y) || !s.free(x - T, y)) continue;
          s.islanders.push(s.islander(x, y, 2, s.islanders.length, null, false, { id: npc.id, name: npc.name, kind: npc.kind === 'caretaker' ? 'elder' : npc.kind }));
          return;
        }
    });
  }

  emote(n, id) {
    const s = this.scene;
    if (!n?.s?.active) return;
    const key = id === 'question' ? 'q' : id;
    // (the picture pops over their head and follows them: src/emotes.js)
    if (popEmote(s, n, key, { hold: 1700 })) this.p.bus.emit('EMOTE_SEEN', { emoteId: key, from: n.npcId || '' });
  }

  // every talk counts, named or not (the sayings of people who have their own lines count it here too)
  count(n) {
    const s = this.scene;
    this.p.bus.emit('NPC_TALKED', { npcId: n.npcId ? n.npcId : `anon:${s.regionKey}:${n.name}`, kind: n.kind, region: s.regionKey });
  }

  /** Called when the player taps a person. Returns the conversation's handle if one took over (a named person). `done` runs when it ends. */
  talk(n, done) {
    const s = this.scene;
    const p = this.p;
    this.count(n);
    if (!n.npcId) {
      this.ambient(n);
      return null;
    }
    const npc = NPCS.find((x) => x.id === n.npcId);
    s.paused = true;
    const portrait = s.textures.exists(`${n.prefix}_down`) ? s.textures.get(`${n.prefix}_down`).getSourceImage() : null;
    return runDialogue(namedConverse(p, n.npcId, { emote: (id) => this.emote(n, id) }), {
      name: npc.name,
      label: npc.role,
      portrait,
      onEnd: () => {
        s.paused = false;
        done?.();
        p.queue.poke();
      },
    });
  }

  // unnamed islanders are friendly too, once a day each: the raker hands you what he gathered, the reader on the bench trades a rumour
  ambient(n) {
    const s = this.scene;
    const p = this.p;
    const key = `${s.regionKey}:${n.name}:${p.today()}`;
    this.given ||= new Set();
    if (this.given.has(key) || n.animal) return;
    this.given.add(key);
    if (n.kind === 'elder') {
      const item = s.season === 'winter' || s.season === 'autumn' ? 'pinecone' : 'flower';
      p.bus.emit('ITEM_FORAGED', { itemId: item, region: s.regionKey });
      s.toast(`${n.name} gives you a ${item === 'pinecone' ? 'pinecone' : 'wildflower'}.`);
      this.emote(n, 'heart');
    } else if (n.kind === 'nerd' || n.kind === 'superfan') {
      const hint = p.friendship.ambientRumor(s.regionKey);
      if (hint) s.toast(`${n.name}: ${hint}`);
      this.emote(n, 'note');
    } else if (n.kind === 'kid') this.emote(n, 'star');
  }

  // people who know you wave: a close friend's own emote, and (with Familiar face) anyone's heart
  update(dt) {
    s_world(this.scene, dt);
    this.t += dt;
    if (this.t < 1) return;
    this.t = 0;
    const s = this.scene;
    const pl = s.player;
    const now = performance.now();
    s.islanders.forEach((n) => {
      if (n.animal || !n.s?.active) return;
      if (Math.hypot(n.s.x - pl.x, n.s.y - pl.y) > 5 * T) return;
      if (now - (this.cool.get(n) || 0) < 25000) return;
      const hearts = n.npcId ? this.p.state.friends[n.npcId]?.hearts || 0 : 0;
      if (n.npcId && hearts >= 4 && Math.random() < 0.25) {
        this.cool.set(n, now);
        this.emote(n, NPCS.find((x) => x.id === n.npcId).emote);
      } else if (this.p.has('friendship.waves') && Math.random() < 0.08) {
        this.cool.set(n, now);
        this.emote(n, 'heart');
      }
    });
  }

  // five quiet minutes: someone with a request shows a "!", or a splash shows where fish are
  nudge() {
    const s = this.scene;
    const reqs = this.p.requests.board().filter((r) => !r.done);
    const n = s.islanders.find((x) => x.npcId && reqs.some((r) => r.npc === x.npcId));
    if (n) {
      this.emote(n, 'bang');
      sfx('tap');
      return;
    }
    const hot = s.waterfx?.hot?.[0];
    if (hot) {
      s.fishing.splash(hot.x, hot.y, 1);
      sfx('plop');
    }
  }
}

function s_world(scene, dt) {
  scene.world?.update(dt);
}
