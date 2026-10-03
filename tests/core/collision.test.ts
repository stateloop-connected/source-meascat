import { describe, expect, it } from 'vitest';
import { box, groundHeight, pushOut, raycast, rayBox } from '../../src/core/collision';
import { v3 } from '../../src/core/vec';

const floor = box(-5, -1, -5, 5, 0, 5); // top at y=0
const step = box(1, 0, -1, 2, 0.2, 1); // low step, top 0.2
const wall = box(3, 0, -5, 4, 3, 5); // tall wall

describe('groundHeight', () => {
  it('finds the floor top under the point', () => expect(groundHeight([floor], 0, 0, 0.2, 0.5, 0.2)).toBe(0));
  it('returns the highest reachable top (a low step counts)', () => expect(groundHeight([floor, step], 1.5, 0, 0.2, 0.1, 0.2)).toBeCloseTo(0.2));
  it('ignores tops above feet + step', () => expect(groundHeight([floor, wall], 3.5, 0, 0.2, 0, 0.2)).toBe(0));
  it('returns null over nothing', () => expect(groundHeight([floor], 20, 0, 0.2, 0, 0.2)).toBeNull());
  it('with r = 0 only counts boxes strictly under the point', () => expect(groundHeight([floor], 5.05, 0, 0, 0.5, 0.2)).toBeNull());
});

describe('pushOut', () => {
  it('pushes a cylinder out of a wall it overlaps', () => {
    const p = pushOut([wall], 2.9, 0, 0.2, 0, 0.45, 0.2);
    expect(p.x).toBeCloseTo(2.8, 6);
    expect(p.z).toBe(0);
  });
  it('ignores boxes the cat can step onto', () => expect(pushOut([step], 0.95, 0, 0.2, 0, 0.45, 0.2)).toEqual({ x: 0.95, z: 0 }));
  it('resolves a corner without sticking', () => {
    const a = box(0, 0, 0, 1, 2, 1);
    const b = box(1, 0, -1, 2, 2, 0);
    const p = pushOut([a, b], 1.05, -0.05, 0.2, 0, 0.45, 0.2);
    for (const bx of [a, b]) {
      const cx = Math.min(Math.max(p.x, bx.min.x), bx.max.x);
      const cz = Math.min(Math.max(p.z, bx.min.z), bx.max.z);
      expect(Math.hypot(p.x - cx, p.z - cz)).toBeGreaterThanOrEqual(0.2 - 1e-6);
    }
  });
  it('a centre inside a box is pushed out through the nearest side', () => {
    const p = pushOut([wall], 3.1, 0, 0.2, 0, 0.45, 0.2);
    expect(p.x).toBeCloseTo(2.8, 6);
  });
});

describe('raycast', () => {
  it('hits the nearest box face along the ray', () => expect(rayBox(v3(0, 1, 0), v3(1, 0, 0), wall, 10)).toBeCloseTo(3, 6));
  it('returns null beyond max distance or when missing', () => {
    expect(rayBox(v3(0, 1, 0), v3(1, 0, 0), wall, 2)).toBeNull();
    expect(rayBox(v3(0, 1, 0), v3(-1, 0, 0), wall, 10)).toBeNull();
  });
  it('raycast returns the closest hit among boxes', () => expect(raycast([wall, box(1.5, 0, -1, 2, 3, 1)], v3(0, 1, 0), v3(1, 0, 0), 10)).toBeCloseTo(1.5, 6));
});
