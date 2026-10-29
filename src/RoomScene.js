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
  bakeShapedWalls,
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
  makeEmotes,
  DEFAULT_DECOR,
  NEW_ROOM_DECOR,
  baseDecor,
  LIGHT_TINTS,
} from './art.js';
import { setTrack, sfx, setAmbience } from './music.js';
import { weatherToday, season, holiday, stormRumble, crowdShift } from './weather.js';
import { ORIENT_LABELS, SIZE_LABELS, BREAK, roomAt, MAIN_HALL_PRICE, ATRIUM_PRICE, isFixed, seedEntry, loadRooms, addRoom, resetRooms, updateRoom, swapRooms, roomName, layout, paintingsFor, slotStates, setSlot, hungAnywhere, placeArt, wallItems, plantSpots, carpetRect } from './rooms.js';
import { openSlotMenu } from './slotmenu.js';
import { applyPreset, presetCost } from './presets.js';
import { ITEMS, loadItems, saveItems, resetItems, footprint, countPlaced } from './items.js';
import { COLUMNS, DEFAULT_COLUMN } from './columns.js';
import { roomDirt, removeDirt, resetDirt, dirtCount, covered, janitors, janitorCost, hireJanitor, resetJanitors, guides, guideBoost, maxGuides, guideCost, hireGuide, upgradeLevel, upgradeValue, upgradeCost, buyUpgrade, hasCarpenter, hireCarpenter, CARPENTER_COST, staffCount } from './staff.js';
import { openStaffMenu } from './staffmenu.js';
import { UPGRADES, OFFLINE_CAP_H, COLLECT_ALL_FEE } from './economy.js';
import { hasCameras, buyCameras, resetSecurity, CAMERA_COST, trackSeen, maybeRob, awayFor, nextSecurity, securityTier } from './security.js';
import { officeLevel, setOfficeLevel, resetOffice, perks, itemLevel, LEVELS, MAX_LEVEL } from './office.js';
import { openOffice } from './officemenu.js';
import { ask } from './ask.js';
import { remember } from './regulars.js';
import { converse, giftStatus, recordGift } from './chatter.js';
import { say } from './ui/toast.js';
import { runDialogue } from './dialogue.js';
import { progression } from './progression/index.js';
import { list as listEntries } from './collections/index.js';
import { collect as collectEntry } from './collections/codex.js';
import { load as loadStore, save as saveStore } from './storage.js';
import { heistBeat, chainStep, chainAsk, complete as completeBeat } from './story.js';
import { PAINTINGS } from './paintings.js';
import { roomRating, museumRating, starText } from './rating.js';
import { FAMOUS, meet, resetMet, metList, famousBoost } from './famous.js';
import { FREE, coins, canAfford, addCoins, spend, resetWallet, museumIncome, museumVisitors, coffeeIncome, serviceGold, roomIncome, settle, sellPrice, artPile, decorPile, collectArt, collectDecor, collectAll, pile, pileFull } from './wallet.js';
import { openToolkit, hideToolkit, showBar, hideBar } from './toolkit.js';
import { artBounds, paintArt, wallRef } from './walldraw.js';
import { PERSONALITIES, lineFor, QUIPS, CONTEXT } from './lines.js';
import { iconSvg } from './icons.js';
import { bakeFountain, bakeSideStairs, FOUNTAIN } from './atrium.js';
import { openViewer } from './viewer.js';
import { isFixture, newId, clear as clearDisplay, missingFor } from './display.js';
import { showDisplays } from './displayart.js';
import { openDisplay } from './displaymenu.js';
import { openDecor, closeDecor, load, save, DEFAULT_CHARACTER } from './decor.js';
import { openBuild } from './build.js';
import { showTalk, hideTalk, talking, followSpeaker } from './talk.js';
import { Lighting, timeOfDay, makeTextures as lightTextures } from './lighting.js';
import { animateWalker, footstep, dust } from './motion.js';
import { Pet, PET_COLORS } from './pets.js';
import { openSettings, closeSettings } from './settingsmenu.js';
import { openIncome } from './incomemenu.js';
import { openJournal } from './journal.js';
import { markSeen, collectEverything as collectOneOfEach } from './collections/codex.js';
import { activeQuests, claim, bump, stat, resetQuests } from './quests.js';
import { celebrate } from './ui.js';
import { shortNum } from './ui/num.js';
import { addLove, loveOf, resetLove } from './love.js';
import { hasCameras as camerasOn } from './security.js';
import { hourNow, settings } from './settings.js';
import { spriteUrl } from './swap.js';

const VIEW_TILES = 9; // the camera always shows 9 tiles across
const SPEED = 176; // px per second
const NPC_SPEED = 70;
const NPC_SLOW = 0.35; // visitors slow down near the player so they're easy to talk to
const BODY = { w: 7, h: 5 }; // half-size of a character's feet, for bumping
const PLAYER_SCALE = 1.15;
const REACH = 26; // how close you need to be to interact
const TALK_LEAVE = 64; // walk this far from someone and the talk (bubble or conversation) ends
const HD = 4; // resolution multiplier for paintings on the wall

const DECOR_KEY = 'curation.roomDecor'; // { [roomIndex]: decor }
// The curator's chosen hat, facial hair and glasses.
const lookOf = (ch) => ({
  hat: ch.hat && ch.hat !== 'none' ? ch.hat : null,
  facial: ch.facial,
  glasses: ch.glasses && ch.glasses !== 'none' ? ch.glasses : null,
  hair: ch.hair === 'bald' ? null : ch.hair,
  bald: ch.hair === 'bald',
  outfit: ch.outfit,
  acc: ch.acc,
  freckles: !!ch.freckles,
  blush: !!ch.blush,
  earrings: !!ch.earrings,
  build: ch.build,
  legs: ch.legs,
  feet: ch.feet,
  second: !!ch.u, // the outfit's optional second color (outfitAccent in people/parts.js)
});
const TUTORIAL_KEY = 'curation.tutorial'; // how far the first-time walkthrough has got
const BREAK_SEEDED_KEY = 'curation.breakSeeded';
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
  student: ['#3d6fb6', '#c0392b', '#4f7a3a', '#6a4c93', '#e0a030', '#2e7d7a'],
  elder: ['#8a6a8a', '#6a7a5a', '#a07050', '#5a6a8a', '#c8b090'],
  barista: ['#2f5d46'],
  caretaker: ['#7a5a3a'],
  guard: ['#1e1e22'],
  guide: ['#c0392b'],
  carpenter: ['#e8762c'],
  janitor: ['#4a5f80'],
};

export function visitorLook(kind, r) {
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
  if (kind === 'guide') {
    colors.c = '#c0392b'; // red blazer
    colors.p = '#2f2b3d';
  }
  if (kind === 'carpenter') {
    look.hat = 'hardhat';
    colors.T = '#f2c53d';
    colors.U = '#c99a1a';
    colors.c = '#e8762c'; // safety orange
    colors.p = '#3c4a63';
  }
  // seasonal visitors: kids trick-or-treat in costume near Halloween, and woolly hats come out in winter
  const day = holiday();
  if (day === 'halloween' && (kind === 'kid' || (kind === 'student' && r(20) < 0.3))) {
    const costume = Math.floor(r(21) * 3);
    look.hat = costume === 2 ? 'beanie' : 'top';
    if (costume === 0) Object.assign(colors, { c: '#3a2a52', p: '#2a1e3a', T: '#2a1a3a', U: '#6a3a9a' }); // witch
    else if (costume === 1) Object.assign(colors, { c: '#f4f4f4', p: '#e0e0e8', T: '#f4f4f4', U: '#c8c8d8' }); // ghost
    else Object.assign(colors, { c: '#e8762c', p: '#6a4a1a', T: '#e8762c', U: '#4f8a4a' }); // pumpkin
  } else if (day === 'winter' && !['barista', 'caretaker', 'guard', 'guide', 'carpenter', 'janitor'].includes(kind) && !look.hat && !look.bald && r(22) < 0.5) {
    look.hat = 'beanie';
    colors.T = pick(['#c0392b', '#2e5a8a', '#f4f0e6', '#2e7d7a'], 23);
    colors.U = '#f4f0e6';
  }
  if (kind === 'guard') {
    colors.c = '#1e1e22';
    colors.p = '#1e1e22';
    colors.h = '#1e1410';
    look.glasses = 'shades';
    look.earpiece = true;
  }
  if (kind === 'caretaker') {
    colors.h = '#d8d8d8';
    look.glasses = true;
    colors.p = '#3a3028';
  }
  // Hair, clothes and accessories that fit each kind of visitor.
  const any = (arr, k) => pick(arr, 20 + k);
  const STYLE = {
    casual: { hair: ['short', 'part', 'curly', 'long', 'ponytail', 'bun', 'buzz', 'afro'], outfit: ['tee', 'hoodie', 'sweater', 'tee', 'dress'] },
    kid: { hair: ['short', 'pigtails', 'ponytail', 'curly', 'bob'], outfit: ['tee', 'hoodie', 'dress', 'tee'] },
    grump: { hair: ['short', 'buzz', 'part'], outfit: ['sweater', 'coat', 'vest'] },
    nerd: { hair: ['part', 'curly', 'short', 'bun'], outfit: ['sweater', 'vest'], acc: ['bag', 'none', 'none'] },
    snob: { hair: ['part', 'long', 'bun', 'short'], outfit: ['suit', 'coat', 'gown', 'suit'], acc: ['bowtie', 'necklace', 'none'] },
    tourist: { hair: ['short', 'ponytail', 'curly', 'long'], outfit: ['tee', 'tee', 'hoodie'], acc: ['camera', 'camera', 'bag'] },
    fanboy: { hair: ['short', 'curly', 'afro', 'ponytail'], outfit: ['hoodie', 'tee'], acc: ['bag', 'none', 'none'] },
    artist: { hair: ['bun', 'curly', 'long', 'wild', 'ponytail'], outfit: ['apron', 'apron', 'sweater'], acc: ['scarf', 'none'] },
    influencer: { hair: ['long', 'bob', 'ponytail', 'part'], outfit: ['dress', 'tee', 'sweater', 'gown'], acc: ['necklace', 'none'] },
    couple: { hair: ['short', 'long', 'bun', 'part', 'curly'], outfit: ['suit', 'dress', 'sweater', 'vest'] },
    historian: { hair: ['part', 'short', 'bun'], outfit: ['vest', 'coat'], acc: ['bowtie', 'scarf', 'none'] },
    student: { hair: ['short', 'curly', 'ponytail', 'afro', 'bun', 'buzz'], outfit: ['hoodie', 'tee', 'sweater'], acc: ['bag', 'bag', 'none'] },
    elder: { hair: ['bun', 'short', 'part', 'curly'], outfit: ['sweater', 'coat', 'dress', 'vest'], acc: ['scarf', 'none', 'necklace'] },
    teacher: { hair: ['bun', 'part', 'short', 'curly'], outfit: ['sweater', 'vest', 'coat'], acc: ['bag', 'badge'] },
  }[kind];
  if (STYLE) {
    if (!look.bald) look.hair = any(STYLE.hair, 1);
    look.outfit = any(STYLE.outfit, 2);
    if (STYLE.acc) look.acc = any(STYLE.acc, 3);
    colors.w = any(['#efe6d4', '#ffffff', '#cfe0f0', '#f4e0a0'], 4);
    colors.g = any(['#c9a23f', '#b0413e', '#2e4a7a', '#e8e2d4', '#4f7a3a'], 5);
    colors.X = any(['#c0392b', '#2e7d7a', '#c9a23f', '#3d6fb6', '#e8e2d4'], 6);
  }
  if (kind === 'elder') {
    colors.h = pick(['#c8c8c8', '#e8e8e8', '#9a9a9a'], 2);
    look.glasses = r(10) < 0.5;
  }
  if (kind === 'artist') colors.g = pick(['#e8e2d4', '#c8b088', '#7a9ab0'], 13); // a paint-spattered smock
  if (kind === 'barista') {
    look.outfit = 'apron';
    colors.c = '#efe6d4';
    colors.g = '#2f5d46';
  }
  if (kind === 'caretaker') look.outfit = 'vest';
  if (kind === 'teacher') look.glasses = r(10) < 0.6;
  if (kind === 'janitor' || kind === 'carpenter') look.outfit = 'tee';
  return { colors, look, scale };
}

