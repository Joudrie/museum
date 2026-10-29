// The progression layer's part of an island scene: the named people who live there, talking to them,
// emotes at the player, the stuck-detector nudge, and keeping "where am I" current.
import { progression } from '../index.js';
import { NPCS } from '../friendship.js';
import { REGIONS } from '../species.js';
import { runDialogue } from '../../dialogue.js';
import { makeEmotes } from '../../art.js';
import { namedConverse } from './talkflow.js';
import { sfx } from '../../music.js';

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
          s.islanders.push(s.islander(x, y, 2, s.islanders.length, { id: npc.id, name: npc.name, kind: npc.kind === 'caretaker' ? 'elder' : npc.kind }));
          return;
        }
    });
  }

  emote(n, id) {
    const s = this.scene;
    if (!n?.s?.active) return;
    const key = `emote_${id === 'question' ? 'q' : id}`;
    if (!s.textures.exists(key)) return;
    n.emoteImg?.destroy();
    const img = s.add.image(n.s.x, n.s.y - 40, key).setOrigin(0.5, 1).setDepth(5000).setScale(0);
    n.emoteImg = img;
    s.tweens.add({ targets: img, scale: 1, duration: 180, ease: 'Back.easeOut' });
    s.tweens.add({ targets: img, alpha: 0, delay: 1700, duration: 300, onComplete: () => img.destroy() });
    this.p.bus.emit('EMOTE_SEEN', { emoteId: id === 'question' ? 'q' : id, from: n.npcId || '' });
  }

  /** Called when the player taps a person. Returns true if a conversation took over. */
  talk(n) {
    const s = this.scene;
    const p = this.p;
    const named = !!n.npcId;
    p.bus.emit('NPC_TALKED', { npcId: named ? n.npcId : `anon:${s.regionKey}:${n.name}`, kind: n.kind, region: s.regionKey });
    if (!named) return false;
    const npc = NPCS.find((x) => x.id === n.npcId);
    s.paused = true;
    const portrait = s.textures.exists(`${n.prefix}_down`) ? s.textures.get(`${n.prefix}_down`).getSourceImage() : null;
    runDialogue(namedConverse(p, n.npcId, { emote: (id) => this.emote(n, id) }), {
      name: npc.name,
      label: npc.role,
      portrait,
      onEnd: () => {
        s.paused = false;
        p.queue.poke();
      },
    });
    return true;
  }

  // people who know you wave: a close friend's own emote, and (with Familiar face) anyone's heart
  update(dt) {
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
