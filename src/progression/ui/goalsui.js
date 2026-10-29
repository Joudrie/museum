// The Goals tab: Now (pinned), Today, This week, Long-term. Phase 1 shows the rank and the
// closest finish lines; tasks, requests and the weekly chain fill in as those systems land.
import { fishFinishLines } from './fieldjournal.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

export function goalsTab(p, refresh) {
  const nodes = [];
  const lv = p.level();
  const sec = el('div', 'pg-sec');
  sec.append(Object.assign(el('h3'), { textContent: lv.renown ? `Renown ${lv.renown}` : `Rank ${lv.rank}` }));
  const row = el('div', 'pg-row');
  row.append(el('b', '', `${Math.round(lv.into)} / ${lv.need} XP`), el('span', '', `${Math.round(lv.pct)}%`));
  const bar = el('div', 'pg-bar');
  bar.innerHTML = `<i style="width:${lv.pct}%"></i>`;
  row.appendChild(bar);
  const next = p.nextRank();
  row.append(el('small', '', `Next: ${next.label}${next.text ? ' · ' + next.text : ''}`));
  sec.appendChild(row);
  nodes.push(sec);
  nodes.push(...fishFinishLines());
  return nodes;
}
