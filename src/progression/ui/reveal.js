// The catch card (the existing #catch dialog), with its reveal scaled to the
// rarity: common is a quick pop; rare pauses and shimmers; epic dims the screen
// and bursts; legendary ducks the music and unfolds slowly in gold.
// Also the near-miss card for a fish that got away, and the reel minigame.
import { sfx, duckMusic } from '../../music.js';
import { haptic } from '../../ui.js';
import { drawEntry, drawShadow } from '../../collections/render.js';
import { RARITY } from '../../collections/index.js';
import { rarityClass } from './juice.js';

const card = document.getElementById('catch');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const COLORS = ['', '#f0ece4', '#6fd07a', '#5aa8f0', '#c88af0', '#f2d36b'];
const SIZE_WORD = { S: 'small', M: 'medium', L: 'large', XL: 'extra large', Trophy: 'a trophy' };

export const catchOpen = () => !card.classList.contains('hidden');

function burst(color, n = 24) {
  const box = document.createElement('div');
  box.className = 'burst';
  for (let i = 0; i < n; i++) {
    const b = document.createElement('i');
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const d = 70 + Math.random() * 110;
    b.style.cssText = `--c:${color};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;animation-delay:${Math.random() * 0.12}s`;
    box.appendChild(b);
  }
  card.querySelector('.catch-card').appendChild(box);
  setTimeout(() => box.remove(), 1200);
}

