// What visitors say once you start a real conversation (src/chatter.js).
// Every kind of visitor has two jokes, a gift, and a way of asking for a painting.
// Jokes are { say, button, punch }: they set it up, you tap the button, they land it.

export const JOKES = {
  nerd: [
    { say: 'I wrote a paper on why paintings have frames.', button: 'And?', punch: 'It took me a while to get to the point. Wait, I mean, I got framed.' },
    { say: 'What do you call a painting of a fish that is also a historian?', button: 'What?', punch: 'A scholar-ship.' },
  ],
  casual: [
    { say: 'I tried to paint a self-portrait once.', button: 'How did it go?', punch: 'My dog looked at it and left the room.' },
    { say: 'Why was the museum so cold?', button: 'Why?', punch: 'Too many drafts. Get it? Drafts?' },
  ],
  fanboy: [
    { say: 'I got a tattoo of my favorite painting!', button: 'No way!', punch: 'It’s a sticker. I can’t commit. But I will.' },
    { say: 'I told everyone I know about this place.', button: 'Did they come?', punch: 'No. But I sent them forty photos each.' },
  ],
  snob: [
    { say: 'I once sent a painting back to the artist.', button: 'Why?', punch: 'It was undone. Frankly, so was I.' },
    { say: 'Do you know why I only drink from small cups?', button: 'No?', punch: 'It is a matter of taste. Ahem.' },
  ],
  kid: [
    { say: 'Knock knock!', button: 'Who’s there?', punch: 'Vincent! ...Vincent who? Vincent van GO-AWAY-I’m-painting!' },
    { say: 'What’s a ghost’s favorite room in a museum?', button: 'What?', punch: 'The BOO-seum!' },
  ],
  grump: [
    { say: 'Know what’s wrong with modern art?', button: 'What?', punch: 'Nothing. I just like complaining. Keeps me young.' },
    { say: 'I asked the guard for a refund on my free ticket.', button: 'And?', punch: 'He said I’d have to pay first. Well played.' },
  ],
  tourist: [
    { say: 'I asked where the gift shop was in four languages.', button: 'Did it work?', punch: 'I ended up in the coat room. Lovely coats though.' },
    { say: 'I took 400 photos today.', button: 'Wow.', punch: 'Two of them are of paintings. The rest are my thumb.' },
  ],
  artist: [
    { say: 'I painted a portrait of my cat.', button: 'How was it?', punch: 'She sat for it. Then she sat on it.' },
    { say: 'Why do painters never get lost?', button: 'Why?', punch: 'They always find their way back to the canvas. Sorry.' },
  ],
  influencer: [
    { say: 'I got a thousand likes on a picture of a painting.', button: 'Nice!', punch: 'Nobody noticed I forgot to tag the artist. Oops.' },
    { say: 'I tried a museum challenge. Stand in front of every painting for ten seconds.', button: 'How did it go?', punch: 'It was a tight squeeze. Also my battery died at number three.' },
  ],
  couple: [
    { say: 'We came here on our first date.', button: 'Aww.', punch: 'He called a statue “interesting”. That is when I knew he was a keeper.' },
    { say: 'We have a rule: we each pick one favorite.', button: 'And?', punch: 'We both picked the same one. So now we argue about who liked it first.' },
  ],
  historian: [
    { say: 'People think history is boring.', button: 'Isn’t it?', punch: 'Only the parts where nobody got into trouble. Which is none of them.' },
    { say: 'Why was the Renaissance painter so tired?', button: 'Why?', punch: 'He had a lot of reworking to do.' },
  ],
  student: [
    { say: 'I have an essay due on this museum.', button: 'When?', punch: 'Tomorrow. I’m doing my research by looking at everything very hard.' },
    { say: 'My teacher said to “look closer”.', button: 'Did you?', punch: 'Now I’m too close. The guard said step back.' },
  ],
  elder: [
    { say: 'I’ve been coming to museums since before you were born.', button: 'Really?', punch: 'Some of the paintings looked newer then. Not all.' },
    { say: 'My grandson says I should put my memories on the internet.', button: 'And?', punch: 'I said I’ll just leave them where they are: my head, and a shoebox.' },
  ],
};

// True things about this game (src: the game itself).
export const TIPS = [
  'There are dirt mounds on the islands. Brush the dirt away with your finger and you might find a mineral or a fossil.',
  'The boat at the dock takes you to other islands. Some have things worth digging up.',
  'If you catch a fish, it goes in your journal. Some only bite at night.',
  'Things you dig up can arrive dirty. You clean them in the restoration studio before you show them off.',
  'Hang a painting and the coins pile up near it. Walk over and collect them.',
  'A famous painter will stop by sooner if you hang one of their paintings.',
  'The little gift icon under the journal has a free spin and a Painting of the Day, once a day.',
];

