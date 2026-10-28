#!/usr/bin/env node
// Prints what a human needs to approve each draft: the picture, the blurb, every claim
// next to the sentence it came from, the license, and what is still wrong.
//
//   node tools/review_report.mjs [--collection painting] [--status draft|approved|rejected|all] [--html out.html]
//
// To approve an entry, open its file in content/review/<collection>/ and change
// "status": "draft" to "approved" (the problems list must be empty; publish re-checks).
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDraft } from './blurbs.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function loadReviews(dir = join(root, 'content', 'review'), collection) {
  if (!existsSync(dir)) return [];
  const cols = collection ? [collection] : readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  return cols.flatMap((c) =>
    existsSync(join(dir, c))
      ? readdirSync(join(dir, c)).filter((f) => f.endsWith('.json')).map((f) => ({ file: join(dir, c, f), ...JSON.parse(readFileSync(join(dir, c, f), 'utf8')) }))
      : [],
  );
}

export function renderEntry(d, { existing } = {}) {
  const e = d.entry;
  const c = d.candidate || {};
  const problems = checkDraft(d, existing ? { existing } : undefined);
  const out = [
    `■ ${e.title}${e.by ? ` — ${e.by}` : ''}${e.year ? `, ${e.year}` : ''}   [${d.status}]   ${e.id}`,
    `  image:   ${e.image?.src || '(none)'}`,
    `  page:    ${e.source?.url || '(none)'}`,
    `  license: ${e.source?.license || '(none)'}   credit: ${e.source?.credit || '(none)'}`,
    `  era ${e.era || '?'} · rarity ${e.rarity} · ratio ${e.ratio || '?'} · tags ${(e.tags || []).join(', ') || '-'}`,
    `  blurb (${(e.blurb || '').length}/220): ${e.blurb || '(none)'}`,
  ];
  (d.claims || []).forEach((k, i) => out.push(`  claim ${i + 1} [${k.kind}] from ${k.source}:`, `     says:  ${k.text}`, `     quote: ${k.quote}`));
  out.push(problems.length ? `  PROBLEMS (${problems.length}):` : '  problems: none', ...problems.map((p) => `   - ${p}`));
  if (d.notes) out.push(`  notes: ${d.notes}`);
  return out.join('\n');
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** A single page to look through on a phone. */
export function renderHtml(drafts) {
  const cards = drafts.map((d) => {
    const e = d.entry;
    const problems = checkDraft(d);
    return `<article><img src="${esc(e.image?.src)}" alt="" loading="lazy"><h2>${esc(e.title)}</h2><p class="m">${esc([e.by, e.year, d.status].filter(Boolean).join(' · '))}</p><p>${esc(e.blurb)}</p>
${(d.claims || []).map((k) => `<blockquote><b>${esc(k.kind)}</b> ${esc(k.text)}<br><small>“${esc(k.quote)}” — ${esc(k.source)}</small></blockquote>`).join('')}
<p class="m">${esc(e.source?.license)} · <a href="${esc(e.source?.url)}">${esc(e.source?.credit)}</a></p>
${problems.length ? `<ul class="bad">${problems.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>` : '<p class="ok">No problems</p>'}</article>`;
  });
  return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Content review</title><style>body{font:16px system-ui;margin:0;padding:12px;background:#1d1714;color:#f4ead8}article{background:#2a211c;border-radius:10px;padding:12px;margin:0 0 14px}img{width:100%;border-radius:6px}h2{margin:.5em 0 0}.m{opacity:.7;font-size:14px}blockquote{margin:8px 0;padding:6px 10px;border-left:3px solid #c9a23f;background:#1d1714}small{opacity:.75}.bad{color:#ff9c8a}.ok{color:#8fd19e}a{color:#e8c867}</style>${cards.join('')}`;
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
  const status = arg('status') || 'draft';
  const all = loadReviews(undefined, arg('collection')).filter((d) => status === 'all' || d.status === status);
  if (!all.length) return console.log(`Nothing with status "${status}" in content/review.`);
  console.log(all.map((d) => renderEntry(d)).join('\n\n'));
  const bad = all.filter((d) => checkDraft(d).length).length;
  console.log(`\n${all.length} entries, ${all.length - bad} clean, ${bad} with problems`);
  if (arg('html')) {
    writeFileSync(arg('html'), renderHtml(all));
    console.log(`Wrote ${arg('html')}`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