// Which emotes each kind of person tends to show.
const EMOTES = {
  fanboy: ['heart', 'star', 'heart'],
  kid: ['bang', 'q', 'heart', 'star'],
  grump: ['zzz', 'q', 'zzz'],
  snob: ['q', 'zzz', 'star'],
  nerd: ['bang', 'star', 'q'],
  casual: ['heart', 'note', 'star'],
  tourist: ['bang', 'star', 'heart'],
  artist: ['heart', 'star', 'bang'],
  influencer: ['star', 'heart', 'note'],
  couple: ['heart', 'heart', 'note'],
  historian: ['bang', 'q', 'star'],
  student: ['q', 'bang', 'zzz', 'note'],
  elder: ['heart', 'note', 'heart'],
  famous: ['star', 'heart', 'bang', 'note'],
};
const PHONE_KINDS = ['influencer', 'kid', 'casual', 'student', 'fanboy', 'tourist'];
const SEATS = ['stool', 'bench', 'sofa'];
export const KINDS = Object.keys(PERSONALITIES).filter((k) => !PERSONALITIES[k].staff);

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
    this.room = roomAt(this.rooms, this.roomIndex);
    this.isBreak = this.roomIndex === BREAK;
    if (this.isBreak) this.seedBreakRoom();
    this.L = layout(this.room);
    this.states = slotStates(this.rooms, this.roomIndex);
    this.hung = paintingsFor(this.rooms, this.roomIndex).map(placeArt);
    markSeen(this.hung.map((p) => p.entry.id)); // the codex stamps each painting the first time it hangs
    // furniture sprites from the free art packs (see docs/ASSETS.md)
    const sprites = new Set((this.L.props || []).map((q) => q.s));
    if ((this.L.props || []).some((q) => q.flames)) [0, 1, 2, 3].forEach((f) => sprites.add(`flame_${f}`));
    sprites.forEach((s) => this.textures.exists(`lpc_${s}`) || this.load.image(`lpc_${s}`, spriteUrl(s, `sprites/lpc/${s}.png`)));
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
    makeCharacter(this, 'player', this.character, lookOf(this.character));

    if (!this.textures.exists('bubble')) {
      Object.keys(PLANTS).forEach((k) => k !== 'none' && bakePlant(this, `plant_${k}`, k));
      makeBubble(this);
      makeEmotes(this);
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
    if (!g.main && !g.shaped) this.add.image(0, g.y1, bakeFront(this, 'front', g.w, entrance.mat ? entrance.x0 : -1, entrance.mat ? entrance.x1 : -1).key).setOrigin(0);
    if (exit?.sprite) this.add.image(exit.sprite.x, exit.sprite.y, exit.sprite.key).setOrigin(0).setFlipX(exit.sprite.flip).setDepth(2);
    this.hung.forEach((p) => this.drawPainting(p));
    this.blocks = exit?.block ? [exit.block] : [];
    this.keepClear = this.doorZones();
    this.archTop();
    if (g.main) this.placeHall();
    if (g.atrium) this.placeAtrium();
    if (g.shaped) this.placeShaped();
    this.decorObjects = [];
    this.placeDecor();
    if (this.L.board) this.placeBoard();
    this.deskSpot = this.L.desk ? { ...this.L.desk } : this.roomIndex === 0 ? this.findDeskSpot() : null;
    if (this.deskSpot) this.placeDesk();
    this.pileTile = this.findPileTile();
    // The decor pad: a green square near the entrance where decor earnings pile up.
    const pad = this.tileCenter(this.pileTile);
    this.padGfx = this.add.graphics().setDepth(0.6);
    this.padGfx.fillStyle(0x3f8f4a, 0.55).fillRect(pad.x - 13, pad.y - 13, 26, 26);
    this.padGfx.lineStyle(2, 0x6fd07a, 0.9).strokeRect(pad.x - 13, pad.y - 13, 26, 26);
    this.pileSprite = this.add.image(0, 0, 'coins_1').setOrigin(0.5, 1).setVisible(false);
    // Coins in front of each painting: that painting's earnings.
    this.artSpots = this.hung.map((p) => {
      const st = this.standFor(p);
      return { p, x: st.x, y: st.y + 6, sprite: this.add.image(st.x, st.y + 6, 'coins_1').setOrigin(0.5, 1).setScale(0.7).setVisible(false) };
    });
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
    this.displayObjs = [];
    this.placeItems();
    this.overlay = this.add.graphics().setDepth(6000);
    this.mode = null; // toolkit: null | 'browse' | 'place' | 'edit'

    this.mess = [];
    if (this.roomIndex === 0) this.spawnMess();

    const start = this.spawnPoint();
    this.player = this.add.sprite(start.x, start.y, start.face).setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    this.makePet();
    const rhythm = settings().dayNight ? crowdShift(hourNow(), weatherToday()) : 0; // quiet mornings, a busy afternoon
    const count = this.isBreak ? 0 : Math.max(2, Math.min(6, 3 + Math.floor(this.L.slots.length / 6) + rhythm)); // the break room is staff only
    this.npcs = Array.from({ length: count }, (_, i) => this.spawnVisitor(i));
    this.pairCouples();
    if (!this.isBreak && this.roomIndex >= 1 && Math.random() < 0.3) this.spawnSchoolTrip();
    this.spawnStaff();
    if (this.g.main) this.spawnFamous();
    this.refreshDirt();
    this.bubble = this.add.image(0, 0, 'bubble').setOrigin(0.5, 1).setDepth(5000).setVisible(false);
    this.lighting = new Lighting(this);
    setAmbience(weatherToday() === 'rain' && !this.isBreak ? ['rainSoft'] : []); // rain on the roof
    if (!this.isBreak) stormRumble(this, weatherToday());
    this.time.addEvent({ delay: 60000, loop: true, callback: () => this.lighting.build() }); // the sun moves

    this.setupCamera();
    this.setupInput();
    this.setupButtons();
    this.updateHud();
    this.updatePile();
    this.pileTimer = this.time.addEvent({ delay: 1000, loop: true, callback: () => this.updatePile() });
    this.tutorial();
    if (!RoomScene.opened) {
      RoomScene.opened = true;
      const away = awayFor();
      const stolen = maybeRob(this.rooms, /[?&]rob\b/.test(location.search));
      trackSeen();
      if (away > 20 * 60000 && !stolen) this.time.delayedCall(900, () => this.welcomeBack());
      if (stolen?.caught) {
        this.time.delayedCall(900, () => {
          addCoins(stolen.bounty);
          sfx('coin');
          this.toast(`Your security caught a thief overnight! Reward: ${stolen.bounty} gold`);
        });
      } else if (stolen) {
        this.time.delayedCall(700, () => {
          this.pause(true);
          sfx('nope');
          ask('You were robbed!', `While you were away, a thief made off with “${stolen.title}” by ${stolen.by}. It’s back in the collection: hang it again from any empty wall spot. Security cameras would stop this (ask the guard).`, 'OK', () => this.pause(false), null);
        });
        if (stolen.room === this.roomIndex) this.time.delayedCall(800, () => this.rebuild());
      }
    }
    this.dirtTimer = this.time.addEvent({ delay: 30000, loop: true, callback: () => this.refreshDirt() });
    const onCoins = () => this.updateHud();
    window.addEventListener('coins', onCoins);
    this.events.once('shutdown', () => window.removeEventListener('coins', onCoins));
    if (!this.instant) {
      const cam = this.cameras.main;
      const zoom = cam.zoom;
      cam.setZoom(zoom * 1.05).zoomTo(zoom, 320, 'Sine.easeOut');
      cam.fadeIn(250, 29, 21, 18);
    }
    this.archLock = true; // don't bounce straight back through the doorway we arrived by
    if (typeof this.spawnAt !== 'object') this.toast(this.isBreak ? 'Break room · staff only' : `${roomName(this.room, this.roomIndex)} · ${starText(roomRating(this.rooms, this.roomIndex).stars)}`);
  }

  // The curator's pet, if they have one.
  makePet() {
    this.pet?.s.destroy();
    this.pet = null;
    const kind = this.character.pet;
    this.petColor = this.character.petColor;
    if (kind && kind !== 'none') this.pet = new Pet(this, kind, this.character.petColor, this.player);
  }

  spawnPoint() {
    const { g, exit, entrance } = this.L;
    if (typeof this.spawnAt === 'object') {
      const b = this.bounds();
      return { ...this.spawnAt, x: Phaser.Math.Clamp(this.spawnAt.x, b.x0, b.x1), y: Phaser.Math.Clamp(this.spawnAt.y, b.y0, b.y1) };
    }
    if (this.spawnAt === 'exit' && exit) return { x: exit.ax, y: exit.ay + 14, face: 'player_down' };
    if (this.spawnAt === 'breakdoor') {
      // back out of the break room: in front of its door in the hallway
      const d = this.L.decorDoors.find((dd) => dd.label === 'Break room');
      const st = this.standFor({ wall: d.wall, u: (d.rect.u0 + d.rect.u1) / 2 });
      return { x: st.x + 10, y: st.y, face: 'player_side' };
    }
    if (this.spawnAt === 'outside') return { x: entrance.ax, y: g.y1 - 18, face: 'player_up' }; // back in from the island
    if (this.spawnAt === 'entrance' && !entrance.mat) return { x: entrance.ax + 6, y: entrance.ay + 4, face: 'player_side' };
    if (this.spawnAt === 'entrance') return { x: entrance.ax, y: g.y1 - 16, face: 'player_up' };
    return { x: entrance.ax, y: g.y1 - 24, face: 'player_up' };
  }

  // ---------- Paintings ----------

  // Draw the real painting onto the angled wall at higher resolution.
  bakeRoomWalls(decor) {
    return (this.g.main ? bakeMainWalls : this.g.shaped ? bakeShapedWalls : bakeWalls)(this, 'walls', this.g, this.wallItems, decor).key;
  }

  // This room's column design (Customize → Columns; see columns.js).
  columnStyle() {
    const id = this.decor?.column;
    return COLUMNS[id] ? id : DEFAULT_COLUMN;
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
    const style = this.columnStyle();
    bakeColumn(this, `hall_column_${style}`, colH, style, 34);
    g.columns.forEach((col) => {
      this.hallParts.push(this.add.image(col.x, col.foot, `hall_column_${style}`).setOrigin(0.5, 1).setDepth(col.foot));
      this.blocks.push({ hall: true, x0: col.x - 8, x1: col.x + 8, y0: col.foot - 9, y1: col.foot - 8 });
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

  // Atrium: columns against the back wall, a statue in front of each painting,
  // the waterfall fountain in the middle, the staircases up to the closed upper
  // floor, and name plaques over the archways.
  placeAtrium() {
    const { g } = this;
    (this.atriumParts || []).forEach((o) => o.destroy());
    this.atriumParts = [];
    this.blocks = this.blocks.filter((b) => !b.atrium);
    const parts = this.atriumParts;
    const block = (x0, x1, y0, y1) => this.blocks.push({ atrium: true, x0, x1, y0, y1 });
    const style = this.columnStyle();
    bakeColumn(this, `atrium_column_${style}`, g.D + 6, style, 34);
    g.columns.forEach((col) => {
      parts.push(this.add.image(col.x, col.foot, `atrium_column_${style}`).setOrigin(0.5, 1).setDepth(col.foot));
      block(col.x - 8, col.x + 8, col.foot - 12, col.foot - 8);
    });
    if (!this.textures.exists('atrium_statue')) bakeItem(this, 'atrium_statue', 'statue', ITEMS.statue, 0);
    g.statues.forEach((st) => {
      parts.push(this.add.image(st.x, st.y + 6, 'atrium_statue').setOrigin(0.5, 1).setDepth(st.y + 6));
      block(st.x - 12, st.x + 12, st.y - 12, st.y - 2);
    });
    // the fountain: four frames of falling water
    bakeFountain(this, 'atrium_fountain');
    const f = g.fountain;
    const fy = f.y - FOUNTAIN.cy + FOUNTAIN.h; // the sprite's bottom edge
    const fountain = this.add.image(f.x, fy, 'atrium_fountain_0').setOrigin(0.5, 1).setDepth(f.y + FOUNTAIN.ry);
    parts.push(fountain);
    let frame = 0;
    parts.push(this.time.addEvent({ delay: 160, loop: true, callback: () => fountain.setTexture(`atrium_fountain_${(frame = (frame + 1) % 4)}`) }));
    // the basin is round: block it as a stack of strips
    for (let k = -3; k <= 3; k++) {
      const yy = f.y + (k * FOUNTAIN.ry) / 3.2;
      const half = FOUNTAIN.rx * Math.sqrt(Math.max(0, 1 - (k / 3.4) ** 2));
      block(f.x - half + 4, f.x + half - 4, yy - FOUNTAIN.ry / 7, yy);
    }
    // the staircases along the front wall, climbing sideways toward the walls
    g.stairs.forEach((st, i) => {
      const run = st.x1 - st.x0;
      bakeSideStairs(this, `atrium_stairs_${i}`, run, st.foot - st.top, g.D, st.up, this.decor);
      parts.push(this.add.image(st.x0, st.foot, `atrium_stairs_${i}`).setOrigin(0, 1).setDepth(st.top + 4));
      block(st.x0 - 2, st.x1 + 2, st.top - 6, st.foot - 10);
    });
    // name plaques over the archways
    const plaque = (x, y, text) => {
      const t = this.add.text(x, y, text.toUpperCase(), { fontFamily: 'Georgia, serif', fontSize: '7px', color: '#3a2a10', backgroundColor: '#e8d49a', padding: { x: 3, y: 1 } }).setOrigin(0.5, 1).setResolution(4).setDepth(3);
      t.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
      parts.push(t);
    };
    const { exit } = this.L;
    plaque(exit.ax, g.y0 - exit.rect.v1 - 1, exit.label);
    this.L.decorDoors.forEach((d) => {
      const st = this.standFor({ wall: d.wall, u: (d.rect.u0 + d.rect.u1) / 2 });
      plaque(st.x + (d.wall === 'left' ? -8 : 8), st.y - d.rect.v1 - 4, d.label);
    });
  }

  // Shaped rooms (see shaped.js): what you can't walk through, stairs up each
  // drop with a railing along its edge, columns, the sunken pit, the
  // stairwell down, and daylight falling in from the windows.
  placeShaped() {
    const { g } = this;
    (this.shapedParts || []).forEach((o) => o.destroy());
    this.shapedParts = [];
    this.blocks = this.blocks.filter((b) => !b.shaped);
    const parts = this.shapedParts;
    const block = (x0, x1, y0, y1) => this.blocks.push({ shaped: true, x0, x1, y0, y1 });
    const { bands } = g;
    bakeColumn(this, 'hall_newel', 20);
    bakeHallStairs(this, 'hall_stairs', this.decor, 2 * T); // (baked once: re-baking a texture in use breaks it)
    bands.forEach((b, i) => {
      // outside the band on either side
      block(0, b.x0, b.top - 2, b.bottom - 8);
      block(b.x1, g.w, b.top - 2, b.bottom - 8);
      if (b.strip?.kind !== 'wall') return;
      const top = b.bottom - g.D;
      // a railing along the drop's edge, one run between each pair of stairs
      const edges = [b.x0, ...b.stairs.flatMap((st) => [st.x0, st.x1]), b.x1];
      for (let k = 0; k < edges.length; k += 2) {
        const [x0, x1] = [edges[k], edges[k + 1]];
        if (x1 - x0 < 4) continue;
        const key = `shaped_rail_${i}_${k}`;
        bakeRailing(this, key, x1 - x0);
        parts.push(this.add.image(x0, top + 8, key).setOrigin(0, 1).setDepth(top));
        block(x0, x1, top - 10, b.bottom - 8);
      }
      b.stairs.forEach((st) => {
        parts.push(this.add.image(st.x0, st.foot, 'hall_stairs').setOrigin(0, 1).setDepth(1));
        [st.x0 + 3, st.x1 - 3].forEach((x) => parts.push(this.add.image(x, st.foot + 2, 'hall_newel').setOrigin(0.5, 1).setDepth(st.foot + 2)));
        block(st.x0 - 3, st.x0 + 1, b.bottom - 8, st.foot - 14);
        block(st.x1 - 1, st.x1 + 3, b.bottom - 8, st.foot - 14);
      });
    });
    // columns
    const style = this.columnStyle();
    bakeColumn(this, `shaped_column_${style}`, 88, style, 32);
    g.columns.forEach((c) => {
      parts.push(this.add.image(c.x, c.y + 8, `shaped_column_${style}`).setOrigin(0.5, 1).setDepth(c.y + 8));
      block(c.x - 8, c.x + 8, c.y - 2, c.y);
    });
    // the sunken pit: its far wall, a stone floor below, railings round it
    if (g.pit) {
      const q = g.pit;
      const gfx = this.add.graphics().setDepth(0.6);
      parts.push(gfx);
      const depth = 22;
      gfx.fillStyle(0x6e675e, 1).fillRect(q.x0, q.y0, q.x1 - q.x0, depth); // the far wall, facing you
      gfx.fillStyle(0x857d72, 1).fillRect(q.x0, q.y0 + depth - 3, q.x1 - q.x0, 3);
      for (let y = q.y0 + depth; y < q.y1; y += 16)
        for (let x = q.x0; x < q.x1; x += 16) gfx.fillStyle(((x + y) / 16) % 2 ? 0x9a9184 : 0x8f877b, 1).fillRect(x, y, Math.min(16, q.x1 - x), Math.min(16, q.y1 - y));
      gfx.fillStyle(0x000000, 0.22).fillRect(q.x0, q.y0 + depth, 10, q.y1 - q.y0 - depth); // shade under the left rim
      gfx.fillStyle(0x000000, 0.3).fillRect(q.x0, q.y0 + depth, q.x1 - q.x0, 4);
      gfx.lineStyle(3, 0xd8d0c0, 1).strokeRect(q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0); // the rim
      const railKey = 'shaped_pitrail';
      bakeRailing(this, railKey, q.x1 - q.x0);
      ['back', 'front'].forEach((side) => {
        const key = railKey;
        const y = side === 'back' ? q.y0 + 2 : q.y1 + 2;
        parts.push(this.add.image(q.x0, y, key).setOrigin(0, 1).setDepth(y));
      });
      [q.x0, q.x1].forEach((x) => {
        for (let y = q.y0 + 10; y < q.y1; y += 12) parts.push(this.add.image(x, y + 4, 'hall_newel').setOrigin(0.5, 1).setDepth(y + 4).setScale(0.6, 0.7));
      });
      block(q.x0 - 4, q.x1 + 4, q.y0 - 6, q.y1 - 4);
    }
    // a stairwell going down: steps descending away from you into the dark
    if (g.stairwell) {
      const q = g.stairwell;
      const gfx = this.add.graphics().setDepth(0.6);
      parts.push(gfx);
      const steps = Math.floor((q.y1 - q.y0) / 8);
      for (let k = 0; k < steps; k++) {
        const y = q.y1 - (k + 1) * 8;
        const dark = 1 - k / steps;
        const col = Phaser.Display.Color.GetColor(Math.round(170 * dark + 20), Math.round(130 * dark + 16), Math.round(90 * dark + 12));
        gfx.fillStyle(col, 1).fillRect(q.x0, y, q.x1 - q.x0, 6);
        gfx.fillStyle(0x000000, 0.35).fillRect(q.x0, y + 6, q.x1 - q.x0, 2);
      }
      gfx.fillStyle(0x120c0a, 1).fillRect(q.x0, q.y0, q.x1 - q.x0, 6);
      gfx.lineStyle(3, 0xd8d0c0, 1).strokeRect(q.x0, q.y0, q.x1 - q.x0, q.y1 - q.y0);
      const key = `shaped_wellrail_${q.x1 - q.x0}`;
      bakeRailing(this, key, q.x1 - q.x0);
      parts.push(this.add.image(q.x0, q.y0 + 2, key).setOrigin(0, 1).setDepth(q.y0 + 2));
      [q.x0, q.x1].forEach((x) => {
        for (let y = q.y0 + 10; y < q.y1 - 4; y += 12) parts.push(this.add.image(x, y + 4, 'hall_newel').setOrigin(0.5, 1).setDepth(y + 4).setScale(0.6, 0.7));
      });
      block(q.x0 - 4, q.x1 + 4, q.y0 - 6, q.y1 - 6);
    }
    // furniture: each piece stands on its row, sorted by where it stands
    const night = timeOfDay(hourNow()) === 'night';
    (this.L.props || []).forEach((q) => {
      const img = this.add.image(q.px, q.py, `lpc_${q.s}`).setOrigin(0.5, 1).setFlipX(!!q.flip);
      img.setDepth(q.flat ? 0.56 : q.wall ? 2 : q.py + (q.lift ? 1 : 0));
      parts.push(img);
      if (q.block) {
        const [bw, bh] = q.block;
        block(q.px - (bw * T) / 2 + 4, q.px + (bw * T) / 2 - 4, q.py - bh * T + 4, q.py - 8);
      }
      if (q.flames) {
        const fx = q.px - img.width / 2 + q.flames.x + 16;
        const fire = this.add.image(fx, q.py - img.height + q.flames.y, 'lpc_flame_0').setOrigin(0.5, 1).setDepth(img.depth + 0.5); // sorted with its fireplace, so you can stand in front of it
        parts.push(fire);
        let f = 0;
        parts.push(this.time.addEvent({ delay: 140, loop: true, callback: () => fire.setTexture(`lpc_flame_${(f = (f + 1) % 4)}`) }));
      }
      if (q.glow) {
        lightTextures(this);
        const gy = q.flames ? q.py - 20 : q.py - img.height + 6;
        const glow = this.add.image(q.px, gy, 'lt_glow').setDisplaySize(q.flames ? (night ? 240 : 150) : 70, q.flames ? (night ? 170 : 110) : 60).setBlendMode(Phaser.BlendModes.ADD).setTint(q.glow).setAlpha(night ? 0.55 : 0.25).setDepth(5001);
        parts.push(glow);
        if (q.flames && night) {
          // the fire itself stays bright through the dark (a small warm glow right on it)
          const core = this.add.image(q.px - img.width / 2 + q.flames.x + 16, q.py - img.height + q.flames.y - 8, 'lt_glow').setDisplaySize(44, 30).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc060).setAlpha(0.9).setDepth(5001);
          parts.push(core);
        }
        if (q.flames) this.tweens.add({ targets: glow, alpha: { from: glow.alpha * 0.8, to: glow.alpha * 1.1 }, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      }
    });
    // daylight from the windows: a soft shaft falling onto the floor
    lightTextures(this);
    const light = timeOfDay(hourNow()) === 'night' ? 0.04 : 0.16;
    (this.L.windows || []).forEach((w) => {
      const r = g.refs[w.wall];
      if (r.face !== 'back') return;
      const cx = r.x + (w.rect.u0 + w.rect.u1) / 2;
      parts.push(this.add.image(cx, r.y - 4, 'lt_beam').setOrigin(0.5, 0).setDisplaySize(w.rect.u1 - w.rect.u0 + 18, 70).setBlendMode(Phaser.BlendModes.ADD).setTint(0xfff2d0).setAlpha(light).setDepth(0.7));
    });
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
    // a hired carpenter has already patched the cracks
    this.mess = this.messList().filter((m) => !cleaned.has(m.id) && !(m.kind === 'crack' && hasCarpenter()));
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
    this.checkQuests();

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

  spawnVisitor(i, forceKind) {
    const { g } = this;
    const seed = (this.isBreak ? 990 : this.roomIndex * 10) + i;
    const kind = forceKind || KINDS[Math.floor(hash(seed, 5, 50) * KINDS.length)];
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
    const speed = kind === 'elder' || kind === 'grump' ? 0.65 : kind === 'kid' ? 1.25 : 1;
    const n = { s, prefix, kind, speed, name: names[Math.floor(hash(seed, 6, 50) * names.length)], wait: 400 + Math.random() * 1500, target: null };
    // some visitors bring their dog (on a leash)
    if (!this.isBreak && ['casual', 'elder', 'tourist', 'couple', 'student'].includes(kind) && hash(seed, 30, 70) < 0.22) {
      const col = PET_COLORS.dog[Math.floor(hash(seed, 31, 70) * PET_COLORS.dog.length)];
      n.pet = new Pet(this, 'dog', col, s, { leash: true, gap: 6 });
    }
    // some visitors have a gift for you today: a star shows over their head now and then
    n.hasGift = !this.isBreak && hash(seed, 77, 99) < 0.4 && giftStatus(n.name, kind, { get: loadStore, set: saveStore }).giftOK;
    return n;
  }

  // A couple walks around together: the second one follows the first.
  pairCouples() {
    this.npcs
      .filter((n) => n.kind === 'couple' && !n.follow && !n.partner)
      .forEach((n, k) => {
        const v = this.spawnVisitor(40 + k, 'couple');
        v.s.setPosition(n.s.x - 14, n.s.y);
        v.follow = n;
        v.gap = 7;
        n.trail = [];
        n.partner = v;
        this.npcs.push(v);
      });
  }

  // The barista behind a coffee counter, and sometimes a janitor on their rounds.
  makeStaff(kind, seed, x, y) {
    const { colors, look, scale } = visitorLook(kind, (k) => hash(seed, k, 53));
    const prefix = `staff${seed}`;
    makeCharacter(this, prefix, colors, look);
    const names = PERSONALITIES[kind].names;
    const s = this.add.sprite(x, y, `${prefix}_down`).setOrigin(0.5, 1).setScale(scale);
    const n = { s, prefix, kind, staff: true, name: names[Math.floor(hash(seed, 6, 50) * names.length)], wait: 1000, target: null };
    this.npcs.push(n);
    return n;
  }

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
    // The janitor is rarely seen: now and then, mopping up the one puddle.
    if (covered(this.rooms, this.roomIndex) && Math.random() < 0.25) {
      let x = g.xL + T * 1.5;
      let y = g.y0 + T * 3;
      for (let tries = 0; tries < 20 && (this.blocked(x, y) || this.blocked(x + 22, y)); tries++) {
        x = g.xL + (Math.floor(Math.random() * (g.fw - 1)) + 0.5) * T;
        y = g.y0 + (1 + Math.floor(Math.random() * (g.fd - 2))) * T + T - 4;
      }
      const n = make('janitor', 800 + this.roomIndex, x, y);
      n.fixed = true;
      n.mop = this.add.image(x + 12, y, 'mop').setOrigin(0.5, 1);
      n.puddle = this.add.image(x + 24, y - 4, 'dirt_puddle').setDepth(1);
    }
    if (this.isBreak) this.spawnWorkers();
    // The carpenter works on the newest room you've built.
    const newest = this.rooms.length - 1;
    if (hasCarpenter() && !isFixed(this.rooms[newest]) && this.roomIndex === newest) {
      const x = g.xR - 1.5 * T;
      const y = g.y1 - 1.5 * T;
      make('carpenter', 960, x, y).fixed = true;
    }
    if (g.main && guides() > 0) this.spawnTour();
    // One security guard: by the main hall's middle arch, or by the entrance's
    // double doors while the main hall is still locked.
    const hallOpen = this.rooms[1] && !this.rooms[1].locked;
    if ((g.main || (this.roomIndex === 0 && !hallOpen)) && this.L.exit) {
      // (in the main hall he stands just in front of the column beside the arch)
      const gx = g.main ? this.L.exit.ax - 30 : this.L.exit.ax + 44;
      const gy = g.main ? g.yb + T + 16 : g.y0 + 14;
      const n = make('guard', 950, gx, gy);
      n.fixed = true;
    }
  }

  // Staff on their break: up to 6 of everyone you've hired.
  spawnWorkers() {
    const { g } = this;
    const kinds = [...Array(Math.min(janitors(), 6)).fill('janitor'), ...(hasCarpenter() ? ['carpenter'] : []), ...Array(guides()).fill('guide')].slice(0, 6);
    const spots = [[1.5, 2.5], [3.5, 3.6], [5.2, 3.2], [1.8, 4.6], [4.6, 4.8], [6.2, 2.2]];
    kinds.forEach((kind, k) => {
      const [c, r] = spots[k];
      const n = this.makeStaff(kind, 1100 + k, g.xL + c * T, g.y0 + r * T);
      n.wait = 2000 + k * 900; // they wander a little
    });
  }

  // Now and then a school trip: a teacher with a line of kids behind.
  spawnSchoolTrip() {
    const { g } = this;
    let x = g.xL + 2.5 * T;
    let y = g.y1 - 2.5 * T;
    for (let tries = 0; tries < 20 && this.blocked(x, y); tries++) {
      x = g.xL + (1 + Math.floor(Math.random() * (g.fw - 2)) + 0.5) * T;
      y = g.y0 + (2 + Math.floor(Math.random() * (g.fd - 3))) * T;
    }
    const teacher = this.makeStaff('teacher', 1300 + this.roomIndex, x, y);
    teacher.staff = false; // she looks at paintings like everyone else
    teacher.trail = [];
    teacher.leader = true;
    for (let k = 1; k <= 4; k++) {
      const kid = this.spawnVisitor(60 + k, 'kid');
      kid.s.setPosition(x, y + k * 6);
      kid.follow = teacher;
      kid.gap = k * 9;
      kid.pet?.destroy();
      kid.pet = null;
      this.npcs.push(kid);
    }
  }

  // A tour guide leading a short line of visitors around the main hall.
  spawnTour() {
    const { g } = this;
    const guide = this.makeStaff('guide', 1200, g.xL + 4.5 * T, g.yb + 4 * T);
    guide.trail = [];
    guide.leader = true;
    [1, 2].forEach((k) => {
      const v = this.spawnVisitor(20 + k);
      v.s.setPosition(guide.s.x - k * 18, guide.s.y);
      v.follow = guide;
      v.gap = k * 14;
      this.npcs.push(v);
    });
  }

  // A famous artist visiting the main hall, with a gold star over their head.
  spawnFamous() {
    Object.keys(FAMOUS).forEach((id, k) => this.spawnFamousOne(id, k)); // for now: all of them, all the time
  }

  spawnFamousOne(id, k) {
    const { g } = this;
    const def = FAMOUS[id];
    makeCharacter(this, `famous_${id}`, def.colors, def.look);
    // Spread across the hall floor in two staggered rows.
    const row = k % 2;
    let x = g.xL + (1.2 + Math.floor(k / 2) * 1.8 + row * 0.9) * T;
    let y = g.yb + (2.6 + row * 1.8) * T;
    for (let tries = 0; tries < 20 && this.blocked(x, y); tries++) {
      x = g.xL + (1 + Math.floor(Math.random() * (g.fw - 2)) + 0.5) * T;
      y = g.yb + (2 + Math.floor(Math.random() * 3)) * T;
    }
    const s = this.add.sprite(x, y, `famous_${id}_down`).setOrigin(0.5, 1).setScale(PLAYER_SCALE);
    const n = { s, prefix: `famous_${id}`, kind: 'famous', famous: id, name: def.name, wait: 2000, target: null };
    n.star = this.add.text(x, y - 40, '★', { fontSize: '12px', color: '#f2d36b', stroke: '#3a2a10', strokeThickness: 3 }).setOrigin(0.5, 1);
    this.tweens.add({ targets: n.star, scale: { from: 0.9, to: 1.15 }, yoyo: true, repeat: -1, duration: 600 });
    this.npcs.push(n);
  }

  // Services changed (counter or closet placed, moved or sold): respawn staff, recheck dirt.
  refreshStaff() {
    this.endTalk();
    this.npcs.filter((n) => n.staff).forEach((n) => {
      n.s.destroy();
      n.mop?.destroy();
      n.puddle?.destroy();
    });
    // (the tour's followers go with their guide; a school class stays with its teacher)
    const goes = (n) => n.staff || (n.follow && n.follow.staff);
    this.npcs.filter((n) => n.follow && n.follow.staff).forEach((n) => n.s.destroy());
    this.npcs = this.npcs.filter((n) => !goes(n));
    this.spawnStaff();
    this.refreshDirt();
  }

  updateVisitor(n, dt) {
    if (n.talking || n.fixed) return;
    if (n.follow) {
      // trail the tour guide along the path they walked
      const t = n.follow.trail;
      const p = t[Math.max(0, t.length - 1 - n.gap)];
      if (p) {
        const moved = Math.hypot(p.x - n.s.x, p.y - n.s.y) > 0.5;
        if (moved) this.faceSprite(n.s, n.prefix, p.x - n.s.x, p.y - n.s.y);
        n.s.setPosition(p.x, p.y);
        n.walking = moved;
      }
      return;
    }
    if (n.trail) {
      const last = n.trail[n.trail.length - 1];
      if (!last || Math.hypot(last.x - n.s.x, last.y - n.s.y) > 1.5) n.trail.push({ x: n.s.x, y: n.s.y });
      if (n.trail.length > 60) n.trail.shift();
    }
    if (n.target) {
      const dx = n.target.x - n.s.x;
      const dy = n.target.y - n.s.y;
      const near = Math.hypot(this.player.x - n.s.x, this.player.y - n.s.y) < 48;
      const step = NPC_SPEED * (n.speed || 1) * dt * (near ? NPC_SLOW : 1);
      const sx = dx ? Math.sign(dx) * Math.min(step, Math.abs(dx)) : 0;
      const sy = dx ? 0 : Math.sign(dy) * Math.min(step, Math.abs(dy));
      if (this.overlapsPlayer(n.s.x + sx, n.s.y + sy) || this.npcBlocks(n, n.s.x + sx, n.s.y + sy)) {
        // wait for the way to clear; give up and turn around if it takes too long
        n.stuckFor = (n.stuckFor || 0) + dt;
        if (n.stuckFor > 1.5) {
          n.target = null;
          n.path = null;
          n.goal = null;
          n.stuckFor = 0;
          n.wait = 300 + Math.random() * 800;
        }
        return;
      }
      n.stuckFor = 0;
      if (Math.abs(dx) + Math.abs(dy) <= step) {
        n.s.setPosition(n.target.x, n.target.y);
        n.target = null;
        n.wait = 600 + Math.random() * 2200;
        if (n.path?.length) {
          n.target = n.path.shift();
          this.faceSprite(n.s, n.prefix, n.target.x - n.s.x, n.target.y - n.s.y);
        } else if (n.goal) this.arrive(n);
      } else if (dx) n.s.x += Math.sign(dx) * Math.min(step, Math.abs(dx));
      else n.s.y += Math.sign(dy) * Math.min(step, Math.abs(dy));
      return;
    }
    n.wait -= dt * 1000;
    // never loiter in a doorway: step out of it first
    if (!n.seat && this.inDoorway(n.s.x, n.s.y) && this.leaveDoorway(n)) return;
    this.idle(n, dt);
    if (n.wait > 0) return;
    if (n.seat) return this.standUp(n);
    n.admiring = null;
    if (n.s.texture.key.endsWith('_phone')) n.s.setTexture(`${n.prefix}_down`);
    if (!n.staff) {
      const roll = Math.random();
      if (roll < 0.35 && this.goLookAt(n)) return;
      if (roll < 0.43 && !n.trail && this.goSit(n)) return;
    }
    const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
    const tiles = 1 + Math.floor(Math.random() * 2);
    const tx = n.s.x + dx * tiles * T;
    const ty = n.s.y + dy * tiles * T;
    const b = this.bounds();
    if (tx < b.x0 || tx > b.x1 || ty < b.y0 + 12 || ty > b.y1 - 20 || this.pathBlocked(n.s.x, n.s.y, tx, ty) || this.inDoorway(tx, ty)) {
      n.wait = 200;
      return;
    }
    n.target = { x: tx, y: ty };
    this.faceSprite(n.s, n.prefix, dx, dy);
  }

  // Step out of a doorway to the nearest clear spot (true if heading out).
  leaveDoorway(n) {
    const b = this.bounds();
    for (const d of [1, 2, 3])
      for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
        const tx = n.s.x + dx * d * T;
        const ty = n.s.y + dy * d * T;
        if (tx < b.x0 || tx > b.x1 || ty < b.y0 + 12 || ty > b.y1 - 20 || this.inDoorway(tx, ty) || this.pathBlocked(n.s.x, n.s.y, tx, ty)) continue;
        n.goal = null;
        n.admiring = null;
        n.target = { x: tx, y: ty };
        this.faceSprite(n.s, n.prefix, dx, dy);
        return true;
      }
    return false;
  }

  // Plan an L-shaped walk (people walk in straight lines, one axis at a time).
  planWalk(n, x, y) {
    const b = this.bounds();
    if (x < b.x0 || x > b.x1 || y < b.y0 + 12 || y > b.y1 - 4) return false;
    if (this.inDoorway(x, y)) return false; // not to stand in a doorway
    if (this.npcs.some((o) => o !== n && Math.abs(o.s.x - x) < 12 && Math.abs(o.s.y - y) < 10)) return false; // someone's there
    const { x: x0, y: y0 } = n.s;
    for (const corner of [{ x, y: y0 }, { x: x0, y }]) {
      if (!this.pathBlocked(x0, y0, corner.x, corner.y) && !this.pathBlocked(corner.x, corner.y, x, y)) {
        n.path = [{ x, y }];
        n.target = corner;
        this.faceSprite(n.s, n.prefix, corner.x - x0 || x - x0, corner.y - y0 || y - y0);
        return true;
      }
    }
    return false;
  }

  // Walk over to a painting and look at it for a while.
  goLookAt(n) {
    if (!this.hung.length) return false;
    const p = this.hung[Math.floor(Math.random() * this.hung.length)];
    const st = this.standFor(p);
    const jitter = st.fy ? (Math.random() - 0.5) * 16 : 0;
    if (!this.planWalk(n, Math.round(st.x + jitter), Math.round(st.y + 4 + (st.fy ? 0 : (Math.random() - 0.5) * 10)))) return false;
    n.goal = { kind: 'painting', p, fx: st.fx, fy: st.fy };
    return true;
  }

  // Find a free seat (stool, bench, sofa) and walk to the front of it.
  goSit(n) {
    const { g } = this;
    const seats = [];
    this.items.forEach((it) => {
      if (!SEATS.includes(it.type)) return;
      const { w, h } = footprint(it);
      for (let k = 0; k < w; k++) {
        const x = g.xL + (it.c + k + 0.5) * T;
        const bottom = g.y0 + (it.r + h) * T;
        const key = `${it.c + k},${it.r}`;
        if (this.npcs.some((o) => o.seat?.key === key || o.goal?.key === key)) continue;
        seats.push({ kind: 'seat', key, x, frontY: bottom + 10, seatY: bottom - 3 });
      }
    });
    if (!seats.length) return false;
    const seat = seats[Math.floor(Math.random() * seats.length)];
    if (this.blocked(seat.x, seat.frontY) || !this.planWalk(n, seat.x, seat.frontY)) return false;
    n.goal = seat;
    return true;
  }

  // Reached where they were going: look at the painting, or sit down.
  arrive(n) {
    const goal = n.goal;
    n.goal = null;
    if (goal.kind === 'painting') {
      this.faceSprite(n.s, n.prefix, goal.fx, goal.fy);
      n.admiring = goal.p;
      n.wait = 3000 + Math.random() * 4000;
      if (Math.random() < 0.55) this.time.delayedCall(500 + Math.random() * 1200, () => this.emote(n));
      else if (Math.random() < 0.4) this.time.delayedCall(800, () => this.quip(n));
    } else if (goal.kind === 'seat') {
      n.seat = goal;
      n.s.setTexture(`${n.prefix}_sit`).setFlipX(false).setPosition(goal.x, goal.seatY);
      n.lift = 5; // drawn over the seat
      n.wait = 6000 + Math.random() * 8000;
      if (Math.random() < 0.3) this.time.delayedCall(1500, () => this.emote(n, n.kind === 'elder' || n.kind === 'grump' ? 'zzz' : 'note'));
    }
  }

  standUp(n) {
    const seat = n.seat;
    n.seat = null;
    n.lift = 0;
    n.s.setTexture(`${n.prefix}_down`).setPosition(seat.x, seat.frontY);
    n.wait = 400;
  }

  // Little things people do while standing around.
  idle(n, dt) {
    if (n.seat || n.fixed || n.follow || n.talking) return;
    n.lookT = (n.lookT ?? 1 + Math.random() * 2) - dt;
    if (n.lookT > 0) return;
    n.lookT = 1.2 + Math.random() * 2;
    const r = Math.random();
    if (n.admiring) {
      if (r < 0.08) this.emote(n);
      return;
    }
    if (n.s.texture.key.endsWith('_phone')) {
      if (r < 0.5) n.s.setTexture(`${n.prefix}_down`);
      return;
    }
    if (r < 0.3) {
      const [vx, vy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)];
      this.faceSprite(n.s, n.prefix, vx, vy); // look around
    } else if (r < 0.42 && PHONE_KINDS.includes(n.kind)) n.s.setTexture(`${n.prefix}_phone`).setFlipX(false);
    else if (r < 0.46 && !n.staff) this.emote(n);
  }

  // A pop-up bubble over someone's head.
  emote(n, id) {
    if (!n.s.active || n.talking) return;
    const pool = EMOTES[n.famous ? 'famous' : n.kind] || ['heart'];
    id = id || pool[Math.floor(Math.random() * pool.length)];
    n.emoteImg?.destroy();
    if (id === 'heart' && !n.staff && !this.isBreak) addLove(this.roomIndex); // people love this room
    const img = this.add.image(n.s.x, n.s.y - 36, `emote_${id}`).setOrigin(0.5, 1).setDepth(5000).setScale(0);
    n.emoteImg = img;
    this.tweens.add({ targets: img, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.tweens.add({ targets: img, alpha: 0, delay: 1500, duration: 300, onComplete: () => img.destroy() });
  }

  // Something short said out loud (floating text).
  quip(n) {
    if (!n.s.active || n.talking) return;
    const pool = QUIPS[n.famous ? 'famous' : n.kind];
    if (!pool) return;
    n.quipText?.destroy();
    const t = this.add
      .text(n.s.x, n.s.y - 38, pool[Math.floor(Math.random() * pool.length)], { fontFamily: 'monospace', fontSize: '8px', color: '#fff8e6', stroke: '#1d1714', strokeThickness: 3 })
      .setOrigin(0.5, 1)
      .setResolution(4)
      .setDepth(5000)
      .setAlpha(0);
    n.quipText = t;
    this.tweens.add({ targets: t, alpha: 1, duration: 200 });
    this.tweens.add({ targets: t, alpha: 0, delay: 2000, duration: 400, onComplete: () => t.destroy() });
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
    if (n.famous) return this.talkToFamous(n);
    let line = lineFor(n.kind, this.paintingNear(n.s.x, n.s.y));
    if (n.kind === 'barista' && Math.random() < 0.5) {
      line = `Coffee’s flowing! ${museumVisitors(this.rooms).toLocaleString()} visitors a month means ${coffeeIncome(this.rooms)} gold an hour from cups.`;
    }
    if (n.kind === 'janitor' && Math.random() < 0.4) {
      const j = janitors();
      line = `There ${j === 1 ? 'is 1 of us' : `are ${j} of us`}. One janitor per room keeps the whole place spotless.`;
    }
    if (!n.staff && Math.random() < 0.3) line = this.contextLine() || line;
    if (!n.staff) line = remember(n.name, n.kind) || line;
    // the progression layer counts every talk (Edmund the caretaker is a named friend; visitors are anonymous)
    progression().bus.emit('NPC_TALKED', { npcId: n.kind === 'caretaker' ? 'edmund' : `anon:visitor:${n.name}`, kind: n.kind, region: 'main' });
    if (KINDS.includes(n.kind) && !n.staff && n.kind !== 'caretaker') return this.chat(n, line);
    if (n.kind === 'guard' && nextSecurity()) return this.offerCameras(n, line);
    if (n.kind === 'caretaker' && this.tellStory(n, heistBeat(this.storyContext()), 'The Empty Frames')) return;
    n.talking = true;
    n.target = null;
    n.path = null;
    n.goal = null;
    if (!n.seat) this.faceSprite(n.s, n.prefix, this.player.x - n.s.x, this.player.y - n.s.y);
    this.talkingTo = n;
    sfx('talk');
    const at = this.screenAt(n.s.x, n.s.y - 34);
    showTalk(n.name, PERSONALITIES[n.kind].label, line, at, 6000, followSpeaker(this, n.s, { leave: TALK_LEAVE }));
  }

  // A real conversation with a visitor (src/chatter.js): about the painting they stand by,
  // something funny, a tip, a request, and sometimes a gift.
  chat(n, opener) {
    const near = this.paintingNear(n.s.x, n.s.y);
    const info = near ? PAINTINGS.find((p) => p.id === near.id) : null;
    const hungBy = this.storyContext().hungBy;
    const store = { get: loadStore, set: saveStore };
    const { giftOK, given } = giftStatus(n.name, n.kind, store);
    const artists = [...new Set(PAINTINGS.map((p) => p.by))];
    const wantBy = artists[Math.floor(Math.random() * artists.length)];
    const finds = { mineral: listEntries({ collection: 'mineral' }).filter((e) => (e.rarity || 1) <= 2), fossil: listEntries({ collection: 'fossil' }).filter((e) => (e.rarity || 1) <= 2) };
    hideTalk(); // (the game keeps running: walk away and update() ends the talk)
    n.talking = true;
    n.target = null;
    n.path = null;
    n.goal = null;
    n.hasGift = false;
    this.talkingTo = n; // (so endTalk, and anything that opens a panel, closes the conversation)
    if (!n.seat) this.faceSprite(n.s, n.prefix, this.player.x - n.s.x, this.player.y - n.s.y);
    sfx('talk');
    const gen = converse({ kind: n.kind, name: n.name, opener, painting: info && { title: info.title, by: info.by, year: info.year, blurb: info.blurb }, hungBy: hungBy.length ? PAINTINGS.filter((p) => hungBy.includes(p.artist)).map((p) => p.by) : [], wantBy, giftOK, given, finds });
    const tex = this.textures.get(`${n.prefix}_down`)?.getSourceImage?.();
    this.chatHandle = runDialogue(gen, {
      name: n.name,
      label: PERSONALITIES[n.kind].label,
      portrait: tex,
      onGift: (gift) => {
        recordGift(n.name, n.kind, store);
        sfx('unlock');
        if (gift.type === 'gold') {
          addCoins(gift.n);
          this.updateHud();
          this.toast(`${n.name} gave you ${gift.n} gold`);
        } else {
          collectEntry(gift.id);
          this.toast(`${n.name} gave you: ${gift.title}`);
        }
        this.emote(n, 'heart');
      },
      onEnd: () => {
        this.chatHandle = null;
        if (this.talkingTo === n) this.talkingTo = null;
        n.talking = false;
        n.wait = 1500;
      },
    });
  }

  // What the story chapters ask about: who you've met and whose paintings are hung.
  storyContext() {
    const met = metList();
    const hungIds = new Set(hungAnywhere(this.rooms).keys());
    return { met: met.length, metIds: met, hungBy: [...new Set(PAINTINGS.filter((p) => hungIds.has(p.id)).map((p) => p.artist))] };
  }

  // Tell the next chapter (a modal so long lines are easy to read). Returns true if one was told.
  tellStory(n, beat, title) {
    if (!beat) return false;
    this.faceSprite(n.s, n.prefix, this.player.x - n.s.x, this.player.y - n.s.y);
    sfx('talk');
    this.pause(true);
    ask(`${n.name} · ${title}`, `“${beat.line}”`, 'Go on', () => {
      this.pause(false);
      const gold = completeBeat(beat, n.famous || n.kind);
      if (gold) {
        addCoins(gold);
        sfx('coin');
        this.updateHud();
      }
      if (beat.lead) this.toast(beat.lead.text);
      else if (gold) this.toast(`+${gold} gold`);
    }, null);
    return true;
  }

  // Something about this room right now: mess, rating, time of day.
  contextLine() {
    const pools = [];
    if (this.mess.length) pools.push(CONTEXT.dirty);
    if (!this.isBreak) {
      const { stars } = roomRating(this.rooms, this.roomIndex);
      if (stars >= 4) pools.push(CONTEXT.great);
      if (stars <= 1.5) pools.push(CONTEXT.poor);
    }
    if (this.lighting.dark > 0.6) pools.push(CONTEXT.night);
    const h = hourNow();
    if (h >= 6 && h < 9.5) pools.push(CONTEXT.morning);
    if (!pools.length) return null;
    const pool = pools[Math.floor(Math.random() * pools.length)];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // The guard offers to put up cameras (no change to how the rooms look).
  offerCameras(n, line) {
    this.faceSprite(n.s, n.prefix, this.player.x - n.s.x, this.player.y - n.s.y);
    sfx('talk');
    this.pause(true);
    const next = nextSecurity();
    const price = FREE ? `Free for now (${next.cost} gold).` : `${next.cost} gold.`;
    ask(`${n.name} · Security`, `“${line} ${securityTier() ? 'Want to upgrade?' : 'Thieves are a real risk when you’re away.'} ${next.name}: ${next.blurb}” ${price}`, `Buy ${next.name.toLowerCase()}`, (yes) => {
      this.pause(false);
      if (!yes) return;
      if (!spend(next.cost)) return this.toast(`Need ${next.cost} gold`);
      buyCameras();
      sfx('build');
      this.toast(`${next.name} installed`);
      this.updateHud();
    });
  }

  talkToFamous(n) {
    const def = FAMOUS[n.famous];
    const first = meet(n.famous);
    const near = this.paintingNear(n.s.x, n.s.y);
    let line = def.lines[Math.floor(Math.random() * def.lines.length)];
    if (first) line = def.hello;
    else if (this.tellStory(n, chainStep(n.famous, this.storyContext()), def.name)) return;
    else if (chainAsk(n.famous) && Math.random() < 0.4) line = chainAsk(n.famous);
    else if (near?.artist === n.famous && Math.random() < 0.7) line = def.own.replace('{title}', near.title);
    n.talking = true;
    n.target = null;
    n.path = null;
    n.goal = null;
    if (!n.seat) this.faceSprite(n.s, n.prefix, this.player.x - n.s.x, this.player.y - n.s.y);
    this.talkingTo = n;
    sfx(first ? 'build' : 'talk');
    showTalk(def.name, first ? 'Famous visitor · first meeting!' : 'Famous visitor', line, this.screenAt(n.s.x, n.s.y - 34), 8000, followSpeaker(this, n.s, { leave: TALK_LEAVE }));
    if (first) {
      this.toast(`You met ${def.name}! +5% income forever`);
      this.updateHud();
    }
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
    this.caretakerSays('Spotless! Visitors pay as they come: walk over the coins by the paintings and on the green pad. Your journal (the book button) has goals with gold rewards. When you’re ready, open the main hall through the double doors.');
  }

  caretakerSays(line) {
    const n = this.npcs.find((v) => v.kind === 'caretaker');
    const at = n ? this.screenAt(n.s.x, n.s.y - 34) : this.screenAt(this.player.x, this.player.y - 34);
    sfx('talk');
    showTalk('Edmund', PERSONALITIES.caretaker.label, line, at, 10000, followSpeaker(this, n ? n.s : this.player, { leave: 6 * 32 }));
  }

  endTalk(fromPause = false) {
    if (this.chatHandle) {
      const h = this.chatHandle;
      this.chatHandle = null;
      this.chatExternal = fromPause;
      h.close();
      this.chatExternal = false;
    }
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

  // Is anything solid along a straight walk (columns and handrails are thin,
  // so checking only the end point lets people walk through them)?
  pathBlocked(x0, y0, x1, y1) {
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4);
    for (let i = 1; i <= steps; i++) if (this.blocked(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps)) return true;
    return false;
  }

  // Another person standing where this one wants to step.
  npcBlocks(n, x, y) {
    return this.npcs.some((o) => o !== n && !o.follow && !n.follow && Math.abs(x - o.s.x) < 2 * BODY.w && Math.abs(y - o.s.y) < 2 * BODY.h && Math.hypot(x - o.s.x, y - o.s.y) < Math.hypot(n.s.x - o.s.x, n.s.y - o.s.y));
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
    // At the top the camera can go a little past the back wall, so the HUD
    // and buttons never sit over a doorway or arch up there.
    const PAD = 110;
    const vw = Math.max(this.g.w, width / zoom);
    const vh = Math.max(this.g.h + PAD, height / zoom);
    const top = Math.min((this.g.h - vh) / 2, -PAD);
    cam.setBounds((this.g.w - vw) / 2, top, vw, Math.max(vh, this.g.h - top));
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
      else if (!this.mode && this.press && !this.dragging && this.input.enabled) this.tapDisplayed(p.worldX, p.worldY);
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
    this.dragMag = Math.min(1, len / max); // a short drag walks, a long one runs
  }

  setupButtons() {
    document.getElementById('build-btn').onclick = () => {
      if (this.mode) this.exitBuild();
      else if (this.input.enabled) this.enterBuild();
    };
    this.interactBtn = document.getElementById('interact');
    this.interactIcon = this.interactBtn.querySelector('.bang');
    this.interactBtn.onclick = () => this.interact();
    document.getElementById('collect-all').onclick = () => this.collectEverything();
    document.getElementById('settings-btn').onclick = () => {
      if (!this.input.enabled || this.mode) return;
      this.pause(true);
      openSettings({
        onAddCoins: (n) => addCoins(n),
        onCollectAll: () => collectOneOfEach(),
        onReset: () => this.resetMuseum(),
        onClose: () => this.pause(false),
      });
    };
    document.getElementById('journal-btn').onclick = () => {
      if (!this.input.enabled || this.mode) return;
      this.openJournalPanel();
    };
    document.getElementById('hud').onclick = () => {
      if (!this.input.enabled || this.mode) return;
      this.pause(true);
      openIncome({ data: () => this.incomeData(), onGo: (i) => this.travel(i, 'entrance'), onClose: () => this.pause(false) });
    };
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
        onPreset: (id) => {
          const cost = presetCost(id, this.roomIndex);
          if (cost > 0 && !canAfford(cost)) return this.toast(`Need ${cost} gold`);
          this.settleAll();
          if (cost > 0) spend(cost);
          else if (cost < 0) addCoins(-cost);
          applyPreset(id, this.roomIndex);
          closeDecor();
          this.rebuild();
        },
        onCharacter: (character) => this.applyCharacter(character),
        plantIcon: (id) => (id === 'none' ? null : this.textures.get(`plant_${id}`).getSourceImage().toDataURL()),
        columns: !!this.g.columns?.length,
        characterPreview: () => this.characterPreview(),
        janitor: { hired: covered(this.rooms, this.roomIndex), cost: janitorCost(), free: FREE },
        onHireJanitor: () => {
          if (!spend(janitorCost())) return this.toast(`Need ${janitorCost()} gold`);
          this.settleAll();
          hireJanitor(this.roomIndex);
          sfx('build');
          this.toast('Janitor hired: this room stays spotless');
          this.refreshStaff();
          this.updateHud();
        },
        onClose: () => this.pause(false),
      });
    };
  }

  // Wipe the museum back to a fresh start (testing).
  resetMuseum() {
    this.resetMess();
    resetRooms();
    resetItems();
    seedEntry(true);
    resetWallet();
    resetDirt();
    resetOffice();
    save(TUTORIAL_KEY, 0); // replay the walkthrough
    resetMet();
    resetJanitors();
    save(BREAK_SEEDED_KEY, false);
    resetSecurity();
    resetQuests();
    resetLove();
    RoomScene.toldQuests = new Set();
    save(DECOR_KEY, { 0: load(DECOR_KEY, {})[0] }); // built rooms are gone, so is their decor
    closeSettings();
    this.travel(0, 'start');
  }

  // The HUD's breakdown: income per room and what boosts it.
  incomeData() {
    const met = metList().length;
    const boosts = [];
    if (met) boosts.push(`Famous visitors met: ${met} of ${Object.keys(FAMOUS).length} · +${Math.round((famousBoost() - 1) * 100)}% income`);
    else boosts.push('Meet famous visitors in the main hall: +5% income each');
    if (guides()) boosts.push(`Tour guides: ${guides()} · +${Math.round(guides() * guideBoost() * 100)}% income`);
    this.rooms.forEach((room, i) => {
      const love = loveOf(i);
      if (love >= 2) boosts.push(`Visitors love ${roomName(room, i)}: +${(Math.min(20, love) * 0.5).toFixed(1)}%`);
    });
    const dirty = this.rooms.filter((_, i) => dirtCount(this.rooms, i) > 0).length;
    if (dirty) boosts.push(`${dirty} room${dirty > 1 ? 's' : ''} need${dirty > 1 ? '' : 's'} mopping (−10% per spot): hire janitors`);
    if (this.items.some((it) => it.type === 'counter') || this.rooms.some((_, i) => loadItems(i).some((it) => it.type === 'counter'))) boosts.push(`Coffee: +${coffeeIncome(this.rooms)} gold/hr from cups`);
    ['giftshop', 'foodcourt', 'discovery', 'lectern'].forEach((type) => {
      if (this.rooms.some((_, i) => loadItems(i).some((it) => it.type === type))) boosts.push(`${ITEMS[type].name}: +${serviceGold(this.rooms, type)} gold/hr`);
    });
    return {
      income: museumIncome(this.rooms),
      visitors: museumVisitors(this.rooms),
      rating: museumRating(this.rooms) / 20,
      boosts,
      note: `Gold stops piling up after ${OFFLINE_CAP_H} hours in each spot, so collect it now and then. “Collect all” works from anywhere but keeps a ${Math.round(COLLECT_ALL_FEE * 100)}% fee; walking to the coins pays in full.`,
      rooms: this.rooms.map((room, i) => ({
        index: i,
        name: roomName(room, i),
        locked: !!room.locked,
        here: i === this.roomIndex,
        stars: starText(roomRating(this.rooms, i).stars),
        income: roomIncome(this.rooms, i),
        paintings: paintingsFor(this.rooms, i).length,
        waiting: room.locked ? 0 : pile(this.rooms, i),
        full: !room.locked && pileFull(this.rooms, i),
      })),
    };
  }

  // What the goals check against.
  questContext() {
    const cleaned = new Set(load(CLEANED_KEY, []));
    const all = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i}`).every((id) => cleaned.has(id));
    return {
      entranceClean: all('stain', 4) && all('web', 6) && (hasCarpenter() || all('crack', 10)),
      hallOpen: !!this.rooms[1] && !this.rooms[1].locked,
      paintings: this.rooms.reduce((n, _, i) => n + paintingsFor(this.rooms, i).length, 0),
      placed: stat('placed'),
      collected: stat('collected'),
      met: metList().length,
      famous: Object.keys(FAMOUS).length,
      janitors: janitors(),
      guides: guides(),
      cameras: camerasOn(),
      rooms: this.rooms.length,
      rating: museumRating(this.rooms) / 20,
      office: officeLevel(),
      income: museumIncome(this.rooms),
    };
  }

  // Tell the player when a goal is ready to claim (once per goal).
  checkQuests() {
    const ready = activeQuests(this.questContext()).filter((q) => q.done);
    document.querySelector('#journal-btn .badge').classList.toggle('hidden', !ready.length);
    RoomScene.toldQuests = RoomScene.toldQuests || new Set();
    const fresh = ready.find((q) => !RoomScene.toldQuests.has(q.id));
    if (!fresh) return;
    ready.forEach((q) => RoomScene.toldQuests.add(q.id));
    sfx('quest');
    this.toast(`Goal done: ${fresh.title}! Claim it in the journal`);
  }

  openJournalPanel(tab) {
    this.pause(true);
    openJournal(
      {
        ctx: () => this.questContext(),
        onClaim: (id) => {
          const gold = claim(id);
          addCoins(gold);
          sfx('coin');
          celebrate(`+${gold.toLocaleString()} gold`, 'Goal complete', 'coin');
          this.checkQuests();
        },
        hungIn: () => hungAnywhere(this.rooms),
        roomLabel: (i) => roomName(this.rooms[i], i),
        onClaimSet: (set, gold) => {
          addCoins(gold);
          sfx('coin');
          celebrate(`+${gold.toLocaleString()} gold`, set.name, 'trophy');
        },
        met: () => metList(),
        portraitCanvas: (id) => {
          if (!FAMOUS[id]) return null;
          if (!this.textures.exists(`famous_${id}_down`)) makeCharacter(this, `famous_${id}`, FAMOUS[id].colors, FAMOUS[id].look);
          return this.textures.get(`famous_${id}_down`).getSourceImage();
        },
        onClose: () => this.pause(false),
      },
      tab,
    );
  }

  pause(on) {
    this.input.enabled = !on;
    this.stick.classList.remove('active');
    this.dragging = false;
    if (on) {
      this.bubble.setVisible(false);
      this.interactBtn.classList.add('hidden');
      this.endTalk(true);
      hideTalk(); // the caretaker's tips too: never leave a speech bubble over a panel
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
    this.archTopImg?.setTexture('walls').setCrop(...this.archTopCrop); // (the walls were redrawn)
    if (this.g.main) this.placeHall();
    if (this.g.atrium) this.placeAtrium();
    if (this.g.shaped) this.placeShaped();
    this.placeDecor();
    this.lighting.build();
  }

  applyCharacter(character) {
    this.character = character;
    save(CHARACTER_KEY, character);
    const key = this.player.texture.key;
    makeCharacter(this, 'player', character, lookOf(character));
    this.player.setTexture(key);
    if (character.pet !== this.pet?.kind || character.petColor !== this.petColor) this.makePet();
    this.petColor = character.petColor;
  }

  // Big front/side/back views of the curator for the Character tab.
  characterPreview() {
    const keys = ['player_down', 'player_side', 'player_up'];
    if (this.pet) keys.push(`${this.pet.prefix}_down`);
    return keys.map((k) => {
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
    if (this.g.stairwell) consider(Math.hypot(x - (this.g.stairwell.x0 + this.g.stairwell.x1) / 2, y - this.g.stairwell.y1 - 8), { downstairs: true, icon: 'stairs' });
    (this.L.upstairs || []).forEach((st) => consider(Math.hypot(x - (st.up === 'left' ? st.x1 + 8 : st.x0 - 8), y - (st.top + st.foot) / 2), { upstairs: true, icon: 'stairs' })); // at the bottom step
    if (this.boardFront) consider(Math.hypot(x - this.boardFront.x, y - this.boardFront.y) - 6, { board: true, icon: 'look' });
    if (this.isBreak) consider(Math.hypot(x - this.L.entrance.ax, y - this.L.entrance.ay), { entrance: true, icon: 'back' });
    if (this.deskFront) consider(Math.hypot(x - this.deskFront.x, y - this.deskFront.y) - 6, { office: true, icon: 'office' });
    this.items.forEach((it) => {
      if (!isFixture(it)) return;
      const { w, h } = footprint(it);
      const fx = this.g.xL + (it.c + w / 2) * T;
      const fy = this.g.y0 + (it.r + h) * T + 8; // just in front
      consider(Math.hypot(x - fx, y - fy) - (w * T) / 3, { fixture: it, icon: 'look' });
    });
    for (const n of this.npcs) consider(Math.hypot(x - n.s.x, y - n.s.y) - 2, { npc: n, icon: 'talk' });
    if (this.pet) consider(Math.hypot(x - this.pet.s.x, y - this.pet.s.y) + 4, { pet: true, icon: 'talk' });
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
    else if (f.fixture) this.openFixture(f.fixture);
    else if (f.mess) this.clean(f.mess);
    else if (f.office) this.openOfficePanel();
    else if (f.board) this.openStaff();
    else if (f.upstairs) this.toast('Upper floor: coming soon');
    else if (f.downstairs) this.toast('Lower floor: coming soon');
    else if (f.door) {
      if (f.door.label === 'Office') this.openOfficePanel();
      else if (f.door.label === 'Break room') this.travel(BREAK, 'entrance');
      else this.toast(`${f.door.label}: coming soon`);
    }
    else if (f.npc) (this.talkingTo === f.npc ? this.endTalk() : this.talkTo(f.npc));
    else if (f.pet) this.pet.pet();
    else if (f.entrance) this.travel(this.isBreak ? 1 : this.roomIndex - 1, this.isBreak ? 'breakdoor' : 'exit');
    else if (f.exit) {
      const next = this.rooms[this.roomIndex + 1];
      if (next?.locked) this.offerUnlock(this.roomIndex + 1);
      else if (next) this.travel(this.roomIndex + 1, 'entrance');
      else this.openBuildMenu();
    }
    this.focus = null;
  }

  // Tap a piece on display (a fish in a tank, a fossil in a case) to read its card;
  // swipe along to the others in this room.
  tapDisplayed(wx, wy) {
    const shown = this.displayObjs.filter((o) => o.getData?.('entry'));
    const hit = shown.find((o) => {
      const b = o.getBounds();
      return wx > b.x - 3 && wx < b.right + 3 && wy > b.y - 3 && wy < b.bottom + 3;
    });
    if (!hit) return;
    const entries = shown.map((o) => o.getData('entry'));
    this.pause(true);
    openViewer(entries, shown.indexOf(hit), () => this.pause(false), null);
  }

  // Open the display panel for a case, plinth, shelf, easel or tank.
  openFixture(item) {
    this.pause(true);
    openDisplay({
      item,
      def: ITEMS[item.type],
      toast: (t) => this.toast(t),
      before: () => this.settleAll(),
      onChange: () => {
        this.placeDisplays();
        this.updateHud();
      },
      onClose: () => this.pause(false),
    });
  }

  // The main hall starts locked behind the entrance's double doors, and the
  // atrium behind the main hall's middle arch.
  offerUnlock(i) {
    const room = this.rooms[i];
    const atrium = room.orient === 'atrium';
    const cost = atrium ? ATRIUM_PRICE : MAIN_HALL_PRICE;
    const name = atrium ? 'atrium' : 'main hall';
    const blurb = atrium ? 'A grand atrium with a waterfall, statues and archways to new wings.' : 'A grand open hall with a balcony and room for big exhibits.';
    this.pause(true);
    const price = FREE ? `free for now (${cost} gold)` : `${cost} gold`;
    ask(`Open the ${name}?`, `${blurb} ${price}.`, 'Open it', (yes) => {
      this.pause(false);
      if (!yes) return;
      if (!spend(cost)) return this.toast(`Need ${cost.toLocaleString()} gold`);
      updateRoom(i, { locked: false });
      sfx('unlock');
      this.rooms = loadRooms();
      celebrate(`The ${name} is open!`, atrium ? 'A waterfall, statues, and the way to new wings' : 'A grand hall with a balcony, and famous faces', 'house');
      this.travel(i, 'entrance');
    });
  }

  openBuildMenu() {
    const max = perks().rooms;
    if (this.rooms.length >= max) return this.toast(`Upgrade the Curator’s Office to build more than ${max} rooms`);
    this.pause(true);
    openBuild(this, this.rooms, NEW_ROOM_DECOR, {
      onBuild: (room) => {
        addRoom(room);
        sfx('unlock');
        celebrate('New room built!', `${ORIENT_LABELS[room.orient]} · ${SIZE_LABELS[room.orient][room.size]}`, 'house');
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
    if (room === 'island') {
      this.cameras.main.fadeOut(220, 29, 21, 18);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('island', { map: 'main' }));
      return;
    }
    const cam = this.cameras.main;
    cam.zoomTo(cam.zoom * 1.08, 220, 'Sine.easeIn'); // a little step forward
    cam.fadeOut(220, 29, 21, 18);
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
    say(text, 1600); // (src/ui/toast.js: one at a time, never a pile)
  }

  // Load saved items, nudging ones that no longer fit (after a resize) back inside.
  fitItems() {
    const saved = loadItems(this.roomIndex);
    let changed = false;
    saved.forEach((it) => {
      if (isFixture(it) && !it.d) {
        it.d = newId(); // (a fixture placed before displays existed)
        changed = true;
      }
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

  // An open archway in the back wall you can step into (about a tile deep)
  // before you're through: { x0, x1 } across it, base = the wall's foot,
  // y = how far in you can go.
  archOpening() {
    const { exit } = this.L;
    if (!exit?.rect || !this.arches.exit || this.arches.exitClosed || this.roomIndex + 1 >= this.rooms.length) return null;
    const half = (exit.rect.u1 - exit.rect.u0) / 2 - 8;
    const base = exit.ay - 12;
    return { x0: exit.ax - half, x1: exit.ax + half, base, y: base - 36 };
  }

  // Doorways people shouldn't stand in: in front of the exit, the entrance
  // and every door or arch on the walls. Visitors walk through them but never
  // stop there.
  doorZones() {
    const { exit, entrance } = this.L;
    const zones = [];
    const around = (x, y, w = 28, up = 26, down = 24) => zones.push({ x0: x - w, x1: x + w, y0: y - up, y1: y + down });
    if (exit) around(exit.ax, exit.ay);
    if (entrance.mat) zones.push({ x0: entrance.x0 - 10, x1: entrance.x1 + 10, y0: this.g.y1 - 40, y1: this.g.y1 + 4 });
    else if (entrance.ax !== undefined) around(entrance.ax, entrance.ay);
    (this.L.decorDoors || []).forEach((d) => {
      const st = this.standFor({ wall: d.wall, u: (d.rect.u0 + d.rect.u1) / 2 });
      around(st.x, st.y, 24, 22, 22);
    });
    return zones;
  }

  inDoorway(x, y) {
    return (this.keepClear || []).some((z) => x > z.x0 && x < z.x1 && y > z.y0 && y < z.y1);
  }

  // The top of the back-wall arch drawn again over the player, so when you
  // stand inside the archway its top covers your head.
  archTop() {
    this.archTopImg = null; // (the scene is reused room to room)
    const { exit } = this.L;
    if (!exit?.rect || !this.room.arch || exit.sprite) return;
    const base = exit.ay - 12;
    const half = (exit.rect.u1 - exit.rect.u0) / 2 + 6;
    const top = base - exit.rect.v1 + 2; // the opening's top edge
    const h = 40;
    this.archTopCrop = [exit.ax - half, top - h, half * 2, h];
    this.archTopImg = this.add.image(0, 0, this.wallImg.texture.key).setOrigin(0).setCrop(...this.archTopCrop).setDepth(base + 1);
  }

  // Archways: walk straight through, no button and no fade.
  checkArches() {
    const { x, y } = this.player;
    const { exit, entrance } = this.L;
    const near = (a) => a && Math.hypot(x - a.ax, y - a.ay) < 12;
    const builtNext = this.roomIndex + 1 < this.rooms.length;
    const arch = this.archOpening();
    // walk on into an open archway and you're through
    const throughArch = arch && x > arch.x0 && x < arch.x1 && y < arch.base - 30;
    // (a locked room behind the arch has to be paid for first: Interact offers it)
    const exitArch = this.arches.exit && builtNext && !this.arches.exitClosed && exit?.rect;
    const entranceArch = this.arches.entrance;
    // Out the entrance's front doors: onto the island.
    const onMat = this.roomIndex === 0 && entrance.mat && x > entrance.x0 && x < entrance.x1 && y > this.g.y1 - 8;
    const touching = (exitArch && (arch ? throughArch : near(exit))) || (entranceArch && near(entrance)) || onMat;
    if (this.archLock) {
      if (!touching) this.archLock = false;
      return;
    }
    if (onMat) this.travel('island');
    else if (exitArch && (arch ? throughArch : near(exit))) this.travel(this.roomIndex + 1, 'entrance', true);
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
      roomLabel: (i) => roomName(this.rooms[i], i),
      onPick: (value) => {
        this.settleAll(); // paintings can move between rooms
        // Hanging elsewhere? Take it down there first.
        const from = value.kind === 'painting' ? hungAnywhere(this.rooms).get(value.id) : undefined;
        if (from !== undefined) {
          paintingsFor(this.rooms, from)
            .filter((p) => p.id === value.id)
            .forEach((p) => setSlot(from, p, { kind: 'empty' }));
        }
        setSlot(this.roomIndex, slot, value);
        const spawn = { x: this.player.x, y: this.player.y, face: this.player.texture.key };
        this.scene.restart({ room: this.roomIndex, spawn });
      },
      onClose: () => this.pause(false),
    });
  }

  // Walking: step frames and a little bounce. Returns true when a foot lands.
  animate(s, moving, dt, rate = 1) {
    return animateWalker(this, s, moving, dt, rate);
  }

  faceSprite(s, prefix, vx, vy) {
    if (Math.abs(vx) > Math.abs(vy)) s.setTexture(`${prefix}_side`).setFlipX(vx < 0);
    else if (vy !== 0) s.setTexture(vy < 0 ? `${prefix}_up` : `${prefix}_down`).setFlipX(false);
  }

  // ---------- HUD ----------

  // Coins in the wallet, museum gold per hour and visitors per month.
  updateHud() {
    const income = museumIncome(this.rooms);
    document.querySelector('.hud-coins').textContent = shortNum(coins());
    document.querySelector('.hud-income').textContent = `+${shortNum(income)}`;
    const v = museumVisitors(this.rooms); // per month, shown short: 1.3k, 2.4M
    document.querySelector('.hud-visitors').textContent = v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k` : `${v}`;
    const rating = (museumRating(this.rooms) / 20).toFixed(1);
    const star = document.querySelector('.hud-rating');
    if (RoomScene.lastRating && rating !== RoomScene.lastRating) {
      star.classList.remove('pop');
      void star.offsetWidth;
      star.classList.add('pop'); // the rating changed: make it pop
      if (Number(rating) > Number(RoomScene.lastRating)) sfx('star');
    }
    RoomScene.lastRating = rating;
    star.textContent = `★ ${rating}`;
    clearTimeout(this.questTimer);
    this.questTimer = setTimeout(() => this.scene.isActive() && this.checkQuests(), 400);
    const tod = timeOfDay(hourNow());
    const icon = document.querySelector('.hud-time');
    icon.className = `hud-time ${tod}`;
    icon.title = tod;
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

  placeBoard() {
    const { c, r } = this.L.board;
    if (!this.textures.exists('board_fixed')) bakeItem(this, 'board_fixed', 'board', { w: 1, h: 1, rise: 14 }, 0);
    const x = this.g.xL + c * T + T / 2;
    const y = this.g.y0 + (r + 1) * T;
    this.add.image(x, y, 'board_fixed').setOrigin(0.5, 1).setDepth(y - 1);
    this.blocks.push({ x0: x - 12, x1: x + 12, y0: y - T + 2, y1: y - 8 });
    this.boardFront = { x, y: y + 12 };
  }

  // First visit to the break room: lockers, a donut table and a few seats.
  seedBreakRoom() {
    if (load(BREAK_SEEDED_KEY, false)) return;
    saveItems(BREAK, [
      { type: 'lockers', c: 0, r: 0, rot: 0 },
      { type: 'lockers', c: 2, r: 0, rot: 0 },
      { type: 'donuts', c: 2, r: 2, rot: 0 },
      { type: 'stool', c: 1, r: 2, rot: 0 },
      { type: 'stool', c: 4, r: 2, rot: 0 },
      { type: 'sofa', c: 4, r: 4, rot: 0 },
    ]);
    save(BREAK_SEEDED_KEY, true);
  }

  // Break-room upgrades for the staff board (data in economy.js).
  upgradeRows() {
    return Object.entries(UPGRADES).map(([id, u]) => {
      const lvl = upgradeLevel(id);
      return {
        id,
        name: u.name,
        blurb: u.blurb,
        level: lvl,
        cost: upgradeCost(id),
        now: u.show(upgradeValue(id)),
        next: lvl < u.cost.length ? u.show(u.effect[lvl]) : null,
        locked: id === 'toolbox' && !hasCarpenter() ? 'Hire the carpenter' : id === 'training' && !guides() ? 'Hire a guide' : id === 'beans' && !this.rooms.some((_, i) => loadItems(i).some((it) => it.type === 'counter')) ? 'Build a coffee counter' : null,
      };
    });
  }

  openStaff() {
    this.pause(true);
    openStaffMenu({
      info: () => ({ free: FREE, janitors: janitors(), guides: guides(), maxGuides: maxGuides(this.rooms.length), guideCost: guideCost(), carpenter: hasCarpenter(), carpenterCost: CARPENTER_COST, guideBoost: guideBoost(), upgrades: this.upgradeRows() }),
      onUpgrade: (id) => {
        const cost = upgradeCost(id);
        if (cost === null || !spend(cost)) return this.toast(`Need ${cost} gold`);
        this.settleAll();
        buyUpgrade(id);
        sfx('build');
        this.toast(`${UPGRADES[id].name} upgraded`);
        this.updateHud();
      },
      onHireGuide: () => {
        if (!spend(guideCost())) return this.toast(`Need ${guideCost()} gold`);
        this.settleAll();
        hireGuide();
        sfx('build');
        this.toast(`Tour guide hired: +${Math.round(guideBoost() * 100)}% income`);
        this.refreshStaff();
        this.updateHud();
      },
      onHireCarpenter: () => {
        if (!spend(CARPENTER_COST)) return this.toast(`Need ${CARPENTER_COST} gold`);
        hireCarpenter();
        sfx('build');
        this.toast('Carpenter hired: cracks fixed, rooms built in a snap');
        this.refreshStaff();
      },
      onClose: () => this.pause(false),
    });
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
        sfx('levelup');
        celebrate(`Office level ${lvl + 1}!`, LEVELS[lvl + 1].unlocks || 'More rooms unlocked', 'star');
        this.updateHud();
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

  tileCenter({ c, r }) {
    return { x: this.g.xL + (c + 0.5) * T, y: this.g.y0 + (r + 0.5) * T };
  }

  updatePile() {
    this.artSpots.forEach((a) => {
      a.amount = artPile(this.rooms, this.roomIndex, a.p);
      a.sprite.setTexture(a.amount >= 15 ? 'coins_2' : 'coins_1').setVisible(a.amount >= 1).setDepth(a.y);
    });
    const n = decorPile(this.rooms, this.roomIndex);
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

  // Stand on a coin spot to collect it.
  checkCoins() {
    const { x, y } = this.player;
    const on = (sx, sy) => Math.abs(x - sx) < 22 && Math.abs(y - sy) < 18; // (coins jump to you when you're close)
    this.artSpots.forEach((a) => {
      if (a.sprite.visible && on(a.x, a.y)) this.coinBurst(a.x, a.y, collectArt(this.rooms, this.roomIndex, a.p));
    });
    if (this.pileSprite.visible && on(this.pileSprite.x, this.pileSprite.y - 8)) this.coinBurst(this.pileSprite.x, this.pileSprite.y, collectDecor(this.rooms, this.roomIndex));
  }

  // When the game opens after a while: how much is waiting, and a nudge if the piles are full.
  welcomeBack() {
    const open = this.rooms.map((r, i) => i).filter((i) => !this.rooms[i].locked);
    const waiting = open.reduce((n, i) => n + pile(this.rooms, i), 0);
    if (waiting <= 0) return;
    const full = open.some((i) => pileFull(this.rooms, i));
    this.toast(`Welcome back! ${waiting.toLocaleString()} gold waiting${full ? `. Some piles are full (${OFFLINE_CAP_H} hours): collect so nothing is wasted` : ''}`);
  }

  // "Collect all" every room's coins from anywhere, keeping a small fee.
  collectEverything() {
    if (!this.input.enabled || this.mode) return;
    const { gross, net } = collectAll(this.rooms);
    if (net > 0) bump('collected', net);
    sfx('coin');
    this.toast(gross > 0 ? `Collected ${net.toLocaleString()} gold (${Math.round(COLLECT_ALL_FEE * 100)}% fee: walk to the coins to keep it all)` : 'Nothing to collect yet');
    this.updatePile();
  }

  // Coins fly up from the spot to the coin counter, with a sparkle.
  coinBurst(x, y, n) {
    if (n > 0) bump('collected', n);
    if (n > 0) {
      sfx('coin');
      this.toast(`+${n.toLocaleString()} gold`);
      const view = this.cameras.main.worldView;
      const k = this.scale.gameSize.width / this.game.canvas.getBoundingClientRect().width; // css px -> game px
      const hud = { x: view.centerX, y: view.y + (36 * k) / this.cameras.main.zoom }; // where the coin counter is
      const count = Math.min(12, 4 + Math.floor(Math.log2(n + 1)));
      for (let i = 0; i < count; i++) {
        const c = this.add.image(x + (Math.random() - 0.5) * 14, y - 6, 'coins_1').setScale(0.35).setDepth(5001);
        const midX = c.x + (Math.random() - 0.5) * 40;
        const midY = c.y - 20 - Math.random() * 20;
        this.tweens.add({
          targets: c,
          x: { value: midX, ease: 'Quad.easeOut' },
          y: { value: midY, ease: 'Quad.easeOut' },
          duration: 220,
          delay: i * 25,
          onComplete: () =>
            this.tweens.add({ targets: c, x: hud.x, y: hud.y, scale: 0.2, alpha: 0.4, duration: 380, ease: 'Quad.easeIn', onComplete: () => c.destroy() }),
        });
      }
      for (let i = 0; i < 6; i++) {
        const t = this.add.image(x + (Math.random() - 0.5) * 20, y - 4 - Math.random() * 16, 'twinkle').setDepth(5001).setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({ targets: t, alpha: 0, scale: 1.8, duration: 500 + Math.random() * 300, onComplete: () => t.destroy() });
      }
      const coinsEl = document.querySelector('.hud-coins');
      coinsEl.classList.remove('pop');
      void coinsEl.offsetWidth;
      coinsEl.classList.add('pop');
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
    if (this.L.board) add(this.L.board);
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
      const flat = ITEMS[it.type].flat; // rugs: walk right over them
      if (!flat) this.blocks.push({ item: true, x0: x + 4, x1: x + w * T - 4, y0: y - h * T + 2, y1: y - 8 });
      const key = this.itemKey(it.type, it.rot);
      const sp = this.add.image(x + (w * T) / 2, y, key).setOrigin(0.5, 1).setDepth(flat ? 0.55 : y - 1);
      return sp;
    });
    this.placeDisplays();
    this.lighting?.build();
  }

  // What is on each case, plinth, shelf, easel and tank, drawn over its sprite.
  placeDisplays() {
    this.displayObjs?.forEach((o) => {
      this.tweens.killTweensOf(o);
      o.destroy();
    });
    this.displayObjs = showDisplays(this, this.items, this.g);
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
      blocked: (type) => missingFor(type),
      onPick: (type) => {
        if (ITEMS[type].season && ITEMS[type].season !== season()) return this.toast(`Only for sale in ${ITEMS[type].season}`);
        if (itemLevel(type) > officeLevel()) return this.toast(`Unlocks at Curator’s Office level ${itemLevel(type)}`);
        const missing = missingFor(type);
        if (missing) return this.toast(missing);
        const max = ITEMS[type].max;
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
      bump('placed');
    }
    this.items.push({ type, c, r, rot, ...(isFixture({ type }) && { d: orig?.d || newId() }) });
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
          if (hit.d) clearDisplay(hit.d);
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
    if (g.main || g.atrium || g.shaped) {
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
    this.lighting.update(dt);
    this.pet?.update(dt);
    // visitors love meeting your pet
    if (this.pet && (this.petCheck = (this.petCheck || 0) - dt) < 0) {
      this.petCheck = 1;
      const now = this.time.now;
      this.npcs.forEach((n) => {
        if (n.staff || n.talking || (n.metPet && now - n.metPet < 30000)) return;
        if (Math.hypot(n.s.x - this.pet.s.x, n.s.y - this.pet.s.y) < 36) {
          n.metPet = now;
          this.emote(n, 'heart');
          if (Math.random() < 0.4) this.time.delayedCall(700, () => this.quip(n));
        }
      });
    }
    this.leashes = this.leashes || this.add.graphics().setDepth(1);
    this.leashes.clear();
    this.npcs.forEach((n) => {
      if (!n.pet) return;
      n.pet.update(dt);
      // the leash: from the owner's hand to the dog's collar
      const hx = n.s.x + (n.s.flipX ? -5 : 5);
      const hy = n.s.y - 12;
      const px = n.pet.s.x;
      const py = n.pet.s.y - 10;
      this.leashes.lineStyle(1, 0x7a2232, 1).beginPath().moveTo(hx, hy).lineTo((hx + px) / 2, Math.max(hy, py) + 4).lineTo(px, py).strokePath();
      this.leashes.setDepth(Math.min(n.s.y, n.pet.s.y) - 1);
    });
    this.starT = (this.starT || 0) + dt;
    if (this.starT > 5) {
      this.starT = 0;
      const gifters = this.npcs.filter((n) => n.hasGift && !n.talking && n.s.active);
      if (gifters.length) this.emote(gifters[Math.floor(Math.random() * gifters.length)], 'star');
    }
    this.npcs.forEach((n) => {
      this.updateVisitor(n, dt);
      this.animate(n.s, (!!n.target || !!n.walking) && !n.talking, dt);
      n.s.setDepth(n.s.y + (n.lift || 0));
      if (n.emoteImg?.active) n.emoteImg.setPosition(n.s.x, n.s.y - (n.seat ? 30 : 36));
      if (n.quipText?.active) n.quipText.setPosition(n.s.x, n.s.y - (n.emoteImg?.active ? 50 : 38));
      n.mop?.setPosition(n.s.x + 12, n.s.y).setDepth(n.s.y - 1);
      n.star?.setPosition(n.s.x, n.s.y - 38).setDepth(n.s.y + 1);
    });
    if (this.mode) return this.drawOverlay(); // toolkit open: no walking
    if (!this.input.enabled) return; // a panel is open

    const k = this.keys;
    let vx = (k.D.isDown || k.RIGHT.isDown ? 1 : 0) - (k.A.isDown || k.LEFT.isDown ? 1 : 0);
    let vy = (k.S.isDown || k.DOWN.isDown ? 1 : 0) - (k.W.isDown || k.UP.isDown ? 1 : 0);
    let pace = 1; // keyboard: full speed
    if (!vx && !vy && this.dragging && this.dragVec) {
      ({ x: vx, y: vy } = this.dragVec);
      pace = this.dragMag > 0.7 ? 1 : 0.62;
    }

    const len = Math.hypot(vx, vy);
    if (len > 0) {
      const b = this.bounds();
      const arch = this.archOpening();
      const inArch = (x, y) => arch && x > arch.x0 && x < arch.x1 && y >= arch.y && y <= arch.base + 12;
      const deep = arch && this.player.y < arch.base; // already inside the archway: stay between its sides
      let nx = Phaser.Math.Clamp(this.player.x + (vx / len) * SPEED * pace * dt, deep ? arch.x0 + 1 : b.x0, deep ? arch.x1 - 1 : b.x1);
      const top = arch && this.player.x > arch.x0 && this.player.x < arch.x1 ? Math.min(b.y0, arch.y) : b.y0;
      const ny = Phaser.Math.Clamp(this.player.y + (vy / len) * SPEED * pace * dt, top, b.y1);
      const free = (x, y, ox, oy) => (inArch(x, y) || !this.blocked(x, y)) && (!this.hitsVisitor(x, y) || this.hitsVisitor(ox, oy));
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
    if (this.animate(this.player, len > 0, dt, 0.8 + pace * 0.5)) {
      footstep();
      if (pace === 1) dust(this, this.player.x, this.player.y);
    }
    this.player.setDepth(this.player.y);
    this.checkArches();
    if (len > 0) this.checkCoins();

    // walked away (or the bubble ran out): the talk ends. A conversation box keeps going until you leave.
    if (this.talkingTo && ((!this.chatHandle && !talking()) || Math.hypot(this.player.x - this.talkingTo.s.x, this.player.y - this.talkingTo.s.y) > TALK_LEAVE)) {
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
