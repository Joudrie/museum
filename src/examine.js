// Walk up to almost anything and look at it, the way you can in Pokémon: "It's a stack of
// rocks." Every kind of thing has a few lines, and you get a different one each time (never
// the same twice in a row). Some things you can also sit on.
//
// ROOM is keyed by museum item type (src/items.js), ISLAND by island tile name (src/tiles.js),
// PIECES by the builder piece group ('plants/3' -> plants). Anything not listed has no Look.

const pick = (a, last) => {
  if (a.length < 2) return a[0];
  let s;
  do s = a[Math.floor(Math.random() * a.length)];
  while (s === last);
  return s;
};

// ---------- the museum ----------
export const ROOM = {
  stool: { name: 'Stool', sit: true, lines: ['A wooden stool. Three legs, zero opinions.', 'It wobbles a tiny bit. Just enough to notice.', 'Someone carved their initials underneath. Rude, but kind of sweet.'] },
  bench: { name: 'Gallery bench', sit: true, lines: ['A long gallery bench. Made for staring at one painting for way too long.', 'It’s still warm. Somebody was just here, thinking deep thoughts.', 'The best seat in the house is whichever one faces the art.'] },
  sofa: { name: 'Velvet sofa', sit: true, lines: ['A deep velvet sofa. It looks like it would swallow you whole.', 'There are a few coins down the back of the cushions. You leave them for the next person.', 'Fancy. The kind of sofa you’re not sure you’re allowed to sit on.'] },
  stanchion: { name: 'Stanchion', lines: ['A brass post. It politely says “not past here.”', 'It’s been polished so much you can see your face in it.', 'Its whole job is standing still. It’s very good at it.'] },
  info_sign: { name: 'Exhibit sign', lines: ['A little sign. Somebody worked hard on these three sentences.', 'The sign says “Please do not touch.” You weren’t going to. Probably.', 'Small print, big facts.'] },
  rope: { name: 'Velvet rope', lines: ['A red velvet rope. It makes everything behind it look important.', 'It droops in the middle in a very satisfying way.', 'You could step over it. You won’t. But you could.'] },
  fern: { name: 'Fern', lines: ['A leafy fern. Ferns were around before the dinosaurs.', 'It’s doing great. Better than most of us.', 'Little curled fronds are uncurling at the top. Slowly. Very slowly.'] },
  monstera: { name: 'Monstera', lines: ['A monstera with big holey leaves. The holes help it survive heavy rain and wind.', 'Its leaves are bigger than your head.', 'It leans toward the light like it’s trying to see the art.'] },
  cactus: { name: 'Cactus', lines: ['A cactus. It’s fine. Don’t hug it.', 'It hasn’t been watered in weeks and it has never been happier.', 'Spiky, but in a friendly way.'] },
  tree: { name: 'Little tree', lines: ['A little tree in a pot. It’s trying its best.', 'A few leaves have fallen on the floor. Somebody will sweep those up.', 'It’s been here so long it probably knows every painting by heart.'] },
  palm: { name: 'Potted palm', lines: ['A potted palm. It brings a little beach into the room.', 'Its fronds sway whenever someone walks by.', 'A palm, indoors. Living the dream.'] },
  bonsai: { name: 'Bonsai', lines: ['A tiny tree, trimmed for years to look like an old giant.', 'Some bonsai are hundreds of years old. This one looks wise.', 'You whisper “hello” to it. It doesn’t answer. Fair.'] },
  cherry: { name: 'Cherry blossom tree', lines: ['A cherry blossom tree. A petal floats down as you look.', 'In Japan, people picnic under these just to watch the petals fall.', 'Pink and soft. It smells faintly sweet.'] },
  orchid: { name: 'Orchid', lines: ['An orchid. There are more kinds of orchid than birds and mammals put together.', 'Delicate and a little dramatic.', 'It’s blooming. Somebody’s been looking after it.'] },
  lamp: { name: 'Floor lamp', lines: ['A tall floor lamp. Warm light, cozy vibes.', 'A moth is doing laps around it.', 'It hums very quietly.'] },
  candelabra: { name: 'Candelabra', lines: ['A candelabra. Very haunted-mansion. In a nice way.', 'The candles are electric. Fire and paintings don’t mix.', 'Little drips of old wax are frozen down the arms.'] },
  lantern: { name: 'Stone lantern', lines: ['A stone lantern from a Japanese garden.', 'It’s heavy. Like, really heavy.', 'Moss is growing in the little roof. It’s perfect.'] },
  bust: { name: 'Marble bust', lines: ['A marble bust. Just a head and shoulders, staring into the distance.', 'It’s a statue of a head. It looks like it knows something you don’t.', 'Its nose is a little chipped. Happens to the best of us.', 'Roman busts were once painted in bright colors. The paint wore off over time.'] },
  statue: { name: 'Classical statue', lines: ['A classical statue, frozen mid-pose for a couple thousand years.', 'Ancient Greek statues were painted in bright colors once. Now they’re just marble white.', 'It’s missing an arm. Nobody knows where it went.', 'Its pose looks really uncomfortable to hold forever.'] },
  armor: { name: 'Suit of armor', lines: ['A suit of armor. Nobody’s inside. Probably.', 'A full suit could weigh about as much as a big dog.', 'You knock on it. It echoes. Good. Empty.', 'Its visor is closed. It feels like it’s watching you.'] },
  vase: { name: 'Ancient vase', lines: ['An ancient vase in a case. Somebody made this by hand thousands of years ago.', 'The painted figures on it are running somewhere. Late for something.', 'There’s a tiny crack someone glued back very carefully.'] },
  sarcophagus: { name: 'Sarcophagus', lines: ['A sarcophagus. The lid is closed. Let’s keep it that way.', 'The painted face on the lid is smiling a little.', 'It’s covered in hieroglyphs. You can make out a bird. And another bird. Lots of birds.'] },
  skull: { name: 'Dinosaur skull', lines: ['A dinosaur skull. Look at those teeth.', 'It’s been around for over 66 million years. It looks it.', 'You count the teeth. You lose count. A lot of teeth.'] },
  globe: { name: 'Antique globe', lines: ['An old globe. Some of the countries on it don’t exist any more.', 'You give it a spin. It squeaks.', 'The sea has little sea monsters painted on it. Mapmakers had fun.'] },
  bookshelf: { name: 'Bookshelf', lines: ['A bookshelf full of old books. One is upside down.', 'Mostly art history. A cookbook somehow snuck in.', 'You pull one out. It’s 400 pages about one painting. You put it back.'] },
  fountain: { name: 'Fountain', lines: ['A fountain. People have tossed coins in for luck.', 'The water sounds calm. Very calm.', 'There’s a penny right in the middle. Nice throw, whoever that was.'] },
  obelisk: { name: 'Obelisk', lines: ['An obelisk. A tall pointy stone, carved from a single block.', 'Ancient Egyptians stood these at temple gates.', 'It’s really, really pointy.'] },
  canopic: { name: 'Canopic jars', lines: ['Canopic jars. In ancient Egypt they held organs for the afterlife.', 'Each lid is a different head: a human, a baboon, a jackal and a falcon.', 'Best not to open these. Ever.'] },
  trex: { name: 'T-rex skeleton', lines: ['A T-rex skeleton. Tiny arms, huge reputation.', 'It’s looking down at you. You feel very small.', 'Its arms are tiny, but each one could lift about as much as a grown person.'] },
  meteorite: { name: 'Meteorite', lines: ['A meteorite. A rock from space. You’re looking at outer space right now.', 'It’s mostly iron. Much heavier than it looks.', 'It traveled through space for ages just to end up on this stand.'] },
  telescope: { name: 'Telescope', lines: ['A brass telescope. You peek in. Ceiling.', 'Point it at the night sky and you could see the rings of Saturn.', 'It’s aimed out the window, at nothing in particular.'] },
  specimens: { name: 'Specimen jars', lines: ['Specimen jars. Something is floating in that one. You don’t look too closely.', 'Each jar is labelled in very tiny, very neat handwriting.', 'One of them seems to be looking at you.'] },
  geode: { name: 'Geode', lines: ['A geode. Plain on the outside, full of crystals inside.', 'It looks like a cave someone could live in, if they were very small.', 'It sparkles when you tilt your head.'] },
  piano: { name: 'Grand piano', lines: ['A grand piano. You press one key. It rings for a long time.', 'It’s perfectly in tune. Somebody comes in early to do that.', 'There’s sheet music on the stand. It looks hard.'] },
  harp: { name: 'Golden harp', lines: ['A golden harp. You pluck one string. Lovely.', 'It has 47 strings. You count. You give up at 20.', 'It makes you want to sit up straighter.'] },
  easel: { name: 'Artist’s easel', lines: ['An easel with a half-finished painting. Someone’s working on it.', 'There’s a thumbprint of blue paint on the corner.', 'The canvas is blank. That’s the scariest part.'] },
  clock: { name: 'Grandfather clock', lines: ['A grandfather clock. Tick. Tock. Tick.', 'It runs about two minutes fast. Nobody has the heart to fix it.', 'Its pendulum swings back and forth. It’s kind of hypnotic.'] },
  aquarium: { name: 'Aquarium', lines: ['An aquarium. A little fish swims right up to the glass and stares at you.', 'Bubbles rise from a tiny treasure chest.', 'You tap the glass. You immediately feel bad about it.'] },
  big_tank: { name: 'Giant tank', lines: ['A giant tank. The water is so blue it hurts a little.', 'Something big just swam by. You only saw its tail.', 'You could watch this all day. You might.'] },
  birdcage: { name: 'Canary cage', lines: ['A canary hops from perch to perch.', 'It sings a short song, then looks at you like it’s waiting for applause.', 'The bird is very busy doing nothing.'] },
  urn: { name: 'Greek urn', lines: ['A Greek urn. The painted people on it are having a feast.', 'Black figures on orange clay. Over two thousand years old.', 'It’s surprisingly big. You could fit a lot of soup in there.'] },
  mask: { name: 'Carved mask', lines: ['A carved wooden mask. Its eyes are hollow, but it still seems to see you.', 'Masks like this were worn in dances and ceremonies.', 'You make the same face back at it. It wins.'] },
  display_case: { name: 'Jewel case', lines: ['A jewel case. Everything in here sparkles.', 'You lean in close. Your breath fogs the glass. Oops.', 'There’s a ring in here that’s probably worth more than this whole room.'] },
  ship_model: { name: 'Ship in a case', lines: ['A tiny ship with tiny sails and tiny ropes.', 'Somebody spent a very long time on this with very tiny tweezers.', 'There’s a tiny sailor on deck. He looks lost.'] },
  idol: { name: 'Golden idol', lines: ['A golden idol. You get the urge to swap it with a bag of sand. You don’t.', 'It’s shiny. Suspiciously shiny.', 'Its tiny smile is a little smug.'] },
  butterflies: { name: 'Butterfly case', lines: ['A case of butterflies, wings spread wide.', 'One has blue wings that shimmer when you move. That blue isn’t pigment; it’s tiny scales bending the light.', 'Every one is labelled with a long Latin name.'] },
  plinth: { name: 'Plinth', lines: ['A plinth. A fancy stand for something important.', 'It’s waiting for something to put on it.', 'A very serious block.'] },
  glass_case: { name: 'Glass case', lines: ['A glass case. The glass is spotless. Somebody cares a lot.', 'You can see yourself in the reflection. Hi.', 'Everything in a glass case looks ten times more important.'] },
  specimen_shelf: { name: 'Specimen shelf', lines: ['Shelves of jars and bones and little labels.', 'There’s a jar marked “DO NOT OPEN.” Okay.', 'Science, sorted very neatly.'] },
  fossil_slab: { name: 'Fossil slab', lines: ['A slab of rock with a creature pressed into it forever.', 'It used to be the bottom of a sea.', 'You can see every tiny bone. Wild.'] },
  gramophone: { name: 'Gramophone', lines: ['A gramophone. It looks like a giant brass flower.', 'There’s a record on it. Old jazz, probably.', 'It crackles even when it isn’t playing. Somehow.'] },
  banner: { name: 'Museum banner', lines: ['A tall banner. It makes the place feel official.', 'It sways just a little when the doors open.', 'Bold letters. Big plans.'] },
  rug_round: { name: 'Round rug', lines: ['A round rug. It ties the room together.', 'It’s soft. You kind of want to take your shoes off.'] },
  rug_long: { name: 'Long runner', lines: ['A long rug that tells you where to walk.', 'It’s a little worn down the middle from all the feet.'] },
  pumpkin: { name: 'Jack-o’-lantern', lines: ['A jack-o’-lantern. Its grin is a little crooked.', 'It smells like candle and pumpkin guts.', 'Spooky, but cute.'] },
  xmas_tree: { name: 'Holiday tree', lines: ['A holiday tree covered in little lights.', 'Somebody hung an ornament shaped like a tiny painting. Clever.', 'It smells like pine. You feel cozy.'] },
  gifts: { name: 'Pile of gifts', lines: ['A pile of gifts. None of them have your name on them. You checked.', 'One of them rattles.', 'Very nicely wrapped. Better than you could do.'] },
  flower_basket: { name: 'Flower basket', lines: ['A basket of flowers. It smells like spring.', 'A bee is visiting. Indoors. Bold bee.'] },
  lockers: { name: 'Staff lockers', lines: ['Staff lockers. One has a sticker of a cat on it.', 'You hear something inside one buzz. A phone, probably.'] },
  donuts: { name: 'Donut table', lines: ['A table of donuts. Staff only. You look away. You look back.', 'Someone took a bite of one and put it back. Monster.', 'The sprinkled ones always go first.'] },
  foodcourt: { name: 'Food court stall', lines: ['A food stall. It smells like fries.', 'The menu has a sandwich named after a painting.'] },
  giftshop: { name: 'Gift shop', lines: ['The gift shop. Postcards, mugs, a tote bag with a famous painting on it.', 'There’s a little rubber duck dressed as a famous artist.'] },
  discovery: { name: 'Kids’ discovery table', lines: ['A discovery table. Fossils to touch, magnifying glasses, a lot of fingerprints.', 'Somebody built a very tall tower out of the blocks.'] },
  lectern: { name: 'Lecture stage', lines: ['A little stage with a mic. You resist the urge to tap it.', 'Somebody gave a talk here about one painting for an hour.'] },
  counter: { name: 'Coffee counter', lines: ['The coffee counter. It smells amazing.', 'A tip jar with three coins and a button in it.'] },
};
// every column: one kind of line, with its name
const COLUMN_LINES = ['A {n} column. It’s holding up the ceiling. Or at least it’s pretending to.', 'You give the {n} column a pat. Solid.', 'Columns like this were copied for thousands of years. This style is a classic.', 'It’s really tall up close.'];

