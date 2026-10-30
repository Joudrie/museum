"""Shared inputs for every model: the numbers exported from the game (data/params.json), the
measured cycle times (data/logs/scripted-session.json), and the player assumptions.

Every assumption a model uses lives in ASSUMPTIONS below, with where it came from. When real
numbers arrive (telemetry, the developer's FILL_IN answers), change them here and rerun
`python3 docs/progression/run_all.py`; nothing else holds a copy.
"""
import json
import os
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
DOCS = HERE.parent
DATA = DOCS / 'data'
FIG = DOCS / 'figures'
FIG.mkdir(exist_ok=True)

PARAMS = json.loads((DATA / 'params.json').read_text())
MC_PATH = Path(os.environ.get('MC', DATA / 'mc_summary.json'))  # the Monte Carlo's output (MC=… to read another run)
SEED = 20261029

# ---------- measured, if the scripted session has been run ----------
def measured():
    """Cycle times from the real-time scripted session (tests/measure.cjs MODE=session): a bot that casts, waits for
    the real bite, plays the reel and reads the card, on the build as it is."""
    f = DATA / 'logs' / 'scripted-session.json'
    if not f.exists():
        return {}
    d = json.loads(f.read_text())
    acts = d.get('actions', [])
    fish = [a for a in acts if a.get('kind') == 'fish']
    digs = [a for a in acts if a.get('kind') == 'dig' and a.get('found')]
    out = {'source': 'data/logs/scripted-session.json', 'when': d.get('when'), 'casts': len(fish), 'digs': len(digs)}
    # gaps between two casts in a row (a dig in between is not part of a cast)
    pairs = [(a, b) for a, b in zip(acts, acts[1:]) if a.get('kind') == 'fish' and b.get('kind') == 'fish']
    if len(pairs) > 5 and all('reelMs' in a for a, _ in pairs):
        gaps = np.array([(b['cast'] - a['cast']) / 1000 for a, b in pairs])
        reel = np.array([a['reelMs'] / 1000 for a, _ in pairs])
        out['cast_cycle_s'] = float(np.median(gaps))
        out['reel_s'] = float(np.median([a['reelMs'] / 1000 for a in fish if a.get('reelMs')]))
        # everything that is not the bite wait or the reel: cast, react, the card, recast. The models add the rod's own
        # wait and the reel's own length to this (the bot fished with the starting rod: 4 to 9 s, 6.5 on average).
        out['cast_overhead_s'] = float(np.median(gaps - reel) - 6.5)
        out['escaped_share'] = float(np.mean([bool(a.get('escaped')) for a in fish]))
    if digs:
        out['brush_s'] = float(np.median([a['brushMs'] for a in digs]) / 1000)
    return out


MEASURED = measured()

# ---------- assumptions (every one is a hypothesis until telemetry replaces it) ----------
ASSUMPTIONS = {
    # seconds per cast that aren't the bite wait or the reel: cast, react, read the card, recast.
    # Measured by the scripted session when it exists; 5.0 s otherwise.
    'cast_overhead_s': MEASURED.get('cast_overhead_s', 5.0),
    # a dig: brushing (measured by the bot when available) plus walking to the spot and reading the card
    'dig_s': MEASURED.get('brush_s', 14.0) + 26.0,
    'talk_s': 45.0,  # one guest conversation, a topic or two and the farewell
    'hunt_s': 90.0,  # following the metal detector to one buried thing
    'expedition_min': 10.0,  # one expedition island start to finish (FILL_IN from telemetry: expedition_done - arrival)
    'pleased_share': 0.3,  # conversations where you've hung the artist they ask for (a pleased guest always gives)
    'gift_find_share': 0.5,  # each guest kind has one gold gift and one find gift; picked evenly
    'start_offsets_days': {'autumn start (today)': 0, 'spring start': 154},
    # the progression layer's world (models/montecarlo.mjs)
    'sail_min': 1.0,  # one crossing between islands: the boat, the load, walking to the water
    'named_talk_s': 30.0,  # talking to one named islander (and handing over a gift or a request)
    'explore_find_mean_min': 12.0,  # minutes of walking an island, on average, to come across one of its secrets or viewpoints
    'chunks_per_explore_min': 2,  # map chunks the fog clears per minute of walking
    'chunks_per_island': 30,  # 8x8-tile chunks on a typical island
    'forage_per_explore_min': 0.5,  # sparkle pickups per minute of walking (6 an island a day at most)
}

