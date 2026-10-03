import { describe, expect, it } from 'vitest';
import { catPose } from '../../src/core/catPose';
import { CAT } from '../../src/core/controller';
import { waveHeight } from '../../src/core/waves';

describe('waveHeight', () => {
  it('is gentle (under 0.15 m) and changes over time', () => {
    for (let i = 0; i < 50; i++) expect(Math.abs(waveHeight(i * 0.7, i * 1.3, i * 0.2))).toBeLessThan(0.15);
    expect(waveHeight(1, 2, 0)).not.toBe(waveHeight(1, 2, 1));
  });
});

describe('catPose', () => {
  it('idle: legs straight, only a breathing bob', () => {
    const p = catPose({ speed: 0, onGround: true, vy: 0, t: 1, splash: false });
    expect(p.legFL).toBe(0);
    expect(Math.abs(p.bob)).toBeLessThan(0.01);
  });
  it('walking swings diagonal pairs together and opposite to the other pair', () => {
    const p = catPose({ speed: CAT.speed, onGround: true, vy: 0, t: 0.13, splash: false });
    expect(p.legFL).toBeCloseTo(p.legBR, 6);
    expect(p.legFR).toBeCloseTo(-p.legFL, 6);
    expect(Math.abs(p.legFL)).toBeGreaterThan(0.1);
  });
  it('rising in a jump tucks the legs; a splash raises the tail', () => {
    expect(catPose({ speed: 0, onGround: false, vy: 4, t: 0, splash: false }).tuck).toBeGreaterThan(0.5);
    expect(catPose({ speed: 0, onGround: false, vy: 0, t: 0, splash: true }).tail).toBeGreaterThan(0.8);
  });
});
