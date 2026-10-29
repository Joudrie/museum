// Share and visit, with no server. A museum becomes a link (a "postcard":
// rooms, paintings and decor, nothing personal), a card image, or a tour strip.
// A friend opens the link to look around it. Friends' builder islands arrive by
// link or file and show up in the boat's list. Codes live in src/sharecode.js.
import { load, save } from './storage.js';
import { loadRooms, roomName, paintingsFor } from './rooms.js';
import { loadItems, ITEMS } from './items.js';
import { museumRating, starsFor, starText } from './rating.js';
import { museumVisitors } from './wallet.js';
import { PAINTINGS } from './paintings.js';
import { toCode, fromCode, cleanVisit, cleanIsland } from './sharecode.js';
import { openViewer } from './viewer.js';

const FRIENDS = 'curation.friends'; // { museums: [{ id, saved, visit }], islands: [map] }
const NAME_KEY = 'curation.share.name';
const MAX_FRIENDS = 30;

const friends = () => {
  const f = load(FRIENDS, {});
  return { museums: Array.isArray(f.museums) ? f.museums : [], islands: Array.isArray(f.islands) ? f.islands : [] };
};

// Islands friends have shared with you; the boat lists them (see sailmenu.js).
export const friendIslands = () => friends().islands;

// ---- what we share ------------------------------------------------------------
export function snapshot(name) {
  const rooms = loadRooms();
  const r = [];
  rooms.forEach((room, i) => {
    if (room.locked) return;
    const p = paintingsFor(rooms, i).map((x) => x.id);
    const d = {};
    loadItems(i).forEach((it) => (d[it.type] = (d[it.type] || 0) + 1));
    if (p.length || Object.keys(d).length || i === 0) r.push({ n: roomName(room, i), p, d });
  });
  return { v: 1, n: String(name || '').slice(0, 30), s: Math.round(museumRating(rooms)), r };
}

const paintingById = new Map(PAINTINGS.map((p) => [p.id, p]));
export const decorName = (type) => ITEMS[type]?.name || type;

export async function visitLink(name) {
  const code = await toCode(snapshot(name));
  return `${location.origin}${location.pathname.replace(/[^/]*$/, '')}index.html?visit=${code}`;
}

// ---- images: the rate card and the tour strip -----------------------------------
function loadImg(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const t = setTimeout(() => resolve(null), 6000);
    img.onload = () => (clearTimeout(t), resolve(img));
    img.onerror = () => (clearTimeout(t), resolve(null));
    img.src = src;
  });
}

function frameArt(ctx, p, img, x, y, w, h) {
  ctx.fillStyle = '#5b4216';
  ctx.fillRect(x - 4, y - 4, w + 8, h + 8);
  ctx.fillStyle = (p && p.placeholder) || '#3a2a1d';
  ctx.fillRect(x, y, w, h);
  if (img) {
    // fit inside the frame, keeping the painting's own shape
    const k = Math.min(w / img.width, h / img.height);
    ctx.drawImage(img, x + (w - img.width * k) / 2, y + (h - img.height * k) / 2, img.width * k, img.height * k);
  }
}

const GOLD = '#e8c867';
function backdrop(ctx, W, H) {
  ctx.fillStyle = '#1d1714';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#c9a23f';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, W - 36, H - 36);
}
const text = (ctx, s, x, y, size, color = '#f4ead6', align = 'center', weight = 'bold') => {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.font = `${weight} ${size}px Georgia, serif`;
  ctx.fillText(s, x, y);
};

