# Meascat M1 — Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A playable test island in the browser. Meascat, a small ginger cat, walks, jumps and falls into rising-water territory. Falling in makes the cat splash back to safe ground.

The milestone delivers:
- the painterly sky, mist and water;
- a following camera;
- keyboard and touch controls;
- automatic quality levels;
- the test and QA harness that every later milestone builds on.

**Architecture:**
- **Pure, unit-tested logic** lives in `src/core/`: maths, collision, the cat controller, camera maths, input mapping, quality and pose.
- **three.js rendering** lives in `src/render/`. It only reads core state; it never decides game rules.
- **The app** in `src/app/` runs a fixed-timestep loop: input, then the controller, then the camera, then the pose, then the render.
- **The DOM touch UI** lives in `src/ui/`.
- **Level data** lives in `src/content/`.
- There is no physics engine. A small kinematic controller collides a vertical cylinder against axis-aligned boxes.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 5 with happy-dom, three.js 0.186, playwright-core (QA), Vercel. These are the same versions as Afterlife.

**Spec:** `docs/superpowers/specs/2026-10-03-meascat-v1-design.md` (milestone M1, §4, §7, §9, §10, §11)

## Global Constraints

- **Original assets only.** Nothing from the film *Flow* (spec §12). In M1, Meascat is built in code: a ginger body, a white chest and one white sock (front-left).
- **No in-game text** in the play view (spec §4). A debug overlay is allowed only with `?debug`.
- **Pixel ratio:** never above the active quality level's `pixelRatioCap`, and never above 2.
- **Reduce motion:** `prefers-reduced-motion`, or `?still`, turns off camera sway.
- **Target frame rate:** 60 fps on desktop and at least 45 fps on a mid-range phone (CPU throttled 4× in a 412×915 viewport).
- **Initial download:** at most 3 MB gzip.
- **No production dependencies** beyond `three`.
- **World units:** metres. +y is up. The camera's yaw 0 looks toward −z.
- **Commits** end with:
  ```
  Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01ELR9n5ytx7LUjWV7Bu2vxY
  ```

## Review Focus

1. **A huge frame gap** (a tab hidden then shown) must never run more than 5 physics steps or move the cat through walls. Tested in Task 2 and Task 4.
2. **Respawn after falling in** must land on fully supported, dry ground. It must never land on an overhanging edge or a box that is under water. Tested in Task 4.
3. **Touch:**
   - lifting or cancelling a finger resets the joystick;
   - a second finger in the left zone doesn't take over the joystick;
   - look and joystick work at the same time.

   Tested in Task 9.
4. **Window resize or orientation change** keeps the canvas, camera aspect and depth target in sync, with no errors. Tested in Task 13.
5. **Running into a corner or wall while jumping** must neither jitter nor stick. A cylinder whose centre ends up inside a box is pushed out. Tested in Task 3.

---

## File structure

```
package.json · tsconfig.json · vite.config.ts · vitest.config.ts · index.html · README.md · LICENSE · .gitignore
src/main.ts                 boot: reads options, creates Game
src/core/vec.ts             Vec3, clamp, approach, damp, lerpAngle
src/core/stepper.ts         fixed-timestep accumulator
src/core/collision.ts       Box, groundHeight, pushOut, rayBox, raycast
src/core/controller.ts      CAT constants, CatState, initCat, stepCat (walk/jump/land/water)
src/core/camera.ts          orbit maths, look, collision-shortened follow, sway, move basis
src/core/input.ts           keysToAxes, joystickAxes, KeyboardInput
src/core/quality.ts         Quality levels, initialQuality, QualityGovernor
src/core/waves.ts           waveHeight (mirrored in GLSL)
src/core/catPose.ts         catPose: leg/tail/bob angles from motion
src/content/testIsland.ts   M1 level data (boxes + colours, water, spawn)
src/render/look.ts          shared light/fog uniforms + palette
src/render/painterly.ts     painterly ShaderMaterial
src/render/sky.ts           gradient sky dome
src/render/water.ts         water ShaderMaterial + depth pre-pass target
src/render/catModel.ts      code-built Meascat + applyPose
src/render/world.ts         meshes from level boxes; blob shadow; splash ring
src/ui/touch.ts             DOM joystick, look pad, jump button
src/ui/styles.css           touch UI + debug overlay styles
src/app/game.ts             loop wiring, resize, quality, debug hook
tests/core/*.test.ts · tests/ui/touch.test.ts
tools/qa/smoke.mjs          browser smoke + perf (Chromium & WebKit)
```

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `index.html`, `src/main.ts`, `src/core/vec.ts`, `tests/core/vec.test.ts`, `README.md`, `LICENSE`, `assets/LICENSES/README.md`
- Modify: `.gitignore` (already exists)

**Interfaces:**
- Produces:
  - `interface Vec3 { x: number; y: number; z: number }`
  - `v3(x?, y?, z?): Vec3`
  - `clamp(v, lo, hi)`
  - `approach(cur, target, maxDelta)`
  - `damp(cur, target, lambda, dt)`
  - `lerpAngle(a, b, t)`

- [ ] **Step 1: Write the config files.**

`package.json`:
```json
{
  "name": "meascat",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "description": "A wordless, painterly web game about a small cat who is afraid of water.",
  "license": "MIT",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "qa:smoke": "node tools/qa/smoke.mjs"
  },
  "devDependencies": {
    "@types/node": "^26.6.4",
    "@types/three": "^0.186.0",
    "happy-dom": "^20.14.5",
    "playwright-core": "^1.63.0",
    "typescript": "^7.0.2",
    "vite": "^8.3.2",
    "vitest": "^5.0.3"
  },
  "dependencies": {
    "three": "^0.186.1"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM"],
    "strict": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["node", "vite/client"]
  },
  "include": ["src", "tests", "vitest.config.ts", "vite.config.ts"]
}
```

`vite.config.ts`:
```ts
import { defineConfig } from 'vite';

export default defineConfig({ build: { target: 'es2022' } });
```

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
```

`index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#e6d3b8" />
    <meta name="description" content="Meascat: a wordless, painterly web game about a small cat who is afraid of water." />
    <title>Meascat</title>
    <style>html, body { margin: 0; height: 100%; overflow: hidden; background: #e6d3b8; overscroll-behavior: none; } #app { position: fixed; inset: 0; touch-action: none; }</style>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`src/main.ts` is temporary in this task; Task 11 replaces it:
```ts
document.getElementById('app')!.dataset.ready = '1';
```

`README.md`:
```markdown
# Meascat

A wordless, painterly web game about a small cat who is afraid of water. When a flood swallows the world, Meascat learns to trust a crew of very different animals.

*Inspired by the spirit of* Flow *(2024) by Gints Zilbalodis. Not affiliated with or endorsed by its makers. All art, characters, story, music and sound in Meascat are original.*

## Development

    npm install
    npm run dev        # http://localhost:5173  (add ?debug for the fps/quality overlay, ?still for no camera sway)
    npm test
    npm run build
    npm run qa:smoke   # browser smoke + performance (needs npm run dev)
```

`LICENSE`: the MIT licence text, `Copyright (c) 2026 Ujjwal Kumar`.

`assets/LICENSES/README.md`:
```markdown
Third-party assets are listed here with their licence (CC0 only). M1 uses none.
```

Append to `.gitignore`:
```
test-results/
```

- [ ] **Step 2: Install the dependencies.**
  - Run: `npm install`
  - Expected: it finishes without errors and creates `package-lock.json`.

- [ ] **Step 3: Write the failing test.** Create `tests/core/vec.test.ts`:

```ts
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
```

- [ ] **Step 4: Run it and watch it fail.**
  - Run: `npx vitest run tests/core/vec.test.ts`
  - Expected: FAIL, because `../../src/core/vec` can't be resolved.

- [ ] **Step 5: Implement.** Create `src/core/vec.ts`:

```ts
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}
export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
/** Moves `cur` toward `target` by at most `maxDelta`. */
export const approach = (cur: number, target: number, maxDelta: number): number =>
  cur < target ? Math.min(target, cur + maxDelta) : Math.max(target, cur - maxDelta);
/** Frame-rate independent exponential smoothing. */
export const damp = (cur: number, target: number, lambda: number, dt: number): number => target + (cur - target) * Math.exp(-lambda * dt);
/** Interpolates angles (radians) along the shortest arc. */
export function lerpAngle(a: number, b: number, t: number): number {
  const TAU = Math.PI * 2;
  const d = ((((b - a + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  return a + d * t;
}
```

- [ ] **Step 6: Run the tests and the build.**
  - Run: `npx vitest run && npm run build`
  - Expected: 5 tests pass, and the build writes `dist/` with no type errors.

- [ ] **Step 7: Commit.**

```bash
git add -A
git commit -m "chore: scaffold Meascat (Vite + TypeScript + Vitest + three) with vec helpers"
```

---

### Task 2: Fixed-timestep stepper

**Files:**
- Create: `src/core/stepper.ts`, `tests/core/stepper.test.ts`

**Interfaces:**
- Produces:
  - `stepFrames(acc: number, frameDt: number, step?: number, maxSteps?: number): { steps: number; acc: number }`
  - `STEP = 1/60`

- [ ] **Step 1: Write the failing test.**

```ts
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
```

- [ ] **Step 2: Run it and watch it fail.**
  - Run: `npx vitest run tests/core/stepper.test.ts`
  - Expected: FAIL, because the module can't be resolved.

- [ ] **Step 3: Implement** `src/core/stepper.ts`:

```ts
export const STEP = 1 / 60;

/** Fixed-timestep accumulator. Long frame gaps are capped, so physics never runs more than `maxSteps` at once. */
export function stepFrames(acc: number, frameDt: number, step = STEP, maxSteps = 5): { steps: number; acc: number } {
  const dt = Number.isFinite(frameDt) && frameDt > 0 ? Math.min(frameDt, step * maxSteps) : 0;
  const total = acc + dt;
  const steps = Math.min(maxSteps, Math.floor(total / step + 1e-9));
  return { steps, acc: Math.min(total - steps * step, step * 0.999) };
}
```

- [ ] **Step 4: Run it and watch it pass.**
  - Run: `npx vitest run tests/core/stepper.test.ts`
  - Expected: PASS (4 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/core/stepper.ts tests/core/stepper.test.ts
git commit -m "feat(core): fixed-timestep stepper capped at 5 steps"
```

---

### Task 3: Collision against boxes

**Files:**
- Create: `src/core/collision.ts`, `tests/core/collision.test.ts`

**Interfaces:**
- Consumes: `Vec3`, `clamp` (Task 1).
- Produces:
  - `interface Box { min: Vec3; max: Vec3 }`
  - `box(x0, y0, z0, x1, y1, z1): Box`
  - `groundHeight(boxes: Box[], x, z, r, feetY, step): number | null`
  - `pushOut(boxes, x, z, r, feetY, h, step): { x: number; z: number }`
  - `rayBox(o: Vec3, d: Vec3, b: Box, maxDist): number | null`
  - `raycast(boxes, o, d, maxDist): number | null`

- [ ] **Step 1: Write the failing tests.**

```ts
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
```

- [ ] **Step 2: Run them and watch them fail.**
  - Run: `npx vitest run tests/core/collision.test.ts`
  - Expected: FAIL, because the module can't be resolved.

- [ ] **Step 3: Implement** `src/core/collision.ts`:

```ts
import { clamp, type Vec3 } from './vec';

export interface Box {
  min: Vec3;
  max: Vec3;
}
export const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): Box => ({
  min: { x: Math.min(x0, x1), y: Math.min(y0, y1), z: Math.min(z0, z1) },
  max: { x: Math.max(x0, x1), y: Math.max(y0, y1), z: Math.max(z0, z1) },
});

/** Highest box top under (x, z), allowing a footprint overhang of 0.6·r, at most `feetY + step`. */
export function groundHeight(boxes: Box[], x: number, z: number, r: number, feetY: number, step: number): number | null {
  const f = r * 0.6;
  let best: number | null = null;
  for (const b of boxes) {
    if (x < b.min.x - f || x > b.max.x + f || z < b.min.z - f || z > b.max.z + f) continue;
    if (b.max.y > feetY + step + 1e-9) continue;
    if (best === null || b.max.y > best) best = b.max.y;
  }
  return best;
}

/** Pushes a vertical cylinder (centre x,z, radius r, from feetY to feetY+h) out of boxes it overlaps sideways. */
export function pushOut(boxes: Box[], x: number, z: number, r: number, feetY: number, h: number, step: number): { x: number; z: number } {
  for (let iter = 0; iter < 4; iter++) {
    let moved = false;
    for (const b of boxes) {
      if (b.max.y <= feetY + step || b.min.y >= feetY + h) continue; // can step onto it, or it's overhead
      const cx = clamp(x, b.min.x, b.max.x);
      const cz = clamp(z, b.min.z, b.max.z);
      const dx = x - cx;
      const dz = z - cz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r - 1e-12) continue;
      if (d2 > 1e-12) {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        z = cz + (dz / d) * r;
      } else {
        // Centre inside the box: leave through the nearest side.
        const exits: [number, number, number][] = [
          [x - b.min.x, -1, 0],
          [b.max.x - x, 1, 0],
          [z - b.min.z, 0, -1],
          [b.max.z - z, 0, 1],
        ];
        exits.sort((a, c) => a[0] - c[0]);
        const [dist, sx, sz] = exits[0]!;
        x += sx * (dist + r);
        z += sz * (dist + r);
      }
      moved = true;
    }
    if (!moved) break;
  }
  return { x, z };
}

