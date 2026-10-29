// The story engine: tells the next chapter of an arc or visitor chain when its condition is
// met. Data lives in src/stories/. State is one save key; leads are handed to Chat 7 through
// `curation.leads_offered` (see docs/HANDOFF.md, "Story and leads").
import { load, save } from './storage.js';
import { HEIST } from './stories/heist.js';
import { CHAINS } from './stories/chains.js';

const KEY = 'curation.story'; // { done: { beatId: true } }
const LEADS = 'curation.leads_offered'; // [{ id, text, from, at }]

const state = () => ({ done: {}, ...load(KEY, {}) });
export const isDone = (id) => !!state().done[id];
export const storyDone = () => Object.keys(state().done).length;

// The next beat that is unlocked and not yet told, in order, for one arc or one visitor chain.
function nextIn(beats, ctx) {
  const next = beats.find((b) => !isDone(b.id));
  return next && next.needs(ctx) ? next : null;
}

// Edmund's turn: the heist arc.
export const heistBeat = (ctx) => nextIn(HEIST.beats, ctx);
// A famous visitor's turn.
export const chainStep = (visitorId, ctx) => (CHAINS[visitorId] ? nextIn(CHAINS[visitorId].steps, ctx) : null);
// What a visitor still wants from you (shown once their next step is locked).
export const chainAsk = (visitorId) => {
  const next = CHAINS[visitorId]?.steps.find((b) => !isDone(b.id));
  return next ? next.ask : null;
};

export function offerLead(lead, from) {
  if (!lead) return;
  const list = load(LEADS, []);
  if (list.some((l) => l.id === lead.id)) return;
  save(LEADS, [...list, { id: lead.id, text: lead.text, from, at: Date.now() }]);
}

// Mark a beat told; returns the gold reward (0 if none) and offers its lead.
export function complete(beat, from) {
  const s = state();
  if (s.done[beat.id]) return 0;
  save(KEY, { ...s, done: { ...s.done, [beat.id]: true } });
  offerLead(beat.lead, from);
  return beat.reward || 0;
}

export const leadsOffered = () => load(LEADS, []);
export const resetStory = () => {
  save(KEY, {});
  save(LEADS, []);
};
