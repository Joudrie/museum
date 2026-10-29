// The event bus. Gameplay code only emits typed events; ProgressionService
// subscribes and routes them. Handlers run in the order they subscribed and a
// handler that throws never stops the others.

// type -> the payload keys it should carry (a missing key warns in dev, never throws)
export const EVENTS = {
  FISH_CAUGHT: ['speciesId', 'size', 'sizeClass', 'rarity', 'variant', 'spotId', 'perfect'],
  FISH_ESCAPED: ['speciesId', 'sizeClass', 'rarity'],
  JUNK_CAUGHT: ['itemId'],
  NPC_TALKED: ['npcId'],
  GIFT_GIVEN: ['npcId', 'itemId'],
  TILE_REVEALED: ['region', 'count'],
  LOCATION_DISCOVERED: ['region', 'placeId'],
  SECRET_FOUND: ['region', 'secretId'],
  ITEM_FORAGED: ['itemId', 'region'],
  TRAVERSAL_USED: ['kind', 'region'],
  PURCHASE: ['itemId', 'price'],
  SESSION_START: [],
  SESSION_END: [],
  // raised by the service itself, so UI and telemetry can listen without reaching in
  REQUEST_DONE: ['npcId'],
  TASK_DONE: ['taskId'],
  HEART_UP: ['npcId', 'hearts'],
  RANK_UP: ['rank'],
  SKILL_UP: ['skill', 'level'],
  VIEWPOINT: ['region', 'id'],
  EMOTE_SEEN: ['emoteId'],
  SESSION_TICK: [],
  WEATHER_SEEN: ['weather'],
};

export function createBus({ strict = false } = {}) {
  const subs = new Map();
  const log = [];
  const bus = {
    on(type, fn) {
      if (!EVENTS[type]) throw new Error(`unknown event ${type}`);
      if (!subs.has(type)) subs.set(type, []);
      subs.get(type).push(fn);
      return () => subs.set(type, subs.get(type).filter((f) => f !== fn));
    },
    emit(type, payload = {}) {
      const keys = EVENTS[type];
      if (!keys) {
        if (strict) throw new Error(`unknown event ${type}`);
        console.warn('[bus] unknown event', type);
        return;
      }
      const missing = keys.filter((k) => payload[k] === undefined);
      if (missing.length) {
        if (strict) throw new Error(`${type} is missing ${missing.join(', ')}`);
        console.warn(`[bus] ${type} is missing ${missing.join(', ')}`);
      }
      log.push({ type, payload });
      if (log.length > 60) log.shift();
      (subs.get(type) || []).slice().forEach((fn) => {
        try {
          fn(payload, type);
        } catch (err) {
          console.error(`[bus] handler for ${type} threw`, err);
          if (strict) throw err;
        }
      });
    },
    recent: () => log.slice(),
    count: (type) => (subs.get(type) || []).length,
    types: () => Object.keys(EVENTS),
  };
  return bus;
}

export const bus = createBus();
export const emit = (type, payload) => bus.emit(type, payload);
export const on = (type, fn) => bus.on(type, fn);
