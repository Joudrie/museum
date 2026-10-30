// Your phone (src/progression/companions.js): a small button under the Journal once a friend has
// given you their number, and a little pixel phone with your friends on it. Call one and they
// come and hang out; the one with you can be sent home from here too.
import { uiIcon } from './icons.js';
import { progression } from '../progression/index.js';
import './phone.css';

let btn = null;
let card = null;

const STATUS = {
  with: () => 'Here with you',
  today: () => 'Seen today: back tomorrow',
  busy: () => 'Free once your friend heads home',
  cool: (c) => `Free to call in ${c.coolMin} min`,
};

/** Shows the phone button (or hides it: `on` false). `open()` runs when it is tapped. */
export function phoneButton(on, open) {
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'phone-btn';
    btn.type = 'button';
    btn.className = 'pixel-btn hud-btn hidden';
    btn.setAttribute('aria-label', 'Phone: call a friend');
    btn.innerHTML = `${uiIcon('phone')}<span>Phone</span>`;
    document.body.appendChild(btn);
  }
  btn.onclick = open;
  btn.classList.toggle('hidden', !on);
}

export const phoneOpen = () => !!card && !card.classList.contains('hidden');
export function closePhone() {
  card?.classList.add('hidden');
}

/** The phone itself. `call(id)` and `home()` are the scene's (the fade, the friend appearing). */
export function openPhone({ call, home, onClose }) {
  const pr = progression();
  if (!card) {
    card = document.createElement('div');
    card.id = 'phone';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', 'Phone');
    document.body.appendChild(card);
  }
  const close = () => {
    closePhone();
    onClose?.();
  };
  const list = pr.companions.contacts();
  const rows = list.map((c) => {
    const row = document.createElement('div');
    row.className = 'ph-row';
    row.innerHTML = `<div class="ph-who"><b><span></span><small></small></b><em></em></div>`;
    row.querySelector('b span').textContent = c.name;
    row.querySelector('b small').textContent = c.role;
    row.querySelector('em').textContent = c.status === 'free' ? c.boost : STATUS[c.status](c);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ph-call';
    if (c.status === 'with') {
      b.textContent = 'Say bye';
      b.onclick = () => {
        close();
        home();
      };
    } else {
      b.textContent = 'Call';
      b.disabled = c.status !== 'free';
      b.onclick = () => {
        close();
        call(c.id);
      };
    }
    row.appendChild(b);
    return row;
  });
  const head = document.createElement('div');
  head.className = 'ph-head';
  head.innerHTML = `<span>${uiIcon('phone', 's')} Friends</span>`;
  const x = document.createElement('button');
  x.type = 'button';
  x.className = 'ph-x';
  x.setAttribute('aria-label', 'Close');
  x.innerHTML = uiIcon('close', 's');
  x.onclick = close;
  head.appendChild(x);
  const screen = document.createElement('div');
  screen.className = 'ph-screen';
  const note = document.createElement('p');
  note.className = 'ph-note';
  note.textContent = 'A friend can hang out for half an hour a day.';
  screen.append(...rows, note);
  card.replaceChildren(head, screen);
  card.classList.remove('hidden');
}
