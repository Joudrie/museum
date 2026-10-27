# Curation: full playtest prompt

Paste this into a fresh session (or say "run the playtest") to have Claude
test every common thing a player does, in the order a new player meets it,
then fix what's wrong.

---

## The prompt

You are playtesting **Curation** (Phaser + Vite, `src/`). Test the way a
player plays: a phone held upright, **390×844**, touch, press-and-drag to
walk. Build (`npx vite build`), serve (`npx vite preview --port 4173 --base /
--strictPort`), and drive the game with Playwright
(`PW=/opt/node-tools/node_modules/playwright`). Start from a wiped save, then
go through the steps below **in order**.

For every step:
- **Do it the way a player would.** Use drag gestures and taps on the real
  buttons. Only use script shortcuts (`__game.scene.getScene(...)`) to get
  into position or to skip a wait, never to fake the thing being tested.
- **Screenshot** wherever the step says 📸, and at anything that looks wrong.
  Save them to `scratchpad/playtest/NN-name.png`.
- **Judge it against the pass check.** Ask three things:
  - Does it work?
  - Does it look right?
  - Does it *feel* right: responsive, readable, satisfying, no surprise
    walls?
- Log each step as ✅ pass, ⚠️ works but feels off, or ❌ broken, with one line
  on why.

Afterwards, fix every ❌ and every ⚠️ that has a clear fix. Re-run those steps.
Keep `tests/smoke.cjs` and `tests/gaps.cjs` green. Then report:
- the table of results
- a contact sheet of the key screenshots
- what you fixed and what still needs Sean

**Out of scope for now:** the menu redesign (layout and look of the panels).
Still test that the menus *work*.

### Rules of thumb for walking, hitboxes and depth

- **You walk behind tall things.** Only the footprint on the ground is solid:
  the trunk, the post, the legs, the base. Leaves, lamp tops, roofs, the top
  of a bookcase or fireplace and a statue's head draw over you when you're
  behind them, and never stop you.
- **Things in front of you draw over you; things behind you draw under you.**
  Sorting is by the point where each thing touches the floor. Look for
  anything that "sits on" the player when they stand just in front of it,
  such as fire, glows or a sprite's top edge.
- **No invisible walls.** Every stop should have something visible causing
  it. Walk along every edge, and around every object on all four sides.
- **No getting stuck.** Coming out of a menu, a doorway, a spawn point or
  someone else's path never leaves you trapped.
- **Doorways have depth.** You can step about one tile into an open archway
  before it takes you through. Locked doors and arches stop you at the wall.
- **Hitboxes are fair both ways.** Visitors and staff don't walk through
  furniture or each other, and you slide around people instead of stopping
  dead.

### The steps

**1. First launch**
- 1.1 Fresh load: no crash screen, the loading view, then the entrance. 📸
- 1.2 The caretaker greets you: the bubble is readable, points at him, and
  closes on tap. 📸
- 1.3 HUD: name, coins, income, visitors and rating all fit on one line,
  with nothing clipped.

**2. Walking**
- 2.1 Press-and-drag walks. A short drag walks, a long drag runs, and lifting
  your finger stops at once.
- 2.2 The joystick shows where you pressed and the knob follows. A quick tap
  does **not** walk.
- 2.3 Walk in all 8 directions: the facing sprite matches, the walk
  animation steps, footsteps play and dust shows when running.
- 2.4 The camera follows smoothly with no shake or drift. Weather and
  sparkles stay attached to the ground, not the screen.

**3. Hitboxes and depth in every room**

Walk the full edge of each room, and around every object on all four sides:
- the entrance: the desk, the trees in pots, the paintings' coin spots
- the main hall: the columns (you can stand between a column and the wall),
  both stair flights, the balcony
- the atrium: the fountain, the statues, the side stairs
- each shaped room: terrace drops, stairs, columns, the sunken pit's
  railings, the stairwell
- the library: shelves, the fireplace, the clock, the rug, the chairs and
  the tables
- a built vertical, horizontal and big-hall room with toolkit decor in it

For each:
- 3.1 Only footprints block. 📸 Stand behind a tall object to show it.
- 3.2 Stand just in front of the fireplace, the statues, the bookshelves
  and the potted trees. You should draw over them, and nothing should draw
  on top of you (including fire and glows). 📸
