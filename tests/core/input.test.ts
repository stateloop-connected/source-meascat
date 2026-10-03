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
  it('ignores keys pressed with Cmd/Ctrl/Alt (no stuck walking after a shortcut)', () => {
    const kb = new KeyboardInput(window);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', metaKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', ctrlKey: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', altKey: true }));
    expect(kb.axes()).toEqual({ ix: 0, iz: 0 });
    expect(kb.consumeJump()).toBe(false);
    kb.destroy();
  });
});
