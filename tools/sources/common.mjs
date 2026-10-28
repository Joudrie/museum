// Shared by the museum source adapters: polite fetching (rate limit, cache,
// injectable fetch for tests), the candidate shape, and the public-domain gate.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CACHE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.cache');

let fetchImpl = (...a) => globalThis.fetch(...a);
let useCache = true;
/** Tests swap in a fake fetch (and turn the cache off) so nothing touches the network. */
export function configure({ fetch, cache } = {}) {
  if (fetch) fetchImpl = fetch;
  if (cache !== undefined) useCache = cache;
}
export const doFetch = (...a) => fetchImpl(...a);

const last = new Map();
/** Waits so one source is never asked more often than every `ms`. */
export async function throttle(source, ms) {
  const wait = (last.get(source) || 0) + ms - Date.now();
  last.set(source, Math.max(Date.now(), last.get(source) || 0) + Math.max(0, ms));
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

const contact = () => process.env.CONTENT_CONTACT || 'curation-content-tool';
export const userAgent = () => `Curation/1.0 (${contact()}; museum content pipeline)`;

/** GET json, cached on disk by URL. A blocked or failing host throws a plain-English error. */
export async function getJson(url, { source, interval = 500, headers = {} } = {}) {
  const key = createHash('sha1').update(url + JSON.stringify(headers)).digest('hex');
  const file = join(CACHE_DIR, `${key}.json`);
  if (useCache && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  await throttle(source || new URL(url).host, interval);
  let res;
  try {
    res = await fetchImpl(url, { headers: { accept: 'application/json', 'user-agent': userAgent(), ...headers } });
  } catch (e) {
    const host = new URL(url).host;
    throw new Error(`could not reach ${host} (${e.cause?.code || e.message}). If this runs in a sandbox, the host may need allowing; see docs/CONTENT.md`);
  }
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status} for ${url}`);
  const json = await res.json();
  if (useCache) {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(file, JSON.stringify(json));
  }
  return json;
}

// What the sources call "free to use as we like". Anything else is rejected, with the reason.
const PD = [/^cc0\b/i, /^public domain/i, /^pdm\b/i, /^pd[- ]/i, /no known copyright/i, /^cc[- ]?zero/i];
export const isPublicDomain = (s) => typeof s === 'string' && PD.some((re) => re.test(s.trim()));

const clean = (s) => (typeof s === 'string' ? s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&rsquo;/g, '’').replace(/\s+/g, ' ').trim() : '');
export { clean };

/**
 * One artwork from any source, in one shape:
 *   source, sourceId, title, maker, year, medium, dimensions (text), widthCm, heightCm, ratio,
 *   imageUrl, imageWidth, imageHeight (when the API says), pageUrl, license (the API's exact words),
 *   publicDomain (true/false), rejected (a reason, if not usable), credit, description,
 *   culture, classification, tags, texts ({ field: text }, everything a claim may quote)
 */
export function candidate(c) {
  const widthCm = Number(c.widthCm) || undefined;
  const heightCm = Number(c.heightCm) || undefined;
  const out = {
    source: c.source,
    sourceId: String(c.sourceId),
    title: clean(c.title),
    maker: clean(c.maker),
    year: clean(c.year),
    medium: clean(c.medium),
    dimensions: clean(c.dimensions),
    widthCm,
    heightCm,
    ratio: widthCm && heightCm ? Number((widthCm / heightCm).toFixed(4)) : c.imageWidth && c.imageHeight ? Number((c.imageWidth / c.imageHeight).toFixed(4)) : undefined,
    imageUrl: c.imageUrl || '',
    imageWidth: c.imageWidth,
    imageHeight: c.imageHeight,
    pageUrl: c.pageUrl || '',
    license: clean(c.license),
    credit: clean(c.credit),
    description: clean(c.description),
    culture: clean(c.culture),
    classification: clean(c.classification),
    tags: (c.tags || []).map(clean).filter(Boolean),
  };
  out.publicDomain = !!c.publicDomain && isPublicDomain(out.license);
  out.rejected = c.rejected || rejectReason(out);
  out.texts = {
    title: out.title,
    maker: out.maker,
    year: out.year,
    medium: out.medium,
    dimensions: out.dimensions,
    culture: out.culture,
    classification: out.classification,
    credit: out.credit,
    description: out.description,
    ...Object.fromEntries(Object.entries(c.texts || {}).map(([k, v]) => [k, clean(v)])),
  };
  return out;
}

/** Why a candidate can't go in the game, or '' if it can. */
export function rejectReason(c) {
  if (!c.title) return 'no title';
  if (!c.publicDomain) return c.license ? `license is "${c.license}", not public domain / CC0` : 'the source gives no license';
  if (!c.imageUrl) return 'no image';
  if (!c.credit) return 'no credit line';
  return '';
}

/** Splits search results into usable candidates and rejected ones (with reasons). */
export function sortCandidates(list) {
  return { candidates: list.filter((c) => !c.rejected), rejected: list.filter((c) => c.rejected).map((c) => ({ source: c.source, sourceId: c.sourceId, title: c.title, reason: c.rejected })) };
}

/** Parses "12 3/4 × 16 in. (32.4 × 40.6 cm)" or "H 31.1 × W 40 cm" style text for centimetres, width first. */
export function cmFromText(text) {
  const t = String(text || '').replace(/,/g, '.');
  const cm = /\(?\s*(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*cm/i.exec(t);
  if (cm) return { heightCm: Number(cm[1]), widthCm: Number(cm[2]) }; // museums usually write height first
  return {};
}
