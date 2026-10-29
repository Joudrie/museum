// The daily streak, the login calendar and Streak Shields. Absence is welcomed, never punished:
//   - a missed day does not reset the streak if you hold a shield (earned: one per completed week, hold two);
//   - a broken streak drops to the last milestone (7, 14, 30 …), never to zero;
//   - the 7-day login calendar only advances when you claim, so a missed day pauses it.
import { COSMETICS, grant } from './grants.js';

export function installStreak(p) {
  const { bus, T } = p;
  const S = () => p.state.streak;
  const milestoneFor = (n) => [...T.streak.milestones].reverse().find((m) => m <= n) || 0;

  function visit() {
    const s = S();
    const today = p.today();
    if (s.lastDay === today) return;
    if (!s.lastDay) s.count = 1;
    else {
      let missed = today - s.lastDay - 1;
      if (missed <= 0) s.count += 1;
      else {
        while (missed > 0 && s.shields > 0) {
          s.shields -= 1;
          s.protected += 1;
          missed -= 1;
          p.telemetry.track('streak_saved', { count: s.count });
        }
        if (missed <= 0) {
          s.count += 1;
          p.queue.push({ kind: 'streak', title: 'A shield kept your streak', sub: `${s.count} days. Shields left: ${s.shields}.` });
        } else {
          const to = Math.max(1, milestoneFor(s.count));
          s.broke += 1;
          p.telemetry.track('streak_broken', { from: s.count, to });
          s.count = to;
          p.queue.push({ kind: 'streak', title: 'Welcome back', sub: `Your streak is ${to} days. Nothing is lost.` });
        }
      }
    }
    s.lastDay = today;
    s.best = Math.max(s.best, s.count);
    if (s.count > 0 && s.count % T.streak.shieldEvery === 0 && s.shields < T.streak.shieldsMax) {
      s.shields += 1;
      p.queue.push({ kind: 'streak', title: `${s.count}-day streak`, sub: 'You earned a Streak Shield. It protects one missed day.', rewards: [{ icon: 'unlock', text: 'Streak Shield' }] });
    }
    p.store.commit();
  }
  bus.on('SESSION_START', visit);
  bus.on('DAY_ROLLED', visit);

  const rewardFor = (day) => {
    if (day < 6) return [{ gold: T.login.gold[day] }];
    // day seven: a cosmetic box, never random money
    const pool = Object.entries(COSMETICS).filter(([id, c]) => c.source === 'shop' && c.rarity <= 3 && !p.state.market.owned[id]).map(([id]) => id);
    const pick = pool.length ? pool[p.rngFor(`box:${p.today()}`).int(pool.length)] : null;
    return [{ gold: 150 }, ...(pick ? [{ cosmetic: pick }] : [{ bait: ['goldenfly', 2] }])];
  };

  const mod = {
    name: 'streak',
    install() {},
    state: () => ({ ...S(), canClaim: S().cycleClaimedDay !== p.today() }),
    calendar: () => Array.from({ length: T.streak.calendarDays }, (_, i) => ({ day: i + 1, done: i < S().cycleDay, next: i === S().cycleDay, rewards: i === S().cycleDay || i >= S().cycleDay ? rewardFor(i) : [] })),
    claim() {
      const s = S();
      if (s.cycleClaimedDay === p.today()) return null;
      const got = grant(p, rewardFor(s.cycleDay), T);
      s.cycleClaimedDay = p.today();
      s.cycleDay = (s.cycleDay + 1) % T.streak.calendarDays;
      p.queue.push({ kind: 'streak', title: s.cycleDay === 0 ? 'Week complete' : `Day ${s.cycleDay} of ${T.streak.calendarDays}`, sub: 'Login calendar', rewards: got });
      p.store.commit();
      return got;
    },
  };
  p.mods.streak = mod;
  p.streak = mod;
}
