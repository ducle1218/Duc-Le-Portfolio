# Repeatable load checks

The opt-in `src/scripts/performance-probe.js` records browser timings in the
nonvisual `script#portfolio-performance` JSON node when the URL contains
`?performance=1`. It sends nothing to a server and is inactive without the flag.
Include it early in the document, ideally using a flag-gated async script loader.
The buffered observers capture paint and long-task entries emitted before the
probe starts. Hero decode readiness is an observation time, not a claim about
when an earlier decode finished.

1. Keep the same browser, viewport, foreground state, and connection for each run.
   Start at the top and do not click, scroll, or switch tabs before collecting.
2. Collect the JSON node after load. Record FCP, latest LCP, DOMContentLoaded,
   load, TTFB, initial request bytes, hero resource completion, and long tasks.
   LCP can change after load; take a second snapshot once the page is visually
   settled. Do not confuse `observedAtMs` with load time.
3. Run at least three warm-cache reloads. For a genuinely cold run, use the
   browser's cache-disable feature or a fresh profile; changing only the page
   query does **not** clear cached assets. Label warm and cold results separately.
4. Compare baseline and optimized pages under the same conditions. Localhost
   results isolate application work; verify the deployed site independently.
5. Check navigation, project opening, resume rendering, theme toggling, and the
   background after scrolling. Deferred work must still become available.

## Budget and interpretation

Target initial FCP and LCP below **500 ms** on the measured desktop connection.
Use a three-run median and report all three values, connection/cache conditions,
and TTFB. A fast localhost or warm-cache result is not a guarantee of a cold
Internet visit. If the server alone takes 500 ms, client changes cannot meet a
500 ms navigation-to-paint budget for that run.

Useful regression checks: no WebGL/model/PDF resources requested before their
section is needed, no avoidable pre-load main-thread task over 50 ms, compressed
hero artwork, and no project-detail payload in the initial document. The probe's
blocking-time field measures time above 50 ms for tasks starting before the load
event; it is deliberately not labeled Lighthouse Total Blocking Time.
