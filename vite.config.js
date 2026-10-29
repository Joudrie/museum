import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages (/museum/) and locally.
// tiles.html and art.html are dev pages showing the tileset and every sprite.
// wakefield.html is a separate personal project (the user's hometown), not part of the game.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: { main: 'index.html', tiles: 'tiles.html', art: 'art.html', builder: 'builder.html', wakefield: 'wakefield.html' },
    },
  },
});
