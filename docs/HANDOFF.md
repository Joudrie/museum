# Handoff: where Curation stands (read this first)

> **Many chats work in parallel: read `docs/TODO.md` (the master board), claim a stream there, and keep to its files.**

For a Claude session that only knows the repo. Read `CLAUDE.md` (the rules) and
`docs/VISION.md` (the north star) first, then this file.

Live: game https://joudrie.github.io/museum/ · builder https://joudrie.github.io/museum/builder.html
(GitHub Pages redeploys on every merge to `main` via `.github/workflows/pages.yml`).

---

## 1. Working with the user

- **Phone only.** The user has no desktop. Everything must work on an iPhone in portrait
  (Safari). Test at 390×844.
- **Brief answers.** Few words. No long explanations.
- **Don't stop to ask questions mid-task.** Use common sense and finish. The user is often at
  work and away from the phone. A question that blocks work for 30+ minutes makes them angry.
  (The one exception, from CLAUDE.md: ask before building from an unclear hand-drawn sketch.)
- **Be fast on small asks.** If they ask for a "2-second fix", ship it right away, by itself.
  Don't bundle it with a big change that takes 30 minutes.
- **Always end with the two links** (game and builder) when work is done.
- **Every push → PR → merge it yourself → reset the branch to `main`.** (CLAUDE.md.)
- **Find art, don't make it.** Use free packs only: CC0, CC-BY, CC-BY-SA, OGA-BY, GPL, with credit.
  No paid packs, no revenue share. 2D pixel art only. itch.io blocks bots, so list itch links
  for the user to download by hand. AI-generated art only if nothing free fits, and only with
  the user's OK.
- **Never lose their work.** They lost 40 minutes of builder work once and were furious.
  Anything they make must autosave, survive reloads and crashes, and be recoverable.
- **Read their words literally.** Example: "lock Island One's doors" meant only Island One. It
  did not mean the main island too.

## 2. What the game is

"Curation", a cozy pixel-art museum tycoon (Phaser 3.90 + Vite). Real public-domain paintings
in HD, Pokémon-style talking visitors, famous artists, islands to explore, fishing. See VISION.md.

Scenes (`src/main.js`):
- `RoomScene`: the museum rooms.
- `IslandScene`: every island, including builder maps.
- `IsoScene`: the 45° angled cottage room on Island One.

## 3. Recent work (PRs #64–#75): the new stuff

### Map builder (`builder.html`, `src/builder/main.js`, `src/builder/builder.css`)
- A mobile-first painter for islands (up to 300×300) and rooms.
- **Tools:** Paint, Erase, Fill, Move, Pick, Pan. Pinch to zoom, two fingers to pan.
- **Lists:** pieces sit in dropdown lists in a bottom sheet, 4 per row with names, including:
  - Terrain, Ground tiles, Paths, Water
  - **Buildings**, with the placeable **Museum**
  - **People**: stays put / wanders a little / wanders a lot
  - **Animals**: cats, dogs, bunnies, parrots, crab, frog, duck
  - the room pieces from `public/builder/`
- **Map format** `curation-map` v2: `{name, kind, w, h, corners:[rows of 0-4], tiles:{"x,y":ref}, objects:[{ref,x,y,flip}]}`.
  - Refs: `m:N` terrain, `t:name` island tile (`src/tiles.js`), `p:group/i` room piece
    (`public/builder/pieces.json`).
  - Corner materials: 0 sea, 1 sand, 2 grass, 3 pond, 4 path.
- **Saving (never lose work):**
  - Every change saves at once to localStorage (`curation.mapbuilder.maps`), and also when the
    page is hidden or closed.
  - Every save also goes to IndexedDB with version history (`src/builder/vault.js`). That copy
    restores the work if localStorage is wiped.
  - ☰ → **Earlier versions** rolls back.
  - On open, a **"Continue where you left off"** card shows.
  - The corner chip says "autosaved 9:30 PM".
  - Pieces that fail to load are kept, not dropped.
  - **New island** takes two taps.
- **Page never zooms:** `touch-action: pan-y` on everything, the canvas is `none`, and inputs
  are 16px.
- ☰ → **Walk around this island** stores the map in `curation.playtest` and opens
  `index.html?play=1`. That starts the game on it, with a "← Builder" button.
- The user's recovered island seeds once as "Recovered island" (`src/builder/recovered.json`).

