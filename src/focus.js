// Who you mean when you press Interact. Being close isn't enough: you act on
// what you are facing. Something right behind you (a person at your back while you
// face a door) is out of reach until you turn round, and between two things in
// front the one you look at straight on wins.
const V = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const facingVec = (f) => V[f] || V.down;

// Which way a character sprite is looking, from its texture ('player_up', 'x_side' + flip...).
export function facingOf(s) {
  const k = s.texture.key;
  if (/_up(_\d)?$/.test(k)) return 'up';
  if (/_side(_\d)?$/.test(k)) return s.flipX ? 'left' : 'right';
  return 'down';
}

// How straight ahead something has to be to count as "facing" it (the dot product of your
// facing and the way to it: 1 dead ahead, 0 beside you). About 66 degrees either side.
export const FACING_MIN = 0.4;

// Lower is better; Infinity = can't be reached from here.
// (px, py) is the player, (tx, ty) the thing, d the distance already measured for it.
export function reachCost(px, py, facing, tx, ty, d) {
  const dx = tx - px;
  const dy = ty - py;
  const len = Math.hypot(dx, dy);
  if (len < 7) return d; // underfoot
  const [fx, fy] = facingVec(facing);
  const dot = (dx * fx + dy * fy) / len; // 1: dead ahead, 0: beside you, -1: behind you
  if (dot < FACING_MIN) return Infinity;
  return d * (1.25 - 0.4 * dot);
}

// The one rule for what Interact means, shared by the museum and the islands: every candidate
// (a person, a door, a sign, the water, an item) is offered here, and the nearest one you are
// facing wins. Offer a thing with where it is; things under your feet (a dig spot, a stain)
// are offered without a place and need no facing. Nothing facing you = nothing.
//   const r = resolver(player.x, player.y, 'up');
//   r.consider(26, distance, { npc }, npc.x, npc.y);      r.best  -> the focus or null
export function resolver(px, py, facing) {
  let best = null;
  let bestC = Infinity;
  return {
    consider(reach, d, focus, tx, ty) {
      if (d >= reach) return;
      const c = tx === undefined ? d : reachCost(px, py, facing, tx, ty, d);
      if (c < bestC) {
        best = focus;
        bestC = c;
      }
    },
    get best() {
      return best;
    },
  };
}

// Where the top of a character's head is (the picture has some empty space above it),
// for speech bubbles and emotes to sit on.
export const headY = (s) => s.y - s.displayHeight * 0.84;
