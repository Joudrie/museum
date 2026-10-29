// Draws the expedition islands (src/maps/exp-*.json) in the map-builder format.
// Run: node tools/gen_expeditions.mjs   (the output is committed; this is just how
// the first drafts were laid out. Open any of them in the builder to repaint by hand,
// but keep the `expedition` block: spots, patrols and the clock live there.)
//
// Corners: 0 sea, 1 sand, 2 grass, 3 pond, 4 path. Tiles are { "x,y": "t:name" }.
// Objects are scenery only (trees, rocks, boats); the spots you dig, open and press
// come from `expedition.spots` and are placed by src/expedition.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const T = 32;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'maps');
// piece heights in px (a piece stands on its bottom row)
const H = { tree: 96, palm: 96, pine: 64, tall_grass: 46, rock_big: 64, cave: 64, tent: 64, skull_flag: 64, wreck_hull: 64, mammoth_skeleton: 64 };
const W2 = new Set(['tree', 'palm', 'rock_big', 'log', 'rowboat', 'cave', 'tent', 'wreck_hull', 'sarcophagus', 'mammoth_skeleton']);

let seed = 1;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 2 ** 32;
};

export function island({ name, w, h, shape, ground = 2, rim = 1, expedition }) {
  const corners = [];
  for (let y = 0; y <= h; y++) {
    const row = [];
    for (let x = 0; x <= w; x++) {
      const d = shape(x, y);
      row.push(d >= 1 ? 0 : d > 0.8 ? rim : ground);
    }
    corners.push(row);
  }
  const tiles = {};
  const objects = [];
  const taken = new Set();
  const api = {
    corners,
    tiles,
    objects,
    land: (x, y) => corners[y]?.[x] > 0 && corners[y + 1]?.[x + 1] > 0 && corners[y]?.[x + 1] > 0 && corners[y + 1]?.[x] > 0,
    fill(x0, y0, x1, y1, ref) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) tiles[`${x},${y}`] = ref;
    },
    line(pts, ref, wide = 1) {
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1];
        const [bx, by] = pts[i];
        const n = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
        for (let k = 0; k <= n; k++) {
          const x = Math.round(ax + ((bx - ax) * k) / n);
          const y = Math.round(ay + ((by - ay) * k) / n);
          for (let dx = 0; dx < wide; dx++) for (let dy = 0; dy < wide; dy++) tiles[`${x + dx},${y + dy}`] = ref;
        }
      }
    },
    put(name, x, y, flip) {
      const t = H[name] || T;
      if (!api.land(x, y) && name !== 'rowboat') {
        // decoration that landed in the sea moves to the nearest dry, inland cell
        let best = null;
        for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) if (api.land(x + dx, y + dy) && api.land(x + dx + 1, y + dy) && corners[y + dy][x + dx] === 2 || (api.land(x + dx, y + dy) && api.land(x + dx + 1, y + dy) && ground !== 2)) {
          const d = Math.hypot(dx, dy);
          if (!best || d < best.d) best = { d, x: x + dx, y: y + dy };
        }
        if (best) [x, y] = [best.x, best.y];
      }
      objects.push({ ref: `t:${name}`, x: x * T, y: (y + 1) * T - t, ...(flip && { flip: true }) });
      taken.add(`${x},${y}`);
      if (W2.has(name)) taken.add(`${x + 1},${y}`);
    },
    keep(x0, y0, x1, y1) {
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) taken.add(`${x},${y}`);
    },
    // scatter a piece over open land
    scatter(name, n, ok = () => true) {
      let tries = 0;
      while (n > 0 && tries++ < 4000) {
        const x = 1 + Math.floor(rnd() * (w - 3));
        const y = 2 + Math.floor(rnd() * (h - 4));
        if (!api.land(x, y) || !api.land(x + 1, y) || taken.has(`${x},${y}`) || taken.has(`${x + 1},${y}`) || !ok(x, y)) continue;
        if (corners[y][x] === 1 && name !== 'palm' && name !== 'rock_small' && name !== 'driftwood') continue; // keep the beach clear
        api.put(name, x, y);
        n--;
      }
    },
  };
  return { api, finish: () => ({ format: 'curation-map', version: 2, tile: 32, name, kind: 'island', w, h, corners: corners.map((r) => r.join('')), tiles, objects, expedition }) };
}

