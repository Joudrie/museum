# Independent check of the code claims (2026-10-29)

A separate agent that had not seen how these docs were produced read the source and judged 15 claims,
each with the file and line that decides it. It edited nothing and ran nothing but small reads.

| # | Claim (short) | Verdict | What it added |
|---|---|---|---|
| 1 | `weatherToday()` never returns fog | true | only a `?weather=` link can pin it |
| 2 | Expedition islands use a fixed climate (Reef and Tomb clear summer, North snow) | true | the climate also beats a `?weather=` pin |
| 3 | Sturgeon, oarfish, anglerfish and coelacanth can never bite | true | builder ("wild") islands don't help; three fish sets can't be completed |
| 4 | The oarfish is a legendary with a trail and a clue | true, with a caveat | its trail can't advance anyway: its islander and its clue never appear (the island lookup) |
| 5 | The layer's sim rolls fog about 10% of days | true | it also ignores expedition climates |
| 6 | Rods' `rareMult` is shown but never applied | true | the glow rod's `nightMult` is unused too |
| 7 | The same catch can be sold in both shops; the Gallery Shop pays several times more | true, with a caveat | the market's price includes +3% a Fishing level: 4/11/29/72/258 at level 1, so the ratios are 5.0/5.5/6.9/6.25/2.9 (lower at higher levels); a doubled catch puts 2 in the bag and 1 in the codex; displayed fish can't be sold in the Gallery Shop |
| 8 | Expeditions need the region open (rank unlock, then the boat bought) | true, with a caveat | a lead must also list the island; Skull Isle needs only the rowboat |
| 9 | `FREE = true`; the layer's market is charged anyway | true | the Gallery Shop's buy and buy-back go through `spend()` and are free |
| 10 | 49 paintings, all rarity 1, owned from the start; all 19 famous visitors at once | true | they stand in the main hall only |
| 11 | The reel gets harder with rarity; the bot's lag and noise shrink with skill | true | |
| 12 | Rank unlocks: rowboat 4, cork 5, lantern 8, sailboat 10, boots 12, gloves 18, feather 20, ice hull 30, golden 40 | true | `area:frozen_north` (rank 25) is read by nothing |
| 13 | 66 secrets in regions.json, the first on each island a legend's clue | partly true | Skull Isle has 6, not 5; **in play the world layer looks islands up by map id, so only Main Island and Island One get their secrets, clue and named islanders: about 42 secrets are placed and 8 of the 10 legends can never begin** |
| 14 | The museum's daily gift and wheel still pay beside the layer's calendar and tasks | true | |
| 15 | Codex milestones pay 500 / 1,500 / 5,000 / 12,000 / 50,000 | true | 100% can't be reached while those fish are out of reach |

**The flag hooks.** With no link and nothing saved, every hook in `src/measure/flags.js`'s callers is a
no-op (the variants check runs before any dice roll, so the random sequence is unchanged), and they are
safe in Node.

**Followed up:** claim 13's lookup fault was confirmed in the built game with a browser probe
(`tools/islands_probe.cjs` → `data/world_by_island.json`), and the Monte Carlo now plays the world as built
(with a `regionfix` variant for the world as `regions.json` describes it).
