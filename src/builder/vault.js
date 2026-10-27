// A second home for map work: every save also lands here (IndexedDB), with a
// history of earlier versions. If the page reloads or the phone clears its
// usual storage, the newest copy comes back from here.
const DB = 'curation-builder';
const KEEP = 40; // versions kept per map
const EVERY = 60 * 1000; // a new version at most once a minute; in between the latest is updated

let dbp = null;
function db() {
  if (!dbp)
    dbp = new Promise((res) => {
      try {
        const req = indexedDB.open(DB, 1);
        req.onupgradeneeded = () => {
          const s = req.result.createObjectStore('versions', { keyPath: 'id', autoIncrement: true });
          s.createIndex('name', 'name');
        };
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
      } catch {
        res(null);
      }
    });
  return dbp;
}
const all = (store, index, key) =>
  new Promise((res) => {
    const req = index ? store.index(index).getAll(key) : store.getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => res([]);
  });

let last = null; // { name, id, at } of the version being updated
export async function backup(data) {
  const d = await db();
  if (!d) return;
  try {
    const tx = d.transaction('versions', 'readwrite');
    const s = tx.objectStore('versions');
    const rec = { ...data };
    if (last && last.name === data.name && data.saved - last.at < EVERY) rec.id = last.id;
    const req = s.put(rec);
    req.onsuccess = () => {
      if (rec.id === undefined) last = { name: data.name, id: req.result, at: data.saved };
    };
    const mine = await all(s, 'name', data.name);
    mine.sort((a, b) => b.saved - a.saved).slice(KEEP).forEach((v) => s.delete(v.id));
  } catch {
    // the usual storage still has it
  }
}
export async function backupsFor(name) {
  const d = await db();
  if (!d) return [];
  const list = await all(d.transaction('versions').objectStore('versions'), 'name', name);
  return list.sort((a, b) => b.saved - a.saved);
}
export async function latestBackup() {
  const d = await db();
  if (!d) return null;
  const list = await all(d.transaction('versions').objectStore('versions'));
  return list.sort((a, b) => b.saved - a.saved)[0] || null;
}
// ask the phone not to clear this site's storage
export function keepStorage() {
  navigator.storage?.persist?.().catch(() => {});
}
