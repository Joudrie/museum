# UI: new and changed screens (second pass, main 38cb3e3)

> Part of the aesthetics audit (29 Oct 2026, second pass, main 38cb3e3). Overview: [../AESTHETICS-AUDIT.md](../AESTHETICS-AUDIT.md). Visual version with every screenshot: https://claude.ai/artifact/5TdJk17Mx4g36tciuXPfvW (private to the owner).


Auditor: ui2. Scope: the progression layer from #195 (rank pill, XP pops, skill bar, reward queue cards, rank ceremony,
catch reveal, reel, Field journal and all its tabs, market, lodge, friendship talk, cosmetics on the player, sail locks,
Take a break), plus #189 / #193 / #187 (title card, crash, rotate, celebrate queue, staff rows, conversation box, Today
painting viewer, wheel confetti, Settings testing group, builder 44px, the font fixes) and #191's column picker.
Judged at 390x844 on deviceScaleFactor 3 (one 360x640 and one large-text pass) on the rich save, with a rich
progression state injected (`ui2/rich.js`) so the pages have content.
All shots are in `docs/aesthetics/shots/ui2/`; `m-*.png` are montages of four phone screens at half size.

## Rank pill, XP pops, skill bar (the HUD additions)

- **[U-94] The rank pill sits on top of every sheet in the museum** (High). `src/progression/ui/progression.css` `#prog-layer` has `z-index: 28`, and in rooms `#prog-pill` sits at `--hud-top + 112px` (y 122-177). Every overlay sheet tops out at about y 200 and has a lower z-index. So the pill stays bright and undimmed over the sheet's top edge. It covers the "16 new" badge and the top of the Treasures card in the Journal, the Columns header in Customize, and the top border of the Staff board and Settings. When the sheet scrolls, its content slides underneath the pill. → The pill belongs to the HUD layer: hide it (or put it under the dim) whenever an overlay is open, and give the whole UI one z-index scale (world HUD < toasts < sheets < reward cards < ceremony). Shots: [m-m.png](shots/ui2/m-m.png) (left), [m-l.png](shots/ui2/m-l.png) (panel 1), [m-j2.png](shots/ui2/m-j2.png) (panels 3-4)
- **[U-95] In rooms, every toast lands behind the rank pill** (High). `#toast` is at y 112-170 with `z-index: 12` (style.css ~l.1060). The pill is at y 122-177 inside the z 28 layer. "Saved your note. +40 gold" shows only as a ghost through the pill's 88% opaque background ("aved your note. +40" above "Say hello to someo…"). → Move toasts to the bottom above Interact (as U-29 already asks), or move them below the pill, and reserve a fixed slot for each. Shot: [m-celebrate-toast.png](shots/ui2/m-celebrate-toast.png) (bottom half)
- **[U-96] The skill bar slides over the pill, the toast and the detector badge** (High). `#prog-skill` uses `right: 10px; top: --hud-top + 70px; width: 150px`, which on islands is the right third of the pill (pill top +62). "🧭 Exploring Lv 4 / Sharp eyes: …" covers "Say hello to so|meone 2/10". At 360px it also cuts the toast into "The map is [bar] … on this island". Its 92% dark background lets the covered text bleed through as noise. → Give the skill bar its own slot (under the pill, full pill width, or a bottom-left slide-in), never overlapping another notice. Shots: [m-skill.png](shots/ui2/m-skill.png), [m-n.png](shots/ui2/m-n.png) (middle), [a-island-hud-pill.png](shots/ui2/a-island-hud-pill.png)
- **[U-97] "+XP" pops spawn on top of the pill and the toast** (Med). `.prog-pop` starts at `--hud-top + 120px` and rises 46px, which is exactly the pill (island) and the toast slot. "+17 XP" overprints the toast as "The map is w+17 XP.e" and floats as a ghost through the pill text. → Pop from the thing that earned it (above the player, or out of the caught fish on the reveal card), then fly a small pip into the pill's bar. Shots: [m-pill-pop-skill.png](shots/ui2/m-pill-pop-skill.png) (top panel), [a-pill-2x.png](shots/ui2/a-pill-2x.png)
- **[U-98] The top of the screen is now five stacked boxes** (Med). In the entrance the top 180 css px hold the hint (over the strip, U-28), "Collect all", the rank pill, the fold caret, and (outside) the Warm/Cold detector badge butting against the pill with no gap. That is over a fifth of the phone before any room. → One HUD band: strip on line 1, rank + pinned goal folded into line 2 of the strip, Collect as a pip on the gold number, detector inside the Interact button. Shots: [a-room-hud-pill-crop.png](shots/ui2/a-room-hud-pill-crop.png), [a-island-hud-pill-crop.png](shots/ui2/a-island-hud-pill-crop.png)
- **[U-99] Pill construction** (Med). `juice.js mountLayer` / progression.css `#prog-pill`. Problems:
  - The rank number is an 18px "1", left-aligned in a 38px badge under a 9px "RANK" label (below the 13px floor), leaving dead space on the right.
  - The XP bar is a smooth vertical gradient (`#f2d36b → #c9a23f`) with no ticks and no number.
  - The pinned goal's "2/10" sits right beside the XP bar, so it reads as "XP 2/10".
  - The goal truncates to "Say hello to someo…" at 390 and "Say hello to…" with large text.
  - The fold control is an 11px system "⌃" glyph hanging below the frame's bottom-right corner like a stray mark (28x14 hit area).

  → A pixel rank medal (number centred, 2-3x larger, on a ribbon) and a segmented pixel XP bar with "120/300 XP" on press. The goal goes on its own line with a target icon. The fold becomes a pixel chevron inside the frame, at least 44px. Shot: [a-pill-2x.png](shots/ui2/a-pill-2x.png)
