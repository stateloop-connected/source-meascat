import type { Vec3 } from '../core/vec';

/**
 * Hands a jump press to exactly one physics step. On fast displays many frames run no step at all;
 * a press on such a frame stays pending until the next step instead of being lost.
 */
export function frameJumps(pending: boolean, pressed: boolean, steps: number): { jumps: boolean[]; pending: boolean } {
  const want = pending || pressed;
  if (steps === 0) return { jumps: [], pending: want };
  return { jumps: Array.from({ length: steps }, (_, i) => want && i === 0), pending: false };
}

export const lerpVec = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });
