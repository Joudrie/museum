// Visitor love: every heart a visitor shows in a room adds a little love,
// which fades over time. A loved room earns up to +10%.
import { load, save } from './storage.js';

const LOVE_KEY = 'curation.love'; // { [roomIndex]: { n, t } }
const FADE = 10 * 60 * 1000; // one heart fades every 10 minutes
const MAX = 30;

export function loveOf(i, now = Date.now()) {
  const l = load(LOVE_KEY, {})[i];
  return l ? Math.max(0, l.n - (now - l.t) / FADE) : 0;
}

export function addLove(i) {
  save(LOVE_KEY, { ...load(LOVE_KEY, {}), [i]: { n: Math.min(MAX, loveOf(i) + 1), t: Date.now() } });
}

export const loveBoost = (i) => 1 + Math.min(20, loveOf(i)) * 0.005;
export const resetLove = () => save(LOVE_KEY, {});
