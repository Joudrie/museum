import { defineConfig } from 'vite';

// Relative base so the build works on GitHub Pages (/museum/) and locally.
// tiles.html is a dev page showing the outdoor tileset.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: { main: 'index.html', tiles: 'tiles.html' },
    },
  },
});
