"""Prints the Monte Carlo's headline numbers as markdown tables (pasted into models.md and REPORT.md).

    python3 docs/progression/tools/mc_table.py
"""
import json
import os
import math
from pathlib import Path

D = Path(__file__).resolve().parents[1] / 'data'
MC = json.loads(Path(os.environ.get('MC', D / 'mc_summary.json')).read_text())
START = 'autumn start (today)'
PROFILES = ['casual', 'regular', 'heavy']


def m(v):
    if v is None or (isinstance(v, float) and not math.isfinite(v)):
        return 'never'
    return f'{v:.0f} min' if v < 90 else f'{v / 60:.1f} h'


def d(v):
    return 'never' if v is None or (isinstance(v, float) and not math.isfinite(v)) else f'{v:.0f}'


def row(metric, prof, variant='base', start=START):
    r = MC['runs'][f'{prof} | {start} | {variant}']['metrics'].get(metric)
    if not r:
        return '–'
    a, dd = r['active_min'], r['day']
    reach = r['reached_share']
    tail = '' if reach >= 0.995 else f' ({reach:.0%} by day {MC["days"]})'
    return f"{m(a['P50'])} / {m(a['P90'])} / {m(a['P99'])} (day {d(dd['P50'])}){tail}"


METRICS = ['first rare (rarity 3+)', 'first epic or better (rarity 4+)', 'first legendary (rarity 5)', 'rank 5', 'rank 10', 'rank 20', 'rank 30', 'rank 50',
           'unlock: boat:rowboat', 'unlock: boat:sailboat', 'unlock: boat:icehull', 'expedition done: pirate', 'expedition done: north', 'metal detector (10 finds)',
           'first colour variant', 'first trophy size', '25 fish species', '40 fish species', '60 fish species', 'page complete: fish',
           '50% of everything obtainable', '75% of everything obtainable', '100% of everything obtainable']

print('| Milestone | ' + ' | '.join(PROFILES) + ' |')
print('|---|' + '---|' * len(PROFILES))
for k in METRICS:
    print(f'| {k} | ' + ' | '.join(row(k, p) for p in PROFILES) + ' |')
print()
print('| Run | drought P50 / P90 / P99 (first 10 active h) | longest gap with no progress tick at all, P99 | minutes since last new thing at day 90, P50 | share of obtainable collected by day 90, P50 | fish species by day 90, P50 | rank by day 90, P50 | active hours by day 90, P50 |')
print('|---|---|---|---|---|---|---|---|')
for key, r in MC['runs'].items():
    dr = r['longest_drought_first_10h_min']
    print(f"| {key.replace(' | ', ', ')} | {m(dr['P50'])} / {m(dr['P90'])} / {m(dr['P99'])} | {m(r['longest_gap_without_any_progress_tick_first_10h_min']['P99'])} | {m(r['minutes_since_last_new_thing_at_day90']['P50'])} | {r['share_of_obtainable_collected_day90']['P50']:.0%} | {r['fish_species_by_day90']['P50']:.0f} of {MC['fish_species']} | {r['rank_by_day90']['P50']:.0f} | {r['active_hours_by_day90']['P50']:.0f} |")
print()
for p in PROFILES:
    r = MC['runs'][f'{p} | {START} | base']
    if 'by_source_per_session' in r:
        src = {k: sum(v[57:64]) / 7 for k, v in r['by_source_per_session'].items()}
        mins = {k: sum(v[57:64]) / 7 for k, v in r['minutes_per_session'].items()}
        print(p, 'day 57-63 per session: new things', {k: round(v, 3) for k, v in src.items() if v > 0}, 'minutes', {k: round(v, 1) for k, v in mins.items()})