export async function drawCard(kind, snap) {
  const rooms = loadRooms();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const name = snap.n || 'My museum';
  const stars = starsFor(snap.s);
  const all = [...new Set(snap.r.flatMap((r) => r.p))].map((id) => paintingById.get(id)).filter(Boolean);
  if (kind === 'card') {
    const W = 720;
    const H = 1000;
    canvas.width = W;
    canvas.height = H;
    backdrop(ctx, W, H);
    text(ctx, name, W / 2, 110, 46);
    text(ctx, starText(stars), W / 2, 190, 64, GOLD);
    text(ctx, `Rated ${snap.s} out of 100`, W / 2, 240, 28, '#d8c9a8', 'center', 'normal');
    const shown = all.slice(0, 9);
    const imgs = await Promise.all(shown.map((p) => loadImg(p.src)));
    const cell = 190;
    const gap = 30;
    const x0 = (W - (3 * cell + 2 * gap)) / 2;
    shown.forEach((p, i) => frameArt(ctx, p, imgs[i], x0 + (i % 3) * (cell + gap), 290 + Math.floor(i / 3) * (cell + gap), cell, cell));
    if (!shown.length) text(ctx, 'Paintings coming soon', W / 2, 520, 30, '#d8c9a8', 'center', 'normal');
    const decor = snap.r.reduce((n, r) => n + Object.values(r.d).reduce((a, b) => a + b, 0), 0);
    const facts = [`${snap.r.length} room${snap.r.length === 1 ? '' : 's'}`, `${snap.r.reduce((n, r) => n + r.p.length, 0)} paintings`, `${decor} decor`, `${museumVisitors(rooms).toLocaleString()} visitors a month`];
    text(ctx, facts.join('  ·  '), W / 2, 905, 24, '#d8c9a8', 'center', 'normal');
    text(ctx, 'Curation', W / 2, 955, 26, GOLD);
  } else {
    // a strip: one column per room, its paintings stacked
    const cols = snap.r.filter((r) => r.p.length).slice(0, 5);
    const W = Math.max(720, 40 + cols.length * 230);
    const H = 760;
    canvas.width = W;
    canvas.height = H;
    backdrop(ctx, W, H);
    text(ctx, `${name} · ${starText(stars)}`, W / 2, 80, 36);
    for (let c = 0; c < cols.length; c++) {
      const x = 40 + c * 230;
      text(ctx, cols[c].n, x + 100, 135, 22, GOLD);
      const ps = cols[c].p.slice(0, 3).map((id) => paintingById.get(id)).filter(Boolean);
      const imgs = await Promise.all(ps.map((p) => loadImg(p.src)));
      ps.forEach((p, i) => frameArt(ctx, p, imgs[i], x, 160 + i * 190, 200, 170));
    }
    if (!cols.length) text(ctx, 'A new museum, just opening', W / 2, 380, 30, '#d8c9a8', 'center', 'normal');
    text(ctx, 'Curation', W / 2, H - 44, 24, GOLD);
  }
  return new Promise((res) => {
    try {
      canvas.toBlob((b) => res(b), 'image/png');
    } catch {
      res(null); // a painting that wouldn't allow copying taints the picture
    }
  });
}

async function handOut(blob, filename, title) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return 'saved';
}

// ---- storing friends --------------------------------------------------------------
export function addFriendMuseum(visit) {
  const f = friends();
  const id = `${visit.name}|${visit.score}|${visit.rooms.length}`;
  f.museums = [{ id, saved: Date.now(), visit }, ...f.museums.filter((m) => m.id !== id)].slice(0, MAX_FRIENDS);
  save(FRIENDS, f);
}
export function addFriendIsland(map) {
  const f = friends();
  f.islands = [map, ...f.islands.filter((m) => m.name !== map.name)].slice(0, MAX_FRIENDS);
  try {
    localStorage.setItem(FRIENDS, JSON.stringify(f));
    return true;
  } catch {
    return false; // phone storage is full
  }
}
const removeFriend = (kind, i) => {
  const f = friends();
  f[kind].splice(i, 1);
  save(FRIENDS, f);
};

// Anything a friend sent: a link, a code or a file's text. Returns what it was.
export async function takeIn(input) {
  let raw = input;
  if (typeof input === 'string') {
    const t = input.trim();
    raw = t.startsWith('{') ? JSON.parse(t) : await fromCode(t);
  }
  const v = cleanVisit(raw);
  if (v) return { kind: 'museum', visit: v };
  const isl = cleanIsland(raw);
  if (isl) return { kind: 'island', map: isl };
  throw new Error('not ours');
}

