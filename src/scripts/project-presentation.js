/* Enhance the existing project renderer without duplicating its project data. */
(() => {
  'use strict';

  const cardRoots = ['projects-grid', 'home-project-list'];
  let lastProjectCard = null;
  let viewer = null;
  let viewerImage = null;
  let viewerCaption = null;
  let viewerCounter = null;
  let viewerPrevious = null;
  let viewerNext = null;
  let gallery = [];
  let galleryIndex = 0;
  let returnFocus = null;
  let previousOverflow = '';

  function enhanceSkillLogos(root) {
    root.querySelectorAll('.project-card-skills span, .case-tools span, .legacy-case-study span').forEach(tag => {
      if (tag.querySelector('img') || tag.children.length) return;
      const label = tag.textContent.trim().toLowerCase();
      const file = /^(3d printing|fdm printing|design for printing|printed-part design)$/.test(label) ? 'bambu-logo.png' :
        /^onshape(?: fea)?$/.test(label) ? 'onshape_logo.png' : label === 'solidworks' ? 'solidworks_icon.png' : null;
      if (!file) return;
      const logo = document.createElement('img');
      logo.src = 'src/assets/images/logos/' + file;
      logo.alt = '';
      logo.className = 'skill-logo';
      tag.classList.add('skill-with-logo');
      tag.prepend(logo);
    });
  }

  function enhanceCards(root) {
    root.querySelectorAll(':scope > [onclick]').forEach((card) => {
      if (card.dataset.presentationReady) return;
      const cover = card.children[0];
      const body = card.children[1];
      if (!cover || !body) return;
      card.dataset.presentationReady = 'true';
      card.classList.add('portfolio-card');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `View project: ${card.querySelector('h3')?.textContent.trim() || 'Project'}`);
      cover.classList.add('project-card-cover');
      body.classList.add('project-card-body');

      const sections = Array.from(body.children);
      const classes = ['', 'project-card-badges', 'project-card-meta',
        'project-card-description', 'project-card-skills', 'project-card-link'];
      sections.forEach((section, index) => {
        if (classes[index]) section.classList.add(classes[index]);
      });
      enhanceSkillLogos(card);

      // "Personal / Personal Project" repeats the same label twice.
      const badges = sections[1];
      if (badges?.children.length === 2) {
        const category = badges.children[0].textContent.trim().toLowerCase();
        const subtitle = badges.children[1].textContent.trim().toLowerCase();
        if (subtitle === `${category} project` || subtitle === category) {
          badges.children[1].remove();
        }
      }

      const linkLabel = sections[5]?.querySelector('span');
      if (linkLabel) linkLabel.textContent = 'View project';

      const image = cover.querySelector('img');
      if (image) {
        // A failed cover should retain the same geometry as its neighbors.
        image.removeAttribute('onerror');
        const markUnavailable = () => {
          image.hidden = true;
          image.style.display = 'none';
          cover.style.removeProperty('display');
          cover.classList.add('is-unavailable');
        };
        image.addEventListener('error', markUnavailable);
        if (image.complete && !image.naturalWidth) markUnavailable();
      }

      card.addEventListener('click', () => { lastProjectCard = card; }, { capture: true });
      card.addEventListener('keydown', (event) => {
        if (event.target !== card || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        card.click();
      });
    });
  }

  function imageCaption(image) {
    const caption = image.closest('figure')?.querySelector('figcaption');
    return caption?.textContent.replace(/\s+/g, ' ').trim() || image.alt || 'Project process image';
  }

  function renderViewerImage() {
    const source = gallery[galleryIndex];
    viewerImage.src = source.currentSrc || source.src;
    viewerImage.alt = source.alt || 'Project process image';
    viewerCaption.textContent = imageCaption(source);
    viewerCounter.textContent = `Image ${galleryIndex + 1} of ${gallery.length}`;
    viewerPrevious.hidden = gallery.length < 2;
    viewerNext.hidden = gallery.length < 2;
  }

  function stepGallery(direction) {
    galleryIndex = (galleryIndex + direction + gallery.length) % gallery.length;
    renderViewerImage();
  }

  function createViewer() {
    viewer = document.createElement('dialog');
    viewer.className = 'project-image-viewer';
    viewer.setAttribute('aria-label', 'Project image viewer');
    viewer.setAttribute('aria-describedby', 'project-viewer-caption');
    viewer.innerHTML = `
      <div class="project-viewer-shell">
        <div class="project-viewer-bar">
          <span class="project-viewer-counter" aria-live="polite"></span>
          <button type="button" class="project-viewer-close" aria-label="Close image viewer" autofocus>Close <span aria-hidden="true">&nbsp;×</span></button>
        </div>
        <figure>
          <div class="project-viewer-canvas"><img alt="" decoding="async"></div>
          <figcaption id="project-viewer-caption"></figcaption>
        </figure>
        <div class="project-viewer-footer">
          <button type="button" class="project-viewer-previous" aria-label="Previous image">← Previous</button>
          <span class="project-viewer-hint">Arrow keys to browse · Esc to close</span>
          <button type="button" class="project-viewer-next" aria-label="Next image">Next →</button>
        </div>
      </div>`;
    document.body.appendChild(viewer);
    viewerImage = viewer.querySelector('img');
    viewerCaption = viewer.querySelector('figcaption');
    viewerCounter = viewer.querySelector('.project-viewer-counter');
    viewerPrevious = viewer.querySelector('.project-viewer-previous');
    viewerNext = viewer.querySelector('.project-viewer-next');
    viewer.querySelector('.project-viewer-close').addEventListener('click', () => viewer.close());
    viewerPrevious.addEventListener('click', () => stepGallery(-1));
    viewerNext.addEventListener('click', () => stepGallery(1));
    viewer.addEventListener('click', (event) => {
      if (event.target === viewer) viewer.close();
    });
    viewer.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        stepGallery(event.key === 'ArrowLeft' ? -1 : 1);
      }
    });
    viewer.addEventListener('close', () => {
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    });
  }

  function openImage(image) {
    if (!viewer) createViewer();
    const root = document.getElementById('project-detail-body');
    gallery = Array.from(root.querySelectorAll('.project-zoomable'))
      .filter((candidate) => candidate.getClientRects().length > 0);
    galleryIndex = gallery.indexOf(image);
    if (galleryIndex < 0) return;
    returnFocus = image;
    renderViewerImage();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    viewer.showModal();
  }

  function enhanceDetail(root) {
    Array.from(root.children).forEach((child) => {
      if (!child.classList.contains('case-study')) child.classList.add('legacy-case-study');
    });
    enhanceSkillLogos(root);
    root.querySelectorAll('img').forEach((image) => {
      if (image.dataset.zoomReady || image.closest('a, button, [data-no-lightbox]') ||
          /\/logos\//.test(image.getAttribute('src') || '') || !image.alt) return;
      image.dataset.zoomReady = 'true';
      image.classList.add('project-zoomable');
      image.setAttribute('role', 'button');
      image.setAttribute('tabindex', '0');
      image.setAttribute('aria-label', `Enlarge image: ${image.alt}`);
      image.setAttribute('aria-haspopup', 'dialog');
      image.setAttribute('title', 'Click or press Enter to enlarge');
      image.addEventListener('click', () => openImage(image));
      image.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openImage(image);
      });
    });
  }

  function initialize() {
    cardRoots.forEach((id) => {
      const root = document.getElementById(id);
      if (!root) return;
      enhanceCards(root);
      new MutationObserver(() => enhanceCards(root)).observe(root, { childList: true });
    });

    const detail = document.getElementById('project-detail-body');
    if (!detail) return;
    enhanceDetail(detail);
    new MutationObserver((mutations) => {
      enhanceDetail(detail);
      if (mutations.some((mutation) => mutation.target === detail)) {
        requestAnimationFrame(() => {
          const title = detail.querySelector('h2');
          if (!title || !title.getClientRects().length) return;
          title.tabIndex = -1;
          title.focus({ preventScroll: true });
        });
      }
    }).observe(detail, { childList: true, subtree: true });

    document.querySelectorAll('[onclick="hideProjectDetail()"]')
      .forEach((button) => button.addEventListener('click', () => {
        // The Projects tab may have a different copy of a featured card.
        const action = lastProjectCard?.getAttribute('onclick');
        const matchingCard = Array.from(document.querySelectorAll('#projects-grid > .portfolio-card'))
          .find((card) => card.getAttribute('onclick') === action);
        requestAnimationFrame(() => {
          if (matchingCard?.getClientRects().length) matchingCard.focus({ preventScroll: true });
        });
      }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
