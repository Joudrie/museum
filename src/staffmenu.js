// The staff board in the break room: who's hired, and hiring more.
const el = document.getElementById('staffmenu');
const list = el.querySelector('.staff-list');
let state = null;

// A finished state (hired, maxed) is a badge, not a dead button; an action is a full-width button under the text.
const DONE = ['Hired', 'Maxed', 'All hired'];

function row(title, info, button) {
  const r = document.createElement('div');
  r.className = 'staff-row';
  r.innerHTML = '<div class="staff-head"><b></b></div><small></small>';
  r.querySelector('b').textContent = title;
  r.querySelector('small').textContent = info;
  if (button && DONE.includes(button.label)) {
    const tag = document.createElement('span');
    tag.className = 'ui-badge staff-done';
    tag.textContent = button.label;
    r.querySelector('.staff-head').appendChild(tag);
  } else if (button) {
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
      `${s.guides} of ${s.maxGuides} · one per 3 rooms · each +${Math.round(s.guideBoost * 100)}% income`,
      s.guides < s.maxGuides ? { label: `Hire · ${price(s.guideCost)}`, onClick: state.onHireGuide } : { label: s.maxGuides ? 'All hired' : 'Need 3 rooms', disabled: true },
    ),
    row('Carpenter', 'Fixes cracks and builds new rooms on the spot', s.carpenter ? { label: 'Hired', disabled: true } : { label: `Hire · ${price(s.carpenterCost)}`, onClick: state.onHireCarpenter }),
    ...s.upgrades.map((u) =>
      row(
        `${u.name}${u.level ? ` · level ${u.level}` : ''}`,
        `${u.blurb}: ${u.now}${u.next ? ` → ${u.next}` : ''}`,
        u.cost === null ? { label: 'Maxed', disabled: true } : u.locked ? { label: u.locked, disabled: true } : { label: `Upgrade · ${price(u.cost)}`, onClick: () => state.onUpgrade(u.id) },
      ),
    ),
  );
}

el.querySelector('.staff-close').addEventListener('click', () => {
  el.classList.add('hidden');
  state.onClose();
});

// opts: { info() -> counts, prices and upgrades, onUpgrade(id), onHireGuide(), onHireCarpenter(), onClose() }
export function openStaffMenu(opts) {
  state = opts;
  render();
  el.classList.remove('hidden');
}