# Three kinds of player. Session counts, lengths and hours are guesses (FILL_IN from telemetry: session_start/session_end).
# With the progression layer, fishing is the core verb (its own sim gives it 60% of a session); here the older
# checklist (guests, digs, the detector) gets at most `older_share`, walking `explore_share`, and fishing the rest.
PROFILES = {
    'casual': {
        'play_prob': 0.7,  # chance of playing on a given day
        'sessions': [(19, 23)],  # (from, to) hour of each session start
        'session_min': 12,
        'talks': 2,  # museum guests talked to a session
        'expedition_every': 3,  # sessions between expeditions once a lead is open
        'fail': 0.08,  # casts lost to tapping too soon or too late
        'smart': False,  # picks the island and water most likely to give something new, chases legends, buys their bait
        'islands': ['main-island'],  # where they dig each session
        'hunt_islands': ['main-island'],
        'opens_boat_session': 2,
        'skill': 0.45,  # the reel: 0 to 1, the layer's own bot (src/progression/reel.js playBot); its casual sim uses 0.45
        'older_share': 0.4,  # at most this share of a session goes to the museum's guests, digs and the metal detector
        'explore_share': 0.10,  # share of a session spent walking an island (fog, secrets, sparkles)
        'hot_share': 0.12,  # share of casts at a hot spot (the layer's sim uses 0.12)
        'roam': 0.3,  # chance a session's fishing is on another open island (casual players don't plan)
    },
    'regular': {
        'play_prob': 0.9,
        'sessions': [(12, 14), (19, 23)],
        'session_min': 18,
        'talks': 3,
        'expedition_every': 2,
        'fail': 0.05,
        'smart': True,
        'islands': ['main-island', 'one'],
        'hunt_islands': ['main-island'],
        'opens_boat_session': 1,
        'skill': 0.65,
        'older_share': 0.35,
        'explore_share': 0.10,
        'hot_share': 0.5,
        'roam': 1.0,
    },
    'heavy': {
        'play_prob': 1.0,
        'sessions': [(7, 10), (13, 17), (21, 24)],
        'session_min': 30,
        'talks': 4,
        'expedition_every': 1,
        'fail': 0.03,
        'smart': True,
        'islands': ['main-island', 'one', 'isle-1'],
        'hunt_islands': ['main-island', 'isle-1'],
        'opens_boat_session': 1,
        'skill': 0.85,  # the layer's hardcore sim uses 0.85
        'older_share': 0.3,
        'explore_share': 0.10,
        'hot_share': 0.6,
        'roam': 1.0,
    },
}

RARITY = {e['id']: e['rarity'] for e in PARAMS['entries']}
PARTS = {e['id']: e['parts'] for e in PARAMS['entries'] if e['parts']}
COLLECTION = {e['id']: e['collection'] for e in PARAMS['entries']}
JUNK = {e['id'] for e in PARAMS['entries'] if e['junk']}


def pct(a, qs=(10, 50, 90, 99)):
    """Percentiles that treat 'never' (nan or inf) as larger than everything; returns inf where it applies."""
    a = np.asarray(a, dtype=float)
    a = np.where(np.isnan(a), np.inf, a)
    return {f'P{q}': float(np.percentile(a, q, method='higher')) for q in qs}


def fmt_min(m):
    if not np.isfinite(m):
        return 'never'
    if m < 90:
        return f'{m:.0f} min'
    return f'{m / 60:.1f} h'


def fmt_days(d):
    return 'never' if not np.isfinite(d) else f'day {d:.0f}'


def dump():
    """data/assumptions.json: the same profiles and assumptions for models/montecarlo.mjs (one place to change them)."""
    (DATA / 'assumptions.json').write_text(json.dumps({'generated': 'docs/progression/models/common.py', 'seed': SEED, 'assumptions': ASSUMPTIONS, 'profiles': PROFILES, 'measured': MEASURED}, indent=1) + '\n')


if __name__ == '__main__':
    dump()
    print('wrote', DATA / 'assumptions.json')
