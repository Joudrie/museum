# Big pass log

A long autonomous polish-and-features pass. Each phase ships as its own PR.

## How to test
```
npm run build && npx vite preview --port 4173 --base / &
PW=/opt/node-tools/node_modules/playwright node tests/smoke.cjs   # every flow
PW=/opt/node-tools/node_modules/playwright node tests/gaps.cjs    # wall gaps, 54 room shapes
```

## Phase 1: Bug sweep
- Added `tests/smoke.cjs`, which plays through:
  - fresh save, tutorial, cleaning, buying the main hall
  - break room and office doors, staff board
  - building 4 room types; talking to everyone
  - Customize (theme, resize, reorder, character), placing an item, Collect all
  - HUD at huge numbers, reload, cameras, robbery
  - an old pre-entrance save and a corrupt save
- In every room it also checks that the player can move from every free spot and that no NPC ends up inside a wall.
- Added `tests/gaps.cjs` (the wall-gap check, now in the repo).
- Fixed:
  - NPCs could walk through columns, handrails and other thin blockers (only the end of a walk was checked). The whole path is checked now.
  - NPCs walked through each other. Now they wait for the way to clear and turn back if it stays blocked.
  - A corrupt save (bad items, rooms or decor) crashed the game. Loading now validates shapes and drops junk.
  - The wall-spot menu said "In room 2" for paintings in the main hall; it now uses room names.
  - Placing an item with a museum-wide max read a removed office perk (closet leftovers).

## Phase 2: Lighting and atmosphere
- New `src/lighting.js`: a darkness layer multiplied over each room. It's filled with the ambient light for the time of day, and soft pools are added for:
  - picture lights over every painting, with a little brass fixture on back-wall paintings, a faint beam and a pool on the floor in front
  - ceiling lamps across the floor
  - sconces either side of back-wall doors
  - light spilling in through open doorways and the entrance
  - lamps, candelabras, lanterns, the coffee counter, fountains and glowing exhibits you place (with a warm glow; candles flicker)
  - a soft glow around the curator at night
- Day/night follows the real clock: bright midday, golden evening, dim blue night where the lamps do the work. `?hour=21` pins the hour for testing.
- Soft shadows under everyone; reflections of picture lights on polished floors (marble, tile, terrazzo...); dust motes drifting in the picture-light beams.
- `src/settings.js`: lighting quality (High / Low / Off) and day/night on/off. The Settings screen to change them comes in Phase 4.
  - Low draws the light once a minute only (no flicker, motes or glow).
  - Off skips the darkness layer.
- The light layer only redraws when something changes, so it costs almost nothing per frame.
- Gap check run at night: still no gaps in 54 room shapes.

## Phase 3: Characters
- Sprite system (`src/art.js`):
  - 13 hairstyles: short, side part, buzz, curly, long, ponytail, bun, pigtails, bob, afro, mohawk, wild, bald.
  - 10 outfits: suit, waistcoat, sweater, T-shirt, hoodie, long coat, apron, dress, gown, toga.
  - Separate jacket, shirt, tie/trim, pants and shoe colors.
  - 6 accessories (scarf, bow tie, necklace, badge, shoulder bag, camera), with their own color.
  - Every character also gets a phone pose and a sitting pose.
- Customize → Character, rebuilt:
  - a big turning preview (front, side, back, side) that stays pinned at the top while you scroll
  - only the colors an outfit actually shows (e.g. no shirt color for a hoodie)
  - hat color, accessory color, bag color.
- Famous visitors wear their own outfits:
  - Socrates and Aristotle in togas with sashes
  - Cleopatra in a white gown with a gold necklace
  - Frida in a gown and rebozo with a bun
  - Napoleon and Lincoln in long coats (Lincoln with a black bow tie)
  - Mozart in a red frock coat with a ponytail
  - Leonardo and Hokusai in robes
  - Klimt in his blue smock, and more
