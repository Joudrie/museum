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

**Every number is in `src/progression/config.js`** (rank curve, XP table, skills, fishing, pity, hot spots, friendship, tasks, streaks, rested XP, economy). Run the sim to check any change: `node tools/sim_progression.mjs --hours 150 --runs 3 --csv out.csv`; the acceptance test is `node tests/progression-sim.cjs`.

### Rank curve and XP

`xpToNext(n) = round(38 * n^1.6 + 40)` (A = 38, B = 40), then Renown levels cost what Rank 50 costs.
XP table (spec section 3, unchanged): common catch 5, uncommon 10, rare 25, epic 60, legendary 250; new species +50; personal best +10; perfect +5 (doubled by Fishing 18); first talk of the day per NPC 3; heart 40; request 20 to 60; map chunk 2; new location 30; secret 40; daily task 30; weekly chain 150; first catch of the day x2.
Three multipliers keep XP per minute rising so the curve holds: a catch is worth x(1 + 0.065 x Fishing level) and x1.0 to 2.0 by size class (S .85, M 1, L 1.15, XL 1.4, Trophy 2); tasks and requests pay x(1 + 0.06 x rank).

### Time to rank (minutes of active play; median of 3 seeded runs; sim in `src/progression/sim.js`)

| Rank | Spec target | Casual (50%) | Hardcore (100%) |
|---|---|---|---|
| 2 | 3 min | 2 min | 2 min |
| 3 | 8 min | 5 min | 3 min |
| 5 | 25 min | 26 min | 14 min |
| 10 | 3 h | 2.7 h | 2.1 h |
| 15 | 8 h | 7.6 h | 5.3 h |
| 20 | 15 h | 15.0 h | 10.2 h |
| 30 | 40 h | 40.4 h | 22.6 h |
| 40 | 80 h | 81.4 h | 40.7 h |
| 50 | 140 h | 143.3 h | 65.5 h |

Rank 3 comes early because the sim's first two minutes (intro) and the first catch are generous; the acceptance rows (Rank 2 under 5 min, Rank 5 under 30, Rank 10 between 2.5 and 3.5 h) hold on all five seeds the test uses.

### Sim summary at 150 active hours

| | Casual | Hardcore |
|---|---|---|
| Rank | 50 | 76 (26 Renown levels) |
| Skills (Fishing / Sailing / Exploring / Friendship) | 20 / 20 / 20 / 20 | 20 / 18 / 20 / 20 |
| Species found of 72 | 59 (82%) | 42 (58%)* |
| Gold spent | 131,585 | 294,172 |
| Longest stretch with no visible progress tick | 2.7 min | 1.4 min |
| People / Places / Secrets journal | 100% / 98% / 99% | 100% / 98% / 99% |

\* The hardcore sim walks to a random open island each visit and does not hunt for the missing species the way a person would; read it as "the layer never runs out of rank", not as how fast a collector finishes. Full series: `docs/sim/sim-150h.csv`.

### Economy (spec section 9)

