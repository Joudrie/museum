"""Step 4 (second half): where do comparable games' players give up? Negative Steam reviews, bucketed by
the hours the reviewer had played when they wrote it, with complaint themes coded per bucket.

Not run yet: this build sandbox can't reach store.steampowered.com (the proxy refuses it, and that is
not worked around). Run it anywhere that can:

    python3 docs/progression/tools/steam_reviews.py            # Dredge and Stardew Valley, up to 3000 each

Uses Steam's public review endpoint (store.steampowered.com/appreviews/<appid>?json=1, paged with
`cursor`; Valve lists it as superseded by IUserReviewsService/GetAppReviews with the same fields).
Each review carries author.playtime_at_review in minutes. Review text is used only to code themes
here and is never written to disk; the outputs are counts.

Writes docs/progression/data/steam_themes.csv (game, hours bucket, theme, count, share of the bucket)
and data/steam_buckets.csv (game, bucket, negative reviews).
"""
import csv
import json
import re
import time
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / 'data'
GAMES = {'Dredge': 1562430, 'Stardew Valley': 413150}
MAX = 3000
BUCKETS = [(0, 1), (1, 3), (3, 10), (10, 30), (30, 100), (100, 1e9)]  # hours at review

# A transparent dictionary: edit it, rerun. A review can hit several themes. Lowercase, word-ish matches.
THEMES = {
    'repetitive / grind': r'\b(grind\w*|repetiti\w*|tedious|same thing|chore\w*|monoton\w*)\b',
    'ran out of things to do': r'\b(nothing (left|else) to do|ran out|too short|short game|beat it in|no endgame|end ?game|replay\w*)\b',
    'boring / slow start': r'\b(boring|bored|slow (start|paced)|dull|nothing happens)\b',
    'too hard / punishing': r'\b(too hard|frustrat\w*|punish\w*|unfair|difficult)\b',
    'time pressure / timers': r'\b(timer\w*|time limit|stress\w*|anxiety|rushed|too fast)\b',
    'bugs / performance': r'\b(bug\w*|crash\w*|glitch\w*|lag\w*|fps|performance|broken|save (lost|deleted))\b',
    'controls / UI': r'\b(control\w*|clunky|ui\b|menu\w*|inventory)\b',
    'price / value': r'\b(price\w*|overpriced|not worth|refund\w*|dlc)\b',
    'story / ending': r'\b(story|ending|plot|lore)\b',
}
PATTERNS = {k: re.compile(v, re.I) for k, v in THEMES.items()}


def fetch(appid):
    cursor, out = '*', []
    while len(out) < MAX:
        q = urllib.parse.urlencode({'json': 1, 'filter': 'recent', 'review_type': 'negative', 'language': 'english', 'purchase_type': 'all', 'num_per_page': 100, 'cursor': cursor})
        with urllib.request.urlopen(f'https://store.steampowered.com/appreviews/{appid}?{q}', timeout=30) as r:
            d = json.loads(r.read())
        rev = d.get('reviews', [])
        if not rev:
            break
        out += rev
        if d.get('cursor') in (None, cursor):
            break
        cursor = d['cursor']
        time.sleep(1.0)  # be polite
    return out[:MAX]


def bucket(hours):
    for a, b in BUCKETS:
        if a <= hours < b:
            return f'{a}-{int(b) if b < 1e9 else "+"}h'


def main():
    themes, buckets = [], []
    for game, appid in GAMES.items():
        reviews = fetch(appid)
        per = defaultdict(Counter)
        n = Counter()
        for r in reviews:
            h = (r.get('author', {}).get('playtime_at_review') or 0) / 60
            b = bucket(h)
            n[b] += 1
            text = r.get('review', '')
            for k, p in PATTERNS.items():
                if p.search(text):
                    per[b][k] += 1
        for b in [bucket(a + 0.0001) for a, _ in BUCKETS]:
            buckets.append({'game': game, 'bucket': b, 'negative_reviews': n[b]})
            for k in THEMES:
                themes.append({'game': game, 'bucket': b, 'theme': k, 'count': per[b][k], 'share_of_bucket': round(per[b][k] / n[b], 3) if n[b] else ''})
        print(f'{game}: {len(reviews)} negative reviews coded')
    for name, rows in (('steam_themes.csv', themes), ('steam_buckets.csv', buckets)):
        with open(OUT / name, 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=list(rows[0]))
            w.writeheader()
            w.writerows(rows)


if __name__ == '__main__':
    main()
