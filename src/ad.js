// A stand-in for a rewarded video ad: a short countdown, then the reward.
const el = document.getElementById('ad');
const count = el.querySelector('.ad-count');

export function showAd(done) {
  let left = 5;
  count.textContent = left;
  el.classList.remove('hidden');
  const tick = setInterval(() => {
    left -= 1;
    count.textContent = left;
    if (left > 0) return;
    clearInterval(tick);
    el.classList.add('hidden');
    done();
  }, 1000);
}
