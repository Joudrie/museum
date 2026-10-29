# Content pipeline: real art in, honestly

How new paintings (and later anything else with a museum record) get from an open-access
museum into the game, with a person approving every piece. Style rules: `docs/CONTENT-STYLE.md`.
The format it feeds: `docs/COLLECTIONS.md`.

```
museum APIs ──► candidates ──► drafts (claims + quotes) ──► YOU review ──► publish ──► data file + CREDITS.md
 tools/sources   public domain    content/review/<c>/*.json    status:        tools/publish_content.mjs
                 only             tools/blurbs.mjs             "approved"
```

**Nothing reaches the game unless a person sets `"status": "approved"` and every check passes.**

## Sources

| Source | Key? | License of what we take | Limits we honor | Confidence in the adapter |
|---|---|---|---|---|
| Met (`met`) | no | CC0 (`isPublicDomain`) | ~5 requests/s | **verified live**; search moved to `/v1.1/search`; **no description text** (blurbs need another source) |
| Art Institute of Chicago (`aic`) | no | CC0 (`is_public_domain`) | ~1 request/s | shape from the AIC docs; **blocked by a Cloudflare challenge, unverified** |
| Cleveland (`cleveland`) | no | CC0 (`share_license_status`) | ~2 requests/s | **verified live**; has `fun_fact` text |
| Smithsonian (`smithsonian`) | **yes**, free: https://api.data.gov/signup/ → `SI_API_KEY` | CC0 media only | 1 request/s | follows the docs; check on first live run |
| Rijksmuseum (`rijks`) | **yes**, free: `RIJKS_API_KEY` | public domain (no copyright holder) | ~2 requests/s | follows the documented collection API; the museum is moving to data.rijksmuseum.nl, so **expect to adjust** |
| Wikimedia Commons (`commons`) | no, but set `CONTENT_CONTACT` (an email or URL for the User-Agent) | what the file says; `Copyrighted: True` is refused | ~3 requests/s | **verified live**; html and `QS:` junk stripped; 429 if too fast |

Adapters live in `tools/sources/`, one file each, all with `search(query, {limit}) → { candidates, rejected }`
and `fetch(id) → candidate`. **Only works the source itself marks public domain / CC0 are accepted.**
Everything else comes back in `rejected` with the reason. Responses are cached in `tools/.cache/` (git-ignored).
No scraping.

A candidate is: title, maker, year, medium, dimensions (so we can compute `ratio`), image URL (IIIF
or a 1280px size where the source offers it), the object page, the exact license string, the credit
line, the museum's own description, and `texts`: every text field a claim may quote.

## First live run (2026-10-28)

Hosts, tested with curl from the build session:

| Host | Result |
|---|---|
| collectionapi.metmuseum.org | works (see the search change below) |
| images.metmuseum.org | reachable (images are originals, often large) |
| openaccess-api.clevelandart.org | works |
| openaccess-cdn.clevelandart.org | works for real image paths (the site root answers 403) |
| commons.wikimedia.org, upload.wikimedia.org | work; the API answers **429** if hit too fast. Adapter spacing (300 ms) was enough |
| thumb.wikimedia.org | works. **New host**: Commons returns thumbnails from here, so it is now in the adapter's host list |
| ids.si.edu | reachable |
| api.si.edu | reachable but **403 without a key** (api.data.gov): not run, no key yet |
| www.rijksmuseum.nl | reachable (302): adapter not run, no key yet |
| lh3.googleusercontent.com | reachable (400 on the bare host, as expected) |
| api.artic.edu, www.artic.edu | **refused by the museum, not the proxy**: Cloudflare bot challenge (`cf-mitigated: challenge`, HTTP 403). Nothing was done to get around it. AIC cannot be used from here; the adapter is unverified |

What the live run changed:
- **Met: `/v1/search` was retired on 2026-10-01** (HTTP 410). The adapter now uses `/v1.1/search` (same `{ total, objectIDs }` shape, `limit`/`offset`). `/v1/objects/<id>` is unchanged.
- **Commons: fields carry Wikidata junk and html.** `ObjectName` and dates came back with `title QS:P1476,en:...` appended, and `ObjectName`/`Artist` as html. The adapter now strips tags and the `QS:` tail, and falls back to the file name when a name is several languages run together.
- **Duplicate claims.** Cleveland repeats a sentence in `description` and `did_you_know`. The blurb writer made two claims from it, the second citing the wrong field. Sentences are now de-duplicated.
- **Era** missed "1620s", "early 1600s" and three-digit years ("ca. 750"). Fixed.
- Cleveland needed no change. Smithsonian, Rijksmuseum and AIC are still unverified live.

Live recordings are in `tests/fixtures/content/*-live.json` (Met, Cleveland, Commons) and `tests/content.cjs` has a "Live recordings" section. The hand-written fixtures stay for the fake-network tests and for AIC, Smithsonian and Rijksmuseum.

A blocked host fails with a plain sentence ("could not reach … the host may need allowing"), and other sources still run.
Nothing tries to get around the proxy.

Hosts to allow in the environment's network settings:

```
collectionapi.metmuseum.org  images.metmuseum.org
api.artic.edu  www.artic.edu   (allowed, but Cloudflare challenges bots)
openaccess-api.clevelandart.org  openaccess-cdn.clevelandart.org
api.si.edu  ids.si.edu
www.rijksmuseum.nl  lh3.googleusercontent.com
commons.wikimedia.org  upload.wikimedia.org  thumb.wikimedia.org
```

## Add a batch in 6 steps

1. **Pick the works.** Copy `content/batches/first-batch.json`. Each item is a search
   (`query`, optional `maker` / `title` to match against, `sources` in the order to try, `region`, `note`).
