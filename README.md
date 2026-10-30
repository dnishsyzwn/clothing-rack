# Clothing Rack

A minimal, interactive 3D clothing-rack showcase. Muted studio colors, compact editorial typography, and four original garment forms.

The experience centers on a quilted jacket, field shirt, knit, and straight trouser. Each starts facing forward, turns to show its back on hover, and can be dragged along the rail. Hangers push their neighbors while their hooks stay attached to the rail. Motion settles with a restrained sway.

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
npm test        # rail solver invariant tests
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

Garments are stylized original 3D assets generated in code, with modeled volume, surface folds, front/back details, procedural weave textures, and separate hanger hooks. Cloth motion uses damped transforms and a one-dimensional rail solver. Full fabric collision simulation and photorealistic scanned garments are outside the implementation.

See [ASSET_LICENSES.md](./ASSET_LICENSES.md) for the CC0 dedication covering original visual assets. The reference images were used for visual direction and are not distributed with the project. No product photography or remote fonts are bundled.

The initial design proposal is retained in [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md). Deployment configuration is in `.openai/hosting.json`; `origin` continues to point to the user's GitHub repository.
