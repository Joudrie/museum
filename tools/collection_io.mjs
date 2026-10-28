// Shared by the collection tools: writes data as readable JS (single quotes,
// bare keys) so generated data files look like the hand-written ones.
const KEY = /^[A-Za-z_$][\w$]*$/;
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

export function js(v, indent = 0, width = 100) {
  const pad = '  '.repeat(indent);
  const pad1 = '  '.repeat(indent + 1);
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return q(v);
  if (typeof v !== 'object') return String(v);
  const flat = Array.isArray(v)
    ? `[${v.map((x) => js(x, 0)).join(', ')}]`
    : `{ ${Object.entries(v).map(([k, x]) => `${KEY.test(k) ? k : q(k)}: ${js(x, 0)}`).join(', ')} }`;
  if (flat.length + pad.length <= width && !flat.includes('\n')) return Array.isArray(v) && !v.length ? '[]' : flat;
  if (Array.isArray(v)) return `[\n${v.map((x) => pad1 + js(x, indent + 1, width)).join(',\n')},\n${pad}]`;
  return `{\n${Object.entries(v).map(([k, x]) => `${pad1}${KEY.test(k) ? k : q(k)}: ${js(x, indent + 1, width)}`).join(',\n')},\n${pad}}`;
}
