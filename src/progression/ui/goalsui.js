// The Goals tab: Now (pinned), Today (tasks and the request board), This week, Long-term.
import { fishFinishLines } from './fieldjournal.js';
import { sfx } from '../../music.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const rewardText = (r) => [r?.xp ? `${r.xp} XP` : '', r?.gold ? `${r.gold} gold` : ''].filter(Boolean).join(' · ');

function goalRow(p, g, refresh) {
  const row = el('div', `pg-row${g.done ? ' done' : ''}${p.state.pinned === g.id ? ' pinned' : ''}`);
  row.append(el('b', '', g.title), el('span', '', g.of ? `${Math.min(g.n || 0, g.of)}/${g.of}` : ''));
  if (g.of) {
    const bar = el('div', 'pg-bar');
    bar.innerHTML = `<i style="width:${g.pct}%"></i>`;
    row.appendChild(bar);
  }
  const sub = rewardText(g.reward);
  if (sub) row.appendChild(el('small', '', sub));
  const actions = el('div');
  actions.style.cssText = 'grid-column:1/-1;display:flex;gap:6px;flex-wrap:wrap';
  if (g.request?.canDeliver && !g.done) {
    const b = el('button', 'ui-btn', 'Hand it over');
    b.onclick = () => {
      p.requests.deliver(g.request.id);
      sfx('pop');
      refresh();
    };
    actions.appendChild(b);
  }
  if (g.rerollable && p.tasks.rerollsLeft() > 0) {
    const b = el('button', 'ui-btn', 'Reroll');
    b.onclick = () => {
      p.tasks.reroll(Number(g.id.split(':')[1]));
      refresh();
    };
    actions.appendChild(b);
  }
  if (!g.done) {
    const pinned = p.state.pinned === g.id;
    const b = el('button', 'ui-btn', pinned ? 'Unpin' : 'Pin');
    b.onclick = () => {
      p.goals.pin(pinned ? null : g.id);
      refresh();
    };
    actions.appendChild(b);
  }
  if (actions.children.length) row.appendChild(actions);
  return row;
}

export function goalsTab(p, refresh) {
  const nodes = [];
  const all = p.goals.all();
  const now = p.goals.pinnedOrAuto();

  const sec0 = el('div', 'pg-sec');
  sec0.append(el('h3', '', 'Now'));
  if (now) sec0.appendChild(goalRow(p, now, refresh));
  else sec0.appendChild(el('p', 'pg-empty', 'Nothing pinned. Pin a goal from the lists below.'));
  nodes.push(sec0);

  const group = (id, title, empty) => {
    const sec = el('div', 'pg-sec');
    const list = all.filter((g) => g.group === id);
    const h = el('h3');
    h.append(title, Object.assign(el('small'), { textContent: list.length ? `${list.filter((g) => g.done).length}/${list.length} done` : '' }));
    sec.appendChild(h);
    if (!list.length) sec.appendChild(el('p', 'pg-empty', empty));
    list.forEach((g) => sec.appendChild(goalRow(p, g, refresh)));
    return sec;
  };
  nodes.push(group('today', 'Today', 'Nothing yet today. Goals appear at 4:00.'));
  nodes.push(group('week', 'This week', 'A new chain starts on Monday.'));
  const lt = group('long', 'Long-term', '');
  nodes.push(lt);
  nodes.push(...fishFinishLines());
  return nodes;
}
