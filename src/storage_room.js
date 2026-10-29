// Storage: what you hold right now against everything you have ever collected
// (the codex). Dirty pieces wait here for the Restoration Studio; restored
// ones are ready for display. Shown as a journal tab (see journal.js).
import { inventory, dirtyItems } from './restore.js';
import { collect } from './collections/codex.js';
import { list, RARITY } from './collections/index.js';
import { fillPicture } from './collections/render.js';
import { openStudio } from './restorestudio.js';

/** How many pieces are waiting in the studio (shown on the journal tab). */
export const dirtyTotal = () => dirtyItems().reduce((n, x) => n + x.n, 0);

const mk = (tag, cls, text) => Object.assign(document.createElement(tag), { className: cls || '', textContent: text ?? '' });

function row(r, note) {
  const b = mk('div', 'slot-painting');
  b.innerHTML = '<span class="thumb"></span><span class="meta"><b></b><i></i><em></em></span>';
  fillPicture(b.querySelector('.thumb'), r.entry, { scale: 3 });
  b.querySelector('b').textContent = r.entry.title;
  b.querySelector('i').textContent = `${RARITY[r.entry.rarity ?? 1]} · ×${r.held || r.ever} ${r.held ? 'held' : 'collected'}`;
  b.querySelector('em').textContent = note;
  return b;
}

/** The nodes of the Storage tab. `refresh()` redraws it. */
export function storageTab(ctx, refresh) {
  const inv = inventory();
  const dirty = inv.now.reduce((n, r) => n + r.dirty, 0);
  const ready = inv.now.reduce((n, r) => n + r.ready, 0);
  const nodes = [mk('p', 'toolkit-note', `In storage now: ${ready} ready to display, ${dirty} waiting to be restored. The codex remembers ${inv.ever.length} things you have collected, even ones you no longer hold.`)];

  const studio = mk('button', 'pixel-btn', dirty ? `Restoration Studio · ${dirty} to restore` : 'Restoration Studio');
  studio.onclick = () => openStudio({ onClose: refresh });
  nodes.push(studio);

  nodes.push(mk('h3', 'fish-h', 'In storage now'));
  const now = mk('div', 'gallery-grid book');
  inv.now.forEach((r) => now.appendChild(row(r, r.dirty ? `${r.dirty} need restoring` : 'Restored, ready to display')));
  if (!inv.now.length) now.appendChild(mk('p', 'empty-note', 'Nothing yet. Dig, fish and explore; what you find comes here.'));
  nodes.push(now);

  nodes.push(mk('h3', 'fish-h', 'Codex: ever collected'));
  const ever = mk('div', 'gallery-grid book');
  inv.ever.forEach((r) => ever.appendChild(row(r, r.held ? (r.restored ? `Restored ×${r.restored}` : 'Held') : 'No longer held')));
  if (!inv.ever.length) ever.appendChild(mk('p', 'empty-note', 'The codex is empty.'));
  nodes.push(ever);

  const test = mk('button', 'wide-btn', 'Testing: hand me something dirty');
  test.onclick = () => {
    const pool = list({ collection: 'fossil' }).concat(list({ collection: 'mineral' }));
    const e = pool[Math.floor(Math.random() * pool.length)];
    if (e) collect(e.id, { dirty: true });
    refresh();
  };
  nodes.push(test);
  return nodes;
}
