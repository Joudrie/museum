// The universal collection format. Paintings, fish, minerals, fossils, coins,
// ship models: everything the museum holds is an Entry in a Collection, and
// Entries can be grouped into Sets. A new collection is a data file
// (src/collections/data/<name>.js) plus one line in index.js, no new code.
// See docs/COLLECTIONS.md.

export const RARITY = ['', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
export const DISPLAYS = ['wall', 'case', 'plinth', 'tank', 'floor'];
export const HOWS = ['bought', 'caught', 'dug', 'donated', 'gift'];
export const IMAGE_KINDS = ['url', 'sprite', 'pixels', 'procedural'];
export const LAYOUTS = ['cards', 'tiles'];
export const META_FIELDS = ['by', 'year', 'rarity', 'where'];

/**
 * @typedef {Object} Image
 * @property {'url'|'sprite'|'pixels'|'procedural'} kind
 *   url:        a picture on the web (HD paintings). Needs `src`.
 *   sprite:     a pixel-art file we ship. Needs `src`.
 *   pixels:     pixel art written as data. Needs `rows` (strings, '.' is clear)
 *               and `palette` ({ char: '#rrggbb' }).
 *   procedural: drawn by a named renderer in code. Needs `renderer`; any other
 *               keys are that renderer's parameters.
 * @property {string} [placeholder] colour shown while an image loads or if it fails
 *
 * @typedef {Object} Provenance
 * @property {'bought'|'caught'|'dug'|'donated'|'gift'} how
 * @property {string} [where]  e.g. "Skull Cove", "The pond"
 * @property {string} [story]  one line, shown when you get it
 *
 * @typedef {Object} Source
 * @property {string} license  e.g. "Public domain", "CC0", "CC-BY 4.0", "Original"
 * @property {string} credit   who to thank
 * @property {string} [url]
 *
 * @typedef {Object} Entry
 * @property {string} id           globally unique, "collection:slug"
 * @property {string} collection   the collection's id
 * @property {string} title
 * @property {string} [by]         maker or finder
 * @property {string} [makerId]    key into other systems (e.g. lines.js artists)
 * @property {string} [year]       "1889", "1852–55", "Jurassic"
 * @property {string} [era]        key into the collection's `eras`, for filtering
 * @property {string} [blurb]      short, true, curious
 * @property {string[]} [facts]    extra "rabbit hole" lines
 * @property {number} [rarity]     1 common … 5 legendary (default 1)
 * @property {string} [set]        id of a Set this entry belongs to
 * @property {string[]} [tags]
 * @property {Image} image
 * @property {number} [ratio]      width / height of the real thing (default 1)
 * @property {string[]} [display]  where it can be shown: wall, case, plinth, tank, floor
 * @property {Provenance} [provenance]
 * @property {Source} source
 * @property {number} [value]      income hint, gold per hour on display
 * @property {number} [parts]     a big find that takes this many dig spots to complete (src/dig.js counts the pieces)
 * @property {boolean} [dirty]    true: finds of this entry arrive dirty and wait for the restoration desk
 * @property {boolean} [collectable]  false for junk that is never kept (default true)
 * @property {Object} [acquire]    rules for whatever hands these out (fishing: water, time, weather, size, junk)
 *
 * @typedef {Object} CollectionDef
 * @property {string} id
 * @property {string} name          "Paintings"
 * @property {string} noun          lower-case plural for sentences: "paintings"
 * @property {string} icon          a pixel icon name from src/ui/icons.js (never an emoji)
 * @property {string[]} [kinds]     what its entries are called, e.g. ["painting"]
 * @property {string} display       default display: wall, case, plinth, tank, floor
 * @property {'all'|'earned'} ownership  'all': every entry is yours from the start; 'earned': it has to be collected
 * @property {boolean} [legacyKeys]  saves written before this format use the bare slug as the key
 * @property {Object<string,string>} [eras]  era key -> label (first key 'all' is added for you)
 * @property {string[]} [meta]      which fields to show under the title: by, year, rarity, where
 * @property {Object} [journal]     { tab, label?, order?, layout: 'cards'|'tiles', intro: "…{have} of {total}…" }
 * @property {Object} [viewer]      { look: 'wall'|'case' } how the viewer dresses the entry
 *
 * @typedef {Object} SetDef
 * @property {string} id
 * @property {string} name
 * @property {string} collection
 * @property {string[]} entries     entry ids
 * @property {{gold?: number}} [reward]
 * @property {string} [plaque]
 */

const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const COLOR = /^#[0-9a-fA-F]{3,8}$/;

/** Returns a list of problems with an entry. Never throws. */
export function validateEntry(e, collection) {
  const p = [];
  const say = (m) => p.push(`${e?.id ?? '(no id)'}: ${m}`);
  if (!isObj(e)) return ['entry is not an object'];
  if (!isStr(e.id) || !/^[a-z0-9-]+:[a-z0-9_-]+$/.test(e.id)) say('id must look like "collection:slug"');
  else if (!e.id.startsWith(`${e.collection}:`)) say(`id must start with "${e.collection}:"`);
  if (!isStr(e.collection)) say('missing collection');
  if (collection && e.collection !== collection.id) say(`belongs to "${e.collection}", not "${collection.id}"`);
  if (!isStr(e.title)) say('missing title');
  if (e.rarity !== undefined && !(Number.isInteger(e.rarity) && e.rarity >= 1 && e.rarity <= 5)) say('rarity must be 1 to 5');
  if (e.ratio !== undefined && !(typeof e.ratio === 'number' && e.ratio > 0 && Number.isFinite(e.ratio))) say('ratio must be a positive number');
  if (e.facts !== undefined && !(Array.isArray(e.facts) && e.facts.every(isStr))) say('facts must be a list of strings');
  if (e.tags !== undefined && !(Array.isArray(e.tags) && e.tags.every(isStr))) say('tags must be a list of strings');
  if (e.parts !== undefined && !(Number.isInteger(e.parts) && e.parts >= 2)) say('parts must be a whole number, 2 or more');
  if (e.dirty !== undefined && typeof e.dirty !== 'boolean') say('dirty must be true or false');
  if (e.value !== undefined && !(typeof e.value === 'number' && e.value >= 0)) say('value must be a number');
  if (collection?.eras && e.era !== undefined && !(e.era in collection.eras)) say(`era "${e.era}" is not one of the collection's eras`);
  if (e.display !== undefined && !(Array.isArray(e.display) && e.display.every((d) => DISPLAYS.includes(d)))) say(`display must be a list of ${DISPLAYS.join(', ')}`);
  if (e.provenance !== undefined && !(isObj(e.provenance) && HOWS.includes(e.provenance.how))) say(`provenance.how must be one of ${HOWS.join(', ')}`);

  const im = e.image;
  if (!isObj(im) || !IMAGE_KINDS.includes(im.kind)) say(`image.kind must be one of ${IMAGE_KINDS.join(', ')}`);
  else if (im.kind === 'url' || im.kind === 'sprite') {
    if (!isStr(im.src)) say(`image.src is needed for a ${im.kind} image`);
  } else if (im.kind === 'pixels') {
    if (!(Array.isArray(im.rows) && im.rows.length && im.rows.every(isStr))) say('pixels image needs rows');
    else if (new Set(im.rows.map((r) => r.length)).size > 1) say('pixels rows must all be the same length');
    if (!isObj(im.palette)) say('pixels image needs a palette');
    else if (Array.isArray(im.rows)) {
      const missing = [...new Set(im.rows.join('').replace(/\./g, ''))].filter((ch) => !COLOR.test(im.palette[ch] ?? ''));
      if (missing.length) say(`palette has no colour for "${missing.join('')}"`);
    }
  } else if (im.kind === 'procedural' && !isStr(im.renderer)) say('procedural image needs a renderer');
  if (isObj(im) && im.placeholder !== undefined && !COLOR.test(im.placeholder)) say('image.placeholder must be a colour');

  const s = e.source;
  if (!isObj(s)) say('missing source (license and credit)');
  else {
    if (!isStr(s.license)) say('source.license is missing');
    if (!isStr(s.credit)) say('source.credit is missing');
  }
  return p;
}

/** Returns a list of problems with a collection definition. Never throws. */
export function validateCollection(c) {
  const p = [];
  const say = (m) => p.push(`collection ${c?.id ?? '(no id)'}: ${m}`);
  if (!isObj(c)) return ['collection is not an object'];
  if (!isStr(c.id) || !/^[a-z0-9-]+$/.test(c.id)) say('id must be lower-case letters, digits and dashes');
  ['name', 'noun', 'icon'].forEach((k) => isStr(c[k]) || say(`missing ${k}`));
  if (!DISPLAYS.includes(c.display)) say(`display must be one of ${DISPLAYS.join(', ')}`);
  if (!['all', 'earned'].includes(c.ownership)) say(`ownership must be 'all' or 'earned'`);
  if (c.meta !== undefined && !(Array.isArray(c.meta) && c.meta.every((m) => META_FIELDS.includes(m)))) say(`meta must be a list of ${META_FIELDS.join(', ')}`);
  if (c.journal !== undefined) {
    if (!isObj(c.journal) || !isStr(c.journal.tab)) say('journal needs a tab');
    else if (c.journal.layout !== undefined && !LAYOUTS.includes(c.journal.layout)) say(`journal.layout must be one of ${LAYOUTS.join(', ')}`);
  }
  return p;
}

/** Returns a list of problems with a set. `has(id)` says whether an entry exists. Never throws. */
export function validateSet(s, has) {
  const p = [];
  const say = (m) => p.push(`set ${s?.id ?? '(no id)'}: ${m}`);
  if (!isObj(s)) return ['set is not an object'];
  if (!isStr(s.id)) say('missing id');
  if (!isStr(s.name)) say('missing name');
  if (!isStr(s.collection)) say('missing collection');
  if (!Array.isArray(s.entries) || !s.entries.length) say('needs entries');
  else s.entries.forEach((id) => has(id) || say(`"${id}" is not a known entry`));
  if (s.reward !== undefined && !(isObj(s.reward) && (s.reward.gold === undefined || (Number.isFinite(s.reward.gold) && s.reward.gold >= 0)))) say('reward.gold must be a number');
  return p;
}
