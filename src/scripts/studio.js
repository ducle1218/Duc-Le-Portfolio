/* Small, optional motion enhancements; all portfolio content works without them. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  const theme = document.getElementById('theme-toggle');
  theme.innerHTML = '<span class="theme-sky" aria-hidden="true"><span class="theme-sun">☀</span><span class="theme-moon">☾</span></span><span class="theme-label"></span>';
  function applyTheme() {
    const dark = root.classList.contains('dark');
    theme.querySelector('.theme-label').textContent = dark ? 'Dark mode' : 'Light mode';
    theme.setAttribute('aria-pressed',String(dark));
    theme.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
  }
  theme.addEventListener('click',()=>{
    root.classList.toggle('dark');
    try { localStorage.setItem('portfolio-theme',root.classList.contains('dark')?'dark':'light'); } catch(e) {}
    applyTheme();
  });
  applyTheme();
  const sound = document.getElementById('film-sound');
  sound.addEventListener('click',()=>{
    film.muted=!film.muted;
    sound.textContent=film.muted?'Unmute sound':'Mute sound';
    sound.setAttribute('aria-pressed',String(!film.muted));
  });
  const motion = document.getElementById('motion-toggle');
  const film = document.getElementById('hero-bg-video');
  const filmButton = document.getElementById('film-toggle');
  const machine = document.querySelector('.hero-machine');
  const features = {
    robot:{id:'box-12',image:'quadruped-robot/hero-cutout.png',alt:'CAD of the quadruped robot with all four legs folded beneath its chassis',label:'01 / QUADRUPED ROBOT',title:'Four legs. One compact fold.',status:'Latest CAD configuration · prototype in progress'},
    display:{id:'box-7',image:'volumetric-display/hero-cutout.png',alt:'CAD of a volumetric display rotor with twenty radial arms',label:'02 / VOLUMETRIC DISPLAY',title:'A new dimension for light.',status:'20-arm rotor architecture · mechanical development'},
    fea:{id:'box-11',image:'fea/hero-cutout.png',alt:'Stress contour of the two-plate robot aligner',label:'03 / STRUCTURAL ANALYSIS',title:'See where the load goes.',status:'Two-plate aligner · preliminary FEA'}
  };
  const featureButtons = [...document.querySelectorAll('[data-feature]')];
  const stage = document.querySelector('.machine-stage');
  const planetLayer = document.createElement('div');
  planetLayer.className = 'project-planets';
  planetLayer.setAttribute('aria-label','Other featured projects');
  stage.appendChild(planetLayer);
  let currentFeature = 'robot';
  let orbitAngle = 0;
  let orbitTurn = null;
  let entrance = null;
  const planets = [0,1].map(() => {
    const planet = document.createElement('button');
    planet.type = 'button';
    planet.className = 'project-planet';
    planet.innerHTML = '<img alt="" draggable="false"><span></span>';
    planet.addEventListener('click',()=>selectFeature(featureButtons.find(b=>b.dataset.feature===planet.dataset.projectKey),planet));
    planetLayer.appendChild(planet);
    return planet;
  });
  function updatePlanets() {
    Object.keys(features).filter(key=>key!==currentFeature).forEach((key,i)=>{
      const p=planets[i],f=features[key],name=f.label.split(' / ')[1];
      p.dataset.projectKey=key;
      p.setAttribute('aria-label',`Show ${name.toLowerCase()} in the showcase`);
      p.querySelector('img').src=`src/assets/images/${f.image}`;
      p.querySelector('span').textContent=name;
    });
  }
  updatePlanets();
  let lastFeatureChange = Date.now();
  function selectFeature(button, source) {
    if (button.dataset.feature===currentFeature) return;
    const origin=(source || planets.find(p=>p.dataset.projectKey===button.dataset.feature))?.getBoundingClientRect();
    entrance?.cancel();
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
    currentFeature=button.dataset.feature;
    updatePlanets();
    if (!paused && !reduced.matches) {
      const img=machine.querySelector('img'),rect=img.getBoundingClientRect();
      const x=origin ? origin.x+origin.width/2-rect.x-rect.width/2 : 0;
      const y=origin ? origin.y+origin.height/2-rect.y-rect.height/2 : 0;
      entrance=img.animate([{transform:`translate(${x}px,${y}px) scale(.16) rotate(-150deg)`,opacity:.3},{transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1}],{duration:850,easing:'cubic-bezier(.22,.75,.2,1)'});
      orbitTurn={start:performance.now(),from:orbitAngle};
    }
    lastFeatureChange = Date.now();
  }
  featureButtons.forEach(button=>button.addEventListener('click',()=>selectFeature(button)));
  let paused = reduced.matches;
  let filmVisible = false;
  let filmManuallyPaused = false;
  function syncFilm() {
    if (paused || filmManuallyPaused || !filmVisible || document.hidden) film.pause();
    else film.play().catch(updateFilmButton);
  }
  function updateFilmButton() {
    filmButton.innerHTML = film.paused ? 'Play film <span>▶</span>' : 'Pause film <span>Ⅱ</span>';
    filmButton.setAttribute('aria-label',film.paused?'Play robot build video':'Pause robot build video');
  }
  function applyMotion() {
    root.classList.toggle('motion-paused',paused);
    motion.setAttribute('aria-pressed',String(paused));
    motion.innerHTML = paused ? 'Enable animation <span>▶</span>' : 'Pause animation <span>Ⅱ</span>';
    if(paused){entrance?.cancel();orbitTurn=null;}
    syncFilm();
  }
  motion.addEventListener('click',()=>{paused=!paused;applyMotion();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;applyMotion();});
  filmButton.addEventListener('click',()=>{
    if (film.paused) {filmManuallyPaused=false;film.play().catch(updateFilmButton);}
    else {filmManuallyPaused=true;film.pause();}
  });
  film.addEventListener('play',updateFilmButton);
  film.addEventListener('pause',updateFilmButton);
  applyMotion();
  // Cycle only while the showcase is visible and the visitor is not interacting.
  let stageVisible = false;
  new IntersectionObserver(entries=>{stageVisible=entries[0].isIntersecting;},{threshold:.5}).observe(stage);
  let previousFrame=performance.now();
  function orbitFrame(now) {
    const elapsed=Math.min(now-previousFrame,40);previousFrame=now;
    if(!paused && !document.hidden && stageVisible && !planetLayer.matches(':hover') && !planetLayer.contains(document.activeElement)) {
      if(orbitTurn){const t=Math.min((now-orbitTurn.start)/850,1);orbitAngle=orbitTurn.from+Math.PI*(1-Math.pow(1-t,3));if(t===1)orbitTurn=null;}
      else orbitAngle+=elapsed*.00012;
    } else if(orbitTurn && !paused) {
      const t=Math.min((now-orbitTurn.start)/850,1);orbitAngle=orbitTurn.from+Math.PI*(1-Math.pow(1-t,3));if(t===1)orbitTurn=null;
    }
    const w=machine.clientWidth,h=machine.clientHeight;
    planets.forEach((p,i)=>{const a=orbitAngle+i*Math.PI;p.style.left=`${w/2+Math.cos(a)*(w/2-42)}px`;p.style.top=`${h*.47+Math.sin(a)*h*.36}px`;});
    requestAnimationFrame(orbitFrame);
  }
  requestAnimationFrame(orbitFrame);
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
    filmVisible=entry.isIntersecting;
    syncFilm();
  }),{threshold:.15}).observe(film);
  document.addEventListener('visibilitychange',syncFilm);
})();
