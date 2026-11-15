# Application Studio

Unlisted route at `/applications/`; `/generator/` and `/resume/generator/` remain compatible. No authentication is implied by the URL or noindex metadata. Only public resume content and reviewed wording assets are published. Resume input stays in memory. Owner-confirmed profile answers and saved application drafts use private authenticated Cloudflare D1 endpoints. OCR uses Tesseract.js 6.0.1 from jsDelivr on demand.

The renderer assembles pre-rendered Word text fragments into an unchanged template. All fragments retain embedded fonts and selectable text. The base retains the original links. Removed original wording is absent from the fragments, rather than hidden behind a rectangle. This preserves the original Word layout without requiring Word on the visitor's computer.

The generator selects from reviewed wording based on job topics. It does not invent new accomplishments or reorder the resume's sections. Skills keep their existing wording and order. Inputs are plain text and never executed as instructions.

When updating the resume, rebuild the assets using the private `resume-generator/build_web_assets.py` maintenance script in the owner workspace. It checks the template, baseline hashes and cited claims, renders each variant through Word, verifies one-page export and all links, and checks that each variant fits its fixed text slot. Keep private DOCX/profile inputs outside this public repository. The browser blocks export when the canonical resume hash or a selected project claim changes.

Run `node scripts/check-resume-generator.mjs` and inspect a rendered test export before publishing. An unmodified browser composition was pixel-identical to the Word reference at 144 dpi. The original uploaded PDF remains the portfolio's canonical download.


## Application preparation and extension

The user declined hosted Browser Run on 2026-11-14, then requested a desktop autofill extension instead. Do not enable Browser Run or Durable Objects. The Worker uses its existing D1 binding only. Application profile and history are never exposed by public job endpoints.

The public site supplies a reviewed seed profile, which the owner must confirm before saving. No eligibility answer is inferred. Custom reusable answers are owner supplied. Application status is self-reported, including Submitted. Employer applications open on their original platform; this site never submits.

Extension source is in `tools/application-helper/`. Run `node scripts/build-application-helper.mjs` after changes to shared profile/autofill modules, then `node scripts/check-applications.mjs`. The build makes a ZIP with code only, never a profile or key. Chrome/Edge desktop installation uses Load unpacked. Permission scope is activeTab, scripting and storage; no persistent website access or background scan. The profile export is imported by the user and remains in extension-local storage until forgotten/uninstalled. Export/import again after profile changes.

Autofill recognizes exact common labels and exact owner-supplied questions, preserves filled fields, rechecks URL and field identity after review, and never invokes a submit/click operation. Native text/select fields are supported; custom widgets, cross-origin embedded forms, uploads, legal and sensitive questions remain manual. Unit tests cover matching, skipped fields, edited fields, no submission, profile UI persistence and export readiness. Employer-specific compatibility is not guaranteed.
