// The tile garden: every outdoor tile laid out in rows east of the island so
// you can walk past all of them. Each row of pieces stands above a street
// (one tile wide) paved with a different path tile, with a name on it under
// every piece; floor tiles (ground, water, paths) are laid as patches you
// walk across.
// layoutShowcase() only plans it (in tile units); IslandScene builds it.

const FLOOR_GROUPS = ['Ground', 'Paths', 'Water'];
const SKIP_GROUP = /on |bank|Shoreline/; // the 16-piece corner sets
const STREETS = ['path_brick', 'path_flagstone', 'path_gravel', 'path_boardwalk', 'cobble', 'path_mosaic', 'dirt_1', 'path_sand', 'rock_1', 'path_dirt_track', 'sand_wet', 'dirt_2', 'rock_2'];
const OVER_WATER = ['bubbles', 'lily', 'water_rock']; // drawn on top of water

const tidy = (label) => label.replace(/\s*\(.*?\)\s*/g, ' ').trim();

// x0, y0: the top-left tile of the garden; width in tiles.
export function layoutShowcase(tiles, x0, y0, width) {
  const T = 32;
  const plan = { floors: [], items: [], streets: [], labels: [], headers: [], x0, y0, width };
  const groups = {};
  Object.entries(tiles).forEach(([name, t]) => {
    if (SKIP_GROUP.test(t.group) || name.includes('@')) return;
    (groups[t.group] ||= []).push([name, t]);
  });
  const inner0 = x0 + 2; // a walkway down each side
  const inner1 = x0 + width - 3;
  let y = y0;
  let street = 0;
  const addStreet = (row) => {
    plan.streets.push({ y: row, x0, x1: x0 + width - 1, tile: STREETS[street++ % STREETS.length] });
  };

  // Floors first: 2×2 patches in a line, each one a tile you can walk on.
  const floors = FLOOR_GROUPS.flatMap((g) => groups[g] || []);
  plan.headers.push({ x: inner0, y, text: 'Floors & water' });
  y += 1;
  for (let i = 0; i < floors.length; ) {
    let x = inner0;
    while (i < floors.length && x + 2 <= inner1 + 1) {
      const [name, t] = floors[i];
      plan.floors.push({ name, x, y, w: 2, h: 2, base: OVER_WATER.includes(name) ? 'water' : null, solid: t.walk === 'water' || t.walk === 'block' });
      plan.labels.push({ x: x + 1, y: y + 2, text: tidy(t.label), w: 2 });
      x += 2;
      i++;
    }
    y += 3; // the patches, then a line for their names
  }
  addStreet(y);
  y += 1;

  // Everything else stands in rows above a street.
  Object.entries(groups).forEach(([group, list]) => {
    if (FLOOR_GROUPS.includes(group)) return;
    plan.headers.push({ x: inner0, y, text: group });
    y += 1;
    for (let i = 0; i < list.length; ) {
      const row = [];
      let x = inner0;
      let rh = 1;
      while (i < list.length) {
        const [name, t] = list[i];
        const tw = Math.ceil(t.w / T);
        const th = Math.ceil(t.h / T);
        if (x + tw - 1 > inner1 && row.length) break;
        row.push({ name, x, tw, th, label: tidy(t.label) });
        rh = Math.max(rh, th);
        x += tw + 1;
        i++;
      }
      const base = y + rh - 1; // the row the pieces stand on
      row.forEach((r) => {
        plan.items.push({ name: r.name, x: r.x, y: base });
        plan.labels.push({ x: r.x + r.tw / 2, y: base + 1, text: r.label, w: r.tw + 1 });
      });
      addStreet(base + 1);
      y = base + 2;
    }
    y += 1;
  });
  plan.height = y - y0;
  return plan;
}
