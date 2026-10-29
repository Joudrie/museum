// Tap the HUD: what the museum earns, room by room, and what boosts it.
const el = document.getElementById('income');
const body = el.querySelector('.income-body');
let state = null;

function render() {
  const d = state.data();
  const top = document.createElement('div');
  top.className = 'income-top';
  top.innerHTML = `
    <div><b><i class="coin"></i> ${d.income.toLocaleString()}</b><small>gold / hour</small></div>
    <div><b>${d.visitors.toLocaleString()}</b><small>visitors / month</small></div>
    <div><b>★ ${d.rating.toFixed(1)}</b><small>museum rating</small></div>`;
  const boosts = document.createElement('ul');
  boosts.className = 'income-boosts';
  d.boosts.forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    boosts.appendChild(li);
  });
  const list = document.createElement('div');
  list.className = 'income-rooms';
  d.rooms.forEach((r) => {
    const b = document.createElement('button');
    b.className = 'income-room' + (r.here ? ' on' : '') + (r.locked ? ' locked' : '');
    b.disabled = r.locked;
    b.innerHTML = `<span class="ir-name"><b></b><i>${r.stars}</i></span><span class="ir-gold">${r.locked ? 'Locked' : `+${r.income}/hr`}<small>${r.locked ? '' : r.full ? `${r.waiting.toLocaleString()} · FULL, collect!` : r.waiting ? `${r.waiting.toLocaleString()} waiting` : `${r.paintings} paintings`}</small></span>`;
    b.querySelector('b').textContent = r.name;
    b.onclick = () => {
      if (r.here) return;
      close();
      state.onGo(r.index);
    };
    list.appendChild(b);
  });
  const h = document.createElement('h3');
  h.textContent = 'Rooms (tap to go)';
  const hb = document.createElement('h3');
  hb.textContent = 'Boosts';
  const note = document.createElement('p');
  note.className = 'income-note';
  note.textContent = d.note || '';
  body.replaceChildren(top, hb, boosts, h, list, note);
}

function close() {
  el.classList.add('hidden');
  state?.onClose();
}

el.querySelector('.income-close').addEventListener('click', close);

// opts: { data() -> { income, visitors, rating, boosts: [text], rooms: [...] }, onGo(i), onClose() }
export function openIncome(opts) {
  state = opts;
  render();
  el.classList.remove('hidden');
}
