// Speech bubble for anyone who says something short. It sits right over the
// speaker's head and follows them as they (or the camera) move, with a short
// tail folded into the edge facing them. The text types out. It closes when its
// time is up, when the player walks off, or the moment the speaker can't be
// found any more (`at` returns null, e.g. the scene was left). It never takes
// taps: the screen under it stays yours (src/speech.css).
//
//   showTalk(name, label, line, at, ms, away)
//   at: { x, y } in screen pixels (the top of the speaker's head), or a
//       function returning one (or null), called every frame. It can also carry
//       `top` (the highest head to clear, if the player stands above the speaker),
//       `bottom` (the lowest feet) and `under: true` (put the bubble below both).
//   away: optional function; when it returns true (the player has walked off) the bubble goes at once.
import { sfx } from './music.js';
import './speech.css';

const el = document.getElementById('talk');
const box = el.querySelector('.talk-box');
const who = el.querySelector('.talk-who');
const text = el.querySelector('.talk-text');
const body = el.querySelector('.talk-body');
const shadow = el.querySelector('.talk-shadow');

const TYPE_CPS = 62; // characters a second
const TAIL = 12; // how far the tail reaches out of the box
const GAP = 11; // between the speaker's head and the tail tip: the tail never touches their sprite

let timer = null;
let raf = 0;
let getAt = null;
let getAway = null;
let size = { w: 0, h: 0 };
let typed = null;

const readAt = () => {
  const a = typeof getAt === 'function' ? getAt() : getAt;
  return a && Number.isFinite(a.x) && Number.isFinite(a.y) ? a : null;
};

// Where the box goes: above the head when there's room, else below the feet,
// kept clear of the buttons at the top and bottom of the screen. If the player
// stands where it would cover them, it goes under the two of them instead.
function place(a) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const { w, h } = size;
  const left = Math.min(Math.max(a.x - w / 2, 10), vw - w - 10);
  const topLimit = 74; // below the HUD buttons
  const headTop = a.top ?? a.y;
  const feet = a.bottom ?? a.y + 46;
  const above = headTop - GAP - TAIL - h;
  const below = feet + TAIL;
  const useBelow = (a.under || above < topLimit) && below + h < vh - 86;
  const top = useBelow ? below : Math.max(above, 8);
  box.style.left = `${left}px`;
  box.style.top = `${top}px`;
  const l = left;
  const r = left + w;
  const t = top;
  const b = top + h;
  const tipY = useBelow ? feet + 2 : headTop - GAP + 2;
  const tx = Math.min(Math.max(a.x, l + 22), r - 22);
  const d = useBelow
    ? `M${l},${t} L${tx - 9},${t} L${a.x},${tipY} L${tx + 9},${t} L${r},${t} L${r},${b} L${l},${b} Z`
    : `M${l},${t} L${r},${t} L${r},${b} L${tx + 9},${b} L${a.x},${tipY} L${tx - 9},${b} L${l},${b} Z`;
  body.setAttribute('d', d);
  shadow.setAttribute('d', d);
  el.classList.toggle('below', useBelow);
  el.style.transformOrigin = `${a.x}px ${tipY}px`;
}

function follow() {
  raf = 0;
  if (el.classList.contains('hidden')) return;
  const a = readAt();
  if (!a || getAway?.()) return hideTalk();
  place(a);
  raf = requestAnimationFrame(follow);
}

export function showTalk(name, label, line, at, ms, away) {
  const was = !el.classList.contains('hidden');
  getAt = at;
  getAway = away || null;
  who.innerHTML = '';
  who.append(name + ' ');
  const sp = document.createElement('span');
  sp.textContent = label;
  who.append(sp);
  // the whole line is laid out at once (so the box doesn't grow while it types); the
  // part not typed yet is just invisible
  const on = document.createElement('span');
  const off = document.createElement('span');
  off.className = 'talk-off';
  off.textContent = line;
  text.replaceChildren(on, off);
  typed = { on, off, line, n: 0, t: 0 };
  el.classList.remove('hidden');
  const r = box.getBoundingClientRect();
  size = { w: r.width, h: r.height };
  const a = readAt();
  if (a) place(a);
  if (!was) {
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }
  if (!raf) raf = requestAnimationFrame(follow);
  typeOut();
  clearTimeout(timer);
  const hold = ms || Math.min(9000, Math.max(3800, 2200 + line.length * 55));
  timer = setTimeout(hideTalk, hold + line.length * (1000 / TYPE_CPS));
}

function typeOut() {
  const s = typed;
  if (!s) return;
  clearInterval(s.iv);
  s.iv = setInterval(() => {
    s.n = Math.min(s.line.length, s.n + 1 + (s.line.length > 90 ? 1 : 0));
    s.on.textContent = s.line.slice(0, s.n);
    s.off.textContent = s.line.slice(s.n);
    if (s.n % 4 === 1) sfx('talk');
    if (s.n >= s.line.length) clearInterval(s.iv);
  }, 1000 / TYPE_CPS);
}

export function hideTalk() {
  clearTimeout(timer);
  if (typed) clearInterval(typed.iv);
  typed = null;
  getAt = null;
  getAway = null;
  cancelAnimationFrame(raf);
  raf = 0;
  el.classList.add('hidden');
}

export const talking = () => !el.classList.contains('hidden');
