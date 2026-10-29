# World art: columns, fish and fishing, world life (second pass, main 38cb3e3)

> Part of the aesthetics audit (29 Oct 2026, second pass, main 38cb3e3). Overview: [../AESTHETICS-AUDIT.md](../AESTHETICS-AUDIT.md). Visual version with every screenshot: https://claude.ai/artifact/5TdJk17Mx4g36tciuXPfvW (private to the owner).


Scope: #191 columns (`src/columns.js`, the main hall, atrium and shaped rooms, Customize → Columns, toolkit column items),
#195 fish, fishing and water effects (`fish_more.js`, `fish_events.js`, `fishing.js`, `progression/ui/waterfx.js`,
`reveal.js`, `progression.css`), #195 world life (`worldlife.js`, `islandlife.js`, `lookfx.js`, named NPCs from
`npcs.json`), and e2e0a5b. I judged every column at 5-9x and in rooms at phone size (390x844, scale 2) and every new fish
at 6x. I also ran the fishing loop with all perks forced on (`__prog.has = () => true`, `__prog.debug.force`) so the
effects show. All shots are in `shots/world2/`.

## Columns: how they sit in the rooms

- **[R-113] The 34 px columns now cover the middle arch's jambs** (Med) — `rooms.js` mainLayout columns at 8.55 and 10.45
  tiles, `RoomScene.placeHall` bakes them at W=34 (they were 22). The middle arch is 44 px wide (9.5T ± 22). Each column now
  spans 17 px either side of its centre, so it covers 8.6 px of each side of the opening. Only a 26 px slot of door shows
  between the two shafts, the arch's own frame and spring line are hidden, and the capitals' leaves sit over the top of the
  arch. Square designs (Khmer, Haida, Hathor, Atlantean) close it further. → Move the pair out to 8.3 / 10.7 T, or keep
  them 22-26 px wide in the hall, so the whole arch frame shows between them. Shots: [hall-midarch-z5.png](shots/world2/hall-midarch-z5.png),
  [hallz-arch-4styles.png](shots/world2/hallz-arch-4styles.png), [phone-hall-sheet-2.png](shots/world2/phone-hall-sheet-2.png)
- **[R-114] Capitals now cut into the paintings on the balcony band** (Med) — the same widening. The 0.55T column's
  acanthus covers the left edge of the frame of the painting at 1.5T (Great Wave). The 5.45T column covers about a third of
  the slot at 4.7T, and 14.3T has the same problem. → Shift the band slots (1.7, 4.4, 14.6, 17.3 T) or narrow the hall
  columns, so no capital touches a frame. Shots: [hall-left-z5.png](shots/world2/hall-left-z5.png), [hall-col545-crop.png](shots/world2/hall-col545-crop.png)
- **[R-115] Four designs are in pieces: the wall shows through between their parts** (High) — `D.doric`, `D.palm`,
  `D.moorish`, `D.ashoka`. Each has empty pixel rows across its whole width:
  - Doric, rows 11-12: `top = abH + echH + 2u` leaves a 2 px gap, so the echinus and abacus float above the shaft with a
    maroon line under them.
  - Palm, row 23: the frond crown floats above the banded neck.
  - Nasrid, rows 22, 24 and 26: the three neck rings are 1.5u tori with 0.5u gaps, so they are three loose stripes and the
    capital hangs free of the shaft.
  - Ashoka, row 2: a lone 1 px "ceiling line" floats above the lions.

  The gaps show at phone size (Doric in `phone-hall-sheet-0`, Nasrid in `-2`) and on the toolkit items. → Close every gap:
  the necking rings should touch, the echinus should sit on the shaft, and the free line on the Ashoka should go. Also add
  a check (like the wall gap test) that each column's opaque pixels form a single connected shape. Shots:
  [caps-classical-9x.png](shots/world2/caps-classical-9x.png), [caps-2-8x.png](shots/world2/caps-2-8x.png), [caps-4-8x.png](shots/world2/caps-4-8x.png),
  [items-room0-z4-crop.png](shots/world2/items-room0-z4-crop.png)
- **[R-116] The default Corinthian's acanthus reads as popcorn or a jaw of teeth** (High: it is `DEFAULT_COLUMN`, so it is
  in every hall, atrium and shaped room). `leaves()` with `D.corinthian`, `D.gilded`, `D.composite`, `D.solomonic` and
  `D.malachite`. Two rows of white lumps sit between dark grey gaps, with one white blob on top. There are no leaf shapes
  (no lobed tips curling out, no central rib), no corner volutes under the abacus, the abacus doesn't curve in, and there's
  no fleuron. At phone size the capital is a fuzzy white cap. In gold (Gilded, Solomonic, Malachite) it reads better but
  the shapes are still lumps. → Hand-pixel one capital template: 2 tiers of 4 visible acanthus leaves (each a 5-6 px tall
  leaf with a 1 px dark midrib and a curled lit tip), helices rising to 3x3 corner volutes, a concave abacus with a 2 px
  fleuron. Shot: [caps-classical-9x.png](shots/world2/caps-classical-9x.png)
