// Answers the questions telemetry exists for (docs/PROGRESSION.md section 20), from a list of events:
// { install, t, name, props }. `install` is an anonymous id per player. Pure, so it is unit-tested.
const DAY = 864e5;
const med = (a) => {
  const v = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  return v.length ? v[Math.floor(v.length / 2)] : null;
};

export function report(events) {
  const by = new Map();
  events.forEach((e) => {
    if (!by.has(e.install)) by.set(e.install, []);
    by.get(e.install).push(e);
  });
  const players = [...by.values()].map((list) => list.sort((a, b) => a.t - b.t));
  const out = { players: players.length };

  // D1 / D7 / D30: did they come back on that day after install (a window of a day)?
  out.retention = {};
  [1, 7, 30].forEach((d) => {
    const eligible = players.filter((l) => Math.max(...l.map((e) => e.t)) - l[0].t >= d * DAY || true);
    const back = eligible.filter((l) => l.some((e) => e.name === 'session_start' && e.t - l[0].t >= d * DAY && e.t - l[0].t < (d + 1) * DAY));
    out.retention[`D${d}`] = eligible.length ? Math.round((100 * back.length) / eligible.length) : null;
  });

  // minutes of play to Rank 2, 5, 10
  out.minutesToRank = {};
  [2, 5, 10].forEach((r) => (out.minutesToRank[r] = med(players.map((l) => l.find((e) => e.name === 'rank_up' && e.props.rank === r)?.props.minutes))));

  // where first sessions end: the last action before session_end of the first session
  const ends = {};
  players.forEach((l) => {
    const i = l.findIndex((e) => e.name === 'session_end');
    if (i >= 0) ends[l[i].props.lastAction || 'unknown'] = (ends[l[i].props.lastAction || 'unknown'] || 0) + 1;
  });
  out.firstSessionEnds = ends;

  // goals pinned versus completed
  const pinned = {};
  const done = {};
  events.forEach((e) => {
    if (e.name === 'goal_pinned') pinned[e.props.id.split(':')[0]] = (pinned[e.props.id.split(':')[0]] || 0) + 1;
    if (e.name === 'goal_completed') done[e.props.id.split(':')[0]] = (done[e.props.id.split(':')[0]] || 0) + 1;
  });
  out.goals = { pinned, completed: done };

  // journal pages that stall: the highest percentage anyone reached, by page
  const top = {};
  events.filter((e) => e.name === 'journal_pct').forEach((e) => (top[e.props.page] = Math.max(top[e.props.page] || 0, e.props.pct || 0)));
  out.journalReach = top;
  out.paywallViews = events.filter((e) => e.name === 'paywall_view').reduce((m, e) => ((m[e.props.context] = (m[e.props.context] || 0) + 1), m), {});
  return out;
}
