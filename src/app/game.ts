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
import { frameJumps, lerpVec } from './frame';

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
  private prevPos = { x: 0, y: 0, z: 0 };
  private pendingJump = false;
  private renderTime = 0;
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
    const coarse = matchMedia('(any-pointer: coarse)').matches;
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
    this.prevPos = { ...this.cat.pos };
    this.cam = initCam(this.cat.pos);
    this.debugEl = opts.debug ? Object.assign(document.createElement('div'), { className: 'debug-overlay' }) : null;
    if (this.debugEl) root.appendChild(this.debugEl);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button === 0) this.dragging = true;
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('pointerup', () => (this.dragging = false));
    window.addEventListener('blur', () => (this.dragging = false));
    document.addEventListener('visibilitychange', () => {
      // Coming back to the tab: don't count the time away as one giant, slow frame.
      this.last = performance.now();
      this.governor.reset();
    });
    window.addEventListener('pointermove', (e) => {
      if (this.dragging && (e.buttons & 1) === 0) this.dragging = false;
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
          teleport: (x: number, y: number, z: number) => {
            this.cat = { ...this.cat, pos: { x, y, z }, vel: { x: 0, y: 0, z: 0 }, onGround: false };
            this.prevPos = { x, y, z };
          },
          view: () => ({ aspect: this.camera.aspect, cssW: innerWidth, cssH: innerHeight, bufferW: this.renderer.domElement.width, pr: this.renderer.getPixelRatio(), depthW: this.water.depthTarget?.width ?? null }),
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
    const frameDt = Math.max(0, (now - this.last) / 1000);
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
    const pressed = this.keyboard.consumeJump() || (this.touch?.consumeJump() ?? false);
    const fj = frameJumps(this.pendingJump, pressed, steps);
    this.pendingJump = fj.pending;
    for (let i = 0; i < steps; i++) {
      const move = toWorldMove(axes.ix, axes.iz, this.cam.yaw);
      this.prevPos = { ...this.cat.pos };
      const r = stepCat(this.cat, { x: move.x, z: move.z, jump: fj.jumps[i]! }, STEP, this.level);
      this.cat = r.state;
      if (r.events.includes('respawn')) this.prevPos = { ...this.cat.pos }; // no streak across the respawn jump
      if (r.events.includes('splash')) this.splash.play({ x: this.cat.pos.x, y: this.level.waterY, z: this.cat.pos.z });
    }
    this.time += steps * STEP;
    // Draw smoothly between physics steps (fast displays), and animate water and sway by real time.
    this.renderTime += Math.min(frameDt, 0.1);
    uniforms.uTime.value = this.renderTime;
    const drawPos = lerpVec(this.prevPos, this.cat.pos, this.acc / STEP);

    const tl = this.touch?.consumeLook() ?? { dx: 0, dy: 0 };
    const look = { dx: this.mouseLook.dx + tl.dx, dy: this.mouseLook.dy + tl.dy };
    this.mouseLook = { dx: 0, dy: 0 };
    const c = stepCamera(this.cam, drawPos, look, { sensitivity: 0.005, reduceMotion: this.opts.reduceMotion, time: this.renderTime }, Math.min(frameDt, 0.1), this.level.boxes);
    this.cam = c.state;
    this.camera.position.set(c.eye.x, c.eye.y, c.eye.z);
    this.camera.lookAt(c.lookAt.x, c.lookAt.y, c.lookAt.z);
    this.sky.position.copy(this.camera.position);

    const p = drawPos;
    this.catView.root.position.set(p.x, p.y, p.z);
    this.catView.root.rotation.y = this.cat.facing;
    this.catView.apply(catPose({ speed: Math.hypot(this.cat.vel.x, this.cat.vel.z), onGround: this.cat.onGround, vy: this.cat.vel.y, t: this.renderTime, splash: this.cat.splash > 0 }));
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
