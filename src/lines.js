// What visitors say. Each visitor has a personality; near a painting they
// usually talk about it, otherwise they say something generic.

export const PERSONALITIES = {
  nerd: {
    label: 'Art nerd',
    names: ['Dennis', 'Priya', 'Walt', 'Mina', 'Walt', 'Mina', 'Oskar', 'Farah'],
    generic: [
      'Fun fact: most old paintings were varnished, and the varnish yellows over time.',
      'I’ve read every placard in here. Twice.',
      'Did you know “museum” comes from the Muses? Greek goddesses of the arts.',
      'I brought a notebook. Don’t judge me.',
      'This frame is gilded with real gold leaf. I checked. Don’t tell anyone.', 'I’m keeping a spreadsheet of every museum I visit.', 'Pigments used to be made from crushed beetles. Science!'],
    about: ['Ah, {title}. {year}. Classic.', 'Look at the brushwork on this one. {by} was not messing around.'],
  },
  casual: {
    label: 'Just vibing',
    names: ['Jordan', 'Sam', 'Ali', 'Kayla', 'Remy', 'Dani', 'Theo', 'Nia'],
    generic: ['This place has good vibes.', 'Honestly I came in for the AC.', 'Do they do events here? Like with snacks?', 'My friend said this place was mid. My friend is wrong.', 'Lowkey this is my new study spot.', 'I came for a date. She left. I stayed for the art.', 'Ten out of ten, would wander again.'],
    about: ['Yeah this one’s cool.', 'I don’t know much about art but I like the colors on this.'],
  },
  fanboy: {
    label: 'Superfan',
    names: ['Tyler', 'Bex', 'Marco', 'June', 'Kit', 'Rosa', 'Dev', 'Penny'],
    generic: ['I would DIE for this museum.', 'I’ve been here four times this week. I live here now.', 'Is there a gift shop? I need a tote bag.', 'I got here before opening. I waited outside. Worth it.', 'If I touch the frame do I get powers?', 'Please tell me you’re getting more paintings.'],
    about: ['{by}!!! I have {title} on a mug. Two mugs actually.', 'OK this is my favorite. No wait. Yes. This one.'],
  },
  snob: {
    label: 'Art snob',
    names: ['Reginald', 'Margot', 'Percival', 'Odette', 'Cornelius', 'Beatrix', 'Lucien', 'Vivienne'],
    generic: ['The lighting is… a choice.', 'Hmm. I’ve seen better. In Paris.', 'One must view art in silence. *sips imaginary wine*', 'The wallpaper is fighting the art. Someone should intervene.', 'I only visit museums that serve espresso.', 'I’ll allow it.'],
    about: ['{title}? Derivative. But charming.', 'A serviceable {by}. The real one is better. Oh, this is the real one.'],
  },
  kid: {
    label: 'Kid',
    names: ['Timmy', 'Lulu', 'Max', 'Ivy', 'Pip', 'Juno', 'Rory', 'Bea'],
    generic: ['Can I touch it?', 'Why is everyone being so quiet?', 'I’m gonna be a painter. Or a dinosaur.', 'Is this place haunted?', 'My tooth is loose. Wanna see?', 'Do the statues come alive at night?', 'I drew this in class except mine had a dragon.'],
    about: ['I could paint that. Probably.', 'Why is it so old?'],
  },
  grump: {
    label: 'Grump',
    names: ['Harold', 'Edna', 'Gus', 'Bernice', 'Walter', 'Dolores', 'Frank', 'Mildred'],
    generic: ['Back in my day the floors weren’t cracked.', 'Too many cobwebs. I’m writing a letter.', 'Benches. This place needs benches.', 'Prices these days. Even the air costs money.', 'I came here in 1962. It was better. I think.', 'Somebody’s phone keeps beeping. Not mine. Probably.'],
    about: ['Hmph. Fine. It’s fine.', 'Paid good money to look at this. It was free. Still.'],
  },
  tourist: {
    label: 'Tourist',
    names: ['Hiro', 'Greta', 'Lars', 'Sofia', 'Yuki', 'Pierre', 'Amara', 'Diego'],
    generic: ['Where is the bathroom?', 'Is the gift shop open?', 'My guidebook said this place was in ruins. It’s getting better!', 'Three museums today. My feet are crying.', 'Do you sell postcards? Asking for my mom.', 'Selfie time!'],
    about: ['Excuse me, can you take my photo with {title}?', 'This is on my list! Check.'],
  },
  artist: {
    label: 'Art student',
    names: ['Frida', 'Leo', 'Saoirse', 'Kenji', 'Marisol', 'Ezra'],
    generic: ['I’m here to copy the masters. Legally.', 'My sketchbook is 90% hands. Hands are hard.', 'Someday my painting will hang here. Save me a wall.', 'Charcoal on my face? It’s a look.'],
    about: ['Look how {by} handled the light. I’m taking notes.', 'I’ve tried to copy {title} three times. It beat me every time.'],
  },
  influencer: {
    label: 'Influencer',
    names: ['Brielle', 'Jaxon', 'Skye', 'Kai', 'Mackenzie', 'Zane'],
    generic: ['Hey besties, we’re at a MUSEUM today.', 'The lighting in here is so good for content.', 'Is it okay if I film? Thanks, you’re a gem.', 'Like and subscribe for more culture.'],
    about: ['{title} is giving main character energy.', 'Okay but {by} would have been huge on socials.'],
  },
  couple: {
    label: 'On a date',
    names: ['Romeo', 'Juliet', 'Ana', 'Miguel', 'Hana', 'Owen'],
    generic: ['First date. Going great. I think.', 'We met at a museum. Now we come every anniversary.', 'Don’t tell them, but I only came for the coffee.'],
    about: ['This one’s our favorite. We argue about what it means.', 'If {title} were a person I’d be jealous.'],
  },
  historian: {
    label: 'Historian',
    names: ['Professor Hale', 'Dr. Osei', 'Agnes', 'Ignatius'],
    generic: ['Every object here survived wars, fires and clumsy movers.', 'History is just gossip that got old.', 'I wrote a 400-page book about one spoon. Ask me.'],
    about: ['{year}. Imagine what was happening in the world then.', 'When {by} painted this, nobody knew it would end up here.'],
  },
  student: {
    label: 'Student',
    names: ['Ollie', 'Zara', 'Felix', 'Imani', 'Noah', 'Luna'],
    generic: ['Field trip! Best day of the semester.', 'My essay is due tomorrow. I’m “researching”.', 'Our teacher said there’d be a quiz. On vibes, hopefully.', 'I came for extra credit and stayed for the art.', 'This is way better than the textbook.'],
    about: ['I have to write two pages about {title}. Help.', 'Wait, {by} was only my age once? Respect.'],
  },
  elder: {
    label: 'Regular',
    names: ['Rose', 'Albert', 'Ingrid', 'Mo', 'Pearl', 'Stanley'],
    generic: ['I come every Tuesday. It’s good for the heart.', 'My late husband loved museums. I still bring him, in a way.', 'Take your time, dear. Paintings don’t rush.', 'I remember when this building was a bank.', 'The benches here are lovely. Thank you for the benches.'],
    about: ['I saw {title} once, long ago. It hasn’t aged a day. I have.', 'Isn’t it wonderful? {by} gave us something to keep.'],
  },
  teacher: {
    label: 'Teacher (school trip)',
    staff: true, // only comes with a class
    names: ['Ms. Alvarez', 'Mr. Okafor', 'Mrs. Lindqvist', 'Mr. Bell'],
    generic: ['Stay together, everyone! Buddy system!', 'Worksheets out. Question one: what colors do you see?', 'No touching! Eyes only!', 'Who can tell me what “museum” means? Anyone?', 'We have twenty minutes before the bus. Make them count.'],
    about: [],
  },
  // Staff (not random visitors).
  barista: {
    label: 'Barista',
    staff: true,
    names: ['Nico', 'Rosa', 'Theo', 'Ivy'],
    generic: ['Latte art is art. Hang one of mine.', 'Every visitor wants a coffee. More visitors, more cups.', 'We have a croissant named after Monet. It’s blurry.'],
    about: [],
  },
  caretaker: {
    label: 'Caretaker',
    staff: true,
    names: ['Edmund'],
    generic: ['I’ve looked after this place for forty years. It’s good to see it alive again.', 'Upgrade the office and the board will let us grow.', 'In my day we had one painting and a very nice chair.', 'Every great museum started with one room. And a mop.'],
    about: [],
  },
  guide: {
    label: 'Tour guide',
    staff: true,
    names: ['Penelope', 'Arturo', 'Mei', 'Bertrand'],
    generic: ['And on your left: art! On your right: also art.', 'Stay together, everyone! No touching the masterpieces.', 'Fun fact: this hall used to be a ballroom. Probably.', 'Tips are appreciated. So is applause.'],
    about: [],
  },
  carpenter: {
    label: 'Carpenter',
    staff: true,
    names: ['Hank', 'Rosa', 'Big Lou', 'Tess'],
    generic: ['Measure twice, cut once. Then build a room in a snap.', 'Patched every crack in the entrance. You’re welcome.', 'This hard hat has seen things.', 'Need another room? Point me at a wall.'],
    about: [],
  },
  guard: {
    label: 'Security',
    staff: true,
    names: ['Rex', 'Dana', 'Moe', 'Kat'],
    generic: ['All quiet. Just how I like it.', 'Nobody touches the art on my watch.', 'I’ve been standing here so long the statues think I’m one of them.', 'Relax. I got this.', 'Saw a guy eyeing the Vermeer. Gave him the look. He left.'],
    about: [],
  },
  janitor: {
    label: 'Janitor',
    staff: true,
    names: ['Gus', 'Marisol', 'Earl', 'Dot'],
    generic: ['Just this one puddle. I’m on it.', 'Spotless. Just how I like it.', 'You wouldn’t believe what people drop in here.', 'Thirty years with a mop. Still undefeated.', 'Somebody spilled a smoothie by the sculptures. Handled.'],
    about: [],
  },
};

