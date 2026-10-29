// The conversation box: a portrait, a name, text that types out, and choices.
// Tap the box to finish a line (or move on). Drives a generator from src/chatter.js.
import { sfx } from './music.js';
import { uiIcon } from './ui/icons.js';

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

const SPEED = 26; // characters a second

/**
 * runDialogue(gen, { name, label, portrait, onGift, onEnd, onMood })
 * `onMood(id)` is called as a line starts that has a `mood` (an emote id for a picture over their head).
 * `portrait` is a canvas or image to draw in the corner (drawn pixelated).
 */
export function runDialogue(gen, { name, label, portrait, onGift, onEnd, onMood }) {
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

  const finishTyping = () => {
    clearInterval(timer);
    typing = null;
    text.textContent = full;
    if (step?.type === 'line' && step.button) showChoices([{ id: 'go', label: step.button }]);
    else if (step?.type === 'hub') showChoices(step.choices);
    else if (step?.type === 'line' || step?.type === 'gift') more.hidden = false;
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
    if (s.mood) onMood?.(s.mood);
    choices.replaceChildren();
    more.hidden = true;
    full = s.text;
    text.textContent = '';
    let i = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      i += 1;
      text.textContent = full.slice(0, i);
      if (i % 3 === 0) sfx('talk');
      if (i >= full.length) {
        typing = null;
        finishTyping();
      }
    }, 1000 / SPEED);
    typing = timer;
  };
  const end = () => {
    if (!open) return;
    open = false;
    clearInterval(timer);
    el.classList.add('hidden');
    el.onclick = null;
    onEnd?.();
  };
  const advance = (value) => {
    const r = gen.next(value);
    if (r.done) return end();
    if (r.value.type === 'gift') onGift?.(r.value.gift);
    show(r.value);
  };

  el.onclick = () => {
    if (!open) return;
    if (typing) return finishTyping();
    if (step?.type === 'line' && !step.button) advance();
    else if (step?.type === 'gift') advance();
  };
  el.classList.remove('hidden');
  advance();
  return { close: end };
}

export const chatOpen = () => !!el && !el.classList.contains('hidden');