// ---------- the islands ----------
const ROCK = ['It’s a rock.', 'Just a rock. A good one, though.', 'A rock. It’s been sitting here a lot longer than you.'];
const STACK = ['It’s a stack of rocks.', 'Looks like somebody stacked these on purpose.', 'A little rock tower. Someone was careful with this.', 'Don’t breathe on it. It might fall.'];
const TREE = ['It’s a tree.', 'A tree. Birds are chatting somewhere up in the leaves.', 'You lean against it for a second. It’s a good tree.', 'Leaves rustle in the wind.'];
const FLOWERS = ['Pretty flowers.', 'They smell nice.', 'A bee is busy here. You let it work.'];
const CLIFF = ['A rocky cliff. Way too steep to climb.', 'Layers of rock, stacked up over a very long time.', 'You could probably see a lot from up there.'];

export const ISLAND = {
  scarecrow: { name: 'Scarecrow', lines: ['It’s a spooky scarecrow.', 'Its button eyes are staring right at you.', 'You could swear it was facing the other way a second ago.', 'A crow is sitting on its shoulder. So, it’s not working.'] },
  cairn: { name: 'Cairn', lines: STACK },
  rocks_pile: { name: 'Pile of rocks', lines: ['It’s a pile of rocks.', 'Somebody left a lot of rocks here.', 'Looks like these are stacked. Kind of.'] },
  statue_head: { name: 'Stone head', lines: ['It’s a statue of a head. Just a head.', 'A giant stone face. It looks a little bored.', 'Where’s the rest of him? Buried, maybe.', 'Moss is growing in its ears.'] },
  standing_stone: { name: 'Standing stone', lines: ['A tall standing stone. Someone set this up a long time ago.', 'Nobody’s quite sure what stones like this were for.', 'It hums. No, it doesn’t. You just thought it did.'] },
  rock_small: { name: 'Rock', lines: ROCK },
  rock_big: { name: 'Big rock', lines: ['A big rock.', 'A big rock. Bigger than the others. It knows it.', ...ROCK.slice(2)] },
  boulder: { name: 'Boulder', lines: ['A boulder. Way too heavy to move.', 'It’s a big boulder. You give it a push. Nothing.', 'A boulder, just hanging out.'] },
  boulder_cracked: { name: 'Cracked boulder', lines: ['A boulder with a crack down the middle.', 'Looks like it could split any day now. Not today, though.'] },
  rock_sand: { name: 'Sandy rock', lines: ['A rock half buried in the sand.', 'Little shells are stuck to it.'] },
  rock_mossy: { name: 'Mossy rock', lines: ['A mossy rock. Soft on top.', 'The moss is so green it almost glows.', 'A tiny snail is crossing it. It’ll be a while.'] },
  rock_slab: { name: 'Flat rock', sit: true, lines: ['A big flat rock. Good for sitting.', 'It’s warm from the sun.'] },
  rock_jagged: { name: 'Jagged rock', lines: ['A sharp, jagged rock. Watch your step.', 'Pointy. Very pointy.'] },
  rock_jagged_big: { name: 'Jagged rock', lines: ['A huge jagged rock.', 'It looks like a dragon’s tooth.'] },
  rock_spire: { name: 'Rock spire', lines: ['A tall rock spire, sticking straight up.', 'Wind and water carved this over thousands of years.'] },
  rock_arch: { name: 'Rock arch', lines: ['A natural stone arch. The sea carved this.', 'One day the middle will fall and it’ll be two rocks.'] },
  rock_crack: { name: 'Cracked rock', lines: ['A rock with a crack in it. Something might be in there.'] },
  water_rock: { name: 'Rock', lines: ['A rock in the water. Barnacles all over it.'] },
  ore_rock: { name: 'Ore rock', lines: ['A rock with shiny streaks running through it.', 'Metal in the stone. It glints.'] },
  fossil_rock: { name: 'Fossil rock', lines: ['There’s a shell pressed into this rock. A fossil!', 'Something lived here millions of years ago.'] },
  crystal: { name: 'Crystal', lines: ['A glowing crystal. It’s cold to the touch.', 'It sparkles even in the shade.'] },
  geode: { name: 'Geode', lines: ['A split geode, full of purple crystals.', 'Plain on the outside, amazing on the inside.'] },
  tide_pool: { name: 'Tide pool', lines: ['A tide pool. A tiny crab scuttles under a rock.', 'Little anemones wave around in the water.', 'A whole tiny world in one puddle.'] },
  ice_block: { name: 'Block of ice', lines: ['A block of ice. Very cold. Very block.', 'Something is frozen inside. You can’t tell what.'] },
  mountain_1: { name: 'Mountain', lines: ['A mountain. It’s so far up.'] },
  mountain_2: { name: 'Mountain', lines: ['A mountain. You’d need a lot of snacks to climb that.'] },
  mountain_snow: { name: 'Snowy peak', lines: ['A snowy peak. The top is lost in the clouds.'] },
  waterfall: { name: 'Waterfall', lines: ['A waterfall. It’s loud and it’s beautiful.', 'Cool mist drifts over you.', 'There might be a cave behind it. There’s always a cave behind it.'] },
  tree: { name: 'Tree', lines: TREE },
  oak_tree: { name: 'Oak tree', lines: ['A big oak tree. A single oak can be home to hundreds of kinds of bugs.', ...TREE.slice(1)] },
  birch_tree: { name: 'Birch tree', lines: ['A birch tree. Its bark peels like paper.', ...TREE.slice(1)] },
  maple_tree: { name: 'Maple tree', lines: ['A maple tree. Its seeds spin down like little helicopters.', ...TREE.slice(1)] },
  willow_tree: { name: 'Willow tree', lines: ['A willow tree. Its branches hang down like a curtain.', 'It’s nice and shady under here.'] },
  cherry_tree: { name: 'Cherry tree', lines: ['A cherry tree. Petals drift down around you.', 'It’s so pink it almost looks fake.'] },
  apple_tree: { name: 'Apple tree', lines: ['An apple tree. One apple is just out of reach.', 'It smells sweet around here.'] },
  orange_tree: { name: 'Orange tree', lines: ['An orange tree. The oranges look perfect.', 'It smells like a fresh orange peel.'] },
  pine: { name: 'Pine tree', lines: ['A pine tree. It smells like the holidays.', 'Pine needles crunch under your feet.'] },
  pine_snow: { name: 'Snowy pine', lines: ['A pine tree with snow on its branches.', 'A clump of snow slides off and lands with a plop.'] },
  palm: { name: 'Palm tree', lines: ['A palm tree. Coconuts at the top. Stay out from under them.', 'It sways in the sea breeze.'] },
  tropical_tree: { name: 'Tropical tree', lines: ['A tropical tree with huge leaves.', 'It’s humid under here.'] },
  dead_tree: { name: 'Dead tree', lines: ['A dead tree. Kind of spooky.', 'Its branches look like long fingers.', 'An owl would love this tree.'] },
  sapling: { name: 'Sapling', lines: ['A little sapling. It’ll be a big tree one day.', 'Grow, little guy. Grow.'] },
  stump: { name: 'Tree stump', sit: true, lines: ['A tree stump. You can count the rings to tell how old it was.', 'A good stump for sitting.'] },
  log: { name: 'Log', sit: true, lines: ['A fallen log. Bugs are living under it.', 'It’s a log. A sitting log.'] },
  bush: { name: 'Bush', lines: ['A bush. Something rustled in it.', 'Just a bush. Probably.'] },
  hedge: { name: 'Hedge', lines: ['A neat hedge. Someone trims this every week.'] },
  hedge_l: { name: 'Hedge', lines: ['A neat hedge. Someone trims this every week.'] },
  hedge_r: { name: 'Hedge', lines: ['A neat hedge. Someone trims this every week.'] },
  hedge_round: { name: 'Round hedge', lines: ['A perfectly round hedge. Impressive.'] },
  topiary: { name: 'Topiary', lines: ['A bush trimmed into a shape. Someone has a lot of patience.', 'It’s either a bird or a teapot. Hard to say.'] },
  vines: { name: 'Vines', lines: ['Thick vines. They’re climbing everything.'] },
  bamboo: { name: 'Bamboo', lines: ['Bamboo. Some kinds can grow almost a meter in a single day.', 'It clacks softly in the wind.'] },
  banana_plant: { name: 'Banana plant', lines: ['A banana plant. Technically, it’s a giant herb, not a tree.', 'No bananas yet. Soon.'] },
  monstera: { name: 'Monstera', lines: ['A big monstera with holey leaves.'] },
  cactus: { name: 'Cactus', lines: ['A cactus. Don’t hug it.', 'Spiky, but it seems friendly enough.'] },
  agave: { name: 'Agave', lines: ['An agave. Its leaves are spiky at the tips.', 'Some agave plants only bloom once, after decades.'] },
  lavender: { name: 'Lavender', lines: ['Lavender. It smells so calming.', ...FLOWERS.slice(2)] },
  roses: { name: 'Roses', lines: ['Roses. Watch out for the thorns.', ...FLOWERS.slice(1)] },
  hydrangea: { name: 'Hydrangea', lines: ['Hydrangeas. The soil changes their color: blue in some, pink in others.', ...FLOWERS.slice(1)] },
  hibiscus: { name: 'Hibiscus', lines: ['A hibiscus. Big bright flowers.', ...FLOWERS.slice(1)] },
  sunflowers: { name: 'Sunflowers', lines: ['Sunflowers. Young ones turn to follow the sun across the sky.', 'They’re taller than you.'] },
  flower_bed: { name: 'Flower bed', lines: FLOWERS },
  pot_plant: { name: 'Potted plant', lines: ['A potted plant. Somebody waters this.'] },
  planter: { name: 'Planter', lines: ['A planter full of herbs. You smell basil.'] },
  pumpkins: { name: 'Pumpkins', lines: ['A patch of pumpkins. One of them is huge.', 'Pumpkins! Is it fall already?'] },
  hay_bale: { name: 'Hay bale', sit: true, lines: ['A hay bale. Itchy, but you could sit on it.', 'It smells like a farm.'] },
  park_bench: { name: 'Bench', sit: true, lines: ['A park bench. Somebody carved a heart into it.', 'A good bench with a good view.', 'Perfect for sitting and doing nothing.'] },
  barrel: { name: 'Barrel', lines: ['A wooden barrel. It sloshes.', 'It smells like old fish. Let’s not open it.'] },
  crate: { name: 'Crate', lines: ['A wooden crate. It’s nailed shut.', 'It says “FRAGILE” on the side. You back away.'] },
  torch: { name: 'Torch', lines: ['A flickering torch.', 'It crackles and pops.'] },
  lamp_post: { name: 'Lamp post', lines: ['A lamp post. Bugs are partying around the light.', 'It flickers now and then. Spooky.'] },
  garden_lantern: { name: 'Garden lantern', lines: ['A little garden lantern. It glows warm at night.'] },
  fence_h: { name: 'Fence', lines: ['A wooden fence.', 'A fence. It’s doing its job.'] },
  fence_v: { name: 'Fence', lines: ['A wooden fence.', 'A fence. It’s doing its job.'] },
  gate: { name: 'Gate', lines: ['A gate. It creaks just looking at it.'] },
  umbrella: { name: 'Beach umbrella', lines: ['A beach umbrella. Nice and shady.', 'Somebody left their towel here.'] },
  campfire: { name: 'Campfire', lines: ['A campfire. It’s warm and smells like smoke.', 'You could tell ghost stories here.', 'Somebody should make s’mores.'] },
  mailbox: { name: 'Mailbox', lines: ['A mailbox. There’s nothing in it. You checked.', 'The flag is down. No mail today.'] },
  tent: { name: 'Tent', lines: ['A tent. Someone’s camping here.', 'You hear snoring inside. Let them sleep.'] },
  skull_flag: { name: 'Pirate flag', lines: ['A pirate flag. Uh oh.', 'Skull and crossbones. Somebody’s been here.'] },
  wreck_hull: { name: 'Shipwreck', lines: ['The hull of an old shipwreck.', 'Barnacles everywhere. This ship sank a long time ago.', 'What happened to the crew? Better not to think about it.'] },
  sarcophagus: { name: 'Sarcophagus', lines: ['A sarcophagus. Out here? That’s… worrying.', 'The lid is closed. Let’s keep it that way.'] },
  mammoth_skeleton: { name: 'Mammoth skeleton', lines: ['A mammoth skeleton! Look at those tusks.', 'Woolly mammoths were still alive when the pyramids were built.'] },
  dock_post: { name: 'Dock post', lines: ['A dock post, wrapped in old rope.', 'A seagull was sitting here a second ago.'] },
  cottage: { name: 'Cottage', lines: ['A cozy cottage. Smoke drifts from the chimney.'] },
  beach_hut: { name: 'Beach hut', lines: ['A little beach hut. Sandy inside, probably.'] },
  tiki_hut: { name: 'Tiki hut', lines: ['A tiki hut. Very relaxing.'] },
  lighthouse: { name: 'Lighthouse', lines: ['A lighthouse. It guides ships home at night.', 'Its light can be seen from miles away.'] },
  greenhouse: { name: 'Greenhouse', lines: ['A greenhouse. It’s warm and steamy inside.'] },
  gazebo: { name: 'Gazebo', lines: ['A gazebo. A nice place for a picnic.'] },
  windmill: { name: 'Windmill', lines: ['A windmill. Its sails creak around and around.', 'Windmills have been grinding grain for over a thousand years.'] },
  shed: { name: 'Shed', lines: ['A shed. Tools, probably. And spiders, definitely.'] },
  market_stall: { name: 'Market stall', lines: ['A market stall. It smells like fresh bread.'] },
  ice_cream_cart: { name: 'Ice cream cart', lines: ['An ice cream cart. Your favorite flavor is sold out. Of course.', 'It plays a tiny tune.'] },
  fountain: { name: 'Fountain', lines: ['A fountain. People have tossed coins in for luck.', 'The water sparkles.'] },
  well: { name: 'Well', lines: ['An old stone well. You can’t see the bottom.', 'You shout “hello” into it. It shouts back.'] },
  bird_bath: { name: 'Bird bath', lines: ['A bird bath. A sparrow is splashing around in it.', 'The water is full of little leaves.'] },
  birdhouse: { name: 'Birdhouse', lines: ['A birdhouse. You hear tiny chirps inside.'] },
  statue_plinth: { name: 'Statue', lines: ['A statue on a stand. Birds have made it their favorite spot.', 'It’s a statue of someone very important. Nobody remembers who.'] },
  signpost: { name: 'Signpost', lines: ['A signpost. The arrows point every which way.'] },
  telescope: { name: 'Telescope', lines: ['A telescope. You can see a boat way out at sea.', 'You look through it. A seagull looks back.'] },
  wheelbarrow: { name: 'Wheelbarrow', lines: ['A wheelbarrow full of dirt.', 'One wheel, a lot of responsibility.'] },
  water_pump: { name: 'Water pump', lines: ['An old water pump. It squeaks when you touch the handle.'] },
  flag_pole: { name: 'Flag pole', lines: ['A flag flaps in the wind.'] },
};
// cliffs, of every color and side
const cliff = (name) => /cliff|^ledge/.test(name) && { name: 'Cliff', lines: CLIFF };

