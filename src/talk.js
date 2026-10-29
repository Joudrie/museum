// Speech bubble for people (and signs). A small bubble that sits just above the
// speaker's head and follows them: it never covers the speaker or you (it moves
// above whichever head is higher, or below both if there is no room up top), and
// it closes on its own when you walk away. Box and tail are one outlined shape.
import './speech.css';

const el = document.getElementById('talk');
const box = el.querySelector('.talk-box');
const who = el.querySelector('.talk-who');
const text = el.querySelector('.talk-text');
const body = el.querySelector('.talk-body');
const shadow = el.querySelector('.talk-shadow');

let timer = null;
let raf = 0;
let anchor = null; // () => { x, y, top, bottom } in page px, or null to close

const GAP = 12; // between the heads and the bubble (the tail fills it)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function place(at) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const bw = box.offsetWidth;
  const bh = box.offsetHeight;
  const top = at.top ?? at.y;
  const bottom = at.bottom ?? at.y;
  const minTop = 8;
  let y = top - GAP - bh;
  const below = y < minTop;
  if (below) y = Math.min(bottom + GAP, vh - bh - 8);
  const x = clamp(at.x - bw / 2, 8, vw - bw - 8);
  box.style.left = `${Math.round(x)}px`;
  box.style.top = `${Math.round(y)}px`;
  el.classList.toggle('below', below);
  const l = x;
  const r = x + bw;
  const t = y;
  const b = y + bh;
  const tx = clamp(at.x, l + 16, r - 16);
  const d = below
    ? `M${l},${t} L${tx - 8},${t} L${tx},${t - GAP + 2} L${tx + 8},${t} L${r},${t} L${r},${b} L${l},${b} Z`
    : `M${l},${t} L${r},${t} L${r},${b} L${tx + 8},${b} L${tx},${b + GAP - 2} L${tx - 8},${b} L${l},${b} Z`;
  body.setAttribute('d', d);
  shadow.setAttribute('d', d);
}

function track() {
  if (el.classList.contains('hidden')) return;
  const at = anchor?.();
  if (anchor && !at) return hideTalk(); // walked away, or the speaker is gone
  if (at) place(at);
  raf = requestAnimationFrame(track);
}

/**
 * showTalk(name, label, line, at, ms, follow?)
 * `at` is a page point (the speaker's head). `follow`, if given, is called every frame and
 * returns { x, y, top, bottom } (head, highest head, lowest feet) or null to close.
 */
export function showTalk(name, label, line, at, ms = 6000, follow = null) {
  who.innerHTML = `${name} <span>${label}</span>`;
  text.textContent = line;
  anchor = follow;
  el.classList.remove('hidden');
  cancelAnimationFrame(raf);
  place((follow && follow()) || at);
  raf = requestAnimationFrame(track);
  clearTimeout(timer);
  timer = setTimeout(hideTalk, ms);
}

export function hideTalk() {
  clearTimeout(timer);
  cancelAnimationFrame(raf);
  anchor = null;
  el.classList.add('hidden');
}

export const talking = () => !el.classList.contains('hidden');

/**
 * A follow function for showTalk: keeps the bubble over `who` (a sprite, or any {x, y})
 * in `scene`, clear of the player, and closes it once the player is `leave` px away.
 * `head` is how far above who.y the top of their head is.
 */
export function followSpeaker(scene, who, { head = 34, leave = 4 * 32 } = {}) {
  return () => {
    if (!scene.sys?.isActive?.() || !who || who.active === false) return null;
    const pl = scene.player;
    if (pl && Math.hypot(pl.x - who.x, pl.y - who.y) > leave) return null;
    const cam = scene.cameras.main;
    const r = scene.game.canvas.getBoundingClientRect();
    const k = r.width / scene.scale.gameSize.width;
    const at = (x, y) => ({ x: r.left + (x - cam.worldView.x) * cam.zoom * k, y: r.top + (y - cam.worldView.y) * cam.zoom * k });
    const h = at(who.x, who.y - head);
    const ph = pl ? at(pl.x, pl.y - 38) : h;
    const feet = Math.max(at(who.x, who.y + 4).y, pl ? at(pl.x, pl.y + 4).y : 0);
    return { x: h.x, y: h.y, top: Math.min(h.y, ph.y), bottom: feet };
  };
}
