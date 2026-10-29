# People sprites: the big list, and the prompt

The plan for a lot more people in Curation, built the way Pokémon builds its overworld people.
The prompt to paste into a new chat is in section 7.

**Built so far** (Chat 17, see `docs/HANDOFF.md` → People sprites):
- Tier 0 parts are in (`src/people/parts.js`): see section 3; the new ones are listed in the gallery (`art.html` → Characters).
- Tier 1 classes are in (`src/people/classes.js`): A cleaning & grounds (8 classes), B builders & trades (24), D sea & shore (22), 137 placeable variants in the builder's People lists. `art.html` → People shows them all.
- Tier 2 classes are in: E dig, field & expedition (21 classes), G museum jobs (23). 98 classes, 227 variants in all.
- Next: Tier 3 (J visitors and townspeople; H food and market).

Today: 1 body, 8 skin tones, 11 hair colours, 13 hairstyles, 11 hats, 7 facial-hair options, 3 glasses,
10 outfits, 7 accessories, 14 visitor kinds, 6 staff kinds, 19 famous visitors. All drawn in code in
`src/art.js` (`makeCharacter`, `HATS`, `HAIRSTYLES`, `OUTFITS` ...). ✓ below means "already in the game".

**Targets:** 6 builds · 16 skin tones · 60 hairstyles · 28 hair colours · 18 facial-hair options · 45 hats ·
40 outfits · 10 glasses · 25 accessories · 45 held props · 24 poses · 235 people classes (some, like "Medieval", hold 10
people types) plus 10 placeable crews, each class with variants. That is thousands of looks you can place by hand and
millions the generator can roll.

---

## 1. How Pokémon does it (and what we copy)

1. **A class, not a person.** Youngster, Lass, Fisherman, Hiker, Scientist. You know the job from the picture.
2. **Silhouette first.** One loud head shape (hat or hair) plus one signature prop. If the shape alone does not say
   "fisherman" or "janitor" at 20 px tall, redraw it.
3. **Few frames, bold colours.** 4 facings, stand plus two steps, a tight palette per class. Left is the mirror of right.
4. **Variants are cheap.** Same class, new palette, other cut (Cooltrainer M / F), a rank (rookie / veteran), one swapped prop.
5. **Every class has a job pose.** The fisherman casts a line, the janitor mops, the scientist peers at a flask.
6. **Classes stand where they make sense.** Fishermen on docks, hikers on hills, builders by scaffolding.
7. **Named uniques sit on top of the classes.** For us: the famous visitors, plus a few named locals.
8. **Original art only.** Nothing is traced or copied from Nintendo. Class names here are plain job words.

## 2. What every person ships with

- **Size:** one character is 1 tile wide and about 1.5 tiles tall (about 20 × 27 inside a 32 × 32 cell), pixel art on the 32 px grid.
- **Facings and frames (matches the engine today):** down, up, side (left; right is the mirror). Each has stand plus 2 step frames.
  Optional later: a 4-frame walk.
- **Job pose frames:** at least 1 pose per class (list in section 3.9). Poses reuse the body and only redraw arms and the held prop.
- **Layers, not whole sheets:** body → skin → outfit → hair → facial hair → eyes / face marks → glasses → hat → neck / back / waist item →
  held prop → companion. Each layer recolours through the existing palette letters (`s h c p b T U w g X K F`), so colour variants are free.
- **Builds:** kid, teen, standard, broad, tall, elder (stooped). Builds change body rows and scale; all layers fit all builds.
- **Talking portrait:** a 64 × 64 bust built from the same layers, 3 expressions, for named and talkative classes only.
- **Contact sheet:** every class and variant visible on one page (4 facings and poses), so the user can check them on a phone.
- **Placeholder rules still apply:** swappable by name, nothing restyled that already exists (`docs/TODO.md` rule 8).

---

## 3. Customization parts (the layers)

✓ = in the game now. **Bold** = new.

### 3.1 Builds and skin
- **Builds:** ✓standard (kids already scale to 0.85) · **kid · teen · broad · tall · elder (stooped)**
- **Skin tones (16):** ✓8 current · **4 more natural tones, from very pale to very deep**
- **Costume skins (4):** **chalk white (mime, ghost) · stone grey (living statue) · green (zombie, goblin) · blue (frost, spirit)**
- **Tan lines / sunburn nose / rosy cheeks** as overlays: ✓blush · **sunburn · wind-burn**

