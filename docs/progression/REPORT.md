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
  player has 34 secrets, 11 named islanders and 5 legendaries by day
  90, against 26, 3 and 2 as built; and the week ahead first averages under one new thing a session on day 22 instead of day 19.
- **Why the layer's own checks passed:** its simulator emits secrets with made-up ids and rolls its own
  weather, fog included (`sim.js:68`); it never plays the islands. A check that plays the real world (the
  browser probe, the Monte Carlo here) is what catches this.

**So:** fix these before tuning or testing anything: map the scene's map id to its region in the world
layer (the fishing code already does, `regionOfMap`), give the four fish weather that happens (or add fog
to the calendar, Chat 11), and make the rod text true. Each is small; together they are most of the
layer's long tail.

### 2. Gold has no job: the wallet earns 2.6 times the top of the layer's target, rank gates everything, and the same fish sells twice

- **The layer prices its market for 400 to 1,000 gold an active hour** (each rung 20 to 40 minutes of that).
  A regular player earns **2,619 gold** an active hour in all: 1,087 from selling fish at the market, 519 from the layer's payouts, 677 from the museum's daily gift, wheel, dig goal and guests, 336 from the codex's milestone and set gold. The layer's sim
  doesn't have the museum's daily gift, wheel and dig goal, the guests or the codex's milestone and set
  gold, all paying into the same wallet.
- **Rank, not gold, decides what you can buy.** Every rung of the ladder costs 260 to 670 gold, 6 to 15 minutes of what a regular player earns, and the ladder and the 40 town projects together cost 29,020, against about 128,000 earned by day 90. The rest goes into the town fund (no end, a Renown token a level): the median regular player holds 481 gold on day 90.
- **The same fish sells twice:** its codex copy in the Gallery Shop (about 2 to 7 times the market's price,
  by rarity and Fishing level) and its bag copy at the market. A regular player who sells both earns 3,474 gold more an hour.
- **The museum's own money loop is unchanged and still broken if `FREE` goes off:** the first room you
  build is priced as the ninth (24,790 gold, 539 hours of museum income), and an hour of play
  outearns the museum 24 times over.

**So:** one economy, decided on purpose. Pick what gold is for (the museum's rooms, the layer's ladder, or
both), let one shop buy fish, count everything that pays into the wallet when pricing, and fix the room
count (H1) before `FREE` goes off. H15 is the beta check.

### 3. The layer fills every minute with a meter; new things still thin out by week three

- **Progress ticks are constant; new things are not.** The longest stretch with no progress tick at all
  (an XP pop, a skill bar, a card) is 2 min at P99 for a regular player, which is what the layer's
  acceptance test measures. The longest stretch with **nothing new** in the first 10 active hours is
  34 min at the median and 59 min at P99, against a ceiling of 36 minutes.
- **The layer's pity can't reach those droughts.** It raises the chance of a rare or epic tier, not of
  something you lack: with it the regular player's worst droughts are only 11% shorter than without. **H8 fails** (pity has to shorten the P99 by 25%; it changes it by: casual 1% shorter, regular 11% shorter, heavy 4% shorter).
- **Opening everything changes little.** In the strip build (every boat, rod and perk from the start, no
  payouts) a regular player has 51 species by day 90 against 50: what paces new
  things is the conditions, the calendar and what is left to find, not the gates.
- **New things per session** for a regular player: about 19 in the first session, 8.9 a session in week one, 0.91 by day 30 and 0.19 by day 60. The week ahead first averages under one new thing a session on day 19 (heavy day 16, casual day 51); **H3 is predicted to fail.** Before #195 it was day 12.
- **What is left at day 60:** 0.19 new things a session, mostly colour variants (0.06), unlocks (0.06), trophy sizes (0.05).
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

## What only real players can answer

- Whether the bare loop holds without the layer: the strip test (H0, H13), now that the strip build
  switches the layer off too.
- Whether the rank, XP and the daily layer earn their keep (H14, H2), and goals and payouts (H4, H6):
  these need a public test with hundreds per arm (experiments.md).
