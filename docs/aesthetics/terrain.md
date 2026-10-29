# Terrain, water, nature, weather and outdoor light — art-direction audit

> Part of the aesthetics audit (29 Oct 2026, commit fa70331). Overview: [../AESTHETICS-AUDIT.md](../AESTHETICS-AUDIT.md). Visual version with every screenshot: https://claude.ai/artifact/5TdJk17Mx4g36tciuXPfvW (private to the owner).


Auditor: terrain. Scope: every island tile (`src/tiles.js`, `src/scenery.js`, `src/foliage.js`), ground blending
(`src/groundblend.js`), the island renderer (`src/IslandScene.js`), seasons (`seasonFrames` in `src/scenery.js`,
`snowChunk` in `IslandScene.js`), weather (`src/weather.js`), outdoor light (`IslandScene.lightUp`, `src/lighting.js`),
and everything living on or touching water (`src/ambient.js`, `src/critters.js`, `src/fishing.js`).
Islands walked: Main Island (80×80), Island One, the far isle (isle-1), all 7 expedition islands, plus the tiles.html sample.
Method: every tile dumped from tiles.html and re-tiled 3×3 / laid into test blobs at 3-8×; every island captured whole at
1:1 game pixels and cropped; phone-size (390×844, DPR 2-3) views per season, weather and hour.
Shots are in `shots/terrain/` (full 1:1 island captures in `shots/terrain/full/`, phone captures in `shots/terrain/phone/`).

The user asked specifically: *"look at water, see if anything is clipping."* — sections A-D are water. Short answer: yes,
a lot clips. The player can stand in the sea, the fishing bobber lands on the dock planks and on the player's own head,
dock posts stand on dry sand with a foam ring, reeds and frogs sit in open sea water, jellyfish glow on the dry beach,
mountain walls and a dirt path run out over the open sea on expedition islands, and painted water is a square blue
sticker with no shore at all.

---

## A. Water: the sea, the shoreline and depth

- **[T-01] The player (and anyone) can stand in the open sea** (High) — `IslandScene.drawGround` marks a cell solid only when
  **3+** corners are water, but `ground_()` already calls a cell "water" at **2** corners. So the whole water half of every
  straight shore tile (`shore_1100/0011/1010/0101`, 194 such cells on Main) is walkable. Seen on Main's east beach: the player
  stands on deep blue water past the foam line, full legs, black shadow ellipse lying on the water, reeds behind him.
  → Make the sea half of a shore tile solid (collide against the foam line, not the cell), or if wading is wanted, add a
  real wading state: clip the legs at a waterline with a 1px light ripple ring and drop the shadow. Shot:
  [phone-shore-feet-in-sea-z4.png](shots/terrain/phone-shore-feet-in-sea-z4.png), [phone-shore-feet-in-sea.png](shots/terrain/phone-shore-feet-in-sea.png)
- **[T-02] Open sea is one flat mid-blue from the beach to the map edge** (High) — `waterPixel()` / `WATER[2]` `#4890d0`
  everywhere; the shore only adds a 1px `SHALLOW[2]` line inside the foam. No turquoise shallows over sand, no darker deep
  band offshore, no sand visible through shallow water. Every coast in the game reads like a swimming pool edge.
  → Depth by distance from land: 3-4 bands (pale aqua over sand → turquoise → mid blue → deep navy 6+ tiles out), with
  the shallow band showing faint sand ripples through it (like Pokémon HGSS/BW route water). Generate from a distance
  field of the corner map. Shots: [main-bay-docks-3x.png](shots/terrain/main-bay-docks-3x.png), [main-day-full.png](shots/terrain/full/main-day-full.png)
- **[T-03] The sea tile repeats every 32px, so open water is a visible grid of identical dashes** (High) — `waterPixel()`
  seeds its 7 wave crests per tile from fixed hashes; all sea chunks even share one canvas set (`seaKeys`). At phone size the
  same "⌐ ¬ –" crest pattern lines up in columns and rows across the whole sea. → A 4×4- or 8×8-tile water macro texture
  (or crests seeded by world position), slow large-scale colour swell, and crests that change shape between frames.
  Shots: [rep-water.png](shots/terrain/rep-water.png), [water-props-4x.png](shots/terrain/water-props-4x.png)
- **[T-04] Coastline follows the tile grid, with 90° notches and stair-steps on every diagonal** (Med) — corner tiles only
  add ±0.21 of tile-periodic noise to a bilinear mask (`cornerMask`), so coasts are straight runs with a corner kink every
  32px; the 45° stretches on Main's south coast and every expedition island are visible staircases. → More edge noise
  driven by world position (not per-tile), plus dedicated 45° diagonal shore pieces (Pokémon-style 47-tile set), so
  coasts can curve. Shots: [blob-shore.png](shots/terrain/blob-shore.png), [exp-badlands-day-full.png](shots/terrain/full/exp-badlands-day-full.png)
- **[T-05] Wet-sand band has a brown "knob" at the same spot in every tile** (Med) — the tile-periodic `fbm` used by
  `shoreTile` puts a bump of dark wet sand at the same tile-local x on every edge tile, so beaches show a regular scallop
  every 32px (very visible along Main's bay, `y≈1215` in the bay crop, and on the test blob's top edge). → Noise in
  world coordinates; vary foam width; break the wet band with occasional shells/pebbles. Shots: [blob-shore.png](shots/terrain/blob-shore.png),
  [main-sand-ripple-patchwork-4x.png](shots/terrain/main-sand-ripple-patchwork-4x.png)
- **[T-06] Foam is a uniform 2-3px white stripe that moves rigidly** (Med) — `shoreTile` shifts the whole mask by ±0.05
  (`ebb`); foam, shallow line and wet band all slide together, same shape every frame, and the wet mark moves *with* the
  water instead of being left behind as it retreats. → Two layers: a wet-sand mark that only darkens/fades, and a foam
  line that runs up and breaks into dots on the way back (Stardew/Eastward shore loop, 6-8 frames). Shot:
  [shore-1100-frames-6x.png](shots/terrain/shore-1100-frames-6x.png)
- **[T-07] Diagonal "saddle" shore tiles draw a white X of foam** (Low) — `shore_1001` / `shore_0110` produce a 4-way white
  cross with water joining through the middle. → Pick one diagonal (land bridge) and draw it as a narrow sandbar.
  Shot: [shore-corners-6x.png](shots/terrain/shore-corners-6x.png)
- **[T-08] `water_shallow` is a muddy grey-teal polka-dot tile that matches nothing** (Med) — `shallowPixel()` blends sand
  35% with `SHALLOW[0]` and puts caustics on a regular `sin·sin` lattice: it reads as concrete with dots, has no edge set to
  meet deep water or sand, and its caustic period (≈9px) does not divide 32 so it seams. → Replace with the shallow depth
  band of T-02 (with edge tiles), or remove it from the builder. Shots: [seam-sand2-shallow.png](shots/terrain/seam-sand2-shallow.png),
  [shore-corners-6x.png](shots/terrain/shore-corners-6x.png)
- **[T-09] No reflections anywhere** (Med) — trees, boats, docks, lighthouse, people at the waterline cast nothing on water;
  boats and posts float on top with their full bottom outline. → Cheap vertical-flipped, 40% alpha, 1px-wobbling copy of
  sprites whose base touches water (boats, posts, cliff faces, people wading), clipped to water pixels.
- **[T-10] Night sea turns electric royal blue** (Med) — the night multiply (74,70,112) on `#4890d0` gives ~`#152a5b`,
  far more saturated than the grey-purple land around it; at 22:00-02:00 the sea is the loudest colour on screen. → Night
  water should go dark slate with a cool moonlit glint path, not saturate. Shots: [night-main.png](shots/terrain/night-main.png),
  [hours-pos1.png](shots/terrain/hours-pos1.png)

## B. Water: ponds, painted water, rivers and the waterfall

- **[T-11] Painted water (`t:water`) is a square blue sticker with no shore, bank or outline** (High) — Main Island's upper
  "lake/river" (23 painted `water` tiles on grass) is drawn as hard 32px squares with stair-step corners straight onto the
  lawn; the far isle's pond mixes outlined bank water with painted squares in one body. The tile layer never gets edge tiles.
  → Painted water must write into the corner map (become pond/sea terrain) so it gets bank/shore edges, or the builder needs
  an auto-tiled water brush. Shots: [main-river-3x.png](shots/terrain/main-river-3x.png), [isle1-pond-3x.png](shots/terrain/isle1-pond-3x.png),
  [main-east-edge-3x.png](shots/terrain/main-east-edge-3x.png)
