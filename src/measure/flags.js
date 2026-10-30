// Feature flags for comparing builds (docs/progression/). Everything defaults to ON, so a
// normal player sees no difference. Node-safe: the sims and tests import modules that read these.
//
//   ?progression=off   the strip test: the progression layer (src/progression/) and the older goals
//                      and daily systems go quiet. No rank, XP or skill bars; no goals, goal pill or
//                      nudges; no gold or items for goals, tasks, requests, ranks, hearts, sets or
//                      milestones; no daily gift, wheel, tasks, streak, calendar, away letter or event
//                      track; no unlock pacing (every rod, boat, region, gear, perk, dig tool and the
//                      metal detector from the start); no celebration cards. The bare activities stay:
//                      fishing with its reel and species, digging, talking, sailing, the museum.
//   ?flags=-goals,-daily   switch single systems off (names in SYSTEMS); +name switches one back on.
//   ?progression=on    clears a saved setting.
//
// A setting given in the link is remembered on this phone (`curation.buildflags`), so a
// playtester's build stays the same across reloads until it is cleared.
import { load, save } from '../storage.js';

const KEY = 'curation.buildflags'; // { off: bool, flags: { name: bool } }

/** The systems a build can switch off one by one. */
export const SYSTEMS = {
  rank: 'rank, XP and skill levels: their bars, pops and ceremonies (they still count, unseen)',
  goals: 'the goals list, the goal pill, the Goals tab and stuck nudges',
  payouts: 'gold and items for goals, tasks, requests, ranks, skill levels, hearts, sets and milestones',
  daily: 'the daily gift, wheel, tasks, streak, login calendar, away letter and event track',
  unlocks: 'unlock pacing: rods, boats, regions, gear, perks, dig tools and the metal detector',
  fanfare: 'celebration cards, confetti, journal stamps and "New!" badges (the catch card stays)',
};

// Systems a single test can switch off that the strip test leaves on (they are content, not the layer):
//   ?flags=-variants   no colour variants roll (H9)
export const EXTRAS = { variants: 'colour variants (golden, albino, ghost)' };

// Which flag hides each kind of card in the progression layer's reward queue (src/progression/rewardqueue.js).
const QUEUE_KIND = { xp: 'rank', rank: 'rank', skill: 'rank', task: 'daily', streak: 'daily', away: 'daily', request: 'payouts', heart: 'payouts', item: 'payouts', milestone: 'fanfare', species: 'fanfare', variant: 'fanfare', unlock: 'fanfare' }; // a sale's receipt ('gold') always shows
/** Should the reward queue show a card of this kind in this build? */
export const queueShows = (kind) => !QUEUE_KIND[kind] || flagOn(QUEUE_KIND[kind]);

const search = () => (typeof location !== 'undefined' ? location.search : '');

function fromLink() {
  const p = new URLSearchParams(search());
  const out = {};
  const prog = p.get('progression');
  if (prog === 'off') out.off = true;
  if (prog === 'on') out.clear = true;
  const flags = p.get('flags');
  if (flags) {
    out.flags = {};
    flags.split(',').forEach((f) => {
      const name = f.replace(/^[+-]/, '').trim();
      if (SYSTEMS[name] || EXTRAS[name]) out.flags[name] = !f.startsWith('-');
    });
  }
  return out;
}

let cached = null;
/** The current settings: { off, flags }. Read once per page; a link overrides and is saved. */
export function settings() {
  if (cached) return cached;
  const link = fromLink();
  let s = load(KEY, { off: false, flags: {} });
  if (link.clear) s = { off: false, flags: {} };
  if (link.off) s = { ...s, off: true };
  if (link.flags) s = { ...s, flags: { ...s.flags, ...link.flags } };
  if (link.clear || link.off || link.flags) save(KEY, s);
  cached = { off: !!s.off, flags: { ...(s.flags || {}) } };
  return cached;
}
/** Forget the cached read (tests). */
export const resetFlags = () => (cached = null);

export const progressionOff = () => settings().off;
/** Is one system on? Off when the whole layer is off, unless the link switched it back on by name. */
export function flagOn(name) {
  const s = settings();
  if (name in s.flags) return s.flags[name];
  return EXTRAS[name] ? true : !s.off;
}
/** Every unlock open from the start (the strip test). */
export const unlockAll = () => !flagOn('unlocks');

/** The build's label for logs and telemetry: "on", "off" or "on-goals,-daily". */
export function buildLabel() {
  const s = settings();
  const changed = Object.entries(s.flags).filter(([k, v]) => v !== (EXTRAS[k] ? true : !s.off));
  return (s.off ? 'off' : 'on') + (changed.length ? ':' + changed.map(([k, v]) => (v ? '+' : '-') + k).join(',') : '');
}