- **[U-100] Skill icons are colour emoji** (Med). `src/progression/data/skills.json` `icon`: 🎣 ⛵ 🧭 💛 🍂, printed into the skill bar (`juice.js skillBarShow`). On iPhone they're glossy Apple emoji beside pixel text. → Five 16x16 pixel skill icons (rod, sail, compass, heart, leaf) in `src/ui/icons.js`. Shot: [m-skill.png](shots/ui2/m-skill.png)
- **[U-101] Skills have no screen** (Med). Five skills with 20 levels and perks each, but levels only flash for 1.5 s in the slide-in bar. `fieldoverlay.js` `TABS` has no Skills page, and Records only shows Rank. → A Skills page (or a Records section): five rows, each with an icon, a level medal, a segmented bar and the next perk.

## Reward cards and the rank ceremony

- **[U-102] A third reward-card style, and a second queue** (Med). `#prog-card` (progression.css) is a square flat panel with a 3px dark border and the border recoloured by rarity. #189 had just unified the catch and celebrate cards into one look (rounded, inset gold ring, icon tile). The progression queue (`rewardqueue.js`) and `celebrate()`'s queue (`src/ui.js`) don't know about each other: `#celebrate` is not in `index.js BLOCKERS`, so a goal celebration and a reward card can be up at once. → One reward-card component (pixel frame, icon or picture tile, kicker, title, chips) and one queue for every reward. Shots: [m-cards-0.png](shots/ui2/m-cards-0.png), [m-celebrate-toast.png](shots/ui2/m-celebrate-toast.png)
- **[U-103] Rarity colours used as decoration** (Low). Card borders come from hard-coded rarities: "Welcome back" is blue (rare), any journal milestone is purple (epic), "A rumour" is gold with a glow (legendary), and the event subscriber lane is epic. Rarity colour stops meaning rarity. → Rarity borders only on things that have a rarity (fish, cosmetics); system cards stay in the panel frame. Shots: [m-cards-1.png](shots/ui2/m-cards-1.png), [m-cards-2.png](shots/ui2/m-cards-2.png)
- **[U-104] Reward chips: colour squares and one star for everything** (High). `juice.js chip()` / `ALIAS`:
  - A cosmetic is shown as a flat 10px colour square: "Flower crown" is a pink square, "Straw hat" a yellow square, "Bamboo rod" a tan square.
  - XP, titles, Renown tokens and cosmetics all alias to the same star icon.
  - "5 worms" gets the fish icon.
  - Gold is the concentric-squares "coin" that reads as a target (U-18).
  - Swatch chips are shorter than icon chips, so a row of chips doesn't line up.

  → Each reward shows its real thumbnail: the hat sprite, the rod, a worm, a title ribbon, a 9x9 pixel coin. Use one chip height. Shots: shots/ui2/c-rank-crop.png, [m-cards-1.png](shots/ui2/m-cards-1.png), [m-cards-2.png](shots/ui2/m-cards-2.png)
- **[U-105] The new-species stamp card is gone in about a second** (Med). `juice.js speciesCard` calls `cardShow(…, 1500)`. In practice the card was up at 250-1000 ms and gone by 1250 ms. The fish washes in from a silhouette over 0.85 s and the "NEW" stamp lands at 0.8 s, so name and colour are readable for well under a second. The stamp is CSS-rotated 8° pixel text (anti-aliased, off the pixel grid). Rarity is shown only by border and title colour, with no word (tokens.css says colour is never the only signal). → At least 2.5 s (tap to skip), a stamp drawn as a pixel sprite (not rotated text), and a rarity pip and word. Shots: [m-species.png](shots/ui2/m-species.png)
- **[U-106] Card copy repeats itself, and only one kind of card has a picture** (Med). `juice.js present()`:
  - Copy repeats three times: "GOLD / Sold 6 fish / +84 gold / [84 gold]", "REQUEST DONE / Wen is happy / +40 gold / [40 gold]".
  - Kickers are wrong: "UNLOCKED" on a rumour, "GOT IT" on a newly found place.
  - Numbers are formatted two ways on one card: "1,240 gold" in a line and "1240 gold in a letter" in the chip.
  - Only species cards carry a picture. Friendship and request cards have no face, the variant card has no fish, the place card has no view.

  → One line of title, one of rewards. Every card gets the face, fish or place it is about (portrait bust, fish at integer scale, minimap chip). Shots: [m-cards-0.png](shots/ui2/m-cards-0.png), [m-cards-1.png](shots/ui2/m-cards-1.png), [m-cards-2.png](shots/ui2/m-cards-2.png)
- **[U-107] Variant names are a rainbow gradient** (Med). `style.css .rv` (~l.2165) runs `linear-gradient(#f06a8a, #f2d36b, #6fd07a, #5aa8f0, #c88af0)` through `background-clip: text` and animates it. "Golden Carp" reads pink-magenta, "Ghost Catfish" purple-pink, "golden Carp" in the market pink. A moving gradient behind pixel glyphs smears their edges. → A variant gets its own colour (golden = gold, albino = white, ghost = pale teal) and a 1px pixel sparkle sprite next to the name, not a gradient. Shots: [m-cards-2.png](shots/ui2/m-cards-2.png) (bottom left), [m-catch-4.png](shots/ui2/m-catch-4.png)
- **[U-108] The rank-up ceremony is just a number on a dim screen** (Med). `juice.js rankCeremony`, progression.css `#prog-rank`:
  - There is no crest, medal or ribbon art. The big "4" floats over the world and sits right on the museum's lit doorway.
  - The glow is soft CSS: a 24px text-shadow plus a 70px inset edge vignette.
  - The label says "Level up" for a Rank and for Renown.
  - "tap to continue" is a lowercase, muted, blinking line.
  - A major rank plays a 'burst' sound but shows no confetti.

  → A pixel medal or ribbon plate that the number sits on, a stepped pixel glow, "Rank 4!" as the label, pixel confetti on major ranks, and "Tap to continue" on a small pixel tag. Shots: shots/ui2/m-rank.png, shots/ui2/c-rank-crop.png

