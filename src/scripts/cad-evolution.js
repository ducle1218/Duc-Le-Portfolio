/* User-initiated playback only. Case-study markup is inserted by showProjectDetail. */
(() => {
  const assetRoot = 'src/assets/video/cad-evolution/';
  const clips = {
    'upper-leg-support': 'Upper leg support',
    'front-head': 'Front head',
    'body-connector': 'Body connector'
  };
  const players = new Set();
  const pauseAll = () => players.forEach(video => video.pause());

  function syncPlayers() {
    for (const video of players) {
      if (!video.isConnected) {
        video.pause();
        players.delete(video);
      }
    }
    document.querySelectorAll('[data-cad-evolution] video').forEach(video => {
      if (!players.has(video)) {
        players.add(video);
        video.addEventListener('error', () => {
          const message = video.closest('[data-cad-evolution]')?.querySelector('.cad-evolution-error');
          if (message) message.hidden = false;
        });
        // Native controls remain usable, but a hidden panel must never keep playing.
        video.addEventListener('play', () => {
          if (document.hidden || !video.getClientRects().length) video.pause();
        });
      }
      if (document.hidden || !video.getClientRects().length) video.pause();
    });
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-evolution-clip]');
    if (!button || button.getAttribute('aria-pressed') === 'true') return;
    const clip = button.dataset.evolutionClip;
    const title = clips[clip];
    const root = button.closest('[data-cad-evolution]');
    if (!root || !title) return;
    const video = root.querySelector('video');
    video.pause();
    video.poster = assetRoot + clip + '.webp';
    video.src = assetRoot + clip + '.mp4';
    video.setAttribute('aria-label', title + ': evolution of the supplied STEP exports');
    video.load();
    root.querySelectorAll('[data-evolution-clip]').forEach(item => {
      item.setAttribute('aria-pressed', String(item === button));
    });
    root.querySelector('[data-evolution-title]').textContent = title;
    const download = root.querySelector('[data-evolution-download]');
    download.href = assetRoot + clip + '.mp4';
    download.download = 'quadruped-' + clip + '.mp4';
    root.querySelector('.cad-evolution-error').hidden = true;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAll();
  });
  window.addEventListener('pagehide', pauseAll);

  function init() {
    const body = document.getElementById('project-detail-body');
    const pane = document.getElementById('tab-project-detail-content');
    if (!body || !pane) return;
    new MutationObserver(syncPlayers).observe(body, {childList: true, subtree: true});
    new MutationObserver(syncPlayers).observe(pane, {attributes: true, attributeFilter: ['class', 'hidden', 'style']});
    syncPlayers();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once: true});
  else init();
})();
