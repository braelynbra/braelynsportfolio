// Load loops only near the viewport; stop decoding when they leave it.
const videos = [...document.querySelectorAll('video[data-loop]')];
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const toggle = document.querySelector('[data-motion-toggle]');
let paused = preference.matches;
const visible = new Set();

function sync() {
  for (const video of videos) {
    if (paused || document.hidden || !visible.has(video)) {
      video.pause();
    } else {
      if (!video.src) video.src = video.dataset.src;
      video.play().catch(() => { /* The poster remains if autoplay is unavailable. */ });
    }
  }
  if (toggle) {
    toggle.textContent = paused ? 'Animationen abspielen' : 'Animationen pausieren';
    toggle.setAttribute('aria-pressed', String(paused));
  }
}
const observer = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    isIntersecting ? visible.add(target) : visible.delete(target);
  }
  sync();
}, { rootMargin: '100px' });
videos.forEach(video => observer.observe(video));
toggle?.addEventListener('click', () => { paused = !paused; sync(); });
preference.addEventListener('change', event => { paused = event.matches; sync(); });
document.addEventListener('visibilitychange', sync);
sync();
