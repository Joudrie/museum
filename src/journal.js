// The Journal: goals to work on, and the collection so far (paintings and
// the famous visitors you've met).
import { PAINTINGS } from './paintings.js';
import { FAMOUS } from './famous.js';
import { QUESTS, activeQuests, claimedCount } from './quests.js';
import { eraOf, ERAS } from './slotmenu.js';

const el = document.getElementById('journal');
const body = el.querySelector('.journal-body');
const tabs = el.querySelectorAll('[data-jtab]');
let state = null;
let tab = 'goals';

function goals() {
  const ctx = state.ctx();
  const list = activeQuests(ctx);
  const head = document.createElement('p');
  head.className = 'toolkit-note';
  head.textContent = `${claimedCount()} of ${QUESTS.length} goals done. Finish one to claim its gold; the next one appears.`;
  const wrap = document.createElement('div');
  wrap.className = 'quest-list';
  list.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'quest' + (q.done ? ' done' : '');
    const pct = q.done ? 100 : q.at ? Math.round((100 * Number(q.at[0])) / Number(q.at[1])) : 0;
    card.innerHTML = `
      <div class="quest-text"><b></b><span></span>
        ${q.at && !q.done ? `<div class="quest-bar"><i style="width:${pct}%"></i></div><small>${q.at[0]} / ${q.at[1]}</small>` : ''}
      </div>`;
    card.querySelector('b').textContent = q.title;
    card.querySelector('span').textContent = q.text;
    const btn = document.createElement('button');
    btn.className = q.done ? 'pixel-btn quest-claim' : 'quest-reward';
    btn.innerHTML = `<i class="coin"></i> ${q.reward}`;
    btn.disabled = !q.done;
    if (q.done) {
      btn.innerHTML = `Claim <i class="coin"></i> ${q.reward}`;
      btn.onclick = () => {
        state.onClaim(q.id);
        render();
      };
    }
    card.appendChild(btn);
    wrap.appendChild(card);
  });
  if (!list.length) {
    const done = document.createElement('p');
    done.className = 'empty-note';
    done.textContent = 'Every goal done. You’re a legend. More goals soon!';
    wrap.appendChild(done);
  }
  return [head, wrap];
}

function paintings() {
  const hung = state.hungIn();
  const head = document.createElement('p');
  head.className = 'toolkit-note';
  head.textContent = `${hung.size} of ${PAINTINGS.length} paintings on display. Hang the rest from any empty wall spot.`;
  const grid = document.createElement('div');
  grid.className = 'gallery-grid book';
  PAINTINGS.forEach((p) => {
    const where = hung.get(p.id);
    const b = document.createElement('button');
    b.className = 'slot-painting' + (where === undefined ? ' elsewhere' : '');
    b.innerHTML = `<span class="thumb" style="background:${p.placeholder}"><img alt="" loading="lazy" src="${p.src}" /></span>
      <span class="meta"><b></b><i></i><em>${where === undefined ? 'In storage' : `On display: ${state.roomLabel(where)}`}</em><small class="blurb"></small></span>`;
    b.querySelector('b').textContent = p.title;
    b.querySelector('i').textContent = `${p.by} · ${p.year} · ${ERAS[eraOf(p)]}`;
    b.querySelector('.blurb').textContent = p.blurb;
    b.querySelector('img').onerror = (e) => e.target.remove();
    b.onclick = () => b.classList.toggle('open');
    grid.appendChild(b);
  });
  return [head, grid];
}

function visitors() {
  const met = new Set(state.met());
  const ids = Object.keys(FAMOUS);
  const head = document.createElement('p');
  head.className = 'toolkit-note';
  head.textContent = `${met.size} of ${ids.length} famous visitors met. Each one adds +5% income forever. They hang out in the main hall.`;
  const grid = document.createElement('div');
  grid.className = 'famous-grid';
  ids.forEach((id) => {
    const f = FAMOUS[id];
    const known = met.has(id);
    const card = document.createElement('div');
    card.className = 'famous-card' + (known ? '' : ' unknown');
    card.innerHTML = `<img alt="" src="${state.portrait(id)}" /><b></b><small></small>`;
    card.querySelector('b').textContent = known ? f.name : '???';
    card.querySelector('small').textContent = known ? '“' + f.lines[0] + '”' : 'Not met yet';
    grid.appendChild(card);
  });
  return [head, grid];
}

function render() {
  tabs.forEach((t) => t.classList.toggle('on', t.dataset.jtab === tab));
  body.replaceChildren(...{ goals, paintings, visitors }[tab]());
}

tabs.forEach((t) =>
  t.addEventListener('click', () => {
    tab = t.dataset.jtab;
    el.querySelector('.sheet').scrollTop = 0;
    render();
  }),
);
el.querySelector('.journal-close').addEventListener('click', () => {
  el.classList.add('hidden');
  state?.onClose();
});

// opts: { ctx() -> quest context, onClaim(id), hungIn() -> Map, roomLabel(i), met() -> [ids], portrait(id) -> url, onClose() }
export function openJournal(opts, startTab) {
  state = opts;
  if (startTab) tab = startTab;
  render();
  el.classList.remove('hidden');
}
