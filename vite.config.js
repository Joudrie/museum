import { defineConfig } from 'vite';
import { readdirSync, existsSync } from 'node:fs';

// swap/index.json lists the art dropped in public/swap (see src/swap.js), so the game
// knows which placeholders to override. Served in dev, written into dist on build.
const swapIndex = () => {
  const list = (dir, deep) => {
    const root = `public/swap/${dir}`;
    if (!existsSync(root)) return [];
    const out = [];
    for (const e of readdirSync(root, { withFileTypes: true })) {
      if (e.isFile() && e.name.endsWith('.png')) out.push(e.name.slice(0, -4));
      else if (deep && e.isDirectory())
        for (const f of readdirSync(`${root}/${e.name}`)) if (f.endsWith('.png')) out.push(`${e.name}/${f.slice(0, -4)}`);
    }
    return out.sort();
  };
  const json = () => JSON.stringify({ tiles: list('tiles'), sprites: list('sprites'), pieces: list('pieces', true) });
  return {
    name: 'swap-index',
    configureServer(s) {
      s.middlewares.use((req, res, next) => {
        if (!req.url.split('?')[0].endsWith('/swap/index.json')) return next();
        res.setHeader('content-type', 'application/json');
        res.end(json());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'swap/index.json', source: json() });
    },
  };
};

// Relative base so the build works on GitHub Pages (/museum/) and locally.
// tiles.html and art.html are dev pages showing the tileset and every sprite.
// wakefield.html is a separate personal project (the user's hometown), not part of the game.
export default defineConfig({
  base: './',
  plugins: [swapIndex()],
  build: {
    chunkSizeWarningLimit: 1600, // Phaser alone is ~1.5 MB (330 KB gzip, its own cached chunk); tests/bundle.cjs holds the real budget
    rollupOptions: {
      input: { main: 'index.html', tiles: 'tiles.html', art: 'art.html', builder: 'builder.html', wakefield: 'wakefield.html', ui: 'ui.html' },
    },
  },
});
