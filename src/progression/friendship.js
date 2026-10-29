// Friendship: named people have 0 to 10 hearts. Hearts come from the first talk of a day, gifts
// (liked, loved, disliked) and requests. Preferences stay hidden and show as reactions: a heart
// emote is loved, a star is liked, "..." is neutral, a sweat drop is disliked. Every heart opens
// something. No heart ever decays.
import { TUNING } from './config.js';
import NPCS from './data/npcs.json' with { type: 'json' };
import GIFTS from './data/gifts.json' with { type: 'json' };
import DIALOGUE from './data/dialogue.json' with { type: 'json' };
import { stamp, checkMilestones } from './journal.js';
import { grant } from './grants.js';
import { allSpecies, speciesById, LEGENDS, REGIONS, hintsFor } from './species.js';

export { NPCS, GIFTS, DIALOGUE };
export const npcById = (id) => NPCS.find((n) => n.id === id) || null;
export const EMOTE_FOR = { love: 'heart', like: 'star', neutral: 'dots', hate: 'sweat' };
const POINTS = (T) => ({ love: T.friendship.lovedPoints, like: T.friendship.likedPoints, neutral: T.friendship.firstTalkPoints / 2, hate: T.friendship.dislikedPoints });

export const heartsOf = (state, id) => state.friends[id]?.hearts || 0;
export const tierOf = (h) => (h >= 10 ? 'max' : h >= 6 ? 'high' : h >= 3 ? 'mid' : 'low');

/** How an NPC feels about an item id ('gift:tea', 'fish:carp'): love, like, hate or neutral. */
export function reactionTo(npc, itemId) {
  if (npc.loves?.includes(itemId)) return 'love';
  if (npc.likes?.includes(itemId)) return 'like';
  if (npc.hates?.includes(itemId)) return 'hate';
  return 'neutral';
}

const DAY = (p) => p.today();
const isBirthday = (npc, now) => {
  const d = new Date(now);
  return npc.birthday && d.getMonth() + 1 === npc.birthday[0] && d.getDate() === npc.birthday[1];
};

