// "Pick your own" color: a small in-game color wheel (hue around the ring, softer
// toward the middle) with a brightness slider. It replaces the phone's own color
// picker, which on iPhone opens a separate popover that is hard to use from a
// scrolling sheet. onLive(hex) fires while dragging (preview only), onDone(hex)
// once on Use, onCancel() if the player backs out.
import './colorwheel.css';

const SIZE = 220;
let root = null;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const toHex = (r, g, b) => '#' + [r, g, b].map((n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0')).join('');
function hsvToRgb(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}
function hexToHsv(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return { h: 0, s: 0.6, v: 0.8 };
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}

function build() {
  root = document.createElement('div');
  root.id = 'colorwheel';
  root.className = 'hidden';
  root.innerHTML = `
    <div class="cw-card" role="dialog" aria-label="Pick a color">
      <div class="cw-top"><b>Pick a color</b><span class="cw-now"></span></div>
      <div class="cw-wheel"><canvas width="${SIZE}" height="${SIZE}"></canvas><i class="cw-knob"></i></div>
      <label class="cw-light"><span>Brightness</span><input type="range" min="0" max="100" step="1" aria-label="Brightness" /></label>
      <div class="cw-buttons"><button type="button" class="cw-cancel">Cancel</button><button type="button" class="cw-use">Use</button></div>
    </div>`;
  document.body.appendChild(root);
  return root;
}

let st = null;
function paintWheel() {
  const c = root.querySelector('canvas');
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(SIZE, SIZE);
  const R = SIZE / 2;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const dx = x - R + 0.5;
      const dy = y - R + 0.5;
      const d = Math.hypot(dx, dy) / R;
      const k = (y * SIZE + x) * 4;
      if (d > 1) continue;
      const [r, g, b] = hsvToRgb(((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360, d, st.v);
      img.data[k] = r;
      img.data[k + 1] = g;
      img.data[k + 2] = b;
      img.data[k + 3] = 255;
    }
  ctx.putImageData(img, 0, 0);
}
const current = () => toHex(...hsvToRgb(st.h, st.s, st.v));
function show() {
  const hex = current();
  const knob = root.querySelector('.cw-knob');
  const a = (st.h * Math.PI) / 180;
  knob.style.left = `${50 + 50 * st.s * Math.cos(a)}%`;
  knob.style.top = `${50 + 50 * st.s * Math.sin(a)}%`;
  knob.style.background = hex;
  root.querySelector('.cw-now').style.background = hex;
  root.querySelector('input').value = Math.round(st.v * 100);
}

export function openColorWheel(start, { onLive, onDone, onCancel } = {}) {
  if (!root) build();
  st = { ...hexToHsv(start), onLive, onDone, onCancel };
  if (st.v < 0.4) st.v = 0.4; // a dark start would hide the wheel
  paintWheel();
  show();
  root.classList.remove('hidden');
  const wheel = root.querySelector('.cw-wheel');
  const pick = (e) => {
    const b = wheel.getBoundingClientRect();
    const dx = e.clientX - b.left - b.width / 2;
    const dy = e.clientY - b.top - b.height / 2;
    st.h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    st.s = clamp(Math.hypot(dx, dy) / (b.width / 2), 0, 1);
    show();
    st.onLive?.(current());
  };
  wheel.onpointerdown = (e) => {
    wheel.setPointerCapture?.(e.pointerId);
    pick(e);
    wheel.onpointermove = pick;
  };
  wheel.onpointerup = wheel.onpointercancel = () => (wheel.onpointermove = null);
  root.querySelector('input').oninput = (e) => {
    st.v = Number(e.target.value) / 100;
    paintWheel();
    show();
    st.onLive?.(current());
  };
  const close = () => root.classList.add('hidden');
  root.querySelector('.cw-use').onclick = () => {
    close();
    st.onDone?.(current());
  };
  root.querySelector('.cw-cancel').onclick = () => {
    close();
    st.onCancel?.();
  };
  root.onclick = (e) => e.target === root && root.querySelector('.cw-cancel').click();
}

export const colorWheelOpen = () => !!root && !root.classList.contains('hidden');
