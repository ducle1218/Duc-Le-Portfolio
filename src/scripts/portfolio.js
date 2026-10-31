// Detailed projects documentation database

    // Completed viewer count from src/content/projects/box-3.html.
    const CSWA_COMPLETED_COUNT = 80;
    document.querySelectorAll('#cswa-grid-badge-count, #cswa-grid-desc-count').forEach(function (el) {
      el.textContent = CSWA_COMPLETED_COUNT;
    });

    // ======================== Bulkhead Stress Calculator (Launch Vehicle) ========================
    // Faithful recreation of the "_APPLIED_STRESS_CALCULATOR.xlsx" spreadsheet used to
    // size each bulkhead. Formula (matches the sheet's Calculation tab):
    //   Eq.1 = (12 * Load * T/W) / (4*pi*t^2)
    //   Eq.2 = (1+v) * ln( a / (sqrt(0.4*a^2 + t^2) - 0.675*t) )
    //   Applied Stress = Eq.1 * Eq.2, checked against an allowable stress.
    const STRESS_CALC_PRESETS = {
      stage1:       { load: 200000,                 tw: 1.0,          radius: (10.5*12)/2, thickness: 0.78, poisson: 0.33, allowable: 200000 },
      stage2:       { load: 200000-103800-24809,     tw: 4.095634096,  radius: (10.5*12)/2, thickness: 0.95, poisson: 0.33, allowable: 200000 },
      payload:      { load: 71391-60017-6374,        tw: 18.8300509935, radius: (10.5*12)/2, thickness: 0.53, poisson: 0.33, allowable: 200000 },
      'tmc-stage1': { load: 900000,                  tw: 1.0,          radius: 58.8,        thickness: 2.95, poisson: 0.32, allowable: 67000 },
      'tmc-stage2': { load: 51300,                   tw: 11.01,        radius: 95.88,       thickness: 2.3,  poisson: 0.32, allowable: 67000 },
      'tmc-payload':{ load: 4500,                    tw: 9.328,        radius: 95.88,       thickness: 0.61, poisson: 0.32, allowable: 67000 },
    };

    function stressCalcApplyPreset() {
      const presetSelect = document.getElementById('sc-preset');
      if (!presetSelect) return;
      const key = presetSelect.value;
      const preset = STRESS_CALC_PRESETS[key];
      if (preset) {
        document.getElementById('sc-load').value = preset.load;
        document.getElementById('sc-tw').value = preset.tw;
        document.getElementById('sc-radius').value = preset.radius;
        document.getElementById('sc-thickness').value = preset.thickness;
        document.getElementById('sc-poisson').value = preset.poisson;
        document.getElementById('sc-allowable').value = preset.allowable;
      }
      stressCalcUpdate();
    }

    // Any manual edit to an input flips the dropdown to "Custom" so it's clear
    // the numbers no longer match a stock load case.
    function stressCalcSetCustom() {
      const presetSelect = document.getElementById('sc-preset');
      if (presetSelect) presetSelect.value = 'custom';
    }

    function stressCalcUpdate() {
      const get = id => parseFloat(document.getElementById(id).value);
      const load = get('sc-load');
      const tw = get('sc-tw');
      const a = get('sc-radius');
      const t = get('sc-thickness');
      const v = get('sc-poisson');
      const allowable = get('sc-allowable');

      const eq1El = document.getElementById('sc-eq1');
      const eq2El = document.getElementById('sc-eq2');
      const appliedEl = document.getElementById('sc-applied');
      const allowableEl = document.getElementById('sc-allowable-display');
      const marginEl = document.getElementById('sc-margin');
      const verdict = document.getElementById('sc-verdict');
      const verdictIcon = document.getElementById('sc-verdict-icon');
      const verdictTitle = document.getElementById('sc-verdict-title');
      const verdictSub = document.getElementById('sc-verdict-sub');
      if (!eq1El) return; // calculator isn't on the page

      if ([load, tw, a, t, v, allowable].some(n => isNaN(n)) || t === 0) {
        eq1El.textContent = eq2El.textContent = appliedEl.textContent = allowableEl.textContent = marginEl.textContent = '—';
        verdict.className = 'mt-2 rounded-2xl p-4 flex items-center gap-3 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40';
        verdictIcon.innerHTML = '';
        verdictTitle.textContent = 'Enter valid numbers';
        verdictTitle.className = 'text-sm font-black uppercase tracking-wide font-mono text-slate-500 dark:text-slate-400';
        verdictSub.textContent = 'All six fields need a value to compute the applied stress.';
        return;
      }

      const eq1 = (12 * load * tw) / (4 * Math.PI * t * t);
      const eq2 = (1 + v) * Math.log(a / (Math.sqrt(0.4 * a * a + t * t) - 0.675 * t));
      const applied = eq1 * eq2;
      const margin = ((allowable - applied) / allowable) * 100;
      const pass = applied < allowable;

      eq1El.textContent = eq1.toLocaleString(undefined, { maximumFractionDigits: 1 });
      eq2El.textContent = eq2.toLocaleString(undefined, { maximumFractionDigits: 4 });
      appliedEl.textContent = Math.round(applied).toLocaleString() + ' psi';
      allowableEl.textContent = Math.round(allowable).toLocaleString() + ' psi';
      marginEl.textContent = (margin >= 0 ? '+' : '') + margin.toFixed(1) + '%';
      marginEl.className = 'font-mono text-sm font-bold ' + (pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400');

      if (pass) {
        verdict.className = 'mt-2 rounded-2xl p-4 flex items-center gap-3 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20';
        verdictIcon.setAttribute('class', 'w-6 h-6 shrink-0 text-emerald-500');
        verdictIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />';
        verdictTitle.textContent = 'Within allowable stress';
        verdictTitle.className = 'text-sm font-black uppercase tracking-wide font-mono text-emerald-700 dark:text-emerald-400';
        verdictSub.textContent = 'Applied stress is ' + Math.abs(margin).toFixed(1) + '% below the allowable — this bulkhead thickness holds.';
      } else {
        verdict.className = 'mt-2 rounded-2xl p-4 flex items-center gap-3 border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20';
        verdictIcon.setAttribute('class', 'w-6 h-6 shrink-0 text-rose-500');
        verdictIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />';
        verdictTitle.textContent = 'Exceeds allowable stress';
        verdictTitle.className = 'text-sm font-black uppercase tracking-wide font-mono text-rose-700 dark:text-rose-400';
        verdictSub.textContent = 'Applied stress is ' + Math.abs(margin).toFixed(1) + '% over the allowable — needs a thicker bulkhead or a stronger material.';
      }
    }

    function initStressCalculator() {
      const presetSelect = document.getElementById('sc-preset');
      if (!presetSelect) return; // not the launch vehicle page, nothing to do
      stressCalcApplyPreset();
    }

    const projectContent = new Map();
    let detailRevision = 0;
    async function showProjectDetail(projectId) {
      const item = TIMELINE_ITEMS.find(item => item.id === projectId);
      if (!item) return;
      window.updateProjectUrl?.(projectId);
      const revision = ++detailRevision;
      document.body.dataset.atmospherePage = 'detail-' + projectId;
      const body = document.getElementById('project-detail-body');
      body.setAttribute('aria-busy', 'true');
      body.innerHTML = '<h2>' + escapeHtml(item.title) + '</h2><p role="status">Loading project…</p>';
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
      document.getElementById('tab-project-detail-content').classList.remove('hidden');
      
      // Update navigation Highlights
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-rose-500', 'border-rose-500');
        btn.classList.add('text-slate-500', 'border-transparent');
      });
      const activeBtn = document.getElementById('btn-project');
      if (activeBtn) {
        activeBtn.classList.add('text-rose-500', 'border-rose-500');
        activeBtn.classList.remove('text-slate-500', 'border-transparent');
      }
      window.scrollTo(0,0);
      try {
        if (!projectContent.has(projectId)) {
          const request = fetch('src/content/projects/' + projectId + '.html').then(response => {
            if (!response.ok) throw new Error('Project content unavailable');
            return response.text();
          }).catch(error => { projectContent.delete(projectId); throw error; });
          projectContent.set(projectId, request);
        }
        const content = await projectContent.get(projectId);
        if (revision !== detailRevision) return;
        body.innerHTML = content;
        if (projectId !== 'box-6') {
          const context = document.createElement('p');
          context.className = 'project-stage-context';
          context.textContent = item.stage + ' project';
          body.firstElementChild?.prepend(context);
        }
        updateCswaLevelBadges(); initCswaLevelChecks(); initStressCalculator();
      } catch (error) {
        if (revision !== detailRevision) return;
        body.innerHTML = '<h2>' + escapeHtml(item.title) + '</h2><p role="status">This project could not load. Please try again.</p><button type="button">Retry project</button>';
        body.querySelector('button').addEventListener('click', () => showProjectDetail(projectId));
      } finally {
        if (revision === detailRevision) body.setAttribute('aria-busy', 'false');
      }
    }

    function hideProjectDetail() {
      switchTab('project');
    }

    // ======================== Work Experience Carousel ========================
    // Newest-to-oldest project set. Default window (index 0) shows the first
    // three entries — Volumetric Display, SolidWorks CAD, Vex Pushback Capstone.
    const TIMELINE_ICONS = {
      orbit: '<circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="10" ry="4.2"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(120 12 12)"/>',
      ruler: '<path d="M3 16.5 7.5 21 21 7.5 16.5 3z"/><path d="m7.5 8.5 1 1M10.5 5.5l1 1M13.5 2.5l1 1M4.5 11.5l1 1"/>',
      gear: '<rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />',
      pencil: '<path d="M4.5 16.5c-1.5 1.26-2 2.5-2 2.5s1.24-.5 2.5-2c1.25-1.5 5.5-5.5 8.5-8.5s3.5-3.5 3.5-3.5l1 1-1-1a3 3 0 0 0-4-4l-1 1 1-1c-3 3-7 7.25-8.5 8.5z"/><path d="m12 12 4 4"/><path d="m16 8 2 2"/><path d="m9 15-3-3"/>',
      wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L2 19l3 3 7.1-7.1a4 4 0 0 0 5.6-5.6l-3.2 3.2-2.8-2.8z"/>',
      bolt: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
      triangle: '<path d="M12 3 3 21h18z"/><path d="M12 9v6"/>',
      radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/>',
      wave: '<path d="M2 17c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0"/><path d="M2 12c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0"/><path d="M12 3v6"/>',
      wind: '<path d="M9.59 4.59A2 2 0 1 1 11 8H2"/><path d="M12.59 19.41A2 2 0 1 0 14 16H2"/><path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2"/>',
    };

    // TIMELINE_ITEMS is generated from the shared project facts at build time.

    const TIMELINE_WINDOW = 3;
    let timelineIndex = 0;

    // ======================== Home "All Projects" Stacked List ========================
    // Renders every entry in TIMELINE_ITEMS as one big vertical card — title,
    // media, description, tech stack, link — instead of a grid of small
    // previews. Generated project facts keep the card summaries in sync
    // with the timeline carousel and the project detail pages automatically.
    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function formatCardDescription(desc) {
      const lines = desc.split('\n').filter(Boolean);
      const intro = [];
      const bullets = [];
      lines.forEach(line => {
        if (line.trim().startsWith('•')) {
          bullets.push(line.trim().replace(/^•\s*/, ''));
        } else {
          intro.push(line.trim());
        }
      });
      let html = '';
      if (intro.length) {
        html += `<p>${intro.join(' ')}</p>`;
      }
      if (bullets.length) {
        html += `<ul class="space-y-1 list-disc list-outside ml-4 marker:text-rose-400">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
      }
      return html;
    }

    // Maps a tech-stack tag's exact label to a logo asset. Only tags with a
    // real, recognizable software/hardware logo get an icon — generic terms
    // (e.g. "Optics", "Load Testing") stay text-only rather than guessing.
    const TAG_ICONS = {
      'Embedded C++': 'src/assets/images/logos/cpp_logo.png',
      'C++': 'src/assets/images/logos/cpp_logo.png',
      'C++ Autonomy': 'src/assets/images/logos/cpp_logo.png',
      'SolidWorks': 'src/assets/images/logos/solidworks_icon.png',
      'MATLAB': 'src/assets/images/logos/matlab_logo.png',
      'Onshape CAD': 'src/assets/images/logos/onshape_logo.png',
      'Onshape': 'src/assets/images/logos/onshape_logo.png',
      'AutoCAD': 'src/assets/images/logos/autocad_logo.png',
      'Arduino': 'src/assets/images/logos/arduino-icon.png',
    };

    // Filter value (matches the filter button labels exactly) -> the shorter
    // singular label shown on each card's small badge chip.
    const CATEGORY_BADGE_LABELS = {
      'PERSONAL': 'PERSONAL',
      'STUDENT TEAMS': 'STUDENT TEAM',
      'INTERNSHIPS': 'INTERNSHIP',
    };

    function buildHomeProjectCardHTML(item, extraAttrs) {
      // category now comes straight from each TIMELINE_ITEMS entry instead of
      // being guessed from `location` — that guess had no way to ever produce
      // 'INTERNSHIPS', so that filter was structurally dead. Add an internship
      // by setting category: 'INTERNSHIPS' on its TIMELINE_ITEMS entry.
      const filterCategory = item.category || 'PERSONAL';
      const category = CATEGORY_BADGE_LABELS[filterCategory] || filterCategory;
      const attrs = extraAttrs ? ` project-card" data-category="${filterCategory}" data-stage="${item.stage}` : '';
      const tagsHtml = (item.tags || []).map(tag => {
        const icon = TAG_ICONS[tag];
        const iconHtml = icon
          ? `<img loading="lazy" decoding="async" src="${icon}" alt="" class="w-3 h-3 object-contain" onerror="this.remove()" />`
          : '';
        return `<span class="text-[10px] font-mono px-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 inline-flex items-center gap-1.5">${iconHtml}${escapeHtml(tag)}</span>`;
      }).join('');
      return `
      <div onclick="showProjectDetail('${item.id}')" class="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-slate-700 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-rose-400/50 dark:hover:border-rose-900/50 transition-all duration-300 cursor-pointer group flex flex-col h-full${attrs}">
        <div class="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-900">
          <img loading="lazy" decoding="async" src="${item.image}" srcset="${item.imageSet || ''}" sizes="(max-width: 650px) 90vw, (max-width: 900px) 44vw, 29vw" width="${item.imageWidth || 640}" height="${item.imageHeight || 480}" alt="${escapeHtml(item.title)}"
            referrerpolicy="no-referrer"
            class="w-full h-full object-${item.imageFit} transition-transform duration-500 group-hover:scale-105"
            onerror="this.closest('.relative').style.display='none'"/>
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>
        </div>
        <div class="p-5 sm:p-6 space-y-3 flex-1 flex flex-col">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <h3 class="font-extrabold text-neutral-900 dark:text-white text-base sm:text-lg tracking-tight group-hover:text-rose-500 transition-colors">${escapeHtml(item.title)}</h3>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[9px] font-mono font-black px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">${category}</span>
            <span class="text-[9px] font-mono font-bold text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded whitespace-nowrap">${escapeHtml(item.subtitle)}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
            <span class="project-stage">${item.stage}</span>
            <span class="flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 text-rose-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${escapeHtml(item.dateLabel)}
            </span>
            <span class="flex items-center gap-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 text-rose-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              ${escapeHtml(item.location)}
            </span>
          </div>
          <div class="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 space-y-1.5 flex-1">${formatCardDescription(item.desc)}</div>
          <div class="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p class="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black mb-1.5">Tech Stack</p>
            <div class="flex flex-wrap gap-1.5">${tagsHtml}</div>
          </div>
          <div class="pt-1 flex items-center gap-1.5 text-xs font-mono font-bold text-rose-500 dark:text-rose-400">
            <span>Read More</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </div>
        </div>
      </div>`;
    }

    const HOME_PROJECT_LIST_LIMIT = 3;

    function renderHomeProjectList() {
      const container = document.getElementById('home-project-list');
      if (!container) return;
      // Explicitly wrap in an arrow function — passing buildHomeProjectCardHTML
      // directly to .map() leaks the array index into its second parameter
      // (extraAttrs), which used to make every featured card past index 0
      // pick up the "project-card" class/data-category and get caught by the
      // Projects-page filter buttons. This keeps extraAttrs strictly undefined
      // for every featured card, always.
      container.innerHTML = TIMELINE_ITEMS.slice(0, HOME_PROJECT_LIST_LIMIT).map(item => buildHomeProjectCardHTML(item)).join('');
    }
    renderHomeProjectList();

    function renderProjectPageList() {
      const container = document.getElementById('projects-grid');
      if (!container) return;
      container.innerHTML = TIMELINE_ITEMS.map(item => buildHomeProjectCardHTML(item, true)).join('');
      document.getElementById('project-count').textContent = `${TIMELINE_ITEMS.length} projects`;
    }
    let projectListReady = false;

    // Retained timeline renderer for older project views.
    function buildTimelineEntryHTML(item, posInWindow) {
      const reverse = posInWindow % 2 === 0; // 0 and 2 reversed, 1 normal — matches original zigzag
      const alignClass = reverse ? 'md:items-end' : 'md:items-start';
      return `
      <div class="flex flex-col md:flex-row items-stretch md:justify-between relative ${reverse ? 'md:flex-row-reverse' : ''}">
        <div class="absolute left-4 md:left-1/2 top-6 md:top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
          <div class="w-10 h-10 rounded-full bg-white dark:bg-slate-950 border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-md transition-all duration-300 hover:border-rose-500 overflow-hidden">
            ${item.iconImage
              ? `<img src="${item.iconImage}" alt="${item.title} icon" class="w-6 h-6 object-contain" onerror="this.style.display='none'" />`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5 text-rose-500 dark:text-rose-400">${TIMELINE_ICONS[item.icon] || TIMELINE_ICONS.gear}</svg>`}
          </div>
        </div>

        <div class="w-full md:w-[45%] pl-12 md:pl-0 text-left">
          <div class="relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-rose-400/50 transition-all duration-300">
            <div class="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-900">
              <img loading="lazy" decoding="async"
                src="${item.image}"
                alt="${item.title}"
                referrerpolicy="no-referrer"
                class="w-full h-full object-${item.imageFit} transition-transform duration-500 hover:scale-105"
                onerror="this.closest('.relative').style.display='none'"/>
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/30 to-transparent"></div>
            </div>
            <div class="p-6 space-y-3">
              <div class="space-y-1">
                <h3 class="font-extrabold text-slate-900 dark:text-white text-base tracking-tight hover:text-rose-500 transition-colors">
                  ${item.title} — <span class="text-rose-500 dark:text-rose-400 text-sm font-semibold">${item.subtitle}</span>
                </h3>
              </div>
              <p class="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">${item.desc}</p>
              <div onclick="showProjectDetail('${item.id}')" class="pt-2 flex items-center gap-1.5 text-xs font-mono font-bold text-rose-500 dark:text-rose-400 cursor-pointer hover:underline">
                <span>Read More</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </div>
            </div>
          </div>
        </div>

        <div class="w-full md:w-[45%] pl-12 md:pl-0 flex flex-col justify-center ${alignClass} mt-3 md:mt-0">
          <div class="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 px-5 py-3 rounded-2xl max-w-[25rem] space-y-1.5">
            <div class="flex items-center gap-2 text-sm font-mono font-extrabold text-slate-800 dark:text-slate-200">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-rose-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${item.dateLabel}</span>
            </div>
            <div class="flex items-center gap-2 text-[13px] font-mono text-slate-400 dark:text-slate-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5 text-rose-500"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${item.location}</span>
            </div>
          </div>
        </div>
      </div>`;
    }

    function renderTimelineWindow() {
      const container = document.getElementById('timeline-items');
      const label = document.getElementById('timeline-position-label');
      if (!container) return;
      const windowItems = TIMELINE_ITEMS.slice(timelineIndex, timelineIndex + TIMELINE_WINDOW);
      container.innerHTML = windowItems.map((item, i) => buildTimelineEntryHTML(item, i)).join('');
      if (label) {
        label.textContent = `${timelineIndex + 1}–${timelineIndex + windowItems.length} of ${TIMELINE_ITEMS.length}`;
      }
      updateTimelineArrowStates();
    }

    function updateTimelineArrowStates() {
      const upWrap = document.getElementById('timeline-nav-up-wrap');
      const downWrap = document.getElementById('timeline-nav-down-wrap');
      if (upWrap) upWrap.classList.toggle('is-hidden', timelineIndex <= 0);
      if (downWrap) downWrap.classList.toggle('is-hidden', timelineIndex + TIMELINE_WINDOW >= TIMELINE_ITEMS.length);
    }

    let timelineAnimating = false;

    function shiftTimeline(direction) {
      if (timelineAnimating) return;
      const maxIndex = TIMELINE_ITEMS.length - TIMELINE_WINDOW;
      const nextIndex = Math.min(Math.max(timelineIndex + direction, 0), maxIndex);
      if (nextIndex === timelineIndex) return;
      const container = document.getElementById('timeline-items');
      if (!container) return;

      // Remember where the clicked arrow sits on screen right now, so we can
      // keep it pinned there after the card batch changes height below/above it.
      const clickedBtn = document.getElementById(direction > 0 ? 'timeline-nav-down' : 'timeline-nav-up');
      const anchorYBefore = clickedBtn ? clickedBtn.getBoundingClientRect().top : null;

      timelineAnimating = true;
      const SLIDE_PX = 46;
      const SLIDE_MS = 260;

      // Exit: current cards slide out in the direction of travel — down-arrow
      // (older) pushes them up and off, up-arrow (newer) pushes them down and off.
      container.style.transition = `transform ${SLIDE_MS}ms ease, opacity ${SLIDE_MS}ms ease`;
      container.style.transform = `translateY(${direction > 0 ? -SLIDE_PX : SLIDE_PX}px)`;
      container.style.opacity = '0';

      setTimeout(() => {
        timelineIndex = nextIndex;
        renderTimelineWindow();

        // The new card batch is very likely a different total height than the
        // old one, which pushes everything after it (including the arrows) up
        // or down the page. Counter-scroll by that exact delta so the arrow
        // the user just clicked stays put on screen instead of "jumping."
        if (clickedBtn && anchorYBefore !== null) {
          const anchorYAfter = clickedBtn.getBoundingClientRect().top;
          const delta = anchorYAfter - anchorYBefore;
          if (delta !== 0) window.scrollBy(0, delta);
        }

        // Place the new set just off-screen on the entering side, then release
        // it into view on the next frame so the browser actually animates it.
        container.style.transition = 'none';
        container.style.transform = `translateY(${direction > 0 ? SLIDE_PX : -SLIDE_PX}px)`;
        container.style.opacity = '0';
        void container.offsetHeight; // force reflow so the jump above isn't animated

        requestAnimationFrame(() => {
          container.style.transition = `transform ${SLIDE_MS}ms ease, opacity ${SLIDE_MS}ms ease`;
          container.style.transform = 'translateY(0)';
          container.style.opacity = '1';
          setTimeout(() => { timelineAnimating = false; }, SLIDE_MS);
        });
      }, SLIDE_MS);
    }

    renderTimelineWindow();

    // Tab switching engine
    function switchTab(tabId) {
      window.updateProjectUrl?.(null);
      detailRevision++;
      if (tabId === 'project' && !projectListReady) { renderProjectPageList(); projectListReady = true; }
      document.body.dataset.atmospherePage = tabId;
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
      document.getElementById('tab-' + tabId + '-content').classList.remove('hidden');

      // Update button highlights
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('text-rose-500', 'border-rose-500');
        btn.classList.add('text-slate-500', 'border-transparent');
      });
      const activeBtn = document.getElementById('btn-' + tabId);
      if (activeBtn) {
        activeBtn.classList.add('text-rose-500', 'border-rose-500');
        activeBtn.classList.remove('text-slate-500', 'border-transparent');
      }
      window.scrollTo(0,0);

      // Hero background video only needs to run while the Home tab is
      // visible — pause it (rather than just letting it play offscreen)
      // when navigating to Resume/Project/Contact, and resume it if the
      // user comes back, so it isn't burning CPU/battery in the background.
      const heroVideo = document.getElementById('hero-bg-video');
      if (heroVideo) {
        if (tabId === 'home' && !document.documentElement.classList.contains('motion-paused') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches && heroVideo.dataset.userPlaying === 'true') {
          heroVideo.play().catch(() => {});
        } else {
          heroVideo.pause();
        }
      }
    }

    // Projects filtering engine — fades cards out, swaps which ones are in
    // the layout, then fades the matching set back in with a light stagger,
    // instead of an instant display:none/flex cut.
    let activeProjectCategory = 'ALL';
    let projectFilterTimer;
    function filterProjects(cat = activeProjectCategory) {
      activeProjectCategory = cat;
      clearTimeout(projectFilterTimer);
      const stage = document.getElementById('project-stage').value;
      const FADE_MS = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;
      const cards = document.querySelectorAll('.project-card');

      // Phase 1: fade everything currently on screen out together.
      cards.forEach(card => {
        card.style.transition = 'opacity ' + FADE_MS + 'ms ease, transform ' + FADE_MS + 'ms ease';
        card.style.opacity = '0';
        card.style.transform = 'translateY(6px) scale(0.97)';
      });

      // Phase 2: once the fade-out finishes, swap which cards are laid out
      // at all, then fade the matching ones back in with a subtle stagger.
      projectFilterTimer = setTimeout(() => {
        let shownIndex = 0;
        cards.forEach(card => {
          const match = (cat === 'ALL' || card.getAttribute('data-category') === cat) && (stage === 'ALL' || card.dataset.stage === stage);
          card.style.display = match ? 'flex' : 'none';
          if (!match) return;

          const delay = shownIndex * 30;
          shownIndex++;
          card.style.transition = 'none';
          card.style.opacity = '0';
          card.style.transform = 'translateY(6px) scale(0.97)';
          void card.offsetHeight; // force reflow so the transition below actually animates
          card.style.transition = 'opacity ' + FADE_MS + 'ms ease ' + delay + 'ms, transform ' + FADE_MS + 'ms ease ' + delay + 'ms';
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0) scale(1)';
          });
        });

        // Show a friendly message instead of blank space when a category
        // (e.g. Internships, until one is added) has zero matching cards.
        document.getElementById('project-count').textContent = `${shownIndex} ${shownIndex === 1 ? 'project' : 'projects'}`;
        const emptyState = document.getElementById('projects-empty-state');
        if (emptyState) {
          emptyState.classList.toggle('hidden', shownIndex !== 0);
        }
      }, FADE_MS);

      // Update active state of filter buttons (with a smooth color transition)
      document.querySelectorAll('.proj-filter-btn').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.innerText === cat));
        if (btn.innerText === cat) {
          btn.className = "proj-filter-btn px-4 py-2 bg-rose-500 text-white font-mono text-xs uppercase rounded-xl transition-colors duration-200";
        } else {
          btn.className = "proj-filter-btn px-4 py-2 bg-white dark:bg-slate-900 border font-mono text-xs uppercase rounded-xl text-slate-500 transition-colors duration-200";
        }
      });
    }

    // Auto-sort project cards by recency (newest first), using each card's
    // data-date="YYYY-MM" attribute. Runs once on load, before any filtering —
    // filterProjects() only shows/hides cards, it doesn't touch DOM order, so
    // whatever order they're placed in here is the order they stay in.
    (function () {
      var grid = document.getElementById('projects-grid');
      if (!grid) return;
      var cards = Array.prototype.slice.call(grid.querySelectorAll(':scope > .project-card'));
      cards.sort(function (a, b) {
        var dateA = a.getAttribute('data-date') || '';
        var dateB = b.getAttribute('data-date') || '';
        return dateB.localeCompare(dateA); // descending — newest first
      });
      cards.forEach(function (card) { grid.appendChild(card); });
    })();

    // This release uses one deliberately art-directed palette.
    document.documentElement.classList.remove('theme-test');
    const CONTACT_STORAGE_KEY = "contact_submission_counts";

    function getContactSubmissionCounts() {
      try {
        return JSON.parse(localStorage.getItem(CONTACT_STORAGE_KEY)) || {};
      } catch (e) {
        return {};
      }
    }

    function getContactSubmissionCount(email) {
      const counts = getContactSubmissionCounts();
      return counts[email.toLowerCase()] || 0;
    }

    function incrementContactSubmissionCount(email) {
      const counts = getContactSubmissionCounts();
      const key = email.toLowerCase();
      counts[key] = (counts[key] || 0) + 1;
      try {
        localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(counts));
      } catch (e) {
        // localStorage unavailable — fail silently, not critical
      }
    }

    async function handleStaticContactSubmit(e) {
      e.preventDefault();
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const messageInput = document.getElementById('contact-message');
      const submitBtn = document.getElementById('contact-submit-btn');
      const statusContainer = document.getElementById('contact-status-container');
      const formContainer = document.getElementById('contact-form-container');
      
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const message = messageInput.value.trim();
      
      if (!name || !email || !message) {
        alert("Please fill in all fields.");
        return;
      }

      if (getContactSubmissionCount(email) >= CONTACT_MAX_PER_EMAIL) {
        statusContainer.classList.remove('hidden');
        statusContainer.className = "text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30";
        statusContainer.innerHTML = "⚠️ You've reached the maximum of " + CONTACT_MAX_PER_EMAIL + " messages from this email address. Please reach out via LinkedIn or email directly for further contact.";
        return;
      }
      
      nameInput.disabled = true;
      emailInput.disabled = true;
      messageInput.disabled = true;
      submitBtn.disabled = true;
      submitBtn.innerText = "TRANSMITTING...";
      submitBtn.className = "w-full bg-slate-400 text-white font-mono uppercase text-xs py-3 rounded-xl font-bold cursor-not-allowed";
      
      statusContainer.classList.remove('hidden');
      statusContainer.className = "text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-center gap-2";
      statusContainer.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span><span>Verifying sender email exists...</span>`;
      
      try {
        // Email verification is a best-effort check against a third-party API.
        // If it's unreachable (network blocked, DNS failure, service down),
        // we don't want that to block the user from sending a real message —
        // so failures here are logged and swallowed rather than thrown.
        try {
          const verifyRes = await fetch(`https://api.disify.com/v1/email/${encodeURIComponent(email)}`);
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            
            if (verifyData.format === false) {
              throw { userMessage: "The email format is invalid. Please double check." };
            }
            
            if (verifyData.dns === false) {
              throw { userMessage: "This email domain does not appear to exist or cannot receive messages. Please enter a valid, active email address." };
            }
            
            if (verifyData.disposable === true) {
              throw { userMessage: "Temporary or disposable email addresses are not allowed. Please use a standard email provider." };
            }
          } else {
            console.warn("Email verification service returned an error status; skipping verification.");
          }
        } catch (verifyErr) {
          if (verifyErr && verifyErr.userMessage) {
            throw new Error(verifyErr.userMessage);
          }
          // Network/DNS/fetch failure reaching the verification service — skip verification, don't block sending.
          console.warn("Email verification service unreachable; skipping verification.", verifyErr);
        }
        
        statusContainer.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span><span>Transmitting message to Duc Le...</span>`;
        
        const response = await fetch("https://formspree.io/f/xgogzblv", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name,
            email: email,
            message: message
          })
        });
        
        if (!response.ok) {
          throw new Error("Failed to deliver message via contact gateway. Please try again later.");
        }
        
        incrementContactSubmissionCount(email);
        
        formContainer.innerHTML = `
          <div class="p-6 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
            <div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              <svg class="w-5 h-5 stroke-[3]" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h4 class="font-bold text-slate-900 dark:text-white">Message Transmitted!</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Thank you. Duc Le will respond to your engineering proposal shortly.</p>
            </div>
          </div>
        `;
        
      } catch (err) {
        console.error("Transmission error:", err);
        statusContainer.className = "text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30";
        statusContainer.innerHTML = "⚠️ " + (err.message || "An unexpected error occurred during transmission.");
        
        nameInput.disabled = false;
        emailInput.disabled = false;
        messageInput.disabled = false;
        submitBtn.disabled = false;
        submitBtn.innerText = "SEND MESSAGE";
        submitBtn.className = "w-full bg-[#ff1756] hover:bg-[#e0104a] text-white font-mono uppercase text-xs py-3 rounded-xl font-bold transition-all cursor-pointer";
      }
    }

(function () {
      var heroVideo = document.getElementById('hero-bg-video');
      if (!heroVideo) return;
      var START_TIME = 43;   // 0:43
      var END_TIME = 125;    // 2:05

      heroVideo.addEventListener('loadedmetadata', function () {
        heroVideo.currentTime = START_TIME;
      });

      heroVideo.addEventListener('timeupdate', function () {
        if (heroVideo.currentTime >= END_TIME) {
          heroVideo.currentTime = START_TIME;
        }
      });

      // In case metadata was already loaded before this script ran
      if (heroVideo.readyState >= 1) {
        heroVideo.currentTime = START_TIME;
      }
    })();

function copyNotebookCode(btn) {
      var pre = btn.parentElement.querySelector('pre.notebook-code');
      if (!pre) return;
      var text = pre.innerText;
      navigator.clipboard.writeText(text).then(function () {
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = original; }, 1500);
      }).catch(function () {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        var original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(function () { btn.textContent = original; }, 1500);
      });
    }

var THREE_JS_URLS = [
      'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js',
      'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js',
      'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js'
    ];
    var threeJsLoadPromise = null;

    function loadScriptTag(src) {
      return new Promise(function (resolve, reject) {
        var s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
      });
    }

    // Loads three.min.js, then OrbitControls.js and STLLoader.js (both depend on
    // the global THREE existing first), in order, exactly once — repeat calls
    // reuse the same in-flight/resolved promise.
    function loadThreeJsThenRun(callback) {
      if (typeof THREE !== 'undefined' && THREE.OrbitControls && THREE.STLLoader) {
        callback();
        return;
      }
      if (!threeJsLoadPromise) {
        threeJsLoadPromise = loadScriptTag(THREE_JS_URLS[0])
          .then(function () {
            return Promise.all([loadScriptTag(THREE_JS_URLS[1]), loadScriptTag(THREE_JS_URLS[2])]);
          });
      }
      threeJsLoadPromise.then(callback);
    }

// ---- Accordion mechanic: smooth open/close with animated auto-close of siblings ----
    // Any <details data-group="..."> becomes part of an exclusive accordion: opening
    // one animates it open AND animates any other open panel sharing the same
    // data-group value closed. Both the CSWA Level panels (data-group="cswa-level")
    // and the Arduino Tutorial panels (data-group="tutorial-group") share this one
    // mechanic — add a new data-group value anywhere else and it works the same way.
    //
    // This deliberately avoids the native <details name="..."> grouping. That native
    // feature closes other same-name panels itself, instantly and independently of
    // our animation — it was racing with the JS below (both trying to own the same
    // "open" attribute), which is what caused the open/close glitches. Using a plain
    // data attribute means this script is the only thing that ever touches the open
    // state, so there's nothing left to race against.
    (function () {
      var ACCORDION_MS = 300;
      var ACCORDION_EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

      function contentOf(details) {
        var summary = details.querySelector(':scope > summary');
        return summary ? summary.nextElementSibling : null;
      }

      // The chevron's rotation used to be driven by Tailwind's group-open: variant,
      // which only reacts to the details element's "open" attribute. That attribute
      // was being held in place for the entire close animation (so content stayed
      // visible while it shrank) and only removed at the very end — so the chevron
      // sat rotated for the full 300ms box animation, then snapped back on its own
      // separate 200ms transition afterward. Driving the chevron's transform
      // directly, in lockstep with the box's max-height transition, keeps both
      // animating together instead of running one after the other.
      function chevronOf(details) {
        var summary = details.querySelector(':scope > summary');
        return summary ? summary.querySelector('svg') : null;
      }

      function setChevron(details, open) {
        var chevron = chevronOf(details);
        if (!chevron) return;
        chevron.style.transition = 'transform ' + ACCORDION_MS + 'ms ' + ACCORDION_EASE;
        chevron.style.transform = open ? 'rotate(180deg)' : 'rotate(0deg)';
      }

      function animateOpen(details, content) {
        setChevron(details, true);
        if (!content) { details.setAttribute('open', ''); return; }
        content.style.transition = 'none';
        details.setAttribute('open', '');
        content.style.overflow = 'hidden';
        content.style.maxHeight = '0px';
        // force reflow so the browser registers the 0px start before we animate
        void content.offsetHeight;
        var target = content.scrollHeight;
        content.style.transition = 'max-height ' + ACCORDION_MS + 'ms ' + ACCORDION_EASE;
        content.style.willChange = 'max-height';
        // A single requestAnimationFrame isn't reliably enough to guarantee the
        // 0px starting height gets painted before we change the target — on a
        // heavier page (this grid alone lays out 20+ cards), the browser can
        // fold "start the transition" and "jump to target" into the same frame,
        // so the animation partially snaps instead of running smoothly, then
        // corrects itself mid-flight. Two nested rAFs guarantee the starting
        // state gets its own paint first, so the transition always has a clean
        // "before" to animate from.
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            content.style.maxHeight = target + 'px';
          });
        });
        content.addEventListener('transitionend', function handler(e) {
          if (e.propertyName !== 'max-height') return;
          content.style.maxHeight = '';
          content.style.overflow = '';
          content.style.transition = '';
          content.style.willChange = '';
          content.removeEventListener('transitionend', handler);
        });
      }

      function animateClose(details, content) {
        setChevron(details, false);
        if (!content) { details.removeAttribute('open'); return; }
        var startHeight = content.scrollHeight;
        content.style.transition = 'none';
        content.style.overflow = 'hidden';
        content.style.maxHeight = startHeight + 'px';
        void content.offsetHeight;
        content.style.transition = 'max-height ' + ACCORDION_MS + 'ms ' + ACCORDION_EASE;
        content.style.willChange = 'max-height';
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            content.style.maxHeight = '0px';
          });
        });
        content.addEventListener('transitionend', function handler(e) {
          if (e.propertyName !== 'max-height') return;
          content.removeEventListener('transitionend', handler);
          content.style.willChange = '';
          // Native <details> hides non-summary children the instant "open" is
          // removed. Releasing our inline max-height back to "auto" in that same
          // moment raced against that native hide and could flash the content
          // back to its full height for a frame before it vanished — the "snap"
          // at the end of the close. Leaving max-height pinned at 0 (rather than
          // clearing it) means there's nothing left to flash; it only gets reset
          // to auto the next time this panel opens.
          details.removeAttribute('open');
        });
      }

      // Belt-and-suspenders against the click-focus outline flash: an inline
      // style always wins the cascade regardless of when the Tailwind CDN
      // script injects its own stylesheet into <head>, so this can't lose a
      // specificity/ordering race the way an external CSS rule could.
      document.querySelectorAll('details[data-group] > summary').forEach(function (s) {
        s.style.outline = 'none';
      });

      document.addEventListener('click', function (e) {
        var summary = e.target.closest && e.target.closest('details[data-group] > summary');
        if (!summary) return;
        var details = summary.parentElement;
        e.preventDefault(); // stop native instant toggle so we can animate instead

        if (details.hasAttribute('open')) {
          animateClose(details, contentOf(details));
          return;
        }

        // Close any other open sibling panel, animated. Scoping to siblings
        // under the same parent (rather than matching every element with the
        // same data-group value document-wide) means each tutorial's challenge
        // list is its own independent exclusive group — opening a challenge in
        // Tutorial 2 won't reach into Tutorial 1 — without needing a uniquely
        // named group per tutorial.
        var group = details.getAttribute('data-group');
        Array.prototype.forEach.call(details.parentElement.children, function (other) {
          if (other !== details && other.matches('details[data-group="' + group + '"][open]')) {
            animateClose(other, contentOf(other));
          }
        });
        animateOpen(details, contentOf(details));
      });
    })();

    // ---- CSWA Level completion badges -------------------------------------
    // A problem card counts as "done" once it has a real Download CAD link
    // (an <a download> element) — that's exactly what turns a placeholder
    // "Not started" card into a finished one, so no separate bookkeeping is
    // needed. Each level's badge is recomputed from its own cards every time
    // the CSWA project detail panel is (re)rendered.
    var CSWA_BADGE_CLASSES = {
      complete: ['bg-emerald-50', 'text-emerald-600', 'border-emerald-200',
                 'dark:bg-emerald-500/10', 'dark:text-emerald-400', 'dark:border-emerald-500/20'],
      progress: ['bg-amber-50', 'text-amber-600', 'border-amber-200',
                 'dark:bg-amber-500/10', 'dark:text-amber-400', 'dark:border-amber-500/20'],
      pending:  ['bg-slate-50', 'text-slate-400', 'border-slate-200',
                 'dark:bg-slate-800/50', 'dark:text-slate-500', 'dark:border-slate-700']
    };

    // ---- CSWA auto-detection of uploaded practice problem files -----------
    // Every "Not started" placeholder card is tagged with data-level/data-problem
    // instead of being hand-edited. Rather than checking all ~240 possible
    // problems on every page load (slow, and mostly wasted since most don't
    // exist yet), each Level's placeholders are only checked the first time
    // that Level's <details> panel is actually opened — and only once per
    // modal-open session, so re-collapsing/re-expanding a Level doesn't
    // repeat the same network requests.
    //
    // Status rule per problem, based on which files exist at their expected
    // paths:
    //   PDF + SLDPRT + STL all present  -> Complete   (full card, CAD viewer)
    //   PDF only present                -> In Progress (card stays visible,
    //                                       shows the PDF link, no CAD yet)
    //   nothing present                 -> Not started (unchanged placeholder)
    function cswaFilePaths(level, num) {
      return {
        pdf: 'src/assets/files/pdf/level' + level + '/PracticeProblems_' + level + '_' + num + '_ENG.pdf',
        sldprt: 'src/assets/files/sldprt/level' + level + '/Practice%20Problem%20' + level + '.' + num + '.SLDPRT',
        stl: 'src/assets/files/stl/level' + level + '/Practice%20Problem%20' + level + '.' + num + '.STL'
      };
    }

    function cswaFileExists(url) {
      return fetch(url, { method: 'HEAD' })
        .then(function (res) { return res.ok; })
        .catch(function () { return false; });
    }

    var CSWA_ICON_CUBE = '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>';
    var CSWA_ICON_PDF = '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>';
    var CSWA_ICON_DOWNLOAD = '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>';

    function renderCswaComplete(row, level, num, paths) {
      var cadId = 'cad-' + level + '-' + num;
      row.className = 'rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 overflow-hidden self-start';
      row.removeAttribute('data-level');
      row.removeAttribute('data-problem');
      row.innerHTML =
        '<div class="flex items-center justify-between gap-3 px-4 py-2.5">' +
          '<span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">' + level + '.' + num + '</span>' +
          '<div class="flex items-center gap-2.5 shrink-0">' +
            '<button type="button" onclick="toggleCadViewer(this, \'' + cadId + '\', \'' + paths.stl + '\')" class="cad-view-btn flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400 hover:text-rose-500 uppercase tracking-wide transition-colors" title="View 3D">' + CSWA_ICON_CUBE + '</button>' +
            '<a href="' + paths.pdf + '" target="_blank" rel="noopener" class="text-[10px] font-mono font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wide transition-colors flex items-center" title="View PDF">' + CSWA_ICON_PDF + '</a>' +
            '<a href="' + paths.sldprt + '" download class="text-[10px] font-mono font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wide transition-colors flex items-center" title="Download CAD">' + CSWA_ICON_DOWNLOAD + '</a>' +
          '</div>' +
        '</div>' +
        '<div id="' + cadId + '" class="hidden border-t border-slate-100 dark:border-slate-800">' +
          '<div class="cad-canvas-holder relative w-full h-[240px] bg-[#0b0f1a]"></div>' +
        '</div>';
    }

    function renderCswaInProgress(row, level, num, paths) {
      row.className = 'rounded-xl bg-amber-50/40 dark:bg-amber-500/5 border border-amber-200/70 dark:border-amber-500/20 overflow-hidden self-start';
      row.innerHTML =
        '<div class="flex items-center justify-between gap-3 px-4 py-2.5">' +
          '<span class="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">' + level + '.' + num + '</span>' +
          '<div class="flex items-center gap-2.5 shrink-0">' +
            '<a href="' + paths.pdf + '" target="_blank" rel="noopener" class="text-[10px] font-mono font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wide transition-colors flex items-center" title="View PDF">' + CSWA_ICON_PDF + '</a>' +
            '<span class="text-[9px] font-mono font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">In Progress</span>' +
          '</div>' +
        '</div>';
    }

    function checkCswaLevel(details) {
      if (details.dataset.cswaChecked === 'true') return;
      var rows = details.querySelectorAll('.cswa-pending');
      details.dataset.cswaChecked = 'true'; // set up front so a rapid close/reopen can't double-fire
      if (!rows.length) return;

      var tasks = Array.prototype.map.call(rows, function (row) {
        var level = row.getAttribute('data-level');
        var num = row.getAttribute('data-problem');
        var paths = cswaFilePaths(level, num);
        return Promise.all([
          cswaFileExists(paths.pdf),
          cswaFileExists(paths.sldprt),
          cswaFileExists(paths.stl)
        ]).then(function (results) {
          var hasPdf = results[0], hasSldprt = results[1], hasStl = results[2];
          if (hasPdf && hasSldprt && hasStl) {
            renderCswaComplete(row, level, num, paths);
          } else if (hasPdf) {
            renderCswaInProgress(row, level, num, paths);
          }
          // otherwise: leave the "Not started" placeholder exactly as is
        });
      });

      Promise.all(tasks).then(updateCswaLevelBadges);
    }

    function initCswaLevelChecks() {
      document.querySelectorAll('details[data-group="cswa-level"]').forEach(function (details) {
        if (details.dataset.cswaListenerAttached === 'true') return;
        details.dataset.cswaListenerAttached = 'true';
        details.addEventListener('toggle', function () {
          if (details.open) checkCswaLevel(details);
        });
      });
    }

    function updateCswaLevelBadges() {
      var allBadgeClasses = CSWA_BADGE_CLASSES.complete
        .concat(CSWA_BADGE_CLASSES.progress, CSWA_BADGE_CLASSES.pending);

      var grandTotal = 0, grandDone = 0;

      document.querySelectorAll('details[data-group="cswa-level"]').forEach(function (details) {
        var badge = details.querySelector(':scope > summary .level-status-badge');
        var content = details.querySelector(':scope > summary + div');
        if (!badge || !content) return;

        var cards = content.querySelectorAll(':scope > div');
        var total = cards.length;
        var done = content.querySelectorAll(':scope > div a[download]').length;
        grandTotal += total;
        grandDone += done;

        badge.classList.remove.apply(badge.classList, allBadgeClasses);
        if (total === 0) {
          badge.textContent = '';
          return;
        }
        var state, label;
        if (done >= total) {
          state = 'complete'; label = 'Complete';
        } else if (done === 0) {
          state = 'pending'; label = 'Not Started';
        } else {
          state = 'progress'; label = done + '/' + total + ' In Progress';
        }
        badge.textContent = label;
        badge.classList.add.apply(badge.classList, CSWA_BADGE_CLASSES[state]);
      });

      var overview = document.getElementById('cswa-overview-badge');
      if (overview && grandTotal > 0) {
        overview.classList.remove.apply(overview.classList, allBadgeClasses);
        var overviewState, overviewLabel;
        if (grandDone >= grandTotal) {
          overviewState = 'complete'; overviewLabel = 'Complete';
        } else if (grandDone === 0) {
          overviewState = 'pending'; overviewLabel = 'Not Started';
        } else {
          overviewState = 'progress'; overviewLabel = grandDone + '/' + grandTotal + ' In Progress';
        }
        overview.textContent = overviewLabel;
        overview.classList.add.apply(overview.classList, CSWA_BADGE_CLASSES[overviewState]);
      }

      var headerStatus = document.getElementById('cswa-header-status');
      if (headerStatus && grandTotal > 0) {
        headerStatus.textContent = grandDone + ' of ' + grandTotal + ' Problems Completed \u00b7 GD&T & DFM/DFA In Progress';
      }
    }

    // ---- CSWA CAD 3D preview viewer -------------------------------------
    // Each "View 3D" button lazily creates a small Three.js scene inside its
    // panel the first time it's opened, loads the part's .stl, frames the
    // camera to it, and clamps OrbitControls zoom so the model can never be
    // zoomed so far out it's lost or so far in it overflows the canvas.
    var cadViewers = {}; // panelId -> { scene, camera, renderer, controls, holder, active, mesh }

    // A matcap gives CAD parts a shaded, "machined" look that reads
    // curvature and features far better than a flat single-color material —
    // generated on a canvas at runtime so no external texture image is needed.
    var cadMatcapTexture = null;
    function getCadMatcap() {
      if (cadMatcapTexture) return cadMatcapTexture;
      var size = 256;
      var canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext('2d');

      ctx.fillStyle = '#2b3646';
      ctx.fillRect(0, 0, size, size);

      // Broad soft key-light highlight, offset toward the upper-left like a
      // studio softbox — this is the core of matcap shading's "pop".
      var key = ctx.createRadialGradient(size * 0.32, size * 0.28, 0, size * 0.32, size * 0.28, size * 0.65);
      key.addColorStop(0, '#f5f7fa');
      key.addColorStop(0.35, '#cbd3de');
      key.addColorStop(0.7, '#5b6779');
      key.addColorStop(1, '#242e3a');
      ctx.fillStyle = key;
      ctx.fillRect(0, 0, size, size);

      // Cool rim light on the opposite side for edge/silhouette separation.
      var rim = ctx.createRadialGradient(size * 0.82, size * 0.86, 0, size * 0.82, size * 0.86, size * 0.5);
      rim.addColorStop(0, 'rgba(150,180,255,0.5)');
      rim.addColorStop(1, 'rgba(150,180,255,0)');
      ctx.fillStyle = rim;
      ctx.fillRect(0, 0, size, size);

      var tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      cadMatcapTexture = tex;
      return tex;
    }

    function toggleCadViewer(btn, panelId, stlPath) {
      var panel = document.getElementById(panelId);
      if (!panel) return;
      var isHidden = panel.classList.contains('hidden');

      if (isHidden) {
        panel.classList.remove('hidden');
        btn.classList.add('text-rose-500');
        btn.classList.remove('text-slate-400');
        if (!cadViewers[panelId]) {
          loadThreeJsThenRun(function () {
            initCadViewer(panelId, stlPath);
          });
        } else {
          resumeCadViewer(panelId);
          resizeCadViewer(panelId);
        }
      } else {
        panel.classList.add('hidden');
        btn.classList.remove('text-rose-500');
        btn.classList.add('text-slate-400');
        pauseCadViewer(panelId);
      }
    }

    function initCadViewer(panelId, stlPath) {
      var panel = document.getElementById(panelId);
      var holder = panel.querySelector('.cad-canvas-holder');
      if (!holder || typeof THREE === 'undefined') return;

      var width = holder.clientWidth || 300;
      var height = holder.clientHeight || 240;

      var loadingEl = document.createElement('div');
      loadingEl.className = 'absolute inset-0 flex flex-col items-center justify-center gap-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest';
      loadingEl.innerHTML = '<span class="w-4 h-4 border-2 border-slate-600 border-t-rose-500 rounded-full animate-spin"></span><span>Loading model…</span>';
      holder.appendChild(loadingEl);

      var scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0b0f1a);

      var camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 10000);

      var renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      renderer.domElement.style.display = 'block';
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      holder.appendChild(renderer.domElement);

      // Lower, cooler ambient fill + a strong key light (with shadows) + a
      // faint rim light for edge separation — this trio is what actually
      // sells depth; flat ambient-only lighting is why the parts read flat.
      scene.add(new THREE.HemisphereLight(0xffffff, 0x33415c, 0.55));
      var dir1 = new THREE.DirectionalLight(0xffffff, 1.35);
      dir1.position.set(1, 1.4, 1);
      dir1.castShadow = true;
      dir1.shadow.mapSize.width = 1024;
      dir1.shadow.mapSize.height = 1024;
      dir1.shadow.bias = -0.0008;
      scene.add(dir1);
      scene.add(dir1.target);
      var dir2 = new THREE.DirectionalLight(0xffffff, 0.28);
      dir2.position.set(-1, -0.4, -1);
      scene.add(dir2);
      var rim = new THREE.DirectionalLight(0xbcd1ff, 0.3);
      rim.position.set(-1.3, 0.7, -1.5);
      scene.add(rim);

      // Soft contact shadow the part casts onto — this single element does
      // more for perceived depth than anything else, since it grounds the
      // object instead of letting it float on the dark background.
      var ground = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.ShadowMaterial({ opacity: 0.4 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.visible = false;
      scene.add(ground);

      var controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enablePan = false;               // rotate + zoom only, per spec
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = 0.6;
      controls.zoomSpeed = 0.7;

      var state = { scene: scene, camera: camera, renderer: renderer, controls: controls, holder: holder, active: true, mesh: null };
      cadViewers[panelId] = state;

      function animate() {
        if (!state.active) return;
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      }

      var loader = new THREE.STLLoader();
      loader.load(
        stlPath,
        function (geometry) {
          if (loadingEl.parentNode) holder.removeChild(loadingEl);

          geometry.center();
          geometry.computeBoundingSphere();
          geometry.computeBoundingBox();
          var radius = (geometry.boundingSphere && geometry.boundingSphere.radius) ? geometry.boundingSphere.radius : 1;
          var bbox = geometry.boundingBox;

          var material = new THREE.MeshMatcapMaterial({ matcap: getCadMatcap(), color: 0xe4e7ec });
          var mesh = new THREE.Mesh(geometry, material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          // Overlay crisp feature edges (sketch boundaries, fillet tangencies,
          // hole rims) on top of the shaded surface — this "shaded + edges"
          // look is what actually makes CAD geometry easy to read at a glance,
          // since matcap shading alone can still blur subtle feature lines.
          var edgeGeometry = new THREE.EdgesGeometry(geometry, 30);
          var edgeMaterial = new THREE.LineBasicMaterial({ color: 0x1b2333, transparent: true, opacity: 0.4 });
          var edgeLines = new THREE.LineSegments(edgeGeometry, edgeMaterial);
          mesh.add(edgeLines);
          // SolidWorks' native coordinate system is already Y-up (Front Plane = XY),
          // so the exported STL lines up with Three.js's Y-up scene as-is — no rotation needed.
          scene.add(mesh);
          state.mesh = mesh;

          // Ground the part with a soft contact shadow sized/positioned to its footprint.
          var groundSize = radius * 8;
          ground.geometry.dispose();
          ground.geometry = new THREE.PlaneGeometry(groundSize, groundSize);
          ground.position.y = bbox.min.y - radius * 0.02;
          ground.visible = true;

          // Fit the key light's shadow frustum to this part so shadows stay crisp
          // regardless of the model's actual scale.
          dir1.position.set(1, 1.4, 1).normalize().multiplyScalar(radius * 3);
          dir1.target.position.set(0, 0, 0);
          dir1.target.updateMatrixWorld();
          dir1.shadow.camera.left = -radius * 1.8;
          dir1.shadow.camera.right = radius * 1.8;
          dir1.shadow.camera.top = radius * 1.8;
          dir1.shadow.camera.bottom = -radius * 1.8;
          dir1.shadow.camera.near = radius * 0.1;
          dir1.shadow.camera.far = radius * 8;
          dir1.shadow.camera.updateProjectionMatrix();

          var dist = radius * 2.6;
          camera.position.set(dist * 0.6, dist * 0.5, dist * 0.8);
          camera.near = Math.max(radius * 0.02, 0.001);
          camera.far = radius * 30;
          camera.updateProjectionMatrix();

          controls.target.set(0, 0, 0);
          controls.minDistance = radius * 1.3; // can't zoom in past the part
          controls.maxDistance = radius * 6;   // can't zoom out until it's lost
          controls.update();

          animate();
        },
        undefined,
        function () {
          if (loadingEl.parentNode) holder.removeChild(loadingEl);
          var errEl = document.createElement('div');
          errEl.className = 'absolute inset-0 flex items-center justify-center text-center px-4 text-[10px] font-mono text-slate-500 uppercase tracking-widest';
          errEl.textContent = '3D preview not available yet';
          holder.appendChild(errEl);
          state.active = false;
        }
      );
    }

    function pauseCadViewer(panelId) {
      var state = cadViewers[panelId];
      if (state) state.active = false;
    }

    function resumeCadViewer(panelId) {
      var state = cadViewers[panelId];
      if (!state || state.active || !state.mesh) return;
      state.active = true;
      (function animate() {
        if (!state.active) return;
        requestAnimationFrame(animate);
        state.controls.update();
        state.renderer.render(state.scene, state.camera);
      })();
    }

    function resizeCadViewer(panelId) {
      var state = cadViewers[panelId];
      if (!state) return;
      var width = state.holder.clientWidth;
      var height = state.holder.clientHeight;
      if (!width || !height) return;
      state.camera.aspect = width / height;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(width, height);
    }

    window.addEventListener('resize', function () {
      Object.keys(cadViewers).forEach(resizeCadViewer);
    });
