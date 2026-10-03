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
