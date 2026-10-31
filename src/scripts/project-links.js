/* Stable public project links for resumes and the machine-readable feed. */
(() => {
  window.updateProjectUrl = id => {
    const url = new URL(location.href);
    if (id) url.searchParams.set('project', id);
    else url.searchParams.delete('project');
    history.replaceState(null, '', url);
  };
  const id = new URLSearchParams(location.search).get('project');
  if (id && TIMELINE_ITEMS.some(item => item.id === id)) showProjectDetail(id);
})();
