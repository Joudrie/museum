// Daily visit: a welcome gift, one free wheel spin and the Painting of the Day.
// Gentle by design: the streak forgives a few missed days, nothing is ever
// lost or nagged about, and every reward is small. Coins only; no timers.
import { load, save } from './storage.js';
import { addCoins } from './wallet.js';
import { PAINTINGS } from './paintings.js';

const KEY = 'curation.daily'; // { last, streak, best, gift, wheel, prize }

// The wheel's slices, in gold. Equal odds except the top slice, which is rarer.
export const WHEEL = [25, 40, 60, 40, 100, 25, 75, 250];
const WEIGHTS = [14, 14, 12, 14, 8, 14, 10, 2];
export const FORGIVE_DAYS = 3; // a gap of up to this many days keeps the streak

// Whole days since 1970 in the player's own calendar.
export const dayNum = (d = new Date()) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);

export const giftFor = (streak) => 40 + 10 * Math.min(streak, 7);
export const isMilestone = (streak) => streak > 0 && streak % 7 === 0;

const read = () => ({ last: 0, streak: 0, best: 0, gift: 0, wheel: 0, prize: 0, ...load(KEY, {}) });

// Note that the player is here today. Returns the state.
export function visitToday(today = dayNum()) {
  const s = read();
  if (s.last === today) return s;
  const gap = today - s.last;
  // Close days build the streak; a long break quietly starts over at 1.
  s.streak = s.last && gap > 0 && gap <= FORGIVE_DAYS ? s.streak + 1 : 1;
  s.best = Math.max(s.best, s.streak);
  s.last = today;
  save(KEY, s);
  return s;
}

export function dailyState(today = dayNum()) {
  const s = visitToday(today);
  return { ...s, giftReady: s.gift !== today, wheelReady: s.wheel !== today, giftAmount: giftFor(s.streak) + (isMilestone(s.streak) ? 100 : 0) };
}

export function claimGift(today = dayNum()) {
  const s = dailyState(today);
  if (!s.giftReady) return 0;
  save(KEY, { ...read(), gift: today });
  addCoins(s.giftAmount);
  return s.giftAmount;
}

// Spin once a day. `rnd` is injectable for tests. Returns { index, gold } or null.
export function spinWheel(today = dayNum(), rnd = Math.random) {
  const s = dailyState(today);
  if (!s.wheelReady) return null;
  let r = rnd() * WEIGHTS.reduce((a, b) => a + b, 0);
  let index = 0;
  while (index < WEIGHTS.length - 1 && (r -= WEIGHTS[index]) >= 0) index++;
  const gold = WHEEL[index];
  save(KEY, { ...read(), wheel: today, prize: gold }); // saved before the spin plays, so a reload can't lose it
  addCoins(gold);
  return { index, gold };
}

// The same painting for everyone on the same day, walking through the whole list.
export function paintingOfTheDay(today = dayNum(), list = PAINTINGS) {
  const n = list.length;
  if (!n) return null;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  let step = 7;
  while (gcd(step, n) !== 1) step++;
  return list[(((today * step) % n) + n) % n];
}

