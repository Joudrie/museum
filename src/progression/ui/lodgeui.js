// The lodge: rooms, the aquarium with its swimming fish, and the trophy wall.
import { speciesById } from '../species.js';
import { drawEntry } from '../../collections/render.js';
import { sfx } from '../../music.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const sizeText = (cm) => (cm >= 100 ? `${(cm / 100).toFixed(2)} m` : `${cm} cm`);

export function lodgeTab(p, refresh) {
  const nodes = [];
  const h = p.house;
  const rooms = el('div', 'pg-sec');
  rooms.append(Object.assign(el('h3'), { textContent: 'Rooms' }));
  h.rooms().forEach((r) => {
    const row = el('div', `pg-row${r.owned ? '' : ' done'}`);
    row.append(el('b', '', r.name), el('span', '', r.owned ? 'Yours' : 'Buy at the market'));
    rooms.appendChild(row);
  });
  nodes.push(rooms);

  // the aquarium
  const cap = h.capacity();
  const aq = el('div', 'pg-sec');
  aq.append(Object.assign(el('h3'), { textContent: 'Aquarium' }));
  if (!cap) aq.appendChild(el('p', 'pg-empty', 'Buy the aquarium room at the market (Rank 15) to keep your fish here.'));
  else {
    const tank = el('div', 'lodge-tank');
    h.aquarium().forEach((id, i) => {
      const sp = speciesById(id);
      const c = drawEntry(sp.entry, 3);
      c.className = 'lodge-fish';
      c.style.cssText = `--y:${8 + ((i * 37) % 70)}%;--d:${16 + ((i * 7) % 14)}s;--delay:-${(i * 3) % 14}s;`;
      c.title = sp.name;
      c.onclick = () => h.removeFish(id) || refresh();
      tank.appendChild(c);
    });
    aq.appendChild(tank);
    aq.appendChild(el('p', 'pg-empty', `${h.aquarium().length} of ${cap} fish. Tap a fish to take it out.`));
    const avail = h.available();
    if (avail.length && h.aquarium().length < cap) {
      const pick = el('div', 'pg-grid');
      avail.slice(0, 18).forEach((id) => {
        const sp = speciesById(id);
        const cell = el('button', 'pg-cell');
        cell.append(drawEntry(sp.entry, 3), el('span', 'nm', sp.name));
        cell.onclick = () => {
          h.addFish(id);
          sfx('plop');
          refresh();
        };
        pick.appendChild(cell);
      });
      aq.append(el('p', 'pg-empty', 'Put one in:'), pick);
    }
  }
  nodes.push(aq);

  // the trophy wall
  const wall = el('div', 'pg-sec');
  wall.append(Object.assign(el('h3'), { textContent: 'Trophy wall' }));
  const mounted = p.state.house.mounts;
  const tr = p.state.fish.trophies;
  if (!tr.length) wall.appendChild(el('p', 'pg-empty', 'A Trophy-class catch (the top 2% of its kind) can hang here.'));
  tr.forEach((t, i) => {
    const sp = speciesById(t.id);
    if (!sp) return;
    const row = el('div', `pg-row${mounted.includes(i) ? ' pinned' : ''}`);
    row.append(el('b', `r${sp.rarity}`, `${t.variant ? t.variant + ' ' : ''}${sp.name} · ${sizeText(t.size)}`));
    const b = el('button', 'ui-btn', mounted.includes(i) ? 'Take down' : 'Mount');
    b.onclick = () => {
      mounted.includes(i) ? h.unmount(i) : h.mount(i);
      sfx('place');
      refresh();
    };
    row.appendChild(b);
    wall.appendChild(row);
  });
  nodes.push(wall);

  const f = h.furniture();
  if (f.length) {
    const sec = el('div', 'pg-sec');
    sec.append(Object.assign(el('h3'), { textContent: 'Furniture' }));
    f.forEach((x) => sec.appendChild(Object.assign(el('div', 'pg-row'), { textContent: x })));
    nodes.push(sec);
  }
  return nodes;
}
