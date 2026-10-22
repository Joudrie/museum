# Curation: rules for working on this repo

## Workflow
- After pushing, open a PR and **merge it yourself, every time**. Then reset the
  working branch to the new `main`.
- When the user sends a hand-drawn sketch or blueprint, study it closely. If any
  part is unclear, **ask before building**. Never guess on a sketch.
- Test in a phone-sized portrait browser (390×844) before shipping.

## Hard rules for the game
- **Portrait only.** The phone is never held sideways.
- **No black gaps between walls, ever.** Walls must always meet: the back wall
  and side walls share a 45° corner seam, and side walls run down to the front
  edge. Check every room shape (vertical, horizontal and big hall, all sizes) for void
  pixels between wall planes before shipping.
- Pixel art stays on the 32px tile grid; paintings render in HD on the wall.
- Movement is press-and-drag only (no tap-to-walk).

## Build-room page (from the user's blueprint)
- Pick Vertical/Horizontal and Short/Medium/Long at the top.
- The preview is one room cut by a **dotted line** near the exit end. The room
  body stays still; the **end piece is a vertical carousel**: swipe up/down to
  see one ending at a time, attached to the room like two pieces snapped
  together.
- **Never use horizontal scrolling on this page.**
- Horizontal rooms: enter through a door on the left end wall; the end piece is
  the right end. Vertical rooms: enter at the bottom; the end piece is the top.
