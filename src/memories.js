import * as THREE from 'three';
import { hAt, rnd } from './utils.js';
import { state } from './state.js';
import { scene } from './scene.js';
import { makeHead, radialTex, HEAD_R } from './models.js';
import { head, llama } from './player.js';
import { say, updateDots } from './ui.js';

/** Story fragments, shown in order as lost heads are found. */
export const MEM_TEXT = [
  'We used to count the fence posts to fall asleep. Then the fog started counting us.',
  'The farmer took his off first. He said the field looked better from far away.',
  'I left mine on a post to keep watch. When I came back, it was looking the other way.',
  "The cow isn't sleeping. She's just somewhere else.",
  "Don't leave it alone too long. The tall one collects what nobody is watching.",
  "We're all still here. We just stopped looking with our own eyes.",
];

// [-24,-22] is inside the gateless pen: only a rolling head can reach it.
// [30,8] is inside a burrow (world.js): only a head peeking in can reach it.
const SPOTS = [[5, 9], [-24, -22], [30, 8], [-34, 22], [8, -40], [38, -34]];

const glow = radialTex('rgba(235,235,235,1)', 'rgba(210,210,210,.45)');
export const memories = SPOTS.map(([x, z], i) => {
  const g = makeHead(0xb9b7bd, true), base = hAt(x, z) + HEAD_R;
  g.position.set(x, base, z); g.rotation.y = rnd(0, 6); scene.add(g);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glow, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, transparent: true, opacity: 0.4,
  }));
  sp.scale.set(2.2, 2.2, 1); sp.position.set(x, base + 0.15, z); scene.add(sp);
  return { g, sp, x, z, base, found: false, phase: i * 1.3 };
});

let onAllFound = () => {};
export function setOnAllFound(fn) { onAllFound = fn; }

export function updateMemories(dt) {
  const t = state.t;
  for (const m of memories) {
    if (m.found) { // fade away
      m.sp.material.opacity *= Math.exp(-2 * dt);
      m.g.scale.multiplyScalar(Math.exp(-1.5 * dt));
      continue;
    }
    m.g.position.y = m.base + Math.sin(t * 1.2 + m.phase) * 0.08;
    m.sp.position.y = m.g.position.y + 0.15;
    m.g.rotation.y += dt * 0.2;
    const near = (head.state !== 'stolen' && Math.hypot(head.pos.x - m.x, head.pos.z - m.z) < 1.3)
      || Math.hypot(llama.pos.x - m.x, llama.pos.z - m.z) < 1.4;
    if (!near) continue;
    m.found = true; state.found++; updateDots();
    say(`<small>Lost head ${state.found} / 6</small>“${MEM_TEXT[state.found - 1]}”`, 9);
    if (state.found === MEM_TEXT.length) setTimeout(onAllFound, 4000);
  }
}