export const blob = (cx, cy, rx, ry, wob = 0.08) => (x, y) => {
  const a = Math.atan2((y - cy) / ry, (x - cx) / rx);
  const k = 1 + wob * Math.sin(a * 3 + 1) + wob * 0.6 * Math.sin(a * 5 + 2);
  return Math.hypot((x - cx) / rx, (y - cy) / ry) / k;
};

const write = (id, m) => {
  fs.writeFileSync(path.join(OUT, `exp-${id}.json`), JSON.stringify(m));
  console.log('wrote', `exp-${id}.json`, `${m.w}x${m.h}`, `${m.objects.length} objects`);
};

// ---------------------------------------------------------------- Skull Isle (pirates)
{
  seed = 7;
  const W = 36;
  const Hh = 38;
  const { api, finish } = island({
    name: 'Skull Isle',
    w: W,
    h: Hh,
    shape: blob(18, 18, 16, 16),
    expedition: {
      id: 'pirate',
      climate: { season: 'summer', weather: 'clear' },
      sub: 'pirates, a chart and a chest',
      outro: 'The captain’s chest is open and his men are none the wiser. The finds are muddy, so bring them home to be cleaned.',
      goals: [
        { text: 'Sneak to the camp and take the captain’s chart', until: 'map' },
        { text: 'Dig where the chart’s X is, in the north-east', until: 'key' },
        { text: 'Open the captain’s chest with the key', until: 'final' },
      ],
      spots: [
        { k: 'note', x: 8, y: 9, title: 'The captain’s chart', from: 'Pinned to a crate', text: 'A rough chart. A cove, a ridge and a big red X in the north-east, where the old palms lean. The captain scribbled: “Mind the long grass. Pirates never look in it.”', sets: 'map', button: 'Take the chart' },
        { k: 'dig', x: 27, y: 9, needs: 'map', x_mark: true, collection: 'mineral', sets: 'key', says: 'A rusty key, tied with red thread!', locked: 'Nothing marks this spot yet.' },
        { k: 'dig', x: 22, y: 13, collection: 'mineral' },
        { k: 'dig', x: 13, y: 27, collection: 'mineral' },
        { k: 'chest', x: 29, y: 21, needs: 'key', locked: 'A heavy lock. You need the captain’s key.', loot: ['mineral', 'mineral', 'fossil'], final: true, says: 'Gems, a fossil in a pouch and the smell of old rum.' },
      ],
      patrols: [
        { kind: 'pirate', path: [[13, 21], [24, 21], [24, 15], [13, 15]], sight: 76 },
        { kind: 'pirate', path: [[5, 12], [12, 12], [12, 8], [5, 8]], sight: 70, speed: 26 },
      ],
    },
  });
  // the way up from the beach, and the camp
  api.line([[18, 32], [18, 26], [17, 22], [10, 17], [9, 11]], 't:dirt_2', 2);
  api.line([[19, 22], [26, 19], [29, 22]], 't:dirt_2', 1);
  api.fill(4, 7, 12, 12, 't:dirt_1');
  api.fill(26, 8, 28, 10, 't:dirt_1');
  api.keep(17, 22, 20, 36); // the landing
  api.keep(4, 7, 12, 12);
  api.keep(26, 7, 30, 11);
  api.keep(28, 20, 31, 22);
  // long grass the pirates never look into: strips beside their route
  for (let x = 14; x <= 23; x += 1) if (x % 3) api.put('tall_grass', x, 19);
  for (let y = 15; y <= 21; y++) api.put('tall_grass', 26, y);
  for (let x = 6; x <= 11; x++) api.put('tall_grass', x, 14);
  // the camp
  api.put('campfire', 8, 11);
  api.put('barrel', 5, 9);
  api.put('crate', 6, 8);
  api.put('barrel', 11, 8);
  api.put('crate', 11, 10);
  api.put('torch', 4, 10);
  api.put('torch', 13, 11);
  api.put('sign', 17, 29);
  // the jungle
  api.scatter('palm', 26, (x, y) => Math.hypot(x - 18, y - 18) > 5);
  api.scatter('tree', 16);
  api.scatter('bush', 20);
  api.scatter('rock_small', 8);
  api.scatter('rock_big', 3, (x, y) => y > 4);
  api.scatter('flowers', 12);
  api.scatter('shells', 6);
  api.scatter('driftwood', 4);
  api.put('skull_flag', 3, 12);
  api.put('skull_flag', 19, 30);
  api.put('animal_parrot_red', 7, 13);
  api.put('animal_parrot_green', 29, 14);
  api.put('animal_crab', 12, 30);
  api.put('person', 22, 29); // a castaway to talk to
  api.put('rowboat', 17, 35);
  write('pirate', finish());
}

