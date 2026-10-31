/* A slow spotlight that rests while someone is reading or interacting. */
(() => {
  const projects = SPOTLIGHT_PROJECTS;
  const responsive = {"optimized/quadruped-hero-640.webp":"src/assets/images/optimized/quadruped-hero-640.webp 640w, src/assets/images/optimized/quadruped-hero-960.webp 960w, src/assets/images/optimized/quadruped-hero-1280.webp 1280w","optimized/volumetric-display-hero-640.webp":"src/assets/images/optimized/volumetric-display-hero-640.webp 640w, src/assets/images/optimized/volumetric-display-hero-960.webp 960w, src/assets/images/optimized/volumetric-display-hero-1280.webp 1280w","optimized/fea-hero-640.webp":"src/assets/images/optimized/fea-hero-640.webp 640w, src/assets/images/optimized/fea-hero-960.webp 960w, src/assets/images/optimized/fea-hero-1280.webp 1280w","optimized/sprocket-hero-640.webp":"src/assets/images/optimized/sprocket-hero-640.webp 640w, src/assets/images/optimized/sprocket-hero-755.webp 755w"};
  const image = document.getElementById('spotlight-image');
  const open = document.getElementById('spotlight-open');
  const consoleEl = document.querySelector('.project-console');
  const caption = document.querySelector('.spotlight-caption');
  const toggle = document.getElementById('spotlight-toggle');
  const buttons = [...document.querySelectorAll('[data-spotlight]')];
  if (!image || !open || !consoleEl || !toggle) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const hover = matchMedia('(hover: hover)');
  const dwell = 9000;
  let current = 0, revision = 0, timer = 0, started = 0, remaining = dwell;
  let paused = reduced.matches, over = false, visible = false, loading = false, automaticRequest = false;
  let progress;
  const decoded = new Map();
  const canRotate = () => !paused && !reduced.matches && !over && visible &&
    !document.hidden && !document.documentElement.classList.contains('motion-paused') &&
    (!document.body.dataset.atmospherePage || document.body.dataset.atmospherePage === 'home');

  function stopClock() {
    if (timer) remaining = Math.max(0, remaining - (performance.now() - started));
    clearTimeout(timer);
    timer = 0;
    progress?.pause();
  }
  function resetClock() {
    stopClock();
    remaining = dwell;
    progress?.cancel();
    progress = buttons[current].querySelector('.spotlight-progress').animate(
      [{transform:'scaleX(0)'},{transform:'scaleX(1)'}], {duration:dwell, fill:'forwards'});
    progress.pause();
  }
  function sync() {
    // Pausing also cancels a pending automatic decode, before it can replace the focused card.
    if (automaticRequest && !canRotate()) {
      revision++;
      automaticRequest = false;
      loading = false;
      resetClock();
    }
    const running = canRotate() && !loading;
    consoleEl.dataset.rotation = loading ? 'loading' : running ? 'running' : 'paused';
    const manual = paused || reduced.matches || document.documentElement.classList.contains('motion-paused');
    caption.setAttribute('aria-live', manual ? 'polite' : 'off');
    toggle.disabled = reduced.matches;
    toggle.setAttribute('aria-label', reduced.matches ? 'Automatic rotation disabled for reduced motion' : paused ? 'Play project rotation' : 'Pause project rotation');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.innerHTML = reduced.matches ? '<i aria-hidden="true">−</i> Manual' : paused ? '<i aria-hidden="true">▶</i> Play' : '<i aria-hidden="true">Ⅱ</i> Pause';
    if (!running) { stopClock(); return; }
    if (timer) return;
    started = performance.now();
    progress?.play();
    timer = setTimeout(() => {
      timer = 0;
      remaining = 0;
      select((current + 1) % projects.length, false);
    }, remaining);
  }
  function prepare(index) {
    if (!decoded.has(index)) {
      const next = new Image();
      next.decoding = 'async';
      next.fetchPriority = 'low';
      next.sizes = image.sizes;
      next.srcset = responsive[projects[index][4]];
      next.src = 'src/assets/images/' + projects[index][4];
      decoded.set(index, next.decode().catch(error => { decoded.delete(index); throw error; }));
    }
    return decoded.get(index);
  }
  async function select(index, manual = true) {
    const token = ++revision;
    stopClock();
    loading = true;
    automaticRequest = !manual;
    sync();
    if (token !== revision) return;
    try {
      await prepare(index);
      if (token !== revision) return;
      consoleEl.querySelectorAll('.spotlight-outgoing').forEach(item => item.remove());
      image.getAnimations().forEach(animation => animation.cancel());
      caption.getAnimations().forEach(animation => animation.cancel());
      const previous = image.cloneNode();
      previous.removeAttribute('id');
      previous.alt = '';
      previous.className = 'spotlight-outgoing';
      previous.setAttribute('aria-hidden','true');
      const animate = !reduced.matches && !document.documentElement.classList.contains('motion-paused') && index !== current;
      if (animate) open.append(previous);
      const [id,title,summary,tag,src] = projects[index];
      image.srcset = responsive[src] || '';
      image.src = 'src/assets/images/' + src;
      image.alt = title;
      open.onclick = () => showProjectDetail(id);
      open.setAttribute('aria-label','View ' + title + ' project');
      document.getElementById('spotlight-title').textContent = title;
      document.getElementById('spotlight-summary').textContent = summary;
      document.getElementById('spotlight-tag').textContent = tag;
      document.getElementById('spotlight-count').textContent = '0' + (index + 1) + ' / 04';
      buttons.forEach((item,i) => item.setAttribute('aria-pressed',String(i === index)));
      if (animate) {
        image.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'ease-out'});
        const fade = previous.animate([{opacity:1},{opacity:0}],{duration:500,easing:'ease-out'});
        fade.finished.then(() => previous.remove()).catch(() => previous.remove());
        caption.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,easing:'ease-out'});
      }
      current = index;
      consoleEl.dataset.project = id;
    } catch {
      // A failed optional image must leave the current project usable.
    } finally {
      if (token === revision) { loading = false; automaticRequest = false; resetClock(); sync(); }
    }
  }
  buttons.forEach((button,index) => button.addEventListener('click', () => {
    paused = true;
    select(index);
  }));
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  consoleEl.addEventListener('mouseenter', () => { over = hover.matches; sync(); });
  consoleEl.addEventListener('mouseleave', () => { over = false; sync(); });
  consoleEl.addEventListener('focusin', event => {
    if (event.target !== toggle) { paused = true; sync(); }
  });
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('portfolio-motion', sync);
  reduced.addEventListener('change', () => { if (reduced.matches) paused = true; sync(); });
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['data-atmosphere-page']});
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  },{threshold:.2}).observe(consoleEl);
  consoleEl.dataset.project = projects[0][0];
  resetClock();
  sync();
  // Decorative airflow runs only while its section can be seen.
  const contactFlow = document.querySelector('.contact-flow');
  if (contactFlow) new IntersectionObserver(entries => {
    contactFlow.classList.toggle('is-visible', entries[0].isIntersecting);
  }).observe(contactFlow);
})();
