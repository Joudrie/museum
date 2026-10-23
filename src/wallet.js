// Gold coins. Each room earns gold per hour from its paintings and decor;
// the gold piles up in that room (up to 8 hours' worth) until you collect it.
import { load, save } from './decor.js';
import { paintingsFor } from './rooms.js';
import { ITEMS, loadItems } from './items.js';
import { dirtCount, DIRT_PENALTY } from './staff.js';
import { museumRating } from './rating.js';
import { famousBoost } from './famous.js';

const COINS_KEY = 'curation.coins';
const PILES_KEY = 'curation.piles'; // { [roomIndex]: { t, b } }

export const START_COINS = 300;
export const PAINTING_INCOME = 5;
export const OFFLINE_CAP_H = 8;
const HOUR = 3600 * 1000;

export function coins() {
  return load(COINS_KEY, START_COINS);
}

export function addCoins(n) {
  save(COINS_KEY, coins() + n);
  window.dispatchEvent(new Event('coins'));
}

// Everything is free while testing: prices still show, nothing is charged.
export const FREE = true;
export const canAfford = (n) => FREE || coins() >= n;

// Spend if we can afford it. Returns true on success.
export function spend(n) {
  if (FREE) return true;
  if (coins() < n) return false;
  addCoins(-n);
  return true;
}

export function resetWallet() {
  save(COINS_KEY, START_COINS);
  save(PILES_KEY, {});
}

// Visitors per month: paintings draw the crowds, decor helps.
export function museumVisitors(rooms) {
  let paintings = 0;
  let decor = 0;
  rooms.forEach((_, i) => {
    paintings += paintingsFor(rooms, i).length;
    loadItems(i).forEach((it) => (decor += ITEMS[it.type]?.income || 0));
  });
  // A well-rated museum draws more people: 0.6x at a score of 0, 1.4x at 100.
  return Math.round((50 + paintings * 150 + decor * 25) * (0.6 + (0.8 * museumRating(rooms)) / 100));
}

// A coffee counter earns 1 gold an hour per 100 monthly visitors.
export const coffeeIncome = (rooms) => Math.round(museumVisitors(rooms) / 100);

// Gold per hour earned by one room (dirt on the floor cuts it).
export function roomIncome(rooms, i) {
  const items = loadItems(i);
  let gold = paintingsFor(rooms, i).length * PAINTING_INCOME;
  items.forEach((it) => (gold += ITEMS[it.type]?.income || 0));
  if (items.some((it) => it.type === 'counter')) gold += coffeeIncome(rooms);
  // Dirt cuts it; every famous visitor you've met raises it.
  return Math.floor(gold * (1 - DIRT_PENALTY * dirtCount(rooms, i)) * famousBoost());
}

export function museumIncome(rooms) {
  return rooms.reduce((n, _, i) => n + roomIncome(rooms, i), 0);
}

// Gold waiting in a room's pile (capped at 8 hours of income).
// A pile is { t: last settled (ms), b: gold banked at that time }.
function pileState(i, now) {
  const piles = load(PILES_KEY, {});
  if (!piles[i]) {
    piles[i] = { t: now, b: 0 }; // a new room starts its pile empty
    save(PILES_KEY, piles);
  }
  return piles[i];
}

export function pile(rooms, i, now = Date.now()) {
  const { t, b } = pileState(i, now);
  const rate = roomIncome(rooms, i);
  const total = b + (Math.max(0, now - t) / HOUR) * rate;
  return Math.floor(Math.min(total, Math.max(b, OFFLINE_CAP_H * rate)));
}

function setPile(i, state) {
  save(PILES_KEY, { ...load(PILES_KEY, {}), [i]: state });
}

// Bank what a room has earned so far. Call before its income changes, so new
// decor doesn't earn for the hours before it was placed.
export function settle(rooms, i) {
  const now = Date.now();
  const total = pile(rooms, i, now);
  setPile(i, { t: now, b: total });
}

export function collect(rooms, i) {
  const n = pile(rooms, i);
  setPile(i, { t: Date.now(), b: 0 });
  if (n > 0) addCoins(n);
  return n;
}

// New rooms cost more each time; bigger rooms cost more.
const SIZE_COST = { short: 1, medium: 1.5, long: 2.2 };
export function roomCost(count, orient, size) {
  const k = SIZE_COST[size] * (orient === 'square' ? 1.8 : 1);
  return Math.round((150 * 1.8 ** (count - 1) * k) / 10) * 10;
}

// Selling an item gives half its price back.
export const sellPrice = (type) => Math.floor(ITEMS[type].price / 2);
