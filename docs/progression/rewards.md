# Step 13: every reward, labelled

**The rule.** Rewards should mostly be *informational* (they tell you that you are getting better,
or show you something new) and often *unexpected*. Avoid expected, contingent payouts on activities
that are already fun: in Deci, Koestner and Ryan's 1999 meta-analysis of 128 experiments, tangible
rewards that people expect and that depend on doing or finishing a task lowered how much they chose
to keep doing it afterwards, while unexpected tangible rewards did not, and positive feedback raised it.

**The labels.**

- *Informational*: it is feedback on competence or discovery (a new species, a better tool, a
  plaque). *Controlling*: it is a payment for doing what the game asks (gold for a goal, a gift for
  logging in).
- *Expected*: the player knows in advance it is coming and what for. *Unexpected*: it arrives as a
  surprise, or its size or content is a surprise.
- *Contingency* (from the meta-analysis): engagement (for doing it at all), completion (for
  finishing), performance (for doing it well), or none.

## Rewards in the game now

| Reward | Where | Informational / controlling | Expected / unexpected | Contingency | Note |
|---|---|---|---|---|---|
| Catch card: species, rarity, size | fishing.js `showCatch` | informational | unexpected | none | the core reveal |
| "New!" on a first catch or find | fishing.js, dig.js | informational | unexpected | none | |
| "Biggest yet!" | fishing.js | informational | unexpected | performance (sort of: luck) | sizes are tracked but no goal uses them |
| The dig reveal | dig.js | informational | unexpected | none | the best moment in the game |
| The restoration reveal | restorestudio.js | informational | expected (you know what it is) | completion | intrinsic: the real object appears |
| Bobber unlocks | fishing.js `BOBBERS.goal` | informational | expected (the goal is shown) | completion | the gain is real (faster, luckier) |
| Dig tool unlocks (trowel, pick) | dig.js `TOOLS.need` | informational | expected | completion | the brush is already best for rare finds |
| Metal detector | puzzles-hunt.js | informational | unexpected (not announced) | completion | a new verb: good |
| Codex stamp, journal entry, silhouette filled | collections/ | informational | unexpected | none | |
| Set plaque | collections/tab.js | informational | expected | completion | |
| **Set gold** (400 to 800 for fish sets) | codex `claimSet` | controlling | expected | completion | test with H6 |
| **Codex milestone gold** (500 to 50,000) | milestones.js | controlling | expected | completion | test with H6 |
| **Goals gold** (19 goals, 4,500 in all) | quests.js | controlling | expected | completion | test with H4 |
| **Daily dig goal** (120 gold for 3 digs) | dig.js `recordDig` | controlling | expected | completion | asks for digging you'd do anyway |
| **Daily gift** (50 to 210 by streak) | daily.js | controlling | expected | engagement (showing up) | test with H2 |
| **Daily wheel** | daily.js | controlling | expected to exist, unexpected size | engagement | cut candidate (diagnosis.md) |
| Guest gifts (gold or a find) | chatter.js | informational when a find; neutral when gold | unexpected | none (pleased doubles it) | |
| Guest "pleased" when you hang what they asked for | chatter.js | informational | expected once asked | completion | the seed of a real want |
| Famous visitor met (+5% income each) | famous.js | informational (meeting); controlling (the boost) | expected | engagement | all 19 are present at once |
| Story chapters, chains, leads | story.js, leads.js | informational | unexpected | completion | |
| Expedition finds and "done" | expedition.js | informational | unexpected | completion | |
| Room open celebration (confetti) | ui.js `celebrate` | informational | expected | completion | |
| Passive gold piles | wallet.js | controlling | expected | engagement | the tycoon's income; free while `FREE` is on |
| Selling to the shop | shop.js | controlling | expected | none | 50% of the rarity price; see models.md for how large this is |

## Rewards the progression layer added (#195, merged 2026-10-29), labelled from its code

The earlier version of this file labelled the feature spec's proposals before any was built. The other chat
built nearly all of them in one PR; these are the rewards as they now run (`src/progression/`).

