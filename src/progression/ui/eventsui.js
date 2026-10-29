// Events tab: the streak and login calendar, the town bulletin (this month's drop), live and past
// events with their 30-tier tracks, and the opt-in reminder switch.
import { sfx } from '../../music.js';
import { describe } from '../grants.js';
import { TIERS, TOKENS_PER_TIER } from '../events.js';

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const txt = (rs) => rs.map((r) => describe(r).text).join(' + ');

export function eventsTab(p, refresh) {
  const nodes = [];
  // streak and calendar
  const st = p.streak.state();
  const sec = el('div', 'pg-sec');
  const h = el('h3');
  h.append('Streak', Object.assign(el('small'), { textContent: `${st.count} day${st.count === 1 ? '' : 's'} · best ${st.best} · shields ${st.shields}/${p.T.streak.shieldsMax}` }));
  sec.appendChild(h);
  sec.appendChild(el('p', 'pg-empty', 'Missing a day never costs you your streak’s milestones, and a week in a row earns a shield that covers one missed day.'));
  const cal = el('div', 'pg-grid');
  p.streak.calendar().forEach((d) => {
    const c = el('div', `pg-cell${d.done ? '' : ' unknown'}`);
    c.style.opacity = d.done ? 0.55 : 1;
    c.append(el('b', 'nm', `Day ${d.day}`), el('span', 'hint', d.done ? 'Claimed' : txt(d.rewards)));
    if (d.next) c.style.borderColor = 'var(--ui-gold)';
    cal.appendChild(c);
  });
  sec.appendChild(cal);
  const claim = el('button', 'ui-btn ui-btn--wide', st.canClaim ? 'Claim today’s calendar reward' : 'Claimed today. The calendar waits for you.');
  claim.disabled = !st.canClaim;
  claim.onclick = () => {
    p.streak.claim();
    sfx('sell');
    refresh();
  };
  sec.appendChild(claim);
  nodes.push(sec);

  // bulletin
  const b = el('div', 'pg-sec');
  const m = p.events.thisMonth();
  const n = p.events.nextMonth();
  b.append(Object.assign(el('h3'), { textContent: 'Town bulletin' }));
  const r1 = el('div', 'pg-row pinned');
  r1.append(el('b', '', `This month: ${m.title}`), el('span', '', m.ships.join(', ')), el('small', '', m.text));
  const r2 = el('div', 'pg-row');
  r2.append(el('b', '', `Next month: ${n.title}`), el('span', '', ''), el('small', '', n.text));
  b.append(r1, r2);
  nodes.push(b);

  // events
  p.events.all().forEach((e) => {
    const s = el('div', 'pg-sec');
    const hh = el('h3');
    hh.append(e.name, Object.assign(el('small'), { textContent: e.active ? `On now · tier ${e.tier}/${TIERS} · ${e.tokens} ${e.currency}` : `Returns ${e.returns}` }));
    s.appendChild(hh);
    s.appendChild(el('p', 'pg-empty', e.blurb));
    const grid = el('div', 'pg-grid');
    e.species.forEach((sp) => {
      const got = !!p.state.fish.species[sp.id]?.n;
      const c = el('div', `pg-cell${got ? '' : ' unknown'}`);
      c.append(el('b', 'nm', got ? sp.name : '???'), el('span', 'hint', got ? 'Caught' : e.active ? 'Biting now' : `Returns ${e.returns}`));
      if (!e.active && !got) c.style.opacity = 0.55;
      grid.appendChild(c);
    });
    s.appendChild(grid);
    if (e.active || e.tokens) {
      const list = p.events.track(e.id).filter((r) => r.reached || r.tier <= e.tier + 2);
      list.forEach((r) => {
        const row = el('div', `pg-row${r.freeClaimed ? ' done' : ''}`);
        row.append(el('b', '', `Tier ${r.tier}`), el('span', '', txt(r.free)));
        const act = el('div');
        act.style.cssText = 'grid-column:1/-1;display:flex;gap:6px';
        const bf = el('button', 'ui-btn', r.freeClaimed ? 'Claimed' : 'Claim');
        bf.disabled = r.freeClaimed || !r.reached;
        bf.onclick = () => {
          p.events.claim(e.id, r.tier, 'free');
          sfx('pop');
          refresh();
        };
        act.appendChild(bf);
        if (r.sub.length) {
          const bs = el('button', 'ui-btn', r.subClaimed ? 'Claimed' : `Subscriber: ${txt(r.sub)}`);
          bs.disabled = r.subClaimed || !r.reached;
          bs.onclick = () => {
            p.events.claim(e.id, r.tier, 'sub');
            sfx('pop');
            refresh();
          };
          act.appendChild(bs);
        }
        row.appendChild(act);
        s.appendChild(row);
      });
    }
    nodes.push(s);
  });

  // reminders
  const rem = el('div', 'pg-sec');
  rem.append(Object.assign(el('h3'), { textContent: 'Reminders' }));
  const row = el('div', 'pg-row');
  row.append(el('b', '', p.state.flags.notify ? 'On: at most one a day, about something specific' : 'Off'));
  const t = el('button', 'ui-btn', p.state.flags.notify ? 'Turn off' : 'Turn on');
  t.onclick = async () => {
    if (!p.state.flags.notify && 'Notification' in window && Notification.permission === 'default') await Notification.requestPermission().catch(() => {});
    p.away2.setNotify(!p.state.flags.notify);
    refresh();
  };
  row.appendChild(t);
  rem.appendChild(row);
  rem.appendChild(el('p', 'pg-empty', 'Reminders are your choice and never nag. They only fire where your device allows it.'));
  nodes.push(rem);
  return nodes;
}

export { TOKENS_PER_TIER };
