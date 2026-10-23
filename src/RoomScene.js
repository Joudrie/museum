import Phaser from 'phaser';
import {
  T,
  hash,
  bakeFloor,
  bakeWalls,
  bakeMainWalls,
  bakeHallStairs,
  bakeRailing,
  bakeColumn,
  bakeFront,
  bakeCrack,
  bakeStain,
  bakeCobweb,
  bakeStairsUp,
  bakeStairsDown,
  bakeCarpet,
  bakePlant,
  bakeItem,
  bakeCoins,
  bakeDirt,
  bakeMop,
  PLANTS,
  makeCharacter,
  makeBubble,
  DEFAULT_DECOR,
  NEW_ROOM_DECOR,
  baseDecor,
  LIGHT_TINTS,
} from './art.js';
import { setTrack, sfx } from './music.js';
import { MAIN_HALL_PRICE, seedEntry, loadRooms, addRoom, resetRooms, updateRoom, swapRooms, roomName, layout, paintingsFor, slotStates, setSlot, hungAnywhere, placeArt, wallItems, plantSpots, carpetRect } from './rooms.js';
import { openSlotMenu } from './slotmenu.js';
import { ITEMS, loadItems, saveItems, resetItems, footprint, countPlaced } from './items.js';
import { roomDirt, removeDirt, resetDirt, covered, janitors } from './staff.js';
import { officeLevel, setOfficeLevel, resetOffice, perks, itemLevel, LEVELS, MAX_LEVEL } from './office.js';
import { openOffice } from './officemenu.js';
import { ask } from './ask.js';
import { roomRating, museumRating, starText } from './rating.js';
import { FREE, coins, canAfford, addCoins, spend, resetWallet, museumIncome, museumVisitors, coffeeIncome, roomIncome, pile, settle, collect, sellPrice } from './wallet.js';
import { openToolkit, hideToolkit, showBar, hideBar } from './toolkit.js';
import { artBounds, paintArt, wallRef } from './walldraw.js';
import { PERSONALITIES, lineFor } from './lines.js';
import { iconSvg } from './icons.js';
import { openViewer } from './viewer.js';
import { openDecor, closeDecor, load, save, DEFAULT_CHARACTER } from './decor.js';
import { openBuild } from './build.js';
import { showTalk, hideTalk, talking } from './talk.js';

const VIEW_TILES = 9; // the camera always shows 9 tiles across
const SPEED = 176; // px per second
const NPC_SPEED = 70;
const NPC_SLOW = 0.35; // visitors slow down near the player so they're easy to talk to
const BODY = { w: 7, h: 5 }; // half-size of a character's feet, for bumping
const PLAYER_SCALE = 1.15;
const REACH = 26; // how close you need to be to interact
const HD = 4; // resolution multiplier for paintings on the wall

const DECOR_KEY = 'curation.roomDecor'; // { [roomIndex]: decor }
const TUTORIAL_KEY = 'curation.tutorial'; // how far the first-time walkthrough has got
const CHARACTER_KEY = 'curation.character';
const CLEANED_KEY = 'curation.cleaned';

// Visitor looks match who they are: grumps are older (gray or bald), nerds wear
// glasses, tourists wear sun hats, kids are smaller and dress brightly...
const SKINS = ['#f2c6a0', '#e0ac80', '#c68a5e', '#9a6440', '#6e4428', '#ffe0c8', '#b57850', '#583420'];
const HAIRS = ['#4a2e20', '#1e1410', '#d9b45a', '#a0522d', '#2b1a10', '#c0703f', '#e8d8a8', '#8a3a2a', '#3a2a50', '#d06a9a', '#4a8ab0'];
const PANTS = ['#2f2b3d', '#3b3a48', '#5a4632', '#3c4a63', '#4a3a2a', '#6a5a40', '#7a2a2a', '#2a4a3a'];
const OUTFITS = {
  casual: ['#3d6fb6', '#4f7a3a', '#c27a2c', '#2e7d7a', '#b0413e', '#6a4c93'],
  grump: ['#5a4632', '#3b3a48', '#6b5a4a', '#4a4a4f', '#5a5a3a'],
  kid: ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#e67e22'],
  nerd: ['#7a8a5a', '#8a6a4a', '#5a6a8a', '#8a7a5a'],
  snob: ['#1e1e22', '#5a1f2a', '#2a2a3a', '#3a2a4a'],
  tourist: ['#2e9e8a', '#e88a3a', '#e85a7a', '#f0c040'],
  fanboy: ['#6a4c93', '#c0392b', '#2e5a8a', '#d35400'],
  artist: ['#c24a3a', '#3a8a8a', '#e0a030', '#5a4a8a'],
  influencer: ['#f08ab0', '#f4f0e6', '#9ad0e0', '#d0b0f0'],
  couple: ['#a03040', '#2e4a7a', '#f0e0c0', '#6a8a4a'],
  historian: ['#6a5a3a', '#4a3a2a', '#5a5a4a'],
  barista: ['#2f5d46'],
  caretaker: ['#7a5a3a'],
  janitor: ['#4a5f80'],
};

function visitorLook(kind, r) {
  const pick = (arr, k) => arr[Math.floor(r(k) * arr.length) % arr.length];
  const colors = { s: pick(SKINS, 1), h: pick(HAIRS, 2), c: pick(OUTFITS[kind] || OUTFITS.casual, 3), p: pick(PANTS, 4) };
  const look = {};
  let scale = PLAYER_SCALE;
  if (kind === 'grump') {
    colors.h = pick(['#8a8a8a', '#c8c8c8', '#e8e8e8'], 2);
    look.bald = r(6) < 0.5;
  }
  if (kind === 'kid') scale = PLAYER_SCALE * 0.85;
  if (kind === 'nerd') look.glasses = true;
  if (kind === 'snob') colors.p = '#1e1e22';
  if (kind === 'tourist' && r(7) < 0.75) {
    look.hat = true;
    colors.T = pick(['#e8d8a0', '#f4f0e6', '#d9a04a'], 8);
  }
  if (kind === 'casual' && r(9) < 0.2) look.glasses = true;
  if (kind === 'historian') {
    colors.h = pick(['#8a8a8a', '#c8c8c8', '#e8e8e8', '#4a2e20'], 2);
    look.glasses = r(10) < 0.7;
    look.bald = r(6) < 0.3;
  }
  if (kind === 'artist' && r(7) < 0.5) {
    look.hat = true; // a beret
    colors.T = pick(['#2a2a2a', '#a02a2a', '#2a3a6a'], 8);
  }
  if (kind === 'influencer') look.glasses = r(10) < 0.5; // sunglasses indoors
  if (['casual', 'couple', 'fanboy'].includes(kind) && r(11) < 0.15) {
    look.hat = true;
    colors.T = pick(['#3d6fb6', '#b0413e', '#2a2a2a', '#e0a030'], 12);
  }
  if (kind === 'janitor') {
    look.hat = true;
    colors.T = '#4a5f80';
    colors.p = '#2e3a4e';
  }
  if (kind === 'barista') colors.p = '#2a2420';
  if (kind === 'caretaker') {
    colors.h = '#d8d8d8';
    look.glasses = true;
    colors.p = '#3a3028';
  }
  return { colors, look, scale };
}
const KINDS = Object.keys(PERSONALITIES).filter((k) => !PERSONALITIES[k].staff);

export class RoomScene extends Phaser.Scene {
  constructor() {
    super('room');
  }

  init(data) {
    this.roomIndex = data?.room ?? 0;
    this.spawnAt = data?.spawn ?? 'start';
    this.instant = !!data?.instant; // walked through an archway: no fade
  }

  preload() {
    this.rooms = loadRooms();
    this.room = this.rooms[this.roomIndex];
    this.L = layout(this.room);
    this.states = slotStates(this.rooms, this.roomIndex);
    this.hung = paintingsFor(this.rooms, this.roomIndex).map(placeArt);
    this.load.setCORS('anonymous');
    this.hung.forEach((p) => {
      if (!this.textures.exists(`art_${p.id}`)) this.load.image(`art_${p.id}`, p.src);
    });
  }

