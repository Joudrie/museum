# Art bible: the look of Curation (draft for Sean's OK)

One style for everything, so a hired artist can draw to it and the code can recolour it.
These are proposals built from what the game already does. Change anything; nothing is final until approved.
Audit of today's assets: `docs/ART-AUDIT.md`. Artist brief: `docs/ART-BRIEF.md`.

## The feeling
Cozy, warm, a little extravagant and bourgeois (DESIGN.md). A grand old museum at golden hour. Pixel world, **HD paintings**: the real art is the brightest, sharpest thing on screen, so everything around it is slightly softer and warmer.

## Fixed rules (from CLAUDE.md, not up for change)
- **32px tile grid.** Portrait only, phone at 390×844.
- **Fake-3D "box":** back wall faces the camera, side walls lean at 45°, shared 45° corner seam, side walls run to the front edge. **No void between wall planes.**
- Paintings render in HD on the wall; pixel art never sits on top of the painting area.

## Proposed style
- **View:** 3/4 top-down, objects seen from slightly above (the existing LPC angle). One camera angle, no perspective cheats per object.
- **Scale:** a character is **1 tile wide, ~1.5 tiles tall** (today 20×27 in 32×32). A door is 2 tiles tall; a chair seat is knee height (~10px of a character). Write this down once and check every piece against a **scale sheet**.
- **Palette:** one shared master palette of **48 colours** in 6 ramps (warm wood, stone / plaster, gold, red velvet, green / teal, cool shadow), 4–6 steps each. Pieces use palette colours only, so a "recolour" is a ramp swap. No pure black or pure white; darkest is a warm brown-violet, lightest a cream.
- **Light:** from the **upper left**. Highlights top-left, shadow bottom-right. The room's lighting layer (warm / day / cool / moody) tints on top, so art is painted in neutral-warm daylight.
- **Outline:** **selective, colour-matched dark outline**: a darker shade of the object's own ramp, not black. 1px outer edge on objects and characters; none on floors, walls and terrain. Interior details use no outline.
- **Shading:** 3 tones plus a highlight per material, hand-placed clusters, **no dithering** except on large fabrics and stone, **no anti-aliasing**, no blur, no rotated sprites (rotation is redrawn, not computed).
- **Texture:** readable material at a glance: wood grain in lines, marble in veins, velvet in a soft two-tone, brass with a single bright pixel.
- **Silhouettes first:** every object reads as a single dark shape at 50% size on a phone.

## Families (each drawn to the same rules)

### Furniture and props (rotatable)
- **4 facings** (front, back, left, right) for anything a player can turn; **2 + flip** for symmetric pieces. Same pivot (bottom-centre of footprint) in every facing so rotating never shifts a piece.
- **Footprint in whole tiles** (1×1, 2×1, 2×2 ...), with a stated walkable / blocked mask. Wall pieces mount at a stated height.
- **Colour:** authored in the master palette with a marked **recolour ramp** (fabric, wood, metal). Target: every sofa, chair and curtain recolours without editing pixels.
- **Display pieces** (cases, plinths, specimen shelves, easels, fossil mounts) are a first-class family, since they are what players buy and place most.

### Terrain and autotile
- Materials today: sea, sand, grass, pond, path. Add: rock / cliff, snow, desert sand, jungle floor, tomb stone, ice, wooden dock.
- **Corner-based autotile** (the current 16 tiles per pair keeps working). Each material pair needs the 16 edge tiles + 4 inner variants; every material has **3 plain variants** to hide repetition.
- Water, grass and flowers have **2–4 frame loops** at a slow, calm speed. Cliffs have a visible face (1 tile) so height reads.
- Seamless on all four sides at the 32px grid; verify with a 6×6 repeat.

### Rooms and architecture
- **Wall kit:** back wall, left / right walls, corner, doorway, arch, window, column, half-wall, railing. Each in **3 styles** to start (Classical, Victorian brick, Modern white cube).
- **Floor kit:** the current 5 wood patterns plus marble, stone, tile, carpet runner; all seamless and recolourable.
- **Non-square rooms:** glass wall / conservatory, curved corner (as stepped diagonals), domed ceiling, octagon. Delivered as wall **segments** that join at 45° and 90°, so the code builds any shape from pieces. The seam rule applies: a segment may never leave a gap at its joins.
- **Stairs and balcony:** solid flights standing out on the floor; columns stand one tile in front of the wall.

### Museum exterior
- A **facade kit**, not one picture: front doors, windows, cornice, steps, side wings, roof, in 3 styles to match the wall kits. Assembles to any width in 2-tile steps.
- Day, dusk and night versions (windows lit), and spring / summer / autumn / winter props (snow on the roof, leaves on the lawn).

### Characters
- **Base body** in 3 builds, 4 directions, **4-frame walk** and a 2-frame idle. Customisation as **layers** (hair, outfit, hat, accessory) so the existing parts system can stay data-driven.
- **Visitors** are the same bodies, recoloured.
- **Famous people** get a **dialogue bust** (about 64×64, same style, 3 expressions) plus a full sprite. Period-accurate clothes, a distinct silhouette each.
- Staff, security, caretaker and kid / elder variants.

### Everything else
- **Icons and UI:** 16px icons, 9-patch panel and button frames in the same palette (the UI should look like the world, not a web page).
- **Emotes and effects:** hearts, sparkles, dust, restoration shine; 4 frames max.
- **Creatures:** fish, birds, pets, island animals, one consistent "round and friendly" shape language.
- **Excavation and restoration set** (for pillar 4): dig tiles, brushes, fossil in rock stages, dirty to clean stages of a pot and a painting frame.

## Frames and the painting edge
Hand-drawn frames in 6–8 styles (gilt, dark wood, simple, ornate, modern) that overlap the HD painting by 2px and cast a 3px soft wall shadow down-right. This is where pixel and HD meet; it gets the most care.

## Technical delivery
- PNG, **transparent background**, no scaling, 1 pixel = 1 pixel.
- Sprite sheets on a 32px grid with a **JSON** listing names, frames, pivots, footprints and the recolour ramp (the game already reads `pieces.json`).
- One `.aseprite` (or layered) source per sheet so changes are possible later.
- Naming: `family_name_facing_frame` (e.g. `seating_chesterfield_left_0`).
- File budget: every sheet under 1024×1024; whole shipped art under 6 MB.

## Review checklist (every delivery)
Palette only · light from the upper left · scale sheet ok · 4 facings share a pivot · seamless tiles tile · reads at 50% size on a 390px screen · no gap at any wall join · recolour ramp works · licence is ours.