// A PNG of the legendary catch (optional): fish art, name, size and date drawn on a canvas.
function savePicture(sp, rec) {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 600;
  const g = c.getContext('2d');
  g.fillStyle = '#1d1714';
  g.fillRect(0, 0, 480, 600);
  g.strokeStyle = COLORS[5];
  g.lineWidth = 8;
  g.strokeRect(14, 14, 452, 572);
  const art = drawEntry(sp.entry, 6);
  g.imageSmoothingEnabled = false;
  const w = Math.min(380, art.width * 3);
  g.drawImage(art, (480 - w) / 2, 120, w, (art.height * w) / art.width);
  g.fillStyle = COLORS[5];
  g.font = 'bold 30px Georgia, serif';
  g.textAlign = 'center';
  g.fillText(`${rec.variant ? rec.variant + ' ' : ''}${sp.name}`, 240, 80);
  g.fillStyle = '#f4ead6';
  g.font = '22px Georgia, serif';
  g.fillText(`${rec.size >= 100 ? (rec.size / 100).toFixed(2) + ' m' : rec.size + ' cm'} · ${RARITY[sp.rarity]}`, 240, 440);
  g.fillText(new Date().toLocaleDateString(), 240, 480);
  g.fillStyle = '#b9a98f';
  g.fillText('Curation', 240, 560);
  const a = document.createElement('a');
  a.download = `${sp.id}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
}

/** Shows a catch. `rec` is the service's last-catch record, `sp` the species. */
export function showReveal(sp, rec, onClose) {
  const r = rec.variant ? 5 : sp.rarity;
  card.className = `rarity-${sp.rarity}`;
  card.classList.remove('hidden');
  const pic = card.querySelector('.catch-pic');
  pic.className = `catch-pic hide-in ${rec.variant || ''}`;
  pic.style.setProperty('--wash', sp.rarity === 5 ? '1.6s' : sp.rarity === 4 ? '0.7s' : sp.rarity === 3 ? '0.45s' : '0.15s');
  pic.replaceChildren(drawEntry(sp.entry, 6));
  const size = rec.size >= 100 ? `${(rec.size / 100).toFixed(2)} m` : `${rec.size} cm`;
  const name = `${rec.variant ? rec.variant[0].toUpperCase() + rec.variant.slice(1) + ' ' : ''}${sp.name}`;
  card.querySelector('.catch-title').innerHTML = `You caught ${/^[aeiou]/i.test(name) ? 'an' : 'a'} <span class="${rarityClass(sp.rarity, rec.variant)}">${esc(name)}</span>!`;
  const chips = [];
  chips.push(`<span class="chip ${rarityClass(sp.rarity)}" style="color:${COLORS[sp.rarity]}">${RARITY[sp.rarity]}</span>`);
  chips.push(`<span class="chip">${size} · ${rec.sizeClass}</span>`);
  if (rec.trophy) chips.push('<span class="chip trophy">★ TROPHY</span>');
  if (rec.fresh) chips.push('<span class="chip new">NEW</span>');
  if (rec.personalBest) chips.push('<span class="chip pb">PERSONAL BEST</span>');
  if (rec.perfect) chips.push('<span class="chip perfect">PERFECT</span>');
  if (rec.doubled) chips.push('<span class="chip perfect">DOUBLE CATCH</span>');
  card.querySelector('.catch-meta').innerHTML = `<span class="chip-row">${chips.join('')}</span>`;
  card.querySelector('.catch-note').textContent = sp.blurb || '';
  const hint = card.querySelector('.catch-hint');
  hint.textContent = 'Tap to continue';
  card.querySelector('.save-pic')?.remove();

  // choreography by rarity
  const tier = rec.variant ? Math.max(sp.rarity, 4) : sp.rarity;
  card.classList.toggle('dim', tier >= 4);
  let delay = 350;
  if (tier === 1) sfx('pop', 0);
  if (tier === 2) {
    sfx('pop', 2);
    burst('#6fd07a', 10);
  }
  if (tier === 3) {
    sfx('shimmer');
    haptic(30);
    setTimeout(() => burst('#5aa8f0', 16), 300);
    delay = 600;
  }
  if (tier === 4) {
    sfx('burst');
    haptic([30, 40, 60]);
    setTimeout(() => burst('#c88af0', 30), 450);
    delay = 900;
  }
  if (tier >= 5 || sp.rarity === 5) {
    duckMusic(4200, 0.08);
    sfx('legend');
    haptic([40, 60, 40, 80, 120]);
    setTimeout(() => burst('#f2d36b', 40), 900);
    setTimeout(() => burst('#fff2b8', 26), 1500);
    delay = 2000;
    const b = document.createElement('button');
    b.className = 'save-pic ui-btn';
    b.textContent = 'Save picture';
    b.onclick = (e) => {
      e.stopPropagation();
      savePicture(sp, rec);
    };
    card.querySelector('.catch-card').appendChild(b);
  }
  if (rec.trophy && sp.rarity < 5) setTimeout(() => sfx('stamp'), 500);
  if (rec.personalBest) setTimeout(() => sfx('unlock'), delay);
  const close = () => {
    card.classList.add('hidden');
    card.classList.remove('dim');
    card.onclick = null;
    onClose?.();
  };
  setTimeout(() => (card.onclick = close), Math.max(350, delay));
}

/** "It got away… it was XL!" Undiscovered species show as ???. */
export function showNearMiss(rec, sp, onClose) {
  card.className = 'rarity-1';
  card.classList.remove('hidden');
  const pic = card.querySelector('.catch-pic');
  pic.className = 'catch-pic';
  pic.replaceChildren(sp ? drawShadow(sp.entry, 6) : document.createElement('span'));
  card.querySelector('.catch-title').textContent = 'It got away…';
  const word = SIZE_WORD[rec.sizeClass] || rec.sizeClass;
  card.querySelector('.catch-meta').innerHTML = `<span class="chip-row"><span class="chip">${rec.known ? esc(rec.name) : '???'}</span><span class="chip">${rec.sizeClass}</span></span>`;
  card.querySelector('.catch-note').textContent = rec.known ? `It was ${rec.sizeClass === 'Trophy' ? 'a trophy-sized' : 'a ' + word} ${rec.name}. Next time.` : `Something ${word} slipped off the hook. What was it?`;
  card.querySelector('.save-pic')?.remove();
  card.querySelector('.catch-hint').textContent = 'Tap to try again';
  sfx('nope');
  const close = () => {
    card.classList.add('hidden');
    card.onclick = null;
    onClose?.();
  };
  setTimeout(() => (card.onclick = close), 450);
}

// ---------------- the reel ----------------
let reelEl = null;
export function runReel(reel, { legend, onEnd, lineTension }) {
  if (!reelEl) {
    reelEl = document.createElement('div');
    reelEl.id = 'reel';
    reelEl.className = 'hidden';
    reelEl.innerHTML = '<div class="rl-box"><div class="rl-hint">Hold to lift · let go to sink</div><div class="rl-track"><div class="rl-zone"></div><div class="rl-fish"></div></div><div class="rl-prog"><i></i></div></div>';
    document.body.appendChild(reelEl);
  }
  const zone = reelEl.querySelector('.rl-zone');
  const fish = reelEl.querySelector('.rl-fish');
  const prog = reelEl.querySelector('.rl-prog i');
  const hint = reelEl.querySelector('.rl-hint');
  reelEl.classList.toggle('legend', !!legend);
  zone.style.height = `${reel.size * 100}%`;
  reelEl.classList.remove('hidden');
  let holding = false;
  const down = (e) => {
    holding = true;
    e.preventDefault();
  };
  const up = () => (holding = false);
  reelEl.addEventListener('pointerdown', down);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  let last = performance.now();
  let raf = 0;
  let hintShown = 2500;
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    reel.step(dt, holding);
    zone.style.bottom = `${(reel.zone - reel.size / 2) * 100}%`;
    fish.style.bottom = `${reel.fish * 100}%`;
    prog.style.height = `${reel.progress * 100}%`;
    const inside = Math.abs(reel.fish - reel.zone) <= reel.size / 2;
    zone.style.background = inside ? 'rgba(111,208,122,0.6)' : 'rgba(224,112,92,0.45)';
    reelEl.classList.toggle('shake', reel.progress < 0.18 || (legend && reel.hard > 1));
    if (reel.progress < 0.18 && Math.random() < 0.05) sfx('brink');
    hintShown -= dt * 1000;
    hint.style.opacity = hintShown > 0 ? 1 : 0;
    if (reel.over) return finish();
    raf = requestAnimationFrame(frame);
  };
  const finish = () => {
    reelEl.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    reelEl.classList.add('hidden');
    cancelAnimationFrame(raf);
    onEnd(reel);
  };
  raf = requestAnimationFrame(frame);
  // cancelling (the scene shut down, the player walked off) puts the overlay away without reporting a result
  return () => {
    reelEl.removeEventListener('pointerdown', down);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    reelEl.classList.add('hidden');
    cancelAnimationFrame(raf);
  };
}