| Reward | Where | Informational / controlling | Expected / unexpected | Contingency | Note |
|---|---|---|---|---|---|
| XP after every catch, junk, talk, chunk of fog, crossing (a floating number until #217, now a tick sound) | fishevents.js, activity.js, friendship.js | a number going up: feedback on volume, not on skill | expected | engagement (every action, even an old boot) | the layer's sim counts these as its "progress ticks"; they cannot show you anything new |
| First catch of the day: XP ×2 | fishevents.js | controlling | expected | engagement (showing up) | |
| Rested XP (a bonus pool after time away) | rank.js `creditAway` | controlling | expected | engagement (being away, then coming back) | |
| Rank-up ceremony and its rewards | service.js, data/ranks.json | gold and cosmetics: controlling; a boat, rod or gear: informational (a new place or verb) | expected (the pill previews "Next") | engagement (ranks come from volume) | 13 of 50 ranks unlock something; the rest pay gold, bait or a cosmetic |
| Skill levels and perks | skills.js, data/skills.json | informational (50 perks; some change how a verb feels) | expected | engagement, a little performance (perfect catches give more) | |
| The reel: a perfect catch | reel.js | informational | unexpected the first time | performance | the one reward in the layer that measures skill (data/reel_skill.json) |
| Reveal choreography by rarity, near-miss silhouette | ui/reveal.js | informational | unexpected | none | keep |
| New species card, journal stamp | fishevents.js, journal.js | informational | unexpected | none | keep |
| Colour variants, trophy sizes | fishroll.js, fishevents.js | informational | unexpected | none (luck) | the cheapest long tail; built |
| Journal page milestones 25/50/75/100% | journal.js `MILESTONE_REWARD` | gold and bait: controlling; a frame or title: informational | expected | completion | |
| Hearts (friendship) | friendship.js | informational at a heart (an unlock); controlling day to day | expected | engagement (the first talk of each day moves it) | never decays (good) |
| Gift reactions | friendship.js | informational | unexpected until learned | none | |
| Requests (3 a day): gold and XP | requests.js | controlling (gold); informational (they point at species you lack) | expected | completion | |
| Daily tasks (3 a day), chest, weekly chain | tasks.js | controlling | expected | completion | test with H2 |
| Login calendar (7 days) | streak.js | controlling | expected | engagement (claiming) | the calendar pauses on a missed day; test with H2 |
| Streak, shields, streak milestones | streak.js | controlling | expected | engagement | "absence is never punished": a break drops to the last milestone |
| Away letter (gold after 20 h away) | away.js | controlling | expected after the first | engagement (absence) | |
| Event track (30 tiers, free and subscriber lanes) | events.js | controlling | expected | engagement (catches in the window) | a battle-pass shape |
| Town fund levels (Renown tokens) | market.js | controlling | expected | completion (paying) | the gold sink with no end |
| Market ladder: boats, rods, rooms, tanks | market.js | informational when it opens a place or a verb; decoration otherwise | expected (priced and shown) | the player's choice | rank gates them, so gold is rarely the limit (models.md) |
| Hot spots, frenzies, the weekly rumour | fishroll.js, tasks.js | informational | unexpected | none | keep |
| Stuck nudge | goals.js, ui/islandlife.js | informational | unexpected | none | |

**What the labels add up to.** 11 of the 22 rows above are expected rewards paid for showing up or for
volume: XP, first-catch-of-the-day XP, rested XP, rank gold, the login calendar, the streak, the away letter,
tasks, request gold, the event track and the town fund. Those are the ones the meta-analysis warns about, and they are the ones a strip-test arm
(`?progression=off`, H0) and the daily arm (H2) can measure. The informational ones (the reveal, variants,
trophies, perks that change a verb, the reel's perfect catch, hot spots) are what diagnosis.md asked for.

## Rewards proposed by the earlier spec, labelled before any was built (kept for the record)

| Proposal | Label | Keep, change or drop |
|---|---|---|
| Player rank with a reward every level | controlling, expected, engagement-contingent | change: make each rank show something new (a place, a fish, a person) rather than gold |
| Skill tracks with perks that change how a verb feels | informational, expected | keep: it is competence feedback, and the verbs need depth (diagnosis.md) |
| Rarity reveal choreography | informational, unexpected | keep |
| Near-miss silhouette when a fish escapes | informational, unexpected | keep: it turns a miss into a want |
| Hidden bad-luck protection (pity) | invisible | keep if the Monte Carlo shows it shortens the worst droughts (models.md) |
| Hot spots and frenzies | informational, unexpected | keep |
| Trophy sizes | informational, unexpected, performance (luck) | keep: sizes already roll; cheapest long tail (multipliers.csv) |
| Colour variants | informational, unexpected | keep: fish art is procedural, so variants cost a palette |
| Daily tasks with a bonus chest | controlling, expected, completion | drop or make the tasks point at things the player hasn't found (then they are informational) |
| Login calendar and streak shields | controlling, expected, engagement | test only (H2); never the core |
| Rested XP | controlling, expected | drop if rank is dropped |
| Monthly content drops | informational, unexpected | keep: this is what a subscription is for |
