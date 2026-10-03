import { groundHeight, pushOut, type Box } from './collision';
import { approach, lerpAngle, v3, type Vec3 } from './vec';

export const CAT = {
  radius: 0.22,
  height: 0.45,
  speed: 3.2,
  accelGround: 28,
  accelAir: 10,
  jumpV: 5.2,
  gravity: -15,
  maxFall: -18,
  step: 0.22,
  coyote: 0.1,
  buffer: 0.12,
  splashTime: 0.7,
  /** Feet this far under the water surface count as "fallen in". */
  sink: 0.15,
} as const;

export interface CatState {
  pos: Vec3;
  vel: Vec3;
  onGround: boolean;
  facing: number;
  coyote: number;
  buffer: number;
  lastSafe: Vec3;
  splash: number;
}
export interface MoveInput {
  x: number;
  z: number;
  jump: boolean;
}
export interface World {
  boxes: Box[];
  waterY: number;
}
export type CatEvent = 'jump' | 'land' | 'splash' | 'respawn';

export const initCat = (spawn: Vec3): CatState => ({ pos: { ...spawn }, vel: v3(), onGround: false, facing: 0, coyote: 0, buffer: 0, lastSafe: { ...spawn }, splash: 0 });

export function stepCat(s: CatState, input: MoveInput, dt: number, world: World): { state: CatState; events: CatEvent[] } {
  const events: CatEvent[] = [];
  if (s.splash > 0) {
    const left = s.splash - dt;
    if (left > 0) return { state: { ...s, splash: left }, events };
    events.push('respawn');
    return { state: { ...s, pos: { ...s.lastSafe }, vel: v3(), onGround: true, splash: 0, coyote: 0, buffer: 0 }, events };
  }

  let mx = input.x;
  let mz = input.z;
  const len = Math.hypot(mx, mz);
  if (len > 1) {
    mx /= len;
    mz /= len;
  }
  const vel = { ...s.vel };
  const accel = s.onGround ? CAT.accelGround : CAT.accelAir;
  vel.x = approach(vel.x, mx * CAT.speed, accel * dt);
  vel.z = approach(vel.z, mz * CAT.speed, accel * dt);
  const hs = Math.hypot(vel.x, vel.z);
  if (hs > CAT.speed) {
    vel.x *= CAT.speed / hs;
    vel.z *= CAT.speed / hs;
  }
  const facing = len > 0.1 ? lerpAngle(s.facing, Math.atan2(mx, mz), Math.min(1, dt * 12)) : s.facing;

  let coyote = s.onGround ? CAT.coyote : Math.max(0, s.coyote - dt);
  let buffer = input.jump ? CAT.buffer : Math.max(0, s.buffer - dt);
  let onGround = s.onGround;
  if (buffer > 0 && coyote > 0) {
    vel.y = CAT.jumpV;
    buffer = 0;
    coyote = 0;
    onGround = false;
    events.push('jump');
  }
  vel.y = Math.max(CAT.maxFall, vel.y + CAT.gravity * dt);

  // Horizontal move, then slide along walls.
  const tx = s.pos.x + vel.x * dt;
  const tz = s.pos.z + vel.z * dt;
  const p = pushOut(world.boxes, tx, tz, CAT.radius, s.pos.y, CAT.height, CAT.step);
  if (Math.abs(p.x - tx) > 1e-9) vel.x = 0;
  if (Math.abs(p.z - tz) > 1e-9) vel.z = 0;

  // Vertical move: ceilings, then ground (including step-ups and small step-downs).
  let ny = s.pos.y + vel.y * dt;
  if (vel.y > 0) {
    for (const b of world.boxes) {
      const over = p.x > b.min.x - CAT.radius * 0.6 && p.x < b.max.x + CAT.radius * 0.6 && p.z > b.min.z - CAT.radius * 0.6 && p.z < b.max.z + CAT.radius * 0.6;
      if (over && b.min.y >= s.pos.y + CAT.height - 1e-9 && b.min.y < ny + CAT.height) {
        ny = b.min.y - CAT.height;
        vel.y = 0;
      }
    }
  }
  const g = groundHeight(world.boxes, p.x, p.z, CAT.radius, s.pos.y, CAT.step);
  const wasGround = s.onGround;
  if (vel.y <= 0 && g !== null && (ny <= g || (wasGround && s.pos.y - g <= CAT.step))) {
    ny = g;
    vel.y = 0;
    onGround = true;
    if (!wasGround) events.push('land');
  } else {
    onGround = false;
  }

  const pos = { x: p.x, y: ny, z: p.z };
  let lastSafe = s.lastSafe;
  if (onGround && ny > world.waterY + 0.05 && groundHeight(world.boxes, p.x, p.z, 0, ny, 1e-6) === ny) lastSafe = { ...pos };

  if (pos.y < world.waterY - CAT.sink) {
    events.push('splash');
    return { state: { pos, vel: v3(), onGround: false, facing, coyote: 0, buffer: 0, lastSafe, splash: CAT.splashTime }, events };
  }
  return { state: { pos, vel, onGround, facing, coyote, buffer, lastSafe, splash: 0 }, events };
}