- **[R-117] The Caryatid reads as a ghost or a robot with spider legs** (High) — `D.caryatid`. The head is a 5 px ball
  with two dot eyes and a dot mouth (a smiley) on a 2 px stick neck. Her braids are dotted chains hanging off the head that
  don't touch the shoulders, so the wall shows between them. The shoulders are a square box with stubs and no arms. A dark
  grey drip on the skirt reads as a stain. The kalathos on her head is an upturned trapezoid on a thin stem. → Model it on
  the Erechtheion maiden: an oval face with no dot features (a shade for the brow and nose at most), braids lying over the
  shoulders down to the chest, a peplos with long vertical folds over one bent knee (a lit knee pad, not a dark blob),
  shoulders sloping into arms that end at the sides, and a round cushion capital resting right on the head. Shots:
  [full-figural-6x.png](shots/world2/full-figural-6x.png), [room8-caryatid-z4-crop.png](shots/world2/room8-caryatid-z4-crop.png)
- **[R-118] The Atlantean warrior is a stone robot holding grapes** (Med) — `D.atlantean`. Box head with a slatted box
  hat, 2 px slit eyes, arms as separate rectangles with the wall showing between arm and body, and the butterfly pectoral
  drawn as four grey balls (a bunch of grapes). → Feathered headdress band with vertical feathers, rectangular eyes and big
  ear spools, the butterfly pectoral as a flat stylised butterfly, arms joined to the torso holding an atlatl and darts,
  a belt disc at the back. Shots: [full-figural-6x.png](shots/world2/full-figural-6x.png) (sheet), [caps-5-8x.png](shots/world2/caps-5-8x.png),
  [atrium-left-2styles.png](shots/world2/atrium-left-2styles.png)
- **[R-119] The Haida and Yoruba posts read as cartoon emoji faces** (High: these are carvings from living cultures, and as
  drawn they look like caricature). `D.haida`, `D.yoruba`, plus the shared `eye()` helper.
  - Haida: grey rounded-square googly eyes with a white glint, a red smile, a ringed "top hat" (the potlatch rings),
    teal squares for paws that read as buttons, and no formline at all.
  - Yoruba: the figures are brown balls with two white slit eyes (sleepy or angry) on stacked brown boxes.

  At phone size both read as Minecraft villagers. → Haida: black formline ovoids and U-forms with red secondary lines on
  natural cedar, eyes as ovoid-in-ovoid, the potlatch rings as a stack of narrow cylinders on the top figure's head, abalone
  inlay as small pale blue-green ovals. Yoruba (Olowe of Ise): a kneeling woman with a tall crested coiffure, a child
  on her back, almond eyes with heavy lids, painted blue and white in bands, the figure fused to the post. Get these
  checked against museum photos before shipping. Shots: [full-figural-6x.png](shots/world2/full-figural-6x.png),
  shots/world2/room4-haida-z4-crop.png, [phone-hall-sheet-3.png](shots/world2/phone-hall-sheet-3.png)
- **[R-120] The Ashoka lion capital reads as three sheep or a cloud with a face** (Med) — `D.ashoka`. The lions are three
  beige balls with one face drawn on the middle one, and the wall shows between them (47 transparent holes). The abacus
  wheel is a blob. → Four addorsed lions seen as three (two in profile, one facing): manes as 3-tone curls, open mouths,
  front legs straight down onto the abacus. A drum-shaped abacus with a 24-spoke dharma chakra drawn as a 5 px wheel with
  a rim, and animals between the wheels. The bell-shaped lotus below is fine. Shot: [caps-4-8x.png](shots/world2/caps-4-8x.png)
- **[R-121] Hathor has no cow ears, and her text column is a barcode** (Med) — `D.hathor`. The note says "with cow's
  ears", but the face is a flat square face in a blue wig with no ears. The shaft's hieroglyph column is a vertical run of
  1 px coloured dashes and squares (blue, red, green), which reads as a barcode or morse at phone size. → Cow ears flaring
  out at the wig line, the face on all visible sides of the block, the sistrum naos above with a uraeus frieze, and the
  shaft text as 3-4 legible 5 px glyphs (an ankh, an eye, a reed, a bird) in a framed column. Shots:
  [caps-3-8x.png](shots/world2/caps-3-8x.png), [phone-hall-sheet-1.png](shots/world2/phone-hall-sheet-1.png)
- **[R-122] The Persepolis bulls read as a flat biscuit or a bone** (Med) — `D.persian` (`tpl(P, BULL, …)`). The double
  bull is a beige cut-out with tiny horn triangles, a row of 1 px dashes for the fur (a zipper), no eyes, no folded legs and
  no muzzle. The bell and volute stack under it is mush. → Two bull foreparts back to back: kneeling forelegs, a curly-haired
  collar band, a clear eye and muzzle, horns forward. The saddle between them should hold a visible cedar beam end. Below
  that, the double-volute block, then a fluted bell. Shot: [caps-3-8x.png](shots/world2/caps-3-8x.png)
- **[R-123] Papyrus drips paint; the Palm capital is a hedge** (Med) — `D.papyrus`, `D.palm`. Papyrus: the green sepals
  hang down from the blue band like icicles or dripping slime. Palm: a solid green bush with dark specks and a row of
  round green balls on top, reading as broccoli or a hedge rather than carved stone fronds. → Papyrus: an open umbel bell,
  green triangular sepal leaves pointing UP from the neck bands, red and blue bands at the neck, the bundle stems visible
  on the shaft. Palm: 8-9 vertical stone fronds with ribbed edges curling out at the top, painted green on a sandstone
  base, tied with five bands. Shot: [caps-2-8x.png](shots/world2/caps-2-8x.png)
- **[R-124] The Byzantine lace capital is TV static** (Med) — `D.byzantine`. The basket capital is random black and white
  pixel noise (it reads as a QR code), and the porphyry shaft is purple with scattered white specks, like a night sky. →
  A basket capital carved as a regular lattice of 3 px drill holes in a vine pattern, a central monogram disc, an impost
  block above. Porphyry as dark purple-red with fine paler flecks clustered, not scattered evenly. Shot:
  [caps-3-8x.png](shots/world2/caps-3-8x.png)
