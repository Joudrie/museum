# UI flows (Chat 16, phase 0)

Facts about how the game's screens are reached today, and the journeys with their current and target tap counts.
Taps marked ~ are estimated from the code; `tests/ui-flows.cjs` (to come) will measure and guard the targets.

## 1. Entry-point map (what opens what)
**HUD (fixed buttons, museum scene).** Stats pill → Income. Book → Journal (badge = unclaimed). Gift → Daily (Today). House → Customize. Hammer → Toolkit. Gear → Settings. "Collect all" → collects every room (Chat 12 removed the ad; it keeps a 15% fee). Interact button (bottom-right) → whatever you stand near.
**HUD (island scene).** Book and gift only. Settings, Customize and Toolkit are not reachable on islands. A "Detector" button appears with a metal detector.
**Through the Interact button / world:** wall spot → Wall spot menu (or the painting viewer if a painting hangs there); case / plinth / shelf / tank → Display; Curator's desk or door → Office; staff board → Staff board; build spot / exit door → Build a room; double doors → Ask (unlock main hall); a visitor → Conversation (staff and famous visitors → bubble / story modal); the guard → Ask (cameras); a dirt mound → Dig; the boat or rowboat → Sail menu; the water → fishing, then the Catch card; a painting on display → Viewer.
**Inside Settings:** Share & visit, Testing (gold, collect everything), reset.
**Inside Journal:** 17 tabs; Shop and Storage are tabs; Storage opens the Restoration Studio; Codex has milestones.
**Builder page (`builder.html`):** ☰ menu (Map, New map, My maps, Earlier versions, Options, Art credits), Resume card, tool row, selection bar, bottom sheet of lists.

## 2. Screen inventory
| Screen | Weight today | Opens from | Pauses the world | Saves |
|---|---|---|---|---|
| Income | sheet | HUD pill | yes | nothing |
| Journal | sheet | HUD book | yes | notes, ratings, claims |
| Toolkit | sheet + placement bar | HUD hammer | yes (placing mode) | decor, gold |
| Customize (3 tabs) | sheet | HUD house | yes | room decor, character |
| Build a room | sheet | exit door | yes | rooms, gold |
| Wall spot | sheet | spot | yes | hung paintings |
| Display | sheet | fixture | yes | what is shown |
| Office, Staff | sheet | desk, board | yes | levels, hires |
| Settings | sheet | HUD gear | yes | settings |
| Daily, Share | sheet | HUD gift, Settings | yes | daily state |
| Sail, Leads | sheet | boat | yes | leads |
| Ask | sheet (small) | many | yes | depends |
| Viewer | full screen | painting | yes | rating, note |
| Dig, Studio | centred card / full | mound, Storage | yes | finds |
| Catch, Celebrate | centred card | fishing, goals | yes | log |
| Conversation | bottom box | visitor | yes | gifts |
| Talk bubble | bubble | staff, famous | no | nothing |
| Toast | top pill | anywhere | no | nothing |

## 3. Depth map (taps from the world to the action)
Deepest and slowest today: **Journal → a specific collection (2 taps but a 17-tab grid to read first)**, **Buy and place decor (5+)**, **Clean a find and display it (6+)**, **Change a room's theme (4: house, scroll, Customize list, theme)**, **Collect all (1 tap)**.

## 4. Duplicates, orphans, oddities
- Two buttons for "change my museum" (hammer = items, house = look) that look like unrelated icons.
- Settings, Customize and Toolkit are unreachable on islands.
- "Free while testing" costs appear in player-facing buttons.
- Three reward cards (Catch, Celebrate, claim buttons) and no shared reward moment.
- Share & visit lives inside Settings; Daily has its own HUD button; Storage and Shop are Journal tabs.
- Confirmations all use one Ask dialog, but their titles and button labels vary.

## 5. Interruptions (rule to build)
Today panels call `pause(true)`, which also closes a conversation. A story prompt, a reward and a toast can overlap. **Rule to build:** one event queue with priorities (error > story beat > reward > toast), one modal at a time, coalescing (+3 gold, +1 painting), deferral while placing or digging.

