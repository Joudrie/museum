# Wakefield, MA: a personal project (NOT part of Curation)

The user is making their **hometown** for their friends. It shares the museum game's engine and art code and
nothing else. **It is not part of Curation and must never touch the game**: no Wakefield entry in the game's boat
menu, no museum HUD, journal, painting viewer or collections on its page, and none of the museum's rules apply to it.

Open it: https://joudrie.github.io/museum/wakefield.html (its own page, `wakefield.html`).

## The user's rules
- The real town as **exact shapes, never tiles**. **No grid anywhere**: a 45° road is a straight 45° line, never a staircase.
  No tile may ever sit on both a road and grass, or on both grass and a building. It must be a precise overlay of the real map.
- **Scale comes from the character.** A tile is about 4 m, so an ordinary street is **two tiles wide** and no road is
  narrower. Wakefield is about 1,350 x 1,650 tiles. A huge map is fine.
- **Every road goes in**, even the smallest streets. Roads are plain **dirt path** for now (no cobblestone), buildings are brick.
  No trees or elevation yet.
- A button toggles **street names** (all of them). A button lays the **real map** over the town (like a GPS) to judge accuracy.
- Walking is fast (3x the museum's pace) because the town is 6 km long.
- Editing by hand is for later ("fuck it for now"). The first two attempts (22 m then 12 m **tile** maps, with cut border
  tiles) were rejected and scrapped: tiles can't make straight diagonals or true proportions.

## How it works
- `tools/wakefield/vector.py` turns OpenStreetMap data into `public/wakefield/wakefield.vec.json` (800 KB): town line, lakes,
  rivers, rail, 1,460 roads (only driveways, parking aisles and tunnels left out), 11,218 buildings, 2,628 street-name
  labels on 571 streets, whole pixels at **8 px to the metre**, delta-encoded. `--fetch DIR` downloads (the
  `overpass.openstreetmap.fr` mirror works from the sandbox), then `python3 tools/wakefield/vector.py DIR`.
- `src/wakefield/` is the whole app: `main.js` (Phaser, its own page), `WakefieldScene.js` (walking, ground, buttons),
  `world.js` (the shapes indexed by chunk, and "is this point in town / water / on a road"), `wakefield.css`.
- Ground is painted in 16x16-tile chunks on demand near the player: sea, a beach along the town line, grass, lakes and rivers,
  rail, roads as strokes of their own width (the engine's dirt art as the fill), buildings as brick polygons, then street names.
  Fills are anchored to the town and chunks have a 1 px margin, so there is never a seam.
- Walking uses the exact shapes: roads, grass and buildings are walkable; the sea and water block you, except where a road
  crosses (a bridge). Drag to walk, or WASD/arrows. It remembers where you were.
- The **Aa** button toggles names (on by default, remembered). The **map** button cycles the real map off / half / full: it
  loads OpenStreetMap's own zoom-19 pictures around you (credit shown) and places each by its coordinates.
- **Accuracy (measured, not assumed):** the building shapes laid over the real map's own pictures at the centre and all four far
  edges of town: 85-91% overlap, best-fit offset at most 0.2 m (one real-map pixel) everywhere, so no drift or scale error.
- Import only the engine (`../tiles.js` art, `../art.js` character). **Do not import `decor.js` or other museum UI modules**: they
  run DOM code on import and break the page.

## Next (not done)
Landmarks and place names (schools, parks, lakes), a "you are on X Street" line, trees, a way to edit shapes by hand,
a faster way to cross town, maybe its own repo and address.
