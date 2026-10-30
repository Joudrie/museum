// The angled room: a test of the 45° view (like a diorama seen from a
// corner). A plain square room with two back walls, a door and windows, and a
// few pieces of furniture. Everything is drawn in code from boxes, so a chair
// can turn to face any of the four ways without extra drawings; tap the
// armchairs to turn them. Reached through the cottage door on the island.
import { say } from './ui/toast.js';
import Phaser from 'phaser';
import { load } from './storage.js';
import { DEFAULT_CHARACTER } from './decor.js';
import { dressCurator } from './people/wardrobe.js';
import { wornLooks } from './progression/ui/lookfx.js';
import { iconSvg } from './icons.js';
import { sfx, setTrack } from './music.js';
import { animateWalker, footstep } from './motion.js';
import { frameDt } from './frametime.js';

const N = 8; // the room is N×N floor tiles
const TW = 44; // a floor tile's width on screen
const TH = 22; // and its height (2:1)
const WH = 84; // wall height
const CAP = 0.22; // wall thickness, in tiles
const SPEED = 120;
const PLAYER_SCALE = 1.0;
const DOOR = { s0: 4.9, s1: 6.2 }; // the door, along the left wall
const OUT = [29, 23, 20, 255];

const hash = (x, y, s = 0) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16), 255];
const shade = (c, k) => [...c.slice(0, 3).map((v) => Math.max(0, Math.min(255, Math.round(v * k)))), c[3] ?? 255];
const mix = (a, b, t) => [...a.slice(0, 3).map((v, i) => Math.round(v + (b[i] - v) * t)), 255];

// grid (gx, gy) and height z (px) to screen
const S = (gx, gy, z = 0) => ({ x: (gx - gy) * (TW / 2), y: (gx + gy) * (TH / 2) - z });
// screen to grid (on the floor)
const G = (x, y) => ({ gx: (x / (TW / 2) + y / (TH / 2)) / 2, gy: (y / (TH / 2) - x / (TW / 2)) / 2 });

// A pixel canvas with no anti-aliasing: polygons and painted faces.
class Pix {
  constructor(x0, y0, w, h) {
    Object.assign(this, { x0, y0, w, h });
    this.d = new Uint8ClampedArray(w * h * 4);
  }
  set(x, y, c) {
    const px = Math.floor(x - this.x0);
    const py = Math.floor(y - this.y0);
    if (px < 0 || py < 0 || px >= this.w || py >= this.h) return;
    this.d.set(c, (py * this.w + px) * 4);
  }
  // even-odd scanline fill of a screen-space polygon
  poly(pts, c) {
    const ys = pts.map((p) => p.y);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const yc = y + 0.5;
      const xs = [];
      pts.forEach((a, i) => {
        const b = pts[(i + 1) % pts.length];
        if ((a.y <= yc && b.y > yc) || (b.y <= yc && a.y > yc)) xs.push(a.x + ((yc - a.y) / (b.y - a.y)) * (b.x - a.x));
      });
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) this.set(x, y, c);
    }
  }
  // paint a face by sampling it: at(s, t) -> screen point, fn(s, t) -> colour
  face(s0, s1, t0, t1, ds, dt, at, fn) {
    for (let s = s0; s < s1; s += ds)
      for (let t = t0; t < t1; t += dt) {
        const c = fn(s, t);
        if (!c) continue;
        const p = at(s, t);
        this.set(p.x, p.y, c);
      }
  }
  outline() {
    const { w, h, d } = this;
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0 && !(d[(y * w + x) * 4] === OUT[0] && d[(y * w + x) * 4 + 1] === OUT[1]);
    const add = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!d[(y * w + x) * 4 + 3] && (solid(x + 1, y) || solid(x - 1, y) || solid(x, y + 1) || solid(x, y - 1))) add.push((y * w + x) * 4);
    add.forEach((i) => d.set(OUT, i));
  }
  texture(scene, key) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const t = scene.textures.createCanvas(key, this.w, this.h);
    t.getContext().putImageData(new ImageData(this.d, this.w, this.h), 0, 0);
    t.refresh();
    return key;
  }
}

