(() => {
  const loader = document.createElement('div');
  loader.className = 'pony-loader';
  loader.innerHTML = '<div class="pony-loader__card" role="status" aria-label="Loading gallery"><div class="pony-loader__label">Loading...</div><div class="pony-loader__track" aria-hidden="true"><div class="pony-loader__fill"></div><img class="pony-loader__pony" src="photom/pony.gif" alt=""></div></div>';
  document.body.append(loader);
  document.body.classList.add('pony-loading');
  const start = performance.now();
  let ready = document.readyState === 'complete';
  let progress = 0;
  window.addEventListener('load', () => { ready = true; }, { once: true });
  function tick(now) {
    // Play briefly and avoid blocking the gallery on slow resources.
    const elapsed = now - start;
    const target = ready || elapsed >= 8000 ? 100 : 90;
    progress = Math.min(target, Math.max(progress, elapsed / 20));
    loader.style.setProperty('--progress', progress + '%');
    if (progress < 100) {
      requestAnimationFrame(tick);
      return;
    }
    document.body.classList.remove('pony-loading');
    loader.classList.add('fade-out');
    setTimeout(() => loader.remove(), 600);
  }
  requestAnimationFrame(tick);
})();
