/* Keep Three.js and WebGL completely out of the initial hero's loading path. */
(() => {
  const source = new URL('wind-tunnel.bundle.js?v=20261026-3', document.currentScript.src);
  let stage = null, modulePromise = null, controller = null, queued = false;
  const margin = 0;

  function isNear() {
    if (!stage || document.hidden || !stage.getClientRects().length) return false;
    const bounds = stage.getBoundingClientRect();
    return bounds.bottom >= -margin && bounds.top <= innerHeight + margin;
  }

  function startWhenReady() {
    if (controller || queued || !isNear()) return;
    queued = true;
    // Two frames allow the existing content to paint before background work.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const start = () => {
        queued = false;
        if (controller || !isNear()) return;
        modulePromise ||= import(source.href);
        modulePromise.then(module => {
          if (!controller && isNear()) controller = module.startWindTunnel();
        }).catch(error => {
          modulePromise = null;
          console.warn('Airflow background unavailable:', error);
        });
      };
      if ('requestIdleCallback' in window) requestIdleCallback(start, {timeout: 1200});
      else setTimeout(start, 0);
    }));
  }

  const observer = new IntersectionObserver(startWhenReady, {rootMargin: `${margin}px`});
  function watchPage() {
    const page = document.body.dataset.atmospherePage || 'home';
    const next = page === 'home' ? document.querySelector('.discipline-strip')
      : page === 'project' ? document.querySelector('.project-page-heading') : null;
    if (next !== stage) {
      observer.disconnect();
      stage = next;
      if (stage) observer.observe(stage);
    }
    startWhenReady();
  }

  new MutationObserver(watchPage).observe(document.body,
    {attributes: true, attributeFilter: ['data-atmosphere-page']});
  document.addEventListener('visibilitychange', startWhenReady);
  window.addEventListener('pageshow', watchPage);
  watchPage();
})();
