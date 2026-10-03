/** Keep in sync with WAVE_GLSL in src/render/water.ts. */
export const WAVE = { a1: 0.06, k1: 0.9, w1: 1.1, a2: 0.04, k2: 1.3, w2: 0.8, a3: 0.025, k3: 2.1, w3: 1.7 } as const;
export function waveHeight(x: number, z: number, t: number): number {
  return WAVE.a1 * Math.sin(x * WAVE.k1 + t * WAVE.w1) + WAVE.a2 * Math.sin(z * WAVE.k2 - t * WAVE.w2) + WAVE.a3 * Math.sin((x + z) * WAVE.k3 + t * WAVE.w3);
}
