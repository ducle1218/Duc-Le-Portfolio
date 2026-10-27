/* Opt-in local diagnostics. No requests, cookies, storage, or telemetry. */
(() => {
  if (new URLSearchParams(location.search).get('performance') !== '1') return;
  const output = document.createElement('script');
  output.type = 'application/json';
  output.id = 'portfolio-performance';
  document.head.append(output);
  const round = value => Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
  const supported = typeof PerformanceObserver === 'undefined' ? [] : PerformanceObserver.supportedEntryTypes || [];
  performance.setResourceTimingBufferSize?.(1000);
  const state = { fcp: null, lcp: null, longTasks: [], hero: null };
  let timer, heroBound = false;
  const path = name => {
    try { const url = new URL(name, location.href); return url.origin === location.origin ? url.pathname : url.origin + url.pathname; }
    catch { return name; }
  };
  const resource = entry => ({
    path: path(entry.name), type: entry.initiatorType || 'document',
    startMs: round(entry.startTime), durationMs: round(entry.duration),
    responseEndMs: round(entry.responseEnd), transferBytes: entry.transferSize || 0,
    encodedBytes: entry.encodedBodySize || 0, decodedBytes: entry.decodedBodySize || 0,
    cacheHint: entry.transferSize > 0 ? 'network' : entry.decodedBodySize > 0 ? 'local-cache-or-service-worker' : 'unknown'
  });
  function write() {
    clearTimeout(timer); timer = null;
    const nav = performance.getEntriesByType('navigation')[0];
    const entries = performance.getEntriesByType('resource');
    const resources = entries.map(resource);
    const initial = resources.filter(entry => !nav?.loadEventStart || entry.startMs <= nav.loadEventStart);
    const tasks = state.longTasks;
    const beforeLoad = tasks.filter(task => !nav?.loadEventStart || task.startMs <= nav.loadEventStart);
    const hero = state.hero;
    if (hero) {
      const match = entries.filter(entry => entry.name === hero.src).at(-1);
      hero.networkResponseEndMs = match ? round(match.responseEnd) : null;
    }
    output.textContent = JSON.stringify({
      schema: 1, observedAtMs: round(performance.now()),
      path: location.pathname, viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      visibility: document.visibilityState,
      connection: navigator.connection ? { effectiveType: navigator.connection.effectiveType, rttMs: navigator.connection.rtt, downlinkMbps: navigator.connection.downlink, saveData: navigator.connection.saveData } : null,
      metrics: {
        ttfbMs: nav ? round(nav.responseStart) : null,
        documentDownloadMs: nav ? round(nav.responseEnd - nav.responseStart) : null,
        domContentLoadedMs: nav?.domContentLoadedEventEnd ? round(nav.domContentLoadedEventEnd) : null,
        loadMs: nav?.loadEventEnd ? round(nav.loadEventEnd) : null,
        firstContentfulPaintMs: state.fcp,
        largestContentfulPaintMs: state.lcp?.timeMs ?? null,
        longTaskCountBeforeLoad: beforeLoad.length,
        longTaskBlockingMsBeforeLoad: round(beforeLoad.reduce((sum, task) => sum + Math.max(0, task.durationMs - 50), 0)),
        longTaskCountObserved: tasks.length,
        longestTaskMs: tasks.length ? Math.max(...tasks.map(task => task.durationMs)) : 0,
        initialRequests: initial.length + (nav ? 1 : 0),
        initialTransferBytes: initial.reduce((sum, entry) => sum + entry.transferBytes, nav?.transferSize || 0),
        observedTransferBytes: resources.reduce((sum, entry) => sum + entry.transferBytes, nav?.transferSize || 0)
      },
      lcp: state.lcp, hero,
      navigation: nav ? { ...resource(nav), navigationType: nav.type, dnsMs: round(nav.domainLookupEnd - nav.domainLookupStart), connectMs: round(nav.connectEnd - nav.connectStart), serverWaitMs: round(nav.responseStart - nav.requestStart) } : null,
      supportedObservers: supported.filter(type => ['paint', 'largest-contentful-paint', 'longtask', 'resource'].includes(type)),
      resources, longTasks: tasks,
      notes: ['All times are milliseconds from navigation start.', 'LCP is the latest candidate and can change until interaction or page hiding.', 'Transfer totals may undercount cross-origin resources without Timing-Allow-Origin.', 'Hero decodeReadyObservedAtMs is when this probe confirmed decode readiness, not the original decode completion time.', 'Initial requests and blocking time use loadEventStart as the cutoff; this is not Lighthouse Total Blocking Time.']
    });
  }
  const schedule = () => { if (!timer) timer = setTimeout(write, 80); };
  function observe(type, consume) {
    if (!supported.includes(type)) return;
    const observer = new PerformanceObserver(list => { consume(list.getEntries()); schedule(); });
    observer.observe({ type, buffered: true });
  }
  observe('paint', entries => entries.forEach(entry => { if (entry.name === 'first-contentful-paint') state.fcp = round(entry.startTime); }));
  observe('largest-contentful-paint', entries => entries.forEach(entry => { state.lcp = { timeMs: round(entry.startTime), size: entry.size, element: entry.element ? entry.element.tagName.toLowerCase() + (entry.element.id ? '#' + entry.element.id : '') : null, url: entry.url ? path(entry.url) : null }; }));
  observe('longtask', entries => entries.forEach(entry => { state.longTasks.push({ startMs: round(entry.startTime), durationMs: round(entry.duration), name: entry.name }); }));
  observe('resource', () => {});
  function bindHero() {
    if (heroBound) return;
    const img = document.getElementById('spotlight-image');
    if (!img) return;
    heroBound = true;
    const hero = state.hero = { src: img.currentSrc || img.src, alreadyCompleteWhenObserved: img.complete && img.naturalWidth > 0, loadObservedAtMs: null, decodeReadyObservedAtMs: null, decodeError: false };
    const decode = () => {
      hero.src = img.currentSrc || img.src;
      if (typeof img.decode === 'function') img.decode().then(() => { hero.decodeReadyObservedAtMs = round(performance.now()); schedule(); }).catch(() => { hero.decodeError = true; schedule(); });
    };
    if (hero.alreadyCompleteWhenObserved) decode();
    else img.addEventListener('load', () => { hero.loadObservedAtMs = round(performance.now()); decode(); schedule(); }, { once: true });
    img.addEventListener('error', () => { hero.decodeError = true; schedule(); }, { once: true });
    schedule();
  }
  document.addEventListener('DOMContentLoaded', () => { bindHero(); schedule(); }, { once: true });
  window.addEventListener('load', schedule, { once: true });
  document.addEventListener('visibilitychange', write);
  window.addEventListener('pagehide', write);
  if (document.readyState !== 'loading') bindHero();
  if (new URLSearchParams(location.search).get('panel') === '1') {
    setTimeout(() => {
      const panel=document.createElement('pre');
      panel.id='performance-panel';
      panel.style.cssText='position:fixed;bottom:12px;right:12px;z-index:99999;padding:14px;background:#111;color:#fff;border:1px solid #888;font:13px/1.6 monospace;max-width:360px;white-space:pre-wrap';
      document.body.append(panel);
      const show=()=>{const data=JSON.parse(document.getElementById('portfolio-performance').textContent);panel.textContent=Object.entries(data.metrics).filter(([k])=>['ttfbMs','domContentLoadedMs','loadMs','firstContentfulPaintMs','largestContentfulPaintMs','initialTransferBytes','initialRequests','longTaskBlockingMsBeforeLoad'].includes(k)).map(([k,v])=>k+': '+v).join('\n');};
      show();new MutationObserver(show).observe(document.getElementById('portfolio-performance'),{childList:true});
    },2500);
  }
  write();
})();
