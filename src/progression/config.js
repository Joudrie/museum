// Every tuning number for the progression layer lives here and nowhere else
// (docs/PROGRESSION.md). Plain data, so it can later come from remote config:
// `applyOverrides(obj)` deep-merges a patch over the defaults at start-up.
// Rarity tiers: 1 Common, 2 Uncommon, 3 Rare, 4 Epic, 5 Legendary.

export const TUNING = {
  dayStartHour: 4, // the daily reset, local time
  clockSlackMs: 5 * 60 * 1000, // a clock this far behind the last one we saw is a rollback

  rank: {
    A: 38, // xpToNext(n) = round(A * n^1.6 + B), fitted to the section 3 time targets by tools/sim_progression.mjs
    B: 40,
    max: 50, // past this: Renown levels
    renownXp: null, // flat XP per Renown level; null = what rank 50 costs
  },

  // base XP (section 3)
  xp: {
    byRarity: [0, 5, 10, 25, 60, 250],
    newSpecies: 50,
    personalBest: 10,
    perfect: 5,
    firstTalk: 3,
    heart: 40,
    request: [20, 60],
    chunk: 2,
    location: 30,
    secret: 40,
    junk: 2,
    viewpoint: 25,
    forage: 2,
    task: 30,
    weekly: 150,
    giftLiked: 4,
    firstCatchOfDayMult: 2,
    // doing it well and doing it a lot pays more: a catch's XP grows with Fishing level and with the size of the fish; tasks and requests grow with rank
    skillLevelBonus: 0.065,
    sizeMult: { S: 0.85, M: 1, L: 1.15, XL: 1.4, Trophy: 2 },
    rankScale: 0.06,
  },

  // skills (levels 1 to 20); xpToNext(n) = round(A * n^1.5 + B)
  skills: {
    maxLevel: 20,
    curve: { fishing: { A: 6, B: 14 }, sailing: { A: 6, B: 14 }, exploring: { A: 5, B: 12 }, friendship: { A: 6, B: 12 }, foraging: { A: 4, B: 10 } },
    // skill XP per event
    gain: { catch: 4, catchByRarity: [0, 0, 2, 6, 14, 40], escape: 1, perfect: 3, sail: 6, chunk: 1, location: 8, secret: 12, viewpoint: 10, talk: 2, heart: 15, gift: 3, request: 6, forage: 3 },
  },

  // fishing
  fishing: {
    rarityWeights: [0, 60, 25, 10, 4, 1],
    bobberWait: 1, // multiplier on bite waits (the rods carry their own ranges)
    baseWindowMs: 1000,
    pity: {
      rareAfter: 25, // rolls without a Rare or better before the weight starts to ramp
      rampPerRoll: 0.18, // extra multiplier added per roll past the threshold on Rare+ weights
      epicAfter: 90,
      legendaryGuarantee: 15, // attempts under a legendary's conditions before it is certain
    },
    variants: { golden: 1 / 400, albino: 1 / 800, eventGhost: 1 / 40 },
    sizeClasses: [
      { id: 'S', upTo: -0.7 },
      { id: 'M', upTo: 0.3 },
      { id: 'L', upTo: 1.2 },
      { id: 'XL', upTo: 2.054 }, // 2.054 sd = top 2%
      { id: 'Trophy', upTo: Infinity },
    ],
    perfectSizeNudge: 0.45, // sd added to the size roll on a perfect catch
    hotspot: { everyHours: 2, rareMult: 2.5, radiusTiles: 2.2, perRegion: 2, frenzyMinutes: 3, frenzyPerDay: 2, frenzyBiteMs: 600 },
    guaranteedFirstCatchWindowMs: 2600,
    doubleCatchChance: 0.05,
    junkChance: 0.08,
    reel: { // the tension minigame (reel.js)
      baseSeconds: 4,
      maxSeconds: 18, // a fight never drags on past this
      perRarityHardness: [0, 0.55, 0.7, 0.85, 1.0, 1.15],
    },
  },

  // friendship (section 7)
  friendship: {
    maxHearts: 10,
    pointsPerHeart: 100,
    firstTalkPoints: 8,
    likedPoints: 30,
    lovedPoints: 60,
    dislikedPoints: -15,
    requestPoints: 50,
    birthdayMult: 3,
    giftsPerDay: 1,
    requestsPerDay: 3,
    requestsPerDaySub: 4,
  },

  // tasks and the weekly rhythm (section 11)
  tasks: { perDay: 3, rerolls: 1, chestGold: 120, weeklySteps: 7, weeklyChestGold: 400 },
  streak: { shieldsMax: 2, shieldEvery: 7, milestones: [7, 14, 30, 60, 100], calendarDays: 7 },
  login: { gold: [30, 40, 50, 60, 80, 100, 0], day7Cosmetic: true },

  // return hooks (section 12)
  rested: { fullAfterHours: 48, maxOfflineHours: 72, mult: 2, minAwayHours: 1 },
  away: { cardAfterHours: 20, maxDays: 3, giftGold: [40, 120] },
  stuckMinutes: 5,

  // economy (section 9): targets the sim checks. gold earned per active hour at rank
  economy: {
    goldPerHour: { 1: 400, 5: 900, 10: 1000, 25: 950, 50: 1000 }, // the casual profile's measured earn rate per active hour (tools/sim_progression.mjs); the shop ladder is priced from it
    nextPurchaseMinutes: [20, 40],
    sellMult: 0.5,
    skillValueBonus: 0.03, // fish are worth more as Fishing grows
    sizeValueMult: { S: 0.8, M: 1, L: 1.25, XL: 1.6, Trophy: 2.4 },
    variantValueMult: { golden: 5, albino: 8, ghost: 6 },
    rarityValue: [0, 8, 20, 55, 140, 500],
  },

  // subscription: gating is by region and content breadth, never power. `enforce` stays false until a payment
  // path exists; the lock UI, the validator and the sim all work with it on.
  sub: { enforce: false },

  seasons: { monthlyDropDay: 1 },

  telemetryMax: 400,
};

export function applyOverrides(patch, target = TUNING) {
  Object.entries(patch || {}).forEach(([k, v]) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') applyOverrides(v, target[k]);
    else target[k] = v;
  });
  return target;
}
