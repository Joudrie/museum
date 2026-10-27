# Curation: Backlog (base-building first, mini-games later)

## Noted from the user (islands)
- Grass should blend into other surfaces (paths, dirt, stone), not hard square edges.
- The island being built in the builder ("Recovered island", backup in docs/maps/) will become the default spawn island.
- The museum exterior on the island needs re-texturing (look to be specified).

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
- Done: **coin spots**. Each painting piles up its own coins on the floor in front of it; everything else (decor, coffee) piles up on a green pad near the room's entrance. Stand on a spot to collect it. "Collect all" (under the top bar) collects every room after a short ad (a placeholder for now).
- Done: **staff and security**. One janitor per room (hire in Customize; each costs more), rarely seen mopping a single puddle. A security guard (black suit, shades, earpiece) stands by the main hall's middle arch and offers cameras; without cameras, a rare robbery pop-up takes a painting off the wall after time away.
- Done: **famous visitors** (van Gogh, Leonardo, Monet, Frida) in the main hall: +5% income per artist met. Curator hats, facial hair and glasses.
- Done: 19 famous visitors (painters plus Socrates, Aristotle, Shakespeare, Einstein, Cleopatra, Napoleon, Lincoln, Mozart) with distinct looks and more lines. Later: semi-mythological figures.
- Done: **break room** behind the hallway's left door (checker floor, lockers, donut table, sofa) where hired staff hang out (up to 6), with a **staff board** to hire **tour guides** (one per 3 rooms, +10% income each, lead a line of visitors around the main hall) and the **carpenter** (yellow hard hat; patches the entrance's cracks, works on your newest room; rooms still build instantly).
- Later (user): break room upgrade menu, West Wing outline, collection screens and the menu redo, mini-games, pixel packs.
- Done: **room ratings**. Each room scores out of 100 (1-5 stars): paintings 40 (wall spots filled), decor 25 (5 per item), clean 20 (−7 per mess), style 15 (pattern, wainscot, carpet, plants). Shown when entering a room and in Customize with tips; the museum rating (average of open rooms) is in the top bar and scales visitors from 0.6× to 1.4×.
- Goal: get the most visitors. More paintings → more visitors; complete sets → big bonus; every decoration adds a little income.
- Coffee shop room: visitors buy coffee; decorate it (bookshelves etc.).
- Done: real gold. Start with 300. Each room earns gold/hr (5 per painting + each item's income); it piles up as a coin heap near the room's entrance (max 8 hours' worth). Walk up and Interact to collect. Items cost gold (sell for half back); each new room costs more (bigger rooms cost more). Testing button: +1,000 gold.
- Done: **Services** in the toolkit. Coffee counter (1 per museum, barista behind it) earns 1 gold/hr per 100 monthly visitors. Rooms collect puddles and litter (one per 90 min, max 3, each -10% room income; Interact to mop). Janitor closets (up to 3) each hire a janitor who keeps 3 rooms spotless and is sometimes seen with a mop.
- Done: **Curator's Office**: a desk in the first room run by Edmund the caretaker. 5 levels (500 / 2,000 / 8,000 / 30,000 gold) raise the room cap (3 → 5 → 8 → 12 → unlimited) and janitor cap (1 → 3), and unlock relics, statues, the coffee counter, big halls, science pieces and the T-rex. Everything is free while testing.
- Next: see the vision doc (designed map, staff v2, ratings).
- Janitor break room: hire janitors who keep the place clean (rarely seen holding a mop by a puddle).

## Big pass (autonomous polish) ✅
- Bug sweep with a repeatable smoke test, dynamic lighting with day/night, deeper characters and livelier visitors, one UI system with Settings, a HUD breakdown and a painting gallery, a journal with goals and a collection book, 49 paintings, 8 new decor items, celebrations and visitor love. Full log: `docs/BIG-PASS.md`.

## Expansion (brainstorm in DESIGN.md → Expansion ideas)
- Built: island tileset for expeditions (`src/tiles.js`, preview at `tiles.html`).
- Next candidates:
  1. Front lawn, seasons and room presets.
  2. Dinosaur hall with fossil shelves.
  3. Elevator and the first new floor.
  4. Garden (Sean designs).
  5. Gift shop and food court.
  6. First pirate-island expedition.

## Needs Sean
- **West Wing**: waiting for your outline.
- **Semi-mythological famous visitors** (you said maybe later).
- **Mini-games**.
- **Pixel packs**: allow kenney.nl, opengameart.org and itch.io under the environment's Network access, then I can pull in free assets.
- **Break-room upgrade menu**: what should upgrades do (faster janitors, guide bonus, carpenter speed)?
- **Collection screens / menu redo**: the journal is a first version you can redesign.
- **Wikimedia images**: 33 new paintings' links are built from Commons file names but couldn't be tested here (Wikimedia is blocked in this environment). Any that don't load show a colored placeholder; tell me which ones and I'll fix the file names.
- **Goals**: are the 19 goals and rewards the right pace? Want daily goals?

## Someday
- A sequel or expansion where the museum is part of a city.