### 3.2 Hairstyles (60)
- ✓ short · side part · buzz · curly · long · ponytail · bun · pigtails · bob · afro · mohawk · wild · bald
- **Short and men's cuts:** crew cut · flat top · pompadour · slicked back · side-swept fringe · curtains · undercut · fade · mullet · shaggy ·
  spiky · messy · bedhead · receding · comb-over · monk's tonsure · bowl cut · pixie
- **Long and tied:** long wavy · long curly · high ponytail · low ponytail · side ponytail · half-up · top knot · man bun · low bun · chignon · french twist ·
  space buns · pigtail buns · beehive · victory rolls · big curls · long with bangs
- **Braids and textured:** single braid · two braids · crown braid · braided pigtails · cornrows · box braids · twists · dreadlocks · afro puff · twist-out
- **Elder and period:** thinning on top · wispy white · powdered wig · curled wig (judge / 18th century) · Renaissance bob · pageboy
- **Fantasy:** wizard-long · wild bush · fluffy cloud · antenna tuft

### 3.3 Hair colours (28)
- ✓ 11 current · **jet black · dark brown · chestnut · auburn · copper · strawberry blonde · golden blonde · platinum · salt-and-pepper · silver · white · grey temples ·
  pink · blue · green · purple · teal · orange · two-tone tips (ombre) · streak (white or coloured)**

### 3.4 Face
- **Facial hair (18):** ✓ stache · curly stache · goatee · stache + goatee · chin strap · beard · **stubble · soul patch · sideburns · mutton chops ·
  handlebar · walrus · pencil stache · full big beard · long wizard beard · braided beard · fu manchu · white beard**
- **Eyebrows (6):** ✓ unibrow · **thin · thick · bushy white · arched · none**
- **Eyes / expression (8):** ✓ dots · **sleepy · wide · happy-closed · wink · tired bags · stern · squint**
- **Face marks (10):** ✓ freckles · blush · earrings · **beauty mark · scar · eye patch · bandage · face paint · surgical mask · neck tattoo**
- **Glasses (10):** ✓ round · shades · **square · cat-eye · half-moon reading · monocle · aviators · lab goggles · safety goggles · 3D glasses**

### 3.5 Hats and head coverings (45)
- ✓ hard hat · baseball cap · top hat · beret · beanie · straw · sun hat · flower crown · laurel · bicorne
- **Work:** hi-vis hard hat · miner's lamp helmet · welding mask (flip-up) · hairnet · chef's toque · paper hat · nurse cap · hard hat with ear defenders · visor
- **Sea and field:** sailor's cap (dixie) · captain's peaked cap · fisherman's bucket hat (with lures) · sou'wester (rain hat) · pith helmet · safari hat · panama · fedora ·
  trilby · cowboy hat · bandana · pirate bandana · pirate bicorne · tricorn
- **Street and weather:** bucket hat · flat cap (newsboy) · ear muffs · fur hat · balaclava · hood up · headband · headphones · knit cap with pom-pom
- **Dress and cultural (plain and respectful, no symbols or props):** turban · hijab · kippah · head wrap · mob cap · bonnet · graduation cap · tiara · crown
- **Fantasy and holiday:** wizard hat · witch hat · knight's helm · santa hat · bunny ears · party hat · pumpkin head · ghost sheet

### 3.6 Outfits (40)
- ✓ suit and tie · waistcoat · sweater · t-shirt · hoodie · long coat · apron · dress · gown · toga
- **Work:** coveralls · overalls / dungarees · hi-vis vest · tool belt over tee · lab coat · scrubs · chef whites · waiter's vest and apron · mail / delivery uniform ·
  guard uniform · police uniform · leather smith's apron · painter's whites · fisherman's oilskins · waders · wetsuit · sailor uniform · captain's coat · safari vest ·
  ranger uniform
- **Everyday:** blazer · polo · button-up · cardigan · turtleneck · sundress · skirt and blouse · track suit · varsity jacket · denim jacket · leather jacket ·
  puffer jacket / parka · raincoat / slicker · poncho · trench coat · swimsuit / trunks · bathrobe · pyjamas (for the sleeper)
