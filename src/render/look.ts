import * as THREE from 'three';

/** One palette and light for the whole scene: warm afternoon. */
export const LOOK = {
  skyTop: new THREE.Color('#f1c28e'),
  skyHorizon: new THREE.Color('#ead8bf'),
  skyBottom: new THREE.Color('#9fb8b6'),
  sun: new THREE.Color('#fff2d6'),
  light: new THREE.Color('#ffe0b5'),
  ambient: new THREE.Color('#71808a'),
  rim: new THREE.Color('#ffd6a0'),
  waterDeep: new THREE.Color('#2f5d66'),
  waterShallow: new THREE.Color('#7fa8a6'),
  foam: new THREE.Color('#f6efe1'),
  lightDir: new THREE.Vector3(-0.55, 0.72, 0.42).normalize(),
};

/** Shared by every material, so lighting and fog change everywhere at once. */
export const uniforms = {
  uLightDir: { value: LOOK.lightDir },
  uLightColor: { value: LOOK.light },
  uAmbient: { value: LOOK.ambient },
  uRim: { value: LOOK.rim },
  uFogColor: { value: LOOK.skyHorizon },
  uFogNear: { value: 10 },
  uFogFar: { value: 70 },
  uGrain: { value: 1 },
  uTime: { value: 0 },
};
