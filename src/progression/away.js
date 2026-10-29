// Returning and leaving. On return after a long absence a small "While you were away" card: a letter
// with a gift, little changes in the world. Capped: it never scales with absence beyond a few days, and
// it asks for nothing. On leaving, a "Next time" card with up to three open loops and never an empty one.
// Notifications are opt-in, at most one a day, and about something specific; never guilt.
import { grant } from './grants.js';
import { allSpecies, REGIONS, hintsFor } from './species.js';

const WORLD_LINES = [
  'The raker finished his big pile of leaves by the path.',
  'A new bottle washed up near the dock. Nobody has opened it.',
  'Someone left a basket of bread on the bench.',
  'The pond is calm, and there are new ripples at the far end.',
  'A heron has been standing on the dock all week.',
  'Fresh footprints lead along the shore.',
  'The lanterns by the boat were lit for you.',
];

// words a reminder must never use (the validator and the unit test check the copy against this)
export const GUILT = /\b(miss(ed)?|waiting|lonely|forgot|come back|don't (leave|forget)|you haven't|streak (will|is about)|expire|last chance|hurry|running out)\b/i;

export function installAway(p) {
  const { bus, T } = p;
  let card = null;

  bus.on('SESSION_START', ({ away }) => {
    const ms = away?.ms || 0;
    const hours = ms / 3600e3;
    if (hours < T.away.cardAfterHours || p.state.sessions <= 1) return;
    const days = Math.min(T.away.maxDays, Math.max(1, Math.floor(hours / 24)));
    const r = p.rngFor(`away:${p.today()}`);
    const [lo, hi] = T.away.giftGold;
    const gold = Math.round(lo + ((hi - lo) * (days - 1)) / Math.max(1, T.away.maxDays - 1));
    const lines = r.shuffle(WORLD_LINES).slice(0, 2);
    // a new rumour at the dock: hint two for a species you have not met
    const open = allSpecies().filter((s) => s.rarity < 5 && !s.event && !p.state.fish.species[s.id]?.n && !p.state.journal.leads[`rumor:${s.id}`] && s.regions.some((x) => !REGIONS[x]?.req || p.state.unlocks[REGIONS[x].req]));
    if (open.length) {
      const sp = open[r.int(open.length)];
      p.state.journal.leads[`rumor:${sp.id}`] = { at: p.clock.now(), from: 'dock', state: 'open' };
      lines.push(`A new rumour at the dock: ${hintsFor(sp)[1]}`);
    }
    card = { gold, lines, rested: away.rested || 0, days };
    p.state.away.mail = card;
    p.state.away.lastCardAt = p.clock.now();
    p.store.commit();
    p.queue.push({ kind: 'away', title: 'While you were away', lines, rested: card.rested, gold, days });
  });

  const mod = {
    name: 'away',
    install() {},
    pending: () => p.state.away.mail,
    /** Take the letter's gift. */
    collect() {
      const m = p.state.away.mail;
      if (!m) return 0;
      p.state.away.mail = null;
      grant(p, [{ gold: m.gold }], T);
      p.store.commit();
      return m.gold;
    },
    /** The leaving card: three lines at most, always at least one open loop. */
    nextTime: () => p.goals.nextTime(),
    /** The one notification we might send today: specific, kind, opt-in. Returns null if none is due. */
    notification() {
      if (!p.state.flags.notify) return null;
      const day = p.today();
      if (p.state.flags.notifiedDay === day) return null;
      const wk = p.tasks.weekly();
      const sp = wk?.rumor && !wk.rumor.caught ? allSpecies().find((s) => s.id === wk.rumor.speciesId) : null;
      const text = sp ? `The weekly rumour fish was spotted near ${REGIONS[wk.rumor.region]?.name}.` : 'New requests are on the board.';
      return { title: 'Curation', body: text };
    },
    markNotified() {
      p.state.flags.notifiedDay = p.today();
      p.store.commit();
    },
    setNotify(on) {
      p.state.flags.notify = !!on;
      p.store.commit();
    },
  };
  p.mods.away = mod;
  p.away2 = mod;
}