// a wall of mountain tiles (solid) with gaps left for gates
const wall = (api, x0, x1, y, gaps = []) => {
  for (let x = x0; x <= x1; x++) if (!gaps.includes(x)) api.tiles[`${x},${y}`] = x % 2 ? 't:mountain_1' : 't:mountain_2';
};

// ---------------------------------------------------------------- The Drowned Reef (shipwreck, tide)
{
  seed = 11;
  const { api, finish } = island({
    name: 'The Drowned Reef',
    w: 34,
    h: 30,
    shape: blob(17, 14, 15, 11, 0.1),
    expedition: {
      id: 'wreck',
      climate: { season: 'summer', weather: 'clear' },
      sub: 'a wreck, wet crates and the tide',
      outro: 'The strongbox is open and the tide is on its way. Everything is soaked, so bring it home to be cleaned.',
      goals: [
        { text: 'Pry open the wrecked crates', until: 'crates', tally: 'crates' },
        { text: 'Open the strongbox in the stern', until: 'final' },
      ],
      clock: { seconds: 105, label: 'Tide', msg: 'The tide came in! You wade back to the boat. What you opened stays open.' },
      spots: [
        { k: 'crate', x: 8, y: 10, tally: 'crates' },
        { k: 'crate', x: 14, y: 6, tally: 'crates', old: true },
        { k: 'crate', x: 25, y: 11, tally: 'crates' },
        { k: 'dig', x: 27, y: 17, collection: 'mineral' },
        { k: 'dig', x: 7, y: 17, collection: 'mineral' },
        { k: 'chest', x: 21, y: 6, needs: 'crates', locked: 'The strongbox is jammed shut. Maybe the crates hold what opens it.', loot: ['mineral', 'fossil'], final: true, says: 'Soaked through, but still shining.' },
      ],
    },
  });
  api.fill(0, 0, 33, 29, 't:sand_wet');
  Object.keys(api.tiles).forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    if (!api.land(x, y)) delete api.tiles[k];
  });
  api.keep(15, 20, 19, 28);
  api.keep(6, 9, 9, 11);
  api.keep(13, 5, 15, 7);
  api.keep(24, 10, 26, 12);
  api.keep(20, 5, 22, 7);
  api.put('log', 18, 7);
  api.put('log', 9, 8);
  api.put('barrel', 11, 10);
  api.put('barrel', 23, 7);
  api.put('driftwood', 20, 12);
  api.put('driftwood', 12, 14);
  api.scatter('rock_sand', 14);
  api.scatter('shells', 12);
  api.scatter('driftwood', 6);
  api.scatter('palm', 6, (x, y) => y > 4);
  api.scatter('rock_small', 6);
  api.put('wreck_hull', 19, 8);
  api.put('animal_crab', 10, 16);
  api.put('animal_crab', 24, 15);
  api.put('person', 13, 23);
  api.put('rowboat', 16, 27);
  write('wreck', finish());
}

