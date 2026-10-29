// The one paywall card. It shows concrete value (silhouettes of the fish out there and what a
// subscription adds), never a countdown, never pressure; "Not now" is as big as the other button.
// Without a payment path (no `hooks.subscribe`) the main button says so honestly.
import { progression } from '../index.js';
import { speciesById } from '../species.js';
import { drawShadow } from '../../collections/render.js';

export function showOffer(o) {
  const p = progression();
  let el = document.getElementById('sub-card');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sub-card';
    el.className = 'overlay hidden';
    el.innerHTML = '<div class="decor-sheet sheet"><div class="ui-head"><h2 class="ui-title">More to explore</h2></div><div class="sc-body"></div><div class="sc-actions"></div></div>';
    document.body.appendChild(el);
  }
  const body = el.querySelector('.sc-body');
  body.replaceChildren();
  const lead = document.createElement('p');
  lead.className = 'pg-empty';
  lead.textContent = `${o.fish} fish live around ${o.name}${o.unseen ? `, and you have not met ${o.unseen} of them` : ''}. Subscribers can sail there.`;
  body.appendChild(lead);
  const grid = document.createElement('div');
  grid.className = 'pg-grid';
  o.silhouettes.forEach((s) => {
    const sp = speciesById(s.id);
    const c = document.createElement('div');
    c.className = 'pg-cell unknown';
    c.append(drawShadow(sp.entry, 3), Object.assign(document.createElement('b'), { className: 'nm', textContent: '???' }));
    grid.appendChild(c);
  });
  body.appendChild(grid);
  const ul = document.createElement('div');
  ul.className = 'pg-card';
  ul.innerHTML = `<h3>A subscription adds</h3><ul>${o.lanes.map(() => '<li></li>').join('')}</ul><p class="pg-empty">Everything you have earned stays yours, always. Rank is never capped and nothing here makes you stronger.</p>`;
  ul.querySelectorAll('li').forEach((li, i) => (li.textContent = o.lanes[i]));
  body.appendChild(ul);
  const act = el.querySelector('.sc-actions');
  act.replaceChildren();
  const later = Object.assign(document.createElement('button'), { className: 'ui-btn ui-btn--wide', textContent: 'Not now' });
  later.onclick = () => {
    el.classList.add('hidden');
    p.queue.poke();
  };
  const go = Object.assign(document.createElement('button'), { className: 'ui-btn ui-btn--wide', textContent: p.hooks.subscribe ? 'See subscriber options' : 'Subscriptions are not open yet' });
  go.disabled = !p.hooks.subscribe;
  go.onclick = () => p.hooks.subscribe?.(o);
  act.append(later, go);
  el.classList.remove('hidden');
}

window.addEventListener('prog-paywall', (e) => showOffer(e.detail));
