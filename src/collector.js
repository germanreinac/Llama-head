import * as THREE from 'three';
import { V3, hAt, d2, rnd, lerpAngle, clampR } from './utils.js';
import { state } from './state.js';
import { scene, lam, basic, unitSph } from './scene.js';
import { head, headMesh, llama, leaveHost } from './player.js';
import { say, hintOnce } from './ui.js';

/**
 * The collector: a tall figure in the fog that takes heads nobody is watching.
 * By day the sun points its eye beams at it (sky.js) and drives it off. At night:
 * wander -> hunt (your head is off its neck)
 *        -> carry (it has your head, runs from your body)
 *        -> flee  (your body caught up and it dropped the head)
 */
const g = new THREE.Group();
{
  const blk = lam(0x0a0a0d);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 3.0, 8), blk); body.position.y = 1.5; g.add(body);
  const hd = new THREE.Mesh(unitSph, blk); hd.scale.set(0.2, 0.27, 0.2); hd.position.y = 3.2; g.add(hd);
  for (const s of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 2.2, 5), blk); arm.position.set(s * 0.34, 1.95, 0.05); arm.rotation.z = s * 0.07; g.add(arm);
    const eye = new THREE.Mesh(unitSph, basic(0xf2efe6, false)); eye.scale.setScalar(0.028); eye.position.set(s * 0.07, 3.24, 0.18); g.add(eye);
  }
  g.position.set(40, hAt(40, 30), 30);
  scene.add(g);
}
const SUN_REACH = 9; // by day it may not come closer than this to you or your head

export const collector = { g, state: 'wander', target: new V3(30, 0, 20), timer: 0, yaw: 0, glare: 0, hand: new V3(0.4, 0.95, 0.2) };
const C = collector;

const qUp = new THREE.Quaternion(), eTmp = new THREE.Euler();

export function updateCollector(dt) {
  const t = state.t;
  const headFree = head.state === 'loose' || head.state === 'host';
  // By day the sun protects you. At night any head that is off its neck can be taken,
  // even while you are rolling it.
  const unwatched = headFree && !state.day;
  const dHead = d2(g.position, head.pos), dBody = d2(g.position, llama.pos);
  let dir = null, sp = 0;

  if (state.day && C.state !== 'flee') {
    const tooClose = Math.min(dBody, headFree ? dHead : 99) < SUN_REACH;
    if (C.state === 'carry') { // the sun makes it drop your head
      head.state = 'loose';
      head.pos.set(g.position.x, g.position.y + 1.2, g.position.z);
      head.vel.set(rnd(-2, 2), 4.5, rnd(-2, 2));
      state.control = 'head';
      say('The sun woke up and it dropped your head.', 5);
    }
    if (C.state === 'carry' || C.state === 'hunt' || tooClose) {
      if (tooClose && C.state === 'wander') hintOnce('sun', 'The sun saw it before you did.<br>While the sun is awake, the tall one cannot come near.', 7);
      C.state = 'flee'; C.timer = 0; C.glare = 1;
    }
  }
  C.glare = Math.max(0, C.glare - dt * 0.5);

  if (C.state === 'wander') {
    C.timer += dt;
    if (d2(g.position, C.target) < 1.5 || C.timer > 12) {
      const a = Math.random() * Math.PI * 2, r = rnd(15, 85);
      C.target.set(Math.cos(a) * r, 0, Math.sin(a) * r); C.timer = 0;
    }
    dir = C.target.clone().sub(g.position); sp = 1.5;
    if (dBody < 6 && head.state === 'body') { dir = g.position.clone().sub(llama.pos); sp = 2.5; } // shy around a whole llama
    if (unwatched && dHead < 30) C.state = 'hunt';
  } else if (C.state === 'hunt') {
    if (!unwatched) { C.state = 'wander'; C.timer = 99; }
    else {
      dir = head.pos.clone().sub(g.position); sp = 3.0;
      if (dHead < 1.0) {
        if (head.state === 'host') leaveHost(false);
        head.state = 'stolen'; state.control = 'body'; C.state = 'carry';
        say('Something took your head.<br>Follow it. Watch what it sees.', 6, true);
      }
    }
  } else if (C.state === 'carry') {
    dir = g.position.clone().sub(llama.pos); dir.x += Math.sin(t * 0.7) * 0.6; sp = 3.5;
    if (dBody < 1.9) {
      head.state = 'loose';
      head.pos.set(g.position.x, g.position.y + 1.2, g.position.z);
      head.vel.set(rnd(-2, 2), 4.5, rnd(-2, 2));
      C.state = 'flee'; C.timer = 0;
      say("You got it back.<br>Don't leave it alone.", 5);
    }
  } else if (C.state === 'flee') {
    C.timer += dt; dir = g.position.clone().sub(llama.pos); sp = 7;
    if (C.timer > 5) { C.state = 'wander'; C.timer = 99; }
  }

  if (dir) {
    dir.y = 0; const m = dir.length();
    if (m > 0.01) {
      dir.multiplyScalar(1 / m); g.position.addScaledVector(dir, sp * dt);
      C.yaw = lerpAngle(C.yaw, Math.atan2(dir.x, dir.z), dt * 4);
    }
  }
  clampR(g.position);
  g.position.y = hAt(g.position.x, g.position.z) + Math.abs(Math.sin(t * sp * 1.3)) * 0.06;
  g.rotation.y = C.yaw; g.rotation.z = Math.sin(t * 1.7) * 0.04;

  // Carry the stolen head in its hand, looking back at you.
  if (head.state === 'stolen') {
    g.updateMatrixWorld(true);
    head.pos.copy(g.localToWorld(C.hand.clone()));
    head.yaw = C.yaw + Math.PI;
    qUp.setFromEuler(eTmp.set(Math.sin(t * 5) * 0.15, head.yaw, Math.sin(t * 3.3) * 0.2));
    headMesh.quaternion.slerp(qUp, Math.min(1, dt * 6));
  }
}
