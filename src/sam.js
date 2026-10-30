// Uncle Sam, hanging around the entrance. Full outfit (white top hat, white beard, blue
// tailcoat, red tie and trousers) but he talks like a regular twenty-year-old who has no idea
// why he's here. Never political, never patriotic: just a quiet existential crisis.
//
// Talking to him: the opening (his "kind of weird that I'm here" bit) plays first, and plays
// again once a full day has passed since you last heard it. After it, his rambles come in order,
// one line per talk, with a one-liner between each ramble. Once he's told them all, they come
// round again, mixed in with more one-liners. Where you are is saved.
import { load, save } from './storage.js';

const KEY = 'curation.sam2'; // { openedAt, open, run, step, runs }
const DAY = 24 * 60 * 60 * 1000;

export const SAM = {
  name: 'Uncle Sam',
  label: 'Just hanging out',
  colors: { h: '#f2efe8', F: '#f2efe8', s: '#f0c8a4', c: '#2d4596', w: '#f4f2ec', p: '#b8322a', b: '#2a1e18', T: '#f4f2ec', U: '#2d4596', g: '#b8322a' },
  look: { hat: 'top', facial: 'beard', outfit: 'coat' },

  // heard in this order, and again once a day has passed
  opening: [
    'Kind of weird that I’m here, right?',
    'Like, I’m just a manifestation of a country. I’m not actually a person. How did I even get here?',
    'Does this mean there’s gonna be fictional characters around here? Because, like, I’m not real.',
    'Does that make sense? Like I’m not real, but I am real. So are other things that aren’t real… real?',
  ],

  // his rambles: each one heard start to finish, one line per talk
  runs: [
    [
      'I hope it’s cool that I just showed up here. I don’t think I actually have a home.',
      'Okay, well, I guess my home is America. But like, what am I supposed to write if someone wants to send me a letter?',
      '“Uncle Sam, America.” Is that an address? I feel like that’s not an address.',
    ],
    [
      'Can I even vote? I know I tell people to vote. But I don’t have any identification at all.',
      'Is my birthday the Fourth of July? Because I am America. Kinda.',
      'Which would make me, what, two hundred and fifty? That tracks, honestly. My knees agree.',
      'I was just born an old man. Why couldn’t they have drawn me a little younger?',
    ],
    [
      'I think American art is both overhyped and underhyped.',
      'Like, some of the greatest artists I know are from America. Hopper. O’Keeffe. That guy who painted the soup cans.',
      'But some of the new stuff? I just cannot wrap my head around it. A banana taped to a wall. I don’t know, man.',
      'I’m not saying it’s bad. I’m saying I stood in front of it for twenty minutes and it didn’t say anything back.',
    ],
    [
      'If we’re adding fictional people, I hope I get to meet Odysseus.',
      'Guy took ten years to get home. I can’t even find mine. I feel like we’d get along.',
      'Hopefully I don’t bump into Vader.',
      'Yeah, I know who Darth Vader is. I’ve seen Star Wars.',
      'I actually liked the prequels too. I will admit the dialogue stinks.',
      'But at least they inspire the imagination. Pod racing! Come on.',
      'I’ve only recently noticed how much Star Wars took from Dune. Desert planet, chosen kid, spice, I mean, come on.',
      'I still haven’t seen the third Dune movie yet. No spoilers. Please.',
      'Frank Herbert, the guy who wrote Dune, I think he was an ecologist? I don’t really know what an ecologist is.',
      'It’s something to do with nature. But now that I say that out loud, there’s not a whole lot of nature in the books. It’s mostly sand.',
      'What he’s really good at is making people and cultures feel real. Like you could move there. Well. You wouldn’t want to. Sandworms.',
      'The planet’s called Arrakis. That’s gotta come from somewhere real, right? Arabic, maybe? I don’t know.',
      'Just like the Fremen. Free men. I only got that one last week. I said it out loud on a train.',
      'A lot of sci-fi and fantasy pulls from real life. The Wall in Game of Thrones is Hadrian’s Wall. The Romans built a wall to keep out Scotland.',
      'Sorry for that ramble. You should really add a movie theater or something. Or a library. Maybe even a pool.',
    ],
    [
      'All this art stuff is cool. I have all these ideas, but I can never find the time to paint.',
      'Maybe I’m just scared to try. I’ve been around for two hundred and fifty years. I must have had time.',
      'Everything I draw just looks like a cartoon. Which, I guess, is kind of what I am. Oh no.',
      'I can’t tell if this is the best time or the worst time to be an artist. All that AI art kinda intimidates me.',
      'Maybe it’s the best time, since people are gonna want real art. But then companies care about their bottom line, so maybe it’s the worst time.',
      'I don’t understand half this AI stuff. And honestly? I’m kind of sick of hearing about it.',
      'I go to dinner, it’s AI this. I’m waiting at the train station, it’s AI that. I get that it’s important. I just yawn every time.',
      'Let’s chat about something more interesting. What do you wanna talk about?',
      'Politics? Maybe not. Maybe now’s not the best time.',
      'I don’t mean to be dismissive. I’m kind of the embodiment of every single person in the country. I’m worried I’ll say the wrong thing.',
      'I’m an amalgamation of everybody, so I’ve got a lot of mixed feelings about a lot of things. Like, a LOT of feelings.',
      'I guess I will say: I’ve seen America get through the Great Depression, two world wars and the threat of nuclear war, all in one century.',
      'I know we’re capable of wonderful things when we stick together. Anyway. That’s my one serious thing. I’m going back to looking at paintings.',
    ],
    [
      'I don’t really believe in magic. But like, what am I, then?',
      'Somebody drew a guy and now the guy is walking around a museum. What the heck.',
      'If a drawing can be real, then is that painting over there gonna start talking? Please say no.',
    ],
    [
      'The kids keep calling me Unc.',
      'I looked it up. It means uncle. Which… yeah. I mean, they’re not wrong.',
      'I’m choosing to take it as a compliment.',
    ],
    [
      'Can I tell you something? I don’t know how to sit down in this coat.',
      'There’s tails. On the back. Like a bird. Who designed this?',
      'I think I designed this. I genuinely can’t remember.',
    ],
    [
      'Do you ever think about the guy who has to paint the cracks back into an old painting? Like on purpose?',
      'That’s restoration, I think. You fix it but you can’t make it look new. You have to make it look old, correctly.',
      'That’s kind of my whole deal, actually. Look old, correctly.',
    ],
    [
      'I tried to get a library card once. They asked for proof of address.',
      'I handed them a map.',
      'They did not give me a library card.',
    ],
  ],

  // between the rambles, at random
  oneLiners: [
    'People keep looking at the hat. I get it. I’d look at the hat too.',
    'Still here. Still weird.',
    'If you figure out why I’m here, let me know.',
    'I keep pointing at people by accident. It’s a reflex. I don’t know where it came from.',
    'Do you ever think about how a painting of a guy is kind of more real than me? I do. A lot.',
    'Honestly the ticket desk guy is the only one here who seems to have it together.',
    'I’m not gonna lie, I’d be cool with a snack.',
    'You know what, it’s fine. We’re all just kind of here.',
    'I don’t remember putting this outfit on. I think I’ve just always been wearing it.',
    'I tried to buy a ticket and the guy just waved me in. Is that a me thing?',
    'Okay, new theory: maybe the paintings are real and we’re the ones on the wall somewhere.',
    'Nice museum. Genuinely.',
    'I’ve never taken this hat off. I’m scared of what’s under there. Probably more hat.',
    'Somebody asked for a selfie and then asked me to point at them. I did. I don’t know why I did.',
    'Is it weird that I don’t know my own height? I feel like it changes depending on who’s drawing.',
    'I’ve been on a lot of posters. I’ve never once been asked if I wanted to be on a poster.',
    'If someone ever paints me for this museum, I want to look relaxed. Like, chill Sam.',
    'Every time someone says “Uncle” I turn around. Every time. Even at Thanksgiving. Especially at Thanksgiving.',
    'I don’t have a phone. Who would I call? Myself? I’m everybody.',
    'I tried to grow the beard out. It just stays exactly like this. Forever.',
    'Do you think the red pants are too much? Be honest. Actually, don’t be honest.',
    'Do I eat? I think I eat. I had a hot dog once. Or I was at a hot dog. Hard to say.',
    'Sometimes I just stand by the potted tree and pretend I’m a statue. Nobody notices. That kind of hurts.',
    'I keep wanting to say “I want YOU.” I have no idea for what. It just comes up.',
    'I get recognized everywhere, but nobody knows my last name. Do I have a last name? Is it “Sam”?',
    'I feel like I should have a hobby. Birdwatching? There’s an eagle I think I’m supposed to know.',
    'I’m not a morning person. I’m not really a person. But still.',
    'The museum smells like old wood and floor polish. I respect it.',
    'You ever stand in front of a painting so long you forget you’re in a museum? Yeah. Me neither. I get distracted.',
    'Someone told me to “touch grass.” I touched the potted tree. Close enough?',
    'I like that nobody here asks me to do anything. I just get to look at stuff.',
    'Do you think the guy in the gold frame over there is real? Asking for me.',
    'Every portrait in here is looking at me. Or I’m looking at them. One of those.',
    'I tried meditation. I just kept seeing fireworks. Every time.',
    'I don’t own a single pair of shoes that aren’t these. Is that a problem? Feels like a problem.',
    'If I sit really still, people think I’m part of the exhibit. I’ve made eleven dollars that way.',
    'My favorite color is blue. Or red. Or white. I’ve been told I can’t pick.',
    'Is it weird to have a favorite painting if you’re basically a drawing? Like, is that a crush? Never mind.',
    'I went to the beach once. Everybody saluted. I just wanted to swim.',
    'You know what I like about museums? Everything here is old too. I fit in.',
  ],

  // now and then, instead of anything else
  rare: ['I feel like a lot of people want me to talk about modern politics.'],
};