- One soft currency: **gold** (earned only; no premium currency). Sources: selling fish (half their worth, x(1 + 0.03 x Fishing level), size and variant multipliers), requests, daily and weekly tasks, ranks, the login calendar, the away letter.
- Target earn rate per active hour (the casual profile's measured rate): about 400 at Rank 1, 900 at Rank 5, 1,000 at Rank 10, 950 at Rank 25 and 1,000 at Rank 50. Hardcore earns about 1.8x.
- **Price ladder** = earn rate x minutes of play (20 to 40), worked out in `market.js ladder()`, so it re-prices itself if the earn rate is retuned:

| Item | Rank | Price | About |
|---|---|---|---|
| Rowboat (Far Isle, Skull Isle) | 4 | 260 | 20 min |
| Cork rod | 5 | 380 | 25 min |
| Lodge lounge | 8 | 400 | 25 min |
| Sailboat (open sea) | 10 | 500 | 30 min |
| Aquarium room | 15 | 490 | 30 min |
| Medium tank | 16 | 410 | 25 min |
| Feather rod | 20 | 560 | 35 min |
| Cosy furniture set | 22 | 400 | 25 min |
| Large tank (subscriber) | 25 | 480 | 30 min |
| Lantern set | 28 | 400 | 25 min |
| Ice hull (Frozen North) | 30 | 640 | 40 min |
| Trophy gallery | 32 | 560 | 35 min |
| Workshop (subscriber) | 35 | 570 | 35 min |
| Harbour set | 38 | 490 | 30 min |
| Golden rod | 40 | 650 | 40 min |
| Observatory | 42 | 570 | 35 min |
| Huge tank (subscriber) | 45 | 660 | 40 min |
| Curator's set | 47 | 500 | 30 min |
| Gilded hull | 49 | 670 | 40 min |

Forty **Town projects** (450 to 500 gold, one every couple of ranks) and the endless **Town fund** (about half an hour of income a level, paying a Renown token) fill the gaps so there is always something worth saving for. Pairs: fish to rods and baits; requests and tasks to cosmetics and hints; ranks to boats and rooms; the away letter to the fund; every source has a sink.
- Rotating shop: seven staple baits, gifts and lures daily; one rare item (Golden fly) daily; one featured cosmetic each week.
- Hints cost 30 / 60 / 120 / 250 / 500 gold by rarity.

### Fishing numbers (config.js)

Rarity weights 60 / 25 / 10 / 4 / 1 (legendary only under its own conditions). Pity: after 25 casts without a Rare, Rare weight ramps +0.18 per cast; after 90 without an Epic, Epic ramps; a legendary's first catch is guaranteed within 15 attempts once its trail and conditions are met (hazard (attempts/15)^2). Variants: Golden 1 in 400, Albino 1 in 800, Ghost 1 in 40 during Harvest. Size classes by z-score: S < -0.7, M < 0.3, L < 1.2, XL < 2.054, Trophy above (the top 2%). Hot spots: 2 per island, rare weight x2.5, move every 2 real hours; frenzy: 2 a day, 3 minutes, bites in 0.6 s. Reel win rates by a mid-skill bot: common 100%, uncommon 100%, rare 80 to 99%, epic 10 to 89%, legendary 20 to 77% by skill.

## 7. Files

`src/progression/`: `config.js` (all tuning), `bus.js`, `clock.js`, `rng.js`, `store.js` (save + migrations), `service.js` (the one path), `modules.js`, `rank.js`, `skills.js`, `species.js`, `fishroll.js`, `reel.js`, `angling.js`, `fishevents.js`, `journal.js`, `grants.js`, `rewardqueue.js`, `activity.js`, `friendship.js`, `requests.js`, `tasks.js`, `goals.js`, `firsthour.js`, `market.js`, `house.js`, `access.js`, `events.js`, `streak.js`, `away.js`, `sub.js`, `telemetry.js`, `report.js`, `sim.js`, `validate.js`, `index.js` (browser wiring); `ui/` (screens: `juice.js`, `reveal.js`, `waterfx.js`, `worldlife.js`, `islandlife.js`, `talkflow.js`, `fieldoverlay.js`, `fieldjournal.js`, `goalsui.js`, `shopui.js`, `lodgeui.js`, `eventsui.js`, `restui.js`, `subcard.js`, `lookfx.js`, `debugpanel.js`, `progression.css`); `data/` (ranks, skills, rods, baits, lures, shop, projects, regions, legends, npcs, gifts, dialogue, tasks, events, monthly, cosmetics).
Fish: `src/collections/data/fish.js` (18 original, upgraded), `fish_more.js` (42 new), `fish_events.js` (12 festival fish). Tests: `tests/progression*.cjs`. Tools: `tools/validate_progression.mjs`, `tools/sim_progression.mjs`, `tools/telemetry_report.mjs`.

### Spec section to code (final)

| Section | Status |
|---|---|
| 3 Rank | Done: curve, XP table, rewards for all 50 ranks (every 5th major, rank 4 the first traversal), Renown, ceremony (1.2 s lock, edge glow, sting, punch, reward flip, "Next" preview), rested XP (blue bar segment), nameplate title and frame |
| 4 Skills | Done: five tracks, 20 levels, a reward every level and a perk every even level; skill bar slides top right. Perks wired in play: all ten Fishing perks, Sailing speed/fast travel/convoy, Exploring snow/light foot/question marks/sparkle range/map sense/viewpoints/pathfinder, Friendship first-talk/rumors/gift hints/waves/discounts/good listener/heart speed, Foraging yield/extra spots/double/rare/recipes/bountiful. **Not wired:** Sailing wake sparkle, fog routes, rough water, chart reader, tide reader; Exploring lantern width, secret chime; Friendship birthdays display; Foraging season eye, patch memory, gift basket (data only, flagged) |
| 5 Fishing | Done: 60 species + 12 festival fish with real facts; conditions (water, time, weather, season, bait); rarity weights; sizes and classes; variants; personal bests; trophies; the reel minigame (harder with rarity, perfect catches); rarity tells; near-miss with silhouette and size class; pity counters in the save; hot spots and frenzy; weekly rumor spot; ten legendaries with trails and a harder reel; six-plus baits and three lures |
| 6 Journal | Done: Fish (with tiered hints, silhouettes, NEW stamps, 25/50/75/100 milestones, goal-gradient lines), People, Places (with a fogged minimap), Emotes, Secrets, Curios (the museum's collections), Titles, Records, Leads, Events; endowed first entry on every page |
| 7 Friendship | Done: 11 named people, hearts, gifts and reactions (heart / star / dots / sweat), unlocks at every heart, ten-heart questline and rare line, 3 requests a day, no decay. Ambient: the raker and bench reader give things; the kids' race is **not built** |
| 8 World | Done: fog chunks, viewpoints, secrets, daily sparkles, locked docks and locked things with their requirement, gear ranks (lantern, boots, gloves), retroactive opening |
| 9, 10 Economy, home | Done (see above); lodge rooms, aquarium with swimming fish, trophy wall |
| 11 Rhythm | Done: 4:00 reset, 3 tasks, reroll, chest, weekly chain, weekly rumor, weekend derby, calendar, streak, shields |
| 12 Hooks | Done: Next-time card (Menu, Take a break), away card capped at three days, rested XP; opt-in reminder copy and cap (cannot fire while the game is closed without a push backend) |
| 13 Seasons, events | Done: real-calendar seasons, four data-driven events, 30-tier track with a subscriber lane, 12 festival fish, event journal page, bulletin |
| 14 Juice | Done: rarity colours everywhere, reveal choreography by rarity, chained rewards with rising pitch, haptics, count-ups |
| 15 Goals | Done: pill, collapsible, Goals tab (Now, Today, This week, Long-term), auto-pin, stuck detector with in-world nudges |
| 16 First hour | Done as a gentle ten-step script on the pill; Far Isle Rare guaranteed on the first visit |
| 17 Subscription | Flag and gating only (`T.sub.enforce` is false); lapse keeps everything; paywall moments rare and concrete |
| 18 to 21 | Done: bus, queue, versioned save, seeded RNG, validator, debug panel (`?debug=1`), sim, telemetry (local, exportable), guardrails (tests check guilt copy, shields, lapses, no premium currency) |

### Notes on the spec's own contradictions

- Section 16 puts Rank 5 at minute 45 to 60 but section 3 puts it at 25 minutes (and the acceptance criteria say under 30). **Section 3 wins**; the first-hour script is a list of firsts, not a clock.
- "Absence is never punished" versus "a broken streak drops to the last milestone": a break costs the streak count only, never anything earned, and shields prevent even that.
- The spec asks for a premium-free, no-fake-scarcity economy and a subscription: gating is by region and lane only; the shop's "today only" rare item is a real daily rotation, not a countdown.

## 8. Open design questions

1. **Payments.** There is no payment path; `hooks.subscribe` is the plug. Should subscriber islands be the seven expedition islands beyond Skull Isle (as built), or something else? Turn on `T.sub.enforce` when a payment exists.
2. **Notifications** need a push backend to arrive while the game is closed. Is one planned?
3. **Home.** The museum has no player house, so "home" is a Lodge (porch, lounge, aquarium room, gallery, observatory, workshop). Should the Lodge become a real room in the island scene?
4. **Art for cosmetics** (hats, outfits, rod and boat skins) is placeholder colour on the placeholder sprites; the user is redrawing sprites by hand.
5. **The kids' race** and the Sailing perks "fog routes", "rough water" and the Exploring "lantern radius" need new gameplay (a time trial, fog weather art, a dark-cave lighting pass).
6. **Fog weather** exists only as a fish condition and a task; the world has no fog visuals yet.
7. **Collection rarity** was widened to five tiers across the museum; paintings still use only the first four. Should some paintings become Epic or Legendary (see `content/rarity-proposals.json`)?
8. **Earned, not bought** (VISION 7): the Market sells bait, rods, boats and cosmetics for gold. Is selling common fish and buying rods the right balance for "earned" collections, or should rods and boats be earned by deeds only?
9. **Global derby board** needs a backend; only a local personal-best board exists.
10. **Telemetry** stays on the device (last 300 events); a real sink is one function in `index.js`.
