// The Journal: goals to work on, and the collection so far. Collection tabs
// (paintings, fish, minerals, …) are built from the collection registry; the
// famous visitors you've met keep their own tab.
import { FAMOUS } from './famous.js';
import { QUESTS, activeQuests, claimedCount } from './quests.js';
import { collectionTab, collectionTabs } from './collections/tab.js';
import { storageTab } from './storage_room.js';
import './fishing.js'; // (adds the bobber list to the Fish tab)

const el = document.getElementById('journal');
const body = el.querySelector('.journal-body');
const tabBar = el.querySelector('.journal-tabs');
let state = null;
let tab = 'goals';

// Goals first, then each collection by its order, with the visitors in third place.
function tabList() {
  const all = [{ id: 'goals', label: 'Goals', order: 0 }, { id: 'visitors', label: 'Visitors', order: 2 }, { id: 'storage', label: 'Storage', order: 90 }, ...collectionTabs()];
  return all.sort((a, b) => a.order - b.order);
}

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
  tabBar.replaceChildren(
    ...tabList().map((t) => {
      const b = document.createElement('button');
      b.dataset.jtab = t.id;
      b.textContent = t.label;
      b.classList.toggle('on', t.id === tab);
      b.onclick = () => {
        tab = t.id;
        el.querySelector('.sheet').scrollTop = 0;
        render();
      };
      return b;
    }),
  );
  body.replaceChildren(...(tab === 'goals' ? goals() : tab === 'visitors' ? visitors() : tab === 'storage' ? storageTab(state, render) : collectionTab(tab, state, render)));
}

el.querySelector('.journal-close').addEventListener('click', () => {
  el.classList.add('hidden');
  state?.onClose();
});

// opts: { ctx() -> quest context, onClaim(id), onClaimSet(set, gold), hungIn() -> Map of painting slug -> room, roomLabel(i), met() -> [ids], portrait(id) -> url, onClose() }
// Outside on the island only the fish tab is on hand (opts.fishOnly).
export function openJournal(opts, startTab) {
  state = opts;
  el.classList.toggle('fish-only', !!opts.fishOnly);
  if (opts.fishOnly) tab = 'fish';
  else if (startTab) tab = startTab;
  render();
  el.classList.remove('hidden');
}
