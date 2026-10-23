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
