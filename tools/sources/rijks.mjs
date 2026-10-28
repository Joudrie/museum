// Rijksmuseum. Needs a free key in RIJKS_API_KEY (https://www.rijksmuseum.nl/en/rijksstudio, "Advanced").
// This follows the documented collection API; the museum has been moving to
// data.rijksmuseum.nl, so check the shape on the first live run (docs/CONTENT.md).
// Hosts: www.rijksmuseum.nl, lh3.googleusercontent.com (images)
import { candidate, getJson, sortCandidates } from './common.mjs';

export const id = 'rijks';
export const name = 'Rijksmuseum (public domain)';
export const hosts = ['www.rijksmuseum.nl', 'lh3.googleusercontent.com'];
export const needsKey = true;

const BASE = 'https://www.rijksmuseum.nl/api/en/collection';
const get = (url) => getJson(url, { source: id, interval: 500 });
const key = () => {
  if (!process.env.RIJKS_API_KEY) throw new Error('Rijksmuseum needs a free key: set RIJKS_API_KEY (see docs/CONTENT.md)');
  return encodeURIComponent(process.env.RIJKS_API_KEY);
};
const dim = (a, type) => Number((a.dimensions || []).find((d) => d.type === type && /^cm$/i.test(d.unit))?.value) || undefined;
const sized = (url, px = 1280) => (url ? `${url.replace(/=s\d+$/, '')}=s${px}` : '');

/** One raw Rijksmuseum `artObject` (detail or list row) -> a candidate. */
export function parse(a) {
  const holder = a.copyrightHolder;
  return candidate({
    source: id,
    sourceId: a.objectNumber,
    title: a.title,
    maker: a.principalOrFirstMaker || a.principalMaker,
    year: a.dating?.presentingDate,
    medium: a.physicalMedium || (a.materials || []).join(', '),
    dimensions: a.subTitle,
    widthCm: dim(a, 'width'),
    heightCm: dim(a, 'height'),
    imageUrl: sized(a.webImage?.url),
    imageWidth: a.webImage?.width,
    imageHeight: a.webImage?.height,
    pageUrl: a.links?.web || `https://www.rijksmuseum.nl/en/collection/${a.objectNumber}`,
    license: holder ? `Copyright: ${holder}` : 'Public domain',
    publicDomain: !holder,
    credit: `Rijksmuseum, Amsterdam${a.acquisition?.creditLine ? `. ${a.acquisition.creditLine}` : ''}`,
    description: a.plaqueDescriptionEnglish || a.label?.description || a.description,
    classification: (a.objectTypes || []).join(', '),
    tags: a.objectCollection || [],
    texts: { subTitle: a.subTitle, label: a.label?.description },
  });
}

export async function fetch(objectNumber) {
  const r = await get(`${BASE}/${encodeURIComponent(objectNumber)}?key=${key()}&format=json`);
  return parse(r.artObject);
}

export async function search(query, { limit = 10 } = {}) {
  const r = await get(`${BASE}?key=${key()}&format=json&imgonly=true&ps=${limit}&q=${encodeURIComponent(query)}`);
  const ids = (r.artObjects || []).map((o) => o.objectNumber);
  return sortCandidates(await Promise.all(ids.map((i) => fetch(i))));
}
