// The economy: one soft currency (gold), earned by selling fish, requests, tasks and ranks, spent on
// bait, rods, boats, lodge rooms, tanks, furniture, cosmetics and hints. Every source has a sink.
// The price ladder is built from the earn-rate targets in config.js, so the next meaningful purchase
// is always about 20 to 40 minutes of play away. Nothing here is bought with real money.
import { TUNING } from './config.js';
import SHOP from './data/shop.json' with { type: 'json' };
import PROJECTS from './data/projects.json' with { type: 'json' };
import { BAITS, LURES } from './fishroll.js';
import { GIFTS } from './friendship.js';
import { COSMETICS, grant } from './grants.js';
import RODS from './data/rods.json' with { type: 'json' };
import { speciesById } from './species.js';
import { weekOf } from './clock.js';

export { SHOP };

/** Target gold per hour at a rank, interpolated between the config's anchor ranks. */
export function goldPerHour(rank, T = TUNING) {
  const pts = Object.entries(T.economy.goldPerHour).map(([k, v]) => [Number(k), v]).sort((a, b) => a[0] - b[0]);
  if (rank <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++)
    if (rank <= pts[i][0]) {
      const [r0, v0] = pts[i - 1];
      const [r1, v1] = pts[i];
      return v0 + ((v1 - v0) * (rank - r0)) / (r1 - r0);
    }
  return pts[pts.length - 1][1];
}
const nice = (n) => (n < 100 ? Math.round(n / 5) * 5 : n < 1000 ? Math.round(n / 10) * 10 : Math.round(n / 50) * 50);

/** The ladder with prices worked out: price = earn rate at that rank x the minutes of play it should cost. */
export function ladder(T = TUNING) {
  // the big rungs (boats, rods, rooms, tanks) and a run of town projects, so there is always something worth saving for
  return [...SHOP.ladder, ...PROJECTS].sort((a, b) => a.rank - b.rank || a.minutes - b.minutes).map((l) => ({ ...l, price: nice((goldPerHour(l.rank, T) * l.minutes) / 60) }));
}
/** The Town fund never runs out: each level costs about half an hour of income at your rank and pays a Renown token. */
export const fundPrice = (rank, T = TUNING) => nice((goldPerHour(rank, T) * 30) / 60);
export const priceOf = (id, T = TUNING) => {
  const l = ladder(T).find((x) => x.id === id);
  if (l) return l.price;
  if (id === 'fund:next') return fundPrice(T.__rank || 5, T);
  if (id.startsWith('bait:')) return Math.max(1, Math.round(BAITS[id.slice(5)].price * SHOP.packSize * 0.9));
  if (id.startsWith('lure:')) return LURES[id.slice(5)].price;
  if (id.startsWith('gift:')) return GIFTS[id.slice(5)].price;
  if (COSMETICS[id]) return COSMETICS[id].price || 0;
  return 0;
};

