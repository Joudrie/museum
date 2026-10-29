// Selling, buy-back and the Gallery Shop, all through the codex.
//
//   sell:      you get 50% of a piece's price. It leaves your hands (the codex keeps its stamp).
//   buy-back:  a week after you sold it, you may buy it back for 75% of its price (a premium over what you got).
//   Gallery Shop: 3 to 5 pieces, the same for everyone on a given day and new each day, at 150% of price.
//              Only pieces you don't hold are for sale, so you can own *the* one of anything, and a piece you sold
//              goes back in the pool. Crates, gems and ads are ON HOLD: nothing here is a random draw.
//
// The money is passed in (`wallet: { add(n), spend(n) -> bool }`), so this file never touches the page and tests
// can run it in Node. Paintings are held from the start today (collection ownership 'all'), so they have nothing to
// sell or buy until a collection is switched to 'earned'; then they flow through here with no change.
import { list, get, collectionOf } from './index.js';
import { acquire, displayCount, restockSold, sellOne, snapshot } from './codex.js';

export const PRICES = [0, 40, 120, 400, 1500]; // by rarity; an entry's own `price` wins
export const SELL_RATE = 0.5;
export const BUYBACK_RATE = 0.75;
export const SHOP_RATE = 1.5;
export const COOLDOWN_MS = 7 * 24 * 3600 * 1000;
export const STOCK_MIN = 3;
export const STOCK_MAX = 5;

const R = (n) => Math.max(1, Math.round(n));
export const basePrice = (e) => e.price ?? PRICES[e.rarity ?? 1];
export const sellPrice = (e) => R(basePrice(e) * SELL_RATE);
export const buybackPrice = (e) => R(basePrice(e) * BUYBACK_RATE);
export const shopPrice = (e) => R(basePrice(e) * SHOP_RATE);

/** Pieces you could sell now: held, restored and not on display. Each is { entry, n }. */
export function sellable(c = snapshot(), shown = () => 0) {
  return list()
    .filter((e) => collectionOf(e)?.ownership === 'earned' && !collectionOf(e).people)
    .map((e) => ({ entry: e, n: Math.max(0, displayCount(e.id, c) - shown(e.id)) }))
    .filter((r) => r.n > 0);
}

/** Sells one piece. Returns { ok, gold } or { ok: false, why }. `shown(id)` says how many are on display. */
export function sell(id, wallet, shown = () => 0, now = Date.now()) {
  const e = get(id);
  const c = snapshot();
  if (!e || collectionOf(e)?.ownership !== 'earned') return { ok: false, why: 'This one can’t be sold.' };
  if (displayCount(id, c) <= 0) return { ok: false, why: c.owned[id] ? 'Restore it first, then it can be sold.' : 'You don’t have one.' };
  if (displayCount(id, c) - shown(id) <= 0) return { ok: false, why: 'Take it off display first.' };
  if (!sellOne(id, now)) return { ok: false, why: 'You don’t have one.' };
  wallet.add(sellPrice(e));
  return { ok: true, gold: sellPrice(e) };
}

/** What you sold and can buy back: { entry, n, at, opens, ready, price }. */
export function buybacks(c = snapshot(), now = Date.now()) {
  return Object.entries(c.sold)
    .map(([id, r]) => ({ entry: get(id), n: r.n, at: r.at, opens: r.at + COOLDOWN_MS, ready: now >= r.at + COOLDOWN_MS }))
    .filter((r) => r.entry)
    .map((r) => ({ ...r, price: buybackPrice(r.entry) }));
}

export function buyBack(id, wallet, now = Date.now()) {
  const r = buybacks(snapshot(), now).find((x) => x.entry.id === id);
  if (!r) return { ok: false, why: 'You haven’t sold that.' };
  if (!r.ready) return { ok: false, why: 'Not for sale again yet.' };
  if (!wallet.spend(r.price)) return { ok: false, why: 'Not enough gold.' };
  restockSold(id);
  return { ok: true, gold: r.price };
}

// ---------- the Gallery Shop ----------
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
const rng = (seed) => {
  let a = hash(seed);
  return () => ((a = (Math.imul(a ^ (a >>> 15), a | 1) ^ (a + Math.imul(a ^ (a >>> 7), a | 61))) >>> 0) / 4294967296);
};
export const dayKey = (now = Date.now()) => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/** Seconds-free: when today's stock turns over (local midnight). */
export const nextRefresh = (now = Date.now()) => {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
};

/** Everything the shop could ever offer: earned, collectable, not a person, not the rarest, and not live fish (those you catch yourself). */
const eligible = () => list().filter((e) => collectionOf(e)?.ownership === 'earned' && !collectionOf(e).people && collectionOf(e).display !== 'tank' && (e.rarity ?? 1) <= 3);

/** Today's pieces (3 to 5, the same all day, whoever is looking), with an `owned` flag so the shelf can show a gap. */
export function shelf(now = Date.now(), c = snapshot()) {
  const day = dayKey(now);
  const rand = rng(`gallery-shop:${day}`);
  const pool = eligible().sort((a, b) => (a.id < b.id ? -1 : 1));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = STOCK_MIN + Math.floor(rand() * (STOCK_MAX - STOCK_MIN + 1));
  return pool.slice(0, count).map((e) => ({ entry: e, price: shopPrice(e), owned: (c.owned[e.id] || 0) > 0 }));
}

export function buy(id, wallet, now = Date.now()) {
  const row = shelf(now).find((r) => r.entry.id === id);
  if (!row) return { ok: false, why: 'That isn’t on the shelf today.' };
  if (row.owned) return { ok: false, why: 'You already have it.' };
  if (!wallet.spend(row.price)) return { ok: false, why: 'Not enough gold.' };
  acquire(id, now);
  return { ok: true, gold: row.price };
}
