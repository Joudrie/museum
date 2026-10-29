# Halls: themed room presets

Data: `content/halls/halls.json` (`{ format, version, halls: [...] }`). Code: `src/halls/`. Test: `node tests/halls.cjs`.

A hall is a game-side preset, not a claim about real art. Facts belong in collection entries, with a quote (docs/CONTENT-STYLE.md). A `facts` field on a hall is refused.

| Field | Meaning |
|---|---|
| `id`, `name`, `wing`, `blurb` | slug, label, group (art, science, nature, history, outside), one plain sentence |
| `fit` | the room shape it was drawn for; the loader scales to any shape |
| `theme`, `decor` | a key of `THEMES` (`src/themes.js`) and overrides on top of it |
| `items` | `{ type, x, y, rot? }`: `type` is a key of `ITEMS`, `x`/`y` are 0-1 across the floor (y=0 is the back). Doorways are kept clear; an item that cannot fit is dropped |
| `paintings.eras` | painting eras that hang on the walls, in order |
| `collections` | `{ id, sets }`: registered collections (and the sets) that belong here; `hallEntries(hall)` lists their entry ids |
| `planned` | collection ids that don't exist yet; move one into `collections` when its data lands (the test enforces it) |
| `note` | hand-off notes for other chats |

`applyHall(roomIndex, hall)` restyles a built room and returns `before`; `undoHall(roomIndex, before)` restores it. Fixed rooms (entrance, main hall, atrium, shaped, break) are refused.