- 3.3 No void pixels or black gaps between walls (also covered by
  `tests/gaps.cjs`).

**4. Interact button**
- 4.1 It appears only when something is in reach. Its icon matches the
  thing: look, clean, talk, door, stairs, build, fish.
- 4.2 It sits at the bottom right, clear of the joystick and the HUD, and
  works by tap and by Space/Enter.

**5. Cleaning up the entrance (tutorial)**
- 5.1 Walk to each crack, stain and cobweb, interact, and it clears with a
  sound and a puff.
- 5.2 Cleaning all of them finishes the goal, and the journal badge
  appears. 📸

**6. Coins**
- 6.1 Coins pile up in front of paintings and on the green pad. Walking
  over them collects them, with a sound and a number that goes up.
- 6.2 "Collect all" works, and the HUD updates.

**7. Paintings**
- 7.1 Interact with an empty slot: the Place painting / Plain wall / Door
  menu works.
- 7.2 Hang a painting. It sits on the wall at the wall's angle. 📸
- 7.3 View it: the full-detail viewer opens, swiping goes to the next one,
  and the info, rating and note fields work. 📸 Close it and you can walk
  again.

**8. Doors and archways**
- 8.1 The entrance's double doors offer the main hall unlock, and paying
  opens it.
- 8.2 Walk through every door with Interact: there's a fade and a small step
  forward, you spawn facing into the room, and you don't bounce back
  through.
- 8.3 **Archways:** walk up into an open arch. You step about a tile into
  it (you visibly stand inside the opening), then pass through with no fade.
  Coming back, you appear just inside the arch. 📸
- 8.4 Locked arches and doors (balcony stairs, the side arches, a locked
  atrium) stop you at the wall. Interact explains why or offers the unlock.

**9. Rooms**
- 9.1 Atrium unlock, then each shaped room in turn. Their ratings show on
  entry.
- 9.2 Build a new room: the vertical/horizontal and short/medium/long
  pickers, the dotted-line preview, and the end-piece carousel (swipe
  up/down, never sideways). 📸
- 9.3 The new room appears, and you can walk through to it.

**10. Toolkit (hammer)**
- 10.1 Open it, pick an item and drag it. The footprint shows green when it
  fits and red when it's blocked. 📸
- 10.2 Place it, tap it, then move, rotate and sell it. The gold changes
  correctly.
- 10.3 Placed items block only their footprint, and their tops draw over you
  when you're behind them.

**11. Customize, journal, office, staff** (only that they work)
- 11.1 Customize: this room's floor, walls and theme, plus the character.
  Changes show at once and persist.
- 11.2 Journal: claim a goal and the gold arrives. The Paintings, Visitors
  and Fish tabs show.
- 11.3 Curator's Office: an upgrade raises the limits.
- 11.4 Hire a janitor, a guide and a carpenter. Each shows up and does their
  job.

**12. People**
- 12.1 Visitors wander, look at paintings and talk when you interact. The
  bubble is readable and points at them.
- 12.2 Visitors don't overlap you or each other, and nobody stands inside
  walls or furniture.
- 12.3 Famous visitors show up in the main hall and can be talked to.

**13. Outside**
- 13.1 Walk down out of the entrance's front doors onto the island steps.
- 13.2 Walk around and **behind** every palm, tree, pine and lamp post: only
  the trunk is solid. Check fences, hedges, the fountain, huts, the cottage,
  the cliff and its stairs, and the dock. 📸
- 13.3 Tall grass draws over your legs. Footprints show on sand. Water
  edges splash.
- 13.4 Ambient life (ducks, critters, boats) doesn't block you or clip
  through land.
- 13.5 Walk back up into the museum doors to go inside.
- 13.6 Go outside a **second** time: everything still works.

**14. Fishing**
- 14.1 Face the pond, then the sea. The button turns into Fish.
- 14.2 Cast: the line goes out, the bobber lands with a splash, and it
  bobs and nibbles. 📸
- 14.3 The bite: the bobber goes under and a **!** pops up. Tap anywhere and
  the catch flies to you and the catch card shows. 📸
