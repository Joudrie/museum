# Progression and retention layer

This is the design and the map of the progression layer. It **supersedes any earlier progression, goal or
journal-pacing notes** (`src/quests.js` "Goals", `docs/FIRST_SESSION.md` pacing, the Journal overview's
"next goals"). Those still run; this layer sits on top and the Goals tab is now the one place that shows them.

Code lives in `src/progression/`. Tuning numbers live in **one file**: `src/progression/config.js`.
Content is data in `src/progression/data/`. Run `node tools/validate_progression.mjs` (content) and
`node tools/sim_progression.mjs` (tuning). Both are in `npm test`.

---

## 1. Rules of the road

- Gameplay code **only emits** typed events on the bus (`src/progression/bus.js`). It never calls XP, journal or
  task code directly. `ProgressionService` (`service.js`) is the one path that every system obeys.
- Every reward goes through one `RewardQueue`. It holds rewards while a dialogue, a minigame or a menu is open.
- Saves: one versioned key, `curation.progress` (`state.js`), with migrations. Autosaved after every reward.
- Randomness: `rng.js` (seeded, injectable). Time: `clock.js` (injectable, 4:00 local day, rollback detection).
- Absence is never punished: no decay, nothing wilts, streaks drop to the last milestone and never to zero.

## 2. Conflicts with `docs/VISION.md` and the repo's hold list (logged, not decided silently)

| Spec says | Repo says | What I did |
|---|---|---|
| Subscription gates regions (section 17). | VISION 7 "Earned, not bought". Hold list parks "gems, ads, cosmetics, exhibition pass, crates". | The spec is the user's newest word, so cosmetics and the event track are built. **Nothing is ever bought with money except region access.** No premium currency, no random paid rewards, no crates for sale (the spec forbids them too). Region content is still earned by play. Subscription is a flag with no payment code: `src/progression/sub.js`. |
| Catch minigame, kids' race, derby (sections 4, 5, 7, 11). | VISION 7 and the hold list: "no throwaway mini-games". | Fishing is the sanctioned hands-on act (VISION: "catch every aquarium fish yourself"). The reel minigame is part of it and short (4 to 9 s). The race and derby are time-trials of things already in the world (walking, fishing), each a few seconds to a few minutes. No standalone arcade games. |
| "Coins" (section 9). | The currency is **gold** (`src/wallet.js`). | Gold is the coin. UI says "gold". |
| Sinks are real (section 9). | `FREE = true` in `wallet.js`: nothing is charged while testing. | I did not flip the testing flag. Progression purchases (bait, rods, hints, cosmetics) use `payGold()` which always charges, so the economy can be tuned; museum purchases keep the testing flag. |
| Rarity: Common, Uncommon, Rare, **Epic**, Legendary (section 5). | Collections have four tiers (Legendary is 4). | Schema widened to five tiers. Existing rarity-4 entries were moved to 5 (2 entries). CSS `.r4` is Epic purple, `.r5` Legendary gold. |
| Daily reset 4:00 local (section 11). | `daily.js` rolls over at midnight. | `daily.js` now asks `clock.dayKey()` (4:00). Its welcome gift and wheel stay; its streak is replaced by the progression streak. |
| Rank bar, XP pop, "Rank ceremony" (section 3). | Existing `celebrate()` confetti card for big moments. | Rank-up has its own ceremony; `celebrate()` stays for set rewards. Magnitude hierarchy: set rewards are mid-size, ranks bigger. |
| NPC "!" requests, hearts (section 7). | `love.js` is *room* love (fades). `regulars.js` counts talks. | Friendship is new (`friendship.js`), **never decays**. Room love is untouched (it is a different thing). Regulars count feeds first-talk. |
| Tone (cozy, curious). | VISION 6 "short, true, curious facts". | Every species is a real animal with a true blurb. Legendary fish are real giants and rarities (beluga sturgeon, coelacanth, oarfish...). No invented monsters. |
| Seasons: real calendar or monthly rotation (section 13). | `weather.js` follows the real calendar. | **Real calendar.** Predictable, and it is what the repo already does; testers pin it with `?season=`. Events use date windows in `events.json`. |

## 3. Inventory: what exists, and what each section does with it

Reuse = call it as is. Extend = small additive edit. New = new file.

