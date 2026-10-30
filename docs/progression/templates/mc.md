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
every day, three 30-minute sessions, skill 0.85. {{N_TEXT}}

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
assumption: a mean of {{EXPLORE_MIN}} minutes of walking an island per secret.

**What fault 4 costs** (by day 90, P50; as built / with the world as `regions.json` describes it):

{{FIX_TABLE}}

**Results** (active play P50 / P90 / P99, then the median calendar day; "never" means not within 90
days):

{{MILESTONES}}

**Rank against the layer's own targets** (its table in docs/PROGRESSION.md is for its own `casual`
profile, which plays at half efficiency, and `hardcore`):

{{RANK_TABLE}}

**Droughts.** The longest stretch of active play with nothing new, in a player's first 10 active
hours:

{{DROUGHT_TABLE}}

{{DROUGHT_TEXT}}

**The strip build** (`?progression=off`: everything open, nothing paid out), against the build as is:

{{STRIP_TABLE}}

{{STRIP_TEXT}}

**What the fish page can't give.** {{CALENDAR_TEXT}}

All runs at a glance:

{{RUNS}}
