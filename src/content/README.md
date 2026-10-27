# Project content

The published detail views load `projects/box-*.html` only when selected. These
files are the source of the displayed project write-ups. Shared controls live
in `src/scripts/portfolio.js`, `sprocket-controls.js`, and `cad-evolution.js`.

The earlier `engineering-projects.js` and `sprocket-project.js` data files are
retained for reference and are not requested by the page. Edit the HTML here
for displayed content. The build derives the completed CAD-viewer count from
`box-3.html` automatically.

After changing scripts or styles, run `node scripts/build-site-js.mjs` and
`node scripts/build-site-css.mjs`. CI runs these after compiling Tailwind.
`node scripts/check-loading.mjs` checks initial-loading constraints and project
loader behavior. Diagnostic timing instructions are in `scripts/PERFORMANCE.md`.
