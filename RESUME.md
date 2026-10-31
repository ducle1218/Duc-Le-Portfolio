# Updating the resume

The single source is `src/assets/resume/Duc_Le_Resume.pdf`.

Replace that file with the new PDF, keeping the same filename, and publish the commit to `main` through the normal pull-request process. No HTML, JSON, screenshots, or template changes are needed. GitHub Pages will deploy the replacement. You can also provide the new PDF in this chat for the update to be prepared and published.

The Resume tab renders the PDF itself with a self-hosted PDF.js renderer. Its page layout, fonts, page count, selectable text, and external links come from the PDF. The download button uses the same fetched bytes as the preview, so they cannot show different versions within a page visit. PDF requests bypass the browser cache on a new page load or retry.

The Google Docs synchronization automation remains paused. Do not run the historical `scripts/build_resume.py` exporter: it would replace the manually supplied PDF. `resume.html`, `resume.json`, and `sync.json` are legacy exports and are not used by the current Resume tab.

## Local preview

The normal JavaScript build also refreshes `data/resume-manifest.json` with the PDF's SHA-256 and byte count, and updates the public dataset snapshot. It does not rewrite the PDF or infer qualifications. Application tools must review changed PDF content before reusing cached answers. See `APPLICATION_DATA.md`. Legacy exports and the outdated `src/assets/images/duc_le_resume.pdf` are excluded from the Pages artifact.

Use Node 24 or newer, install `pdfjs-dist@6.4.299`, then run `node scripts/vendor-pdfjs.mjs`. Serve the repository over HTTP. The Pages workflow performs the same preparation automatically. Generated `src/vendor/pdfjs/` files are ignored by Git and included in the deployed Pages artifact.

Before publishing, check the Resume tab on desktop and mobile, select some text, check the document links, and confirm that the downloaded file's SHA-256 matches the supplied PDF. The viewer supports multiple pages and includes a direct download fallback if rendering fails.
