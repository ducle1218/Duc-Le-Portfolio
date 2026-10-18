# Sprocket 3D preview

The viewer is loaded on demand from the CAD assembly panel. It provides camera controls only; the assembly is static. The Built robot tab remains available.

- Source: user-supplied `SprocketRobot.glb` (Onshape assembly export).
- Web asset: `src/assets/models/SprocketRobot.glb`.
- Renderer: bundled Three.js 0.172.0, self-hosted with its MIT license.
- Draco decoder: bundled from Three.js, self-hosted under `src/vendor/model-viewer/draco/`.
- No source CAD, mate data, or 353 MB original is committed.

The export is optimized by merging same-material faces within each shared mesh, welding vertices, simplifying with a 0.001 error bound and 0.15 target ratio, and Draco compression. Instance transforms and material colors remain intact. Inspect the result visually before replacing the web asset.

Camera controls: drag to rotate; wheel/pinch to zoom; right-drag or two-finger drag to pan. Reset view returns to the initial framing. Mobile vertical swipes still scroll the page.

Color presentation: convert the Onshape display RGB factors to linear RGB for glTF rendering. Remove only instance 521 (mesh 75), the 0.4572 m construction envelope; retain the other blue components. Geometry buffers are unchanged by this presentation correction.

## CAD-style rendering

`src/scripts/sprocket-cad.js` is the editable renderer source; `sprocket-cad.bundle.js` is its browser bundle. Build with Three.js 0.172.0 and esbuild 0.25.12 using the build script below. The viewer uses orthographic projection, Phong highlights, directional shadow mapping, screen-space ambient occlusion, and shared crease-edge geometry (28-degree threshold). It does not add invented surface textures or change the GLB geometry/colors.

Render only on camera/size/visibility changes. Reuse edge geometry for repeated hardware; dispose GPU resources when project markup is removed. The canvas supports arrow-key rotation and +/- zoom in addition to mouse/touch controls.

```sh
npm install --no-save --ignore-scripts three@0.172.0 esbuild@0.25.12
node scripts/build-sprocket-cad.mjs
```
