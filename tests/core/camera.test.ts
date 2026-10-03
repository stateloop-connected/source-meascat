import { describe, expect, it } from 'vitest';
import { box } from '../../src/core/collision';
import { CAM, initCam, orbitPosition, stepCamera, toWorldMove } from '../../src/core/camera';
import { v3 } from '../../src/core/vec';

const still = { sensitivity: 0.005, reduceMotion: true, time: 0 };

describe('camera maths', () => {
  it('yaw 0 places the camera behind on +z, looking toward -z', () => {
    const p = orbitPosition(v3(0, 0, 0), 0, 0, 4);
    expect(p.x).toBeCloseTo(0, 6);
    expect(p.z).toBeCloseTo(4, 6);
  });
  it('move axes are camera-relative: forward goes away from the camera, right goes right', () => {
    const f = toWorldMove(0, 1, 0);
    expect(f.x).toBeCloseTo(0, 6);
    expect(f.z).toBeCloseTo(-1, 6);
    const r = toWorldMove(1, 0, 0);
    expect(r.x).toBeCloseTo(1, 6);
    expect(r.z).toBeCloseTo(0, 6);
    const turned = toWorldMove(0, 1, Math.PI / 2);
    expect(turned.x).toBeCloseTo(-1, 6);
  });
  it('look drag changes yaw and pitch; pitch is clamped', () => {
    let c = initCam(v3());
    c = stepCamera(c, v3(), { dx: 100, dy: 0 }, still, 1 / 60, []).state;
    expect(c.yaw).toBeCloseTo(-0.5, 6);
    c = stepCamera(c, v3(), { dx: 0, dy: 100000 }, still, 1 / 60, []).state;
    expect(c.pitch).toBe(CAM.maxPitch);
  });
  it('a wall between the cat and the camera pulls the camera in front of it', () => {
    const wall = box(-5, -5, 2, 5, 5, 2.5);
    let r = stepCamera(initCam(v3()), v3(), { dx: 0, dy: 0 }, still, 1 / 60, [wall]);
    for (let i = 0; i < 120; i++) r = stepCamera(r.state, v3(), { dx: 0, dy: 0 }, still, 1 / 60, [wall]);
    expect(r.eye.z).toBeLessThan(2);
  });
  it('sway only when motion is allowed', () => {
    const c = initCam(v3());
    const a = stepCamera(c, v3(), { dx: 0, dy: 0 }, { ...still, time: 1.3 }, 1 / 60, []);
    const b = stepCamera(c, v3(), { dx: 0, dy: 0 }, { ...still, reduceMotion: false, time: 1.3 }, 1 / 60, []);
    expect(Math.hypot(a.eye.x - b.eye.x, a.eye.y - b.eye.y)).toBeGreaterThan(0.001);
    expect(a.eye).toEqual(a.state.pos);
  });
});
