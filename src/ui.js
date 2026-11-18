import { isTouch } from './utils.js';
import { state } from './state.js';
import { head, nearHost, canPickUp } from './player.js';

export const $ = (id) => document.getElementById(id);
const storyEl = $('story'), promptEl = $('prompt'), whoEl = $('who'), dotsEl = $('dots');

$('ctrlList').innerHTML = isTouch
  ? '<b>Left stick</b><span>move</span><b>Drag</b><span>look around</span><b>Buttons</b><span>pop head · switch · sit on things · hop</span>'
  : '<b>WASD / arrows</b><span>move</span><b>Mouse drag</b><span>look around</span><b>E</b><span>pop your head off / put it back on</span><b>Q</b><span>switch between head and body</span><b>F</b><span>sit your head on something / hop off</span><b>Space</b><span>jump / hop</span>';

let storyTimer = 0;
/** Show a story / hint line in the lower middle of the screen. */
export function say(html, secs = 7, alarm = false) {
  storyEl.innerHTML = html;
  storyEl.classList.toggle('alarm', alarm);
  storyEl.style.opacity = 1;
  storyTimer = secs;
}
const hinted = {};
export function hintOnce(key, html, secs) { if (!hinted[key]) { hinted[key] = 1; say(html, secs); } }
export function updateDots() { dotsEl.textContent = '●'.repeat(state.found) + '○'.repeat(6 - state.found); }

let lastUI = '';
function setBtn(id, label) {
  const b = $(id);
  if (label) { b.textContent = label; b.style.display = ''; } else b.style.display = 'none';
}

/** Context buttons (touch), key prompt (desktop) and the "You are …" label. */
export function updateUI(dt) {
  if (storyTimer > 0) { storyTimer -= dt; if (storyTimer <= 0) storyEl.style.opacity = 0; }

  const c = state.control;
  let e = '', q = '', f = '', j = 'Hop', who = '', prompt = '';
  if (c === 'llama') {
    who = 'the llama'; e = 'Pop head'; j = 'Jump'; prompt = isTouch ? '' : 'E · pop your head off';
  } else if (c === 'body') {
    who = 'your headless body'; j = 'Jump';
    if (head.state === 'stolen') prompt = 'Chase it down';
    else {
      q = 'Be head';
      if (canPickUp()) { e = 'Head on'; prompt = isTouch ? '' : 'E · put your head back on'; }
      else prompt = isTouch ? '' : 'Q · switch to your head';
    }
  } else if (c === 'head') {
    who = 'your head'; q = 'Be body';
    const host = nearHost();
    if (host) { f = 'Sit on'; prompt = (isTouch ? 'Sit on ' : 'F · sit on ') + host.label; }
    else prompt = isTouch ? '' : 'Q · switch to your body';
  } else if (c === 'host') {
    who = head.host.label; q = 'Be body'; f = 'Hop off'; j = '';
    prompt = isTouch ? '' : (head.host.drivable ? 'WASD · drive   F · hop off' : 'Drag · look around   F · hop off');
  }

  const key = [e, q, f, j, who, prompt].join('|');
  if (key === lastUI) return;
  lastUI = key;
  setBtn('bE', e); setBtn('bQ', q); setBtn('bF', f); setBtn('bJ', j);
  whoEl.textContent = 'You are ' + who;
  promptEl.textContent = prompt;
  promptEl.style.opacity = prompt ? 1 : 0;
}
