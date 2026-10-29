// The Codex tab: everything you have ever collected, as one percentage, with
// milestone rewards, plus "ever collected" next to "holding now" for each
// collection (selling a piece keeps its stamp but takes it out of your hands).
import { snapshot } from './codex.js';
import { breakdown, claimMilestone, completion, milestones } from './milestones.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const bar = (pct) => {
  const b = el('div', 'quest-bar');
  b.appendChild(Object.assign(el('i'), { style: `width:${pct}%` }));
  return b;
};

/** ctx.onClaimSet({ name }, gold) pays out and celebrates (the same hook the sets use). */
export function codexTab(ctx, refresh) {
  const snap = snapshot();
  const all = completion(snap);
  const head = el('p', 'toolkit-note', `${all.have} of ${all.total} pieces collected (${all.pct}%). Everything you have ever found counts, even pieces you sold.`);
  const total = el('div', 'set-row');
  const text = el('div', 'set-text');
  text.append(el('b', '', `Codex ${all.pct}%`), bar(all.pct));
  total.appendChild(text);

  const ms = el('div', 'set-list');
  milestones(snap).forEach((m) => {
    const row = el('div', 'set-row' + (m.reached ? ' done' : ''));
    const t = el('div', 'set-text');
    t.append(el('b', '', `${m.pct}% of the codex`), el('small', '', m.claimed ? 'Claimed' : m.reached ? 'Reached!' : `${Math.max(0, Math.ceil((all.total * m.pct) / 100) - all.have)} more to go`));
    row.appendChild(t);
    if (m.reached && !m.claimed && ctx.onClaimSet) {
      const b = el('button', 'pixel-btn quest-claim');
      b.innerHTML = `Claim <i class="coin"></i> ${m.gold.toLocaleString()}`;
      b.onclick = () => {
        const paid = claimMilestone(m.pct);
        if (paid) ctx.onClaimSet({ name: `${m.pct}% of the codex` }, paid);
        refresh();
      };
      row.appendChild(b);
    } else {
      const r = el('span', 'quest-reward' + (m.claimed ? ' paid' : ''));
      r.innerHTML = `<i class="coin"></i> ${m.gold.toLocaleString()}`;
      row.appendChild(r);
    }
    ms.appendChild(row);
  });

  const cols = el('div', 'set-list');
  breakdown(snap).forEach(({ collection: c, have, total: n, held, pct }) => {
    const row = el('div', 'set-row' + (have === n ? ' done' : ''));
    const t = el('div', 'set-text');
    t.append(el('b', '', c.name), el('small', '', `${have} of ${n} collected · ${held} held now · ${pct}%`), bar(n ? Math.round((100 * have) / n) : 0));
    row.appendChild(t);
    cols.appendChild(row);
  });
  return [head, total, el('h3', 'fish-h', 'Milestones'), ms, el('h3', 'fish-h', 'By collection'), cols];
}
