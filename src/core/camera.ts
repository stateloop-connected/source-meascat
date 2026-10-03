import { raycast, type Box } from './collision';
import { clamp, damp, v3, type Vec3 } from './vec';

export const CAM = { dist: 4.2, minDist: 0.8, minPitch: 0.06, maxPitch: 1.15, height: 0.35, margin: 0.25, follow: 10, settle: 8, startPitch: 0.32 } as const;

export interface CamState {
  yaw: number;
  pitch: number;
  target: Vec3;
  pos: Vec3;
}

export function orbitPosition(t: Vec3, yaw: number, pitch: number, dist: number): Vec3 {
  return { x: t.x + Math.sin(yaw) * Math.cos(pitch) * dist, y: t.y + Math.sin(pitch) * dist, z: t.z + Math.cos(yaw) * Math.cos(pitch) * dist };
}

export function initCam(follow: Vec3): CamState {
  const target = { x: follow.x, y: follow.y + CAM.height, z: follow.z };
  return { yaw: 0, pitch: CAM.startPitch, target, pos: orbitPosition(target, 0, CAM.startPitch, CAM.dist) };
}

/** Joystick/keys (ix right, iz forward) to a world-space XZ move for the current camera yaw. */
export function toWorldMove(ix: number, iz: number, yaw: number): { x: number; z: number } {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  return { x: rx * ix + fx * iz, z: rz * ix + fz * iz };
}

export function stepCamera(
  c: CamState,
  follow: Vec3,
  look: { dx: number; dy: number },
  opts: { sensitivity: number; reduceMotion: boolean; time: number },
  dt: number,
  boxes: Box[],
): { state: CamState; eye: Vec3; lookAt: Vec3 } {
  const yaw = c.yaw - look.dx * opts.sensitivity;
  const pitch = clamp(c.pitch + look.dy * opts.sensitivity, CAM.minPitch, CAM.maxPitch);
  const want = { x: follow.x, y: follow.y + CAM.height, z: follow.z };
  const target = { x: damp(c.target.x, want.x, CAM.follow, dt), y: damp(c.target.y, want.y, CAM.follow, dt), z: damp(c.target.z, want.z, CAM.follow, dt) };

  const ideal = orbitPosition(target, yaw, pitch, CAM.dist);
  const dir = { x: ideal.x - target.x, y: ideal.y - target.y, z: ideal.z - target.z };
  const len = Math.hypot(dir.x, dir.y, dir.z);
  const unit = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
  const hit = raycast(boxes, target, unit, CAM.dist);
  const dist = hit === null ? CAM.dist : Math.max(CAM.minDist, hit - CAM.margin);
  const desired = orbitPosition(target, yaw, pitch, dist);

  const curDist = Math.hypot(c.pos.x - target.x, c.pos.y - target.y, c.pos.z - target.z);
  // Snap inward immediately when something blocks the view; ease outward smoothly.
  const pos =
    dist < curDist - 1e-6
      ? desired
      : { x: damp(c.pos.x, desired.x, CAM.settle, dt), y: damp(c.pos.y, desired.y, CAM.settle, dt), z: damp(c.pos.z, desired.z, CAM.settle, dt) };

  const sway = opts.reduceMotion ? v3() : v3(Math.sin(opts.time * 0.6) * 0.04, Math.sin(opts.time * 0.83 + 1.3) * 0.03, 0);
  const state = { yaw, pitch, target, pos };
  return { state, eye: { x: pos.x + sway.x, y: pos.y + sway.y, z: pos.z + sway.z }, lookAt: target };
}
