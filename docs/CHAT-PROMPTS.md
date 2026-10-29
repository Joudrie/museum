# Chat prompts (paste one into each new chat)
Each chat has a lane in `docs/TODO.md`. The number is the priority (1 first). Paste the block for the chat you are starting.

## Chat 1: Content and images

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 1 (Content and images). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Setup: set CONTENT_CONTACT=curation-content-tool. Test the museum hosts with curl first (collectionapi.metmuseum.org, openaccess-api.clevelandart.org, commons.wikimedia.org, upload.wikimedia.org, thumb.wikimedia.org). If one is refused, say which and skip that part. Never get around the proxy. api.artic.edu is behind a Cloudflare bot challenge: leave it alone.
Rules: host our own copies of the 49 paintings (same image, 1280px, under about 500 KB, in public/paintings/); never swap a painting for a different work. Replacements for the broken or wrong-shaped ones go in content/image-proposals.md only, for me to approve. Every blurb and fact needs the museum's exact quoted sentence (docs/CONTENT-STYLE.md); no quote, no claim. Every draft stays "draft"; don't approve or publish anything I haven't approved.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 2: Builder and ground tools

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 2 (Builder and ground tools). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: never lose a user's work (keep autosave and the vault paths intact, and test crash and reload). Turn families in public/builder/rotations.json must be verified by eye one by one, never auto-grouped (colour variants are not sides of one object). Keep every ground type, path block and furniture piece a named, placeable item so I can redraw them one at a time. Touch src/IslandScene.js and src/tiles.js only with small additive edits.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 3: Quality, performance and polish

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 3 (Quality, performance and polish). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: find the real cause of the flaky playtest and the smoke "cottage door" failure (a race, a timing assumption, a network image); don't just add retries. Measure phone performance (FPS on huge islands, many NPCs, lighting) and write the numbers and budgets in docs/HANDOFF.md before fixing. Add a CI check that runs content, collections and gaps on every PR. Don't change how anything looks. Menu and collection-screen redesigns wait for me.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 4: Restoration and provenance

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 4 (Restoration and provenance). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: finds and paintings arrive dirty or damaged and are cleaned by hand (rub grime off the real HD image with a before/after reveal; fossil prep; pottery reassembly). Real paintings stay perfect everywhere else, and everything already in the game keeps working. Failure is gentle, never punishing. Document the `dirty: true` contract in docs/HANDOFF.md so chats 6 and 7 can hand you dirty finds and chat 5 can display restored ones. Not a throwaway mini-game: it must feel like the payoff of discovery (VISION #7).

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 5: Display, exhibits and the aquarium

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 5 (Display, exhibits and the aquarium). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: collection entries already say how they display (wall, case, plinth); build the cases, plinths, specimen shelves, easels and tanks that place them in rooms. The aquarium uses the existing fish log. Don't change how paintings hang on walls today. Displayed pieces earn and count toward room rating. Re-run tests/gaps.cjs if you touch rooms.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 6: Digging v2 and puzzle mechanics

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 6 (Digging v2 and puzzle mechanics). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: build on src/dig.js and the fossils and minerals data files; new finds are data collections like src/collections/data/fossils.js. Finds that need cleaning set `dirty: true` (see chat 4's contract in docs/HANDOFF.md once it exists). Puzzle pieces must be placeable in the builder (tiles in src/tiles.js) and work at runtime. Earned, not bought; no throwaway mini-games.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 7: Expeditions, leads and expedition islands

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 7 (Expeditions, leads and expedition islands). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: islands are map files in src/maps (the builder format); never edit Main Island (src/maps/main-island.json) and keep Island One's museum doors locked. Each level can be a slow puzzle, a chase with light parkour, a dig, or a mix; failing is gentle (retry). Finds come home dirty for chat 4 and then go to display (chat 5), and the plaque says where they were found. Leads (letters, torn maps, rumours from famous visitors) start each trip.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 8: Collections, codex, journal and the shop

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 8 (Collections, codex, journal and the shop). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: new collections are data (src/collections/data/, or CSV via tools/import_collection.mjs); never break old saves (the codex is versioned; add migrations and test corrupt saves). Sell for 50%, buy-back after a one-week cooldown at a premium, and a Gallery Shop with 3 to 5 rotating paintings. Crates, gems and ads are ON HOLD: don't build them. Keep tests/collections.cjs updated for new counts.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 9: Rooms and the museum building

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 9 (Rooms and the museum building). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: the non-square rooms item is BLOCKED until I give a design: do every other item first and leave that one. No black gaps between walls, ever: run tests/gaps.cjs for every room shape, the entrance and the main hall before each merge. Keep the entrance and main hall exactly as CLAUDE.md describes. src/RoomScene.js is shared: small additive edits and pull main right before pushing.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 10: People, story and events

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 10 (People, story and events). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: period-accurate, warm, specific dialogue; facts must be true and sourced (follow docs/CONTENT-STYLE.md, including its section on sensitive subjects). The Gardner heist is a story arc built on real, quoted facts. Famous visitors send the player to expeditions (chat 7); leave a clean hook for that. Semi-mythological visitors and mini-games are ON HOLD.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 11: Atmosphere, seasons and audio

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 11 (Atmosphere, seasons and audio). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: seasons follow the real calendar; keep my cherry trees pink in autumn if the recolouring touches them. Music and sound stay generated (no audio files). Protect phone performance (High / Low / Off lighting already exist; measure before and after). Don't change how the art looks beyond tinting and effects.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 12: Economy, staff and services

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 12 (Economy, staff and services). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: earned, not bought. Gems, ads, cosmetics, the exhibition pass and crates are ON HOLD: don't build them. For items that need my input (break-room upgrade effects, level costs), pick sensible defaults, make them easy to change in one data file, and list the defaults under Needs Sean.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 13: Share, visit and retention

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 13 (Share, visit and retention). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: no server. Sharing is by link or file, and visiting a friend is asynchronous. The builder's map format is already shareable. No personal data in anything shared. Daily wheel, streaks and first-game-of-the-day bonuses must stay gentle (no guilt mechanics). Auctions and co-op are ON HOLD.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 14: Halls

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 14 (Halls). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: this chat depends on chats 5 (display), 8 (collections) and 9 (rooms). Check the board for what has merged. Start with what doesn't need them: each hall as a themed room preset (JSON in content/halls/) plus its decor list and which collections and sets belong there, with a loader that applies a preset to a room. Facts in any hall must be true and quoted (docs/CONTENT-STYLE.md). Don't change the entrance or the main hall.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```

## Chat 15: Asset hunt and art swap support

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md and docs/TODO.md. You are CHAT 15 (Asset hunt and art swap support). Claim it on the board with a one-line PR and merge it, then work through every item in your section, in order. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Rules: run the super dig in docs/ASSET-HUNT.md. Find, don't make. Only CC0, CC-BY, CC-BY-SA, OGA-BY or GPL, never non-commercial; record author, link and licence for every pack. Check network access first and don't get around bot checks; list itch.io links for me to download by hand. I am redrawing all the sprites myself, so this is placeholder support only: a script that lists every placeholder sprite by name, size and use, and a drop-in swap (a PNG with the same name overrides the placeholder, no code change). Don't continue docs/ART-AUDIT.md, ART-BIBLE.md or ART-BRIEF.md.

Ship small PRs, merge each yourself, and reset your branch to main after each. Tick items in docs/TODO.md with the PR number and add 2 to 4 lines to docs/HANDOFF.md. Test in a 390x844 portrait browser and run tests/content.cjs, smoke, gaps and collections (the playtest and the smoke "cottage door" check are flaky on a plain main: re-run before blaming your change). Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```
