// The builder's top-bar glyphs become pixel icons (the page's own script keeps the ids).
import { uiIcon } from './icons.js';

const set = (id, icon) => {
  const b = document.getElementById(id);
  if (b) b.innerHTML = uiIcon(icon);
};
set('menu-btn', 'menu');
set('undo', 'undo');
set('redo', 'redo');
