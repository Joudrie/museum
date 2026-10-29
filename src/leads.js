// Leads: a letter, a torn map, a pirate's note or a rumour from a famous visitor
// that sends you to an expedition island. Finding a lead unlocks its island in the
// boat menu. Data, not code: add an entry to LEADS and a map in src/maps/exp-*.json.
//
//   curation.leads = { v: 1, found: { [leadId]: foundAt (ms) } }
//
// Other chats hand out leads with grantLead('id') (a famous visitor's rumour, a quest
// reward); finishing an expedition grants its `then` leads on its own.
import { load, save } from './storage.js';

const KEY = 'curation.leads';

// kind: letter | map | note | rumour. island: the expedition it unlocks (src/maps/exp-<island>.json).
// start: true = found at the dock the first time you reach for the boat.
export const LEADS = [
  {
    id: 'bottle-note',
    kind: 'note',
    from: 'A bottle on the dock',
    title: 'A note in a bottle',
    island: 'pirate',
    start: true,
    text: 'To whoever finds this. The Captain buried his chest on Skull Isle, but his men still walk the shore. Take his chart from the camp, mind the patrol, and dig where the X is. A lucky sailor.',
    then: ['clerk-letter', 'anning-rumour'],
  },
  {
    id: 'clerk-letter',
    kind: 'letter',
    from: 'The harbour clerk',
    title: 'A letter from the harbour',
    island: 'wreck',
    text: 'A trading ship went down on the Drowned Reef and the crates are still there. The tide comes in fast, so be quick. Everything in them is soaked, so bring it home and it can be cleaned.',
    then: ['torn-map'],
  },
  {
    id: 'anning-rumour',
    kind: 'rumour',
    from: 'Mary Anning (a visitor)',
    title: 'A fossil hunter’s rumour',
    island: 'badlands',
    text: 'Mary Anning, who found sea dragons in the cliffs of Lyme Regis, says the red cliffs south of here are full of bones. “Look where the rain has just washed the rock,” she says.',
    then: ['tomb-map'],
  },
  {
    id: 'torn-map',
    kind: 'map',
    from: 'Half a map',
    title: 'A torn map',
    island: 'tomb',
    text: 'One half of a map, torn along a fold. It shows a desert, a doorway cut into the rock and the words “step softly, stones remember”.',
    then: ['temple-letter'],
  },
  {
    id: 'tomb-map',
    kind: 'map',
    from: 'Half a map',
    title: 'A second torn map',
    island: 'tomb',
    text: 'The other half of a torn map: a desert, a doorway cut into the rock and the words “step softly, stones remember”.',
    then: ['temple-letter'],
  },
  {
    id: 'temple-letter',
    kind: 'letter',
    from: 'A travelling scholar',
    title: 'A scholar’s letter',
    island: 'temple',
    text: 'There is a temple lost in the jungle. Its doors open when the sun plates are pressed in the right order. The carvings over the door show the sun rising, the sun high, then the sun setting.',
    then: ['hideout-note', 'north-rumour'],
  },
  {
    id: 'hideout-note',
    kind: 'note',
    from: 'An unsigned note',
    title: 'An unsigned note',
    island: 'heist',
    text: 'The thieves who emptied the old gallery hide on a rocky isle. Guards walk in loops and the long grass hides you from them. The vault is at the back.',
    then: [],
  },
  {
    id: 'north-rumour',
    kind: 'rumour',
    from: 'A fur trader',
    title: 'A trader’s rumour',
    island: 'north',
    text: 'Far north, a cave under the ice holds the bones of a great hairy elephant. The wind there turns to a blizzard without warning, so go in short trips.',
    then: [],
  },
];

const byId = Object.fromEntries(LEADS.map((l) => [l.id, l]));
export const lead = (id) => byId[id] || null;

const read = () => {
  const raw = load(KEY, null);
  const found = raw && typeof raw === 'object' && raw.found && typeof raw.found === 'object' ? raw.found : {};
  const clean = {};
  Object.entries(found).forEach(([id, t]) => byId[id] && Number.isFinite(t) && (clean[id] = t));
  return clean;
};

export const hasLead = (id) => !!read()[id];

/** Leads in the order they were found. */
export const foundLeads = () =>
  Object.entries(read())
    .sort((a, b) => a[1] - b[1])
    .map(([id]) => byId[id]);

/** Does any lead you hold point at this expedition? */
export const islandUnlocked = (island) => foundLeads().some((l) => l.island === island);

/** Gives you a lead. Returns the lead if it is new, otherwise null. */
export function grantLead(id, at = Date.now()) {
  if (!byId[id]) return null;
  const found = read();
  if (found[id]) return null;
  found[id] = at;
  save(KEY, { v: 1, found });
  return byId[id];
}

/** The first lead turns up at the dock. Returns it the first time only. */
export const grantStartLeads = () => LEADS.filter((l) => l.start).map((l) => grantLead(l.id)).filter(Boolean);

// ---------- the letters sheet ----------
let el = null;
function build() {
  el = document.createElement('div');
  el.id = 'leads';
  el.className = 'overlay hidden';
  el.innerHTML = `<div class="decor-sheet sheet"><h2 class="ask-title">Letters &amp; leads</h2><div class="leads-list"></div><button class="pixel-btn leads-close">Close</button></div>`;
  document.body.appendChild(el);
  el.querySelector('.leads-close').onclick = () => close();
  el.addEventListener('click', (e) => e.target === el && close());
}
let onClose = null;
const close = () => {
  el.classList.add('hidden');
  const cb = onClose;
  onClose = null;
  cb?.();
};

const KIND = { letter: 'Letter', map: 'Torn map', note: 'Note', rumour: 'Rumour' };

/**
 * Opens the letters. onSail(island) is called when you pick "Set sail" on one;
 * titles maps an island id to its name.
 */
export function openLeads({ onSail, onClose: done, titles = {} } = {}) {
  if (!el) build();
  onClose = done || null;
  const list = el.querySelector('.leads-list');
  list.replaceChildren();
  const mine = foundLeads();
  if (!mine.length) {
    const p = document.createElement('p');
    p.className = 'ask-text';
    p.textContent = 'No leads yet. Keep your eyes open: letters, maps and rumours turn up.';
    list.appendChild(p);
  }
  mine.forEach((l) => {
    const d = document.createElement('div');
    d.className = 'lead-card';
    d.innerHTML = '<small class="lead-kind"></small><b class="lead-title"></b><i class="lead-from"></i><p class="lead-text"></p>';
    d.querySelector('.lead-kind').textContent = KIND[l.kind] || 'Lead';
    d.querySelector('.lead-title').textContent = l.title;
    d.querySelector('.lead-from').textContent = l.from;
    d.querySelector('.lead-text').textContent = l.text;
    if (onSail) {
      const b = document.createElement('button');
      b.className = 'pixel-btn lead-sail';
      b.textContent = `Set sail for ${titles[l.island] || 'the island'}`;
      b.onclick = () => {
        close();
        onSail(l.island);
      };
      d.appendChild(b);
    }
    list.appendChild(d);
  });
  el.classList.remove('hidden');
}

export const leadsOpen = () => !!el && !el.classList.contains('hidden');