- **[R-125] The Mughal pietra dura is a grid of green "+" signs** (Low) — `D.mughal`. Each inlay flower is a 1 px green
  cross with a red dot, in a regular grid. The capital is a wobbly white stack that reads as crumpled paper. → Scrolling
  inlaid flower sprays (a 5x7 iris or poppy with leaves, in carnelian and green) in cartouche panels. A cusped, multi-lobed
  capital with a lotus collar. Shot: [caps-4-8x.png](shots/world2/caps-4-8x.png)
- **[R-126] The Khmer apsara is a stick figure on a dirty slab** (Med) — `D.khmer`. The recessed panel holds a two-tone stick
  figure that reads as a hieroglyph, and a brown smudge at phone size. The sandstone is dotted with random dark specks
  that read as dirt. → A dancing apsara (tall crown, hip-shot pose, arms bent at the elbows) in 2-3 tones of grey-green
  sandstone, with a lotus border round the panel. Lichen in clumps, not specks. Shot: [caps-4-8x.png](shots/world2/caps-4-8x.png)
- **[R-127] The Dragon column's whisker and pearl stick out into the air** (Low) — `D.dragon`. A 1 px whisker line pokes
  5-6 px past the column edge over the wall, and a white blob (the pearl) bulges out on the other side. The coiled body is a
  diagonal gold band that reads as a barber pole at phone size. → Keep everything inside the column's silhouette except one
  readable head. The body should be 2-3 wraps of scaled coils with claws gripping the shaft and clouds between the coils.
  Shots: [items-sconce2-crop.png](shots/world2/items-sconce2-crop.png), [caps-4-8x.png](shots/world2/caps-4-8x.png)
- **[R-128] The Chinese dougong is a stacked striped cake** (Low) — `D.chinese`. The brackets are four stepped green and blue
  bands with yellow dots, with no interlocking arms. → Visible bracket arms (gong) and blocks (dou) stepping out in 2-3
  tiers, in red with green and blue caihua painting on the ends. Shot: [caps-5-8x.png](shots/world2/caps-5-8x.png)
- **[R-129] The Feathered serpent column is upside down and the head is a set of dentures** (Med) — `D.maya`. The head at
  the foot is a box with grey dot eyes and a row of cream fangs (a grinning box). The shaft's feathers are a green zigzag
  wallpaper. The capital is a classical stack of slabs instead of the rattle tail held up under the roof. → A big open
  serpent jaw on the floor with a curled snout, a fanged upper jaw and a tongue. The shaft is the feathered body, in rows
  of overlapping feathers. The top is the rattle tail bending forward under the lintel. Shots:
  [full-figural-6x.png](shots/world2/full-figural-6x.png), [phone-hall-sheet-3.png](shots/world2/phone-hall-sheet-3.png)
- **[R-130] The Stave's dragon heads read as bats; the lattice is snakeskin** (Low) — `D.stave`. Two brown blobs with yellow
  eyes stick out at the top corners. → A plain round tarred post with a carved cushion capital and a small mask. The dragon
  heads belong on the roof gables.
- **[R-131] The Gothic "pier" is a plain fluted column with a pearl necklace** (Low) — `D.gothic`. The silhouette is a
  straight rectangle with a ring of white balls at the capital, and nothing shows the bundle of shafts. → A lobed outline
  (a fat core with four to eight thin shafts, each with its own lit edge), shaft rings, and small crocket capitals at
  different heights. Shot: [caps-3-8x.png](shots/world2/caps-3-8x.png)
- **[R-132] The marble veins are dotted scratches and the malachite is striped** (Low) — `marble()` veins on `D.tuscan` and
  `D.composite`, `D.malachite`. The veins are dotted diagonal 1 px lines (a crack or a scratch). The malachite is diagonal
  stripes, so it reads as green striped marble. → Soft 2-tone vein clouds. For malachite, concentric bullseye bands in
  three greens. Shot: [cols-34x88-0.png](shots/world2/cols-34x88-0.png)
- **[R-133] Every design is forced into one 34 px box and stretched per height** (Med) — `paintColumn(id, W, H)` with
  `u = H / 88`. The slender Nasrid is a pencil in the box, while Khmer, Haida and Hathor are full-width slabs that block the
  arch. Figures are re-proportioned for each height: the hall is 88, the atrium 70 and items 89, so the Atlantean goes
  squat in the atrium. → A natural width per design (Nasrid about 20, Doric 30, Khmer 32) and fixed figure proportions
  (crop or extend the plain shaft, never rescale a figure). Shots: [atrium-left-2styles.png](shots/world2/atrium-left-2styles.png),
  [phone-hall-sheet-2.png](shots/world2/phone-hall-sheet-2.png)
- **[R-134] The rest of the architecture ignores the column style** (Med) — `bakeRailing`, `bakeColumn(this,
  'hall_newel', 20)` (the old branch) and `bakeHallStairs` stay Greek marble. Pick Haida, Japanese, Khmer or Chinese and
  the posts carry the same white "LIIIRELLII" balustrade, with marble salt-shaker newels at the stair foot. The new 11-tone
  columns also sit beside the old flat 2-tone newels, which look unfinished next to them. → Tie a railing, newel and
  stair-trim set to each design family (a vermilion wooden rail for Japanese and Chinese, carved cedar for Haida, a
  sandstone balustrade with naga ends for Khmer), or keep the hall classical and offer world columns only in shaped rooms.
  Shots: [phone-hall-sheet-2.png](shots/world2/phone-hall-sheet-2.png), [hallz-arch-4styles.png](shots/world2/hallz-arch-4styles.png)