// An iso box: grid footprint [x0, x1]×[y0, y1], heights z0..z1, with a colour.
// We see its top, its south face (toward +gy, lower left) and its east face
// (toward +gx, lower right). paint(face, s, t) can decorate a face.
function box(px, b) {
  const { x0, x1, y0, y1, z0 = 0, z1, c } = b;
  const P = (gx, gy, z) => S(gx, gy, z);
  px.poly([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], shade(c, 0.86)); // south
  px.poly([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], shade(c, 0.68)); // east
  px.poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], shade(c, 1.08)); // top
  if (b.paint) {
    // south face: s along gx, t up
    px.face(x0, x1, z0, z1, 0.02, 0.5, (s, t) => P(s, y1, t), (s, t) => b.paint('south', (s - x0) / (x1 - x0), (t - z0) / (z1 - z0), s, t));
    px.face(y0, y1, z0, z1, 0.02, 0.5, (s, t) => P(x1, s, t), (s, t) => b.paint('east', (s - y0) / (y1 - y0), (t - z0) / (z1 - z0), s, t));
  }
}

// Furniture, as boxes in the piece's own grid (0..w × 0..d), drawn back to
// front. rot turns it: 0 faces +gy (toward you, lower left), 1 faces +gx
// (lower right), 2 faces -gy (away), 3 faces -gx (away).
const WOOD = hex('#8a5a3a');
const RED = hex('#a8343a');
const PIECES = {
  armchair: {
    w: 1,
    d: 1,
    boxes: () => [
      { x0: 0.06, x1: 0.94, y0: 0.06, y1: 0.94, z0: 0, z1: 6, c: WOOD },
      { x0: 0.08, x1: 0.92, y0: 0.08, y1: 0.92, z0: 6, z1: 16, c: RED },
      { x0: 0.08, x1: 0.92, y0: 0.08, y1: 0.3, z0: 16, z1: 38, c: RED }, // the back
      { x0: 0.08, x1: 0.26, y0: 0.3, y1: 0.92, z0: 16, z1: 25, c: shade(RED, 0.95) }, // arms
      { x0: 0.74, x1: 0.92, y0: 0.3, y1: 0.92, z0: 16, z1: 25, c: shade(RED, 0.95) },
    ],
  },
  sofa: {
    w: 2.4,
    d: 1,
    boxes: () => [
      { x0: 0.05, x1: 2.35, y0: 0.08, y1: 0.95, z0: 0, z1: 6, c: WOOD },
      { x0: 0.08, x1: 2.32, y0: 0.1, y1: 0.92, z0: 6, z1: 15, c: hex('#3e6a5a') },
      { x0: 0.08, x1: 2.32, y0: 0.1, y1: 0.34, z0: 15, z1: 36, c: hex('#3e6a5a') },
      { x0: 0.08, x1: 0.3, y0: 0.34, y1: 0.92, z0: 15, z1: 24, c: hex('#36604f') },
      { x0: 2.1, x1: 2.32, y0: 0.34, y1: 0.92, z0: 15, z1: 24, c: hex('#36604f') },
      { x0: 0.32, x1: 1.18, y0: 0.36, y1: 0.9, z0: 15, z1: 18, c: hex('#4a7a68') }, // cushions
      { x0: 1.22, x1: 2.08, y0: 0.36, y1: 0.9, z0: 15, z1: 18, c: hex('#4a7a68') },
    ],
  },
  table: {
    w: 1,
    d: 1,
    boxes: () => [
      { x0: 0.44, x1: 0.56, y0: 0.44, y1: 0.56, z0: 0, z1: 18, c: WOOD },
      { x0: 0.26, x1: 0.74, y0: 0.26, y1: 0.74, z0: 0, z1: 2, c: WOOD },
      { x0: 0.12, x1: 0.88, y0: 0.12, y1: 0.88, z0: 18, z1: 21, c: hex('#9a6a44') },
      { x0: 0.36, x1: 0.64, y0: 0.36, y1: 0.64, z0: 21, z1: 29, c: hex('#c0603a') }, // a pot
      { x0: 0.3, x1: 0.7, y0: 0.3, y1: 0.7, z0: 29, z1: 40, c: hex('#4a9a4a'), leafy: true },
      { x0: 0.38, x1: 0.62, y0: 0.38, y1: 0.62, z0: 40, z1: 46, c: hex('#5ab05a'), leafy: true },
    ],
  },
  bookshelf: {
    w: 2,
    d: 0.55,
    boxes: () => [
      {
        x0: 0, x1: 2, y0: 0, y1: 0.55, z0: 0, z1: 74, c: WOOD,
        paint: (face, u, v) => {
          if (face !== 'south') return null;
          // shelves with rows of books
          const row = Math.floor(v * 5);
          const fv = v * 5 - row;
          if (u < 0.05 || u > 0.95 || v > 0.96 || fv < 0.12) return null; // the frame and the shelf boards
          if (fv > 0.86) return shade(WOOD, 0.45); // the dark gap above the books
          const book = Math.floor(u * 22 + row * 7);
          const tall = hash(book, row, 3) * 0.25;
          if (fv > 0.86 - tall) return shade(WOOD, 0.45);
          const cols = ['#8a2a2a', '#2a4a7a', '#3a6a3a', '#b08a3a', '#5a3a6a', '#2a6a6a'];
          const c = hex(cols[Math.floor(hash(book, row, 9) * cols.length)]);
          return (u * 22 + row * 7) % 1 < 0.12 ? shade(c, 0.6) : c;
        },
      },
    ],
  },
  lamp: {
    w: 0.6,
    d: 0.6,
    boxes: () => [
      { x0: 0.12, x1: 0.48, y0: 0.12, y1: 0.48, z0: 0, z1: 3, c: hex('#3a3430') },
      { x0: 0.26, x1: 0.34, y0: 0.26, y1: 0.34, z0: 3, z1: 54, c: hex('#3a3430') },
      { x0: 0.04, x1: 0.56, y0: 0.04, y1: 0.56, z0: 54, z1: 70, c: hex('#f2dca0') },
    ],
  },
};
// turn a box in a w×d piece by rot quarter turns (about the piece's centre)
function turn(b, rot, w, d) {
  let { x0, x1, y0, y1 } = b;
  for (let i = 0; i < rot; i++) {
    // a quarter turn: (x, y) -> (y, w - x), so facing +gy becomes facing +gx
    [x0, x1, y0, y1] = [y0, y1, w - x1, w - x0];
    [w, d] = [d, w];
  }
  return { ...b, x0, x1, y0, y1 };
}

