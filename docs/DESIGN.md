# Curation — Game Design Doc (v0.1)

> See also: [First Session Walkthrough](FIRST_SESSION.md) · [Backlog](BACKLOG.md).

## Pitch
A cozy, top-down, faux-16-bit pixel tycoon game (Stardew / Pokémon B&W vibe). You get a run-down museum and grow it into a world-class one by collecting **real masterpieces shown in HD**.

**Hook:** "Stardew, but the paintings are real." Old masterworks are public domain.

## Basics
- **Platform:** phone first, **portrait only** (never sideways). Web later.
- **Room proportions:** character = 1 tile. First room is a top-to-bottom hallway: 5-tile floor, 2-tile side walls (9 tiles = screen width), short back wall at the top, entrance at the bottom. Paintings hang on the side walls (3 per wall).
- **Look:** 32px tiles for finer detail. Fake-3D "looking down into a box": side walls lean outward at 45°, back wall is a trapezoid, and paintings sit on the wall at the wall's angle. The straight-on view only appears when you walk up and select a painting. Floors are continuous patterns (e.g. staggered wood planks), not grid squares.
- **Repair-first start:** cracks, stains and cobwebs sit on top of the room. Walk up, press **Interact** (bottom-right button, only shown when something is in reach) and they disappear.
- **Customize (home button):** two tabs. **This room** (applies only to the room you're in): floor pattern (planks, checker, angled checker, stone brick, tile) and colors (checker has two), wainscot, wallpaper, carpet runner on/off + color (default maroon), plants between paintings (fern, monstera, cactus, little tree). **Character**: hair, skin, outfit, pants, shoes. Every color row is a swipeable strip ending in a + for any custom color.
- **First room:** small on purpose (5 × 12 tiles, 3 slots per side wall) so you want to expand.
- **Controls:** press and drag only (no tap-to-walk). The Interact button shows an icon for what you're about to interact with.
- **Building rooms:** walk to an unbuilt exit → Interact → pick vertical/horizontal and short/medium/long (shows painting capacity). The preview is cut by a dotted line near the exit end; the room body stays still and the end piece is a vertical carousel (swipe up/down): stairs up, door on the main wall, door on the end wall/side wall, stairs down, no exit. The new room's exit becomes the next build spot. Vertical rooms hang paintings on the side walls and you enter at the bottom; horizontal rooms hang them on the back wall and you enter through a door on the left end wall.
- **Toolkit (hammer button):** pick a decor item and drag it onto the floor grid (green = fits, red = blocked); tap placed items to move, rotate or remove. Every item earns gold per day; the HUD shows museum gold/day and visitors/month. Relics and science pieces (vase, sarcophagus, dinosaur skull, globe) are in.
- **Themes (Customize):** one tap sets a room's floor, walls, wainscot, lighting and music (Classical, Egyptian, Japanese, Natural history, Modern, Moody). Each room also has its own lighting and music (generated, no files; mute toggle).
- **Gold (built):** each room earns gold per hour (paintings + decor). Coins pile up in that room near its entrance, up to 8 hours' worth; walk up and Interact to collect. HUD shows wallet, gold/hr and visitors. Items cost gold and sell for 50%; each new room costs more than the last (bigger sizes cost more).
- **Services (built):** coffee counter (one per museum, barista; earns 1 gold/hr per 100 visitors/month) and janitor closets (up to 3). Rooms slowly get puddles and litter (each -10% that room's income); each janitor keeps 3 rooms clean, otherwise you mop.
- **Rooms (Customize):** rename and resize the room you're in (decor stays), pick door or archway for its exit (archways: walk straight through, no fade). **Rooms tab:** reorder rooms in the chain (decor moves with them) or jump to one. Room shapes: vertical, horizontal, big hall.
- **Visitors:** each has a personality (nerd, casual, superfan, snob, kid, grump, tourist). Talk to them for one or two lines, often about the painting they're near (jokes and facts). Speech bubble sits at the top or bottom of the screen with a tail pointing at them.
- **Team:** solo dev.
- **Player:** one character, the curator. Customizable look. No backstory.
- **Controls:** tap where you want to walk, plus free movement: hold anywhere and drag to walk in any direction (diagonals allowed).
- **Caretaker:** an old, charming NPC who stayed with the museum. Gives the one line of exposition and guides the tutorial.
- **Opening:** the loading screen shows the outside of the run-down museum. "Congrats on your new museum!" Then the first room: gray, cracked, dirty.
- **Style:** warm lighting, cozy, a little extravagant/bourgeois. Pixel world, HD paintings.

## Core loop
1. Play mini-games → coins
2. Get paintings (buy, quests, fair crates)
3. Hang paintings + decorate → more visitors
4. Visitors → passive income (**capped at 8 hours offline**)
5. Expand rooms/wings → repeat

## Museum building
- Start: one small room, ~3 paintings per wall, gray tile, cracks and grime.
- Clean up first (mini-games), then decorate.
- Buy new rooms: choose size/shape (long, wide, big). Each room costs more than the last.
- **Construction takes real time:** small rooms are quick, big rooms ~1 day. **2 builders** (2 builds at once). Gems can speed it up. No Clash-style two-week waits.
- Everything else is **instant**: hanging paintings, decorating, mini-games.
- Customize floors (patterns, colors), walls, frames, lighting, plants, carpets, benches.
- **Full freedom:** any painting in any room. The museum is yours.
- **Optional themed bonus:** a room that's all one section (e.g. all Impressionism) gets 1.5× income. Nice, not a game changer.
- **Themed wings:** Japanese (cherry blossoms, ukiyo-e), Chinese (ink scrolls), etc. Counters Eurocentric bias.
- **No relics at launch** (paintings only). Relics/sculpture later.
- **Rooms are unlimited.** Cost scales each time (eventually "a zillion"). Use this to find where performance breaks.
- Late-game sink: frame your own artwork (very expensive).
- Future: visit friends' museums.

## Collection
- **Rarity by fame:** Common → Rare → Epic → Legendary (Starry Night, Mona Lisa).
- **Sets:** complete an artist (0/12 van Gogh) or a movement → big bonuses / unlocks.
- **Codex = passport.** Once you collect a painting, it's stamped forever and always counts toward set/artist progress, even if you sell it.
- **Inventory vs Codex:** inventory = what you own now. Codex = everything you've ever collected.
- **Fair crates:** odds shown, pity guarantee. **Crates never give duplicates** — they only draw paintings you don't own. If nothing is left in that pool, you get a **huge coin payout** instead (worth it even when rich).
- **One of a kind:** you own *the* Starry Night.
- **Selling:** sell for **50%** of value. The painting goes back into the loot pool.
- **Buy-back:** after a **1-week cooldown** you can buy a sold painting back at a premium price (e.g. to finish a themed room).
- **Gallery Shop:** rotating stock of 3–5 specific paintings, refreshes daily. Buy directly with coins.
- **Codex milestones:** rewards at 10%, 25%, 50%, 75%, 100% of the full Codex.
- **No condition/leveling:** all paintings are in good condition.
- Paintings go to inventory; place them on any wall slot.

## Viewing a painting
- Walk up and interact. The camera turns to face the wall (2D trick that feels 3D, like Pokémon B&W tunnels).
- Painting in HD, wall blurred behind it.
- Swipe sideways to slide along the wall to the next painting.
- Scroll down: info, art historian notes, **your rating and journal note** (Letterboxd-style).

## Visitors & famous artists
- Guests wander around and change daily. Talking to some gives small rewards → reason to check in.
- **Visitor counter:** no reviews. Just a popularity number (monthly / yearly visitors) that grows with your collection. Flavor more than metric; can hit trillions after months of grinding.
- **Famous visitors:** each painting of theirs in your **Codex** (owned or sold) raises their daily visit odds (0.001% → 0.01% → 0.1% → 1% → 5%).
- Once met, they become a **regular**: many dialogue lines.
- **Reward:** a permanent income boost (or another booster, e.g. XP, if we add more stats).
- Include non-painters (Socrates, Shakespeare, Cleopatra…).
- Meta goal: 0/12 artists met.

## Mini-games
**Rules**
- **Unlimited plays.** Rewards drop off the more you play in a session (big payouts first, smaller later).
- **First game of the day** bonus + **streak** bonus.
- **Daily wheel spin** — the only once-a-day item.
- Start a game from the **menu** or from its **spot in the museum** (mop closet, security desk). The character only runs around inside the mini-game itself.

**Ideas (brainstorm)**
**Maintenance — "after hours, 30 seconds"** (mess exists only in the mini-game; the museum always looks clean)
- Mop Rush — clean spills before time runs out
- Weed the Lawn / Pigeon Chase

**Security**
- No Flash! — tap guests raising cameras
- Catch the Thief — find the suspicious guest before they leave
- Paparazzi — block photographers when a famous artist visits

**Art-themed**
- Restoration — scrub grime off to reveal the HD painting (grime exists only in the mini-game; real paintings stay perfect)
- Crate Tetris — pack art crates into the delivery truck
- Hang it Straight — timing game
- Tour Guide — lead a tourist line through your museum (snake-style)
- Night Watch — red light / green light with statues

**Social (later)**
- Auction House — bid and bluff vs friends
- Co-op Cleanup

**MVP picks:** Mop Rush, No Flash!, Restoration, Crate Tetris.

## Economy & monetization
**Currencies**
- **Gold coins** — main currency (not dollars; keep it a bit removed from reality).
- **Gems** — premium currency. Buy with real money, or earn from rare quests / special mini-games.

**Gems = time (keeps purchases fair at every stage)**
- Coin value explodes over time (1M coins is huge on day 1, nothing at month 3), so never sell flat coin amounts.
- Instead, gems buy **time**: skip construction, or buy "**X days of income**" based on *your* average daily earnings.
- A first big room takes the same time and the same gems for a week-one player and a three-month player.
- A dedicated free player can save quest gems for a week of income.

**Progression gate: Curator's Office**
- Town-Hall-style building, upgraded with coins.
- Each level unlocks crate tiers, new wings/sections, and eventually a 3rd builder.

**Income**
- Income = painting popularity × decor multiplier × visitors.
- Offline earnings stop at **8 hours** → reason to open the app.
- Coins pile up around the museum; walk to collect. A few "collect all" pads, rising cost.
- **Pricing: free + ads + gems.** Gems speed progress but are always earnable in-game. **No pay-to-win.**
- Revenue: rewarded ads (coins), gem packs, cosmetics, seasonal exhibition pass.

## Retention & sharing
- Daily: new guests, Painting of the Day, daily quests.
- Events: "Impressionism Week", "Hokusai Festival" → exclusive decor.
- Share museum screenshots / tour clips ("rate my museum").
- References to study: PewDiePie's Tuber Simulator, Clash of Clans, Stardew, BitLife mini-games.

## Practical notes
- **Art sources (CC0):** Met Open Access, Art Institute of Chicago, Rijksmuseum, Smithsonian, Cleveland Museum.
- **Pixel art:** prototype with an asset pack (e.g. LimeZu *Modern Interiors*), then commission a pixel artist.

## MVP scope
- 1 room (expandable to 2–3)
- ~30 paintings, 3 artists
- 4 mini-games
- Clean → decorate → visitors → passive income (8h cap)
- Codex
- 1 famous visitor (van Gogh)

## Scrapped
- "Faux" title and the Spot-the-Fake mini-game.

## Open questions
- Engine choice for phone-first (decide when coding starts).
- Exact crate odds / pity numbers.
- Reward drop-off curve for repeated mini-games.
- Buy-back price after the 1-week cooldown.
- Gem pricing model.
- Curator's Office level costs and exact unlocks per level.

---

## Expansion ideas (brainstorm, Oct 2026)
Curation grew from a painting simulator into a museum simulator. Paintings stay the core, but anything a museum holds is fair game, and the more interesting the better. Sean designs the areas; this is the list to pick from.

### Areas, with Boston inspiration
**Art (the core)**
- Painting galleries by era: Renaissance, Dutch, Impressionist, American, Japanese prints.
- Sculpture court: marble and plaster casts (the MFA's big courtyard).
- **The Gardner Room**, after the Isabella Stewart Gardner Museum: salon-style walls floor to ceiling around a courtyard garden. Hook: the empty frames from the famous heist, and tracking down the stolen art is a quest line.
- Modern wing (ICA style, a white cube), once copyright allows.
- Prints and early photography.

**Science (Museum of Science)**
- Dinosaur hall: a big pixel T-rex skeleton as the centerpiece, plus fossil shelves you walk up to and tap to see the real fossil in HD (like the paintings).
- Space: planetarium dome, meteorites, moon rock, rocket.
- Electricity: a Van de Graaff generator, with a timed lightning show as an event.
- Human body, optics, illusions: mirror maze, camera obscura.

**Natural history (Harvard Museum of Natural History)**
- Glass flowers (a perfect collectible set).
- Minerals and gems.
- Taxidermy dioramas.
- Ocean hall with a whale skeleton overhead, and an aquarium wing (New England Aquarium) with a giant tank.

**History and archaeology**
- Egypt: mummies, sarcophagi, canopic jars.
- Greek and Roman: urns, mosaics, columns.
- Dig site: a sandbox room where you excavate (a natural mini-game).
- Maritime (Peabody Essex, USS Constitution, Tea Party ships): ship models, figureheads.
- Arms and armor.
- Clocks and inventions: robots and machines (MIT Museum).

**Architecture**
- Model hall: famous buildings in miniature, Gothic arches, the column orders side by side.
- Facade styles for the museum's own outside, so architecture changes the building itself.

**Outside**
- **Front lawn**: walk out of the entrance onto steps, banners, a fountain and the museum's sign. It's the base for seasons and exterior decorating.
- **Garden** (huge): Arnold Arboretum, the Public Garden's swan boats, the MFA's Japanese garden. Fountains, hedge maze, greenhouse, koi pond, sculpture garden.
- Rooftop terrace with a telescope at night.
- Petting zoo / farm (later, its own floor).

**Visitor services (they earn money)**
- Coffee shop (built), food court, gift shop (merch of your best paintings, so a famous painting earns more).
- Kids' discovery room (Boston Children's Museum).
- Lecture hall / theater: events, e.g. a famous visitor gives a talk.
- Library / archive, where the stored collection lives.
- **Restoration studio**: finds arrive dirty or damaged; restore them, then display them.

### Collecting (the Pokémon part)
- Specimen shelves for everything, using the painting viewer: fossils, minerals, coins, butterflies, shells, glass flowers, stamps, ship models.
- Sets ("all 6 trilobites", "every Monet") for a big bonus and a plaque.
- Rarity, common to legendary: rare items get special frames or cases.
- Ways to get things: expeditions, digs, donations, auctions, trades with famous visitors.

### Why these games stick, and what to borrow
- **Pokémon**: collecting, a nice world, distinct personalities. Add named regulars who come back.
- **Animal Crossing**: real seasons and real time, decorating, characters you get attached to.
- **Stardew Valley**: a daily rhythm, little goals, unlocking areas over time.
- **Two Point Hospital**: funny visitor needs, staff, ratings that bring more visitors.

### Systems that make expansions easy
1. **Elevator in the lobby**: every floor is a self-contained pack (petting zoo floor, space floor), shipped without touching the rest.
2. **Room presets**: save a room's whole layout ("Winter", "Halloween") and load it again next year.
3. **Seasons on the real calendar**:
   - snow on the lawn, fall leaves in the garden
   - holiday decor and seasonal visitors (trick-or-treaters)
   - limited-time collectibles
   - These give a reason to ship updates.
4. **Collections as data**: paintings, fossils and gems all share one format (title, image, blurb, set, rarity), so a new collection is just new entries.
5. **Spinoff-ready engine**:
   - **Shared core**: rooms, walls and floors, lighting, characters, the decor toolkit, economy, staff, menus, quests.
   - **Museum content**: paintings, exhibits, famous visitors.
   - A hotel or bank simulator would reuse the core and swap only the content.

### Expeditions and excavations (the big one)
The museum is home; expeditions are where the stories come from. Every painting has a "how I got it" story.

**The loop**
1. A lead shows up: a letter, a torn map, a pirate's note, a rumor from a famous visitor.
2. Sail out: a dock on the front lawn, a short boat scene, then an island Sean designs.
3. Explore it.
4. Bring the treasure home. It arrives dirty or damaged, is restored in the studio, then hangs with a plaque saying where it was found ("Recovered from Skull Cove").

**Kinds of levels.** Each one can be a slow puzzle, a chase with light parkour, a dig, or a mix.
- Pirate island: jungle maze, traps, a captain's map, the stolen painting in a chest; pirates to trade with or outwit.
- Shipwreck: dive into a sunken galleon; water-damaged paintings in crates.
- Desert dig: Egyptian tomb, sliding stone puzzles.
- Dinosaur badlands: brush fossils out of a cliff to build a skeleton.
- Lost temple: pressure plates, hidden rooms.
- Heist recovery: the thief's hideout, a stealth maze (ties into the Gardner Room).
- Frozen north: an ice cave, a frozen mammoth, ice-sliding floors.

**Puzzles (top-down, phone-friendly)**
- Mazes with fog that clears as you walk.
- Push-block boulders; ice sliding.
- Pressure plates and levers that open gates.
- A metal detector that beeps warmer or colder.
- Map fragments (collect 4 and the X appears).
- Riddles from NPCs (a parrot, a ghost captain).
- Fossil brushing (swipe the dirt away without breaking the bone).
- Mirrors and light beams.

**Replay and progression**
- Hand-made story islands give masterpieces; small random islands give common finds.
- Bring crew: the janitor cuts vines, the guard handles pirates, the carpenter fixes bridges.
- Ship upgrades reach farther islands, and a world map fills in as you discover more.
- Famous visitors give quests ("Van Gogh lost a sketchbook on Sunflower Isle").
- Live play for story islands; idle crews (back in a few hours) for common runs.

**First version.** One pirate island:
- dock on the lawn and a boat scene
- a hedge maze, two boulder puzzles and a map-fragment hunt
- a chest with one famous painting that arrives damaged
- restoration in the studio, then a plaque on the wall

**Tiles for it**: built (see `src/tiles.js` and the dev page `tiles.html`, below).

### Open questions for Sean
- Map: free roam (lawn → lobby → wings → elevator floors), or keep the chain of rooms with branches off the main hall?
- Should paintings eventually come only from expeditions and digs, or should buying stay as a backup?
- Can you fail an expedition (caught by pirates, the tide comes in), or is it relaxed?
- Seasons: automatic from the calendar, or chosen by the player?
- Split the shared core from the museum content now, or when a spinoff is real?

### Island tileset (built)
Outdoor tiles on the 32px grid, gen 3–5 Pokémon style, drawn in code (`src/tiles.js`). See them all animated, plus a sample island, at `tiles.html` (live: /museum/tiles.html). The page can download the whole sheet as a PNG plus a JSON of names, positions and frames.
- **Ground**: 3 grasses, jungle grass, sand, rippled sand, wet sand, 2 dirt paths, rock ground, cave floor, cobblestone, snow, ice.
- **Water** (animated):
  - deep water with drifting wave crests, shallow water with moving light
  - a bubbles overlay, a waterfall and its splash
  - a lily pad, a rock in the water with ripples
- **Edges**: 16 corner tiles per pair (each tile says which corners are covered, so any shape works):
  - grass on sand, grass on dirt, grass on rock, snow on rock
  - the shoreline, where the water's edge ebbs and flows with a foam line, wet sand and a few bubbles
  - pond banks (water on grass).
- **Cliffs and ledges** (facing the camera): top edge, face and foot (left, middle and right), side edges, stairs cut into the face, one-way ledges to hop down, mountain walls (plain and snowy), a 2×2 cave mouth.
- **Plants**: tall grass you walk through (it sways, and its front row draws over the player's legs), flowers, beach grass, mushrooms, bush, palm tree (2×3), leafy tree (2×3), pine (1×2), stump, fallen log, hanging vines.
- **Rocks**: small, big (2×2), pile, a pushable boulder, a cracked rock to smash, a beach rock, crystals.
- **Props**: dock and bridge planks, dock post, rope bridge, sign, treasure chest (closed and open), barrel, crate, a sparkling dig spot, an X mark, a dug hole, shells and starfish, a flickering torch.
- **Puzzles**: pressure plate (up and down), lever (off and on), iron gate, a stone head.
