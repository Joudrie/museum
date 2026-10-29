// Subscription. Gating is by region and content breadth, never power: rank is never capped.
//   Free: the starter regions, core fishing, the journal, friendships, daily tasks (about 5 to 8 hours).
//   Subscriber: more regions (visible as locked docks), the event track's subscriber lane, house
//   expansions and bigger tanks, a monthly cosmetic set, an extra request slot.
// A lapsed subscriber keeps everything they earned; only subscriber content locks, and resubscribing
// restores it instantly. There is no payment code here: `hooks.subscribe` is where one would plug in.
// Paywall moments are rare, concrete (silhouettes of the fish out there) and never before the first
// traversal unlock. Never real money for randomized rewards; no fake countdowns, ever.
import { REGIONS, speciesOfRegion, hintsFor } from './species.js';
import { regionFishProgress } from './journal.js';

export function installSub(p) {
  const { bus, T } = p;
  const flags = () => p.state.flags.paywallSeen;
  let shownThisSession = false;
  bus.on('SESSION_START', () => (shownThisSession = false));

  const allowed = () => !shownThisSession && !!p.state.telemetry.first.traversal_unlock;

  /** What a locked subscriber island offers, in concrete terms. */
  function offer(region) {
    const sp = speciesOfRegion(region);
    return { region, name: REGIONS[region]?.name, fish: sp.length, unseen: sp.filter((s) => !p.state.fish.species[s.id]?.n).length, silhouettes: sp.filter((s) => !p.state.fish.species[s.id]?.n).slice(0, 8).map((s) => ({ id: s.id, rarity: s.rarity })), lanes: ['A subscriber event lane', 'Bigger tanks and a workshop', 'A monthly cosmetic set', 'An extra request slot'] };
  }

  const mod = {
    name: 'sub',
    install() {},
    active: () => p.state.sub.active,
    offer,
    allowed,
    /** Called by the places that may show a paywall; returns an offer to show, or null if it is not the moment. */
    moment(context, region) {
      if (!allowed() || p.state.sub.active) return null;
      const key = `${context}:${region || ''}`;
      if (flags()[key]) return null;
      flags()[key] = p.clock.now();
      shownThisSession = true;
      p.telemetry.track('paywall_view', { context, region: region || '' });
      p.store.commit();
      return { context, ...offer(region || 'wreck') };
    },
    activate() {
      const s = p.state.sub;
      if (s.active) return;
      s.active = true;
      s.ever = true;
      s.since = p.clock.now();
      p.telemetry.track('sub_start', { since: s.since });
      p.store.commit();
    },
    // everything earned stays; only subscriber content locks
    cancel() {
      if (!p.state.sub.active) return;
      p.state.sub.active = false;
      p.telemetry.track('sub_cancel', {});
      p.store.commit();
    },
  };
  p.mods.sub = mod;
  p.sub = mod;

  // after finishing every fish of a free island: the best moment to look across the water
  bus.on('FISH_CAUGHT', ({ region }) => {
    const info = REGIONS[region];
    if (!info || info.tier !== 'free') return;
    const g = regionFishProgress(p, region);
    if (g.left === 0 && T.sub.enforce) {
      const lockedSub = Object.keys(REGIONS).find((r) => REGIONS[r].tier === 'sub');
      const o = mod.moment('page_complete', lockedSub);
      if (o) p.queue.push({ kind: 'item', title: `${info.name} is complete`, sub: `${o.fish} fish are waiting at ${o.name}.`, rarity: 4 });
    }
  });
  void hintsFor;
}