// Painting-specific jokes and facts, by artist.
export const ABOUT_ARTIST = {
  vangogh: [
    'I heard he ate yellow paint.',
    'Did he really mail his ear to someone?',
    'He didn’t mail it. He handed it to someone. Somehow worse.',
    'He painted Starry Night from the window of an asylum.',
    'Supposedly he only sold one painting while he was alive.',
  ],
  leonardo: [
    'She’s smaller than I expected.',
    'Where are her eyebrows?',
    'Leonardo wrote his notes backwards. Mirror writing.',
    'He carried this painting around for years. Never finished, never delivered.',
  ],
  hokusai: [
    'Hokusai changed his name like thirty times.',
    'That wave is about to ruin someone’s day.',
    'Mount Fuji is in there. Tiny. Look.',
    'It’s a print! They made thousands of copies.',
  ],
  vermeer: [
    'Only about 34 Vermeers are known to exist.',
    'Some people think that pearl is just polished tin.',
    'That bread looks crunchy.',
    'How does he make the light look like that?',
  ],
  botticelli: ['She’s standing on a giant scallop.', 'Imagine showing up to the beach like that.', 'Botticelli supposedly burned some of his own paintings.'],
  monet: [
    'A critic made fun of this title. That’s where “Impressionism” comes from.',
    'Monet would paint the same thing over and over in different light.',
    'Is that sunrise or sunset? Sunrise. It says so. I should read.',
  ],
  munch: ['Same, buddy.', 'There are several versions. He really liked screaming.', 'This is how I feel on Mondays.'],
  friedrich: ['Bro’s on the edge of a cliff in a coat.', 'Main character energy.', 'Imagine the hike up there in those shoes.'],
  klimt: ['Is that real gold?', 'It is! Gold leaf, right in the paint.', 'I want a blanket that looks like this.'],
  seurat: ['It’s all tiny dots. Took him about two years.', 'Is that a monkey on a leash?', 'Step back. Now step closer. Now back. Wild.'],
  rembrandt: [
    'It’s not even night. The varnish just got dark.',
    'They cut part of it off to fit it on a wall.',
    'Rembrandt painted himself into a lot of his work. Look for a face peeking out.',
  ],
  bruegel: ['Someone’s napping under that tree. Relatable.', 'Everyone’s on lunch break. Big mood.', 'This is one of a set of seasons. Only five survived.'],
  vaneyck: ['He signed it on the wall: “Jan van Eyck was here.” Graffiti, but fancy.', 'Count the beads, the oranges, the dog hairs. He painted everything.', 'Find the mirror. There are two extra people in it.'],
  velazquez: ['The painter painted himself painting us. My brain hurts.', 'The king and queen are in the mirror. Or are they standing where I am?', 'Picasso made 58 versions of this one.'],
  bosch: ['Is that a man inside a strawberry?', 'Every time I look I find a new weird thing.', 'Five hundred years old and still the strangest painting here.'],
  caravaggio: ['Caravaggio was always getting into sword fights. True story.', 'That basket is about to fall. I can’t stop looking at it.', 'The lighting is so dramatic. Like a movie.'],
  michelangelo: ['He painted this upside down. On a ceiling. For four years.', 'The fingers don’t even touch!', 'Michelangelo said he was a sculptor, not a painter. Show-off.'],
  raphael: ['That’s Plato pointing up and Aristotle pointing down.', 'Raphael put himself in at the edge, looking at us.', 'Every philosopher in one room. Imagine the arguments.'],
  goya: ['The man in white has marks on his hands like a saint.', 'Goya went deaf and painted darker and darker.', 'This one gives me chills.'],
  manet: ['It caused a huge scandal in 1863.', 'Why is the guy wearing a suit to a picnic?', 'Manet opened the door for the Impressionists.'],
  renoir: ['I can almost hear the music.', 'Renoir’s friends all posed for this.', 'That light through the trees is perfect.'],
  degas: ['Degas said he wasn’t an Impressionist. He was.', 'Look at the dancer scratching her back.', 'He made a sculpture of a dancer with a real tutu.'],
  turner: ['Turner tied himself to a ship’s mast to watch a storm. Allegedly.', 'That sunset is basically on fire.', 'He’s on the British £20 note.'],
  holbein: ['Look at it from the side! The smear is a skull!', 'Those two had a lot of hobbies, apparently.', 'Holbein painted Henry VIII too.'],
  durer: ['He was 28 and already this confident.', 'Every single hair. Every one.', 'Dürer signed his initials like a logo. Very modern.'],
  bonheur: ['She needed a police permit to wear pants.', 'Those horses are bigger than my apartment.', 'Rosa Bonheur was one of the most famous painters of her time.'],
};

