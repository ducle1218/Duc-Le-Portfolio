# Startup optimization — 2026-10-27

The original home page requested a 19,879,370-byte MP4 before its workbench
section was visible. It also shipped every project write-up inside an
871,476-byte HTML document and initialized the 3D renderer during startup.

Changes:

- Video source attaches only when the workbench is visible or Play is selected.
- Project HTML is fetched on selection, cached on revisit, and guarded against
  stale navigation. Failed requests can be retried.
- The initial document is 21,210 bytes; project details remain complete.
- Responsive WebP images replace large listing/hero PNGs; original detail
  images remain available. The first three card defaults total 75,334 bytes.
- Two local variable fonts replace four remotely requested font families.
- One compiled CSS file and one classic JS file replace multiple blocking
  requests. The latter preserves global functions used by existing controls.
- WebGL is imported only when its scene is visible. Flow generation yields
  between batches and reuses cached geometry.

## Observations, not a cross-device guarantee

Measurements were taken in the desktop app's 1280×720 in-app browser against
the same local server. Local assets were served with Cache-Control: no-store;
the original external Google Fonts stylesheet could use its existing cache.
The first baseline request also had a substantially larger TTFB. These are
individual diagnostic runs, not a controlled Lighthouse score or median.

| Metric | Original baseline | Optimized combined assets |
| --- | ---: | ---: |
| Startup transfer, observed | 23,556,122 B | 420,469 B |
| Requests before load, observed | 32 | 9 |
| DOM content loaded | 1,820.8 ms | 968.1 ms |
| Load event | 2,806.5 ms | 985.9 ms |
| First contentful paint | 3,472 ms | 1,956 ms |
| Largest contentful paint | 3,564 ms | 1,956 ms |
| Blocking time before load | 485 ms | 74 ms |

An earlier optimized run reached the load event at 476.3 ms, but its first
paint was reported at 2,880 ms. Paint timing was inconsistent in this preview
environment. A foreground Chrome check was attempted and blocked by the
computer-use tool because it could not identify the browser URL reliably.
Therefore a sub-500 ms visual load is **not verified** and must not be claimed.
Use the repeatable procedure in PERFORMANCE.md to verify a fresh live visit
in a foreground browser. Subsequent logo and WebGL visibility refinements
were checked in code after browser verification became unavailable.
