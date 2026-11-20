import * as THREE from 'three';
import { V3, rnd, hAt, d2, isTouch } from './utils.js';
import { scene, lam, grey } from './scene.js';
import { addCircle, addBox } from './physics.js';
import { makeHead, radialTex } from './models.js';

// ---------------------------------------------------------------------------
// Hosts: things the head can sit on. Static ones give a new viewpoint,
// drivable ones (cow, tractor) can be steered.
// ---------------------------------------------------------------------------
export const hosts = [];
export function addHost(obj, seat, opts) {
  // verb/btn: prompt wording. who: HUD label. hint: line shown the first time (null = default).
  const h = Object.assign({ obj, seat, drivable: false, speed: 0, speedNow: 0, label: 'it', verb: 'sit on', btn: 'Sit on', who: null, hint: null }, opts);
  hosts.push(h);
  return h;
}
export function seatWorld(h) {
  h.obj.updateMatrixWorld(true);
  return h.obj.localToWorld(h.seat.clone());
}

// Spots that random props must keep clear of: [x, z, radius]
const avoid = [[0, 0, 6], [20, -22, 9], [-24, -22, 11], [-12, 14, 3], [16, 12, 4], [-6, -22, 4], [30, 8, 4.5], [-20, 30, 4.5]];
function freeSpot(minR, maxR) {
  for (let k = 0; k < 60; k++) {
    const a = Math.random() * Math.PI * 2, r = rnd(minR, maxR), x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (avoid.every(([ax, az, ar]) => Math.hypot(x - ax, z - az) > ar)) return [x, z];
  }
  return [maxR, 0];
}

// --- ground ---
{
  const g = new THREE.PlaneGeometry(220, 220, 150, 150); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position, cols = [], c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i); p.setY(i, hAt(x, z));
    const n = 0.5 + 0.5 * Math.sin(x * 0.8 + z * 0.3) * Math.cos(z * 0.7 - x * 0.2);
    c.setRGB(0.17 + 0.05 * n, 0.17 + 0.05 * n, 0.17 + 0.05 * n); cols.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })));
}

// --- barn ---
{
  const b = new THREE.Group(); b.position.set(20, hAt(20, -22), -22);
  const walls = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 12), lam(0x55251f)); walls.position.y = 3; b.add(walls);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 5.8, 12.6, 3), lam(0x2a2a2e)); roof.rotation.x = -Math.PI / 2; roof.position.y = 8.9; b.add(roof);
  const door = new THREE.Mesh(new THREE.BoxGeometry(3.4, 4.2, 0.1), lam(0x1a0e0c)); door.position.set(0, 2.1, 6.02); b.add(door);
  b.rotation.y = 0.3; scene.add(b);
  addCircle(20, -22, 6.6);
}

// --- dead trees ---
for (let i = 0; i < 34; i++) {
  const [x, z] = freeSpot(9, 55); const t = new THREE.Group(); t.position.set(x, hAt(x, z), z);
  const h = rnd(4, 7), trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.32, h, 6), lam(0x2c2622)); trunk.position.y = h / 2; t.add(trunk);
  for (let j = 0; j < 4; j++) {
    const bl = rnd(1, 2.4), br = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.1, bl, 5), lam(0x2c2622));
    br.position.y = h * rnd(0.5, 0.95); br.rotation.set(rnd(-1.1, 1.1), rnd(0, 6), rnd(0.6, 1.2)); br.translateY(bl / 2); t.add(br);
  }
  t.rotation.y = rnd(0, 6); scene.add(t); addCircle(x, z, 0.45); avoid.push([x, z, 1.5]);
}

// --- grass ---
{
  const tg = new THREE.ConeGeometry(0.06, 0.45, 3); tg.translate(0, 0.22, 0);
  const N = isTouch ? 2500 : 4500, im = new THREE.InstancedMesh(tg, lam(0x3a482d), N);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 58, x = Math.cos(a) * r, z = Math.sin(a) * r, s = rnd(0.6, 1.8);
    q.setFromEuler(e.set(rnd(-0.25, 0.25), rnd(0, 6), rnd(-0.25, 0.25)));
    m4.compose(new V3(x, hAt(x, z), z), q, new V3(s, s, s)); im.setMatrixAt(i, m4);
  }
  scene.add(im);
}