- **[R-135] The free-standing column items add more columns that hold nothing** (Med) — `items.js` COLUMN_ITEMS (31 items,
  `rise: 60`), `bakeItem` `def.column`. Each is an 89 px column on a 1x1 tile in rooms whose walls are 64 px, so against
  the back wall the capital reaches the crown and seems glued to it. Further out it stands alone with nothing above it.
  Placed in row 0 they cover the double doors and paintings (an Atlantean over the entrance doors). → A shorter "pedestal
  column" item (40-48 px, a broken column or a column with a bust or urn on top) for open floors, and full-height columns
  allowed only along walls with a beam drawn above. Shots: [items-room0-phone.png](shots/world2/items-room0-phone.png),
  [items-room0-z4-crop.png](shots/world2/items-room0-z4-crop.png)
- **[R-136] The column footprint is 16x1 px under a 34 px sprite** (Low) — `placeHall` blocks `x ± 8`, `y0 foot-9 ..
  foot-8`. Visitors' feet walk on the outer 9 px of each plinth, and a person in the gap behind a column now disappears
  completely (see R-111). → Block the full plinth (34x8) and leave a 1-tile gap behind, or show an occluded outline.
- **[R-137] Column previews are scaled by fractions** (Low) — `toolkit.js` icon `k = min(1.4, 56/ih, 76/iw)` = 0.61, so the
  32x92 column becomes a 19x56 css px sliver and the 31 designs look like the same stick. The Customize picker shows 34x88
  at 42x109 css px (`.column-pick img`, 1.235x) and the Field-journal grid is the same. → Integer scales only: 1x in the
  toolkit card (or a capital-only crop at 2x), 1x or 2x in the picker. Shots: [toolkit-columns.png](shots/world2/toolkit-columns.png),
  [picker-1.png](shots/world2/picker-1.png)
- **[R-138] White columns lose their lit edge on pale walls** (Low) — `outline()` adds the dark line only on the shadow
  side (selective outline). On the default pale grey paper (atrium, new rooms) and the cream entrance stripes, the left edge
  of Doric, Ionic, Tuscan and Corinthian melts into the wall. → A mid-tone 1 px rim on the lit side too, or a soft 1 px
  contact shadow on the wall behind. Shot: [atrium-left-2styles.png](shots/world2/atrium-left-2styles.png)

## Fish (C-110+)

- **[C-110] All 54 new fish are palette swaps of the 8 old templates, with no markings** (High) — `fish_more.js` (42) and
  `fish_events.js` (12) all use `renderer: 'fish'` with one of
  `fish/slim/deep/cat/round/sword/squid` and three colours. Not one sets `stripes`, `bars`, `band` or `spots`, so the
  striped bass has no stripes, the lionfish no bands, the grayling no spots and the mahi-mahi no flecks. `fishart.js` is
  unchanged. The Journal now has 72 fish from 8 silhouettes. → Hand-pixel each species (see C-57). In the meantime, give
  every species its markings and at least a per-species tail, fin and head shape. Shots: [newfish-6x-a.png](shots/world2/newfish-6x-a.png),
  [newfish-6x-b.png](shots/world2/newfish-6x-b.png)
- **[C-111] Many species are drawn with the wrong body plan** (High) — the `shape` choices in `fish_more.js`:
  - Manta ray and Common skate are `round`: a fat side-view fish with a tail fin and a dorsal bump. They should be flat
    wings seen from above or the front.
  - The Great hammerhead is `sword`, so it has a swordfish's bill and no hammer.
  - The Seahorse is a horizontal `slim` fish with a forked tail.
  - Flounder and Halibut are upright `deep` fish. They should be flat ovals with both eyes on top.
  - European eel, Moray, Oarfish and Sea lamprey are short lemons with forked tails instead of long ribbons. The oarfish
    has no red crest and the lamprey no sucker.
  - The Ocean sunfish (mola) has a tail, which the real fish lacks (it has a clavus and tall dorsal and anal fins).
  - The Anglerfish has no lure and no teeth. The Lionfish has no spines.
  - The Flying fish has no wing fins.
  - The Cuttlefish uses the squid capsule.

  The catch card shows them at 6x, so a "Legendary · 3.22 m Ocean sunfish" is a grey ball with a tail. → New body templates
  (ray, eel, flatfish, seahorse, shark, mola) before per-species art. Shots: [newfish-6x-b.png](shots/world2/newfish-6x-b.png),
  shots/world2/mola-5-reveal.png, [cards-4.png](shots/world2/cards-4.png)