// ---------------------------------------------------------------- The Sandstone Tomb (desert, sliding stones)
{
  seed = 23;
  const { api, finish } = island({
    name: 'Sandstone Tomb',
    w: 36,
    h: 34,
    shape: blob(18, 17, 16, 15, 0.07),
    expedition: {
      id: 'tomb',
      climate: { season: 'summer', weather: 'clear' },
      sub: 'a desert tomb and its stones',
      outro: 'The sarcophagus lid slides back and the tomb breathes out. Everything inside is dusty, so bring it home to be cleaned.',
      goals: [
        { text: 'Read the carving in the courtyard', until: 'carving' },
        { text: 'Step on the three stones in order', until: 'plates' },
        { text: 'Pull the lever in the chamber', until: 'seal' },
        { text: 'Open the sarcophagus', until: 'final' },
      ],
      spots: [
        { k: 'note', x: 17, y: 15, title: 'A carving', from: 'On the courtyard wall', text: 'Step softly: stones remember. The sun rises in the east, stands high at the top of the court and sets in the west. Press them in that order.', sets: 'carving', button: 'Remember it' },
        { k: 'plate', x: 23, y: 12, n: 1, sets: 'plates', ordered: true, wrong: 'The stones sink back up. Rising, high, setting: east, top, west.' },
        { k: 'plate', x: 18, y: 10, n: 2, sets: 'plates', ordered: true, wrong: 'The stones sink back up. Rising, high, setting: east, top, west.' },
        { k: 'plate', x: 13, y: 12, n: 3, sets: 'plates', ordered: true, wrong: 'The stones sink back up. Rising, high, setting: east, top, west.' },
        { k: 'gate', x: 17, y: 8, w: 3, needs: 'plates', opens: 'The stones grind apart. A doorway opens in the rock.' },
        { k: 'lever', x: 22, y: 4, sets: 'seal' },
        { k: 'chest', x: 18, y: 4, needs: 'seal', locked: 'The lid is sealed. Something in the chamber must release it.', loot: ['mineral', 'mineral', 'fossil'], final: true, says: 'Gold light, old dust and something that was once alive.' },
        { k: 'dig', x: 8, y: 21, collection: 'mineral' },
        { k: 'dig', x: 29, y: 22, collection: 'mineral' },
        { k: 'dig', x: 13, y: 26, collection: 'mineral' },
      ],
    },
  });
  api.fill(0, 0, 35, 33, 't:sand_2');
  Object.keys(api.tiles).forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    if (!api.land(x, y)) delete api.tiles[k];
  });
  api.fill(13, 9, 23, 16, 't:cobble'); // the courtyard
  wall(api, 8, 28, 8, [17, 18, 19]);
  wall(api, 8, 8, 4, []);
  for (let y = 3; y <= 7; y++) {
    api.tiles[`12,${y}`] = 't:mountain_2';
    api.tiles[`24,${y}`] = 't:mountain_1';
  }
  api.fill(13, 3, 23, 7, 't:brick');
  api.keep(12, 3, 24, 16);
  api.keep(15, 22, 19, 32);
  api.put('statue_head', 18, 13);
  api.put('torch', 15, 5);
  api.put('torch', 21, 5);
  api.put('torch', 16, 9);
  api.put('torch', 20, 9);
  api.keep(7, 20, 9, 22);
  api.keep(28, 21, 30, 23);
  api.keep(12, 25, 14, 27);
  api.scatter('rock_sand', 16);
  api.scatter('rock_big', 3, (x, y) => y > 18);
  api.scatter('dune_grass', 12);
  api.scatter('palm', 4, (x, y) => y > 18);
  api.scatter('shells', 3);
  api.put('sarcophagus', 20, 4);
  api.put('animal_cat_ginger', 15, 20);
  api.put('person', 22, 25);
  api.put('rowboat', 17, 32);
  write('tomb', finish());
}

// ---------------------------------------------------------------- Red Badlands (dinosaur cliffs, dig)
{
  seed = 31;
  const { api, finish } = island({
    name: 'Red Badlands',
    w: 38,
    h: 32,
    shape: blob(19, 15, 17, 13, 0.09),
    expedition: {
      id: 'badlands',
      climate: { season: 'summer', weather: 'clear' },
      sub: 'fossil cliffs and the rain',
      outro: 'The big skeleton is out of the rock at last. Every bone is caked in red mud, so bring them home to be cleaned.',
      goals: [
        { text: 'Dig the four fossil spots in the red rock', until: 'bones', tally: 'bones' },
        { text: 'The bones point to the big one. Dig where the X is', until: 'final' },
      ],
      clock: { seconds: 130, label: 'Rain', msg: 'Rain! The gullies flood and you scramble back to the boat. The spots you dug stay dug.' },
      spots: [
        { k: 'dig', x: 9, y: 9, collection: 'fossil', tally: 'bones' },
        { k: 'dig', x: 28, y: 8, collection: 'fossil', tally: 'bones' },
        { k: 'dig', x: 10, y: 20, collection: 'fossil', tally: 'bones' },
        { k: 'dig', x: 28, y: 20, collection: 'fossil', tally: 'bones' },
        { k: 'dig', x: 19, y: 13, needs: 'bones', x_mark: true, collection: 'fossil', final: true, says: 'A whole skeleton, lying in the rock.', locked: 'Nothing marks this spot yet.' },
      ],
    },
  });
  api.fill(0, 0, 37, 31, 't:dirt_2');
  Object.keys(api.tiles).forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    if (!api.land(x, y)) delete api.tiles[k];
  });
  for (let i = 0; i < 80; i++) {
    const x = 3 + Math.floor(rnd() * 32);
    const y = 4 + Math.floor(rnd() * 22);
    if (api.land(x, y)) api.tiles[`${x},${y}`] = rnd() < 0.5 ? 't:rock_1' : 't:rock_2';
  }
  // a cliff ridge across the north with a gap
  for (let x = 8; x <= 30; x++) if (x < 17 || x > 20) api.tiles[`${x},5`] = x % 2 ? 't:mountain_1' : 't:mountain_2';
  api.keep(17, 22, 21, 30);
  [[9, 9], [28, 8], [10, 20], [28, 20], [19, 13]].forEach(([x, y]) => api.keep(x - 1, y - 1, x + 1, y + 1));
  api.scatter('rock_big', 6, (x, y) => y > 6);
  api.scatter('boulder', 6);
  api.scatter('rocks_pile', 8);
  api.scatter('rock_small', 10);
  api.scatter('dune_grass', 8);
  api.scatter('bush', 5);
  api.put('tent', 4, 26);
  api.put('animal_crab', 23, 27);
  api.put('person_wander', 15, 27);
  api.put('rowboat', 18, 29);
  write('badlands', finish());
}

