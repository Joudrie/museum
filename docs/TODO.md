# Master to-do board (every chat reads this first)

Many chats work on Curation at the same time. This board is how they stay aware of each other.
It lists **every feature we have considered**, split into **15 chats** numbered by priority (1 is most important). Each chat has its own area and files.
Read `CLAUDE.md`, `docs/VISION.md` and `docs/HANDOFF.md` first, then this file.

**Ready-made prompts for all 15 chats are in `docs/CHAT-PROMPTS.md`. The short version of the prompt is:** *"Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT N. Claim it and work through it."*

## Rules for all chats
1. **Claim first.** Edit your chat's `Claim:` line to `claimed: <date>` and push that one line through a tiny PR (merge it yourself). Never work on another chat's items. If you need something from another chat, add a line under **Cross-chat requests** at the bottom and carry on.
2. **Stay in your lane.** Add new files freely. For **shared files** (`src/IslandScene.js`, `src/RoomScene.js`, `src/tiles.js`, `src/style.css`, `index.html`, `src/collections/index.js`, `src/main.js`, `docs/HANDOFF.md`, `tests/*.cjs`) make **small, additive edits** and `git pull origin main` right before you push, so merges stay trivial.
3. **Small PRs, merged often** (CLAUDE.md: merge each yourself, then reset your branch to `main`). Work unmerged for more than a few hours will conflict with the others.
4. **When you finish a task:** tick it `[x]` with the PR number, add 2 to 4 lines to `docs/HANDOFF.md` under your feature, and end with the game and builder links.
5. **Tests:** run `node tests/content.cjs`, `smoke`, `gaps`, `collections`, and `playtest` if you touch rooms or islands. The playtest and the smoke "cottage door" check are **flaky on a plain `main`** (they fail the same way without your change). Re-run before blaming your work. Test in a 390x844 portrait browser.
6. **No questions to the user.** Use sensible defaults, write the question under **Needs Sean**, and keep going.
7. **Design rules:** portrait only, no black gaps between walls, 32px grid and HD paintings in the museum, press-and-drag movement, **earned not bought**, **no throwaway mini-games** (VISION).
8. **Art is placeholder.** The user is redrawing all sprites by hand later. Do not restyle, plan or hire art. Make features work with the current pictures, keep art swappable (data, not code), and draw new placeholders in the same code-drawn / pixel-row style already used.
9. **Hold items** (marked ON HOLD) wait for the user. Do not build them.
10. Never touch anything not in your chat's lane, and never add a feature the user parked.

