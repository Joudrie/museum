#!/usr/bin/env node
// Checks every `url` image in the collection registry: does it load, what is it,
// how big, how heavy, and does its shape match the entry's `ratio`.
//
//   node tools/check_images.mjs [--collection painting] [--only id,id] [--resource] [--out content]
//
// Writes content/image-report.json (everything) and content/image-fixes.json (only what
// needs attention). With --resource, each failing entry is searched for in the museum
// sources and the best matches are listed as candidates. Nothing is ever swapped for you.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { imageSize } from './imagesize.mjs';
import { list } from '../src/collections/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const LIMITS = { minLongSide: 800, maxBytes: 600 * 1024, ratioTolerance: 0.03 };

/** Real fetch: returns { status, contentType, bytes } or { error }. */
export async function realGet(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': `Curation/1.0 (${process.env.CONTENT_CONTACT || 'image checker'})` }, signal: AbortSignal.timeout(30000) });
    return { status: res.status, contentType: res.headers.get('content-type') || '', bytes: Buffer.from(await res.arrayBuffer()) };
  } catch (e) {
    return { error: `${e.cause?.code || e.message}` };
  }
}

/** Checks one entry. `get(url)` is injectable so tests need no network. */
export async function checkEntry(entry, get = realGet, limits = LIMITS) {
  const url = entry.image.src;
  const out = { id: entry.id, title: entry.title, url, flags: [] };
  const r = await get(url);
  if (r.error) return { ...out, status: 0, flags: ['broken'], note: `could not load: ${r.error}` };
  out.status = r.status;
  out.contentType = r.contentType;
  out.bytes = r.bytes?.length ?? 0;
  if (r.status !== 200) return { ...out, flags: ['broken'], note: `HTTP ${r.status}` };
  if (!/^image\//i.test(r.contentType)) out.flags.push('not-image');
  const size = imageSize(r.bytes);
  if (!size) {
    if (!out.flags.includes('not-image')) out.flags.push('not-image');
    return { ...out, note: 'the bytes are not a picture we can read' };
  }
  out.width = size.width;
  out.height = size.height;
  if (Math.max(size.width, size.height) < limits.minLongSide) out.flags.push('tiny');
  if (out.bytes > limits.maxBytes) out.flags.push('huge');
  if (entry.ratio) {
    const off = Math.abs(size.width / size.height - entry.ratio) / entry.ratio;
    out.ratioOff = Number((off * 100).toFixed(1));
    if (off > limits.ratioTolerance) out.flags.push('ratio');
  }
  return out;
}

/** Runs `fn` over `items`, `n` at a time. */
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

export function formatTable(rows) {
  const pad = (s, n) => String(s).padEnd(n);
  const head = `${pad('entry', 34)} ${pad('status', 6)} ${pad('size', 11)} ${pad('KB', 6)} ${pad('shape', 7)} flags`;
  const lines = rows.map((r) =>
    [pad(r.id.slice(0, 34), 34), pad(r.status || 'ERR', 6), pad(r.width ? `${r.width}x${r.height}` : '-', 11), pad(r.bytes ? Math.round(r.bytes / 1024) : '-', 6), pad(r.ratioOff !== undefined ? `${r.ratioOff}%` : '-', 7), (r.flags.length ? r.flags.join(', ') : 'ok') + (r.note ? `  (${r.note})` : '')].join(' '),
  );
  const bad = rows.filter((r) => r.flags.length).length;
  return [head, ...lines, '', `${rows.length} checked, ${rows.length - bad} fine, ${bad} need attention`].join('\n');
}

const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
/** A candidate counts as the same work if its maker shares a name word with ours and the titles overlap. */
export function sameWork(entry, c) {
  const mk = new Set(norm(entry.by || ''));
  const makerHit = !mk.size || norm(c.maker).some((w) => w.length > 2 && mk.has(w));
  const tt = norm(entry.title).filter((w) => w.length > 3);
  const titleHit = tt.length ? tt.filter((w) => norm(c.title).includes(w)).length / tt.length >= 0.5 : true;
  return makerHit && titleHit;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
  const only = arg('only')?.split(',');
  const entries = list({ collection: arg('collection') }).filter((e) => e.image.kind === 'url' && (!only || only.includes(e.id)));
  const outDir = resolve(root, arg('out') || 'content');
  console.log(`Checking ${entries.length} images…`);
  const rows = await pool(entries, 4, (e) => checkEntry(e));
  console.log(formatTable(rows));
  const bad = rows.filter((r) => r.flags.length);
  if (argv.includes('--resource') && bad.length) {
    const { searchAll } = await import('./sources/index.mjs');
    for (const r of bad) {
      const e = entries.find((x) => x.id === r.id);
      const found = await searchAll(`${e.title} ${e.by || ''}`.trim(), { limit: 5 });
      r.suggestions = found.candidates.filter((c) => sameWork(e, c)).slice(0, 3).map((c) => ({ source: c.source, sourceId: c.sourceId, title: c.title, maker: c.maker, imageUrl: c.imageUrl, pageUrl: c.pageUrl, license: c.license }));
      r.searchErrors = found.errors;
      console.log(`  ${r.id}: ${r.suggestions.length} candidate replacement(s)`);
    }
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'image-report.json'), JSON.stringify({ checked: new Date().toISOString(), limits: LIMITS, rows }, null, 2));
  writeFileSync(join(outDir, 'image-fixes.json'), JSON.stringify({ checked: new Date().toISOString(), note: 'Candidates only. Nothing is swapped automatically; review each one.', fixes: bad }, null, 2));
  console.log(`Wrote ${join(outDir, 'image-report.json')} and image-fixes.json`);
  process.exit(bad.length && !argv.includes('--allow-problems') ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
