# Curation — Game Design Doc (v0.1)

> Concept stage. No code yet.

## Pitch
A cozy, top-down, faux-16-bit pixel tycoon game (Stardew / Pokémon B&W vibe). You get a run-down museum and grow it into a world-class one by collecting **real masterpieces shown in HD**.

**Hook:** "Stardew, but the paintings are real." Old masterworks are public domain.

## Basics
- **Platform:** phone first. Web later.
- **Team:** solo dev.
- **Player:** one character, the curator. Customizable look. No backstory.
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
- **Codex:** everything you've found or completed.
- **Fair crates:** odds shown, pity guarantee, duplicates → coins.
- **One of a kind:** you own *the* Starry Night. No duplicates. (If a crate ever rolls one, it converts to coins.)
- **Inventory vs Codex:** inventory = what you own now. Codex = everything you've ever collected.
- **Selling:** you can sell paintings for coins. A sold painting goes back into the loot pool. It stays in your Codex.
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
- **Famous visitors:** each painting you own by an artist raises their daily visit odds (0.001% → 0.01% → 0.1% → 1% → 5%).
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
- Restoration — scrub grime off to reveal the HD painting
- Crate Tetris — pack art crates into the delivery truck
- Hang it Straight — timing game
- Tour Guide — lead a tourist line through your museum (snake-style)
- Night Watch — red light / green light with statues

**Social (later)**
- Auction House — bid and bluff vs friends
- Co-op Cleanup

**MVP picks:** Mop Rush, No Flash!, Restoration, Crate Tetris.

## Economy & monetization
- Income = painting popularity × decor multiplier × visitors.
- Offline earnings stop at **8 hours** → reason to open the app.
- Coins pile up around the museum; walk to collect. A few "collect all" pads, rising cost.
- **Pricing (TBD between):** free with ads, or one-time purchase. Either way, optional purchases are cosmetic / non-game-breaking. **No pay-to-win.**
- Revenue ideas: rewarded ads (coins), cosmetics, seasonal exhibition pass.

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
- Free-with-ads vs one-time purchase.
- Reward drop-off curve for repeated mini-games.
- Sell price vs buy price for paintings.
