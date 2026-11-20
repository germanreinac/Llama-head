# Llama-head – notes for Claude

Prototype of Germán's "sphere-head llama" game idea (exploration mode). The original idea notes live on his Notion page "Dictated Ideas".

## Stack
- Three.js + Vite, plain ES modules, no framework. `npm run dev` / `npm run build`.
- Deploys to GitHub Pages from `main` via `.github/workflows/deploy.yml`. `vite.config.js` uses `base: './'`.
- It must keep working on mobile (touch joystick + buttons) as well as desktop. Germán often tests on his phone.

## Conventions
- Shared mutable state is in `src/state.js`. Player/head state is in `src/player.js` (`head.state`: body | loose | host | stolen).
- Colour management is off and light intensities are ×π to keep the flat look of the first prototype (see `src/scene.js`).
- **Greybox only.** Germán asked (Nov 2026) for no design on the assets: neutral grey, plain primitives, no decorative detail, colour or texture. Add only shapes the gameplay needs to read (which way a head faces, what is a host). `GREYBOX` in `src/scene.js` strips hue from every material.
- **No faces.** Heads are plain spheres with two dots for eyes (no snout, nose or ears), and necks are thick. Germán asked for this in Nov 2026.
- **The llama is unique.** No other headless llamas or flock (Germán removed them, Nov 2026). The player's body and head are the only ones of their kind.
- Everything is a placeholder primitive. Germán is a concept artist and will replace the art, so keep models in builder functions (`src/models.js`, `src/world.js`) to make them easy to swap for GLTFs.
- Before pushing, run `npm run build` and check the game still starts without console errors.
