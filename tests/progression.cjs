// The progression layer, headless: bus, rank curve, rested XP, saves, reward queue, fishing rolls
// (pity, sizes, variants, legendaries), the service's catch flow, the clock, the reel, and the content
// validator. Plain Node, no browser, no network. Usage: node tests/progression.cjs
const path = require('path');
const root = path.join(__dirname, '..');
const load = (p) => import(path.join(root, p));
const problems = [];
const fail = (m) => (problems.push(m), console.log('  ✗ ' + m));
const ok = (m) => console.log('  ✓ ' + m);
const check = (c, good, bad) => (c ? ok(good) : fail(bad));

(async () => {
  const [{ TUNING }, { createBus }, rank, skills, st, rq, fr, rl, svc, mods, clk, rngm, ang, valid, jr, spc, rl2] = await Promise.all([
    load('src/progression/config.js'),
    load('src/progression/bus.js'),
    load('src/progression/rank.js'),
    load('src/progression/skills.js'),
    load('src/progression/store.js'),
    load('src/progression/rewardqueue.js'),
    load('src/progression/fishroll.js'),
    load('src/progression/reel.js'),
    load('src/progression/service.js'),
    load('src/progression/modules.js'),
    load('src/progression/clock.js'),
    load('src/progression/rng.js'),
    load('src/progression/angling.js'),
    load('src/progression/validate.js'),
    load('src/progression/journal.js'),
    load('src/progression/species.js'),
    load('src/progression/rewardqueue.js'),
  ]);
  const mk = (seed = 5, t0 = Date.UTC(2026, 5, 10, 12)) => {
    const box = { t: t0 };
    const clock = clk.createClock({ now: () => box.t });
    const p = svc.createProgression({ clock, rng: rngm.createRng(seed), modules: mods.standardModules() });
    p.start();
    return { p, box };
  };

  console.log('Bus');
  {
    const bus = createBus({ strict: true });
    let n = 0;
    bus.on('NPC_TALKED', () => n++);
    bus.emit('NPC_TALKED', { npcId: 'x' });
    check(n === 1, 'handlers run', 'handler did not run');
    let threw = false;
    try {
      bus.emit('NPC_TALKED', {});
    } catch {
      threw = true;
    }
    check(threw, 'a payload missing its keys is refused in strict mode', 'a bad payload slipped through');
    let t2 = false;
    try {
      bus.on('NOPE', () => {});
    } catch {
      t2 = true;
    }
    check(t2, 'unknown events cannot be subscribed to', 'unknown event accepted');
    const loose = createBus();
    let after = 0;
    loose.on('SESSION_END', () => {
      throw new Error('boom');
    });
    loose.on('SESSION_END', () => after++);
    const e = console.error;
    console.error = () => {};
    loose.emit('SESSION_END', {});
    console.error = e;
    check(after === 1, 'a handler that throws does not stop the others', 'one handler stopped the rest');
  }

  console.log('Rank');
  {
    const xs = Array.from({ length: 60 }, (_, i) => rank.xpToNext(i + 1));
    check(xs.every((v, i) => i === 0 || v >= xs[i - 1]), 'the curve never goes down', 'xpToNext decreases');
    check(rank.xpToNext(50) === rank.xpToNext(60) && rank.xpToNext(60) >= rank.xpToNext(49), 'after 50 every Renown level costs the same', 'renown curve wrong');
    check(rank.levelOf(0).level === 1 && rank.levelOf(rank.cumXp(7)).level === 7 && rank.levelOf(rank.cumXp(7) - 1).level === 6, 'level boundaries are exact', 'levelOf off by one');
    check(rank.levelOf(rank.cumXp(60)).renown === 10 && rank.levelOf(rank.cumXp(60)).rank === 50, 'past 50 it counts Renown', 'renown not counted');
    const s = st.defaults(0);
    s.rested.pool = 100;
    const r1 = rank.addXp(s, 40);
    check(r1.gained === 80 && s.rested.pool === 60, 'rested XP doubles gains and is spent', `rested gain ${r1.gained}, pool ${s.rested.pool}`);
    const r2 = rank.addXp(s, 100);
    check(r2.bonus === 60 && s.rested.pool === 0, 'the pool never overspends', 'pool overspent');
    const s2 = st.defaults(0);
    const got = rank.creditAway(s2, 200 * 3600e3);
    check(got > 0 && s2.rested.pool <= rank.restedCap(s2), 'away time fills the pool up to one rank', 'away credit broken');
    check(rank.creditAway(st.defaults(0), 0.5 * 3600e3) === 0, 'a short break adds nothing', 'a half hour earned rest');
    const s3 = st.defaults(0);
    const a3 = rank.creditAway(s3, 72 * 3600e3);
    const b3 = rank.creditAway(st.defaults(0), 400 * 3600e3);
    check(a3 === b3, 'rested credit stops growing after three days away', `72 h ${a3} vs 400 h ${b3}`);
  }

  console.log('Skills');
  {
    const s = st.defaults(0);
    check(skills.skillLevel('fishing', 0).level === 1 && skills.skillLevel('fishing', 1e9).level === 20, 'skills run from level 1 to 20', 'skill range wrong');
    skills.addSkillXp(s, 'fishing', skills.skillCum('fishing', 6));
    check(skills.hasPerk(s, 'fishing.wide_window') && !skills.hasPerk(s, 'fishing.lure_slot'), 'perks switch on at their level', 'perk gating wrong');
    check(skills.perksOf(s, 'fishing').length === 3, 'level 6 holds three perks (2, 4, 6)', 'perk count wrong');
  }

  console.log('Save');
  {
    const d = st.defaults(123);
    check(st.migrate(null, 5).installAt === 5, 'no save becomes a fresh one', 'null save not handled');
    check(st.migrate('junk', 5).v === st.SCHEMA_VERSION && st.migrate([1], 5).v === st.SCHEMA_VERSION, 'junk saves become a fresh one', 'junk save crashed');
    const v1 = { v: 1, installAt: 9, rank: { xp: 777 }, fish: { catches: 3 } };
    const m = st.migrate(v1);
    check(m.v === st.SCHEMA_VERSION && m.rank.xp === 777 && m.fish.catches === 3 && m.house && m.sub, 'an old save migrates and keeps its progress', 'v1 migration lost data');
    const broken = st.migrate({ v: 2, rank: { xp: 'lots' }, fish: { pity: 'x', species: [] }, streak: 4 });
    check(broken.rank.xp === 0 && typeof broken.fish.pity === 'object' && broken.streak.count === 0, 'wrong-typed fields are repaired from the defaults', 'broken fields kept: ' + JSON.stringify(broken.rank));
    const mem = st.memoryAdapter();
    const store = st.createStore(mem, { now: 1 });
    store.state.rank.xp = 50;
    store.commit();
    check(st.createStore(mem).state.rank.xp === 50, 'commit writes through and reloads', 'commit lost');
    check(d.fish.pity && 'legend' in d.fish.pity && 'rested' in d && d.streak && d.streak.shields === 0, 'pity counters, rested pool, streak and shields live in the save', 'save is missing a section');
  }

  console.log('Reward queue');
  {
    const shown = [];
    let gate = false;
    const pumps = [];
    const dones = [];
    const q = rq.createRewardQueue({
      present: (it, done) => {
        shown.push(it.kind);
        dones.push(done);
      },
      gate: () => gate,
      setTimer: (fn) => (pumps.push(fn), pumps.length),
      clearTimer: () => {},
    });
    const pump = () => {
      const fns = pumps.splice(0);
      fns.forEach((f) => f());
    };
    q.push({ kind: 'xp' });
    q.push({ kind: 'species' });
    pump();
    check(shown.length === 0, 'nothing shows while a dialogue or minigame holds the gate', 'a reward showed through a closed gate');
    gate = true;
    pump();
    pump();
    check(shown.length === 1 && q.busy, 'one at a time: the next waits until the first is done', 'two rewards overlapped: ' + shown);
    pump();
    check(shown.length === 1, 'nothing else starts while one is on screen', 'a second reward started early');
    dones.shift()();
    pump();
    dones.shift()?.();
    check(shown.length === 2 && shown[0] === 'species', 'a bigger moment jumps ahead of an XP tick', 'order: ' + shown);
    shown.length = 0;
    q.pushChain([{ kind: 'xp' }, { kind: 'species' }, { kind: 'skill' }, { kind: 'xp' }]);
    q.push({ kind: 'rank' });
    for (let i = 0; i < 40; i++) {
      pump();
      dones.splice(0).forEach((d) => d());
    }
    check(shown.slice(0, 4).join() === 'xp,species,skill,xp' && shown[4] === 'rank', 'a chain plays in order and is never split', 'chain split: ' + shown);
    let threw = false;
    try {
      q.push({ kind: 'bogus' });
    } catch {
      threw = true;
    }
    check(threw, 'unknown reward kinds are refused', 'bogus kind accepted');
    const inst = rl2.instantQueue();
    inst.push({ kind: 'xp' });
    check(inst.log.length === 1, 'the instant queue (tests, sim) logs what it was asked to show', 'instant queue broken');
  }

  console.log('Clock');
  {
    const day = (y, mo, d, h, mi = 0) => clk.dayOf(new Date(y, mo, d, h, mi).getTime());
    check(day(2026, 5, 10, 3, 59) === day(2026, 5, 9, 12) && day(2026, 5, 10, 4, 0) === day(2026, 5, 9, 12) + 1, 'the day turns over at 4:00 local', 'day boundary wrong');
    let t = Date.UTC(2026, 5, 10, 12);
    const c = clk.createClock({ now: () => t });
    const a = c.now();
    t -= 3 * 864e5;
    check(c.now() === a && c.rolledBack, 'the clock never runs backwards and notices a rollback', 'clock went back');
    check(clk.weekdayOf(4) === 0 && clk.isWeekend(clk.dayOf(Date.UTC(2026, 5, 13, 12))), 'weeks run Monday to Sunday (13 June 2026 is a Saturday)', 'weekday maths wrong');
  }

  console.log('Fishing rolls');
  const species = spc.allSpecies();
  const legends = spc.legends();
  const ctxOf = (o = {}) => fr.makeContext({ region: 'main', water: 'sea', hour: 12, weather: 'clear', season: 'summer', perks: new Set(), ...o });
  {
    check(species.length === 60 && legends.length === 10, '60 species, ten of them legends', `${species.length} species, ${legends.length} legends`);
    check(species.every((s) => spc.hintsFor(s).length === 3), 'every species has three hints', 'a species lacks hints');
    // size classes: top 2% are trophies
    const r = rngm.createRng(11);
    let trophy = 0;
    const N = 200000;
    for (let i = 0; i < N; i++) if (fr.sizeClassOf(r.normal()) === 'Trophy') trophy++;
    check(Math.abs(trophy / N - 0.02) < 0.004, `a Trophy is the top 2% (${((100 * trophy) / N).toFixed(2)}%)`, `trophy rate ${trophy / N}`);
    // variants
    let gold = 0;
    let alb = 0;
    const M = 400000;
    const rv = rngm.createRng(3);
    for (let i = 0; i < M; i++) {
      const v = fr.rollVariant(rv, ctxOf());
      if (v === 'golden') gold++;
      if (v === 'albino') alb++;
    }
    check(gold / M > 1 / 400 / 1.5 && gold / M < (1 / 400) * 1.5, `golden is about 1 in 400 (${(M / gold).toFixed(0)})`, `golden rate 1 in ${M / gold}`);
    check(alb / M > 1 / 800 / 1.6 && alb / M < (1 / 800) * 1.6, `albino is about 1 in 800 (${(M / alb).toFixed(0)})`, `albino rate 1 in ${M / alb}`);
    check(fr.rollVariant(rngm.createRng(1), ctxOf({ events: ['halloween'] }), { ...TUNING, fishing: { ...TUNING.fishing, variants: { golden: 0, albino: 0, eventGhost: 1 } } }) === 'ghost', 'event variants roll only during their event', 'ghost variant missing');
    // pity: no long drought of Rare+ when they are in the pool
    const s = st.defaults(0);
    const r2 = rngm.createRng(9);
    let drought = 0;
    let worst = 0;
    for (let i = 0; i < 6000; i++) {
      const roll = fr.rollSpecies(s, ctxOf({ water: 'pond' }), r2);
      if (roll.species && roll.species.rarity >= 3) drought = 0;
      else if (!roll.junk) drought++;
      worst = Math.max(worst, drought);
    }
    check(worst <= TUNING.fishing.pity.rareAfter + 40, `no drought of Rare or better beyond ${TUNING.fishing.pity.rareAfter + 40} casts (worst ${worst})`, `a drought of ${worst} casts`);
    check(s.fish.pity.rare < 200, 'pity counters are kept in the save state', 'pity not tracked');
    // legends need their trail and their conditions
    const lg = legends.find((l) => l.id === 'oarfish');
    const lctx = ctxOf({ region: 'tomb', time: 'dusk', hour: 18, weather: 'fog', bait: 'squidstrip' });
    const sNo = st.defaults(0);
    let sawNo = false;
    for (let i = 0; i < 400; i++) if (fr.rollSpecies(sNo, lctx, rngm.createRng(i)).species?.id === 'oarfish') sawNo = true;
    check(!sawNo, 'a legendary never bites before its clue is found', 'a legend bit with no trail');
    let worstTry = 0;
    for (let seed = 0; seed < 300; seed++) {
      const sy = st.defaults(0);
      sy.journal.leads['legend:oarfish'] = { stage: 'clue' };
      const rr = rngm.createRng(seed);
      let tries = 0;
      for (;;) {
        tries++;
        const roll = fr.rollSpecies(sy, lctx, rr);
        if (roll.species?.id === 'oarfish') break;
        if (tries > 60) break;
      }
      worstTry = Math.max(worstTry, tries);
    }
    check(worstTry <= TUNING.fishing.pity.legendaryGuarantee + 3, `the first legendary lands within ${TUNING.fishing.pity.legendaryGuarantee} attempts once its conditions are met (worst ${worstTry})`, `a legendary took ${worstTry} attempts`);
    const wrong = ctxOf({ region: 'tomb', time: 'night', hour: 23, weather: 'fog', bait: 'squidstrip' });
    const sw = st.defaults(0);
    sw.journal.leads['legend:oarfish'] = { stage: 'clue' };
    let sawWrong = false;
    for (let i = 0; i < 200; i++) if (fr.rollSpecies(sw, wrong, rngm.createRng(i)).species?.id === 'oarfish') sawWrong = true;
    check(!sawWrong, 'a legendary stays away outside its time and weather', 'a legend bit at the wrong time');
    // night-only deep species need the night-fishing perk
    const noct = species.find((x) => x.nocturnal);
    check(noct ? !fr.eligible(noct, ctxOf({ region: noct.regions[0], water: noct.waters[0], hour: 23, weather: noct.weathers[0], season: noct.seasons[0] })) && fr.eligible(noct, ctxOf({ region: noct.regions[0], water: noct.waters[0], hour: 23, weather: noct.weathers[0], season: noct.seasons[0], perks: new Set(['fishing.night_fishing']) })) : true, 'nocturnal species wait for Fishing 10', 'night perk gating wrong');
    // bait steers the catch
    const share = (bait) => {
      let n = 0;
      const rs = rngm.createRng(21);
      const sx = st.defaults(0);
      for (let i = 0; i < 4000; i++) if (fr.rollSpecies(sx, ctxOf({ water: 'sea', bait }), rs).species?.baits.includes('squidstrip')) n++;
      return n;
    };
    check(share('squidstrip') > share('') * 1.15, 'the right bait pulls the fish that like it', 'bait made no difference');
    // hot spots: stable inside a slot, moving between slots
    const cand = Array.from({ length: 80 }, (_, i) => [i, i * 2]);
    const rf = (l) => rngm.createRng(l);
    const h1 = fr.hotSpots('main', 100, cand, rf);
    check(JSON.stringify(h1) === JSON.stringify(fr.hotSpots('main', 100, cand, rf)) && JSON.stringify(h1) !== JSON.stringify(fr.hotSpots('main', 101, cand, rf)), 'hot spots hold for two hours and then move', 'hot spots unstable');
    check(fr.msToHotMove(7200e3 * 5 + 3600e3) === 3600e3, 'the move timer counts down to the next two-hour slot', 'hot timer wrong');
    const t = fr.tellFor;
    check([1, 2, 3, 4, 5].every((r) => t(r).haptic >= t(r - 1 || 1).haptic && t(r).pulses >= t(r - 1 || 1).pulses), 'bites tell more strongly as the fish gets rarer', 'tell does not rise with rarity');
  }

  console.log('Reel');
  {
    const win = (rarity, skill) => {
      let w = 0;
      const r = rngm.createRng(4 + rarity);
      for (let i = 0; i < 150; i++) if (rl.playBot(rl.makeReel({ rarity, rng: r, legend: rarity === 5 }), skill, r).won) w++;
      return w / 150;
    };
    check(win(1, 0.4) > 0.95, 'a common fish is easy', `common win rate ${win(1, 0.4)}`);
    check(win(4, 0.9) > win(4, 0.4) + 0.2, 'skill matters on hard fish', 'skill made no difference');
    check(win(5, 0.9) < win(1, 0.9), 'legends fight harder than commons', 'legends are not harder');
  }

  console.log('The service: one catch');
  {
    const { p, box } = mk(8);
    const sp = species.find((x) => x.id === 'carp');
    const emitCatch = (o = {}) => p.bus.emit('FISH_CAUGHT', { speciesId: 'carp', size: 50, sizeClass: 'M', rarity: 2, variant: '', spotId: 'x', perfect: false, region: 'main', water: 'pond', ...o });
    const xp0 = p.state.rank.xp;
    emitCatch();
    const first = p.last;
    check(first.fresh && first.xp.gained >= TUNING.xp.byRarity[2] + TUNING.xp.newSpecies, 'a new species pays base XP plus the new-species bonus', `first catch paid ${first.xp.gained}`);
    check(first.firstOfDay && first.xp.base >= 2 * (TUNING.xp.byRarity[2] + TUNING.xp.newSpecies), 'the first catch of the day pays double', 'no first-of-day bonus');
    check(jr.isStamped(p.state, 'fish', 'carp'), 'the journal is stamped', 'no stamp');
    check(p.skill('fishing').into > 0 || p.skill('fishing').level > 1, 'the Fishing skill moved', 'no skill xp');
    check(p.queue.log.some((i) => i.kind === 'xp') && p.queue.log.some((i) => i.kind === 'species'), 'the queue got an XP tick and a new-entry stamp', 'queue is missing items: ' + p.queue.log.map((i) => i.kind));
    emitCatch({ size: 60 });
    check(p.last.personalBest && !p.last.fresh && !p.last.firstOfDay, 'a bigger one is a personal best, no longer new, no longer first of the day', 'second catch misread: ' + JSON.stringify({ pb: p.last.personalBest, fresh: p.last.fresh }));
    check(p.state.fish.species.carp.bestSize === 60 && p.state.fish.bag.length === 2, 'the best size is kept and both fish are in the bag', 'best size or bag wrong');
    emitCatch({ perfect: true, size: 40 });
    check(p.last.perfect && p.last.xp.base >= TUNING.xp.byRarity[2] + TUNING.xp.perfect, 'a perfect catch pays a bonus', 'perfect bonus missing');
    emitCatch({ variant: 'golden', size: 45 });
    check(p.last.freshVariant && jr.isStamped(p.state, 'fish', 'carp:golden'), 'a variant gets its own journal slot', 'variant slot missing');
    emitCatch({ sizeClass: 'Trophy', size: 90 });
    check(p.state.fish.trophies.length === 1, 'a Trophy is kept for the wall', 'trophy not kept');
    p.bus.emit('FISH_ESCAPED', { speciesId: 'carp', sizeClass: 'XL', rarity: 2 });
    check(p.last.escaped && p.last.sizeClass === 'XL' && p.last.known, 'an escape remembers its size class for the near-miss card', 'escape lost');
    p.bus.emit('FISH_ESCAPED', { speciesId: 'sturgeon', sizeClass: 'L', rarity: 4 });
    check(p.last.name === '???', 'an undiscovered species that escapes shows as ???', 'unknown fish named');
    check(p.state.rank.xp > xp0, 'rank XP rose', 'no XP');
    box.t += 3600e3;
    check(p.gold.get() >= 0, 'gold is readable', 'gold unreadable');
  }

  console.log('The service: ranks');
  {
    const { p } = mk(2);
    const need = rank.xpToNext(1);
    p.xp(need + 1, 'test');
    check(p.level().level === 2, 'enough XP ranks up', 'no rank up');
    const rk = p.queue.log.find((i) => i.kind === 'rank');
    check(rk && rk.rewards.length > 0 && rk.next.label === 'Rank 3', 'the ceremony carries its reward and a preview of the next rank', 'rank card incomplete');
    p.xp(rank.cumXp(12) - p.state.rank.xp, 'test');
    check(p.queue.log.filter((i) => i.kind === 'rank').length === 11, 'a jump of many ranks queues every ceremony in order', 'ranks skipped: ' + p.queue.log.filter((i) => i.kind === 'rank').length);
    check(p.state.unlocks['rod:cork'] && p.state.unlocks['boat:rowboat'] && p.state.unlocks['boat:sailboat'], 'rank unlocks are applied (rod, rowboat, sailboat)', 'unlocks missing');
  }

  console.log('Casting');
  {
    const { p } = mk(13);
    const plan = ang.prepareCast(p, { mapId: 'main', water: 'pond', weather: 'clear', hour: 10, season: 'summer' });
    check(plan.first && plan.species && plan.species.rarity === 1 && plan.species.id !== 'minnow', 'the very first catch is a gentle common fish', 'first cast was ' + plan.species?.id);
    check(plan.window >= TUNING.fishing.guaranteedFirstCatchWindowMs, 'the first catch has a generous window', 'first window ' + plan.window);
    ang.completeCast(p, plan, { perfect: true });
    check(p.state.fish.catches === 1 && p.last.fresh, 'completing a cast records the catch', 'cast not recorded');
    let plan2 = ang.prepareCast(p, { mapId: 'main', water: 'sea', weather: 'clear', hour: 10, season: 'summer' });
    for (let i = 0; i < 30 && !plan2.species; i++) plan2 = ang.prepareCast(p, { mapId: 'main', water: 'sea', weather: 'clear', hour: 10, season: 'summer' });
    check(!plan2.first && plan2.wait > 0 && plan2.tell, 'later casts roll a wait and a tell', 'cast plan incomplete');
    ang.loseCast(p, plan2);
    check(p.last.escaped, 'losing a cast reports an escape', 'escape not reported');
    // ice: a winter pond is an ice hole, never a pond
    let sawIce = true;
    for (let i = 0; i < 30; i++) if (ang.prepareCast(p, { mapId: 'main', water: 'pond', weather: 'clear', hour: 10, season: 'winter' }).water !== 'ice') sawIce = false;
    check(sawIce, 'a winter pond is an ice hole where the lake freezes', 'pond did not freeze');
    // bait is spent
    p.state.fish.baits.worm = 2;
    ang.equipBait(p.state, 'worm');
    ang.prepareCast(p, { mapId: 'main', water: 'pond', weather: 'clear', hour: 10, season: 'summer' });
    check(p.state.fish.baits.worm === 1, 'a cast uses one bait', 'bait not spent');
  }

  console.log('Content validator');
  {
    const out = valid.validate({});
    check(out.length === 0, 'rank, skill, species, region, bait, NPC and cosmetic data are sound', 'validator found: ' + out.slice(0, 5).join('; '));
    // it must really catch bad data
    const bad = valid.validate({ perkUses: ['fishing.not_a_perk'] });
    check(bad.some((m) => m.includes('not_a_perk')), 'it catches a perk the code asks for that nothing grants', 'a bad perk went unnoticed');
  }

  console.log(problems.length ? `\n${problems.length} problem(s)` : '\nAll good');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
