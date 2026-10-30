// The Shop tab: sell what you hold for half, buy sold pieces back after a week,
// and browse today's Gallery Shop. The rules live in shop.js; this is the page.
import { RARITY } from './index.js';
import { snapshot } from './codex.js';
import { COOLDOWN_MS, buy, buyBack, buybacks, nextRefresh, sell, sellPrice, sellable, shelf } from './shop.js';
import { fillPicture } from './render.js';
import { addCoins, coins, spend } from '../wallet.js';
import { onDisplay } from '../display.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const wallet = { add: addCoins, spend };
const gold = (n) => `<i class="coin"></i> ${n.toLocaleString()}`;
const span = (ms) => {
  const m = Math.max(1, Math.ceil(ms / 60000));
  return m >= 1440 ? `${Math.ceil(m / 1440)} days` : m >= 60 ? `${Math.ceil(m / 60)} h` : `${m} min`;
};

function row(entry, note, button) {
  const r = el('div', 'slot-painting shop-row');
  r.innerHTML = '<span class="thumb"></span><span class="meta"><b></b><i></i><em></em></span>';
  fillPicture(r.querySelector('.thumb'), entry, { scale: 3 });
  r.querySelector('b').textContent = entry.title;
  r.querySelector('i').textContent = RARITY[entry.rarity ?? 1];
  r.querySelector('em').textContent = note;
  if (button) r.appendChild(button);
  return r;
}
const btn = (html, onclick, disabled) => {
  const b = el('button', 'pixel-btn quest-claim');
  b.innerHTML = html;
  b.disabled = !!disabled;
  b.onclick = onclick;
  return b;
};

/** The nodes of the Shop tab. `refresh()` redraws it. */
export function shopTab(ctx, refresh) {
  const now = Date.now();
  const snap = snapshot();
  const say = el('p', 'toolkit-note shop-say', `You have ${coins().toLocaleString()} gold. Every piece on the shelf is one of a kind: once it is yours, it leaves the shelf. Sell for half, buy back after a week.`);
  const done = (res, text) => {
    say.textContent = res.ok ? text(res) : res.why;
    if (res.ok) refresh();
  };

  const nodes = [say];

  nodes.push(el('h3', 'fish-h', `Gallery Shop · new pieces in ${span(nextRefresh(now) - now)}`));
  const stock = el('div', 'gallery-grid book shop-list');
  shelf(now, snap).forEach((r) => {
    stock.appendChild(row(r.entry, r.owned ? 'You already have this one' : 'One of a kind', btn(r.owned ? 'Owned' : `Buy ${gold(r.price)}`, () => done(buy(r.entry.id, wallet), (x) => `Bought ${r.entry.title} for ${x.gold}.`), r.owned)));
  });
  nodes.push(stock);

  nodes.push(el('h3', 'fish-h', 'Sell'));
  const sells = el('div', 'gallery-grid book shop-list');
  sellable(snap, onDisplay).forEach(({ entry, n }) => {
    sells.appendChild(row(entry, `×${n} ready to sell`, btn(`Sell ${gold(sellPrice(entry))}`, () => done(sell(entry.id, wallet, onDisplay), (x) => `Sold ${entry.title} for ${x.gold}.`))));
  });
  if (!sells.children.length) sells.appendChild(el('p', 'empty-note', 'Nothing to sell yet. Pieces on display, or still dirty, stay with you.'));
  nodes.push(sells);

  nodes.push(el('h3', 'fish-h', 'Buy back'));
  const backs = el('div', 'gallery-grid book shop-list');
  buybacks(snap, now).forEach((r) => {
    backs.appendChild(row(r.entry, r.ready ? `×${r.n} you sold` : `×${r.n} you sold · back in ${span(r.opens - now)}`, btn(`Buy ${gold(r.price)}`, () => done(buyBack(r.entry.id, wallet), (x) => `Bought back ${r.entry.title} for ${x.gold}.`), !r.ready)));
  });
  if (!backs.children.length) backs.appendChild(el('p', 'empty-note', `Pieces you sell can be bought back after ${Math.round(COOLDOWN_MS / 86400000)} days, at a higher price.`));
  nodes.push(backs);
  return nodes;
}