- **Palette search, favourites, recents (#117):** search box at the top of the palette (matches label, group and ref), a ★ in the
  chosen bar, "Favourites" and "Recently used" rows (`curation.mapbuilder.favs` / `.recent`, convenience only).
- **Turn families:** `tools/rotation_sheet.py <sheet> <from> <to>` draws a labelled contact sheet to check sets by eye. Done so far:
  the four armchair colours (front, left, back, right). Colour blocks repeat at fixed offsets but never auto-group; look first.

- **"What's new" row:** `public/builder/whatsnew.json` lists refs shown first in the palette; add new pieces there. Duplicate lists (Plants / Flowers & plants, Garden & park) are merged by `MERGE` in `src/builder/main.js`.
- **Area tool (#121):** drag a rectangle (shows W×H), then Copy / Cut / Clear / Mirror / Paste (tap to paste, repeat). Takes ground tiles, terrain corners and
  pieces whose feet are inside. ☰ → Options has Ground / Pieces layer toggles. Whole-area rotation is not built.
- **Vault restore** now also writes the restored map back to localStorage (before, it only lived in memory until the next edit). **Jagged rocks** (`rock_jagged`, `_big`, `rock_spire`) are new pieces in `addJaggedRocks` (tiles.js); the round rocks stay. **Grass blending** is `src/groundblend.js`.
- **Palette sorting** (`src/builder/sorting.js`, display only: refs, layers and saved maps are untouched): which list every piece shows in, list order and the small headings inside long lists. Island tiles keep their group unless `MOVE` / `GROUP_LIST` file them elsewhere (one Cliffs list with a heading per set; Trees, Farm, Beach, Docks, bridges & boats). Room pieces (`p:group/n`) are sorted and named by `ROOM_MOVES` and `SHEETS`, worked out from each piece's source sheet (pieces.json keeps build_palette.py's cutting order): curtains, lamps and screens out of Seating, beds and pianos out of Shelves, "Curtain 3" instead of "Seating 3". Cuts that hold several objects sit in "Mixed sets & parts". New pieces: add them to these tables.
- **Cliff kits on any ground** (`src/cliffkit.js`): "Dark grey cliffs" (`gcliff_*`, jointed basalt columns) and "Brown cliffs (any ground)" (`bcliff_*`, layers). Their ground is see-through, so they sit on the terrain painted under them (sand, grass, snow). 25 pieces each: back / side / front edges and corners, a face that stacks, the foot with its shadow, inner corners for L-shapes and terraces, stairs (top, stacking middle, foot), plus 3 boulders each in Rocks. The old `cliff_*` set is untouched.
- **Builder test:** `PW=<playwright> URL=http://localhost:4173/builder.html node tests/builder.cjs` (place, undo/redo, turn, reload, vault restore after wiping localStorage).

### Islands (`src/IslandScene.js`)
- **Main Island** = `src/maps/main-island.json`, the user's own map. It is **home**:
  - The museum's front doors lead out onto it and back in. It is the only museum you can enter.
  - When the user sends an updated map file, copy it here and set `name` to "Main Island".
    A backup lives in `docs/maps/`.
- **Island One** = the old code-drawn island (`init({map:'one'})`, so `this.map` is null).
  - Its museum doors are **locked**: walking in only shows a toast.
  - Its cottage still opens the angled room.
- **The far isle** = `src/maps/isle-1.json`.
- **Skulldug Island** = `src/maps/skulldug.json` (the user's builder map, backup in `docs/maps/`). In `MAPS`, so the boat lists it; no region entry yet, so it is open to everyone (region `wild`).
- **The boat** ("Sail" at a rowboat) opens a "Where to?" picker (`src/sailmenu.js`). It lists
  Main Island, Island One, the far isle, Skulldug Island, and every island saved in the builder on this phone.
  Same origin, so the game reads the builder's localStorage.
- **Builder islands in the game support:**
  - the museum (doors work, front two rows solid)
  - people (looks from `visitorLook` in RoomScene; walk Pokémon-style in 1–2-tile steps within
    their range; tap to chat)
  - animals (`ANIMALS` in `src/landmarks.js`; pets use `makePet`, critters use
    `critterTextures`; ducks stay on water; tap to pet)
  - room pieces such as statues and fountains (sheets load in the background; the foot is solid;
    pieces ≤20px tall, like mats, are walkable; nothing may block the museum doorway)
  - rowboats, docks, tall grass and cliffs

### Collections: one format for everything the museum holds (`docs/COLLECTIONS.md`)
- Paintings, fish, finds and minerals are **entries** in **collections** (`src/collections/`).
  A new collection = a data file in `src/collections/data/` + one line in `index.js`.
- `curation.codex` (versioned) is the one ledger: everything ever collected, what you hold, claimed
  set rewards. Older saves migrate silently; old keys (`curation.fishing`, `curation.met`,
  `curation.slots`) are left alone. Fish `caught` now lives in the codex.
- `src/paintings.js` and `FISH` / `FINDS` in `fishing.js` are thin views over the registry. Painting
  ids stay bare slugs (`harvesters`), so saves, goals and notes still match.
- The Journal builds its Paintings / Fish / Minerals tabs from the registry, and the viewer
  shows any entry (pictures on the wall, pixel art in a glass case). Sets show progress and pay out once.
- **Minerals** is the proof: 8 entries, pure data. Settings → Testing → "Collect one of everything"
  fills it, since nothing hands out minerals yet (that is the dig-site work).
- `tools/import_collection.mjs` turns a CSV into a data file and refuses rows with no license/credit.
- Test: `PW=/opt/node-tools/node_modules/playwright OUT=<dir> node tests/collections.cjs`.

### Restoration and provenance (Chat 4: `src/restore.js`, `src/restorestudio.js`, `src/storage_room.js`)
- **The `dirty` contract** (for chats 6 and 7 to hand over, chat 5 to display): `collect(id, { dirty: true })` hands over a dirty find
  (or put `dirty: true` on an entry; `dirty: false` forces a clean one); `makeDirty(id)` grimes something already held (even a painting);
  **before displaying anything ask `displayCount(id) > 0`, never `ownedCount`**. All in `collections/codex.js`, re-exported by `restore.js`;
  the codex keeps `dirty: { id: n }` and a `restored` count on `seen`. Optional `entry.restore: 'clean' | 'prep' | 'assemble'`
  (default: pictures clean, `fossil` prep, tags pottery/bone/vase assemble).
- **Restoration Studio** (`openStudio()`; opened from Journal → Storage): rub grime off the real HD image with a before/after slider;
  brush stone off a fossil; drag 9 pieces back together. Leaving costs nothing. Real paintings are never altered, only a grime layer over them.
- **Storage tab** in the Journal: held now (ready vs needs restoring) against the codex (ever collected). Viewer shows "Recovered from <place>".
- Test: `PW=/opt/node-tools/node_modules/playwright OUT=<dir> node tests/restore.cjs`. A physical studio desk in a room is not built (the entry is the Journal tab).

### Content pipeline (`docs/CONTENT.md`, `docs/CONTENT-STYLE.md`): real art in, with a person approving
- `tools/sources/` has one adapter per museum (Met, AIC, Cleveland, Smithsonian, Rijksmuseum, Commons):
  public-domain / CC0 only, cached, rate-limited. **They have never run against a live API**: the build
  sandbox blocks every museum host, so they follow the documented shapes and tests use hand-written fixtures.
  Allow the hosts listed in `docs/CONTENT.md`, then expect small fixes (Smithsonian and Rijksmuseum most).
- Flow: `build_batch.mjs` → drafts in `content/review/<collection>/` → `review_report.mjs` → a person sets
  `"status": "approved"` → `publish_content.mjs` writes the data file and `CREDITS.md`.
  Every blurb and fact is a claim with the museum's exact sentence quoted; unsourced claims, invented numbers,
  filler, duplicates and missing licenses are flagged. The Met has no description text, so its drafts need a hook written.
- **Hosted paintings (Chat 1, #113/#118):** 46 of the 49 paintings are our own 1280px JPEGs in `public/paintings/` (same pictures; `tools/host_paintings.mjs`
  re-makes them, `content/hosted-images.json` records each original URL). The 3 broken ones (horse-fair, temeraire, crossing-delaware) keep their dead
  link until the user approves a file in `content/image-proposals.md` (all 11 flagged images have a proposal there; nothing applied).
- **Batches 3 to 5 (Chat 1, #130):** `content/batches/{third,fourth,fifth}-batch.json` built 55 more drafts (82 in all, none approved). Cleveland ids carry a
  quotable description; Met and Commons ones are flagged "needs a real hook". Live APIs: the Met rate-limits (HTML block page) and Cleveland's `fields=` param 500s.
- **Rarity and Painting of the Day (Chat 1, #137):** `content/rarity-proposals.json` (49 paintings, status `proposed`; `tools/apply_rarity.mjs` applies it only once approved) and
  `tools/potd.mjs` (`build` drafts quoted lines into `content/potd/draft.json`, `publish` writes `src/collections/data/potd.json` from approved ones, `pickFor(date, list)` rotates). Chat 13 shows it.
- **Archaeology drafts (Chat 1):** `content/batches/archaeology-batch.json` built 25 Cleveland objects (Egypt, Near East, Greece and Rome, ancient Americas) in
  `content/review/archaeology/`, all draft, `era` left blank, waiting for Chat 8 to define the collection. Natural history has no quotable open source yet.
- `check_images.mjs` flags broken, tiny, heavy and wrong-shaped images for every painting. **Not run yet on the
  49 paintings** (no network here); `content/batches/first-batch.json` (12 works, 9+ regions) is waiting to be built.
- Test: `node tests/content.cjs` (no browser, no network).

### Share, visit and daily (Chat 13)
- No server. `src/sharecode.js` packs a museum "postcard" (rooms, painting ids, decor counts, rating; **no gold, saves or character**) or a builder island into a link (`?visit=` / `?island=`), read back with strict cleaning. `src/share.js` is the Settings → "Share & visit friends" panel: copy link, rating card and tour strip pictures (canvas), paste a link or open a map file. Visiting is a look-around card; "Keep" stores it in `curation.friends`. Friends' islands join the boat list (`friendIslands()` in sailmenu.js).
- `src/daily.js` is Menu → Today (its `#daily-btn` now lives in Chat 16's Menu hub): welcome gift, one wheel spin a day, Painting of the Day (same for everyone, stepped through `PAINTINGS`). Gentle: a streak survives up to 3 missed days and never nags. Numbers sit at the top of the file.
- Painting of the Day and a friend's paintings open in the HD viewer (`openViewer(..., { over: true })`, above every sheet); the wheel's top slice gets the confetti card.
- Test: `PW=/opt/node-tools/node_modules/playwright OUT=<dir> node tests/share.cjs`.

### Halls (chat 14): themed room presets
- `content/halls/halls.json` holds 18 halls (art, science, nature, history, garden): a theme from `src/themes.js` (moved out of decor.js, still re-exported), decor tweaks, items placed as 0-1 fractions of the floor, painting eras for the walls, and the collections/sets that belong there. `planned` lists collections that don't exist yet.
- `src/halls/preset.js` is pure (validate, fit items to any room size without blocking doors, `hallEntries`); `apply.js` writes a hall into a built room and returns what it replaced for `undoHall`. Fixed rooms are refused. Test: `node tests/halls.cjs` (plain Node).
- Halls carry no facts of their own; true, quoted facts live in collection entries. Nothing in the UI uses halls yet.
### Story and leads (Chat 10)
- `src/story.js` tells the next chapter of an arc or a famous visitor's chain when its condition is met; data is in `src/stories/` (`heist.js`, `chains.js`). State: `curation.story` `{done:{beatId:true}}`.
- **The Empty Frames** (heist arc): Edmund tells 5 chapters of the real 1990 Gardner theft. Every line has the museum's quoted sentence; `node tests/people.cjs --live` checks each quote is still on its source page.
- **Chains** for Vermeer, Rembrandt, Hokusai: talk to them again after each ask is met (hang their painting, meet more visitors). Add a visitor = add an entry in `chains.js`.
- **Hook for expeditions (Chat 7):** finished beats with a `lead` append `{id, text, from, at}` to `curation.leads_offered` (`leadsOffered()` in `story.js`). Chat 7 reads that list and starts the trip. Ids so far: `heist-hideout`, `sphinx-letter`, `studio-chest`, `last-scrolls`.
- **Regulars:** `src/regulars.js` counts talks per visitor (name + type, `curation.regulars`); the 3rd talk they recognise you, later talks use regular lines. `regularCount()` is there for goals/Journal later.

### Display: fixtures that hold collection entries (Chat 5)
- A fixture is a decor item with a `fixture` block in `src/items.js` (kind, `accepts` display tags, `slots`). Today: easel, plinth, glass case,
  specimen shelf, aquarium, giant tank. Placed fixtures get a stable id `d`; `curation.display` = `{ [d]: [entryId] }` (`src/display.js`, Node-safe).
- Stand by one and tap Interact: `src/displaymenu.js` lists what is on it and what you own that fits (needs `ownedCount > on display`). Tapping a
  picture opens its card in the viewer. `src/displayart.js` draws the pieces over the sprite (fish swim); rare and legendary pieces get a glow.
- Pieces on display earn `value` (or 2 x rarity) gold/hr (`wallet.js`) and count as decor in the room rating (`rating.js`). Moving a fixture keeps its
  pieces; selling empties it. Test: `node tests/display.cjs`.
- Tap a displayed piece in the room (no toolkit open) to read its card and swipe to the others in the room (`RoomScene.tapDisplayed`).
- A set with every piece on display (any rooms) earns double for those pieces; the panel shows each started set's progress and plaque. Items can
  carry `needs: { entryId: count }` (the T-rex skeleton: 6 dinosaur bones + a T. rex tooth); `missingFor()` blocks buying and the toolkit says what is missing.

### Expeditions (chat 7): leads, boat scene, seven islands
- **Leads** (`src/leads.js`): letters, torn maps, notes and rumours, kept in `curation.leads`. The first (a bottle note) turns up when you first open the boat menu; finishing an island hands out the next (`then`). The boat menu only lists an expedition island once a lead points at it, and has a **Letters & leads** entry with a "Set sail" button per lead. Add a lead = one entry in `LEADS`.
- **Islands** are `src/maps/exp-<id>.json` (builder format) with an `expedition` block: `spots` (note, dig, chest, crate, plate, gate, lever), `patrols`, `clock`, `goals`. `src/expedition.js` runs it (auto-loads every `exp-*.json`). `tools/gen_expeditions.mjs` drew the seven first drafts (Skull Isle, Drowned Reef, Sandstone Tomb, Red Badlands, Lost Temple, Thieves' Rock, Frozen North); repaint them in the builder but keep the block. Failing is gentle: caught or washed out puts you back at the boat, finds and flags stay.
- **Finds come home dirty** with chat 4's contract: `collect(id, { dirty: true })`, so they are in your bag and the Restoration Studio cleans them. `foundAt(id)` (`src/foundat.js`) remembers the island and `provenanceLine` shows "Recovered from Skull Isle". Leads offered by chat 10's story chapters (`curation.leads_offered`: `heist-hideout`, `sphinx-letter`, `studio-chest`, `last-scrolls`) open Thieves' Rock, the Tomb, the Reef and the Temple.
- Each map's `expedition.climate` pins its season and weather (Frozen North is always snowing, the Temple always rains); new props are in `src/tiles.js` under the "Expedition" group.
- Test: `PW=... OUT=<dir> node tests/expedition.cjs` (a whole trip on Skull Isle, and every island's spots are reachable from the boat; run it alone, not next to another browser test).

### Wakefield, MA is NOT part of the game
A separate personal project (the user's hometown, for friends) that only shares the engine. Its page is `wakefield.html`, its code
`src/wakefield/`, its notes `docs/WAKEFIELD.md`. Never add it to the game. Engine improvements made along the way and kept in the
game: the builder cap is 700 (New map boxes stay 300), big builder maps save their tiles packed (`src/mapformat.js`), and the
island scene streams ground chunks around the player.

### Why the tests used to be flaky (fixed, #170)
- Island walking moved one step of `SPEED*dt` per frame (dt capped at 50 ms). On a slow or loaded machine (21 fps in CI) the step is ~8 px and hopped over the 6 px strip in front of a door, so the "cottage door" check failed; steps are now at most 3 px, so slow phones behave like fast ones.
- `Ambient` probes `isPond` up to 40 px away, past the island edge, and `key()` read a missing corner row and threw; `isPond` is now bounds-checked. If a smoke run fails, first check that no other test is running at the same time (CPU load changes frame rate).
### Economy and staff (Chat 12)
- **Every economy number lives in `src/economy.js`** (office level costs, janitor/guide prices, upgrades, offline cap, visitor formula, camera price, robbery odds). Change a default there only.
- Break-room staff board has three upgrades (`UPGRADES`): Better mops (slower mess), Guide training (more % per guide), Carpenter's toolbox (cheaper rooms). Levels saved in `curation.upgrades`; read with `upgradeValue(id)` in `src/staff.js`.

- Gold piles cap at 8 h per spot: welcome-back toast after 20+ min away, a FULL flag per room in the income menu. "Collect all" no longer shows an ad (ads are on hold); it keeps `COLLECT_ALL_FEE` (15%).

- Security is a tier (`curation.cameras`, old `true` = tier 2). The guard sells the next tier; each tier has a `stop` chance for the rare robbery, and camera tiers turn a stopped robbery into a "thief caught" bounty.

- Services items (toolkit → Services, max 1 each): gift shop (gold per hung painting, doubled per rarity step), food court and discovery table (scale with visitors), lecture stage (per famous visitor met). Earnings logic: `serviceGold()` in `src/wallet.js`, numbers in `SERVICES`. Their art is placeholder, in `bakeItem` in `src/art.js`.

### Phone performance: numbers and budgets (Chat 3, #173)
- `node tests/perf.cjs` (preview server running) slows the CPU 4x (about a mid-range phone) in a 390x844 browser, walks, and prints JS ms per frame (sampled time that is not native/GPU; headless has only software GL, so FPS and GPU time are not phone numbers). Env: `SLOW`, `SECS`, `ONLY`, `STRICT=1` (exit 1 over budget).
- **Budgets (JS ms/frame at 4x):** rooms 18, islands up to ~1,000 objects 24, huge islands (300x300 and up) 45. At 4x, 33 ms is a 30 fps frame and the GPU still needs its share.
- **Before** (ms/frame): entrance 6, main hall 11 to 14 (night, lights high 13.7), main hall + 40 extra visitors 14, Main Island 25 to 33, 300x300 island with 60 people 61, with 300 people 84, 700x700 with 4,900 trees 64.
- **Fixes:** off-screen placed pieces are hidden (`cullPlaced`: Phaser sorts and culls every object every frame), and idle islanders far off screen stand still. **After:** Main Island 19 to 23, 300x300 25 (60 people) and 32 (300 people), 700x700 31 to 41. Lights High / Low / Off cost about the same in rooms (6 to 7 ms; the lamp work is small next to drawing). Remaining cost is Phaser's per-frame depth sort and drawing the visible objects; the next step would be chunked ground objects, not more culling.
### Guest conversations (`src/chatter.js`, `src/chatter_lines.js`, `src/dialogue.js`)
- Tapping Interact on an ordinary visitor now opens a **conversation box** (portrait, typed-out text, choices; tap to go on) instead of a one-line bubble. Staff, famous visitors and the caretaker keep their own flows.
- Topics, each offered once: **About this painting** (the museum's own blurb, a sentence at a time), **Something funny** (2 jokes per visitor kind), **Heard anything?** (true tips about digging, the boat, fish, restoration), and **What are you looking for?** (they ask for an artist; hang one and they're pleased and give more).
- **Gifts:** after you've talked, a visitor may give gold or a rock or fossil they "found". **One gift per visitor per day**, and gifts shrink after 4 a day (full, half, quarter). Saved in `curation.chatter`. Visitors with a gift today show a star over their head now and then.
- The engine is a generator (`converse`) with no DOM, so it is tested in Node: `node tests/chatter.cjs`. Lines live in `chatter_lines.js` (data); add jokes, tips and gifts there.
- `endTalk()` closes an open conversation; `pause(true)` closes it too and leaves the pause to the panel that asked.
- Not done: island people (IslandScene still uses the old bubble), famous visitors' dialogue (Chat 10's chains), portraits beyond the walking sprite.

### One command for all tests, and CI (Chat 3, #174)
- `npm test` builds, starts the preview server (and a dev server for `dig`, which imports `/src/...` straight from the page), runs content, gaps, collections, smoke, builder, dig, puzzles, restore, display, expedition, halls, people, presets, share and chatter, and prints one line each. `ONLY=gaps,content`, `SKIP_BUILD=1`, `ALL=1` (adds playtest and perf), `RETRY=1`.
- `.github/workflows/tests.yml` runs that on every pull request (Playwright 1.63 installed in CI only). A new test file goes in `FAST` in `tests/run-all.mjs`. Don't run two test runs at once: CPU load changes frame rate and has caused false failures.

### Save safety and bundle budget (Chat 3, #175)
- `tests/saves.cjs` writes junk into every `curation.*` key found in `src/` (bad JSON, wrong type, nested junk) and checks the game still opens. `load()` in `src/storage.js` keeps an unreadable save once under `curation.bak.<key>`. Reset museum needs two taps and keeps the old save in `curation.bak.reset`. A new store should use `load(key, fallback)` with a fallback of the right shape.
- `tests/bundle.cjs` checks gzip sizes in `dist/` (phaser 360, main 230, all JS 760 KB). Raise a number on purpose, with a reason.

### UI system and navigation (Chat 16: `docs/UI.md`, `docs/UI-BRIEF.md`)
- **Design system:** `src/ui/tokens.css`, `ui.css`, `icons.js`, live style guide at `/ui.html`. Pixelify Sans (OFL) is bundled. Use `ui-*` classes and tokens for any new menu (checklist in `docs/UI.md`).
- **HUD:** labelled buttons (Journal, Build, Style) on the left, **Menu** on the right; the Menu hub (`src/ui/hud.js`) holds Today, Your museum (income), Share & visit and Settings, on islands too. The old ids (`#daily-btn`, `#settings-btn`) now live in the hub, so tests call `openHub(p)` from `tests/nav.cjs` first.
- **Journal** opens on an **overview** (stats, next goals, a card per collection, Codex / Storage / Gallery Shop) instead of 17 tabs; each card has `data-jtab`, a page has a back button. Tests use `jtab(p, id)` from `tests/nav.cjs`. Overview code: `src/ui/journalhome.js`.
- **Older menus are on the system through a skin** (`src/ui/skin.css`, `chrome.js`, `prefs.js`, `toast.js`, `hint.js`): no logic rewritten, ids unchanged. Toasts queue through `say()` (`src/ui/toast.js`); one-time tips use `hint(id, text, anchor)` and obey Settings → Tips. Settings is grouped (Sound, Look, Play, Friends & data, Testing) and has Text size, Reduce motion and Left-handed layout; Customize → This room is collapsible groups. Prices read "Free (X gold)" while testing. `node tests/ui-flows.cjs` holds the tap budgets.
- **Panels close the way a phone expects:** tap the dimmed world or swipe the sheet down by its handle (`src/ui/chrome.js`; nothing to wire in a new menu, except that a panel with half-typed text or work in progress should be left out of `BACKDROP` there). Esc closes the top panel. Celebrations queue (`celebrate(title, sub, icon)` in `src/ui.js`). Numbers in the status strip use `shortNum()` (`src/ui/num.js`). The bundled pixel font had two defects (a 5 that looks like S, and "fi" drawn as A); both are fixed in the file, see `docs/UI.md` before swapping it.
- **Guard:** `node tests/ui-layout.cjs` (slow set) fails on sideways scroll or "undefined" text and ratchets tap targets and text size per screen (`tests/ui-budget.json`). Screenshots: `node tests/ui-shots.cjs docs/ui/after`.

### Interaction polish, emotes, boats and little scenes (main chat)
- **You act on what you face** (`src/focus.js`): one `resolver(x, y, facing)` that both scenes feed every candidate (person, door, sign, water, item) and that returns the nearest one inside a ~66° cone ahead (`FACING_MIN`). Something beside or behind you (a person at your back while you face a door, your own pet trailing you) is out of reach until you turn; facing nothing means Interact does nothing. Things under your feet (mess, dig spots) need no facing. Rooms use `facingOf(player)`, islands use `this.facing`. The Interact button now says what it will do (Talk, Chat, Pet, Look, Enter, Fish, Read, Open, Sail, Hop in...): `focusLabel` in both scenes.
- **Speech bubbles** (`src/talk.js`, sizes in `src/speech.css`) sit on the speaker's head and follow them (and the camera) every frame, vanish at once (no fade) when the speaker is gone or the `away` function you pass says the player has walked off (`scene.walkedAway(sprite)`); the tail stops short of the sprite (`GAP`). `showTalk(name, label, line, at, ms, away)` takes `at` as `{x,y}` or a function (use `scene.speakerAt(sprite)`, which uses `bubbleSpot` in `focus.js`: if you stand just above the speaker the bubble goes under the two of you, so it never covers you); it returns null when the speaker is gone, which closes the bubble (so one never hangs over the next scene). Text types out. A bubble takes no taps (the Feedback pass: it closes when you walk off or after a few seconds). The old `followSpeaker` helper is gone: use `speakerAt` + `walkedAway`.
- **Island people hold the real conversation box** (`IslandScene.talkTo` runs `converse` from chatter.js, first line from `src/island_lines.js` by season / weather / night / holiday, gifts included; the progression layer's named people get their own conversation from `life.talk`). Like the rooms it never pauses the game: the box sits in the top third and walking off ends it (`runDialogue`'s `leave`, `walkedFrom`), the Interact button hides while it is up. Walking up to someone you pass: they turn and show a picture.
- **Emotes** (`src/emotes.js`, icons in `art.js` `EMOTE_ICONS`; add one = one 7x7 row set): `popEmote(scene, {s: sprite}, id)` follows the head. `startChat(scene, a, b, opts)` makes two people face each other and trade pictures (clover, star, heart...) for 3 to 5 beats. Rooms: `socialize` / `goChat` in RoomScene (visitors meet by the paintings, sometimes one walks over). Islands: `socializeIslanders` (neighbours chat in place, an idle person with a range strolls over to a friend, then drifts home). Both ignore staff, famous visitors, couples and scripted people.
- **Footprints** (`src/prints.js`): a fixed pool, so a long walk never piles up objects. Snow (`IslandScene.snowAt`, the same drifts `snowChunk` paints) and soft sand keep prints, for the player and for anyone walking by; they fill in over about 16 s (snow) or 6 s (sand). Rain makes small rings where you step.
- **The rowboat is main's `src/rowing.js`** (walk into open water, "Row out?", row anywhere on the island's water, row into land to climb out). My own hop-in boat (a Boat button and a moored skiff) was dropped when #202 landed with the same feature; the interaction rules still apply to it (`tests/interact.cjs`, `tests/qa-interactions.cjs` cover asking, rowing, fishing from the boat and climbing out). The Interact button, not a second button, is all there is.
- **Reactions in conversations**: lines in `chatter.js` can carry a `mood` (an emote id) that `runDialogue` hands to `onMood`; both scenes pop it over the speaker's head (a question when they ask you something, a heart when pleased, a smile on a punchline, a star for a gift).
- **Seeing who you'll act on**: `src/focusmark.js` bobs a small arrow over the person, pet, door or boat that Interact will act on; characters and animals get a soft shadow (one Graphics redrawn per frame). The player breathes puffs of mist in the cold and looks round after standing about (islands).
- **Loading**: `vite.config.js` (`preloadGame`) adds `modulepreload` links for the game chunk and Phaser so they download while `swap/index.json` is fetched.
- **Tells and weather details**: `src/tells.js` (people breathe and blink; `n.skin` is the eyelid colour), `src/shadows.js` (pooled soft shadows), `src/wind.js` (one breeze; smoke from campfires and the cottage chimney; gusts of leaves along the ground in autumn, blossom in spring; `flick` kicks leaves up as you step), puddle ripples (`onStep`), sparrows and sandpipers going up from further off when you run, window lights on the map museum at dusk, a rare line on the 10th / 25th / 50th talk with the same person (`rareFor` in `regulars.js`). After a conversation the person turns back to what they were looking at (`turnToPlayer` / `turnBack` in rooms).
- **Load and map transitions** (`tests/loadtime.cjs`, cold cache, CPU x4, LTE, medians of 3; `DWELL` = time in the museum before walking out): the island's tiles were the cost, not the map (drawing them took ~3.1 s at x4, and `seasonal()` recoloured every tree separately). Fixes, output pixel-for-pixel identical (checksum of all 537 tile frames): noise corner values are cached (`lattice` in tiles.js), season looks are made once per kind of piece, and the tiles are now drawn in slices (`tileSlices`) in idle moments after the museum appears (`warmTiles`, only while nobody touches the screen). Before to after: museum to island 12.2 s to 2.1 s, island to far isle 1.5 s to 0.8 s, first scene about the same (3.2 s: network and Phaser). Also: modulepreload links for the game chunk and Phaser, Phaser's own audio switched off (`audio.noAudio`; every sound is `music.js`). (The title card in `index.html`, `#boot`, is the UI chat's.) Not done, on purpose: map JSON is ~190 KB raw and parses in a few ms, so lazy-loading it would add risk for nothing; character and tile art is drawn in code (there are no sprite files to atlas, and the builder's pieces already come as sheets).
- Tests: `node tests/interact.cjs` (rules and details), `node tests/qa-interactions.cjs` (plays through every kind of interaction and checks the target, the bubble's tail, and that input is never left stuck).
- **Little scenes** (`src/vignettes.js`): on the home islands, by day: a groundskeeper whose chore follows the season (rake leaves, shovel snow, water flowers, sweep sand) with breaks and a gust that scatters the pile, three kids running circles and stopping dizzy, a painter whose canvas fills up, a kid with a kite on a clear day, someone sweeping the museum porch, someone reading on a bench, a dog chasing its tail, someone dozing under a tree, a jogger running laps (`src/vignettes2.js`); in spring and summer the groundskeeper waters the flowers. They are `islanders` with a `script` (see `moveIslanders`), placed by `findSpot` on plain lawn in front of the museum, seeded by the date. Add one = a class with `update(dt)` and a few lines in `buildVignettes`.

### Progression and retention layer (docs/PROGRESSION.md)
- **Read `docs/PROGRESSION.md` first**: it maps every part of the spec to code, logs the conflicts with VISION.md, and holds the tuning tables and sim results.
- Code is `src/progression/` (pure, Node-safe modules + `ui/` for the screens). **Gameplay only emits events** on the bus (`bus.js`); `service.js` + the modules in `modules.js` route them to rank, skills, journal, tasks, friendship, economy and telemetry. Never call XP or journal code directly from a scene.
- **All tuning numbers live in `src/progression/config.js`**; content is data in `src/progression/data/` (ranks, skills, rods, baits, shop ladder, regions, legends, NPCs, gifts, tasks, events, monthly, cosmetics) and the fish in `src/collections/data/fish*.js` (72 species: 60 plus 12 festival fish).
- Save: one versioned key `curation.progress` (`store.js`, with migrations). Time is `clock.js` (day turns at 4:00, never runs backwards). Randomness is `rng.js` (seeded).
- Rewards go through one `RewardQueue` (`rewardqueue.js`); `ui/juice.js` draws them; `index.js` holds it while a dialogue, menu, catch card or the reel is open.
- Tests: `node tests/progression.cjs` (headless), `progression-content` (validator), `progression-ui` (browser), `progression-sim` (acceptance targets). Tools: `node tools/validate_progression.mjs`, `node tools/sim_progression.mjs --hours 150 --runs 3 --csv out.csv`, `node tools/telemetry_report.mjs events.json`.
- Dev panel: open the game with `?debug=1`.
- Things the old code did that changed: fishing is now the cast, wait, "!" and reel minigame; the museum's rarity scale has 5 tiers (Epic added); the daily reset is 4:00; boats are bought (rank, then gold); locked islands show in the boat menu (expedition tests were updated).

### The user's 29 Oct feedback (PRs #201 and next)
- **No emojis anywhere in the UI, ever.** Use a pixel icon from `src/ui/icons.js` (`uiIcon('lock', 's')`) or words. Collection and skill `icon` fields are icon names now. Check with a scan for `\p{Extended_Pictographic}` before shipping.
- **Non-urgent popups live in the top third and stay small** (reward cards `#prog-card`, "Row out?", the conversation box). Only big moments (rank-up) take the middle.
- **Talking:** the conversation box (`src/dialogue.js`) opens with the topics already up, sits at the top, never pauses, and ends when you walk away (`TALK_LEAVE` in RoomScene, `leave` option in `runDialogue`). Speech bubbles (`src/talk.js`) sit just above the higher head, follow the speaker every frame (`followSpeaker`) and close when you leave; they never cover a character.
- **Rowing** (`src/rowing.js`): walk into open water, say Row, and you row anywhere on that island's water; row into land to climb out. Off on expedition islands (their puzzles). Fishing works from the boat.
- **Your own boat, from Rank 1** (user, 30 Oct, asked many times): two kinds of boat. The **boats at the dock** ("Sail") take you to other islands. **Your own one-person rowboat** (`Rowing.placeBoat` / `moorAt` / `boardMoored` in `src/rowing.js`) is tied up on the water by the shore near the dock on every island (near the door if there is no dock); Interact says **Hop in**, you row anywhere, and when you climb out it stays where you left it (per island, this session). Walking into water still asks "Row out?" and your boat comes to you. Never lock it behind rank or gold. You **sit** in it (legs cropped, `SEAT_CROP`). Ground you can walk on is never water for the boat, and climbing out looks up to 100px ahead (past the surf) and a little to each side, so no shore traps you; check with a scan of every island's shoreline if you change `wet()` or `leave()`.
- **Indoor lighting** (user, 30 Oct): rooms are lit overhead, so night only dims them a little (`INDOOR` floor in `src/lighting.js`). Don't bring back the dark blue night indoors. Islands keep the full day and night.
- **Break room** (user, 30 Oct): its doorway is a mat you walk out of (like the entrance's front doors, `checkArches`), and at least three staff are always on break there (guard, barista, janitor fill in for anyone you haven't hired).
- **Speech bubbles** size themselves from `offsetWidth/Height` every frame (not `getBoundingClientRect`, which the pop-in scale shrank and cut the words off); they grow to fit the words.
- **Caves**: brown `cave` (tiles.js) and grey `gcliff_cave` (cliffkit.js, the grey cliffs' rock), both under the Caves heading in the builder.
- **Character:** color rows follow what the outfit draws (`personRows`); outfits with no shirt or trim get a second color (`ACCENT_OUTFITS`, letter `u`, drawn only when `look.second`); "pick your own" is the in-game wheel in `src/colorwheel.js`. Bubbles and lily pads can only sit on water (game and builder).

### Progression evidence (Chat 18: `docs/progression/`, `src/measure/`)
- **Read `docs/progression/REPORT.md` before building or tuning any progression feature.** It measures the build as it is (with the progression layer), models it by playing the layer's own code (`models/montecarlo.mjs`), and pre-registers the tests a design must pass (`hypotheses.md`).
- **Every save and every bus event is logged:** `onSave` in `src/storage.js` feeds `src/measure/derive.js`; `src/measure/layer.js` copies the progression layer's bus events; both land in one log on the phone (`curation.evlog`, `src/measure/events.js`, each type with a kind: novelty, progress, meter, payout). New systems get measured for free; `?evlog` shows a panel to copy or share the log. Only `flags.js` is in the main bundle (`src/measure/boot.js`); the log loads as its own chunk a moment after boot.
- **Build flags:** `?progression=off` is the strip test (the layer's rank, goals, payouts, daily layer, unlock pacing and cards go quiet, and the older goals and dailies too; saved per phone, `?progression=on` clears); `?flags=-rank`, `-daily`, `-goals`, `-unlocks`, `-payouts`, `-fanfare`, `-variants` switch one system. The hooks are one guarded line each (listed in TODO.md under Chat 18) and do nothing without a link.
- **Telemetry** (`src/measure/telemetry.js`) is off for everyone until a PostHog key is filled in, and then only for beta players who say yes (`?beta=1`). Models: `python3 docs/progression/run_all.py`. Test: `node tests/measure.cjs` (in `npm test`).

### Aesthetics audit (29 Oct 2026)
- `docs/AESTHETICS-AUDIT.md`: 860 visual flaws found for the overhaul (none fixed; a second pass covered main up to #195), with the cross-cutting problems, quick bugs that look like art problems, and a redesign order. Per-area detail with code locations and screenshots in `docs/aesthetics/` (people, terrain/water, structures, interiors, creatures/items, ui). IDs P-, T-, S-, R-, C-, U-.
- Read it before redrawing anything: it says what each sprite should become (e.g. P-23/P-24 glasses, S-45 scarecrow, S-51 fountain statues).

### Gotchas we hit
- **Phaser reuses the previous scene data** if you call `scene.start('island')` with no data.
  Always pass data explicitly, e.g. `{ map: 'main' }`. Leaving the museum once dropped you on
  Island One because of this.
- **IslandScene is reused between visits.** Reset per-visit state in `create()`.
- **Playwright `page.evaluate`:** never return Phaser objects. For example
  `setPosition()` and `scene.start()` return huge objects and crash the run with
  ERR_STRING_TOO_LONG. Wrap calls in `{ ...; }`.
- **iOS Safari ignores `user-scalable=no`.** Use `touch-action` instead.

### Columns from around the world (`src/columns.js`)
- 31 designs drawn in code (Greek, Roman, Egyptian, Persian, Minoan, Indian, Khmer, Chinese, Japanese, Maya, Toltec, Yoruba, Haida, Norse, Byzantine, Gothic, Nasrid, Baroque, Art Deco...), each with a short true fact. `paintColumn(id, W, H)` gives RGBA at any size; no Phaser, so Node can call it.
- Customize → **Columns** (rooms with columns: main hall, atrium, shaped rooms) picks the design per room (`decor.column`, default Corinthian); themes set one too. The toolkit has a **Columns** tab with each as a 1×1 free-standing item (`column_<id>`). Dev preview: art.html → Columns.
- Main hall columns are 34 px wide (were 22) and still end under the railing; the newels keep the old small post.

### People sprites (Chat 17: `src/people/`, plan in `docs/PEOPLE-SPRITES.md`)
- **Parts** (`src/people/parts.js`, merged into the menus in `art.js`): 49 more hats, 17 hairstyles, 7 facial hair, 6 glasses, 45 outfits, 18 accessories, legs (shorts, rolled, tall boots, peg leg), bare feet, 4 builds, 113 things to carry, 40 things to set down, a parrot, gull or wings on the shoulders, and 114 two-frame work poses (instruments, dance, crafts, magic too) (`<prefix>_pose_0/1`; kneeling ones too). They draw after the first looks, so **old looks are pixel-identical**; `personRows(view, look, frame)` and `poseRows(look)` in `art.js` give the rows. The creator offers them too (Build, Legs, Feet, Hat trim).
- **Classes** (`src/people/classes.js`, data): 209 jobs in 471 variants (cleaning & grounds, builders & trades, sea & shore, dig & expedition, museum jobs, visitors & townsfolk, food & market, arts & performance, science & medicine, artisans & makers, through history, fantasy & seasonal), each a builder piece `t:npc_<class>_<variant>` in the People lists. `personFor(id, seed)` rolls skin, hair, build and the class colors per person; a variant with a pose or a thing set down stays put and works, the rest wander. On islands they loop their pose, look up at you to chat, and talk with their job title and own lines. Previews draw one frame lazily (the game never builds them; the builder reads a piece's picture only when it draws it, so its start time is unchanged).
- **Crews** (`src/people/crews.js`, data): 10 groups of 4 or 5 (dock, building site, museum staff, dig camp, market, school trip, film set, pirate cove, frozen camp, beach day). Each is one builder piece `t:crew_<id>` in People: Crews; on an island it places every member where they stand in the piece.
- **Wardrobe** (`src/people/wardrobe.js`): what the curator wears. Customize → Character has every hat and outfit, a **Costume** group (51 whole costumes taken from the classes: mummy, ghost, knight, pharaoh, wizard, Santa, mascot...), **Hold** (30 things) and **On the shoulder** (parrot, gull, wings). `curatorLook(character, worn)` builds the sprite in rooms, on islands and in the iso room, so it looks the same everywhere. The progression shop's hats and outfits have a `look` in `src/progression/data/cosmetics.json` and are drawn into the sprite (no more flat hat or tint), indoors too.
- **Locks for quests:** nothing is locked yet. To lock something, add it to `LOCKED` in `wardrobe.js` with the hint to show (`'costume:mummy': 'Finish the tomb quest'`); ids are `costume:`, `hat:`, `outfit:`, `hold:` and `shoulder:` plus the part id. The creator shows it greyed with a lock and the hint. The quest calls `unlockLook('costume:mummy')` (in the page: `window.__wardrobe.unlockLook`), which is saved. Test: `node tests/wardrobe.cjs`.
- **In the game** (`src/people/placement.js`): a plain person piece (Stays put / Wanders) on any island dresses as a townsperson with a job, picked by where it stands (sand: swimmers, surfers, beachcombers; grass: commuters, gardeners, joggers, kids...; an expedition island: its own people, like pirates on Skull Isle). They keep the piece's wandering and a visitor's way of talking (`townsperson` returns the class to wear and a kind: kids talk like kids, teenagers like students, grandparents like elders), so a tap opens a real conversation. The museum's staff wear their jobs (`STAFF_WEAR`, `BREAK_WEAR`; RoomScene loops a staff member's pose), and the named friends dress for their role (`wears` in `src/progression/data/npcs.json`), keeping their kind's names and talk. Edmund and the visitors keep their looks. Test: `node tests/people-in-game.cjs`.
- Period dress (Through history) follows a museum object per outfit, named in a comment above each class (the Met, the Rijksmuseum, the V&A, Oslo's Museum of Cultural History). East Asia, South Asia, Mesoamerica and the genie are parked in TODO's Needs Sean.
- Gallery: `art.html` → People. Test: `node tests/people-sprites.cjs` (in `npm test`). The builder hides groups with "on " in the name, so group labels must avoid it. Class names must be unique: a second `painter:` silently replaces the first (the test checks).

### Art swap and placeholder list (Chat 15)
- **Drop-in swap:** a PNG with the same name as a placeholder, put in `public/swap/` (`tiles/<name>.png`, `sprites/<name>.png`, `pieces/<group>/<n>.png`), overrides it with no code change. See `public/swap/README.md`. Code: `src/swap.js`; `vite.config.js` writes `swap/index.json`; `src/boot.js` waits for it before the game starts. A wrong-size file is ignored with a console warning.
- **Placeholder list:** `node tools/list_placeholders.mjs` (add `--md` to rewrite `docs/PLACEHOLDERS.md`) lists every tile, room sprite and builder piece by name, size and where it's used, and marks swapped ones. Needs playwright (`PW=` path).

### Asset hunt round 3 (Chat 15)
- `docs/ASSETS.md` "Round 3": 30 OpenGameArt packs (licences read on each page) saved in `assets/vendor/<dir>/` with a `SOURCE.txt`, a ranked top 20, itch.io links to download by hand, and the gaps still open (display cases, plinths, glass walls, dig-site tools). `tools/fetch_oga.sh` downloads a pack. None are in the game yet.

## 4. Tests

The preview server must run first (it dies between turns):

`npm run build && nohup npx vite preview --port 4173 --base / --strictPort &`

| Test | Command | Last result |
|---|---|---|
| Smoke | `node tests/smoke.cjs` | "All good" |
| Gaps | `node tests/gaps.cjs` | "No gaps in 60 room shapes" |
| Playtest | `PW=/opt/node-tools/node_modules/playwright OUT=<dir> node tests/playtest.cjs` | 38/38, with screenshots (see `docs/PLAYTEST.md`) |
| Content | `node tests/content.cjs` | All good (fixtures only; adapters untested live) |
| Collections | `PW=/opt/node-tools/node_modules/playwright OUT=<dir> node tests/collections.cjs` | All good (schema, migration, corrupt codex, journal tabs, Minerals, viewer, set claim, a real catch) |

Smoke and playtest go out onto Main Island first, then switch to Island One for fishing and
the cottage.

## 5. What's next (the user's wishes, in rough order)

See `docs/ASSET-HUNT.md` (the "super dig" prompt plus the to-do list) and `docs/BACKLOG.md`.

1. **Asset dig.** The user feels much is missing.
   - Rocks are too round and the statues are weak; they want more items to build with (Pokémon /
     Webkinz / Club Penguin / PewDiePie Tuber Simulator variety).
   - Run the prompt in ASSET-HUNT.md, rank the packs and download the free ones.
2. **Rotatable items as one piece.** The four views of a chair become one item with a ⟳ badge;
   tap to turn it.
3. **Grass that blends** into paths, dirt, sand and stone (autotile edges).
4. **Museum shapes that aren't square:**
   - glass walls, curved walls, sharp angles, domes
   - open plan, plus small quiet rooms
   - this needs a design pass with the user
5. **Museum exterior re-texture** (look to be given), then a **menu redesign** later.
6. **Bigger systems that fit VISION.md** (they now sit on the collection format):
   - an aquarium for caught fish
   - dig sites to excavate bones
   - restoring paintings
   - collections with display cases

   No silly mini-games; real discovery and preservation.
7. Seasonal recolouring turns the user's cherry trees orange in autumn. This is expected, but
   be ready to exempt cherry trees if they ask.

### Chat 11 (atmosphere, seasons, audio)
- Seasons already existed (`src/weather.js`, `seasonFrames` in `src/scenery.js`). Cherry trees now stay pink in autumn: no recolour and no swap to the maple tile.
### Chat 9: rooms
- Two new shaped plans in `src/shaped.js`: `lhall` (L-shaped hall) and `corner` (its mirror). They join the end of the shaped row, so old saves get them via `withShaped` and built rooms move back two places. `tests/gaps.cjs` and `tests/smoke.cjs` now count 7 shaped rooms (3 to 9) and built rooms start at index 10.

- `holiday()` in `src/weather.js` (real calendar; `?holiday=halloween|winter|none` pins it). Halloween: pumpkins by the museum doors (`holidayDecor` in IslandScene), kids and some students in witch / ghost / pumpkin costumes (`visitorLook`). Winter: woolly hats.
- Room presets (`src/presets.js`, `tests/presets.cjs`): Customize > This room > Saved layouts saves a room's decor and items under a name and loads them into any room. Loading sells what is there and buys the preset's items at normal prices, so layouts are not free items.

## Chat 8: collections, codex, journal, shop
- **New data collections** (stamps, armour, insects, ship models, glass flowers, timekeepers, inventions): `src/collections/data/*.js`, pixel art drawn by the helpers in `data/_px.js` (`pack()`, `draw()`, `sym()`), all placeholder art. Famous visitors are a collection too (`data/visitors.js`, `people: true`, so "Collect one of everything" skips them); their picture comes from the `visitor` renderer registered in `journal.js`, fed by `portraitCanvas` in RoomScene.
- **Codex tab** (`milestones.js`, `codextab.js`): overall %, milestones 10/25/50/75/100% that pay once (`claimed['milestone-N']`), and ever-collected vs held-now per collection. **Artist sets** (`artistsets.js`) are made from the paintings (any artist with 2+), pay 100 gold per painting, and are journal goals only: `sets()` leaves them out unless you pass `true`, so they never become display bonuses.
- **Shop** (`shop.js`, `shoptab.js`, Shop tab): sell for 50%, buy back after 7 days at 75% of price, a Gallery Shop of 3 to 5 pieces seeded by the date (150% of price, one of a kind: owned pieces can't be bought). The codex got a `sold` ledger (additive, repaired by `normalize`). Money is passed in, so tests run it in Node with an in-memory save. Paintings have nothing to sell until their collection is `'earned'` (Needs Sean).
- **Journal polish** (`tab.js`): search and filter chips (hide cells in place), NEW marks (`curation.journalSeen`, cleared when you leave the tab) with a dot on tabs that have something new, and your stars and notes shown on tiles. `normalize` now clamps `dirty` to what you own (a test from the digging chat was failing on it).
- Weather shades the light: `overcast()` in `src/lighting.js` (rain greyer, snow brighter), used by rooms and islands. `stormRumble(scene, kind)` in `src/weather.js` = thunder (`sfx('thunder')`, generated noise) plus a faint flash on some rainy days.
- Themed rooms (`roomTheme` in `src/wallet.js`): 3+ paintings all from one era earn 1.5x; Customize > Rating says so. "Section" is read as the painting's `era`.

## Digging v2 (Chat 6)
- **Dig kinds** live in `src/dig.js` (`DIG_KINDS`, `DIG_TILES`): a builder tile maps to a kind, a kind maps to collections. mineral, fossil, ruin (pottery, coins, stone tools), shore (shells), crater (meteorites). To add a kind: a data collection, one line in `DIG_KINDS`, one tile in `src/tiles.js` (group "Dig sites"), one line in `DIG_TILES`.
- **Dirty finds:** entries flagged `dirty: true` (pottery, coins, stone tools, meteorites, skeletons) arrive dirty through Chat 4's contract (`collect` handles the flag); nothing extra is needed in `src/dig.js`.
- Journal tabs now wrap to two rows (12 tabs). `tests/dig.cjs` needs the dev server (`npx vite --port 5173`, `URL=http://localhost:5173/`).
- **Dig tools** (`TOOLS` in `src/dig.js`): brush (the plain odds, slow), trowel (wider, rare finds a little less likely), pick (widest, rare finds less likely): speed costs a little luck, so the old odds are unchanged. Earned: trowel after 6 different dug finds, pick after 16 (counted from the codex, no new save). The row stays hidden until the trowel is earned.
- **Big finds** use `parts: n` on an entry (T. rex 6, Triceratops 4): each fossil-spot dig that rolls one adds a piece (`curation.digparts`); the entry reaches the codex, dirty, on the last piece. They are `display: ['floor','plinth']` and in no set, for Chat 5 to assemble.
- **Sites:** touching dig tiles of one kind (`dig_cliff` fossils, `dig_trench` ruins, or any mix of spots) form a site (`siteOf` in `src/dig.js`). With 3 or more tiles, digging every one inside a rest period triggers `IslandScene.bonusDig`: a rare find (rarity 3+ or a skeleton piece). The bonus has its own `site:<key>` rest timer.
- Daily rhythm: `crowdShift(hour, weather)` in weather.js sets how many visitors a room starts with (only when day/night is on). A swan glides on the pond (`updateSwan` in critters.js). `Lighting.watchSpeed` auto-drops High to Low for the visit on slow phones; the saved setting is untouched.
- **Puzzles** (`src/puzzles.js`, data in `src/puzzles-data.js`): `IslandScene.placeMapPieces` hands each tile to `puzzles.piece()`. Boulder (push) slides when you walk into it (Interact beside it puts it back); plate, lever, gate (a gate belongs to every plate, lever and riddler within 8 tiles of it, chained; it opens for good once all are done); `rock_crack` needs the pick (16 finds); `ice` ground tiles slide you; `fog` clears for good (`curation.fog`); `riddler` asks a riddle picked by its position, a right answer opens a dig patch (ruin finds), a wrong one costs nothing. Everything resets on reload except fog. Mazes are just hedges: build them.
- **Puzzle yard**: `node tools/puzzle_yard.mjs` writes `content/maps/puzzle-yard.json` (one of every puzzle piece and dig site). `tests/puzzles.cjs` runs it via `scene.start('island', { mapData })`; it is not in the boat. Import it in the builder to play with it.
- Outdoor ambience now also has `'birds'` (day, fair weather) and `'crickets'` (night) in `setAmbience` (music.js): random generated chirps on a timer, no audio files.
- **Hunts** (`src/puzzles-hunt.js`, run by Puzzles): metal detector earned at 10 different dug finds (a badge: Cold, Cool, Warm, Hot, Right here; three things buried per island per day, seeded by date; press Dig on the spot); torn map pieces (`map:*`, from ruin spots, no journal tab) make every `x_mark` tile appear, dig it for a rare find and the pieces are used up. **Main Island and Island One each already hold one `x_mark` tile; it is now hidden until the map is whole** (the map files are untouched). Dug spots show minutes left when you are near. Daily dig goal: 3 digs a day pays 120 gold once (`curation.digdaily`; `DAILY_GOAL`, `DAILY_GOLD` in `src/dig.js`); nothing is lost by skipping.
- **Save keys per island:** builder and friends' islands all load with `mapId` 'test', so `mapKey(scene)` in `src/dig.js` names them `isle:<map name>` for dig rests, fog, riddles, the X and buried things. Focus objects can carry a `label` (the Interact button shows it: Pull, Talk, Smash, Dig). Expedition islands were checked: Frozen North is fully reachable with ice sliding, and the Badlands boulders are pushable (Interact puts one back).