## Catch reveal, reel and bite

- **[U-109] Golden, albino and ghost catches look like plain fish** (High). progression.css l.99-101: `#catch .catch-pic.hide-in canvas { animation: sil-wash … forwards }` ends on `filter: none`. A forwards-filled animation overrides `.catch-pic.golden canvas { filter: sepia(1) … }`. On a forced golden carp the computed filter was `brightness(1)`. The "Golden Carp" reveal shows a normal brown carp, and the "Albino Yellow perch" shows a normal green-and-yellow perch. The rarest moment in fishing looks like a common catch with a pink name. → Real variant sprites (a gold palette swap with shine pixels, a white-pink albino, a translucent ghost) drawn into the canvas, not CSS filters. Shot: [m-catch-4.png](shots/ui2/m-catch-4.png) (panels 2-3)
- **[U-110] Variant catches wear the base species' frame** (Med). `reveal.js showReveal` sets `card.className = rarity-${sp.rarity}`, and the `const r` it computes for variants is never used. A golden carp gets a green "Uncommon" border and chip under an "epic" dim, with no "Golden" chip or badge. → The variant tier gets its own frame and a chip ("Golden variant ✦" as a pixel badge). Shots: [m-catch-4.png](shots/ui2/m-catch-4.png), [m-catch-3.png](shots/ui2/m-catch-3.png) (ghost)
- **[U-111] The near-miss silhouette is invisible** (Med). `showNearMiss` draws `drawShadow` (pure black) in the `#1d1714` picture box, so "It got away…" shows an empty dark box. The chips are "???" and a lone "L". → Silhouette in a lighter shade (`--ui-line`) with a splash or ripple, size written out ("a large one"). Shot: [m-catch-3.png](shots/ui2/m-catch-3.png) (panel 4)
- **[U-112] Catch-card chips are noisy and cryptic** (Low). Up to five letter-spaced caps chips in four colours: a stark white-bordered "Common", "18 cm · L", pink "NEW", green "PERFECT". The size class is a bare letter ("L", "M", "XL"). "PERFECT" wraps onto a row of its own. The title wraps "You caught an Albino Yellow / perch!" with odd capitals. → Two chips at most (rarity pip + word, size in words). "New!" and "Perfect!" go in a ribbon on the picture. Sentence-case names. Shots: [m-catch-0.png](shots/ui2/m-catch-0.png), [m-catch-4.png](shots/ui2/m-catch-4.png)
- **[U-113] On the legendary card the gold button isn't a button** (Med). `.catch-hint` ("TAP TO CONTINUE") is styled as a gold pill primary (skin.css #189). The only real button, "Save picture", is the quiet brown one under it. → The hint is plain muted text (or a ▼). If "Save picture" stays, it is the one gold button. Shot: [m-catch-2.png](shots/ui2/m-catch-2.png) (panels 3-4)
- **[U-114] The saved legendary picture is programmer art** (Med). `reveal.js savePicture`: a 480x600 PNG with Georgia bold on flat black, an 8px flat gold stroke, the fish blown up so its detached tail floats, a US-format date, "Curation" in grey serif and an empty bottom third. This is the image players would share. → A pixel trophy card: wooden plaque or mount, the fish at an integer scale with a shadow, the name in the pixel font on a brass plate, size and date, island name, the Curation logotype. Shot: [o-save-picture.png](shots/ui2/o-save-picture.png)
- **[U-115] The reel minigame is bare CSS** (High). `reveal.js runReel`, progression.css `#reel`:
  - The "fish" (`.rl-fish`) is a cream `clip-path` pentagon that reads as an arrow or pencil tip: no tail, no eye, not the species.
  - The track is a smooth teal gradient, and the zone is a flat green slab that turns flat salmon-red.
  - There is no rod, reel, line or tension art.
  - The "Fish" HUD button stays on screen beside it.

  → A pixel reel frame (wood and brass, Stardew-style). Use the hooked species' silhouette, with legend fish glowing. Add a stepped pixel zone with highlight edges, a line-tension pixel meter and splash particles, and hide the Fish button. Shots: shots/ui2/d-reel-crop.png, [m-catch-0.png](shots/ui2/m-catch-0.png)
- **[U-116] The bite "!" is a Georgia glyph darkened by the night lighting** (Med). `src/fishing.js` l.289 draws `add.text('!', { fontFamily: 'Georgia, serif', … strokeThickness: 6 }).setResolution(4)`, a smooth vector glyph. At dusk the scene lighting darkens it to muddy brown, so the most urgent cue in fishing is the dimmest thing on screen. The legendary bite is the same glyph at 44px. → A pixel "!" bubble sprite (the BUBBLE art, fixed per P-106) on an unlit UI depth, with a gold version and sparkles for rare and legendary bites. Shot: [d-bite3-crop.png](shots/ui2/d-bite3-crop.png)

## Field journal (fieldoverlay.js and its tabs)

