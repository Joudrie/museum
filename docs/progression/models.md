# Phase 3: models

Steps 8 to 11, rerun on the build with the progression layer (#195). Written by `tools/compose.py`
from the outputs in `data/`; edit `templates/models.md`, not this file.

**How the models get their numbers.** The Monte Carlo (`models/montecarlo.mjs`) does not copy the
game's odds: it runs the progression layer's own modules in Node and plays them. Each cast calls
`prepareCast`, the layer's reel bot (`playBot`) and `completeCast`, so species and their conditions,
rarity weights, pity, hot spots, sizes, variants, the reel, XP, ranks, skills, tasks, requests, the
market and the login calendar all run as they do in the game. Around the layer, `data/params.json`
(`tools/export_params.mjs`, the game's own code) gives the dig tables (`pick()`), the weather on the
real calendar and each island's fixed climate, the Gallery Shop's real shelf, guests, leads and the
museum's economy. `models/common.py` holds every assumption about players (`ASSUMPTIONS`, `PROFILES`).
Day 0 is 29 October 2026 (the "autumn start (today)" runs), pinned in `params.json modelStart` so a rerun
on another day gives the same numbers; the spring start begins 154 days later, on 1 April 2027.

**Measured, not assumed** (the 40-minute real-time session, ground-truth.md): a cast takes the rod's
bite wait, the reel's own length, and 4.5 s for the cast, the card and the recast; brushing a
dig takes 15.8 s.

**The reel by skill** (`tools/reel_skill.mjs`: the layer's reel and bot, 4,000 fights a cell):

| Rarity | skill 0 | skill 0.25 | skill 0.45 | skill 0.65 | skill 0.85 | skill 1 |
|---|---|---|---|---|---|---|
| 1 (common) | 96% | 99% | 100% | 100% | 100% | 100% |
| 2 (uncommon) | 81% | 89% | 97% | 99% | 100% | 100% |
| 3 (rare) | 53% | 66% | 82% | 94% | 100% | 100% |
| 4 (epic) | 23% | 36% | 50% | 72% | 94% | 98% |
| 5 (legendary) | 5% | 9% | 14% | 28% | 56% | 73% |

A common fish is landed at any skill; a rare one rewards skill; an epic or a legendary needs it. The
profiles use the layer's own sim values (casual 0.45, heavy 0.85) and 0.65 for a regular player.

## 8. Content velocity

`models/content_velocity.py` → `data/content_velocity.csv`, `multipliers.csv`, `content_velocity.json`.

**Player-hours per unit of content.** Play can hand out 147 entries. Each buys about 10 minutes of active play for a regular player and 19 minutes of active play for a heavy player (active time to 75% of them, divided by the entries); a casual player doesn't reach 75% within 90 days.
All 11,783 words of text take about an hour to read once.

**Runway.** At P50, three quarters of everything obtainable is collected by day 33 (regular) and day 23 (heavy); a casual player doesn't get there within 90 days.

**What a subscription would need.** At one new thing a session (H3), a regular player needs about
54 new things a month and a heavy one 90. At the **assumed** 10 developer
minutes per entry (FILL_IN), that is 9.0 and 15.0 hours a month of approving
and drawing, every month.

**Where new things come from once the first flood is over** (regular player, new things per session;
`multipliers.csv`):

| Source | week 1 | day 30 | day 60 | who has to make more of it |
|---|---|---|---|---|
| new fish species | 2.32 | 0.33 | 0.00 | a species: data the developer approves (and later a sprite) |
| the Gallery Shop's shelf | 1.30 | 0.26 | 0.02 | a museum piece: data the developer approves |
| trophy sizes | 0.29 | 0.13 | 0.05 | procedural: nobody (sizes roll on every catch) |
| colour variants | 0.33 | 0.07 | 0.06 | procedural: nobody (a palette) |
| unlocks | 0.63 | 0.04 | 0.06 | a rank reward: data |
| secrets | 1.08 | 0.04 | 0.00 | procedural placement: nobody (names from a list of 12) |
| places and viewpoints | 0.45 | 0.02 | 0.00 | an island: painted by hand |
| the metal detector | 0.75 | 0.01 | 0.00 | a museum piece: data the developer approves |
| the X | 0.02 | 0.00 | 0.00 | other |
| named islanders met | 0.24 | 0.00 | 0.00 | a named islander: written and approved |
| digs | 0.32 | 0.00 | 0.00 | a museum piece: data the developer approves |
| leads | 0.08 | 0.00 | 0.00 | other |
| expedition finds | 0.91 | 0.00 | 0.00 | an island: painted by hand |
| guests' gifts | 0.23 | 0.00 | 0.00 | other |

By day 30 the most new things a session come from new fish species (0.33), the Gallery Shop's shelf (0.26), trophy sizes (0.13). Variants and trophy sizes, which the layer built, are procedural: nobody has to make more of them, so they are the part of the long tail that does not wait on the developer.

## 9. Economy

`models/economy.py` → `data/economy_sources_sinks.csv`, `economy_runs.csv`, `economy_summary.json`,
`figures/economy_rooms.png`. With #195 the game has two economies paying into one wallet: the
museum's (rooms, decor, office, staff; free while `FREE = true`) and the progression layer's (a market
with a price ladder; always charged).

**What an active hour of play earns** (the Monte Carlo, which runs the layer's own code; gold per
active hour, P50 player of each profile):

| Profile | selling fish at the market | the layer's payouts | the old daily gift, wheel, dig goal, guests | codex milestones and sets | all | spent |
|---|---|---|---|---|---|---|
| casual | 201 | 838 | 1,491 | 613 | **3,143** | 3,123 |
| regular | 1,087 | 519 | 677 | 336 | **2,619** | 2,615 |
| heavy | 1,579 | 191 | 311 | 124 | **2,205** | 2,203 |

**Against the layer's own design.** The layer prices its ladder at 20 to 40 minutes of a target earn
rate of 400 to 1,000 gold an hour (`market.js ladder()`, `config.js economy.goldPerHour`, measured by
its own sim). A regular player earns 2,619 gold an active hour in all, 2.6 times the top of that range; the layer's own sources alone give 1,606. The rest comes from systems the layer's sim does not have: the museum's daily gift, wheel and dig goal, guests, and the codex's milestone and set gold. Gold is rarely what stops a purchase: every rung of the ladder costs 260 to 670 gold, 6 to 15 minutes of what a regular player earns, and the ladder and the 40 town projects together cost 29,020, against about 128,000 earned by day 90. The rest goes into the town fund (no end, a Renown token a level): the median regular player holds 481 gold on day 90.

**The same fish sells twice.** Every catch is a codex copy (the Gallery Shop's Sell list) and a bag
copy (the layer's market). One medium-size fish:

| Rarity | Gallery Shop (codex copy) | market (bag copy), Fishing 1 / 20 | Gallery Shop pays |
|---|---|---|---|
| 1 | 20 | 4 / 7 | 5.0× / 2.9× |
| 2 | 60 | 11 / 16 | 5.5× / 3.8× |
| 3 | 200 | 29 / 44 | 6.9× / 4.5× |
| 4 | 450 | 72 / 112 | 6.2× / 4.0× |
| 5 | 750 | 258 / 400 | 2.9× / 1.9× |

A regular player who also sells their codex copies earns 3,474 gold more an active hour
(the `twoshops` run).

**Sources and sinks** (the full table is `data/economy_sources_sinks.csv`):

| Kind | What | Amount | Unit |
|---|---|---|---|
| source | selling fish at the market (the layer) | 1087 | gold per active hour, regular player (Monte Carlo; a fish sells for half its rarity x size x variant value) |
| source | the layer's payouts (ranks, tasks, requests, login calendar, journal) | 519 | gold per active hour, regular player (Monte Carlo) |
| source | selling the same fish again in the Gallery Shop | 3474 | gold per active hour if a player also sells their codex copies (Monte Carlo, two shops) |
| source | one rarity-1 fish, medium size: Gallery Shop / market | 20 / 4 | gold |
| source | one rarity-2 fish, medium size: Gallery Shop / market | 60 / 11 | gold |
| source | one rarity-3 fish, medium size: Gallery Shop / market | 200 / 29 | gold |
| source | one rarity-4 fish, medium size: Gallery Shop / market | 450 / 72 | gold |
| source | one rarity-5 fish, medium size: Gallery Shop / market | 750 / 258 | gold |
| sink | open the main hall | 500 | gold, once |
| sink | open the atrium | 2000 | gold, once |
| sink | first room you build (medium) | 24790 | gold (priced as room 9: a new museum already lists 10 rooms) |
| sink | first room you build, if priced as room 1 | 230 | gold (what the formula was written for) |
| sink | each next room | ×1.8 | price multiplier per room |
| sink | Curator’s Office levels | 500 / 2000 / 8000 / 30000 | gold |
| sink | staff upgrades (3 × 3 levels) | 13600 | gold in all |
| sink | security tiers | 2050 | gold in all |
| sink | decor items | 0 to 2500 | gold each; most pay back their price in about 10 hours of income |
| sink | Gallery Shop piece | 60 to 600 | gold (150% of the rarity price; free while FREE is on) |
| sink | the layer's ladder: boats, rods, lodge rooms, tanks, furniture | 260 to 670; 9,590 in all | gold, 19 items, each unlocked by rank (always charged, FREE or not) |
| sink | the layer's town projects | 19,430 in all | gold, 40 projects |
| sink | the layer's town fund | 450 at rank 5 / 500 at rank 10 / 480 at rank 20 / 480 at rank 30 / 500 at rank 50 | gold a level, without end (each pays a Renown token) |

**The museum's own money loop is unchanged by #195**, and still broken if `FREE` goes off:

1. **The first room is 539 hours of museum income away.** A new museum's room list
   already holds 10 rooms, and two checks count them all: the Curator's Office room limit (4, 6, 9,
   13, then none) keeps the build menu shut until office level 4, 10,500 gold in all; and the build
   menu prices the next room as `roomCost(rooms.length - 1)`, so the first room you build costs what
   the ninth was meant to. `FREE = true` hides both.
2. **Active play outearns the museum 24 times over** (the layer's market alone; 99 times
   with both shops). The tycoon's passive income is decoration next to fishing.
3. **The room curve outruns income.** Each room costs 1.8 times the last; each adds about the same
   income.

**90 days, regular player, `FREE` off** (greedy buyer: main hall, atrium, office levels when cheap
or when the room limit blocks, the best decor per gold, then rooms; the layer's payouts and market
sales at the Monte Carlo's rates; "room count fixed" counts only the rooms you build):

| Run | First room | Rooms by day 90 | Museum income's share of week-1 gold | Next room at day 90 |
|---|---|---|---|---|
| as coded | session 27 (day 14) | 3 | 31% | 1,121 h |
| no selling | session 42 (day 22) | 3 | 47% | 1,121 h |
| two shops | session 15 (day 7) | 4 | 19% | 1,735 h |
| room count fixed | session 1 (day 0) | 12 | 54% | 775 h |
| **H1 design**: room count fixed, and the k-th sale of a day worth 0.5^(k/20) | session 2 (day 0) | 12 | 64% | 775 h |

**H1 in the model**: the H1 design builds its first room in session 2 (bar: 3) and museum income is 64% of week-1 gold (bar: 30%): it passes. The curve problem remains: by day 90 the next room is hundreds of hours of income away in every run.

**Limits.** The layer's ladder and the town fund also take gold in the game; this run spends only on
the museum, to show the museum's loop on its own. The Monte Carlo spends on the layer.


## 10. Monte Carlo of the build as it is

`models/montecarlo.mjs` → `data/mc_summary.json`, `mc_summary.csv`, `figures/mc_novelty_per_day.png`.

**What a simulated player does, every session for 90 days** (real dates from today, real weather,
each island's fixed climate, the real shelf; the progression layer's own code for everything it owns):
1. starts in the museum: talks to the caretaker on the first visit of the day, and to a few guests (they
   give gold or a common mineral or fossil);
2. sails to each home island it digs on (once its boat is open), digs every spot with the brush, runs
   the metal detector once a day once it is earned, talks to the named islanders standing at the dock
   on its first arrival of the day (delivering any request it can and giving a liked gift), and walks
   about (fog, secrets, viewpoints, sparkles); this older checklist gets at most a share of the session;
3. sails to the next expedition its leads point at, when its boat is open (rowboat, sailboat, ice hull);
4. takes anything new on today's Gallery Shop shelf (free while `FREE` is on);
5. fishes for the rest of the session through the layer: `regular` and `heavy` go to the island and
   water most likely to give a species they lack (from the layer's own weights), chase a legendary
   when they hold its clue (with its bait, at a hot spot if it wants one) and fish hot spots half the
   time; `casual` mostly fishes where it is;
6. at the end, the layer's own shopping helper: sells the bag's duplicates, buys the next rung of the
   ladder, pays into the town fund, keeps some bait, wears the best rod; and claims the codex's
   milestone and set gold.

**Profiles** (`common.py`; **assumptions** until telemetry): casual plays 70% of days, one 12-minute
evening session, reel skill 0.45; regular 90% of days, lunch and evening, 18 minutes, skill 0.65; heavy
every day, three 30-minute sessions, skill 0.85. Players per run: casual 800, regular 800, heavy 160 (variants and the spring start run fewer; P99 is the 99th of those players).

**The world as built.** The world layer finds an island by its map id (diagnosis.md, fault 4), so the
model places secrets, clues and named islanders the way the game does: Main Island and Island One get
theirs, every other island 3 secrets and nobody.

**Variants.** `nopity`: the layer's rare and epic pity ramps off (H8; the legendary hazard stays, since
it is the only way a first legendary bites). `strip`: the `?progression=off` build, the flag the game
reads (every rod, boat, region, gear and perk open; no payouts). `twoshops`: the player also sells
codex copies in the Gallery Shop. `regionfix`: the world as `regions.json` describes it (every island's
secrets, clue and islanders), to price fault 4.

**Not modelled.** Riddlers and cracked rock (no shipped map places them); the dig-site bonus (no three
touching spots of one kind on any home island); the story's shortcut leads; festival tasks, the weekly
derby and the weekly rumour (its spot is never set); paintings and famous visitors (owned and present
from the start). The game places secrets at random points (seeded per install), so finding them is an
assumption: a mean of 12 minutes of walking an island per secret.

**What fault 4 costs** (by day 90, P50; as built / with the world as `regions.json` describes it):

| Profile | secrets found (as built / fixed) | named islanders met | legendaries caught | fish species | share of obtainable | drought P50 |
|---|---|---|---|---|---|---|
| casual | 17 / 25 | 3 / 10 | 0 / 0 | 30 / 31 | 72% / 72% | 37 min / 38 min |
| regular | 26 / 34 | 3 / 11 | 2 / 5 | 50 / 54 | 86% / 88% | 34 min / 33 min |
| heavy | 29 / 46 | 3 / 11 | 2 / 5 | 52 / 55 | 88% / 90% | 41 min / 31 min |

**Results** (active play P50 / P90 / P99, then the median calendar day; "never" means not within 90
days):

| Milestone | casual | regular | heavy |
|---|---|---|---|
| first rare (rarity 3+) | 6 min / 6 min / 6 min (day 0) | 9 min / 9 min / 9 min (day 0) | 9 min / 10 min / 10 min (day 0) |
| first epic or better (rarity 4+) | 2.1 h / 3.5 h / 3.7 h (day 13) | 14 min / 1.8 h / 3.1 h (day 0) | 14 min / 54 min / 1.8 h (day 0) |
| first legendary (rarity 5) | – | 9.4 h / 15.5 h / 46.4 h (day 16) (99% by day 90) | 7.3 h / 14.8 h / 24.8 h (day 4) |
| rank 5 | 24 min / 25 min / 25 min (day 1) | 17 min / 18 min / 18 min (day 0) | 17 min / 24 min / 25 min (day 0) |
| rank 10 | 2.2 h / 2.4 h / 2.6 h (day 13) | 2.0 h / 2.1 h / 2.1 h (day 3) | 1.5 h / 1.9 h / 1.9 h (day 0) |
| rank 20 | – | 9.7 h / 10.1 h / 10.3 h (day 17) | 9.5 h / 9.8 h / 10.4 h (day 6) |
| rank 30 | – | 23.4 h / 24.2 h / 24.6 h (day 42) | 22.5 h / 22.9 h / 23.0 h (day 14) |
| rank 50 | – | – | 67.1 h / 67.6 h / 68.1 h (day 44) |
| unlock: boat:rowboat | 12 min / 13 min / 13 min (day 0) | 17 min / 17 min / 18 min (day 0) | 17 min / 18 min / 18 min (day 0) |
| unlock: boat:sailboat | 2.2 h / 2.4 h / 2.6 h (day 13) | 2.0 h / 2.1 h / 2.1 h (day 3) | 1.5 h / 1.9 h / 1.9 h (day 0) |
| unlock: boat:icehull | – | 23.4 h / 24.2 h / 24.6 h (day 42) | 22.5 h / 22.9 h / 23.0 h (day 14) |
| expedition done: pirate | 45 min / 46 min / 46 min (day 3) | 36 min / 37 min / 37 min (day 0) | 53 min / 53 min / 53 min (day 0) |
| expedition done: north | – | 23.7 h / 24.8 h / 24.9 h (day 43) | 23.0 h / 23.4 h / 23.5 h (day 15) |
| metal detector (10 finds) | 28 min / 46 min / 47 min (day 3) | 42 min / 42 min / 43 min (day 1) | 65 min / 66 min / 66 min (day 0) |
| first colour variant | 21 min / 12.3 h / never (day 2) (92% by day 90) | 17 min / 1.5 h / 3.3 h (day 1) | 17 min / 57 min / 83 min (day 0) |
| first trophy size | 42 min / 4.7 h / 10.1 h (day 3) | 52 min / 1.5 h / 4.6 h (day 1) | 17 min / 25 min / 78 min (day 0) |
| 25 fish species | 7.5 h / 8.9 h / 12.3 h (day 44) | 2.1 h / 2.7 h / 3.3 h (day 3) | 73 min / 87 min / 2.4 h (day 0) |
| 40 fish species | – | 18.6 h / 19.7 h / 20.5 h (day 33) | 23.0 h / 23.5 h / 23.5 h (day 15) |
| 60 fish species | – | – | – |
| page complete: fish | – | – | – |
| 50% of everything obtainable | 3.4 h / 3.8 h / 4.5 h (day 20) | 4.6 h / 5.2 h / 5.8 h (day 8) | 6.3 h / 7.8 h / 7.8 h (day 4) |
| 75% of everything obtainable | never / never / never (day never) (1% by day 90) | 19.0 h / 20.0 h / 21.5 h (day 33) | 34.9 h / 36.4 h / 39.4 h (day 23) |
| 100% of everything obtainable | – | – | – |

**Rank against the layer's own targets** (its table in docs/PROGRESSION.md is for its own `casual`
profile, which plays at half efficiency, and `hardcore`):

| Rank | the layer's spec target | its sim: casual / hardcore | here: casual | regular | heavy |
|---|---|---|---|---|---|
| 2 | 3 min | 2 min / 2 min | 6 min | 9 min | 10 min |
| 5 | 25 min | 26 min / 14 min | 24 min | 17 min | 17 min |
| 10 | 3 h | 2.7 h / 2.1 h | 2.2 h | 2.0 h | 1.5 h |
| 20 | 15 h | 15.0 h / 10.2 h | never (0% by day 90) | 9.7 h | 9.5 h |
| 30 | 40 h | 40.4 h / 22.6 h | never (0% by day 90) | 23.4 h | 22.5 h |
| 50 | 140 h | 143.3 h / 65.5 h | never (0% by day 90) | never (0% by day 90) | 67.1 h |

**Droughts.** The longest stretch of active play with nothing new, in a player's first 10 active
hours:

| Profile | drought P50 | drought P99 | P99 without the rare and epic pity ramps | longest gap with no progress tick at all, P99 |
|---|---|---|---|---|
| casual | 37 min | 83 min | 84 min (1% shorter with pity) | 2 min |
| regular | 34 min | 59 min | 66 min (11% shorter with pity) | 2 min |
| heavy | 41 min | 81 min | 84 min (4% shorter with pity) | 2 min |

Against the 36-minute ceiling (hypotheses.md), the median drought is 37 min for a casual player, 34 min for a regular one and 41 min for a heavy one. With the layer's pity the worst droughts (P99) are: casual 1% shorter, regular 11% shorter, heavy 4% shorter. **H8: fails the 25% bar.** The pity ramps raise the chance of a rare or epic *tier*, not of something you lack, so they cannot reach droughts that come from having caught what bites here and now. The layer's own measure, the longest stretch with no progress tick at all, is 2 min at P99 for a regular player, because every catch pops XP: it measures volume, not novelty.

**The strip build** (`?progression=off`: everything open, nothing paid out), against the build as is:

| Profile | fish species by day 90 (as is / strip) | share of obtainable by day 90 | drought P50 | active time to half of everything |
|---|---|---|---|---|
| casual | 30 / 33 | 72% / 73% | 37 min / 37 min | 3.4 h / 3.3 h |
| regular | 50 / 51 | 86% / 86% | 34 min / 33 min | 4.6 h / 4.6 h |
| heavy | 52 / 52 | 88% / 88% | 41 min / 38 min | 6.3 h / 5.0 h |

Opening every boat, rod, region and perk from the start, and paying nothing out, changes little in what a player finds: by day 90 casual 30 species as built and 33 stripped, regular 50 species as built and 51 stripped, heavy 52 species as built and 52 stripped. What paces new things is the calendar, the conditions and what is left to find, not the gates; the gates mostly decide *when in the first days* a place opens. The strip build earns less (174 an hour of layer payouts against 519), which is the point of the test: whether players notice (H0, H5, H6).

**What the fish page can't give.** 4 of the 72 fish can never bite (diagnosis.md), and 12 are festival fish that bite only in their festival's dates; so no profile completes the fish page within 90 days (casual 0%, regular 0%, heavy 0%). By day 90 the median regular player has 50 species, the heavy one 52.

All runs at a glance:

| Run | drought P50 / P90 / P99 (first 10 active h) | longest gap with no progress tick at all, P99 | minutes since last new thing at day 90, P50 | share of obtainable collected by day 90, P50 | fish species by day 90, P50 | rank by day 90, P50 | active hours by day 90, P50 |
|---|---|---|---|---|---|---|---|
| casual, autumn start (today), base | 37 min / 60 min / 83 min | 2 min | 14 min | 72% | 30 of 72 | 18 | 14 |
| casual, autumn start (today), nopity | 37 min / 61 min / 84 min | 2 min | 14 min | 72% | 30 of 72 | 18 | 14 |
| casual, autumn start (today), strip | 37 min / 59 min / 85 min | 2 min | 26 min | 73% | 33 of 72 | 19 | 14 |
| casual, autumn start (today), regionfix | 38 min / 60 min / 87 min | 2 min | 25 min | 72% | 31 of 72 | 19 | 14 |
| regular, autumn start (today), base | 34 min / 37 min / 59 min | 2 min | 1.6 h | 86% | 50 of 72 | 40 | 49 |
| regular, autumn start (today), nopity | 35 min / 36 min / 66 min | 2 min | 1.8 h | 86% | 50 of 72 | 40 | 49 |
| regular, autumn start (today), strip | 33 min / 39 min / 58 min | 2 min | 1.6 h | 86% | 51 of 72 | 40 | 49 |
| regular, autumn start (today), twoshops | 34 min / 37 min / 56 min | 2 min | 1.6 h | 86% | 50 of 72 | 40 | 49 |
| regular, autumn start (today), regionfix | 33 min / 37 min / 50 min | 2 min | 1.9 h | 88% | 54 of 72 | 40 | 49 |
| heavy, autumn start (today), base | 41 min / 61 min / 81 min | 2 min | 27.4 h | 88% | 52 of 72 | 72 | 135 |
| heavy, autumn start (today), nopity | 39 min / 58 min / 84 min | 2 min | 21.3 h | 88% | 52 of 72 | 72 | 135 |
| heavy, autumn start (today), strip | 38 min / 57 min / 1.6 h | 2 min | 27.4 h | 88% | 52 of 72 | 72 | 135 |
| heavy, autumn start (today), regionfix | 31 min / 50 min / 78 min | 2 min | 30.9 h | 90% | 55 of 72 | 72 | 135 |
| casual, spring start, base | 49 min / 74 min / 1.6 h | 2 min | 12 min | 67% | 24 of 72 | 18 | 14 |
| regular, spring start, base | 35 min / 44 min / 62 min | 2 min | 76 min | 87% | 52 of 72 | 40 | 49 |
| heavy, spring start, base | 46 min / 61 min / 1.5 h | 2 min | 16.2 h | 88% | 52 of 72 | 72 | 135 |


## 11. Pacing at four horizons

`models/pacing.py` → `data/pacing.json`, `figures/pacing.png`. New things per session (mean, Monte
Carlo, autumn start):

|  | session 1 | week 1 | day 30 | day 60 | day 90 | the week ahead first averages under one new thing a session |
|---|---|---|---|---|---|---|
| casual | 18.90 | 12.25 | 2.31 | 0.51 | 0.39 | day 51 |
| regular | 19.19 | 8.93 | 0.91 | 0.19 | 0.10 | day 19 |
| heavy | 23.04 | 7.65 | 0.45 | 0.02 | 0.01 | day 16 |

A regular player's week ahead first averages under one new thing a session on day 19 (casual day 51, heavy day 16). **H3 (at least one a session through day 30) is predicted to fail.** Before #195 the first pass's model put the regular player under one a session from day 12; the layer's species, secrets, variants and trophies bought a week.

**The scripted session agrees.** 40 minutes on Island One by day with the starting rod, in real time:
22 new things, 13 in the first 4 minutes, then a rowboat and a rod from rank-ups and, spread over the
rest, 3 trophy sizes and 2 ghost variants; the longest stretch with nothing new was 11.6 minutes
(`figures/density-scripted-session.png`). Before #195 the same bot found its last new thing at minute
12 and then nothing for 48 minutes.

### The elder game

**Day 60, a regular player, an 18-minute session** (the Monte Carlo's average session in days 57 to 63):

| Activity | minutes a session |
|---|---|
| fishing | 7.8 |
| museum guests | 2.2 |
| the metal detector | 2.2 |
| digging | 2.1 |
| walking about | 2.0 |
| sailing | 1.0 |
| talking to named islanders | 0.8 |
| **all** | **18.1** |

| New things from | a session |
|---|---|
| colour variants | 0.06 |
| unlocks | 0.06 |
| trophy sizes | 0.05 |
| the Gallery Shop's shelf | 0.02 |
| **all** | **0.19** |

**Why that player still logs in.** At day 60 a session brings 0.19 new things, most of them colour variants, unlocks, trophy sizes. What the layer adds every session regardless is meters: XP, a skill bar, a task ticked, the login calendar, the event track (rewards.md). Whether those bring a player back is exactly what H2 and H14 test; the evidence so far is that they are expected, attendance- and volume-contingent rewards, the kind the meta-analysis warns about.

**The elder game to aim for** (a proposal; H3, H9, H10, H11 and H14 test its parts). A 20-minute day-60
session:

| Minutes | What | Why they came back |
|---|---|---|
| 0 to 3 | Letters and the shelf: a rumour sends you back to a done island; today's Gallery Shop piece | something only today has |
| 3 to 11 | A hunt with a condition: tonight's rain at a hot spot for a legendary whose clue you found; a trophy-size catch of a fish you've had for weeks; a variant | the long tail the layer built: variants, trophies, legend trails |
| 11 to 16 | Restore what you brought home and put it on display; finish a set's plaque | the reveal, and the museum getting better |
| 16 to 20 | A friend's museum, or rearranging a hall | Design, and other people |

The month's content drop (a fish set, an island, a visitor's chain) is what makes each month's
version of that session different.