| Spec section | Existing code | Plan |
|---|---|---|
| 0 Inventory | this table | done |
| 1 Pillars | n/a | design rules, checked by the sim ("no stretch over 3 min without a progress tick") |
| 2 Loop map | fishing, dig, talk, sail, expeditions | wire each to the bus (section 6) |
| 3 Rank | none (goals in `quests.js` pay gold) | **New** `rank.js`, ranks data, rested XP, ceremony UI |
| 4 Skills | dig tools unlock by finds count (`dig.js`) | **New** `skills.js`, perks in data, perk hooks read in `fishing.js` / `IslandScene.js` |
| 5 Fishing depth | `fishing.js` (tap on "!"), `collections/data/fish.js` (18 fish + junk + finds), `BOBBERS` | **Extend**: species gain conditions, 42 more species (`fish_more.js`); **New** `fishroll.js` (weights, pity, size, variants, hot spots), `reel.js` (minigame), baits; bobbers kept as the "rod tier" |
| 6 Journal | `journal.js`, `collections/tab.js`, `ui/journalhome.js`, codex `curation.codex` | **Extend**: codex stays the ledger for species; **New** field pages (People, Places, Emotes, Secrets, Titles, Records, Leads) in `ui/fieldjournal.js`, hints, NEW stamp, completion milestones |
| 7 Friendship | `regulars.js`, `chatter.js` gifts (gold/rocks), `famous.js` | **New** `friendship.js`, `requests.js`, NPC roster data, gift reactions via the emote images (`emote_heart` and friends) |
| 8 Gated world | `leads.js`, `puzzles.js` fog tiles, `expedition.js`, sail menu | **New** `world.js` (regions, locks, chunks explored, viewpoints, secrets, sparkles); sail menu shows locks |
| 9 Economy | `wallet.js`, `economy.js`, `collections/shop.js` | **New** `market.js` (baits, rods, hints, cosmetics, rotating stock); price ladder in config |
| 10 Home + aquarium | Chat 5 display fixtures: aquarium, giant tank, plinths (`display.js`) | **Reuse**: the aquarium already shows caught fish; add trophy mounts and cosmetic ownership. A player *house* does not exist, so "home" = the museum's staff quarters unlock (see open questions) |
| 11 Rhythm | `daily.js` (gift, wheel, potd) | **Extend** `daily.js` for 4:00; **New** `tasks.js`, `streak.js` (calendar, shields) |
| 12 Return hooks | `wallet.js` welcome-back toast (offline gold) | **New** `returncards.js`, rested XP in `rank.js` |
| 13 Seasons/events | `weather.js` `season()` and `holiday()` | **Reuse** them; **New** `events.js` + `data/events.json` |
| 14 Juice | `ui.js` `celebrate`, `haptic`, `sfx`, `music.js` | **New** `ui/juice.js`, `ui/rankup.js`, rarity CSS tokens (`--ui-r1..r5`, `--ui-rv`) |
| 15 Goals | `quests.js`, Journal "next goals" | **New** `goals.js`, `ui/goalpill.js`, Goals tab in the Menu hub, stuck detector |
| 16 First hour | `RoomScene.tutorial()` (caretaker) | **New** `firsthour.js` steps ride on the bus (the tutorial is untouched) |
| 17 Subscription | none | **New** `sub.js` entitlement flag, locked docks in the sail menu, paywall moments |
| 18 Architecture | storage.js `load/save` | **New** everything above, plus debug panel |
| 19 Sim | none | **New** `tools/sim_progression.mjs` |
| 20 Telemetry | none | **New** `telemetry.js` (local ring buffer + optional sink; nothing leaves the device) |
| 21 Guardrails | n/a | enforced in code and in the validator (see section 9) |

### Existing systems the layer must not break
Facing resolver, dialogue bubbles (`talk.js`, `dialogue.js`), emotes (`emote_*` textures), conversations (`chatter.js`),
dig, puzzles, expeditions, display, share, builder, save safety (`tests/saves.cjs`), bundle budget (`tests/bundle.cjs`),
perf (`tests/perf.cjs`). Progression adds no per-frame work: it reacts to events and a 1 s timer.

## 4. Core loops (what the code does)

- **Micro (10 to 60 s)**: Fish button, cast, wait, bite "!" (tell varies by rarity), reel minigame, reveal (scaled by
  rarity), `FISH_CAUGHT`, then in order: XP pop, journal stamp if new, skill tick, task tick, coins.
  Talking: `NPC_TALKED`, emote, heart tick. Exploring: `TILE_REVEALED` chunks, region % ticks.
- **Session (10 to 30 min)**: Goals tab (daily tasks, board requests, hot spot), fish, explore, talk, sell, push one page, quit on the "Next time" card.
- **Meta (days to months)**: rank, skills, traversal, legendary trails, friendship, aquarium, seasons.
- **Wiring rule**: every event carries a `source` and goes through `service.js`, so a system that does not connect upward shows up as a dead handler in the validator's coverage table.

## 5. Event bus

Typed events (payload keys are checked in dev): `FISH_CAUGHT {speciesId,size,sizeClass,rarity,variant,spotId,perfect,fresh,personalBest,trophy,region,water,bait}`,
`FISH_ESCAPED {speciesId,sizeClass,rarity}`, `NPC_TALKED {npcId,kind,first}`, `GIFT_GIVEN {npcId,itemId,reaction}`,
`TILE_REVEALED {region,chunk,count}`, `LOCATION_DISCOVERED {region,placeId}`, `SECRET_FOUND {region,secretId}`,
`ITEM_FORAGED {itemId,region}`, `TRAVERSAL_USED {kind,region}`, `PURCHASE {itemId,price,kind}`, `SESSION_START`, `SESSION_END`.
Extras the spec implies: `REQUEST_DONE`, `TASK_DONE`, `HEART_UP`, `RANK_UP`, `SKILL_UP`, `VIEWPOINT`, `EMOTE_SEEN`.

## 6. Tuning, tables and sim results

Filled in by the sim at the end of each phase; see section 10 (generated) at the bottom of this file.

## 7. Files

(Kept current by phase; see the git log for each phase's commit.)

## 8. Open design questions
See the end of this file.
