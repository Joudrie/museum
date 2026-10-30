# Progression: what the evidence says (Chat 18, 2026-10-29)

This chat built no progression features. It measured what exists, from the game's own code and
history; modelled it by playing the code; and wrote down, before any player data exists, the tests a
progression design must pass. Midway through, the other chat's progression layer merged (#195:
ranks, skills, 72 fish with conditions, rods and baits, the reel, pity, a market, friendship,
secrets, tasks, streaks, events). **Everything below describes the game with the layer.** The Monte
Carlo plays the layer's own code, the strip test switches the layer off, and the hypotheses were
re-registered for it before any data. Rerun everything with `python3 docs/progression/run_all.py`.
(This file is written by `tools/compose.py` from the outputs in `data/`.)

## The three findings that most change what should be built

### 1. Most of the layer's world never reaches the player, and four of its fish can never bite

- **Off Main Island and Island One, the world layer can't find its islands.** The island scene names
  itself by map id (`IslandScene.js:154`), and the world layer looks that up in files keyed by region
  id. In the built game, checked in a browser (`data/world_by_island.json`): Main Island has its 12
  secrets, a legend's clue and Wen; Island One its 6, a clue and Mara; the Far Isle, Skull Isle and the
  Drowned Reef each get 3 secrets, **no clue and nobody**. So **8 of the 10 legendaries can never be
  caught** (a legendary bites only after its clue), **8 of the 11 named islanders never appear** (their
  requests still go on the board), and about 24 of the 66 secrets are never placed.
- **Four fish want weather that never happens where they live** (`data/params.json fishing.neverBites`):
  the sturgeon and the oarfish want fog, which the game's weather never makes; the anglerfish and the
  coelacanth live only on islands whose fixed climate has neither fog nor rain. The fish page, three
  fish sets and the codex's 100% milestone can never be finished.
- **The rod menu promises odds the code doesn't give** ("rare fish +40%" for the golden rod,
  `fishing.js:90`; nothing in `fishroll.js` reads a rod's `rareMult`).
- **What the fix is worth**, in the model: with the world as `regions.json` describes it, a regular
  player has {{FIX_SECRETS}} secrets, {{FIX_PEOPLE}} named islanders and {{FIX_LEGENDS}} legendaries by day
  90, against {{BASE_SECRETS}}, {{BASE_PEOPLE}} and {{BASE_LEGENDS}} as built; {{FIX_PACE}}
- **Why the layer's own checks passed:** its simulator emits secrets with made-up ids and rolls its own
  weather, fog included (`sim.js:68`); it never plays the islands. A check that plays the real world (the
  browser probe, the Monte Carlo here) is what catches this.

**So:** fix these before tuning or testing anything: map the scene's map id to its region in the world
layer (the fishing code already does, `regionOfMap`), give the four fish weather that happens (or add fog
to the calendar, Chat 11), and make the rod text true. Each is small; together they are most of the
layer's long tail.

### 2. Gold has no job: the wallet earns {{GOLD_X}} times the top of the layer's target, rank gates everything, and the same fish sells twice

- **The layer prices its market for 400 to 1,000 gold an active hour** (each rung 20 to 40 minutes of that).
  A regular player earns **{{REG_ALL}}** an active hour in all: {{REG_SPLIT}}. The layer's sim
  doesn't have the museum's daily gift, wheel and dig goal, the guests or the codex's milestone and set
  gold, all paying into the same wallet.
- **Rank, not gold, decides what you can buy.** {{LADDER_TXT}}
- **The same fish sells twice:** its codex copy in the Gallery Shop (about 2 to 7 times the market's price,
  by rarity and Fishing level) and its bag copy at the market. A regular player who sells both earns {{TWOSHOPS_EXTRA}} more an hour.
- **The museum's own money loop is unchanged and still broken if `FREE` goes off:** the first room you
  build is priced as the ninth (24,790 gold, {{FIRST_ROOM_H}} hours of museum income), and an hour of play
  outearns the museum {{RATIO}} times over.

**So:** one economy, decided on purpose. Pick what gold is for (the museum's rooms, the layer's ladder, or
both), let one shop buy fish, count everything that pays into the wallet when pricing, and fix the room
count (H1) before `FREE` goes off. H15 is the beta check.

### 3. The layer fills every minute with a meter; new things still thin out by week three

- **Progress ticks are constant; new things are not.** The longest stretch with no progress tick at all
  (an XP pop, a skill bar, a card) is {{TICK_P99}} at P99 for a regular player, which is what the layer's
  acceptance test measures. The longest stretch with **nothing new** in the first 10 active hours is
  {{DR_P50}} at the median and {{DR_P99}} at P99, against a ceiling of 36 minutes.
- **The layer's pity can't reach those droughts.** It raises the chance of a rare or epic tier, not of
  something you lack: with it the regular player's worst droughts are {{PITY_REG}} than without. {{H8_LINE}}
- **Opening everything changes little.** In the strip build (every boat, rod and perk from the start, no
  payouts) a regular player has {{STRIP_SPECIES}} species by day 90 against {{BASE_SPECIES}}: what paces new
  things is the conditions, the calendar and what is left to find, not the gates.
- **New things per session** for a regular player: {{PACE_REG}}. {{H3_LINE}}
- **What is left at day 60:** {{DAY60_LINE}}
- **Half the layer's rewards are the kind the research warns about.** 11 of the 22 reward kinds it added
  are expected payouts for showing up or for volume (XP, rested XP, the login calendar, the streak, the
  away letter, tasks, request gold, the event track, the town fund; rewards.md). In Deci, Koestner and
  Ryan's meta-analysis, expected tangible rewards for doing or finishing a task lowered how much people
  went on doing it by choice. Whether these do here is what H2 and H14 measure.

**So:** the layer is built; now it has to earn its place. The strip test (H0), the rank arm (H14) and the
daily arm (H2) are links today (`?progression=off`, `?flags=-rank`, `?flags=-daily`). Put new content
effort where it doesn't wait on anyone: the procedural long tail (variants, trophy sizes), and the legend
trails and islanders the fix in finding 1 turns back on.

## What to build next, in order

1. **Fix the four faults** (finding 1): the island lookup, the four fish, the rod text; and let one shop buy
   fish (finding 2). Small, and they decide what the long tail is.
2. **Decide subscription or free with gems** (Needs Sean). The layer builds a subscription flag; DESIGN.md
   says free, ads and gems (on hold).
3. **Run the strip-test playtest and the diary beta** (H0, H13; `on` vs `off`), now that the layer exists to
   strip. 5 to 8 testers, then 20 to 40.
4. **One economy** (Chat 12, the layer's chat, Chat 8): what gold is for; the room count fix and a gentler
   room curve before `FREE` goes off (H1, H15).
5. **Approve the rarity proposal**, switch paintings to earned (start with the entrance's) and let famous
   visitors arrive a few at a time (H11).
6. **Give digging the depth fishing now has:** steeper brush odds so rarity means something, a reveal that
   reads the tool; and a way to earn the 36 shop-only pieces (VISION 7).
7. **Fix the goals that are met before you play** and the "Expansion" text (Chat 10).

## What to cut (each has a removal test in hypotheses.md)

The daily wheel, robbery and the security tiers, the collect-all fee, mess and janitors unless testers
say tidying feels good (H12). From the layer, nothing is cut on opinion: the login calendar, rested XP and
the event track are the first candidates if H2 and H14 come back under their bars.

{{TAIL}}
