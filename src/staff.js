// Janitors and floor dirt. Rooms slowly collect puddles and litter, and each
// spot cuts that room's income. Each room can have its own janitor (a one-time
// hire, each one costing more than the last) who keeps it spotless; without
// one you mop up yourself.
import { load, save } from './decor.js';

const DIRT_KEY = 'curation.dirt'; // { [roomIndex]: { t: last spawn (ms), spots: [{ id, c, r, kind }] } }
const JANITOR_KEY = 'curation.janitor'; // { [roomIndex]: true } rooms with a janitor
const EVERY = 90 * 60 * 1000; // a new spot every 90 minutes
export const MAX_DIRT = 3;
export const DIRT_PENALTY = 0.1; // each spot: -10% room income

export const janitors = () => Object.values(load(JANITOR_KEY, {})).filter(Boolean).length;
export const covered = (rooms, i) => !!load(JANITOR_KEY, {})[i];
// The next janitor's price: 100, 160, 260, 410, ...
export const janitorCost = () => Math.round((100 * 1.6 ** janitors()) / 10) * 10;

export function hireJanitor(i) {
  save(JANITOR_KEY, { ...load(JANITOR_KEY, {}), [i]: true });
}

export function resetJanitors() {
  save(JANITOR_KEY, {});
}

function state(i) {
  return load(DIRT_KEY, {})[i] || { t: Date.now(), spots: [] };
}

function setState(i, st) {
  save(DIRT_KEY, { ...load(DIRT_KEY, {}), [i]: st });
}

// How dirty a room is right now (including spots not yet placed on the floor).
export function dirtCount(rooms, i, now = Date.now()) {
  if (covered(rooms, i)) return 0;
  const st = load(DIRT_KEY, {})[i];
  if (!st) return 0;
  return Math.min(MAX_DIRT, st.spots.length + Math.floor((now - st.t) / EVERY));
}

// Place any new spots on free floor tiles and return the room's dirt.
// free(c, r) says whether a tile can take a spot.
export function roomDirt(rooms, i, fw, fd, free) {
  const now = Date.now();
  const st = state(i);
  if (covered(rooms, i)) {
    setState(i, { t: now, spots: [] });
    return [];
  }
  let due = Math.floor((now - st.t) / EVERY);
  st.t += due * EVERY;
  for (let tries = 0; due > 0 && st.spots.length < MAX_DIRT && tries < 40; tries++) {
    const c = Math.floor(Math.random() * fw);
    const r = 1 + Math.floor(Math.random() * Math.max(1, fd - 2));
    if (!free(c, r) || st.spots.some((s) => s.c === c && s.r === r)) continue;
    st.spots.push({ id: `${now}-${tries}`, c, r, kind: Math.random() < 0.55 ? 'puddle' : 'litter' });
    due--;
  }
  if (st.spots.length >= MAX_DIRT) st.t = now; // full: start counting again once mopped
  setState(i, st);
  return st.spots;
}

export function removeDirt(i, id) {
  const st = state(i);
  setState(i, { ...st, spots: st.spots.filter((s) => s.id !== id) });
}

export function resetDirt() {
  save(DIRT_KEY, {});
}
