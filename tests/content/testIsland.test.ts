import { describe, expect, it } from 'vitest';
import { CAT, initCat, stepCat } from '../../src/core/controller';
import { STEP } from '../../src/core/stepper';
import { TEST_ISLAND } from '../../src/content/testIsland';

describe('test island', () => {
  it('spawns the cat on dry, supported ground', () => {
    let s = initCat(TEST_ISLAND.spawn);
    for (let i = 0; i < 30; i++) s = stepCat(s, { x: 0, z: 0, jump: false }, STEP, TEST_ISLAND).state;
    expect(s.onGround).toBe(true);
    expect(s.pos.y).toBeGreaterThan(TEST_ISLAND.waterY);
  });
  it('every gap between neighbouring stepping stones can be jumped (≤ 1.6 m, ≤ 0.6 m up)', () => {
    const stones = TEST_ISLAND.boxes.filter((b) => b.min.y < TEST_ISLAND.waterY && b.max.y < 1.2 && b.max.x - b.min.x <= 2.5); // low stones only, not the tall ruin pillars
    for (let i = 1; i < stones.length; i++) {
      const gap = stones[i]!.min.x - stones[i - 1]!.max.x;
      expect(gap).toBeLessThanOrEqual(1.6);
      expect(stones[i]!.max.y - stones[i - 1]!.max.y).toBeLessThanOrEqual(0.6);
    }
  });
  it('every box has a colour and a positive size', () => {
    for (const b of TEST_ISLAND.boxes) {
      expect(b.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(b.max.x).toBeGreaterThan(b.min.x);
    }
    expect(CAT.jumpV).toBeGreaterThan(0);
  });
});
