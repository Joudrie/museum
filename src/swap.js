// Drop-in art swap: a PNG with the same name as a placeholder replaces it, no code change.
//   public/swap/tiles/<tile name>.png      island tile or prop; frames side by side, each the tile's own size
//   public/swap/sprites/<sprite name>.png  room furniture sprite (public/sprites/lpc/<name>.png), any size
//   public/swap/pieces/<group>/<n>.png     builder piece "<group>/<n>", same width and height as the piece
// The build lists what is in public/swap in swap/index.json (see vite.config.js). Docs: public/swap/README.md.
// A file that is the wrong size is ignored with a console warning, so the placeholder stays.

const BASE = './swap';
const empty = () => ({ tiles: [], sprites: [], pieces: [] });
let index = empty();
const images = {}; // 'tiles/grass_1' -> loaded image

const load = (src) =>
  new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });

async function init() {
  try {
    const r = await fetch(`${BASE}/index.json`);
    if (r.ok) index = { ...empty(), ...(await r.json()) };
  } catch {
    // no swap folder: placeholders stay
  }
  const jobs = [];
  for (const kind of ['tiles', 'pieces'])
    for (const name of index[kind]) jobs.push(load(`${BASE}/${kind}/${name}.png`).then((img) => img && (images[`${kind}/${name}`] = img)));
  await Promise.all(jobs);
}

// Await this before building tiles or starting a scene.
export const swapReady = init();

// URL for a room sprite: the swapped one when there is one, else the placeholder.
export const spriteUrl = (name, fallback) => (index.sprites.includes(name) ? `${BASE}/sprites/${name}.png` : fallback);

// Replace the frames of tiles built in code. `tiles` is the object buildTiles() returns.
export function applyTileSwap(tiles) {
  for (const name of index.tiles) {
    const t = tiles[name];
    const img = images[`tiles/${name}`];
    if (!t || !img) {
      if (!t) console.warn(`swap: no tile called "${name}"`);
      continue;
    }
    const fw = t.frames[0].width;
    const fh = t.frames[0].height;
    const n = Math.round(img.width / fw);
    if (img.height !== fh || n < 1 || img.width !== n * fw) {
      console.warn(`swap: tiles/${name}.png is ${img.width}x${img.height}; needs ${fw}x${fh} per frame, frames side by side`);
      continue;
    }
    t.frames = Array.from({ length: n }, (_, i) => {
      const c = document.createElement('canvas');
      c.width = fw;
      c.height = fh;
      c.getContext('2d').drawImage(img, i * fw, 0, fw, fh, 0, 0, fw, fh);
      return c;
    });
  }
  return tiles;
}

// A builder sheet with the swapped pieces painted over their cells. `group` is the sheet's
// group in pieces.json ({ sheet, pieces }); returns `img` untouched when nothing is swapped.
export function patchSheet(img, group) {
  const name = group.sheet.replace(/^.*\//, '').replace(/\.png$/, '');
  const hits = group.pieces.filter((p) => images[`pieces/${p.id}`]);
  if (!hits.length) return img;
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  for (const p of hits) {
    const sw = images[`pieces/${p.id}`];
    if (sw.width !== p.w || sw.height !== p.h) {
      console.warn(`swap: pieces/${p.id}.png is ${sw.width}x${sw.height}; needs ${p.w}x${p.h} (sheet ${name})`);
      continue;
    }
    ctx.clearRect(p.x, p.y, p.w, p.h);
    ctx.drawImage(sw, p.x, p.y);
  }
  return c;
}
