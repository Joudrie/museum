// People parts beyond the first set (see docs/PEOPLE-SPRITES.md). Two kinds of layer:
// - looks drawn on the row maps in art.js (hats, hair, faces, outfits, legs, accessories),
//   in the same pixel style and the same order as the first ones;
// - builds, things people carry or set down, and the poses they work in, drawn on the
//   full 32-wide grid once every look is on.
// A look made only of the first options comes out exactly as it did before.

const T = 32;
const BASE = 27; // rows in a person before hats and builds

// ---------- Names (merged into the menus in art.js) ----------
export const MORE_HATS = {
  bucket: 'Bucket hat', souwester: 'Sou’wester', captain: 'Captain’s cap', sailor: 'Sailor cap', bandana: 'Bandana', flatcap: 'Flat cap',
  fedora: 'Fedora', pith: 'Pith helmet', pompom: 'Pom-pom hat', visor: 'Visor', fur: 'Fur hat', hood: 'Hood up', miner: 'Miner’s helmet',
  welder: 'Welding mask', chef: 'Chef’s hat', hairnet: 'Hairnet', pirate: 'Pirate hat', cowboy: 'Cowboy hat', headband: 'Headband', headphones: 'Headphones',
  swimcap: 'Swim cap', campaign: 'Ranger hat', wrap: 'Head wrap', veil: 'Veil', helmet: 'Bike helmet', police: 'Police cap', paperhat: 'Paper hat', tiara: 'Tiara',
  kingcrown: 'Crown',
};
export const MORE_HAIR = {
  pompadour: 'Pompadour', slick: 'Slicked back', spiky: 'Spiky', horseshoe: 'Balding', mullet: 'Mullet', bowl: 'Bowl cut', pixie: 'Pixie',
  manbun: 'Man bun', sidepony: 'Side ponytail', braid: 'Braid', braids: 'Two braids', dreads: 'Locs', afropuff: 'Afro puff', spacebuns: 'Space buns',
  cornrows: 'Cornrows', wavy: 'Long wavy',
};
// new hairstyles drawn on top of one of the first ones
export const HAIR_BASE = { wavy: 'long', dreads: 'long', braids: 'short', sidepony: 'short', mullet: 'short', manbun: 'short' };
export const MORE_FACIAL = { stubble: 'Stubble', sideburns: 'Sideburns', muttonchops: 'Mutton chops', walrus: 'Walrus mustache', bigbeard: 'Big beard', wizard: 'Long beard', soulpatch: 'Soul patch' };
export const MORE_GLASSES = { square: 'Square glasses', goggles: 'Safety goggles', monocle: 'Monocle', patch: 'Eye patch', half: 'Reading glasses', divemask: 'Diving mask' };
export const MORE_OUTFITS = {
  coveralls: 'Coveralls', overalls: 'Overalls', hivis: 'Hi-vis vest', oilskins: 'Oilskins', waders: 'Waders', wetsuit: 'Wetsuit', sailor: 'Sailor top',
  captain: 'Captain’s coat', striped: 'Striped shirt', flannel: 'Flannel shirt', fieldvest: 'Field vest', trunks: 'Swim trunks', swimsuit: 'Swimsuit',
  labcoat: 'Lab coat', blazer: 'Blazer', cardigan: 'Cardigan', turtleneck: 'Turtleneck', parka: 'Parka', uniform: 'Uniform shirt', robe: 'Robe', mummy: 'Mummy wrap',
  varsity: 'Varsity jacket', tracksuit: 'Track suit', chefwhites: 'Chef’s whites',
};
export const MORE_ACCESSORIES = {
  toolbelt: 'Tool belt', keyring: 'Key ring', lanyard: 'Lanyard', backpack: 'Backpack', whistle: 'Whistle', lifejacket: 'Life jacket', radio: 'Radio',
  gloves: 'Gloves', earmuffs: 'Ear defenders', towel: 'Towel', tank: 'Air tank', hook: 'Hook hand', sash: 'Sash', mailbag: 'Mail bag',
};
export const LEGS = { trousers: 'Trousers', shorts: 'Shorts', rolled: 'Rolled up', boots: 'Tall boots', peg: 'Peg leg' };
export const FEET = { shoes: 'Shoes', bare: 'Bare feet' };
export const BUILDS = { standard: 'Standard', broad: 'Broad', tall: 'Tall', short: 'Short' };

// Colors for props and new trims; a person can set any of them.
export const PART_PAL = { n: '#a0703f', N: '#5e3b22', a: '#cfd4da', A: '#7d8590', r: '#e8e0c8', l: '#eef3f6', v: '#6aaee0', V: '#e8762c', P: '#e8b02a', B: '#3d6fb6', f: '#a8c4d0', j: '#fff2a0', x: '#c8362e', I: '#8a6a4a' };

// ---------- Row-map helpers (rows stay centred, like the first looks) ----------
const isSkin = (c) => c === 's' || c === 'S';
const cloth = (c) => c === 'c' || c === 'C' || c === 'd' || c === 'w' || c === 'g';
function rel(out) {
  const set = (r, i, ch) => out[r] && i >= 0 && i < out[r].length && out[r][i] !== 'o' && (out[r][i] = ch);
  const swap = (rows, from, to) => rows.forEach((r) => out[r]?.forEach((c, i) => from.includes(c) && (out[r][i] = to)));
  const len = (r) => out[r].length;
  return { set, swap, len };
}

// ---------- Faces: more facial hair and glasses (after the outfit, so beards sit on top) ----------
export function moreFace(out, view, look) {
  const { set, len } = rel(out);
  const f = look.facial;
  if (MORE_FACIAL[f] && view !== 'up') {
    const front = view === 'down';
    const skinTo = (r, from, to, ch = 'F') => out[r]?.forEach((c, i) => i >= from && i <= to && isSkin(c) && (out[r][i] = ch));
    const sideburns = (rows) => rows.forEach((r) => (front ? [1, len(r) - 2] : [4]).forEach((i) => isSkin(out[r][i]) && set(r, i, 'F')));
    const beard = () => {
      [9, 10].forEach((r) => skinTo(r, 0, 99));
      sideburns([7, 8]);
    };
    // stubble is its own shade, between skin and hair (`m`, set in makeCharacter)
    if (f === 'stubble') [9, 10].forEach((r) => out[r].forEach((c, i) => isSkin(c) && (front ? r === 10 || i <= 2 || i >= len(r) - 3 : i >= 3) && (out[r][i] = 'm')));
    if (f === 'sideburns') sideburns([6, 7, 8]);
    if (f === 'muttonchops') {
      sideburns([6, 7, 8]);
      if (front) {
        skinTo(9, 1, 2);
        skinTo(9, len(9) - 3, len(9) - 2);
        skinTo(10, 2, 3);
        skinTo(10, len(10) - 4, len(10) - 3);
      } else skinTo(9, 3, 4);
    }
    if (f === 'walrus') {
      const mid = front ? Math.floor(len(9) / 2) : len(9) - 4;
      [9, 10].forEach((r) => skinTo(r, mid - 3, mid + (front ? 2 : 1)));
    }
    if (f === 'soulpatch') {
      const mid = front ? Math.floor(len(10) / 2) : len(10) - 4;
      skinTo(10, mid - 1, front ? mid : mid - 1);
    }
    if (f === 'bigbeard' || f === 'wizard') {
      beard();
      out[11] = out[11].map((c, i) => (c !== 'o' && i > 1 && i < out[11].length - 2 ? 'F' : c));
      const chest = f === 'wizard' ? (front ? [[12, 3], [13, 4], [14, 4], [15, 5], [16, 5], [17, 6]] : [[12, 3], [13, 4], [14, 5], [15, 6], [16, 6]]) : front ? [[12, 4], [13, 5]] : [[12, 4]];
      chest.forEach(([r, k]) => {
        if (!out[r]) return;
        if (front) for (let i = k; i < len(r) - k; i++) set(r, i, 'F');
        else for (let i = k; i < len(r) - 1; i++) set(r, i, 'F');
      });
    }
  }
  const g = look.glasses;
  if (MORE_GLASSES[g] && view !== 'up') {
    const eyes = (r) => out[r].map((c, i) => (c === 'e' ? i : -1)).filter((i) => i >= 0);
    const e6 = eyes(6);
    if (!e6.length) return;
    const k = (r, list, ch = 'k') => list.forEach((i) => set(r, i, ch));
    if (view === 'down') {
      const [a, b] = [e6[0], e6.at(-1)];
      if (g === 'square') {
        [5, 8].forEach((r) => k(r, [a - 1, a, a + 1, b - 1, b, b + 1], 'A'));
        [6, 7].forEach((r) => k(r, [a - 1, a + 1, b - 1, b + 1], 'A'));
        k(6, [a + 2, b - 2], 'A');
      }
      if (g === 'half') {
        k(7, [a - 1, a + 1, b - 1, b + 1], 'A');
        k(8, [a - 1, a, a + 1, b - 1, b, b + 1], 'A');
      }
      if (g === 'goggles' || g === 'divemask') {
        const lo = a - 1;
        const hi = b + 1;
        const rim = g === 'goggles' ? 'A' : 'k';
        [5, 8].forEach((r) => {
          for (let i = lo; i <= hi; i++) set(r, i, rim);
        });
        [6, 7].forEach((r) => {
          for (let i = lo; i <= hi; i++) set(r, i, i === lo || i === hi || (g === 'goggles' && (i === a + 2 || i === b - 2)) ? rim : out[r][i] === 'e' ? 'e' : 'v');
          set(r, lo - 1, 'k');
          set(r, hi + 1, 'k');
        });
      }
      if (g === 'monocle') {
        k(5, [b - 1, b, b + 1], 'Y');
        [6, 7].forEach((r) => k(r, [b - 1, b + 1], 'Y'));
        k(8, [b], 'Y');
        k(9, [b + 1], 'Y');
      }
      if (g === 'patch') {
        [6, 7].forEach((r) => k(r, [a - 1, a, a + 1]));
        for (let i = a + 1; i <= b + 2; i++) set(5, i, 'k');
        k(4, [b + 3]);
      }
    } else {
      const e = e6.at(-1);
      if (g === 'square') {
        [5, 8].forEach((r) => k(r, [e - 1, e, e + 1], 'A'));
        [6, 7].forEach((r) => k(r, [e - 1, e + 1], 'A'));
        k(6, [e - 2, e - 3, e - 4], 'A');
      }
      if (g === 'half') {
        k(7, [e - 1, e + 1], 'A');
        k(8, [e - 1, e, e + 1], 'A');
        k(7, [e - 2, e - 3], 'A');
      }
      if (g === 'goggles' || g === 'divemask') {
        const rim = g === 'goggles' ? 'A' : 'k';
        [5, 8].forEach((r) => k(r, [e - 2, e - 1, e, e + 1], rim));
        [6, 7].forEach((r) => {
          k(r, [e - 2], rim);
          k(r, [e - 1], 'v');
          k(r, [e + 1], rim);
          k(r, [e - 3, e - 4, e - 5]);
        });
      }
      if (g === 'monocle') {
        k(5, [e - 1, e, e + 1], 'Y');
        [6, 7].forEach((r) => k(r, [e - 1, e + 1], 'Y'));
        k(8, [e], 'Y');
      }
      if (g === 'patch') {
        [6, 7].forEach((r) => k(r, [e - 1, e, e + 1]));
        for (let i = e - 5; i < e - 1; i++) set(5, i, 'k');
      }
    }
  }
}

