"""Writes models.md and REPORT.md from the model outputs in data/ and the templates in templates/.
Every number in those two files comes from here, so a rerun of the models rewrites them.

    python3 docs/progression/tools/compose.py          # MC=<path to an mc_summary.json> to use another run
"""
import csv
import json
import math
import os
import re
import subprocess
import sys
from pathlib import Path

D = Path(__file__).resolve().parents[1]
DATA = D / 'data'
TPL = D / 'templates'
MC = json.loads(Path(os.environ.get('MC', DATA / 'mc_summary.json')).read_text())
P = json.loads((DATA / 'params.json').read_text())
PACE = json.loads((DATA / 'pacing.json').read_text())
CV = json.loads((DATA / 'content_velocity.json').read_text())
ECON = json.loads((DATA / 'economy_summary.json').read_text())
REEL = json.loads((DATA / 'reel_skill.json').read_text())
ASM = json.loads((DATA / 'assumptions.json').read_text())
R = MC['runs']
AUT = 'autumn start (today)'
PROFILES = ['casual', 'regular', 'heavy']


def run(p, v='base', start=AUT):
    return R.get(f'{p} | {start} | {v}')


def fin(x):
    return x is not None and not (isinstance(x, float) and (math.isinf(x) or math.isnan(x)))


def hm(v):
    """Minutes as '42 min' or '3.1 h' (or 'never')."""
    if not fin(v):
        return 'never'
    return f'{v:.0f} min' if v < 90 else f'{v / 60:.1f} h'


def met(p, m, v='base', q='P50', unit='active_min', start=AUT):
    r = run(p, v, start)
    x = r and r['metrics'].get(m)
    return x[unit][q] if x else float('inf')


def reached(p, m, v='base', start=AUT):
    r = run(p, v, start)
    x = r and r['metrics'].get(m)
    return x['reached_share'] if x else 0.0


def day(p, m, v='base', q='P50'):
    d = met(p, m, v, q, 'day')
    return f'day {d:.0f}' if fin(d) else 'not within 90 days'


def pctf(x):
    return f'{100 * x:.0f}%'


def change(b, q):
    """How q compares with b: '20% shorter', '3% longer' or 'no change'."""
    if not (fin(b) and fin(q)) or b == 0:
        return 'n/a'
    c = 100 * (q - b) / b
    return 'no change' if abs(c) < 0.5 else (f'{-c:.0f}% shorter' if c < 0 else f'{c:.0f}% longer')


def table(header, rows):
    out = ['| ' + ' | '.join(header) + ' |', '|' + '---|' * len(header)]
    out += ['| ' + ' | '.join(str(c) for c in r) + ' |' for r in rows]
    return '\n'.join(out)


def mc_tables():
    return subprocess.run([sys.executable, str(D / 'tools' / 'mc_table.py')], capture_output=True, text=True, env={**os.environ}).stdout.strip().split('\n\n')


def fill(name):
    """A template with every {{KEY}} replaced from V; a key with no value stops the run."""
    text = (TPL / name).read_text()
    missing = sorted(set(re.findall(r'\{\{(\w+)\}\}', text)) - set(V))
    if missing:
        raise SystemExit(f'{name}: no value for {missing}')
    return re.sub(r'\{\{(\w+)\}\}', lambda m: str(V[m.group(1)]), text)


V = {}
exec((TPL / 'values.py').read_text(), globals())  # fills V from the data (templates/values.py), section templates too

for name, out in (('models.md', D / 'models.md'), ('report.md', D / 'REPORT.md')):
    out.write_text(fill(name))
    print(f'wrote {out.relative_to(D.parents[1])}')
