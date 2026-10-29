// Toasts, one at a time. A new toast waits until the one on screen has been readable for a moment,
// the same message twice in a row is shown once, and at most three wait their turn (the oldest drops).
const MIN_MS = 900; // a toast is on screen at least this long before the next one replaces it

let queue = [];
let current = null; // { until, minUntil, timer }
let lastText = '';
let lastAt = 0;

const el = () => document.getElementById('toast');

function show(item) {
  const box = el();
  if (!box) return;
  box.textContent = item.text;
  box.classList.remove('hidden');
  const now = Date.now();
  clearTimeout(current?.timer);
  current = { minUntil: now + MIN_MS, timer: setTimeout(done, item.ms) };
}

function done() {
  el()?.classList.add('hidden');
  current = null;
  if (queue.length) setTimeout(() => !current && show(queue.shift()), 220);
}

/** say('Saved your note. +40 gold', 1600) */
export function say(text, ms = 2200) {
  if (!text) return;
  const now = Date.now();
  if (text === lastText && now - lastAt < 1500) return; // the same message twice in a row
  lastText = text;
  lastAt = now;
  if (!current) return show({ text, ms });
  if (queue.some((q) => q.text === text)) return;
  queue.push({ text, ms });
  if (queue.length > 3) queue.shift();
  // readable long enough? then the next one takes over now
  const wait = Math.max(0, current.minUntil - now);
  clearTimeout(current.timer);
  current.timer = setTimeout(done, wait);
}