## Done so far
Collection format and registry (#77) · content pipeline built (#78), run live (#79) · 27 painting drafts, none approved (#90) ·
builder ⟳ turn for multi-side pieces, one family linked (#82) · dig spots with brushing (#87) · fossils and fossil dig spots (#94) · this board (#97, #98).

---

## CHAT 1: Content and images (the pipeline)
Owns: `tools/`, `content/`, `docs/CONTENT*.md`, `public/paintings/`, `src/collections/data/paintings.js`. Claim: `claimed: 2026-10-29`
- [x] (#113; 46 of 49, the other 3 are broken links) **Host our own copies of the 49 paintings.** They hot-link Wikimedia (429 / 404). Download the *same* image, resize to 1280px long side, JPEG under about 500 KB, save to `public/paintings/<slug>.jpg`, point the data at it (same ids, saves keep working). Don't swap any image for a different work.
- [x] (#119) 3 broken links (horse-fair, temeraire, crossing-delaware) and 8 wrong shapes (school-athens, emmaus, water-lilies, cafe-terrace, creation-adam, anatomy-lesson, pearl-earring, wheatfield-crows): write proposals to `content/image-proposals.md` with source, size, shape. Don't apply them; the user approves.
- [ ] Hooks for the 4 Met drafts (Night-Shining White, Esther, Gulf Stream, Drawing Lesson): a quotable museum or Commons sentence, as a claim with the exact quote.
- [ ] Third, fourth and fifth batches (about 20 each): women artists, 18th to 20th century, Africa, Pacific, Middle East, Latin America, Indigenous work, more non-European. Pin by id. Mechanical fixes only; rarity and wording are the user's.
- [ ] Natural-history and archaeology imagery (public domain) for the other collections, with a quoted source for every fact.
- [ ] Smithsonian and Rijksmuseum adapters once keys exist (Needs Sean). Art Institute of Chicago is behind a bot challenge: never work around it.
- [ ] After the user approves drafts: `node tools/publish_content.mjs --collection painting`, tests, PR.
- [ ] Rarity for paintings by fame (every painting is rarity 1 today): a data pass, proposed for approval.
- [ ] Painting of the Day content: a rotating pick and a short true "why it matters" for each.

## CHAT 2: Builder and ground tools
Owns: `src/builder/`, `builder.html`, `public/builder/`, `tools/build_palette.py`, `src/mapformat.js`. Claim: `claimed: 2026-10-29`
- [ ] **Turn families (started, #117: 4 armchair colours verified; more sets to check with `tools/rotation_sheet.py`):** `public/builder/rotations.json` links the sides of one object (one chair so far). Find the true sets in the free packs (verify each by eye, never auto-group), add them. Keep the file format so the user's new sprites drop in.
- [x] Search box for pieces; recently used at the top; favourites. (#117)
- [ ] **Grass that blends** into paths, dirt, sand and stone (autotile edges); jagged rocks instead of round ones.
- [ ] Every ground type, path block and furniture piece is its own named, placeable item (so the user can redraw them one by one).
- [x] Builder palette organisation (duplicate lists merged, "What's new" row from `public/builder/whatsnew.json`; a Dig sites list waits for Chat 6's tiles) (#120).
- [x] Copy / paste regions, multi-select move (cut + paste), layers view (menu → Options: Ground / Pieces), grid toggle, measure (the Area tool shows W×H). Mirror the copied area is in; rotating a whole area is not (sprites don't turn without a family) (#121).
- [x] Map import / export (already in ☰: Save map file, Copy map code, Open file…; #119) (share a map as a file or link; the format is already shareable).
- [x] Builder Playwright tests (place, turn, undo, save, vault restore): `tests/builder.cjs` (#119).
- [x] Never lose work: autosave and vault paths intact; reload and wiped-storage restore are tested in `tests/builder.cjs` (#119). (Keep it passing on every builder change.)

## CHAT 3: Quality, performance and polish
Owns: `tests/`, `.github/`, `vite.config.js`, `src/settings*.js`, `src/ui.js`. Claim: `claimed: 2026-10-29`
- [ ] **Stabilise the flaky tests** (playtest, smoke "cottage door"). Find the real race; don't just retry.
- [ ] Phone performance: measure FPS on huge islands, many NPCs and lighting (today's numbers are the busiest room only). Set budgets and fix.
- [ ] Tests for dig, fossils, turn families and the content pipeline; CI that runs content, collections and gaps on every PR.
- [ ] Save safety: versioned saves and corrupt-save recovery for every store (`curation.digs`, codex, builder).
- [ ] Bundle size (the build warns about a large chunk): split by scene, lazy-load.
- [ ] Accessibility and settings polish that doesn't change the look the user is about to set. Menu and collection-screen **redesign waits for the user's direction.**
- [ ] A bug sweep with a repeatable full-flow test after each big merge.

## CHAT 4: Restoration and provenance (loop step 4)
Owns: new `src/restore.js`, `src/restorestudio.js`, `src/storage_room.js`. Claim: `claimed: 2026-10-29`
- [ ] Finds and paintings arrive **dirty or damaged**; a Restoration Studio (a room or a desk like the Curator's Office) where you clean them.
- [ ] Painting cleaning: rub grime off the **real HD image** with a before / after reveal (the real paintings stay perfect everywhere else).
- [ ] Fossil prep (brush stone off bone), pottery reassembly (drag pieces), bone assembly.
- [ ] Restored items go to storage, then onto display. Unrestored items can't be displayed.
- [ ] Provenance on the plaque: "Recovered from <place>" in the viewer (the `provenance` field exists).
- [ ] Inventory vs codex: storage list of what you own now vs everything you've ever collected.
- [ ] Hand-offs: Chat 6 and 7 deliver dirty finds; Chat 5 displays restored ones.

## CHAT 5: Display, exhibits and the aquarium
Owns: `src/showcase.js`, `src/viewer.js`, `src/collections/render.js`, new `src/display*.js`. Claim: `claimed: 2026-10-29`
- [x] Display cases, plinths, specimen shelves, easels and tanks that **place collection entries in rooms** (entries already say how they display: wall, case, plinth). (PR below)
- [x] **Aquarium** for caught fish: tanks in a room, fish swim, tap for the card; a giant tank wing. (tanks + giant tank done; PR below)
- [ ] Dinosaur skeleton assembled from dug bones; the big T. rex as a goal.
- [ ] Specimen shelves for everything with the HD viewer; rarity frames and special cases for rare items.
- [ ] Set completion plaques and rewards on display ("Fossil drawer", "Crystal cabinet").
- [x] Every displayed piece earns and counts toward room rating. (PR below)
- [ ] Viewer polish: swipe along a wall of cases, notes, your rating and journal note.
- [ ] Rope barriers, stanchions and signage as placeable decor.

## CHAT 6: Digging v2 and puzzle mechanics
Owns: `src/dig.js`, `src/puzzles*.js`, `src/collections/data/{minerals,fossils}.js`. Claim: `claimed: 2026-10-29`
- [x] More finds as data collections: pottery shards, coins, arrowheads, shells, meteorites (amber was already a fossil) (PR 106). Dig kinds: mineral, fossil, ruin, shore, crater.
- [ ] Dig tools (brush, trowel, pick) that change speed and what turns up; a bone that needs several spots to complete.
- [ ] Bigger dig sites: a cliff face or trench worked across several tiles; a dig-site room sandbox.
- [ ] Metal-detector hunt (warmer / colder); map fragments (collect 4 and the X appears).
- [ ] Puzzle pieces as builder tiles and runtime: push blocks, boulders to smash, pressure plates and levers, iron gates, ice sliding, fog that clears as you walk, riddles from NPCs, mazes.
- [ ] Dig spots in the builder palette under "Dig sites" (done, PR 106); spots show their rest time; daily dig goals.
- [ ] Finds arrive dirty where Chat 4 expects them (`dirty: true` on a stack).

## CHAT 7: Expeditions, leads and expedition islands
Owns: new `src/expedition*.js`, `src/leads.js`, `src/maps/` (new islands). Claim: `claimed: 2026-10-29`
- [ ] **Leads:** a letter, a torn map, a pirate's note, a rumour from a famous visitor sends you to an island.
- [ ] Boat flow to expedition islands (the boat menu lists every island); a short boat scene.
- [ ] Levels as playable island maps: pirate island (jungle maze, traps, captain's map, chest), shipwreck dive (water-damaged crates), desert tomb (sliding stones), dinosaur badlands (fossil cliff), lost temple (plates, hidden rooms), heist hideout (stealth), frozen north (ice cave, mammoth).
- [ ] Each level can be slow puzzle, chase with light parkour, a dig, or a mix; failing is gentle (caught by pirates, tide comes in: retry).
- [ ] Come home with finds that need restoring (Chat 4), then display (Chat 5); the plaque says where.
- [ ] More island buildings and props, island seasons and weather, animals and people to meet.
- [ ] The user's builder-made island as the default spawn (Main Island is already home).
- [ ] Rule: **earned, not bought, no throwaway mini-games.**

## CHAT 8: Collections, codex, journal and the shop
Owns: `src/collections/` (except render.js), `src/journal.js`, `tools/import_collection.mjs`. Claim: `claimed: 2026-10-29`
- [ ] New collections as data (or CSV): coins, butterflies and insects, shells, stamps, ship models, glass flowers, pottery, armour, clocks, inventions.
- [ ] Famous visitors as a collection (the codex already stamps `visitor:<id>`; their tab is hand-built).
- [ ] Codex milestones at 10 / 25 / 50 / 75 / 100% with rewards; sets and artist sets (0/12 van Gogh); inventory vs codex.
- [ ] Selling and buying through the codex: sell for 50%, **buy-back after a 1-week cooldown at a premium**, a **Gallery Shop** with 3 to 5 rotating paintings refreshed daily. (Crates: ON HOLD.)
- [ ] `value` as income (recorded now, income still uses old rules); "your museum earns while you're away (up to 8 hours)" message.
- [ ] Journal polish: filters, search, "new" markers, rate and note per item.
- [ ] One of a kind: you own *the* Starry Night; sold ones go back in the pool.

## CHAT 9: Rooms and the museum building
Owns: `src/rooms.js`, `src/shaped.js`, `src/walldraw.js`, `src/atrium.js`, `src/RoomScene.js` (shared, take care). Claim: `claimed: 2026-10-29`
- [ ] **Non-square rooms** (glass walls, curved, domed, sharp angles, open plan, small quiet rooms). **Blocked: needs a design pass with the user. Do the other items first.**
- [ ] Corner and L-shaped rooms (done, PR pending: `lhall`, `corner`); truly seamless archways that show both rooms at once.
- [ ] Elevator in the lobby and the first new floor (each floor a self-contained pack).
- [ ] Front lawn you walk out onto (steps, banners, fountain, sign); museum exterior and facade styles that change the building (look comes from the user).
- [ ] Rooftop terrace with a telescope at night.
- [ ] Room presets: save a room's layout ("Winter", "Halloween") and load it again.
- [ ] Construction takes real time (small quick, big about a day, 2 builders); everything else instant.
- [ ] Themed room bonus (1.5x income for a one-section room); unlimited rooms and a performance test at 100+ rooms.
- [ ] Re-shuffle and repurpose rooms; the West Wing (waits for the user's outline).
- [ ] Always re-run `tests/gaps.cjs`: no black gaps between walls, ever.

## CHAT 10: Living museum, people and story
Owns: `src/famous.js`, `src/lines.js`, `src/quests.js`, `src/talk.js`, `src/staff.js`. Claim: `claimed: 2026-10-29`
- [ ] Visitors with memories, goals and relationships; regulars that grow into characters; personalities (nerd, casual, superfan, snob, kid, grump, tourist) with more lines.
- [ ] Famous visitors with quest chains and period-accurate dialogue; they send you places (feeds Chat 7). Odds rise with their works in your codex; permanent boosts.
- [ ] A **Gardner-style heist mystery** as the first full story arc.
- [ ] Semi-mythological famous visitors (the user said later).
- [ ] The caretaker (name and look), the tutorial and first session; day 2 and day 3 beats; daily guests.
- [ ] Daily and weekly quests, goal pacing (the 19 goals and rewards; daily goals?).
- [ ] Events: "Impressionism Week", "Hokusai Festival" with exclusive decor; limited-time collectibles.
- [ ] Pets and animals in the museum.

## CHAT 11: Atmosphere, seasons and audio
Owns: `src/weather.js`, `src/lighting.js`, `src/ambient.js`, `src/music.js`, `src/foliage.js`, `src/critters.js`. Claim: `claimed: 2026-10-29`
- [ ] Seasons on the real calendar (snow on the lawn, fall leaves, holiday decor, seasonal visitors like trick-or-treaters). Snow, fall leaves and recoloured trees already exist; **cherry trees stay pink in autumn (done, this PR)**. Still to do: holiday decor, seasonal visitors.
- [ ] Daily rhythm (Animal Crossing / Stardew feel); weather effects inside and outside; day / night polish.
- [ ] Per-room music and ambience; sound effects pass; a mute and volume mix.
- [ ] Lighting performance on phones (High / Low / Off already exist).
- [ ] Critters, birds, fish and bugs that live on the islands and in the garden.
- [ ] Waterfalls, fountains, swans, fireflies and other life.

## CHAT 12: Economy, staff and services
Owns: `src/staffmenu.js`, `src/officemenu.js`, `src/office.js`, `src/incomemenu.js`, `src/wallet.js`, `src/rating.js`. Claim: `claimed: 2026-10-29`
- [x] Break-room upgrade menu (slower mess, guide training, carpenter toolbox); Curator's Office level costs and unlocks now in `src/economy.js` (#126).
- [ ] Gift shop (merch of your best paintings), food court, kids' discovery room, lecture hall (a famous visitor gives a talk), library and archive where the stored collection lives, coffee shop depth.
- [x] Income formula numbers in `src/economy.js`; 8-hour cap messaging (welcome-back toast, FULL flag, income-menu note); "Collect all" is now free of ads and keeps a 15% fee (#128).
- [x] Security: four tiers (none, dummy cameras, cameras, alarm) in `src/economy.js`; stopped thieves at camera tiers are caught for a gold bounty (#129).
- [ ] Late-game sink: frame your own artwork (very expensive).
- [ ] ON HOLD (needs the user): gems as time (skip construction, "X days of income"), rewarded ads, cosmetics, a seasonal exhibition pass, crates with odds and pity. Rule: **no pay-to-win; never a gem or crate economy as the core.**

## CHAT 13: Share, visit and retention
Owns: new `src/share*.js`, `src/daily.js`. Claim: `claimed: 2026-10-29`
- [ ] Export a museum as a link; a short tour image strip or clip; "rate my museum" screenshot card.
- [ ] Visit a friend's museum asynchronously (no multiplayer server); friends' islands in the boat picker (the map format is shareable).
- [ ] Daily wheel spin, first-game-of-the-day and streak bonuses, daily guests, Painting of the Day surfaced in the UI.
- [ ] Auction house and co-op cleanup (later, social; ON HOLD).

## CHAT 14: Halls (the content that fills the rooms)
Owns: new `src/halls/`, room-preset JSON in `content/halls/`. Claim: `claimed: 2026-10-29`. Depends on Chats 5, 8 and 9 landing; start with presets and decor lists.
- [ ] **Art:** galleries by era (Renaissance, Dutch, Impressionist, American, Japanese prints); sculpture court; **the Gardner Room** (salon walls around a courtyard garden; the empty heist frames); modern wing (white cube, when copyright allows); prints and early photography.
- [ ] **Science:** dinosaur hall (T. rex centrepiece, fossil shelves in HD); space (planetarium dome, meteorites, moon rock, rocket); electricity (Van de Graaff and a timed lightning show); human body, optics, illusions (mirror maze, camera obscura).
- [ ] **Natural history:** glass flowers, minerals and gems, taxidermy dioramas, ocean hall with a whale skeleton, aquarium wing.
- [ ] **History and archaeology:** Egypt (mummies, sarcophagi, canopic jars), Greek and Roman (urns, mosaics, columns), maritime (ship models, figureheads), arms and armor, clocks and inventions.
- [ ] **Architecture:** model hall (famous buildings in miniature, Gothic arches, column orders).
- [ ] **Themed wings:** Japanese (cherry blossoms, ukiyo-e), Chinese (ink scrolls), and other non-European wings.
- [ ] **Outside:** huge garden (swan-boat pond, Japanese garden, hedge maze, greenhouse, koi pond, sculpture garden), petting zoo or farm floor.
- [ ] Each hall = a themed room preset + decor + which collections and sets belong there.

## CHAT 15: Asset hunt and art swap support
Owns: `assets/vendor/`, `docs/ASSETS.md`, `tools/extract_sprites.py`, `tools/` sprite scripts. Claim: `claimed: 2026-10-29`
- [ ] Run the **super dig** in `docs/ASSET-HUNT.md` (find, don't make; CC0 / CC-BY / CC-BY-SA / OGA-BY / GPL only; no non-commercial). Check network access first and don't get around bot checks; list itch.io links for the user to download by hand. Save results to `docs/ASSETS.md` (round 3), ranked top 20.
- [ ] Categories: statues and sculpture (busts, plinths, display cases, rope barriers); jagged rocks and nature; museum architecture pieces (glass, curved, arches, domes, skylights, spiral stairs, facades); exhibits (dinosaur skeletons, mummies, armour, pottery, meteorites, ship models, taxidermy, aquarium tanks); furniture with four facings; island buildings, fences, docks, boats, market stalls, playground, festival decor; characters and animals; dig-site props (tents, crates, tools).
- [ ] A script that lists every placeholder sprite and tile by name, size and where it's used, so the user can redraw one at a time.
- [ ] **Drop-in swap:** a PNG with the same name in a folder overrides the placeholder, no code change.
- [ ] Keep `tools/build_palette.py` outputs stable (piece ids never shift).
- [ ] (Not wanted now: `docs/ART-AUDIT.md`, `ART-BIBLE.md`, `ART-BRIEF.md`. Don't continue them.)

## Hold list (parked by the user; no chat builds these)
Mini-games (Mop Rush, No Flash!, Restoration-as-minigame, Crate Tetris, Hang it Straight, Tour Guide, Night Watch, Catch the Thief, Paparazzi) · gems, ads, cosmetics, exhibition pass, crates · multiplayer / auctions · a sequel where the museum is part of a city · menu redesign · art direction and hiring.

## Needs Sean (parked questions; chats keep working)
- **Review tonight:** the 27 painting drafts (rarity for each, hooks for 4) and which flagged images to replace.
- Smithsonian (`SI_API_KEY`) and Rijksmuseum (`RIJKS_API_KEY`) keys.
- Non-square rooms: what shapes, how they join, how they look (blocks Chat 9's first item).
- West Wing outline; break-room upgrade ideas (defaults in `src/economy.js`: Better mops 90→120/160/220 min for 250/700/1800 gold, Guide training +10%→12/15/20% for 400/1100/2800, Carpenter's toolbox 10/20/30% off rooms for 350/900/2200; office levels 500/2000/8000/30000; collect-all fee 15%; security 150/400/1500, bounty 120); goal pacing and daily goals.
- Dig spots on Main Island: place them in the builder where you want them.
- Mini-games and gems / ads: go or no-go?
- Open design questions: free-roam map or chain of rooms; should paintings come only from expeditions; can you fail an expedition; seasons automatic or chosen; split the shared core now?

## Cross-chat requests (add a line, carry on)
- (none yet)

## Order
The chat numbers **are the priority order**: 1 is most important, 15 least. If you can't run all 15, run them in number order. Chat 14 (halls) needs 5, 8 and 9 first; chat 15 (asset hunt) is placeholder support and can wait.
