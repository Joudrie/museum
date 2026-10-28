# Art audit: what the game looks like today (pillar 3, step 1)

Facts from `public/builder/pieces.json`, `CREDITS.md`, `docs/ASSETS.md` and the code, 2026-10-28.
Planning only: nothing here changes the game.

## Where the pixels come from

| Source | What | Count / size | Style owner |
|---|---|---|---|
| **Drawn in code** (`src/art.js` 2.8k lines, `tiles.js`, `foliage.js`, `scenery.js`, `landmarks.js`, `critters.js`, `pets.js`) | Room floors and walls (fake-3D box), wainscot, columns, railings, stairs, plants, mess, **all characters** (20×27 in a 32×32 tile, hats / hair / outfits), emotes, the island tileset, buildings (huts, cottage, lighthouse, windmill), **the museum exterior**, fish, critters | the bulk of what you see | us (consistent with itself) |
| **LPC packs, cut into the builder** (`tools/build_palette.py`) | Furniture, floors, walls, rugs, plants, windows, statues | ~1,950 pieces from ~25 packs | ~20 different artists |
| **Single sprites** (`public/sprites/lpc/`) | 22 pieces used by the game itself: fireplace, clock, chairs, settee, bookshelves, candelabra, vase, tree pot | 22 | Sharm, AntumDeluge, bluecarrot16 |
| **Vendor library** (`assets/vendor/`, not shipped) | ~70 packs saved for later | not in the game | many |

Three looks sit side by side: code-drawn (smooth, flat, clean), LPC (soft shaded, brown outlines), and the island tiles (gen 3–5 Pokémon). They share the 32px grid and little else.

## What the builder ships, by pack

~95% is five LPC packs: `lpc-revised-base-object-kit` (654, CC-BY-SA 3.0), `lpc-walls` (631, CC-BY-SA 3.0), `lpc-upholstery` (271, mixed), `lpc-floors` (163, CC-BY-SA 4.0), `lpc-wooden-furniture` (104, CC-BY-SA / GPL). The rest are 1–30 pieces each from ~20 small packs (CC0, CC-BY, OGA-BY, CC-BY-SA). One pack, `furniture-for-nobles` (27 pieces, CC0), is 48px shrunk to 32px.

By dropdown: walls 646, seating 653, furniture 147, decor 144, rugs 111, floors 98, hang 76, plants 33, tables 28, lights 17. The numbers are lopsided: 646 wall tiles and 17 lights. Counts include near-duplicates (colour variants).

## Licences

- **CC-BY-SA 3.0 / 4.0 dominates** (~1,550 pieces). Edits to those images stay CC-BY-SA; the game code is unaffected, but every use needs a credit and a share-alike notice on the art.
- **CC-BY / OGA-BY / GPL:** credit required; GPL pieces are only used where another option in the same pack exists.
- **CC0:** about 15 pieces. No obligations.
- `CREDITS.md` lists only **4 rows**, but the builder uses ~25 packs. Credits are out of date and the in-game credits screen must be checked before any release. This is the most urgent gap and is cheap to fix.
- Replacing LPC with commissioned work (owned outright) removes all of this.

## Gaps and mismatches (what a cohesive style has to fix)

1. **No single palette.** Code-drawn rooms use `PALETTES` in `art.js`; LPC pieces carry their own colours; paintings are full HD. Nothing ties them.
2. **Furniture is single-facing.** Most LPC pieces are front view only. The builder rotates by flipping, so back and side views are wrong or missing. Rotatable furniture needs 4 facings (or 3 plus a flip).
3. **Terrain edges.** The island tileset has 16 corner tiles per material pair (materials 0 sea, 1 sand, 2 grass, 3 pond, 4 path). It works, but new materials multiply tiles. No autotile covers cliffs, shorelines with depth, or interior floor-to-wall joins.
4. **Rooms are rectangles.** Shaped walls exist (`bakeShapedWalls`), but there is no art for glass, curved or domed rooms.
5. **Museum exterior** is one code-drawn canvas (8×6 tiles). No facade styles (DESIGN.md wants them) and no day / night / season variants.
6. **Characters** are code-drawn at 20×27 with a lot of customisation but no walk-cycle art direction, no famous-visitor portraits, no dialogue busts.
7. **Missing objects** (already known): hanging chandeliers, long gallery benches, display cases and plinths, dig-site and restoration-studio props, fossil / pottery / ship-model display pieces.
8. **Scale drift.** 16px packs doubled, 48px packs shrunk, and LPC's slightly different proportions make objects feel like different sizes.
9. **Paintings vs frames.** Frames are code-drawn. HD paintings against pixel walls is the pitch; frames and wall shadows are where the two worlds meet and they deserve hand-drawn care.

## What to keep

- The 32px grid, the fake-3D room box and the 45° corner seam (hard rules in `CLAUDE.md`).
- The character customisation system (the parts list, not the pixels).
- Colour choice as a feature: pieces should be authored so they recolour cleanly.
- The code-drawn systems that already work (floor patterns, lighting) as references for the artist.
