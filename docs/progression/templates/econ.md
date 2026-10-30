## 9. Economy

`models/economy.py` → `data/economy_sources_sinks.csv`, `economy_runs.csv`, `economy_summary.json`,
`figures/economy_rooms.png`. With #195 the game has two economies paying into one wallet: the
museum's (rooms, decor, office, staff; free while `FREE = true`) and the progression layer's (a market
with a price ladder; always charged).

**What an active hour of play earns** (the Monte Carlo, which runs the layer's own code; gold per
active hour, P50 player of each profile):

{{GOLD_TABLE}}

**Against the layer's own design.** The layer prices its ladder at 20 to 40 minutes of a target earn
rate of 400 to 1,000 gold an hour (`market.js ladder()`, `config.js economy.goldPerHour`, measured by
its own sim). {{GOLD_TEXT}}

**The same fish sells twice.** Every catch is a codex copy (the Gallery Shop's Sell list) and a bag
copy (the layer's market). One medium-size fish:

{{TWO_SHOPS_TABLE}}

A regular player who also sells their codex copies earns {{TWOSHOPS_EXTRA}} more an active hour
(the `twoshops` run).

**Sources and sinks** (the full table is `data/economy_sources_sinks.csv`):

{{SINKS_TABLE}}

**The museum's own money loop is unchanged by #195**, and still broken if `FREE` goes off:

1. **The first room is {{FIRST_ROOM_H}} hours of museum income away.** A new museum's room list
   already holds 10 rooms, and two checks count them all: the Curator's Office room limit (4, 6, 9,
   13, then none) keeps the build menu shut until office level 4, 10,500 gold in all; and the build
   menu prices the next room as `roomCost(rooms.length - 1)`, so the first room you build costs what
   the ninth was meant to. `FREE = true` hides both.
2. **Active play outearns the museum {{RATIO}} times over** (the layer's market alone; {{RATIO2}} times
   with both shops). The tycoon's passive income is decoration next to fishing.
3. **The room curve outruns income.** Each room costs 1.8 times the last; each adds about the same
   income.

**90 days, regular player, `FREE` off** (greedy buyer: main hall, atrium, office levels when cheap
or when the room limit blocks, the best decor per gold, then rooms; the layer's payouts and market
sales at the Monte Carlo's rates; "room count fixed" counts only the rooms you build):

{{ECON_ROWS}}

{{H1_TEXT}}

**Limits.** The layer's ladder and the town fund also take gold in the game; this run spends only on
the museum, to show the museum's loop on its own. The Monte Carlo spends on the layer.
