import * as THREE from 'three';
import { isTouch } from './utils.js';

// Keep the flat, unmanaged colour look of the first prototype.
THREE.ColorManagement.enabled = false;

export const canvas = document.getElementById('c');
export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

export const FOG_COLOR = 0x262d33;
export const scene = new THREE.Scene();
scene.background = new THREE.Color(FOG_COLOR);
scene.fog = new THREE.Fog(FOG_COLOR, 3, 34);

export const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.05, 200);
export const pipCam = new THREE.PerspectiveCamera(72, 1.4, 0.05, 200);

// Light intensities are multiplied by PI to match the old (pre-r155) lighting units.
scene.add(new THREE.HemisphereLight(0x8a9bb0, 0x1e1c16, 0.75 * Math.PI));
const moon = new THREE.DirectionalLight(0xb8c6e0, 0.55 * Math.PI);
moon.position.set(-30, 40, 20);
scene.add(moon);

const matCache = {};
/** Shared Lambert material per colour. */
export const lam = (c) => matCache[c] || (matCache[c] = new THREE.MeshLambertMaterial({ color: c }));
/** Unlit material, e.g. for eyes. fog=false makes it glow through the fog. */
export const basic = (c, fog = true) => new THREE.MeshBasicMaterial({ color: c, fog });
export const unitSph = new THREE.SphereGeometry(1, 10, 8);

addEventListener('resize', () => renderer.setSize(innerWidth, innerHeight));
