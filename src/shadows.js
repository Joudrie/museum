// Soft shadows under people and animals: a pool of little pictures, moved each frame to
// where everyone stands (cheaper than redrawing a shape for every person, which got slow
// with a crowd). Usage: shadows.begin(); shadows.add(x, y, width) for each; shadows.end().
const KEY = 'shadow_blob';
const W = 16;
const H = 6;

export class Shadows {
  constructor(scene, depth, alpha = 0.22) {
    this.scene = scene;
    this.depth = depth;
    this.alpha = alpha;
    this.pool = [];
    this.used = 0;
    this.shown = 0;
    if (!scene.textures.exists(KEY)) {
      const t = scene.textures.createCanvas(KEY, W, H);
      const g = t.getContext();
      g.fillStyle = '#000000';
      g.beginPath();
      g.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, Math.PI * 2);
      g.fill();
      t.refresh();
    }
  }

  begin() {
    this.used = 0;
  }

  add(x, y, w) {
    let img = this.pool[this.used];
    if (!img) {
      img = this.scene.add.image(0, 0, KEY).setDepth(this.depth).setAlpha(this.alpha);
      this.pool.push(img);
    }
    img.setPosition(x, y).setScale(w / W).setVisible(true);
    this.used += 1;
  }

  end() {
    for (let i = this.used; i < this.shown; i++) this.pool[i].setVisible(false);
    this.shown = this.used;
  }
}
