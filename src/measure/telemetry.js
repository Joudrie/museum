// Telemetry for the closed beta: opt-in, off by default, and silent until a project key is set.
//
// Why PostHog: its capture endpoint takes a write-only project token, so a static GitHub Pages
// game can send events with no server and no secret. GameAnalytics' collection API signs every
// request with the game's secret key (HMAC), which a static page cannot hide. PostHog also has
// retention, funnels and lifecycle charts built in, and the events can be exported for the
// scripts in docs/progression/analysis/.
//
// Nothing is sent unless BOTH: a key is filled in below, and this player said yes on the consent
// card (shown once, only on a beta link: ?beta=1). What goes out: the event type, its time, game
// content ids and numbers (rarity, gold), a random player id and the build label. No names,
// no typed text, no location.
import { load, save } from '../storage.js';
import { on, session } from './events.js';
import { buildLabel } from './flags.js';

export const CONFIG = {
  key: '', // FILL_IN: the PostHog project token (phc_...). Empty = telemetry is off for everyone.
  host: 'https://us.i.posthog.com', // or https://eu.i.posthog.com for an EU project
  batchMs: 60000,
};

const KEY = 'curation.betaConsent'; // { consent: 'yes' | 'no' | undefined, id }
const state = () => ({ ...load(KEY, {}) });
export const consented = () => state().consent === 'yes';
export const enabled = () => !!CONFIG.key && consented();

function playerId() {
  const s = state();
  if (s.id) return s.id;
  const id = 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  save(KEY, { ...s, id });
  return id;
}

export function setConsent(yes) {
  save(KEY, { ...state(), consent: yes ? 'yes' : 'no' });
}

let queue = [];
let timer = null;
function send(final = false) {
  clearTimeout(timer);
  timer = null;
  if (!enabled() || !queue.length) return;
  const batch = queue.splice(0, 200);
  const body = JSON.stringify({ api_key: CONFIG.key, batch });
  try {
    fetch(`${CONFIG.host}/batch/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: final || body.length < 60000 }).catch(() => queue.unshift(...batch));
  } catch {
    queue.unshift(...batch); // try again next time
  }
  if (queue.length) timer = setTimeout(send, 2000);
}

/** Starts forwarding events (call once at boot). Safe to call when telemetry is off: it does nothing. */
export function startTelemetry() {
  if (!CONFIG.key) return;
  if (typeof location !== 'undefined' && /[?&]beta=1/.test(location.search) && !state().consent) askConsent();
  on('*', (e) => {
    if (!enabled()) return;
    const { t, type, s, ...props } = e;
    queue.push({ event: type, timestamp: new Date(t).toISOString(), properties: { distinct_id: playerId(), session: s || session.id, build: buildLabel(), ...props } });
    if (!timer) timer = setTimeout(send, CONFIG.batchMs);
  });
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && send(true));
}

function askConsent() {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.className = 'prog-consent';
  el.setAttribute('role', 'dialog');
  el.innerHTML =
    '<div class="prog-card"><b>Help test Curation?</b><p>While you play this beta, the game can send what happens (what you catch, dig, build and earn, and how long you play) with a random id. No names, no messages, no location. You can say no and still play.</p><div class="prog-row"><button class="pixel-btn" data-a="yes">Yes, send it</button><button class="pixel-btn" data-a="no">No thanks</button></div></div>';
  el.onclick = (ev) => {
    const a = ev.target?.dataset?.a;
    if (!a) return;
    setConsent(a === 'yes');
    el.remove();
  };
  document.body.appendChild(el);
}
