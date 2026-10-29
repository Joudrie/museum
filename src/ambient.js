// More life outside: small, calm things that move on their own. Everything
// here finds its own spot from the ground (grass, sand, sea, pond), so it keeps
// working whatever shape the island takes.
//   grass: rabbits, sparrows, a squirrel by the trees, a cat napping in the
//          sun, bees on the flowers, snails after rain or at night
//   beach: sandpipers running with the waves, hermit crabs, a sea turtle
//   sea:   a sailboat on the horizon, dolphins, glints of sun, a bottle
//          bobbing by, jellyfish glowing at night
//   pond:  dragonflies
//   sky:   cloud shadows sliding over the ground, bats at dusk, moths round
//          the lamps, an owl in a tree at night
//   dock:  an old fisherman who now and then lands a fish
import { makeCharacter } from './art.js';
import { sfx } from './music.js';

const OUT = '#1d1714';
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function tex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h);
  const ctx = t.getContext();
  draw((x, y, rw, rh, c) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, rw, rh);
  }, ctx);
  t.refresh();
}

export function ambientTextures(scene) {
  // rabbit: sitting, nibbling (head down) and mid-hop. Brown, or white in winter.
  [['', '#b08a64', '#d8c0a0'], ['_w', '#f2f0ea', '#ffffff']].forEach(([v, fur, belly]) => {
    tex(scene, `rabbit${v}_0`, 12, 11, (R) => {
      R(2, 4, 8, 6, OUT);
      R(3, 5, 6, 4, fur);
      R(7, 0, 2, 5, OUT);
      R(9, 1, 2, 4, OUT);
      R(7, 1, 1, 3, fur);
      R(9, 2, 1, 2, '#e8a8a8');
      R(7, 3, 4, 4, OUT);
      R(8, 4, 2, 2, fur);
      R(9, 4, 1, 1, OUT);
      R(1, 5, 2, 2, '#ffffff');
      R(4, 8, 3, 1, belly);
      R(3, 10, 2, 1, OUT);
      R(7, 10, 2, 1, OUT);
    });
    tex(scene, `rabbit${v}_1`, 12, 11, (R) => {
      R(2, 5, 8, 5, OUT);
      R(3, 6, 6, 3, fur);
      R(7, 2, 2, 4, OUT);
      R(9, 3, 2, 3, OUT);
      R(8, 6, 4, 4, OUT);
      R(9, 7, 2, 2, fur);
      R(10, 7, 1, 1, OUT);
      R(1, 6, 2, 2, '#ffffff');
      R(3, 10, 2, 1, OUT);
      R(7, 10, 2, 1, OUT);
    });
    tex(scene, `rabbit${v}_2`, 14, 9, (R) => {
      R(1, 3, 10, 4, OUT);
      R(2, 4, 8, 2, fur);
      R(9, 0, 4, 2, OUT);
      R(8, 2, 5, 4, OUT);
      R(9, 3, 3, 2, fur);
      R(11, 3, 1, 1, OUT);
      R(0, 3, 2, 2, '#ffffff');
      R(0, 7, 3, 1, OUT);
      R(9, 7, 2, 1, OUT);
    });
  });
  // sparrow: standing, pecking, wings up and down
  tex(scene, 'sparrow_0', 8, 7, (R) => {
    R(1, 2, 5, 4, OUT);
    R(2, 3, 3, 2, '#9a6a44');
    R(4, 1, 3, 3, OUT);
    R(5, 2, 1, 1, '#c8a078');
    R(7, 2, 1, 1, '#4a3a2a');
    R(0, 3, 2, 1, '#6a4a30');
    R(2, 5, 3, 1, '#e8dcc8');
    R(3, 6, 1, 1, OUT);
  });
  tex(scene, 'sparrow_1', 8, 7, (R) => {
    R(1, 2, 5, 3, OUT);
    R(2, 3, 3, 1, '#9a6a44');
    R(5, 3, 3, 3, OUT);
    R(6, 4, 1, 1, '#c8a078');
    R(7, 6, 1, 1, '#4a3a2a');
    R(0, 1, 2, 2, '#6a4a30');
    R(3, 5, 1, 2, OUT);
  });
  [0, 1].forEach((f) =>
    tex(scene, `sparrow_fly_${f}`, 10, 7, (R) => {
      R(3, 3, 5, 3, OUT);
      R(4, 4, 3, 1, '#9a6a44');
      R(7, 2, 2, 2, OUT);
      R(9, 3, 1, 1, '#4a3a2a');
      if (f) {
        R(2, 0, 4, 3, '#7a5236');
        R(3, 0, 2, 1, '#c8a078');
      } else R(2, 5, 4, 2, '#7a5236');
      R(1, 4, 2, 1, '#6a4a30');
    }),
  );
  // squirrel: sitting up (tail curled) and running
  tex(scene, 'squirrel_0', 12, 12, (R) => {
    R(0, 1, 5, 9, OUT);
    R(1, 2, 3, 7, '#c8642a');
    R(1, 2, 2, 2, '#e88a4a');
    R(4, 5, 5, 6, OUT);
    R(5, 6, 3, 4, '#b8582a');
    R(6, 8, 2, 2, '#f2d8b8');
    R(6, 2, 5, 5, OUT);
    R(7, 3, 3, 3, '#b8582a');
    R(9, 4, 1, 1, OUT);
    R(7, 1, 1, 2, OUT);
    R(9, 7, 2, 1, '#8a4a2a');
    R(5, 11, 4, 1, OUT);
  });
  tex(scene, 'squirrel_1', 14, 9, (R) => {
    R(0, 0, 5, 5, OUT);
    R(1, 1, 3, 3, '#c8642a');
    R(4, 3, 7, 4, OUT);
    R(5, 4, 5, 2, '#b8582a');
    R(9, 2, 4, 4, OUT);
    R(10, 3, 2, 2, '#b8582a');
    R(11, 3, 1, 1, OUT);
    R(10, 1, 1, 1, OUT);
    R(4, 7, 2, 2, OUT);
    R(9, 7, 2, 2, OUT);
  });
  // a ginger cat curled up asleep (tail tip in two places) and sitting up
  [0, 1].forEach((f) =>
    tex(scene, `napcat_${f}`, 16, 9, (R) => {
      R(1, 2, 13, 7, OUT);
      R(2, 3, 11, 5, '#e8963a');
      R(4, 4, 2, 1, '#c8702a');
      R(8, 4, 2, 1, '#c8702a');
      R(10, 1, 5, 5, OUT);
      R(11, 2, 3, 3, '#e8963a');
      R(11, 0, 1, 2, OUT);
      R(14, 0, 1, 2, OUT);
      R(11, 3, 1, 1, OUT);
      R(13, 3, 1, 1, OUT);
      R(2, 7, 10, 1, '#f2c48a');
      if (f) R(0, 4, 2, 3, OUT);
      else R(0, 7, 3, 2, OUT);
      if (f) R(0, 5, 1, 1, '#e8963a');
      else R(1, 7, 1, 1, '#e8963a');
    }),
  );
  tex(scene, 'napcat_up', 11, 13, (R) => {
    R(1, 4, 8, 9, OUT);
    R(2, 5, 6, 7, '#e8963a');
    R(3, 8, 4, 4, '#f2c48a');
    R(1, 0, 8, 6, OUT);
    R(2, 1, 6, 4, '#e8963a');
    R(1, 0, 2, 2, OUT);
    R(7, 0, 2, 2, OUT);
    R(3, 2, 1, 1, '#3a8a3a');
    R(6, 2, 1, 1, '#3a8a3a');
    R(4, 4, 2, 1, '#c8702a');
    R(8, 10, 3, 2, OUT);
    R(9, 10, 1, 1, '#e8963a');
  });
  tex(scene, 'bee', 4, 3, (R) => {
    R(0, 1, 4, 2, OUT);
    R(1, 1, 1, 2, '#f2c53d');
    R(3, 1, 1, 1, '#f2c53d');
    R(1, 0, 2, 1, '#ffffffaa');
  });
  [0, 1].forEach((f) =>
    tex(scene, `snail_${f}`, 10, 7, (R) => {
      R(2 + f, 0, 6, 6, OUT);
      R(3 + f, 1, 4, 4, '#c8945a');
      R(4 + f, 2, 2, 2, '#e8c08a');
      R(5 + f, 3, 1, 1, '#8a5a34');
      R(0, 5, 9, 2, OUT);
      R(1, 5, 7, 1, '#d8cca8');
      R(8 + f, 2, 1, 4, '#d8cca8');
      R(9, 2, 1, 1, OUT);
    }),
  );
  [0, 1].forEach((f) =>
    tex(scene, `dragonfly_${f}`, 11, 7, (R) => {
      R(0, 3, 8, 1, '#2a8ad8');
      R(7, 2, 3, 3, '#1a5a9a');
      R(9, 2, 1, 1, '#9ae8f8');
      if (f) {
        R(3, 0, 2, 3, '#e8f8ffaa');
        R(6, 0, 2, 3, '#e8f8ffaa');
      } else {
        R(2, 4, 3, 2, '#e8f8ffaa');
        R(5, 4, 3, 2, '#e8f8ffaa');
      }
    }),
  );
  // sandpiper: two leg frames running, and pecking
  [0, 1, 2].forEach((f) =>
    tex(scene, `piper_${f}`, 9, 9, (R) => {
      const dy = f === 2 ? 2 : 0;
      R(1, 2 + dy, 5, 4, OUT);
      R(2, 3 + dy, 3, 2, '#c8b496');
      R(2, 5 + dy, 3, 1, '#f2ece0');
      R(4, 0 + dy * 2, 3, 3, OUT);
      R(5, 1 + dy * 2, 1, 1, '#c8b496');
      R(7, 1 + dy * 2, 2, 1, OUT);
      if (f === 1) {
        R(2, 6, 1, 3, OUT);
        R(4, 6, 1, 2, OUT);
      } else {
        R(3, 6 + (f === 2 ? 1 : 0), 1, 3 - (f === 2 ? 1 : 0), OUT);
      }
    }),
  );
  // hermit crab: out and walking, or hidden in its shell
  [0, 1].forEach((f) =>
    tex(scene, `hermit_${f}`, 10, 8, (R) => {
      R(2, 0, 7, 6, OUT);
      R(3, 1, 5, 4, '#e8d0b0');
      R(4, 2, 3, 2, '#c89a7a');
      R(5, 2, 1, 1, '#f2e8d8');
      R(0, 4, 3, 2, '#e05a3a');
      R(1, 3, 1, 1, OUT);
      R(1 + f, 6, 1, 2, OUT);
      R(3 - f, 6, 1, 2, OUT);
    }),
  );
  tex(scene, 'hermit_in', 10, 8, (R) => {
    R(2, 1, 7, 6, OUT);
    R(3, 2, 5, 4, '#e8d0b0');
    R(4, 3, 3, 2, '#c89a7a');
    R(5, 3, 1, 1, '#f2e8d8');
    R(2, 5, 2, 2, '#4a2e20');
  });
  // sea turtle seen from above, flippers in two strokes
  [0, 1].forEach((f) =>
    tex(scene, `turtle_${f}`, 18, 14, (R) => {
      const a = f ? 1 : -1;
      R(2, 4 + a, 4, 2, '#6a9a5a');
      R(12, 4 + a, 4, 2, '#6a9a5a');
      R(3, 10 - a, 3, 2, '#6a9a5a');
      R(12, 10 - a, 3, 2, '#6a9a5a');
      R(4, 3, 10, 10, OUT);
      R(5, 4, 8, 8, '#5a7a3a');
      R(7, 5, 4, 2, '#7a9a4a');
      R(6, 8, 2, 2, '#7a9a4a');
      R(10, 8, 2, 2, '#7a9a4a');
      R(7, 0, 4, 4, OUT);
      R(8, 1, 2, 2, '#8ab86a');
      R(8, 13, 2, 1, '#6a9a5a');
    }),
  );
  // a little sailboat, the sail filling and easing
  [0, 1].forEach((f) =>
    tex(scene, `sailboat_${f}`, 22, 22, (R) => {
      R(10, 1, 1, 15, OUT);
      R(11, 2, 1, 13, OUT);
      R(12 - 0, 3, 6 + f, 11, OUT);
      R(12, 4, 5 + f, 9, '#f8f4ec');
      R(12, 9, 5 + f, 1, '#e05a3a');
      R(4, 5, 6, 10, OUT);
      R(5, 7, 5, 7, '#ece6da');
      R(1, 15, 20, 5, OUT);
      R(2, 16, 18, 2, '#c8503a');
      R(3, 18, 16, 1, '#8a3a2a');
      R(0, 20, 22, 2, '#ffffff66');
    }),
  );
  // dolphin side on, facing right (it tilts along its arc as it jumps)
  tex(scene, 'dolphin', 22, 10, (R) => {
    const rows = [
      '...........kk.........',
      '..........kGk.........',
      '.....kkkkkGGGkkkk.....',
      'k...kGGGGGGGGGGGGkk...',
      'kk.kGGGGGGGGGGGGGGekk.',
      'kGkGGGGGGGGGGGGGGGGGGk',
      'kGGGGGLLLLLLLLLLLLLkk.',
      'kk.kkLLLLLLLLLLkkkk...',
      'k....kkkkkkkkkk.......',
    ];
    const col = { k: OUT, G: '#6a84a8', L: '#c8d4e2', e: OUT };
    rows.forEach((r, y) => [...r].forEach((c, x) => col[c] && R(x, y, 1, 1, col[c])));
    R(7, 3, 6, 1, '#8aa4c4');
  });
  tex(scene, 'glint', 5, 5, (R) => {
    R(2, 0, 1, 5, '#ffffff');
    R(0, 2, 5, 1, '#ffffff');
  });
  tex(scene, 'bottle', 6, 12, (R) => {
    R(2, 0, 2, 2, '#a8784a');
    R(1, 2, 4, 9, OUT);
    R(2, 3, 2, 7, '#5aa87a');
    R(2, 5, 2, 3, '#f2e8c8');
  });
  [0, 1].forEach((f) =>
    tex(scene, `jelly_${f}`, 9, 10, (R) => {
      R(1, 0, 7, 4, '#f8b8e8');
      R(0, 1, 9, 3, '#f8b8e8');
      R(2, 1, 3, 1, '#ffffff');
      [1, 3, 5, 7].forEach((x, i) => R(x + ((i + f) % 2), 4, 1, 4 + ((i + f) % 3), '#f8c8f0'));
    }),
  );
  [0, 1].forEach((f) =>
    tex(scene, `bat_${f}`, 12, 6, (R) => {
      R(5, 1, 2, 4, OUT);
      R(5, 0, 1, 1, OUT);
      R(6, 0, 1, 1, OUT);
      if (f) {
        R(0, 0, 5, 2, OUT);
        R(7, 0, 5, 2, OUT);
        R(1, 2, 2, 1, OUT);
        R(9, 2, 2, 1, OUT);
      } else {
        R(1, 2, 4, 2, OUT);
        R(7, 2, 4, 2, OUT);
        R(0, 4, 2, 1, OUT);
        R(10, 4, 2, 1, OUT);
      }
    }),
  );
  tex(scene, 'moth', 3, 2, (R) => R(0, 0, 3, 2, '#fff8e0'));
  // owl: eyes open, blinking, head turned
  [0, 1, 2].forEach((f) =>
    tex(scene, `owl_${f}`, 12, 14, (R) => {
      R(1, 2, 10, 12, OUT);
      R(2, 3, 8, 10, '#8a6a4a');
      R(3, 8, 6, 5, '#c8a87a');
      R(1, 0, 2, 3, OUT);
      R(9, 0, 2, 3, OUT);
      const ex = f === 2 ? 1 : 0;
      if (f === 1) {
        R(3 + ex, 5, 2, 1, OUT);
        R(7 + ex, 5, 2, 1, OUT);
      } else {
        R(3 + ex, 4, 2, 2, '#f2c53d');
        R(7 + ex, 4, 2, 2, '#f2c53d');
        R(4 + ex, 5, 1, 1, OUT);
        R(8 + ex, 5, 1, 1, OUT);
      }
      R(5 + ex, 6, 2, 2, '#e8a03a');
      R(4, 13, 1, 1, '#e8a03a');
      R(7, 13, 1, 1, '#e8a03a');
    }),
  );
  tex(scene, 'bobber', 4, 5, (R) => {
    R(1, 0, 2, 2, '#e04a3a');
    R(1, 2, 2, 2, '#ffffff');
    R(0, 4, 4, 1, '#ffffff88');
  });
  tex(scene, 'zzz', 9, 9, (R) => {
    R(4, 0, 5, 1, '#ffffff');
    R(7, 1, 1, 1, '#ffffff');
    R(6, 2, 1, 1, '#ffffff');
    R(5, 3, 1, 1, '#ffffff');
    R(4, 4, 5, 1, '#ffffff');
    R(0, 5, 3, 1, '#ffffff');
    R(1, 6, 1, 1, '#ffffff');
    R(0, 7, 3, 1, '#ffffff');
  });
  // the soft round shadow of a passing cloud
  if (!scene.textures.exists('cloud_shadow')) {
    const t = scene.textures.createCanvas('cloud_shadow', 128, 64);
    const ctx = t.getContext();
    [[40, 34, 34], [72, 28, 30], [96, 36, 26], [60, 40, 28]].forEach(([x, y, r]) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(20,30,60,0.5)');
      g.addColorStop(1, 'rgba(20,30,60,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 64);
    });
    t.refresh();
  }
}

