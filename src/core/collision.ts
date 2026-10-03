import { clamp, type Vec3 } from './vec';

export interface Box {
  min: Vec3;
  max: Vec3;
}
export const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: { x: Math.min(x0, x1), y: Math.min(y0, y1), z: Math.min(z0, z1) },
  max: { x: Math.max(x0, x1), y: Math.max(y0, y1), z: Math.max(z0, z1) },
});

/** Highest box top under (x, z), allowing a footprint overhang of 0.6·r, at most `feetY + step`. */
export function groundHeight(boxes: Box[], x: number, z: number, r: number, feetY: number, step: number): number | null {
  const f = r * 0.6;
  let best: number | null = null;
  for (const b of boxes) {
    if (x < b.min.x - f || x > b.max.x + f || z < b.min.z - f || z > b.max.z + f) continue;
    if (b.max.y > feetY + step + 1e-9) continue;
    if (best === null || b.max.y > best) best = b.max.y;
  }
  return best;
}

/** Pushes a vertical cylinder (centre x,z, radius r, from feetY to feetY+h) out of boxes it overlaps sideways. */
export function pushOut(boxes: Box[], x: number, z: number, r: number, feetY: number, h: number, step: number): { x: number; z: number } {
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (const b of boxes) {
      if (b.max.y <= feetY + step || b.min.y >= feetY + h) continue; // can step onto it, or it's overhead
      const cx = clamp(x, b.min.x, b.max.x);
      const cz = clamp(z, b.min.z, b.max.z);
      const dx = x - cx;
      const dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r - 1e-12) continue;
      if (d2 > 1e-12) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        z = cz + (dz / d) * r;
      } else {
        // Centre inside the box: leave through the nearest side.
        const exits: [number, number, number][] = [
          [x - b.min.x, -1, 0],
          [b.max.x - x, 1, 0],
          [z - b.min.z, 0, -1],
          [b.max.z - z, 0, 1],
        ];
        exits.sort((a, c) => a[0] - c[0]);
        const [dist, sx, sz] = exits[0]!;
        x += sx * (dist + r);
        z += sz * (dist + r);
      }
      moved = true;
    }
    if (!moved) break;
  }
  return { x, z };
}

/** Slab test: distance along unit direction `d` to the first hit with `b`, or null. */
export function rayBox(o: Vec3, d: Vec3, b: Box, maxDist: number): number | null {
  let tmin = 0;
  let tmax = maxDist;
  for (const a of ['x', 'y', 'z'] as const) {
    if (Math.abs(d[a]) < 1e-12) {
      if (o[a] < b.min[a] || o[a] > b.max[a]) return null;
      continue;
    }
    let t1 = (b.min[a] - o[a]) / d[a];
    let t2 = (b.max[a] - o[a]) / d[a];
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

export function raycast(boxes: Box[], o: Vec3, d: Vec3, maxDist: number): number | null {
  let best: number | null = null;
  for (const b of boxes) {
    const t = rayBox(o, d, b, maxDist);
    if (t !== null && (best === null || t < best)) best = t;
  }
  return best;
}
