// Speech bubble for visitors. Sits at the top or bottom of the screen
// (away from the speaker). Box and tail are one outlined shape.
const el = document.getElementById('talk');
const box = el.querySelector('.talk-box');
const who = el.querySelector('.talk-who');
const text = el.querySelector('.talk-text');
const body = el.querySelector('.talk-body');
const shadow = el.querySelector('.talk-shadow');

let timer = null;

export function showTalk(name, label, line, at) {
  who.innerHTML = `${name} <span>${label}</span>`;
  text.textContent = line;
  const below = at.y < window.innerHeight / 2;
  el.classList.toggle('below', below);
  el.classList.remove('hidden');

  // One path: the box outline with the tail folded into the edge facing the speaker.
  requestAnimationFrame(() => {
    const { left: l, right: r, top: t, bottom: b } = box.getBoundingClientRect();
    const bx = Math.min(Math.max(at.x, l + 28), r - 28);
    const tip = below ? at.y + 6 : at.y - 4;
    const d = below
      ? `M${l},${t} L${bx - 14},${t} L${at.x},${tip} L${bx + 14},${t} L${r},${t} L${r},${b} L${l},${b} Z`
      : `M${l},${t} L${r},${t} L${r},${b} L${bx + 14},${b} L${at.x},${tip} L${bx - 14},${b} L${l},${b} Z`;
    body.setAttribute('d', d);
    shadow.setAttribute('d', d);
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
