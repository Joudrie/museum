# Curation UI: the system (Chat 16)

**Read this before you add or change any menu.** Plan: `docs/UI-BRIEF.md`. Evidence: `docs/UI-AUDIT.md`, `docs/UI-FLOWS.md`. Live style guide: `ui.html` (open `/ui.html`).

## The three decisions (for the user to react to)
1. **Navigation:** a slim top status strip (tap = income), three labelled buttons on the left (**Journal**, **Build** = Toolkit, **Style** = Customize) and one **Menu** on the right. The Menu is a hub of big labelled tiles: Today, Your museum (income), Share and visit, Settings; it works on islands too, and a dot on Menu shows a waiting gift. The Journal opens on an **overview of collections as cards**, not a 17-tab grid. Every screen is reachable in 2 taps or fewer (`tests/ui-flows.cjs` guards it). Left-handed layout mirrors it.
2. **Palette and type:** keep the warm dark-brown and gold identity; unify it into tokens. **Pixelify Sans** (OFL, bundled) for all interface text and numbers, **Georgia** only for museum prose. Smallest text 13 px, tap targets 44 px.
3. **Frames and buttons:** one bevelled pixel button language (dark outline, light top edge, dark bottom edge, press = 2 px down) in four weights: primary (gold), secondary (brown), danger, quiet. One header with one close button. Sheets for lists and pickers, small cards for confirmations, full screen only for the viewer, journal and builder.

Everything below lives in tokens, so any of these can change cheaply.

## Files
| File | What |
|---|---|
| `src/ui/tokens.css` | colours, type scale, spacing, radius, hit size, motion; the Pixelify Sans font-face |
| `src/ui/ui.css` | the components (all classes start with `ui-`) |
| `src/ui/icons.js` | the pixel icon set: `uiIcon('gear')`, `uiIcon('gear', 's' or 'l')`, `uiIconNames()` |
| `src/ui/fonts/` | Pixelify Sans and its SIL OFL licence |
| `ui.html`, `src/ui/guide.js` | the live style guide: add a component here when you add it to `ui.css` |

## Tokens (use these, never raw colours)
- Surfaces: `--ui-bg`, `--ui-panel`, `--ui-panel-2`, `--ui-raised`, `--ui-shadow`; lines `--ui-line`, `--ui-line-soft`; fill `--ui-fill`.
- Ink: `--ui-ink`, `--ui-muted`, `--ui-on-gold`. Accents: `--ui-gold`, `--ui-gold-hi`, `--ui-gold-lo`, `--ui-good`, `--ui-danger`, `--ui-info`. Rarity: `--ui-r1` to `--ui-r4` (always with a label or pip).
- Type: `--ui-font`, `--ui-prose`; sizes `--fs-small` 13, `--fs-body` 15, `--fs-lead` 17, `--fs-title` 24, `--fs-num` 20. `html[data-text='large']` raises them all.
- Space: `--sp-1..6` (4 px grid). Shape: `--ui-r` 8, `--ui-r-sheet` 14. Hit: `--ui-hit` 44. Motion: `--ui-t` 160 ms, `--ui-ease` (both go to instant under reduced motion).

## Components
`ui-btn` (+ `--primary`, `--danger`, `--quiet`, `--wide`) · `ui-close` (the only close button) · `ui-head` + `ui-title` + `ui-sub` + `ui-label` · `ui-seg` (tabs and options) · `ui-chips` + `ui-chip` · `ui-card` (+ `--hot`) · `ui-row` (+ `ui-grow`) · `ui-list` · `ui-grid` · `ui-stats` + `ui-stat` · `ui-bar` (+ `--good`, `style="--v:60%"`) · `ui-badge` · `ui-dot` · `ui-toggle` · `ui-empty` · `ui-hint` · `ui-rarity` (`data-r="1..4"`) · `ui-prose` · `ui-ic` (icons).

```html
<div class="ui-head"><h2 class="ui-title">Staff board</h2><button class="ui-btn ui-close" aria-label="Close"></button></div>
<div class="ui-list">
  <div class="ui-row"><div class="ui-grow"><b>Tour guides</b><small>0 of 3 · +10% income each</small></div><button class="ui-btn ui-btn--primary">Hire 300</button></div>
</div>
```
Fill the close button with `uiIcon('close')`. Buttons say what they do, in sentence case: "Hang it", "Buy for 120 gold", "Brush", "Sail". Never "OK", "Submit", "Cancel" alone, and never ALL CAPS.

## Patterns
- **Weight:** a *sheet* (bottom, up to 85%, the world visible behind) for lists and pickers; a *card* (centred, small) for confirmations and rewards; *full screen* only for the painting viewer, the journal and the builder. Use the lightest that fits.
- **One at a time:** no modal on a modal. Opening a screen from another replaces it, with a clear back.
- **Close is predictable:** top-right, 44 px, the same icon. Sheets also close by tapping the dimmed world when nothing would be lost.
- **Money:** gold amounts show the coin icon and a number (1,234 → 1.2k → 1.2M → 1.2B). A price lives on the button ("Buy for 120 gold").
- **Locked:** say what unlocks it ("Unlocks at office level 2"), never just disable.
- **Empty:** say what to do next, with a button if there is one.
- **No testing language** in player text ("Free while testing" belongs under Settings → Testing only).
- **Rarity** is a pip plus a label, never colour alone.

