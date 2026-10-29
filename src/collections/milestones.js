// Codex milestones: reach 10 / 25 / 50 / 75 / 100% of everything the museum
// can hold and each one pays out once. "Reached" counts what the codex has ever
// stamped, so selling a piece never takes a milestone away. Pure data and
// maths (no page), so tests can run it in Node.
import { list, collections } from './index.js';
import { CODEX_KEY, snapshot } from './codex.js';
import { save } from '../storage.js';

export const MILESTONES = [
  { pct: 10, gold: 500 },
  { pct: 25, gold: 1500 },
  { pct: 50, gold: 5000 },
  { pct: 75, gold: 12000 },
  { pct: 100, gold: 50000 },
];
export const milestoneId = (pct) => `milestone-${pct}`;

/** { have, total, pct } over every collectable entry, or for one collection. */
export function completion(c = snapshot(), collectionId) {
  const entries = list(collectionId ? { collection: collectionId } : {});
  const have = entries.filter((e) => c.seen[e.id]).length;
  const total = entries.length;
  return { have, total, pct: total ? Math.floor((100 * have) / total) : 0 };
}

/** Each milestone with whether it is reached and whether it is already paid. */
export function milestones(c = snapshot()) {
  const { pct } = completion(c);
  return MILESTONES.map((m) => ({ ...m, id: milestoneId(m.pct), reached: pct >= m.pct, claimed: !!c.claimed[milestoneId(m.pct)] }));
}

/** Pays a reached milestone once. Returns the gold to hand over (0 if not reached or already paid). */
export function claimMilestone(pct) {
  const c = snapshot();
  const m = milestones(c).find((x) => x.pct === pct);
  if (!m || !m.reached || m.claimed) return 0;
  c.claimed[m.id] = true;
  save(CODEX_KEY, c);
  return m.gold;
}

/** Per collection: ever collected, held now. People and one-offs aside, this is the codex page. */
export function breakdown(c = snapshot()) {
  return collections().map((col) => {
    const entries = list({ collection: col.id });
    return {
      collection: col,
      ...completion(c, col.id),
      held: col.ownership === 'all' ? entries.length : entries.filter((e) => (c.owned[e.id] || 0) > 0).length,
    };
  });
}
