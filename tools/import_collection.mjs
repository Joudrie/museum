#!/usr/bin/env node
// Turns a spreadsheet of rows into a collection data file.
//
//   node tools/import_collection.mjs rows.csv --collection fossil --name Fossils \
//        --noun fossils --icon 🦴 --display case [--ownership earned] [--out path]
//
// rows.csv (or rows.json: a list of objects) has one row per entry. Columns:
//   slug*, title*, license*, credit*      (* required: the tool stops without them)
//   by, year, era, blurb, facts (use | between lines), rarity (1-4), tags (|),
//   image_kind (url | sprite | pixels | procedural; default url), image_src,
//   placeholder (a colour), ratio, display (|), how (bought | caught | dug |
//   donated | gift), where, story, source_url, value, set (set id)
// Pixels and procedural images carry data a spreadsheet can't hold well; write
// those entries by hand in the data file (see src/collections/data/minerals.js).
//
// Output goes to src/collections/data/<collection>.js. Add one line to
// src/collections/index.js to register it. Problems are listed all at once and
// nothing is written until there are none.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { js } from './collection_io.mjs';
import { validateCollection, validateEntry } from '../src/collections/schema.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[++i];
    else out._.push(argv[i]);
  }
  return out;
}

// A small CSV reader: quoted fields, doubled quotes, commas and line breaks inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') (row.push(cell), (cell = ''));
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== '')) rows.push(row);
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

const list = (v) => (Array.isArray(v) ? v : String(v ?? '').split('|').map((x) => x.trim()).filter(Boolean));

export function rowToEntry(r, collection) {
  const slug = String(r.slug ?? '').trim();
  const kind = r.image_kind || 'url';
  const e = {
    id: `${collection}:${slug}`,
    collection,
    title: r.title,
    ...(r.by && { by: r.by }),
    ...(r.year && { year: r.year }),
    ...(r.era && { era: r.era }),
    ...(r.blurb && { blurb: r.blurb }),
    ...(list(r.facts).length && { facts: list(r.facts) }),
    rarity: r.rarity ? Number(r.rarity) : 1,
    ...(r.set && { set: r.set }),
    ...(list(r.tags).length && { tags: list(r.tags) }),
    image: { kind, ...(r.image_src && { src: r.image_src }), ...(r.placeholder && { placeholder: r.placeholder }) },
    ...(r.ratio && { ratio: Number(r.ratio) }),
    ...(list(r.display).length && { display: list(r.display) }),
    ...(r.how && { provenance: { how: r.how, ...(r.where && { where: r.where }), ...(r.story && { story: r.story }) } }),
    source: { license: r.license, credit: r.credit, ...(r.source_url && { url: r.source_url }) },
    ...(r.value && { value: Number(r.value) }),
  };
  return e;
}

/** Builds the pack and returns { pack, problems }. Exported so the test can use it. */
export function buildPack(rows, def) {
  const problems = [];
  const collection = {
    id: def.collection,
    name: def.name,
    noun: def.noun || def.name?.toLowerCase(),
    icon: def.icon,
    kinds: [def.collection],
    display: def.display || 'case',
    ownership: def.ownership || 'earned',
    meta: ['rarity'],
    journal: { tab: def.collection, label: def.name, order: 50, layout: 'tiles', intro: `{have} of {total} ${def.noun || def.name?.toLowerCase()} found.` },
    viewer: { look: 'case' },
  };
  validateCollection(collection).forEach((p) => problems.push(p));
  const seen = new Set();
  const entries = rows.map((r, i) => {
    const label = `row ${i + 2} (${r.slug || r.title || 'no slug'})`;
    if (!String(r.slug ?? '').trim()) problems.push(`${label}: slug is missing`);
    if (seen.has(r.slug)) problems.push(`${label}: slug is used twice`);
    seen.add(r.slug);
    const e = rowToEntry(r, def.collection);
    validateEntry(e, collection).forEach((p) => problems.push(`${label}: ${p.replace(/^[^:]*: /, '')}`));
    return e;
  });
  return { pack: { collection, sets: [], entries }, problems };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args._[0];
  if (!file || !args.collection || !args.name) {
    console.error('Usage: node tools/import_collection.mjs rows.csv --collection <id> --name <Name> [--noun x] [--icon x] [--display case] [--ownership earned] [--out path]');
    process.exit(2);
  }
  const text = readFileSync(file, 'utf8');
  const rows = file.endsWith('.json') ? JSON.parse(text) : parseCsv(text);
  const { pack, problems } = buildPack(rows, args);
  if (problems.length) {
    console.error(`Not written. ${problems.length} problem(s):`);
    problems.forEach((p) => console.error('  ✗ ' + p));
    process.exit(1);
  }
  const out = args.out || join(root, 'src', 'collections', 'data', `${args.collection}.js`);
  writeFileSync(out, `// ${args.name}: imported from ${file.split('/').pop()} by tools/import_collection.mjs.\n// Edit freely; add sets and richer images by hand.\nexport default ${js(pack, 0)};\n`);
  console.log(`Wrote ${pack.entries.length} entries to ${out}`);
  console.log(`Now add it to src/collections/index.js:\n  import ${args.collection} from './data/${args.collection}.js';  // and put it in PACKS`);
  console.log('Credits: every entry carries its license and credit; add the pack to CREDITS.md.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
