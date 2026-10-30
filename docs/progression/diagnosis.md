# Phase 2: diagnosis

Steps 5 to 7. Everything here is read from the code at `main` on 2026-10-29, after the progression
layer merged (#195, `src/progression/`), unless marked **assumption** or **FILL_IN**. File and line
references are to that commit. (A first pass read the build before #195; where the layer changed the
answer, this file says so.)

## 5. The strip test

**The flag.** `?progression=off` (src/measure/flags.js) turns off the extrinsic layer, the
progression layer's and the older one, and leaves the activities (fishing with its reel and
species, digging, talking, sailing, the museum):

| System | Off means | How |
|---|---|---|
| rank | no rank pill, XP ticks, skill bars or rank ceremonies (rank and skills still count, unseen, so the layer's code runs unchanged; since #217 nobody sees floating XP numbers) | `queueShows()` in the layer's reward queue (src/progression/index.js); `body.no-rank` (measure.css) |
| goals | the goals list, the goal on the pill, the Goals tab, stuck nudges; the field journal opens on Fish | `body.no-goals`; one line each in index.js and ui/fieldoverlay.js |
| payouts | nothing is handed out for goals, tasks, requests, ranks, skill levels, hearts, sets or milestones (unlocks still arrive) | `grant()` in src/progression/grants.js, the one path every layer payout takes; Claim buttons hidden (`body.no-payouts`) |
| daily | no daily gift, wheel, task, streak, login calendar, away letter or event-track cards; no Events tab | `queueShows()`; `body.no-daily` |
| unlocks | every rod, boat, region, gear, perk, dig tool and the metal detector from the start | `unlockAll()` in access.js, angling.js, skills.js, dig.js, puzzles-hunt.js |
| fanfare | celebration cards, confetti, "New!" badges, journal-stamp and milestone cards (the catch card stays) | `queueShows()`; `body.no-fanfare` |

Single systems: `?flags=-daily` (off) or `?flags=+fanfare` (back on inside an off build).
`?progression=on` clears it. The setting is saved on the phone (`curation.buildflags`), so a
tester's build stays put across reloads. `tests/measure.cjs` checks all of this, in Node (the
hooks in the layer's grant, rod, region and perk code) and in a phone-sized browser.

**What the strip test cannot strip, because it is already gone in every build.** Three
switches make the current game nearly progression-free before the flag does anything:

1. **Nothing costs gold, except one thing.** `FREE = true` in `src/wallet.js:31` ("Everything
   is free while testing", since PR #18 on 2026-10-22). `spend()` always succeeds, so rooms,
   decor, office levels, staff, upgrades and Gallery Shop pieces are all free. The exception is
   the 15% "Collect all" fee, which is taken straight from the wallet and never asks `FREE`.
2. **Every painting is yours from the start.** The painting collection is `ownership: 'all'`
   (`src/collections/data/paintings.js`). Paintings, the core of VISION #3, are never earned.
3. **Every famous visitor is always there.** `RoomScene.js:1007` spawns all 19 in the main hall
   ("for now: all of them, all the time"); `guestToday()`, which would pick one a visit, is never
   called. "Meet every famous visitor" (1,000 gold) can be done in one sitting.

So `on` vs `off` compares the game with and without the progression layer and the older goals,
dailies, unlock pacing and fanfare. It does not test the tycoon: the tycoon has no pacing to strip
yet (the layer's prices are always charged, but only for its own market).

**Strip-test playtest script (15 minutes).** For a first-time tester on their own phone, build
`?progression=off`. Observer only; no help unless they are stuck for 60 seconds.

| Minute | What the observer does | What to note |
|---|---|---|
| 0 | Hand over the phone on a fresh save at the entrance. "Play however you like. Think out loud." | First thing they try. |
| 0 to 3 | Watch the first moves: walking, talking to the caretaker, the first painting viewed. | Seconds to first input; whether the HD reveal draws a reaction. |
| 3 to 8 | Do not point at anything. If they never go outside, after minute 8 say once: "There's more outside." | Which activity they choose first, unprompted. |
| 8 to 13 | Let them fish, dig, talk or decorate. | Do they repeat an activity without a goal telling them to? How many casts or digs before they move on? |
| 13 to 15 | Stop them. Ask: "What would you do next?" then "Would you open this again tomorrow? Why?" | Their words, verbatim. |

Then the short questionnaire (see playtest-protocol.md). **Pass**: at least 5 of 8 testers
choose to repeat an activity three or more times without being told, and at least 4 of 8 name
a concrete next thing they want to do. **Fail**: the core loop is the top problem, ahead of any
progression work. The reasons to look for are in the audit below.

## 6. Core loop audit

Measured from code. "Decisions" are choices whose outcome the player can predict and that
change the outcome.

### Fishing (`src/fishing.js`, `src/progression/angling.js`, `fishroll.js`, `reel.js`)

The layer rebuilt fishing. Before #195 it was a tap inside a 1.0 to 1.5 s window and a weighted roll;
now:

| Question | Answer |
|---|---|
| Decisions | Where (10 regions, pond, sea or ice), when (dawn, day, dusk, night; the real weather; the season), which rod, which bait (a species' bait gives it 2.5× its share of its rarity tier), whether to fish a hot spot (rare weight ×2.5, two an island, moving every 2 hours). Many choices, most of them per session, a few per cast. |
| How skill shows | The reel: keep the hook zone on the fish (hold to lift, let go to sink). The layer's own bot shows a real gradient: a common fish is landed 96 to 100% of the time at any skill, an epic one 23% at no skill and 98% at full skill, a legendary 5% and 73% (`data/reel_skill.json`). A perfect catch adds size. |
| What varies | Species, size (a z-score: S to Trophy, the top 2%), and a colour variant (golden 1 in 400, albino 1 in 800, ghost 1 in 40 in the Harvest festival). Pity ramps the rare and epic weights after 25 and 90 casts without one; a legendary's first catch is certain within 15 tries once its trail is open. |
| How readable | Good: the catch card, a reveal scaled by rarity, a near-miss silhouette with the size class when one escapes, hints in the journal written from the species' own rules. |

**Diagnosis.** Fishing now has a skill and a reason to plan, which the first pass said it lacked.
Four things in the code work against it (the fourth, found by the independent check, is the largest):

1. **Four species can never bite.** The sturgeon (rarity 4, Main Island and Island One) and the oarfish
   (5, a legendary with a trail and a clue, Sandstone Tomb) want fog; the anglerfish (4, fog or rain) and
   the coelacanth (4, rain) live only on the Drowned Reef and in the Frozen North. The game's weather
   (`src/weather.js weatherToday`) is only ever clear, rain, snow, leaves or petals, and expedition islands
   have one fixed climate (the Reef and Sandstone Tomb are always a clear summer, the North always snow),
   so those conditions never happen (`data/params.json fishing.neverBites`). The journal's hints describe
   fish that can't bite, and the fish page can never reach 100%. The layer's own simulator rolls fog on
   10% of days (`src/progression/sim.js:68`) and ignores the islands' climates, which is why its numbers
   never saw this.
2. **The rods promise odds they don't give.** The rod menu says "rare fish +40%" for the golden rod
   (`fishing.js:90`, from `rareMult` in data/rods.json), but nothing in `fishroll.js` reads a rod's
   `rareMult`: a rod changes the bite wait and the reaction window only.
3. **The same fish sells twice.** Every catch goes into the codex (`hooks.collect`, a copy you hold) and
   into the layer's bag. The Gallery Shop buys the codex copy at half the rarity price (20, 60, 200, 450
   and 750 gold for rarity 1 to 5) and the layer's market buys the bag copy at half its own value (4, 11,
   29, 72 and 258 for a medium fish at Fishing level 1; the bag's value grows 3% a level). Selling one
   never removes the other, so both can be sold; the Gallery Shop pays about 5 to 7 times more for
   rarity 1 to 4 and 3 times more for a legendary (2 to 4.5 times at Fishing 20).
4. **Off Main Island and Island One, the world layer can't find its islands.** The island scene's
   `regionKey` is the map id (`IslandScene.js:155`: `main`, `one`, `isle-1`, `exp-pirate`…), but the world
   layer looks it up in `regions.json` and `npcs.json`, which use region ids (`isle`, `pirate`…):
   `REGIONS[scene.regionKey]` in `ui/worldlife.js:22` and `ui/islandlife.js:26`, and
   `n.region === s.regionKey` in `ui/islandlife.js:38`. Only `main` and `one` match. So on the Far Isle and
   all seven expedition islands: 3 secrets instead of 5 to 12, and **no legend clue**; **no named
   islanders** (8 of the 11 never appear, though their requests still go on the board); and no "new
   place" stamp for the island. A legendary only bites once its clue is found (`fishroll.js
   legendEligible`; `activity.js` is the only code that sets the clue stage), so **8 of the 10 legendaries
   can never be caught**: only the golden koi (Main Island) and the moonfish (Island One). Fishing itself
   is not affected (`fishing.js:163` passes the map id to `prepareCast`, which maps it to the region). Of
   the 66 secrets in the data, about 42 are placed. Skulldug Island (on the boat list since #209, after
   this was measured) is in neither file: its fishing falls to open water (`species.js regionOfMap` →
   `wild`) and the world layer takes the same no-region path as the islands above.

Smaller ones: the weekly rumour's spot is never set (`tasks.js:98`, `spot: null`), so its sure-catch at the
spot (`ui/waterfx.js rumorNear`) never fires; the `area:frozen_north` rank-25 unlock is read by nothing;
and with these fish and legends out of reach, three fish sets ("Still waters", 300 gold; "The deep", 900;
"Legends", 3,000) and the codex's 100% milestone (50,000) can never be finished.

### Digging (`src/dig.js`)

| Question | Answer |
|---|---|
| Decisions | Which spot (each rests 10 minutes) and which tool. Brush: gentle, rare finds more likely. Trowel: plain odds. Pick: fastest, favours common finds. |
| How skill shows | None. Brushing clears 70% of the dirt over the find; speed depends on the tool's width. |
| What varies | The find, picked before the first stroke with weight `max(0.05, 5 - rarity * flat)`. |
| How readable | Excellent: the find appears as the dirt comes away. This is the best reveal in the game. |

**Diagnosis.** With the brush (`flat 0.6`) the weights are 4.4 / 3.8 / 3.2 / 2.6 for rarity 1
to 4: a legendary is only 1.7 times rarer than a common (unchanged by #195). Rarity barely means anything while
digging. The best tool for rare finds is the one you start with, so earning the trowel and pick
gives speed, not anything you want more. The reveal is where digging's pleasure lives.

### Talking (`src/chatter.js`, `src/RoomScene.js chat()`)

| Question | Answer |
|---|---|
| Decisions | Which topic: about the painting, a joke, a tip, or what they are looking for. "What are you looking for?" is the only topic with a goal: hang that artist and they are pleased (a sure gift, and gold gifts doubled). |
| How skill shows | None. |
| What varies | 13 visitor kinds with 2 jokes each; a gift 55% of the time (always when pleased), once per visitor per day, gold or a common mineral or fossil. |
| How readable | Good. Visitors with a gift today show a star now and then. |

**Diagnosis.** Talking is content consumption with a lottery at the end. 26 jokes and 7 tips
(1,187 words of chatter in all) run out in a sitting; each topic is offered once per visitor.
The "looking for" request is the seed of a real loop (a want, an action, a visible result), and it
is the one place the museum and the guests connect.

### Restoring (`src/restorestudio.js`)

Rub grime off the real HD painting, brush stone off a fossil, or drag nine pieces together. No
skill and no failure, but the strongest moment of meaning in the game: the real object appears
under your finger. It only exists for finds that arrive dirty (expeditions, some dug ruins).

### Expeditions (`src/expedition.js`)

The only place with real skill: patrols with sight cones, tall grass to hide in, pressure plates
and levers, a tide clock. Failing is gentle (back to the boat, finds kept). Seven islands, in a
chain of leads. Each one is played once for its story; repeats are allowed but hand out the same
kinds of finds.

### Exploring (`src/progression/ui/worldlife.js`, `islandlife.js`)

New with the layer: fog that clears in 8×8-tile chunks as you walk, secrets (66 in the data, 5 to 12 an
island; about 42 placed in play, fault 4 above; seeded per install and island, named from a list of
12; the first on Main Island and Island One is a legend's clue; some need the lantern, boots or
gloves), two viewpoints an island, and six sparkle pickups an island a day for gifts and bait. No skill;
the pleasure is finding.

### What the audit says

Before #195 the verbs were reveals and collection, and skill lived only on expeditions. The layer added
a real skill to fishing (the reel), planning (conditions, baits, hot spots, legend trails) and a
finding verb (exploring), and it built the long tail the first pass asked for (variants, trophy sizes).
What it also added is a large layer of expected, attendance- and volume-contingent rewards (rewards.md),
and four code faults (above), one of which takes most of the world layer's content off every island but
two. Digging still has no skill and almost no rarity.

## 7. Player definition

**Assumption until the playtests and telemetry say otherwise.** From DESIGN.md, VISION.md and
the user's own references (Stardew Valley, Animal Crossing, Pokémon, Club Penguin, Webkinz).

| | Hypothesis | How it gets checked |
|---|---|---|
| Who | Adults who like cozy collection games and are curious about art and history. Portrait phone. | Recruitment screener; the Gamer Motivation Profile result each tester shares. |
| Session | 10 to 20 minutes, one to three times a day, often in short breaks (FILL_IN). | `session_start` / `session_end` (`ms`, `activeMs`). |
| Time of day | Lunch and evening (FILL_IN). Matters here: night fish only bite 20:00 to 06:00 on the real clock. | `session_start` timestamps. |
| Device | iPhone, Safari, portrait (HANDOFF: the user has no desktop). | — |
| Top motivations (Quantic Foundry's 12) | High: **Completion** (Achievement), **Design** and **Discovery** (Creativity), **Fantasy** (Immersion). Low: **Destruction**, **Excitement**, **Competition**. | Ask testers to take the public Gamer Motivation Profile and share the result. |

**Every system mapped to the three needs** (self-determination theory: autonomy, competence,
relatedness). ✚ = serves it clearly, · = weakly, blank = not at all.

| System | Autonomy | Competence | Relatedness | Verdict |
|---|---|---|---|---|
| Decorating, room shapes, halls, presets | ✚ | · | | keep (Design) |
| Hanging paintings anywhere, the HD viewer, notes and ratings | ✚ | | · | keep |
| Fishing (with the layer: conditions, baits, hot spots, the reel) | ✚ | ✚ | | keep; fix the four fish that never bite, the rod text and the island lookup |
| Digging, tools | · | · | | keep; rarity needs meaning |
| Restoration Studio | | · | | keep (the reveal) |
| Expeditions, puzzles, stealth | · | ✚ | | keep; the only skill |
| Guests, regulars, gifts | | | ✚ | keep; grow "looking for" |
| Famous visitors, chains, the heist | | | ✚ | keep; stagger their arrival |
| Collections, codex, sets, plaques | · | ✚ | | keep |
| Share and visit friends | ✚ | | ✚ | keep |
| Goals list | | · | | keep only if H4 holds (hypotheses.md) |
| Codex milestone and set gold | | · | | keep only if H6 holds |
| Daily gift and streak | | | | test (H2); attendance-contingent |
| **Daily wheel** | | | | **cut candidate**: pure chance, no choice, no skill, no one to share it with; the gift already rewards showing up |
| **Mess and janitors** | | · | | cut candidate unless players say tidying feels good (playtest question) |
| **Robbery and security tiers** | | | | cut candidate: a loss while you're away, bought off with gold; serves no need |
| Rank, XP, rested XP | | · | | test (H14): volume-contingent; the unlocks it carries could come from deeds |
| Skills and perks | · | ✚ | | keep the perks that change a verb (night fishing, a wider window) |
| Named islanders, hearts, gifts, requests | · | | ✚ | keep; first talks of the day are attendance-contingent; 8 of 11 never appear (fault 4) |
| Daily tasks, login calendar, streak, shields, away letter | | | | test (H2): attendance-contingent |
| Event track (30 tiers) | | · | | test before relying on it: volume-contingent |
| Exploring: fog, secrets, viewpoints | ✚ | · | | keep (Discovery) |
| **Collect-all fee (15%)** | | | | cut candidate: a tax on convenience; the walk to the coins is a chore, not a choice |
| **Goals that are met before you play** | | | | **fix**: "Expansion" (3 rooms) and "Wing by wing" (6 rooms) are already true on a new save, because a new museum lists 10 rooms (entrance, main hall, atrium and 7 shaped rooms). "Expansion" also points at the wrong place: the build menu only opens past the last shaped room |
| **Income shown for rooms you can't open** | | | | **fix**: `museumIncome` adds up locked rooms too, so a new save's HUD shows 46 gold an hour when 16 can be collected, and "Thriving" (200 an hour) counts gold no one can pick up |

The cut candidates are not cut here: building no features is the rule for this phase. They go
into hypotheses.md as tests with removal criteria.
