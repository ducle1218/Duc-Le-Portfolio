/* Continuous, page-specific linework. No tiles, scroll handler, or animation loop. */
(() => {
  'use strict';
  const layer = document.querySelector('.portfolio-atmosphere');
  if (!layer) return;
  const ns = 'http://www.w3.org/2000/svg';
  let previous = '';
  let frame = 0;

  function randomFor(key) {
    let state = 2166136261;
    for (const char of key) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
    return () => {
      state += 0x6d2b79f5;
      let value = Math.imul(state ^ state >>> 15, 1 | state);
      value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function ribbon(width, height, key, secondary) {
    const random = randomFor(key);
    const rhythm = Math.max(720, Math.min(1250, width * .7));
    const anchors = [];
    let y = -rhythm;
    let index = 0;
    const phase = random() > .5 ? 1 : 0;

    // Anchor spacing and curvature vary along the document. Their coordinates
    // never depend on its final height, so expanding content preserves the art above.
    // Two extra spans also keep the visible end's spline tangents stable.
    while (y < height + rhythm * 3) {
      const right = (index + phase) % 2 === 0;
      const x = (right ? .78 + random() * .38 : -.16 + random() * .38) * width;
      const spread = width * (.20 + random() * .32) * (random() > .35 ? 1 : -1);
      anchors.push({
        x: secondary ? width - x : x,
        y,
        spread: spread * (secondary ? .6 : 1),
        sweep: (random() - .5) * rhythm * .6,
        bow: (random() - .5) * width * .14
      });
      y += rhythm * (.72 + random() * .65);
      index++;
    }

    const group = document.createElementNS(ns, 'g');
    group.setAttribute('fill', 'none');
    group.setAttribute('stroke', 'currentColor');
    group.setAttribute('stroke-width', secondary ? '.6' : '.75');
    const count = width < 650 ? (secondary ? 14 : 30) : (secondary ? 22 : 46);
    const point = value => value.toFixed(1);
    for (let line = 0; line < count; line++) {
      const t = line / (count - 1);
      const offset = t - .5;
      const points = anchors.map(anchor => ({
        x: anchor.x + offset * anchor.spread + Math.sin(t * Math.PI) * anchor.bow,
        y: anchor.y + offset * anchor.sweep
      }));
      let d = `M${point(points[0].x)},${point(points[0].y)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[Math.max(0, i - 1)];
        const b = points[i];
        const c = points[i + 1];
        const e = points[Math.min(points.length - 1, i + 2)];
        d += `C${point(b.x + (c.x - a.x) / 6)},${point(b.y + (c.y - a.y) / 6)} ` +
          `${point(c.x - (e.x - b.x) / 6)},${point(c.y - (e.y - b.y) / 6)} ` +
          `${point(c.x)},${point(c.y)}`;
      }
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke-opacity', ((secondary ? .10 : .22) + Math.sin(t * Math.PI) * (secondary ? .06 : .15)).toFixed(3));
      group.appendChild(path);
    }
    return group;
  }

  function render() {
    frame = 0;
    const width = Math.round(document.body.clientWidth);
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    const page = document.body.dataset.atmospherePage || 'home';
    const signature = `${page}:${width}:${height}`;
    if (!width || !height || signature === previous) return;
    previous = signature;
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    // Retain the measured height between resize notifications; percentage height
    // would briefly stretch the previous drawing when an accordion opens.
    svg.style.height = `${height}px`;
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.append(ribbon(width, height, page + '/flow', false), ribbon(width, height, page + '/echo', true));
    layer.dataset.page = page;
    layer.replaceChildren(svg);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  new ResizeObserver(schedule).observe(document.body);
  new MutationObserver(schedule).observe(document.body, {
    attributes: true,
    attributeFilter: ['data-atmosphere-page']
  });
  window.addEventListener('resize', schedule, {passive: true});
  render();
})();
