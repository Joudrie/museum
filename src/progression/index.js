// The browser side of the progression layer: builds the one ProgressionService
// for this page, connects it to the wallet, the codex and the screen, and keeps
// it saved. Everything else imports { progression } from here.
import './ui/progression.css';
import { load, save } from '../storage.js';
import { coins, addCoins } from '../wallet.js';
import { collect, snapshot } from '../collections/codex.js';
import { hourNow } from '../settings.js';
import { createStore, SAVE_KEY } from './store.js';
import { createClock } from './clock.js';
import { createProgression } from './service.js';
import { createRewardQueue } from './rewardqueue.js';
import { standardModules } from './modules.js';
import { present, mountLayer, refreshPill, syncPill } from './ui/juice.js';
import { bus } from './bus.js';

let P = null;
const holds = new Set();

/** Things that own the screen: a dialogue, a catch card, a menu. Rewards wait until none is open. */
const BLOCKERS = '#talk:not(.hidden), #chat:not(.hidden), #catch:not(.hidden), #reel:not(.hidden), #viewer:not(.hidden), #toolkit:not(.hidden), .overlay:not(.hidden), #placebar:not(.hidden)';
const gateOpen = () => holds.size === 0 && !document.querySelector(BLOCKERS) && !document.hidden;

/** A system that must not be interrupted (fishing, a dig) holds the queue until it releases. */
export const hold = (name) => holds.add(name);
export const release = (name) => {
  holds.delete(name);
  P?.queue.poke();
};

export function progression() {
  if (P) return P;
  const adapter = { read: () => load(SAVE_KEY, null), write: (v) => save(SAVE_KEY, v) };
  const store = createStore(adapter, { now: Date.now() });
  const clock = createClock({ lastSeen: store.state.lastSeenAt });
  const queue = createRewardQueue({ present, gate: gateOpen });
  P = createProgression({
    store,
    clock,
    queue,
    bus,
    hooks: {
      gold: { get: coins, add: addCoins },
      collect: (id, o) => collect(id, o),
      hourNow,
      toast: (m) => window.__game?.scene.getScenes(true)[0]?.toast?.(m),
    },
    modules: standardModules(),
  });
  P.start();
  // the museum's ledger knows the fish Edmund gave you
  if (!snapshot().seen['fish:minnow'] && P.state.journal.stamps['fish:minnow']?.gift) collect('fish:minnow');
  mountLayer(P);
  queue.onChange(() => refreshPill(P));
  setInterval(() => !document.hidden && P.tick(1000), 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) P.end();
    else {
      P.start();
      if (!queue.busy && !queue.length) syncPill(P);
      queue.poke();
    }
  });
  window.addEventListener('pagehide', () => P.end());
  window.__prog = P;
  return P;
}
