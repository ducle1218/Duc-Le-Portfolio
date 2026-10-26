/* Static 3D contour surfaces with continuous, narrow outgoing ribbons. */
(() => {
  'use strict';
  const layer = document.querySelector('.portfolio-atmosphere');
  if (!layer) return;
  let frame = 0;
  let layoutKey = '';
  let layoutWidth = 0;
  let spacingHeight = 0;
  const scenes = [];
  const artwork = new Map();
  const pending = new WeakMap();
  const sceneObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const draw = pending.get(entry.target);
      if (draw) { draw(); pending.delete(entry.target); }
      sceneObserver.unobserve(entry.target);
    }
  }, {rootMargin: '450px 0px'});
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  function seed(key) {
    let value = 2166136261;
    for (const char of key) value = Math.imul(value ^ char.charCodeAt(0), 16777619);
    return value >>> 0;
  }

  // These are decorative mathematical surfaces, not project simulation results.
  function surface(u, v, kind) {
    const x = -1.4 + 2.8 * u;
    let z;
    if (kind === 0) {
      z = 1.45 * Math.exp(-2.7 * (x + .22) ** 2 - 2.4 * (v + .08) ** 2) +
        .42 * Math.exp(-8 * (x - .64) ** 2 - 5 * (v - .24) ** 2);
    } else if (kind === 1) {
      z = .75 + .48 * Math.cos(x * 2.1) * Math.cos(v * 2.5) +
        .48 * Math.sin(x * 2.2 + v * 1.2);
    } else if (kind === 2) {
      z = 1.2 * Math.exp(-5 * (x + .58) ** 2 - 3 * (v + .18) ** 2) +
        1.04 * Math.exp(-6 * (x - .48) ** 2 - 3.5 * (v - .3) ** 2);
    } else {
      z = .8 + .5 * (x * x / 1.96 - v * v) + .22 * Math.sin(2 * x + v);
    }
    // The right edge meets the ribbon with zero height and slope.
    z *= 1 - smooth((u - .78) / .22);
    return [x, v, z];
  }

  function ribbon(t, v) {
    const width = .13 + .87 * (1 - smooth(t / .28));
    const exit = smooth(t / .18);
    const twist = t * Math.PI * 1.45 * exit;
    return [1.4 + 3.3 * t, -.18 * Math.sin(t * Math.PI) * exit + v * width * Math.cos(twist),
      (1.45 * Math.sin(t * Math.PI / 2) + .36 * Math.sin(t * Math.PI * 2)) * exit +
      v * width * Math.sin(twist)];
  }

  function toroidal(u, v) {
    const phi = (v + 1) * Math.PI;
    let center, normal, binormal, a, b;
    if (u <= 1) {
      const angle = (-370 + 280 * u) * Math.PI / 180;
      center = [1.23 * Math.cos(angle), 1.23 * Math.sin(angle), 0];
      normal = [Math.cos(angle), Math.sin(angle), 0];
      binormal = [0, 0, 1];
      a = b = .40;
    } else {
      const t = (u - 1) / 1.25, s = 1 - t;
      const controls = [[0, -1.23, 0], [1.42, -1.23, 0], [2.75, .58, .52], [4.52, .20, .13]];
      center = [0, 1, 2].map(i => s ** 3 * controls[0][i] + 3 * s * s * t * controls[1][i] +
        3 * s * t * t * controls[2][i] + t ** 3 * controls[3][i]);
      const tangent = [0, 1, 2].map(i => 3 * s * s * (controls[1][i] - controls[0][i]) +
        6 * s * t * (controls[2][i] - controls[1][i]) + 3 * t * t * (controls[3][i] - controls[2][i]));
      const length = Math.hypot(...tangent);
      tangent.forEach((value, i) => { tangent[i] = value / length; });
      const nLength = Math.hypot(tangent[0], tangent[1]);
      const n = [tangent[1] / nLength, -tangent[0] / nLength, 0];
      const bn = [n[1] * tangent[2], -n[0] * tangent[2], n[0] * tangent[1] - n[1] * tangent[0]];
      const angle = smooth(t) * Math.PI * 1.25;
      normal = n.map((value, i) => value * Math.cos(angle) + bn[i] * Math.sin(angle));
      binormal = n.map((value, i) => -value * Math.sin(angle) + bn[i] * Math.cos(angle));
      const flatten = smooth(t / .28);
      a = .40 * (1 - flatten) + .22 * flatten;
      b = .40 * (1 - flatten) + .004 * flatten;
    }
    const point = center.map((value, i) => value + a * Math.cos(phi) * normal[i] + b * Math.sin(phi) * binormal[i]);
    const y = .574 * point[1] - .819 * point[2];
    const z = .819 * point[1] + .574 * point[2];
    return [.927 * point[0] - .375 * z, y, .375 * point[0] + .927 * z];
  }

  function renderScene(kind, mobile, variation) {
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 620;
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');
    const cacheKey = kind + ':' + mobile + ':' + variation;
    const cached = artwork.get(cacheKey);
    if (cached) {
      ctx.drawImage(cached, 0, 0);
      return canvas;
    }
    const width = canvas.width, height = canvas.height;
    const depth = new Float32Array(width * height).fill(-Infinity);
    const pixels = ctx.createImageData(width, height);
    const scale = 155;
    const project = p => kind === 4 ? [330 + scale * p[0], 300 + scale * p[1], p[2]] : [330 + scale * (.94 * p[0] + .342 * p[1]),
      415 + scale * (-.145 * p[0] + .397 * p[1] - .906 * p[2]),
      -.310 * p[0] + .852 * p[1] + .423 * p[2]];
    const world = (u, v) => {
      const p = kind === 4 ? toroidal(u, v) :
        (u <= 1 ? surface(u, v, kind) : ribbon((u - 1) / 1.25, v));
      const shape = variation / 997;
      return [p[0] * (.94 + shape * .12), p[1] * (.9 + shape * .2), p[2] * (.84 + shape * .28)];
    };
    const rows = 48, cols = 144;
    const vertices = [];
    for (let row = 0; row <= rows; row++) {
      const v = -1 + 2 * row / rows;
      for (let col = 0; col <= cols; col++) {
        const u = 2.25 * col / cols;
        const p = world(u, v);
        const a = world(clamp(u + .002, 0, 2.25), v);
        const b = world(u, clamp(v + .002, -1, 1));
        const du = a.map((n, i) => n - p[i]), dv = b.map((n, i) => n - p[i]);
        const normal = [du[1] * dv[2] - du[2] * dv[1],
          du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]];
        const length = Math.hypot(...normal) || 1;
        const light = Math.abs((normal[0] * -.35 + normal[1] * -.4 + normal[2] * .84) / length);
        const alpha = u > 1 ? .025 + light * .035 : .025 + light * .12;
        vertices.push([...project(p), alpha]);
      }
    }

    function triangle(a, b, c) {
      const denom = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(denom) < .001) return;
      const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0])));
      const x1 = Math.min(width - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
      const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1])));
      const y1 = Math.min(height - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const wa = ((b[1] - c[1]) * (x + .5 - c[0]) + (c[0] - b[0]) * (y + .5 - c[1])) / denom;
          const wb = ((c[1] - a[1]) * (x + .5 - c[0]) + (a[0] - c[0]) * (y + .5 - c[1])) / denom;
          const wc = 1 - wa - wb;
          if (wa < 0 || wb < 0 || wc < 0) continue;
          const z = wa * a[2] + wb * b[2] + wc * c[2];
          const index = y * width + x;
          if (z <= depth[index]) continue;
          depth[index] = z;
          const px = index * 4;
          pixels.data[px] = pixels.data[px + 1] = pixels.data[px + 2] = 220;
          pixels.data[px + 3] = 255 * (wa * a[3] + wb * b[3] + wc * c[3]);
        }
      }
    }
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * (cols + 1) + col;
        triangle(vertices[i], vertices[i + 1], vertices[i + cols + 1]);
        triangle(vertices[i + 1], vertices[i + cols + 2], vertices[i + cols + 1]);
      }
    }
    ctx.putImageData(pixels, 0, 0);

    // Depth-tested contours: rear lines disappear behind the 3D surface.
    // Each curve continues across the surface boundary into the same ribbon.
    const count = kind === 4 ? (mobile ? 28 : 36) : (mobile ? 16 : 22);
    ctx.lineWidth = .85;
    ctx.lineCap = 'butt';
    const strokes = Array.from({length: 32}, () => new Path2D());
    for (let line = 0; line < count; line++) {
      const v = -1 + 2 * line / (count - 1);
      let previousPoint;
      for (let sample = 0; sample <= 620; sample++) {
        const u = 2.25 * sample / 620;
        const p = project(world(u, v));
        const x = Math.floor(p[0]), y = Math.floor(p[1]);
        const visible = x >= 0 && x < width && y >= 0 && y < height &&
          p[2] >= depth[y * width + x] - .018;
        if (visible && previousPoint) {
          const lift = smooth((u - .94) / .3);
          const fade = 1 - smooth((u - 2.05) / .2);
          const bucket = Math.round((.19 + lift * .42) * fade * 50);
          strokes[bucket].moveTo(previousPoint[0], previousPoint[1]);
          strokes[bucket].lineTo(p[0], p[1]);
        }
        previousPoint = visible ? p : null;
      }
    }
    strokes.forEach((path, bucket) => {
      ctx.strokeStyle = 'rgba(220,226,232,' + bucket / 50 + ')';
      ctx.stroke(path);
    });
    // Limit retained raster copies when visitors explore many long case studies.
    if (artwork.size >= 6) artwork.delete(artwork.keys().next().value);
    artwork.set(cacheKey, canvas);
    return canvas;
  }

  function render() {
    frame = 0;
    const width = Math.round(document.body.clientWidth);
    const height = Math.ceil(document.body.getBoundingClientRect().height);
    if (!width || !height) return;
    if (width !== layoutWidth) {
      layoutWidth = width;
      spacingHeight = window.innerHeight;
    }
    const page = document.body.dataset.atmospherePage || 'home';
    const key = page + ':' + width;
    const mobile = width < 650;
    const artWidth = mobile ? Math.min(580, width * 1.35) : Math.max(580, Math.min(1120, width * .75));
    const artHeight = artWidth * 620 / 1100;
    const gap = Math.max(1350, spacingHeight + artHeight + 150);
    const heroEnd = document.querySelector('.discipline-strip')?.offsetTop || 750;
    const first = page === 'home' ? (mobile ? 300 : heroEnd - 100) : (mobile ? 275 : 50);
    if (key !== layoutKey) {
      layoutKey = key;
      sceneObserver.disconnect();
      layer.replaceChildren();
      scenes.length = 0;
    }
    const needed = Math.max(1, Math.ceil((height - first) / gap));
    while (scenes.length > needed) {
      const removed = scenes.pop();
      sceneObserver.unobserve(removed);
      removed.remove();
    }
    for (let index = 0; index < needed; index++) {
      if (scenes[index]) continue;
      const kind = page === 'home' && index === 0 ? 4 : (seed(page) + index) % 5;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 1;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.dataset.contourScene = String(index);
      canvas.dataset.surface = ['gaussian-mode', 'wave-mode', 'coupled-peaks', 'saddle', 'toroidal-shell'][kind];
      canvas.style.width = artWidth + 'px';
      canvas.style.height = artHeight + 'px';
      canvas.style.top = (first + index * gap) + 'px';
      const right = index % 2 === 0;
      canvas.style.left = (mobile ? -width * .04 : right ? (page === 'home' && index === 0 ? width * .25 : width * .34) :
        -artWidth * .16) + 'px';
      if (!right) canvas.style.transform = 'scaleX(-1)';
      layer.append(canvas);
      scenes.push(canvas);
      const draw = () => {
        const rendered = renderScene(kind, mobile, seed(page + '/' + index) % 997);
        canvas.width = rendered.width;
        canvas.height = rendered.height;
        canvas.getContext('2d').drawImage(rendered, 0, 0);
      };
      const bounds = canvas.getBoundingClientRect();
      if (bounds.top < window.innerHeight + 450 && bounds.bottom > -450) draw();
      else { pending.set(canvas, draw); sceneObserver.observe(canvas); }
    }
    layer.dataset.page = page;
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
