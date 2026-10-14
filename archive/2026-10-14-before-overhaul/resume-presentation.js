/* Keep the same-origin, selectable resume readable at every viewport width. */
(() => {
  const frame = document.getElementById('resume-frame');
  if (!frame) return;
  const resize = () => {
    const main = frame.contentDocument?.querySelector('main');
    if (main && frame.clientWidth) frame.style.height = `${Math.ceil(main.getBoundingClientRect().height) + 2}px`;
  };
  frame.addEventListener('load', () => {
    resize();
    const main = frame.contentDocument?.querySelector('main');
    if (main) new ResizeObserver(resize).observe(main);
  });
  new ResizeObserver(resize).observe(frame);
  window.addEventListener('resize', resize);
})();