// back to front: a box goes before any box it's wholly behind or below
function paintOrder(boxes) {
  const behind = (a, b) => a.x1 <= b.x0 + 1e-6 || a.y1 <= b.y0 + 1e-6 || (a.z1 <= b.z0 && !(b.x1 <= a.x0 + 1e-6 || b.y1 <= a.y0 + 1e-6));
  const left = boxes.slice().sort((a, b) => a.z0 - b.z0 || a.z1 - b.z1);
  const out = [];
  while (left.length) {
    const i = left.findIndex((a) => !left.some((b) => b !== a && behind(b, a) && !behind(a, b)));
    out.push(...left.splice(i < 0 ? 0 : i, 1));
  }
  return out;
}

function drawPiece(scene, key, kind, rot) {
  const def = PIECES[kind];
  const odd = rot % 2;
  const w = odd ? def.d : def.w;
  const d = odd ? def.w : def.d;
  // the art faces +gy at rot 0; an "away" piece shows its back
  const boxes = paintOrder(def.boxes().map((b) => turn(b, rot, def.w, def.d)));
  const top = Math.max(...boxes.map((b) => b.z1));
  const left = S(0, d).x;
  const right = S(w, 0).x;
  const px = new Pix(Math.floor(left) - 2, Math.floor(S(0, 0, top).y) - 2, Math.ceil(right - left) + 5, Math.ceil(S(w, d).y - S(0, 0, top).y) + 5);
  boxes.forEach((b) => {
    box(px, b);
    if (b.leafy)
      for (let i = 0; i < 40; i++) {
        const gx = b.x0 + hash(i, 1, rot) * (b.x1 - b.x0);
        const gy = b.y0 + hash(i, 2, rot) * (b.y1 - b.y0);
        const p = S(gx, gy, b.z1 - hash(i, 3) * (b.z1 - b.z0));
        px.set(p.x, p.y, hash(i, 4) > 0.5 ? hex('#7ac86a') : hex('#2e6e3a'));
      }
  });
  px.outline();
  px.texture(scene, key);
  return { key, ox: -px.x0, oy: -px.y0, w, d };
}

export class IsoScene extends Phaser.Scene {
  constructor() {
    super('iso');
  }

