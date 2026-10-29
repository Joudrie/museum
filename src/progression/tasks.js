// Daily tasks and the weekly rhythm. Three tasks a day from a weighted pool tuned to rank and to
// the gaps in your collection, one free reroll, a bonus chest for clearing all three. Weekly: a
// seven-step chain, a Weekly Rumor (a guaranteed Rare spawns somewhere this week) and a weekend
// Fishing Derby. The day turns over at 4:00.
import TASKS from './data/tasks.json' with { type: 'json' };
import { allSpecies, speciesById, REGIONS } from './species.js';
import { SIZE_CLASSES } from './fishroll.js';
import { weekOf, isWeekend } from './clock.js';
import { grant } from './grants.js';

export { TASKS };
const CLASS_RANK = Object.fromEntries(SIZE_CLASSES.map((c, i) => [c, i]));

function matches(def, ev) {
  const m = def.match;
  if (m) {
    if (m.water && !m.water.includes(ev.water)) return false;
    if (m.fresh && !ev.fresh) return false;
    if (m.perfect && !ev.perfect) return false;
    if (m.minRarity && (ev.rarity || 0) < m.minRarity) return false;
    if (m.minClass && CLASS_RANK[ev.sizeClass] < CLASS_RANK[m.minClass]) return false;
  }
  if (def.ctx) {
    if (def.ctx.weather && ev.weather !== def.ctx.weather) return false;
    if (def.ctx.night && !ev.night) return false;
  }
  return true;
}

