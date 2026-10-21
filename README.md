# Curation

A cozy pixel-art museum tycoon game with real masterpieces. Phone first, portrait only.

- Design: [docs/DESIGN.md](docs/DESIGN.md)
- First session: [docs/FIRST_SESSION.md](docs/FIRST_SESSION.md)

## Prototype

The first room: walk around (tap to walk, or hold and drag), tap a painting to view it.

```sh
npm install
npm run dev     # open the printed URL on your phone (same Wi-Fi)
npm run build   # static build in dist/
```

Pushing to `main` deploys to GitHub Pages (Settings → Pages → Source: GitHub Actions).

Art is placeholder, drawn in code (`src/textures.js`), meant to be replaced by a real tileset.