// ---------- Outfits, legs and feet (straight after the first outfits) ----------
export function moreOutfit(out, view, look) {
  const { set, swap, len } = rel(out);
  const style = look.outfit;
  const torso = [12, 13, 14, 15, 16, 17, 18, 19, 20];
  const legs = [21, 22, 23, 24];
  const front = view === 'down';
  const side = view === 'side';
  // cells of the body (not the outline, not a hand)
  const body = (r, fn) => out[r]?.forEach((c, i) => c !== 'o' && !isSkin(c) && c !== '.' && fn(c, i));
  const arms = (rows, ch) => !side && rows.forEach((r) => [1, len(r) - 2].forEach((i) => out[r][i] !== 's' && set(r, i, ch)));
  const mid = (r) => Math.floor(len(r) / 2);
  const tails = (rows = [21, 22]) => rows.forEach((r) => [1, 2, len(r) - 3, len(r) - 2].forEach((i, k) => set(r, i, k === 0 ? 'C' : k === 3 ? 'd' : 'c')));
  if (MORE_OUTFITS[style]) {
    if (style === 'coveralls') {
      swap(torso, ['w', 'g'], 'c');
      swap([11], ['w'], 'c');
      swap(legs, ['p'], 'c');
      if (front) {
        [12, 13, 14, 15, 16, 17, 18, 19].forEach((r) => set(r, mid(r), 'd'));
        set(14, 3, 'w');
        set(14, 4, 'w');
      }
      if (side) [13, 14, 15, 16, 17].forEach((r) => set(r, len(r) - 3, 'd'));
    }
    if (style === 'overalls' || style === 'waders') {
      if (front) {
        [12, 13, 14, 15, 16, 17].forEach((r) => body(r, (c, i) => {
          const strap = r < 14 && (i === 3 || i === 4 || i === len(r) - 4 || i === len(r) - 5);
          const bib = r >= 14 && i >= 4 && i <= len(r) - 5;
          out[r][i] = strap || bib ? 'c' : 'w';
        }));
        set(14, 4, 'Y');
        set(14, len(14) - 5, 'Y');
        set(15, mid(15) - 1, 'd');
        set(15, mid(15), 'd');
      } else if (view === 'up') {
        [12, 13, 14, 15, 16, 17].forEach((r) => body(r, (c, i) => (out[r][i] = 'w')));
        [[12, 3], [13, 4], [14, 5], [15, 6]].forEach(([r, i]) => {
          set(r, i, 'c');
          set(r, len(r) - 1 - i, 'c');
        });
        [16, 17].forEach((r) => {
          for (let i = 5; i <= len(r) - 6; i++) set(r, i, 'c');
        });
        swap([11], ['c'], 'w');
      } else {
        [12, 13, 14, 15, 16, 17].forEach((r) => body(r, (c, i) => (out[r][i] = i >= len(r) - 5 ? 'c' : 'w')));
        set(12, 3, 'c');
      }
      swap(legs, ['p'], 'c');
      if (style === 'waders') swap([25], ['b'], 'd');
    }
    if (style === 'hivis') {
      [12, 13, 14, 15, 16, 17, 18, 19].forEach((r) => body(r, (c, i) => (out[r][i] = 'c')));
      arms([12, 13, 14, 15, 16, 17], 'w');
      if (front) {
        [5, 6, 7, 8].forEach((i) => set(12, i, 'w'));
        [6, 7].forEach((i) => set(13, i, 'w'));
      }
      swap([20], ['c', 'C', 'd'], 'w');
      [15, 17].forEach((r) => body(r, (c, i) => !(c === 'w' && !side && (i === 1 || i === len(r) - 2)) && (out[r][i] = 'a')));
      if (!side) [15, 17].forEach((r) => [1, len(r) - 2].forEach((i) => set(r, i, 'w')));
    }
    if (style === 'oilskins') {
      swap(torso, ['w', 'g'], 'c');
      swap([11], ['w'], 'c');
      swap(legs, ['p'], 'c');
      if (front) [13, 15, 17].forEach((r) => set(r, mid(r) - 1, 'k'));
      if (side) [13, 15, 17].forEach((r) => set(r, len(r) - 3, 'k'));
      tails();
    }
    if (style === 'wetsuit') {
      swap(torso, ['w', 'g'], 'c');
      swap([11], ['w'], 'c');
      swap(legs, ['p'], 'c');
      swap([25], ['b'], 'd');
      arms([12, 13, 14, 15, 16, 17], 'g');
      if (side) body(13, (c, i) => (out[13][i] = 'g'));
    }
    if (style === 'sailor') {
      swap(torso, ['w', 'g'], 'c');
      swap([11], ['w', 'c'], 'g');
      if (front) {
        [[12, [4, 5, 8, 9], 'g'], [12, [6, 7], 'X'], [13, [5, 8], 'g'], [13, [6, 7], 'X'], [14, [6], 'X']].forEach(([r, is, ch]) => is.forEach((i) => set(r, i, ch)));
      } else if (view === 'up') {
        [12, 13].forEach((r) => body(r, (c, i) => i > 1 && i < len(r) - 2 && (out[r][i] = 'g')));
        body(14, (c, i) => i > 1 && i < len(14) - 2 && (out[14][i] = 'w'));
      } else {
        [1, 2, 3].forEach((i) => set(12, i, 'g'));
        [1, 2].forEach((i) => set(13, i, 'g'));
        set(13, len(13) - 3, 'X');
      }
      arms([17], 'g');
    }
    if (style === 'captain') {
      swap(torso, ['g'], 'c');
      swap([14, 15, 16, 17, 18, 19, 20], ['w'], 'c');
      if (front) {
        [14, 16, 18].forEach((r) => [4, len(r) - 5].forEach((i) => set(r, i, 'Y')));
        arms([17], 'Y');
      } else if (side) [14, 16].forEach((r) => set(r, len(r) - 3, 'Y'));
      else swap([12, 13], ['w'], 'c');
      tails();
    }
    if (style === 'striped' || style === 'flannel') {
      swap(torso, ['w', 'g'], 'c');
      if (view !== 'up') swap([11], ['w'], style === 'striped' ? 's' : 'c');
      if (style === 'striped') [13, 15, 17, 19].forEach((r) => body(r, (c, i) => (out[r][i] = 'w')));
      else torso.forEach((r) => body(r, (c, i) => (r % 3 === 0 || i % 3 === 0) && (out[r][i] = 'd')));
    }
    if (style === 'fieldvest') {
      [12, 13, 14, 15, 16, 17, 18, 19].forEach((r) => body(r, (c, i) => (out[r][i] = 'c')));
      arms([12, 13, 14, 15, 16, 17], 'w');
      if (front) {
        torso.slice(0, 8).forEach((r) => [mid(r) - 1, mid(r)].forEach((i) => set(r, i, 'w')));
        [[15, [3, 4]], [16, [3, 4]], [18, [3, 4]]].forEach(([r, is]) => is.forEach((i) => {
          set(r, i, 'd');
          set(r, len(r) - 1 - i, 'd');
        }));
      } else if (side) {
        torso.slice(0, 8).forEach((r) => set(r, len(r) - 2, 'w'));
        set(16, len(16) - 4, 'd');
        set(16, len(16) - 5, 'd');
      }
      swap([20], ['c', 'C', 'd'], 'w');
    }
    if (style === 'trunks') {
      [11, 12, 13, 14, 15, 16, 17, 18, 19].forEach((r) => body(r, (c, i) => (out[r][i] = c === 'd' ? 'S' : 's')));
      if (front) set(17, mid(17) - 1, 'S');
      swap([21, 22], ['p'], 'c');
      swap([23, 24], ['p'], 's');
      swap([25], ['b'], 's');
    }
    if (style === 'swimsuit') {
      swap(torso, ['w', 'g'], 'c');
      swap([11], ['w', 'c'], 's');
      arms([12, 13, 14, 15, 16, 17, 18, 19], 's');
      if (!side) [2, 3, len(12) - 4, len(12) - 3].forEach((i) => set(12, i, 's'));
      swap([21], ['p'], 'c');
      swap([22, 23, 24], ['p'], 's');
      swap([25], ['b'], 's');
    }
  }
  if (style === 'labcoat') {
    // a long white coat over the shirt and tie, with pockets
    if (front) [3, 4].forEach((i) => {
      set(18, i, 'd');
      set(18, len(18) - 1 - i, 'd');
    });
    if (side) set(18, len(18) - 3, 'd');
    tails([21, 22, 23]);
  }
  if (style === 'blazer') swap([12, 13, 14, 15, 16, 17], ['g'], 'w');
  if (style === 'cardigan') {
    swap(torso, ['w', 'g'], 'c');
    if (front) {
      torso.slice(0, 8).forEach((r) => [mid(r) - 1, mid(r)].forEach((i) => set(r, i, 'w')));
      [13, 15, 17].forEach((r) => set(r, mid(r) - 2, 'Y'));
    } else if (side) torso.slice(0, 8).forEach((r) => set(r, len(r) - 2, 'w'));
  }
  if (style === 'turtleneck') {
    swap(torso, ['w', 'g'], 'c');
    swap([11], ['w'], 'c');
  }
  if (style === 'parka') {
    swap(torso, ['w', 'g'], 'c');
    swap([11], ['w', 'c'], 'r');
    [14, 17].forEach((r) => body(r, (c, i) => (side || (i > 1 && i < len(r) - 2)) && (out[r][i] = 'd')));
    tails();
  }
  if (style === 'uniform') {
    swap(torso, ['w', 'g'], 'c');
    swap([11], ['w'], 'c');
    if (front) {
      [[14, [3, 4]], [14, [len(14) - 5, len(14) - 4]]].forEach(([r, is]) => is.forEach((i) => set(r, i, 'd')));
      set(15, 3, 'Y');
      set(12, mid(12) - 2, 'd');
      set(12, mid(12) + 1, 'd');
    }
    if (side) set(14, len(14) - 4, 'd');
    out[20].forEach((c, i) => c !== 'o' && !isSkin(c) && (out[20][i] = 'N'));
    if (front) set(20, mid(20), 'Y');
  }
  if (style === 'robe') {
    swap(torso, ['w', 'g'], 'c');
    swap([11], ['w'], 'c');
    [21, 22, 23, 24].forEach((r) => {
      for (let i = 1; i < len(r) - 1; i++) out[r][i] = r === 24 ? 'd' : 'c';
    });
    body(18, (c, i) => (side || (i > 1 && i < len(18) - 2)) && (out[18][i] = 'r'));
  }
  if (style === 'varsity') {
    swap(torso, ['w', 'g'], 'c');
    swap([11], ['w'], 'g');
    arms([12, 13, 14, 15, 16, 17], 'w');
    swap([20], ['c', 'C', 'd'], 'g');
    if (front) [14, 15].forEach((r) => set(r, 3, 'Y'));
  }
  if (style === 'tracksuit') {
    swap(torso, ['w', 'g'], 'c');
    swap([11], ['w'], 'c');
    swap(legs, ['p'], 'c');
    if (front) [11, 12, 13, 14].forEach((r) => set(r, mid(r), 'w'));
    if (!side) legs.forEach((r) => [1, len(r) - 2].forEach((i) => set(r, i, 'w')));
    else legs.forEach((r) => set(r, Math.floor(len(r) / 2), 'w'));
  }
  if (style === 'chefwhites') {
    swap(torso, ['w', 'g'], 'c');
    swap([11], ['w'], 'c');
    if (front) [13, 15, 17].forEach((r) => [4, len(r) - 5].forEach((i) => set(r, i, 'k')));
    if (side) [13, 15, 17].forEach((r) => set(r, len(r) - 3, 'k'));
  }
  if (style === 'mummy') {
    // wrapped from head to toe; only the eyes show
    out.forEach((row, r) => row.forEach((c, i) => c !== 'o' && c !== 'e' && c !== '.' && (row[i] = (r + Math.floor(i / 3)) % 3 === 0 ? 'a' : 'r')));
  }
  // legs and feet
  const L = look.legs;
  if (L === 'shorts') swap([23, 24], ['p'], 's');
  if (L === 'rolled') swap([24], ['p'], 's');
  if (L === 'boots') swap([23, 24], ['p', 'c', 's'], 'b');
  if (L === 'peg') {
    // the right leg is a wooden peg below the knee
    const put = (r, at) => out[r] && Object.entries(at).forEach(([i, ch]) => (out[r][+i] = ch));
    if (side) {
      [23, 24].forEach((r) => put(r, { 5: 'o', 6: 'n', 7: 'N', 8: 'o', 9: '.' }));
      put(25, { 6: 'o', 7: 'n', 8: 'N', 9: 'o', 10: '.', 11: '.' });
      put(26, { 10: '.', 11: '.' });
    } else {
      const m = (i) => (front ? i : len(23) - 1 - i);
      [23, 24, 25].forEach((r) => put(r, { [m(0)]: '.', [m(1)]: 'o', [m(2)]: front ? 'n' : 'N', [m(3)]: front ? 'N' : 'n', [m(4)]: 'o', [m(5)]: '.', [m(6)]: 'o' }));
      put(26, { [m(0)]: '.', [m(5)]: '.' });
    }
  }
  if (look.feet === 'bare') swap([25], ['b'], 's');
}

// ---------- More accessories (after the first ones) ----------
export function moreAccessories(out, view, look) {
  const { set, len } = rel(out);
  const front = view === 'down';
  const side = view === 'side';
  const mid = (r) => Math.floor(len(r) / 2);
  const list = [look.acc, look.acc2, look.acc3].filter((a) => MORE_ACCESSORIES[a]);
  list.forEach((acc) => {
    if (acc === 'toolbelt') {
      out[20].forEach((c, i) => i > 0 && i < len(20) - 1 && c !== 'o' && (out[20][i] = 'N'));
      if (front) [mid(20) - 1, mid(20)].forEach((i) => set(20, i, 'a'));
      if (side) [21, 22].forEach((r) => [len(r) - 4, len(r) - 3].forEach((i) => set(r, i, 'n')));
      else [21, 22].forEach((r) => [1, 2, len(r) - 3, len(r) - 2].forEach((i) => set(r, i, 'n')));
    }
    if (acc === 'keyring') {
      if (front) [[20, 3], [21, 2], [21, 3]].forEach(([r, i]) => set(r, i, 'a'));
      else if (side) [[20, 3], [21, 3], [21, 4]].forEach(([r, i]) => set(r, i, 'a'));
      else [[20, len(20) - 4], [21, len(21) - 3]].forEach(([r, i]) => set(r, i, 'a'));
    }
    if (acc === 'lanyard') {
      if (front) {
        [mid(12) - 2, mid(12) + 1].forEach((i) => set(12, i, 'X'));
        [mid(13) - 1, mid(13)].forEach((i) => set(13, i, 'X'));
        [14, 15].forEach((r) => [mid(r) - 1, mid(r)].forEach((i) => set(r, i, 'Q')));
      } else if (side) {
        set(12, len(12) - 4, 'X');
        set(13, len(13) - 3, 'X');
        set(14, len(14) - 3, 'Q');
        set(15, len(15) - 3, 'Q');
      } else [mid(11) - 1, mid(11)].forEach((i) => set(11, i, 'X'));
    }
    if (acc === 'backpack' || acc === 'tank') {
      const ch = acc === 'tank' ? 'a' : 'K';
      if (front) [12, 13, 14, 15, 16, 17].forEach((r) => [3, len(r) - 4].forEach((i) => set(r, i, acc === 'tank' ? 'k' : 'K')));
      else if (view === 'up') {
        for (let r = 12; r <= 19; r++) for (let i = 3; i <= len(r) - 4; i++) set(r, i, r === 12 ? 'k' : ch);
        if (acc === 'tank') [12, 13, 14, 15, 16, 17, 18, 19].forEach((r) => set(r, mid(r) - 1, 'A'));
        else [16, 17].forEach((r) => [mid(r) - 2, mid(r) - 1, mid(r), mid(r) + 1].forEach((i) => set(r, i, 'k')));
      } else {
        for (let r = 12; r <= 19; r++) out[r] = ['o', r === 12 ? 'k' : ch, r === 12 ? 'k' : ch, ...out[r], '.', '.', '.'];
        out[11] = ['o', 'o', 'o', ...out[11], '.', '.', '.'];
        out[20] = ['.', 'o', 'o', ...out[20], '.', '.', '.'];
      }
    }
    if (acc === 'whistle') {
      if (front) {
        [mid(12) - 2, mid(12) + 1].forEach((i) => set(12, i, 'Q'));
        [mid(13) - 1, mid(13)].forEach((i) => set(13, i, 'Q'));
        set(14, mid(14), 'a');
      } else if (side) {
        set(12, len(12) - 3, 'Q');
        set(13, len(13) - 2, 'a');
      }
    }
    if (acc === 'lifejacket') {
      [12, 13, 14, 15, 16, 17, 18, 19].forEach((r) => out[r].forEach((c, i) => c !== 'o' && !isSkin(c) && (side || (i > 1 && i < len(r) - 2)) && (out[r][i] = 'V')));
      if (front) {
        [12, 13, 14, 15, 16, 17, 18, 19].forEach((r) => [mid(r) - 1, mid(r)].forEach((i) => set(r, i, 'k')));
        [14, 17].forEach((r) => [mid(r) - 1, mid(r)].forEach((i) => set(r, i, 'Q')));
      }
      if (view !== 'up') out[11] = out[11].map((c) => (c === 'o' ? c : 'V'));
    }
    if (acc === 'radio') {
      if (front) {
        [13, 14].forEach((r) => [len(r) - 4, len(r) - 3].forEach((i) => set(r, i, 'k')));
        set(12, len(12) - 3, 'k');
      } else if (side) [13, 14].forEach((r) => [len(r) - 4, len(r) - 3].forEach((i) => set(r, i, 'k')));
    }
    if (acc === 'gloves' || acc === 'hook') {
      [18, 19].forEach((r) => out[r]?.forEach((c, i) => {
        if (c !== 's') return;
        const near = side || (front ? i < len(r) / 2 : i > len(r) / 2);
        if (acc === 'gloves') out[r][i] = 'X';
        else if (near) out[r][i] = r === 18 ? 'a' : '.';
      }));
      if (acc === 'hook') {
        const r = 19;
        const i = side ? out[18].indexOf('a') : front ? 1 : len(r) - 2;
        if (i >= 0) set(r, i, 'A');
      }
    }
    if (acc === 'earmuffs') {
      if (side) [5, 6, 7].forEach((r) => [3, 4].forEach((i) => set(r, i, 'X')));
      else [5, 6, 7].forEach((r) => (out[r] = ['o', 'X', ...out[r].slice(1, -1), 'X', 'o']));
    }
    if (acc === 'sash') {
      for (let r = 12; r <= 20; r++) {
        const i = front ? 2 + (r - 12) : len(r) - 3 - (r - 12);
        if (!side) [i, i + (front ? 1 : -1)].forEach((j) => set(r, j, 'X'));
      }
      if (side) [13, 14, 15, 16].forEach((r) => set(r, len(r) - 3, 'X'));
    }
    if (acc === 'mailbag') {
      if (front) {
        for (let r = 12; r <= 18; r++) set(r, len(r) - 3 - (r - 12), 'K');
        [18, 19, 20, 21].forEach((r) => [1, 2, 3, 4].forEach((i) => set(r, i, r === 18 ? 'k' : 'K')));
      } else if (view === 'up') {
        for (let r = 12; r <= 18; r++) set(r, 2 + (r - 12), 'K');
        [18, 19, 20, 21].forEach((r) => [len(r) - 5, len(r) - 4, len(r) - 3, len(r) - 2].forEach((i) => set(r, i, 'K')));
      } else [18, 19, 20, 21].forEach((r) => [1, 2, 3].forEach((i) => set(r, i, r === 18 ? 'k' : 'K')));
    }
    if (acc === 'towel') {
      const is = front ? [2, 3] : view === 'up' ? [len(12) - 4, len(12) - 3] : [2, 3];
      [12, 13, 14, 15, 16].forEach((r) => is.forEach((i) => set(r, r % 2 ? i : i, (r + i) % 2 ? 'X' : 'Q')));
    }
  });
}

