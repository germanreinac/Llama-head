import * as THREE from 'three';
import { state } from './state.js';
import { scene, cam, basic, unitSph, hemi, skyLight, FOG_COLOR } from './scene.js';
import { say } from './ui.js';

/**
 * The sun is a character. While it is awake (day) it watches over you: it marks the
 * collector with a shaft of light and drives it off (see collector.js). There is no
 * sunset: it just switches off, becomes the moon and sleeps (night), and you are on
 * your own until it wakes up.
 *
 * state.day    – true while the sun is awake
 * state.dayMix – 0 (night) .. 1 (day), eased; drives light and fog
 */
export const DAY_SECS = 75, NIGHT_SECS = 45;

const DIR = new THREE.Vector3(-0.55, 0.36, -0.75).normalize(); // where it hangs in the sky
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
const dayCol = new THREE.Color(0x4b4b4b), nightCol = new THREE.Color(0x141414), fogCol = new THREE.Color(FOG_COLOR);
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

  // Light and fog follow the sun.
  hemi.intensity = HEMI * (0.5 + 0.8 * m);
  skyLight.intensity = SKY * (0.45 + 0.9 * m);
  fogCol.copy(nightCol).lerp(dayCol, m);
  scene.fog.color.copy(fogCol); scene.background.copy(fogCol);

  // The disc: bright with open eyes by day, dim with eyes shut (the moon) by night.
  const v = 0.42 + 0.58 * m; discMat.color.setRGB(v, v, v);
  for (const e of eyes) e.scale.set(0.09, 0.012 + 0.078 * m, 0.09);
}

/** Keep the sun at a fixed place in the sky, facing the camera. Call every frame. */
export function placeSky() {
  g.position.copy(cam.position).addScaledVector(DIR, DIST);
  g.lookAt(cam.position);
}
