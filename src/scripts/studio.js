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
  let featureElapsed = 0;
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
    sizeShowcase();
    if (!paused && !reduced.matches) {
      const img=machine.querySelector('img'),rect=img.getBoundingClientRect();
      const x=origin ? origin.x+origin.width/2-rect.x-rect.width/2 : 0;
      const y=origin ? origin.y+origin.height/2-rect.y-rect.height/2 : 0;
      entrance=img.animate([{transform:`translate(${x}px,${y}px) scale(.16) rotate(-150deg)`,opacity:.3},{transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1}],{duration:850,easing:'cubic-bezier(.22,.75,.2,1)'});
      orbitTurn={elapsed:0,from:orbitAngle};
    }
    featureElapsed = 0;
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
  let previousFrame=null;
  function syncShowcase() {
    previousFrame=null;
    const suspended=paused || document.hidden || !stageVisible;
    stage.classList.toggle('showcase-suspended',suspended);
    if(entrance && entrance.playState!=='finished') {
      if(suspended) entrance.pause(); else entrance.play();
    }
  }
  new IntersectionObserver(entries=>{stageVisible=entries[0].isIntersecting;syncShowcase();},{threshold:0}).observe(machine);
  document.addEventListener('visibilitychange',syncShowcase);
  let geometry={x:0,y:0,radius:0};
  function sizeShowcase() {
    const w=machine.clientWidth,planetSize=planets[0].offsetWidth;
    if(!w) return;
    const diameter=w-planetSize-24,centerY=36+w/2;
    machine.style.height=`${w+96}px`;
    machine.style.setProperty('--orbit-diameter',`${diameter}px`);
    machine.style.setProperty('--orbit-center-y',`${centerY}px`);
    // Fit the image's diagonal in the clear inner disk at every rotation angle.
    const ratios={robot:1727/911,display:1282/1227,fea:1528/1029};
    const ratio=ratios[currentFeature];
    const imageWidth=(diameter-planetSize-24)/Math.sqrt(1+1/(ratio*ratio));
    machine.style.setProperty('--project-width',`${imageWidth}px`);
    machine.style.setProperty('--project-height',`${imageWidth/ratio}px`);
    geometry={x:machine.offsetLeft+w/2,y:machine.offsetTop+centerY,radius:diameter/2};
  }
  new ResizeObserver(sizeShowcase).observe(machine);
  sizeShowcase();
  function orbitFrame(now) {
    const elapsed=previousFrame===null?0:Math.min(now-previousFrame,40);previousFrame=now;
    // Advance only visible time: returning from another tab never catches up.
    if(!paused && !document.hidden && stageVisible && machine.getClientRects().length) {
      if(orbitTurn){orbitTurn.elapsed+=elapsed;const t=Math.min(orbitTurn.elapsed/850,1);orbitAngle=orbitTurn.from+Math.PI*(1-Math.pow(1-t,3));if(t===1)orbitTurn=null;}
      else if(!planetLayer.matches(':hover') && !planetLayer.contains(document.activeElement)) orbitAngle+=elapsed*.00012;
      if(!stage.matches(':hover') && !stage.contains(document.activeElement)) {
        featureElapsed+=elapsed;
        if(featureElapsed>=7000) {
          const current=featureButtons.findIndex(b=>b.getAttribute('aria-pressed')==='true');
          selectFeature(featureButtons[(current+1)%featureButtons.length]);
        }
      }
    }
    planets.forEach((p,i)=>{const a=orbitAngle+i*Math.PI;p.style.left=`${geometry.x+Math.cos(a)*geometry.radius}px`;p.style.top=`${geometry.y+Math.sin(a)*geometry.radius}px`;});
    requestAnimationFrame(orbitFrame);
  }
  requestAnimationFrame(orbitFrame);
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
