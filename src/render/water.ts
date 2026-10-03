import * as THREE from 'three';
import type { QualitySettings } from '../core/quality';
import { WAVE } from '../core/waves';
import { LOOK, uniforms } from './look';

const WAVE_GLSL = /* glsl */ `
float waveH(vec2 p, float t) {
  return ${WAVE.a1.toFixed(4)} * sin(p.x * ${WAVE.k1.toFixed(4)} + t * ${WAVE.w1.toFixed(4)})
       + ${WAVE.a2.toFixed(4)} * sin(p.y * ${WAVE.k2.toFixed(4)} - t * ${WAVE.w2.toFixed(4)})
       + ${WAVE.a3.toFixed(4)} * sin((p.x + p.y) * ${WAVE.k3.toFixed(4)} + t * ${WAVE.w3.toFixed(4)});
}`;

export function createWater(waterY: number, q: QualitySettings) {
  const local = {
    uDeep: { value: LOOK.waterDeep },
    uShallow: { value: LOOK.waterShallow },
    uSky: { value: LOOK.skyHorizon },
    uFoamColor: { value: LOOK.foam },
    uSun: { value: LOOK.sun },
    uDepth: { value: null as THREE.Texture | null },
    uFoam: { value: 0 },
    uNear: { value: 0.1 },
    uFar: { value: 200 },
    uRes: { value: new THREE.Vector2(1, 1) },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, ...local },
    vertexShader: /* glsl */ `
      uniform float uTime; varying vec3 vW;
      ${WAVE_GLSL}
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        w.y += waveH(w.xz, uTime);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uFoam, uNear, uFar, uFogNear, uFogFar;
      uniform vec3 uDeep, uShallow, uSky, uFoamColor, uSun, uLightDir, uFogColor;
      uniform sampler2D uDepth; uniform vec2 uRes;
      varying vec3 vW;
      ${WAVE_GLSL}
      float lin(float d) { float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
      void main() {
        float e = 0.05;
        float hx = (waveH(vW.xz + vec2(e, 0.0), uTime) - waveH(vW.xz - vec2(e, 0.0), uTime)) / (2.0 * e);
        float hz = (waveH(vW.xz + vec2(0.0, e), uTime) - waveH(vW.xz - vec2(0.0, e), uTime)) / (2.0 * e);
        vec3 n = normalize(vec3(-hx, 1.0, -hz));
        vec3 v = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 col = mix(mix(uDeep, uShallow, 0.3), uSky, clamp(fres * 0.85 + 0.08, 0.0, 1.0));
        col += uSun * pow(max(dot(reflect(-uLightDir, n), v), 0.0), 80.0) * 0.7;
        if (uFoam > 0.5) {
          vec2 uv = gl_FragCoord.xy / uRes;
          float diff = lin(texture2D(uDepth, uv).x) - lin(gl_FragCoord.z);
          float wob = 0.5 + 0.5 * sin(vW.x * 6.0 + uTime * 2.0) * sin(vW.z * 5.0 - uTime * 1.7);
          float foam = (1.0 - smoothstep(0.0, 0.32 + 0.12 * wob, diff));
          col = mix(col, uFoamColor, foam * 0.85);
        }
        float fd = max(length(cameraPosition - vW) - uFogNear, 0.0) / max(uFogFar - uFogNear, 0.001);
  float f = 1.0 - exp(-fd * fd * 3.0); // exponential mist
        gl_FragColor = vec4(mix(col, uFogColor, f), 1.0);
        #include <colorspace_fragment>
      }`,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(240, 240, q.waterSegments, q.waterSegments), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = waterY;
  let depthTarget: THREE.WebGLRenderTarget | null = null;

  function makeTarget(w: number, h: number, pr: number): THREE.WebGLRenderTarget {
    const rt = new THREE.WebGLRenderTarget(Math.floor(w * pr), Math.floor(h * pr));
    rt.depthTexture = new THREE.DepthTexture(Math.floor(w * pr), Math.floor(h * pr));
    return rt;
  }
  return {
    mesh,
    get depthTarget() {
      return depthTarget;
    },
    setFoam(on: boolean, w: number, h: number, pr: number) {
      depthTarget?.dispose();
      depthTarget = on ? makeTarget(w, h, pr) : null;
      local.uFoam.value = on ? 1 : 0;
      local.uDepth.value = depthTarget?.depthTexture ?? null;
      local.uRes.value.set(Math.floor(w * pr), Math.floor(h * pr));
    },
    resize(w: number, h: number, pr: number) {
      local.uRes.value.set(Math.floor(w * pr), Math.floor(h * pr));
      if (depthTarget) {
        depthTarget.setSize(Math.floor(w * pr), Math.floor(h * pr));
        local.uDepth.value = depthTarget.depthTexture;
      }
    },
    setCamera(cam: THREE.PerspectiveCamera) {
      local.uNear.value = cam.near;
      local.uFar.value = cam.far;
    },
  };
}
