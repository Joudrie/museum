# UI audit (Chat 16, phase 0)

Every screen was opened at **390x844** on a rich save (4,300 gold, one of everything, office level 5) by `node tests/ui-shots.cjs docs/ui/before`.
Screenshots: `docs/ui/before/*.png`. Numbers: `docs/ui/before/metrics.json` (taps under 44 px, smallest text, overflow, "undefined / NaN" text).
Re-run after any change with `node tests/ui-shots.cjs docs/ui/after` to compare.

## What already works (keep)
- A coherent **warm pixel look** exists: dark brown panels, gold outlines, serif headings, gold primary buttons, stat tiles. The bones are good.
- Bottom **sheets** that leave the world visible behind them (Toolkit, Customize, Journal) are the right weight.
- The world is the main screen; the contextual **Interact** button (Interact / Dig / Fish / Sail) is a strong idea.
- Journal rows, rarity filters, NEW marks, set progress bars, and the new conversation box are decent building blocks.

## The big problems (they cut across screens)
1. **No navigation model.** Five unlabeled icon buttons (hammer, book, gift, house, gear) are split between the left and right edges, plus a stats pill and a separate "Collect all" button. The hammer (Toolkit) and the house (Customize) are both "change my museum" but look unrelated. Nothing says what each does until you tap it. On islands the HUD silently loses buttons (settings, customize, toolkit are gone), so the HUD changes shape between scenes.
2. **The Journal is a 17-tab wall.** Goals, Codex, Paintings, Visitors, Fish, Minerals, Fossils, Pottery, Coins, Stone tools, Shells, Meteorites, Treasures, Makers, Insects, Storage (25), Shop: all shown as a 4x5 button grid that takes about 30% of the sheet on *every* tab and never scrolls away. There is no overview screen, no grouping, and each new collection adds another tab. This is the worst flow problem in the game.
3. **Three or four different button languages.** Solid gold buttons (CTA, Hire, Claim), dashed outline buttons (Daily, Share, Settings), plain dark segmented buttons (tabs, chips), and an **unstyled browser-default white button** ("Leave it" on the dig overlay). The Sail menu uses full-width gold slabs for list items. The builder page uses a different dark grey and green language entirely.
4. **Inconsistent chrome.** Close is a gold square X on most sheets, a smaller one on Daily and Share, "Done" on Toolkit, and nothing on Ask. Headers differ in size (Daily "Today" is smaller). Some screens are bottom sheets, some are centred cards (Dig, Catch, Celebrate), with no rule for which.
5. **Testing language leaks into player UI.** "Free while testing (500 gold)", "Free · (300 gold)", "BUILD ROOM · FREE WHILE TESTING (24,790 GOLD)" appear on Office, Staff, Build, Ask and wrap onto 3 shouting lines. A player sees dev language everywhere.
6. **Text is small and dense.** The smallest text on every screen is 11 px (and 11.7 px on the builder page); body text in list rows is often 11 to 12 px. Rows are crammed (Staff board, Wall spot, Daily). Hierarchy is weak: titles, numbers and descriptions are close in size and weight.
7. **Tap targets.** Many controls are under 44 px (see the table). The Toolkit's 12 category chips alone are 12 small targets. Stars, arrows, chips and the filter rows are the usual culprits.
8. **Long scrolling screens with no structure.** Customize "This room" stacks about 9 sections (rating, janitor, name, saved layouts, theme, floor, walls, ...), starting with rating and a janitor offer rather than what people came to change. Settings buries "Share & visit" and "Testing".
9. **Feedback is inconsistent.** Toasts sit under the HUD and cover the Collect all button; rewards use three different cards (catch, celebrate, claim buttons); there is no queue, so a toast, a story prompt and a reward can overlap.
10. **No empty or locked guidance in places.** Locked rooms are greyed text; locked items often just disable.

## Per screen (3 to 5 concrete problems each)
Metric key: S = interactive elements under 44 px on screen, F = smallest font.