- **[T-12] Painted water is not "water" to the game** (Med) — `ground_()` reads only corners, so on painted water: no
  ripples, no glints, no fishing (`waterAhead`), ducks placed on it can never move (`moveIslanders` needs `wet`), it does
  not freeze in winter (`snowChunk` only freezes pond corners). The pond next to it freezes; this stays summer blue.
  → Same fix as T-11. Shot: [winter-water.png](shots/terrain/winter-water.png) (pond frozen, painted river liquid)
- **[T-13] Pond banks cast their shadow the wrong way: ponds look like raised blue plates** (High) — `bank_*` is
  `edgeTile(k, waterPixel, grassPixel, WATER[0], 0.18)`: the darkening is applied to the *grass below* the water, and the
  north edge (where the bank should drop into the water) has nothing. In 3/4 view water is lower than the lawn: the shadow
  and a visible earth face belong on the water side of the **top** edge. Every pond on every island reads as a blue rug
  lying on the grass. → North edge: 2-3px earth/stone bank face + dark shadow band on the water; side/bottom edges: thin
  lighter wet-soil rim; a 2px pale shallow band inside. Shots: [bank-corners-6x.png](shots/terrain/bank-corners-6x.png), [blob-bank.png](shots/terrain/blob-bank.png),
  [one-pond-3x.png](shots/terrain/one-pond-3x.png)
- **[T-14] Ponds use the same deep sea tile and follow the grid as rectangles** (Med) — `groundCells` draws `water` (the sea
  tile) for full pond cells; Island One's pond is a 4×4 square with wiggly edges, Main's south ponds are L-shapes with a dead
  straight east side and regular zig-zag teeth (tile-periodic noise). → Pond palette: greener/darker, lily-shade; rounder
  shapes (world-space noise, diagonal pieces); reeds/stones auto-scattered on the rim. Shots: [main-ponds-s-3x.png](shots/terrain/main-ponds-s-3x.png),
  [one-pond-3x.png](shots/terrain/one-pond-3x.png)
- **[T-15] Edge tiles are opaque, so any three-material junction becomes a square block** (High, systemic) — `edgeTile`
  bakes the under-material into the tile (bank = water+grass, grass_sand = grass+sand, grass_dirt = grass+dirt). Where a
  pond corner meets a beach, `bank_*` paints a full square of grass over the `grass_sand` edge (tiles.html sample: dead
  straight vertical grass edge at the pond); where grass meets a shore, `grass_sand` paints plain sand over the sea (sample:
  sand square under the bush). On islands the "grass never touches the sea" rule hides most of it, but waterfall feet, ponds
  near beaches and painted tiles all hit it. → Make edge tiles transparent overlays of the top material only (draw order:
  deepest → highest), so layers composite. Shots: [sample-island-pond-4x.png](shots/terrain/sample-island-pond-4x.png), [sample-island-dock-4x.png](shots/terrain/sample-island-dock-4x.png)
- **[T-16] Waterfall is a flat striped slab with ruler-straight sides and no lip** (Med) — `waterfall` = vertical lanes of
  3 blues with white dashes; it starts a full tile *above* the cliff lip in the middle of the lawn (Main, x67-68 y30), has
  no curl over the edge, no side spray, no foam where it meets the cliff, no mist. → Lip tile (water curving over the edge
  with a highlight), body with irregular edges and vertical streaks that scroll, 2-3 mist puffs at the foot drawn over
  everything. Shot: [main-waterfall-foot-5x.png](shots/terrain/main-waterfall-foot-5x.png)
- **[T-17] Waterfall splash is static-noise squares in an opaque deep-water tile** (Med) — `waterfall_foot` = `hash()` 2×2
  white blocks in the top 12px over the sea tile; stacking two (as Main does) repeats the same churn band twice; on mixed
  corners its opaque water square overwrites the shore beneath. → Ring of foam that expands outward, a few bubble dots,
  transparent overlay so it can sit on a shore. Shots: [main-waterfall-foot-5x.png](shots/terrain/main-waterfall-foot-5x.png), [water-props-4x.png](shots/terrain/water-props-4x.png)
- **[T-18] River → waterfall → sea join has no transition** (Med) — on Main the painted channel ends in a square at the
  cliff, the cliff face drops straight onto deep water with no foam line where rock meets water, and the sea's foam stops
  dead against the cliff's side. → Foam/wet-rock line along any cliff base that touches water; cliff "into water" base tiles.
  Shot: [main-waterfall-foot-5x.png](shots/terrain/main-waterfall-foot-5x.png)
- **[T-19] Frozen pond has no rim and is barely distinguishable from snow** (Med) — `snowChunk` replaces blue pond pixels
  with `#b2d6ec`/`#cee6f4` plus diagonal white streaks; the dark bank outline is frozen too, so ice and snow meet with no
  edge; the streaks look like rain. Builder `lily` pads and builder ducks stay on top of the ice (lily from the builder is
  placed non-flat, so the winter hide list in `seasonal()` misses it). → Keep the bank outline, ice with a darker rim, a few
  cracks and snow drifts at the edges; hide/replace lily pads and move ducks off ice. Shot: [winter-water.png](shots/terrain/winter-water.png)

## C. Water: things on, in and beside the water (clipping)

- **[T-20] The fishing bobber lands on the dock planks** (High) — `waterAhead()` tests `ground_()` (corner terrain), which
  is still "water" under a dock painted over the sea. Standing on Main's bay pier facing along it, the bobber sits on the
  wood two planks away. → Test painted tiles too: a dock/boardwalk/rock cell is not water. Shot: [fishing-cast-z4.png](shots/terrain/fishing-cast-z4.png)
- **[T-21] Casting upward puts the bobber on the player's head** (High) — the first test distance is 30px from the feet
  (`p.y - 4 - 30`), which is head height, so at the Island One pond (facing up) the red/white bobber sits on the pond rim
  touching the hair. → Minimum cast 2 tiles; for `up`, aim at least 48px past the head; land only on cells with water on
  all sides. Shot: [one-pond-fish-z3.png](shots/terrain/one-pond-fish-z3.png)
- **[T-22] Fishing line is an anti-aliased vector line drawn above everything** (Low) — `Fishing` uses `Graphics` lines
  (0.6px, 1.5px rod) at depth 4000, so the line crosses over tree canopies and the player's own face when facing up, and is a
  smooth sub-pixel curve in a pixel world. → 1px pixel-stepped line, sorted with the player (behind the body when facing up).
- **[T-23] Dock posts stand on dry sand wearing a water-foam ring** (High) — `dock_post` bakes a `rgba(242,251,255,0.6)`
  ellipse into its foot; on Main 2 of the bay posts sit on full-sand cells (`1111`) and 4 more on the shore line, so white
  puddle rings float on the beach; none of the posts touch the pier they belong to (placed a tile off). → Foam ring as a
  separate water-only overlay; posts placed under the pier's edge; "post on sand" variant with a small sand mound.
  Shots: [fishing-cast-z4.png](shots/terrain/fishing-cast-z4.png), [main-sand-ripple-patchwork-4x.png](shots/terrain/main-sand-ripple-patchwork-4x.png), [main-bay-docks-3x.png](shots/terrain/main-bay-docks-3x.png)
- **[T-24] Docks are flat stickers: no pilings, no thickness, no shadow on the water** (High) — `dock_h`/`dock_v` are 4
  planks with nail dots edge to edge; laid over the sea they show no side board, no posts under them, no dark band on the
  water. Piers also run straight onto the beach and grass with no end/step piece. → Pier edge tiles: 2-3px plank side face,
  shadow band on the water below, a pile every 2 tiles poking out of the water with a ripple, an end cap, and a landing step
  where it meets sand. Shots: [isle1-docks-3x.png](shots/terrain/isle1-docks-3x.png), [main-bay-docks-3x.png](shots/terrain/main-bay-docks-3x.png)
- **[T-25] Dock planks repeat identically and run the wrong way** (Med) — every `dock_v`/`dock_h` tile has the same plank
  knots and the same 4×2 nail grid; maps use `dock_h` (planks across) for vertical runs and `dock_v` for horizontal ones
  interchangeably, giving striped wallpaper; the pale `path_boardwalk` is a different wood palette again. → One plank
  palette; planks always perpendicular to the walking direction (auto-pick by neighbours); 3-4 plank variants with offset
  seams. Shots: [isle1-docks-3x.png](shots/terrain/isle1-docks-3x.png), [main-pond-ne-3x.png](shots/terrain/main-pond-ne-3x.png)