- 14.4 Tap too early: it reels in with a message. Miss the bite: "It got
  away…". Walking off cancels.
- 14.5 Journal → Fish: the log and bobbers update. Equipping a bobber
  works. In winter the pond is frozen.

**15. The angled room (cottage)**
- 15.1 Walk up into the cottage door and the angled room opens. 📸
- 15.2 Walk everywhere: only furniture footprints block, and you draw
  correctly in front of and behind each piece.
- 15.3 Tap an armchair and it turns. 📸 Walk back into the door to leave.

**16. Lighting and time**
- 16.1 Check day, dusk and night (Settings, or set the hour). Lamps, windows
  and the fireplace glow. The dark is readable, not muddy. 📸
- 16.2 Weather: rain and snow look right, puddles form, and the pond freezes
  in winter.
- 16.3 The day/night toggle in Settings turns the effect off cleanly.

**17. Saving**
- 17.1 Reload: rooms, decor, paintings, coins, fish and character are all
  kept.
- 17.2 A corrupt save shows the reset screen, not a blank page.

---

## Automated part

`tests/playtest.cjs` runs the checks a script can judge, in the same order,
and saves screenshots. Run it with
`PW=/opt/node-tools/node_modules/playwright OUT=<folder> node tests/playtest.cjs`.
It covers:
- walking: tap vs drag, walk vs run, facing
- cleaning, the painting viewer, the hall and atrium unlocks
- locked arches, stepping into an open archway and through it
- the fireplace at day and at night
- the library shelves
- the toolkit
- every island tree and lamp post: behind it, beside it, its trunk
- a second island visit
- fishing, the angled room, the night look, reload
The steps that need eyes (look, feel) are for the person or session running
the prompt above.

## Last run (Oct 2026)

31 automated checks pass.

Fixed in this run:
- **Trees and lamp posts:** only the trunk or post is solid now, so you
  walk behind the leaves. Before, the whole bottom row of the tree was a
  wall.
- **The library fireplace:** the fire no longer draws over you at night.
  The glow is softer, with a small bright core on the fire.
- **Archways:** you step about a tile into an open arch before going
  through.
- **The locked atrium:** walking into the main hall's middle arch while the
  atrium was locked took you in without paying. It now stops you at the
  wall, and Interact offers the unlock.
- **Speech bubbles:** the caretaker's bubble no longer stays on top of the
  painting viewer and the unlock offer.
- **Night:** a brighter moonlit night, readable on a phone and still dark
  enough for the lamps to matter.
- **Going outside twice:** the second visit could crash or freeze (fixed
  earlier).

## Full run (Oct 27, 2026)

The whole prompt, including the hands-on steps.

| Step | Result |
|---|---|
| 1 First launch, greeting, HUD | ✅ |
| 2 Walking: tap, drag, walk vs run, facing, camera | ✅ |
| 3 Hitboxes in every room | ✅ A red overlay of each room (entrance, hall, atrium, 5 shaped rooms, library, break room) shows solid areas only at walls, drops, stairs, pits and furniture footprints. |
| 3.2 Depth | ✅ Palm, statue, cherry tree, bookshelf and lamp hide you from behind, and you draw over them in front. The fireplace no longer draws over you. |
| 4–7 Interact, cleaning, coins, paintings, viewer | ✅ |
| 8 Doors, locked arches, archway step-in | ✅ |
| 9 Rooms, build menu | ✅ The end carousel scrolls vertically, and the page never scrolls sideways. |
| 10 Toolkit | ✅ Pick, ghost, Place, back to the list. Items are free while testing. |
| 11 Customize, journal (claim +50), settings | ✅ |
| 12 People | ✅ (smoke test: nobody inside walls, no overlaps) |
| 13 Island hitboxes | ✅ Only trunks and posts block: trees, palms, lamp posts, signposts, the beach umbrella and the scarecrow. |
| 13 Island, other | ✅ Tall grass covers your legs, and rain and snow look right. |
| 14 Fishing | ✅ |
| 15 Angled room | ✅ |
| 16 Night, and the day/night toggle | ✅ Night is readable. With the toggle off, a night hour shows full brightness. |
| 17 Saving, corrupt save | ✅ |

Fixed in this run: the beach umbrella and the scarecrow now block only at
their pole.

