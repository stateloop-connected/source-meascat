import * as THREE from 'three';
import type { Level } from '../content/testIsland';
import type { Vec3 } from '../core/vec';
import { painterlyMaterial } from './painterly';

export function buildWorld(level: Level): THREE.Group {
  const g = new THREE.Group();
  const cache = new Map<string, THREE.ShaderMaterial>();
  for (const b of level.boxes) {
    const mat = cache.get(b.color) ?? painterlyMaterial(b.color);
    cache.set(b.color, mat);
    const size = new THREE.Vector3(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
    const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
    m.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
    g.add(m);
  }
  return g;
}

/** A soft dark disc under the cat (cheaper than real shadows; works on every device). */
export function createBlobShadow(): THREE.Mesh {
  const tex = new THREE.CanvasTexture(
    (() => {
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const ctx = c.getContext('2d')!;
      const grd = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
      grd.addColorStop(0, 'rgba(30,25,20,0.55)');
      grd.addColorStop(1, 'rgba(30,25,20,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 64, 64);
      return c;
    })(),
  );
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** An expanding ring on the water when Meascat falls in. */
export function createSplashRing(): { mesh: THREE.Mesh; play(at: Vec3): void; update(dt: number): void } {
  const mat = new THREE.MeshBasicMaterial({ color: '#f6efe1', transparent: true, opacity: 0, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.32, 32), mat);
  mesh.rotation.x = -Math.PI / 2;
  let t = 1;
  return {
    mesh,
    play(at) {
      mesh.position.set(at.x, at.y + 0.02, at.z);
      t = 0;
    },
    update(dt) {
      t = Math.min(1, t + dt / 0.8);
      const s = 1 + t * 3;
      mesh.scale.set(s, s, s);
      mat.opacity = 0.8 * (1 - t);
    },
  };
}
