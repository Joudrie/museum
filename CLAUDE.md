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
  edge. Check every room shape (vertical, horizontal and big hall, all sizes, plus
  the entrance and the main hall) for void pixels between wall planes before shipping.
- Pixel art stays on the 32px tile grid; paintings render in HD on the wall.
- Movement is press-and-drag only (no tap-to-walk).

## Starting rooms (from the user's sketch)
- Room 0 is the **entrance**: you come in at the bottom, ticket desk on the right with
  the caretaker behind it, two paintings per side wall, a potted tree in each front
  corner, double doors at the back.
- Room 1 is the **main hall** (paid unlock from the entrance's double doors): a short
  hallway (break room door left, office door right) opens into one wide open room.
  Ground floor back wall: painting, arch, painting, stairs, middle arch, stairs,
  painting, arch, painting. Stairs lead up to a full-width balcony with four big
  paintings. Open plan, all in one view. The middle arch leads on to built rooms;
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