- **[T-26] Rowboats float on top of the water like toys, with an oar standing up like a mast** (Med) — `rowboat` draws the
  full hull outline including the bottom, a flat pale ellipse "wake" under it, and the oar as a vertical 2px stick in the
  middle. All boats on a map are identical, face the same way and are not tied to anything. → Hull cut by a waterline (lower
  third tinted water colour, 1px ripple), oars lying along the gunwales, a rope to the nearest post, flip/rotate variants.
  Shots: [water-tiles-5x.png](shots/terrain/water-tiles-5x.png), [isle1-docks-3x.png](shots/terrain/isle1-docks-3x.png)
- **[T-27] Rocks in water float; `rocks_pile` dropped in water has no splash at all** (Med) — `water_rock` has its full OUT
  outline all round plus a pale ring only under the bottom; Main and far-isle maps also drop the land `rocks_pile`/`rock_small`
  into ponds, where they sit on the surface with a land shadow. Main's SW corner puts `water_rock`s on dry sand with their
  foam rings. → Waterline-cut rock with foam on all sides; "wet" variants of land rocks. Shots: [isle1-pond-3x.png](shots/terrain/isle1-pond-3x.png),
  [main-sw-corner-3x.png](shots/terrain/main-sw-corner-3x.png)
- **[T-28] Two clashing lily-pad styles, one rotated into mixels** (Med) — the builder `lily` tile (big pale-green pill, no
  notch, square pink flower) and the critter `lilypad` (small dark rectangles `setAngle(rnd(0,360))`, nearest-neighbour
  rotated, jagged) sit in the same pond; Main also floats 7 lily tiles in salt water. → One lily set: round pad with a V
  notch, 3 sizes, 8 pre-drawn orientations (no runtime rotation), only on ponds. Shot: [one-pond-critters-closeup.png](shots/terrain/one-pond-critters-closeup.png)
- **[T-29] Duck's orange feet hang below its body on the water; swan reads as a white "L"** (Med) — `duck_*` in
  `critters.js` draws legs/feet under the hull as if standing on the surface; the 20×16 `swan_0` is a white boot shape with a
  black block tail and no wing; ducklings overlap the mother. No ripple ring under either at rest. → Swimming birds cut at
  a waterline (no feet), a soft 1px wake, folded wing shape and an S-neck for the swan. Shot: [one-pond-critters-closeup.png](shots/terrain/one-pond-critters-closeup.png)
- **[T-30] Frogs and a parrot sit on open water; reeds grow in the sea** (Med) — builder `animal_frog`, `animal_parrot` and
  critter frogs are placed by `ground_` rules that treat 2-corner shore as water, so frogs sit on the sea (Main, at the
  waterfall foot) and in the middle of ponds (far isle); three `reeds` on Main stand in open seawater (a fourth on the shore); on Island One
  the pond's cattails are a tile away on dry lawn. → Frogs on lily pads or the bank only, reeds only on the pond rim
  (auto-placed by the bank tiles), not in salt water. Shots: [main-waterfall-foot-5x.png](shots/terrain/main-waterfall-foot-5x.png),
  [phone-shore-feet-in-sea-z4.png](shots/terrain/phone-shore-feet-in-sea-z4.png), [isle1-pond-3x.png](shots/terrain/isle1-pond-3x.png)
- **[T-31] Jellyfish glow on the dry beach and draw over everything** (Med) — `Ambient.jelly()` accepts any point where
  `ground() === 'water'` (2+ wet corners) so they drift onto the sand half of shore tiles; they are `setDepth(5002)` with
  ADD blend, above the dock, boats and player. Seen at 22:00 on Main and Island One (three on sand). → Only cells with 4 wet
  corners; depth just above the water (0.7) with the glow on a separate additive layer. Shots: [night-jelly-on-sand.png](shots/terrain/night-jelly-on-sand.png),
  [night-one.png](shots/terrain/night-one.png)
- **[T-32] Driftwood "floats" in the sea as a pale worm** (Low) — the `driftwood` tile (2px tan zig-zag) is placed in open
  water on Main 3×; no waterline, reads as a worm. → Beach-only driftwood with shading; a floating-log variant cut by water.
  Shot: [main-bay-docks-3x.png](shots/terrain/main-bay-docks-3x.png)
- **[T-33] Dolphins pop out whole above the water, rotated** (Med) — `Ambient.dolphins()` spawns the 22×10 side-view
  sprite fully drawn at the surface at k=0 and k=1, rotated ±45° by `setAngle` (pixel-art rotation = mixels). They never
  break the surface. → Pre-drawn arc frames (dorsal fin breaking water → arc → splash), lower half masked below the
  waterline, splash ring at entry/exit.
- **[T-34] Sea turtle is a top-down sprite rotated to its heading; bottle rotates too** (Low) — `turtle_*` (18×14 from
  above) is `setAngle()`d toward the sea, as is the bottle (±18°): rotated pixel art and a top-down view in a 3/4 world.
  → 4-direction 3/4 turtle frames; bottle bob without rotation (2 tilt frames).
- **[T-35] Water ripples, puddle rings and splash rings are anti-aliased vector ellipses** (Low) — `ripple()` in ambient.js,
  `onStep` shore rings, fishing `splash`, duck rings, rain `splash()` all use `add.ellipse().setStrokeStyle(1, …)` scaled
  by tweens: soft sub-pixel rings at zoom 4.06. → A 4-frame pixel ripple sprite sheet (Pokémon-style concentric ring).
- **[T-36] Sun glints appear on sand** (Low) — `Ambient.glints()` places the 5×5 white plus wherever `ground() === 'water'`,
  i.e. on the sand half of shore tiles too. → 4-wet-corner test; glints as 2-3 frame sparkles in the water palette.

## D. Map edges (what is past the sea)

- **[T-37] Main Island runs off the north and east edges of the world** (High) — the forest, meadow, tall grass and a
  windmill continue to x=80 / y=0; the windmill at (70,−1) has its sails cut by the map top and the camera stops there, so
  the player hits an invisible wall in a lawn. The far isle does the same (north beach and east forest touch the edge).
  → Every builder island needs ≥10 tiles of sea margin (builder should enforce or auto-pad), and the outermost ring should be
  deep-water/"open sea" art. Shots: [main-top-edge-3x.png](shots/terrain/main-top-edge-3x.png), [main-east-edge-3x.png](shots/terrain/main-east-edge-3x.png),
  [isle1-grid.png](shots/terrain/isle1-grid.png)
- **[T-38] Main's SW corner: a grass cliff plateau painted straight onto the open sea, cut by the map corner** (High) —
  painted `cliff_top`/`cliff_face` + grass and flowers at (0-15, 70-80) meet deep water along a ruler-straight edge with no
  shore, the cliff's right side is a 1px line against water, and the land is sliced by the map's south and west borders.
  → Painted land tiles must not be allowed on sea corners (or must convert them to land with a shore); see T-11/T-15.
  Shot: [main-sw-corner-3x.png](shots/terrain/main-sw-corner-3x.png)
- **[T-39] The sea just stops at the screen edge** (Low) — camera bounds equal the map, so the last row of water is the
  last pixel; no horizon, haze, darker open-ocean or wave crests building toward the edge. Fine for play, flat for a "you are on
  an island" read. → Deep-ocean band (T-02) plus a subtle vignette toward map edges.
- **[T-40] Expedition islands put walls over the sea** (High) — Red Badlands' mountain wall row runs ~10 tiles past the
  east coast over open water; Thieves' Rock's vault top wall and the Frozen North's vault sit on the beach/sea line;
  Skull Isle's dirt path continues 3 tiles out into the sea like a soil pier; the Sandstone Tomb has an orphan wall block on
  the north beach. → Clip painted tiles to land in the builder; validate expedition maps. Shots:
  [badlands-mountain-on-sea-3x.png](shots/terrain/badlands-mountain-on-sea-3x.png), [heist-vault-on-sea-3x.png](shots/terrain/heist-vault-on-sea-3x.png),
  [pirate-dirt-into-sea-3x.png](shots/terrain/pirate-dirt-into-sea-3x.png), [tomb-orphan-wall-3x.png](shots/terrain/tomb-orphan-wall-3x.png)

## E. Ground tiles: textures and repetition

- **[T-41] Grass is wallpaper: every tile repeats the same tufts and slashes** (High) — `grassPixel` places 7 tufts at fixed
  per-variant positions and the fbm is tile-periodic; `grass_1`'s dark diagonal slashes line up into a lattice, `grass_2/3`
  dots form a grid; the 1-2-1-3 variant cycle (`groundCells`) is itself regular. Main's half-island lawn at phone size is a
  visibly tiled carpet with nothing else on it. → Large-scale colour variation (2-3 tile soft patches of lighter/darker grass
  from world noise), 6-8 variants picked by hash, scattered decals (clover, tiny flowers, darker clumps) at 5-10% density.
  Shots: [ground-repeat-3x3.png](shots/terrain/ground-repeat-3x3.png), [rep-grass_1.png](shots/terrain/rep-grass_1.png), [main-day-full.png](shots/terrain/full/main-day-full.png)