- **Period and world (each needs a real museum reference):** chiton · tunic · doublet and hose · ruff collar · frock coat · tailcoat · Victorian bustle gown ·
  flapper dress · kimono · sari · kilt · hanfu-style robe · judge's robe · monk's robe · tuxedo · ball gown

### 3.7 Legs and feet
- **Bottoms:** ✓ trousers · **shorts · long skirt · short skirt · pleated skirt · cargo · jeans · khakis · leggings · kilt · waders · knee breeches**
- **Shoes:** ✓ boots (one colour) · **work boots · yellow rain boots · hiking boots · sneakers · dress shoes · sandals · flip-flops · bare feet · heels · slippers**

### 3.8 Worn accessories (25) and held props (45)
- **Worn:** ✓ scarf · bow tie · necklace · badge · shoulder bag · camera · **backpack · fanny pack · tool belt · key ring · lanyard / name tag · press badge ·
  sash · cape · apron strings · headset · radio on shoulder · stethoscope · binoculars round the neck · whistle · pocket watch · watch chain · gloves · armband · medals**
- **Held, cleaning:** broom · mop and bucket · feather duster · squeegee · trash bag · spray bottle · wet-floor sign · cleaning cart
- **Held, building:** hammer · wrench · shovel · pickaxe · jackhammer · wheelbarrow · plank · ladder · paint roller · bucket · traffic cone · stop / slow sign ·
  blueprint · hard-hat lamp
- **Held, sea and field:** fishing rod · net · tackle box · bucket of fish · lobster trap · telescope · lantern · map · trowel · field brush · sieve · metal detector ·
  rope · umbrella · parasol · walking stick · hiking poles
- **Held, town:** clipboard · tablet · briefcase · suitcase · shopping bag · tray · coffee cup · ice-cream cone · balloon · kite · skateboard · scooter · stroller · boombox ·
  newspaper · book stack · scroll · quill · sketchbook · easel and canvas · palette and brush · microphone · gavel · camera on tripod
- **Instruments:** violin · guitar · cello · trumpet · saxophone · flute · accordion · harp · drum
- **Companions (follow the person):** ✓ pet · **dog on a leash · parrot on shoulder · cat on shoulder · seagull following the fisherman · duckling trail · crab in a bucket**

### 3.9 Poses (24)
✓ stand · walk · sit · on the phone, plus **sweep · mop · dust · hammer · dig / kneel · fish cast · fish wait (sitting on a bucket) · reel in · read · paint at easel · sketch ·
take a photo · point · wave · cheer · sleep (zzz) · eat · drink · check watch · carry a box · push a cart · climb a ladder · sit on a dock edge · row**

---

## 4. The people (classes)

Each line: **class** — signature look. **V:** variants. **P:** pose. Tags: **M** museum · **I** islands · **X** expedition · **S** hireable staff · **F** story / famous.
Work them in the order of section 5.
Base variants for every class on top of the listed ones: 3 palettes · 2 cuts · 2 builds · rookie / veteran.

### A. Cleaning and grounds (the janitors)
- **Janitor** ✓ (upgrade) — slate coveralls, cap, key ring. V: mop and bucket · push broom · trash bag · cleaning cart · floor buffer · feather duster for high shelves · night shift (flashlight) · head janitor (clipboard, radio). P: mop, sweep, dust. [M][S]
- **Window cleaner** — squeegee, bucket, ladder on shoulder. V: ladder · rope harness for tall island buildings. P: wipe. [M][I]
- **Floor polisher** — ear muffs, pushes a buffer. [M]
- **Spill patrol** — yellow wet-floor sign, mop. P: set down sign. [M]
- **Fountain cleaner** — waders, net on a pole. [M]
- **Groundskeeper** — straw hat, shears. V: rake · hedge shears · mower · snow shoveller (winter) · leaf sweeper (autumn) · wheelbarrow. P: rake. [I]
- **Gardener** — apron, trowel, kneeling at plants. V: watering can · rose pruner · greenhouse keeper. P: kneel. [M][I]
- **Bin collector** — hi-vis, bin on a lift. [I]