/** Slab test: distance along unit direction `d` to the first hit with `b`, or null. */
export function rayBox(o: Vec3, d: Vec3, b: Box, maxDist: number): number | null {
  let tmin = 0;
  let tmax = maxDist;
  for (const a of ['x', 'y', 'z'] as const) {
    if (Math.abs(d[a]) < 1e-12) {
      if (o[a] < b.min[a] || o[a] > b.max[a]) return null;
      continue;
    }
    let t1 = (b.min[a] - o[a]) / d[a];
    let t2 = (b.max[a] - o[a]) / d[a];
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return null;
  }
  return tmin;
}

export function raycast(boxes: Box[], o: Vec3, d: Vec3, maxDist: number): number | null {
  let best: number | null = null;
  for (const b of boxes) {
    const t = rayBox(o, d, b, maxDist);
    if (t !== null && (best === null || t < best)) best = t;
  }
  return best;
}
```

- [ ] **Step 4: Run them and watch them pass.**
  - Run: `npx vitest run tests/core/collision.test.ts`
  - Expected: PASS (12 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/core/collision.ts tests/core/collision.test.ts
git commit -m "feat(core): box collision — ground height, push-out, raycast"
```

---

### Task 4: The cat controller

**Files:**
- Create: `src/core/controller.ts`, `tests/core/controller.test.ts`

**Interfaces:**
- Consumes: `Box`, `groundHeight`, `pushOut`, `box` (Task 3); `Vec3`, `v3`, `approach`, `lerpAngle` (Task 1); `STEP` (Task 2).
- Produces:
  - `CAT` constants
  - `interface CatState { pos: Vec3; vel: Vec3; onGround: boolean; facing: number; coyote: number; buffer: number; lastSafe: Vec3; splash: number }`
  - `interface MoveInput { x: number; z: number; jump: boolean }` (world-space move, length ≤ 1)
  - `interface World { boxes: Box[]; waterY: number }`
  - `type CatEvent = 'jump' | 'land' | 'splash' | 'respawn'`
  - `initCat(spawn: Vec3): CatState`
  - `stepCat(s: CatState, input: MoveInput, dt: number, world: World): { state: CatState; events: CatEvent[] }`

- [ ] **Step 1: Write the failing tests.**

```ts
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

  it('a huge time step cannot tunnel through the wall (each step is one fixed STEP)', () => {
    let s = start();
    for (let i = 0; i < 5; i++) s = stepCat(s, { x: 0, z: 1, jump: false }, STEP, world).state;
    expect(s.pos.z).toBeLessThan(3);
  });
});
```

- [ ] **Step 2: Run them and watch them fail.**
  - Run: `npx vitest run tests/core/controller.test.ts`
  - Expected: FAIL, because the module can't be resolved.

- [ ] **Step 3: Implement** `src/core/controller.ts`:

```ts
import { groundHeight, pushOut, type Box } from './collision';
import { approach, lerpAngle, v3, type Vec3 } from './vec';

export const CAT = {
  radius: 0.22,
  height: 0.45,
  speed: 3.2,
  accelGround: 28,
  accelAir: 10,
  jumpV: 5.2,
  gravity: -15,
  maxFall: -18,
  step: 0.22,
  coyote: 0.1,
  buffer: 0.12,
  splashTime: 0.7,
  /** Feet this far under the water surface count as "fallen in". */
  sink: 0.15,
} as const;

export interface CatState {
  pos: Vec3;
  vel: Vec3;
  onGround: boolean;
  facing: number;
  coyote: number;
  buffer: number;
  lastSafe: Vec3;
  splash: number;
}
export interface MoveInput {
  x: number;
  z: number;
  jump: boolean;
}
export interface World {
  boxes: Box[];
  waterY: number;
}
export type CatEvent = 'jump' | 'land' | 'splash' | 'respawn';

export const initCat = (spawn: Vec3): CatState => ({ pos: { ...spawn }, vel: v3(), onGround: false, facing: 0, coyote: 0, buffer: 0, lastSafe: { ...spawn }, splash: 0 });

export function stepCat(s: CatState, input: MoveInput, dt: number, world: World): { state: CatState; events: CatEvent[] } {
  const events: CatEvent[] = [];
  if (s.splash > 0) {
    const left = s.splash - dt;
    if (left > 0) return { state: { ...s, splash: left }, events };
    events.push('respawn');
    return { state: { ...s, pos: { ...s.lastSafe }, vel: v3(), onGround: true, splash: 0, coyote: 0, buffer: 0 }, events };
  }

  let mx = input.x;
  let mz = input.z;
  const len = Math.hypot(mx, mz);
  if (len > 1) {
    mx /= len;
    mz /= len;
  }
  const vel = { ...s.vel };
  const accel = s.onGround ? CAT.accelGround : CAT.accelAir;
  vel.x = approach(vel.x, mx * CAT.speed, accel * dt);
  vel.z = approach(vel.z, mz * CAT.speed, accel * dt);
  const hs = Math.hypot(vel.x, vel.z);
  if (hs > CAT.speed) {
    vel.x *= CAT.speed / hs;
    vel.z *= CAT.speed / hs;
  }
  const facing = len > 0.1 ? lerpAngle(s.facing, Math.atan2(mx, mz), Math.min(1, dt * 12)) : s.facing;

  let coyote = s.onGround ? CAT.coyote : Math.max(0, s.coyote - dt);
  let buffer = input.jump ? CAT.buffer : Math.max(0, s.buffer - dt);
  let onGround = s.onGround;
  if (buffer > 0 && coyote > 0) {
    vel.y = CAT.jumpV;
    buffer = 0;
    coyote = 0;
    onGround = false;
    events.push('jump');
  }
  vel.y = Math.max(CAT.maxFall, vel.y + CAT.gravity * dt);

  // Horizontal move, then slide along walls.
  const tx = s.pos.x + vel.x * dt;
  const tz = s.pos.z + vel.z * dt;
  const p = pushOut(world.boxes, tx, tz, CAT.radius, s.pos.y, CAT.height, CAT.step);
  if (Math.abs(p.x - tx) > 1e-9) vel.x = 0;
  if (Math.abs(p.z - tz) > 1e-9) vel.z = 0;

  // Vertical move: ceilings, then ground (including step-ups and small step-downs).
  let ny = s.pos.y + vel.y * dt;
  if (vel.y > 0) {
    for (const b of world.boxes) {
      const over = p.x > b.min.x - CAT.radius * 0.6 && p.x < b.max.x + CAT.radius * 0.6 && p.z > b.min.z - CAT.radius * 0.6 && p.z < b.max.z + CAT.radius * 0.6;
      if (over && b.min.y >= s.pos.y + CAT.height - 1e-9 && b.min.y < ny + CAT.height) {
        ny = b.min.y - CAT.height;
        vel.y = 0;
      }
    }
  }
  const g = groundHeight(world.boxes, p.x, p.z, CAT.radius, s.pos.y, CAT.step);
  const wasGround = s.onGround;
  if (vel.y <= 0 && g !== null && (ny <= g || (wasGround && s.pos.y - g <= CAT.step))) {
    ny = g;
    vel.y = 0;
    onGround = true;
    if (!wasGround) events.push('land');
  } else {
    onGround = false;
  }

  const pos = { x: p.x, y: ny, z: p.z };
  let lastSafe = s.lastSafe;
  if (onGround && ny > world.waterY + 0.05 && groundHeight(world.boxes, p.x, p.z, 0, ny, 1e-6) === ny) lastSafe = { ...pos };

  if (pos.y < world.waterY - CAT.sink) {
    events.push('splash');
    return { state: { pos, vel: v3(), onGround: false, facing, coyote: 0, buffer: 0, lastSafe, splash: CAT.splashTime }, events };
  }
  return { state: { pos, vel, onGround, facing, coyote, buffer, lastSafe, splash: 0 }, events };
}
```