- **[C-112] Sharks and the coelacanth wear catfish whiskers** (Med) — `shape: 'cat'` on the Greenland shark, Atlantic wolffish,
  Coelacanth, Burbot, Wels catfish and Lake sturgeon. The four loose `OUT` pixels below the chin (C-64) now appear on a
  shark and a coelacanth. → Whiskers only on barbelled fish (catfish, burbot, sturgeon, cod's single chin barbel). The shark
  needs a heterocercal tail, gill slits and a blunt head. The coelacanth needs lobed fins and a three-lobed tail.
- **[C-113] The new fish form lookalike groups, legendaries included** (Med):
  - Herring, Capelin, Rainbow smelt and Cisco: the same pale slim fish.
  - Lake whitefish, Grey mullet, American shad and Tarpon (Legendary): the same silver `fish` or `deep` shape.
  - Blue marlin, Sailfish (both Legendary), Wahoo and Garfish: the same `sword` with a different blue. The sailfish has no
    sail.

  At Journal size these can only be told apart by name. → One distinctive feature each: the sailfish's tall sail, the
  marlin's spear and high dorsal, the wahoo's stripes, the garfish's long beak, the shad's spots behind the gill, the
  tarpon's huge scales and upturned mouth.
- **[C-114] The colour layout is wrong on reef fish** (Low) — the template paints the back colour on top and the belly colour
  below. So the Blue tang is half blue and half yellow (it should be blue with a black "palette" mark and a yellow tail),
  the Mahi-mahi is a green and yellow ball (it should be a blunt-headed, long fish with a full-length dorsal fin), and the
  Parrotfish has a pink belly and no beak. → Per-species colour maps, not back/belly/fin.
- **[C-115] Golden, albino and ghost variants are CSS filters on the base sprite** (Med) — `progression.css`
  `.catch-pic.golden/.albino/.ghost canvas { filter: … }`, plus the same in `savePicture`. Golden turns the koi a flat
  yellow lemon. Albino is `grayscale + brightness`, so the albino catfish is mid grey with a white eye (it should be pink
  and white with pink-red eyes). Ghost is `grayscale + hue-rotate(160deg)` at 75% opacity: a grey fish that keeps the koi's
  orange polka dots. The title also says "Golden Golden koi". → Authored variant palettes per template (golden: a 3-tone
  gold ramp with a white glint row; albino: cream and pink with a red eye; ghost: pale cyan with a darker outline and 2-3
  floating sparkle pixels). Shots: [mainH-5-reveal.png](shots/world2/mainH-5-reveal.png), [cards-4.png](shots/world2/cards-4.png)
- **[C-116] The "It got away" silhouette is black on near-black** (Med) — `showNearMiss` → `drawShadow(sp.entry, 6)` on the
  `#1d1714` card. The hammerhead's shape is barely visible and the card looks empty. → Draw the silhouette in a light tone
  (`#5a4a40` on the dark card) with a 1 px lighter rim, or show it as a shadow on a water panel. Shot: [cards-4.png](shots/world2/cards-4.png)
- **[C-117] The reel minigame's fish is a CSS arrow, and the fight happens nowhere in the world** (Med) — `runReel` /
  `#reel .rl-fish` is a 22x14 cream `clip-path` polygon, on a smooth `linear-gradient(#1c3a52, #12202e)` track with a
  translucent rgba zone. The overlay sits on the bobber and the water, and the scene behind is frozen during
  `state === 'reelin'`: no bobber thrash, no splashes, no rod bend, no line tension. → Use the hooked fish's own silhouette
  (or a pixel fish icon) in a pixel-bordered track, and keep the world alive under it: the bobber dragging in a wake,
  splashes, the rod tip bending. Or shrink the overlay to one side so the water stays visible. Shot:
  [mainH-3-reel.png](shots/world2/mainH-3-reel.png)
- **[C-118] The named islanders are random visitors, and only 2 of the 11 ever appear** (Med) — `islandlife.js placeNamed`
  calls `islander(…, { kind: npc.kind })`, which uses `visitorLook(kind, r)`. Wen the "Pond keeper" is a stock elder
  in a purple dress on the edge of a path. Mara the "Harbour sailor" is a stock casual in a blue shirt on the cottage lawn,
  well away from the harbour. Neither has a role prop, though `people/classes.js` now has sailors, divers and fishers.
  Placement is a spiral search from wherever you arrive. `npc.region` is compared with `scene.regionKey` (the map id:
  'isle-1', 'exp-north' and so on) against region ids ('isle', 'north'), so Tal, Rook, Ines, Oda, Bram, Sefu, Dune and Yuki
  never spawn. → Give each named person a job class look (oilskin and cap for Mara, waders and a net for Wen, a parka for
  Oda) and a hand-placed home spot (the dock, the pond bank), and map regions with `regionOfMap`. Shot:
  [npc-wen-mara.png](shots/world2/npc-wen-mara.png)
- **[C-119] Every cosmetic hat is the same box, floating above the head, and outfits tint the skin** (High) — `lookfx.js
  PlayerLook.update`. Each hat is two Graphics rectangles (a brim and a crown) in the hat's colour, so the witch hat,
  antlers, crown, straw hat and flower hat are all the same bowler. The crown gets one red dot. The brim sits a row above
  the hair with the ground showing between, and it doesn't follow facing, the walk bob or the side view. Outfits are
  `player.setTint(mix(white, colour, 0.45))` over the whole sprite, so the face and hair change colour too: ghost greys the
  skin, kimono turns it pink, and tuxedo darkens the skin to brown. → Real hat sprites per view (down, up, side) attached to
  the head anchor of each frame, and outfit swaps that recolour only clothing palette indices (the people parts system
  already has outfits). Never tint skin. Shot: [hats-5.png](shots/world2/hats-5.png)

## Water and fishing effects (T-123+)

- **[T-123] Hot-spot bubbles and frenzies boil on the grass and the sand** (High; the user asked about clipping water) —
  `WaterFx.candidates()` keeps any tile where `ground_() === 'water'` (2+ wet corners, the T-01 / T-31 bug) and land is
  2-3 tiles away. That picks bank and shore cells: both Main Island hot spots sit on the edge. Bubbles float on the
  sand and foam at (2352,1232), and on the grass above the pond at (2128,1808). The frenzy ring is centred on the bank, so
  half of it lies on the lawn. The same test passes cells under docks (T-20). → Candidates need all four corners wet and 1+
  tile from any painted tile, with the bubble spread clipped to water pixels. Shots: [isl-hot1-z2.png](shots/world2/isl-hot1-z2.png),
  [isl-hot2-z2.png](shots/world2/isl-hot2-z2.png), [frenzy-3.png](shots/world2/frenzy-3.png)
- **[T-124] Bubbles and the frenzy ring are smooth vector shapes drawn above everything** (Med) — `WaterFx.update`:
  `g.fillCircle(x, y, 1..2.2)` at fractional positions and `strokeEllipse` (1.5 px) for the boil, on a Graphics at
  depth 3998. They are soft round discs bigger than a game pixel, off the pixel grid, and they draw over boats, docks, the
  player and tree canopies. → A 4-frame pixel bubble (1 px ring to 2x2 pop) and a 6-frame pixel boil ring in the water
  highlight colour, at water depth (below anything standing on the shore). Shot: [frenzy-3.png](shots/world2/frenzy-3.png)
- **[T-125] The fish shadow is a dark vector oval that wanders onto land** (Med-High) — `showShadow`:
  `add.ellipse(target.x + 16, target.y + 8, w, h, 0x0a1620, 0.42)`, orbiting 18x7 px round the bobber. It has no fish
  shape (a Trophy shadow is a 46x16 blob). It isn't clipped to water, so on the Main pond and the winter pond it lies on
  the grass and snow beside the bobber. → A soft pixel fish silhouette per size class (S to Trophy) that turns along its
  path, drawn only on water pixels (masked by the water layer) and swimming toward the bobber, not in a circle. Shots:
  [main-pond-wait-crop.png](shots/world2/main-pond-wait-crop.png), [ice-wait-wide.png](shots/world2/ice-wait-wide.png)
- **[T-126] The fish-finder is a vector ring and a vector triangle round the player** (Med) — `strokeCircle(pl.x, pl.y - 6,
  10 + k*40)` 1.5 px and `fillTriangle` in `0x9ae8ff`, at depth 3998. A big smooth cyan ring grows over the player and
  their neighbours, and a small cyan arrow sits on the player's head. → A pixel sonar ping drawn on the water only (3
  frames of a 1 px arc), and a 5x5 pixel arrow or a fish icon at the screen edge pointing to the spot. Shots:
  [isl-hot1-z2.png](shots/world2/isl-hot1-z2.png), [isl-hot2-z2.png](shots/world2/isl-hot2-z2.png)
