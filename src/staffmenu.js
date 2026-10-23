// The staff board in the break room: who's hired, and hiring more.
const el = document.getElementById('staffmenu');
const list = el.querySelector('.staff-list');
let state = null;

function row(title, info, button) {
  const r = document.createElement('div');
  r.className = 'staff-row';
  r.innerHTML = '<div><b></b><small></small></div>';
  r.querySelector('b').textContent = title;
  r.querySelector('small').textContent = info;
  if (button) {
    const b = document.createElement('button');
    b.className = 'pixel-btn';
    b.textContent = button.label;
    b.disabled = !!button.disabled;
    b.onclick = () => {
      button.onClick();
      render();
    };
    r.appendChild(b);
  }
  return r;
}

function render() {
  const s = state.info();
  const price = (n) => (s.free ? `Free (${n.toLocaleString()} gold)` : `${n.toLocaleString()} gold`);
  list.replaceChildren(
    row('Janitors', `${s.janitors} hired · one per room keeps it spotless. Hire them in Customize → This room.`),
    row(
      'Tour guides',
      `${s.guides} of ${s.maxGuides} · one per 3 rooms · each +10% income`,
      s.guides < s.maxGuides ? { label: `Hire · ${price(s.guideCost)}`, onClick: state.onHireGuide } : { label: s.maxGuides ? 'All hired' : 'Need 3 rooms', disabled: true },
    ),
    row('Carpenter', 'Fixes cracks and builds new rooms (instantly, for now)', s.carpenter ? { label: 'Hired', disabled: true } : { label: `Hire · ${price(s.carpenterCost)}`, onClick: state.onHireCarpenter }),
  );
}

el.querySelector('.staff-close').addEventListener('click', () => {
  el.classList.add('hidden');
  state.onClose();
});

// opts: { info() -> counts and prices, onHireGuide(), onHireCarpenter(), onClose() }
export function openStaffMenu(opts) {
  state = opts;
  render();
  el.classList.remove('hidden');
}