// What a visitor asks for. {by} is an artist's name.
export const ASKS = {
  nerd: 'I’m hoping to see something by {by}. For my notes. Do you have one hanging?',
  casual: 'Weird question, but do you have anything by {by}? I like the name.',
  fanboy: 'Please tell me you have a {by}! I’ll cry. Happy crying!',
  snob: 'I assume you have something by {by}. One must have standards.',
  kid: 'Do you have a painting by {by}? My teacher says that’s important.',
  grump: 'You got anything by {by}? Don’t tell me you don’t. I’ll be disappointed.',
  tourist: 'Excuse me, is there something by {by} here? It is on my list.',
  artist: 'I’d love to study something by {by}. Do you have one on the walls?',
  influencer: 'Do you have any {by}? I need it for my feed. Like, urgently.',
  couple: 'We were arguing about {by}. Do you have a painting by them so we can settle it?',
  historian: 'A {by} would complete my research nicely. Is one on display?',
  student: 'I need a {by} for my project. Is there one here? Please say yes.',
  elder: 'Dear, is there a painting by {by} somewhere? I used to know a print of it.',
};
export const PLEASED = ['There it is! Oh, that makes my whole day.', 'Wonderful. You have good taste, you know that?', 'I’m going to tell everyone about this. Truly.'];
export const NOT_YET = ['Oh well. Maybe someday!', 'That’s alright. A museum grows over time.', 'Next time, then. I’ll be watching the walls.'];

// The gift: say it, and either gold or a pocket find.
export const GIFTS = {
  nerd: [{ type: 'gold', say: 'Here, a donation for the museum. I kept the receipt. Of course I did.' }, { type: 'find', pool: 'fossil', say: 'I found this in a rock shop. It is yours now. Handle it with care.' }],
  casual: [{ type: 'gold', say: 'Here, for good vibes. And snacks. Mostly snacks.' }, { type: 'find', pool: 'mineral', say: 'Found this on the ground outside. Looked cool. Take it.' }],
  fanboy: [{ type: 'gold', say: 'Take it! I’m basically a member. Is there a membership? Take it anyway!' }, { type: 'find', pool: 'mineral', say: 'I bought this for my collection but you deserve it more. No, really.' }],
  snob: [{ type: 'gold', say: 'A small contribution. Do not make a fuss.' }, { type: 'find', pool: 'fossil', say: 'It was in my coat pocket. Do not ask. It is yours.' }],
  kid: [{ type: 'find', pool: 'mineral', say: 'I found a rock! You can have it! It’s my second best one!' }, { type: 'gold', say: 'This was for candy. But you can have it. Maybe half.' }],
  grump: [{ type: 'gold', say: 'Here. Don’t say I never gave you anything. And don’t say I did.' }, { type: 'find', pool: 'mineral', say: 'This rock was bothering my shoe. It’s yours. Don’t thank me.' }],
  tourist: [{ type: 'gold', say: 'Please accept this as a thank you. It’s the coin from my last country.' }, { type: 'find', pool: 'fossil', say: 'I picked this up on a beach in the last place. It seemed right for you.' }],
  artist: [{ type: 'gold', say: 'I sold a sketch today. Share the joy.' }, { type: 'find', pool: 'mineral', say: 'This stone makes a lovely pigment when it’s ground up. Or just keep it pretty.' }],
  influencer: [{ type: 'gold', say: 'A thank-you from my sponsor. They said to say it’s “not an ad”.' }, { type: 'find', pool: 'mineral', say: 'It came in a goodie bag. I don’t do rocks. You do rocks.' }],
  couple: [{ type: 'gold', say: 'We saved this for something special. This is special.' }, { type: 'find', pool: 'mineral', say: 'We found this on our walk. It reminded us of you.' }],
  historian: [{ type: 'gold', say: 'For research. Yours, and mine. Consider it a grant.' }, { type: 'find', pool: 'fossil', say: 'An old colleague gave me this. It belongs somewhere it will be looked at.' }],
  student: [{ type: 'gold', say: 'It’s my lunch money. I’ll eat later. This is more important.' }, { type: 'find', pool: 'mineral', say: 'I found it on a field trip. Teacher said I could keep it. Now you can.' }],
  elder: [{ type: 'gold', say: 'Take it, dear. I’ve got more than I need and fewer years than you.' }, { type: 'find', pool: 'fossil', say: 'My late husband found this. He’d want it in a museum. Yours, I think.' }],
};

export const FAREWELL = {
  default: ['See you around!', 'Take care. Lovely place you’ve got.', 'Bye now!', 'This was a good talk.'],
  kid: ['Bye bye bye bye!', 'Can we come back tomorrow?'],
  snob: ['Well. Carry on.', 'Do keep the lighting subtle.'],
  grump: ['Hmph. Bye.', 'I’ll be around. Complaining.'],
  elder: ['Take care of yourself, dear.', 'Mind the steps now.'],
};
export const HUB_FIRST = ['Anything you’d like to talk about?', 'So. What shall we chat about?'];
export const HUB_AGAIN = ['Anything else?', 'Well, what else?', 'I’ve got time. What else?'];