export function installTasks(p) {
  const { bus, T } = p;
  const S = () => p.state.tasks;
  const level = () => p.level().level;
  const slots = () => T.tasks.perDay + (p.state.unlocks['slot:daily_extra'] ? 1 : 0);

  function scaleN(range, lv) {
    const [lo, hi] = range;
    return Math.max(lo, Math.round(lo + (hi - lo) * Math.min(1, lv / 30)));
  }
  const available = (t, ctx) => {
    if (t.min > ctx.level) return false;
    if (t.needs === 'gaps') return ctx.gaps >= 5;
    if (t.needs?.startsWith('weather:')) return ctx.weather === t.needs.slice(8);
    if (t.id === 'catch_night' && ctx.level < 3) return false;
    return true;
  };

  function pickTasks(r, n, exclude = []) {
    const gaps = allSpecies().filter((s) => !p.state.fish.species[s.id]?.n).length;
    const ctx = { level: level(), gaps, weather: p.hooks.weatherToday?.() || 'clear' };
    const chosen = [];
    let pool = TASKS.daily.filter((t) => available(t, ctx) && !exclude.includes(t.id));
    let catchCount = exclude.filter((id) => id.startsWith('catch')).length;
    while (chosen.length < n && pool.length) {
      const w = pool.map((t) => t.weight * (t.id.startsWith('catch') && catchCount >= 2 ? 0.1 : 1) * (t.id === 'catch_new' ? Math.min(2, gaps / 20 + 0.5) : 1));
      const i = r.weighted(w);
      if (i < 0) break;
      const t = pool.splice(i, 1)[0];
      if (t.id.startsWith('catch')) catchCount++;
      const nn = scaleN(t.n, ctx.level);
      chosen.push({ id: t.id, text: t.text.replace('{n}', nn), event: t.event, match: t.match, ctx: t.ctx, count: !!t.count, n: nn, progress: 0, done: false, xp: t.xp, gold: Math.round(t.gold[0] + (t.gold[1] - t.gold[0]) * Math.min(1, ctx.level / 30)) });
    }
    return chosen;
  }

  function rollDay() {
    const s = S();
    const today = p.today();
    if (s.day === today) return;
    const wasStreakDay = s.day;
    s.day = today;
    s.rerolled = 0;
    s.chest = false;
    s.allDone = false;
    s.list = pickTasks(p.rngFor(`tasks:${today}`), slots());
    const wk = weekOf(today);
    if (s.week !== wk) rollWeek(wk);
    p.bus.emit('DAY_ROLLED', { day: today, previous: wasStreakDay });
    p.store.commit();
  }

  function rollWeek(wk) {
    const s = S();
    // finish last week's derby before starting a new one
    settleDerby();
    s.week = wk;
    const r = p.rngFor(`week:${wk}`);
    const order = r.shuffle(TASKS.weekly);
    s.weekly = { steps: order.map((t) => ({ id: t.id, text: t.text.replace('{n}', t.n), event: t.event, match: t.match, n: t.n, progress: 0, done: false })), chain: 0, claimed: false, rumor: null, derby: null };
    // the Weekly Rumor: a Rare (or Epic) species in a region you can reach
    const open = Object.keys(REGIONS).filter((id) => !REGIONS[id].req || p.state.unlocks[REGIONS[id].req]);
    const cands = allSpecies().filter((sp) => sp.rarity >= 3 && sp.rarity <= 4 && sp.regions.some((x) => open.includes(x)));
    const fresh = cands.filter((sp) => !p.state.fish.species[sp.id]?.n);
    const pool = fresh.length ? fresh : cands;
    if (pool.length) {
      const sp = pool[r.int(pool.length)];
      const regions = sp.regions.filter((x) => open.includes(x));
      s.weekly.rumor = { speciesId: sp.id, region: regions[r.int(regions.length)], spot: null, caught: false, week: wk };
      p.state.fish.weeklyRumor = s.weekly.rumor;
    } else p.state.fish.weeklyRumor = null;
    // the weekend derby: the biggest of one featured species
    const common = allSpecies().filter((sp) => sp.rarity <= 3 && sp.regions.some((x) => open.includes(x)));
    if (common.length) {
      const sp = common[r.int(common.length)];
      s.weekly.derby = { speciesId: sp.id, week: wk, best: 0, bestClass: '', entries: 0, paid: false };
    }
  }

  function settleDerby() {
    const d = S().weekly?.derby;
    if (!d || d.paid || !d.best) return;
    d.paid = true;
    const rank = d.bestClass === 'Trophy' ? 3 : d.bestClass === 'XL' ? 2 : 1;
    const gold = [0, 100, 250, 500][rank];
    const got = grant(p, [{ gold }, ...(rank === 3 ? [{ bait: ['goldenfly', 1] }] : [])], T);
    p.state.fish.derbyBoard = [...(p.state.fish.derbyBoard || []), { species: d.speciesId, size: d.best, cls: d.bestClass, week: d.week }].slice(-8);
    p.queue.push({ kind: 'item', title: 'Derby over', sub: `Your best ${speciesById(d.speciesId)?.name}: ${d.best} cm`, rewards: got });
  }

  function progress(def, ev, amount) {
    def.progress = Math.min(def.n, def.progress + amount);
    if (def.progress >= def.n && !def.done) {
      def.done = true;
      return true;
    }
    return false;
  }

  function onEvent(type, ev) {
    const s = S();
    s.list.forEach((t) => {
      if (t.done || t.event !== type || !matches(t, ev)) return;
      if (progress(t, ev, t.count ? ev.count || 1 : 1)) completeTask(t);
    });
    // the weekly chain counts everything this week; steps unlock in order
    const wk = s.weekly;
    if (wk?.steps) {
      wk.steps.forEach((st) => {
        if (st.done || st.event !== type || !matches(st, ev)) return;
        if (progress(st, ev, 1)) completeStep(st);
      });
    }
    if (type === 'FISH_CAUGHT' && wk?.derby && isWeekend(p.today()) && ev.speciesId === wk.derby.speciesId) {
      wk.derby.entries += 1;
      if (ev.size > wk.derby.best) {
        wk.derby.best = ev.size;
        wk.derby.bestClass = ev.sizeClass;
        p.queue.push({ kind: 'item', title: 'Derby leader', sub: `Your ${speciesById(ev.speciesId)?.name} at ${ev.size} cm is your best this weekend.` });
      }
    }
  }

  function completeTask(t) {
    const s = S();
    p.state.stats.tasksDone += 1;
    const g = p.xp(t.xp, 'task', { silent: true });
    p.gold.add(t.gold);
    p.telemetry.track('task_complete', { id: t.id });
    p.queue.pushChain([{ kind: 'xp', amount: g.gained, bonus: g.bonus, label: 'Task', xpAfter: g.totalAfter }, { kind: 'task', title: t.text, rewards: [{ icon: 'gold', text: `${t.gold} gold` }] }]);
    bus.emit('TASK_DONE', { taskId: t.id });
    if (s.list.every((x) => x.done) && !s.allDone) {
      s.allDone = true;
      s.chest = true;
      const rewards = [{ gold: T.tasks.chestGold }, { bait: ['shrimp', 6] }];
      if (p.rng.chance(0.25)) rewards.push({ bait: ['goldenfly', 1] });
      const got = grant(p, rewards, T);
      p.queue.push({ kind: 'item', title: 'Bonus chest', sub: 'All of today’s tasks are done.', rewards: got, rarity: 3 });
    }
    p.flushRankUps();
    p.store.commit();
  }

  function completeStep(st) {
    const wk = S().weekly;
    wk.chain = wk.steps.filter((x) => x.done).length;
    p.queue.push({ kind: 'task', title: `Week step ${wk.chain} of ${wk.steps.length}`, sub: st.text });
    if (wk.chain >= wk.steps.length && !wk.claimed) {
      wk.claimed = true;
      const g = p.xp(T.xp.weekly, 'weekly', { silent: true });
      const got = grant(p, [{ gold: T.tasks.weeklyChestGold }, { bait: ['goldenfly', 2] }, { cosmetic: 'frame:shell' }], T);
      p.queue.pushChain([{ kind: 'xp', amount: g.gained, bonus: g.bonus, label: 'Week done', xpAfter: g.totalAfter }, { kind: 'item', title: 'The week is done', sub: 'Weekly chest', rewards: got, rarity: 4 }]);
      p.flushRankUps();
    }
    p.store.commit();
  }

  ['FISH_CAUGHT', 'NPC_TALKED', 'GIFT_GIVEN', 'SECRET_FOUND', 'TILE_REVEALED', 'ITEM_FORAGED', 'TRAVERSAL_USED', 'REQUEST_DONE', 'TASK_DONE'].forEach((t) => bus.on(t, (ev) => onEvent(t, ev)));
  bus.on('SESSION_START', rollDay);
  bus.on('SESSION_TICK', () => p.today() !== S().day && rollDay());

  const mod = {
    name: 'tasks',
    install() {},
    rollDay,
    today: () => S().list,
    weekly: () => S().weekly,
    reroll(i) {
      const s = S();
      if (s.rerolled >= T.tasks.rerolls || !s.list[i] || s.list[i].done) return false;
      const r = p.rngFor(`reroll:${s.day}:${i}:${s.rerolled}`);
      const fresh = pickTasks(r, 1, s.list.map((x) => x.id));
      if (!fresh.length) return false;
      s.list[i] = fresh[0];
      s.rerolled += 1;
      p.store.commit();
      return true;
    },
    rerollsLeft: () => T.tasks.rerolls - S().rerolled,
    settleDerby,
  };
  p.mods.tasks = mod;
  p.tasks = mod;
}
export const tasksModule = { name: 'tasks-install', install: installTasks };
