// The journal tab for any collection, built from its definition. Tabs, the
// intro line, set progress and the grid all come from data. The only code a
// collection can add is an "extra" block above its log (fishing adds bobbers).
import { collection, keyOf, list, metaLine, sets, tabs, RARITY } from './index.js';
import { claimSet, setProgress, snapshot } from './codex.js';
import { fillPicture } from './render.js';
import { openViewer } from '../viewer.js';

const EXTRAS = {};
/** fn({ refresh, ctx }) -> nodes, shown between the intro and the log of that tab. */
export function registerTabExtra(tab, fn) {
  EXTRAS[tab] = fn;
}

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

const sizeText = (cm) => (cm >= 100 ? `${(cm / 100).toFixed(2)} m` : `${cm} cm`);

function fill(template, vars) {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

function intro(col, snap, ctx) {
  const entries = list({ collection: col.id });
  const have = entries.filter((e) => snap.seen[e.id]).length;
  const hung = ctx.hungIn?.();
  const shown = hung ? entries.filter((e) => hung.has(keyOf(e))).length : have;
  const p = el('p', 'toolkit-note');
  p.textContent = fill(col.journal.intro || '{have} of {total} {noun}.', { have, shown, total: entries.length, noun: col.noun });
  return p;
}

function setRows(cols, snap, ctx, refresh) {
  const mine = cols.flatMap((c) => sets(c.id));
  if (!mine.length) return null;
  const wrap = el('div', 'set-list');
  mine.forEach((s) => {
    const prog = setProgress(s, snap);
    const row = el('div', 'set-row' + (prog.done ? ' done' : ''));
    const text = el('div', 'set-text');
    text.append(el('b', '', s.name), el('small', '', prog.done && s.plaque ? s.plaque : `${prog.have} of ${prog.total}`));
    const bar = el('div', 'quest-bar');
    bar.appendChild(Object.assign(el('i'), { style: `width:${Math.round((100 * prog.have) / prog.total)}%` }));
    text.appendChild(bar);
    row.appendChild(text);
    const gold = s.reward?.gold;
    if (gold && prog.done && !prog.claimed && ctx.onClaimSet) {
      const b = el('button', 'pixel-btn quest-claim');
      b.innerHTML = `Claim <i class="coin"></i> ${gold}`;
      b.onclick = () => {
        const paid = claimSet(s.id);
        if (paid) ctx.onClaimSet(s, paid);
        refresh();
      };
      row.appendChild(b);
    } else if (gold) {
      const r = el('span', 'quest-reward');
      r.innerHTML = `<i class="coin"></i> ${gold}`;
      if (prog.claimed) r.classList.add('paid');
      row.appendChild(r);
    }
    wrap.appendChild(row);
  });
  return wrap;
}

function card(e, ctx) {
  const where = ctx.hungIn?.().get(keyOf(e));
  const b = el('button', 'slot-painting' + (where === undefined ? ' elsewhere' : ''));
  b.innerHTML = `<span class="thumb"></span><span class="meta"><b></b><i></i><em></em><small class="blurb"></small></span>`;
  fillPicture(b.querySelector('.thumb'), e);
  b.querySelector('b').textContent = e.title;
  b.querySelector('i').textContent = metaLine(e, true);
  b.querySelector('em').textContent =
    where === undefined ? 'In storage' : `On display: ${ctx.roomLabel ? ctx.roomLabel(where) : `room ${where + 1}`}`;
  b.querySelector('.blurb').textContent = e.blurb || '';
  b.onclick = () => b.classList.toggle('open');
  return b;
}

function tile(e, snap, onOpen) {
  const got = snap.seen[e.id];
  const cell = el('div', 'fish-cell' + (got ? '' : ' unknown'));
  cell.innerHTML = `<div class="fish-pic"></div><b></b><small></small>`;
  fillPicture(cell.querySelector('.fish-pic'), e, { scale: e.image.kind === 'pixels' ? 4 : 3, shadow: !got });
  cell.querySelector('b').textContent = got ? e.title : '???';
  const when = [e.acquire?.time, e.acquire?.weather].filter(Boolean).join(', ');
  cell.querySelector('small').textContent = got
    ? `×${got.n}${got.best ? ` · best ${sizeText(got.best)}` : ''}`
    : `${e.provenance?.where || ''}${when ? ` · ${when}` : ''} · ${RARITY[e.rarity ?? 1]}`;
  if (got) {
    cell.classList.add('openable');
    cell.onclick = () => onOpen(e);
  }
  return cell;
}

/** The nodes for one journal tab. `refresh()` re-renders it; `ctx` is the journal's options. */
export function collectionTab(tabId, ctx, refresh) {
  const tab = tabs().find((t) => t.id === tabId);
  if (!tab) return [];
  const cols = tab.collections.map(collection);
  const lead = cols.find((c) => c.journal.intro) || cols[0];
  const snap = snapshot();
  const nodes = [intro(lead, snap, ctx)];
  EXTRAS[tabId]?.({ refresh, ctx }).forEach((n) => nodes.push(n));
  if (lead.journal.title) nodes.push(el('h3', 'fish-h', lead.journal.title));
  const sr = setRows(cols, snap, ctx, refresh);
  if (sr) nodes.push(sr);

  const entries = cols.flatMap((c) => list({ collection: c.id }));
  if (lead.journal.layout === 'cards') {
    const grid = el('div', 'gallery-grid book');
    entries.forEach((e) => grid.appendChild(card(e, ctx)));
    nodes.push(grid);
  } else {
    const grid = el('div', 'fish-grid');
    const known = entries.filter((e) => snap.seen[e.id]);
    const open = (e) => openViewer(known, known.indexOf(e), null, null, { over: true });
    entries.forEach((e) => grid.appendChild(tile(e, snap, open)));
    nodes.push(grid);
  }
  return nodes;
}

/** The journal's collection tabs, in order: [{ id, label, order }]. */
export const collectionTabs = () => tabs().map(({ id, label, order }) => ({ id, label, order }));