const pick = (list, r) => list[Math.floor(r * list.length) % list.length];

export function lineFor(personality, painting, r1 = Math.random(), r2 = Math.random()) {
  const p = PERSONALITIES[personality];
  if (painting && !p.staff && r1 < 0.75) {
    const facts = ABOUT_ARTIST[painting.artist] || [];
    const pool = r2 < 0.65 && facts.length ? facts : p.about;
    return pick(pool, Math.random()).replace('{title}', painting.title).replace('{by}', painting.by).replace('{year}', painting.year);
  }
  return pick(p.generic, r2);
}

// Short things visitors say out loud while looking around (floating text).
export const QUIPS = {
  nerd: ['Fascinating.', 'Note to self…', 'Oil on canvas!', 'Ah, chiaroscuro.'],
  casual: ['Nice.', 'Vibes.', 'Huh, cool.', 'Love this.'],
  fanboy: ['AMAZING!!', 'I’m crying.', 'Iconic.', 'Best day ever!'],
  snob: ['Hmm.', 'Passable.', 'Quaint.', 'Darling.'],
  kid: ['Whoa!', 'Mom, look!', 'Dragons?', 'Cool!!', 'Field trip!!', 'I’m hungry.'],
  grump: ['Hmph.', 'Too bright.', 'Back in my day…', 'Fine.'],
  tourist: ['*click*', 'Selfie!', 'Wow!', 'Postcard!'],
  artist: ['That light…', 'Sketching!', 'Those hands!', 'Goals.'],
  influencer: ['Content!', 'So aesthetic.', 'Like & share!', 'Iconic.'],
  couple: ['Aww.', 'Our spot.', 'So romantic.', 'Holding hands!'],
  historian: ['Remarkable.', 'Primary source!', '1600s, surely.', 'Indeed.'],
  student: ['Essay material!', 'Wait, what?', 'So cool.', 'Taking notes.'],
  elder: ['Lovely.', 'Oh my.', 'How nice.', 'Wonderful.'],
  famous: ['Magnifique.', 'Hmm!', 'Bravo.', 'Splendid.'],
};

// Lines that depend on the room: its rating, its mess, the time of day.
export const CONTEXT = {
  dirty: ['Someone should mop that puddle.', 'Is that… litter? In a museum?', 'Watch your step, there’s a spill.'],
  great: ['This room is stunning. Five stars.', 'Whoever decorated this has taste.', 'I could stay in this room all day.'],
  poor: ['Bit empty in here, isn’t it?', 'This room needs some love. And paintings.', 'Nice walls. Where’s the art?'],
  night: ['Open late! I love a museum at night.', 'It’s so cozy with the lamps on.', 'Late-night culture. Very fancy.'],
  morning: ['First ones in! The light is lovely.', 'Morning coffee, then masterpieces.'],
};
