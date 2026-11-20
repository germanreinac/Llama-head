import * as THREE from 'three';
import { state } from './state.js';
import { scene, cam, basic, unitSph, hemi, skyLight, FOG_COLOR } from './scene.js';
import { say } from './ui.js';
import { collector } from './collector.js';

/**
 * The sun is a character. While it is awake (day) it watches over you: it crosses the
 * sky, points a beam from each eye at the collector and drives it off (see collector.js). There is no
 * sunset: it just switches off, becomes the moon and sleeps (night), and you are on
 * your own until it wakes up.
 *
 * state.day    – true while the sun is awake
 * state.dayMix – 0 (night) .. 1 (day), eased; drives light and fog
 */
export const DAY_SECS = 75, NIGHT_SECS = 45;

const DIR = new THREE.Vector3(); // where it hangs in the sky right now
const DIST = 150, SIZE = 11;

const g = new THREE.Group();
const discMat = basic(0xffffff, false);
g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), discMat));
const eyes = [-1, 1].map((s) => {
  const e = new THREE.Mesh(unitSph, basic(0x0a0a0a, false));
  e.position.set(s * 0.3, 0.12, 0.93); e.scale.setScalar(0.09); g.add(e);
  return e;
});
g.scale.setScalar(SIZE);
scene.add(g);

const hudEl = document.getElementById('sky');
// One beam per eye, from the collector up to the sun. Unit length along +Y, stretched each frame.
const beamG = new THREE.CylinderGeometry(0.7, 0.22, 1, 8, 1, true); beamG.translate(0, 0.5, 0);
const beamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
const beams = eyes.map(() => { const b = new THREE.Mesh(beamG, beamMat); b.frustumCulled = false; scene.add(b); return b; });
const UP = new THREE.Vector3(0, 1, 0), vA = new THREE.Vector3(), vB = new THREE.Vector3();

const dayCol = new THREE.Color(0x4b4b4b), nightCol = new THREE.Color(0x343434), fogCol = new THREE.Color(FOG_COLOR);
const HEMI = hemi.intensity, SKY = skyLight.intensity;

function setHud() {
  hudEl.textContent = state.day ? 'The sun is awake' : 'The sun is asleep';
  hudEl.classList.toggle('asleep', !state.day);
}
setHud();

export function updateSky(dt) {
  state.dayT += dt;
  if (state.dayT > (state.day ? DAY_SECS : NIGHT_SECS)) {
    state.day = !state.day; state.dayT = 0; setHud();
    say(state.day ? 'The sun is awake again.<br>It is watching for you.' : 'The sun switched off and went to sleep.<br>Nothing is watching over you now.', 6, !state.day);
  }
  state.dayMix += ((state.day ? 1 : 0) - state.dayMix) * Math.min(1, dt * 1.6);
  const m = state.dayMix;

  // It crosses the sky: once round the horizon per day+night, low at dawn, high at noon,
  // low again when it switches off. Asleep, it stays low.
  const p = state.dayT / (state.day ? DAY_SECS : NIGHT_SECS);
  const az = ((state.day ? p * DAY_SECS : DAY_SECS + p * NIGHT_SECS) / (DAY_SECS + NIGHT_SECS)) * Math.PI * 2 + 3.8;
  const el = state.day ? 0.26 + 0.62 * Math.sin(Math.PI * p) : 0.26;
  DIR.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));

  // Light and fog follow the sun. Night is dimmer, not dark.
  hemi.intensity = HEMI * (1.0 + 0.3 * m);
  skyLight.intensity = SKY * (0.85 + 0.5 * m);
  skyLight.position.copy(DIR).multiplyScalar(60);
  fogCol.copy(nightCol).lerp(dayCol, m);
  scene.fog.color.copy(fogCol); scene.background.copy(fogCol);

  // The disc: bright with open eyes by day, dim with eyes shut (the moon) by night.
  const v = 0.42 + 0.58 * m; discMat.color.setRGB(v, v, v);
  for (const e of eyes) e.scale.set(0.09, 0.012 + 0.078 * m, 0.09);
  beamMat.opacity = m * (0.2 + 0.5 * collector.glare);
}

/** Keep the sun in its place in the sky, facing the camera, and aim its eye beams. Call every frame. */
export function placeSky() {
  g.position.copy(cam.position).addScaledVector(DIR, DIST);
  g.lookAt(cam.position);
  g.updateMatrixWorld(true);
  const on = beamMat.opacity > 0.01;
  beams.forEach((b, i) => {
    b.visible = on; if (!on) return;
    vA.copy(collector.g.position); vA.y += 2.2;          // the collector's chest
    eyes[i].getWorldPosition(vB).sub(vA);                // towards this eye
    const len = vB.length();
    b.position.copy(vA); b.quaternion.setFromUnitVectors(UP, vB.multiplyScalar(1 / len)); b.scale.set(1, len, 1);
  });
}
