import * as THREE from 'three';
import { isTouch } from './utils.js';

// Keep the flat, unmanaged colour look of the first prototype.
THREE.ColorManagement.enabled = false;

export const canvas = document.getElementById('c');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

export const FOG_COLOR = 0x2b2b2b;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(FOG_COLOR);
scene.fog = new THREE.Fog(FOG_COLOR, 3, 34);

export const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.05, 200);
export const pipCam = new THREE.PerspectiveCamera(72, 1.4, 0.05, 200);

// Light intensities are multiplied by PI to match the old (pre-r155) lighting units.
export const hemi = new THREE.HemisphereLight(0x9a9a9a, 0x1c1c1c, 0.75 * Math.PI);
scene.add(hemi);
/** The sun's (or moon's) light. sky.js dims it at night. */
export const skyLight = new THREE.DirectionalLight(0xc8c8c8, 0.55 * Math.PI);
skyLight.position.set(-30, 40, 20);
scene.add(skyLight);

/**
 * Greybox: every material is reduced to its brightness, so the prototype carries
 * no colour design. Final art replaces these. Set GREYBOX to false to see the hex
 * colours as written at the call sites.
 */
export const GREYBOX = true;
export function grey(c) {
  if (!GREYBOX) return c;
  const v = Math.round(0.3 * (c >> 16 & 255) + 0.59 * (c >> 8 & 255) + 0.11 * (c & 255));
  return v << 16 | v << 8 | v;
}
const matCache = {};
/** Shared Lambert material per colour. */
export const lam = (c) => matCache[c] || (matCache[c] = new THREE.MeshLambertMaterial({ color: grey(c) }));
/** Unlit material, e.g. for eyes. fog=false makes it glow through the fog. */
export const basic = (c, fog = true) => new THREE.MeshBasicMaterial({ color: grey(c), fog });
export const unitSph = new THREE.SphereGeometry(1, 10, 8);

addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
