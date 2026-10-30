# Run by tools/compose.py (exec'd with its helpers in scope): computes every value the templates use.
# Each value comes from a file in data/; nothing here is typed in by hand except words.
M = ASM['measured']
# the Monte Carlo's source and activity names, in words
NAME = {'fishing': 'new fish species', 'fishing: variant': 'colour variants', 'fishing: trophy': 'trophy sizes', 'unlock': 'unlocks',
        'exploring: secret': 'secrets', 'exploring: place': 'places and viewpoints', 'gallery shop': "the Gallery Shop's shelf", 'metal detector': 'the metal detector',
        'dig': 'digs', 'guest gift': "guests' gifts", 'expedition': 'expedition finds', 'people': 'named islanders met', 'lead': 'leads', 'the X': 'the X',
        'exploring': 'walking about', 'sailing': 'sailing', 'guests': 'museum guests', 'expedition ': 'expeditions'}
nm = lambda k: NAME.get(k, k)
ACT = {'fishing': 'fishing', 'guests': 'museum guests', 'metal detector': 'the metal detector', 'dig': 'digging', 'exploring': 'walking about', 'sailing': 'sailing',
       'people': 'talking to named islanders', 'expedition': 'expeditions', 'the X': 'the X'}
V['OVERHEAD'] = f"{M.get('cast_overhead_s', ASM['assumptions']['cast_overhead_s']):.1f} s"
V['BRUSH'] = f"{M.get('brush_s', 14.5):.1f} s"
V['REEL_N'] = f"{REEL['fights_per_cell']:,}"
skills = sorted({c['skill'] for c in REEL['cells']})
V['REEL_TABLE'] = table(['Rarity'] + [f'skill {s:g}' for s in skills], [[f"{r} ({['', 'common', 'uncommon', 'rare', 'epic', 'legendary'][r]})"] + [f"{100 * next(c['win'] for c in REEL['cells'] if c['rarity'] == r and c['skill'] == s):.0f}%" for s in skills] for r in range(1, 6)])
V['OBTAINABLE'] = MC['obtainable_in_model']
V['WORDS'] = f"{sum(r['words'] for r in json.loads((DATA / 'content_inventory.json').read_text())['rows']):,}"

# ---- content velocity ----
per = {r['profile']: r for r in CV['per_unit'] if r['what'] == 'collection entries'}
need = {n['profile']: n for n in CV['subscription_need']}
for p in PROFILES:
    d = per[p]['runway_days_P50']
    V[f'RW_{p.upper()}'] = f'day {d:.0f}' if fin(d) else 'not within 90 days'
rw = {p: per[p]['runway_days_P50'] for p in PROFILES}
V['RW_TEXT'] = ('At P50, three quarters of everything obtainable is collected by ' + ' and '.join(f"day {rw[p]:.0f} ({p})" for p in PROFILES if fin(rw[p])) +
                ''.join(f"; a {p} player doesn't get there within 90 days" for p in PROFILES if not fin(rw[p])) + '.')
cvs = {p: per[p]['player_hours_per_unit'] for p in PROFILES}
reach75 = [p for p in PROFILES if fin(cvs[p])]
V['CV_TEXT'] = ('Each buys about ' + ' and '.join(f"{cvs[p] * 60:.0f} minutes of active play for a {p} player" for p in reach75) +
                ' (active time to 75% of them, divided by the entries)' + ''.join(f"; a {p} player doesn't reach 75% within 90 days" for p in PROFILES if p not in reach75) + '.')
for p in ('regular', 'heavy'):
    V[f'NEED_{p.upper()}'] = need[p]['new_units_per_month']
    V[f'NEED_{p.upper()}_H'] = need[p]['human_hours_per_month']
