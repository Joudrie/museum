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
- **Every road goes in**, even the smallest streets. Roads are **grey stone** (the greyest plain tile in the engine, `rock_1`; never
  cobblestone), parking lots the same stone, sidewalks lighter flagstone, the railway brown gravel, buildings brick. No trees or
  elevation yet.
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
- **Start: Main Street**, at the point nearest the middle of town (by the Common). Where you left off is remembered, but only
  while the start hasn't moved.
- **Lakes:** Lake Quannapowitt, Crystal Lake, Silver Lake, Pearce Lake, Spring Pond and the rivers are drawn with the engine's
  water tiles (animated) and a beach. The big lakes are OpenStreetMap *relations*, which only return their shapes when asked for on
  their own (`waterrels.json` in the generator); in the bounding-box query they come back empty and silently vanish.
- **Main Street study area (street edges, parking lots, sidewalks measured from the satellite photos):** Main Street plus the first half of
  every road that touches it get real shapes instead of fixed-width strokes. `tools/wakefield/pavement.py` (run with `--pavement`; needs
  opencv-python-headless, scipy, shapely; downloads the Esri photos once into the cache folder):
  1. **Pavement as if there were no cars.** Pavement is the least colourful thing in the photo, so a blurred saturation threshold (picked
     per block of photo from its own histogram, Otsu, between 0.22 and 0.29) finds it; known roofs (OSM buildings) are masked out; a
     13 px closing bridges cars and lane paint and gaps under 43 m2 are filled. (A learned classifier was tried first and was worse: this
     photo has a yellow haze, so colour alone separates poorly, and OpenStreetMap has almost no parking lots or sidewalks mapped near
     the Common to teach it with.)
  2. **Curb to curb:** along every road, a sample a metre, a ray each side finds where the pavement ends; that is held to what the road's
     lane and width tags allow, and replaced by the inside of a mapped sidewalk (curb = about 1 m inside the line) where one exists;
     then median-smoothed along the road. The edge is a straight-edged polygon, never narrower than 8 m (two tiles).
  3. **Left over pavement:** wide (opens under a 4.7 m disc) = parking lot or driveway; thin and within 3.6 m of a street = sidewalk.
     Mapped OSM parking lots near the streets are added. Cars, being bridged over, are simply parking.
  The rest of the town keeps fixed-width stroked roads (2 tiles, main roads 2.5), also grey stone.
- **Painted lines** (`tools/wakefield/markings.py`, `vector.py --markings`, needs opencv-python-headless and scipy): the user wanted yellow and
  white lines so a road reads as a road, not a lumpy paved blob (a street with parking beside it looks like a splash otherwise). Creative
  liberty on exact spacing, but a line goes where the real one is, in its real colour, dashed if it is dashed. Found in the satellite photos:
  every metre along each road the photo is sampled across it (as wide as the road's lane/width tags say, plus 1.5 m); paint is a thin bright
  ridge (brightness minus its local median across the road); a ridge that holds one distance from the centre for 30 m is a line; yellow if it has
  more red-over-blue than the pavement beside it; solid if over 80% of it is painted, otherwise drawn as the dashes the photo shows; a solid
  yellow line down the middle of a two-way road is drawn double. Only on pavement (low saturation) and only where the game draws stone.
  Crosswalks come from OSM's mapped crossings, drawn as white bars. Drawn 5 world px wide, white `#f3f3ec`, yellow `#f2c12e`, over the stone
  and under buildings. The slow reading is cached (`paint.pkl`).
- Walking uses the exact shapes: roads, grass and buildings are walkable; the sea and water block you, except where a road
  crosses (a bridge). Drag to walk, or WASD/arrows. It remembers where you were.
- The **Aa** button toggles names (on by default, remembered). The **map** button cycles the real map off / half / full: it
  loads OpenStreetMap's own zoom-19 pictures around you (credit shown) and places each by its coordinates.
- **Names (Aa):** street names along the roads, plus **374 place names** (shops, restaurants, banks, schools, churches, parks, cemeteries,
  lakes...) from every named thing in OpenStreetMap inside the town (406; 32 dropped where they would cover another label). Laid out
  by the generator (`poi_labels`: big landmarks first, then civic places, then shops; nothing overlaps; street names win). Colours: white
  shops, green parks, blue water, gold civic. Names are drawn on a layer above any picture laid over the town.
- **Map button:** a panel with **Map** (OpenStreetMap) and **Satellite** (Esri World Imagery, zoom 19, about 0.2 m a pixel; credit
  shown) and a strength slider. The choice and strength are remembered. The satellite view is there so the user can place trees from it.
  Imagery is a photo, so tall buildings can lean a few metres off the building outlines.
- **Accuracy (measured, not assumed):** the building shapes laid over the real map's own pictures at the centre and all four far
  edges of town: 85-91% overlap, best-fit offset at most 0.2 m (one real-map pixel) everywhere, so no drift or scale error.
- Import only the engine (`../tiles.js` art, `../art.js` character). **Do not import `decor.js` or other museum UI modules**: they
  run DOM code on import and break the page.

## Next (not done)
Landmarks and place names (schools, parks, lakes), a "you are on X Street" line, trees, a way to edit shapes by hand,
a faster way to cross town, maybe its own repo and address.

## Tidying (paint and stone)
- `markings.tidy`: every long painted line is straightened (Douglas-Peucker, 14 px), a double yellow is rebuilt from one straightened centre, pieces of the same street are stitched, runs found twice are drawn once, and white never runs over yellow.
- `vector.seal_stone`: gaps up to 5 m between streets, lots, sidewalks and road strokes are filled, holes under 60 m2 are filled, and stone reaches a building wall within 3 m. No specks of grass inside the stone.
