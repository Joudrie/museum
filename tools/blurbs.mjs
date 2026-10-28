#!/usr/bin/env node
// Turns a museum candidate into a draft entry for review. It never invents anything:
// the blurb and facts are built from CLAIMS, and every claim carries the exact sentence
// it came from ("quote") and which field that was. A claim whose quote isn't in the
// source is flagged. Anything the source can't back is left blank.
//
//   node tools/blurbs.mjs --source met --id 436535 [--collection painting] [--rarity 2] [--out content/review]
//   node tools/blurbs.mjs --from candidate.json ...        (a saved candidate)
//   node tools/blurbs.mjs --check content/review/painting/foo.json ...   (rebuild blurb from claims, re-check)
//
// Style: docs/CONTENT-STYLE.md. Review: tools/review_report.mjs.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEntry } from '../src/collections/schema.js';
import { collection as getCollection, list } from '../src/collections/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export const LIMITS = { blurb: 220, fact: 200, facts: 3 };
const FILLER = /\b(masterpiece|iconic|famous|renowned|stunning|breathtaking|beautiful|magnificent|timeless|genius|legendary|must-see|world-class|extraordinary)\b/i;
const HOOKS = /\b(first|only|oldest|largest|smallest|last|painted|carved|printed|commissioned|because|hidden|survived|stolen|lost|restored|rediscovered|nearly|never|forgot|ordered|secret|learned|invented|discovered)\b/i;

