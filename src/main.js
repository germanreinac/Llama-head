import { isTouch } from './utils.js';
import { state } from './state.js';
import { wisps } from './world.js';
import { head, llama, updatePlayer, syncHeadMesh } from './player.js';
import './input.js';
import { say, updateUI, $ } from './ui.js';
import { updateCollector, collector } from './collector.js';
import { updateMemories, setOnAllFound } from './memories.js';
import { render } from './camera.js';
import { startWind } from './audio.js';
import { updateSky } from './sky.js';

// Dev-only handle for poking at the game from the console.
if (import.meta.env.DEV) window.dbg = { state, head, llama, collector };

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

// --- ending: the fog thins ---
setOnAllFound(() => {
  state.fogFarBase = 60;
  setTimeout(() => {
    $('endText').innerHTML = 'Six heads, six pieces. For a moment the fog thins and you can see the whole field, right to the edges.<br><br>There is nobody else in it. There never was.';
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
  updateSky(dt);
  updatePlayer(dt);
  updateCollector(dt);
  syncHeadMesh();
  updateMemories(dt);
  for (const w of wisps) { w.position.x += w.userData.v * dt; if (w.position.x > 105) w.position.x = -105; }
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