// --- fences (every post is a host) ---
const postGeo = new THREE.CylinderGeometry(0.1, 0.12, 1.4, 6); postGeo.translate(0, 0.7, 0);
function fenceLine(x1, z1, x2, z2, n, bodyOnly) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = x1 + (x2 - x1) * i / n, z = z1 + (z2 - z1) * i / n, p = new THREE.Group();
    p.position.set(x, hAt(x, z), z); p.add(new THREE.Mesh(postGeo, lam(0x4a3f33))); scene.add(p);
    addHost(p, new V3(0, 1.74, 0), { label: 'the fence post' }); addCircle(x, z, 0.12); pts.push(p.position.clone());
  }
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[i + 1], len = d2(a, b), ang = Math.atan2(b.x - a.x, b.z - a.z);
    for (const y of [0.85, 1.25]) { // bottom rail is above the head, so heads roll under
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, len), lam(0x5a4c3d));
      r.position.set((a.x + b.x) / 2, (a.y + b.y) / 2 + y, (a.z + b.z) / 2); r.rotation.y = ang; scene.add(r);
    }
  }
  const pad = 0.2;
  addBox(Math.min(x1, x2) - pad, Math.max(x1, x2) + pad, Math.min(z1, z2) - pad, Math.max(z1, z2) + pad, bodyOnly);
}
// The pen has no gate: bodies can't get in, heads roll under the rails.
fenceLine(-32, -30, -16, -30, 6, true); fenceLine(-16, -30, -16, -14, 6, true);
fenceLine(-16, -14, -32, -14, 6, true); fenceLine(-32, -14, -32, -30, 6, true);
fenceLine(-3, 6, -3, 16, 4, true);

// --- headless scarecrow ---
{
  const s = new THREE.Group(); s.position.set(-12, hAt(-12, 14), 14);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 3.2, 6), lam(0x4a3f33)); pole.position.y = 1.6; s.add(pole);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), lam(0x4a3f33)); bar.rotation.z = Math.PI / 2; bar.position.y = 2.6; s.add(bar);
  const shirt = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.1, 0.35), lam(0x43394f)); shirt.position.y = 2.35; s.add(shirt);
  const sleeves = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.3), lam(0x43394f)); sleeves.position.y = 2.6; s.add(sleeves);
  s.rotation.y = 0.6; scene.add(s);
  addHost(s, new V3(0, 3.25, 0), { label: 'the scarecrow' }); addCircle(-12, 14, 0.4);
}

// --- headless sleeping cow (drivable) ---
export const cow = new THREE.Group();
export const cowBody = new THREE.Group();
export const cowLegs = [];
{
  cow.position.set(16, hAt(16, 12), 12); cow.add(cowBody);
  cowBody.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.95, 2.3), lam(0xd6d0c4)));
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.5), lam(0xd6d0c4)); neck.position.set(0, 0.25, 1.35); cowBody.add(neck);
  const stump = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.04), lam(0x4a2f2f)); stump.position.set(0, 0.25, 1.61); cowBody.add(stump);
  cowBody.position.y = 0.5;
  const lg = new THREE.BoxGeometry(0.22, 0.9, 0.22); lg.translate(0, -0.45, 0);
  for (const [x, z] of [[0.5, 0.85], [-0.5, 0.85], [0.5, -0.85], [-0.5, -0.85]]) {
    const l = new THREE.Mesh(lg, lam(0xd6d0c4)); l.position.set(x, 0.95, z); l.visible = false; cow.add(l); cowLegs.push(l);
  }
  cow.rotation.y = -2.2; scene.add(cow);
}
addHost(cow, new V3(0, 1.1, 1.75), { label: 'the sleeping cow', drivable: true, speed: 2.6, dist: 5.5, kind: 'cow' });
addCircle(0, 0, 1.3, cow);
export function setCowStanding(standing) {
  cowBody.position.y = standing ? 0.95 : 0.5;
  cowLegs.forEach((l) => (l.visible = standing));
}

