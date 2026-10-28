// Smithsonian Open Access (CC0 media). Needs a free api.data.gov key in SI_API_KEY.
// https://edan.si.edu/openaccess/apidocs/  Hosts: api.si.edu, ids.si.edu
// The response shape here follows the API docs; check it on the first live run.
import { candidate, cmFromText, getJson, sortCandidates } from './common.mjs';

export const id = 'smithsonian';
export const name = 'Smithsonian Open Access (CC0)';
export const hosts = ['api.si.edu', 'ids.si.edu'];
export const needsKey = true;

const BASE = 'https://api.si.edu/openaccess/api/v1.0';
const get = (url) => getJson(url, { source: id, interval: 1000 });
const key = () => {
  if (!process.env.SI_API_KEY) throw new Error('Smithsonian needs a free key: get one at https://api.data.gov/signup/ and set SI_API_KEY');
  return encodeURIComponent(process.env.SI_API_KEY);
};
const free = (row, label) => (row.content?.freetext?.[label] || []).map((x) => x.content).filter(Boolean);
const named = (row, ...labels) => (row.content?.freetext?.notes || []).filter((n) => labels.includes(n.label)).map((n) => n.content);

/** One raw Smithsonian record (a search row or `response` of /content) -> a candidate. */
export function parse(row) {
  const dnr = row.content?.descriptiveNonRepeating || {};
  const media = (dnr.online_media?.media || []).find((m) => /image/i.test(m.type)) || {};
  const access = media.usage?.access || '';
  const dims = free(row, 'physicalDescription').join(' ');
  const name0 = (row.content?.freetext?.name || [])[0]?.content || '';
  return candidate({
    source: id,
    sourceId: row.id,
    title: dnr.title?.content || row.title,
    maker: name0.replace(/,?\s*\d{4}.*$/, ''),
    year: free(row, 'date').join('; '),
    medium: free(row, 'physicalDescription').join('; '),
    dimensions: dims,
    ...cmFromText(dims),
    imageUrl: media.content ? `${media.content}${media.content.includes('?') ? '&' : '?'}max=1280` : '',
    pageUrl: dnr.record_link || '',
    license: access,
    publicDomain: /^cc0$/i.test(access),
    credit: `${dnr.data_source || 'Smithsonian Institution'}${free(row, 'creditLine')[0] ? `. ${free(row, 'creditLine')[0]}` : ''}`,
    description: named(row, 'Summary', 'Description', 'Brief Description').join(' '),
    culture: free(row, 'place').join(', '),
    classification: row.content?.indexedStructured?.object_type?.[0] || '',
    tags: row.content?.indexedStructured?.topic || [],
  });
}

export async function fetch(recordId) {
  const r = await get(`${BASE}/content/${encodeURIComponent(recordId)}?api_key=${key()}`);
  return parse(r.response);
}

export async function search(query, { limit = 10 } = {}) {
  const q = encodeURIComponent(`${query} AND online_media_type:"Images" AND media_usage:"CC0"`);
  const r = await get(`${BASE}/search?q=${q}&rows=${limit}&api_key=${key()}`);
  return sortCandidates((r.response?.rows || []).map(parse));
}
