# Quadruped CAD evolution — source and rendering notes

These clips use real STEP exports supplied by Duc Le. The original STEP files remain unchanged. They are not included in this folder or the reusable b-roll ZIP.

## Included sequences

| Clip | Chosen states | Duration | Selection |
|---|---:|---:|---|
| Right upper-leg support | 6 | 23 seconds | All six supplied right-support exports, October 4–10. |
| Front head / servo mount | 4 | 15 seconds | Four visible geometry stages, October 3–10; one duplicate and one subtle real revision omitted. |
| Main body / connector P2 | 3 | 11 seconds | Three major silhouettes; real intermediate hole-spacing variants omitted. This is a connector part, not the whole chassis. |

`sequences.json` records every selected original filename, its SHA-256, exact raw STEP export timestamp, and any alignment translation. It also identifies omitted exports and why they are omitted. Similar volume or appearance does not make two files duplicates: head `(3)` moves counterbore axes by 0.125 mm; the body variants change central-hole spacing.

## What the animation represents

This is a curated sequence of exported shapes, not a reconstruction of the CAD feature tree. Dates are export timestamps. Explicit UTC `Z` suffixes are preserved, and Main Body P2 translator timestamps without a timezone remain unspecified. Filename download counters are not treated as revision IDs.

Each clip uses a fixed orthographic camera and constant physical scale. All its states share one center derived from their combined bounds. The earliest right-support export is translated **-63.2 mm in X** to align its mounting reference; it is not rotated, mirrored, or resized. Geometry is otherwise rendered in the original coordinate orientation.

The gray-blue surface, dark feature edges, and studio lighting are a neutral presentation treatment rather than a claim about native CAD colors. Real geometry stills hold for 3 seconds, then cross-dissolve for 1 second. The transition blends images; it does not fabricate intermediate solid geometry. No strength, fit, mass, or testing improvement is inferred from the shape changes.

## Files and reuse

- Website `.mp4` files include part names, export labels, and sequence markers; corresponding `.webp` files are posters.
- The reusable `*-clean.mp4` clips in `cad-evolution-broll.zip` contain the same geometry sequence without text overlays. They are 1280 × 800 at 24 fps, H.264, without audio.
- The b-roll archive includes this README, `sequences.json`, and the exact `render-config.json` used for the chosen states. No STEP files are bundled.
- Preserve the export-history context when using these clips as project b-roll. Other families, including unconfirmed Motor End/Motor Holder branches, were not assigned to this project.
