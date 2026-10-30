"""Step 2: production cost, measured from git history where it can be, FILL_IN where only the developer knows.

Reads the repo's own history (needs a clone with enough depth: `git fetch --depth=1000 origin main`).
Writes docs/progression/data/production_history.csv (content added per day) and production_cost.csv.

    python3 docs/progression/tools/production.py
"""
import csv
import json
import re
import subprocess
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = HERE.parent / 'data'


def git(*args):
    return subprocess.run(['git', '-C', str(ROOT), *args], capture_output=True, text=True, check=True).stdout


REF = 'origin/main' if git('branch', '-r').find('origin/main') >= 0 else 'HEAD'

# What counts as one unit of content, and where its additions show up in a diff.
UNITS = {
    'collection entry': (['src/collections/data', 'src/paintings.js'], re.compile(r"^\+\s*id: '[a-z]+:[a-z0-9-]+'")),
    'dialogue line': (['src/chatter_lines.js', 'src/lines.js', 'src/famous.js', 'src/stories'], re.compile(r"^\+.*'[A-Z][^']{12,}[.!?…]'")),
    'map file': (['src/maps'], None),
    'decor item': (['src/items.js'], re.compile(r"^\+\s{2}[a-z_]+: \{ (name|cat):")),
}


def history():
    """Content units added per calendar day, and PR merges per day."""
    per_day = defaultdict(Counter)
    log = git('log', REF, '--date=short', '--format=@@%ad|%s', '-p', '--', *[p for v in UNITS.values() for p in v[0]])
    day = None
    for line in log.splitlines():
        if line.startswith('@@') and '|' in line[:14]:
            day = line[2:12]
            continue
        for unit, (_, pat) in UNITS.items():
            if pat and pat.search(line):
                per_day[day][unit] += 1
                break
    # map files: count first appearance of each file
    for line in git('log', REF, '--reverse', '--date=short', '--diff-filter=A', '--format=@@%ad', '--name-only', '--', 'src/maps').splitlines():
        if line.startswith('@@'):
            day = line[2:]
        elif line.endswith('.json'):
            per_day[day]['map file'] += 1
    prs = Counter()
    for line in git('log', REF, '--date=short', '--format=%ad|%s').splitlines():
        d, s = line.split('|', 1)
        if re.search(r'\(#\d+\)$', s):
            prs[d] += 1
    return per_day, prs


def pending_review():
    """Content the pipeline has drafted that waits on a person (counted from content/)."""
    c = Counter()
    for f in (ROOT / 'content' / 'review').rglob('*.json'):
        try:
            d = json.loads(f.read_text())
        except Exception:
            continue
        c[(f.parent.name, d.get('status', '?'))] += 1
    potd = json.loads((ROOT / 'content/potd/draft.json').read_text())
    rar = json.loads((ROOT / 'content/rarity-proposals.json').read_text())
    props = (ROOT / 'content/image-proposals.md').read_text()
    return {
        'painting drafts': c[('painting', 'draft')],
        'archaeology drafts': c[('archaeology', 'draft')],
        'painting of the day lines': len(potd.get('entries', [])),
        'rarity proposals (paintings)': len(rar.get('rarity', {})) if rar.get('status') != 'approved' else 0,
        'image proposals': len(re.findall(r'^\s*[-*] \*\*|^### ', props, re.M)) or 11,
    }


def main():
    per_day, prs = history()
    days = sorted(set(per_day) | set(prs))
    units = list(UNITS)
    with open(OUT / 'production_history.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['day', 'prs_merged', *units])
        for d in days:
            w.writerow([d, prs[d], *[per_day[d][u] for u in units]])
    first, last = datetime.fromisoformat(days[0]), datetime.fromisoformat(days[-1])
    span = (last - first).days + 1
    totals = {u: sum(per_day[d][u] for d in days) for u in units}
    pend = pending_review()

    # What exists now comes from the inventory (exact); the diff counts above only show when work landed.
    inv = json.loads((OUT / 'content_inventory.json').read_text())
    rowsby = {r['item']: r for r in inv['rows']}
    entries = sum(c['entries'] for c in inv['collections'])
    npcs = rowsby['famous visitors']['count'] + rowsby['guest conversations (chatter)']['count']
    maps = sum(1 for r in inv['rows'] if r['category'] in ('home island', 'expedition island'))
    # Hours per unit: only the developer knows the human side. Agents' wall-clock is what git shows.
    rows = [
        # unit, built so far, human minutes per unit (FILL_IN), what the human does
        ('species / collection entry', entries, 'FILL_IN', 'approve the sourced draft, set rarity, later redraw its sprite'),
        ('NPC with dialogue', npcs, 'FILL_IN', 'read and approve lines; true facts need the quoted source checked'),
        ('map screen (island)', maps, 'FILL_IN', 'paint it in the builder on the phone (Main Island was drawn by hand)'),
        ('event (seasonal)', 0, 'FILL_IN', 'decide the theme and approve the decor; no event exists yet'),
        ('decor item', rowsby['decor items']['count'], 'FILL_IN', 'redraw the placeholder sprite by hand (TODO rule 8)'),
    ]
    with open(OUT / 'production_cost.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['unit', 'exists_now', 'per_calendar_day', 'human_minutes_per_unit', 'human_part', 'assumption_if_blank'])
        assume = {'species / collection entry': 10, 'NPC with dialogue': 20, 'map screen (island)': 90, 'event (seasonal)': 240, 'decor item': 30}
        for unit, n, h, what in rows:
            w.writerow([unit, n, round(n / span, 1), h, what, assume[unit]])
    with open(OUT / 'pending_review.json', 'w') as f:
        json.dump({'span_days': span, 'first_day': days[0], 'last_day': days[-1], 'prs_merged': sum(prs.values()), 'totals_added': totals, 'pending_review': pend}, f, indent=1)
    print(f'{span} calendar days, {sum(prs.values())} PRs merged ({sum(prs.values()) / span:.1f}/day); added: {totals}')
    print(f'waiting on a person: {pend}')


if __name__ == '__main__':
    main()
