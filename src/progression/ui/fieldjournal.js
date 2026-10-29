// The field journal pages (People, Places, Emotes, Secrets, Titles, Records) and the hints on the Fish
// page. Pure DOM; the numbers come from the progression service.
import { progression } from '../index.js';
import { PAGES, entriesOf, completion, hintLevel, hintPrice, buyHint, isStamped, markViewed, isNew, newCount, nearlyDone, regionFishProgress } from '../journal.js';
import { COSMETICS } from '../grants.js';
import { REGIONS, allSpecies, speciesById } from '../species.js';
import { registerTileHint } from '../../collections/tab.js';
import { drawShadow } from '../../collections/render.js';
import { sfx } from '../../music.js';
import { skillLevel, SKILLS } from '../skills.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const EMOTE_GLYPH = { heart: '♥', star: '★', note: '♪', zzz: 'Zzz', sweat: '💧', dots: '…', bang: '!', q: '?' };
const sizeText = (cm) => (cm >= 100 ? `${(cm / 100).toFixed(2)} m` : `${cm} cm`);
const fmtTime = (ms) => {
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`;
};

/** A heading with the page's completion bar and its 25/50/75/100 ticks. */
function pageHead(p, id) {
  const c = completion(p, id);
  const pg = PAGES.find((x) => x.id === id);
  const box = el('div', 'pg-sec');
  const h = el('h3');
  h.append(pg.name, Object.assign(el('small'), { textContent: c.total ? `${c.have} of ${c.total} · ${Math.round(c.pct)}%` : '' }));
  box.appendChild(h);
  if (c.total) {
    const bar = el('div', 'pg-bar');
    bar.style.cssText = 'height:8px;position:relative;background:rgba(255,255,255,.08)';
    bar.innerHTML = `<i style="display:block;height:100%;width:${c.pct}%;background:var(--ui-gold)"></i>${[25, 50, 75].map((m) => `<b style="position:absolute;left:${m}%;top:0;bottom:0;width:2px;background:var(--ui-shadow)"></b>`).join('')}`;
    box.appendChild(bar);
  }
  box.appendChild(Object.assign(el('p', 'pg-empty'), { textContent: pg.blurb }));
  return box;
}

function people(p, refresh) {
  const nodes = [pageHead(p, 'people')];
  entriesOf(p, 'people').forEach((e) => {
    const met = isStamped(p.state, 'people', e.id);
    const f = p.state.friends[e.id] || { hearts: 0, points: 0, reactions: {} };
    const row = el('div', `pg-row${met ? '' : ' done'}`);
    const name = el('b', '', met ? `${e.npc.name} · ${e.npc.role}` : '???');
    if (isNew(p.state, 'people', e.id)) name.append(' ', Object.assign(el('span', 'new-dot'), { textContent: 'NEW' }));
    const hearts = el('span', 'pg-hearts', met ? '♥'.repeat(f.hearts) + '♡'.repeat(10 - f.hearts) : '');
    row.append(name, hearts);
    const reacts = Object.entries(f.reactions || {});
    const sub = el('small');
    sub.textContent = met
      ? `${e.group}. ${reacts.length ? reacts.map(([k, v]) => `${k.split(':')[1]}: ${v === 'love' ? '♥' : v === 'like' ? '☺' : v === 'hate' ? '💧' : '…'}`).join('  ') : 'Give a gift and watch their face.'}`
      : e.hints[0];
    row.appendChild(sub);
    nodes.push(row);
    if (met) markViewed(p, 'people', e.id);
  });
  return nodes;
}

function listPage(p, page, label) {
  const nodes = [pageHead(p, page)];
  const entries = entriesOf(p, page);
  if (!entries.length) nodes.push(el('p', 'pg-empty', `Nothing yet. ${label}`));
  const grid = el('div', 'pg-grid');
  entries.forEach((e) => {
    const got = !e.unknown && isStamped(p.state, page, e.id);
    const c = el('div', `pg-cell${got ? '' : ' unknown'}`);
    c.append(Object.assign(el('b', 'nm'), { textContent: got ? e.name : '???' }));
    if (got) {
      const st = p.state.journal.stamps[`${page}:${e.id}`];
      c.append(Object.assign(el('span', 'hint'), { textContent: st?.region && REGIONS[st.region] ? REGIONS[st.region].name : '' }));
      if (isNew(p.state, page, e.id)) c.append(Object.assign(el('span', 'new-dot'), { textContent: 'NEW' }));
      markViewed(p, page, e.id);
    } else c.append(Object.assign(el('span', 'hint'), { textContent: e.unknown ? 'Something is still here' : e.hints?.[0] || '' }));
    grid.appendChild(c);
  });
  nodes.push(grid);
  return nodes;
}

function emotes(p) {
  const nodes = [pageHead(p, 'emotes')];
  const grid = el('div', 'pg-grid');
  entriesOf(p, 'emotes').forEach((e) => {
    const got = isStamped(p.state, 'emotes', e.id);
    const c = el('div', `pg-cell${got ? '' : ' unknown'}`);
    c.append(Object.assign(el('b'), { textContent: got ? EMOTE_GLYPH[e.id] || e.id : '?', style: 'font-size:26px;display:block' }));
    c.append(Object.assign(el('span', 'nm'), { textContent: got ? e.name : '???' }));
    grid.appendChild(c);
    if (got) markViewed(p, 'emotes', e.id);
  });
  nodes.push(grid);
  return nodes;
}

function titles(p, refresh) {
  const nodes = [pageHead(p, 'titles')];
  const eq = p.state.market.equipped.title;
  Object.entries(COSMETICS)
    .filter(([id]) => id.startsWith('title:'))
    .forEach(([id, c]) => {
      const own = !!p.state.market.owned[id];
      const row = el('div', `pg-row${own ? '' : ' done'}`);
      row.append(Object.assign(el('b', `r${c.rarity}`), { textContent: own ? c.name : '???' }));
      if (own) {
        const b = el('button', 'ui-btn', eq === id ? 'Wearing' : 'Wear');
        b.disabled = eq === id;
        b.onclick = () => {
          p.state.market.equipped.title = id;
          p.store.commit();
          sfx('tap');
          refresh();
        };
        row.appendChild(b);
      } else row.append(Object.assign(el('span'), { textContent: c.source }));
      nodes.push(row);
    });
  return nodes;
}

function records(p) {
  const s = p.state;
  const lv = p.level();
  const rows = [
    ['Rank', lv.renown ? `Renown ${lv.renown}` : `Rank ${lv.rank}`],
    ['Time played', fmtTime(s.playMs)],
    ['Fish caught', s.fish.catches],
    ['Fish that got away', s.fish.escapes],
    ['Heaviest catch', s.fish.heaviest ? sizeText(s.fish.heaviest) : '—'],
    ['Longest catch streak', s.fish.bestStreak],
    ['Species found', `${Object.keys(s.fish.species).length} of ${allSpecies().length}`],
    ['Trophies', s.fish.trophies.length],
    ['Best daily streak', s.streak.best],
    ['Steps walked', Math.round(s.journal.records.steps || 0)],
    ['Steps in snow', Math.round(s.journal.records.snowSteps || 0)],
    ['First catch', s.journal.records.firstCatchAt ? new Date(s.journal.records.firstCatchAt).toLocaleDateString() : '—'],
    ['First friend', s.journal.records.firstFriend ? `${s.journal.records.firstFriend}, ${new Date(s.journal.records.firstFriendAt).toLocaleDateString()}` : '—'],
    ['Secrets found', s.stats.secrets],
    ['Requests done', s.stats.requests],
    ['Tasks done', s.stats.tasksDone],
  ];
  const plate = p.market.nameplate();
  const head = el('div', 'pg-row pinned');
  head.append(Object.assign(el('b'), { textContent: `${plate.frame ? plate.frame.name + ' · ' : ''}${plate.title || 'Curator'}` }), Object.assign(el('span'), { textContent: plate.rank.renown ? `Renown ${plate.rank.renown}` : `Rank ${plate.rank.rank}` }));
  const nodes = [head, pageHead(p, 'records')];
  rows.forEach(([k, v]) => {
    const row = el('div', 'pg-row');
    row.append(el('span', '', k), Object.assign(el('b'), { textContent: String(v) }));
    nodes.push(row);
  });
  // personal bests by species
  const best = Object.entries(s.fish.species).filter(([, r]) => r.bestSize).sort((a, b) => b[1].bestSize / (speciesById(b[0])?.mean || 1) - a[1].bestSize / (speciesById(a[0])?.mean || 1)).slice(0, 8);
  if (best.length) {
    nodes.push(Object.assign(el('h3', 'fish-h'), { textContent: 'Personal bests' }));
    best.forEach(([id, r]) => {
      const sp = speciesById(id);
      const row = el('div', 'pg-row');
      row.append(Object.assign(el('span', `r${sp.rarity}`), { textContent: sp.name }), Object.assign(el('b'), { textContent: `${sizeText(r.bestSize)} · ${r.bestClass}${r.variants && Object.keys(r.variants).length ? ' ✦' : ''}` }));
      nodes.push(row);
    });
  }
  return nodes;
}

/** One field-journal page: people, places, emotes, secrets, titles, records. */
export function fieldPage(id, refresh) {
  const p = progression();
  if (id === 'people') return people(p, refresh);
  if (id === 'places') return listPage(p, 'places', 'Walk the shore and the paths.');
  if (id === 'secrets') return listPage(p, 'secrets', 'Look closely.');
  if (id === 'emotes') return emotes(p);
  if (id === 'titles') return titles(p, refresh);
  if (id === 'records') return records(p);
  return [];
}

/** Overview cards for the journal home: [{ id, title, sub, pct, badge }]. */
export function fieldCards() {
  const p = progression();
  return PAGES.filter((pg) => pg.id !== 'fish' && pg.id !== 'curios').map((pg) => {
    const c = completion(p, pg.id);
    const fresh = newCount(p, pg.id);
    return { id: `field:${pg.id}`, title: pg.name, icon: pg.icon, sub: c.total ? `${c.have} of ${c.total}` : pg.blurb.split('.')[0], pct: c.total ? Math.round(c.pct) : undefined, badge: fresh ? `${fresh} new` : '' };
  });
}

// ---------- hints on the fish page ----------
const hintLine = (p, sp) => {
  const lv = hintLevel(p, 'fish', sp.id);
  return sp.hints[Math.min(2, lv - 1)];
};

function openHintSheet(sp, refresh) {
  const p = progression();
  let sheet = document.getElementById('hint-sheet');
  if (!sheet) {
    sheet = el('div', 'overlay hidden');
    sheet.id = 'hint-sheet';
    sheet.innerHTML = '<div class="decor-sheet sheet"><div class="ui-head"><h2 class="ui-title hs-title"></h2><button class="ui-btn ui-close hs-close" aria-label="Close">✕</button></div><div class="hs-body"></div></div>';
    document.body.appendChild(sheet);
    sheet.querySelector('.hs-close').onclick = () => sheet.classList.add('hidden');
    sheet.addEventListener('click', (e) => e.target === sheet && sheet.classList.add('hidden'));
  }
  const draw = () => {
    const lv = hintLevel(p, 'fish', sp.id);
    sheet.querySelector('.hs-title').textContent = '???';
    const body = sheet.querySelector('.hs-body');
    body.replaceChildren();
    const pic = el('div', 'pc-pic');
    pic.append(drawShadow(sp.entry, 4));
    body.append(pic);
    const fishLv = skillLevel('fishing', p.state.skills.fishing).level;
    const need2 = 2 + sp.rarity * 2;
    sp.hints.forEach((h, i) => {
      const row = el('div', `pg-row${i + 1 > lv ? ' done' : ''}`);
      row.append(Object.assign(el('span'), { textContent: i + 1 <= lv ? h : i === 1 ? `Locked: Fishing level ${need2} (you are ${fishLv}), or hear a rumour.` : 'Locked: buy it, or ask a friend with ten hearts.' }));
      body.append(row);
    });
    if (lv < 3) {
      const price = hintPrice(sp.rarity);
      const b = el('button', 'ui-btn ui-btn--wide', `Buy a hint · ${price} gold`);
      b.onclick = () => {
        const r = buyHint(p, 'fish', sp.id);
        if (!r.ok) {
          b.textContent = 'Not enough gold';
          sfx('nope');
          return;
        }
        sfx('unlock');
        draw();
        refresh?.();
      };
      body.append(b);
    }
  };
  draw();
  sheet.classList.remove('hidden');
}

/** Wires hints into the generic collection tab for fish (called once at start-up). */
export function installFishHints() {
  registerTileHint('fish', {
    text(e) {
      const sp = allSpecies().find((s) => s.entryId === e.id);
      return sp ? hintLine(progression(), { ...sp, hints: spHints(sp) }) : '';
    },
    open(e, refresh) {
      const sp = allSpecies().find((s) => s.entryId === e.id);
      if (sp) openHintSheet({ ...sp, hints: spHints(sp) }, refresh);
    },
  });
}
import { hintsFor } from '../species.js';
const spHints = (sp) => hintsFor(sp);

/** Extra nodes above the fish log: the nearest finish lines (goal gradient) and each region's progress. */
export function fishFinishLines() {
  const p = progression();
  const nodes = [];
  const near = nearlyDone(p).filter((n) => n.kind === 'set' || n.id === 'fish').slice(0, 2);
  near.forEach((n) => {
    const row = el('div', 'pg-row pinned');
    const name = n.kind === 'set' ? n.id.replace(/-/g, ' ') : 'Fish';
    row.append(Object.assign(el('b'), { textContent: `${n.left} left to complete ${name}` }), Object.assign(el('span'), { textContent: `${n.have}/${n.total}` }));
    nodes.push(row);
  });
  const sec = el('div', 'pg-sec');
  sec.append(Object.assign(el('h3'), { textContent: 'By island' }));
  Object.keys(REGIONS).forEach((r) => {
    const g = regionFishProgress(p, r);
    const row = el('div', 'pg-row');
    row.append(Object.assign(el('span'), { textContent: g.name }), Object.assign(el('b'), { textContent: `${g.have}/${g.total}` }));
    sec.appendChild(row);
  });
  nodes.push(sec);
  return nodes;
}
