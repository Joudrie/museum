# UI and flow brief (Chat 16: UI and menus)

The user's words: "all of our menus suck and look vibe coded", and "we need better user interface, flow etc."
So this is two jobs: **(A) how the game is structured and flows** (what lives where, how you get there, how many taps things take), and **(B) how every screen looks and feels**.
Do A before B. A pretty menu in the wrong place is still a bad menu.

Rules that never change: portrait only, phone only (iPhone Safari), press-and-drag movement (no tap-to-walk), no horizontal scrolling, the user's work and saves are never lost, behaviour and numbers of the game don't change, sprites are placeholder (UI must not depend on a specific sprite), no new runtime dependencies, don't ask the user questions (park them under "Needs Sean"), small PRs merged by you, `npm test` before every PR.

---

## 1. What "good" means here (principles)
1. **One thing per screen.** Each screen has one job and one obvious primary action. Everything else is quieter.
2. **The world is the main screen.** Menus are brief visits. Open fast, do the thing, close, back in the museum. Never trap the player.
3. **Contextual first.** The game already shows an Interact button that changes with what you stand near (Interact, Dig, Fish, Sail). Prefer "act where you are" to "go find it in a menu".
4. **Thumb zone.** Primary actions and navigation sit in the bottom third. Close is always in the same place.
5. **Progressive disclosure.** Show only what the player can use now. New systems appear (with a short, dismissible intro) when they unlock. Locked things show what unlocks them, not a dead button.
6. **Always say what happened.** Every action gets feedback within 100ms (sound, motion, number change). Rewards feel good; mistakes are forgiven (undo, confirm only for destructive things).
7. **Calm, not naggy.** Badges and prompts are rare, prioritised and never block. No guilt mechanics. No wall of toasts.
8. **Short, warm, specific text.** Verbs on buttons. No jargon. Numbers readable at a glance.
9. **Consistent.** Same component, same behaviour, everywhere. Learn it once.
10. **Cozy and a little extravagant.** Warm, tactile, pixel-world UI (Stardew, Pokémon, Animal Crossing). Not a web form.

"Vibe coded" tells to remove: default gradients and glows, emoji as icons, mixed radii and border weights, everything centred, equal-weight buttons, tiny grey text, random colours, long paragraphs inside cards, scrolling lists with no structure, modals on modals, inconsistent close buttons, labels like "OK" and "Submit".

---

## 2. Part A: structure and flow

### 2.1 Start by mapping what exists (do this first, write `docs/UI-FLOWS.md`)
Read the code and play every screen. Produce:
- **Entry-point map:** every way to reach every screen (HUD buttons: toolkit hammer, journal with its badge, daily gift, home / Customize, settings gear, "Collect all"; the Interact button; tapping things in the world; walking into doors, stairs, the boat; story modals; builder page ☰).
- **Screen inventory** (below, section 4) with owner file, size, how it opens and closes, what it pauses, what it saves.
- **Depth map:** how many taps from the world to each action. Find the deepest and slowest ones.
- **Duplicates and orphans:** things reachable in two inconsistent ways, features with no obvious entry, buttons that do nothing yet, settings buried under Testing.
- **Interruptions:** what happens if a panel is open when a visitor talks, a story beat fires, the app is backgrounded, a cutscene or boat trip starts, a reward arrives. Define one rule: a queue with priorities (see 2.6).

### 2.2 Navigation model (decide, document, then build)
Evaluate and choose. Default recommendation, change it only with a reason written in `docs/UI-FLOWS.md`:
- **World HUD stays minimal:** a slim top status strip (gold, gold per hour, visitors, rating) that opens the Income breakdown when tapped; a small number of corner buttons; the contextual Interact button bottom-right; the movement stick bottom-left.
- **Consolidate the left column.** Today there are many small icon buttons. Group by intent: **Build** (toolkit, Customize, Build a room, wall spots), **Collect** (journal, codex, shop), **Manage** (staff, office, income), **Daily** (gift, quests), **System** (settings). Consider a single expandable **menu hub** or a bottom bar of 4 to 5 big, well-labelled buttons. Prototype both on `ui.html`, test tap counts, pick one. Every destination reachable in 2 taps or fewer.
- **Screens come in three weights.** (1) *Sheet* (slides up from the bottom, covers up to 85%, the world stays visible behind): lists and pickers. (2) *Modal card* (centred, small): confirmations, rewards, short stories. (3) *Full screen*: the painting viewer, the journal, the builder canvas. Use the lightest weight that fits.
- **One at a time.** No modal on a modal. Opening a screen from another replaces it (with a clear back), never stacks more than one level.
- **Back and close are predictable:** close (top-right, same spot, 48px), swipe-down on sheets, hardware back where it exists, tap the dimmed world to dismiss when nothing would be lost. Unsaved changes: ask once.
- **Placement and edit modes** (toolkit, wall spots, display): a clear mode banner and a persistent Done button; the HUD tucks away so the player can see what they are placing.

