// A conversation with a named person, as a generator for src/dialogue.js: their greeting by hearts,
// the board requests they gave out, gifts (with the reaction shown on their face), and their story.
import { npcById, DIALOGUE, GIFTS } from '../friendship.js';
import { speciesById } from '../species.js';

const line = (text) => ({ type: 'line', text });

export function* namedConverse(p, npcId, ui = {}) {
  const npc = npcById(npcId);
  const fr = p.friendship;
  yield line(fr.greeting(npcId));
  const hearts = () => fr.heartsOf(npcId);
  for (let guard = 0; guard < 12; guard++) {
    const reqs = p.requests.forNpc(npcId);
    const gifts = fr.giftables();
    const choices = [];
    reqs.forEach((r) => choices.push({ id: `req:${r.id}`, label: r.canDeliver ? `Give: ${r.text.replace(npc.name, '').trim()}` : `Ask: what do you need?` }));
    if (fr.canGift(npcId) && gifts.length) choices.push({ id: 'gift', label: 'Give a gift' });
    const f = p.state.friends[npcId];
    if (f?.quest && !f.quest.done) choices.push({ id: 'quest', label: 'Your story' });
    choices.push({ id: 'bye', label: 'Bye!' });
    const c = yield { type: 'hub', text: reqs.length ? reqs[0].text : `${'♥'.repeat(hearts())}${'♡'.repeat(10 - hearts())}`, choices };
    if (c === 'bye') break;
    if (c === 'quest') {
      const q = f.quest;
      const want = q.items[q.step];
      const name = want.startsWith('fish:') ? speciesById(want.slice(5))?.name : GIFTS[want.slice(5)]?.name;
      yield line(`If you ever find ${name || want}, I would love it. That is all I ask.`);
      continue;
    }
    if (c.startsWith('req:')) {
      const r = reqs.find((x) => `req:${x.id}` === c);
      if (!r?.canDeliver) {
        yield line(r ? r.text : 'Nothing right now.');
        continue;
      }
      const res = p.requests.deliver(r.id);
      if (res.ok) {
        ui.emote?.('heart');
        yield line('Thank you. That is exactly it.');
      }
      continue;
    }
    if (c === 'gift') {
      const pick = yield {
        type: 'hub',
        text: 'What would you like to give?',
        choices: [...gifts.slice(0, 7).map((g) => ({ id: g.id, label: `${g.name} ×${g.n} ${fr.giftHint(npcId, g.id)}`.trim() })), { id: 'back', label: 'Never mind' }],
      };
      if (pick === 'back') continue;
      const res = fr.give(npcId, pick);
      if (!res.ok) {
        yield line(res.reason === 'today' ? 'You already gave me something today. Tomorrow?' : 'Hm. You do not have that.');
        continue;
      }
      ui.emote?.(res.emote);
      yield line(res.line || DIALOGUE.reactions[res.reaction][0]);
    }
  }
  yield line('See you around.');
}