### B. Construction and trades (the carpenters)
- **Construction worker** — hard hat, hi-vis vest, tool belt. V: laborer with shovel · plank carrier · wheelbarrow pusher · bucket carrier · apprentice. P: hammer, dig. [I][S]
- **Foreman** — white hard hat, blueprint, whistle. P: point. [I]
- **Jackhammer operator** — ear defenders, goggles. [I]
- **Bricklayer** — trowel and bricks. [I]
- **Welder** — flip-up mask, leather apron. [I]
- **Road flagger** — stop / slow sign, traffic cone. [I]
- **Painter-decorator** — white overalls, roller, paint-spattered. P: roll paint. [M][S]
- **Plasterer** — hawk and trowel. [M]
- **Roofer** — harness, shingles. [I]
- **Surveyor** — tripod and measuring pole. [I]
- **Machine operator** — digger / crane driver, big gloves. [I]
- **Carpenter** ✓ (upgrade) — safety-orange tee, yellow hard hat. V: sawing · hammering · carrying plank · joiner · apprentice. [M][S]
- **Electrician** — cable spool, tester, rubber gloves. [M][S]
- **Plumber** — wrench, plunger, overalls. [M][S]
- **Glazier** — carries a pane of glass (glass-wall rooms). [M]
- **Stonemason** — mallet, chisel, dust-covered. [M][I]
- **Tiler and floor layer** — knee pads, tile trowel. [M]
- **Locksmith** — key ring, tool roll. [M]
- **Mover** — dolly and crates (new paintings arriving). [M]
- **Delivery driver** — cap, box, hand truck. [M][I]
- **Warehouse worker** — forklift, vest. [I]
- **Mechanic** — coveralls, wrench, rag in pocket. [I]
- **Handyman** — tool belt, ladder, does everything. [M]
- **Arborist** — harness, pruning saw. [I]

### C. Artisans and makers
- **Blacksmith** — leather apron, hammer and tongs. [I]
- **Potter** — clay-smudged apron, pot. [M][I]
- **Glassblower** — rod, heat goggles. [M][I]
- **Stained-glass maker** — lead came, cutter. [M]
- **Sculptor** — chisel, marble dust. V: stone · wood · clay. [M][I]
- **Woodcarver** — whittling knife. [I]
- **Weaver** — shuttle, bundle of yarn. [I]
- **Tailor** — tape measure round the neck, pins. [I]
- **Cobbler** — apron, last, mallet. [I]
- **Bookbinder** — apron, press. [M]
- **Printer** — ink-stained apron, type tray. [M]
- **Picture framer** — moulding sample, tiny saw. [M][S]
- **Gilder** — gold leaf, tiny brush. [M]
- **Mosaic maker** — tesserae tray. [M]
- **Chandler** — candles, apron. [I]

### D. Sea, shore and water
- **Fisherman** — the headline class. V: old salt (yellow slicker, pipe) · surf-caster (waders, long rod) · fly-fisher (vest, net, hat with flies) · dock angler (sits on a bucket) ·
  kid with a bamboo pole · ice fisher (parka, auger — Frozen North) · rower-angler · net caster · crab trapper · pier angler with a cooler. P: fish cast, fish wait, reel in. [I][X]
- **Lobsterman** — orange oilskins, lobster trap. [I]
- **Fishmonger** — apron, fish on a tray. [I]
- **Sailor** — white sailor uniform, dixie cap, striped shirt. V: deckhand · bosun · navigator with sextant · cabin boy. [I]
- **Ship captain** — peaked cap or bicorne, long coat, telescope. [I][F]
- **Boatman** — the one who sails you (rowing pose). [I]
- **Dockworker** — cargo hook, crates. [I]
- **Harbour master** — clipboard, whistle, peaked cap. [I]
- **Lighthouse keeper** — wool sweater, lantern. [I][F]
- **Lifeguard** — red trunks, whistle, float. [I]
- **Swimmer** — swim cap, goggles, towel. [I]
- **Surfer** — board under the arm. [I]
- **Diver** — mask, tank, flippers. [I][X]
- **Marine biologist** — wetsuit top, clipboard, sample jar. [I][X]
- **Beachcomber** — bucket, metal detector, bare feet. [I]
- **Sunbather** — towel, shades, sun hat. [I]
- **Paddler** — kayak paddle, life vest. [I]
- **Pirate crew** — bandana, striped shirt, cutlass. V: eye patch · peg leg · hook hand · lookout with telescope · cook. [X]
- **Pirate captain** — bicorne, long coat, parrot. [X][F]
- **Ghost pirate** — translucent blue, tattered coat (Skull Isle). [X]
- **Smuggler** — hood, lantern, sack. [X]
- **Castaway** — tattered clothes, long beard, message in a bottle. [X]

