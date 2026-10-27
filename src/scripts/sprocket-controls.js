document.addEventListener('click', event => {
  const view = event.target.closest('[data-sp-view]');
  if (view) {
    const root = view.closest('.sprocket-case');
    const built = view.dataset.spView === 'built';
    root.querySelector('.sp-cad-stage').hidden = built;
    root.querySelector('.sp-built-image').hidden = !built;
    if (!built) root.querySelector('.sp-cad-stage').cadViewer?.invalidate();
    root.querySelector('.sp-camera-tools').hidden = built || !root.querySelector('.sp-cad-stage').cadViewer?.loaded;
    root.querySelector('#sp-model-caption').textContent = built ? 'Physical build · the CAD package brought onto the competition field.' : 'Onshape assembly · drivetrain, intake, and mechanism packaging.';
    root.querySelectorAll('[data-sp-view]').forEach(button => button.setAttribute('aria-pressed', String(button === view)));
  }
  const decision = event.target.closest('[data-sp-design]');
  if (decision) {
    const root = decision.closest('.sprocket-case');
    root.querySelectorAll('[data-sp-design]').forEach(button => button.setAttribute('aria-pressed', String(button === decision)));
    root.querySelectorAll('[data-sp-panel]').forEach(panel => { panel.hidden = panel.dataset.spPanel !== decision.dataset.spDesign; });
  }
});

// Load the renderer only after an explicit request to inspect the assembly.
let sprocketViewerModule;
document.addEventListener('click', async event => {
  const reset = event.target.closest('[data-sp-reset]');
  if (reset) {
    reset.closest('.sp-model').querySelector('.sp-cad-stage').cadViewer?.reset();
  }
  const button = event.target.closest('[data-sp-load]');
  if (!button || button.disabled) return;
  const stage = button.closest('.sp-cad-stage');
  const status = stage.querySelector('.sp-view-status');
  button.disabled = true;
  status.textContent = 'Loading interactive assembly…';
  const fail = () => {
    stage.cadViewer?.dispose();
    stage.cadViewer = null;
    stage.closest('.sp-model').querySelector('.sp-camera-tools').hidden = true;
    stage.querySelector('img').hidden = false;
    button.hidden = false;
    button.disabled = false;
    button.textContent = 'Retry 3D viewer';
    status.textContent = 'The 3D view could not load. You can still view the CAD image or built robot.';
  };
  try {
    sprocketViewerModule ||= import('./sprocket-cad.bundle.js?v=20261018-2').catch(error => { sprocketViewerModule = null; throw error; });
    const {createSprocketViewer} = await sprocketViewerModule;
    if (!stage.isConnected) return;
    const attempt = Number(stage.dataset.attempt || 0);
    stage.dataset.attempt = String(attempt + 1);
    stage.cadViewer = await createSprocketViewer(stage, 'src/assets/models/SprocketRobot.glb?v=20261018-colors' + (attempt ? '&retry=' + Date.now() : ''));
    if (!stage.isConnected || !stage.cadViewer.loaded) return;
    stage.querySelector('img').hidden = true;
    button.hidden = true;
    status.textContent = '';
    stage.closest('.sp-model').querySelector('.sp-camera-tools').hidden = stage.hidden;
  } catch (error) { fail(); }
});
