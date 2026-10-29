// Time for the progression layer. The day starts at 4:00 local. The clock can
// be injected (tests, the sim, the debug panel), and it never runs backwards:
// if the device clock is set back we keep using the last time we saw, so a
// daily reset can't be granted twice.
import { TUNING } from './config.js';

const DAY = 864e5;

export const dayOf = (ms, startHour = TUNING.dayStartHour) => {
  const d = new Date(ms - startHour * 3600e3);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
};
// weeks run Monday to Sunday; day 0 (1970-01-01) was a Thursday
export const weekOf = (day) => Math.floor((day + 3) / 7);
export const weekdayOf = (day) => (day + 3) % 7; // 0 Monday … 6 Sunday
export const isWeekend = (day) => weekdayOf(day) >= 5;
// ms until the next 4:00
export const msToReset = (ms, startHour = TUNING.dayStartHour) => {
  const d = new Date(ms);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate(), startHour, 0, 0, 0);
  if (next <= d) next.setDate(next.getDate() + 1);
  return next - d;
};
export const monthOf = (ms) => {
  const d = new Date(ms);
  return d.getFullYear() * 12 + d.getMonth();
};

export function createClock({ now = () => Date.now(), lastSeen = 0 } = {}) {
  let last = lastSeen;
  let rolledBack = false;
  let skew = 0; // the debug panel moves time forward with this
  const clock = {
    /** Never earlier than the last time we saw. */
    now() {
      const raw = now() + skew;
      if (raw < last - TUNING.clockSlackMs) rolledBack = true;
      last = Math.max(last, raw);
      return last;
    },
    day: () => dayOf(clock.now()),
    week: () => weekOf(clock.day()),
    get rolledBack() {
      return rolledBack;
    },
    get last() {
      return last;
    },
    advance(ms) {
      skew += ms;
    },
    setLast(ms) {
      last = Math.max(last, ms);
    },
  };
  return clock;
}
