export const STEP = 1 / 60;

/** Fixed-timestep accumulator. Long frame gaps are capped, so physics never runs more than `maxSteps` at once. */
export function stepFrames(acc: number, frameDt: number, step = STEP, maxSteps = 5): { steps: number; acc: number } {
  const dt = Number.isFinite(frameDt) && frameDt > 0 ? Math.min(frameDt, step * maxSteps) : 0;
  const total = acc + dt;
  const steps = Math.min(maxSteps, Math.floor(total / step + 1e-9));
  return { steps, acc: Math.min(total - steps * step, step * 0.999) };
}