- **[T-42] `rock_1`/`rock_2` stamp the same crack motif every tile** (High) — `stonePixel` puts one big "hourglass"
  (rock_1) / "ↄ" (rock_2) crack shape per tile; the Thieves' Rock island (493 rock_2 tiles) and the Badlands rock patches
  read as a printed pattern. (`rock_1` is also the Wakefield road tile.) → Low-contrast stone with cracks seeded in world
  space, 4+ variants, occasional pebble decals. Shots: [rep-rock_1.png](shots/terrain/rep-rock_1.png), [rep-rock_2.png](shots/terrain/rep-rock_2.png),
  [exp-heist-day-full.png](shots/terrain/full/exp-heist-day-full.png)
- **[T-43] Dirt is a quilt of identical round blobs with "Ꞁ" specks** (Med) — `dirtPixel`'s 4-cell fbm gives one rounded
  dark/light blob per tile; the pebbles are 3px "Ꞁ" marks. Main's big dirt field and the Badlands (566 dirt_2 tiles) look
  quilted. → Flatter dirt with sparse, varied pebbles and faint tracks; world-space noise. Shots: [rep-dirt_1.png](shots/terrain/rep-dirt_1.png),
  [exp-badlands-day-full.png](shots/terrain/full/exp-badlands-day-full.png)
- **[T-44] Sand has a repeating "ʌ" speck and rippled tiles appear as square patches** (Med) — `groundCells` puts `sand_2`
  (ripples) on every 5th cell by `(x*7+y*3)%5`, so beaches are a patchwork of rippled and flat squares with ripples starting
  and stopping at tile edges; the ripple period (`y*0.55`) does not divide 32 so rippled tiles seam vertically too.
  → Ripples as a world-space field fading in near the waterline; one sand base. Shots: [main-sand-ripple-patchwork-4x.png](shots/terrain/main-sand-ripple-patchwork-4x.png),
  [seam-sand2-shallow.png](shots/terrain/seam-sand2-shallow.png), [tomb-sand2-wallpaper-3x.png](shots/terrain/tomb-sand2-wallpaper-3x.png)
- **[T-45] Ice streaks break at every tile edge** (Med) — `ice` uses `(x - y + 64) % 24`; 24 does not divide 32, so the
  diagonal streaks jump at every tile boundary; the blotch repeats per tile. The Frozen North's ice patches show it at once.
  → Period 32 (or 16), streaks from world coords, plus ice-on-snow edge tiles. Shot: [rep-ice.png](shots/terrain/rep-ice.png),
  [north-ice-snow-sand-3x.png](shots/terrain/north-ice-snow-sand-3x.png)
- **[T-46] Cobble reads as fish scales** (Med) — `cobblePixel`: 8px stones of identical size in strict offset rows with a
  flat top highlight; big courts (Lost Temple, Tomb, Main plaza) look like snakeskin. → Irregular stone sizes (4-10px),
  varied tones, darker joints, occasional missing/moss stone. Shots: [rep-cobble.png](shots/terrain/rep-cobble.png), [main-plaza-ring-mismatch-4x.png](shots/terrain/main-plaza-ring-mismatch-4x.png)
- **[T-47] Flagstone repeats the same 6 slabs and its green mortar reads as moss** (Med) — `path_flagstone`: 6 fixed Voronoi
  centres per tile, so the museum path on Main is the same slab layout 84 times; mortar `#6a7a5a`. (In winter the mortar
  catches snow, see T-100.) → 3-4 slab layouts, grey-brown mortar, a darker 1px rim where the path meets grass.
  Shot: [main-museum-path-3x.png](shots/terrain/main-museum-path-3x.png)
- **[T-48] Gravel is salt-and-pepper noise** (Med) — `path_gravel` = per-pixel hash (7% white, 13% grey) on beige; at
  phone size it shimmers like TV static next to the soft grass. → Clustered 2-3px pebbles, fewer, with shading.
  Shot: [main-plaza-3x.png](shots/terrain/main-plaza-3x.png)
- **[T-49] Snow tile repeats a cloud blot; snow, sand and ice meet with hard squares** (Med) — `snow` fbm is tile-periodic,
  so the Frozen North (563 tiles) is a grid of the same blot; it sits inside a ring of golden tropical sand and next to
  square ice patches. → World-space snow shading, snow-to-sand/ice edge sets, a grey shingle beach on cold islands (see T-119).
  Shot: [north-ice-snow-sand-3x.png](shots/terrain/north-ice-snow-sand-3x.png)
- **[T-50] Wet sand as a whole island interior** (Low) — `sand_wet` is a flat brown with 10% dither; the Drowned Reef paints
  470 of them inside a dry-sand rim, inverting the beach (wet should be at the waterline). → Use wet sand only as the shore
  band; give the reef island tide pools, kelp, rock. Shot: [wreck-wetsand-staircase-3x.png](shots/terrain/wreck-wetsand-staircase-3x.png)
- **[T-51] `water_shallow`, `brick`, `path_mosaic`, `path_stairs`, `path_dirt_track` have no edge or end pieces** (Med) —
  every path tile is a full square; a cart track cannot turn, stairs cannot end, mosaic has no border. → Path sets with
  edges/corners (or blend masks, see T-53).

## F. Ground blending (grass into paths, dirt, sand, stone)

- **[T-52] Painted paths end in staircase blocks with hard square edges** (High, the example the user gave) — on Main the
  museum path (84 `path_flagstone`), the plaza gravel road (73 `path_gravel`), brick plaza (32) and cobble (12) are full
  squares straight onto grass; diagonal runs are 32px stair-steps. `BLEND` in `src/groundblend.js` only knows
  `dirt_1/dirt_2/rock_1/rock_2`. → Blend every ground type: a generic grass-over-X edge mask (the existing `cornerMask`
  rim + shadow) composited over any painted tile, and diagonal pieces so paths can run at 45°. Shots:
  [main-museum-path-3x.png](shots/terrain/main-museum-path-3x.png), [main-plaza-3x.png](shots/terrain/main-plaza-3x.png)