// ---------- More hair (after the hats: the top only shows when there's no hat) ----------
// Head rows from here on may be the full 32 wide, so things go at a fixed x.
function wideRow(row) {
  if (row.length === T) return row;
  const a = Array(T).fill('.');
  const off = Math.floor((T - row.length) / 2);
  row.forEach((c, i) => (a[off + i] = c));
  return a;
}
const centred = (str) => [Math.floor((T - str.length) / 2), str];
function painter(out) {
  // paint str at x on row r (' ' leaves a cell as it is, '.' clears it)
  const P = (r, x, str) => {
    if (!out[r]) return;
    out[r] = wideRow(out[r]);
    [...str].forEach((c, i) => c !== ' ' && x + i >= 0 && x + i < T && (out[r][x + i] = c));
  };
  // a whole new row (centred unless [x, str])
  const R = (r, spec) => {
    const [x, str] = typeof spec === 'string' ? centred(spec) : spec;
    out[r] = Array(T).fill('.');
    P(r, x, str);
  };
  const pre = (specs) =>
    specs.map((spec) => {
      const [x, str] = typeof spec === 'string' ? centred(spec) : spec;
      const a = Array(T).fill('.');
      [...str].forEach((c, i) => c !== ' ' && (a[x + i] = c));
      return a.join('');
    });
  // recolour cells in rows
  const cover = (rows, from, to, test = () => true) => rows.forEach((r) => out[r] && (out[r] = wideRow(out[r])).forEach((c, x) => from.includes(c) && test(x, r) && (out[r][x] = to)));
  // the outline steps out a pixel and the old edge becomes `ch`
  const flaps = (rows, ch) => rows.forEach((r) => {
    if (!out[r]) return;
    const row = (out[r] = wideRow(out[r]));
    const xs = row.map((c, x) => (c !== '.' ? x : -1)).filter((x) => x >= 0);
    if (!xs.length) return;
    const [a, b] = [xs[0], xs.at(-1)];
    row[a] = ch;
    row[b] = ch;
    if (a > 0) row[a - 1] = 'o';
    if (b < T - 1) row[b + 1] = 'o';
  });
  return { P, R, pre, cover, flaps };
}