export function installMarket(p) {
  const { T, bus } = p;
  const s = () => p.state;
  const has = (k) => p.perks().has(k);
  const discount = () => (has('friendship.discount2') ? 0.9 : has('friendship.discount') ? 0.95 : 1);
  const rank = () => p.level().level;

  /** Daily stock: always the staples; a rare item that changes daily; a featured cosmetic that changes weekly. */
  function rollStock() {
    const day = p.today();
    const st = s().market.stock;
    if (st.day === day) return st;
    const r = p.rngFor(`stock:${day}`);
    const wk = p.rngFor(`weekly-cos:${weekOf(day)}`);
    const rare = ['bait:goldenfly'];
    const extra = r.chance(0.5) ? [`lure:${SHOP.lures[r.int(SHOP.lures.length)]}`] : [];
    st.day = day;
    st.items = [...SHOP.staples.map((b) => `bait:${b}`), ...rare, ...extra, ...SHOP.gifts.map((g) => `gift:${g}`)];
    st.featured = SHOP.weeklyCosmetics[wk.int(SHOP.weeklyCosmetics.length)];
    st.rareToday = rare[0];
    p.store.commit();
    return st;
  }

  const entries = () => {
    const st = rollStock();
    const out = [];
    st.items.forEach((id) => out.push({ id, section: id.startsWith('bait:') ? 'Bait' : id.startsWith('lure:') ? 'Lures' : 'Gifts', rare: id === st.rareToday }));
    if (st.featured) out.push({ id: st.featured, section: 'Featured this week', featured: true });
    ladder(T).forEach((l) => out.push({ id: l.id, section: l.kind === 'project' ? 'Town projects' : l.kind === 'boat' ? 'Boats' : l.kind === 'rod' ? 'Rods' : l.kind === 'tank' ? 'Aquarium' : l.kind === 'room' ? 'Lodge' : 'Furniture', ladder: l }));
    out.push({ id: 'fund:next', section: 'Town fund' });
    // cosmetics sold all the time at their price (the weekly one is just on show)
    Object.entries(COSMETICS).filter(([, c]) => c.source === 'shop').forEach(([id]) => st.featured !== id && out.push({ id, section: 'Style' }));
    return out;
  };

  function nameOf(id) {
    if (id === 'fund:next') return `Town fund, level ${(s().market.fund || 0) + 1}`;
    if (id.startsWith('bait:')) return `${BAITS[id.slice(5)].name} ×${SHOP.packSize}`;
    if (id.startsWith('lure:')) return LURES[id.slice(5)].name;
    if (id.startsWith('gift:')) return GIFTS[id.slice(5)].name;
    if (COSMETICS[id]) return COSMETICS[id].name;
    return ladder(T).find((l) => l.id === id)?.name || id;
  }

  /** Why you can't buy it right now, or '' if you can. */
  function why(id) {
    const st = s();
    const l = ladder(T).find((x) => x.id === id);
    if (l) {
      if (st.market.owned[id]) return 'Owned';
      if (rank() < l.rank) return `Rank ${l.rank}`;
      if (l.sub && T.sub.enforce && !st.sub.active) return 'Subscriber';
      if (l.kind === 'rod' && !st.unlocks[id]) return `Rank ${l.rank}`;
      return '';
    }
    if (id === 'fund:next') return rank() < 5 ? 'Rank 5' : '';
    if (COSMETICS[id]) return st.market.owned[id] ? 'Owned' : '';
    if (id.startsWith('lure:') && !has('fishing.lure_slot')) return 'Fishing 8';
    return '';
  }
  const price = (id) => (id === 'fund:next' ? fundPrice(rank(), T) : Math.max(1, Math.round(priceOf(id, T) * discount())));

  const mod = {
    name: 'market',
    install() {},
    entries: () => entries().map((e) => ({ ...e, name: nameOf(e.id), price: price(e.id), blocked: why(e.id), rarity: COSMETICS[e.id]?.rarity })),
    price,
    why,
    ladder: () => ladder(T).map((l) => ({ ...l, owned: !!s().market.owned[l.id] })),
    /** Buy one thing. Returns { ok, reason? }. Rods, boats, rooms and tanks are owned for good. */
    buy(id) {
      const reason = why(id);
      if (reason) return { ok: false, reason };
      const cost = price(id);
      if (!p.gold.pay(cost)) return { ok: false, reason: 'gold' };
      const st = s();
      if (id === 'fund:next') {
        st.market.fund = (st.market.fund || 0) + 1;
        const lv = st.market.fund;
        grant(p, [{ token: 1 }, ...(lv % 5 === 0 ? [{ bait: ['goldenfly', 2] }] : [])], T);
      } else if (id.startsWith('bait:')) st.fish.baits[id.slice(5)] = (st.fish.baits[id.slice(5)] || 0) + SHOP.packSize;
      else if (id.startsWith('lure:')) st.fish.lures[id.slice(5)] = (st.fish.lures[id.slice(5)] || 0) + 1;
      else if (id.startsWith('gift:')) st.gifts.stock[id.slice(5)] = (st.gifts.stock[id.slice(5)] || 0) + 1;
      else st.market.owned[id] = true;
      if (id.startsWith('proj:')) grant(p, PROJECTS.find((x) => x.id === id).reward, T);
      if (id.startsWith('tank:')) st.house.tanks = Math.max(st.house.tanks, 1);
      if (id.startsWith('room:')) st.house.rooms[id.slice(5)] = true;
      if (id.startsWith('rod:')) st.fish.rods[id.slice(4)] = true;
      st.market.bought[id] = p.telemetry.playMinutes();
      bus.emit('PURCHASE', { itemId: id, price: cost, kind: id.split(':')[0] });
      p.queue.push({ kind: 'item', title: nameOf(id), sub: `Bought for ${cost} gold` });
      p.store.commit();
      return { ok: true, price: cost };
    },
    // ---- selling ----
    value: (b) => Math.max(1, Math.round(b.value * T.economy.sellMult * (1 + s().market.sellBonus))),
    sellFish(index) {
      const st = s();
      const b = st.fish.bag[index];
      if (!b) return 0;
      const g = mod.value(b);
      st.fish.bag.splice(index, 1);
      p.gold.add(g);
      st.stats.sold += 1;
      p.noteProgress();
      p.store.commit();
      return g;
    },
    /** Sells everything except the best of each species (kept for the aquarium and the journal). */
    sellDuplicates() {
      const f = s().fish;
      const best = new Map();
      f.bag.forEach((b, i) => {
        const k = best.get(b.id);
        if (k === undefined || b.value > f.bag[k].value) best.set(b.id, i);
      });
      const keep = new Set(best.values());
      let gold = 0;
      let n = 0;
      f.bag = f.bag.filter((b, i) => {
        if (keep.has(i) || b.sizeClass === 'Trophy') return true;
        gold += mod.value(b);
        n++;
        return false;
      });
      if (gold) {
        p.gold.add(gold);
        s().stats.sold += n;
        p.noteProgress();
        p.queue.push({ kind: 'gold', title: `Sold ${n} fish`, sub: `+${gold} gold`, rewards: [{ icon: 'gold', text: `${gold} gold` }] });
        p.store.commit();
      }
      return gold;
    },
    // ---- crafting: bait from what you pick up ----
    recipes() {
      return Object.entries(BAITS)
        .filter(([, b]) => b.craft)
        .map(([id, b]) => ({ id, name: b.name, needs: b.craft.forage, known: !!s().unlocks[`recipe:${id}`] || has('foraging.recipes'), can: Object.entries(b.craft.forage).every(([k, n]) => (s().gifts.stock[k] || 0) >= n) }));
    },
    craft(id) {
      const r = mod.recipes().find((x) => x.id === id);
      if (!r || !r.known || !r.can) return false;
      Object.entries(r.needs).forEach(([k, n]) => (s().gifts.stock[k] -= n));
      s().fish.baits[id] = (s().fish.baits[id] || 0) + 4;
      p.skillXp('foraging', 4);
      p.store.commit();
      return true;
    },
    equip(slot, id) {
      if (id && !s().market.owned[id]) return false;
      s().market.equipped[slot] = id || '';
      p.store.commit();
      return true;
    },
    nameplate() {
      const m = s().market.equipped;
      return { title: m.title ? COSMETICS[m.title]?.name : '', frame: m.frame ? COSMETICS[m.frame] : null, rank: p.level() };
    },
    // ---- helpers the sim uses (a person does these with taps) ----
    autoBait(plan) {
      // a careful player keeps the right bait on for what they are after; here: whichever owned bait the pool likes
      const f = s().fish;
      if (f.equipped.bait && f.baits[f.equipped.bait] > 0) return;
      const owned = Object.keys(f.baits).filter((b) => f.baits[b] > 0);
      if (owned.length) f.equipped.bait = owned[Math.floor(p.rng() * owned.length)];
    },
    shopSession(profile) {
      // sell the extras, then buy the next rung of the ladder when it is affordable; keep a few baits in the bag
      mod.sellDuplicates();
      for (const l of ladder(T)) {
        if (s().market.owned[l.id] || mod.why(l.id)) continue;
        if (p.gold.get() >= price(l.id)) mod.buy(l.id);
        else break; // saving for the next rung is the point
      }
      // nothing else to save for right now: the Town fund takes the rest, a level at a time
      for (let i = 0; i < 40 && !mod.why('fund:next') && p.gold.get() >= price('fund:next') + 300; i++) mod.buy('fund:next');
      const f = s().fish;
      const total = Object.values(f.baits).reduce((a, b) => a + b, 0);
      if (total < 10) ['worm', 'shrimp'].forEach((b) => p.gold.get() > 200 && mod.buy(`bait:${b}`));
      // wear the best rod
      const best = ['golden', 'feather', 'glow', 'cork', 'basic'].find((r) => r === 'basic' || (p.state.unlocks[`rod:${r}`] && s().market.owned[`rod:${r}`]));
      f.equipped.rod = best || 'basic';
    },
    giftBest(npc) {
      if (!p.friendship.canGift(npc.id)) return;
      const st = s();
      const pick = (npc.loves || []).concat(npc.likes || []).find((id) => (id.startsWith('gift:') ? st.gifts.stock[id.slice(5)] > 0 : st.fish.bag.some((b) => `fish:${b.id}` === id)));
      if (pick) p.friendship.give(npc.id, pick);
    },
  };
  p.mods.market = mod;
  p.market = mod;
  bus.on('SESSION_START', rollStock);
}
export const marketModule = { name: 'market-install', install: installMarket };
export { RODS, speciesById };