// One ring spreading out on the water.
function ripple(scene, x, y, w = 8, ms = 700, a = 0.8) {
  const ring = scene.add.ellipse(x, y, w, w * 0.4).setStrokeStyle(1, 0xf2fbff, a).setDepth(0.7);
  scene.tweens.add({ targets: ring, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: ms, onComplete: () => ring.destroy() });
}

export class Ambient {
  // map: { w, h, ground(x,y) -> 'water'|'sand'|'grass'|'solid', isPond(x,y),
  //        flowers:[{x,y}], trees:[{x,y,h}], lamps:[{x,y}], dock:{x,y}, pond:{x,y,w,h} }
  // when: { night, dusk, weather, season }
  constructor(scene, map, when) {
    this.scene = scene;
    this.map = map;
    this.when = when;
    this.t = 0;
    ambientTextures(scene);
    const { night, dusk, weather, season } = when;
    const wet = weather === 'rain';
    const cold = weather === 'snow' || season === 'winter';
    const fine = !night && !wet;
    this.parts = [];
    const add = (n, make) => {
      for (let i = 0; i < n; i++) {
        const p = make(i);
        if (p) this.parts.push(p);
      }
    };
    if (!night) add(cold ? 2 : 3, () => this.rabbit(cold));
    if (fine) add(1 + (Math.random() < 0.6), () => this.flock());
    if (!night && !cold && map.trees?.length) add(1, () => this.squirrel());
    if (fine && !cold) add(1, () => this.napCat());
    if (fine && !cold) (map.flowers || []).slice(0, 5).forEach((f) => add(2, () => this.bee(f)));
    if ((wet || night) && !cold) add(wet ? 4 : 2, () => this.snail());
    if (fine && !cold && map.pond) add(2, () => this.dragonfly());
    if (!night && !cold) add(2, () => this.piperGroup());
    if (!cold) add(3, () => this.hermit());
    if (!night && !cold && Math.random() < 0.6) add(1, () => this.turtle());
    if (!night) add(1, () => this.sailboat());
    if (fine) add(1, () => this.glints());
    add(1, () => this.bottle());
    if (night) add(5, () => this.jelly());
    if (fine) add(3, (i) => this.cloud(i));
    if (dusk || night) add(dusk ? 3 : 2, () => this.bat());
    if (night) (map.lamps || []).forEach((l) => add(3, () => this.moth(l)));
    if (night && map.trees?.length) add(1, () => this.owl());
    if (map.dock && !night && !wet) add(1, () => this.fisher());
    if (!night && !wet) this.dolphinTimer = rnd(8, 16);
  }

