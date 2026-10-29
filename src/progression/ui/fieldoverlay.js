// The Field Journal: one overlay, reachable from anywhere (the Menu hub, the rank pill), holding the
// Goals tab and every page of the field journal. Fish uses the museum's own collection tab so the
// silhouettes, sets and hints work the same way in both places.
import { progression } from '../index.js';
import { PAGES, newCount } from '../journal.js';
import { fieldPage } from './fieldjournal.js';
import { goalsTab } from './goalsui.js';
import { shopTab } from './shopui.js';
import { lodgeTab } from './lodgeui.js';
import { eventsTab } from './eventsui.js';
import { collectionTab } from '../../collections/tab.js';
import { uiIcon } from '../../ui/icons.js';

let el = null;
let tab = 'goals';
const TABS = [{ id: 'goals', name: 'Goals' }, { id: 'fish', name: 'Fish' }, { id: 'shop', name: 'Market' }, { id: 'lodge', name: 'Lodge' }, { id: 'leads', name: 'Leads' }, { id: 'events', name: 'Events' }, ...PAGES.filter((p) => !['fish', 'curios'].includes(p.id)).map((p) => ({ id: p.id, name: p.name }))];

function build() {
  el = document.createElement('div');
  el.id = 'field-journal';
  el.className = 'overlay hidden';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Field journal');
  el.innerHTML = '<div class="decor-sheet sheet"><div class="ui-head"><h2 class="ui-title">Field journal</h2><button class="ui-btn ui-close fj-close" aria-label="Close"></button></div><div class="pg-tabs"></div><div class="fj-body"></div></div>';
  document.body.appendChild(el);
  el.querySelector('.fj-close').innerHTML = uiIcon('close');
  el.querySelector('.fj-close').onclick = close;
  el.addEventListener('click', (e) => e.target === el && close());
}

function render() {
  const p = progression();
  const bar = el.querySelector('.pg-tabs');
  bar.replaceChildren();
  TABS.forEach((t) => {
    const b = document.createElement('button');
    b.className = `ui-btn${t.id === tab ? ' on' : ''}`;
    b.dataset.fj = t.id;
    const fresh = t.id === 'goals' ? 0 : newCount(p, t.id);
    b.textContent = t.name + (fresh ? ` ·${fresh}` : '');
    b.onclick = () => {
      tab = t.id;
      render();
    };
    bar.appendChild(b);
  });
  const body = el.querySelector('.fj-body');
  const nodes = tab === 'goals' ? goalsTab(p, render) : tab === 'shop' ? shopTab(p, render) : tab === 'lodge' ? lodgeTab(p, render) : tab === 'events' ? eventsTab(p, render) : tab === 'fish' ? collectionTab('fish', { onClaimSet: (s, gold) => p.gold.add(gold) }, render) : fieldPage(tab, render);
  body.replaceChildren(...nodes);
  el.querySelector('.sheet').scrollTop = 0;
}

export function openField(start) {
  if (!el) build();
  if (start) tab = start;
  render();
  el.classList.remove('hidden');
}
export function close() {
  el?.classList.add('hidden');
  progression().queue.poke();
}
export const fieldOpen = () => !!el && !el.classList.contains('hidden');

window.addEventListener('open-goals', () => openField('goals'));
window.addEventListener('open-field', (e) => openField(e.detail));
