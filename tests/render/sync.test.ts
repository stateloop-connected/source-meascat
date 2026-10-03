import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { WAVE } from '../../src/core/waves';

it('the water shader builds its wave function from the same WAVE constants as the CPU waveHeight', () => {
  const src = readFileSync(new URL('../../src/render/water.ts', import.meta.url), 'utf8');
  expect(src).toContain("import { WAVE } from '../core/waves'");
  for (const k of Object.keys(WAVE)) expect(src).toContain(`WAVE.${k}`);
});
