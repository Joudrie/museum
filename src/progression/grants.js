// Applies a reward list to the state. One path for everything that pays out:
// ranks, skill levels, tasks, hearts, milestones, the shop's free items.
import { TUNING } from './config.js';
import { addXp } from './rank.js';
import COSMETICS from './data/cosmetics.json' with { type: 'json' };

export { COSMETICS };

/** Text for a reward: used by the reward cards and the "Next:" preview. */
export function describe(r) {
  if (r.gold) return { icon: 'gold', text: `${r.gold} gold` };
  if (r.bait) return { icon: 'bait', text: `${r.bait[1]} ${r.bait[0]}` };
  if (r.lure) return { icon: 'bait', text: `${r.lure[1]} ${r.lure[0]}` };
  if (r.cosmetic) return { icon: 'cosmetic', text: COSMETICS[r.cosmetic]?.name || r.cosmetic, rarity: COSMETICS[r.cosmetic]?.rarity };
  if (r.title) return { icon: 'title', text: `Title: ${COSMETICS['title:' + r.title]?.name || r.title}`, rarity: COSMETICS['title:' + r.title]?.rarity };
  if (r.unlock) return { icon: 'unlock', text: UNLOCK_NAMES[r.unlock] || r.unlock };
  if (r.recipe) return { icon: 'bait', text: `Recipe: ${r.recipe}` };
  if (r.perk) return { icon: 'unlock', text: r.perk.startsWith('sell') ? `Sell prices +${r.perk.slice(5)}%` : r.perk };
  if (r.xp) return { icon: 'xp', text: `${r.xp} XP` };
  if (r.token) return { icon: 'token', text: `${r.token} Renown token` };
  if (r.note) return { icon: 'note', text: r.note };
  return { icon: 'note', text: '' };
}

export const UNLOCK_NAMES = {
  'rod:cork': 'Cork rod', 'rod:feather': 'Feather rod', 'rod:golden': 'Golden rod', 'rod:glow': 'Glow rod',
  'boat:rowboat': 'Rowboat: the Far Isle and Skull Isle', 'boat:sailboat': 'Sailboat: open sea', 'boat:icehull': 'Ice hull: the Frozen North',
  'gear:boots': 'Snow boots', 'gear:lantern': 'Lantern', 'gear:gloves': 'Climbing gloves',
  'house:aquarium_room': 'Lodge: aquarium room', 'house:workshop': 'Lodge: workshop',
  'area:frozen_north': 'The Frozen North on your chart', 'slot:daily_extra': 'A fourth daily task',
};

/**
 * Pays rewards into the state. `hooks` is the service (gold accessor etc.).
 * Returns the described list so a card can show it.
 */
export function grant(p, rewards, T = TUNING) {
  const s = p.state;
  const out = [];
  (rewards || []).forEach((r) => {
    if (r.gold) p.gold.add(r.gold);
    if (r.bait) s.fish.baits[r.bait[0]] = (s.fish.baits[r.bait[0]] || 0) + r.bait[1];
    if (r.lure) s.fish.lures[r.lure[0]] = (s.fish.lures[r.lure[0]] || 0) + r.lure[1];
    if (r.cosmetic) s.market.owned[r.cosmetic] = true;
    if (r.title) s.market.owned['title:' + r.title] = true;
    if (r.unlock) s.unlocks[r.unlock] = true;
    if (r.recipe) s.unlocks['recipe:' + r.recipe] = true;
    if (r.perk && r.perk.startsWith('sell+')) s.market.sellBonus += Number(r.perk.slice(5)) / 100;
    if (r.token) s.renown.tokens += r.token;
    if (r.xp) p.xp(r.xp, 'reward');
    out.push({ ...r, ...describe(r) });
  });
  return out;
}

export { addXp };
