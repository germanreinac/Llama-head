import * as THREE from 'three';
import { V3 } from './utils.js';
import { lam, basic, unitSph } from './scene.js';

/** Placeholder llama body (no head). Origin at the feet, facing +Z. */
export function makeLlamaBody(col) {
  const g = new THREE.Group(), m = lam(col);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), m);
  body.scale.set(0.75, 0.72, 1.25); body.position.y = 1.15; g.add(body);
  const legs = [], lg = new THREE.CylinderGeometry(0.07, 0.06, 0.95, 6); lg.translate(0, -0.475, 0);
  for (const [x, z] of [[0.22, 0.45], [-0.22, -0.45], [-0.22, 0.45], [0.22, -0.45]]) {
    const l = new THREE.Mesh(lg, m); l.position.set(x, 1.0, z); g.add(l); legs.push(l);
  }
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.27, 1.1, 10), m);
  neck.position.set(0, 1.85, 0.62); neck.rotation.x = 0.18; g.add(neck);
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.03, 10), lam(0x4a2f2f));
  stump.position.set(0, 2.41, 0.72); stump.rotation.x = 0.18; g.add(stump);
  const tail = new THREE.Mesh(unitSph, m); tail.scale.setScalar(0.14); tail.position.set(0, 1.3, -0.8); g.add(tail);
  return { g, legs, stump, neckTop: new V3(0, 2.7, 0.76) };
}

export const HEAD_R = 0.33;

/**
 * Placeholder sphere head: a plain ball with two dots for eyes, nothing else.
 * closed=true is a sleeping lost head (dark dots); bright=true makes the dots glow (the one that is awake).
 */
export function makeHead(col, closed = false, bright = false) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 18, 14), lam(col)));
  const m = basic(bright ? 0xffffff : 0x0a0a0a, !bright);
  for (const s of [-1, 1]) {
    const e = new THREE.Mesh(unitSph, m); e.scale.setScalar(closed && !bright ? 0.032 : 0.042); e.position.set(s * 0.13, 0.06, 0.295); g.add(e);
  }
  return g;
}

/** Soft radial gradient texture for glows and fog wisps. */
export function radialTex(inner, mid, size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const x = c.getContext('2d'), h = size / 2;
  const gr = x.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0, inner);
  if (mid) gr.addColorStop(0.3, mid);
  gr.addColorStop(1, 'rgba(210,210,210,0)');
  x.fillStyle = gr; x.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
