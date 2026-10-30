"""Step 9: the economy. Every source and sink of gold, gold per hour by stage, and a 90-day check
of whether gold keeps its value, run as the code stands with FREE switched off.

All prices, incomes and odds come from data/params.json (exported from the game's own code; the
museum's income per stage is computed by wallet.js itself). What a session of play earns through the
progression layer (selling fish at its market, and its payouts: ranks, tasks, requests, the login
calendar, journal milestones) is the Monte Carlo's measured rate per active hour (data/mc_summary.json,
which runs the layer's own code). The play pattern is the 'regular' profile in common.py.

Three runs:
  as coded       FREE off, nothing else changed
  room fix       rooms you build counted from 1, for both the price and the Curator's Office room limit
                 (today both count the 10 rooms a new museum starts with: the first room is priced as room 9,
                 and the build menu stays shut until office level 4)
  no selling     as coded, but duplicates are never sold (to show how much selling carries)
  two shops      as coded, and every duplicate fish is also sold in the Gallery Shop (Storage → Sell), which
                 the game allows: the same catch sits in the codex and in the layer's bag
  H1 design      room fix, and the day's k-th sale is worth 0.5^(k/20) of its price

    python3 docs/progression/models/economy.py
Writes data/economy_sources_sinks.csv, data/economy_runs.csv, data/economy_summary.json, figures/economy_*.png.
"""
import csv
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from common import ASSUMPTIONS, DATA, FIG, PARAMS, PROFILES, RARITY, MC_PATH  # noqa: E402

EC = PARAMS['economy']
SHOP = PARAMS['shop']
PRICE = SHOP['prices']
SELL = SHOP['sellRate']
PROF = PROFILES['regular']
DAYS = 90
MC = json.loads(MC_PATH.read_text())


def mc_rate(source, variant='base'):
    """Gold per active hour from one source, for the regular player (Monte Carlo)."""
    run = MC['runs'].get(f'regular | autumn start (today) | {variant}', {})
    return float(run.get('gold_per_active_hour_by_source', {}).get(source, 0))


SALES = 'market: selling fish'
PAYOUTS = 'layer payouts: ranks, tasks, requests, calendar, journal'
GALLERY = 'Gallery Shop: selling fish'


def sell_price(eid):
    return round(PRICE[RARITY.get(eid, 1)] * SELL)


def per_dig_sale(key):
    t = PARAMS['dig']['table'][key]
    return sum(p * sell_price(i) for i, p in t.items())


