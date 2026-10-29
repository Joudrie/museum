// The first hour: a short, gentle script shown as the pinned goal until it is done. Each step is
// something the game was going to teach anyway, in the order the spec lays out (talk, first catch,
// rank 2, a request, bait, the chart and a locked island, a perk, the rowboat, a rumour, a task).
// Nothing is forced: any step is simply marked done when it happens, in any order.
export const STEPS = [
  { id: 'talk', title: 'Say hello to someone', event: 'NPC_TALKED' },
  { id: 'cast', title: 'Catch your first fish', event: 'FISH_CAUGHT' },
  { id: 'rank2', title: 'Reach Rank 2', event: 'RANK_UP', when: (ev) => ev.rank >= 2 },
  { id: 'request', title: 'Finish a request on the board', event: 'REQUEST_DONE' },
  { id: 'buy', title: 'Buy bait at the market', event: 'PURCHASE', when: (ev) => String(ev.itemId).startsWith('bait:') },
  { id: 'chart', title: 'Look at the chart for an island you cannot reach yet', event: null },
  { id: 'perk', title: 'Reach Fishing 4 to see fish shadows', event: 'SKILL_UP', when: (ev) => ev.skill === 'fishing' && ev.level >= 4 },
  { id: 'rowboat', title: 'Buy the rowboat and visit the Far Isle', event: 'PURCHASE', when: (ev) => ev.itemId === 'boat:rowboat' },
  { id: 'rumor', title: 'Hear a rumour about something big', event: 'HEART_UP' },
  { id: 'task', title: 'Finish a daily task', event: 'TASK_DONE' },
];

export function installFirstHour(p) {
  const done = () => p.state.flags.firstHour;
  const mark = (id) => {
    if (done()[id]) return;
    done()[id] = p.clock.now();
    p.store.commit();
  };
  STEPS.forEach((s) => s.event && p.bus.on(s.event, (ev) => (!s.when || s.when(ev)) && mark(s.id)));
  // a rumour can also be heard through a legend trail
  p.bus.on('NPC_TALKED', () => {
    if (Object.keys(p.state.journal.leads).some((k) => k.startsWith('legend:') || k.startsWith('rumor:'))) mark('rumor');
  });
  const mod = {
    name: 'firsthour',
    install() {},
    mark,
    steps: () => STEPS.map((s) => ({ ...s, done: !!done()[s.id] })),
    next: () => {
      const s = STEPS.find((x) => !done()[x.id]);
      return s ? { id: `first:${s.id}`, group: 'now', title: s.title, n: Object.keys(done()).length, of: STEPS.length, reward: { xp: 0 }, scripted: true } : null;
    },
    finished: () => STEPS.every((s) => done()[s.id]),
  };
  p.mods.firsthour = mod;
  p.firstHour = mod;
}
