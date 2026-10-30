"""Step 8: content velocity. How many player-hours each kind of content buys, what it costs the
developer, how long the content lasts at casual and heavy play, and how much new content a month a
subscription would need. Also where new things come from after the first weeks, by source, and who
has to make more of each (data/multipliers.csv).

Inputs: data/content_inventory.json (counts), data/production_cost.csv (human minutes per unit,
FILL_IN or assumption), data/mc_summary.json (time to collect, from the Monte Carlo), data/params.json.

    python3 docs/progression/models/content_velocity.py
Writes data/content_velocity.csv, data/multipliers.csv and data/content_velocity.json.
"""
import csv
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from common import ASSUMPTIONS, DATA, PARAMS, PROFILES, MC_PATH  # noqa: E402

INV = json.loads((DATA / 'content_inventory.json').read_text())
MC = json.loads(MC_PATH.read_text())
COST = {r['unit']: r for r in csv.DictReader(open(DATA / 'production_cost.csv'))}


def human_min(unit):
    r = COST[unit]
    v = r['human_minutes_per_unit']
    return (float(v), 'FILL_IN answered') if v not in ('', 'FILL_IN') else (float(r['assumption_if_blank']), 'assumption (FILL_IN)')


def run_key(profile, variant='base', start='autumn start (today)'):
    return f'{profile} | {start} | {variant}'


def metric(profile, name, q='P50', unit='active_min', variant='base'):
    m = MC['runs'][run_key(profile, variant)]['metrics'].get(name)
    return m[unit][q] if m else float('inf')


def main():
    rows = []
    obtainable = MC['obtainable_in_model']  # entries something in the model can hand out
    sessions_per_month = {p: 30 * v['play_prob'] * len(v['sessions']) for p, v in PROFILES.items()}
    # 1. hours per unit of collectable content: active hours to 75% of everything obtainable, per entry
    for p in PROFILES:
        h75 = metric(p, '75% of everything obtainable') / 60
        d75 = metric(p, '75% of everything obtainable', unit='day')
        rows.append({'what': 'collection entries', 'profile': p, 'units': obtainable, 'player_hours_per_unit': round(h75 / (0.75 * obtainable), 3), 'runway_days_P50': d75, 'basis': 'active hours to 75% of obtainable entries / entries (Monte Carlo P50)'})
    words = sum(r['words'] for r in INV['rows'])
    rows.append({'what': 'text (blurbs, dialogue, story)', 'profile': 'any', 'units': words, 'player_hours_per_unit': round(1 / INV['wpm'] / 60, 6), 'runway_days_P50': '', 'basis': f"{INV['wpm']} words a minute, read once"})
    # 2. what a subscription needs: one new thing a session at the median, from the hypotheses file (H3)
    target_per_session = 1.0
    entry_min, entry_src = human_min('species / collection entry')
    need = []
    for p, spm in sessions_per_month.items():
        units = spm * target_per_session
        need.append({'profile': p, 'sessions_per_month': round(spm, 1), 'new_units_per_month': round(units), 'human_hours_per_month': round(units * entry_min / 60, 1), 'human_minutes_per_unit': entry_min, 'source': entry_src})
    # 3. where new things come from once the first flood is over (the Monte Carlo, by source), and who has to make more
    #    of each. Variants and trophy sizes were the cheapest long tail in the earlier model; the layer built both.
    MAKER = {
        'fishing': 'a species: data the developer approves (and later a sprite)',
        'fishing: variant': 'procedural: nobody (a palette)',
        'fishing: trophy': 'procedural: nobody (sizes roll on every catch)',
        'exploring: secret': 'procedural placement: nobody (names from a list of 12)',
        'exploring: place': 'an island: painted by hand',
        'people': 'a named islander: written and approved',
        'gallery shop': 'a museum piece: data the developer approves',
        'dig': 'a museum piece: data the developer approves',
        'metal detector': 'a museum piece: data the developer approves',
        'expedition': 'an island: painted by hand',
        'unlock': 'a rank reward: data',
    }
    mult = []
    for prof in ('regular', 'heavy', 'casual'):
        run = MC['runs'].get(run_key(prof))
        if not run:
            continue
        src = run['by_source_per_session']
        for k, v in sorted(src.items(), key=lambda kv: -sum(kv[1][27:34])):
            w1, d30, d60 = (float(np.mean(v[a:b])) for a, b in ((0, 7), (27, 34), (57, 64)))
            if max(w1, d30, d60) < 0.005:
                continue
            mult.append({'profile': prof, 'source': k, 'week_1_per_session': round(w1, 3), 'day_30_per_session': round(d30, 3), 'day_60_per_session': round(d60, 3), 'who_makes_more': MAKER.get(k, 'other')})
    with open(DATA / 'content_velocity.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)
    with open(DATA / 'multipliers.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(mult[0]))
        w.writeheader()
        w.writerows(mult)
    out = {'per_unit': rows, 'subscription_need': need, 'multipliers': mult, 'pending_review': json.loads((DATA / 'pending_review.json').read_text())['pending_review']}
    (DATA / 'content_velocity.json').write_text(json.dumps(out, indent=1, default=float))
    for r in rows:
        print(r)
    for n in need:
        print('need', n)
    for m in mult:
        print(m)


if __name__ == '__main__':
    main()
