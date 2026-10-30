// Uncle Sam, hanging around the entrance. Full outfit (white top hat, white goatee, blue
// tailcoat, red trousers) but he talks like a regular twenty-year-old who has no idea why
// he's here. Never political, never patriotic: just a quiet existential crisis.
// His lines go in order, one per talk, and pick up where you left off next time.
import { load, save } from './storage.js';

const KEY = 'curation.sam'; // how many of his lines you've heard

export const SAM = {
  name: 'Uncle Sam',
  label: 'Just hanging out',
  colors: { h: '#f2efe8', F: '#f2efe8', s: '#f0c8a4', c: '#2d4596', w: '#f4f2ec', p: '#b8322a', b: '#2a1e18', T: '#f4f2ec', U: '#2d4596', g: '#b8322a' },
  look: { hat: 'top', facial: 'beard', outfit: 'coat' },
  // heard in this order
  lines: [
    'Kind of weird that I’m here, right?',
    'Like, I’m just a manifestation of a country. I’m not actually a person. How did I even get here?',
    'Does this mean there’s gonna be fictional characters around here? Because, like, I’m not real.',
    'Does that make sense? Like I’m not real, but I am real. So are other things that aren’t real… real?',
    'Sorry. I’ve been standing here thinking about it for a while.',
    'People keep looking at the hat. I get it. I’d look at the hat too.',
    'I don’t remember putting this outfit on. I think I’ve just always been wearing it.',
    'Do I have a birthday? Like, a real one? Nobody tells me anything.',
    'I tried to buy a ticket and the guy just waved me in. Is that a me thing or does he do that for everyone?',
    'Okay, new theory: maybe the paintings are real and we’re the ones hanging on a wall somewhere.',
    'Anyway. Nice museum. Genuinely.',
  ],
  // after that, these come back at random
  idle: [
    'Still here. Still weird.',
    'If you figure out why I’m here, let me know.',
    'I keep pointing at people by accident. It’s a reflex. I don’t know where it came from.',
    'Do you ever think about how a painting of a guy is kind of more real than me? I do. A lot.',
    'Honestly the ticket desk guy is the only one here who seems to have it together.',
    'I’m not gonna lie, I’d be cool with a snack.',
    'You know what, it’s fine. We’re all just kind of here.',
  ],
};

// His next line, and move on one.
export function samLine() {
  const k = load(KEY, 0) || 0;
  save(KEY, k + 1);
  if (k < SAM.lines.length) return SAM.lines[k];
  return SAM.idle[Math.floor(Math.random() * SAM.idle.length)];
}
