import { clamp } from './utils.js';

/**
 * Very small 2D (XZ) collision system.
 * Circles can follow a moving object (obj) – used for the cow and tractor.
 * Boxes flagged bodyOnly block bodies but let the rolling head through
 * (fence rails sit higher than the head).
 */
export const colliders = [];

export function addCircle(x, z, r, obj) { colliders.push({ type: 'c', x, z, r, obj }); }
export function addBox(minX, maxX, minZ, maxZ, bodyOnly = false) {
  colliders.push({ type: 'b', minX, maxX, minZ, maxZ, bodyOnly });
}

/** Push pos (radius r) out of every collider. */
export function resolve(pos, r, isHead = false, exclude = null) {
  for (const c of colliders) {
    if (c.bodyOnly && isHead) continue;
    if (exclude && c.obj === exclude) continue;
    if (c.type === 'c') {
      const cx = c.obj ? c.obj.position.x : c.x;
      const cz = c.obj ? c.obj.position.z : c.z;
      const dx = pos.x - cx, dz = pos.z - cz, d = Math.hypot(dx, dz), m = r + c.r;
      if (d < m && d > 1e-4) { pos.x = cx + dx / d * m; pos.z = cz + dz / d * m; }
    } else {
      const qx = clamp(pos.x, c.minX, c.maxX), qz = clamp(pos.z, c.minZ, c.maxZ);
      const dx = pos.x - qx, dz = pos.z - qz, d = Math.hypot(dx, dz);
      if (d >= r) continue;
      if (d > 1e-4) { pos.x = qx + dx / d * r; pos.z = qz + dz / d * r; continue; }
      // Centre is inside the box: push out through the nearest edge.
      const opts = [
        [pos.x - c.minX, () => (pos.x = c.minX - r)],
        [c.maxX - pos.x, () => (pos.x = c.maxX + r)],
        [pos.z - c.minZ, () => (pos.z = c.minZ - r)],
        [c.maxZ - pos.z, () => (pos.z = c.maxZ + r)],
      ].sort((a, b) => a[0] - b[0]);
      opts[0][1]();
    }
  }
}