2. **Build drafts:** `node tools/build_batch.mjs content/batches/<batch>.json`
   Each found work becomes `content/review/<collection>/<slug>.json` with `"status": "draft"`.
   Works with no public-domain match are listed with the reason. For one exact object:
   `node tools/blurbs.mjs --source met --id 436535`.
3. **Check the pictures:** `node tools/check_images.mjs --resource` (see below).
4. **Review:** `node tools/review_report.mjs [--html report.html]` prints, per entry, the image link, the blurb,
   every claim beside its quote, the license, and the problems. For each draft, fix the problems:
   - Edit `claims` (the `text` may be shortened or reworded; keep `quote` exactly as the museum wrote it and `source` the field it is in).
   - Run `node tools/blurbs.mjs --check <file>` to rebuild the blurb and re-check.
   - Set `rarity` (or put "rarity ok" in `notes`), and `era` / `ratio` / `placeholder` if the report says so.
5. **Approve:** change `"status": "draft"` to `"approved"` in the file (on GitHub works fine from a phone).
   Leave unsure ones as `draft`, or set `"rejected"`.
6. **Publish:** `node tools/publish_content.mjs --collection painting [--dry-run]`
   Re-checks every approved entry, writes `src/collections/data/paintings.js`, and updates the table in `CREDITS.md`.
   It never removes a published entry unless you pass `--remove <id>`, and reports entries whose review file is no longer approved.
   Then run the tests, and open a PR as usual.

Publish only rewrites data files marked `// @generated-by tools/publish_content.mjs` (paintings is). A hand-written
file (fish, minerals) is refused; add those entries by hand. A new collection from a CSV:
`node tools/import_collection.mjs rows.csv --collection fossil --name Fossils --publishable`.

## The checks on a draft

`tools/blurbs.mjs` (`checkDraft`) flags, in plain sentences:
- not public domain, or no license / credit / image
- the blurb over 220 characters, a fact over 200, more than 3 facts
- **a claim whose quote isn't in any text the museum gave**, or is in a different field than stated
- **a number or year in a claim that isn't in its quote**
- filler words, a blurb that doesn't match its claims, a work already in the game (by id, or same title and maker)
- no era (unclear date), no ratio, an `http` image, a default rarity nobody decided

When the source has no usable sentence (the Met's records have no description), the draft states only the
record's own details ("By X, ca. 1550, ink on paper.") and says it **needs a real hook**. It does not make one up.
Write one from a museum page, quote it in `claims`, and re-check.

## The image checker

`node tools/check_images.mjs [--collection painting] [--only id,id] [--resource] [--allow-problems]`

For every `url` image it reports status, content type, pixel size, weight and shape error, and flags:
`broken` (not 200 or unreachable), `not-image`, `tiny` (< 800px on the long side), `huge` (> 600 KB), `ratio`
(more than 3% off the entry's `ratio`). It writes `content/image-report.json` (everything) and
`content/image-fixes.json` (only what needs attention). With `--resource`, each failing painting is searched
for in the museum sources and the matching candidates are listed in the fixes file. **Nothing is ever swapped for you.**

## Known limits

- **AIC, Smithsonian and Rijksmuseum have never run live** (Cloudflare challenge, no key, no key).
- **Second batch** (`content/batches/second-batch.json`): 17 works pinned by Cleveland id, all with real museum description text, so the blurbs are quoted sentences. Together with the first batch there are 27 drafts, none approved.
- **First batch, live:** 11 of 12 found (the casta paintings had only non-public-domain matches). All 14 drafts in `content/review/painting/` are still `draft`: each needs a rarity decision, nine Met ones need a real hook (the Met has no description text), and a few matched the wrong work ("Deer in a Landscape" for the Bodmer Mandan search; a pendant for the Ethiopian icon search). The first batch now tries Cleveland first, so the Met and Cleveland duplicates are gone. Four Met drafts still need a hook (Night-Shining White, Esther, The Gulf Stream, The Drawing Lesson, which is a print, not a painting). The Bodmer Mandan item waits for a Smithsonian key: the Met and Cleveland only have his animal studies.
- **The Met serves originals** (often several MB). The checker will flag them `huge`; pick another source or
  use `primaryImageSmall` (smaller than HD) until we have somewhere to host resized copies.
- **The blurb writer picks sentences; it doesn't write.** It scores the museum's own sentences (a date, a "first"
  or "only", a named person) and quotes the best. Many will be dull. A person (or a Claude session, using
  quotes) writes the good ones.
- **Era is a date bucket**, not a style. **Placeholder colour** is a neutral default (the colour shown while an image loads).
- **Rijksmuseum** may need its adapter rewritten for data.rijksmuseum.nl.
- Public-domain status is the museum's claim for the object and its image; we record it and link to it. A person
  should still glance at anything recent (artists who died within ~70 years).
- Search is by words, so "a painting of X" may return prints or objects. The `sameWork` match (maker and title words) keeps replacements honest; the reviewer decides.

## Files

| Path | What |
|---|---|
| `tools/sources/*.mjs` | one adapter per museum, plus `common.mjs` (fetching, cache, gate) and `index.mjs` |
| `tools/check_images.mjs`, `tools/imagesize.mjs` | the image checker |
| `tools/blurbs.mjs` | candidate → draft, and the claim checks |
| `tools/build_batch.mjs`, `content/batches/` | batches of wanted works |
| `tools/review_report.mjs` | the review report (text or HTML) |
| `tools/publish_content.mjs` | approved drafts → data file + `CREDITS.md` |
| `tools/import_collection.mjs` | CSV → data file (also refuses missing license / credit / ratio) |
| `tools/record_fixtures.mjs` | save a live response as a test fixture |
| `content/review/<collection>/` | draft and approved entries |
| `tests/content.cjs` | tests with fixtures, no network |
