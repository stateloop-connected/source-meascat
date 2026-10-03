import * as THREE from 'three';
import { LOOK } from './look';

/** A large dome that follows the camera: horizon to top gradient, plus a soft sun glow. */
export function createSky(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { uTop: { value: LOOK.skyTop }, uHorizon: { value: LOOK.skyHorizon }, uBottom: { value: LOOK.skyBottom }, uSun: { value: LOOK.sun }, uLightDir: { value: LOOK.lightDir } },
    vertexShader: /* glsl */ `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uHorizon, uBottom, uSun, uLightDir; varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 col = h > 0.0 ? mix(uHorizon, uTop, pow(h, 0.6)) : mix(uHorizon, uBottom, pow(-h, 0.5));
        float s = max(dot(vDir, normalize(uLightDir)), 0.0);
        col += uSun * (pow(s, 64.0) * 0.9 + pow(s, 6.0) * 0.25);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), mat);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  return sky;
}
