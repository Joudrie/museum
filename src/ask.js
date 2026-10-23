// A simple yes/no prompt in the game's style.
const el = document.getElementById('ask');
let done = null;

const close = (yes) => {
  el.classList.add('hidden');
  const cb = done;
  done = null;
  cb?.(yes);
};
el.querySelector('.ask-yes').addEventListener('click', () => close(true));
el.querySelector('.ask-no').addEventListener('click', () => close(false));

// noLabel: null hides the second button (a plain notice).
export function ask(title, text, yesLabel, cb, noLabel = 'Not now') {
  el.querySelector('.ask-title').textContent = title;
  el.querySelector('.ask-text').textContent = text;
  el.querySelector('.ask-yes').textContent = yesLabel;
  const no = el.querySelector('.ask-no');
  no.hidden = noLabel === null;
  if (noLabel) no.textContent = noLabel;
  done = cb;
  el.classList.remove('hidden');
}
