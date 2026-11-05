# Resume Studio

Unlisted, browser-only route at `resume/generator/`. No authentication is implied by the URL or noindex metadata. Only public resume content and reviewed wording assets are published. User input stays in memory. OCR uses Tesseract.js 6.0.1 from jsDelivr on demand.

The renderer assembles pre-rendered Word text fragments into an unchanged template. All fragments retain embedded fonts and selectable text. The base retains the original links. Removed original wording is absent from the fragments, rather than hidden behind a rectangle. This preserves the original Word layout without requiring Word on the visitor's computer.

The generator selects from reviewed wording based on job topics. It does not invent new accomplishments or reorder the resume's sections. Skills keep their existing wording and order. Inputs are plain text and never executed as instructions.

When updating the resume, rebuild the assets using the private `resume-generator/build_web_assets.py` maintenance script in the owner workspace. It checks the template, baseline hashes and cited claims, renders each variant through Word, verifies one-page export and all links, and checks that each variant fits its fixed text slot. Keep private DOCX/profile inputs outside this public repository. The browser blocks export when the canonical resume hash or a selected project claim changes.

Run `node scripts/check-resume-generator.mjs` and inspect a rendered test export before publishing. An unmodified browser composition was pixel-identical to the Word reference at 144 dpi. The original uploaded PDF remains the portfolio's canonical download.
