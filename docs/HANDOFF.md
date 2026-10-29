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

### Content pipeline (`docs/CONTENT.md`, `docs/CONTENT-STYLE.md`): real art in, with a person approving
- `tools/sources/` has one adapter per museum (Met, AIC, Cleveland, Smithsonian, Rijksmuseum, Commons):
  public-domain / CC0 only, cached, rate-limited. **They have never run against a live API**: the build
  sandbox blocks every museum host, so they follow the documented shapes and tests use hand-written fixtures.
  Allow the hosts listed in `docs/CONTENT.md`, then expect small fixes (Smithsonian and Rijksmuseum most).
- Flow: `build_batch.mjs` → drafts in `content/review/<collection>/` → `review_report.mjs` → a person sets
  `"status": "approved"` → `publish_content.mjs` writes the data file and `CREDITS.md`.
  Every blurb and fact is a claim with the museum's exact sentence quoted; unsourced claims, invented numbers,
  filler, duplicates and missing licenses are flagged. The Met has no description text, so its drafts need a hook written.
- `check_images.mjs` flags broken, tiny, heavy and wrong-shaped images for every painting. **Not run yet on the
  49 paintings** (no network here); `content/batches/first-batch.json` (12 works, 9+ regions) is waiting to be built.
- Test: `node tests/content.cjs` (no browser, no network).

### Expeditions (chat 7): leads, boat scene, seven islands
- **Leads** (`src/leads.js`): letters, torn maps, notes and rumours, kept in `curation.leads`. The first (a bottle note) turns up when you first open the boat menu; finishing an island hands out the next (`then`). The boat menu only lists an expedition island once a lead points at it, and has a **Letters & leads** entry with a "Set sail" button per lead. Add a lead = one entry in `LEADS`.
- **Islands** are `src/maps/exp-<id>.json` (builder format) with an `expedition` block: `spots` (note, dig, chest, crate, plate, gate, lever), `patrols`, `clock`, `goals`. `src/expedition.js` runs it (auto-loads every `exp-*.json`). `tools/gen_expeditions.mjs` drew the seven first drafts (Skull Isle, Drowned Reef, Sandstone Tomb, Red Badlands, Lost Temple, Thieves' Rock, Frozen North); repaint them in the builder but keep the block. Failing is gentle: caught or washed out puts you back at the boat, finds and flags stay.
- **Finds come home dirty**: they wait in `crate()`; `cleaned(id)` moves one into the codex; `foundAt(id)` says where. No `src/restore.js` yet, so they are washed automatically when you reach a home island.
- Test: `PW=... OUT=<dir> node tests/expedition.cjs` (a whole trip on Skull Isle, and every island's spots are reachable from the boat).

### Wakefield, MA is NOT part of the game
A separate personal project (the user's hometown, for friends) that only shares the engine. Its page is `wakefield.html`, its code
`src/wakefield/`, its notes `docs/WAKEFIELD.md`. Never add it to the game. Engine improvements made along the way and kept in the
game: the builder cap is 700 (New map boxes stay 300), big builder maps save their tiles packed (`src/mapformat.js`), and the
island scene streams ground chunks around the player.

### Gotchas we hit
- **Phaser reuses the previous scene data** if you call `scene.start('island')` with no data.
  Always pass data explicitly, e.g. `{ map: 'main' }`. Leaving the museum once dropped you on
  Island One because of this.
- **IslandScene is reused between visits.** Reset per-visit state in `create()`.
- **Playwright `page.evaluate`:** never return Phaser objects. For example
  `setPosition()` and `scene.start()` return huge objects and crash the run with
  ERR_STRING_TOO_LONG. Wrap calls in `{ ...; }`.
- **iOS Safari ignores `user-scalable=no`.** Use `touch-action` instead.

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