  create() {
    document.body.classList.add('outside');
    this.events.once('shutdown', () => document.body.classList.remove('outside'));
    setTrack('none');
    this.blocked = new Set();
    this.leaving = false;
    this.drawRoom();
    this.furnish();

    dressCurator(this, { ...DEFAULT_CHARACTER, ...load('curation.character', {}) }, wornLooks()); // (people/wardrobe.js)
    this.pos = { gx: 1.0, gy: (DOOR.s0 + DOOR.s1) / 2 };
    this.player = this.add.sprite(0, 0, 'player_down').setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    this.shadow = this.add.ellipse(0, 0, 16, 6, 0x000000, 0.25);
    this.place();

    this.setupCamera();
    this.setupInput();
    this.cameras.main.fadeIn(300, 29, 21, 18);
    this.toast('The angled room (a test) · tap an armchair to turn it');
  }

  // ---------- The room ----------
  drawRoom() {
    const top = S(0, 0, WH + 8);
    const px = new Pix(Math.floor(S(0, N).x) - 16, Math.floor(top.y) - 4, N * TW + 32, Math.ceil(S(N, N).y - top.y) + 20);
    // the floor's edge (the room sits like a diorama)
    const SLAB = 10;
    const slab = hex('#5a3a28');
    px.poly([S(0, N), S(N, N), S(N, N, -SLAB), S(0, N, -SLAB)], shade(slab, 0.9));
    px.poly([S(N, 0), S(N, N), S(N, N, -SLAB), S(N, 0, -SLAB)], shade(slab, 0.7));
    // the floor: oak planks running along gx, and a rug in the middle
    const oak = hex('#b07a4a');
    const RUG = { u0: 2.3, u1: 5.7, v0: 2.5, v1: 5.9 };
    const rugRed = hex('#8a2a30');
    const gold = hex('#d8b060');
    const navy = hex('#2a3a5a');
    px.face(0, N, 0, N, 0.02, 0.02, (u, v) => S(u, v), (u, v) => {
      if (u > RUG.u0 && u < RUG.u1 && v > RUG.v0 && v < RUG.v1) {
        const e = Math.min(u - RUG.u0, RUG.u1 - u, v - RUG.v0, RUG.v1 - v);
        if (e < 0.06) return shade(gold, 0.8); // fringe
        if (e < 0.22) return (Math.floor((u + v) * 8) % 2 ? navy : shade(navy, 1.25));
        if (e < 0.3) return gold;
        const cu = (RUG.u0 + RUG.u1) / 2;
        const cv = (RUG.v0 + RUG.v1) / 2;
        const dm = Math.abs(u - cu) + Math.abs(v - cv);
        if (dm < 0.5) return dm < 0.25 ? gold : navy;
        if (Math.abs(dm - 1.1) < 0.06) return gold;
        return (Math.floor(u * 6) + Math.floor(v * 6)) % 2 ? rugRed : shade(rugRed, 0.9);
      }
      const plank = Math.floor(v * 4);
      const fv = v * 4 - plank;
      const off = hash(plank, 0, 5) * 3;
      const seg = Math.floor((u + off) / 2.6);
      const fu = (u + off) / 2.6 - seg;
      if (fv < 0.07 || fu < 0.012) return shade(oak, 0.62); // seams
      let c = shade(oak, 0.88 + hash(plank, seg, 6) * 0.2);
      if (hash(Math.floor(u * 12), plank, 7) > 0.93) c = shade(c, 0.92); // grain
      // light from the windows falls across the floor
      const lit = [2.0, 5.2].some((w0) => u > w0 && u < w0 + 1.4 && v < 3.2 && v > 0.2 && Math.abs(u - w0 - 0.7 - v * 0.35) < 0.75);
      return lit ? mix(c, [255, 236, 190], 0.18) : c;
    });
    // the two back walls: green damask over wood panelling
    const paper = hex('#5e7a5a');
    const panel = hex('#6a442e');
    const wall = (k, s, t, side) => {
      if (t < 5) return shade(hex('#2a1c14'), k); // skirting
      if (t < 30) {
        const pu = (s * 2) % 1;
        if (t > 27 || pu < 0.06) return shade(panel, 0.75 * k);
        return shade(panel, (t > 9 && t < 25 && pu > 0.14 && pu < 0.92 ? 0.95 : 1.08) * k);
      }
      if (t < 33) return shade(hex('#c8a060'), k); // dado rail
      if (t > WH - 6) return shade(hex('#e8dcc0'), (t > WH - 2 ? 0.8 : 1) * k); // crown
      const du = (s * 3) % 1;
      const dv = ((t - 33) / 14) % 1;
      const motif = Math.abs(du - 0.5) + Math.abs(dv - 0.5) < 0.22 && Math.abs(du - 0.5) + Math.abs(dv - 0.5) > 0.12;
      return shade(motif ? mix(paper, [230, 220, 180], 0.25) : paper, k * (side ? 1 : 1));
    };
    const door = (s, t) => {
      if (s < DOOR.s0 || s > DOOR.s1 || t > 58) return null;
      if (s < DOOR.s0 + 0.08 || s > DOOR.s1 - 0.08 || t > 54) return hex('#4a2c1c'); // frame
      const mid = (DOOR.s0 + DOOR.s1) / 2;
      if (Math.abs(s - mid) < 0.025) return hex('#3a2416');
      if (t > 26 && t < 30 && Math.abs(s - mid - 0.14) < 0.05) return hex('#f2d36b'); // the knob
      const inset = (t > 6 && t < 24) || (t > 32 && t < 50);
      return inset && Math.abs(((s - DOOR.s0) / (mid - DOOR.s0)) % 1 - 0.5) < 0.32 ? hex('#7a4a30') : hex('#8a5a3a');
    };
    const WINS = [2.0, 5.2];
    const win = (s, t) => {
      const w0 = WINS.find((w) => s > w - 0.08 && s < w + 1.48);
      if (w0 === undefined || t < 32 || t > 72) return null;
      if (t < 35) return hex('#e8dcc0'); // sill
      const inner = s > w0 && s < w0 + 1.4 && t > 37 && t < 70;
      if (!inner) return hex('#f4f0e6');
      if (Math.abs(s - w0 - 0.7) < 0.03 || Math.abs(t - 53) < 1) return hex('#f4f0e6'); // glazing bars
      const sky = mix(hex('#9ad0f0'), hex('#d8f0ff'), (t - 37) / 33);
      return (s - w0 + (70 - t) / 40) % 0.9 < 0.08 ? mix(sky, [255, 255, 255], 0.5) : sky;
    };
    // left wall (along gx = 0), lighter; right wall (along gy = 0), in shade
    px.face(0, N, 0, WH, 0.015, 0.5, (s, t) => S(0, s, t), (s, t) => door(s, t) || wall(1.0, s, t, 0));
    px.face(0, N, 0, WH, 0.015, 0.5, (s, t) => S(s, 0, t), (s, t) => win(s, t) || wall(0.86, s, t, 1));
    // a painting on the left wall
    px.face(1.6, 3.4, 42, 72, 0.015, 0.5, (s, t) => S(0, s, t), (s, t) => {
      if (s < 1.7 || s > 3.3 || t < 44 || t > 70) return hex('#c8a040');
      const k = (t - 44) / 26;
      if (k > 0.55) return mix(hex('#7aa0c8'), hex('#f0d8a0'), (k - 0.55) / 0.45);
      return Math.abs(s - 2.5 - (k - 0.3) * 0.6) < 0.25 * (1 - k) + 0.05 ? hex('#4a6a3a') : hex('#6a8a4a');
    });
    // the wall tops (their thickness), and the open ends at the corners
    const capC = hex('#e8dcc0');
    px.poly([S(0, -CAP, WH), S(0, N, WH), S(-CAP, N, WH), S(-CAP, -CAP, WH)], capC);
    px.poly([S(-CAP, 0, WH), S(N, 0, WH), S(N, -CAP, WH), S(-CAP, -CAP, WH)], capC);
    px.poly([S(0, N, 0), S(-CAP, N, 0), S(-CAP, N, WH), S(0, N, WH)], shade(capC, 0.7));
    px.poly([S(N, 0, 0), S(N, -CAP, 0), S(N, -CAP, WH), S(N, 0, WH)], shade(capC, 0.6));
    px.outline();
    this.add.image(px.x0, px.y0, px.texture(this, 'iso_room')).setOrigin(0).setDepth(-1000);
    this.bounds = { x0: px.x0, y0: px.y0, w: px.w, h: px.h };
  }

