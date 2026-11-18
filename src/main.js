import { hAt, d2, fwdOf, lerpAngle, isTouch, V3 } from './utils.js';
import { state } from './state.js';
import { scene } from './scene.js';
import { idleFlock, wisps } from './world.js';
import { makeLlamaBody } from './models.js';
import { head, llama, updatePlayer, syncHeadMesh } from './player.js';
import './input.js';
import { say, updateUI, $ } from './ui.js';
import { updateCollector } from './collector.js';
import { updateMemories, setOnAllFound } from './memories.js';
import { render } from './camera.js';
import { startWind } from './audio.js';

// Dev-only handle for poking at the game from the console.
if (import.meta.env.DEV) window.dbg = { state, head, llama };

// --- start ---
$('startBtn').addEventListener('click', () => {
  $('intro').style.display = 'none';
  state.started = true;
  startWind();
  setTimeout(() => {
    if (head.state !== 'body') return;
    say(isTouch
      ? 'Something about this farm feels unfinished.<br>Tap <b>Pop head</b> to take your head off.'
      : 'Something about this farm feels unfinished.<br>Press <b>E</b> to take your head off.', 7);
  }, 800);
});

// --- ending: the flock appears ---
setOnAllFound(() => {
  const c = state.control === 'head' || state.control === 'host' ? head.pos : llama.pos;
  const f = fwdOf(state.camYaw), r = new V3(-f.z, 0, f.x);
  for (let i = -3; i <= 3; i++) {
    const b = makeLlamaBody(0xcfc6b5), p = c.clone().addScaledVector(f, 13).addScaledVector(r, i * 1.7);
    b.g.position.set(p.x, hAt(p.x, p.z), p.z); b.g.rotation.y = state.camYaw + Math.PI; scene.add(b.g);
  }
  state.fogFarBase = 60;
  setTimeout(() => {
    $('endText').innerHTML = 'Six heads, six pieces. For a moment the fog thins and you see them: the whole flock, standing in a perfect line, every body facing you.<br><br>Not one head among them.';
    $('ending').style.display = 'flex';
    state.paused = true;
  }, 3500);
});
$('endBtn').addEventListener('click', () => {
  $('ending').style.display = 'none';
  state.paused = false;
  state.fogFarBase = 34;
});

// --- loop ---
function update(dt) {
  updatePlayer(dt);
  updateCollector(dt);
  syncHeadMesh();
  updateMemories(dt);
  for (const b of idleFlock) { // idle flock turns to watch you
    if (d2(b.g.position, llama.pos) < 15) {
      b.g.rotation.y = lerpAngle(b.g.rotation.y, Math.atan2(llama.pos.x - b.g.position.x, llama.pos.z - b.g.position.z), dt * 0.8);
    }
  }
  for (const w of wisps) { w.position.x += w.userData.v * dt; if (w.position.x > 55) w.position.x = -55; }
  updateUI(dt);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  state.t += dt;
  if (state.started && !state.paused) update(dt);
  else syncHeadMesh();
  render(dt);
  requestAnimationFrame(loop);
}
// Place the head on the neck before the first frame.
updatePlayer(0);
syncHeadMesh();
requestAnimationFrame(loop);