- **[T-53] Blending only happens against plain grass, never sand, never between two painted grounds** (High) — `blendAt`
  requires `isGrass` = all four corners `2`; painted dirt on a beach (Main's bay dirt squares), the Skull Isle camp, the
  Badlands dirt, Temple jungle grass, Tomb sand_2, North snow, Reef wet sand all meet the sand rim in hard staircases, and
  dirt meets rock in a straight seam (Main plaza). → Blend by material priority (sand < dirt < grass < rock …) with an edge
  mask between any two. Shots: [exp-badlands-day-full.png](shots/terrain/full/exp-badlands-day-full.png), [temple-jungle-staircase-3x.png](shots/terrain/temple-jungle-staircase-3x.png),
  [main-plaza-ring-mismatch-4x.png](shots/terrain/main-plaza-ring-mismatch-4x.png)
- **[T-54] The blend ring is a different texture from the painted field** (Med) — `BLEND` maps `dirt_2 → grass_dirt` (whose
  under is `dirtPixel(0)` = dirt_1) and `rock_2 → grass_rock` (under `stonePixel(0)` = rock_1), and a `0000` cell returns
  `dirt_1`/`rock_1`; so every dirt_2/rock_2 patch has a one-tile ring of the other texture around it (Main plaza: cave-floor
  squares inside a rock_1 ring). → Edge tiles per ground tile (or transparent grass-overlay edges so the real ground shows).
  Shots: [main-plaza-ring-mismatch-4x.png](shots/terrain/main-plaza-ring-mismatch-4x.png), [main-dirt2-ring-4x.png](shots/terrain/main-dirt2-ring-4x.png)
- **[T-55] Edge tiles use one grass variant, interiors another** (Low) — `grass_sand` is drawn with `grassPixel(GRASS,0)`,
  `grass_dirt` with variant 1, `grass_rock` with variant 2, while interiors cycle 1-2-1-3; the tuft pattern changes at the
  edge ring. → Transparent edge overlays (T-15) fix this for free.
- **[T-56] Grass edges are a flat 1px outline with no overhang** (Low) — every grass edge is `GRASS[0]` rim + 1-2px shadow;
  no blades poking over the path/sand. → 1-3px grass tufts overlapping the lower material on the top/side edges
  (Pokémon gen 4 path edges).
- **[T-57] Snow-on-rock edge ring doesn't match the snow tile** (Low) — `snow_rock_*` fills with a plain 2-tone white while
  full cells use the blotchy `snow` tile, giving a visible square patchwork. Shot: [blob-snow_rock.png](shots/terrain/blob-snow_rock.png)
- **[T-58] Tall grass is laid as dark rectangles with stacked row seams** (Med) — 109 `tall_grass` on Main form hard-edged
  rectangles and staircases; each tile row's comb of blades starts at the tile bottom, so a field shows a horizontal band
  every 32px (reads as stacked hedges); also grows out of bare stone on Thieves' Rock. → Edge pieces where tall grass meets
  lawn (shorter, sparser blades), blade tops jittered across rows, colour lighter at tips; no tall grass on rock.
  Shots: [main-tallgrass-rows-4x.png](shots/terrain/main-tallgrass-rows-4x.png), [main-east-edge-3x.png](shots/terrain/main-east-edge-3x.png), [exp-heist-day-full.png](shots/terrain/full/exp-heist-day-full.png)

## G. Cliffs, ledges, mountains, caves

- **[T-59] Cliff face reads as stacked wooden planks** (Med) — `cliffFace`: brown horizontal strata 6px apart with a light
  top line, plus the same two "crow's-foot" cracks per tile; it matches the dock wood more than rock. → Rock face with
  chunky irregular blocks, vertical fractures, darker toward the base, moss/roots on top; greyer palette or warm
  sandstone, never plank-brown. Shots: [cliff-plateau-4x.png](shots/terrain/cliff-plateau-4x.png), [main-river-3x.png](shots/terrain/main-river-3x.png)
- **[T-60] Plateaus are cardboard boxes: no side walls, no height** (High) — the cliff set only has a front face; the sides
  of a plateau are a 1px black line (`cliff_top_l`, `cliff_face_l`) and the plateau top is the same lawn as the ground below,
  so cliffs read as a brown fence strip across the grass (far isle, Main, Island One rocky rise). `cliff_side_l/r` exists but
  its rock strip stops dead at the top corner. → Full cliff set: left/right side faces in 3/4 view, inner/outer corners,
  a top lip that is lighter/raised, a darker foot shadow, plus a 2nd "elevation" grass tint. Shots:
  [isle1-cliffs-2x.png](shots/terrain/isle1-cliffs-2x.png), [cliff-plateau-4x.png](shots/terrain/cliff-plateau-4x.png), [sample-island-pond-4x.png](shots/terrain/sample-island-pond-4x.png)
- **[T-61] Cliff stairs stick up a tile above the cliff lip and leave rock stubs at the foot** (Med) — Main's two stair runs
  start on the plateau grass one tile above the lip; `cliff_stairs` in the base row lacks the foot shadow, so rock face shows
  beside the bottom step below the neighbours' foot line. Stairs are a flat ladder with no side walls. → Stair top piece
  that cuts into the lip, stair bottom piece with the foot, side cheeks. Shots: [main-waterfall-foot-5x.png](shots/terrain/main-waterfall-foot-5x.png),
  [cliff-plateau-4x.png](shots/terrain/cliff-plateau-4x.png)
- **[T-62] Cliff end pieces repeated mid-run draw vertical stripes** (Low) — the far isle uses 11 `cliff_base_r` in a row,
  each with its right-edge black line, making a picket fence. → Auto-tile cliffs from neighbours; builder should only offer
  "cliff" and pick ends itself. Shot: [isle1-cliffs-2x.png](shots/terrain/isle1-cliffs-2x.png)
- **[T-63] Cliffs stand straight on sand or water with no foot** (Med) — Main's lower cliff face meets beach sand and sea
  without `cliff_base`, no shadow, no rubble, no foam (see T-18). → Base pieces for sand and water feet.
- **[T-64] Ledges read as a garden rail** (Med) — `ledge`: a single 3px brown bar with a black outline and 6px end ticks;
  nothing says "hop down". → Pokémon ledge: rounded grass lip, 3-4px lit earth face, shadow below, end curls.
  Shots: [cliff-plateau-4x.png](shots/terrain/cliff-plateau-4x.png), [main-east-edge-3x.png](shots/terrain/main-east-edge-3x.png) (stray single ledge on Main's lawn)
- **[T-65] Mountain walls are quilted octagons with no edges** (Med) — `mountain_1/2` = 16px rounded slabs in a grid with a
  diagonal bevel: upholstery, not rock; no top/side/foot pieces, so every mountain block is a hard rectangle; `mountain_snow`
  is the same with a white band. Main embeds a grey mountain band in the brown cliff face. → Mountain/rock-wall auto-tile set
  with silhouette tops, ridge highlights and a foot. Shots: [mountain-cave-4x.png](shots/terrain/mountain-cave-4x.png), [main-river-3x.png](shots/terrain/main-river-3x.png)
- **[T-66] Cave mouth is a flat black arch** (Low) — `cave`: black ellipse with a 2px brown rim, black to the bottom edge,
  no rock lintel, no floor, no inner gradient; on Main a grey stone cave piece sits on the brown cliff (two materials).
  → Rocky arch with lit lintel stones, dark-to-black gradient inside, floor pebbles spilling out. Shot: [mountain-cave-4x.png](shots/terrain/mountain-cave-4x.png)

## H. Trees and foliage

- **[T-67] Every 2×3 leafy tree has the same silhouette: forests are walls of identical broccoli** (High) — `addNaturalTrees`
  `big()` gives tree/apple/orange/cherry/maple the same crown `{cx:32, cy:38, rx:26, ry:25}` and trunk; only the noise seed
  changes. Main has 170 `oak_tree` + 60 `cherry_tree` in one block behind the museum: a carpet of the same canopy, same
  lighting, same height, trunks in rows. → 3-4 silhouettes per species (tall/round/lopsided/young), ±10% scale, hue jitter,
  occasional flip; forests need edge trees, undergrowth and gaps. Shots: [main-forest-2x.png](shots/terrain/main-forest-2x.png),
  [main-museum-path-3x.png](shots/terrain/main-museum-path-3x.png)
- **[T-68] Palm crown is a wispy feather duster; the top third of the tile is empty** (Med) — `foliage.palm`: fronds are
  1px ribs with 1px leaflets, no outline, so at phone size the palm is a ringed pole with green fuzz; crown sits at `h*0.3`,
  leaving ~30px of empty canvas; trunk rings every ~4px look like stacked boxes; coconuts barely visible.
  → Fronds 3-4px wide with a dark outline and lit top edge, crown at the tile top, 6-8 fronds, 3 chunky coconuts,
  softer ring texture. Shot: [trees-a-4x.png](shots/terrain/trees-a-4x.png)
- **[T-69] Pine is half the height of a leafy tree** (Med) — `pine` 1×2 (64px) beside 2×3 (96px) trees and a 1.15× player;
  pines read as shrubs; palette `#123a26` goes near-black at night. → 1×3 or 2×3 conifer, lighter mid-tones, 2 sizes.
  Shots: [trees-a-4x.png](shots/terrain/trees-a-4x.png), [main-forest-2x.png](shots/terrain/main-forest-2x.png)
- **[T-70] Birch crown is a skinny column of blobs offset left of the trunk** (Low) — `birch_tree` 1×3 crown rx 14 vs a
  5px trunk; looks like a lollipop. → 2×3 birch with a lighter, airier crown centred on the trunk. Shot: [trees-b-3x.png](shots/terrain/trees-b-3x.png)
- **[T-71] Oak has a separate ball stuck on top** (Low) — one high clump pokes above the crown like a hat. → Clamp top clumps
  inside the crown silhouette. Shot: [trees-b-3x.png](shots/terrain/trees-b-3x.png)
- **[T-72] Fruit trees are polka-dotted with 2×2 squares, some on the outline** (Low) — `dots` draws apples/oranges as flat
  2×2 squares at 7-8% density across the crown including the dark rim. → 3×3 fruit with a highlight pixel and a dark
  underside, only inside the lit half. Shot: [trees-a-4x.png](shots/terrain/trees-a-4x.png)
- **[T-73] Maple crown top is torn into stray red pixels** (Low) — the ragged-edge noise leaves 1px dark-red specks floating
  above the canopy. → Clean the edge with a 1-pixel erosion pass. Shot: [trees-a-4x.png](shots/terrain/trees-a-4x.png)
- **[T-74] Two tree art systems; the old flat ones still ship** (Med) — `addTrees` (round ellipse canopies with thick black
  outline, flat fills) is overwritten for most names by `addNaturalTrees`, but `dead_tree` and `fallen_leaves` (addTrees),
  `stump`, `log`, `vines`, `mushrooms` (addPlants) and roses/hydrangea/hibiscus/monstera (addFlowers) remain
  old-style next to the soft natural trees; the overwritten old trees are dead code. `dead_tree` is straight 3px rectangles in flat grey-brown with a hard ellipse
  shadow. → Redraw dead tree/stump/log in the foliage style (bark ramps, no black outline), delete dead code.
  Shots: [trees-b-3x.png](shots/terrain/trees-b-3x.png), [plants-5x.png](shots/terrain/plants-5x.png)
- **[T-75] Flame tree is a flat pancake on a kinked stick** (Low) — `tropical_tree` natural: crown ry 15 flattened, red/orange
  confetti squares, thin trunk with kinks. → Umbrella crown with layered underside shading and clustered blossom.
- **[T-76] Tree shadows are smooth gradients; everything else has hard ellipses** (Med) — `foliage.softShadow` uses
  `createRadialGradient` (anti-aliased, 50+ alpha levels) while rocks, flowers, dead tree, bushes, props use flat
  `rgba(0,0,0,0.25)` ellipses and the player a Phaser ellipse. → One shadow language: 2-tone pixel ellipse (darker core,
  lighter rim) at a fixed alpha, offset slightly right (light from top-left). Shots: [trees-a-4x.png](shots/terrain/trees-a-4x.png), [rocks-5x.png](shots/terrain/rocks-5x.png)
- **[T-77] Hedges are flat green boxes with the same blotch every tile** (Med) — `hedge`: 28px of tile-periodic fbm with a
  black top line, no lit top face, square ends (`hedge_l/r` only darken 2px). → 3/4 hedge: lighter top surface 6-8px deep,
  leafy front, rounded end caps, base shadow. Shot: [plants-5x.png](shots/terrain/plants-5x.png)
- **[T-78] Bush shows one stray red pixel block** (Low) — natural `bush` dots chance 0.05 leaves a single 2×2 red square,
  reading as a glitch. → 0 or 4-6 berries in clusters. Shot: [plants-5x.png](shots/terrain/plants-5x.png)
- **[T-79] Hanging vines are green confetti on the ground** (Low) — `vines` is 5 squiggles on transparent; placed on grass
  (Main 6×) they have nothing to hang from. → Draw vines as a cliff/trunk overlay with a top anchor.
- **[T-80] Topiary pot is a flat orange square** (Low) — terracotta box with outline; stem/balls fine. → Tapered pot with rim
  and shading.
- **[T-81] Trunks skewer bushes when placed close** (Low) — e.g. Main's birches stand inside rose bushes and the trunk draws
  over the bush; the trunk hitbox (`TRUNKS`) is small so the builder allows it. → Builder snap/overlap warning; bushes in front
  of a trunk should sort by their own base.  Shot: [main-museum-path-3x.png](shots/terrain/main-museum-path-3x.png)

## I. Flowers and small plants

- **[T-82] Ground flowers are unreadable specks at phone size** (Med) — `flowers` (6 plus-shapes, 3px), `wildflowers` (1px
  dots), `clover` (2px squares with white squares) vanish at 4 device px per pixel; `flowers` heads float 1px above their
  stems on bob frames. → Clumps of 3-5 blooms with 2-3px petals and a leaf rosette; bob the whole stem.
  Shot: [flowers-5x.png](shots/terrain/flowers-5x.png)
- **[T-83] Inconsistent outlines: tulips are black-boxed, daisies are not** (Med) — `tulips` draw a 5×5 black frame round each
  head (reads as crayons/lollipops); roses, hydrangea, hibiscus, monstera use the thick black-outlined ellipse style (roses =
  red rectangles on a black blob, hydrangea = blue bubbles, monstera = turtle shells), while daisies/poppies/lavender and the
  natural bushes have no outline. → One outline rule for small plants (coloured dark outline, never pure black).
  Shot: [flowers-5x.png](shots/terrain/flowers-5x.png)
- **[T-84] Dune grass is invisible on sand; lavender stands on a grey puddle** (Low) — `dune_grass` is 3 hair-thin khaki lines;
  `lavender` has a flat `#6a8a5a` ellipse base that reads as a dirty disc. → 3px blades with a dark side; leafy mound base.
- **[T-85] Sunflower stems vanish into the lawn; cactus is a green Tetris piece** (Low) — sunflower stems are lawn green;
  `cactus` = flat rectangles with disconnected arms (and Main plants three on a temperate beach). → Darker stems with leaves;
  rounded cactus with ribs; keep cacti to desert islands. Shots: [garden-4x.png](shots/terrain/garden-4x.png), [main-river-3x.png](shots/terrain/main-river-3x.png)
- **[T-86] Fallen leaves / veg patch / fern are confetti or stripes** (Low) — `fallen_leaves` = 3×2 rectangles; `veg_patch`
  is a striped square with no edge to grass (40 tiled on Main form a hard brown grid); `fern` a flat dark fan. → Leaf shapes
  in 2-3 sizes; tilled-soil set with edges; fern with lit fronds.

## J. Rocks

- **[T-87] Jagged rocks, spire, standing stone, slab, arch and crystal are anti-aliased canvas polygons** (High for the 32px
  rule) — `addJaggedRocks` and `poly()` fill paths with `lineWidth 2` strokes: `rock_spire` has 171 colours and partial
  alpha edges vs 6 in `rock_big`; edges are blurry grey. The planes are two flat tones split by a 1px black ridge (paper cone).
  Their shadow is a `fillRect` bar. → Hand-pixel facets (3-4 tone ramp, crisp 1px dark outline, 1px light edge on lit facets,
  cracks), pixel ellipse shadow. Shots: [rock-spire-8x.png](shots/terrain/rock-spire-8x.png), [rocks-5x.png](shots/terrain/rocks-5x.png), [rocks-big-4x.png](shots/terrain/rocks-big-4x.png)
- **[T-88] Round rocks are smooth eggs** (Med) — `rock_big` / `rock_small` / `boulder` are 4 concentric ellipses with one
  highlight: no facets, cracks or base grit; `boulder` carries a stray "⊥" mark. → Faceted silhouettes, top-left light,
  grass tufts at the base. Shot: [rocks-big-4x.png](shots/terrain/rocks-big-4x.png)
- **[T-89] Geode reads as a giant eyeball** (Med) — purple oval in a white ring with a dark centre on grey. → Split rock showing
  a crystal cavity with angular crystals. Shot: [rocks-5x.png](shots/terrain/rocks-5x.png)
- **[T-90] Rock crack is a black lightning bolt; pebbles are dashes** (Low) — `rock_crack` 2×2 black zig-zag; `pebbles` flat
  2×1 ellipses. → Crack drawn as a darker fracture with a light edge; pebbles with a highlight pixel.
- **[T-91] Tide pool is a blue dish sitting on top of the ground** (Low) — grey ring with outline, blue oval, colour squares;
  Main places one on a lawn. → Recessed pool (rim lit at bottom, shadow at top inside), anemones/starfish as shapes, beach only.
  Shot: [rocks-big-4x.png](shots/terrain/rocks-big-4x.png)

## K. Dig tiles and small ground props

- **[T-92] `dig_spot` is defined twice; the builder shows the sparkle, the mound is lost** (Low) — `addProps` adds the mound
  `dig_spot` and later the sparkle `dig_spot`, which overwrites it; minerals look different from every other dig spot.
  → Rename one. Shot: [dig-misc-5x.png](shots/terrain/dig-misc-5x.png)
- **[T-93] Dig mounds are featureless brown loaves; the fossil tip is a matchstick** (Med) — no outline, no texture; bone tip
  = white 3×2 on a dark stick. → Disturbed-soil mound with clods, a cracked top and a clear bone/sherd peeking out.
- **[T-94] Dig cliff is a grey plaque/TV, dig trench a brown box** (Med) — `dig_cliff` = grey rectangle with a black frame
  and 3 lines; `dig_trench` = framed dark box. → Exposed rock strata with a fossil outline; an excavation pit with string
  grid and pegs. Shot: [dig-misc-5x.png](shots/terrain/dig-misc-5x.png)
- **[T-95] X mark is a jagged staircase X; fog is cotton balls in a grid** (Low) — `x_mark` 3×2 steps; `fog` the same puff
  cluster every tile. → Painted/chalk X with rough edges; fog as a large drifting overlay, not per-tile puffs.
- **[T-96] Bubbles are hollow squares** (Low) — `bubbles` uses square `R()` rings. → Round 3-5px bubbles with a highlight.
  Shot: [water-tiles-5x.png](shots/terrain/water-tiles-5x.png)

## L. Seasons

- **[T-97] Winter turns every deciduous species into the same bare tree** (Med) — `bareTree(w,h,seed)` ignores species:
  cherry, maple, apple, oak and willow get one recursive silhouette (scaled), birch is white-on-snow and invisible, the 32px
  sapling gets crushed branches; the existing `dead_tree` gets no snow at all. → Per-species winter art (willow drooping bare
  strands, oak wide, birch dark marks), snow along branch tops. Shot: [season-trees.png](shots/terrain/season-trees.png)
- **[T-98] Winter leaves summer things untouched** (Med) — orange tree keeps green leaves and oranges, roses and hydrangea
  bloom, palms stay green, tall grass stays lush green (not hidden, not snowed), beaches stay golden and the sea tropical;
  docks and flat props get no snow (depth 1 is above the 0.4 snow layer). → Winter variants for evergreens/shrubs (darker,
  snow-capped), frosted tall grass, pale winter sand and grey-blue sea, snow on docks.
  Shots: [season-plants.png](shots/terrain/season-plants.png), [winter-water.png](shots/terrain/winter-water.png)
- **[T-99] The snow blanket is mottled camouflage with speckled edges** (Med) — `snowChunk` thresholds `snowNoise` per pixel
  (`v < 0.36` grass shows), so the lawn becomes 40-50% irregular green holes with 1px speckle fringes; reads as mould.
  → Mostly full cover with clean-edged bare patches only under trees and along paths, a 1px blue-grey shadow on the snow's
  lower edges, drifts against walls. Shots: [season-pos0.png](shots/terrain/season-pos0.png), [season-trees.png](shots/terrain/season-trees.png)
- **[T-100] Snow only lands on green pixels: painted ground stays bare, flagstone mortar turns white** (Med) — `snowChunk`
  tests `g > r && g > b`, so the museum's flagstone path gets a white net in its green mortar lines while gravel, cobble,
  brick, cliffs, mountains and stairs are snow-free with square edges against the snowy lawn. → Snow per material (thin
  dusting on paths, caps on cliff lips), based on the tile, not the pixel colour. Shot: [wx-crops.png](shots/terrain/wx-crops.png) (top-left)
- **[T-101] Autumn is one orange; cherry trees stay pink** (Med) — all deciduous trees use the same `AUTUMN` ramp, so a forest
  is a single orange mass; `seasonFrames` deliberately keeps `cherry_tree` pink in autumn (Main: 60 pink trees in October);
  grass stays summer green; `fallen_leaves` is never auto-scattered. → Mix of yellow/orange/red/brown per tree, cherry goes
  red-bronze, slightly yellowed grass, leaf litter under trees. Shot: [season-trees.png](shots/terrain/season-trees.png), [season-pos0.png](shots/terrain/season-pos0.png)
- **[T-102] Spring blossom is uniform white dandruff** (Low) — `blossom()` stamps 2×2 white/pink dots on a 3px lattice at 18%
  on every deciduous tree and bush alike. → Blossom clusters on the lit side, species-specific (apple white-pink, others
  fresh light-green new leaves instead of blossom). Shot: [season-trees.png](shots/terrain/season-trees.png)
- **[T-103] No footprints in snow** (Low) — `onStep` only prints on `sand`; walking across a snowed lawn leaves nothing.
  → Snow footprints (and darker trodden trail) in winter.

## M. Weather

- **[T-104] Snow, leaves, petals (and rain) start as one straight horizontal line across the screen** (High) — `Weather`
  seeds particles from `cam.worldView` in the constructor, before the camera's first render, so every particle gets the same
  y; snow (vy 34) then crawls down the screen as a single dotted line for many seconds. Seen on Main at spawn, winter day and
  night; leaves and petals the same. → Seed from the camera's target view (scroll + size/zoom) or re-seed on the first
  update. Shot: [wx-full3.png](shots/terrain/wx-full3.png) (middle and right: one line of flakes at y≈730)
- **[T-105] Weather particles are not lit by night** (Med) — particles are depth 6001, above the night multiply (5000), so
  snowflakes and rain streaks are full-bright white on a dark night scene. → Draw under the shade, or tint by ambient.
- **[T-106] Rain is a few thin rotated rectangles; nothing gets wet** (Med) — 110 `1×9` rectangles at 6° (anti-aliased by the
  rotation), splashes are vector rings; the ground, paths and sand don't darken or gain sheen, trees don't drip, water gets no
  rain dimples; puddles are smooth Phaser ellipses (`makePuddles`) that read as grey stones. → Pixel rain streak frames in 2
  depths, splash sprites, a "wet" ground palette shift, pixel puddle tiles with a reflection highlight.
  Shots: [rain2.png](shots/terrain/rain2.png), [wx-crops.png](shots/terrain/wx-crops.png)
- **[T-107] Leaves and petals are spinning rectangles** (Low) — `Weather` uses `add.rectangle` with `setAngle`, so autumn
  leaves are 3×2 orange bars and petals 2×2 squares, all the same size, rotated off the pixel grid. → 4-6 frame pixel leaf and
  petal sprites (flip, not rotate), 2 sizes.
- **[T-108] Cloud shadows are dark navy smudges, worst on snow and water** (Med) — `cloud_shadow` = four radial gradients of
  `rgba(20,30,60,0.5)` at alpha 0.5 and depth 5990 (over everything), drifting; on the Frozen North and over the sea they look
  like oil stains or bruises; they also sit over roofs and treetops. → Much lighter (10-15% multiply), larger and softer, cool
  grey not navy; or drop them. Shots: [north-cloud-shadow-2x.png](shots/terrain/north-cloud-shadow-2x.png), [exp-wreck-day-full.png](shots/terrain/full/exp-wreck-day-full.png)
- **[T-109] Thunder is a full-screen white flash and nothing else** (Low) — `stormRumble`: `cameras.main.flash(160, 235,240,255)`.
  → Two quick flickers, a short sky brightening, optional bolt on the horizon over the sea, and a darker storm tint before it.
- **[T-110] Overcast is a flat grey multiply on top of a darker palette** (Low) — rain adds a `0x9aa4b4` MULTIPLY rectangle *and*
  the `OVERCAST` factor, so rainy noon is murky grey-green. → One overcast grade (cooler, lower contrast, not darker) plus rain.

## N. Day/night and outdoor light

- **[T-111] Night light map is quarter resolution and nearest-scaled: lights are blocky** (Med) — `lightUp` renders the shade
  into a `(W*T)/Q` render texture (Q=4 on 80×80 maps) scaled ×4 with pixelArt filtering, so light pools are made of 4×4-pixel
  squares with stair-stepped banding (very visible on the museum steps at night). → Full-res light texture or linear filtering
  on the light layer only; dithered falloff if it must stay pixelated. Shot: [wx-crops.png](shots/terrain/wx-crops.png) (bottom middle/right)
- **[T-112] Yellow light pools on grass turn acid green — even at noon** (Med) — glows are `ADD`-blended `0xffd080/0xffe4a8`
  at `0.1 + 0.5*dark`; over green grass that is lime; at noon the lanterns still wear a pale green halo, at dawn/dusk neon
  blobs. → Light pools as a warm multiply-lift (screen/overlay toward warm white), alpha 0 in daylight.
  Shots: [night-one.png](shots/terrain/night-one.png), [hours-pos2.png](shots/terrain/hours-pos2.png), [main-plaza-3x.png](shots/terrain/main-plaza-3x.png)
- **[T-113] Main Island's lamp posts never light; the museum windows are dark at night** (High) — `TILE_LIGHTS` has no
  `lamp_post` (Island One adds its lamps by hand in `placeThings`), and `mapMuseum` adds only the door glow, so on the home
  island at 22:00 the three lamp posts are dark grey sticks and the museum's windows are unlit. → Add `lamp_post` to
  `TILE_LIGHTS`; give the museum tile its two window lights. Shot: [night-main.png](shots/terrain/night-main.png),
  [wx-crops.png](shots/terrain/wx-crops.png) (bottom right)
- **[T-114] Lighthouse beam uses the picture-light texture** (Med) — `lightTextures()` already creates `lt_beam` (32×64
  vertical gradient for paintings), so `lightUp`'s `if (!exists('lt_beam'))` never makes the 256×64 cone; the lighthouse
  sweeps a soft square slab. → Give the beam its own key (`lt_lighthouse`), a long thin cone with a bright core.
  Shot: [beam-sheet.png](shots/terrain/beam-sheet.png)
- **[T-115] No night-specific nature** (Low) — no moon glint path on water, no stars reflected, no lit windows on the far
  isle/expedition structures, fireflies only from critters; dawn (06:00) is a flat murky grey-green. → Moon glint strip on the
  sea, warmer pink-orange dawn grade. Shot: [hours-pos0.png](shots/terrain/hours-pos0.png)
- **[T-116] Non-integer camera zoom gives uneven pixels** (Low) — `cam.setZoom(width / (9*32))` = 4.0625 device px per game
  pixel on a 390pt iPhone, so one in ~16 pixel columns is 5 px wide; tiles shimmer slightly while scrolling. → Integer zoom
  (4×, ≈9.1 tiles wide) with the leftover as margin, or roundPixels on the camera.

## O. Expedition islands (one look each)

- **[T-117] Every expedition island is an octagon of painted squares inside a sand ring** (High) — Badlands (dirt_2),
  Thieves' Rock (rock_2), Frozen North (snow), Lost Temple (grass_jungle), Sandstone Tomb (sand_2), Drowned Reef (sand_wet):
  the whole interior is one painted tile, staircase-edged against a 1-3 tile golden beach, with no transitions (T-53), so the
  seven islands share one shape and one beach. → Biome terrain in the corner map (so it gets real edges), unique coastlines
  (cliffs, mangroves, ice shelf, reef), biome-specific beach/water colours.
  Shots: shots/terrain/full/exp-*-day-full.png
- **[T-118] Red Badlands isn't red; grey rock squares are dotted across it like missing textures** (Med) — 30 rock_2 and 28
  rock_1 single cells sit as isolated grey squares in brown dirt; the "red" island is mid brown. → Red/orange mesa palette,
  rock outcrops as props with edges, mesa cliffs. Shot: [exp-badlands-day-full.png](shots/terrain/full/exp-badlands-day-full.png)
- **[T-119] Frozen North has a tropical beach and sea** (Med) — snow island ringed with warm `SAND` and the standard blue sea;
  no ice floes, no dark cold water; cloud shadows bruise the snow. → Grey shingle/ice-shelf edge, dark teal water, floating ice.
  Shot: [north-ice-snow-sand-3x.png](shots/terrain/north-ice-snow-sand-3x.png)
- **[T-120] Lost Temple reads as a flat green field with a brick box** (Low) — jungle grass staircase to the beach, trees in
  straight columns, very dark overcast grade. → Jungle edge trees, vines on the walls, mossy cobble edges.
  Shot: [temple-jungle-staircase-3x.png](shots/terrain/temple-jungle-staircase-3x.png)
- **[T-121] Drowned Reef is a mud field with the wreck on dry land** (Low) — see T-50; the hull sits mid-island, nowhere near
  water. → Wreck half in the surf, tide pools, rocks in the shallows. Shot: [exp-wreck-day-full.png](shots/terrain/full/exp-wreck-day-full.png)

## P. tiles.html sample island (dev page)

- **[T-122] The sample island shows the opaque-edge bug and props in the sea** (Low) — `drawDemo` doesn't apply "grass never
  touches the sea", so `grass_sand` overwrites the shore with a square of sand under the bush, the pond's `bank_*` paints a
  straight vertical grass edge over the beach, the sign stands in deep water beside the dock, and the plateau shows the
  box-cliff look (T-60). Good test page once edges are transparent. Shots: [sample-island-2x.png](shots/terrain/sample-island-2x.png),
  [sample-island-dock-4x.png](shots/terrain/sample-island-dock-4x.png), [sample-island-pond-4x.png](shots/terrain/sample-island-pond-4x.png), [sample-island-cliff-4x.png](shots/terrain/sample-island-cliff-4x.png)

---

## Top 10 (biggest lift for the look)

1. **Water depth + macro texture** (T-02, T-03, T-10): shallow→deep bands from a distance field, a large non-repeating wave
   texture, slate night water. Turns every coast from swimming pool to sea.
2. **Fix water clipping as a set** (T-01, T-20, T-21, T-23, T-27, T-30, T-31): solid sea half of shore tiles, bobber only on
   true open water (not docks, not your head), posts/rocks/reeds/frogs/jellies only where they belong, foam rings only on water.
3. **Transparent edge overlays + blend any material** (T-15, T-52, T-53, T-54, T-11): one edge mask system composited over any
   ground, painted tiles (incl. water) feed the corner map. Kills the staircase paths, square lakes and square beaches at once.
4. **Pond banks the right way up** (T-13, T-14, T-19): earth face + shadow on the north edge, pond palette, reeds on the rim,
   proper frozen ice.
5. **Docks and boats with depth** (T-24, T-25, T-26, T-09): pilings, side boards, shadow on water, waterline-cut boats, simple
   reflections.
6. **Tree variety** (T-67, T-69, T-68): 3-4 silhouettes per species, scale/hue jitter, taller pines, a palm with real fronds.
7. **Ground macro-variation** (T-41, T-42, T-43, T-44, T-46-T-48): world-space noise and decals so lawns, rock, dirt, sand and
   paths stop reading as wallpaper.
8. **Weather and season bugs** (T-104, T-105, T-100, T-101, T-97): seed weather correctly, light it at night, snow by material,
   per-species winter/autumn looks.
9. **Cliff set with sides, corners, feet and real stairs** (T-59-T-63, T-65): plateaus that read as height, not fences.
10. **Outdoor light** (T-111-T-114): full-res light map, warm (not lime) pools off in daylight, Main's lamp posts and museum
    windows lit, a real lighthouse cone.

## Systemic issues

- **Tile-periodic noise everywhere.** Almost every ground, edge and water tile uses noise that repeats exactly at 32px
  (`tnoise`/`fbm` wrap per tile, fixed tuft/crest positions). Seams are rare, but the repetition is visible on every big area:
  lawns, sea, rock, dirt, cobble, sand, snow, wet-sand bumps. The fix is world-space noise plus more variants plus decals.
- **Painted tiles live outside the terrain model.** The builder's tile layer (`map.tiles`) is drawn over the corner terrain
  with no edges, no collision meaning for `ground_()`, no seasons and no awareness of what is under it. That one design gap
  produces square lakes, staircase paths, walls over the sea, dirt piers, bobbers on docks, unfrozen painted water and
  snowless paths. Either painted ground/water writes into the corner map, or it gets its own auto-tiling and metadata.
- **Edge tiles are opaque composites** (`edgeTile` bakes the lower material in), so any junction of three materials and any
  painted ground beside an edge breaks into squares. Edges should be transparent overlays of the upper material only.
- **"Water" means two different things.** Collision uses 3+ wet corners, `ground_()` uses 2+; critters, glints, jellies,
  fishing and the player each pick one, which is why things stand in the sea or glow on the sand. One definition (a per-pixel
  or half-tile water mask) should drive collision, spawning and fishing.
- **Nothing is cut by a waterline.** Boats, posts, rocks, ducks, dolphins, frogs and the player are all drawn whole on top of
  water with their full bottom outline; there are no reflections. A shared "in water" treatment (mask the lower N px, tint,
  ripple ring) would fix the whole family.
- **Three visual languages side by side.** Natural foliage (soft ramps, no black outline, gradient shadows), old code-drawn
  props (flat fills, thick black outlines, hard ellipse shadows: dead tree, stump, log, roses, hydrangea, monstera, tulips,
  rocks), and canvas vector shapes (anti-aliased jagged rocks/spire/slab/arch/crystal, Phaser ellipses for ripples, puddles,
  shadows, rain). Pick one: hand-pixel, coloured outlines, 2-tone pixel shadows, no anti-aliasing, no runtime rotation.
- **Runtime rotation of pixel art** (`setAngle` on lily pads, turtles, bottle, dolphins, leaves, petals, rain) produces mixels;
  use pre-drawn frames.
- **Seasons and night are filters, not art.** Winter is "snow on green pixels + one bare tree", autumn one orange ramp,
  spring white dots, night a multiply with ADD glows. They miss non-green surfaces, keep summer flowers in snow, turn light
  pools lime, and leave weather unlit.

## Keep (already works)

- Corner-based shore/edge system is sound and seams line up between tiles; only its noise and opacity need work.
- The natural leafy tree renderer (`foliage.leafy`) — clump crowns, top-left light, ragged edge, branches through gaps —
  is a good base; it needs variety, not replacement. The willow is the best tree in the set.
- Shore foam + wet-sand band reads as a beach at phone size; the shore ebb animation is a nice idea.
- Torches, campfire and the Island One museum windows at night read warm and cozy.
- Island One (code-drawn) is the most coherent outdoor scene: beach coves, lagoons, cottage meadow.
- Tall grass hiding the legs, sand footprints and shore splash rings are good feel touches.
