import Phaser from 'phaser';
import { RoomScene } from './RoomScene.js';
import { IslandScene } from './IslandScene.js';
import { WakefieldScene } from './WakefieldScene.js';
import { loadWakefield } from './wakefieldData.js';
import { IsoScene } from './IsoScene.js';
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
  scene: [RoomScene, IslandScene, IsoScene, WakefieldScene],
});

// index.html?wakefield opens straight onto the real town
if (new URLSearchParams(location.search).has('wakefield')) {
  const go = (vec) => setTimeout(() => {
    game.scene.stop('room');
    game.scene.start('wakefield', { vec });
  }, 50);
  loadWakefield().then((vec) => (game.isBooted ? go(vec) : game.events.once('ready', () => go(vec))));
}

// "Walk around this island" from the map builder
if (new URLSearchParams(location.search).has('play')) {
  let mapData = null;
  try {
    mapData = JSON.parse(localStorage.getItem('curation.playtest') || 'null');
  } catch {
    // no map
  }
  if (mapData) {
    game.events.once('ready', () => setTimeout(() => {
      game.scene.stop('room');
      game.scene.start('island', { mapData });
    }, 50));
    const back = document.createElement('a');
    back.href = './builder.html';
    back.id = 'back-builder';
    back.textContent = '← Builder';
    document.body.appendChild(back);
  }
}

window.__game = game; // handy for debugging in the console
window.__makeCharacter = makeCharacter; // (and for sprite contact sheets in tests)

window.addEventListener('resize', () => {
  game.scale.resize(...size());
  game.scale.refresh();
});
