// Local telemetry: a ring buffer of named events with small payloads, plus
// first-time stamps in the save. Nothing leaves the device unless a `sink`
// function is supplied (a real backend would hand one in). Names follow
// docs/PROGRESSION.md section 20.
import { TUNING } from './config.js';

export const TELEMETRY_EVENTS = [
  'install', 'session_start', 'session_end', 'rank_up', 'first_catch', 'species_discovered', 'journal_pct', 'heart_up',
  'task_complete', 'streak_saved', 'streak_broken', 'rested_consumed', 'paywall_view', 'sub_start', 'sub_cancel', 'last_action',
  'goal_pinned', 'goal_completed', 'traversal_unlock', 'hotspot_cast', 'legend_caught', 'purchase', 'event_joined',
];

export function createTelemetry(p, sink = null) {
  const events = [];
  const t = {
    events,
    track(name, props = {}) {
      if (!TELEMETRY_EVENTS.includes(name)) console.warn('[telemetry] unknown event', name);
      const row = { t: p.clock.now(), name, props };
      events.push(row);
      if (events.length > TUNING.telemetryMax) events.shift();
      p.state.telemetry.lastAction = name;
      try {
        sink?.(row);
      } catch {
        // a broken sink never breaks the game
      }
      return row;
    },
    /** Fires the first time only (first_catch, first heart …). */
    once(name, props) {
      if (p.state.telemetry.first[name]) return null;
      p.state.telemetry.first[name] = p.clock.now();
      (p.state.telemetry.firstPlayMin ||= {})[name] = t.playMinutes();
      return t.track(name, props);
    },
    count: (name) => events.filter((e) => e.name === name).length,
    minutesSinceInstall: () => Math.round((p.clock.now() - p.state.installAt) / 60000),
    playMinutes: () => Math.round((p.state.playMs / 60000) * 10) / 10,
  };
  return t;
}