// ---------- builder pieces (only their group is known) ----------
export const PIECES = {
  plants: { name: 'Plant', lines: ['A leafy plant. It’s thriving.', 'Somebody waters this every morning.'] },
  shelves: { name: 'Furniture', lines: ['Nice furniture. Somebody dusts it.', 'Old wood, well looked after.'] },
  seating: { name: 'Seat', sit: true, lines: ['A comfy-looking seat.', 'Good for a sit.'] },
  tables: { name: 'Table', lines: ['A table. There’s a coffee ring on it.', 'A sturdy table.'] },
  lights: { name: 'Light', lines: ['A warm little light.', 'It glows softly.'] },
  decor: { name: 'Decoration', lines: ['A nice piece. It catches your eye.', 'Somebody chose this very carefully.'] },
};

// What a museum item looks like up close: { name, sit, lines } or null.
export function roomLook(type, displayName) {
  if (ROOM[type]) return ROOM[type];
  if (type?.startsWith('column_')) {
    const n = displayName || 'stone';
    return { name: n, lines: COLUMN_LINES.map((l) => l.replace('{n}', n)) };
  }
  return null;
}

export function islandLook(name) {
  return ISLAND[name] || cliff(name) || null;
}

export function pieceLook(id) {
  return PIECES[String(id).split('/')[0]] || null;
}

// One line for it, never the same one twice in a row.
const last = new Map();
export function lookLine(look) {
  const s = pick(look.lines, last.get(look));
  last.set(look, s);
  return s;
}
