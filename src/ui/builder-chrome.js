// The builder's top-bar glyphs become pixel icons (the page's own script keeps the ids).
import { uiIcon } from './icons.js';

const set = (id, icon) => {
  const b = document.getElementById(id);
  if (b) b.innerHTML = uiIcon(icon);
};
set('menu-btn', 'menu');
set('undo', 'undo');
set('redo', 'redo');
set('chosen-turn', 'turn');
const selTurn = document.getElementById('sel-turn');
if (selTurn) selTurn.innerHTML = `${uiIcon('turn', 's')} Turn`;

// the favourite star: the page writes a glyph, we swap it for the pixel star
const fav = document.getElementById('chosen-fav');
if (fav) {
  const skin = () => {
    const t = fav.textContent.trim();
    if (t !== '★' && t !== '☆') return;
    fav.innerHTML = uiIcon(t === '★' ? 'star' : 'star-o');
    fav.setAttribute('aria-pressed', t === '★' ? 'true' : 'false');
  };
  new MutationObserver(skin).observe(fav, { childList: true, characterData: true, subtree: true });
  skin();
}

// the map name opens the menu: make it a real button for keyboards and screen readers
const name = document.getElementById('map-name');
if (name) {
  name.setAttribute('role', 'button');
  name.setAttribute('tabindex', '0');
  name.setAttribute('aria-label', 'Map menu');
  name.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), name.click()));
}