- **[U-117] Twelve tabs in three rows before any content** (High). `fieldoverlay.js TABS` renders 12 bevel buttons that wrap into three rows (about 170 css px) and are not sticky. Counts are a "Fish ·6" suffix that reads as a stray dot. With the HUD and pill above, the first content line is around y 470 of 844. → Three groups (Goals, Collection, World) as a sticky segmented control, sub-pages in a second row or a page picker. Counts become a gold pip badge. Shot: [m-fj-goals.png](shots/ui2/m-fj-goals.png)
- **[U-118] Two journals with the same Fish page** (Med). The museum Journal's Fish tab and the Field journal's Fish tab both show the progression "By island" list, rods and bait. The Field journal is reachable from the Menu hub, a Journal card and the pill. Players get two books that half-overlap. → One Journal with a "Field" section, or the Field journal keeps fish and the museum Journal links to it. Shots: [m-f2.png](shots/ui2/m-f2.png) (right), [m-fj-fish.png](shots/ui2/m-fj-fish.png)
- **[U-119] The Goals tab is a wall of Pin buttons** (Med). `goalsui.js goalRow`:
  - Every row, including the one already pinned in "Now", gets a 32px "Pin" (and "Reroll") button, under the 44px target.
  - Done rows fade to 60% opacity, like disabled rows, with no tick or "claimed" state.
  - Rewards are muted text with no icons, and bars are smooth gold strips rather than the segmented pixel bar (U-11).
  - Titles come straight from data: "3 left to complete pond fish", "Rank 6: 76 gold 75/539", "Weekly rumor: a Atlantic salmon near Island One".

  → Pin as a pushpin icon toggle on the row, a pixel tick stamp for done, reward icons, and written titles ("Catch 3 more pond fish"). Shot: [m-fj-goals.png](shots/ui2/m-fj-goals.png)
- **[U-120] The Market has no item art** (High). `shopui.js shopTab`:
  - Bait, gifts, lures, boats, rods, hats and town projects are all text rows with a price button.
  - The gold row reads "100000080 gold" with no separators.
  - "Sell 4" has no unit or coin.
  - Locked items show "Rank 10" or "Fishing 8" as dead dark buttons with no lock.
  - "Golden fly ×5 ★ today only" uses a unicode star.
  - Every town project repeats "Town project:" and the same line, "Helps the island, and the island thanks you."

  → A shop grid of item cards (pixel thumbnail, name, price with a pixel coin), a stall or counter header with the shopkeeper, locks as a lock icon plus "Rank 10", and a written line per project. Shot: shots/ui2/m-fj-shop.png
- **[U-121] The Lodge is a list, not a place** (High). `lodgeui.js`:
  - Rooms are rows ("Porch · Yours", "Lounge · Buy at the market").
  - The trophy wall is text rows with "Mount" buttons.
  - The aquarium is a 190px CSS gradient box (`.lodge-tank`) where 3x fish slide in straight lines, all facing right, from -80px to 520px and pop back.
  - There is no sand, rock, plants, bubbles or glass.

  The code calls this "where a collection becomes something you can see". → A pixel lodge interior (porch, lounge, aquarium room) with mounted trophy plaques on a wooden wall. The tank becomes a pixel aquarium: gravel, weeds, bubbles, glass glint, fish turning at the walls. Shot: [m-fj-lodge.png](shots/ui2/m-fj-lodge.png) (panels 1-2)
- **[U-122] The People page has no faces** (High). `fieldjournal.js people()`:
  - Each row is a name plus ten tiny system ♥/♡ glyphs (the hollow ♡ is a hairline).
  - Reactions are written as "bread: ♥ tea: ☺ boot: 💧 shell: …", a mix of emoji and system glyphs.
  - New people carry a red "NEW" tag.
  - Unknown people are "???" text.

  → A portrait bust per person (the same bust the conversation box needs, P-113), 10 pixel hearts (filled, half, empty), and gift reactions as small item icons with a face emote. Unknown people as a dark silhouette bust. Shot: [m-fj-lodge.png](shots/ui2/m-fj-lodge.png) (panel 4)
- **[U-123] Places and Secrets are walls of identical text boxes** (High). `fieldjournal.js listPage` gives every unknown cell "??? / Something is still here": 40 on Places and 67 on Secrets. The "NEW" tag overprints the "d" of "Main Island". Gated rows use the 🔒 emoji, and the copy has a double colon ("Needs: Climbing gloves: ledges"). → Grouped by island, with a count per island instead of 67 cells. Found places get a small pixel vignette; unknown ones a pixel "?" marker tile. A real lock icon. Shot: [m-fj-misc.png](shots/ui2/m-fj-misc.png) (panels 1, 3, 4)
- **[U-124] The Places minimap is a black void** (Med). `worldlife.js minimap()` is shown at 264px. Fog is pure black, uncovered land is one flat green block with a white dot, and there is no water, path, frame or legend. The line above says "18% uncovered" while the picture shows about 5%. → Parchment fog over a pixel map in terrain colours, a compass and frame, a "you are here" marker, and ? pins for known secrets. Shot: [m-fj-events.png](shots/ui2/m-fj-events.png) (panel 4)
- **[U-125] The Emotes page doesn't use the game's emotes** (Med). `EMOTE_GLYPH` in fieldjournal.js prints ♥ ★ ♪ "Zzz" 💧 … ! ? at 26px. The in-world emotes are pixel bubbles (`art.js EMOTE_ICONS`). Names are raw ids: "heart", "star", "note", "zzz", "sweat". → Show the actual emote bubble sprites at 3x, with written names ("Delighted", "Sleepy") and who showed it first. Shot: [m-fj-misc.png](shots/ui2/m-fj-misc.png) (panel 2)
- **[U-126] The Events tab is text** (Med). `eventsui.js`:
  - The streak calendar is seven text cells ("Day 1 / 30 gold") with Day 7 alone on the last row.
  - The one action, "Claim today's calendar reward", is a quiet brown button.
  - Event species cells are "??? / Biting now" boxes with no silhouette, and the 30-tier track is plain "Tier 1 · 36 gold [Claim]" rows.
  - Events have no banner art.
  - The bulletin shows "species, cosmetics" as a machine label.
  - Reminders is "Off [Turn on]" instead of the Settings switch.

  → A pixel calendar strip of seven stamps, a gold Claim, an event banner per festival (lanterns, ice, blossom, sails), silhouettes in the species cells, a stepped tier track with reward icons, and the `ui-toggle` switch. Shot: [m-fj-events.png](shots/ui2/m-fj-events.png)
