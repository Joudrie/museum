// Wakefield, Massachusetts: a personal project made with the museum game's engine, but not part of the game.
import Phaser from 'phaser';
import './wakefield.css';
import { WakefieldScene } from './WakefieldScene.js';

// render at device resolution so it stays sharp on phones
const parent = document.getElementById('game');
const dpr = Math.min(window.devicePixelRatio || 1, 3);
const size = () => [Math.round(parent.clientWidth * dpr), Math.round(parent.clientHeight * dpr)];

fetch('./wakefield/wakefield.vec.json')
  .then((r) => r.json())
  .then((vec) => {
    const [width, height] = size();
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      width,
      height,
      backgroundColor: '#2b5f93',
      pixelArt: true,
      scale: { mode: Phaser.Scale.NONE },
      scene: [],
    });
    game.scene.add('wakefield', WakefieldScene, true, { vec });
    window.addEventListener('resize', () => {
      game.scale.resize(...size());
      game.scale.refresh();
    });
    window.__wakefield = game; // handy for debugging in the console
  })
  .catch(() => {
    document.getElementById('loading').textContent = 'Could not load the map. Check your connection and reload.';
  });
