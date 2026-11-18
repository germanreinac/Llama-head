import * as THREE from 'three';
import { V3, hAt, d2, fwdOf, lerpAngle, clampR, isTouch } from './utils.js';
import { state } from './state.js';
import { scene } from './scene.js';
import { resolve } from './physics.js';
import { makeLlamaBody, makeHead, HEAD_R } from './models.js';
import { hosts, seatWorld, setCowStanding, wheels, cowLegs } from './world.js';
import { inputVec } from './input.js';
import { hintOnce } from './ui.js';

const LLAMA_COL = 0xf2e3c9;

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------
export const L = makeLlamaBody(LLAMA_COL);
scene.add(L.g);
export const llama = { pos: new V3(0, hAt(0, 0), 0), vel: new V3(), vy: 0, grounded: true, yaw: 0, walkT: 0, speed: 0 };

export const headMesh = makeHead(LLAMA_COL);
scene.add(headMesh);
/**
 * head.state:
 *   'body'   – on the neck
 *   'loose'  – rolling around on its own
 *   'host'   – sitting on a fence post / scarecrow / cow / tractor (head.host)
 *   'stolen' – being carried by the collector
 */
export const head = { pos: new V3(), vel: new V3(), state: 'body', host: null, yaw: 0, grounded: false };

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export function neckWorld() { L.g.updateMatrixWorld(true); return L.g.localToWorld(L.neckTop.clone()); }

export function nearHost() {
  let best = null, bd = 2.3;
  for (const h of hosts) {
    const s = seatWorld(h), d = d2(s, head.pos);
    if (d < bd && Math.abs(s.y - head.pos.y) < 3.2) { bd = d; best = h; }
  }
  return best;
}

