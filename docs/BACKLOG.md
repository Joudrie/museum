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

## Phase 5: A proper museum
- Beyond paintings: relics, artifacts, science (dinosaur hall), a big garden.
- Themed rooms and wallpapers (e.g. an Egyptian room with hieroglyph wallpaper).
- Far more floors and wall materials: many woods, patterns, tiles (Pinterest research for references).
- Per-room music; different lights.

## Phase 6: Economy
- Goal: get the most visitors. More paintings → more visitors; complete sets → big bonus; every decoration adds a little income.
- Coffee shop room: visitors buy coffee; decorate it (bookshelves etc.).
- Janitor break room: hire janitors who keep the place clean (rarely seen holding a mop by a puddle).

## Someday
- A sequel or expansion where the museum is part of a city.
