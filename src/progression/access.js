// What the player can reach: islands by traversal rung (rank unlock, then bought), and by subscription
// where that is enforced. One place to ask, so the sail menu, the sim and the validator agree.
import { TUNING } from './config.js';
import { REGIONS } from './species.js';
import { UNLOCK_NAMES } from './grants.js';
import { unlockAll } from '../measure/flags.js';

const BOAT_PRICED = true;

/** { open, reason: 'ok'|'rank'|'buy'|'sub', need? } for a region. */
export function regionAccess(state, id, T = TUNING) {
  const r = REGIONS[id];
  if (!r || unlockAll()) return { open: true, reason: 'ok' }; // (unlockAll: the ?progression=off strip test)
  if (r.tier === 'sub' && T.sub.enforce && !state.sub.active) return { open: false, reason: 'sub', need: 'Subscriber island' };
  if (!r.req) return { open: true, reason: 'ok' };
  if (!state.unlocks[r.req]) return { open: false, reason: 'rank', need: `Needs: ${UNLOCK_NAMES[r.req]?.split(':')[0] || r.req}` };
  if (BOAT_PRICED && r.req.startsWith('boat:') && !state.market.owned[r.req]) return { open: false, reason: 'buy', need: `Buy the ${UNLOCK_NAMES[r.req]?.split(':')[0] || r.req} at the market` };
  return { open: true, reason: 'ok' };
}
export const regionOpen = (state, id, T = TUNING) => regionAccess(state, id, T).open;
export const openRegions = (state, T = TUNING) => Object.keys(REGIONS).filter((id) => regionOpen(state, id, T));
