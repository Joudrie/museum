# Steps 14 and 15: the spine and the telemetry schema

## What was built (and nothing else)

| Piece | File | What it does |
|---|---|---|
| Save listener | `src/storage.js` (`onSave`) | Tells listeners about every save and the value it replaced. A listener runs after the write and can never break it. |
| The measurement log | `src/measure/events.js` | `emit(type, data)`, `on(type, fn)`, the list of types (`TYPES`, each with a kind: novelty, progress, meter, payout, system) and the log on the phone (`curation.evlog`, last 4,000 events, written in batches every 15 s and when the app is hidden). It is a log, not a gameplay bus: the game's bus is the progression layer's (`src/progression/bus.js`). |
| Saves into events | `src/measure/derive.js` | Compares each save of a watched key with what it replaced and emits what changed (digs, the codex, rooms, coins, leads…, and the layer's new unlocks). No other system had to change to be measured. |
| The layer's bus into the log | `src/measure/layer.js` | Copies the progression layer's bus events (catches, escapes, talks, places, secrets, ranks, skills, hearts, tasks, requests, purchases) into the same log, kept small. |
| Sessions | `src/measure/index.js` | `session_start` (source, hours since last play, count, build), `session_end` (length, active time, reason, last thing done), `session_resume` (back within 30 minutes). |
| Feature flags | `src/measure/flags.js` | `?progression=off`, `?flags=-goals,…`; saved per phone; `buildLabel()` names the build in every log; the layer's reward queue, grants, rods, regions and perks read them (diagnosis.md, 5). |
| Telemetry adapter | `src/measure/telemetry.js` | Forwards events to PostHog only if a project key is set **and** the player said yes on a beta link. Off for everyone today. |
| Log export | `?evlog` | A small panel: copy the log, share it as a file, or clear it. How a phone-only player sends a log. |

**Save fields added:** `curation.evlog` (the log), `curation.buildflags` (the build flags),
`curation.betaConsent` (consent and a random id). Nothing else in any save changed. (The layer keeps
its own last 300 telemetry rows in `curation.telemetry`, on the phone only; its sink is one function in
`src/progression/index.js`. This adapter is the one path that can leave the phone.)

**The reward queue is the layer's** (`src/progression/rewardqueue.js`); the build flags filter what it
shows (`queueShows`), nothing else.

## Why PostHog

- **No secret on a static site.** PostHog's capture endpoint takes a write-only project token,
  the same one its browser library uses, so a GitHub Pages game can send events directly.
  GameAnalytics' collection API signs every request with an HMAC of the body made with the game's
  secret key, which a static page cannot keep secret.
- **The analyses are built in.** Retention, funnels, lifecycle and paths are standard PostHog
  insights; the raw events also export as CSV for `analysis/analyze.py beta`.
- **Batching.** The adapter posts to `/batch/` once a minute and when the app is hidden, with
  `keepalive`, so a phone that is locked mid-session still sends.

## Privacy

Off unless a key is set **and** the player taps yes on the consent card, which only appears on
a beta link (`?beta=1`). What is sent: the event type, its time, game content ids and numbers
(rarity, gold, counts), a random player id, the session id and the build label. No names, no
typed text, no location, no device fingerprint. Beta testers are adults (see the protocol).

## The schema

Every event: `t` (ms), `type`, `s` (session id). In PostHog: `distinct_id` (random), `session`,
`build`, plus the fields below.

| Event | Fields | From | Serves |
|---|---|---|---|
| `session_start` | `source` (direct, beta-link, friend-museum-link, friend-island-link, builder-playtest, resume), `gapH`, `n`, `build` | boot, return after 30 min | retention, unprompted return (H2), gaps between sessions |
| `session_end` | `ms`, `activeMs`, `reason` (hidden, pagehide), `last` | app hidden or closed | session length, last action before quitting |
| `session_resume` | — | back within 30 min | merging interrupted sessions |
| `collect` | `id`, `collection`, `rarity`, `fresh`, `n` | codex | new things per session (H3), time to first rare and legendary, page completion |
| `coins` | `delta`, `balance` | wallet | gold sources and sinks (H1) |
| `catch` | `sp`, `r` (rarity), `cls` (size class), `v` (variant), `reg`, `w` (water), `perfect`, `via`, `bait`, `hot` | the layer's FISH_CAUGHT | catches; a species' first variant and first trophy (novelty, worked out in the analysis) |
| `escape` | `sp`, `r`, `cls` | FISH_ESCAPED | the reel's difficulty in play |
| `junk` | — | JUNK_CAUGHT | |
| `npc_talk` | `npc`, `kind` | NPC_TALKED | the first talk with each named islander (novelty) |
| `gift_given` | `npc`, `item` | GIFT_GIVEN | |
| `chunks` | `reg`, `n` | TILE_REVEALED | exploring |
| `place_found` | `reg`, `place` | LOCATION_DISCOVERED | novelty |
| `secret_found` | `reg`, `secret` | SECRET_FOUND | novelty |
| `viewpoint` | `reg`, `id` | VIEWPOINT | novelty (nothing emits it today: the world reports viewpoints as LOCATION_DISCOVERED) |
| `forage` | `item`, `reg` | ITEM_FORAGED | |
| `sail` | `kind`, `reg` | TRAVERSAL_USED | |
| `purchase` | `item`, `price`, `kind` | PURCHASE | the market (H1) |
| `rank_up` | `rank` | RANK_UP | meter: rank pacing against the layer's targets (H14) |
| `skill_up` | `skill`, `level` | SKILL_UP | meter |
| `heart_up` | `npc`, `hearts` | HEART_UP | meter |
| `task_done` | `id` | TASK_DONE | payout: the daily layer (H2) |
| `request_done` | `npc` | REQUEST_DONE | payout |
| `dig` | `spot` | dig rest timers | digs per session |
| `restored` | `id` | codex | restoration use |
| `sold` | `id` | codex | selling (H1) |
| `talk` | `kind`, `talks` | regulars | conversations |
| `guest_gift` | `by` (visitor kind) | chatter | gifts |
| `room_built` | `rooms` | room list | the tycoon spine (H1) |
| `item_placed` | `room`, `n` | items | decorating |
| `displayed` | `fixture`, `n` | display | putting finds on show |
| `office_up` | `level` | office | |
| `upgrade` | `id`, `level` | staff | |
| `famous_met` | `id` | famous | |
| `story_beat` | `id` | story | |
| `lead_found` | `id` | leads | traversal unlocks |
| `expedition_done` | `id`, `n` | expeditions | |
| `unlock` | `what` (tool:trowel, tool:pick, metal-detector, and the layer's: boat:rowboat, rod:cork, gear:lantern…) | codex counts; the layer's save | unlock pacing (H5) |
| `fog_cleared` | `n` | puzzles | |
| `goal_claimed` | `id` | quests | goals (H4) |
| `set_claimed` | `id` | codex | payouts (H6) |
| `milestone_claimed` | `pct` | codex | payouts (H6) |
| `daily_gift` | `streak` | daily | daily layer (H2) |
| `wheel_spin` | `gold` | daily | daily layer (H2) |
| `daily_dig_goal` | — | dig | |

**Session start source.** The game has no notifications, so every start that isn't from a link
is unprompted (`direct`). If notifications are ever added, they must add a `notification` source.

**Intended vs actual session end.** Actual: `session_end` and its `last`. Intended: only the
player knows, so the diary study asks it every day ("How long did you mean to play? How long did
you play?"). A one-tap in-game question was considered and left out: it would interrupt the
very moment being measured.

**Known gaps.** Looking at a painting changes no save and emits nothing. A cast that never bites
(reeled in early) emits nothing. Any of these can call `emit()` directly if they matter later.
