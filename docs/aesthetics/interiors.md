# Interiors, architecture and decor items: art-direction audit

> Part of the aesthetics audit (29 Oct 2026, commit fa70331). Overview: [../AESTHETICS-AUDIT.md](../AESTHETICS-AUDIT.md). Visual version with every screenshot: https://claude.ai/artifact/5TdJk17Mx4g36tciuXPfvW (private to the owner).


Auditor: interiors. IDs R-01 onward. Shots are in `docs/aesthetics/shots/interiors/`; file names below link to them.
Captured at 390x844 / dpr 3 (phone shots `phone-*.png`) and at integer zoom 2-3 with the HUD hidden
(overviews `ov-room*-z2.png`, `items-room*-z3.png`), plus nearest-neighbour crops (`c-*.png`) and contact sheets (`sheet-*.png`).
Rooms covered: 0 entrance, 1 main hall (locked and unlocked), 2 atrium, 3-9 shaped (terraces, cross, court, mezzanine,
library, L-hall, corner), break room, built rooms 10-18 (vertical / horizontal / square x short / medium / long) and every
exit kind (door-back/left/right/end, stairs-up, stairs-down), 24 floors, 25 wallpapers, 14 wainscots, 6 one-tap themes,
4 light modes, night (?hour=22) and dusk, all 67 toolkit items placed in rooms 19-23 (fixtures filled with real entries),
the 22 LPC sprites, the mess set and dirt.

Hard-rule check result: `tests/gaps.cjs` reports **0 void pixels in all 62 room shapes** (it scans only the baked `walls`
texture). The composite on screen still shows void through walls in places the test cannot see (R-06, R-07).

---

## 1. How rooms sit on a 390x844 portrait screen

- **[R-01] Entrance side-wall paintings are cut off by the screen edge** (High). `RoomScene.fitCamera` (VIEW_TILES = 9) vs
  `entryLayout` (fw 6 + 4 = 10 tiles = 320 px). The camera shows 288 world px, so 16 px of each side wall is always off-screen,
  and the side-wall frames sit at x = xL-58..xL-26 (v 26..58), right in that strip. On the first screen of the game the left
  painting is half visible and the right one shows only a sliver of gold frame (the crown of both side walls is never seen).
  → Either make the entrance 5 floor tiles wide (fits 9 tiles exactly like vertical rooms), or move the side-wall slots down to
  v 6..30 (the frame then sits within 40 px of the floor edge), or let the camera fit the room width on entry. Shot: [phone-room0.png](shots/interiors/phone-room0.png), [c-r0-leftwall.png](shots/interiors/c-r0-leftwall.png).
- **[R-02] Big black void above and below short rooms** (High for horizontal rooms, Med for the entrance). The room is centred
  vertically: the entrance uses ~56% of the screen (void 24% above, ~20% below, with the doormat block hanging in it);
  horizontal rooms (5 deep = 288 px tall with walls) use only ~45% of the screen and the rest is flat #1d1512. In portrait,
  every horizontal room is a letterbox strip. → Fill the void with architecture: a ceiling/cornice band and a dark
  "outside the wall" texture (stone or plaster section) above, and a front wall cap plus a visible floor-below / entrance
  steps below; or zoom horizontal rooms so the 5-tile depth fills more height and the camera pans along the length.
  Shots: [phone-room0.png](shots/interiors/phone-room0.png), [sheet-horizontal.png](shots/interiors/sheet-horizontal.png).
- **[R-03] The doormat is a dark box hanging into the void** (High). `bakeFront` (art.js) / the mat branches in
  `bakeMainWalls` and `bakeShapedWalls`: below the front edge a 1-2 tile wide #2a201b rectangle with a flat #7a4f39 mat
  (one 1px #5a3b2c line top and bottom) sticks 32 px down into the black. There are no doors, no frame, no threshold, no
  light from outside, so it reads as a drawer or a step to nowhere. Every room has it, including the entrance whose sketch
  says "you come in at the bottom". → Draw the way in as architecture: a 2-tile doorway cut into a front wall cap (dark
  stone lip 6-8 px tall along the whole front edge), two open door leaves or a glazed front door at the entrance, a coir mat
  with a woven 2-tone texture and a 1px fringe, and a light spill from outside (day) or a lamp-lit porch (night).
  Shots: [c-r0-bottom.png](shots/interiors/c-r0-bottom.png), [c-r1-hallway.png](shots/interiors/c-r1-hallway.png).
- **[R-04] The main hall cannot be read in one view and the HUD covers its showpiece** (High). The hall is 23 tiles wide;
  the phone shows 9, so the sketch's back-wall rhythm (painting, arch, painting, stairs, middle arch, stairs, painting, arch,
  painting) is never on screen together: you see one stair, the middle arch and one stair. When you stand on the ground
  floor the four big balcony paintings sit under the Journal / Build / Style buttons, the money bar and "Collect all"
  ([phone-r1-locked.png](shots/interiors/phone-r1-locked.png): Mona Lisa is behind "Collect all", an empty slot behind "Build"). → Give the hall a camera that
  zooms out to fit when you enter (and when idle), or push the camera's top bound so the balcony wall sits below the HUD;
  keep the HUD off the top 110 px of the balcony wall (it already reserves PAD = 110 above the back wall, not below it).
- **[R-05] Non-integer camera zoom makes pixel columns uneven** (Med, systemic). `fitCamera`: zoom = width / (9 x 32). On an
  iPhone (dpr 3) that is 1170/288 = 4.0625 device px per game px, so every 16th pixel column/row is 5 px instead of 4; at dpr 2
  it is 2.708 (2 and 3 px mixed). 1px details (seams, frame lines, baluster gaps, damask dots) visibly change thickness and
  shimmer while the camera scrolls. → Snap zoom to an integer device-pixel multiple (4x at dpr 3, 3x at dpr 2 with 9.75 / 8.1
  tiles visible) and centre the remainder, or render the world to an integer-scaled render texture.

## 2. Walls, seams, wainscot, crown (the fake-3D box)

