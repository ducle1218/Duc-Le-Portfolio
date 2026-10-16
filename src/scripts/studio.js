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
  Object.assign(features,{
    capstone:{id:'box-6',image:'capstone/Sprocket_Robot_CAD.png',alt:'CAD assembly of the VEX Pushback capstone robot',label:'04 / VEX PUSHBACK',title:'From mechanism to competition.',status:'Drivetrain, intake design, and controls integration',short:'VEX'},
    launch:{id:'box-4',image:'launch_vehicle_cross_section.png',alt:'Launch vehicle structural cross-section drawing',label:'05 / LAUNCH VEHICLE',title:'Designing around the mission.',status:'Vehicle sizing, structural modeling, and packaging',short:'Launch'},
    cad:{id:'box-3',image:'cswa_solidworks_practice.jpg',alt:'SolidWorks practice part and dimensioned drawing',label:'06 / CAD & MANUFACTURING',title:'From model to drawing.',status:'Parametric modeling and manufacturing documentation',short:'CAD'}
  });
  const selector=document.querySelector('.machine-selector');
  ['capstone','launch','cad'].forEach((key,i)=>{
    const button=document.createElement('button');button.type='button';button.dataset.feature=key;
    button.setAttribute('aria-pressed','false');button.innerHTML=`0${i+4} <span>${features[key].short}</span>`;
    selector.appendChild(button);
  });
  const featureButtons = [...document.querySelectorAll('[data-feature]')];
  const stage = document.querySelector('.machine-stage');
  const planetLayer = document.createElement('div');
  planetLayer.className = 'project-planets';
  planetLayer.setAttribute('aria-label','Other featured projects');
  stage.appendChild(planetLayer);
  let currentFeature = 'robot';
  const angles=[-.7,1.7,3.5,4.6,.45];
  const orbitSpeeds=[.000105,.00009,.000078,.000067,.000057];
  let exchange = null;
  let queuedFeature = null;
  const planets = [0,1,2,3,4].map(() => {
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
  const rings=planets.map(()=>{const ring=document.createElement('span');ring.className='solar-orbit';ring.setAttribute('aria-hidden','true');machine.prepend(ring);return ring;});
  let featureElapsed = 0;
  const projectImage = machine.querySelector('img');
  const ratios={robot:1727/911,display:1282/1227,fea:1528/1029,capstone:755/842,launch:637/493,cad:1280/720};
  function imageSize(key) {
    const ratio=ratios[key];
    const width=Math.min(geometry.width*.68,geometry.width*.57*ratio);
    return {width,height:width/ratio};
  }
  function commitFeature(key, slot) {
    const previous=currentFeature,f=features[key];
    currentFeature=key;
    featureButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.feature===key)));
    machine.dataset.project=f.id;
    machine.setAttribute('aria-label',`Explore ${f.label.split(' / ')[1].toLowerCase()}`);
    projectImage.src=`src/assets/images/${f.image}`;
    projectImage.alt=f.alt;
    machine.querySelector('.machine-label').textContent=f.label;
    const caption=machine.querySelector('.machine-caption>span');
    caption.replaceChildren(document.createTextNode(f.title));
    const small=document.createElement('small');small.textContent=f.status;caption.appendChild(small);
    // Only the departing project's slot changes; the other satellite keeps its identity.
    const p=planets[slot],old=features[previous],name=old.label.split(' / ')[1];
    p.dataset.projectKey=previous;
    p.setAttribute('aria-label',`Show ${name.toLowerCase()} in the showcase`);
    p.querySelector('img').src=`src/assets/images/${old.image}`;
    p.querySelector('span').textContent=name;
    sizeShowcase();
    featureElapsed=0;
  }
  function finishExchange() {
    if(!exchange) return;
    const {key,slot,incoming,outgoing}=exchange;
    commitFeature(key,slot);
    incoming.remove();outgoing.remove();
    planets[slot].style.opacity='';
    machine.classList.remove('is-exchanging');
    machine.disabled=false;
    exchange=null;
    if(queuedFeature) {
      const next=queuedFeature;queuedFeature=null;
      selectFeature(featureButtons.find(b=>b.dataset.feature===next));
    }
  }
  function selectFeature(button) {
    const key=button.dataset.feature;
    if(exchange){queuedFeature=key;return;}
    if(key===currentFeature) return;
    const slot=planets.findIndex(p=>p.dataset.projectKey===key);
    if(paused || reduced.matches){commitFeature(key,slot);return;}
    function transferImage(project) {
      const img=document.createElement('img');
      img.src=`src/assets/images/${features[project].image}`;
      img.alt='';img.className='project-transfer';img.setAttribute('aria-hidden','true');
      stage.appendChild(img);return img;
    }
    exchange={key,slot,elapsed:0,incoming:transferImage(key),outgoing:transferImage(currentFeature)};
    planets[slot].style.opacity='0';
    machine.classList.add('is-exchanging');machine.disabled=true;
    renderExchange();
  }
  function renderExchange() {
    if(!exchange) return;
    const {key,slot,incoming,outgoing}=exchange;
    const t=Math.min(exchange.elapsed/1600,1);
    const ease=t*t*t*(t*(t*6-15)+10);
    const angle=angles[slot];
    const thumb=planets[slot].querySelector('img').clientWidth;
    function place(img,project,radial,theta,growth) {
      const size=imageSize(project),small=thumb/Math.max(size.width,size.height);
      img.style.width=`${size.width}px`;img.style.height=`${size.height}px`;
      const position=orbitPoint(slot,theta,radial);
      img.style.transform=`translate3d(${position.x}px,${position.y}px,0) translate(-50%,-50%) scale(${small+(1-small)*growth})`;
    }
    // Two complementary curved paths, with zero radial velocity at both ends.
    // No spin, teleport, or half-orbit acceleration when projects trade places.
    place(incoming,key,(1-ease),angle+ease*1.25,ease);
    place(outgoing,currentFeature,ease,angle-(1-ease)*1.25,1-ease);
    if(t===1) finishExchange();
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
    if(paused) finishExchange();
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
  }
  new IntersectionObserver(entries=>{stageVisible=entries[0].isIntersecting;syncShowcase();},{threshold:0}).observe(machine);
  document.addEventListener('visibilitychange',syncShowcase);
  let geometry={x:0,y:0,width:0};
  const tilt=-18*Math.PI/180;
  function orbitPoint(slot,angle,radial=1) {
    const radius=geometry.width*(.32+slot*.035),x=Math.cos(angle)*radius*radial,y=Math.sin(angle)*radius*.58*radial;
    return {x:geometry.x+x*Math.cos(tilt)-y*Math.sin(tilt),y:geometry.y+x*Math.sin(tilt)+y*Math.cos(tilt)};
  }
  function sizeShowcase() {
    const w=machine.clientWidth;
    if(!w) return;
    const centerY=40+w*.39;
    machine.style.height=`${w*.82+100}px`;
    machine.style.setProperty('--orbit-center-y',`${centerY}px`);
    geometry={x:machine.offsetLeft+w/2,y:machine.offsetTop+centerY,width:w};
    const size=imageSize(currentFeature);
    machine.style.setProperty('--project-width',`${size.width}px`);
    machine.style.setProperty('--project-height',`${size.height}px`);
    machine.style.setProperty('--sun-size',`${w*.59}px`);
    rings.forEach((ring,i)=>{
      const diameter=w*(.32+i*.035)*2;
      ring.style.width=`${diameter}px`;ring.style.height=`${diameter*.58}px`;
      ring.style.top=`${centerY}px`;
    });
  }
  new ResizeObserver(sizeShowcase).observe(machine);
  sizeShowcase();
  function orbitFrame(now) {
    const elapsed=previousFrame===null?0:Math.min(now-previousFrame,40);previousFrame=now;
    // Advance only visible time: returning from another tab never catches up.
    if(!paused && !document.hidden && stageVisible && machine.getClientRects().length) {
      angles.forEach((angle,i)=>{angles[i]=angle+elapsed*orbitSpeeds[i];});
      if(exchange) {exchange.elapsed+=elapsed;renderExchange();}
      if(!exchange && !stage.matches(':hover') && !stage.contains(document.activeElement)) {
        featureElapsed+=elapsed;
        if(featureElapsed>=7000) {
          const current=featureButtons.findIndex(b=>b.getAttribute('aria-pressed')==='true');
          selectFeature(featureButtons[(current+1)%featureButtons.length]);
        }
      }
    }
    planets.forEach((p,i)=>{
      const point=orbitPoint(i,angles[i]);
      p.style.transform=`translate3d(${point.x}px,${point.y}px,0) translate(-50%,-50%)`;
    });
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
