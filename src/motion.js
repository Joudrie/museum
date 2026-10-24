// Walking feel shared by the museum and the island: step frames, a little
// bounce, footstep clicks and dust when running.
import { sfx } from './music.js';

const VIEW = /^(.*)_(down|up|side)(?:_[12])?$/;

// Advance a character's walk cycle. Returns true on the frame a foot lands.
export function animateWalker(scene, s, moving, dt, rate = 1) {
  const key = s.texture.key;
  const m = VIEW.exec(key);
  if (!m) {
    s.setOrigin(0.5, 1); // sitting, on the phone...
    return false;
  }
  const base = `${m[1]}_${m[2]}`;
  if (!moving) {
    s.walkT = 0;
    s.setOrigin(0.5, 1);
    if (key !== base) s.setTexture(base);
    return false;
  }
  const before = Math.floor((s.walkT || 0) * 8);
  s.walkT = (s.walkT || 0) + dt * rate;
  const step = Math.floor(s.walkT * 8);
  const phase = step % 4; // stand, step one, stand, step two
  const want = phase === 1 ? `${base}_1` : phase === 3 ? `${base}_2` : base;
  if (want !== key && scene.textures.exists(want)) s.setTexture(want);
  s.setOrigin(0.5, 1 + (phase % 2) / 32);
  return step !== before && phase % 2 === 1;
}

// A soft footstep (player only).
export function footstep(surface = 'floor') {
  sfx(surface === 'sand' ? 'stepSoft' : surface === 'grass' ? 'stepGrass' : 'step');
}

// Little puffs of dust kicked up behind a running character.
export function dust(scene, x, y, color = 0xd8ccb8) {
  if (!scene.textures.exists('dust_puff')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1).fillRect(1, 0, 2, 4).fillRect(0, 1, 4, 2);
    g.generateTexture('dust_puff', 4, 4);
    g.destroy();
  }
  for (let i = 0; i < 2; i++) {
    const p = scene.add.image(x + (Math.random() - 0.5) * 8, y - 1, 'dust_puff').setTint(color).setAlpha(0.7).setDepth(y - 0.5);
    scene.tweens.add({ targets: p, x: p.x + (Math.random() - 0.5) * 10, y: p.y - 3 - Math.random() * 3, alpha: 0, scale: 1.8, duration: 380 + Math.random() * 200, onComplete: () => p.destroy() });
  }
}
