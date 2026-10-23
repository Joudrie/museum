import Phaser from 'phaser';
import { RoomScene } from './RoomScene.js';
import { IslandScene } from './IslandScene.js';
import { makeCharacter } from './art.js';
import './ui.js';

// Render at device resolution so pixel art stays sharp on phones.
const parent = document.getElementById('game');
const dpr = Math.min(window.devicePixelRatio || 1, 3);
const size = () => [Math.round(parent.clientWidth * dpr), Math.round(parent.clientHeight * dpr)];
const [width, height] = size();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent,
  width,
  height,
  backgroundColor: '#1d1512',
  pixelArt: true,
  scale: { mode: Phaser.Scale.NONE },
  scene: [RoomScene, IslandScene],
});

window.__game = game; // handy for debugging in the console
window.__makeCharacter = makeCharacter; // (and for sprite contact sheets in tests)

window.addEventListener('resize', () => {
  game.scale.resize(...size());
  game.scale.refresh();
});
