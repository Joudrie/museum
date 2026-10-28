// Painting pool. Rooms fill every other slot from this list, in order.
// The paintings themselves are entries in the collection registry
// (src/collections/data/paintings.js); this is the shape the older code
// reads: `id` is the bare slug that saves use, `artist` keys into lines.js,
// `ratio` is width / height of the real canvas, and `entry` is the registry
// entry behind it (the viewer and journal use that).
import { list, slugOf } from './collections/index.js';

export const PAINTINGS = list({ collection: 'painting' }).map((e) => ({
  id: slugOf(e),
  title: e.title,
  by: e.by,
  artist: e.makerId,
  year: e.year,
  ratio: e.ratio,
  src: e.image.src,
  blurb: e.blurb,
  placeholder: e.image.placeholder,
  entry: e,
}));
