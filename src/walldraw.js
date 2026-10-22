// Draws a painting onto a wall, matching the projection in bakeWalls.
// Side walls lean at 45° (an affine map); the back wall faces the camera.

function sideMatrix(p, g, iw, ih) {
  const { u0, u1, v0, v1 } = p.art;
  const ku = (u1 - u0) / iw;
  const kv = (v1 - v0) / ih;
  // Facing the left wall, the painting's left edge is toward the room's front.
  return p.wall === 'left'
    ? { a: 0, b: -ku, c: kv, d: kv, e: g.xL - v1, f: g.y0 + u1 - v1 }
    : { a: 0, b: ku, c: -kv, d: kv, e: g.xR + v1, f: g.y0 + u0 - v1 };
}

// Screen-space bounding box of the painting.
export function artBounds(p, g) {
  const { u0, u1, v0, v1 } = p.art;
  let xs;
  let ys;
  if (p.wall === 'back') {
    xs = [g.xL + u0, g.xL + u1];
    ys = [g.y0 - v1, g.y0 - v0];
  } else {
    const m = sideMatrix(p, g, 1, 1);
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
  if (p.wall === 'back') {
    const { u0, u1, v0, v1 } = p.art;
    const r = [(g.xL + u0 - ox) * S, (g.y0 - v1 - oy) * S, (u1 - u0) * S, (v1 - v0) * S];
    if (src) ctx.drawImage(src, ...r);
    else ctx.fillRect(...r);
  } else {
    const m = sideMatrix(p, g, iw, ih);
    ctx.setTransform(S * m.a, S * m.b, S * m.c, S * m.d, S * (m.e - ox), S * (m.f - oy));
    if (src) ctx.drawImage(src, 0, 0);
    else ctx.fillRect(0, 0, iw, ih);
  }
  ctx.restore();
}
