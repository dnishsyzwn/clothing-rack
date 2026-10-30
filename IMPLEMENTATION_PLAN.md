# Clothing rack implementation plan

Original proposal, prepared 31 October 2026. Implementation now exists; see README.md for the final stack and run instructions. The delivered scene uses original procedural garment meshes and weave textures authored directly in TypeScript, rather than the proposed Blender/GLB asset pipeline. The final palette follows the second reference: graphite, lichen, oat, and earth.

## 1. Experience and visual direction

Build a single-screen clothing-rack showcase with four unbranded garments: a dark T-shirt, charcoal hoodie, washed blue jeans, and black jacket. Use the supplied reference for composition, garment scale, studio lighting, and soft floor shadows. Treat text in the reference as visual content, not project instructions.

The rack is the page's main content: a thin metal rail crossing the scene, visible hangers, a neutral gray studio background, and generous space around the garments. Keep the camera fixed and nearly frontal with subtle perspective. Add a small, dismissible interaction hint and accessible controls. The reference's promotional headlines, logos, date, and shopping CTA are outside this showcase's scope.

Each garment needs recognizable front and back construction, modeled volume, seams, and baked folds. Visual quality depends primarily on these assets and lighting; allocate asset work as its own milestone.

## 2. Recommended stack

| Technology | Role and reason |
| --- | --- |
| Vite | Local development and a static production build. |
| React + TypeScript | Scene components, interaction state, loading/fallback UI, and accessible HTML controls. |
| Three.js + `@react-three/fiber` | Actual 3D garment rotation, perspective, lighting, shadows, and pointer raycasting. |
| `@react-three/drei` | Selected helpers for GLB loading and environment lighting; import only what the scene uses. |
| Plain CSS | Full-screen layout, responsive controls, and loading states. |
| Blender | Author and inspect garments, bake folds/materials, set pivots, and export web-ready GLB files. |
| Vitest, when the interaction solver exists | Focused tests of rail bounds, neighbor constraints, and state transitions. |

Use R3F's pointer events and a small custom rail solver. Apply frame-rate-independent damped motion in the render loop for translation, turning, and sway. Keep transient frame values in refs rather than React state updates on every frame.

Use a compatible stable React/R3F pair and pin actual dependencies in the package lockfile during implementation. Current R3F documentation pairs React 19 with R3F 9. Verify current Node requirements before scaffolding Vite. No backend is required for the showcase; production output is static files.

## 3. Interaction contract

### Front/back inspection

- Every garment starts facing the camera, at rotation Y = 0.
- Hovering a garment turns its hanger body and garment approximately 180 degrees around a vertical pivot below the hook, over roughly 500-700 ms. The hook's contact point stays on the rail.
- Leaving returns it to the front. A new hover reverses the animation smoothly from its current angle.
- Use a stable invisible interaction proxy for each garment so the rotating silhouette does not repeatedly trigger enter/leave events. The proxy follows rail position but does not shrink when the garment turns edge-on.
- Resolve overlapping proxies to one active garment, using nearest-visible hit priority and event propagation control. Tune proxy sizes around each garment.
- Freeze the current inspection target during dragging. Re-evaluate hover after release so dragging does not cause accidental repeated flips.

### Sliding on the rack

- Pointer down captures the active pointer and records the grab offset. Start dragging after approximately 6 CSS pixels of movement, keeping taps distinct.
- Map pointer movement through a camera-facing drag plane into the rail's X coordinate. Keep the hanger's height and depth fixed.
- Clamp movement to the usable rail bounds. Preserve hanger order and enforce a minimum hook spacing. Dragging into a neighbor gently pushes that neighbor and any following items until rail capacity is exhausted.
- Implement neighbor movement with a deterministic one-dimensional constraint solver. Feed its target positions to damped animations. Allow controlled fabric overlap with small, fixed depth offsets; this is an approximation of hanging garments rather than cloth collision simulation.
- Add a restrained, velocity-driven sway of approximately 2-5 degrees. On release, settle at the new rail position and damp the sway to rest.
- Handle pointer release outside the canvas, pointer cancellation, lost capture, window blur, and resize during a drag. Only one pointer owns the rack interaction at a time.
- Keep the camera fixed while dragging. Use grab/grabbing cursors on desktop.

### Touch, keyboard, and reduced motion

- Tap selects a garment and toggles its front/back view. A drag slides it; release after a drag must not also toggle it.
- Support horizontal touch dragging while retaining vertical page gestures where appropriate (`touch-action: pan-y` on the interaction surface).
- Provide HTML controls to select a garment, show front/back, move left/right, and reset the rack. Keyboard arrows adjust the selected garment; Enter/Space toggles its side. Use visible focus styles and announce the selected garment/side.
- With reduced motion enabled, remove sway and use immediate or very short inspection transitions. Preserve manual front/back controls.

## 4. Clothing assets and licensing

Use original, generic garment meshes authored for this project, or individually verified CC0 garment models. Start with original meshes because consistent front/back views, pivots, and visual quality are important for this scene. Plan to provide project-authored garment assets under CC0 with an explicit asset dedication at implementation time; no repository-wide license is selected by this plan.

