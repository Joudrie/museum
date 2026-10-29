// Writes content/maps/puzzle-yard.json: a small island that has one of every puzzle piece and dig site, in the
// builder's map format. It is the test bed for src/puzzles.js (tests/puzzles.cjs) and a map to copy ideas from.
// Usage: node tools/puzzle_yard.mjs
import fs from 'node:fs';

const W = 80;
const H = 80;
const tiles = {};
const objects = [];
const put = (name, x, y) => objects.push({ ref: `t:${name}`, x: x * 32, y: y * 32 }); // 1x1 pieces: y is the top of the tile
const ground = (name, x, y) => (tiles[`${x},${y}`] = `t:${name}`);

// grass land with water all round
const corners = Array.from({ length: H + 1 }, (_, y) => Array.from({ length: W + 1 }, (_, x) => (x >= 16 && x <= 64 && y >= 18 && y <= 56 ? '2' : '0')).join(''));

// 1. boulder + plate + gate: push the boulder (31,30) right two tiles onto the plate (33,30); the gate (40,30) opens
for (let y = 27; y <= 33; y++) y !== 30 && put('hedge', 40, y);
put('boulder', 31, 30);
put('plate', 33, 30);
put('gate', 40, 30);
// 2. lever + riddler open the second gate
for (let x = 27; x <= 33; x++) x !== 30 && put('hedge', x, 40);
put('gate', 30, 40);
put('lever', 28, 44);
put('riddler', 33, 43); // 1x2: the top tile, so it stands on row 44
// 3. ice: a rink to slide across
for (let x = 20; x <= 30; x++) for (let y = 34; y <= 36; y++) ground('ice', x, y);
// 4. fog over a small clearing
for (let x = 50; x <= 52; x++) for (let y = 30; y <= 32; y++) put('fog', x, y);
put('chest', 51, 31);
// 5. a cracked boulder (needs a pick)
put('rock_crack', 50, 40);
// 6. dig sites: one of each kind, a three-tile cliff and a trench
put('dig_spot', 44, 48);
put('dig_fossil', 46, 48);
put('dig_ruin', 48, 48);
put('dig_shore', 50, 48);
put('dig_crater', 52, 48);
[24, 25, 26].forEach((x) => put('dig_cliff', x, 50));
[30, 31, 32].forEach((x) => put('dig_trench', x, 50));
put('x_mark', 56, 46); // hidden until you hold all four torn map pieces
put('rowboat', 22, 20);

fs.mkdirSync('content/maps', { recursive: true });
fs.writeFileSync('content/maps/puzzle-yard.json', JSON.stringify({ format: 'curation-map', version: 2, tile: 32, name: 'Puzzle yard', kind: 'island', w: W, h: H, corners, tiles, objects }));
console.log(`puzzle-yard.json: ${objects.length} pieces`);
