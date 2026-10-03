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
    if (k.metaKey || k.ctrlKey || k.altKey) return; // leave browser shortcuts alone (and never get stuck walking)
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
