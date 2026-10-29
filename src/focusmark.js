// A small bobbing arrow over whatever pressing Interact will act on, so you can
// see who or what you are facing (a person, a door, a boat). It fades in and out.
const KEY = 'focus_arrow';
const ROWS = ['ooooooooo', 'oYYYYYYYo', '.oYYYYYo.', '..oYYYo..', '...oYo...', '....o....'];

export class FocusMark {
  constructor(scene) {
    this.scene = scene;
    if (!scene.textures.exists(KEY)) {
      const t = scene.textures.createCanvas(KEY, 9, 6);
      const g = t.getContext();
      const col = { o: '#1d1714', Y: '#ffe36b' };
      ROWS.forEach((row, y) =>
        [...row].forEach((c, x) => {
          if (c === '.') return;
          g.fillStyle = col[c];
          g.fillRect(x, y, 1, 1);
        }),
      );
      t.refresh();
    }
    this.img = scene.add.image(0, 0, KEY).setOrigin(0.5, 1).setDepth(5000).setVisible(false).setAlpha(0);
    this.t = 0;
    this.a = 0;
  }

  // point: where the top of the target is in the world, or null for nothing
  update(dt, point) {
    const want = point ? 1 : 0;
    this.a += (want - this.a) * Math.min(1, dt * 14);
    if (point) {
      this.t += dt;
      this.last = point;
    }
    if (this.a < 0.03 && !point) return this.img.setVisible(false);
    const p = point || this.last;
    if (!p) return;
    this.img.setVisible(true).setAlpha(this.a).setPosition(Math.round(p.x), Math.round(p.y - 2 + Math.sin(this.t * 6) * 1.6));
  }
}
