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

## 7. Decisions (made in phase 1; see `docs/UI.md` once it lands)
Written after the audit above: navigation model, the Journal's overview and collection picker, the sheet / card / full-screen rule, and the event queue.
