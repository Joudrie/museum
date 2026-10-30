"""Reruns one Monte Carlo run and checks it reproduces the numbers in data/mc_summary.json exactly
(every player is seeded and the layer's own dice are seeded, so the same code, params and day must give
the same answer). Day 0 is pinned (params.json modelStart), so it can be run on any day.

    python3 docs/progression/tools/check_repro.py            # casual, autumn start, base
"""
import json
import math
import os
import subprocess
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
KEY = 'casual | autumn start (today) | base'
saved = json.loads((HERE.parent / 'data' / 'mc_summary.json').read_text())['runs'][KEY]
with tempfile.TemporaryDirectory() as out:
    env = {**os.environ, 'TZ': os.environ.get('TZ', 'America/New_York'), 'ONLY': 'casual', 'VARIANTS': 'base', 'STARTS': 'autumn start (today)', 'N': str(saved['n']), 'WORKERS': '1', 'OUT': out}
    subprocess.run(['node', '--import', './docs/progression/tools/register.mjs', 'docs/progression/models/montecarlo.mjs'], cwd=ROOT, env=env, check=True, capture_output=True)
    now = json.loads((Path(out) / 'mc_summary.json').read_text())['runs'][KEY]


def same(a, b):
    return a == b or (isinstance(a, float) and isinstance(b, float) and math.isinf(a) and math.isinf(b)) or (isinstance(a, (int, float)) and isinstance(b, (int, float)) and abs(a - b) < 1e-9)


bad = []
for metric, v in saved['metrics'].items():
    for q, x in v['active_min'].items():
        y = now['metrics'].get(metric, {}).get('active_min', {}).get(q)
        if not same(x, y):
            bad.append(f'{metric} {q}: saved {x}, now {y}')
for field in ('longest_drought_first_10h_min', 'fish_species_by_day90', 'rank_by_day90'):
    for q, x in saved[field].items():
        if not same(x, now[field][q]):
            bad.append(f'{field} {q}: saved {x}, now {now[field][q]}')
result = f'{KEY}: {len(saved["metrics"])} metrics and 3 summaries checked; ' + ('all identical' if not bad else f'{len(bad)} differ: ' + '; '.join(bad[:5]))
print(result)
from datetime import datetime
(HERE.parent / 'data' / 'repro_check.json').write_text(json.dumps({'when': datetime.now().isoformat(timespec='seconds'), 'key': KEY, 'n': saved['n'], 'identical': not bad, 'result': result}, indent=1) + '\n')
sys.exit(1 if bad else 0)
