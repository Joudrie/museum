// Booted from main.js. Only the build flags load with the game (the progression layer reads them, and
// the body classes must be on before anything draws); the log, sessions, telemetry and the ?evlog panel
// load a moment later as their own chunk (index.js), so they cost nothing on the main bundle's budget.
import { SYSTEMS, flagOn, progressionOff } from './flags.js';
import './measure.css';

if (typeof document !== 'undefined') {
  const b = document.body.classList;
  if (progressionOff()) b.add('progression-off');
  Object.keys(SYSTEMS).forEach((k) => !flagOn(k) && b.add(`no-${k}`));
  import('./index.js');
}