- Visitors:
  - Two new kinds: students (backpacks, hoodies) and regulars (older, slower, love the benches).
  - Every kind dresses the part: tourists carry cameras, art students wear smocks, snobs wear bow ties and gowns, kids are faster.
  - Couples walk around together.
  - People walk over to paintings and stop to look; they react with emote bubbles (heart, !, ?, zzz, music, star) and sometimes say something short out loud.
  - They sit on stools, benches and sofas, look around, and check their phones.
- Dialogue: more lines, plus context lines that depend on the room (mess, high or low rating, night, morning).
- Fixed: one art-nerd line was a blank slot in the list, so that visitor could say nothing.

## Phase 4: Menus and UI
- One UI system for every panel:
  - each is an `.overlay` (dim, fades) holding a `.sheet` (slides up with a little overshoot)
  - a gold-trimmed frame with rounded top corners and a grab handle
  - diamond-marked titles and matching close buttons
  - buttons press down when tapped, and cards share one style
  - every tap target is at least 44px.
- Feel (`src/ui.js`): a soft click and a tiny vibration on every button, a whoosh when a panel opens, and a softer sound when one closes.
- New sounds for unlocks, level-ups, stars and quests (used in Phase 5).
- Music and sound effects now have separate volumes.
- Settings screen (gear under the house button):
  - sound on/off, music volume, sound-effects volume
  - lighting quality, day/night, vibration
  - the testing tools (+1,000 gold, reset museum), moved out of Customize.
  - Changing lighting applies instantly, without reloading the room.
- HUD:
  - Cleaner: coins, gold per hour, visitors (person icon) and rating, plus a sun/moon dot for the time of day.
  - Tap it for "Your museum": gold/hour, visitors and rating; boosts (famous visitors met, tour guides, coffee, rooms that need mopping); every room with its stars, income and coins waiting. Tap a room to go there.
- Painting picker rebuilt as a gallery:
  - a two-column grid of framed thumbnails
  - era filters (Renaissance, Baroque, 1700s–1850s, Impressionist, Modern, Not hung) and a search box
  - picking a painting that hangs elsewhere moves it here, instead of being greyed out.
- Toolkit: categories show an item icon; locked items are greyed with a lock and the office level they need.
- Room transitions take a little step forward (zoom) with the fade. Toasts drop in under the HUD. The ad has a progress bar. Speech bubbles say "tap to close".

## Phase 5: Features and flow
- 33 more public-domain paintings (49 in all), including:
  - The Arnolfini Portrait, Las Meninas, The Garden of Earthly Delights, Hunters in the Snow, The Tower of Babel
  - Water Lilies, Sunflowers, The Bedroom, The School of Athens, The Creation of Adam, Lady with an Ermine
  - Liberty Leading the People, The Third of May, The Fighting Temeraire, The Hay Wain, Washington Crossing the Delaware, The Ambassadors, and more
  - Each has a blurb, plus visitor facts for 13 new artists.
  - Image links are built from Commons file names (Wikimedia is blocked here, so they weren't loaded). Any that fail fall back to a colored placeholder.
- 8 new decor items: grand piano, golden harp, artist's easel, grandfather clock, aquarium (glows at night), canary cage, Greek urn, carved mask. They carry a "NEW" tag in the toolkit until seen; categories with something new get a red dot.
- Goals (journal, book button under the hammer):
  - 19 goals with gold rewards (cleaning, opening the hall, hanging paintings, placing decor, meeting famous visitors, hiring staff, building rooms, ratings, income...).
  - Three are shown at a time, with progress bars. A toast, sound and red badge tell you when one is ready to claim; claiming plays a gold celebration.
  - The caretaker's walkthrough now points to the journal.
- Collection book (journal tabs):
  - every painting, on display (and where) or in storage, with its era; tap for the blurb
  - every famous visitor: portrait, name and a line once met, a silhouette until then.
- Game feel:
  - coins jump to you from closer and fly up to the coin counter with sparkles; the counter pops
  - confetti and a celebration card for opening the main hall, building a room and office level-ups (with fanfare sounds)
  - the HUD rating pops (with a chime when it goes up).
- Visitor love: every heart a visitor shows in a room adds love that fades over time. A loved room earns up to +10%, shown in the HUD breakdown.