const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[“”„"]/g, '"').replace(/[‘’`]/g, "'").replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();

export const slugify = (s) => fold(s).replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

/** Which text field of the candidate contains this quote (ignoring case, accents, curly quotes), or null. */
export function findQuote(quote, texts) {
  const q = fold(quote);
  if (q.length < 12) return null; // too short to prove anything
  return Object.keys(texts).find((k) => fold(texts[k]).includes(q)) || null;
}

export function sentences(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z“"‘'(])/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 25);
}

const numbersIn = (s) => (String(s).match(/\d[\d,.]*/g) || []).map((n) => n.replace(/[,.]+$/, '').replace(/,/g, ''));

function score(s) {
  if (FILLER.test(s)) return -10;
  let v = 0;
  if (/\b(1[0-9]{3}|20[0-2][0-9])\b|\d/.test(s)) v += 2;
  if (HOOKS.test(s)) v += 2;
  if (/\b[A-Z][a-z]+ [A-Z][a-z]+/.test(s.slice(1))) v += 1; // names someone
  if (s.length >= 50 && s.length <= 190) v += 1;
  if (/^(this|it|the work|the painting)\b/i.test(s)) v -= 1; // leans on a title we don't show
  return v;
}

/** The sentences a claim may be drawn from, with the field each came from. */
function pool(c) {
  const fields = ['description', 'funFact', 'didYouKnow', 'label', 'altText'];
  return fields.flatMap((f) => sentences(c.texts?.[f] ?? (f === 'description' ? c.description : '')).map((text) => ({ text, field: f })));
}

export function pickClaims(c) {
  const ranked = pool(c)
    .map((p) => ({ ...p, v: score(p.text) }))
    .filter((p) => p.v > 0)
    .sort((a, b) => b.v - a.v);
  const claims = [];
  const blurb = ranked.find((p) => p.text.length <= LIMITS.blurb);
  if (blurb) claims.push({ kind: 'blurb', text: blurb.text, quote: blurb.text, source: blurb.field });
  ranked
    .filter((p) => p !== blurb && p.text.length <= LIMITS.fact)
    .slice(0, LIMITS.facts)
    .forEach((p) => claims.push({ kind: 'fact', text: p.text, quote: p.text, source: p.field }));
  return claims;
}

const year4 = (s) => Number(/\b(\d{4})\b/.exec(s || '')?.[1]) || (/(\d{1,2})(?:st|nd|rd|th)[ -]century/i.exec(s || '') ? (Number(/(\d{1,2})(?:st|nd|rd|th)[ -]century/i.exec(s)[1]) - 1) * 100 + 50 : 0);
/** Era keys follow the paintings collection (date buckets, not styles). */
export function eraFor(year) {
  const y = year4(year);
  if (!y) return undefined;
  return y < 1600 ? 'renaissance' : y < 1750 ? 'baroque' : y < 1860 ? 'romantic' : y < 1900 ? 'impressionist' : 'modern';
}

const WORDS = [['woodblock', 'woodblock print'], ['ukiyo', 'ukiyo-e'], ['scroll', 'scroll'], ['miniature', 'miniature'], ['watercolor', 'watercolor'], ['watercolour', 'watercolor'], ['oil on', 'oil'], ['tempera', 'tempera'], ['ink', 'ink'], ['fresco', 'fresco'], ['pastel', 'pastel'], ['gouache', 'gouache'], ['portrait', 'portrait'], ['landscape', 'landscape'], ['still life', 'still life']];
export function tagsFor(c) {
  const hay = fold([c.medium, c.title, c.classification, ...c.tags].join(' '));
  const t = [c.culture && fold(c.culture).split(/[,;]/)[0].trim(), ...WORDS.filter(([k]) => hay.includes(k)).map(([, v]) => v)];
  return [...new Set(t.filter(Boolean))].slice(0, 6);
}

/** A draft review file for a candidate. */
export function buildDraft(c, { collection = 'painting', rarity = 1 } = {}) {
  const slug = slugify(`${c.title}${c.maker ? ` ${c.maker.split(/[ ,]/)[0]}` : ''}`) || slugify(c.sourceId);
  const claims = pickClaims(c);
  if (!claims.some((k) => k.kind === 'blurb')) {
    // No usable sentence in the source: fall back to what the record itself states, and flag it.
    const plain = [c.maker && `By ${c.maker}`, c.year, c.medium].filter(Boolean).join(', ');
    if (plain) claims.push({ kind: 'blurb', text: `${plain}.`, quote: plain, source: 'record', placeholderFor: 'needs a real hook' });
  }
  const draft = {
    status: 'draft',
    collection,
    slug,
    notes: '',
    entry: {
      id: `${collection}:${slug}`,
      collection,
      title: c.title,
      ...(c.maker && { by: c.maker }),
      ...(c.year && { year: c.year }),
      ...(eraFor(c.year) && { era: eraFor(c.year) }),
      ...(c.ratio && { ratio: c.ratio }),
      blurb: '',
      rarity,
      tags: tagsFor(c),
      image: { kind: 'url', src: c.imageUrl, placeholder: '#6a6458' },
      display: ['wall'],
      provenance: { how: 'gift' },
      source: { license: c.license, credit: c.credit, ...(c.pageUrl && { url: c.pageUrl }) },
      value: 5,
    },
    candidate: c,
    claims,
    problems: [],
  };
  return syncDraft(draft);
}

/** Rebuilds the entry's blurb and facts from its claims, then re-checks. Call after editing claims. */
export function syncDraft(d) {
  d.entry.blurb = d.claims.filter((k) => k.kind === 'blurb').map((k) => k.text).join(' ');
  const facts = d.claims.filter((k) => k.kind === 'fact').map((k) => k.text);
  if (facts.length) d.entry.facts = facts;
  else delete d.entry.facts;
  d.problems = checkDraft(d);
  return d;
}

/** Everything wrong with a draft, as plain sentences. Empty means ready for a human to approve. */
export function checkDraft(d, { existing = list({ all: true }) } = {}) {
  const p = [];
  const c = d.candidate || {};
  const e = d.entry || {};
  const col = getCollection(d.collection);
  if (!col) p.push(`unknown collection "${d.collection}"`);
  validateEntry(e, col).forEach((m) => p.push(`schema: ${m.replace(/^[^:]*: /, '')}`));
  if (c.publicDomain !== true) p.push(`not public domain: ${c.rejected || c.license || 'no license'}`);
  if (!c.texts) p.push('no source texts saved; re-run the draft');
  const blurbs = (d.claims || []).filter((k) => k.kind === 'blurb');
  if (!blurbs.length || !e.blurb) p.push('no blurb: the source had nothing usable, so write one from a quoted source sentence');
  if (e.blurb && e.blurb.length > LIMITS.blurb) p.push(`blurb is ${e.blurb.length} characters (max ${LIMITS.blurb})`);
  if (e.blurb !== blurbs.map((k) => k.text).join(' ')) p.push('blurb does not match its claims (run: node tools/blurbs.mjs --check <file>)');
  if (FILLER.test(e.blurb || '') || (e.facts || []).some((f) => FILLER.test(f))) p.push('filler words (masterpiece, iconic, famous…): say something concrete instead');
  (d.claims || []).forEach((k, i) => {
    const n = `claim ${i + 1}`;
    if (!k.text || !k.quote) return p.push(`${n}: needs both text and the quote it came from`);
    const where = c.texts ? findQuote(k.quote, c.texts) : null;
    if (k.placeholderFor) return p.push(`${n}: ${k.placeholderFor}; it only restates the record's own details (maker, date, medium)`);
    if (!where) p.push(`${n} is not sourced: its quote isn't in any text the museum gave (${(k.quote || '').slice(0, 40)}…)`);
    else if (k.source && k.source !== where) p.push(`${n}: says it came from "${k.source}" but the quote is in "${where}"`);
    const allowed = new Set(numbersIn(k.quote));
    const stray = numbersIn(k.text).filter((n2) => !allowed.has(n2));
    if (stray.length) p.push(`${n}: number(s) ${stray.join(', ')} are not in its quote`);
    if (k.kind === 'fact' && k.text.length > LIMITS.fact) p.push(`${n}: fact is ${k.text.length} characters (max ${LIMITS.fact})`);
  });
  if ((e.facts || []).length > LIMITS.facts) p.push(`more than ${LIMITS.facts} facts`);
  if (!e.era && col?.eras) p.push('no era: the date is unclear; set era by hand');
  if (!e.ratio && (e.display || []).includes('wall')) p.push('no ratio: the museum gave no size and the image size is unknown');
  if (e.image?.src && !/^https:\/\//.test(e.image.src)) p.push('image link is not https');
  const dup = existing.find((x) => x.id === e.id || (fold(x.title) === fold(e.title || '') && fold(x.by || '') === fold(e.by || '')));
  if (dup) p.push(`already in the game as ${dup.id}`);
  if (e.rarity === 1 && !d.notes?.includes('rarity ok')) p.push('rarity is the default (1): set it, or add "rarity ok" to notes');
  return p;
}

export function writeDraft(d, outDir = join(root, 'content', 'review')) {
  const dir = join(outDir, d.collection);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `${d.slug}.json`);
  if (existsSync(file)) {
    const old = JSON.parse(readFileSync(file, 'utf8'));
    if (old.status !== 'draft') throw new Error(`${file} is already ${old.status}; not overwriting a reviewed entry`);
  }
  writeFileSync(file, JSON.stringify(d, null, 2) + '\n');
  return file;
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
  if (argv.includes('--check')) {
    for (const f of argv.filter((a) => a.endsWith('.json'))) {
      const d = syncDraft(JSON.parse(readFileSync(f, 'utf8')));
      writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
      console.log(`${f}: ${d.problems.length ? d.problems.length + ' problem(s)' : 'clean'}`);
      d.problems.forEach((m) => console.log('  - ' + m));
    }
    return;
  }
  let c;
  if (arg('from')) c = JSON.parse(readFileSync(arg('from'), 'utf8'));
  else if (arg('source') && arg('id')) {
    const { SOURCES } = await import('./sources/index.mjs');
    if (!SOURCES[arg('source')]) throw new Error(`unknown source "${arg('source')}" (${Object.keys(SOURCES).join(', ')})`);
    c = await SOURCES[arg('source')].fetch(arg('id'));
  } else {
    console.error('Usage: node tools/blurbs.mjs --source met --id 436535 [--collection painting] [--rarity 2] [--out dir]\n       node tools/blurbs.mjs --check content/review/painting/x.json');
    process.exit(2);
  }
  if (c.rejected) {
    console.error(`Rejected: ${c.rejected}`);
    process.exit(1);
  }
  const d = buildDraft(c, { collection: arg('collection') || 'painting', rarity: Number(arg('rarity')) || 1 });
  const file = writeDraft(d, arg('out') ? join(process.cwd(), arg('out')) : undefined);
  console.log(`Draft written: ${file}\n${d.problems.length} problem(s) to look at`);
  d.problems.forEach((m) => console.log('  - ' + m));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main().catch((e) => (console.error(e.message), process.exit(1)));