### E. Dig, field and expedition
- **Archaeologist** — pith helmet or fedora, khaki vest, trowel and brush. P: dig / kneel. [I][X][F]
- **Paleontologist** — sun hat, rock hammer, plaster jacket. [I][X]
- **Geologist** — hard hat, rock hammer, hand lens. [I][X]
- **Field assistant** — sieve, bucket. [I][X]
- **Metal detectorist** — headphones, detector. [I]
- **Explorer** — backpack, rope, lantern, map. [I][X][F]
- **Mountaineer** — rope, ice axe, parka. [X]
- **Hiker** — backpack, walking stick, shorts. [I]
- **Camper** — flannel, tent poles. [I]
- **Park ranger** — campaign hat, uniform. [I]
- **Cave explorer** — helmet with lamp, rope. [X]
- **Treasure hunter** — shovel, torn map. [X]
- **Jungle guide** — machete, wide hat (Lost Temple). [X]
- **Desert guide** — head wrap, loose layers, water skin (Sandstone Tomb). [X]
- **Arctic trapper** — fur hat, sled rope (Frozen North). [X]
- **Sled-dog handler** — parka, harness, dog team. [X]
- **Prospector** — pan, pickaxe (Red Badlands). [X]
- **Tomb robber** — hood, sack, lantern (villain). [X]
- **Tomb guardian** — mummy wrappings. [X]
- **Rival explorer** — flashier gear; can be a named unique. [X][F]
- **Temple keeper** — plain robe, broom, lantern. [X]

### F. Science and medicine
- **Scientist** — lab coat, goggles, clipboard. [M][I][X]
- **Chemist** — flask, safety goggles. [M]
- **Astronomer** — telescope, notebook, night coat. [I][M]
- **Botanist** — sun hat, magnifier, pressed flowers. [I]
- **Entomologist** — butterfly net, jar. [I]
- **Ornithologist** — binoculars, field notebook. [I]
- **Zoologist / animal keeper** — vest, bucket, treats. [I]
- **Aquarium keeper** — waders, net, fish bucket. [M][S]
- **Meteorologist** — weather balloon, clipboard. [I]
- **Inventor** — goggles, wild hair, gears (inventions collection). [M][F]
- **Engineer** — hard hat, blueprint, slide rule. [M][I]
- **Mathematician** — chalk dust, long scribbled scroll. [M]
- **Doctor** — white coat, stethoscope. [I]
- **Nurse** — scrubs, cap. [M][S]
- **Paramedic** — bag, radio. [I]
- **Vet** — scrubs, carries a pet. [I]
- **Lab technician / preparator** — mask, brush, goggles (fossil prep). [M][S]

### G. Museum professions
- **Curator** — blazer, glasses, clipboard. V: head curator · assistant · collections manager (white gloves, tablet). [M][F]
- **Conservator** — lab coat, loupe headband, tiny brush (Restoration Studio). [M][S]
- **Art handler** — gloves, hoodie, crate on a dolly. [M]
- **Registrar** — clipboard, glasses. [M]
- **Archivist** — cart of boxes, cotton gloves. [M]
- **Librarian** — cardigan, stack of books, shushing finger. [M]
- **Docent** — older volunteer, cardigan, name badge. [M]
- **Museum educator** — apron, kids' workshop kit. [M]
- **Tour guide** ✓ (upgrade) — red blazer. V: school-tour guide with flag · audio-guide host (headset) · kids' guide in costume · multi-language guide with umbrella. [M][S]
- **Ticket attendant** — desk, name tag. [M]
- **Caretaker** ✓ (upgrade) — waistcoat, glasses. [M]
- **Security guard** ✓ (upgrade) — dark suit, shades, earpiece. V: day guard · night guard (flashlight) · desk guard · supervisor in cap · bike patrol. [M][S]
- **K-9 handler** — guard with a dog. [M]
- **Gift-shop clerk** — apron, scanner. [M][S]
- **Coat-check attendant** — tickets, hangers. [M]
- **Event host** — bow tie, microphone. [M]
- **Museum photographer** — tripod, flash. [M]
- **Appraiser** — loupe, white gloves. [M][F]
- **Auctioneer** — gavel, podium. [M][F]
- **Art dealer** — sharp coat, cane, folder. [M][F]
- **Art critic** — stern, notebook, monocle. [M][F]
- **Collector** — fine coat, gloves, pocket watch. [M][F]
- **Donor** — evening wear, sash, big cheque. [M][F]
- **Receptionist and office clerk** — headset, papers (Office room). [M][S]
- **Tech support** — laptop, lanyard (cameras and security). [M][S]