  // ---------- Furniture ----------
  furnish() {
    this.pieces = [];
    const add = (kind, gx, gy, rot = 0, opts = {}) => {
      const piece = { kind, gx, gy, rot, ...opts };
      this.pieces.push(piece);
      this.drawIt(piece);
      return piece;
    };
    add('bookshelf', 3.6, 0.05, 0);
    add('sofa', 0.05, 2.4, 1); // against the left wall, facing into the room
    add('armchair', 3.0, 4.4, 1, { turns: true });
    add('armchair', 4.9, 4.4, 3, { turns: true });
    add('table', 3.95, 4.4, 0);
    add('lamp', 0.3, 1.6, 0);
    add('table', 7.0, 0.9, 0);
    this.lampGlow = this.add.image(S(0.6, 1.9, 62).x, S(0.6, 1.9, 62).y, this.glowTex()).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.35).setDepth(9000);
  }

  drawIt(piece) {
    const key = `iso_${piece.kind}_${piece.rot}`;
    // each kind and turn is drawn once and shared (never redrawn while in use)
    const art = (this.art ||= {})[key] && this.textures.exists(key) ? this.art[key] : (this.art[key] = drawPiece(this, key, piece.kind, piece.rot));
    piece.art = art;
    const p = S(piece.gx, piece.gy);
    piece.img?.destroy();
    piece.img = this.add.image(p.x - art.ox, p.y - art.oy, key).setOrigin(0);
    // depth: the piece's front corner on screen
    // pieces sort by their middle on the floor; the player is slotted in
    // between them each frame (see place)
    piece.img.setDepth((piece.gx + art.w / 2 + piece.gy + art.d / 2) * 10);
    piece.box = { x0: piece.gx, x1: piece.gx + art.w, y0: piece.gy, y1: piece.gy + art.d };
  }

  glowTex() {
    if (this.textures.exists('iso_glow')) return 'iso_glow';
    const t = this.textures.createCanvas('iso_glow', 96, 72);
    const g = t.getContext();
    const r = g.createRadialGradient(48, 36, 2, 48, 36, 46);
    r.addColorStop(0, 'rgba(255,220,150,0.9)');
    r.addColorStop(1, 'rgba(255,220,150,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 96, 72);
    t.refresh();
    return 'iso_glow';
  }

  // ---------- Walking ----------
  // can you stand at grid point (gx, gy)? (with a little room round your feet)
  free(gx, gy) {
    const r = 0.18;
    if (gx < 0.3 || gy < 0.3 || gx > N - 0.25 || gy > N - 0.25) return false;
    return !this.pieces.some((p) => gx > p.box.x0 - r && gx < p.box.x1 + r && gy > p.box.y0 - r && gy < p.box.y1 + r);
  }

  place() {
    const p = S(this.pos.gx, this.pos.gy);
    // In front of a piece: past its far side along either floor axis.
    // Behind it: short of its near side along either axis. Draw the player
    // over everything it's in front of and under everything it's behind.
    const { gx, gy } = this.pos;
    let lo = -Infinity;
    let hi = Infinity;
    const px0 = p.x - 10;
    const px1 = p.x + 10;
    const py0 = p.y - 40;
    const py1 = p.y + 2;
    this.pieces.forEach((q) => {
      const i = q.img;
      if (i.x > px1 || i.x + i.width < px0 || i.y > py1 || i.y + i.height < py0) return; // not overlapping you on screen
      const b = q.box;
      const d = q.img.depth;
      if (gx >= b.x1 || gy >= b.y1) lo = Math.max(lo, d);
      else if (gx <= b.x0 || gy <= b.y0) hi = Math.min(hi, d);
    });
    const depth = lo > -Infinity ? (hi < Infinity ? (lo + Math.min(hi, lo + 10)) / 2 : lo + 1) : hi < Infinity ? hi - 1 : (gx + gy) * 10;
    this.player.setPosition(p.x, p.y + 2).setDepth(depth);
    this.shadow.setPosition(p.x, p.y + 1).setDepth(depth - 0.1);
  }

  setupCamera() {
    const cam = this.cameras.main;
    const fit = () => {
      const { width, height } = this.scale.gameSize;
      cam.setSize(width, height);
      const b = this.bounds;
      // about two thirds of the room across the screen; the camera follows you
      cam.setZoom(Math.min(width / (b.w * 0.7), height / (b.h + 120)));
      cam.setBounds(b.x0 - 8, b.y0 - 140, b.w + 16, b.h + 240);
    };
    fit();
    cam.startFollow(this.player, true, 0.2, 0.2);
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));
  }

  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
    this.stick = document.getElementById('stick');
    this.knob = this.stick.querySelector('.knob');
    this.interactBtn = document.getElementById('interact');
    this.interactBtn.onclick = () => this.interact();
    const css = (p) => {
      const r = this.game.canvas.getBoundingClientRect();
      return { x: r.left + (p.x * r.width) / this.scale.gameSize.width, y: r.top + (p.y * r.height) / this.scale.gameSize.height };
    };
    this.input.on('pointerdown', (p) => {
      this.press = css(p);
      this.dragging = false;
    });
    this.input.on('pointermove', (p) => {
      if (!this.press || !p.isDown) return;
      const at = css(p);
      const dx = at.x - this.press.x;
      const dy = at.y - this.press.y;
      if (!this.dragging && Math.hypot(dx, dy) > 10) {
        this.dragging = true;
        this.stick.style.left = `${this.press.x}px`;
        this.stick.style.top = `${this.press.y}px`;
        this.stick.classList.add('active');
      }
      if (this.dragging) {
        const len = Math.hypot(dx, dy);
        const k = len > 36 ? 36 / len : 1;
        this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
        this.dragVec = len ? { x: dx / len, y: dy / len } : null;
        this.dragMag = Math.min(1, len / 36);
      }
    });
    this.input.on('pointerup', (p) => {
      if (this.press && !this.dragging) this.tapAt(p.worldX, p.worldY);
      this.press = null;
      this.dragging = false;
      this.dragVec = null;
      this.stick.classList.remove('active');
    });
  }

  // a tap on an armchair turns it a quarter
  tapAt(x, y) {
    const hit = this.pieces
      .filter((p) => p.turns)
      .find((p) => {
        const i = p.img;
        if (x < i.x || y < i.y || x > i.x + i.width || y > i.y + i.height) return false;
        const a = this.textures.getPixelAlpha(Math.floor(x - i.x), Math.floor(y - i.y), i.texture.key);
        return a > 0;
      });
    if (!hit) return;
    hit.rot = (hit.rot + 1) % 4;
    this.drawIt(hit);
    sfx('place');
  }

  nearDoor() {
    return this.pos.gx < 1.1 && this.pos.gy > DOOR.s0 && this.pos.gy < DOOR.s1;
  }

  interact() {
    if (this.nearDoor()) this.leave();
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    this.interactBtn.classList.add('hidden');
    sfx('door');
    this.cameras.main.fadeOut(220, 29, 21, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('island', { map: 'one', spawn: 'cottage' }));
  }

  toast(text) {
    say(text, 3200);
  }

  update(_, dtMs) {
    if (this.leaving) return;
    const dt = frameDt(this, dtMs);
    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    let pace = 1;
    if (!vx && !vy && this.dragging && this.dragVec) {
      ({ x: vx, y: vy } = this.dragVec);
      pace = this.dragMag > 0.7 ? 1 : 0.62;
    }
    const len = Math.hypot(vx, vy);
    const p = this.player;
    if (len) {
      // move in screen directions, worked out on the floor's grid
      const sx = (vx / len) * SPEED * pace * dt;
      const sy = (vy / len) * SPEED * pace * dt;
      const d = G(sx, sy);
      const { gx, gy } = this.pos;
      if (this.free(gx + d.gx, gy)) this.pos.gx += d.gx;
      if (this.free(this.pos.gx, gy + d.gy)) this.pos.gy += d.gy;
      if (Math.abs(vx) > Math.abs(vy)) p.setTexture('player_side').setFlipX(vx < 0);
      else p.setTexture(vy < 0 ? 'player_up' : 'player_down').setFlipX(false);
      // walk into the door to leave
      if (this.nearDoor() && this.pos.gx < 0.45 && d.gx < 0) return this.leave();
    }
    if (animateWalker(this, p, len > 0, dt, 0.8 + pace * 0.5) && len) footstep('floor');
    this.place();
    const near = this.nearDoor();
    this.interactBtn.classList.toggle('hidden', !near);
    if (near && !this.doorShown) this.interactBtn.querySelector('.bang').innerHTML = iconSvg('door');
    if (near) this.interactBtn.querySelector('.label').textContent = 'Leave';
    this.doorShown = near;
    if (near && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) this.interact();
  }
}