### 2.3 Player journeys with tap budgets
Write each as steps in `docs/UI-FLOWS.md`, count taps now, set a target, and make a Playwright test (`tests/ui-flows.cjs`) that performs the journey and fails if it takes more taps than the budget. Start from the world screen.
| Journey | Target |
|---|---|
| Collect coins | 1 tap (walk onto the pad, Interact) |
| Collect all | 2 |
| Hang a painting on an empty wall spot | 3 (spot, painting, confirm) |
| Swap or remove a painting | 3 |
| Buy and place a decor item | 4 |
| Move or sell a placed item | 3 |
| Change a room's floor or wallpaper | 3 |
| Apply a theme to a room | 3 |
| Build a new room (shape, size, end piece, confirm) | 5 |
| Resize or rename a room | 4 |
| Hire a janitor or guide | 3 |
| Open the journal to a specific collection | 2 |
| Read a painting's story and rate it | 3 |
| Claim a goal or set reward | 2 |
| Open the Gallery Shop and buy | 4 |
| Daily gift: claim and spin | 3 |
| Talk to a visitor, ask about the painting, take the gift | 4 |
| Dig a spot (start to find) | 2 plus the brushing |
| Clean a find in the Restoration Studio and put it on display | 5 |
| Sail to an island and back | 4 |
| Change a setting (sound, text size, lighting) | 3 |
| Builder page: place a piece, turn it, undo | 4 |
| Builder page: new map, switch map, restore an earlier version | 4 |

### 2.4 Information architecture inside screens
- **Journal:** the first screen is *you*, not a list: progress rings per collection, "new" and "claim" highlights, the next goal. Collections as a grid of covers, each opening a browsable list or grid with sets, filters (owned / missing / rarity / era), search, sort. Entry detail is the viewer.
- **Toolkit:** categories as a horizontal chip row, large item cards (image, name, price, income per day, footprint), a locked state that says what unlocks it, a "recently used" row.
- **Customize:** split into *This room*, *Rooms*, *You*. Inside *This room*, group by what people actually do (Theme first, then Floor, Walls, Lighting and Music, Rugs and plants). Previews update the room live behind the sheet (the sheet stays low so the room is visible).
- **Staff, Office, Income:** each starts with the answer ("You earn 46 gold an hour"), then the levers (what you can buy), then the details. Costs, effects and "what you get" are always side by side.
- **Settings:** grouped (Sound, Look, Gameplay, Data), safe defaults, a plain explanation under each toggle, destructive actions (reset) at the bottom with a two-step confirm. Move Testing into a clearly separate, collapsed section.
- **Sail and leads:** a map-like list of islands with a state per island (home, unexplored, has a lead, finished), what it needs (a lead, a tool), and an unmistakable "Go".

### 2.5 Onboarding, hints, discovery
- Read `docs/FIRST_SESSION.md`. The first 5 minutes should teach by doing: walk, interact, clean, hang a painting, collect coins, open a room. Each teaching moment is a short bubble tied to a real object, shown once, never blocking, skippable, remembered.
- **Hint system:** a tiny reusable component ("?" pulse or a caretaker bubble), rate-limited, with a "don't show tips" setting.
- **What's new:** when a feature unlocks, one short card with a picture and a "show me" button that opens it.
- **Empty states** teach: "No fossils yet. Brush the dirt mounds on the islands." with a button that points toward them.
- **Locked states** motivate: what, why, how.

### 2.6 Feedback, notifications and interruptions
- **A single event queue** for toasts, reward cards, story prompts and celebrations, with priorities (system error > story beat > reward > toast), a maximum of one modal at a time, coalescing ("+3 gold, +1 painting"), and deferral while the player is placing or in a mini-flow.
- **Badges:** count on the journal (unclaimed), a dot on the daily gift, a dot on staff when you can afford something new. Badges clear when seen, never nag.
- **Reward moments** (new find, set complete, goal done): short, delightful, skippable, never repeated for the same thing; number count-up, a pixel burst, a sound, a haptic tick.
- **Errors in plain words** with a way out: "Couldn't load that picture. We'll try again. Tap to retry." Missing images show the placeholder colour and a small icon. Save failures say so once and offer to export.
- **Loading** is shown as progress ("Hanging the paintings...") with a pixel animation, never a blank screen.

