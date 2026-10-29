// The developer panel (dev only: open the game with ?debug=1, or set localStorage curation.debug=1).
// Grants XP, sets rank and skills, sets time, weather and season, forces the next catch (a species and a
// variant), skips days, resets dailies, shows pity counters, toggles subscriber. Nothing here is in normal play.
import { progression } from '../index.js';
import { cumXp } from '../rank.js';
import { skillCum, skillIds } from '../skills.js';
import { allSpecies } from '../species.js';

export function mountDebug() {
  const on = /[?&]debug=1/.test(location.search) || (() => { try { return !!localStorage.getItem('curation.debug'); } catch { return false; } })();
  if (!on) return;
  const p = progression();
  p.debug.on = true;
  const el = document.createElement('div');
  el.id = 'debug-panel';
  el.style.cssText = 'position:fixed;left:6px;bottom:6px;z-index:60;font:11px monospace;background:rgba(0,0,0,.85);color:#9f9;padding:6px;max-width:300px;max-height:60vh;overflow:auto;border:1px solid #484';
  const row = (label, fn) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'margin:2px;font:11px monospace';
    b.onclick = () => {
      fn();
      p.store.commit();
      render();
    };
    return b;
  };
  const pity = () => `pity rare ${p.state.fish.pity.rare} epic ${p.state.fish.pity.epic} legends ${JSON.stringify(p.state.fish.pity.legend)} rolls ${p.state.fish.rolls}`;
  function render() {
    el.replaceChildren();
    const lv = p.level();
    el.append(`rank ${lv.level} · xp ${p.state.rank.xp} · gold ${Math.round(p.gold.get())} · sub ${p.state.sub.active} · day ${p.today()}`, document.createElement('br'), pity(), document.createElement('br'));
    el.append(
      row('+500 XP', () => p.xp(500, 'debug')),
      row('rank +1', () => p.xp(cumXp(lv.level + 1) - p.state.rank.xp + 1, 'debug')),
      row('rank 10', () => p.xp(Math.max(0, cumXp(10) - p.state.rank.xp), 'debug')),
      row('rank 30', () => p.xp(Math.max(0, cumXp(30) - p.state.rank.xp), 'debug')),
      row('+1000 gold', () => p.gold.add(1000)),
      row('skills 20', () => skillIds().forEach((s) => (p.state.skills[s] = skillCum(s, 20)))),
      row('skills 1', () => skillIds().forEach((s) => (p.state.skills[s] = 0))),
      row('sub on/off', () => (p.state.sub.active ? p.sub.cancel() : p.sub.activate())),
      row('+1 day', () => { p.clock.advance(864e5); p.start(); }),
      row('+7 days', () => { p.clock.advance(7 * 864e5); p.start(); }),
      row('+40 h away', () => { p.state.lastSeenAt -= 40 * 3600e3; p.start(); }),
      row('reset dailies', () => { p.state.tasks.day = 0; p.tasks.rollDay(); p.state.requests.day = 0; }),
      row('weather rain', () => (p.debug.weather = 'rain')),
      row('weather fog', () => (p.debug.weather = 'fog')),
      row('weather snow', () => (p.debug.weather = 'snow')),
      row('weather clear', () => (p.debug.weather = null)),
      row('night', () => (p.debug.hour = 23)),
      row('dawn', () => (p.debug.hour = 6)),
      row('day', () => (p.debug.hour = null)),
      row('winter', () => (p.debug.season = 'winter')),
      row('summer', () => (p.debug.season = null)),
      row('golden next', () => (p.debug.force = { ...(p.debug.force || {}), variant: 'golden' })),
      row('clear force', () => (p.debug.force = null)),
      row('reveal all chunks', () => {}),
    );
    const sel = document.createElement('select');
    sel.style.cssText = 'font:11px monospace;max-width:160px';
    allSpecies().forEach((s) => sel.append(new Option(`${s.name} (${s.rarity})`, s.id)));
    el.append(document.createElement('br'), sel, row('force next catch', () => (p.debug.force = { ...(p.debug.force || {}), speciesId: sel.value })));
  }
  render();
  document.body.appendChild(el);
  window.__debug = { render };
}
