# The report's values (run by templates/values.py inside tools/compose.py).
import numpy as np


def first_dry(novelty_per_day, prof):
    """The first day the week ahead averages under one new thing a session (as pacing.py)."""
    pr = ASM['profiles'][prof]
    per = np.array(novelty_per_day) / (pr['play_prob'] * len(pr['sessions']))
    wk = np.convolve(per, np.ones(7) / 7, mode='valid')
    return next((d for d in range(len(wk)) if wk[d] < 1.0), None)


base, fixr = run('regular'), run('regular', 'regionfix')
V['BASE_SECRETS'] = f"{base['secrets_found_by_day90']['P50']:.0f}"
V['BASE_PEOPLE'] = f"{base['named_islanders_met_by_day90']['P50']:.0f}"
V['BASE_LEGENDS'] = f"{base['legendaries_by_day90']['P50']:.0f}"
V['FIX_SECRETS'] = f"{fixr['secrets_found_by_day90']['P50']:.0f}"
V['FIX_PEOPLE'] = f"{fixr['named_islanders_met_by_day90']['P50']:.0f}"
V['FIX_LEGENDS'] = f"{fixr['legendaries_by_day90']['P50']:.0f}"
d_base, d_fix = first_dry(base['novelty_per_day_mean'], 'regular'), first_dry(fixr['novelty_per_day_mean'], 'regular')
ds = lambda d: f'day {d}' if d is not None else 'no day within 90'
V['FIX_PACE'] = (f"and the week ahead first averages under one new thing a session on {ds(d_fix)} instead of {ds(d_base)}." if d_fix != d_base
                 else f"the week ahead first averages under one new thing a session on {ds(d_base)} either way.")
V['REG_ALL'] = f"{REG_ALL:,} gold"
V['GOLD_X'] = f"{REG_ALL / 1000:.1f}"
names = {'market: selling fish': 'selling fish at the market', 'layer payouts: ranks, tasks, requests, calendar, journal': "the layer's payouts", 'daily gift, wheel, dig goal, guests': "the museum's daily gift, wheel, dig goal and guests", 'codex milestones and sets': "the codex's milestone and set gold"}
V['REG_SPLIT'] = ', '.join(f"{reg.get(k, 0):,} from {v}" for k, v in names.items())
V['REG_UNSPENT'] = f"{run('regular')['gold_unspent_day90']['P50']:,.0f}"
V['LADDER_TXT'] = LADDER_TXT[0].upper() + LADDER_TXT[1:]
V['STRIP_SPECIES'] = f"{run('regular', 'strip')['fish_species_by_day90']['P50']:.0f}"
V['BASE_SPECIES'] = f"{run('regular')['fish_species_by_day90']['P50']:.0f}"
V['TICK_P99'] = hm(run('regular')['longest_gap_without_any_progress_tick_first_10h_min']['P99'])
V['DR_P50'] = hm(dr('regular')['P50'])
V['DR_P99'] = hm(dr('regular')['P99'])
c = change(dr('regular')['P99'], dr('regular', 'nopity')['P99'])
V['PITY_REG'] = 'no different' if c == 'no change' else c
V['H8_LINE'] = f"**H8 {'passes' if V['H8_PASS'] else 'fails'}** (pity has to shorten the P99 by 25%; it changes it by: {V['PITY_TEXT']})."
pr = PACE['regular']['new_things_per_session']
V['PACE_REG'] = f"about {pr['session 1']:.0f} in the first session, {pr['week 1']:.1f} a session in week one, {pr['day 30']:.2f} by day 30 and {pr['day 60']:.2f} by day 60"
V['H3_LINE'] = (f"The week ahead first averages under one new thing a session on {ds(dry['regular'])} (heavy {ds(dry['heavy'])}, casual {ds(dry['casual'])}); "
                f"**H3 is predicted to {'pass' if V['H3_PASS'] else 'fail'}.** Before #195 it was day 12.")
top = sorted(srcs.items(), key=lambda kv: -kv[1])[:3]
V['DAY60_LINE'] = f"{sum(srcs.values()):.2f} new things a session, mostly " + ', '.join(f"{nm(k)} ({v:.2f})" for k, v in top) + '.'

# what #195 built, against the evidence
rv = REEL['cells']
win = lambda r, s: next(c['win'] for c in rv if c['rarity'] == r and c['skill'] == s)
V['BUILT_TABLE'] = table(['Built in #195', 'What the evidence says', 'So'], [
    ['Rank 1 to 50, XP for every action, rested XP', f"rank gates every purchase (gold is rarely short); XP pops keep the gap with no progress tick under {V['TICK_P99']} while the drought of new things is {V['DR_P50']} at the median; expected, volume-contingent", 'test H14 (`?flags=-rank`) before adding ranks; if it fails, give the 13 rank unlocks to deeds'],
    ['72 fish species with conditions, baits and hot spots', f"a regular player has {run('regular')['fish_species_by_day90']['P50']:.0f} species by day 90; 4 can never bite", 'keep; fix the four'],
    ['The reel', f"a real skill gradient: an epic fish is landed {100 * win(4, 0):.0f}% of the time at no skill and {100 * win(4, 1):.0f}% at full skill", 'keep: fishing gained the depth diagnosis.md asked for'],
    ['Pity (rare and epic ramps, the legendary hazard)', f"without the ramps the worst droughts are {V['PITY_REG']} (H8)", 'harmless; not the answer to droughts'],
    ['Colour variants and trophy sizes', 'procedural: the part of the long tail nobody has to make more of', 'keep (H9, H10)'],
    ['Secrets, viewpoints, fog, legend trails, named islanders', 'off Main Island and Island One, the world layer finds nothing (finding 1)', 'fix the lookup'],
    ['The market: ladder, rods, boats, town fund', f"priced from a target the wallet beats {V['GOLD_X']} times over; the rod menu's odds aren't applied", 'one economy (finding 2); fix the rod text or the odds'],
    ['Daily tasks, login calendar, streak and shields, away letter, event track', 'expected and attendance- or volume-contingent (rewards.md)', 'test with H2 before adding more'],
    ['A subscription flag (off)', 'no payment path; DESIGN.md says free with gems', 'decide (Needs Sean)'],
    ["The layer's sim and acceptance tests", 'they count XP ticks, roll fog the game never has and emit their own secrets, so they could not see finding 1', 'add a check that plays the real islands (`tools/islands_probe.cjs`, the Monte Carlo here)'],
])
rp = DATA / 'repro_check.json'
V['REPRO'] = (lambda r: f"run {r['when'][:10]}: {r['result']}")(json.loads(rp.read_text())) if rp.exists() else 'not run yet'
ic = DATA / 'independent_check.md'
V['INDEPENDENT'] = ("a separate agent that had not seen this work checked 15 code claims against the source (`data/independent_check.md`): "
                    "10 true, 4 true with a caveat, 1 partly true, none false. Its corrections are folded in (the market's Fishing-level bonus, Skull Isle's secret count), "
                    "and it found the island-lookup fault in finding 1, which a browser probe then confirmed.") if ic.exists() else 'not run yet'
V['TAIL'] = fill('report_tail.md')
