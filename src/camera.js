import { V3, hAt, fwdOf, d2 } from './utils.js';
import { state } from './state.js';
import { renderer, scene, cam, pipCam } from './scene.js';
import { head, headMesh, llama } from './player.js';
import { collector } from './collector.js';
import { placeSky } from './sky.js';

const pipEl = document.getElementById('pip');
const pipLabel = document.getElementById('pipLabel');
const vig = document.getElementById('vignette');

/** How far the headless body sees compared with the head (1 = the same). */
const BODY_SIGHT = 0.8;

const camLook = new V3(0, 1.5, 0);
let fogFar = 34;

/**
 * Main camera: third person behind whatever you control, or first person
 * from the head when it sits on something static (post, scarecrow).
 * Picture-in-picture: what the other half of you sees.
 */
function placeCams(dt) {
  const { control, camYaw, camPitch, t } = state;
  const k = 1 - Math.exp(-9 * dt);
  let T, dist, fp = false;
  if (control === 'llama' || control === 'body') { T = llama.pos.clone().add(new V3(0, 1.7, 0)); dist = 5.5; }
  else if (control === 'head') { T = head.pos.clone().add(new V3(0, 0.35, 0)); dist = 3.2; }
  else if (head.host.drivable) { T = head.pos.clone().add(new V3(0, 0.4, 0)); dist = head.host.dist; }
  else fp = true;

  if (fp) {
    const eye = head.pos.clone().add(new V3(0, 0.08, 0)), p = -(camPitch - 0.3);
    cam.position.lerp(eye, 1 - Math.exp(-14 * dt));
    camLook.copy(eye).add(new V3(Math.sin(camYaw) * Math.cos(p), Math.sin(p), Math.cos(camYaw) * Math.cos(p)));
    cam.lookAt(camLook);
  } else {
    const want = T.clone().addScaledVector(fwdOf(camYaw), -dist * Math.cos(camPitch));
    want.y += dist * Math.sin(camPitch);
    want.y = Math.max(want.y, hAt(want.x, want.z) + 0.3);
    cam.position.lerp(want, k); camLook.lerp(T, k); cam.lookAt(camLook);
    if (control === 'body') cam.position.y += Math.sin(t * 2.3) * 0.04; // stumbling
  }

  let pip = null;
  if (head.state !== 'body') {
    if (control === 'body') {
      pip = 'eye';
      pipCam.position.copy(head.pos).add(new V3(0, 0.08, 0));
      pipCam.lookAt(pipCam.position.clone().add(fwdOf(head.yaw)).add(new V3(0, -0.12, 0)));
    } else {
      pip = 'body';
      pipCam.position.copy(llama.pos).addScaledVector(fwdOf(llama.yaw), -4).add(new V3(0, 2.6, 0));
      pipCam.lookAt(llama.pos.clone().add(new V3(0, 1.2, 0)));
    }
  }
  return { fp, pip };
}

export function render(dt) {
  const { fp, pip } = placeCams(dt), w = innerWidth, h = innerHeight;
  placeSky();
  const blind = state.control === 'body'; // the headless body sees a little less (BODY_SIGHT)
  const fogBase = state.fogFarBase * (0.95 + 0.35 * state.dayMix); // nights are a little thicker
  fogFar += ((blind ? fogBase * BODY_SIGHT : fogBase) - fogFar) * Math.min(1, dt * 2);
  vig.style.opacity = blind ? 0.15 : (state.control === 'host' && !head.host.drivable ? 0.3 : 0);

  renderer.setScissorTest(false); renderer.setViewport(0, 0, w, h);
  scene.fog.near = 3; scene.fog.far = fogFar;
  cam.aspect = w / h; cam.updateProjectionMatrix();
  headMesh.visible = !fp;
  renderer.render(scene, cam);

  if (!pip) { pipEl.style.display = 'none'; headMesh.visible = true; return; }
  const pw = Math.round(Math.min(w * 0.36, 300)), ph = Math.round(pw * 0.68);
  pipEl.style.display = 'block'; pipEl.style.width = pw + 'px'; pipEl.style.height = ph + 'px';
  const x = w - pw - 12, y = h - ph - 12;
  renderer.setScissorTest(true); renderer.setScissor(x, y, pw, ph); renderer.setViewport(x, y, pw, ph);
  scene.fog.near = 3; scene.fog.far = fogBase; // the head sees clearly
  pipCam.aspect = pw / ph; pipCam.updateProjectionMatrix();
  headMesh.visible = pip !== 'eye';
  renderer.render(scene, pipCam);
  headMesh.visible = true;

  const danger = head.state === 'stolen' || (collector.state === 'hunt' && d2(collector.g.position, head.pos) < 11);
  pipEl.classList.toggle('warn', danger);
  pipLabel.textContent = head.state === 'stolen' ? 'Something has your head'
    : danger ? 'Something is near your head…'
    : pip === 'eye' ? 'What your head sees' : 'Your body';
}
