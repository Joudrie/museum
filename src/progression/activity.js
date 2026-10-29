// What walking about, finding things and sailing are worth: exploring, foraging and sailing skill,
// rank XP, journal stamps (places, secrets) and the legendary trail's clue step. Gameplay emits the
// event; this decides what it moves.
import { stamp, checkMilestones } from './journal.js';
import { grant } from './grants.js';
import { LEGENDS, REGIONS } from './species.js';

export function installActivity(p) {
  const { bus, T } = p;
  const mile = (page) => checkMilestones(p, page, (r) => grant(p, r, T)).forEach((m) => p.queue.push({ kind: 'milestone', page: m.page, pct: m.pct, rewards: m.rewards }));
  const has = (k) => p.perks().has(k);

  bus.on('TILE_REVEALED', (ev) => {
    const { region } = ev;
    const s = p.state;
    let count = ev.count;
    if (ev.chunks) {
      // the world layer reports which chunks the player's walking has cleared; only new ones count
      const seen = (s.world.chunks[region] ||= {});
      count = 0;
      ev.chunks.forEach((k) => {
        if (!seen[k]) {
          seen[k] = true;
          count++;
        }
      });
      if (!count) return;
    }
    s.stats.chunks += count;
    p.xpQuiet(T.xp.chunk * count, 'map');
    p.skillXp('exploring', T.skills.gain.chunk * count, { silent: true });
    // fog clears further out with Map sense; the world layer reads this
    p.noteProgress();
    p.flushSkillBars();
    p.store.commit();
  });

  bus.on('LOCATION_DISCOVERED', ({ region, placeId, name }) => {
    const s = p.state;
    if (s.world.locations[placeId]) return;
    s.world.locations[placeId] = { at: p.clock.now(), region, name: name || placeId.split(':')[1] };
    stamp(p, 'places', placeId, { region, name });
    const g = p.xp(T.xp.location * (has('exploring.pathfinder') ? 2 : 1), 'place', { silent: true });
    p.skillXp('exploring', T.skills.gain.location * (has('exploring.pathfinder') ? 2 : 1), { silent: true });
    p.queue.pushChain([{ kind: 'xp', amount: g.gained, bonus: g.bonus, label: 'New place', xpAfter: g.totalAfter }, { kind: 'item', title: name || 'New place', sub: `${REGIONS[region]?.name || ''}. Added to Places.` }]);
    p.flushSkillBars();
    p.flushRankUps();
    mile('places');
    p.telemetry.track('journal_pct', { page: 'places' });
    p.store.commit();
  });

  bus.on('SECRET_FOUND', ({ region, secretId, name }) => {
    const s = p.state;
    if (s.world.secrets[secretId]) return;
    s.world.secrets[secretId] = { at: p.clock.now(), region, name: name || 'A secret' };
    s.stats.secrets += 1;
    stamp(p, 'secrets', secretId, { region, name });
    const g = p.xp(T.xp.secret, 'secret', { silent: true });
    p.skillXp('exploring', T.skills.gain.secret, { silent: true });
    const chain = [{ kind: 'xp', amount: g.gained, bonus: g.bonus, label: 'Secret', xpAfter: g.totalAfter }, { kind: 'item', title: name || 'A secret', sub: 'Added to Secrets.' }];
    // a clue on a legendary's trail
    const lid = Object.keys(LEGENDS).find((id) => LEGENDS[id].clue.secret === secretId.replace(/^[^:]*:/, '') || LEGENDS[id].clue.secret === secretId);
    if (lid) {
      const trail = (s.journal.leads[`legend:${lid}`] ||= { stage: 'none' });
      if (trail.stage === 'none' || trail.stage === 'rumor') {
        trail.stage = 'clue';
        trail.clueAt = p.clock.now();
        chain.push({ kind: 'unlock', title: 'A clue', sub: LEGENDS[lid].clue.text, rarity: 5 });
        p.telemetry.track('journal_pct', { page: 'trail', id: lid });
      }
    }
    p.queue.pushChain(chain);
    p.flushSkillBars();
    p.flushRankUps();
    mile('secrets');
    p.store.commit();
  });

  bus.on('ITEM_FORAGED', ({ itemId, region }) => {
    const s = p.state;
    const bonus = has('foraging.yield1') ? 1 : 0;
    const double = has('foraging.double_forage') && p.rng.chance(0.1) ? 1 : 0;
    s.gifts.stock[itemId] = (s.gifts.stock[itemId] || 0) + 1 + bonus + double;
    s.stats.foraged += 1;
    p.xpQuiet(T.xp.forage * (has('foraging.bountiful') ? 2 : 1), 'pickup');
    p.skillXp('foraging', T.skills.gain.forage, { silent: true });
    p.flushSkillBars();
    p.store.commit();
  });

  bus.on('TRAVERSAL_USED', () => {
    const s = p.state;
    s.stats.sailed += 1;
    const mult = has('sailing.convoy') ? 2 : 1;
    p.skillXp('sailing', T.skills.gain.sail * mult, { silent: true });
    const g = p.xp(3, 'sail', { silent: true });
    p.queue.push({ kind: 'xp', amount: g.gained, bonus: g.bonus, label: 'Sailed', xpAfter: g.totalAfter });
    p.flushSkillBars();
    p.flushRankUps();
    p.store.commit();
  });

  bus.on('VIEWPOINT', ({ region, id }) => {
    const s = p.state;
    if (s.world.viewpoints[id]) return;
    s.world.viewpoints[id] = { at: p.clock.now(), region };
    const g = p.xp(T.xp.viewpoint * (has('exploring.viewpoint_xp') ? 2 : 1), 'viewpoint', { silent: true });
    p.skillXp('exploring', T.skills.gain.viewpoint, { silent: true });
    p.queue.pushChain([{ kind: 'xp', amount: g.gained, bonus: g.bonus, label: 'Viewpoint', xpAfter: g.totalAfter }]);
    p.flushSkillBars();
    p.flushRankUps();
    p.store.commit();
  });

  bus.on('PURCHASE', ({ itemId, price, kind }) => {
    p.state.stats.purchases += 1;
    p.telemetry.track('purchase', { itemId, price, kind });
    p.noteProgress();
  });

  bus.on('SESSION_TICK', ({ dtMs }) => {
    // a small trickle of quiet XP is shown every so often, not only when it is big
    p.quietMs = (p.quietMs || 0) + (dtMs || 0);
    if (p.quietMs >= 15000) {
      p.quietMs = 0;
      p.flushQuiet();
      p.flushSkillBars();
    }
  });
}