export function moreHair(out, view, look, hatOn) {
  const style = look.hair;
  if (!MORE_HAIR[style]) return null;
  const { P, R, pre, cover } = painter(out);
  const D = view === 'down';
  const U = view === 'up';
  const S = view === 'side';
  const hair = ['h', 'H'];
  let top = null;
  const crown = !hatOn;
  // no fringe: the forehead shows
  const open = () => {
    if (D) P(4, 10, 'ohssssssssho');
  };
  if (style === 'pompadour') {
    if (crown) {
      if (D || U) {
        top = pre([[13, 'oooooo'], [11, D ? 'ohHHHHhhho' : 'ohhhhhhhho']]);
        R(0, 'ohhhhhhhhhho');
        R(1, D ? 'ohhHhhhhhhho' : 'ohhhhhhhhhho');
      } else {
        top = pre([[15, 'ooooooo'], [12, 'ooohhHHHhho']]);
        R(0, [11, 'ohhhhhhhhhhho']);
        R(1, [10, 'ohhhhhHHhhhho']);
      }
    }
    open();
  }
  if (style === 'slick') {
    if (crown) {
      if (D) [1, 2, 3].forEach((r) => cover([r], hair, 'H', (x) => x === 14 || x === 17));
      if (U) cover([1, 2, 3, 4, 5, 6, 7, 8, 9], hair, 'H', (x) => x === 13 || x === 16 || x === 19);
      if (S) {
        cover([1], hair, 'H', (x) => x >= 13 && x <= 18);
        cover([3], hair, 'H', (x) => x >= 11 && x <= 15);
      }
    }
    open();
  }
  if (style === 'spiky') {
    if (crown) {
      if (D || U) {
        top = pre([[12, 'o..oo..o'], [11, 'ohoohHooho']]);
        R(0, 'ohhhhhhhhhho');
        R(1, 'ohhHhhhhHhho');
      } else {
        top = pre([[13, 'o..o..o'], [12, 'ohoohooho']]);
        R(0, [11, 'ohhhhhhhhhho']);
        R(1, [10, 'ohhhHhhhHhhho']);
      }
    }
  }
  if (style === 'horseshoe') {
    if (crown) {
      if (D) {
        cover([1, 2], hair, 's', (x) => x >= 12 && x <= 19);
        cover([3], hair, 's', (x) => x >= 13 && x <= 18);
        P(1, 14, 'Q');
      }
      if (U) {
        cover([1, 2, 3, 4], hair, 's', (x) => x >= 12 && x <= 19);
        P(2, 14, 'Q');
      }
      if (S) {
        cover([1], hair, 's', (x) => x >= 12);
        cover([2], hair, 's', (x) => x >= 13);
        cover([3], hair, 's', (x) => x >= 14);
        P(1, 16, 'Q');
      }
    }
    open();
  }
  if (style === 'mullet') {
    if (U) {
      cover([9, 10], ['S'], 'h');
      P(11, 12, 'ohhhhhho');
      P(12, 12, 'ohhHhhho');
      P(13, 13, 'oooooo');
    }
    if (S) {
      [9, 10, 11].forEach((r) => P(r, 10, 'ohh'));
      P(12, 10, 'ohho');
      P(13, 11, 'ooo');
    }
    if (D) [10, 11, 12].forEach((r) => {
      P(r, 9, 'oh');
      P(r, 21, 'ho');
    });
  }
  if (style === 'bowl') {
    if (D) {
      P(4, 11, 'hhhhhhhhhh');
      P(5, 11, 'HhhhhhhhhH');
      [6, 7].forEach((r) => {
        P(r, 11, 'h');
        P(r, 20, 'h');
      });
    }
    if (S) {
      P(4, 11, 'hhhhhhhhhh');
      P(5, 11, 'hhhhhhhhh');
    }
  }
  if (style === 'pixie' && D) {
    P(4, 11, 'hhhhhhss');
    P(5, 11, 'hhh');
  }
  if (style === 'manbun') {
    if (crown && D) top = pre(['oooo', 'ohHo']);
    if (crown && U) top = pre(['oooooo', 'ohhHho']);
    if (crown && S) top = pre([[11, 'oooo'], [11, 'ohHo']]);
    open();
  }
  if (style === 'sidepony') {
    const tail = (x, flip) => {
      const rows = [[9, 'oh'], [10, 'ohU'], [11, 'ohho'], [12, 'ohHo'], [13, 'ohho'], [14, 'ohHo'], [15, 'oho'], [16, 'oo']];
      rows.forEach(([r, s]) => P(r, flip ? x - s.length + 1 : x, flip ? [...s].reverse().join('') : s));
    };
    if (D) tail(9, false);
    if (U) tail(22, true);
    if (S) [6, 7, 8, 9, 10].forEach((r) => P(r, 9, r === 10 ? 'oo' : 'oh'));
  }
  if (style === 'braid') {
    if (U) {
      for (let r = 9; r <= 16; r++) P(r, 14, r % 2 ? 'ohHo' : 'oHho');
      P(17, 14, 'oUUo');
      P(18, 14, 'ohho');
      P(19, 15, 'oo');
    }
    if (S) {
      for (let r = 8; r <= 14; r++) P(r, 9, r % 2 ? 'ohH' : 'oHh');
      P(15, 9, 'oUU');
      P(16, 10, 'oo');
    }
  }
  if (style === 'braids') {
    const braid = (x) => {
      for (let r = 8; r <= 14; r++) P(r, x, r % 2 ? 'ohHo' : 'oHho');
      P(15, x, 'oUUo');
      P(16, x, 'ohho');
      P(17, x + 1, 'oo');
    };
    if (D || U) {
      braid(7);
      braid(21);
    }
    if (S) braid(10);
  }
  if (style === 'dreads') {
    const lock = (r, x, n) => P(r, x, [...'hHh'.repeat(4)].slice(0, n).join(''));
    if (D) {
      for (let r = 4; r <= 12; r++) {
        P(r, 8, r === 12 ? 'o' : 'oh');
        P(r, 22, r === 12 ? 'o' : 'ho');
        if (r >= 11) {
          P(r, 9, 'hH');
          P(r, 21, 'Hh');
        }
      }
      P(12, 8, 'ohHo');
      P(12, 20, 'oHho');
      P(13, 8, 'o..o');
      P(13, 20, 'o..o');
      if (crown) cover([1, 2, 3], hair, 'H', (x) => x % 3 === 0);
    }
    if (U) {
      cover([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [...hair, 'S'], 'h');
      cover([2, 3, 4, 5, 6, 7, 8, 9, 10], ['h'], 'H', (x) => x % 3 === 0);
      lock(11, 11, 10);
      lock(12, 11, 10);
      P(11, 10, 'o');
      P(11, 21, 'o');
      P(12, 10, 'o');
      P(12, 21, 'o');
      P(13, 10, 'o.o.oo.o.oo');
    }
    if (S) {
      for (let r = 4; r <= 12; r++) P(r, 9, r === 12 ? 'oo' : 'ohH');
      P(13, 9, 'o');
    }
  }
  if (style === 'afropuff') {
    if (crown) {
      if (D || U) top = pre([[12, 'oooooooo'], [11, 'ohhHhhhhho'], [11, 'ohhhhhHhho']]);
      else top = pre([[11, 'oooooooo'], [10, 'ohhHhhhhho'], [10, 'ohhhhhhhho']]);
      R(0, S ? [11, 'oUUUUUUo'] : [12, 'oUUUUUUo']);
      if (D) cover([1, 2, 3], hair, 'H', (x) => x === 13 || x === 18);
    }
    open();
  }
  if (style === 'spacebuns' && crown) {
    if (D || U) {
      top = pre([[9, 'oooo......oooo'], [9, 'ohHo......ohHo']]);
      P(0, 9, 'ohho');
      P(0, 19, 'ohho');
      P(1, 9, 'oo');
      P(1, 21, 'oo');
    } else top = pre([[13, 'oooo'], [13, 'ohHo']]);
  }
  if (style === 'cornrows') {
    if (crown) {
      if (D) cover([1, 2, 3], hair, 'H', (x) => x % 2 === 0);
      if (U) cover([1, 2, 3, 4, 5, 6, 7, 8, 9], hair, 'H', (x) => x % 2 === 0);
      if (S) cover([1, 3], hair, 'H');
    }
    open();
  }
  if (style === 'wavy') {
    const rows = D ? [4, 5, 6, 7, 8, 9, 10, 11, 12] : U ? [8, 9, 10, 11, 12] : [8, 9, 10, 11];
    cover(rows, ['h'], 'H', (x, r) => (x + r) % 3 === 0);
  }
  return top;
}

// ---------- More hats (last: they sit over everything on the head) ----------
// Each view lists its rows: `pre` rows above the head, `rows` replaced, `paint` on top,
// `flaps` (the edge steps out), `cover` (hair under the hat).
const HAT_ROWS = {
  bucket: {
    down: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oUxUUUUUUUUo' }, paint: { 4: centred('oTTTTTTTTTTTTo') } },
    up: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oUUUUUUUUUUo' }, paint: { 4: centred('oTTTTTTTTTTTTo') } },
    side: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oUUUUUUUUxUo' }, paint: { 4: centred('oTTTTTTTTTTTTo') } },
  },
  souwester: {
    down: { pre: ['oooooo'], rows: { 0: 'oTTTTTTo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oTTTTTTTTTTTTo' }, flaps: [[4, 5, 6, 7, 8], 'T'] },
    up: { pre: ['oooooo'], rows: { 0: 'oTTTTTTo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oTTTTTTTTTTTTo' }, cover: [[4, 5, 6, 7, 8, 9, 10], ['h', 'H', 'S'], 'T'], flaps: [[4, 5, 6, 7, 8, 9], 'T'] },
    side: { pre: ['oooooo'], rows: { 0: 'oTTTTTTo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: [8, 'oTTTTTTTTTTTTTo'] }, cover: [[4, 5, 6, 7, 8], ['h', 'H'], 'T'], paint: { 4: [8, 'oT'], 5: [8, 'oT'], 6: [7, 'oT'], 7: [7, 'oT'], 8: [8, 'oT'], 9: [9, 'oo'] } },
  },
  captain: {
    down: { pre: ['oooooooooooo'], rows: { 0: 'oTTTTTTTTTTTTo', 1: 'oTTTTTTTTTTTTo', 2: 'oUUUUYYUUUUo', 3: 'oUUUUUUUUUUo' } },
    up: { pre: ['oooooooooooo'], rows: { 0: 'oTTTTTTTTTTTTo', 1: 'oTTTTTTTTTTTTo', 2: 'oUUUUUUUUUUo' } },
    side: { pre: [[9, 'oooooooooooo']], rows: { 0: [8, 'oTTTTTTTTTTTTo'], 1: [8, 'oTTTTTTTTTTTTo'], 2: [10, 'oUUUUUUUUYUo'], 3: [10, 'oUUUUUUUUUUUUo'] } },
  },
  sailor: {
    down: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oUUUUUUUUUUUUo' } },
  },
  bandana: {
    down: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTUTTTTUTTo', 3: 'oTTTTUUTTTTo' } },
    up: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTUTTTTUTTo', 3: 'oTTTTUUTTTTo' }, paint: { 4: [14, 'oUUo'], 5: [14, 'oTTo'], 6: [14, 'oTTo'], 7: [15, 'oo'] } },
    side: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTUTTTTUTTo', 3: 'oTTTTUUTTTTo' }, paint: { 2: [8, 'oo'], 3: [7, 'oTTU'], 4: [7, 'oTTo'], 5: [7, 'ooo'] } },
  },
  flatcap: {
    down: { rows: { 0: 'oooooooooo', 1: 'oTTTTTUTTTTo', 2: 'oTTTTTTTTTTTTo', 3: 'oUUUUUUUUUUo' } },
    up: { rows: { 0: 'oooooooooo', 1: 'oTTTTTTTTTTo', 2: 'oTTTTTTTTTTTTo', 3: 'oTTTTTTTTTTo' } },
    side: { rows: { 0: [11, 'oooooooooo'], 1: [10, 'oTTTTTTTTTTTo'], 2: [10, 'oTTTTTTTTTTTTo'], 3: [10, 'oUUUUUUUUUUUUo'] } },
  },
  fedora: {
    down: { pre: ['oooooo'], rows: { 0: 'oTTUUTTo', 1: 'oTTTTTTTTo', 2: 'oUUUUUUUUUUo', 3: 'oTTTTTTTTTTTTTTo' } },
  },
  pith: {
    down: { pre: ['oooooo'], rows: { 0: 'oTTTTTTo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oUUUUUUUUUUUUo' }, paint: { 4: centred('oTTTTTTTTTTTTTTo') } },
  },
  pompom: {
    down: { pre: ['oooo', 'oUUo'], rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oUUUUUUUUUUo', 3: 'oTTTTTTTTTTo' } },
  },
  visor: {
    down: { rows: { 3: 'oTTTTTTTTTTo' }, paint: { 4: centred('oUUUUUUUUUUUUo') } },
    up: { rows: { 3: 'oTTTTTTTTTTo' } },
    side: { rows: { 3: [10, 'oTTTTTTTTTTUUo'] } },
  },
  fur: {
    down: { pre: ['oooooooooo'], rows: { 0: 'oTTTTTTTTTTo', 1: 'oTTTTTTTTTTTTo', 2: 'oUUUUUUUUUUUUo', 3: 'oUUUUUUUUUUUUo' }, flaps: [[4, 5, 6, 7, 8], 'U'] },
    up: { pre: ['oooooooooo'], rows: { 0: 'oTTTTTTTTTTo', 1: 'oTTTTTTTTTTTTo', 2: 'oUUUUUUUUUUUUo', 3: 'oUUUUUUUUUUUUo' }, cover: [[4, 5, 6, 7, 8, 9], ['h', 'H'], 'U'], flaps: [[4, 5, 6, 7, 8], 'U'] },
    side: { pre: ['oooooooooo'], rows: { 0: 'oTTTTTTTTTTo', 1: 'oTTTTTTTTTTTTo', 2: 'oUUUUUUUUUUUUo', 3: 'oUUUUUUUUUUUUo' }, cover: [[4, 5, 6, 7, 8], ['h', 'H'], 'U'] },
  },
  hood: {
    down: { pre: ['oooooooo'], rows: { 0: 'oTTTTTTTTo', 1: 'oTTTTTTTTTTo', 2: 'oTTTTTTTTTTTTo', 3: 'oTUUUUUUUUUUTo' }, flaps: [[4, 5, 6, 7, 8, 9], 'T'] },
    up: { pre: ['oooooooo'], rows: { 0: 'oTTTTTTTTo', 1: 'oTTTTTTTTTTo', 2: 'oTTTTTTTTTTTTo', 3: 'oTTTTTTTTTTTTo' }, cover: [[4, 5, 6, 7, 8, 9, 10], ['h', 'H', 'S'], 'T'], flaps: [[4, 5, 6, 7, 8, 9], 'T'] },
    side: { pre: ['oooooooo'], rows: { 0: 'oTTTTTTTTo', 1: 'oTTTTTTTTTTo', 2: [9, 'oTTTTTTTTTTTTo'], 3: [9, 'oTTTTTTTTTTUUo'] }, cover: [[4, 5, 6, 7, 8, 9], ['h', 'H'], 'T'], paint: { 4: [9, 'o'], 5: [9, 'o'] } },
  },
  miner: {
    down: { pre: ['oooooo'], rows: { 0: 'oTTTTTTTTo', 1: 'oTTTkjjkTTTo', 2: 'oUUUUUUUUUUUUo' } },
    up: { pre: ['oooooo'], rows: { 0: 'oTTTTTTTTo', 1: 'oTTTTUTTTTTo', 2: 'oUUUUUUUUUUUUo' } },
    side: { pre: ['oooooo'], rows: { 0: 'oTTTTTTTTo', 1: [10, 'oTTTTTTTTkjjo'], 2: 'oUUUUUUUUUUUUo' } },
  },
  welder: {
    down: { pre: ['oooooooooo', 'oTTTTTTTTTTo'], rows: { 0: 'oTkkkkkkkkTo', 1: 'oTTTTTTTTTTo', 2: 'oUUUUUUUUUUUUo' } },
    up: { pre: ['oooooooooo', 'oTTTTTTTTTTo'], rows: { 0: 'oTTTTTTTTTTo', 1: 'oTTTTTTTTTTo', 2: 'oUUUUUUUUUUUUo' } },
    side: { pre: ['oooooooooo', 'oTTTTTTTTTTo'], rows: { 0: [10, 'oTTTTTTTkkko'], 1: 'oTTTTTTTTTTo', 2: 'oUUUUUUUUUUUUo' } },
  },
  // the welding mask pulled down over the face (only the welding pose uses it)
  welderdown: {
    down: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oTTTTTTTTTTo' }, paint: { 4: [10, 'oTTTTTTTTTTo'], 5: [10, 'oTkkkkkkkkTo'], 6: [10, 'oTkQkkkkkkTo'], 7: [10, 'oTkkkkkkkkTo'], 8: [10, 'oTTTTTTTTTTo'], 9: [10, 'oTTTTTTTTTTo'], 10: [10, 'ooTTTTTTTToo'] } },
    side: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTTTTTTTTTo', 3: 'oTTTTTTTTTTo' }, paint: { 4: [14, 'TTTTTTTo'], 5: [14, 'TTkkkkTo'], 6: [13, 'TTTkQkkTo'], 7: [13, 'TTTkkkkTo'], 8: [13, 'TTTTTTTo'], 9: [13, 'TTTTTTo'], 10: [13, 'TTTTTTo'] } },
  },
  chef: {
    down: { pre: ['oooooooo', 'oTTTTTTTTo', 'oTTTTTTTTTTo', 'oTTUTTTTUTTo'], rows: { 0: 'oTTUTTTTUTTo', 1: 'oTTUTTTTUTTo', 2: 'oUUUUUUUUUUo' } },
  },
  pirate: {
    down: { pre: ['oooooooooooo'], rows: { 0: 'oTTTTTQQTTTTTo', 1: 'oTTTTTQQTTTTTo', 2: 'oYYYYYYYYYYYYo' } },
    up: { pre: ['oooooooooooo'], rows: { 0: 'oTTTTTTTTTTTTo', 1: 'oTTTTTTTTTTTTo', 2: 'oYYYYYYYYYYYYo' } },
    side: { pre: ['oooooooooooo'], rows: { 0: 'oTTTTTTTTTTTTo', 1: 'oTTTTTTTTTTTTo', 2: 'oYYYYYYYYYYYYYYo' } },
  },
  cowboy: {
    down: { pre: ['oooooo'], rows: { 0: 'oTTUUTTo', 1: 'oTTTTTTTTo', 2: 'oUUUUUUUUUUo', 3: 'oTTTTTTTTTTTTTTTTo' }, paint: { 2: [6, 'oT'], 3: [6, 'o'] } },
    side: { pre: ['oooooo'], rows: { 0: 'oTTUUTTo', 1: 'oTTTTTTTTo', 2: 'oUUUUUUUUUUo', 3: 'oTTTTTTTTTTTTTTTTo' } },
  },
  headband: {
    down: { rows: { 3: 'oTTTTTTTTTTo' } },
  },
  campaign: {
    down: { pre: ['oooo', 'oTTTTo'], rows: { 0: 'oTTTTTTo', 1: 'oUUUUUUUUo', 2: 'oTTTTTTTTTTTTTTTTo' } },
  },
  wrap: {
    down: { pre: ['oooooo'], rows: { 0: 'oTTTTTTo', 1: 'oTTTTTTTTo', 2: 'oTUUUUUUUUTo', 3: 'oTTTTTTTTTTo' }, flaps: [[4, 5, 6, 7, 8, 9], 'T'] },
    up: { pre: ['oooooo'], rows: { 0: 'oTTTTTTo', 1: 'oTTTTTTTTo', 2: 'oTUUUUUUUUTo', 3: 'oTTTTTTTTTTo' }, cover: [[4, 5, 6, 7, 8, 9, 10], ['h', 'H', 'S'], 'T'], flaps: [[4, 5, 6, 7, 8, 9], 'T'] },
    side: { pre: ['oooooo'], rows: { 0: 'oTTTTTTo', 1: 'oTTTTTTTTo', 2: 'oTUUUUUUUUTo', 3: 'oTTTTTTTTTTo' }, cover: [[4, 5, 6, 7, 8, 9], ['h', 'H'], 'T'], paint: { 5: [8, 'oT'], 6: [7, 'oTT'], 7: [7, 'oTT'], 8: [7, 'oTT'], 9: [8, 'oo'] } },
  },
  veil: {
    down: { rows: { 1: 'oUUUUUUUUo' }, flaps: [[4, 5, 6, 7, 8, 9], 'T'], paint: { 10: [8, 'oT'], 11: [8, 'oT'], 12: [8, 'oT'], 13: [8, 'oo'] } },
    up: { rows: { 1: 'oUUUUUUUUo' }, cover: [[2, 3, 4, 5, 6, 7, 8, 9, 10], ['h', 'H', 'S'], 'T'], flaps: [[4, 5, 6, 7, 8, 9], 'T'], paint: { 11: [10, 'oTTTTTTTTTTo'], 12: [10, 'oTTTTTTTTTTo'], 13: [11, 'oooooooooo'] } },
    side: { rows: { 1: 'oUUUUUUUUo' }, cover: [[2, 3, 4, 5, 6, 7, 8], ['h', 'H'], 'T'], paint: { 6: [8, 'oT'], 7: [8, 'oT'], 8: [8, 'oTT'], 9: [8, 'oTT'], 10: [8, 'oTT'], 11: [8, 'oTT'], 12: [8, 'oTT'], 13: [9, 'ooo'] } },
  },
  helmet: {
    down: { pre: ['oooooo'], rows: { 0: 'oTUTTUTo', 1: 'oTTTTTTTTo', 2: 'oTTUTTTTUTTo', 3: 'oUUUUUUUUUUo' } },
    side: { pre: ['oooooo'], rows: { 0: 'oTUTTUTo', 1: 'oTTTTTTTTo', 2: 'oTTUTTTTUTTo', 3: 'oUUUUUUUUUUo' }, paint: { 2: [8, 'oT'], 3: [8, 'oo'] } },
  },
  police: {
    down: { pre: ['oooooooooooo'], rows: { 0: 'oTTTTTTTTTTTTo', 1: 'oTTTTTYYTTTTTo', 2: 'oUUUUUUUUUUo', 3: 'okkkkkkkkkko' } },
    up: { pre: ['oooooooooooo'], rows: { 0: 'oTTTTTTTTTTTTo', 1: 'oTTTTTTTTTTTTo', 2: 'oUUUUUUUUUUo' } },
    side: { pre: [[9, 'oooooooooooo']], rows: { 0: [8, 'oTTTTTTTTTTTTo'], 1: [8, 'oTTTTTTTTTYTTo'], 2: [10, 'oUUUUUUUUUUo'], 3: [10, 'okkkkkkkkkkkko'] } },
  },
  paperhat: {
    down: { pre: ['oo', 'oTTo'], rows: { 0: 'oTTTTTTo', 1: 'oUUUUUUUUo' } },
    side: { pre: [[11, 'oooooooooo']], rows: { 0: [10, 'oTTTTTTTTTTo'], 1: [10, 'oUUUUUUUUUUo'] } },
  },
  tiara: {
    down: { pre: ['oQo'], rows: { 1: 'oYYQYYQYYo' } },
    side: { pre: [[17, 'oQo']], rows: { 1: 'oYYYYYYQYo' } },
    up: { rows: { 1: 'oYYYYYYYYo' } },
  },
  kingcrown: {
    down: { pre: [[12, 'o..oo..o'], [11, 'oYooYYooYo']], rows: { 0: 'oYYYYYYYYYYo', 1: 'oYRYQYYQYRYo' } },
  },
  swimcap: {
    down: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTUTTTTTTTo', 3: 'oTTTTTTTTTTo' }, paint: { 4: [10, 'oTTTTTTTTTTo'] }, cover: [[5, 6], ['h', 'H'], 'T'] },
    up: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTUTTTTTTTo', 3: 'oTTTTTTTTTTo' }, cover: [[4, 5, 6, 7, 8, 9], ['h', 'H'], 'T'] },
    side: { rows: { 0: 'oooooooo', 1: 'oTTTTTTTTo', 2: 'oTTUTTTTTTTo', 3: 'oTTTTTTTTTTo' }, cover: [[4, 5, 6, 7, 8], ['h', 'H'], 'T'] },
  },
  headphones: {
    down: { rows: { 1: 'okkkkkkkko' }, flaps: [[5, 6, 7], 'T'] },
    side: { paint: { 1: [15, 'k'], 2: [15, 'k'], 3: [15, 'k'], 4: [15, 'k'], 5: [13, 'TTT'], 6: [12, 'oTTT'], 7: [13, 'TTT'], 8: [13, 'ooo'] } },
  },
};
// the hairnet is a fine net laid over the hair
function hairnet(out, view) {
  const { cover } = painter(out);
  const rows = view === 'up' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : view === 'side' ? [0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4];
  cover(rows, ['h', 'H'], 'U', (x, r) => (x + r) % 2 === 0);
}

export function moreHats(out, view, look) {
  const hat = look.hat;
  if (hat === 'hairnet') {
    hairnet(out, view);
    return null;
  }
  const spec = HAT_ROWS[hat];
  if (!spec) return null;
  const v = spec[view] || spec.down;
  const { P, R, pre, cover, flaps } = painter(out);
  Object.entries(v.rows || {}).forEach(([r, s]) => R(+r, s));
  if (v.cover) cover(...v.cover);
  if (v.flaps) flaps(...v.flaps);
  Object.entries(v.paint || {}).forEach(([r, s]) => {
    const [x, str] = typeof s === 'string' ? centred(s) : s;
    P(+r, x, str);
  });
  return pre(v.pre || []);
}

// ---------- The full 32-wide grid (builds, props, poses) ----------
const toGrid = (rows) => rows.map((r) => {
  const a = Array(T).fill('.');
  const off = Math.floor((T - r.length) / 2);
  [...r].forEach((c, i) => (a[off + i] = c));
  return a;
});
const fromGrid = (g) => g.map((r) => r.join(''));

// Builds change the body after every look is on.
export function applyBuild(rows, build) {
  if (!build || build === 'standard' || !BUILDS[build]) return rows;
  const g = toGrid(rows);
  const top = g.length - BASE;
  if (build === 'broad') {
    for (let r = 12; r <= 26; r++) {
      const row = g[top + r];
      const xs = row.map((c, x) => (c !== '.' ? x : -1)).filter((x) => x >= 0);
      if (xs.length < 4) continue;
      const [a, b] = [xs[0], xs.at(-1)];
      const s = row.slice(a, b + 1);
      const w = [s[0], s[1], ...s.slice(1, -1), s.at(-2), s.at(-1)];
      row.fill('.');
      w.forEach((c, i) => a - 1 + i >= 0 && a - 1 + i < T && (row[a - 1 + i] = c));
    }
  }
  if (build === 'tall') {
    g.splice(top + 23, 0, [...g[top + 22]]);
    g.splice(top + 17, 0, [...g[top + 16]]);
  }
  if (build === 'short') {
    g.splice(top + 22, 1);
    g.splice(top + 16, 1);
  }
  return fromGrid(g);
}

// where things are on a person after a build: base row r is at row Y(r) of the grid
function metrics(g, view, build) {
  const n = (build === 'tall' ? 2 : build === 'short' ? -2 : 0) - (view === 'sit' ? 2 : 0);
  if (view === 'sit') view = 'down';
  const top = g.length - BASE - n;
  const Y = (r) => top + r + (build === 'tall' ? (r > 16) + (r > 22) : build === 'short' ? -((r > 16) + (r > 22)) : 0);
  const wide = build === 'broad' ? 1 : 0;
  // the hand that holds things: on the left from the front, the right from the back
  const hx = view === 'down' ? 10 - wide : view === 'up' ? 21 + wide : 15;
  return { top, Y, hx, hy: Y(18), gy: Y(26), wide, view };
}

function draw(g) {
  const get = (x, y) => g[y]?.[x] ?? null;
  const px = (x, y, c) => {
    if (y >= 0 && y < g.length && x >= 0 && x < T) g[y][x] = c;
  };
  const line = (x0, y0, x1, y1, c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    for (let k = 0; k <= n; k++) px(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), c);
  };
  // a little picture with its top-left at x, y (' ' leaves a cell), outlined where it meets empty space
  const pic = (x, y, rows, edge = 'o') => {
    const cells = [];
    rows.forEach((row, j) => [...row].forEach((c, i) => {
      if (c === ' ') return;
      px(x + i, y + j, c);
      cells.push([x + i, y + j]);
    }));
    if (edge) cells.forEach(([cx, cy]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => get(cx + dx, cy + dy) === '.' && px(cx + dx, cy + dy, edge)));
  };
  const flip = (rows) => rows.map((r) => [...r].reverse().join(''));
  return { get, px, line, pic, flip };
}

// room above the head for things held up high; trimmed again afterwards
const HEADROOM = 10;
function withRoom(rows, fn) {
  const g = toGrid(rows);
  for (let i = 0; i < HEADROOM; i++) g.unshift(Array(T).fill('.'));
  fn(g);
  while (g.length > T - 1 && g[0].every((c) => c === '.')) g.shift();
  return fromGrid(g);
}

// ---------- Things people carry while they walk ----------
export const CARRY = {
  mop: 'Mop', broom: 'Broom', pushbroom: 'Push broom', bucket: 'Bucket', trashbag: 'Trash bag', duster: 'Feather duster', squeegee: 'Squeegee',
  shovel: 'Shovel', rake: 'Rake', plank: 'Plank', toolbox: 'Toolbox', clipboard: 'Clipboard', rod: 'Fishing rod', net: 'Net', lantern: 'Lantern',
  sign: 'Stop sign', cooler: 'Cooler', surfboard: 'Surfboard', oar: 'Oar', roller: 'Paint roller', wrench: 'Wrench', hammer: 'Hammer', trap: 'Lobster trap',
  fish: 'A fish', lifebuoy: 'Life ring', rope: 'Coil of rope', crate: 'Crate', box: 'Box', parcel: 'Parcel', spool: 'Cable spool', plunger: 'Plunger',
  pane: 'Pane of glass', tiles: 'Tiles', ladder: 'Ladder', polesaw: 'Pole saw', blueprint: 'Blueprint', sword: 'Cutlass', pan: 'Frying pan', sack: 'Sack',
  bottle: 'Message in a bottle', detector: 'Metal detector', jar: 'Sample jar', map: 'Map', bricks: 'Bricks', paint: 'Paint can', wateringcan: 'Watering can',
  trowel: 'Trowel', finebrush: 'Fine brush', stick: 'Walking stick', iceaxe: 'Ice axe', pickaxe: 'Pickaxe', machete: 'Machete', flask: 'Water skin', torch: 'Torch',
  tablet: 'Tablet', frame: 'Picture frame', scroll: 'Scroll', books: 'Books', kit: 'Workshop kit', umbrella: 'Umbrella', flashlight: 'Flashlight', giftbag: 'Gift bag',
  hanger: 'Coat on a hanger', mic: 'Microphone', cane: 'Cane', notebook: 'Notebook', cheque: 'Big cheque',
  balloon: 'Balloon', teddy: 'Teddy bear', scooter: 'Scooter', icecream: 'Ice cream', skateboard: 'Skateboard', shopping: 'Shopping bags', suitcase: 'Suitcase',
  coffee: 'Coffee', briefcase: 'Briefcase', lunchbag: 'Lunch bag', letter: 'Letter', bouquet: 'Bouquet', bread: 'Tray of bread', tray: 'Serving tray',
  plates: 'Stack of plates', candyjar: 'Jar of sweets', mug: 'Mug',
};

// a pole down the outside of the hand, with a head at the bottom (mop, broom, shovel...)
function pole(d, m, headRows, opts = {}) {
  const { hx, hy, gy, view } = m;
  const flipped = view === 'up';
  const x = view === 'down' ? hx - 2 : view === 'up' ? hx + 2 : hx + 2;
  const top = hy - (opts.up ?? 10);
  const bottom = gy - headRows.length + (opts.sink ?? 1);
  d.line(x, top, x, bottom, opts.stick || 'N');
  if (opts.grip) d.pic(x - 1, top - opts.grip.length, opts.grip);
  const w = headRows[0].length;
  d.pic(x - Math.floor(w / 2), bottom + 1, flipped ? d.flip(headRows) : headRows);
  hand(d, m, x);
}
// redraw the gripping hand on top of whatever it holds
function hand(d, m, x) {
  const { hx, hy, view } = m;
  if (view === 'side') {
    d.px(hx, hy, 's');
    d.px(hx + 1, hy, 's');
    d.px(hx + 1, hy + 1, 's');
    return;
  }
  const hxo = view === 'down' ? hx - 1 : hx + 1;
  d.px(hxo, hy, 's');
  if (x != null && Math.abs(x - hxo) > 1) d.px(view === 'down' ? hxo - 1 : hxo + 1, hy, 's');
}
// something hanging from the hand
function hang(d, m, rows) {
  const { hx, hy, view } = m;
  const w = rows[0].length;
  const x = view === 'down' ? hx - w : view === 'up' ? hx + 1 : hx - Math.floor(w / 2) + 1;
  d.pic(x, hy + 1, view === 'up' ? d.flip(rows) : rows);
  hand(d, m);
}
// something tall standing beside the person, held near the top
function beside(d, m, rows) {
  const { hx, hy, gy, view } = m;
  const w = rows[0].length;
  const x = view === 'down' ? hx - w - 1 : view === 'up' ? hx + 2 : hx + 2;
  d.pic(x, gy - rows.length + 1, view === 'up' ? d.flip(rows) : rows);
  hand(d, m, view === 'down' ? x + w - 1 : x);
  void hy;
}

const CARRY_DRAW = {
  mop: (d, m) => pole(d, m, ['rrrrr', 'rrrrr', 'r r r']),
  broom: (d, m) => pole(d, m, [' NNN ', 'PPPPP', 'PPPPP', 'P P P']),
  pushbroom: (d, m) => pole(d, m, ['NNNNNNN', 'kkkkkkk']),
  shovel: (d, m) => pole(d, m, ['AAA', 'AAA', 'aAa', ' a '], { grip: ['NNN', 'N N'], up: 8 }),
  rake: (d, m) => pole(d, m, ['AAAAAAA', 'A A A A'], { up: 11 }),
  oar: (d, m) => pole(d, m, ['nnn', 'nnn', 'nnn', 'nnn', ' n '], { stick: 'n', up: 11 }),
  polesaw: (d, m) => {
    const { hx, hy, view } = m;
    const x = view === 'down' ? hx - 2 : view === 'up' ? hx + 2 : hx + 2;
    d.line(x, hy + 4, x, m.top - 4, 'N');
    d.pic(x - 1, m.top - 7, ['AAa', 'A  ', 'A  ']);
    hand(d, m, x);
  },
  detector: (d, m) => pole(d, m, ['kAAAk'], { stick: 'A', up: 6 }),
  squeegee: (d, m) => {
    const { hx, hy, view } = m;
    const x = view === 'down' ? hx - 2 : view === 'up' ? hx + 2 : hx + 2;
    d.line(x, hy + 1, x, hy - 5, 'k');
    d.pic(x - 2, hy - 7, ['kkkkk', 'AAAAA']);
    hand(d, m, x);
  },
  roller: (d, m) => {
    const { hx, hy, view } = m;
    const x = view === 'down' ? hx - 2 : view === 'up' ? hx + 2 : hx + 2;
    d.line(x, hy + 1, x, hy - 5, 'k');
    d.pic(x - 2, hy - 8, ['QQQQQ', 'QQQQQ', ' kkk ']);
    hand(d, m, x);
  },
  duster: (d, m) => {
    const { hx, hy, view } = m;
    const x = view === 'down' ? hx - 2 : view === 'up' ? hx + 2 : hx + 2;
    d.line(x, hy + 1, x, hy - 5, 'N');
    d.pic(x - 2, hy - 9, [' P P ', 'PPPPP', 'PPPPP', ' PPP ']);
    hand(d, m, x);
  },
  rod: (d, m) => {
    const { hx, hy, view, top } = m;
    if (view === 'side') {
      d.line(hx + 1, hy + 2, hx + 8, top - 2, 'N');
      d.px(hx, hy + 2, 'A');
    } else {
      const s = view === 'down' ? -1 : 1;
      const x = view === 'down' ? hx - 2 : hx + 2;
      d.line(x, hy + 3, x + s * 3, top - 3, 'N');
      d.px(x, hy + 1, 'A');
      d.px(x + s, hy + 1, 'A');
    }
    hand(d, m);
  },
  net: (d, m) => {
    const { hx, hy, view, top } = m;
    const x = view === 'down' ? hx - 2 : view === 'up' ? hx + 2 : hx + 2;
    d.line(x, hy + 3, x, top + 7, 'N');
    d.pic(x - 2, top + 2, [' AAA ', 'AlllA', 'AlllA', 'AlllA', ' AAA ']);
    hand(d, m, x);
  },
  sign: (d, m) => {
    const { hx, hy, view, top } = m;
    const x = view === 'down' ? hx - 2 : view === 'up' ? hx + 2 : hx + 2;
    d.line(x, hy + 3, x, top + 2, 'A');
    d.pic(x - 3, top - 3, [' xxxxx ', 'xxxxxxx', 'xQQQQQx', 'xxxxxxx', ' xxxxx ']);
    hand(d, m, x);
  },
  bucket: (d, m) => hang(d, m, [' kkk ', 'k   k', 'AAAAA', 'PPPPP', 'PPPPP', ' PPP ']),
  trashbag: (d, m) => hang(d, m, ['  k  ', ' BBB ', 'BBBBB', 'BBBBB', 'BBBBB', ' BBB ']),
  toolbox: (d, m) => hang(d, m, ['  kk  ', ' k  k ', 'xxxxxx', 'xNNNNx', 'xxxxxx']),
  cooler: (d, m) => hang(d, m, ['  kk  ', 'QQQQQQ', 'BBBBBB', 'BBBBBB']),
  lantern: (d, m) => hang(d, m, [' k ', 'kAk', 'jYj', 'jYj', 'AAA']),
  trap: (d, m) => hang(d, m, ['  kk  ', 'NNNNNN', 'NrNrNN', 'NNrNrN', 'NNNNNN']),
  fish: (d, m) => hang(d, m, ['f f', ' f ', 'fff', 'fff', 'fBf', ' f ']),
  lifebuoy: (d, m) => hang(d, m, [' xQx ', 'x   x', 'Q   Q', 'x   x', ' xQx ']),
  rope: (d, m) => hang(d, m, [' rrr ', 'r   r', 'r   r', ' rrr ']),
  spool: (d, m) => hang(d, m, ['NNNN', 'nxxn', 'nxxn', 'NNNN']),
  plunger: (d, m) => hang(d, m, [' n ', ' n ', ' n ', 'xxx', 'xxx']),
  wrench: (d, m) => hang(d, m, ['A A', 'AAA', ' A ', ' A ', ' A ']),
  hammer: (d, m) => hang(d, m, [' n ', ' n ', ' n ', 'AAA', 'A  ']),
  pan: (d, m) => hang(d, m, [' N ', ' N ', 'kkk', 'kAk', 'kkk']),
  sack: (d, m) => hang(d, m, [' k ', 'nnn', 'nnnn', 'nnnn', ' nn ']),
  bottle: (d, m) => hang(d, m, ['N', 'v', 'Q', 'v']),
  jar: (d, m) => hang(d, m, ['AA', 'vv', 'vf']),
  paint: (d, m) => hang(d, m, [' kk ', 'AAAA', 'ABBA', 'AAAA']),
  wateringcan: (d, m) => hang(d, m, ['  kk  ', 'BBBBBB', 'BBBBBB', 'BBBB  ']),
  sword: (d, m) => {
    const { hx, hy, view } = m;
    if (view === 'side') d.pic(hx + 1, hy - 1, ['  a', ' a ', 'Y  ']);
    else d.pic(view === 'down' ? hx - 2 : hx + 1, hy + 1, view === 'down' ? ['Y', 'a', 'a', 'a', ' a'] : ['Y', 'a', 'a', 'a', 'a ']);
    hand(d, m);
  },
  surfboard: (d, m) => {
    const rows = [' PPP ', 'PPPPP', ...Array(18).fill('PPBPP'), 'PPPPP', ' PPP '];
    if (m.view === 'side') {
      const { hy } = m;
      d.pic(4, hy - 1, [' PPPPPPPPPPPPPPPPPPPPPP ', 'PPPPPPPPPPPPPPPPPPPPPPPP', ' BBBBBBBBBBBBBBBBBBBBBB '.replace(/B/g, 'P')]);
      hand(d, m);
      return;
    }
    beside(d, m, rows);
  },
  pane: (d, m) => {
    if (m.view === 'side') {
      d.pic(m.hx + 2, m.top + 6, Array(14).fill('vl'));
      hand(d, m);
      return;
    }
    beside(d, m, ['vvvvv', 'vlvvv', 'vvlvv', 'vvvlv', ...Array(8).fill('vvvvv'), 'vvvvv']);
  },
  ladder: (d, m) => {
    if (m.view === 'side') {
      d.pic(1, m.top + 11, ['n'.repeat(30), 'n n n n n n n n n n n n n n n ', 'n'.repeat(30)]);
      d.px(m.hx, m.top + 13, 's');
      return;
    }
    const rows = [];
    for (let i = 0; i < 20; i++) rows.push(i % 3 === 0 ? 'nnnn' : 'n  n');
    beside(d, m, rows);
  },
  plank: (d, m) => {
    if (m.view === 'side') {
      d.pic(2, m.top + 11, ['n'.repeat(28), 'N'.repeat(28)]);
      d.px(m.hx, m.top + 13, 's');
      d.px(m.hx + 1, m.top + 13, 's');
      return;
    }
    beside(d, m, Array(16).fill('nnN'));
  },
  crate: (d, m) => {
    const box = ['nnnnnnnnnn', 'nNnnnnnnNn', 'nnNnnnnNnn', 'nnnNnnNnnn', 'nnnnNNnnnn', 'nnnNnnNnnn'];
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 4, box.map((r) => r.slice(0, 8)));
    else d.pic(11 - m.wide, m.hy - 3, box);
  },
  box: (d, m) => {
    const box = ['nnnnnnnn', 'nnnPPnnn', 'nnnPPnnn', 'nnnnnnnn', 'nnnnnnnn'];
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 3, box.map((r) => r.slice(0, 6)));
    else d.pic(12 - m.wide, m.hy - 2, box);
  },
  parcel: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 1, m.hy - 2, ['nPn', 'PPP', 'nPn']);
    else d.pic(m.hx - 3, m.hy - 1, ['nnPnn', 'PPPPP', 'nnPnn', 'nnPnn']);
  },
  tiles: (d, m) => {
    if (m.view === 'up') return;
    const x = m.view === 'side' ? m.hx + 2 : 12 - m.wide;
    d.pic(x, m.hy - 2, ['aaaaaaa', 'QQQQQQQ', 'aaaaaaa', 'QQQQQQQ'].map((r) => (m.view === 'side' ? r.slice(0, 5) : r)));
  },
  bricks: (d, m) => {
    if (m.view === 'up') return;
    const x = m.view === 'side' ? m.hx + 2 : 12 - m.wide;
    d.pic(x, m.hy - 2, ['xxxkxxx', 'xkxxxkx', 'xxxkxxx'].map((r) => (m.view === 'side' ? r.slice(0, 5) : r)));
  },
  clipboard: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 5, [' a', 'nQ', 'nQ', 'nQ', 'nn']);
    else d.pic(12 - m.wide, m.hy - 5, [' aa ', 'nQQn', 'nkQn', 'nQkn', 'nnnn']);
  },
  map: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 4, ['r', 'P', 'r', 'r']);
    else d.pic(12 - m.wide, m.hy - 4, ['rrPrrr', 'rxrrPr', 'rrrPrr', 'rPrrrx']);
  },
  trowel: (d, m) => hang(d, m, ['n', 'n', 'AA', 'AA', 'A ']),
  finebrush: (d, m) => hang(d, m, ['n', 'n', 'n', 'k']),
  machete: (d, m) => hang(d, m, ['n', 'n', 'a', 'a', 'a', ' a']),
  flask: (d, m) => hang(d, m, [' k ', 'nnn', 'nnn', 'nnn', ' n ']),
  kit: (d, m) => hang(d, m, ['  kk  ', 'PPPPPP', 'PxPBPP', 'PPPPPP']),
  flashlight: (d, m) => hang(d, m, ['kk', 'kk', 'aa', 'jj']),
  giftbag: (d, m) => hang(d, m, [' k k ', 'xxxxx', 'xYxxx', 'xxxxx', 'xxxxx']),
  hanger: (d, m) => hang(d, m, [' k ', 'kAk', 'BBB', 'BBB', 'BBB', 'B B']),
  mic: (d, m) => hang(d, m, ['AA', 'Ak', 'k ', 'k ']),
  stick: (d, m) => pole(d, m, ['N'], { stick: 'n', up: 7 }),
  cane: (d, m) => pole(d, m, ['N'], { stick: 'N', up: 2, grip: ['NN'] }),
  iceaxe: (d, m) => {
    const { hx, hy, view } = m;
    const x = view === 'down' ? hx - 2 : hx + 2;
    d.line(x, hy + 4, x, hy - 6, 'A');
    d.pic(x - 2, hy - 8, ['AAAAa', '  A  ']);
    hand(d, m, x);
  },
  pickaxe: (d, m) => {
    const { hx, hy, view } = m;
    const x = view === 'down' ? hx - 2 : hx + 2;
    d.line(x, hy + 3, x, hy - 8, 'n');
    d.pic(x - 2, hy - 10, [' AAA ', 'A   A']);
    hand(d, m, x);
  },
  torch: (d, m) => {
    const { hx, hy, view } = m;
    const x = view === 'down' ? hx - 2 : hx + 2;
    d.line(x, hy + 2, x, hy - 5, 'n');
    d.pic(x - 1, hy - 9, [' j ', 'jYj', 'VYV', ' V '], null);
    hand(d, m, x);
  },
  umbrella: (d, m) => {
    const { hx, hy, view, top } = m;
    const x = view === 'down' ? hx - 2 : hx + 2;
    d.line(x, hy + 2, x, top - 2, 'k');
    d.pic(x - 4, top - 5, ['   PPP   ', ' PPPPPPP ', 'PBPPBPPBP']);
    hand(d, m, x);
  },
  frame: (d, m) => beside(d, m, ['YYYYYY', 'Y    Y', 'Y    Y', 'Y    Y', 'Y    Y', 'Y    Y', 'Y    Y', 'YYYYYY']),
  tablet: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 4, ['k', 'v', 'v', 'k']);
    else d.pic(12 - m.wide, m.hy - 4, ['kkkk', 'kvvk', 'kvvk', 'kkkk']);
  },
  scroll: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 3, ['N', 'r', 'r', 'N']);
    else d.pic(12 - m.wide, m.hy - 3, ['NrrrrrN', 'NrPrrrN']);
  },
  books: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 4, ['xx', 'BB', 'GG', 'PP']);
    else d.pic(12 - m.wide, m.hy - 4, ['xxxxxx', 'BBBBBB', 'GGGGGG', 'PPPPPP']);
  },
  notebook: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 3, ['r', 'k', 'r']);
    else d.pic(m.hx - 3, m.hy - 2, ['rrrr', 'rkkr', 'rrrr']);
  },
  cheque: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 7, Array(6).fill('Q'));
    else d.pic(8 - m.wide, m.hy - 6, ['QQQQQQQQQQQQQQQQ', 'QkkQQQQQQQQxxxxQ', 'QQQQQQQQQQQQQQQQ', 'QkkkkkkkQQQQQQQQ', 'QQQQQQQQQQQkkkQQ', 'QQQQQQQQQQQQQQQQ']);
  },
  balloon: (d, m) => {
    const { hx, hy, view, top } = m;
    const s = view === 'up' ? 1 : view === 'side' ? 1 : -1;
    const x = view === 'side' ? hx + 6 : hx + s * 4;
    d.line(view === 'side' ? hx + 1 : hx + s, hy, x, top - 2, 'l');
    d.pic(x - 2, top - 7, [' xx ', 'xxxx', 'xQxx', 'xxxx', ' xx ']);
    hand(d, m);
  },
  teddy: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 1, m.hy - 3, ['N ', 'nn', 'kn', 'nn']);
    else d.pic(12 - m.wide, m.hy - 4, ['N   N', 'NnnnN', 'nknkn', 'nnNnn', ' nnn ']);
  },
  scooter: (d, m) => beside(d, m, ['AAA', ' A ', ' A ', ' A ', ' A ', ' A ', ' A ', ' A ', ' A ', 'kkkkk', 'k   k']),
  icecream: (d, m) => {
    const { hx, hy, view } = m;
    const x = view === 'down' ? hx - 3 : view === 'up' ? hx + 1 : hx + 1;
    d.pic(x, hy - 5, [' P ', 'PxP', 'PPP', ' n ', ' n ']);
    hand(d, m);
  },
  skateboard: (d, m) => {
    if (m.view === 'side') {
      d.pic(m.hx - 6, m.hy - 1, ['kkkkkkkkkkkk', 'A          A']);
      hand(d, m);
      return;
    }
    beside(d, m, ['kkk', 'kxk', 'kxk', 'kxk', 'kxk', 'kxk', 'kxk', 'kkk', 'A A']);
  },
  shopping: (d, m) => hang(d, m, [' k   k ', 'BBB xxx', 'BBB xxx', 'BBB xxx', 'BBB xxx']),
  suitcase: (d, m) => {
    const { hx, hy, gy, view } = m;
    const x = view === 'down' ? hx - 7 : view === 'up' ? hx + 2 : hx + 2;
    d.line(x + 2, hy, x + 2, gy - 7, 'k');
    d.pic(x, gy - 6, ['BBBBB', 'BQBBB', 'BBBBB', 'BBBBB', 'BBBBB', ' k k ']);
    hand(d, m, x + 2);
  },
  coffee: (d, m) => hang(d, m, ['kk', 'QQ', 'nn', 'nn']),
  briefcase: (d, m) => hang(d, m, [' kk ', 'NNNN', 'NYNN', 'NNNN']),
  lunchbag: (d, m) => hang(d, m, ['nn ', 'nnn', 'nnn']),
  letter: (d, m) => hang(d, m, ['QQQ', 'QkQ']),
  bouquet: (d, m) => {
    if (m.view === 'up') return hang(d, m, ['G', 'G']);
    const x = m.view === 'side' ? m.hx + 1 : m.hx - 3;
    d.pic(x, m.hy - 4, ['xPx', 'PxP', 'GxG', ' G ', ' G ']);
    hand(d, m);
  },
  bread: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 2, ['nn', 'AA']);
    else d.pic(10 - m.wide, m.hy - 2, ['nnNnnNnnNnnN', 'AAAAAAAAAAAA']);
  },
  tray: (d, m) => {
    const x = m.view === 'down' ? m.hx - 6 : m.view === 'up' ? m.hx + 1 : m.hx + 1;
    d.pic(x, m.hy - 3, ['  vv  ', '  vv  ', 'AAAAAA']);
    hand(d, m);
  },
  plates: (d, m) => {
    if (m.view === 'up') return;
    if (m.view === 'side') d.pic(m.hx + 2, m.hy - 4, ['QQ', 'aa', 'QQ', 'aa']);
    else d.pic(11 - m.wide, m.hy - 4, ['QQQQQQQQ', 'aaaaaaaa', 'QQQQQQQQ', 'aaaaaaaa']);
  },
  candyjar: (d, m) => hang(d, m, ['AAA', 'vxv', 'vPv', 'vvv']),
  mug: (d, m) => hang(d, m, ['QQ ', 'QQQ', 'QQ ']),
  blueprint: (d, m) => {
    const { hx, hy, view } = m;
    if (view === 'side') d.pic(hx - 1, hy - 1, ['BBBBBB']);
    else d.pic(view === 'down' ? hx - 2 : hx + 1, hy - 4, ['B', 'B', 'B', 'B', 'B', 'B']);
    hand(d, m);
  },
};

