// The measurement log: one typed list of what happened, in order, with a time, kept on the
// phone. Everything docs/progression/ measures is computed from these events, in the game
// (the log below) and in the analysis scripts (the exported log).
//
// It is not a second gameplay bus. Two sources feed it: src/measure/derive.js watches the
// saves (digs, the codex, rooms, coins…), and index.js listens to the progression layer's
// bus (src/progression/bus.js: catches, talks, places, ranks…). A system that wants to say
// something neither can see may call emit() itself.
import { load, save } from '../storage.js';

/**
 * @typedef {{ t: number, type: string, s: string, [k: string]: any }} GameEvent
 * t: ms since 1970; s: the session id it happened in.
 */

// Every event type, and what kind of moment it is for the reward-density measure:
//   novelty  something the player has never had or seen before
//   progress something that adds to what they have
//   meter    a level, rank or heart count going up
//   payout   an extrinsic reward handed out for a goal (the layer the strip test removes)
//   system   bookkeeping (sessions)
export const TYPES = {
  session_start: 'system', // { source, gapH, n, build }
  session_end: 'system', // { ms, activeMs, reason, last }  (provisional on 'hidden'; the last one per session counts)
  session_resume: 'system', // {}  back within 30 minutes: the same session goes on
  collect: 'progress', // { id, collection, rarity, fresh, n }  (fresh ones count as novelty)
  coins: 'progress', // { delta, balance }
  catch: 'progress', // { sp, r, cls, v, reg, w, perfect, via, bait, hot }  a fish landed (the layer's FISH_CAUGHT)
  escape: 'progress', // { sp, r, cls }  a fish lost in the reel
  junk: 'progress', // {}
  npc_talk: 'progress', // { npc, kind }
  gift_given: 'progress', // { npc, item }
  chunks: 'progress', // { reg, n }  map chunks uncovered
  forage: 'progress', // { item, reg }
  sail: 'progress', // { kind, reg }
  purchase: 'progress', // { item, price, kind }
  place_found: 'novelty', // { reg, place }
  secret_found: 'novelty', // { reg, secret }
  viewpoint: 'novelty', // { reg, id }
  emote_seen: 'progress', // { id }
  rank_up: 'meter', // { rank }  meters: a number that goes up (the layer's rank, skills and hearts)
  skill_up: 'meter', // { skill, level }
  heart_up: 'meter', // { npc, hearts }
  task_done: 'payout', // { id }
  request_done: 'payout', // { npc }
  dig: 'progress', // { spot }
  restored: 'progress', // { id }
  sold: 'progress', // { id }
  talk: 'progress', // { kind, talks }
  guest_gift: 'progress', // { by }
  room_built: 'progress', // { rooms }
  item_placed: 'progress', // { room, n }
  displayed: 'progress', // { fixture, n }
  office_up: 'progress', // { level }
  upgrade: 'progress', // { id, level }
  famous_met: 'novelty', // { id }
  story_beat: 'novelty', // { id }
  lead_found: 'novelty', // { id }
  expedition_done: 'novelty', // { id, n }
  unlock: 'novelty', // { what }  a rod, boat, gear, room, dig tool or the metal detector
  fog_cleared: 'novelty', // { n }
  goal_claimed: 'payout', // { id, gold }
  set_claimed: 'payout', // { id }
  milestone_claimed: 'payout', // { pct }
  daily_gift: 'payout', // { streak }
  wheel_spin: 'payout', // { gold }
  daily_dig_goal: 'payout', // {}
};
export const kindOf = (e) => (e.type === 'collect' && e.fresh ? 'novelty' : TYPES[e.type] || 'other');

const LOG_KEY = 'curation.evlog'; // { v: 1, events: [GameEvent] }, newest last
export const LOG_MAX = 4000; // about 300 KB at most; oldest dropped first
const FLUSH_MS = 15000;

const listeners = new Map();
let pending = [];
let timer = null;
export const session = { id: '', start: 0 };

/** Listen to one type, or '*' for all. Returns a function that stops listening. */
export function on(type, fn) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type).add(fn);
  return () => listeners.get(type)?.delete(fn);
}

/** Record an event. Unknown types are kept (as 'other') so nothing is lost while the list grows. */
export function emit(type, data = {}) {
  const e = { t: Date.now(), type, s: session.id, ...data };
  pending.push(e);
  for (const key of [type, '*'])
    listeners.get(key)?.forEach((fn) => {
      try {
        fn(e);
      } catch {
        // a listener's problem stays its own
      }
    });
  if (!timer && typeof setTimeout !== 'undefined') timer = setTimeout(flush, FLUSH_MS);
  return e;
}

/** Write pending events to the log (batched, so a busy minute is one save, not hundreds). */
export function flush() {
  clearTimeout(timer);
  timer = null;
  if (!pending.length) return;
  const log = load(LOG_KEY, { v: 1, events: [] });
  const events = (Array.isArray(log.events) ? log.events : []).concat(pending);
  pending = [];
  save(LOG_KEY, { v: 1, events: events.slice(-LOG_MAX) });
}

/** Everything recorded on this phone, oldest first (the saved log plus what hasn't been written yet). */
export function events() {
  const log = load(LOG_KEY, { v: 1, events: [] });
  return (Array.isArray(log.events) ? log.events : []).concat(pending);
}
export const isLogKey = (key) => key === LOG_KEY;
export function clearLog() {
  pending = [];
  save(LOG_KEY, { v: 1, events: [] });
}
