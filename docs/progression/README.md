# Progression: evidence first, then design (Chat 18)

Start with **[REPORT.md](REPORT.md)**: the three findings that most change what should be built.

Everything here describes `main` after the progression layer merged (#195, `src/progression/`,
`docs/PROGRESSION.md`) on 2026-10-29. A first pass measured the build before it; where the layer
changed an answer, the docs say so.

| Step | File |
|---|---|
| 1-4 Ground truth: inventory, production, first-hour log, comparison kit | [ground-truth.md](ground-truth.md) |
| 5-7 Diagnosis: strip test, core loop audit, player definition | [diagnosis.md](diagnosis.md) |
| 8-11 Models: content velocity, economy, Monte Carlo, pacing, the elder game | [models.md](models.md) |
| 12 Pre-registered hypotheses | [hypotheses.md](hypotheses.md) |
| 13 Every reward labelled | [rewards.md](rewards.md) |
| 14-15 The spine and the telemetry schema | [telemetry.md](telemetry.md) |
| 16-17 Analysis scripts, playtest and diary protocol | [analysis/analyze.py](analysis/analyze.py), [playtest-protocol.md](playtest-protocol.md) |
| 18 Experiment plan and sample sizes | [experiments.md](experiments.md) |

## One command

```sh
pip install --break-system-packages numpy pandas matplotlib scipy lifelines
python3 docs/progression/run_all.py            # SCALE=0.2 for a quicker Monte Carlo (about 1.5 h on 2 cores in full)
python3 docs/progression/tools/check_repro.py  # reruns one Monte Carlo run; must match data/ exactly (same day)
```

It reruns, from the game's current code: the parameter export, the inventory, the production
history, the reel by skill, the Monte Carlo, the economy, content velocity, pacing, the sample
sizes, the reward density of the scripted session, and a dry run of the beta analysis on synthetic
players. Every number in the docs comes from one of these outputs in `data/` (or is marked
assumption or FILL_IN). `models.md` and `REPORT.md` are written from those outputs too.

The 40-minute scripted session is separate (it plays in real time):

```sh
npm run build && npx vite preview --port 4173 --base / --strictPort &
MODE=session MINUTES=40 OUT=docs/progression/data/logs node tests/measure.cjs
node docs/progression/tools/islands_probe.cjs   # what the world layer really places on each island
```

## Where the numbers come from

- `models/montecarlo.mjs` **plays the progression layer's own code** in Node (`prepareCast`, the reel
  bot, `completeCast`, ranks, skills, tasks, requests, the market, the login calendar), so fishing's
  odds, pity, hot spots, sizes, variants and payouts are not copied anywhere: they are the game's.
  Around it, digs, the metal detector, guests, expeditions and the shelf come from `data/params.json`.
- `tools/export_params.mjs` loads the game's modules in Node (a small shim stands in for the browser
  and Phaser): the real `pick()`, the real weather calendar and island climates, the real Gallery
  Shop shelf, the layer's species rules, ladder and ranks, and which fish can never bite.
- `models/common.py` holds every assumption about players in one place (`ASSUMPTIONS`, `PROFILES`;
  `python3 models/common.py` writes them to `data/assumptions.json` for the JS model). Change them
  there when telemetry or the developer answers a FILL_IN, and rerun.

## Links that change the build

`?progression=off` (the strip test: the progression layer and the older goals and dailies go quiet),
`?flags=-rank,-daily,-goals,-unlocks,-payouts,-fanfare,-variants` (one at a time), `?progression=on`
(clear), `?evlog` (copy or share this phone's event log), `?beta=1` (the telemetry consent card, once
a PostHog key is set in `src/measure/telemetry.js`). Code: `src/measure/`; test: `node tests/measure.cjs`.