- [ ] **Step 4: Run them and watch them pass.**
  - Run: `npx vitest run tests/core/controller.test.ts`
  - Expected: PASS (10 tests). If a numeric threshold fails by a hair (for example the jump peak), check the constants against the test's comment before changing either. Ledger any change.

- [ ] **Step 5: Run the whole suite.**
  - Run: `npx vitest run`
  - Expected: all pass.

- [ ] **Step 6: Commit.**

```bash
git add src/core/controller.ts tests/core/controller.test.ts
git commit -m "feat(core): cat controller — walk, jump with coyote/buffer, step-up, walls, splash and respawn"
```

---

### Task 5: Input mapping

**Files:**
- Create: `src/core/input.ts`, `tests/core/input.test.ts`

**Interfaces:**
- Produces:
  - `keysToAxes(keys: ReadonlySet<string>): { ix: number; iz: number }`
  - `joystickAxes(dx, dy, radius, dead?): { ix: number; iz: number }`
  - `class KeyboardInput { constructor(target?: EventTarget); axes(); consumeJump(): boolean; destroy() }`

- [ ] **Step 1: Write the failing tests.**

```ts
// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { joystickAxes, KeyboardInput, keysToAxes } from '../../src/core/input';

describe('keysToAxes', () => {
  it('maps WASD and arrows', () => {
    expect(keysToAxes(new Set(['KeyW']))).toEqual({ ix: 0, iz: 1 });
    expect(keysToAxes(new Set(['ArrowLeft']))).toEqual({ ix: -1, iz: 0 });
  });
  it('normalises diagonals', () => {
    const a = keysToAxes(new Set(['KeyW', 'KeyD']));
    expect(Math.hypot(a.ix, a.iz)).toBeCloseTo(1, 6);
  });
  it('opposite keys cancel', () => expect(keysToAxes(new Set(['KeyA', 'KeyD']))).toEqual({ ix: 0, iz: 0 }));
});

describe('joystickAxes', () => {
  it('drag up is forward; length clamps to 1', () => {
    const a = joystickAxes(0, -200, 60);
    expect(a.ix).toBeCloseTo(0, 6);
    expect(a.iz).toBeCloseTo(1, 6);
  });
  it('small drags inside the dead zone are ignored', () => expect(joystickAxes(3, 2, 60)).toEqual({ ix: 0, iz: 0 }));
  it('half drag gives a partial move', () => {
    const a = joystickAxes(30, 0, 60);
    expect(a.ix).toBeGreaterThan(0.3);
    expect(a.ix).toBeLessThan(0.7);
  });
});

describe('KeyboardInput', () => {
  it('tracks held keys, queues one jump per press, and clears on blur', () => {
    const kb = new KeyboardInput(window);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    expect(kb.axes()).toEqual({ ix: 0, iz: 1 });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', repeat: true }));
    expect(kb.consumeJump()).toBe(true);
    expect(kb.consumeJump()).toBe(false);
    window.dispatchEvent(new Event('blur'));
    expect(kb.axes()).toEqual({ ix: 0, iz: 0 });
    kb.destroy();
  });
});
```

- [ ] **Step 2: Run them and watch them fail.**
  - Run: `npx vitest run tests/core/input.test.ts`
  - Expected: FAIL, because the module can't be resolved.

- [ ] **Step 3: Implement** `src/core/input.ts`:

```ts
const FWD = ['KeyW', 'ArrowUp'];
const BACK = ['KeyS', 'ArrowDown'];
const LEFT = ['KeyA', 'ArrowLeft'];
const RIGHT = ['KeyD', 'ArrowRight'];
const has = (keys: ReadonlySet<string>, list: string[]) => list.some((k) => keys.has(k));

export function keysToAxes(keys: ReadonlySet<string>): { ix: number; iz: number } {
  let ix = (has(keys, RIGHT) ? 1 : 0) - (has(keys, LEFT) ? 1 : 0);
  let iz = (has(keys, FWD) ? 1 : 0) - (has(keys, BACK) ? 1 : 0);
  const l = Math.hypot(ix, iz);
  if (l > 1) {
    ix /= l;
    iz /= l;
  }
  return { ix, iz };
}

/** Screen drag (dx right, dy down, in px) to move axes. Up is forward. A dead zone and a clamp to 1 apply. */
export function joystickAxes(dx: number, dy: number, radius: number, dead = 0.15): { ix: number; iz: number } {
  const x = dx / radius;
  const y = dy / radius;
  const l = Math.hypot(x, y);
  if (l < dead) return { ix: 0, iz: 0 };
  const m = (Math.min(1, l) - dead) / (1 - dead);
  return { ix: (x / l) * m, iz: (-y / l) * m };
}

export class KeyboardInput {
  private readonly keys = new Set<string>();
  private jump = false;
  private readonly onDown = (e: Event) => {
    const k = e as KeyboardEvent;
    if (k.code === 'Space') {
      if (!k.repeat) this.jump = true;
      k.preventDefault?.();
      return;
    }
    if ([...FWD, ...BACK, ...LEFT, ...RIGHT].includes(k.code)) {
      this.keys.add(k.code);
      k.preventDefault?.();
    }
  };
  private readonly onUp = (e: Event) => void this.keys.delete((e as KeyboardEvent).code);
  private readonly onBlur = () => this.keys.clear();

  constructor(private readonly target: EventTarget = window) {
    target.addEventListener('keydown', this.onDown);
    target.addEventListener('keyup', this.onUp);
    target.addEventListener('blur', this.onBlur);
  }
  axes(): { ix: number; iz: number } {
    return keysToAxes(this.keys);
  }
  consumeJump(): boolean {
    const j = this.jump;
    this.jump = false;
    return j;
  }
  destroy(): void {
    this.target.removeEventListener('keydown', this.onDown);
    this.target.removeEventListener('keyup', this.onUp);
    this.target.removeEventListener('blur', this.onBlur);
  }
}
```