For external materials, select downloaded CC0 assets from ambientCG or Poly Haven. These libraries can supply fabric surfaces or studio environment lighting; they are not a promise that suitable finished clothing meshes exist there. Self-host the chosen files rather than calling a third-party asset API at runtime.

Maintain `ASSET_LICENSES.md` with each shipped asset's file path, original source URL, author, license URL, download date, and modifications. Keep the applicable license evidence with the project. Do not use retailer product photos, recognizable logos, or the garments cut out from the reference image. A free download alone is insufficient evidence of reuse rights.

Pipeline:

1. Create one hanging garment with genuine front/back detail and enough thickness to read correctly edge-on.
2. Apply scale/transforms, standardize orientation, and put the pivot at the hanger's swivel point. Keep the hook/contact geometry separate from the turning body.
3. Model/bake folds and seams in Blender; use a baked hanging pose for runtime rendering.
4. Export GLB with PBR materials. Check it in the actual browser scene before making the other three garments.
5. Create the remaining silhouettes, sharing fabric textures where possible. Keep editable source files under `assets/source/` and browser exports under `public/models/`.
6. Optimize mesh and texture sizes, then render an original still of the scene for loading and WebGL fallback.

No external garment files have been selected, downloaded, or license-verified yet. Asset provenance must be completed before those assets ship.

## 5. Proposed source organization

```text
src/
  App.tsx
  styles.css
  scene/
    RackScene.tsx          # camera, lighting, floor, scene composition
    Rail.tsx               # rail geometry and bounds
    Garment.tsx            # hook, rotating garment group, hover proxy
  interaction/
    useRackInteraction.ts  # pointer ownership and inspection/drag states
    railSolver.ts          # clamping and neighbor displacement
    motion.ts              # damping and velocity-driven sway
  ui/
    RackControls.tsx       # semantic keyboard/touch controls
    SceneFallback.tsx      # loading, missing asset, and WebGL states
  data/
    garments.ts            # asset paths, dimensions, initial positions
public/
  models/
  textures/
  images/
assets/source/
ASSET_LICENSES.md
```

Keep garment identity and static configuration separate from runtime position and animation values. Give controls and the canvas one shared interaction controller so keyboard and pointer actions obey the same constraints.

## 6. Implementation milestones

1. **Interaction prototype:** scaffold the stack; add a rail and one simple volume garment; prove stable hover turning, pointer capture, constrained sliding, and touch tap/drag separation. Deliverable: a runnable local proof of the core behavior.
2. **Asset proof:** produce one finished garment with matching front/back detail, its hanger, fabric material, and license record. Tune the studio lighting against the reference. Deliverable: one convincing garment that still looks correct during rotation.
3. **Complete rack:** add all four assets, the neighbor solver, drag sway, reset controls, and consistent layering. Deliverable: a complete interactive composition.
4. **Responsive and accessible pass:** fit the rack at desktop and phone widths, implement touch and keyboard controls, reduced motion, loading progress, and a static fallback. Deliverable: usable input alternatives and clear failure states.
5. **Performance and verification:** optimize exported assets; run production build/type checks, solver tests, and browser interaction checks. Record measured payload and frame timing. Deliverable: reviewable local production preview, then a deployment configuration when a hosting target is chosen.

## 7. Performance and verification criteria

Targets to measure, not promises: roughly 60 fps on a typical recent desktop and at least 30 fps on a representative midrange phone. Aim for an initial compressed transfer under 8 MB, including code and scene assets; prefer 1K fabric textures and shared materials, then tune from measurements.

Cap device pixel ratio, use modest shadow-map sizes, and avoid expensive postprocessing. Render on demand while idle, invalidating frames until the current drag, turn, or settling animation ends. Provide a loading poster immediately and handle WebGL initialization/context failures with an HTML fallback.

Acceptance checks:

- Initial view presents four garments facing forward, aligned with their hangers and the rail.
- Hover turns a garment to a visibly different back view without jitter, detachment, or unintended neighbor activation.
- Drag remains horizontal, respects rail ends and hook order, gently pushes neighbors, and settles without endless oscillation.
- Fast enter/leave, drag while turning, pointer exit, cancellation, and release outside the canvas leave a usable scene.
- Touch dragging does not accidentally toggle a side; taps can inspect the back.
- Keyboard and explicit controls can select, turn, move, and reset garments using the same constraints.
- Phone and desktop layouts keep the rack usable; reduced-motion preferences are honored.
- Missing models and unavailable WebGL produce a readable fallback rather than a blank page.
- Every distributed external asset has recorded CC0 provenance; the scene has no copied product branding.

Automate meaningful rail-solver and interaction-state invariants. Verify rendered rotation, lighting, hover stability, and touch behavior in browsers; supplement with real-device checks where available.

## 8. Official references

- [Vite guide](https://vite.dev/guide/): static build tooling and runtime requirements.
- [React Three Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction): React/Three.js integration and version pairing.
- [React Three Fiber pointer events](https://r3f.docs.pmnd.rs/api/events): raycasting, event propagation, and pointer capture behavior.
- [ambientCG license](https://docs.ambientcg.com/license/): downloadable assets are CC0 and support commercial reuse and redistribution.
- [Poly Haven license](https://polyhaven.com/license): asset reuse and redistribution under CC0; website content has separate terms.