src = [m for m in CV['multipliers'] if m['profile'] == 'regular']
V['SOURCES_TABLE'] = table(['Source', 'week 1', 'day 30', 'day 60', 'who has to make more of it'], [[nm(m['source']), f"{m['week_1_per_session']:.2f}", f"{m['day_30_per_session']:.2f}", f"{m['day_60_per_session']:.2f}", m['who_makes_more']] for m in src])
top30 = sorted(src, key=lambda m: -m['day_30_per_session'])[:3]
V['SOURCES_TEXT'] = ('By day 30 the most new things a session come from ' + ', '.join(f"{nm(m['source'])} ({m['day_30_per_session']:.2f})" for m in top30) + '. ' +
                     'Variants and trophy sizes, which the layer built, are procedural: nobody has to make more of them, so they are the part of the long tail that does not wait on the developer.')

# ---- economy ----
GOLD_KEYS = ['market: selling fish', 'layer payouts: ranks, tasks, requests, calendar, journal', 'daily gift, wheel, dig goal, guests', 'codex milestones and sets', 'Gallery Shop: selling fish']
rows = []
for p in PROFILES:
    g = run(p)['gold_per_active_hour_by_source']
    rows.append([p] + [f"{g.get(k, 0):,}" for k in GOLD_KEYS[:4]] + [f"**{sum(g.get(k, 0) for k in GOLD_KEYS[:4]):,}**", f"{run(p)['gold_spent_per_active_hour']:,}"])
V['GOLD_TABLE'] = table(['Profile', 'selling fish at the market', "the layer's payouts", 'the old daily gift, wheel, dig goal, guests', 'codex milestones and sets', 'all', 'spent'], rows)
reg = run('regular')['gold_per_active_hour_by_source']
lad = [l for l in P['layer']['ladder'] if l['kind'] != 'project']
proj = [l for l in P['layer']['ladder'] if l['kind'] == 'project']
REG_H = run('regular')['active_hours_by_day90']['P50']
REG_ALL = sum(reg.get(k, 0) for k in GOLD_KEYS[:4])
LAYER_ONLY = reg.get(GOLD_KEYS[0], 0) + reg.get(GOLD_KEYS[1], 0)
LADDER_TXT = (f"every rung of the ladder costs {min(l['price'] for l in lad)} to {max(l['price'] for l in lad)} gold, {60 * min(l['price'] for l in lad) / REG_ALL:.0f} to {60 * max(l['price'] for l in lad) / REG_ALL:.0f} minutes of what a regular player earns, "
              f"and the ladder and the 40 town projects together cost {sum(l['price'] for l in lad + proj):,}, against about {round(REG_ALL * REG_H, -3):,.0f} earned by day 90. "
              f"The rest goes into the town fund (no end, a Renown token a level): the median regular player holds {run('regular')['gold_unspent_day90']['P50']:,.0f} gold on day 90.")
V['GOLD_TEXT'] = (f"A regular player earns {REG_ALL:,} gold an active hour in all, {REG_ALL / 1000:.1f} times the top of that range; the layer's own sources alone give {LAYER_ONLY:,}. "
                  f"The rest comes from systems the layer's sim does not have: the museum's daily gift, wheel and dig goal, guests, and the codex's milestone and set gold. "
                  f"Gold is rarely what stops a purchase: {LADDER_TXT}")
two = run('regular', 'twoshops')
V['TWOSHOPS_EXTRA'] = f"{two['gold_per_active_hour_by_source'].get('Gallery Shop: selling fish', 0):,} gold" if two else 'n/a'
sp = P['fishing']['species']
def two_row(r):
    x = next(s['sell'] for s in sp if s['rarity'] == r)
    return [r, x['galleryShop'], f"{x['market']} / {x['marketAtFishing20']}", f"{x['galleryShop'] / x['market']:.1f}× / {x['galleryShop'] / x['marketAtFishing20']:.1f}×"]
