import Phaser from 'phaser';
import { RoomScene } from './RoomScene.js';
import { IslandScene } from './IslandScene.js';
import { IsoScene } from './IsoScene.js';
import { makeCharacter } from './art.js';
import { warmTiles } from './tiles.js';
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
  audio: { noAudio: true }, // (every sound is made by src/music.js, which starts on the first tap; Phaser's own audio is never used)
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

// The title card (in index.html) goes once the game is running.
const boot = document.getElementById('boot');
if (boot) {
  const hide = () =>
    requestAnimationFrame(() => {
      boot.classList.add('gone');
      setTimeout(() => boot.remove(), 400);
    });
  game.events.once('postrender', hide); // the first frame is drawn, so the scene's create() has run and the HUD has its numbers
}
game.events.once('ready', () => setTimeout(warmTiles, 2500)); // the island's tiles, drawn in idle moments while you look round the museum

window.__game = game; // handy for debugging in the console
window.__makeCharacter = makeCharacter; // (and for sprite contact sheets in tests)

window.addEventListener('resize', () => {
  game.scale.resize(...size());
  game.scale.refresh();
});
import './ui/hud.js'; // the labelled HUD and the Menu hub (after daily.js, whose button it adopts)
import './ui/chrome.js'; // the one close button on every older menu
import './ui/prefs.js'; // text size and reduced motion from Settings
import { progression } from './progression/index.js';
progression(); // rank, skills, journal and goals: the progression layer (docs/PROGRESSION.md)
import './progression/ui/fieldoverlay.js';
import { installFishHints } from './progression/ui/fieldjournal.js';
installFishHints();
import './progression/ui/subcard.js';
import { mountDebug } from './progression/ui/debugpanel.js';
mountDebug(); // (dev only: ?debug=1)