// ---------------------------------------------------------------- The Lost Temple (jungle, plates, hidden room)
{
  seed = 41;
  const stone = 'The stones sink back up. Rising, high, setting: left, middle, right.';
  const { api, finish } = island({
    name: 'The Lost Temple',
    w: 36,
    h: 36,
    shape: blob(18, 18, 16, 16, 0.08),
    ground: 2,
    expedition: {
      id: 'temple',
      climate: { season: 'summer', weather: 'rain' },
      sub: 'jungle, sun plates and a hidden room',
      outro: 'The hidden room is open at last. The idol’s treasure is thick with moss and dust, so bring it home to be cleaned.',
      goals: [
        { text: 'Press all four sun plates in the courtyard', until: 'sun' },
        { text: 'Go through the great doors and read the carving', until: 'carving' },
        { text: 'Press the three inner stones: rising, high, setting', until: 'inner' },
        { text: 'Open the idol’s chest in the hidden room', until: 'final' },
      ],
      spots: [
        { k: 'plate', x: 12, y: 19, sets: 'sun' },
        { k: 'plate', x: 24, y: 19, sets: 'sun' },
        { k: 'plate', x: 12, y: 24, sets: 'sun' },
        { k: 'plate', x: 24, y: 24, sets: 'sun' },
        { k: 'gate', x: 17, y: 16, w: 2, needs: 'sun', opens: 'The great doors swing open.' },
        { k: 'note', x: 21, y: 13, title: 'A carving over the inner door', from: 'Worn stone', text: 'The sun rising, the sun high, the sun setting. Three stones in a row: left, middle, right, in that order.', sets: 'carving', button: 'Remember it' },
        { k: 'plate', x: 15, y: 12, n: 1, sets: 'inner', ordered: true, wrong: stone },
        { k: 'plate', x: 17, y: 12, n: 2, sets: 'inner', ordered: true, wrong: stone },
        { k: 'plate', x: 19, y: 12, n: 3, sets: 'inner', ordered: true, wrong: stone },
        { k: 'gate', x: 17, y: 10, w: 2, needs: 'inner', opens: 'A hidden wall slides away.' },
        { k: 'chest', x: 17, y: 7, loot: ['mineral', 'mineral', 'fossil'], final: true, says: 'Moss, gold light and a very old smell.' },
        { k: 'dig', x: 8, y: 14, collection: 'mineral' },
        { k: 'dig', x: 28, y: 14, collection: 'mineral' },
        { k: 'dig', x: 10, y: 29, collection: 'fossil' },
      ],
    },
  });
  api.fill(0, 0, 35, 35, 't:grass_jungle');
  Object.keys(api.tiles).forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    if (!api.land(x, y)) delete api.tiles[k];
  });
  api.fill(11, 17, 25, 25, 't:cobble'); // the courtyard
  api.fill(14, 6, 22, 15, 't:brick'); // inside
  wall(api, 10, 26, 16, [17, 18]);
  wall(api, 13, 23, 10, [17, 18]);
  for (let y = 5; y <= 15; y++) {
    api.tiles[`13,${y}`] = 't:mountain_1';
    api.tiles[`23,${y}`] = 't:mountain_2';
  }
  wall(api, 13, 23, 5);
  api.keep(10, 5, 26, 26);
  api.keep(17, 27, 20, 34);
  api.keep(7, 13, 9, 15);
  api.keep(27, 13, 29, 15);
  api.keep(9, 28, 11, 30);
  api.put('torch', 14, 14);
  api.put('torch', 22, 14);
  api.put('torch', 15, 8);
  api.put('torch', 21, 8);
  api.put('statue_head', 17, 21);
  api.scatter('tree', 30, (x, y) => !(x > 9 && x < 27 && y > 4 && y < 27));
  api.scatter('palm', 12, (x, y) => !(x > 9 && x < 27 && y > 4 && y < 27));
  api.scatter('bush', 14);
  api.scatter('mushrooms', 10);
  api.scatter('flowers', 8);
  api.scatter('stump', 4);
  api.put('animal_parrot_green', 7, 18);
  api.put('animal_frog', 12, 28);
  api.put('animal_parrot_red', 29, 27);
  api.put('rowboat', 17, 34);
  write('temple', finish());
}

