# Step 12: pre-registered hypotheses

**Rules.** Each line says: adding X moves metric Y from A to B within N days, measured by M; and
what happens if it doesn't. Thresholds are set here, on 2026-10-29, **before any beta data exists**,
and this file is committed before the beta starts. A threshold is never edited after data arrives;
add a dated note under it instead.

**Revised once, before any data.** The first draft (earlier on 2026-10-29) described the build before
the progression layer merged (#195). The same day, still with no player data, the definitions and the X
column were rewritten for the build with the layer, H8 was re-pointed at the layer's own pity, and H14
and H15 were added. Thresholds that did not depend on the layer are the first draft's. The first draft is
in git history.

**Baselines.** Where A says "control week 1", it is the `on` arm's value in the first full week
of the beta, written in the dated notes when known; B is then fixed relative to it. Where a
metric can be checked now, the Monte Carlo's prediction for the current build is given (models.md);
those are predictions, not baselines.

**Metric definitions** (all from the event log, telemetry.md; `analysis/analyze.py` and
`models/montecarlo.mjs` use the same ones):
- *session*: `session_start` to its last `session_end`; *active minutes*: `session_end.activeMs`.
- *new thing*: a `collect` with `fresh` (a species or museum piece never had), an `unlock` (a rod, boat,
  gear, room, dig tool or the metal detector), `lead_found`, `expedition_done`, `famous_met`,
  `story_beat`, `place_found`, `secret_found`, `viewpoint`, a species' first colour variant or first
  trophy size (from `catch`), or the first talk with a named islander (from `npc_talk`). Not new: XP,
  ranks, skill levels, hearts, gold, tasks.
- *Dn retention*: the share of players with a `session_start` on day n after their first (players
  observed for at least n+1 days).
- *churn*: no `session_start` for 14 days.
- *drought*: the longest stretch of active minutes with no new thing, within a player's first 10
  active hours.

| # | Adding X | Metric Y | From A to B | Within | Measured by | If not |
|---|---|---|---|---|---|---|
| H0 | nothing (the strip test: `off` arm, no rank, goals, payouts, daily layer, unlock pacing or fanfare) | the bare loop holds a first-time player | ≥ 5 of 8 testers repeat an activity 3+ times unprompted; ≥ 4 of 8 name a next thing they want | the 15-minute session | think-aloud sheets (playtest-protocol.md A) | the core loop is the first job; the layer waits |
| H1 | a money loop: `FREE` off, the first built room priced as room 1, and duplicate sales worth less the more you sell in a day | the first room you build | at most 3 sessions after install (P50), and museum income ≥ 30% of gold earned in week 1 | 7 days | `room_built`; `coins` deltas split by whether a `sold` or `purchase` came within 1 s | redesign prices before `FREE` goes off for anyone |
| H2 | the daily layer (gift, wheel, tasks, login calendar, streak and shields, away letter) | D7 retention | control week 1 → +5 points vs `no-daily`; or time-to-churn hazard ratio ≤ 0.8 | 14 days | `session_start` | under +2 points: remove the wheel and the calendar; test the gift and tasks alone the same way |
| H3 | (the current build, as is) | new things per session, median, players with 2+ sessions a day | ≥ 1.0 through day 30 | 30 days | new-thing events per session | below 1.0 before day 30: content velocity work (models.md) comes before any subscription test |
| H4 | goals (the goal pill, the Goals tab, the older goals list, stuck nudges) | sessions per player, days 0 to 6 | control week 1 → +15% relative vs `no-goals` | 7 days | `session_start` | under +5%: remove the pill's goal and the list; keep goals only as journal hints |
| H5 | unlock pacing (rods, boats and regions by rank; gear; perks; dig tools; the detector) | D1 retention, and whether players say a rod, boat or island is something they want | not lower than `open-unlocks` by more than 3 points; ≥ half of think-aloud testers name one as a goal | 2 days | `session_start`; sheets | `open-unlocks` equal or better: drop the gating |
| H6 | payouts (gold and items for sets, milestones, goals, tasks, requests, ranks, hearts) | sessions per player, days 0 to 13 | control week 1 → +10% relative vs `no-payouts` | 14 days | `session_start` | under +3%: remove the gold, keep the plaques and unlocks (rewards.md: expected, completion-contingent) |
| H7 | fanfare (cards, confetti, rank ceremonies, journal stamps, "New!") | PENS or UPEQ competence, mean | +0.5 points (7-point scale) vs `no-fanfare` testers, and D1 not lower | the playtest | questionnaire | no difference: keep only the catch card, "New!" and the rarity colour |
| H8 | the layer's rarity pity (rare weight ramps after 25 casts without one, epic after 90) | drought P99, first 10 active hours | the Monte Carlo without the ramps → at least 25% shorter with them | modelled now | `models/montecarlo.mjs` base vs `nopity` | under 25%: it is not the answer to droughts; they are structural (the calendar, the shelf, what is left to find) |
| H9 | colour variants (golden 1 in 400, albino 1 in 800, ghost 1 in 40 at Harvest) | sessions per week, days 14 to 30, players in the top quarter by week-1 sessions | control → +20% relative vs `?flags=-variants` | 30 days | `session_start` | under +5%: remove; put the effort into rumours or events |
| H10 | trophy sizes (the top 2% of every species, a badge and the wall) | the same as H9 | control → +10% relative | 30 days | `session_start` | under +3%: remove the badge. Needs a `trophies` flag, not built yet |
| H11 | famous visitors arriving one or two a day, instead of all 19 at once | new things per session, days 1 to 14; D7 | +0.5 new things per session; D7 not lower | 14 days | events | no lift: keep them all at once |
| H12 | removing the wheel, mess, robbery and the collect-all fee, one at a time | D7 retention | not lower than control by more than 2 points (non-inferiority) | 14 days | `session_start` | lower by more than 2: keep that one |
| H13 | (the core verbs, now with the reel) | think-aloud: fishing and digging repeated past the first catch or find of a kind | ≥ 3 more casts or digs after the first duplicate, for ≥ 5 of 8 testers | the playtest | sheets and `?evlog` | the verbs need depth (diagnosis.md) before more content |
| H14 | the rank layer shown (rank pill, XP pops, skill bars, rank ceremonies) | sessions per player, days 0 to 13 | control week 1 → +10% relative vs `?flags=-rank` | 14 days | `session_start` | under +3%: hide rank and XP; give the 13 rank unlocks to deeds (a place found, a fish caught) |
| H15 | (the layer's economy, as is) | gold earned per active hour from all sources, against the layer's own target for that rank (`market.js goldPerHour`: 400 to 1,000) | within 0.5× to 2× of the target for 80% of players | 14 days | `coins` deltas; `rank_up` | outside it: retune; first make the Gallery Shop stop buying fish the market also buys |

**The drought ceiling.** The target for the worst droughts (H8, and the beta check on real logs) is
**twice the median session length** of the control arm: a player should never go two whole sessions
without something new. Until measured, the median session is the `regular` profile's 18 minutes, so
the ceiling is **36 active minutes** at P99. The diary question "Did anything make you stop?" tests
the reasoning; if entries say "nothing new" at shorter droughts, lower the ceiling with a dated note.

**What a small beta can decide.** experiments.md: 20 to 40 testers settle H0, H5, H7 and H13 (the
playtest ones) and show H3 and H15 directly; they cannot settle H2, H4, H6, H9 to H12 or H14, which
need a public test with hundreds per arm. H1 and H8 are settled in the models before anyone plays.

## Dated notes

Model results only; no player data exists yet. Thresholds above are unchanged since the revision.

- **2026-10-29, H8 (models.md section 10):** fails the bar. With the layer's rare and epic pity ramps the
  drought P99 is 1% shorter for a casual player, 11% for a regular one and 4% for a heavy one than without
  them (the bar is 25%). The ramps raise the odds of a rarity tier, not of something the player lacks.
  Decision: the pity can stay (it costs nothing), but it is not the answer to droughts; don't add more.
- **2026-10-29, H1 (models.md section 9):** the H1 design passes in the model: first built room in
  session 2 (bar: 3), museum income 64% of week-1 gold (bar: 30%). As coded it fails (session 27); if the
  Gallery Shop also buys every fish copy, session 15 and 19%. The beta still has to confirm it.
- **2026-10-29, H3 (models.md section 11):** predicted to fail. A regular player's week ahead first
  averages under one new thing a session on day 19 (heavy day 16, casual day 51), against a bar of 1.0
  through day 30. Before #195 the first pass's model said day 12.
- **2026-10-29, H15 (models.md section 9):** predicted to fail. A regular player earns 2,619 gold an
  active hour from all sources (casual 3,143, heavy 2,205), against the layer's target of 400 to 1,000 for
  the ranks they reach; the museum's daily payouts and the codex's milestone gold are the part the layer's
  sim does not see. Selling codex copies in the Gallery Shop adds 3,474 more.
- **2026-10-29, H5 (models.md section 10, the strip variant):** a prediction, not a result. With every
  rod, boat, region and perk open from the start a regular player has about the same number of species by
  day 90 (51 against 50) and the same median drought (33 minutes against 34) as with the gating; what the gating changes is the
  first days. The beta's D1 comparison decides H5.
- **2026-10-29, the island lookup (diagnosis.md, fault 4):** not a hypothesis, a fault. Until it is fixed,
  H9, H11 and H13 run on a world where 8 of the 10 legendaries and 8 of the 11 named islanders can't be
  reached; write the fix's date here when it lands, and compare only arms that both had it.
