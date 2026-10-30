// Cosmetics you can see. A hat or outfit with a `look` in data/cosmetics.json is drawn into the
// curator's own sprite (people/wardrobe.js curatorLook; the scene's dressPlayer rebuilds it when
// what you wear changes). One without a look falls back to a flat hat and an outfit tint drawn over
// the sprite. Rod skins colour the rod and line (see fishing.js).
import { progression } from '../index.js';
import { COSMETICS } from '../grants.js';

const hexNum = (h) => parseInt((h || '#ffffff').slice(1), 16);

export const cosmeticColor = (slot) => {
  const id = progression().state.market.equipped[slot];
  return id && COSMETICS[id]?.color ? hexNum(COSMETICS[id].color) : null;
};

// the worn hat and outfit that have a real look, for curatorLook: outfit first, the hat on top
export function wornLooks() {
  const m = progression().state.market.equipped;
  return [m.outfit, m.hat].map((id) => id && COSMETICS[id]).filter((c) => c?.look).map((c) => ({ look: c.look, colors: c.colors || {} }));
}

export class PlayerLook {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.g = scene.add.graphics();
    this.key = null;
  }

  update() {
    const m = progression().state.market.equipped;
    const { player: pl, g } = this;
    const key = `${m.hat}|${m.outfit}`;
    if (key !== this.key) {
      if (this.key !== null) this.scene.dressPlayer?.(); // (the scene dressed them when it started)
      this.key = key;
      const o = m.outfit && COSMETICS[m.outfit];
      if (o?.color && !o.look) pl.setTint(mix(0xffffff, hexNum(o.color), 0.45));
      else pl.clearTint();
    }
    g.clear();
    const hat = m.hat && COSMETICS[m.hat];
    if (!hat || hat.look) return;
    const c = hexNum(hat.color);
    const top = pl.y - pl.displayHeight + 3;
    g.setDepth(pl.depth + 1);
    const w = Math.max(10, pl.displayWidth * 0.55);
    g.fillStyle(0x1d1714, 1);
    g.fillRect(pl.x - w / 2 - 1, top - 1, w + 2, 4);
    g.fillRect(pl.x - w * 0.3 - 1, top - 6, w * 0.6 + 2, 6);
    g.fillStyle(c, 1);
    g.fillRect(pl.x - w / 2, top, w, 2);
    g.fillRect(pl.x - w * 0.3, top - 5, w * 0.6, 5);
    if (m.hat === 'hat:crown') {
      g.fillStyle(0xe0405a, 1);
      g.fillRect(pl.x - 1, top - 4, 2, 2);
    }
  }
}

function mix(a, b, t) {
  const f = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return (f(16) << 16) | (f(8) << 8) | f(0);
}
