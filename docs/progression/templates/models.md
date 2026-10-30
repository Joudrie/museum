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
bite wait, the reel's own length, and {{OVERHEAD}} for the cast, the card and the recast; brushing a
dig takes {{BRUSH}}.

**The reel by skill** (`tools/reel_skill.mjs`: the layer's reel and bot, {{REEL_N}} fights a cell):

{{REEL_TABLE}}

A common fish is landed at any skill; a rare one rewards skill; an epic or a legendary needs it. The
profiles use the layer's own sim values (casual 0.45, heavy 0.85) and 0.65 for a regular player.

## 8. Content velocity

`models/content_velocity.py` → `data/content_velocity.csv`, `multipliers.csv`, `content_velocity.json`.

**Player-hours per unit of content.** Play can hand out {{OBTAINABLE}} entries. {{CV_TEXT}}
All {{WORDS}} words of text take about an hour to read once.

**Runway.** {{RW_TEXT}}

**What a subscription would need.** At one new thing a session (H3), a regular player needs about
{{NEED_REGULAR}} new things a month and a heavy one {{NEED_HEAVY}}. At the **assumed** 10 developer
minutes per entry (FILL_IN), that is {{NEED_REGULAR_H}} and {{NEED_HEAVY_H}} hours a month of approving
and drawing, every month.

**Where new things come from once the first flood is over** (regular player, new things per session;
`multipliers.csv`):

{{SOURCES_TABLE}}

{{SOURCES_TEXT}}

{{ECON}}

{{MCSECTION}}

{{PACING}}