- [ ] **Step 4: Run them and watch them pass.**
  - Run: `npx vitest run tests/core/input.test.ts`
  - Expected: PASS (7 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/core/input.ts tests/core/input.test.ts
git commit -m "feat(core): keyboard and joystick input mapping"
```

---

### Task 6: Follow camera maths

**Files:**
- Create: `src/core/camera.ts`, `tests/core/camera.test.ts`

**Interfaces:**
- Consumes: `Vec3`, `v3`, `clamp`, `damp` (Task 1); `Box`, `raycast`, `box` (Task 3).
- Produces:
  - `CAM` constants
  - `interface CamState { yaw: number; pitch: number; target: Vec3; pos: Vec3 }`
  - `initCam(follow: Vec3): CamState`
  - `orbitPosition(target: Vec3, yaw, pitch, dist): Vec3`
  - `stepCamera(c: CamState, follow: Vec3, look: { dx: number; dy: number }, opts: { sensitivity: number; reduceMotion: boolean; time: number }, dt: number, boxes: Box[]): { state: CamState; eye: Vec3; lookAt: Vec3 }`
  - `toWorldMove(ix, iz, yaw): { x: number; z: number }`

- [ ] **Step 1: Write the failing tests.**

```ts
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
```

- [ ] **Step 2: Run them and watch them fail.**
  - Run: `npx vitest run tests/core/camera.test.ts`
  - Expected: FAIL, because the module can't be resolved.

- [ ] **Step 3: Implement** `src/core/camera.ts`:

```ts
import { raycast, type Box } from './collision';
import { clamp, damp, v3, type Vec3 } from './vec';

export const CAM = { dist: 4.2, minDist: 0.8, minPitch: 0.06, maxPitch: 1.15, height: 0.35, margin: 0.25, follow: 10, settle: 8, startPitch: 0.32 } as const;

export interface CamState {
  yaw: number;
  pitch: number;
  target: Vec3;
  pos: Vec3;
}

export function orbitPosition(t: Vec3, yaw: number, pitch: number, dist: number): Vec3 {
  return { x: t.x + Math.sin(yaw) * Math.cos(pitch) * dist, y: t.y + Math.sin(pitch) * dist, z: t.z + Math.cos(yaw) * Math.cos(pitch) * dist };
}

export function initCam(follow: Vec3): CamState {
  const target = { x: follow.x, y: follow.y + CAM.height, z: follow.z };
  return { yaw: 0, pitch: CAM.startPitch, target, pos: orbitPosition(target, 0, CAM.startPitch, CAM.dist) };
}

/** Joystick/keys (ix right, iz forward) to a world-space XZ move for the current camera yaw. */
export function toWorldMove(ix: number, iz: number, yaw: number): { x: number; z: number } {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  return { x: rx * ix + fx * iz, z: rz * ix + fz * iz };
}

export function stepCamera(
  c: CamState,
  follow: Vec3,
  look: { dx: number; dy: number },
  opts: { sensitivity: number; reduceMotion: boolean; time: number },
  dt: number,
  boxes: Box[],
): { state: CamState; eye: Vec3; lookAt: Vec3 } {
  const yaw = c.yaw - look.dx * opts.sensitivity;
  const pitch = clamp(c.pitch + look.dy * opts.sensitivity, CAM.minPitch, CAM.maxPitch);
  const want = { x: follow.x, y: follow.y + CAM.height, z: follow.z };
  const target = { x: damp(c.target.x, want.x, CAM.follow, dt), y: damp(c.target.y, want.y, CAM.follow, dt), z: damp(c.target.z, want.z, CAM.follow, dt) };

  const ideal = orbitPosition(target, yaw, pitch, CAM.dist);
  const dir = { x: ideal.x - target.x, y: ideal.y - target.y, z: ideal.z - target.z };
  const len = Math.hypot(dir.x, dir.y, dir.z);
  const unit = { x: dir.x / len, y: dir.y / len, z: dir.z / len };
  const hit = raycast(boxes, target, unit, CAM.dist);
  const dist = hit === null ? CAM.dist : Math.max(CAM.minDist, hit - CAM.margin);
  const desired = orbitPosition(target, yaw, pitch, dist);

  const curDist = Math.hypot(c.pos.x - target.x, c.pos.y - target.y, c.pos.z - target.z);
  // Snap inward immediately when something blocks the view; ease outward smoothly.
  const pos =
    dist < curDist - 1e-6
      ? desired
      : { x: damp(c.pos.x, desired.x, CAM.settle, dt), y: damp(c.pos.y, desired.y, CAM.settle, dt), z: damp(c.pos.z, desired.z, CAM.settle, dt) };

  const sway = opts.reduceMotion ? v3() : v3(Math.sin(opts.time * 0.6) * 0.04, Math.sin(opts.time * 0.83 + 1.3) * 0.03, 0);
  const state = { yaw, pitch, target, pos };
  return { state, eye: { x: pos.x + sway.x, y: pos.y + sway.y, z: pos.z + sway.z }, lookAt: target };
}
```

- [ ] **Step 4: Run them and watch them pass.**
  - Run: `npx vitest run tests/core/camera.test.ts`
  - Expected: PASS (5 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/core/camera.ts tests/core/camera.test.ts
git commit -m "feat(core): follow camera — orbit, look, wall avoidance, gentle sway"
```

---

### Task 7: Quality levels, waves and cat pose (pure)

**Files:**
- Create: `src/core/quality.ts`, `src/core/waves.ts`, `src/core/catPose.ts`, `tests/core/quality.test.ts`, `tests/core/waves-pose.test.ts`

**Interfaces:**
- Consumes: `CAT` (Task 4); `clamp` (Task 1).
- Produces:
  - `type Quality = 'low' | 'medium' | 'high'`
  - `interface QualitySettings { pixelRatioCap: number; waterSegments: number; foam: boolean; fogFar: number; grain: boolean }`
  - `QUALITY: Record<Quality, QualitySettings>`
  - `initialQuality(d: { coarsePointer: boolean; cores: number; memoryGB?: number }): Quality`
  - `class QualityGovernor { level: Quality; constructor(level: Quality, window?: number); push(frameMs: number): Quality | null }`
  - `waveHeight(x, z, t): number` (`WAVE` constants mirrored in GLSL)
  - `interface CatPose { legFL: number; legFR: number; legBL: number; legBR: number; bob: number; tail: number; tuck: number }`
  - `catPose(m: { speed: number; onGround: boolean; vy: number; t: number; splash: boolean }): CatPose`

- [ ] **Step 1: Write the failing tests.**

`tests/core/quality.test.ts`:
```ts
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
```

`tests/core/waves-pose.test.ts`:
```ts
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
```

- [ ] **Step 2: Run them and watch them fail.**
  - Run: `npx vitest run tests/core/quality.test.ts tests/core/waves-pose.test.ts`
  - Expected: FAIL, because the modules can't be resolved.

- [ ] **Step 3: Implement.**

`src/core/quality.ts`:
```ts
export type Quality = 'low' | 'medium' | 'high';
export interface QualitySettings {
  pixelRatioCap: number;
  waterSegments: number;
  foam: boolean;
  fogFar: number;
  grain: boolean;
}
export const QUALITY: Record<Quality, QualitySettings> = {
  low: { pixelRatioCap: 1.25, waterSegments: 48, foam: false, fogFar: 38, grain: false },
  medium: { pixelRatioCap: 1.6, waterSegments: 96, foam: true, fogFar: 55, grain: true },
  high: { pixelRatioCap: 2, waterSegments: 160, foam: true, fogFar: 70, grain: true },
};
const ORDER: Quality[] = ['low', 'medium', 'high'];

export function initialQuality(d: { coarsePointer: boolean; cores: number; memoryGB?: number }): Quality {
  if (d.coarsePointer) return d.cores <= 4 || (d.memoryGB ?? 4) <= 3 ? 'low' : 'medium';
  return d.cores <= 2 ? 'medium' : 'high';
}

/** Watches frame times: steps down when slow; steps up only if it has never stepped down (no flip-flopping). */
export class QualityGovernor {
  private samples: number[] = [];
  private fastWindows = 0;
  private downgraded = false;
  constructor(
    public level: Quality,
    private readonly window = 90,
  ) {}
  push(frameMs: number): Quality | null {
    this.samples.push(frameMs);
    if (this.samples.length < this.window) return null;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    this.samples = [];
    const i = ORDER.indexOf(this.level);
    if (avg > 24 && i > 0) {
      this.level = ORDER[i - 1]!;
      this.downgraded = true;
      this.fastWindows = 0;
      return this.level;
    }
    if (avg < 13 && !this.downgraded && i < 2) {
      this.fastWindows++;
      if (this.fastWindows >= 3) {
        this.fastWindows = 0;
        this.level = ORDER[i + 1]!;
        return this.level;
      }
    } else this.fastWindows = 0;
    return null;
  }
}
```

`src/core/waves.ts`:
```ts
/** Keep in sync with WAVE_GLSL in src/render/water.ts. */
export const WAVE = { a1: 0.06, k1: 0.9, w1: 1.1, a2: 0.04, k2: 1.3, w2: 0.8, a3: 0.025, k3: 2.1, w3: 1.7 } as const;
export function waveHeight(x: number, z: number, t: number): number {
  return WAVE.a1 * Math.sin(x * WAVE.k1 + t * WAVE.w1) + WAVE.a2 * Math.sin(z * WAVE.k2 - t * WAVE.w2) + WAVE.a3 * Math.sin((x + z) * WAVE.k3 + t * WAVE.w3);
}
```

`src/core/catPose.ts`:
```ts
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
```

- [ ] **Step 4: Run them and watch them pass.**
  - Run: `npx vitest run`
  - Expected: all pass.

- [ ] **Step 5: Commit.**

```bash
git add src/core/quality.ts src/core/waves.ts src/core/catPose.ts tests/core/quality.test.ts tests/core/waves-pose.test.ts
git commit -m "feat(core): quality levels and governor, wave height, cat pose"
```

---

### Task 8: Test island content and the painterly world (render)

**Files:**
- Create: `src/content/testIsland.ts`, `src/render/look.ts`, `src/render/painterly.ts`, `src/render/sky.ts`, `src/render/world.ts`, `tests/content/testIsland.test.ts`

**Interfaces:**
- Consumes: `box`, `Box` (Task 3); `World`, `CAT` (Task 4); `QualitySettings` (Task 7).
- Produces:
  - `interface LevelBox extends Box { color: string }`
  - `interface Level { spawn: Vec3; waterY: number; boxes: LevelBox[] }`
  - `TEST_ISLAND: Level`
  - `LOOK`, `uniforms`
  - `painterlyMaterial(color: string): THREE.ShaderMaterial`
  - `createSky(): THREE.Mesh`
  - `buildWorld(level: Level): THREE.Group`
  - `createBlobShadow(): THREE.Mesh`
  - `createSplashRing(): { mesh: THREE.Mesh; play(at: Vec3): void; update(dt: number): void }`

- [ ] **Step 1: Write the failing content test.** Rendering is verified in the browser in Task 13; the level data is tested here.

```ts
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
```

- [ ] **Step 2: Run it and watch it fail.**
  - Run: `npx vitest run tests/content/testIsland.test.ts`
  - Expected: FAIL, because the module can't be resolved.

- [ ] **Step 3: Implement the content** in `src/content/testIsland.ts`:

```ts
import { box, type Box } from '../core/collision';
import { v3, type Vec3 } from '../core/vec';

export interface LevelBox extends Box {
  color: string;
}
export interface Level {
  spawn: Vec3;
  waterY: number;
  boxes: LevelBox[];
}
const lb = (color: string, ...c: [number, number, number, number, number, number]): LevelBox => ({ ...box(...c), color });

/** M1 test island: a grassy main island, steps up to a lookout, a ruined wall and pillars, and stepping stones out to an islet. */
export const TEST_ISLAND: Level = {
  spawn: v3(0, 0.6, 1),
  waterY: 0.3,
  boxes: [
    lb('#8f9d63', -6, -2, -6, 6, 0.6, 6), // main island (grass)
    lb('#a58a66', 2, 0.6, -1, 3, 0.9, 0), // step 1
    lb('#a58a66', 3, 0.6, -1, 4, 1.2, 0), // step 2
    lb('#b5a58c', 4, 0.6, -2, 5.5, 1.6, 1), // lookout
    lb('#c9b79c', -4, 0.6, -4, -2, 1.8, -3.6), // ruined wall
    lb('#c9b79c', -4, 0.6, -3.6, -3.6, 1.2, -2), // broken wall end
    lb('#9c8f80', 7.4, -1.5, 0, 8.6, 0.55, 1.2), // stepping stone 1
    lb('#9c8f80', 9.8, -1.5, 0.3, 11, 0.75, 1.5), // stepping stone 2
    lb('#9c8f80', 12.2, -1.5, 0, 13.4, 0.95, 1.2), // stepping stone 3
    lb('#8f9d63', 14.6, -2, -2, 19, 1.1, 3), // islet
    lb('#b8ad9c', -9, -3, 3, -8, 3.2, 4), // pillar (ruin)
    lb('#b8ad9c', -12, -3, -6, -10.5, 5, -4.5), // tall pillar (ruin)
    lb('#b8ad9c', 16, 1.1, -1.5, 17, 3.4, -0.5), // islet column
  ],
};
```

- [ ] **Step 4: Run it and watch it pass.**
  - Run: `npx vitest run tests/content/testIsland.test.ts`
  - Expected: PASS (3 tests). If the stepping-stone rule fails, fix the data, not the test.

- [ ] **Step 5: Implement the rendering modules.**

`src/render/look.ts`:
```ts
import * as THREE from 'three';

/** One palette and light for the whole scene: warm afternoon. */
export const LOOK = {
  skyTop: new THREE.Color('#f1c28e'),
  skyHorizon: new THREE.Color('#ead8bf'),
  skyBottom: new THREE.Color('#9fb8b6'),
  sun: new THREE.Color('#fff2d6'),
  light: new THREE.Color('#ffe0b5'),
  ambient: new THREE.Color('#71808a'),
  rim: new THREE.Color('#ffd6a0'),
  waterDeep: new THREE.Color('#2f5d66'),
  waterShallow: new THREE.Color('#7fa8a6'),
  foam: new THREE.Color('#f6efe1'),
  lightDir: new THREE.Vector3(-0.55, 0.72, 0.42).normalize(),
};

/** Shared by every material, so lighting and fog change everywhere at once. */
export const uniforms = {
  uLightDir: { value: LOOK.lightDir },
  uLightColor: { value: LOOK.light },
  uAmbient: { value: LOOK.ambient },
  uRim: { value: LOOK.rim },
  uFogColor: { value: LOOK.skyHorizon },
  uFogNear: { value: 10 },
  uFogFar: { value: 70 },
  uGrain: { value: 1 },
  uTime: { value: 0 },
};
```

`src/render/painterly.ts`:
```ts
import * as THREE from 'three';
import { uniforms } from './look';

const VERT = /* glsl */ `
varying vec3 vN; varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor, uLightDir, uLightColor, uAmbient, uRim, uFogColor;
uniform float uFogNear, uFogFar, uGrain;
varying vec3 vN; varying vec3 vW;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(cameraPosition - vW);
  float ndl = dot(n, uLightDir);
  float wrap = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
  float ramp = mix(wrap, floor(wrap * 4.0) / 4.0, 0.45);   // painted colour steps
  vec3 col = uColor * (uAmbient + uLightColor * ramp);
  float rim = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0) * smoothstep(-0.2, 0.6, ndl);
  col += uRim * rim * 0.35;
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.035 * uGrain;  // hand-made grain
  float f = smoothstep(uFogNear, uFogFar, length(cameraPosition - vW));
  gl_FragColor = vec4(mix(col, uFogColor, f), 1.0);
  #include <colorspace_fragment>
}`;

export function painterlyMaterial(color: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ uniforms: { ...uniforms, uColor: { value: new THREE.Color(color) } }, vertexShader: VERT, fragmentShader: FRAG });
}
```