// --- old tractor (drivable) ---
export const tractor = new THREE.Group();
export const wheels = [];
{
  tractor.position.set(-6, hAt(-6, -22), -22);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 2.6), lam(0x3c5639)); body.position.set(0, 1.0, 0.2); tractor.add(body);
  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 1.2), lam(0x3c5639)); hood.position.set(0, 1.75, 0.9); tractor.add(hood);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.6), lam(0x221e1a)); seat.position.set(0, 1.55, -0.45); tractor.add(seat);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.12), lam(0x221e1a)); back.position.set(0, 1.85, -0.75); tractor.add(back);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 6), lam(0x1a1a1a)); pipe.position.set(0.35, 2.5, 1.1); tractor.add(pipe);
  const wg = new THREE.CylinderGeometry(1, 1, 1, 14); wg.rotateZ(Math.PI / 2);
  for (const [x, z, r, w] of [[0.85, -0.6, 0.8, 0.4], [-0.85, -0.6, 0.8, 0.4], [0.7, 1.3, 0.45, 0.25], [-0.7, 1.3, 0.45, 0.25]]) {
    const wh = new THREE.Mesh(wg, lam(0x161616)); wh.scale.set(w, r, r); wh.position.set(x, r, z); wh.userData.r = r; tractor.add(wh); wheels.push(wh);
  }
  tractor.rotation.y = 0.9; scene.add(tractor);
}
addHost(tractor, new V3(0, 1.98, -0.45), { label: 'the old tractor', drivable: true, speed: 8, dist: 7.5, kind: 'tractor' });
addCircle(0, 0, 1.6, tractor);

// --- burrows: mounds only a head fits into. Sit inside to peek around. ---
const BURROW_R = 1.6;
const earth = new THREE.MeshLambertMaterial({ color: grey(0x3a3128), side: THREE.DoubleSide });
/** Hollow mound with an opening facing local +Z. `fill(group)` adds whatever is inside. */
export function makeBurrow(x, z, yaw, opts, fill) {
  const b = new THREE.Group(); b.position.set(x, hAt(x, z) - 0.08, z); b.rotation.y = yaw;
  const gap = 0.9;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(BURROW_R, 18, 8, Math.PI / 2 + gap / 2, Math.PI * 2 - gap, 0, Math.PI / 2), earth);
  const lintel = new THREE.Mesh(new THREE.SphereGeometry(BURROW_R, 5, 5, Math.PI / 2 - gap / 2, gap, 0, 0.75), earth);
  const shell = new THREE.Group(); shell.add(dome, lintel); shell.scale.y = 0.8; b.add(shell);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(BURROW_R, 18), lam(0x1c1815)); floor.rotation.x = -Math.PI / 2; floor.position.y = 0.22; b.add(floor);
  if (fill) fill(b);
  scene.add(b); addCircle(x, z, BURROW_R);
  return addHost(b, new V3(0, 0.6, 0.95), Object.assign({ label: 'the burrow', verb: 'peek into', btn: 'Peek in', who: 'inside the burrow', kind: 'burrow' }, opts));
}
// This one holds a lost head (see SPOTS in memories.js): only peeking in finds it.
makeBurrow(30, 8, -1.9, { hint: '' });
// This one holds a nest. One of them is awake.
makeBurrow(-20, 30, 2.4, { hint: 'They sleep better down here.<br>Count them. Then count again.' }, (b) => {
  const spots = [[-0.55, -0.5], [0.05, -0.85], [0.6, -0.45], [-0.12, -0.5], [0.35, -0.95]];
  spots.forEach(([hx, hz], i) => {
    const h = makeHead(0xb9b7bd, true, i === 3); h.scale.setScalar(0.8);
    h.position.set(hx, 0.48 + (i === 4 ? 0.42 : 0), hz); h.rotation.set(rnd(-0.3, 0.3), Math.atan2(-hx, 0.95 - hz) + (i === 3 ? 0 : rnd(-1.2, 1.2)), rnd(-0.4, 0.4)); b.add(h);
  });
});

// --- drifting fog wisps ---
export const wisps = [];
{
  const tex = radialTex('rgba(210,210,210,.5)', null, 128);
  for (let i = 0; i < 46; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: rnd(0.08, 0.18) }));
    const sc = rnd(8, 16); s.scale.set(sc, sc * 0.45, 1); s.position.set(rnd(-50, 50), rnd(0.6, 2.2), rnd(-50, 50));
    s.userData.v = rnd(0.3, 0.8); scene.add(s); wisps.push(s);
  }
}
