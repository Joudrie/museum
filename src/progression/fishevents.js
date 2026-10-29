// What a catch means: the one place FISH_CAUGHT and FISH_ESCAPED are turned into
// XP, journal stamps, skill progress, sellable fish and reward-queue items.
import { TUNING } from './config.js';
import { speciesById, REGIONS } from './species.js';
import { fishValue } from './fishroll.js';
import { stamp, checkMilestones, completion } from './journal.js';
import { grant } from './grants.js';
import { SIZE_CLASSES } from './fishroll.js';

const BAG_CAP = 80;

export function installFish(p) {
  const { bus, T } = p;

  bus.on('FISH_CAUGHT', (ev) => {
    const s = p.state;
    const f = s.fish;
    const sp = speciesById(ev.speciesId);
    if (!sp) return;
    const rec = (f.species[sp.id] ||= { n: 0, bestSize: 0, bestClass: '', variants: {}, first: null });
    const fresh = rec.n === 0;
    rec.n += ev.doubled ? 2 : 1;
    const improved = !fresh && ev.size > rec.bestSize;
    if (ev.size > rec.bestSize) {
      rec.bestSize = ev.size;
      rec.bestClass = ev.sizeClass;
    }
    if (fresh) rec.first = { at: p.clock.now(), region: ev.region || '', day: p.clock.day() };
    let freshVariant = false;
    if (ev.variant) {
      freshVariant = !rec.variants[ev.variant];
      rec.variants[ev.variant] = (rec.variants[ev.variant] || 0) + 1;
    }
    f.catches += ev.doubled ? 2 : 1;
    f.doubles += ev.doubled ? 1 : 0;
    f.streak += 1;
    f.bestStreak = Math.max(f.bestStreak, f.streak);
    f.heaviest = Math.max(f.heaviest, ev.size);
    const hour = p.hourNow?.() ?? 12;
    if (hour < 6 || hour >= 20) f.nightCatches += 1;
    s.stats.catches += ev.doubled ? 2 : 1;
    if (!s.journal.records.firstCatchAt) s.journal.records.firstCatchAt = p.clock.now();

    // the codex (the museum's ledger) and the sellable bag
    p.hooks.collect?.(sp.entryId, { size: ev.size, variant: ev.variant });
    const value = Math.round(fishValue(sp, ev.sizeClass, ev.variant, T) * (1 + T.economy.skillValueBonus * p.skill('fishing').level));
    for (let i = 0; i < (ev.doubled ? 2 : 1); i++) f.bag.push({ id: sp.id, size: ev.size, sizeClass: ev.sizeClass, variant: ev.variant || '', value, at: p.clock.now() });
    while (f.bag.length > BAG_CAP) {
      // overflow sells the cheapest fish straight away: nothing is ever lost
      const i = f.bag.reduce((m, b, k, a) => (b.value < a[m].value ? k : m), 0);
      p.gold.add(Math.round(f.bag[i].value * T.economy.sellMult));
      f.bag.splice(i, 1);
    }
    const trophy = ev.sizeClass === 'Trophy';
    if (trophy) {
      f.trophies.push({ id: sp.id, size: ev.size, variant: ev.variant || '', at: p.clock.now() });
      f.trophies.sort((a, b) => b.size / (speciesById(b.id)?.mean || 1) - a.size / (speciesById(a.id)?.mean || 1));
      f.trophies.length = Math.min(f.trophies.length, 12);
    }

    // journal
    const where = { region: ev.region, name: REGIONS[ev.region]?.name || '' };
    const st = stamp(p, 'fish', sp.id, where);
    if (freshVariant) stamp(p, 'fish', `${sp.id}:${ev.variant}`, where);
    if (fresh) {
      p.telemetry.track('species_discovered', { id: sp.id, rarity: sp.rarity, region: ev.region });
      const pct = Math.round(completion(p, 'fish').pct);
      if (pct % 10 === 0 || pct >= 100) p.telemetry.track('journal_pct', { page: 'fish', pct });
      p.telemetry.once('first_catch', { id: sp.id, minutes: p.telemetry.playMinutes() });
    }
    if (sp.rarity === 5) p.telemetry.track('legend_caught', { id: sp.id });

    // XP
    const xp = T.xp;
    let base = (sp.xp ?? xp.byRarity[sp.rarity]) * (1 + xp.skillLevelBonus * p.skill('fishing').level) * (xp.sizeMult[ev.sizeClass] || 1);
    if (fresh) base += xp.newSpecies;
    if (freshVariant) base += xp.newSpecies;
    if (improved) base += xp.personalBest;
    if (ev.perfect) base += xp.perfect * (p.perks().has('fishing.perfect_double') ? 2 : 1);
    const today = p.clock.day();
    const firstOfDay = f.firstCatchDay !== today;
    if (firstOfDay) {
      base *= xp.firstCatchOfDayMult;
      f.firstCatchDay = today;
    }
    const gain = p.xp(base, 'catch', { silent: true });

    // skill
    const g = T.skills.gain;
    p.skillXp('fishing', g.catch + g.catchByRarity[sp.rarity] + (ev.perfect ? g.perfect : 0), { silent: true });

    p.last = { speciesId: sp.id, name: sp.name, rarity: sp.rarity, size: ev.size, sizeClass: ev.sizeClass, variant: ev.variant || '', fresh, freshVariant, personalBest: improved, trophy, perfect: !!ev.perfect, doubled: !!ev.doubled, value, xp: gain, firstOfDay, via: ev.via, region: ev.region };

    // the chain after the reveal card: xp, new entry, skill, milestones (each in turn, rising pitch)
    const chain = [{ kind: 'xp', amount: gain.gained, bonus: gain.bonus, label: `${sp.name}`, xpAfter: gain.totalAfter }];
    if (fresh) chain.push({ kind: 'species', speciesId: sp.id, name: sp.name, rarity: sp.rarity, where: where.name, size: ev.size });
    if (freshVariant) chain.push({ kind: 'variant', speciesId: sp.id, name: sp.name, variant: ev.variant });
    p.queue.pushChain(chain);
    p.flushSkillBars();
    p.flushRankUps(gain);
    checkMilestones(p, 'fish', (rewards) => grant(p, rewards, T)).forEach((m) => p.queue.push({ kind: 'milestone', page: m.page, pct: m.pct, rewards: m.rewards }));
    p.store.commit();
  });

  bus.on('JUNK_CAUGHT', () => {
    const f = p.state.fish;
    f.junk = (f.junk || 0) + 1;
    const gain = p.xp(T.xp.junk ?? 2, 'junk', { silent: true });
    p.skillXp('fishing', T.skills.gain.junk ?? 1, { silent: true });
    p.last = { junk: true, xp: gain };
    p.queue.pushChain([{ kind: 'xp', amount: gain.gained, bonus: gain.bonus, label: 'Junk', xpAfter: gain.totalAfter }]);
    p.flushSkillBars();
    p.flushRankUps();
    p.store.commit();
  });

  bus.on('FISH_ESCAPED', (ev) => {
    const f = p.state.fish;
    f.escapes += 1;
    f.streak = 0;
    p.state.stats.escapes = (p.state.stats.escapes || 0) + 1;
    p.skillXp('fishing', T.skills.gain.escape, { silent: true });
    p.flushSkillBars();
    const sp = speciesById(ev.speciesId);
    const known = !!f.species[ev.speciesId]?.n;
    p.last = { escaped: true, speciesId: ev.speciesId, name: known ? sp.name : '???', rarity: ev.rarity, sizeClass: ev.sizeClass, known };
    p.store.commit();
  });
}

export { SIZE_CLASSES };
