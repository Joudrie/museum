// ProgressionService: the one path every system obeys. Gameplay code emits
// typed events on the bus; modules subscribe here and route them to rank,
// skills, journal, tasks, friendship, economy and telemetry. Nothing in the
// game calls XP or journal code directly.
import { TUNING } from './config.js';
import { createBus } from './bus.js';
import { createClock } from './clock.js';
import { createRng, hashSeed } from './rng.js';
import { createStore, memoryAdapter, defaults } from './store.js';
import { addXp, levelOf, creditAway, rankLabel, xpToNext } from './rank.js';
import { addSkillXp, skillLevel, SKILLS, perkSet } from './skills.js';
import { instantQueue } from './rewardqueue.js';
import { grant, describe } from './grants.js';
import { createTelemetry } from './telemetry.js';
import { endow } from './journal.js';
import RANKS from './data/ranks.json' with { type: 'json' };

export const rankRewards = (L) => (L > TUNING.rank.max ? [{ token: 1 }] : RANKS[L - 1]?.rewards || []);
export const isMajor = (L) => L <= TUNING.rank.max && !!RANKS[L - 1]?.major;

/**
 * Builds the service. Everything environment-specific is injected:
 *   store    where the save lives (memory in Node, localStorage in the browser)
 *   clock    time source        rng   random source (seeded in tests)
 *   queue    the reward queue (the browser passes one with a real presenter)
 *   hooks    { gold:{get,add}, collect(entryId, opts), toast(msg), hourNow(), modules[] }
 */