const fresh = () => ({ openedAt: 0, open: 0, run: 0, step: 0, gap: false, rounds: 0 });

// His next line, and move him on one.
export function samLine() {
  const st = { ...fresh(), ...(load(KEY, null) || {}) };
  const now = Date.now();
  let line;
  if (now - st.openedAt >= DAY) {
    // a whole day since you last heard the opening: it plays again
    st.openedAt = now;
    st.open = 0;
  }
  if (st.open < SAM.opening.length) {
    line = SAM.opening[st.open++];
  } else if (st.step === 0 && Math.random() < 0.04) {
    line = SAM.rare[Math.floor(Math.random() * SAM.rare.length)];
  } else if (st.gap || (st.step === 0 && st.rounds > 0 && Math.random() < 0.6)) {
    // a one-liner between rambles (and more of them once he's told every ramble)
    st.gap = false;
    line = SAM.oneLiners[Math.floor(Math.random() * SAM.oneLiners.length)];
  } else {
    const run = SAM.runs[st.run % SAM.runs.length];
    line = run[st.step++];
    if (st.step >= run.length) {
      st.step = 0;
      st.gap = true;
      st.run++;
      if (st.run % SAM.runs.length === 0) st.rounds++;
    }
  }
  save(KEY, st);
  return line;
}