`src/render/sky.ts`:
```ts
import * as THREE from 'three';
import { LOOK } from './look';

/** A large dome that follows the camera: horizon to top gradient, plus a soft sun glow. */
export function createSky(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uTop: { value: LOOK.skyTop }, uHorizon: { value: LOOK.skyHorizon }, uBottom: { value: LOOK.skyBottom }, uSun: { value: LOOK.sun }, uLightDir: { value: LOOK.lightDir } },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uHorizon, uBottom, uSun, uLightDir; varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 col = h > 0.0 ? mix(uHorizon, uTop, pow(h, 0.6)) : mix(uHorizon, uBottom, pow(-h, 0.5));
        float s = max(dot(vDir, normalize(uLightDir)), 0.0);
        col += uSun * (pow(s, 64.0) * 0.9 + pow(s, 6.0) * 0.25);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  return sky;
}
```

`src/render/world.ts`:
```ts
import * as THREE from 'three';
import type { Level } from '../content/testIsland';
import type { Vec3 } from '../core/vec';
import { painterlyMaterial } from './painterly';

export function buildWorld(level: Level): THREE.Group {
  const g = new THREE.Group();
  const cache = new Map<string, THREE.ShaderMaterial>();
  for (const b of level.boxes) {
    const mat = cache.get(b.color) ?? painterlyMaterial(b.color);
    cache.set(b.color, mat);
    const size = new THREE.Vector3(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
    m.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
    g.add(m);
  }
  return g;
}

/** A soft dark disc under the cat (cheaper than real shadows; works on every device). */
export function createBlobShadow(): THREE.Mesh {
  const tex = new THREE.CanvasTexture(
    (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d')!;
      const grd = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
      grd.addColorStop(0, 'rgba(30,25,20,0.55)');
      grd.addColorStop(1, 'rgba(30,25,20,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 64, 64);
      return c;
    })(),
  );
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** An expanding ring on the water when Meascat falls in. */
export function createSplashRing(): { mesh: THREE.Mesh; play(at: Vec3): void; update(dt: number): void } {
  const mat = new THREE.MeshBasicMaterial({ color: '#f6efe1', transparent: true, opacity: 0, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.32, 32), mat);
  mesh.rotation.x = -Math.PI / 2;
  let t = 1;
  return {
    mesh,
    play(at) {
      mesh.position.set(at.x, at.y + 0.02, at.z);
      t = 0;
    },
    update(dt) {
      t = Math.min(1, t + dt / 0.8);
      const s = 1 + t * 3;
      mesh.scale.set(s, s, s);
      mat.opacity = 0.8 * (1 - t);
    },
  };
}
```

- [ ] **Step 6: Type check.**
  - Run: `npx tsc --noEmit && npx vitest run`
  - Expected: no type errors, and all tests pass.

- [ ] **Step 7: Commit.**

```bash
git add src/content src/render tests/content
git commit -m "feat(render): painterly material, sky dome, world from level boxes, blob shadow, splash ring; test island"
```

---

### Task 9: Touch controls

**Files:**
- Create: `src/ui/touch.ts`, `src/ui/styles.css`, `tests/ui/touch.test.ts`

**Interfaces:**
- Consumes: `joystickAxes` (Task 5).
- Produces:
  - `class TouchControls { constructor(root: HTMLElement); axes(): { ix: number; iz: number }; consumeLook(): { dx: number; dy: number }; consumeJump(): boolean; destroy(): void }`
  - DOM: `.touch-ui`, `.touch-left`, `.touch-right`, `.touch-jump`, `.touch-knob`

- [ ] **Step 1: Write the failing tests.**

```ts
// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import { TouchControls } from '../../src/ui/touch';

let root: HTMLElement;
const fire = (el: Element, type: string, id: number, x: number, y: number) => el.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true }));
beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.getElementById('app')!;
});

describe('TouchControls', () => {
  it('a drag in the left zone moves; lifting the finger resets', () => {
    const t = new TouchControls(root);
    const left = root.querySelector('.touch-left')!;
    fire(left, 'pointerdown', 1, 100, 400);
    fire(left, 'pointermove', 1, 100, 340);
    expect(t.axes().iz).toBeGreaterThan(0.9);
    fire(left, 'pointerup', 1, 100, 340);
    expect(t.axes()).toEqual({ ix: 0, iz: 0 });
  });
  it('a cancelled touch also resets', () => {
    const t = new TouchControls(root);
    const left = root.querySelector('.touch-left')!;
    fire(left, 'pointerdown', 1, 100, 400);
    fire(left, 'pointermove', 1, 160, 400);
    fire(left, 'pointercancel', 1, 160, 400);
    expect(t.axes()).toEqual({ ix: 0, iz: 0 });
  });
  it('a second finger in the left zone does not take over the joystick', () => {
    const t = new TouchControls(root);
    const left = root.querySelector('.touch-left')!;
    fire(left, 'pointerdown', 1, 100, 400);
    fire(left, 'pointermove', 1, 100, 340);
    fire(left, 'pointerdown', 2, 50, 450);
    fire(left, 'pointermove', 2, 0, 500);
    expect(t.axes().iz).toBeGreaterThan(0.9);
  });
  it('look drags accumulate while the joystick is held; Jump queues once', () => {
    const t = new TouchControls(root);
    const left = root.querySelector('.touch-left')!;
    const right = root.querySelector('.touch-right')!;
    fire(left, 'pointerdown', 1, 100, 400);
    fire(right, 'pointerdown', 2, 600, 400);
    fire(right, 'pointermove', 2, 630, 390);
    expect(t.consumeLook()).toEqual({ dx: 30, dy: -10 });
    expect(t.consumeLook()).toEqual({ dx: 0, dy: 0 });
    root.querySelector('.touch-jump')!.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 3, bubbles: true }));
    expect(t.consumeJump()).toBe(true);
    expect(t.consumeJump()).toBe(false);
  });
  it('destroy removes its elements', () => {
    new TouchControls(root).destroy();
    expect(root.querySelector('.touch-ui')).toBeNull();
  });
});
```

- [ ] **Step 2: Run them and watch them fail.**
  - Run: `npx vitest run tests/ui/touch.test.ts`
  - Expected: FAIL, because the module can't be resolved.

- [ ] **Step 3: Implement** `src/ui/touch.ts`:

```ts
import { joystickAxes } from '../core/input';

const RADIUS = 60;

/** Left half: a floating joystick. Right half: drag to look. Bottom-right: Jump. One finger owns each zone. */
export class TouchControls {
  private readonly el: HTMLElement;
  private readonly knob: HTMLElement;
  private joyId: number | null = null;
  private joyStart = { x: 0, y: 0 };
  private joy = { ix: 0, iz: 0 };
  private lookId: number | null = null;
  private lookLast = { x: 0, y: 0 };
  private look = { dx: 0, dy: 0 };
  private jump = false;

  constructor(root: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'touch-ui';
    this.el.innerHTML = '<div class="touch-left"><div class="touch-knob" hidden></div></div><div class="touch-right"></div><button class="touch-jump" aria-label="Jump"></button>';
    root.appendChild(this.el);
    this.knob = this.el.querySelector('.touch-knob')!;
    const left = this.el.querySelector('.touch-left')!;
    const right = this.el.querySelector('.touch-right')!;
    left.addEventListener('pointerdown', (e) => this.joyDown(e as PointerEvent));
    left.addEventListener('pointermove', (e) => this.joyMove(e as PointerEvent));
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) left.addEventListener(t, (e) => this.joyEnd(e as PointerEvent));
    right.addEventListener('pointerdown', (e) => {
      const p = e as PointerEvent;
      if (this.lookId !== null) return;
      this.lookId = p.pointerId;
      this.lookLast = { x: p.clientX, y: p.clientY };
    });
    right.addEventListener('pointermove', (e) => {
      const p = e as PointerEvent;
      if (p.pointerId !== this.lookId) return;
      this.look.dx += p.clientX - this.lookLast.x;
      this.look.dy += p.clientY - this.lookLast.y;
      this.lookLast = { x: p.clientX, y: p.clientY };
    });
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture'])
      right.addEventListener(t, (e) => {
        if ((e as PointerEvent).pointerId === this.lookId) this.lookId = null;
      });
    this.el.querySelector('.touch-jump')!.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.jump = true;
    });
  }

  private joyDown(p: PointerEvent): void {
    if (this.joyId !== null) return;
    this.joyId = p.pointerId;
    this.joyStart = { x: p.clientX, y: p.clientY };
    this.knob.hidden = false;
    this.knob.style.transform = `translate(${p.clientX}px, ${p.clientY}px)`;
  }
  private joyMove(p: PointerEvent): void {
    if (p.pointerId !== this.joyId) return;
    this.joy = joystickAxes(p.clientX - this.joyStart.x, p.clientY - this.joyStart.y, RADIUS);
  }
  private joyEnd(p: PointerEvent): void {
    if (p.pointerId !== this.joyId) return;
    this.joyId = null;
    this.joy = { ix: 0, iz: 0 };
    this.knob.hidden = true;
  }
  axes(): { ix: number; iz: number } {
    return { ...this.joy };
  }
  consumeLook(): { dx: number; dy: number } {
    const l = this.look;
    this.look = { dx: 0, dy: 0 };
    return l;
  }
  consumeJump(): boolean {
    const j = this.jump;
    this.jump = false;
    return j;
  }
  destroy(): void {
    this.el.remove();
  }
}
```