| # | Screen | Problems | S | F |
|---|---|---|---|---|
| 01 | World + HUD | Icon-only buttons with no labels, split left/right; "Collect all" tiny; stats pill is also a button but looks like a label; badges are small red dots with no meaning; HUD differs between museum and island scenes | 1 | 11 |
| 02 | Income | Good tiles at the top, but the room list is long and undifferentiated; "Boosts" header 11 px; tapping a room silently travels (no affordance) | 2 | 11 |
| 03 | Journal (all) | 17-tab grid on every tab; no overview; Shop and Storage are tabs; chips and search on each tab add another 2 rows before content; text 11 px; Codex milestones push content below the fold | 2 to 4 | 11 |
| 04 | Toolkit | 12 category chips (many small); long instruction paragraph; "Done" instead of the standard close; item cards cut by the sheet edge; income and price in tiny text | 12 | 11 |
| 05 | Customize: This room | About nine stacked sections; rating and janitor first; dashed pseudo-buttons; small caps headings; no live preview kept visible | 4 | 11 |
| 06 | Customize: Rooms | Up/down arrows are small and disabled-looking; "Go" buttons good; "Fixed" labels explained only in text | 2 | 11 |
| 07 | Customize: Character | Swipeable colour strip (650 px in 352 px) is fine by design but its edge gives no hint it scrolls; 14 hairstyles as a text grid with no pictures; option labels only | 2 | 11 |
| 08 | Settings | "Share & visit" and "Testing" buried at the bottom; On/Off segmented rows repeat the label twice; no text-size or reduced-motion setting exposed; reset is far below | 4 | 11 |
| 09 | Build a room | Good preview; CTA wraps onto 3 lines with testing text; hint text tiny; dot indicator for the carousel is tiny | 1 | 11 |
| 10 | Wall spot | Two chip rows plus search before any painting; 10 small targets; card captions 11 px; "move here" text link inside cards is tiny | 10 | 11 |
| 11 | Painting viewer | Strong. Rating stars and the change button are small; blurb and note scroll below the picture with no cue; close X is a floating grey circle unlike other screens | 7 | 11 |
| 12 | Staff board | Dense rows; button labels vary ("Hire · Free (300 gold)", "Build a coffee counter", "Hire a guide") and disabled buttons look like errors; descriptions 11 px | 7 | 11 |
| 13 | Curator's Office | Nice two-column Now / Next idea; CTA text is testing language; level number is a small paragraph | 2 | 11 |
| 14 | Ask / confirm | Clean, but used for everything (purchases, story, cameras); titles and buttons vary; "free while testing" inline | 1 | 11 |
| 15 | Daily | Header and close smaller than other sheets; dashed buttons; the wheel is great but pushes Painting of the Day off screen | 2 | 11 |
| 16 | Share and visit | A long column of dashed buttons; inputs unlabeled; four actions with equal weight | 3 | 11 |
| 17 | Conversation | Good box; label text small; not yet in a shared component | 1 | 11 |
| 18 | Staff and famous bubble | Separate old speech bubble style vs the new conversation box | 1 | 11 |
| 19 | Toast | Overlaps "Collect all"; small; no queue | 1 | 11 |
| 20 | Island world | HUD loses buttons; Interact fine | 0 | 11 |
| 21 | Sail menu | Full-width gold slabs as list items (a different button language); no state per island beyond a subtitle; "Stay here" looks the same as a destination | 5 | 11 |
| 22, 23 | Dig overlay | Browser-default white "Leave it" button; tool buttons small; instructions tiny; the centred card style differs from sheets | 4 | 11 |
| 30 | Builder page | Different dark grey and green language; 16 small targets; 11.7 px text; tool row and palette are cramped; one element overflows (251 > 156) | 16 | 11.7 |

No screen showed "undefined" or "NaN" text, and none overflowed the page horizontally. (Inner scrolling strips are by design.)

## What this means for the plan
- **Flow first:** a real navigation model (labeled bottom bar or hub), a Journal with an overview and a collection picker instead of 17 tabs, one rule for sheet vs card, one event queue.
- **Then one system:** a single button family, header and close, list row, chip, card, stat tile, toggle, with a 44 px minimum and a 13 px minimum body size.
- **Remove testing language** from player text (move to Settings → Testing).
