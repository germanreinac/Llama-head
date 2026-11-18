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
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.17, 1.1, 8), m);
  neck.position.set(0, 1.85, 0.62); neck.rotation.x = 0.18; g.add(neck);
  const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 10), lam(0x4a2f2f));
  stump.position.set(0, 2.41, 0.72); stump.rotation.x = 0.18; g.add(stump);
  const tail = new THREE.Mesh(unitSph, m); tail.scale.setScalar(0.14); tail.position.set(0, 1.3, -0.8); g.add(tail);
  return { g, legs, stump, neckTop: new V3(0, 2.7, 0.76) };
}

export const HEAD_R = 0.33;

/** Placeholder sphere head. closed=true gives sleeping eyes (the lost heads). */
export function makeHead(col, closed = false) {
  const g = new THREE.Group(), m = lam(col);
  g.add(new THREE.Mesh(new THREE.SphereGeometry(HEAD_R, 18, 14), m));
  const sn = new THREE.Mesh(unitSph, lam(0xc9bba6)); sn.scale.set(0.16, 0.12, 0.17); sn.position.set(0, -0.11, 0.27); g.add(sn);
  const nose = new THREE.Mesh(unitSph, basic(0x2a2220)); nose.scale.set(0.05, 0.03, 0.03); nose.position.set(0, -0.07, 0.43); g.add(nose);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 6), m);
    ear.position.set(s * 0.15, 0.34, -0.03); ear.rotation.z = -s * 0.3; g.add(ear);
    if (closed) {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.016, 0.02), basic(0x1a1a1a)); e.position.set(s * 0.14, 0.07, 0.3); g.add(e);
    } else {
      const e = new THREE.Mesh(unitSph, basic(0xf4f1ea)); e.scale.setScalar(0.085); e.position.set(s * 0.14, 0.07, 0.25); g.add(e);
      const p = new THREE.Mesh(unitSph, basic(0x0a0a0a)); p.scale.setScalar(0.045); p.position.set(s * 0.15, 0.07, 0.32); g.add(p);
    }
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
