# Llama-head – Headless in the Fog

A browser prototype of a foggy, creepy exploration game. You're a llama whose sphere head comes off.

**Play:** https://germanreinac.github.io/Llama-head/ (deployed automatically from `main`)

## The idea so far

- **Pop your head off.** You switch between controlling the head and the body. The headless body is nearly blind (dense fog). A picture-in-picture window shows what the other half of you sees.
- **Roll your head where your body can't go.** The fenced pen has no gate. Heads roll under the rails, bodies don't fit.
- **Sit your head on things.** Fence posts and the headless scarecrow give you their viewpoint. The sleeping cow and the old tractor become drivable.
- **Six lost heads** glow in the fog. Each one gives you a fragment of the story. When you find all six, the flock appears.
- **The collector.** A tall figure that takes heads nobody is watching. If it steals yours, chase it down with your blind body.

All models are placeholder primitives.

## Controls

| Desktop | Touch | Action |
|---|---|---|
| WASD / arrows | left stick | move |
| mouse drag | drag | look |
| E | Pop head / Head on | take the head off / put it back |
| Q | Be head / Be body | switch control |
| F | Sit on / Hop off | sit the head on a post, scarecrow, cow or tractor |
| Space | Hop / Jump | jump |

## Run locally

```bash
npm install
npm run dev      # opens on your network too, so you can test on your phone
npm run build    # production build in dist/
```

## Code map

| File | What's in it |
|---|---|
| `src/main.js` | Start screen, ending, game loop |
| `src/state.js` | Shared state (who you control, camera angles, progress) |
| `src/player.js` | Llama body + head, actions (pop, switch, sit, jump) |
| `src/world.js` | Terrain, barn, trees, fences/pen, scarecrow, cow, tractor, idle flock, fog wisps; hosts the head can sit on |
| `src/collector.js` | The head-stealing figure |
| `src/memories.js` | Lost heads and story lines |
| `src/camera.js` | Main camera, picture-in-picture view, fog per view |
| `src/input.js` | Keyboard, joystick, drag-to-look, touch buttons |
| `src/ui.js` | HUD, prompts, story text |
| `src/models.js` | Placeholder llama body/head builders |
| `src/physics.js` | Tiny XZ collision system |
| `src/scene.js` | Renderer, scene, lights, materials |

Built with [Three.js](https://threejs.org) and [Vite](https://vite.dev).
