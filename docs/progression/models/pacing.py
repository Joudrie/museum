"""Step 11: pacing at four horizons (session 1, week 1, day 30, day 90) and what is left at day 60.

Reads data/mc_summary.json (the Monte Carlo) and writes data/pacing.json, figures/pacing.png and figures/mc_novelty_per_day.png.
New things per session = the Monte Carlo's new things per day / (chance of playing that day x sessions a day).

    python3 docs/progression/models/pacing.py
"""
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from common import DATA, FIG, PROFILES, MC_PATH  # noqa: E402

MC = json.loads(MC_PATH.read_text())
HORIZONS = {'session 1': (0, 1), 'week 1': (0, 7), 'day 30': (27, 34), 'day 60': (57, 64), 'day 90': (84, 90)}


def main():
    out = {}
    for p, prof in PROFILES.items():
        key = f'{p} | autumn start (today) | base'
        nd = np.array(MC['novelty_per_day_mean'][key])
        per_session = nd / (prof['play_prob'] * len(prof['sessions']))
        hz = {}
        for name, (a, b) in HORIZONS.items():
            if a >= len(per_session):
                continue
            v = per_session[a:b]
            hz[name] = round(float(v[0] if name == 'session 1' else v.mean()), 2)
        if hz.get('session 1') is not None:
            # session 1 is the first session of day 0, which the day's mean spreads over all of day 0's sessions
            hz['session 1'] = round(float(nd[0] / prof['play_prob']), 2) if len(prof['sessions']) == 1 else hz['session 1']
        run = MC['runs'][key]
        done_by_60 = sorted(m.replace('page complete: ', '') for m, v in run['metrics'].items() if m.startswith('page complete') and v['day']['P50'] <= 60)
        open_at_60 = sorted(m.replace('page complete: ', '') for m, v in run['metrics'].items() if m.startswith('page complete') and v['day']['P50'] > 60)
        wk = np.convolve(per_session, np.ones(7) / 7, mode='valid')  # 7-day means, starting each day
        first_dry = next((d for d in range(len(wk)) if wk[d] < 1.0), None)
        out[p] = {
            'new_things_per_session': hz,
            'pages_done_by_day60_P50': done_by_60,
            'pages_still_open_day60_P50': open_at_60,
            'first_day_the_week_ahead_averages_under_one_new_thing_a_session': first_dry,
            'share_of_obtainable_collected_by_day90': run['share_of_obtainable_collected_day90'],
            'minutes_since_last_new_thing_at_day90': run['minutes_since_last_new_thing_at_day90'],
        }
    (DATA / 'pacing.json').write_text(json.dumps(out, indent=1, default=float))
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(7.5, 4))
    names = list(HORIZONS)
    w = 0.25
    for k, p in enumerate(PROFILES):
        vals = [out[p]['new_things_per_session'].get(n, np.nan) for n in names]
        ax.bar(np.arange(len(names)) + (k - 1) * w, vals, w, label=p)
    ax.axhline(1, color='k', lw=0.8, ls='--')
    ax.text(len(names) - 0.6, 1.05, 'one new thing a session', fontsize=8, ha='right')
    ax.set_xticks(range(len(names)), names)
    ax.set_yscale('symlog', linthresh=0.1)
    ax.set_ylabel('new things per session (mean)')
    ax.set_title('Pacing: how much is new in a session, by horizon (current build)')
    ax.legend()
    fig.tight_layout()
    fig.savefig(FIG / 'pacing.png', dpi=140)
    plt.close(fig)
    # new things per day, by profile, as built and with the world as regions.json describes it
    fig, ax = plt.subplots(figsize=(7.5, 4.2))
    for p in PROFILES:
        for v, ls in (('base', '-'), ('regionfix', ':')):
            r = MC['runs'].get(f'{p} | autumn start (today) | {v}')
            if r:
                ax.plot(range(1, len(r['novelty_per_day_mean']) + 1), r['novelty_per_day_mean'], ls, label=f"{p}{'' if v == 'base' else ', world fixed'}")
    ax.set_yscale('log')
    ax.set_xlabel('day since install')
    ax.set_ylabel('new things per day (mean, log)')
    ax.set_title('How fast new things run out (autumn start; dotted: the island lookup fixed)')
    ax.legend(fontsize=8)
    fig.tight_layout()
    fig.savefig(FIG / 'mc_novelty_per_day.png', dpi=140)
    plt.close(fig)
    for p, v in out.items():
        print(p, v['new_things_per_session'], 'under 1 a session from day', v['first_day_the_week_ahead_averages_under_one_new_thing_a_session'])


if __name__ == '__main__':
    main()
