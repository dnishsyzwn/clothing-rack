# Clothing Rack

A minimal, interactive 3D clothing-rack showcase. Muted studio colors, compact editorial typography, and clothing built from authored cloth-simulation assets.

The rack holds a graphite tee, sage long sleeve, oat tee, and folded brown trousers. Each starts facing forward, turns to show its back on hover, and can be dragged along the rail. Shoulder supports sit inside the collars; trousers fold over a hanger bar. Separate swivel hooks wrap around the rail and remain fixed while the bodies turn. Motion settles with a restrained sway.

## Repository

- GitHub: https://github.com/dnishsyzwn/clothing-rack
- Local branch: `main`
- Git remote: `origin`

## Run locally

Requires Node.js 22 (tested on 22.11.0) and npm.

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite, normally http://127.0.0.1:5173/.

```sh
npm test        # rail solver and garment/hanger asset checks
npm run build  # TypeScript checks and production build into dist/
npm run preview
```

## Controls

- Desktop: hover to turn a piece; drag horizontally to slide it.
- Touch: tap to toggle front/back; drag horizontally to slide. Select any of the four piece labels to bring it into view on a narrow screen.
- Buttons: select a piece, view front/back, move left/right, or reset the arrangement.
- Keyboard: Tab through the controls, or focus the rack and use Left/Right to move, Enter/Space to turn, and Escape to reset.
- About the study: opens a keyboard-accessible dialog. Escape closes it and returns focus.

## Stack and assets

React 19, TypeScript, Vite 6, Three.js, React Three Fiber 9, Drei, and plain CSS. The scene renders on demand while idle and caps pixel density. The app has no backend or runtime asset API calls.

Garments use Paul Spooner's cloth-simulated meshes and fitted hanger supports. Three source models provide four colorways; both tees share a mesh. Microsoft/Khronos CC0 fabric normal, roughness, and sheen maps provide material detail. Runtime movement uses damped transforms and a one-dimensional rail solver; the drape is baked into each mesh. The original procedural placeholder clothing has been removed.

See [ASSET_LICENSES.md](./ASSET_LICENSES.md) for each asset's provenance, public-domain release, attribution, and modifications. Credits are also available in the app's About panel. The reference images were used for visual direction and are not distributed with the project. Models and textures are self-hosted.

## Rebuild the garment assets

The prepared GLBs are committed under `public/models/`, so Blender is only needed when preparing new asset exports. With Blender 5.1 installed, run:

```powershell
& "C:/Program Files/Blender Foundation/Blender 5.1/blender.exe" --background --python scripts/prepare-garments.py
```

The script selects one fitted shoulder support, welds UV-seam vertex duplicates before smoothing, normalizes the swivel location, adds fabric thickness, and exports each garment. Original sources and license evidence are retained under `assets/`. Printed source materials and extra demonstration hangers are excluded from the runtime models.

The initial design proposal is retained in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md). Deployment configuration is in `.openai/hosting.json`; `origin` continues to point to the user's GitHub repository.
