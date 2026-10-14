/* Small, optional motion enhancements; all portfolio content works without them. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const motion = document.getElementById('motion-toggle');
  const film = document.getElementById('hero-bg-video');
  const filmButton = document.getElementById('film-toggle');
  const machine = document.querySelector('.hero-machine');
  const features = {
    robot:{id:'box-12',image:'quadruped-robot/folded-configuration.webp',alt:'CAD of the quadruped robot with all four legs folded beneath its chassis',label:'01 / QUADRUPED ROBOT',title:'Four legs. One compact fold.',status:'Latest CAD configuration · prototype in progress'},
    display:{id:'box-7',image:'volumetric-display/radial-arm-assembly.webp',alt:'CAD of a volumetric display rotor with twenty radial arms',label:'02 / VOLUMETRIC DISPLAY',title:'A new dimension for light.',status:'20-arm rotor architecture · mechanical development'},
    fea:{id:'box-11',image:'fea/aligner-load-stress.png',alt:'Stress contour of the two-plate robot aligner',label:'03 / STRUCTURAL ANALYSIS',title:'See where the load goes.',status:'Two-plate aligner · preliminary FEA'}
  };
  const featureButtons = [...document.querySelectorAll('[data-feature]')];
  const stage = document.querySelector('.machine-stage');
  let lastFeatureChange = Date.now();
  function selectFeature(button) {
    const f=features[button.dataset.feature];
    document.querySelectorAll('[data-feature]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    machine.dataset.project=f.id;
    machine.setAttribute('aria-label',`Explore ${f.label.split(' / ')[1].toLowerCase()}`);
    machine.querySelector('img').src=`src/assets/images/${f.image}`;
    machine.querySelector('img').alt=f.alt;
    machine.querySelector('.machine-label').textContent=f.label;
    const caption=machine.querySelector('.machine-caption>span');
    caption.replaceChildren(document.createTextNode(f.title));
    const small=document.createElement('small');small.textContent=f.status;caption.appendChild(small);
    lastFeatureChange = Date.now();
  }
  featureButtons.forEach(button=>button.addEventListener('click',()=>selectFeature(button)));
  let paused = reduced.matches;
  function updateFilmButton() {
    filmButton.innerHTML = film.paused ? 'Play film <span>▶</span>' : 'Pause film <span>Ⅱ</span>';
    filmButton.setAttribute('aria-label',film.paused?'Play robot build video':'Pause robot build video');
  }
  function applyMotion() {
    root.classList.toggle('motion-paused',paused);
    motion.setAttribute('aria-pressed',String(paused));
    motion.innerHTML = paused ? 'Enable motion <span>▶</span>' : 'Pause motion <span>Ⅱ</span>';
    if (paused) { film.pause(); film.dataset.userPlaying='false'; }
  }
  motion.addEventListener('click',()=>{paused=!paused;applyMotion();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;applyMotion();});
  filmButton.addEventListener('click',()=>{
    if (film.paused) {film.dataset.userPlaying='true';film.play().catch(updateFilmButton);}
    else {film.dataset.userPlaying='false';film.pause();}
  });
  film.addEventListener('play',updateFilmButton);
  film.addEventListener('pause',updateFilmButton);
  applyMotion();
  // Cycle only while the showcase is visible and the visitor is not interacting.
  let stageVisible = false;
  new IntersectionObserver(entries=>{stageVisible=entries[0].isIntersecting;},{threshold:.5}).observe(stage);
  window.setInterval(()=>{
    if(paused || document.hidden || !stageVisible || stage.matches(':hover') || stage.contains(document.activeElement) || Date.now()-lastFeatureChange<7000) return;
    const current=featureButtons.findIndex(b=>b.getAttribute('aria-pressed')==='true');
    selectFeature(featureButtons[(current+1)%featureButtons.length]);
  },1000);
  const observer = new IntersectionObserver(entries=>entries.forEach(entry=>{
    if (entry.isIntersecting) {entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}
  }),{threshold:.08});
  document.querySelectorAll('.section-heading,.workbench-copy,.workbench-film,.studio-contact-cta').forEach(el=>{
    if (!reduced.matches) el.classList.add('reveal-ready');
    observer.observe(el);
  });
  new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)film.pause();
    else if(film.dataset.userPlaying==='true'&&!paused)film.play().catch(()=>{});
  }),{threshold:.15}).observe(film);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)film.pause();});
})();