// ---------------------------------------------------------------- Thieves' Rock (heist, stealth)
{
  seed = 53;
  const { api, finish } = island({
    name: 'Thieves’ Rock',
    w: 34,
    h: 32,
    shape: blob(17, 15, 15, 13, 0.08),
    ground: 1,
    expedition: {
      id: 'heist',
      climate: { season: 'summer', weather: 'clear' },
      sub: 'guards, a ledger and a vault',
      outro: 'The vault swings open and the guards never knew. The loot is greasy and bent, so bring it home to be cleaned.',
      goals: [
        { text: 'Sneak to the shed and read the ledger (hide in the long grass)', until: 'ledger' },
        { text: 'Throw the breaker switch in the north-east', until: 'power' },
        { text: 'Open the vault at the back', until: 'final' },
      ],
      spots: [
        { k: 'note', x: 7, y: 10, title: 'The ledger', from: 'In the shed', text: 'A ledger of stolen goods, with a note on the last page: “Vault panel code 3-1-4. Switch the breaker off first, and the back gate opens.”', sets: 'ledger', button: 'Take the page' },
        { k: 'lever', x: 27, y: 9, needs: 'ledger', locked: 'The panel wants a code. The ledger might have it.', sets: 'power' },
        { k: 'gate', x: 16, y: 6, w: 2, needs: 'power', opens: 'Somewhere, a gate unlocks with a clunk.' },
        { k: 'chest', x: 16, y: 3, loot: ['mineral', 'mineral', 'fossil'], final: true, says: 'Hidden away from honest eyes.' },
        { k: 'dig', x: 7, y: 21, collection: 'mineral' },
        { k: 'dig', x: 27, y: 21, collection: 'mineral' },
      ],
      patrols: [
        { kind: 'guard', path: [[11, 16], [23, 16], [23, 12], [11, 12]], sight: 84, speed: 34 },
        { kind: 'guard', path: [[8, 8], [8, 14], [14, 14], [14, 8]], sight: 80, speed: 30 },
        { kind: 'guard', path: [[20, 20], [28, 20], [28, 8], [20, 8]], sight: 80, speed: 32 },
      ],
    },
  });
  api.fill(0, 0, 33, 31, 't:rock_2');
  Object.keys(api.tiles).forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    if (!api.land(x, y)) delete api.tiles[k];
  });
  api.fill(5, 8, 10, 12, 't:cobble'); // the shed yard
  api.fill(14, 2, 19, 5, 't:brick'); // the vault
  wall(api, 12, 21, 6, [16, 17]);
  for (let y = 2; y <= 5; y++) {
    api.tiles[`13,${y}`] = 't:mountain_1';
    api.tiles[`20,${y}`] = 't:mountain_2';
  }
  wall(api, 13, 20, 1);
  api.keep(14, 2, 19, 6);
  api.keep(15, 22, 19, 30);
  api.keep(5, 8, 10, 12);
  api.keep(26, 8, 28, 10);
  api.keep(6, 20, 8, 22);
  api.keep(26, 20, 28, 22);
  // cover: long grass the guards cannot see into
  for (let x = 12; x <= 22; x += 1) if (x % 4 !== 0) api.put('tall_grass', x, 18);
  for (let y = 9; y <= 15; y++) api.put('tall_grass', 16, y);
  for (let y = 9; y <= 19; y++) api.put('tall_grass', 25, y);
  for (let x = 6; x <= 12; x++) api.put('tall_grass', x, 15);
  api.put('crate', 6, 9);
  api.put('crate', 9, 9);
  api.put('barrel', 9, 11);
  api.put('lamp_post', 11, 9);
  api.put('lamp_post', 11, 17);
  api.put('lamp_post', 23, 17);
  api.scatter('rock_big', 5, (x, y) => y > 8);
  api.scatter('boulder', 5);
  api.scatter('rock_small', 8);
  api.scatter('bush', 8);
  api.scatter('pine', 8);
  api.put('animal_cat_black', 12, 22);
  api.put('tent', 3, 4);
  api.put('rowboat', 16, 30);
  write('heist', finish());
}

