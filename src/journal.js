// The Journal: goals to work on, and the collection so far. Collection tabs
// (paintings, fish, minerals, …) are built from the collection registry; the
// famous visitors are a collection too.
import { QUESTS, activeQuests, claimedCount } from './quests.js';
import { collectionTab, collectionTabs, markTabViewed, newInTab } from './collections/tab.js';
import { storageTab } from './storage_room.js';
import { shopTab } from './collections/shoptab.js';
import { codexTab } from './collections/codextab.js';
import { registerRenderer } from './collections/render.js';
import './fishing.js'; // (adds the bobber list to the Fish tab)

const el = document.getElementById('journal');
const body = el.querySelector('.journal-body');
const tabBar = el.querySelector('.journal-tabs');
let state = null;
let tab = 'goals';

// A famous visitor's picture is their walking sprite, drawn by the room (opts.portraitCanvas).
registerRenderer('visitor', (image, scale) => {
  const src = state?.portraitCanvas?.(image.who);
  const cv = document.createElement('canvas');
  cv.width = 32 * scale;
  cv.height = 40 * scale;
  if (src) {
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const k = Math.min(cv.width / src.width, cv.height / src.height);
    g.drawImage(src, (cv.width - src.width * k) / 2, cv.height - src.height * k, src.width * k, src.height * k);
  }
  return cv;
});

// Goals first, then each collection by its order (visitors are a collection too).
function tabList() {
  const all = [{ id: 'goals', label: 'Goals', order: 0 }, { id: 'codex', label: 'Codex', order: 0.5 }, { id: 'storage', label: 'Storage', order: 90 }, { id: 'shop', label: 'Shop', order: 91 }, ...collectionTabs()];
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

function render() {
  tabBar.replaceChildren(
    ...tabList().map((t) => {
      const b = document.createElement('button');
      b.dataset.jtab = t.id;
      b.textContent = t.label;
      b.classList.toggle('on', t.id === tab);
      if (t.id !== tab && newInTab(t.id)) b.classList.add('has-new'); // a dot: something new in there
      b.onclick = () => {
        if (t.id !== tab) markTabViewed(tab); // leaving a tab clears its NEW marks
        tab = t.id;
        el.querySelector('.sheet').scrollTop = 0;
        render();
      };
      return b;
    }),
  );
  body.replaceChildren(...(tab === 'goals' ? goals() : tab === 'codex' ? codexTab(state, render) : tab === 'storage' ? storageTab(state, render) : tab === 'shop' ? shopTab(state, render) : collectionTab(tab, state, render)));
}

el.querySelector('.journal-close').addEventListener('click', () => {
  markTabViewed(tab);
  el.classList.add('hidden');
  state?.onClose();
});

// opts: { ctx() -> quest context, onClaim(id), onClaimSet(set, gold), hungIn() -> Map of painting slug -> room, roomLabel(i), portraitCanvas(id) -> canvas, onClose() }
// Outside on the island only the fish tab is on hand (opts.fishOnly).
export function openJournal(opts, startTab) {
  state = opts;
  el.classList.toggle('fish-only', !!opts.fishOnly);
  if (opts.fishOnly) tab = 'fish';
  else if (startTab) tab = startTab;
  render();
  el.classList.remove('hidden');
}
