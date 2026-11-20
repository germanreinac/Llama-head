import * as THREE from 'three';

export const V3 = THREE.Vector3;
export const isTouch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window);

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rnd = (a, b) => a + Math.random() * (b - a);

/** Shortest-path angle interpolation. */
export function lerpAngle(a, b, t) {
  const d = ((b - a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  return a + d * Math.min(1, t);
}

/** Forward vector on the ground plane for a yaw angle (yaw 0 = +Z). */
export const fwdOf = (yaw) => new V3(Math.sin(yaw), 0, Math.cos(yaw));

/** Distance on the XZ plane. */
export const d2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

/** Terrain height. Used by the ground mesh and by everything that stands on it. */
export function hAt(x, z) {
  return 0.35 * Math.sin(x * 0.15) * Math.cos(z * 0.13)
    + 0.2 * Math.sin(x * 0.37 + z * 0.21)
    + 0.1 * Math.cos(z * 0.5 - x * 0.1);
}

export const WORLD_R = 100;
/** The open farm is inside this radius; the forest fills the ring from here to WORLD_R. */
export const FARM_R = 58;
export function clampR(p) {
  const r = Math.hypot(p.x, p.z);
  if (r > WORLD_R) { p.x *= WORLD_R / r; p.z *= WORLD_R / r; }
}
