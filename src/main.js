import Phaser from 'phaser';
import { RoomScene } from './RoomScene.js';
import { IslandScene } from './IslandScene.js';
import { IsoScene } from './IsoScene.js';
import { makeCharacter } from './art.js';
import './ui.js';
import './daily.css';
import './daily.js';
import './share.css';
import './share.js';

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
  scene: [RoomScene, IslandScene, IsoScene],
});

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

// The splash (in index.html) goes once the first scene has been drawn.
{
  const splash = document.getElementById('splash');
  const done = () => {
    if (!splash?.isConnected) return;
    splash.classList.add('gone');
    setTimeout(() => splash.remove(), 450);
  };
  game.events.once('ready', () => requestAnimationFrame(() => requestAnimationFrame(done)));
  setTimeout(done, 12000); // (never hide the game behind it)
}

window.__game = game; // handy for debugging in the console
window.__makeCharacter = makeCharacter; // (and for sprite contact sheets in tests)

window.addEventListener('resize', () => {
  game.scale.resize(...size());
  game.scale.refresh();
});
import './ui/hud.js'; // the labelled HUD and the Menu hub (after daily.js, whose button it adopts)
