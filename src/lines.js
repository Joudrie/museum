// What visitors say. Each visitor has a personality; near a painting they
// usually talk about it, otherwise they say something generic.

export const PERSONALITIES = {
  nerd: {
    label: 'Art nerd',
    names: ['Dennis', 'Priya', 'Walt', 'Mina'],
    generic: [
      'Fun fact: most old paintings were varnished, and the varnish yellows over time.',
      'I’ve read every placard in here. Twice.',
      'Did you know “museum” comes from the Muses? Greek goddesses of the arts.',
      'I brought a notebook. Don’t judge me.',
    ],
    about: ['Ah, {title}. {year}. Classic.', 'Look at the brushwork on this one. {by} was not messing around.'],
  },
  casual: {
    label: 'Just vibing',
    names: ['Jordan', 'Sam', 'Ali', 'Kayla'],
    generic: ['This place has good vibes.', 'Honestly I came in for the AC.', 'Do they do events here? Like with snacks?', 'My friend said this place was mid. My friend is wrong.'],
    about: ['Yeah this one’s cool.', 'I don’t know much about art but I like the colors on this.'],
  },
  fanboy: {
    label: 'Superfan',
    names: ['Tyler', 'Bex', 'Marco', 'June'],
    generic: ['I would DIE for this museum.', 'I’ve been here four times this week. I live here now.', 'Is there a gift shop? I need a tote bag.'],
    about: ['{by}!!! I have {title} on a mug. Two mugs actually.', 'OK this is my favorite. No wait. Yes. This one.'],
  },
  snob: {
    label: 'Art snob',
    names: ['Reginald', 'Margot', 'Percival', 'Odette'],
    generic: ['The lighting is… a choice.', 'Hmm. I’ve seen better. In Paris.', 'One must view art in silence. *sips imaginary wine*'],
    about: ['{title}? Derivative. But charming.', 'A serviceable {by}. The real one is better. Oh, this is the real one.'],
  },
  kid: {
    label: 'Kid',
    names: ['Timmy', 'Lulu', 'Max', 'Ivy'],
    generic: ['Can I touch it?', 'Why is everyone being so quiet?', 'I’m gonna be a painter. Or a dinosaur.', 'Is this place haunted?'],
    about: ['I could paint that. Probably.', 'Why is it so old?'],
  },
  grump: {
    label: 'Grump',
    names: ['Harold', 'Edna', 'Gus', 'Bernice'],
    generic: ['Back in my day the floors weren’t cracked.', 'Too many cobwebs. I’m writing a letter.', 'Benches. This place needs benches.'],
    about: ['Hmph. Fine. It’s fine.', 'Paid good money to look at this. It was free. Still.'],
  },
  tourist: {
    label: 'Tourist',
    names: ['Hiro', 'Greta', 'Lars', 'Sofia'],
    generic: ['Where is the bathroom?', 'Is the gift shop open?', 'My guidebook said this place was in ruins. It’s getting better!'],
    about: ['Excuse me, can you take my photo with {title}?', 'This is on my list! Check.'],
  },
  // Staff (not random visitors).
  barista: {
    label: 'Barista',
    staff: true,
    names: ['Nico', 'Rosa', 'Theo', 'Ivy'],
    generic: ['Latte art is art. Hang one of mine.', 'Every visitor wants a coffee. More visitors, more cups.', 'We have a croissant named after Monet. It’s blurry.'],
    about: [],
  },
  janitor: {
    label: 'Janitor',
    staff: true,
    names: ['Gus', 'Marisol', 'Earl', 'Dot'],
    generic: ['Spotless. Just how I like it.', 'You wouldn’t believe what people drop in here.', 'Thirty years with a mop. Still undefeated.', 'Somebody spilled a smoothie by the sculptures. Handled.'],
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