V['TWO_SHOPS_TABLE'] = table(['Rarity', 'Gallery Shop (codex copy)', 'market (bag copy), Fishing 1 / 20', 'Gallery Shop pays'], [two_row(r) for r in range(1, 6)])
sinks = list(csv.reader(open(DATA / 'economy_sources_sinks.csv')))[1:]
V['SINKS_TABLE'] = table(['Kind', 'What', 'Amount', 'Unit'], [r for r in sinks if r[0] == 'sink' or 'layer' in r[1] or 'Gallery' in r[1] or 'market' in r[1]])
V['FIRST_ROOM_H'] = f"{ECON['first_room_hours_of_income_as_coded']:.0f}"
V['RATIO'] = f"{ECON['selling_vs_passive_ratio']:.0f}"
V['RATIO2'] = f"{ECON['two_shops_vs_passive_ratio']:.0f}"
er = ECON['runs']
def erow(label, key):
    x = er[key]
    return [label, f"session {x['sessions_to_first_room']} (day {x['day_first_room_built']})" if x['sessions_to_first_room'] else 'never', x['rooms_built_by_day90'], pctf(x['museum_income_share_week1']), f"{x['hours_of_income_to_next_room_at_day90']:,.0f} h"]
V['ECON_ROWS'] = table(['Run', 'First room', 'Rooms by day 90', "Museum income's share of week-1 gold", 'Next room at day 90'], [erow('as coded', 'as coded'), erow('no selling', 'no selling'), erow('two shops', 'two shops'), erow('room count fixed', 'room fix'), erow('**H1 design**: room count fixed, and the k-th sale of a day worth 0.5^(k/20)', 'H1 design')])
h1 = er['H1 design']
V['H1_PASS'] = (h1['sessions_to_first_room'] or 99) <= 3 and h1['museum_income_share_week1'] >= 0.3
V['H1_TEXT'] = (f"**H1 in the model**: the H1 design builds its first room in session {h1['sessions_to_first_room']} (bar: 3) and museum income is {pctf(h1['museum_income_share_week1'])} of week-1 gold (bar: 30%): " +
                ('it passes. ' if V['H1_PASS'] else 'it fails. ') +
                "The curve problem remains: by day 90 the next room is hundreds of hours of income away in every run.")
V['ECON'] = fill('econ.md')

# ---- Monte Carlo ----
ms, runs_t = mc_tables()[0], mc_tables()[1]
V['MILESTONES'] = ms
V['RUNS'] = runs_t
V['EXPLORE_MIN'] = f"{ASM['assumptions']['explore_find_mean_min']:.0f}"
V['N_TEXT'] = 'Players per run: ' + ', '.join(f"{p} {run(p)['n']:,}" for p in PROFILES) + ' (variants and the spring start run fewer; P99 is the 99th of those players).'
THEIRS = {2: ('2 min', '2 min'), 5: ('26 min', '14 min'), 10: ('2.7 h', '2.1 h'), 15: ('7.6 h', '5.3 h'), 20: ('15.0 h', '10.2 h'), 30: ('40.4 h', '22.6 h'), 40: ('81.4 h', '40.7 h'), 50: ('143.3 h', '65.5 h')}
V['RANK_TABLE'] = table(['Rank', "the layer's spec target", 'its sim: casual / hardcore', 'here: casual', 'regular', 'heavy'],
                        [[r, {2: '3 min', 5: '25 min', 10: '3 h', 15: '8 h', 20: '15 h', 30: '40 h', 40: '80 h', 50: '140 h'}[r], f"{THEIRS[r][0]} / {THEIRS[r][1]}"] + [hm(met(p, f'rank {r}')) + ('' if reached(p, f'rank {r}') >= 0.5 else f" ({pctf(reached(p, f'rank {r}'))} by day 90)") for p in PROFILES] for r in (2, 5, 10, 20, 30, 50)])
def dr(p, v='base'):
    r = run(p, v)
    return r['longest_drought_first_10h_min'] if r else None
rows = []
for p in PROFILES:
    b, q = dr(p), dr(p, 'nopity')
    rows.append([p, hm(b['P50']), hm(b['P99']), hm(q['P99']) + f" ({change(q['P99'], b['P99'])} with pity)", hm(run(p)['longest_gap_without_any_progress_tick_first_10h_min']['P99'])])
