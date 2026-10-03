import * as THREE from 'three';
import type { CatPose } from '../core/catPose';
import { painterlyMaterial } from './painterly';

const GINGER = '#e08a3c';
const CREAM = '#f4ead8';
const DARK = '#2b2420';

export function buildCat(): { root: THREE.Group; apply(p: CatPose): void } {
  const root = new THREE.Group();
  const ginger = painterlyMaterial(GINGER);
  const cream = painterlyMaterial(CREAM);
  const dark = painterlyMaterial(DARK);
  const sphere = new THREE.SphereGeometry(1, 16, 12);

  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);
  const body = new THREE.Mesh(sphere, ginger);
  body.scale.set(0.15, 0.14, 0.26);
  body.position.set(0, 0.24, 0);
  bodyPivot.add(body);
  const chest = new THREE.Mesh(sphere, cream);
  chest.scale.set(0.1, 0.1, 0.07);
  chest.position.set(0, 0.22, 0.2);
  bodyPivot.add(chest);
  const head = new THREE.Mesh(sphere, ginger);
  head.scale.setScalar(0.13);
  head.position.set(0, 0.37, 0.28);
  bodyPivot.add(head);
  const muzzle = new THREE.Mesh(sphere, cream);
  muzzle.scale.set(0.06, 0.045, 0.05);
  muzzle.position.set(0, 0.34, 0.39);
  bodyPivot.add(muzzle);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.1, 4), ginger);
    ear.position.set(sx * 0.07, 0.49, 0.26);
    ear.rotation.z = -sx * 0.25;
    bodyPivot.add(ear);
    const eye = new THREE.Mesh(sphere, dark);
    eye.scale.setScalar(0.018);
    eye.position.set(sx * 0.05, 0.39, 0.395);
    bodyPivot.add(eye);
  }

  const legGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.2, 8);
  const sockGeo = new THREE.CylinderGeometry(0.033, 0.03, 0.06, 8);
  const legs: THREE.Group[] = [];
  const hips: [number, number][] = [
    [0.08, 0.15], // front-left
    [-0.08, 0.15], // front-right
    [0.08, -0.15], // back-left
    [-0.08, -0.15], // back-right
  ];
  hips.forEach(([x, z], i) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, 0.2, z);
    const leg = new THREE.Mesh(legGeo, ginger);
    leg.position.y = -0.1;
    pivot.add(leg);
    if (i === 0) {
      const sock = new THREE.Mesh(sockGeo, cream);
      sock.position.y = -0.17;
      pivot.add(sock);
    }
    bodyPivot.add(pivot);
    legs.push(pivot);
  });

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.28, -0.24);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.3, 8), ginger);
  tail.position.y = 0.15;
  tailPivot.add(tail);
  bodyPivot.add(tailPivot);

  return {
    root,
    apply(p: CatPose) {
      const [fl, fr, bl, br] = legs;
      fl!.rotation.x = p.legFL;
      fr!.rotation.x = p.legFR;
      bl!.rotation.x = p.legBL;
      br!.rotation.x = p.legBR;
      bodyPivot.position.y = p.bob - p.tuck * 0.04;
      tailPivot.rotation.x = -0.9 + p.tail * 0.8;
    },
  };
}
