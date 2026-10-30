"""Analysis of real play data: one phone's event log, or a whole beta.

  python3 analyze.py density <log.json>      Step 3: new and progress events per minute of one log, and every gap
                                             over 2 minutes with neither. Accepts an ?evlog export
                                             ("curation-evlog") or tests/measure.cjs's scripted session.
  python3 analyze.py beta <files...>         Step 16: cohort retention (D1, D7, D30 by install week), Kaplan-Meier
                                             survival with cliffs marked against where content and unlocks sit,
                                             and time-to-milestone percentiles next to the Monte Carlo's predictions.
                                             Accepts many ?evlog exports (one per player) and/or a PostHog CSV export
                                             (columns event, timestamp, distinct_id, properties).
  python3 analyze.py synthetic [n]           Writes a SYNTHETIC beta (data/logs/synthetic/) so the pipeline can be run
                                             before real players exist. Its numbers mean nothing.

Outputs go to docs/progression/data/analysis/ and docs/progression/figures/.
"""
import csv
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

import os

DOCS = Path(__file__).resolve().parents[1]
# TAG=synthetic keeps a dry run's outputs apart from real ones
TAG = os.environ.get('TAG', '')
OUT = DOCS / 'data' / 'analysis' / TAG if TAG else DOCS / 'data' / 'analysis'
FIG = DOCS / 'figures' / TAG if TAG else DOCS / 'figures'
FIG.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(DOCS / 'models'))

GAP_MIN = 2.0
# what counts as new: the same as models/montecarlo.mjs and hypotheses.md
NOVEL = {'famous_met', 'story_beat', 'lead_found', 'expedition_done', 'unlock', 'fog_cleared', 'place_found', 'secret_found', 'viewpoint'}
PAYOUT = {'goal_claimed', 'set_claimed', 'milestone_claimed', 'daily_gift', 'wheel_spin', 'daily_dig_goal', 'task_done', 'request_done'}
METER = {'rank_up', 'skill_up', 'heart_up'}  # the layer's numbers going up
SYSTEM = {'session_start', 'session_end', 'session_resume'}
CHURN_DAYS = 14  # no session for this long = churned (censored if the data ends sooner)
MILESTONES = {  # event that marks it -> the Monte Carlo metric it is compared with
    'first rare (rarity 3+)': lambda e: e['type'] == 'collect' and e.get('fresh') and (e.get('rarity') or 1) >= 3,
    'first epic or better (rarity 4+)': lambda e: e['type'] == 'collect' and e.get('fresh') and (e.get('rarity') or 1) >= 4,
    'first legendary (rarity 5)': lambda e: e['type'] == 'collect' and e.get('fresh') and (e.get('rarity') or 1) >= 5,
    'metal detector (10 finds)': lambda e: e['type'] == 'unlock' and e.get('what') == 'metal-detector',
    'unlock: boat:rowboat': lambda e: e['type'] == 'unlock' and e.get('what') == 'boat:rowboat',
    'unlock: boat:sailboat': lambda e: e['type'] == 'unlock' and e.get('what') == 'boat:sailboat',
    'rank 5': lambda e: e['type'] == 'rank_up' and (e.get('rank') or 0) >= 5,
    'rank 10': lambda e: e['type'] == 'rank_up' and (e.get('rank') or 0) >= 10,
    'first colour variant': lambda e: e['type'] == 'catch' and bool(e.get('v')),
    'first trophy size': lambda e: e['type'] == 'catch' and e.get('cls') == 'Trophy',
    'expedition done: pirate': lambda e: e['type'] == 'expedition_done' and e.get('id') == 'pirate',
    'first lead (bottle note)': lambda e: e['type'] == 'lead_found' and e.get('id') == 'bottle-note',
}


def kind(e):
    if e['type'] == 'collect':
        return 'novelty' if e.get('fresh') else 'progress'
    if e['type'] in NOVEL:
        return 'novelty'
    if e['type'] in PAYOUT:
        return 'payout'
    if e['type'] in METER:
        return 'meter'
    if e['type'] in SYSTEM:
        return 'system'
    return 'progress'


