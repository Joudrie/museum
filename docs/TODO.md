# Master to-do board (every chat reads this first)

Many chats work on Curation at the same time. This file is how they stay aware of each other.
Read `CLAUDE.md`, `docs/VISION.md` and `docs/HANDOFF.md` first, then this board.

## How to work with other chats
1. **Claim before you start.** Pick a stream (or one task in it) that is `open`. In its **Claim** line write
   `claimed: <short chat name> <date>` and push that one-line change straight to `main` through the usual PR (tiny PR, merge it). Do not start a stream someone else has claimed.
2. **Stay in your lane.** Each stream lists the files it owns. Add new files freely. For **shared files** (`src/IslandScene.js`, `src/RoomScene.js`, `src/tiles.js`, `src/style.css`, `index.html`, `src/collections/index.js`, `docs/HANDOFF.md`, `tests/*.cjs`) make **small, additive edits** and pull `main` right before you push, so merges stay trivial.
3. **Merge often, small PRs.** Merge yourself (CLAUDE.md). Then reset your branch to `main`. A stream that sits unmerged for a day will conflict with the others.
4. **When you finish** a task: tick it `[x]`, put the PR number beside it, add 2 to 4 lines to `docs/HANDOFF.md` under your feature, and send the game and builder links.
5. **Tests:** run `node tests/content.cjs`, `smoke`, `gaps`, `collections` and (if you touch rooms or islands) `playtest`. The playtest and the smoke "cottage door" check are **flaky on a clean `main`** (they fail the same way without your change): re-run before blaming your work.
6. **Don't ask the user mid-task.** Use sensible defaults, write the question into **Needs Sean** at the bottom, and keep going.
7. Phone only, brief answers, no black wall gaps, portrait only, 32px grid for the museum (see CLAUDE.md).
8. The user is **remaking all the sprites by hand later.** Anything placeholder stays placeholder. Do not restyle, hire or plan art. Make things *work* with the current pictures, and keep art swappable (data, not code).