## 6. Journeys: current vs target taps (start from the world screen)
| Journey | Now | Target |
|---|---|---|
| Collect coins from a pad | 1 (+ walk) | 1 |
| Collect all | 1 | 1 |
| Hang a painting on an empty wall spot | ~3 | 3 |
| Swap or remove a painting | ~3 | 3 |
| Buy and place a decor item | ~5 | 4 |
| Move or sell a placed item | ~3 | 3 |
| Change a room's floor or wallpaper | ~4 | 3 |
| Apply a theme to a room | ~4 | 3 |
| Build a new room | ~5 | 5 |
| Resize or rename a room | ~4 | 4 |
| Hire a janitor or guide | ~3 | 3 |
| Open the journal to a specific collection | 2 | 2 (from a short list, not 17 tabs) |
| Read a painting's story and rate it | ~3 | 3 |
| Claim a goal or set reward | ~2 | 2 |
| Gallery Shop: buy | ~4 | 4 |
| Daily gift: claim and spin | 3 | 3 |
| Talk to a visitor, ask about the painting, take the gift | ~4 | 4 |
| Dig a spot, start to find | 2 + brushing | 2 + brushing |
| Clean a find and put it on display | ~6 | 5 |
| Sail to an island and back | ~4 | 4 |
| Change a setting | 2 to 3 | 3 |
| Builder: place a piece, turn it, undo | ~4 | 4 |
| Builder: new map, switch, restore an earlier version | ~4 | 4 |

## 7. Decisions, and where they ended up
**Navigation.** A labelled left column (Journal, Build, Style) for the three things people open all the time, one **Menu** on the right for the rest (Today, Your museum, Share & visit, Settings), the status strip in the middle (tap: income), the pill for the goal under it. *Why not a bottom bar:* the bottom corners belong to the stick and the Interact button, and a thumb that is walking must never hit a menu. *Why not everything in one hub:* Journal and Build are 1 tap now and are used far more than Settings. Labels sit under the icons because nobody could say what the hammer, the house and the gear did. On islands the museum-only buttons are put away; Journal and Menu stay.

**Three weights, one at a time.** Sheets (lists, pickers, settings) slide from the bottom with the world dimmed behind; cards (rewards, confirms) are centred and short; the viewer is full screen. Opening a panel from a panel replaces it with a back button, never stacks. Closing is the same everywhere: the X in the same corner, **tap the dimmed world, swipe the sheet down by its handle, Esc**. The exceptions are on purpose: a confirm (an explicit answer), Customize (you are looking at the room), the Restoration Studio (work in progress), anything with half-typed text.

**Journal.** The first screen is you: three numbers, the next goals (with the claim button), then one card per collection (cover or silhouette, progress bar, "n new") instead of 17 tabs; each collection opens as a page with a back button; Codex, Storage and Gallery Shop sit below. The Field Journal (progression) uses a 4 × 3 grid of 44 px page tabs; it is a candidate to become one more card in the overview (see Needs Sean in `docs/TODO.md`).

**Interruptions and queues.** Toasts queue (`say()`, one at a time, the same line twice shows once); celebrations queue (`celebrate()`, one after another with "n more"); the progression layer has its own reward queue that waits while a menu, a conversation or a minigame owns the screen. A conversation or a panel hides the goal pill. *Still two queues:* routing `celebrate()` through the progression queue would give one priority order; it changes when goal and set cards appear (after the Journal closes instead of while it is open), so it is a decision for Sean, not a quiet refactor.

**Feedback and numbers.** Gold, income and visitors in the strip use `shortNum()` (999,999, then 1.2M, 1.2bn, 1.2T) and the strip wraps rather than cutting a stat off. Prices say "Free (500 gold)" or "Free for now"; testing words live only under Settings → Testing. Large text, reduced motion and left-handed layout are Settings → Look and Play.

**Where the tap budgets stand** (`tests/ui-flows.cjs`, real taps from the world): see income 1 (budget 1), journal to the fish 2 (2), Gallery Shop 2 (2), daily gift 3 (3), change a setting 3 (3), apply a theme 2 (3), change a floor 3 (3), pick a decor item to place 2 (2), Share & visit 2 (3), tap out of the Journal 2 (2), swipe Settings closed 3 (3), a short pull springs back 3 (3), Menu open and close 2 (2). The longer journeys in the table above (hang a painting, build a room, clean a find) are guarded by the feature tests rather than a tap count.
