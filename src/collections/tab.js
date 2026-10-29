// The journal tab for any collection, built from its definition. Tabs, the
// intro line, set progress and the grid all come from data. The only code a
// collection can add is an "extra" block above its log (fishing adds bobbers).
import { collection, keyOf, list, metaLine, sets, tabs, RARITY } from './index.js';
import { claimSet, setProgress, snapshot } from './codex.js';
import { fillPicture } from './render.js';
import { load, save } from '../storage.js';
import { openViewer } from '../viewer.js';

const EXTRAS = {};
const HINTS = {};
/** { text(entry) -> hint line, open(entry, refresh) } for the silhouettes of one tab (the progression layer's tiered hints). */
export function registerTileHint(tab, h) {
  HINTS[tab] = h;
}
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


// ---- journal polish: "new" markers, your stars and notes, search and filters ----
const SEEN_KEY = 'curation.journalSeen'; // { [tabId]: time you last left that tab }
const NOTES_KEY = 'curation.journal'; // the viewer's notes and stars, by entry key
const lastSeen = (tabId) => load(SEEN_KEY, {})[tabId] || 0;
const mine = (e) => load(NOTES_KEY, {})[keyOf(e)] || {};
const isNew = (e, snap, tabId) => (snap.seen[e.id]?.first || 0) > lastSeen(tabId);

/** How many entries in a tab were collected since you last looked at it. */
export function newInTab(tabId) {
  const tab = tabs().find((t) => t.id === tabId);
  if (!tab) return 0;
  const snap = snapshot();
  return tab.collections.flatMap((id) => list({ collection: id })).filter((e) => isNew(e, snap, tabId)).length;
}

/** Call when you leave a tab (or close the journal): its "new" markers clear. */
export function markTabViewed(tabId) {
  if (!tabs().some((t) => t.id === tabId)) return;
  save(SEEN_KEY, { ...load(SEEN_KEY, {}), [tabId]: Date.now() });
}

/** Little marks on a tile or card: NEW, your stars, a note. */
function marks(e, snap, tabId) {
  const m = mine(e);
  const bits = [];
  if (isNew(e, snap, tabId)) bits.push(el('span', 'mark-new', 'NEW'));
  if (m.rating) bits.push(el('span', 'mark-stars', '★'.repeat(m.rating)));
  if (m.note) bits.push(el('span', 'mark-note', '✎'));
  if (!bits.length) return null;
  const box = el('span', 'marks');
  box.append(...bits);
  return box;
}

const FILTERS = { all: 'All', have: 'Have', missing: 'Missing', rated: '★ Rated' };
const filterState = {}; // per tab, kept while the page is open: { q, f, r }

/** A search box and filter chips. Filtering hides cells in place (no redraw), so typing keeps its focus. */
function filterBar(tabId, items) {
  const st = (filterState[tabId] = filterState[tabId] || { q: '', f: 'all', r: 0 });
  const bar = el('div', 'journal-filter');
  const input = el('input', 'journal-search');
  input.type = 'search';
  input.placeholder = 'Search';
  input.value = st.q;
  input.setAttribute('aria-label', 'Search this tab');
  const chips = el('div', 'journal-chips');
  const apply = () => {
    items.forEach(({ node, e, got }) => {
      const hay = [e.title, e.by, e.blurb, e.year, ...(e.tags || [])].join(' ').toLowerCase();
      const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
      const show =
        (!words.length || words.every((w) => (got ? hay : (e.provenance?.where || '').toLowerCase()).includes(w))) &&
        (st.f === 'all' || (st.f === 'have' ? got : st.f === 'missing' ? !got : !!mine(e).rating)) &&
        (!st.r || (e.rarity ?? 1) === st.r);
      node.classList.toggle('filtered-out', !show);
    });
    chips.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.f === st.f || (b.dataset.r && Number(b.dataset.r) === st.r)));
  };
  input.oninput = () => {
    st.q = input.value;
    apply();
  };
  Object.entries(FILTERS).forEach(([k, label]) => {
    const b = el('button', 'chip', label);
    b.dataset.f = k;
    b.onclick = () => ((st.f = k), apply());
    chips.appendChild(b);
  });
  [...new Set(items.map(({ e }) => e.rarity ?? 1))].sort().forEach((r) => {
    if (items.length < 8) return;
    const b = el('button', 'chip', RARITY[r]);
    b.dataset.r = String(r);
    b.onclick = () => ((st.r = st.r === r ? 0 : r), apply());
    chips.appendChild(b);
  });
  bar.append(input, chips);
  apply();
  return { bar, apply };
}

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
  const mine = cols.flatMap((c) => sets(c.id, true));
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

