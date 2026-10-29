// The town request board: three requests a day (four for subscribers), weighted toward the species
// you have not collected and toward people you are not close to, so the board pulls you at your
// incomplete pages. Deliver from your bag or your gifts.
import { TUNING } from './config.js';
import { NPCS, npcById, GIFTS } from './friendship.js';
import { allSpecies, speciesById, REGIONS } from './species.js';
import { SIZE_CLASSES } from './fishroll.js';

const CLASS_RANK = Object.fromEntries(SIZE_CLASSES.map((c, i) => [c, i]));
const classAtLeast = (c, min) => CLASS_RANK[c] >= CLASS_RANK[min];

export function installRequests(p) {
  const { bus, T } = p;
  const slots = () => T.friendship.requestsPerDay + (p.state.sub.active ? 1 : 0);

  function open(regionsOpen) {
    return NPCS.filter((n) => regionsOpen.includes(n.region));
  }
  const regionsOpen = () => Object.keys(REGIONS).filter((r) => !REGIONS[r].req || p.state.unlocks[REGIONS[r].req]);

  function makeBoard(day) {
    const r = p.rngFor(`board:${day}`);
    const s = p.state;
    const candidates = [];
    const rOpen = regionsOpen();
    open(rOpen).forEach((npc) => {
      const f = s.friends[npc.id];
      const hearts = f?.hearts || 0;
      const lowHeart = 1 + (T.friendship.maxHearts - hearts) / 5;
      // fish: prefer species never caught, in this person's waters
      allSpecies()
        .filter((sp) => sp.rarity < 5 && sp.regions.includes(npc.region))
        .forEach((sp) => {
          const caught = s.fish.species[sp.id]?.n || 0;
          const w = (caught ? 0.5 : 3) * lowHeart * (sp.rarity >= 3 ? 0.6 : 1);
          candidates.push({ w, npc, type: 'fish', speciesId: sp.id, rarity: sp.rarity });
          if (caught) candidates.push({ w: 0.7 * lowHeart, npc, type: 'size', speciesId: sp.id, minClass: 'L', rarity: sp.rarity });
        });
      Object.keys(GIFTS)
        .filter((g) => GIFTS[g].source !== 'junk')
        .forEach((g) => candidates.push({ w: 0.8 * lowHeart, npc, type: 'gift', itemId: g, rarity: GIFTS[g].rarity }));
    });
    const board = [];
    const usedNpc = new Set();
    while (board.length < slots() && candidates.length) {
      const i = r.weighted(candidates.map((c) => (usedNpc.has(c.npc.id) ? c.w * 0.15 : c.w)));
      if (i < 0) break;
      const c = candidates.splice(i, 1)[0];
      usedNpc.add(c.npc.id);
      const [lo, hi] = T.xp.request;
      const xp = Math.round(lo + (hi - lo) * Math.min(1, (c.rarity - 1) / 4));
      board.push({ id: `${day}:${board.length}`, npc: c.npc.id, type: c.type, speciesId: c.speciesId || '', itemId: c.itemId || '', minClass: c.minClass || '', xp, gold: 20 + c.rarity * 15, done: false });
    }
    return board;
  }

  function ensure() {
    const day = p.today();
    if (p.state.requests.day !== day) {
      p.state.requests.day = day;
      p.state.requests.list = makeBoard(day);
      p.state.requests.doneToday = 0;
      p.store.commit();
    }
    return p.state.requests.list;
  }

  const text = (rq) => {
    const npc = npcById(rq.npc);
    if (rq.type === 'fish') return `${npc.name} would love a ${speciesById(rq.speciesId)?.name}.`;
    if (rq.type === 'size') return `${npc.name} wants a large ${speciesById(rq.speciesId)?.name} (L or bigger).`;
    return `${npc.name} would like ${GIFTS[rq.itemId]?.name || rq.itemId}.`;
  };

  // what in your hands fills a request: the index in the bag, or the stock key
  function holding(rq) {
    const s = p.state;
    if (rq.type === 'fish') return s.fish.bag.findIndex((b) => b.id === rq.speciesId);
    if (rq.type === 'size') return s.fish.bag.findIndex((b) => b.id === rq.speciesId && classAtLeast(b.sizeClass, rq.minClass));
    return s.gifts.stock[rq.itemId] > 0 ? 0 : -1;
  }

  const mod = {
    name: 'requests',
    install() {},
    board: () => ensure().map((rq) => ({ ...rq, text: text(rq), canDeliver: !rq.done && holding(rq) >= 0, npcName: npcById(rq.npc)?.name })),
    forNpc: (npcId) => ensure().filter((rq) => rq.npc === npcId && !rq.done).map((rq) => ({ ...rq, text: text(rq), canDeliver: holding(rq) >= 0 })),
    deliver(id) {
      const rq = ensure().find((x) => x.id === id);
      if (!rq || rq.done) return { ok: false, reason: 'gone' };
      const i = holding(rq);
      if (i < 0) return { ok: false, reason: 'nothing to give' };
      const s = p.state;
      if (rq.type === 'gift') s.gifts.stock[rq.itemId] -= 1;
      else s.fish.bag.splice(i, 1);
      rq.done = true;
      s.requests.doneToday += 1;
      s.requests.total += 1;
      s.stats.requests += 1;
      const g = p.xp(Math.round(rq.xp * (1 + T.xp.rankScale * p.level().level)), 'request', { silent: true });
      p.skillXp('friendship', T.skills.gain.request, { silent: true });
      p.gold.add(rq.gold);
      p.friendship.addPoints(rq.npc, T.friendship.requestPoints);
      p.queue.pushChain([{ kind: 'xp', amount: g.gained, bonus: g.bonus, label: 'Request', xpAfter: g.totalAfter }, { kind: 'request', title: text(rq).replace(/ would.*| wants.*/, '') + ' is happy', sub: `+${rq.gold} gold`, rewards: [{ icon: 'gold', text: `${rq.gold} gold` }] }]);
      p.flushSkillBars();
      p.flushRankUps();
      bus.emit('REQUEST_DONE', { npcId: rq.npc, requestId: rq.id });
      p.store.commit();
      return { ok: true, request: rq };
    },
  };
  p.mods.requests = mod;
  p.requests = mod;
  bus.on('SESSION_START', ensure);
}

export const requestsModule = { name: 'requests-install', install: installRequests };
