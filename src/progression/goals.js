// Goal surfacing: one pinned goal and the rank bar on the HUD; the Goals tab groups everything
// into Now, Today, This week and Long-term. With nothing pinned, the goal with the highest
// progress x reward value that can be done in the current area is pinned for you. A stuck
// detector nudges after five minutes of play with no progress tick.
import { TUNING } from './config.js';
import { nearlyDone, completion, PAGES } from './journal.js';
import { REGIONS, LEGENDS, speciesById } from './species.js';
import { msToHotMove } from './fishroll.js';
import { npcById } from './friendship.js';
import { UNLOCK_NAMES } from './grants.js';
import RANKS from './data/ranks.json' with { type: 'json' };

export function installGoals(p) {
  const { bus, T } = p;
  p.where = { region: 'main' }; // the scene keeps this current

  const value = (g) => (g.reward?.xp || 0) + (g.reward?.gold || 0) / 4 + 5;

  function all() {
    const s = p.state;
    const out = [];
    p.tasks?.today().forEach((t, i) => out.push({ id: `task:${i}`, group: 'today', title: t.text, n: t.progress, of: t.n, done: t.done, reward: { xp: t.xp, gold: t.gold }, rerollable: !t.done }));
    p.requests?.board().forEach((r) => out.push({ id: `req:${r.id}`, group: 'today', title: r.text, n: r.done ? 1 : r.canDeliver ? 1 : 0, of: 1, done: r.done, reward: { xp: r.xp, gold: r.gold }, region: npcById(r.npc)?.region, npc: r.npc, request: r }));
    const wk = p.tasks?.weekly();
    if (wk?.steps) {
      const cur = wk.steps.find((x) => !x.done);
      wk.steps.forEach((st, i) => out.push({ id: `week:${i}`, group: 'week', title: st.text, n: st.progress, of: st.n, done: st.done, reward: { xp: i === wk.steps.length - 1 ? T.xp.weekly : 0, gold: 0 } }));
      if (wk.rumor && !wk.rumor.caught) out.push({ id: 'rumor', group: 'week', title: `Weekly rumor: a ${speciesById(wk.rumor.speciesId)?.name} near ${REGIONS[wk.rumor.region]?.name}`, n: 0, of: 1, reward: { xp: 40, gold: 60 }, region: wk.rumor.region });
      if (wk.derby) out.push({ id: 'derby', group: 'week', title: `Derby: biggest ${speciesById(wk.derby.speciesId)?.name}${wk.derby.best ? ` (best ${wk.derby.best} cm)` : ''}`, n: wk.derby.best ? 1 : 0, of: 1, reward: { gold: 250 } });
      void cur;
    }
    // long term
    const lv = p.level();
    const next = p.nextRank();
    out.push({ id: 'rank', group: 'long', title: `${next.label}${next.text ? ': ' + next.text : ''}`, n: Math.round(lv.into), of: lv.need, reward: { xp: 0, gold: 0 }, value: 30 + (next.major ? 40 : 0) });
    const trav = nextTraversal(lv.level);
    if (trav) out.push({ id: 'traversal', group: 'long', title: `${trav.name} at Rank ${trav.rank}`, n: lv.level, of: trav.rank, reward: {}, value: 60 });
    nearlyDone(p, 0.5).slice(0, 3).forEach((n) => out.push({ id: `set:${n.id}`, group: 'long', title: `${n.left} left to complete ${n.kind === 'set' ? n.id.replace(/-/g, ' ') : n.id}`, n: n.have, of: n.total, reward: { gold: 300 }, value: 50 }));
    Object.entries(LEGENDS).forEach(([id, l]) => {
      const t = s.journal.leads[`legend:${id}`];
      if (t && t.stage !== 'none' && !s.fish.species[id]?.n) out.push({ id: `legend:${id}`, group: 'long', title: t.stage === 'rumor' ? `Find the clue for the ${speciesById(id)?.name}` : `Hunt the ${speciesById(id)?.name}`, n: t.stage === 'rumor' ? 1 : 2, of: 3, reward: { xp: 250 }, region: l.region, value: 120 });
    });
    return out.map((g) => ({ ...g, pct: g.done ? 100 : g.of ? Math.min(99, (100 * (g.n || 0)) / g.of) : 0 }));
  }

  function nextTraversal(level) {
    for (const r of RANKS) if (r.rank > level) {
      const u = r.rewards.find((x) => x.unlock && /^(boat|gear|area):/.test(x.unlock));
      if (u) return { rank: r.rank, name: UNLOCK_NAMES[u.unlock] || u.unlock };
    }
    return null;
  }

  const mod = {
    name: 'goals',
    install() {},
    all,
    pinned() {
      const id = p.state.pinned;
      return id ? all().find((g) => g.id === id && !g.done) || null : null;
    },
    pin(id) {
      p.state.pinned = id || null;
      if (id) p.telemetry.track('goal_pinned', { id });
      p.store.commit();
    },
    /** Pinned goal, or the best one to do right here: highest progress x reward value. */
    pinnedOrAuto() {
      const pin = mod.pinned();
      if (pin) return { ...pin, auto: false };
      const first = p.firstHour?.next();
      if (first) return { ...first, pct: (100 * first.n) / first.of, auto: false };
      const here = p.where.region;
      const list = all().filter((g) => !g.done && g.group !== 'long' && (!g.region || g.region === here));
      if (!list.length) return all().filter((g) => g.group === 'long')[0] || null;
      list.sort((a, b) => (b.pct + 10) * value(b) - (a.pct + 10) * value(a));
      return { ...list[0], auto: true };
    },
    nextTime() {
      // the logout card: at most three open loops, never empty
      const lines = [];
      const ms = msToHotMove(p.clock.now());
      lines.push(`A hot spot moves in ${Math.floor(ms / 3600e3)}h ${Math.round((ms % 3600e3) / 60e3)}m.`);
      const open = all().filter((g) => !g.done && g.group === 'today');
      const wk = p.tasks?.weekly();
      if (wk?.rumor && !wk.rumor.caught) lines.push(`The weekly rumour is unsolved: a ${speciesById(wk.rumor.speciesId)?.name}.`);
      const sets = nearlyDone(p, 0.5);
      if (sets[0]) lines.push(`${sets[0].left} fish left on ${sets[0].kind === 'set' ? sets[0].id.replace(/-/g, ' ') : sets[0].id}.`);
      if (open.length) lines.push(`${open.length} of today's goals still open.`);
      lines.push('Requests refresh at 4:00 tomorrow.');
      const lg = Object.entries(p.state.journal.leads).find(([k, v]) => k.startsWith('legend:') && v.stage && v.stage !== 'none' && !p.state.fish.species[k.slice(7)]?.n);
      if (lg) lines.unshift(`A legend is still out there: ${speciesById(lg[0].slice(7))?.name}.`);
      return lines.slice(0, 3);
    },
  };
  p.mods.goals = mod;
  p.goals = mod;

  // stuck detector: five minutes of active play with no visible progress
  bus.on('SESSION_TICK', () => {
    if (p.idleMs < T.stuckMinutes * 60e3) return;
    p.idleMs = 0;
    p.telemetry.track('last_action', { stuck: true });
    p.hooks.nudge?.({ goal: mod.pinnedOrAuto() });
  });
}
export const goalsModule = { name: 'goals-install', install: installGoals };