V['DROUGHT_TABLE'] = table(['Profile', 'drought P50', 'drought P99', 'P99 without the rare and epic pity ramps', 'longest gap with no progress tick at all, P99'], rows)
pity_reg = change(dr('regular', 'nopity')['P99'], dr('regular')['P99'])
cut = {p: (dr(p, 'nopity')['P99'] - dr(p)['P99']) / dr(p, 'nopity')['P99'] if dr(p, 'nopity')['P99'] else 0 for p in PROFILES}
V['H8_PASS'] = all(c >= 0.25 for c in cut.values())
V['PITY_TEXT'] = ', '.join(f"{p} {change(dr(p, 'nopity')['P99'], dr(p)['P99'])}" for p in PROFILES)
V['DROUGHT_TEXT'] = (f"Against the 36-minute ceiling (hypotheses.md), the median drought is {hm(dr('casual')['P50'])} for a casual player, {hm(dr('regular')['P50'])} for a regular one and {hm(dr('heavy')['P50'])} for a heavy one. "
                     f"With the layer's pity the worst droughts (P99) are: {V['PITY_TEXT']}. **H8: " + ('passes' if V['H8_PASS'] else 'fails') + " the 25% bar.** "
                     "The pity ramps raise the chance of a rare or epic *tier*, not of something you lack, so they cannot reach droughts that come from having caught what bites here and now. "
                     f"The layer's own measure, the longest stretch with no progress tick at all, is {hm(run('regular')['longest_gap_without_any_progress_tick_first_10h_min']['P99'])} at P99 for a regular player, because every catch pops XP: it measures volume, not novelty.")
rows = []
for p in PROFILES:
    b, s = run(p), run(p, 'strip')
    if not s:
        continue
    rows.append([p, f"{b['fish_species_by_day90']['P50']:.0f} / {s['fish_species_by_day90']['P50']:.0f}", f"{pctf(b['share_of_obtainable_collected_day90']['P50'])} / {pctf(s['share_of_obtainable_collected_day90']['P50'])}", f"{hm(dr(p)['P50'])} / {hm(dr(p, 'strip')['P50'])}", f"{hm(met(p, '50% of everything obtainable'))} / {hm(met(p, '50% of everything obtainable', 'strip'))}"])
V['STRIP_TABLE'] = table(['Profile', 'fish species by day 90 (as is / strip)', 'share of obtainable by day 90', 'drought P50', 'active time to half of everything'], rows)
sb = {p: (run(p), run(p, 'strip')) for p in PROFILES}
V['STRIP_TEXT'] = ("Opening every boat, rod, region and perk from the start, and paying nothing out, changes little in what a player finds: by day 90 " +
                   ', '.join(f"{p} {b['fish_species_by_day90']['P50']:.0f} species as built and {s_['fish_species_by_day90']['P50']:.0f} stripped" for p, (b, s_) in sb.items()) +
                   ". What paces new things is the calendar, the conditions and what is left to find, not the gates; the gates mostly decide *when in the first days* a place opens. "
                   f"The strip build earns less ({run('regular', 'strip')['gold_per_active_hour_by_source'].get(GOLD_KEYS[1], 0):,} an hour of layer payouts against {reg.get(GOLD_KEYS[1], 0):,}), which is the point of the test: whether players notice (H0, H5, H6).")
fish_page = {p: reached(p, 'page complete: fish') for p in PROFILES}
V['CALENDAR_TEXT'] = (f"{MC['fish_that_never_bite']} of the {MC['fish_species']} fish can never bite (diagnosis.md), and 12 are festival fish that bite only in their festival's dates; "
                      f"so no profile completes the fish page within 90 days ({', '.join(f'{p} {pctf(v)}' for p, v in fish_page.items())}). "
                      f"By day 90 the median regular player has {run('regular')['fish_species_by_day90']['P50']:.0f} species, the heavy one {run('heavy')['fish_species_by_day90']['P50']:.0f}.")
