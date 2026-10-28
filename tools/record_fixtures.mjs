#!/usr/bin/env node
// Saves a live API response as a test fixture (run somewhere with network access):
//   node tools/record_fixtures.mjs "https://collectionapi.metmuseum.org/public/collection/v1/objects/436535" tests/fixtures/content/met-object.json
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { getJson, configure } from './sources/common.mjs';

const [url, out] = process.argv.slice(2);
if (!url || !out) (console.error('Usage: node tools/record_fixtures.mjs <url> <out.json>'), process.exit(2));
configure({ cache: false });
const json = await getJson(url, { source: 'record', interval: 1000 });
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(json, null, 2) + '\n');
console.log(`Saved ${url} to ${out}`);
