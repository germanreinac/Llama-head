import { V3, clamp, fwdOf, isTouch } from './utils.js';
import { state } from './state.js';
import { canvas } from './scene.js';
import { actE, actQ, actF, actJump } from './player.js';

const $ = (id) => document.getElementById(id);

if (isTouch) document.body.classList.add('touch');

const live = () => state.started && !state.paused;

// --- keyboard ---
const keys = {};
addEventListener('keydown', (e) => {
  if (e.repeat) return;
  keys[e.code] = true;
  if (!live()) return;
  if (e.code === 'KeyE') actE();
  if (e.code === 'KeyQ' || e.code === 'Tab') { e.preventDefault(); actQ(); }
  if (e.code === 'KeyF') actF();
  if (e.code === 'Space') { e.preventDefault(); actJump(); }
});
addEventListener('keyup', (e) => (keys[e.code] = false));
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// --- virtual joystick ---
const joy = { x: 0, y: 0, id: null }, joyEl = $('joy'), knob = $('knob');
function joyMove(e) {
  const r = joyEl.getBoundingClientRect(), RR = 50;
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const m = Math.hypot(dx, dy);
  if (m > RR) { dx *= RR / m; dy *= RR / m; }
  joy.x = dx / RR; joy.y = dy / RR;
  knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
}
joyEl.addEventListener('pointerdown', (e) => { joy.id = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e); });
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joy.id) joyMove(e); });
const joyEnd = (e) => {
  if (e.pointerId !== joy.id) return;
  joy.id = null; joy.x = joy.y = 0; knob.style.transform = 'translate(-50%,-50%)';
};
joyEl.addEventListener('pointerup', joyEnd);
joyEl.addEventListener('pointercancel', joyEnd);

// --- drag to look (mouse or touch on the canvas) ---
const look = { id: null, x: 0, y: 0 };
canvas.addEventListener('pointerdown', (e) => {
  if (look.id !== null) return;
  look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== look.id) return;
  const dx = e.clientX - look.x, dy = e.clientY - look.y, k = isTouch ? 0.007 : 0.005;
  look.x = e.clientX; look.y = e.clientY;
  state.camYaw -= dx * k;
  state.camPitch = clamp(state.camPitch + dy * k, 0.02, 1.25);
});
const lookEnd = (e) => { if (e.pointerId === look.id) look.id = null; };
canvas.addEventListener('pointerup', lookEnd);
canvas.addEventListener('pointercancel', lookEnd);

// --- touch buttons ---
for (const [id, fn] of [['bE', actE], ['bQ', actQ], ['bF', actF], ['bJ', actJump]]) {
  $(id).addEventListener('pointerdown', (e) => { e.preventDefault(); if (live()) fn(); });
}

/** Movement intent in world space, relative to the camera. Length 0..1. */
export function inputVec() {
  let f = 0, s = 0;
  if (keys.KeyW || keys.ArrowUp) f += 1;
  if (keys.KeyS || keys.ArrowDown) f -= 1;
  if (keys.KeyD || keys.ArrowRight) s += 1;
  if (keys.KeyA || keys.ArrowLeft) s -= 1;
  f += -joy.y; s += joy.x;
  const m = Math.hypot(f, s);
  if (m > 1) { f /= m; s /= m; }
  const y = state.camYaw;
  return fwdOf(y).multiplyScalar(f).addScaledVector(new V3(-Math.cos(y), 0, Math.sin(y)), s);
}