- Session length, time of day and what people choose to do: every profile number in `common.py`.
- Why they stop: the diary and exit interviews.
- Whether they'd pay, and for what.

## What #195 built, against the evidence

The other chat built the first, feature-led spec. Where the evidence points now that it runs:

| Built in #195 | What the evidence says | So |
|---|---|---|
| Rank 1 to 50, XP for every action, rested XP | rank gates every purchase (gold is rarely short); XP pops keep the gap with no progress tick under 2 min while the drought of new things is 34 min at the median; expected, volume-contingent | test H14 (`?flags=-rank`) before adding ranks; if it fails, give the 13 rank unlocks to deeds |
| 72 fish species with conditions, baits and hot spots | a regular player has 50 species by day 90; 4 can never bite | keep; fix the four |
| The reel | a real skill gradient: an epic fish is landed 23% of the time at no skill and 98% at full skill | keep: fishing gained the depth diagnosis.md asked for |
| Pity (rare and epic ramps, the legendary hazard) | with the ramps the worst droughts are only 11% shorter (H8) | harmless; not the answer to droughts |
| Colour variants and trophy sizes | procedural: the part of the long tail nobody has to make more of | keep (H9, H10) |
| Secrets, viewpoints, fog, legend trails, named islanders | off Main Island and Island One, the world layer finds nothing (finding 1) | fix the lookup |
| The market: ladder, rods, boats, town fund | priced from a target the wallet beats 2.6 times over; the rod menu's odds aren't applied | one economy (finding 2); fix the rod text or the odds |
| Daily tasks, login calendar, streak and shields, away letter, event track | expected and attendance- or volume-contingent (rewards.md) | test with H2 before adding more |
| A subscription flag (off) | no payment path; DESIGN.md says free with gems | decide (Needs Sean) |
| The layer's sim and acceptance tests | they count XP ticks, roll fog the game never has and emit their own secrets, so they could not see finding 1 | add a check that plays the real islands (`tools/islands_probe.cjs`, the Monte Carlo here) |

## How this was checked

- **Every claim traces to code, a log, a model output or a cited source.** The numbers above come from
  `data/` (CSV and JSON written by the scripts; this file is written from them by `tools/compose.py`).
  The Monte Carlo calls the progression layer's own functions, so its fishing, pity, payouts and prices
  cannot drift from the game's.
- **Reproducible:** `python3 docs/progression/run_all.py` reruns everything; every simulated player and
  the layer's own dice are seeded, and `tools/check_repro.py` reruns one Monte Carlo run and compares
  it with `data/` (not run yet).
- **An independent check:** a separate agent that had not seen this work checked 15 code claims against the source (`data/independent_check.md`): 10 true, 4 true with a caveat, 1 partly true, none false. Its corrections are folded in (the market's Fishing-level bonus, Skull Isle's secret count), and it found the island-lookup fault in finding 1, which a browser probe then confirmed.
- **Tests:** `node tests/measure.cjs` (in `npm test`) checks that every watched save and the layer's bus
  events become the right log events, that the strip test's hooks in the layer do what they say and
  nothing in a normal build, that a real catch and a real dig are logged, and that `?progression=off`
  hides the rank pill and the Goals tab, persists and clears. The whole fast suite passes.

## Sources

- [PostHog: capturing events with the API](https://posthog.com/tutorials/api-capture-events)
- [GameAnalytics: collection API setup and authentication](https://docs.gameanalytics.com/integrations/api/setup)
- [PENS: Player Experience of Need Satisfaction (game-evaluation repository)](https://game-evaluation.github.io/questionnaires/repository/pens.html)
- [UPEQ: Ubisoft Perceived Experience Questionnaire (Azadvar and Canossa, FDG 2018)](https://researchr.org/publication/AzadvarC18)
- Deci, E. L., Koestner, R., and Ryan, R. M. (1999). A meta-analytic review of experiments examining
  the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*, 125(6), 627–668.

