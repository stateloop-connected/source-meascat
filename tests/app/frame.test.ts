import { describe, expect, it } from 'vitest';
import { frameJumps, lerpVec } from '../../src/app/frame';

describe('frameJumps — a jump press is never lost between physics steps', () => {
  it('a press on a frame with no physics step waits for the next step', () => {
    let r = frameJumps(false, true, 0);
    expect(r.jumps).toEqual([]);
    expect(r.pending).toBe(true);
    r = frameJumps(r.pending, false, 1);
    expect(r.jumps).toEqual([true]);
    expect(r.pending).toBe(false);
  });
  it('only the first of several steps gets the jump', () => expect(frameJumps(false, true, 3).jumps).toEqual([true, false, false]));
  it('simulated 120 Hz: every press reaches the controller', () => {
    let pending = false;
    let delivered = 0;
    for (let i = 0; i < 40; i++) {
      const steps = i % 2; // 120 Hz: a physics step every other frame
      const r = frameJumps(pending, i % 4 === 0, steps);
      pending = r.pending;
      delivered += r.jumps.filter(Boolean).length;
    }
    expect(delivered).toBe(10);
  });
});

describe('lerpVec', () => {
  it('interpolates between two positions', () => expect(lerpVec({ x: 0, y: 0, z: 0 }, { x: 2, y: 4, z: -2 }, 0.5)).toEqual({ x: 1, y: 2, z: -1 }));
});
