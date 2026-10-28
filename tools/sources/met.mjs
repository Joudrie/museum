// The Metropolitan Museum of Art, Open Access (CC0). No key.
// https://metmuseum.github.io/  Hosts: collectionapi.metmuseum.org, images.metmuseum.org
import { candidate, cmFromText, getJson, sortCandidates } from './common.mjs';

export const id = 'met';
export const name = 'The Met (Open Access, CC0)';
export const hosts = ['collectionapi.metmuseum.org', 'images.metmuseum.org'];
export const needsKey = false;

const BASE = 'https://collectionapi.metmuseum.org/public/collection/v1';
const get = (url) => getJson(url, { source: id, interval: 200 });

/** One raw Met object -> a candidate. */
export function parse(o) {
  const m = (o.measurements || []).find((x) => /overall|sheet|image/i.test(x.elementName)) || (o.measurements || [])[0];
  const dims = m?.elementMeasurements?.Width && m.elementMeasurements.Height ? { widthCm: m.elementMeasurements.Width, heightCm: m.elementMeasurements.Height } : cmFromText(o.dimensions);
  const pd = o.isPublicDomain === true;
  return candidate({
    source: id,
    sourceId: o.objectID,
    title: o.title,
    maker: o.artistDisplayName || o.culture,
    year: o.objectDate,
    medium: o.medium,
    dimensions: o.dimensions,
    ...dims,
    imageUrl: o.primaryImage || o.primaryImageSmall,
    pageUrl: o.objectURL,
    license: pd ? 'CC0' : o.rightsAndReproduction || 'Not marked public domain',
    publicDomain: pd,
    credit: o.creditLine ? `The Metropolitan Museum of Art, New York. ${o.creditLine}` : '',
    description: '', // the Met's API has no description text; claims must come from other fields or the object page
    culture: o.culture || o.period || o.dynasty,
    classification: o.classification || o.objectName,
    tags: (o.tags || []).map((t) => t.term),
    texts: { objectName: o.objectName, department: o.department, period: o.period, dynasty: o.dynasty, artistBio: o.artistDisplayBio, region: [o.country, o.region].filter(Boolean).join(', ') },
  });
}

export async function fetch(objectId) {
  return parse(await get(`${BASE}/objects/${encodeURIComponent(objectId)}`));
}

export async function search(query, { limit = 10 } = {}) {
  // /v1/search was retired 2026-10-01; /v1.1/search has the same { total, objectIDs } shape, paginated by offset and limit.
  const r = await get(`https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&isPublicDomain=true&limit=${limit}&offset=0&q=${encodeURIComponent(query)}`);
  const ids = (r.objectIDs || []).slice(0, limit);
  return sortCandidates(await Promise.all(ids.map((i) => fetch(i))));
}
