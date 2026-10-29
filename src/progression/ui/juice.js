// How rewards look. The reward queue hands each item to present(); this draws
// it, plays the sound, and calls done() when the next one may start.
// Magnitude hierarchy: an XP tick is small, a skill bar is smaller, a new
// species is a stamp, a rank is a ceremony. If everything celebrates, nothing does.
import { sfx, duckMusic } from '../../music.js';
import { haptic } from '../../ui.js';
import { uiIcon } from '../../ui/icons.js';
import { COSMETICS } from '../grants.js';
import { drawEntry, drawShadow } from '../../collections/render.js';
import { speciesById } from '../species.js';
import { levelOf } from '../rank.js';

const ALIAS = { gold: 'coin', cosmetic: 'star', title: 'star', bait: 'fish', unlock: 'key', xp: 'star', token: 'star', note: 'info', fish: 'fish' };
export const icon = (name, size = '') => uiIcon(ALIAS[name] || name, size);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
};
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const rarityClass = (r, variant) => (variant ? 'rv' : `r${r}`);

let layer, pill, pops, skillBar, card, rankEl;
let shown = { pct: 0, level: 0 };
let dispXp = 0; // the XP the pill shows: it follows the queue, so a rank number never changes before its ceremony
let shownLevel = 1;
let progRef = null;
let skillTimer = null;
let cardTimer = null;

export function mountLayer(p) {
  if (layer) return;
  progRef = p;
  layer = el('div');
  layer.id = 'prog-layer';
  layer.innerHTML = `
    <div id="prog-pill" role="button" tabindex="0" aria-label="Rank and goal: tap for goals">
      <span class="pp-rank"><span><small>RANK</small><b class="pp-lv">1</b></span></span>
      <div class="pp-bar"><i class="pp-rested"></i><i class="pp-fill"></i></div>
      <div class="pp-goal"><span class="pp-goal-text"></span><span class="pp-n"></span></div>
      <button class="pp-fold" aria-label="Fold the goal">⌃</button>
    </div>
    <div id="prog-pops"></div>
    <div id="prog-skill" class="hidden"><div class="sk-row"><span class="sk-name"></span><span class="sk-lv"></span></div><div class="sk-bar"><i></i></div><div class="sk-perk"></div></div>
    <div id="prog-card" class="hidden"></div>
    <div id="prog-rank" class="hidden"></div>`;
  document.body.appendChild(layer);
  pill = layer.querySelector('#prog-pill');
  pops = layer.querySelector('#prog-pops');
  skillBar = layer.querySelector('#prog-skill');
  card = layer.querySelector('#prog-card');
  rankEl = layer.querySelector('#prog-rank');
  pill.querySelector('.pp-fold').onclick = (e) => {
    e.stopPropagation();
    pill.classList.toggle('collapsed');
    try {
      localStorage.setItem('curation.pillFold', pill.classList.contains('collapsed') ? '1' : '');
    } catch {
      // convenience only
    }
  };
  try {
    pill.classList.toggle('collapsed', !!localStorage.getItem('curation.pillFold'));
  } catch {
    // convenience only
  }
  pill.onclick = () => window.dispatchEvent(new CustomEvent('open-goals'));
  pill.onkeydown = (e) => (e.key === 'Enter' || e.key === ' ') && pill.click();
  syncPill(p);
}

/** Redraws the rank bar and the pinned goal from the state. */
export function syncPill(p = progRef) {
  dispXp = p.state.rank.xp;
  shownLevel = p.level().level;
  refreshPill(p, true);
}