if (typeof document !== 'undefined') {
  const mk = (tag, cls, txt) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  };
  const overlay = (id, title, label) => {
    const o = mk('div', 'overlay hidden');
    o.id = id;
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-label', label);
    o.innerHTML = `<div class="decor-sheet sheet"><div class="decor-head"><h2></h2><button class="${id}-close pixel-btn" aria-label="Close">✕</button></div><div class="${id}-body share-body"></div></div>`;
    o.querySelector('h2').textContent = title;
    document.body.appendChild(o);
    const hide = () => o.classList.add('hidden');
    o.querySelector(`.${id}-close`).onclick = hide;
    o.addEventListener('click', (e) => e.target === o && hide());
    return { o, body: o.querySelector('.share-body'), hide };
  };
  const share = overlay('share', 'Share & visit', 'Share and visit');
  const visit = overlay('visit', 'Visiting', 'A friend’s museum');
  let note = null;
  const say = (s) => note && (note.textContent = s);

  // ---- the visit: a look round a friend's museum, painting by painting ----
  function showVisit(v, saved) {
    visit.o.querySelector('h2').textContent = v.name;
    const b = visit.body;
    b.replaceChildren();
    const head = mk('div', 'share-card');
    head.append(mk('b', 'share-stars', starText(starsFor(v.score))), mk('span', '', `${v.rooms.length} room${v.rooms.length === 1 ? '' : 's'} · rated ${v.score} out of 100`));
    b.appendChild(head);
    v.rooms.forEach((r) => {
      const sec = mk('section', 'share-card');
      sec.appendChild(mk('h3', '', r.name));
      const row = mk('div', 'visit-row');
      const known = r.paintings.map((id) => paintingById.get(id)).filter(Boolean);
      r.paintings.forEach((id) => {
        const p = paintingById.get(id);
        const c = mk('figure', 'visit-art');
        if (p) {
          const holder = mk('button', 'visit-img');
          holder.setAttribute('aria-label', `Look closer: ${p.title}`);
          holder.onclick = () => openViewer(known, known.indexOf(p), null, null, { over: true });
          holder.style.background = p.placeholder || '#2a1f18';
          const img = mk('img');
          img.alt = '';
          img.loading = 'lazy';
          img.src = p.src;
          img.onerror = () => img.remove();
          holder.appendChild(img);
          c.append(holder, mk('figcaption', '', `${p.title} · ${p.by}`));
        } else {
          c.append(mk('div', 'visit-img'), mk('figcaption', '', 'A painting from a newer version'));
        }
        row.appendChild(c);
      });
      if (!r.paintings.length) row.appendChild(mk('p', 'daily-note', 'No paintings on the walls yet.'));
      sec.appendChild(row);
      if (r.decor.length) sec.appendChild(mk('p', 'daily-note', r.decor.map(([k, n]) => (n > 1 ? `${decorName(k)} ×${n}` : decorName(k))).join(' · ')));
      b.appendChild(sec);
    });
    const keep = mk('button', 'wide-btn', saved ? 'In your friends list ✓' : 'Keep in my friends list');
    keep.disabled = !!saved;
    keep.onclick = () => {
      addFriendMuseum(v);
      keep.textContent = 'In your friends list ✓';
      keep.disabled = true;
    };
    b.appendChild(keep);
    visit.o.classList.remove('hidden');
    visit.o.querySelector('.sheet').scrollTop = 0;
  }

  async function receive(input) {
    try {
      const got = await takeIn(input);
      if (got.kind === 'museum') return showVisit(got.visit, false);
      if (addFriendIsland(got.map)) say(`“${got.map.name}” is on your boat's list now. Sail there from any rowboat.`);
      else say('Phone storage is full, so that island could not be kept.');
      renderShare();
      share.o.classList.remove('hidden');
    } catch {
      say('That isn’t a Curation link, code or file.');
    }
  }

  function renderShare() {
    const b = share.body;
    b.replaceChildren();
    const f = friends();

    const mine = mk('section', 'share-card');
    mine.appendChild(mk('h3', '', 'Share my museum'));
    mine.appendChild(mk('p', 'daily-note', 'A link shows your rooms, paintings and decor. It never includes your gold, saves or anything personal.'));
    const name = mk('input', 'room-name');
    name.type = 'text';
    name.maxLength = 30;
    name.placeholder = 'Museum name (optional)';
    name.value = load(NAME_KEY, '');
    name.oninput = () => save(NAME_KEY, name.value);
    const link = mk('button', 'wide-btn', 'Copy visit link');
    link.onclick = async () => {
      const url = await visitLink(name.value.trim());
      try {
        if (navigator.share && /Android|iPhone|iPad/i.test(navigator.userAgent)) await navigator.share({ title: name.value || 'My museum', url });
        else await navigator.clipboard.writeText(url);
        say('Link ready to send.');
      } catch {
        box.value = url;
        box.select?.();
        say('Copy it from the box below.');
      }
    };
    const card = mk('button', 'wide-btn', 'Save rating card (picture)');
    const strip = mk('button', 'wide-btn', 'Save tour strip (picture)');
    [[card, 'card'], [strip, 'strip']].forEach(([btn, kind]) => {
      btn.onclick = async () => {
        btn.disabled = true;
        say('Drawing…');
        const blob = await drawCard(kind, snapshot(name.value.trim()));
        btn.disabled = false;
        if (!blob) return say('The picture could not be saved here.');
        const r = await handOut(blob, `curation-${kind}.png`, name.value || 'My museum');
        say(r === 'cancelled' ? '' : r === 'saved' ? 'Picture saved.' : 'Shared.');
      };
    });
    const box = mk('textarea', 'room-name share-box');
    box.rows = 2;
    box.placeholder = 'A link or code from a friend goes here';
    box.setAttribute('aria-label', 'Paste a friend’s link or code');
    mine.append(name, link, card, strip);

    const visitSec = mk('section', 'share-card');
    visitSec.appendChild(mk('h3', '', 'Visit a friend'));
    visitSec.appendChild(mk('p', 'daily-note', 'Paste a museum or island link, or open a map file they sent.'));
    const go = mk('button', 'wide-btn', 'Open pasted link');
    go.onclick = () => box.value.trim() && receive(box.value);
    const file = mk('input');
    file.type = 'file';
    file.accept = '.json,application/json';
    file.hidden = true;
    file.onchange = async () => {
      const t = file.files[0];
      file.value = '';
      if (t) receive(await t.text());
    };
    const pick = mk('button', 'wide-btn', 'Open a map file');
    pick.onclick = () => file.click();
    visitSec.append(box, go, pick, file);

    note = mk('p', 'daily-note share-note');
    note.setAttribute('role', 'status');

    const list = mk('section', 'share-card');
    list.appendChild(mk('h3', '', 'My friends'));
    if (!f.museums.length && !f.islands.length) list.appendChild(mk('p', 'daily-note', 'Nothing here yet. Museums and islands you keep will appear here.'));
    f.museums.forEach((m, i) => {
      const row = mk('div', 'friend-row');
      row.appendChild(mk('b', '', m.visit.name));
      const look = mk('button', 'pixel-btn', 'Visit');
      look.onclick = () => showVisit(m.visit, true);
      const rm = mk('button', 'pixel-btn', 'Remove');
      rm.onclick = () => (removeFriend('museums', i), renderShare());
      row.append(look, rm);
      list.appendChild(row);
    });
    f.islands.forEach((m, i) => {
      const row = mk('div', 'friend-row');
      row.appendChild(mk('b', '', `${m.name} (island)`));
      const rm = mk('button', 'pixel-btn', 'Remove');
      rm.onclick = () => (removeFriend('islands', i), renderShare());
      row.appendChild(rm);
      list.appendChild(row);
    });
    b.append(mine, visitSec, note, list);
  }

  const openShare = () => {
    renderShare();
    share.o.classList.remove('hidden');
  };
  window.__share = { openShare, snapshot, receive, takeIn, drawCard }; // for tests

  // A friend's link opened in the browser: ?visit=<code> or ?island=<code>
  const q = new URLSearchParams(location.search);
  const incoming = q.get('visit') || q.get('island');
  if (incoming) {
    history.replaceState(null, '', location.pathname);
    receive(incoming);
  }
}

export const openShare = () => window.__share?.openShare();
