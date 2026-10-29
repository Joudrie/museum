#!/usr/bin/env node
// Hosts our own copy of every painting image, so the game stops hot-linking Wikimedia.
//
//   CONTENT_CONTACT=you@example.com node tools/host_paintings.mjs [--only id,id] [--collection painting]
//
// For each `url` image: downloads the SAME picture, scales it to 1280px on the long side, writes a JPEG
// under ~500 KB to public/paintings/<slug>.jpg, and records where it came from in content/hosted-images.json.
// It never swaps a painting for a different image. Entries whose link is broken are skipped and listed
// (replacements are proposals only: content/image-proposals.md). Needs ImageMagick (`convert`).
// Pointing the data at the copies is a separate, explicit step: add --rewrite.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { list } from '../src/collections/index.js';
import { pool } from './check_images.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const MAX_BYTES = 500 * 1024;
export const LONG_SIDE = 1280;
const ua = `Curation/1.0 (${process.env.CONTENT_CONTACT || 'painting host'})`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** GET with polite retries on 429 / 5xx. Returns { status, bytes } or { error }. */
export async function download(url, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': ua }, signal: AbortSignal.timeout(60000) });
      if (res.status === 429 || res.status >= 500) {
        last = { status: res.status };
        await sleep(Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** i);
        continue;
      }
      return { status: res.status, bytes: Buffer.from(await res.arrayBuffer()) };
    } catch (e) {
      last = { error: String(e.cause?.code || e.message) };
      await sleep(2000 * 2 ** i);
    }
  }
  return last;
}

/** Scales to LONG_SIDE and steps JPEG quality down until the file fits MAX_BYTES. */
export function shrink(inFile, outFile) {
  for (const q of [88, 84, 80, 76, 72, 68, 64, 60, 55, 50]) {
    execFileSync('convert', [inFile, '-auto-orient', '-resize', `${LONG_SIDE}x${LONG_SIDE}>`, '-colorspace', 'sRGB', '-strip', '-interlace', 'Plane', '-sampling-factor', '4:2:0', '-quality', String(q), outFile]);
    const size = statSync(outFile).size;
    if (size <= MAX_BYTES) return { quality: q, bytes: size };
  }
  return { quality: 50, bytes: statSync(outFile).size, over: true };
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
  const only = arg('only')?.split(',');
  const entries = list({ collection: arg('collection') || 'painting' }).filter((e) => e.image.kind === 'url' && /^https?:/.test(e.image.src) && (!only || only.includes(e.id)));
  const outDir = join(root, 'public', 'paintings');
  const tmp = join(process.env.TMPDIR || '/tmp', 'host_paintings');
  mkdirSync(outDir, { recursive: true });
  mkdirSync(tmp, { recursive: true });
  const manifestFile = join(root, 'content', 'hosted-images.json');
  let manifest = {};
  try { manifest = JSON.parse(readFileSync(manifestFile, 'utf8')); } catch {}
  console.log(`Hosting ${entries.length} images…`);
  const rows = await pool(entries, 2, async (e) => {
    const slug = e.id.split(':')[1];
    const r = await download(e.image.src);
    if (!r || r.error || r.status !== 200) return { id: e.id, skipped: true, why: r?.error || `HTTP ${r?.status}` };
    const raw = join(tmp, `${slug}.src`);
    writeFileSync(raw, r.bytes);
    const out = shrink(raw, join(outDir, `${slug}.jpg`));
    const dim = execFileSync('identify', ['-format', '%wx%h', join(outDir, `${slug}.jpg`)]).toString();
    manifest[e.id] = { file: `paintings/${slug}.jpg`, from: e.image.src, fetched: new Date().toISOString().slice(0, 10), size: dim, bytes: out.bytes, quality: out.quality };
    return { id: e.id, ...out, size: dim };
  });
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  for (const r of rows) console.log(r.skipped ? `SKIPPED ${r.id}: ${r.why}` : `${r.id.padEnd(34)} ${r.size.padEnd(10)} ${Math.round(r.bytes / 1024)} KB q${r.quality}${r.over ? '  OVER LIMIT' : ''}`);
  console.log(`${rows.filter((r) => !r.skipped).length} hosted, ${rows.filter((r) => r.skipped).length} skipped`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
