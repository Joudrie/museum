// Cleveland Museum of Art Open Access (CC0). No key.
// https://openaccess-api.clevelandart.org/  Hosts: openaccess-api.clevelandart.org, openaccess-cdn.clevelandart.org
import { candidate, cmFromText, getJson, sortCandidates } from './common.mjs';

export const id = 'cleveland';
export const name = 'Cleveland Museum of Art (Open Access, CC0)';
export const hosts = ['openaccess-api.clevelandart.org', 'openaccess-cdn.clevelandart.org'];
export const needsKey = false;

const BASE = 'https://openaccess-api.clevelandart.org/api/artworks';
const get = (url) => getJson(url, { source: id, interval: 500 });

/** One raw Cleveland artwork -> a candidate. */
export function parse(a) {
  const img = a.images?.web;
  const unframed = /unframed:?\s*([^;]+)/i.exec(a.measurements || '')?.[1] || a.measurements;
  const lic = a.share_license_status || '';
  return candidate({
    source: id,
    sourceId: a.id,
    title: a.title,
    maker: (a.creators || [])[0]?.description?.replace(/\s*\(.*$/, '') || '',
    year: a.creation_date,
    medium: a.technique,
    dimensions: a.measurements,
    ...cmFromText(unframed),
    imageUrl: img?.url || '',
    imageWidth: Number(img?.width) || undefined,
    imageHeight: Number(img?.height) || undefined,
    pageUrl: a.url,
    license: lic,
    publicDomain: /^cc0$/i.test(lic),
    credit: `The Cleveland Museum of Art${a.creditline ? `. ${a.creditline}` : ''}`,
    description: [a.description, a.fun_fact, a.did_you_know].filter(Boolean).join(' '),
    culture: (a.culture || []).join(', '),
    classification: a.type,
    tags: [a.department].filter(Boolean),
    texts: { tombstone: a.tombstone, funFact: a.fun_fact, didYouKnow: a.did_you_know, creators: (a.creators || []).map((c) => c.description).join('; ') },
  });
}

export async function fetch(artworkId) {
  const r = await get(`${BASE}/${encodeURIComponent(artworkId)}`);
  return parse(r.data);
}

export async function search(query, { limit = 10 } = {}) {
  const r = await get(`${BASE}/?q=${encodeURIComponent(query)}&has_image=1&cc0=1&limit=${limit}`);
  return sortCandidates((r.data || []).map(parse));
}
