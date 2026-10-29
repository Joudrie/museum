// Gentle generated background music, one track per room (no audio files).
// Audio starts after the first tap (browsers require a user gesture).
import { load, save } from './storage.js';
import { settings } from './settings.js';

export const TRACKS = { none: 'Silence', gallery: 'Gallery piano', egypt: 'Desert', japan: 'Koto garden', science: 'Science lab' };

const MUTE_KEY = 'curation.muted';
const midi = (n) => 440 * 2 ** ((n - 69) / 12);

// Each track: scale (semitones from root), root note, note spacing, and voice.
const STYLES = {
  gallery: { root: 60, scale: [0, 2, 4, 7, 9, 12, 14, 16], step: 0.42, wave: 'triangle', decay: 1.6, rest: 0.25, pad: [48, 55, 64] },
  egypt: { root: 62, scale: [0, 1, 4, 5, 7, 8, 11, 12], step: 0.36, wave: 'sawtooth', decay: 0.7, rest: 0.35, pad: [38, 45], filter: 900 },
  japan: { root: 64, scale: [0, 2, 3, 7, 9, 12, 14, 15], step: 0.5, wave: 'triangle', decay: 0.5, rest: 0.45, pad: [40, 47] },
  science: { root: 57, scale: [0, 3, 7, 10, 12, 15, 19], step: 0.3, wave: 'sine', decay: 0.9, rest: 0.3, pad: [45, 52, 60], filter: 1400 },
};

let ctx = null;
let master = null;
let musicBus = null; // music and sound effects have their own volume
let sfxBus = null;
let current = 'none';
let timer = null;
let padNodes = [];
let muted = load(MUTE_KEY, false);
let wanted = 'none';

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 1;
  master.connect(ctx.destination);
  musicBus = ctx.createGain();
  sfxBus = ctx.createGain();
  musicBus.connect(master);
  sfxBus.connect(master);
  setVolumes();
  return ctx;
}

const MUSIC_LEVEL = 0.16;
const SFX_LEVEL = 0.14;
function setVolumes() {
  if (!ctx) return;
  const s = settings();
  musicBus.gain.setTargetAtTime(MUSIC_LEVEL * s.music, ctx.currentTime, 0.05);
  sfxBus.gain.setTargetAtTime(SFX_LEVEL * s.sfx / 0.8, ctx.currentTime, 0.05);
}
window.addEventListener('settings', (e) => ['music', 'sfx'].includes(e.detail.key) && setVolumes());

function note(freq, when, style, gain = 0.5) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = style.wave;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(gain, when + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, when + style.decay);
  let out = g;
  if (style.filter) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = style.filter;
    g.connect(f);
    out = f;
  }
  osc.connect(g);
  out.connect(musicBus);
  osc.start(when);
  osc.stop(when + style.decay + 0.05);
}

function startPad(style) {
  padNodes = style.pad.map((n) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = midi(n);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 2);
    osc.connect(g);
    g.connect(musicBus);
    osc.start();
    return { osc, g };
  });
}

function stopAll() {
  clearInterval(timer);
  timer = null;
  padNodes.forEach(({ osc, g }) => {
    g.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    osc.stop(ctx.currentTime + 0.7);
  });
  padNodes = [];
}

function play(track) {
  if (!ensure()) return;
  if (track === current) return;
  if (current !== 'none') stopAll();
  current = track;
  if (track === 'none') return;
  const style = STYLES[track];
  startPad(style);
  let next = ctx.currentTime + 0.3;
  let degree = 2;
  // Simple wandering melody, scheduled a little ahead of time.
  timer = setInterval(() => {
    while (next < ctx.currentTime + 0.6) {
      if (Math.random() > style.rest) {
        degree = Math.max(0, Math.min(style.scale.length - 1, degree + Math.round((Math.random() - 0.5) * 4)));
        note(midi(style.root + style.scale[degree]), next, style, 0.35 + Math.random() * 0.2);
      }
      next += style.step;
    }
  }, 150);
}

// Little sound effects, built from short tones. Silent until audio is unlocked.
function tone(freq, start, dur, { wave = 'triangle', gain = 0.35, to = null } = {}) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, start);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, start + dur);
  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(sfxBus);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

