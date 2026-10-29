// Player rank: the account spine. Levels 1 to 50 are Ranks; after that every
// level is a Renown level (a small cosmetic token), so XP never stops mattering.
// Rested XP: time away fills a pool that doubles XP while it lasts.
import { TUNING } from './config.js';

/** XP from level n to level n + 1. */
export function xpToNext(n, T = TUNING) {
  const { A, B, max, renownXp } = T.rank;
  const curve = (k) => Math.round(A * Math.pow(k, 1.6) + B);
  return n >= max ? renownXp ?? curve(max) : curve(n); // Renown levels cost what rank 50 costs, unless config says otherwise
}

const cache = new Map();
/** Total XP needed to reach level L (level 1 is 0). */
export function cumXp(L, T = TUNING) {
  const key = `${T.rank.A}:${T.rank.B}:${T.rank.max}:${T.rank.renownXp}`; // (the table is rebuilt when the tuning changes)
  let table = cache.get(key);
  if (!table) cache.set(key, (table = [0, 0]));
  for (let i = table.length; i <= L; i++) table[i] = table[i - 1] + xpToNext(i - 1, T);
  return table[L];
}

/** Where a total XP sits: { level, rank (1..50), renown, into, need, pct }. */
export function levelOf(totalXp, T = TUNING) {
  let L = 1;
  // fast path with a doubling search, then step
  let hi = 2;
  while (cumXp(hi, T) <= totalXp) hi *= 2;
  let lo = Math.max(1, hi / 2);
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cumXp(mid, T) <= totalXp) lo = mid;
    else hi = mid;
  }
  L = lo;
  const into = totalXp - cumXp(L, T);
  const need = xpToNext(L, T);
  return { level: L, rank: Math.min(L, T.rank.max), renown: Math.max(0, L - T.rank.max), into, need, pct: Math.min(100, (100 * into) / need) };
}

export const rankLabel = (lv) => (lv.renown ? `Renown ${lv.renown}` : `Rank ${lv.rank}`);

/**
 * Adds XP to the state. Rested XP doubles up to what is in the pool.
 * Returns { gained, bonus, levelsGained: [level…], before, after }.
 */
export function addXp(state, amount, T = TUNING) {
  const base = Math.max(0, Math.round(amount));
  const before = levelOf(state.rank.xp, T);
  const bonus = Math.min(state.rested.pool, base * (T.rested.mult - 1));
  state.rested.pool -= bonus;
  const gained = base + bonus;
  state.rank.xp += gained;
  const after = levelOf(state.rank.xp, T);
  const levelsGained = [];
  for (let l = before.level + 1; l <= after.level; l++) levelsGained.push(l);
  return { gained, base, bonus, levelsGained, before, after, totalAfter: state.rank.xp };
}

/** The most rested XP the pool can hold: one level's worth. */
export const restedCap = (state, T = TUNING) => xpToNext(levelOf(state.rank.xp, T).level, T);

/**
 * Credits time away. Called once per return with the milliseconds since the
 * last session ended. Capped at maxOfflineHours, and at a level's worth of XP.
 */
export function creditAway(state, awayMs, T = TUNING) {
  const hours = Math.min(T.rested.maxOfflineHours, Math.max(0, awayMs) / 3600e3);
  if (hours < T.rested.minAwayHours) return 0;
  const cap = restedCap(state, T);
  const per = cap / T.rested.fullAfterHours; // fills a level's worth in `fullAfterHours`
  const before = state.rested.pool;
  state.rested.pool = Math.min(cap, state.rested.pool + hours * per);
  return Math.round(state.rested.pool - before);
}