  create() {
    const { g, exit, entrance } = this.L;
    this.g = g;
    const base = baseDecor(this.room, this.roomIndex);
    this.decor = { ...base, ...(load(DECOR_KEY, {})[this.roomIndex] || {}) };
    this.character = { ...DEFAULT_CHARACTER, ...load(CHARACTER_KEY, {}) };
    makeCharacter(this, 'player', this.character);

    if (!this.textures.exists('bubble')) {
      Object.keys(PLANTS).forEach((k) => k !== 'none' && bakePlant(this, `plant_${k}`, k));
      makeBubble(this);
      for (let i = 0; i < 4; i++) bakeCrack(this, `crack_${i}`, i + 1);
      for (let i = 0; i < 3; i++) bakeStain(this, `stain_${i}`, i + 1);
      bakeCobweb(this, 'cobweb');
      bakeStairsUp(this, 'stairs_up');
      bakeStairsDown(this, 'stairs_down');
      for (let i = 1; i <= 3; i++) bakeCoins(this, `coins_${i}`, i);
      bakeDirt(this, 'dirt_puddle', 'puddle');
      bakeDirt(this, 'dirt_litter', 'litter');
      bakeMop(this, 'mop');
      bakeItem(this, 'desk', 'desk', { w: 2, h: 1, rise: 24 }, 0);
    }

    const next = this.rooms[this.roomIndex + 1];
    this.arches = { exit: !!this.room.arch, exitClosed: !next || !!next.locked, entrance: this.roomIndex > 0 && !!this.rooms[this.roomIndex - 1].arch };
    this.wallItems = wallItems(this.L, this.hung, this.states, this.arches);
    this.floorImg = this.add.image(g.xL, g.y0, bakeFloor(this, 'floor', g.xR - g.xL, g.y1 - g.y0, this.decor).key).setOrigin(0);
    this.wallImg = this.add.image(0, 0, this.bakeRoomWalls(this.decor)).setOrigin(0);
    if (!g.main) this.add.image(0, g.y1, bakeFront(this, 'front', g.w, entrance.mat ? entrance.x0 : -1, entrance.mat ? entrance.x1 : -1).key).setOrigin(0);
    if (exit?.sprite) this.add.image(exit.sprite.x, exit.sprite.y, exit.sprite.key).setOrigin(0).setFlipX(exit.sprite.flip).setDepth(2);
    this.hung.forEach((p) => this.drawPainting(p));
    this.blocks = exit?.block ? [exit.block] : [];
    if (g.main) this.placeHall();
    this.decorObjects = [];
    this.placeDecor();
    this.deskSpot = this.L.desk ? { ...this.L.desk } : this.roomIndex === 0 ? this.findDeskSpot() : null;
    if (this.deskSpot) this.placeDesk();
    this.pileTile = this.findPileTile();
    this.pileSprite = this.add.image(0, 0, 'coins_1').setOrigin(0.5, 1).setVisible(false);
    // A twinkle on the coin pile so it catches the eye.
    if (!this.textures.exists('twinkle')) {
      const tw = this.make.graphics({ add: false });
      tw.fillStyle(0xffffff, 1).fillRect(2, 0, 1, 5).fillRect(0, 2, 5, 1);
      tw.generateTexture('twinkle', 5, 5);
      tw.destroy();
    }
    this.twinkle = this.add.image(0, 0, 'twinkle').setAlpha(0).setVisible(false);
    this.tweens.add({
      targets: this.twinkle,
      alpha: { from: 0, to: 1 },
      yoyo: true,
      repeat: -1,
      duration: 380,
      repeatDelay: 1300,
      onRepeat: () => this.twinkle.setPosition(this.pileSprite.x - 8 + Math.random() * 16, this.pileSprite.y - 14 + Math.random() * 8),
    });
    this.items = [];
    this.fitItems();
    this.itemSprites = [];
    this.placeItems();
    this.overlay = this.add.graphics().setDepth(6000);
    this.mode = null; // toolkit: null | 'browse' | 'place' | 'edit'

    this.mess = [];
    if (this.roomIndex === 0) this.spawnMess();

    const start = this.spawnPoint();
    this.player = this.add.sprite(start.x, start.y, start.face).setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    const count = Math.min(5, 3 + Math.floor(this.L.slots.length / 6));
    this.npcs = Array.from({ length: count }, (_, i) => this.spawnVisitor(i));
    this.spawnStaff();
    this.refreshDirt();
    this.bubble = this.add.image(0, 0, 'bubble').setOrigin(0.5, 1).setDepth(5000).setVisible(false);

    this.setupCamera();
    this.setupInput();
    this.setupButtons();
    this.updateHud();
    this.updatePile();
    this.pileTimer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.updatePile() });
    this.tutorial();
    this.dirtTimer = this.time.addEvent({ delay: 30000, loop: true, callback: () => this.refreshDirt() });
    const onCoins = () => this.updateHud();
    window.addEventListener('coins', onCoins);
    this.events.once('shutdown', () => window.removeEventListener('coins', onCoins));
    if (!this.instant) this.cameras.main.fadeIn(250, 29, 21, 18);
    this.archLock = true; // don't bounce straight back through the doorway we arrived by
    if (typeof this.spawnAt !== 'object') this.toast(`${roomName(this.room, this.roomIndex)} · ${starText(roomRating(this.rooms, this.roomIndex).stars)}`);
  }

  spawnPoint() {
    const { g, exit, entrance } = this.L;
    if (typeof this.spawnAt === 'object') {
      const b = this.bounds();
      return { ...this.spawnAt, x: Phaser.Math.Clamp(this.spawnAt.x, b.x0, b.x1), y: Phaser.Math.Clamp(this.spawnAt.y, b.y0, b.y1) };
    }
    if (this.spawnAt === 'exit' && exit) return { x: exit.ax, y: exit.ay + 14, face: 'player_down' };
    if (this.spawnAt === 'entrance' && !entrance.mat) return { x: entrance.ax + 6, y: entrance.ay + 4, face: 'player_side' };
    if (this.spawnAt === 'entrance') return { x: entrance.ax, y: g.y1 - 16, face: 'player_up' };
    return { x: entrance.ax, y: g.y1 - 24, face: 'player_up' };
  }

  // ---------- Paintings ----------

  // Draw the real painting onto the angled wall at higher resolution.
  bakeRoomWalls(decor) {
    return (this.g.main ? bakeMainWalls : bakeWalls)(this, 'walls', this.g, this.wallItems, decor).key;
  }

  // Main hall: stairs standing out from the balcony, columns one tile in front of
  // the wall holding up the railing, and what you can't walk through.
  placeHall() {
    const { g } = this;
    (this.hallParts || []).forEach((o) => o.destroy());
    this.hallParts = [];
    this.blocks = this.blocks.filter((b) => !b.hall);
    const top = g.yb - g.D; // the balcony's front edge, along the top of the wall
    // Railing: one run between each pair of staircases, resting on the columns.
    const edges = [g.xL, ...g.stairs.flatMap((st) => [st.x0, st.x1]), g.xR];
    for (let i = 0; i < edges.length; i += 2) {
      const [x0, x1] = [edges[i], edges[i + 1]];
      const key = `hall_rail_${i}`;
      bakeRailing(this, key, x1 - x0);
      this.hallParts.push(this.add.image(x0, top + 8, key).setOrigin(0, 1).setDepth(top));
      this.blocks.push({ hall: true, x0, x1, y0: top - 10, y1: g.yb - 8 }); // balcony edge + the wall below it
    }
    // Columns: from the floor up to the underside of the railing's beam.
    const colH = g.columns[0].foot - (top + 8);
    bakeColumn(this, 'hall_column', colH);
    g.columns.forEach((col) => {
      this.hallParts.push(this.add.image(col.x, col.foot, 'hall_column').setOrigin(0.5, 1).setDepth(col.foot));
      this.blocks.push({ hall: true, x0: col.x - 6, x1: col.x + 6, y0: col.foot - 9, y1: col.foot - 8 });
    });
    // Stairs: their top meets the balcony edge, their foot sits out on the floor.
    bakeHallStairs(this, 'hall_stairs', this.decor, g.stairRun);
    bakeColumn(this, 'hall_newel', 20);
    const shadow = this.add.graphics().setDepth(0.5);
    this.hallParts.push(shadow);
    g.stairs.forEach((st) => {
      this.hallParts.push(this.add.image(st.x0, st.foot, 'hall_stairs').setOrigin(0, 1).setDepth(1));
      // the flight casts a wedge of shadow on the floor beside it, deepest at the wall
      shadow.fillStyle(0x000000, 0.18);
      shadow.fillTriangle(st.x1, g.yb, st.x1 + 12, g.yb, st.x1, st.foot);
      // a marble newel post at each corner of the foot
      [st.x0 + 3, st.x1 - 3].forEach((x) => this.hallParts.push(this.add.image(x, st.foot + 2, 'hall_newel').setOrigin(0.5, 1).setDepth(st.foot + 2)));
      // the handrails: you get on at the foot, not over the side
      this.blocks.push({ hall: true, x0: st.x0 - 3, x1: st.x0 + 1, y0: g.yb - 8, y1: st.foot - 14 });
      this.blocks.push({ hall: true, x0: st.x1 - 1, x1: st.x1 + 3, y0: g.yb - 8, y1: st.foot - 14 });
    });
    // Outside the hallway, below the hall's front edge.
    this.blocks.push({ hall: true, x0: 0, x1: g.hx0, y0: g.yf - 2, y1: g.h });
    this.blocks.push({ hall: true, x0: g.hx1, x1: g.w, y0: g.yf - 2, y1: g.h });
  }

  drawPainting(p) {
    const src = this.textures.exists(`art_${p.id}`) && this.textures.get(`art_${p.id}`).getSourceImage();
    const b = artBounds(p, this.g);
    const key = `wallart_${this.roomIndex}_${p.wall}_${p.u}`;
    if (this.textures.exists(key)) this.textures.remove(key);
    const tex = this.textures.createCanvas(key, b.w * HD, b.h * HD);
    const ctx = tex.getContext();
    paintArt(ctx, src && src.width > 1 ? src : null, p, this.g, HD, b.x, b.y);
    // match the wall's shading
    const shadeBy = { left: 0.1, right: 0.18, back: 0.04 }[wallRef(p, this.g).face];
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = `rgba(20, 12, 8, ${shadeBy})`;
    ctx.fillRect(0, 0, b.w * HD, b.h * HD);
    tex.refresh();
    tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
    this.add.image(b.x, b.y, key).setOrigin(0).setScale(1 / HD);
  }

  // Where to stand to look at a painting, and whether the player is there.
  standFor(p) {
    const r = wallRef(p, this.g);
    if (r.face === 'back') return { x: r.x + p.u, y: r.y + 14, fx: 0, fy: -1 };
    return { x: r.face === 'left' ? r.x + 10 : r.x - 10, y: r.y + p.u + 10, fx: r.face === 'left' ? -1 : 1, fy: 0 };
  }

  // ---------- Mess (cracks, stains, cobwebs) — first room only ----------

  messList() {
    const { g } = this;
    const L = g.y1 - g.y0;
    const list = [];
    const rx = (i, s) => g.xL + 16 + hash(i, 1, s) * (g.xR - g.xL - 32);
    const ry = (i, s) => g.y0 + 24 + hash(i, 2, s) * (L - 70);
    for (let i = 0; i < 10; i++) {
      const x = rx(i, 40);
      const y = ry(i, 40);
      list.push({ id: `crack${i}`, kind: 'crack', key: `crack_${i % 4}`, x, y, ax: x, ay: y, flip: hash(i, 3, 40) > 0.5 });
    }
    for (let i = 0; i < 4; i++) {
      const x = rx(i, 41);
      const y = ry(i, 41);
      list.push({ id: `stain${i}`, kind: 'stain', key: `stain_${i % 3}`, x, y, ax: x, ay: y, flip: hash(i, 3, 41) > 0.5 });
    }
    // Cobwebs: top corners where the walls meet, along the crown molding, and floor corners.
    const web = (id, x, y, fx, fy, ax, ay) => list.push({ id, kind: 'cobweb', key: 'cobweb', x, y, fx, fy, ax, ay });
    const yl = Math.round(g.y0 - g.D + L * 0.45);
    const yr = Math.round(g.y0 - g.D + L * 0.7);
    web('web0', 0, g.y0 - g.D, false, false, g.xL + 10, g.y0 + 12);
    web('web1', g.w, g.y0 - g.D, true, false, g.xR - 10, g.y0 + 12);
    web('web2', 0, yl, false, false, g.xL + 10, yl + g.D);
    web('web3', g.w, yr, true, false, g.xR - 10, yr + g.D);
    web('web4', g.xL, g.y1, false, true, g.xL + 10, g.y1 - 12);
    web('web5', g.xR, g.y1, true, true, g.xR - 10, g.y1 - 12);
    return list;
  }

  spawnMess() {
    const cleaned = new Set(load(CLEANED_KEY, []));
    this.mess = this.messList().filter((m) => !cleaned.has(m.id));
    this.mess.forEach((m) => {
      if (m.kind === 'cobweb') {
        m.sprite = this.add.image(m.x, m.y, m.key).setOrigin(m.fx ? 1 : 0, m.fy ? 1 : 0).setFlip(m.fx, m.fy).setDepth(4000);
      } else {
        m.sprite = this.add.image(Math.round(m.x), Math.round(m.y), m.key).setFlipX(m.flip).setDepth(1);
      }
    });
  }

  // Puddles and litter on the floor (only in rooms no janitor looks after).
  refreshDirt() {
    const { g } = this;
    const reserved = this.reservedTiles();
    const free = (c, r) =>
      !reserved.has(`${c},${r}`) &&
      !this.items.some((it) => {
        const f = footprint(it);
        return c >= it.c && c < it.c + f.w && r >= it.r && r < it.r + f.h;
      });
    const spots = roomDirt(this.rooms, this.roomIndex, g.fw, g.fd, free);
    spots.forEach((sp) => {
      if (this.mess.some((m) => m.id === sp.id)) return;
      const x = g.xL + (sp.c + 0.5) * T;
      const y = g.y0 + (sp.r + 0.5) * T;
      const m = { id: sp.id, kind: sp.kind, dirt: true, ax: x, ay: y + 6 };
      m.sprite = this.add.image(x, y, `dirt_${sp.kind}`).setDepth(1);
      this.mess.push(m);
    });
    // A janitor arrived (or rooms moved): clear what's no longer there.
    this.mess
      .filter((m) => m.dirt && !spots.some((sp) => sp.id === m.id))
      .forEach((m) => {
        m.sprite.destroy();
        this.mess = this.mess.filter((x) => x !== m);
      });
    this.updateHud();
  }

  clean(m) {
    this.mess = this.mess.filter((x) => x !== m);
    if (m.dirt) {
      settle(this.rooms, this.roomIndex);
      removeDirt(this.roomIndex, m.id);
      this.updateHud();
    } else save(CLEANED_KEY, [...new Set([...load(CLEANED_KEY, []), m.id])]);
    sfx('clean');
    this.tutorialCleaned();

    const b = m.sprite.getBounds();
    const color = m.kind === 'cobweb' ? 0xf4f2ec : m.kind === 'crack' ? 0xf1dfb0 : 0xd8e4ea;
    const count = m.kind === 'cobweb' ? 14 : 9;
    for (let i = 0; i < count; i++) {
      const px = this.add.rectangle(b.x + Math.random() * b.width, b.y + Math.random() * b.height, 2, 2, color).setDepth(m.sprite.depth + 1);
      this.tweens.add({
        targets: px,
        x: px.x + (Math.random() - 0.5) * 16,
        y: px.y + (m.kind === 'cobweb' ? 10 + Math.random() * 14 : -8 - Math.random() * 12),
        alpha: 0,
        duration: 900 + Math.random() * 900,
        ease: 'Quad.easeOut',
        onComplete: () => px.destroy(),
      });
    }
    this.tweens.add({ targets: m.sprite, alpha: 0, duration: 450, onComplete: () => m.sprite.destroy() });
  }

  resetMess() {
    if (this.roomIndex !== 0) return save(CLEANED_KEY, []);
    this.mess.forEach((m) => m.sprite.destroy());
    save(CLEANED_KEY, []);
    this.spawnMess();
  }

  // ---------- Visitors (walk Pokémon-style: straight lines, 1-2 tiles) ----------

  spawnVisitor(i) {
    const { g } = this;
    const seed = this.roomIndex * 10 + i;
    const kind = KINDS[Math.floor(hash(seed, 5, 50) * KINDS.length)];
    const { colors, look, scale } = visitorLook(kind, (k) => hash(seed, k, 53));
    const prefix = `visitor${seed}`;
    makeCharacter(this, prefix, colors, look);
    const names = PERSONALITIES[kind].names;
    let x;
    let y;
    for (let tries = 0; tries < 20; tries++) {
      x = g.xL + Math.floor(hash(seed * 13 + 3, 1 + tries, 51) * g.fw) * T + T / 2; // spread out, not all in one column
      y = g.y0 + (1 + Math.floor(hash(seed, 2 + tries, 52) * (g.fd - 2))) * T + T - 4;
      if (!this.blocked(x, y)) break;
    }
    const s = this.add.sprite(x, y, `${prefix}_down`).setOrigin(0.5, 1).setScale(scale);
    return { s, prefix, kind, name: names[Math.floor(hash(seed, 6, 50) * names.length)], wait: 400 + Math.random() * 1500, target: null };
  }

  // The barista behind a coffee counter, and sometimes a janitor on their rounds.
  spawnStaff() {
    const { g } = this;
    const make = (kind, seed, x, y) => {
      const { colors, look, scale } = visitorLook(kind, (k) => hash(seed, k, 53));
      const prefix = `staff${seed}`;
      makeCharacter(this, prefix, colors, look);
      const names = PERSONALITIES[kind].names;
      const s = this.add.sprite(x, y, `${prefix}_down`).setOrigin(0.5, 1).setScale(scale);
      const n = { s, prefix, kind, staff: true, name: names[Math.floor(hash(seed, 6, 50) * names.length)], wait: 1000, target: null };
      this.npcs.push(n);
      return n;
    };
    if (this.deskSpot) make('caretaker', 900, g.xL + this.deskSpot.c * T + T, g.y0 + this.deskSpot.r * T + 2).fixed = true;
    const counter = this.items.find((it) => it.type === 'counter');
    if (counter) {
      make('barista', 700 + this.roomIndex, g.xL + counter.c * T + 60, g.y0 + counter.r * T + 2).fixed = true;
    }
    if (covered(this.rooms, this.roomIndex) && Math.random() < 0.5) {
      let x = g.xL + T * 1.5;
      let y = g.y0 + T * 3;
      for (let tries = 0; tries < 20 && this.blocked(x, y); tries++) {
        x = g.xL + (Math.floor(Math.random() * g.fw) + 0.5) * T;
        y = g.y0 + (1 + Math.floor(Math.random() * (g.fd - 2))) * T + T - 4;
      }
      const n = make('janitor', 800 + this.roomIndex, x, y);
      n.mop = this.add.image(x + 12, y, 'mop').setOrigin(0.5, 1);
    }
  }

  // Services changed (counter or closet placed, moved or sold): respawn staff, recheck dirt.
  refreshStaff() {
    this.endTalk();
    this.npcs.filter((n) => n.staff).forEach((n) => {
      n.s.destroy();
      n.mop?.destroy();
    });
    this.npcs = this.npcs.filter((n) => !n.staff);
    this.spawnStaff();
    this.refreshDirt();
  }

  updateVisitor(n, dt) {
    if (n.talking || n.fixed) return;
    if (n.target) {
      const dx = n.target.x - n.s.x;
      const dy = n.target.y - n.s.y;
      const near = Math.hypot(this.player.x - n.s.x, this.player.y - n.s.y) < 48;
      const step = NPC_SPEED * dt * (near ? NPC_SLOW : 1);
      const sx = dx ? Math.sign(dx) * Math.min(step, Math.abs(dx)) : 0;
      const sy = dx ? 0 : Math.sign(dy) * Math.min(step, Math.abs(dy));
      if (this.overlapsPlayer(n.s.x + sx, n.s.y + sy)) return; // wait for the player to move
      if (Math.abs(dx) + Math.abs(dy) <= step) {
        n.s.setPosition(n.target.x, n.target.y);
        n.target = null;
        n.wait = 600 + Math.random() * 2200;
      } else if (dx) n.s.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
      else n.s.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
      return;
    }
    n.wait -= dt * 1000;
    if (n.wait > 0) return;
    const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
    const tiles = 1 + Math.floor(Math.random() * 2);
    const tx = n.s.x + dx * tiles * T;
    const ty = n.s.y + dy * tiles * T;
    const b = this.bounds();
    if (tx < b.x0 || tx > b.x1 || ty < b.y0 + 12 || ty > b.y1 - 20 || this.blocked(tx, ty)) {
      n.wait = 200;
      return;
    }
    n.target = { x: tx, y: ty };
    this.faceSprite(n.s, n.prefix, dx, dy);
  }

  // The painting a visitor is standing near, if any.
  paintingNear(x, y) {
    let best = null;
    let bestD = 3 * T;
    for (const p of this.hung) {
      const s = this.standFor(p);
      const d = Math.hypot(x - s.x, y - s.y);
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }

  talkTo(n) {
    let line = lineFor(n.kind, this.paintingNear(n.s.x, n.s.y));
    if (n.kind === 'barista' && Math.random() < 0.5) {
      line = `Coffee’s flowing! ${museumVisitors(this.rooms).toLocaleString()} visitors a month means ${coffeeIncome(this.rooms)} gold an hour from cups.`;
    }
    if (n.kind === 'janitor' && Math.random() < 0.4) {
      const j = janitors(this.rooms);
      line = `There ${j === 1 ? 'is 1 of us' : `are ${j} of us`}. Each janitor keeps 3 rooms spotless.`;
    }
    n.talking = true;
    n.target = null;
    this.faceSprite(n.s, n.prefix, this.player.x - n.s.x, this.player.y - n.s.y);
    this.talkingTo = n;
    sfx('talk');
    const at = this.screenAt(n.s.x, n.s.y - 34);
    showTalk(n.name, PERSONALITIES[n.kind].label, line, at);
  }

  // Where a point in the room is on the page (for speech bubbles).
  screenAt(x, y) {
    const cam = this.cameras.main;
    const r = this.game.canvas.getBoundingClientRect();
    const k = r.width / this.scale.gameSize.width;
    return { x: r.left + (x - cam.worldView.x) * cam.zoom * k, y: r.top + (y - cam.worldView.y) * cam.zoom * k };
  }

  // ---------- First-time walkthrough: Edmund the caretaker shows you around ----------

  tutorial() {
    const step = load(TUTORIAL_KEY, 0);
    if (step === 0 && this.roomIndex === 0) {
      this.time.delayedCall(900, () => this.caretakerSays('Welcome, new curator! Congrats on your new museum. It’s seen better days: walk over to the cracks, stains and cobwebs and press Interact to clean them up.'));
      save(TUTORIAL_KEY, 1);
    } else if (step === 2 && this.roomIndex === 1) {
      this.time.delayedCall(900, () => this.caretakerSays('The main hall! Decorate it with the hammer, change the floors and walls with the house button, and hang paintings in the empty frames. Each painting brings visitors.'));
      save(TUTORIAL_KEY, 3);
    }
  }

  // Called after cleaning: once the entrance is spotless, point the way on.
  tutorialCleaned() {
    if (load(TUTORIAL_KEY, 0) !== 1 || this.roomIndex !== 0 || this.mess.some((m) => !m.dirt)) return;
    save(TUTORIAL_KEY, 2);
    this.caretakerSays('Spotless! Visitors pay as they come: collect the coins that pile up by the door. When you’re ready, open the main hall through the double doors.');
  }

  caretakerSays(line) {
    const n = this.npcs.find((v) => v.kind === 'caretaker');
    const at = n ? this.screenAt(n.s.x, n.s.y - 34) : this.screenAt(this.player.x, this.player.y - 34);
    sfx('talk');
    showTalk('Edmund', PERSONALITIES.caretaker.label, line, at, 10000);
  }

  endTalk() {
    if (!this.talkingTo) return;
    this.talkingTo.talking = false;
    this.talkingTo.wait = 1500;
    this.talkingTo = null;
    hideTalk();
  }

  // ---------- Movement helpers ----------

  bounds() {
    const { g } = this;
    return { x0: g.xL + 9, x1: g.xR - 9, y0: g.y0 + 10, y1: g.y1 - 2 };
  }

  blocked(x, y) {
    return this.blocks.some((b) => x > b.x0 - 6 && x < b.x1 + 6 && y > b.y0 && y < b.y1 + 8);
  }

  // Characters bump into each other instead of walking through.
  hitsVisitor(x, y) {
    return !!this.visitorAt(x, y);
  }

  visitorAt(x, y) {
    return this.npcs.find((n) => Math.abs(x - n.s.x) < 2 * BODY.w && Math.abs(y - n.s.y) < 2 * BODY.h);
  }

  overlapsPlayer(x, y) {
    return Math.abs(x - this.player.x) < 2 * BODY.w && Math.abs(y - this.player.y) < 2 * BODY.h;
  }

  // ---------- Camera & input ----------

  setupCamera() {
    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.2, 0.2);
    this.fitCamera();
    this.scale.on('resize', this.fitCamera, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.fitCamera, this));
  }

  fitCamera() {
    const cam = this.cameras.main;
    const { width, height } = this.scale.gameSize;
    cam.setSize(width, height);
    const zoom = width / (VIEW_TILES * T);
    cam.setZoom(zoom);
    // Rooms smaller than the screen sit centered instead of stuck to the top.
    const vw = Math.max(this.g.w, width / zoom);
    const vh = Math.max(this.g.h, height / zoom);
    cam.setBounds((this.g.w - vw) / 2, (this.g.h - vh) / 2, vw, vh);
  }

  // Press and drag anywhere to walk (a floating joystick appears).
  setupInput() {
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE,ENTER');
    this.stick = document.getElementById('stick');
    this.knob = this.stick.querySelector('.knob');
    this.dragging = false;

    this.input.on('pointerdown', (p) => {
      this.press = this.toCss(p);
      this.dragging = false;
      if (this.mode === 'place') this.ghostDrag = { c: this.ghost.c, r: this.ghost.r };
    });
    this.input.on('pointermove', (p) => {
      if (!this.press || !p.isDown) return;
      const at = this.toCss(p);
      const dx = at.x - this.press.x;
      const dy = at.y - this.press.y;
      if (this.mode) {
        if (this.mode === 'place' && this.ghostDrag) this.dragGhost(dx, dy);
        if (Math.hypot(dx, dy) > 10) this.dragging = true;
        return;
      }
      if (!this.dragging && Math.hypot(dx, dy) > 10) {
        this.dragging = true;
        this.stick.style.left = `${this.press.x}px`;
        this.stick.style.top = `${this.press.y}px`;
        this.stick.classList.add('active');
      }
      if (this.dragging) this.moveKnob(dx, dy);
    });
    this.input.on('pointerup', (p) => {
      if (this.mode && this.mode !== 'place' && this.press && !this.dragging) this.tapItem(p.worldX, p.worldY);
      this.ghostDrag = null;
      this.press = null;
      this.dragging = false;
      this.stick.classList.remove('active');
    });
  }

  toCss(p) {
    const r = this.game.canvas.getBoundingClientRect();
    return { x: r.left + (p.x * r.width) / this.scale.gameSize.width, y: r.top + (p.y * r.height) / this.scale.gameSize.height };
  }

  moveKnob(dx, dy) {
    const max = 36;
    const len = Math.hypot(dx, dy);
    const k = len > max ? max / len : 1;
    this.knob.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    this.dragVec = len > 0 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };
  }

  setupButtons() {
    document.getElementById('build-btn').onclick = () => {
      if (this.mode) this.exitBuild();
      else if (this.input.enabled) this.enterBuild();
    };
    this.interactBtn = document.getElementById('interact');
    this.interactIcon = this.interactBtn.querySelector('.bang');
    this.interactBtn.onclick = () => this.interact();
    document.getElementById('home-btn').onclick = () => {
      if (!this.input.enabled || this.mode) return;
      this.pause(true);
      openDecor({
        decor: this.decor,
        character: this.character,
        room: this.room,
        index: this.roomIndex,
        rooms: this.rooms,
        onRoom: (patch) => {
          updateRoom(this.roomIndex, patch);
          if ('name' in patch) {
            this.rooms = loadRooms();
            this.room = this.rooms[this.roomIndex];
            return;
          }
          this.rebuild();
        },
        onMoveRoom: (i, j) => {
          swapRooms(i, j);
          const here = this.roomIndex === i ? j : this.roomIndex === j ? i : this.roomIndex;
          this.rebuild(here);
        },
        onGoRoom: (i) => {
          closeDecor();
          this.travel(i, 'entrance');
        },
        onDecor: (decor) => this.applyDecor(decor),
        onCharacter: (character) => this.applyCharacter(character),
        plantIcon: (id) => (id === 'none' ? null : this.textures.get(`plant_${id}`).getSourceImage().toDataURL()),
        characterPreview: () => this.characterPreview(),
        onReset: () => {
          this.resetMess();
          resetRooms();
          resetItems();
          seedEntry(true);
          resetWallet();
          resetDirt();
          resetOffice();
          save(TUTORIAL_KEY, 0); // replay the walkthrough
          save(DECOR_KEY, { 0: load(DECOR_KEY, {})[0] }); // built rooms are gone, so is their decor
          this.travel(0, 'start');
        },
        onAddCoins: (n) => addCoins(n),
        onClose: () => this.pause(false),
      });
    };
  }

  pause(on) {
    this.input.enabled = !on;
    this.stick.classList.remove('active');
    this.dragging = false;
    if (on) {
      this.bubble.setVisible(false);
      this.interactBtn.classList.add('hidden');
      this.endTalk();
    }
  }

  // Carpet and plants for this room. Rebuilt whenever the decor changes.
  placeDecor() {
    this.decorObjects.forEach((o) => o.destroy());
    this.decorObjects = [];
    this.blocks = this.blocks.filter((b) => !b.plant);
    // Lighting: a tint multiplied over the whole room (people included).
    const tint = LIGHT_TINTS[this.decor.light || 'warm'];
    if (tint !== 0xffffff) {
      this.decorObjects.push(
        this.add.rectangle(0, 0, this.g.w, this.g.h + T, tint).setOrigin(0).setDepth(4999).setBlendMode(Phaser.BlendModes.MULTIPLY),
      );
    }
    setTrack(this.decor.music || 'none');
    if (this.decor.carpet) {
      const c = carpetRect(this.L);
      bakeCarpet(this, 'carpet', c.w, c.h, this.decor.carpetColor, c.alongY);
      this.decorObjects.push(this.add.image(c.x, c.y, 'carpet').setOrigin(0).setDepth(0.5));
    }
    if (this.decor.plant !== 'none') {
      plantSpots(this.L).forEach(({ x, y }) => {
        this.decorObjects.push(this.add.image(x, y, `plant_${this.decor.plant}`).setOrigin(0.5, 1).setDepth(y));
        this.blocks.push({ plant: true, x0: x - 8, x1: x + 8, y0: y - 10, y1: y - 2 });
      });
    }
  }

  applyDecor(decor) {
    this.decor = decor;
    save(DECOR_KEY, { ...load(DECOR_KEY, {}), [this.roomIndex]: decor });
    bakeFloor(this, 'floor', this.g.xR - this.g.xL, this.g.y1 - this.g.y0, decor);
    this.floorImg.setTexture('floor');
    this.bakeRoomWalls(decor);
    this.wallImg.setTexture('walls');
    if (this.g.main) this.placeHall();
    this.placeDecor();
  }

  applyCharacter(character) {
    this.character = character;
    save(CHARACTER_KEY, character);
    const key = this.player.texture.key;
    makeCharacter(this, 'player', character);
    this.player.setTexture(key);
  }

  // Big front/side/back views of the curator for the Character tab.
  characterPreview() {
    return ['player_down', 'player_side', 'player_up'].map((k) => {
      const src = this.textures.get(k).getSourceImage();
      const c = document.createElement('canvas');
      c.width = src.width;
      c.height = src.height;
      c.getContext('2d').drawImage(src, 0, 0);
      return c;
    });
  }

  // ---------- Interaction ----------

  // The nearest thing in reach: painting, mess, visitor, exit or entrance.
  findFocus() {
    const { x, y } = this.player;
    let best = null;
    let bestD = REACH;
    const consider = (d, focus) => {
      if (d < bestD) {
        best = focus;
        bestD = d;
      }
    };
    for (const p of this.hung) {
      const s = this.standFor(p);
      const half = (p.art.u1 - p.art.u0) / 2;
      const flat = wallRef(p, this.g).face === 'back';
      const along = flat ? Math.abs(x - s.x) : Math.abs(y - s.y);
      const across = flat ? Math.abs(y - s.y) : Math.abs(x - s.x);
      if (along < half + 14 && across < 16) consider(across + along / 4, { painting: p, icon: 'look' });
    }
    for (const sl of this.states) {
      if (sl.kind === 'painting') continue;
      const st = this.standFor(sl);
      const flat = wallRef(sl, this.g).face === 'back';
      const along = flat ? Math.abs(x - st.x) : Math.abs(y - st.y);
      const across = flat ? Math.abs(y - st.y) : Math.abs(x - st.x);
      if (along < 22 && across < 16) consider(across + along / 4 + 1, { slot: sl, icon: sl.kind === 'door' ? 'door' : 'build' });
    }
    for (const m of this.mess) {
      consider(Math.hypot(x - m.ax, y - 4 - m.ay), { mess: m, icon: { crack: 'repair', stain: 'clean', cobweb: 'sweep', puddle: 'clean', litter: 'sweep' }[m.kind] });
    }
    (this.L.decorDoors || []).forEach((d) => {
      if (!d.label) return;
      const st = this.standFor({ wall: d.wall, u: (d.rect.u0 + d.rect.u1) / 2 });
      consider(Math.hypot(x - st.x, y - st.y), { door: d, icon: 'door' });
    });
    if (this.deskFront) consider(Math.hypot(x - this.deskFront.x, y - this.deskFront.y) - 6, { office: true, icon: 'office' });
    if (this.pileSprite.visible) consider(Math.hypot(x - this.pileSprite.x, y - this.pileSprite.y + 6) - 4, { coins: true, icon: 'coins' });
    for (const n of this.npcs) consider(Math.hypot(x - n.s.x, y - n.s.y) - 2, { npc: n, icon: 'talk' });
    const { exit, entrance } = this.L;
    if (exit) {
      const built = this.roomIndex + 1 < this.rooms.length;
      const icon = !built ? 'build' : exit.kind.startsWith('stairs') ? 'stairs' : 'door';
      consider(Math.hypot(x - exit.ax, y - exit.ay), { exit: true, icon });
    }
    if (this.roomIndex > 0) consider(Math.hypot(x - entrance.ax, y - entrance.ay), { entrance: true, icon: 'back' });
    return best;
  }

  interact() {
    const f = this.focus;
    if (!f || !this.input.enabled) return;
    if (f.painting) this.view(f.painting);
    else if (f.slot) this.editSlot(f.slot);
    else if (f.mess) this.clean(f.mess);
    else if (f.coins) this.collectPile();
    else if (f.office) this.openOfficePanel();
    else if (f.door) f.door.label === 'Office' ? this.openOfficePanel() : this.toast(`${f.door.label}: coming soon`);
    else if (f.npc) (this.talkingTo === f.npc ? this.endTalk() : this.talkTo(f.npc));
    else if (f.entrance) this.travel(this.roomIndex - 1, 'exit');
    else if (f.exit) {
      const next = this.rooms[this.roomIndex + 1];
      if (next?.locked) this.offerMainHall();
      else if (next) this.travel(this.roomIndex + 1, 'entrance');
      else this.openBuildMenu();
    }
    this.focus = null;
  }

  // The main hall starts locked behind the entrance's double doors.
  offerMainHall() {
    this.pause(true);
    const price = FREE ? `free while testing (${MAIN_HALL_PRICE} gold)` : `${MAIN_HALL_PRICE} gold`;
    ask(`Open the main hall?`, `A grand open hall with a balcony and room for big exhibits. ${price}.`, 'Open it', (yes) => {
      this.pause(false);
      if (!yes) return;
      if (!spend(MAIN_HALL_PRICE)) return this.toast(`Need ${MAIN_HALL_PRICE.toLocaleString()} gold`);
      updateRoom(1, { locked: false });
      sfx('build');
      this.rooms = loadRooms();
      this.toast('The main hall is open!');
      this.travel(1, 'entrance');
    });
  }

  openBuildMenu() {
    const max = perks().rooms;
    if (this.rooms.length >= max) return this.toast(`Upgrade the Curator’s Office to build more than ${max} rooms`);
    this.pause(true);
    openBuild(this, this.rooms, NEW_ROOM_DECOR, {
      onBuild: (room) => {
        addRoom(room);
        sfx('build');
        this.travel(this.roomIndex + 1, 'entrance');
      },
      onCancel: () => this.pause(false),
    });
  }

  travel(room, spawn, instant) {
    this.input.enabled = false;
    this.interactBtn.classList.add('hidden');
    hideTalk();
    if (instant) return this.scene.restart({ room, spawn, instant });
    sfx('door');
    this.cameras.main.fadeOut(220, 29, 21, 18);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ room, spawn }));
  }

  // Rebuild this room in place (after resizing etc.), keeping the player where they are.
  rebuild(room = this.roomIndex) {
    closeDecor();
    const spawn = { x: this.player.x, y: this.player.y, face: this.player.texture.key };
    this.scene.restart({ room, spawn, instant: true });
  }

  toast(text) {
    if (/^(Need|Only|Unlocks|Upgrade|Not enough)/.test(text)) sfx('nope');
    const el = document.getElementById('toast');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.add('hidden'), 1600);
  }

  // Load saved items, nudging ones that no longer fit (after a resize) back inside.
  fitItems() {
    const saved = loadItems(this.roomIndex);
    let changed = false;
    saved.forEach((it) => {
      if (this.canPlace(it)) return this.items.push(it);
      // Find the nearest free spot; only drop the item if the room has none.
      const { w, h } = footprint(it);
      const spots = [];
      for (let c = 0; c <= this.g.fw - w; c++) for (let r = 0; r <= this.g.fd - h; r++) spots.push({ ...it, c, r });
      spots.sort((a, b) => Math.hypot(a.c - it.c, a.r - it.r) - Math.hypot(b.c - it.c, b.r - it.r));
      const fit = spots.find((sp) => this.canPlace(sp));
      if (fit) this.items.push(fit);
      changed = true;
    });
    if (changed) saveItems(this.roomIndex, this.items);
  }

  // Archways: walk straight through, no button and no fade.
  checkArches() {
    const { x, y } = this.player;
    const { exit, entrance } = this.L;
    const near = (a) => a && Math.hypot(x - a.ax, y - a.ay) < 12;
    const builtNext = this.roomIndex + 1 < this.rooms.length;
    const exitArch = this.arches.exit && builtNext && exit?.rect;
    const entranceArch = this.arches.entrance;
    const touching = (exitArch && near(exit)) || (entranceArch && near(entrance));
    if (this.archLock) {
      if (!touching) this.archLock = false;
      return;
    }
    if (exitArch && near(exit)) this.travel(this.roomIndex + 1, 'entrance', true);
    else if (entranceArch && near(entrance)) this.travel(this.roomIndex - 1, 'exit', true);
  }

  view(p) {
    const s = this.standFor(p);
    this.faceSprite(this.player, 'player', s.fx, s.fy);
    this.pause(true);
    openViewer(
      this.hung,
      this.hung.indexOf(p),
      () => this.pause(false),
      (q) => this.editSlot(this.states.find((sl) => sl.wall === q.wall && sl.u === q.u)),
    );
  }

  // Change what's in a wall slot, then rebuild the room around the player.
  editSlot(slot) {
    this.pause(true);
    const st = this.standFor(slot);
    this.faceSprite(this.player, 'player', st.fx, st.fy);
    openSlotMenu({
      current: slot,
      hungIn: hungAnywhere(this.rooms),
      onPick: (value) => {
        this.settleAll(); // paintings can move between rooms
        setSlot(this.roomIndex, slot, value);
        const spawn = { x: this.player.x, y: this.player.y, face: this.player.texture.key };
        this.scene.restart({ room: this.roomIndex, spawn });
      },
      onClose: () => this.pause(false),
    });
  }

  // Walking: a small bounce, and the legs swap when walking up or down.
  animate(s, moving, dt) {
    const front = !s.texture.key.endsWith('_side');
    if (!moving) {
      s.walkT = 0;
      s.setOrigin(0.5, 1);
      if (front) s.setFlipX(false);
      return;
    }
    s.walkT = (s.walkT || 0) + dt;
    const phase = Math.floor(s.walkT * 8) % 2;
    s.setOrigin(0.5, 1 + phase / 32);
    if (front) s.setFlipX(phase === 1);
  }

  faceSprite(s, prefix, vx, vy) {
    if (Math.abs(vx) > Math.abs(vy)) s.setTexture(`${prefix}_side`).setFlipX(vx < 0);
    else if (vy !== 0) s.setTexture(vy < 0 ? `${prefix}_up` : `${prefix}_down`).setFlipX(false);
  }

  // ---------- HUD ----------

  // Coins in the wallet, museum gold per hour and visitors per month.
  updateHud() {
    const income = museumIncome(this.rooms);
    document.querySelector('.hud-coins').textContent = coins().toLocaleString();
    document.querySelector('.hud-income').textContent = `+${income}`;
    const v = museumVisitors(this.rooms); // per month, shown short: 1.3k, 2.4M
    document.querySelector('.hud-visitors').textContent = v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : `${v}`;
    document.querySelector('.hud-rating').textContent = `★ ${(museumRating(this.rooms) / 20).toFixed(1)}`;
  }

  // ---------- Coin piles ----------

  // ---------- Curator's Office (desk in the first room) ----------

  findDeskSpot() {
    const { fw, fd, vertical } = this.g;
    this.deskSpot = null;
    const taken = this.reservedTiles(false);
    const tries = vertical ? [{ c: 0, r: fd - 4 }, { c: fw - 2, r: fd - 4 }, { c: 0, r: 2 }] : [{ c: 2, r: 1 }, { c: 4, r: 1 }, { c: 6, r: 1 }];
    return tries.find((t) => t.c >= 0 && t.r >= 1 && t.c + 1 < fw && !taken.has(`${t.c},${t.r}`) && !taken.has(`${t.c + 1},${t.r}`)) || null;
  }

  placeDesk() {
    const { c, r } = this.deskSpot;
    const x = this.g.xL + c * T;
    const y = this.g.y0 + (r + 1) * T;
    this.add.image(x + T, y, 'desk').setOrigin(0.5, 1).setDepth(y - 1);
    this.blocks.push({ x0: x + 4, x1: x + 2 * T - 4, y0: y - T + 2, y1: y - 8 });
    this.deskFront = { x: x + T, y: y + 10 };
  }

  openOfficePanel() {
    this.pause(true);
    const lines = PERSONALITIES.caretaker.generic;
    openOffice({
      lvl: officeLevel(),
      who: 'Edmund the caretaker',
      say: lines[Math.floor(Math.random() * lines.length)],
      free: FREE,
      canAfford,
      onUpgrade: () => {
        const lvl = officeLevel();
        if (lvl >= MAX_LEVEL || !spend(LEVELS[lvl + 1].cost)) return lvl;
        setOfficeLevel(lvl + 1);
        sfx('build');
        this.toast(`Curator’s Office level ${lvl + 1}!`);
        return lvl + 1;
      },
      onClose: () => this.pause(false),
    });
  }

  // A free floor tile near the entrance for this room's coin pile.
  findPileTile() {
    const { fw, fd, vertical } = this.g;
    const taken = this.reservedTiles(false);
    const tries = vertical
      ? [{ c: fw - 1, r: fd - 1 }, { c: 0, r: fd - 1 }, { c: fw - 1, r: fd - 2 }]
      : [{ c: 1, r: fd - 1 }, { c: 0, r: fd - 1 }, { c: 2, r: fd - 1 }];
    const found = tries.find((t) => !taken.has(`${t.c},${t.r}`));
    if (found) return found;
    // Odd-shaped rooms: the free tile nearest the bottom right.
    for (let r = fd - 1; r >= 0; r--) for (let c = fw - 1; c >= 0; c--) if (!taken.has(`${c},${r}`)) return { c, r };
    return tries[0];
  }

  updatePile() {
    const n = pile(this.rooms, this.roomIndex);
    const sp = this.pileSprite;
    sp.amount = n;
    this.twinkle.setVisible(n >= 1);
    if (n < 1) return sp.setVisible(false);
    const rate = Math.max(1, roomIncome(this.rooms, this.roomIndex));
    const stage = n >= rate * 4 ? 3 : n >= rate ? 2 : 1; // a heap after 4 hours
    const { c, r } = this.pileTile;
    const y = this.g.y0 + (r + 1) * T - 5;
    sp.setTexture(`coins_${stage}`).setPosition(this.g.xL + (c + 0.5) * T, y).setDepth(y).setVisible(true);
    this.twinkle.setDepth(y + 1);
  }

  collectPile() {
    const sp = this.pileSprite;
    const n = collect(this.rooms, this.roomIndex);
    if (n > 0) {
      sfx('coin');
      this.toast(`+${n.toLocaleString()} gold`);
      for (let i = 0; i < 8; i++) {
        const c = this.add.image(sp.x + (Math.random() - 0.5) * 16, sp.y - 8, 'coins_1').setScale(0.35).setDepth(5001);
        this.tweens.add({
          targets: c,
          y: c.y - 30 - Math.random() * 20,
          x: c.x + (Math.random() - 0.5) * 30,
          alpha: 0,
          duration: 500 + Math.random() * 200,
          onComplete: () => c.destroy(),
        });
      }
    }
    this.updatePile();
  }

  settleAll() {
    this.rooms.forEach((_, i) => settle(this.rooms, i));
  }

  // ---------- Decor items (toolkit) ----------

  itemKey(type, rot) {
    const def = ITEMS[type];
    if (def.plant) return `plant_${def.plant}`;
    const key = `item_${type}_${rot ? 1 : 0}`;
    if (!this.textures.exists(key)) bakeItem(this, key, type, def, rot);
    return key;
  }

  tileOf(x, y) {
    return { c: Math.floor((x - this.g.xL) / T), r: Math.floor((y - this.g.y0) / T) };
  }

  // Tiles items can't cover: doorways, stairs, exits and auto-placed plants.
  reservedTiles(withPile = true) {
    const { g, exit, entrance } = this.L;
    const set = new Set();
    const add = ({ c, r }) => set.add(`${c},${r}`);
    if (entrance.mat) add({ c: Math.floor(g.fw / 2), r: g.fd - 1 });
    else add(this.tileOf(entrance.ax, entrance.ay));
    if (exit) add(this.tileOf(exit.ax, exit.ay - 4));
    if (exit?.block) {
      for (let x = exit.block.x0; x < exit.block.x1; x += T / 2)
        for (let y = exit.block.y0; y < exit.block.y1; y += T / 2) add(this.tileOf(x, y));
    }
    if (this.decor.plant !== 'none') plantSpots(this.L).forEach(({ x, y }) => add(this.tileOf(x, y - 4)));
    if (withPile && this.pileTile) add(this.pileTile);
    (this.L.blockedTiles || []).forEach(add);
    if (g.main) {
      // nothing on the stairs either
      g.stairs.forEach((st) => [0, 1].forEach((k) => [-2, -1].forEach((dr) => add(this.tileOf(st.x0 + k * T + T / 2, g.yb + dr * T + T / 2)))));
    }
    if (this.deskSpot) [0, 1].forEach((k) => add({ c: this.deskSpot.c + k, r: this.deskSpot.r }));
    return set;
  }

  canPlace(item, ignore) {
    const { w, h } = footprint(item);
    if (item.c < 0 || item.r < 0 || item.c + w > this.g.fw || item.r + h > this.g.fd) return false;
    const reserved = this.reservedTiles();
    for (let c = item.c; c < item.c + w; c++) for (let r = item.r; r < item.r + h; r++) if (reserved.has(`${c},${r}`)) return false;
    return !this.items.some((o) => {
      if (o === ignore) return false;
      const f = footprint(o);
      return item.c < o.c + f.w && o.c < item.c + w && item.r < o.r + f.h && o.r < item.r + h;
    });
  }

  // (Re)create sprites and collision for the room's items.
  placeItems() {
    this.itemSprites.forEach((sp) => sp.destroy());
    this.blocks = this.blocks.filter((b) => !b.item);
    const { g } = this;
    this.itemSprites = this.items.map((it) => {
      const { w, h } = footprint(it);
      const x = g.xL + it.c * T;
      const y = g.y0 + (it.r + h) * T;
      this.blocks.push({ item: true, x0: x + 4, x1: x + w * T - 4, y0: y - h * T + 2, y1: y - 8 });
      const key = this.itemKey(it.type, it.rot);
      const sp = this.add.image(x + (w * T) / 2, y, key).setOrigin(0.5, 1).setDepth(y - 1);
      return sp;
    });
  }

  enterBuild() {
    this.endTalk();
    this.bubble.setVisible(false);
    this.interactBtn.classList.add('hidden');
    this.stick.classList.remove('active');
    this.dragging = false;
    this.browse();
  }

  browse() {
    this.mode = 'browse';
    this.selected = null;
    this.clearGhost();
    hideBar();
    this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
    openToolkit({
      icon: (type) => this.textures.get(this.itemKey(type, 0)).getSourceImage().toDataURL(),
      canAfford,
      level: () => officeLevel(),
      onPick: (type) => {
        if (itemLevel(type) > officeLevel()) return this.toast(`Unlocks at Curator’s Office level ${itemLevel(type)}`);
        const max = type === 'closet' ? Math.min(ITEMS.closet.max, perks().janitors) : ITEMS[type].max;
        if (max && countPlaced(type, this.rooms.length) >= max) return this.toast(`Only ${max} allowed in the museum`);
        if (!canAfford(ITEMS[type].price)) return this.toast(`Need ${(ITEMS[type].price - coins()).toLocaleString()} more gold`);
        this.startPlacing({ type, rot: 0 });
      },
      onDone: () => this.exitBuild(),
    });
  }

  exitBuild() {
    this.mode = null;
    this.selected = null;
    this.clearGhost();
    hideToolkit();
    hideBar();
    this.overlay.clear();
    this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
  }

  clearGhost() {
    this.ghostSprite?.destroy();
    this.ghostSprite = null;
    this.ghost = null;
  }

  // Start placing an item (new, or moved: `orig` is put back on cancel).
  startPlacing(item, orig) {
    hideToolkit();
    this.mode = 'place';
    const { w, h } = footprint(item);
    const view = this.cameras.main.worldView;
    const at = this.tileOf(view.centerX, view.centerY - view.height * 0.1);
    this.ghost = {
      ...item,
      c: item.c ?? Phaser.Math.Clamp(at.c, 0, this.g.fw - w),
      r: item.r ?? Phaser.Math.Clamp(at.r, 0, this.g.fd - h),
      orig,
    };
    this.ghostSprite = this.add.image(0, 0, this.itemKey(item.type, item.rot)).setOrigin(0.5, 1).setDepth(6001).setAlpha(0.85);
    this.cameras.main.startFollow(this.ghostSprite, true, 0.2, 0.2);
    this.refreshGhost();
  }

  dragGhost(dx, dy) {
    const k = this.scale.gameSize.width / this.game.canvas.getBoundingClientRect().width / this.cameras.main.zoom;
    const { w, h } = footprint(this.ghost);
    const c = Phaser.Math.Clamp(this.ghostDrag.c + Math.round((dx * k) / T), 0, this.g.fw - w);
    const r = Phaser.Math.Clamp(this.ghostDrag.r + Math.round((dy * k) / T), 0, this.g.fd - h);
    if (c !== this.ghost.c || r !== this.ghost.r) {
      this.ghost.c = c;
      this.ghost.r = r;
      this.refreshGhost();
    }
  }

  refreshGhost() {
    const gh = this.ghost;
    const def = ITEMS[gh.type];
    const { w, h } = footprint(gh);
    this.ghostSprite.setTexture(this.itemKey(gh.type, gh.rot));
    this.ghostSprite.setPosition(this.g.xL + (gh.c + w / 2) * T, this.g.y0 + (gh.r + h) * T);
    const ok = this.canPlace(gh);
    const cost = gh.orig ? 0 : def.price;
    const buttons = [];
    if (def.rotatable) buttons.push({ label: 'Rotate', onClick: () => this.rotateGhost() });
    buttons.push({ label: 'Cancel', onClick: () => this.cancelPlacing() });
    buttons.push({ label: 'Place', primary: true, disabled: !ok, onClick: () => this.confirmPlacing() });
    const price = cost ? `${cost} gold · ` : '';
    showBar(def.name, ok ? `${price}+${def.income}/hr · drag to move` : 'Blocked here · drag to move', buttons);
  }

  rotateGhost() {
    this.ghost.rot = this.ghost.rot ? 0 : 1;
    const { w, h } = footprint(this.ghost);
    this.ghost.c = Math.min(this.ghost.c, this.g.fw - w);
    this.ghost.r = Math.min(this.ghost.r, this.g.fd - h);
    this.refreshGhost();
  }

  cancelPlacing() {
    if (this.ghost?.orig) {
      this.items.push(this.ghost.orig);
      this.placeItems();
    }
    this.browse();
  }

  confirmPlacing() {
    const { type, c, r, rot, orig } = this.ghost;
    if (!orig) {
      if (!spend(ITEMS[type].price)) return this.toast('Not enough gold');
      this.settleAll();
    }
    this.items.push({ type, c, r, rot });
    sfx('place');
    saveItems(this.roomIndex, this.items);
    this.placeItems();
    if (ITEMS[type].cat === 'services') this.refreshStaff();
    this.updateHud();
    this.browse();
  }

  // Tap an item in the room (while the toolkit is open) to move, rotate or remove it.
  tapItem(wx, wy) {
    const hit = [...this.items].reverse().find((it, i) => {
      const sp = this.itemSprites[this.items.length - 1 - i];
      return sp && sp.getBounds().contains(wx, wy);
    });
    if (!hit) return;
    this.mode = 'edit';
    this.selected = hit;
    hideToolkit();
    const def = ITEMS[hit.type];
    const rotated = { ...hit, rot: hit.rot ? 0 : 1 };
    showBar(def.name, `+${def.income}/hr`, [
      {
        label: 'Move',
        onClick: () => {
          this.items = this.items.filter((o) => o !== hit);
          this.placeItems();
          this.startPlacing({ ...hit }, hit);
        },
      },
      ...(def.rotatable
        ? [{ label: 'Rotate', disabled: !this.canPlace(rotated, hit), onClick: () => this.updateItem(hit, rotated) }]
        : []),
      {
        label: `Sell +${sellPrice(hit.type)}`,
        onClick: () => {
          this.settleAll();
          addCoins(sellPrice(hit.type));
          sfx('sell');
          this.toast(`Sold for ${sellPrice(hit.type)} gold`);
          this.updateItem(hit, null);
        },
      },
      { label: 'Back', primary: true, onClick: () => this.browse() },
    ]);
  }

  updateItem(item, replacement) {
    this.items = this.items.filter((o) => o !== item);
    if (replacement) this.items.push(replacement);
    saveItems(this.roomIndex, this.items);
    this.placeItems();
    if (ITEMS[item.type].cat === 'services') this.refreshStaff();
    this.updateHud();
    this.browse();
  }

  // Grid over the floor plus the footprint of the item being placed or edited.
  drawOverlay() {
    const o = this.overlay;
    const { g } = this;
    o.clear();
    o.fillStyle(0xffffff, 0.12);
    if (g.main) {
      const off = new Set((this.L.blockedTiles || []).map((t) => `${t.c},${t.r}`));
      for (let c = 0; c < g.fw; c++) {
        for (let r = 0; r < g.fd; r++) {
          if (off.has(`${c},${r}`)) continue;
          o.fillRect(g.xL + c * T, g.y0 + r * T, T, 1);
          o.fillRect(g.xL + c * T, g.y0 + r * T, 1, T);
        }
      }
    } else {
      for (let c = 0; c <= g.fw; c++) o.fillRect(g.xL + c * T, g.y0, 1, g.y1 - g.y0);
      for (let r = 0; r <= g.fd; r++) o.fillRect(g.xL, g.y0 + r * T, g.xR - g.xL, 1);
    }
    const mark = (it, color) => {
      const { w, h } = footprint(it);
      o.fillStyle(color, 0.35);
      o.fillRect(g.xL + it.c * T, g.y0 + it.r * T, w * T, h * T);
      o.lineStyle(2, color, 0.9);
      o.strokeRect(g.xL + it.c * T, g.y0 + it.r * T, w * T, h * T);
    };
    if (this.mode === 'place' && this.ghost) mark(this.ghost, this.canPlace(this.ghost) ? 0x4fd06a : 0xe0503c);
    if (this.mode === 'edit' && this.selected) mark(this.selected, 0xe8c867);
  }

  update(_, dtMs) {
    const dt = Math.min(dtMs, 50) / 1000;
    this.npcs.forEach((n) => {
      this.updateVisitor(n, dt);
      this.animate(n.s, !!n.target && !n.talking, dt);
      n.s.setDepth(n.s.y);
      n.mop?.setPosition(n.s.x + 12, n.s.y).setDepth(n.s.y - 1);
    });
    if (this.mode) return this.drawOverlay(); // toolkit open: no walking
    if (!this.input.enabled) return; // a panel is open

    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    if (!vx && !vy && this.dragging && this.dragVec) ({ x: vx, y: vy } = this.dragVec);

    const len = Math.hypot(vx, vy);
    if (len > 0) {
      const b = this.bounds();
      const nx = Phaser.Math.Clamp(this.player.x + (vx / len) * SPEED * dt, b.x0, b.x1);
      const ny = Phaser.Math.Clamp(this.player.y + (vy / len) * SPEED * dt, b.y0, b.y1);
      const free = (x, y, ox, oy) => !this.blocked(x, y) && (!this.hitsVisitor(x, y) || this.hitsVisitor(ox, oy));
      // (if already stuck inside something, e.g. a new item, let the player walk out)
      if (free(nx, this.player.y, this.player.x, this.player.y) || this.blocked(this.player.x, this.player.y)) this.player.x = nx;
      if (free(this.player.x, ny, this.player.x, this.player.y)) this.player.y = ny;
      // Bumped into someone head-on: slide around them instead of stopping dead.
      const ahead = this.visitorAt(nx, ny);
      if (ahead && !this.hitsVisitor(this.player.x, this.player.y)) {
        const step = SPEED * dt;
        const b2 = this.bounds();
        if (Math.abs(vy) >= Math.abs(vx)) {
          const dir = Math.sign(this.player.x - ahead.s.x) || (this.player.x < (b2.x0 + b2.x1) / 2 ? 1 : -1);
          const sx = Phaser.Math.Clamp(this.player.x + dir * step, b2.x0, b2.x1);
          if (free(sx, this.player.y, this.player.x, this.player.y)) this.player.x = sx;
        } else {
          const dir = Math.sign(this.player.y - ahead.s.y) || 1;
          const sy = Phaser.Math.Clamp(this.player.y + dir * step, b2.y0, b2.y1);
          if (free(this.player.x, sy, this.player.x, this.player.y)) this.player.y = sy;
        }
      }
      this.faceSprite(this.player, 'player', vx, vy);
    }
    this.animate(this.player, len > 0, dt);
    this.player.setDepth(this.player.y);
    this.checkArches();

    if (this.talkingTo && (!talking() || Math.hypot(this.player.x - this.talkingTo.s.x, this.player.y - this.talkingTo.s.y) > 60)) {
      this.endTalk();
    }

    const prev = this.focus?.icon;
    this.focus = this.findFocus();
    this.bubble.setVisible(!!this.focus);
    this.interactBtn.classList.toggle('hidden', !this.focus);
    if (this.focus && this.focus.icon !== prev) this.interactIcon.innerHTML = iconSvg(this.focus.icon);
    if (this.focus) this.bubble.setPosition(Math.round(this.player.x), Math.round(this.player.y - 36));
    if (this.focus && (Phaser.Input.Keyboard.JustDown(k.SPACE) || Phaser.Input.Keyboard.JustDown(k.ENTER))) this.interact();
  }
}
