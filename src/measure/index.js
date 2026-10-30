// Progression measurement, booted once from main.js (see docs/progression/README.md).
//   - turns every save into a typed event (derive.js) and keeps a log on the phone (events.js)
//   - copies the progression layer's bus events into the same log (layer.js)
//   - tracks sessions: start, end, how long, how much of it was active
//   - applies the build flags (?progression=off, ?flags=...) as body classes (flags.js, measure.css)
//   - ?evlog shows a small panel to copy or share the log (how a phone-only player sends it)
//   - forwards events to telemetry only when a key is set and the player opted in (telemetry.js)
import { onSave } from '../storage.js';
import { emit, flush, events, clearLog, session, on } from './events.js';
import { startDeriving } from './derive.js';
import { SYSTEMS, flagOn, buildLabel, progressionOff } from './flags.js';
import { startTelemetry } from './telemetry.js';
import { layerEvents } from './layer.js';
import './measure.css';

const IDLE_NEW_SESSION = 30 * 60 * 1000; // back after this long = a new session (the usual analytics rule)
const ACTIVE_WINDOW = 10000; // a window with any touch counts as 10 s of active play

function sourceOf(search) {
  const p = new URLSearchParams(search);
  if (p.has('visit')) return 'friend-museum-link';
  if (p.has('island')) return 'friend-island-link';
  if (p.has('play')) return 'builder-playtest';
  if (p.has('beta')) return 'beta-link';
  return 'direct'; // there are no notifications, so every other start is unprompted
}

let active = new Set();
let lastType = '';
let hiddenAt = 0;
let pausedMs = 0; // time hidden inside one session (back within 30 minutes), left out of its length
let count = 0;

function startSession(source) {
  const past = events();
  const prev = past.length ? past[past.length - 1].t : 0;
  session.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  session.start = Date.now();
  pausedMs = 0;
  active = new Set();
  count = past.filter((e) => e.type === 'session_start').length + 1;
  emit('session_start', { source, gapH: prev ? +((Date.now() - prev) / 3.6e6).toFixed(2) : null, n: count, build: buildLabel() });
}

function endSession(reason) {
  if (!session.id) return;
  emit('session_end', { ms: Date.now() - session.start - pausedMs, activeMs: active.size * ACTIVE_WINDOW, reason, last: lastType });
  flush();
}

function boot() {
  startDeriving(onSave);
  layerEvents();
  startSession(sourceOf(location.search));

  // the body classes measure.css keys off
  const b = document.body.classList;
  if (progressionOff()) b.add('progression-off');
  Object.keys(SYSTEMS).forEach((k) => !flagOn(k) && b.add(`no-${k}`));

  const touch = () => active.add(Math.floor(Date.now() / ACTIVE_WINDOW));
  window.addEventListener('pointerdown', touch, { passive: true, capture: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      endSession('hidden'); // provisional: if they come back soon, the same session goes on
    } else if (hiddenAt && Date.now() - hiddenAt > IDLE_NEW_SESSION) {
      startSession('resume');
    } else {
      if (hiddenAt) pausedMs += Date.now() - hiddenAt;
      emit('session_resume', {});
    }
  });
  window.addEventListener('pagehide', () => endSession('pagehide'));
  on('*', (e) => !['session_end', 'session_resume'].includes(e.type) && (lastType = e.type));

  startTelemetry();
  if (/[?&]evlog\b/.test(location.search)) logPanel();
  window.__measure = { events, flush, emit, flagOn, buildLabel }; // for tests (like __game)
}

// A small panel to get the log off a phone: copy it, share it as a file, or clear it.
function logPanel() {
  const el = document.createElement('div');
  el.className = 'prog-log';
  const n = () => events().length;
  el.innerHTML = `<b>Event log</b><span class="prog-n"></span><div class="prog-row"><button class="pixel-btn" data-a="copy">Copy</button><button class="pixel-btn" data-a="share">Share file</button><button class="pixel-btn" data-a="clear">Clear</button><button class="pixel-btn" data-a="x">✕</button></div>`;
  const label = () => (el.querySelector('.prog-n').textContent = ` ${n()} events · build ${buildLabel()}`);
  label();
  const text = () => JSON.stringify({ format: 'curation-evlog', v: 1, exported: Date.now(), build: buildLabel(), events: events() });
  el.onclick = async (ev) => {
    const a = ev.target?.dataset?.a;
    if (a === 'copy') await navigator.clipboard?.writeText(text());
    if (a === 'share') {
      const file = new File([text()], `curation-evlog-${new Date().toISOString().slice(0, 10)}.json`, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: 'Curation event log' }).catch(() => {});
      else await navigator.clipboard?.writeText(text());
    }
    if (a === 'clear' && confirm('Clear the event log on this phone?')) clearLog();
    if (a === 'x') return el.remove();
    label();
  };
  document.body.appendChild(el);
}

if (typeof document !== 'undefined' && typeof location !== 'undefined') boot();