### H. Food and market
- **Barista** ✓ (upgrade) — green apron. V: latte artist · espresso cart · island coffee cart. [M][I][S]
- **Baker** — flour-dusted apron, tray of loaves. [M][I]
- **Chef** — chef whites, toque. [M][S]
- **Waiter** — vest, tray. [M][S]
- **Dishwasher** — rubber gloves, stack of plates. [M]
- **Street vendor** — hot dog / pretzel cart. [I]
- **Ice-cream seller** — striped hat, cone. [I]
- **Flower seller** — basket. [I]
- **Fruit-stall keeper** — apron, crate. [I]
- **Food-truck cook** — bandana, ladle. [I]
- **Candy seller** — jars, striped shirt. [I]
- **Shopkeeper** — behind a counter, faces down only. [I]
- **Innkeeper** — apron, keys, mug. [I]

### I. Arts, music and performance
- **Painter** — beret, smock, easel. P: paint at easel. [M][I][F]
- **Sketch artist** — sits with a pad. P: sketch. [M][I]
- **Street chalk artist** — kneeling, chalk. [I]
- **Musician** — V: violinist · guitarist · cellist · pianist (seated) · saxophonist · drummer · trumpeter · flautist · accordionist · harpist. [M][I]
- **Conductor** — tailcoat, baton. [M]
- **Opera singer** — gown or tuxedo, arms wide. [M]
- **Busker** — hat on the ground, one instrument. [I]
- **Dancer** — V: ballet · tango pair · breakdancer · folk dancer. [M][I]
- **Mime** — chalk skin, striped top, invisible box. [I]
- **Juggler** — balls or pins. [I]
- **Magician** — top hat, cape, rabbit. [M][I]
- **Clown** — big shoes, balloon animals. [I]
- **Living statue** — stone-grey or bronze paint, holds still, moves when you step close. [M][I]
- **Actor** — period costume with ruff. [M][F]
- **Poet** — beret, notebook, scarf. [M][F]
- **Writer** — typewriter, coffee, scarf. [M][F]
- **Film crew** — V: director · camera operator · clapper · boom mic. [M][I]
- **Fashion model and stylist** — pose, tape measure. [M]
- **DJ** — headphones, laptop. [I]