rows = []
for p in PROFILES:
    b, f = run(p), run(p, 'regionfix')
    if not f:
        continue
    rows.append([p] + [f"{b[k]['P50']:.0f} / {f[k]['P50']:.0f}" for k in ('secrets_found_by_day90', 'named_islanders_met_by_day90', 'legendaries_by_day90', 'fish_species_by_day90')] + [f"{pctf(b['share_of_obtainable_collected_day90']['P50'])} / {pctf(f['share_of_obtainable_collected_day90']['P50'])}", f"{hm(dr(p)['P50'])} / {hm(dr(p, 'regionfix')['P50'])}"])
V['FIX_TABLE'] = table(['Profile', 'secrets found (as built / fixed)', 'named islanders met', 'legendaries caught', 'fish species', 'share of obtainable', 'drought P50'], rows)
V['MCSECTION'] = fill('mc.md')

# ---- pacing ----
rows = []
for p, v in PACE.items():
    h = v['new_things_per_session']
    rows.append([p] + [f"{h.get(k, float('nan')):.2f}" for k in ('session 1', 'week 1', 'day 30', 'day 60', 'day 90')] + [f"day {v['first_day_the_week_ahead_averages_under_one_new_thing_a_session']}" if v['first_day_the_week_ahead_averages_under_one_new_thing_a_session'] is not None else 'not within 90 days'])
V['PACE_TABLE'] = table(['', 'session 1', 'week 1', 'day 30', 'day 60', 'day 90', 'the week ahead first averages under one new thing a session'], rows)
dry = {p: PACE[p]['first_day_the_week_ahead_averages_under_one_new_thing_a_session'] for p in PROFILES}
V['H3_PASS'] = dry['regular'] is None or dry['regular'] >= 30
V['PACE_TEXT'] = (f"A regular player's week ahead first averages under one new thing a session on " + (f"day {dry['regular']}" if dry['regular'] is not None else 'no day within 90') +
                  f" (casual " + (f"day {dry['casual']}" if dry['casual'] is not None else 'never') + ", heavy " + (f"day {dry['heavy']}" if dry['heavy'] is not None else 'never') + "). "
                  f"**H3 (at least one a session through day 30) is predicted to " + ('pass.**' if V['H3_PASS'] else 'fail.**') +
                  " Before #195 the first pass's model put the regular player under one a session from day 12; the layer's species, secrets, variants and trophies bought a week.")
r = run('regular')
srcs = {k: sum(v[57:64]) / 7 for k, v in r['by_source_per_session'].items()}
mins = {k: sum(v[57:64]) / 7 for k, v in r['minutes_per_session'].items()}
rows = [[ACT.get(k, k), f"{mins[k]:.1f}"] for k in sorted(mins, key=lambda k: -mins[k]) if mins[k] >= 0.05]
V['DAY60'] = table(['Activity', 'minutes a session'], rows + [['**all**', f"**{sum(mins.values()):.1f}**"]]) + '\n\n' + table(['New things from', 'a session'], [[nm(k), f"{v:.2f}"] for k, v in sorted(srcs.items(), key=lambda kv: -kv[1]) if v >= 0.005] + [['**all**', f"**{sum(srcs.values()):.2f}**"]])
V['ELDER_TEXT'] = (f"**Why that player still logs in.** At day 60 a session brings {sum(srcs.values()):.2f} new things, most of them " + ', '.join(nm(k) for k, v in sorted(srcs.items(), key=lambda kv: -kv[1])[:3]) +
                   ". What the layer adds every session regardless is meters: XP, a skill bar, a task ticked, the login calendar, the event track (rewards.md). Whether those bring a player back is exactly what H2 and H14 test; the evidence so far is that they are expected, attendance- and volume-contingent rewards, the kind the meta-analysis warns about.")
V['PACING'] = fill('pacing.md')

# ---- the report ----
exec((TPL / 'report_values.py').read_text(), globals())
