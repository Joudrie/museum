// The progression layer's bus (src/progression/bus.js) into the measurement log. Node-safe.
import { emit } from './events.js';
import { bus } from '../progression/bus.js';

// The layer's bus event → this log's event, kept small (the log holds 4,000).
const LAYER = {
  FISH_CAUGHT: (e) => ['catch', { sp: e.speciesId, r: e.rarity, cls: e.sizeClass, v: e.variant || '', reg: e.region, w: e.water, perfect: !!e.perfect, via: e.via, bait: e.bait || '', hot: !!e.hot }],
  FISH_ESCAPED: (e) => ['escape', { sp: e.speciesId, r: e.rarity, cls: e.sizeClass }],
  JUNK_CAUGHT: () => ['junk', {}],
  NPC_TALKED: (e) => ['npc_talk', { npc: e.npcId, kind: e.kind }],
  GIFT_GIVEN: (e) => ['gift_given', { npc: e.npcId, item: e.itemId }],
  TILE_REVEALED: (e) => ['chunks', { reg: e.region, n: e.count }],
  LOCATION_DISCOVERED: (e) => ['place_found', { reg: e.region, place: e.placeId }],
  SECRET_FOUND: (e) => ['secret_found', { reg: e.region, secret: e.secretId }],
  ITEM_FORAGED: (e) => ['forage', { item: e.itemId, reg: e.region }],
  TRAVERSAL_USED: (e) => ['sail', { kind: e.kind, reg: e.region }],
  PURCHASE: (e) => ['purchase', { item: e.itemId, price: e.price, kind: e.kind }],
  VIEWPOINT: (e) => ['viewpoint', { reg: e.region, id: e.id }],
  EMOTE_SEEN: (e) => ['emote_seen', { id: e.emoteId }],
  RANK_UP: (e) => ['rank_up', { rank: e.rank }],
  SKILL_UP: (e) => ['skill_up', { skill: e.skill, level: e.level }],
  HEART_UP: (e) => ['heart_up', { npc: e.npcId, hearts: e.hearts }],
  TASK_DONE: (e) => ['task_done', { id: e.taskId }],
  REQUEST_DONE: (e) => ['request_done', { npc: e.npcId }],
};
export function layerEvents(b = bus) {
  Object.entries(LAYER).forEach(([type, map]) => {
    if (!b.types().includes(type)) return;
    b.on(type, (payload) => {
      const [t, data] = map(payload || {});
      emit(t, data);
    });
  });
}