- **[T-127] Legend-sense glints are faint dots on the bank** (Low-Med) — `g.fillRect(spot.x + cos*14, spot.y + sin*6 - 2,
  2, 2)` in pale yellow at sub-pixel positions round `waterAhead()`. That spot is often the grass bank (T-21), so the glints
  show on the lawn, and at alpha 0.4-0.8 on bright green they are nearly invisible. → A 3-frame gold sparkle (plus shape,
  1 px centre, 2 px arms) on water pixels only, plus a slow gold ripple. Shot: [legendsense-crop.png](shots/world2/legendsense-crop.png)
- **[T-128] Ice fishing has no hole in the ice** (Med-High) — `IslandScene` no longer blocks winter pond fishing, and
  `prepareCast` turns the water into 'ice'. But `Fishing.cast` and `splash()` act as if on open water: the bobber floats
  and bobs, water rings spread over the ice, and the fish shadow shows. On Island One the cast lands on the snowy bank a
  tile above the ice, behind a flower bed. → An auger hole sprite (a dark blue 10x5 hole with a white chipped rim and slush)
  placed on an ice pixel, the bobber or tip-up in it, no ripple rings (a slush wobble instead), and a small stool or
  bucket beside the player. Shot: [ice-wait-wide.png](shots/world2/ice-wait-wide.png)
- **[T-129] The bite "!" is serif web text** (Med) — `Fishing.bite`: `s.add.text(…, '!', { fontFamily: 'Georgia, serif',
  fontSize: '34px'/'44px', stroke 6 }).setResolution(4)`, scaled from 0.2 with Back.easeOut. It is an anti-aliased serif
  glyph several times the size of the head, unlike the pixel emote set (`emote_bang`). → Use `emote_bang` (or a 2x pixel
  version for rares, gold for legends) popping in over 2 frames. Shot: [bite-bang-crop.png](shots/world2/bite-bang-crop.png)

## World life props (S-126+)

- **[S-126] The secret marker reads as ":" on a flat disc** (Med) — `WorldLife.update` secrets:
  `fillCircle(sc.x, sc.y - 14 + bob, 6)` in `0xf2d36b`, then two dark rects (3x3 above 3x2). The "?" is two blocks, so it
  reads as a colon or a face. The disc has no outline or shading and bobs at sub-pixel steps on a Graphics at depth 3990,
  above roofs and canopies. → A 9x11 pixel "?" with an outline in the emote style (or reuse `emote_q`) over a small dug
  patch or a glint on the ground, at the object's depth. Shots: [secret-marker-closeup.png](shots/world2/secret-marker-closeup.png),
  [isl-secret-z2.png](shots/world2/isl-secret-z2.png)
- **[S-127] The locked secret is a padlock on a tan coin** (Low-Med) — the same function: a 5x4 dark rect plus a
  `strokeCircle(…, 2)` shackle on a `0x9a8a60` disc. It is crude, and the vector ring is soft. The thing you can't reach
  (a ledge, a cave) isn't drawn. → Draw the obstacle itself (a ledge with a rope end, a dark cave mouth, a snowdrift) with a
  small pixel padlock icon. Shot: [main-pond-seq.png](shots/world2/main-pond-seq.png)