`src/ui/styles.css`:
```css
.touch-ui { position: fixed; inset: 0; pointer-events: none; z-index: 2; }
.touch-left, .touch-right { position: absolute; top: 0; bottom: 0; pointer-events: auto; touch-action: none; }
.touch-left { left: 0; width: 50%; }
.touch-right { right: 0; width: 50%; }
.touch-knob { position: absolute; left: -36px; top: -36px; width: 72px; height: 72px; border-radius: 50%; background: rgba(255, 248, 235, 0.25); border: 2px solid rgba(255, 248, 235, 0.55); pointer-events: none; }
.touch-jump { position: absolute; right: max(20px, env(safe-area-inset-right)); bottom: max(24px, env(safe-area-inset-bottom)); width: 72px; height: 72px; border-radius: 50%; border: 2px solid rgba(255, 248, 235, 0.6); background: rgba(255, 248, 235, 0.22) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' fill='none' stroke='%23fff8eb' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 20l8-8 8 8'/%3E%3C/svg%3E") center / 36px no-repeat; pointer-events: auto; touch-action: none; }
.debug-overlay { position: fixed; left: 8px; top: 8px; z-index: 3; font: 12px/1.3 ui-monospace, monospace; color: #2b2b2b; background: rgba(255, 255, 255, 0.7); padding: 4px 6px; border-radius: 6px; pointer-events: none; }
```

- [ ] **Step 4: Run them and watch them pass.**
  - Run: `npx vitest run tests/ui/touch.test.ts`
  - Expected: PASS (5 tests).

- [ ] **Step 5: Commit.**

```bash
git add src/ui tests/ui
git commit -m "feat(ui): touch controls — floating joystick, look pad, jump"
```

---

### Task 10: The water and Meascat's model (render)

**Files:**
- Create: `src/render/water.ts`, `src/render/catModel.ts`

**Interfaces:**
- Consumes: `WAVE` (Task 7); `uniforms`, `LOOK`, `painterlyMaterial` (Task 8); `CatPose` (Task 7); `QualitySettings` (Task 7).
- Produces:
  - `createWater(waterY: number, q: QualitySettings): { mesh: THREE.Mesh; depthTarget: THREE.WebGLRenderTarget | null; resize(w: number, h: number, pr: number): void; setFoam(on: boolean, w: number, h: number, pr: number): void; setCamera(cam: THREE.PerspectiveCamera): void }`
  - `buildCat(): { root: THREE.Group; apply(p: CatPose): void }`

- [ ] **Step 1: Implement** `src/render/water.ts`. Its wave formula must mirror `WAVE` in `src/core/waves.ts`.

