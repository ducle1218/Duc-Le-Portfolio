/* Quiet, page-specific mathematical contours. Decorative, static, and untiled. */
(() => {
  'use strict';
  const layer = document.querySelector('.portfolio-atmosphere');
  if (!layer) return;
  const ns = 'http://www.w3.org/2000/svg';
  let previous = '';
  let frame = 0;
  let layoutWidth = 0;
  let spacingHeight = 0;

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

  function element(tag, attributes = {}) {
    const node = document.createElementNS(ns, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  }

  // Harmonic radial fields suggest cams, vibration modes, and rounded stress
  // contours. These are decorative mathematical shapes, not simulation results.
  const profiles = {
    home: {lobes: 3, amplitude: .10, squash: .43, tilt: -.20},
    project: {lobes: 2, amplitude: .17, squash: .48, tilt: -.28},
    resume: {lobes: 2, amplitude: .06, squash: .62, tilt: .15},
    contact: {lobes: 3, amplitude: .13, squash: .52, tilt: -.15},
    'detail-box-12': {lobes: 3, amplitude: .14, squash: .47, tilt: -.20},
    'detail-box-7': {lobes: 2, amplitude: .05, squash: .62, tilt: .10},
    'detail-box-11': {lobes: 4, amplitude: .07, squash: .49, tilt: -.15},
    'detail-box-6': {lobes: 2, amplitude: .16, squash: .45, tilt: .20}
  };

  function contourPath(radius, shape) {
    const points = [];
    const count = 64;
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2;
      const harmonic = 1 + shape.amplitude * Math.cos(shape.lobes * angle + shape.phase) +
        .035 * Math.sin(3 * angle - shape.phase);
      const x = shape.size * radius * harmonic * Math.cos(angle);
      const y = shape.size * radius * harmonic * Math.sin(angle) * shape.squash;
      // A small, bounded drift gives the nested levels a sloping summit.
      points.push({x: x + shape.size * .10 * (1 - radius),
        y: y + x * shape.tilt - shape.size * .08 * (1 - radius)});
    }
    const p = value => value.toFixed(1);
    let d = `M${p(points[0].x)},${p(points[0].y)}`;
    for (let i = 0; i < count; i++) {
      const a = points[(i + count - 1) % count];
      const b = points[i];
      const c = points[(i + 1) % count];
      const e = points[(i + 2) % count];
      d += `C${p(b.x + (c.x - a.x) / 6)},${p(b.y + (c.y - a.y) / 6)} ` +
        `${p(c.x - (e.x - b.x) / 6)},${p(c.y - (e.y - b.y) / 6)} ${p(c.x)},${p(c.y)}`;
    }
    return d + 'Z';
  }

  function landscape(svg, width, height, page, viewportHeight) {
    const random = randomFor(page);
    const mobile = width < 650;
    const profile = profiles[page] || {
      lobes: 2 + Math.floor(random() * 3), amplitude: .07 + random() * .07,
      squash: .45 + random() * .12, tilt: (random() - .5) * .35
    };
    const size = Math.max(220, Math.min(390, width * .29));
    // Keep an entire viewport of quiet space between the bounded motifs.
    // Positions do not depend on document height: expanding content only adds art.
    const gap = Math.max(1100, viewportHeight + size * 1.5);
    let y = page === 'home' ? (mobile ? 380 : Math.max(690, Math.min(920, width * .45))) : (mobile ? 330 : 390);
    let index = 0;
    while (y - size < height) {
      const right = index % 2 === 0;
      const shape = {...profile, size: size * (.86 + random() * .14),
        phase: random() * Math.PI * 2, tilt: profile.tilt * (right ? 1 : -1)};
      const x = width * (page === 'home' && index === 0 && !mobile ? .58 :
        (right ? (mobile ? .99 : .85) : (mobile ? .01 : .13)));
      const group = element('g', {'data-contour': index, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})`});
      // One faint surface, with a handful of readable contour levels above it.
      group.append(element('path', {d: contourPath(1, shape), fill: 'url(#contour-surface)'}));
      const lines = element('g', {fill: 'none', stroke: 'currentColor', 'stroke-width': '.8'});
      const count = mobile ? 6 : 9;
      for (let line = 0; line < count; line++) {
        const t = line / (count - 1);
        const radius = 1 - t * .78;
        const opacity = line === 0 ? .10 : (line % 3 === 1 ? .34 : .22);
        lines.append(element('path', {d: contourPath(radius, shape), 'stroke-opacity': opacity}));
      }
      group.append(lines);
      svg.append(group);
      y += gap + random() * 260;
      index++;
    }
  }

  function render() {
    frame = 0;
    const width = Math.round(document.body.clientWidth);
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    // Mobile browser chrome changes innerHeight while scrolling. Keep the
    // composition still until the available width (or orientation) changes.
    if (width !== layoutWidth) {
      layoutWidth = width;
      spacingHeight = window.innerHeight;
    }
    const viewportHeight = spacingHeight;
    const page = document.body.dataset.atmospherePage || 'home';
    const signature = `${page}:${width}:${height}:${viewportHeight}`;
    if (!width || !height || signature === previous) return;
    previous = signature;
    const svg = element('svg', {viewBox: `0 0 ${width} ${height}`,
      preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false'});
    // An explicit height prevents the old drawing stretching between resize
    // notifications when an accordion or a filter changes the document length.
    svg.style.height = `${height}px`;
    const defs = element('defs');
    const surface = element('linearGradient', {id: 'contour-surface', x1: '0%', y1: '0%', x2: '70%', y2: '100%'});
    surface.append(element('stop', {offset: '0', 'stop-color': 'currentColor', 'stop-opacity': '.045'}),
      element('stop', {offset: '.6', 'stop-color': 'currentColor', 'stop-opacity': '.018'}),
      element('stop', {offset: '1', 'stop-color': 'currentColor', 'stop-opacity': '0'}));
    defs.append(surface);
    svg.append(defs);
    landscape(svg, width, height, page, viewportHeight);
    layer.dataset.page = page;
    layer.replaceChildren(svg);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(render);
  }
  new ResizeObserver(schedule).observe(document.body);
  new MutationObserver(schedule).observe(document.body, {
    attributes: true, attributeFilter: ['data-atmosphere-page']
  });
  window.addEventListener('resize', schedule, {passive: true});
  render();
})();
