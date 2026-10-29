// Usage: node tools/telemetry_report.mjs events.json   (an array of { install, t, name, props }; in the
// game, run copy(JSON.stringify(__exportTelemetry())) in the console and paste it into a file)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { report } = await import(path.join(root, 'src/progression/report.js'));
const file = process.argv[2];
if (!file) {
  console.log('usage: node tools/telemetry_report.mjs events.json');
  process.exit(1);
}
console.log(JSON.stringify(report(JSON.parse(fs.readFileSync(file, 'utf8'))), null, 2));
