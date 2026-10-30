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

{{BUILT_TABLE}}

## How this was checked

- **Every claim traces to code, a log, a model output or a cited source.** The numbers above come from
  `data/` (CSV and JSON written by the scripts; this file is written from them by `tools/compose.py`).
  The Monte Carlo calls the progression layer's own functions, so its fishing, pity, payouts and prices
  cannot drift from the game's.
- **Reproducible:** `python3 docs/progression/run_all.py` reruns everything; every simulated player and
  the layer's own dice are seeded, and `tools/check_repro.py` reruns one Monte Carlo run and compares
  it with `data/` ({{REPRO}}).
- **An independent check:** {{INDEPENDENT}}
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
