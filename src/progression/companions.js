// Companions: a friend at ten hearts whose favour you finished gives you their number. Call them
// from your phone and they come and hang out: they follow you, ride in your boat, tell stories while
// you fish, and help a little (data/companions.json `boost`). Each friend comes once a day for
// HANG_MS of play, then heads home; after anyone leaves the phone rests for COOL_MS.
// The island side (the person walking about, the phone) is src/companion.js and src/ui/phone.js.
import COMPANIONS from './data/companions.json' with { type: 'json' };
import { npcById } from './friendship.js';

export { COMPANIONS };
export const COMPANION_IDS = Object.keys(COMPANIONS).filter((k) => !k.startsWith('_')); // (_about is the file's note)
export const HANG_MS = 30 * 60 * 1000;
export const COOL_MS = 5 * 60 * 1000;

const rec = (p) => (p.state.companion ||= { id: '', left: 0, cool: 0, days: {} });

export function installCompanions(p) {
  const { bus } = p;

  const mod = {
    name: 'companions',
    /** Whether this friend has given you their number. */
    hasNumber(id) {
      const f = p.state.friends[id];
      return COMPANION_IDS.includes(id) && (f?.hearts || 0) >= 10 && !!f?.quest?.done;
    },
    /** Your phone's contacts: everyone whose number you have, with what they are up to. */
    contacts() {
      const c = rec(p);
      const now = p.clock.now();
      return COMPANION_IDS.filter((id) => mod.hasNumber(id))
        .map((id) => {
          const npc = npcById(id);
          let status = 'free';
          if (c.id === id) status = 'with';
          else if (c.days[id] === p.today()) status = 'today';
          else if (c.id) status = 'busy';
          else if (c.cool > now) status = 'cool';
          return { id, name: npc.name, role: npc.role, wears: npc.wears, boost: COMPANIONS[id].boost.text, status, coolMin: Math.max(1, Math.ceil((c.cool - now) / 60000)) };
        });
    },
    /** Who is with you now ('' for nobody). */
    current: () => rec(p).id,
    /** Minutes of hanging out left. */
    minutesLeft: () => Math.ceil(rec(p).left / 60000),
    /** Call a friend. Returns { ok, reason? }. */
    call(id) {
      const c = contact(id);
      if (!c) return { ok: false, reason: 'number' };
      if (c.status !== 'free') return { ok: false, reason: c.status };
      const s = rec(p);
      s.id = id;
      s.left = HANG_MS;
      s.days[id] = p.today();
      p.telemetry?.track?.('companion_called', { npc: id });
      bus.emit('COMPANION_CALLED', { npcId: id });
      p.store.commit();
      return { ok: true };
    },
    /** Playing time passes with them (ms). Returns true when their time is up. */
    tick(ms) {
      const s = rec(p);
      if (!s.id) return false;
      s.left -= ms;
      return s.left <= 0;
    },
    /** They head home (their time is up, or you said bye). */
    end() {
      const s = rec(p);
      if (!s.id) return;
      const id = s.id;
      s.id = '';
      s.left = 0;
      s.cool = p.clock.now() + COOL_MS;
      bus.emit('COMPANION_LEFT', { npcId: id });
      p.store.commit();
    },
    /** The help the friend with you gives: { kind, mult, skill? } or null. */
    boost: () => (rec(p).id ? COMPANIONS[rec(p).id]?.boost || null : null),
    /** Rare-fish weight and bite-wait multipliers for a cast. */
    luck: () => (mod.boost()?.kind === 'luck' ? mod.boost().mult : 1),
    quick: () => (mod.boost()?.kind === 'quick' ? mod.boost().mult : 1),
  };
  const contact = (id) => mod.contacts().find((c) => c.id === id);

  // their help with XP: a bit more of one skill, or a bit more of everything
  const xp0 = p.xp;
  p.xp = (amount, source, o) => xp0(mod.boost()?.kind === 'xp' ? amount * mod.boost().mult : amount, source, o);
  const skill0 = p.skillXp;
  p.skillXp = (id, amount, o) => {
    const b = mod.boost();
    return skill0(id, b?.kind === 'skill' && b.skill === id ? amount * b.mult : amount, o);
  };

  // finishing a friend's favour at ten hearts: they give you their number
  bus.on('GIFT_GIVEN', ({ npcId }) => {
    const f = p.state.friends[npcId];
    if (!f?.quest?.done || f.numberGiven || !mod.hasNumber(npcId)) return;
    f.numberGiven = true;
    p.queue.push({ kind: 'unlock', title: `${npcById(npcId).name} gave you their number`, sub: `${COMPANIONS[npcId].number} Call them from the phone.`, rarity: 4 });
    p.store.commit();
  });

  p.mods.companions = mod;
  p.companions = mod;
}
