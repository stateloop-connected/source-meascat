import { describe, expect, it } from 'vitest';
import { approach, clamp, damp, lerpAngle, v3 } from '../../src/core/vec';

describe('vec helpers', () => {
  it('v3 defaults to zero', () => expect(v3()).toEqual({ x: 0, y: 0, z: 0 }));
  it('clamp', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });
  it('approach never overshoots', () => {
    expect(approach(0, 10, 3)).toBe(3);
    expect(approach(9, 10, 3)).toBe(10);
    expect(approach(5, -5, 2)).toBe(3);
  });
  it('damp moves toward the target and never passes it', () => {
    const d = damp(0, 10, 5, 0.1);
    expect(d).toBeGreaterThan(0);
    expect(d).toBeLessThan(10);
    expect(damp(0, 10, 5, 100)).toBeCloseTo(10, 6);
  });
  it('lerpAngle takes the short way round', () => {
    expect(lerpAngle(Math.PI - 0.1, -Math.PI + 0.1, 0.5)).toBeCloseTo(Math.PI, 6);
    expect(lerpAngle(0, 1, 0.5)).toBeCloseTo(0.5, 6);
  });
});
