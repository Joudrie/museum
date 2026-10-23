# Curation: Backlog (base-building first, mini-games later)

## Phase 1: Polish the base ✅
- Walking animation (a small bounce/shuffle) for player and visitors.
- Remove dirt stains from walls.
- New rooms start plain: light gray walls with no texture; normal wood floor.
- Visitors: many more looks; name, look and personality match (e.g. older visitors are gray or bald).

## Phase 2: Wall slots ✅
- Every slot starts as a painting outline. Interact → **Place painting / Plain wall / Door**.
- A plain wall hides the outline but stays interactable, so you can add a painting later.

## Phase 3: Decor toolkit ✅ (first pass)
- Toolkit menu: pick an item, drag it onto the tile grid, see its footprint in tiles, place it.
- Every placed item earns a little money (even a cheap stool).
- Items: lots of plants, benches/stools, lights, statues, suits of armor, relics, dinosaur bones, waterfalls/fountains, bookshelves.
- Done: 19 items in 6 categories (seating, plants, lights, sculpture, relics & science, features), grid snapping with green/red footprint, move/rotate/remove, collision, gold-per-day income + visitors in the HUD. Next: more items, real coin spending once the economy lands.

## Phase 4: Rooms v2 ✅ (first pass)
- Resize any room at any time (e.g. short → long) without losing its decor. Geometry may overlap; it's a game.
- More room shapes: big rooms, square rooms, corner/L-shaped rooms.
- Door frames are customizable; a door can become an **archway**.
- Same-axis rooms joined by an archway: walk straight through with no fade/black screen.
- Re-shuffle and repurpose rooms (e.g. turn the first room into a front desk).
- Elevators and stairs to other floors.
- Done: resize any room (decor kept; items nudged to the nearest free spot), big halls (7×7 / 9×9 / 12×12), door or archway exits (archways walk straight through, no fade), rename rooms, reorder rooms (decor moves with them).
- Still to do: corner/L-shaped rooms; truly seamless archways that show both rooms at once.

## Phase 5: A proper museum ✅ (first pass)
- Beyond paintings: relics, artifacts, science (dinosaur hall), a big garden.
- Themed rooms and wallpapers (e.g. an Egyptian room with hieroglyph wallpaper).
- Far more floors and wall materials: many woods, patterns, tiles (Pinterest research for references).
- Per-room music; different lights.
- Done: one-tap themes (Classical, Egyptian, Japanese, Natural history, Modern, Moody), wall patterns (damask, hieroglyphs, sakura, brick, marble), floors (herringbone, parquet, marble, mosaic, sand), per-room lighting (warm/day/cool/moody), generated per-room music + mute, 11 new items (obelisk, canopic jars, cherry tree, stone lantern, bonsai, T-rex, meteorite, telescope, specimen jars, geode, velvet sofa).
- Texture update: 24 floors (adds wide and diagonal planks, hex tile, terrazzo, cobblestone, flagstone, brick, penny tile, slate, concrete, patterned tile, tatami, carpet, grass), 25 wallpapers (adds wood paneling, shiplap, subway, stone blocks, concrete, pinstripe, bold stripes, dots, fleur-de-lis, trellis, zigzag, plaid, art deco, seigaiha waves, leaves, stars, Greek key, hexagons), 14 wainscot designs (panels, tall panels, beadboard, board & batten, shiplap, subway, stone, marble, harlequin, lattice, checker tiles, Greek key, painted bands).
- Still to do: a big outdoor garden room; more relics/artifacts.

## New start (from the sketch) ✅
- Entrance with ticket desk, then a paid-unlock main hall: hallway (break room and office doors), open hall with two staircases up to a full-width balcony with four big paintings. Built rooms continue from the hall's middle arch. Office door opens the Curator's Office; break room is coming soon.

## Phase 6: Economy (in progress)
- Goal: get the most visitors. More paintings → more visitors; complete sets → big bonus; every decoration adds a little income.
- Coffee shop room: visitors buy coffee; decorate it (bookshelves etc.).
- Done: real gold. Start with 300. Each room earns gold/hr (5 per painting + each item's income); it piles up as a coin heap near the room's entrance (max 8 hours' worth). Walk up and Interact to collect. Items cost gold (sell for half back); each new room costs more (bigger rooms cost more). Testing button: +1,000 gold.
- Done: **Services** in the toolkit. Coffee counter (1 per museum, barista behind it) earns 1 gold/hr per 100 monthly visitors. Rooms collect puddles and litter (one per 90 min, max 3, each -10% room income; Interact to mop). Janitor closets (up to 3) each hire a janitor who keeps 3 rooms spotless and is sometimes seen with a mop.
- Done: **Curator's Office**: a desk in the first room run by Edmund the caretaker. 5 levels (500 / 2,000 / 8,000 / 30,000 gold) raise the room cap (3 → 5 → 8 → 12 → unlimited) and janitor cap (1 → 3), and unlock relics, statues, the coffee counter, big halls, science pieces and the T-rex. Everything is free while testing.
- Next: see the vision doc (designed map, staff v2, ratings).
- Janitor break room: hire janitors who keep the place clean (rarely seen holding a mop by a puddle).

## Someday
- A sequel or expansion where the museum is part of a city.
