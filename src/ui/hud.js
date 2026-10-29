// The world HUD and the Menu hub (docs/UI.md): a few labelled buttons, one Menu for everything else.
// Left: Journal, Build, Style. Right: Menu (a dot when there is a daily gift to take).
// The Menu hub holds Today, Income, Share & visit and Settings. The old buttons keep their ids
// (#daily-btn, #settings-btn) and behaviour: they now live in the hub as its tiles.
import { uiIcon } from './icons.js';
import { openSettings } from '../settingsmenu.js';
import { addCoins } from '../wallet.js';
import { collectEverything } from '../collections/codex.js';
import { sfx } from '../music.js';
import { hint } from './hint.js';

const $ = (id) => document.getElementById(id);

function relabel(id, icon, text) {
  const b = $(id);
  if (!b) return;
  const badge = b.querySelector('.badge');
  b.classList.add('hud-btn');
  b.innerHTML = `${uiIcon(icon)}<span>${text}</span>`;
  if (badge) b.appendChild(badge);
}

function tile(el, icon, title, sub) {
  el.classList.remove('pixel-btn', 'hud-btn');
  el.classList.add('hub-tile');
  const badge = el.querySelector('.badge');
  el.innerHTML = `<span class="hub-ic">${uiIcon(icon, 'l')}</span><b>${title}</b><small>${sub}</small>`;
  if (badge) el.appendChild(badge);
  return el;
}

const activeScene = () => window.__game?.scene.getScenes(true)[0];
const outside = () => document.body.classList.contains('outside');

function init() {
  relabel('journal-btn', 'book', 'Journal');
  relabel('build-btn', 'hammer', 'Build');
  relabel('home-btn', 'house', 'Style');
  const menu = $('menu-btn');
  const hub = $('hub');
  if (!menu || !hub) return;
  menu.classList.add('hud-btn');
  const dot = menu.querySelector('.badge');
  menu.insertAdjacentHTML('afterbegin', `${uiIcon('menu')}<span>Menu</span>`);
  $('collect-all').classList.add('ui-btn', 'ui-btn--primary');
  $('collect-all').classList.remove('pixel-btn');
  hub.querySelector('.hub-close').innerHTML = uiIcon('close');

  const grid = hub.querySelector('.hub-grid');
  const today = $('daily-btn');
  const settings = $('settings-btn');
  const income = document.createElement('button');
  income.id = 'hub-income';
  const share = document.createElement('button');
  share.id = 'hub-share';
  const field = document.createElement('button');
  field.id = 'hub-field';
  field.onclick = () => window.dispatchEvent(new CustomEvent('open-field', { detail: 'goals' }));
  const rest = document.createElement('button');
  rest.id = 'hub-rest';
  rest.onclick = () => import('../progression/ui/restui.js').then((m) => m.openBreak());
  const tiles = [
    tile(field, 'map', 'Field journal', 'Goals, fish, people, places'),
    today && tile(today, 'gift', 'Today', 'Gift, wheel, painting of the day'),
    tile(income, 'coin', 'Your museum', 'Income and rooms'),
    tile(share, 'share', 'Share & visit', 'Send a link, visit a friend'),
    settings && tile(settings, 'gear', 'Settings', 'Sound, look, your data'),
    tile(rest, 'clock', 'Take a break', 'What is waiting for next time'),
  ].filter(Boolean);
  grid.append(...tiles);

  income.onclick = () => $('hud').click();
  share.onclick = () => window.__share?.openShare();
  // Settings: in the museum the scene's own handler runs (it also offers the reset); on an island open it directly.
  if (settings) {
    const museumHandler = () => settings.onclick;
    settings.addEventListener('click', (e) => {
      if (!outside()) return;
      e.stopImmediatePropagation();
      const s = activeScene();
      if (s) s.paused = true;
      openSettings({
        onAddCoins: (n) => addCoins(n),
        onCollectAll: () => collectEverything(),
        onReset: () => s?.toast?.('Reset the museum from inside the museum.'),
        onClose: () => s && (s.paused = false),
      });
    }, true);
    void museumHandler;
  }

  const close = () => hub.classList.add('hidden');
  const open = () => {
    const s = $('daily-btn')?.querySelector('.badge');
    income.style.display = outside() ? 'none' : '';
    const sub = today?.querySelector('small');
    const st = window.__daily?.dailyState?.();
    if (sub && st) sub.textContent = st.giftReady ? 'A gift is waiting' : st.wheelReady ? 'A free spin is waiting' : 'Gift, wheel, painting of the day';
    void s;
    sfx('open');
    hub.classList.remove('hidden');
  };
  menu.onclick = open;
  hub.querySelector('.hub-close').onclick = close;
  hub.addEventListener('click', (e) => e.target === hub && close());
  // choosing a tile closes the menu first, so the thing it opens is not under it
  grid.addEventListener('click', (e) => e.target.closest('.hub-tile') && close(), true);

  // the Menu button shows the daily dot
  const mirror = () => {
    const none = !!today?.querySelector('.badge')?.classList.contains('hidden');
    dot.classList.toggle('hidden', none);
    if (!none) hint('menu-gift', 'A gift is waiting. Open the Menu, then Today.', '#menu-btn');
  };
  if (today) {
    new MutationObserver(mirror).observe(today.querySelector('.badge'), { attributes: true, attributeFilter: ['class'] });
    mirror();
  }
  // a goal to claim: the Journal button's dot
  const jdot = $('journal-btn')?.querySelector('.badge');
  if (jdot) {
    const watch = () => !jdot.classList.contains('hidden') && hint('journal-claim', 'A goal is done. Open the Journal to claim its gold.', '#journal-btn', { side: 'right' });
    new MutationObserver(watch).observe(jdot, { attributes: true, attributeFilter: ['class'] });
    watch();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
  else setTimeout(init, 0);
}
