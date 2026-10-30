# Step 18: the experiment plan

## Arms

Every arm is a link; nothing has to be rebuilt to switch (src/measure/flags.js). The build label is in
every event, so PostHog and `analysis/analyze.py beta` split results by arm.

| Arm | Link | Compares |
|---|---|---|
| on | `?beta=1` | the control: the game with the progression layer |
| off | `?beta=1&progression=off` | the strip test (H0): no rank, goals, payouts, daily layer, unlock pacing or fanfare |
| no-rank | `?beta=1&flags=-rank` | H14 |
| no-daily | `?beta=1&flags=-daily` | H2 |
| no-goals | `?beta=1&flags=-goals` | H4 |
| open-unlocks | `?beta=1&flags=-unlocks` | H5 |
| no-payouts | `?beta=1&flags=-payouts` | H6 |
| no-fanfare | `?beta=1&flags=-fanfare` | H7 |
| no-variants | `?beta=1&flags=-variants` | H9 |

Assign by alternating as people sign up (or by a coin flip per tester), never by who they are.

## Sample sizes

From `models/power.py` (5% two-sided, 80% power). The baselines are placeholders until the
control arm's first week replaces them in hypotheses.md.

| Test | Baseline (placeholder) | Effect | Players per arm |
|---|---|---|---|
| D1 retention | 40% | +10 points | 388 |
| D1 retention | 40% | +5 points | 1,534 |
| D7 retention | 15% | +8 points | 377 |
| D7 retention | 15% | +5 points | 906 |
| D7 retention | 15% | +3 points | 2,402 |
| D30 retention | 6% | +4 points | 721 |
| Time to churn (log-rank) | 85% churn in window | hazard ratio 0.7 | 146 |
| Time to churn (log-rank) | 85% churn in window | hazard ratio 0.6 | 72 |

## What that means for the order of work

1. **The closed beta (20 to 40 people) cannot measure retention differences.** Its job is the
   diary and the logs: *why* people stop, where in their log it happens, and whether the off arm's
   testers keep playing at all (the strip test). Only `on` vs `off` is worth splitting at that size.
2. **The survival test is the most efficient.** Comparing time to churn (log-rank) uses every
   player's whole history, not one day's yes or no, so it needs far fewer players: about 70 to
   150 per arm for a large effect. Use it first for `on` vs `off`.
3. **Single-flag arms wait for a public test** with hundreds of players per arm, and run one at a
   time, each with its threshold written in hypotheses.md before it starts.
4. **Always read cliffs against content.** `analyze.py beta` draws where the fish page, the last
   expedition and 75% of the codex fall for a regular player (Monte Carlo P50) on the survival
   chart. A drop that lines up with one is a content wall, not a progression problem.
