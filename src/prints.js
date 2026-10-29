// Footprints: you leave them in soft sand and in snow, they slowly fill in. A
// fixed pool of little pictures is reused (a long walk never piles up objects), so
// the cost is the same however far anyone walks. Works for the player and for
// anyone else walking by.

const KEY = 'print_foot';

// 6×7: the ball of the foot and the heel, pointing up. The top edge is
// drawn a shade darker, so it reads as pressed in.
const FOOT = ['.dddd.', 'dddddd', 'dddddd', '.dddd.', '......', '.dddd.', '.dddd.'];

function texture(scene) {
  if (scene.textures.exists(KEY)) return;
  const t = scene.textures.createCanvas(KEY, 6, 7);
  const g = t.getContext();
  FOOT.forEach((row, y) =>
    [...row].forEach((c, x) => {
      if (c !== 'd') return;
      g.fillStyle = FOOT[y - 1]?.[x] === 'd' ? '#ffffff' : '#a6a6a6'; // (tinted per surface)
      g.fillRect(x, y, 1, 1);
    }),
  );
  t.refresh();
}

// what each surface looks like pressed
const LOOK = {
  snow: { tint: 0x9fb6d6, alpha: 0.9, life: 16000 },
  sand: { tint: 0xb8905a, alpha: 0.7, life: 6000 },
  mud: { tint: 0x5a4430, alpha: 0.55, life: 9000 },
};

export class Prints {
  constructor(scene, size = 90) {
    this.scene = scene;
    texture(scene);
    this.pool = Array.from({ length: size }, () => ({ img: scene.add.image(0, 0, KEY).setVisible(false).setDepth(0.6), born: 0, life: 1, alpha: 1 }));
    this.next = 0;
    this.live = 0;
  }

  // One footprint at (x, y) for someone heading (hx, hy); `left` alternates the foot.
  step(x, y, hx, hy, left, surface = 'snow') {
    const look = LOOK[surface] || LOOK.sand;
    const len = Math.hypot(hx, hy) || 1;
    const ux = hx / len;
    const uy = hy / len;
    // feet sit either side of the line they're walking along
    const side = left ? -3 : 3;
    const p = this.pool[this.next];
    this.next = (this.next + 1) % this.pool.length;
    p.img
      .setPosition(x - uy * side, y + ux * side)
      .setRotation(Math.atan2(uy, ux) + Math.PI / 2)
      .setTint(look.tint)
      .setAlpha(look.alpha)
      .setVisible(true);
    p.born = this.scene.time.now;
    p.life = look.life;
    p.alpha = look.alpha;
    this.live = this.pool.length;
  }

  update() {
    if (!this.live) return;
    const now = this.scene.time.now;
    let any = false;
    this.pool.forEach((p) => {
      if (!p.img.visible) return;
      const age = (now - p.born) / p.life;
      if (age >= 1) return p.img.setVisible(false);
      any = true;
      // solid for the first half of its life, then it fills in
      if (age > 0.5) p.img.setAlpha(p.alpha * (1 - (age - 0.5) * 2));
    });
    if (!any) this.live = 0;
  }
}