- **[S-128] Viewpoints are a black stick with a vector triangle, on flat ground** (Med) — `WorldLife.update` views: a 3x22
  rect in the outline colour `0x1d1714` and `fillTriangle` in red, green or grey, with no base, shadow, outline or cloth
  wave. The locked "ledge" viewpoint is the same flag on open grass with a gold padlock floating over it (a gold rect plus
  a vector ring). Spots come from `scatter()`, which picks any free land, so viewpoints never sit on a high point. → A
  pennant sprite (a wooden pole with a lit edge, a 2-frame waving cloth, a stone cairn at the foot), placed on cliff tops
  and hills from the map. Locked ones on a visible ledge with a rope. Shot: [isl-markers-4.png](shots/world2/isl-markers-4.png)
- **[S-129] Forage sparkles are a faint plus that disappears on grass** (Med) — two `fillRect`s (2x8 and 8x2) in `0xfff2a0`
  at alpha 0.5-1. On the bright island grass the plus is almost invisible, it is the same for every item (shell, flower,
  pinecone), and it bobs at fractional y. → A small item sprite on the ground (a shell, a mushroom, a pinecone) with a
  2-frame white glint, plus a darker 1 px outline so it reads on grass and sand. Shot: [isl-markers-4.png](shots/world2/isl-markers-4.png)
- **[S-130] The island minimap is three flat colours on black** (Low) — `WorldLife.minimap()`: `fillRect(gx*k, gy*k,
  2*k + 0.5, …)` in water, sand and grass only, so plazas, paths, cliffs, buildings and the museum all show as grass. The
  overlapping fractional rects leave faint grid seams. → Build the map from the real tile classes (path, cliff, roof, water
  depth), with pixel icons for the museum, dock and viewpoints, at an integer scale. Shot: [field-Places.png](shots/world2/field-Places.png)
- **[S-131] (e2e0a5b) The "Tap to look closer" chip sits over the painting** (Low) — `daily.css .daily-zoom`, 11 px text on a
  rounded `rgba(22,16,13,.8)` chip in the painting's lower right corner, covering part of the artwork. → A magnifier icon
  button outside the frame, or the hint under the title. Shot: [daily-poty.png](shots/world2/daily-poty.png)

## Re-check of earlier findings

- [R-07] STANDS. The arch-top crop still replaces the balustrade beam over the middle arch with a dark crown bar, now framed
  between the two wider capitals. Shot: [hall-midarch-z5.png](shots/world2/hall-midarch-z5.png)
- [R-23] STANDS. The railing still sits on the wall plane (`placeHall`, y = top + 8) and the columns, now 34 px, stop under
  it with no fascia, soffit or overhang. Shot: [hall-midarch-z5.png](shots/world2/hall-midarch-z5.png)
- [R-25] STANDS. The newels still use the old branch, `bakeColumn(this, 'hall_newel', 20)` (22 px marble stubs). Next to the
  new 11-tone world columns they now also clash in style (R-134). Shots: [phone-hall-sheet-2.png](shots/world2/phone-hall-sheet-2.png),
  [toolkit-columns.png](shots/world2/toolkit-columns.png)
- [R-29] PARTLY. #191's Ionic and Composite have real 5 px spiral volutes (`volute()`), a proper abacus and 3-tone fluting
  with entasis. There is still no egg-and-dart band, and the default Corinthian capital is noise (R-116). Shot:
  [caps-classical-9x.png](shots/world2/caps-classical-9x.png)
- [R-38] STANDS. The atrium columns (now 34x70) still end 4 px under the wall crown with no entablature. Shot:
  [atrium-left-2styles.png](shots/world2/atrium-left-2styles.png)
- [R-42] STANDS, and it's worse. Shaped-room columns are now 88 px (were 72), still holding nothing (terraces and cross
  examples), and the toolkit adds 31 free-standing column items (R-135). Shots: shots/world2/room4-haida-z4-crop.png,
  [room8-caryatid-z4-crop.png](shots/world2/room8-caryatid-z4-crop.png)
- [R-82] PARTLY. The columns now have stepped 11-tone shading and selective outlines, close to the LPC target. The rails,
  newels, stairs and walls around them are still flat 1-2 tones, so the gap between styles is now inside the hall itself.
- [R-111] STANDS, and it's worse. At 34 px wide a column now hides a curator standing behind it completely (no red pixels left).
  Shot: shots/world2/hall-behindcol-crop.png
- [C-51] STANDS. The rods use `bobberTexture` while the Journal still uses CSS `.bob-dot` gradient circles, and every bait
  and lure row now shows the same cork-coloured dot (`--top:#c8904a`), so worms and bread look like bobbers.
- [C-54] STANDS. `Fishing.splash()` is unchanged (vector ellipse rings and 1.5 px rects), and the new rarity twitches fire
  more of them.
- [C-57] STANDS, and it's worse: 72 fish now share the 8 templates (C-110). Shot: [newfish-6x-b.png](shots/world2/newfish-6x-b.png)
- [C-58] STANDS (`fishart.js` unchanged). On the dark catch card the 1 px outline stalk vanishes, so tails float detached
  from the body. Shot: [mainH-5-reveal.png](shots/world2/mainH-5-reveal.png)