export function createProgression({ store, bus = createBus(), clock, rng = createRng(), queue, hooks = {}, T = TUNING, sink = null, modules = [] } = {}) {
  store ||= createStore(memoryAdapter(), { now: Date.now() });
  clock ||= createClock({ lastSeen: store.state.lastSeenAt });
  queue ||= instantQueue();
  const p = { store, bus, clock, rng, queue, hooks, T, ready: false, last: null, away: null, mods: {} };
  Object.defineProperty(p, 'state', { get: () => store.state });
  p.rngFor = (label) => createRng(hashSeed(`${p.state.installAt}:${label}`));
  p.hourNow = () => hooks.hourNow?.() ?? new Date(clock.now()).getHours() + new Date(clock.now()).getMinutes() / 60;

  // ---- gold (the wallet in the browser; a counter in the sim) ----
  p.gold = {
    get: () => (hooks.gold ? hooks.gold.get() : p.state.market.simGold),
    add(n) {
      if (hooks.gold) hooks.gold.add(n);
      else p.state.market.simGold += n;
    },
    pay(n) {
      if (n <= 0) return true;
      if (p.gold.get() < n) return false;
      p.gold.add(-n);
      p.state.market.spent += n;
      return true;
    },
  };

  p.telemetry = createTelemetry(p, sink);

  // ---- perks ----
  let perkKey = '';
  let perkCache = new Set();
  p.perks = () => {
    const key = Object.values(p.state.skills).join(',');
    if (key !== perkKey) {
      perkKey = key;
      perkCache = perkSet(p.state);
    }
    return perkCache;
  };
  p.has = (k) => p.perks().has(k);

  // ---- progress ticks (the stuck detector listens) ----
  p.idleMs = 0;
  p.noteProgress = () => {
    p.idleMs = 0;
  };
  p.today = () => clock.day();
  // the dev panel's overrides: time, weather, season and the next catch (never set in normal play)
  p.debug = { hour: null, weather: null, season: null, force: null, on: false };

  // ---- rank ----
  let pendingRanks = [];
  p.level = () => levelOf(p.state.rank.xp, T);
  p.xp = (amount, source = '', { silent = false } = {}) => {
    if (!(amount > 0)) return { gained: 0, bonus: 0, levelsGained: [] };
    p.noteProgress();
    const restedBefore = p.state.rested.pool;
    const r = addXp(p.state, amount, T);
    if (r.bonus > 0 && restedBefore > 0 && p.state.rested.pool <= 0) p.telemetry.track('rested_consumed', {});
    if (!silent) p.queue.push({ kind: 'xp', amount: r.gained, bonus: r.bonus, label: source, xpAfter: r.totalAfter });
    pendingRanks.push(...r.levelsGained);
    if (!silent) p.flushRankUps();
    return r;
  };
  // small steady trickles (map chunks, forage) gather into one pop instead of a pop each
  let quiet = { xp: 0, label: '' };
  p.xpQuiet = (amount, label = '') => {
    quiet.xp += amount;
    quiet.label = label;
    if (quiet.xp >= (T.quietXp ?? 6)) p.flushQuiet();
  };
  p.flushQuiet = () => {
    if (quiet.xp <= 0) return null;
    const amt = quiet.xp;
    quiet = { xp: 0, label: '' };
    return p.xp(amt, 'explore');
  };
  p.flushRankUps = () => {
    const levels = pendingRanks;
    pendingRanks = [];
    levels.forEach((L) => {
      const got = grant(p, rankRewards(L), T);
      if (got.some((g) => g.unlock?.startsWith('boat:'))) p.telemetry.once('traversal_unlock', { rank: L });
      const lv = p.level();
      p.telemetry.track('rank_up', { rank: L, minutes: p.telemetry.playMinutes(), sinceInstall: p.telemetry.minutesSinceInstall() });
      p.state.telemetry.rankMinutes[L] = p.telemetry.playMinutes();
      p.queue.push({ kind: 'rank', level: L, rank: Math.min(L, T.rank.max), renown: Math.max(0, L - T.rank.max), label: L > T.rank.max ? `Renown ${L - T.rank.max}` : `Rank ${L}`, rewards: got, major: isMajor(L), next: nextPreview(L + 1), pctNext: lv.pct });
      bus.emit('RANK_UP', { rank: L });
    });
    if (levels.length) p.store.commit();
  };
  const nextPreview = (L) => {
    const rw = rankRewards(L);
    const first = rw.map(describe).find((d) => d.text) || { icon: 'note', text: '' };
    return { level: L, label: L > T.rank.max ? `Renown ${L - T.rank.max}` : `Rank ${L}`, icon: first.icon, text: rw.map((r) => describe(r).text).join(' + '), major: isMajor(L) };
  };
  p.nextRank = () => nextPreview(p.level().level + 1);

  // ---- skills ----
  let pendingSkills = new Map();
  p.skill = (id) => skillLevel(id, p.state.skills[id] || 0, T);
  p.skillXp = (id, amount, { silent = false } = {}) => {
    if (!SKILLS[id] || !(amount > 0)) return null;
    p.noteProgress();
    const r = addSkillXp(p.state, id, amount, T);
    const cur = pendingSkills.get(id);
    pendingSkills.set(id, { before: cur ? cur.before : r.before, levelsGained: [...(cur?.levelsGained || []), ...r.levelsGained], after: r.after });
    if (!silent) p.flushSkillBars();
    return r;
  };
  p.flushSkillBars = () => {
    const batch = pendingSkills;
    pendingSkills = new Map();
    batch.forEach((v, id) => {
      v.levelsGained.forEach((level) => {
        const row = SKILLS[id].levels[level - 1];
        const got = grant(p, [row.reward].filter((x) => x && Object.keys(x).length), T);
        if (row.reward?.title) p.state.market.owned['title:' + row.reward.title] = true;
        bus.emit('SKILL_UP', { skill: id, level });
        p.queue.push({ kind: 'skill', skill: id, name: SKILLS[id].name, icon: SKILLS[id].icon, level, up: true, perk: row.perk ? { label: row.label, text: row.text } : null, rewards: got });
      });
      if (!v.levelsGained.length) p.queue.push({ kind: 'skill', skill: id, name: SKILLS[id].name, icon: SKILLS[id].icon, level: v.after.level, pct: v.after.pct, up: false });
    });
  };

  // ---- grants (the single path for paying out) ----
  p.grant = (rewards) => grant(p, rewards, T);

  // ---- modules ----
  p.use = (mod) => {
    mod.install(p);
    if (mod.name) p.mods[mod.name] = mod;
    return p;
  };

  // ---- session ----
  p.start = () => {
    const s = p.state;
    const now = clock.now();
    clock.setLast(s.lastSeenAt || 0);
    if (!s.installAt) {
      s.installAt = now;
      p.telemetry.track('install', {});
    }
    if (!s.journal.endowed) endow(p);
    const awayMs = s.lastSeenAt ? Math.max(0, now - s.lastSeenAt) : 0;
    p.away = { ms: awayMs, rested: s.sessions > 0 ? creditAway(s, awayMs, T) : 0 };
    s.sessions += 1;
    s.lastSeenAt = now;
    p.ready = true;
    bus.emit('SESSION_START', { away: p.away });
    p.telemetry.track('session_start', { n: s.sessions, awayH: Math.round(awayMs / 360000) / 10 });
    store.commit();
    return p;
  };
  p.tick = (dtMs) => {
    const s = p.state;
    s.playMs += dtMs;
    s.lastSeenAt = clock.now();
    p.idleMs += dtMs;
    bus.emit('SESSION_TICK', { dtMs });
  };
  p.end = () => {
    p.state.lastSeenAt = clock.now();
    bus.emit('SESSION_END', {});
    p.telemetry.track('session_end', { lastAction: p.state.telemetry.lastAction });
    store.commit();
  };

  // always-on modules
  modules.forEach((m) => p.use(m));
  return p;
}

export { rankLabel, xpToNext, defaults };