## Where things stand (done)
Collection format and registry (#77) · content pipeline built (#78) and run live (#79) · 27 painting drafts, none approved (#90) ·
builder ⟳ turn for multi-side pieces (#82) · dig spots with brushing (#87) · fossils collection and fossil dig spots (#94).

---

## Stream A: Content and images (the pipeline)
Owns: `tools/`, `content/`, `docs/CONTENT*.md`, `src/collections/data/paintings.js`. Claim: `open`
- [ ] **Host our own copies of the paintings.** The 49 paintings hot-link Wikimedia, which answers 429 and 404 (`content/image-fixes.json`). Download each, resize to 1280px (under about 500 KB, right shape), commit to `public/paintings/`, point the data at them. Fixes broken, heavy and slow in one go. (Don't swap anything the user hasn't approved; list the proposed swaps first.)
- [ ] Fix the 3 broken links (horse-fair, temeraire, crossing-delaware) and the 8 wrong shapes: propose replacements from `content/image-fixes.json`, user approves.
- [ ] Hooks for the 4 Met drafts (Night-Shining White, Esther, Gulf Stream, Drawing Lesson): find a quotable museum or Commons sentence, add it as a claim, re-check.
- [ ] A third and fourth batch (more regions, more women artists, 18th to 20th century), pinned by id where possible.
- [ ] Smithsonian and Rijksmuseum adapters need keys (Needs Sean). Art Institute of Chicago is behind a bot challenge: do not work around it.
- [ ] After the user approves drafts: `node tools/publish_content.mjs --collection painting`, run all tests, PR.
- [ ] Natural-history and archaeology sources for the other collections (public-domain imagery, true short facts with a quoted source).

## Stream B: Digging v2 and excavation
Owns: `src/dig.js`, `src/collections/data/{minerals,fossils}.js`. Claim: `open`
- [ ] More finds: pottery shards, coins, arrowheads, shells, meteorites. New collections as data (copy `fossils.js`).
- [ ] Dig tools (brush, trowel, pick) that change how fast and what you find; a bone that needs several spots to complete.
- [ ] Bigger dig sites: a cliff face or trench you work across several tiles, found on expedition islands.
- [ ] A metal-detector hunt (warmer / colder) and map fragments (collect 4, the X appears).
- [ ] Dig spots in the builder palette grouped under "Dig sites" with clear names; spots on Main Island are placed by the user.
- [ ] Rest timers shown on the spot; optional daily dig goals.

## Stream C: Restoration (step 4 of the loop)
Owns: new `src/restore.js`, `src/restorestudio.js`. Claim: `open`
- [ ] Finds and paintings arrive **dirty or damaged**; a Restoration Studio (room, or a desk like the Curator's Office) where you clean them.
- [ ] Painting cleaning: rub grime off the **real HD image** with a before/after reveal. Fossil prep: brush stone off bone.
- [ ] Pottery reassembly (drag pieces) and bone assembly.
- [ ] Restored items go to storage, then onto display. Unrestored items can't be displayed.
- [ ] Provenance on the plaque: "Recovered from <place>" shows in the viewer (the `provenance` field already exists).
- [ ] Remove the placeholder "mess" assumptions: keep the existing cracks, stains and cobwebs as they are.

## Stream D: Display and exhibits
Owns: `src/showcase.js`, `src/viewer.js`, `src/collections/render.js`. Claim: `open`
- [ ] Display cases, plinths, specimen shelves, easels and tanks that **place collection entries in rooms** (entries already say how they display: wall, case, plinth).
- [ ] Dinosaur hall: assemble a skeleton from dug bones; the big T. rex as a goal.
- [ ] Aquarium for caught fish (fish tanks in a room, fish swim, tap for the card).
- [ ] Set completion: plaques and rewards on display ("Fossil drawer", "Crystal cabinet").
- [ ] Every displayed piece earns and counts toward room rating.

## Stream E: Expeditions and the world loop
Owns: new `src/expedition*.js`, `src/leads.js`. Claim: `open`
- [ ] **Leads:** a letter, a torn map, a rumor from a famous visitor sends you to an island.
- [ ] Boat flow to expedition islands (the boat menu already lists every island).
- [ ] First level kinds, as playable islands: pirate island (jungle maze, chest, captain's map), shipwreck dive, desert tomb, dinosaur badlands, frozen north.
- [ ] Puzzle pieces as builder tiles: push blocks, pressure plates and levers, ice sliding, fog that clears as you walk, riddles from NPCs.
- [ ] Come home with finds that need restoring (Stream C), then display (Stream D).
- [ ] The rule: **earned, not bought, no throwaway mini-games** (VISION #7).

## Stream F: More collections
Owns: `src/collections/data/`, `tools/import_collection.mjs`. Claim: `open`
- [ ] Coins, butterflies and insects, shells, stamps, ship models, glass flowers: each a data file (or a CSV import).
- [ ] Famous visitors as a collection (meet them, fill the set).
- [ ] Sets, rarity, and a shop buy / sell path through the codex.
- [ ] Journal polish: filters, search, "new" markers.

## Stream G: Builder
Owns: `src/builder/`, `builder.html`, `public/builder/`, `tools/build_palette.py`. Claim: `open`
- [ ] **More turn families.** `public/builder/rotations.json` links the sides of one object (only one chair is linked so far). Find the true sets in the free packs, verify each by eye, add them. Keep the file format so the user's new sprites drop in.
- [ ] A search box for pieces; recently used pieces at the top.
- [ ] **Grass blends** into paths, dirt, sand and stone (autotile edges); jagged rocks instead of round ones.
- [ ] Pathway and ground blocks the user can restyle later: make sure every ground type is a placeable block with a clear name.
- [ ] Builder tests (a Playwright file for place / turn / undo / save) so it stops regressing.
- [ ] Never lose work: keep the autosave and vault paths intact.

## Stream H: Rooms and the museum building
Owns: `src/rooms.js`, `src/shaped.js`, `src/walldraw.js`, `src/RoomScene.js` (shared, take care). Claim: `open`
- [ ] **Non-square rooms** (glass, curved, domed, sharp angles). **Needs a design pass with the user first.** Do not start before Needs Sean is answered.
- [ ] Corner and L-shaped rooms; truly seamless archways that show both rooms.
- [ ] A big outdoor garden room (the user designs it).
- [ ] Elevator in the lobby and the first new floor (each floor a self-contained pack).
- [ ] Museum exterior and facade styles (look to come from the user).
- [ ] Always re-run `tests/gaps.cjs`: no black gaps between walls, ever.

## Stream I: The living museum
Owns: `src/famous.js`, `src/lines.js`, `src/quests.js`. Claim: `open`
- [ ] Visitors with memories, goals and relationships; regulars that grow into characters.
- [ ] Famous visitors with quest chains and period-accurate dialogue; they send you to places (feeds Stream E).
- [ ] Seasons on the real calendar and a daily rhythm; limited-time collectibles.
- [ ] A Gardner-style heist mystery as the first full story arc (empty frames, find the stolen art).
- [ ] Semi-mythological famous visitors (the user said later).

## Stream J: Economy, staff, services
Owns: `src/staff*.js`, `src/office*.js`, `src/incomemenu.js`, `src/wallet.js`. Claim: `open`
- [ ] Break-room upgrade menu (faster janitors, guide bonus, carpenter speed): needs the user's input (Needs Sean).
- [ ] Gift shop (merch of your best paintings), food court, kids' discovery room, lecture hall.
- [ ] Goals pacing and daily goals (the 19 goals and rewards).
- [ ] Keep it **earned, not bought**: no gem or crate economy as the core.

## Stream K: Share and visit
Owns: new `src/share*.js`. Claim: `open`
- [ ] Export a museum as a link; a short tour video or image strip.
- [ ] Visit a friend's museum asynchronously, with no server.
- [ ] Friends' islands in the boat picker (the map format is already shareable).

## Stream L: Quality, performance, infrastructure
Owns: `tests/`, `.github/`, `vite.config.js`. Claim: `open`
- [ ] **Make the flaky tests stable** (playtest, smoke "cottage door" check). Find the real race; don't just retry.
- [ ] Phone performance: measure FPS on huge islands, many NPCs, lighting (today's numbers are for the busiest room only). Budget and fix.
- [ ] Add tests for dig, fossils, turn families, the content pipeline guard.
- [ ] A CI check that runs content, collections and gaps on every PR.
- [ ] Save safety: versioned saves, corrupt-save recovery for every new store (`curation.digs`, codex).
- [ ] Bundle size (the build warns about a large chunk): split by scene.

## Stream M: Art support (the user draws; we only make it easy)
Owns: `tools/`, `public/builder/`, `docs/ASSETS.md`. Claim: `open`
- [ ] A script that lists every placeholder sprite and tile by name, with size, so the user can redraw them one by one.
- [ ] A drop-in swap: put a PNG with the same name in a folder and the game uses it (no code change).
- [ ] Keep every ground tile, path block and furniture piece as its own named, placeable item.
- [ ] (On hold, not wanted now: `docs/ART-AUDIT.md`, `ART-BIBLE.md`, `ART-BRIEF.md`. Don't continue them.)

## Stream N: UI and menus
Owns: `src/*menu.js`, `src/ui.js`, `src/journal.js`, `src/style.css` (shared). Claim: `open`
- [ ] Menu redesign and collection screens (the user redesigns them; wait for direction).
- [ ] Settings, HUD and journal polish that doesn't change the look the user is about to set.

---

## Stream O: Every other feature from the design doc (the long tail)
Pulled from `docs/DESIGN.md`, `docs/BACKLOG.md` and `docs/VISION.md` so nothing is lost. Claim a **line**, not the whole stream, and put it under the stream it fits best when you start (e.g. a hall goes under H, a collection under F). Owner: `open`.

**Art halls (rooms, each with its own look and collection)**
- [ ] Painting galleries by era: Renaissance, Dutch, Impressionist, American, Japanese prints.
- [ ] Sculpture court (marble and plaster casts, big courtyard).
- [ ] **The Gardner Room:** salon walls floor to ceiling around a courtyard garden; the empty heist frames and the hunt for the stolen art (ties to Stream I).
- [ ] Modern wing (white cube), once copyright allows. Prints and early photography.

**Science halls**
- [ ] Dinosaur hall: a big T. rex skeleton centrepiece, fossil shelves you tap to see the real fossil in HD (ties to B and D).
- [ ] Space: planetarium dome, meteorites, moon rock, rocket.
- [ ] Electricity: a Van de Graaff generator and a timed lightning show.
- [ ] Human body, optics and illusions (mirror maze, camera obscura).

**Natural history**
- [ ] Glass flowers (a perfect collectible set). Taxidermy dioramas.
- [ ] Ocean hall with a whale skeleton overhead; aquarium wing with a giant tank (ties to D).

**History and archaeology**
- [ ] Egypt (mummies, sarcophagi, canopic jars), Greek and Roman (urns, mosaics, columns).
- [ ] Dig-site room (a sandbox you excavate; ties to B).
- [ ] Maritime: ship models, figureheads. Arms and armor. Clocks, inventions and robots.

**Architecture**
- [ ] Model hall: famous buildings in miniature, Gothic arches, the column orders side by side.
- [ ] Facade styles that change the museum's own outside (ties to H).

**Outside**
- [ ] **Front lawn** you walk out onto: steps, banners, a fountain, the museum sign. The base for seasons and exterior decorating.
- [ ] **Garden (huge):** swan-boat pond, Japanese garden, hedge maze, greenhouse, koi pond, sculpture garden.
- [ ] Rooftop terrace with a telescope at night. Petting zoo or farm (its own floor).

**Visitor services**
- [ ] Gift shop (merch of your best paintings), food court, kids' discovery room, lecture hall (events: a famous visitor gives a talk), library and archive where the stored collection lives. (Coffee shop is built.)

**Systems that make expansions easy**
- [ ] Elevator in the lobby: every floor a self-contained pack.
- [ ] **Room presets:** save a room's layout ("Winter", "Halloween") and load it again.
- [ ] Seasons on the real calendar: snow on the lawn, fall leaves, holiday decor, seasonal visitors (trick-or-treaters), limited-time collectibles.
- [ ] Specimen shelves for everything with the HD viewer; sets with plaques; rarity frames and cases.
- [ ] Ways to get things: expeditions, digs, donations, auctions, trades with famous visitors.

**Retention and events**
- [ ] Daily guests, Painting of the Day, daily quests.
- [ ] Events: "Impressionism Week", "Hokusai Festival" with exclusive decor.
- [ ] Offline earnings stop at 8 hours (built); first-game-of-the-day and streak bonuses; a daily wheel spin.

**Mini-games (ON HOLD: the user said "mini-games later", and VISION #7 forbids throwaway ones; do not start without the user)**
- [ ] MVP picks if the user says go: Mop Rush, No Flash!, Restoration (scrub grime off the HD painting; overlaps Stream C), Crate Tetris.
- [ ] Others: Hang it Straight, Tour Guide, Night Watch, Catch the Thief, Paparazzi; later social ones (Auction House, Co-op Cleanup).

**Money (ON HOLD: needs the user's decision; "earned, not bought" is the rule)**
- [ ] Gems as *time* (skip construction, "X days of income"), rewarded ads, cosmetics, a seasonal exhibition pass. No pay-to-win, no gem or crate economy as the core.
- [ ] Open questions: crate odds, buy-back price, gem pricing, Curator's Office level costs.

**Islands and world (from the notes)**
- [ ] The user's builder-made island becomes the default spawn island (Main Island is already home).
- [ ] More island buildings and props; island seasons and weather; more animals and people.
- [ ] A sequel or expansion where the museum is part of a city (someday).

## Needs Sean (questions parked here; chats keep working without them)
- **Review tonight:** the 27 painting drafts (rarity for each, hooks for 4), and which of the 22 flagged images to replace.
- API keys: Smithsonian (`SI_API_KEY`) and Rijksmuseum (`RIJKS_API_KEY`) for more sources.
- Non-square rooms: what shapes, how they join, how they look. (Blocks Stream H's first item.)
- West Wing outline.
- Break-room upgrades: what should they do?
- Are the goals at the right pace; daily goals?
- Dig spots on Main Island: place them in the builder where you want them.
- Mini-games and gems/ads: go or no-go? (Both are on hold in Stream O.)

## Suggested start for a fleet of chats
Highest value first, and they barely touch each other's files: **A** (host the images), **G** (turn families, grass blend), **C** (restoration), **D** (display cases and aquarium), **L** (stable tests, performance). Then **B**, **E**, **F**, **I**.