- [C-59] STANDS (no pectoral, anal or pelvic fins, gill or mouth on any of the 54 new fish).
- [C-60] STANDS (the koi is unchanged, and the ghost variant keeps the polka dots). Shot: [cards-4.png](shots/world2/cards-4.png)
- [C-61] STANDS (`bars` logic unchanged).
- [C-62] STANDS (`round` still has no spines, now also used for lumpfish, skate, manta and mola).
- [C-63] STANDS (the squid template is reused for the new cuttlefish).
- [C-64] STANDS, and it spreads: the loose-pixel whiskers are now on 7 more species, sharks included (C-112).
- [C-65] STANDS. The 8 new Legendary fish are template swaps. The reveal adds a gold border and a burst, but the sprite has
  no shimmer or unique shape. Shot: shots/world2/mola-5-reveal.png
- [C-66] STANDS. Size classes (S to Trophy, up to 4.5 m) now exist in data and on the card, but every fish is still 26x16.
- [C-67] STANDS. The reveal card is `#1d1714`, the same as the outline, so the golden koi and ghost koi lose their outlines.
  Shots: [mainH-5-reveal.png](shots/world2/mainH-5-reveal.png), [cards-4.png](shots/world2/cards-4.png)
- [C-68] STANDS. `waterAhead()` is unchanged. On the Main pond the bobber lands on the grass bank half a tile above the
  water. Shot: [main-pond-wait-crop.png](shots/world2/main-pond-wait-crop.png)
- [C-69] STANDS. `Fishing.land()` still adds the catch with `setScale(0.9)`. Shot: shots/world2/ice-seq.png
- [T-09] STANDS. WaterFx adds no reflections, and the bobber, boats and shadow still sit on the water with nothing below.
- [T-20] STANDS. `waterAhead()` is unchanged, and hot-spot candidates use the same `ground_()` test, so they can sit under
  docks too.
- [T-21] STANDS. The Main pond cast lands on the grass (above), and the winter Island One cast lands on the snow a tile
  above the ice. Shots: [main-pond-wait-crop.png](shots/world2/main-pond-wait-crop.png), [ice-wait-wide.png](shots/world2/ice-wait-wide.png)
- [T-22] STANDS. The line is still a Graphics `lineBetween` at depth 4000 (a rod skin only recolours it), and it crosses a
  flower bed in the winter shot. Shot: [ice-wait-wide.png](shots/world2/ice-wait-wide.png)
- [T-35] STANDS (all splash, ripple and twitch rings are still `add.ellipse().setStrokeStyle`).

## Top 5 (new content)

1. **Close the gaps and fix the faces on the columns** (R-115, R-117, R-119): the floating Doric and Nasrid capitals, and the
   Caryatid, Haida and Yoruba posts that read as ghosts and emoji. These are the most visible breaks, and the last two are
   culturally sensitive.
2. **Redraw the default Corinthian capital** (R-116): it is in every hall, atrium and shaped room by default.
3. **Give the 54 new fish real body plans and markings** (C-110, C-111, C-112): rays, eels, flatfish, sharks, a seahorse
   and a mola that look like themselves, not 8 recoloured lemons.
4. **Keep water effects on water** (T-123, T-125, T-128, T-127): hot spots, fish shadows, glints and ice fishing are all
   drawn on grass, sand or snow because they reuse the 2-corner water test.
5. **Real cosmetics** (C-119): per-view hat sprites on the head anchor and clothing-only recolours, never tinting skin.

## Systemic issues (new content)

- **The 2-corner "water" test is reused by every new water feature.** Hot spots, frenzies, fish shadows, legend glints and
  ice casts all inherit the bank and shore false positives of `ground_()`, so new effects land on land (T-123, T-125, T-127,
  T-128). One shared "inside the drawn water" test would fix all of them, plus T-20, T-21, T-31 and T-36.
- **Effects are Phaser Graphics vector shapes on top of the world.** WaterFx (depth 3998), WorldLife (3990) and lookfx
  draw circles, ellipses, triangles and fractional rects every frame. They are anti-aliased, off the game-pixel grid, and
  above canopies, roofs and people. Each needs a small pixel sprite sheet drawn at the right depth.
- **One template, many identities.** The fish (8 shapes, 72 species), the hats (one box, 9 hats), the named NPCs (stock
  visitor kinds) and the columns (one 34 px box, 31 cultures) each squeeze many distinct things into one generic shape,
  so the content count rises but the variety you see does not.
- **CSS stand-ins for art.** The reel fish is a clip-path polygon, the variants are CSS filters and the bobber and bait
  icons are CSS gradient dots, so the fishing UI shows almost no pixel art beyond the catch sprite.
- **Fractional scales again.** Toolkit column icons are at 0.61x, the column picker at 1.235x, the catch flies at 0.9x and
  the Field-journal cells use `object-fit: contain`.
- **The architecture doesn't adapt.** Choosing a column style changes only the shafts. The railing, newels, stairs, arch
  frames and slots keep their classical design and their old positions, so the wider and culturally specific columns
  collide with them (R-113, R-114, R-134).

## Keep

- The column system itself: 31 designs with true facts, a selective outline, 11-step tone banding and a consistent light
  direction. Minoan, Hoysala, Japanese, Art Deco, Gilded Corinthian, Malachite and Romanesque already read well at phone size.
- The Ionic volutes (a real spiral now) and the Solomonic twist silhouette.
- The idea of a rarity-scaled reveal (pause, dim, burst, music duck for legends) and the near-miss card. They need pixel
  art and visible silhouettes, not a new design.
- The data: the fish blurbs are true and specific, every legend has a clue, and the region and season rules are good game
  design.