export function refreshPill(p = progRef, instant = false) {
  if (!pill || !p) return;
  let lv = levelOf(dispXp || p.state.rank.xp, p.T);
  if (lv.level > shownLevel) lv = { ...levelOf(0, p.T), level: shownLevel, rank: Math.min(shownLevel, p.T.rank.max), renown: Math.max(0, shownLevel - p.T.rank.max), pct: 100, need: 1 };
  pill.querySelector('.pp-lv').textContent = lv.renown ? `R${lv.renown}` : lv.rank;
  pill.querySelector('.pp-rank small').textContent = lv.renown ? 'RENOWN' : 'RANK';
  const fill = pill.querySelector('.pp-fill');
  const rested = pill.querySelector('.pp-rested');
  if (instant) fill.style.transition = 'none';
  fill.style.width = `${lv.pct}%`;
  // the blue segment: how much rested XP is waiting, as a share of this level
  const pool = p.state.rested.pool;
  rested.style.width = `${Math.min(100, lv.pct + (100 * pool) / Math.max(1, lv.need))}%`;
  if (instant) requestAnimationFrame(() => (fill.style.transition = ''));
  shown = { pct: lv.pct, level: lv.level };
  const g = p.goals?.pinnedOrAuto?.();
  pill.title = p.market?.nameplate().title || '';
  pill.querySelector('.pp-goal-text').textContent = g ? g.title : 'Tap for your goals';
  pill.querySelector('.pp-n').textContent = g && g.n !== undefined ? `${g.n}/${g.of}` : '';
}

const countUp = (node, to, ms = 500) => {
  if (reduced()) {
    node.textContent = to;
    return;
  }
  const t0 = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    node.textContent = Math.round(to * k);
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

function popXp(item) {
  const n = el('div', `prog-pop${item.bonus ? ' rested' : ''}`);
  n.innerHTML = `+<span class="v">0</span> XP${item.bonus ? `<small>rested +${Math.round(item.bonus)}</small>` : ''}`;
  pops.appendChild(n);
  if (item.xpAfter) dispXp = item.xpAfter;
  countUp(n.querySelector('.v'), Math.round(item.amount), 420);
  setTimeout(() => n.remove(), 1200);
  sfx('tickup', item.step || 0);
  haptic(6);
  refreshPill();
  pill.classList.remove('pulse');
  void pill.offsetWidth;
  pill.classList.add('pulse');
}

function skillBarShow(item) {
  clearTimeout(skillTimer);
  skillBar.classList.remove('hidden');
  skillBar.querySelector('.sk-name').textContent = `${item.icon || ''} ${item.name}`;
  skillBar.querySelector('.sk-lv').textContent = `Lv ${item.level}`;
  const fill = skillBar.querySelector('.sk-bar i');
  fill.style.width = item.up ? '100%' : `${item.pct || 0}%`;
  skillBar.querySelector('.sk-perk').textContent = item.perk ? `${item.perk.label}: ${item.perk.text}` : '';
  requestAnimationFrame(() => skillBar.classList.add('on'));
  skillTimer = setTimeout(() => {
    skillBar.classList.remove('on');
    setTimeout(() => skillBar.classList.add('hidden'), 450);
  }, item.up ? 2600 : 1500);
}

function cardShow(html, rarity, ms, onClose) {
  clearTimeout(cardTimer);
  card.className = rarity ? `rarity-${rarity}` : '';
  card.innerHTML = html;
  card.classList.remove('hidden');
  requestAnimationFrame(() => card.classList.add('on'));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    clearTimeout(cardTimer);
    card.classList.remove('on');
    setTimeout(() => {
      card.classList.add('hidden');
    }, 260);
    onClose?.();
  };
  card.onclick = close;
  cardTimer = setTimeout(close, ms);
  return close;
}

const chip = (r) => {
  const cos = r.cosmetic ? COSMETICS[r.cosmetic] : r.title ? COSMETICS[`title:${r.title}`] : null;
  const sw = cos?.color ? `<i class="sw" style="background:${cos.color}"></i>` : `<span aria-hidden="true">${icon(r.icon)}</span>`;
  return `<span class="pc-chip ${cos ? `r${cos.rarity}` : ''}">${sw}${esc(r.text)}</span>`;
};

function speciesCard(item, done) {
  const sp = speciesById(item.speciesId);
  const pic = el('div', 'pc-pic');
  if (sp) {
    const c = drawEntry(sp.entry, 3);
    c.classList.add('sil');
    pic.appendChild(c);
  }
  const html = `<span class="stamp">NEW</span><div class="pc-kicker">Journal · Fish</div><b class="pc-title ${rarityClass(item.rarity)}">${esc(item.name)}</b><div class="pc-sub">Stamped${item.where ? ` at ${esc(item.where)}` : ''} · ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>`;
  const close = cardShow(html, item.rarity, 1500, done);
  card.insertBefore(pic, card.querySelector('.pc-title'));
  setTimeout(() => {
    sfx('stamp');
    haptic(18);
  }, 520);
  sfx('shimmer');
  return close;
}

