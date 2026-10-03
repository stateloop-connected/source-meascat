import { describe, expect, it } from 'vitest';
import { initialQuality, QUALITY, QualityGovernor } from '../../src/core/quality';

describe('quality', () => {
  it('starts low on small touch devices, medium on other touch devices, high on computers', () => {
    expect(initialQuality({ coarsePointer: true, cores: 4, memoryGB: 3 })).toBe('low');
    expect(initialQuality({ coarsePointer: true, cores: 8, memoryGB: 8 })).toBe('medium');
    expect(initialQuality({ coarsePointer: false, cores: 8 })).toBe('high');
    expect(initialQuality({ coarsePointer: false, cores: 2 })).toBe('medium');
  });
  it('settings get cheaper as quality drops and never exceed a pixel ratio of 2', () => {
    expect(QUALITY.high.pixelRatioCap).toBeLessThanOrEqual(2);
    expect(QUALITY.low.waterSegments).toBeLessThan(QUALITY.high.waterSegments);
    expect(QUALITY.low.foam).toBe(false);
  });
  it('steps down after a slow window and never climbs back after a downgrade', () => {
    const g = new QualityGovernor('high', 30);
    let changed: string | null = null;
    for (let i = 0; i < 30; i++) changed = g.push(30) ?? changed;
    expect(changed).toBe('medium');
    for (let i = 0; i < 300; i++) expect(g.push(8)).toBeNull();
    expect(g.level).toBe('medium');
  });
  it('climbs up after three fast windows when it started low and was never downgraded', () => {
    const g = new QualityGovernor('low', 30);
    let changed: string | null = null;
    for (let i = 0; i < 90; i++) changed = g.push(9) ?? changed;
    expect(changed).toBe('medium');
  });
});