## What exists beyond the components (the older menus, now on the system)
- **`src/ui/skin.css`** puts the older menus on the same look without rewriting them: one bevel button language (`.pixel-btn` is the gold primary; `.wide-btn`, `.decor-tabs button`, `.choices button`, `.build-row button` are secondary, `.on` = gold), one card border, Pixelify Sans for chrome and Georgia for museum prose, inputs and stars at 44 px. Prefer `ui-*` classes in new code; this file is for what was already built.
- **`src/ui/chrome.js`** upgrades every close / cancel button (any button with a `*-close` class or `aria-label` Close / Cancel and no words on it) to the standard `ui-close` with the pixel X, including menus built later. A button with words (e.g. "Leave it") is left alone.
- **`src/ui/hud.js` + `hud.css`**: the HUD and the Menu hub (see below). **`journalhome.js` + `journal.css`**: the Journal overview.
- **Toasts** go through `say(text, ms)` in `src/ui/toast.js` (the scenes' `toast()` already call it): one at a time, the same message twice in a row shows once, at most three wait, a toast is readable for at least 0.9 s before the next replaces it.
- **Groups:** Customize → This room uses collapsible `details.ui-group` sections (Floor, Walls, Carpet & plants, Light & sound, This room), each with a one-line summary of what is chosen; Theme stays on top. Open groups stay open while Customize is open.
- **Settings** are grouped (Sound, Look, Play, Friends & data, Testing) and use switches (`ui-toggle`).
- **Look settings** (`src/ui/prefs.js`): *Text size* (`html[data-text="large"]` raises every text token), *Reduce motion* (`html[data-motion="reduce"]` zeroes UI motion), *Left-handed layout* (`html[data-hand="left"]` mirrors the HUD and the Interact button).
- **Tips:** `hint(id, text, anchor)` from `src/ui/hint.js` shows a one-time bubble pointing at a button (remembered in `curation.hints`, only when the screen is calm, Settings → Play → Tips turns them off). Used for the Menu's daily gift and a goal ready in the Journal.
- **Reward cards:** the catch card and the celebration card share one look (`.catch-card`, `.celebrate-card` in `skin.css`). `celebrate(title, sub, icon)` in `src/ui.js` takes an icon name from `icons.js` and **queues**: moments that arrive together (a goal and the set it finishes) show one after another with a "n more" line, never over each other.
- **Title card, rotate and crash screens:** `#boot` in `index.html` draws before any script loads and goes when the first frame is drawn; "Turn your phone upright" is a turning phone in the UI font; the crash screen says your museum is safe, offers *Try again* first, and erasing the save takes two taps.
- **Staff board rows:** title and state on one line (a finished state such as Hired or Maxed is a badge, not a dead button), the text under it at full width, one full-width action button under that.
- **Primary and quiet buttons in dialogs:** the answer you're asked for is gold, "Not now" is the brown one; the one thing to do on a screen (daily Collect, Spin) is gold.
- **Closing a panel:** tap the dimmed world (Journal, Settings, Income, Office, Staff, Wall spot, Display, Build a room) or swipe the sheet down by its handle; both live in `chrome.js`. Left out on purpose: the confirm dialog (an explicit answer), Customize (you are looking at the room) and the studio (work in progress). A drag that starts inside a sheet never counts as a backdrop tap.
- **Numbers:** `shortNum()` in `src/ui/num.js` (whole with commas up to 999,999, then 1.2M, 1.2bn, 1.2T; "bn" because in this pixel font a B looks like an 8). The status strip uses it and wraps onto a second line rather than cutting a stat off; Collect all follows the strip's bottom edge.
- **Accessibility:** `tests/ui-layout.cjs` fails any visible control with no name for a screen reader (no text, `aria-label`, `title` or `<label>`); overlays are `role="dialog" aria-modal="true"`; toasts are a polite live region; *Escape* closes the panel on top (`chrome.js`).
- **Three fixes to the bundled Pixelify Sans:** the numeral 5 is redrawn with a flat top (the original reads as the letter S at small sizes: "3,500" looked like "3,S00"), its ligatures are removed (the original draws "fi" like an A, so "fish" read "Ash"), and the capital C has a wider opening (it read as an O: "Oatch"). Nothing else changed; the note is in `src/ui/fonts/PixelifySans-OFL.txt`. If you ever swap the font file, check both (`ui.html` shows a sample line).
- **Prices** never say "testing" in the UI: a free price reads "Free (500 gold)" or "Free for now (500 gold)".
- **Tests:** `tests/nav.cjs` has `openHub`, `jtab` and `openGroup`; `tests/ui-flows.cjs` holds tap budgets for the key journeys; `tests/ui-layout.cjs` guards layout; `tests/ui-shots.cjs` takes the screenshots.

## Voice
Warm, specific, short. Verbs on buttons. Say what will happen and what it costs. Errors say what to do next ("Couldn't load that picture. Tap to try again.").

## Adding a menu (checklist)
1. Build it from `ui-*` classes and tokens; no raw colours, no font sizes under `--fs-small`.
2. A `ui-head` with the standard close. Primary action at the bottom.
3. States: empty, locked, loading, error, full, max.
4. Works at 360x640, 390x844, 430x932, with the largest numbers, the longest names and large text. `node tests/ui-shots.cjs` shows it.
5. Add it to `ui.html` if it introduces a new component, and tick it on the board.
