# Curation: rules for working on this repo

Read docs/VISION.md first: every feature should serve it. Then docs/HANDOFF.md for where things stand and how the user likes to work.

## Workflow
- After pushing, open a PR and **merge it yourself, every time**. Then reset the
  working branch to the new `main`.
- When the user sends a hand-drawn sketch or blueprint, study it closely. If any
  part is unclear, **ask before building**. Never guess on a sketch.
- Test in a phone-sized portrait browser (390×844) before shipping.
- **Always send the links when done:** game https://joudrie.github.io/museum/ and builder https://joudrie.github.io/museum/builder.html

## Hard rules for the game
- **Portrait only.** The phone is never held sideways.
- **No black gaps between walls, ever.** Walls must always meet: the back wall
  and side walls share a 45° corner seam, and side walls run down to the front
  edge. Check every room shape (vertical, horizontal and big hall, all sizes, plus
  the entrance and the main hall) for void pixels between wall planes before shipping.
- Pixel art stays on the 32px tile grid; paintings render in HD on the wall.
- Movement is press-and-drag only (no tap-to-walk).

## Islands
- **Main Island** (src/maps/main-island.json, drawn by the user in the builder) is home: the museum
  is there and you come out of its doors. **Island One** is the old code-drawn island; its museum
  doors are locked. The boat lists every island, including ones built in the builder on the phone.

## Starting rooms (from the user's sketch)
- Room 0 is the **entrance**: you come in at the bottom, ticket desk on the right with
  the caretaker behind it, two paintings per side wall, a potted tree in each front
  corner, double doors at the back.
- Room 1 is the **main hall** (paid unlock from the entrance's double doors): a short
  hallway (break room door left, office door right) opens into one wide open room.
  Ground floor back wall: painting, arch, painting, stairs, middle arch, stairs,
  painting, arch, painting. Stairs lead up to a full-width balcony with four big
  paintings. The **stairs are solid flights standing out on the floor** in front of
  the wall (not cut into it). **Columns stand one tile in front of the wall** (you
  can stand between a column and the wall) and the balcony railing rests on them.
  Doors and arches stay **closed until the room behind them is unlocked**. Open plan, all in one view. The middle arch leads on to built rooms;
  the side arches are decoration for now.
- Both keep their shape; players decorate them freely.

## Build-room page (from the user's blueprint)
- Pick Vertical/Horizontal and Short/Medium/Long at the top.
- The preview is one room cut by a **dotted line** near the exit end. The room
  body stays still; the **end piece is a vertical carousel**: swipe up/down to
  see one ending at a time, attached to the room like two pieces snapped
  together.
- **Never use horizontal scrolling on this page.**
- Horizontal rooms: enter through a door on the left end wall; the end piece is
  the right end. Vertical rooms: enter at the bottom; the end piece is the top.

## Wakefield, MA (the user's hometown map)
- Built from real map data (tools/wakefield_map.py). **Every road goes in, even the smallest streets,
  and no road is narrower than two tiles** so the character can always walk it. A huge map is fine.
- Wakefield is a separate project that shares the tech, so the museum's grid rules don't bind it: **angled tiles are fine**
  and borders should be proper straight lines (the town line is cut along the real line, see `border` in src/mapformat.js).
- The overlay button (builder and game) lays the real street map over the tiles so the user can fix blocks by hand.
