import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('hashed build files are cached for a year; the page itself always revalidates', () => {
  const cfg = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8')) as { headers?: { source: string; headers: { key: string; value: string }[] }[] };
  const rule = cfg.headers?.find((h) => h.source === '/assets/(.*)')?.headers.find((x) => x.key.toLowerCase() === 'cache-control')?.value;
  expect(rule).toBe('public, max-age=31536000, immutable');
  expect(cfg.headers?.some((h) => h.source === '/')).toBe(false);
});