### 2.7 Copy and numbers
- Write `docs/UI.md` → Voice: warm, specific, short; buttons are verbs ("Hang it", "Buy for 120 gold", "Brush", "Sail"); never "OK / Cancel / Submit / Error".
- One number format everywhere: 1,234 → 1.2k → 1.2M → 1.2B; gold shown with the coin icon; durations as "10 min" or "2 h"; plurals correct; no "undefined" or "NaN" ever (add a test that scans every screen's text).
- Every confirm says what will happen and what it costs; every destructive action says it can't be undone (or offers Undo).

### 2.8 Accessibility and comfort (also part of flow)
- Text size setting (normal / large) that every screen respects; contrast at least 4.5:1; rarity and status never rely on colour alone (add a shape, label or icon); reduced-motion setting honoured everywhere (it exists); haptics toggle; sound toggle; optional left-handed layout (mirror the corner buttons and the stick); aria labels and roles so a screen reader can open, read and close every menu; focus order sane for keyboard testing on desktop.

---

## 3. Part B: visual and interaction system
Build it in `src/ui/` and document it in `docs/UI.md`. Ship a live style guide page `ui.html` (like `tiles.html`) showing every component in every state, at three phone sizes.
- **Tokens:** a small palette from the warm colours already in the game (panel, panel-2, line, gold, ink, muted, danger, success, rarity 1 to 4), 4 type sizes plus a number style, a 4px spacing grid, one radius, one border + shadow treatment, one motion curve (120 to 180 ms).
- **Pixel frames:** crisp 9-slice (or CSS-drawn) panels and buttons at one pixel scale (pick 2x, keep it), with states normal / pressed / disabled / selected / focus.
- **Components:** sheet, modal card, full-screen shell, header with the standard close, tabs (no horizontal scroll: segmented or a clear overflow pattern), list row, card, chip, badge, buttons (primary / secondary / quiet / danger), toggle, slider, stepper, segmented control, colour swatch strip with "+" custom, progress bar and ring, stat row, empty state, hint, toast, confirm dialog, rarity frame, tab with a notification dot, skeleton / loading.
- **Icons:** one pixel icon set (extend `src/icons.js`) replacing every emoji and stray glyph. Same grid, same weight.
- **Sound and haptics:** one open / close / select / confirm / error sound each; light haptics where the platform allows; all behind the settings.
- **Motion:** sheets slide, cards pop, numbers count up; nothing bounces for its own sake; reduced motion turns it all to instant.
- **Density:** generous spacing, a clear hierarchy (title, key number or state, primary action, details), at most 3 text levels per screen.

---

## 4. The screens (every one must be audited, specified and migrated)
For each, write in `docs/UI-FLOWS.md`: purpose, entry points, exit, weight (sheet / modal / full), primary action, states (empty, locked, loading, error, full, max), what it pauses, what it saves, and the edge cases listed. Then migrate it.

**HUD and world**
1. Top status strip: gold, gold per hour, visitors a month, museum rating (stars). Edge: huge numbers (billions), rating changes animate. Tap opens Income.
2. HUD buttons (hammer, journal + badge, daily gift + dot, home / Customize, settings, Collect all): consolidate per 2.2; hidden while placing; never overlap the stick or the Interact button; safe areas.
3. Interact button: icon + verb that changes (Interact, Dig, Fish, Sail, Talk); big, bottom-right, thumb-reachable, never covered; shows a tiny preview of what it will do where useful.
4. Movement stick: appears where the thumb lands, subtle, never in the way.
5. Toasts, celebration card, "turn your phone upright" screen, title and loading screen, the first "Congrats on your new museum!" moment.
6. The tutorial bubbles and the caretaker's tips.

**Museum management**
7. Toolkit and the placement bar (categories, item cards, price, income, footprint, place / move / rotate / sell with a half-price note, locked items).
8. Customize: This room (themes, floor, wallpaper, wainscot, carpet, lighting, music, plants), Rooms (rename, resize, door or archway, reorder, jump to), You (hair, skin, outfit, hat, glasses, accessories) with the swipeable colour strips.
9. Build a room: orientation, size, capacity, the dotted-line preview with the vertical end-piece carousel (swipe up and down only, never sideways), price, confirm.
10. Wall spot menu (place painting / plain wall / door) and the painting picker.
11. Display menu (cases, plinths, shelves, tanks) and the placement of entries in rooms.
12. Curator's Office (levels, costs, what each unlocks) and the Staff board (janitors, tour guides, carpenter, break-room upgrades, the services: coffee, gift shop, food court, discovery table, lecture stage).
13. Income / "Your museum" breakdown (per room, per item, services, offline cap message).
14. Security: the guard's camera offer, the robbery notice.

**Collections and story**
15. Journal: Goals, Paintings, Visitors, Fish (+ bobbers), Minerals, Fossils and every other collection tab, the Codex and milestones, sets and rewards, the Gallery Shop (buy, sell, buy-back), search, filters, NEW marks.
16. Painting and specimen viewer (HD wall view, swipe along the wall, info, your rating and note, the plaque with provenance, case view for other collections).
17. Catch card, find card, reward cards, set and milestone celebrations.
18. Conversation box (`src/dialogue.js`) and the speech bubble for staff and famous visitors; story chapter modals and lead letters.
19. Daily gift (welcome gift, wheel, Painting of the Day), quests and goals, events.

**Discovery**
20. Dig overlay, dig tools, metal detector, map fragments, daily dig goal.
21. Restoration Studio (cleaning, reassembly, the dirty bag), storage and the "dirty" states.
22. Puzzle prompts and riddles, expedition leads, the boat and sail menu (islands, leads, states), the boat scene.
23. Share and visit (export a museum, visit a friend, friends' islands).

**System**
24. Settings (Sound, Look, Gameplay, Data, Testing), save export and reset with the two-step confirm, the in-game credits screen.
25. Ask / confirm dialog (used all over: purchases, story, cameras): make it the one confirm component.

**Builder page** (`builder.html`, `src/builder/`) is a separate screen set; do it last, with extra care (never lose work, never scroll sideways):
26. Top bar and the map menu (☰: name, New map, My maps, Earlier versions, Options, Art credits), the "Continue where you left off" card.
27. Tool row (Paint, Erase, Fill, Move, Pick, Pan), selection bar (Turn, Flip, Copy, Delete), chosen-piece preview with its turn button, brush size, snap, undo / redo, the autosave chip.
28. The bottom sheet of dropdown piece lists (thumbnails, names, search, recently used, favourites, what's new, turn badges) with snap points (peek, half, full).

---

## 5. Process and deliverables (in order, one PR each unless noted)
1. **Claim** Chat 16 on `docs/TODO.md`; add a line under Cross-chat requests: "UI overhaul in progress: new menus must use the ui-* components in docs/UI.md; don't restyle menus yourself."
2. **Audit** (docs only): screenshots of every screen at 390x844 into `docs/ui/before/`; `docs/UI-AUDIT.md` with 3 to 5 concrete problems per screen and the shared patterns behind them; `docs/UI-FLOWS.md` with the maps and journeys (2.1 and 2.3).
3. **Navigation and flow decisions** written up with reasons (2.2), including a quick prototype of the chosen HUD / menu hub on `ui.html`. Stop here and write three lines at the top of `docs/UI.md` for the user to react to (navigation, palette and type, frame style), then continue.
4. **Design system** and `ui.html` (Part B).
5. **Automated checks** (add before migrating, so every later PR is guarded): `tests/ui-flows.cjs` (journey tap budgets), `tests/ui-layout.cjs` (opens every screen at 360x640, 390x844 and 430x932; fails on horizontal overflow, clipped text, targets under 44px, text under 12px, overlap with HUD or safe areas, `undefined` / `NaN` text, missing aria labels).
6. **Migrate in this order** (most used first): HUD and Interact, Journal (the reference screen; make it great), Toolkit and placement bar, Customize, dialogs and cards, viewer, Settings and Income, Build a room, wall spot and Display, Office and Staff, daily / share / sail / leads, discovery overlays, conversation and tutorial, title screen, then the Builder page. One screen or tight group per PR, with before / after screenshots at the three sizes.
7. **Polish pass:** sounds, haptics, motion, empty and error states, copy sweep, text-size and left-handed modes, accessibility labels.
8. **Handoff:** `docs/UI.md` (tokens, components, patterns, voice, how to add a menu), 2 to 4 lines in `docs/HANDOFF.md`, tick items on the board.

## 6. Quality gates (every PR)
- `npm test` passes (smoke, saves, collections, builder, perf, bundle, the new UI tests). A known-flaky test: re-run before blaming your change.
- Before / after screenshots at 390x844, 360x640 and 430x932. No overflow, no clipping, targets 44px or more, readable contrast, works with the largest numbers and the longest names, works in large-text mode.
- Played for real on the phone-sized browser: open from the game, use it, close it, confirm the game pauses and resumes correctly, saves still load, nothing lost.
- No change to game behaviour or numbers. Keep ids and classes tests use (or update the tests and say so).
- Bundle and performance budgets hold.
- Pull main right before every push; other chats are editing the contents of these menus at the same time. Restyle through the shared components; don't rewrite their logic.

## 7. The user is the judge of the look
After the HUD and the Journal ship, summarise what you chose in three lines so the user can react from a phone. Be ready to change palette, type and frame style cheaply: they should all live in tokens.

Don't mention Wakefield and don't touch it. End every PR with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
