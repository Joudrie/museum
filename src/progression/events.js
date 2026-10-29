// Live events, fully data-driven (data/events.json): a date window, an event currency, a 30-tier track
// with a free lane and a subscriber lane, three fish that bite only during the festival, an event
// cosmetic set, and a journal page that stays afterwards with greyed entries marked "returns next year".
// Seasons follow the real calendar (weather.js); events follow date windows.
import EVENTS from './data/events.json' with { type: 'json' };
import MONTHLY from './data/monthly.json' with { type: 'json' };
import { allSpecies } from './species.js';
import { grant, COSMETICS } from './grants.js';

export { EVENTS, MONTHLY };
export const TIERS = 30;
export const TOKENS_PER_TIER = 10;

const md = (ms) => {
  const d = new Date(ms);
  return d.getMonth() * 100 + d.getDate();
};
export function isActive(ev, ms) {
  const [sm, sd] = ev.start;
  const [em, ed] = ev.end;
  const a = (sm - 1) * 100 + sd;
  const b = (em - 1) * 100 + ed;
  const n = md(ms);
  return a <= b ? n >= a && n <= b : n >= a || n <= b; // winter wraps the new year
}
export const activeEvents = (ms) => Object.entries(EVENTS).filter(([, ev]) => isActive(ev, ms)).map(([id, ev]) => ({ id, ...ev }));
export const speciesOf = (id) => allSpecies().filter((s) => s.event === id);

/** What the track gives at a tier: { free, sub }. Built from the event's cosmetic list, so it can never reference something missing. */
export function trackRewards(id) {
  const ev = EVENTS[id];
  const cos = ev.cosmetics;
  const out = [];
  for (let t = 1; t <= TIERS; t++) {
    let free;
    if (t === 30) free = [{ title: cos.find((c) => c.startsWith('title:'))?.slice(6) || 'newcomer' }, { gold: 500 }];
    else if (t === 15) free = [{ cosmetic: cos.find((c) => !c.startsWith('title:')) }];
    else if (t % 5 === 0) free = [{ bait: ['goldenfly', 1] }];
    else if (t % 2 === 0) free = [{ bait: ['shrimp', 5] }];
    else free = [{ gold: 30 + t * 6 }];
    let sub = [];
    if (t % 5 === 0) {
      const pool = cos.filter((c) => !c.startsWith('title:'));
      sub = [{ cosmetic: pool[(t / 5 - 1) % pool.length] }, { gold: t * 10 }];
    } else if (t % 3 === 0) sub = [{ gold: 60 + t * 8 }];
    out.push({ tier: t, free, sub });
  }
  return out;
}

export function installEvents(p) {
  const { bus, T } = p;
  const st = (id) => (p.state.events[id] ||= { tokens: 0, claimed: {}, joined: 0 });
  p.activeEventIds = () => activeEvents(p.clock.now()).flatMap((e) => [e.id, ...(e.also || [])]);

  bus.on('SESSION_START', () => {
    activeEvents(p.clock.now()).forEach((e) => {
      const o = p.sub?.moment('event_start', e.id);
      if (o) p.hooks.paywall?.({ ...o, region: o.region });
    });
  });

  bus.on('FISH_CAUGHT', (ev) => {
    const active = activeEvents(p.clock.now());
    active.forEach((e) => {
      const rec = st(e.id);
      if (!rec.joined) {
        rec.joined = p.clock.now();
        p.telemetry.track('event_joined', { id: e.id });
      }
      const sp = allSpecies().find((s) => s.id === ev.speciesId);
      const gain = 1 + (sp?.event === e.id ? 3 : 0) + (ev.rarity >= 3 ? 1 : 0);
      const before = Math.floor(rec.tokens / TOKENS_PER_TIER);
      rec.tokens += gain;
      const after = Math.floor(rec.tokens / TOKENS_PER_TIER);
      if (after > before) p.queue.push({ kind: 'item', title: `${e.name}: tier ${Math.min(after, TIERS)} reached`, sub: 'Claim it in the Events tab.' });
    });
  });

  const mod = {
    name: 'events',
    install() {},
    active: () => activeEvents(p.clock.now()),
    all: () => Object.entries(EVENTS).map(([id, ev]) => ({ id, ...ev, active: isActive(ev, p.clock.now()), tokens: st(id).tokens, tier: Math.min(TIERS, Math.floor(st(id).tokens / TOKENS_PER_TIER)), species: speciesOf(id) })),
    track: (id) => trackRewards(id).map((r) => ({ ...r, reached: st(id).tokens >= r.tier * TOKENS_PER_TIER, freeClaimed: !!st(id).claimed[`free:${r.tier}`], subClaimed: !!st(id).claimed[`sub:${r.tier}`] })),
    /** Claim a tier's reward in a lane. The subscriber lane needs a subscription once that is enforced. */
    claim(id, tier, lane = 'free') {
      const rec = st(id);
      const row = trackRewards(id)[tier - 1];
      const key = `${lane}:${tier}`;
      if (!row || rec.claimed[key] || rec.tokens < tier * TOKENS_PER_TIER || !row[lane]?.length) return null;
      if (lane === 'sub' && T.sub.enforce && !p.state.sub.active) {
        p.telemetry.track('paywall_view', { context: 'event_start', id });
        return null;
      }
      rec.claimed[key] = true;
      const got = grant(p, row[lane], T);
      p.queue.push({ kind: 'item', title: `${EVENTS[id].name} tier ${tier}`, sub: lane === 'sub' ? 'Subscriber lane' : 'Free lane', rewards: got, rarity: lane === 'sub' ? 4 : 2 });
      p.store.commit();
      return got;
    },
    thisMonth: () => MONTHLY[new Date(p.clock.now()).getMonth()],
    nextMonth: () => MONTHLY[(new Date(p.clock.now()).getMonth() + 1) % 12],
    COSMETICS,
  };
  p.mods.events = mod;
  p.events = mod;
}
