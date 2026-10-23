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

export function ask(title, text, yesLabel, cb) {
  el.querySelector('.ask-title').textContent = title;
  el.querySelector('.ask-text').textContent = text;
  el.querySelector('.ask-yes').textContent = yesLabel;
  done = cb;
  el.classList.remove('hidden');
}