def kinds(events):
    """kind() for a player's events in order, plus the firsts only order can tell: a species' first colour
    variant and first trophy size (from `catch`), the first talk with each named islander (`npc_talk`),
    and an entry's first fresh `collect` only."""
    seen = set()
    out = []
    for e in events:
        k = kind(e)
        if e['type'] == 'collect' and e.get('fresh'):
            # one entry is new once (a save written twice in the same moment can report it twice)
            if ('collect', e.get('id')) in seen:
                k = 'progress'
            seen.add(('collect', e.get('id')))
        if e['type'] == 'catch':
            for key in ((('v', e.get('sp'), e.get('v')) if e.get('v') else None), (('trophy', e.get('sp')) if e.get('cls') == 'Trophy' else None)):
                if key and key not in seen:
                    seen.add(key)
                    k = 'novelty'
        if e['type'] == 'npc_talk' and not str(e.get('npc', 'anon:')).startswith('anon:'):
            key = ('npc', e.get('npc'))
            if key not in seen:
                seen.add(key)
                k = 'novelty'
        out.append(k)
    return out


def load_log(path):
    d = json.loads(Path(path).read_text())
    if isinstance(d, dict) and 'events' in d:
        return d['events']
    if isinstance(d, list):
        return d
    raise ValueError(f'{path}: not an event log')