```ts
import * as THREE from 'three';
import type { QualitySettings } from '../core/quality';
import { WAVE } from '../core/waves';
import { LOOK, uniforms } from './look';

const WAVE_GLSL = /* glsl */ `
float waveH(vec2 p, float t) {
  return ${WAVE.a1.toFixed(4)} * sin(p.x * ${WAVE.k1.toFixed(4)} + t * ${WAVE.w1.toFixed(4)})
       + ${WAVE.a2.toFixed(4)} * sin(p.y * ${WAVE.k2.toFixed(4)} - t * ${WAVE.w2.toFixed(4)})
       + ${WAVE.a3.toFixed(4)} * sin((p.x + p.y) * ${WAVE.k3.toFixed(4)} + t * ${WAVE.w3.toFixed(4)});
}`;

export function createWater(waterY: number, q: QualitySettings) {
  const local = {
    uDeep: { value: LOOK.waterDeep },
    uShallow: { value: LOOK.waterShallow },
    uSky: { value: LOOK.skyHorizon },
    uFoamColor: { value: LOOK.foam },
    uSun: { value: LOOK.sun },
    uDepth: { value: null as THREE.Texture | null },
    uFoam: { value: 0 },
    uNear: { value: 0.1 },
    uFar: { value: 200 },
    uRes: { value: new THREE.Vector2(1, 1) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, ...local },
    vertexShader: /* glsl */ `
      uniform float uTime; varying vec3 vW;
      ${WAVE_GLSL}
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        w.y += waveH(w.xz, uTime);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFoam, uNear, uFar, uFogNear, uFogFar;
      uniform vec3 uDeep, uShallow, uSky, uFoamColor, uSun, uLightDir, uFogColor;
      uniform sampler2D uDepth; uniform vec2 uRes;
      varying vec3 vW;
      ${WAVE_GLSL}
      float lin(float d) { float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
      void main() {
        float e = 0.05;
        float hx = (waveH(vW.xz + vec2(e, 0.0), uTime) - waveH(vW.xz - vec2(e, 0.0), uTime)) / (2.0 * e);
        float hz = (waveH(vW.xz + vec2(0.0, e), uTime) - waveH(vW.xz - vec2(0.0, e), uTime)) / (2.0 * e);
        vec3 n = normalize(vec3(-hx, 1.0, -hz));
        vec3 v = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 col = mix(mix(uDeep, uShallow, 0.3), uSky, clamp(fres * 0.85 + 0.08, 0.0, 1.0));
        col += uSun * pow(max(dot(reflect(-uLightDir, n), v), 0.0), 80.0) * 0.7;
        if (uFoam > 0.5) {
          vec2 uv = gl_FragCoord.xy / uRes;
          float diff = lin(texture2D(uDepth, uv).x) - lin(gl_FragCoord.z);
          float wob = 0.5 + 0.5 * sin(vW.x * 6.0 + uTime * 2.0) * sin(vW.z * 5.0 - uTime * 1.7);
          float foam = (1.0 - smoothstep(0.0, 0.32 + 0.12 * wob, diff));
          col = mix(col, uFoamColor, foam * 0.85);
        }
        float f = smoothstep(uFogNear, uFogFar, length(cameraPosition - vW));
        gl_FragColor = vec4(mix(col, uFogColor, f), 1.0);
        #include <colorspace_fragment>
      }`,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 240, q.waterSegments, q.waterSegments), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = waterY;
  let depthTarget: THREE.WebGLRenderTarget | null = null;

  function makeTarget(w: number, h: number, pr: number): THREE.WebGLRenderTarget {
    const rt = new THREE.WebGLRenderTarget(Math.floor(w * pr), Math.floor(h * pr));
    rt.depthTexture = new THREE.DepthTexture(Math.floor(w * pr), Math.floor(h * pr));
    return rt;
  }
  return {
    mesh,
    get depthTarget() {
      return depthTarget;
    },
    setFoam(on: boolean, w: number, h: number, pr: number) {
      depthTarget?.dispose();
      depthTarget = on ? makeTarget(w, h, pr) : null;
      local.uFoam.value = on ? 1 : 0;
      local.uDepth.value = depthTarget?.depthTexture ?? null;
      local.uRes.value.set(Math.floor(w * pr), Math.floor(h * pr));
    },
    resize(w: number, h: number, pr: number) {
      local.uRes.value.set(Math.floor(w * pr), Math.floor(h * pr));
      if (depthTarget) {
        depthTarget.setSize(Math.floor(w * pr), Math.floor(h * pr));
        local.uDepth.value = depthTarget.depthTexture;
      }
    },
    setCamera(cam: THREE.PerspectiveCamera) {
      local.uNear.value = cam.near;
      local.uFar.value = cam.far;
    },
  };
}
```

- [ ] **Step 2: Implement** `src/render/catModel.ts`, Meascat built in code. Original design: ginger, a white chest and one white front-left sock.

```ts
import * as THREE from 'three';
import type { CatPose } from '../core/catPose';
import { painterlyMaterial } from './painterly';

const GINGER = '#e08a3c';
const CREAM = '#f4ead8';
const DARK = '#2b2420';

export function buildCat(): { root: THREE.Group; apply(p: CatPose): void } {
  const root = new THREE.Group();
  const ginger = painterlyMaterial(GINGER);
  const cream = painterlyMaterial(CREAM);
  const dark = painterlyMaterial(DARK);
  const sphere = new THREE.SphereGeometry(1, 16, 12);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);
  const body = new THREE.Mesh(sphere, ginger);
  body.scale.set(0.15, 0.14, 0.26);
  body.position.set(0, 0.24, 0);
  bodyPivot.add(body);
  const chest = new THREE.Mesh(sphere, cream);
  chest.scale.set(0.1, 0.1, 0.07);
  chest.position.set(0, 0.22, 0.2);
  bodyPivot.add(chest);
  const head = new THREE.Mesh(sphere, ginger);
  head.scale.setScalar(0.13);
  head.position.set(0, 0.37, 0.28);
  bodyPivot.add(head);
  const muzzle = new THREE.Mesh(sphere, cream);
  muzzle.scale.set(0.06, 0.045, 0.05);
  muzzle.position.set(0, 0.34, 0.39);
  bodyPivot.add(muzzle);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), ginger);
    ear.position.set(sx * 0.07, 0.49, 0.26);
    ear.rotation.z = -sx * 0.25;
    bodyPivot.add(ear);
    const eye = new THREE.Mesh(sphere, dark);
    eye.scale.setScalar(0.018);
    eye.position.set(sx * 0.05, 0.39, 0.395);
    bodyPivot.add(eye);
  }

  const legGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.2, 8);
  const sockGeo = new THREE.CylinderGeometry(0.033, 0.03, 0.06, 8);
  const legs: THREE.Group[] = [];
  const hips: [number, number][] = [
    [0.08, 0.15], // front-left
    [-0.08, 0.15], // front-right
    [0.08, -0.15], // back-left
    [-0.08, -0.15], // back-right
  ];
  hips.forEach(([x, z], i) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.2, z);
    const leg = new THREE.Mesh(legGeo, ginger);
    leg.position.y = -0.1;
    pivot.add(leg);
    if (i === 0) {
      const sock = new THREE.Mesh(sockGeo, cream);
      sock.position.y = -0.17;
      pivot.add(sock);
    }
    bodyPivot.add(pivot);
    legs.push(pivot);
  });

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.28, -0.24);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.3, 8), ginger);
  tail.position.y = 0.15;
  tailPivot.add(tail);
  bodyPivot.add(tailPivot);

  return {
    root,
    apply(p: CatPose) {
      const [fl, fr, bl, br] = legs;
      fl!.rotation.x = p.legFL;
      fr!.rotation.x = p.legFR;
      bl!.rotation.x = p.legBL;
      br!.rotation.x = p.legBR;
      bodyPivot.position.y = p.bob - p.tuck * 0.04;
      tailPivot.rotation.x = -0.9 + p.tail * 0.8;
    },
  };
}
```

- [ ] **Step 3: Type check.**
  - Run: `npx tsc --noEmit && npx vitest run`
  - Expected: no errors, all tests pass. Rendering is checked by eye in Task 11 and by the QA smoke in Task 13.

- [ ] **Step 4: Commit.**

```bash
git add src/render/water.ts src/render/catModel.ts
git commit -m "feat(render): painterly water with waves, fresnel and depth foam; code-built Meascat"
```

---

### Task 11: The game loop

**Files:**
- Create: `src/app/game.ts`
- Modify: `src/main.ts` (replace it entirely)

**Interfaces:**
- Consumes: everything above. `stepFrames`, `STEP`, `initCat`, `stepCat`, `initCam`, `stepCamera`, `toWorldMove`, `KeyboardInput`, `TouchControls`, `initialQuality`, `QUALITY`, `QualityGovernor`, `catPose`, `waveHeight`, `TEST_ISLAND`, `uniforms`, `createSky`, `buildWorld`, `createBlobShadow`, `createSplashRing`, `createWater`, `buildCat`, `groundHeight`, `CAT`.
- Produces:
  - `class Game { constructor(root: HTMLElement, opts: { reduceMotion: boolean; debug: boolean }); start(): void; stop(): void }`
  - In DEV builds only, `window.__meascat`: `{ cat(): CatState; quality(): Quality; teleport(x, y, z): void; fps(): number }`

- [ ] **Step 1: Implement** `src/app/game.ts`:

```ts
import * as THREE from 'three';
import { initCam, stepCamera, toWorldMove, type CamState } from '../core/camera';
import { catPose } from '../core/catPose';
import { groundHeight } from '../core/collision';
import { CAT, initCat, stepCat, type CatState } from '../core/controller';
import { KeyboardInput } from '../core/input';
import { initialQuality, QUALITY, QualityGovernor, type Quality } from '../core/quality';
import { STEP, stepFrames } from '../core/stepper';
import { TEST_ISLAND } from '../content/testIsland';
import { buildCat } from '../render/catModel';
import { uniforms } from '../render/look';
import { createSky } from '../render/sky';
import { createWater } from '../render/water';
import { buildWorld, createBlobShadow, createSplashRing } from '../render/world';
import { TouchControls } from '../ui/touch';
import '../ui/styles.css';

export interface GameOptions {
  reduceMotion: boolean;
  debug: boolean;
}

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  private readonly level = TEST_ISLAND;
  private readonly keyboard = new KeyboardInput(window);
  private readonly touch: TouchControls | null;
  private readonly governor: QualityGovernor;
  private quality: Quality;
  private cat: CatState;
  private cam: CamState;
  private acc = 0;
  private last = 0;
  private time = 0;
  private raf = 0;
  private fps = 60;
  private mouseLook = { dx: 0, dy: 0 };
  private dragging = false;
  private readonly catView = buildCat();
  private readonly shadow = createBlobShadow();
  private readonly splash = createSplashRing();
  private readonly sky = createSky();
  private readonly water: ReturnType<typeof createWater>;
  private readonly debugEl: HTMLElement | null;
  private readonly onResize = () => this.resize();

  constructor(
    private readonly root: HTMLElement,
    private readonly opts: GameOptions,
  ) {
    const coarse = matchMedia('(pointer: coarse)').matches;
    this.quality = initialQuality({ coarsePointer: coarse, cores: navigator.hardwareConcurrency || 4, memoryGB: (navigator as Navigator & { deviceMemory?: number }).deviceMemory });
    this.governor = new QualityGovernor(this.quality);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    root.appendChild(this.renderer.domElement);
    this.touch = coarse ? new TouchControls(root) : null;

    this.scene.add(this.sky, buildWorld(this.level), this.catView.root, this.shadow, this.splash.mesh);
    this.water = createWater(this.level.waterY, QUALITY[this.quality]);
    this.water.setCamera(this.camera);
    this.scene.add(this.water.mesh);

    this.cat = initCat(this.level.spawn);
    this.cam = initCam(this.cat.pos);
    this.debugEl = opts.debug ? Object.assign(document.createElement('div'), { className: 'debug-overlay' }) : null;
    if (this.debugEl) root.appendChild(this.debugEl);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') this.dragging = true;
    });
    window.addEventListener('pointerup', () => (this.dragging = false));
    window.addEventListener('pointermove', (e) => {
      if (this.dragging) {
        this.mouseLook.dx += e.movementX;
        this.mouseLook.dy += e.movementY;
      }
    });
    window.addEventListener('resize', this.onResize);
    this.applyQuality();

    if (import.meta.env.DEV) {
      Object.assign(window, {
        __meascat: {
          cat: () => this.cat,
          quality: () => this.quality,
          fps: () => this.fps,
          teleport: (x: number, y: number, z: number) => (this.cat = { ...this.cat, pos: { x, y, z }, vel: { x: 0, y: 0, z: 0 }, onGround: false }),
        },
      });
    }
  }

  start(): void {
    this.last = performance.now();
    const frame = (now: number) => {
      this.raf = requestAnimationFrame(frame);
      this.tick(now);
    };
    this.raf = requestAnimationFrame(frame);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.keyboard.destroy();
    this.touch?.destroy();
    this.renderer.dispose();
  }

  private applyQuality(): void {
    const q = QUALITY[this.quality];
    uniforms.uFogFar.value = q.fogFar;
    uniforms.uGrain.value = q.grain ? 1 : 0;
    this.resize();
    this.water.setFoam(q.foam, innerWidth, innerHeight, this.renderer.getPixelRatio());
  }

  private resize(): void {
    const q = QUALITY[this.quality];
    const pr = Math.min(window.devicePixelRatio || 1, q.pixelRatioCap);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.water.resize(innerWidth, innerHeight, pr);
  }

  private tick(now: number): void {
    const frameDt = (now - this.last) / 1000;
    this.last = now;
    this.fps = this.fps * 0.95 + (frameDt > 0 ? 1 / frameDt : 60) * 0.05;
    const changed = this.governor.push(frameDt * 1000);
    if (changed) {
      this.quality = changed;
      this.applyQuality();
    }

    const { steps, acc } = stepFrames(this.acc, frameDt);
    this.acc = acc;
    const kb = this.keyboard.axes();
    const tc = this.touch?.axes() ?? { ix: 0, iz: 0 };
    const axes = { ix: kb.ix || tc.ix, iz: kb.iz || tc.iz };
    let jump = this.keyboard.consumeJump() || (this.touch?.consumeJump() ?? false);
    for (let i = 0; i < steps; i++) {
      const move = toWorldMove(axes.ix, axes.iz, this.cam.yaw);
      const r = stepCat(this.cat, { x: move.x, z: move.z, jump }, STEP, this.level);
      jump = false;
      this.cat = r.state;
      if (r.events.includes('splash')) this.splash.play({ x: this.cat.pos.x, y: this.level.waterY, z: this.cat.pos.z });
    }
    this.time += steps * STEP;
    uniforms.uTime.value = this.time;

    const tl = this.touch?.consumeLook() ?? { dx: 0, dy: 0 };
    const look = { dx: this.mouseLook.dx + tl.dx, dy: this.mouseLook.dy + tl.dy };
    this.mouseLook = { dx: 0, dy: 0 };
    const c = stepCamera(this.cam, this.cat.pos, look, { sensitivity: 0.005, reduceMotion: this.opts.reduceMotion, time: this.time }, Math.min(frameDt, 0.1), this.level.boxes);
    this.cam = c.state;
    this.camera.position.set(c.eye.x, c.eye.y, c.eye.z);
    this.camera.lookAt(c.lookAt.x, c.lookAt.y, c.lookAt.z);
    this.sky.position.copy(this.camera.position);

    const p = this.cat.pos;
    this.catView.root.position.set(p.x, p.y, p.z);
    this.catView.root.rotation.y = this.cat.facing;
    this.catView.apply(catPose({ speed: Math.hypot(this.cat.vel.x, this.cat.vel.z), onGround: this.cat.onGround, vy: this.cat.vel.y, t: this.time, splash: this.cat.splash > 0 }));
    const g = groundHeight(this.level.boxes, p.x, p.z, CAT.radius, p.y + 0.01, 0.01);
    this.shadow.visible = g !== null && p.y - g < 3;
    if (g !== null) this.shadow.position.set(p.x, g + 0.01, p.z);
    this.splash.update(Math.min(frameDt, 0.1));

    const dt = this.water.depthTarget;
    if (dt) {
      this.water.mesh.visible = false;
      this.renderer.setRenderTarget(dt);
      this.renderer.render(this.scene, this.camera);
      this.renderer.setRenderTarget(null);
      this.water.mesh.visible = true;
    }
    this.renderer.render(this.scene, this.camera);
    if (this.debugEl) this.debugEl.textContent = `${Math.round(this.fps)} fps · ${this.quality} · ${this.renderer.info.render.calls} draws`;
  }
}
```

- [ ] **Step 2: Replace** `src/main.ts`:

```ts
import { Game } from './app/game';

const params = new URLSearchParams(location.search);
const game = new Game(document.getElementById('app')!, {
  reduceMotion: matchMedia('(prefers-reduced-motion: reduce)').matches || params.has('still'),
  debug: params.has('debug'),
});
game.start();
```

- [ ] **Step 3: Type check, test and build.**
  - Run: `npx tsc --noEmit && npx vitest run && npm run build`
  - Expected: clean. Note the gzip size of the main bundle from the build output; it must be at most 3 MB.

- [ ] **Step 4: Look at it.**
  - Run `npm run dev` and open `http://localhost:5173/?debug`. (When executing headless, take the screenshot in Task 13 instead.)
  - Check that:
    - the warm sky and mist appear;
    - the island and ruins look painted (soft colour steps, rim light);
    - the water moves, with foam where it meets the stones;
    - Meascat (ginger, white chest, one white sock) walks with WASD, jumps with Space, and the camera follows and orbits on mouse drag;
    - walking off the edge splashes, then Meascat reappears on dry ground.

- [ ] **Step 5: Commit.**

```bash
git add src/app/game.ts src/main.ts
git commit -m "feat(app): game loop — input, controller, camera, painterly scene, water foam, quality governor, debug overlay"
```

---

### Task 12: A pure check of the camera and wave sync

**Files:**
- Create: `tests/render/sync.test.ts`

**Interfaces:**
- Consumes: `WAVE`, `waveHeight` (Task 7). It reads `src/render/water.ts` as text.

The GLSL wave function is generated from `WAVE`, so the two can't silently drift apart. This test pins it down.

- [ ] **Step 1: Write the test.**

```ts
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { WAVE } from '../../src/core/waves';

it('the water shader builds its wave function from the same WAVE constants as the CPU waveHeight', () => {
  const src = readFileSync(new URL('../../src/render/water.ts', import.meta.url), 'utf8');
  expect(src).toContain("import { WAVE } from '../core/waves'");
  for (const k of Object.keys(WAVE)) expect(src).toContain(`WAVE.${k}`);
});
```

- [ ] **Step 2: Run it.**
  - Run: `npx vitest run tests/render/sync.test.ts`
  - Expected: PASS straight away, because Task 10 already generates the GLSL from `WAVE`.
  - This is a guard test, not new behaviour. To prove it can fail, temporarily replace one `${WAVE.a1.toFixed(4)}` with a literal number, watch the test fail, then restore it.

- [ ] **Step 3: Commit.**

```bash
git add tests/render/sync.test.ts
git commit -m "test: guard that the water shader and CPU waves share constants"
```

---

### Task 13: Browser QA smoke and performance

**Files:**
- Create: `tools/qa/smoke.mjs`

**Interfaces:**
- Consumes: `window.__meascat` (Task 11, DEV only); the dev server at `http://localhost:5173/`.

- [ ] **Step 1: Write** `tools/qa/smoke.mjs`:

```js
// Browser smoke + performance for Meascat. Needs `npm run dev`. Usage: node tools/qa/smoke.mjs [outDir]
import { chromium, webkit, devices } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const URL = process.env.MEASCAT_URL ?? 'http://localhost:5173/';
const OUT = process.argv[2] ?? 'test-results/qa';
mkdirSync(OUT, { recursive: true });
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const results = [];
const check = (name, ok, note = '') => results.push({ name, ok: !!ok, note });

async function session(label, launch, ctxOpts, mobile) {
  const b = await launch();
  const ctx = await b.newContext(ctxOpts);
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await p.goto(URL + '?debug');
  await p.waitForFunction(() => window.__meascat && document.querySelector('canvas'), null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  const cat = () => p.evaluate(() => window.__meascat.cat());

  const a = await cat();
  check(`${label}: cat spawns on the ground`, a.onGround && a.pos.y > 0.3, JSON.stringify(a.pos));

  if (!mobile) {
    await p.keyboard.down('KeyW');
    await p.waitForTimeout(800);
    await p.keyboard.up('KeyW');
    const b2 = await cat();
    check(`${label}: W walks the cat forward`, Math.hypot(b2.pos.x - a.pos.x, b2.pos.z - a.pos.z) > 1, `${b2.pos.x.toFixed(2)},${b2.pos.z.toFixed(2)}`);
    await p.keyboard.press('Space');
    await p.waitForTimeout(180);
    check(`${label}: Space jumps`, (await cat()).pos.y > b2.pos.y + 0.3);
  } else {
    const vp = p.viewportSize();
    const cdp = await ctx.newCDPSession(p);
    const x = vp.width * 0.25, y = vp.height * 0.7;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= 8; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 10, id: 1 }] });
    await p.waitForTimeout(800);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const b2 = await cat();
    check(`${label}: joystick walks the cat`, Math.hypot(b2.pos.x - a.pos.x, b2.pos.z - a.pos.z) > 0.8);
    await p.tap('.touch-jump');
    await p.waitForTimeout(180);
    check(`${label}: Jump button jumps`, (await cat()).pos.y > b2.pos.y + 0.3);
  }

  // Fall into the water from above the gap east of the island, then respawn on dry ground.
  await p.evaluate(() => window.__meascat.teleport(6.8, 0.9, 0.5));
  await p.waitForTimeout(1600);
  const c = await cat();
  check(`${label}: falling in respawns on dry, supported ground`, c.onGround && c.pos.y > 0.3 && c.splash === 0, JSON.stringify(c.pos));

  // Resize / rotate: the canvas follows, with no errors.
  const vp = p.viewportSize();
  await p.setViewportSize({ width: vp.height, height: vp.width });
  await p.waitForTimeout(500);
  const size = await p.evaluate(() => [document.querySelector('canvas').clientWidth, innerWidth]);
  check(`${label}: canvas follows a resize`, size[0] === size[1]);
  await p.setViewportSize(vp);
  await p.waitForTimeout(800);

  await p.screenshot({ path: `${OUT}/${label.replace(/\W+/g, '-')}.png` });
  check(`${label}: no console errors`, errors.length === 0, errors.join(' | '));
  await b.close();
}

const chrome = () => chromium.launch({ executablePath: CHROME });
await session('chrome-desktop', chrome, { viewport: { width: 1280, height: 800 } }, false);
await session('webkit-desktop', () => webkit.launch(), { viewport: { width: 1280, height: 800 } }, false);
await session('chrome-phone', chrome, { ...devices['Pixel 7'] }, true);

// Performance: phone viewport, CPU throttled 4×, cat walking for 6 s.
{
  const b = await chrome();
  const ctx = await b.newContext({ ...devices['Pixel 7'] });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await p.goto(URL);
  await p.waitForFunction(() => window.__meascat, null, { timeout: 30000 });
  await p.waitForTimeout(2000);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const fps = await p.evaluate(async () => {
    const t = [];
    let last = performance.now();
    await new Promise((res) => {
      const f = (now) => {
        t.push(now - last);
        last = now;
        if (t.length < 360) requestAnimationFrame(f);
        else res();
      };
      requestAnimationFrame(f);
    });
    const avg = t.slice(30).reduce((a, x) => a + x, 0) / (t.length - 30);
    return { fps: Math.round(1000 / avg), quality: window.__meascat.quality() };
  });
  check('phone perf (CPU 4×): at least 45 fps', fps.fps >= 45, `${fps.fps} fps at ${fps.quality}`);
  await b.close();
}

for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.note ? ` (${r.note})` : ''}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run it.**
  - Run `npm run dev` in the background, then `npm run qa:smoke`, then stop the dev server.
  - Expected: every line ✅, ending `N/N passed`, and screenshots in `test-results/qa/`.
- [ ] **Step 3: If a check fails, fix it.**
  - **Game failures:** fix the game with a failing unit test first wherever the cause is in `src/core`.
  - **Perf below 45 fps:** step down the `QUALITY.low` or `QUALITY.medium` numbers and record a ruling.

- [ ] **Step 4: Look at the screenshots** with the Read tool. They should show:
  - the painterly mood (warm sky, mist, soft colour steps);
  - visible foam at the stones (medium or high quality);
  - the cat readable at phone size.

  Fix any visual problem and re-run.

- [ ] **Step 5: Commit.**

```bash
git add tools/qa/smoke.mjs
git commit -m "test(qa): browser smoke + phone performance for M1 (Chromium + WebKit)"
```

---

### Task 14: Publish the M1 preview (ask Ujjwal first)

**Files:** none.

- [ ] **Step 1: Ask Ujjwal before creating anything public.** Confirm:
  - a **public** GitHub repo `Ujjwalkumar-pm/meascat` (same as Afterlife);
  - a Vercel project `meascat` that deploys from `main`.
- [ ] **Step 2: On a yes, create the repo and push.**
  - Run: `gh repo create Ujjwalkumar-pm/meascat --public --source . --remote origin --push`
  - Expected: the repo URL is printed.
- [ ] **Step 3: Create the Vercel project.**
  - Create the Vercel project linked to the GitHub repo, using the Vercel connector's project-creation tool. Team "Ujjwal Kumar"; framework Vite; build `npm run build`; output `dist`.
  - Wait for the production deployment to be READY.
- [ ] **Step 4: Check the live preview.**
  - Load the deployment URL in Chromium and WebKit: the canvas renders and there are no console errors.
  - `window.__meascat` is absent in production. This is expected; the smoke script runs against dev.
- [ ] **Step 5: Report the live URL to Ujjwal.**

---

## Self-review notes

- **Spec coverage (M1 row of spec §13):**

| M1 requirement | Where |
|---|---|
| Project setup | Task 1 |
| Painterly sky, mist and water | Tasks 8, 10 and 11 |
| Meascat moving and jumping on a test island | Tasks 4, 8, 10 and 11 |
| Follow camera | Tasks 6 and 11 |
| Touch controls | Tasks 9 and 11 |
| Quality levels | Tasks 7 and 11 |
| Test and QA harness | Tasks 1–13 (Vitest throughout, Playwright in Task 13) |

- **Other spec points:**
  - Reduce motion (spec §4): Task 6 and `main.ts`.
  - Performance targets (§10): Task 13.
  - Original-art rules (§12): Task 1 README and the code-built cat.
- **Deferred by design to later milestones:**
  - CC0 animal models: M5 art pass. M1 uses a code-built cat, as spec §7 allows.
  - Interact and companion abilities: M2.
  - Title, settings and saving: M3.

  All are listed in the spec's milestone table.
- **Type consistency:** these names are used identically across tasks:
  - `stepCat` / `CatState` / `World`;
  - `stepCamera` returning `{ state, eye, lookAt }`;
  - `QUALITY` / `QualitySettings`;
  - `createWater(...).depthTarget`;
  - `TouchControls.axes` / `consumeLook` / `consumeJump`.