  // A random point where test(ground) holds, at least `clear` px from solid.
  spot(test, tries = 120) {
    const m = this.map;
    for (let i = 0; i < tries; i++) {
      const x = rnd(16, m.w - 16);
      const y = rnd(16, m.h - 16);
      if (test(m.ground(x, y), x, y)) return { x, y };
    }
    return null;
  }

  onGrass(x, y) {
    return this.map.ground(x, y) === 'grass';
  }

  // Near the water's edge on the sand.
  shore(g, x, y) {
    if (g !== 'sand') return false;
    const m = this.map;
    return [[18, 0], [-18, 0], [0, 18], [0, -18]].some(([dx, dy]) => m.ground(x + dx, y + dy) === 'water' && !m.isPond(x + dx, y + dy));
  }

  // Open sea (not the pond), with water around it.
  sea(g, x, y) {
    const m = this.map;
    return g === 'water' && !m.isPond(x, y) && [[24, 0], [-24, 0], [0, 16], [0, -16]].every(([dx, dy]) => m.ground(x + dx, y + dy) === 'water');
  }

  near(player, o, r) {
    return Math.hypot(player.x - o.x, player.y - o.y) < r;
  }

  // ---- grass ----

  rabbit(cold) {
    const at = this.spot((g) => g === 'grass');
    if (!at) return null;
    const v = cold ? '_w' : '';
    const s = this.scene.add.image(at.x, at.y, `rabbit${v}_0`).setOrigin(0.5, 1);
    const r = { ...at, s, v, wait: rnd(0.5, 3), hop: 0, from: null, to: null, flee: 0 };
    r.update = (dt, pl) => {
      if (r.hop > 0) {
        r.hop -= dt * (r.flee ? 5 : 3.2);
        const k = 1 - Math.max(0, r.hop);
        r.x = r.from.x + (r.to.x - r.from.x) * k;
        r.y = r.from.y + (r.to.y - r.from.y) * k;
        s.setPosition(r.x, r.y - Math.sin(Math.PI * k) * 5).setTexture(`rabbit${v}_2`);
        if (r.hop <= 0) {
          s.setPosition(r.x, r.y).setTexture(`rabbit${v}_0`);
          r.wait = r.flee > 0 ? 0.05 : rnd(0.6, 3.5);
          if (r.flee > 0) r.flee--;
        }
      } else if (this.near(pl, r, 52) && !r.flee) {
        r.flee = 3;
        r.wait = 0;
      } else {
        r.wait -= dt;
        // nibbling and twitching while it sits
        s.setTexture(`rabbit${v}_${Math.sin(this.t * 2 + r.x) > 0.6 ? 1 : 0}`);
        if (r.wait <= 0) {
          let a = r.flee ? Math.atan2(r.y - pl.y, r.x - pl.x) + rnd(-0.6, 0.6) : rnd(0, Math.PI * 2);
          for (let i = 0; i < 6; i++, a += 1) {
            const d = r.flee ? 22 : 12;
            const to = { x: r.x + Math.cos(a) * d, y: r.y + Math.sin(a) * d * 0.7 };
            if (this.onGrass(to.x, to.y)) {
              r.from = { x: r.x, y: r.y };
              r.to = to;
              r.hop = 1;
              s.setFlipX(to.x < r.x);
              break;
            }
          }
          if (r.hop <= 0) r.wait = 0.5;
        }
      }
      s.setDepth(r.y);
    };
    return r;
  }

