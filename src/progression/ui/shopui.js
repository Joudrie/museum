// The Island Market: sell your catch, buy bait, rods, boats, lodge rooms and style, craft bait, wear what you own.
import { COSMETICS } from '../grants.js';
import { speciesById } from '../species.js';
import { sfx } from '../../music.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const SLOT_NAME = { hat: 'Hat', outfit: 'Outfit', rodskin: 'Rod', boatpaint: 'Boat', frame: 'Frame', title: 'Title' };

export function shopTab(p, refresh) {
  const nodes = [];
  const m = p.market;
  const gold = el('div', 'pg-row pinned');
  gold.append(el('b', '', `${Math.round(p.gold.get())} gold`), el('span', '', p.state.market.sellBonus ? `Sell prices +${Math.round(p.state.market.sellBonus * 100)}%` : ''));
  nodes.push(gold);

  // sell
  const bag = p.state.fish.bag;
  const sell = el('div', 'pg-sec');
  sell.append(Object.assign(el('h3'), { textContent: 'Sell your catch' }));
  if (!bag.length) sell.appendChild(el('p', 'pg-empty', 'Your bag is empty. Fish are sold at half their worth; the best of each kind is kept for your journal and tank.'));
  else {
    const dupes = el('button', 'ui-btn ui-btn--wide', 'Sell all extras (keep the best of each)');
    dupes.onclick = () => {
      const g = m.sellDuplicates();
      sfx(g ? 'sell' : 'nope');
      refresh();
    };
    sell.appendChild(dupes);
    bag.slice(-12).reverse().forEach((b, k) => {
      const idx = bag.length - 1 - k;
      const sp = speciesById(b.id);
      const row = el('div', 'pg-row');
      row.append(Object.assign(el('b', `r${sp?.rarity || 1}${b.variant ? ' rv' : ''}`), { textContent: `${b.variant ? b.variant + ' ' : ''}${sp?.name || b.id} · ${b.size} cm ${b.sizeClass}` }));
      const btn = el('button', 'ui-btn', `Sell ${m.value(b)}`);
      btn.onclick = () => {
        m.sellFish(idx);
        sfx('sell');
        refresh();
      };
      row.appendChild(btn);
      sell.appendChild(row);
    });
  }
  nodes.push(sell);

  // buy, by section
  const sections = new Map();
  m.entries().forEach((e) => {
    if (!sections.has(e.section)) sections.set(e.section, []);
    sections.get(e.section).push(e);
  });
  sections.forEach((list, name) => {
    const sec = el('div', 'pg-sec');
    sec.append(Object.assign(el('h3'), { textContent: name }));
    list.forEach((e) => {
      const row = el('div', `pg-row${e.blocked === 'Owned' ? ' done' : ''}`);
      const label = el('b', e.rarity ? `r${e.rarity}` : '', e.name + (e.rare ? ' ★ today only' : ''));
      row.append(label);
      const b = el('button', 'ui-btn', e.blocked ? e.blocked : `${e.price} gold`);
      b.disabled = !!e.blocked;
      b.onclick = () => {
        const r = m.buy(e.id);
        sfx(r.ok ? 'sell' : 'nope');
        if (!r.ok && r.reason === 'gold') b.textContent = 'Not enough gold';
        else refresh();
      };
      row.appendChild(b);
      if (e.ladder) row.appendChild(el('small', '', e.ladder.text));
      sec.appendChild(row);
    });
    nodes.push(sec);
  });

  // craft
  const rec = m.recipes().filter((r) => r.known);
  if (rec.length) {
    const sec = el('div', 'pg-sec');
    sec.append(Object.assign(el('h3'), { textContent: 'Craft bait' }));
    rec.forEach((r) => {
      const row = el('div', 'pg-row');
      row.append(el('b', '', `${r.name}: ${Object.entries(r.needs).map(([k, n]) => `${n} ${k}`).join(', ')}`));
      const b = el('button', 'ui-btn', 'Make 4');
      b.disabled = !r.can;
      b.onclick = () => {
        m.craft(r.id);
        sfx('pop');
        refresh();
      };
      row.appendChild(b);
      sec.appendChild(row);
    });
    nodes.push(sec);
  }

  // wardrobe
  const mine = Object.entries(COSMETICS).filter(([id]) => p.state.market.owned[id]);
  if (mine.length) {
    const sec = el('div', 'pg-sec');
    sec.append(Object.assign(el('h3'), { textContent: 'Wear' }));
    mine.forEach(([id, c]) => {
      const on = p.state.market.equipped[c.slot] === id;
      const row = el('div', `pg-row${on ? ' pinned' : ''}`);
      row.append(el('b', `r${c.rarity}`, `${SLOT_NAME[c.slot] || c.slot}: ${c.name}`));
      const b = el('button', 'ui-btn', on ? 'Take off' : 'Wear');
      b.onclick = () => {
        m.equip(c.slot, on ? '' : id);
        sfx('tap');
        refresh();
      };
      row.appendChild(b);
      sec.appendChild(row);
    });
    nodes.push(sec);
  }
  return nodes;
}
