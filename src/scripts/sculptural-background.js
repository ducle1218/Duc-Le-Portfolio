/* Load the decorative wind-tunnel scene independently of portfolio content. */
(() => {
  const source = new URL('wind-tunnel.bundle.js?v=20261026-2', document.currentScript.src);
  import(source.href).catch(error => console.warn('Airflow background unavailable:', error));
})();
