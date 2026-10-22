// Gentle generated background music, one track per room (no audio files).
// Audio starts after the first tap (browsers require a user gesture).
import { load, save } from './decor.js';

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
  master.gain.value = muted ? 0 : 0.11;
  master.connect(ctx.destination);
  return ctx;
}

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
  out.connect(master);
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
    g.connect(master);
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
  if (master) master.gain.linearRampToValueAtTime(on ? 0 : 0.11, ctx.currentTime + 0.3);
}

// Unlock audio on the first tap anywhere.
const unlock = () => {
  if (!ensure()) return;
  ctx.resume().then(() => play(wanted));
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
