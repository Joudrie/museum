"""Reruns every measurement and model, in order, from the game's current code.

    python3 docs/progression/run_all.py            # everything (the Monte Carlo is the slow part: about 1.5 h on 2 cores)
    SCALE=0.2 python3 docs/progression/run_all.py  # a quicker Monte Carlo (a fifth of the players)
    STEAM=1 python3 docs/progression/run_all.py    # also pull Steam reviews (needs network to Steam)

Needs: node (the repo's), python3 with numpy, pandas, matplotlib, scipy, lifelines
(pip install --break-system-packages numpy pandas matplotlib scipy lifelines).
Day 0 of the models is pinned to the export of 2026-10-29 20:30 EDT (tools/export_params.mjs), and
the steps run in New York time, so a rerun on any day gives the same numbers; MODEL_START=now models
from today instead.
The scripted session (tests/measure.cjs MODE=session) is not rerun here: it plays in real
time for 40 minutes. Its last output, data/logs/scripted-session.json, is read if present.
"""
import os
import subprocess
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
NODE = ['node', '--import', './docs/progression/tools/register.mjs']
STEPS = [
    ('params from the game code', NODE + ['docs/progression/tools/export_params.mjs']),
    ('1 content inventory', NODE + ['docs/progression/tools/inventory.mjs']),
    ('2 production history and review queue', [sys.executable, 'docs/progression/tools/production.py']),
    ('assumptions for the JS model', [sys.executable, 'docs/progression/models/common.py']),
    ('the reel by skill', NODE + ['docs/progression/tools/reel_skill.mjs']),
    ('10 Monte Carlo (the progression layer in Node)', NODE + ['docs/progression/models/montecarlo.mjs']),
    ('9 economy', [sys.executable, 'docs/progression/models/economy.py']),
    ('8 content velocity', [sys.executable, 'docs/progression/models/content_velocity.py']),
    ('11 pacing', [sys.executable, 'docs/progression/models/pacing.py']),
    ('18 sample sizes', [sys.executable, 'docs/progression/models/power.py']),
    ('the Monte Carlo reproduces itself', [sys.executable, 'docs/progression/tools/check_repro.py']),
]
if (HERE / 'data' / 'logs' / 'scripted-session.json').exists():
    STEPS.append(('3 reward density of the scripted session', [sys.executable, 'docs/progression/analysis/analyze.py', 'density', 'docs/progression/data/logs/scripted-session.json']))
STEPS.append(('16 analysis dry run on SYNTHETIC players', ['sh', '-c', f'{sys.executable} docs/progression/analysis/analyze.py synthetic 400 && TAG=synthetic {sys.executable} docs/progression/analysis/analyze.py beta docs/progression/data/logs/synthetic/*.json']))
STEPS.append(('models.md and REPORT.md from the outputs', [sys.executable, 'docs/progression/tools/compose.py']))
if os.environ.get('STEAM'):
    STEPS.append(('4 Steam reviews', [sys.executable, 'docs/progression/tools/steam_reviews.py']))

ENV = {**os.environ, 'TZ': os.environ.get('TZ', 'America/New_York')}  # the model's local midnight
failed = []
for name, cmd in STEPS:
    t = time.time()
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, env=ENV)
    ok = r.returncode == 0
    print(f"{'✓' if ok else '✗'} {name} ({time.time() - t:.0f}s)")
    if not ok:
        failed.append(name)
        print('\n'.join((r.stdout + r.stderr).strip().splitlines()[-15:]))
print('\nall done' if not failed else f'\nfailed: {", ".join(failed)}')
sys.exit(1 if failed else 0)
