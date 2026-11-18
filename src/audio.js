/** Low, slowly swelling wind made from filtered brown noise. Call from a click. */
export function startWind() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const len = ac.sampleRate * 3, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    const g = ac.createGain(); g.gain.value = 0.35;
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 0.08; lg.gain.value = 0.15; lfo.connect(lg); lg.connect(g.gain); lfo.start();
    src.connect(lp); lp.connect(g); g.connect(ac.destination); src.start();
  } catch (e) { /* audio is optional */ }
}
