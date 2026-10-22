// The Curator's Office panel: current level, what the next level unlocks, upgrade.
import { LEVELS, MAX_LEVEL, describe } from './office.js';

const el = document.getElementById('office');
const line = el.querySelector('.office-line');
const level = el.querySelector('.office-level');
const cols = el.querySelector('.office-cols');
const up = el.querySelector('.office-up');

let state = null;

const list = (title, items) => `<div><h3>${title}</h3><ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul></div>`;

function render() {
  const { lvl, canAfford, free } = state;
  line.textContent = `${state.who}: “${state.say}”`;
  level.textContent = `Level ${lvl} of ${MAX_LEVEL}`;
  const next = lvl < MAX_LEVEL ? LEVELS[lvl + 1] : null;
  cols.innerHTML = list('Now', describe(lvl)) + (next ? list(`Level ${lvl + 1}`, describe(lvl + 1)) : list('Next', ['Fully upgraded']));
  up.hidden = !next;
  if (!next) return;
  const cost = next.cost.toLocaleString();
  up.disabled = !canAfford(next.cost);
  up.textContent = free ? `Upgrade · free while testing (${cost} gold)` : up.disabled ? `Need ${cost} gold` : `Upgrade · ${cost} gold`;
}

up.addEventListener('click', () => {
  state.lvl = state.onUpgrade();
  state.say = 'Splendid! The board will be thrilled.';
  render();
});
el.querySelector('.office-close').addEventListener('click', () => {
  el.classList.add('hidden');
  state.onClose();
});

// opts: { lvl, who, say, free, canAfford(n), onUpgrade() -> new level, onClose() }
export function openOffice(opts) {
  state = { ...opts };
  render();
  el.classList.remove('hidden');
}