  // Sparrows pecking about in a little group; they all take off together
  // when you come close and land somewhere else.
  flock() {
    const at = this.spot((g) => g === 'grass' || g === 'sand');
    if (!at) return null;
    const sc = this.scene;
    const birds = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => {
      const b = { x: at.x + rnd(-14, 14), y: at.y + rnd(-8, 8), ph: rnd(0, 6), wait: rnd(0, 2) };
      b.s = sc.add.image(b.x, b.y, 'sparrow_0').setOrigin(0.5, 1).setFlipX(Math.random() < 0.5);
      b.sh = sc.add.ellipse(b.x, b.y, 6, 2, 0x000000, 0.2).setDepth(0.6).setVisible(false);
      return b;
    });
    const f = { x: at.x, y: at.y, birds, flying: 0 };
    f.update = (dt, pl) => {
      if (f.flying > 0) {
        f.flying = Math.max(0, f.flying - dt / 1.8);
        const k = 1 - f.flying;
        birds.forEach((b, i) => {
          const lag = Math.min(1, Math.max(0, k * 1.15 - i * 0.03));
          const x = b.from.x + (b.to.x - b.from.x) * lag;
          const y = b.from.y + (b.to.y - b.from.y) * lag;
          const h = Math.sin(Math.PI * lag) * 60;
          b.s.setPosition(x, y - h).setDepth(h > 8 ? 6000 : y).setTexture(f.flying ? `sparrow_fly_${Math.floor(this.t * 14 + i) % 2}` : 'sparrow_0');
          b.s.setFlipX(b.to.x < b.from.x);
          b.sh.setPosition(x, y).setVisible(f.flying > 0);
          if (!f.flying) {
            b.x = b.to.x;
            b.y = b.to.y;
          }
        });
        return;
      }
      // (run past and they go up from further off than if you stroll)
      if (birds.some((b) => this.near(pl, b, this.scene.running ? 96 : 58))) {
        sfx('chirp');
        const to = this.spot((g, x, y) => (g === 'grass' || g === 'sand') && Math.hypot(x - f.x, y - f.y) > 140 && Math.hypot(x - f.x, y - f.y) < 360);
        if (!to) return;
        birds.forEach((b) => {
          b.from = { x: b.x, y: b.y };
          b.to = { x: to.x + rnd(-14, 14), y: to.y + rnd(-8, 8) };
        });
        f.x = to.x;
        f.y = to.y;
        f.flying = 1;
        return;
      }
      birds.forEach((b) => {
        b.wait -= dt;
        if (b.wait < 0) {
          b.wait = rnd(0.3, 1.6);
          // a little hop, or turn round
          if (Math.random() < 0.4) {
            const nx = b.x + rnd(-5, 5);
            if (Math.abs(nx - f.x) < 20) b.x = nx;
          } else if (Math.random() < 0.3) b.s.setFlipX(!b.s.flipX);
        }
        b.s.setPosition(b.x, b.y).setTexture(Math.sin(this.t * 5 + b.ph) > 0.5 ? 'sparrow_1' : 'sparrow_0').setDepth(b.y);
      });
    };
    return f;
  }

  // A squirrel scampers from tree to tree, sits up and flicks its tail; if you
  // come close it dashes to the nearest tree and hides in it for a while.
  squirrel() {
    const trees = this.map.trees;
    let home = pick(trees);
    const s = this.scene.add.image(home.x, home.y + 6, 'squirrel_0').setOrigin(0.5, 1);
    const q = { x: home.x, y: home.y + 6, s, wait: rnd(1, 3), to: null, hidden: 0 };
    q.update = (dt, pl) => {
      if (q.hidden > 0) {
        q.hidden -= dt;
        if (q.hidden <= 0) s.setVisible(true).setAlpha(0);
        return;
      }
      if (s.alpha < 1) s.setAlpha(Math.min(1, s.alpha + dt * 2));
      if (q.to) {
        const dx = q.to.x - q.x;
        const dy = q.to.y - q.y;
        const d = Math.hypot(dx, dy);
        const sp = q.scared ? 120 : 70;
        if (d < 3) {
          q.to = null;
          q.wait = rnd(1.5, 4);
          s.setTexture('squirrel_0');
          if (q.scared) {
            q.scared = false;
            q.hidden = rnd(5, 9);
            s.setVisible(false);
          }
        } else {
          q.x += (dx / d) * sp * dt;
          q.y += (dy / d) * sp * dt;
          s.setTexture('squirrel_1').setFlipX(dx < 0);
          s.setPosition(q.x, q.y - Math.abs(Math.sin(this.t * 18)) * 2);
        }
      } else if (this.near(pl, q, 54)) {
        home = trees.reduce((a, b) => (Math.hypot(b.x - q.x, b.y - q.y) < Math.hypot(a.x - q.x, a.y - q.y) ? b : a));
        q.to = { x: home.x, y: home.y };
        q.scared = true;
      } else {
        q.wait -= dt;
        s.setPosition(q.x, q.y);
        // tail flick
        s.setScale(1, Math.sin(this.t * 9) > 0.92 ? 1.06 : 1);
        if (q.wait < 0) {
          const next = Math.random() < 0.5 ? pick(trees) : home;
          const to = { x: next.x + rnd(-30, 30), y: next.y + rnd(4, 26) };
          if (this.map.ground(to.x, to.y) === 'grass' || this.map.ground(to.x, to.y) === 'sand') q.to = to;
          else q.wait = 1;
        }
      }
      s.setDepth(q.y);
    };
    return q;
  }

  // A cat asleep in the sun. It lifts its head when you walk up, and dozes
  // off again when you leave.
  napCat() {
    const at = this.spot((g, x, y) => g === 'grass' && this.onGrass(x - 12, y) && this.onGrass(x + 12, y));
    if (!at) return null;
    const sc = this.scene;
    const s = sc.add.image(at.x, at.y, 'napcat_0').setOrigin(0.5, 1).setDepth(at.y);
    const c = { ...at, s, awake: 0, zz: rnd(1, 3) };
    c.update = (dt, pl) => {
      if (this.near(pl, c, 40)) c.awake = 3;
      if (c.awake > 0) {
        c.awake -= dt;
        s.setTexture('napcat_up').setScale(1, 1);
        return;
      }
      s.setTexture(`napcat_${Math.sin(this.t * 1.3) > 0.7 ? 1 : 0}`);
      s.setScale(1, 1 + Math.sin(this.t * 1.6) * 0.04); // breathing
      c.zz -= dt;
      if (c.zz < 0) {
        c.zz = rnd(2.5, 4.5);
        const z = sc.add.image(c.x + 6, c.y - 12, 'zzz').setDepth(c.y + 1).setAlpha(0.9).setScale(0.7);
        sc.tweens.add({ targets: z, x: z.x + 8, y: z.y - 16, alpha: 0, scale: 1, duration: 2200, onComplete: () => z.destroy() });
      }
    };
    return c;
  }

  bee(f) {
    const s = this.scene.add.image(f.x, f.y, 'bee').setDepth(f.y + 30);
    const b = { s, f, a: rnd(0, 6), sp: rnd(2, 4), r: rnd(6, 14), land: 0 };
    b.update = (dt) => {
      if (b.land > 0) {
        b.land -= dt; // resting on a flower
        return;
      }
      b.a += dt * b.sp;
      const x = f.x + Math.cos(b.a) * b.r + Math.sin(this.t * 23 + b.a) * 1.5;
      const y = f.y - 8 + Math.sin(b.a * 1.6) * b.r * 0.4 + Math.cos(this.t * 19) * 1;
      s.setPosition(x, y).setFlipX(Math.sin(b.a) > 0);
      if (Math.random() < dt * 0.15) {
        b.land = rnd(1, 2.5);
        s.setPosition(f.x + rnd(-6, 6), f.y - 2);
      }
    };
    return b;
  }

  // Snails come out in the rain (and at night), creeping along and leaving a
  // shiny trail behind.
  snail() {
    const at = this.spot((g) => g === 'grass');
    if (!at) return null;
    const sc = this.scene;
    const s = sc.add.image(at.x, at.y, 'snail_0').setOrigin(0.5, 1).setDepth(at.y);
    const n = { ...at, s, dir: Math.random() < 0.5 ? 1 : -1, trail: 0 };
    s.setFlipX(n.dir < 0);
    n.update = (dt) => {
      const nx = n.x + n.dir * 2.5 * dt;
      if (this.onGrass(nx + n.dir * 6, n.y)) n.x = nx;
      else {
        n.dir = -n.dir;
        s.setFlipX(n.dir < 0);
      }
      s.setPosition(n.x, n.y).setTexture(`snail_${Math.floor(this.t * 1.5) % 2}`);
      n.trail -= dt;
      if (n.trail < 0) {
        n.trail = 1.2;
        const d = sc.add.rectangle(n.x - n.dir * 4, n.y - 1, 2, 1, 0xe8f4ff, 0.7).setDepth(0.62);
        sc.tweens.add({ targets: d, alpha: 0, duration: 9000, onComplete: () => d.destroy() });
      }
    };
    return n;
  }

  // ---- pond ----

  // Dragonflies hover over the pond, then dart to a new spot.
  dragonfly() {
    const p = this.map.pond;
    const at = () => ({ x: p.x + rnd(16, p.w - 16), y: p.y + rnd(12, p.h - 12) });
    const a = at();
    const s = this.scene.add.image(a.x, a.y - 14, 'dragonfly_0').setDepth(6000);
    const d = { ...a, s, to: null, wait: rnd(0.5, 2) };
    d.update = (dt) => {
      if (d.to) {
        const k = Math.min(1, dt * 7);
        d.x += (d.to.x - d.x) * k;
        d.y += (d.to.y - d.y) * k;
        if (Math.hypot(d.to.x - d.x, d.to.y - d.y) < 1) {
          d.to = null;
          d.wait = rnd(0.6, 2.4);
          if (Math.random() < 0.3) ripple(this.scene, d.x, d.y, 4, 500, 0.6); // dips its tail
        }
      } else if ((d.wait -= dt) < 0) {
        d.to = at();
        s.setFlipX(d.to.x < d.x);
      }
      s.setPosition(d.x, d.y - 14 + Math.sin(this.t * 6 + d.x) * 1.5).setTexture(`dragonfly_${Math.floor(this.t * 30) % 2}`);
    };
    return d;
  }

  // ---- beach ----

  // Sandpipers run along the water's edge in little bursts, stopping to peck.
  piperGroup() {
    const at = this.spot((g, x, y) => this.shore(g, x, y));
    if (!at) return null;
    const sc = this.scene;
    const birds = Array.from({ length: 2 + Math.floor(Math.random() * 2) }, (_, i) => {
      const b = { x: at.x + i * 10, y: at.y + rnd(-4, 4), to: null, wait: rnd(0, 1.5), ph: rnd(0, 6) };
      b.s = sc.add.image(b.x, b.y, 'piper_0').setOrigin(0.5, 1);
      return b;
    });
    const g = { birds };
    g.update = (dt, pl) => {
      birds.forEach((b) => {
        const scared = this.near(pl, b, this.scene.running ? 84 : 44);
        if (b.to) {
          const dx = b.to.x - b.x;
          const dy = b.to.y - b.y;
          const d = Math.hypot(dx, dy);
          const sp = scared ? 110 : 70;
          if (d < 2) b.to = null;
          else {
            b.x += (dx / d) * Math.min(d, sp * dt);
            b.y += (dy / d) * Math.min(d, sp * dt);
            b.s.setTexture(`piper_${Math.floor(this.t * 16) % 2}`).setFlipX(dx < 0);
          }
        } else {
          b.wait -= dt;
          b.s.setTexture(Math.sin(this.t * 7 + b.ph) > 0.4 ? 'piper_2' : 'piper_0');
          if (b.wait < 0 || scared) {
            b.wait = rnd(0.4, 1.8);
            let a = scared ? Math.atan2(b.y - pl.y, b.x - pl.x) : rnd(0, Math.PI * 2);
            for (let i = 0; i < 8; i++, a += 0.8) {
              const to = { x: b.x + Math.cos(a) * rnd(14, 34), y: b.y + Math.sin(a) * rnd(6, 16) };
              if (this.shore(this.map.ground(to.x, to.y), to.x, to.y)) {
                b.to = to;
                break;
              }
            }
          }
        }
        b.s.setPosition(b.x, b.y).setDepth(b.y);
      });
    };
    return g;
  }

  // Hermit crabs trundle about the sand and pull into their shells if you
  // come close.
  hermit() {
    const at = this.spot((g) => g === 'sand');
    if (!at) return null;
    const s = this.scene.add.image(at.x, at.y, 'hermit_0').setOrigin(0.5, 1).setDepth(at.y);
    const h = { ...at, s, dir: Math.random() < 0.5 ? 1 : -1, wait: rnd(1, 4), walk: 0, hide: 0 };
    h.update = (dt, pl) => {
      if (this.near(pl, h, 36)) h.hide = 3;
      if (h.hide > 0) {
        h.hide -= dt;
        s.setTexture('hermit_in');
        return;
      }
      if (h.walk > 0) {
        h.walk -= dt;
        const nx = h.x + h.dir * 9 * dt;
        if (this.map.ground(nx, h.y) === 'sand') h.x = nx;
        else h.dir = -h.dir;
        s.setTexture(`hermit_${Math.floor(this.t * 6) % 2}`).setFlipX(h.dir > 0);
      } else {
        s.setTexture('hermit_0');
        if ((h.wait -= dt) < 0) {
          h.wait = rnd(1.5, 5);
          h.walk = rnd(1, 3);
          if (Math.random() < 0.4) h.dir = -h.dir;
        }
      }
      s.setPosition(h.x, h.y);
    };
    return h;
  }

  // A sea turtle crawls slowly down the beach and swims away; another turns
  // up later somewhere else.
  turtle() {
    const sc = this.scene;
    const t = { s: sc.add.image(0, 0, 'turtle_0').setOrigin(0.5, 0.5), wait: 0 };
    const start = () => {
      const at = this.spot((g, x, y) => g === 'sand' && !this.shore(g, x, y));
      if (!at) return false;
      // head for the nearest open water
      let best = null;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8)
        for (let d = 16; d < 200; d += 8) {
          const x = at.x + Math.cos(a) * d;
          const y = at.y + Math.sin(a) * d;
          const g = this.map.ground(x, y);
          if (g === 'solid' || g === 'grass') break;
          if (g === 'water' && !this.map.isPond(x, y)) {
            if (!best || d < best.d) best = { x, y, d };
            break;
          }
        }
      if (!best) return false;
      Object.assign(t, { x: at.x, y: at.y, to: best, swim: 0 });
      t.s.setPosition(at.x, at.y).setVisible(true).setAlpha(1).setAngle((Math.atan2(best.y - at.y, best.x - at.x) * 180) / Math.PI + 90);
      return true;
    };
    if (!start()) {
      t.s.destroy();
      return null;
    }
    t.update = (dt) => {
      if (t.wait > 0) {
        if ((t.wait -= dt) <= 0 && !start()) t.wait = 10;
        return;
      }
      const dx = t.to.x - t.x;
      const dy = t.to.y - t.y;
      const d = Math.hypot(dx, dy);
      const inWater = this.map.ground(t.x, t.y) === 'water';
      const sp = inWater ? 14 : 4;
      // it moves in pushes, flipper stroke by stroke
      const stroke = Math.max(0, Math.sin(this.t * 2.4));
      t.x += (dx / d) * sp * stroke * dt * 1.6;
      t.y += (dy / d) * sp * stroke * dt * 1.6;
      t.s.setPosition(t.x, t.y).setTexture(`turtle_${stroke > 0.5 ? 1 : 0}`).setDepth(inWater ? 0.65 : t.y + 6);
      if (inWater) {
        if (!t.swim) ripple(this.scene, t.x, t.y, 14, 900);
        t.swim += dt;
        t.s.setAlpha(Math.max(0, 1 - t.swim / 2.5));
        // keep going out to sea
        t.to = { x: t.x + dx / d * 40, y: t.y + dy / d * 40 };
        if (t.swim > 2.5) {
          t.s.setVisible(false);
          t.wait = rnd(30, 60);
        }
      }
    };
    return t;
  }

  // ---- sea ----

  // A sailboat drifts along the horizon at the bottom of the island.
  sailboat() {
    const m = this.map;
    // find the widest row of open sea in the southern part of the map
    let row = null;
    for (let y = m.h - 12; y > m.h * 0.6; y -= 8) {
      let n = 0;
      for (let x = 0; x < m.w; x += 16) n += this.sea(m.ground(x, y), x, y) ? 1 : 0;
      if (!row || n > row.n) row = { y, n };
    }
    if (!row || row.n < 4) return null;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const s = this.scene.add.image(rnd(0, m.w), row.y, 'sailboat_0').setOrigin(0.5, 1).setFlipX(dir < 0).setDepth(row.y);
    const b = { s, dir, y: row.y, wake: 0 };
    b.update = (dt) => {
      s.x += dir * 6 * dt;
      if (s.x > m.w + 30) s.x = -30;
      if (s.x < -30) s.x = m.w + 30;
      s.y = b.y + Math.sin(this.t * 1.4) * 1.2;
      s.setAngle(Math.sin(this.t * 1.1) * 3).setTexture(`sailboat_${Math.sin(this.t * 0.4) > 0 ? 1 : 0}`);
      if ((b.wake -= dt) < 0) {
        b.wake = 1.4;
        ripple(this.scene, s.x - dir * 10, b.y, 10, 1600, 0.5);
      }
    };
    return b;
  }

  // Now and then a pair of dolphins arcs out of the sea near you.
  dolphins(pl) {
    const sc = this.scene;
    const at = this.spot((g, x, y) => this.sea(g, x, y) && Math.abs(x - pl.x) < 150 && Math.abs(y - pl.y) < 260 && Math.hypot(x - pl.x, y - pl.y) > 80, 80);
    if (!at) return;
    const dir = Math.random() < 0.5 ? 1 : -1;
    [0, 1].forEach((i) =>
      [0, 1].forEach((j) =>
        sc.time.delayedCall(i * 380 + j * 1500, () => {
          const x0 = at.x + j * dir * 50 + i * 6;
          const y0 = at.y + i * 10;
          const d = sc.add.image(x0, y0, 'dolphin').setFlipX(dir < 0).setDepth(y0);
          ripple(sc, x0, y0 + 2, 10);
          let k = 0;
          const ev = sc.time.addEvent({
            delay: 40,
            loop: true,
            callback: () => {
              k += 0.04;
              d.setPosition(x0 + dir * 34 * k, y0 - Math.sin(Math.PI * k) * 20).setAngle(-dir * Math.cos(Math.PI * k) * 45);
              if (k >= 1) {
                ev.remove();
                d.destroy();
                ripple(sc, x0 + dir * 34, y0 + 2, 10);
              }
            },
          });
        }),
      ),
    );
  }

  // Sun glinting on the sea near you.
  glints() {
    const sc = this.scene;
    const g = { next: 0 };
    g.update = (dt) => {
      if ((g.next -= dt) > 0) return;
      g.next = rnd(0.08, 0.25);
      const v = sc.cameras.main.worldView;
      const x = v.x + Math.random() * v.width;
      const y = v.y + Math.random() * v.height;
      if (this.map.ground(x, y) !== 'water') return;
      const s = sc.add.image(x, y, 'glint').setDepth(0.75).setAlpha(0).setScale(0.4).setBlendMode('ADD');
      sc.tweens.add({ targets: s, alpha: 0.9, scale: 1, duration: 300, yoyo: true, onComplete: () => s.destroy() });
    };
    return g;
  }

  // A bottle bobbing along offshore (a message for later, perhaps).
  bottle() {
    const at = this.spot((g, x, y) => this.sea(g, x, y));
    if (!at) return null;
    const s = this.scene.add.image(at.x, at.y, 'bottle').setOrigin(0.5, 0.8).setDepth(at.y);
    const b = { ...at, s, vx: rnd(-3, 3), ring: 0 };
    b.update = (dt) => {
      const nx = b.x + b.vx * dt;
      if (this.sea(this.map.ground(nx, b.y), nx, b.y)) b.x = nx;
      else b.vx = -b.vx;
      s.setPosition(b.x, b.y + Math.sin(this.t * 2.2) * 1.5).setAngle(Math.sin(this.t * 1.7) * 18);
      if ((b.ring -= dt) < 0) {
        b.ring = 2.2;
        ripple(this.scene, b.x, b.y + 2, 6, 1200, 0.5);
      }
    };
    return b;
  }

  // Jellyfish glowing softly in the shallows after dark.
  jelly() {
    const m = this.map;
    const shallow = (g, x, y) => g === 'water' && !m.isPond(x, y) && [[40, 0], [-40, 0], [0, 40], [0, -40]].some(([dx, dy]) => m.ground(x + dx, y + dy) === 'sand');
    const at = this.spot(shallow, 300);
    if (!at) return null;
    const s = this.scene.add.image(at.x, at.y, 'jelly_0').setDepth(5002).setBlendMode('ADD'); // they glow through the dark
    const j = { ...at, s, ph: rnd(0, 6), vx: rnd(-2, 2), vy: rnd(-2, 2) };
    j.update = (dt) => {
      // pulse: squeeze and drift a little forward
      const pulse = Math.max(0, Math.sin(this.t * 1.8 + j.ph));
      const nx = j.x + j.vx * dt * (0.4 + pulse);
      const ny = j.y + j.vy * dt * (0.4 + pulse) - pulse * dt * 3;
      if (this.map.ground(nx, ny) === 'water' && !this.map.isPond(nx, ny)) {
        j.x = nx;
        j.y = ny;
      } else {
        j.vx = -j.vx;
        j.vy = -j.vy;
      }
      s.setPosition(j.x, j.y).setScale(1 + pulse * 0.12, 1 - pulse * 0.1).setAlpha(0.55 + pulse * 0.35);
      s.setTexture(`jelly_${Math.floor(this.t * 2 + j.ph) % 2}`);
    };
    return j;
  }

  // ---- sky ----

  // Big soft cloud shadows drifting slowly over everything.
  cloud(i) {
    const m = this.map;
    const s = this.scene.add.image(rnd(0, m.w), (i + 0.5) * (m.h / 3) + rnd(-60, 60), 'cloud_shadow').setDepth(5990).setScale(rnd(2.2, 3.2), rnd(1.6, 2.2)).setAlpha(0.5);
    const c = { s, sp: rnd(5, 9) };
    c.update = (dt) => {
      s.x += c.sp * dt;
      s.y -= c.sp * 0.25 * dt;
      if (s.x - s.displayWidth / 2 > m.w) {
        s.x = -s.displayWidth / 2;
        s.y = rnd(0, m.h);
      }
    };
    return c;
  }

  // Bats flitting about at dusk.
  bat() {
    const sc = this.scene;
    const s = sc.add.image(0, 0, 'bat_0').setDepth(6000);
    const b = { s, cx: rnd(0, this.map.w), cy: rnd(0, this.map.h), a: rnd(0, 6), r: rnd(30, 60), sp: rnd(1.8, 2.8) };
    b.update = (dt, pl) => {
      // they loop around near you, wandering as they go
      b.cx += (pl.x + Math.sin(this.t * 0.3 + b.a) * 100 - b.cx) * dt * 0.3;
      b.cy += (pl.y - 120 + Math.cos(this.t * 0.23 + b.a) * 140 - b.cy) * dt * 0.3;
      b.a += dt * b.sp;
      const jit = Math.sin(this.t * 11 + b.r) * 4;
      s.setPosition(b.cx + Math.cos(b.a) * b.r + jit, b.cy + Math.sin(b.a * 1.3) * b.r * 0.6).setTexture(`bat_${Math.floor(this.t * 12 + b.r) % 2}`);
    };
    return b;
  }

  moth(l) {
    const s = this.scene.add.image(l.x, l.y, 'moth').setDepth(5002).setBlendMode('ADD'); // above the night shade: lit by the lamp
    const m = { s, a: rnd(0, 6), r: rnd(5, 12), sp: rnd(3, 6) };
    m.update = (dt) => {
      m.a += dt * m.sp;
      s.setPosition(l.x + Math.cos(m.a) * m.r + Math.sin(this.t * 17 + m.r) * 2, l.y + Math.sin(m.a * 1.4) * m.r * 0.5);
    };
    return m;
  }

  // An owl sits in a tree at night, blinking and turning its head.
  owl() {
    const tr = pick(this.map.trees.filter((t) => t.h > 40)) || pick(this.map.trees);
    const s = this.scene.add.image(tr.x + 4, tr.y - tr.h * 0.55, 'owl_0').setOrigin(0.5, 1).setDepth(tr.y + 1);
    const o = { s, next: rnd(1, 3), look: 0 };
    o.update = (dt) => {
      if ((o.next -= dt) < 0) {
        o.next = rnd(1.5, 4);
        o.look = Math.random() < 0.35 ? rnd(1, 2.5) : 0;
        if (!o.look) {
          s.setTexture('owl_1');
          this.scene.time.delayedCall(140, () => s.active && s.setTexture('owl_0'));
        }
      }
      if (o.look > 0) {
        o.look -= dt;
        s.setTexture(o.look > 0 ? 'owl_2' : 'owl_0');
      }
    };
    return o;
  }

  // ---- dock ----

  // An old fisherman sits at the end of the dock. His float bobs; every so
  // often it dips, he pulls in a fish, looks pleased and lets it go.
  fisher() {
    const sc = this.scene;
    const { x, y } = this.map.dock;
    if (!sc.textures.exists('npc_fisher_sit')) makeCharacter(sc, 'npc_fisher', { h: '#d8d4cc', s: '#e8b890', c: '#3a6a8a', p: '#4a4a3a', b: '#3a2a1a' }, { hat: 'straw', facial: 'beard', outfit: 'sweater', hair: 'short' });
    const man = sc.add.image(x, y, 'npc_fisher_sit').setOrigin(0.5, 1).setDepth(y);
    const tip = { x: x - 20, y: y - 30 };
    const float = { x: x - 30, y: y + 26 };
    const line = sc.add.graphics().setDepth(y + 1);
    const bob = sc.add.image(float.x, float.y, 'bobber').setDepth(float.y);
    const f = { state: 'wait', t: rnd(6, 14), dip: 0 };
    const draw = (fy) => {
      line.clear();
      line.lineStyle(2, 0x6a4a2a, 1).lineBetween(x - 4, y - 12, tip.x, tip.y);
      line.lineStyle(1, 0xf2f2f2, 0.7).lineBetween(tip.x, tip.y, float.x + 2, fy);
    };
    f.update = (dt) => {
      f.t -= dt;
      if (f.state === 'wait') {
        const fy = float.y + Math.sin(this.t * 2) * 0.8;
        bob.setPosition(float.x, fy);
        draw(fy);
        if (Math.random() < dt * 0.4) ripple(sc, float.x + 2, float.y + 4, 6, 900, 0.5);
        if (f.t < 0) {
          f.state = 'nibble';
          f.t = 1.6;
        }
      } else if (f.state === 'nibble') {
        const fy = float.y + (Math.sin(this.t * 18) > 0 ? 2 : 0);
        bob.setPosition(float.x, fy);
        draw(fy);
        if (f.t < 0) {
          f.state = 'catch';
          ripple(sc, float.x + 2, float.y + 4, 10);
          bob.setVisible(false);
          line.clear();
          const fish = sc.add.image(float.x, float.y, 'fish').setDepth(y + 2).setScale(1.3);
          sc.tweens.add({
            targets: fish,
            x: x - 8,
            y: y - 34,
            duration: 500,
            ease: 'Sine.easeOut',
            onComplete: () => {
              sc.tweens.add({ targets: fish, angle: { from: -20, to: 20 }, duration: 120, yoyo: true, repeat: 4 });
              if (sc.textures.exists('emote_heart')) {
                const e = sc.add.image(x, y - 44, 'emote_heart').setDepth(6000);
                sc.tweens.add({ targets: e, y: e.y - 10, alpha: 0, delay: 600, duration: 700, onComplete: () => e.destroy() });
              }
              // and back it goes
              sc.time.delayedCall(1200, () => {
                sc.tweens.add({ targets: fish, x: float.x - 6, y: float.y + 6, angle: 90, duration: 450, ease: 'Sine.easeIn', onComplete: () => (fish.destroy(), ripple(sc, float.x - 6, float.y + 6, 8)) });
                bob.setVisible(true);
                f.state = 'wait';
                f.t = rnd(10, 20);
              });
            },
          });
        }
      }
    };
    this.fisherParts = [man, line, bob];
    return f;
  }

  update(dt, player) {
    this.t += dt;
    this.parts.forEach((p) => p.update(dt, player));
    if (this.dolphinTimer !== undefined && (this.dolphinTimer -= dt) < 0) {
      this.dolphinTimer = rnd(18, 35);
      this.dolphins(player);
    }
  }
}