- **[U-127] Titles show raw data, and worn titles show nowhere** (High). Locked rows are "???" plus the source enum in lowercase ("rank", "journal", "skill", "event", "friendship"). The page header says "0 of 31 · 0%" while three titles are owned and one is worn. "Wearing" is a dead dark button. The only places a title or frame appears are the Records header row as text ("Rope frame · Angler") and the pill's `title` attribute (a tooltip that never shows on a phone). → A nameplate preview at the top (frame art plus title on a ribbon) that also shows on the share card, a real "how to earn" line per locked title, and a correct count. Shot: [m-fj-misc2.png](shots/ui2/m-fj-misc2.png)
- **[U-128] Records is 16 plain rows** (Low). Label/value rows with no icons. "✦" marks variants, and "First catch —" uses a bare dash. → Icon per stat, the big three (fish, heaviest, streak) as stat tiles, a pixel sparkle for variants. Shot: [m-fj-misc2.png](shots/ui2/m-fj-misc2.png) (panels 3-4)
- **[U-129] Leads are blocks of small text** (Low). Each legend is about six lines of 13px muted text (rumour, clue, two hints) with "Rumour / Clue found / Caught!" as words. → A three-step stage track (rumour → clue → caught) with pixel icons per stage, and the newest line only. Shot: [m-fj-lodge.png](shots/ui2/m-fj-lodge.png) (panel 3)
- **[U-130] Fish hints overflow the tiles; the hint sheet is unstyled** (Med). `collections/tab.js tile()` (#195 hint text):
  - Unknown fish captions like "Common · Found around Main Island, Island One or The Far Isle." wrap to five lines inside a 3-column cell.
  - Silhouettes are near-black on the dark cell.
  - The hint sheet (`openHintSheet`) is titled "???", uses a text "✕" instead of the pixel close icon, and its silhouette is invisible.

  → One-line caption (rarity pip + "Tap for hints"), lighter silhouettes, and a hint sheet with the uiIcon close and three hint rows as unlockable stamps. Shot: [m-l.png](shots/ui2/m-l.png) (panels 2-3)
- **[U-131] Numbers on the new pages contradict each other** (Med).
  - The Field journal Fish tab says "72 of 72 fish caught" directly above "Main Island 6/43" (museum codex and progression species are two ledgers).
  - "Next time" says "Today: 0 fish all-time" while Records says 14 caught.
  - Titles says "0 of 31" with three owned.

  → One source of truth per number. Write "all-time" or "today", not both. Shots: [m-fj-fish.png](shots/ui2/m-fj-fish.png), [m-f1.png](shots/ui2/m-f1.png) (panel 2), [m-fj-misc2.png](shots/ui2/m-fj-misc2.png)

## Menu hub, Take a break, sail locks

- **[U-132] The Field journal's icon is the blob "map" icon** (Low). `src/ui/hud.js` puts the new "Field journal" tile first with `uiIcon('map')`, which reads as a pin, shield or heart blob (U-18). The Journal overview's new "Out in the world" card (`journalhome.js`) is a wide card with the same blob in an empty dark cover. Five hub tiles leave "Take a break" alone next to an empty slot. → A field-notebook icon (book with a leaf or a fish), a designed cover for the card, and an even tile count or a full-width last tile. Shots: [m-f1.png](shots/ui2/m-f1.png) (panel 1), [m-m.png](shots/ui2/m-m.png)
- **[U-133] The "Next time" card is a plain web list** (Low). `restui.js openBreak` uses browser disc bullets. The copy reads "Today: 0 fish all-time, Rank 5. Rested XP: 0.", "a Atlantic salmon" and "3 fish left on pond fish." There is no art for a goodbye moment. → Pixel checklist pips, written lines ("An Atlantic salmon is still out there"), and the caretaker waving at the door. Shot: [m-f1.png](shots/ui2/m-f1.png) (panel 2)
- **[U-134] Locked docks in the boat menu** (Med). `sailmenu.js` prefixes the 🔒 emoji. `.sail-dest.locked` washes the whole row with opacity 0.72 and saturate(0.5). The preview line reads "27 fish you have not found live here: ??? ??? ??? ???" and wraps to a lone "???". Tapping a locked dock only shows a small "Needs: Ice hull" toast at the top of the screen, behind the pill and far from the row. → A pixel lock icon, the row kept at full contrast with the requirement as a chip ("Needs a sailboat"), 3-4 small fish silhouettes instead of "???" words, and the tap opening the requirement inline. Shots: [m-f1.png](shots/ui2/m-f1.png) (panels 3-4), [m-f2.png](shots/ui2/m-f2.png)

## Friendship talk

- **[U-135] Gift menu: text buttons that hide the face you're told to watch** (Med). `talkflow.js namedConverse`:
  - The gift step lists up to eight full-width text buttons ("Fresh bread ×2", "Old boot ×1", … "Never mind") with no item icons.
  - The box grows to about 60% of the screen and covers the NPC, though the People page says "Give a gift and watch their face".
  - The reaction emote then pops tiny at mid-screen while the box sits at the bottom.
  - The hub line is in the third person in Wen's own box ("Wen would love a Rainbow smelt.").

  → A gift picker as a 4-column grid of item icons with counts in a short drawer, keeping the NPC visible above it. The reaction plays on the portrait bust in the box (expression frame). Request lines are written in the first person. Shots: shots/ui2/m-g2.png, shots/ui2/m-g.png

## Cosmetics on the player (cosmetics.json, lookfx.js)

- **[U-136] Every hat is the same flat top hat** (High). `lookfx.js PlayerLook.update` l.37-47 draws two `fillRect`s (brim + crown) in one flat colour with a 1px dark outline for every hat. Straw hat, Fisher beanie, Bucket hat, Captain's cap, Flower crown, Lantern hat, Winter antlers and Witch hat have the identical silhouette, and the Curator's crown is a gold top hat with a 2x2 red dot. The rects are 1 world px while the character is drawn at 1.15x, at fractional x (`pl.x - w/2`), so the hat's pixel grid doesn't match the body's. The same hat is drawn in every facing. → One pixel sprite per hat per facing, as character layers (the HATS system in art.js): straw brim with a band, a ribbed beanie, a peaked captain's cap with a badge, a flower crown of 5-6 blossoms, antlers with tines, a pointed witch hat with a buckle, a jewelled crown with points. Shot: [m-cosmetics-2x.png](shots/ui2/m-cosmetics-2x.png) (top row, bottom-left)
- **[U-137] Outfits tint the player's skin, not the clothes** (High). `lookfx.js` l.29 `pl.setTint(mix(0xffffff, colour, 0.45))` multiplies the whole sprite. The jacket keeps its shape and colour, while the face, hands and hair change: Gallery tuxedo turns the curator's skin dark grey-brown, Spring kimono makes the face pink, Yellow oilskin makes it orange, and Ghost sheet barely changes anything. → Outfits as real outfit layers (tuxedo with a white shirt and bow tie, oilskin coat with a hood, a kimono with a sash, a ghost sheet over the body with eye holes), never a tint on skin. Shot: [m-cosmetics-2x.png](shots/ui2/m-cosmetics-2x.png) (bottom row, panels 2-5)
- **[U-138] Frames, boat paints and rod skins have no visible form** (High). 8 frames, 5 boat paints and 5 rod skins are sold and awarded:
  - Frames exist only as a word in the Records header ("Rope frame · Angler").
  - Boat paint is drawn nowhere: no code reads `equipped.boatPaint` or `boatpaint`.
  - Rod skins only recolour the 1.5px rod line (`fishing.js` l.270).
  - In the market, wardrobe and reward chips they're flat colour squares.

  → Draw what you sell: a frame as a pixel nameplate border, shown on the pill, the share card and the Records header. Boat paint goes on the rowboat sprite and the boat scene, and a rod skin on a rod sprite in the hand and in the reel frame. Each gets a thumbnail in the market.

## #189 / #193 / #187 / #191 screens

- **[U-139] The title card reads "Ouration"** (Med). The new `#boot` in index.html is "Curation" in 36px Pixelify, whose C is the O-like glyph (U-01), so the first word of the game reads "Ouration". It's text and a bar on flat brown with "OPENING THE MUSEUM" in letter-spaced caps, and no logotype or facade. → A drawn pixel logotype (with a C that can't be misread) over a small museum facade, the bar as pixel steps. Shot: [m-system.png](shots/ui2/m-system.png) (left)
- **[U-140] The crash screen is still off-system** (Low). The new crash screen (index.html inline) is much better, but the raw error line is in `ui-monospace` (another font), and both buttons are flat inline-styled blocks with no bevel, unlike every game button. There is no art. → Use `pixel-btn` / `ui-btn`, tuck the error under a "Details" toggle, add the caretaker sprite. Shot: [m-system.png](shots/ui2/m-system.png) (middle, right)
- **[U-141] The top-slice celebration covers the wheel** (Med). e2e0a5b calls `celebrate('250 gold!', …)` when the wheel lands on 250. The centred card covers the wheel and its pointer, the moment you'd want to see. The same screen now has two gold primaries ("Collect 50 gold" and "Spin"). → Celebrate under or beside the wheel (or flash the winning wedge and burst pixel coins from it). One gold primary at a time: Spin goes gold once the gift is collected. Shot: [m-j1.png](shots/ui2/m-j1.png) (panels 3-4)
- **[U-142] The "Tap to look closer" tag is pasted on the painting** (Low). `daily.css .daily-zoom` is an 11px label (under the 13px floor) in a smooth 4px-radius dark pill sitting on the art's bottom-right corner. The viewer opened from Today shows a single carousel dot for a one-painting set. → A small pixel magnifier icon tab on the frame edge, not on the canvas. Hide the dots when there is one painting. Shot: [m-j2.png](shots/ui2/m-j2.png) (panels 1-2)
- **[U-143] Column picker thumbnails are scaled unevenly** (Low). `decor.js columnPicker` (#191) renders `columnCanvas(id, 34, 88)` and style.css `.column-pick img` shows it at 42x109 (1.235x), so column pixels come out uneven. Place labels are 10px, and the cards use the old 8px-radius style and `--gold-dark` tokens instead of the UI system. → Render at 2x into 68x176 and show at an integer scale. Labels at 13px, cards on the ui-card frame. Shot: [m-l.png](shots/ui2/m-l.png) (panel 1)

## Re-check of earlier findings

- [U-01] PARTLY. #189 redrew the 5 with a flat top ("25%" and "3,500" now read right) and #193 removed the fi ligature ("fish" reads as fish). Still wrong at 13/15/17px:
  - C reads as O ("Oatch 4 fish", "Oarp", "Oommon", and "Ouration" on the new title card).
  - Z reads as 2 ("2ara").
  - B reads as G ("Guild").
  - New pairs found: 0 = O, 8 ≈ B, 6 ≈ G, and E looks like €.

  Shots: shots/ui2/k-font-check.png, [m-cards-0.png](shots/ui2/m-cards-0.png), [m-system.png](shots/ui2/m-system.png)
- [U-02] STANDS. The new screens add more off-system type:
  - Georgia in the bite "!" (fishing.js l.289), the Save-picture PNG and the catch blurbs.
  - ui-monospace in the crash error line and the debug panel.
  - Colour emoji in skills (🎣⛵🧭💛🍂), reactions (💧), docks and places (🔒) and the detector (📡).

  Shots: [d-bite3-crop.png](shots/ui2/d-bite3-crop.png), [o-save-picture.png](shots/ui2/o-save-picture.png), [m-system.png](shots/ui2/m-system.png)
- [U-03] STANDS. Dialogue text in the conversation box is still Georgia, for staff, visitors and the new named islanders alike. Shot: shots/ui2/g-chat-crop.png
- [U-04] STANDS. Faux-italic Pixelify artist line on Today's painting ("Caravaggio · 1601"). Shot: [m-j2.png](shots/ui2/m-j2.png) (panel 1)
- [U-07] PARTLY. #189 staff rows put the text at full width with the button underneath, so no more 7-line wraps. Toasts are still ~230px and four lines ("The map is whole. An X shows on the ground somewhere on this island."). Shots: [m-j2.png](shots/ui2/m-j2.png) (panel 3), [m-skill.png](shots/ui2/m-skill.png)
- [U-09] STANDS, and worse. The new progression cards and panels are square-cornered, while the catch card, celebrate card and conversation box (#189/#193) were made rounded (`--ui-r`). Shots: [m-cards-0.png](shots/ui2/m-cards-0.png), shots/ui2/g-chat-crop.png
- [U-13] PARTLY.
  - Fixed: Ask dialogs ("Not now" brown, "Open it" gold) and Today's Collect and Spin are now gold.
  - Still wrong: Today now shows two gold primaries at once, the Field journal's only action ("Claim today's calendar reward") is brown, and the legendary catch card makes the non-button hint gold (U-113).

  Shots: shots/ui2/m-j3.png (panel 1), [m-j1.png](shots/ui2/m-j1.png)
- [U-14] STANDS. "Build a coffee counter" is still a washed beige slab. Market locked items ("Rank 10", "Fishing 8") and "Wearing" are dead dark buttons. Shots: [m-j2.png](shots/ui2/m-j2.png) (panel 3), shots/ui2/m-fj-shop.png
- [U-17] STANDS. "📡 Warm" and "📡 Cold" are still in Georgia on the gold button, now jammed against the rank pill with no gap. Shot: [a-island-hud-pill-crop.png](shots/ui2/a-island-hud-pill-crop.png)
- [U-18] STANDS. Icons are unchanged except the new fish, key and star-o. The new Field journal tile and card use the blob "map", and gold chips still use the target "coin". Shots: [m-f1.png](shots/ui2/m-f1.png), shots/ui2/c-rank-crop.png
- [U-20] STANDS, and grows. The new screens add ♥ ♡ ☺ ✦ ★ ⌃ ✕ and • bullets as icons. The builder's ★/☆ favourite was swapped for pixel stars (#189); that one is fixed. Shots: [m-fj-lodge.png](shots/ui2/m-fj-lodge.png), [a-pill-2x.png](shots/ui2/a-pill-2x.png)
- [U-26] STANDS. Red dots on Journal and Menu stay on at the same time as the hint bubble. Shot: [a-room-hud-pill-crop.png](shots/ui2/a-room-hud-pill-crop.png)
- [U-27] / [U-77] PARTLY. The #189 `#boot` title card now covers the black start and the zeros flash, and the HUD shows real numbers when it goes. It's text only and reads "Ouration" (U-139). Shot: [m-system.png](shots/ui2/m-system.png)
- [U-28] PARTLY. `hint.js` (#189) now puts the tip away when a panel opens over it. On the world screen it still covers the "Your Museum / gold" strip, and at 360px the "M" of Menu ("enu"). Shots: [a-room-hud-pill-crop.png](shots/ui2/a-room-hud-pill-crop.png), [m-n.png](shots/ui2/m-n.png) (top)
- [U-29] STANDS, and worse. Toasts still land at top+112:
  - In rooms they now sit under the rank pill (U-95).
  - On islands they get cut by the skill bar (U-96) and hit by +XP pops (U-97).
  - Behind sheets they peek out clipped ("The map is whole. An X" above the Field journal).

  Shots: [m-celebrate-toast.png](shots/ui2/m-celebrate-toast.png), [m-fj-goals.png](shots/ui2/m-fj-goals.png) (panel 2)
- [U-38] STANDS. Rods in the Fish tab still use smooth CSS half-circle bobbers and text "Equip" / "Locked" / "Equipped". Shot: [m-fj-fish.png](shots/ui2/m-fj-fish.png) (panel 2)
- [U-41] STANDS. "Claim ◯ 400" in the Fish log: the coin still reads as an O on gold. Shot: [m-fj-fish.png](shots/ui2/m-fj-fish.png) (panel 3)
- [U-44] STANDS. The viewer opened from Today (e2e0a5b) shows the same blurred wall band, 30px unicode ☆ stars and a plain textarea. Shot: [m-j2.png](shots/ui2/m-j2.png) (panel 2)
- [U-46] STANDS. The caretaker's bubble is still cream paper, serif, with the monospace caps "EDMUND CARETAKER", grey "TAP TO CLOSE" and the long white needle tail up to the NPC. Shot: shots/ui2/m-j3.png (panel 3)
- [U-47] PARTLY.
  - Fixed in #193: choices are now bevel buttons, the "more" marker is a gold pixel chevron, and the box has an aria label and inset gold ring.
  - Still wrong: the portrait is still the tiny full-body sprite, the box is ~210px tall for one line, and the corners are smooth-rounded.
  - Typing is still slow: "A good day is" after 2.5 s, "What would you like to giv" after 4.5 s.

  Shots: shots/ui2/m-g.png, shots/ui2/g-chat-crop.png
- [U-48] STANDS. The unlock dialog says "Free for now (500 gold)", the staff board "Hire · Free (300 gold)". UI.md (#189) now writes this into the rules ("a free price reads 'Free (500 gold)' or 'Free for now (500 gold)'"). Only the Carpenter's "(instantly, for now)" was reworded (#193). Shots: shots/ui2/m-j3.png (panel 1), [m-j2.png](shots/ui2/m-j2.png) (panel 3)
- [U-49] PARTLY. `celebrate()` now queues with an icon tile and an "n more" line (#189). The card takes ~0.9 s to fade in, its confetti is 46 smooth rotated CSS squares, and the card is smooth-rounded. The black fade on room unlock was not re-checked. Shot: [m-celebrate-toast.png](shots/ui2/m-celebrate-toast.png) (top)
- [U-56] STANDS, now in the Field journal too. The sheet top jumps from y 200 (Goals, Fish) to ~230 (Leads) and ~420 (Emotes) as you change tabs. Shots: [m-fj-lodge.png](shots/ui2/m-fj-lodge.png) (panel 3), [m-fj-misc.png](shots/ui2/m-fj-misc.png) (panel 2)
- [U-61] STANDS, and grew. "Testing (for now)" is still in player Settings, and #193 moved one more cheat into it ("Hand me something dirty", out of Storage). Shot: [m-j2.png](shots/ui2/m-j2.png) (panel 4)
- [U-62] STANDS. Settings switches are still black boxes with a gold or beige square. Shot: [m-j2.png](shots/ui2/m-j2.png) (panel 4)
- [U-63] STANDS. Wheel numbers still rotate with their wedges ("001", "04", "SL", "S2", "09"), and the pointer is still the hot-pink triangle. e2e0a5b adds a celebrate card on the 250 slice that covers the wheel (U-141). Shot: [m-j1.png](shots/ui2/m-j1.png) (panels 3-4)
- [U-70] STANDS. The sail menu still ends with an underlined "Stay here" link and has no header close. The new locked docks add 🔒 emoji rows (U-134). Shot: [m-f2.png](shots/ui2/m-f2.png)
- [U-73] PARTLY. The catch card is now on the system (#189: gold inner ring, rarity border, chips). It is still smooth-rounded, the blurb is Georgia, and the fish tails are still detached. Shots: [m-catch-2.png](shots/ui2/m-catch-2.png), [m-catch-4.png](shots/ui2/m-catch-4.png)
- [U-75] PARTLY. The crash screen is now in the pixel font, says the museum is safe, offers "Try again" first and erases only on a second tap (#189). The error is still shown in monospace, and the buttons are flat inline blocks (U-140). Shot: [m-system.png](shots/ui2/m-system.png)
- [U-76] PARTLY. The rotate screen is now in the UI font with a turning phone (#189). The phone is a smooth rounded CSS rectangle (6px radius), not pixel art. Shot: shots/ui2/i-rotate.png
- [U-81] PARTLY. Builder checkboxes are now 44px pixel squares with a pixel tick, and the favourite star is pixel (#189). "Snap pieces" is still a native select with the system chevron. Shot: [m-l.png](shots/ui2/m-l.png) (panel 4)
- [P-113] STANDS. `src/dialogue.js` l.37 still does `g.drawImage(portrait, 0, 0, 64, 64)` of the whole `_down` texture. The new named islanders (islandlife.js `talk()` passes `${n.prefix}_down`) get the same 8px-headed full-body portrait in a rounded box. Shot: shots/ui2/g-chat-crop.png

## Top 5 (new content)
1. **Make the rewards look like what they are** (U-109, U-136, U-137, U-138, U-104). Variant catches render as plain fish, every hat is the same top hat, outfits tint the player's skin, frames and boat paints are drawn nowhere, and rewards appear as colour squares. Cosmetics and variants are the progression's main prizes; they need real sprites.
2. **One layer order for the HUD additions** (U-94, U-95, U-96, U-97, U-98). The rank pill floats over every sheet and hides every room toast, the skill bar covers the pill, and +XP pops land on both. Give each a fixed slot and put the pill under the overlay dim.
3. **Give the Field journal pages art** (U-120, U-121, U-122, U-123, U-124, U-125). The market sells unseen items, the lodge is a list, People has no faces, Places and Secrets are 100+ identical "???" boxes, and the minimap is black. Each page needs its own pictures: item thumbnails, a lodge interior, portrait busts, pixel emotes, a parchment map.
4. **One reward-card family with pictures, and one queue** (U-102, U-105, U-106, U-108, U-113). Merge #prog-card into the #189 card look, give every card the face, fish or item it's about, and keep cards up long enough to read. Make the rank-up a medal ceremony with pixel confetti.
5. **Pixel-art the fishing moments** (U-115, U-116, U-111, U-114). Draw the reel as a reel frame with the hooked fish's silhouette, a pixel "!" bubble that the night lighting doesn't darken, a visible near-miss silhouette, and a shareable legendary trophy card.

## Systemic issues (new content)
- **Screens built as data dumps.** Almost every #195 page is rows of text with a small button (market, lodge, people, goals, events, titles, records, leads, gifts). The layer has very little art of its own; even the minimap and aquarium are CSS boxes.
- **CSS stand-ins for art.** Variants are CSS filters (which are themselves overridden), outfits a whole-sprite `setTint`, hats two `fillRect`s, the reel fish a `clip-path`, the tank a gradient, rarity glows soft box-shadows, and variant names a rainbow `background-clip` gradient.
- **Glyphs and emoji are back as icons.** Skill emoji, ♥♡☺💧 reactions, ♪★ emotes, 🔒 locks, ✦ for variants, ⌃ for fold, ✕ as text, browser list bullets. Several reward types share one star icon.
- **Three overlay systems that don't know about each other.** The progression layer (z 28, its own queue), `celebrate()` (its own queue), toasts (z 12) and the hint all claim the top-centre of the screen. There is no shared slot map, so they overlap the HUD, each other and open sheets.
- **Raw data leaks into copy.** Source enums ("rank", "journal", "skill"), set ids ("pond fish"), size-class letters ("L"), "a Atlantic salmon", "rumor"/"rumour", unformatted numbers ("100000080 gold", "1240 gold"), and counts that contradict each other (72/72 vs 6/43, 0 fish vs 14, 0 of 31 titles).
- **Rarity colour is overused.** It appears on borders of system cards, on "???" placeholders, on market rows and as a rainbow for variants, so it stops meaning rarity.
- **Two journals.** The museum Journal and the Field journal overlap (both have Fish, both list islands), are reached from three entry points, and duplicate content.
