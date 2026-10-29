// Gold coins. Each room earns gold per hour from its paintings and decor;
// the gold piles up in that room (up to 8 hours' worth) until you collect it.
import { load, save } from './storage.js';
import { paintingsFor } from './rooms.js';
import { ITEMS, loadItems } from './items.js';
import { dirtCount, DIRT_PENALTY, guides, GUIDE_BOOST } from './staff.js';
import { museumRating } from './rating.js';
import { displayIncome } from './display.js';
import { famousBoost } from './famous.js';
import { loveBoost } from './love.js';

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

// What a room's income is multiplied by: dirt cuts it, famous visitors raise it.
// Tour guides raise it too, and so does visitor love.
const roomMult = (rooms, i) => (1 - DIRT_PENALTY * dirtCount(rooms, i)) * famousBoost() * (1 + GUIDE_BOOST * guides()) * loveBoost(i);

// Gold per hour from one painting, and from a room's decor (items + coffee).
const artRate = (rooms, i) => PAINTING_INCOME * roomMult(rooms, i);
function decorRate(rooms, i) {
  const items = loadItems(i);
  let gold = 0;
  items.forEach((it) => (gold += ITEMS[it.type]?.income || 0));
  gold += displayIncome(i); // pieces on display earn too
  if (items.some((it) => it.type === 'counter')) gold += coffeeIncome(rooms);
  return gold * roomMult(rooms, i);
}

// Gold per hour earned by one room.
export function roomIncome(rooms, i) {
  return Math.floor(paintingsFor(rooms, i).length * artRate(rooms, i) + decorRate(rooms, i));
}

export function museumIncome(rooms) {
  return rooms.reduce((n, _, i) => n + roomIncome(rooms, i), 0);
}

// Coins pile up in two kinds of spot, each capped at 8 hours' worth:
// in front of every painting (its own earnings) and on a room's decor pad
// (everything else). Stand on a spot to collect it.
// Stored per room: { art: { 'wall:u': { t, b } }, decor: { t, b } }
// where t = last settled (ms) and b = gold banked at that time.
const slotKey = (p) => `${p.wall}:${p.u}`;

function room(i) {
  const r = load(PILES_KEY, {})[i];
  if (!r) return { art: {}, decor: null };
  if (r.t !== undefined) return { art: {}, decor: r }; // older saves: one pile per room
  return { art: r.art || {}, decor: r.decor || null };
}

function saveRoom(i, r) {
  save(PILES_KEY, { ...load(PILES_KEY, {}), [i]: r });
}

const amount = (st, rate, now) => {
  const total = st.b + (Math.max(0, now - st.t) / HOUR) * rate;
  return Math.floor(Math.min(total, Math.max(st.b, OFFLINE_CAP_H * rate)));
};

// A pile starts empty the first time it's seen.
function piles(rooms, i, now) {
  const r = room(i);
  let changed = false;
  if (!r.decor) {
    r.decor = { t: now, b: 0 };
    changed = true;
  }
  paintingsFor(rooms, i).forEach((p) => {
    if (!r.art[slotKey(p)]) {
      r.art[slotKey(p)] = { t: now, b: 0 };
      changed = true;
    }
  });
  if (changed) saveRoom(i, r);
  return r;
}

// Gold waiting in front of a painting.
export function artPile(rooms, i, p, now = Date.now()) {
  return amount(piles(rooms, i, now).art[slotKey(p)], artRate(rooms, i), now);
}

// Gold waiting on a room's decor pad.
export function decorPile(rooms, i, now = Date.now()) {
  return amount(piles(rooms, i, now).decor, decorRate(rooms, i), now);
}

// Everything waiting in a room.
export function pile(rooms, i, now = Date.now()) {
  return decorPile(rooms, i, now) + paintingsFor(rooms, i).reduce((n, p) => n + artPile(rooms, i, p, now), 0);
}

// Bank what a room has earned so far. Call before its income changes, so new
// decor doesn't earn for the hours before it was placed.
export function settle(rooms, i) {
  const now = Date.now();
  const r = piles(rooms, i, now);
  r.decor = { t: now, b: amount(r.decor, decorRate(rooms, i), now) };
  paintingsFor(rooms, i).forEach((p) => (r.art[slotKey(p)] = { t: now, b: amount(r.art[slotKey(p)], artRate(rooms, i), now) }));
  saveRoom(i, r);
}

export function collectArt(rooms, i, p) {
  const n = artPile(rooms, i, p);
  const r = room(i);
  r.art[slotKey(p)] = { t: Date.now(), b: 0 };
  saveRoom(i, r);
  if (n > 0) addCoins(n);
  return n;
}

export function collectDecor(rooms, i) {
  const n = decorPile(rooms, i);
  const r = room(i);
  r.decor = { t: Date.now(), b: 0 };
  saveRoom(i, r);
  if (n > 0) addCoins(n);
  return n;
}

// Every spot in every open room (after watching an ad).
export function collectAll(rooms) {
  let n = 0;
  rooms.forEach((rm, i) => {
    if (rm.locked) return;
    n += collectDecor(rooms, i);
    paintingsFor(rooms, i).forEach((p) => (n += collectArt(rooms, i, p)));
  });
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
