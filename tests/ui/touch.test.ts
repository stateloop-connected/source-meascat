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
