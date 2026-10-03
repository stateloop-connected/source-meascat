import { describe, expect, it } from 'vitest';
import { STEP, stepFrames } from '../../src/core/stepper';

describe('stepFrames', () => {
  it('runs one step per 60 Hz frame', () => {
    const r = stepFrames(0, STEP);
    expect(r.steps).toBe(1);
    expect(r.acc).toBeCloseTo(0, 9);
  });
  it('carries the remainder', () => {
    const r = stepFrames(0, STEP * 1.5);
    expect(r.steps).toBe(1);
    expect(r.acc).toBeCloseTo(STEP * 0.5, 9);
  });
  it('a 10-second frame gap runs at most 5 steps and keeps the remainder below one step', () => {
    const r = stepFrames(0, 10);
    expect(r.steps).toBe(5);
    expect(r.acc).toBeLessThan(STEP);
  });
  it('ignores negative or NaN frame times', () => {
    expect(stepFrames(0, -1).steps).toBe(0);
    expect(stepFrames(0, Number.NaN).steps).toBe(0);
  });
});
