import { CAT } from './controller';
import { clamp } from './vec';

export interface CatPose {
  legFL: number;
  legFR: number;
  legBL: number;
  legBR: number;
  bob: number;
  tail: number;
  tuck: number;
}

export function catPose(m: { speed: number; onGround: boolean; vy: number; t: number; splash: boolean }): CatPose {
  if (m.splash) return { legFL: -0.9, legFR: 0.9, legBL: 0.9, legBR: -0.9, bob: 0.02 * Math.sin(m.t * 30), tail: 1, tuck: 1 };
  if (!m.onGround) {
    const tuck = clamp(0.5 + m.vy * 0.12, 0, 1);
    const reach = -0.7 * tuck + 0.4 * (1 - tuck);
    return { legFL: reach, legFR: reach, legBL: -reach, legBR: -reach, bob: 0, tail: 0.6, tuck };
  }
  const walk = clamp(m.speed / CAT.speed, 0, 1);
  const swing = walk > 0.02 ? Math.sin(m.t * 11) * 0.7 * walk : 0;
  return {
    legFL: swing,
    legBR: swing,
    legFR: -swing,
    legBL: -swing,
    bob: Math.abs(Math.sin(m.t * 11)) * 0.03 * walk + Math.sin(m.t * 2) * 0.006 * (1 - walk),
    tail: 0.25 + 0.15 * Math.sin(m.t * 1.6) + 0.2 * walk,
    tuck: 0,
  };
}
