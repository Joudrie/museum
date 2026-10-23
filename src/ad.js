// A stand-in for a rewarded video ad: a short countdown, then the reward.
const el = document.getElementById('ad');
const count = el.querySelector('.ad-count');
const bar = el.querySelector('.ad-bar i');

export function showAd(done) {
  let left = 5;
  count.textContent = left;
  bar.style.transition = 'none';
  bar.style.width = '0';
  el.classList.remove('hidden');
  requestAnimationFrame(() => {
    bar.style.transition = '';
    bar.style.width = '20%';
  });
  const tick = setInterval(() => {
    left -= 1;
    count.textContent = left;
    bar.style.width = `${(5 - left + 1) * 20}%`;
    if (left > 0) return;
    clearInterval(tick);
    el.classList.add('hidden');
    done();
  }, 1000);
}