// ---- the panel ---------------------------------------------------------------
if (typeof document !== 'undefined') {
  const btn = document.createElement('button');
  btn.id = 'daily-btn';
  btn.className = 'pixel-btn';
  btn.setAttribute('aria-label', 'Today: gift, wheel and painting of the day');
  btn.innerHTML = `<svg viewBox="0 0 10 10" width="20" height="20" shape-rendering="crispEdges" aria-hidden="true"><g fill="currentColor"><rect x="1" y="3" width="8" height="6" /><rect x="0" y="2" width="10" height="2" /></g><rect x="4" y="2" width="2" height="7" fill="#e0405a" /><rect x="3" y="0" width="1" height="2" fill="#e8c867" /><rect x="6" y="0" width="1" height="2" fill="#e8c867" /></svg><i class="badge hidden"></i>`;
  document.body.appendChild(btn);

  const el = document.createElement('div');
  el.id = 'daily';
  el.className = 'overlay hidden';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Today');
  el.innerHTML = `<div class="decor-sheet sheet"><div class="decor-head"><h2>Today</h2><button class="daily-close pixel-btn" aria-label="Close">✕</button></div><div class="daily-body"></div></div>`;
  document.body.appendChild(el);
  const body = el.querySelector('.daily-body');

  const refreshBadge = () => {
    const s = dailyState();
    btn.querySelector('.badge').classList.toggle('hidden', !(s.giftReady || s.wheelReady));
  };

  let spinning = false;
  const sliceAngle = 360 / WHEEL.length;

  function wheelEl(spun) {
    const w = document.createElement('div');
    w.className = 'daily-wheel-wrap';
    const stops = WHEEL.map((_, i) => `${i % 2 ? '#3a2a1d' : '#5b4216'} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(',');
    w.innerHTML = `<i class="daily-pointer"></i><div class="daily-wheel" style="background:conic-gradient(${stops})"></div>`;
    const wheel = w.querySelector('.daily-wheel');
    WHEEL.forEach((g, i) => {
      const t = document.createElement('b');
      t.textContent = g;
      t.style.transform = `rotate(${i * sliceAngle + sliceAngle / 2}deg) translateY(-62px)`;
      wheel.appendChild(t);
    });
    return { w, wheel };
  }

  function render(landed) {
    const s = dailyState();
    const poty = paintingOfTheDay();
    body.replaceChildren();

    const gift = document.createElement('section');
    gift.className = 'daily-card';
    gift.innerHTML = `<h3>Welcome back</h3><p class="daily-note"></p>`;
    gift.querySelector('.daily-note').textContent =
      s.streak > 1 ? `You've visited ${s.streak} days running. Take your time; missing a day never costs you anything.` : 'Good to see you. Drop in whenever you like.';
    const g = document.createElement('button');
    g.className = 'wide-btn';
    if (s.giftReady) {
      g.textContent = `Collect ${s.giftAmount} gold${isMilestone(s.streak) ? ' (week bonus!)' : ''}`;
      g.onclick = () => {
        claimGift();
        render();
        refreshBadge();
      };
    } else {
      g.textContent = 'Collected today ✓';
      g.disabled = true;
    }
    gift.appendChild(g);

    const spin = document.createElement('section');
    spin.className = 'daily-card';
    spin.innerHTML = `<h3>Daily wheel</h3>`;
    const { w, wheel } = wheelEl();
    spin.appendChild(w);
    const go = document.createElement('button');
    go.className = 'wide-btn';
    const msg = document.createElement('p');
    msg.className = 'daily-note';
    if (landed) {
      wheel.style.transform = `rotate(${landed.deg}deg)`;
    }
    if (s.wheelReady && !spinning) {
      go.textContent = 'Spin';
      msg.textContent = 'One free spin a day.';
      go.onclick = () => {
        const r = spinWheel();
        if (!r) return;
        spinning = true;
        go.disabled = true;
        // land the chosen slice under the pointer at the top, after a few turns
        const deg = 360 * 4 - (r.index * sliceAngle + sliceAngle / 2);
        wheel.style.transition = 'transform 3.2s cubic-bezier(.15,.7,.1,1)';
        void wheel.offsetWidth;
        wheel.style.transform = `rotate(${deg}deg)`;
        setTimeout(() => {
          spinning = false;
          msg.textContent = `You won ${r.gold} gold!`;
          go.textContent = 'See you tomorrow ✓';
          refreshBadge();
        }, 3300);
      };
    } else {
      go.textContent = spinning ? 'Spinning…' : 'See you tomorrow ✓';
      go.disabled = true;
      msg.textContent = !spinning && s.prize ? `Today's spin: ${s.prize} gold.` : '';
    }
    spin.append(go, msg);

    body.append(gift, spin);

    if (poty) {
      const p = document.createElement('section');
      p.className = 'daily-card daily-poty';
      p.innerHTML = `<h3>Painting of the day</h3><div class="daily-art"><img alt="" /></div><b class="t"></b><i class="a"></i><p class="daily-note b"></p>`;
      const img = p.querySelector('img');
      img.src = poty.src;
      img.onerror = () => img.remove();
      p.querySelector('.daily-art').style.background = poty.placeholder || '#2a1f18';
      p.querySelector('.t').textContent = poty.title;
      p.querySelector('.a').textContent = `${poty.by} · ${poty.year}`;
      p.querySelector('.b').textContent = poty.blurb || '';
      body.appendChild(p);
    }
  }

  const open = () => {
    render();
    el.classList.remove('hidden');
  };
  const close = () => {
    el.classList.add('hidden');
    refreshBadge();
  };
  btn.onclick = open;
  el.querySelector('.daily-close').onclick = close;
  el.addEventListener('click', (e) => e.target === el && close());
  document.addEventListener('visibilitychange', () => !document.hidden && refreshBadge());
  refreshBadge();
  window.__daily = { open, dailyState, paintingOfTheDay }; // for tests
}