- **[R-06] Stairs-up cut a void notch through the top of the back wall** (High, hard rule). `bakeStairsUp` (art.js):
  rows y < 18 of the 60x128 sprite are FIX.void (#1d1512), and the sprite is placed at y0 - 64 so the "opening" lands exactly
  on the back wall's top and crown. It merges with the outside void: the wall reads as having a rectangular bite taken out of
  its top edge (vertical rooms top-left, horizontal rooms top-right). The gaps test misses it because it only scans the
  `walls` texture. → Make the opening a door-shaped dark recess *inside* the wall (stop it at v = 50, keep the crown and a lintel
  above, give it a 2 px frame), and add the sprite layer to the gap test. Shots: [c-stairsup-notch.png](shots/interiors/c-stairsup-notch.png), [c-stairsup-v.png](shots/interiors/c-stairsup-v.png).
- **[R-07] The arch-top overlay paints void and crown over things in front of the wall** (Med). `RoomScene.archTop` draws a
  40 px tall crop of the walls texture above every arch at depth base+1. In the main hall that crop covers the railing over the
  middle arch, so the balustrade beam is replaced by a dark crown bar ([c-r1-archtop.png](shots/interiors/c-r1-archtop.png)). In the atrium the crop is mostly the
  opaque void above the wall and it hides the "SCIENCE" plaque completely ([c-r2-plaque.png](shots/interiors/c-r2-plaque.png); the plaque at y0-61, depth 3, is
  under the crop at depth y0+1). → Crop only the arch's own frame pixels (mask by the arch shape, transparent elsewhere).
- **[R-08] Side walls are sheared parallelograms with patterns that do not read as a wall** (Med). `bakeWalls` side branch:
  wall height maps to screen (-1,-1) so the dado, chair rail and crown become *vertical* stripes beside the floor, raised-panel
  joints (pu < 2 every 40 px) become short "\" slashes, vertical stripes become diagonal hatching, and damask turns into "Z"
  marks. In the entrance the left wall reads as a striped strip with ticks, not panelling ([c-r0-leftwall.png](shots/interiors/c-r0-leftwall.png), [sheet-papers.png](shots/interiors/sheet-papers.png)).
  → Author side-wall versions of each pattern (panel outlines drawn as 45° parallelograms with a lit and a shaded edge,
  crown as a solid 6 px band with a highlight line) instead of sampling the back-wall pattern through the shear; or switch to the
  standard 3/4 RPG convention (side walls as narrow vertical faces, height straight up) used by Stardew/Eastward interiors.
- **[R-09] Walls are too short for a grand museum** (Med). D = 64 px: baseboard 0-5, dado to 22, rail 22-24, paper 24-58, crown
  58-64. Only 34 px of wallpaper shows, so most patterns repeat 1-2 times and a 24 px painting fills the band. Nothing marks the
  ceiling: the crown is a 6 px stripe and then flat void. → 96 px (3 tiles) back walls in halls and the atrium, 80 px elsewhere, a
  real cornice (8-10 px, 3 tones, dentil or egg-and-dart row) and a 4-6 px dark ceiling-shadow gradient under it.
- **[R-10] No section cap where walls are cut at the front** (Low-Med). Side walls stop at the front edge with a horizontal cut and
  a 2 px #6b4530/#4a2f22 line; hallway walls are cut by the hall floor; nothing shows wall thickness. → A dark "cut" cap (2-3 px
  wall-top colour + 1 px highlight) along every cut edge, like Pokémon/Eastward cutaway interiors.
- **[R-11] Seam line only on band-0 corners** (Low). `bakeShapedWalls` draws FIX.edge on the 45° seam only when `i === 0`; the
  stick-out back walls of wider bands (terraces, cross, L, corner, mezzanine) meet their side walls with only a shade change
  ([c-r8-orwindow.png](shots/interiors/c-r8-orwindow.png)). → Same 1 px seam (or none) everywhere.
- **[R-12] Convex corners read as one wall slicing through another** (Low). Cross / terraces / mezzanine: the arm's back wall
  (ol1/or1) is drawn over the alcove's side wall, so the alcove wall ends in a flat horizontal cut at the arm wall's top
  ([ov-room4-z2.png](shots/interiors/ov-room4-z2.png)). → Draw the outside corner as a pilaster / quoin strip (8 px) that covers the join.
