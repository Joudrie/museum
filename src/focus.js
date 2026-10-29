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

// Lower is better; Infinity = can't be reached from here.
// (px, py) is the player, (tx, ty) the thing, d the distance already measured for it.
export function reachCost(px, py, facing, tx, ty, d) {
  const dx = tx - px;
  const dy = ty - py;
  const len = Math.hypot(dx, dy);
  if (len < 7) return d; // underfoot
  const [fx, fy] = facingVec(facing);
  const dot = (dx * fx + dy * fy) / len; // 1: dead ahead, 0: beside you, -1: behind you
  if (dot < -0.35) return Infinity;
  return d * (1.3 - 0.45 * Math.max(dot, 0));
}

// Where the top of a character's head is (the picture has some empty space above it),
// for speech bubbles and emotes to sit on.
export const headY = (s) => s.y - s.displayHeight * 0.84;
