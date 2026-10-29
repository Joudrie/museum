// The progression save: one key, a version, and migrations. The store keeps the
// state in memory and writes it through on commit() (the service commits after
// every reward). In the browser it uses storage.js; Node (tests, the sim) gets
// an in-memory store.
export const SAVE_KEY = 'curation.progress';
export const SCHEMA_VERSION = 2;

export const SKILL_IDS = ['fishing', 'sailing', 'exploring', 'friendship', 'foraging'];

export function defaults(now = 0) {
  return {
    v: SCHEMA_VERSION,
    installAt: now,
    sessions: 0,
    lastSeenAt: now,
    lastDay: 0,
    playMs: 0,
    rank: { xp: 0 },
    rested: { pool: 0, awayCredited: 0 },
    skills: Object.fromEntries(SKILL_IDS.map((s) => [s, 0])),
    fish: {
      rolls: 0,
      catches: 0,
      escapes: 0,
      heaviest: 0,
      bestStreak: 0,
      streak: 0,
      firstCatchDay: 0,
      doubles: 0,
      // pity counters live here, never reset by a reload
      pity: { rare: 0, epic: 0, legend: {} },
      species: {}, // slug -> { n, bestSize, bestClass, variants:{}, first:{ at, region, day } }
      nightCatches: 0,
      equipped: { rod: 'basic', bait: '', lure: '' },
      baits: {}, // baitId -> count
      lures: {}, // lureId -> count
      rods: { basic: true },
      bag: [], // caught fish waiting to be sold: { id, size, sizeClass, variant, value, at }
      trophies: [], // the best Trophy-class catches kept for the wall
      pending: null, // a cast that was pre-rolled (shadow) and not yet resolved
      hot: {}, // region -> { slot, spots:[…] }
      frenzy: {}, // day -> [minuteOfDay,…]
      weeklyRumor: null,
    },
    journal: {
      stamps: {}, // pageId:entryId -> { at, where, day }
      viewed: {}, // pageId:entryId -> true once opened
      milestones: {}, // pageId -> highest of 25/50/75/100 paid
      leads: {}, // leadId -> { at, state: 'open' | 'done' }
      hintsBought: {}, // entryId -> 3 (highest hint level unlocked by gold)
      emotes: {}, // emoteId -> { at, from }
      records: { firstCatchAt: 0, firstFriendAt: 0, firstFriend: '', snowSteps: 0, steps: 0 },
    },
    friends: {}, // npcId -> { points, hearts, talkDay, giftDay, reactions:{ itemId: 'love'|'like'|'neutral'|'hate' }, unlocks:{}, met: ms }
    gifts: { stock: {} }, // itemId -> count the player holds as gifts
    tasks: { day: 0, list: [], rerolled: 0, chest: false, allDone: false, week: 0, weekly: { steps: [], chain: 0, claimed: false, rumor: null, derby: null }, done: 0 },
    requests: { day: 0, list: [], doneToday: 0, total: 0 },
    streak: { count: 0, best: 0, shields: 0, lastDay: 0, milestone: 0, cycleDay: 0, cycleClaimedDay: 0, protected: 0, broke: 0 },
    world: {
      chunks: {}, // region -> { "cx,cy": true }
      locations: {}, // placeId -> { at, region }
      secrets: {}, // secretId -> { at, region }
      viewpoints: {},
      locks: {}, // lockId -> { seen: true, opened: bool }
      forage: {}, // day -> { itemKey: true } picked up
      traversal: {}, // ladder rung id -> true when earned
      regionsSeen: {},
    },
    market: { stock: { day: 0, items: [] }, owned: {}, bought: {}, spent: 0, sellBonus: 0, simGold: 0, equipped: { hat: '', outfit: '', title: '', frame: '', rodSkin: '', boatPaint: '' } },
    house: { rooms: { porch: true }, mounts: [], tanks: 1, aquarium: [] },
    events: {}, // eventId -> { tokens, claimed:{ tier: true }, joined: ms }
    titles: {},
    renown: { tokens: 0 },
    flags: { firstHour: {}, introduced: {}, paywallSeen: {}, notify: false },
    unlocks: {}, // 'rod:cork', 'boat:sailboat', 'recipe:x' … everything a rank, skill or purchase has opened
    pinned: null, // goal id the player pinned
    away: { lastCardAt: 0, mail: null },
    sub: { active: false, since: 0, ever: false },
    telemetry: { installSent: false, first: {}, lastAction: '', rankMinutes: {} },
    stats: { catches: 0, talks: 0, gifts: 0, requests: 0, tasksDone: 0, secrets: 0, chunks: 0, purchases: 0, sold: 0, sailed: 0, foraged: 0, fastTravel: 0 },
  };
}

// Migrations: migrations[n] takes a v(n) save to v(n+1). Never edit an old one.
export const migrations = {
  1: (s) => {
    // v1 had no friends gifts stock, house or sub; add what is missing and keep everything else
    const d = defaults(s.installAt || 0);
    return { ...d, ...s, house: s.house || d.house, sub: s.sub || d.sub, gifts: s.gifts || d.gifts, v: 2 };
  },
};

const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
// Fills anything missing from the defaults (deeply) so older or damaged saves still load.
export function fill(raw, base) {
  if (Array.isArray(base)) return Array.isArray(raw) ? raw : base;
  if (base === null) return raw === undefined ? null : raw;
  if (!isObj(base)) return raw === undefined || typeof raw !== typeof base ? base : raw;
  const src = isObj(raw) ? raw : {};
  const out = {};
  Object.keys(base).forEach((k) => {
    const b = base[k];
    // maps keyed by id (objects with no fixed shape) keep whatever was saved
    if (isObj(b) && Object.keys(b).length === 0) out[k] = isObj(src[k]) ? src[k] : b;
    else out[k] = fill(src[k], b);
  });
  Object.keys(src).forEach((k) => {
    if (!(k in out)) out[k] = src[k];
  });
  return out;
}

export function migrate(raw, now = 0) {
  if (!isObj(raw)) return defaults(now);
  let s = raw;
  let v = Number.isInteger(s.v) ? s.v : 1;
  if (v > SCHEMA_VERSION) return fill(s, defaults(now)); // a newer save: keep it, fill nothing destructive
  while (v < SCHEMA_VERSION) {
    s = migrations[v] ? migrations[v](s) : { ...s, v: v + 1 };
    v = s.v;
  }
  return fill(s, defaults(now));
}

export function memoryAdapter(initial = null) {
  let blob = initial ? JSON.stringify(initial) : null;
  return {
    read: () => (blob ? JSON.parse(blob) : null),
    write: (v) => {
      blob = JSON.stringify(v);
    },
    raw: () => blob,
  };
}

export async function browserAdapter() {
  const { load, save } = await import('../storage.js');
  return { read: () => load(SAVE_KEY, null), write: (v) => save(SAVE_KEY, v) };
}

export function createStore(adapter = memoryAdapter(), { now = 0 } = {}) {
  let state = migrate(adapter.read(), now);
  let dirty = false;
  const listeners = new Set();
  return {
    get state() {
      return state;
    },
    commit() {
      dirty = true;
      adapter.write(state);
      dirty = false;
      listeners.forEach((fn) => fn(state));
    },
    onCommit(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    reset(now2 = now) {
      state = defaults(now2);
      adapter.write(state);
    },
    replace(next) {
      state = migrate(next);
      adapter.write(state);
    },
    get dirty() {
      return dirty;
    },
  };
}