export function canPickUp() {
  return (head.state === 'loose' || head.state === 'host')
    && d2(llama.pos, head.pos) < 2.4 && head.pos.y - llama.pos.y < 3.4;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
function throwHead() {
  head.state = 'loose'; head.pos.copy(neckWorld());
  const f = fwdOf(llama.yaw);
  head.vel.set(f.x * 6 + llama.vel.x, 5, f.z * 6 + llama.vel.z);
  head.yaw = llama.yaw;
  state.control = 'head';
  hintOnce('throw', isTouch ? 'Your head is off. <b>Be body</b> and <b>Be head</b> switch between the two.' : 'Your head is off. <b>Q</b> switches between head and body.', 6);
}

function pickUp() {
  if (head.state === 'host') leaveHost(false);
  head.state = 'body'; state.control = 'llama';
}

function sitOn(h) {
  head.state = 'host'; head.host = h; state.control = 'host'; h.speedNow = 0;
  if (h.kind === 'cow') setCowStanding(true);
  if (!h.drivable) state.camPitch = 0.3;
  if (h.kind === 'burrow') state.camYaw = h.obj.rotation.y + Math.PI; // face inwards
  if (h.hint !== null) { if (h.hint) hintOnce('host:' + h.hint, h.hint, 7); }
  else hintOnce('host' + (h.drivable ? 'd' : 's'),
    h.drivable ? `You are ${h.label} now. Drive it around.` : `You see through ${h.label}'s eyes now. Look around.`, 5);
}

/** pop=false: just detach (used when picking up or when the head is stolen). */
export function leaveHost(pop = true) {
  const h = head.host; if (!h) return;
  if (h.kind === 'cow') setCowStanding(false);
  head.host = null;
  if (pop) {
    head.state = 'loose'; head.pos.copy(seatWorld(h));
    const f = fwdOf(state.camYaw); head.vel.set(f.x * 2.5, 4, f.z * 2.5);
    state.control = 'head';
  }
}

export function actE() {
  if (head.state === 'body') throwHead();
  else if (state.control === 'body' && canPickUp()) pickUp();
}
export function actQ() {
  if (head.state === 'body' || head.state === 'stolen') return;
  state.control = state.control === 'body' ? (head.state === 'host' ? 'host' : 'head') : 'body';
}
export function actF() {
  if (state.control === 'head') { const h = nearHost(); if (h) sitOn(h); }
  else if (state.control === 'host') leaveHost(true);
}
export function actJump() {
  const c = state.control;
  if ((c === 'llama' || c === 'body') && llama.grounded) { llama.vy = 7; llama.grounded = false; }
  else if (c === 'head' && head.grounded) { head.vel.y = 6; head.grounded = false; }
}

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------
const qTmp = new THREE.Quaternion(), qUp = new THREE.Quaternion(), eTmp = new THREE.Euler();

function updateBody(dt) {
  const ctl = state.control === 'llama' || state.control === 'body';
  const d = ctl ? inputVec() : new V3();
  const maxSp = state.control === 'body' ? 4.3 : 5.2, k = 1 - Math.exp(-8 * dt);
  llama.vel.x += (d.x * maxSp - llama.vel.x) * k;
  llama.vel.z += (d.z * maxSp - llama.vel.z) * k;
  llama.pos.x += llama.vel.x * dt; llama.pos.z += llama.vel.z * dt;
  llama.vy -= 20 * dt; llama.pos.y += llama.vy * dt;
  resolve(llama.pos, 0.7, false); clampR(llama.pos);
  const gy = hAt(llama.pos.x, llama.pos.z);
  if (llama.pos.y <= gy) { llama.pos.y = gy; llama.vy = 0; llama.grounded = true; }

  const sp = llama.speed = Math.hypot(llama.vel.x, llama.vel.z);
  if (sp > 0.3) llama.yaw = lerpAngle(llama.yaw, Math.atan2(llama.vel.x, llama.vel.z), dt * 10);
  llama.walkT += sp * dt * 2.6;
  L.legs.forEach((l, i) => (l.rotation.x = Math.sin(llama.walkT + (i < 2 ? 0 : Math.PI)) * 0.55 * Math.min(1, sp / 4)));
  L.g.position.copy(llama.pos); L.g.rotation.y = llama.yaw;
  const headless = head.state !== 'body';
  L.g.rotation.z = headless ? Math.sin(state.t * 2.3) * 0.045 : 0; // headless sway
  L.stump.visible = headless;
}

function updateLooseHead(dt) {
  if (state.control === 'head') {
    const di = inputVec();
    head.vel.x += di.x * 16 * dt; head.vel.z += di.z * 16 * dt;
    if (di.lengthSq() > 0.01) head.yaw = lerpAngle(head.yaw, Math.atan2(di.x, di.z), dt * 6);
  }
  head.vel.y -= 20 * dt;
  head.pos.addScaledVector(head.vel, dt);
  const hg = hAt(head.pos.x, head.pos.z) + HEAD_R;
  if (head.pos.y <= hg) {
    head.pos.y = hg;
    head.vel.y = head.vel.y < -2.5 ? -head.vel.y * 0.35 : 0; // small bounce
    head.grounded = true;
    const f = Math.exp(-2.4 * dt); head.vel.x *= f; head.vel.z *= f;
  } else {
    head.grounded = false;
    const f = Math.exp(-0.3 * dt); head.vel.x *= f; head.vel.z *= f;
  }
  const hs = Math.hypot(head.vel.x, head.vel.z);
  if (hs > 7) { head.vel.x *= 7 / hs; head.vel.z *= 7 / hs; }
  resolve(head.pos, HEAD_R, true); clampR(head.pos);

  // Roll visually while fast, settle upright (eyes forward) when slow.
  if (hs > 1.4) {
    qTmp.setFromAxisAngle(new V3(head.vel.z, 0, -head.vel.x).normalize(), hs * dt / HEAD_R);
    headMesh.quaternion.premultiply(qTmp);
  } else {
    qUp.setFromEuler(eTmp.set(0, head.yaw, 0));
    headMesh.quaternion.slerp(qUp, Math.min(1, dt * 5));
  }
}

function updateHost(dt) {
  const h = head.host;
  if (state.control === 'host' && h.drivable) {
    const di = inputVec(), o = h.obj;
    if (di.lengthSq() > 0.01) {
      o.rotation.y = lerpAngle(o.rotation.y, Math.atan2(di.x, di.z), dt * 2.5);
      h.speedNow += (h.speed * di.length() - h.speedNow) * Math.min(1, dt * 3);
    } else h.speedNow += (0 - h.speedNow) * Math.min(1, dt * 3);
    o.position.addScaledVector(fwdOf(o.rotation.y), h.speedNow * dt);
    resolve(o.position, h.kind === 'tractor' ? 1.6 : 1.2, false, o); clampR(o.position);
    o.position.y = hAt(o.position.x, o.position.z);
    if (h.kind === 'tractor') wheels.forEach((w) => (w.rotation.x += h.speedNow * dt / w.userData.r));
    if (h.kind === 'cow') cowLegs.forEach((l, i) => (l.rotation.x = Math.sin(state.t * h.speedNow * 2 + (i % 2) * Math.PI) * 0.4 * Math.min(1, h.speedNow)));
  }
  head.pos.copy(seatWorld(h));
  if (h.drivable) head.yaw = h.obj.rotation.y;
  else if (state.control === 'host') head.yaw = state.camYaw; // the head looks where you look
  qUp.setFromEuler(eTmp.set(0, head.yaw, 0));
  headMesh.quaternion.slerp(qUp, Math.min(1, dt * 8));
}

/** Stolen head position is driven by the collector (see collector.js). */
export function updatePlayer(dt) {
  updateBody(dt);
  if (head.state === 'body') {
    head.pos.copy(neckWorld()); head.vel.set(0, 0, 0); head.yaw = llama.yaw;
    headMesh.quaternion.setFromEuler(eTmp.set(Math.sin(llama.walkT * 2) * 0.04 * Math.min(1, llama.speed / 4), llama.yaw, 0));
  } else if (head.state === 'loose') updateLooseHead(dt);
  else if (head.state === 'host') updateHost(dt);
}

export function syncHeadMesh() { headMesh.position.copy(head.pos); }
