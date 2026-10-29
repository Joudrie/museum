#!/usr/bin/env node
// Applies content/rarity-proposals.json to src/collections/data/paintings.js, but ONLY once a person has
// set its "status" to "approved". Rarity is a decision (docs/CONTENT-STYLE.md), so it never applies on its own.
//
//   node tools/apply_rarity.mjs [--dry-run]
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const proposals = JSON.parse(readFileSync(join(root, 'content', 'rarity-proposals.json'), 'utf8'));
if (proposals.status !== 'approved') {
  console.error(`Not applied: content/rarity-proposals.json is "${proposals.status}". Set it to "approved" first.`);
  process.exit(1);
}
const file = join(root, 'src', 'collections', 'data', 'paintings.js');
let text = readFileSync(file, 'utf8');
let changed = 0;
const missing = [];
for (const [slug, rarity] of Object.entries(proposals.rarity)) {
  const at = text.indexOf(`id: 'painting:${slug}'`);
  if (at < 0) { missing.push(slug); continue; }
  const next = text.indexOf("id: 'painting:", at + 10);
  const block = text.slice(at, next < 0 ? undefined : next);
  const fixed = block.replace(/rarity: \d/, `rarity: ${rarity}`);
  if (fixed !== block) changed++;
  text = text.slice(0, at) + fixed + (next < 0 ? '' : text.slice(next));
}
if (!process.argv.includes('--dry-run')) writeFileSync(file, text);
console.log(`${changed} rarities changed${missing.length ? `; not in the data: ${missing.join(', ')}` : ''}${process.argv.includes('--dry-run') ? ' (dry run)' : ''}`);