def sources_and_sinks():
    """One table of every gold source and sink, with its size."""
    wheel_ev = sum(float(g) * p for g, p in PARAMS['daily']['wheel'].items())
    gifts = PARAMS['daily']['giftByStreak']
    chat = PARAMS['chatter']
    gift_p = ASSUMPTIONS['pleased_share'] + (1 - ASSUMPTIONS['pleased_share']) * chat['giftChance']
    gold_gift = (1 - ASSUMPTIONS['gift_find_share']) * gift_p * np.mean(chat['goldRange']) * (ASSUMPTIONS['pleased_share'] * 2 + (1 - ASSUMPTIONS['pleased_share']))
    dig_sale = per_dig_sale('mineral|brush')
    sp = PARAMS['fishing']['species']
    one = {r: [s['sell'] for s in sp if s['rarity'] == r] for r in range(1, 6)}
    ladder = [l for l in PARAMS['layer']['ladder'] if l['kind'] != 'project']
    projects = [l for l in PARAMS['layer']['ladder'] if l['kind'] == 'project']
    stages = EC['stages']
    rows = [
        ('source', 'museum income (start, entrance open)', stages[0]['incomePerHour'], 'gold/hour, passive, piles cap at 8 h'),
        ('source', 'museum income (main hall + atrium open)', stages[2]['incomePerHour'], 'gold/hour, passive'),
        ('source', 'each room you build (vertical medium)', round(np.mean(np.diff([s['incomePerHour'] for s in stages[2:]])), 1), 'gold/hour added, passive'),
        ('source', 'selling fish at the market (the layer)', round(mc_rate(SALES)), 'gold per active hour, regular player (Monte Carlo; a fish sells for half its rarity x size x variant value)'),
        ('source', "the layer's payouts (ranks, tasks, requests, login calendar, journal)", round(mc_rate(PAYOUTS)), 'gold per active hour, regular player (Monte Carlo)'),
        ('source', 'selling the same fish again in the Gallery Shop', round(mc_rate(GALLERY, 'twoshops')), 'gold per active hour if a player also sells their codex copies (Monte Carlo, two shops)'),
        *[('source', f'one rarity-{r} fish, medium size: Gallery Shop / market', f"{one[r][0]['galleryShop']} / {one[r][0]['market']}", 'gold') for r in range(1, 6) if one[r]],
        ('source', 'selling dug minerals', round(dig_sale), 'gold per dig (a spot rests 10 min)'),
        ('source', 'guest gifts (gold)', round(gold_gift, 1), 'gold per conversation, expected'),
        ('source', 'daily gift', f'{gifts[1]} to {max(gifts)}', 'gold a day (grows with the streak, +100 every 7th day)'),
        ('source', 'daily wheel', round(wheel_ev, 1), 'gold a day, expected'),
        ('source', 'daily dig goal', PARAMS['dig']['dailyGold'], 'gold a day for 3 digs'),
        ('source', 'goals (19, once each)', sum(q['reward'] for q in PARAMS['quests']), 'gold in all'),
        ('source', 'codex milestones (once each)', sum(m['gold'] for m in PARAMS['milestones']), 'gold in all'),
        ('source', 'set rewards (once each)', sum(s['gold'] for s in PARAMS['sets']), 'gold in all'),
        ('sink', 'open the main hall', EC['mainHallPrice'], 'gold, once'),
        ('sink', 'open the atrium', EC['atriumPrice'], 'gold, once'),
        ('sink', 'first room you build (medium)', EC['roomCostTable']['medium'][8], 'gold (priced as room 9: a new museum already lists 10 rooms)'),
        ('sink', 'first room you build, if priced as room 1', EC['roomCostTable']['medium'][0], 'gold (what the formula was written for)'),
        ('sink', 'each next room', '×1.8', 'price multiplier per room'),
        ('sink', 'Curator’s Office levels', ' / '.join(str(c) for c in EC['office'][1:]), 'gold'),
        ('sink', 'staff upgrades (3 × 3 levels)', sum(sum(v) for v in EC['upgrades'].values()), 'gold in all'),
        ('sink', 'security tiers', sum(EC['security']), 'gold in all'),
        ('sink', 'decor items', f"{min(i['price'] for i in EC['items'].values())} to {max(i['price'] for i in EC['items'].values())}", 'gold each; most pay back their price in about 10 hours of income'),
        ('sink', 'Gallery Shop piece', f"{round(PRICE[1] * SHOP['shopRate'])} to {round(PRICE[3] * SHOP['shopRate'])}", 'gold (150% of the rarity price; free while FREE is on)'),
        ('sink', "the layer's ladder: boats, rods, lodge rooms, tanks, furniture", f"{min(l['price'] for l in ladder)} to {max(l['price'] for l in ladder)}; {sum(l['price'] for l in ladder):,} in all", f"gold, {len(ladder)} items, each unlocked by rank (always charged, FREE or not)"),
        ('sink', "the layer's town projects", f"{sum(l['price'] for l in projects):,} in all", f"gold, {len(projects)} projects"),
        ('sink', "the layer's town fund", ' / '.join(f"{v} at rank {k}" for k, v in PARAMS['layer']['fund'].items()), 'gold a level, without end (each pays a Renown token)'),
    ]
    return rows, {'market_sales_per_active_hour': mc_rate(SALES), 'layer_payouts_per_active_hour': mc_rate(PAYOUTS), 'gallery_sales_per_active_hour': mc_rate(GALLERY, 'twoshops'), 'wheel_ev': wheel_ev, 'gift_gold_per_talk': gold_gift, 'dig_sale': dig_sale}