### J. Visitors and townspeople
The 14 visitor kinds below keep their name and personality and gain many more variants.
✓ Casual · ✓ Grump · ✓ Kid · ✓ Nerd · ✓ Snob · ✓ Tourist · ✓ Fanboy · ✓ Artist · ✓ Influencer · ✓ Couple · ✓ Historian · ✓ Student · ✓ Elder · ✓ Teacher.
- **Toddler** — holds a hand. [M][I]
- **Kid with a prop** — V: balloon · scooter · school backpack · teddy · ice cream · kite. [M][I]
- **Class-trip kids** — matching vests, hold a rope. [M]
- **Teen skater** — board, hoodie. [I]
- **Teen with headphones** — oversized hoodie. [M][I]
- **Teen goth** — all black, chains. [M]
- **Jock** — varsity jacket. [M]
- **Preppy** — pastel sweater over shoulders. [M]
- **Parent with a stroller** — [M][I]
- **Parent with a kid on the shoulders** — [M][I]
- **Grandparent** — V: cane · knitting · shopping bag. [M][I]
- **Retired couple** — matching windbreakers. [M]
- **Newlyweds** — wedding dress and tux (photo at the museum). [M][I]
- **Business traveller** — suitcase, suit. [M]
- **Commuter** — coffee, phone. [I]
- **Office worker** — lunch bag. [I]
- **Lawyer** — briefcase. [I]
- **Mayor** — sash. [I][F]
- **Postal carrier** — bag, cap. [I]
- **Taxi / bus driver** — cap, vest. [I]
- **Cyclist** — helmet, bike. [I]
- **Jogger** — headband, track suit. [I]
- **Yoga person** — mat. [I]
- **Dog walker** — three dogs on leashes. [I]
- **Shopper** — arms full of bags. [I]
- **Reader** — sits with a book. [M][I]
- **Chess player** — sits with a board. [I]
- **Knitter** — sits with wool. [I]
- **Sleeper** — nap on a bench, zzz. [M][I]
- **Backpacker** — huge pack, sandals. [I]
- **Cruise tourist** — visor, flowered shirt. [I]
- **Selfie tourist** — selfie stick. [M][I]
- **Reporter** — notebook, press badge. [M][F]
- **TV reporter and cameraperson** — mic, camera on shoulder. [M][I]
- **Streamer** — ring light, headset, phone on a stick. [M][I]
- **Detective** — trench coat, hat, magnifier (Thieves' Rock). [M][X][F]
- **Police officer** — cap, notepad. [M][I]
- **Inspector** — hard hat or fire-marshal cap, clipboard. [M]
- **Lost child** — name tag on a string. [M]
- **Thief** — dark hoodie, mask, bag (the heist arc). [M][X]
- **Royal visitor** — crown, cape, small crowd. [M][F]

### K. Through history (period people)
- **Ancient Egypt** — pharaoh · priest · scribe · laborer · embalmer. [M][X][F]
- **Ancient Greece** — philosopher · athlete · hoplite · olive-wreath winner. [M][F]
- **Ancient Rome** — senator · legionary · gladiator · baker. [M][F]
- **Medieval** — knight · squire · monk · peasant · minstrel · lady · king · queen · jester · blacksmith. [M][X][F]
- **Renaissance** — merchant · page · artist · noble. [M][F]
- **Dutch Golden Age** — burgher with a white collar · maid with a lace cap. [M][F]
- **Colonial town** — tricorn patriot · town crier with a bell · printer · housewife. [M][I]
- **Victorian** — gentleman · lady in a bustle gown · chimney sweep · newsboy · constable. [M][I]
- **1920s** — flapper · dapper gent. [M][I]
- **Decades** — 1950s diner · 1960s mod and hippie · 1970s disco · 1980s arcade kid · 1990s grunge. [M][I]
- **East Asia** — scholar-official · painter-monk · court lady · Edo-era townsperson. [M][F]
- **South Asia** — merchant · court figure. [M][F]
- **Mesoamerica** — astronomer-priest · ballplayer. [M][X][F]
- **Norse** — sailor · shield-maiden. [M][X]
- Cultural dress needs a real museum reference per outfit and goes through `docs/CONTENT-STYLE.md` (sensitive subjects). No stereotypes, no costume props.

### L. Fantasy, myth and seasonal
- **Wizard** — [M][I][F]
- **Witch** — ✓ costume exists for kids, add the full class. [M][I]
- **Fairy** — [I]
- **Knight-errant** — [M][I]
- **Ghost** — [M][I]
- **Skeleton** — [M][I]
- **Mummy** — [M][X]
- **Vampire** — [M]
- **Zombie** — [M]
- **Greek gods and monsters** (Athena, Zeus, Hermes, Medusa, Minotaur) — "statue comes alive" semi-mythological famous visitors. [M][F]
- **Genie** — [I]
- **Santa and elf** — [M][I]
- **Cupid** — [M]
- **Easter bunny** — [M]
- **Fireworks kid** — [I]
- **Museum mascot** — big costume character that hugs kids. [M]

### M. Crews (placeable groups in the builder, 3 to 5 people)
- **Dock crew:** fisherman · dockworker · boatman · harbour master (+ gulls)
- **Building site:** foreman · construction worker ×2 · flagger · machine operator
- **Museum staff room:** janitor · guard · curator · conservator
- **Dig camp:** archaeologist · field assistants ×2 · geologist
- **Market square:** vendor · baker · flower seller · shopper · busker
- **School trip:** teacher · class-trip kids ×4
- **Film set:** director · camera operator · actor · boom mic
- **Pirate cove:** captain · crew ×3 · parrot
- **Frozen camp:** ice fisher · arctic trapper · researcher · sled dogs
- **Beach day:** lifeguard · swimmer · sunbather · surfer · beachcomber

---

## 5. Build order

- **Tier 0 (everything depends on it): the parts in section 3**, builds first, then hats, hair, outfits, held props, poses.
- **Tier 1 (asked for by name):** A janitors and grounds · B construction and trades · D fishermen, sailors and shore.
- **Tier 2 (hooks into systems that exist):** E dig, field and expedition (the seven islands) · G museum professions (staff board, Office, Restoration Studio).
- **Tier 3 (fills the world):** J visitors and townspeople · H food and market.
- **Tier 4:** I arts and performance · F science and medicine · C artisans.
- **Tier 5:** K history · L fantasy and seasonal · M crews.

## 6. Defaults taken (no questions asked, change any you disagree with)

1. Extend the **code-drawn** parts system in `src/art.js` (same look as the existing people). Free packs are only for ideas, per HANDOFF. AI-generated art only with the user's OK.
2. Left is the mirror of right except for classes with an asymmetric prop (fishing rod), which get a real right-facing frame.
3. Class names are plain job words. Nothing from Nintendo, no Pokémon names, sprites or palettes.
4. Cultural and period dress waits for a real museum reference per outfit.
5. Each new class borrows the nearest existing personality for chatter and emotes until it gets its own lines.

---

## 7. The prompt (paste into a new chat)

```
Read CLAUDE.md, docs/VISION.md, docs/HANDOFF.md, docs/TODO.md and docs/PEOPLE-SPRITES.md. You are the PEOPLE SPRITES chat. Claim it on the board with a one-line PR and merge it, then work through docs/PEOPLE-SPRITES.md in the order of section 5. Don't ask me questions: park them under "Needs Sean" in docs/TODO.md and keep going.

Goal: many more people, the way Pokémon does overworld people. A class is a job you can read from its silhouette plus one signature prop (a janitor with a mop, a construction worker in a hard hat and hi-vis, a fisherman casting a line), with cheap variants (palette, cut, build, rank, swapped prop). Original art only; nothing from Nintendo, no Pokémon names, sprites or palettes.

Build in this order:
1. Parts (section 3): builds (kid, teen, standard, broad, tall, elder), skin and hair colours, hairstyles, facial hair, eyebrows, eyes, face marks, glasses, hats, outfits, legs and shoes, worn accessories, held props, companions, poses. Add each as an entry in the existing maps in src/art.js (HATS, HAIRSTYLES, OUTFITS, FACIAL, GLASSES, ACCESSORIES) so it shows up in the character creator and library.js with no extra work. Recolour only through the existing palette letters (s h c p b T U w g X K F).
2. Classes (section 4), in tier order: A janitors and grounds, B construction and trades, D fishermen, sailors and shore first; then E, G; then J, H; then I, F, C; then K, L, M. A class is data (build, colours, look, prop, pose, where it stands, which existing personality it borrows for chatter and emotes), not new code per class. Give each class every variant listed, plus the base variants (3 palettes, 2 cuts, 2 builds, rookie / veteran).
3. Wire them in: every class and crew is a placeable piece in the builder's People list (stays put / wanders a little / wanders a lot), grouped by section A to M; islands and museum rooms spawn them where the [M][I][X][S] tags say; staff classes plug into the staff board and break room; expedition classes into the seven expedition islands.
4. A people gallery page in the style of tiles.html: every class and variant, tap one to see the 4 facings and its poses. This is how I check them on my phone.

Rules: portrait only, 32px grid, a character is about 1 tile wide and 1.5 tiles tall. Match the existing outline and shading in src/art.js; do not restyle anyone already in the game. Read at phone size: test at 390x844 and check that each class is told apart from the others by silhouette alone. Bake textures lazily per look and cache them: the island budgets in HANDOFF (300 people) and tests/bundle.cjs must still pass. Keep everything swappable by name (public/swap/README.md) and listed by tools/list_placeholders.mjs. Cultural and period dress needs a real museum reference per outfit and goes through docs/CONTENT-STYLE.md. Never touch anything outside this lane. Do not add a feature I parked.

Ship small PRs (one tier or one section each), merge each yourself, and reset your branch to main after each. Tick items in docs/PEOPLE-SPRITES.md and docs/TODO.md with the PR number, and add 2 to 4 lines to docs/HANDOFF.md. Test with a 390x844 portrait browser and run npm test (smoke, gaps, people, presets, builder and the rest); add a test that every class bakes and appears in the builder. Don't mention Wakefield and don't touch it. End with the two links:
game https://joudrie.github.io/museum/
builder https://joudrie.github.io/museum/builder.html
```
