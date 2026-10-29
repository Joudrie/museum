#!/usr/bin/env node
// Painting of the Day content: a short, true "why it matters" for each painting, and a rotation that picks one per date.
//
//   node tools/potd.mjs build      drafts content/potd/draft.json from the review drafts (one sourced line each)
//   node tools/potd.mjs publish    writes src/collections/data/potd.json from entries a person set to "approved"
//   node tools/potd.mjs today      prints today's pick (from the published list)
//
// Every line is a claim: `why` comes from a sentence the museum wrote, and `quote` is that exact sentence
// (docs/CONTENT-STYLE.md). A painting with no quotable sentence is not listed (see `waiting` in the draft file).
// Nothing is published unless a person sets "status": "approved". The game screen that shows it belongs to Chat 13.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadReviews } from './review_report.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const WHY_MAX = 200;
const DRAFT = join(root, 'content', 'potd', 'draft.json');
const PUBLISHED = join(root, 'src', 'collections', 'data', 'potd.json');

/** The line for one review draft, or null when no museum sentence fits. Prefers a fact over the blurb. */
export function whyFor(draft) {
  const real = (draft.claims || []).filter((c) => c.quote && c.text && !c.placeholderFor);
  const fits = (c) => c.text.length <= WHY_MAX;
  const pick = real.find((c) => c.kind === 'fact' && fits(c)) || real.find((c) => c.kind === 'blurb' && fits(c));
  if (!pick) return null;
  return { why: pick.text, quote: pick.quote, field: pick.source };
}

export function buildDrafts(reviews) {
  const entries = [];
  const waiting = [];
  for (const r of reviews) {
    const w = whyFor(r);
    if (!w) { waiting.push(r.entry.id); continue; }
    entries.push({ id: r.entry.id, title: r.entry.title, by: r.entry.by || '', ...w, credit: r.entry.source?.credit || '', url: r.entry.source?.url || '', status: 'draft' });
  }
  return { about: 'Painting of the Day lines. Set status to "approved" to publish a line (node tools/potd.mjs publish). A line is a museum sentence quoted exactly.', entries, waiting };
}

/** Deterministic rotation: the same date gives the same painting everywhere; the list cycles with no repeats until it runs out. */
export function pickFor(date, entries) {
  if (!entries.length) return null;
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  return entries[((day % entries.length) + entries.length) % entries.length];
}

function main() {
  const cmd = process.argv[2];
  if (cmd === 'build') {
    const draft = buildDrafts(loadReviews(undefined).filter((r) => r.collection === 'painting' || !r.collection));
    // keep a person's decisions when rebuilding
    if (existsSync(DRAFT)) {
      const old = new Map(JSON.parse(readFileSync(DRAFT, 'utf8')).entries.map((e) => [e.id, e]));
      draft.entries = draft.entries.map((e) => (old.get(e.id)?.status === 'approved' ? old.get(e.id) : e));
    }
    mkdirSync(dirname(DRAFT), { recursive: true });
    writeFileSync(DRAFT, JSON.stringify(draft, null, 2) + '\n');
    console.log(`${draft.entries.length} lines drafted, ${draft.waiting.length} waiting for a quotable sentence`);
  } else if (cmd === 'publish') {
    const approved = JSON.parse(readFileSync(DRAFT, 'utf8')).entries.filter((e) => e.status === 'approved');
    writeFileSync(PUBLISHED, JSON.stringify({ entries: approved.map(({ status, ...e }) => e) }, null, 2) + '\n');
    console.log(`${approved.length} approved lines published to ${PUBLISHED}`);
  } else if (cmd === 'today') {
    const list = existsSync(PUBLISHED) ? JSON.parse(readFileSync(PUBLISHED, 'utf8')).entries : [];
    const p = pickFor(new Date(), list);
    console.log(p ? `${p.title}: ${p.why}` : 'Nothing approved yet.');
  } else {
    console.error('Usage: node tools/potd.mjs build | publish | today');
    process.exit(2);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
