// The conversation box: a portrait, a name, text that types out, and choices.
// Tap the box to finish a line (or move on). Drives a generator from src/chatter.js.
// It sits in the top third and never pauses the game: walk away and it closes (opts.leave).
import { sfx } from './music.js';
import { uiIcon } from './ui/icons.js';
import './speech.css';

let el = null;
function build() {
  el = document.createElement('div');
  el.id = 'chat';
  el.className = 'hidden';
  el.setAttribute('role', 'dialog');
  el.innerHTML =
    '<div class="chat-box"><div class="chat-head"><canvas class="chat-face" width="64" height="64"></canvas><div><b class="chat-name"></b><small class="chat-label"></small></div></div>' +
    '<p class="chat-text"></p><div class="chat-choices"></div><span class="chat-more" aria-hidden="true">' + uiIcon('down', 's') + '</span></div>';
  document.body.appendChild(el);
}

const SPEED = 90; // characters a second (fast: the choices are already up while it types)

/**
 * runDialogue(gen, { name, label, portrait, onGift, onEnd, leave, onBye })
 * `portrait` is a canvas or image to draw in the corner (drawn pixelated).
 * `leave()` is asked every frame; when it returns true (you walked off) the talk ends.
 */
export function runDialogue(gen, { name, label, portrait, onGift, onEnd, leave, onBye }) {
  if (!el) build();
  const q = (s) => el.querySelector(s);
  const text = q('.chat-text');
  const choices = q('.chat-choices');
  const more = q('.chat-more');
  q('.chat-name').textContent = name;
  el.setAttribute('aria-label', `Talking to ${name}`);
  q('.chat-label').textContent = label || '';
  const face = q('.chat-face');
  const g = face.getContext('2d');
  g.clearRect(0, 0, 64, 64);
  g.imageSmoothingEnabled = false;
  if (portrait) g.drawImage(portrait, 0, 0, 64, 64);

  let typing = null;
  let full = '';
  let step = null;
  let open = true;
  let timer = null;

  const choicesFor = (s) => (s?.type === 'line' && s.button ? [{ id: 'go', label: s.button }] : s?.type === 'hub' ? s.choices : null);
  const finishTyping = () => {
    clearInterval(timer);
    typing = null;
    text.textContent = full;
    if (!choicesFor(step) && (step?.type === 'line' || step?.type === 'gift')) more.hidden = false;
  };
  const showChoices = (list) => {
    more.hidden = true;
    choices.replaceChildren(
      ...list.map((c) => {
        const b = document.createElement('button');
        b.textContent = c.label;
        b.onclick = (e) => {
          e.stopPropagation();
          sfx('open');
          advance(c.id);
        };
        return b;
      }),
    );
  };
  const show = (s) => {
    step = s;
    choices.replaceChildren();
    more.hidden = true;
    full = s.text;
    text.textContent = '';
    if (choicesFor(s)) showChoices(choicesFor(s)); // no waiting for the text to finish
    let i = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      i += 1;
      text.textContent = full.slice(0, i);
      if (i % 6 === 0) sfx('talk');
      if (i >= full.length) {
        typing = null;
        finishTyping();
      }
    }, 1000 / SPEED);
    typing = timer;
  };
  let watch = 0;
  const end = () => {
    if (!open) return;
    open = false;
    clearInterval(timer);
    cancelAnimationFrame(watch);
    el.classList.add('hidden');
    el.onclick = null;
    onEnd?.();
  };
  const away = () => {
    if (!open) return;
    if (leave?.()) return end();
    watch = requestAnimationFrame(away);
  };
  const advance = (value) => {
    const r = gen.next(value);
    if (r.done) return end();
    if (r.value.type === 'gift') onGift?.(r.value.gift);
    // a last goodbye needs no box: close it and let the speaker say it in a bubble
    if (r.value.bye && onBye) {
      end();
      return onBye(r.value.text);
    }
    show(r.value);
  };

  // (the box catches taps; the screen around it doesn't, so you can keep walking)
  el.onclick = () => {
    if (!open) return;
    if (typing) return finishTyping();
    if (step?.type === 'line' && !step.button) advance();
    else if (step?.type === 'gift') advance();
  };
  el.classList.remove('hidden');
  advance();
  if (leave) watch = requestAnimationFrame(away);
  return { close: end };
}

export const chatOpen = () => !!el && !el.classList.contains('hidden');
