// Goals: a short list of things to do next, each with a gold reward. Three
// are shown at a time; finish one to claim it and the next appears.
import { load, save } from './decor.js';

const KEY = 'curation.quests'; // { claimed: { id: true }, stats: { placed, collected } }

const goal = (key, n) => ({ check: (c) => c[key] >= n, progress: (c) => [Math.min(c[key], n), n] });
export const QUESTS = [
  { id: 'clean', title: 'Spring cleaning', text: 'Clean every crack, stain and cobweb in the entrance', reward: 50, check: (c) => c.entranceClean },
  { id: 'hall', title: 'Grand opening', text: 'Open the main hall through the double doors', reward: 100, check: (c) => c.hallOpen },
  { id: 'hang5', title: 'Curator’s eye', text: 'Have 5 paintings on display', reward: 80, ...goal('paintings', 5) },
  { id: 'decor3', title: 'Make it cozy', text: 'Place 3 decor items with the hammer', reward: 60, ...goal('placed', 3) },
  { id: 'meet1', title: 'A famous face', text: 'Talk to a famous visitor in the main hall', reward: 60, ...goal('met', 1) },
  { id: 'janitor', title: 'Spotless', text: 'Hire a janitor (Customize → This room)', reward: 80, ...goal('janitors', 1) },
  { id: 'build1', title: 'Expansion', text: 'Build a new room through the main hall’s middle arch', reward: 150, ...goal('rooms', 3) },
  { id: 'collect500', title: 'Coin collector', text: 'Collect 500 gold from coin spots', reward: 100, ...goal('collected', 500) },
  { id: 'rating3', title: 'Three stars', text: 'Reach a museum rating of ★3', reward: 150, check: (c) => c.rating >= 3, progress: (c) => [Math.min(c.rating, 3).toFixed(1), 3] },
  { id: 'office', title: 'Moving up', text: 'Upgrade the Curator’s Office at the ticket desk', reward: 200, ...goal('office', 2) },
  { id: 'meet5', title: 'Name dropper', text: 'Meet 5 famous visitors', reward: 150, ...goal('met', 5) },
  { id: 'hang15', title: 'Full walls', text: 'Have 15 paintings on display', reward: 250, ...goal('paintings', 15) },
  { id: 'guide', title: 'Right this way', text: 'Hire a tour guide at the staff board', reward: 150, ...goal('guides', 1) },
  { id: 'cameras', title: 'Eyes everywhere', text: 'Install security cameras (ask the guard)', reward: 120, check: (c) => c.cameras },
  { id: 'income200', title: 'Thriving', text: 'Earn 200 gold an hour', reward: 300, ...goal('income', 200) },
  { id: 'decor15', title: 'Interior designer', text: 'Place 15 decor items', reward: 300, ...goal('placed', 15) },
  { id: 'rooms6', title: 'Wing by wing', text: 'Have 6 rooms', reward: 400, ...goal('rooms', 6) },
  { id: 'meetAll', title: 'Hall of fame', text: 'Meet every famous visitor', reward: 1000, check: (c) => c.met >= c.famous, progress: (c) => [c.met, c.famous] },
  { id: 'rating45', title: 'World class', text: 'Reach a museum rating of ★4.5', reward: 800, check: (c) => c.rating >= 4.5, progress: (c) => [Math.min(c.rating, 4.5).toFixed(1), 4.5] },
];
const state = () => ({ claimed: {}, stats: {}, ...load(KEY, {}) });

export function bump(stat, n = 1) {
  const s = state();
  s.stats = { ...s.stats, [stat]: (s.stats[stat] || 0) + n };
  save(KEY, s);
}
export const stat = (name) => state().stats[name] || 0;

// The goals on show: the first three not yet claimed.
export function activeQuests(ctx) {
  const { claimed } = state();
  return QUESTS.filter((q) => !claimed[q.id])
    .slice(0, 3)
    .map((q) => ({ ...q, done: !!q.check(ctx), at: q.progress?.(ctx) }));
}

export function claim(id) {
  const s = state();
  s.claimed = { ...s.claimed, [id]: true };
  save(KEY, s);
  return QUESTS.find((q) => q.id === id)?.reward || 0;
}

export const claimedCount = () => Object.keys(state().claimed).length;
export const resetQuests = () => save(KEY, {});
