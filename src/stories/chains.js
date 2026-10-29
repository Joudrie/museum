// Famous-visitor quest chains. Each visitor has three steps: meet them, then two asks that
// need something from the player's museum, and the last step hands out a lead (Chat 7 turns
// leads into expeditions). Each `fact` is built from a `quote`, with its source. Dialogue is
// in the visitor's voice; the facts are the sourced part. Numbers in a fact must be in its quote.
const WP = (title) => `https://en.wikipedia.org/wiki/${title}`;
const fetched = '2026-10-29';

export const CHAINS = {
  vermeer: {
    steps: [
      {
        id: 'vermeer1',
        ask: 'Come, let me tell you how little I made.',
        needs: (c) => c.metIds.includes('vermeer'),
        say: 'I earned my living largely as a dealer in art, you know, not only as a painter. The paintings were few.',
        fact: { text: 'Vermeer painted relatively few pictures and mainly earned his living as an art dealer.', quote: 'He produced relatively few paintings, primarily earning his living as an art dealer.', source: WP('Johannes_Vermeer'), fetched },
      },
      {
        id: 'vermeer2',
        ask: 'Hang one of my pictures where the window light can reach it.',
        needs: (c) => c.hungBy.includes('vermeer'),
        say: 'Ah, there it is. I painted in two small rooms of my house in Delft. Very little changed from picture to picture.',
        fact: { text: 'Most of Vermeer’s paintings are set in two smallish rooms of his house in Delft.', quote: '"Almost all his paintings", Hans Koningsberger wrote, "are apparently set in two smallish rooms in his house in Delft', source: WP('Johannes_Vermeer'), fetched },
      },
      {
        id: 'vermeer3',
        ask: 'Meet two more artists, and I will tell you a riddle of Delft.',
        needs: (c) => c.met >= 3,
        say: 'They called me the Sphinx of Delft, because so little was written down about me. Perhaps the answers are in a letter, on some island, waiting.',
        fact: { text: 'The critic Thoré-Bürger named Vermeer "The Sphinx of Delft", since so little was recorded about him.', quote: 'Until the 19th century, the only sources of information were a few registers, official documents, and comments by other artists; for this reason, Thoré-Bürger named him "The Sphinx of Delft".', source: WP('Johannes_Vermeer'), fetched },
        reward: 120,
        lead: { id: 'sphinx-letter', text: 'Vermeer mentions a letter that may be kept on a far island.' },
      },
    ],
  },
  rembrandt: {
    steps: [
      {
        id: 'rembrandt1',
        ask: 'Look at my face. I painted it many times.',
        needs: (c) => c.metIds.includes('rembrandt'),
        say: 'Count my self-portraits if you have the patience. Together they read like a diary.',
        fact: { text: 'Rembrandt made about 100 self-portraits, over 40 of them paintings.', quote: 'His approximately 100 self-portraits, over 40 of which are paintings, form an intimate autobiography.', source: WP('Rembrandt'), fetched },
      },
      {
        id: 'rembrandt2',
        ask: 'Hang one of mine, and give it a good light.',
        needs: (c) => c.hungBy.includes('rembrandt'),
        say: 'Good. Know that fortune is not kind to painters. In July 1656 I declared myself insolvent and gave up what I owned.',
        fact: { text: 'In July 1656 Rembrandt declared himself insolvent and willingly surrendered his assets.', quote: 'In July 1656, he declared his insolvency, taking stock and willingly surrendered his assets.', source: WP('Rembrandt'), fetched },
      },
      {
        id: 'rembrandt3',
        ask: 'Meet three artists, and I will point you somewhere.',
        needs: (c) => c.met >= 3,
        say: 'Students copied my self-portraits as part of their training, so not every “Rembrandt” is mine. Some answers are hidden on an island, in an old studio chest.',
        fact: { text: 'Some pictures once counted as Rembrandt self-portraits are now known to be student copies made as training.', quote: 'At one time, approximately 90 paintings were counted as Rembrandt self-portraits but it is now known that he had his students copy his own self-portraits as part of their training.', source: WP('Rembrandt'), fetched },
        reward: 120,
        lead: { id: 'studio-chest', text: 'Rembrandt speaks of an old studio chest on a far island.' },
      },
    ],
  },
  hokusai: {
    steps: [
      {
        id: 'hokusai1',
        ask: 'Do you know how many names I used?',
        needs: (c) => c.metIds.includes('hokusai'),
        say: 'Call me whatever you like. I have used at least thirty names in my life.',
        fact: { text: 'Hokusai used at least thirty names during his lifetime.', quote: 'Hokusai was known by at least thirty names during his lifetime.', source: WP('Hokusai'), fetched },
      },
      {
        id: 'hokusai2',
        ask: 'Hang my Great Wave. It is only one of the views of Fuji.',
        needs: (c) => c.hungBy.includes('hokusai'),
        say: 'Thirty-Six Views of Mount Fuji. The wave is only one of them; I made it in the early 1830s.',
        fact: { text: 'The Great Wave belongs to Thirty-Six Views of Mount Fuji, made in the early 1830s.', quote: 'His most celebrated work, Thirty-six Views of Mount Fuji, including the famous The Great Wave off Kanagawa and Red Fuji was produced in the early 1830s.', source: WP('Hokusai'), fetched },
      },
      {
        id: 'hokusai3',
        ask: 'Meet three artists, then I will tell you where my last pictures went.',
        needs: (c) => c.met >= 3,
        say: 'From 1834 I signed as “The Old Man Mad About Art”. I painted a dragon and a tiger in early 1849, near the end. Their story is still being told, far from here.',
        fact: { text: 'From 1834 Hokusai worked as "Gakyō Rōjin Manji" ("The Old Man Mad About Art"), and painted until almost the end, in early 1849.', quote: 'The next period, beginning in 1834, saw Hokusai working under the name "Gakyō Rōjin Manji" (画狂老人卍; "The Old Man Mad About Art"). Hokusai continued working almost until the end, painting The Dragon of Smoke Escaping from Mt Fuji and Tiger in the Snow in early 1849.', source: WP('Hokusai'), fetched },
        reward: 120,
        lead: { id: 'last-scrolls', text: 'Hokusai hints at his last scrolls, kept on a far island.' },
      },
    ],
  },
};
