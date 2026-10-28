# Asset hunt: the "super dig" prompt and the to-do list

## The prompt (paste this to Claude to run the dig)

> Run a deep asset hunt for Curation (docs/VISION.md, docs/ASSETS.md). **Find, don't make.**
> We need far more top-down 2D pixel art, sized to a 32px grid (16px packs scaled ×2 are fine),
> in a cozy Pokémon / Stardew / Webkinz / Club Penguin style.
>
> **Licenses:** CC0, CC-BY, CC-BY-SA, OGA-BY or GPL only, with credit. No paid packs, no
> "free for non-commercial" packs, no revenue share. Record the author, link and license for every pack.
>
> **Where to search:** OpenGameArt (LPC and everything compatible), itch.io free asset packs
> (sort by most popular, filter "free"; list the links, the user downloads them by hand), Kenney.nl,
> CraftPix free section, GameDev Market free, GitHub repos of CC0 tilesets, and the Liberated
> Pixel Cup collections. Don't get around bot checks.
>
> **Find, by category, at least 3 candidate packs each:**
> 1. **Statues & sculpture:** busts, classical figures, animal statues, modern/abstract pieces,
>    plinths, pedestals, display cases, glass vitrines, rope barriers.
> 2. **Rocks & nature:** jagged/clunky rocks, cliffs, boulders, crystals, fossils in rock,
>    driftwood, varied trees (cherry, palm, pine, dead), bushes, flowers, tall grass with
>    **grass edges that blend into dirt, sand and stone** (autotile transitions).
> 3. **Museum architecture:** glass walls, curved walls, angled walls, arches, domes,
>    skylights, mezzanines, spiral stairs, modern and classical facades, columns of many styles.
> 4. **Exhibits:** dinosaur skeletons, fossils, mummies/sarcophagi, armour, vases, pottery,
>    tapestries, meteorites, gems, globes, telescopes, ship models, taxidermy, aquarium tanks.
> 5. **Furniture & decor (Webkinz-style variety):** chairs, sofas, benches, tables, lamps,
>    rugs, plants, shelves, signs, ropes and stanchions, with **all four facing directions**.
> 6. **Outdoor & island:** buildings (shops, cafés, lighthouse, greenhouse), fences, bridges,
>    docks, boats, market stalls, playgrounds, festival decor, street lamps.
> 7. **Characters & animals:** varied townsfolk, famous-figure costumes, pets, farm animals,
>    birds, fish (for the aquarium), bugs.
> 8. **Dig sites & discovery:** excavation tools, dirt mounds, tents, crates, bones in the ground.
>
> **For each pack give:** name, link, license, author, tile size, style match (1–5),
> what it adds, and whether it's a direct download or needs the user to download it by hand.
> Then rank the top 20 to grab first. Save the results to docs/ASSETS.md (round 3) and
> download the direct-download ones into assets/vendor/<pack>/ with a SOURCE.txt each.

## To-do list

### Builder
- [ ] **Rotatable items as one piece:** chairs, sofas, beds and anything else with four views
  becomes one item with a ⟳ badge in the list. Tap it on the map, or tap the badge, to turn it.
  Group the four views when the palette is cut (tools/build_palette.py), and store `rot` on placed pieces.
- [ ] A search box for pieces.
- [ ] Recently used pieces at the top.

### Art (after the dig)
- [ ] Replace round rocks with jagged ones.
- [ ] Better statues, plinths and display cases.
- [ ] Grass that blends into paths, dirt, sand and stone (autotile edges).
- [ ] More island buildings and props.

### Museum shapes (later, needs a design pass with the user)
- [ ] Room styles that aren't square: glass walls, curved walls, sharp angles, domes, open
  plan, small quiet rooms.
- [ ] Museum exterior re-texture (look to be given by the user).

### Notes
- AI-generated art is possible, but the rule is find first. Only consider generating if
  nothing free fits, and only with the user's say-so.