function card(e, ctx, snap, tabId) {
  const where = ctx.hungIn?.().get(keyOf(e));
  const b = el('button', 'slot-painting' + (where === undefined ? ' elsewhere' : ''));
  b.innerHTML = `<span class="thumb"></span><span class="meta"><b></b><i></i><em></em><small class="blurb"></small></span>`;
  fillPicture(b.querySelector('.thumb'), e);
  b.querySelector('b').textContent = e.title;
  b.querySelector('i').textContent = metaLine(e, true);
  b.querySelector('em').textContent =
    where === undefined ? 'In storage' : `On display: ${ctx.roomLabel ? ctx.roomLabel(where) : `room ${where + 1}`}`;
  b.querySelector('.blurb').textContent = e.blurb || '';
  const mk = marks(e, snap, tabId);
  if (mk) b.appendChild(mk);
  b.onclick = () => b.classList.toggle('open');
  return b;
}

function tile(e, snap, onOpen, tabId, refresh) {
  const got = snap.seen[e.id];
  const cell = el('div', 'fish-cell' + (got ? '' : ' unknown'));
  cell.innerHTML = `<div class="fish-pic"></div><b></b><small></small>`;
  fillPicture(cell.querySelector('.fish-pic'), e, { scale: e.image.kind === 'pixels' ? 4 : 3, shadow: !got });
  cell.querySelector('b').textContent = got ? e.title : '???';
  const when = [e.acquire?.time, e.acquire?.weather].filter(Boolean).join(', ');
  const hint = !got && HINTS[tabId];
  cell.querySelector('small').textContent = got
    ? `×${got.n}${got.best ? ` · best ${sizeText(got.best)}` : ''}`
    : hint
      ? `${RARITY[e.rarity ?? 1]} · ${hint.text(e)}`
      : `${e.provenance?.where || ''}${when ? ` · ${when}` : ''} · ${RARITY[e.rarity ?? 1]}`;
  if (hint) {
    cell.classList.add('openable');
    cell.onclick = () => hint.open(e, refresh);
  }
  const mk = got && marks(e, snap, tabId);
  if (mk) cell.appendChild(mk);
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
  const items = [];
  let grid;
  if (lead.journal.layout === 'cards') {
    grid = el('div', 'gallery-grid book');
    entries.forEach((e) => {
      const node = card(e, ctx, snap, tabId);
      items.push({ node, e, got: !!snap.seen[e.id] || collection(e.collection).ownership === 'all' });
      grid.appendChild(node);
    });
  } else {
    grid = el('div', 'fish-grid');
    const known = entries.filter((e) => snap.seen[e.id]);
    const open = (e) => openViewer(known, known.indexOf(e), null, null, { over: true });
    entries.forEach((e) => {
      const node = tile(e, snap, open, tabId, refresh);
      items.push({ node, e, got: !!snap.seen[e.id] });
      grid.appendChild(node);
    });
  }
  if (entries.length >= 6) nodes.push(filterBar(tabId, items).bar);
  nodes.push(grid);
  return nodes;
}

/** The journal's collection tabs, in order: [{ id, label, order }]. */
export const collectionTabs = () => tabs().map(({ id, label, order }) => ({ id, label, order }));
