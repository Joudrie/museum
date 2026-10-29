# Structures, landmarks and props: art-direction audit

> Part of the aesthetics audit (29 Oct 2026, commit fa70331). Overview: [../AESTHETICS-AUDIT.md](../AESTHETICS-AUDIT.md). Visual version with every screenshot: https://claude.ai/artifact/5TdJk17Mx4g36tciuXPfvW (private to the owner).


Auditor domain: outdoor structures, landmarks and props (museum exterior, every building, statues, fountains,
scarecrow, garden/park props, docks and boats as structures, dig sites, puzzle pieces, hunts, expedition props and
islands, boat scene, the angled iso room, builder room pieces placed on islands) plus their placement, depth sort,
shadows, night lighting and season/holiday variants.

How it was looked at: every tile in the Buildings / Garden & park / Grounds & garden / Props / Puzzles / Dig sites /
Expedition groups was cut from the tiles.html sheet and upscaled 5-10x (`shots/structures/sheet-*.png`); then every
placement was screenshotted in the running game at real phone size (390x844, camera zoom 4.06 = the game's own) and
close (camera zoom 6-14) on Main Island, Island One, the far isle (isle-1), all seven expedition islands, the puzzle
yard (content/maps/puzzle-yard.json loaded as mapData), the iso room and the boat scene, with `?hour=12`, `?hour=22`,
`?season=winter`, `?holiday=halloween` and `?holiday=winter`.

Note for anyone reading the shots: in close-ups where the player was hidden, the lone grey ellipse in the middle of
the frame is the hidden player's shadow (an artefact of my capture script), not a game bug.

Shots are in `docs/aesthetics/shots/structures/`; file names below link to them.

---

## 1. The museum exterior (Main Island and Island One)

Code: `museumCanvas()` in `src/landmarks.js` (one 256x192 canvas, 8x6 tiles), placed by `placeMuseum()` (Island One)
and `mapMuseum()` (builder maps) in `src/IslandScene.js`.

- **[S-01] The museum is a flat billboard in a 3/4 world** (High) — `museumCanvas`. Pure front elevation: no roof
  plane, no side walls, no depth to the portico, no ground shadow. Every tree, rock and character around it is drawn
  3/4 top-down, so the museum reads as a cardboard cut-out stood on the lawn; on Main Island the tree canopy meets the
  pediment outline directly with nothing behind it. → Redraw as a 3/4 building: visible roof slab running back
  (lead/copper grey-green with a ridge), a 1-tile-deep portico whose columns cast shadow on the wall behind, side
  walls showing as thin darker returns, a continuous stylobate (stone base) under the whole front, and a soft
  contact shadow. Build it as the facade kit the art bible asks for (doors, window bays, column bays, cornice, wings
  in 2-tile steps). Shots: [sheet-museum-4x.png](shots/structures/sheet-museum-4x.png), [mm-behind-roof-z6-day.png](shots/structures/mm-behind-roof-z6-day.png)

- **[S-02] Walls read as wooden clapboard siding, not stone** (High) — `museumCanvas` "walls": a 1px `#bfb5a2` line
  every 8px across the whole wall, no vertical joints. At phone size the "grand stone museum" looks like a painted
  timber house. → Ashlar: offset blocks 16x8 with 1px mortar both ways, a darker rusticated base course, slight
  per-block tone variation, top-left light. Shot: [museum-left-bay-6x.png](shots/structures/museum-left-bay-6x.png)

- **[S-03] Columns are flat white strips glued to the wall** (High) — `museumCanvas` columns `[20, 58, 198, 236]`.
  Each column is a 16px rectangle with a 4px white stripe and a 3px grey stripe, a 4px slab for capital and base,
  no fluting, no entasis, no capital volutes, and they touch the wall with no shadow. They are bunched in two pairs
  at the ends, leaving the 140px middle bay with no columns at all, so it reads as pilasters on a house rather than
  a temple portico. → Six or eight evenly spaced columns across the front, each with a 2-tone fluted shaft, a
  simple Doric/Ionic capital (2-3px abacus + echinus), a base torus, and a 2-3px wall shadow to the right of each.
  Shot: [mm-facade-left-z9-day.png](shots/structures/mm-facade-left-z9-day.png)

- **[S-04] "CURATION" is system-font text, anti-aliased, on a brown plank** (High) — `museumCanvas`:
  `g.font = 'bold 9px monospace'; g.fillText('CURATION', ...)`. The glyphs come out blurry with mid-tone fringe
  pixels and the font changes per device. A dark-brown wooden board on a marble pediment also looks like a shop
  sign. → Hand-pixelled carved lettering: 5px-tall serif capitals cut into the frieze (1px dark inner shadow top-
  left, 1px light lower-right), or gilt letters on the stone. Shot: [museum-pediment-sign-8x.png](shots/structures/museum-pediment-sign-8x.png)

- **[S-05] Pediment and slopes are anti-aliased canvas paths** (Med) — `tri()` in `museumCanvas` uses
  `beginPath/fill`, so the roof slopes have grey half-alpha stair pixels (300 semi-transparent pixels in the
  sprite, 208 distinct colours in what should be a ~12-colour sprite). Breaks the pixel look next to the crisp
  tiles. → Draw slopes as hard 2:1 pixel stairs; add a tympanum relief or an acroterion at the apex and cornice
  dentils so the triangle isn't an empty cream wedge.

- **[S-06] The cornice is a floating slab wider than the building** (Med) — `R(0, 50, w, 10, OUT)` spans the full
  256px while the walls start at x=6. It overhangs both ends by 6px with nothing under it, reading like a shelf
  laid on top. → Entablature with architrave / frieze / cornice bands that return at the corners; overhang ≤2px.

- **[S-07] Windows are flat mustard rectangles, the same by day and night** (High) — `museumCanvas` windows
  `#f2c86a` with a black cross. No frame, sill, lintel or glass. By day they look like yellow sticky notes; on Main
  Island at night they stay dull mustard with no glow (see S-12). → Tall arched gallery windows with a stone
  surround, mullions, 2-tone glass that reflects sky by day (pale blue-grey + 1px highlight), a separate lit
  frame (warm gradient, interior shapes) for dusk/night.

- **[S-08] Doors are a yellow block with brown slabs, open forever** (Med) — `museumCanvas` "double doors":
  `#f2d9a0` fill, two 9px brown leaves, an inner `#e8c070` rectangle. No architrave, no transom, no handles, no
  floor seen inside. On Island One, whose doors are locked (`f.locked` toast), they are drawn identically wide open
  and glowing. → Bronze/oak double doors in a carved surround with a fanlight; an "open" state that shows a sliver
  of lit hall floor and a "shut" state (closed leaves, no glow) used on Island One. Shots:
  [mm-door-mats-z12-day.png](shots/structures/mm-door-mats-z12-day.png), [one-garden-z8.png](shots/structures/one-garden-z8.png)

- **[S-09] Steps are three outlined bars with no tread/riser** (Med) — `museumCanvas` steps loop. Each step is a flat
  8px band boxed in black; nothing tells you which face is horizontal. In winter only 2-3 snow pixels land on one
  corner. → Treads light (top-lit), risers one tone darker, a 1px shadow under each nosing, cheek walls (plinths for
  urns or lions) at the sides. Shot: [mm-door-mats-z12-day.png](shots/structures/mm-door-mats-z12-day.png)

- **[S-10] Museum is small for the landmark of the game** (Med) — 8x6 tiles. Its door is 44px vs a 27px player and
  it is only 2.7x the width of the 3x3 cottage; on an 80x80 map it is lost among 170 oak trees. → Make it the
  biggest silhouette on the island (10-12 tiles wide with wings, a dome or attic storey, banners), and clear a
  plaza in front so it reads from a distance.

- **[S-11] Trees bury the museum on Main Island** (High) — `src/maps/main-island.json`: ~90 oak and cherry trees are
  packed edge-to-edge from y=192 to y=416 behind and beside the museum (cherry trees at (1408,384),(1440,384) sit on
  its left corner). The pediment pokes into a solid wall of canopy, trunks peek out beside the walls, in autumn the
  wall is still pink blossom and in winter it becomes a black-brown scribble mass of bare branches behind the roof.
  → Keep a clear band of lawn/sky behind the roof line; frame the building with 2-4 deliberate specimen trees and
  clipped topiary. Shots: [mm-behind-roof-z6-day.png](shots/structures/mm-behind-roof-z6-day.png), [mm-facade-left-z9-winter.png](shots/structures/mm-facade-left-z9-winter.png), [mm-phone-front-hallow-crop.png](shots/structures/mm-phone-front-hallow-crop.png)

- **[S-12] Main Island museum windows never light at night** (High) — `mapMuseum()` only adds the door light; the
  two window lights exist only in `placeMuseum()` (Island One). So the home museum is dark-windowed at 22:00 while
  the locked one on Island One glows. → One light set for every museum, from the same function; lit window sprite
  (see S-07). Shot: [night-main-pair.png](shots/structures/night-main-pair.png) (left), [one-museum-night-hallow-phone.png](shots/structures/one-museum-night-hallow-phone.png)

- **[S-13] The "crates/boxes" beside the Main Island museum are empty LPC sandstone pedestals** (High) — builder
  piece `p:decor/0` (statues-fountains-collection pedestal, 26x47) at (1472,529) and (1696,529). They are tan,
  brown-outlined, softly dithered LPC art with nothing on them, standing over the corner column bases; at phone size
  they read as cardboard boxes. They also get no snow in winter (room pieces skip `seasonFrames`). → Replace with
  pieces in the museum's own stone: urns with clipped bay, or a pair of reclining lions / sphinxes on plinths that
  match the facade marble, with snow caps in winter. Shots: [mm-facade-left-z9-day.png](shots/structures/mm-facade-left-z9-day.png), [decor-pieces-on-main-6x.png](shots/structures/decor-pieces-on-main-6x.png)

- **[S-14] Doormats are two red LPC rugs floating on the path, a tile below the door** (Med) — `p:decor/25` at
  (1568,590) and (1600,590), 28x18 each, a 4px gap between them, sitting on the cobbles below the bottom step rather
  than at the threshold. They read as two red pillows; at night they are the brightest thing in front of the door.
  → One wide coir/stone welcome mat or a red carpet runner from the door down the steps, in the museum palette.
  Shot: [mm-door-mats-z12-day.png](shots/structures/mm-door-mats-z12-day.png)

- **[S-15] Flag poles: a minus sign on a blue rag** (Med) — `flag_pole` (`src/scenery.js`, Garden & park). 2px pole
  with no base and a yellow square finial; the flag is 12x10 with a white 4x1 dash, so it reads as a "minus" icon.
  Both flags in front of the museum wave the same way. Winter puts a snow cap on the waving cloth. → 3px pole on a
  stone foot, a 16x10 banner with a museum crest (gold laurel or a pixel "C" monogram), 4-frame ripple, mirrored on
  the right pole, no snow on cloth. Shots: [sheet-garden-d-6x.png](shots/structures/sheet-garden-d-6x.png), [mm-phone-front-hallow-crop.png](shots/structures/mm-phone-front-hallow-crop.png)

- **[S-16] Island One museum backs straight onto the sea** (Low) — Island One layout: the pediment sits against the
  sand and surf with no ground behind, and the lighthouse is jammed against its right wall with 0px gap. → Give the
  building a lawn behind and move the lighthouse to the headland. Shots: [one-museum-phone.png](shots/structures/one-museum-phone.png), [one-lighthouse-z8.png](shots/structures/one-lighthouse-z8.png)

- **[S-17] No season or time variants on the facade** (Med) — winter only adds `snowify` 1px specks along the
  pediment slope and cornice (no snow on the roof, which doesn't exist), no icicles; autumn nothing; holidays:
  see S-117. → Snow-cap versions of roof, cornice, steps and urns; wet-stone tint in rain.

## 2. Buildings

Code: `addBuildings()` in `src/scenery.js` (cottage, beach hut, tiki hut, lighthouse, greenhouse, gazebo, windmill,
shed, tent, market stall, ice cream cart). All are front elevations, which is the root problem (see Systemic).

### Cottage (`cottage`, 3x3)
- **[S-18] Flat front elevation with a triangle roof** (High) — no roof plane receding, no side wall, a
  red triangle with horizontal stripes. → 3/4 cottage: roof slope seen from above (tiles in rows getting shorter
  toward the ridge), gable end, a visible side wall in shadow, eaves shadow on the front wall. Shot: [sheet-bldg-a-6x.png](shots/structures/sheet-bldg-a-6x.png)
- **[S-19] A timber post runs down into the door** (Med) — posts at `[9, 47, 85]` span the full wall height, so the
  middle post sits on top of the door lintel like a pole stuck in it. → Proper half-timber frame (sill beam, posts
  either side of the door, braces), or no centre post.
- **[S-20] Unfinished base: dark tick marks under the wall** (Med) — the brick joints of the bottom course poke out
  below the wall with no sill/outline, giving a ragged "stitched" bottom edge in game. → Stone footing course
  plus a 1px outline and a doorstep. Shot: [one-cottage-z8.png](shots/structures/one-cottage-z8.png)
- **[S-21] Chimney pasted on the slope** (Low) — `R(66, 10, 10, 20)` overlaps the roof outline instead of meeting it;
  smoke is three translucent grey ellipses. → Chimney with flashing where it meets the tiles; 4-frame pixel smoke.
- **[S-22] Wall bricks almost invisible** (Low) — `#e8dcc4` vs `#f2ead8` alternation; the wall reads as flat cream.
  → Whitewashed stone with 3 tones, or plaster with exposed stones at corners.

### Beach hut (`beach_hut`, 2x2)
- **[S-23] Door is a plain yellow rectangle** (Med) — `door(R, 25, 34, 14, 20, '#f2c53d')`: no knob, no panels, 20px
  tall, shorter than a person (27px). → 26px door with a porthole window and handle, a little deck.
- **[S-24] Stilt hut stands in deep water on Island One** (High) — placed at (20,30) on Island One: the hut, its
  stilts and its "steps" plank sit in the sea with no ripple at the stilts and the steps lead into water.
  → Place on the sand above the tide line, or add pier legs with foam rings and a boardwalk to it.
  Shot: [one-beachhut-z8.png](shots/structures/one-beachhut-z8.png)
- **[S-25] Roof anti-aliased; 112 colours in an 8-colour sprite** (Low) — poly fills blend into the stripes.

### Tiki hut (`tiki_hut`, 3x3)
- **[S-26] The thatch is a yellow pyramid of dashes** (Med) — regular 2px dashes in rows; reads as a straw tent or a
  cardboard cone. The eave fringe is a row of black tick marks (dashed outline). → Shaggy layered thatch with
  irregular overlapping bundles, a ragged fringe without outline ticks, darker under-eave shadow.
- **[S-27] A rail is drawn across the open doorway** (Med) — `R(22, 84, 52, 2, '#6a4a2a')` crosses the 16x22 doorway,
  so the hut looks barred. → Stop the rail at the door jambs.
- **[S-28] Left torch stands in the sea on Island One** (Med) — at (3,32) the hut's left torch and post are in the
  surf line. → Move inland or put the hut on a platform. Shot: [one-huts-z8.png](shots/structures/one-huts-z8.png)

### Lighthouse (`lighthouse`, 2x4)
- **[S-29] Door is 10x15px, half a person** (High) — `door(R, 27, 110, 10, 15)`; the player is 27px. → 14x24 door
  with steps.
- **[S-30] Base is two grey boxes either side of a door** (Med) — flat `STONE[2]` with no blocks; reads as crates.
  → Round stone plinth with block courses and a doorway arch, keeper's cottage optional.
- **[S-31] In-sprite light beam is cut square at the sprite edge and blinks** (Med) — frames 0 and 3 draw a
  translucent wedge to x=0/64 that ends with a hard vertical cut; frames 1-2 have none, so it flashes. The scene
  also adds an ADD-blend beam at night, so the two doubles up. → Drop the in-sprite wedge; keep only the scene beam,
  rotating smoothly. Shot: [lighthouse-beam-clip-6x.png](shots/structures/lighthouse-beam-clip-6x.png)
- **[S-32] Lighthouses placed inland in fields** (Med) — far isle has two, at (1120,736) and (832,1408), both standing on lawn
  among trees rather than on a headland at the water. → On headlands / rocks at the water. Shot: [isle1-contact.png](shots/structures/isle1-contact.png) (left)

### Greenhouse (`greenhouse`, 3x3)
- **[S-33] Two white glints float above the glass roof** (Med) — `fillRect(20, 26, 8, 3)` and `(56, 22, 12, 2)` lie
  outside the quadratic roof curve, so pale dashes hover in the sky above it. → Glints inside the glass, following
  the curve. Shot: [greenhouse-roof-glints-8x.png](shots/structures/greenhouse-roof-glints-8x.png)
- **[S-34] Curved roof anti-aliased; door is a translucent rectangle** (Low) — `quadraticCurveTo` fill; the door is
  `rgba(200,232,224,0.9)` with no frame. → Stepped pixel arc with mullions; framed door.
- **[S-35] "Brick wall" is drawn as wooden planks** (Low) — `#a87a4a` with vertical lines. → Real brick knee wall.

### Gazebo (`gazebo`, 3x3)
- **[S-36] Open frame with no back, no floor inside** (Med) — four front posts and a floor slab at the bottom only;
  grass shows through the middle so it reads as a flat stage set. The scalloped trim is a row of dark-green teeth.
  `walk: 'block'` so you can't step in. → Octagonal 3/4 gazebo: floor disc seen from above, back posts and rail
  visible inside, bench, walk-in floor. Shot: [sheet-bldg-c-6x.png](shots/structures/sheet-bldg-c-6x.png)

### Windmill (`windmill`, 3x4)
- **[S-37] Sails are computed rotations: jaggy, broken lattice** (High) — sails rotated by `(f*PI)/8` with canvas
  polygons and stroked spars; frame 1 shows smeared diagonal sails with gaps in the lattice (the art bible forbids
  rotated sprites). → Hand-drawn 4-frame sail cycle (0°, 22.5°, 45°, 67.5°) with clean pixel lattice.
  Shot: [windmill-frame1-6x.png](shots/structures/windmill-frame1-6x.png)
- **[S-38] Cap is a tiny hat on a flat-topped tower** (Med) — the brown cap triangle (30..66) is narrower than the
  tower top; the sail on frame 0 covers the only window. → Boat-shaped cap wider than the tower, a stage/balcony,
  window placed clear of the sail arc.
- **[S-39] Windmills buried / cut off on Main Island** (Med) — four windmills; (2240,-32) has its top 32px above the
  map (camera is bounded at 0, so the sails are cut), (1376,32) disappears in the oak mass. Shot: [mt-windmill-1376-z6.png](shots/structures/mt-windmill-1376-z6.png)

### Shed, tent, market stall, ice cream cart
- **[S-40] Shed: door same green as the wall, rake is a grey "T"** (Low) — `door(..., '#5a7a4a')` on `#6a8a5a`; the
  rake (`R(46,40,2,20)` + `R(43,38,8,2)`) reads as a T. → Contrasting door colour, a real rake with tines.
- **[S-41] Tent: fuzzy anti-aliased triangle with a smeared flag** (Med) — `poly` fills; no guy ropes, two brown stubs
  as pegs. In snow the "snow" is a dashed dotted outline along the edges. → Pixel A-frame tent with ropes and pegs,
  a canvas seam, a proper snow cap. Shots: [isle1-camp-z8.png](shots/structures/isle1-camp-z8.png), [exp-north-tent-z8.png](shots/structures/exp-north-tent-z8.png)
- **[S-42] Two `tent` definitions; one is dead** (Low) — `src/tiles.js` Expedition "Camp tent" and
  `src/scenery.js` Buildings tent share the name; the later one wins. → One tent.
- **[S-43] Market stall: fruit are coloured rectangles; awning scallops overflow** (Med) — fruit are 6x4 boxes with
  a white pixel; the scallop row extends past the awning outline on the right. → Round fruit/veg piles in crates,
  scallops clipped to the awning, a cloth behind the counter.
- **[S-44] Ice cream cart umbrella is a string of six balls** (Med) — six ellipses side by side; reads as beads or
  balloons. → A real parasol canopy (fan segments), a cart with a push handle and a cone sign that reads.

## 3. Statues, fountains, scarecrow, wells

- **[S-45] Scarecrow reads as a man standing in a blue box** (High) — `scarecrow` in `addGardenProps()`,
  `src/scenery.js`. The head is a smooth cream ellipse with two 2x2 black eyes and a 5x1 smile (a human face, no
  sack), the "shirt" is a 12x16 blue rectangle with a red band, there are no sleeves (the cross-bar is bare wood with
  3x4 yellow nubs as hands) and the "legs" are two 2x4 yellow tufts. On Island One I first read it as a villager.
  → Burlap sack head (2-tone tan with a 1px weave dither, stitched X eyes, stitched zig-zag mouth, rope at the
  neck), a patched plaid shirt whose sleeves run along the cross-bar with straw poking from the cuffs and hem, a
  floppy hat with a patch, maybe a crow on one arm. Shots: [scarecrow-frames-8x.png](shots/structures/scarecrow-frames-8x.png), [one-scarecrow-well-z10.png](shots/structures/one-scarecrow-well-z10.png)
- **[S-46] Scarecrow is twice a person's height** (Med) — 55px from hat to foot against a 27px player.
  → ~36-40px total (head at roughly person-head height, post below). Shot: [scarecrow-vs-person-scale-4x.png](shots/structures/scarecrow-vs-person-scale-4x.png)
- **[S-47] Scarecrow sway slides the arms over a still body** (Med) — `sway = f % 2` moves only the cross-bar and
  hands 1px; the shirt and head stay, so arms visibly detach. 4 frames but only 2 poses. → Sway the whole figure
  1px from the post top, or flutter sleeve tips/straw; 3-4 distinct frames.
- **[S-48] "Statue" is a green finger in a white tub** (High) — `statue_plinth` in `addGardenProps()`. A 6x25 green
  bar with a merged blob head and a 1px-wide raised "arm"; no shoulders, legs or pose; the plinth is a plain white box.
  Reads as a cactus/cucumber in a planter or a thumbs-up. → A real 1x2 statue: white marble or verdigris bronze
  figure in contrapposto with distinct head, shoulders, raised arm holding a torch/wreath, drapery folds
  (3 tones, top-left light), on a plinth with cornice and base moulding and a plaque. Shots: [sheet-garden-b-8x.png](shots/structures/sheet-garden-b-8x.png),
  [statues-vs-person-8x.png](shots/structures/statues-vs-person-8x.png)
- **[S-49] Stone head (moai) reads as a robot / bin** (High) — `statue_head` in `src/tiles.js`. A grey box with
  two black bars for eyes, a rectangle nose, a bar mouth, a lid slab on top and a hard vertical light/dark split.
  → Tall moai head: heavy brow ledge, deep eye sockets in shadow (no black bars), long nose, pursed lips, long ears,
  jaw, weathered pitted stone with lichen, half-buried torso. Shot: [mt-statuehead-z12.png](shots/structures/mt-statuehead-z12.png)
- **[S-50] Moai used for every culture** (Med) — the same head stands in the Egyptian tomb (exp-tomb), the jungle
  temple (exp-temple), Main Island and the far isle. → One statue per culture: Egyptian seated pharaoh/sphinx head,
  Mayan stela/carved head, Greek kouros for the museum lawn. Shots: [exp-tomb-phone.png](shots/structures/exp-tomb-phone.png), [exp-temple-phone.png](shots/structures/exp-temple-phone.png)
- **[S-51] The fountain statues in front of the Main Island museum are brown lumps** (High) — builder piece
  `p:decor/2` (statues-fountains-collection `fountain64x64`, 62x64) at (1472,640) and (1664,640). The centre is an
  18px tan block with a crooked flat top (no figure, no spout, no jet); the ring is the same sandstone browns, the
  water is a still murky teal unlike the game's blue, and a baked black crescent shadow sits on the lower right.
  At phone size each reads as a tree stump in a brown tyre. → Marble basins in the museum's stone, a tiered bowl or
  a classical figure pouring an urn, an animated jet/spill (3-4 frames), blue water matching `WATER`, soft ellipse
  shadow. Shots: [mm-fountain-z12-day.png](shots/structures/mm-fountain-z12-day.png), [builder-decor-statues-fountains-6x.png](shots/structures/builder-decor-statues-fountains-6x.png)
- **[S-52] The fountain's 3 animation frames became 3 separate builder pieces** (Med) — `decor/2`, `decor/3`,
  `decor/4` are near-identical (the water ripple shifts), so the fountain never animates on the island and the
  palette shows three "different" fountains. → Slice it as one animated piece. Shot: [builder-decor-statues-fountains-6x.png](shots/structures/builder-decor-statues-fountains-6x.png)
- **[S-53] Gold foo dog is a different art style** (Med) — `p:decor/1` (Main Island (1696,1224)): detailed LPC soft
  shading with brown outlines, shiny gold, next to code-drawn black-outlined flat props. → Redraw in the game style
  or bring every lawn statue up to this level; stone (not gold) for outdoors. Shot: [mt-foodog-z12.png](shots/structures/mt-foodog-z12.png)
- **[S-54] Code fountain: basin is a flat plate, spray is dotted beads** (Med) — `fountain` in `addGardenProps()`:
  the far rim has no outline/inner wall so the basin reads as a disc; the spray is 2x2 squares in an arc that stop
  in mid-air above the rim and never reach the water; the column is a plain grey bar. → Basin with a lit inner back wall and a
  darker outer front wall, a tiered bowl, water arcs drawn as continuous 1-2px streams that fall into the pool with
  splash rings. Shots: [sheet-garden-a-8x.png](shots/structures/sheet-garden-a-8x.png), [one-fountain-z10.png](shots/structures/one-fountain-z10.png)
- **[S-55] Well: bricks overflow the right outline** (Med) — `well` brick loop draws `R(x, y, 6, 4)` up to x=33, past
  the outline at x=29, so the right edge is ragged with no outline on those rows. Body is a box, not a drum.
  → Round 3/4 well: elliptical stone rim seen from above, curved courses, crank handle, bucket on a rope.
  Shot: [well-bricks-10x.png](shots/structures/well-bricks-10x.png)
- **[S-56] Bird bath and birdhouse: flat lozenge bowls, square bird hole** (Low) — bowls are 2-row ellipses with no
  depth; the birdhouse hole is a black square and its roof is anti-aliased. → Bowl with inner rim; round hole with
  a perch; pixel roof.
- **[S-57] Water pump handle is black outline colour** (Low) — `R(6,4,9,2,OUT)`: reads as a crack, not metal.
  → Cast-iron handle 2 tones + highlight.

## 4. Garden, park and street props

- **[S-58] Park bench: backrest floats over the seat** (Med) — `park_bench` (`src/tiles.js` `addOutdoor`): back rails
  have no posts joining them to the seat; flat side view; no arms. → 3/4 bench: seat top visible, back posts,
  cast-iron ends with arms.
- **[S-59] Lamp posts dark at night on every builder island** (High) — `lamp_post` is not in `TILE_LIGHTS`
  (`src/scenery.js`); only Island One adds lights by hand. On Main Island the three lamp posts stay unlit at 22:00
  and their panes stay pale. → Add lamp_post (and campfire, museum windows) to `TILE_LIGHTS`; lit-pane frame.
  Shot: [mn-park-lamps-phone.png](shots/structures/mn-park-lamps-phone.png)
- **[S-60] Lamp light pools read green and sit off the post** (Low) — Island One night: yellow additive light on
  green grass gives lime-green pools, off-centre from each post. → Warm light with a cooler shadow ring; centre under the
  lantern. Shot: [one-museum-night-hallow-phone.png](shots/structures/one-museum-night-hallow-phone.png)
- **[S-61] Garden "stone lantern" looks like a birdhouse on a pole** (Low) — `garden_lantern`: square box with a
  flat grey roof. → Tōrō shape: wide base, post, firebox with openings, curved upturned roof, jewel top.
- **[S-62] White fence has no ends, corners or gate; fence_v is a single pole** (Med) — `fence_h` rails run off both
  ends of a row with no end post; `fence_v` is a 4px white bar with no posts, used as a lone grey pole at the end of
  the far-isle fence. No corner or gate pieces. → Full fence autotile: end posts, corners, T, gate (open/closed),
  rails with a 1px top face. Shots: [sheet-grounds-a-8x.png](shots/structures/sheet-grounds-a-8x.png), [isle1-contact.png](shots/structures/isle1-contact.png) (right)
- **[S-63] Hedge texture repeats a dark "bat" shape every tile** (Med) — `hedge`, `hedge_l`, `hedge_r` share one
  leaf pattern whose dark cluster reads as a flying bat/eagle, repeated identically; the top edge is a ruler line;
  ends are square. → 2-3 variants, a lumpy leafy top edge, rounded end caps, top face lighter than the front.
  Shot: [mt-fence-hedge-z10.png](shots/structures/mt-fence-hedge-z10.png)
- **[S-64] Fence and hedge placed on the same tiles** (Med) — Main Island (2080..2336, 640): `fence_h` sits on every
  hedge tile, so the white rails cut through the middle of the hedge. → One or the other, or a fence in front of a
  hedge one row lower. Shot: [mt-fence-hedge-z10.png](shots/structures/mt-fence-hedge-z10.png)
- **[S-65] "Topiary" is a sapling in a pot** (Low) — two round leaf bunches on a stick. → Clipped geometric topiary
  (ball, cone, spiral) in a square planter.
- **[S-66] Flower bed: candles in a box** (Med) — `flower_bed`: six 2x3 coloured blocks on stalks with a white pixel
  on top, in a brown box. Reads as birthday candles. → Mounded soil with clusters of 3-5px flower heads and leaves
  spilling over a stone or wood edge.
- **[S-67] Rose arch top is cut flat by the sprite edge** (Med) — `rose_arch`: arc centre y=22, radius 23, line 8 →
  the crown reaches y=-5 and is clipped; roses are red rectangles, leaves are green blocks floating outside the posts,
  the arc stroke is anti-aliased. → Fit the arch inside 64px, round 2-3px rose clusters on twining leaves.
  Shot: [rose-arch-top-clipped-10x.png](shots/structures/rose-arch-top-clipped-10x.png)
- **[S-68] You walk on top of the rose arch** (High) — on builder maps `rose_arch` has `walk: 'over'`, and
  `placeMapPieces` makes every `over` piece flat (depth 1), so the arch is drawn under the player, who stands on its
  crown. → Split into a back layer (posts, depth by row) and a front crown layer above the player.
  Shot: [mt-rosearch-z10.png](shots/structures/mt-rosearch-z10.png)
- **[S-69] Bunting lies on the ground / hangs on cliff faces with no posts** (Med) — `bunting` is `walk: 'over'` →
  flat, so it is drawn under people; it has no poles, and on Main Island a 5-tile string is stuck across a cliff face
  like a sticker. Pennants are anti-aliased with no outline. → Bunting between two posts (or building eaves), drawn
  above characters, crisp pennants with a 1px darker edge, a gentle 2-frame flutter. Shot: [mt-cave-arch-z8.png](shots/structures/mt-cave-arch-z8.png)
- **[S-70] Signpost arrows have fuzzy tips and no lettering** (Low) — `signpost` poly arrow tips are anti-aliased; each
  plank has one dark line. → Pixel arrow tips, 2-3 px "text" squiggles or tiny icons (museum, dock, beach).
- **[S-71] Sign: blank board** (Low) — `sign` (`src/tiles.js`): two lines on a plank, the same sprite for every notice
  and expedition note. → Variants: notice board with paper, welcome sign with the museum crest, dock sign with an anchor.
- **[S-72] Mailbox: flat box** (Low) — square blue box. → Rounded-top mailbox with a door and flag hinge.
- **[S-73] Telescope tube is a staircase of 4x4 squares** (Low) — `telescope`: 16 stepped squares; tripod legs thin.
  → Smooth 2-tone brass tube at a pixel-clean angle with eyepiece and lens cap.
- **[S-74] Wheelbarrow tub floats; no frame to the wheel** (Med) — `wheelbarrow`: tub, wheel and handle are three
  unconnected pieces. → Tub on a frame with handles meeting the axle.
- **[S-75] Picnic basket handle floats; plate and apple invisible** (Low) — handle drawn 2px above the basket; the
  white plate is on a white stripe, the red apple on a red check; no outline or shadow on the blanket.
- **[S-76] Beach umbrella: pole through the towel, missing right outline, shadow on the canopy** (Med) —
  `umbrella`: the pole stops in the middle of a standing striped box; the canopy's right edge has no outline; the
  "shadow" ellipse is drawn across the canopy hem. → Towel/lounger flat on the sand, pole into the sand beside it,
  full canopy outline, shadow ellipse on the ground. Shot: [umbrella-8x.png](shots/structures/umbrella-8x.png)
- **[S-77] Campfire: a pulsing egg on a log stack** (Med) — `campfire`: flame is two ellipses that scale per frame;
  logs lie side by side, not crossed; ring stones hidden. Also unlit on builder islands (not in `TILE_LIGHTS`).
  → Flame tongues with 4 shape frames, crossed logs, a visible stone ring, ember sparks, light on Main Island.
- **[S-78] Torch: a lollipop** (Low) — `torch`: round flame blob on a grey box on a stick. → Wrapped torch head or
  an iron bracket, flickering flame tongues.
- **[S-79] Pumpkins: plain, flat** (Low) — `pumpkins`: two orange ellipses with 2 rib lines; vine dashes hidden with
  one stray green dash floating to the right. → 3 tones, 4-5 ribs, curly vine and leaves.
- **[S-80] Hay bale: a sponge cake** (Low) — front rectangle only, random dashes. → 3/4 bale with a lighter top face
  and straw strands; round bale variant.
- **[S-81] Two barrel styles and two chest styles side by side** (Med) — code `barrel` (a brown rectangle with two
  grey bands, no bulge, no top) and code `chest` share Main Island with LPC barrels (`p:decor/140-142`, right beside the code barrels
  on the beaches) and LPC chests (`p:decor/134`). → One barrel and one chest family (bulging staves, elliptical top, iron hoops).
  Shots: [mt-crates-barrels-z10.png](shots/structures/mt-crates-barrels-z10.png), [mt-camp-southwest-z8.png](shots/structures/mt-camp-southwest-z8.png)
- **[S-82] Crate: a brown square with one slash** (Low) — `crate`: no plank divisions, no top face.
  → 3/4 crate: lid face, side face, plank lines, nail dots, stencil.

## 5. Docks, piers, bridges, boats

- **[S-83] Docks are flat floor tiles with black prison-bar gaps** (High) — `dock_h` / `dock_v` (`addProps` in
  `src/tiles.js`): 2px pure-outline gaps between planks, no side beam, no pilings, no shadow or reflection on the
  water, square ends. The piers look painted onto the sea. → Planks with 1px dark-brown gaps (not black), a side
  stringer, pilings at every 2-3 tiles with foam rings, a 2px shadow on the water under the edge, an end beam and
  bollards. Shots: [mt-dock-boats-z8.png](shots/structures/mt-dock-boats-z8.png), [mt-dock-west-z8.png](shots/structures/mt-dock-west-z8.png)
- **[S-84] Dock posts stand on dry sand with water foam around them** (Med) — `dock_post` has a pale foam ellipse
  baked in; on Main Island all eight posts are placed on the beach, so they wear white halos on sand.
  → Separate wet and dry variants, or let the scene add foam only on water. Shot: [mt-dock-boats-z8.png](shots/structures/mt-dock-boats-z8.png)
- **[S-85] Rope bridge is a plank floor with stripes** (Low) — `bridge_rope`: tan lines over `planks()`; no sag,
  no gaps, no posts. → Gapped slats showing water/void, rope rails with knots and end posts.
- **[S-86] Rowboats float loose; the oar stands upright like a mast** (Med) — `rowboat`: the oar is a vertical stick
  rising from the hull; four boats on Main Island are scattered in open water with no mooring line; the wake halo is
  a pale ellipse. → Oars lying along the gunwales, a rope to the nearest post, a 2-frame ripple ring, a 1px darker
  hull side (freeboard). Shot: [mt-docks-phone.png](shots/structures/mt-docks-phone.png)
- **[S-87] Driftwood floats in the sea and reads as a worm** (Low) — sine-wave of 2x3 rects; Main Island (768,1600) is
  in deep water. → Branchy bleached log with knots, on sand only.

## 6. Dig sites, puzzles, hunts

- **[S-88] Dig mounds look like dung piles** (High) — `mound()` (`src/tiles.js`) for `dig_fossil`, `dig_ruin`,
  `dig_shore`, `dig_crater`: a brown ellipse with lighter dabs and no outline; on snow/ice (exp-north) a brown blob
  on white. → Excavation look: a square dig with string grid and pegs, a sieve, a trowel stuck in the spoil heap,
  a bone/sherd poking out; tinted to the ground (sand/snow variants). Shots: [sheet-dig-8x.png](shots/structures/sheet-dig-8x.png), [exp-north-mammoth-z8.png](shots/structures/exp-north-mammoth-z8.png)
- **[S-89] The mineral dig spot is just sparkles; the others are mounds** (Med) — `dig_spot` is defined twice
  (`mound(false)` then the sparkle overlay, which wins), so one dig kind is three dashes and a "+" while the rest are
  heaps. → One family: same base dig, kind shown by the object poking out.
- **[S-90] Dig cliff and dig trench never appear in game** (Med) — `DIG_TILES` maps `dig_cliff` → fossil and
  `dig_trench` → ruin, and `addDig` draws `dig_fossil` / `dig_ruin`, so the cliff and trench tiles in the builder turn
  into brown mounds on the island (puzzle yard shows six mounds). The cliff tile itself is a grey tablet with text
  lines, the trench a chocolate bar. → Draw real 1x1 cliff-face-with-fossil and trench-with-wall tiles and use them.
  Shots: [yard-contact.png](shots/structures/yard-contact.png), [sheet-dig-8x.png](shots/structures/sheet-dig-8x.png)
- **[S-91] Pressure plates look like wall sockets** (Med) — `plate` / `plate_down`: grey square with a red (off) or
  green (on) centre square. → A carved stone flag with a sun/glyph, 1px raised; pressed = sunk 1-2px with a dark
  rim and a dust puff. Shots: [sheet-props-b-8x.png](shots/structures/sheet-props-b-8x.png), [exp-temple-phone.png](shots/structures/exp-temple-phone.png)
- **[S-92] Lever is a UI toggle** (Low) — red knob → green knob on a grey box. → Wooden/iron lever in a stone base,
  leaning left/right between states, no colour coding.
- **[S-93] Iron gate is a black vent grille; opening just deletes it** (Med) — `gate`: black fill, grey bars, no
  frame, spikes or hinges; `Expedition.draw` / Puzzles simply hide it. → Portcullis/iron gate in a stone frame with
  an open frame (raised/swung), 3-frame opening.
- **[S-94] Boulders are bowling balls with an "L" scratch** (Low) — `boulder`: perfect circle, big highlight, a
  `⊥` mark; `rock_crack`'s lightning-bolt crack plus two grey dashes reads as a face. → Faceted boulder with a
  flat base, moss, a believable crack network.
- **[S-95] Riddler is twice a person's height and in another style** (Med) — `riddler` 1x2: a 64px-tall purple robe
  with a tiny face and a broken "?" (gold pixels form a hook). Players are 27px. → Use the character system (a
  hooded sage with a lantern), normal height, a clear "?" emote above. Shot: [yard-contact.png](shots/structures/yard-contact.png)
- **[S-96] Fog: a cloud sticker with hard square edges** (Low) — `fog`: pale ellipses with semi-transparent hard
  edges and square cut corners, static. → Soft dithered fog tiles that blend across tiles and drift.
- **[S-97] Metal detector is an emoji and system font** (Med) — `Hunts.badgeEl()` (`src/puzzles-hunt.js`) shows
  `📡 Warm` in the default serif; rest labels use `fontFamily: 'monospace'` in-world. → Pixel detector icon in the
  UI frame and the game font; on the ground, a pulsing ring/beep wave around the player. Shot: [hunt-badge-crop.png](shots/structures/hunt-badge-crop.png)
- **[S-98] X mark and dug hole are UI-flat** (Low) — `x_mark` is a flat red X with no outline; `dug_hole` has tan
  dashes floating around it. → Painted/scratched X in sand with a few pebbles; hole with a spoil heap.

## 7. Expedition islands and props

- **[S-99] Temple, tomb and heist "buildings" are just floor tiles** (High) — exp-temple, exp-tomb and exp-heist are
  rectangles of the `brick` ground tile and `rock_2` cobbles with gates in gaps: no walls, columns, stairs,
  statues or roofs. The lost temple and the Egyptian tomb look like the same red-brick car park.
  → A ruins kit: stepped stone walls with a top face, carved pillars, temple stairs, vines, sand-buried
  obelisks, hieroglyph panels, dark doorway sprites. Shots: [exp-temple-phone.png](shots/structures/exp-temple-phone.png), [exp-tomb-phone.png](shots/structures/exp-tomb-phone.png), [exp-heist-phone.png](shots/structures/exp-heist-phone.png)
- **[S-100] Notes are the plain signpost, before and after reading** (Med) — `Expedition.draw`:
  `put(it.used ? 'sign' : 'sign')`. → Note/chart sprites (pinned paper, bottle, carved tablet), dimmed when read.
- **[S-101] Pried crates turn into a dug hole; "old" crates are barrels** (Med) — `Expedition.draw`:
  `crate` used → `dug_hole`; `sp.old` → `barrel`. → Open/broken crate sprite with spilled straw; a water-logged
  crate variant for "old".
- **[S-102] Skull flag shows a chess pawn** (Med) — `skull_flag` (`src/tiles.js`): the skull is a 4x4 + 2x2 + 6x1
  stack, no crossbones; flag barely moves. → 7x6 skull with eye holes over crossed bones, 3-frame ripple. Also a
  torch is placed on the flag pole's tile on Skull Isle, so the pole runs through the flame. Shot: [exp-pirate-flag-z10.png](shots/structures/exp-pirate-flag-z10.png)
- **[S-103] Shipwreck is a half tub with vertical planks** (High) — `wreck_hull`: a rectangle on a half-ellipse,
  vertical plank lines (hull planks run lengthwise), no outline on the top/sides, end ribs poke below the hull curve,
  a stick mast. Reads as a wooden bucket. → Broken hull on its side: curved strakes, exposed ribs, a snapped mast
  with rigging, a hole, sand drifted against it. Shot: [exp-wreck-hull-z8.png](shots/structures/exp-wreck-hull-z8.png)
- **[S-104] Sarcophagus is a gold-trimmed bench** (High) — `sarcophagus`: flat grey rectangle with two gold stripes
  and a blue oval. → Anthropoid lid seen 3/4: gold face mask, nemes headdress stripes in gold/lapis, crossed arms,
  hieroglyph band, stone base. Shot: [exp-tomb-sarc-z8.png](shots/structures/exp-tomb-sarc-z8.png)
- **[S-105] Mammoth skeleton is a white table, invisible on snow** (High) — `mammoth_skeleton`: rectangle spine,
  vertical-bar ribs, a box skull with a square eye, a straight tusk, two straight legs, no outline; bone `#e8dfc8` on
  snow `#ecf4fa`. → Curved spine, arched ribcage, domed skull with sockets, sweeping curved tusks, 4 jointed legs,
  a 1px warm-grey outline so it reads on snow. Shot: [exp-north-mammoth-z8.png](shots/structures/exp-north-mammoth-z8.png)
- **[S-106] Ice block is a glass TV** (Low) — `ice_block`: pure-black outline around a flat light-blue box.
  → Blue-dark outline, facets, internal cracks, translucent edge.
- **[S-107] Skull Isle's final chest is hidden behind a palm** (Low) — chest at (29,21) sits under a palm's trunk and
  fronds. Shot: [exp-pirate-chest-z10.png](shots/structures/exp-pirate-chest-z10.png)
- **[S-108] Boat scene is flat CSS, not pixel art** (High) — `boatScene()` (`src/expedition.js`) and `#boat-scene`
  CSS (`src/style.css`): a CSS-triangle sail, a rounded brown div hull, three flat light-blue full-width bars as
  "waves", a smooth gradient sky, system-ui text, no outline anywhere, and the bottom 45% of the screen is empty sea.
  It looks like a web placeholder between two pixel scenes, and the boat isn't the rowboat you board.
  → A pixel vignette at the game's scale: the same boat sprite with a sail, animated pixel waves with foam,
  gulls, the destination island on the horizon, sun/clouds by time of day, the game font in a dialog frame.
  Shot: [boat-scene-a.png](shots/structures/boat-scene-a.png)

## 8. The angled iso cottage room (`src/IsoScene.js`)

- **[S-109] Room doesn't fit the portrait screen** (High) — at the default zoom the right wall, window and bookshelf
  are off-screen while ~55% of the screen above and below is empty black. → Fit the room to the width (or follow
  with a margin), and fill the void with an exterior/garden or a vignette. Shot: [iso-phone.png](shots/structures/iso-phone.png)
- **[S-110] The player is a flat front-view sprite in a 45° room** (Med) — the character walks with the island's
  4-direction orthographic frames, so they never face the diagonal the room is built on. → Diagonal (3/4 iso)
  facings for the base body, or keep this room on the island's camera.
- **[S-111] Floor plank seams render as dotted lines** (Med) — `Pix.face()` samples at 0.015 steps, so seams come out
  as dashes and the floor reads stippled/moiré. → Draw seams as solid 2:1 lines.
- **[S-112] Wallpaper motif reads as digits** (Low) — the damask glyphs look like "0 9 Y" scattered on the wall.
  → A clear fleur-de-lis / stripe pattern on the iso grid.
- **[S-113] You can stand inside the bookshelf** (Low) — at gx 3.9, gy 0.7 the player's feet are over the shelf's
  front face. → Collision box = footprint. Shot: [iso-z2-behind-shelf.png](shots/structures/iso-z2-behind-shelf.png)

## 9. Placement, depth, shadows, lighting, seasons and holidays (cross-cutting)

- **[S-114] Cave and rock arch stacked on the same tile** (Med) — Main Island (1888,1024) has both `cave` (flat) and
  `rock_arch`; the grey arch sits on top of the cliff face and the cave tile's brown corners poke out at its foot.
  The arch is a grey dome pasted on a brown cliff (different rock). → A cave mouth cut into the cliff tile set.
  Shot: [mt-cave-arch-z8.png](shots/structures/mt-cave-arch-z8.png)
- **[S-115] Room pieces skip seasons** (Med) — `placeRoomPieces()` never runs `seasonFrames`/`snowify`, so pedestals,
  mats, fountains, barrels and the foo dog stay snow-free while everything around them is snowed over.
  Shot: [mm-facade-left-z9-winter.png](shots/structures/mm-facade-left-z9-winter.png)
- **[S-116] Builder islands lose every light that Island One adds by hand** (High) — lamp posts, campfires and museum
  windows are lit only by hard-coded `this.light()` calls in the Island One layout. → All lights from
  `TILE_LIGHTS`; see S-12, S-59, S-77.
- **[S-117] Holiday decor: Halloween is eight plain pumpkins in a row; "winter" adds nothing** (High) —
  `holidayDecor()` (`src/IslandScene.js`) places `pumpkins` on 4 tiles beside the door (on Main Island the flag poles
  stand on two of them, so the poles spear the pumpkins) and returns for any other holiday. No carved faces, no glow,
  nothing at night. → Jack-o'-lanterns (lit at night), straw bales, bats, cobwebs on the columns; for winter a wreath
  on the doors, garlands on the cornice, string lights, a decorated tree. Shots: [mm-phone-front-hallow-crop.png](shots/structures/mm-phone-front-hallow-crop.png),
  [one-museum-night-hallow-phone.png](shots/structures/one-museum-night-hallow-phone.png)
- **[S-118] Shadows are inconsistent across props** (Med) — code props use a 2-3px `rgba(0,0,0,0.25)` ellipse (buildings
  get a 3px sliver under 96px of wall), some have none (bunting, rose arch, picnic, flower bed, museum, docks), the
  well and boulders get rectangles/ellipses offset right, LPC pieces bring baked black lower-right shadows. → One
  rule: soft contact ellipse sized to footprint plus a short cast shadow down-right for tall things.
- **[S-119] Shadows only work on grass** (Low) — dark translucent ellipses go muddy-brown on sand and grey on snow;
  dig mounds' darker-green shadow shows green on sand. → Multiply-blended shadow with a fixed cool tone.
- **[S-120] Tall props hide the player completely** (Med) — walking behind the museum (Main Island leaves the upper
  rows walkable "hidden by the roof"), the windmill or the lighthouse leaves no trace of the player. → Fade the
  occluding building to ~40% or draw a player silhouette when behind.
- **[S-121] Cairn and characters stack visually** (Low) — the Main Island cairn at (1984,1088) sits so an islander's
  head lines up with its base, reading as stones balanced on her head. Shot: [mt-statues-cave-phone.png](shots/structures/mt-statues-cave-phone.png)
- **[S-122] Sign placed on a cliff face** (Low) — Main Island sign at (1952,1056) floats on the rock wall beside the
  cave. → Signs on flat ground at the cliff foot.

## 10. Missing pieces the redesign needs

- **[S-123] No outdoor museum kit** (Med) — no banners, ticket kiosk, queue rope, bike rack, bins, planters, museum
  signboard, bollards, notice board, outdoor sculpture plinths. → A "museum grounds" set in the facade palette.
- **[S-124] No exterior seasonal/holiday set** (Med) — no snowman, wreath, string lights, autumn leaf piles, rain
  puddle props, spring planters.
- **[S-125] Builder palette stand-in people are block men** (Low) — `personCanvas()` in `src/landmarks.js`:
  rectangles with black square eyes. → Use a real character frame.

---

## Top 10 (changes that would most raise the look)

1. **Rebuild the museum as a 3/4 facade kit** (S-01..S-09): roof plane, deep portico with even fluted columns,
   ashlar stone, carved pixel lettering, real windows/doors/steps, contact shadow; lit and seasonal variants.
2. **Give every building a 3/4 view with a visible roof and side wall** (S-18, S-26, S-30, S-36, S-38): cottage, huts,
   lighthouse, gazebo, windmill, greenhouse all drawn as front elevations today.
3. **Redraw the statues** (S-48, S-49, S-50, S-53): a proper marble/bronze figure on a moulded plinth, a real moai,
   and one statue per culture; drop the gold LPC foo dog or redraw it to match.
4. **Replace the brown-lump fountains and the LPC pedestals in front of the museum** (S-51, S-52, S-13, S-14) with
   museum-stone fountains (animated) and urns/lions, plus one proper doormat or runner.
5. **New scarecrow** (S-45..S-47): sack head with stitches, sleeves on the cross-bar, straw, patched clothes, person
   scale, whole-body sway.
6. **Docks and boats as structures** (S-83, S-84, S-86): pilings, side beams, water shadow, foam on water only, moored
   boats with oars laid flat.
7. **Fix depth for overhead pieces** (S-68, S-69, S-120): rose arch and bunting drawn above the player; building
   fade when the player is behind.
8. **One light table for all islands** (S-12, S-59, S-77, S-116): Main Island lamps, campfires and museum windows lit.
9. **Ruins kit for expeditions** (S-99, S-103..S-105): walls, pillars, stairs, a real shipwreck, sarcophagus and
   mammoth; temple, tomb and heist look like brick floors today.
10. **Pixel boat scene and real holiday decor** (S-108, S-117): replace the CSS boat with a pixel vignette; carved,
    glowing jack-o'-lanterns and a winter set on the facade.

## Systemic issues

- **Front elevations in a 3/4 world.** Almost every structure (museum, cottage, huts, lighthouse, gazebo, shed, bench,
  barrel, crate, chest, hay bale, well, fence) is drawn straight-on with no top face, while terrain, trees and LPC
  pieces are 3/4 top-down. This is the single biggest reason the buildings look like stickers.
- **Canvas path anti-aliasing.** Anything drawn with `poly`, `arc`, `quadraticCurveTo`, stroked lines or `fillText`
  (roofs, pediment, greenhouse, rose arch, umbrella, windmill sails, bunting, signpost tips, tents, the museum sign)
  gets semi-transparent fringe pixels and dozens of stray blend colours (beach hut 112, museum 208, cottage 114
  distinct colours). Needs integer pixel stairs or hand-drawn PNGs.
- **Pure near-black outline (`OUT = #20201a`) on everything**, including white fences, the gazebo and ice; LPC pieces
  use colour-matched brown outlines and some code props have none (bunting, picnic, dig mounds, mammoth). Pick the art
  bible's colour-matched selective outline and apply it to all.
- **Two art styles side by side.** Code-drawn flat props (2-3 tones, black outline) sit next to LPC builder pieces
  (soft dithered shading, baked shadows) on Main Island: barrels, chests, statues, fountains, pedestals, mats.
- **Scale drift.** Doors range from 15px (lighthouse) to 44px (museum) for a 27px person; the scarecrow and riddler are
  2x a person; window sizes vary 6-34px with no rule. A scale sheet (door = 1.0-1.1 person height, etc.) is needed.
- **Placement logic in the builder.** `walk: 'over'` pieces become floor decals; room pieces skip seasons; lights live
  in hand-placed Island One code; props are dropped in water, on cliff faces, on top of each other (fence+hedge,
  cave+arch, flag+pumpkins, torch+flag). The builder needs per-piece layer rules (ground / standing / overhead) and
  terrain checks.
- **Shadows and lighting are per-prop afterthoughts**: thin ellipses that only read on grass, missing on the biggest
  objects, baked differently in LPC pieces; night light pools tint green.
- **Expedition content uses placeholders as finished art** (signs as notes, holes as opened crates, floor tiles as
  temples, a moai for every culture).

## Keep

- The lighthouse's red/white banding and gallery railing read well at phone size (fix door/base/beam).
- The garden lantern and lamp post silhouettes are clean; the shed and market stall read at a glance.
- The iso room's furniture (sofa, armchairs, bookshelf with varied spines, rug) has the most polished construction
  in this domain; the wall/floor seam is tight with no gaps.
- LPC chests and barrels (`p:decor/134`, `140-142`) are good reference quality for the prop family, if the rest is
  brought up to them.