function rankCeremony(item, done) {
  const lockMs = 1200;
  rankEl.className = item.major ? 'major' : '';
  const label = item.renown ? 'RENOWN' : 'RANK';
  const num = item.renown || item.rank;
  const next = item.next;
  rankEl.innerHTML = `<i class="edge"></i><div class="pr-box">
    <div class="pr-kicker">${label}</div><div class="pr-num">${num}</div>
    <div class="pr-label">${item.major ? 'A big step!' : 'Level up'}</div>
    <div class="pr-card"><div class="pr-card-in"><h4>Reward</h4><div class="pc-rewards">${item.rewards.map(chip).join('') || '<span class="pc-chip">Keep going</span>'}</div></div></div>
    <div class="pr-next">Next: ${esc(next.label)} ${next.text ? `<span class="pc-chip">${icon('star')}${esc(next.text)}</span>` : ''}</div>
    <div class="pr-tap">tap to continue</div></div>`;
  rankEl.classList.remove('hidden');
  requestAnimationFrame(() => rankEl.classList.add('on'));
  sfx('sting');
  setTimeout(() => sfx(item.major ? 'burst' : 'unlock'), 520);
  haptic(40);
  document.body.classList.add('prog-lock');
  let ready = false;
  const close = () => {
    if (!ready) return; // input is locked for 1.2 s
    rankEl.onclick = null;
    rankEl.classList.remove('on', 'ready');
    document.body.classList.remove('prog-lock');
    shownLevel = item.level || shownLevel + 1;
    setTimeout(() => rankEl.classList.add('hidden'), 260);
    refreshPill();
    done();
  };
  rankEl.onclick = close;
  setTimeout(() => {
    ready = true;
    rankEl.classList.add('ready');
  }, lockMs);
  setTimeout(close, 6500);
}

/** The queue's presenter. */
export function present(item, done) {
  if (!layer) return done();
  const step = item.step || 0;
  switch (item.kind) {
    case 'xp':
      popXp(item);
      return setTimeout(done, 420);
    case 'skill':
      skillBarShow(item);
      sfx(item.up ? 'unlock' : 'tickup', step);
      if (item.up) haptic(20);
      return setTimeout(done, item.up ? 900 : 320);
    case 'species':
      return speciesCard(item, done);
    case 'variant': {
      cardShow(`<div class="pc-kicker">New variant</div><b class="pc-title rv">${esc(item.variant)} ${esc(item.name)}</b><div class="pc-sub">Its own slot in the journal.</div>`, 5, 2000, done);
      sfx('shimmer');
      return;
    }
    case 'rank':
      return rankCeremony(item, done);
    case 'milestone':
      cardShow(`<div class="pc-kicker">Journal milestone</div><b class="pc-title">${item.pct}% of ${esc(item.page)}</b><div class="pc-rewards">${(item.rewards || []).map(chip).join('')}</div>`, 4, 2300, done);
      sfx('burst');
      haptic(30);
      return;
    case 'task':
    case 'request':
    case 'heart':
    case 'streak':
    case 'unlock':
    case 'item':
    case 'gold': {
      const kick = { task: 'Task done', request: 'Request done', heart: 'Friendship', streak: 'Streak', unlock: 'Unlocked', item: 'Got it', gold: 'Gold' }[item.kind];
      cardShow(`<div class="pc-kicker">${kick}</div><b class="pc-title">${esc(item.title || '')}</b>${item.sub ? `<div class="pc-sub">${esc(item.sub)}</div>` : ''}<div class="pc-rewards">${(item.rewards || []).map(chip).join('')}</div>`, item.rarity || 0, 2000, done);
      sfx('pop', step);
      haptic(14);
      return;
    }
    default:
      cardShow(`<b class="pc-title">${esc(item.title || item.label || '')}</b>${item.sub ? `<div class="pc-sub">${esc(item.sub)}</div>` : ''}`, 0, 1600, done);
      sfx('tap');
  }
}

export { duckMusic };
