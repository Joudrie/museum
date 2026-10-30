# Phase 1: ground truth

Steps 1 to 4. Rerun with `python3 docs/progression/run_all.py`. Measured on `main` after the progression
layer merged (#195, 2026-10-29); where the first pass (before #195) differs, both are given.

## 1. Content inventory

`tools/inventory.mjs` counts everything from the game's own modules and map files (nothing typed in
by hand) and writes `data/content_inventory.csv` (one row per kind of content) and
`content_inventory.json` (the detail). Reading time is words at 200 a minute, an **assumption**
to replace with real reading times from the event log.

| | Count | Notes |
|---|---|---|
| Collection entries | 222 in 19 collections (168 before #195) | plus 3 kinds of junk; the layer added 54 fish (42 species and 12 festival fish), now 72 in 5 rarities |
| …that play can hand out | 147 (97 before #195) | fishing, digging, gifts, hunts, expeditions, the Gallery Shop (`models/montecarlo.mjs` OBTAINABLE) |
| …fish that can never bite | 4 | sturgeon, anglerfish, coelacanth, oarfish: their weather never happens where they live (diagnosis.md) |
| …owned from the start | 49 paintings | `ownership: 'all'`; every painting is rarity 1 until the rarity proposal is approved |
| …met all at once | 19 famous visitors | all stand in the main hall |
| …only from the Gallery Shop | 36 | shells, insects, ship models, glass flowers, armour, clocks, inventions and most meteorites: no shipped map has a shore or crater dig spot (an island drawn in the builder can) |
| …that nothing on the shipped maps hands out | 3 | the Inverted Jenny and Treskilling Yellow stamps (rarity 4; the shop never stocks rarity 4, so nothing can), and the Widmanstätten meteorite (only from a crater spot on a builder island) |
| Words of text | 11,783 (10,926 before) | the new fish blurbs add 857 |
| Islands | 3 home, 7 expedition | dig spots: Main Island 3 mineral, the far isle 2 mineral, Island One 2 mineral and 2 fossil; no shore, crater or ruin spots anywhere |
| Decor items | 98 | 31 columns added |
| Goals | 19 (4,500 gold in all) | two are already met on a new save (diagnosis.md) |
| Sets | 33 | 26 collection sets and 7 artist sets |
| Unlocks | 5 rods, 4 boats, 3 gear, 50 perks, 3 dig tools, the metal detector | rods, boats and gear come with ranks; boats and rods are then bought |
| **The progression layer** | 50 ranks, 5 skills × 20 levels, 11 named islanders, 10 regions, 66 secrets, 30 viewpoints and island places, 66 cosmetics, 19 ladder items and 40 town projects, 10 baits and 3 lures, 4 events a year | `data/content_inventory.csv`, category `layer` |

## 2. Production cost

`tools/production.py` reads the repo's history and the review queue.

- **Calendar so far:** 9 days (2026-10-21 to 2026-10-29), **184 pull requests merged, about 20 a
  day** (170 when this was first measured, the same morning). Building is not the constraint;
  parallel chats ship faster than anyone can play. The whole progression layer went in as one PR (#195: 105 files,
  about 13,900 lines added).
- **Waiting on one person:** 82 painting drafts and 25 archaeology drafts (107 sourced entries,
  2.2 times the 49 paintings in the game), 69 Painting of the Day lines, 49 rarity proposals and 11
  image proposals. None approved.
- **What only the developer knows** is in `data/production_cost.csv` as FILL_IN: minutes to approve
  one entry, write and check one NPC, paint one island in the builder, decide one event, and redraw
  one sprite (all art is placeholder until the user redraws it by hand). Until answered, the models
  use the assumption column (10, 20, 90, 240 and 30 minutes) and say so.

**Needs Sean (FILL_IN):** those five numbers, and the hours a week you can give to approving and
drawing.

## 3. First-hour log

**Instrumented.** Every build now keeps a log of what happens (telemetry.md). To capture a real
first hour on the phone:

1. Open the game with `?evlog` on a fresh save (Settings, Reset museum, two taps), and play for an hour as you normally would.
2. Tap **Share file** in the log panel and send the file.
3. `python3 docs/progression/analysis/analyze.py density <file>` draws new things and progress per
   minute and lists every gap of over 2 minutes with neither.

**Scripted.** `tests/measure.cjs` with `MODE=session` plays in real time (no sped-up timers):
fishing and digging on Island One the way an efficient player would, playing the reel with a simple
bot that holds while the hook zone is below the fish (checked every 60 ms). Its log is
`data/logs/scripted-session.json`, its density chart `figures/density-scripted-session.png`, and the
cycle times it measured feed the models (`common.py` reads them). It is a bot, so it shows the
pacing of the home loop, not a newcomer's first hour.

**What 40 minutes measured** (2026-10-29, after #195, Island One by day, the starting rod; nothing
else running): 123 casts, one every 18.7 seconds (median): a bite wait of 7.1 s, a reel of 7.8 s,
and 4.5 s for the cast, the card and the recast. The bot lost none in the reel; 6 casts were junk.
**22 new things**: 13 in the first 4 minutes (8 fish, 4 dug finds, the island itself), a rowboat
and a rod from rank-ups, then 3 trophy sizes and 2 ghost variants (the Harvest festival makes ghosts
1 in 40) spread over minutes 5 to 37. The longest stretch with nothing new was 11.6 minutes; there
was never a stretch of 2 minutes with nothing at all (an XP pop comes with every catch).

**Before #195** the same bot fished an hour with the starter bobber: a cast every 12.3 seconds, 15
new things, 14 of them in the first 5.5 minutes and the last at minute 12, then 48 minutes with
nothing new (`data/logs/scripted-session-before-195.json`). The layer's variants and trophy sizes are
what fill the second half of the session now.

## 4. Comparison kit

**For the developer, by hand:** `data/comparison_log_template.csv`. Play the first 3 hours of each
game below, from a new save, with a stopwatch running. Log a row every time something is given,
unlocked or shown for the first time.

| Game | Why it's here |
|---|---|
| Dredge | fishing, a catalogue, boat upgrades, rare variants |
| Stardew Valley | the daily rhythm, unlocks over time, collection bundles |
| A mainline Pokémon game | collecting with conditions (time, place), talking to townspeople |
| Animal Crossing: New Horizons | real-time seasons, the museum, fish by month and hour |

Kinds to log: start, reward, unlock, new mechanic, new place, new character, goal shown, currency,
quit. "Felt" is 1 to 5, your gut at that moment. Compare the rows' spacing with our density chart.

**Steam reviews:** `tools/steam_reviews.py` pulls negative reviews for Dredge and Stardew Valley,
buckets them by the hours played when written, and codes the complaints with a dictionary you can
edit. **Not run:** this sandbox cannot reach store.steampowered.com and that is not worked around.
Run it from anywhere that can (`STEAM=1 python3 docs/progression/run_all.py`). It writes only counts,
never review text.
