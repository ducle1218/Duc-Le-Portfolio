# Project content

`project-facts.json` is the structured source for cards, spotlight summaries,
and the public `data/portfolio.json` feed. `project-presentation.json` holds image
metadata. `profile-facts.json` contains existing public profile statements.
`evidence-lock.json` detects unreviewed source changes. See
`../../APPLICATION_DATA.md` for the editing and review workflow.

The published detail views load `projects/box-*.html` only when selected. These
files are the source of the displayed project write-ups. Shared controls live
in `src/scripts/portfolio.js`, `sprocket-controls.js`, and `cad-evolution.js`.

The earlier `engineering-projects.js` and `sprocket-project.js` data files are
retained for reference and excluded from the Pages artifact. Edit the HTML here
for displayed content. The build derives the completed CAD-viewer count from
`box-3.html` automatically.

After changing scripts or styles, run `node scripts/build-site-js.mjs` and
`node scripts/build-site-css.mjs`. CI runs these after compiling Tailwind.
`node scripts/check-loading.mjs` checks initial-loading constraints and project
loader behavior. Diagnostic timing instructions are in `scripts/PERFORMANCE.md`.
