# Aesthetics audit: every visual flaw, for the overhaul

29 Oct 2026, taken on commit `fa70331` at 390×844 portrait and up close (sprites at 6–14×). The job was to **find** flaws, not fix them: every finding names the code it lives in, what is wrong, and what to redraw it as. Nothing in the game was changed.

**Visual version** (every finding with its screenshots, filters by area and severity): https://claude.ai/artifact/5TdJk17Mx4g36tciuXPfvW (private to the owner).

Since the audit, main gained new people classes and parts (#190, #192, #194), 31 column designs (#191) and UI font and dialogue fixes (#189, #193). The old glasses, base body and walk code are unchanged, so those findings stand; a few UI and column findings may be partly fixed already.

## The numbers

**684 findings**: 145 high (wrong at phone size), 362 medium, 177 low (polish).

| Area | File | Findings | High | Med | Low |
|---|---|---|---|---|---|
| People | [aesthetics/people.md](aesthetics/people.md) | 123 | 31 | 66 | 26 |
| Water, land, weather and light | [aesthetics/terrain.md](aesthetics/terrain.md) | 122 | 22 | 60 | 40 |
| Buildings, landmarks and props | [aesthetics/structures.md](aesthetics/structures.md) | 125 | 28 | 61 | 36 |
| Museum rooms and decor | [aesthetics/interiors.md](aesthetics/interiors.md) | 112 | 29 | 61 | 22 |
| Animals and collection items | [aesthetics/creatures.md](aesthetics/creatures.md) | 109 | 20 | 66 | 23 |
| Menus, text and the builder | [aesthetics/ui.md](aesthetics/ui.md) | 93 | 15 | 48 | 30 |

IDs: P people, T terrain and water, S structures, R rooms, C creatures and items, U UI. Screenshots are in `docs/aesthetics/shots/<area>/`.

## What you asked about

### Both kinds of glasses are broken, and the round ones are worse

*“The sunglasses just look like big black eyes”*

The sunglasses are one solid black bar with no bridge, no arms and no lens shape. In side view the glint sits where the eye is, so the guard seems to stare with one white eye (P-24). Round glasses turn each eye into a solid black square (P-23). Edmund the caretaker, every nerd and most teachers, elders and historians wear them, so they read as skulls: the first person you meet looks like a skeleton (P-77). Influencers were meant to get sunglasses but get the skull glasses through a code slip (P-25). Redraw as thin frames with a 1px bridge, arms back to the ears (people have no ears yet, P-03) and a light glint on each lens.

### Yes, a lot clips

*“Look at water, see if anything is clipping”*

You can walk into the sea on every straight shore tile (T-01). The fishing bobber lands on dock planks and, casting upward, on your own head (T-20, T-21). Dock posts stand on dry sand wearing foam rings (T-23). Reeds, frogs, a parrot and lily pads sit in open sea, and jellyfish glow on the dry beach (T-30, T-31). The beach hut and a torch stand in deep water on Island One (S-24, S-28). Ducks and the swan float like toys with no waterline, and the swan, the jumping fish and builder ducks swim backwards (C-26, C-22, C-24). Boats, rocks and dolphins are never cut by a waterline (T-26, T-27, T-33). Indoors, the atrium waterfall's rocks are sliced flat by the water (R-32) and tank fish poke through the glass (C-71). Water painted in the builder is a square blue sticker the game does not treat as water (T-11, T-12).

### None of the statues or the scarecrow read as what they are

*“Judge everything: scarecrow, statues”*

The scarecrow reads as a man standing in a blue box, with a smooth human face, at twice a person's height; only its arms sway (S-45, S-46, S-47). The garden statue is a green finger in a white tub (S-48). The stone head reads as a robot or a bin, and it stands in for every culture, the Egyptian tomb and the jungle temple included (S-49, S-50). The fountain statues outside the museum are brown lumps, and their 3 animation frames were cut into 3 separate pieces, so they never move (S-51, S-52). Indoors, the classical statue's arms float free of its body, the bust is an egg on a column and the suit of armour has no arms (R-85, R-86, R-87).

## Problems that run through everything

1. **Four art styles on one screen.** Code-drawn flat shapes with black outlines, soft-shaded LPC furniture, Pokémon-like island tiles, and smooth web shapes (gradients, ellipses, blurred light, system fonts). Nothing ties them together (R-82, T-74, S-53, U-09).
2. **Nothing is drawn to one scale.** LPC furniture is drawn for people twice our size (R-81, U-86). Pets are twice too big (C-01). The scarecrow and the riddler are twice a person (S-46, S-95). Doors run from 15px to 44px for a 27px person (S-29). In the viewer a coin shows as big as a T. rex (C-78, C-80).
3. **Pixels of uneven size.** The room camera zoom (about 4.06×) and the people's 1.15× scale are not whole numbers, and many sprites are shrunk or rotated in code, so outlines wobble and pixels shimmer (R-05, P-120, C-53, S-37).
4. **Near-black outline used as paint.** Glasses, legs, tails, heads, hats and dark clothes are filled with the outline colour, so details read as holes and dark things merge into blobs (P-23, P-62, P-44, C-03, C-08).
5. **Recolours pretending to be variety.** Every person is one body, recoloured (P-83). About 40 of 103 collection items share a drawing with another item (C-57, C-86 to C-94). 1,016 of 1,150 builder pieces are recolours (U-87). Every leafy tree has the same outline (T-67).
6. **Front views in a top-down world, and skewed side walls.** The museum, cottage, huts, lighthouse, benches and crates are drawn straight-on with no roof or top surface while the ground and trees are seen from above (S-01, S-18). Inside, everything on a side wall is pushed through the same 45° skew, so paintings lie sideways and doors look like ramps (R-59, R-14).
7. **Things do not sit in the world.** No waterlines, no seat fronts, few contact shadows. People spawn stacked on one spot and stand inside furniture; wildlife walks on roofs and signs (T-26, P-117, P-85, C-52, S-118).
8. **Repeating 32px textures and hard square edges.** Grass, sea, rock, sand and dirt repeat the same marks every tile. Painted paths and water end in staircase blocks because edge tiles are opaque (T-41, T-03, T-15, T-52).
9. **Two-frame animation, or none.** The side walk has one frame, pets and critters glide on two, the museum fountain never animates (P-14, C-11, S-52).
10. **Light and seasons are colour filters.** Night is a tint whose blocky light pools turn grass lime; ceiling lights polka-dot the floor; weather falls as one line; winter turns every tree into the same bare tree (T-112, R-69, T-104, T-97).
11. **Text and icons come from the browser, not the game.** Pixelify Sans makes C look like O and 5 like S; four font families appear; emoji and Unicode stand in for icons; the museum sign, plaques, stars and quips are system text (U-01, U-02, U-16, S-04, P-105).

## Bugs that look like art problems

Small code mistakes behind some of the worst looks; each is quick to fix without new art.

- `hat: true` always becomes a sun hat, so artists lose their berets and janitors wear rangers' hats (P-42).
- Influencers' sunglasses become the round skull glasses (P-25).
- The two side-walk frames are identical, so side walking has one pose (P-14).
- The swan, the jumping fish and builder ducks face backwards because the flip test is inverted (C-22, C-23, C-24).
- Snow, leaves and petals start as one line across the screen: they are seeded before the camera has a size (T-104, C-55).
- You can walk into the sea on shore tiles (T-01); the bobber lands on docks and on your head (T-20, T-21).
- Lamp posts, campfires and museum windows never light at night on Main Island or any builder island (T-113, S-59, S-116).
- The lighthouse beam uses the picture-light texture because of a name clash (T-114).
- The museum fountain's 3 frames were cut as 3 builder pieces, so it never animates (S-52).
- You walk on top of the rose arch, and bunting lies on the ground (S-68, S-69).
- Couples, tours and school trips spawn stacked on one spot (P-85).
- All 19 famous visitors stand in the main hall at once, in a grid (P-105, R-31).
- Wildlife spawns on roofs, chimneys and signs (C-52).
- The dig cliff and dig trench tiles turn into brown mounds in the game (S-90).
- A green see-through "decor pad" square sits on the floor of every room (R-76).
- The stairs-up exit cuts a hole through the back wall, which the gap test cannot see (R-06).

## A sensible order for the redesign

1. **Lock the look first.** Finish docs/ART-BIBLE.md: one palette, colour-matched outlines, light from the upper left, a scale sheet (person, door, chair, pet, statue), whole-number scales only, one readable pixel font. Check every redraw against it.
2. **Fix the quick bugs.** The list above, so new art is not judged through old bugs.
3. **Build what the art needs.** A whole-number camera zoom; transparent edge overlays and one water mask; a waterline cut for anything in water; seats split into a back and a front; real side-wall art; character parts as layered images (the public/swap/ drop-in already exists).
4. **Redraw by what players see most.** People (body, face, glasses, walk), then the museum rooms (walls, floors, main hall, entrance), then water and island ground, then the museum front and buildings, then hero exhibits and collection items, then animals, then menus (font, frames, icons).
5. **Cut the builder library down.** From about 1,950 sliced pieces to a few hundred whole, named, in-scale objects with colour variants (U-86 to U-90).

## Each area's top 10

### People

1. **Redraw the base body and face** (P-01, P-02, P-03, P-07, P-08, P-09, P-10): an oval head with ears, 2x2 eyes with a catch-light, brows and a mouth, real arms and hands, two separate shoes, and better torso to leg proportions in 3 builds plus kid and elder. Everything else layers on this.
2. **Glasses that are frames, not black holes** (P-23, P-24, P-25, P-77, P-78): ring frames with a bridge and arms for round glasses, two-lens shades with arms and a per-lens glint. This alone fixes the skull caretaker, the skull nerds and elders, and the one-eyed guard.
3. **A real 4-frame walk, with the side view fixed** (P-14, P-15, P-16, P-17): the side arm and hand attached, alternating legs, arm swing and a body bob.
4. **True sit and phone poses, and seats split into back and front layers** (P-19, P-20, P-117): seated people with laps who sit on benches instead of standing behind them.
5. **Hats as a layer that masks hair, with shading and their own band colour** (P-42, P-43, P-44, P-45, P-46, P-47, P-48, P-52): fix the `hat: true` sun-hat bug (berets for artists, caps for janitors) and redraw the brims and crowns.
6. **A neckline layer: end the universal mustard necktie** (P-58) and redraw the outfit shapes (P-59 to P-67) with skirts, coats, aprons and togas that cover the legs properly.
7. **Famous visitors with period-correct silhouettes and signature props, 1-3 at a time, with pixel stars** (P-87 to P-105), plus dialogue busts (P-113, P-114).
8. **Skin, hair and outline ramps that hold up on deep skin and black hair** (P-11, P-72, P-73, P-74, P-75): colour-matched outlines, hue-shifted shading, and eyes that read on every skin tone.
9. **Staff classes that read at a glance** (P-78 to P-82): uniformed guard, coverall janitor with a real mop, guide with a flag (no longer the player's red twin), and a player marker.
10. **Pixel-perfect scale and pixel shadows for everyone** (P-119, P-120): integer-scale sprites drawn at their real size, and one pixel shadow under every person on islands and in rooms.

### Water, land, weather and light

1. **Water depth + macro texture** (T-02, T-03, T-10): shallow→deep bands from a distance field, a large non-repeating wave
   texture, slate night water. Turns every coast from swimming pool to sea.
2. **Fix water clipping as a set** (T-01, T-20, T-21, T-23, T-27, T-30, T-31): solid sea half of shore tiles, bobber only on
   true open water (not docks, not your head), posts/rocks/reeds/frogs/jellies only where they belong, foam rings only on water.
3. **Transparent edge overlays + blend any material** (T-15, T-52, T-53, T-54, T-11): one edge mask system composited over any
   ground, painted tiles (incl. water) feed the corner map. Kills the staircase paths, square lakes and square beaches at once.
4. **Pond banks the right way up** (T-13, T-14, T-19): earth face + shadow on the north edge, pond palette, reeds on the rim,
   proper frozen ice.
5. **Docks and boats with depth** (T-24, T-25, T-26, T-09): pilings, side boards, shadow on water, waterline-cut boats, simple
   reflections.
6. **Tree variety** (T-67, T-69, T-68): 3-4 silhouettes per species, scale/hue jitter, taller pines, a palm with real fronds.
7. **Ground macro-variation** (T-41, T-42, T-43, T-44, T-46-T-48): world-space noise and decals so lawns, rock, dirt, sand and
   paths stop reading as wallpaper.
8. **Weather and season bugs** (T-104, T-105, T-100, T-101, T-97): seed weather correctly, light it at night, snow by material,
   per-species winter/autumn looks.
9. **Cliff set with sides, corners, feet and real stairs** (T-59-T-63, T-65): plateaus that read as height, not fences.
10. **Outdoor light** (T-111-T-114): full-res light map, warm (not lime) pools off in daylight, Main's lamp posts and museum
    windows lit, a real lighthouse cone.

### Buildings, landmarks and props

1. **Rebuild the museum as a 3/4 facade kit** (S-01..S-09): roof plane, deep portico with even fluted columns,
   ashlar stone, carved pixel lettering, real windows/doors/steps, contact shadow; lit and seasonal variants.
2. **Give every building a 3/4 view with a visible roof and side wall** (S-18, S-26, S-30, S-36, S-38): cottage, huts,
   lighthouse, gazebo, windmill, greenhouse all drawn as front elevations today.
3. **Redraw the statues** (S-48, S-49, S-50, S-53): a proper marble/bronze figure on a moulded plinth, a real moai,
   and one statue per culture; drop the gold LPC foo dog or redraw it to match.
4. **Replace the brown-lump fountains and the LPC pedestals in front of the museum** (S-51, S-52, S-13, S-14) with
   museum-stone fountains (animated) and urns/lions, plus one proper doormat or runner.
5. **New scarecrow** (S-45..S-47): sack head with stitches, sleeves on the cross-bar, straw, patched clothes, person
   scale, whole-body sway.
6. **Docks and boats as structures** (S-83, S-84, S-86): pilings, side beams, water shadow, foam on water only, moored
   boats with oars laid flat.
7. **Fix depth for overhead pieces** (S-68, S-69, S-120): rose arch and bunting drawn above the player; building
   fade when the player is behind.
8. **One light table for all islands** (S-12, S-59, S-77, S-116): Main Island lamps, campfires and museum windows lit.
9. **Ruins kit for expeditions** (S-99, S-103..S-105): walls, pillars, stairs, a real shipwreck, sarcophagus and
   mammoth; temple, tomb and heist look like brick floors today.
10. **Pixel boat scene and real holiday decor** (S-108, S-117): replace the CSS boat with a pixel vignette; carved,
    glowing jack-o'-lanterns and a winter set on the facade.

### Museum rooms and decor

1. **Fix the side-wall projection for paintings, doors and arches** (R-59, R-14, R-15, R-08): upright side-wall art, hand-drawn
   angled doors and arches. Every vertical room and the hallway currently show sideways smears and "ramps".
2. **One room kit in one style at one scale** (R-82, R-81, R-84, R-83): redraw walls, columns, rails, stairs, doors and every
   item to the LPC level of shading and the art bible's scale sheet (person 31 px, door 48-64 px).
3. **Taller walls with a real cornice, bigger paintings, proper frames and labels** (R-09, R-60, R-61, R-64, R-65).
4. **Replace the debug green pad and the doormat-in-the-void** (R-76, R-03) with in-world objects and a real entrance.
5. **Main hall architecture: overhanging balcony on the columns, real stair flights, turned balustrade, proper newels, a
   camera that shows the hall** (R-23, R-24, R-26, R-25, R-04, R-31).
6. **Atrium: un-clip the waterfall, redraw the stairs and side arches, give it a grand default decor** (R-32, R-35, R-15, R-13).
7. **Redraw the hero exhibits** (R-85, R-87, R-88, R-89, R-86): statue, armour, sarcophagus, T-rex, bust.
8. **Marble and herringbone floors, and drop the dust noise** (R-45, R-46, R-48): the main hall's floor is the most-seen surface.
9. **Lighting that comes from visible sources** (R-69, R-70, R-68): no polka-dot grid at night, a sconce that looks like a lamp,
   moody that is actually moody.
10. **Close the void holes the gap test cannot see** (R-06, R-07, R-22, R-40): stairs-up notch, arch-top overlay, misplaced
    windows and light beams, see-through stairwell.

### Animals and collection items

1. **Redraw all collection items as a coherent HD-capable set** (C-80, C-81, C-83-C-106): one canvas size, one outline rule, a unique silhouette for every item (no palette swaps), and HD versions for the viewer. The trilobite, the T. rex and Triceratops skeletons, the stamps, the coins and the meteorites matter most.
2. **Give legendary skeletons real floor exhibits and real art** (C-78, C-99, C-108): side-view skulls and skeletons, per-part bones while digging, and a floor fixture.
3. **Fix the Journal grid** (C-81, C-82, C-83, C-67): titles printed over stamps and flowers, NEW badges over the art, mixed pixel sizes, outlines lost on dark cells.
4. **Redesign the pets at the right size with real anatomy** (C-01-C-18): about 15 px cats and dogs with fur-coloured legs and tails, proper ears, two eyes, readable black coats, a 4-frame walk, a real sit, and a parrot with a hooked beak that perches on the shoulder.
5. **Make water birds sit in the water and face the right way** (C-22, C-24, C-25-C-29, C-31): swan and builder ducks facing forward, waterlines and reflections, an S-necked swan, no dangling feet, ducklings spaced out, round unrotated lily pads.
6. **Fix the weather particles** (C-55, C-56): seed them across the view (they currently fall as one line), and replace the rectangles with leaf, petal and snowflake sprites.
7. **Stop wildlife walking on roofs, signs and cliffs** (C-52): real ground classes for ambient spawning.
8. **Rebuild the tanks** (C-70-C-74): spread the fish out, keep them inside the glass, a front-glass layer, no painted fish, integer scale, a size class per fish.
9. **Hand-pixel the 18 fish** (C-57-C-66): species silhouettes, proper tails and fins, koi patches, clownfish bands, rare shimmer.
10. **Replace the "bubble" rarity glow and add case glass** (C-75, C-76, C-77): pixel rim and sparkles, glass over the pieces, no fractional shrinking.

### Menus, text and the builder

1. **Replace the UI font** with a true bitmap pixel font at integer sizes (U-01): fixes C/O, 5/S, Z/2, B/G everywhere and sharpens every screen at once.
2. **One pixel frame system** (U-09, U-10, U-11): 9-slice pixel borders for sheets, cards, chips, bars, dialogs; pixel coin, dots, toggles, sliders, swatches. Ends the smooth-rounded-CSS vs pixel clash.
3. **Kill emoji and unicode icons** (U-16, U-17, U-20) and redraw one 16px icon set with real metaphors (U-18, U-19): Codex icons, detector, stars, arrows, interact verbs.
4. **Fix the hint/toast layer** (U-28, U-29, U-30): never over the strip or the viewer, toasts at the bottom, one notice family.
5. **One speech system** (U-46, U-47, U-03): conversation box with bust portraits for everyone; retire the cream needle bubble; dialogue in the pixel font.
6. **Item presentation rules** (U-32, U-34, U-43, U-45): every item at integer scale in fixed boxes, designed collection covers, an object mode (plinth/glass bell) in the viewer.
7. **Fix the layout breaks** (U-33 stamps over names, U-55 toolkit cards off-screen, U-21 sheets slicing the HUD, U-23 large-text clipping, U-08 clipped names).
8. **Pixel-art the off-style screens** (U-68 boat scene, U-75 crash, U-27/U-77 loading, U-71 dig dirt, U-72 studio surfaces, U-65 share card, U-63 wheel).
9. **Builder pieces cleanup** (U-86 scale, U-89 junk cuts, U-87/U-88 colourway and half-tile bloat, U-90 groups, U-80 real names): cut ~1,950 to a few hundred whole, named, in-scale objects with colour variants.
10. **Remove testing language and cheats from player UI** (U-48, U-61) and give pickers visual swatches (U-58).

## How it was done

Six reviewers each took one area and looked at every sprite, tile and screen in it: baked straight from the drawing code and enlarged, and in the running game at phone size (day, night, all four seasons, rain and snow, Halloween and winter, every room shape, every island and expedition). Every finding with a screenshot links to it. Related older docs: `docs/ART-AUDIT.md` (sources and licences), `docs/ART-BIBLE.md` (the proposed style), `docs/UI-AUDIT.md`.