export function drawCarry(rows, view, look) {
  const fn = CARRY_DRAW[look.carry];
  if (!fn) return rows;
  return withRoom(rows, (g) => fn(draw(g), metrics(g, view, look.build), g));
}

// ---------- Things set down on the ground beside someone ----------
export const GROUND = {
  bucket: 'Mop bucket', wetsign: 'Wet floor sign', cone: 'Traffic cone', toolbox: 'Toolbox', crate: 'Crate', cooler: 'Cooler', tacklebox: 'Tackle box',
  trap: 'Lobster trap', fishbucket: 'Bucket of fish', bricks: 'Stack of bricks', paint: 'Paint cans', cart: 'Cleaning cart', barrow: 'Wheelbarrow',
  bin: 'Wheelie bin', pot: 'Flower pot', barrel: 'Barrel', buoy: 'Buoy', fishcrate: 'Crate of fish', plants: 'Seedlings', block: 'Stone block', bones: 'Fossil bones', campfire: 'Campfire', tent: 'Tent', sled: 'Sled', dog: 'A dog', tripod: 'Camera on a tripod',
  bike: 'Bicycle', coffeecart: 'Coffee cart', foodcart: 'Food cart', icecart: 'Ice-cream cart', flowers: 'Bucket of flowers', fruit: 'Crate of fruit', counter: 'Shop counter',
};
const GROUND_PICS = {
  bucket: [' kkkk ', 'AAAAAA', 'PPPPPP', 'PvvvvP', 'PPPPPP', ' PPPP '],
  wetsign: ['  PP  ', ' PPPP ', ' PkkP ', 'PPkkPP', 'PkPPkP', 'PPPPPP', 'P    P'],
  cone: ['  V  ', '  V  ', ' QQQ ', ' VVV ', 'QQQQQ', 'VVVVV', 'kkkkk'],
  toolbox: ['  kk  ', ' k  k ', 'xxxxxx', 'xNNNNx', 'xxxxxx'],
  crate: ['nnnnnnn', 'nNnnnNn', 'nnNnNnn', 'nnnNnnn', 'nnNnNnn', 'nNnnnNn', 'nnnnnnn'],
  cooler: ['QQQQQQ', 'BBBBBB', 'BkkkkB', 'BBBBBB'],
  tacklebox: ['  kk  ', 'BBBBBB', 'BaBBaB', 'BBBBBB'],
  trap: ['NNNNNNN', 'NrNrNrN', 'NNNNNNN', 'NrNrNrN', 'NNNNNNN'],
  fishbucket: [' kkkk ', 'AAAAAA', 'AffffA', 'AfvvfA', 'AAAAAA', ' AAAA '],
  bricks: ['xxkxx', 'kxxkx', 'xxkxx', 'kxxkx', 'xxkxx'],
  paint: ['AAA AAA', 'ABA AxA', 'ABA AxA', 'AAA AAA'],
  cart: ['  QQ   ', ' kkkkk ', ' BBBBB ', ' BPPPB ', ' BBBBB ', ' BBBBB ', ' k   k '],
  barrow: ['     kk', 'AAAAAk ', 'ANNNNA ', ' AAAA  ', '  kkk  ', '  kAk  ', '   k   '],
  bin: [' kkkkk ', 'GGGGGGG', 'GLGGGLG', 'GGGGGGG', 'GGGGGGG', 'GGGGGGG', 'GGGGGGG', ' k   k '],
  pot: [' G G ', 'GLGLG', ' GLG ', 'VVVVV', ' VVV ', ' VVV '],
  barrel: [' NNN ', 'nnnnn', 'AAAAA', 'nnnnn', 'nnnnn', 'AAAAA', ' nnn '],
  buoy: [' x ', 'xxx', 'QQQ', 'xxx', 'xxx', ' k '],
  fishcrate: ['nnnnnnn', 'nfffffn', 'nfBfBfn', 'nnnnnnn'],
  plants: ['G L G L', 'GLGLGLG', 'NNNNNNN', 'NnNnNnN'],
  block: ['aaaaaa', 'aAaaaa', 'aaaaAa', 'aaaaaa', 'AAAAAA'],
  bones: ['r   r ', 'rrrrr ', ' r  rr', 'rrrrrr', 'r  r  '],
  campfire: ['  j  ', ' jVj ', 'jVxVj', 'VxYxV', 'NnNnN'],
  tent: ['   B    ', '  BBB   ', ' BBkBB  ', ' BBkkBB ', 'BBBkkBBB', 'BBkkkkBB'],
  sled: ['N      ', 'NnnnnnN', 'NnnnnnN', ' N   N ', 'AAAAAAA'],
  dog: ['N    N', 'NnnnnN', 'nknnkn', 'nnkknn', ' nnnn ', 'nnnnnn', 'nn  nn'],
  tripod: ['kkkk', 'kQAk', 'kkkk', ' NN ', ' NN ', 'N  N', 'N  N', 'N  N'],
  bike: ['      kk ', ' kk   x  ', '  xxxxx  ', ' kkx  xk ', 'kAAk kAAk', 'kAAk kAAk', ' kk   kk '],
  coffeecart: ['  QQQQ  ', ' kkkkkk ', ' nnnnnn ', ' nQnnQn ', ' nnnnnn ', ' nnnnnn ', ' k    k '],
  foodcart: ['xQxQxQxQ', 'xxxxxxxx', ' AAAAAA ', ' AkkkkA ', ' AAAAAA ', ' AAAAAA ', ' k    k '],
  icecart: ['PQPQPQPQ', ' QQQQQQ ', ' QxQPvQ ', ' QQQQQQ ', ' QQQQQQ ', ' k    k '],
  flowers: [' xPx ', 'PGxGP', ' GGG ', ' nnn ', ' nnn ', ' nnn '],
  fruit: ['xVGxVPx', 'nnnnnnn', 'nNnnnNn', 'nnnnnnn'],
  counter: ['QQQQQQQQ', 'nnnnnnnn', 'nNnnnnNn', 'nnnnnnnn', 'nNnnnnNn', 'nnnnnnnn'],
};
export function drawGround(rows, view, look) {
  const pic = GROUND_PICS[look.ground];
  if (!pic) return rows;
  return withRoom(rows, (g) => {
    const m = metrics(g, view, look.build);
    const d = draw(g);
    const w = pic[0].length;
    const x = view === 'down' ? 23 + m.wide : view === 'up' ? 8 - m.wide - w : 8 - w;
    d.pic(x, m.gy - pic.length + 1, pic);
  });
}

