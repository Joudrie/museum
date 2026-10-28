# Collections: one format for everything the museum holds

Paintings, fish, minerals, and later fossils, coins, ship models and glass
flowers are all **entries** in a **collection**, optionally grouped into
**sets**. A new collection is a data file plus one line. No new code.

Why: VISION #5 (no limits on scope) and #7 (earned, not bought) need a way to
add a whole new kind of thing cheaply, and dig sites, restoration, the aquarium
and display cases all need to ask the same questions of any object: what is it,
how rare, where did it come from, can it go in a case, have I ever had one.

## Where things live

| What | Where |
|---|---|
| The format (JSDoc types) and `validateEntry` / `validateCollection` / `validateSet` | `src/collections/schema.js` |
| The registry: `get`, `list`, `sets`, `tabs`, `metaLine` | `src/collections/index.js` |
| Data, one file per collection | `src/collections/data/*.js` |
| The codex: what you have ever collected, what you hold, claimed sets | `src/collections/codex.js` |
| Pictures: pixel rows, procedural renderers, picture files | `src/collections/render.js` |
| The journal tab for any collection | `src/collections/tab.js` |
| The viewer (wall for pictures, glass case for pixel art) | `src/viewer.js` |
| The importer | `tools/import_collection.mjs` |
| Tests | `tests/collections.cjs` |

The registry and schema never touch the page, so Node can import them.

## An entry

```js
{
  id: 'mineral:quartz',        // "collection:slug", unique everywhere
  collection: 'mineral',
  title: 'Quartz',
  by: 'Anna Finder',           // maker or finder (optional)
  year: '1889',                // or an era name like 'Jurassic' (optional)
  era: 'impressionist',        // key into the collection's `eras`, for filter chips (optional)
  blurb: 'Short, true, curious.',
  facts: ['More rabbit-hole lines.'],
  rarity: 1,                   // 1 common … 4 legendary
  set: 'crystal-cabinet',
  tags: ['clear'],
  image: { kind: 'pixels', rows: ['..##..', …], palette: { '#': '#3a3440', a: '#e8e4ec' } },
  ratio: 1.36,                 // width / height of the real thing (paintings)
  display: ['case', 'plinth'], // wall, case, plinth, tank, floor
  provenance: { how: 'dug', where: 'Skull Cove', story: 'Shown when you get it.' },
  source: { license: 'CC0', credit: 'Who to thank', url: '…' },   // required
  value: 2,                    // income hint, gold per hour on display
  collectable: false,          // only for junk that is never kept
  acquire: { … },              // rules for whatever hands these out (fishing reads water, time, weather, size)
}
```

**Image kinds**

- `url`: a picture on the web, for HD paintings. `src`, plus a `placeholder` colour.
- `sprite`: a pixel-art file we ship. `src`.
- `pixels`: pixel art as data. `rows` (`.` is clear) and a `palette`. This is how a
  new collection gets art with no code.
- `procedural`: drawn by a named renderer in `render.js` (`fish` is the only one).
  Other keys are that renderer's parameters. Add one with `registerRenderer`.

`source.license` and `source.credit` are required on every entry, so credit is
never lost. Original art says `license: 'Original'`.

## A collection

```js
{
  id: 'mineral', name: 'Minerals', noun: 'minerals', icon: '💎',
  display: 'case',
  ownership: 'earned',         // 'all': yours from the start (paintings); 'earned': must be collected
  legacyKeys: false,           // true only if older saves key this collection by the bare slug
  eras: { … },                 // optional filter chips
  meta: ['rarity', 'where'],   // which of by / year / rarity / where show under a title
  journal: { tab: 'minerals', label: 'Minerals', order: 4, layout: 'tiles',
             title: 'Optional heading above the log',
             intro: '{have} of {total} minerals found.' },
  viewer: { look: 'case' },
}
```

- `journal.layout`: `cards` (a thumbnail with a blurb, for things that hang or have a place in the
  museum) or `tiles` (a picture, a name, a count; silhouettes until collected).
- Intro tokens: `{have}` collected, `{total}` in the collection, `{shown}` hung on display, `{noun}`.
- Collections can share a tab: give them the same `journal.tab`. The first one with an `intro`
  leads it. Fish and Finds share the Fish tab.
- A tab can get code through `registerTabExtra(tab, ({ refresh }) => nodes)`.
  Only fishing uses it (the bobber list). Prefer data.

## A set

```js
{ id: 'crystal-cabinet', name: 'Crystal cabinet', collection: 'mineral',
  entries: ['mineral:quartz', …], reward: { gold: 600 }, plaque: 'Shown when complete.' }
```

Every entry in a set also carries `set: '<id>'`. The journal shows progress bars; a finished
set offers a one-time Claim button.

## The codex (the save)

One key, `curation.codex`, versioned:

```js
{ v: 1,
  seen:    { 'fish:minnow': { n: 3, first: 1730000000000, best: 7 } },  // ever collected (stays even if sold)
  owned:   { 'fish:minnow': 3 },                                        // held now (ownership 'earned' only)
  claimed: { 'pond-fish': true } }                                      // set rewards already paid
```

- `collect(id, { size })` records getting something (returns `null` for junk).
- `markSeen(ids)` stamps without changing what you hold (a painting hung for the first time).
- `dispose(id)` sells or loses one; the stamp stays.
- `setProgress`, `claimSet`, `count`, `snapshot` read it.
- It is read fresh each time, so it can never be stale, and a broken value is repaired by
  `normalize` rather than crashing. Nothing is ever deleted for being unknown.

**Migration.** The first time the codex is read and `curation.codex` doesn't exist, it is built from the
older keys: `curation.fishing` (caught fish and finds), `curation.met` (famous visitors, stored as
`visitor:<id>`) and `curation.slots` (paintings hung on purpose). The old keys are left untouched.
Paintings hung by default are stamped when their room first loads. Painting notes and ratings keep
their old keys (`curation.journal`, by bare slug) because `painting` sets `legacyKeys`.

## Add a collection in 5 steps

1. **Pick an id** (`fossil`) and make `src/collections/data/fossil.js` exporting
   `{ collection, sets, entries }`. Copy `minerals.js`.
2. **Write the entries.** Every entry needs `id`, `collection`, `title`, `image` and
   `source` (license and credit). Add a blurb that is short, true and makes someone curious.
   Or write a spreadsheet and run the importer:
   `node tools/import_collection.mjs rows.csv --collection fossil --name Fossils --icon 🦴`
   (columns are listed at the top of the script; it refuses rows with no license or credit and writes
   nothing until every problem is fixed).
3. **Register it**: add `import fossil from './data/fossil.js'` and put it in `PACKS` in
   `src/collections/index.js`.
4. **Check it**: `node tests/collections.cjs` (needs the preview server) validates every entry and
   set, and the registry logs anything it had to skip to the console.
5. **Credit it**: add the pack to `CREDITS.md` if the art isn't original.

That is the whole job. The journal gets a tab, the viewer works, the codex records it, sets get
progress bars.

## What is not built yet

These all sit on this format and need their own work:

- A way to actually get minerals, fossils and the rest (dig sites, expeditions, restoration).
  For now **Settings → Testing → Collect one of everything** drops one of each earned entry into
  the codex.
- Display cases, plinths and tanks in the museum (`display` says what fits where; nothing places them yet).
- Famous visitors as a collection. The codex already stamps them as `visitor:<id>`, but their tab is
  still hand-built.
- Selling and buying through the codex (`dispose` exists; the shop doesn't).
- Rarity for paintings (every painting is rarity 1 until crates and fame exist).
- `value` as income (it's recorded, but income still comes from the old rules).
