// Share codes: a museum postcard or a builder island packed into a short link
// or file, and read back safely. No imports, so tests can run it in Node.
// Nothing personal goes in a code: no gold, no save data, no character, and the
// museum's name is only what the player typed into the share panel.

const te = new TextEncoder();
const td = new TextDecoder();

const toB64 = (bytes) => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (str) => {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, (c) => c.charCodeAt(0));
};

async function pipe(bytes, stream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

// 'z' + deflated, or 'j' + plain when this browser has no CompressionStream.
export async function toCode(obj) {
  const raw = te.encode(JSON.stringify(obj));
  if (typeof CompressionStream === 'undefined') return 'j' + toB64(raw);
  return 'z' + toB64(await pipe(raw, new CompressionStream('deflate-raw')));
}

export async function fromCode(code) {
  const c = String(code || '').trim().replace(/^.*[?&](?:visit|island)=/, '').replace(/[^A-Za-z0-9_-]/g, '');
  if (c.length < 2 || c.length > 400000) throw new Error('bad code');
  const bytes = fromB64(c.slice(1));
  if (c[0] === 'j') return JSON.parse(td.decode(bytes));
  if (c[0] !== 'z' || typeof DecompressionStream === 'undefined') throw new Error('bad code');
  const out = await pipe(bytes, new DecompressionStream('deflate-raw'));
  if (out.length > 4e6) throw new Error('too big');
  return JSON.parse(td.decode(out));
}

const str = (v, n) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n) : '');
const num = (v, lo, hi) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, Math.round(v))) : lo);

// A friend's museum postcard: { v, n, s (score), r: [{ n, p: [painting ids], d: { decorType: count } }] }
export function cleanVisit(raw) {
  if (!raw || raw.v !== 1 || !Array.isArray(raw.r)) return null;
  const rooms = raw.r.slice(0, 60).map((r, i) => ({
    name: str(r?.n, 30) || `Room ${i + 1}`,
    paintings: Array.isArray(r?.p) ? r.p.slice(0, 80).map((id) => str(id, 60)).filter(Boolean) : [],
    decor: Object.entries(r?.d && typeof r.d === 'object' ? r.d : {})
      .slice(0, 60)
      .map(([k, n]) => [str(k, 30), num(n, 1, 99)])
      .filter(([k]) => k),
  }));
  if (!rooms.length) return null;
  return { name: str(raw.n, 30) || 'A Curation museum', score: num(raw.s, 0, 100), rooms };
}

// A builder island (the 'curation-map' format). Only known fields survive.
export const MAX_ISLAND = 700;
export function cleanIsland(raw) {
  if (!raw || raw.kind !== 'island' || !Array.isArray(raw.corners)) return null;
  const w = num(raw.w, 0, MAX_ISLAND);
  const h = num(raw.h, 0, MAX_ISLAND);
  if (w < 8 || h < 8) return null;
  if (raw.corners.length !== h + 1 || raw.corners.some((r) => typeof r !== 'string' || r.length !== w + 1 || /[^0-4]/.test(r))) return null;
  const ref = (v) => typeof v === 'string' && /^[mtp]:[^\s<>"'\\]{1,55}$/.test(v);
  const tiles = {};
  Object.entries(raw.tiles && typeof raw.tiles === 'object' ? raw.tiles : {}).forEach(([k, v]) => /^\d+,\d+$/.test(k) && ref(v) && (tiles[k] = v));
  const out = {
    format: 'curation-map',
    version: 2,
    tile: num(raw.tile, 1, 256) || 32,
    name: str(raw.name, 40) || 'A friend’s island',
    kind: 'island',
    w,
    h,
    corners: raw.corners.slice(),
    tiles,
    objects: (Array.isArray(raw.objects) ? raw.objects : [])
      .slice(0, 30000)
      .filter((o) => o && ref(o.ref) && Number.isFinite(o.x) && Number.isFinite(o.y))
      .map((o) => ({ ref: o.ref, x: o.x, y: o.y, ...(o.flip ? { flip: true } : {}) })),
  };
  if (raw.tileRows && Array.isArray(raw.tileRows.legend) && Array.isArray(raw.tileRows.rows) && raw.tileRows.legend.every(ref) && raw.tileRows.rows.length === h && raw.tileRows.rows.every((r) => typeof r === 'string' && /^[a-zA-Z.\d]*$/.test(r))) {
    out.tileRows = { legend: raw.tileRows.legend.slice(), rows: raw.tileRows.rows.slice() };
  }
  return out;
}
