// Every reward goes through one queue. It sequences presentation, holds rewards
// back while a dialogue, a minigame or a menu is open, and never lets two
// presentations overlap. Chained rewards (catch, new species, skill level,
// task done) play in order with a rising pitch.
//
// The queue knows nothing about the screen: a `present(item, done, ctx)` function
// is injected (ui/juice.js in the browser; the tests and the sim use an instant one).

export const KINDS = ['xp', 'species', 'variant', 'skill', 'rank', 'task', 'heart', 'request', 'milestone', 'gold', 'item', 'streak', 'unlock', 'note'];

// bigger moments go first when several are waiting (stable otherwise)
const WEIGHT = { rank: 5, milestone: 4, species: 3, variant: 3, skill: 2, heart: 2, task: 2, request: 2, streak: 2, unlock: 2, item: 1, gold: 1, xp: 0, note: 0 };

export function createRewardQueue({ present, gate = () => true, setTimer = (fn, ms) => setTimeout(fn, ms), gapMs = 260, clearTimer = (t) => clearTimeout(t) } = {}) {
  let items = [];
  let busy = false;
  let timer = null;
  let chain = 0;
  let chainAt = 0;
  const listeners = new Set();
  let seq = 0;

  const q = {
    /** A reward to show. `item.kind` is one of KINDS; `item.chain` groups a sequence. */
    push(item) {
      const it = { id: ++seq, kind: 'note', ...item };
      if (!KINDS.includes(it.kind)) throw new Error(`unknown reward kind ${it.kind}`);
      items.push(it);
      schedule(0);
      return it;
    },
    /** Pushes several rewards that belong together; each plays a step higher. */
    pushChain(list) {
      list.forEach((it, i) => q.push({ ...it, step: i, chainLen: list.length }));
    },
    get length() {
      return items.length;
    },
    get busy() {
      return busy;
    },
    pending: () => items.slice(),
    /** Called when the gate may have opened (a dialogue closed, a minigame ended). */
    poke() {
      schedule(0);
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    clear() {
      items = [];
      if (timer) clearTimer(timer);
      timer = null;
      busy = false;
    },
  };

  function schedule(ms) {
    if (timer || busy) return;
    timer = setTimer(() => {
      timer = null;
      pump();
    }, ms);
  }

  function pump() {
    if (busy || !items.length) return;
    if (!gate()) return schedule(400); // something else owns the screen: try again soon
    // pick the heaviest waiting item that is first of its weight class (keeps order inside a class)
    let best = 0;
    for (let i = 1; i < items.length; i++) if ((WEIGHT[items[i].kind] || 0) > (WEIGHT[items[best].kind] || 0) && items[i].step === undefined) best = i;
    if (items[0].step !== undefined) best = 0; // never split a chain
    const item = items.splice(best, 1)[0];
    busy = true;
    listeners.forEach((fn) => fn(q));
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      busy = false;
      listeners.forEach((fn) => fn(q));
      schedule(items.length ? gapMs : 0);
    };
    try {
      present(item, done, { remaining: items.length });
    } catch (err) {
      console.error('[rewards] presenter threw', err);
      done();
    }
  }
  return q;
}

/** A queue that finishes every item at once (tests, the sim). It records what it was asked to show. */
export function instantQueue(log = []) {
  const q = createRewardQueue({
    present: (item, done) => {
      log.push(item);
      done();
    },
    setTimer: (fn) => {
      // run on the next microtask-like tick, synchronously drained below
      fn();
      return 0;
    },
    clearTimer: () => {},
    gapMs: 0,
  });
  q.log = log;
  return q;
}