def run(label, room_fix=False, selling=True, taper=None, two_shops=False):
    """A regular player for 90 days, FREE off, buying greedily: whatever raises income most per gold, then the next room."""
    rng = np.random.default_rng(7)
    rows_out = []
    gold = EC['startCoins']
    stage = 0  # index into stages: 0 start, 1 main hall, 2 atrium, 3.. built rooms
    built = 0
    decor_income = 0.0
    decor_slots = 2  # the entrance's two seeded trees are already placed
    items = sorted(EC['items'].values(), key=lambda i: -(i['income'] / max(1, i['price'])))
    office = 1
    caps = EC['officeRooms']  # rooms allowed at office level 1..5 (None = no limit)
    start_rooms = EC['stages'][0]['rooms']  # a new museum already lists 10
    last_collect_h = 0.0
    quests_paid = False
    spent = 0.0
    sales_gold = 0.0
    passive_gold = 0.0
    earned = 0.0  # every gold that came in, from anywhere (H1's denominator)
    _, rates = sources_and_sinks()
    wheel_ev = rates['wheel_ev']
    # selling at the layer's prices, per active hour; the 'two shops' run adds the Gallery Shop's
    sale_rate = rates['market_sales_per_active_hour'] + (rates['gallery_sales_per_active_hour'] if two_shops else 0)
    per_sale = np.mean([s['sell']['galleryShop' if two_shops else 'market'] for s in PARAMS['fishing']['species'] if s['rarity'] <= 2])
    for day in range(DAYS):
        if rng.random() > PROF['play_prob']:
            continue
        for si, (h0, h1) in enumerate(PROF['sessions']):
            now_h = day * 24 + rng.uniform(h0, h1)
            income = EC['stages'][min(stage, len(EC['stages']) - 1)]['incomePerHour'] + decor_income
            if stage >= len(EC['stages']):
                income += 15 * (stage - len(EC['stages']) + 1)
            passive = income * min(EC['offlineCapH'], now_h - last_collect_h)
            gold += passive
            passive_gold += passive
            g_before = gold
            last_collect_h = now_h
            if si == 0:
                gold += PARAMS['daily']['giftByStreak'][min(day + 1, 14)] + wheel_ev + PARAMS['dig']['dailyGold']
            gold += PROF['talks'] * rates['gift_gold_per_talk']
            gold += rates['layer_payouts_per_active_hour'] * PROF['session_min'] / 60
            if selling:
                sale = sale_rate * PROF['session_min'] / 60 + rates['dig_sale'] * 3
                if taper:
                    # the k-th sale of the day is worth 0.5^(k / taper) of its price: the day's total levels off
                    n_sales = sale / max(1e-9, per_sale)
                    sold_today = getattr(run, '_sold', 0) if getattr(run, '_day', -1) == day else 0
                    k0, k1 = sold_today, sold_today + n_sales
                    sale = per_sale * taper / np.log(2) * (0.5 ** (k0 / taper) - 0.5 ** (k1 / taper))
                    run._sold, run._day = k1, day
                gold += sale
                sales_gold += sale
            if not quests_paid and day >= 2:
                gold += sum(q['reward'] for q in PARAMS['quests']) * 0.6  # most goals finish in the first days (several are met at the start)
                quests_paid = True
            earned += passive + (gold - g_before)
            # spend: the main hall, the atrium, office levels, decor, then rooms
            while True:
                if stage == 0 and gold >= EC['mainHallPrice']:
                    gold -= EC['mainHallPrice']; spent += EC['mainHallPrice']; stage = 1; decor_slots += 8; continue
                if stage == 1 and gold >= EC['atriumPrice']:
                    gold -= EC['atriumPrice']; spent += EC['atriumPrice']; stage = 2; decor_slots += 10; continue
                counted = built if room_fix else start_rooms + built  # what the office's room limit is checked against
                cap = caps[office - 1]
                room_allowed = cap is None or counted < cap
                if office < len(EC['office']) and gold >= EC['office'][office] and (not room_allowed or EC['office'][office] < 3 * max(1, income) * 24):
                    gold -= EC['office'][office]; spent += EC['office'][office]; office += 1; continue
                free_decor = decor_slots - sum(1 for _ in range(0))
                buy = next((i for i in items if i['lvl'] <= office and i['income'] > 0 and i['price'] <= gold), None)
                if buy and decor_slots > 0:
                    gold -= buy['price']; spent += buy['price']; decor_income += buy['income']; decor_slots -= 1; continue
                n = built + 1 if room_fix else built + 9
                cost = EC['roomCostTable']['medium'][min(n - 1, 29)]
                if room_allowed and gold >= cost:
                    gold -= cost; spent += cost; built += 1; stage = max(stage, 2) + 1; decor_slots += 6; continue
                break
            next_cost = EC['roomCostTable']['medium'][min((built + 1 if room_fix else built + 9) - 1, 29)]
            rows_out.append({'run': label, 'day': day, 'session': si, 'gold': round(gold), 'income_per_hour': round(income, 1), 'rooms_built': built, 'office': office, 'decor_slots_left': decor_slots, 'next_room_cost': next_cost, 'hours_of_income_to_next_room': round(next_cost / max(1, income), 1), 'spent_so_far': round(spent), 'passive_gold_so_far': round(passive_gold), 'sales_gold_so_far': round(sales_gold), 'earned_so_far': round(earned)})
    return rows_out


