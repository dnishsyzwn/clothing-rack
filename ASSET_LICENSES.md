# Visual asset provenance

The current clothing uses authored cloth-simulation meshes with fitted hanger supports. Three source models provide four colorways; the graphite and oat tees share a mesh. All runtime assets are self-hosted.

## Garments and hanger supports

Creator: **Paul Daniel Spooner**, also known as **dudecon / Peripheral Arbor**.

Each original model description explicitly identifies the actual license as public domain and links the creator's [public-domain dedication](https://ip.tryop.com/), which covers past and future work and permits unrestricted use, adaptation, and transformation. The structured Sketchfab field also lists [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The project preserves full author/source/license/modification credits in this file and in the app's About panel, satisfying that attribution route as well.

| Runtime asset                   | Original model                                                                                                                  | Direct source mirror                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `public/models/tee.glb`         | [Hangers and Tee-shirt](https://sketchfab.com/3d-models/hangers-and-tee-shirt-44e260855c7f4c1ca611af8d2370195a)                 | [Objaverse GLB](https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-157/44e260855c7f4c1ca611af8d2370195a.glb) |
| `public/models/long-sleeve.glb` | [Hangers and Long Sleeve Shirt](https://sketchfab.com/3d-models/hangers-and-long-sleeve-shirt-14cc81980a06473a820f811596418fae) | [Objaverse GLB](https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-118/14cc81980a06473a820f811596418fae.glb) |
| `public/models/trousers.glb`    | [Hangers and Pants](https://sketchfab.com/3d-models/hangers-and-pants-37b92fbde5ca45448c50fc2cb6a376d8)                         | [Objaverse GLB](https://huggingface.co/datasets/allenai/objaverse/resolve/main/glbs/000-084/37b92fbde5ca45448c50fc2cb6a376d8.glb) |

Retrieved 2026-10-31. Exact original model metadata, including descriptions and structured license fields, is retained in `assets/licenses/`. The creator policy is summarized in `assets/licenses/peripheral-arbor-public-domain.md`. Original downloaded GLBs are under `assets/source/`.

Modifications: selected one hanger support from each multi-hanger demonstration; centered that support inside the simulated fabric; welded duplicated seam vertices; smoothed the original cloth geometry; added fabric thickness; normalized model scale and swivel position; removed source print materials; applied plain studio colorways and fabric maps. Source hooks were replaced with custom swivel hooks oriented perpendicular to the rail. Preparation is reproducible with `scripts/prepare-garments.py`.

## Fabric material maps

Creator: **Microsoft**, donated to the **Khronos glTF sample collection**.

Source: [SheenCloth](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenCloth).
License: **CC0 1.0 Universal** for the image/model assets. The original [license file](https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/SheenCloth/LICENSE.md) is retained at `assets/licenses/microsoft-sheen-cloth-LICENSE.md`; its metadocumentation retains its own CC BY 4.0 terms and attribution.

Files, retrieved 2026-10-31:

- `public/textures/fabric/technicalFabricSmall_normal_256.png`
- `public/textures/fabric/technicalFabricSmall_orm_256.png`
- `public/textures/fabric/technicalFabricSmall_sheen_256.png`

Maps are used as tiled fabric material inputs. The original image files are unmodified. Studio colorways are applied in the renderer.

## Original project artwork

The custom hook geometry, arrow/turn icons, favicon artwork, and original visual contribution to the rendered scene/poster are dedicated under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/). Third-party asset provenance and attribution above remain applicable. `public/images/rack-poster.png` is a still captured from the project's rendered garment scene.

This dedication covers original artwork and generated visual outputs, not the entire application's source code or its software dependencies.

## Dependencies, fonts, and references

React, Three.js, React Three Fiber, Drei, and other dependencies retain the licenses distributed in their npm packages. System Arial/Helvetica and monospace fonts are requested locally; no font files are distributed.

The two user-supplied reference images guide composition and styling only. They are not included in the repository or application. No rights over those reference images are claimed.
