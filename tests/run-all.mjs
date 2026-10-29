// Runs every test in one go against a fresh build and prints a pass/fail line each.
// Usage: npm test   (builds, starts the preview server, runs all, stops it)
//   ONLY=gaps,content   run just those      SKIP_BUILD=1   reuse dist/      RETRY=1  rerun a failed test once
//   PW=/path/to/playwright  where Playwright lives (default: the installed package)
// Exit code 1 if any test fails. Playtest and perf are not in the default set (slow); add them with ALL=1.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const PORT = process.env.PORT || '4173';
const URL_ROOT = `http://localhost:${PORT}/`;
const OUT = process.env.OUT || 'test-shots';
fs.mkdirSync(OUT, { recursive: true });

const FAST = ['bundle', 'content', 'gaps', 'collections', 'saves', 'smoke', 'builder', 'dig', 'puzzles', 'restore', 'display', 'expedition', 'halls', 'people', 'presets', 'share', 'chatter', 'interact'];
const SLOW = ['playtest', 'perf', 'ui-layout'];
const names = process.env.ONLY ? process.env.ONLY.split(',') : process.env.ALL ? [...FAST, ...SLOW] : FAST;

if (!process.env.SKIP_BUILD) {
  const b = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  if (b.status) process.exit(b.status);
}
const server = spawn('npx', ['vite', 'preview', '--port', PORT, '--base', '/', '--strictPort'], { stdio: 'ignore' });
const stop = () => server.kill();
process.on('exit', stop);
for (let i = 0; i < 40; i++) {
  try {
    if ((await fetch(URL_ROOT)).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}

// A few tests import source files straight from the page (`import('/src/dig.js')`), which only the dev server serves.
const NEEDS_DEV = ['dig'];
const DEV_PORT = '5174';
let dev = null;
const startDev = async () => {
  dev = spawn('npx', ['vite', '--port', DEV_PORT, '--strictPort'], { stdio: 'ignore' });
  process.on('exit', () => dev.kill());
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(`http://localhost:${DEV_PORT}/`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
};

const env = { ...process.env, OUT };
delete env.URL;
const run = (name) => {
  const t0 = Date.now();
  const r = spawnSync('node', [`tests/${name}.cjs`], { env: NEEDS_DEV.includes(name) ? { ...env, URL: `http://localhost:${DEV_PORT}/` } : env, encoding: 'utf8', timeout: 600000, maxBuffer: 1 << 26 });
  return { name, ok: r.status === 0, secs: Math.round((Date.now() - t0) / 1000), out: (r.stdout || '') + (r.stderr || '') };
};

const failed = [];
for (const name of names) {
  if (!fs.existsSync(`tests/${name}.cjs`)) continue;
  if (NEEDS_DEV.includes(name) && !dev) await startDev();
  let r = run(name);
  if (!r.ok && process.env.RETRY) r = run(name); // (a real failure fails twice; use only to tell load from a bug)
  console.log(`${r.ok ? '✓' : '✗'} ${name} (${r.secs}s)`);
  if (!r.ok) {
    failed.push(name);
    console.log(r.out.split('\n').filter((l) => /✗|fail|error|broken|gap/i.test(l)).slice(0, 12).join('\n') || r.out.split('\n').slice(-12).join('\n'));
  }
}
console.log(failed.length ? `\n${failed.length} failed: ${failed.join(', ')}` : '\nAll tests passed');
process.exit(failed.length ? 1 : 0);
