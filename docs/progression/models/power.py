"""Step 18: sample sizes for the experiments in docs/progression/experiments.md.

Two-arm tests (PROGRESSION_ON vs PROGRESSION_OFF, or one flag on vs off), 5% two-sided, 80% power:
  - a retention rate (D1, D7, D30): two proportions, normal approximation (Fleiss)
  - time to churn: log-rank, events needed by Schoenfeld's formula, then players for the share who churn
The baseline rates are placeholders until the first beta week measures them (FILL_IN in hypotheses.md).

    python3 docs/progression/models/power.py      -> data/power.csv
"""
import csv
import math
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
from common import DATA  # noqa: E402

Z_A = 1.959964  # 5% two-sided
Z_B = 0.841621  # 80% power


def n_two_props(p1, p2):
    pb = (p1 + p2) / 2
    num = (Z_A * math.sqrt(2 * pb * (1 - pb)) + Z_B * math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2
    return math.ceil(num / (p1 - p2) ** 2)


def events_logrank(hr):
    return math.ceil(4 * (Z_A + Z_B) ** 2 / math.log(hr) ** 2)  # equal arms


def main():
    rows = []
    for metric, base, lifts in (('D1 retention', 0.40, (0.05, 0.10)), ('D7 retention', 0.15, (0.03, 0.05, 0.08)), ('D30 retention', 0.06, (0.02, 0.04))):
        for lift in lifts:
            n = n_two_props(base, base + lift)
            rows.append({'test': metric, 'baseline (placeholder)': base, 'effect': f'+{lift:.0%} points', 'players_per_arm': n, 'players_total': 2 * n, 'note': 'two proportions, 5% two-sided, 80% power'})
    for hr in (0.8, 0.7, 0.6):
        ev = events_logrank(hr)
        churn_share = 0.85  # share who churn within the test window (most do, in a beta)
        rows.append({'test': 'time to churn (log-rank)', 'baseline (placeholder)': f'{churn_share:.0%} churn in window', 'effect': f'hazard ratio {hr}', 'players_per_arm': math.ceil(ev / churn_share / 2), 'players_total': math.ceil(ev / churn_share), 'note': f'{ev} churn events needed (Schoenfeld)'})
    with open(DATA / 'power.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    for r in rows:
        print(r)


if __name__ == '__main__':
    main()