// ---------- Companions ----------
export const BUDDIES = { parrot: 'Parrot on the shoulder', gull: 'Gull on the shoulder' };
export function drawBuddy(rows, view, look) {
  const kind = look.buddy;
  if (!BUDDIES[kind]) return rows;
  return withRoom(rows, (g) => {
    const m = metrics(g, view, look.build);
    const d = draw(g);
    const bird = kind === 'parrot' ? [' xx ', 'xxQY', 'xGx ', 'GGx ', ' Bx '] : [' QQ ', 'QQkY', 'QAQ ', 'AQQ ', ' Q  '];
    const y = m.Y(9);
    if (view === 'down') d.pic(21 + m.wide, y, bird);
    else if (view === 'up') d.pic(7 - m.wide, y, d.flip(bird));
    else d.pic(11, y + 1, bird);
  });
}

// ---------- Poses: two frames of someone at work ----------
// Each pose faces one way (`view`), runs at `rate` frames a second, and draws over the
// standing person: the hand that hangs at the side is tucked away and arms and tools
// are drawn where the work is.
export const POSES = {
  mop: 'Mopping', sweep: 'Sweeping', pushbroom: 'Push broom', dust: 'Dusting', wipe: 'Cleaning a window', polish: 'Floor polisher', rake: 'Raking',
  water: 'Watering', prune: 'Pruning', mow: 'Mowing', barrow: 'Wheelbarrow', hammer: 'Hammering', dig: 'Digging', jackhammer: 'Jackhammer', saw: 'Sawing',
  weld: 'Welding', flag: 'Flagging traffic', roll: 'Painting a wall', plaster: 'Plastering', point: 'Pointing', survey: 'Surveying', brick: 'Laying bricks',
  chisel: 'Carving stone', fish: 'Fishing', castnet: 'Casting a net', net: 'Skimming with a net', telescope: 'Telescope', wave: 'Waving', swim: 'Swimming',
  lounge: 'Sunbathing', detect: 'Metal detecting', snow: 'Shovelling snow', read: 'Reading a map',
  brush: 'Brushing a find', pick: 'Pickaxe', sift: 'Sieving', pan: 'Panning for gold', binoculars: 'Binoculars', chop: 'Clearing the path', lurch: 'Lurching',
  inspect: 'Inspecting', shush: 'Shushing', present: 'Leading a tour', photo: 'Taking a photo', gavel: 'Gavel', type: 'Typing',
  kite: 'Flying a kite', selfie: 'Selfie', stroller: 'Pushing a stroller', knit: 'Knitting', rest: 'Resting', nap: 'Napping', call: 'On the phone', speech: 'Giving a speech',
  jog: 'Jogging', yoga: 'Yoga', book: 'Reading a book', tvcamera: 'TV camera', magnify: 'Magnifying glass', sneak: 'Sneaking', lookaround: 'Looking around',
  knead: 'Kneading dough', stir: 'Stirring a pot',
};
export const POSE_VIEW = { dust: 'down', wipe: 'up', polish: 'down', jackhammer: 'down', flag: 'down', roll: 'up', plaster: 'up', wave: 'down', swim: 'down', lounge: 'down', read: 'down', sift: 'down', shush: 'down', present: 'down', type: 'down',
  kite: 'down', knit: 'sit', rest: 'sit', nap: 'sit', speech: 'down', yoga: 'down', book: 'down' };
