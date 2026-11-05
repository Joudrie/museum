# Character and animation audit (November 2026)

A harsh pass over everyone who moves in Curation: the curator, visitors, staff, famous
visitors, named friends, island people, crews, wardrobe costumes, pets and critters. Checked
at 390×844 portrait in the game, and frame by frame at 10× (stand, step one, stand, step two,
facing front, back and side).

Ranked worst first. **Fixed** = done in this pass. **Open** = still to do.

## The ranked list

1. **Fixed: the side walk was one picture played twice.** `stepFrames` returned the same stride
   for both steps, and the "stride" was just a two-pixel line between the legs, so a person
   walking left or right looked like they were shuffling. Now the legs open into an A with the
   feet planted wide and an outlined gap, and the two steps differ because the hand swings
   forward on one and back on the other.
2. **Fixed: arms never moved.** Nobody swung their arms in any view. Now, facing front or back,
   the arm opposite the lifted foot swings forward (its hand drops a pixel) and the other swings
   back. From the side the hand swings 2 px forward and 2 px back. Anyone carrying something or on
   the phone keeps their hands still, so the item stays in their hand.
3. **Fixed: walking was a hop.** The whole sprite rose a pixel on every step, planted foot and
   all, so people floated. Now the legs bend: one straight row of leg (or skirt) drops out on each
   step, so the head and body dip a pixel while the feet stay on the floor. Pets and anyone with
   a shoulder buddy or the short build keep the old bob (`DIPPED` in `art.js`, used by `motion.js`).
4. **Fixed: blinks painted skin onto hair.** Blinks were drawn at a fixed spot, so tall people
   blinked on their cheeks and short people (kids) got skin-coloured dots painted on their hair.
   Each character now records where its own eyes are (`FACE` in `art.js`), so blinks land right
   for every build, hat and pair of glasses.
5. **Fixed: only front-facing people blinked.** Side-on people now blink too (mirrored when they
   face left), and now and then someone blinks twice.
6. **Fixed: from the side the hand was a skin patch on the shirt.** There was no arm, just a
   square of skin in the middle of the body. Now a dark line runs down the arm's back edge from the
   shoulder to the hand (`armLine` in `art.js`), standing and walking, and it tilts as the arm
   swings. It is only drawn over clothes (never the collar, tie, skin or outline), so it works for
   every outfit and costume.
7. **Fixed: breathing was a 1% stretch.** On pixel art that is under half a pixel, and with the
   game's 1.35 zoom it made rows of the body shimmer and crawl. Now everyone drawn by
   `makeCharacter` has a breath-in picture (`_down_b`, `_side_b`): the chest grows one row, so the
   shoulders, head and hat rise exactly a pixel while the hands and feet stay. `tells.js` swaps it
   in and out on each person's own beat while they stand still, and blinks still land on the eyes.
   People drawn some other way keep the stretch.
8. **Open: turning is instant.** Going from left to right flips the picture in one frame. Pokémon
   does the same, so this is fine for the player; visitors could glance first (one frame facing
   front) when they turn round.
9. **Fixed: talking had no gesture.** People in a chat stood stock still. Now, facing you, a
   guest's hand comes up to their chest now and then while they talk (`_down_t`, made by
   `gestureRows` in `art.js`, swapped in by `tells.js` while `n.talking`), and drops when the chat
   ends. Anyone holding something keeps still.
10. **Fixed: the near and far leg looked the same from the side.** The far trouser leg is now in
   shadow (palette letter `q`, a darker `p`): the front leg while the near arm swings forward, then
   the back leg, so the two steps read as one leg passing the other. Only plain trousers are
   shaded. Shorts, boots and skirts are left as they are.
11. **Fine as it is:** pets (cats, dogs, bunnies, parrots) already have walk frames, a hop for
   bunnies and a sit; critters (gulls, crabs, butterflies, frogs, ducks) have their own frames.
   Emotes pop and follow the head. Shadows sit under everyone (`shadows.js`).

## Where things are

- Step frames: `stepFrames` in `src/art.js` (called by `makeCharacter` and `personRows`).
  Work poses that draw their own arms (`jog`, `sneak`) pass `plain` and keep just the leg stride.
- Walk timing: `animateWalker` in `src/motion.js` (stand, step one, stand, step two at 8 frames a
  second times the walker's rate).
- Blinks and breathing: `src/tells.js`, eye maps from `FACE` in `src/art.js`.
- To look at the frames: `personRows(view, look, frame)` gives the rows for frame 0, 1 or 2.
