// Wikimedia Commons: used for the paintings already in the game (their images
// come from here) and for anything a museum API doesn't have. No key, but
// Wikimedia asks for a descriptive User-Agent: set CONTENT_CONTACT to an email or URL.
// Hosts: commons.wikimedia.org, upload.wikimedia.org
import { candidate, getJson, sortCandidates } from './common.mjs';

export const id = 'commons';
export const name = 'Wikimedia Commons';
export const hosts = ['commons.wikimedia.org', 'upload.wikimedia.org', 'thumb.wikimedia.org'];
export const needsKey = false;

const API = 'https://commons.wikimedia.org/w/api.php';
const get = (url) => getJson(url, { source: id, interval: 300 });
// Commons appends machine-readable Wikidata statements to some fields ("The Horse Fair title QS:P1476,en:..."), and ObjectName/Artist arrive as html; reduce to plain text and drop them.
const clean = (v) => String(v ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').replace(/\s+(?:title|date|label|description)?\s*QS:.*$/s, '').trim();
const val = (m, k) => clean(m?.[k]?.value);

// A name that opens with a language label ("Dutch: Sterrennacht The Starry Night") is several labels run together: use the file name instead.
const fileTitle = (t) => (/^[A-Z][a-z]+: /.test(t) ? '' : t);

/** One raw Commons page (with imageinfo + extmetadata) -> a candidate. */
export function parse(page) {
  const ii = (page.imageinfo || [])[0] || {};
  const m = ii.extmetadata || {};
  const license = val(m, 'LicenseShortName') || val(m, 'UsageTerms');
  const copyrighted = String(val(m, 'Copyrighted')).toLowerCase() === 'true';
  return candidate({
    source: id,
    sourceId: page.title,
    title: fileTitle(val(m, 'ObjectName')) || String(page.title || '').replace(/^File:/, '').replace(/\.[a-z]+$/i, '').replace(/_/g, ' '),
    maker: val(m, 'Artist'),
    year: val(m, 'DateTimeOriginal') || val(m, 'DateTime'),
    medium: '',
    imageUrl: ii.thumburl || ii.url || '',
    imageWidth: ii.thumbwidth || ii.width,
    imageHeight: ii.thumbheight || ii.height,
    pageUrl: ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(String(page.title || '').replace(/ /g, '_'))}`,
    license,
    publicDomain: !copyrighted,
    credit: [val(m, 'Artist'), val(m, 'Credit'), 'via Wikimedia Commons'].filter(Boolean).join('; '),
    description: val(m, 'ImageDescription'),
    tags: val(m, 'Categories') ? String(val(m, 'Categories')).split('|') : [],
  });
}

const infoUrl = (titles) =>
  `${API}?action=query&format=json&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1280&titles=${encodeURIComponent(titles.join('|'))}`;

/** `title` is the file name, with or without "File:". */
export async function fetch(title) {
  const t = /^file:/i.test(title) ? title : `File:${title}`;
  const r = await get(infoUrl([t]));
  const page = Object.values(r.query?.pages || {})[0];
  if (!page || page.missing !== undefined) throw new Error(`Commons has no file "${t}"`);
  return parse(page);
}

export async function search(query, { limit = 10 } = {}) {
  const s = await get(`${API}?action=query&format=json&list=search&srnamespace=6&srlimit=${limit}&srsearch=${encodeURIComponent(`${query} filetype:bitmap`)}`);
  const titles = (s.query?.search || []).map((x) => x.title);
  if (!titles.length) return sortCandidates([]);
  const r = await get(infoUrl(titles));
  return sortCandidates(Object.values(r.query?.pages || {}).map(parse));
}
