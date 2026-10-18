/* The preview and download use the exact same PDF bytes. */
(() => {
  const preview = document.getElementById('resume-preview');
  const download = document.getElementById('resume-download');
  if (!preview || !download) return;
  const pagesRoot = preview.querySelector('.resume-pages');
  const status = preview.querySelector('.resume-status');
  const source = download.href;
  let pdfjs, documentPromise, pages = [], renderTimer, revision = 0;
  let renderedWidth = 0, renderedRatio = 0, downloadingUrl;

  function showError() {
    preview.setAttribute('aria-busy', 'false');
    status.hidden = false;
    status.replaceChildren(document.createTextNode('The preview could not load. You can still '));
    const link = document.createElement('a');
    link.href = downloadingUrl || source;
    link.download = 'Duc_Le_Resume.pdf';
    link.textContent = 'download the resume';
    status.append(link, document.createTextNode('. '));
    const retry = document.createElement('button');
    retry.type = 'button'; retry.textContent = 'Try again';
    retry.addEventListener('click', () => {
      documentPromise = null; renderedWidth = 0;
      pages.forEach(p => p.task?.cancel()); pages = []; pagesRoot.replaceChildren();
      status.textContent = 'Loading resume…'; queueRender();
    });
    status.append(retry);
  }

  async function loadDocument() {
    pdfjs = await import('../vendor/pdfjs/pdf.min.mjs');
    const assets = new URL('src/vendor/pdfjs/', document.baseURI);
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdf.worker.min.mjs', assets).href;
    const response = await fetch(source, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Resume request failed (${response.status})`);
    const bytes = await response.arrayBuffer();
    // Capture the same response for download before PDF.js transfers its buffer.
    const pdfBlob = new Blob([bytes], { type: 'application/pdf' });
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(bytes),
      cMapUrl: new URL('cmaps/', assets).href, cMapPacked: true,
      standardFontDataUrl: new URL('standard_fonts/', assets).href,
      wasmUrl: new URL('wasm/', assets).href,
      isEvalSupported: false,
    }).promise;
    if (downloadingUrl) URL.revokeObjectURL(downloadingUrl);
    downloadingUrl = URL.createObjectURL(pdfBlob); download.href = downloadingUrl;
    preview.dataset.pageCount = String(pdf.numPages);
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const element = document.createElement('section'); element.className = 'resume-page';
      element.setAttribute('aria-label', `Resume page ${number} of ${pdf.numPages}`);
      const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true');
      const text = document.createElement('div'); text.className = 'textLayer';
      const links = document.createElement('div'); links.className = 'resume-links';
      element.append(canvas, text, links); pagesRoot.append(element);
      const [content, annotations] = await Promise.all([page.getTextContent(), page.getAnnotations()]);
      pages.push({ page, element, canvas, text, links, content, annotations });
    }
    return pdf;
  }

  function renderLinks(entry, viewport) {
    entry.links.replaceChildren();
    for (const annotation of entry.annotations) {
      if (annotation.subtype !== 'Link' || !annotation.url) continue;
      let url;
      try { url = new URL(annotation.url); } catch { continue; }
      if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) continue;
      const [x1, y1, x2, y2] = annotation.rect;
      const rect = [...viewport.convertToViewportPoint(x1, y1), ...viewport.convertToViewportPoint(x2, y2)];
      const link = document.createElement('a'); link.href = url.href;
      link.setAttribute('aria-label', annotation.title || (url.protocol === 'mailto:' ? `Email ${url.pathname}` : `Open ${url.hostname || url.pathname}`));
      if (url.protocol.startsWith('http')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      Object.assign(link.style, {
        left: `${Math.min(rect[0], rect[2])}px`, top: `${Math.min(rect[1], rect[3])}px`,
        width: `${Math.abs(rect[2] - rect[0])}px`, height: `${Math.abs(rect[3] - rect[1])}px`,
      });
      entry.links.append(link);
    }
  }

  async function render() {
    if (!preview.getClientRects().length || !pagesRoot.clientWidth) return;
    const current = ++revision; preview.setAttribute('aria-busy', 'true');
    try {
      await (documentPromise ||= loadDocument());
      if (current !== revision || !preview.getClientRects().length) return;
      const width = pagesRoot.clientWidth, ratio = Math.min(devicePixelRatio || 1, 3);
      if (width === renderedWidth && ratio === renderedRatio) {
        preview.setAttribute('aria-busy', 'false'); return;
      }
      for (const entry of pages) {
        if (current !== revision) return;
        const base = entry.page.getViewport({ scale: 1 });
        const viewport = entry.page.getViewport({ scale: width / base.width });
        const outputRatio = Math.min(ratio, Math.sqrt(16000000 / (viewport.width * viewport.height)));
        entry.task?.cancel();
        if (entry.task) { try { await entry.task.promise; } catch {} }
        if (current !== revision) return;
        entry.element.style.height = `${viewport.height}px`;
        entry.element.style.setProperty('--total-scale-factor', String(viewport.scale * viewport.userUnit));
        entry.canvas.width = Math.ceil(viewport.width * outputRatio);
        entry.canvas.height = Math.ceil(viewport.height * outputRatio);
        entry.canvas.style.width = `${viewport.width}px`; entry.canvas.style.height = 'auto';
        entry.task = entry.page.render({
          canvasContext: entry.canvas.getContext('2d'), viewport,
          transform: outputRatio === 1 ? null : [outputRatio, 0, 0, outputRatio, 0, 0],
          background: '#ffffff',
        });
        await entry.task.promise;
        if (current !== revision) return;
        entry.textLayer?.cancel(); entry.text.replaceChildren();
        entry.textLayer = new pdfjs.TextLayer({ textContentSource: entry.content, container: entry.text, viewport });
        await entry.textLayer.render(); renderLinks(entry, viewport);
      }
      if (current !== revision) return;
      renderedWidth = width; renderedRatio = ratio;
      status.hidden = true; preview.setAttribute('aria-busy', 'false');
    } catch (error) {
      if (current !== revision || error.name === 'RenderingCancelledException') return;
      console.error('Resume preview:', error); showError();
    }
  }

  function queueRender() { clearTimeout(renderTimer); renderTimer = setTimeout(render, 100); }
  new ResizeObserver(queueRender).observe(pagesRoot);
  window.addEventListener('resize', queueRender);
  queueRender();
})();
