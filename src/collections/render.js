// Pictures of entries. 'pixels' art comes straight from the entry's rows and
// palette; 'procedural' art is drawn by a named renderer; 'url' and 'sprite'
// images are plain <img>s with a coloured placeholder behind them.
import { fishPixels } from './fishart.js';

const RENDERERS = {
  // each renderer: (image, scale) -> canvas
  fish(image, scale) {
    const W = 26;
    const H = 16;
    const cv = document.createElement('canvas');
    cv.width = W * scale;
    cv.height = H * scale;
    const g = cv.getContext('2d');
    fishPixels(image, W, H).forEach((row, y) =>
      row.forEach((c, x) => {
        if (!c) return;
        g.fillStyle = c;
        g.fillRect(x * scale, y * scale, scale, scale);
      }),
    );
    return cv;
  },
};

/** Lets a collection bring its own way of drawing without touching this file. */
export function registerRenderer(name, fn) {
  RENDERERS[name] = fn;
}

function drawPixels({ rows, palette }, scale) {
  const cv = document.createElement('canvas');
  cv.width = rows[0].length * scale;
  cv.height = rows.length * scale;
  const g = cv.getContext('2d');
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch === '.' || !palette[ch]) return;
      g.fillStyle = palette[ch];
      g.fillRect(x * scale, y * scale, scale, scale);
    }),
  );
  return cv;
}

/** A canvas for entries drawn from data or code, or null for picture files. */
export function drawEntry(entry, scale = 4) {
  const im = entry.image;
  if (im.kind === 'pixels') return drawPixels(im, scale);
  if (im.kind === 'procedural' && RENDERERS[im.renderer]) return RENDERERS[im.renderer](im, scale);
  return null;
}

/** A dark silhouette for entries you haven't collected yet. */
export function drawShadow(entry, scale = 3) {
  const cv = drawEntry(entry, scale);
  if (!cv) return cv;
  const g = cv.getContext('2d');
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = 'rgba(20, 16, 14, 0.55)';
  g.fillRect(0, 0, cv.width, cv.height);
  return cv;
}

/** Fills `box` with the entry's picture: a canvas for drawn art, an <img> for files. */
export function fillPicture(box, entry, { scale = 4, shadow = false } = {}) {
  const im = entry.image;
  const cv = shadow ? drawShadow(entry, scale) : drawEntry(entry, scale);
  if (cv) {
    cv.className = 'pix';
    box.replaceChildren(cv);
    return;
  }
  const img = document.createElement('img');
  img.alt = '';
  img.loading = 'lazy';
  img.draggable = false;
  img.onerror = () => img.remove();
  img.src = im.src;
  if (im.placeholder) box.style.background = im.placeholder;
  box.replaceChildren(img);
}
