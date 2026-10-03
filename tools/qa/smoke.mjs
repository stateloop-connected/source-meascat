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
