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
Interaction polish by the main chat: facing-aware Interact, bubbles that follow and close, island conversations, emotes and people chatting, snow footprints, a hop-in boat, little scenes on the home island (see HANDOFF, "Interaction polish, emotes, boats and little scenes").

---

## CHAT 1: Content and images (the pipeline)
Owns: `tools/`, `content/`, `docs/CONTENT*.md`, `public/paintings/`, `src/collections/data/paintings.js`. Claim: `claimed: 2026-10-29`
- [x] (#113; 46 of 49, the other 3 are broken links) **Host our own copies of the 49 paintings.** They hot-link Wikimedia (429 / 404). Download the *same* image, resize to 1280px long side, JPEG under about 500 KB, save to `public/paintings/<slug>.jpg`, point the data at it (same ids, saves keep working). Don't swap any image for a different work.
- [x] (#118) 3 broken links (horse-fair, temeraire, crossing-delaware) and 8 wrong shapes (school-athens, emmaus, water-lilies, cafe-terrace, creation-adam, anatomy-lesson, pearl-earring, wheatfield-crows): write proposals to `content/image-proposals.md` with source, size, shape. Don't apply them; the user approves.
- [ ] Hooks for the 4 Met drafts (Night-Shining White, Esther, Gulf Stream, Drawing Lesson): a quotable museum or Commons sentence, as a claim with the exact quote. **Tried, no sentence found:** the Met API has no description, metmuseum.org is behind a bot challenge (left alone), and the Commons file pages only say the title. Needs Sean (paste one sentence from each Met page).
- [x] (#130; 14 + 20 + 21 drafts) Third, fourth and fifth batches (about 20 each): women artists, 18th to 20th century, Africa, Pacific, Middle East, Latin America, Indigenous work, more non-European. Pin by id. Mechanical fixes only; rarity and wording are the user's.
- [~] (#142) Natural-history and archaeology imagery (public domain) for the other collections, with a quoted source for every fact. **Archaeology done as drafts** (`content/batches/archaeology-batch.json`, 25 Cleveland objects, quoted descriptions, all draft). **Natural history waits:** no open source here has quotable text for specimens (Commons file pages have none; the Smithsonian needs its key).
- [ ] (waiting on keys, see Needs Sean; nothing to run without them) Smithsonian and Rijksmuseum adapters once keys exist (Needs Sean). Art Institute of Chicago is behind a bot challenge: never work around it.
- [ ] (waiting: no draft is approved) After the user approves drafts: `node tools/publish_content.mjs --collection painting`, tests, PR.
- [x] (#137) Rarity for paintings by fame (every painting is rarity 1 today): a data pass, proposed for approval. **Proposal only:** `content/rarity-proposals.json`; the user sets `status` to `approved`, then `node tools/apply_rarity.mjs`.
- [x] (#137) Painting of the Day content: a rotating pick and a short true "why it matters" for each. `tools/potd.mjs`, `content/potd/draft.json` (69 quoted lines, all draft; the 49 shipped paintings have no museum sentence on file yet, so they wait). Chat 13 surfaces it.

## CHAT 2: Builder and ground tools
Owns: `src/builder/`, `builder.html`, `public/builder/`, `tools/build_palette.py`, `src/mapformat.js`. Claim: `claimed: 2026-10-29`
- [ ] **Turn families (checked seating, decor, tables, shelves: the armchairs are the only complete 4-side sets; sofas and chairs have no back or no matching front, the rest are composites or colour variants. Revisit when the user's new sprites land) (started, #117: 4 armchair colours verified; more sets to check with `tools/rotation_sheet.py`):** `public/builder/rotations.json` links the sides of one object (one chair so far). Find the true sets in the free packs (verify each by eye, never auto-group), add them. Keep the file format so the user's new sprites drop in.
- [x] Search box for pieces; recently used at the top; favourites. (#150)
- [ ] **Grass that blends** into painted dirt and rock is in (`src/groundblend.js`, used by builder and game; #132). Jagged rocks added as new pieces (Jagged rock, 2×2, Rock spire; the round ones stay because maps use them) (#166). Still open: other ground types have no edge tiles yet.
- [ ] Every ground type, path block and furniture piece is its own named, placeable item (so the user can redraw them one by one).
- [x] Builder palette organisation (duplicate lists merged, "What's new" row from `public/builder/whatsnew.json`; a Dig sites list waits for Chat 6's tiles) (#120).
- [x] Copy / paste regions, multi-select move (cut + paste), layers view (menu → Options: Ground / Pieces), grid toggle, measure (the Area tool shows W×H). Mirror the copied area is in; rotating a whole area is not (sprites don't turn without a family) (#121).
- [x] Map import / export (already in ☰: Save map file, Copy map code, Open file…; #119) (share a map as a file or link; the format is already shareable).
- [x] Builder Playwright tests (place, turn, undo, save, vault restore): `tests/builder.cjs` (#119).
- [x] Never lose work: autosave and vault paths intact; reload and wiped-storage restore are tested in `tests/builder.cjs` (#119). (Keep it passing on every builder change.)

## CHAT 3: Quality, performance and polish
Owns: `tests/`, `.github/`, `vite.config.js`, `src/settings*.js`, `src/ui.js`. Claim: `claimed: 2026-10-29`
- [x] **Stabilise the flaky tests** (playtest, smoke "cottage door"). Real causes: walking took one big step per slow frame and jumped over the strip in front of the door (now sub-steps of 3 px), and the ambient life probed `isPond` past the island edge and crashed (now bounds-checked). (#170)
- [x] Phone performance: measure on huge islands, many NPCs and lighting; budgets in HANDOFF; `tests/perf.cjs`; off-screen culling and idle islanders far away (#173)
- [x] Tests for dig, fossils, turn families and the content pipeline (`dig.cjs`, `builder.cjs`, `content.cjs`); CI runs every test on every PR (`.github/workflows/tests.yml`, `npm test`) (#174)
- [x] Save safety: `tests/saves.cjs` breaks every save key 7 ways and the game still opens (it already did); an unreadable save is kept under `curation.bak.<key>`; Reset museum takes two taps and keeps the old save (`curation.bak.reset`) (#175)
- [x] Bundle size: Phaser is already its own cached chunk (332 KB gzip) and the builder and Wakefield are separate pages; the warning is silenced and `tests/bundle.cjs` holds gzip budgets (phaser 360, main 230, total 760 KB). Splitting scenes is not worth the risk across 14 chats' shared files (#175)
- [x] Accessibility and settings polish (no look change): reduced-motion media query for the menus, two-tap Reset. Menu and collection-screen **redesign waits for the user's direction.** (#175)
- [x] Repeatable full-flow test after each big merge: `ALL=1 npm test` (adds the playtest and perf); the default set runs in CI on every PR (#176)

## CHAT 4: Restoration and provenance (loop step 4)
Owns: new `src/restore.js`, `src/restorestudio.js`, `src/storage_room.js`. Claim: `claimed: 2026-10-29`
- [x] (PR #123) Finds and paintings arrive **dirty or damaged**; a Restoration Studio (a room or a desk like the Curator's Office) where you clean them.
- [x] (PR #123) Painting cleaning: rub grime off the **real HD image** with a before / after reveal (the real paintings stay perfect everywhere else).
- [x] (PR #123) Fossil prep (brush stone off bone), pottery reassembly (drag pieces), bone assembly.
- [x] (PR #123) Restored items go to storage, then onto display. Unrestored items can't be displayed.
- [x] (PR #123) Provenance on the plaque: "Recovered from <place>" in the viewer (the `provenance` field exists).
- [x] (PR #123) Inventory vs codex: storage list of what you own now vs everything you've ever collected.
- [x] (PR #123) Hand-offs: Chat 6 and 7 deliver dirty finds; Chat 5 displays restored ones.

## CHAT 5: Display, exhibits and the aquarium
Owns: `src/showcase.js`, `src/viewer.js`, `src/collections/render.js`, new `src/display*.js`. Claim: `claimed: 2026-10-29`
- [x] Display cases, plinths, specimen shelves, easels and tanks that **place collection entries in rooms** (entries already say how they display: wall, case, plinth). (#127)
- [x] **Aquarium** for caught fish: tanks in a room, fish swim, tap for the card; a giant tank wing. (tanks, giant tank, swimming fish: #127; tapping a fish or piece opens its card)
- [x] Dinosaur skeleton assembled from dug bones; the big T. rex as a goal. (the T-rex skeleton item needs 6 dinosaur bones and a T. rex tooth in the codex; the toolkit shows what is missing)
- [x] Specimen shelves for everything with the HD viewer; rarity frames and special cases for rare items. (shelf + case + plinth; rare pieces glow blue, legendary breathe gold)
- [x] Set completion plaques and rewards on display ("Fossil drawer", "Crystal cabinet"). (a set fully on display earns double; shown in the display panel)
- [x] Every displayed piece earns and counts toward room rating. (#127)
- [x] Viewer polish: swipe along a wall of cases, notes, your rating and journal note. (tap any displayed piece in a room, or in the panel, to open its card; swipe to the next; rating and note save to the journal)
- [x] Rope barriers, stanchions and signage as placeable decor. (Display tab: rope, stanchion, exhibit sign)

## CHAT 6: Digging v2 and puzzle mechanics
Owns: `src/dig.js`, `src/puzzles*.js`, `src/collections/data/{minerals,fossils}.js`. Claim: `claimed: 2026-10-29`
- [x] More finds as data collections: pottery shards, coins, arrowheads, shells, meteorites (amber was already a fossil) (PR 122). Dig kinds: mineral, fossil, ruin, shore, crater.
- [x] Dig tools (brush, trowel, pick) that change speed and what turns up; a bone that needs several spots to complete (PR 145).
- [x] Bigger dig sites: a cliff face or trench worked across several tiles (touching spots of one kind form a site; dig them all in one rest period for a bonus rare find) (PR 145). A dig-site sandbox map is still to do (see Needs Sean).
- [x] Metal-detector hunt (warmer / colder); map fragments (collect 4 and the X appears) (PR 169).
- [x] Puzzle pieces as builder tiles and runtime: push blocks, boulders to smash, pressure plates and levers, iron gates, ice sliding, fog that clears as you walk, riddles from NPCs, mazes (hedges; build them in the builder) (PR 157). `src/puzzles.js`; the test bed is `content/maps/puzzle-yard.json`.
- [x] Dig spots in the builder palette under "Dig sites" (PR 122); spots show their rest time and there is a daily dig goal (PR 169).
- [x] Finds arrive dirty where Chat 4 expects them (`dirty: true` on the entry; pottery, coins, stone tools, meteorites, skeletons) (PR 122).

## CHAT 7: Expeditions, leads and expedition islands
Owns: new `src/expedition*.js`, `src/leads.js`, `src/maps/` (new islands). Claim: `claimed: 2026-10-29`
- [x] **Leads:** a letter, a torn map, a pirate's note, a rumour from a famous visitor sends you to an island. (#152: `src/leads.js`, Letters at the boat)
- [x] Boat flow to expedition islands (the boat menu lists every island); a short boat scene. (#152)
- [x] Levels as playable island maps (#152: all seven, `src/maps/exp-*.json`, drawn by `tools/gen_expeditions.mjs`): pirate island (jungle maze, traps, captain's map, chest), shipwreck dive (water-damaged crates), desert tomb (sliding stones), dinosaur badlands (fossil cliff), lost temple (plates, hidden rooms), heist hideout (stealth), frozen north (ice cave, mammoth).
- [x] Each level can be slow puzzle, chase with light parkour, a dig, or a mix; failing is gentle (caught by pirates, tide comes in: retry). (#152; the "parkour" is dodging patrols through long grass, there is no jump yet)
- [x] Come home with finds that need restoring (Chat 4), then display (Chat 5); the plaque says where. (#152: `collect(id, {dirty:true})` and `foundAt()`, see HANDOFF)
- [x] More island buildings and props, island seasons and weather, animals and people to meet. (Expedition props in the builder's "Expedition" group: tent, pirate flag, shipwreck hull, sarcophagus, mammoth skeleton, ice block. Each expedition has its own `climate` {season, weather}. Parrots, crabs, cats, a dog and castaways to meet. Still open: buildings beyond tents and ruins, e.g. a lighthouse or a village.)
- [x] The user's builder-made island as the default spawn (Main Island is already home; nothing to do).
- [ ] Rule: **earned, not bought, no throwaway mini-games.**

## CHAT 8: Collections, codex, journal and the shop
Owns: `src/collections/` (except render.js), `src/journal.js`, `tools/import_collection.mjs`. Claim: `claimed: 2026-10-29`
- [x] New collections as data (or CSV): coins, butterflies and insects, shells, stamps, ship models, glass flowers, pottery, armour, clocks, inventions. (#129; the digging chat's own coins, pottery and shells won where we overlapped. Tabs: Treasures, Makers, Insects.)
- [x] Famous visitors as a collection (the codex already stamps `visitor:<id>`; their tab is hand-built). (#155) Now `data/visitors.js`, two sets, drawn by the `visitor` renderer in `journal.js`.
- [x] Codex milestones at 10 / 25 / 50 / 75 / 100% with rewards; sets and artist sets (0/12 van Gogh); inventory vs codex. (#155: Codex tab, `milestones.js`, `artistsets.js`; held-now vs ever-collected also shows in Storage.)
- [x] Selling and buying through the codex: sell for 50%, **buy-back after a 1-week cooldown at a premium**, a **Gallery Shop** with 3 to 5 rotating paintings refreshed daily. (Crates: ON HOLD.) (#155: `shop.js`, Shop tab. Paintings join the shelf and the sell list once their collection is switched to `ownership: 'earned'`: see Needs Sean.)
- [x] `value` as income (recorded now, income still uses old rules); "your museum earns while you're away (up to 8 hours)" message. (Display pieces earn their `value` through `display.js` (#127) and the 8-hour cap message shipped with Chat 12 (#128). Paintings still earn by the old rule.)
- [x] Journal polish: filters, search, "new" markers, rate and note per item. (#155; the viewer already had stars and notes, the journal now shows them.)
- [x] One of a kind: you own *the* Starry Night; sold ones go back in the pool. ((#155) The Gallery Shop only offers pieces you don't hold, and a sold piece is back in the pool.)

## CHAT 9: Rooms and the museum building
Owns: `src/rooms.js`, `src/shaped.js`, `src/walldraw.js`, `src/atrium.js`, `src/RoomScene.js` (shared, take care). Claim: `claimed: 2026-10-29`
- [ ] **Non-square rooms** (glass walls, curved, domed, sharp angles, open plan, small quiet rooms). **Blocked: needs a design pass with the user. Do the other items first.**
- [ ] Corner and L-shaped rooms (L-shaped `lhall` and `corner` done, #124); truly seamless archways that show both rooms at once.
- [ ] Elevator in the lobby and the first new floor (each floor a self-contained pack).
- [ ] Front lawn you walk out onto (steps, banners, fountain, sign); museum exterior and facade styles that change the building (look comes from the user).
- [ ] Rooftop terrace with a telescope at night.
- [x] Room presets (#133): save a room's layout ("Winter", "Halloween") and load it again.
- [ ] Construction takes real time (small quick, big about a day, 2 builders); everything else instant.
- [ ] Themed room bonus: done (#146); unlimited rooms and a performance test at 100+ rooms: open.
- [ ] Re-shuffle and repurpose rooms; the West Wing (waits for the user's outline).
- [ ] Always re-run `tests/gaps.cjs`: no black gaps between walls, ever.

## CHAT 10: Living museum, people and story
Owns: `src/famous.js`, `src/lines.js`, `src/quests.js`, `src/talk.js`, `src/staff.js`. Claim: `claimed: 2026-10-29`
- [~] **Memories done (#this PR: `src/regulars.js`, visitors you chat with 3 times become regulars with their own lines).** Left: goals, relationships, more lines per personality. Visitors with memories, goals and relationships; regulars that grow into characters; personalities (nerd, casual, superfan, snob, kid, grump, tourist) with more lines.
- [~] Famous visitors with quest chains and period-accurate dialogue; they send you places (feeds Chat 7). Odds rise with their works in your codex; permanent boosts. **Done: chains for Vermeer, Rembrandt, Hokusai (3 sourced steps each, last step offers a lead).** Left: the other 17 visitors, odds by codex.
- [x] A **Gardner-style heist mystery** as the first full story arc. "The Empty Frames", told by Edmund in 5 chapters, every line quoted from the Gardner Museum's own theft page (this PR).
- [x] **Guest conversation overhaul** (done in the main chat, not chat 10): real conversations with ordinary visitors, painting info, jokes, tips, requests, daily gifts. See `docs/HANDOFF.md` → Guest conversations. Chat 10: build on `src/chatter.js` and `chatter_lines.js` (add topics and lines), don't rebuild it.
- [ ] Semi-mythological famous visitors (the user said later).
- [ ] The caretaker (name and look), the tutorial and first session; day 2 and day 3 beats; daily guests.
- [ ] Daily and weekly quests, goal pacing (the 19 goals and rewards; daily goals?).
- [ ] Events: "Impressionism Week", "Hokusai Festival" with exclusive decor; limited-time collectibles.
- [ ] Pets and animals in the museum.

## CHAT 11: Atmosphere, seasons and audio
Owns: `src/weather.js`, `src/lighting.js`, `src/ambient.js`, `src/music.js`, `src/foliage.js`, `src/critters.js`. Claim: `claimed: 2026-10-29`
- [ ] Seasons on the real calendar (snow on the lawn, fall leaves, holiday decor, seasonal visitors like trick-or-treaters). Snow, fall leaves and recoloured trees already exist; **cherry trees stay pink in autumn (done, this PR)**. **Halloween (Oct 24-31): jack-o'-lanterns at the museum doors and costumed trick-or-treat kids; winter (Dec 18-26): woolly hats (done, this PR; `holiday()` in weather.js, `?holiday=halloween|winter`).** Still to do: winter lights, other holidays.
- [ ] Daily rhythm (Animal Crossing / Stardew feel); weather effects inside and outside; day / night polish. **Rain / snow now shade the light inside and out, and stormy rainy days have distant thunder with a faint flash (done, this PR).** **Daily rhythm: fewer visitors early and late, busiest 12-17, a few more on rainy days (done, this PR; `crowdShift`).**
- [x] Per-room music and ambience; sound effects pass; a mute and volume mix. Done: music per room and the mute + music/sfx sliders already existed; added generated birdsong by day and crickets at night outside (this PR); thunder earlier. All audio stays generated, no files.
- [x] Lighting performance on phones (High / Low / Off already exist). Done, this PR: High drops to Low for the visit if the game stays under ~22 fps for 5 s (`watchSpeed` in lighting.js). Measured in headless 390x844 at 21:00 (avg frame ms, high / low / off): 40 / 41 / 33, so Low saves little there; Off is the real saver.
- [ ] Critters, birds, fish and bugs that live on the islands and in the garden.
- [ ] Waterfalls, fountains, swans, fireflies and other life. Swan on the pond done (this PR); fireflies and fountain lights already existed. Still to do: waterfalls.

## CHAT 12: Economy, staff and services
Owns: `src/staffmenu.js`, `src/officemenu.js`, `src/office.js`, `src/incomemenu.js`, `src/wallet.js`, `src/rating.js`. Claim: `claimed: 2026-10-29`
- [x] Break-room upgrade menu (slower mess, guide training, carpenter toolbox); Curator's Office level costs and unlocks now in `src/economy.js` (#126).
- [x] Gift shop, food court stall, kids' discovery table and lecture stage as Services items (max 1 each, rules in `SERVICES` in `src/economy.js`); coffee depth via the Better beans upgrade (#144). Not done: library and archive (the Library room exists; where the stored collection lives belongs with Chats 5 and 8); the lecture stage pays per famous visitor met but has no live talk event yet.
- [x] Income formula numbers in `src/economy.js`; 8-hour cap messaging (welcome-back toast, FULL flag, income-menu note); "Collect all" is now free of ads and keeps a 15% fee (#128).
- [x] Security: four tiers (none, dummy cameras, cameras, alarm) in `src/economy.js`; stopped thieves at camera tiers are caught for a gold bounty (#166).
- [ ] Late-game sink: frame your own artwork (very expensive). Parked: the game has no way to make your own artwork yet, so it is a question under Needs Sean.
- [ ] ON HOLD (needs the user): gems as time (skip construction, "X days of income"), rewarded ads, cosmetics, a seasonal exhibition pass, crates with odds and pity. Rule: **no pay-to-win; never a gem or crate economy as the core.**

## CHAT 13: Share, visit and retention
Owns: new `src/share*.js`, `src/daily.js`. Claim: `claimed: 2026-10-29`
- [x] Export a museum as a link; a short tour image strip or clip; "rate my museum" screenshot card. (link, rating card and tour strip picture done; a moving clip is parked under Needs Sean)
- [x] Visit a friend's museum asynchronously (no multiplayer server); friends' islands in the boat picker (the map format is shareable). (look-around visit; walking round a friend's rooms is parked under Needs Sean)
- [x] Daily wheel spin, first-game-of-the-day and streak bonuses, Painting of the Day surfaced in the UI. (daily guests: asked of Chat 10, see Cross-chat requests)
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
- [x] Each hall = a themed room preset + decor + which collections and sets belong there. (PR #136: 18 presets in `content/halls/halls.json`, loader in `src/halls/`, `node tests/halls.cjs`. Hooking a hall into a menu waits on chat 9's room presets / chat 5's displays.)

## CHAT 15: Asset hunt and art swap support
Owns: `assets/vendor/`, `docs/ASSETS.md`, `tools/extract_sprites.py`, `tools/` sprite scripts. Claim: `claimed: 2026-10-29`
- [x] (#153) Run the **super dig** in `docs/ASSET-HUNT.md` (find, don't make; CC0 / CC-BY / CC-BY-SA / OGA-BY / GPL only; no non-commercial). Check network access first and don't get around bot checks; list itch.io links for the user to download by hand. Save results to `docs/ASSETS.md` (round 3), ranked top 20.
- [x] (#153) Categories: statues and sculpture (busts, plinths, display cases, rope barriers); jagged rocks and nature; museum architecture pieces (glass, curved, arches, domes, skylights, spiral stairs, facades); exhibits (dinosaur skeletons, mummies, armour, pottery, meteorites, ship models, taxidermy, aquarium tanks); furniture with four facings; island buildings, fences, docks, boats, market stalls, playground, festival decor; characters and animals; dig-site props (tents, crates, tools).
- [x] (#150) A script that lists every placeholder sprite and tile by name, size and where it's used, so the user can redraw one at a time.
- [x] (#150) **Drop-in swap:** a PNG with the same name in a folder overrides the placeholder, no code change.
- [x] (#150) Keep `tools/build_palette.py` outputs stable (piece ids never shift). Nothing here touches it; piece swaps are keyed by the existing ids.
- [ ] (Not wanted now: `docs/ART-AUDIT.md`, `ART-BIBLE.md`, `ART-BRIEF.md`. Don't continue them.)

## CHAT 16: UI and menus (flow and look)
Owns: new `src/ui/`, `ui.html`, `docs/UI*.md`, `docs/ui/`, `tests/ui-*.cjs`; restyles `src/*menu*.js`, `src/journal.js`, `src/ask.js`, `src/talk.js`, `src/dialogue.js`, `builder.html` / `src/builder/builder.css` and `src/style.css` through shared tokens and components only (never rewrites other chats' logic). Claim: `claimed: 2026-10-29`. Full plan: `docs/UI-BRIEF.md`. This supersedes "menu redesign waits for the user" (the user has asked for it).
- [x] Phase 0 (PR #180): audit of every screen with before-screenshots, `docs/UI-AUDIT.md`, `docs/UI-FLOWS.md` (entry-point map, screen inventory, depth map, journeys with tap budgets).
- [x] (PR #181, #this) Navigation and flow decisions (menu hub, sheet / modal / full-screen weights, one-at-a-time rule, event queue); three-line summary for the user at the top of `docs/UI.md`.
- [x] (PR #181) Design system and the live style guide page `ui.html`.
- [x] (PR #181) Automated checks (`ui-layout` done; `ui-flows` tap-budget test still to do): `tests/ui-flows.cjs` (tap budgets) and `tests/ui-layout.cjs` (overflow, clipped text, target size, NaN text, aria) at 360x640, 390x844, 430x932.
- [~] Migrate every screen, most-used first. **Done: HUD and Menu hub, Journal overview, and the skin that puts every older menu on the system (Toolkit, Customize with groups, Settings regrouped, Build, wall spot, Display, Office, Staff, Income, daily, share, sail, ask, dig, viewer chrome, toasts queue, tips, builder page chrome).** Left: dialogs and cards (catch, celebrate, talk bubble), viewer polish, conversation box and tutorial, title screen, builder menu and sheet flow, event queue for reward cards.
- [ ] Polish: sound, haptics, motion, empty and error states, copy sweep, large-text and left-handed modes, accessibility labels.

## CHAT 17: People sprites (classes the Pokémon way)
Owns: new `src/people/`, the character section of `src/art.js` (looks, `makeCharacter`), `src/library.js` and `art.html` (people gallery), `docs/PEOPLE-SPRITES.md`, new `tests/people-sprites.cjs`. Small additive edits only in `src/IslandScene.js`, `src/RoomScene.js` and the builder palette. Claim: `claimed: 2026-10-29`
- [ ] Tier 0: parts (builds, hats, hair, facial hair, glasses, outfits, accessories, held props, poses), all recoloured through the palette letters.
- [ ] Tier 1: janitors and grounds, construction and trades, fishermen, sailors and shore (sections A, B, D of `docs/PEOPLE-SPRITES.md`).
- [ ] Classes placeable in the builder's People list and spawned on islands; a people gallery in `art.html`.
- [ ] Tier 2: dig, field and expedition; museum professions (sections E, G).
- [ ] Tier 3: visitors and townspeople; food and market (sections J, H).
- [ ] Tier 4: arts and performance; science and medicine; artisans (sections I, F, C).
- [ ] Tier 5: history; fantasy and seasonal; crews (sections K, L, M).

## CHAT 18: Progression evidence (measure first, then design)
Owns: new `docs/progression/` (write-ups, CSV, Python models and analysis), new `src/progression/` (flags, event log, telemetry adapter), new `tests/progression.cjs`. Small additive edits only in shared files to emit events and read the flag. Builds no progression features; it measures what exists and sets the tests a progression design must pass. Claim: `claimed: 2026-10-29`
- [ ] Ground truth: content inventory from code, production cost from git history, first-hour event log, comparison kit.
- [ ] Diagnosis: `?progression=off` strip test, core loop audit, player definition.
- [ ] Models from the real numbers in code: content velocity, economy, Monte Carlo of every random roll, pacing at four horizons.
- [ ] Pre-registered hypotheses with thresholds; every reward labelled; event bus and flags only.
- [ ] Telemetry schema (opt-in, off by default), analysis scripts, playtest and diary-study protocol, experiment plan with sample sizes.

## Hold list (parked by the user; no chat builds these)
Mini-games (Mop Rush, No Flash!, Restoration-as-minigame, Crate Tetris, Hang it Straight, Tour Guide, Night Watch, Catch the Thief, Paparazzi) · gems, ads, cosmetics, exhibition pass, crates · multiplayer / auctions · a sequel where the museum is part of a city · menu redesign · art direction and hiring.

## Needs Sean (parked questions; chats keep working)
- **Chat 6:** defaults I picked, all in `src/dig.js` / `src/puzzles-hunt.js` for easy change: trowel unlocks at 6 different dug finds, pick at 16, metal detector at 10; digs rest 10 min; daily dig goal is 3 digs for 120 gold; 3 things buried per island per day; a site bonus needs 3+ touching dig tiles.
- **Chat 6:** the one `x_mark` tile on Main Island (and one on Island One) is now the map-fragment treasure and stays hidden until you hold four map pieces. Do you want it to stay, move, or should I use a different tile?
- **Chat 6:** the Puzzle yard test island (`content/maps/puzzle-yard.json`) is not in the boat yet; it needs the builder's import (Chat 2) or a boat entry (Chat 7). Dig-site sandbox: same file.
- **Chat 12:** what is "your own artwork" for the late-game frame sink: a drawing the player makes in the game, a photo they upload, or a painting they restore? Until you say, it is not built.
- **Chat 12:** the Library/archive (where the stored collection lives) and a live lecture-hall talk event are not built; the stage only pays per famous visitor met.
- **Review tonight:** the 82 painting drafts (27 earlier + 55 from batches 3 to 5; rarity for each) and which of the 11 flagged images to replace (`content/image-proposals.md`).
- **Hooks for 4 Met drafts** (Night-Shining White, Esther, Gulf Stream, Drawing Lesson), plus every other Met / Commons draft marked "needs a real hook": the Met page text is behind a bot challenge, so paste one sentence per work and I add it as a quoted claim.
- Latin America, the Pacific, the Middle East beyond Iran and Indigenous North America have almost no public-domain paintings with museum text in the Met, Cleveland or Commons; the Smithsonian key is the way in.
- **Approve the rarity proposal** (`content/rarity-proposals.json`) and the Painting of the Day lines (`content/potd/draft.json`).
- Smithsonian (`SI_API_KEY`) and Rijksmuseum (`RIJKS_API_KEY`) keys.
- Chat 9: front lawn and facade (what does the outside look like?); rooftop terrace and telescope (where does it sit, which room reaches it?); elevator (what does each new floor hold?); construction times (is a day of waiting OK with "no wasted time"?); seamless archways showing two rooms at once (how much of the next room should show?).
- Non-square rooms: what shapes, how they join, how they look (blocks Chat 9's first item).
- West Wing outline; break-room upgrade ideas (defaults in `src/economy.js`: Better mops 90→120/160/220 min for 250/700/1800 gold, Guide training +10%→12/15/20% for 400/1100/2800, Carpenter's toolbox 10/20/30% off rooms for 350/900/2200; office levels 500/2000/8000/30000; collect-all fee 15%; security 150/400/1500, bounty 120; Better beans x1.25/1.5/2 for 300/800/2000; services: gift shop 600 gold, food court 1200, discovery table 700, lecture stage 1500, earnings in `SERVICES`); goal pacing and daily goals.
- Asset hunt: download by hand from itch.io (PixelFishes CC0; Idylwild's Armory, check its licence first); links in docs/ASSETS.md round 3. Also: do you want a later dig of CraftPix, GameDev Market and GitHub CC0 tilesets?
- Dig spots on Main Island: place them in the builder where you want them.
- Mini-games and gems / ads: go or no-go?
- **Chat 8: paintings are all yours from the start** (`ownership: 'all'`), so the Gallery Shop and selling have nothing to do with them yet. Switch the painting collection to `'earned'` (start with only the entrance paintings) and they flow through `shop.js` with no code change. Do you want that? Defaults in `src/collections/shop.js`: sell 50%, buy-back after 7 days at 75% of price, shop price 150%, 3 to 5 pieces a day; base price by rarity 40 / 120 / 400 / 1500 (an entry's own `price` wins). Milestone gold 500 / 1,500 / 5,000 / 12,000 / 50,000; artist sets pay 100 per painting.
- Open design questions: free-roam map or chain of rooms; should paintings come only from expeditions; can you fail an expedition; seasons automatic or chosen; split the shared core now?

- **Chat 13 defaults (change in `src/daily.js`):** welcome gift 40 gold + 10 per streak day (max 7) + 100 on every 7th day; wheel slices 25/40/60/40/100/25/75/250; the streak forgives a gap of up to 3 days and otherwise restarts quietly with no message.
- **Chat 13:** a moving tour clip (video/GIF) and walking round a friend's actual rooms need real work in RoomScene (a read-only room loader); should they happen? Today a visit is a look-around card of paintings and decor.

## Cross-chat requests (add a line, carry on)
- **Chat 16 to everyone:** UI overhaul in progress. New menus and panels should use the `ui-*` components in `docs/UI.md` once it lands (until then keep your menu markup simple and class-based); please don't restyle menus yourselves. Chat 16 restyles through shared tokens and won't rewrite your logic or change element ids tests use.
- **Chat 13 to Chat 10:** "daily guests" belong with the famous visitors. `src/daily.js` has `dayNum()`; if you want a "today's guest" pick, key it on that and I'll show it on the Today panel.

- Chat 14 → Chat 9/12: `applyHall(roomIndex, hall)` (`src/halls/apply.js`) restyles a built room for free and returns `before` for `undoHall`. A menu button and any price are yours to decide; it refuses fixed rooms.
- Chat 14 → Chat 1/8: halls list `planned` collections (only sculpture and egyptian are still missing; the rest are now wired in) and Japanese prints: add the data and move the id into the hall's `collections`.
- Chat 10 → Chat 7: story chapters offer leads by writing `{id, text, from, at}` to `curation.leads_offered` (see HANDOFF, "Story and leads"). Read it, show the lead, start the trip; ids so far: `heist-hideout`, `sphinx-letter`, `studio-chest`, `last-scrolls`.
- **Chat 5 / 8:** `foundAt(entryId)` (`src/foundat.js`) returns "Skull Isle" etc. for any find from an expedition; `provenanceLine` already uses it.
- **Chat 10:** expeditions read `curation.leads_offered` (your four ids open islands); `grantLead('id')` in `src/leads.js` is the other way to hand one out.
- **Chat 6:** I added an optional `onFound(entry)` to `startDig` in `src/dig.js` (expeditions bring finds home dirty). Left your files otherwise alone.

## Order
The chat numbers **are the priority order**: 1 is most important, 15 least. If you can't run all 15, run them in number order. Chat 14 (halls) needs 5, 8 and 9 first; chat 15 (asset hunt) is placeholder support and can wait.