export const POSE_RATE = { flag: 0.5, survey: 0.7, telescope: 0.6, lounge: 0.3, read: 0.4, point: 1.2, fish: 0.9, wave: 2.5, jackhammer: 10, polish: 5, weld: 7, swim: 2, binoculars: 0.5, inspect: 0.6, shush: 0.5, present: 1.5, photo: 0.4, type: 3, sift: 5, lurch: 1.5, gavel: 1.5,
  kite: 1, selfie: 0.4, stroller: 2, knit: 2, rest: 0.4, nap: 0.6, call: 0.5, speech: 1, jog: 4, yoga: 0.5, book: 0.3, tvcamera: 1, magnify: 0.8, sneak: 2, lookaround: 0.7, knead: 2, stir: 2 };

// the hand at the side is painted over with the clothes next to it
function tuck(g, m) {
  const { hx, hy, view, top } = m;
  if (view === 'side') {
    const c = g[hy]?.[hx - 1] ?? 'c';
    [hy, hy + 1].forEach((y) => [hx, hx + 1].forEach((x) => g[y][x] === 's' && (g[y][x] = c === 's' ? 'c' : c)));
    return;
  }
  [hy, hy + 1].forEach((y) => {
    const x = view === 'down' ? hx : hx;
    if (g[y][x] === 's') g[y][x] = g[y - 1]?.[x] && g[y - 1][x] !== 's' ? g[y - 1][x] : 'c';
  });
  void top;
}
// a sleeve from the shoulder to a hand, side view
function arm(d, from, to, sleeve = 'c') {
  d.line(from[0], from[1], to[0], to[1], sleeve);
  d.px(to[0], to[1], 's');
  d.px(to[0] + 1, to[1], 's');
}
// a sleeve and hand that leave the body: outlined
function armOut(d, cells, handAt, sleeve = 'c', skin = 's') {
  cells.forEach(([x, y]) => d.px(x, y, sleeve));
  d.pic(handAt[0], handAt[1], [skin + skin, skin + skin]);
  cells.forEach(([x, y]) => [[1, 0], [-1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => d.get(x + dx, y + dy) === '.' && d.px(x + dx, y + dy, 'o')));
}

const POSE_DRAW = {
  // side view, both hands on a long handle swept back and forth along the ground
  mop: (d, m, f, g) => longHandle(d, m, f, g, ['rrrr', 'r r r'], 'N'),
  sweep: (d, m, f, g) => longHandle(d, m, f, g, [' NN ', 'PPPP', 'P P P'], 'N'),
  pushbroom: (d, m, f, g) => longHandle(d, m, f, g, ['NNNNNN', 'kkkkkk'], 'N', 2),
  rake: (d, m, f, g) => longHandle(d, m, f, g, ['AAAAAAA', 'A A A A'], 'N', 1, f ? ['V', ' '] : null),
  snow: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    const bx = f ? 22 : 21;
    const by = f ? gy - 5 : gy - 2;
    d.line(14, top + 13, bx, by, 'N');
    d.pic(bx, by, f ? ['QQQ', 'AAA'] : ['AAA', 'aAa']);
    if (!f) d.pic(24, gy - 1, ['QQQQ']);
    hands(d, [[16, top + 15], [18, top + 18]]);
  },
  dig: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    if (!f) {
      d.line(15, top + 12, 21, gy - 3, 'N');
      d.pic(21, gy - 3, ['AA', 'AA', 'a ']);
      d.pic(24, gy - 1, [' NN', 'NNNN']);
    } else {
      d.line(14, top + 14, 22, gy - 7, 'N');
      d.pic(22, gy - 7, ['NNN', 'AAA', 'aA ']);
      d.pic(25, gy - 1, ['NN']);
    }
    hands(d, f ? [[16, top + 14], [19, top + 16]] : [[16, top + 14], [18, top + 17]]);
  },
  hammer: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    if (!f) {
      armOut(d, [[17, top + 12], [18, top + 11]], [19, top + 9]);
      d.line(20, top + 9, 20, top + 6, 'n');
      d.pic(19, top + 4, ['AAA', 'A  ']);
    } else {
      arm(d, [16, top + 14], [19, top + 17]);
      d.line(21, top + 17, 23, top + 19, 'n');
      d.pic(23, top + 19, ['AA', 'AA']);
    }
    d.pic(20, gy - 1, ['nnnnnnnn']);
  },
  chisel: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.pic(21, gy - 4, ['aaaaaa', 'aAaaaa', 'aaaaAa', 'AAAAAA']);
    d.line(20, gy - 6, 21, gy - 5, 'A');
    if (!f) {
      armOut(d, [[17, top + 13], [18, top + 12]], [19, top + 10]);
      d.pic(20, top + 8, ['NN', 'N ']);
    } else {
      arm(d, [16, top + 14], [18, top + 17]);
      d.pic(20, top + 16, ['NN']);
      d.px(22, gy - 6, 'j');
    }
  },
  saw: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    const x = f ? 20 : 18;
    arm(d, [16, top + 15], [x, top + 17]);
    d.pic(x + 2, top + 17, ['NAAAAAA', ' a a a ']);
    d.pic(19, gy - 5, ['nnnnnnnnnnn', 'NNNNNNNNNNN', ' n       n ', ' n       n ', ' n       n ']);
  },
  weld: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    arm(d, [16, top + 15], [19, top + 17]);
    d.pic(21, top + 17, ['AAa']);
    d.pic(22, gy - 1, ['AAAAAAA']);
    const sparks = f ? [[25, top + 15], [27, top + 17], [24, top + 19], [28, top + 20]] : [[26, top + 16], [24, top + 15], [27, top + 19], [25, top + 21]];
    sparks.forEach(([x, y], i) => d.px(x, y, i % 2 ? 'Y' : 'j'));
    d.px(24, top + 18, 'Q');
  },
  water: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    arm(d, [16, top + 15], [19, top + 16]);
    d.pic(21, top + 15, ['BBBB  ', 'BBBBBB', 'BBBB  ']);
    d.px(27, top + 15, 'B');
    const drops = f ? [[28, top + 17], [27, top + 19], [28, top + 21], [27, top + 23]] : [[28, top + 18], [27, top + 20], [28, top + 22]];
    drops.forEach(([x, y]) => d.px(x, y, 'v'));
    d.pic(26, gy - 2, [' G G ', 'GLGLG']);
  },
  prune: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    arm(d, [16, top + 14], [19, top + 15]);
    d.pic(21, top + 14, f ? ['AA ', '  A', 'AA '] : ['A  ', ' AA', 'A  ']);
    d.pic(23, gy - 8, ['  GG  ', ' GLGG ', 'GGGLGG', 'GLGGGG', ' GGLG ', '  NN  ', '  NN  ', ' NNNN ']);
  },
  mow: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.line(16, top + 15, 22, gy - 5, 'k');
    d.pic(21, gy - 4, ['xxxxxxx', 'xxxxxxx', 'kAk kAk']);
    hands(d, [[16, top + 15], [17, top + 16]]);
    if (f) [[29, gy - 2], [30, gy - 4], [28, gy - 5]].forEach(([x, y]) => d.px(x, y, 'L'));
  },
  barrow: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.line(17, top + 17, 21, top + 18, 'n');
    d.pic(21, gy - 7, ['AAAAAAAA', 'ANNNNNNA', ' ANNNNA ', '  AAAA  ', '    kkk ', '    kAk ', '     k  ']);
    hands(d, [[17, top + 17]]);
    if (f) d.px(27, gy, 'o');
  },
  jackhammer: (d, m, f) => {
    const { top, gy, hy } = m;
    d.pic(11 - m.wide, hy - 1, ['kkkkkkkkkk'], null);
    d.pic(14, hy, ['AAAA', 'AaaA', 'AAAA', 'AaaA', ' AA ', ' AA ', ' AA ', ' kk '].slice(0, gy - hy + 1));
    if (f) [[10, gy - 1], [21, gy - 1], [12, gy], [19, gy]].forEach(([x, y]) => d.px(x, y, 'r'));
    void top;
  },
  polish: (d, m, f) => {
    const { hy, gy } = m;
    const x = f ? 1 : 2;
    d.line(9 - m.wide, hy, x + 4, gy - 3, 'k');
    d.pic(x, gy - 2, [' AAAAA ', 'AAAAAAA', ' kkkkk ']);
    d.px(9 - m.wide, hy, 's');
  },
  dust: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    armOut(d, [[9 - m.wide, top + 11], [8 - m.wide, top + 10], [8 - m.wide, top + 9]], [7 - m.wide, top + 7]);
    d.line(7 - m.wide, top + 6, 7 - m.wide, top + 3, 'N');
    d.pic(5 - m.wide + (f ? 1 : 0), top - 1, [' P P ', 'PPPPP', ' PPP ']);
  },
  wipe: (d, m, f, g) => upTool(d, m, f, g, ['kkkkk', 'AAAAA']),
  roll: (d, m, f, g) => upTool(d, m, f, g, ['QQQQQ', 'BBBBB', ' kkk '], true),
  plaster: (d, m, f, g) => upTool(d, m, f, g, ['AAAA', ' kk '], false, true),
  flag: (d, m, f, g) => {
    tuck(g, m);
    const { top, hy } = m;
    const x = 7 - m.wide;
    d.line(x, hy + 1, x, top + 2, 'A');
    d.pic(x - 3, top - 4, f ? ['   P   ', '  PPP  ', ' PPkPP ', 'PPkkkPP', ' PPPPP ', '  PPP  ', '   P   '] : [' xxxxx ', 'xxxxxxx', 'xQQQQQx', 'xQQQQQx', 'xxxxxxx', ' xxxxx ']);
    d.px(x + 1, hy, 's');
    d.px(x + 2, hy, 's');
  },
  point: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    const y = top + (f ? 12 : 13);
    armOut(d, [[18, top + 13], [19, y], [20, y], [21, y]], [22, y - 1]);
    d.px(24, y - 1, 's');
  },
  survey: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.pic(21, top + 6, ['kAAAk', 'AAAAA', ' kAk ']);
    if (f) d.px(25, top + 6, 'x');
    d.line(23, top + 9, 20, gy, 'N');
    d.line(23, top + 9, 23, gy, 'N');
    d.line(23, top + 9, 26, gy, 'N');
    arm(d, [16, top + 14], [20, top + 9]);
  },
  brick: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.pic(21, gy - 5, ['xxxkxxxkxx', 'kxxxkxxxkx', 'xxxkxxxkxx', 'kxxxkxxxkx', 'xxxkxxxkxx'].map((r) => (f ? r : r.slice(0, 7))));
    arm(d, [16, top + 15], [19, gy - 8]);
    d.pic(21, gy - 8, ['AA', ' A']);
  },
  fish: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    arm(d, [16, top + 15], [18, top + 16]);
    d.line(19, top + 17, 29, top + 2, 'N');
    d.px(18, top + 18, 'A');
    d.line(29, top + 3, 30, gy - 2, 'l');
    d.pic(30, gy - (f ? 2 : 1), ['x', 'Q']);
  },
  castnet: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    if (!f) {
      arm(d, [16, top + 14], [19, top + 13]);
      d.pic(20, top + 12, [' ll ', 'llll', ' ll ']);
    } else {
      armOut(d, [[17, top + 12], [18, top + 11], [19, top + 10]], [20, top + 8]);
      d.pic(21, top + 2, ['   l l l  ', '  l l l l ', ' l l l l l', 'l l l l l ', ' l l l l l', 'l l l l l ', ' l l l l  '], null);
    }
  },
  net: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    const tip = f ? [25, gy - 4] : [24, gy - 6];
    d.line(15, top + 12, tip[0], tip[1], 'N');
    d.pic(tip[0], tip[1] - 1, [' AAAA ', 'AllllA', ' AAAA ']);
    hands(d, [[16, top + 14], [19, top + 17]]);
  },
  telescope: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    const y = top + 6 - (f ? 1 : 0);
    d.pic(19, y, ['YYAAAAAA', 'YYAAAAAA'], 'o');
    arm(d, [16, top + 13], [20, y + 2]);
  },
  wave: (d, m, f, g) => {
    tuck(g, { ...m, hx: 21 + m.wide, view: 'down' });
    const { top } = m;
    const w = m.wide;
    if (!f) armOut(d, [[22 + w, top + 12], [22 + w, top + 11], [23 + w, top + 10]], [23 + w, top + 8]);
    else armOut(d, [[22 + w, top + 12], [23 + w, top + 11], [24 + w, top + 10]], [24 + w, top + 8]);
  },
  read: (d, m, f) => {
    const { hy } = m;
    d.pic(12 - m.wide, hy - 4, f ? ['rrrPrrrr', 'rxrrrPrr', 'rrPrrrrr', 'rrrrrxrr'] : ['rrPrrrrr', 'rrrrxrPr', 'rPrrrrrr', 'rrrxrrrr']);
  },
  brush: (d, m, f, g) => {
    // kneeling: the legs fold under and the body drops two rows
    const k = kneel(g, m);
    const { top } = k;
    const gy = m.gy;
    arm(d, [16, top + 14], [19, gy - 4]);
    d.pic(21, gy - 4, ['nn', ' P']);
    d.pic(21 + (f ? 1 : 0), gy - 1, ['rrrrr', 'r r r']);
    if (f) d.px(27, gy - 3, 'j');
  },
  pick: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.pic(22, gy - 4, ['aaaaa', 'aAaaa', 'aaaAa', 'AAAAA']);
    if (!f) {
      armOut(d, [[17, top + 12], [18, top + 11]], [19, top + 9]);
      d.line(20, top + 9, 21, top + 4, 'n');
      d.pic(19, top + 2, [' AAA ', 'A   A']);
    } else {
      arm(d, [16, top + 14], [19, top + 16]);
      d.line(21, top + 16, 23, gy - 6, 'n');
      d.pic(22, gy - 6, ['AA', ' A']);
      d.px(26, gy - 6, 'j');
      d.px(25, gy - 7, 'Y');
    }
  },
  sift: (d, m, f) => {
    const { hy } = m;
    const x = 9 - m.wide + (f ? 1 : 0);
    d.pic(x, hy - 1, ['n'.repeat(14 + m.wide * 2), 'na'.repeat(7 + m.wide)]);
    if (f) [[12, hy + 2], [16, hy + 3], [19, hy + 2], [14, hy + 5]].forEach(([px, py]) => d.px(px, py, 'N'));
  },
  pan: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    arm(d, [16, top + 15], [19, top + 18]);
    d.pic(20, top + 18, f ? ['AAAAAA', 'AvvYNA', ' AAAA '] : ['AAAAAA', 'ANNvvA', ' AAAA ']);
  },
  binoculars: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    const y = top + 5 + (f ? 1 : 0);
    d.pic(19, y, ['kkk', 'kAk', 'kkk']);
    arm(d, [16, top + 13], [19, y + 3]);
  },
  chop: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    if (!f) {
      armOut(d, [[17, top + 12], [18, top + 11]], [19, top + 9]);
      d.pic(20, top + 4, [' a', ' a', 'a ', 'n ', 'n ']);
    } else {
      arm(d, [16, top + 14], [20, top + 16]);
      d.pic(22, top + 16, ['aaa', '  a']);
      [[25, gy - 9], [27, gy - 6], [24, gy - 4]].forEach(([x, y]) => d.px(x, y, 'G'));
    }
    d.pic(26, gy - 8, [' GG', 'GLG', 'GGL', ' G ', ' G ', ' N ', ' N ', ' N ']);
  },
  lurch: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    const y = top + 13 - (f ? 1 : 0);
    armOut(d, [[18, y], [19, y], [20, y], [21, y]], [22, y - 1], 'r', 'r');
  },
  inspect: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    arm(d, [16, top + 14], [19, top + 12]);
    d.pic(21, top + 9, f ? [' x ', 'xYx', 'xxx', ' x '] : [' x ', 'xxx', 'xYx', ' x ']);
  },
  shush: (d, m, f) => {
    const { top } = m;
    d.line(11, top + 14, 14, top + 11, 'c');
    d.pic(15, top + 9 + (f ? 1 : 0), ['S', 's', 's'], null);
  },
  present: (d, m, f, g) => {
    tuck(g, { ...m, hx: 21 + m.wide, view: 'down' });
    const { top } = m;
    const w = m.wide;
    armOut(d, [[22 + w, top + 12], [22 + w, top + 11], [23 + w, top + 10]], [23 + w, top + 8]);
    d.line(24 + w, top + 9, 24 + w, top - 4, 'k');
    d.pic(25 + w, top - 4, f ? ['PPP ', 'PPPP', 'PPP '] : ['PPPP', 'PPP ', 'PPPP']);
  },
  photo: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    d.pic(19, top + 5, ['kkkk', 'kQAk', 'kkkk']);
    arm(d, [16, top + 13], [19, top + 8]);
    if (f) d.pic(24, top + 4, ['Q Q', ' Q ', 'Q Q'], null);
  },
  gavel: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.pic(21, gy - 10, ['nnnnnn', 'NNNNNN', ' nnnn ', ' nnnn ', ' nnnn ', ' nnnn ', ' nnnn ', ' nnnn ', ' nnnn ', 'NNNNNN']);
    if (!f) {
      armOut(d, [[17, top + 12], [18, top + 11]], [19, top + 9]);
      d.pic(20, top + 6, ['NN', 'n ']);
    } else {
      arm(d, [16, top + 14], [20, gy - 12]);
      d.pic(22, gy - 12, ['NN']);
      d.px(25, gy - 12, 'j');
    }
  },
  type: (d, m, f) => {
    const { hy } = m;
    d.pic(10 - m.wide, hy - 3, ['kkkkkkkkkkkk'.slice(0, 12 + m.wide * 2), ('k' + (f ? 'vBvvBvvBvv' : 'vvBvvvBvvv') + 'k').slice(0, 12 + m.wide * 2), 'aaaaaaaaaaaa'.slice(0, 12 + m.wide * 2)]);
  },
  kite: (d, m, f) => {
    const { hx, hy, top } = m;
    const kx = f ? 1 : 2;
    d.line(hx - 1, hy, kx + 2, top - 3, 'l');
    d.pic(kx, top - 9, ['  x  ', ' xQx ', 'xxQxx', ' xQx ', '  x  ', '  P  ']);
    hand(d, m);
  },
  selfie: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    armOut(d, [[17, top + 12], [18, top + 11]], [19, top + 9]);
    d.line(20, top + 9, 24, top + 2, 'k');
    d.pic(24, top - 1, ['kk', f ? 'QQ' : 'kv', 'kk']);
  },
  stroller: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.line(18, top + 16, 21, gy - 9, 'k');
    hands(d, [[17, top + 16]]);
    d.pic(21, gy - 8, [' BBBBBB ', 'BBBBBBBB', 'BBBBBBBB', ' BBBBBB ', '  k  k  ', f ? ' kAk kAk' : ' Akk Akk', '  k  k  ']);
  },
  knit: (d, m, f) => {
    const { hy, gy } = m;
    d.pic(12, hy - 2, f ? ['A    A ', ' A  A  ', '  xx   '] : [' A  A  ', 'A    A ', '  xx   ']);
    d.pic(22, gy - 2, [' xx', 'xxx']);
  },
  rest: (d, m, f, g) => {
    if (f) blink(g, m);
  },
  nap: (d, m, f, g) => {
    blink(g, m);
    const { top } = m;
    d.pic(f ? 20 : 22, top - (f ? 4 : 2), ['QQQ', ' Q ', 'QQQ'], null);
  },
  call: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    d.line(15, top + 13, 14, top + 10, 'c');
    d.pic(13, top + 7, ['kk', 'ks', 'ss']);
    if (f) blink(g, m);
  },
  speech: (d, m, f, g) => {
    tuck(g, { ...m, hx: 21 + m.wide, view: 'down' });
    const { top, hy } = m;
    const w = m.wide;
    if (f) armOut(d, [[22 + w, top + 12], [22 + w, top + 11], [23 + w, top + 10]], [23 + w, top + 8]);
    else d.pic(22 + w, hy - 1, ['ss']);
    d.pic(7 - w, hy - 2, ['QQ', 'Qk', 'QQ']);
  },
  jog: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    hands(d, [[f ? 12 : 18, top + 15]]);
  },
  yoga: (d, m, f, g) => {
    tuck(g, m);
    tuck(g, { ...m, hx: 21 + m.wide, view: 'down' });
    const { top, gy } = m;
    const w = m.wide;
    const s = f ? 1 : 0;
    const left = [];
    const right = [];
    for (let y = top + 11; y >= top + 1; y--) {
      left.push([9 - w, y]);
      right.push([22 + w, y]);
    }
    [[10 - w, top], [11 - w, top - 1], [12, top - 1], [13, top - 2], [14, top - 2]].forEach((c) => left.push(c));
    [[21 + w, top], [20 + w, top - 1], [19, top - 1], [18, top - 2], [17, top - 2]].forEach((c) => right.push(c));
    armOut(d, left.map(([x, y]) => [x + s, y]), [15 + s, top - 4]);
    armOut(d, right.map(([x, y]) => [x + s, y]), [15 + s, top - 4]);
    d.pic(4, gy, ['PPPPPP            PPPPPP']);
  },
  book: (d, m, f) => {
    const { hy } = m;
    d.pic(11 - m.wide, hy - 4, f ? ['rrrrkrrrr', 'rkrkkkrkr', 'rrrrkrrrr'] : ['rrrrkrrrr', 'rkrrkrkrr', 'rrrrkrrrr']);
  },
  tvcamera: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    d.pic(12, top + 7, ['kkkkkkkkk', 'kkkkkkkAA', 'kkkkkkkAA', 'kkkkkkkkk']);
    if (f) d.px(13, top + 6, 'x');
    hands(d, [[18, top + 11]]);
  },
  magnify: (d, m, f, g) => {
    tuck(g, m);
    const { top } = m;
    arm(d, [16, top + 14], [20, top + 17]);
    d.pic(21 + (f ? 1 : 0), top + 14, [' AA ', 'AvvA', 'AvvA', ' AA ', '  n ']);
  },
  sneak: (d, m, f, g) => {
    // tiptoeing, hands up and creeping forward
    tuck(g, m);
    const { top } = m;
    hands(d, f ? [[18, top + 12], [12, top + 14]] : [[17, top + 14], [13, top + 12]]);
  },
  lookaround: () => {},
  knead: (d, m, f, g) => {
    tuck(g, m);
    const { gy } = m;
    d.pic(21, gy - 7, ['nnnnnnnn', ' n    n ', ' n    n ', ' n    n ', ' n    n ', ' n    n ', ' n    n ']);
    d.pic(22, gy - (f ? 8 : 9), f ? ['rrrrr'] : [' rrr ', 'rrrrr']);
    arm(d, [16, m.top + 15], [20, gy - 9 + (f ? 1 : 0)]);
  },
  stir: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    d.pic(21, gy - 6, ['AAAAAA', 'AvvvvA', 'AAAAAA', ' k  k ', ' k  k ', ' k  k ']);
    arm(d, [16, top + 15], [19, top + 16]);
    d.line(21, top + 16, f ? 23 : 25, gy - 6, 'A');
    d.pic(f ? 22 : 24, top + 12, ['Q', ' ', 'Q'], null);
  },
  detect: (d, m, f, g) => {
    tuck(g, m);
    const { top, gy } = m;
    const x = f ? 25 : 22;
    d.line(17, top + 16, x, gy - 1, 'A');
    d.pic(x - 1, gy, ['kAAk']);
    d.pic(18, top + 15, ['kk']);
    hands(d, [[17, top + 16]]);
  },
};
// Closed eyes (sleeping, blinking).
function blink(g, m) {
  [6, 7].forEach((r) => {
    const row = g[m.top + r];
    row?.forEach((c, x) => c === 'e' && (row[x] = r === 7 ? 'k' : 'S'));
  });
}
// Kneeling (side view): drops the body two rows and folds the back leg along the ground.
// Returns where things now are.
function kneel(g, m) {
  tuck(g, m);
  const at = m.Y(22);
  g.splice(at, 2);
  g.unshift(Array(T).fill('.'), Array(T).fill('.'));
  const d = draw(g);
  d.pic(5, m.gy - 1, ['bbpppp']);
  return { ...m, top: m.top + 2, hy: m.hy + 2 };
}
function hands(d, list) {
  list.forEach(([x, y]) => {
    d.px(x, y, 's');
    d.px(x + 1, y, 's');
  });
}
function longHandle(d, m, f, g, head, stick = 'N', extra = 0, bits = null) {
  tuck(g, m);
  const { top, gy } = m;
  const bx = (f ? 23 : 20) + extra;
  d.line(13, top + 10, bx, gy - head.length + 1, stick);
  d.pic(bx - 1, gy - head.length + 2, head);
  hands(d, [[15, top + 14], [17, top + 17]]);
  if (bits) d.px(bx + 4, gy, bits[0] === ' ' ? '.' : bits[0]);
}
function upTool(d, m, f, g, tool, trail = false, hawk = false) {
  tuck(g, m);
  const { top } = m;
  const w = m.wide;
  const y = top + (f ? 2 : 7);
  armOut(d, [[22 + w, top + 12], [22 + w, top + 11], [23 + w, top + 10], [23 + w, y + 4 > top + 9 ? top + 9 : y + 4]], [23 + w, y + 2]);
  d.line(24 + w, y + 2, 24 + w, y + 1, 'k');
  d.pic(22 + w, y - tool.length + 1, tool);
  if (trail) d.line(28 + w, top + 2, 28 + w, top + 12, 'B');
  if (hawk) d.pic(6 - w, top + 14, ['AAAA', ' k  ']);
}

