// Draws what is on display: small pictures on top of each fixture's sprite,
// fish swimming in tanks. RoomScene calls showDisplays() whenever its items
// are rebuilt; the returned list is destroyed by the next call.
import { ITEMS, footprint } from './items.js';
import { contents, heldBy, isFixture } from './display.js';
import { get } from './collections/index.js';
import { drawEntry } from './collections/render.js';

const T = 32;
const hexNum = (hex) => parseInt(hex.slice(1), 16);
const GLOW = ['', '', '', '#7fd0ff', '#f2d36b']; // rare and legendary pieces get a glow

// A texture for an entry, made once. Drawn art is a canvas; paintings load their
// picture in the background and show their placeholder colour until it arrives.
function textureOf(scene, e, box) {
  const key = `disp_${e.id}`;
  if (scene.textures.exists(key)) return key;
  const cv = drawEntry(e, 1);
  if (cv) {
    scene.textures.addCanvas(key, cv);
    return key;
  }
  const w = box.w;
  const h = box.h;
  const r = e.ratio || 1;
  const cw = Math.max(4, Math.round(r >= 1 ? w : h * r));
  const ch = Math.max(4, Math.round(r >= 1 ? w / r : h));
  const tex = scene.textures.createCanvas(key, cw, ch);
  const g = tex.getContext();
  g.fillStyle = e.image.placeholder || '#6a6458';
  g.fillRect(0, 0, cw, ch);
  tex.refresh();
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    if (!scene.textures.exists(key)) return;
    g.drawImage(img, 0, 0, cw, ch);
    tex.refresh();
  };
  img.src = e.image.src;
  return key;
}

// Pixel art scales up in whole steps; anything too big shrinks to fit.
const fit = (scene, key, box) => {
  const { width, height } = scene.textures.get(key).getSourceImage();
  const k = Math.min(box.w / width, box.h / height);
  return k >= 1 ? Math.floor(k) : k;
};

/** Returns the objects drawn (sprites, glows, tweens' targets) so the caller can destroy them. */
export function showDisplays(scene, items, g) {
  const out = [];
  const all = contents();
  items.forEach((it) => {
    const def = ITEMS[it.type];
    if (!isFixture(it)) return;
    const held = heldBy(it.d, all).map((id) => get(id)).filter(Boolean);
    if (!held.length) return;
    const f = def.fixture;
    const { w, h } = footprint(it);
    const left = g.xL + it.c * T;
    const bottom = g.y0 + (it.r + h) * T;
    const top = bottom - (h * T + def.rise);
    const depth = bottom - 0.9;
    held.forEach((e, i) => {
      if (f.kind === 'tank') {
        // fish drift back and forth along their own lane, each at its own pace
        const sw = f.swim;
        const key = textureOf(scene, e, { w: 26, h: 16 });
        const lane = sw.y0 + ((sw.y1 - sw.y0) * (i + 0.5)) / Math.max(1, held.length);
        const fish = scene.add.image(left + sw.x0 + 10, top + lane, key).setScale(f.scale).setDepth(depth);
        fish.setData('entry', e);
        const span = sw.x1 - sw.x0 - 20;
        scene.tweens.add({
          targets: fish,
          x: left + sw.x0 + 10 + span,
          duration: 4200 + ((i * 1370) % 3200),
          delay: (i * 600) % 2000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          onYoyo: () => fish.setFlipX(true),
          onRepeat: () => fish.setFlipX(false),
        });
        scene.tweens.add({ targets: fish, y: fish.y + 3, duration: 900 + i * 130, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        out.push(fish);
        return;
      }
      const slot = f.slots[i];
      if (!slot) return;
      const x = left + slot.x;
      const y = top + slot.y;
      if (slot.back) out.push(scene.add.rectangle(x, y, slot.w, slot.h, hexNum(slot.back)).setOrigin(0.5, 1).setDepth(depth));
      const glow = GLOW[e.rarity ?? 1];
      if (glow) out.push(scene.add.ellipse(x, y - slot.h / 2, slot.w + 4, slot.h + 4, hexNum(glow), 0.35).setDepth(depth));
      const key = textureOf(scene, e, slot);
      const img = scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(depth + 0.05);
      img.setScale(fit(scene, key, slot));
      img.setData('entry', e);
      out.push(img);
    });
  });
  return out;
}

