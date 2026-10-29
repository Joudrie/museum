// Every economy number in one place, so they are easy to change.
// Defaults are guesses waiting for the user's say (see "Needs Sean" in docs/TODO.md).

// Curator's Office: gold to reach each level, rooms allowed, and what it unlocks.
// Index = level; level 1 is where you start.
export const OFFICE_LEVELS = [
  null,
  { cost: 0, rooms: 4 },
  { cost: 500, rooms: 6, unlocks: 'Relics, statues, suits of armor and the coffee counter' },
  { cost: 2000, rooms: 9, unlocks: 'Big halls, science exhibits and fountains' },
  { cost: 8000, rooms: 13, unlocks: 'The T-rex skeleton' },
  { cost: 30000, rooms: Infinity, unlocks: 'Unlimited rooms' },
];

// Hiring.
export const JANITOR = { base: 100, growth: 1.6 }; // next janitor: base x growth^hired
export const GUIDE = { base: 300, growth: 1.7, boost: 0.1 }; // boost = income per guide
export const CARPENTER_COST = 300;

// Break-room upgrades, bought on the staff board. cost[n] buys level n+1.
// effect[n] is the value at level n+1 (level 0 uses `base`).
export const UPGRADES = {
  mops: {
    name: 'Better mops',
    blurb: 'Rooms without a janitor get messy more slowly',
    base: 90, // minutes between new spots
    cost: [250, 700, 1800],
    effect: [120, 160, 220],
    show: (v) => `a new mess every ${v} min`,
  },
  training: {
    name: 'Guide training',
    blurb: 'Each tour guide earns the museum more',
    base: GUIDE.boost,
    cost: [400, 1100, 2800],
    effect: [0.12, 0.15, 0.2],
    show: (v) => `+${Math.round(v * 100)}% income per guide`,
  },
  toolbox: {
    name: 'Carpenter’s toolbox',
    blurb: 'A hired carpenter gets new rooms built for less',
    base: 0, // fraction off the room price
    cost: [350, 900, 2200],
    effect: [0.1, 0.2, 0.3],
    show: (v) => (v ? `rooms cost ${Math.round(v * 100)}% less` : 'no discount yet'),
  },
};

// Income: gold piles up for at most this many hours before you collect.
export const OFFLINE_CAP_H = 8;
export const PAINTING_INCOME = 5; // gold per hour per hung painting
export const DIRT_PENALTY = 0.1; // each mess: -10% room income
export const VISITORS = { base: 50, perPainting: 150, perDecor: 25, ratingLow: 0.6, ratingSpan: 0.8 };
export const COFFEE_VISITORS_PER_GOLD = 100; // a counter earns 1 gold/hr per this many monthly visitors

// Security.
export const CAMERA_COST = 400;
export const ROBBERY = { awayMs: 60 * 60 * 1000, chance: 0.04 };
