// Art Institute of Chicago public API (CC0 for public-domain works). No key.
// https://api.artic.edu/docs/  Hosts: api.artic.edu, www.artic.edu (IIIF images)
import { candidate, getJson, sortCandidates } from './common.mjs';

export const id = 'aic';
export const name = 'Art Institute of Chicago (CC0)';
export const hosts = ['api.artic.edu', 'www.artic.edu'];
export const needsKey = false;

const BASE = 'https://api.artic.edu/api/v1';
const FIELDS = 'id,title,artist_display,artist_title,date_display,medium_display,dimensions,dimensions_detail,image_id,thumbnail,is_public_domain,credit_line,description,short_description,place_of_origin,classification_title,style_title,subject_titles,term_titles,api_link';
const get = (url) => getJson(url, { source: id, interval: 1000 });

/** One raw AIC artwork (`data`) plus the IIIF base from `config.iiif_url` -> a candidate. */
export function parse(a, iiif = 'https://www.artic.edu/iiif/2') {
  const d = (a.dimensions_detail || [])[0];
  const pd = a.is_public_domain === true;
  return candidate({
    source: id,
    sourceId: a.id,
    title: a.title,
    maker: a.artist_title || a.artist_display,
    year: a.date_display,
    medium: a.medium_display,
    dimensions: a.dimensions,
    widthCm: d?.width,
    heightCm: d?.height,
    imageUrl: a.image_id ? `${iiif}/${a.image_id}/full/1280,/0/default.jpg` : '',
    imageWidth: a.thumbnail?.width,
    imageHeight: a.thumbnail?.height,
    pageUrl: `https://www.artic.edu/artworks/${a.id}`,
    license: pd ? 'CC0' : 'Rights reserved',
    publicDomain: pd,
    credit: `Art Institute of Chicago${a.credit_line ? `. ${a.credit_line}` : ''}`,
    description: a.description || a.short_description,
    culture: a.place_of_origin,
    classification: a.classification_title,
    tags: [a.style_title, ...(a.subject_titles || []), ...(a.term_titles || [])].filter(Boolean),
    texts: { artistDisplay: a.artist_display, altText: a.thumbnail?.alt_text },
  });
}

export async function fetch(artworkId) {
  const r = await get(`${BASE}/artworks/${encodeURIComponent(artworkId)}?fields=${FIELDS}`);
  return parse(r.data, r.config?.iiif_url);
}

export async function search(query, { limit = 10 } = {}) {
  const r = await get(`${BASE}/artworks/search?q=${encodeURIComponent(query)}&limit=${limit}&fields=${FIELDS}`);
  return sortCandidates((r.data || []).filter((a) => a.image_id).map((a) => parse(a, r.config?.iiif_url)));
}
