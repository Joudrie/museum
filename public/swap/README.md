# Drop-in art swap

Drop a PNG with the **same name** as a placeholder into the matching folder. Rebuild (or reload
the dev server) and it replaces the placeholder. No code change. Delete the file to go back.
`node tools/list_placeholders.mjs` lists every placeholder with its name, size and use.

| Folder | Replaces | Size |
|---|---|---|
| `tiles/<name>.png` | an island tile or prop drawn in code (`grass_1`, `palm`...) | the tile's own size; animated tiles: frames side by side, left to right |
| `sprites/<name>.png` | a room furniture sprite (`public/sprites/lpc/<name>.png`) | any size, drawn the same way up |
| `pieces/<group>/<n>.png` | a builder piece (`decor/12` is `pieces/decor/12.png`) | exactly the piece's width and height |

A file with the wrong size is ignored and a warning is written to the browser console, so the placeholder stays.
Keep transparent backgrounds. Pixel art stays on the 32px grid.
