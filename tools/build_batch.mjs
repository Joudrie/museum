#!/usr/bin/env node
// Runs a batch file: for each wanted work, searches the museum sources, takes the first
// public-domain match, and writes a DRAFT review file. Nothing reaches the game.
//
//   node tools/build_batch.mjs content/batches/first-batch.json [--dry-run]
//
// A batch is { collection, items: [{ title?, maker?, query, sources?, id?, region?, note? }] }.
// With `id` and a single source, that exact object is fetched instead of searching.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildDraft, writeDraft } from './blurbs.mjs';
import { sameWork } from './check_images.mjs';

/** Finds one item's candidate. `deps` ({ SOURCES, searchAll }) is injectable for tests. */
export async function resolveItem(item, deps) {
  const { SOURCES, searchAll } = deps;
  if (item.id && item.sources?.length === 1) {
    const c = await SOURCES[item.sources[0]].fetch(item.id);
    return c.rejected ? { rejected: [{ title: c.title, reason: c.rejected }] } : { candidate: c };
  }
  const r = await searchAll(item.query, { sources: item.sources, limit: 6 });
  const probe = { title: item.title || '', by: item.maker || '' };
  const fits = r.candidates.filter((c) => c.ratio && (item.title || item.maker ? sameWork(probe, c) : true));
  return { candidate: fits[0], rejected: r.rejected, errors: r.errors, others: fits.slice(1, 4) };
}

export async function runBatch(batch, deps, { write = true, outDir } = {}) {
  const report = [];
  for (const item of batch.items) {
    const label = item.title || item.query;
    try {
      const r = await resolveItem(item, deps);
      if (!r.candidate) {
        const why = r.errors?.length ? r.errors.map((e) => `${e.source}: ${e.error}`).join('; ') : r.rejected?.length ? `only non-public-domain matches (${r.rejected[0].reason})` : 'no public-domain match with an image';
        report.push({ label, ok: false, why });
        continue;
      }
      const draft = buildDraft(r.candidate, { collection: batch.collection, rarity: item.rarity || 1 });
      draft.notes = [item.region && `region: ${item.region}`, item.note].filter(Boolean).join('. ');
      const file = write ? writeDraft(draft, outDir) : null;
      report.push({ label, ok: true, file, title: draft.entry.title, source: r.candidate.source, problems: draft.problems.length });
    } catch (e) {
      report.push({ label, ok: false, why: e.message });
    }
  }
  return report;
}

async function main() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => a.endsWith('.json'));
  if (!file) return (console.error('Usage: node tools/build_batch.mjs content/batches/<batch>.json [--dry-run]'), process.exit(2));
  const batch = JSON.parse(readFileSync(file, 'utf8'));
  const { SOURCES, searchAll } = await import('./sources/index.mjs');
  console.log(`${batch.items.length} wanted, collection "${batch.collection}"`);
  const report = await runBatch(batch, { SOURCES, searchAll }, { write: !argv.includes('--dry-run') });
  report.forEach((r) => console.log(r.ok ? `  ✓ ${r.label} → ${r.title} (${r.source}, ${r.problems} problem(s) to review)` : `  ✗ ${r.label}: ${r.why}`));
  const ok = report.filter((r) => r.ok).length;
  console.log(`\n${ok} drafted, ${report.length - ok} not found. Next: node tools/review_report.mjs`);
  process.exit(ok === report.length ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => (console.error(e.message), process.exit(1)));