const SFX = {
  coin: (t) => [1319, 1976].forEach((f, i) => tone(f, t + i * 0.07, 0.18, { gain: 0.3 })),
  clean: (t) => tone(1800, t, 0.22, { wave: 'sawtooth', gain: 0.08, to: 300 }),
  door: (t) => {
    tone(110, t, 0.18, { wave: 'square', gain: 0.12 });
    tone(220, t + 0.05, 0.25, { wave: 'triangle', gain: 0.1, to: 180 });
  },
  place: (t) => tone(330, t, 0.09, { gain: 0.35, to: 260 }),
  sell: (t) => [988, 784].forEach((f, i) => tone(f, t + i * 0.06, 0.14, { gain: 0.25 })),
  build: (t) => [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.09, 0.3, { gain: 0.28 })),
  talk: (t) => tone(660 + Math.random() * 120, t, 0.06, { wave: 'square', gain: 0.05 }),
  nope: (t) => tone(196, t, 0.16, { wave: 'square', gain: 0.08, to: 150 }),
  step: (t) => tone(150 + Math.random() * 40, t, 0.035, { wave: 'triangle', gain: 0.07, to: 90 }),
  stepSoft: (t) => tone(90 + Math.random() * 20, t, 0.05, { wave: 'sine', gain: 0.08, to: 60 }),
  stepGrass: (t) => tone(2400 + Math.random() * 600, t, 0.03, { wave: 'sawtooth', gain: 0.012, to: 1200 }),
  meow: (t) => tone(700, t, 0.28, { wave: 'triangle', gain: 0.16, to: 480 }),
  woof: (t) => {
    tone(180, t, 0.12, { wave: 'square', gain: 0.1, to: 120 });
    tone(170, t + 0.16, 0.12, { wave: 'square', gain: 0.1, to: 110 });
  },
  squawk: (t) => tone(1400, t, 0.16, { wave: 'sawtooth', gain: 0.05, to: 900 }),
  tap: (t) => tone(1500, t, 0.03, { wave: 'square', gain: 0.04, to: 1100 }),
  open: (t) => tone(420, t, 0.12, { gain: 0.12, to: 640 }),
  close: (t) => tone(560, t, 0.1, { gain: 0.1, to: 360 }),
  unlock: (t) => [784, 988, 1175, 1568].forEach((f, i) => tone(f, t + i * 0.07, 0.25, { gain: 0.22 })),
  levelup: (t) => {
    [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t + i * 0.08, 0.35, { gain: 0.22 }));
    tone(262, t, 0.6, { wave: 'sine', gain: 0.2 });
  },
  star: (t) => [1568, 2093].forEach((f, i) => tone(f, t + i * 0.05, 0.2, { wave: 'sine', gain: 0.18 })),
  cast: (t) => tone(900, t, 0.22, { wave: 'triangle', gain: 0.1, to: 260 }),
  plop: (t) => tone(520, t, 0.08, { wave: 'sine', gain: 0.3, to: 180 }),
  bite: (t) => [1047, 1397].forEach((f, i) => tone(f, t + i * 0.06, 0.14, { wave: 'square', gain: 0.1 })),
  reel: (t) => [0, 1, 2, 3, 4].forEach((i) => tone(1200 + i * 90, t + i * 0.035, 0.03, { wave: 'square', gain: 0.05 })),
  quest: (t) => [659, 880, 1319].forEach((f, i) => tone(f, t + i * 0.09, 0.28, { gain: 0.24 })),
  chirp: (t) => [0, 1, 2].forEach((i) => tone(2500 + i * 420 + Math.random() * 200, t + i * 0.06, 0.07, { wave: 'sine', gain: 0.05, to: 3300 })), // sparrows going up
  pop: (t) => tone(880, t, 0.09, { wave: 'sine', gain: 0.07, to: 1320 }), // an emote bubble
  hop: (t) => {
    tone(300, t, 0.14, { wave: 'sine', gain: 0.25, to: 150 });
    tone(520, t + 0.05, 0.08, { wave: 'sine', gain: 0.18, to: 180 });
  },
  oar: (t) => tone(260, t, 0.2, { wave: 'sine', gain: 0.05, to: 150 }),
  scrape: (t) => tone(760, t, 0.13, { wave: 'sawtooth', gain: 0.022, to: 360 }), // a rake on the ground
  stepSnow: (t) => tone(1700 + Math.random() * 500, t, 0.06, { wave: 'sawtooth', gain: 0.02, to: 650 }),
};

