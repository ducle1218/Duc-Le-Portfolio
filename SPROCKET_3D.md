# Sprocket 3D preview

The viewer is loaded on demand from the CAD assembly panel. It provides camera controls only; the assembly is static. The Built robot tab remains available.

- Source: user-supplied `SprocketRobot.glb` (Onshape assembly export).
- Web asset: `src/assets/models/SprocketRobot.glb`.
- Renderer: Google model-viewer 4.1.0, self-hosted with its license.
- Draco decoder: bundled from Three.js, self-hosted under `src/vendor/model-viewer/draco/`.
- No source CAD, mate data, or 353 MB original is committed.

The export is optimized by merging same-material faces within each shared mesh, welding vertices, simplifying with a 0.001 error bound and 0.15 target ratio, and Draco compression. Instance transforms and material colors remain intact. Inspect the result visually before replacing the web asset.

Camera controls: drag to rotate; wheel/pinch to zoom; right-drag or two-finger drag to pan. Reset view returns to the initial framing. Mobile vertical swipes still scroll the page.