export function installFriendship(p) {
  const { bus, T } = p;
  const F = T.friendship;
  const has = (k) => p.perks().has(k);
  const rec = (id) => (p.state.friends[id] ||= { points: 0, hearts: 0, talkDay: 0, giftDay: 0, reactions: {}, unlocks: {}, met: 0, shares: '' });

  function meet(npc) {
    const f = rec(npc.id);
    if (f.met) return f;
    f.met = p.clock.now();
    stamp(p, 'people', npc.id, { region: npc.region, name: npc.name });
    const j = p.state.journal.records;
    if (!j.firstFriend) {
      j.firstFriend = npc.name;
      j.firstFriendAt = p.clock.now();
    }
    return f;
  }

  /** Adds points; hearts only ever go up. Returns the list of hearts newly reached. */
  function addPoints(npc, n) {
    const f = rec(npc.id);
    let v = n;
    if (v > 0 && has('friendship.heart_speed')) v *= 1.1;
    const floor = f.hearts * F.pointsPerHeart;
    f.points = Math.max(floor, f.points + v);
    const maxPts = F.maxHearts * F.pointsPerHeart;
    f.points = Math.min(maxPts, f.points);
    const reached = [];
    const now = Math.min(F.maxHearts, Math.floor(f.points / F.pointsPerHeart));
    for (let h = f.hearts + 1; h <= now; h++) reached.push(h);
    f.hearts = Math.max(f.hearts, now);
    return reached;
  }

  function heartUp(npc, h) {
    const f = rec(npc.id);
    const g = p.xp(T.xp.heart, 'heart', { silent: true });
    p.skillXp('friendship', T.skills.gain.heart, { silent: true });
    const u = unlock(npc, h, f);
    p.telemetry.track('heart_up', { npc: npc.id, hearts: h });
    bus.emit('HEART_UP', { npcId: npc.id, hearts: h });
    p.queue.pushChain([
      { kind: 'xp', amount: g.gained, bonus: g.bonus, label: `${npc.name} ${h}♥`, xpAfter: g.totalAfter },
      { kind: 'heart', title: `${npc.name}: ${h} heart${h > 1 ? 's' : ''}`, sub: u.text, rewards: u.rewards || [] },
    ]);
    p.flushSkillBars();
    p.flushRankUps();
    checkMilestones(p, 'people', (r) => grant(p, r, T)).forEach((m) => p.queue.push({ kind: 'milestone', page: m.page, pct: m.pct, rewards: m.rewards }));
  }

  // what each heart opens
  function unlock(npc, h, f) {
    const kind = { 1: 'dialogue', 2: 'rumor', 3: 'recipe', 4: 'emote', 5: 'favor', 6: 'dialogue', 7: 'rumor', 8: 'map', 9: 'dialogue', 10: 'quest' }[h];
    f.unlocks[`h${h}`] = kind;
    if (kind === 'dialogue') return { text: 'They have something new to say.' };
    if (kind === 'rumor') {
      const r = rumorFor(npc, h);
      return { text: r ? r.text : 'They share a tip about the water.' };
    }
    if (kind === 'recipe') {
      const id = REGIONS[npc.region]?.zone === 'arctic' ? 'snowchum' : 'berrypaste';
      p.state.unlocks[`recipe:${id}`] = true;
      const lr = rumorFor(npc, 3, true); // a rumour-giver's big story comes out at three hearts
      if (lr?.legend) p.queue.push({ kind: 'unlock', title: 'A rumour', sub: lr.text, rarity: 5 });
      return { text: `They teach you a bait recipe: ${id === 'snowchum' ? 'snow chum' : 'berry paste'}.` };
    }
    if (kind === 'emote') return { text: `They greet you with a ${npc.emote === 'bang' ? '!' : npc.emote} now.` };
    if (kind === 'favor') {
      const rewards = grant(p, [{ bait: ['goldenfly', 1] }, { gold: 120 }], T);
      return { text: 'A favour: a golden fly and a little gold.', rewards };
    }
    if (kind === 'map') {
      bus.emit('TILE_REVEALED', { region: npc.region, count: 14 });
      return { text: 'They sketch you a map of the shore. Fog clears.' };
    }
    if (kind === 'quest') {
      f.quest = { step: 0, items: npc.questItems.slice(), done: false };
      return { text: `${npc.name} has a personal request for you. Their rare line is yours.` };
    }
    return { text: '' };
  }

  // a fish rumour: hint 2 for a species this person's region holds that you have not caught
  function rumorFor(npc, h, legendOnly = false) {
    const f = rec(npc.id);
    const legend = Object.entries(LEGENDS).find(([, l]) => l.rumorFrom === npc.id);
    if (legend && h >= 3) {
      const trail = (p.state.journal.leads[`legend:${legend[0]}`] ||= { stage: 'none' });
      if (trail.stage === 'none') {
        trail.stage = 'rumor';
        trail.at = p.clock.now();
        trail.from = npc.id;
        f.shares = legend[0];
        return { text: legend[1].rumor, legend: legend[0] };
      }
    }
    if (legendOnly) return null;
    const left = allSpecies().filter((s) => s.rarity < 5 && s.regions.includes(npc.region) && !p.state.fish.species[s.id]?.n && !p.state.journal.leads[`rumor:${s.id}`]);
    if (!left.length) return null;
    const sp = left[p.rngFor(`rumor:${npc.id}:${h}`).int(left.length)];
    p.state.journal.leads[`rumor:${sp.id}`] = { at: p.clock.now(), from: npc.id, state: 'open' };
    f.shares = sp.id;
    const hint = hintsFor(sp)[1];
    const line = DIALOGUE.rumorLines[h % DIALOGUE.rumorLines.length].replace('{where}', REGIONS[npc.region]?.name || 'the shore').replace('{name}', 'something').replace('{hint}', hint);
    return { text: line, species: sp.id };
  }

  bus.on('NPC_TALKED', ({ npcId, kind }) => {
    const npc = npcById(npcId);
    if (!npc) {
      // an unnamed islander still counts as a talk: a little XP and Friendship skill
      p.state.stats.talks += 1;
      p.skillXp('friendship', T.skills.gain.talk, { silent: true });
      p.flushSkillBars();
      p.store.commit();
      return;
    }
    const s = p.state;
    const f = meet(npc);
    s.stats.talks += 1;
    const today = DAY(p);
    const first = f.talkDay !== today;
    let reached = [];
    let xpGain = null;
    if (first) {
      f.talkDay = today;
      let pts = F.firstTalkPoints * (has('friendship.first_talk_plus') ? 1.5 : 1);
      reached = addPoints(npc, pts);
      xpGain = p.xp(T.xp.firstTalk * (has('friendship.first_talk_plus') ? 2 : 1), 'talk', { silent: true });
    }
    p.skillXp('friendship', T.skills.gain.talk, { silent: true });
    // a legend's rumour-giver tells you at three hearts, or at once with a good ear
    const legend = Object.entries(LEGENDS).find(([, l]) => l.rumorFrom === npc.id);
    if (legend && (f.hearts >= 3 || has('friendship.rumors')) && (s.journal.leads[`legend:${legend[0]}`]?.stage || 'none') === 'none') {
      const r = rumorFor(npc, Math.max(3, f.hearts));
      if (r?.legend) p.queue.push({ kind: 'unlock', title: 'A rumour', sub: r.text, rarity: 5 });
    }
    // the Good ear perk: now and then they share a fish rumour
    if (first && has('friendship.rumors') && !legend && p.rng.chance(0.4)) {
      const r = rumorFor(npc, f.hearts + 1);
      if (r?.species) p.queue.push({ kind: 'item', title: `${npc.name} has a tip`, sub: r.text });
    }
    const chain = [];
    if (xpGain) chain.push({ kind: 'xp', amount: xpGain.gained, bonus: xpGain.bonus, label: npc.name, xpAfter: xpGain.totalAfter });
    if (chain.length) p.queue.pushChain(chain);
    p.flushSkillBars();
    p.flushRankUps();
    reached.forEach((h) => heartUp(npc, h));
    p.state.lastTalk = { npcId, first, hearts: f.hearts };
    p.store.commit();
  });

  bus.on('GIFT_GIVEN', ({ npcId, itemId }) => {
    const npc = npcById(npcId);
    const s = p.state;
    p.lastGift = null;
    if (!npc) return;
    const f = meet(npc);
    const reaction = reactionTo(npc, itemId);
    let pts = POINTS(T)[reaction];
    if (pts > 0 && has('friendship.good_listener') && reaction === 'like') pts *= 1.25;
    if (isBirthday(npc, p.clock.now()) && pts > 0) pts *= F.birthdayMult;
    f.reactions[itemId] = reaction;
    f.giftDay = DAY(p);
    s.stats.gifts += 1;
    s.stats.giftsByNpc = s.stats.giftsByNpc || {};
    const reached = addPoints(npc, pts);
    const g = p.xp(T.xp.giftLiked * (reaction === 'love' ? 2 : reaction === 'like' ? 1 : 0), 'gift', { silent: true });
    p.skillXp('friendship', T.skills.gain.gift, { silent: true });
    if (reaction === 'love' || reaction === 'like') p.queue.pushChain([{ kind: 'xp', amount: g.gained, bonus: g.bonus, label: 'Gift', xpAfter: g.totalAfter }]);
    p.flushSkillBars();
    p.flushRankUps();
    reached.forEach((h) => heartUp(npc, h));
    // personal quest: bring the items one by one
    if (f.quest && !f.quest.done && f.quest.items[f.quest.step] === itemId) {
      f.quest.step += 1;
      if (f.quest.step >= f.quest.items.length) {
        f.quest.done = true;
        const got = grant(p, [{ title: `friend_${npc.id}` }, { gold: 400 }], T);
        p.queue.push({ kind: 'unlock', title: `${npc.name}'s story`, sub: 'Questline complete.', rewards: got, rarity: 4 });
      } else p.queue.push({ kind: 'item', title: npc.name, sub: 'One more to go.' });
    }
    const emoteId = EMOTE_FOR[reaction];
    p.lastGift = { npcId, itemId, reaction, emote: emoteId, points: pts, hearts: f.hearts, line: pickLine(DIALOGUE.reactions[reaction], npc.id + itemId + DAY(p)) };
    bus.emit('EMOTE_SEEN', { emoteId, from: npcId });
    p.store.commit();
  });

  bus.on('EMOTE_SEEN', ({ emoteId, from }) => {
    const j = p.state.journal;
    if (j.emotes[emoteId]) return;
    j.emotes[emoteId] = { at: p.clock.now(), from: from || '' };
    const st = stamp(p, 'emotes', emoteId, {});
    if (st.fresh) {
      p.queue.push({ kind: 'item', title: `Emote: ${emoteId}`, sub: 'Added to the journal.' });
      checkMilestones(p, 'emotes', (r) => grant(p, r, T)).forEach((m) => p.queue.push({ kind: 'milestone', page: m.page, pct: m.pct, rewards: m.rewards }));
    }
  });

  // ---- what the UI asks ----
  const mod = {
    name: 'friendship',
    install() {},
    /** Items the player can hand over: forage and shop gifts, then fish from the bag (one per species). */
    giftables() {
      const s = p.state;
      const out = [];
      Object.entries(s.gifts.stock).forEach(([id, n]) => n > 0 && GIFTS[id] && out.push({ id: `gift:${id}`, name: GIFTS[id].name, n }));
      const seen = new Set();
      s.fish.bag.forEach((b) => {
        if (seen.has(b.id)) return;
        seen.add(b.id);
        const sp = speciesById(b.id);
        out.push({ id: `fish:${b.id}`, name: sp?.name || b.id, n: s.fish.bag.filter((x) => x.id === b.id).length });
      });
      return out;
    },
    canGift(npcId) {
      const f = p.state.friends[npcId];
      return !f || f.giftDay !== DAY(p);
    },
    /** Hand over an item. Returns { ok, reason?, ...lastGift }. */
    give(npcId, itemId) {
      const npc = npcById(npcId);
      const s = p.state;
      if (!npc) return { ok: false, reason: 'nobody' };
      if (!mod.canGift(npcId)) return { ok: false, reason: 'today' };
      if (itemId.startsWith('gift:')) {
        const k = itemId.slice(5);
        if (!(s.gifts.stock[k] > 0)) return { ok: false, reason: 'none' };
        s.gifts.stock[k] -= 1;
      } else {
        const i = s.fish.bag.findIndex((b) => `fish:${b.id}` === itemId);
        if (i < 0) return { ok: false, reason: 'none' };
        s.fish.bag.splice(i, 1);
      }
      bus.emit('GIFT_GIVEN', { npcId, itemId });
      return { ok: true, ...p.lastGift };
    },
    /** What they say now, by hearts. The line changes each day, and the maxed rare line shows at ten hearts. */
    greeting(npcId) {
      const npc = npcById(npcId);
      const h = heartsOf(p.state, npcId);
      const pool = DIALOGUE.kinds[npc?.kind]?.[tierOf(h)] || ['Hello.'];
      if (h >= 10 && npc?.line) return npc.line;
      return pickLine(pool, npcId + DAY(p) + h);
    },
    /** An unnamed reader on a bench trades a rumour: hint two for a fish nobody has told you about. */
    ambientRumor(region) {
      const left = allSpecies().filter((s) => s.rarity < 5 && !s.event && s.regions.includes(region) && !p.state.fish.species[s.id]?.n && !p.state.journal.leads[`rumor:${s.id}`]);
      if (!left.length) return null;
      const sp = left[p.rng.int(left.length)];
      p.state.journal.leads[`rumor:${sp.id}`] = { at: p.clock.now(), from: 'bench', state: 'open' };
      p.store.commit();
      return hintsFor(sp)[1];
    },
    heartsOf: (id) => heartsOf(p.state, id),
    reactions: (id) => p.state.friends[id]?.reactions || {},
    /** The icon hint for gift sense: a small heart over things they love (Friendship 6). */
    giftHint(npcId, itemId) {
      if (!has('friendship.gift_hints')) return '';
      const npc = npcById(npcId);
      const r = npc ? reactionTo(npc, itemId) : 'neutral';
      return r === 'love' ? '♥' : r === 'like' ? '★' : r === 'hate' ? '💧' : '';
    },
    addPoints(npcId, n) {
      const npc = npcById(npcId);
      if (!npc) return [];
      meet(npc);
      const reached = addPoints(npc, n);
      reached.forEach((h) => heartUp(npc, h));
      return reached;
    },
  };
  p.mods.friendship = mod;
  p.friendship = mod;
}

function pickLine(pool, key) {
  let h = 0;
  for (let i = 0; i < String(key).length; i++) h = (h * 31 + String(key).charCodeAt(i)) >>> 0;
  return pool[h % pool.length];
}

export const friendshipModule = { name: 'friendship-install', install: installFriendship };
