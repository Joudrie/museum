// Applies the look settings to the page (Settings → Look, Play): text size, reduced motion, left-handed layout.
// html[data-text="large"] raises every UI text token; html[data-motion="reduce"] turns UI motion off;
// html[data-hand="left"] mirrors the HUD and the Interact button (src/ui/hud.css).
import { settings } from '../settings.js';

function apply() {
  const s = settings();
  const root = document.documentElement;
  if (s.text === 'large') root.dataset.text = 'large';
  else delete root.dataset.text;
  if (s.reduceMotion) root.dataset.motion = 'reduce';
  else delete root.dataset.motion;
  if (s.leftHanded) root.dataset.hand = 'left';
  else delete root.dataset.hand;
}

apply();
window.addEventListener('settings', apply);
