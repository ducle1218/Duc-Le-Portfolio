# Listing and spotlight images

These variants reduce the bytes needed for the homepage and project archive. Full-size project images remain in their original locations for detail pages.

Use `manifest.json` to map each original `source` to its `src` and `srcset`. The manifest includes pixel dimensions and file sizes. For a spotlight, use `heroSizes`; for a project card, use `cardSizes`. Use the listed dimensions on `<img>` to reserve space. Keep the initial spotlight eager/high-priority and listing images lazy/async. Do not preload the other spotlight images.

The photo-card variants use the same centered 4:3 crop already used by the card CSS. CAD/analysis cards and hero cutouts retain their aspect ratios; cutouts retain transparency. No variant enlarges the original image.

At the default variant sizes:

| Assets | Original bytes | Optimized bytes |
| --- | ---: | ---: |
| Initial quadruped spotlight | 1,173,573 | 54,166 |
| First three cards | 517,475 | 75,334 |
| All twelve cards | 5,920,249 | 395,042 |
| Seven small skill logos | 274,696 | 8,802 |

Higher-resolution variants are available for large/high-density displays. The quadruped spotlight is 99,624 bytes at 960 px wide and 155,692 bytes at 1280 px wide.

Regenerate with Python + Pillow using `scripts/optimize-listing-images.py`. This is an offline maintenance task; it does not run in the browser or during normal startup.

## Related loading audit

- The current visual system uses DM Sans and Space Grotesk. Instrument Serif is overridden by the final sculptural stylesheet; Inter is not needed by the current body/heading styles. `src/styles/fonts.css` serves the two required families locally with `font-display: swap`; their combined font payload is 59,220 bytes. Font licenses and official source URLs are under `src/assets/fonts/`.
- Only the visible spotlight needs high-priority image loading. Keep card images lazy and reserve their geometry to prevent layout shifts.
- The homepage workbench video is 19,879,370 bytes. With autoplay, `preload="metadata"` does not prevent video loading for playback. Attach its source when the workbench approaches the viewport or when the visitor plays it.
- Resume, Sprocket, and CAD-evolution styles are not used by the initial homepage hero. They can load with their respective views. The existing seven external stylesheets total approximately 174 KB uncompressed; unrelated views and obsolete themes should not delay the first paint.
- These are byte reductions, not a guarantee of a 500 ms public-network load. Check cold-cache first contentful paint/LCP and resource timing after integration.
