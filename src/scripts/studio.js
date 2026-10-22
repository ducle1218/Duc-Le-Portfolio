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
    try { localStorage.setItem('portfolio-theme-v2',root.classList.contains('dark')?'dark':'light'); } catch(e) {}
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
    document.dispatchEvent(new CustomEvent("portfolio-motion",{detail:{paused}}));
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