def main():
    table, rates = sources_and_sinks()
    with open(DATA / 'economy_sources_sinks.csv', 'w', newline='') as f:
        w = csv.writer(f)
        w.writerow(['kind', 'what', 'amount', 'unit'])
        w.writerows(table)
    runs = run('as coded') + run('room fix', room_fix=True) + run('no selling', selling=False) + run('two shops', two_shops=True) + run('H1 design', room_fix=True, taper=20)
    with open(DATA / 'economy_runs.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(runs[0]))
        w.writeheader()
        w.writerows(runs)
    out = {'rates': rates, 'runs': {}}
    for label in ('as coded', 'room fix', 'no selling', 'two shops', 'H1 design'):
        r = [x for x in runs if x['run'] == label]
        last = r[-1]
        wk = [x for x in r if x['day'] <= 6][-1]
        first_room = next((x['day'] for x in r if x['rooms_built'] >= 1), None)
        out['runs'][label] = {
            'day90_gold': last['gold'],
            'day90_income_per_hour': last['income_per_hour'],
            'rooms_built_by_day90': last['rooms_built'],
            'day_first_room_built': first_room,
            'hours_of_income_to_next_room_at_day90': last['hours_of_income_to_next_room'],
            'gold_unspent_share_day90': round(last['gold'] / max(1, last['gold'] + last['spent_so_far']), 3),
            'sessions_to_first_room': next((i + 1 for i, x in enumerate(r) if x['rooms_built'] >= 1), None),
            'museum_income_share_week1': round(wk['passive_gold_so_far'] / max(1, wk['earned_so_far']), 3),
        }
    stages = PARAMS['economy']['stages']
    out['first_room_hours_of_income_as_coded'] = round(PARAMS['economy']['roomCostTable']['medium'][8] / stages[2]['incomePerHour'], 1)
    out['selling_vs_passive_ratio'] = round(rates['market_sales_per_active_hour'] / stages[2]['incomePerHour'], 1)
    out['two_shops_vs_passive_ratio'] = round((rates['market_sales_per_active_hour'] + rates['gallery_sales_per_active_hour']) / stages[2]['incomePerHour'], 1)
    (DATA / 'economy_summary.json').write_text(json.dumps(out, indent=1, default=float))
    plots(runs)
    for k, v in out['runs'].items():
        print(f'{k}: {v}')
    print(f"first room = {out['first_room_hours_of_income_as_coded']} h of museum income; an hour of play sells for {out['selling_vs_passive_ratio']}x an hour of museum income ({out['two_shops_vs_passive_ratio']}x with both shops)")


def plots(runs):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, ax = plt.subplots(1, 2, figsize=(10, 4))
    for label in ('as coded', 'room fix', 'no selling', 'two shops', 'H1 design'):
        r = [x for x in runs if x['run'] == label]
        d = [x['day'] + x['session'] / 2 for x in r]
        ax[0].plot(d, [x['rooms_built'] for x in r], label=label)
        ax[1].plot(d, [x['hours_of_income_to_next_room'] for x in r], label=label)
    ax[0].set_title('Rooms built (regular player, FREE off)')
    ax[0].set_xlabel('day')
    ax[1].set_title('Hours of museum income to afford the next room')
    ax[1].set_yscale('log')
    ax[1].set_xlabel('day')
    for a in ax:
        a.legend()
    fig.tight_layout()
    fig.savefig(FIG / 'economy_rooms.png', dpi=140)
    plt.close(fig)


if __name__ == '__main__':
    main()
