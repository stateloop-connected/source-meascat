import { describe, expect, it } from 'vitest';
import { box } from '../../src/core/collision';
import { CAT, initCat, stepCat, type CatState, type MoveInput, type World } from '../../src/core/controller';
import { STEP } from '../../src/core/stepper';
import { v3 } from '../../src/core/vec';

const world: World = {
  waterY: 0.3,
  boxes: [box(-5, -2, -5, 5, 0.6, 5), box(6.5, -2, -1, 8, 0.6, 1), box(-1, 0.6, 3, 1, 3, 4), box(2, 0.6, -1, 3, 0.8, 1)],
};
const idle: MoveInput = { x: 0, z: 0, jump: false };
function run(s: CatState, input: MoveInput, frames: number, w = world) {
  const events: string[] = [];
  for (let i = 0; i < frames; i++) {
    const r = stepCat(s, i === 0 ? input : { ...input, jump: false }, STEP, w);
    s = r.state;
    events.push(...r.events);
  }
  return { s, events };
}
const start = () => run(initCat(v3(0, 0.6, 0)), idle, 5).s;

describe('cat controller', () => {
  it('stands still on the ground', () => {
    const s = start();
    expect(s.onGround).toBe(true);
    expect(s.pos.y).toBeCloseTo(0.6, 6);
  });

  it('walks at no more than CAT.speed and turns to face the move', () => {
    const { s } = run(start(), { x: 1, z: 0, jump: false }, 60);
    expect(s.pos.x).toBeGreaterThan(1.5);
    expect(Math.hypot(s.vel.x, s.vel.z)).toBeLessThanOrEqual(CAT.speed + 1e-9);
    expect(s.facing).toBeCloseTo(Math.PI / 2, 1);
  });

  it('jumps once from the ground, rises to about 0.9 m, and lands with a land event', () => {
    let s = start();
    let peak = s.pos.y;
    const events: string[] = [];
    for (let i = 0; i < 120; i++) {
      const r = stepCat(s, { x: 0, z: 0, jump: i === 0 }, STEP, world);
      s = r.state;
      peak = Math.max(peak, s.pos.y);
      events.push(...r.events);
    }
    expect(events.filter((e) => e === 'jump')).toHaveLength(1);
    expect(events).toContain('land');
    expect(peak - 0.6).toBeGreaterThan(0.75);
    expect(peak - 0.6).toBeLessThan(1.05);
    expect(s.onGround).toBe(true);
  });

  it('cannot double-jump in mid-air', () => {
    let s = start();
    const events: string[] = [];
    for (let i = 0; i < 40; i++) {
      const r = stepCat(s, { x: 0, z: 0, jump: i === 0 || i === 20 }, STEP, world);
      s = r.state;
      events.push(...r.events);
    }
    expect(events.filter((e) => e === 'jump')).toHaveLength(1);
  });

  it('a jump pressed just before landing still happens (jump buffer)', () => {
    let s = start();
    let jumps = 0;
    let frame = 0;
    for (; frame < 200; frame++) {
      const nearLanding = !s.onGround && s.vel.y < 0 && s.pos.y < 0.7;
      const r = stepCat(s, { x: 0, z: 0, jump: frame === 0 || (nearLanding && jumps === 1) }, STEP, world);
      s = r.state;
      jumps += r.events.filter((e) => e === 'jump').length;
      if (jumps === 2) break;
    }
    expect(jumps).toBe(2);
  });

  it('walks up a low step without jumping', () => {
    const { s } = run(start(), { x: 1, z: 0, jump: false }, 50);
    expect(s.pos.y).toBeCloseTo(0.8, 6);
  });

  it('is stopped by a tall wall and does not pass through it', () => {
    const { s } = run(start(), { x: 0, z: 1, jump: false }, 180);
    expect(s.pos.z).toBeLessThanOrEqual(3 - CAT.radius + 1e-6);
  });

  it('falling into the water splashes, freezes, then respawns on the last safe ground', () => {
    // Walk east off the island edge (x = 5) into the water gap; stop at the respawn.
    let s = start();
    const events: string[] = [];
    for (let i = 0; i < 400 && !events.includes('respawn'); i++) {
      const r = stepCat(s, { x: 1, z: 0, jump: false }, STEP, world);
      s = r.state;
      events.push(...r.events);
    }
    expect(events).toContain('splash');
    expect(events).toContain('respawn');
    expect(s.onGround).toBe(true);
    expect(s.pos.y).toBeGreaterThan(world.waterY);
    expect(s.pos.x).toBeLessThanOrEqual(5);
  });

  it('records last safe ground only where the centre is fully supported and dry', () => {
    const sunken: World = { waterY: 0.3, boxes: [box(-1, -2, -1, 1, 0.6, 1), box(1, -2, -1, 3, 0.1, 1)] };
    let s = initCat(v3(0, 0.6, 0));
    for (let i = 0; i < 200; i++) s = stepCat(s, { x: 1, z: 0, jump: false }, STEP, sunken).state;
    // lastSafe stayed on the dry block and never moved onto the overhang or the sunken box.
    expect(s.lastSafe.x).toBeLessThanOrEqual(1);
    expect(s.lastSafe.y).toBeCloseTo(0.6, 6);
  });

  it('at full speed right next to a thin wall, 5 capped steps never pass through it', () => {
    const thin: World = { waterY: -5, boxes: [box(-5, -1, -5, 5, 0, 5), box(-5, 0, 1, 5, 2, 1.02)] };
    let s: CatState = { ...initCat(v3(0, 0, 0.74)), onGround: true, vel: v3(0, 0, CAT.speed) };
    for (let i = 0; i < 5; i++) s = stepCat(s, { x: 0, z: 1, jump: false }, STEP, thin).state;
    expect(s.pos.z).toBeLessThanOrEqual(1 - CAT.radius + 1e-6);
  });

  it('respawns with the whole body on solid ground, not hanging over the edge', () => {
    let s = start();
    const events: string[] = [];
    for (let i = 0; i < 400 && !events.includes('respawn'); i++) {
      const r = stepCat(s, { x: 1, z: 0, jump: false }, STEP, world);
      s = r.state;
      events.push(...r.events);
    }
    expect(events).toContain('respawn');
    expect(s.pos.x).toBeLessThanOrEqual(5 - CAT.radius + 1e-6);
  });

  it('grazing a box corner keeps most of the speed instead of stopping dead', () => {
    const corner: World = { waterY: -5, boxes: [box(-10, -1, -10, 10, 0, 10), box(1, 0, 0.21, 3, 2, 3)] };
    let s: CatState = { ...initCat(v3(0, 0, 0)), onGround: true, vel: v3(CAT.speed, 0, 0) };
    for (let i = 0; i < 40; i++) s = stepCat(s, { x: 1, z: 0, jump: false }, STEP, corner).state;
    expect(s.pos.x).toBeGreaterThan(1.8);
    expect(Math.hypot(s.vel.x, s.vel.z)).toBeGreaterThan(CAT.speed * 0.6);
  });
});
