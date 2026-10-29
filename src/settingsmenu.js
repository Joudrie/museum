// Settings: sound, lighting, day/night, haptics, and testing tools.
import { section, choices } from './decor.js';
import { settings, setSetting, LIGHT_QUALITY } from './settings.js';
import { isMuted, setMuted } from './music.js';
import { openShare } from './share.js';

const el = document.getElementById('settings');
const body = el.querySelector('.settings-body');
let state = null;

function slider(value, onInput) {
  const wrap = document.createElement('div');
  wrap.className = 'slider';
  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '100';
  input.value = String(Math.round(value * 100));
  const out = document.createElement('b');
  out.textContent = `${input.value}%`;
  input.addEventListener('input', () => {
    out.textContent = `${input.value}%`;
    onInput(Number(input.value) / 100);
  });
  wrap.append(input, out);
  return wrap;
}

function button(label, onClick, cls = 'wide-btn') {
  const b = document.createElement('button');
  b.className = cls;
  b.textContent = label;
  b.onclick = onClick;
  return b;
}

// Two taps, so a stray touch can't wipe a museum; and the old save is kept first (curation.bak.reset).
let armedAt = 0;
function confirmReset(e) {
  const btn = e.target;
  if (Date.now() - armedAt > 4000) {
    armedAt = Date.now();
    btn.textContent = 'Tap again to reset everything';
    setTimeout(() => btn.isConnected && (btn.textContent = 'Reset museum (rooms, gold, mess)'), 4000);
    return;
  }
  armedAt = 0;
  try {
    const snap = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith('curation.') && !k.startsWith('curation.bak.')) snap[k] = localStorage.getItem(k);
    }
    localStorage.setItem('curation.bak.reset', JSON.stringify({ at: Date.now(), snap }));
  } catch {
    // storage full: reset anyway, the person asked twice
  }
  state.onReset();
}

function render() {
  const s = settings();
  const onOff = { on: 'On', off: 'Off' };
  body.replaceChildren(
    section('Sound', choices({ on: 'On', off: 'Muted' }, isMuted() ? 'off' : 'on', (v) => (setMuted(v === 'off'), render()))),
    section('Music volume', slider(s.music, (v) => setSetting('music', v))),
    section('Sound effects', slider(s.sfx, (v) => setSetting('sfx', v))),
    section('Lighting', choices(LIGHT_QUALITY, s.lights, (v) => (setSetting('lights', v), render()))),
    section('Day & night', choices(onOff, s.dayNight ? 'on' : 'off', (v) => (setSetting('dayNight', v === 'on'), render()))),
    section('Vibration', choices(onOff, s.haptics ? 'on' : 'off', (v) => (setSetting('haptics', v === 'on'), render()))),
    section('Share', button('Share & visit friends', () => openShare())),
    section('Design', button('Map builder: islands & rooms', () => (location.href = './builder.html'), 'wide-btn')),
    section('Testing', button('+1,000 gold', () => state.onAddCoins(1000)), button('Collect one of everything', (e) => {
        const n = state.onCollectAll();
        e.target.textContent = n ? `Added ${n} to your collection` : 'You already have one of everything';
      }), button('Reset museum (rooms, gold, mess)', confirmReset, 'wide-btn danger')),
  );
  const note = document.createElement('p');
  note.className = 'toolkit-note';
  note.textContent = 'Day and night follow your clock. Lighting “Low” saves battery; “Off” turns the lamps and shadows of the night off.';
  body.appendChild(note);
}

el.querySelector('.settings-close').addEventListener('click', () => {
  el.classList.add('hidden');
  state?.onClose();
});

// opts: { onAddCoins(n), onCollectAll() -> how many added, onReset(), onClose() }
export function openSettings(opts) {
  state = opts;
  render();
  el.classList.remove('hidden');
}

export function closeSettings() {
  el.classList.add('hidden');
}
