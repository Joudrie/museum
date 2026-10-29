// The Journal's first screen: where you stand, the next goals, and your collections as cards.
// Replaces the old 17-tab grid. A card is a button with data-jtab: tapping it opens that page.
import { tabs, list, collection } from '../collections/index.js';
import { snapshot } from '../collections/codex.js';
import { fillPicture } from '../collections/render.js';
import { newInTab } from '../collections/tab.js';
import { completion } from '../collections/milestones.js';
import { QUESTS, claimedCount } from '../quests.js';
import { dirtyTotal } from '../storage_room.js';
import { uiIcon } from './icons.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const bar = (pct, good) => {
  const b = el('div', `ui-bar${good ? ' ui-bar--good' : ''}`);
  const i = el('i');
  i.style.setProperty('--v', `${pct}%`);
  b.appendChild(i);
  return b;
};

function card(tabId, title, sub, { cover, icon, pct, badge, hot } = {}) {
  const b = el('button', `jcard${hot ? ' hot' : ''}`);
  b.dataset.jtab = tabId;
  const pic = el('span', 'jcover');
  if (cover) cover(pic);
  else if (icon) pic.innerHTML = uiIcon(icon, 'l');
  b.append(pic, el('b', '', title), el('small', '', sub));
  if (pct !== undefined) b.appendChild(bar(pct, pct >= 100));
  if (badge) b.appendChild(el('span', 'ui-badge jbadge', badge));
  return b;
}

/** Collection cards, in the registry's order. */
function collectionCards(snap) {
  return tabs().map((t) => {
    const entries = t.collections.flatMap((id) => list({ collection: id }));
    const allOwned = t.collections.every((id) => collection(id).ownership === 'all');
    const have = entries.filter((e) => snap.seen[e.id]).length;
    const first = entries.find((e) => snap.seen[e.id]) || entries[0];
    const fresh = newInTab(t.id);
    const sub = allOwned ? `${entries.length} pieces` : `${have} of ${entries.length}`;
    return card(t.id, t.label, sub, {
      cover: first && ((box) => fillPicture(box, first, { scale: 2, shadow: !snap.seen[first.id] && !allOwned })),
      pct: allOwned ? undefined : entries.length ? Math.round((100 * have) / entries.length) : 0,
      badge: fresh ? `${fresh} new` : '',
    });
  });
}

/** nodes: stats, next goals (passed in by the journal), collections, then Codex / Storage / Shop. */
export function overview({ goalCards, goalsLeft }) {
  const snap = snapshot();
  const all = completion(snap);
  const nodes = [];

  const stats = el('div', 'ui-stats');
  [[`${all.pct}%`, 'of the codex'], [`${claimedCount()}/${QUESTS.length}`, 'goals done'], [String(tabs().length), 'collections']].forEach(([n, l]) => {
    const s = el('div', 'ui-stat');
    s.append(el('b', '', n), el('span', '', l));
    stats.appendChild(s);
  });
  nodes.push(stats);

  nodes.push(el('h3', 'ui-label', 'Next goals'));
  const goals = el('div', 'quest-list');
  goals.append(...goalCards);
  if (!goalCards.length) goals.appendChild(el('p', 'ui-hint', 'Every goal done. More soon!'));
  nodes.push(goals);
  if (goalsLeft > goalCards.length) {
    const all = el('button', 'ui-btn ui-btn--wide jmore');
    all.dataset.jtab = 'goals';
    all.textContent = `All goals (${goalsLeft})`;
    nodes.push(all);
  }

  nodes.push(el('h3', 'ui-label', 'Collections'));
  const grid = el('div', 'ui-grid jgrid');
  grid.append(...collectionCards(snap));
  nodes.push(grid);

  const field = el('button', 'jcard hot');
  field.append(Object.assign(el('span', 'jcover'), { innerHTML: uiIcon('map', 'l') }), el('b', '', 'Field journal'), el('small', '', 'Goals, fish hints, people, places, secrets, titles, records'));
  field.onclick = () => window.dispatchEvent(new CustomEvent('open-field', { detail: 'goals' }));
  nodes.push(el('h3', 'ui-label', 'Out in the world'), field);

  nodes.push(el('h3', 'ui-label', 'Keep'));
  const keep = el('div', 'ui-grid jgrid');
  const dirty = dirtyTotal();
  keep.append(
    card('codex', 'Codex', `${all.have} of ${all.total} found`, { icon: 'trophy', pct: all.pct }),
    card('storage', 'Storage', dirty ? `${dirty} to restore` : 'Nothing waiting', { icon: 'box', badge: dirty ? String(dirty) : '', hot: !!dirty }),
    card('shop', 'Gallery Shop', 'Sell, buy back, new daily', { icon: 'shop' }),
  );
  nodes.push(keep);
  return nodes;
}
