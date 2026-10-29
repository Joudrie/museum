// What people out on the islands say first. The line follows the day: the season,
// the weather, the hour and any holiday, so a chat in the snow is about the snow.
// (After this first line they talk like museum visitors: src/chatter.js.)
const ANY = [
  'Lovely day for it.',
  'Have you been to the museum yet?',
  'I come out here to think.',
  'The fish are biting by the dock, they say.',
  'Every rock on this island has a story.',
  'Mind the tall grass. Things live in there.',
];
const SEASON = {
  autumn: ['The leaves are putting on a show this year.', 'Crunchy leaves are the best sound there is.', 'Pumpkin season! My favourite.'],
  winter: ['Brr! I can’t feel my nose.', 'Look at all my footprints in the snow!', 'Mind the ice by the pond.'],
  spring: ['The blossom is everywhere. I’m sneezing and I don’t mind.', 'Everything’s waking up.'],
  summer: ['Perfect beach weather.', 'The water’s lovely. You should try it.'],
};
const WEATHER = {
  rain: ['A little rain never hurt anyone.', 'Listen to the rain on the water.'],
  snow: ['It’s snowing! It’s snowing!', 'Snow on the water. Isn’t that something?'],
};
const NIGHT = ['The stars are out. Look at them all.', 'It’s so quiet out here at night.'];
const HALLOWEEN = ['Trick or treat! Got any candy?', 'I love the pumpkins by the museum doors.'];

export function islandLine({ season, weather, night, holiday }) {
  const pool = [...ANY, ...(SEASON[season] || []), ...(WEATHER[weather] || [])];
  if (night) pool.push(...NIGHT, ...NIGHT);
  if (holiday === 'halloween') pool.push(...HALLOWEEN, ...HALLOWEEN);
  return pool[Math.floor(Math.random() * pool.length)];
}
