// "Take a break": the Next time card (up to three open loops, never an empty list), and a paywall-free
// recap of where you stand. Closing it saves; there is nothing to lose by quitting.
import { progression } from '../index.js';

export function openBreak() {
  const p = progression();
  let el = document.getElementById('break-card');
  if (!el) {
    el = document.createElement('div');
    el.id = 'break-card';
    el.className = 'overlay hidden';
    el.innerHTML = '<div class="decor-sheet sheet"><div class="ui-head"><h2 class="ui-title">Next time</h2></div><div class="bk-body"></div><button class="ui-btn ui-btn--wide bk-ok">See you soon</button></div>';
    document.body.appendChild(el);
    el.querySelector('.bk-ok').onclick = () => {
      el.classList.add('hidden');
      p.end();
      p.queue.poke();
    };
  }
  const body = el.querySelector('.bk-body');
  body.replaceChildren();
  const card = document.createElement('div');
  card.className = 'pg-card';
  const lines = p.goals.nextTime();
  card.innerHTML = `<h3>Things waiting</h3><ul>${lines.map((l) => `<li></li>`).join('')}</ul>`;
  card.querySelectorAll('li').forEach((li, i) => (li.textContent = lines[i]));
  body.appendChild(card);
  const lv = p.level();
  const rec = document.createElement('p');
  rec.className = 'pg-empty';
  rec.textContent = `Today: ${p.state.stats.catches} fish all-time, ${lv.renown ? 'Renown ' + lv.renown : 'Rank ' + lv.rank}. Rested XP: ${Math.round(p.state.rested.pool)}.`;
  body.appendChild(rec);
  el.classList.remove('hidden');
  // the end-of-session recap is one of the few honest moments to look across the water
  const o = p.sub.moment('session_end', 'wreck');
  if (o) import('./subcard.js').then((m) => m.showOffer(o));
}
