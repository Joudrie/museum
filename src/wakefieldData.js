// Wakefield's shapes are one 700 KB file, fetched the first time you sail there.
let loading = null;
export const loadWakefield = (url = './maps/wakefield.vec.json') => (loading ||= fetch(url).then((r) => r.json())).catch((e) => ((loading = null), Promise.reject(e)));
