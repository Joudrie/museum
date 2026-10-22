// Speech bubble for visitors. Sits at the top or bottom of the screen
// (away from the speaker) with a tail pointing at them.
const el = document.getElementById('talk');
const box = el.querySelector('.talk-box');
const who = el.querySelector('.talk-who');
const text = el.querySelector('.talk-text');
const tail = el.querySelector('.talk-tail polygon');

let timer = null;

export function showTalk(name, label, line, at) {
  who.innerHTML = `${name} <span>${label}</span>`;
  text.textContent = line;
  const below = at.y < window.innerHeight / 2;
  el.classList.toggle('below', below);
  el.classList.remove('hidden');

  // Tail from the bubble edge to just above the speaker's head.
  requestAnimationFrame(() => {
    const r = box.getBoundingClientRect();
    const bx = Math.min(Math.max(at.x, r.left + 24), r.right - 24);
    const by = below ? r.top + 2 : r.bottom - 2;
    const tip = below ? at.y + 6 : at.y - 4;
    tail.setAttribute('points', `${bx - 12},${by} ${bx + 12},${by} ${at.x},${tip}`);
  });

  clearTimeout(timer);
  timer = setTimeout(hideTalk, 6000);
}

export function hideTalk() {
  clearTimeout(timer);
  el.classList.add('hidden');
}

export const talking = () => !el.classList.contains('hidden');

el.addEventListener('click', hideTalk);
