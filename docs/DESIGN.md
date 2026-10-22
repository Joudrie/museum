# Curation — Game Design Doc (v0.1)

> Concept stage. No code yet. See also: [First Session Walkthrough](FIRST_SESSION.md).

## Pitch
A cozy, top-down, faux-16-bit pixel tycoon game (Stardew / Pokémon B&W vibe). You get a run-down museum and grow it into a world-class one by collecting **real masterpieces shown in HD**.

**Hook:** "Stardew, but the paintings are real." Old masterworks are public domain.

## Basics
- **Platform:** phone first, **portrait only** (never sideways). Web later.
- **Room proportions:** character = 1 tile. First room is a top-to-bottom hallway: 5-tile floor, 2-tile side walls (9 tiles = screen width), short back wall at the top, entrance at the bottom. Paintings hang on the side walls (3 per wall).
- **Look:** 32px tiles for finer detail. Fake-3D "looking down into a box": side walls lean outward at 45°, back wall is a trapezoid, and paintings sit on the wall at the wall's angle. The straight-on view only appears when you walk up and select a painting. Floors are continuous patterns (e.g. staggered wood planks), not grid squares.
- **Repair-first start:** cracks, stains and cobwebs sit on top of the room. Walk up, press **Interact** (bottom-right button, only shown when something is in reach) and they disappear.
- **Customize (home button):** recolor the floor, wainscot and wallpaper (same textures, different colors).
- **First room:** small on purpose (5 × 12 tiles, 3 slots per side wall) so you want to expand.
- **Controls:** press and drag only (no tap-to-walk). The Interact button shows an icon for what you're about to interact with.
- **Building rooms:** walk to an unbuilt exit → Interact → pick vertical/horizontal, short/medium/long (shows painting capacity), then swipe between far-end exits (door on a wall, stairs up, stairs down, no exit) and build. The new room's exit becomes the next build spot. Vertical rooms hang paintings on the side walls; horizontal rooms on the back wall.
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