// Distant thunder: a long low rumble of filtered noise.
SFX.thunder = (t) => {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer();
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.setValueAtTime(380, t);
  f.frequency.exponentialRampToValueAtTime(70, t + 2.4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.9, t + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, t + 2.6);
  src.connect(f);
  f.connect(g);
  g.connect(sfxBus);
  src.start(t, Math.random());
  src.stop(t + 2.7);
};

export function sfx(name) {
  if (!ctx || ctx.state !== 'running' || muted || !SFX[name]) return;
  SFX[name](ctx.currentTime + 0.01);
}

// Background ambience outside: waves on the shore, rain. Made from filtered
// noise, no audio files. kinds: ['waves', 'rain'] (any mix), or [] for quiet.
let ambience = { want: [], nodes: [] };
function noiseBuffer() {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = last * 0.97 + (Math.random() * 2 - 1) * 0.03; // brown-ish noise
    d[i] = last * 6;
  }
  return buf;
}
// Birdsong by day and crickets at night: short generated chirps at random.
function startCalls(kinds) {
  const birds = kinds.includes('birds');
  const crickets = kinds.includes('crickets');
  if (!birds && !crickets) return;
  const chirp = (t) => {
    const base = 2200 + Math.random() * 1800;
    const n = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) tone(base * (1 + i * 0.12), t + i * 0.11, 0.09, { wave: 'sine', gain: 0.06, to: base * 1.25 });
  };
  const cricket = (t) => [0, 1, 2].forEach((i) => tone(4300, t + i * 0.07, 0.04, { wave: 'sine', gain: 0.025 }));
  ambience.timer = setInterval(() => {
    if (!ctx || ctx.state !== 'running' || muted) return;
    const t = ctx.currentTime + 0.05;
    if (birds && Math.random() < 0.45) chirp(t);
    if (crickets && Math.random() < 0.6) cricket(t);
  }, 900);
}

function startAmbience() {
  ambience.nodes.forEach((n) => {
    try {
      n.stop?.();
    } catch {
      // already stopped
    }
    n.disconnect?.();
  });
  ambience.nodes = [];
  clearInterval(ambience.timer);
  if (!ctx || ctx.state !== 'running') return;
  startCalls(ambience.want);
  const buf = noiseBuffer();
  ambience.want.filter((k) => k !== 'birds' && k !== 'crickets').forEach((kind) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = kind === 'rain' ? 3200 : kind === 'rainSoft' ? 900 : 520;
    const g = ctx.createGain();
    g.gain.value = kind === 'rain' ? 0.5 : kind === 'rainSoft' ? 0.28 : 0.35; // (rainSoft: rain on the roof, heard from inside)
    src.connect(f);
    f.connect(g);
    g.connect(sfxBus);
    if (kind === 'waves') {
      // the surf swells and falls back every few seconds
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = 0.13;
      depth.gain.value = 0.3;
      lfo.connect(depth);
      depth.connect(g.gain);
      lfo.start();
      ambience.nodes.push(lfo, depth);
    }
    src.start();
    ambience.nodes.push(src, f, g);
  });
}
export function setAmbience(kinds) {
  ambience.want = kinds || [];
  startAmbience();
}

// Set the room's track. Plays once audio is unlocked by a tap.
export function setTrack(track) {
  wanted = track || 'none';
  if (ctx && ctx.state === 'running') play(wanted);
}

export function isMuted() {
  return muted;
}

export function setMuted(on) {
  muted = on;
  save(MUTE_KEY, on);
  if (master) master.gain.linearRampToValueAtTime(on ? 0 : 1, ctx.currentTime + 0.3);
}

// Unlock audio on the first tap anywhere.
const unlock = () => {
  if (!ensure()) return;
  ctx.resume().then(() => {
    play(wanted);
    if (ambience.want.length && !ambience.nodes.length) startAmbience();
  });
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
