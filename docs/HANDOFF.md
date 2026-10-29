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
- **The boat** ("Sail" at a rowboat) opens a "Where to?" picker (`src/sailmenu.js`). It lists
  Main Island, Island One, the far isle, and every island saved in the builder on this phone.
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
- `src/daily.js` is the gift icon under the journal: welcome gift, one wheel spin a day, Painting of the Day (same for everyone, stepped through `PAINTINGS`). Gentle: a streak survives up to 3 missed days and never nags. Numbers sit at the top of the file.
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

### Economy and staff (Chat 12)
- **Every economy number lives in `src/economy.js`** (office level costs, janitor/guide prices, upgrades, offline cap, visitor formula, camera price, robbery odds). Change a default there only.
- Break-room staff board has three upgrades (`UPGRADES`): Better mops (slower mess), Guide training (more % per guide), Carpenter's toolbox (cheaper rooms). Levels saved in `curation.upgrades`; read with `upgradeValue(id)` in `src/staff.js`.

- Gold piles cap at 8 h per spot: welcome-back toast after 20+ min away, a FULL flag per room in the income menu. "Collect all" no longer shows an ad (ads are on hold); it keeps `COLLECT_ALL_FEE` (15%).

- Security is a tier (`curation.cameras`, old `true` = tier 2). The guard sells the next tier; each tier has a `stop` chance for the rare robbery, and camera tiers turn a stopped robbery into a "thief caught" bounty.

- Services items (toolkit → Services, max 1 each): gift shop (gold per hung painting, doubled per rarity step), food court and discovery table (scale with visitors), lecture stage (per famous visitor met). Earnings logic: `serviceGold()` in `src/wallet.js`, numbers in `SERVICES`. Their art is placeholder, in `bakeItem` in `src/art.js`.

### Gotchas we hit
- **Phaser reuses the previous scene data** if you call `scene.start('island')` with no data.
  Always pass data explicitly, e.g. `{ map: 'main' }`. Leaving the museum once dropped you on
  Island One because of this.
- **IslandScene is reused between visits.** Reset per-visit state in `create()`.
- **Playwright `page.evaluate`:** never return Phaser objects. For example
  `setPosition()` and `scene.start()` return huge objects and crash the run with
  ERR_STRING_TOO_LONG. Wrap calls in `{ ...; }`.
- **iOS Safari ignores `user-scalable=no`.** Use `touch-action` instead.

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
- **Dig tools** (`TOOLS` in `src/dig.js`): brush (gentle, rare finds more likely), trowel (wider), pick (widest, favours common). Earned: trowel after 6 different dug finds, pick after 16 (counted from the codex, no new save). The row stays hidden until the trowel is earned.
- **Big finds** use `parts: n` on an entry (T. rex 6, Triceratops 4): each fossil-spot dig that rolls one adds a piece (`curation.digparts`); the entry reaches the codex, dirty, on the last piece. They are `display: ['floor','plinth']` and in no set, for Chat 5 to assemble.
- **Sites:** touching dig tiles of one kind (`dig_cliff` fossils, `dig_trench` ruins, or any mix of spots) form a site (`siteOf` in `src/dig.js`). With 3 or more tiles, digging every one inside a rest period triggers `IslandScene.bonusDig`: a rare find (rarity 3+ or a skeleton piece). The bonus has its own `site:<key>` rest timer.
- **Puzzles** (`src/puzzles.js`, data in `src/puzzles-data.js`): `IslandScene.placeMapPieces` hands each tile to `puzzles.piece()`. Boulder (push) slides when you walk into it (Interact beside it puts it back); plate, lever, gate (a gate belongs to every plate, lever and riddler within 8 tiles of it, chained; it opens for good once all are done); `rock_crack` needs the pick (16 finds); `ice` ground tiles slide you; `fog` clears for good (`curation.fog`); `riddler` asks a riddle picked by its position, a right answer opens a dig patch (ruin finds), a wrong one costs nothing. Everything resets on reload except fog. Mazes are just hedges: build them.
- **Puzzle yard**: `node tools/puzzle_yard.mjs` writes `content/maps/puzzle-yard.json` (one of every puzzle piece and dig site). `tests/puzzles.cjs` runs it via `scene.start('island', { mapData })`; it is not in the boat. Import it in the builder to play with it.