# ---------- step 3: reward density ----------
def density(path):
    ev = sorted(load_log(path), key=lambda e: e['t'])
    ev = [e for e in ev if e['type'] != 'coins' or e.get('delta', 0) > 0]
    t0 = next((e['t'] for e in ev if e['type'] == 'session_start'), ev[0]['t'])
    # active time only: drop the gaps between sessions
    sessions, cur = [], None
    for e in ev:
        if e['type'] == 'session_start':
            cur = [e['t'], e['t']]
            sessions.append(cur)
        elif cur:
            cur[1] = max(cur[1], e['t'])
    offset, mapped = 0.0, []
    for s0, s1 in sessions:
        mapped.append((s0, s1, offset))
        offset += (s1 - s0) / 60000
    def active_min(t):
        for s0, s1, off in mapped:
            if s0 <= t <= s1:
                return off + (t - s0) / 60000
        return None
    pts = [(active_min(e['t']), k, e) for e, k in zip(ev, kinds(ev)) if k != 'system']
    pts = [p for p in pts if p[0] is not None]
    total = max([p[0] for p in pts] + [offset])
    mins = int(np.ceil(total)) or 1
    per = {k: np.zeros(mins) for k in ('novelty', 'progress', 'payout', 'meter')}
    for m, k, _ in pts:
        per[k][min(mins - 1, int(m))] += 1
    times = sorted(m for m, k, _ in pts if k in ('novelty', 'progress'))
    gaps = []
    prev = 0.0
    for m in times + [total]:
        if m - prev > GAP_MIN:
            gaps.append((round(prev, 1), round(m, 1), round(m - prev, 1)))
        prev = m
    # the same, for new things only: how long the player goes without anything they haven't had before
    novel_times = sorted(m for m, k, _ in pts if k == 'novelty')
    novel_gaps, prev = [], 0.0
    for m in novel_times + [total]:
        if m - prev > GAP_MIN:
            novel_gaps.append((round(prev, 1), round(m, 1), round(m - prev, 1)))
        prev = m
    name = Path(path).stem
    with open(OUT / f'novelty-gaps-{name}.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['from_min', 'to_min', 'length_min'])
        w.writerows(novel_gaps)
    with open(OUT / f'density-{name}.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['active_minute', 'novelty', 'progress', 'payout', 'meter'])
        for i in range(mins):
            w.writerow([i, int(per['novelty'][i]), int(per['progress'][i]), int(per['payout'][i]), int(per['meter'][i])])
    with open(OUT / f'gaps-{name}.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['from_min', 'to_min', 'length_min'])
        w.writerows(gaps)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(9, 3.4))
    x = np.arange(mins)
    ax.bar(x, per['progress'], color='#9bb0c8', label='progress (a duplicate, coins, a dig)')
    ax.bar(x, per['novelty'], bottom=per['progress'], color='#d9822b', label='new (first of a kind, unlock, lead)')
    ax.bar(x, per['payout'], bottom=per['progress'] + per['novelty'], color='#6a9f58', label='payout (goal, task, daily)')
    ax.bar(x, per['meter'], bottom=per['progress'] + per['novelty'] + per['payout'], color='#8e6fb5', label='meter (rank, skill, heart)')
    for a, b, _ in novel_gaps:
        ax.axvspan(a, b, color='#d9822b', alpha=0.08, lw=0)
    for a, b, _ in gaps:
        ax.axvspan(a, b, color='#c0392b', alpha=0.2, lw=0)
    ax.set_xlabel('active minutes')
    ax.set_ylabel('events per minute')
    ax.set_title(f'Reward density: {name}\n(red: over {GAP_MIN:.0f} min with nothing; orange: over {GAP_MIN:.0f} min with nothing new)', fontsize=10)
    ax.legend(fontsize=8, loc='upper right')
    fig.tight_layout()
    fig.savefig(FIG / f'density-{name}.png', dpi=140)
    plt.close(fig)
    nov = int(per['novelty'].sum())
    print(f'{name}: {total:.0f} active min, {nov} new things, {int(per["progress"].sum())} progress events, {len(gaps)} gaps over {GAP_MIN:.0f} min with nothing '
          f'(longest {max([g[2] for g in gaps], default=0)} min); {len(novel_gaps)} over {GAP_MIN:.0f} min with nothing new (longest {max([g[2] for g in novel_gaps], default=0)} min); '
          f'new things by minute: {[round(t, 1) for t in novel_times]}')
    return {'active_min': total, 'novelty': nov, 'gaps': gaps, 'novelty_gaps': novel_gaps, 'novel_times': novel_times}


# ---------- step 16: a beta ----------
def load_players(files):
    players = defaultdict(list)
    for f in files:
        p = Path(f)
        if p.suffix == '.csv':
            for r in csv.DictReader(open(p)):
                props = json.loads(r.get('properties') or '{}')
                t = datetime.fromisoformat(r['timestamp'].replace('Z', '+00:00')).timestamp() * 1000
                players[r['distinct_id']].append({'t': t, 'type': r['event'], **props})
        else:
            ev = load_log(p)
            pid = json.loads(p.read_text()).get('player') if p.suffix == '.json' else None
            players[pid or p.stem].extend(ev)
    for v in players.values():
        v.sort(key=lambda e: e['t'])
    return players


def beta(files):
    players = load_players(files)
    if not players:
        raise SystemExit('no players')
    end = max(e['t'] for v in players.values() for e in v)
    rows = []
    for pid, ev in players.items():
        starts = [e['t'] for e in ev if e['type'] == 'session_start']
        if not starts:
            continue
        install = starts[0]
        days = sorted({int((t - install) // 864e5) for t in starts})
        last = starts[-1]
        lifetime = (last - install) / 864e5
        churned = (end - last) / 864e5 >= CHURN_DAYS
        miles = {}
        # active minutes before each event: finished sessions count their length (the last session_end's
        # `ms`, which leaves out time hidden mid-session); the open one counts time since its start
        done_min = 0.0
        cur_start, cur_ms = None, 0.0
        for e in ev:
            if e['type'] == 'session_start':
                done_min += cur_ms / 60000
                cur_start, cur_ms = e['t'], 0.0
            elif e['type'] == 'session_end':
                cur_ms = e.get('ms', (e['t'] - (cur_start or e['t'])))
            for m, test in MILESTONES.items():
                if m not in miles and test(e):
                    miles[m] = {'day': (e['t'] - install) / 864e5, 'active_min': done_min + ((e['t'] - cur_start) / 60000 if cur_start else 0)}
        rows.append({'player': pid, 'install': install, 'week': datetime.fromtimestamp(install / 1000, timezone.utc).strftime('%G-W%V'), 'days': days, 'lifetime_days': lifetime, 'churned': churned, 'observable_days': (end - install) / 864e5, 'build': next((e.get('build') for e in ev if e['type'] == 'session_start'), 'on'), 'miles': miles})
    # retention by install week and build (a day counts only for players observed that long)
    ret = []
    for (week, build) in sorted({(r['week'], r['build']) for r in rows}):
        grp = [r for r in rows if r['week'] == week and r['build'] == build]
        line = {'cohort': week, 'build': build, 'players': len(grp)}
        for d in (1, 7, 30):
            obs = [r for r in grp if r['observable_days'] >= d + 1]
            line[f'D{d}'] = round(np.mean([d in r['days'] for r in obs]), 3) if obs else ''
            line[f'D{d}_n'] = len(obs)
        ret.append(line)
    with open(OUT / 'retention.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(ret[0]))
        w.writeheader()
        w.writerows(ret)
    # Kaplan-Meier on days to churn, per build
    from lifelines import KaplanMeierFitter
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(figsize=(8, 4))
    km = {}
    for build in sorted({r['build'] for r in rows}):
        grp = [r for r in rows if r['build'] == build]
        kmf = KaplanMeierFitter(label=f'build {build} (n={len(grp)})')
        kmf.fit([max(0.01, r['lifetime_days']) for r in grp], event_observed=[r['churned'] for r in grp])
        kmf.plot_survival_function(ax=ax, ci_show=True)
        sf = kmf.survival_function_
        drops = np.diff(np.concatenate([[1.0], sf.iloc[:, 0].values]))
        cliffs = [(round(float(t), 1), round(float(-d), 3)) for t, d in zip(sf.index, drops) if -d >= 0.05]
        km[build] = {'median_days': float(kmf.median_survival_time_), 'cliffs_days_drop': cliffs}
    # where content and unlocks sit for a regular player (Monte Carlo P50), to read cliffs against
    marks = {}
    mcf = DOCS / 'data' / 'mc_summary.json'
    if mcf.exists():
        mc = json.loads(mcf.read_text())['runs'].get('regular | autumn start (today) | base', {}).get('metrics', {})
        for m in ('page complete: fish', 'expedition done: north', 'page complete: fossil', '75% of everything obtainable'):
            if m in mc and np.isfinite(mc[m]['day']['P50']):
                marks[m] = mc[m]['day']['P50']
                ax.axvline(marks[m], color='#888', lw=0.8, ls=':')
                ax.text(marks[m], 0.02, m.replace('page complete: ', ''), rotation=90, fontsize=7, va='bottom')
    ax.set_xlabel('days since install')
    ax.set_ylabel('still playing')
    ax.set_title(f'Kaplan-Meier: days until churn (no session for {CHURN_DAYS} days)')
    fig.tight_layout()
    fig.savefig(FIG / 'beta-survival.png', dpi=140)
    plt.close(fig)
    # milestone timing vs prediction
    comp = []
    pred = {}
    if mcf.exists():
        pred = json.loads(mcf.read_text())['runs'].get('regular | autumn start (today) | base', {}).get('metrics', {})
    for m in MILESTONES:
        got = [r['miles'][m]['active_min'] for r in rows if m in r['miles']]
        line = {'milestone': m, 'players_reached': len(got), 'players': len(rows)}
        for q in (10, 50, 90):
            line[f'observed_P{q}_active_min'] = round(float(np.percentile(got, q)), 1) if got else ''
            line[f'predicted_P{q}_active_min'] = round(pred[m]['active_min'][f'P{q}'], 1) if m in pred and np.isfinite(pred[m]['active_min'][f'P{q}']) else ''
        comp.append(line)
    with open(OUT / 'milestones_vs_model.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(comp[0]))
        w.writeheader()
        w.writerows(comp)
    summary = {'players': len(rows), 'retention': ret, 'survival': km, 'content_marks_days': marks, 'milestones': comp}
    (OUT / 'beta_summary.json').write_text(json.dumps(summary, indent=1, default=float))
    print(f'{len(rows)} players; retention {ret}; survival {km}')
    return summary


def synthetic(n=400):
    """A made-up beta to exercise the pipeline: two builds, players who drift away. NOT DATA."""
    rng = np.random.default_rng(11)
    d = DOCS / 'data' / 'logs' / 'synthetic'
    d.mkdir(parents=True, exist_ok=True)
    t_start = datetime(2026, 11, 2, tzinfo=timezone.utc).timestamp() * 1000
    for i in range(n):
        build = 'on' if i % 2 == 0 else 'off'
        install = t_start + rng.uniform(0, 14) * 864e5
        quit_day = rng.exponential(9 if build == 'on' else 6)
        ev, active = [], 0
        for day in range(45):
            if day > quit_day or rng.random() > 0.75:
                continue
            for s in range(rng.integers(1, 3)):
                t = install + day * 864e5 + rng.uniform(8, 22) * 36e5 + s * 3e6
                ev.append({'t': t, 'type': 'session_start', 'build': build, 'source': 'beta-link'})
                for k in range(int(rng.integers(5, 40))):
                    tt = t + k * 30000
                    fresh = rng.random() < max(0.02, 0.5 - 0.02 * day)
                    ev.append({'t': tt, 'type': 'collect', 'fresh': bool(fresh), 'rarity': int(rng.choice([1, 2, 3, 4], p=[0.6, 0.26, 0.11, 0.03]))})
                ev.append({'t': tt + 5000, 'type': 'session_end', 'ms': tt + 5000 - t})
        (d / f'player{i:04d}.json').write_text(json.dumps({'format': 'curation-evlog', 'player': f'synthetic-{i}', 'synthetic': True, 'events': ev}))
    print(f'wrote {n} SYNTHETIC players to {d}')
    return d


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'density':
        for f in sys.argv[2:]:
            density(f)
    elif cmd == 'beta':
        beta(sys.argv[2:])
    elif cmd == 'synthetic':
        synthetic(int(sys.argv[2]) if len(sys.argv) > 2 else 400)
    else:
        print(__doc__)