- **[R-13] Most rooms are plain flat grey boxes** (Med-High). `NEW_ROOM_DECOR` (plain #d3d2ce paper, no wainscot, planks) is the
  base for the atrium, all seven shaped rooms except the library, and every built room. The atrium (the museum's grand hall) has
  bare beige walls, no wainscot and a plain plank floor under a waterfall; the terraces' drop walls are blank 64 px faces.
  → Give each fixed room an authored default (atrium: marble floor, stone ashlar walls with a cornice; shaped rooms: one style each)
  and make "plain" a lightly textured plaster (2-tone, very low-contrast noise) rather than one flat colour.
  Shots: [ov-room2-z2.png](shots/interiors/ov-room2-z2.png), [ov-room3-z2.png](shots/interiors/ov-room3-z2.png), [sheet-vertical.png](shots/interiors/sheet-vertical.png).

## 3. Doors, arches, windows, plaques

- **[R-14] Doors on side walls read as slanted planks or ramps** (High). Any door rect on a left/right wall goes through the
  45° shear: the Break room and Office doors in the main hall's hallway, the entrance door of every horizontal room, and
  door-left / door-right / door-end exits show as a long wooden parallelogram slanting toward the floor, with no top, knob or
  frame you can recognise ([c-r1-hallway.png](shots/interiors/c-r1-hallway.png), [sheet-horizontal.png](shots/interiors/sheet-horizontal.png), [sheet-exits-v.png](shots/interiors/sheet-exits-v.png)). → Draw side-wall doors as their own
  sprite: an upright door seen at an angle (narrow face, 1 px frame on the near side, knob, threshold), or recess them into the
  wall as a dark opening with a lit edge.
- **[R-15] The atrium's closed side arches look like surfboards** (High). `archMaterial` on the left/right walls (Archaeology,
  Statue hall): the round top shears into a long pointed oval of oak boards leaning off the wall ([c-r2-sidearch.png](shots/interiors/c-r2-sidearch.png)).
  → Side-wall arches need a hand-drawn angled arch sprite (or put these arches on short back-wall returns).
- **[R-16] Double doors have three knobs and panels that run across the seam** (Med). `doorMaterial`: the double-door branch
  adds knobs at mid-4 and mid+3, and the generic single-door knob at iu = iw-6 is still drawn, so the entrance's front doors
  have three brass dots; the two raised panels span iu 3..iw-3, straight across the centre seam, so the "two leaves" share one
  panel ([c-r0-door.png](shots/interiors/c-r0-door.png)). → Return early from the double-door branch; give each leaf its own two panels; knobs 1 px either side of
  the seam.
- **[R-17] Doors are flat slabs** (Low-Med). No architrave, no lintel or pediment, no threshold, grain as dark columns every
  7 px (`iu % 7`). → 3-tone architrave (light top-left edge, dark bottom-right), a 2 px stone threshold, panel shadows, brass
  plate + knob.
- **[R-18] Open archways are a flat hole with no masonry** (Med). `archMaterial` open: a 3 px dark frame around #1e1612 with a
  smooth floor-glow gradient; no voussoirs, keystone or depth (reveal). The atrium's Science arch has v1 = 60 on a 64 px wall,
  so its frame breaks into the crown ([c-r2-arch.png](shots/interiors/c-r2-arch.png)). → Stone voussoir ring (alternating 2 tones), a keystone, 4 px reveal on
  the inside edges, and a glimpse of the next room's floor colour.
- **[R-19] The hallway doors have no signs** (Med). `mainLayout` decorDoors carry `label: 'Break room' / 'Office'`, but only the
  atrium draws plaques. The two most-used staff doors are anonymous. → Small brass door plates (pixel lettering) or a hanging
  sign.
- **[R-20] Plaques are a web font on a flat rectangle, floating upright** (Med). `placeAtrium` plaque(): Georgia 7 px text,
  LINEAR filter, #e8d49a box, not sheared onto the wall plane, hovering in the air beside the surfboard arches
  ([c-r2-sidearch.png](shots/interiors/c-r2-sidearch.png)). → Pixel-font brass plaques (2 px border, 1 px highlight) drawn into the wall texture.
- **[R-21] Windows always show a bright daytime sky** (Med). `windowMaterial`: a fixed #bfe0f6 → #8cc0e8 gradient with a
  glint, at night only dimmed by the multiply layer ([c-r3-night-window.png](shots/interiors/c-r3-night-window.png)), unchanged in rain or snow. → Night variant (navy,
  2-3 star pixels, a moon pixel cluster, lit reflection on the sill), rain streaks / snow on the sill by weather, and dawn/dusk tints.
- **[R-22] L-hall's right windows are misplaced; one shows as a sliver in the corner** (Med). `PLANS.lhall.windows`
  `{ wall: 'or1', u: 11 }` and `u: 15` are measured from band 0's right edge (x = 8 tiles), so they land at 19 and 23 tiles in
  a 17-tile room: one window's corner peeks out of the seam, the other is off the wall, and the window light beam is drawn
  outside the room over the void ([c-r8-orwindow.png](shots/interiors/c-r8-orwindow.png)). → u: 3 and 7; clip beams to the room.

## 4. Main hall (room 1)

- **[R-23] The columns hold nothing: the railing stays on the wall plane** (High). `mainLayout` puts the columns one tile in
  front of the wall (foot yb + T) as the sketch asks, but `placeHall` puts the railing at the band wall's top (y = yb - D + 8),
  which is the wall's plane. In this projection something one tile closer is drawn 32 px lower, so the capitals stop under a
  beam that is really a tile behind them; the balcony has no overhang, no fascia, no soffit. → Extend the balcony floor one tile
  forward over the columns: a 6-8 px marble fascia beam drawn at yb + T - 64, the railing on top of it, a soffit shadow band on
  the wall behind, so the columns visibly carry the balcony edge ([c-r1-bandleft.png](shots/interiors/c-r1-bandleft.png)).
- **[R-24] The stair flights read as a striped carpet or a garage shutter** (High). `bakeHallStairs`: identical 8 px bands
  (4 lit, 3 mid, 1 dark) top to bottom, 5 px marble strips at the sides, no difference between tread and riser, no change in step
  size with depth, no side profile showing that the flight rises 64 px ([c-r1-stairs.png](shots/interiors/c-r1-stairs.png)). → Treads 6 px lit + risers 3 px
  shaded, steps getting slightly taller toward the foot, a solid side stringer showing the stepped saw-tooth profile, a carpet
  runner with brass stair rods, and a continuous handrail on balusters down each side.
- **[R-25] Newel posts are squashed column stubs** (Med). `bakeColumn(this, 'hall_newel', 20)`: a 20 px column is 7 px capital +
  6 px base + 7 px shaft, so the foot of each stair has two "salt shakers" ([c-r1-stairs.png](shots/interiors/c-r1-stairs.png)). Shaped rooms reuse it, and the
  pit/stairwell stack it every 12 px with `setScale(0.6, 0.7)`. → A proper newel sprite (square post, cap ball or urn finial,
  plinth), drawn at 1:1.
- **[R-26] The balustrade reads as a line of letters** (Med). `bakeRailing`: 3 px bars every 7 px with nothing between, so the
  balcony's marble veins show through the gaps and form shapes like "LIIIRELLII" ([c-r1-bandleft.png](shots/interiors/c-r1-bandleft.png)). Balusters are plain
  rectangles. → Vase-turned balusters (2 px neck, 4 px belly), a solid 2 px bottom rail, and a dark fill between balusters (the
  balcony floor in shadow) so the rhythm reads.
- **[R-27] The balcony floor looks like the ground floor** (Med). Same marble, same light, no edge thickness; only the thin
  railing separates the levels ([ov-room1-z2.png](shots/interiors/ov-room1-z2.png)). → Darken / cool the upper floor slightly, add a 4 px floor-edge slab under the
  railing and a contact shadow on the ground floor along the wall.
- **[R-28] Big balcony paintings hang across the dado rail** (Med). `placeArt` big: v0 = 14, frame from v = 10, crossing the
  chair rail at v 22-24 and the panels; the empty big slots paint a pink rectangle over the rail too ([c-r1-balcony.png](shots/interiors/c-r1-balcony.png)).
  → Raise the balcony wall (R-09) or drop the dado on that wall, so big frames hang on paper only.
- **[R-29] Ionic capitals have pixel dots for volutes** (Med). `bakeColumn` capital: a slab with a single 1.2 px dark dot per
  scroll, reading as a T-bar with two holes (atrium crop [c-r2-statue.png](shots/interiors/c-r2-statue.png), squares). → 5x5 spiral volutes, an egg-and-dart band,
  abacus slab; shaft with entasis and 3-tone fluting.
- **[R-30] Long blank side walls** (Low). The hall's side walls (14 tiles of damask each) have no slots, sconces or doors.
- **[R-31] All famous visitors stand in a two-row grid with pulsing text stars** (High for how the hall looks). `spawnFamous`
  ("for now: all of them, all the time") lines ~20 people up in staggered rows across the ground floor, each with a system-font
  "★" (`this.add.text`, stroke 3) bobbing over the head. It looks like a parade drill, buries the stairs and arches, and the star
  is not pixel art ([ov-room1-z2.png](shots/interiors/ov-room1-z2.png)). → A few at a time, wandering like visitors; a pixel-art 7x7 star or a small gold
  laurel above the head.

## 5. Atrium (room 2)

- **[R-32] The waterfall's rock pile is clipped flat by the water** (High; the user asked about water clipping). `bakeFountain`:
  the rocks are only drawn inside `d <= 0.85` (the basin's inner ellipse), so the top of the heap is chopped off in a straight
  line along the back of the pool: a flat-topped trapezoid with water coming out of nothing ([c-r2-fountain.png](shots/interiors/c-r2-fountain.png)). → Draw the
  rock pile as its own layer above the basin, rising 30-40 px over the rim with a jagged top, the falls starting from a lip at
  the top with white foam.
- **[R-33] Fountain textures read as noise** (Med). Rocks use 4x4 hash blocks (`hash(x >> 2, y >> 2)`), which looks like a
  censor mosaic; the pool has a diagonal screen-door hatch from `(x + y) % 7`; the two streams are static vertical stripes; the
  foam is random speckle. → Hand-clustered rocks (3-4 lit facets, dark crevices, moss in clumps), water as soft concentric ring
  bands with 2-3 animated highlight dashes, falls as 3-frame vertical streak animation with a splash ring.
- **[R-34] Basin rim and wall** (Low). The outer "below" band meets the rim ellipse with a step at the left and right ends,
  so the outline notches out like an eye; the basin wall is only ~8 px, so the basin reads as a flat ring on the floor.
  → Clean elliptical rim with a 10-12 px front wall (lit top, shaded face), drip stains.
- **[R-35] The two staircases are a saw-tooth of broken fence pieces** (High). `bakeSideStairs`: every 14 px step gets its own
  10 px balustrade stub at its own height, so the handrail is a staircase of disconnected horizontal stubs, the treads are tall
  vertical strips (they read as organ pipes or book spines), the marble side is a pale stepped slab filling the front quarter of
  the room, and the landings fade into a dark brown hole ([c-r2-stairs.png](shots/interiors/c-r2-stairs.png)). → A continuous diagonal handrail on regular
  balusters, treads as shallow horizontal bands seen from above, a clear stringer, and the landing ending at a closed upper-floor
  door or a velvet-roped gate instead of a gradient hole.
- **[R-36] The rope across the stairs is a 1-2 px red thread** (Low). Posts are 1 px brass columns. → Reuse the velvet-rope item
  art (`bakeItem` 'rope') at proper size.
- **[R-37] Statues stand in front of the big paintings and hide them** (Med). `atriumLayout` statues at x = 3 and 16 tiles, the
  same as the painting slots, so the statue's body covers the middle of the painting ([c-r2-statue.png](shots/interiors/c-r2-statue.png)). → Offset them to
  flank the painting, or put the statues on the columns' plinths between paintings.
- **[R-38] Columns stuck to the back wall support nothing** (Low). Atrium columns (D + 6 tall) end in a capital at the wall top
  with no entablature. → Engaged pilasters drawn into the wall, or a full entablature band running over them.

## 6. Shaped rooms (3-9) and the break room

- **[R-39] The sunken court's pit is a flat brown box with bead-chain railings** (High). `placeShaped` pit: a 22 px far wall,
  a pit floor of two near-identical greys (0x9a9184 / 0x8f877b) that read as one flat colour, no inner side walls, a 3 px light
  stroke for a rim; the side railings are newel stubs stacked every 12 px at `setScale(0.6, 0.7)` (non-integer, uneven pixels),
  reading as vertebrae or beads ([c-r5-pit.png](shots/interiors/c-r5-pit.png), [c-r5-pit-checker.png](shots/interiors/c-r5-pit-checker.png)). → Draw inner walls on all three visible sides
  (stone ashlar, shaded by depth), a mosaic or flagstone pit floor, steps down one side, and the same balustrade on all four
  sides drawn at 1:1.
- **[R-40] The stairwell's risers are see-through** (Med). The step rows are filled, but the 2 px riser rows are
  `fillStyle(0x000000, 0.35)`, so the room's floor pattern shows through every riser (very obvious on a checker floor:
  [c-r5-stairwell-checker.png](shots/interiors/c-r5-stairwell-checker.png)). → Opaque risers; the deeper steps getting darker and narrower toward the bottom.
- **[R-41] "Steps" strips look like benches** (Low-Med). `stepsMaterial`: three pale 8 px bands, no risers, no side cheeks,
  same stone in every room (cross alcove, mezzanine front). → Lit tread / dark riser with a nosing highlight, side cheek blocks.
- **[R-42] Free-standing columns in open floors hold nothing** (Low). Terraces, cross, court, mezzanine, L and corner place
  72 px columns in the middle of the floor with no beam above. → Either beams/arches drawn on the wall above them (a frieze band)
  or replace with plinths, lamps or statues.
- **[R-43] Library: the best-looking room, but its props are the wrong scale** (see R-81) and its herringbone floor reads as
  chevron lines (R-46). `chair_tall` reads as a red tombstone on legs (Low).
- **[R-44] Break room** (Low). Giant 1-tile checker squares in navy/cream with floor dust showing as dirty patches on the cream;
  lockers are flat blue boxes; the staff "board on the wall" is a free-standing cork easel (`board` item); the sofa is the
  flat red box (R-92). → Smaller 16 px checker (or terrazzo), a wall-mounted cork board, lockers with shading and a bench.

## 7. Floors (Customize → This room → floor; `bakeFloor` and pattern functions in art.js)

- **[R-45] Marble looks like a topographic map** (High). `marble()`: wavy 1 px brown contour lines forming closed blobs over a
  faint tile grid, at every scale. It is the main hall's and classical theme's floor ([sheet-floors.png](shots/interiors/sheet-floors.png), [c-r1-hallway.png](shots/interiors/c-r1-hallway.png)).
  → Large polished slabs (64x64) with 2-3 soft grey veins per slab that run diagonally and fade, a faint lit/dark slab edge, and
  a subtle reflection under lit paintings; or classic black/white marble lozenge.
- **[R-46] Herringbone is chevron columns** (Med). `herringbone()`: tall planks in vertical columns joined by zigzags, not short
  blocks at 90°. Reads as dashed zigzag lines (library). → Real 4x12 px blocks alternating 45° in a herringbone lattice with 3
  tones per block.
- **[R-47] Stone brick and brick floors look like walls** (Med). `stone()` / `brickFloor()` use running-bond brick at wall scale;
  the Natural-history theme floor is a grey brick wall. → Large square flags (stone), basket-weave or herringbone pavers (brick).
- **[R-48] Dust noise on every floor** (Med). `bakeFloor` mixes a dithered #b9a58a "dust" (smoothNoise > 0.66) into every
  pattern, so checker, tile, marble and carpet all have pale speckled blotches that read as dirt or mould ([sheet-floors.png](shots/interiors/sheet-floors.png),
  break room). → Drop it, or keep it only for wood as a very low-contrast wear pattern along walking lines.
- **[R-49] Tiny-cell floors shimmer** (Low-Med). Mosaic (4 px grid with random cells: graph paper), penny (repeating tiny
  circles: moiré), encaustic (busy 4 px motif) break up at phone size with the 4.06x zoom (R-05). → 8-16 px motifs.
- **[R-50] Tatami is one direction with no borders; the Japanese theme uses parquet** (Low). → Alternating 2:1 mats with dark
  cloth borders; give the Japanese theme tatami.
- **[R-51] The carpet "runner" becomes a wall-to-wall rug in square rooms** (Med). `carpetRect` is "one tile in from each edge"
  in both directions, so in big halls the classical and moody themes cover the whole floor with one red or mustard rectangle
  ([sheet-themes.png](shots/interiors/sheet-themes.png)). → A runner 2-3 tiles wide down the centre, or a bordered rug sized to the room's middle.
- **[R-52] Floor edge shading is a smooth 4-6 px gradient** (Low). `bakeFloor` darkens x < 4 and y < 6 by a linear ramp. →
  1 px dark contact line + 2 px shadow band, matching the light direction (darker on the left/top).

## 8. Wallpapers and wainscots

- **[R-53] Hieroglyph paper reads as garbled currency symbols** (Med). `wallpaper` 'hieroglyph': 3x5 glyphs in thin bands
  look like "$¥ΣS" text, on side walls as vertical columns ([sheet-papers.png](shots/interiors/sheet-papers.png), [sheet-themes.png](shots/interiors/sheet-themes.png) Egyptian). → 8-10 px tall
  glyph registers (eye, ankh, bird, reed) in 2 colours between painted bands, like a tomb frieze.
- **[R-54] Sakura, stars and dots are too sparse to read** (Low-Med). Sakura is single pink pixels, stars are 5 px crosses at
  50% density, dots are 1 px. → 5-6 px blossoms with branches, star clusters, 2x2 dots.
- **[R-55] Marble paper and marble wainscot are squiggle noise** (Med). Same contour-line method as R-45.
- **[R-56] Damask reads as anchors / arrows; on side walls it turns to "Z"** (Low). A 16 px diamond with a vertical stroke.
  → A proper 16x24 damask medallion in two close tones.
- **[R-57] The tall wainscot collides with paintings and doors** (Med). `wTop = 34` for 'tall', but frames start at v = 26, so
  every painting overlaps the chair rail; doors cross it too ([sheet-wainscot.png](shots/interiors/sheet-wainscot.png) 'tall'). → Move ART_V0/V1 up when wTop is 34,
  or cap tall wainscot at the frame's bottom.
- **[R-58] Shear artefacts on side walls** (Low). Harlequin, plaid, zigzag and lattice become long diagonal shards on side walls.
  Same fix as R-08.

## 9. Paintings on walls

- **[R-59] Side-wall paintings are rotated 90° and sheared** (High). `walldraw.sideMatrix` maps the image's x axis to screen
  vertical and its y axis to the 45° wall-up direction, so a portrait painting lies on its side: Klimt's The Kiss shows the
  couple horizontal; every painting in a vertical room (the most common room type) is a skewed sideways smear
  ([c-r11-sidepaint.png](shots/interiors/c-r11-sidepaint.png), [sheet-vertical.png](shots/interiors/sheet-vertical.png)). This works against "real art in HD" more than anything else in the rooms.
  → Keep side-wall art upright: map image y to screen y and only shear image x along the wall (a parallelogram whose vertical
  edges stay vertical), or show side-wall paintings as angled frames with the image upright and slightly compressed, or hang
  art on back walls and use side walls for cases and benches.
- **[R-60] Paintings are thumbnails** (Med-High). ART_V0..V1 = 30..54: 24 world px tall, about 32 css px on the phone, inside
  a 64 px wall. The real art is "the brightest, sharpest thing on screen" by the art bible, but it is the size of a fingertip.
  → Taller walls (R-09) and 40-48 px paintings; big slots 64 px.
- **[R-61] One flat gold box frame for everything, jagged on side walls** (Med). `wallMaterial` frame: d0 #3e2a0e, d1-2 gold
  with a 1 px light line on top only, d3 #7a5a1e. Drawn into the 1x wall texture, while the painting is drawn at 4x HD with
  smoothing, so on side walls a stair-stepped pixel frame surrounds a smooth image. No corner ornaments, no inner slip, no
  variety. → 6-8 hand-drawn frames (gilt with corner cartouches, dark walnut, black modern, ornate rococo), lit top-left / dark
  bottom-right, chosen per painting era; drawn at the same 4x resolution as the art on side walls.
- **[R-62] The frame's drop shadow reads as a shelf** (Low-Med). A 2 px band at shade 0.75 just below the frame, offset 1 px
  right ([c-r18-athens.png](shots/interiors/c-r18-athens.png)). → 1 px dark + 2 px soft (50% / 25%) shadow down-right, per the art bible.
- **[R-63] Picture lights look like labels, and only back walls get them** (Low-Med). `lt_fixture` is a 14x4 dark box with a
  gold and a cream line, no arm and no lamp head; side-wall paintings get none. → A brass arm + hooded lamp (12x6) with a warm
  cone on the frame, on every wall.
- **[R-64] Empty wall spots look like a missing texture** (Med). `wallMaterial` empty: a flat rectangle of the paper mixed 30%
  toward white with a barely different 1 px border and a single #3b2f27 nail pixel above it. On damask it is a pink sticky note;
  on plain paper it is nearly invisible ([c-r1-balcony.png](shots/interiors/c-r1-balcony.png), [sheet-horizontal.png](shots/interiors/sheet-horizontal.png)). → A faint dust-outline ghost of a frame
  (lighter paper where a frame used to hang) with a visible hook and a tiny "+" brass plate, or a dotted gold outline.
- **[R-65] No museum labels beside paintings** (Med). Nothing next to a frame says what it is. → A 6x4 px cream card with
  two grey lines to the lower right of every frame (tap target for the viewer).
- **[R-66] Dust motes look like dead pixels** (Low). `Lighting.addMote`: 2x2 white texture at scale 0.5, ADD blend, drifting over
  the painting and the wall below it (white specks on The Kiss, Water Lilies, under every back-wall frame). → Fewer, warmer,
  50% alpha, only inside the light cone, 1 px.
- **[R-67] Unloaded paintings show a flat colour slab** (Low-Med). Paintings with remote `src` (e.g. The Horse Fair on the
  entrance's right wall) render as a flat brown or lavender fill in the frame until (unless) the image arrives
  ([night-r0.png](shots/interiors/night-r0.png), [items-room23-z3.png](shots/interiors/items-room23-z3.png)). → Ship all wall art locally in public/paintings, and use a canvas-texture
  "linen" placeholder with a shimmer instead of a flat fill.

## 10. Lighting, sconces, night

- **[R-68] The wall sconce reads as a padlock or a battery** (Med-High). `lt_sconce` (8x12, lighting.js): a dark rectangle with
  a cream slot on top of a dark box with a yellow "I". It flanks every door in every room ([c-r0-sconce.png](shots/interiors/c-r0-sconce.png)). → A brass
  backplate, a curved 1 px arm and a frosted tulip shade (or a candle with a 2-frame flame), 10x14, with the glow centred on
  the bulb.
- **[R-69] At night the ceiling lights make a polka-dot grid on the floor** (High). `Lighting.build`: a soft pool every 3
  tiles (rx 70, ry 56) in a regular grid, so floors at night show a checker of blurry light and dark blobs, very visible on the
  atrium and terraces ([sheet-night.png](shots/interiors/sheet-night.png)). → Light only from things you can see (sconces, picture lights, lamps, windows, the
  arch spill), with larger, overlapping, irregular pools; or a few visible chandeliers with matching pools under them.
- **[R-70] Room light modes are flat colour filters** (Med). `LIGHT_TINTS` is a single multiply rectangle over the room:
  Moody (#b8a08c) just turns everything muddy sepia with less contrast, Daylight washes the marble white, Cool is blue
  ([sheet-light-r1.png](shots/interiors/sheet-light-r1.png)). → Moody should darken the ambient and boost the picture lights (pools of light, dark corners); Daylight
  should add window shafts; each mode a different ambient + light strength, not a tint.
- **[R-71] Night turns the walls lavender** (Low-Med). The blue night ambient over warm wall washes makes plain and red walls go
  lilac-blue ([sheet-night.png](shots/interiors/sheet-night.png), room 10). → Warmer night ambient indoors (a museum after hours is lamp-lit amber, with blue only
  through windows).
- **[R-72] Lights are smooth gradients on top of pixel art** (Low). Glows (`lt_glow`), beams, the people's shadow (`lt_shadow`)
  and the window beams are anti-aliased radial / linear gradients. → Banded 3-4 step pools (dithered or posterised) to match the
  pixel style, or accept as a deliberate soft-light layer but keep it off sprites' outlines.
- **[R-73] The ticket desk's banker's lamp gives no light** (Low). It is not in `LAMPS`; at night the lamp is dark while sconces
  glow. → Add a small warm pool on the desk.

## 11. Entrance (room 0) specifics, mess and dirt

- **[R-74] Ticket desk is a flat box** (Med). `bakeItem` 'desk': a #6e4430 box with two flat panels and 2x2 brass knobs, a 5 px
  top slab, a green lamp shade floating on a 2 px brass stick, a ledger, a bell, a cash box ([c-r0-desk.png](shots/interiors/c-r0-desk.png)). No ticket window,
  no sign, no queue rope, no top surface seen from above. Visitors also wander behind it next to the caretaker. → A 3-tile
  counter with a lit top surface (8-10 px deep), a "TICKETS" brass sign, a glass partition or ticket roll, a rope queue in front,
  and the space behind it blocked for visitors.
- **[R-75] The front-corner trees are lollipops and not in the corners** (Med). `bakePlant` 'tree': a 1 px trunk and an
  ellipse with two lighter blobs on a trapezoid pot; seeded at row 6 (`seedEntry`), one tile above the corners (which hold a
  cobweb and the green pad) ([c-r0-mess.png](shots/interiors/c-r0-mess.png)). → A 1.5-2 tile ficus or bay tree with clustered leaf masses, a glazed urn pot with
  rim highlight and soil, placed in the true corners.
- **[R-76] The green "decor pad" is a debug square in every room** (High). `RoomScene.create` padGfx: a 26x26
  rgba(63,143,74,0.55) fill with a 2 px #6fd07a stroke on the floor near the entrance, the same green as the toolkit's
  "can place" ghost; in the entrance it sits on top of a cobweb ([c-r0-pad.png](shots/interiors/c-r0-pad.png)). → A brass donation box, a collection plate on
  a stand or a gold-trimmed mat; never a translucent rectangle.
- **[R-77] Cobwebs lie flat on the floor and scratch the side walls** (Med). `messList` web4/web5 sit on the floor corners
  (a web lying on planks); web2/web3 sit mid-wall as faint white lines; all at depth 4000, drawn over people.
  → Webs in the top wall corners hanging from the crown (vertical, sagging), 3 px wide strands with a dangling spider, depth
  just above the walls.
- **[R-78] Cracks are black hairs** (Med). `bakeCrack`: a 1 px #2a170e random walk with a semi-transparent rim, crossing planks
  in any direction; reads as hair or scribbles. → Board-aligned splits: a broken plank (dark gap 2 px with lighter splintered
  edges), lifted board corners, missing chips.
- **[R-79] Stains and puddles read as shadows / grey rugs** (Low). `bakeStain` is a 150-alpha brown blob; `bakeDirt` puddle is a
  grey-blue ellipse with a white dash. Litter is a 7 px ball + wrapper, unreadable at phone size ([c-dirt.png](shots/interiors/c-dirt.png)). → Stains with
  a darker ring edge; puddles with a lighter rim and a reflection of the wall colour; litter 10-12 px with an outline.
- **[R-80] Coin piles are scaled 0.7** (Low). `artSpots` sprites `setScale(0.7)`: non-integer scale smudges the coins into gold
  blobs in front of every painting ([c-night-r0.png](shots/interiors/c-night-r0.png)). → Draw a small-pile sprite at 1:1.

## 12. LPC sprites in rooms (public/sprites/lpc, library and builder pieces)

- **[R-81] LPC furniture is about twice the size of the people** (High). The props were drawn for 64 px LPC characters; Curation
  people are ~27-31 px tall (20x27 x 1.15). Candelabra 89 px, grandfather clock 84 px, fireplace 80 px, bookshelves 64 px,
  tree_pot 57 px, settee 40 px tall: visitors look like toddlers beside them ([c-phone-r7.png](shots/interiors/c-phone-r7.png), [ov-room7-z2.png](shots/interiors/ov-room7-z2.png)).
  → Either redraw people at ~48 px or scale every prop to the art bible's scale sheet (door 2 tiles, chair seat at knee
  height) by redrawing, not by resizing.
- **[R-82] Two styles side by side** (High). LPC pieces have dark outlines, 4-5 tone soft shading and texture; the code room
  around them (walls, floor, columns, rails) and every code-drawn item are flat 1-2 tones with black OUT boxes; the library is
  the only room that looks finished, which makes every other room look like a blockout. → Pick one target style (the LPC
  level of shading with the art bible's palette) and redraw the room kit and items to it.
- **[R-83] Duplicate objects in two styles** (Med). Bookshelf (code grid vs LPC), grandfather clock (code vs LPC `clock`),
  candelabra (code 3-candle vs LPC iron), potted tree (code lollipop vs LPC `tree_pot`), sofa (code red box vs LPC settee),
  fountain (code item vs atrium waterfall). → One sprite per object.

## 13. Decor items (src/items.js, `bakeItem` in src/art.js), judged in rooms 19-23 at real size

Common to almost all: drawn from `box()` rectangles with a pure #2a1a12 1 px outline, 1-2 flat tones, no light direction,
front view only, a translucent black ellipse for a shadow. Scale drifts badly (R-84).

- **[R-84] Item scale vs people** (High). Suit of armour ~58-62 px tall and the classical statue ~67 px next to a 31 px curator
  ([c-scale-armor-player.png](shots/interiors/c-scale-armor-player.png)); floor lamp ~62 px; bookshelf ~65 px; bust on pedestal ~55 px. A suit of armour should be about
  person height (32 px + stand). → Scale sheet: person 31 px, armour 34 px + 4 px stand, statue 40-44 px on a 10 px plinth,
  lamp 40 px.
- **[R-85] Classical statue is a paper cut-out** (High). 'statue': a 10x18 rectangle torso, two 3 px unoutlined bars for legs,
  a circle head, a free-floating 3x13 bar left of the torso and a separate 3x10 bar up-right for the raised arm, on a cube
  ([c-r2-statue.png](shots/interiors/c-r2-statue.png), [c-items-statues.png](shots/interiors/c-items-statues.png)). Arms do not touch the body; it reads as a robot. Used twice in the atrium.
  → A contrapposto marble figure (Apollo / Venus) 24-28 px tall: head with hair mass, shoulders, attached arms, drapery folds
  in 3 marble tones (#f2eee6 / #d8d0c2 / #a89e8e) with a warm-grey outline, on a moulded plinth with a plaque.
- **[R-86] Marble bust is an egg on a column** (Med-High). 'bust': an ellipse head with no face, ears, hair or shoulders above a
  narrow neck bar and a slab. → Head and shoulders with a hair cap, nose shadow, chest cut on a socle; 3 tones.
- **[R-87] Suit of armour has no arms** (High). 'armor': helmet box with a 2 px slit and a red plume stick, torso box, two dark
  ellipses for pauldrons, two grey bars for legs, no arms, gauntlets, belt or weapon; reads as a trash can on legs.
  → Full plate with arms at the sides (or holding a sword / halberd), knee cops, sabatons, steel 3 tones with a white glint,
  on a wooden stand.
- **[R-88] Sarcophagus is a yellow box with a smiley face** (High). 'sarcophagus': a #d9b44a 56x24 box, blue vertical stripes
  and a tan oval with two dark dots at one end, seen from the front. → Lid seen from above (3/4): a mummiform face with nemes
  headdress stripes, crossed arms with crook and flail, a broad collar, gold and lapis, on a stone plinth.
- **[R-89] T-rex skeleton reads as a dog or a table** (High). 'trex': a 22x12 rectangle skull with a square eye, straight 1 px
  spine with evenly spaced 1x8 ribs, two straight 4 px pillars for legs, a 8x2 bar arm, on a flat grey slab; no outline on
  bones, no joints, no pelvis ([c-trex.png](shots/interiors/c-trex.png)). It is the 2500-gold centrepiece. → A 3x2 tile mount: skull with fenestrae and
  jaw, S-curved neck, curved ribcage, pelvis, thick femur + shin + foot with toes (bent knee), two-finger arms, tapering tail
  vertebrae, outlined in warm dark brown, on iron rods over a stone plinth with a plaque.
- **[R-90] Dinosaur skull** (Med). A flat side-view block on a two-stick stand; teeth as white dashes. → Outline, fenestrae,
  lower jaw separate, a proper brass mount.
- **[R-91] Antique globe** (Med). 'globe': a blue circle with two green blobs on a 2 px stick; no meridian ring, no tilt,
  no stand legs. → Tilted globe in a brass meridian ring on a 3-leg wooden stand, continents recognisable, a highlight.
- **[R-92] Velvet sofa** (Med). 'sofa': a flat red slab with three yellow pixels, arms as boxes, front view only.
  → Seat cushions, back with tufting, rolled arms, wooden feet, top-down 3/4 like the LPC settee.
- **[R-93] Gallery bench** (Med). 'bench': a plank box on two unoutlined legs; rotated, a long slab with no legs seen.
  → A padded museum bench (leather top with a lit edge, wooden frame) in 3/4.
- **[R-94] Stanchion is a golf flag** (Med). 'stanchion': a brass post with an 8x3 red stub sticking out right. → Post with a
  round base, a ball top and a clip hook; the rope belongs to the 'rope' item.
- **[R-95] Plants** (Med). Fern is a scribble tuft; monstera is four ellipses with single white "holes" (broccoli); cactus is a
  flat column; little tree and cherry blossom are lollipops (ball on a 1 px stick); potted palm is a dashed trunk with a green
  arc and a different square box pot; bonsai is two blobs on a blue tray; orchid is fine. Pots are flat trapezoids with no soil.
  → Clustered leaves in 3 greens with dark undersides, split monstera leaves, a jade-glazed or terracotta pot with rim highlight
  and soil, one pot family.
- **[R-96] Canopic jars look like paint tubes** (Med). 'canopic': four white rectangles with coloured caps. → Four jars with the
  sons of Horus heads (human, baboon, jackal, falcon) as lids.
- **[R-97] Meteorite looks like a coffee cup** (Med). 'meteorite': a dark ellipse on a white box. → A pitted iron mass with
  regmaglypt dents and a metallic sheen, on a dark plinth under a small glass dome.
- **[R-98] Geode looks like a crystal ball** (Med). 'geode': a purple circle with white sparkle on a stand. → A split half
  geode: rough grey-brown rind, white quartz band, purple crystal points inside, on a small stand.
- **[R-99] Golden idol is a gold bowling pin** (Med). 'idol': a gold blob on a white pedestal. → A seated squat figure with a
  big head, arms on knees, gem eyes, on a carved stone block.
- **[R-100] Greek urn is a blue Chinese vase** (Med). 'urn': blue vase on a marble box. → A black-figure amphora (terracotta
  #c0703f body, black figures band, two handles), on a plinth.
- **[R-101] Butterfly case is a sign** (Med). 'butterflies': a white board with coloured X marks on a pole. → A wall-style
  glazed case on a stand, butterflies with two wing colours and pins in rows, a wooden frame.
- **[R-102] Gramophone horn is a funnel pointing up** (Med). 'gramophone': gold triangle on a box. → A flared tulip horn
  angled forward off a crank box with a turntable.
- **[R-103] Rugs** (Med). Round rug is a red/blue doughnut with white dots (a target); long runner has white pill shapes with a
  red dash that read as a row of eyes. → Persian medallion rug with border and fringe; runner with a repeating guli motif.
- **[R-104] Aquarium and giant tank are flat blue rectangles** (Med-High). 'aquarium' / 'big_tank': a single translucent
  rgba(70,150,200,0.78) fill, a 3-4 px pale strip for the surface, a sand strip, 2 px zigzag weeds, ellipse rocks, and a flat
  brown cabinet with no doors. No depth gradient, no glass highlight, no lid, no bubbles ([c-bigtank.png](shots/interiors/c-bigtank.png)). → Lid with a light,
  water darker toward the bottom, a diagonal glass glint, bubbles (2-frame), decorated cabinet, rocks and plants drawn as
  clusters.
- **[R-105] Fish pile up in tanks** (Med). `displayart.showDisplays`: every fish starts at the tank's left edge; lanes are
  (y1-y0)/n apart, about 6 px for 8 fish in the giant tank, so 16 px fish overlap in a stack for the first seconds and keep
  crossing; the small aquarium scales fish by 0.7 (non-integer). ([c-bigtank.png](shots/interiors/c-bigtank.png), [phone-items22.png](shots/interiors/phone-items22.png)). → Random start x,
  2-3 depth layers with parallax and a darker tint for the back layer, max 4-5 fish visible per tank, 1:1 sprites.
- **[R-106] Services counters are placeholders** (Med). Coffee counter (grey box machine, two cups), gift shop (four coloured
  squares and a tote bag), food court (red/white stripes, a black menu board, two buns), discovery table (four blocks and a grey
  circle), lecture stage (a box lectern, a mic on a stick and two red slabs; already a known placeholder). All are a flat
  counter front with 6 identical panel rectangles. → Each a 3x1 / 2x1 set piece with a lit counter top, shelves with
  recognisable goods (postcards, mugs, prints), an espresso machine with chrome, awnings with scalloped edges and shading,
  a stage with curtains, lectern and a projected slide.
- **[R-107] Small items** (Low). Stool legs unoutlined and the 3rd leg floats; exhibit sign has no foot; candelabra flames
  are single yellow pixels; floor lamp shade is a flat cream trapezoid; stone lantern fine; obelisk reads OK; telescope OK;
  specimen jars OK; jewel case, ship in a case, plinth, glass case, specimen shelf readable but flat; harp and piano read
  well; grandfather clock code version fine but duplicates LPC; lockers flat; donut table OK; cork board on legs (should be on
  the wall); mask reads as a tiki; holiday tree, gifts, flower basket and jack-o'-lantern are fine.
- **[R-108] Display contents are scaled to fit** (Low). `displayart.fit` returns k < 1 for large entries, so some pixel-art
  finds on plinths and in cases are drawn at fractional scale (soft, uneven pixels). → Author display icons at the slot size
  (16x16 / 18x18 / 20x20) and only scale by whole numbers.

## 14. Depth sort and clipping

- **[R-109] Visitors walk behind the ticket desk** (Med). In the entrance a visitor stands in the caretaker's space behind the
  counter ([c-r0-desk.png](shots/interiors/c-r0-desk.png)). → Block the tiles behind the desk for visitors.
- **[R-110] Cobwebs (depth 4000) draw over people** (Low). See R-77.
- **[R-111] Standing behind a column hides the curator completely** (Low). In the gap between a main-hall column and the
  wall only a few red pixels of the player show ([c-r1-behindcol.png](shots/interiors/c-r1-behindcol.png)). → Draw a silhouette / outline of the player when
  occluded, or make columns slightly narrower than the player.
- **[R-112] People on the stair tops overlap the railing line** (Low). Visitors stop on the top step of the hall stairs,
  where their heads cross the balcony's railing beam ([c-r1-behindcol.png](shots/interiors/c-r1-behindcol.png)).

---

## Top 10 (biggest lift for the look)

1. **Fix the side-wall projection for paintings, doors and arches** (R-59, R-14, R-15, R-08): upright side-wall art, hand-drawn
   angled doors and arches. Every vertical room and the hallway currently show sideways smears and "ramps".
2. **One room kit in one style at one scale** (R-82, R-81, R-84, R-83): redraw walls, columns, rails, stairs, doors and every
   item to the LPC level of shading and the art bible's scale sheet (person 31 px, door 48-64 px).
3. **Taller walls with a real cornice, bigger paintings, proper frames and labels** (R-09, R-60, R-61, R-64, R-65).
4. **Replace the debug green pad and the doormat-in-the-void** (R-76, R-03) with in-world objects and a real entrance.
5. **Main hall architecture: overhanging balcony on the columns, real stair flights, turned balustrade, proper newels, a
   camera that shows the hall** (R-23, R-24, R-26, R-25, R-04, R-31).
6. **Atrium: un-clip the waterfall, redraw the stairs and side arches, give it a grand default decor** (R-32, R-35, R-15, R-13).
7. **Redraw the hero exhibits** (R-85, R-87, R-88, R-89, R-86): statue, armour, sarcophagus, T-rex, bust.
8. **Marble and herringbone floors, and drop the dust noise** (R-45, R-46, R-48): the main hall's floor is the most-seen surface.
9. **Lighting that comes from visible sources** (R-69, R-70, R-68): no polka-dot grid at night, a sconce that looks like a lamp,
   moody that is actually moody.
10. **Close the void holes the gap test cannot see** (R-06, R-07, R-22, R-40): stairs-up notch, arch-top overlay, misplaced
    windows and light beams, see-through stairwell.

## Systemic issues

- **The shear does everything on side walls.** Wallpaper, wainscot, paintings, doors and arches are all sampled through the same
  45° affine map, so anything with a vertical axis falls over (paintings sideways, doors as ramps, arches as surfboards,
  panels as slashes). Side walls need their own authored art.
- **Two art styles and two scales.** LPC props (64 px character scale, soft shading, brown outlines) next to code-drawn rooms and
  items (flat fills, pure-dark 1 px box outlines, ~2x too tall); the library looks finished and everything else looks like a
  blockout; several objects exist in both styles.
- **Programmer-art construction for items.** `bakeItem` builds things from rectangles and ellipses with one flat tone and an
  optional darker strip; most read as icons at phone size, and the "hero" exhibits are the weakest.
- **Plain defaults.** New, shaped and atrium rooms start on flat grey paper with no wainscot and a plank floor; most of the
  museum a player sees is untextured.
- **Noise instead of material.** Hash noise and contour lines stand in for marble, rock, dust and water (floors, fountain rocks,
  marble paper/wainscot), which reads as maps, mosaics and dirt.
- **Non-integer scaling.** Camera zoom 4.0625 / 2.708, newels at 0.6x0.7, coin piles at 0.7, fish at 0.7, display icons fitted
  fractionally: pixels of uneven size throughout.
- **Smooth gradients on pixel art.** Lighting pools, glows, beams, shadows and the arch glow are anti-aliased gradients over
  crisp sprites, and the night pools sit on a visible 3-tile grid.
- **Labels in web fonts.** The atrium plaques and the famous-visitor stars are system-font text, not pixel art.
- **The gap test covers only the walls texture.** Sprites and overlays (stairs_up, archTop crop, pit and stairwell graphics,
  window beams) can still put void or wrong pixels on walls.

## Keep

- The fake-3D box with the shared 45° seam: the wall texture has no void pixels in any of the 62 shapes.
- The LPC library as the quality target (fireplace with animated flames and glow, bookshelves, settee, clock, rug).
- The window art (white sash, mullions) and the closed oak arch doors on back walls read well.
- Grand piano, golden harp, canary cage, holiday tree, gifts, flower basket, jack-o'-lantern and the fish sprites themselves.
- The floor set's range (24 patterns) and the per-room colour system; checker, hex, terrazzo, flagstone, slate and carpet are usable.
- Picture-light pools on the wall at dusk/night are a good idea once the fixture art and the floor grid are fixed.

Not covered here (other auditors or out of scope): the build-room page UI, the IsoScene cottage on Island One, people/visitor sprites.
