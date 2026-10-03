export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
/** Moves `cur` toward `target` by at most `maxDelta`. */
export const approach = (cur: number, target: number, maxDelta: number): number =>
  cur < target ? Math.min(target, cur + maxDelta) : Math.max(target, cur - maxDelta);
/** Frame-rate independent exponential smoothing. */
export const damp = (cur: number, target: number, lambda: number, dt: number): number => target + (cur - target) * Math.exp(-lambda * dt);
/** Interpolates angles (radians) along the shortest arc. */
export function lerpAngle(a: number, b: number, t: number): number {
  const TAU = Math.PI * 2;
  const d = ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return a + d * t;
}