// The frames of a pose, from the person drawn standing in the pose's view (`base(view)`).
export function poseFrames(pose, base, look) {
  const fn = POSE_DRAW[pose];
  const view = POSE_VIEW[pose] || 'side';
  if (pose === 'swim') {
    return [0, 1].map((f) => {
      const g = toGrid(base('down'));
      const m = metrics(g, 'down', look.build);
      const cut = m.Y(13);
      for (let y = cut; y < g.length; y++) g[y].fill('.');
      const d = draw(g);
      d.line(8, cut, 23, cut, 'l');
      [[9, cut], [13, cut], [18, cut], [22, cut]].forEach(([x, y]) => d.px(x + f, y, 'Q'));
      d.line(10, cut + 1, 21, cut + 1, 'v');
      d.pic(f ? 23 : 6, cut - 2, ['ss', 'ss']);
      return fromGrid(g);
    });
  }
  if (pose === 'lounge') {
    const sit = base('sit');
    return [0, 1].map((f) => withRoom(sit, (g) => {
      const d = draw(g);
      const y = g.length - 2;
      d.pic(6, y, [f ? 'XQXQXQXQXQXQXQXQXQXQ' : 'QXQXQXQXQXQXQXQXQXQX'], null);
      d.pic(6, y + 1, ['XXXXXXXXXXXXXXXXXXXX'], null);
    }));
  }
  if (!fn) return null;
  const stepping = pose === 'jog' || pose === 'sneak';
  return [0, 1].map((f) => {
    let rows = base(view, stepping ? f + 1 : 0);
    if (pose === 'lookaround' && f) rows = fromGrid(toGrid(rows).map((r) => r.reverse()));
    return withRoom(rows, (g) => fn(draw(g), metrics(g, view, look.build), f, g));
  });
}
export const poseView = (pose) => (pose === 'lounge' ? 'sit' : POSE_VIEW[pose] || 'side');