// ---------------------------------------------------------------- The Frozen North (ice cave, mammoth)
{
  seed = 61;
  const { api, finish } = island({
    name: 'The Frozen North',
    w: 36,
    h: 34,
    shape: blob(18, 17, 16, 15, 0.08),
    ground: 1,
    expedition: {
      id: 'north',
      climate: { season: 'winter', weather: 'snow' },
      sub: 'an ice cave and a mammoth',
      outro: 'The ice cave gives up its treasure and the mammoth’s bones are in your hands. Everything is frozen and filthy, so bring it home to be cleaned.',
      goals: [
        { text: 'Chip out the three mammoth bones from the ice', until: 'bones', tally: 'bones' },
        { text: 'The ice cave opens. Open the chest inside', until: 'final' },
      ],
      clock: { seconds: 95, label: 'Blizzard', msg: 'A blizzard! You stumble back to the boat. What you dug stays dug.' },
      spots: [
        { k: 'dig', x: 8, y: 15, collection: 'fossil', tally: 'bones' },
        { k: 'dig', x: 28, y: 14, collection: 'fossil', tally: 'bones' },
        { k: 'dig', x: 14, y: 24, collection: 'fossil', tally: 'bones' },
        { k: 'gate', x: 17, y: 9, w: 2, needs: 'bones', opens: 'The ice cracks and the cave mouth opens.' },
        { k: 'chest', x: 17, y: 5, loot: ['mineral', 'mineral', 'fossil'], final: true, says: 'Frozen solid, glittering and very cold.' },
      ],
    },
  });
  api.fill(0, 0, 35, 33, 't:snow');
  Object.keys(api.tiles).forEach((k) => {
    const [x, y] = k.split(',').map(Number);
    if (!api.land(x, y)) delete api.tiles[k];
  });
  for (let i = 0; i < 70; i++) {
    const x = 3 + Math.floor(rnd() * 30);
    const y = 4 + Math.floor(rnd() * 24);
    if (api.land(x, y) && !(x > 12 && x < 24 && y < 11)) api.tiles[`${x},${y}`] = 't:ice';
  }
  api.fill(14, 3, 21, 8, 't:ice'); // inside the cave
  wall(api, 11, 24, 9, [17, 18]);
  for (let y = 2; y <= 8; y++) {
    api.tiles[`13,${y}`] = 't:mountain_snow';
    api.tiles[`22,${y}`] = 't:mountain_snow';
  }
  wall(api, 13, 22, 2);
  api.keep(12, 2, 23, 10);
  api.keep(16, 25, 20, 32);
  [[8, 15], [28, 14], [14, 24]].forEach(([x, y]) => api.keep(x - 1, y - 1, x + 1, y + 1));
  api.put('torch', 15, 7);
  api.put('torch', 20, 7);
  api.scatter('pine', 20, (x, y) => !(x > 11 && x < 25 && y < 11));
  api.scatter('rock_big', 4, (x, y) => y > 10);
  api.scatter('rock_small', 8);
  api.scatter('rocks_pile', 5);
  api.scatter('stump', 3);
  api.put('mammoth_skeleton', 5, 19);
  api.put('tent', 26, 26);
  api.put('animal_dog_golden', 21, 27);
  api.put('person_wander', 15, 27);
  for (let i = 0; i < 6; i++) api.scatter('ice_block', 1);
  api.put('rowboat', 17, 32);
  write('north', finish());
}
