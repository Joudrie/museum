// Draws a painting onto a wall, matching the projection in bakeWalls.
// Side walls lean at 45° (an affine map); the back wall faces the camera.

// The wall a painting hangs on: which way it faces and where it sits on screen.
export function wallRef(p, g) {
  if (g.refs?.[p.wall]) return g.refs[p.wall];
  return { face: p.wall, x: p.wall === 'right' ? g.xR : g.xL, y: g.y0 };
}

function sideMatrix(p, r, iw, ih) {
  const { u0, u1, v0, v1 } = p.art;
  const ku = (u1 - u0) / iw;
  const kv = (v1 - v0) / ih;
  // Facing the left wall, the painting's left edge is toward the room's front.
  return r.face === 'left'
    ? { a: 0, b: -ku, c: kv, d: kv, e: r.x - v1, f: r.y + u1 - v1 }
    : { a: 0, b: ku, c: -kv, d: kv, e: r.x + v1, f: r.y + u0 - v1 };
}

// Screen-space bounding box of the painting.
export function artBounds(p, g) {
  const { u0, u1, v0, v1 } = p.art;
  const r = wallRef(p, g);
  let xs;
  let ys;
  if (r.face === 'back') {
    xs = [r.x + u0, r.x + u1];
    ys = [r.y - v1, r.y - v0];
  } else {
    const m = sideMatrix(p, r, 1, 1);
    const pts = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
    xs = pts.map((q) => q[0]);
    ys = pts.map((q) => q[1]);
  }
  const x = Math.floor(Math.min(...xs));
  const y = Math.floor(Math.min(...ys));
  return { x, y, w: Math.ceil(Math.max(...xs)) - x, h: Math.ceil(Math.max(...ys)) - y };
}

// Paint into ctx at scale S, with (ox, oy) as the canvas origin in screen space.
// src may be null: then a flat placeholder color is used.
export function paintArt(ctx, src, p, g, S, ox, oy) {
  const iw = src ? src.width : 100;
  const ih = src ? src.height : 100;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = p.placeholder;
  const ref = wallRef(p, g);
  if (ref.face === 'back') {
    const { u0, u1, v0, v1 } = p.art;
    const r = [(ref.x + u0 - ox) * S, (ref.y - v1 - oy) * S, (u1 - u0) * S, (v1 - v0) * S];
    if (src) ctx.drawImage(src, ...r);
    else ctx.fillRect(...r);
  } else {
    const m = sideMatrix(p, ref, iw, ih);
    ctx.setTransform(S * m.a, S * m.b, S * m.c, S * m.d, S * (m.e - ox), S * (m.f - oy));
    if (src) ctx.drawImage(src, 0, 0);
    else ctx.fillRect(0, 0, iw, ih);
  }
  ctx.restore();
}
