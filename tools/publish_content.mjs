#!/usr/bin/env node
// Turns APPROVED review files into the collection's data file, and keeps CREDITS.md current.
//
//   node tools/publish_content.mjs --collection painting [--dry-run] [--remove id,id] [--no-credits]
//
// Only entries whose review file says "status": "approved" are exported, and each one is
// re-checked first (schema, license, sources, no duplicates). Nothing already published is ever
// removed unless you name it in --remove; entries that look dropped are reported.
// It only rewrites data files marked "// @generated-by tools/publish_content.mjs".
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { js } from './collection_io.mjs';
import { checkDraft } from './blurbs.mjs';
import { loadReviews } from './review_report.mjs';
import { validateEntry, validateSet } from '../src/collections/schema.js';
import { collections, list } from '../src/collections/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const MARKER = '// @generated-by tools/publish_content.mjs';

/** Only approved entries get through. Anything else is reported with its status. */
export function selectApproved(drafts) {
  return { approved: drafts.filter((d) => d.status === 'approved'), others: drafts.filter((d) => d.status !== 'approved') };
}

/** Works out the new entry list. Pure: returns what would change and anything that blocks it. */
export function plan({ pack, drafts, remove = [], existing }) {
  const { approved, others } = selectApproved(drafts);
  const blockers = [];
  const bad = [];
  approved.forEach((d) => {
    const others2 = (existing || list({ all: true })).filter((x) => x.id !== d.entry.id);
    checkDraft(d, { existing: others2 }).forEach((m) => bad.push(`${d.entry.id}: ${m}`));
  });
  if (bad.length) blockers.push(...bad);
  const byId = new Map(pack.entries.map((e) => [e.id, e]));
  const added = [];
  const changed = [];
  approved.forEach((d) => {
    const next = d.entry;
    const prev = byId.get(next.id);
    if (!prev) added.push(next.id);
    else if (JSON.stringify(prev) !== JSON.stringify(next)) changed.push(next.id);
    byId.set(next.id, next);
  });
  const unknown = remove.filter((id) => !byId.has(id));
  if (unknown.length) blockers.push(`--remove names entries that don't exist: ${unknown.join(', ')}`);
  remove.forEach((id) => byId.delete(id));
  // published entries whose review file is no longer approved: they stay, but say so
  const warnings = others.filter((d) => byId.has(d.entry?.id) && !remove.includes(d.entry.id)).map((d) => `${d.entry.id} is published but its review file is "${d.status}". It stays until you pass --remove ${d.entry.id}`);
  const entries = [...byId.values()];
  const setErrors = (pack.sets || []).flatMap((s) => validateSet(s, (id) => byId.has(id)));
  if (setErrors.length) blockers.push(...setErrors.map((m) => `${m} (use a hand edit or keep the entry)`));
  entries.forEach((e) => validateEntry(e, pack.collection).forEach((m) => blockers.push(m)));
  return { entries, added, changed, removed: remove.filter((id) => !unknown.includes(id)), warnings, blockers, skipped: others.map((d) => `${d.entry?.id} (${d.status})`) };
}

export function creditsTable(entries) {
  const rows = entries
    .filter((e) => e.source && !/^original$/i.test(e.source.license))
    .map((e) => `| ${e.collection} | ${e.source.url ? `[${e.title}](${e.source.url})` : e.title} | ${(e.by || '').replace(/\|/g, '/')} | ${e.source.license} | ${e.source.credit.replace(/\|/g, '/')} |`);
  return ['| Collection | Piece | Maker | License | Credit |', '|---|---|---|---|---|', ...rows].join('\n');
}

export const CREDITS_BEGIN = '<!-- content:begin (written by tools/publish_content.mjs; do not edit between the markers) -->';
export const CREDITS_END = '<!-- content:end -->';
export function spliceCredits(md, table) {
  const block = `${CREDITS_BEGIN}\n## Collection images\n\nPaintings and other pieces shown in the game, with their licenses.\n\n${table}\n${CREDITS_END}`;
  const a = md.indexOf('<!-- content:begin');
  const b = md.indexOf(CREDITS_END);
  if (a >= 0 && b > a) return md.slice(0, a) + block + md.slice(b + CREDITS_END.length);
  return `${md.replace(/\s*$/, '')}\n\n${block}\n`;
}

/** The data file whose pack is this collection (file names don't have to match ids: paintings.js holds "painting"). */
export async function findDataFile(col, dir = join(root, 'src', 'collections', 'data')) {
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.js'))) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    if ([mod.default].flat().some((p) => p?.collection?.id === col)) return join(dir, f);
  }
  return null;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
  const col = arg('collection');
  if (!col) return (console.error('Usage: node tools/publish_content.mjs --collection <id> [--dry-run] [--remove id,id] [--no-credits]'), process.exit(2));
  const file = await findDataFile(col);
  if (!file) return (console.error(`No data file holds the collection "${col}". Create it first (tools/import_collection.mjs).`), process.exit(1));
  const text = readFileSync(file, 'utf8');
  if (!text.includes(MARKER)) return (console.error(`${file} is hand-written (it has no "${MARKER}" line), so it is not rewritten. Add the approved entries by hand.`), process.exit(1));
  const mod = await import(pathToFileURL(file).href);
  const pack = [mod.default].flat().find((p) => p.collection.id === col);
  const drafts = loadReviews(undefined, col);
  const r = plan({ pack, drafts, remove: (arg('remove') || '').split(',').filter(Boolean) });
  console.log(`${drafts.length} review file(s): ${r.added.length} to add, ${r.changed.length} to update, ${r.removed.length} to remove`);
  r.skipped.forEach((s) => console.log(`  not exported: ${s}`));
  r.warnings.forEach((w) => console.log(`  ! ${w}`));
  if (r.blockers.length) {
    console.error(`Not written. ${r.blockers.length} problem(s):`);
    r.blockers.forEach((b) => console.error('  ✗ ' + b));
    process.exit(1);
  }
  if (!r.added.length && !r.changed.length && !r.removed.length) return console.log('Nothing to publish.');
  if (argv.includes('--dry-run')) return console.log('Dry run: nothing written.');
  const head = text.split('\n').filter((l) => l.startsWith('//')).join('\n');
  writeFileSync(file, `${head}\nexport default ${js({ ...pack, entries: r.entries }, 0)};\n`);
  console.log(`Wrote ${r.entries.length} entries to ${file}`);
  if (!argv.includes('--no-credits')) {
    const others = collections().filter((c) => c.id !== col).flatMap((c) => list({ collection: c.id, all: true }));
    const credits = join(root, 'CREDITS.md');
    writeFileSync(credits, spliceCredits(readFileSync(credits, 'utf8'), creditsTable([...others, ...r.entries])));
    console.log('Updated CREDITS.md');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => (console.error(e.message), process.exit(1)));
