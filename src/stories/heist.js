// "The Empty Frames": the first story arc. Edmund the caretaker tells the true story of the
// 1990 theft at the Isabella Stewart Gardner Museum in Boston, one chapter at a time, as the
// player meets the artists whose work was taken. Every `line` is built from a `quote` (the
// museum's own sentence); the checker in tests/people.cjs refuses numbers that aren't in it.
// Tone (docs/CONTENT-STYLE.md, sensitive subjects): plain and factual, no jokes, no guessing.
const SRC = {
  who: 'Isabella Stewart Gardner Museum',
  url: 'https://www.gardnermuseum.org/about/theft',
  fetched: '2026-10-29',
};

export const HEIST = {
  id: 'heist',
  title: 'The Empty Frames',
  teller: 'caretaker',
  source: SRC,
  beats: [
    {
      id: 'heist1',
      when: 'Meet one famous visitor',
      needs: (c) => c.met >= 1,
      line: 'Every museum has a story it would rather not tell. In the early hours of March 18, 1990, two men in police uniforms rang the intercom of a Boston museum and said they were responding to a disturbance.',
      quote: 'In the early hours of March 18, 1990, two men in police uniforms rang the Museum intercom and stated they were responding to a disturbance.',
    },
    {
      id: 'heist2',
      when: 'Meet Vermeer',
      needs: (c) => c.metIds.includes('vermeer'),
      line: 'The guard on duty let them in through the employee entrance. He and a second guard were led to the basement and restrained.',
      quote: 'The guard on duty broke protocol and allowed them through the employee entrance. At the thieves’ direction, he stepped away from the security desk. He and a second security guard were led to the basement of the Museum where they were restrained.',
    },
    {
      id: 'heist3',
      when: 'Meet Rembrandt',
      needs: (c) => c.metIds.includes('rembrandt'),
      line: 'In the Dutch Room they cut two Rembrandts from their frames: Christ in the Storm on the Sea of Galilee and A Lady and Gentleman in Black. They also took Vermeer’s Concert.',
      quote: 'They took several well-known works of art from the Museum’s second floor Dutch Room. They cut Rembrandt’s Christ in the Storm on the Sea of Galilee and A Lady and Gentleman in Black from their frames; removed Vermeer’s Concert and Flinck’s Landscape with an Obelisk from their frames',
    },
    {
      id: 'heist4',
      when: 'Meet 5 famous visitors',
      needs: (c) => c.met >= 5,
      line: 'They also took five Degas works, a bronze eagle finial, and Manet’s Chez Tortoni, whose frame was left behind. The thieves left at 2:45 am. The guards stayed handcuffed until 8:15.',
      quote: 'In the Short Gallery, also on the second floor, they took five Degas works and a bronze eagle finial. They also stole Manet’s Chez Tortoni from the Blue Room on the Museum’s first floor, leaving its frame behind as well. The thieves departed at 2:45 am, making two separate trips to their car with the artworks. The guards remained handcuffed until police arrived at 8:15 am.',
    },
    {
      id: 'heist5',
      when: 'Hang a painting by Vermeer or Rembrandt',
      needs: (c) => c.hungBy.includes('vermeer') || c.hungBy.includes('rembrandt'),
      line: 'It remains unsolved. The museum, working with the FBI, still asks for facts that could bring the works home safely, and a share of the reward is promised for information. Hang your frames with care.',
      quote: 'The 1990 theft of 13 works of art from the Isabella Stewart Gardner Museum’s collection remains unsolved, although the Museum’s commitment to recovering the stolen works has never diminished. The Museum, working closely with the FBI and the US Attorney\'s Office, continues to seek facts that could result in the safe return of the art. A share of the reward is promised in exchange for information leading to the restitution of any individual work or group of works.',
      reward: 250,
      // Clean hook for Chat 7 (expeditions): offering this lead puts a note in
      // `curation.leads_offered`; the expedition code turns it into a trip.
      lead: { id: 'heist-hideout', text: 'Edmund has a hunch about a hideout on a far island. Worth a look by boat.' },
    },
  ],
};
